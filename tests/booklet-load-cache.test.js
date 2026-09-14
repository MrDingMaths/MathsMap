import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createMeasurementStore,boundedCache} from '../src/lib/booklet-cache-store.js';
import {publishRenderEntries,readRenderEntry,rendererFingerprint,diagramFingerprint,DIAGRAM_RENDER_INPUTS,assetFingerprint} from '../scripts/booklet/render-cache-server.mjs';
import {createBankManifestReader} from '../scripts/booklet/bank-manifest-cache.mjs';
import {normaliseQuestion} from '../src/lib/practice-question-model.js';
import {createEditableProject} from '../src/lib/editable-booklet-model.js';
import {listBookletProjects,openBookletProject} from '../scripts/booklet/project-studio-server.mjs';
import {openBookletProject as openClient} from '../src/lib/booklet-project-storage.js';

async function temporary(fn){const root=await fs.mkdtemp(path.join(os.tmpdir(),'mathsmap-load-'));try{await fn(root);}finally{await fs.rm(root,{recursive:true,force:true});}}
test('measurement storage degrades to bounded memory for unavailable and hung IndexedDB',async()=>{
 for(const indexedDB of [null,{open(){throw Error('private mode');}},{open(){return {};}}]){
  const store=createMeasurementStore({indexedDB,limit:2,timeoutMs:5});await store.set('a',{height:4,capacity:10});assert.deepEqual(await store.get('a'),{height:4,capacity:10});
  await store.set('bad',{height:NaN,capacity:10});assert.equal(await store.get('bad'),null);
  await store.set('b',{height:5,capacity:10});await store.set('c',{height:6,capacity:10});assert.equal(await store.get('a'),null);
 }
 const cache=boundedCache(2);cache.set('a',1);cache.set('b',2);cache.get('a');cache.set('c',3);assert.equal(cache.get('b'),undefined);
});
test('server cache rejects corrupted entries, mismatched runtimes and traversal',()=>temporary(async root=>{
 const version='a'.repeat(64),svg='<svg viewBox="0 0 10 10"><path d="M0 0L10 10"/></svg>';
 await publishRenderEntries(version,[{key:'diagram',svg}],{cacheRoot:root});assert.equal((await readRenderEntry(version,'diagram',{cacheRoot:root})).svg,svg);
 assert.equal(await readRenderEntry('b'.repeat(64),'diagram',{cacheRoot:root}),null);
 const file=path.join(root,version,'diagram.json'),row=JSON.parse(await fs.readFile(file));row.svg=svg+'corrupt';await fs.writeFile(file,JSON.stringify(row));assert.equal(await readRenderEntry(version,'diagram',{cacheRoot:root}),null);
 await assert.rejects(publishRenderEntries(version,[{key:'../escape',svg}],{cacheRoot:root}));
}));
test('renderer, fonts and image content invalidate hashes; remote/missing images disable reuse',()=>temporary(async root=>{
 await fs.mkdir(path.join(root,'src'));await fs.mkdir(path.join(root,'public/libs'),{recursive:true});
 for(const name of ['src/render.js','public/libs/font.woff','index.html','package-lock.json'])await fs.writeFile(path.join(root,name),'one');
 let before=await rendererFingerprint(root);await fs.writeFile(path.join(root,'src/render.js'),'two');let after=await rendererFingerprint(root);assert.notEqual(after,before);before=after;
 await fs.writeFile(path.join(root,'public/libs/font.woff'),'two');assert.notEqual(await rendererFingerprint(root),before);
 await fs.writeFile(path.join(root,'public/image.png'),'one');before=await assetFingerprint(['/image.png'],root);await fs.writeFile(path.join(root,'public/image.png'),'two');assert.notEqual(await assetFingerprint(['/image.png'],root),before);
 assert.equal(await assetFingerprint(['https://external/image.png'],root),null);assert.equal(await assetFingerprint(['/missing.png'],root),null);
}));
test('manifest reads are non-writing and detect edits, approval changes and deletion',()=>temporary(async root=>{
 const read=createBankManifestReader(),q=normaliseQuestion({id:'q',status:'approved',title:'Question',classification:{primarySkillId:'arithmetic',reasoningScore:5,difficultyReason:'Direct calculation'},content:{id:'n',prompt:'Calculate 1+1.',answer:{short:'2',worked:'1+1=2'}}});
 const file=path.join(root,'q.json');await fs.writeFile(file,JSON.stringify(q));
 const first=await read(root);assert.equal(first.questions.length,1);assert.equal(await read(root),first);assert.deepEqual(await fs.readdir(root),['q.json']);
 q.title='Changed';await fs.writeFile(file,JSON.stringify(q));assert.notEqual(await read(root),first);
 q.status='draft';await fs.writeFile(file,JSON.stringify(q));assert.equal((await read(root)).questions.length,0);
 await fs.unlink(file);assert.equal((await read(root)).questions.length,0);
}));
test('summary lists omit inventories and combined opening preserves the project revision without writing',()=>temporary(async root=>{
 const project=createEditableProject({id:'test',title:'Test'});project.source={inventory:['large evidence']};await fs.writeFile(path.join(root,'test.json'),JSON.stringify(project));
 const options={projectRoot:root,bankRoot:path.join(root,'bank')};
 assert.deepEqual((await listBookletProjects(options))[0].source,project.source);assert.equal('source' in (await listBookletProjects({...options,summary:true}))[0],false);
 const before=await fs.readFile(path.join(root,'test.json'),'utf8'),opened=await openBookletProject('test',options);assert.equal(opened.project.revision,project.revision);assert.deepEqual(opened.bankSync.items,[]);assert.equal(await fs.readFile(path.join(root,'test.json'),'utf8'),before);
}));
test('opening client uses one request and falls back only for legacy endpoints',async()=>{
 const calls=[],project={id:'p'};
 const loaded=await openClient('p',async url=>{calls.push(url);return {ok:true,json:async()=>({project,bankSync:{items:[]}})};});assert.deepEqual(loaded.project,project);assert.equal(calls.length,1);
 const fallback=[];await openClient('p',async url=>{fallback.push(url);return url.endsWith('/open')?{ok:false,status:404,json:async()=>({error:'not found'})}:{ok:true,json:async()=>url.endsWith('/bank-sync')?{items:[]}:project};});assert.equal(fallback.length,3);
 await assert.rejects(openClient('p',async()=>({ok:false,status:500,json:async()=>({error:'server failure'})})),/server failure/);
});


test('diagram versions survive UI/layout edits while measurements and runtime inputs invalidate',()=>temporary(async root=>{
 for(const file of [...DIAGRAM_RENDER_INPUTS,'src/App.svelte','src/components/FlowBookletPage.svelte','public/libs/tikzjax/font.woff','index.html','package-lock.json']){
  await fs.mkdir(path.dirname(path.join(root,file)),{recursive:true});await fs.writeFile(path.join(root,file),'one');
 }
 const diagram=await diagramFingerprint(root),layout=await rendererFingerprint(root);
 for(const file of ['src/App.svelte','src/components/FlowBookletPage.svelte'])await fs.writeFile(path.join(root,file),'two');
 assert.equal(await diagramFingerprint(root),diagram);
 assert.notEqual(await rendererFingerprint(root),layout);
 for(const file of [...DIAGRAM_RENDER_INPUTS,'public/libs/tikzjax/font.woff','package-lock.json']){
  const before=await diagramFingerprint(root);await fs.writeFile(path.join(root,file),'two');
  assert.notEqual(await diagramFingerprint(root),before,file+' must invalidate compiled diagrams');
 }
 await fs.writeFile(path.join(root,'public/libs/tikzjax/new-runtime.js'),'new');
 const added=await diagramFingerprint(root);await fs.unlink(path.join(root,'public/libs/tikzjax/new-runtime.js'));
 assert.notEqual(await diagramFingerprint(root),added,'runtime additions/deletions invalidate diagrams');
}));

test('the diagram fingerprint covers every relative runtime import and re-export',async()=>{
 const root=path.resolve('.'),covered=new Set(DIAGRAM_RENDER_INPUTS.map(file=>path.resolve(file))),queue=[...covered],seen=new Set();
 while(queue.length){
  const file=queue.pop();if(seen.has(file))continue;seen.add(file);
  const source=await fs.readFile(file,'utf8');
  for(const match of source.matchAll(/\b(?:from\s*|import\s*(?:\(\s*)?)['"](\.[^'"]+)['"]/g)){
   const dependency=path.resolve(path.dirname(file),match[1]);
   assert.ok(covered.has(dependency)||dependency.startsWith(path.join(root,'public/libs')+path.sep),'Add diagram dependency to DIAGRAM_RENDER_INPUTS: '+path.relative(root,dependency));
   queue.push(dependency);
  }
 }
});
