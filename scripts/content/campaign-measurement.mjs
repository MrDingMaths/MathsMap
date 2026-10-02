import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { readCampaign, readSkill } from './campaign-support.mjs';
const clone = value => value == null ? value : structuredClone(value);
const present = value => typeof value === 'string' && value.trim();
const native = attempt => attempt.workerLineage?.kind === 'native' || attempt.metrics?.nativeInterface === 'collaboration' || String(attempt.workerId || attempt.metrics?.workerId || '').startsWith('sol61-native-');
const counter = value => Number.isSafeInteger(value) && value >= 0 ? value : null;
function usageParts(usage) {
  if (!usage || typeof usage !== 'object') return null;
  const input = counter(usage.input_tokens), output = counter(usage.output_tokens);
  if ((usage.input_tokens!=null&&input===null)||(usage.output_tokens!=null&&output===null))return {invalid:true};
  const cachedAliases = [usage.cached_input_tokens,usage.input_tokens_details?.cached_tokens].filter(value=>value!=null).map(counter);
  const reasoningAliases = [usage.reasoning_output_tokens,usage.output_tokens_details?.reasoning_tokens].filter(value=>value!=null).map(counter);
  if ([...cachedAliases,...reasoningAliases].some(value=>value===null) || new Set(cachedAliases).size>1 || new Set(reasoningAliases).size>1) return {invalid:true};
  const cached = cachedAliases[0] ?? null, reasoning = reasoningAliases[0] ?? null;
  if ((cached !== null && input !== null && cached > input) || (reasoning !== null && output !== null && reasoning > output)) return { invalid: true };
  return { input, output, cached, reasoning };
}
const emptyTotals = () => ({inputTokens:0,cachedInputTokensIncludedInInput:0,outputTokens:0,reasoningOutputTokensIncludedInOutput:0});
function totalUsage(records) {
  const totals=emptyTotals(),coverage={input:0,cached:0,output:0,reasoning:0};
  for(const record of records) if(!record.usageConflict && record.normalizedUsage) for(const[key,total]of [['input','inputTokens'],['cached','cachedInputTokensIncludedInInput'],['output','outputTokens'],['reasoning','reasoningOutputTokensIncludedInOutput']]) if(record.normalizedUsage[key]!==null){totals[total]+=record.normalizedUsage[key];coverage[key]++;}
  return {totals,coverage};
}
// Strong actual call/attempt/output identities take precedence. A session-only
// checkpoint aliases one uniquely known call in that provider session. Multiple
// real call IDs in one session stay distinct; an unidentified checkpoint there
// is retained as ambiguous rather than adding its tokens a second time.
function usageGroups(observations) {
  const groups=[],aliases=new Map(),weak=[],ambiguous=[];
  const session = row => present(row.metrics?.sessionId)&&['codex','bounded-codex'].includes(row.metrics.provider)?row.metrics.provider+':'+row.metrics.sessionId:null;
  const strong = row => [present(row.metrics?.callId)?'call:'+row.metrics.callId:null,present(row.attemptId)?'attempt:'+row.attemptId:null,present(row.origin.outputPath)?'output:'+row.origin.outputPath:null].filter(Boolean);
  const add=(group,row)=>{group.observations.push(row);const s=session(row);if(s)group.sessions.add(s);};
  for(const row of observations){const keys=strong(row);if(!keys.length){weak.push(row);continue;}const found=[...new Set(keys.map(key=>aliases.get(key)).filter(Boolean))];let group;
    if(found.length>1){ambiguous.push({...row,reason:'Conflicting strong identity aliases; no tokens are added from this observation.'});continue;}
    group=found[0];if(group&&row.metrics?.callId&&group.callIds.size&&!group.callIds.has(row.metrics.callId)){ambiguous.push({...row,reason:'One attempt/output alias names distinct real call IDs; keep the contradictory observation separate.'});continue;}
    if(!group){group={key:keys[0],callIds:new Set(),sessions:new Set(),observations:[]};groups.push(group);}if(row.metrics?.callId)group.callIds.add(row.metrics.callId);for(const key of keys)aliases.set(key,group);add(group,row);
  }
  // A local checkpoint/receipt path is not a second real call when later actual
  // provider-session provenance uniquely supplies its call ID. Do this after
  // collecting all real IDs, so distinct turns in one thread cannot be conflated.
  for(const group of [...groups].filter(value=>!value.callIds.size&&value.sessions.size===1)) {
    const s=[...group.sessions][0],actual=groups.filter(value=>value.callIds.size&&value.sessions.has(s));
    if(actual.length===1){for(const row of group.observations)add(actual[0],row);groups.splice(groups.indexOf(group),1);}
    else if(actual.length>1){for(const row of group.observations)ambiguous.push({...row,reason:'Provider session contains distinct real calls; a local checkpoint/receipt alias cannot select one.'});groups.splice(groups.indexOf(group),1);}
  }
  const sessionOnly=new Map();
  for(const row of weak){const s=session(row);if(!s){ambiguous.push({...row,reason:'No actual call/attempt/output/provider-session identity; unavailable deduplication.'});continue;}const found=groups.filter(group=>group.sessions.has(s));
    if(found.length>1){ambiguous.push({...row,reason:'Provider session contains distinct real calls; a session-only checkpoint cannot select one.'});continue;}
    let group=found[0]||sessionOnly.get(s);if(!group){group={key:'ephemeral-session:'+s,callIds:new Set(),sessions:new Set(),observations:[]};sessionOnly.set(s,group);groups.push(group);}add(group,row);
  }
  const conflicts=[];
  const records=groups.map(group=>{const first=group.observations[0],normalized={input:null,output:null,cached:null,reasoning:null};let usageConflict=false;
    for(const row of group.observations){const parts=usageParts(row.metrics?.usage);if(!parts)continue;if(parts.invalid){usageConflict=true;continue;}for(const key of Object.keys(normalized))if(parts[key]!==null){if(normalized[key]!==null&&normalized[key]!==parts[key])usageConflict=true;else normalized[key]=parts[key];}}
    if((normalized.cached!==null&&normalized.input!==null&&normalized.cached>normalized.input)||(normalized.reasoning!==null&&normalized.output!==null&&normalized.reasoning>normalized.output))usageConflict=true;
    if(usageConflict)conflicts.push({key:group.key,reason:'Conflicting known counters/aliases or subset exceeds total; exclude this record from token totals.'});
    return {key:group.key,sessionId:first.metrics?.sessionId||null,provider:first.metrics?.provider||null,observedModel:first.metrics?.observedModel??null,recordedServiceTier:first.metrics?.serviceTier??null,actualServiceTier:first.metrics?.actualServiceTier??null,usage:clone(group.observations.find(row=>row.metrics?.usage)?.metrics.usage??null),normalizedUsage:Object.values(normalized).some(value=>value!==null)?normalized:null,usageConflict,origins:group.observations.map(row=>row.origin),rawObservations:clone(group.observations),hasExplicitMarker:group.observations.some(row=>row.explicit),hasUnspecifiedLegacyObservation:group.observations.some(row=>!row.explicit)};
  });
  return {records,conflicts,ambiguous};
}
// Pure summary. Retained checkpoint/failure/completion records may refer to the
// same actual paid call. Do not add aggregate availableUsage to their children.
export function summarizeCampaignUsage(states, { legacyReceipt = null, historicalExternalEvidence = [], nativeProfileClarifications = [] } = {}) {
  const attempts = states.flatMap(state => (state.attempts || []).map(attempt => ({ skillId: state.skillId, ...attempt })));
  const nativeAssignments = new Map(), observationsForGroups=[],unspecified=[],unidentified=[];
  let nativeUnidentified = 0, excludedReuses = 0, excludedUndispatched = 0, unspecifiedObservations = 0;
  for (const attempt of attempts) {
    if (native(attempt)) {
      if (['author', 'review'].includes(attempt.role) && present(attempt.assignmentId)) {
        const key = `${attempt.skillId}:${attempt.assignmentId}:${attempt.role}`;
        const old = nativeAssignments.get(key), metrics = attempt.metrics;
        const actualObservedModel=metrics?.observedProviderModel ?? (metrics?.provider && metrics?.observedModelProvenance==='provider-response' ? metrics?.observedModel : old?.actualObservedProviderModel ?? null);
        nativeAssignments.set(key, { skillId: attempt.skillId, assignmentId: attempt.assignmentId, role: attempt.role, workerId: attempt.workerId || null, actorId: attempt.workerLineage?.actorId || metrics?.authorIdentity || metrics?.reviewerIdentity || old?.actorId || null, identitySource: attempt.workerLineage?.kind === 'native' ? 'coordinator-bound-lineage' : metrics?.nativeInterface === 'collaboration' ? 'recorded-native-metadata' : 'legacy-native-worker-label', usage: clone(metrics?.usage ?? old?.usage ?? null), exposedModel:metrics?.model ?? old?.exposedModel ?? null,requestedModel:metrics?.requestedModel ?? old?.requestedModel ?? null,recordedObservedModel:metrics?.observedModel ?? old?.recordedObservedModel ?? null,observedModel:actualObservedModel,actualObservedProviderModel:actualObservedModel,providerModelSource:actualObservedModel?'explicit-provider-observation':'unavailable; recorded observedModel alone does not establish provider observation',rawMetadataObservations:[...(old?.rawMetadataObservations||[]),clone(metrics??null)],profileClarifications:clone(nativeProfileClarifications.filter(row=>row.assignmentId===attempt.assignmentId)), recordedServiceTier: metrics?.serviceTier ?? old?.recordedServiceTier ?? null, actualServiceTier: metrics?.actualServiceTier ?? old?.actualServiceTier ?? null });
      } else nativeUnidentified++;
    }
    const nested = attempt.metrics?.boundedAttempts;
    const observations = Array.isArray(nested) ? nested : [{ attemptId: null, metrics: attempt.metrics }];
    for (const observation of observations) {
      const metrics = observation.metrics;
      if (observation.reused) { excludedReuses++; continue; }
      if (observation.externalModelCalls === 0 || metrics?.externalModelCalls === 0 || metrics?.dispatched === false) { excludedUndispatched++; continue; }
      if(!metrics)continue;
      const explicit=observation.externalModelCalls===1||metrics.externalModelCalls===1;
      const evidence=historicalExternalEvidence.filter(record=>record.eventVerified===true&&metrics.provider==='codex'&&record.skillId===attempt.skillId&&record.assignmentId===attempt.assignmentId&&record.role===attempt.role&&record.metrics.callId===metrics.callId&&record.metrics.sessionId===metrics.sessionId&&JSON.stringify(usageParts(record.metrics.usage))===JSON.stringify(usageParts(metrics.usage)));
      const row={explicit,historicalExternalEvidence:clone(evidence),attemptId:observation.attemptId||null,metrics:clone(metrics),origin:{skillId:attempt.skillId,assignmentId:attempt.assignmentId||null,workerId:attempt.workerId||null,role:attempt.role,outputPath:observation.outputPath||attempt.outputPath||null,recordedAt:attempt.at||attempt.failedAt||attempt.checkpointedAt||null}};
      if(!explicit){unspecifiedObservations++;unspecified.push(clone(row));}
      if(explicit||metrics.usage)observationsForGroups.push(row);
    }
  }
  const {records,conflicts,ambiguous}=usageGroups(observationsForGroups),external=records.filter(row=>row.hasExplicitMarker),legacy=records.filter(row=>row.hasUnspecifiedLegacyObservation),available=records.filter(row=>row.normalizedUsage),externalTotals=totalUsage(external),legacyTotals=totalUsage(legacy),allTotals=totalUsage(available);
  const historical = records.filter(row => row.rawObservations.some(observation => observation.historicalExternalEvidence?.length));
  const identified = records.filter(row => row.hasExplicitMarker || historical.includes(row));
  const additiveDispatchEvidence = {sourceProvenHistoricalExternalRecords:historical,sourceProvenHistoricalExternalDispatches:historical.length,identifiedExternalWorkerDispatches:identified.length,identifiedExternalDispatchesWithKnownUsage:identified.filter(row=>row.normalizedUsage&&!row.usageConflict).length,identifiedExternalDispatchesWithoutUsage:identified.filter(row=>!row.normalizedUsage).length};
  for(const row of ambiguous.filter(row=>row.explicit))unidentified.push({...row.origin,metrics:row.metrics,reason:row.reason});
  return {format:'content-campaign-usage-v1',...additiveDispatchEvidence,recordedNativeAssignmentsMinimum:nativeAssignments.size,nativeAssignments:[...nativeAssignments.values()],nativeAssignmentsWithoutUsage:[...nativeAssignments.values()].filter(row=>!row.usage).length,nativeUnidentifiedAssignmentObservations:nativeUnidentified,actualNativeInferenceCalls:null,nativeMainAndApplicationWorkIncluded:false,explicitExternalCalls:external.length,externalCalls:external,externalCallsWithoutUsage:external.filter(row=>!row.usage).length,externalTokenTotals:externalTotals.totals,externalUsageCounterCoverage:externalTotals.coverage,telemetryConflicts:conflicts,unidentifiedExternalDispatchObservations:unidentified,ambiguousIdentityObservations:ambiguous,excludedCachedReuseObservations:excludedReuses,excludedZeroCallObservations:excludedUndispatched,unspecifiedLegacyCallObservations:unspecifiedObservations,unspecifiedLegacyObservations:unspecified,legacyAvailableUsageRecords:legacy.filter(row=>row.normalizedUsage),legacyAvailableTokenTotals:legacyTotals.totals,allDeduplicatedAvailableUsageRecords:available,allDeduplicatedAvailableTokenTotals:allTotals.totals,allAvailableUsageCounterCoverage:allTotals.coverage,legacyReceipt:legacyReceipt?{workerCalls:legacyReceipt.workerCalls??null,usageUnavailableCalls:legacyReceipt.usageUnavailableCalls??null,interpretation:'Preserved legacy fields may mix unspecified native and external observations and overlap the additive classifications; never add these counts.'}:null,limitations:'Native assignments are a minimum job count, not inference calls. Explicit-marker and unspecified historical classifications retain raw provenance; available usage is deduplicated across both and does not infer missing dispatch flags. Session-only observations matching multiple real calls are ambiguous and excluded from totals. Token views overlap: do not add external/legacy/all-available totals. Cached input is included in input; reasoning output is included in output. Missing identities/telemetry remain unknown. No shared-account delta is campaign-attributed.'};
}
// Additive attribution only. Original attempts and dispatch markers are never
// rewritten. A single completed turn and its started thread must bind the raw
// metrics; multi-turn logs require more specific evidence rather than guessing.
export function readHistoricalExternalEvidence(root, evidencePath, expectedHash=null) {
  const inside = file => {const resolved=path.resolve(root,file),relative=path.relative(path.resolve(root),resolved);if(relative.startsWith('..')||path.isAbsolute(relative))throw new Error('Historical usage evidence must stay inside root');return resolved;};
  const hash = bytes => createHash('sha256').update(bytes).digest('hex');
  const bytes=fs.readFileSync(inside(evidencePath)),artifactHash=hash(bytes);
  if(expectedHash&&artifactHash!==expectedHash)throw new Error('Historical usage evidence artifact hash mismatch');
  const artifact=JSON.parse(bytes),records=artifact.historicalExternalUsage?.records || artifact.records;
  if(!Array.isArray(records)||!records.length)throw new Error('Historical external usage records required');
  return records.map(record=>{
    if(!present(record.skillId)||!present(record.assignmentId)||!['author','review'].includes(record.role)||record.metrics?.provider!=='codex'||!present(record.metrics.callId)||!present(record.metrics.sessionId))throw new Error('Historical external identity binding required');
    const raw=fs.readFileSync(inside(record.events.path));if(hash(raw)!==record.events.hash)throw new Error('Historical event hash mismatch');
    const events=raw.toString('utf8').split(/\r?\n/).filter(line=>line.trim()).map(line=>JSON.parse(line)),started=events.filter(event=>event.type==='thread.started'),completed=events.filter(event=>event.type==='turn.completed');
    const parts=usageParts(record.metrics.usage);
    if(started.length!==1||completed.length!==1||started[0].thread_id!==record.metrics.sessionId||!parts||parts.invalid||parts.input===null||parts.output===null||JSON.stringify(usageParts(completed[0].usage))!==JSON.stringify(parts))throw new Error('Historical thread/turn usage does not bind recorded metrics');
    return {...clone(record),evidenceArtifact:{path:evidencePath,hash:artifactHash},eventVerified:true};
  });
}
export function readNativeProfileClarifications(root, evidencePath, expectedHash=null) {
  const inside=file=>{const resolved=path.resolve(root,file),relative=path.relative(path.resolve(root),resolved);if(relative.startsWith('..')||path.isAbsolute(relative))throw new Error('Native clarification must stay inside root');return resolved;};
  const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),bytes=fs.readFileSync(inside(evidencePath)),artifactHash=hash(bytes),artifact=JSON.parse(bytes);
  if(expectedHash&&artifactHash!==expectedHash)throw new Error('Native clarification artifact hash mismatch');
  if(artifact.format!=='native-profile-clarification-v1'||!Array.isArray(artifact.affected)||!present(artifact.reviewerIdentity)||!present(artifact.observation))throw new Error('Native profile clarification evidence required');
  return artifact.affected.map(row=>{const raw=fs.readFileSync(inside(row.path));if(hash(raw)!==row.hash)throw new Error('Native clarification original profile hash mismatch');const original=JSON.parse(raw),profile=row.profileLocator==='$'?original:row.profileLocator==='reviewerProfile'?original.reviewerProfile:null;if(!profile||profile.observedModel!==row.recordedObservedModel||!present(row.assignmentId))throw new Error('Native clarification profile/assignment binding required');return {...clone(row),evidenceArtifact:{path:evidencePath,hash:artifactHash},reviewerIdentity:artifact.reviewerIdentity,observation:artifact.observation};});
}
export function measureCampaignUsage(root, campaignId, {historicalExternalEvidencePath=null, historicalExternalEvidenceHash=null,nativeProfileClarificationPath=null,nativeProfileClarificationHash=null} = {}) {
  const campaign = readCampaign(root, campaignId), states = campaign.skillIds.map(id => readSkill(root, campaignId, id));
  const receiptPath = path.join(root, 'booklets/provenance/content-campaign', campaignId, 'receipt.json');
  return { campaignId, observedAt: new Date().toISOString(), snapshotConsistency: 'Sequential atomic file reads; an active campaign may advance during reporting.', ...summarizeCampaignUsage(states, { historicalExternalEvidence: historicalExternalEvidencePath ? readHistoricalExternalEvidence(root, historicalExternalEvidencePath, historicalExternalEvidenceHash) : [],nativeProfileClarifications:nativeProfileClarificationPath?readNativeProfileClarifications(root,nativeProfileClarificationPath,nativeProfileClarificationHash):[], legacyReceipt: fs.existsSync(receiptPath) ? JSON.parse(fs.readFileSync(receiptPath)) : null }) };
}
