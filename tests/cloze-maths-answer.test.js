import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {chromium} from 'playwright-core';
import {renderDocument,normalizeDocument,DOCUMENT_FORMAT} from '../public/libs/maths-editor/document-model.mjs';
import {documentHtml} from '../src/lib/document-content.js';
import {renderRichTextHtml,clozeNode,paragraph} from '../src/lib/maths-editor.js';

const doc=answer=>normalizeDocument({format:DOCUMENT_FORMAT,blocks:[{id:'p',type:'paragraph',inlines:[{type:'cloze',answer,width:29,lines:1,expectedResponse:answer,reviewStatus:'reviewed'}]}]});

test('filled native clozes use the inline math callback only for complete dollar-delimited strings',()=>{
 const calls=[],math=(...args)=>{calls.push(args);return '<b>typeset</b>';};
 assert.match(renderDocument(doc('$x^{m+n}$'),{fillCloze:true,math}),/<b>typeset<\/b>/);
 assert.deepEqual(calls,[['x^{m+n}',false]]);
 for(const answer of ['add','x^(m+n)','$x$ and $y$','$$x$$','<img src=x onerror="attack()">']){
  const html=renderDocument(doc(answer),{fillCloze:true,math});
  assert.doesNotMatch(html,/<b>typeset|<img /);
 }
 assert.equal(calls.length,1);
 const hidden=renderDocument(doc('$x^{m+n}$'),{fillCloze:false,math});
 assert.doesNotMatch(hidden,/<b>typeset/);assert.equal(calls.length,1);
 assert.match(hidden,/data-cloze="\$x\^\{m\+n\}\$"/);
});

test('native and legacy clozes render maths safely and keep plain answers unchanged',()=>{
 for(const answer of ['$x^{m+n}$','same','<img src=x onerror="attack()">','$\\href{javascript:attack()}{x}$']){
  const original=doc(answer),snapshot=JSON.stringify(original);
  const native=documentHtml(original,{fillCloze:true});
  const legacy=renderRichTextHtml({paragraphs:[paragraph([clozeNode(answer,29)])]},{fillCloze:true});
  for(const html of [native,legacy]){
   assert.doesNotMatch(html,/<img |href="javascript:/);
   if(answer==='$x^{m+n}$')assert.match(html,/class="katex"/);
   if(answer==='same')assert.match(html,/>same/);
   if(answer.startsWith('<'))assert.match(html,/&lt;img/);
  }
  assert.equal(JSON.stringify(original),snapshot);
 }
});

test('filled native maths retains cloze metadata through the actual editor reader and JSON reopen',async()=>{
 const bundle=await build({stdin:{contents:"export {DocumentEditor} from './public/libs/maths-editor/document-editor.js';",resolveDir:process.cwd()},bundle:true,format:'iife',globalName:'ClozeProbe',write:false});
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage();await page.addScriptTag({content:bundle.outputFiles[0].text});
  for(const fillCloze of [false,true]){
   const original=doc('$x^{m+n}$');
   await page.setContent('<div id="editor">'+documentHtml(original,{fillCloze})+'</div>');
   const reopened=await page.evaluate(original=>JSON.parse(JSON.stringify(ClozeProbe.DocumentEditor.prototype.read.call({doc:original},document.querySelector('#editor')))),original);
   assert.deepEqual(reopened.blocks[0].inlines,original.blocks[0].inlines);
  }
 }finally{await browser.close();}
});
