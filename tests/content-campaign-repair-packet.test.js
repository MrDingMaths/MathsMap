import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {prepareAssignment,readSkill,hashValue,assessmentItems,loadPreviousReview,verifyRepairPacketEvidence,claimCoordinator,recordPaidCallCheckpoint} from '../scripts/content/campaign-support.mjs';
import {inlineEvidencePrompt} from '../scripts/content/campaign-runner.mjs';
import {runBoundedAssignment} from '../scripts/content/campaign-bounded.mjs';
const actual=JSON.parse(fs.readFileSync('tests/fixtures/content-campaign/area-repair-packet.json'));
function setup(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'area-packet-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const write=(name,value)=>{const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value));};
 const state=structuredClone(actual.state);state.stage.candidatePath='candidate.json';state.owner.assignmentId='actual-area-repair';state.attempts=[];
 write('candidate.json',actual.snapshot);write('public/content/'+state.skillId+'.json',actual.pair.contentRaw);write('public/quizzes/'+state.skillId+'.json',actual.pair.quizRaw);
 for(const[name,data]of Object.entries(actual.taxonomy))write('data/'+name+'.json',data);
 for(const[id,content]of Object.entries(actual.prereqContent))write('public/content/'+id+'.json',content);
 for(const ref of state.stage.sourceReview){const bytes=fs.readFileSync(ref.path);assert.equal(hashValue(bytes),ref.hash);write(ref.path,bytes);for(const image of ref.images||[])write(image.path,fs.readFileSync(image.path));}
 write('booklets/provenance/content-campaign/test/campaign.json',{campaignId:'test',skillIds:[state.skillId]});
 const save=()=>write('booklets/provenance/content-campaign/test/skills/'+state.skillId+'.json',state);save();
 const prepare=options=>prepareAssignment(root,{campaignId:'test',skillId:state.skillId,workerId:state.owner.workerId,...options}),read=()=>readSkill(root,'test',state.skillId),packets=p=>p.packets.map(r=>JSON.parse(fs.readFileSync(path.join(root,r.path))));
 return {root,state,save,prepare,read,packets,write};
}
test('actual Area oversized fresh repair fits every complete item and preserves all prerequisite/source/image/gap/finding evidence',t=>{
 const f=setup(t),reviewHash=hashValue(f.state.review),prepared=f.prepare(),state=f.read(),packets=f.packets(prepared);
 assert.equal(prepared.repairPacketProfile,'repair-common-source-ref-v1');assert.ok(packets.every(packet=>JSON.stringify(packet).length<=24000));
 const originalItems=assessmentItems(actual.snapshot.content,actual.snapshot.quiz).filter(item=>item.kind!=='example'&&item.kind!=='theory');
 assert.equal(originalItems.length,31);assert.equal(originalItems.filter(item=>item.kind==='practice').length,21);assert.equal(originalItems.filter(item=>item.kind==='quiz').reduce((count,item)=>count+item.value.options.length,0),40);assert.ok(originalItems.some(item=>item.where==='quiz.dq-34487'));
 assert.deepEqual(packets.flatMap(packet=>packet.items.map(({priorReview,...item})=>item)),originalItems);
 assert.ok(packets.some(packet=>packet.items.some(item=>item.where==='practice.foundation[0]')));assert.ok(packets.some(packet=>packet.items.some(item=>item.where==='quiz.q9')));
 const evidence=JSON.parse(fs.readFileSync(path.join(f.root,prepared.sourceEvidencePath)));assert.equal(hashValue(evidence),prepared.sourceEvidenceHash);assert.equal(evidence.length,6);
 verifyRepairPacketEvidence(f.root,prepared,state,packets);
 for(const packet of packets){assert.deepEqual(packet.priorFindings,actual.state.pending);for(const prior of packet.context.prerequisiteTheory)assert.deepEqual(prior.theory,JSON.parse(actual.prereqContent[prior.id]).theory);packet.sourceReferences.forEach((ref,index)=>{const {excerpt,...metadata}=evidence[index];assert.equal(ref.sourceEvidenceIndex,index);assert.equal(ref.metadataHash,hashValue(metadata));assert.equal(ref.path,metadata.path);});}
 for(const ref of evidence){for(const image of ref.images||[])assert.equal(hashValue(fs.readFileSync(path.join(f.root,image.path))),image.hash);for(const gap of ref.unavailableImages||[]){assert.ok(gap.reason&&gap.textAlternative&&gap.observation);assert.equal(fs.existsSync(path.join(f.root,gap.path)),false);}}
 const previous=loadPreviousReview(f.root,prepared,state,packets);assert.deepEqual(previous.findings,actual.state.review.findings);assert.equal(previous.outcomes.length,1);assert.equal(previous.outcomes[0].where,'quiz.q9');assert.equal(hashValue(state.review),reviewHash);
 const inline=inlineEvidencePrompt(f.root,prepared,state,{maxVariableChars:500000});assert.ok(inline.prompt.includes(JSON.stringify(evidence)),'dispatch supplies full actual source sections and gap text once, not a file-read requirement');
 t.diagnostic(JSON.stringify({packetChars:prepared.packets.map(p=>p.variableChars),empty:JSON.stringify({...packets[0],items:[],sourceEvidence:[]}).length,q9Chars:JSON.stringify(originalItems.find(item=>item.where==='quiz.q9')).length,sourceMetadataReferenceChars:JSON.stringify(packets[0].sourceReferences).length,sourceSections:evidence.length,sourceImages:evidence.reduce((n,r)=>n+r.images.length,0),unavailableDecisions:evidence.flatMap(r=>r.unavailableImages||[]).length}));
});
test('fresh repair references reject index/hash/gap/image tampering before either dispatch reader calls a worker',async t=>{
 const f=setup(t),prepared=f.prepare(),state=f.read(),packets=f.packets(prepared);
 const subset=JSON.parse(fs.readFileSync(path.join(f.root,prepared.sourceEvidencePath))).slice(0,1);f.write('subset.json',subset);
 for(const replacement of [{sourceEvidencePath:'subset.json',sourceEvidenceHash:hashValue(subset),sourceReferences:subset.map(({excerpt,...ref})=>ref)},{sourceEvidencePath:'subset.json'},{sourceEvidenceHash:'wrong'},{sourceReferences:[]},{dependencyHash:'wrong'}]){
   const supplied={...prepared,...replacement};assert.throws(()=>inlineEvidencePrompt(f.root,supplied,state),/Changed supplied repair source evidence binding/);let calls=0;await assert.rejects(runBoundedAssignment({root:f.root,campaignId:'test',prepared:supplied,state,out:path.join(f.root,'out'),runner:async()=>{calls++;throw Error('must not dispatch');}}),/Changed supplied repair source evidence binding/);assert.equal(calls,0);
 }
 for(const mutate of [p=>p[0].sourceReferences.pop(),p=>p[0].sourceReferences[0].sourceEvidenceIndex=5,p=>p[0].sourceReferences[0].metadataHash='wrong',p=>p[0].repairPacketEvidence.path='foreign.json',p=>p[0].repairPacketProfile='unknown',p=>p[0].context.prerequisiteTheory.pop(),p=>p[0].priorFindings.pop(),p=>p[0].scope.stage=4]){const changed=structuredClone(packets);mutate(changed);assert.throws(()=>loadPreviousReview(f.root,prepared,state,changed),/repair packet/);}
 const evidenceFile=path.join(f.root,prepared.sourceEvidencePath),bytes=fs.readFileSync(evidenceFile),evidence=JSON.parse(bytes);evidence[0].unavailableImages[0].textAlternative='omitted actual description';fs.writeFileSync(evidenceFile,JSON.stringify(evidence));
 assert.throws(()=>inlineEvidencePrompt(f.root,prepared,state),/Changed complete repair source evidence/);let calls=0;await assert.rejects(runBoundedAssignment({root:f.root,campaignId:'test',prepared,state,out:path.join(f.root,'out'),runner:async()=>{calls++;throw Error('not dispatched');}}),/Changed complete repair source evidence/);assert.equal(calls,0);fs.writeFileSync(evidenceFile,bytes);
 const changedState=structuredClone(state);changedState.owner.prepared.sources[1].images.pop();assert.throws(()=>verifyRepairPacketEvidence(f.root,{...prepared,sourceReferences:changedState.owner.prepared.sources},changedState,packets),/Changed complete repair source metadata/);
});
test('historical prepared Area context remains exact and an opted-in paid checkpoint preserves all packet/cache identities',t=>{
 const legacy=setup(t);legacy.state.owner.prepared={boundedContextProfile:'source-metadata-refs-v1',packetSourceProfile:'packet-source-evidence-ref-v1',previousReviewProfile:'whole-item-prior-review-ref-v1'};legacy.save();
 let error;try{legacy.prepare();}catch(e){error=e;}assert.match(error.message,/Whole-question packet exceeds context bound/);assert.ok(error.packetBudget.variableChars>24000);assert.equal(legacy.read().owner.prepared.repairPacketProfile,undefined);
 const f=setup(t),prepared=f.prepare(),bytes=prepared.packets.map(p=>fs.readFileSync(path.join(f.root,p.path))),sourceBytes=fs.readFileSync(path.join(f.root,prepared.sourceEvidencePath));
 claimCoordinator(f.root,{campaignId:'test',skillId:f.state.skillId,workerId:f.state.owner.workerId,runId:'checkpoint'});recordPaidCallCheckpoint(f.root,{campaignId:'test',skillId:f.state.skillId,workerId:f.state.owner.workerId,runId:'checkpoint',metrics:{externalModelCalls:0,dispatched:false}});
 const resumed=f.prepare();assert.equal(resumed.repairPacketProfile,prepared.repairPacketProfile);assert.deepEqual(resumed.packets,prepared.packets);assert.deepEqual(resumed.packets.map(p=>fs.readFileSync(path.join(f.root,p.path))),bytes);assert.deepEqual(fs.readFileSync(path.join(f.root,prepared.sourceEvidencePath)),sourceBytes);
 const reprepared=f.prepare({sources:f.read().owner.prepared.sources});assert.deepEqual(reprepared.packets,prepared.packets);assert.equal(reprepared.repairPacketProfile,prepared.repairPacketProfile);
});
