import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {prepareAssignment,readSkill,hashValue,assessmentItems,loadPreviousReview,claimCoordinator,recordPaidCallCheckpoint} from '../scripts/content/campaign-support.mjs';
import {inlineEvidencePrompt} from '../scripts/content/campaign-runner.mjs';
const actual=JSON.parse(fs.readFileSync('tests/fixtures/content-campaign/distance-repair-packet.json'));
function setup(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'distance-packet-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const write=(name,value)=>{const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value));};
 const state=structuredClone(actual.state);state.stage.candidatePath='candidate.json';state.owner.assignmentId='actual-distance-repair';state.attempts=[];
 write('candidate.json',actual.snapshot);write('public/content/'+state.skillId+'.json',actual.pair.contentRaw);write('public/quizzes/'+state.skillId+'.json',actual.pair.quizRaw);
 for(const[name,data]of Object.entries(actual.taxonomy))write('data/'+name+'.json',data);
 for(const ref of state.stage.sourceReview){const bytes=fs.readFileSync(ref.path);assert.equal(hashValue(bytes),ref.hash);write(ref.path,bytes);for(const image of ref.images||[])write(image.path,fs.readFileSync(image.path));}
 write('booklets/provenance/content-campaign/test/campaign.json',{campaignId:'test',skillIds:[state.skillId]});
 const save=()=>write('booklets/provenance/content-campaign/test/skills/'+state.skillId+'.json',state);save();
 const prepare=options=>prepareAssignment(root,{campaignId:'test',skillId:state.skillId,workerId:state.owner.workerId,...options}),read=()=>readSkill(root,'test',state.skillId),packets=p=>p.packets.map(r=>JSON.parse(fs.readFileSync(path.join(root,r.path))));
 return {root,state,save,prepare,read,packets,write};
}
test('actual Distance fresh repair retains complete whole questions/source evidence and fits24k without redundant derived source metadata',t=>{
 const f=setup(t),before=hashValue(f.state.review),prepared=f.prepare(),state=f.read(),packets=f.packets(prepared);
 assert.equal(prepared.packetSourceProfile,'packet-source-evidence-ref-v1');assert.ok(packets.every(p=>JSON.stringify(p).length<=24000));
 const originalItems=assessmentItems(actual.snapshot.content,actual.snapshot.quiz).filter(i=>i.kind!=='example'&&i.kind!=='theory');
 assert.deepEqual(packets.flatMap(p=>p.items.map(({priorReview,...item})=>item)),originalItems);
 const full=JSON.parse(fs.readFileSync(path.join(f.root,prepared.sourceEvidencePath)));assert.equal(hashValue(full),prepared.sourceEvidenceHash);assert.equal(full.length,8);
 for(const p of packets){assert.equal(p.packetSourceProfile,prepared.packetSourceProfile);assert.equal(p.sourceReferences.length,8);for(const ref of p.sourceReferences){const source=full.find(s=>s.path===ref.path&&s.startLine===ref.startLine&&s.endLine===ref.endLine);assert.ok(source);for(const[key,value]of Object.entries(ref))assert.deepEqual(value,source[key]);for(const key of ['rawExcerptHash','excerptHash','normalization'])assert.equal(Object.hasOwn(ref,key),false);assert.ok(source.rawExcerptHash&&source.excerptHash&&source.normalization&&source.excerpt);for(const image of ref.images||[])assert.equal(hashValue(fs.readFileSync(path.join(f.root,image.path))),image.hash);}for(const source of p.sourceEvidence)assert.equal(source.excerpt,full.find(s=>s.path===source.path&&s.startLine===source.startLine&&s.endLine===source.endLine).excerpt);}
 const prior=loadPreviousReview(f.root,prepared,state,packets);assert.deepEqual(prior.findings,actual.state.review.findings);assert.equal(hashValue(state.review),before);assert.deepEqual(state.pending,actual.state.pending);
 const inline=inlineEvidencePrompt(f.root,prepared,state,{maxVariableChars:300000});assert.ok(inline.prompt.includes(JSON.stringify(full)),'coordinator still delivers complete original evidence inline, not references only');
 t.diagnostic(JSON.stringify({packetChars:prepared.packets.map(p=>p.variableChars),emptyContext:JSON.stringify({...packets[0],items:[],sourceEvidence:[]}).length,sourceRefs:full.length,wholeItems:originalItems.length}));
});
test('legacy prepared Distance payload remains unchanged and its exact failure budget is diagnosed without migration',t=>{
 const f=setup(t);f.state.owner.prepared={previousReviewProfile:'whole-item-prior-review-ref-v1',boundedContextProfile:'source-metadata-refs-v1'};f.save();
 let error;try{f.prepare();}catch(e){error=e;}assert.match(error.message,/Whole-question packet exceeds context bound: practice.foundation\[1\]/);assert.equal(error.packetBudget.limit,24000);assert.ok(error.packetBudget.variableChars>24000);assert.equal(error.packetBudget.fields.sourceReferences,8019);assert.equal(error.packetBudget.items[0].variableChars,4315);assert.equal(f.read().owner.prepared.packetSourceProfile,undefined);
 const prepared=f.prepare({maxVariableChars:100000}),oldState=f.read(),original=f.packets(prepared),bytes=prepared.packets.map(p=>fs.readFileSync(path.join(f.root,p.path),'utf8'));assert.equal(prepared.packetSourceProfile,undefined);assert.ok(original[0].sourceReferences.every(r=>r.rawExcerptHash&&r.excerptHash&&r.normalization));
 claimCoordinator(f.root,{campaignId:'test',skillId:f.state.skillId,workerId:f.state.owner.workerId,runId:'historical'});recordPaidCallCheckpoint(f.root,{campaignId:'test',skillId:f.state.skillId,workerId:f.state.owner.workerId,runId:'historical',metrics:{externalModelCalls:1,sessionId:'existing-paid-session'}});
 const resumed=f.prepare();assert.deepEqual(resumed.packets,prepared.packets);assert.deepEqual(resumed.packets.map(p=>fs.readFileSync(path.join(f.root,p.path),'utf8')),bytes);
 const reprepared=f.prepare({sources:oldState.owner.prepared.sources,maxVariableChars:100000});assert.deepEqual(reprepared.packets,prepared.packets);assert.equal(reprepared.packetSourceProfile,undefined);
});
test('unknown captured source-reference profiles are refused rather than silently migrated',t=>{
 const f=setup(t);f.state.owner.prepared={packetSourceProfile:'unrecorded-format'};f.save();assert.throws(()=>f.prepare(),/Unknown packet source profile/);assert.equal(f.read().owner.prepared.packetSourceProfile,'unrecorded-format');
});
