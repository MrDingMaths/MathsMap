// Source-reviewed feedback maintenance. Dry-run first; never infer deletions from a cloze alone.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {normaliseDiagramColours} from './normalise-diagram-colours.mjs';
import {revisionHash} from './bank-sync.mjs';
import {reconcileSyncLayout} from '../../src/lib/question-sync-layout.js';
import {arrangementCatalog,resolveArrangement} from '../../src/lib/booklet-arrangement.js';
import {reconcileFeedback} from '../../src/lib/booklet-feedback.js';

export const RESPONSE_BLOCKS = Object.freeze([
  'p4-q1-block','p4-q2-block','p4-q3-block','p4-q4-block','p4-q5-block','p4-q6-block',
  'p7-q4','p7-q5','p14-q13','p14-q15','p14-q16',
]);
// These dividers separate worked demonstrations, covered by the user's solution exception.
export const SOLUTION_RULE_GROUPS = Object.freeze([
  'p23-example-paired:examples','p33-activity:examples','p36-example:examples',
]);
const evidence='booklets/provenance/probability-v1/response-layout-feedback.md';
const clozeOnly=p=>p.type==='paragraph'&&p.inlines?.some(i=>i.type==='cloze')&&p.inlines.every(i=>i.type==='cloze'||i.type==='break'||i.type==='text'&&!i.text.trim());

// Called only for independently reviewed open-response prompts. Tables, nested
// scaffolds, inline completions and a lone blank without a prompt are untouched.
export function removeAppendedClozes(document){
  if(document?.format!=='maths-editor-document-v1')return 0;
  let count=0;
  document.blocks=document.blocks.filter((p,index,blocks)=>{
    if(index>0&&clozeOnly(p)&&blocks.slice(0,index).some(b=>b.type==='paragraph'&&b.inlines?.some(i=>i.type==='text'&&i.text.trim()||i.type==='math'))){
      count+=p.inlines.filter(i=>i.type==='cloze').length;return false;
    }
    if(p.type==='paragraph'){
      const lastBreak=p.inlines?.findLastIndex(i=>i.type==='break')??-1;
      if(lastBreak>0&&p.inlines.slice(0,lastBreak).some(i=>i.type==='text'&&i.text.trim())&&clozeOnly({...p,inlines:p.inlines.slice(lastBreak+1)})){
        count+=p.inlines.slice(lastBreak+1).filter(i=>i.type==='cloze').length;
        p.inlines=p.inlines.slice(0,lastBreak);
        while(p.inlines.at(-1)?.type==='break')p.inlines.pop();
      }
    }
    return true;
  });
  return count;
}
function visitGroups(n,fn){if(!n)return;if(n.type==='group')fn(n);n.children?.forEach(c=>visitGroups(c,fn));}

export function repairProbabilityResponseLayout(project){
  if(project.id!=='probability-v1'||!project.sections)return {next:project,records:[]};
  const next=structuredClone(project),records=[];
  for(const [si,s] of next.sections.entries())for(const [bi,b] of s.blocks.entries()){
    const before=structuredClone(b),changedResponses=[];let clozes=0;const rules=new Set();
    if(RESPONSE_BLOCKS.includes(b.id)){
      const visit=n=>{
        const removed=removeAppendedClozes(n.prompt);
        if(removed){
          clozes+=removed;changedResponses.push(n.id);
          if(n.responseSpace==='scaffold')delete n.responseSpace;
          // Retain existing explicit working areas (p14 Q13/Q15); do not create new ones.
          assert.ok(Number.isFinite(n.answerSpaceMm),'Review response spacing for '+n.id);
        }
        n.children?.forEach(visit);
      };visit(b.content);
    }
    const active=next.settings?.layoutOverrides?.blockLayouts?.[b.id];
    const holders=[active,b.presentation?.layoutOverrides?.blockLayouts?.[b.id],b.presentation?.arrangement?b.presentation:null];
    const priorMissing=new Map(holders.filter(h=>h?.arrangement).map(h=>[h,resolveArrangement(before,h.arrangement).missing]));
    for(const holder of holders){
      if(clozes&&holder?.arrangement){
        // Older local presentation copies can still point at the entire native
        // prompt. Expand that known alias before the ordinary sync reconciler.
        const catalog=arrangementCatalog(before);
        visitGroups(holder.arrangement.root,n=>{n.children=n.children.flatMap(c=>{
          if(c.type!=='item'||catalog.entries.has(c.ref))return [c];
          const matches=[...catalog.entries.keys()].filter(ref=>ref.startsWith(c.ref+'#'));
          return matches.length?matches.map((ref,i)=>({...c,id:i?`${c.id}:${ref}`:c.id,ref})):[c];
        });});
      }
      visitGroups(holder?.arrangement?.root,n=>{
        if(n.rules==='internal'&&!SOLUTION_RULE_GROUPS.includes(n.id)){rules.add(n.id);delete n.rules;}
      });
      if(clozes)reconcileSyncLayout(before,b,holder);
    }
    if(!clozes&&!rules.size)continue;
    if(b.sourceReview){
      for(const r of b.sourceReview.responses??[])if(changedResponses.includes(r.targetId))r.kind='short';
      b.sourceReview.arrangementOverride=structuredClone(active?.arrangement??null);
      b.sourceReview.feedbackCorrections={...b.sourceReview.feedbackCorrections,responseLayout:{
        evidence,clozeTargets:changedResponses,removedRuleGroups:[...rules],
        reason:'User feedback: compact open-response prompts; borderless question-part arrangements. Original source observations retained in sourceLayoutEvidence.',
      }};
      if(b.sourceReview.verification)b.sourceReview.verification.checked=false;
      if(b.sourceReview.visualAudit)b.sourceReview.visualAudit.checked=false;
    }
    for(const holder of holders)if(holder?.arrangement)assert.deepEqual(resolveArrangement(b,holder.arrangement).missing,holder===active||clozes?[]:priorMissing.get(holder),'New dangling layout after '+b.id);
    records.push({id:b.id,location:`/sections/${si}/blocks/${bi}`,clozes,clozeTargets:changedResponses,removedRuleGroups:[...rules],before:revisionHash(before),after:revisionHash(b)});
  }
  return {next:reconcileFeedback(project,next),records};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const out='.booklet-work/probability-feedback-r39',startedAt=new Date().toISOString();
  await fs.mkdir(out,{recursive:true});
  const file='booklets/projects/probability-v1.json',raw=await fs.readFile(file,'utf8'),project=JSON.parse(raw);
  await fs.writeFile(`${out}/original-r${project.revision}.json`,raw,{flag:'wx'}).catch(e=>{if(e.code!=='EEXIST')throw e;});
  const {next,records}=repairProbabilityResponseLayout(project);
  await fs.writeFile(out+'/candidate.json',JSON.stringify(next,null,2)+'\n');
  const report=await normaliseDiagramColours({apply:process.argv.includes('--apply'),migrate:repairProbabilityResponseLayout,policy:'Reviewed Probability r39 response layout feedback'});
  await fs.writeFile(out+(report.applied?'/applied.json':'/dry-run.json'),JSON.stringify({startedAt,finishedAt:new Date().toISOString(),inputRevision:project.revision,...report},null,2)+'\n');
  console.log(JSON.stringify({applied:report.applied,files:report.files,blocks:records.length,clozes:records.reduce((n,r)=>n+r.clozes,0),ruleGroups:records.reduce((n,r)=>n+r.removedRuleGroups.length,0)}));
}
