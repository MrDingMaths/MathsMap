import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {summarizeCampaignUsage,readHistoricalExternalEvidence,readNativeProfileClarifications} from '../scripts/content/campaign-measurement.mjs';
const native=(assignmentId,role='author')=>({assignmentId,workerId:'sol61-native-'+assignmentId,role,metrics:{nativeInterface:'collaboration',model:'gpt-6.1-sol',effort:'high',usage:null,provider:null,serviceTier:null,observedModel:null,externalModelCalls:0}});
const call=(callId,usage)=>({attemptId:callId+'-attempt',metrics:{callId,provider:'codex',sessionId:callId+'-actual-session',externalModelCalls:1,usage,observedModel:null,serviceTier:null}});
const state=attempts=>({skillId:'skill',attempts});
test('native assignments are a distinct minimum, not inference counts; unknown telemetry and legacy overlap stay explicit',()=>{
  const original=[state([native('a'),native('a'),native('r','review'),{role:'author',workerId:'sol61-native-no-assignment',metrics:{externalModelCalls:0}}])],before=structuredClone(original);
  const result=summarizeCampaignUsage(original,{legacyReceipt:{workerCalls:176,usageUnavailableCalls:58}});
  assert.equal(result.recordedNativeAssignmentsMinimum,2);assert.equal(result.nativeAssignmentsWithoutUsage,2);assert.equal(result.actualNativeInferenceCalls,null);assert.equal(result.nativeUnidentifiedAssignmentObservations,1);assert.equal(result.explicitExternalCalls,0);assert.equal(result.legacyReceipt.workerCalls,176);assert.match(result.legacyReceipt.interpretation,/overlap/);assert.equal(result.nativeAssignments[0].actorId,null);assert.deepEqual(original,before);
});
test('checkpoint/completion caches deduplicate actual calls and token subsets are never added twice',()=>{
  const a=call('a',{input_tokens:100,cached_input_tokens:60,output_tokens:20,reasoning_output_tokens:7}),b=call('b',{input_tokens:30,input_tokens_details:{cached_tokens:10},output_tokens:8,output_tokens_details:{reasoning_tokens:2}});
  const result=summarizeCampaignUsage([state([{assignmentId:'checkpoint',role:'author',metrics:{boundedAttempts:[a,b,{...a,reused:true},{metrics:{externalModelCalls:0,dispatched:false}}],availableUsage:[a.metrics.usage,b.metrics.usage]}},{assignmentId:'completion',role:'author',metrics:{boundedAttempts:[structuredClone(a),structuredClone(b)]}}])]);
  assert.equal(result.explicitExternalCalls,2);assert.deepEqual(result.externalTokenTotals,{inputTokens:130,cachedInputTokensIncludedInInput:70,outputTokens:28,reasoningOutputTokensIncludedInOutput:9});assert.equal(result.excludedCachedReuseObservations,1);assert.equal(result.excludedZeroCallObservations,1);assert.equal(result.externalCalls[0].origins.length,2);
});
test('missing telemetry does not imply zero usage; unspecified legacy records and unidentified dispatches are separate',()=>{
  const result=summarizeCampaignUsage([state([{role:'author',metrics:{...call('known',null).metrics,serviceTier:'default'}},{role:'review',metrics:{externalModelCalls:1,usage:null}},{role:'author',metrics:{workerCalls:9,usage:{input_tokens:999}}}])]);
  assert.equal(result.explicitExternalCalls,1);assert.equal(result.externalCallsWithoutUsage,1);assert.equal(result.externalCalls[0].usage,null);assert.equal(result.externalCalls[0].observedModel,null);assert.equal(result.unidentifiedExternalDispatchObservations.length,1);assert.equal(result.unspecifiedLegacyCallObservations,1);assert.equal(result.externalUsageCounterCoverage.input,0);
  assert.equal(result.externalCalls[0].recordedServiceTier,'default');assert.equal(result.externalCalls[0].actualServiceTier,null,'a recorded configured default is not evidence of an observed provider tier');
});
test('semantically equal usage retains receipt order independence; contradictions and impossible subsets are excluded honestly',()=>{
  const a=call('a',{input_tokens:100,output_tokens:20,cached_input_tokens:60}),same=call('a',{cached_input_tokens:60,output_tokens:20,input_tokens:100});
  let result=summarizeCampaignUsage([state([{metrics:{boundedAttempts:[a,same]}}])]);assert.equal(result.telemetryConflicts.length,0);assert.equal(result.externalTokenTotals.inputTokens,100);
  result=summarizeCampaignUsage([state([{metrics:{boundedAttempts:[a,call('a',{input_tokens:101,output_tokens:20}),call('bad',{input_tokens:10,cached_input_tokens:11,output_tokens:2,reasoning_output_tokens:3})]}}])]);assert.equal(result.explicitExternalCalls,2);assert.equal(result.telemetryConflicts.length,2);assert.equal(result.externalTokenTotals.inputTokens,0);
});

test('actual historical CLI events preserve raw legacy metrics and independently bind their additive usage scope',t=>{
  const fixture=JSON.parse(fs.readFileSync(new URL('./fixtures/content-campaign/historical-cli-usage.json',import.meta.url)));
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'mathsmap-usage-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  for(const[file,raw]of Object.entries(fixture.rawEvents)){fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),raw);}
  fs.writeFileSync(path.join(root,'proof.json'),JSON.stringify({records:fixture.records}));
  const states=fixture.records.map(record=>({skillId:record.skillId,attempts:[{assignmentId:record.assignmentId,role:record.role,metrics:record.metrics}]}));
  // Also retain the remaining 56 unclassified observations without manufacturing
  // native/external identities or discarding their original metadata.
  states[0].attempts.push(...Array.from({length:56},(_,i)=>({role:'author',metrics:{workerCalls:i,usage:null}})));
  const before=structuredClone(states),verified=readHistoricalExternalEvidence(root,'proof.json');
  const result=summarizeCampaignUsage(states,{historicalExternalEvidence:verified});
  assert.equal(result.explicitExternalCalls,0);assert.equal(result.unspecifiedLegacyCallObservations,59);assert.equal(result.unspecifiedLegacyObservations.length,59);
  assert.equal(result.sourceProvenHistoricalExternalDispatches,3);assert.equal(result.identifiedExternalWorkerDispatches,3);assert.equal(result.identifiedExternalDispatchesWithKnownUsage,3);
  assert.deepEqual(result.allDeduplicatedAvailableTokenTotals,{inputTokens:183096,cachedInputTokensIncludedInInput:131072,outputTokens:10966,reasoningOutputTokensIncludedInOutput:2523});assert.deepEqual(result.legacyAvailableTokenTotals,result.allDeduplicatedAvailableTokenTotals);
  assert.equal(result.sourceProvenHistoricalExternalRecords[0].rawObservations[0].historicalExternalEvidence[0].events.hash,fixture.records[0].events.hash);assert.deepEqual(states,before);
  const overlapping=structuredClone(states);overlapping[0].attempts.push({...overlapping[0].attempts[0],metrics:{...overlapping[0].attempts[0].metrics,externalModelCalls:1}});const overlap=summarizeCampaignUsage(overlapping,{historicalExternalEvidence:verified});assert.equal(overlap.explicitExternalCalls,1);assert.equal(overlap.sourceProvenHistoricalExternalDispatches,3);assert.equal(overlap.identifiedExternalWorkerDispatches,3);assert.deepEqual(overlap.allDeduplicatedAvailableTokenTotals,result.allDeduplicatedAvailableTokenTotals,'source-proven and marker views must not be summed twice');
  fs.appendFileSync(path.join(root,fixture.records[0].events.path),'\n');assert.throws(()=>readHistoricalExternalEvidence(root,'proof.json'),/event hash/);
  fs.writeFileSync(path.join(root,fixture.records[0].events.path),fixture.rawEvents[fixture.records[0].events.path]);
  const wrong=structuredClone(fixture.records);wrong[0].metrics.sessionId='different-session';fs.writeFileSync(path.join(root,'wrong.json'),JSON.stringify({records:wrong}));assert.throws(()=>readHistoricalExternalEvidence(root,'wrong.json'),/thread\/turn/);
});

test('session-only checkpoints alias a unique completed call; multiple real calls leave unidentified session observations ambiguous',()=>{
  const usage={input_tokens:100,cached_input_tokens:60,output_tokens:20};
  const checkpoint={role:'author',metrics:{provider:'codex',sessionId:'actual-session',externalModelCalls:1,usage}};
  const completed={role:'author',metrics:{...checkpoint.metrics,callId:'actual-call',usage:{input_tokens:100,input_tokens_details:{cached_tokens:60},output_tokens:20}}};
  for(const attempts of [[checkpoint,completed],[completed,checkpoint]]){const result=summarizeCampaignUsage([state(attempts)]);assert.equal(result.explicitExternalCalls,1);assert.equal(result.externalTokenTotals.inputTokens,100);assert.equal(result.externalTokenTotals.cachedInputTokensIncludedInInput,60);assert.equal(result.telemetryConflicts.length,0);assert.equal(result.externalCalls[0].rawObservations.length,2);}
  const locallyIdentified={...checkpoint,outputPath:'checkpoint-local-directory',metrics:{...checkpoint.metrics}};
  let local=summarizeCampaignUsage([state([locallyIdentified,{...completed,outputPath:'completed-local-directory'}])]);assert.equal(local.explicitExternalCalls,1);assert.equal(local.externalTokenTotals.inputTokens,100);assert.equal(local.externalCalls[0].rawObservations.length,2);
  const second={...completed,metrics:{...completed.metrics,callId:'second-real-call',usage:{input_tokens:40,output_tokens:8}}};
  const result=summarizeCampaignUsage([state([checkpoint,completed,second])]);assert.equal(result.explicitExternalCalls,2);assert.equal(result.externalTokenTotals.inputTokens,140);assert.equal(result.externalTokenTotals.outputTokens,28);assert.equal(result.ambiguousIdentityObservations.length,1);assert.equal(result.unidentifiedExternalDispatchObservations.length,1);
  local=summarizeCampaignUsage([state([locallyIdentified,completed,second])]);assert.equal(local.explicitExternalCalls,2);assert.equal(local.externalTokenTotals.inputTokens,140);assert.equal(local.ambiguousIdentityObservations.length,1);
});

test('semantic nested/flat counters merge compatible unknown subsets and reject conflicting known aliases',()=>{
  const attempts=[call('same',{input_tokens:100,cached_input_tokens:60,output_tokens:20}),call('same',{input_tokens:100,input_tokens_details:{cached_tokens:60},output_tokens:20,output_tokens_details:{reasoning_tokens:7}})];
  let result=summarizeCampaignUsage([state([{metrics:{boundedAttempts:attempts}}])]);assert.equal(result.telemetryConflicts.length,0);assert.deepEqual(result.externalTokenTotals,{inputTokens:100,cachedInputTokensIncludedInInput:60,outputTokens:20,reasoningOutputTokensIncludedInOutput:7});
  result=summarizeCampaignUsage([state([{metrics:{boundedAttempts:[...attempts,call('same',{input_tokens:100,cached_input_tokens:60,input_tokens_details:{cached_tokens:61},output_tokens:20})]}}])]);assert.equal(result.telemetryConflicts.length,1);assert.equal(result.externalTokenTotals.inputTokens,0);assert.equal(result.externalCalls[0].rawObservations.length,3);
});

test('native exposed/recorded model settings do not become provider observations; explicit genuine telemetry and hash-bound clarification are preserved',t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'mathsmap-native-profile-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const profile={model:'gpt-6.1-sol',effort:'high',observedModel:'gpt-6.1-sol',usage:null};fs.writeFileSync(path.join(root,'old-profile.json'),JSON.stringify(profile));
  const artifact={format:'native-profile-clarification-v1',reviewerIdentity:'/root/actual_reviewer',observation:'observedModel was the exposed setting, not a provider response.',affected:[{path:'old-profile.json',hash:createHash('sha256').update(fs.readFileSync(path.join(root,'old-profile.json'))).digest('hex'),assignmentId:'old',profileLocator:'$',recordedObservedModel:'gpt-6.1-sol',interpretation:{observedProviderModel:null}}]};
  fs.writeFileSync(path.join(root,'clarification.json'),JSON.stringify(artifact));
  const clarifications=readNativeProfileClarifications(root,'clarification.json');
  const attempt=native('old');attempt.metrics.observedModel='gpt-6.1-sol';
  const real=native('actual');real.metrics.provider='actual-provider';real.metrics.observedProviderModel='genuinely-reported-model';
  const result=summarizeCampaignUsage([state([attempt,real])],{nativeProfileClarifications:clarifications});
  assert.equal(result.nativeAssignments[0].observedModel,null);assert.equal(result.nativeAssignments[0].actualObservedProviderModel,null);assert.equal(result.nativeAssignments[0].recordedObservedModel,'gpt-6.1-sol');assert.equal(result.nativeAssignments[0].exposedModel,'gpt-6.1-sol');assert.equal(result.nativeAssignments[0].profileClarifications[0].hash,artifact.affected[0].hash);assert.equal(result.nativeAssignments[1].observedModel,'genuinely-reported-model');
  fs.appendFileSync(path.join(root,'old-profile.json'),' ');assert.throws(()=>readNativeProfileClarifications(root,'clarification.json'),/original profile hash/);
});
