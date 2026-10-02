import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createServer} from 'vite';
import {publicLibraryModulesPlugin} from '../scripts/vite-public-modules.mjs';

test('browser imports use canonical public URLs without changing Node/build imports',()=>{
 const plugin=publicLibraryModulesPlugin(),root=path.resolve('.');plugin.configResolved({publicDir:path.join(root,'public')});
 const importer=path.join(root,'src/lib/document-content.js');
 assert.equal(plugin.apply,'serve');
 for(const name of ['table-model','arrangement-model','math-selection','tab-layout','table-annotations','question-scaffolds']){
  assert.deepEqual(plugin.resolveId('../../public/libs/maths-editor/'+name+'.mjs',importer),{id:'/libs/maths-editor/'+name+'.mjs',external:true});
 }
 const nested=plugin.resolveId('./equation-spacing.mjs','/libs/maths-editor/document-model.mjs');
 assert.deepEqual(nested,{id:'/libs/maths-editor/equation-spacing.mjs',external:true});
 assert.equal(plugin.load(nested.id),fs.readFileSync(path.join(root,'public/libs/maths-editor/equation-spacing.mjs'),'utf8'));
 assert.equal(plugin.load('/libs/maths-editor/equation-spacing.mjs?import'),fs.readFileSync(path.join(root,'public/libs/maths-editor/equation-spacing.mjs'),'utf8'));
 assert.equal(plugin.load('/libs/maths-editor/document-editor.css'),null);
 assert.equal(plugin.load('/libs/other/file.mjs'),null);
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

test('dependency scanning resolves real public files without changing browser, SSR or query identities',()=>{
 const plugin=publicLibraryModulesPlugin(),root=path.resolve('.');
 plugin.configResolved({publicDir:path.join(root,'public')});
 const importer=path.join(root,'src/components/BookletRichText.svelte'),source='../../public/libs/maths-editor/document-model.mjs';
 const expected=path.join(root,'public/libs/maths-editor/document-model.mjs').split(path.sep).join('/');
 assert.deepEqual(plugin.resolveId(source,importer,{scan:true}),{id:expected});
 assert.equal(fs.existsSync(expected),true);
 assert.deepEqual(plugin.resolveId('./table-model.mjs',expected,{scan:true}),{id:path.join(root,'public/libs/maths-editor/table-model.mjs').split(path.sep).join('/')});
 assert.deepEqual(plugin.resolveId('./table-model.mjs','/libs/maths-editor/document-model.mjs',{scan:true}),{id:path.join(root,'public/libs/maths-editor/table-model.mjs').split(path.sep).join('/')});
 assert.deepEqual(plugin.resolveId(source,importer),{id:'/libs/maths-editor/document-model.mjs',external:true});
 assert.equal(plugin.resolveId(source,importer,{scan:true,ssr:true}),null);
 assert.equal(plugin.resolveId(source+'?raw',importer,{scan:true}),null);
 assert.equal(plugin.resolveId('../../public/libs/maths-editor-extra/a.mjs',importer,{scan:true}),null);
});

test('real Vite scanner reproduces the old drive-root failure and serves optimized dependencies after the fix',async()=>{
 const root=path.resolve('.'),base=path.join(root,'.agywork');fs.mkdirSync(base,{recursive:true});
 const directory=fs.mkdtempSync(path.join(base,'public-library-scan-'));
 const importPath=path.relative(directory,path.join(root,'public/libs/maths-editor/document-model.mjs')).split(path.sep).join('/');
 fs.writeFileSync(path.join(directory,'entry.js'),`import {renderDocument} from ${JSON.stringify(importPath)}; import {tick} from 'svelte'; console.log(renderDocument,tick);`);
 try{
  for(const legacy of [true,false]){
   const errors=[],plugin=publicLibraryModulesPlugin(),resolve=plugin.resolveId;
   if(legacy)plugin.resolveId=(source,importer,options)=>resolve(source,importer,{...options,scan:false});
   const logger={info(){},warn(){},warnOnce(){},error(message){errors.push(String(message));},clearScreen(){},hasWarned:false,hasErrorLogged(){return false;}};
   const server=await createServer({configFile:false,root:directory,publicDir:path.join(root,'public'),cacheDir:path.join(directory,legacy?'old-cache':'fixed-cache'),plugins:[plugin],customLogger:logger,optimizeDeps:{entries:['entry.js'],holdUntilCrawlEnd:false},server:{host:'127.0.0.1',port:0,open:false}});
   try{
    await server.listen();
    await server.environments.client.depsOptimizer.scanProcessing;
    if(legacy){assert.match(errors.join('\n'),/ENOENT/);assert.match(errors.join('\n'),/libs[\\/]maths-editor/);}
    else{
     assert.deepEqual(errors,[]);
     const transformed=await server.transformRequest('/entry.js');
     assert.match(transformed.code,/\/libs\/maths-editor\/document-model.mjs/);
     const optimized=transformed.code.match(/"([^"\n]*\/deps\/svelte\.js[^"\n]*)"/);assert.ok(optimized,'Svelte is really optimized, not merely a mocked resolver');
     const origin=`http://127.0.0.1:${server.httpServer.address().port}`;
     const response=await fetch(origin+optimized[1]);assert.equal(response.status,200);assert.match(await response.text(),/tick/);
     const native=await fetch(origin+'/libs/maths-editor/document-model.mjs');assert.equal(native.status,200);assert.equal(await native.text(),fs.readFileSync(path.join(root,'public/libs/maths-editor/document-model.mjs'),'utf8'));
     assert.deepEqual(errors,[]);
    }
   }finally{await server.close();}
  }
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
