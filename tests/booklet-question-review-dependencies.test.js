import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {verificationDependencies,verificationStatus,PIPELINE_POLICY} from '../scripts/booklet/import-verification.mjs';

const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'question-review-deps-'));
 t.after(()=>{assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(dir,{recursive:true,force:true});});
 const write=(name,value)=>{const file=path.join(dir,name);fs.writeFileSync(file,typeof value==='string'?value:JSON.stringify(value));return file;};
 const project={id:'fixture',settings:{},sections:[1,2].flatMap(i=>[
  {id:'teaching-'+i,topicId:'topic-'+i,phase:'teaching',blocks:[{id:'method-'+i,type:'callout',content:'Substitute then calculate.',sourceRefs:[{pageNumber:i}]}]},
  {id:'practice-'+i,topicId:'topic-'+i,phase:'practice',blocks:[{id:'q'+i,type:'question',sourceRefs:[{pageNumber:i}],content:{id:'node-'+i,prompt:'Find x.',answer:{short:'1',worked:'x=1'}}}]}
 ])};
 const state={pipelinePolicy:PIPELINE_POLICY,pages:{1:{inventoryHash:'source-1',sourceEvidence:{hash:'image-1'}},2:{inventoryHash:'source-2',sourceEvidence:{hash:'image-2'}},3:{inventoryHash:'source-3',sourceEvidence:{hash:'image-3'}}},issues:{},verification:{version:1,entries:{}}};
 const dependencies=()=>verificationDependencies(state,project,{renderer:'fixture',implementation:{}}).questions;
 return {dir,write,project,state,dependencies,q:project.sections[1].blocks[0]};
}

test('question reuse binds its teaching exercise, nested source context and explicitly mapped teaching nodes',t=>{
 const f=fixture(t),baseline=f.dependencies();
 f.project.sections[0].blocks[0].content='Calculate the bracket first.';
 let changed=f.dependencies();assert.notEqual(changed.q1,baseline.q1);assert.equal(changed.q2,baseline.q2);
 f.q.sourceReview={constituents:[{sourceReview:{teachingContext:{pdfPages:[3],methodNote:'Use the supplied balance method.'}}}]};
 const nested=f.dependencies();f.state.pages[3].sourceEvidence.hash='changed-teaching-source';changed=f.dependencies();
 assert.notEqual(changed.q1,nested.q1);assert.equal(changed.q2,nested.q2);
 f.project.source={inventory:{entries:[{targetId:'node-1',teachingContextIds:['method-2']}]}};
 const mapped=f.dependencies();f.project.sections[2].blocks[0].content='Revised explicit teaching dependency.';
 assert.notEqual(f.dependencies().q1,mapped.q1);
});

test('external teaching evidence invalidates by actual bytes, including nested retained page images',t=>{
 const f=fixture(t),image=f.write('teaching.png','original source image');
 f.q.sourceReview={constituents:[{sourceReview:{teachingContext:{pdfPages:[3]},externalTeachingReferences:[{pages:[{pdfPage:3,imagePath:image,imageSha256:hash(image)}]}]}}]};
 const first=f.dependencies();f.write('teaching.png','changed source image');
 const second=f.dependencies();assert.notEqual(second.q1,first.q1);assert.equal(second.q2,first.q2);
 fs.unlinkSync(image);assert.notEqual(f.dependencies().q1,second.q1);
});

test('config and provenance teaching changes invalidate affected accepted questions before another review',t=>{
 const f=fixture(t),config={topics:[{id:'topic-1',teachingPages:[1]},{id:'topic-2',teachingPages:[2]}],pageTeachingPages:{1:[1],2:[2]}},configFile=f.write('config.json',config);
 const images=[1,2].map(i=>{const file=f.write('source-'+i+'.png','source '+i);return {pdfPage:i,imagePath:file,imageSha256:hash(file),note:'Source method'};});
 const index={externalTeachingReferences:[{id:'source',pages:images}]},externalIndex=f.write('teaching-context-index.json',index);
 f.state.verification.teachingContexts={'topic-1':{outcome:'accepted',dependencyHash:'reviewed-teaching',methods:[{statement:'Substitution',sourceRefs:[{pageNumber:1}]}],dependencyScope:{exerciseId:'topic-1',pages:[1],sourcePages:[1],configFile,externalIndex},sourceArtifacts:[{page:1,path:images[0].imagePath,hash:images[0].imageSha256}]}};
 const first=f.dependencies();config.topics[1].teachingPages=[2,3];index.externalTeachingReferences[0].pages[1].note='Unrelated exercise';f.write('config.json',config);f.write('teaching-context-index.json',index);
 assert.deepEqual(f.dependencies(),first);
 config.pageTeachingPages[1]=[1,3];f.write('config.json',config);const second=f.dependencies();assert.notEqual(second.q1,first.q1);assert.equal(second.q2,first.q2);
 index.externalTeachingReferences[0].pages[0].note='Revised relevant method';f.write('teaching-context-index.json',index);const third=f.dependencies();assert.notEqual(third.q1,second.q1);assert.equal(third.q2,second.q2);
 f.write('source-1.png','updated actual source');assert.notEqual(f.dependencies().q1,third.q1);
});

test('an outstanding stage finding remains a closeout blocker',t=>{
 const f=fixture(t);f.state.verification.stageClaims={review:{blockedResult:{needsReview:true,findings:['Ambiguous method']}}};
 const result=verificationStatus(f.state,f.project,{renderer:'fixture'});
 assert.equal(result.checks.find(c=>c.id==='stage-handoffs').passed,false);
});

test('a retained source interpretation invalidates its question without affecting a neighbour',t=>{
 const f=fixture(t),first=f.dependencies(),file=f.write('decision.txt','Source precision review');
 f.state.issues.precision={id:'precision',origin:'review',targetId:'node-1',page:1,status:'retained',message:'Source precision is intentional.',resolution:{status:'retained',reason:'Retain the stated two significant figures.',evidence:[{path:file,hash:hash(file)}]}};
 const second=f.dependencies();assert.notEqual(second.q1,first.q1);assert.equal(second.q2,first.q2);
 f.state.issues.precision.resolution.reason='Use the explicitly given exact value.';assert.notEqual(f.dependencies().q1,second.q1);
});
