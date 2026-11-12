// Import pipeline v2 layout preflight (docs/booklet-import-v2-ch01-efficiency.md, changes 1 and 2).
// Deterministic fixes and checks that run before any finish export, so that a
// five-edition export and a visual round are not spent finding them. Every fix
// edits only fields outside the content-review hash and the rating task hash
// (flow fields), except the cue join, which runs before content review and
// rating so nothing is made stale.
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';

const blocksOf=project=>(project.sections??[]).flatMap(section=>(section.blocks??[]).map(block=>({block,section})));
const practiceRows=project=>blocksOf(project).filter(({section,block})=>section.phase==='practice'&&block.type==='question');
const pageOf=block=>block.sourceRefs?.[0]?.pageNumber??block.sourcePageNumber??null;
const same=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.trim().toLowerCase()===b.trim().toLowerCase();
const visit=(node,fn)=>{if(!node||typeof node!=='object')return;fn(node);for(const child of node.children??[])visit(child,fn);};

// A printed practice-group heading from the source inventory: a group header
// that is not an exercise, chapter or section title, a running header or a
// numbered subheading ("Fundamentals 1" labels a question, not a group).
const TITLE=/^(?:exercises?|chapter|unit|topic|investigation)\b|^\d+[A-Z]?\s|\s\d+$/i;
const NON_GROUP_KIND=/exercise|chapter|investigation|subheading/i;
export function printedPracticeHeadings(inventories){
 const rows=[];
 for(const inventory of inventories??[])for(const group of inventory?.groups??[]){
  const header=typeof group.header==='string'?group.header.trim():'';
  if(!header||header.length>40||TITLE.test(header)||NON_GROUP_KIND.test(group.kind??''))continue;
  rows.push({page:inventory.pageNumber,header,groupId:group.id??null});
 }
 return rows;
}

function promptStartsWith(block,label){
 const prompt=block.content?.prompt;
 const first=typeof prompt==='string'?prompt.split('\n').find(line=>line.trim()):(prompt?.blocks??[]).find(b=>b.type==='paragraph')?.inlines?.map(i=>i.text??'').join('');
 return same(String(first??'').replace(/\*\*/g,''),label);
}

// Fixes. Returns a new project and one change row per edit.
export function applyLayoutPreflightFixes(input,{headings=[]}={}){
 const project=structuredClone(input),changes=[],rows=practiceRows(project);
 // C1: the first block of each printed source group owns its heading.
 for(const heading of headings){
  const index=rows.findIndex(({block},i)=>(pageOf(block)??0)>=heading.page&&same(block.sourceReview?.sourceIdentity?.category,heading.header)&&
   !same(rows[i-1]?.block.sourceReview?.sourceIdentity?.category,heading.header));
  if(index<0)continue;
  const block=rows[index].block;
  if(same(block.flow?.practiceCategoryHeading,heading.header)||promptStartsWith(block,heading.header))continue;
  block.flow={...block.flow,practiceCategoryHeading:heading.header};
  changes.push({check:'C1-heading',blockId:block.id,field:'/flow/practiceCategoryHeading',value:heading.header,evidence:{page:heading.page,groupId:heading.groupId}});
 }
 // C3: exercise starts stay forced in the worked edition too.
 const practiceSections=(project.sections??[]).filter(section=>section.phase==='practice'&&section.blocks?.length);
 for(const section of practiceSections.slice(1)){
  const block=section.blocks[0];if(block.flow?.workedPageBreakBefore)continue;
  block.flow={...block.flow,workedPageBreakBefore:true};
  changes.push({check:'C3-worked-exercise-start',blockId:block.id,field:'/flow/workedPageBreakBefore',value:true,evidence:{sectionId:section.id}});
 }
 // C2: a one-letter text cue stays on the line of its blank (document-model joinPrevious).
 for(const {block} of rows)visit(block.content,node=>{
  const paragraphs=typeof node.prompt==='object'?node.prompt?.blocks??[]:[];
  for(const paragraph of paragraphs)(paragraph.inlines??[]).forEach((inline,i)=>{
   const cue=paragraph.inlines[i-1];
   if(inline.type!=='cloze'||inline.joinPrevious||cue?.type!=='text'||!/(?:^|\s)[A-Za-z]$/.test(cue.text??''))return;
   inline.joinPrevious=true;
   changes.push({check:'C2-cue-blank',blockId:block.id,field:'/joinPrevious',value:true,evidence:{nodeId:node.id,cue:cue.text.slice(-12)}});
  });
 });
 return {project,changes};
}

// C6: a question that declares a dependency and refers to another question in
// its wording needs a recorded dependency decision before printing.
const REFERENCE=/\b(?:question|part)\s+\d*\s*\(?[a-z]{0,4}\)?\s*(?:of|from|in)\s+the\s+(?:preceding|previous)\b|\bpreceding\s+(?:question|investigation|exercise|task)\b|\bprevious\s+question\b|\bquestion\s+\d+\s*\([a-z]+\)/i;
const textOf=value=>typeof value==='string'?value:JSON.stringify(value??'');
export function layoutPreflightBlockers(project){
 const blockers=[];
 for(const {block} of practiceRows(project)){
  const declared=(block.flow?.dependsOn??[]).length>0;let match=null;
  visit(block.content,node=>{match??=textOf(node.prompt).match(REFERENCE);});
  if(!declared||!match||block.sourceReview?.bankDependencyReview?.decision)continue;
  blockers.push({check:'C6-cross-reference',blockId:block.id,message:'Cross-question reference in '+block.id+' ("'+match[0]+'"): check that the referenced label exists as printed in this booklet, then record sourceReview.bankDependencyReview'});
 }
 return blockers;
}

// C5 plus repaired blocks: what a targeted render must check before printing.
export function renderRiskTargets(project,{changed=[]}={}){
 const targets=new Set(changed);
 for(const {block} of practiceRows(project)){
  const content=block.content;
  if(content?.layout!=='grid'||(content.columns??0)<3)continue;
  let long=false;visit(content,node=>{if(node!==content&&(textOf(node.prompt).match(/\$[^$]+\$/g)??[]).join('').length>30)long=true;});
  if(long)targets.add(block.id);
 }
 return [...targets];
}

// One checker process per edition (a failing edition stops its process), with
// one retry that drops targets absent from that edition. Needs Studio on 5173;
// when it cannot be reached the caller logs a skip, as the label check does.
export async function targetedRenderCheck({file,projectId,targets,out,editions=['student','short','worked'],base,run=runChecker,log=()=>{}}){
 const issues=[],skipped=[],started=Date.now();
 if(!targets.length)return {issues,skipped,seconds:0,targets};
 for(const edition of editions){
  let ids=[...targets];
  for(let attempt=0;attempt<2&&ids.length;attempt++){
   const dir=path.join(out,edition);fs.mkdirSync(dir,{recursive:true});
   const result=await run(['scripts/booklet/check-compact-exercises.mjs','--development','--project',projectId,'--project-file',file,'--target-blocks',ids.join(','),'--editions',edition,'--out',dir,...(base?['--base',base]:[])]);
   const missing=/Target blocks missing from \S+: ([^\n]+)/.exec(result.output??'')?.[1]?.split(',').map(id=>id.trim());
   if(missing?.length){ids=ids.filter(id=>!missing.includes(id));continue;}
   const reportFile=path.join(dir,'development-report.json');
   const report=fs.existsSync(reportFile)?JSON.parse(fs.readFileSync(reportFile,'utf8')).report?.[projectId]?.[edition]:null;
   if(!report){if(result.code!==0)skipped.push({edition,reason:(result.output??'').trim().split('\n').slice(-3).join(' ')});break;}
   for(const issue of report.issues??[])issues.push({edition,...issue});
   // Printed pages follow selectedPages order; their issues carry no page of their own.
   for(const [i,page] of (report.printed??[]).entries())for(const issue of page.issues??[])issues.push({edition,printed:true,...issue,page:issue.page??report.selectedPages?.[i]??null});
   break;
  }
 }
 const seconds=Math.round((Date.now()-started)/1000);
 log('Targeted render of '+targets.length+' blocks: '+issues.length+' issues in '+seconds+' s'+(skipped.length?' ('+skipped.length+' editions skipped)':''));
 return {issues,skipped,seconds,targets};
}

function runChecker(args){
 return new Promise(resolve=>{
  const child=spawn(process.execPath,args,{cwd:process.cwd(),stdio:['ignore','pipe','pipe']});let output='';
  child.stdout.on('data',d=>{output+=d;});child.stderr.on('data',d=>{output+=d;});
  child.on('close',code=>resolve({code,output}));
 });
}
