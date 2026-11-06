// Pedagogy audit v2 (docs/booklet-pedagogy-audit-v2.md): one command per booklet master.
//   node pedagogy/review.mjs audit-v2 --project ID [--topics a,b] [--dry-run]
//   node pedagogy/review.mjs audit-v2 --project ID --apply [--run DIR]
// The run writes a candidate and a report under .booklet-work/pedagogy-audit-v2/ID/STAMP/;
// --apply makes the one revision-checked save. Every model call is exactly
// claude-sonnet-5-5 at medium effort through `claude -p`, with no fallback.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {toSource} from '../public/libs/maths-editor/document-model.mjs';
import {questionReviewContent} from '../src/lib/booklet-review-profile.js';
import {verifiedRating,reasoningTaskHash,REASONING_RUBRIC} from '../scripts/booklet/reasoning-ratings.mjs';
import {withWorkerSlot} from '../scripts/booklet/worker-pool.mjs';
import {planScoreOrder,scoreOrderCandidate,reviewedMethodSupport} from '../polish/score-order.mjs';
import {resolveExerciseReferences} from '../polish/exercise-references.mjs';
import {teacherBlocks,nodesOf} from '../polish/guards.mjs';
import {sequences,canonicalRunDir} from './review.mjs';
import {MODEL,EFFORT,LIMITS,contentFingerprint,wordingFingerprint,bookletIndex,scoreOf,practiceItems,duplicatePairs,spellBlock,boldTerm,deriveComparisonScore,bandFor,jumpSlots,slotWindow,diagramBlindHash,diagramEquivalent} from './audit-v2-plan.mjs';
import {auditContract,challengeContract,draftContract,proposalContract,solveContract,ratingContract,equivalenceContract,validateAudit,validateVerdicts,validateDrafts,validateSolve,validatePlacements,validateEquivalence} from './audit-v2-prompts.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==='string'?value:JSON.stringify(value,null,1)+'\n');};
const sha=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const now=()=>new Date().toISOString();
const rel=file=>path.relative(ROOT,file).replaceAll('\\','/');
export const COMMENT_KIND='pedagogy-audit-v2';
const V1_KINDS=new Set(['pedagogy-review','pedagogy-suggestion']);
// Standing comparison anchors (5 November spot check): read live, on Sol's scale.
export const ANCHORS=[['computation-with-integers-v1','p30-q2'],['angle-relationships-v1','p72-q3'],['algebraic-fractions-v1','p11-q9'],['area-parallelograms-triangles-v1','p19-q16'],['area-parallelograms-triangles-v1','p18-q14'],['concept-maths-adv11-ch03','p63-q26'],['concept-maths-adv11-ch02','p70-q26'],['concept-maths-x11-ch01','p70-q77'],['enrichment-maths-1-part3-20261008','p12-q7'],['enrichment-maths-1-part14','p12-q23'],['enrichment-maths-1-part11-20261008','p18-q25'],['concept-maths-x11-ch05','p14-q69'],['enrichment-maths-1-part9-20261008','p7-q9'],['enrichment-maths-2-part4-20261009','p33-q18'],['enrichment-maths-1-part3-20261008','p18-q22'],['enrichment-maths-2-part10-20261009','p37-q18']];
// 31 October named progression exceptions: fixed while their task hashes match.
const PROGRESSIONS=[['s6adv-introduction-to-differentiation-2-calculations-with-the-derivative-v1',['p30-q4','p31-q5']],['s6adv-introduction-to-differentiation-2-calculations-with-the-derivative-v1',['p46-practice','p47-q1-block','p47-q2-block']],['coordinate-geometry-formulas-v1',['p7-q8','p7-q9-block','p7-q10-block']]];

// ---- model calls -----------------------------------------------------------------
const claudeExe=()=>process.env.MATHSMAP_CLAUDE_BIN??path.join(os.homedir(),'.local','bin','claude.exe');
function spawnClaude({args,prompt,cwd,timeoutMs}){
 return new Promise(resolve=>{
  const child=spawn(claudeExe(),args,{cwd,windowsHide:true});let out='',err='';
  const timer=setTimeout(()=>{child.kill();err+='\n[timeout]';},timeoutMs);
  child.stdout.on('data',d=>out+=d);child.stderr.on('data',d=>err+=d);
  child.on('error',error=>{clearTimeout(timer);resolve({code:-1,out,err:err+error.message});});
  child.on('close',code=>{clearTimeout(timer);resolve({code,out,err});});
  child.stdin.on('error',()=>{});child.stdin.end(prompt);
 });
}
const parseJson=text=>{const s=String(text??'');const a=s.indexOf('{'),b=s.lastIndexOf('}');if(a<0||b<a)throw Error('no JSON object in reply');return JSON.parse(s.slice(a,b+1));};
// One call: refuse over the cap, never truncate; exact model or failure; validate,
// retry once if malformed. Every attempt is logged with time, tokens and cost.
export async function callSonnet(ctx,{stage,system,prompt,validate=x=>x,timeoutMs=900000}){
 const size=system.length+prompt.length;
 if(size>LIMITS.promptCharacters)throw Object.assign(Error(`${stage} prompt is ${size} characters, over ${LIMITS.promptCharacters}; it is not sent or truncated`),{blocker:true});
 if(ctx.dryRun)throw Error('dry run makes no model calls');
 const cwd=path.join(os.tmpdir(),'mathsmap-audit-v2');fs.mkdirSync(cwd,{recursive:true});
 const systemFile=path.join(cwd,'system-'+sha(system).slice(0,16)+'.txt');if(!fs.existsSync(systemFile))fs.writeFileSync(systemFile,system);
 const args=['-p','--model',MODEL,'--effort',EFFORT,'--tools','','--no-session-persistence','--output-format','json','--max-turns','1','--safe-mode','--strict-mcp-config','--settings','{"fallbackModel":[]}','--system-prompt-file',systemFile];
 let lastError;
 for(let attempt=1;attempt<=2;attempt++){
  const id=`${String(ctx.seq=(ctx.seq??0)+1).padStart(2,'0')}-${stage}-${attempt}`,file=path.join(ctx.workDir,'calls',id+'.json');
  const started=Date.now();
  const run=()=>spawnClaude({args,prompt,cwd,timeoutMs});
  const r=ctx.runDir?await withWorkerSlot(ctx.runDir,{stage:'pedagogy-audit-v2-'+stage,model:MODEL,provider:'claude-code'},run):await run();
  const row={id,stage,attempt,model:MODEL,effort:EFFORT,promptCharacters:size,startedAt:new Date(started).toISOString(),elapsedMs:Date.now()-started,exitCode:r.code};
  write(path.join(ctx.workDir,'calls',id+'.prompt.txt'),prompt);
  let envelope=null;try{envelope=JSON.parse(r.out);}catch{}
  if(envelope){row.usage=envelope.usage??null;row.costUsd=envelope.total_cost_usd??null;row.models=Object.keys(envelope.modelUsage??{});row.thinkingTokens=envelope.usage?.output_tokens_details?.thinking_tokens??null;}
  write(file,{...row,stdout:r.out,stderr:r.err.slice(0,20000)});
  ctx.calls.push(row);
  try{
   if(r.code!==0||!envelope)throw Error('claude exited '+r.code+': '+r.err.slice(0,300));
   if(envelope.is_error!==false||row.models.length!==1||row.models[0]!==MODEL)throw Error('exact '+MODEL+' result required; got '+row.models.join(','));
   const value=validate(parseJson(envelope.result));
   row.ok=true;write(file,{...row,stdout:r.out,stderr:r.err.slice(0,20000)});ctx.log(`  ${stage}: ${Math.round(row.elapsedMs/1000)} s, ${row.usage?.output_tokens??'?'} output tokens, $${(row.costUsd??0).toFixed(3)}`);
   return {value,file:rel(file)};
  }catch(error){row.ok=false;row.error=error.message;lastError=error;write(file,{...row,stdout:r.out,stderr:r.err.slice(0,20000)});ctx.log(`  ${stage}: attempt ${attempt} failed: ${error.message.slice(0,200)}`);}
 }
 throw Object.assign(lastError,{blocker:true});
}

// ---- views ----------------------------------------------------------------------
const META=new Set(['sourceReview','sourceRefs','sourcePageNumber','sourceOrder','sourceAtom','sourceLayoutEvidence','classification','snapshotKind','bankRef','flow','presentation','provenance','answerSpaceMm','layout','columns','align','marks','origin','source','reviewStatus','widthMm','arrangement','preserveParagraphAlignment']);
const isDoc=value=>value&&typeof value==='object'&&value.format&&Array.isArray(value.blocks);
// Embedded image data says nothing to a text-only call: it becomes a placeholder (6 November 2026;
// one Bivariate Data exam question was 444,000 characters, mostly base64).
const DATA_URI=/data:[\w.+-]+\/[\w.+-]+;base64,[A-Za-z0-9+/=\s]+/g;
const dropImageData=s=>s.length>1000&&s.includes(';base64,')?s.replace(DATA_URI,m=>`[embedded image, ${Math.round(m.length*3/4/1024)} KB]`):s;
function clean(value,{answers}){
 if(typeof value==='string')return dropImageData(value);
 if(Array.isArray(value))return value.map(child=>clean(child,{answers})).filter(child=>child!==undefined);
 if(!value||typeof value!=='object')return value;
 if(isDoc(value)){try{return dropImageData(toSource(value));}catch{}}
 const out={};
 for(const [key,child]of Object.entries(value)){
  if(META.has(key))continue;
  if(!answers&&['answer','theorySolution','solutionDiagrams','solution','worked'].includes(key))continue;
  const v=clean(child,{answers});if(v===undefined||v===null||v===''||(Array.isArray(v)&&!v.length))continue;out[key]=v;
 }
 return out;
}
export const studentView=(block,{answers=true}={})=>clean(block.type==='question'?{...questionReviewContent(block),id:block.id}:block,{answers});
const typeOf=(state,id)=>state.types.get(id)?.type??null;

// ---- records ----------------------------------------------------------------------
export const recordFile=(id,{root=ROOT}={})=>path.join(root,'booklets','provenance','pedagogy-review','audit-v2',id+'.json');
export const proposalsFile=(id,{root=ROOT}={})=>path.join(root,'booklets','provenance','pedagogy-review','audit-v2',id+'.proposals.json');
const loadRecord=(id,root)=>{const file=recordFile(id,{root});return fs.existsSync(file)?read(file):{version:1,projectId:id,checks:{},types:{},exampleMatches:{},keep:[],runs:[]};};
// A stored archetype map is reused for a block whose reviewed snapshot content is unchanged.
function storedTypes(project,rows,root){
 const out=new Map(),snapshots=new Map();
 for(const {block}of rows){
  const review=block.classification?.archetypeReview,type=block.classification?.archetype;if(!review?.mapFile||!type)continue;
  let snap=snapshots.get(review.mapFile);
  if(snap===undefined){snap=null;try{const file=path.resolve(root,review.mapFile),map=read(file),dir=path.dirname(file);const want=String(map.snapshotSha256??review.snapshotSha256??'').toLowerCase();
   const candidates=[map.snapshot,map.metadataRatingProjection?.projectedSnapshot,...fs.readdirSync(dir).filter(n=>n.endsWith('.json')).map(n=>path.join(dir,n))].filter(Boolean);
   for(const c of candidates){const f=path.resolve(root,c);if(!fs.existsSync(f))continue;const bytes=fs.readFileSync(f);if(want&&createHash('sha256').update(bytes).digest('hex')!==want)continue;const s=JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/,''));if(s.id===project.id&&Array.isArray(s.sections)){snap=new Map(s.sections.flatMap(x=>(x.blocks??[]).map(b=>[b.id,b])));break;}}}catch{}snapshots.set(review.mapFile,snap);}
  const old=snap?.get(block.id);
  out.set(block.id,{type,current:!!old&&contentFingerprint(old)===contentFingerprint(block),source:review.mapFile,snapshot:!!snap});
 }
 return out;
}
// Blocks whose answers were accepted at import with unchanged content: no error check needed.
function importAccepted(project,root){
 const runId=project.source?.runId??project.runId,file=runId&&path.join(root,'.booklet-work','full-imports',String(runId).replace(/[^\w.-]/g,'_'),'lean-review','reviewed.json');
 const out=new Set();if(!file||!fs.existsSync(file))return out;
 try{const rows=read(file).questions??{};for(const [id,row]of Object.entries(rows))if(row?.outcome==='passed'&&row.acceptedVersion?.snapshot)out.add(id+'|'+contentFingerprint(row.acceptedVersion.snapshot));}catch{}
 return out;
}
function progressionFixed(project,root){
 const doc=fs.readFileSync(path.join(root,'docs','booklet-progression-exceptions-20261031.md'),'utf8'),hashes=new Map([...doc.matchAll(/\|\s*`([^`]+)`\s*\|\s*`([a-f0-9]{64})`\s*\|/g)].map(m=>[m[1],m[2]]));
 const blocks=new Map((project.sections??[]).flatMap(s=>(s.blocks??[]).map(b=>[b.id,b])));
 return PROGRESSIONS.filter(([id,ids])=>id===project.id&&ids.every(x=>blocks.has(x)&&(!hashes.has(x)||reasoningTaskHash(blocks.get(x))===hashes.get(x)))).map(([,ids])=>ids);
}
export function inFlight(project){
 const runId=project.source?.runId??project.runId??'';
 const r=spawnSync('powershell.exe',['-NoProfile','-Command',`Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.ProcessId -ne ${process.pid} -and $_.CommandLine -match '[\\\\/](lean-import|lean-review|check-feedback-pages|publish-project|export[\\w-]*)\\.mjs|polish[\\\\/]run\\.mjs' } | ForEach-Object { $_.CommandLine }`],{encoding:'utf8',windowsHide:true});
 return String(r.stdout??'').split(/\r?\n/).filter(line=>line.includes(project.id)||runId&&line.includes(runId));
}
function isMaster(id,root){
 const file=path.join(root,'.booklet-work','end-goal-20261028','coverage-status.json');
 if(!fs.existsSync(file))return null;
 return (read(file).rows??[]).some(row=>row.id===id);
}

// ---- Stage 0: diagram-only changes keep their rating (James, 6 November 2026) ----------
// A rating whose task hash no longer matches is carried over when the question it was given to
// differs from the current one only in drawing code. The rated version is found by its stored
// diagram-blind hash, or else by its task hash in this audit's run folders, the revision snapshots
// and the last commit.
function ratedVersions(projectId,root){
 const files=[],runs=path.join(root,'.booklet-work','pedagogy-audit-v2',projectId),rev=path.join(root,'booklets','projects','.revisions',projectId);
 if(fs.existsSync(runs))for(const d of fs.readdirSync(runs).sort().reverse()){const f=path.join(runs,d,'candidate.json');if(fs.existsSync(f))files.push({source:rel(f),load:()=>read(f)});}
 if(fs.existsSync(rev))for(const n of fs.readdirSync(rev).filter(n=>/^\d+\.json$/.test(n)).sort((a,b)=>parseInt(b)-parseInt(a)).slice(0,40))files.push({source:rel(path.join(rev,n)),load:()=>read(path.join(rev,n))});
 files.push({source:'git HEAD',load:()=>{const r=spawnSync('git',['show','HEAD:booklets/projects/'+projectId+'.json'],{cwd:root,encoding:'utf8',maxBuffer:256*1024*1024,windowsHide:true});if(r.status)throw Error('not in HEAD');return JSON.parse(r.stdout.replace(/^﻿/,''));}});
 return files;
}
export function diagramRebinds(project,{root=ROOT}={}){
 const pending=bookletIndex(project).filter(r=>r.question&&!verifiedRating(r.block)&&r.block.classification?.assessment?.taskHash).map(r=>r.block);
 if(!pending.length)return [];
 const versions=ratedVersions(project.id,root),loaded=[],out=[];
 const versionBlock=(i,id)=>{if(!(i in loaded)){try{loaded[i]=new Map((versions[i].load().sections??[]).flatMap(s=>(s.blocks??[]).map(b=>[b.id,b])));}catch{loaded[i]=new Map();}}return loaded[i].get(id);};
 for(const block of pending){
  const a=block.classification.assessment,blind=diagramBlindHash(block);let source=null;
  if(a.diagramBlindHash===blind)source='stored diagram-blind hash';
  else for(let i=0;i<versions.length&&!source;i++){const old=versionBlock(i,block.id);if(old&&reasoningTaskHash(old)===a.taskHash&&diagramBlindHash(old)===blind)source=versions[i].source;}
  if(!source)continue;
  const copy=structuredClone(block),b=copy.classification.assessment;
  b.originalTaskHash??=b.taskHash;b.diagramReuse={kind:'diagram-only-v1',previousTaskHash:b.taskHash,diagramBlindHash:blind,source};b.taskHash=reasoningTaskHash(copy);b.diagramBlindHash=blind;
  if(verifiedRating(copy))out.push({id:block.id,classification:copy.classification,source});
 }
 return out;
}
const withRebinds=(project,rebinds)=>{if(!rebinds.length)return project;const by=new Map(rebinds.map(r=>[r.id,r]));const p=structuredClone(project);for(const s of p.sections??[])for(const b of s.blocks??[])if(by.has(b.id))b.classification=by.get(b.id).classification;return p;};

// ---- Stage 0: preflight ------------------------------------------------------------
export function preflight(project,{root=ROOT,topics=[],allowNonMaster=false}={}){
 const master=isMaster(project.id,root);
 if(master===false&&!allowNonMaster)throw Error(project.id+' is not a booklet master (not in the programme ledger). The audit is for booklet masters.');
 const busy=inFlight(project);if(busy.length)throw Error('An import, review, export or repair is running for this booklet: '+busy[0].slice(0,200));
 const rows=bookletIndex(project),record=loadRecord(project.id,root),stored=storedTypes(project,rows,root),accepted=importAccepted(project,root),protectedIds=teacherBlocks(project);
 const fp=new Map(rows.map(r=>[r.block.id,contentFingerprint(r.block)]));
 const checked=(id,kind)=>record.checks?.[id]?.[kind]===fp.get(id);
 const stale={rating:[],type:[],error:[],duplicate:[],theory:[]},types=new Map();
 const all=sequences(project),selected=new Set(topics.length?all.filter(s=>topics.includes(s.id)||topics.includes(s.topicId)).flatMap(s=>s.sections.map(x=>x.id)):[]);
 const inScope=r=>!selected.size||selected.has(r.section.id)||r.exam;
 for(const r of rows){
  const id=r.block.id;if(!inScope(r))continue;
  if(r.question){
   if(!verifiedRating(r.block))stale.rating.push(id);
   if(checked(id,'type')&&record.types?.[id])types.set(id,{type:record.types[id],current:true,source:'audit-v2'});
   else if(stored.get(id)?.current)types.set(id,{type:stored.get(id).type,current:true,source:'stored-map'});
   else stale.type.push(id);
   if(!checked(id,'duplicate'))stale.duplicate.push(id);
  }
  if((r.question||r.example)&&!checked(id,'error')&&!accepted.has(id+'|'+fp.get(id)))stale.error.push(id);
  if(r.kind==='teaching'&&!checked(id,'theory'))stale.theory.push(id);
 }
 const questions=rows.filter(r=>r.question).map(r=>r.block);
 const pairs=duplicatePairs(questions,{stale:new Set(stale.duplicate)});
 // Spelling is presentation-only: applied in the candidate, except on teacher-protected blocks.
 const spelling=[];
 for(const r of rows){if(r.kind==='front-matter')continue;const {block,changes}=spellBlock(r.block);if(changes.length)spelling.push({id:r.block.id,changes,protected:protectedIds.has(r.block.id),block});}
 const flags=project.studio?.flags??[];
 const v1=flags.filter(f=>V1_KINDS.has(f.kind)&&!f.resolved);
 const open=flags.filter(f=>!f.resolved);
 return {project,rows,record,fp,stale,types,storedTypes:stored,pairs,spelling,protectedIds,openComments:open.length,v1Comments:v1,progressions:progressionFixed(project,root),master};
}

// ---- Stage 2 and 4: moves and order ---------------------------------------------------
const linkIds=node=>[...(Array.isArray(node.dependsOn)?node.dependsOn:node.dependsOn?[node.dependsOn]:[]),...(node.flow?.dependsOn??[]),node.continuationOf,node.flow?.continuationOf,node.pairedBlockId].filter(x=>typeof x==='string');
function unitsOf(blocks){
 const owner=new Map(blocks.flatMap(b=>nodesOf(b).map(n=>[n.id,b.id]))),parent=new Map(blocks.map(b=>[b.id,b.id]));
 const root=id=>{while(parent.get(id)!==id)id=parent.get(id);return id;};
 for(const b of blocks)for(const n of nodesOf(b))for(const ref of linkIds(n)){const o=owner.get(ref);if(o&&o!==b.id)parent.set(root(b.id),root(o));}
 blocks.forEach((b,i)=>{if(b.flow?.keepWithNext&&blocks[i+1])parent.set(root(blocks[i+1].id),root(b.id));});
 const units=new Map();for(const b of blocks){const k=root(b.id);if(!units.has(k))units.set(k,[]);units.get(k).push(b);}
 return [...units.values()];
}
export function challengeMoves(project){
 const moves=[];
 for(const section of project.sections??[]){
  const rows=bookletIndex({...project,sections:[section]});if(rows[0]?.kind!=='exercise')continue;
  const routine=new Set(rows.filter(r=>r.routine).map(r=>r.block.id));
  for(const unit of unitsOf(section.blocks??[])){
   if(!unit.every(b=>routine.has(b.id)))continue;
   if(!unit.some(b=>verifiedRating(b)&&scoreOf(b)>LIMITS.routineCeiling))continue;
   moves.push({sectionId:section.id,topicId:section.topicId,ids:unit.map(b=>b.id),score:Math.max(...unit.map(b=>scoreOf(b)??0))});
  }
 }
 return moves;
}
function applyMoves(candidate,moves){
 if(!moves.length)return candidate;
 let challenge=candidate.sections.find(s=>s.phase==='practice'&&s.role==='challenge');
 if(!challenge){challenge={id:candidate.id+'-challenge',topicId:'challenge',title:'Challenge exercise',phase:'practice',role:'challenge',workingSpace:'none',blocks:[]};candidate.sections.push(challenge);candidate.topics??=[];if(!candidate.topics.some(t=>t.id==='challenge'))candidate.topics.push({id:'challenge',title:'Challenge exercise'});}
 const moved=[];
 for(const move of [...moves].sort((a,b)=>a.score-b.score)){const s=candidate.sections.find(x=>x.id===move.sectionId);for(const id of move.ids){const i=s.blocks.findIndex(b=>b.id===id);if(i>=0)moved.push(s.blocks.splice(i,1)[0]);}}
 challenge.blocks.push(...moved);
 return candidate;
}
// Whole-question score order through the shared planner; held segments stay as they are.
export function orderCandidate(candidate,{keep=[],deliberate=[],progressions=[],original=null}={}){
 // Support from a teaching block is coverage only: teaching always precedes its exercise and sorting never moves it.
 const teachingIds=new Set((candidate.sections??[]).filter(s=>s.phase==='teaching').flatMap(s=>(s.blocks??[]).map(b=>b.id)));
 // Bolding is presentation-only: reviewed method evidence is checked against the teaching before it.
 const before=new Map((original?.sections??[]).flatMap(s=>(s.blocks??[]).map(b=>[b.id,b])));
 const evidence=original?{...candidate,sections:candidate.sections.map(s=>s.phase!=='teaching'?s:{...s,blocks:(s.blocks??[]).map(b=>before.has(b.id)&&contentFingerprint(before.get(b.id))===contentFingerprint(b)?before.get(b.id):b)})}:candidate;
 // Support from an earlier practice question is a prerequisite (6 November 2026): the sort keeps
 // it first, and only a real conflict holds, instead of every such pair holding the whole exercise.
 // A question changed only in its diagram still matches its reviewed version (James, 6 November 2026).
 const support=reviewedMethodSupport(evidence,{equivalentContent:diagramEquivalent,practiceSupportDecision:c=>teachingIds.has(c.before)?{relation:'coverage-only',reason:'The supporting block is teaching, which precedes the exercise; whole-question sorting cannot move it.'}:{relation:'prerequisite',reason:'Pedagogy audit v2: a reviewed practice item that supports this question stays before it.'}}),referenceResolution=resolveExerciseReferences(candidate);
 const known=new Set((candidate.sections??[]).flatMap(s=>(s.blocks??[]).map(b=>b.id))),sectionOf=new Map((candidate.sections??[]).flatMap(s=>(s.blocks??[]).map(b=>[b.id,s.id])));
 const sameSection=ids=>ids.every(id=>known.has(id))&&new Set(ids.map(id=>sectionOf.get(id))).size===1;
 const semanticUnits=[...progressions.map(ids=>({ids,reason:'31 October named progression exception',evidence:'docs/booklet-progression-exceptions-20261031.md'})),...keep.filter(k=>sameSection(k.ids)).map(k=>({ids:k.ids,reason:'audit v2 keep: '+k.kind,evidence:k.reason||'audit v2'}))];
 const supportEdges=[...support.edges,...deliberate.filter(sameSection).map(([a,b])=>({before:a,after:b,kind:'deliberate-duplicate-pair'}))];
 const plan=planScoreOrder(candidate,{supportEdges,contextHolds:support.holds,semanticUnits,referenceResolution});
 // An unsettled printed reference holds every exercise in the booklet, and the reference
 // renumbering refuses to run; the order is left as it is and the holds become comments
 // (6 November 2026: 49 of 130 masters stopped here in the rollout dry run).
 if(referenceResolution.holds.length)return {project:candidate,plan};
 return {project:scoreOrderCandidate(candidate,plan),plan};
}
// Ordering holds become one Studio comment per held segment.
function holdComments(plan,project){
 const out=[];
 for(const s of plan.sections)for(const seg of s.segments)if(seg.status==='held'&&seg.holds.length&&seg.originalIds.length>1){
  const kinds=[...new Set(seg.holds.map(h=>h.kind))];
  const release={'rating-unverified':'a current verified rating for each named question','layout-pin-needs-pagination-evidence':'removing the keep-with-next pin or recording page evidence for it','layout-row-needs-pagination-evidence':'page evidence for the side-by-side row','printed-reference':'resolving the printed cross-question reference','unresolved-dependency':'fixing the dependency link','dependency-outside-sort-segment':'moving the dependency into this exercise','method-support-order':'a decision on whether the earlier method question must stay first','method-support-context-uncertain':'a decision on whether the earlier method question must stay first','review-context-unverified':'re-mapping the question type of the changed question','noncontiguous-semantic-unit':'placing the kept sequence together'};
  out.push({targetId:seg.originalIds[0],kind:'ordering-hold',key:'hold|'+s.sectionId+'|'+seg.originalIds[0],note:`[Pedagogy audit v2 · Ordering hold] These questions were left in their current order instead of being sorted by difficulty: ${seg.originalIds.join(', ')}. Hold: ${kinds.join(', ')}. What would release it: ${kinds.map(k=>release[k]??k).join('; ')}.`});
 }
 return out;
}

// ---- Stage 4: gap plan -------------------------------------------------------------
export function gapPlan(candidate,state,{audit=null,original=state.project}={}){
 const rows=bookletIndex(candidate),slots=[],counts=[];
 const origMax=new Map();for(const s of original.sections??[]){const r=bookletIndex({...original,sections:[s]}).filter(x=>x.routine).map(x=>scoreOf(x.block)).filter(x=>Number.isFinite(x)&&x<=LIMITS.routineCeiling);if(r.length)origMax.set(s.id,Math.max(...r));}
 const fixedPairs=new Set(state.progressions.flatMap(ids=>ids.slice(1).map((id,i)=>ids[i]+'>'+id)));
 const typeInfo=new Map((audit?.types??[]).map(t=>[t.type,t]));
 const applied=b=>verifiedRating(b)&&!state.pendingHigh?.has(b.id);
 const challengeOnly=type=>{const all=rows.filter(r=>r.question&&!r.exam&&typeOf(state,r.block.id)===type);return all.length>0&&all.every(r=>r.kind==='challenge'||(Number.isFinite(scoreOf(r.block))&&scoreOf(r.block)>LIMITS.routineCeiling));};
 for(const section of candidate.sections??[]){
  const sec=rows.filter(r=>r.section.id===section.id);if(sec[0]?.kind!=='exercise')continue;
  const routine=sec.filter(r=>r.routine).map(r=>r.block);if(!routine.length)continue;
  const ceiling=origMax.get(section.id)??LIMITS.routineCeiling;
  const units=routine.map(b=>({firstId:b.id,lastId:b.id,score:applied(b)?scoreOf(b):null}));
  const scored=units.filter(u=>Number.isFinite(u.score)).map(u=>({id:u.firstId,score:u.score})),windowFor=target=>slotWindow(target,scored,{ceiling});
  const jumps=jumpSlots(units,{ceiling}).filter(s=>!fixedPairs.has(s.after+'>'+s.before));
  const own=[...jumps.map(s=>({...s,sectionId:section.id}))];
  // Items per type (Exam questions do not count).
  const byType=new Map();for(const b of routine){for(const item of practiceItems(b)){const t=item.archetype??typeOf(state,b.id);if(!t)continue;const row=byType.get(t)??{type:t,items:0,ids:[],scores:[]};row.items++;if(!row.ids.includes(b.id)){row.ids.push(b.id);if(applied(b))row.scores.push(scoreOf(b));}byType.set(t,row);}}
  for(const t of typeInfo.values())if(t.topicId===section.topicId&&t.taught!==false&&!byType.has(t.type))byType.set(t.type,{type:t.type,items:0,ids:[],scores:[]});
  for(const row of byType.values()){
   // A Challenge type (every question of it is in the Challenge exercise or rates above the
   // routine limit) is unfamiliar by design and has no minimum (James, 6 November 2026).
   if(challengeOnly(row.type))continue;
   counts.push({sectionId:section.id,type:row.type,items:row.items,taught:typeInfo.get(row.type)?.taught!==false});
   for(let need=LIMITS.minimumItems-row.items;need>0;need--){
    const lo=row.scores.length?Math.min(...row.scores):null,hi=row.scores.length?Math.max(...row.scores):null;
    const open=own.find(s=>s.reason==='difficulty-jump'&&!s.type&&(lo==null||(s.target>=lo-10&&s.target<=hi+10)));
    if(open){open.type=row.type;open.alsoCount=true;continue;}
    const scores=routine.filter(applied).map(scoreOf),median=x=>x.length?x.slice().sort((a,b)=>a-b)[Math.floor(x.length/2)]:20;
    const target=Math.min(ceiling,row.scores.length?median(row.scores):median(scores));
    own.push({reason:'type-count',sectionId:section.id,type:row.type,after:row.ids.at(-1)??routine.at(-1).id,target,...windowFor(target)});
   }
  }
  // A jump slot takes the type of the question it leads up to.
  for(const s of own)if(!s.type)s.type=typeOf(state,s.before)??typeOf(state,s.after);
  // Worked examples with no following practice of their type.
  for(const m of audit?.exampleMatches??[]){
   if((m.followedBy??[]).length)continue;
   const ex=rows.find(r=>r.block.id===m.exampleId);if(!ex||ex.section.topicId!==section.topicId)continue;
   if(slots.some(s=>s.exampleId===m.exampleId))continue;
   const type=[...typeInfo.values()].find(t=>(t.taughtBy??[]).includes(m.exampleId))?.type;if(!type)continue;
   const first=Math.min(...routine.filter(applied).map(scoreOf),40),target=Math.max(5,first);
   own.push({reason:'worked-example-practice',sectionId:section.id,type,exampleId:m.exampleId,after:null,target,...windowFor(target)});
  }
  for(const sp of audit?.spread??[]){
   const ids=(sp.ids??[]).filter(id=>routine.some(b=>b.id===id));if(!ids.length)continue;
   const sc=ids.map(id=>scoreOf(routine.find(b=>b.id===id))).filter(Number.isFinite),target=Math.min(ceiling,sc.length?Math.round(sc.reduce((a,b)=>a+b,0)/sc.length):20);
   own.push({reason:'spread',sectionId:section.id,type:sp.type,judgement:sp.judgement??null,after:ids.at(-1),target,...windowFor(target)});
  }
  // Comment-only follows the target (as before the 6 November windows), not the wider window.
  for(const s of own){s.untaught=typeInfo.get(s.type)?.taught===false;s.commentOnly=s.target+LIMITS.slack>=LIMITS.appliedBelow;}
  slots.push(...own);
 }
 slots.forEach((s,i)=>{s.id='slot-'+(i+1);});
 const gaps=[];
 for(const section of candidate.sections??[]){const routine=rows.filter(r=>r.section.id===section.id&&r.routine).map(r=>r.block).filter(applied);for(let i=1;i<routine.length;i++){const step=scoreOf(routine[i])-scoreOf(routine[i-1]);if(step>LIMITS.jump&&!fixedPairs.has(routine[i-1].id+'>'+routine[i].id))gaps.push({sectionId:section.id,after:routine[i-1].id,before:routine[i].id,step});}}
 return {slots,counts,deficits:counts.filter(c=>c.items<LIMITS.minimumItems),gaps};
}

// ---- Stage 3: audit packets ---------------------------------------------------------
function styleSheet(project,rows){
 const teaching=rows.filter(r=>r.kind==='teaching'&&!r.question);
 const pick=[teaching.find(r=>!r.example),teaching.find(r=>r.example),teaching.filter(r=>!r.example)[1]].filter(Boolean);
 return {title:project.title,notation:'Follow the notation, command words and answer style of the passages and questions shown.',passages:pick.map(r=>({id:r.block.id,view:studentView(r.block)}))};
}
function topicPayload(sequence,state,candidate){
 const rows=bookletIndex({...candidate,sections:sequence.sections.map(s=>candidate.sections.find(x=>x.id===s.id)??s)});
 const prePos=new Map(state.rows.filter(r=>r.routine).map(r=>[r.block.id,r.index+1]));
 return {topicId:sequence.topicId,title:sequence.title,
  teaching:rows.filter(r=>r.kind==='teaching').map(r=>({id:r.block.id,role:r.example?'worked-example':r.block.pedagogyRole??'teaching',view:studentView(r.block)})),
  exercises:[...new Set(rows.filter(r=>r.kind==='exercise').map(r=>r.section.id))].map(id=>{const s=candidate.sections.find(x=>x.id===id)??sequence.sections.find(x=>x.id===id);return {exerciseId:id,title:s.title??null,items:rows.filter(r=>r.section.id===id&&r.question).map(r=>({id:r.block.id,prePosition:prePos.get(r.block.id)??null,score:scoreOf(r.block),type:state.types.get(r.block.id)?.type??null,view:studentView(r.block)}))};})};
}
export function auditPackets(state,candidate,{root=ROOT}={}){
 const all=sequences(candidate).filter(s=>s.sections.some(x=>['teaching','exercise'].includes(bookletIndex({...candidate,sections:[x]})[0]?.kind??(x.phase==='teaching'?'teaching':''))));
 const staleAll=new Set([...state.stale.type,...state.stale.error,...state.stale.theory]),pairIds=new Set(state.pairs.flatMap(p=>p.ids));
 const exam=bookletIndex(candidate).filter(r=>r.exam||r.kind==='challenge').map(r=>({id:r.block.id,section:r.kind,score:scoreOf(r.block),type:state.types.get(r.block.id)?.type??null,view:studentView(r.block)}));
 const types=[...new Map([...state.types.entries()].map(([id,t])=>[t.type,{type:t.type,example:id}])).values()];
 const topics=all.map(seq=>({seq,payload:topicPayload(seq,state,candidate)})).filter(({seq})=>seq.sections.some(s=>(candidate.sections.find(x=>x.id===s.id)?.blocks??s.blocks??[]).some(b=>staleAll.has(b.id)||pairIds.has(b.id))));
 const owner=new Map(state.rows.flatMap(r=>nodesOf(r.block).map(n=>[String(n.id),r.block.id])));
 const system=auditContract({root}),base={styleSheet:styleSheet(candidate,bookletIndex(candidate)),types};
 const packets=[];let current=[];
 // Units are topics, parts of a split topic, or chunks of the Exam and Challenge questions.
 // `ownTeaching: false` marks a later part of a split topic: its teaching is context only, and the
 // first part answers for the teaching's stale checks.
 const build=list=>{const topicUnits=list.filter(t=>!t.examOnly),examItems=list.flatMap(t=>t.exam??[]);
  const teachingIds=topicUnits.flatMap(t=>t.payload.teaching.map(x=>x.id)),practiceIds=topicUnits.flatMap(t=>t.payload.exercises.flatMap(e=>e.items.map(i=>i.id))),examIds=examItems.map(e=>e.id);
  const own=[...new Set([...teachingIds,...practiceIds,...examIds])];
  const resp=new Set([...topicUnits.filter(t=>t.ownTeaching!==false).flatMap(t=>t.payload.teaching.map(x=>x.id)),...practiceIds,...examIds]);
  const stale={type:state.stale.type.filter(id=>resp.has(id)),error:state.stale.error.filter(id=>resp.has(id)),theory:state.stale.theory.filter(id=>resp.has(id))};
  const pairs=state.pairs.filter(p=>p.ids.some(id=>resp.has(id)));
  const payload={...base,topics:topicUnits.map(t=>t.payload),...(examItems.length?{examAndChallenge:examItems}:{}),...(list.some(t=>t.examOnly&&t.part)?{examPart:list.find(t=>t.examOnly&&t.part).part}:{}),stale,duplicateCandidates:pairs.map(p=>({ids:p.ids,nodes:p.nodes,scope:p.scope}))};
  const prompt='Booklet data (JSON):\n'+JSON.stringify(payload);
  return {topics:[...topicUnits.map(t=>t.seq.id),...(examItems.length?['exam-and-challenge']:[])],prompt,system,ctx:{owner,ids:new Set([...own,...state.rows.map(r=>r.block.id)]),needTypes:stale.type.filter(id=>state.rows.find(r=>r.block.id===id)?.question),staleError:new Set(stale.error),staleTheory:new Set(stale.theory),pairs}};};
 // A topic over the packing size is split by exercise, and an exercise over it by question
 // (6 November 2026); every part carries the topic's teaching and worked examples. The rollout dry
 // run found topics of 328,000 and single exercises of 663,000 characters.
 const fits=list=>build(list).prompt.length<=LIMITS.packCharacters;
 const units=[];
 for(const t of topics){
  if(fits([t])){units.push(t);continue;}
  const parts=[];let chunk=[];
  const unit=(exs,i)=>({seq:t.seq,ownTeaching:i===0,payload:{...t.payload,exercises:exs}});
  const withItem=(exs,e,item)=>{const lastEx=exs.at(-1);return lastEx&&lastEx.exerciseId===e.exerciseId?[...exs.slice(0,-1),{...lastEx,items:[...lastEx.items,item]}]:[...exs,{...e,items:[item]}];};
  for(const e of t.payload.exercises){
   const next=[...chunk,e];
   if(!chunk.length||fits([unit(next,parts.length)])){chunk=next;if(fits([unit(chunk,parts.length)]))continue;chunk=chunk.slice(0,-1);}
   else{parts.push(chunk);chunk=[];if(fits([unit([e],parts.length)])){chunk=[e];continue;}}
   // This exercise does not fit whole: add it question by question.
   for(const item of e.items){const n=withItem(chunk,e,item);if(chunk.length&&!fits([unit(n,parts.length)])){parts.push(chunk);chunk=withItem([],e,item);}else chunk=n;}
  }
  if(chunk.length)parts.push(chunk);
  parts.forEach((exs,i)=>{const u=unit(exs,i);u.payload.part=`Part ${i+1} of ${parts.length} of this topic: the rest of it is audited in separate calls. Report findings only on the practice items shown here; for exampleMatches, list only the practice items shown here.${i?' The teaching is included as context; its theory and type checks are answered with part 1.':''}`;units.push(u);});
 }
 // The Exam and Challenge questions: with the last topic when they fit, otherwise in their own chunks.
 if(units.length||exam.some(e=>staleAll.has(e.id))){
  const whole={examOnly:true,exam};
  if(fits([whole]))units.push(whole);
  else{const chunks=[];let c=[];for(const e of exam){if(c.length&&!fits([{examOnly:true,exam:[...c,e]}])){chunks.push(c);c=[];}c.push(e);}if(c.length)chunks.push(c);
   chunks.forEach((list,i)=>units.push({examOnly:true,exam:list,part:`Exam and Challenge questions, part ${i+1} of ${chunks.length}; the others are audited in separate calls.`}));}
 }
 for(const t of units){const next=[...current,t];if(current.length&&!fits(next)){packets.push(build(current));current=[t];}else current=next;}
 if(current.length)packets.push(build(current));
 return packets;
}

// ---- comparison ladders -------------------------------------------------------------
export function anchorRefs(root){
 const out=[];
 for(const [i,[pid,bid]]of ANCHORS.entries()){
  const file=path.join(root,'booklets','projects',pid+'.json');if(!fs.existsSync(file))continue;
  const p=read(file),b=(p.sections??[]).flatMap(s=>s.blocks??[]).find(x=>x.id===bid);
  if(b&&verifiedRating(b)&&b.classification.assessment.method!=='comparison-v1')out.push({ref:'A'+(i+1),score:scoreOf(b),task:studentView(b)});
 }
 return out;
}
// Same exercise first, then same topic, then the booklet's Challenge questions; never comparison-derived scores.
// `include` (a slot's two neighbours) goes first and is always kept, so the rater can place a
// new question between exactly the questions it was written to sit between.
export function ladderFor(candidate,{sectionId,topicId,exclude=new Set(),include=[]},size=10){
 const rows=bookletIndex(candidate).filter(r=>r.question&&verifiedRating(r.block)&&r.block.classification.assessment.method!=='comparison-v1'&&!exclude.has(r.block.id));
 const pick=[],add=r=>{if(pick.length<size&&!pick.includes(r))pick.push(r);};
 for(const id of include){const r=rows.find(x=>x.block.id===id);if(r&&!pick.includes(r)){pick.push(r);size++;}}
 const spread=list=>{const s=list.slice().sort((a,b)=>scoreOf(a.block)-scoreOf(b.block));if(s.length<=4)return s;return [0,1,2,3].map(k=>s[Math.round(k*(s.length-1)/3)]);};
 for(const r of spread(rows.filter(r=>r.section.id===sectionId)))add(r);
 for(const r of spread(rows.filter(r=>r.section.topicId===topicId&&r.section.id!==sectionId)))add(r);
 for(const r of rows.filter(r=>r.kind==='challenge'))add(r);
 for(const r of spread(rows.filter(r=>r.kind==='exercise')))add(r);
 return pick.map(r=>r.block.id);
}

// ---- answer comparison ---------------------------------------------------------------
const normAnswer=s=>String(s??'').replace(/\\left|\\right|\\displaystyle|\\,|\\;|\\!|\s|\$|\.$/g,'').replace(/\\dfrac|\\tfrac/g,'\\frac').replace(/^(?:y'|f'\(x\)|dy\/dx|\\frac\{dy\}\{dx\})=/,'').replace(/;$/,'');
function answerNodes(content){return nodesOf(content).filter(n=>n.answer&&(n.answer.short||n.answer.worked)&&!(n.children??[]).some(c=>c.answer));}
async function compareAnswers(ctx,pairs){
 const out=new Map(),pending=[];
 for(const p of pairs){if(normAnswer(p.a)&&normAnswer(p.a)===normAnswer(p.b))out.set(p.id,{equivalent:true,how:'script'});else pending.push(p);}
 if(pending.length){
  const {value}=await callSonnet(ctx,{stage:'equivalence',system:equivalenceContract(),prompt:JSON.stringify({pairs:pending.map(p=>({id:p.id,A:p.a,B:p.b}))}),validate:r=>validateEquivalence(r,pending.map(p=>p.id))});
  for(const p of pending)out.set(p.id,{equivalent:value.get(p.id)?.equivalent===true,how:'model',reason:value.get(p.id)?.reason});
 }
 return out;
}

// ---- apply payloads (6 November 2026) -------------------------------------------------
// What applying an approved proposal comment does, stored with the comment so that
// `audit-v2 apply-comments` needs no drafting call. New teaching (worked example and
// guided practice) stays a by-hand repair.
export function proposalPayload(j,block,{rows,ownerOf}){
 const row=j.row,owner=id=>ownerOf.get(String(id))??id,rowOf=id=>rows.find(r=>r.block.id===owner(id));
 if(j.kind==='missing')return null;
 if(j.kind==='prerequisites'){const r=rowOf((row.neededBy??[])[0]??j.cites.find(Boolean));return {op:'review',topicId:row.topicId??r?.section.topicId??null,block:{...block,pedagogyRole:'review'}};}
 if(j.kind==='bridges'||j.kind==='extensions'){const r=rowOf(row.after);return {op:'insert',sectionId:row.exerciseId??r?.section.id??null,after:r?.block.id??null,block};}
 if(j.kind==='duplicate')return {op:'replace-node',blockId:row.replace,nodeIds:row.replaceNodes??[],content:block.content,classification:block.classification};
 return null;
}

// ---- new blocks ----------------------------------------------------------------------
export function newBlock(draft,slot,{project,score,placement,refs,evidence,skill,type,kind='slot'}){
 // A later run reuses slot names, so an id already in the booklet gets a suffix (6 November 2026:
 // the second Similar Triangles run drafted a second "slot-1-lower" and the sort refused the clash).
 const base=('v2-'+(slot.sectionId??'proposal').slice(-18)+'-'+slot.id).replace(/[^\w-]/g,'-'),taken=new Set((project?.sections??[]).flatMap(s=>(s.blocks??[]).map(b=>b.id)));
 let id=base;for(let k=2;taken.has(id);k++)id=base+'-'+k;
 const content=structuredClone(draft.content);content.id=id+'-root';content.type='question';content.label=null;
 let n=0;const renamed=new Map();for(const node of nodesOf(content))if(node!==content){const old=node.id;if(!node.id||node.id===content.id)node.id=id+'-n'+(++n);else node.id=id+'-'+String(node.id).replace(/[^\w-]/g,'');if(old)renamed.set(String(old),node.id);}
 // Dependencies follow their renamed parts.
 for(const node of nodesOf(content))if(Array.isArray(node.dependsOn))node.dependsOn=node.dependsOn.map(d=>renamed.get(String(d))??d);
 const block={id,type:'question',pedagogyRole:'practice',snapshotKind:'local',bankRef:null,title:'',content,
  classification:{primarySkillId:skill??draft.skill??null,secondarySkillIds:[],archetype:type},
  sourceReview:{origin:{projectId:project.id,blockId:id,generatedBy:'pedagogy-audit-v2'},generation:{model:MODEL,effort:EFFORT,kind,slot:{id:slot.id,reason:slot.reason,target:slot.target,range:slot.range},evidence},workingSpaceEstimate:{method:'solution-steps',estimates:(draft.workingSpace??[]).map(w=>({...w,targetId:content.id===w.targetId?content.id:nodesOf(content).find(x=>x.id.endsWith('-'+String(w.targetId).replace(/[^\w-]/g,'')))?.id??w.targetId}))}}};
 for(const node of nodesOf(content)){const est=block.sourceReview.workingSpaceEstimate.estimates.find(w=>w.targetId===node.id);if(est&&Number.isFinite(est.answerSpaceMm)&&!(node.children??[]).length)node.answerSpaceMm=est.answerSpaceMm;}
 if(score!=null)setComparisonRating(block,score,placement,refs,evidence);
 return block;
}
export function setComparisonRating(block,score,placement,refs,evidence){
 block.classification={...block.classification,reasoningScore:score,difficulty:bandFor(score),difficultyReason:String(placement.difficultyReason??'').trim()||'Placed by comparison.',
  assessment:{model:MODEL,effort:EFFORT,method:'comparison-v1',assessedAt:now(),rubricVersion:REASONING_RUBRIC,taskHash:reasoningTaskHash(block),diagramBlindHash:diagramBlindHash(block),evidence,comparison:{harderThan:placement.harderThan?{ref:placement.harderThan,score:refs.get(placement.harderThan)??null}:null,easierThan:placement.easierThan?{ref:placement.easierThan,score:refs.get(placement.easierThan)??null}:null,equalTo:placement.equalTo?{ref:placement.equalTo,score:refs.get(placement.equalTo)??null}:null,closerTo:placement.closerTo??null}}};
}
const stripAnswers=content=>JSON.parse(JSON.stringify(content,(k,v)=>['answer','solutionDiagrams'].includes(k)?undefined:v));
const fieldGet=(node,field)=>field==='prompt'?node.prompt:node.answer?.[field];
function fieldSet(node,field,value){if(field==='prompt')node.prompt=value;else node.answer={...node.answer,[field]:value};}

// ---- the run -------------------------------------------------------------------------
export async function runAuditV2({projectFile,root=ROOT,topics=[],dryRun=false,allowNonMaster=false,log=console.error}={}){
 const t0=Date.now(),project=read(projectFile),stamp=now().replace(/[-:]/g,'').replace(/\..*/,'').replace('T','-');
 const workDir=path.join(root,'.booklet-work','pedagogy-audit-v2',project.id,stamp);
 const rebinds=diagramRebinds(project,{root}),base=withRebinds(project,rebinds);
 const state=preflight(base,{root,topics,allowNonMaster});
 const ctx={workDir,runDir:canonicalRunDir(project,{root}),calls:[],log,dryRun};
 const report={projectId:project.id,title:project.title,revision:project.revision,startedAt:new Date(t0).toISOString(),model:MODEL,effort:EFFORT,stages:{},applied:{},comments:[],blockers:[],dropped:[]};
 const stage=(name,fn)=>async(...a)=>{const s=Date.now();try{return await fn(...a);}finally{report.stages[name]={seconds:Math.round((Date.now()-s)/100)/10};}};
 report.preflight={master:state.master,stale:Object.fromEntries(Object.entries(state.stale).map(([k,v])=>[k,v.length])),duplicateCandidates:state.pairs.length,spelling:state.spelling.reduce((n,s)=>n+s.changes.length,0),openComments:state.openComments,v1CommentsToWithdraw:state.v1Comments.length,progressionExceptions:state.progressions,typesReused:[...state.types.values()].filter(t=>t.current).length};
 const comments=[];const addComment=c=>{comments.push(c);};
 let candidate=structuredClone(base);
 report.applied.diagramRebinds=rebinds.map(r=>({id:r.id,score:r.classification.reasoningScore,source:r.source}));
 // Stage 0 spelling.
 for(const s of state.spelling){
  if(s.protected){addComment({targetId:s.id,kind:'spelling',key:'spell|'+s.id,note:`[Pedagogy audit v2 · Spelling] Australian spelling on this teacher-reviewed block: ${s.changes.map(c=>c.from+' → '+c.to).join(', ')}.`});continue;}
  for(const sec of candidate.sections)sec.blocks=(sec.blocks??[]).map(b=>{if(b.id!==s.id)return b;const fixed=s.block;if(verifiedRating(b)){const a=fixed.classification.assessment;a.originalTaskHash??=a.taskHash;fixed.classification.assessment={...a,taskHash:reasoningTaskHash(fixed),spellingReuse:{kind:'australian-spelling-v1',previousTaskHash:a.taskHash,changes:s.changes.map(c=>c.from+'>'+c.to),contentFingerprint:contentFingerprint(fixed)}};}return fixed;});
 }
 report.applied.spelling=state.spelling.filter(s=>!s.protected).map(s=>({id:s.id,changes:s.changes.map(c=>c.from+' → '+c.to)}));
 // Stage 2: moves and provisional order.
 const moves=challengeMoves(candidate);
 candidate=applyMoves(candidate,moves);
 let ordered=orderCandidate(candidate,{progressions:state.progressions});
 candidate=ordered.project;
 report.moves=moves;
 const dryGaps=gapPlan(candidate,state,{audit:null});
 const packets=auditPackets(state,candidate,{root});
 report.dryRun={packets:packets.map(p=>({topics:p.topics,characters:p.system.length+p.prompt.length})),provisionalSlots:dryGaps.slots.length,provisionalSlotsBySection:Object.fromEntries([...new Set(dryGaps.slots.map(s=>s.sectionId))].map(id=>[id,dryGaps.slots.filter(s=>s.sectionId===id).length])),deficits:dryGaps.deficits,jumpsOver15:dryGaps.gaps,ratingsToFill:state.stale.rating.length,orderingHolds:ordered.plan.holds.length};
 if(dryRun){report.elapsedSeconds=Math.round((Date.now()-t0)/1000);return {report,workDir:null};}
 fs.mkdirSync(workDir,{recursive:true});write(path.join(workDir,'before.json'),project);
 const anchors=anchorRefs(root);
 try{
 // Stage 1: missing or stale ratings, by comparison.
 const pendingHigh=new Set();state.pendingHigh=pendingHigh;
 await stage('1-ratings',async()=>{
  const targets=state.stale.rating.map(id=>bookletIndex(candidate).find(r=>r.block.id===id)).filter(Boolean);if(!targets.length)return;
  const refIds=new Set(),items=targets.map(r=>{const ladder=ladderFor(candidate,{sectionId:r.section.id,topicId:r.section.topicId,exclude:new Set([r.block.id])});ladder.forEach(id=>refIds.add(id));return {id:r.block.id,ladder:[...ladder,...anchors.map(a=>a.ref)],task:studentView(r.block)};});
  const blocks=new Map(bookletIndex(candidate).map(r=>[r.block.id,r.block])),refs=new Map([...anchors.map(a=>[a.ref,a.score]),...[...refIds].map(id=>[id,scoreOf(blocks.get(id))])]);
  const system=ratingContract()+'\n\nStanding anchors:\n'+anchors.map(a=>JSON.stringify(a)).join('\n');
  const prompt=JSON.stringify({references:[...refIds].map(id=>({ref:id,score:scoreOf(blocks.get(id)),task:studentView(blocks.get(id))})),targets:items});
  const {value,file}=await callSonnet(ctx,{stage:'rating',system,prompt,validate:r=>validatePlacements(r,items.map(i=>i.id))});
  for(const item of items){const p=value.get(item.id),d=deriveComparisonScore(p,refs),b=blocks.get(item.id);
   if(d.score==null){report.blockers.push({stage:'rating',id:item.id,reason:'placement '+d.how});continue;}
   if(d.score>=LIMITS.appliedBelow){pendingHigh.add(item.id);const rated=structuredClone(b);setComparisonRating(rated,d.score,p,refs,file);addComment({targetId:item.id,kind:'rating-60-plus',key:'rate|'+item.id,payload:{op:'rating',blockId:item.id,classification:rated.classification},note:`[Pedagogy audit v2 · Rating to decide] Placed by comparison at ${d.score} (between ${p.harderThan??'—'} and ${p.easierThan??'—'}). Scores of 60 or more are not applied automatically; the question keeps its position. Reason: ${p.difficultyReason}`});continue;}
   setComparisonRating(b,d.score,p,refs,file);(report.applied.ratings??=[]).push({id:item.id,score:d.score,how:d.how,flagged:!!d.flagged});}
  ordered=orderCandidate(candidate,{progressions:state.progressions});candidate=ordered.project;
 })();
 // Stage 3: topic audit.
 const audit={archetypes:[],types:[],exampleMatches:[],spread:[],errors:[],duplicates:[],bridges:[],missing:[],prerequisites:[],extensions:[],keep:[],theory:[]};
 await stage('3-audit',async()=>{
  for(const packet of auditPackets(state,candidate,{root})){
   try{const {value,file}=await callSonnet(ctx,{stage:'audit',system:packet.system,prompt:packet.prompt,validate:r=>validateAudit(r,packet.ctx)});for(const k of Object.keys(audit))audit[k].push(...(value[k]??[]));(report.auditDiscarded??=[]).push(...(value.discarded??[]));(report.auditCalls??=[]).push(file);}
   catch(error){if(!error.blocker)throw error;report.blockers.push({stage:'audit',topics:packet.topics,reason:error.message});}
  }
  // Parts of a split topic each report on their own exercises: merge worked-example matches, and
  // keep one "missing" finding per type.
  const matches=new Map();for(const m of audit.exampleMatches){const row=matches.get(m.exampleId)??{...m,followedBy:[]};row.followedBy=[...new Set([...row.followedBy,...(m.followedBy??[])])];matches.set(m.exampleId,row);}audit.exampleMatches=[...matches.values()];
  const seenMissing=new Set();audit.missing=audit.missing.filter(m=>{const k=m.type??JSON.stringify(m);if(seenMissing.has(k))return false;seenMissing.add(k);return true;});
  for(const row of audit.archetypes)state.types.set(row.id,{type:row.type,current:true,source:'audit-v2'});
  for(const [id,t] of state.types)if(!audit.types.some(x=>x.type===t.type))audit.types.push({type:t.type,topicId:bookletIndex(candidate).find(r=>r.block.id===id)?.section.topicId,taught:true,taughtBy:[],description:'stored type'});
 })();
 write(path.join(workDir,'audit.json'),audit);
 // Stage 4: final order and gap plan.
 let gaps;
 const deliberate=audit.duplicates.filter(d=>d.verdict==='deliberate').map(d=>d.ids);
 await stage('4-plan',async()=>{
  ordered=orderCandidate(candidate,{keep:audit.keep,deliberate,progressions:state.progressions,original:project});candidate=ordered.project;
  gaps=gapPlan(candidate,state,{audit});
 })();
 // Stage 5a: challenge of teaching judgements.
 const judgements=[];
 const ownerOf=new Map(bookletIndex(candidate).flatMap(r=>nodesOf(r.block).map(n=>[String(n.id),r.block.id])));
 const cite=ids=>[...new Set(ids.filter(Boolean).map(id=>ownerOf.get(String(id))??id))].map(id=>bookletIndex(candidate).find(r=>r.block.id===id)).filter(Boolean).map(r=>({id:r.block.id,topicId:r.section.topicId,view:studentView(r.block)}));
 audit.duplicates.filter(d=>d.verdict==='accidental').forEach(d=>judgements.push({kind:'duplicate',row:d,cites:d.ids}));
 audit.spread.forEach(d=>judgements.push({kind:'spread',row:d,cites:d.ids}));
 for(const k of ['bridges','missing','prerequisites','extensions'])audit[k].forEach(d=>judgements.push({kind:k,row:d,cites:[d.after,...(d.neededBy??[])]}));
 audit.theory.filter(t=>['definition','wording'].includes(t.verdict)).forEach(d=>judgements.push({kind:'theory-'+d.verdict,row:d,cites:[d.id]}));
 judgements.forEach((j,i)=>{j.id='j'+(i+1);if(j.kind==='spread')j.row.judgement=j.id;});
 for(const s of gaps.slots)if(s.reason==='spread')s.judgement=audit.spread.find(sp=>sp.type===s.type)?.judgement??null;
 const teachingOf=topicId=>bookletIndex(candidate).filter(r=>r.section.topicId===topicId&&r.kind==='teaching').map(r=>({id:r.block.id,view:studentView(r.block)}));
 const challengeRun=stage('5a-challenge',async()=>{
  if(!judgements.length)return new Map();
  // Judgements are independent, so an over-cap challenge is halved rather than refused (pilot 2's reached 247,000 of 280,000 characters).
  const send=async(list,withTopics)=>{const system=challengeContract(),prompt=JSON.stringify({booklet:candidate.title,judgements:list.map(j=>({id:j.id,kind:j.kind,judgement:j.row,cited:cite(j.cites),...(withTopics?{topicTeaching:teachingOf(j.row.topicId??cite(j.cites)[0]?.topicId)}:{})}))});
   if(list.length>1&&system.length+prompt.length>LIMITS.promptCharacters){const half=Math.ceil(list.length/2),[a,b]=await Promise.all([send(list.slice(0,half),withTopics),send(list.slice(half),withTopics)]);return new Map([...a,...b]);}
   return (await callSonnet(ctx,{stage:'challenge',system,prompt,validate:r=>validateVerdicts(r,list.map(j=>j.id))})).value;};
  const verdicts=await send(judgements,['missing','prerequisites','theory-definition'].some(k=>judgements.some(j=>j.kind===k)));
  const again=judgements.filter(j=>verdicts.get(j.id)?.verdict==='unchecked');
  if(again.length){const second=await send(again,true);for(const j of again){const v=second.get(j.id);verdicts.set(j.id,v.verdict==='unchecked'?{...v,verdict:'unverified'}:v);}}
  return verdicts;
 })();
 // Stage 5b: slot drafting, in parallel with the challenge.
 const blocksNow=()=>new Map(bookletIndex(candidate).map(r=>[r.block.id,r]));
 const typeRequest=(s,extra={})=>{const rows=blocksNow(),info=audit.types.find(t=>t.type===s.type);const same=[...rows.values()].filter(r=>r.routine&&typeOf(state,r.block.id)===s.type);
  const near=id=>id&&rows.get(id)?{id,score:scoreOf(rows.get(id).block)}:null,between=s.neighbours?{harderThan:near(s.neighbours.harderThan),easierThan:near(s.neighbours.easierThan)}:null;
  return {requestId:s.id,exerciseId:s.sectionId,after:s.after,type:s.type,typeDescription:info?.description??null,targetScore:s.target,acceptRange:s.range,...(between&&(between.harderThan||between.easierThan)?{placeBetween:between}:{}),...(s.variant?{variant:s.variant,sameSlotAs:s.baseSlot+'-'+(s.variant==='lower'?'upper':'lower')}:{}),reason:s.reason,workedExamples:(info?.taughtBy??[]).filter(id=>rows.get(id)),existing:same.slice(0,6).map(r=>({id:r.block.id,score:scoreOf(r.block),skill:r.block.classification?.primarySkillId})),...extra};};
 // Each question's text is sent once (6 November 2026): pilot 2's eight proposal requests each carried their whole exercise and reached 520,000 characters.
 const draftPrompt=requests=>{const rows=blocksNow(),views={},exercises={};
  const add=id=>{const r=rows.get(id);if(r&&!views[id])views[id]=studentView(r.block);};
  for(const q of requests){(q.workedExamples??[]).forEach(add);(q.existing??[]).forEach(e=>add(e.id));if(q.replacing)add(q.replacing);for(const n of Object.values(q.placeBetween??{}))if(n)add(n.id);if(q.exerciseId&&q.proposal&&!exercises[q.exerciseId]){const sec=candidate.sections.find(x=>x.id===q.exerciseId);if(sec)exercises[q.exerciseId]=(sec.blocks??[]).map(b=>studentView(b,{answers:false}));}}
  return JSON.stringify({styleSheet:styleSheet(candidate,bookletIndex(candidate)),views,exercises,requests});};
 // At most LIMITS.draftsPerCall requests per drafting call (6 November 2026): pilot 2's
 // nine-request proposal reply ran to 38,000 output tokens and came back as broken JSON.
 const draftCalls=async(stageName,system,requests,size=LIMITS.draftsPerCall)=>{
  const chunks=[];for(let i=0;i<requests.length;i+=size)chunks.push(requests.slice(i,i+size));
  const out=await Promise.all(chunks.map(list=>callSonnet(ctx,{stage:stageName,system,prompt:draftPrompt(list),validate:r=>validateDrafts(r,list.map(q=>q.requestId))})));
  return {drafts:out.flatMap(({value,file})=>value.drafts.map(d=>({...d,file}))),blocked:out.flatMap(({value})=>value.blocked)};
 };
 // Two versions per slot (James, 6 November 2026), one aimed just above the lower neighbour and
 // one just below the upper; every version that passes is inserted. All three first drafts in
 // the 6 November Similar Triangles run came out harder than their window.
 const draftRun=stage('5b-drafting',async()=>{
  const fill=gaps.slots.filter(s=>!s.untaught&&s.type).flatMap(s=>['lower','upper'].map(variant=>({...s,id:s.id+'-'+variant,baseSlot:s.id,variant})));
  if(!fill.length)return [];
  const requests=fill.map(s=>typeRequest(s));
  const value=await draftCalls('draft-slots',draftContract({root}),requests,2*Math.floor((LIMITS.draftsPerCall+1)/2));
  for(const b of value.blocked)report.dropped.push({slot:b.requestId,reason:'blocked by drafter: '+b.reason});
  return value.drafts.map(d=>({...d,slot:fill.find(s=>s.id===d.requestId)}));
 })();
 const [verdicts,slotDrafts]=await Promise.all([challengeRun,draftRun]);
 const verdictOf=j=>verdicts.get(j.id)?.verdict;
 report.challenge=judgements.map(j=>({id:j.id,kind:j.kind,verdict:verdictOf(j),reason:verdicts.get(j.id)?.reason}));
 // Spread slots stand only while their judgement survives.
 const drafts=slotDrafts.filter(d=>{const j=judgements.find(x=>x.id===d.slot.judgement);if(!j)return true;const ok=verdictOf(j)==='confirmed';if(!ok)report.dropped.push({slot:d.slot.id,reason:'spread finding '+verdictOf(j)});return ok;});
 // Stage 5c: proposal drafting, confirmed only.
 const samePart=j=>j.kind==='duplicate'&&j.row.ids[0]===j.row.ids[1];
 // Every approvable finding is drafted now, so applying an approved comment needs no drafting call (6 November 2026).
 for(const j of judgements.filter(samePart)){j.row.replace=j.row.ids[0];j.row.replaceNodes=(j.row.nodes??[]).slice(1);j.repeatedPart=true;}
 for(const j of judgements.filter(j=>j.kind==='duplicate'&&!j.repeatedPart))j.row.replaceNodes=(j.row.nodes??[]).filter(n=>(ownerOf.get(String(n))??n)===j.row.replace);
 const confirmed=judgements.filter(j=>['confirmed','unverified'].includes(verdictOf(j))&&['duplicate','bridges','missing','prerequisites','extensions'].includes(j.kind));
 const drafted=new Set(confirmed.map(j=>j.id));
 const proposalKind=j=>j.repeatedPart?'duplicate-parts':'proposal-'+j.kind;
 const proposalTarget=j=>j.row.replace??j.row.after??(j.row.neededBy??[])[0]??j.cites.find(Boolean);
 const proposalLabel=j=>j.repeatedPart?'Repeated part':{duplicate:'Duplicate replacement',missing:'New teaching',prerequisites:'Opening review item',bridges:'Bridge',extensions:'Extension'}[j.kind];
 let proposalDrafts=[];
 await stage('5c-proposals',async()=>{
  if(!confirmed.length)return;
  const rows=blocksNow();
  const want={
   duplicate:r=>'A replacement for '+(r.replaceNodes??[]).join(', ')+' only (the repeated item in '+r.replace+'), written as a question with no parts that is the new item. Same type and difficulty, a different function or numbers, and not a repeat of anything in "exercise".',
   prerequisites:r=>'One short retrieval question for the topic\'s opening review on exactly this prerequisite: '+r.prerequisite+'. Not a worked example and not a question on the topic\'s new method.',
   bridges:r=>'One scaffolded bridging question to go after '+r.after+' that achieves: '+r.achieves+'.',
   extensions:r=>'One extension question to go after '+r.after+' whose parts lead students to this insight: '+r.insight+'.',
   missing:r=>'A worked example for the untaught type '+r.type+' ('+r.description+'), then one guided-practice question of the same type.'};
  const requests=confirmed.map(j=>{const r=j.row,first=r.replace??r.after??(r.neededBy??[])[0],slot={id:j.id,sectionId:r.exerciseId??rows.get(ownerOf.get(String(first))??first)?.section.id??null,type:r.type??r.replacementType,target:r.targetScore??null,range:null,after:r.after??r.replace??null,reason:j.kind};
   const section=candidate.sections.find(x=>x.id===slot.sectionId);
   return typeRequest(slot,{proposal:j.kind,want:want[j.kind](r),finding:r,...(r.replace&&rows.get(r.replace)?{replacing:r.replace}:{}),...(section?{exerciseId:section.id}:{})});});
  const value=await draftCalls('draft-proposals',proposalContract({root}),requests);
  proposalDrafts=value.drafts.map(d=>({...d,judgement:confirmed.find(j=>j.id===d.requestId)}));
  for(const b of value.blocked){report.dropped.push({proposal:b.requestId,reason:'blocked by drafter: '+b.reason});const j=confirmed.find(x=>x.id===b.requestId);if(j)addComment({targetId:proposalTarget(j),kind:proposalKind(j),key:'prop|'+j.id,note:`[Pedagogy audit v2 · ${proposalLabel(j)}] ${verdicts.get(j.id)?.comment??j.row.reason??''}\nNo drafted question is attached: the drafter could not write one (${String(b.reason).slice(0,200)}).`});}
 })();
 // Stage 6: blind solve, writing rules and placement; redraft once on failure.
 const accepted=[];const corrections=[];
 await stage('6-solve',async()=>{
  const rows=blocksNow();
  const refIds=new Set();
  const solveItems=[];
  const existingNow=()=>bookletIndex(candidate).filter(r=>r.question).map(r=>r.block);
  const ladder=(sectionId,topicId,include=[])=>{const l=ladderFor(candidate,{sectionId,topicId,include});l.forEach(id=>refIds.add(id));return [...l,...anchors.map(a=>a.ref)];};
  for(const d of drafts)solveItems.push({id:d.slot.id,kind:'new',draft:d,task:stripAnswers(d.content),ladder:ladder(d.slot.sectionId,candidate.sections.find(s=>s.id===d.slot.sectionId)?.topicId,Object.values(d.slot.neighbours??{}).filter(Boolean))});
  for(const d of proposalDrafts){const c=d.content??d.workedExample?.guidedPractice;if(!c)continue;solveItems.push({id:d.requestId,kind:'new',proposal:true,intent:d.judgement?.row?.prerequisite??d.judgement?.row?.insight??d.judgement?.row?.achieves??d.judgement?.row?.description??d.judgement?.row?.replacementType??null,draft:d,task:stripAnswers(c),...(d.workedExample?{workedExample:{prompt:d.workedExample.prompt}}:{})});}
  for(const [i,e] of audit.errors.entries()){const r=rows.get(e.blockId);if(!r)continue;const node=nodesOf(r.block).find(n=>n.id===e.nodeId)??(r.block.content?.id===e.nodeId?r.block.content:null);
   if(!node||typeof fieldGet(node,e.field)!=='string'){addComment({targetId:e.blockId,kind:'error-unapplied',key:'err|'+e.blockId+'|'+e.nodeId,note:`[Pedagogy audit v2 · Possible error, not checked automatically] ${e.wrong} Proposed correction: ${e.correction}`});continue;}
   if(e.field==='prompt'){addComment({targetId:e.blockId,kind:'error-wording',key:'err|'+e.blockId+'|'+e.nodeId,payload:typeof node.prompt==='string'?{op:'set-field',blockId:e.blockId,nodeId:e.nodeId,field:'prompt',value:e.correction}:null,note:`[Pedagogy audit v2 · Question wording error] ${e.wrong} Proposed wording: ${e.correction}`});continue;}
   const id='e'+(i+1),view=r.block.type==='question'?stripAnswers(r.block.content):studentView(r.block,{answers:false});
   const corrected=structuredClone(r.block);fieldSet(nodesOf(corrected).find(n=>n.id===e.nodeId)??corrected.content,e.field,e.correction);
   solveItems.push({id,kind:'claim',claim:e,block:r.block,corrected,task:view,targetNode:e.nodeId,ladder:r.question?ladder(r.section.id,r.section.topicId):null});
  }
  if(!solveItems.length)return;
  const blocks=new Map(bookletIndex(candidate).map(r=>[r.block.id,r.block])),refs=new Map([...anchors.map(a=>[a.ref,a.score]),...[...refIds].map(id=>[id,scoreOf(blocks.get(id))])]);
  const system=solveContract({root})+'\n\nStanding anchors:\n'+anchors.map(a=>JSON.stringify(a)).join('\n');
  const solve=async items=>{const prompt=JSON.stringify({references:[...refIds].map(id=>({ref:id,score:scoreOf(blocks.get(id)),task:studentView(blocks.get(id))})),items:items.map(it=>({id:it.id,...(it.kind==='new'?{new:true}:{}),...(it.intent?{intent:it.intent}:{}),question:it.task,...(it.workedExample?{workedExamplePrompt:it.workedExample.prompt}:{}),...(it.targetNode?{answerNode:it.targetNode}:{}),...(it.ladder?{ladder:it.ladder}:{})}))});
   return (await callSonnet(ctx,{stage:'solve',system,prompt,validate:r=>validateSolve(r,items)})).value;};
  let round=solveItems,attempt=1;
  while(round.length){
   const out=await solve(round),redo=[];
   const pairs=[];
   for(const it of round){const sol=out.solutions.get(it.id),answers=new Map((sol?.answers??[]).map(a=>[String(a.nodeId),a.answer]));
    if(it.kind==='new'){const c=it.draft.content??it.draft.workedExample?.guidedPractice;answerNodes(c).forEach((n,k)=>pairs.push({id:it.id+'#'+k,item:it,a:answers.get(String(n.id))??[...answers.values()][k]??'',b:n.answer.short||n.answer.worked}));}
    else{const node=nodesOf(it.block).find(n=>n.id===it.targetNode)??it.block.content;const solved=answers.get(String(it.targetNode))??[...answers.values()].at(-1)??'';pairs.push({id:it.id+'#new',item:it,a:solved,b:it.claim.field==='short'?it.claim.correction:it.claim.correction.split('\\\\').at(-1)},{id:it.id+'#old',item:it,a:solved,b:it.claim.field==='short'?fieldGet(node,'short'):String(fieldGet(node,it.claim.field)??'').split('\\\\').at(-1)});}}
   const eq=await compareAnswers(ctx,pairs);
   for(const it of round){
    const mine=pairs.filter(p=>p.item===it),ok=mine.length&&mine.every(p=>eq.get(p.id)?.equivalent);
    if(it.kind==='claim'){const yes=eq.get(it.id+'#new')?.equivalent,no=eq.get(it.id+'#old')?.equivalent;
     if(yes&&!no){const p=out.placements.get(it.id);corrections.push({...it,placement:p,solveFile:ctx.calls.at(-1)?.id});}
     else if(no&&!yes)report.dropped.push({claim:it.claim.blockId,reason:'blind solve agrees with the booklet'});
     else addComment({targetId:it.claim.blockId,kind:'error-unresolved',key:'err|'+it.claim.blockId+'|'+it.claim.nodeId,note:`[Pedagogy audit v2 · Unresolved possible error] ${it.claim.wrong}\nBooklet: ${fieldGet(nodesOf(it.block).find(n=>n.id===it.targetNode)??it.block.content,it.claim.field)}\nProposed: ${it.claim.correction}\nIndependent solve: ${mine[0]?.a}`});
     continue;}
    // Completeness is the script's check: every answered node has a short and a worked answer.
    const drafted=it.draft.content??it.draft.workedExample?.guidedPractice,incomplete=!drafted||!answerNodes(drafted).length||answerNodes(drafted).some(n=>!n.answer.short||!n.answer.worked);
    const offIntent=it.intent&&out.intent?.get(it.id)===false;
    const breaks=[...(out.rules.get(it.id)??[]).filter(rule=>!/^\W*Complete questions/i.test(rule)),...(incomplete?['Complete questions: a short or worked answer is missing']:[]),...(offIntent?['the question does not do what the proposal asks: '+it.intent]:[])];
    // Placement and duplicate checks before acceptance, so a miss gets the one redraft (6 November 2026).
    const placement=out.placements.get(it.id),slot=!it.proposal?it.draft.slot:null;
    const d=placement&&slot?.range?deriveComparisonScore(placement,refs):null;
    const missed=d?.score!=null&&(d.score<slot.range[0]||d.score>slot.range[1])?`was placed at ${d.score} (between ${placement.harderThan??'—'} and ${placement.easierThan??'—'}: ${placement.difficultyReason}); it must land within ${slot.range.join('–')}${slot.neighbours?.harderThan||slot.neighbours?.easierThan?`, harder than ${slot.neighbours.harderThan??'—'} and easier than ${slot.neighbours.easierThan??'—'}`:''}, so make it ${d.score<slot.range[0]?'more demanding':'less demanding'}`:null;
    const dup=drafted&&duplicatePairs([...existingNow(),{id:'draft-'+it.id,type:'question',content:drafted}]).find(p=>p.ids.includes('draft-'+it.id));
    const repeats=dup?`repeats ${dup.ids.find(x=>x!=='draft-'+it.id)}: change the question itself (situation, figure and numbers), not only its wording`:null;
    if(ok&&!breaks.length&&!(attempt===1&&(missed||repeats))){accepted.push({...it,placement});continue;}
    if(attempt===1)redo.push({it,why:!ok?'its answer did not survive an independent solve':breaks.length?'breaks writing rules: '+breaks.join('; '):[missed,repeats].filter(Boolean).join('; ')});
    else{const reason=ok?'writing rules: '+breaks.join('; '):'answer mismatch after redraft';report.dropped.push({slot:it.id,reason});
     // A confirmed teaching finding still reaches James, without the draft that failed.
     const j=it.draft.judgement;if(it.proposal&&j){addComment({targetId:proposalTarget(j),kind:proposalKind(j),key:'prop|'+j.id,note:`[Pedagogy audit v2 · ${proposalLabel(j)}] ${verdicts.get(j.id)?.comment??j.row.reason??j.row.why??''}\nNo drafted question is attached: the draft did not pass the independent checks (${reason.slice(0,200)}).`});}}
   }
   // A version whose other version for the same slot passed is not redrafted, unless that one
   // landed in the top third of the window (James, 6 November 2026): then this one is redrafted
   // to land at least 6 points below it, so the slot actually narrows its jump.
   for(const r of redo.slice()){const s=r.it.draft.slot,sib=s?.variant&&accepted.find(a=>a.draft.slot?.baseSlot===s.baseSlot);if(!sib)continue;
    const [lo,hi]=s.range,sc=sib.placement?deriveComparisonScore(sib.placement,refs).score:null,top=sc!=null&&sc>lo+(hi-lo)*2/3&&sc-LIMITS.floor>=lo;
    if(top){r.it.draft.slot={...s,variant:'lower',range:[lo,sc-LIMITS.floor]};r.why+=`; the other version for this slot landed at ${sc}, in the top third of ${lo}–${hi}, so this one must land within ${lo}–${sc-LIMITS.floor}, only a little harder than ${s.neighbours?.harderThan??'the easier neighbour'}`;(report.redraftLower??=[]).push({slot:s.id,sibling:sib.draft.slot.id,siblingScore:sc,range:[lo,sc-LIMITS.floor]});continue;}
    redo.splice(redo.indexOf(r),1);report.dropped.push({slot:s.id,reason:'the other version filled the slot; this one '+r.why});}
   if(!redo.length||attempt===2)break;
   // Redraft once, then solve once more.
   const requests=redo.map(({it,why})=>({...(it.proposal?{proposal:it.draft.judgement?.kind}:{}),...typeRequest(it.draft.slot??{id:it.id,sectionId:it.draft.judgement?.row?.exerciseId,type:it.draft.judgement?.row?.type,target:it.draft.judgement?.row?.targetScore,range:null,after:it.draft.judgement?.row?.after,reason:'proposal'}),redraft:'Write a fresh question for this request; the previous draft '+why+'.'}));
   const value=await draftCalls('redraft',redo.some(r=>r.it.proposal)?proposalContract({root}):draftContract({root}),requests);
   round=value.drafts.map(d=>{const old=redo.find(r=>r.it.id===d.requestId).it;const draft={...old.draft,...d};return {...old,draft,task:stripAnswers(d.content??d.workedExample?.guidedPractice)};});
   attempt++;
  }
 })();
 // Stage 6 script checks, then insertion.
 const refScores=new Map([...anchors.map(a=>[a.ref,a.score]),...bookletIndex(candidate).filter(r=>r.question).map(r=>[r.block.id,scoreOf(r.block)])]);
 const solveFile=ctx.calls.filter(c=>c.stage==='solve'&&c.ok).at(-1);const evidence=solveFile?rel(path.join(workDir,'calls',solveFile.id+'.json')):null;
 const existingQuestions=bookletIndex(candidate).filter(r=>r.question).map(r=>r.block),inserted=[];
 for(const it of accepted){
  const proposal=it.proposal,slot=it.draft.slot;
  const d=it.placement?deriveComparisonScore(it.placement,refScores):{score:null,how:'none'};
  const temp=newBlock(it.draft.workedExample?{...it.draft,content:it.draft.workedExample.guidedPractice}:it.draft,slot??{id:it.id+'-'+stamp.slice(-6),sectionId:it.draft.judgement?.row?.exerciseId},{project:candidate,score:null,placement:it.placement,refs:refScores,evidence,type:slot?.type??it.draft.judgement?.row?.type??it.draft.judgement?.row?.replacementType??null,kind:proposal?it.draft.judgement.kind:'slot',skill:it.draft.skill});
  if(duplicatePairs([...existingQuestions,...inserted,temp]).some(p=>p.ids.includes(temp.id))){report.dropped.push({slot:it.id,reason:'duplicates an existing or new question'});continue;}
  const describe=()=>{const c=temp.content,parts=(c.children??[]).map(p=>`${p.label??''}) ${p.prompt}`);return `Proposed question: ${c.prompt??''}${parts.length?'\n'+parts.join('\n'):''}${(c.questionDiagrams??[]).length?'\n(with a diagram)':''}\nAnswers: ${answerNodes(c).map(n=>(n.label&&n!==c?n.label+') ':'')+n.answer.short).join('; ')}`;};
  if(proposal){const j=it.draft.judgement,c=verdicts.get(j.id);if(d.score!=null)setComparisonRating(temp,d.score,it.placement,refScores,evidence);addComment({targetId:proposalTarget(j),kind:proposalKind(j),key:'prop|'+j.id,payload:proposalPayload(j,temp,{rows:bookletIndex(candidate),ownerOf,workedExample:it.draft.workedExample}),note:`[Pedagogy audit v2 · ${proposalLabel(j)}${verdictOf(j)==='unverified'?' · unverified':''}] ${c?.comment??j.row.reason??j.row.achieves??j.row.insight??j.row.prerequisite??''}${verdictOf(j)==='unverified'?' The independent challenge could not confirm this from the material it was given.':''}${j.kind==='duplicate'?` Replace ${(j.row.replaceNodes??[]).join(', ')} with the question below.`:''}\n${it.draft.workedExample?'Worked example: '+it.draft.workedExample.prompt+'\n'+it.draft.workedExample.steps+'\nGuided practice:\n':''}${describe()}${d.score!=null?`\nComparison score: ${d.score}.`:''}`});continue;}
  if(d.score==null){report.blockers.push({stage:'solve',id:it.id,reason:'placement '+d.how});continue;}
  if(d.score<slot.range[0]||d.score>slot.range[1]){report.dropped.push({slot:slot.id,reason:`scored ${d.score}, outside the slot range ${slot.range.join('–')}`,draft:stripAnswers(temp.content)});continue;}
  if(slot.commentOnly||d.score>=LIMITS.appliedBelow){const held=newBlock(it.draft,{...slot,id:slot.id+'-'+stamp.slice(-6)},{project:candidate,score:d.score,placement:it.placement,refs:refScores,evidence,type:slot.type,skill:it.draft.skill});addComment({targetId:slot.after??slot.before??candidate.sections.find(s=>s.id===slot.sectionId)?.blocks?.[0]?.id,kind:'slot-comment-only',key:'slot|'+slot.id,payload:{op:'insert',sectionId:slot.sectionId,after:slot.after??null,block:held},note:`[Pedagogy audit v2 · New question to decide] For the ${slot.reason.replace(/-/g,' ')} gap (${slot.type}). Comparison score ${d.score}, between ${it.placement.harderThan??'—'} and ${it.placement.easierThan??'—'}: ${it.placement.difficultyReason}\n${describe()}`});continue;}
  const block=newBlock(it.draft,slot,{project:candidate,score:d.score,placement:it.placement,refs:refScores,evidence,type:slot.type,skill:it.draft.skill});
  state.types.set(block.id,{type:slot.type,current:true,source:'audit-v2'});
  const section=candidate.sections.find(s=>s.id===slot.sectionId),at=section.blocks.findIndex(b=>b.id===slot.after);
  section.blocks.splice(at<0?section.blocks.length:at+1,0,block);inserted.push(block);
  (report.applied.newQuestions??=[]).push({id:block.id,slot:slot.id,reason:slot.reason,type:slot.type,score:d.score,range:slot.range});
 }
 // Solved corrections.
 const blockMap=()=>new Map(candidate.sections.flatMap(s=>(s.blocks??[]).map(b=>[b.id,b])));
 for(const c of corrections){
  const live=blockMap().get(c.claim.blockId);if(!live)continue;
  if(state.protectedIds.has(live.id)){addComment({targetId:live.id,kind:'error-protected',key:'err|'+live.id+'|'+c.claim.nodeId,payload:{op:'set-field',blockId:live.id,nodeId:c.claim.nodeId,field:c.claim.field,value:c.claim.correction},note:`[Pedagogy audit v2 · Error confirmed by an independent solve] ${c.claim.wrong} Correction: ${c.claim.correction}`});continue;}
  const node=nodesOf(live).find(n=>n.id===c.claim.nodeId)??live.content,old=fieldGet(node,c.claim.field);fieldSet(node,c.claim.field,c.claim.correction);
  (report.applied.corrections??=[]).push({id:live.id,nodeId:c.claim.nodeId,field:c.claim.field,old,new:c.claim.correction,reason:c.claim.wrong});
  if(live.type==='question'&&verifiedRating(c.block)){const d=c.placement?deriveComparisonScore(c.placement,refScores):{score:null};
   if(d.score!=null&&d.score<LIMITS.appliedBelow)setComparisonRating(live,d.score,c.placement,refScores,evidence);
   else if(d.score!=null){state.pendingHigh.add(live.id);const rated=structuredClone(live);setComparisonRating(rated,d.score,c.placement,refScores,evidence);addComment({targetId:live.id,kind:'rating-60-plus',key:'rate|'+live.id,payload:{op:'rating',blockId:live.id,classification:rated.classification},note:`[Pedagogy audit v2 · Rating to decide] After the correction this question places at ${d.score}; 60 or more is not applied automatically. ${c.placement.difficultyReason}`});}}
 }
 // Bold, from theory findings.
 for(const t of audit.theory.filter(t=>t.verdict==='bold')){
  const b=blockMap().get(t.id);if(!b)continue;
  if(state.protectedIds.has(b.id)){addComment({targetId:b.id,kind:'bold',key:'bold|'+b.id,payload:{op:'bold',blockId:b.id,terms:t.terms??[]},note:`[Pedagogy audit v2 · Bold key vocabulary] Bold where first defined: ${(t.terms??[]).join(', ')}.`});continue;}
  let next=b;const done=[];for(const term of t.terms??[]){const r=boldTerm(next,term);if(r){next=r;done.push(term);}}
  if(done.length){for(const s of candidate.sections)s.blocks=s.blocks.map(x=>x.id===b.id?next:x);(report.applied.bold??=[]).push({id:b.id,terms:done});}
 }
 // Confirmed theory rewrites and other teaching findings become comments; unverified ones say so.
 for(const j of judgements){const v=verdictOf(j),c=verdicts.get(j.id);
  if(j.kind.startsWith('theory-')&&(v==='confirmed'||v==='unverified'))addComment({targetId:j.row.id,kind:j.kind,key:'theory|'+j.row.id,payload:{op:'theory',blockId:j.row.id,replacement:j.row.replacement},note:`[Pedagogy audit v2 · ${j.kind==='theory-definition'?'Definition':'Wording'}${v==='unverified'?' · unverified':''}] ${c?.comment??j.row.reason}\nReplacement text: ${j.row.replacement}`});
  else if(v==='unverified'&&!j.kind.startsWith('theory-')&&!drafted.has(j.id))addComment({targetId:j.cites.find(Boolean),kind:'unverified-'+j.kind,key:'unv|'+j.id,note:`[Pedagogy audit v2 · ${{bridges:'Bridge',missing:'New teaching',prerequisites:'Opening review item',extensions:'Extension',duplicate:'Duplicate',spread:'Near-copies'}[j.kind]??j.kind} · unverified] ${j.row.achieves??j.row.insight??j.row.prerequisite??j.row.description??j.row.reason??''}${j.row.after?' (after '+j.row.after+')':''}${(j.row.ids??[]).length?' Items: '+j.row.ids.join(', ')+'.':''} The independent challenge could not confirm this from the material it was given.`});
 }
 // The depletion guard was removed on 6 November 2026 (James): Challenge questions are meant to
 // be unfamiliar, so moves always go through. A routine type left below the minimum is a
 // count gap like any other; a type that only exists at Challenge level has no minimum.
 const ch=candidate.sections.find(s=>s.role==='challenge'&&s.id===candidate.id+'-challenge');if(ch&&!ch.blocks.length){candidate.sections=candidate.sections.filter(s=>s!==ch);candidate.topics=(candidate.topics??[]).filter(t=>t.id!=='challenge'||candidate.sections.some(s=>s.topicId==='challenge'));}
 // Final order and gap checks.
 ordered=orderCandidate(candidate,{keep:audit.keep,deliberate,progressions:state.progressions,original:project});candidate=ordered.project;
 for(const c of holdComments(ordered.plan,candidate))addComment(c);
 const finalGaps=gapPlan(candidate,state,{audit});
 report.remaining={deficits:finalGaps.deficits,jumpsOver15:finalGaps.gaps,slotsStillOpen:finalGaps.slots.length};
 report.slots=gaps.slots;
 // Comments, merged with an open comment of the same kind on the same block; v1 comments withdrawn.
 const {createFeedback}=await import('../src/lib/booklet-feedback.js');
 const owners=new Map(candidate.sections.flatMap(s=>(s.blocks??[]).flatMap(b=>nodesOf(b).map(n=>[n.id,b.id]))));
 const withdrawn=state.v1Comments.map(f=>f.id);
 candidate.studio={version:1,...candidate.studio,flags:(candidate.studio?.flags??[]).filter(f=>!withdrawn.includes(f.id))};
 for(const c of comments){
  const rootId=owners.has(c.targetId)?owners.get(c.targetId):candidate.sections.flatMap(s=>s.blocks??[]).find(b=>b.id===c.targetId)?.id;if(!rootId){report.blockers.push({stage:'comments',reason:'no target for comment '+c.key});continue;}
  const open=candidate.studio.flags.find(f=>f.kind===COMMENT_KIND&&!f.resolved&&f.targetId===rootId&&f.findingKind===c.kind);
  let flag=open;
  if(open)open.note+='\n\n'+c.note;
  else{flag={...createFeedback(candidate,{rootId,edition:'student'},c.note,'local'),kind:COMMENT_KIND,findingKind:c.kind,findingKey:c.key};candidate.studio.flags.push(flag);}
  if(c.payload){const target=candidate.sections.flatMap(s=>s.blocks??[]).find(b=>b.id===(c.payload.blockId??rootId));(report.proposals??={})[flag.id]??={kind:c.kind,payloads:[]};report.proposals[flag.id].payloads.push({...c.payload,key:c.key,targetFingerprint:target?contentFingerprint(target):null});}
 }
 report.comments=comments.map(c=>({target:c.targetId,kind:c.kind}));
 report.withdrawnV1=state.v1Comments.map(f=>({id:f.id,kind:f.kind,targetId:f.targetId,note:f.note}));
 // Fingerprints now checked, per check, recorded only against content each check ran on.
 const checks={},finalRows=bookletIndex(candidate),corrected=new Map((report.applied.corrections??[]).map(c=>[c.id,c]));
 const sentAudit=new Set(auditPackets(state,structuredClone(project),{root}).flatMap(p=>[...p.ctx.ids]));
 for(const r of finalRows){const id=r.block.id,fp=contentFingerprint(r.block),row={};
  const wasChanged=corrected.has(id),beforeBlock=state.rows.find(x=>x.block.id===id)?.block,wordingSame=beforeBlock&&wordingFingerprint(beforeBlock)===wordingFingerprint(r.block);
  if(r.question&&state.types.get(id)?.current&&(!wasChanged||wordingSame))row.type=fp;
  if((r.question||r.example)&&(state.stale.error.includes(id)?sentAudit.has(id)&&(!wasChanged||wordingSame):true))row.error=fp;
  if(r.question)row.duplicate=fp;
  if(r.kind==='teaching'&&(!state.stale.theory.includes(id)||audit.theory.some(t=>t.id===id)))row.theory=fp;
  checks[id]=row;}
 report.record={checks,types:Object.fromEntries([...state.types].filter(([,t])=>t.current).map(([id,t])=>[id,t.type])),exampleMatches:Object.fromEntries(audit.exampleMatches.map(m=>[m.exampleId,m.followedBy])),keep:audit.keep};
 }catch(error){report.blockers.push({stage:'run',reason:error.message,stack:String(error.stack).slice(0,1500)});}
 report.finishedAt=now();report.elapsedSeconds=Math.round((Date.now()-t0)/1000);
 report.calls=ctx.calls;
 report.totals=ctx.calls.reduce((t,c)=>({calls:t.calls+1,ok:t.ok+(c.ok?1:0),modelSeconds:t.modelSeconds+c.elapsedMs/1000,costUsd:t.costUsd+(c.costUsd??0),inputTokens:t.inputTokens+(c.usage?.input_tokens??0),cacheWriteTokens:t.cacheWriteTokens+(c.usage?.cache_creation_input_tokens??0),cacheReadTokens:t.cacheReadTokens+(c.usage?.cache_read_input_tokens??0),outputTokens:t.outputTokens+(c.usage?.output_tokens??0)}),{calls:0,ok:0,modelSeconds:0,costUsd:0,inputTokens:0,cacheWriteTokens:0,cacheReadTokens:0,outputTokens:0});
 report.totals.modelSeconds=Math.round(report.totals.modelSeconds);report.totals.costUsd=Math.round(report.totals.costUsd*1000)/1000;
 candidate.revision=project.revision;
 write(path.join(workDir,'candidate.json'),candidate);write(path.join(workDir,'report.json'),report);write(path.join(workDir,'report.md'),reportMarkdown(report));
 return {report,workDir};
}

export function reportMarkdown(r){
 const t=r.totals??{},lines=[`# Pedagogy audit v2: ${r.title}`,'',`Project \`${r.projectId}\` revision ${r.revision}. Model \`${r.model}\` at ${r.effort} effort for every call.`,'',`Wall clock ${r.elapsedSeconds} s; ${t.calls??0} calls (${t.ok??0} succeeded), ${t.modelSeconds??0} s in model calls, $${t.costUsd??0} (input ${t.inputTokens??0}, cache write ${t.cacheWriteTokens??0}, cache read ${t.cacheReadTokens??0}, output ${t.outputTokens??0} tokens).`,''];
 lines.push('## Stages','',...Object.entries(r.stages??{}).map(([k,v])=>`- ${k}: ${v.seconds} s`),'');
 lines.push('## Calls','','| Call | Seconds | Input | Cache write | Cache read | Output | Cost | OK |','|---|---|---|---|---|---|---|---|',...(r.calls??[]).map(c=>`| ${c.id} | ${Math.round(c.elapsedMs/1000)} | ${c.usage?.input_tokens??''} | ${c.usage?.cache_creation_input_tokens??''} | ${c.usage?.cache_read_input_tokens??''} | ${c.usage?.output_tokens??''} | ${c.costUsd!=null?'$'+c.costUsd.toFixed(3):''} | ${c.ok?'yes':'no: '+(c.error??'').slice(0,80)} |`),'');
 lines.push('## Applied automatically','',`- Challenge moves: ${(r.moves??[]).map(m=>m.ids.join('+')+' ('+m.score+')').join(', ')||'none'}${r.heldMoves?.length?'; held by the depletion guard: '+r.heldMoves.map(h=>h.id).join(', '):''}`,`- New questions: ${(r.applied?.newQuestions??[]).map(q=>`${q.id} (${q.type}, ${q.score})`).join(', ')||'none'}`,`- Corrections: ${(r.applied?.corrections??[]).map(c=>c.id+' '+c.field).join(', ')||'none'}`,`- Ratings filled: ${(r.applied?.ratings??[]).length}`,`- Spelling: ${(r.applied?.spelling??[]).map(s=>s.id+': '+s.changes.join(', ')).join('; ')||'none'}`,`- Bold: ${(r.applied?.bold??[]).map(b=>b.id+': '+b.terms.join(', ')).join('; ')||'none'}`,'');
 lines.push('## Studio comments','',...(r.comments??[]).map(c=>`- ${c.kind} on ${c.target}`),`- Withdrawn v1 pedagogy comments: ${(r.withdrawnV1??[]).length}`,'');
 lines.push('## Challenge verdicts','',...(r.challenge??[]).map(c=>`- ${c.id} ${c.kind}: ${c.verdict}${c.reason?' — '+c.reason:''}`),'');
 lines.push('## Dropped','',...(r.dropped??[]).map(d=>`- ${d.slot??d.proposal??d.claim}: ${d.reason}`),'');
 lines.push('## Remaining after this run','',`- Types below 3 items: ${(r.remaining?.deficits??[]).map(d=>d.sectionId.slice(-24)+'/'+d.type+' ('+d.items+')').join(', ')||'none'}`,`- Jumps over 15: ${(r.remaining?.jumpsOver15??[]).map(g=>g.after+'→'+g.before+' (+'+g.step+')').join(', ')||'none'}`,'');
 if(r.blockers?.length)lines.push('## Blockers','',...r.blockers.map(b=>`- ${b.stage}: ${b.reason}`),'');
 return lines.join('\n');
}

// ---- Stage 7: one save --------------------------------------------------------------
export async function applyAuditV2({projectId,runDir,root=ROOT,log=console.error}){
 const base=path.join(root,'.booklet-work','pedagogy-audit-v2',projectId);
 runDir??=path.join(base,fs.readdirSync(base).filter(n=>fs.existsSync(path.join(base,n,'candidate.json'))).sort().at(-1));
 const report=read(path.join(runDir,'report.json')),candidateFile=path.join(runDir,'candidate.json'),candidate=read(candidateFile),live=read(path.join(root,'booklets','projects',projectId+'.json'));
 if(report.blockers?.some(b=>b.stage==='run'))throw Error('The run failed; nothing to apply: '+report.blockers.find(b=>b.stage==='run').reason);
 if(live.revision!==report.revision)throw Error(`Live revision is ${live.revision}, the run was on ${report.revision}: run the audit again`);
 const busy=inFlight(live);if(busy.length)throw Error('Another import, review, export or repair is running: '+busy[0].slice(0,200));
 const {publishProject,publicationDiff}=await import('../scripts/booklet/publish-project.mjs');
 const diff=publicationDiff(live,candidate),printed=[...diff.added,...diff.changed].filter(id=>{const a=live.sections.flatMap(s=>s.blocks??[]).find(b=>b.id===id),b=candidate.sections.flatMap(s=>s.blocks??[]).find(x=>x.id===id);return !a||contentFingerprint(a)!==contentFingerprint(b)||JSON.stringify(a.content)!==JSON.stringify(b.content);});
 const t0=Date.now(),record={render:null,publish:null};
 // One render of changed pages (comment-only changes need none).
 if(printed.length||diff.reordered){
  const out=path.join(runDir,'pages'),answers=(report.applied?.newQuestions?.length||report.applied?.corrections?.length)?'student,short,worked':'student';
  // Re-sorted blocks count too (6 November 2026: a sort-only run rendered "0 blocks" and failed).
  const order=p=>new Map(p.sections.flatMap(s=>(s.blocks??[]).map((b,i)=>[b.id,s.id+'#'+i]))),was=order(live),now=order(candidate);
  const resorted=[...now].filter(([id,at])=>was.has(id)&&was.get(id)!==at).map(([id])=>id);
  const ids=[...new Set([...printed,...(report.moves??[]).flatMap(m=>m.ids),...resorted])];
  log('render check: '+ids.length+' blocks, editions '+answers);
  const r=spawnSync(process.execPath,// No --baseline-project-file: its local-repair scope check rejects re-sorting, a new Challenge
  // section and comments by design; the audit's own diff is checked by publish-project.
  ['scripts/booklet/check-feedback-pages.mjs','--project-file',candidateFile,'--blocks',ids.join(','),'--editions',answers,...(answers!=='student'?['--full-development-reason','Pedagogy audit v2 added or corrected practice answers; a short answer edition can be selected in full.']:[]),'--out',out],{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024,timeout:1800000});
  record.render={exitCode:r.status,seconds:Math.round((Date.now()-t0)/1000),out:rel(out),stdout:String(r.stdout).slice(-4000),stderr:String(r.stderr).slice(-4000)};
  write(path.join(runDir,'render.json'),record.render);
  if(r.status!==0)throw Error('Render check failed; see '+rel(path.join(runDir,'render.json')));
 }
 const dry=await publishProject({candidateFile,expectedRevision:live.revision,root});
 log('publish dry run: '+JSON.stringify(dry.diff).slice(0,400));
 const saved=await publishProject({candidateFile,expectedRevision:live.revision,apply:true,root,record:path.join(runDir,'publication.json'),ledger:path.join(root,'.booklet-work','pedagogy-audit-v2','publications.jsonl'),note:'pedagogy audit v2'});
 // Provenance: model, effort, usage and time per call, and the fingerprints now checked.
 const file=recordFile(projectId,{root}),prior=fs.existsSync(file)?read(file):{version:1,projectId,checks:{},types:{},exampleMatches:{},keep:[],runs:[]};
 const archive=path.join(path.dirname(file),'archive',projectId+'-v1-withdrawn-'+now().slice(0,10).replaceAll('-','')+'.json');
 if(report.withdrawnV1?.length)write(archive,{version:1,projectId,withdrawnAt:now(),reason:'Replaced by pedagogy audit v2',comments:report.withdrawnV1});
 const next={...prior,title:report.title,checkedRevision:saved.to,checks:{...prior.checks,...report.record.checks},types:{...prior.types,...report.record.types},exampleMatches:{...prior.exampleMatches,...report.record.exampleMatches},keep:report.record.keep??prior.keep,
  runs:[...(prior.runs??[]),{at:report.startedAt,run:rel(runDir),fromRevision:report.revision,toRevision:saved.to,model:MODEL,effort:EFFORT,elapsedSeconds:report.elapsedSeconds,totals:report.totals,calls:report.calls.map(({id,stage,attempt,model,effort,elapsedMs,usage,costUsd,ok})=>({id,stage,attempt,model,effort,elapsedMs,usage,costUsd,ok})),corrections:report.applied?.corrections??[],newQuestions:report.applied?.newQuestions??[],moves:report.moves,comments:report.comments.length,withdrawnV1:report.withdrawnV1?.length?rel(archive):null,applySeconds:Math.round((Date.now()-t0)/1000)}]};
 write(file,next);
 // Apply payloads for the comments just posted, keyed by comment id (read by apply-comments).
 if(report.proposals&&Object.keys(report.proposals).length){const pf=proposalsFile(projectId,{root}),prior=fs.existsSync(pf)?read(pf):{version:1,projectId,comments:{}};
  const liveIds=new Set((candidate.studio?.flags??[]).map(f=>f.id));
  const kept=Object.fromEntries(Object.entries(prior.comments??{}).filter(([id])=>liveIds.has(id)));
  for(const [id,entry]of Object.entries(report.proposals))kept[id]={...entry,run:rel(runDir),revision:saved.to};
  write(pf,{...prior,comments:kept});}
 return {projectId,revision:saved.to,render:record.render&&{exitCode:record.render.exitCode,seconds:record.render.seconds,out:record.render.out},provenance:rel(file),publication:rel(path.join(runDir,'publication.json'))};
}

export async function auditV2Main(args){
 const value=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];},flag=name=>args.includes(name);
 const id=value('--project');if(!id)throw Error('audit-v2 needs --project ID');
 if(args[0]==='apply-comments')return (await import('./audit-v2-apply.mjs')).applyCommentsMain(args.slice(1));
 if(flag('--apply'))return applyAuditV2({projectId:id,runDir:value('--run')&&path.resolve(value('--run'))});
 const {report,workDir}=await runAuditV2({projectFile:path.join(ROOT,'booklets','projects',id+'.json'),topics:(value('--topics')??'').split(',').filter(Boolean),dryRun:flag('--dry-run'),allowNonMaster:flag('--allow-non-master')});
 if(!workDir)return report;
 return {projectId:report.projectId,run:rel(workDir),elapsedSeconds:report.elapsedSeconds,totals:report.totals,applied:{moves:report.moves?.length??0,newQuestions:report.applied?.newQuestions?.length??0,corrections:report.applied?.corrections?.length??0,ratings:report.applied?.ratings?.length??0},comments:report.comments?.length??0,blockers:report.blockers,report:rel(path.join(workDir,'report.md'))};
}
