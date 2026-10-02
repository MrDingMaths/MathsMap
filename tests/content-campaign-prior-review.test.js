import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {prepareAssignment,readSkill,hashValue,assessmentItems,loadPreviousReview,claimCoordinator,recordPaidCallCheckpoint} from '../scripts/content/campaign-support.mjs';
import {inlineEvidencePrompt} from '../scripts/content/campaign-runner.mjs';
import {runBoundedAssignment} from '../scripts/content/campaign-bounded.mjs';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const actual=JSON.parse(fs.readFileSync(path.join(repo,'tests/fixtures/content-campaign/names-prior-review.json')));
function fixture(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'names-review-reference-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const write=(name,value)=>{const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value));};
  const state=structuredClone(actual.state),campaignId='test',skillId=state.skillId;
  state.stage.candidatePath='candidate.json';state.owner.assignmentId='actual-names-repair';state.attempts=[];
  write('candidate.json',actual.snapshot);write('public/content/'+skillId+'.json',actual.pair.contentRaw);write('public/quizzes/'+skillId+'.json',actual.pair.quizRaw);
  for(const [name,value]of Object.entries(actual.taxonomy))write('data/'+name+'.json',value);
  for(const ref of state.stage.sourceReview){const bytes=fs.readFileSync(path.join(repo,ref.path));assert.equal(hashValue(bytes),ref.hash);write(ref.path,bytes);for(const image of ref.images||[])write(image.path,fs.readFileSync(path.join(repo,image.path)));}
  write('booklets/provenance/content-campaign/test/campaign.json',{campaignId,skillIds:[skillId]});
  const saveState=value=>write('booklets/provenance/content-campaign/test/skills/'+skillId+'.json',value);saveState(state);
  const prepare=options=>prepareAssignment(root,{campaignId,skillId,workerId:state.owner.workerId,...options});
  const read=()=>readSkill(root,campaignId,skillId);
  const packets=prepared=>prepared.packets.map(packet=>JSON.parse(fs.readFileSync(path.join(root,packet.path))));
  return {root,state,write,saveState,prepare,read,packets,campaignId,skillId};
}
test('actual Names repair reconstructs all21 full prior outcomes and every whole question under24k',t=>{
  const f=fixture(t),originalReview=structuredClone(f.state.review),prepared=f.prepare(),state=f.read(),packets=f.packets(prepared);
  assert.equal(prepared.previousReviewProfile,'whole-item-prior-review-ref-v1');
  assert.ok(packets.length>1);assert.ok(packets.every(packet=>JSON.stringify(packet).length<=24000));
  const full=loadPreviousReview(f.root,prepared,state,packets);
  t.diagnostic(JSON.stringify({actualNames:true,priorReviewChars:JSON.stringify(full).length,priorOutcomes:full.outcomes.length,packetCount:packets.length,packetChars:packets.map(packet=>JSON.stringify(packet).length),emptyContextChars:JSON.stringify({...packets[0],items:[],sourceEvidence:[]}).length,sourceEvidenceHash:prepared.sourceEvidenceHash}));
  assert.deepEqual(full.outcomes,originalReview.outcomes.filter(row=>row.verdict!=='accepted'));assert.equal(full.outcomes.length,21);
  assert.deepEqual(full.findings,originalReview.findings);assert.deepEqual(state.review,originalReview,'ledger/full original review untouched');
  const originals=assessmentItems(actual.snapshot.content,actual.snapshot.quiz,false).filter(item=>item.kind!=='example');
  assert.deepEqual(packets.flatMap(packet=>packet.items.map(({priorReview,...item})=>item)),originals,'all questions/solutions/options/why/IDs preserved');
  for(const packet of packets){assert.equal(packet.previousReview.outcomes,undefined);for(const item of packet.items)assert.deepEqual(item.priorReview,full.outcomes.find(row=>row.where===item.where));}
  const beforeHash=hashValue(originalReview);assert.equal(beforeHash,hashValue(state.review));
  const inline=inlineEvidencePrompt(f.root,prepared,state,{maxVariableChars:200000});assert.ok(inline.prompt.includes(JSON.stringify(full)));assert.ok(inline.variableChars>24000,'full inline reader retains all evidence and delegates oversize to bounded dispatch');
});
test('prior-review references reject malformed/tampered/stale/foreign bindings and bounded rejects beforedispatch',async t=>{
  const f=fixture(t),prepared=f.prepare(),state=f.read(),packets=f.packets(prepared);
  const check=(s=state,p=packets,pr=prepared)=>loadPreviousReview(f.root,pr,s,p);
  for(const mutate of [s=>s.stage.hash='changed',s=>s.stage.candidateHash='changed',s=>s.review.outcomes[0].observation+='changed',s=>s.owner.assignmentId='foreign',s=>s.owner.prepared.previousReviewReference.hash='bad']){
    const stale=structuredClone(state);mutate(stale);assert.throws(()=>check(stale),/previous-review reference/);
  }
  const altered=structuredClone(packets);altered[0].items[0].priorReview.observation+='changed';assert.throws(()=>check(state,altered),/prior review/);
  const staleItem=structuredClone(packets);staleItem[0].items[0].value.question_text+='changed';assert.throws(()=>check(state,staleItem),/owned item/);
  const foreign=structuredClone(prepared);foreign.previousReviewReference.path='candidate.json';assert.throws(()=>check(state,packets,foreign),/Malformed previous-review reference/);
  const file=path.join(f.root,prepared.previousReviewReference.path),artifact=JSON.parse(fs.readFileSync(file));artifact.previousReview.outcomes[0].independentSolution+='changed';f.write(prepared.previousReviewReference.path,artifact);
  assert.throws(()=>check(),/previous-review reference/);assert.throws(()=>inlineEvidencePrompt(f.root,prepared,state),/previous-review reference/);
  await assert.rejects(runBoundedAssignment({root:f.root,prepared,state,campaignId:'test',runner:()=>assert.fail('Cannot dispatch a changed review artifact')}),/previous-review reference/);
});
test('an existing paid Names lease retains legacy full-review packets byte-identically oncheckpointresume and reprepare',t=>{
  const f=fixture(t);f.state.owner.prepared={};f.saveState(f.state);
  assert.throws(()=>f.prepare(),/Scope\/theory packet exceeds context bound/,'actual legacy duplicated context fails the original24k bound');
  const prepared=f.prepare({maxVariableChars:200000}),oldState=f.read(),oldPackets=f.packets(prepared),raws=prepared.packets.map(packet=>fs.readFileSync(path.join(f.root,packet.path),'utf8'));
  assert.equal(prepared.previousReviewProfile,undefined);assert.equal(oldPackets[0].previousReview.outcomes.length,21);assert.ok(prepared.packets[0].variableChars>24000);
  t.diagnostic(JSON.stringify({actualLegacyNames:true,emptyContextChars:JSON.stringify({...oldPackets[0],items:[],sourceEvidence:[]}).length,previousReviewChars:JSON.stringify(oldPackets[0].previousReview).length,packetChars:prepared.packets.map(packet=>packet.variableChars)}));
  claimCoordinator(f.root,{campaignId:'test',skillId:f.skillId,workerId:f.state.owner.workerId,runId:'old-paid'});
  recordPaidCallCheckpoint(f.root,{campaignId:'test',skillId:f.skillId,workerId:f.state.owner.workerId,runId:'old-paid',metrics:{externalModelCalls:1,sessionId:'actual-existing-session'}});
  const checkpoint=structuredClone(f.read().owner.prepared),resumed=f.prepare();assert.deepEqual(f.read().owner.prepared,checkpoint);assert.deepEqual(resumed.packets,prepared.packets);
  assert.deepEqual(resumed.packets.map(packet=>fs.readFileSync(path.join(f.root,packet.path),'utf8')),raws);
  const reprepared=f.prepare({sources:oldState.owner.prepared.sources,maxVariableChars:200000});assert.deepEqual(reprepared.packets,prepared.packets);assert.equal(reprepared.previousReviewReference,undefined);
  assert.deepEqual(loadPreviousReview(f.root,reprepared,f.read(),f.packets(reprepared)),oldPackets[0].previousReview);
});
