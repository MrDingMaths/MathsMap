// Bank draw (pipeline 5): docs/booklet-bank-draw.md (James's decisions, 13 November 2026).
// Fills a master's missing Exercise sections and adds one Mixed practice section (and a Challenge section
// when the booklet has none) from textbook-owned bank questions. Nothing is written or rated: every
// question keeps the rating, skill and answers on its bank record, and blocks keep their bankRef.
//   node pedagogy/bank-draw.mjs map --project ID --sources all
//   node pedagogy/bank-draw.mjs confirm-map --project ID --approved-by "QUOTE"
//   node pedagogy/bank-draw.mjs exercises --project ID --sources cambridge [--exercise-items 8-18]
//   node pedagogy/bank-draw.mjs mixed --project ID --sources all [--mixed-items 2-4] [--challenge-per-skill 1] [--challenge-max 12]
//   node pedagogy/bank-draw.mjs save --project ID --command exercises|mixed --approved-by "QUOTE"
// --sources takes owning textbook id prefixes, at any level (cambridge, concept-maths-adv11,
// concept-maths-adv11-ch01), or `all` for every textbook in the bank.
// map, exercises and mixed write proposals only (the --preview of the design); save applies one.
// Existing sections are never edited: a topic that already has an exercise keeps it, and a re-run replaces
// only sections carrying this pipeline's own `bankDraw` marker.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promptText} from '../src/lib/booklet-question-dependencies.js';
import {exerciseSignatures} from '../src/lib/booklet-assembly.js';
import {snapshotBankQuestion,addProjectBlock} from '../src/lib/editable-booklet-model.js';
import {practiceItemCount} from './audit-v2-plan.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const RUN='.booklet-work/bank-draw-20261113';
export const VERSION=1;
// Audit v2 moves questions rated 60 or more to the Challenge exercise; bank draws use the same line.
export const CHALLENGE_SCORE=60;
export const MIN_EXERCISE_CANDIDATES=4;
export const PROMPT_CHARS=320;
// Quantity is a budget of practice items per skill, not a count of questions (James, 13 November 2026: a
// topic that develops more skills needs more practice). A practice item is a part a student answers on its
// own, at most 3 per question (audit v2's count). The picker fills each skill up to its ceiling and stops
// earlier only when every further candidate would repeat one already picked; it says why. The floor is what
// the report flags when supply or variety runs out first.
// Exercise budget 8–18 items per skill: the median and 75th percentile of the masters' own exercises
// (919 sections, 13 November 2026).
export const DEFAULT_BUDGET=Object.freeze({
 exercises:Object.freeze({floor:8,ceiling:18,shortlistPerSkill:20}),
 mixed:Object.freeze({floor:2,ceiling:4}),
 challenge:Object.freeze({perSkill:1,max:12,shortlistPerSkill:3}),
});
// Mixed practice is Foundation : Development : Mastery in 1 : 2 : 1 by question count (James, 13 November
// 2026). Mastery stops below the Challenge line (50–59); 60 and over goes to Challenge.
export const MIXED_BANDS=Object.freeze([
 {id:'Foundation',minScore:0,maxScore:24,share:1,perSkill:3},
 {id:'Development',minScore:25,maxScore:49,share:2,perSkill:6},
 {id:'Mastery',minScore:50,maxScore:CHALLENGE_SCORE-1,share:1,perSkill:3},
]);
export const mixedBand=score=>MIXED_BANDS.find(b=>score>=b.minScore&&score<=b.maxScore)?.id??null;
// Target count per band for n questions, 1 : 2 : 1, never more than the band's supply; the shortfall moves to
// Development first, then the other bands.
export function bandTargets(n,supply){
 const total=MIXED_BANDS.reduce((s,b)=>s+b.share,0),out={};
 for(const b of MIXED_BANDS)out[b.id]=Math.round(n*b.share/total);
 out.Development+=n-Object.values(out).reduce((a,b)=>a+b,0);
 let spare=0;for(const b of MIXED_BANDS){const have=supply[b.id]??0;if(out[b.id]>have){spare+=out[b.id]-have;out[b.id]=have;}}
 for(const id of ['Development','Foundation','Mastery']){const room=(supply[id]??0)-out[id],add=Math.min(room,spare);out[id]+=add;spare-=add;}
 return out;
}
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^﻿/,''));
const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==='string'?value:JSON.stringify(value,null,1)+'\n');};
export const projectDir=(projectId,root=ROOT)=>path.join(root,RUN,projectId);

// ---- sources and candidates -----------------------------------------------------------------------------
const TEXTBOOK=new Set(['textbook','import-review']);
const categoryCache=new Map();
const categoryOf=(id,root)=>{const key=root+'|'+id;if(!categoryCache.has(key)){let c=null;try{c=read(path.join(root,'booklets','projects',id+'.json')).library?.category??null;}catch{}categoryCache.set(key,c);}return categoryCache.get(key);};
// `all`, or prefixes that each name at least one textbook project (a typo must not silently draw nothing).
export function parseSources(value,{root=ROOT}={}){
 const list=String(value??'').split(',').map(s=>s.trim()).filter(Boolean);
 if(!list.length)throw Error('--sources is required: textbook id prefixes (cambridge, concept-maths-adv11, cambridge-x11-ch02) or all');
 if(list.includes('all')){if(list.length>1)throw Error('--sources all cannot be combined with prefixes');return ['all'];}
 const ids=fs.readdirSync(path.join(root,'booklets','projects')).filter(n=>n.endsWith('.json')).map(n=>n.slice(0,-5));
 for(const prefix of list)if(!ids.some(id=>id.startsWith(prefix)&&TEXTBOOK.has(categoryOf(id,root))))throw Error('No textbook project id starts with '+prefix);
 return list;
}
const matchesSource=(owner,sources)=>sources.includes('all')||sources.some(p=>owner.startsWith(p));
// Textbook-owned bank questions from the named sources. Records published before 12 November have no
// `origin`; their owner is found through the sync links and the owning project's library category.
export function loadCandidates({sources,root=ROOT}){
 const bankRoot=path.join(root,'booklets','question-bank');
 const manifest=read(path.join(bankRoot,'manifest.json')).questions,links=read(path.join(bankRoot,'.sync','links.json'));
 return manifest.flatMap(row=>{
  const owner=links[row.id]?.projectId;
  if(!owner||!matchesSource(owner,sources)||row.exam||row.origin==='master'||!TEXTBOOK.has(categoryOf(owner,root)))return [];
  return [{id:row.id,skill:row.primarySkillId,score:row.reasoningScore,difficulty:row.difficulty,owner,ownerBlockId:links[row.id].blockId}];
 });
}
export const bankRecord=(id,root=ROOT)=>read(path.join(root,'booklets','question-bank',id+'.json'));
const questionText=node=>[promptText(node?.prompt),...(node?.children??[]).map(c=>(c.label?'('+c.label+') ':'')+questionText(c))].filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
// Maths is dropped by promptText; keep the raw source too so the picker sees the expressions.
const rawText=node=>{const s=v=>typeof v==='string'?v:JSON.stringify(v??'').replace(/"(?:id|type|format|version|marks|fontSize|align|spaceBefore|spaceAfter|lineHeight|indent|display)":("[^"]*"|[\d.]+|null|true|false|\[\]),?/g,'');return [s(node?.prompt),...(node?.children??[]).map(c=>(c.label?'('+c.label+') ':'')+rawText(c))].join(' ').replace(/\s+/g,' ').trim();};
// One reader per run: record, practice items and prompt signatures, cached.
export function bankReader(root=ROOT){
 const cache=new Map(),get=id=>{if(!cache.has(id))cache.set(id,bankRecord(id,root));return cache.get(id);};
 const items=new Map(),signatures=new Map();
 return {record:get,
  itemsOf:id=>{if(!items.has(id))items.set(id,practiceItemCount(get(id)));return items.get(id);},
  signaturesOf:c=>{if(!signatures.has(c.id))signatures.set(c.id,exerciseSignatures(get(c.id)));return signatures.get(c.id);}};
}
// Questions a bank draw never places (James's pilot review, 13 November 2026): one that points at its source
// book ("See Exercise 2I, Question 9", "the remark made in the notes") makes no sense in a booklet; and in a
// section without working space (Mixed practice) a drawing task has nowhere to be drawn.
const SOURCE_REFERENCE=/\bSee (?:Exercise|Question|Example|Section|Chapter)\b|\bExercise \d+[A-Z]\b|\b(?:in|from) the (?:notes|text)\b|\bthe notes\b|\bprevious (?:question|exercise)\b/i;
const DRAWING_TASK=/\b(?:draw|sketch|construct|plot)\b/i;
export function unsuitable(record,{workingSpace=true}={}){
 const text=[rawText(record.content),...(record.content?.children??[]).flatMap(c=>[rawText(c),...(c.children??[]).map(rawText)])].join(' ');
 if(SOURCE_REFERENCE.test(text))return 'refers to its source book';
 if(!workingSpace&&DRAWING_TASK.test(text))return 'drawing task in a section without working space';
 return null;
}
const candidateView=(c,reader)=>{const r=reader.record(c.id);return {id:c.id,skill:c.skill,score:c.score,items:reader.itemsOf(c.id),source:c.owner,text:(rawText(r.content)||questionText(r.content)).slice(0,PROMPT_CHARS)};};

// ---- the booklet ----------------------------------------------------------------------------------------
const questionBlocks=project=>project.sections.flatMap(s=>s.blocks.filter(b=>b.type==='question'));
export function bookletExclusions(project){
 const ids=new Set(),signatures=new Set();
 for(const block of questionBlocks(project)){if(block.bankRef?.id)ids.add(block.bankRef.id);if(block.content)for(const key of exerciseSignatures(block))signatures.add(key);}
 return {ids,signatures};
}
// Questions removed from a bank-drawn section (James's cuts, Studio deletions) are never drawn again. Read from
// the whole booklet: a re-draw replaces its own sections, and their lists with them (14 November 2026).
export const removedBankIds=project=>new Set(project.sections.flatMap(s=>(s.bankDraw?.removed??[]).map(r=>r.id)));
const removedFrom=(project,sectionId)=>project.sections.find(s=>s.id===sectionId)?.bankDraw?.removed??[];
// The booklet's Exam questions, numbered, for Mixed practice to prepare for (James, 14 November 2026: "the mixed
// review questions should prepare students as much as possible for the exam questions").
export const EXAM_STEM_CHARS=220;
export function examQuestions(project){
 const exam=project.sections.filter(s=>s.role==='exam'&&!/^exercise$/i.test(s.title??''));
 return exam.flatMap(s=>s.blocks.filter(b=>b.type==='question')).map((b,i)=>({n:i+1,skill:b.classification?.primarySkillId??null,text:rawText(b.content).slice(0,EXAM_STEM_CHARS)}));
}
const isFront=s=>s.role==='front-matter'||s.topicId==='front-matter';
const isTeaching=s=>!isFront(s)&&(s.phase==='teaching'||s.role==='teaching')&&!/^mixed practice$/i.test(s.title??'');
// Existing practice sections (not made here), classified by what they stand for. Roles are inconsistent
// across masters (14 teaching "Mixed practice", Exercises under practice/exam/challenge roles), so the
// title and topic id count as much as the role.
const REVIEW_TOPIC=/^mixed-|-review$|^review-|^mixed$/;
export function existingPracticeSections(project){
 const out={exercises:new Map(),reviews:[],challenges:[],exam:null},taught=new Set(teachingTopics(project).map(t=>t.id));
 for(const s of project.sections){
  if(s.bankDraw)continue;
  if(s.role==='exam'&&!/^exercise$/i.test(s.title??'')){out.exam??=s;continue;}
  if(s.role==='challenge'||s.topicId==='challenge'){out.challenges.push(s);continue;}
  // A "Mixed practice" section inside a taught topic is that topic's exercise, not a booklet-wide review.
  if(s.mixedReviewImport||REVIEW_TOPIC.test(s.topicId??'')||!taught.has(s.topicId)&&/^(mixed practice|mixed review|review)$/i.test(s.title??'')){out.reviews.push(s);continue;}
  const practice=s.phase==='practice'||['mixed-practice','practice'].includes(s.role)||/^(exercise|mixed)/i.test(s.title??'');
  if(practice&&s.topicId&&!isFront(s)){const rows=out.exercises.get(s.topicId)??[];rows.push(s);out.exercises.set(s.topicId,rows);}
 }
 return out;
}
// Topics in order of first teaching section, with their section span.
export function teachingTopics(project){
 const topics=new Map(),titles=new Map((project.topics??[]).map(t=>[t.id,t.title]));
 project.sections.forEach((s,i)=>{if(!isTeaching(s)||!s.topicId)return;const t=topics.get(s.topicId);if(t)t.last=i;else topics.set(s.topicId,{id:s.topicId,title:titles.get(s.topicId)??s.title,first:i,last:i});});
 return [...topics.values()];
}
// Where each topic's Exercise goes: after the end of its run of overlapping topics, so a topic taught inside
// another (Negative fractions inside binomial fractions in the pilot) never splits the outer topic.
export function exerciseAnchors(project){
 const topics=teachingTopics(project),anchors=new Map();let group=[],end=-1;
 const close=()=>{for(const t of group)anchors.set(t.id,project.sections[end].id);group=[];};
 for(const t of topics){if(group.length&&t.first>end)close();group.push(t);end=Math.max(end,t.last);}
 if(group.length)close();
 return anchors;
}
// Every worked example of a topic, in teaching order: the exercise opens with practice of each (audit v2 Aim 6).
// Worked examples keep their prompts in `content` or, in the v4 examples block, in `examples[].prompt` with
// the working in `theorySolution`; reading only `content` gave the picker empty text (14 November 2026).
const exampleText=b=>b.content?rawText({prompt:b.content}):(b.examples??[]).map(e=>[(e.label?'('+e.label+') ':'')+rawText({prompt:e.prompt}),typeof e.theorySolution==='string'?'working: '+e.theorySolution.replace(/\\color\{[^}]*\}|\\,/g,'').slice(0,160):''].filter(Boolean).join(' ')).join(' | ');
export const workedExamples=(project,topicId)=>project.sections.filter(s=>s.topicId===topicId&&isTeaching(s)).flatMap(s=>s.blocks).filter(b=>b.type==='worked-example').map(b=>({id:b.id,title:b.title??'',text:exampleText(b).slice(0,400)}));
const workedText=(project,topicId)=>project.sections.filter(s=>s.topicId===topicId&&isTeaching(s)).flatMap(s=>s.blocks).filter(b=>b.type==='worked-example').slice(0,2).map(b=>(b.title?b.title+': ':'')+(exampleText(b)||'')).join(' | ').slice(0,600);
const ownSkills=(project,topicId)=>[...new Set(project.sections.filter(s=>s.topicId===topicId&&isTeaching(s)).flatMap(s=>s.blocks).map(b=>b.classification?.primarySkillId).filter(Boolean))];

// ---- shortlist ----------------------------------------------------------------------------------------------
// Primary skill in the set, not already in the booklet (bank id or prompt signature), then at most perSkill per
// skill spread evenly across the ratings.
export function shortlist(candidates,skills,{exclude={ids:new Set(),signatures:new Set()},perSkill=16,minScore=0,maxScore=100,signaturesOf=()=>[],reject=()=>null}={}){
 const wanted=new Set(skills),bySkill=new Map();
 for(const c of candidates){
  if(!wanted.has(c.skill)||exclude.ids.has(c.id)||c.score<minScore||c.score>maxScore)continue;
  if(signaturesOf(c).some(k=>exclude.signatures.has(k))||reject(c))continue;
  const rows=bySkill.get(c.skill)??[];rows.push(c);bySkill.set(c.skill,rows);
 }
 const out=[];
 for(const rows of bySkill.values()){
  rows.sort((a,b)=>a.score-b.score||a.id.localeCompare(b.id));
  if(rows.length<=perSkill){out.push(...rows);continue;}
  const picked=new Set();for(let i=0;i<perSkill;i++)picked.add(Math.round(i*(rows.length-1)/(perSkill-1)));
  out.push(...[...picked].map(i=>rows[i]));
 }
 return out;
}

// ---- budgets --------------------------------------------------------------------------------------------------
// A skill is within its ceiling when dropping its smallest question would leave it below the ceiling: the
// picker may finish a skill with one question that crosses the line, never two.
export function overCeiling(ids,{itemsOf,skillOf,ceiling}){
 const bySkill=new Map();for(const id of ids){const rows=bySkill.get(skillOf(id))??[];rows.push(itemsOf(id));bySkill.set(skillOf(id),rows);}
 return [...bySkill].filter(([,rows])=>rows.reduce((a,b)=>a+b,0)-Math.min(...rows)>=ceiling).map(([skill,rows])=>({skill,items:rows.reduce((a,b)=>a+b,0)}));
}
// Skills that ended below their floor although the shortlist had items to spare (reported, not refused: the
// picker may stop for variety). Supply is the shortlist's items for that skill.
export function belowFloor(ids,list,{itemsOf,floor}){
 const picked=new Map(),supply=new Map();
 for(const c of list)supply.set(c.skill,(supply.get(c.skill)??0)+itemsOf(c.id));
 const skillOf=new Map(list.map(c=>[c.id,c.skill]));for(const id of ids)picked.set(skillOf.get(id),(picked.get(skillOf.get(id))??0)+itemsOf(id));
 return [...supply].filter(([s,have])=>(picked.get(s)??0)<Math.min(floor,have)).map(([skill,have])=>({skill,items:picked.get(skill)??0,supply:have}));
}
// ---- exercise order (audit v2 Aims 5 and 6) -------------------------------------------------------------
// Neighbouring routine questions differ by at most 15 points (Aim 5). Bank draws only select, so the order is
// score order; ties put a worked example's opening practice first, in teaching order.
export const JUMP_LIMIT=15;
export function orderExercise(ids,{scoreOf,openings={}}){
 const rank=new Map(Object.values(openings).filter(Boolean).map((id,i)=>[id,i]));
 return [...ids].sort((a,b)=>scoreOf(a)-scoreOf(b)||(rank.get(a)??1e9)-(rank.get(b)??1e9)||a.localeCompare(b));
}
export function jumps(ordered,scoreOf,limit=JUMP_LIMIT){
 const out=[];for(let i=1;i<ordered.length;i++){const d=scoreOf(ordered[i])-scoreOf(ordered[i-1]);if(d>limit)out.push({from:ordered[i-1],to:ordered[i],fromScore:scoreOf(ordered[i-1]),toScore:scoreOf(ordered[i]),jump:d});}
 return out;
}
// A jump is avoidable when an unpicked shortlist question lies strictly between its neighbours and adding it
// keeps that question's skill within the ceiling. Those are refused; the rest are reported for the audit.
export function avoidableJumps(ids,list,{scoreOf,itemsOf,skillOf,ceiling,limit=JUMP_LIMIT}){
 const picked=new Set(ids),ordered=orderExercise(ids,{scoreOf});
 return jumps(ordered,scoreOf,limit).flatMap(j=>{
  const fill=list.find(c=>!picked.has(c.id)&&c.score>j.fromScore&&c.score<j.toScore&&!overCeiling([...ids,c.id],{itemsOf,skillOf,ceiling}).some(o=>o.skill===c.skill));
  return fill?[{...j,fill:fill.id}]:[];
 });
}
// The exercise opens with practice of the topic's worked examples: each example's matching question must be
// picked, and sit in the easier half of the exercise.
export function openingProblems(ids,openings,examples,{scoreOf}){
 const ordered=orderExercise(ids,{scoreOf,openings}),half=Math.ceil(ordered.length/2),problems=[];
 for(const ex of examples){
  const id=openings[ex.id];
  if(id==null)continue;
  if(!ids.includes(id))problems.push(`${ex.id}: its opening practice ${id} is not among the picks`);
  else if(ordered.indexOf(id)>=half)problems.push(`${ex.id}: its opening practice ${id} is in the harder half (position ${ordered.indexOf(id)+1} of ${ordered.length}); pick an easier question of the example's type`);
 }
 return problems;
}
export function parseRange(value,fallback){
 if(value===undefined)return fallback;const m=/^(\d+)-(\d+)$/.exec(String(value));
 if(!m||+m[1]>+m[2]||+m[2]<1)throw Error('Use FLOOR-CEILING, for example 6-12; got '+value);
 return {...fallback,floor:+m[1],ceiling:+m[2]};
}

// ---- model picks --------------------------------------------------------------------------------------------
// Over a skill's ceiling, drop that skill's hardest questions (never a kept one) until it fits. The pilot's
// picker filled several skills to 19–21 of 18 items (13 November 2026); trimming keeps the rest of the pick.
export function trimToCeiling(ids,{itemsOf,skillOf,scoreOf,ceiling,keep=new Set()}){
 let out=[...ids];const dropped=[];
 for(let over=overCeiling(out,{itemsOf,skillOf,ceiling});over.length;over=overCeiling(out,{itemsOf,skillOf,ceiling})){
  const skill=over[0].skill,victim=out.filter(id=>skillOf(id)===skill&&!keep.has(id)).sort((a,b)=>scoreOf(b)-scoreOf(a)||b.localeCompare(a))[0];
  if(!victim)break;
  out=out.filter(id=>id!==victim);dropped.push({id:victim,reason:'over the '+ceiling+'-item ceiling for '+skill});
 }
 return {ids:out,dropped};
}
// Hard errors are structural only. Ids off the shortlist or repeated are dropped and a skill over its ceiling
// is trimmed, all recorded, because callSonnet's retry resends the same prompt without the error.
export function validateExercisePick(reply,lists,{itemsOf,skillOf,scoreOf=()=>0,budget=DEFAULT_BUDGET.exercises,shortlists={},examples={}}){
 if(!reply||typeof reply.topics!=='object')throw Error('Reply needs {"topics":{topicId:[ids]},"openings":{topicId:{workedExampleId:id|null}},"notes":{skillId:"why"}}');
 const used=new Set(),out={},openings={},dropped={},problems=[];
 for(const [topicId,raw] of Object.entries(reply.topics)){
  const allowed=lists[topicId];if(!allowed){problems.push('unknown topic '+topicId);continue;}
  if(!Array.isArray(raw))throw Error(topicId+': ids must be a list');
  const ids=[],drop=dropped[topicId]=[];
  for(const id of raw){if(!allowed.has(id))drop.push({id,reason:'not on the shortlist'});else if(used.has(id))drop.push({id,reason:'used twice'});else{used.add(id);ids.push(id);}}
  // Openings name the topic's own worked examples and shortlist questions; anything else is dropped here
  // and the gap is reported by finishExercise.
  const given=reply.openings?.[topicId]??{};
  openings[topicId]=Object.fromEntries((examples[topicId]??[]).map(e=>[e.id,allowed.has(given[e.id])?given[e.id]:null]));
  const trimmed=trimToCeiling(ids,{itemsOf,skillOf,scoreOf,ceiling:budget.ceiling,keep:new Set(Object.values(openings[topicId]).filter(Boolean))});
  drop.push(...trimmed.dropped);
  out[topicId]=trimmed.ids;
 }
 for(const topicId of Object.keys(lists))if(!out[topicId]?.length)problems.push(topicId+': no questions picked');
 if(problems.length)throw Error(problems.join('; '));
 return {topics:out,openings,dropped,notes:typeof reply.notes==='object'&&reply.notes?reply.notes:{}};
}
// Move a question that sits next to one from the same topic to the nearest later place where it does not.
export function separateTopics(ids,topicOf){
 const out=[...ids];
 for(let i=1;i<out.length;i++){
  if(topicOf(out[i])!==topicOf(out[i-1]))continue;
  const j=out.findIndex((id,k)=>k>i&&topicOf(id)!==topicOf(out[i-1]));
  if(j<0)continue;const [moved]=out.splice(j,1);out.splice(i,0,moved);
 }
 return out;
}
// After the pick, the script (selection only): adds a named opening question that was left out, fills each
// avoidable jump with the shortlist question nearest its midpoint, orders by score, and reports what is left
// (unavoidable jumps, worked examples with no opening practice or with it in the harder half).
export function finishExercise(ids,list,{openings={},examples=[],scoreOf,itemsOf,skillOf,ceiling}){
 const picked=[...ids],added=[];
 const fits=id=>!overCeiling([...picked,id],{itemsOf,skillOf,ceiling}).some(o=>o.skill===skillOf(id));
 for(const id of Object.values(openings))if(id&&!picked.includes(id)&&fits(id)){picked.push(id);added.push({id,reason:'opening practice'});}
 for(let guard=0;guard<50;guard++){
  const j=avoidableJumps(picked,list,{scoreOf,itemsOf,skillOf,ceiling})[0];if(!j)break;
  const mid=(j.fromScore+j.toScore)/2,options=list.filter(c=>!picked.includes(c.id)&&c.score>j.fromScore&&c.score<j.toScore&&fits(c.id)).sort((a,b)=>Math.abs(a.score-mid)-Math.abs(b.score-mid)||a.id.localeCompare(b.id));
  picked.push(options[0].id);added.push({id:options[0].id,reason:`fills ${j.fromScore}→${j.toScore}`});
 }
 const ordered=orderExercise(picked,{scoreOf,openings});
 const unopened=examples.filter(e=>!openings[e.id]||!picked.includes(openings[e.id])).map(e=>e.id);
 return {ids:ordered,added,jumps:jumps(ordered,scoreOf),unopened,lateOpenings:openingProblems(picked,openings,examples,{scoreOf}).filter(p=>p.includes('harder half'))};
}
// Like the exercise pick: structural problems fail; stray or repeated ids are dropped, a skill over its ceiling
// is trimmed (hardest first), Challenge is cut to its per-skill and total limits (first listed kept), same-topic
// neighbours are separated, and what remains off target (band ratio, unseparable neighbours) is reported.
// With Exam questions, every Mixed pick names the exam questions (by number) it prepares for; a pick that
// prepares for none is dropped.
export function validateMixedPick(reply,{mixed,challenge,topicOf,challengeWanted,bandOf=null,supply=null,itemsOf=()=>1,skillOf=()=>null,scoreOf=()=>0,budget=DEFAULT_BUDGET,examCount=0}){
 if(!Array.isArray(reply?.mixed))throw Error('Reply needs {"mixed":[ids],"challenge":[ids],"notes":{}}');
 const used=new Set(),dropped=[],take=(ids,allowed,name)=>(Array.isArray(ids)?ids:[]).filter(id=>{if(!allowed.has(id)){dropped.push({id,section:name,reason:'not on the shortlist'});return false;}if(used.has(id)){dropped.push({id,section:name,reason:'used twice'});return false;}used.add(id);return true;});
 let picked=take(reply.mixed,mixed,'mixed');
 const prepares={};
 if(examCount){
  picked=picked.filter(id=>{const ns=(Array.isArray(reply.prepares?.[id])?reply.prepares[id]:[]).map(Number).filter(n=>Number.isInteger(n)&&n>=1&&n<=examCount);if(!ns.length){dropped.push({id,section:'mixed',reason:'prepares for no exam question'});return false;}prepares[id]=ns;return true;});
 }
 const trimmed=trimToCeiling(picked,{itemsOf,skillOf,scoreOf,ceiling:budget.mixed.ceiling});
 dropped.push(...trimmed.dropped.map(d=>({...d,section:'mixed'})));
 picked=separateTopics(trimmed.ids,topicOf);
 if(!picked.length&&mixed.size)throw Error('mixed: no questions picked');
 const perSkill=new Map(),challengeIds=[];
 for(const id of challengeWanted?take(reply.challenge,challenge,'challenge'):[]){
  const s=skillOf(id),n=perSkill.get(s)??0;
  if(n>=budget.challenge.perSkill){dropped.push({id,section:'challenge',reason:'over '+budget.challenge.perSkill+' per skill'});continue;}
  if(challengeIds.length>=budget.challenge.max){dropped.push({id,section:'challenge',reason:'over '+budget.challenge.max+' in all'});continue;}
  perSkill.set(s,n+1);challengeIds.push(id);
 }
 const problems=[];
 for(let i=1;i<picked.length;i++)if(topicOf(picked[i])===topicOf(picked[i-1]))problems.push(`${picked[i-1]} and ${picked[i]} are neighbours from one topic`);
 if(bandOf&&supply){
  // 1 : 2 : 1 by question count, within a tenth of the section (at least one question) per band.
  const counts={};for(const id of picked){const b=bandOf(id);counts[b]=(counts[b]??0)+1;}
  const target=bandTargets(picked.length,supply),slack=Math.max(1,Math.round(picked.length/10));
  for(const b of MIXED_BANDS)if(Math.abs((counts[b.id]??0)-target[b.id])>slack)problems.push(`${counts[b.id]??0} ${b.id} questions; 1 : 2 : 1 would be ${target[b.id]} of ${picked.length}`);
 }
 if(examCount){const hit=new Set(picked.flatMap(id=>prepares[id]));if(hit.size<examCount/3)problems.push(`Mixed practice prepares for ${hit.size} of ${examCount} exam questions`);}
 return {mixed:picked,challenge:challengeIds,dropped,problems,prepares,notes:typeof reply.notes==='object'&&reply.notes?reply.notes:{}};
}
async function sonnet(dir,{stage,system,prompt,validate}){
 const {callSonnet}=await import('./audit-v2.mjs');
 const stamp=new Date().toISOString().replace(/\D/g,'').slice(0,14),workDir=path.join(dir,stamp.slice(0,8)+'-'+stamp.slice(8));
 // callSonnet's reply reuse lists the folder above workDir, so it must exist before the first call.
 fs.mkdirSync(workDir,{recursive:true});
 const ctx={workDir,runDir:dir,calls:[],log:m=>console.error(m)};
 const {value,file}=await callSonnet(ctx,{stage,system,prompt,validate});
 return {value,file,calls:ctx.calls.map(({id,model,effort,elapsedMs,costUsd,ok})=>({id,model,effort,elapsedMs,costUsd,ok}))};
}
const SYSTEM='You select existing, already rated questions from a question bank for a NSW secondary mathematics booklet. You never write or change questions. Reply with one JSON object only.';
const VARIETY='Give as much practice as the budget allows without repetition: a question is repetitive when it asks for the same kind of working as one already picked with only the numbers changed and no new feature (a new form, a new step, a context, a reverse question, a trap). Leave out any question that needs content this booklet does not teach (in an algebra booklet, for example, limits, the discriminant or continued fractions), even when its skill matches. When every further candidate for a skill would be repetitive, stop that skill below its ceiling and say why in notes. "items" is the number of parts a student answers on its own (at most 3 counted per question).';

// ---- topic-to-skill map -------------------------------------------------------------------------------------
export const mapFile=(projectId,root=ROOT)=>path.join(projectDir(projectId,root),'topic-skills.json');
export function readMap(projectId,{root=ROOT,confirmed=true}={}){
 const file=mapFile(projectId,root);if(!fs.existsSync(file))throw Error('No topic-to-skill map; run: node pedagogy/bank-draw.mjs map --project '+projectId);
 const map=read(file);if(confirmed&&!map.confirmed)throw Error('The topic-to-skill map is not confirmed; show '+path.relative(root,file)+' to James, then run confirm-map');
 return map;
}
export const skillTopic=map=>{const out=new Map();for(const [topicId,skills] of Object.entries(map.topics))for(const s of skills)if(!out.has(s))out.set(s,topicId);return out;};
async function runMap(project,{sources,root=ROOT}){
 const skillsData=new Map(read(path.join(root,'data','skills.json')).map(s=>[s.id,s.title]));
 const candidates=loadCandidates({sources,root}),counts=new Map();for(const c of candidates)counts.set(c.skill,(counts.get(c.skill)??0)+1);
 const topics=teachingTopics(project).map(t=>({id:t.id,title:t.title,ownSkills:ownSkills(project,t.id),workedExamples:workedText(project,t.id)}));
 const pool=[...counts].sort((a,b)=>b[1]-a[1]).map(([id,n])=>({id,title:skillsData.get(id)??id,questions:n}));
 const valid=new Set(pool.map(s=>s.id));
 const prompt=['Booklet: '+project.title+'. Assign bank skills to the booklet topics that teach them. A skill goes to at most one topic: the topic whose taught method it practises. Leave out skills the booklet does not teach.','Reply: {"topics":{"<topicId>":["<skillId>",...]},"unassigned":["<skillId>",...]}','TOPICS '+JSON.stringify(topics),'BANK SKILLS '+JSON.stringify(pool)].join('\n\n');
 const validate=reply=>{const seen=new Set();for(const [t,ids] of Object.entries(reply?.topics??{})){if(!topics.some(x=>x.id===t))throw Error('Unknown topic '+t);for(const s of ids){if(!valid.has(s))throw Error('Unknown skill '+s);if(seen.has(s))throw Error(s+' assigned twice');seen.add(s);}}return reply;};
 const dir=projectDir(project.id,root),call=await sonnet(dir,{stage:'map',system:SYSTEM,prompt,validate});
 const map={projectId:project.id,revision:project.revision,sources,createdAt:new Date().toISOString(),confirmed:null,call:call.file,calls:call.calls,
  topics:Object.fromEntries(topics.map(t=>[t.id,[...new Set([...t.ownSkills,...(call.value.topics[t.id]??[])])]])),
  suggested:call.value.topics,unassigned:pool.filter(s=>!Object.values(call.value.topics).flat().includes(s.id)).map(s=>s.id)};
 write(mapFile(project.id,root),map);
 const lines=['# Topic-to-skill map: '+project.title,'',`Proposed for revision ${project.revision} from sources ${sources.join(', ')}. Edit \`topics\` in topic-skills.json if needed, then confirm.`,''];
 for(const t of topics){lines.push('## '+t.title+' (`'+t.id+'`)','');for(const s of map.topics[t.id])lines.push(`- ${skillsData.get(s)??s} \`${s}\` — ${counts.get(s)??0} bank questions${t.ownSkills.includes(s)?' (on the booklet\'s own questions)':''}`);lines.push('');}
 lines.push('## Not assigned','',...map.unassigned.map(s=>`- ${skillsData.get(s)??s} \`${s}\` (${counts.get(s)})`));
 write(path.join(dir,'topic-skills.md'),lines.join('\n')+'\n');
 return map;
}

// ---- proposals ----------------------------------------------------------------------------------------------
const proposalFile=(projectId,command,root=ROOT)=>path.join(projectDir(projectId,root),'proposal-'+command+'.json');
function preflight(project){
 if(project.library?.category!=='master')throw Error(project.id+' is not a master');
 return import('./bank-batch.mjs').then(({busyProjects})=>{const busy=busyProjects([project]);if(busy.size)throw Error(project.id+' is busy: '+busy.get(project.id).slice(0,200));});
}
const withoutOwnSections=(project,commands)=>({...project,sections:project.sections.filter(s=>!commands.includes(s.bankDraw?.command))});
const byScore=byId=>(a,b)=>byId.get(a).score-byId.get(b).score||a.localeCompare(b);

async function proposeExercises(project,{sources,budget,root=ROOT}){
 const map=readMap(project.id,{root}),live=withoutOwnSections(project,['exercises']),reader=bankReader(root);
 const existing=existingPracticeSections(live),exclude=bookletExclusions(live);
 for(const id of removedBankIds(project))exclude.ids.add(id);
 const candidates=loadCandidates({sources,root}),byId=new Map(candidates.map(c=>[c.id,c])),topics=teachingTopics(live),kept=[],gaps=[],lists={},views={},shortlists={},examples={};
 for(const t of topics){
  if(existing.exercises.has(t.id)){kept.push({topicId:t.id,title:t.title,sections:existing.exercises.get(t.id).map(s=>s.id)});continue;}
  const list=shortlist(candidates,map.topics[t.id]??[],{exclude,maxScore:CHALLENGE_SCORE-1,perSkill:budget.shortlistPerSkill,signaturesOf:reader.signaturesOf,reject:c=>unsuitable(reader.record(c.id))});
  if(list.length<MIN_EXERCISE_CANDIDATES){gaps.push({topicId:t.id,title:t.title,candidates:list.length,skills:map.topics[t.id]??[]});continue;}
  shortlists[t.id]=list;lists[t.id]=new Set(list.map(c=>c.id));examples[t.id]=workedExamples(live,t.id);
  const skills=[...new Set(list.map(c=>c.skill))].map(s=>({skill:s,supplyItems:list.filter(c=>c.skill===s).reduce((n,c)=>n+reader.itemsOf(c.id),0)}));
  views[t.id]={title:t.title,workedExamples:examples[t.id],skills,candidates:list.map(c=>candidateView(c,reader))};
 }
 let picks={topics:{},openings:{},notes:{}},call=null;
 const scoreOf=id=>byId.get(id).score,skillOf=id=>byId.get(id).skill;
 if(Object.keys(lists).length){
  const prompt=['Booklet: '+project.title+'. Build the Exercise that follows each topic\'s teaching. Budget per skill: '+budget.floor+' to '+budget.ceiling+' practice items; a skill may end with one question that crosses the ceiling. A topic with more skills therefore gets more questions. Pick questions that practise what the topic teaches and cover its different question types.',
   'The exercise is printed in score order, so build as gentle a difficulty gradient as the list allows: start with the easiest suitable questions and avoid gaps of more than '+JUMP_LIMIT+' points between neighbouring scores. The first questions must follow on from the worked examples: for each worked example, name in "openings" the question that practises exactly its method and type at a similar or slightly higher difficulty, chosen from the easy end of the list; use null only when the list has none.',
   VARIETY+' Use each id at most once overall, and only ids from that topic\'s list. score is the 0–100 reasoning rating.',
   'Reply: {"topics":{"<topicId>":["<id>",...]},"openings":{"<topicId>":{"<workedExampleId>":"<id>"|null}},"notes":{"<skillId or workedExampleId>":"why it stops below the ceiling, or why no opening practice"}}','TOPICS '+JSON.stringify(views)].join('\n\n');
  call=await sonnet(projectDir(project.id,root),{stage:'exercises',system:SYSTEM,prompt,validate:r=>validateExercisePick(r,lists,{itemsOf:reader.itemsOf,skillOf,scoreOf,budget,shortlists,examples})});picks=call.value;
 }
 const finished=Object.fromEntries(Object.entries(picks.topics).map(([topicId,ids])=>[topicId,finishExercise(ids,shortlists[topicId],{openings:picks.openings[topicId],examples:examples[topicId],scoreOf,itemsOf:reader.itemsOf,skillOf,ceiling:budget.ceiling})]));
 const sections=Object.entries(finished).map(([topicId,f])=>({kind:'exercises',topicId,title:'Exercise',bankIds:f.ids,added:f.added,dropped:picks.dropped?.[topicId]??[],jumps:f.jumps,openings:picks.openings[topicId],unopened:f.unopened,lateOpenings:f.lateOpenings}));
 const pickedIds=new Set(sections.flatMap(s=>s.bankIds));
 const short=Object.entries(shortlists).flatMap(([topicId,list])=>belowFloor(finished[topicId]?.ids??[],list,{itemsOf:reader.itemsOf,floor:budget.floor}).map(b=>({...b,topicId,note:picks.notes[b.skill]??null})));
 return {command:'exercises',budget:{exercises:budget},sections,kept,gaps,belowFloor:short,notes:picks.notes,items:itemTotals(sections,reader,byId),unused:unusedBySkill(Object.values(lists).flatMap(s=>[...s]),pickedIds,byId),call:call?.file??null,calls:call?.calls??[]};
}

async function proposeMixed(project,{sources,budget,root=ROOT}){
 const map=readMap(project.id,{root}),live=withoutOwnSections(project,['mixed','challenge']),reader=bankReader(root);
 const existing=existingPracticeSections(live),exclude=bookletExclusions(live),topicOf=skillTopic(map);
 for(const id of removedBankIds(project))exclude.ids.add(id);
 const exam=examQuestions(live);
 // An exercise proposal awaiting approval on this revision counts as in the booklet, so the two previews can
 // be reviewed together without drawing the same question twice.
 const pending=proposalFile(project.id,'exercises',root);
 if(fs.existsSync(pending)){const p=read(pending);if(!p.savedAt&&p.revision===project.revision)for(const s of p.sections)for(const id of s.bankIds){exclude.ids.add(id);for(const k of reader.signaturesOf({id}))exclude.signatures.add(k);}}
 const candidates=loadCandidates({sources,root}),skills=[...topicOf.keys()],byId=new Map(candidates.map(c=>[c.id,c]));
 const mixedList=MIXED_BANDS.flatMap(b=>shortlist(candidates,skills,{exclude,minScore:b.minScore,maxScore:b.maxScore,signaturesOf:reader.signaturesOf,perSkill:b.perSkill,reject:c=>unsuitable(reader.record(c.id),{workingSpace:false})}));
 const supply={};for(const c of mixedList){const b=mixedBand(c.score);supply[b]=(supply[b]??0)+1;}
 const challengeWanted=!existing.challenges.length;
 const challengeList=challengeWanted?shortlist(candidates,skills,{exclude,minScore:CHALLENGE_SCORE,signaturesOf:reader.signaturesOf,perSkill:budget.challenge.shortlistPerSkill,reject:c=>unsuitable(reader.record(c.id))}):[];
 const topics=teachingTopics(live),topicTitle=new Map(topics.map(t=>[t.id,t.title]));
 const covered=new Set(mixedList.map(c=>topicOf.get(c.skill)));
 const base={existingReviews:existing.reviews.map(s=>({id:s.id,title:s.title,topicId:s.topicId})),existingChallenge:existing.challenges.map(s=>s.id)};
 if(!mixedList.length)return {command:'mixed',budget,sections:[],...base,gaps:[{candidates:0}],belowFloor:[],notes:{},unused:{},call:null,calls:[]};
 const view=c=>({...candidateView(c,reader),topic:topicOf.get(c.skill),band:mixedBand(c.score)});
 // Mixed practice comes just before the Exam questions and prepares students for them: its spread follows the
 // exam's, and a skill the exam does not assess (number theory, proof by contradiction in an algebra booklet)
 // gets no question (James, 14 November 2026).
 const examRule=exam.length?' Mixed practice comes just before the EXAM questions and must prepare students for them as directly as possible. Spread the questions across topics roughly in proportion to how often the exam assesses each topic, and prefer the exam\'s styles: multi-step simplifications, "show that" and "hence" questions, and the forms the exam uses. Leave out skills and styles the exam never assesses (for example proofs, number theory or classification of numbers when the exam asks none), even when they are in MIXED. For every picked id, list in "prepares" the numbers of the exam questions it prepares for; a question that prepares for none is not picked.':' At least one question for every skill in MIXED where that is possible.';
 const prompt=['Booklet: '+project.title+'. Build one interleaved Mixed practice section from MIXED. Budget per skill: '+budget.mixed.floor+' to '+budget.mixed.ceiling+' practice items; a skill may end with one question that crosses the ceiling.'+examRule+' Order the questions so that no two neighbours come from the same topic and difficulty (score) rises overall. Keep the difficulty bands Foundation : Development : Mastery at 1 : 2 : 1 by number of questions. '+VARIETY+' '+(challengeWanted?'Then pick a Challenge section from CHALLENGE: at most '+budget.challenge.perSkill+' question per skill and '+budget.challenge.max+' in all, the most worthwhile first.':'The booklet already has a Challenge section; return "challenge": [].')+' Use each id once.','Reply: {"mixed":["<id>",...],'+(exam.length?'"prepares":{"<id>":[<exam number>,...]},':'')+'"challenge":["<id>",...],"notes":{"<skillId>":"why it stops below the floor or has no question"}}',...(exam.length?['EXAM '+JSON.stringify(exam.map(({n,text})=>({n,text})))]:[]),'TOPICS '+JSON.stringify(topics.filter(t=>covered.has(t.id)).map(t=>({id:t.id,title:t.title}))),'MIXED '+JSON.stringify(mixedList.map(view)),'CHALLENGE '+JSON.stringify(challengeList.map(view))].join('\n\n');
 const sets={mixed:new Set(mixedList.map(c=>c.id)),challenge:new Set(challengeList.map(c=>c.id)),topicOf:id=>topicOf.get(byId.get(id)?.skill),challengeWanted,bandOf:id=>mixedBand(byId.get(id)?.score),supply,itemsOf:reader.itemsOf,skillOf:id=>byId.get(id)?.skill,scoreOf:id=>byId.get(id)?.score??0,budget,examCount:exam.length};
 const call=await sonnet(projectDir(project.id,root),{stage:'mixed',system:SYSTEM,prompt,validate:r=>validateMixedPick(r,sets)});
 const sections=[{kind:'mixed',title:'Mixed practice',bankIds:call.value.mixed,...(exam.length?{prepares:call.value.prepares,examQuestions:exam.length}:{})}];
 if(call.value.challenge.length)sections.push({kind:'challenge',title:'Challenge exercise',bankIds:[...call.value.challenge].sort(byScore(byId))});
 const picked=new Set(sections.flatMap(s=>s.bankIds));
 const missing=[...covered].filter(t=>!call.value.mixed.some(id=>sets.topicOf(id)===t)).map(t=>({topicId:t,title:topicTitle.get(t),note:'candidates but none picked'}));
 const uncovered=topics.filter(t=>!covered.has(t.id)).map(t=>({topicId:t.id,title:t.title,candidates:0}));
 const short=belowFloor(call.value.mixed,mixedList,{itemsOf:reader.itemsOf,floor:budget.mixed.floor}).map(b=>({...b,topicId:topicOf.get(b.skill),note:call.value.notes[b.skill]??null}));
 return {command:'mixed',budget,sections,...base,gaps:[...uncovered,...missing],belowFloor:short,notes:call.value.notes,dropped:call.value.dropped,problems:call.value.problems,items:itemTotals(sections,reader,byId),unused:unusedBySkill([...sets.mixed,...sets.challenge],picked,byId),call:call.file,calls:call.calls};
}
function unusedBySkill(ids,picked,byId){const out={};for(const id of ids)if(!picked.has(id)){const s=byId.get(id).skill;out[s]=(out[s]??0)+1;}return out;}
function itemTotals(sections,reader,byId){const out={};for(const s of sections)for(const id of s.bankIds){const k=(s.topicId??s.kind)+' '+byId.get(id).skill;out[k]=(out[k]??0)+reader.itemsOf(id);}return out;}

function report(project,proposal,root){
 const reader=bankReader(root),titles=new Map((project.topics??[]).map(t=>[t.id,t.title]));
 const count=proposal.sections.reduce((n,s)=>n+s.bankIds.length,0),items=Object.values(proposal.items??{}).reduce((a,b)=>a+b,0);
 const lines=[`# Bank draw ${proposal.command}: ${project.title}`,'',`Revision ${proposal.revision}; sources ${proposal.sources.join(', ')}; ${count} questions (${items} practice items) in ${proposal.sections.length} sections. Budget: ${JSON.stringify(proposal.budget)}.`,''];
 for(const s of proposal.sections){
  lines.push(`## ${s.title}${s.topicId?' — '+(titles.get(s.topicId)??s.topicId):''}`,'','| # | Bank id | Source | Skill | Score | Items |','|---|---|---|---|---|---|');
  const opens=new Map(Object.entries(s.openings??{}).filter(([,id])=>id).map(([ex,id])=>[id,ex])),added=new Map((s.added??[]).map(a=>[a.id,a.reason]));
  if(s.kind==='exercises')lines[lines.length-2]='| # | Bank id | Source | Skill | Score | Items | Note |',lines[lines.length-1]='|---|---|---|---|---|---|---|';
  if(s.prepares)lines[lines.length-2]='| # | Bank id | Source | Skill | Score | Items | Prepares for exam Q |',lines[lines.length-1]='|---|---|---|---|---|---|---|';
  s.bankIds.forEach((id,i)=>{const r=reader.record(id),c=proposal.rows[id],note=[opens.has(id)?'opens '+opens.get(id):'',added.has(id)?'added by script: '+added.get(id):''].filter(Boolean).join('; ');lines.push(`| ${i+1} | \`${id}\` | ${c.owner} | ${r.classification.primarySkillId} | ${r.classification.reasoningScore} | ${reader.itemsOf(id)} |${s.kind==='exercises'?' '+note+' |':s.prepares?' '+(s.prepares[id]??[]).join(', ')+' |':''}`);});lines.push('');
  if(s.jumps?.length)lines.push('Jumps over '+JUMP_LIMIT+' points the bank cannot fill: '+s.jumps.map(j=>`${j.fromScore}→${j.toScore}`).join(', ')+'.','');
  if(s.unopened?.length)lines.push('Worked examples with no opening practice: '+s.unopened.map(id=>'`'+id+'`').join(', ')+'.','');
  if(s.lateOpenings?.length)lines.push('Opening practice in the harder half: '+s.lateOpenings.join('; ')+'.','');
 }
 const drops=[...proposal.sections.flatMap(s=>(s.dropped??[]).map(d=>({...d,section:s.topicId??s.kind}))),...(proposal.dropped??[])];
 if(drops.length)lines.push('## Picks the script removed','',...drops.map(d=>`- \`${d.id}\` (${d.section}): ${d.reason}`),'');
 if(proposal.problems?.length)lines.push('## Left for review','',...proposal.problems.map(p=>'- '+p),'');
 if(proposal.belowFloor?.length)lines.push('## Skills below the floor','',...proposal.belowFloor.map(b=>`- \`${b.skill}\`${b.topicId?' ('+(titles.get(b.topicId)??b.topicId)+')':''}: ${b.items} of ${b.supply} available items${b.note?' — '+b.note:''}`),'');
 const notes=Object.entries(proposal.notes??{});if(notes.length)lines.push('## Picker notes','',...notes.map(([s,n])=>`- \`${s}\`: ${n}`),'');
 if(proposal.kept?.length)lines.push('## Existing exercises kept','',...proposal.kept.map(k=>`- ${k.title} (${k.sections.length} section${k.sections.length>1?'s':''})`),'');
 if(proposal.existingReviews?.length)lines.push('## Existing reviews kept (the new section goes after them, before Exam)','',...proposal.existingReviews.map(r=>`- ${r.title} \`${r.id}\``),'');
 if(proposal.existingChallenge?.length)lines.push('## Existing Challenge kept; no new Challenge added','');
 if(proposal.gaps?.length)lines.push('## Gaps','',...proposal.gaps.map(g=>`- ${g.title??'all topics'}: ${g.note??g.candidates+' candidates'}`),'');
 const unused=Object.entries(proposal.unused??{});if(unused.length)lines.push('## Unused shortlisted supply','',...unused.map(([s,n])=>`- \`${s}\`: ${n}`),'');
 return lines.join('\n')+'\n';
}
async function propose(project,command,{sources,budget,root=ROOT}){
 await preflight(project);
 const body=command==='exercises'?await proposeExercises(project,{sources,budget:budget.exercises,root}):await proposeMixed(project,{sources,budget,root});
 const candidates=new Map(loadCandidates({sources,root}).map(c=>[c.id,c]));
 const rows=Object.fromEntries(body.sections.flatMap(s=>s.bankIds).map(id=>[id,candidates.get(id)]));
 const proposal={projectId:project.id,revision:project.revision,sources,createdAt:new Date().toISOString(),...body,rows,approvedBy:null};
 // The candidate is built now so a placement or model error shows before James is asked.
 buildCandidate(project,proposal,{recordOf:id=>bankRecord(id,root)});
 write(proposalFile(project.id,command,root),proposal);
 write(path.join(projectDir(project.id,root),'proposal-'+command+'.md'),report(project,proposal,root));
 return proposal;
}

// ---- apply ------------------------------------------------------------------------------------------------
const marker=(proposal,command)=>({run:path.basename(RUN),command,version:VERSION,sources:proposal.sources,selection:'item-budget-shortlist-then-sonnet-pick',order:command==='mixed'?'interleaved-by-pick':'reasoningScore-then-bank-id',proposedAt:proposal.createdAt});
const newSection=(id,fields,proposal,command)=>({id,phase:'practice',headingStyle:'page-title',pageBreakBefore:true,difficulty:null,showDifficultyHeading:false,...fields,bankDraw:marker(proposal,command),blocks:[]});
export function buildCandidate(project,proposal,{recordOf,acceptRevision=null}){
 if(project.revision!==proposal.revision&&project.revision!==acceptRevision)throw Error(`Live revision is ${project.revision}; the proposal was made on ${proposal.revision}. Propose again.`);
 const commands=proposal.command==='mixed'?['mixed','challenge']:['exercises'];
 let next=structuredClone(withoutOwnSections(project,commands));
 next.topics=(next.topics??[]).filter(t=>!(commands.includes('mixed')&&t.id==='bank-draw-mixed-practice'));
 const exclude=bookletExclusions(next),inserted=[];
 for(const id of proposal.sections.flatMap(s=>s.bankIds))if(exclude.ids.has(id))throw Error(id+' is already in the booklet');
 const at=id=>next.sections.findIndex(s=>s.id===id);
 for(const s of proposal.sections){
  let section,index;
  if(s.kind==='exercises'){
   const anchors=exerciseAnchors(next),anchor=anchors.get(s.topicId);if(!anchor)throw Error('No teaching sections for topic '+s.topicId);
   index=at(anchor)+1;while(next.sections[index]?.bankDraw?.command==='exercises')index++;
   section=newSection('bank-draw-exercise-'+s.topicId,{topicId:s.topicId,role:'mixed-practice',title:'Exercise'},proposal,'exercises');
  }else if(s.kind==='mixed'){
   const exam=next.sections.findIndex(x=>x.role==='exam'&&!/^exercise$/i.test(x.title??''));
   const challenge=next.sections.findIndex(x=>x.role==='challenge'||x.topicId==='challenge');
   index=exam>=0?exam:challenge>=0?challenge:next.sections.length;
   section=newSection('bank-draw-mixed-practice',{topicId:'bank-draw-mixed-practice',role:'mixed-practice',title:'Mixed practice',workingSpace:'none'},proposal,'mixed');
   const examTopic=exam>=0?next.topics.findIndex(t=>t.id===next.sections[exam].topicId):-1,topic={id:'bank-draw-mixed-practice',title:'Mixed practice'};
   if(examTopic>=0)next.topics.splice(examTopic,0,topic);else next.topics.push(topic);
  }else if(s.kind==='challenge'){
   if(next.sections.some(x=>x.role==='challenge'||x.topicId==='challenge'))throw Error('The booklet already has a Challenge section');
   const front=next.sections.findIndex((x,i)=>i>0&&isFront(x)&&next.sections.slice(i).every(isFront));
   index=front>=0?front:next.sections.length;
   section=newSection('bank-draw-challenge',{topicId:'challenge',role:'challenge',title:'Challenge exercise'},proposal,'challenge');
   if(!next.topics.some(t=>t.id==='challenge')){const fm=next.topics.findIndex(t=>t.id==='front-matter'),topic={id:'challenge',title:'Challenge exercise'};if(fm>=0&&fm===next.topics.length-1)next.topics.splice(fm,0,topic);else next.topics.push(topic);}
  }else throw Error('Unknown section kind '+s.kind);
  if(at(section.id)>=0)throw Error('Section '+section.id+' already exists');
  const removed=removedFrom(project,section.id);if(removed.length)section.bankDraw.removed=structuredClone(removed);
  next.sections.splice(index,0,section);
  for(const id of s.bankIds)next=addProjectBlock(next,section.id,snapshotBankQuestion(recordOf(id),{placementId:'bd-'+id}));
  inserted.push(section.id);
 }
 return {project:next,inserted};
}

async function save(project,command,{approvedBy,root=ROOT}){
 if(!approvedBy?.trim())throw Error('--approved-by "QUOTE" is required: James\'s own words approving this proposal');
 await preflight(project);
 const file=proposalFile(project.id,command,root);if(!fs.existsSync(file))throw Error('No proposal; run '+command+' first');
 const proposal=read(file);if(proposal.savedAt)throw Error('This proposal was already saved at '+proposal.savedAt+'; propose again for a new draw');
 // A mixed proposal made while the exercise proposal was pending already excluded its picks, so it may be
 // saved on the revision that exercise save produced, and on no other.
 let acceptRevision=null;
 if(command==='mixed'){const ex=proposalFile(project.id,'exercises',root);if(fs.existsSync(ex)){const e=read(ex);if(e.savedAt&&e.revision===proposal.revision)acceptRevision=e.savedRevision;}}
 const {project:candidate,inserted}=buildCandidate(project,proposal,{recordOf:id=>bankRecord(id,root),acceptRevision});
 const dir=projectDir(project.id,root),candidateFile=path.join(dir,'candidate-'+command+'.json');write(candidateFile,candidate);
 const {publishProject}=await import('../scripts/booklet/publish-project.mjs');
 const result=await publishProject({candidateFile,expectedRevision:project.revision,apply:true,allowBank:false,root,record:path.join(dir,'publication-'+command+'-r'+project.revision+'.json'),ledger:path.join(root,RUN,'ledger.jsonl'),note:'bank draw '+command+': '+inserted.join(', ')});
 write(file,{...proposal,approvedBy,savedAt:result.savedAt,savedRevision:result.to});
 return {...result,inserted};
}

// ---- command line -----------------------------------------------------------------------------------------
export function budgetFromArgs(args){
 const b=DEFAULT_BUDGET,int=(v,f)=>{if(v===undefined)return f;if(!/^\d+$/.test(String(v)))throw Error('Expected a whole number, got '+v);return +v;};
 return {exercises:parseRange(args['exercise-items'],b.exercises),mixed:parseRange(args['mixed-items'],b.mixed),challenge:{...b.challenge,perSkill:int(args['challenge-per-skill'],b.challenge.perSkill),max:int(args['challenge-max'],b.challenge.max)}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [command,...rest]=process.argv.slice(2),args={};
 for(let i=0;i<rest.length;i++){const k=rest[i].replace(/^--/,'');args[k]=rest[i+1]&&!rest[i+1].startsWith('--')?rest[++i]:true;}
 const usage='Usage: node pedagogy/bank-draw.mjs map|confirm-map|exercises|mixed|save --project ID [--sources all|prefix,prefix] [--exercise-items 6-12] [--mixed-items 2-4] [--challenge-per-skill 1] [--challenge-max 12] [--command exercises|mixed] [--approved-by "QUOTE"]';
 if(!args.project||!['map','confirm-map','exercises','mixed','save'].includes(command)){console.error(usage);process.exit(2);}
 if(args.series){console.error('--series was replaced by --sources (textbook id prefixes, or all)');process.exit(2);}
 const project=read(path.join(ROOT,'booklets','projects',args.project+'.json'));
 try{
  if(command==='map'){const map=await runMap(project,{sources:parseSources(args.sources)});console.log('Proposed map: '+path.relative(ROOT,mapFile(project.id)).replace(/json$/,'md'));for(const [t,s] of Object.entries(map.topics))console.log(t+': '+s.join(', '));}
  else if(command==='confirm-map'){if(!args['approved-by'])throw Error('--approved-by "QUOTE" is required');const map=readMap(project.id,{confirmed:false});write(mapFile(project.id),{...map,confirmed:{by:args['approved-by'],at:new Date().toISOString()}});console.log('Map confirmed.');}
  else if(command==='save'){const r=await save(project,args.command,{approvedBy:args['approved-by']});console.log(`Saved ${r.projectId} r${r.from}→r${r.to}: ${r.inserted.join(', ')}`);}
  else{const p=await propose(project,command,{sources:parseSources(args.sources),budget:budgetFromArgs(args)});console.log(`${p.sections.length} sections, ${p.sections.reduce((n,s)=>n+s.bankIds.length,0)} questions; ${p.gaps?.length??0} gaps; ${p.belowFloor?.length??0} skills below the floor. Report: `+path.relative(ROOT,path.join(projectDir(project.id),'proposal-'+command+'.md')));}
 }catch(error){console.error(error.message);process.exit(1);}
}
