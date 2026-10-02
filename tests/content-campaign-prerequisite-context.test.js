import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {prepareAssignment,readSkill,hashValue,recordPrerequisiteContextRead,stageAssignment,recordReview,assessmentItems} from '../scripts/content/campaign-support.mjs';
import {PREREQUISITE_CONTEXT_PROFILE,validatePrerequisiteContext} from '../scripts/content/campaign-prerequisite-context.mjs';
import {scopeDependencies,validateSourceImages} from '../scripts/content/campaign-sources.mjs';
import {inlineEvidencePrompt} from '../scripts/content/campaign-runner.mjs';import {runBoundedAssignment} from '../scripts/content/campaign-bounded.mjs';

function fixture(t,{real=false,role='author',theory,kind='native'}={}) {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'prerequisite-context-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const write=(name,value)=>{const p=path.join(root,name);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value));};
 const profile={model:'gpt-6.1-sol',effort:'medium',requestedServiceTier:'default',maxWorkers:3,executionOverrideProfile:'user-requested-sol61-medium-v1',reasoningOverride:{effort:'medium',reason:'explicit fixture Medium override'}};
 let state,sources;
 if(real){
  state=JSON.parse(fs.readFileSync('booklets/provenance/content-campaign/worked-examples-2026-09/skills/box-plot-percentages.json'));
  state.owner={workerId:'fixture-box-author',assignmentId:'fixture-box-assignment',role,profile,workerLineage:{profile:'stable-worker-lineage-v1',kind,actorId:'/root/fixture_author',origin:'coordinator-bound'}};
  for(const name of ['skills','topics','courses','dotpoints'])write(`data/${name}.json`,fs.readFileSync(`data/${name}.json`));
  for(const id of ['box-plot-percentages','box-plots'])write(`public/content/${id}.json`,fs.readFileSync(`public/content/${id}.json`));
  write('public/quizzes/box-plot-percentages.json',fs.readFileSync('public/quizzes/box-plot-percentages.json'));
  sources=JSON.parse(fs.readFileSync('.agywork/content-campaign/worked-examples-2026-09/box-plot-percentages/source-plan-bounded.json')).sources.map(r=>({...r,hash:hashValue(fs.readFileSync(r.path)),locator:'Complete current Box Plot selected source unit',support:'direct'}));
  for(const r of sources){r.images=validateSourceImages(process.cwd(),r);write(r.path,fs.readFileSync(r.path));for(const i of r.images)write(i.path,fs.readFileSync(i.path));}
 }else{
  const skills=[{id:'child',stage:4,title:'Child',dotPointIds:['dp'],prereqs:['parent']},{id:'parent',stage:4,title:'Parent',dotPointIds:['dp'],prereqs:[]}];
  write('data/skills.json',skills);write('data/topics.json',[{id:'topic',stage:4,courses:['course']}]);write('data/courses.json',[{id:'course',stage:4}]);write('data/dotpoints.json',[{id:'dp',topicId:'topic',text:'Use taught addition.',order:1}]);
  const content={skillId:'child',atomType:'T',theory:{intro:'Add the numbers.',facts:['Addition combines numbers.']},practice:{foundation:[{question_text:'Calculate $7+4$.',solution_text:'$7+4=11$',structure:'add'}]}};
  write('public/content/child.json',content);write('public/content/parent.json',{skillId:'parent',theory:theory||{intro:'Add numbers.',facts:['Add their quantities.'],workedExamples:[{question_text:'Add $3+8$.',solution_text:'$3+8=11$'}]}});
  const source='booklets/mathsmap-sources/Stage 4/Addition.md';write(source,'# Addition\nAdd $3+8$.\n$3+8=11$');sources=[{path:source,hash:hashValue(fs.readFileSync(path.join(root,source))),startLine:1,endLine:3,locator:'Whole addition teaching',support:'direct'}];
  state={skillId:'child',status:'pending',scope:{stage:4,topicId:'topic',governingDotPoints:[{id:'dp'}]},sources,owner:{workerId:'fixture-worker',assignmentId:'fixture-assignment',role,profile,workerLineage:{profile:'stable-worker-lineage-v1',kind,actorId:'/root/fixture_'+role,origin:'coordinator-bound'}}};
  if(role==='review'){write('candidate.json',{content,quiz:null,expected:{contentHash:hashValue(fs.readFileSync(path.join(root,'public/content/child.json'),'utf8')),quizHash:null}});state.status='staged';state.stage={candidatePath:'candidate.json',expected:JSON.parse(fs.readFileSync(path.join(root,'candidate.json'))).expected,coverage:{},sourceReview:sources};}
 }
 state.attempts=[];const statePath=`booklets/provenance/content-campaign/test/skills/${state.skillId}.json`,save=v=>write(statePath,v);write('booklets/provenance/content-campaign/test/campaign.json',{skillIds:[state.skillId]});save(state);
 const read=()=>readSkill(root,'test',state.skillId),prepare=(options={})=>prepareAssignment(root,{campaignId:'test',skillId:state.skillId,workerId:state.owner.workerId,sources,...options});
 return {root,write,state,statePath,sources,save,read,prepare,load:p=>JSON.parse(fs.readFileSync(path.join(root,p))),parentPath:real?'public/content/box-plots.json':'public/content/parent.json'};
}
function acknowledgment(f){const state=f.read(),m=f.load(state.owner.prepared.prerequisiteContextReference.manifest.path);return {complete:true,observation:'Fixture explicitly models personally reading all complete parent teaching, not file existence.',parents:m.parents.map(({id,theoryHash,contentHash})=>({id,theoryHash,contentHash})),packs:m.packs.map(({path,hash,literalHash})=>({path,hash,literalHash,read:true,observation:'Fixture explicit per-pack reading of every contained base/example unit.'}))};}
const acknowledge=f=>recordPrerequisiteContextRead(f.root,{campaignId:'test',skillId:f.state.skillId,workerId:f.state.owner.workerId,acknowledgment:acknowledgment(f)});
const opt=f=>f.prepare({prerequisiteContextProfile:PREREQUISITE_CONTEXT_PROFILE});

test('actual complete Box Plot parent and all whole questions fit native profile without changing dependencies',t=>{
 const f=fixture(t,{real:true}),before=scopeDependencies(f.root,f.state.skillId,f.state.scope,f.sources),theory=f.load(f.parentPath).theory;
 let failure;try{f.prepare();}catch(e){failure=e;}assert.match(failure?.message||'',/Whole-question packet exceeds context bound/);assert.equal(failure.packetBudget.limit,24000);assert.ok(failure.packetBudget.variableChars>24000);assert.equal(f.read().owner.prepared,undefined);
 const prepared=opt(f),state=f.read(),deps=scopeDependencies(f.root,f.state.skillId,f.state.scope,prepared.sourceReferences);assert.equal(before.hash,deps.hash);assert.equal(prepared.dependencyHash,deps.hash);assert.deepEqual(before.context.prerequisiteTheory,deps.context.prerequisiteTheory);
 const packets=prepared.packets.map(p=>f.load(p.path));assert.ok(packets.every(p=>JSON.stringify(p).length<=24000));
 const original=assessmentItems(f.load(state.owner.prepared.snapshotPath).content,f.load(state.owner.prepared.snapshotPath).quiz).filter(i=>i.kind!=='example'&&i.kind!=='theory');assert.deepEqual(packets.flatMap(p=>p.items),original);assert.deepEqual(packets.flatMap(p=>p.items).find(i=>i.where==='practice.foundation[0]'),original[0]);
 const manifest=validatePrerequisiteContext(f.root,state,{requireRead:false}),packs=manifest.packs.map(p=>f.load(p.path));assert.equal(manifest.parents[0].theoryHash,hashValue(theory));assert.equal(manifest.parents[0].contentHash,hashValue(fs.readFileSync(path.join(f.root,f.parentPath))));assert.deepEqual(packs.flatMap(p=>p.units)[0].value,theory);assert.equal(packs.flatMap(p=>p.units)[0].value.workedExamples.length,theory.workedExamples.length);
 t.diagnostic(JSON.stringify({diagnosedOldWholeF0:failure.packetBudget.variableChars,oldContextField:failure.packetBudget.fields.context,parentTheoryChars:JSON.stringify(theory).length,completePrerequisiteArrayChars:JSON.stringify(before.context.prerequisiteTheory).length,fullContextChars:JSON.stringify(before.context).length,parentTheoryHash:hashValue(theory),parentContentHash:manifest.parents[0].contentHash,dependencyHash:deps.hash,newPacketChars:prepared.packets.map(p=>p.variableChars),parentPackChars:manifest.packs.map(p=>p.variableChars),allWhole:original.length,parentExamples:theory.workedExamples.length}));
});
for(const role of ['author','review'])test(`${role} gate refuses unread parent and accepts only explicit owned complete reading`,t=>{
 const f=fixture(t,{role}),prepared=opt(f),state=f.read();assert.throws(()=>validatePrerequisiteContext(f.root,state),/has not been acknowledged read/);
 const args={campaignId:'test',skillId:f.state.skillId,workerId:f.state.owner.workerId};assert.throws(()=>role==='author'?stageAssignment(f.root,args):recordReview(f.root,args),/has not been acknowledged read/);
 const bad=acknowledgment(f);bad.packs[0].observation='';assert.throws(()=>recordPrerequisiteContextRead(f.root,{...args,acknowledgment:bad}),/per-pack reading/);delete bad.packs[0].read;assert.throws(()=>recordPrerequisiteContextRead(f.root,{...args,acknowledgment:bad}),/per-pack reading/);
 const receipt=acknowledge(f);assert.ok(receipt.literalHash);validatePrerequisiteContext(f.root,f.read());assert.throws(()=>recordPrerequisiteContextRead(f.root,{...args,acknowledgment:acknowledgment(f)}),/already recorded/);assert.throws(()=>recordPrerequisiteContextRead(f.root,{...args,workerId:'foreign',acknowledgment:acknowledgment(f)}),/owned|Owner|owner|Worker/);
 const reprepared=f.prepare();assert.deepEqual(reprepared.packets,prepared.packets);assert.deepEqual(reprepared.prerequisiteContextReference,prepared.prerequisiteContextReference);assert.deepEqual(f.read().owner.prepared.prerequisiteReadReceipt,receipt);validatePrerequisiteContext(f.root,f.read());
 assert.equal(prepared.prerequisiteContextProfile,PREREQUISITE_CONTEXT_PROFILE);
});
test('parent over24k splits only complete base/example units and reconstructs exact full Theory including figures',t=>{
 const theory={intro:'Complete base teaching.',facts:['A fact.'],diagram:'\\begin{tikzpicture}complete native figure\\end{tikzpicture}',workedExample:{question_text:'Singular complete example.',solution_text:'Complete singular solution.'},workedExamples:Array.from({length:4},(_,i)=>({question_text:`Whole example ${i}.`,solution_text:'Complete reasoning. '.repeat(500)}))};const f=fixture(t,{theory}),p=opt(f),m=validatePrerequisiteContext(f.root,f.read(),{requireRead:false});assert.ok(m.packs.length>1);assert.ok(m.packs.every(p=>p.variableChars<=24000));const units=m.packs.flatMap(p=>f.load(p.path).units);assert.equal(units.length,6);assert.equal(units[0].value.diagram,theory.diagram);assert.deepEqual(units.filter(u=>u.where.startsWith('workedExamples')).map(u=>u.value),theory.workedExamples);assert.equal(m.parents[0].theoryHash,hashValue(theory));acknowledge(f);validatePrerequisiteContext(f.root,f.read());
});
test('indivisible oversized base or example fails clearly without evidence, truncation or cap increase',t=>{
 for(const theory of [{intro:'x'.repeat(25000),workedExamples:[]},{intro:'Base.',workedExamples:[{question_text:'Whole.',solution_text:'x'.repeat(25000)}]}]){const f=fixture(t,{theory});assert.throws(()=>opt(f),/indivisible complete teaching unit exceeds bound/);assert.equal(f.read().owner.prepared,undefined);assert.throws(()=>f.prepare({prerequisiteContextProfile:PREREQUISITE_CONTEXT_PROFILE,maxVariableChars:30000}),/cannot raise/);}
});
test('native profile rejects external preparation and every external/no-tools dispatch before calling a runner',async t=>{
 const external=fixture(t,{kind:'external-ephemeral'});assert.throws(()=>opt(external),/owned native actor/);const f=fixture(t),p=opt(f),s=f.read();assert.throws(()=>inlineEvidencePrompt(f.root,p,s),/native-only/);let calls=0;await assert.rejects(runBoundedAssignment({root:f.root,prepared:p,state:s,runner:async()=>{calls++;return {};}}),/native-only/);assert.equal(calls,0);
});
test('missing, altered, stale and foreign references fail closed, including full parent content unrelated to Theory',t=>{
 for(const mutation of ['missing','altered','stale-parent','parent-practice','taxonomy','source','scope','owner','profile','receipt','packet','reference']){
  const f=fixture(t),p=opt(f);acknowledge(f);let s=f.read(),m=f.load(p.prerequisiteContextReference.manifest.path);
  if(mutation==='missing')fs.unlinkSync(path.join(f.root,m.packs[0].path));
  if(mutation==='altered')fs.appendFileSync(path.join(f.root,m.packs[0].path),' ');
  if(mutation==='stale-parent'){let x=f.load(f.parentPath);x.theory.facts.push('Changed.');f.write(f.parentPath,x);}
  if(mutation==='parent-practice'){let x=f.load(f.parentPath);x.practice={foundation:[{question_text:'New parent practice.'}]};f.write(f.parentPath,x);}
  if(mutation==='taxonomy'){let x=f.load('data/skills.json');x[1].title='Changed parent';f.write('data/skills.json',x);}
  if(mutation==='source')fs.appendFileSync(path.join(f.root,f.sources[0].path),'changed');
  if(mutation==='scope'){s.scope.topicId='foreign';f.save(s);}
  if(mutation==='owner'){s.owner.workerLineage.actorId='/root/other';f.save(s);}
  if(mutation==='profile'){s.owner.profile.effort='high';delete s.owner.profile.executionOverrideProfile;delete s.owner.profile.reasoningOverride;f.save(s);}
  if(mutation==='receipt')fs.appendFileSync(path.join(f.root,s.owner.prepared.prerequisiteReadReceipt.path),' ');
  if(mutation==='packet')fs.appendFileSync(path.join(f.root,p.packets[0].path),' '); // JSON whitespace alone does not change packet identity, but literal reading artifacts remain exact.
  if(mutation==='reference'){delete s.owner.prepared.prerequisiteContextReference;f.save(s);}
  if(mutation==='packet'){let x=f.load(p.packets[0].path);delete x.prerequisiteContextReference;f.write(p.packets[0].path,x);}
  assert.throws(()=>validatePrerequisiteContext(f.root,f.read()),undefined,mutation);
 }
});
test('reading acknowledgment cannot omit a parent/pack, swap owner, or reuse author receipt for reviewer',t=>{
 const f=fixture(t);opt(f);let a=acknowledgment(f);a.parents=[];assert.throws(()=>recordPrerequisiteContextRead(f.root,{campaignId:'test',skillId:'child',workerId:f.state.owner.workerId,acknowledgment:a}),/parent Theory/);a=acknowledgment(f);a.packs=[];assert.throws(()=>recordPrerequisiteContextRead(f.root,{campaignId:'test',skillId:'child',workerId:f.state.owner.workerId,acknowledgment:a}),/pack/);acknowledge(f);let s=f.read();s.owner.role='review';f.save(s);assert.throws(()=>validatePrerequisiteContext(f.root,f.read()),/foreign|identity/);
});
test('foreign copied artifact paths and stripped captured profile cannot bypass the native reading gate',t=>{
 const f=fixture(t),p=opt(f);let s=f.read(),r=s.owner.prepared.prerequisiteContextReference.manifest;const foreign='foreign/'+path.basename(r.path);f.write(foreign,fs.readFileSync(path.join(f.root,r.path)));r.path=foreign;f.save(s);assert.throws(()=>validatePrerequisiteContext(f.root,f.read()),/foreign artifact owner/);
 const g=fixture(t);opt(g);s=g.read();delete s.owner.prepared.prerequisiteContextProfile;delete s.owner.prepared.prerequisiteContextReference;g.save(s);assert.throws(()=>stageAssignment(g.root,{campaignId:'test',skillId:'child',workerId:g.state.owner.workerId}),/missing\/unknown captured profile/);
});
test('normal author stage and independent review retain their separate complete reading receipts and CAS gates',t=>{
 const f=fixture(t);opt(f);const authorReceipt=acknowledge(f),s=f.read(),pair=f.load(s.owner.prepared.snapshotPath),content=pair.content;content.theory.workedExamples=[{question_text:'Calculate $3+8$.',solution_text:'$3+8=11$'}];const coverage={methods:[{id:'add',description:'Add the quantities.',sourceRefs:[0]}],items:assessmentItems(content,null,false).map(i=>({where:i.where,hash:i.hash,methods:['add']}))},metrics={model:'gpt-6.1-sol',effort:'medium',requestedServiceTier:'default',authorIdentity:s.owner.workerLineage.actorId,workerId:s.owner.workerId,sessionId:s.owner.workerId};
 const args={campaignId:'test',skillId:'child',workerId:s.owner.workerId,candidateContent:content,coverage,sourceReview:f.sources.map(r=>({...r,observation:'Whole source addition example read.',adjustments:'Keep taught direct addition.'})),metrics,validatePair:()=>({errors:[],warnings:[]})};
 const before=fs.readFileSync(path.join(f.root,'public/content/child.json'),'utf8');f.write('public/content/child.json',before+' ');assert.throws(()=>stageAssignment(f.root,args),/Stale live content/);f.write('public/content/child.json',before);stageAssignment(f.root,args);let staged=f.read();assert.deepEqual(staged.stage.prerequisiteReading.receipt,authorReceipt);const authorReading=staged.stage.prerequisiteReading;
 staged.owner={...s.owner,workerId:'different-reviewer',assignmentId:'different-review-assignment',role:'review',workerLineage:{...s.owner.workerLineage,actorId:'/root/fixture_review'}};delete staged.owner.prepared;staged.owner.preparedHistory=[];f.state.owner=staged.owner;f.save(staged);opt(f);
 const reviewerState=f.read(),candidate=f.load(reviewerState.stage.candidatePath),reviewArgs={campaignId:'test',skillId:'child',workerId:staged.owner.workerId,stageHash:reviewerState.stage.hash,outcomes:assessmentItems(candidate.content,null,false).map(i=>({where:i.where,hash:i.hash,verdict:'accepted',independentSolution:i.kind==='example'?'3+8=11':'7+4=11',observation:'Independent direct sum and complete method checked.'})),theoryObservation:'Direct addition taught and headers agree.',sourceObservation:'Whole simple source and complete prerequisite read.',findings:[],reviewerProfile:{model:'gpt-6.1-sol',effort:'medium',requestedServiceTier:'default',reviewerIdentity:'/root/fixture_review',workerId:'different-reviewer',sessionId:'different-reviewer'}};
 assert.throws(()=>recordReview(f.root,reviewArgs),/has not been acknowledged read/);const reviewerReceipt=acknowledge(f);assert.notEqual(reviewerReceipt.path,authorReceipt.path);recordReview(f.root,reviewArgs);const accepted=f.read();assert.equal(accepted.status,'accepted');assert.deepEqual(accepted.stage.prerequisiteReading,authorReading);assert.deepEqual(accepted.review.prerequisiteReading.receipt,reviewerReceipt);assert.notEqual(accepted.review.prerequisiteReading.reference.identityHash,authorReading.reference.identityHash);
});
test('legacy preparation has identical reprepare bytes and cannot migrate; profile caches are separate',t=>{
 const f=fixture(t),old=f.prepare(),bytes=old.packets.map(p=>fs.readFileSync(path.join(f.root,p.path),'utf8'));assert.equal(old.prerequisiteContextProfile,undefined);assert.ok(f.load(old.packets[0].path).context.prerequisiteTheory[0].theory.workedExamples.length);assert.throws(()=>opt(f),/Cannot migrate/);const again=f.prepare();assert.deepEqual(again.packets,old.packets);assert.deepEqual(again.packets.map(p=>fs.readFileSync(path.join(f.root,p.path),'utf8')),bytes);
 const g=fixture(t),fresh=opt(g);assert.notEqual(fresh.packets[0].path,old.packets[0].path);assert.equal(fresh.dependencyHash,old.dependencyHash);assert.equal(f.load(old.packets[0].path).prerequisiteContextReference,undefined);assert.equal(g.load(fresh.packets[0].path).context.prerequisiteTheory[0].theory,undefined);
});
