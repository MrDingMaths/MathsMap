#!/usr/bin/env node
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

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const LIMITS=Object.freeze({concurrency:3,images:8,earlierCharacters:24000,practiceOnlyEarlierCharacters:48000,challengeCharacters:160000,digestCharacters:220,outcomeCharacters:2500});
export const KINDS=Object.freeze(['example-choice','worked-step-error','guided-practice','missing-prerequisite','opening-review','unsupported-transition','difficulty-jump','untested-distinction','duplicate-question']);
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
export function compactBlock(block,section){
 const practice=section.phase==='practice',{id,type,pedagogyRole,sourcePageNumber,sourceAtom,sourceOrder,...rest}=compact(questionReviewContent(block),practice);
 const heading=text(block.sourceAtom?.visibleSubtitle)||text(block.sourceAtom?.label),classification=block.classification??{};
 return {id:block.id,type:block.type,role:block.pedagogyRole??(practice?'practice':'unlabelled'),...(heading?{heading}:{}),...(classification.primarySkillId?{skill:classification.primarySkillId}:{}),...(classification.difficulty?{difficulty:classification.difficulty}:{}),...rest};
}
const sequencePayload=sequence=>({id:sequence.id,title:sequence.title,sections:sequence.sections.map(section=>({id:section.id,title:section.title??null,phase:section.phase,blocks:(section.blocks??[]).map(block=>compactBlock(block,section))}))});
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
  repair:{type:'remove-question',proposal:'Retain the first occurrence '+group[0].id+' and remove the redundant copies '+group.slice(1).map(row=>row.id).join(', ')+' unless an explicit instructional purpose warrants retaining them.'},
  doneWhen:'Each unnecessary repeated whole question is removed; any retained repetition has an explicit instructional purpose.'
 }));
}

// Earlier teaching in full, nearest topic first, until the budget is spent; the
// rest as one line per block.
export function earlierTeaching(all,index,{characters=LIMITS.earlierCharacters}={}){
 const full=[],digests=[];let used=0,open=true;
 for(let i=index-1;i>=0;i--){
  const teaching=all[i].sections.filter(section=>section.phase==='teaching'&&section.blocks?.length);
  if(!teaching.length)continue;
  const value={topic:all[i].id,title:all[i].title,sections:teaching.map(section=>({title:section.title??null,blocks:section.blocks.map(block=>compactBlock(block,section))}))},size=JSON.stringify(value).length;
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
export function reviewPrompt({project,all,index,skills,decided=[],images={expected:false,files:[]},stored,library=[],root=ROOT}){
 const sequence=all[index],practiceOnly=!sequence.sections.some(section=>section.phase==='teaching');
 const earlier=earlierTeaching(all,index,{characters:practiceOnly?LIMITS.practiceOnlyEarlierCharacters:LIMITS.earlierCharacters});
 const payload={booklet:project.title,assumptions:assumptions(project,stored,library),sequence:sequencePayload(sequence),earlierTeaching:earlier.full,earlierTeachingDigests:earlier.digests,earlierTeachingComplete:earlier.complete,skills:skillFacts(all,index,skills),decided,imagesExpected:images.expected,imagesAttached:images.files.length};
 return contract('review',{root})+'\n\n'+REVIEW_OUTPUT+'\n\n'+JSON.stringify(payload);
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
function saveProvenance(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,1)+'\n');}
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
 const {transcriptionConfiguration}=await import('../scripts/booklet/transcription-settings.mjs');
 if(effort==='medium')return transcriptionConfiguration();
 if(effort!=='low')throw Error('Effort must be low or medium');
 return transcriptionConfiguration({reasoningOverride:{effort:'low',reason:'Pedagogy review pass: user decision of 9 October 2026 (low review, medium challenge).'}});
}
// A slot in the booklet's canonical run directory is the shared three-worker
// limit. The call itself runs from the review's own folder, which has no
// manifest, so each pass can use its own effort. Workers start outside the
// repository so they do not load its AGENTS.md.
async function callWorker({runner,lease,canonicalRunDir,workDir,stage,prompt,images=[],effort}){
 const out=path.join(workDir,'calls',stage+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,8)),cwd=path.join(os.tmpdir(),'mathsmap-pedagogy-review');
 fs.mkdirSync(cwd,{recursive:true});fs.mkdirSync(path.dirname(out),{recursive:true});
 const configuration=await effortConfiguration(effort),invoke=()=>runner({cwd,runDir:workDir,prompt,images,out,profile:'review',stage,configuration});
 const {result,metrics}=await(canonicalRunDir?lease(canonicalRunDir,{stage,tool:'pedagogy-review'},invoke):invoke());
 return {result,usage:metrics?.usage??null,elapsedMs:metrics?.elapsedMs??null};
}
async function pool(items,concurrency,work){
 const queue=[...items.entries()];
 await Promise.all(Array.from({length:Math.max(1,Math.min(concurrency,queue.length))},async()=>{while(queue.length){const [index,item]=queue.shift();await work(item,index);}}));
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
 const owners=new Set([...candidates,...questions].flatMap(row=>row.targets.map(id=>ids.get(id)))),position=new Map(all.flatMap((sequence,i)=>sequence.sections.flatMap(section=>(section.blocks??[]).map(block=>[block.id,i]))));
 const last=Math.max(...[...owners].map(id=>position.get(id)??0)),concerned=new Set([...owners].map(id=>position.get(id)));
 const teachingOf=i=>({topic:all[i].id,title:all[i].title,sections:all[i].sections.filter(section=>section.phase==='teaching').map(section=>({title:section.title??null,blocks:(section.blocks??[]).map(block=>compactBlock(block,section))}))});
 // Topics with candidates always go in full; others nearest first while they fit.
 const teaching=new Map([...concerned].map(i=>[i,teachingOf(i)]));let used=JSON.stringify([...teaching.values()]).length,complete=true;
 for(let i=last;i>=0;i--){if(teaching.has(i))continue;const value=teachingOf(i);if(!value.sections.some(section=>section.blocks.length))continue;const size=JSON.stringify(value).length;if(used+size>LIMITS.challengeCharacters){complete=false;continue;}teaching.set(i,value);used+=size;}
 // A claim about how the practice rises can only be checked against the whole exercise.
 const whole=new Set(candidates.filter(candidate=>['difficulty-jump','unsupported-transition'].includes(candidate.kind)).map(candidate=>candidate.sequence));
 const practice=all.flatMap(sequence=>sequence.sections.filter(section=>section.phase==='practice').flatMap(section=>(section.blocks??[]).filter(block=>whole.has(sequence.id)||owners.has(block.id)).map(block=>({topic:sequence.id,...compactBlock(block,section)}))));
 const payload={booklet:project.title,assumptions:assumptions(project,stored,library),candidates:candidates.map(({id,sequence,...rest})=>({id,topic:sequence,...rest})),contextQuestions:questions.map(({id,sequence,targets,question})=>({id,topic:sequence,targets,question})),teaching:[...teaching.entries()].sort((a,b)=>a[0]-b[0]).map(([,value])=>value),teachingComplete:complete,practice,topicOrder:all.slice(0,last+1).map(sequence=>sequence.id)};
 return contract('challenge',{root})+'\n\n'+CHALLENGE_OUTPUT+'\n\nThe first reader\'s instructions, which are the standard:\n\n'+contract('review',{root})+'\n\n'+JSON.stringify(payload);
}
export async function runReview({projectFile,root=ROOT,topics=[],reviewEffort='low',challengeEffort='medium',candidatesOnly=false,concurrency=LIMITS.concurrency,runner=defaultRunner,lease=defaultLease,provenanceDir,workDir,skills,library,runDir}={}){
 if(!Number.isInteger(concurrency)||concurrency<1||concurrency>LIMITS.concurrency)throw Error('Use one to three workers');
 const project=read(projectFile),all=sequences(project);
 if(!all.some(sequence=>sequence.sections.some(section=>section.phase==='teaching'&&section.blocks?.length)))throw Error('This project has no teaching content; the pedagogy review does not apply.');
 const selected=topics.length?all.filter(sequence=>topics.includes(sequence.id)||topics.includes(sequence.topicId)):all;
 if(!selected.length)throw Error('No sequence matches --topics');
 skills??=fs.existsSync(path.join(root,'data','skills.json'))?read(path.join(root,'data','skills.json')):[];
 runDir??=canonicalRunDir(project,{root});workDir??=path.join(root,'.booklet-work','pedagogy-review',project.id);library??=courseLibrary(project,{root});
 const file=provenanceFile(project.id,{root,provenanceDir}),record=loadProvenance(file,project),blocks=blocksById(project);
 const ids=new Map(all.flatMap(sequence=>[...visibleIds(sequence)])),rejected=(record.findings??[]).filter(finding=>finding.state==='rejected'&&targetsUnchanged(finding,blocks));
 const candidates=[],context=[],groups=[],unreliable=[],rows=[],errors=[];
 await pool(selected,concurrency,async sequence=>{
  const index=all.indexOf(sequence),own=visibleIds(sequence),images=sequenceImages(sequence,runDir);
  const decided=rejected.filter(finding=>finding.targets.some(target=>own.has(target.id))).map(finding=>({kind:finding.kind,targets:finding.targets.map(target=>target.id),finding:finding.finding}));
  const row={id:sequence.id,title:sequence.title,blocks:sequence.sections.reduce((count,section)=>count+(section.blocks?.length??0),0),images:images.files.length,imagesExpected:images.expected};rows.push(row);
  try{
   const {result,usage,elapsedMs}=await callWorker({runner,lease,canonicalRunDir:runDir,workDir,stage:'pedagogy-review',prompt:reviewPrompt({project,all,index,skills,decided,images,stored:record.assumptions,library,root}),images:images.files,effort:reviewEffort});
   Object.assign(row,{usage,elapsedMs,candidates:0,discarded:[],working:result?.working??null});
   for(const raw of Array.isArray(result?.candidates)?result.candidates:[]){
    const {value,error}=normalise(raw,own);
    if(error){row.discarded.push(error);continue;}
    if(rejected.some(finding=>sameIssue(finding,{kind:value.kind,targets:value.targets.map(id=>({blockId:own.get(id)}))}))){row.discarded.push('already rejected');continue;}
    candidates.push({...value,sequence:sequence.id});row.candidates++;
   }
   // At most one suggestion of each kind for a topic.
   const offered=new Set();row.suggestions=0;
   for(const raw of Array.isArray(result?.suggestions)?result.suggestions:[]){
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
 for(const candidate of duplicateQuestionCandidates(all,{topics:selected.map(sequence=>sequence.id)})){
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
 const candidateFile=path.join(workDir,`candidates-${reviewEffort}-${Date.now()}.json`);
 fs.writeFileSync(candidateFile,JSON.stringify({projectId:project.id,revision:project.revision??null,effort:reviewEffort,sequences:rows,candidates,contextQuestions:context,protectedGroups:groups,notReliablyReviewed:unreliable,errors},null,1)+'\n');
 if(candidatesOnly)return {projectId:project.id,effort:reviewEffort,sequences:rows.length,candidates:candidates.map(({id,sequence,kind,severity,targets,finding})=>({id,sequence,kind,severity,targets,finding})),candidateFile,errors};

 const found=[],dropped=[],unchecked=[],droppedQuestions=[],challenge={};let questions=context;
 if(candidates.length||context.length){
  try{
   const {result,usage,elapsedMs}=await callWorker({runner,lease,canonicalRunDir:runDir,workDir,stage:'pedagogy-challenge',prompt:challengePrompt({project,all,candidates,questions:context,ids,stored:record.assumptions,library,root}),effort:challengeEffort});
   Object.assign(challenge,{usage,elapsedMs});
   const known=new Set(candidates.map(candidate=>candidate.id)),seen=new Set();
   for(const raw of Array.isArray(result?.findings)?result.findings:[]){
    const from=(Array.isArray(raw?.from)?raw.from:[]).map(String).filter(id=>known.has(id)),{value,error}=normalise(raw,ids);
    from.forEach(id=>seen.add(id));
    if(error||!from.length){dropped.push({ids:from,reason:error??'finding names no candidate'});continue;}
    found.push({id:findingId(value.kind,value.targets),...value,targets:targetRows(value.targets,ids,blocks),from,sequences:[...new Set(candidates.filter(candidate=>from.includes(candidate.id)).map(candidate=>candidate.sequence))]});
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
 Object.assign(record,{projectId:project.id,title:project.title,reviewedRevision:project.revision??null,reviewedAt:now(),passes:{review:{model:'gpt-6.1-sol',effort:reviewEffort,calls:rows.length},challenge:{model:'gpt-6.1-sol',effort:challengeEffort,calls:candidates.length||context.length?1:0}},importReview:importReviewStatus(runDir),questionOrder:project.settings?.questionOrder??null,findings:merged.findings,
  contextQuestions:[...(record.contextQuestions??[]).filter(row=>!inScope(row)),...questions.map(({id,...question})=>question)],protectedGroups:[...(record.protectedGroups??[]).filter(row=>!inScope(row)),...groups],notReliablyReviewed:[...(record.notReliablyReviewed??[]).filter(row=>!inScope(row)),...unreliable],
  lastRun:{sequences:rows.map(({working,...row})=>row),dropped:dropped.map(row=>({...row,candidates:row.ids.map(describe)})),unchecked:unchecked.map(row=>({...row,candidate:describe(row.id)})),suppressed:merged.suppressed,droppedQuestions,candidateFile:path.relative(root,candidateFile).replaceAll('\\','/'),errors}});
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
 if(isSuggestion(finding))return [`[Pedagogy review · Suggestion · ${finding.kind} · ${finding.id}]`,'Idea: '+finding.finding,finding.breakdown&&'Why: '+finding.breakdown,others.length&&'Also relates to: '+others.join(', '),'Proposed addition: '+finding.repair.proposal].filter(Boolean).join('\n');
 return [`[Pedagogy review · ${finding.severity==='severe'?'Severe':'High priority'} · ${finding.kind} · ${finding.id}]`,'Finding: '+finding.finding,'Breakdown: '+finding.breakdown,finding.checked&&'Checked: '+finding.checked,finding.assumptions&&'Assumes: '+finding.assumptions,others.length&&'Also affects: '+others.join(', '),`Proposed repair (${finding.repair.type}): ${finding.repair.proposal}`,finding.doneWhen&&'Done when: '+finding.doneWhen].filter(Boolean).join('\n');
}
async function projectHandle(projectFile,root){return (await import('../scripts/booklet/lean-review.mjs')).openProject(projectFile,{root});}
const flagsOf=project=>project.studio?.flags??[];
export async function postFindings({projectFile,root=ROOT,provenanceDir,suggestions=false,findingIds}={}){
 const {createFeedback}=await import('../src/lib/booklet-feedback.js');
 const handle=await projectHandle(projectFile,root),project=handle.project,file=provenanceFile(project.id,{root,provenanceDir}),record=loadProvenance(file,project),blocks=blocksById(project);
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
 for(let i=1;i<args.length;i++){
  if(['--candidates-only','--suggestions'].includes(args[i])){flags.add(args[i]);continue;}
  if(!['--project','--project-file','--topics','--review-effort','--approve','--defer','--resolve','--reject','--assume','--exports','--concurrency','--provenance-dir','--findings'].includes(args[i])||args[i+1]===undefined)throw Error('Invalid option '+args[i]);
  values[args[i]]=args[++i];
 }
 const list=name=>values[name]?.split(',').map(item=>item.trim()).filter(Boolean)??[],live=values['--project']&&path.join(ROOT,'booklets','projects',values['--project']+'.json');
 const projectFile=values['--project-file']?path.resolve(values['--project-file']):live,provenanceDir=values['--provenance-dir']&&path.resolve(values['--provenance-dir']);
 if(command!=='seeded'&&!projectFile)throw Error('Name a booklet with --project ID or --project-file FILE');
 let result;
 if(command==='map')result=runMap({projectFile});
 else if(command==='review')result=await runReview({projectFile,topics:list('--topics'),reviewEffort:values['--review-effort']??'low',candidatesOnly:flags.has('--candidates-only'),concurrency:Number(values['--concurrency']??LIMITS.concurrency),provenanceDir});
 else if(command==='post'){if(!live||values['--project-file'])throw Error('Comments are posted only to a live project: use --project ID');result=await postFindings({projectFile,provenanceDir,suggestions:flags.has('--suggestions'),...(values['--findings']?{findingIds:list('--findings')}:{})});}
 else if(command==='status')result=await reconcile({projectFile,approve:list('--approve'),defer:list('--defer'),resolve:list('--resolve'),reject:list('--reject'),assume:values['--assume'],provenanceDir});
 else if(command==='format'){if(!values['--exports'])throw Error('format needs --exports DIR');result=runFormat({projectFile,exportDir:values['--exports'],provenanceDir});}
 else if(command==='seeded')result=await runSeeded({reviewEffort:values['--review-effort']??'low'});
 else throw Error('Use map|review|post|status|format --project ID, or seeded. See docs/booklet-pedagogy-review.md');
 console.log(JSON.stringify(result,null,2));if(result.errors?.length)process.exitCode=1;return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
