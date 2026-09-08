import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createEditableProject,createProjectBlock,snapshotBankQuestion} from '../src/lib/editable-booklet-model.js';
import {createBookletProject,saveBookletProject,promoteProjectQuestion,loadBookletProject,getProjectBankSync,resolveProjectBankSync,duplicateBookletProject} from '../scripts/booklet/project-studio-server.mjs';
import {revisionHash,writeTransaction,bankManifestEntry} from '../scripts/booklet/bank-sync.mjs';
import {sharedQuestion,mergeQuestionContent} from '../src/lib/question-sync.js';
import {normaliseQuestion} from '../src/lib/practice-question-model.js';

async function fixture(t){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'booklet-bank-sync-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const options={projectRoot:path.join(root,'projects'),bankRoot:path.join(root,'bank'),moduleRoot:path.join(root,'modules')};
 const p=createEditableProject({id:'original',title:'Original'}),b=createProjectBlock('question');b.id='question-a';
 b.classification={primarySkillId:'solve-linear-1-step'};
 b.content.prompt='Solve $x+1=3$';b.content.answer={short:'2',worked:'$x=2$',solutionDiagrams:[]};b.content.answerSpaceMm=20;
 p.sections[0].blocks=[b];await createBookletProject(p,options);
 const result=await promoteProjectQuestion(p.id,{blockId:b.id,mode:'create'},options);
 return{...options,options,project:result.project,bank:result.question,readBank:async()=>JSON.parse(await fs.readFile(path.join(options.bankRoot,result.question.id+'.json'),'utf8'))};
}
test('original saves sync content and solutions, preserve bank layout, and retain old revision',async t=>{
 const f=await fixture(t),p=f.project;p.sections[0].blocks[0].content.answer.worked='$x=3-1=2$';p.sections[0].blocks[0].content.answerSpaceMm=90;
 await saveBookletProject(p,{...f.options,expectedRevision:p.revision});const bank=await f.readBank();
 assert.equal(bank.content.answer.worked,'$x=3-1=2$');assert.equal(bank.content.answerSpaceMm,20);
 assert.deepEqual(bank.classification,f.bank.classification);
 assert.ok(await fs.readFile(path.join(f.bankRoot,'.revisions',bank.id,revisionHash(f.bank)+'.json')));
 assert.equal((await getProjectBankSync(p.id,f.options)).items[0].state,'synced');
});
test('layout-only saves do not create a bank revision',async t=>{
 const f=await fixture(t);f.project.sections[0].blocks[0].content.answerSpaceMm=100;
 await saveBookletProject(f.project,{...f.options,expectedRevision:f.project.revision});assert.deepEqual(await f.readBank(),f.bank);
});
test('both-side changes pause automatic sync while preserving the saved booklet; stale resolutions fail',async t=>{
 const f=await fixture(t),bank={...f.bank,content:{...f.bank.content,prompt:'Bank edit'}};
 await writeTransaction([[path.join(f.bankRoot,f.bank.id+'.json'),bank]]);
 f.project.sections[0].blocks[0].content.prompt='Booklet edit';
 const saved=await saveBookletProject(f.project,{...f.options,expectedRevision:f.project.revision});
 assert.equal((await f.readBank()).content.prompt,'Bank edit');
 const item=(await getProjectBankSync(saved.id,f.options)).items[0];assert.equal(item.state,'conflict');assert.equal(item.local.content.prompt,'Booklet edit');
 await assert.rejects(()=>resolveProjectBankSync(saved.id,{...item,bankRevision:'stale',action:'use-booklet',expectedRevision:saved.revision},f.options),/changed/);
 await resolveProjectBankSync(saved.id,{...item,action:'use-booklet',expectedRevision:saved.revision},f.options);
 assert.equal((await f.readBank()).content.prompt,'Booklet edit');
});
test('copied booklets stay pinned and explicitly accept bank updates without losing local layout or IDs',async t=>{
 const f=await fixture(t),copy=await duplicateBookletProject(f.project.id,{...f.options,title:'Copy'});
 copy.sections[0].blocks[0].content.answerSpaceMm=70;
 const local=await saveBookletProject(copy,{...f.options,expectedRevision:copy.revision});
 f.project.sections[0].blocks[0].content.answer.worked='New working';
 await saveBookletProject(f.project,{...f.options,expectedRevision:f.project.revision});
 const unchanged=await loadBookletProject(local.id,f.options);assert.equal(unchanged.sections[0].blocks[0].content.answer.worked,'$x=2$');
 const item=(await getProjectBankSync(local.id,f.options)).items[0];assert.equal(item.owner,false);assert.equal(item.state,'update');
 const updated=await resolveProjectBankSync(local.id,{...item,action:'use-bank',expectedRevision:local.revision},f.options);
 assert.equal(updated.sections[0].blocks[0].content.answer.worked,'New working');assert.equal(updated.sections[0].blocks[0].content.answerSpaceMm,70);
 assert.equal(updated.sections[0].blocks[0].content.id,local.sections[0].blocks[0].content.id);
});
test('rekeyed snapshots compare equally and retain internal diagram links when refreshed',()=>{
 const bank={id:'q-test',content:{id:'root',type:'question',prompt:'Graph',children:[],questionDiagrams:[{id:'diagram',format:'image',src:'/graph.png',widthMm:50}],sharedSolutionDiagramId:'diagram',answer:{worked:'Graph',short:'Graph',solutionDiagrams:[]}}};
 const local=snapshotBankQuestion(bank,{placementId:'placed'});assert.deepEqual(sharedQuestion(normaliseQuestion(bank)),sharedQuestion(local));
 const next=structuredClone(bank.content);next.prompt='Updated graph';
 const merged=mergeQuestionContent(next,local.content,bank.content);
 assert.equal(merged.id,local.content.id);assert.equal(merged.sharedSolutionDiagramId,merged.questionDiagrams[0].id);
});
test('concurrent saves serialize and reject the stale project revision',async t=>{
 const f=await fixture(t);const results=await Promise.allSettled([saveBookletProject(f.project,{...f.options,expectedRevision:f.project.revision}),saveBookletProject(f.project,{...f.options,expectedRevision:f.project.revision})]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.statusCode,409);
});

test('bank-only changes are offered, not overwritten by a layout save',async t=>{
 const f=await fixture(t),bank=structuredClone(f.bank);bank.content.answer.worked='Bank correction';await writeTransaction([[path.join(f.bankRoot,bank.id+'.json'),bank]]);
 f.project.sections[0].blocks[0].content.answerSpaceMm=60;
 await saveBookletProject(f.project,{...f.options,expectedRevision:f.project.revision});
 assert.equal((await f.readBank()).content.answer.worked,'Bank correction');assert.equal((await getProjectBankSync(f.project.id,f.options)).items[0].state,'update');
});
test('a removed bank question is never recreated by an original save',async t=>{
 const f=await fixture(t);await fs.unlink(path.join(f.bankRoot,f.bank.id+'.json'));
 f.project.sections[0].blocks[0].content.prompt='Local change after deletion';
 await saveBookletProject(f.project,{...f.options,expectedRevision:f.project.revision});
 await assert.rejects(f.readBank,/ENOENT/);assert.equal((await getProjectBankSync(f.project.id,f.options)).items[0].state,'missing');
});
test('copies created after an automatic update pin that new revision',async t=>{
 const f=await fixture(t);f.project.sections[0].blocks[0].content.prompt='First update';
 let source=await saveBookletProject(f.project,{...f.options,expectedRevision:f.project.revision});
 const copy=await duplicateBookletProject(source.id,f.options);assert.equal(copy.sections[0].blocks[0].bankRef.revision,revisionHash(await f.readBank()));
 source.sections[0].blocks[0].content.prompt='Second update';await saveBookletProject(source,{...f.options,expectedRevision:source.revision});
 assert.equal((await getProjectBankSync(copy.id,f.options)).items[0].state,'update');
});
test('a write failure restores earlier transaction files',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'bank-sync-rollback-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const first=path.join(root,'first.json'),second=path.join(root,'second.json');await fs.writeFile(first,'{"before":true}');
 const rename=fs.rename;let calls=0;
 try{fs.rename=async(...args)=>{if(++calls===2)throw new Error('Simulated write failure');return rename(...args);};await assert.rejects(()=>writeTransaction([[first,{after:true}],[second,{new:true}]]),/Simulated/);}
 finally{fs.rename=rename;}
 assert.equal(await fs.readFile(first,'utf8'),'{"before":true}');await assert.rejects(()=>fs.readFile(second),/ENOENT/);
});
