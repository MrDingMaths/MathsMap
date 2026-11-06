#!/usr/bin/env node
import {validatePracticeItems} from './practice-item-targets.mjs';
import {endSectionRole} from '../polish/end-section-role.mjs';
// Booklet pedagogy review (user approved 9 October 2026). Policy, commands and
// both worker contracts are in docs/booklet-pedagogy-review.md.
// This file lives outside scripts/ on purpose: exports freeze that tree, and a
// new file there fails any export in flight.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {questionReviewContent} from '../src/lib/booklet-review-profile.js';
import {toSource} from '../public/libs/maths-editor/document-model.mjs';
import {questionKey} from '../src/lib/question-sync.js';
import {isTheoryReview} from '../src/lib/question-bank-eligibility.js';
import {flowNumbers,exerciseNumbers} from '../src/lib/booklet-flow.js';
import {REVIEW_DEFAULT,reviewConfiguration} from '../scripts/booklet/transcription-settings.mjs';
import {projectReviewReferences} from './review-references.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const LIMITS=Object.freeze({concurrency:3,images:8,earlierCharacters:24000,practiceOnlyEarlierCharacters:48000,challengeCharacters:160000,digestCharacters:220,outcomeCharacters:2500,coverageCharacters:180000,insertionCharacters:180000,outlineCharacters:300});
export const KINDS=Object.freeze(['example-principle','example-choice','worked-step-error','guided-practice','missing-prerequisite','opening-review','unsupported-transition','difficulty-jump','untested-distinction','duplicate-question']);
// Optional ideas, never counted as findings and never a reason to hold an import.
export const SUGGESTION_KINDS=Object.freeze(['extension','variation-sequence']);
export const REPAIRS=Object.freeze(['change-values','fix-step','add-cue','reorder','add-question','add-review','add-teaching','remove-question']);
// Repairs that add, move or replace questions: these hold an import before its final export.
const LOCAL_REPAIRS=new Set(['change-values','fix-step','add-cue']);
export const isSuggestion=finding=>finding.severity==='suggestion';
export const isStructural=finding=>!isSuggestion(finding)&&!LOCAL_REPAIRS.has(finding.repair?.type);
const SEVERITIES=['severe','high'];
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const sha=value=>createHash('sha256').update(value).digest('hex');
const now=()=>new Date().toISOString();
const text=value=>typeof value==='string'?value.trim():'';
const reviewTask=(project,payload,instructions,{compactTargets=false}={})=>{
 const {payload:view,encode,decode}=projectReviewReferences({project,payload,purpose:'pedagogy-order',compactTargets});
 return {prompt:instructions+'\n\n'+JSON.stringify(view),taskReferences:{encode,decode}};
};
const passIdentity=(rows,fallback)=>{
 const configs=rows.map(row=>row.reviewConfiguration??fallback??{model:'unrecorded',effort:'unrecorded'});
 const unique=[...new Map(configs.map(config=>[JSON.stringify({provider:config.provider,model:config.model,effort:config.effort}),config])).values()];
 return {...(unique.length===1?unique[0]:unique.length?{model:'mixed',effort:'mixed',configurations:unique}:REVIEW_DEFAULT),calls:rows.length};
};

// ---- contracts ----------------------------------------------------------------

export function contract(name,{root=ROOT}={}){
 const doc=fs.readFileSync(path.join(root,'docs','booklet-pedagogy-review.md'),'utf8');
 const match=doc.match(new RegExp(`<!-- contract:${name}:start -->\\r?\\n([\\s\\S]*?)\\r?\\n<!-- contract:${name}:end -->`));
 if(!match?.[1].trim())throw Error(`Missing ${name} contract in docs/booklet-pedagogy-review.md`);
 return match[1].trim();
}
// "working" comes first so the analysis is written out before any candidate is
// chosen; a low-effort pass otherwise skips it.
const REVIEW_OUTPUT='Fill in "working" first and derive the candidates from it. Every step marked "implied-only" or "not-shown", every practice row whose "suppliedBy" is "none", and every hint that does not match must either become a candidate or carry, in its own entry, the reason it falls below the threshold. Return one JSON object and nothing else: {"working":{"examples":[{"id":"worked example id","steps":[{"step":"one thing a student must recognise, recall, choose or calculate, including decisions never written down","shown":"written-line|stated-in-text|diagram-mark|implied-only|not-shown","where":"the line, the mark or the id that shows it; for implied-only, the number that appears without its origin"}],"wrongRuleThatFits":"a wrong rule that still gives this example\'s answer, or none"}],"examplesTogether":"a wrong rule or shortcut that fits every introductory example, or none","firstPractice":"which of the example\'s decisions the first practice leaves to the student, and any it supplies or adds","reviewCoverage":"the prior knowledge the worked examples use directly as a step and, for each piece, where this topic\'s review rehearses it or that it is missing","practice":[{"id":"each practice question in booklet order","changes":"what is new compared with everything before it: the decision, the representation, the prior knowledge, the arithmetic or the support; or nothing","suppliedBy":"the id of the example, guided question, teaching or earlier question that supplies it, or none"}],"hints":[{"id":"a question that carries a hint or demonstrates a method","matches":"whether the hint or method agrees with what the question needs and with later questions that invite it, and where it fails"}],"openings":"the best opening in this topic for a variation run and for an extension task, or none"},"candidates":[{"kind":"'+KINDS.join('|')+'","severity":"severe|high","targets":["id of a block, question, part or example from sequence"],"finding":"one sentence stating the problem","breakdown":"the specific misunderstanding or the point where students fail","checked":"which earlier provision you examined, with ids","assumptions":"learner assumptions this depends on","repair":{"type":"'+REPAIRS.join('|')+'","proposal":"one bounded change"},"doneWhen":"what must be true after the repair"}],"contextQuestions":[{"targets":["id"],"question":"a precise question about what students already know"}],"protectedGroups":[{"targets":["id","id"],"observation":"...","varies":"...","invariant":"..."}],"notReliablyReviewed":[{"targets":["id"],"reason":"..."}],"suggestions":[{"kind":"'+SUGGESTION_KINDS.join('|')+'","targets":["id of the block it would follow or relates to"],"idea":"one sentence","rationale":"what students would notice or learn","proposal":"the questions or the task written out, with expected answers","placement":"where it would go"}]}. Use ids exactly as they appear in sequence. Empty arrays are valid.';
const CHALLENGE_OUTPUT='Return one JSON object and nothing else: {"findings":[{"from":["candidate id"],"kind":"'+[...KINDS,...SUGGESTION_KINDS].join('|')+'","severity":"severe|high|suggestion","targets":["id"],"finding":"...","breakdown":"...","checked":"...","assumptions":"...","repair":{"type":"'+REPAIRS.join('|')+'","proposal":"..."},"doneWhen":"..."}],"dropped":[{"id":"candidate id","reason":"which question defeated it"}],"unchecked":[{"id":"candidate id","reason":"..."}],"contextQuestions":[{"from":["question id"],"targets":["id"],"question":"..."}],"droppedQuestions":[{"id":"question id","reason":"..."}]}. Every candidate id appears exactly once, in one finding\'s "from", in "dropped" or in "unchecked". Every question id appears exactly once, in one kept question\'s "from" or in "droppedQuestions".';

// Principles are maintained once in the teaching documents. Site-only rules are
// explicitly marked and cannot become booklet findings.
export function bookletPrinciples({root=ROOT}={}){
 return 'Check booklet: yes principles only; booklet: no is site-only. Familiar prerequisites are not missing worked examples: propose review-block retrieval only when worthwhile, pending James decision. Report a concrete violation as example-principle, with its exact target and smallest repair. Do not rewrite for taste.\n'+['worked-example-principles.md','guided-practice-principles.md'].map(name=>fs.readFileSync(path.join(root,'docs',name),'utf8')).join('\n\n');
}

// ---- booklet map ---------------------------------------------------------------

// A sequence is a run of consecutive sections with one topicId. A topic that
// recurs later is a separate sequence, so booklet order is never rearranged.
export function sequences(project){
 const result=[],seen=new Map();
 for(const section of project.sections??[]){
  if(section.phase==='front-matter')continue;
  const topicId=section.topicId??section.id,last=result.at(-1);
  if(last?.topicId===topicId){last.sections.push(section);continue;}
  const count=(seen.get(topicId)??0)+1;seen.set(topicId,count);
  result.push({id:count>1?topicId+'~'+count:topicId,topicId,title:(project.topics??[]).find(topic=>topic.id===topicId)?.title??section.title??topicId,sections:[section]});
 }
 return result;
}
const isDocument=value=>value&&typeof value==='object'&&value.format&&Array.isArray(value.blocks);
const isFigure=value=>['tikz','svg'].includes(value?.format);
// Editor documents become their source text; diagram code is dropped and its
// text specification kept. Practice worked solutions are omitted.
function compact(value,practice){
 if(Array.isArray(value))return value.map(child=>compact(child,practice));
 if(!value||typeof value!=='object')return value;
 if(isDocument(value)){try{return toSource(value);}catch{/* keep the structure */}}
 const result={};
 for(const [key,child]of Object.entries(value)){
  if(key==='code'&&isFigure(value))continue;
  // A diagram's written description is what a reader needs; its coordinate model is not.
  if(key==='mathematics'&&child&&typeof child==='object'&&!Array.isArray(child)){const words=Object.fromEntries(Object.entries(child).filter(([,part])=>typeof part==='string'));if(Object.keys(words).length)result.mathematics=words;continue;}
  if(key==='answer'&&practice&&child&&typeof child==='object'){const {worked,...rest}=child;result.answer=compact(rest,practice);continue;}
  result[key]=compact(child,practice);
 }
 return result;
}
export const isExplicitTeachingBlock=block=>!!block.sourceAtom||block.type==='worked-example'||['example','worked-example','guided-practice'].includes(block.pedagogyRole);
export const instructionalSections=sequence=>sequence.sections.map(section=>({...section,blocks:(section.blocks??[]).filter(block=>section.phase==='teaching'||isExplicitTeachingBlock(block))})).filter(section=>section.blocks.length);
// IDs and stored labels can keep source numbers after whole questions move.
// Reuse the print counters without sorting or mutating the saved booklet.
const numberingFor=project=>Array.isArray(project.sections)?{questions:flowNumbers(project),exercises:exerciseNumbers(project)}:{questions:{},exercises:{}};
const NUMBERING_NOTE='displayNumber and exerciseNumber use the current printed counters. Stable IDs and content.label may retain original source numbers; do not infer order or printed numbering from them. Arrays retain booklet traversal order.';
export function compactBlock(block,section,numbering){
 const practice=section.phase==='practice'&&!isExplicitTeachingBlock(block),{id,type,pedagogyRole,sourcePageNumber,sourceAtom,sourceOrder,...rest}=compact(questionReviewContent(block),practice);
 const heading=text(block.sourceAtom?.visibleSubtitle)||text(block.sourceAtom?.label),classification=block.classification??{};
 return {id:block.id,type:block.type,role:block.pedagogyRole??(practice?'practice':'unlabelled'),...(heading?{heading}:{}),...(classification.primarySkillId?{skill:classification.primarySkillId}:{}),...(classification.difficulty?{difficulty:classification.difficulty}:{}),...rest,...(numbering?.questions[block.id]!=null?{displayNumber:numbering.questions[block.id]}:{}),...(numbering?.exercises[section.topicId]!=null?{exerciseNumber:numbering.exercises[section.topicId]}:{})};
}
const sequencePayload=(sequence,numbering)=>({id:sequence.id,title:sequence.title,sections:sequence.sections.map(section=>({id:section.id,title:section.title??null,phase:section.phase,blocks:(section.blocks??[]).map(block=>compactBlock(block,section,numbering))}))});
function strings(value,found=[]){
 if(typeof value==='string'){if(value.trim())found.push(value.trim());}
 else if(Array.isArray(value))value.forEach(child=>strings(child,found));
 else if(value&&typeof value==='object')for(const [key,child]of Object.entries(value))if(!['id','type','role','skill','difficulty','format','label'].includes(key))strings(child,found);
 return found;
}
const headline=(block,characters=LIMITS.digestCharacters)=>strings(block).join(' ').replace(/\s+/g,' ').slice(0,characters);
// Every id the reviewer can see, mapped to its owning block.
export function visibleIds(sequence){
 const ids=new Map();
 const visit=(value,blockId)=>{if(Array.isArray(value))value.forEach(child=>visit(child,blockId));else if(value&&typeof value==='object'){if(typeof value.id==='string')ids.set(value.id,blockId);Object.values(value).forEach(child=>visit(child,blockId));}};
 for(const section of sequence.sections)for(const block of section.blocks??[])visit(compactBlock(block,section),block.id);
 return ids;
}
export const blockHash=block=>sha(JSON.stringify(questionReviewContent(block)));
const blocksById=project=>new Map((project.sections??[]).flatMap(section=>(section.blocks??[]).map(block=>[block.id,block])));

// Compare whole practice tasks across topics before model review. The existing
// challenge reader checks whether repetition has an instructional purpose.
export function duplicateQuestionCandidates(all,{topics=[]}={}){
 const groups=new Map(),selected=new Set(topics);
 for(const sequence of all)for(const section of sequence.sections.filter(s=>s.phase==='practice'))for(const block of section.blocks??[]){
  if(block.type!=='question'||!block.content||isTheoryReview(block,section))continue;
  const key=questionKey(block);if(!key||key==='{}')continue;
  const group=groups.get(key)??[];group.push({id:block.id,sequence:sequence.id});groups.set(key,group);
 }
 return [...groups.values()].filter(group=>group.length>1&&(!selected.size||group.some(row=>selected.has(row.sequence)))).map(group=>({
  kind:'duplicate-question',severity:'high',sequence:group.find(row=>!selected.size||selected.has(row.sequence)).sequence,targets:group.map(row=>row.id),
  finding:'The same whole practice question appears '+group.length+' times: '+group.map(row=>row.id).join(', ')+'.',
  breakdown:'Students repeat an unchanged task without a new mathematical decision; check whether this is accidental duplication rather than purposeful retrieval.',
  checked:'Deterministic comparison of the complete posed question, including parts, givens and diagrams; ignores answers, node IDs, numeric question labels, whitespace and local layout.',
  assumptions:'No explicit retrieval or comparison purpose has yet been established for the repeated copies.',
  repair:{type:'change-values',proposal:'Retain the first occurrence '+group[0].id+' and replace each later copy ('+group.slice(1).map(row=>row.id).join(', ')+') with a structurally identical question with different numbers, updating its answers, unless an explicit instructional purpose warrants retaining the repetition.'},
  doneWhen:'Each unnecessary repeated whole question is replaced by a same-structure question with different numbers; any retained repetition has an explicit instructional purpose.'
 }));
}

// Earlier teaching in full, nearest topic first, until the budget is spent; the
// rest as one line per block.
export function earlierTeaching(all,index,{characters=LIMITS.earlierCharacters,numbering}={}){
 const full=[],digests=[];let used=0,open=true;
 for(let i=index-1;i>=0;i--){
  const teaching=instructionalSections(all[i]);
  if(!teaching.length)continue;
  const value={topic:all[i].id,title:all[i].title,sections:teaching.map(section=>({title:section.title??null,blocks:section.blocks.map(block=>compactBlock(block,section,numbering))}))},size=JSON.stringify(value).length;
  if(open&&used+size<=characters){full.unshift(value);used+=size;continue;}
  open=false;
  digests.unshift({topic:all[i].id,title:all[i].title,blocks:teaching.flatMap(section=>section.blocks.map(block=>({id:block.id,role:block.pedagogyRole??'unlabelled',text:headline(compactBlock(block,section))})))});
 }
 return {full,digests,complete:digests.length===0};
}
const skillIds=sequence=>new Set(sequence.sections.flatMap(section=>section.blocks??[]).flatMap(block=>[block.classification?.primarySkillId,...(block.classification?.secondarySkillIds??[])]).filter(Boolean));
export function skillFacts(all,index,skills=[]){
 const byId=new Map(skills.map(skill=>[skill.id,skill])),here=skillIds(all[index]),earlier=new Set(all.slice(0,index).flatMap(sequence=>[...skillIds(sequence)]));
 const stages=[...here].map(id=>byId.get(id)?.stage).filter(Number.isFinite),stage=stages.length?Math.min(...stages):null;
 const where=(id,prerequisite)=>here.has(id)?'practised in this topic':earlier.has(id)?'practised earlier in this booklet':stage!=null&&Number.isFinite(prerequisite?.stage)&&prerequisite.stage<stage?'lower stage':'not seen in this booklet';
 return [...here].map(id=>byId.get(id)).filter(Boolean).map(skill=>({id:skill.id,title:skill.title,stage:skill.stage,prerequisites:(skill.prereqs??[]).map(id=>({id,title:byId.get(id)?.title??null,stage:byId.get(id)?.stage??null,where:where(id,byId.get(id))}))}));
}
// Titles of the other booklets that have teaching content: what the course
// covers elsewhere. Projects are large, so titles are cached by file size and time.
export function courseLibrary(project,{root=ROOT}={}){
 const dir=path.join(root,'booklets','projects'),cacheFile=path.join(root,'.booklet-work','pedagogy-review','library.json');
 if(!fs.existsSync(dir))return [];
 const cache=fs.existsSync(cacheFile)?read(cacheFile):{},next={};
 for(const name of fs.readdirSync(dir).filter(name=>name.endsWith('.json'))){
  const file=path.join(dir,name),stat=fs.statSync(file),key=stat.size+':'+stat.mtimeMs;
  if(cache[name]?.key===key){next[name]=cache[name];continue;}
  try{const other=read(file);next[name]={key,id:other.id,title:other.title,teaching:(other.sections??[]).some(section=>section.phase==='teaching'&&section.blocks?.length)};}
  catch{next[name]={key,teaching:false};}
 }
 fs.mkdirSync(path.dirname(cacheFile),{recursive:true});fs.writeFileSync(cacheFile,JSON.stringify(next));
 return [...new Set(Object.values(next).filter(row=>row.teaching&&row.title&&row.id!==project.id&&row.title!==project.title).map(row=>row.title))].sort();
}
export function assumptions(project,stored={},library=[]){
 const outcomes=(project.sections??[]).filter(section=>section.phase==='front-matter'&&/syllabus|outcome|learning intention/i.test(section.title??'')).flatMap(section=>(section.blocks??[]).map(block=>headline(compactBlock(block,section),LIMITS.outcomeCharacters))).join('\n').slice(0,LIMITS.outcomeCharacters);
 return {delivery:'Teacher-led in class. A teacher checks the opening review and responds to gaps, so a missing answer route is not a finding.',calculator:'Not stated. Infer it from the topic and say what you assumed in any finding that depends on it.',intendedOutcomes:outcomes||'Not recorded in the booklet.',otherBooklets:library,...stored};
}
const hasFigure=block=>/"format":"(?:tikz|svg|image)"|"type":"(?:image|diagram)"/.test(JSON.stringify(block));
// Source pages that carry this sequence's figures: teaching pages first.
export function sequenceImages(sequence,runDir,{limit=LIMITS.images}={}){
 const pages=[];let expected=false;
 for(const phase of ['teaching','practice'])for(const section of sequence.sections)if(section.phase===phase)for(const block of section.blocks??[])if(hasFigure(block)){
  expected=true;
  for(const page of [block.sourcePageNumber??section.sourcePageNumber,...(block.sourceRefs??[]).map(reference=>reference.pageNumber)])if(Number.isInteger(page)&&!pages.includes(page))pages.push(page);
 }
 const files=runDir?pages.map(page=>path.join(runDir,'evidence','pages','page-'+String(page).padStart(3,'0')+'.png')).filter(file=>fs.existsSync(file)).slice(0,limit):[];
 return {expected,files};
}
export function reviewPrompt({project,all,index,skills,decided=[],images={expected:false,files:[]},stored,library=[],root=ROOT,task=false,principlesOnly=false}){
 const numbering=numberingFor(project);
 const sequence=all[index],practiceOnly=!sequence.sections.some(section=>section.phase==='teaching');
 const earlier=earlierTeaching(all,index,{characters:practiceOnly?LIMITS.practiceOnlyEarlierCharacters:LIMITS.earlierCharacters,numbering});
 const payload={booklet:project.title,numbering:NUMBERING_NOTE,assumptions:assumptions(project,stored,library),sequence:sequencePayload(sequence,numbering),earlierTeaching:earlier.full,earlierTeachingDigests:earlier.digests,earlierTeachingComplete:earlier.complete,skills:skillFacts(all,index,skills),decided,imagesExpected:images.expected,imagesAttached:images.files.length};
 const view=reviewTask(project,payload,(principlesOnly?'Report only example-principle candidates; do not repeat other pedagogy findings or generate questions.\n\n':'')+contract('review',{root})+'\n\n'+bookletPrinciples({root})+'\n\n'+REVIEW_OUTPUT);
 return task?view:view.prompt;
}

// ---- findings -------------------------------------------------------------------

export const findingId=(kind,targets)=>'pf-'+sha(kind+'|'+[...targets].sort().join(',')).slice(0,10);
// Keep only what the contract allows; a target the reviewer could not have seen is removed.
function normalise(row,ids){
 const targets=[...new Set((Array.isArray(row?.targets)?row.targets:[]).map(String).filter(id=>ids.has(id)))];
 if(!targets.length)return {error:'no target is an id from the reviewed content'};
 const suggestion=SUGGESTION_KINDS.includes(row.kind);
 if(!suggestion&&!KINDS.includes(row.kind))return {error:'unknown kind '+row.kind};
 if(!suggestion&&!SEVERITIES.includes(row.severity))return {error:'severity below the reporting threshold'};
 if(suggestion?!text(row.finding)||!text(row.repair?.proposal):!text(row.finding)||!text(row.breakdown))return {error:suggestion?'suggestion without an idea or a written proposal':'no finding or no specific breakdown'};
 return {value:{kind:row.kind,severity:suggestion?'suggestion':row.severity,targets,finding:text(row.finding),breakdown:text(row.breakdown),checked:text(row.checked),assumptions:text(row.assumptions),repair:{type:REPAIRS.includes(row.repair?.type)?row.repair.type:'unspecified',proposal:text(row.repair?.proposal)},doneWhen:text(row.doneWhen)}};
}
// The first reader writes a suggestion in its own shape; from here on it travels as a candidate.
const suggestionCandidate=row=>({kind:row?.kind,severity:'suggestion',targets:row?.targets,finding:row?.idea,breakdown:row?.rationale,repair:{type:'add-question',proposal:text(row?.proposal)&&[text(row.proposal),text(row.placement)&&'Placement: '+text(row.placement)].filter(Boolean).join(' ')}});
const scoped=(rows,ids)=>(Array.isArray(rows)?rows:[]).map(row=>({...row,targets:(Array.isArray(row?.targets)?row.targets:[]).map(String).filter(id=>ids.has(id))})).filter(row=>row.targets.length);
const targetRows=(targets,ids,blocks)=>targets.map(id=>({id,blockId:ids.get(id),hash:blocks.has(ids.get(id))?blockHash(blocks.get(ids.get(id))):null}));
// The same issue found again can name a slightly different set of targets.
export const sameIssue=(a,b)=>a.kind===b.kind&&a.targets.some(target=>b.targets.some(other=>other.blockId===target.blockId));
export const targetsUnchanged=(finding,blocks)=>finding.targets.every(target=>blocks.has(target.blockId)&&blockHash(blocks.get(target.blockId))===target.hash);

export function provenanceFile(projectId,{root=ROOT,provenanceDir}={}){return path.join(provenanceDir??path.join(root,'booklets','provenance','pedagogy-review'),projectId+'.json');}
export function loadProvenance(file,project){
 return fs.existsSync(file)?read(file):{version:1,projectId:project.id,title:project.title,assumptions:{},findings:[],contextQuestions:[],protectedGroups:[],notReliablyReviewed:[]};
}
function saveProvenance(file,value){
 fs.mkdirSync(path.dirname(file),{recursive:true});
 const temporary=file+'.'+process.pid+'-'+Date.now()+'.tmp';
 try{fs.writeFileSync(temporary,JSON.stringify(value,null,1)+'\n',{flag:'wx'});fs.renameSync(temporary,file);}
 finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
}
const setState=(finding,state,note)=>{if(finding.state===state)return;finding.state=state;(finding.history??=[]).push({state,at:now(),...(note?{note}:{})});};

// Merge a review's findings into the record. A decided finding keeps its state;
// an unposted pending finding from a re-reviewed block that was not found again is removed.
export function mergeFindings(previous,found,{reviewedBlocks,blocks}){
 const byId=new Map(previous.map(finding=>[finding.id,finding])),kept=[],suppressed=[];
 // A rejected finding suppresses the same issue while its targets are unchanged; an
 // approved, deferred or posted one stands for it. A repaired issue found again is new.
 const known=finding=>byId.get(finding.id)??[...byId.values()].find(old=>sameIssue(old,finding)&&(old.state==='rejected'?targetsUnchanged(old,blocks):['approved','deferred'].includes(old.state)||old.state==='pending'&&old.commentId));
 for(const finding of found){
  const old=known(finding);
  if(old?.state==='rejected'&&targetsUnchanged(old,blocks)){suppressed.push(finding.id);continue;}
  if(old&&(old.state!=='pending'||old.commentId)&&!['rejected','stale','repaired'].includes(old.state)){kept.push(old);byId.delete(old.id);continue;}
  if(old?.id===finding.id)byId.delete(old.id);
  kept.push({...finding,state:'pending',history:[...(old?.id===finding.id?old.history??[]:[]),{state:'pending',at:now()}]});
 }
 for(const old of byId.values()){
  const reviewedAgain=old.targets.some(target=>reviewedBlocks.has(target.blockId));
  if(old.state==='pending'&&!old.commentId&&reviewedAgain)continue;
  kept.push(old);
 }
 return {findings:kept,suppressed};
}

// ---- workers ---------------------------------------------------------------------

function codexBinary(){
 const base=path.join(process.env.LOCALAPPDATA||'','OpenAI','Codex','bin');
 if(fs.existsSync(base))for(const name of fs.readdirSync(base)){const file=path.join(base,name,'codex.exe');if(fs.existsSync(file))return file;}
 return 'codex';
}
async function defaultRunner(options){
 process.env.BOOKLET_CODEX_BIN??=codexBinary();
 return (await import('../scripts/booklet/codex-transcription.mjs')).runAstraTask(options);
}
async function defaultLease(runDir,details,action){return (await import('../scripts/booklet/worker-pool.mjs')).withWorkerSlot(runDir,details,action);}
async function effortConfiguration(effort){
 if(!['low','medium','high'].includes(effort))throw Error('Unknown review stage effort');
 // Legacy stage labels do not select the superseded production model.
 return reviewConfiguration();
}
// A slot in the booklet's canonical run directory is the shared three-worker
// limit. The call itself runs from the review's own folder, which has no
// manifest, so each pass can use its own effort. Workers start outside the
// repository so they do not load its AGENTS.md.
async function callWorker({runner,lease,canonicalRunDir,workDir,stage,prompt,images=[],effort,taskReferences}){
 const out=path.join(workDir,'calls',stage+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,8)),cwd=path.join(os.tmpdir(),'mathsmap-pedagogy-review');
 fs.mkdirSync(cwd,{recursive:true});fs.mkdirSync(path.dirname(out),{recursive:true});
 const configuration=await effortConfiguration(effort),invoke=()=>runner({cwd,runDir:workDir,prompt,images,out,profile:'review',stage,configuration,...(taskReferences?{taskReferences}:{})});
 const {result,metrics}=await(canonicalRunDir?lease(canonicalRunDir,{stage,tool:'pedagogy-review'},invoke):invoke());
 return {result:taskReferences?taskReferences.decode(result):result,usage:metrics?.usage??null,elapsedMs:metrics?.elapsedMs??null,reviewConfiguration:{provider:metrics?.provider??configuration.provider,model:metrics?.model??configuration.model,effort:metrics?.effort??configuration.effort}};
}
export async function pool(items,concurrency,work){
 const queue=[...items.entries()];let failed=false,failure;
 await Promise.all(Array.from({length:Math.max(1,Math.min(concurrency,queue.length))},async()=>{
  while(queue.length&&!failed){const [index,item]=queue.shift();try{await work(item,index);}catch(error){if(!failed){failed=true;failure=error;}}}
 }));
 // Keep the owning runner alive until its already-started calls release leases.
 if(failed)throw failure;
}
export function canonicalRunDir(project,{root=ROOT}={}){
 const runId=project.source?.runId??project.runId,dir=runId&&path.join(root,'.booklet-work','full-imports',String(runId).replace(/[^\w.-]/g,'_'));
 return dir&&fs.existsSync(dir)?dir:null;
}
export function importReviewStatus(runDir){
 const file=runDir&&path.join(runDir,'lean-review','reviewed.json');
 if(!file||!fs.existsSync(file))return 'No lean review table found; this booklet\'s earlier acceptance route is not recorded here.';
 const rows=Object.values(read(file).questions??{});
 return `Lean content review table: ${rows.filter(row=>row.outcome==='passed').length} of ${rows.length} blocks passed.`;
}

// ---- review ----------------------------------------------------------------------

function challengePrompt({project,all,candidates,questions,ids,stored,library,root}){
 const numbering=numberingFor(project);
 const owners=new Set([...candidates,...questions].flatMap(row=>row.targets.map(id=>ids.get(id)))),position=new Map(all.flatMap((sequence,i)=>sequence.sections.flatMap(section=>(section.blocks??[]).map(block=>[block.id,i]))));
 const last=Math.max(...[...owners].map(id=>position.get(id)??0)),concerned=new Set([...owners].map(id=>position.get(id)));
 const teachingOf=i=>({topic:all[i].id,title:all[i].title,sections:all[i].sections.filter(section=>section.phase==='teaching').map(section=>({title:section.title??null,blocks:(section.blocks??[]).map(block=>compactBlock(block,section,numbering))}))});
 // Topics with candidates always go in full; others nearest first while they fit.
 const teaching=new Map([...concerned].map(i=>[i,teachingOf(i)]));let used=JSON.stringify([...teaching.values()]).length,complete=true;
 for(let i=last;i>=0;i--){if(teaching.has(i))continue;const value=teachingOf(i);if(!value.sections.some(section=>section.blocks.length))continue;const size=JSON.stringify(value).length;if(used+size>LIMITS.challengeCharacters){complete=false;continue;}teaching.set(i,value);used+=size;}
 // A claim about how the practice rises can only be checked against the whole exercise.
 const whole=new Set(candidates.filter(candidate=>['difficulty-jump','unsupported-transition'].includes(candidate.kind)).map(candidate=>candidate.sequence));
 const practice=all.flatMap(sequence=>sequence.sections.filter(section=>section.phase==='practice').flatMap(section=>(section.blocks??[]).filter(block=>whole.has(sequence.id)||owners.has(block.id)).map(block=>({topic:sequence.id,...compactBlock(block,section,numbering)}))));
 const payload={booklet:project.title,numbering:NUMBERING_NOTE,assumptions:assumptions(project,stored,library),candidates:candidates.map(({id,sequence,...rest})=>({id,topic:sequence,...rest})),contextQuestions:questions.map(({id,sequence,targets,question})=>({id,topic:sequence,targets,question})),teaching:[...teaching.entries()].sort((a,b)=>a[0]-b[0]).map(([,value])=>value),teachingComplete:complete,practice,topicOrder:all.slice(0,last+1).map(sequence=>sequence.id)};
 return reviewTask(project,payload,contract('challenge',{root})+'\n\n'+bookletPrinciples({root})+'\n\n'+CHALLENGE_OUTPUT+'\n\nThe first reader\'s instructions, which are the standard:\n\n'+contract('review',{root}));
}
export async function runReview({projectFile,root=ROOT,topics=[],reviewEffort='high',challengeEffort='high',candidatesOnly=false,concurrency=LIMITS.concurrency,runner=defaultRunner,lease=defaultLease,provenanceDir,workDir,skills,library,runDir,resumeFrom,principlesOnly=false,reportOnly=false}={}){
 if(!Number.isInteger(concurrency)||concurrency<1||concurrency>LIMITS.concurrency)throw Error('Use one to three workers');
 const project=read(projectFile),all=sequences(project);
 if(!all.some(sequence=>instructionalSections(sequence).length))throw Error('This project has no teaching content; the pedagogy review does not apply.');
 const topicSelection=topics.length?all.filter(sequence=>topics.includes(sequence.id)||topics.includes(sequence.topicId)):all;
 const selected=principlesOnly?topicSelection.filter(sequence=>instructionalSections(sequence).length):topicSelection;
 if(!selected.length)throw Error('No sequence matches --topics');
 skills??=fs.existsSync(path.join(root,'data','skills.json'))?read(path.join(root,'data','skills.json')):[];
 runDir??=canonicalRunDir(project,{root});workDir??=path.join(root,'.booklet-work','pedagogy-review',project.id);library??=courseLibrary(project,{root});
 const file=provenanceFile(project.id,{root,provenanceDir}),record=loadProvenance(file,project),blocks=blocksById(project);
 const ids=new Map(all.flatMap(sequence=>[...visibleIds(sequence)])),rejected=(record.findings??[]).filter(finding=>finding.state==='rejected'&&targetsUnchanged(finding,blocks));
 const candidates=[],context=[],groups=[],unreliable=[],rows=[],errors=[];
 const recovered=resumeFrom?read(resumeFrom.candidateFile):null;
 if(recovered&&(recovered.projectId!==project.id||recovered.revision!==project.revision||recovered.errors?.length))throw Error('Saved pedagogy results do not match the current project revision or contain errors.');
 if(recovered){candidates.push(...recovered.candidates);context.push(...recovered.contextQuestions);groups.push(...recovered.protectedGroups);unreliable.push(...recovered.notReliablyReviewed);rows.push(...recovered.sequences);}
 else await pool(selected,concurrency,async sequence=>{
  const index=all.indexOf(sequence),own=visibleIds(sequence),images=sequenceImages(sequence,runDir);
  const decided=rejected.filter(finding=>finding.targets.some(target=>own.has(target.id))).map(finding=>({kind:finding.kind,targets:finding.targets.map(target=>target.id),finding:finding.finding}));
  const row={id:sequence.id,title:sequence.title,blocks:sequence.sections.reduce((count,section)=>count+(section.blocks?.length??0),0),images:images.files.length,imagesExpected:images.expected};rows.push(row);
  try{
   const {result,usage,elapsedMs,reviewConfiguration:actualConfiguration}=await callWorker({runner,lease,canonicalRunDir:runDir,workDir,stage:'pedagogy-review',...reviewPrompt({project,all,index,skills,decided,images,stored:record.assumptions,library,root,task:true,principlesOnly}),images:images.files,effort:reviewEffort});
   Object.assign(row,{usage,elapsedMs,reviewConfiguration:actualConfiguration,candidates:0,discarded:[],working:result?.working??null});
   for(const raw of Array.isArray(result?.candidates)?result.candidates:[]){
    if(principlesOnly&&raw.kind!=='example-principle')continue;
    const {value,error}=normalise(raw,own);
    if(error){row.discarded.push(error);continue;}
    if(rejected.some(finding=>sameIssue(finding,{kind:value.kind,targets:value.targets.map(id=>({blockId:own.get(id)}))}))){row.discarded.push('already rejected');continue;}
    candidates.push({...value,sequence:sequence.id});row.candidates++;
   }
   // At most one suggestion of each kind for a topic.
   const offered=new Set();row.suggestions=0;
   for(const raw of principlesOnly?[]:Array.isArray(result?.suggestions)?result.suggestions:[]){
    const {value,error}=normalise(suggestionCandidate(raw),own);
    if(error||!SUGGESTION_KINDS.includes(value.kind)||offered.has(value.kind)){row.discarded.push(error??'more than one '+value.kind+' suggestion');continue;}
    if(rejected.some(finding=>sameIssue(finding,{kind:value.kind,targets:value.targets.map(id=>({blockId:own.get(id)}))}))){row.discarded.push('already rejected');continue;}
    offered.add(value.kind);candidates.push({...value,sequence:sequence.id});row.suggestions++;
   }
   context.push(...scoped(result?.contextQuestions,own).filter(item=>text(item.question)).map(item=>({sequence:sequence.id,targets:item.targets,question:text(item.question)})));
   groups.push(...scoped(result?.protectedGroups,own).map(item=>({sequence:sequence.id,targets:item.targets,observation:text(item.observation),varies:text(item.varies),invariant:text(item.invariant)})));
   unreliable.push(...scoped(result?.notReliablyReviewed,own).map(item=>({sequence:sequence.id,targets:item.targets,reason:text(item.reason)})));
  }catch(error){row.error=error.message;errors.push(sequence.id+': '+error.message);}
 });
 for(const candidate of principlesOnly?[]:duplicateQuestionCandidates(all,{topics:selected.map(sequence=>sequence.id)})){
  if(rejected.some(finding=>sameIssue(finding,{kind:candidate.kind,targets:candidate.targets.map(id=>({blockId:ids.get(id)}))})))continue;
  if(candidates.some(row=>row.kind===candidate.kind&&row.targets.length===candidate.targets.length&&candidate.targets.every(id=>row.targets.includes(id))))continue;
  candidates.push(candidate);
  const row=rows.find(row=>row.id===candidate.sequence);if(row)row.candidates=(row.candidates??0)+1;
 }
 rows.sort((a,b)=>all.findIndex(sequence=>sequence.id===a.id)-all.findIndex(sequence=>sequence.id===b.id));
 candidates.sort((a,b)=>all.findIndex(sequence=>sequence.id===a.sequence)-all.findIndex(sequence=>sequence.id===b.sequence));
 candidates.forEach((candidate,i)=>{candidate.id='c'+(i+1);});
 context.sort((a,b)=>all.findIndex(sequence=>sequence.id===a.sequence)-all.findIndex(sequence=>sequence.id===b.sequence));
 context.forEach((question,i)=>{question.id='q'+(i+1);});
 fs.mkdirSync(workDir,{recursive:true});
 const actualReview=passIdentity(rows,recovered?record.passes?.review??recovered.reviewConfiguration:undefined);
 const candidateFile=resumeFrom?.candidateFile??path.join(workDir,`candidates-${actualReview.effort}-${Date.now()}.json`);
 if(!recovered)fs.writeFileSync(candidateFile,JSON.stringify({projectId:project.id,revision:project.revision??null,effort:actualReview.effort,reviewConfiguration:actualReview,sequences:rows,candidates,contextQuestions:context,protectedGroups:groups,notReliablyReviewed:unreliable,errors},null,1)+'\n');
 if(candidatesOnly)return {projectId:project.id,effort:actualReview.effort,reviewConfiguration:actualReview,sequences:rows.length,candidates:candidates.map(({id,sequence,kind,severity,targets,finding})=>({id,sequence,kind,severity,targets,finding})),candidateFile,errors};

 const found=[],dropped=[],unchecked=[],droppedQuestions=[],challenge={};let questions=context;
 if(candidates.length||context.length){
  try{
   const {result,usage,elapsedMs,reviewConfiguration:actualConfiguration}=recovered?{result:read(resumeFrom.challengeResultFile)}:await callWorker({runner,lease,canonicalRunDir:runDir,workDir,stage:'pedagogy-challenge',...challengePrompt({project,all,candidates,questions:context,ids,stored:record.assumptions,library,root}),effort:challengeEffort});
   Object.assign(challenge,{usage,elapsedMs,...(actualConfiguration?{reviewConfiguration:actualConfiguration}:{})});
   const known=new Set(candidates.map(candidate=>candidate.id)),seen=new Set();
   for(const raw of Array.isArray(result?.findings)?result.findings:[]){
    const from=(Array.isArray(raw?.from)?raw.from:[]).map(String).filter(id=>known.has(id)),{value,error}=normalise(raw,ids);
    from.forEach(id=>seen.add(id));
    if(error||!from.length){dropped.push({ids:from,reason:error??'finding names no candidate'});continue;}
    found.push({id:findingId(value.kind,value.targets),...value,...(actualConfiguration?{reviewConfiguration:actualConfiguration}:{}),targets:targetRows(value.targets,ids,blocks),from,sequences:[...new Set(candidates.filter(candidate=>from.includes(candidate.id)).map(candidate=>candidate.sequence))]});
   }
   for(const row of Array.isArray(result?.dropped)?result.dropped:[])if(known.has(String(row?.id))){seen.add(String(row.id));dropped.push({ids:[String(row.id)],reason:text(row.reason)});}
   for(const row of Array.isArray(result?.unchecked)?result.unchecked:[])if(known.has(String(row?.id))){seen.add(String(row.id));unchecked.push({id:String(row.id),reason:text(row.reason)});}
   // A candidate the second reader never mentioned is neither confirmed nor refuted.
   for(const id of known)if(!seen.has(id))unchecked.push({id,reason:'The challenge pass returned no decision.'});
   // Questions the second reader kept, merged or reworded; one it never mentioned stays as asked.
   const asked=new Map(context.map(question=>[question.id,question])),decided=new Set(),kept=[];
   for(const row of scoped(result?.contextQuestions,ids).filter(item=>text(item.question))){const from=(Array.isArray(row.from)?row.from:[]).map(String).filter(id=>asked.has(id));from.forEach(id=>decided.add(id));kept.push({sequence:asked.get(from[0])?.sequence??null,targets:row.targets,question:text(row.question)});}
   for(const row of Array.isArray(result?.droppedQuestions)?result.droppedQuestions:[])if(asked.has(String(row?.id))&&!decided.has(String(row.id))){decided.add(String(row.id));droppedQuestions.push({question:asked.get(String(row.id)).question,targets:asked.get(String(row.id)).targets,reason:text(row.reason)});}
   questions=[...kept,...context.filter(question=>!decided.has(question.id))];
  }catch(error){challenge.error=error.message;errors.push('challenge: '+error.message);candidates.forEach(candidate=>unchecked.push({id:candidate.id,reason:'The challenge pass failed.'}));}
 }
 const describe=id=>{const candidate=candidates.find(row=>row.id===id);return candidate?{id,sequence:candidate.sequence,kind:candidate.kind,targets:candidate.targets,finding:candidate.finding}:{id};};
 const reviewedBlocks=new Set(selected.flatMap(sequence=>sequence.sections.flatMap(section=>(section.blocks??[]).map(block=>block.id)))),inScope=row=>row.targets.some(id=>reviewedBlocks.has(ids.get(id)));
 const merged=challenge.error?{findings:record.findings??[],suppressed:[]}:mergeFindings(record.findings??[],found,{reviewedBlocks,blocks});
 Object.assign(record,{...(reportOnly?{reportOnly:true}:{}),projectId:project.id,title:project.title,reviewedRevision:project.revision??null,reviewedAt:now(),passes:{review:passIdentity(rows,recovered?record.passes?.review??recovered.reviewConfiguration:undefined),challenge:passIdentity(candidates.length||context.length?[challenge]:[],recovered?record.passes?.challenge:undefined)},importReview:importReviewStatus(runDir),questionOrder:project.settings?.questionOrder??null,findings:merged.findings,
  contextQuestions:[...(record.contextQuestions??[]).filter(row=>!inScope(row)),...questions.map(({id,...question})=>question)],protectedGroups:[...(record.protectedGroups??[]).filter(row=>!inScope(row)),...groups],notReliablyReviewed:[...(record.notReliablyReviewed??[]).filter(row=>!inScope(row)),...unreliable],
  lastRun:{sequences:rows.map(({working,...row})=>row),dropped:dropped.map(row=>({...row,candidates:row.ids.map(describe)})),unchecked:unchecked.map(row=>({...row,candidate:describe(row.id)})),suppressed:merged.suppressed,droppedQuestions,candidateFile:path.relative(root,candidateFile).replaceAll('\\','/'),errors}});
 if(recovered)record.lastRun.recoveredFrom={candidateFile:resumeFrom.candidateFile,challengeResultFile:resumeFrom.challengeResultFile,at:now(),newModelCalls:0};
 saveProvenance(file,record);
 return {...summary(record,project),provenance:path.relative(root,file).replaceAll('\\','/'),errors};
}
export function summary(record,project){
 const live=(record.findings??[]).filter(finding=>['pending','approved'].includes(finding.state)),open=live.filter(finding=>!isSuggestion(finding)),ideas=live.filter(isSuggestion),structural=open.filter(isStructural);
 const brief=finding=>({id:finding.id,state:finding.state,severity:finding.severity,kind:finding.kind,targets:finding.targets.map(target=>target.id),finding:finding.finding,repair:finding.repair});
 return {project:record.projectId,revision:project?.revision??record.reviewedRevision,scope:{sequencesReviewed:record.lastRun?.sequences?.length??0,candidates:record.lastRun?.sequences?.reduce((count,row)=>count+(row.candidates??0),0)??0},assumptions:{delivery:'teacher-led',...record.assumptions},importReview:record.importReview,questionOrder:record.questionOrder??'not pinned: the exercise organiser may sort by reasoning score',
  counts:{severe:open.filter(finding=>finding.severity==='severe').length,high:open.filter(finding=>finding.severity==='high').length,structural:structural.length,suggestions:ideas.length,contextQuestions:record.contextQuestions?.length??0,protectedGroups:record.protectedGroups?.length??0,notReliablyReviewed:record.notReliablyReviewed?.length??0,dropped:record.lastRun?.dropped?.length??0,unchecked:record.lastRun?.unchecked?.length??0,suppressed:record.lastRun?.suppressed?.length??0},
  holdBeforeFinalExport:structural.length>0,
  findings:open.map(brief),suggestions:ideas.map(brief),contextQuestions:record.contextQuestions??[],notReliablyReviewed:record.notReliablyReviewed??[]};
}

// ---- Studio comments ---------------------------------------------------------------

export function commentNote(finding){
 const others=finding.targets.slice(1).map(target=>target.id);
 // The audit retains derivations, assumptions and acceptance conditions. Studio
 // needs the specific concern and proposed action, without repeating that record.
 if(isSuggestion(finding))return [`[Pedagogy review · Suggestion · ${finding.kind} · ${finding.id}]`,finding.finding,others.length&&'Also relates to: '+others.join(', '),'Proposed addition: '+finding.repair.proposal].filter(Boolean).join('\n');
 return [`[Pedagogy review · ${finding.severity==='severe'?'Severe':'High priority'} · ${finding.kind} · ${finding.id}]`,finding.finding,others.length&&'Also affects: '+others.join(', '),`Proposed repair (${finding.repair.type}): ${finding.repair.proposal}`,finding.repair.type==='add-teaching'&&finding.breakdown&&'Why teaching is needed: '+finding.breakdown].filter(Boolean).join('\n');
}
async function projectHandle(projectFile,root){return (await import('../scripts/booklet/lean-review.mjs')).openProject(projectFile,{root});}
const flagsOf=project=>project.studio?.flags??[];
export async function postFindings({projectFile,root=ROOT,provenanceDir,suggestions=false,findingIds}={}){
 const {createFeedback}=await import('../src/lib/booklet-feedback.js');
 const handle=await projectHandle(projectFile,root),project=handle.project,file=provenanceFile(project.id,{root,provenanceDir}),record=loadProvenance(file,project),blocks=blocksById(project);
 if(record.reportOnly===true)throw Error('Report-only review evidence cannot be posted. Author any new student-facing draft with exact Sonnet 5.5 and independently check it before using the comments-only draft route.');
 const posted=[],stale=[],present=[];
 const selected=findingIds&&new Set(findingIds);
 if(selected)for(const id of selected)if(!record.findings.some(finding=>finding.id===id))throw Error('Unknown finding '+id);
 for(const finding of record.findings??[]){
  if(selected&&!selected.has(finding.id))continue;
  if(finding.state!=='pending'||isSuggestion(finding)&&!suggestions)continue;
  if(flagsOf(project).some(flag=>flag.findingId===finding.id)){present.push(finding.id);continue;}
  if(finding.commentId)continue; // posted before and since removed: status decides what that means
  if(!targetsUnchanged(finding,blocks)){setState(finding,'stale','A target changed before posting.');stale.push(finding.id);continue;}
  const flag={...createFeedback(project,{rootId:finding.targets[0].id,edition:'student'},commentNote(finding),'local'),kind:'pedagogy-review',findingId:finding.id,severity:finding.severity};
  project.studio={version:1,...project.studio,flags:[...flagsOf(project),flag]};
  finding.commentId=flag.id;finding.postedAt=flag.at;posted.push(finding.id);
 }
 let lost=[];
 if(posted.length){
  await handle.save();
  const saved=read(handle.file);
  lost=posted.filter(id=>!flagsOf(saved).some(flag=>flag.findingId===id&&flag.kind==='pedagogy-review'));
  record.postedRevision=saved.revision??null;
 }
 saveProvenance(file,record);
 return {project:project.id,posted,alreadyPresent:present,stale,revision:record.postedRevision??project.revision??null,errors:lost.length?['The saved project is missing comments for '+lost.join(', ')]:[]};
}
// States come from the project's comments: deleted means rejected, resolved
// means repaired. An open comment is pending, never approval.
export async function reconcile({projectFile,root=ROOT,provenanceDir,approve=[],defer=[],resolve=[],reject=[],assume}={}){
 const {feedbackStatus}=await import('../src/lib/booklet-feedback.js');
 const handle=await projectHandle(projectFile,root),project=handle.project,file=provenanceFile(project.id,{root,provenanceDir}),record=loadProvenance(file,project),blocks=blocksById(project),errors=[];
 const byId=new Map((record.findings??[]).map(finding=>[finding.id,finding]));
 for(const id of [...approve,...defer,...resolve,...reject])if(!byId.has(id))errors.push('Unknown finding '+id);
 for(const finding of record.findings??[]){
  const flag=flagsOf(project).find(row=>row.findingId===finding.id);
  if(finding.commentId&&!flag){if(['pending','approved','stale'].includes(finding.state))setState(finding,'rejected','Its comment was deleted in Studio.');continue;}
  if(flag?.resolved){setState(finding,'repaired','Its comment was resolved in Studio.');continue;}
  if(finding.state==='pending'&&(flag&&feedbackStatus(project,flag)==='Target removed'||!targetsUnchanged(finding,blocks)))setState(finding,'stale','A target changed or was removed before approval.');
 }
 for(const id of approve){
  const finding=byId.get(id);if(!finding)continue;
  if(finding.state==='approved')continue;
  if(finding.state!=='pending'||!targetsUnchanged(finding,blocks)){errors.push(`${id} cannot be approved: it is ${finding.state==='pending'?'stale':finding.state}. Review the topic again.`);if(finding.state==='pending')setState(finding,'stale','A target changed before approval.');continue;}
  setState(finding,'approved','Named by the user.');
 }
 // The user can reject in chat as well as by deleting a comment; any posted comment goes with it.
 const withdrawn=[];
 for(const id of reject){
  const finding=byId.get(id);if(!finding||finding.state==='rejected')continue;
  if(flagsOf(project).some(flag=>flag.findingId===id)){project.studio={...project.studio,flags:flagsOf(project).filter(flag=>flag.findingId!==id)};withdrawn.push(id);}
  setState(finding,'rejected','Rejected by the user.');
 }
 for(const id of defer){
  const finding=byId.get(id);if(!finding||!['pending','approved'].includes(finding.state))continue;
  if(flagsOf(project).some(flag=>flag.findingId===id)){project.studio={...project.studio,flags:flagsOf(project).filter(flag=>flag.findingId!==id)};withdrawn.push(id);}
  setState(finding,'deferred','Withdrawn at the user\'s request.');
 }
 // Resolving is the last step of a repair: only an approved finding, and only after its done-when check.
 const resolved=[];
 for(const id of resolve){
  const finding=byId.get(id);if(!finding)continue;
  if(finding.state!=='approved'){errors.push(`${id} cannot be resolved: it is ${finding.state}, not approved.`);continue;}
  const flags=flagsOf(project);
  if(flags.some(flag=>flag.findingId===id)){project.studio={...project.studio,flags:flags.map(flag=>flag.findingId===id?{...flag,resolved:true,resolvedAt:now(),resolution:'Repaired after approval; the done-when condition was checked.'}:flag)};resolved.push(id);}
  setState(finding,'repaired','Repaired and resolved.');
 }
 if(withdrawn.length||resolved.length)await handle.save();
 if(text(assume))(record.assumptions.answers??=[]).push({at:now(),text:text(assume)});
 saveProvenance(file,record);
 const states={};for(const finding of record.findings??[])(states[finding.state]??=[]).push(finding.id);
 return {project:project.id,states,approved:(record.findings??[]).filter(finding=>finding.state==='approved').map(finding=>({id:finding.id,kind:finding.kind,targets:finding.targets.map(target=>target.id),repair:finding.repair,doneWhen:finding.doneWhen})),errors};
}

// Archive and remove every still-open pending finding of a booklet so the next
// review starts fresh. Unlike deleting a comment in Studio this is not a rejection:
// the findings move to an archive file and leave the live record.
export async function withdraw({projectFile,root=ROOT,provenanceDir,archiveDir,stamp=new Date().toISOString().slice(0,10).replaceAll('-','')}={}){
 const handle=await projectHandle(projectFile,root),project=handle.project,file=provenanceFile(project.id,{root,provenanceDir}),record=loadProvenance(file,project);
 const flags=flagsOf(project),moved=[],commentIds=new Set();
 for(const finding of record.findings??[]){
  if(finding.state!=='pending')continue;
  const flag=flags.find(row=>row.findingId===finding.id&&row.kind==='pedagogy-review');
  if(finding.commentId&&!flag)continue; // comment already gone: reconcile owns that
  if(flag?.resolved)continue;
  if(flag)commentIds.add(flag.id);
  moved.push(finding);
 }
 if(!moved.length)return {project:project.id,withdrawn:[],archive:null};
 const dir=archiveDir??path.join(path.dirname(file),'archive'),archive=path.join(dir,project.id+'-'+stamp+'.json');
 const previous=fs.existsSync(archive)?read(archive):{version:1,projectId:project.id,findings:[]};
 for(const finding of moved)setState(finding,'withdrawn','Withdrawn before a fresh review.');
 previous.findings.push(...moved);
 fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(archive,JSON.stringify(previous,null,1)+'\n');
 if(commentIds.size){
  project.studio={...project.studio,flags:flags.filter(flag=>!commentIds.has(flag.id))};
  await handle.save();
  const saved=read(handle.file);
  const left=moved.filter(finding=>flagsOf(saved).some(flag=>flag.findingId===finding.id));
  if(left.length)throw Error('The saved project still has comments for '+left.map(finding=>finding.id).join(', '));
  record.postedRevision=saved.revision??null;
 }
 const gone=new Set(moved.map(finding=>finding.id));
 record.findings=record.findings.filter(finding=>!gone.has(finding.id));
 saveProvenance(file,record);
 return {project:project.id,withdrawn:[...gone],archive:path.relative(root,archive).replaceAll('\\','/')};
}

// ---- format results (after final pagination only) ---------------------------------

export function formatResults(project,pages){
 const pagesOf=new Map();
 for(const page of pages??[])for(const entry of page.blocks??[]){const id=typeof entry==='string'?entry:entry?.id;if(id)pagesOf.set(id,[...(pagesOf.get(id)??[]),page.page]);}
 const span=ids=>[...new Set(ids.flatMap(id=>pagesOf.get(id)??[]))].sort((a,b)=>a-b),results=[];
 for(const sequence of sequences(project)){
  const ordered=sequence.sections.flatMap(section=>section.blocks??[]),opening=[];
  for(const block of ordered){if(block.pedagogyRole==='review')opening.push(block.id);else if(opening.length)break;else if(block.pedagogyRole)break;}
  const reviewPages=span(opening);
  if(reviewPages.length>1)results.push({kind:'opening-review-length',sequence:sequence.id,targets:opening,pages:reviewPages,note:`The opening review spans ${reviewPages.length} pages; the limit is one.`});
  ordered.forEach((block,i)=>{
   const next=ordered[i+1];
   if(block.pedagogyRole==='example'&&next?.pedagogyRole==='guided-practice'){const a=span([block.id]),b=span([next.id]);if(a.length&&b.length&&!a.some(page=>b.includes(page)))results.push({kind:'example-and-guided-practice-apart',sequence:sequence.id,targets:[block.id,next.id],pages:[...a,...b],note:'The worked example and its guided practice are on different pages.'});}
   const own=span([block.id]);
   if(own.length>1&&hasFigure(block))results.push({kind:'figure-block-split',sequence:sequence.id,targets:[block.id],pages:own,note:'A block with a diagram continues across pages; check the diagram stays with what refers to it.'});
  });
 }
 return results;
}
export function runFormat({projectFile,exportDir,root=ROOT,provenanceDir}){
 const project=read(projectFile),report=read(path.join(exportDir,'report.json')).report?.[project.id]?.student;
 if(!report?.map)throw Error('The export has no student page map for '+project.id);
 const results=formatResults(project,report.map),file=provenanceFile(project.id,{root,provenanceDir}),record=loadProvenance(file,project);
 record.formatResults={exportDir:path.relative(root,path.resolve(exportDir)).replaceAll('\\','/'),projectHash:report.projectHash??null,at:now(),results};saveProvenance(file,record);
 return {project:project.id,formatResults:results};
}

// ---- seeded calibration --------------------------------------------------------------

// Compare a review of the seeded fixture with its planted cases.
export function scoreSeeded(project,record){
 const expected=project.seeded?.expected??{},owner=new Map(sequences(project).flatMap(sequence=>[...visibleIds(sequence)]));
 const touches=(row,targets)=>{const blocks=new Set(targets.map(id=>owner.get(id)??id));return (row.targets??[]).some(target=>{const id=typeof target==='string'?target:target.id;return targets.includes(id)||blocks.has(owner.get(id)??id);});};
 const findings=(record.findings??[]).filter(finding=>finding.state==='pending'&&!isSuggestion(finding)),soft=[...(record.notReliablyReviewed??[]),...(record.contextQuestions??[])];
 const failures=(expected.failures??[]).map(item=>({name:item.name,hit:findings.some(finding=>touches(finding,item.targets)&&(!item.kinds?.length||item.kinds.includes(finding.kind)))}));
 const nonFailures=(expected.nonFailures??[]).map(item=>({name:item.name,falseAlarms:findings.filter(finding=>touches(finding,item.targets)&&(!item.kinds?.length||item.kinds.includes(finding.kind))).map(finding=>finding.kind+': '+finding.finding)}));
 const notReliable=(expected.notReliable??[]).map(item=>({name:item.name,flagged:soft.some(row=>touches(row,item.targets)),asserted:findings.some(finding=>touches(finding,item.targets)&&(item.kinds??[]).includes(finding.kind))}));
 return {failures,nonFailures,notReliable,missed:failures.filter(row=>!row.hit).map(row=>row.name),falseAlarms:nonFailures.filter(row=>row.falseAlarms.length).map(row=>row.name),ok:failures.every(row=>row.hit)&&nonFailures.every(row=>!row.falseAlarms.length)&&notReliable.every(row=>!row.asserted)};
}
export async function runSeeded({root=ROOT,reviewEffort='low',runner,lease,fixture=path.join(root,'tests','fixtures','pedagogy-seeded.json')}={}){
 const workDir=path.join(root,'.booklet-work','pedagogy-review','seeded-'+reviewEffort),project=read(fixture);
 fs.rmSync(path.join(workDir,project.id+'.json'),{force:true});
 const result=await runReview({projectFile:fixture,root,reviewEffort,provenanceDir:workDir,workDir,skills:[],...(runner?{runner}:{}),...(lease?{lease}:{})});
 return {...scoreSeeded(project,read(path.join(workDir,project.id+'.json'))),effort:reviewEffort,counts:result.counts,findings:result.findings,errors:result.errors};
}

// ---- routine archetype pilot (no project mutation) -----------------------------
export function routineQuestions(sequence,{numbering}={}){
 const questions=[],unrated=[];
 for(const section of sequence.sections){
  const role=endSectionRole(section,{topics:[{id:section.topicId,title:sequence.title}]});
  if(section.phase!=='practice'||['challenge','exam'].includes(role))continue;
  for(const block of section.blocks??[]){
   if(block.type!=='question'||isExplicitTeachingBlock(block)||isTheoryReview(block,section))continue;
   const score=block.classification?.reasoningScore;
   if(!Number.isFinite(score)){unrated.push(block.id);continue;}
   if(score<65)questions.push({id:block.id,reasoningScore:score,block:compactBlock(block,section,numbering)});
  }
 }
 return {questions,unrated};
}
export function archetypePrompt(project,sequence,{root=ROOT,all=sequences(project),skills,task=false}={}){
 const numbering=numberingFor(project),{questions}=routineQuestions(sequence,{numbering});
 skills??=fs.existsSync(path.join(root,'data','skills.json'))?read(path.join(root,'data','skills.json')):[];
 const index=all.findIndex(s=>s.id===sequence.id),facts=skillFacts(index<0?[sequence]:all,index<0?0:index,skills);
 const approvedPriorKnowledge=project.library?.courseId==='s6-ext1-11'?['substitute-into-expressions','function-notation']:[];
 const view=reviewTask(project,{booklet:project.title,numbering:NUMBERING_NOTE,courseId:project.library?.courseId,topicId:sequence.topicId,skills:facts,approvedPriorKnowledge,earlierTeaching:earlierTeaching(all,index<0?0:index,{numbering}),teaching:sequencePayload({...sequence,sections:instructionalSections(sequence)},numbering),routineQuestions:questions},'Read-only routine-archetype and independent-practice-item audit. Cluster by mathematical decision/method, never wording or numbers alone. Map every listed routine question exactly once. coverage covered = example or explicit teaching supplies the method; preserve empty exampleIds when no worked example exists and do not invent one for direct application of a stated rule; bridge = modest step up best served by scaffolded questions; missing = genuinely different new untaught archetype, not a familiar prerequisite; prior-knowledge = prerequisite justified by skill/context evidence. Prior knowledge is never a missing worked example: any worthwhile retrieval belongs in the opening review block, and James decides whether to add it. Do not generate new content, questions, examples or wording. Additional worked-example drafts remain Studio comments pending individual James approval; calibration never approves insertion. Examine teaching earlier in this booklet before claiming a gap. Apply the substitution/function-evaluation prior-knowledge approval ONLY when courseId is s6-ext1-11 and approvedPriorKnowledge lists it; never transfer it to Stage5 or other courses. Each prerequisite verdict cites prerequisiteIds and evidence; its reviewStatus is pending-user-decision. Only exact example-role IDs go in exampleIds; identification/definitions belong in teachingIds; a method or scaffold supplied inside an earlier practice question belongs in practiceEvidenceIds, not teachingIds. A mere unsolved exercise is not supplied teaching. Exclude Challenge/Exam. For each question, enumerate practiceItems as independent complete attempts, grouping dependent steps together. Count independently answerable labelled asks separately even when they share a given polynomial: term count, each requested coefficient and constant-term identification are separate attempts. Shared givens alone are not dependency. A dedicated complete feature-grid row for one polynomial is ONE attempt, not five cells; three unknowns solved jointly is ONE attempt; separately posed evaluations/independent polynomials may be separate. Every practiceItems nodeId must belong to that question. For heterogeneous independent parts, an item may carry optional archetype naming an existing cluster id in THIS topic; omitted means inherit the question primary archetype. Keep each question mapped to exactly one primary cluster, and count independent parts for their own archetypes. When a part has its own method but no whole question belongs primarily to it, use an explicit itemOnly:true cluster with questionIds:[] and at least one valid practiceItems.archetype reference. An unreferenced empty cluster is invalid. For example, prior-knowledge volume-formula retrieval is not another complete cubic-model attempt; its item-only cluster can set routine:false to keep an opening-Review decision separate from routine-practice targets. Dependent scaffold steps count together, and three independent items never means three whole blocks. Never invent a new skill or use an item-only cluster to leave a whole question unmapped. Return JSON only: {"clusters":[{"id":"short stable slug","questionIds":["id"],"exampleIds":[],"guidedPracticeIds":[],"teachingIds":[],"practiceEvidenceIds":[],"coverage":"covered|bridge|missing|prior-knowledge","prerequisiteIds":[],"evidence":"specific teaching/prerequisite evidence","reviewStatus":"pending-user-decision","rationale":"specific reasoning"}],"practiceItems":{"each-question-id":[{"nodeIds":["question/part id"],"rationale":"why this is one independent attempt","archetype":"optional existing same-topic cluster id"}]}}.\n\n');
 return task?view:view.prompt;
}
export function validateArchetypes(project,sequence,result,{responseAnchors}={}){
 const {questions,unrated}=routineQuestions(sequence),eligible=new Map(questions.map(q=>[q.id,q])),seen=new Set(),ids=visibleIds(sequence),errors=[];
 const clusters=Array.isArray(result?.clusters)?result.clusters:[];
 const clusterIds=new Set();
 for(const c of clusters){
  if(!text(c.id)||clusterIds.has(c.id))errors.push('Missing or duplicate archetype id');clusterIds.add(c.id);
  if(!['covered','bridge','missing','prior-knowledge'].includes(c.coverage)||!text(c.rationale))errors.push('Invalid coverage or absent rationale: '+c.id);
  if(c.itemOnly===true){if(!Array.isArray(c.questionIds)||c.questionIds.length)errors.push('Item-only archetype must have empty questionIds: '+c.id);}
  else if(!Array.isArray(c.questionIds)||!c.questionIds.length)errors.push('Empty archetype: '+c.id);
  for(const id of c.questionIds??[]){if(!eligible.has(id)||seen.has(id))errors.push('Unknown or repeated routine question '+id);seen.add(id);}
  const all=sequences(project),position=all.findIndex(s=>s.id===sequence.id),context=position<0?[sequence]:all.slice(0,position+1);
  const teaching=context.flatMap(s=>instructionalSections(s)).flatMap(s=>s.blocks??[]),teachingIds=new Map(context.flatMap(s=>[...visibleIds(s)]));
  for(const id of c.practiceEvidenceIds??[]){if(!teachingIds.has(id))errors.push('Unknown current/earlier practice evidence: '+id);}
  for(const id of c.teachingIds??[]){if(!teaching.some(b=>b.id===teachingIds.get(id)))errors.push('Not a teaching target: '+id);}
  for(const [field,role] of [['exampleIds','example'],['guidedPracticeIds','guided-practice']])for(const id of c[field]??[]){const owner=teachingIds.get(id);if(!teaching.some(b=>b.id===owner&&(b.pedagogyRole===role||(role==='example'&&(b.type==='worked-example'||b.pedagogyRole==='worked-example')))))errors.push('Not a '+role+' target: '+id);}
  if(c.coverage==='prior-knowledge'&&(!(c.prerequisiteIds??[]).length||!text(c.evidence)||c.reviewStatus!=='pending-user-decision'))errors.push('Prior knowledge needs evidence and pending user review: '+c.id);
  if(c.coverage==='covered'&&!(c.exampleIds??[]).length&&!(c.teachingIds??[]).length&&!(c.practiceEvidenceIds??[]).length)errors.push('Covered archetype lacks teaching/example evidence: '+c.id);
 }
 for(const q of questions)if(!seen.has(q.id))errors.push('Unmapped routine question '+q.id);
 const itemReferences=new Set();
 for(const [id,items] of Object.entries(result.practiceItems??{})){
  if(!eligible.has(id)||!Array.isArray(items)||!items.length){errors.push('Invalid practice items for '+id);continue;}
  const block=sequence.sections.flatMap(section=>section.blocks??[]).find(block=>block.id===id);
  let valid=true;try{validatePracticeItems(block,items,{responseAnchors});}catch(error){errors.push(error.message);valid=false;}
  for(const item of items){const explicit=Object.hasOwn(item,'archetype'),known=!explicit||text(item.archetype)&&clusterIds.has(item.archetype);if(!known)errors.push('Unknown same-topic practice item archetype '+item.archetype+' for '+id);if(explicit&&known&&valid)itemReferences.add(item.archetype);}
 }
 for(const c of clusters)if(c.itemOnly===true&&!itemReferences.has(c.id))errors.push('Unreferenced item-only archetype: '+c.id);
 if(errors.length)throw Error(errors.join('; '));
 return {topicId:sequence.topicId,sequenceId:sequence.id,clusters,unrated,questions:Object.fromEntries(clusters.flatMap(c=>(c.questionIds??[]).map(id=>[id,{archetype:c.id,topicId:sequence.topicId,reasoningScore:eligible.get(id).reasoningScore,...(result.practiceItems?.[id]?{practiceItems:result.practiceItems[id]}:{})}])))};
}
export async function runArchetypes({projectFile,root=ROOT,topics=[],runner=defaultRunner,lease=defaultLease,output,workDir,runDir,concurrency=1,responseAnchors}={}){
 if(!Number.isInteger(concurrency)||concurrency<1||concurrency>3)throw Error('Use one to three workers');
 const project=read(projectFile),all=sequences(project),selected=topics.length?all.filter(s=>topics.includes(s.id)||topics.includes(s.topicId)):all;
 if(!selected.length)throw Error('No sequence matches --topics');
 workDir??=path.join(root,'.booklet-work','pedagogy-review',project.id,'archetypes');runDir??=canonicalRunDir(project,{root});
 const rows=[];
 await pool(selected.filter(sequence=>routineQuestions(sequence).questions.length),concurrency,async sequence=>{
  const {result,usage,elapsedMs,reviewConfiguration:actualConfiguration}=await callWorker({runner,lease,canonicalRunDir:runDir,workDir,stage:'pedagogy-archetypes',...archetypePrompt(project,sequence,{root,task:true}),effort:'high'});
  for(const q of routineQuestions(sequence).questions)if(!result.practiceItems?.[q.id]?.length)throw Error('Missing independent practice-item review for '+q.id);
  rows.push({...validateArchetypes(project,sequence,result,{responseAnchors}),usage,elapsedMs,reviewConfiguration:actualConfiguration});
 });
 rows.sort((a,b)=>all.findIndex(s=>s.id===a.sequenceId)-all.findIndex(s=>s.id===b.sequenceId));
 const record={version:1,projectId:project.id,revision:project.revision,reviewConfiguration:passIdentity(rows),requestedReviewConfiguration:reviewConfiguration(),status:'pending-user-review',createdAt:now(),questions:Object.assign({},...rows.map(r=>r.questions)),topics:rows.map(({questions,...row})=>row)};
 output??=path.join(workDir,'map.json');fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(record,null,2)+'\n');
 return {...record,output};
}

// ---- claim challenge and question insertion views (no project mutation) ----------

const COVERAGE_VERDICTS=new Set(['KEEP','DROP','UNCHECKED']);
const COVERAGE_CHALLENGE='Independent challenge of archetype-coverage claims. Judge only the listed claims. No new student content, questions, diagrams, solutions or ratings; no source, mathematics, rating or visual re-audit. Challenge false positives: exact example clones are unnecessary for modest direct applications, deliberate guided discovery is not missing teaching, and explicitly supplied scaffolds count. Unsolved practice is not teaching. Genuine prerequisite retrieval belongs to pending James opening-Review decisions, not missing worked examples. Comments only; concise learning-support proposals, no drafted tasks.\n\nYou are given `claims`; `teaching`, `earlierTeaching` and `practice` in full; and `digests` and `outline`, which are locators only. Cite only ids shown in full. If a verdict would rest on a digest or outline entry, or on a topic not supplied, return UNCHECKED and name it in needsTopics rather than guessing. Hidden diagram detail is a limitation to state, not evidence.\n\nReturn JSON only: {"verdicts":[{"topicId":"","clusterId":"","verdict":"KEEP|DROP|UNCHECKED","coverage":"covered|bridge|missing|prior-knowledge","reason":"","teachingIds":[],"exampleIds":[],"guidedPracticeIds":[],"practiceEvidenceIds":[],"prerequisiteIds":[],"needsTopics":[],"comment":null}],"uncertainties":[],"newStudentContent":0}. Exactly one verdict per claim.';
const COVERAGE_CITATIONS=['teachingIds','exampleIds','guidedPracticeIds','practiceEvidenceIds','prerequisiteIds'];
const withoutAnswers=value=>JSON.parse(JSON.stringify(value,(key,child)=>key==='answer'?undefined:child));
const locator=(block,section)=>({id:block.id,text:headline(withoutAnswers(compactBlock(block,section)),LIMITS.outlineCharacters)});
function idsIn(value,found=new Set()){
 if(Array.isArray(value))value.forEach(child=>idsIn(child,found));
 else if(value&&typeof value==='object'){if(typeof value.id==='string')found.add(value.id);Object.values(value).forEach(child=>idsIn(child,found));}
 return found;
}
const openComments=(project,blockIds)=>flagsOf(project).filter(flag=>!flag.resolved&&blockIds.has(flag.targetId)).map(({id,targetId,kind,note})=>({id,targetId,kind,note}));
// Teaching of the topics not claimed, nearest the last claim first, then locators.
function surroundingTeaching(all,claimed,last,characters,numbering){
 const full=[],digests=[];let used=0;
 for(let i=last;i>=0;i--){
  if(claimed.has(i))continue;
  const sections=instructionalSections(all[i]);if(!sections.length)continue;
  const value={topic:all[i].id,title:all[i].title,sections:sections.map(section=>({title:section.title??null,blocks:section.blocks.map(block=>compactBlock(block,section,numbering))}))},size=JSON.stringify(value).length;
  if(used+size<=characters){full.unshift(value);used+=size;}
  else digests.unshift({topic:all[i].id,title:all[i].title,blocks:sections.flatMap(section=>section.blocks.map(block=>locator(block,section)))});
 }
 return {full,digests};
}
export const coverageClaims=map=>(map.topics??[]).flatMap(topic=>(topic.clusters??[]).filter(cluster=>cluster.coverage!=='covered').map(cluster=>({topicId:topic.topicId,...cluster})));
// A challenger must be able to disprove a claim, so claimed topics keep their whole
// practice: replay of retained verdicts lost cited evidence when it was narrowed to
// the blocks a claim names. Every block travels once.
export function coverageChallengeView({project,all=sequences(project),claims,skills=[],needsTopics=[]}){
 const numbering=numberingFor(project);
 const claimed=new Set(all.flatMap((sequence,i)=>claims.some(claim=>claim.topicId===sequence.topicId)?[i]:[]));
 if(!claimed.size)throw Error('No claim belongs to a topic of this booklet');
 if(!Array.isArray(needsTopics)||needsTopics.some(id=>typeof id!=='string'||!id)||new Set(needsTopics).size!==needsTopics.length)throw Error('needsTopics must contain unique native topic IDs');
 const last=Math.max(...claimed),seen=new Set(),once=block=>!seen.has(block.id)&&seen.add(block.id);
 const forced=new Set();
 for(const topicId of needsTopics){
  const indices=all.flatMap((sequence,i)=>sequence.topicId===topicId?[i]:[]);
  if(!indices.length)throw Error('Unknown needsTopics topic: '+topicId);
  if(indices.some(i=>i>last))throw Error('Future needsTopics topic is unsupported earlier context: '+topicId);
  for(const i of indices)if(!claimed.has(i))forced.add(i);
 }
 const teaching=[...claimed].map(i=>({topic:all[i].id,title:all[i].title,sections:instructionalSections(all[i]).map(section=>({title:section.title??null,blocks:section.blocks.filter(once).map(block=>compactBlock(block,section,numbering))}))}));
 const practice=[],outline=[],earlierPractice=[];let surrounding;
 if(needsTopics.length){
  // Requested whole topics are mandatory. They consume the earlier-context
  // budget first; unrequested teaching remains explicitly locatable when omitted.
  const required=[...forced].map(i=>({topic:all[i].id,title:all[i].title,sections:instructionalSections(all[i]).map(section=>({title:section.title??null,blocks:section.blocks.filter(once).map(block=>compactBlock(block,section,numbering))}))}));
  for(const i of forced)for(const section of all[i].sections.filter(section=>section.phase==='practice'))for(const block of (section.blocks??[]).filter(once))earlierPractice.push({topic:all[i].id,...compactBlock(block,section,numbering)});
  const mandatoryCharacters=required.reduce((n,row)=>n+JSON.stringify(row).length,0)+JSON.stringify(earlierPractice).length;
  surrounding=surroundingTeaching(all,new Set([...claimed,...forced]),last,Math.max(0,LIMITS.practiceOnlyEarlierCharacters-mandatoryCharacters),numbering);
  const full=new Map([...surrounding.full,...required].map(row=>[row.topic,row]));
  surrounding.full=all.filter(sequence=>full.has(sequence.id)).map(sequence=>{
   const row=full.get(sequence.id);
   return forced.has(all.indexOf(sequence))?row:{...row,sections:row.sections.map(section=>({...section,blocks:section.blocks.filter(once)}))};
  });
 }else surrounding=surroundingTeaching(all,claimed,last,LIMITS.practiceOnlyEarlierCharacters,numbering);
 all.forEach((sequence,i)=>{
  for(const section of sequence.sections.filter(section=>section.phase==='practice'))for(const block of (section.blocks??[]).filter(once)){
   if(claimed.has(i))practice.push({topic:sequence.id,...compactBlock(block,section,numbering)});
   else if(forced.has(i))earlierPractice.push({topic:sequence.id,...compactBlock(block,section,numbering)});
   else if(i<=last)outline.push({topic:sequence.id,...locator(block,section)});
  }
 });
 const owners=new Map(all.flatMap(sequence=>[...visibleIds(sequence)])),named=new Set(claims.flatMap(claim=>['questionIds',...COVERAGE_CITATIONS].flatMap(field=>(claim[field]??[]).map(id=>owners.get(id)??id))));
 const payload={booklet:project.title,numbering:NUMBERING_NOTE,courseId:project.library?.courseId??null,claims,comments:openComments(project,named),teaching,earlierTeaching:surrounding.full,digests:surrounding.digests,practice,...(needsTopics.length?{earlierPractice}:{}),outline,skills:[...claimed].flatMap(i=>skillFacts(all,i,skills))};
 const evidence=idsIn([teaching,surrounding.full,practice,earlierPractice]),locators=new Set([...idsIn([surrounding.digests,outline])].filter(id=>!evidence.has(id)));
 return {payload,evidence,locators,prerequisites:idsIn(payload.skills)};
}
// Never cut to fit: over the limit the claims split between topics, and one topic
// that cannot fit alone is refused.
export function coverageChallengePackets({project,all=sequences(project),claims,skills=[],limit=LIMITS.coverageCharacters,needsTopics=[]}){
 if(!Array.isArray(needsTopics))throw Error('needsTopics must contain unique native topic IDs');
 if(!claims.length&&needsTopics.length)throw Error('needsTopics requires coverage claims');
 const instructions=COVERAGE_CHALLENGE+(needsTopics.length?'\n\nOptional earlierPractice contains complete practice from explicitly requested earlier topics. It adds context, not claims. Requested topics take priority in the earlier-context budget; other omitted teaching remains locator-only in digests. Unsolved practice is not teaching; judge any explicitly supplied scaffold in its actual role.':'');
 const build=topicIds=>{const chosen=claims.filter(claim=>topicIds.includes(claim.topicId)),{payload,evidence,locators,prerequisites}=coverageChallengeView({project,all,claims:chosen,skills,needsTopics});return {claims:chosen,...reviewTask(project,payload,instructions,{compactTargets:true}),evidence,locators,prerequisites};};
 const packets=[];let current=[];
 for(const topicId of [...new Set(all.map(sequence=>sequence.topicId))].filter(id=>claims.some(claim=>claim.topicId===id))){
  const next=[...current,topicId];
  if(current.length&&build(next).prompt.length>limit){packets.push(build(current));current=[topicId];}else current=next;
 }
 if(current.length)packets.push(build(current));
 const over=packets.find(packet=>packet.prompt.length>limit);
 if(over)throw Error(`Coverage challenge for ${[...new Set(over.claims.map(claim=>claim.topicId))].join(', ')} is ${over.prompt.length} characters, over ${limit}; it cannot be split further and is not truncated`);
 return packets;
}
export function validateCoverageChallenge(packet,result){
 const verdicts=Array.isArray(result?.verdicts)?result.verdicts:[],errors=[];
 if(result?.newStudentContent!==0)errors.push('The challenge must return newStudentContent 0');
 for(const claim of packet.claims)if(verdicts.filter(row=>row.topicId===claim.topicId&&row.clusterId===claim.id).length!==1)errors.push(`Claim ${claim.topicId}/${claim.id} needs exactly one verdict`);
 if(verdicts.length!==packet.claims.length)errors.push(`Expected ${packet.claims.length} verdicts, received ${verdicts.length}`);
 for(const row of verdicts){
  const name=row.topicId+'/'+row.clusterId;
  if(!COVERAGE_VERDICTS.has(row.verdict))errors.push('Invalid verdict for '+name);
  if(!text(row.reason))errors.push('No reason for '+name);
  if(row.verdict==='UNCHECKED'){if(!row.needsTopics?.length)errors.push('UNCHECKED without needsTopics: '+name);continue;}
  if(!['covered','bridge','missing','prior-knowledge'].includes(row.coverage))errors.push('Invalid coverage for '+name);
  for(const field of COVERAGE_CITATIONS)for(const id of row[field]??[]){
   if(packet.locators.has(id))errors.push(`${name} rests on locator-only ${id}; return UNCHECKED`);
   else if(!packet.evidence.has(id)&&!(field==='prerequisiteIds'&&packet.prerequisites?.has(id)))errors.push(`${name} cites unseen ${id}`);
  }
 }
 if(errors.length)throw Error(errors.join('; '));
 return verdicts;
}
export async function runCoverageChallenge({projectFile,mapFile,root=ROOT,output,dryRun=false,runner=defaultRunner,lease=defaultLease,workDir,runDir,skills,needsTopics=[]}={}){
 const project=read(projectFile),map=read(mapFile),claims=coverageClaims(map);
 if(map.projectId!==project.id||map.revision!==project.revision)throw Error('The archetype map does not match this project and revision');
 if(!Array.isArray(needsTopics))throw Error('needsTopics must contain unique native topic IDs');
 if(!claims.length){if(needsTopics.length)throw Error('needsTopics requires coverage claims');return {projectId:project.id,revision:project.revision,packets:[],verdicts:[]};}
 skills??=read(path.join(root,'data','skills.json'));
 const packets=coverageChallengePackets({project,claims,skills,needsTopics}),sizes=packets.map(packet=>({claims:packet.claims.length,characters:packet.prompt.length}));
 if(dryRun)return {projectId:project.id,revision:project.revision,packets:sizes,...(needsTopics.length?{needsTopics}:{})};
 if(!output)throw Error('Name an --output file');
 workDir??=path.join(root,'.booklet-work','pedagogy-review',project.id,'coverage-challenge');runDir??=canonicalRunDir(project,{root});
 const replies=[];
 // One at a time: a refusal stops the batch before another payload is sent.
 for(const packet of packets){
  const {result,usage,elapsedMs,reviewConfiguration:actualConfiguration}=await callWorker({runner,lease,canonicalRunDir:runDir,workDir,stage:'pedagogy-coverage-challenge',prompt:packet.prompt,taskReferences:packet.taskReferences,effort:'high'});
  validateCoverageChallenge(packet,result);replies.push({result,usage,elapsedMs,reviewConfiguration:actualConfiguration,characters:packet.prompt.length});
 }
 const report={projectId:project.id,revision:project.revision,...(needsTopics.length?{needsTopics}:{}),result:{verdicts:replies.flatMap(reply=>reply.result.verdicts),uncertainties:replies.flatMap(reply=>reply.result.uncertainties??[]),newStudentContent:0},calls:replies.map(({usage,elapsedMs,characters,reviewConfiguration})=>({usage,elapsedMs,characters,reviewConfiguration}))};
 fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 return {...report,output};
}
// New questions need the exercise they join, the teaching they rely on and comments
// on those blocks, not the whole booklet's native content or every comment. `topics`
// narrows teaching; other topics stay as locators, so duplicates and order can still
// be located. Over the limit, name fewer topics: nothing is cut to fit.
export function insertionReviewView({project,all=sequences(project),newBlocks,sectionId=null,topics=null,references=null,sourceEvidence=null,limit=LIMITS.insertionCharacters}){
 const numbering=numberingFor(project);
 if(!newBlocks?.length)throw Error('Name the new blocks under review');
 const wanted=topics&&new Set(topics),target=sectionId&&(project.sections??[]).find(section=>section.id===sectionId);
 if(sectionId&&!target)throw Error('Unknown section '+sectionId);
 const teaching=[],digests=[],outline=[];
 for(const sequence of all){
  const sections=instructionalSections(sequence);
  if(sections.length&&(!wanted||wanted.has(sequence.id)||wanted.has(sequence.topicId)))teaching.push({topic:sequence.id,title:sequence.title,sections:sections.map(section=>({title:section.title??null,blocks:section.blocks.map(block=>compactBlock(block,section,numbering))}))});
  else if(sections.length)digests.push({topic:sequence.id,title:sequence.title,blocks:sections.flatMap(section=>section.blocks.map(block=>locator(block,section)))});
  for(const section of sequence.sections.filter(section=>section.phase==='practice'&&section!==target))for(const block of (section.blocks??[]).filter(block=>!isExplicitTeachingBlock(block)))outline.push({topic:sequence.id,...locator(block,section)});
 }
 const exercise=target?(target.blocks??[]).map(block=>compactBlock(block,target,numbering)):[];
 const payload={booklet:project.title,numbering:NUMBERING_NOTE,revision:project.revision??null,newBlocks:newBlocks.map(questionReviewContent),...(sourceEvidence?{sourceEvidence}:{}),targetExercise:target?{id:target.id,title:target.title??null,blocks:exercise}:null,comments:openComments(project,new Set(target?.blocks?.map(block=>block.id)??[])),...(references?{references}:{}),teaching,digests,outline};
 const characters=JSON.stringify(payload).length;
 if(characters>limit)throw Error(`Insertion review is ${characters} characters, over ${limit}; name the topics the new questions rely on`);
 return {payload,characters};
}

// ---- command line -------------------------------------------------------------------

// Sizes only: what each call would send. No model call and no write.
export function runMap({projectFile,root=ROOT,skills,runDir}){
 const project=read(projectFile),all=sequences(project);
 skills??=fs.existsSync(path.join(root,'data','skills.json'))?read(path.join(root,'data','skills.json')):[];runDir??=canonicalRunDir(project,{root});
 return {project:project.id,revision:project.revision??null,runDir:runDir&&path.relative(root,runDir).replaceAll('\\','/'),importReview:importReviewStatus(runDir),questionOrder:project.settings?.questionOrder??null,
  sequences:all.map((sequence,index)=>{const images=sequenceImages(sequence,runDir),roles={};for(const section of sequence.sections)for(const block of section.blocks??[]){const role=block.pedagogyRole??(section.phase==='practice'?'practice':'unlabelled');roles[role]=(roles[role]??0)+1;}
   return {id:sequence.id,title:sequence.title,roles,promptCharacters:reviewPrompt({project,all,index,skills,images,root}).length,images:images.files.length,imagesExpected:images.expected};})};
}
export async function main(args=process.argv.slice(2)){
 const command=args[0],values={},flags=new Set();
 // Pedagogy audit v2 (docs/booklet-pedagogy-audit-v2.md) has its own options.
 if(command==='audit-v2'){const result=await (await import('./audit-v2.mjs')).auditV2Main(args.slice(1));console.log(JSON.stringify(result,null,2));if(result?.blockers?.length)process.exitCode=1;return result;}
 for(let i=1;i<args.length;i++){
  if(['--candidates-only','--suggestions','--report-only','--dry-run'].includes(args[i])){flags.add(args[i]);continue;}
  if(!['--project','--project-file','--topics','--needs-topics','--review-effort','--approve','--defer','--resolve','--reject','--assume','--exports','--concurrency','--provenance-dir','--findings','--output','--map'].includes(args[i])||args[i+1]===undefined)throw Error('Invalid option '+args[i]);
  values[args[i]]=args[++i];
 }
 if(flags.has('--report-only')&&!['review','principles'].includes(command))throw Error('--report-only is allowed only for review or principles; no action was taken.');
 if(values['--needs-topics']&&command!=='coverage-challenge')throw Error('--needs-topics is allowed only for coverage-challenge');
 const list=name=>values[name]?.split(',').map(item=>item.trim()).filter(Boolean)??[],live=values['--project']&&path.join(ROOT,'booklets','projects',values['--project']+'.json');
 const projectFile=values['--project-file']?path.resolve(values['--project-file']):live,provenanceDir=values['--provenance-dir']&&path.resolve(values['--provenance-dir']);
 if(command!=='seeded'&&!projectFile)throw Error('Name a booklet with --project ID or --project-file FILE');
 let result;
 if(command==='archetypes')result=await runArchetypes({projectFile,concurrency:Number(values['--concurrency']??1),topics:list('--topics'),output:values['--output']&&path.resolve(values['--output'])});
 else if(command==='coverage-challenge'){if(!values['--map'])throw Error('coverage-challenge needs --map FILE');result=await runCoverageChallenge({projectFile,mapFile:path.resolve(values['--map']),output:values['--output']&&path.resolve(values['--output']),dryRun:flags.has('--dry-run'),needsTopics:list('--needs-topics')});}
 else if(command==='map')result=runMap({projectFile});
 else if(command==='review'||command==='principles')result=await runReview({projectFile,principlesOnly:command==='principles',reportOnly:flags.has('--report-only'),topics:list('--topics'),reviewEffort:values['--review-effort']??'high',candidatesOnly:flags.has('--candidates-only'),concurrency:Number(values['--concurrency']??LIMITS.concurrency),provenanceDir});
 else if(command==='post'){if(!live||values['--project-file'])throw Error('Comments are posted only to a live project: use --project ID');result=await postFindings({projectFile,provenanceDir,suggestions:flags.has('--suggestions'),...(values['--findings']?{findingIds:list('--findings')}:{})});}
 else if(command==='status')result=await reconcile({projectFile,approve:list('--approve'),defer:list('--defer'),resolve:list('--resolve'),reject:list('--reject'),assume:values['--assume'],provenanceDir});
 else if(command==='withdraw'){if(!live||values['--project-file'])throw Error('Withdraw works on a live project: use --project ID');result=await withdraw({projectFile,provenanceDir});}
 else if(command==='format'){if(!values['--exports'])throw Error('format needs --exports DIR');result=runFormat({projectFile,exportDir:values['--exports'],provenanceDir});}
 else if(command==='seeded')result=await runSeeded({reviewEffort:values['--review-effort']??'low'});
 else throw Error('Use archetypes|map|review|post|status|format --project ID, or seeded. See docs/booklet-pedagogy-review.md');
 console.log(JSON.stringify(result,null,2));if(result.errors?.length)process.exitCode=1;return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
