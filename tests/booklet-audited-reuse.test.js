import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {discoverReuseContexts,findAuthorReuseCandidates,materializeAutomaticReuse} from '../scripts/booklet/automatic-reuse.mjs';
import {loadReuseContext,reuseCandidate,reuseContentHash,changedReviewFields} from '../scripts/booklet/review-reuse.mjs';
import {contentHash,recordContentResult,runContentReview,pendingBlocks} from '../scripts/booklet/lean-review.mjs';
import {preserveSourceLineage,attachedAdditions} from '../scripts/booklet/source-lineage.mjs';
import {createBookletProject,saveBookletProject,loadBookletProject} from '../scripts/booklet/project-studio-server.mjs';
const question=()=>({id:'q',type:'question',sourcePageNumber:2,sourceRefs:[{pageNumber:2}],classification:{primarySkillId:'s4'},content:{id:'qn',type:'question',label:'1',prompt:'A map has scale 1:25000. Find the distance represented by 4 cm.',answer:{short:'1 km',worked:'4 x 25000 = 100000 cm = 1 km'}}});
const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value));};
function fixture(t,{theory=false}={}){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'audit-reuse-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const runDir=path.join(root,'.booklet-work/full-imports/s4-run'),file=path.join(root,'booklets/projects/s4.json'),table=path.join(runDir,'lean-review/reviewed.json');
 const original=theory?{id:'theory',type:'rich-text',sourcePageNumber:2,sourceRefs:[{pageNumber:2}],content:'A scale compares a distance on a map with the corresponding actual distance.'}:question();
 const project={id:'s4',title:'Map scales',runId:'s4-run',reviewProfile:'textbook-three-pass-v1',updatedAt:'2026-10-10T01:00:00Z',sections:[{id:'s',title:'Map scales',phase:theory?'teaching':'practice',blocks:[original]}]},state={questions:{},pages:{}};
 write(file,project);write(path.join(runDir,'semantic-packets/page-002.author.json'),{sections:project.sections});
 recordContentResult({batch:{projectId:project.id,rows:[{block:original}]},result:{records:[{id:original.id,outcome:'passed',note:'Independently checked original content'}]},state,dir:path.dirname(table)});write(table,state);
 return {root,runDir,file,table,project,original,state};
}
function improve(f){
 const current=structuredClone(f.original);
 if(current.type==='question'){current.content.prompt+=' Give your answer in kilometres.';current.content.answer.worked+=' Divide by 100000 to convert centimetres to kilometres.';}
 else current.content+=' Both distances must use the same unit before forming the ratio.';
 f.project.sections[0].blocks[0]=current;f.project.updatedAt='2026-10-11T01:00:00Z';write(f.file,f.project);return current;
}
function copied(candidate){return materializeAutomaticReuse({pageNumber:41,sections:[{id:'new',title:'Map scales',phase:'practice',blocks:[{id:'p41-copy',type:'reuse',reuseKey:candidate.key,sourceEquivalent:true,improvementsCompatible:true,classification:{primarySkillId:'s5'}}]}],inventoryMappings:[{inventoryId:'new-source',targetId:candidate.block.content?.id??candidate.block.id}]},[candidate],{runId:'s5-run',teachingPages:[40]});}
const sourceText=block=>block.type==='question'?block.content.prompt:block.content;
test('original source identifies an improved question and limits review to its actual amendments',t=>{
 const f=fixture(t),current=improve(f),catalog=discoverReuseContexts({root:f.root}),c=findAuthorReuseCandidates(sourceText(f.original),catalog)[0];
 assert.equal(c.originalSourceBlock.content.prompt,f.original.content.prompt);assert.equal(c.block.content.prompt,current.content.prompt);assert.equal(c.enhanced,true);assert.equal(c.mode,'amendments');
 const copy=copied(c).sections[0].blocks[0],reuse=reuseCandidate(copy,catalog);assert.equal(reuse.mode,'amendments');assert.deepEqual(reuse.amendments.map(a=>a.field).sort(),['/content/answer/worked','/content/prompt']);
 assert.equal(copy.content.answer.worked,current.content.answer.worked);assert.equal(copy.sourceReview.origin.hash,reuseContentHash(f.original));
 const state={questions:{},pages:{}},batch={projectId:'s5',rows:[{block:copy,reuse}],reuseContext:catalog};
 recordContentResult({batch,result:{records:[{id:copy.id,outcome:'passed',sourceEquivalent:true,classificationVerified:true,taughtMethodEquivalent:true}]},state,dir:f.runDir});assert.equal(state.questions[copy.id].outcome,'pending');
 recordContentResult({batch,result:{records:[{id:copy.id,outcome:'passed',sourceEquivalent:true,classificationVerified:true,taughtMethodEquivalent:true,amendmentsReviewed:true,taskPreserved:true,amendmentHash:reuse.amendmentHash}]},state,dir:f.runDir});assert.equal(state.questions[copy.id].reuse.outcome,'verified');assert.equal(state.questions[copy.id].acceptedVersion.snapshot.content.answer.worked,current.content.answer.worked);
});
test('ordinary content review sends only changed mathematics for an audited original',async t=>{
 const f=fixture(t);improve(f);let sawDelta=false;
 const result=await runContentReview({root:f.root,runDir:f.runDir,projectFile:f.file,skills:[],runner:async({prompt})=>{
  const payload=JSON.parse(prompt.split('\n\n').at(-1)),reuse=payload.reuseCandidates[0];sawDelta=true;assert.equal(reuse.mode,'amendments');assert.equal(reuse.amendments.length,2);assert.match(prompt,/ONLY the listed amendments/);
  return {result:{records:[{id:f.original.id,outcome:'passed',sourceEquivalent:true,classificationVerified:true,taughtMethodEquivalent:true,amendmentsReviewed:true,taskPreserved:true,amendmentHash:reuse.amendmentHash,note:'Checked added wording and extra conversion step'}]}};
 }});assert.equal(result.remaining,0);assert.equal(sawDelta,true);
 const c=findAuthorReuseCandidates(sourceText(f.original),discoverReuseContexts({root:f.root}))[0];assert.equal(c.mode,'accepted');assert.equal(c.originalSourceBlock.content.prompt,f.original.content.prompt);
});
test('later booklets reuse an improvement already reviewed in another booklet without renewing the master record',async t=>{
 const f=fixture(t);improve(f);const c=findAuthorReuseCandidates(sourceText(f.original),discoverReuseContexts({root:f.root}))[0],copy=copied(c).sections[0].blocks[0];
 const secondDir=path.join(f.root,'.booklet-work/full-imports/s5-run'),secondFile=path.join(f.root,'booklets/projects/s5.json');
 const second={id:'s5',title:'Similarity',runId:'s5-run',reviewProfile:'textbook-three-pass-v1',updatedAt:'2026-10-11T02:00:00Z',sections:[{id:'s',title:'Map scales',phase:'practice',blocks:[copy]}]};write(secondFile,second);const state={questions:{},pages:{}};
 const context=discoverReuseContexts({root:f.root}),reuse=reuseCandidate(copy,context);
 recordContentResult({batch:{projectId:'s5',rows:[{block:copy,reuse}],reuseContext:context},result:{records:[{id:copy.id,outcome:'passed',sourceEquivalent:true,classificationVerified:true,taughtMethodEquivalent:true,amendmentsReviewed:true,taskPreserved:true,amendmentHash:reuse.amendmentHash}]},state,dir:path.join(secondDir,'lean-review')});write(path.join(secondDir,'lean-review/reviewed.json'),state);
 const next=findAuthorReuseCandidates(sourceText(f.original),discoverReuseContexts({root:f.root}))[0];assert.equal(next.mode,'accepted');const later=copied(next).sections[0].blocks[0];assert.equal(reuseCandidate(later,discoverReuseContexts({root:f.root})).mode,'accepted');
 assert.equal(JSON.parse(fs.readFileSync(f.table)).questions.q.hash,contentHash(f.original),'old review is never silently refreshed');
});
test('theory clarifications and new investigations travel with the same original teaching',t=>{
 const f=fixture(t,{theory:true}),current=improve(f),extra={id:'investigation',type:'rich-text',content:'Investigate what happens when a map is enlarged.'};
 const before=structuredClone(f.project);f.project.sections[0].blocks.push(extra);preserveSourceLineage(before,f.project,{runDir:f.runDir});write(f.file,f.project);
 assert.deepEqual(extra.sourceReview.additionTo,{projectId:'s4',blockId:'theory'});const c=findAuthorReuseCandidates(sourceText(f.original),discoverReuseContexts({root:f.root}))[0];assert.equal(c.additions.length,1);
 const out=copied(c).sections[0].blocks;assert.equal(out.length,2);assert.equal(out[0].content,current.content);assert.equal(out[1].content,extra.content);assert.equal(out[1].sourceReview.sourceAddition.anchorId,out[0].id);
 const prev=structuredClone(f.project),reordered=structuredClone(f.project);reordered.sections[0].blocks.reverse();preserveSourceLineage(prev,reordered,{runDir:f.runDir});assert.equal(attachedAdditions(reordered,reordered.sections[0].blocks[1],{originalIds:new Set(['theory'])}).length,1);
});
test('changed givens cannot pass as a clarification, and compatibility is required before copying',t=>{
 const f=fixture(t),current=improve(f);current.content.prompt=current.content.prompt.replace('4 cm','5 cm');write(f.file,f.project);
 const catalog=discoverReuseContexts({root:f.root}),c=findAuthorReuseCandidates(sourceText(f.original),catalog)[0],copy=copied(c).sections[0].blocks[0],reuse=reuseCandidate(copy,catalog),state={questions:{},pages:{}};
 recordContentResult({batch:{rows:[{block:copy,reuse}],reuseContext:catalog},result:{records:[{id:copy.id,outcome:'passed',amendmentsReviewed:true,taskPreserved:false,amendmentHash:reuse.amendmentHash,sourceEquivalent:false,classificationVerified:true,taughtMethodEquivalent:true,mathematicsReviewed:true}]},state,dir:f.runDir});assert.equal(state.questions[copy.id].outcome,'pending');
 const packet={pageNumber:41,sections:[{blocks:[{id:'copy',type:'reuse',reuseKey:c.key,sourceEquivalent:true}]}]};assert.throws(()=>materializeAutomaticReuse(packet,[c]),/compatibility/);
});
test('reviewer repairs within the changed working are accepted without re-reviewing unchanged mathematics',t=>{
 const f=fixture(t);improve(f);const catalog=discoverReuseContexts({root:f.root}),c=findAuthorReuseCandidates(sourceText(f.original),catalog)[0],copy=copied(c).sections[0].blocks[0],reuse=reuseCandidate(copy,catalog),state={questions:{},pages:{}};
 const old=copy.content.answer.worked,corrected=old+' Therefore the actual distance is 1 km.';
 const result={records:[{id:copy.id,outcome:'passed',sourceEquivalent:true,classificationVerified:true,taughtMethodEquivalent:true,amendmentsReviewed:true,taskPreserved:true,amendmentHash:reuse.amendmentHash}],corrections:[{id:'working',patches:[{targetId:copy.content.id,field:'/answer/worked',original:old,corrected}]}]};
 recordContentResult({batch:{rows:[{block:copy,reuse}],reuseContext:catalog},result,state,dir:f.runDir});assert.equal(state.questions[copy.id].outcome,'passed');assert.equal(copy.content.answer.worked,corrected);
});
test('an unrelated alteration outside the declared amendments cannot inherit acceptance',t=>{
 const f=fixture(t);improve(f);const catalog=discoverReuseContexts({root:f.root}),c=findAuthorReuseCandidates(sourceText(f.original),catalog)[0],copy=copied(c).sections[0].blocks[0],reuse=reuseCandidate(copy,catalog),state={questions:{},pages:{}};
 const result={records:[{id:copy.id,outcome:'passed',sourceEquivalent:true,classificationVerified:true,taughtMethodEquivalent:true,amendmentsReviewed:true,taskPreserved:true,amendmentHash:reuse.amendmentHash}],corrections:[{id:'unrelated',patches:[{targetId:copy.content.id,field:'/answer/short',original:'1 km',corrected:'2 km'}]}]};
 recordContentResult({batch:{rows:[{block:copy,reuse}],reuseContext:catalog},result,state,dir:f.runDir});assert.equal(state.questions[copy.id].outcome,'pending');
});
test('a rejected changed version retains the last valid independent baseline',t=>{
 const f=fixture(t),current=improve(f),context=loadReuseContext({projectFile:f.file,runDir:f.runDir}),reuse=reuseCandidate(current,context);
 recordContentResult({batch:{rows:[{block:current,reuse}],reuseContext:context},result:{records:[{id:current.id,outcome:'failed',mathematicsReviewed:true,note:'Extra working needs repair'}]},state:f.state,dir:f.runDir});write(f.table,f.state);
 const loaded=loadReuseContext({projectFile:f.file,runDir:f.runDir});assert.equal(loaded.baselines.get(current.id).block.content.answer.worked,f.original.content.answer.worked);assert.equal(loaded.accepted.size,0);
});
test('a late edit to an attached investigation cannot enter an in-flight import',t=>{
 const f=fixture(t,{theory:true});improve(f);f.project.sections[0].blocks.push({id:'extra',type:'rich-text',content:'Investigate enlargement.',sourceReview:{additionTo:{projectId:'s4',blockId:'theory'}}});write(f.file,f.project);
 const c=findAuthorReuseCandidates(sourceText(f.original),discoverReuseContexts({root:f.root}))[0];f.project.sections[0].blocks[1].content='Changed investigation';write(f.file,f.project);assert.throws(()=>copied(c),/investigation changed/);
});
test('layout and local numbering still produce no mathematical amendment',()=>{
 const old=question(),current=structuredClone(old);current.content.label='21';current.sourcePageNumber=41;current.flow={breakBefore:true};current.content.answerSpaceMm=30;current.content.align='center';assert.deepEqual(changedReviewFields(old,current),[]);
});

test('revision-safe Studio saves retain source identity and addition attachment after reopen',async t=>{
 const f=fixture(t,{theory:true}),roots={projectRoot:path.join(f.root,'booklets/projects'),bankRoot:path.join(f.root,'booklets/question-bank')};
 // Create a second project so the test exercises the real creation/save queue.
 let project=await createBookletProject({...f.project,id:'editable',sections:structuredClone(f.project.sections)},roots);
 project.sections[0].blocks[0].content+=' Express both measurements in the same unit.';
 project.sections[0].blocks.push({id:'added-investigation',type:'rich-text',content:'Explore map enlargement.'});
 const stale=structuredClone(project);project=await saveBookletProject(project,{...roots,expectedRevision:project.revision});
 const reopened=await loadBookletProject(project.id,roots);assert.equal(reopened.sections[0].blocks[0].sourceReview.origin.runId,'s4-run');assert.deepEqual(reopened.sections[0].blocks[1].sourceReview.additionTo,{projectId:'editable',blockId:'theory'});
 await assert.rejects(saveBookletProject(stale,{...roots,expectedRevision:stale.revision}),/changed in another session/);
 assert.equal(JSON.parse(fs.readFileSync(f.table)).questions.theory.hash,contentHash(f.original),'saving never invents independent audit acceptance');
});

test('the newest compatible audit wins over an older reviewed variant of the same source',t=>{
 const f=fixture(t);const first=improve(f),context=discoverReuseContexts({root:f.root}),c=findAuthorReuseCandidates(sourceText(f.original),context)[0],copy=copied(c).sections[0].blocks[0],reuse=reuseCandidate(copy,context),state={questions:{},pages:{}};
 const secondDir=path.join(f.root,'.booklet-work/full-imports/s5-run');
 const second={id:'s5',runId:'s5-run',updatedAt:'2026-10-11T02:00:00Z',sections:[{id:'s',phase:'practice',blocks:[copy]}]};write(path.join(f.root,'booklets/projects/s5.json'),second);
 recordContentResult({batch:{projectId:'s5',rows:[{block:copy,reuse}],reuseContext:context},result:{records:[{id:copy.id,outcome:'passed',sourceEquivalent:true,classificationVerified:true,taughtMethodEquivalent:true,amendmentsReviewed:true,taskPreserved:true,amendmentHash:reuse.amendmentHash}]},state,dir:path.join(secondDir,'lean-review')});write(path.join(secondDir,'lean-review/reviewed.json'),state);
 first.content.prompt+=' State the units clearly.';f.project.updatedAt='2026-10-11T03:00:00Z';write(f.file,f.project);
 const latest=findAuthorReuseCandidates(sourceText(f.original),discoverReuseContexts({root:f.root}))[0];assert.equal(latest.projectId,'s4');assert.match(latest.block.content.prompt,/State the units clearly/);assert.equal(latest.mode,'amendments');
});

test('semantic colour changes are changed content even when the older printable hash ignores colour',t=>{
 const f=fixture(t),current=structuredClone(f.original);current.content.colour='#268cff';f.project.sections[0].blocks[0]=current;write(f.file,f.project);
 assert.equal(contentHash(current),contentHash(f.original));assert.equal(pendingBlocks(f.project,f.state).length,1);
 const context=loadReuseContext({projectFile:f.file,runDir:f.runDir});assert.equal(context.accepted.size,0);const reuse=reuseCandidate(current,context);assert.equal(reuse.mode,'amendments');assert.equal(reuse.amendments[0].field,'/content/colour');
});

test('unrelated project and review-row edits preserve scoped acceptance during an import',t=>{
 const f=fixture(t);improve(f);const catalog=discoverReuseContexts({root:f.root}),c=findAuthorReuseCandidates(sourceText(f.original),catalog)[0],copy=copied(c).sections[0].blocks[0];
 f.project.sections[0].blocks.push({id:'unrelated',type:'rich-text',content:'Unrelated item'});write(f.file,f.project);f.state.questions.unrelated={outcome:'passed',hash:'unrelated'};write(f.table,f.state);
 assert.equal(reuseCandidate(copy,catalog).mode,'amendments');
 f.project.sections[0].blocks[0].content.answer.short='2 km';write(f.file,f.project);assert.equal(reuseCandidate(copy,catalog),null);
});

test('audited local layout controls travel with copied content without invalidating mathematics',t=>{
 const f=fixture(t);f.project.settings={layoutOverrides:{blockLayouts:{q:{arrangement:{ref:'qn/prompt'}}},answerSpaces:{qn:32}}};write(f.file,f.project);
 const c=findAuthorReuseCandidates(sourceText(f.original),discoverReuseContexts({root:f.root}))[0],copy=copied(c).sections[0].blocks[0];
 assert.equal(copy.presentation.layoutOverrides.blockLayouts[copy.id].arrangement.ref,copy.content.id+'/prompt');
 assert.equal(copy.presentation.layoutOverrides.answerSpaces[copy.content.id],32);assert.equal(reuseContentHash(copy),reuseContentHash(f.original));
});

test('saving a pending correction never overwrites the last accepted snapshot',async t=>{
 const f=fixture(t);improve(f);const candidateFile=path.join(f.root,'candidate.json');write(candidateFile,f.project);
 const result=await runContentReview({root:f.root,runDir:f.runDir,projectFile:candidateFile,skills:[],runner:async({prompt})=>{
  const payload=JSON.parse(prompt.split('\n\n').at(-1)),reuse=payload.reuseCandidates[0];
  return {result:{records:[{id:'q',outcome:'passed',sourceEquivalent:true,classificationVerified:true,taughtMethodEquivalent:true,amendmentsReviewed:true,taskPreserved:true,amendmentHash:reuse.amendmentHash}],corrections:[{id:'unexpected',patches:[{targetId:'qn',field:'/answer/short',original:'1 km',corrected:'2 km'}]}]}};
 }});
 const row=JSON.parse(fs.readFileSync(result.reviewed)).questions.q;assert.equal(row.outcome,'pending');assert.equal(row.acceptedVersion.snapshot.content.answer.short,'1 km');assert.equal(row.acceptedVersion.hash,contentHash(f.original));assert.equal(JSON.parse(fs.readFileSync(candidateFile)).sections[0].blocks[0].content.answer.short,'2 km');
});

test('split teaching blocks retain one shared source group after copying',t=>{
 const f=fixture(t,{theory:true});f.original.sourceAtom={id:'shared-group',kind:'theory',label:'Map scales'};
 const other={...structuredClone(f.original),id:'units',content:'Use the same unit for the corresponding actual distance and the map distance.'};
 f.project.sections[0].blocks=[f.original,other];write(f.file,f.project);write(path.join(f.runDir,'semantic-packets/page-002.author.json'),{sections:f.project.sections});
 recordContentResult({batch:{projectId:'s4',rows:[{block:f.original},{block:other}]},result:{records:[{id:'theory',outcome:'passed'},{id:'units',outcome:'passed'}]},state:f.state,dir:path.dirname(f.table)});write(f.table,f.state);
 const candidates=findAuthorReuseCandidates(sourceText(f.original)+' '+other.content,discoverReuseContexts({root:f.root}));assert.equal(candidates.length,2);
 const out=materializeAutomaticReuse({pageNumber:41,sections:[{blocks:candidates.map((c,index)=>({id:'copy'+index,type:'reuse',reuseKey:c.key,sourceEquivalent:true,improvementsCompatible:true}))}],inventoryMappings:[]},candidates,{runId:'s5-run'}).sections[0].blocks;
 assert.equal(out[0].sourceAtom.id,out[1].sourceAtom.id);assert.notEqual(out[0].id,out[1].id);
});

test('copies from different books safely remap colliding original node IDs',t=>{
 const f=fixture(t),other=question();other.content.prompt=other.content.prompt.replace('4 cm','8 cm');other.content.answer={short:'2 km',worked:'8 x 25000 = 200000 cm = 2 km'};
 const otherDir=path.join(f.root,'.booklet-work/full-imports/other-run'),otherState={questions:{},pages:{}},otherProject={id:'other',runId:'other-run',sections:[{id:'s',phase:'practice',blocks:[other]}]};
 write(path.join(f.root,'booklets/projects/other.json'),otherProject);write(path.join(otherDir,'semantic-packets/page-002.author.json'),{sections:otherProject.sections});recordContentResult({batch:{projectId:'other',rows:[{block:other}]},result:{records:[{id:'q',outcome:'passed'}]},state:otherState,dir:path.join(otherDir,'lean-review')});write(path.join(otherDir,'lean-review/reviewed.json'),otherState);
 const candidates=findAuthorReuseCandidates(sourceText(f.original)+' '+sourceText(other),discoverReuseContexts({root:f.root}));assert.equal(candidates.length,2);
 const packet={pageNumber:41,sections:[{blocks:candidates.map((c,index)=>({id:'copy-'+index,type:'reuse',reuseKey:c.key,sourceEquivalent:true,improvementsCompatible:true}))}],inventoryMappings:candidates.map((c,index)=>({inventoryId:'item-'+index,targetId:'qn',reuseKey:c.key,reuseCopyId:'copy-'+index})),answerEvidence:candidates.map((c,index)=>({questionId:'qn',reuseKey:c.key,reuseCopyId:'copy-'+index}))};
 const out=materializeAutomaticReuse(packet,candidates,{runId:'new-run'});assert.equal(new Set(out.inventoryMappings.map(m=>m.targetId)).size,2);assert.deepEqual(out.answerEvidence.map(e=>e.questionId),out.inventoryMappings.map(m=>m.targetId));assert.equal(out.inventoryMappings[0].reuseKey,undefined);
});
