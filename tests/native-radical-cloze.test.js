import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import {build} from 'esbuild';
import {chromium} from 'playwright-core';
import {normalizeDocument,renderDocument} from '../public/libs/maths-editor/document-model.mjs';
const math=latex=>katex.renderToString(latex,{throwOnError:true});
const radical={type:'cloze',enclosure:'sqrt',answer:'$(5-(-2))^2+(4-3)^2$',width:55,radicand:[{type:'math',latex:'('},{type:'cloze',answer:'$5-(-2)$',width:22},{type:'math',latex:')^2+('},{type:'cloze',answer:'$4-3$',width:13},{type:'math',latex:')^2'}]};
const document=()=>normalizeDocument({blocks:[{id:'p',type:'paragraph',inlines:[radical]}]});
test('composite radicals retain distinct native responses and one continuous root',()=>{
 const doc=document(),html=renderDocument(doc,{math});
 assert.deepEqual(doc.blocks[0].inlines[0].radicand.map(n=>n.type),['math','cloze','math','cloze','math']);
 assert.equal((html.match(/data-cloze-leader/g)??[]).length,2);
 assert.equal((html.match(/data-radicand-content/g)??[]).length,1);
 assert.equal((html.match(/<msqrt>/g)??[]).length,1);
 assert.match(html,/width:22mm/);assert.match(html,/width:13mm/);
 const filled=renderDocument(doc,{math,fillCloze:true});
 assert.doesNotMatch(filled,/data-cloze-leader|data-radicand-content/);
 assert.match(filled,/<msqrt>/);
});
test('single-response radicals keep their previous representation and reject active nested content',()=>{
 const doc=normalizeDocument({blocks:[{id:'p',type:'paragraph',inlines:[{type:'cloze',enclosure:'sqrt',answer:'$50$',width:12}]}]});
 assert.ok(!('radicand' in doc.blocks[0].inlines[0]));
 assert.equal((renderDocument(doc,{math}).match(/data-cloze-leader/g)??[]).length,1);
 const value=document();value.blocks[0].inlines[0].radicand.push({type:'inline-image',src:'javascript:bad()'});
 assert.doesNotMatch(renderDocument(value,{math}),/javascript:bad/);
});
test('raised responses and composite radicals survive editor capture and JSON reopen',async()=>{
 const bundle=await build({stdin:{contents:"export {DocumentEditor} from './public/libs/maths-editor/document-editor.js';",resolveDir:process.cwd()},bundle:true,format:'iife',globalName:'RadicalProbe',write:false});
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage();await page.addScriptTag({content:bundle.outputFiles[0].text});
  const original=document();original.blocks.push({id:'power',type:'paragraph',inlines:[{type:'math',latex:'A=1000(1.1)'},{type:'cloze',answer:'$6$',width:9,position:'superscript'}]});
  const canonical=normalizeDocument(original);for(const block of canonical.blocks)for(const inline of block.inlines)if(inline.type==='cloze'){inline.lines=1;inline.expectedResponse=inline.answer;}
  for(const editable of [false,true]){
   await page.setContent('<div id="editor">'+renderDocument(canonical,{math,editable})+'</div>');
   const reopened=await page.evaluate(original=>JSON.parse(JSON.stringify(RadicalProbe.DocumentEditor.prototype.read.call({doc:original},document.querySelector('#editor')))),canonical);
   assert.deepEqual(normalizeDocument(reopened),canonical);
   const geometry=await page.evaluate(()=>{const exp=document.querySelector('[data-cloze-position]'),base=exp.parentElement.querySelector('[data-math]'),body=document.querySelector('[data-radicand-content]'),root=body.parentElement;return {exp:exp.getBoundingClientRect().bottom,base:base.getBoundingClientRect().bottom,inside:body.getBoundingClientRect().right<=root.getBoundingClientRect().right+.1};});
   assert.ok(geometry.exp<geometry.base,'Exponent response stays raised');assert.ok(geometry.inside,'Radicand remains under the same root');
  }
 }finally{await browser.close();}
});
