import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {archiveFiles, inside, maintainProjectHistory, revisionCandidates, restoreArchive, sha256, withArchiveLock} from '../scripts/booklet/storage-archive.mjs';
import {createBookletProject, saveBookletProject} from '../scripts/booklet/project-studio-server.mjs';
import {CHECKPOINT_INTERVAL_MS, projectCheckpointEntries} from '../scripts/booklet/project-checkpoints.mjs';
import {writeTransaction} from '../scripts/booklet/bank-sync.mjs';

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(),'mathsmap-storage-'));
  t.after(()=>fs.rm(root,{recursive:true,force:true}));
  const projectRoot = path.join(root,'projects'), archiveRoot = path.join(root,'.storage-archives');
  await fs.mkdir(projectRoot);
  const put = async (name,value) => { const file=inside(root,name); await fs.mkdir(path.dirname(file),{recursive:true}); await fs.writeFile(file, typeof value==='string'?value:JSON.stringify(value)); };
  return {root,projectRoot,archiveRoot,put};
}
test('retention keeps latest 20 and milestones; retired history and bank baselines are separate', async t=>{
  const f=await fixture(t);
  await f.put('projects/active.json',{id:'active',revision:26});
  for (const id of ['active','retired']) for(let n=1;n<=25;n++) await f.put(`projects/.revisions/${id}/${n}.json`,{id,revision:n});
  await f.put('projects/.revisions/milestones.json',{active:[2],retired:[3]});
  await f.put('projects/.revisions/.checkpoints/123.json',{version:1,at:1000,revision:1});
  await f.put('question-bank/.revisions/q/baseline.json','bank baseline');
  const plan=await revisionCandidates(f.projectRoot,{retired:true});
  assert.equal(plan.files.length,28);
  const result=await withArchiveLock(f.archiveRoot,()=>archiveFiles({...plan,archiveRoot:f.archiveRoot,label:'test',prune:true}));
  assert.equal(result.removedFiles,28);
  assert.equal((await fs.readdir(path.join(f.projectRoot,'.revisions/active'))).length,21);
  assert.deepEqual(await fs.readdir(path.join(f.projectRoot,'.revisions/retired')),['3.json']);
  assert.equal(await fs.readFile(path.join(f.root,'question-bank/.revisions/q/baseline.json'),'utf8'),'bank baseline');
  const out=path.join(f.root,'restored');
  assert.equal((await restoreArchive({archiveRoot:f.archiveRoot,manifestPath:result.manifest,outputRoot:out})).files,28);
  assert.equal(JSON.parse(await fs.readFile(path.join(out,'projects/.revisions/active/1.json'))).revision,1);
  await assert.rejects(restoreArchive({archiveRoot:f.archiveRoot,manifestPath:result.manifest,outputRoot:out}),/exists/);
  assert.equal((await revisionCandidates(f.projectRoot,{retired:true})).files.length,0);
});
test('archive objects deduplicate and corrupt archives never authorize pruning',async t=>{
  const f=await fixture(t), value='recoverable '.repeat(1000);
  await f.put('one.json',value); await f.put('two.json',value);
  const first=await archiveFiles({sourceRoot:f.root,archiveRoot:f.archiveRoot,files:['one.json'],label:'first'});
  const second=await archiveFiles({sourceRoot:f.root,archiveRoot:f.archiveRoot,files:['two.json'],label:'second',prune:true});
  assert.equal(second.addedBytes,0); assert.ok(first.addedBytes<value.length);
  const hash=sha256(Buffer.from(value));
  await fs.writeFile(path.join(f.archiveRoot,'objects',hash.slice(0,2),hash+'.gz'),'corrupt');
  await assert.rejects(archiveFiles({sourceRoot:f.root,archiveRoot:f.archiveRoot,files:['one.json'],label:'bad',prune:true}));
  assert.equal(await fs.readFile(path.join(f.root,'one.json'),'utf8'),value);
  await assert.rejects(restoreArchive({archiveRoot:f.archiveRoot,manifestPath:first.manifest}));
});
test('malformed pins fail closed; maintenance lock excludes concurrent pruning',async t=>{
  const f=await fixture(t);
  await f.put('projects/.revisions/milestones.json',{active:'all'});
  await assert.rejects(maintainProjectHistory(f.projectRoot,'active'),/milestone/);
  await withArchiveLock(f.archiveRoot,async()=>{
    await assert.rejects(withArchiveLock(f.archiveRoot,()=>{}),/already running/);
  });
  assert.equal(await fs.stat(path.join(f.archiveRoot,'maintenance.lock')).catch(()=>null),null);
});
test('restore rejects path traversal and archive operations reject linked ancestors',async t=>{
  const f=await fixture(t);
  for(const p of ['../outside','a/../b','C:/outside','/absolute','a\\b']) assert.throws(()=>inside(f.root,p));
  await f.put('bad.json',{format:'mathsmap-storage-archive-v1',entries:[{path:'../outside',bytes:0,sha256:'0'.repeat(64)}]});
  await assert.rejects(restoreArchive({archiveRoot:f.archiveRoot,manifestPath:path.join(f.root,'bad.json'),outputRoot:path.join(f.root,'out')}),/path/i);
  const target=path.join(f.root,'real'); await fs.mkdir(target); await fs.writeFile(path.join(target,'keep.json'),'keep');
  await fs.symlink(target,path.join(f.root,'linked'),'junction');
  await assert.rejects(archiveFiles({sourceRoot:f.root,archiveRoot:f.archiveRoot,files:['linked/keep.json'],prune:true}),/linked/);
  assert.equal(await fs.readFile(path.join(target,'keep.json'),'utf8'),'keep');
});
test('explicit checkpoints use the same bounded history without changing saved content',async t=>{
  const f=await fixture(t), options={projectRoot:f.projectRoot,bankRoot:path.join(f.root,'question-bank')};
  let project=await createBookletProject({title:'Storage test'},options);
  for(let n=0;n<22;n++) project=await saveBookletProject({...project,subtitle:'Save '+n},{...options,expectedRevision:project.revision,checkpoint:true});
  assert.equal(project.revision,23); assert.equal(project.subtitle,'Save 21');
  assert.equal((await fs.readdir(path.join(f.projectRoot,'.revisions',project.id))).length,20);
  assert.equal((await fs.readdir(path.join(f.archiveRoot,'manifests'))).length,2);
  await fs.writeFile(path.join(f.archiveRoot,'maintenance.lock'),'busy');
  project=await saveBookletProject({...project,subtitle:'Still saved'},{...options,expectedRevision:project.revision,checkpoint:true});
  assert.equal(project.subtitle,'Still saved');
  assert.equal((await fs.readdir(path.join(f.projectRoot,'.revisions',project.id))).length,21);
});

test('20 small autosaves persist every edit but create one backup; stale saves remain rejected',async t=>{
  const f=await fixture(t),options={projectRoot:f.projectRoot,bankRoot:path.join(f.root,'question-bank')};
  let project=await createBookletProject({title:'Adjust image'},options);
  const first=structuredClone(project);
  for(let n=1;n<=20;n++) {
    project=await saveBookletProject({...project,subtitle:'Adjustment '+n},{...options,expectedRevision:project.revision});
    const disk=JSON.parse(await fs.readFile(path.join(f.projectRoot,project.id+'.json'),'utf8'));
    assert.equal(disk.subtitle,'Adjustment '+n);
  }
  assert.equal(project.revision,21); // Concurrency token is independent of backup count.
  assert.deepEqual(await fs.readdir(path.join(f.projectRoot,'.revisions',project.id)),['1.json']);
  assert.equal(JSON.parse(await fs.readFile(path.join(f.projectRoot,'.revisions',project.id,'1.json'),'utf8')).subtitle,first.subtitle);
  await assert.rejects(saveBookletProject(first,{...options,expectedRevision:1}),/another session/);
});

test('checkpoint cadence survives restart, captures the prior settled state and preserves milestones',async t=>{
  const f=await fixture(t),start=1_000_000;
  const p={id:'active',revision:1,subtitle:'Before adjustments'};
  await writeTransaction(await projectCheckpointEntries(f.projectRoot,p,{now:start}));
  // Each call reloads its clock from disk; no process-local timer or session is needed.
  const latest={...p,revision:21,subtitle:'Final position'};
  assert.deepEqual(await projectCheckpointEntries(f.projectRoot,latest,{now:start+CHECKPOINT_INTERVAL_MS-1}),[]);
  const next=await projectCheckpointEntries(f.projectRoot,latest,{now:start+CHECKPOINT_INTERVAL_MS});
  assert.equal(next[0][1].subtitle,'Final position');
  await writeTransaction(next);
  await f.put('projects/.revisions/milestones.json',{active:[22]});
  assert.equal((await projectCheckpointEntries(f.projectRoot,{...latest,revision:22},{now:start+CHECKPOINT_INTERVAL_MS+1})).length,2);
  assert.equal((await projectCheckpointEntries(f.projectRoot,{...latest,revision:23},{now:start-1})).length,2); // Clock rollback fails safe.
  await f.put('projects/.revisions/.checkpoints/active.json','broken');
  assert.equal((await projectCheckpointEntries(f.projectRoot,latest,{now:start+1})).length,2);
});

test('failed transactions do not advance the checkpoint clock',async t=>{
  const f=await fixture(t),previous={id:'active',revision:1};
  const entries=await projectCheckpointEntries(f.projectRoot,previous,{now:1000});
  await assert.rejects(writeTransaction([...entries,[path.join(f.root,'blocked'),{value:'file cannot be a directory'}],[path.join(f.root,'blocked','project.json'),previous]]));
  assert.equal(await fs.stat(entries[0][0]).catch(()=>null),null);
  assert.equal((await projectCheckpointEntries(f.projectRoot,previous,{now:1001})).length,2);
});
