import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {saveBookletProject,patchBookletProject} from '../scripts/booklet/project-studio-server.mjs';
import {applySavePatch,canonicalJson,createSavePatch} from '../src/lib/booklet-save-patch.js';

const FIXTURE='booklets/projects/measurement-error-v1.json';
const hash=value=>createHash('sha256').update(canonicalJson(value)).digest('hex');
const stable=text=>JSON.parse(text,(key,value)=>key==='updatedAt'?'T':value);

async function roots(){
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'patch-save-')),made={};
  for(const name of ['put','patch']){
    const projectRoot=path.join(root,name,'projects'),bankRoot=path.join(root,name,'bank');
    await fs.mkdir(projectRoot,{recursive:true});await fs.mkdir(bankRoot,{recursive:true});
    await fs.copyFile(FIXTURE,path.join(projectRoot,path.basename(FIXTURE)));
    made[name]={projectRoot,bankRoot};
  }
  return {root,...made};
}

test('patch saves write the same project file as whole-project saves',async()=>{
  const {root,put,patch}=await roots();
  try{
    const file=name=>path.join(name.projectRoot,path.basename(FIXTURE));
    let base=JSON.parse(await fs.readFile(file(patch),'utf8'));const id=base.id;
    const edits=[
      p=>{p.title=p.title+' (edited)';},
      p=>{const block=p.sections.flatMap(s=>s.blocks).find(b=>b.type==='question');block.title='Patched question';},
      p=>{const section=p.sections.find(s=>s.blocks.length>1);section.blocks.splice(1,1);},
      p=>{p.settings={...p.settings,patchProbe:true};},
    ];
    for(const edit of edits){
      const current=JSON.parse(await fs.readFile(file(put),'utf8'));const next=structuredClone(current);edit(next);
      await saveBookletProject(next,{...put,expectedRevision:current.revision});
      const snapshot=structuredClone(base);edit(snapshot);
      const result=await patchBookletProject(id,{patch:createSavePatch(base,snapshot),baseRevision:base.revision,baseHash:hash(base)},patch);
      base=applySavePatch(snapshot,result.serverPatch);
      const [whole,patched]=await Promise.all([fs.readFile(file(put),'utf8'),fs.readFile(file(patch),'utf8')]);
      assert.deepEqual(stable(patched),stable(whole));
      assert.equal(hash(base),hash(JSON.parse(patched)),'the client base matches the stored file after each patch save');
    }
  }finally{await fs.rm(root,{recursive:true,force:true});}
});

test('patch saves refuse a stale revision and a different base',async()=>{
  const {root,patch}=await roots();
  try{
    const base=JSON.parse(await fs.readFile(path.join(patch.projectRoot,path.basename(FIXTURE)),'utf8'));
    const edit=createSavePatch(base,{...base,title:'x'});
    await assert.rejects(patchBookletProject(base.id,{patch:edit,baseRevision:base.revision-1,baseHash:hash(base)},patch),e=>e.statusCode===409);
    await assert.rejects(patchBookletProject(base.id,{patch:edit,baseRevision:base.revision,baseHash:hash({...base,title:'other'})},patch),e=>e.statusCode===412);
    await assert.rejects(patchBookletProject(base.id,{patch:[{path:['id'],value:'elsewhere'}],baseRevision:base.revision,baseHash:hash(base)},patch),e=>e.statusCode===400);
  }finally{await fs.rm(root,{recursive:true,force:true});}
});
