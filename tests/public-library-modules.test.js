import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {publicLibraryModulesPlugin} from '../scripts/vite-public-modules.mjs';

test('browser imports use canonical public URLs without changing Node/build imports',()=>{
 const plugin=publicLibraryModulesPlugin(),root=path.resolve('.');plugin.configResolved({publicDir:path.join(root,'public')});
 const importer=path.join(root,'src/lib/document-content.js');
 assert.equal(plugin.apply,'serve');
 for(const name of ['table-model','arrangement-model','math-selection','tab-layout','table-annotations','question-scaffolds']){
  assert.deepEqual(plugin.resolveId('../../public/libs/maths-editor/'+name+'.mjs',importer),{id:'/libs/maths-editor/'+name+'.mjs',external:true});
 }
 assert.equal(plugin.resolveId('../../public/libs/maths-editor/table-model.mjs',importer,{ssr:true}),null);
 assert.equal(plugin.resolveId('./document-content.js',importer),null);
 assert.equal(plugin.resolveId('svelte',importer),null);
 assert.equal(plugin.resolveId('../../public/libs/maths-editor/table-model.mjs?raw',importer),null);
 assert.equal(plugin.resolveId('../../public/libs/maths-editor-extra/file.mjs',importer),null);
});


test('standalone library edits reload native browser modules',()=>{
 const plugin=publicLibraryModulesPlugin(),root=path.resolve('.'),messages=[];
 plugin.configResolved({publicDir:path.join(root,'public')});
 const server={ws:{send:message=>messages.push(message)}};
 assert.deepEqual(plugin.handleHotUpdate({file:path.join(root,'public/libs/maths-editor/table-model.mjs'),server}),[]);
 assert.deepEqual(messages,[{type:'full-reload'}]);
 assert.equal(plugin.handleHotUpdate({file:path.join(root,'src/App.svelte'),server}),undefined);
 assert.equal(messages.length,1);
});
