import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:2300,height:1300}}), errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.route('**/__booklet/bank/manifest',r=>r.fulfill({json:{format:'mathsmap-practice-bank-v3',version:3,questions:[]}}));
 await page.route('**/__booklet/**',r=>r.request().method()==='GET'?r.fallback():r.abort());

 const url='http://127.0.0.1:5173/__booklet/full-imports/linear-relationships-studio-v1';
 const raw=await (await page.request.get(url)).json();assert.ok(raw.draftPreview);assert.ok(raw.baseHash);let saved;
 await page.route('**/review/content',async route=>{saved=route.request().postDataJSON();await route.fulfill({json:raw});});
 await page.goto('http://127.0.0.1:5173/#/booklet?stage=full-import&run=linear-relationships-studio-v1&page=2',{waitUntil:'networkidle'});
 await page.getByLabel('Edit preview',{exact:true}).check();
 assert.equal(await page.getByRole('button',{name:'Edit content and layout',exact:true}).count(),0);
 await page.locator('[data-edit-root="page-2-syllabus-text"] .clickable').first().click();
 await page.locator('.editor-surface').waitFor();await page.keyboard.type('Test edit ');await page.getByRole('button',{name:'Save',exact:true}).click();
 await page.waitForFunction(()=>!document.querySelector('.maths-editor'));assert.equal(saved.expectedRevision,raw.revision);assert.equal(saved.expectedBaseHash,raw.baseHash);assert.equal(saved.value.format,'maths-editor-document-v1');
 await page.goto('http://127.0.0.1:5173');
 const metrics=await page.evaluate(async()=>{
  const {normalizeDocument,renderDocument}=await import('/public/libs/maths-editor/document-model.mjs');
  const {mountTableAnnotations}=await import('/public/libs/maths-editor/table-annotations.mjs');
  const p=(id,text)=>({id,type:'paragraph',inlines:[{type:'text',text,marks:[]}]});
  const doc=normalizeDocument({blocks:[{id:'t',type:'table',widthMm:75,rowHeights:[10,10],annotations:[{id:'a',type:'arrow',cellId:'c',toCellId:'d',label:'+4',colour:'#268cff'},{id:'b',type:'circle',cellId:'d',colour:'#ef6068'}],rows:[[{id:'a',type:'cell',blocks:[p('pa','x')]},{id:'b',type:'cell',blocks:[p('pb','y')]}],[{id:'c',type:'cell',blocks:[p('pc','8')]},{id:'d',type:'cell',blocks:[p('pd','12')]}]]}]});
  const host=document.createElement('div');host.innerHTML=renderDocument(doc);document.body.replaceChildren(host);const action=mountTableAnnotations(host);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  const before=host.querySelector('ellipse').getAttribute('cx');host.querySelector('[data-table-wrap]').style.width='120mm';await new Promise(r=>setTimeout(r,100));const after=host.querySelector('ellipse').getAttribute('cx');action.destroy();return{before,after,paths:host.querySelectorAll('[data-table-annotations] path').length};
 });assert.notEqual(metrics.before,metrics.after);assert.equal(metrics.paths,2);assert.deepEqual(errors,[]);console.log(JSON.stringify({draftEdit:true,annotationResize:true,errors}));
}finally{await browser.close();}
