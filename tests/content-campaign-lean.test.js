import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { LEAN_PROFILE,planBatch,checkBatch,claimBatchMember,receiptBinding,expandAuthorDelta,preflightReview,runGuardedBatch } from '../scripts/content/campaign-lean.mjs';
import { hashValue,capturePair,assessmentItems,readSkill,publishAssignment } from '../scripts/content/campaign-support.mjs';
import { scopeDependencies } from '../scripts/content/campaign-sources.mjs';
const profile={model:'gpt-6.1-sol',effort:'high',requestedServiceTier:'default',maxWorkers:3};
function fixture(t,count=8) {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'lean-campaign-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const write=(p,v)=>{const file=path.join(root,p);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(v));};
 const ids=Array.from({length:count},(_,i)=>'child-'+i),all=['parent',...ids];
 const source='booklets/mathsmap-sources/Stage 4/Numbers.md';fs.mkdirSync(path.dirname(path.join(root,source)),{recursive:true});fs.writeFileSync(path.join(root,source),'# Numbers\nUse the number line.\n');
 write('data/skills.json',all.map(id=>({id,prereqs:id==='parent'?[]:['parent']})));for(const name of ['topics','courses','dotpoints'])write('data/'+name+'.json',[]);
 const ledger='booklets/provenance/content-campaign/test/';write(ledger+'campaign.json',{skillIds:all,profile});
 const content=id=>({skillId:id,theory:{intro:'Use the number line.',facts:['Compare numbers.']},practice:{foundation:[{question_text:'Compare 3 and 5.',solution_text:'3 < 5.'}]}});
 const quiz=id=>({skillId:id,questions:[{id:'q1',question_text:'Which is greater?',options:[{text:'5',correct:true},{text:'3',why:'3 is smaller.'}]}]});
 for(const id of all){write('public/content/'+id+'.json',content(id));write('public/quizzes/'+id+'.json',quiz(id));write(ledger+'skills/'+id+'.json',{skillId:id,status:id==='parent'?'published':'pending',scope:{topicId:'numbers',stage:4},sources:[{path:source,startLine:1,endLine:3}],baseline:capturePair(root,id).expected});}
 const read=id=>readSkill(root,'test',id),save=s=>write(ledger+'skills/'+s.skillId+'.json',s);
 const owned=(role='author')=>{const s=read(ids[0]),pair=capturePair(root,s.skillId);write('work/snapshot.json',{content:pair.content,quiz:pair.quiz});s.owner={role,workerId:'worker',assignmentId:'assignment',profile,workerLineage:{kind:'native',actorId:'/root/reviewer'},prepared:{snapshotPath:'work/snapshot.json',sources:s.sources,expected:pair.expected,dependencyHash:scopeDependencies(root,s.skillId,s.scope,s.sources).hash}};s.owner.prepared.workerLineage=structuredClone(s.owner.workerLineage);if(role==='review'){s.stage={expected:pair.expected,baselinePath:'work/baseline.json',removals:[],author:'author',hash:'stage',candidatePath:'work/snapshot.json',candidateHash:hashValue({content:pair.content,quiz:pair.quiz}),workerLineage:{kind:'native',actorId:'/root/author'},sourceReview:s.sources};write('work/baseline.json',{content:pair.content,quiz:pair.quiz});}save(s);return s;};
 return {root,write,read,save,ids,owned,source};
}
test('planner is opt-in, keeps small ready cohorts, binds full parents and never changes ledger',t=>{
 const f=fixture(t,11),before=fs.readFileSync(path.join(f.root,'booklets/provenance/content-campaign/test/campaign.json'));
 assert.throws(()=>planBatch(f.root,{campaignId:'test'}),/profile/);
 const p=planBatch(f.root,{campaignId:'test',profile:LEAN_PROFILE});assert.deepEqual(p.batches.map(b=>b.members.length),[8,3]);assert.equal(p.ownershipAcquired,false);assert.deepEqual(fs.readFileSync(path.join(f.root,'booklets/provenance/content-campaign/test/campaign.json')),before);
 const parent=f.read('parent');parent.status='accepted';f.save(parent);
 assert.equal(planBatch(f.root,{campaignId:'test',profile:LEAN_PROFILE,ids:f.ids}).batches.length,0,'parent outside filter must still be published');
});
test('configured legacy minimum keeps four-skill grouping and bounded maximum',t=>{
 const f=fixture(t,10);
 for(const size of [4,5,6,7,8]) {
  const plan=planBatch(f.root,{campaignId:'test',profile:LEAN_PROFILE,size,minimumSize:4});
  assert.ok(plan.batches.every(batch=>batch.members.length>=4 && batch.members.length<=size));
 }
});
test('one to three ready skills can be checked and claimed with original dependency guards',t=>{
 for(const count of [1,2,3]) {
  const f=fixture(t,count),batch=planBatch(f.root,{campaignId:'test',profile:LEAN_PROFILE}).batches[0];
  assert.equal(batch.members.length,count);assert.equal(checkBatch(f.root,batch).usable,true);
  const historical={...batch};delete historical.minimumSize;delete historical.hash;historical.hash=hashValue(historical);
  assert.throws(()=>checkBatch(f.root,historical),/Malformed batch/);
  assert.equal(claimBatchMember(f.root,batch,{skillId:f.ids[0],workerId:'small',actorId:'/root/author'}).role,'author');
 }
});
test('planner rejects invalid limits and accepts historical four-skill manifests',t=>{
 const f=fixture(t,4);
 for(const size of [0,9,1.5])assert.throws(()=>planBatch(f.root,{campaignId:'test',profile:LEAN_PROFILE,size}),/Batch size/);
 for(const minimumSize of [0,9,1.5])assert.throws(()=>planBatch(f.root,{campaignId:'test',profile:LEAN_PROFILE,minimumSize}),/Minimum batch/);
 const historical=planBatch(f.root,{campaignId:'test',profile:LEAN_PROFILE,minimumSize:4}).batches[0];delete historical.minimumSize;delete historical.hash;historical.hash=hashValue(historical);
 assert.equal(checkBatch(f.root,historical).usable,true);
});
test('lazy claim checks locked bindings, single ownership and native/three-owner gates',t=>{
 const f=fixture(t),batch=planBatch(f.root,{campaignId:'test',profile:LEAN_PROFILE}).batches[0];
 const claim=claimBatchMember(f.root,batch,{skillId:f.ids[0],workerId:'worker',actorId:'/root/author'});assert.equal(claim.role,'author');assert.equal(f.read(f.ids[1]).owner,undefined);
 assert.equal(claimBatchMember(f.root,batch,{skillId:f.ids[0],workerId:'worker',actorId:'/root/author'}).assignmentId,claim.assignmentId);
 assert.throws(()=>claimBatchMember(f.root,batch,{skillId:f.ids[0],workerId:'worker',actorId:'/root/foreign'}),/lineage/);
 assert.match(claimBatchMember(f.root,batch,{skillId:f.ids[1],workerId:'worker',actorId:'/root/author'}).blocked,/outside/);
 for(const id of f.ids.slice(1,3)){const s=f.read(id);s.owner={role:'author',workerId:id};f.save(s);}
 assert.match(claimBatchMember(f.root,batch,{skillId:f.ids[3],workerId:'fourth',actorId:'/root/other'}).blocked,/Three/);
 assert.throws(()=>claimBatchMember(f.root,batch,{skillId:'parent',workerId:'x',actorId:'/root/x'}),/outside/);
});
test('individual adjacent spans remain bound without splitting a shared booklet/topic group',t=>{
 const f=fixture(t,4),state=f.read(f.ids[0]);state.sources[0].startLine=2;f.save(state);
 const plan=planBatch(f.root,{campaignId:'test',profile:LEAN_PROFILE});assert.equal(plan.batches.length,1);
 state.sources[0].endLine=2;f.save(state);assert.equal(checkBatch(f.root,plan.batches[0]).members[0].usable,false);
});
test('stale baseline, source, profile or complete parent bytes skip immutable members',t=>{
 const f=fixture(t),batch=planBatch(f.root,{campaignId:'test',profile:LEAN_PROFILE}).batches[0],bytes=JSON.stringify(batch);
 const pair=capturePair(f.root,'parent');pair.content.theory.facts.push('Complete extra example.');f.write('public/content/parent.json',pair.content);
 assert.equal(checkBatch(f.root,batch).skip,true);assert.match(claimBatchMember(f.root,batch,{skillId:f.ids[0],workerId:'x',actorId:'/root/x'}).blocked,/stale/);assert.equal(f.read(f.ids[0]).owner,undefined);assert.equal(JSON.stringify(batch),bytes);
 f.write('public/content/parent.json',JSON.parse(pair.contentRaw));const s=f.read(f.ids[0]);s.baseline.contentHash='altered';f.save(s);
 const check=checkBatch(f.root,batch);assert.equal(check.members[0].usable,false);assert.equal(check.members[1].usable,true);
 fs.appendFileSync(path.join(f.root,f.source),'New teaching.');assert.equal(checkBatch(f.root,batch).skip,true);
});
test('profile changes and malformed manifests cannot dispatch or relabel historical settings',t=>{
 const f=fixture(t),batch=planBatch(f.root,{campaignId:'test',profile:LEAN_PROFILE}).batches[0];
 const corrupt=structuredClone(batch);corrupt.members[0].skillId='parent';assert.throws(()=>checkBatch(f.root,corrupt),/Malformed/);
 const ledger='booklets/provenance/content-campaign/test/campaign.json';
 f.write(ledger,{skillIds:['parent',...f.ids],profile:{...profile,effort:'medium',executionOverrideProfile:'user-requested-sol61-medium-v1',reasoningOverride:{effort:'medium',reason:'Explicit user choice.'}}});
 assert.equal(checkBatch(f.root,batch).skip,true);assert.equal(batch.executionProfile.effort,'high');
 assert.match(claimBatchMember(f.root,batch,{skillId:f.ids[0],workerId:'x',actorId:'/root/x'}).blocked,/stale/);
});
test('compact author delta preserves untouched values and requires supplied derivations/mappings',t=>{
 const f=fixture(t),s=f.owned(),snapshot=JSON.parse(fs.readFileSync(path.join(f.root,'work/snapshot.json'))),items=assessmentItems(snapshot.content,snapshot.quiz,false);
 const input={profile:LEAN_PROFILE,binding:receiptBinding(f.root,s),edits:[{path:'/content/practice/foundation/0/solution_text',before:'3 < 5.',value:'3 is less than 5.'}],derivations:items.map(i=>({where:i.where,working:'Compare the positions: 5 is greater.'})),result:{coverage:{methods:[{id:'compare',description:'Use the number line.'}],items:items.map(i=>({where:i.where,methods:['compare'],audited:true}))},sourceReview:[],removals:[]}};
 const out=expandAuthorDelta(f.root,s,input);assert.equal(out.result.candidateContent.practice.foundation[0].solution_text,'3 is less than 5.');assert.deepEqual(out.result.candidateQuiz,snapshot.quiz);assert.equal(out.result.coverage.items[0].hash,hashValue(out.result.candidateContent.practice.foundation[0]));assert.equal(input.result.coverage.items[0].hash,undefined);
 const unaudited=structuredClone(input); delete unaudited.result.coverage.items[0].audited; assert.throws(()=>expandAuthorDelta(f.root,s,unaudited),/audited/);
 const compact=structuredClone(input);delete compact.derivations;assert.equal(expandAuthorDelta(f.root,s,compact).derivations,undefined);
 assert.throws(()=>expandAuthorDelta(f.root,s,{...input,edits:[{path:'/content/__proto__/polluted',before:null,value:true}]}),/Unsafe/);
 const changed=structuredClone(input);changed.binding.assignmentId='foreign';assert.throws(()=>expandAuthorDelta(f.root,s,changed),/binding/);
});
test('review preflight never infers option truth/why or acceptance; rejects missing arrays before ledger',t=>{
 const f=fixture(t),s=f.owned('review'),pair=JSON.parse(fs.readFileSync(path.join(f.root,'work/snapshot.json')));
 const result={outcomes:assessmentItems(pair.content,pair.quiz,false).map(i=>({where:i.where,verdict:'repair',independentSolution:'5 is greater than 3.',observation:'Independently compared both values.',...(i.kind==='quiz'?{options:[{mathematicallyCorrect:true,observation:'5 is greater, so it answers the stem.'},{mathematicallyCorrect:false,observation:'3 is smaller; the reason states this correctly.'}]}:{})})),theoryObservation:'The number-line method supports these comparisons.',sourceObservation:'The complete teaching unit supports this method.'};
 const input={profile:LEAN_PROFILE,binding:receiptBinding(f.root,s),result};const out=preflightReview(f.root,s,input);assert.equal(out.acceptanceGranted,false);assert.equal(out.result.outcomes[1].verdict,'repair');assert.equal(out.result.outcomes[1].options[1].hash,hashValue(pair.quiz.questions[0].options[1]));assert.equal(result.stageHash,undefined);
 for(const mutation of [r=>delete r.outcomes[1].options,r=>delete r.outcomes[1].options[0].mathematicallyCorrect,r=>r.outcomes[1].options[1].observation='',r=>r.outcomes.push(r.outcomes[0])]){const bad=structuredClone(input);mutation(bad.result);assert.throws(()=>preflightReview(f.root,s,bad),/option|duplicate/);}
 const negative=structuredClone(input);negative.result.visualReviews=[{where:'theory.intro',accepted:false,observation:'Label collision.'}];assert.throws(()=>preflightReview(f.root,s,negative),/negative inspections in findings/);
 const flagged=structuredClone(input);flagged.result.findings=[{where:'theory.intro',description:'Label collision.'}];flagged.result.flaggedDiagrams=['theory.intro'];assert.throws(()=>preflightReview(f.root,s,flagged),/Unknown canonical diagram flag/);
 s.owner.workerLineage.actorId='/root/author';assert.throws(()=>receiptBinding(f.root,s),/Independent/);
 s.owner.workerLineage.kind='external-ephemeral';assert.throws(()=>receiptBinding(f.root,s),/native/);
});
test('author adds plural examples, removes legacy singular and replaces whole arrays with exact guards',t=>{
 const f=fixture(t),pair=capturePair(f.root,f.ids[0]);
 const old={question_text:'Compare 2 and 7.',solution_text:'2 < 7.'};pair.content.theory.workedExample=old;f.write('public/content/'+f.ids[0]+'.json',pair.content);
 const s=f.owned(),next={question_text:'Compare 4 and 9.',solution_text:'4 < 9.'};
 const final=structuredClone(pair.content);delete final.theory.workedExample;final.theory.workedExamples=[next];final.practice.foundation=[...final.practice.foundation,{question_text:'Compare 1 and 6.',solution_text:'1 < 6.'}];
 const input={profile:LEAN_PROFILE,binding:receiptBinding(f.root,s),edits:[{operation:'remove',path:'/content/theory/workedExample',before:old},{operation:'add',path:'/content/theory/workedExamples',beforeAbsent:true,value:[next]},{path:'/content/practice/foundation',before:pair.content.practice.foundation,value:final.practice.foundation}],result:{sourceReview:[],removals:[],coverage:{methods:[{id:'compare'}],items:assessmentItems(final,pair.quiz,false).map(item=>({where:item.where,methods:['compare'],audited:true}))}}};
 assert.deepEqual(expandAuthorDelta(f.root,s,input).result.candidateContent,final);
 const bad=structuredClone(input);delete bad.edits[1].beforeAbsent;assert.throws(()=>expandAuthorDelta(f.root,s,bad),/absent/);
});
test('a tampered author snapshot cannot gain trust through a fresh binding; real repair snapshots remain valid',t=>{
 const f=fixture(t),s=f.owned(),snapshot=JSON.parse(fs.readFileSync(path.join(f.root,'work/snapshot.json')));
 snapshot.content.practice.foundation[0].solution_text='An altered answer.';f.write('work/snapshot.json',snapshot);
 assert.throws(()=>receiptBinding(f.root,s),/author snapshot/);
 s.status='repair-needed';s.stage={candidatePath:'work/candidate.json',candidateHash:hashValue({content:snapshot.content,quiz:snapshot.quiz}),hash:'repair-stage'};f.write('work/candidate.json',snapshot);
 assert.equal(receiptBinding(f.root,s).stageHash,'repair-stage','legitimate staged repair baseline need not equal the live old content');
 snapshot.content.practice.foundation[0].question_text='Foreign question';f.write('work/snapshot.json',snapshot);assert.throws(()=>receiptBinding(f.root,s),/staged snapshot/);
});
test('array length and noncanonical structural pointers cannot evade whole-array guards',t=>{
 const f=fixture(t),s=f.owned(),snapshot=JSON.parse(fs.readFileSync(path.join(f.root,'work/snapshot.json')));
 const input={profile:LEAN_PROFILE,binding:receiptBinding(f.root,s),result:{},edits:[]};
 for(const key of ['length','01','-1','1.0','1e0','constructor','__proto__','1']) {
  const bad={...input,edits:[{path:'/content/practice/foundation/'+key,before:1,value:0}]};
  assert.throws(()=>expandAuthorDelta(f.root,s,bad),/Array edits|Unsafe/);
 }
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(f.root,'work/snapshot.json'))),snapshot,'rejected edits do not mutate evidence');
});
test('CLI planning writes immutable opt-in output without claiming owners',t=>{
 const f=fixture(t),out=path.join(f.root,'plan.json'),cli=path.resolve('scripts/content/campaign-lean-cli.mjs');
 const args=[cli,'plan','--root',f.root,'--campaign','test','--profile',LEAN_PROFILE,'--out',out];
 const run=spawnSync(process.execPath,args,{encoding:'utf8'});assert.equal(run.status,0,run.stderr);assert.equal(JSON.parse(fs.readFileSync(out)).batches.length,1);assert.equal(f.read(f.ids[0]).owner,undefined);
 assert.notEqual(spawnSync(process.execPath,args,{encoding:'utf8'}).status,0,'existing manifest must not be overwritten');
});

function reviewInput(f,s) {
 const pair=JSON.parse(fs.readFileSync(path.join(f.root,s.stage.candidatePath)));
 return {profile:LEAN_PROFILE,binding:receiptBinding(f.root,s),result:{outcomes:assessmentItems(pair.content,pair.quiz,false).map(i=>({where:i.where,verdict:'accepted',independentSolution:'5 is greater than 3.',observation:'Compared both values independently.',...(i.kind==='quiz'?{options:[{mathematicallyCorrect:true,observation:'5 answers the stem.'},{mathematicallyCorrect:false,observation:'3 is smaller; its explanation is valid.'}]}:{})})),theoryObservation:'The complete number-line method is consistent.',sourceObservation:'The actual source supports these comparisons.'}};
}
function diagramReview(f,s,code='\\draw (0,0)--(1,1);') {
 const pair=JSON.parse(fs.readFileSync(path.join(f.root,s.stage.candidatePath)));
 pair.content.theory.intro+=' [tikz]'+code+'[/tikz]';
 f.write(s.stage.candidatePath,pair);s.stage.candidateHash=hashValue(pair);f.save(s);
 const input=reviewInput(f,s);
 input.result.visualReviews=[{where:'theory.intro',accepted:true,solid3d:true,observation:'All labels legible at final size.',geometryObservation:'Endpoints agree with the construction.',paletteObservation:'Black ordinary lines and labels.',visibilityObservation:'Silhouette remains solid; hidden edges checked.',renderReceipt:{path:'.agywork/capture.json',hash:'actual-capture-hash'}}];
 return input;
}
test('canonical visual preflight catches missing typed observations and flags without changing owner/stage bytes',t=>{
 const f=fixture(t),s=f.owned('review'),input=diagramReview(f,s);
 const ledger=path.join(f.root,'booklets/provenance/content-campaign/test/skills/'+s.skillId+'.json'),before=fs.readFileSync(ledger),candidate=fs.readFileSync(path.join(f.root,s.stage.candidatePath));
 const good=preflightReview(f.root,s,input);assert.equal(good.result.visualReviews[0].hash,hashValue(JSON.parse(candidate).content.theory.intro));assert.equal(input.result.visualReviews[0].hash,undefined);
 for(const field of ['observation','geometryObservation','paletteObservation','visibilityObservation','solid3d','renderReceipt']) {
  const bad=structuredClone(input);delete bad.result.visualReviews[0][field];assert.throws(()=>preflightReview(f.root,s,bad),/observation|classification|receipt|required/i,field);
 }
 const unrequired=structuredClone(input);unrequired.result.visualReviews[0].where='practice.foundation[0].solution_text';assert.throws(()=>preflightReview(f.root,s,unrequired),/explicitly flagged canonical/);
 const wrong=structuredClone(input);wrong.result.visualReviews[0].renderedBlockHashes=['wrong'];assert.throws(()=>preflightReview(f.root,s,wrong),/Stale visual/);
 assert.deepEqual(fs.readFileSync(ledger),before);assert.deepEqual(fs.readFileSync(path.join(f.root,s.stage.candidatePath)),candidate);
});
test('unchanged diagram inspections require an explicit canonical flag; semantic findings remain worker decisions',t=>{
 const f=fixture(t),s=f.owned('review'),input=diagramReview(f,s);
 f.write(s.stage.baselinePath,JSON.parse(fs.readFileSync(path.join(f.root,s.stage.candidatePath))));
 assert.throws(()=>preflightReview(f.root,s,input),/changed or explicitly flagged/);
 input.result.flaggedDiagrams=['theory.intro'];input.result.findings=[{observation:'A retained edge may confuse students.',repair:'Author should clarify the drawing.'}];
 const out=preflightReview(f.root,s,input);assert.deepEqual(out.result.outcomes.map(row=>row.verdict),['accepted','accepted']);assert.equal(out.result.findings[0].description,'A retained edge may confuse students. Author should clarify the drawing.');
 input.result.findings=[{}];assert.throws(()=>preflightReview(f.root,s,input),/nonempty/);
});
test('purposeful paint observations use shared scanner including command, style and structural white masks',t=>{
 for(const code of ['\\fill[white] (0,0) circle (1);','\\tikzset{face/.style={fill=blue}}; \\draw[face] (0,0)--(1,0)--(1,1)--cycle;','\\shade (0,0) rectangle (1,1);']) {
  const f=fixture(t),s=f.owned('review'),input=diagramReview(f,s,code);
  assert.throws(()=>preflightReview(f.root,s,input),/purposeful fill\/mask\/marker/);
  input.result.visualReviews[0].purposefulFillObservation='The worker inspected every paint operation and its mathematical purpose or structural mask.';
  assert.equal(preflightReview(f.root,s,input).acceptanceGranted,false);
 }
});
test('canonical source-image, removal, header and MCQ contradiction checks run before handoff',t=>{
 const f=fixture(t),s=f.owned('review');let input=reviewInput(f,s);
 input.result.outcomes[1].options[1].mathematicallyCorrect=true;assert.throws(()=>preflightReview(f.root,s,input),/unique correct answer/);
 s.stage.sourceReview=[{path:f.source,unavailableImages:[{path:'missing.png',reason:'Text suffices.',textAlternative:'Number line.'}]}];f.save(s);input=reviewInput(f,s);assert.throws(()=>preflightReview(f.root,s,input),/unavailable illustration/);
 s.stage.sourceReview=[];s.stage.removals=[{where:'practice.foundation[0]',hash:hashValue(capturePair(f.root,s.skillId).content.practice.foundation[0])}];f.save(s);input=reviewInput(f,s);assert.throws(()=>preflightReview(f.root,s,input),/removed assessment/);
 s.stage.removals=[];const pair=JSON.parse(fs.readFileSync(path.join(f.root,s.stage.candidatePath)));pair.content.theory.steps=['Compare positions'];f.write(s.stage.candidatePath,pair);s.stage.candidateHash=hashValue(pair);f.save(s);input=reviewInput(f,s);assert.throws(()=>preflightReview(f.root,s,input),/steps repair/);
 input.result.stepsRepair={accepted:true,reason:'The worker independently checked the complete changed procedure and dependent solution headers.'};assert.equal(preflightReview(f.root,s,input).result.stepsRepair.candidateHash,s.stage.candidateHash);
});
test('prepared parent reading, source and actual native provenance cannot be bypassed by a new binding',t=>{
 const f=fixture(t),s=f.owned('review'),input=reviewInput(f,s);
 s.owner.workerLineage.profile='stable-worker-lineage-v1';s.owner.prepared.workerLineage=structuredClone(s.owner.workerLineage);f.save(s);input.binding=receiptBinding(f.root,s);
 assert.throws(()=>preflightReview(f.root,s,input),/Missing native reviewerIdentity/);
 input.result.reviewerProfile={reviewerIdentity:'/root/reviewer',model:'gpt-6.1-sol',effort:'high',requestedServiceTier:'default'};assert.equal(preflightReview(f.root,s,input).acceptanceGranted,false);
 input.result.reviewerProfile.reviewerIdentity='/root/foreign';assert.throws(()=>preflightReview(f.root,s,input),/identity alias/);
 s.owner.prepared.prerequisiteContextProfile='foreign';assert.throws(()=>receiptBinding(f.root,s),/prerequisite|captured|profile/i);
 delete s.owner.prepared.prerequisiteContextProfile;fs.appendFileSync(path.join(f.root,f.source),'Changed actual source.');assert.throws(()=>receiptBinding(f.root,s),/Stale source/);
});
test('batch operations are sequential guarded calls with completed and not-run receipts after failure',async t=>{
 const f=fixture(t),s=f.owned('review'),input=reviewInput(f,s),before=fs.readFileSync(path.join(f.root,'booklets/provenance/content-campaign/test/skills/'+s.skillId+'.json'));
 const batch={profile:LEAN_PROFILE,campaignId:'test',operations:[{command:'binding',skillId:s.skillId},{command:'preflight-review',skillId:s.skillId,input},{command:'binding',skillId:f.ids[1]},{command:'binding',skillId:f.ids[2]}]};
 const out=await runGuardedBatch(f.root,batch);assert.equal(out.complete,false);assert.deepEqual(out.operations.map(row=>row.status),['complete','complete','failed','not-run']);assert.deepEqual(fs.readFileSync(path.join(f.root,'booklets/provenance/content-campaign/test/skills/'+s.skillId+'.json')),before);
 await assert.rejects(runGuardedBatch(f.root,{...batch,operations:[batch.operations[0],batch.operations[0]]}),/duplicate/);
 const stale=structuredClone(input);stale.binding.assignmentId='other';const handoff=await runGuardedBatch(f.root,{profile:LEAN_PROFILE,campaignId:'test',operations:[{command:'review',skillId:s.skillId,input:{...stale,receiptStructureOnly:true}}]});assert.match(handoff.operations[0].error,/binding/);assert.deepEqual(fs.readFileSync(path.join(f.root,'booklets/provenance/content-campaign/test/skills/'+s.skillId+'.json')),before);
});
test('batch CLI reserves immutable output before running guarded operations',t=>{
 const f=fixture(t),s=f.owned('review'),input=reviewInput(f,s),out=path.join(f.root,'receipt.json');
 f.write('batch.json',{profile:LEAN_PROFILE,campaignId:'test',operations:[{command:'review',skillId:s.skillId,input:{...input,receiptStructureOnly:true}}]});fs.writeFileSync(out,'historical');
 const before=fs.readFileSync(path.join(f.root,'booklets/provenance/content-campaign/test/skills/'+s.skillId+'.json'));
 const run=spawnSync(process.execPath,[path.resolve('scripts/content/campaign-lean-cli.mjs'),'batch','--root',f.root,'--profile',LEAN_PROFILE,'--input',path.join(f.root,'batch.json'),'--out',out],{encoding:'utf8'});
 assert.notEqual(run.status,0);assert.match(run.stderr,/EEXIST/);assert.deepEqual(fs.readFileSync(path.join(f.root,'booklets/provenance/content-campaign/test/skills/'+s.skillId+'.json')),before);assert.equal(fs.readFileSync(out,'utf8'),'historical');
});
test('batch review goes through the normal ledger and preserves an accepted receipt when the next member fails',async t=>{
 const f=fixture(t),s=f.owned('review');s.attempts=[];f.save(s);
 const input={...reviewInput(f,s),receiptStructureOnly:true};
 const out=await runGuardedBatch(f.root,{profile:LEAN_PROFILE,campaignId:'test',operations:[{command:'review',skillId:s.skillId,input},{command:'binding',skillId:f.ids[1]}]});
 assert.deepEqual(out.operations.map(row=>row.status),['complete','failed']);const recorded=f.read(s.skillId);assert.equal(recorded.status,'accepted');assert.equal(recorded.owner,undefined);assert.equal(recorded.review.outcomes[1].options[0].mathematicallyCorrect,true);assert.equal(recorded.attempts.length,1);
 assert.equal(input.result.outcomes[0].hash,undefined,'original worker input remains immutable');
});
test('explicit publication stage is checked again inside the canonical ledger lock',async t=>{
 const f=fixture(t),s=f.owned('review');s.attempts=[];f.save(s);
 await runGuardedBatch(f.root,{profile:LEAN_PROFILE,campaignId:'test',operations:[{command:'review',skillId:s.skillId,input:{...reviewInput(f,s),receiptStructureOnly:true}}]});
 const file=path.join(f.root,'booklets/provenance/content-campaign/test/skills/'+s.skillId+'.json'),before=fs.readFileSync(file);let published=false;
 await assert.rejects(publishAssignment(f.root,{campaignId:'test',skillId:s.skillId,expectedStageHash:'superseded-stage',publisher:async()=>{published=true;}}),/Stale explicitly requested/);
 assert.equal(published,false);assert.deepEqual(fs.readFileSync(file),before);
});
