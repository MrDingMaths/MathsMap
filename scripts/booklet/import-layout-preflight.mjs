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
  // Bracketed question subtitles ("[Recursions]"), inventory sentences and long phrases are not group headings.
  if(!header||header.length>40||header.split(/\s+/).length>4||/^\[.*\]$/.test(header)||/[.:;]$/.test(header)||TITLE.test(header)||NON_GROUP_KIND.test(group.kind??''))continue;
  const members=[group.entries,group.inventoryIds,group.entryIds,group.members,group.memberIds,group.questionIds].find(Array.isArray)?.filter(id=>typeof id==='string')??[];
  rows.push({page:inventory.pageNumber,header,groupId:group.id??null,members});
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
  let index=rows.findIndex(({block},i)=>(pageOf(block)??0)>=heading.page&&same(block.sourceReview?.sourceIdentity?.category,heading.header)&&
   !same(rows[i-1]?.block.sourceReview?.sourceIdentity?.category,heading.header));
  // Blocks without a recorded category: the group's first inventoried member owns the heading.
  if(index<0&&heading.members?.length)index=rows.findIndex(({block})=>heading.members.includes(block.id));
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
 // C2: a one-letter text cue, or an inline maths cue ending in "=", stays on the line
 // of its blank (document-model joinPrevious).
 for(const {block} of rows)visit(block.content,node=>{
  const paragraphs=typeof node.prompt==='object'?node.prompt?.blocks??[]:[];
  for(const paragraph of paragraphs)(paragraph.inlines??[]).forEach((inline,i)=>{
   const cue=paragraph.inlines[i-1];
   if(inline.type!=='cloze'||inline.joinPrevious)return;
   // A printed initial after a space or a quote mark ("the ‘o") is a cue; a letter inside a word is not.
   const textCue=cue?.type==='text'&&/(?:^|[^A-Za-z])[A-Za-z]$/.test(cue.text??''),mathsCue=cue?.type==='math'&&!cue.display&&/=\s*$/.test(cue.latex??'');
   if(!textCue&&!mathsCue)return;
   inline.joinPrevious=true;
   changes.push({check:'C2-cue-blank',blockId:block.id,field:'/joinPrevious',value:true,evidence:{nodeId:node.id,cue:textCue?cue.text.slice(-12):cue.latex}});
  });
 });
 // C7: a display environment written without $$ prints as raw LaTeX; wrap it (text unchanged).
 for(const {block} of rows)visit(block.content,node=>{
  for(const key of ['short','worked']){
   const value=node.answer?.[key];if(typeof value!=='string')continue;
   const wrapped=wrapBareDisplays(value);if(wrapped===null)continue;
   node.answer[key]=wrapped;
   changes.push({check:'C7-bare-display',blockId:block.id,field:'/answer/'+key,value:'$$ delimiters',evidence:{nodeId:node.id}});
  }
 });
 return {project,changes};
}
const DISPLAY_ENV=/\\begin\{(align\*?|aligned|gather\*?|cases|array)\}[\s\S]*?\\end\{\1\}/g;
// Outside $$...$$ and inline $...$, wrap each bare display environment in $$. Null when there is none.
export function wrapBareDisplays(text){
 let wrapped=0;
 const result=text.split('$$').map((part,i)=>i%2?part:part.split(/(\$[^$]*\$)/).map((piece,j)=>j%2?piece:piece.replace(DISPLAY_ENV,env=>{wrapped++;return '$$'+env+'$$';})).join('')).join('$$');
 return wrapped?result:null;
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

// C8: one block holding several printed questions (children numbered 1, 2, ...) prints
// its own booklet number beside the first child's number (Ch 2 pilot investigation).
// Structural, so it is checked before content review: author one block per question.
export function nestedQuestionBlockers(project){
 const blockers=[];
 for(const {block} of practiceRows(project)){
  const numbered=(block.content?.children??[]).filter(child=>/^\d+$/.test(String(child.label??'').trim()));
  // Numbered parts (1)-(6) are legitimate; a numbered group or question with its own parts is a printed question.
  if(numbered.length<2||!numbered.some(child=>['group','question'].includes(child.type)&&child.children?.length))continue;
  blockers.push({check:'C8-nested-questions',blockId:block.id,message:'Block '+block.id+' holds printed questions '+numbered.map(c=>c.label).join(', ')+' as nested children; author one block per printed question (shared introduction in the first question\'s prompt)'});
 }
 return blockers;
}

// C9: an answer-key absence claim that searched only some of the prepared answer pages
// usually means the topic's configured teacherPages missed the exercise (Ch 2 pilot: five
// Exercise 2D blocks). Content review would refuse the claim; say why, before any call.
export function answerKeyCoverageBlockers(project,manifest){
 const prepared=manifest?.teacherPages??[];if(!prepared.length)return [];
 const blockers=[];
 for(const {block} of practiceRows(project)){
  const absence=block.sourceReview?.answerEvidence?.answerKeyAbsence;if(!absence)continue;
  const searched=absence.searchedTeacherPages??[],missing=prepared.filter(page=>!searched.includes(page));
  if(missing.length)blockers.push({check:'C9-answer-pages',blockId:block.id,message:'Block '+block.id+' claims no answer-key entry after searching answer pages '+searched.join(', ')+' only (not '+missing.join(', ')+'): check the topic\'s teacherPages in the run config, then re-author or record the key reference'});
 }
 return blockers;
}
// Structural checks to run before content review (C8, C9).
export function structuralPreflightBlockers(project,manifest){
 return [...nestedQuestionBlockers(project),...answerKeyCoverageBlockers(project,manifest)];
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
   const result=await run(['scripts/booklet/check-compact-exercises.mjs','--development','--project',projectId,'--project-file',file,'--target-blocks',ids.join(','),'--editions',edition,'--all-dom-issues','--out',dir,...(base?['--base',base]:[])]);
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
