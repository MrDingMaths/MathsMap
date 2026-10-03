import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { hashValue, scopeDependencies } from '../scripts/content/campaign-sources.mjs';
import { REPAIR_METADATA_PROFILE, REPAIR_METADATA_READ_CONTRACT, planRepairMetadata, saveRepairMetadata, validateRepairMetadata, saveRepairMetadataRead } from '../scripts/content/campaign-repair-metadata.mjs';
import { prepareAssignment, readSkill, capturePair, assessmentItems, requirePrepared, loadRepairMetadata, loadPreviousReview, recordRepairMetadataRead, recordPrerequisiteContextRead, stageAssignment } from '../scripts/content/campaign-support.mjs';
import { PREREQUISITE_CONTEXT_PROFILE, validatePrerequisiteContext } from '../scripts/content/campaign-prerequisite-context.mjs';
import { inlineEvidencePrompt } from '../scripts/content/campaign-runner.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'repair-metadata-')); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (name, value) => { const f = path.join(root, name); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof value === 'string' ? value : JSON.stringify(value)); };
  write('data/skills.json', [{ id:'child', stage:4, title:'Child', dotPointIds:['dp'], prereqs:[] }]);
  write('data/topics.json', [{ id:'topic', stage:4, courses:['course'] }]); write('data/courses.json', [{ id:'course', stage:4 }]); write('data/dotpoints.json', [{ id:'dp', topicId:'topic', text:'Add terms.', order:1 }]);
  const snapshot = { content:{ skillId:'child', theory:{intro:'Add terms.'}, practice:{foundation:[{question_text:'Find 3+4.',solution_text:'7.'}]} }, quiz:null };
  write('public/content/child.json', snapshot.content); write('work/snapshot.json', snapshot);
  const state = {skillId:'child',status:'repair-needed',scope:{stage:4,topicId:'topic',governingDotPoints:[{id:'dp'}]},stage:{hash:'stage-one',candidateHash:hashValue(snapshot)},review:{outcomes:[{where:'practice.foundation[0]',verdict:'accepted',independentSolution:'3+4=7'}]},owner:{workerId:'worker',assignmentId:'assignment',role:'author',workerLineage:{kind:'native',actorId:'/root/fixture_author'},profile:{model:'gpt-6.1-sol',effort:'medium',requestedServiceTier:'default',maxWorkers:3,executionOverrideProfile:'user-requested-sol61-medium-v1',reasoningOverride:{effort:'medium',reason:'Explicit fixture'}}}};
  const deps = scopeDependencies(root,'child',state.scope,[]), metadata={priorFindings:['Full finding '.repeat(4000)],repairTargets:[{where:'theory.intro',hash:'whole-intro'}],previousReview:{findings:[{observation:'Every complete actual finding '.repeat(1500)}],outcomes:state.review.outcomes}};
  const plan = planRepairMetadata(root,state,path.join(root,'work'),snapshot,[],deps,metadata); saveRepairMetadata(plan);
  const compact={reference:plan.reference},packet={repairMetadataProfile:REPAIR_METADATA_PROFILE,repairMetadataReference:plan.reference,nativeRepairMetadataInstruction:REPAIR_METADATA_READ_CONTRACT,priorFindings:compact,repairTargets:compact,previousReview:compact,items:[snapshot.content.practice.foundation[0]]};write('work/packet.json',packet);
  state.owner.prepared={snapshotPath:'work/snapshot.json',sources:[],dependencyHash:deps.hash,packets:[{path:'work/packet.json'}],repairMetadataProfile:REPAIR_METADATA_PROFILE,repairMetadataReference:plan.reference};
  const validate=(s=state,m=metadata,options={})=>validateRepairMetadata(root,s,m,options);
  const acknowledge=()=>{const value=validate(state,metadata,{requireRead:false});state.owner.prepared.repairMetadataReadReceipt=saveRepairMetadataRead(root,state,value,{complete:true,reference:plan.reference,observation:'Personally read every full finding, target and previous outcome.'});};
  return {root,state,metadata,plan,packet,write,validate,acknowledge};
}
test('complete oversized repair metadata stays literal and bound, with explicit reading and preserved positive outcomes',t=>{
  const f=fixture(t),accepted=hashValue(f.state.review.outcomes);assert.ok(JSON.stringify(f.metadata).length>24000);assert.ok(JSON.stringify(f.packet).length<24000);
  assert.deepEqual(f.validate(f.state,f.metadata,{requireRead:false}).metadata,f.metadata);assert.throws(()=>f.validate(),/has not been acknowledged read/);
  f.acknowledge();assert.deepEqual(f.validate().metadata.previousReview.outcomes,f.state.review.outcomes);assert.equal(hashValue(f.state.review.outcomes),accepted);
  assert.throws(()=>saveRepairMetadataRead(f.root,f.state,f.plan.value,{complete:true,reference:f.plan.reference,observation:'Read.'}),/already recorded/);
  saveRepairMetadata(f.plan);assert.equal(hashValue(fs.readFileSync(f.plan.file)),f.plan.reference.literalHash);
});
for(const mutation of ['missing','literal','foreign','stage','candidate','assignment','actor','snapshot','source','findings','targets','outcomes','profile','packet','packet-overflow','read-receipt'])test('rejects '+mutation+' metadata evidence',t=>{
  const f=fixture(t);f.acknowledge();
  if(mutation==='missing')fs.unlinkSync(f.plan.file);
  if(mutation==='literal')fs.appendFileSync(f.plan.file,' ');
  if(mutation==='foreign'){const p='foreign/'+path.basename(f.plan.file);f.write(p,fs.readFileSync(f.plan.file,'utf8'));f.state.owner.prepared.repairMetadataReference.path=p;}
  if(mutation==='stage')f.state.stage.hash='changed';
  if(mutation==='candidate')f.state.stage.candidateHash='changed';
  if(mutation==='assignment')f.state.owner.assignmentId='foreign';
  if(mutation==='actor')f.state.owner.workerLineage.actorId='/root/foreign';
  if(mutation==='snapshot')f.write('work/snapshot.json',{content:{theory:{intro:'Changed'}},quiz:null});
  if(mutation==='source')f.state.owner.prepared.dependencyHash='changed';
  if(mutation==='findings')f.metadata.priorFindings=[];
  if(mutation==='targets')f.metadata.repairTargets=[];
  if(mutation==='outcomes')f.metadata.previousReview.outcomes=[];
  if(mutation==='profile')delete f.state.owner.prepared.repairMetadataProfile;
  if(mutation==='packet'){const p=structuredClone(f.packet);delete p.previousReview;f.write('work/packet.json',p);}
  if(mutation==='packet-overflow')f.write('work/packet.json',{...f.packet,extra:'x'.repeat(24000)});
  if(mutation==='read-receipt')fs.appendFileSync(path.join(f.root,f.state.owner.prepared.repairMetadataReadReceipt.path),' ');
  assert.throws(()=>f.validate(),/Repair metadata:/);
});
test('rejects external ownership and incomplete or foreign reading acknowledgment',t=>{
 const f=fixture(t);f.state.owner.workerLineage.kind='external-ephemeral';assert.throws(()=>f.validate(f.state,f.metadata,{requireRead:false}),/native actor/);f.state.owner.workerLineage.kind='native';
 for(const acknowledgment of [{complete:false,reference:f.plan.reference,observation:'Read.'},{complete:true,reference:f.plan.reference,observation:''},{complete:true,reference:{...f.plan.reference,hash:'foreign'},observation:'Read.'}])assert.throws(()=>saveRepairMetadataRead(f.root,f.state,f.plan.value,acknowledgment),/explicit complete/);
});

function normalFixture(t) {
 const f=fixture(t),s=f.state;delete s.owner.prepared;
 const content=JSON.parse(fs.readFileSync(path.join(f.root,'public/content/child.json')));content.theory.workedExamples=[{question_text:'Find 3+4.',solution_text:'3+4=7.'}];f.write('public/content/child.json',content);
 const pair=capturePair(f.root,'child');f.write('work/original.json',pair);
 const source='booklets/mathsmap-sources/Stage 4/Add terms.md';f.write(source,'# Addition\nAdd 3+4.\n3+4=7.');
 const sources=[{path:source,hash:hashValue(fs.readFileSync(path.join(f.root,source))),startLine:1,endLine:3,locator:'Complete addition unit',support:'direct'}];
 const reviewed=sources.map(r=>({...r,observation:'Complete source addition verified.',adjustments:'Retain direct addition.'}));
 const coverage={methods:[{id:'add',description:'Add the numbers.',sourceRefs:[0]}],items:assessmentItems(content,null,false).map(i=>({where:i.where,hash:i.hash,methods:['add']}))};
 s.stage={...s.stage,candidatePath:'work/original.json',baselinePath:'work/original.json',candidateHash:hashValue({content,quiz:null}),expected:pair.expected,sourceReview:reviewed,dependencyHash:scopeDependencies(f.root,'child',s.scope,reviewed).hash,coverage};
 s.pending=f.metadata.priorFindings;s.review={reviewer:'independent-reviewer',stageHash:s.stage.hash,reviewedAt:'2026-10-03T00:00:00.000Z',findings:f.metadata.previousReview.findings,outcomes:assessmentItems(content,null,false).map(i=>({where:i.where,hash:i.hash,verdict:'accepted',independentSolution:'3+4=7',observation:'Independent fixture addition.'}))};
 s.findingRegister=[{stageHash:s.stage.hash,targets:[{where:'theory.intro',hash:hashValue(content.theory.intro)}]}];s.sources=sources;s.attempts=[];
 const statePath='booklets/provenance/content-campaign/test/skills/child.json';f.write('booklets/provenance/content-campaign/test/campaign.json',{campaignId:'test',skillIds:['child']});
 const save=()=>f.write(statePath,s);save();const read=()=>readSkill(f.root,'test','child');
 const args={campaignId:'test',skillId:'child',workerId:s.owner.workerId};
 const prepare=(options={})=>prepareAssignment(f.root,{...args,prerequisiteContextProfile:PREREQUISITE_CONTEXT_PROFILE,...options});
 const ackParent=()=>{const state=read(),m=validatePrerequisiteContext(f.root,state,{requireRead:false});return recordPrerequisiteContextRead(f.root,{...args,acknowledgment:{complete:true,observation:'Every complete fixture prerequisite pack read.',parents:m.parents.map(({id,theoryHash,contentHash})=>({id,theoryHash,contentHash})),packs:m.packs.map(p=>({path:p.path,hash:p.hash,literalHash:p.literalHash,read:true,observation:'Whole pack read.'}))}});};
 const ackMetadata=()=>{const state=read(),value=loadRepairMetadata(f.root,{...state.owner.prepared,sourceReferences:state.owner.prepared.sources},state);assert.deepEqual(value.metadata.previousReview.findings,s.review.findings);return recordRepairMetadataRead(f.root,{...args,acknowledgment:{complete:true,reference:state.owner.prepared.repairMetadataReference,observation:'Personally read every complete finding, target and previous review.'}});};
 return {...f,s,content,sources,reviewed,coverage,read,save,prepare,ackParent,ackMetadata,args};
}
test('normal explicit oversized native preparation, both reading gates, resume and stage preserve exact positive outcomes',t=>{
 const f=normalFixture(t);assert.throws(()=>f.prepare(),/Scope\/theory packet exceeds/);assert.equal(f.read().owner.prepared,undefined);
 const p=f.prepare({repairMetadataProfile:REPAIR_METADATA_PROFILE});const packets=p.packets.map(r=>JSON.parse(fs.readFileSync(path.join(f.root,r.path))));assert.ok(packets.every(x=>JSON.stringify(x).length<=24000));assert.deepEqual(packets.flatMap(x=>x.items.map(({priorReview,...i})=>i)),assessmentItems(f.content,null).filter(i=>i.kind!=='example'&&i.kind!=='theory'));
 assert.deepEqual(loadPreviousReview(f.root,p,f.read(),packets).findings,f.s.review.findings);assert.throws(()=>inlineEvidencePrompt(f.root,p,f.read()),/native-only/);
 assert.throws(()=>requirePrepared(f.root,f.read(),'author'),/prerequisite.*read|acknowledged read/);f.ackParent();assert.throws(()=>requirePrepared(f.root,f.read(),'author'),/metadata has not been acknowledged read/);
 assert.throws(()=>recordRepairMetadataRead(f.root,{...f.args,workerId:'foreign',acknowledgment:{}}),/own/);const receipt=f.ackMetadata();requirePrepared(f.root,f.read(),'author');
 const re=f.prepare({repairMetadataProfile:REPAIR_METADATA_PROFILE});assert.deepEqual(re.packets,p.packets);assert.deepEqual(f.read().owner.prepared.repairMetadataReadReceipt,receipt);
 const stageArgs={...f.args,candidateContent:f.content,candidateQuiz:null,coverage:f.coverage,sourceReview:f.reviewed,metrics:{model:'gpt-6.1-sol',effort:'medium',requestedServiceTier:'default',authorIdentity:'/root/fixture_author',workerId:'worker',sessionId:'worker'},validatePair:()=>({errors:[],warnings:[]})};
 const oldOutcomes=hashValue(f.s.review.outcomes);stageAssignment(f.root,stageArgs);const staged=f.read();assert.equal(staged.status,'staged');assert.equal(staged.stage.reusedOutcomes.length,2);assert.equal(hashValue(staged.stage.reusedOutcomes.map(({reusedFrom,...o})=>o)),oldOutcomes);assert.deepEqual(staged.stage.repairMetadataReading.receipt,receipt);
});
test('normal metadata profile cannot migrate historical preparation or opt into a small/non-native repair',t=>{
 const f=normalFixture(t);f.s.owner.prepared={prerequisiteContextProfile:PREREQUISITE_CONTEXT_PROFILE};f.save();assert.throws(()=>f.prepare({repairMetadataProfile:REPAIR_METADATA_PROFILE}),/Cannot migrate/);
 const small=normalFixture(t);small.s.pending=['Short finding'];small.s.review.findings=['Short finding'];small.save();assert.throws(()=>small.prepare({repairMetadataProfile:REPAIR_METADATA_PROFILE}),/fresh oversized/);
 const external=normalFixture(t);external.s.owner.workerLineage.kind='external-ephemeral';external.save();assert.throws(()=>external.prepare({repairMetadataProfile:REPAIR_METADATA_PROFILE}),/native reviewed repair/);
 const cap=normalFixture(t);assert.throws(()=>cap.prepare({repairMetadataProfile:REPAIR_METADATA_PROFILE,maxVariableChars:60000}),/cannot raise/);
});
test('normal stage/lean gate detects stripped captured profile and packet metadata',t=>{
 const f=normalFixture(t);f.prepare({repairMetadataProfile:REPAIR_METADATA_PROFILE});f.ackParent();f.ackMetadata();const s=f.read();delete s.owner.prepared.repairMetadataProfile;delete s.owner.prepared.repairMetadataReference;delete s.owner.prepared.repairMetadataReadReceipt;f.write('booklets/provenance/content-campaign/test/skills/child.json',s);assert.throws(()=>requirePrepared(f.root,f.read(),'author'),/missing\/unknown captured profile/);
});
test('actual ConstructGraph39-finding repair fits all complete items with unchanged source, candidate and reviewer bytes',t=>{
 const actual=JSON.parse(fs.readFileSync('tests/fixtures/content-campaign/construct-graph-repair-metadata.json'));
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'actual-graph-metadata-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const write=(name,value)=>{const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value));};
 const state=structuredClone(actual.state),id=state.skillId;state.stage.candidatePath='candidate.json';state.owner={workerId:'graph-metadata-fixture',assignmentId:'graph-metadata-assignment',role:'author',profile:{model:'gpt-6.1-sol',effort:'medium',requestedServiceTier:'default',maxWorkers:3,executionOverrideProfile:'user-requested-sol61-medium-v1',reasoningOverride:{effort:'medium',reason:'Explicit fixture Medium'}},workerLineage:{profile:'stable-worker-lineage-v1',kind:'native',actorId:'/root/fixture_graph_metadata',origin:'coordinator-bound'}};
 write('candidate.json',actual.snapshot);write('public/content/'+id+'.json',actual.pair.contentRaw);write('public/quizzes/'+id+'.json',actual.pair.quizRaw);
 // The frozen fixture owns the actual content/review; current complete taxonomy
 // is copied for a fresh local preparation, never credited as historical acceptance.
 for(const n of['skills','topics','courses','dotpoints'])write('data/'+n+'.json',fs.readFileSync('data/'+n+'.json'));
 for(const[parent,content]of Object.entries(actual.prereqContent))write('public/content/'+parent+'.json',content);
 for(const ref of state.stage.sourceReview){const bytes=fs.readFileSync(ref.path);assert.equal(hashValue(bytes),ref.hash);write(ref.path,bytes);for(const image of ref.images||[])write(image.path,fs.readFileSync(image.path));}
 write('booklets/provenance/content-campaign/test/campaign.json',{campaignId:'test',skillIds:[id]});const statePath='booklets/provenance/content-campaign/test/skills/'+id+'.json';write(statePath,state);
 const args={campaignId:'test',skillId:id,workerId:state.owner.workerId,prerequisiteContextProfile:PREREQUISITE_CONTEXT_PROFILE};let failed;try{prepareAssignment(root,args);}catch(e){failed=e;}assert.match(failed.message,/Scope\/theory packet exceeds/);assert.ok(failed.packetBudget.variableChars>24000);
 const p=prepareAssignment(root,{...args,repairMetadataProfile:REPAIR_METADATA_PROFILE}),current=readSkill(root,'test',id),packets=p.packets.map(r=>JSON.parse(fs.readFileSync(path.join(root,r.path)))),value=loadRepairMetadata(root,p,current);
 assert.ok(p.packets.every(r=>r.variableChars<=24000));assert.deepEqual(packets.flatMap(p=>p.items.map(({priorReview,...i})=>i)),assessmentItems(actual.snapshot.content,actual.snapshot.quiz).filter(i=>i.kind!=='theory'&&i.kind!=='example'));
 assert.equal(value.metadata.previousReview.findings.length,39);assert.deepEqual(value.metadata.priorFindings,state.pending);assert.deepEqual(loadPreviousReview(root,p,current,packets).findings,state.review.findings);assert.equal(hashValue(current.review),hashValue(state.review));assert.equal(hashValue(current.stage),hashValue(state.stage));assert.deepEqual(capturePair(root,id).expected,actual.pair.expected);assert.equal(p.dependencyHash,scopeDependencies(root,id,current.scope,current.owner.prepared.sources).hash);
 t.diagnostic(JSON.stringify({actualFindings:39,originalEmptyPacketChars:failed.packetBudget.variableChars,originalMetadataFieldChars:{priorFindings:failed.packetBudget.fields.priorFindings,previousReview:failed.packetBudget.fields.previousReview},wholeItems:packets.flatMap(p=>p.items).length,packetChars:p.packets.map(p=>p.variableChars),sourceSections:current.owner.prepared.sources.length,syntheticPreparationOnly:true}));
});
