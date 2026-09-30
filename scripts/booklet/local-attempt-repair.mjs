// Review an exact field patch against a preserved attempt; no external generation.
import fs from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {contentNodes} from '../../src/lib/booklet-content-verification.js';
import {createSemanticTasks,runSemanticPackets,positive,validateSemanticResult} from './semantic-workflow.mjs';
import {planTaskAssignments,assignmentPayload} from './author-assignments.mjs';
import {withRunLock} from './run-observability.mjs';
import {recordAttempt} from './semantic-run-metrics.mjs';
import {materializeAuthorDiagrams,SHARED_DIAGRAM_FORMAT} from './shared-diagram-authoring.mjs';
import {bytesHash,fingerprint} from './workflow-review.mjs';
import {pointerParts,exactField} from './editorial-context.mjs';

const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const ref=file=>({path:path.resolve(file),hash:bytesHash(file)});
// These are author-created references into the editable structure. A reviewed
// reparenting may update them; original source facts and review approvals remain
// protected. Immutable generation and the exact patch record retain old values.
const reviewReferenceFields=new Set(['/sourceReview/presentationRequirements','/sourceReview/arrangements']);
const checkRef=artifact=>{
 if(!artifact?.path||!artifact.hash||bytesHash(artifact.path)!==artifact.hash)throw Error('Missing or changed repair evidence: '+artifact?.path);
};
function sourceAttempt(options,request){
 const page=positive(request.page,'Page'),fromAttempt=positive(request.fromAttempt,'Repair source attempt');
 const task=createSemanticTasks({...options,stage:'author',pages:[page]})[0];
 if(task.blockers.length)throw Error('Repair is blocked: '+task.blockers.join('; '));
 if(request.assignmentId){
  if(!/^assignment-[a-f0-9]{20}$/.test(request.assignmentId))throw Error('Invalid assignment identity');
  const root=path.join(task.packetRoot,'assignments',request.assignmentId),dir=path.join(root,String(fromAttempt)),input=path.join(dir,'task-input.json'),file=path.join(dir,'generation.json'),snapshot=read(input);
  const continuations=options.config.assignmentLimits?.continuations??options.manifest.continuations??[];
  // A noncontinued assignment on a continuation page still needs the full
  // neighbouring inventory while rebuilding the original ownership plan.
  // Its own payload/hash remains scoped to its immutable assigned pages.
  const planningPages=new Set(snapshot.assignment.pages);
  let expanded;
  do{expanded=false;for(const pair of continuations){const pages=Array.isArray(pair)?pair:[pair.from,pair.to];if(pages.some(p=>planningPages.has(p)))for(const p of pages)if(!planningPages.has(p)){planningPages.add(p);expanded=true;}}}while(expanded);
  const tasks=createSemanticTasks({...options,stage:'author',pages:[...planningPages]});
  const plan=planTaskAssignments(tasks,{...options.config.assignmentLimits,continuations:continuations.filter(pair=>(Array.isArray(pair)?pair:[pair.from,pair.to]).every(p=>planningPages.has(p)))});
  const assignment=plan.assignments.find(a=>a.id===request.assignmentId);
  if(!assignment||assignmentPayload(assignment,tasks).inputHash!==snapshot.inputHash)throw Error('Assignment source inputs changed');
  if(fs.existsSync(task.resultFile))throw Error('Published content uses repair-context');
  const generation=read(file),packet=generation.packets?.find(p=>p.pageNumber===page);
  if(!packet)throw Error('Assignment has no preserved packet for this page');
  return {task:{...task,inputHash:snapshot.inputHash,images:assignmentPayload(assignment,tasks).images,out:dir},packet,source:[ref(input),ref(file)],page,fromAttempt,assignment,tasks,generation,root};
 }
 const dir=path.join(task.packetRoot,`${task.stem}.author.${fromAttempt}`),input=path.join(dir,'task-input.json'),file=path.join(dir,'generation.json');
 if(read(input).inputHash!==task.inputHash)throw Error('Repair source inputs changed; review against current evidence before a new reconstruction');
 if(fs.existsSync(path.join(dir,'result.meta.json'))||fs.existsSync(task.resultFile))throw Error('Published content uses repair-context and the correction register; this command is for unpublished failed attempts');
 const packet=materializeAuthorDiagrams(read(file),{enabled:options.config.authoringFormat===SHARED_DIAGRAM_FORMAT});
 return {task,packet,source:[ref(input),ref(file)],page,fromAttempt};
}
function targetNode(packet,targetId,field){
 if(targetId==='$packet'){
  if(!['/inventoryMappings','/findings','/corrections'].includes(field))throw Error('Packet repair is limited to mappings, findings and correction proposals');
  return packet;
 }
 const node=contentNodes(packet).get(targetId)?.node;
 if(!node)throw Error('Missing repair target '+targetId);
 const key=pointerParts(field)[0];
 if(['id','sourceRefs','sourceAtom','sourceReview','sourceLayoutEvidence','provenance'].includes(key)&&!reviewReferenceFields.has(field))throw Error('Preserve identity and source evidence in local repairs');
 return node;
}
export function attemptRepairContext(options,request){
 const {task,packet,source,page,fromAttempt,assignment}=sourceAttempt(options,request);
 if(!Array.isArray(request.targets)||!request.targets.length)throw Error('Select exact target IDs and fields');
 const seen=new Set(),targets=[];
 for(const target of request.targets){
  if(!target.targetId||!Array.isArray(target.fields)||!target.fields.length)throw Error('Each repair target needs targetId and fields');
  for(const field of target.fields){
   const key=target.targetId+field;if(seen.has(key))throw Error('Duplicate repair target');seen.add(key);
   const node=targetNode(packet,target.targetId,field);
   targets.push({targetId:target.targetId,field,original:structuredClone(exactField(node,field))});
  }
 }
 const evidence=[...new Set([...task.images,path.join(task.packetRoot,`${task.stem}.inventory.json`),path.join(assignment?task.out:path.join(task.packetRoot,`${task.stem}.author.${fromAttempt}`),'prompt.md')])].map(ref);
 return {version:1,page,fromAttempt,...(assignment?{assignmentId:assignment.id}:{}),inputHash:task.inputHash,source,evidence,targets,
  instructions:'Read source images, independent inventory and taught methods. Return {context, patches:[{targetId,field,original,corrected,reason}],review:{reviewer,note,artifacts:[{path,hash}]}}. Patch every selected field only; preserve IDs and unrelated content. Full validation and publication checks still run. This context is not approval. Source corrections and ambiguous mathematics belong in the review register.'};
}
export function applyAttemptPatches(packet,context,patches){
 if(!Array.isArray(patches)||patches.length!==context.targets.length)throw Error('Repair must address exactly the selected fields');
 const expected=new Map(context.targets.map(t=>[t.targetId+t.field,t])),seen=new Set(),result=structuredClone(packet);
 for(const patch of patches){
  const key=patch.targetId+patch.field,target=expected.get(key);
  if(!target||seen.has(key)||!patch.reason?.trim()||!Object.hasOwn(patch,'corrected')||!isDeepStrictEqual(patch.original,target.original))throw Error('Invalid repair target, original or reason');
  seen.add(key);
  const node=targetNode(result,patch.targetId,patch.field);
  if(!isDeepStrictEqual(exactField(node,patch.field),patch.original))throw Error('Repair fields overlap or the original changed');
  const parts=pointerParts(patch.field),last=parts.pop();let parent=node;
  for(const part of parts)parent=parent[part];parent[last]=structuredClone(patch.corrected);
 }
 const ids=value=>{const rows=[];const walk=n=>{if(!n||typeof n!=='object')return;if(n.id)rows.push(n.id);for(const child of Object.values(n))walk(child);};walk(value.sections);return rows.sort();};
 if(!isDeepStrictEqual(ids(packet),ids(result)))throw Error('Local repair must preserve every content ID');
 for(const patch of patches.filter(p=>reviewReferenceFields.has(p.field))){
  if(!Array.isArray(patch.original)||!Array.isArray(patch.corrected))throw Error('Review reference repairs require arrays');
  const node=targetNode(result,patch.targetId,patch.field);
  if(patch.field.endsWith('/presentationRequirements')){
   const values=rows=>rows.map(({path,...rest})=>JSON.stringify(rest)).sort();
   if(!isDeepStrictEqual(values(patch.original),values(patch.corrected)))throw Error('Review reference repair must preserve every requirement value');
   for(const requirement of patch.corrected)if(!requirement.path?.startsWith('/')||!isDeepStrictEqual(exactField(node,requirement.path),requirement.value))throw Error('Repaired presentation reference must resolve to its unchanged required value');
  }else{
   const targets=rows=>rows.map(r=>r.targetId).sort();
   if(!isDeepStrictEqual(targets(patch.original),targets(patch.corrected)))throw Error('Arrangement reference repair must preserve every reviewed target');
   const nodes=contentNodes(result);
   for(const row of patch.corrected)if(!nodes.has(row.targetId)||(row.order??[]).some(id=>!nodes.has(id)))throw Error('Repaired arrangement reference does not resolve');
  }
 }
 return result;
}
export async function repairAttempt(options,record,{log=console.log}={}){
 const context=record.context,review=record.review;
 if(!context||!review?.reviewer?.trim()||!review.note?.trim()||!review.artifacts?.length)throw Error('Repair requires a named reviewer, note and current hashed evidence');
 const verify=()=>{
  for(const artifact of [...context.source,...context.evidence,...review.artifacts])checkRef(artifact);
  const current=attemptRepairContext(options,{page:context.page,fromAttempt:context.fromAttempt,assignmentId:context.assignmentId,targets:context.targets.map(t=>({targetId:t.targetId,fields:[t.field]}))});
  if(fingerprint(current)!==fingerprint(context))throw Error('Repair context changed; prepare and review a fresh context');
 };
 verify();
 if(positive(options.attempt,'New attempt')<=context.fromAttempt)throw Error('Use a newer immutable repair attempt');
 const source=sourceAttempt(options,context),{packet}=source,result=applyAttemptPatches(packet,context,record.patches);
 if(context.assignmentId){
  const {assignment,tasks,generation,root}=source;
  const packets=generation.packets.map(p=>p.pageNumber===context.page?result:p);
  for(const p of packets){const task=tasks.find(t=>t.page===p.pageNumber);validateSemanticResult(p,{...task,inventory:{...task.inventory,entries:assignment.entries.filter(e=>e.pageNumber===p.pageNumber)}});}
  const lock='assignment-'+assignment.id.slice(11).replace(/[0-9]/g,n=>String.fromCharCode(103+Number(n)));
  return withRunLock(options.runDir,lock,()=>{
   verify();const out=path.join(root,String(options.attempt));if(fs.existsSync(out))throw Error('Assignment repair attempt already exists');fs.mkdirSync(out);
   const events=recordAttempt(path.join(options.runDir,'semantic-packets'),{stage:'author',page:context.page,assignmentId:assignment.id,attempt:options.attempt,retryReason:'validation-repair'});
   events.phase('generation');const metrics={provider:'local-reviewed-repair',externalModelCalls:0,usage:null,elapsedMs:0};events.end({metrics});
   fs.writeFileSync(path.join(out,'local-repair.json'),JSON.stringify(record,null,2));
   fs.writeFileSync(path.join(out,'task-input.json'),JSON.stringify({inputHash:context.inputHash,assignment}));
   fs.writeFileSync(path.join(out,'prompt.md'),fs.readFileSync(path.join(root,String(context.fromAttempt),'prompt.md')));
   for(const name of ['generation.json','result.json'])fs.writeFileSync(path.join(out,name),JSON.stringify({packets},null,2));
   fs.writeFileSync(path.join(root,'accepted.json'),JSON.stringify({inputHash:context.inputHash,result:ref(path.join(out,'result.json'))}));
   events.finish({ok:true,metrics});return {ok:true,assignmentId:assignment.id,readyForAssembly:true,note:'Resume authoring with a newer page attempt; the repaired assignment is reused.'};
  });
 }
 return runSemanticPackets({...options,stage:'author',pages:[context.page],concurrency:1,retryReason:'validation-repair',pageReplay:true},{log,verifyPublication:verify,runner:async({out})=>{
  verify();fs.writeFileSync(path.join(out,'local-repair.json'),JSON.stringify(record,null,2)+'\n',{flag:'wx'});
  return {result,metrics:{provider:'local-reviewed-repair',externalModelCalls:0,usage:null,elapsedMs:0,repairFrom:context.fromAttempt}};
 }});
}
