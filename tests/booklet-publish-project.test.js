import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createEditableProject} from '../src/lib/editable-booklet-model.js';
import {publishProject,publicationDiff} from '../scripts/booklet/publish-project.mjs';
import {prepareProjectWrite} from '../scripts/booklet/project-studio-server.mjs';

function fixture(t){
 const tempRoot=path.resolve(os.tmpdir()),root=fs.mkdtempSync(path.join(tempRoot,'publish-project-'));
 t.after(()=>{const target=path.resolve(root);assert.equal(path.dirname(target),tempRoot);assert.ok(path.basename(target).startsWith('publish-project-'));fs.rmSync(target,{recursive:true,force:true});});
 const project={...createEditableProject({id:'book',title:'Book'}),revision:4};
 fs.mkdirSync(path.join(root,'booklets/projects'),{recursive:true});fs.mkdirSync(path.join(root,'booklets/question-bank'),{recursive:true});
 const live=path.join(root,'booklets/projects/book.json');fs.writeFileSync(live,JSON.stringify(project));
 const candidate=structuredClone(project);candidate.title='Renamed';const candidateFile=path.join(root,'candidate.json');fs.writeFileSync(candidateFile,JSON.stringify(candidate));
 // Stand-in for the Studio queue: the same revision-checked write it performs.
 const save=async(next,{expectedRevision})=>{const current=JSON.parse(fs.readFileSync(live,'utf8'));if(current.revision!==expectedRevision)throw Error('409 revision conflict');const {project:saved}=await prepareProjectWrite(current,next,{checkpoint:false,projectRoot:path.join(root,'booklets/projects'),bankRoot:path.join(root,'booklets/question-bank')});fs.writeFileSync(live,JSON.stringify(saved));return saved;};
 return {root,live,candidateFile,save};
}

test('dry run saves nothing and reports what would change',async t=>{
 const f=fixture(t),before=fs.readFileSync(f.live,'utf8');
 const result=await publishProject({candidateFile:f.candidateFile,expectedRevision:4,root:f.root,save:f.save});
 assert.equal(result.dryRun,true);assert.deepEqual(result.diff.otherFields,['title']);assert.equal(fs.readFileSync(f.live,'utf8'),before);
});
test('apply saves with the expected revision, reads back and appends one ledger row',async t=>{
 const f=fixture(t),ledger=path.join(f.root,'ledger.jsonl'),record=path.join(f.root,'publication.json');
 const result=await publishProject({candidateFile:f.candidateFile,expectedRevision:4,apply:true,record,ledger,note:'title',root:f.root,save:f.save});
 assert.equal(result.readback,true);assert.equal(JSON.parse(fs.readFileSync(f.live,'utf8')).revision,5);
 assert.equal(fs.readFileSync(ledger,'utf8').trim().split('\n').length,1);
 await assert.rejects(publishProject({candidateFile:f.candidateFile,expectedRevision:5,apply:true,record,root:f.root,save:f.save}),/already exists/);
});
test('a stale expected revision is refused before any write',async t=>{
 const f=fixture(t);
 await assert.rejects(publishProject({candidateFile:f.candidateFile,expectedRevision:3,apply:true,root:f.root,save:f.save}),/Live revision is 4/);
});
test('the diff names added, removed, changed and reordered blocks',()=>{
 const b=id=>({id,type:'practice'}),before={sections:[{id:'s',blocks:[b('a'),b('b'),b('c')]}]},after={sections:[{id:'s',blocks:[b('c'),{...b('a'),note:1},b('d')]}]};
 const diff=publicationDiff(before,after);
 assert.deepEqual([diff.added,diff.removed,diff.changed,diff.reordered],[['d'],['b'],['a'],true]);
});
