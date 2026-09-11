import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createEditableProject,createProjectBlock} from '../src/lib/editable-booklet-model.js';
import {createBookletProject,saveBookletProject,loadBookletProject} from '../scripts/booklet/project-studio-server.mjs';
import {revisionHash,writeTransaction} from '../scripts/booklet/bank-sync.mjs';
import {makeBankManifest} from '../src/lib/practice-question-model.js';
import {importProjectBank,practiceQuestions,verifyProjectBank} from '../scripts/booklet/import-project-bank.mjs';

const read=async f=>JSON.parse(await fs.readFile(f,'utf8'));
const write=async(f,v)=>{await fs.mkdir(path.dirname(f),{recursive:true});await fs.writeFile(f,JSON.stringify(v,null,2)+'\n');};
async function fixture(t){
  const parent=path.resolve('.booklet-work/bank-import-tests');await fs.mkdir(parent,{recursive:true});
  const root=await fs.mkdtemp(path.join(parent,'case-'));
  t.after(async()=>{assert.ok(root.startsWith(parent+path.sep));await fs.rm(root,{recursive:true,force:true});});
  const options={projectRoot:path.join(root,'booklets/projects'),bankRoot:path.join(root,'booklets/question-bank')};
  await write(path.join(root,'data/skills.json'),[{id:'sine-rule'},{id:'cosine-rule'}]);
  await write(path.join(options.bankRoot,'manifest.json'),makeBankManifest([]));
  await write(path.join(options.bankRoot,'.sync/links.json'),{});
  const p=createEditableProject({id:'test-transfer',title:'Transfer'});
  const b=createProjectBlock('question');b.id='q-source';b.content.prompt='Find the side.';b.content.answer={short:'2',worked:'The side is 2.',solutionDiagrams:[]};
  p.sections[0].phase='practice';p.sections[0].blocks=[b];
  const saved=await createBookletProject(p,options),assessments={projectId:p.id,questions:practiceQuestions(saved).map(b=>({sourceBlockId:b.id,contentHash:revisionHash(b.content),classification:{primarySkillId:'sine-rule',secondarySkillIds:[],difficulty:'Foundation',reasoningScore:20,difficultyReason:'Direct side calculation.'}}))};
  const assessmentsFile=path.join(root,'assessments.json');await write(assessmentsFile,assessments);
  const args={root,projectId:p.id,assessmentsFile,out:path.join(root,'stage')};return {root,options,args,assessments,saved};
}

test('stage reuse preserves IDs; publication is idempotent and owner saves sync',async t=>{
  const f=await fixture(t);const initial=await importProjectBank(f.args);assert.equal(initial.applied,false);
  const receipt=await read(path.join(f.args.out,'receipt.json'));
  assert.equal((await importProjectBank(f.args)).reused,true);
  assert.deepEqual(await read(path.join(f.args.out,'receipt.json')),receipt);
  const applied=await importProjectBank({...f.args,apply:true});assert.equal(applied.reused,true);
  const live=await loadBookletProject(f.saved.id,f.options);assert.equal(live.revision,f.saved.revision+1);
  assert.equal((await importProjectBank({...f.args,apply:true})).created,0);
  const original=practiceQuestions(live)[0].content.answer.worked;
  practiceQuestions(live)[0].content.answer.worked='A revised explanation gives 2.';
  const edited=await saveBookletProject(live,{...f.options,expectedRevision:live.revision});
  const bankFile=path.join(f.options.bankRoot,receipt.questions[0].bankId+'.json');
  assert.equal((await read(bankFile)).content.answer.worked,'A revised explanation gives 2.');
  practiceQuestions(edited)[0].content.answer.worked=original;
  const restored=await saveBookletProject(edited,{...f.options,expectedRevision:edited.revision});
  assert.equal((await verifyProjectBank(restored,f.options.bankRoot,{root:f.root,baseline:f.saved,assessments:f.assessments})).ownedAndSynced,1);
});

test('stale source and edited staging cannot publish',async t=>{
  const f=await fixture(t);await importProjectBank(f.args);
  const p=await loadBookletProject(f.saved.id,f.options);p.title='Concurrent edit';await saveBookletProject(p,{...f.options,expectedRevision:p.revision});
  await assert.rejects(importProjectBank({...f.args,apply:true}),/Staging inputs changed/);
  assert.equal((await read(path.join(f.options.bankRoot,'manifest.json'))).questions.length,0);
  const g=await fixture(t);await importProjectBank(g.args);
  const receipt=await read(path.join(g.args.out,'receipt.json'));receipt.method='Tampered';await write(path.join(g.args.out,'receipt.json'),receipt);
  await assert.rejects(importProjectBank({...g.args,apply:true}),/Staged artifacts changed/);
});

test('changed bank, assessments and stale content hashes reject reuse',async t=>{
  const f=await fixture(t);await importProjectBank(f.args);
  await write(path.join(f.options.bankRoot,'.sync/links.json'),{unrelated:{projectId:'other'}});
  await assert.rejects(importProjectBank({...f.args,apply:true}),/Staging inputs changed/);
  const g=await fixture(t);await importProjectBank(g.args);g.assessments.questions[0].classification.reasoningScore=21;await write(g.args.assessmentsFile,g.assessments);
  await assert.rejects(importProjectBank({...g.args,apply:true}),/Staging inputs changed/);
  g.assessments.questions[0].contentHash='stale';await write(g.args.assessmentsFile,g.assessments);
  await assert.rejects(importProjectBank(g.args),/assessment is stale/);
});

test('shared transaction rolls back an earlier write when a later rename fails',async t=>{
  const f=await fixture(t),first=path.join(f.root,'first.json'),blocked=path.join(f.root,'blocked.json');
  await write(first,{before:true});await write(blocked,{before:true});
  // A directory at the temporary filename forces failure after first was written.
  await fs.mkdir(blocked+'.sync-tmp');
  await assert.rejects(writeTransaction([[first,{after:true}],[blocked,{after:true}]]));
  assert.deepEqual(await read(first),{before:true});assert.deepEqual(await read(blocked),{before:true});
});
