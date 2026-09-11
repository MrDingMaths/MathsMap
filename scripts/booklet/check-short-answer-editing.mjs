// Real short-answer editing and save/reopen, with all project writes intercepted.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createEditableProject} from '../../src/lib/editable-booklet-model.js';
const out='.booklet-work/diagram-typography';fs.mkdirSync(out,{recursive:true});
const blue=String.raw`Length $\color{#056FDB}\frac{x^2}{2}$ metres.`,errors=[];
let record=createEditableProject({id:'short-ink-editor-check',title:'Short answer ink',settings:{paginationMode:'flexible',generatedCover:false},topics:[{id:'topic',title:'Lengths'}],sections:[{id:'section',topicId:'topic',phase:'practice',title:'Lengths',blocks:[{id:'holder',type:'question',content:{id:'question',type:'question',prompt:'Find the length.',children:[],answer:{short:blue,worked:blue}}}]}]});record.revision=1;
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1700,height:1100}});
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/__booklet/**',async route=>{
 const req=route.request(),url=new URL(req.url());
 if(url.pathname==='/__booklet/projects')return route.fulfill({json:[record]});
 if(url.pathname===`/__booklet/projects/${record.id}`){if(req.method()==='PUT'){const body=req.postDataJSON();assert.equal(body.expectedRevision,record.revision);record={...body.project,revision:record.revision+1};}return route.fulfill({json:record});}
 return route.fulfill({json:url.pathname.endsWith('/manifest')?{questions:[]}:{items:[]}});
});
const ready=()=>page.locator('.flow-document[data-pagination-state="ready"]').waitFor({timeout:120000});
const inspect=()=>page.locator('.flow-paper').evaluate(async root=>{const {inspectShortAnswerColours}=await import('/src/lib/short-answer-style.js');return inspectShortAnswerColours(root);});
try{
 await page.goto((process.env.BOOKLET_TEST_BASE??'http://127.0.0.1:5173')+'/#/booklet?stage=projects&project='+record.id,{waitUntil:'networkidle'});await ready();
 await page.getByLabel('Booklet edition',{exact:true}).selectOption('short');await ready();
 const before=await inspect();assert.ok(before.runs.length);assert.deepEqual(before.issues,[]);
 await page.locator('.flow-paper [data-edit-path="/answer/short"] .katex').first().click();
 await page.waitForFunction(()=>document.activeElement?.matches('math-field'));
 const ink=await page.locator('maths-editor .me-content').evaluate(root=>({prose:getComputedStyle(root).color,math:getComputedStyle(root.querySelector('math-field')).color}));
 assert.deepEqual(ink,{prose:'rgb(36, 40, 45)',math:'rgb(36, 40, 45)'});
 await page.evaluate(()=>document.activeElement.position=-1);await page.keyboard.type('+z');
 await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
 assert.ok(JSON.stringify(record.sections[0].blocks[0].content.answer.short).includes('z'));assert.ok(!JSON.stringify(record.sections[0].blocks[0].content.answer.short).includes('#056FDB'));
 assert.equal(record.sections[0].blocks[0].content.answer.worked,blue);
 await page.reload({waitUntil:'networkidle'});await ready();
 await page.getByLabel('Booklet edition',{exact:true}).selectOption('short');await ready();
 const reopened=await inspect();assert.ok(reopened.runs.length);assert.deepEqual(reopened.issues,[]);assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/short-answer-editor-qa.json',JSON.stringify({passed:true,ink,saveReopen:true,workedPreserved:true,ordinaryRuns:reopened.runs.length},null,2));
 console.log('Short-answer prose/maths editing, save/reopen and colour passed');
}finally{await browser.close();}
