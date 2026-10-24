import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {reuseContentHash,reuseCandidate,loadReuseContext,cloneReusableBlock} from '../scripts/booklet/review-reuse.mjs';
import {contentHash,recordContentResult,contentPrompt} from '../scripts/booklet/lean-review.mjs';
import {verificationDependencies,PIPELINE_POLICY} from '../scripts/booklet/import-verification.mjs';
import {createHash} from 'node:crypto';
const block=()=>({id:'old',type:'question',number:1,sourcePageNumber:3,classification:{primarySkillId:'s4'},content:{id:'n',prompt:'Find x.',answer:{short:'4',worked:'x = 8 / 2 = 4'},questionDiagrams:[{id:'d',format:'tikz',code:'label 8',widthMm:50}]}});
const context=prior=>({projectId:'prior',blocks:[prior],accepted:new Map([[prior.id,{record:'reviewed.json',note:'Independent mathematical review'}]])});

test('unstable advisory project reads fall back without accepting partial or changed content',()=>{
 const tempRoot=path.resolve(os.tmpdir()),dir=fs.mkdtempSync(path.join(tempRoot,'review-reuse-race-'));
 assert.ok(path.resolve(dir).startsWith(tempRoot+path.sep));
 const file=path.join(dir,'prior.json'),prior=block(),copy=structuredClone(prior),project={id:'prior',sections:[{blocks:[prior]}]},text=JSON.stringify(project);
 const source={...context(prior),projectFile:file,projectFileHash:createHash('sha256').update(text).digest('hex')};
 try{
  fs.writeFileSync(file,text);
  assert.equal(reuseCandidate(copy,source).blockId,'old');
  assert.equal(reuseCandidate(copy,{...source,currentProjectHash(){throw Error('Reuse project changed during retrieval');}}),null);
  fs.writeFileSync(file,'{"id":"prior","sections":[');
  assert.equal(reuseCandidate(copy,source),null,'partial source JSON cannot supply acceptance');
  const changed=structuredClone(project);changed.sections[0].blocks[0].content.answer.short='5';fs.writeFileSync(file,JSON.stringify(changed));
  assert.equal(reuseCandidate(copy,source),null,'a stable changed answer still cannot reuse the prior acceptance');
  fs.writeFileSync(file,JSON.stringify({...project,revision:2}));
  assert.equal(reuseCandidate(copy,source).blockId,'old','unchanged content remains reusable after a metadata save');
  assert.throws(()=>reuseCandidate(copy,{...source,currentProjectHash(){throw Error('unexpected implementation failure');}}),/unexpected implementation failure/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('editable copies remap local IDs, references and source pages without bank or review acceptance',()=>{
 const prior=block();prior.sourceRefs=[{pageNumber:3,targetId:'n',runId:'old-run'}];prior.bankRef={id:'bank'};prior.canonicalId='bank';prior.verification={passed:true};prior.content.arrangement={targetId:'d'};prior.sourceReview={responses:['4'],status:'accepted',reviewer:'old',sourcePages:[3],teachingPages:[3,5],sourcePagination:{page:3,breakBefore:true}};
 const copy=cloneReusableBlock(prior,{projectId:'ratios-v1',idPrefix:'stage5',pageMap:{3:41},runId:'new-run'});
 assert.equal(copy.id,'stage5-old');assert.equal(copy.content.id,'stage5-n');assert.equal(copy.content.arrangement.targetId,'stage5-d');assert.equal(copy.sourcePageNumber,41);assert.deepEqual(copy.sourceRefs,[{pageNumber:41,targetId:'stage5-n',runId:'new-run'}]);
 assert.equal(copy.bankRef,undefined);assert.equal(copy.canonicalId,undefined);assert.equal(copy.verification,undefined);assert.equal(copy.sourceReview.status,undefined);assert.deepEqual(copy.sourceReview.responses,['4']);assert.deepEqual(copy.sourceReview.reuse,{projectId:'ratios-v1',blockId:'old'});assert.equal(prior.id,'old');
 assert.deepEqual(copy.sourceReview.sourcePages,[41]);assert.deepEqual(copy.sourceReview.teachingPages,[41,5]);assert.deepEqual(copy.sourceReview.sourcePagination,{page:41,breakBefore:true});
});
test('embedded layout ownership follows the copied block instead of losing its arrangement',()=>{
 const prior=block();prior.presentation={layoutOverrides:{blockLayouts:{old:{arrangement:{ref:'n/prompt#d'}}}}};
 const copy=cloneReusableBlock(prior,{projectId:'ratios-v1',idPrefix:'stage5'});
 assert.deepEqual(copy.presentation.layoutOverrides.blockLayouts,{'stage5-old':{arrangement:{ref:'stage5-n/prompt#stage5-d'}}});
 assert.ok(prior.presentation.layoutOverrides.blockLayouts.old);
});
test('native reference identities normalise by node position while relationships remain significant',()=>{
 const prior=block();prior.content.nodes=[{id:'first',type:'math',latex:'x'},{id:'second',type:'math',latex:'y'}];
 prior.content.arrangement={targetId:'first',ref:'second',fromId:'first',toId:'second'};prior.content.questionDiagrams.push({id:'overlay',format:'tikz',code:'line',overlayOf:'d'});
 prior.sourceReview={responses:[{targetId:'first',value:'4'}]};
 const copy=cloneReusableBlock(prior,{projectId:'ratios-v1',idPrefix:'stage5',pageMap:{3:41}});
 assert.equal(reuseContentHash(copy),reuseContentHash(prior));assert.equal(reuseCandidate(copy,context(prior)).blockId,'old');
 for(const change of [b=>b.content.arrangement.targetId='stage5-second',b=>b.content.arrangement.ref='stage5-first',b=>b.content.arrangement.fromId='stage5-second',b=>b.content.arrangement.toId='stage5-first',b=>b.content.questionDiagrams[1].overlayOf='stage5-first',b=>b.sourceReview.responses[0].targetId='stage5-second']){
  const changed=structuredClone(copy);change(changed);assert.notEqual(reuseContentHash(changed),reuseContentHash(prior));assert.equal(reuseCandidate(changed,context(prior)),null);
 }
});
test('reuse ignores identities, numbering, source references and layout but preserves all mathematics',()=>{
 const prior=block(),copy=structuredClone(prior);copy.id='new';copy.number=9;copy.sourcePageNumber=41;copy.content.id='new-node';copy.content.questionDiagrams[0].id='new-diagram';copy.content.questionDiagrams[0].widthMm=70;copy.classification.primarySkillId='s5';copy.sourceReview={reuse:{blockId:'old'}};
 assert.equal(reuseContentHash(copy),reuseContentHash(prior));assert.equal(reuseCandidate(copy,context(prior)).blockId,'old');
 for(const change of [b=>b.content.prompt+=' Use centimetres.',b=>b.content.answer.short='5',b=>b.content.answer.worked='x=5',b=>b.content.questionDiagrams[0].code='label 9',b=>b.content.questionDiagrams[0].colour='red',b=>b.sourceReview={responses:['5']}]){const changed=structuredClone(copy);change(changed);assert.notEqual(reuseContentHash(changed),reuseContentHash(prior));}
 assert.equal(reuseCandidate(copy,{...context(prior),accepted:new Map()}),null);
 assert.equal(reuseCandidate(copy,{...context(prior),blocks:[prior,structuredClone(prior)]}),null);
});
test('lean acceptance must match current prior content; missing records fall back',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'review-reuse-')),prior=block(),file=path.join(dir,'prior.json');
 try{
  fs.writeFileSync(file,JSON.stringify({id:'prior',sections:[{blocks:[prior]}]}));fs.mkdirSync(path.join(dir,'lean-review'));const table=path.join(dir,'lean-review','reviewed.json');
  fs.writeFileSync(table,JSON.stringify({questions:{old:{hash:contentHash(prior),outcome:'passed'}}}));assert.equal(loadReuseContext({projectFile:file,runDir:dir}).accepted.size,1);
  prior.content.answer.short='5';fs.writeFileSync(file,JSON.stringify({sections:[{blocks:[prior]}]}));assert.equal(loadReuseContext({projectFile:file,runDir:dir}).accepted.size,0);
  fs.writeFileSync(table,JSON.stringify({questions:{}}));assert.equal(loadReuseContext({projectFile:file,runDir:dir}).accepted.size,0);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('reuse needs independent source, classification and taught-method checks',()=>{
 const prior=block(),copy=structuredClone(prior);copy.id='new';const reuseContext=context(prior),reuse=reuseCandidate(copy,reuseContext),batch={section:{id:'s'},rows:[{block:copy,reuse}],reuseContext};
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'reuse-record-')),state={questions:{},pages:{}};
 try{
  recordContentResult({batch,result:{records:[{id:'new',outcome:'passed'}]},state,dir});assert.equal(state.questions.new.outcome,'pending');assert.equal(state.questions.new.reuse.outcome,'fallback');
  recordContentResult({batch,result:{records:[{id:'new',outcome:'passed',sourceEquivalent:true,classificationVerified:true,taughtMethodEquivalent:true}]},state,dir});assert.equal(state.questions.new.outcome,'passed');assert.equal(state.questions.new.reuse.outcome,'verified');
  const payload=JSON.parse(contentPrompt({project:{sections:[]},batch,reuse:reuseContext}).split('\n\n').at(-1));assert.equal(payload.reuseCandidates[0].priorBlock.id,'old');
  copy.content.answer.short='5';recordContentResult({batch,result:{records:[{id:'new',outcome:'passed',sourceEquivalent:true,classificationVerified:true,taughtMethodEquivalent:true}]},state,dir});assert.equal(state.questions.new.outcome,'pending','changed content cannot retain reused acceptance');
  recordContentResult({batch,result:{records:[{id:'new',outcome:'passed',mathematicsReviewed:true}]},state,dir});assert.equal(state.questions.new.outcome,'passed');assert.equal(state.questions.new.reuse.outcome,'full-review');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('legacy acceptance validates answer checks, current artifact bytes and question dependency',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'reuse-legacy-')),prior=block(),project={id:'prior',reviewProfile:'textbook-three-pass-v1',sections:[{id:'s',phase:'practice',blocks:[prior]}]},file=path.join(dir,'prior.json');
 const readdir=fs.readdirSync;
 try{
  fs.writeFileSync(file,JSON.stringify(project));fs.mkdirSync(path.join(dir,'workflow'));const artifact=path.join(dir,'result.json');fs.writeFileSync(artifact,'{}');
  const state={pipelinePolicy:PIPELINE_POLICY,reviewProfile:project.reviewProfile,pages:{}},deps=verificationDependencies(state,project,{renderer:'test',implementation:{},runDir:dir});
  const record={id:'question:old',outcome:'passed',reviewer:'independent',note:'Checked every answer',sourceCompared:true,contentVerified:true,checks:{answer:true,skillMapping:true,taughtMethod:true},artifacts:[{path:artifact,hash:createHash('sha256').update(fs.readFileSync(artifact)).digest('hex')}],dependencies:{question:deps.questions.old}};
  state.verification={version:1,entries:{'question:old':record}};const table=path.join(dir,'workflow','issues.json');fs.writeFileSync(table,JSON.stringify(state));
  fs.readdirSync=function(folder,...args){if(['scripts','tests','src','public','node_modules'].some(name=>path.resolve(folder)===path.resolve(name)||path.resolve(folder).startsWith(path.resolve(name)+path.sep)))throw Error('Implementation tree scan');return readdir.call(this,folder,...args);};
  assert.equal(loadReuseContext({projectFile:file,runDir:dir}).accepted.size,1);
  record.checks.answer=false;fs.writeFileSync(table,JSON.stringify(state));assert.equal(loadReuseContext({projectFile:file,runDir:dir}).accepted.size,0);
  record.checks.answer=true;fs.writeFileSync(table,JSON.stringify(state));fs.writeFileSync(artifact,'changed');assert.equal(loadReuseContext({projectFile:file,runDir:dir}).accepted.size,0);
  record.dependencies.customImplementation='unknown';fs.writeFileSync(table,JSON.stringify(state));assert.throws(()=>loadReuseContext({projectFile:file,runDir:dir}),/Implementation tree scan/,'Unknown dependency records retain full verification');
 }finally{fs.readdirSync=readdir;fs.rmSync(dir,{recursive:true,force:true});}
});
test('legacy snapshot accepts only bound unchanged mathematics and ignores corrections for other blocks',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'reuse-snapshot-')),snapshot=block();snapshot.sourceAtom={label:'Scale Drawings'};
 const current=structuredClone(snapshot);current.sourceAtom.label='Scale drawings';const project={id:'prior',reviewProfile:'textbook-three-pass-v1',sections:[{id:'s',phase:'practice',blocks:[current]}]},file=path.join(dir,'prior.json');
 try{
  fs.writeFileSync(file,JSON.stringify(project));fs.mkdirSync(path.join(dir,'workflow'));const state={pipelinePolicy:PIPELINE_POLICY,reviewProfile:project.reviewProfile,pages:{}},oldProject={...project,sections:[{id:'s',phase:'practice',blocks:[snapshot]}]},deps=verificationDependencies(state,oldProject,{renderer:'test',implementation:{},runDir:dir});
  const artifact=path.join(dir,'result-1.json');fs.writeFileSync(artifact,JSON.stringify({records:[{id:'question:old',outcome:'passed'}],corrections:[{patches:[{targetId:'unrelated',field:'/answer',original:'4',corrected:'5'}]}]}));
  const request=path.join(dir,'request.json');fs.writeFileSync(request,JSON.stringify({job:{dependencies:{questions:deps.questions}},prompt:JSON.stringify({context:{questions:[snapshot]}})}));
  state.verification={version:1,entries:{'question:old':{id:'question:old',outcome:'passed',reviewer:'independent',note:'Checked unchanged content',sourceCompared:true,contentVerified:true,checks:{answer:true,skillMapping:true,taughtMethod:true},artifacts:[{path:artifact,hash:createHash('sha256').update(fs.readFileSync(artifact)).digest('hex')}],dependencies:{question:deps.questions.old}}}};
  fs.writeFileSync(path.join(dir,'workflow','issues.json'),JSON.stringify(state));assert.equal(loadReuseContext({projectFile:file,runDir:dir}).accepted.size,1);
  const changed=JSON.parse(fs.readFileSync(file));changed.sections[0].blocks[0].content.answer.worked+=' Extra independently reviewable step.';fs.writeFileSync(file,JSON.stringify(changed));const improvedContext=loadReuseContext({projectFile:file,runDir:dir});assert.equal(improvedContext.accepted.size,0);assert.equal(improvedContext.baselines.get('old').block.content.answer.worked,snapshot.content.answer.worked);
  const invalid=JSON.parse(fs.readFileSync(request));invalid.job.dependencies.questions.old='unbound';fs.writeFileSync(request,JSON.stringify(invalid));assert.equal(loadReuseContext({projectFile:file,runDir:dir}).accepted.size,0);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('legacy mathematics remains verifiable against its original delivered teaching after a theory audit',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'reuse-teaching-audit-')),snapshot=block(),teacher={id:'teaching',type:'rich-text',content:'Divide the total equally between the parts.'};
 snapshot.sourceReview={teachingContext:{exerciseId:'ratios'}};
 const project={id:'prior',reviewProfile:'textbook-three-pass-v1',sections:[{id:'t',topicId:'ratios',phase:'teaching',blocks:[teacher]},{id:'p',topicId:'ratios',phase:'practice',blocks:[snapshot]}]},file=path.join(dir,'prior.json');
 try{
  fs.mkdirSync(path.join(dir,'workflow'));const state={pipelinePolicy:PIPELINE_POLICY,reviewProfile:project.reviewProfile,pages:{}},deps=verificationDependencies(state,project,{renderer:'test',implementation:{},runDir:dir});
  const artifact=path.join(dir,'result-review.json');fs.writeFileSync(artifact,JSON.stringify({records:[{id:'old',outcome:'passed'}]}));
  fs.writeFileSync(path.join(dir,'request.json'),JSON.stringify({job:{dependencies:{questions:deps.questions}},prompt:JSON.stringify({context:{exerciseId:'ratios',questions:[snapshot],sectionContext:[{id:'p',topicId:'ratios',phase:'practice',blockIds:['old']}],teaching:{teaching:[structuredClone(teacher)]}}})}));
  state.verification={version:1,entries:{'question:old':{id:'question:old',outcome:'passed',reviewer:'independent',note:'Derived every answer using original teaching',sourceCompared:true,contentVerified:true,checks:{answer:true,skillMapping:true,taughtMethod:true},artifacts:[{path:artifact,hash:createHash('sha256').update(fs.readFileSync(artifact)).digest('hex')}],dependencies:{question:deps.questions.old}}}};fs.writeFileSync(path.join(dir,'workflow/issues.json'),JSON.stringify(state));
  teacher.content+=' First check that the units agree.';project.sections[0].blocks.push({id:'added',type:'rich-text',content:'A new investigation'});fs.writeFileSync(file,JSON.stringify(project));
  const context=loadReuseContext({projectFile:file,runDir:dir});assert.equal(context.accepted.size,1);assert.equal(context.baselines.get('old').block.content.answer.short,'4');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
