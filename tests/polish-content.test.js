// Polish pipeline queue c (23 October 2026): content findings are repaired autonomously, but only after a second
// worker has derived every changed answer itself.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {runReview,bookletIndex} from '../first-pass/review.mjs';
import {contentFindings,applyOperations,removalBlocked,authorPrompt,checkPrompt,runContentRepair,CONTENT_AREAS,SUGGESTION_AREAS} from '../polish/content.mjs';
import {workspace,finding,reviewRunner,patch,booklet} from './polish-fixture.mjs';
import {applyRepair} from '../scripts/booklet/lean-review.mjs';

async function seeded(t,rows){
 const space=workspace(t);
 await runReview({...space.options,runner:reviewRunner({'student:2':{findings:rows}})});
 const by={};for(const f of space.record().findings)by[f.targets[0].id]=f.id;
 return {space,by};
}
const wrong=(target,proposal)=>finding(2,[target],{area:'content',comment:'The short answer for '+target+' is wrong.',proposal});

test('only content and duplicate findings are repaired; extensions and openings are the teacher\'s',async t=>{
 assert.deepEqual([...CONTENT_AREAS],['content','duplicate']);assert.deepEqual([...SUGGESTION_AREAS],['extension','review']);
 const {space,by}=await seeded(t,[wrong('q1-a'),finding(2,['q2'],{area:'extension',comment:'Add a harder part.'}),finding(3,['q3'],{area:'spacing'}),wrong('q4-a')]);
 const project=space.project(),record=space.record();
 assert.deepEqual(contentFindings(record,project).map(f=>f.targets[0].id).sort(),['q1-a','q4-a']);
 assert.deepEqual(contentFindings(record,project,new Set(['q4'])).map(f=>f.targets[0].id),['q1-a'],'a block the teacher decided is left alone');
 assert.ok(by['q1-a']);
});

test('the author sees the findings, the blocks, the source pages and the rules; the checker sees what changed',async t=>{
 const {space}=await seeded(t,[wrong('q1-a','The answer is 3.')]);
 const project=space.project(),index=bookletIndex(project),group=contentFindings(space.record(),project);
 const prompt=authorPrompt({project,index,group,pages:[{page:1,path:'p1.png'}]});
 for(const phrase of ['derive every answer you change yourself','"role"','"remove"','patch the parent\'s /children','The answer is 3.','"sourcePages"'])assert.ok(prompt.includes(phrase),phrase);
 assert.match(prompt,/ONE normally spaced expression/);assert.match(prompt,/type:"annotated-equation"/);assert.match(prompt,/optional additionalTargetIds:/);assert.match(prompt,/alongside targetId to point to multiple anchored terms without duplicating its text/);
 const withRendered=authorPrompt({project,index,group,pages:[{page:1,path:'p1.png'}],renderedPages:[{edition:'worked',page:4,path:'worked4.png'}]});
 const evidence=JSON.parse(withRendered.split('Input:\n')[1]);
 assert.deepEqual(evidence.currentRenderedPages,[{image:2,edition:'worked',page:4}]);
 assert.equal(evidence.blocks[0].json,undefined,'do not send a second copy of the same block');
 assert.ok(evidence.blocks[0].nodes.length);assert.ok(evidence.blocks[0].editionOverrides);
 assert.match(withRendered,/presentation.showLabels/);assert.match(withRendered,/cloze.blankStyle is unsupported/);
 assert.match(withRendered,/presentation.exampleLabels/);assert.match(withRendered,/Do not invent a "table-cell" response kind/);
 assert.match(withRendered,/BEFORE this repair, not its corrected result/);
 const check=checkPrompt({changes:[{id:'x',before:[],after:[]}],pages:[{page:1}]});
 assert.match(check,/BEFORE saving and rendering/);
 assert.match(check,/Do not reject an otherwise correct content repair solely because corrected-page images are absent/);
 assert.match(check,/remains visualVerified:false/);
 assert.match(check,/first derive, yourself, the correct answer/);assert.match(check,/"verdict":"accept\|reject"/);
});

test('operations: a role change, and a removal only when nothing leans on the block',()=>{
 const p=booklet();
 p.sections[1].blocks[1].dependsOn=['q3-root'];p.sections[1].blocks[4].flow={dependsOn:['q6']};p.sections[1].blocks[2].bankRef={id:'b1'};
 assert.match(removalBlocked(p,'q3'),/linked to the question bank/);
 assert.match(removalBlocked(p,'q6'),/depends on it/);
 assert.match(removalBlocked(p,'cover-block'),/only a practice question/);
 assert.match(removalBlocked(p,'q5'),/has dependencies/);
 assert.equal(removalBlocked(p,'q4'),'');
 const {project,applied,refused}=applyOperations(p,[{id:'f2',remove:'q6'},{id:'f1',remove:'q4'},{id:'f3',role:'review',blockId:'q1'},{id:'f4',role:'nonsense',blockId:'q1'}]);
 assert.deepEqual(applied,['f1','f3']);assert.deepEqual(refused.map(r=>r.id),['f2','f4']);
 assert.equal(project.sections[1].blocks.some(b=>b.id==='q4'),false);
 assert.equal(project.sections[1].blocks[0].pedagogyRole,'review');
});

// The author and the checker are two calls; the stub tells them apart by their prompts.
const stub=({corrections,comments=[],verdicts})=>{
 const calls=[];
 const ask=async({prompt,images,name})=>{
  calls.push({name,images});
  if(name==='content-author')return {result:{corrections,comments}};
  const ids=[...prompt.matchAll(/"id":"(fp-[0-9a-f]+)"/g)].map(m=>m[1]);
  return {result:{checks:[...new Set(ids)].map(id=>({id,verdict:verdicts[id]??'accept',derived:'6',note:'matches'}))}};
 };
 ask.calls=calls;return ask;
};

test('a wrong answer is corrected, independently checked, saved, and noted on the block',async t=>{
 const {space,by}=await seeded(t,[wrong('q1-a','The answer is 6.')]);
 const polishDir=path.join(space.dir,'polish'),id=by['q1-a'];
 const ask=stub({corrections:[{id,reason:'1x2 is 2, not 6',patches:[patch('q1-a','/answer/short','2','6')]}],verdicts:{}});
 const result=await runContentRepair({projectFile:space.projectFile,provenanceDir:path.join(space.dir,'provenance'),polishDir,ask});
 assert.deepEqual(result.applied,[id]);assert.deepEqual(result.errors,[]);assert.equal(result.calls,2,'one author call and one independent check');
 const saved=space.project(),part=saved.sections[1].blocks[0].content.children[0];
 assert.equal(part.answer.short,'6');
 const note=saved.sections[1].blocks[0].sourceReview.feedbackRepairs.at(-1);
 assert.equal(note.source,'polish');assert.match(note.note,/independently checked/);
 const row=space.record().findings.find(f=>f.id===id);
 assert.equal(row.state,'repaired');assert.equal(row.applyOutcome,'repaired');
 assert.deepEqual(ask.calls.map(c=>c.name),['content-author','content-check']);
});

test('the checker refusing a correction stops it being saved',async t=>{
 const {space,by}=await seeded(t,[wrong('q1-a')]);
 const id=by['q1-a'],before=space.project();
 const ask=stub({corrections:[{id,reason:'guess',patches:[patch('q1-a','/answer/short','2','7')]}],verdicts:{[id]:'reject'}});
 const result=await runContentRepair({projectFile:space.projectFile,provenanceDir:path.join(space.dir,'provenance'),polishDir:path.join(space.dir,'polish'),ask});
 assert.deepEqual(result.applied,[]);assert.equal(result.rejected.length,1);
 assert.deepEqual(space.project().sections[1].blocks[0],before.sections[1].blocks[0]);
 const row=space.record().findings.find(f=>f.id===id);
 assert.equal(row.state,'pending');assert.equal(row.applyOutcome,'comment');assert.match(row.applyNote,/independent check did not accept/);
});

test('a patch whose original does not match, or that touches settings, never reaches the save',async t=>{
 const {space,by}=await seeded(t,[wrong('q1-a'),wrong('q2-a')]);
 const before=space.project();
 const ask=stub({corrections:[{id:by['q1-a'],reason:'x',patches:[patch('q1-a','/answer/short','999','6')]},{id:by['q2-a'],reason:'y',patches:[patch('project','/settings/cover/course','Year 7','Year 8')]}],verdicts:{}});
 const result=await runContentRepair({projectFile:space.projectFile,provenanceDir:path.join(space.dir,'provenance'),polishDir:path.join(space.dir,'polish'),ask});
 assert.deepEqual(result.applied,[]);
 assert.match(result.commented.find(c=>c.id===by['q1-a']).why,/original differs/);
 assert.match(result.commented.find(c=>c.id===by['q2-a']).why,/may not change project settings/);
 assert.equal(JSON.stringify(space.project()),JSON.stringify(before));
 assert.equal(ask.calls.filter(c=>c.name==='content-check').length,0,'nothing staged, nothing to check');
});

test('a role change and a removal are applied after the patches, through the same independent check',async t=>{
 const {space,by}=await seeded(t,[finding(2,['q1'],{area:'content',comment:'This is review material.'}),finding(3,['q2'],{area:'duplicate',comment:'Same as q3.'})]);
 const delegate=stub({corrections:[{id:by.q1,reason:'review',role:'review',blockId:'q1'},{id:by.q2,reason:'duplicate',remove:'q6',blockId:'q2'}],verdicts:{}});
 const ask=async options=>{
  if(options.name==='content-check'){
   const rows=JSON.parse(options.prompt.split('Input:\n')[1]).corrections;
   const role=rows.find(row=>row.id===by.q1),removal=rows.find(row=>row.id===by.q2);
   if(role){assert.equal(role.after.find(b=>b.id==='q1').pedagogyRole,'review');assert.ok(role.fieldsChanged.includes('/pedagogyRole'));}
   if(removal){assert.ok(removal.before.some(b=>b.id==='q6'));assert.ok(!removal.after.some(b=>b.id==='q6'));}
  }
  return delegate(options);
 };
 const result=await runContentRepair({projectFile:space.projectFile,provenanceDir:path.join(space.dir,'provenance'),polishDir:path.join(space.dir,'polish'),ask});
 assert.deepEqual(result.applied.sort(),[by.q1,by.q2].sort());assert.deepEqual(result.operations.sort(),[by.q1,by.q2].sort());
 const saved=space.project();
 assert.equal(saved.sections[1].blocks.find(b=>b.id==='q1').pedagogyRole,'review');
 assert.equal(saved.sections[1].blocks.some(b=>b.id==='q6'),false);
});

test('repair author and checker receive printed presentation fields while review metadata stays omitted',async t=>{
 const {space,by}=await seeded(t,[wrong('q1-a')]);
 const id=by['q1-a'];let checked=false;
 const delegate=stub({corrections:[{id,reason:'Align the working',patches:[patch('q1-a','/align',null,'left')]}],verdicts:{}});
 const ask=async options=>{
  const payload=JSON.parse(options.prompt.split('Input:\n')[1]);
  if(options.name==='content-author'){
   assert.equal(payload.blocks[0].content.content.layout,'grid');
   assert.equal(payload.blocks[0].content.content.children[0].answerSpaceMm,18);
  }else{
   const row=payload.corrections.find(row=>row.id===id);
   assert.equal(row.after[0].content.children[0].align,'left');
   assert.ok(row.fieldsChanged.includes('/content/children'));
   assert.equal(row.after[0].sourceReview,undefined);checked=true;
  }
  return delegate(options);
 };
 const result=await runContentRepair({projectFile:space.projectFile,provenanceDir:path.join(space.dir,'provenance'),polishDir:path.join(space.dir,'polish'),ask});
 assert.equal(checked,true);assert.deepEqual(result.applied,[id]);
});

test('the content author receives the exact existing rendered finding page beside source evidence',async t=>{
 const {space,by}=await seeded(t,[wrong('q1-a')]);
 const sourceDir=path.join(space.dir,'evidence','pages'),exportDir=path.join(space.dir,'export');
 fs.mkdirSync(sourceDir,{recursive:true});fs.mkdirSync(exportDir);
 const source=path.join(sourceDir,'page-001.png'),rendered=path.join(exportDir,'student2.png');
 fs.writeFileSync(source,'source fixture');fs.writeFileSync(rendered,'rendered fixture');
 fs.writeFileSync(path.join(exportDir,'visual-plan.json'),JSON.stringify({student:{pending:[{page:2,image:rendered},{page:3,image:'absent.png'}]}}));
 let checked=false;
 const ask=async({prompt,images,name})=>{
  assert.equal(name,'content-author');
  assert.deepEqual(images,[source,rendered]);
  const payload=JSON.parse(prompt.split('Input:\n')[1]);
  assert.deepEqual(payload.sourcePages,[{image:1,sourcePage:1}]);
  assert.deepEqual(payload.currentRenderedPages,[{image:2,edition:'student',page:2}]);
  checked=true;return {result:{comments:[{findingId:by['q1-a'],why:'Fixture only'}]}};
 };
 await runContentRepair({projectFile:space.projectFile,provenanceDir:path.join(space.dir,'provenance'),polishDir:path.join(space.dir,'polish'),runDir:space.dir,exportDir,ask});
 assert.equal(checked,true);
});
