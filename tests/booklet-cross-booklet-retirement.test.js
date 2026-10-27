import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createBookletProject,duplicateBookletProject,saveBookletProject,projectStudioPlugin} from '../scripts/booklet/project-studio-server.mjs';
import {addProjectBlock,createProjectBlock} from '../src/lib/editable-booklet-model.js';

test('retired cross-booklet endpoints cannot refresh or propagate shared content',async()=>{
 let handler;projectStudioPlugin().configureServer({middlewares:{use(value){handler=value;}}});
 for(const suffix of ['/shared','/shared/comparison'])for(const method of ['GET','POST']){
  let body;const res={setHeader(){},end(value){body=JSON.parse(value);}};
  await handler({url:'/__booklet/projects/retired-test'+suffix,method},res,()=>assert.fail('must be handled'));
  assert.equal(res.statusCode,404);assert.match(body.error,/endpoint not found/);
 }
});

test('ordinary revision-safe saves leave a copied booklet and retired registry untouched',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'booklet-no-cross-sync-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const options={projectRoot:path.join(root,'projects'),bankRoot:path.join(root,'bank'),moduleRoot:path.join(root,'modules'),sharedRoot:path.join(root,'shared-content')};
 let first=await createBookletProject({title:'Independent course'},options);
 const block={...createProjectBlock('rich-text'),content:'Original teaching.'};
 first=await saveBookletProject(addProjectBlock(first,first.sections[0].id,block),{...options,expectedRevision:first.revision});
 const copy=await duplicateBookletProject(first.id,options),file=path.join(options.projectRoot,copy.id+'.json'),before=fs.readFileSync(file);
 first.sections[0].blocks[0].content='Course-specific teaching.';
 const saved=await saveBookletProject(first,{...options,expectedRevision:first.revision});
 assert.equal(saved.sections[0].blocks[0].content,'Course-specific teaching.');assert.ok(fs.readFileSync(file).equals(before));
 assert.equal(fs.existsSync(options.sharedRoot),false);
 await assert.rejects(saveBookletProject(first,{...options,expectedRevision:first.revision}),/changed in another session/);
});

test('Studio client has no retired status polling, badges or management actions',()=>{
 const project=fs.readFileSync(new URL('../src/components/BookletProjects.svelte',import.meta.url),'utf8');
 const page=fs.readFileSync(new URL('../src/components/TranscribedBookletPage.svelte',import.meta.url),'utf8');
 const storage=fs.readFileSync(new URL('../src/lib/booklet-project-storage.js',import.meta.url),'utf8');
 assert.doesNotMatch(project,/BookletSharedContent|refreshShared|resolveProjectShared|reviewDock='shared'/);
 assert.doesNotMatch(page,/data-editor-shared|openShared|sharedMarker/);
 assert.doesNotMatch(storage,/\/shared(?:[/'?]|$)/);
});
