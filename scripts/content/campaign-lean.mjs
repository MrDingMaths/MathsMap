import fs from 'node:fs';
import { capturePair, assessmentItems, readCampaign, readSkill, hashValue, nextAssignment, prepareAssignment, recordPrerequisiteContextRead, stageAssignment, recordReview, publishAssignment, requirePrepared, validateReviewStructure, validateVisualReviewStructure, normalizeReviewFindings } from './campaign-support.mjs';
import { inside, readJson, taxonomyAt, scopeDependencies } from './campaign-sources.mjs';
import { normalizeWorkerResult } from './campaign-runner.mjs';
import { checkWorkerIndependence, validateWorkerProvenance } from './campaign-lineage.mjs';
import { shadingCandidates } from '../../src/lib/diagram-shading.js';
import { assignmentExecutionProfile, futureExecutionProfile } from './campaign-execution-profile.mjs';

export const LEAN_PROFILE = 'lazy-campaign-delta-v1';
const requireProfile = value => { if (value !== LEAN_PROFILE) throw new Error('Explicit lean profile required'); };
const text = value => typeof value === 'string' && value.trim().length > 0;
const equal = (a,b) => hashValue(a) === hashValue(b);
function ready(root, campaign, state, taxonomy) {
  if (state.owner || !['pending','repair-needed'].includes(state.status)) return false;
  const skill = taxonomy.skills.find(row => row.id === state.skillId);
  if (!skill) throw new Error('Unknown taxonomy skill');
  // Deliberately do not restrict this check to the proposed batch/filter.
  return (skill.prereqs || []).every(id => campaign.skillIds.includes(id)
    ? readSkill(root,campaign.campaignId || campaign.id,id).status === 'published'
    : fs.existsSync(inside(root,'public/content/' + id + '.json')));
}
function binding(root,campaignId,state,taxonomy) {
  const refs = state.sources || [], skill = taxonomy.skills.find(row => row.id === state.skillId);
  return { skillId:state.skillId, status:state.status, baseline:state.baseline,
    currentPair:capturePair(root,state.skillId).expected,
    stateHash:hashValue(state), dependencyHash:scopeDependencies(root,state.skillId,state.scope,refs,{taxonomy}).hash,
    parents:(skill.prereqs || []).map(id=>({id, pair:capturePair(root,id).expected,
      status:readCampaign(root,campaignId).skillIds.includes(id) ? readSkill(root,campaignId,id).status : 'outside-campaign'})) };
}
/** Read-only advisory grouping. No ownership, source acceptance or preparation. */
export function planBatch(root,{campaignId,profile,ids=null,size=8,minimumSize=1}={}) {
  requireProfile(profile);
  if (!Number.isInteger(size) || size < 1 || size > 8) throw new Error('Batch size must be 1–8');
  if (!Number.isInteger(minimumSize) || minimumSize < 1 || minimumSize > size) throw new Error('Minimum batch size must be 1–size');
  const campaign = readCampaign(root,campaignId), taxonomy=taxonomyAt(root);
  const selected = ids || campaign.skillIds;
  if (!Array.isArray(selected) || new Set(selected).size !== selected.length || selected.some(id=>!campaign.skillIds.includes(id))) throw new Error('Invalid frozen campaign filter');
  // Campaign IDs are supplied explicitly rather than inferred from historical schemas.
  const context={...campaign,campaignId}, groups=new Map(), skipped=[];
  for (const id of selected) {
    const state=readSkill(root,campaignId,id);
    if (!ready(root,context,state,taxonomy)) { skipped.push({skillId:id,reason:'owned, not author-ready, or prerequisite not published'}); continue; }
    const source=(state.sources || []).find(ref=>/\.md$/i.test(ref.path) && !/syllabus/i.test(ref.path));
    if (!source || !state.scope?.topicId) { skipped.push({skillId:id,reason:'no shared booklet/topic binding'}); continue; }
    const section={topicId:state.scope.topicId,stage:state.scope.stage,path:source.path};
    const key=hashValue(section); if(!groups.has(key))groups.set(key,{section,members:[]});
    groups.get(key).members.push(binding(root,campaignId,state,taxonomy));
  }
  const batches=[];
  for(const {section,members} of groups.values()) {
    while(members.length>=minimumSize) {
      // Avoid a stranded 1–3 remainder where two valid groups are possible.
      const remainderCount=members.length-minimumSize;
      const count=members.length>size && members.length-size<minimumSize && remainderCount>=minimumSize && remainderCount<=size ? remainderCount : Math.min(size,members.length);
      const batch={profile,campaignId,section,minimumSize,executionProfile:futureExecutionProfile(campaign),members:members.splice(0,count)};
      batches.push({...batch,hash:hashValue(batch)});
    }
    skipped.push(...members.map(row=>({skillId:row.skillId,reason:'fewer than configured minimum related ready skills'})));
  }
  return {profile,campaignId,batches,skipped,ownershipAcquired:false};
}
/** Lazy consumption skips a stale immutable manifest instead of refreshing its bindings. */
export function checkBatch(root,manifest) {
  requireProfile(manifest?.profile);
  const {hash,...body}=manifest;
  // Historical manifests retain the original four-skill minimum.
  const minimumSize=body.minimumSize ?? 4;
  if(!equal(hash,hashValue(body)) || !Number.isInteger(minimumSize) || minimumSize<1 || minimumSize>8 || !Array.isArray(body.members) || body.members.length<minimumSize || body.members.length>8 || new Set(body.members.map(row=>row.skillId)).size!==body.members.length) throw new Error('Malformed batch manifest');
  const campaign=readCampaign(root,body.campaignId), taxonomy=taxonomyAt(root), reasons=[], members=[];
  const profileChanged=!equal(body.executionProfile,futureExecutionProfile(campaign));
  for(const row of body.members) {
    try {
      const state=readSkill(root,body.campaignId,row.skillId);
      const source=(state.sources || []).find(ref=>/\.md$/i.test(ref.path) && !/syllabus/i.test(ref.path));
      const section=source && {topicId:state.scope.topicId,stage:state.scope.stage,path:source.path};
      const usable=!profileChanged && equal(section,body.section) && ready(root,{...campaign,campaignId:body.campaignId},state,taxonomy) && equal(row,binding(root,body.campaignId,state,taxonomy));
      members.push({skillId:row.skillId,usable});
      if(!usable)reasons.push(row.skillId + ': stale or no longer ready');
    } catch(error) { members.push({skillId:row.skillId,usable:false}); reasons.push(row.skillId + ': ' + error.message); }
  }
  return {usable:members.some(row=>row.usable),skip:members.every(row=>!row.usable),members,reasons,ownershipAcquired:false};
}
export function claimBatchMember(root,manifest,{skillId,workerId,actorId}={}) {
  requireProfile(manifest?.profile);
  const {hash,...body}=manifest;
  if(hash!==hashValue(body))throw new Error('Malformed batch manifest');
  if(!manifest?.members?.some(row=>row.skillId===skillId))throw new Error('Skill outside batch');
  return nextAssignment(root,{campaignId:manifest.campaignId,workerId,role:'author',ids:[skillId],
    workerLineage:{kind:'native',actorId},claimGuard:()=>{
      // Resume only through nextAssignment's captured lineage/ownership gates.
      // A held assignment naturally differs from its pre-claim plan binding.
      const state=readSkill(root,manifest.campaignId,skillId);
      if(state.owner?.workerId===workerId && state.owner.role==='author')return null;
      const current=checkBatch(root,manifest);
      return !current.members.find(row=>row.skillId===skillId)?.usable ? 'Skip stale batch member: ' + current.reasons.join('; ') : null;
    }});
}
export function receiptBinding(root,state) {
  const owner=state.owner;
  if(!owner?.prepared || owner.workerLineage?.kind!=='native') throw new Error('Prepared owned native assignment required');
  if(owner.role==='review')checkWorkerIndependence(state,owner.workerLineage);
  requirePrepared(root,state,owner.role);
  const prepared=owner.prepared;
  if(scopeDependencies(root,state.skillId,state.scope,prepared.sources).hash!==prepared.dependencyHash)throw new Error('Stale prepared dependencies');
  const live=capturePair(root,state.skillId);
  if(!equal(live.expected,prepared.expected))throw new Error('Stale live baseline');
  const snapshot=readJson(inside(root,prepared.snapshotPath));
  const stagedSnapshot=owner.role==='review' || (state.status==='repair-needed' && state.stage);
  if(stagedSnapshot && hashValue({content:snapshot.content,quiz:snapshot.quiz})!==state.stage.candidateHash)throw new Error('Stale staged snapshot');
  if(!stagedSnapshot && !equal({content:snapshot.content,quiz:snapshot.quiz},{content:live.content,quiz:live.quiz}))throw new Error('Altered author snapshot');
  if(stagedSnapshot) {
    const candidate=readJson(inside(root,state.stage.candidatePath));
    if(hashValue({content:candidate.content,quiz:candidate.quiz})!==state.stage.candidateHash)throw new Error('Altered staged candidate');
  }
  return {skillId:state.skillId,assignmentId:owner.assignmentId,workerId:owner.workerId,workerLineage:owner.workerLineage,
    executionProfile:assignmentExecutionProfile(state),snapshotHash:hashValue(snapshot),dependencyHash:prepared.dependencyHash,stageHash:state.stage?.hash || null};
}
function owned(root,state,input,role) {
  requireProfile(input?.profile);
  if(state.owner?.role!==role || !equal(input.binding,receiptBinding(root,state)))throw new Error('Changed assignment/actor/profile/evidence binding');
  validateWorkerProvenance(state,{role,workerId:state.owner.workerId,metrics:input.result?.metrics,profile:input.result?.[role==='review'?'reviewerProfile':'authorProfile']});
}
function unique(rows,label) { if(!Array.isArray(rows) || new Set(rows.map(row=>row.where)).size!==rows.length)throw new Error('Missing/duplicate ' + label); }
/** Explicit guarded JSON pointer edits. No generated teaching or mathematical values. */
export function expandAuthorDelta(root,state,input) {
  owned(root,state,input,'author');
  const pair=structuredClone(readJson(inside(root,state.owner.prepared.snapshotPath)));
  const seen=new Set();
  for(const edit of input.edits || []) {
    const operation=edit.operation || 'replace';
    if(!/^\/(content|quiz)\//.test(edit.path || '') || seen.has(edit.path) || !['add','replace','remove'].includes(operation) || (operation!=='remove' && !Object.hasOwn(edit,'value')))throw new Error('Invalid/duplicate edit pointer');
    seen.add(edit.path);
    const keys=edit.path.slice(1).split('/').map(key=>key.replace(/~1/g,'/').replace(/~0/g,'~'));
    if(keys.some(key=>['__proto__','prototype','constructor'].includes(key) || /~/.test(key)))throw new Error('Unsafe pointer');
    let target=pair;
    const arrayKey=(target,key)=>{
      if(Array.isArray(target) && (!/^(0|[1-9]\d*)$/.test(key) || !Number.isSafeInteger(Number(key)) || Number(key)>=target.length))throw new Error('Array edits require an existing canonical numeric index; replace whole arrays for structural changes');
    };
    for(const key of keys.slice(0,-1)) { arrayKey(target,key); if(!target || !Object.hasOwn(target,key))throw new Error('Replace target missing'); target=target[key]; }
    const key=keys.at(-1);
    arrayKey(target,key);
    if(!target || typeof target!=='object')throw new Error('Edit target missing');
    if(operation==='add') {
      if(Array.isArray(target) || Object.hasOwn(target,key) || edit.beforeAbsent!==true)throw new Error('Add requires an explicitly absent object property; replace whole arrays');
      target[key]=structuredClone(edit.value);
    } else {
      if(!Object.hasOwn(target,key) || !Object.hasOwn(edit,'before') || !equal(target[key],edit.before))throw new Error('Edit before-value mismatch');
      if(operation==='remove') {
        if(Array.isArray(target))throw new Error('Replace whole arrays for deletions/reorders');
        delete target[key];
      } else target[key]=structuredClone(edit.value);
    }
  }
  if(!input.result || Object.hasOwn(input.result,'candidateContent') || Object.hasOwn(input.result,'candidateQuiz'))throw new Error('Supply decisions separately from candidate pair');
  const items=assessmentItems(pair.content,pair.quiz,false);
  if(input.derivations!==undefined) {
    unique(input.derivations,'author derivations');
    if(input.derivations.some(row=>!items.some(item=>item.where===row.where) || !text(row.working)))throw new Error('Invalid supplied author derivation');
  }
  unique(input.result.coverage?.items,'method mappings');
  if(input.result.coverage.items.length!==items.length || items.some(item=>!input.result.coverage.items.some(row=>row.where===item.where && row.audited===true && Array.isArray(row.methods) && row.methods.length)))throw new Error('Explicit audited method mapping required for every whole item');
  const result=normalizeWorkerResult(root,state,{...input.result,candidateContent:pair.content,candidateQuiz:pair.quiz});
  return {profile:LEAN_PROFILE,binding:input.binding,result,...(input.derivations===undefined?{}:{derivations:structuredClone(input.derivations)}),receiptStructureOnly:true};
}
/** Structural preflight only. Existing normal ledger remains the acceptance authority. */
export function preflightReview(root,state,input) {
  owned(root,state,input,'review');
  const result=normalizeWorkerResult(root,state,input.result), candidate=readJson(inside(root,state.stage.candidatePath));
  result.findings=normalizeReviewFindings(result.findings);
  const reviewSessions=result.metrics?.sessions?.map(session=>typeof session==='string'?session:session.sessionId).filter(Boolean) || [result.metrics?.sessionId];
  if(state.stage.author===state.owner.workerId || reviewSessions.some(session=>session && [state.stage.authorSessionId,...(state.stage.authorSessionIds || [])].includes(session)))throw new Error('Review must use a different worker/session from author');
  const items=assessmentItems(candidate.content,candidate.quiz,false);
  unique(result.outcomes,'review outcomes');
  const contextChecked=result.contextRevalidation ? validateReviewStructure(root,state,result) : null;
  const completeOutcomes=contextChecked?.outcomes || result.outcomes;
  // Complete explicit receipts initially; scoped legacy reuse stays in the normal ledger.
  if(completeOutcomes.length!==items.length)throw new Error('Every whole outcome required');
  for(const item of items) {
    const row=completeOutcomes.find(row=>row.where===item.where);
    if(!row || !['accepted','repair','unresolved'].includes(row.verdict) || !text(row.independentSolution) || !text(row.observation))throw new Error('Explicit whole derivation/verdict/observation required: ' + item.where);
    if(item.kind==='quiz') {
      if(!Array.isArray(row.options) || row.options.length!==item.value.options.length)throw new Error('Every option decision required: ' + item.where);
      if(row.options.some(option=>typeof option.mathematicallyCorrect!=='boolean' || !text(option.observation)))throw new Error('Explicit option truth and why observation required: ' + item.where);
    }
  }
  if(!text(result.theoryObservation) || !text(result.sourceObservation))throw new Error('Explicit Theory and source observations required');
  if(result.visualReviews !== undefined && (!Array.isArray(result.visualReviews) || result.visualReviews.some(row=>row.accepted!==true)))throw new Error('Only positive visual reviews can be recorded; retain negative inspections in findings and flaggedDiagrams');
  if(!Array.isArray(result.flaggedDiagrams || []) || new Set(result.flaggedDiagrams || []).size!==(result.flaggedDiagrams || []).length || (result.flaggedDiagrams || []).some(where=>!text(where)))throw new Error('Unique canonical diagram flags required');
  const checked=contextChecked || validateReviewStructure(root,state,result);
  for(const where of result.flaggedDiagrams || []) {
    if(!checked.requiredVisuals.some(field=>field.where===where || field.where.startsWith(where+'.')))throw new Error('Unknown canonical diagram flag: '+where);
  }
  const seenVisuals=new Set();
  for(const row of result.visualReviews || []) {
    if(seenVisuals.has(row.where))throw new Error('Duplicate visual inspection: '+row.where);
    seenVisuals.add(row.where);
    const field=checked.requiredVisuals.find(field=>field.where===row.where);
    if(!field)throw new Error('Visual inspection requires a changed or explicitly flagged canonical diagram field: '+row.where);
    // Bind omitted bookkeeping only. Never manufacture an inspection or its verdict.
    for(const [key,value] of [['hash',field.hash],['renderedSourceHash',field.hash],['renderedBlockHashes',field.diagramHashes]]) {
      if(row[key]!==undefined && !equal(row[key],value))throw new Error('Stale visual '+key+': '+row.where);
      row[key]=value;
    }
    if(typeof row.solid3d!=='boolean')throw new Error('Explicit boolean solid3d classification required: '+row.where);
    validateVisualReviewStructure(checked.requiredVisuals,row);
    if(!text(row.renderReceipt?.path) || !text(row.renderReceipt?.hash))throw new Error('Hash-bound actual render receipt required: '+row.where);
    if([...field.value.matchAll(/\[tikz\]([\s\S]*?)\[\/tikz\]/g)].some(match=>shadingCandidates(match[1]).length) && !text(row.purposefulFillObservation))throw new Error('Explicit purposeful fill/mask/marker observation required: '+row.where);
  }
  return {profile:LEAN_PROFILE,binding:input.binding,result,receiptStructureOnly:true,acceptanceGranted:false};
}

/** One process, sequential existing guards. A failed member never rewrites earlier receipts. */
export async function runGuardedBatch(root,input) {
  requireProfile(input?.profile);
  const commands=new Set(['binding','prepare','acknowledge-read','expand-author','preflight-review','stage','review','publish']);
  if(!text(input.campaignId) || !Array.isArray(input.operations) || !input.operations.length)throw new Error('Explicit campaign and nonempty operations required');
  const seen=new Set();
  for(const row of input.operations) {
    const key=row.skillId+':'+row.command;
    if(!commands.has(row.command) || !text(row.skillId) || seen.has(key))throw new Error('Unknown/duplicate batch operation');
    seen.add(key);
    if(['stage','review'].includes(row.command) && (!row.input?.receiptStructureOnly || !row.input?.binding || !row.input?.result))throw new Error('Guarded handoff requires the retained expanded/preflight envelope');
  }
  const operations=[];
  for(const [index,row] of input.operations.entries()) {
    try {
      const state=readSkill(root,input.campaignId,row.skillId),base={campaignId:input.campaignId,skillId:row.skillId,workerId:state.owner?.workerId};
      let result;
      switch(row.command) {
        case 'binding': result={profile:LEAN_PROFILE,binding:receiptBinding(root,state)};break;
        case 'prepare':
          if(row.workerId!==base.workerId)throw new Error('Batch prepare must name the current owner');
          result=prepareAssignment(root,{...row.arguments,...base});break;
        case 'acknowledge-read':
          if(row.workerId!==base.workerId)throw new Error('Batch reading must name the actual current owner');
          result=recordPrerequisiteContextRead(root,{...base,acknowledgment:row.acknowledgment});break;
        case 'expand-author': result=expandAuthorDelta(root,state,row.input);break;
        case 'preflight-review': result=preflightReview(root,state,row.input);break;
        case 'stage':
          owned(root,state,row.input,'author');
          result=stageAssignment(root,{...row.input.result,...base});break;
        case 'review': {
          owned(root,state,row.input,'review');
          const checked=preflightReview(root,state,row.input);
          result=recordReview(root,{...checked.result,...base});break;
        }
        case 'publish':
          if(!row.stageHash || row.stageHash!==state.stage?.hash)throw new Error('Publication must bind the current reviewed stage');
          result=await publishAssignment(root,{campaignId:input.campaignId,skillId:row.skillId,publisher:row.publisher,expectedStageHash:row.stageHash});break;
      }
      operations.push({index,skillId:row.skillId,command:row.command,status:'complete',result});
    } catch(error) {
      operations.push({index,skillId:row.skillId,command:row.command,status:'failed',error:error.message});
      operations.push(...input.operations.slice(index+1).map((next,offset)=>({index:index+offset+1,skillId:next.skillId,command:next.command,status:'not-run'})));
      return {profile:LEAN_PROFILE,campaignId:input.campaignId,complete:false,operations};
    }
  }
  return {profile:LEAN_PROFILE,campaignId:input.campaignId,complete:true,operations};
}
