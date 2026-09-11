// Exercise real keyboard defaults inside nested arrangements; all saves stay in memory.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createEditableProject} from '../../src/lib/editable-booklet-model.js';
import {fromSource,toSource} from '../../public/libs/maths-editor/document-model.mjs';

const started=new Date(),out='.booklet-work/text-space-check';
fs.mkdirSync(out,{recursive:true});
let record=createEditableProject({id:'text-spacing-check',title:'Text spacing check',settings:{paginationMode:'flexible',generatedCover:false},sections:[{id:'section',title:'Editing',blocks:[{id:'question',type:'question',content:{id:'root',prompt:fromSource('First sentence.'),children:[{id:'part',label:'a',prompt:fromSource('Second sentence.'),answerSpaceMm:10,answer:{short:'Done'}}]}}]}]});
record.revision=1;
const errors=[],checks=[];let writes=0,browser;
try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const page=await browser.newPage({viewport:{width:1600,height:1100}});
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/__booklet/**',async route=>{
 const req=route.request(),url=new URL(req.url());
 if(url.pathname==='/__booklet/projects')return route.fulfill({json:[{id:record.id,title:record.title,revision:record.revision}]});
 if(url.pathname===`/__booklet/projects/${record.id}`){
  if(req.method()==='PUT'){const body=req.postDataJSON();assert.equal(body.expectedRevision,record.revision);record={...body.project,revision:record.revision+1};writes++;}
  return route.fulfill({json:record});
 }
 return route.fulfill({json:url.pathname.includes('bank-sync')?{items:[]}:[]});
});
const field=id=>page.locator(`.flow-paper [data-edit-root="${id}"][data-edit-path="/prompt"]`);
const value=id=>id==='root'?record.sections[0].blocks[0].content.prompt:record.sections[0].blocks[0].content.children[0].prompt;
const saved=()=>page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
try{
 await page.goto((process.env.BOOKLET_TEST_BASE??'http://127.0.0.1:5174')+'/#/booklet?stage=projects&project=text-spacing-check',{waitUntil:'networkidle'});
 for(const id of ['root','part']){
  await field(id).locator('.clickable').first().click();
  const surface=field(id).locator('.me-content');await surface.waitFor();
  assert.ok(await surface.evaluate(el=>el.closest('[data-arrangement-id]')),'Fixture must edit inside an arrangement');
  await page.keyboard.press('Control+End');
  await page.keyboard.press('Space');
  assert.match((await surface.textContent()).replaceAll('\u00a0',' '),/\. $/,'Space must be inserted immediately');
  await page.keyboard.type('Added words');
  await page.keyboard.press('Enter');await page.keyboard.type('New paragraph');await saved();
  assert.match(toSource(value(id)).replaceAll('\u00a0',' '),/\. Added words\n\nNew paragraph$/);
  checks.push(id+': space, multiple words, Enter, autosave');
 }
 await page.reload({waitUntil:'networkidle'});
 for(const id of ['root','part']){
  await field(id).locator('.clickable').first().waitFor();
  assert.match((await field(id).first().textContent()).replaceAll('\u00a0',' '),/\. Added words/);
  await field(id).locator('.clickable').first().click();await field(id).locator('.me-content').waitFor();
  assert.match((await field(id).locator('.me-content').textContent()).replaceAll('\u00a0',' '),/\. Added words/);
 }
 checks.push('preview and reopened editors retain spaces');
 // The focused layout itself still supports keyboard selection.
 for(const key of ['Space','Enter']){
  const group=page.locator('.flow-paper [data-arrangement-id]').first();
  await group.focus();await page.keyboard.press(key);
  assert.ok(await page.locator('[data-document-group="question"] .group-handle').getAttribute('aria-pressed')==='true'||await page.locator('[data-document-group="question"]').evaluate(el=>el.classList.contains('selected')),'Layout keyboard selection stays available');
 }
 checks.push('layout keyboard selection');
 assert.deepEqual(errors,[]);
 await page.screenshot({path:out+'/workspace.png'});
 console.log(JSON.stringify({checks,writes}));
}finally{
 fs.writeFileSync(out+'/report.json',JSON.stringify({started,ended:new Date(),elapsedMs:Date.now()-started.getTime(),checks,writes,errors},null,2));
 await browser.close();
}
