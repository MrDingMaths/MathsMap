import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {discoverReuseContexts,findAuthorReuseCandidates,materializeAutomaticReuse,assertCurrentAutomaticReuse,AUTHOR_REUSE_CONTRACT} from '../scripts/booklet/automatic-reuse.mjs';
import {reuseCandidate,reuseContentHash} from '../scripts/booklet/review-reuse.mjs';
import {contentHash,recordContentResult,runContentReview} from '../scripts/booklet/lean-review.mjs';
import {assignmentPayload,runAuthorAssignment} from '../scripts/booklet/author-assignments.mjs';
import {validateSemanticResult} from '../scripts/booklet/semantic-workflow.mjs';
import {TRANSCRIPTION_DEFAULT} from '../scripts/booklet/transcription-settings.mjs';
const prior=()=>({id:'old',type:'question',number:3,sourcePageNumber:2,sourceRefs:[{pageNumber:2}],classification:{primarySkillId:'stage4'},sourceReview:{teachingContext:{pages:[1]},responses:[{targetId:'n',kind:'working'}]},content:{id:'n',type:'question',prompt:'A map has scale 1:25000. Find the distance represented by 4 cm.',answer:{short:'1 km',worked:'4 x 25000 = 100000 cm = 1 km'}}});
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'auto-reuse-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const projectFile=path.join(root,'booklets/projects/stage4.json'),runDir=path.join(root,'.booklet-work/full-imports/stage4-run');
 fs.mkdirSync(path.dirname(projectFile),{recursive:true});fs.mkdirSync(path.join(runDir,'lean-review'),{recursive:true});
 const block=prior(),project={id:'stage4',runId:'stage4-run',sections:[{blocks:[block]}]};
 fs.writeFileSync(projectFile,JSON.stringify(project));const table=path.join(runDir,'lean-review/reviewed.json');fs.writeFileSync(table,JSON.stringify({questions:{old:{hash:contentHash(block),outcome:'passed',note:'Independently checked'}}}));
 return {root,projectFile,runDir,block,project,table};
}
function packet(candidate){return {pageNumber:41,sections:[{id:'s5',title:'Map scales',phase:'practice',blocks:[{type:'reuse',reuseKey:candidate.key,id:'p41-q7',sourceEquivalent:true,number:7,classification:{primarySkillId:'stage5'},sourceReview:{sourceIdentity:{questionLabel:'7',pdfPage:41},teachingContext:{pages:[40]}}},{id:'new',type:'paragraph',content:'New content'}]}],inventoryMappings:[{inventoryId:'i7',targetId:'old'},{inventoryId:'i7-part',targetId:'n',field:'/prompt'}],answerEvidence:[{questionId:'n',teacherReference:'New source page 12',matchEvidence:'New prompt matched'}]};}
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
 assert.deepEqual(result.errors,[]);assert.equal(calls,1);assert.equal(result.remaining,0);const reviewed=JSON.parse(fs.readFileSync(result.reviewed));assert.equal(reviewed.questions[copy.id].reuse.outcome,'verified');
});

test('assignment author publishes deterministic copies through normal coverage validation',async t=>{
 const f=fixture(t),c=findAuthorReuseCandidates(f.block.content.prompt,discoverReuseContexts({root:f.root}))[0];
 const runDir=path.join(f.root,'.booklet-work/full-imports/stage5-run');fs.mkdirSync(runDir,{recursive:true});
 const inventory={pageNumber:41,inventoried:true,entries:[{id:'i7',kind:'question',description:f.block.content.prompt},{id:'i7-part',kind:'part',parentId:'i7',description:'Find the distance'}]};
 const task={page:41,runId:'stage5-run',packetRoot:path.join(runDir,'semantic-packets'),inventory,reuseCandidates:[c],evidence:[],images:[],contextPages:[],teacherPages:[],generationDependencies:{configuration:TRANSCRIPTION_DEFAULT},topic:{id:'similarity'},promptSections:[{name:'contract',text:'Author assigned content'},{name:'automatic-reuse',text:AUTHOR_REUSE_CONTRACT}]};
 const assignment={id:'assignment-abcd',pages:[41],inventoryIds:inventory.entries.map(e=>e.id),entries:inventory.entries.map(e=>({...e,pageNumber:41}))};
 const authored=packet(c);Object.assign(authored.sections[0].blocks[0].classification,{reasoningScore:20,difficulty:'Foundation',difficultyReason:'Apply the stated map scale and convert centimetres to kilometres.'});
 const result=await runAuthorAssignment({runDir,assignment,tasks:[task],attempt:1,validate:validateSemanticResult,runner:async()=>({result:{packets:[authored]},metrics:{externalModelCalls:1,model:'test-model',endedAt:'2026-10-21T00:00:00Z'}})});
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

test('ineligible retrieval blocks never load provenance or inspect mathematical content',()=>{
 let provenance=0;const block={id:'unreviewed',get content(){throw Error('Ineligible content must not be scanned');}};
 const candidates=findAuthorReuseCandidates('map scale distance 4 cm',{contexts:[{blocks:[block],eligible:new Set(),originalFor:()=>{provenance++;throw Error('Unaccepted source lookup');}}]});
 assert.deepEqual(candidates,[]);assert.equal(provenance,0);
});

test('discovered snapshot hashes are isolated to frozen blocks while mutable questions still change',t=>{
 const f=fixture(t),catalog=discoverReuseContexts({root:f.root}),context=catalog.contexts[0],snapshot=context.blocks[0];
 assert.equal(Object.isFrozen(snapshot),true);assert.equal(Object.isFrozen(snapshot.content.answer),true);
 const initial=context.hashBlock(snapshot);assert.equal(initial,reuseContentHash(snapshot));assert.equal(context.hashBlock(snapshot),initial);
 assert.throws(()=>{snapshot.content.answer.short='wrong';},TypeError);
 const mutable=structuredClone(snapshot);assert.equal(context.hashBlock(mutable),initial);mutable.content.answer.short='wrong';assert.notEqual(context.hashBlock(mutable),initial);assert.equal(reuseCandidate(mutable,context),null);
 assert.equal(reuseCandidate(structuredClone(snapshot),context).blockId,'old');
});

test('cached snapshot scanning retains duplicate ambiguity and resolves only explicit block identity',t=>{
 const f=fixture(t),duplicate=structuredClone(f.block);duplicate.id='duplicate';duplicate.content.id='duplicate-root';duplicate.sourceReview.responses[0].targetId='duplicate-root';
 f.project.sections[0].blocks.push(duplicate);fs.writeFileSync(f.projectFile,JSON.stringify(f.project));fs.writeFileSync(f.table,JSON.stringify({questions:Object.fromEntries(f.project.sections[0].blocks.map(b=>[b.id,{hash:contentHash(b),outcome:'passed'}]))}));
 const context=discoverReuseContexts({root:f.root}).contexts[0];
 assert.equal(reuseCandidate(structuredClone(f.block),context),null,'equal mathematical copies remain ambiguous');
 const identified=structuredClone(f.block);identified.sourceReview.reuse={projectId:'stage4',blockId:'old'};assert.equal(reuseCandidate(identified,context).blockId,'old');
});

test('cached snapshots still reread changed project files and acceptance pins on every candidate',t=>{
 const f=fixture(t),context=discoverReuseContexts({root:f.root}).contexts[0],copy=structuredClone(f.block);
 assert.equal(reuseCandidate(copy,context).blockId,'old');
 f.project.sections[0].blocks[0].content.answer.short='changed task';fs.writeFileSync(f.projectFile,JSON.stringify(f.project));assert.equal(reuseCandidate(copy,context),null,'fresh live blocks must still match');
 f.project.sections[0].blocks[0]=f.block;fs.writeFileSync(f.projectFile,JSON.stringify(f.project));
 // f.block was intentionally mutated through f.project; restore original values.
 f.block.content.answer.short='1 km';fs.writeFileSync(f.projectFile,JSON.stringify(f.project));assert.equal(reuseCandidate(copy,context).blockId,'old');
 fs.writeFileSync(f.table,JSON.stringify({questions:{old:{hash:contentHash(f.block),outcome:'failed'}}}));assert.equal(reuseCandidate(copy,context),null,'cached mathematics never waives changed acceptance pins');
});

test('fresh discovery after an edited project creates a different frozen snapshot and hash',t=>{
 const f=fixture(t),before=discoverReuseContexts({root:f.root}).contexts[0],firstHash=before.hashBlock(before.blocks[0]);
 f.block.content.answer.short='2 km';fs.writeFileSync(f.projectFile,JSON.stringify(f.project));const after=discoverReuseContexts({root:f.root}).contexts[0];
 assert.notEqual(after.blocks[0],before.blocks[0]);assert.notEqual(after.hashBlock(after.blocks[0]),firstHash);assert.equal(before.hashBlock(before.blocks[0]),firstHash);
});

test('advisory snapshot digest checks current metadata each call and rejects deleted projects',t=>{
 const f=fixture(t),context=discoverReuseContexts({root:f.root}).contexts[0],original=context.currentProjectHash();
 assert.equal(original,context.projectFileHash);f.block.content.answer.short='2 km';fs.writeFileSync(f.projectFile,JSON.stringify(f.project));assert.notEqual(context.currentProjectHash(),original);assert.equal(reuseCandidate(prior(),context),null);
 fs.unlinkSync(f.projectFile);assert.equal(reuseCandidate(prior(),context),null);
});

test('same-length project edits with restored modification time are detected through change time',t=>{
 const f=fixture(t),fixed=new Date('2020-01-01T00:00:00.000Z');fs.utimesSync(f.projectFile,fixed,fixed);
 const context=discoverReuseContexts({root:f.root}).contexts[0],before=fs.statSync(f.projectFile);f.block.content.answer.short='2 km';fs.writeFileSync(f.projectFile,JSON.stringify(f.project));fs.utimesSync(f.projectFile,fixed,fixed);const after=fs.statSync(f.projectFile);
 assert.equal(after.size,before.size);assert.equal(after.mtimeMs,before.mtimeMs);assert.notEqual(after.ctimeMs,before.ctimeMs);assert.notEqual(context.currentProjectHash(),context.projectFileHash);assert.equal(reuseCandidate(prior(),context),null);
});

test('spoofed unchanged stat may retain advisory suggestions but final materialization still reads actual project bytes',t=>{
 const f=fixture(t),catalog=discoverReuseContexts({root:f.root}),candidate=findAuthorReuseCandidates(f.block.content.prompt,catalog)[0],before=fs.statSync(f.projectFile),stat=fs.statSync;
 f.block.content.answer.short='2 km';fs.writeFileSync(f.projectFile,JSON.stringify(f.project));
 fs.statSync=function(file,...args){return path.resolve(String(file))===path.resolve(f.projectFile)?before:stat.call(this,file,...args);};
 try{
  const suggested=findAuthorReuseCandidates(f.block.content.prompt,catalog);assert.equal(suggested[0].blockId,'old','retrieval is advisory under a mocked metadata identity');
  assert.throws(()=>materializeAutomaticReuse(packet(candidate),[candidate]),/acceptance changed/,'final copy reloads current project bytes and validates acceptance');
 }finally{fs.statSync=stat;}
});

test('unchanged-stat metadata never caches acceptance pins or generic context bytes',t=>{
 const f=fixture(t),catalog=discoverReuseContexts({root:f.root});assert.equal(findAuthorReuseCandidates(f.block.content.prompt,catalog).length,1);
 fs.writeFileSync(f.table,JSON.stringify({questions:{old:{hash:contentHash(f.block),outcome:'failed'}}}));assert.equal(reuseCandidate(f.block,catalog.contexts[0]),null,'acceptance pin bytes stay fresh even when project stat is unchanged');
});

test('snapshot creation and changed-file digest reject metadata changes during their reads',t=>{
 const f=fixture(t),stat=fs.statSync;let reads=0;
 fs.statSync=function(file,...args){const result=stat.call(this,file,...args);if(path.resolve(String(file))===path.resolve(f.projectFile)&&++reads>1)return {...result,ctimeMs:result.ctimeMs+1};return result;};
 try{assert.equal(discoverReuseContexts({root:f.root}).contexts.length,0,'an unstable initial snapshot cannot enter the catalog');}finally{fs.statSync=stat;}
 const context=discoverReuseContexts({root:f.root}).contexts[0];f.block.content.answer.short='2 km';fs.writeFileSync(f.projectFile,JSON.stringify(f.project));reads=0;
 fs.statSync=function(file,...args){const result=stat.call(this,file,...args);if(path.resolve(String(file))===path.resolve(f.projectFile)&&++reads>1)return {...result,ctimeMs:result.ctimeMs+1};return result;};
 try{assert.throws(()=>context.currentProjectHash(),/changed during retrieval/);}finally{fs.statSync=stat;}
});

test('new placeholder root evidence resolves only to its marked copy and preserves native priority',t=>{
 const f=fixture(t),c=findAuthorReuseCandidates(f.block.content.prompt,discoverReuseContexts({root:f.root}))[0],input=packet(c),first=input.sections[0].blocks[0],second={...structuredClone(first),id:'other-copy'};
 input.sections[0].blocks=[first,second];input.inventoryMappings.forEach(m=>Object.assign(m,{reuseKey:c.key,reuseCopyId:first.id}));input.answerEvidence=[{questionId:first.id,reuseKey:c.key,reuseCopyId:first.id},{questionId:second.id,reuseKey:c.key,reuseCopyId:second.id},{questionId:'n',reuseKey:c.key,reuseCopyId:first.id}];
 const out=materializeAutomaticReuse(input,[c]);assert.deepEqual(out.answerEvidence.map(e=>e.questionId),['p41-q7-old','other-copy-old','p41-q7-n']);assert.ok(out.answerEvidence.every(e=>!('reuseKey'in e)&&!('reuseCopyId'in e)));
 const collision=packet(c);collision.sections[0].blocks[0].id='n';collision.answerEvidence=[{questionId:'n',reuseKey:c.key,reuseCopyId:'n'}];assert.equal(materializeAutomaticReuse(collision,[c]).answerEvidence[0].questionId,'n-n','original native node wins over identical placeholder alias');
});

test('repeated placeholder or unmarked original roots cannot ambiguously acquire source evidence',t=>{
 const f=fixture(t),c=findAuthorReuseCandidates(f.block.content.prompt,discoverReuseContexts({root:f.root}))[0],input=packet(c);input.sections[0].blocks=[input.sections[0].blocks[0],structuredClone(input.sections[0].blocks[0])];assert.throws(()=>materializeAutomaticReuse(input,[c]),/Invalid or ambiguous automatic reuse selection/);
 const repeated=packet(c);repeated.sections[0].blocks=[repeated.sections[0].blocks[0],{...structuredClone(repeated.sections[0].blocks[0]),id:'another'}];repeated.answerEvidence=[{questionId:'old'}];assert.throws(()=>materializeAutomaticReuse(repeated,[c]),/Ambiguous reused node mapping/);
 const wrong=packet(c);wrong.answerEvidence=[{questionId:'p41-q7',reuseKey:c.key,reuseCopyId:'another'}];assert.equal(materializeAutomaticReuse(wrong,[c]).answerEvidence[0].questionId,'p41-q7','wrong-copy marker never binds another copy');
});

test('new source identity survives while every old identity is removed without changing accepted mathematics',t=>{
 const f=fixture(t);f.block.sourceReview.sourceIdentity={exercise:'Old exercise',questionLabel:'3',pdfPage:2};f.block.content.sourceReview={sourceIdentity:{exercise:'Nested old',questionLabel:'3'}};fs.writeFileSync(f.projectFile,JSON.stringify(f.project));fs.writeFileSync(f.table,JSON.stringify({questions:{old:{hash:contentHash(f.block),outcome:'passed'}}}));
 const c=findAuthorReuseCandidates(f.block.content.prompt,discoverReuseContexts({root:f.root}))[0],missing=packet(c);delete missing.sections[0].blocks[0].sourceReview.sourceIdentity;assert.throws(()=>materializeAutomaticReuse(missing,[c]),/explicit numeric whole-question source label/);
 const input=packet(c),identity={exercise:'New exercise',questionLabel:'7',pdfPage:41};input.sections[0].blocks[0].sourceReview.sourceIdentity=identity;input.answerEvidence=[{questionId:'p41-q7',reuseKey:c.key,reuseCopyId:'p41-q7',teacherReference:[{pdfPage:12,exercise:'New exercise',questionLabel:'7'}]}];
 const out=materializeAutomaticReuse(input,[c],{runId:'new-run'}),copy=out.sections[0].blocks[0];assert.deepEqual(copy.sourceReview.sourceIdentity,identity);assert.notEqual(copy.sourceReview.sourceIdentity,identity);assert.equal(copy.content.sourceReview.sourceIdentity,undefined);assert.equal(reuseContentHash(copy),reuseContentHash(c.block));assert.equal(out.answerEvidence[0].questionId,copy.id);assert.equal(out.answerEvidence[0].teacherReference[0].questionLabel,'7');assert.equal(copy.sourceReview.origin.projectId,c.origin.projectId);assert.equal(copy.bankRef,undefined);assert.equal(copy.verification,undefined);assert.equal(copy.content.label,'7','only the explicit new whole-question label is rebound');
});

test('already materialized reuse rechecks exactly used proof and rejects edited copies',t=>{
 const f=fixture(t),c=findAuthorReuseCandidates(f.block.content.prompt,discoverReuseContexts({root:f.root}))[0],out=materializeAutomaticReuse(packet(c),[c]);
 assert.doesNotThrow(()=>assertCurrentAutomaticReuse(out,[c]));const changed=structuredClone(out);changed.sections[0].blocks[0].content.answer.short='2 km';assert.throws(()=>assertCurrentAutomaticReuse(changed,[c]),/reuse/);
 fs.writeFileSync(f.table,JSON.stringify({questions:{old:{hash:contentHash(f.block),outcome:'passed',note:'Changed proof'},unrelated:{outcome:'passed'}}}));assert.throws(()=>assertCurrentAutomaticReuse(out,[c]),/proof changed/);
 assert.doesNotThrow(()=>assertCurrentAutomaticReuse({sections:[{blocks:[{id:'ordinary',type:'paragraph',content:'No prior mathematics used'}]}]},[c]));
});


test('fresh numeric whole-question labels rebind locally and validation rejects stale copies without renewing acceptance',t=>{
 const f=fixture(t);f.block.content.label='3';fs.writeFileSync(f.projectFile,JSON.stringify(f.project));fs.writeFileSync(f.table,JSON.stringify({questions:{old:{hash:contentHash(f.block),outcome:'passed'}}}));const c=findAuthorReuseCandidates(f.block.content.prompt,discoverReuseContexts({root:f.root}))[0],input=packet(c);input.sections[0].blocks[0].sourceReview.sourceIdentity={questionLabel:'7',pdfPage:41};const priorBytes=fs.readFileSync(f.table,'utf8'),out=materializeAutomaticReuse(input,[c]),b=out.sections[0].blocks[0];assert.equal(b.content.label,'7');assert.equal(reuseContentHash(b),reuseContentHash(c.block));assert.doesNotThrow(()=>assertCurrentAutomaticReuse(out,[c]));assert.equal(fs.readFileSync(f.table,'utf8'),priorBytes);b.content.label='3';assert.throws(()=>assertCurrentAutomaticReuse(out,[c]),/reuse changed/);
});
test('unsupported fresh question labels require ordinary authoring, never heuristic numbering',t=>{
 const f=fixture(t),c=findAuthorReuseCandidates(f.block.content.prompt,discoverReuseContexts({root:f.root}))[0];for(const label of ['Unnumbered','5a','5–6','',null,-1,0]){const input=packet(c);input.sections[0].blocks[0].sourceReview.sourceIdentity={questionLabel:label,pdfPage:41};assert.throws(()=>materializeAutomaticReuse(input,[c]),/explicit numeric whole-question source label/)}const input=packet(c);input.sections[0].blocks[0].sourceReview.sourceIdentity={questionLabel:11,pdfPage:41};input.sections[0].blocks[0].number=999;assert.equal(materializeAutomaticReuse(input,[c]).sections[0].blocks[0].content.label,'11');
});
