import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {discoverReuseContexts,findAuthorReuseCandidates,materializeAutomaticReuse,AUTHOR_REUSE_CONTRACT} from '../scripts/booklet/automatic-reuse.mjs';
import {reuseCandidate,reuseContentHash} from '../scripts/booklet/review-reuse.mjs';
import {contentHash,recordContentResult,runContentReview} from '../scripts/booklet/lean-review.mjs';
import {assignmentPayload,runAuthorAssignment} from '../scripts/booklet/author-assignments.mjs';
import {validateSemanticResult} from '../scripts/booklet/semantic-workflow.mjs';
import {TRANSCRIPTION_DEFAULT} from '../scripts/booklet/transcription-settings.mjs';
const prior=()=>({id:'old',type:'question',number:3,sourcePageNumber:2,sourceRefs:[{pageNumber:2}],classification:{primarySkillId:'stage4'},sourceReview:{teachingContext:{pages:[1]},responses:[{targetId:'n',kind:'working'}]},content:{id:'n',prompt:'A map has scale 1:25000. Find the distance represented by 4 cm.',answer:{short:'1 km',worked:'4 x 25000 = 100000 cm = 1 km'}}});
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'auto-reuse-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const projectFile=path.join(root,'booklets/projects/stage4.json'),runDir=path.join(root,'.booklet-work/full-imports/stage4-run');
 fs.mkdirSync(path.dirname(projectFile),{recursive:true});fs.mkdirSync(path.join(runDir,'lean-review'),{recursive:true});
 const block=prior(),project={id:'stage4',runId:'stage4-run',sections:[{blocks:[block]}]};
 fs.writeFileSync(projectFile,JSON.stringify(project));const table=path.join(runDir,'lean-review/reviewed.json');fs.writeFileSync(table,JSON.stringify({questions:{old:{hash:contentHash(block),outcome:'passed',note:'Independently checked'}}}));
 return {root,projectFile,runDir,block,project,table};
}
function packet(candidate){return {pageNumber:41,sections:[{id:'s5',title:'Map scales',phase:'practice',blocks:[{type:'reuse',reuseKey:candidate.key,id:'p41-q7',sourceEquivalent:true,number:7,classification:{primarySkillId:'stage5'},sourceReview:{teachingContext:{pages:[40]}}},{id:'new',type:'paragraph',content:'New content'}]}],inventoryMappings:[{inventoryId:'i7',targetId:'old'},{inventoryId:'i7-part',targetId:'n',field:'/prompt'}],answerEvidence:[{questionId:'n',teacherReference:'New source page 12',matchEvidence:'New prompt matched'}]};}
test('discovers accepted content automatically across the library and excludes current/missing acceptance',t=>{
 const f=fixture(t),catalog=discoverReuseContexts({root:f.root});assert.equal(catalog.contexts.length,1);
 const candidates=findAuthorReuseCandidates('Stage 5 Similarity Question 7. '+f.block.content.prompt,catalog);assert.equal(candidates.length,1);
 assert.equal(discoverReuseContexts({root:f.root,excludeRunDir:f.runDir}).contexts.length,0);
 fs.writeFileSync(f.table,JSON.stringify({questions:{old:{hash:'stale',outcome:'passed'}}}));assert.equal(findAuthorReuseCandidates(f.block.content.prompt,discoverReuseContexts({root:f.root})).length,0);
 fs.unlinkSync(f.table);assert.equal(discoverReuseContexts({root:f.root}).contexts.length,0);
});
test('mixed packets copy mathematics verbatim, remap IDs and own new source/skill bindings',t=>{
 const f=fixture(t),catalog=discoverReuseContexts({root:f.root}),c=findAuthorReuseCandidates(f.block.content.prompt,catalog)[0];
 f.block.bankRef={id:'bank'}; // the stored block remains unaffected
 const out=materializeAutomaticReuse(packet(c),[c],{runId:'stage5-run',teachingPages:[40]}),copy=out.sections[0].blocks[0];
 assert.equal(reuseContentHash(copy),reuseContentHash(c.block));assert.equal(copy.number,7);assert.equal(copy.sourcePageNumber,41);assert.deepEqual(copy.sourceRefs,[{pageNumber:41,runId:'stage5-run'}]);assert.equal(copy.classification.primarySkillId,'stage5');
 assert.deepEqual(copy.sourceReview.teachingContext,{pages:[40]});assert.deepEqual(copy.sourceReview.teachingPages,[40]);assert.deepEqual(copy.sourceReview.reuse,{projectId:'stage4',blockId:'old'});assert.equal(copy.bankRef,undefined);
 assert.equal(out.inventoryMappings[1].targetId,'p41-q7-n');assert.equal(out.answerEvidence[0].questionId,'p41-q7-n');assert.equal(out.sections[0].blocks[1].id,'new');assert.equal(reuseCandidate(copy,catalog).blockId,'old');
});
test('similarity suggestions never bypass source or independent method checks; changed maths falls back',t=>{
 const f=fixture(t),catalog=discoverReuseContexts({root:f.root}),c=findAuthorReuseCandidates(f.block.content.prompt,catalog)[0],input=packet(c);
 input.sections[0].blocks[0].sourceEquivalent=false;assert.throws(()=>materializeAutomaticReuse(input,[c]),/Invalid/);
 const copy=materializeAutomaticReuse(packet(c),[c]).sections[0].blocks[0];copy.content.prompt=copy.content.prompt.replace('4 cm','5 cm');assert.equal(reuseCandidate(copy,catalog),null);
 const valid=materializeAutomaticReuse(packet(c),[c]).sections[0].blocks[0],batch={rows:[{block:valid,reuse:reuseCandidate(valid,catalog)}],reuseContext:catalog},state={questions:{},pages:{}};
 recordContentResult({batch,result:{records:[{id:valid.id,outcome:'passed'}]},state,dir:f.runDir});assert.equal(state.questions[valid.id].outcome,'pending');
 recordContentResult({batch,result:{records:[{id:valid.id,outcome:'passed',sourceEquivalent:true,classificationVerified:true,taughtMethodEquivalent:true}]},state,dir:f.runDir});assert.equal(state.questions[valid.id].reuse.outcome,'verified');
});
test('prior content or acceptance changing in flight prevents copying',t=>{
 const f=fixture(t),c=findAuthorReuseCandidates(f.block.content.prompt,discoverReuseContexts({root:f.root}))[0];
 fs.writeFileSync(f.table,JSON.stringify({questions:{}}));assert.throws(()=>materializeAutomaticReuse(packet(c),[c]),/acceptance changed/);
 fs.writeFileSync(f.table,JSON.stringify({questions:{old:{hash:contentHash(f.block),outcome:'passed'}}}));f.project.sections[0].blocks[0].content.answer.short='wrong';fs.writeFileSync(f.projectFile,JSON.stringify(f.project));assert.throws(()=>materializeAutomaticReuse(packet(c),[c]),/acceptance changed/);
});
test('assignment worker receives reuse instructions and candidates with dependency binding',()=>{
 const entry={id:'i',kind:'question',description:'Map scales',pageNumber:41};
 const task={page:41,packetRoot:os.tmpdir(),inventory:{pageNumber:41,entries:[entry]},evidence:[],images:[],contextPages:[],teacherPages:[],topic:{id:'similarity'},promptSections:[{name:'contract',text:'Author assigned content'},{name:'automatic-reuse',text:AUTHOR_REUSE_CONTRACT+' candidate-original'}]};
 const a={id:'assignment-test',pages:[41],inventoryIds:['i'],entries:[entry]};const first=assignmentPayload(a,[task]);assert.match(first.prompt,/candidate-original/);
 task.promptSections[1].text+=' changed';assert.notEqual(assignmentPayload(a,[task]).inputHash,first.inputHash);
});

test('normal content command discovers copied acceptance without reuse options and omits repeated derivation',async t=>{
 const f=fixture(t),catalog=discoverReuseContexts({root:f.root}),c=findAuthorReuseCandidates(f.block.content.prompt,catalog)[0];
 const copy=materializeAutomaticReuse(packet(c),[c],{runId:'stage5-run',teachingPages:[40]}).sections[0].blocks[0];
 const runDir=path.join(f.root,'.booklet-work/full-imports/stage5-run');fs.mkdirSync(runDir,{recursive:true});
 const file=path.join(f.root,'candidate.json');fs.writeFileSync(file,JSON.stringify({id:'stage5',reviewProfile:'textbook-three-pass-v1',sections:[{id:'practice',phase:'practice',blocks:[copy]}]}));
 let calls=0;
 const result=await runContentReview({root:f.root,runDir,projectFile:file,skills:[],runner:async({prompt})=>{
  calls++;const payload=JSON.parse(prompt.split('\n\n').at(-1));assert.equal(payload.reuseCandidates[0].blockId,'old');assert.match(prompt,/Do not independently rederive/);
  return {result:{records:[{id:copy.id,outcome:'passed',sourceEquivalent:true,classificationVerified:true,taughtMethodEquivalent:true,note:'New source and method verified'}]}};
 }});
 assert.equal(calls,1);assert.equal(result.remaining,0);const reviewed=JSON.parse(fs.readFileSync(result.reviewed));assert.equal(reviewed.questions[copy.id].reuse.outcome,'verified');
});

test('assignment author publishes deterministic copies through normal coverage validation',async t=>{
 const f=fixture(t),c=findAuthorReuseCandidates(f.block.content.prompt,discoverReuseContexts({root:f.root}))[0];
 const runDir=path.join(f.root,'.booklet-work/full-imports/stage5-run');fs.mkdirSync(runDir,{recursive:true});
 const inventory={pageNumber:41,inventoried:true,entries:[{id:'i7',kind:'question',description:f.block.content.prompt},{id:'i7-part',kind:'part',parentId:'i7',description:'Find the distance'}]};
 const task={page:41,runId:'stage5-run',packetRoot:path.join(runDir,'semantic-packets'),inventory,reuseCandidates:[c],evidence:[],images:[],contextPages:[],teacherPages:[],generationDependencies:{configuration:TRANSCRIPTION_DEFAULT},topic:{id:'similarity'},promptSections:[{name:'contract',text:'Author assigned content'},{name:'automatic-reuse',text:AUTHOR_REUSE_CONTRACT}]};
 const assignment={id:'assignment-abcd',pages:[41],inventoryIds:inventory.entries.map(e=>e.id),entries:inventory.entries.map(e=>({...e,pageNumber:41}))};
 const result=await runAuthorAssignment({runDir,assignment,tasks:[task],attempt:1,validate:validateSemanticResult,runner:async()=>({result:{packets:[packet(c)]},metrics:{externalModelCalls:1}})});
 assert.equal(result.packets[0].sections[0].blocks[0].content.answer.short,'1 km');assert.equal(result.packets[0].inventoryMappings[0].targetId,'p41-q7-old');
 assert.equal(result.packets[0].sections[0].blocks[0].sourceReview.reuse.projectId,'stage4');
});

test('later pages extend the accepted shortlist from the same prior project',t=>{
 const f=fixture(t),second=prior();second.id='second';second.content.id='second-node';second.content.prompt='Calculate the perimeter of a rectangle with length 13 cm and width 9 cm.';
 f.project.sections[0].blocks.push(second);fs.writeFileSync(f.projectFile,JSON.stringify(f.project));
 fs.writeFileSync(f.table,JSON.stringify({questions:{old:{hash:contentHash(f.block),outcome:'passed'},second:{hash:contentHash(second),outcome:'passed'}}}));
 const catalog=discoverReuseContexts({root:f.root});assert.equal(findAuthorReuseCandidates(f.block.content.prompt,catalog)[0].blockId,'old');
 assert.equal(findAuthorReuseCandidates(second.content.prompt,catalog)[0].blockId,'second');
});
