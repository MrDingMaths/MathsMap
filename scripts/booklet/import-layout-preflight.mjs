// Import pipeline v2 layout preflight (docs/booklet-import-v2-ch01-efficiency.md, changes 1 and 2).
// Deterministic fixes and checks that run before any finish export, so that a
// five-edition export and a visual round are not spent finding them. Every fix
// edits only fields outside the content-review hash and the rating task hash
// (flow fields), except the cue join, which runs before content review and
// rating so nothing is made stale.
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {questionDependencyFindings,dependencySignature} from '../../src/lib/booklet-question-dependencies.js';

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

// One question-reference rule (simplification plan item 5, 13 November 2026): C6 (a declared
// dependency whose wording points at another question) and C10 (the bank's dependency check)
// were the same rule at two times. Before printing, this is the check; the pre-render gate
// calls it under its old name.
const REFERENCE=/\b(?:question|part)\s+\d*\s*\(?[a-z]{0,4}\)?\s*(?:of|from|in)\s+the\s+(?:preceding|previous)\b|\bpreceding\s+(?:question|investigation|exercise|task)\b|\bprevious\s+question\b|\bquestion\s+\d+\s*\([a-z]+\)/i;
const textOf=value=>typeof value==='string'?value:JSON.stringify(value??'');
export function layoutPreflightBlockers(project){
 return questionReferenceBlockers(project);
}
function declaredReferenceBlockers(project,reported){
 const blockers=[];
 for(const {block} of practiceRows(project)){
  if(reported.has(block.id))continue;
  const declared=(block.flow?.dependsOn??[]).length>0;let match=null;
  visit(block.content,node=>{match??=textOf(node.prompt).match(REFERENCE);});
  if(!declared||!match||block.sourceReview?.bankDependencyReview?.decision)continue;
  blockers.push({check:'question-reference',blockId:block.id,message:'Block '+block.id+' refers to another question ("'+match[0]+'"): name an earlier question in this exercise, reword it to be self-contained, or record sourceReview.bankDependencyReview'});
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
// A chapter-sized answer book is ordered by exercise: an answer can only appear on its own
// topic's answer pages (run config topics[].teacherPages, confirmed on the page images
// before inventory). Cambridge X11 Ch 5 (12 November 2026, James): 24 answer pages; a claim
// listing all of them exceeded the 8-image content-review limit, so absence claims were
// unreviewable. A claim that searched exactly its topic's pages is complete.
export function readRunConfig(runDir){
 const file=runDir&&path.join(runDir,'config.json');
 return file&&fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null;
}
export function topicAnswerScope(config,ownPages,prepared=[]){
 const topics=(config?.topics??[]).filter(t=>Number.isInteger(t.start)&&Number.isInteger(t.end)&&Array.isArray(t.teacherPages)&&t.teacherPages.length);
 const owners=new Set(ownPages.map(page=>topics.find(t=>page>=t.start&&page<=t.end)));
 if(!ownPages.length||owners.size!==1||owners.has(undefined))return null;
 const pages=[...owners][0].teacherPages;
 return pages.every(page=>prepared.includes(page))?[...new Set(pages)].sort((a,b)=>a-b):null;
}
export function answerKeyCoverageBlockers(project,manifest,{config}={}){
 const prepared=manifest?.teacherPages??[];if(!prepared.length)return [];
 const blockers=[];
 for(const {block} of practiceRows(project)){
  const absence=block.sourceReview?.answerEvidence?.answerKeyAbsence;if(!absence)continue;
  const searched=absence.searchedTeacherPages??[],missing=prepared.filter(page=>!searched.includes(page));
  const scope=topicAnswerScope(config,(block.sourceRefs??[]).map(ref=>ref.pageNumber).filter(Number.isInteger),prepared);
  if(scope&&scope.every(page=>searched.includes(page)))continue;
  if(missing.length)blockers.push({check:'C9-answer-pages',blockId:block.id,message:'Block '+block.id+' claims no answer-key entry after searching answer pages '+searched.join(', ')+' only (not '+missing.join(', ')+'): check the topic\'s teacherPages in the run config, then re-author or record the key reference'});
 }
 return blockers;
}
// C10: the bank's own dependency check (check-question-dependencies --strict), run before
// content review instead of at publication. A reference by source number ("Question 6")
// prints the wrong number once the booklet renumbers (Ch 2 pilot, p9-q8).
// A genuine follow-up ("Check that the table agrees with your answers to Question 5") may keep
// its source wording when it is recorded as one (Cambridge X11 Ch 5, 12 November 2026, James:
// the content reviewer twice restored the source follow-up over a bank-ready restatement).
// It is accepted only when sourceReview.bankDependencyReview is {decision:'follow-up', note,
// signature: dependencySignature(block)}, the block's flow.dependsOn names only earlier questions
// in its own section, and every printed "Question N" is one of them at the number this booklet
// prints. The bank's own dependency check is unchanged, so publication still treats it as a follow-up.
const NUMBERED_REFERENCE=/^(?:questions?\s*|Q\s*)(\d+)$/i,PREVIOUS_REFERENCE=/^(?:previous|preceding)\s+question$/i;
export function followUpReference(project,finding){
 const section=(project.sections??[]).find(s=>(s.blocks??[]).some(b=>b.id===finding.blockId));
 const questions=(section?.blocks??[]).filter(b=>b.type==='question'),index=questions.findIndex(b=>b.id===finding.blockId),block=questions[index];
 const review=block?.sourceReview?.bankDependencyReview,targets=block?.flow?.dependsOn??[];
 if(!block||review?.decision!=='follow-up'||typeof review.note!=='string'||review.note.trim().length<20||review.signature!==dependencySignature(block)||!targets.length)return false;
 const printed=new Map();
 for(const id of targets){const at=questions.findIndex(b=>b.id===id);if(at<0||at>=index)return false;printed.set(at+1,id);}
 if(finding.external.some(id=>!targets.includes(id)))return false;
 return finding.references.every(ref=>{
  const text=ref.reference.trim(),match=NUMBERED_REFERENCE.exec(text);
  if(match)return printed.has(Number(match[1]));
  // "the previous question" is the question printed just before this one.
  return PREVIOUS_REFERENCE.test(text)&&printed.has(index);
 });
}
// The source's own number for a block ("5" for 5G Question 5). Labels may be bare ("5", Cambridge) or
// named ("Question 5", Mastering Maths); only a question label counts, so "Fundamentals 2" or
// "Problem 2" is never the target of a "Question 2" reference.
const sourceNumber=block=>{
 const label=String(block.sourceReview?.sourceIdentity?.questionLabel??block.sourceReview?.sourceIdentity?.question??'').trim();
 return /^(?:(?:question|Q)\s*)?(\d+)$/i.exec(label)?.[1]??'';
};
// Replace `from` with `to` once in a node's student-facing prompt (string or editor document).
function replaceInPrompt(node,from,to){
 if(typeof node.prompt==='string'){if(!node.prompt.includes(from))return false;node.prompt=node.prompt.replace(from,to);return true;}
 let done=false;
 const walk=value=>{if(done||!value||typeof value!=='object')return;if(Array.isArray(value))return value.forEach(walk);
  if(value.type==='text'&&typeof value.text==='string'&&value.text.includes(from)){value.text=value.text.replace(from,to);done=true;return;}
  for(const key of ['blocks','inlines','slots','rows'])walk(value[key]);};
 walk(node.prompt);return done;
}
// Fix what the script can decide: a reference to an earlier question of the same exercise
// ("Question 5", "the previous question") is linked through flow.dependsOn, renumbered when
// the booklet prints that question under another number, and recorded as a source follow-up
// bound to the block's signature. Anything else (another exercise, a teaching box, a vague
// reference) is left as a blocker for a person. Runs before content review, so nothing is stale.
export function resolveQuestionReferences(input){
 const project=structuredClone(input),changes=[];
 for(const finding of questionDependencyFindings(project)){
  if(finding.reviewed||followUpReference(project,finding))continue;
  const section=project.sections.find(s=>s.id===finding.sectionId),questions=(section?.blocks??[]).filter(b=>b.type==='question');
  const index=questions.findIndex(b=>b.id===finding.blockId),block=questions[index];if(!block)continue;
  const earlier=questions.slice(0,index),targets=new Set(block.flow?.dependsOn??[]),rewrites=[];
  let resolved=finding.external.every(id=>earlier.some(b=>b.id===id));
  for(const ref of finding.references){
   if(!resolved)break;
   const text=ref.reference.trim(),match=NUMBERED_REFERENCE.exec(text);
   // "Question 16 of Exercise 5B", "5B Question 16", "Chapter 4 Question 2": another exercise, left for a person.
   const at=(ref.prompt??'').indexOf(ref.reference),before=at<0?'':ref.prompt.slice(Math.max(0,at-12),at),after=at<0?'':ref.prompt.slice(at+ref.reference.length,at+ref.reference.length+30);
   if(/\b\d+[A-Z]\s*$|\b(?:exercise|chapter|section|box)\s*\S*\s*$/i.test(before)||/^\s*(?:\([a-z]+\)\s*)?(?:of|in|from)\s+(?:the\s+)?(?:exercise|chapter|section|box|\d+[A-Z]\b)/i.test(after)){resolved=false;break;}
   if(match){
    // The source's number first; a number already renumbered to a linked question is kept as printed.
    const linked=earlier[Number(match[1])-1];
    const target=[...earlier].reverse().find(b=>sourceNumber(b)===match[1])??(linked&&targets.has(linked.id)?linked:null);
    if(!target){resolved=false;break;}
    targets.add(target.id);
    const printed=questions.indexOf(target)+1;
    if(printed!==Number(match[1]))rewrites.push({nodeId:ref.nodeId,from:text,to:text.replace(match[1],String(printed))});
   }else if(PREVIOUS_REFERENCE.test(text)&&earlier.length)targets.add(earlier.at(-1).id);
   else resolved=false;
  }
  if(!resolved)continue;
  const nodes=[];visit(block.content,node=>nodes.push(node));
  if(!rewrites.every(rewrite=>{const node=nodes.find(n=>n.id===rewrite.nodeId)??block.content;return replaceInPrompt(node,rewrite.from,rewrite.to);}))continue;
  block.flow={...block.flow,dependsOn:[...targets]};
  const names=[...targets].map(id=>{const at=questions.findIndex(b=>b.id===id);return 'Question '+(at+1)+' ('+id+(sourceNumber(questions[at])?', source Question '+sourceNumber(questions[at]):'')+')';});
  block.sourceReview={...block.sourceReview,bankDependencyReview:{decision:'follow-up',note:'Source follow-up to an earlier question of this exercise, recorded by the import reference check: '+names.join(', ')+(rewrites.length?'; the printed number was changed to this booklet\'s numbering':'')+'.',recordedBy:'import-reference-check'}};
  block.sourceReview.bankDependencyReview.signature=dependencySignature(block);
  changes.push({check:'question-reference',blockId:block.id,field:'/sourceReview/bankDependencyReview',value:'follow-up',evidence:{dependsOn:[...targets],rewrites}});
 }
 return {project,changes};
}
export function questionReferenceBlockers(project){
 const findings=questionDependencyFindings(project).filter(f=>!f.reviewed&&!followUpReference(project,f));
 const blockers=findings.map(f=>({check:'question-reference',blockId:f.blockId,message:'Block '+f.blockId+' refers to other questions ('+[...f.external,...f.references.map(r=>r.reference)].join(', ')+'): the script could not link it to an earlier question of this exercise; reword it to be self-contained, or record sourceReview.bankDependencyReview'}));
 return [...blockers,...declaredReferenceBlockers(project,new Set(blockers.map(b=>b.blockId)))];
}
// Structural checks to run before content review (C8, C9, question references).
export function structuralPreflightBlockers(project,manifest,options={}){
 return [...nestedQuestionBlockers(project),...answerKeyCoverageBlockers(project,manifest,options),...questionReferenceBlockers(project)];
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
export async function targetedRenderCheck({file,projectId,targets,out,editions=['student','short','worked'],base,visibilityReviews,run=runChecker,log=()=>{}}){
 const issues=[],skipped=[],started=Date.now();
 if(!targets.length)return {issues,skipped,seconds:0,targets};
 for(const edition of editions){
  let ids=[...targets];
  for(let attempt=0;attempt<2&&ids.length;attempt++){
   const dir=path.join(out,edition);fs.mkdirSync(dir,{recursive:true});
   const result=await run(['scripts/booklet/check-compact-exercises.mjs','--development','--project',projectId,'--project-file',file,'--target-blocks',ids.join(','),'--editions',edition,'--all-dom-issues','--out',dir,...(base?['--base',base]:[]),...(visibilityReviews?['--visibility-reviews',visibilityReviews]:[])]);
   const missing=/Target blocks missing from \S+: ([^\n]+)/.exec(result.output??'')?.[1]?.split(',').map(id=>id.trim());
   if(missing?.length){ids=ids.filter(id=>!missing.includes(id));continue;}
   const reportFile=path.join(dir,'development-report.json');
   const report=fs.existsSync(reportFile)?JSON.parse(fs.readFileSync(reportFile,'utf8')).report?.[projectId]?.[edition]:null;
   // Fail closed: a run that wrote no report for this edition checked nothing, whatever its
   // exit code (Cambridge X11 Ch 5: an empty report passed the gate; export 1 then had 26 DOM issues).
   if(!report){const lines=(result.output??'').trim().split('\n'),error=lines.find(line=>/^\w*Error\b|Error \[|^Error:/.test(line.trim()));skipped.push({edition,reason:(error??lines.slice(-3).join(' ')).trim().slice(0,400)||'no report for '+edition+(result.code===0?' (exit 0)':'')});break;}
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
