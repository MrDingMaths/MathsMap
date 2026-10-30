import{resolveExerciseReferences,verifyExerciseReferenceResolution,renumberExerciseReferences,verifyReferenceNumberAdaptation,unresolvedPrintedQuestionReferences}from'./exercise-references.mjs';
// Node-only authoring planner. Never import from a renderer or run on project load.
// This proposes persistent whole-question order only; callers own revision-safe
// publication and actual pagination/visual checks. Layout pins are holds until a
// separate source-bound rendered exception is reviewed, never score exemptions.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {isPractice,logicalUnits} from '../src/lib/booklet-flow.js';
import {isTheoryReview} from '../src/lib/question-bank-eligibility.js';
import {questionReviewContent} from '../src/lib/booklet-review-profile.js';
import {verifiedRating,reasoningTaskHash} from '../scripts/booklet/reasoning-ratings.mjs';
import {reuseContentHash} from '../scripts/booklet/reuse-content.mjs';

export const scoreOrderFingerprint=project=>createHash('sha256').update(JSON.stringify(project)).digest('hex');
const walk=(value,visit)=>{if(Array.isArray(value))value.forEach(v=>walk(v,visit));else if(value&&typeof value==='object'){visit(value);for(const [key,v]of Object.entries(value))if(!['sourceReview','classification','spec','code','sourceAtom','sourceLayoutEvidence'].includes(key))walk(v,visit);}};
const nodes=block=>{const rows=[];walk(block,n=>{if(typeof n.id==='string')rows.push(n);});return rows;};
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const sameContent=(a,b)=>JSON.stringify(canonical(questionReviewContent(a)))===JSON.stringify(canonical(questionReviewContent(b)));
function owners(project){const result=new Map(),ambiguous=new Set();for(const s of project.sections??[])for(const b of s.blocks??[])for(const n of nodes(b)){if(result.has(n.id)&&result.get(n.id)!==b.id)ambiguous.add(n.id);else result.set(n.id,b.id);}return{result,ambiguous};}
export function exerciseRole(section,project={}){
 if(section.phase!=='practice'||section.role==='candidate-pool')return null;
 const title=[section.title,(project.topics??[]).find(t=>t.id===section.topicId)?.title].filter(Boolean).join(' ');
 if(section.role==='challenge'||/\bchallenge(?:\s+(?:exercise|questions))?\b/i.test(title))return 'challenge';
 if(section.role==='exam'||/^exam questions?$/i.test(section.title??''))return 'exam';
 if(['mixed-practice','mixed-review'].includes(section.role)||/\bmixed (?:practice|review)\b/i.test(title))return 'mixed-practice';
 if(['practice',undefined,null].includes(section.role))return 'ordinary';
 return null;
}
export function sortableQuestion(block,section){return isPractice(block)&&!isTheoryReview(block,section)&&!block.contrastGroup&&!block.flow?.contrastGroup&&!block.presentation?.contrastGroup&&!block.sourceReview?.contrastGroup;}
const asRefs=value=>Array.isArray(value)?value:typeof value==='string'?[value]:[];
const links=b=>nodes(b).flatMap(n=>[...asRefs(n.dependsOn),...asRefs(n.flow?.dependsOn),n.continuationOf,n.flow?.continuationOf,n.pairedBlockId].filter(x=>typeof x==='string'));
const crossQuestionReferences=unresolvedPrintedQuestionReferences;

// Optional current-content-checked context from recorded archetype reviews.
// Missing/stale recorded evidence is a hold, never invented teaching support.
function recordedMethodSnapshot(map,file,projectId,readJson){
 if(Object.hasOwn(map,'snapshot')){if(!map.snapshot)throw Error('review snapshot absent');return readJson(map.snapshot);}
 if(!/^[a-f0-9]{64}$/i.test(map.snapshotSha256??''))throw Error('review snapshot absent');
 const directory=path.resolve(path.dirname(file));
 const matching=candidate=>{
  const resolved=path.resolve(candidate);
  if(path.dirname(resolved)!==directory||path.extname(resolved)!=='.json')return null;
  const stat=fs.lstatSync(resolved);if(!stat.isFile()||stat.isSymbolicLink())return null;
  if(createHash('sha256').update(fs.readFileSync(resolved)).digest('hex')!==map.snapshotSha256.toLowerCase())return null;
  const snapshot=readJson(resolved);return snapshot.id===projectId?snapshot:null;
 };
 const preferred=map.metadataRatingProjection?.projectedSnapshot;
 if(preferred!==undefined){const snapshot=typeof preferred==='string'&&matching(preferred);if(!snapshot)throw Error('recorded projected snapshot differs');return snapshot;}
 for(const name of fs.readdirSync(directory)){if(!name.endsWith('.json'))continue;const snapshot=matching(path.join(directory,name));if(snapshot)return snapshot;}
 throw Error('review snapshot hash not found in map directory');
}
export function reviewedMethodSupport(project,{readJson=f=>JSON.parse(fs.readFileSync(f,'utf8')),referenceAdaptations=[]}={}){
 const cache=new Map(),edges=[],holds=[],currentBlocks=new Map((project.sections??[]).flatMap(s=>(s.blocks??[]).map(b=>[b.id,b]))),currentOwners=owners(project);
 // Only an explicit replay of the reference-number transformer can establish
 // reference-only equivalence; the current references must retain its targets.
 const adaptationCache=new Map();let currentReferences;
 const matchesReviewed=(current,reviewed)=>{
  if(sameContent(current,reviewed))return true;
  return Array.isArray(referenceAdaptations)&&referenceAdaptations.some(adaptation=>{
   try{
    let replay=adaptationCache.get(adaptation);
    if(!replay){try{
     const {before,ordered,candidate,proof}=adaptation;
     if(!before||!ordered||!candidate||!proof||[before,ordered,candidate].some(p=>p.id!==project.id))throw Error('Reference adaptation snapshots absent or wrong project');
     verifyReferenceNumberAdaptation(before,ordered,candidate,proof);
     replay={before:new Map(before.sections.flatMap(s=>s.blocks.map(b=>[b.id,b]))),candidate:new Map(candidate.sections.flatMap(s=>s.blocks.map(b=>[b.id,b]))),references:resolveExerciseReferences(candidate),changed:new Set(proof.edits.map(e=>e.ownerId))};
    }catch(error){replay={error};}adaptationCache.set(adaptation,replay);}
    if(replay.error||!replay.changed.has(current.id)||!replay.before.has(current.id)||!replay.candidate.has(current.id)||!sameContent(replay.before.get(current.id),reviewed)||!sameContent(replay.candidate.get(current.id),current))return false;
    currentReferences??=resolveExerciseReferences(project);
    const records=r=>r.records.filter(x=>x.ownerId===current.id),unresolved=r=>r.holds.some(x=>x.id===current.id),targets=[...new Set(records(replay.references).map(r=>r.targetId))];
    return !unresolved(replay.references)&&!unresolved(currentReferences)&&targets.every(id=>currentBlocks.has(id)&&replay.candidate.has(id)&&sameContent(currentBlocks.get(id),replay.candidate.get(id)))&&JSON.stringify(canonical(records(replay.references)))===JSON.stringify(canonical(records(currentReferences)));
   }catch{return false;}
  });
 };
 for(const b of currentBlocks.values()){
  const file=b.classification?.archetypeReview?.mapFile;if(!file)continue;
  try{
   let record=cache.get(file);if(!record){try{const map=readJson(file);if(map.projectId!==project.id)throw Error('review project differs');const snapshot=recordedMethodSnapshot(map,file,project.id,readJson);if(snapshot.id!==project.id)throw Error('snapshot project differs');record={map,snapshot,blocks:new Map(snapshot.sections.flatMap(s=>s.blocks.map(b=>[b.id,b]))),owners:owners(snapshot)};}catch(error){record={error};}cache.set(file,record);}if(record.error)throw record.error;
   const q=record.map.questions?.[b.id],cluster=record.map.topics?.find(t=>t.topicId===q?.topicId)?.clusters?.find(c=>c.id===q?.archetype);if(!q||!cluster||!record.blocks.has(b.id)||!matchesReviewed(b,record.blocks.get(b.id)))throw Error('reviewed question changed or absent');
   const clusters=record.map.topics.find(t=>t.topicId===q.topicId).clusters.filter(c=>new Set([q.archetype,...(q.practiceItems??[]).map(i=>i.archetype).filter(Boolean)]).has(c.id));
   for(const anchor of [...new Set(clusters.flatMap(c=>[...(c.teachingIds??[]),...(c.exampleIds??[]),...(c.guidedPracticeIds??[]),...(c.practiceEvidenceIds??[])]))]){
    const owner=currentOwners.result.get(anchor),priorOwner=record.owners.result.get(anchor);if(!owner||owner!==priorOwner||currentOwners.ambiguous.has(anchor)||!record.blocks.has(owner)||!matchesReviewed(currentBlocks.get(owner),record.blocks.get(owner)))throw Error('reviewed method anchor changed or absent: '+anchor);
    if(owner!==b.id)edges.push({before:owner,after:b.id,kind:'reviewed-method-support',evidence:file,anchor});
   }
  }catch(error){holds.push({id:b.id,kind:'review-context-unverified',reason:error.message,evidence:file});}
 }
 return{edges,holds};
}

const fileSha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
// Legacy completed lean reviews may omit mathematicsReviewed. Only numeric
// verdict discovery accepts absence; acceptedRatingReuse still requires the
// exact passed mathematical snapshot and a different retained reviewer job.
function reviewVerdicts(file,cache){const key=file+':rating-verdicts';if(cache.has(key))return cache.get(key);const found=[],calls=path.join(path.dirname(file),'calls');try{for(const name of fs.readdirSync(calls)){if(!name.startsWith('content-'))continue;const raw=path.join(calls,name,'last-message.txt'),eventsFile=path.join(calls,name,'events.jsonl');if(!fs.existsSync(raw)||!fs.existsSync(eventsFile))continue;try{const result=JSON.parse(fs.readFileSync(raw,'utf8')),events=fs.readFileSync(eventsFile,'utf8').trim().split('\n').map(JSON.parse),thread=events.find(e=>e.type==='thread.started')?.thread_id;if(result.reviewer!=='independent-content-reviewer'||!thread||!events.some(e=>e.type==='turn.completed'))continue;for(const verdict of result.records??[])if(verdict.outcome==='passed'&&verdict.classificationVerified!==false&&(verdict.mathematicsReviewed===true||verdict.mathematicsReviewed===undefined)&&Number.isInteger(verdict.reasoningScore)&&verdict.difficultyReason?.trim())found.push({verdict,file:raw,sha256:fileSha(raw),eventsFile,eventsSha256:fileSha(eventsFile),reviewerThreadId:thread});}catch{}}}catch{}cache.set(key,found);return found;}
function acceptedRatingReuse(block,proof,cache=new Map()){
 try{if(proof.id!==block.id||proof.taskHash!==reasoningTaskHash(block)||proof.kind!=='accepted-source-reviewed-reuse')return false;let record=cache.get(proof.file);if(!record){record={sha256:fileSha(proof.file),value:JSON.parse(fs.readFileSync(proof.file,'utf8'))};cache.set(proof.file,record);}if(record.sha256!==proof.sha256||record.value.route!=='lean-review-v1')return false;const row=record.value.questions?.[block.id],accepted=row?.acceptedVersion,snapshot=accepted?.snapshot;if(row?.outcome!=='passed'||accepted?.outcome!=='passed'||!snapshot||accepted.mathematicalHash!==reuseContentHash(snapshot)||!verifiedRating(snapshot)||reasoningTaskHash(snapshot)!==reasoningTaskHash(block))return false;if(JSON.stringify(snapshot.classification.assessment)!==JSON.stringify(block.classification.assessment)||snapshot.classification.reasoningScore!==block.classification.reasoningScore||snapshot.classification.difficultyReason!==block.classification.difficultyReason||Date.parse(accepted.at)<Date.parse(block.classification.assessment.assessedAt))return false;const raw=proof.ratingVerdict,match=reviewVerdicts(proof.file,cache).find(r=>r.file===raw?.file&&r.sha256===raw.sha256&&r.eventsSha256===raw.eventsSha256&&r.reviewerThreadId===raw.reviewerThreadId&&r.verdict.id===block.id&&r.verdict.reasoningScore===block.classification.reasoningScore&&String(r.verdict.note??'').slice(0,600)===String(accepted.note??''));if(!match)return false;const authorEvents=path.join(path.dirname(block.classification.assessment.evidence),'events.jsonl');if(!fs.existsSync(authorEvents)||fileSha(authorEvents)!==raw.authorEventsSha256)return false;const authorThread=fs.readFileSync(authorEvents,'utf8').trim().split('\n').map(JSON.parse).find(e=>e.type==='thread.started')?.thread_id;return !!authorThread&&authorThread===raw.authorThreadId&&authorThread!==raw.reviewerThreadId;}catch{return false;}
}
// Optional historical independent-review receipts remain strictly validated
// when supplied. Their absence does not invalidate an existing task-bound
// rating or require a repeat assessment of unchanged/mechanical content.
export function acceptedSourceRatingReuses(project){const proofs=[],cache=new Map();for(const b of (project.sections??[]).flatMap(s=>s.blocks??[])){if(!verifiedRating(b))continue;const source=b.classification.assessment.evidence,marker=source.search(/[\\/]semantic-packets[\\/]/);if(marker<0)continue;const file=path.join(source.slice(0,marker),'lean-review','reviewed.json');try{const state=JSON.parse(fs.readFileSync(file,'utf8')),accepted=state.questions?.[b.id]?.acceptedVersion,raw=reviewVerdicts(file,cache).find(r=>r.verdict.id===b.id&&r.verdict.reasoningScore===b.classification.reasoningScore&&String(r.verdict.note??'').slice(0,600)===String(accepted?.note??''));if(!raw)continue;const authorEvents=path.join(path.dirname(source),'events.jsonl'),authorThreadId=fs.readFileSync(authorEvents,'utf8').trim().split('\n').map(JSON.parse).find(e=>e.type==='thread.started')?.thread_id,proof={id:b.id,taskHash:reasoningTaskHash(b),kind:'accepted-source-reviewed-reuse',file,sha256:cache.get(file)?.sha256??fileSha(file),ratingVerdict:{file:raw.file,sha256:raw.sha256,eventsFile:raw.eventsFile,eventsSha256:raw.eventsSha256,reviewerThreadId:raw.reviewerThreadId,authorEventsFile:authorEvents,authorEventsSha256:fileSha(authorEvents),authorThreadId}};if(acceptedRatingReuse(b,proof,cache))proofs.push(proof);}catch{}}return proofs;}

export function planScoreOrder(project,{supportEdges=[],contextHolds=[],semanticUnits=[],ratingReuses=[],referenceResolution=null}={}){
 const pinnedSupport=structuredClone({supportEdges,contextHolds,semanticUnits,ratingReuses,...(referenceResolution?{referenceResolution}:{})});if(referenceResolution){verifyExerciseReferenceResolution(project,referenceResolution);contextHolds=[...contextHolds,...referenceResolution.holds];semanticUnits=[...semanticUnits,...referenceResolution.groups];}const globalReferenceHolds=!referenceResolution?(project.sections??[]).flatMap(section=>(section.blocks??[]).flatMap(block=>unresolvedPrintedQuestionReferences(block,project).map(text=>({id:block.id,kind:'project-unresolved-printed-reference',text})))):referenceResolution.holds;const fingerprint=scoreOrderFingerprint(project),index=owners(project),allBlocks=new Map((project.sections??[]).flatMap(s=>(s.blocks??[]).map(b=>[b.id,b]))),absolute=new Map((project.sections??[]).flatMap(s=>(s.blocks??[]).map(b=>b.id)).map((id,i)=>[id,i])),edges=[...supportEdges];
 for(const b of allBlocks.values()){
  const anchors=[b.sourceReview?.routineBackfill?.sourceOrderAnchor,...(b.sourceReview?.routineBackfill?.taughtEvidenceIds??[]),...(b.sourceReview?.generation?.taughtEvidenceIds??[])].filter(x=>typeof x==='string');
  for(const anchor of anchors){const owner=index.result.get(anchor);if(owner&&owner!==b.id)edges.push({before:owner,after:b.id,kind:'explicit-method-support',anchor});else if(!owner)contextHolds=[...contextHolds,{id:b.id,kind:'unresolved-method-anchor',anchor}];}
 }
 const ratingCache=new Map(),sections=[];
 for(const section of project.sections??[]){
  const role=exerciseRole(section,project);if(!role)continue;const blocks=section.blocks??[],segments=[],barriers=blocks.filter(b=>!sortableQuestion(b,section)).map(b=>b.id),layoutRows=logicalUnits(project,section).filter(u=>u.studentRowGroup).map(u=>u.blocks.map(b=>b.id));let run=[];
  const finish=()=>{if(!run.length)return;const rows=run;run=[];const ids=rows.map(b=>b.id),idSet=new Set(ids),holds=globalReferenceHolds.map(h=>({...h})),parent=new Map(ids.map(id=>[id,id])),root=id=>parent.get(id)===id?id:(parent.set(id,root(parent.get(id))),parent.get(id)),union=(a,b)=>parent.set(root(b),root(a));
   for(const b of rows){if(!verifiedRating(b))holds.push({id:b.id,kind:'rating-unverified'});else if(ratingReuses.some(p=>p.id===b.id&&!acceptedRatingReuse(b,p,ratingCache)))holds.push({id:b.id,kind:'rating-reuse-proof-invalid',evidence:b.classification.assessment.evidence});const refs=crossQuestionReferences(b,project);if(refs.length&&!referenceResolution)holds.push({id:b.id,kind:'printed-reference',references:refs});for(const h of contextHolds.filter(h=>h.id===b.id))holds.push(h);
    for(const ref of links(b)){const owner=index.result.get(ref);if(!owner||index.ambiguous.has(ref))holds.push({id:b.id,kind:'unresolved-dependency',ref});else if(owner!==b.id){if(idSet.has(owner))union(owner,b.id);else if(!absolute.has(owner)||absolute.get(owner)>=absolute.get(b.id))holds.push({id:b.id,kind:'dependency-outside-sort-segment',ref,owner});}}
   }
   for(const unit of semanticUnits.filter(u=>u.ids?.some(id=>idSet.has(id)))){if(!unit.reason?.trim()||!unit.evidence?.trim()||unit.ids.length<2||unit.ids.some(id=>!idSet.has(id))){holds.push({ids:unit.ids,kind:'semantic-unit-proof-or-scope-missing'});continue;}for(const id of unit.ids.slice(1))union(unit.ids[0],id);}
   const units=[];for(const b of rows){const key=root(b.id);let unit=units.find(u=>u.id===key);if(!unit){unit={id:key,ids:[],scores:[],sourceIndex:ids.indexOf(b.id)};units.push(unit);}unit.ids.push(b.id);unit.scores.push(b.classification?.reasoningScore);}
   for(const u of units){u.difficultyKey=Math.max(...u.scores.filter(Number.isFinite));const positions=u.ids.map(id=>ids.indexOf(id));if(positions.some((p,i)=>i&&p!==positions[i-1]+1))holds.push({ids:u.ids,kind:'noncontiguous-semantic-unit'});}
   for(let i=0;i<rows.length;i++)if(rows[i].flow?.keepWithNext&&i+1<rows.length&&root(rows[i].id)!==root(rows[i+1].id))holds.push({ids:[rows[i].id,rows[i+1].id],kind:'layout-pin-needs-pagination-evidence'});
   for(const row of layoutRows)if(row.some(id=>idSet.has(id))&&new Set(row.map(id=>parent.has(id)?root(id):id)).size>1)holds.push({ids:row,kind:'layout-row-needs-pagination-evidence'});
   const sorted=units.slice().sort((a,b)=>a.difficultyKey-b.difficultyKey||a.sourceIndex-b.sourceIndex),proposedIds=sorted.flatMap(u=>u.ids),newPos=new Map(proposedIds.map((id,i)=>[id,i]));
   for(const e of edges.filter(e=>idSet.has(e.after))){if(!allBlocks.has(e.before))holds.push({...e,kind:'unresolved-context-edge'});else if(idSet.has(e.before)){if(newPos.get(e.before)>=newPos.get(e.after))holds.push({...e,kind:'method-support-order'});}else if(absolute.get(e.before)>=absolute.get(e.after))holds.push({...e,kind:'method-support-context-uncertain'});}
   const changed=ids.some((id,i)=>id!==proposedIds[i]),status=holds.length?'held':changed?'unsorted':'already-ordered';segments.push({originalIds:ids,proposedIds,status,changed:changed&&!holds.length,units:units.map(({id,ids,difficultyKey})=>({id,ids,difficultyKey})),holds});
  };
  for(const b of blocks){if(sortableQuestion(b,section))run.push(b);else finish();}finish();const byFirst=new Map(segments.filter(s=>s.changed).map(s=>[s.originalIds[0],s])),skip=new Set();const plannedIds=[];for(const b of blocks){if(skip.has(b.id))continue;const s=byFirst.get(b.id);if(s){plannedIds.push(...s.proposedIds);s.originalIds.slice(1).forEach(id=>skip.add(id));}else plannedIds.push(b.id);}
  sections.push({sectionId:section.id,role,originalIds:blocks.map(b=>b.id),plannedIds,barriers,segments,status:!segments.length?'protected-only':segments.some(s=>s.status==='held')?'held':segments.some(s=>s.changed)?'unsorted':'already-ordered',changed:segments.some(s=>s.changed)});
 }
 const plan={version:1,projectId:project.id,revision:project.revision,sourceFingerprint:fingerprint,pinnedSupport,unitDifficultyKey:'maximum of existing current verified member scores; no new rating',sections,changedSections:sections.filter(s=>s.changed).map(s=>s.sectionId),holds:sections.flatMap(s=>s.segments.flatMap(g=>g.holds.map(h=>({sectionId:s.sectionId,...h})))),paginationExceptionsApplied:[],publicationReady:false};return{...plan,planDigest:createHash('sha256').update(JSON.stringify(plan)).digest('hex')};
}
export function scoreOrderCandidate(project,plan,{includeReferenceProof=false}={}){if(plan.projectId!==project.id||plan.revision!==project.revision||plan.sourceFingerprint!==scoreOrderFingerprint(project))throw Error('Stale score-order plan');const {planDigest,...body}=plan;if(planDigest!==createHash('sha256').update(JSON.stringify(body)).digest('hex'))throw Error('Score-order plan was modified');const recomputed=planScoreOrder(project,plan.pinnedSupport);if(JSON.stringify(recomputed)!==JSON.stringify(plan))throw Error('Score-order plan differs from recomputed safety proof');const candidate=structuredClone(project);for(const row of plan.sections){const s=candidate.sections.find(s=>s.id===row.sectionId);if(JSON.stringify(s.blocks.map(b=>b.id))!==JSON.stringify(row.originalIds))throw Error('Section order changed');const original=new Map(s.blocks.map(b=>[b.id,b]));if(row.plannedIds.length!==original.size||new Set(row.plannedIds).size!==original.size||row.plannedIds.some(id=>!original.has(id)))throw Error('Invalid planned whole-question permutation');s.blocks=row.plannedIds.map(id=>original.get(id));}if(plan.pinnedSupport.referenceResolution){const adapted=renumberExerciseReferences(project,candidate,plan.pinnedSupport.referenceResolution);return includeReferenceProof?{candidate:adapted.candidate,referenceProof:adapted.proof}:adapted.candidate;}return includeReferenceProof?{candidate,referenceProof:null}:candidate;}

export function scoreOrderMain(args=process.argv.slice(2)){
 const options={};for(let i=0;i<args.length;i+=2){const key=args[i];if(!['--candidate','--out','--report'].includes(key)||!args[i+1]||options[key])throw Error('Use --candidate FILE --out FILE --report FILE (each once)');options[key]=args[i+1];}for(const key of['--candidate','--out','--report'])if(!options[key])throw Error('Missing '+key);
 const source=path.resolve(options['--candidate']),out=path.resolve(options['--out']),reportFile=path.resolve(options['--report']);if(new Set([source,out,reportFile]).size!==3)throw Error('Input, candidate output and report must be different files');const allowed=[path.resolve('.booklet-work'),path.resolve(os.tmpdir())];for(const file of[out,reportFile]){if(!allowed.some(root=>file.startsWith(root+path.sep)))throw Error('Output must stay in a run folder or temporary directory; live project writes are forbidden');if(fs.existsSync(file))throw Error('Refuse to overwrite retained output '+file);let ancestor=path.dirname(file);while(!fs.existsSync(ancestor)){const parent=path.dirname(ancestor);if(parent===ancestor)throw Error('No output ancestor');ancestor=parent;}const real=fs.realpathSync(ancestor);if(!allowed.some(root=>real===root||real.startsWith(root+path.sep)))throw Error('Output ancestor escapes permitted run/temporary directory');}
 const bytes=fs.readFileSync(source),project=JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/,''));if(!Array.isArray(project.sections))throw Error('Candidate must be a booklet project');const support=reviewedMethodSupport(project),ratingReuses=acceptedSourceRatingReuses(project),referenceResolution=resolveExerciseReferences(project),plan=planScoreOrder(project,{supportEdges:support.edges,contextHolds:support.holds,ratingReuses,referenceResolution}),adapted=scoreOrderCandidate(project,plan,{includeReferenceProof:true}),candidate=adapted.candidate,record={...plan,referenceNumberAdaptation:adapted.referenceProof,referenceRatingsRequireExistingAssessmentReuse:!!adapted.referenceProof?.oldNewTaskHashes.length,sourceFile:source,sourceSha256:createHash('sha256').update(bytes).digest('hex'),candidateFile:out,candidateSha256:createHash('sha256').update(JSON.stringify(candidate,null,2)+'\n').digest('hex'),independentAcceptedRatingReuses:ratingReuses.length,liveWrites:0};for(const file of[out,reportFile])fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(out,JSON.stringify(candidate,null,2)+'\n',{flag:'wx'});fs.writeFileSync(reportFile,JSON.stringify(record,null,2)+'\n',{flag:'wx'});return{projectId:project.id,revision:project.revision,changedSections:plan.changedSections,holds:plan.holds.length,out,report:reportFile,liveWrites:0};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))try{console.log(JSON.stringify(scoreOrderMain()));}catch(error){console.error(error.message);process.exitCode=1;}
