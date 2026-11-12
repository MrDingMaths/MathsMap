// Follow-up merges for the bank import pipeline (docs/booklet-bank-import-pipeline.md, Decision 5; James,
// 11 November 2026). A practice question whose wording points back at the question before it cannot enter the
// bank on its own. One Sol low call per booklet sees each candidate beside the question it points to and returns:
//   merge        the follow-up needs that question's task or result: it becomes the next run of parts of that
//                question (one label sequence, both answers and response spaces kept), and the follow-up block goes;
//   embed        it needs only a given (a value, expression, graph or table) it can state itself: its stem is
//                rewritten to carry exactly that given, and nothing else changes;
//   independent  it refers to a method only and already has every given: nothing changes but a recorded review.
// Merged or embedded questions are re-rated by one Sol low call. Never saves: the runner saves the candidate once,
// revision-checked. Teacher-protected blocks are never edited here (the planner routes them to a Studio comment).
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {dependencySignature,promptText} from '../src/lib/booklet-question-dependencies.js';
import {REASONING_PROMPT,assessedRating} from '../scripts/booklet/reasoning-ratings.mjs';
import {reviewConfiguration} from '../scripts/booklet/transcription-settings.mjs';
import {studentView} from './audit-v2.mjs';
import {contentFingerprint} from './audit-v2-plan.mjs';
import {difficultyBandForScore} from '../src/lib/practice-question-model.js';
import {anchorsFor,codexBinary} from './exam-batch.mjs';

export const JUDGE={model:'gpt-6.1-sol',effort:'low'};
// Explicit, never an automatic fallback (AGENTS.md: a Sol low fallback must be explicit).
export const judgeConfiguration=()=>reviewConfiguration({reviewFallback:{model:JUDGE.model,effort:JUDGE.effort,reason:'Bank import pipeline (James, 11 November 2026): the follow-up judge and re-rating use Sol 6.1 low'}});
const sha=v=>createHash('sha256').update(v).digest('hex');
const write=(f,v)=>{fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof v==='string'?v:JSON.stringify(v,null,1)+'\n');};
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const LETTERS='abcdefghijklmnopqrstuvwxyz';
const isLetter=label=>typeof label==='string'&&/^[a-z]$/.test(label.trim());

export function judgePrompt(project,pairs){
 const items=pairs.map(({followUp,previous,references})=>({id:followUp.id,references,previousQuestion:studentView(previous),followUp:studentView(followUp)}));
 return `Do not run any commands or open files: everything you need is in this message.
You are checking practice questions from the MathsMap booklet "${project.title}" before they enter a question bank, where each question is drawn on its own, without the questions around it.
Each item is a question ("followUp") whose wording points back at the question printed just before it ("previousQuestion"); "references" quotes the words that do so.
Decide for each item:
- "merge": the follow-up needs the previous question's task, working or result (for example "use your answers to the previous question", "hence"), or reads as its continuation. It will become further parts of the previous question.
- "embed": the follow-up needs only a given that the previous question states (a value, expression, equation, graph description or table) and is otherwise a separate task. Give "prompt": the follow-up's new instruction, in the booklet's style, keeping its own words and stating that given exactly (copy LaTeX exactly, in $...$). Do not add hints or change the task.
- "independent": the follow-up refers to a method or technique only (for example "use the techniques of the previous questions") and already carries every given it needs. Nothing changes.
Prefer "merge" over "embed" when either would do, and "independent" when no given or result is needed.
Give "note": one or two sentences saying what the follow-up needs from the previous question, or why it needs nothing (at least 20 characters).
Items: ${JSON.stringify(items)}
Reply with ONLY JSON: {"items": [{"id": "...", "decision": "merge|embed|independent", "note": "...", "prompt": "only for embed"}]}`;
}
export function validJudgement(result,ids){
 const items=result?.items;
 return Array.isArray(items)&&items.length===ids.size&&items.every(i=>ids.has(i.id)&&['merge','embed','independent'].includes(i.decision)&&String(i.note??'').trim().length>=20&&(i.decision!=='embed'||String(i.prompt??'').trim().length>0));
}

// The follow-up's parts continue the previous question's letters in one sequence. Returns {content, labels} or
// {manual} when the structure cannot be joined safely (no lettered parts, part references in the wording, >26).
export function mergedContent(previous,followUp){
 const p=previous.content,f=followUp.content;
 if(p?.type!=='question'||f?.type!=='question')return {manual:'not a whole question'};
 const runOf=root=>{const kids=root.children??[];if(kids.length&&kids.every(k=>k.type==='group'&&!String(k.label??'').trim()&&(k.children??[]).every(c=>isLetter(c.label))))return kids.flatMap(k=>k.children);return kids;};
 const pParts=runOf(p),fParts=runOf(f);
 if(!pParts.length||!fParts.length||![...pParts,...fParts].every(c=>isLetter(c.label)))return {manual:'parts are not one lettered run'};
 if(pParts.length+fParts.length>26)return {manual:'more than 26 parts'};
 if(/\bparts?\s*\(?[a-z]\)?\b/i.test(promptText(f.prompt)+' '+fParts.map(c=>promptText(c.prompt)).join(' ')))return {manual:'the follow-up names a part'};
 const start=pParts.length,labels={};
 const relabel=(node,i)=>{labels[node.id]=[node.label,LETTERS[start+i]];return {...structuredClone(node),label:LETTERS[start+i]};};
 const group=(root,id,parts,prompt)=>({id,type:'group',label:'',...(root.layout&&root.layout!=='list'?{layout:root.layout}:{}),...(root.columns?{columns:root.columns}:{}),prompt,children:parts});
 const firstRun=(p.children??[]).every(k=>k.type==='group')?structuredClone(p.children):[group(p,p.id+'-run-1',structuredClone(p.children),'')];
 const secondRun=(f.children??[]).every(k=>k.type==='group')&&f.children.length>1
  ?(()=>{let i=0;return f.children.map((k,n)=>({...structuredClone(k),prompt:n===0?(promptText(k.prompt)?k.prompt:f.prompt):k.prompt,children:k.children.map(c=>relabel(c,i++))}));})()
  :[group(f,f.id,fParts.map(relabel),f.prompt)];
 const {layout,columns,...rest}=p;
 return {content:{...structuredClone(rest),layout:'list',children:[...firstRun,...secondRun]},labels};
}
export function mergeBlocks(previous,followUp,{note,judgedBy}){
 const joined=mergedContent(previous,followUp);if(joined.manual)return joined;
 const block={...structuredClone(previous),content:joined.content};
 if(followUp.sourceRefs?.length)block.sourceRefs=[...(previous.sourceRefs??[]),...followUp.sourceRefs];
 const review=block.sourceReview??={};
 if(followUp.sourceReview?.responses?.length)review.responses=[...(review.responses??[]),...followUp.sourceReview.responses];
 review.mergedFollowUps=[...(review.mergedFollowUps??[]),{blockId:followUp.id,decision:'merge',note,judgedBy,labels:joined.labels,sourceIdentity:followUp.sourceReview?.sourceIdentity??null}];
 delete block.classification?.assessment;
 return {block,labels:joined.labels};
}
export function embedBlock(followUp,{prompt,note,judgedBy}){
 const block=structuredClone(followUp);
 block.sourceReview??={};block.sourceReview.embeddedGiven={note,judgedBy,previousPrompt:followUp.content.prompt};
 block.content.prompt=prompt;
 delete block.classification?.assessment;
 return block;
}
export const selfContained=(block,{note,judgedBy})=>({decision:'self-contained',signature:dependencySignature(block),note,judgedBy});

function ratePrompt(project,blocks){
 return `Do not run any commands or open files: everything you need is in this message.
Rate each practice question from the MathsMap booklet "${project.title}". ${REASONING_PROMPT}
The booklet's existing rated questions, as anchors for the scale: ${JSON.stringify(anchorsFor(project))}
Questions: ${JSON.stringify(blocks.map(b=>({blockId:b.id,question:studentView(b)})))}
Copy each outer blockId exactly into the corresponding item's id. Ignore IDs inside question.
Reply with ONLY JSON: {"items": [{"id": "...", "reasoningScore": 0, "difficultyReason": "..."}]}`;
}
async function callSol({dir,name,prompt,check}){
 process.env.BOOKLET_CODEX_BIN??=codexBinary();
 const {runAstraTask}=await import('../scripts/booklet/codex-transcription.mjs');
 const key=sha(prompt+JUDGE.model+JUDGE.effort),file=path.join(dir,name,'result-'+key.slice(0,16)+'.json');
 if(fs.existsSync(file))return read(file);
 for(let attempt=1;;attempt++){
  const out=path.join(dir,name,`call-${key.slice(0,8)}-${attempt}-${Date.now()}`);
  const reply=await runAstraTask({cwd:dir,runDir:dir,prompt,out,profile:'review',configuration:judgeConfiguration(),stage:'bank-import-'+name});
  if(check(reply.result)){const kept={key,model:JUDGE.model,effort:JUDGE.effort,at:new Date().toISOString(),evidence:path.join(out,'last-message.txt'),metrics:reply.metrics,result:reply.result};write(file,kept);return kept;}
  if(attempt===2)throw Error(name+': Sol reply incomplete twice');
 }
}

// pairs: [{followUp, previous, references}] from the planner's follow-up-merge rows. Returns the candidate project
// (unsaved) and one result row per pair.
// reviewOf(block) is the recorded-review test (scripts/booklet/recorded-review.mjs); a joined question is accepted
// only when every component had a current review.
export async function resolveFollowUps(project,pairs,{dir,call=callSol,reviewOf}={}){
 if(!pairs.length)return {project,results:[]};
 const ids=new Set(pairs.map(p=>p.followUp.id));
 const judged=await call({dir,name:'judge',prompt:judgePrompt(project,pairs),check:r=>validJudgement(r,ids)});
 const judgedBy=`${judged.model} ${judged.effort} ${judged.at}`;
 const candidate=structuredClone(project),results=[],rerate=[];
 const find=id=>{for(const s of candidate.sections){const i=s.blocks.findIndex(b=>b.id===id);if(i>=0)return {section:s,index:i};}return null;};
 for(const item of judged.result.items){
  const pair=pairs.find(p=>p.followUp.id===item.id),at=find(item.id),prev=find(pair.previous.id);
  const row={blockId:item.id,previousBlockId:pair.previous.id,decision:item.decision,note:item.note.trim()};
  const components=(item.decision==='merge'?[pair.previous,pair.followUp]:[pair.followUp]).map(b=>({blockId:b.id,...reviewOf(b)}));
  if(item.decision!=='independent'&&!components.every(c=>c.current)){row.decision=item.decision+'-blocked';row.reason='a component has no current review: '+components.filter(c=>!c.current).map(c=>c.blockId+' '+c.reason).join(', ');results.push(row);continue;}
  row.components=components;
  if(item.decision==='independent'){
   const block=at.section.blocks[at.index];block.sourceReview??={};block.sourceReview.bankDependencyReview=selfContained(block,{note:row.note,judgedBy});
  }else if(item.decision==='embed'){
   const block=embedBlock(at.section.blocks[at.index],{prompt:item.prompt.trim(),note:row.note,judgedBy});
   block.sourceReview.bankDependencyReview=selfContained(block,{note:row.note,judgedBy});
   at.section.blocks[at.index]=block;rerate.push(block.id);row.prompt=item.prompt.trim();
  }else{
   const merged=mergeBlocks(prev.section.blocks[prev.index],at.section.blocks[at.index],{note:row.note,judgedBy});
   if(merged.manual){row.decision='merge-manual';row.reason=merged.manual;results.push(row);continue;}
   // The follow-up's words now point at the earlier parts of the same question.
   merged.block.sourceReview.bankDependencyReview=selfContained(merged.block,{note:'Follow-up '+item.id+' merged as later parts of this question, so its reference to the previous question points within it. '+row.note,judgedBy});
   prev.section.blocks[prev.index]=merged.block;at.section.blocks.splice(at.index,1);rerate.push(merged.block.id);row.labels=merged.labels;
  }
  results.push(row);
 }
 if(rerate.length){
  const want=new Set(rerate),blocks=[...want].map(id=>{const f=find(id);return f.section.blocks[f.index];});
  const rated=await call({dir,name:'rerate',prompt:ratePrompt(candidate,blocks),check:r=>Array.isArray(r?.items)&&r.items.length===want.size&&new Set(r.items.map(i=>i.id)).size===want.size&&r.items.every(i=>want.has(i.id)&&Number.isInteger(i.reasoningScore)&&i.reasoningScore>=0&&i.reasoningScore<=100&&String(i.difficultyReason??'').trim())});
  for(const i of rated.result.items){
   const f=find(i.id),block=f.section.blocks[f.index];
   block.classification={...block.classification,...assessedRating(block,{...i,difficulty:difficultyBandForScore(i.reasoningScore)},{model:rated.model,assessedAt:rated.at,evidence:rated.evidence})};
   const row0=results.find(r=>r.blockId===i.id&&r.decision==='embed'||r.previousBlockId===i.id&&r.decision==='merge');
   block.sourceReview.bankMergeReview={fingerprint:contentFingerprint(block),components:row0.components,judgedBy};
   const row=results.find(r=>r.blockId===i.id||r.previousBlockId===i.id&&r.decision==='merge');if(row)row.rating={reasoningScore:i.reasoningScore,difficultyReason:i.difficultyReason};
  }
 }
 return {project:candidate,results};
}
