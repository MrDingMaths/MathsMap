// Small real-editor regression; source projects and bank writes are never used.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createEditableProject} from '../../src/lib/editable-booklet-model.js';
import {fromSource,toSource} from '../../public/libs/maths-editor/document-model.mjs';
import {questionSpacing} from '../../src/lib/booklet-document-tools.js';
const out='.booklet-work/spacing-performance/editor';fs.mkdirSync(out,{recursive:true});
let record=createEditableProject({id:'spacing-editor-check',title:'Spacing editor',settings:{paginationMode:'flexible',generatedCover:false},topics:[{id:'t',title:'Topic'}],sections:[{id:'s',topicId:'t',phase:'practice',blocks:[{id:'q',type:'question',content:{id:'root',prompt:fromSource('Calculate each result.'),children:['a','b','c'].map(id=>({id,label:id,prompt:fromSource('$1+1$'),answerSpaceMm:10,answer:{short:'2'}}))}}]}]});record.revision=1;
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const page=await browser.newPage({viewport:{width:1700,height:1100}}),errors=[],checks=[];let writes=0;
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/__booklet/**',route=>{
 const req=route.request(),url=new URL(req.url());
 if(url.pathname==='/__booklet/projects')return route.fulfill({json:[record]});
 if(url.pathname===`/__booklet/projects/${record.id}/open`)return route.fulfill({json:{project:record,bankSync:{items:[]}}});
 if(url.pathname===`/__booklet/projects/${record.id}`){if(req.method()==='PUT'){const body=req.postDataJSON();assert.equal(body.expectedRevision,record.revision);record={...body.project,revision:record.revision+1};writes++;}return route.fulfill({json:record});}
 if(url.pathname.endsWith('/bank-sync'))return route.fulfill({json:{items:[]}});
 if(url.pathname.endsWith('/bank/manifest'))return route.fulfill({json:{questions:[]}});
 return req.method()==='GET'?route.fallback():route.abort();
});
const root=()=>page.locator('.flow-document'),field=()=>page.locator('.flow-paper [data-edit-root="root"][data-edit-path="/prompt"]').first();
const ready=()=>page.waitForFunction(()=>{const r=document.querySelector('.flow-document');return r?.dataset.paginationState==='ready'&&r.dataset.paginationRuns;});
const saved=()=>page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
const update=async action=>{const before=await root().getAttribute('data-pagination-runs');await action();await page.waitForFunction(before=>{const r=document.querySelector('.flow-document');return r.dataset.paginationState==='ready'&&r.dataset.paginationRuns!==before;},before);};
try{
 await page.goto((process.env.BOOKLET_TEST_BASE??'http://127.0.0.1:5173')+'/#/booklet?stage=projects&project='+record.id);await ready();
 await field().locator('.clickable').click();await field().locator('maths-editor .me-content').waitFor();
 await field().locator('maths-editor').evaluate(el=>window.__spacingEditor=el);
 await field().locator('.me-content').evaluate(el=>{el.focus();const range=document.createRange();range.selectNodeContents(el.querySelector('p'));range.collapse(false);getSelection().removeAllRanges();getSelection().addRange(range);});
 await update(()=>page.keyboard.type(' More.'));await saved();
 assert.match(toSource(record.sections[0].blocks[0].content.prompt),/More/);
 assert.ok(JSON.parse(await root().getAttribute('data-pagination-metrics')).scheduleMs>=200,'Typing keeps its debounce');checks.push('typing-debounce');
 await page.getByRole('button',{name:'Spacing',exact:true}).click();
 const height=page.getByLabel('Whole question answer space height (mm)',{exact:true});
 await update(async()=>{await height.fill('12');await height.press('Tab');});await saved();
 assert.ok(JSON.parse(await root().getAttribute('data-pagination-metrics')).scheduleMs<100,'Spacing bypasses typing debounce');
 assert.equal(await page.evaluate(()=>window.__spacingEditor.isConnected),true);assert.equal(await page.locator('.flow-paper maths-editor').count(),1);checks.push('spacing-retains-editor');
 const beforeComposition=await root().getAttribute('data-pagination-runs');
 await page.evaluate(()=>window.__spacingEditor.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true})));
 await height.evaluate(el=>{el.value='16';el.dispatchEvent(new Event('change',{bubbles:true}));});await page.waitForTimeout(350);
 assert.equal(await root().getAttribute('data-pagination-runs'),beforeComposition);
 await update(()=>page.evaluate(()=>window.__spacingEditor.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true}))));await saved();checks.push('composition-guard');
 await update(()=>height.evaluate(async el=>{for(const value of ['40','75','20']){el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,20));}}));await saved();
 assert.equal(questionSpacing(record,record.sections[0].blocks[0]).height,20);
 const work=JSON.parse(await root().getAttribute('data-pagination-work'));assert.ok(work.some(r=>r.cancelled));checks.push('superseded-work');
 await page.route('**/__booklet/render-cache/version?*',route=>route.fulfill({status:503,json:{}}));
 await update(async()=>{await height.fill('24');await height.press('Tab');});await saved();
 assert.ok(JSON.parse(await root().getAttribute('data-pagination-metrics')).measurements>0);checks.push('failed-validation-remeasures');
 await page.emulateMedia({media:'print'});
 await height.evaluate(el=>{el.value='25';el.dispatchEvent(new Event('change',{bubbles:true}));});
 await page.waitForFunction(()=>document.querySelector('.flow-document')?.dataset.paginationState==='error');
 await page.emulateMedia({media:'screen'});
 await update(()=>page.getByRole('button',{name:'Retry layout',exact:true}).click());await saved();checks.push('hidden-measurement-rejected-and-retried');
 const expected=record.sections[0].blocks[0].content.prompt;await page.reload();await ready();assert.equal(record.sections[0].blocks[0].content.prompt,expected);checks.push('save-reopen');
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/report.json',JSON.stringify({checks,writes,errors,work},null,2));console.log(JSON.stringify({checks,writes,errors}));
}catch(e){await page.screenshot({path:out+'/failure.png'});fs.writeFileSync(out+'/failure.json',JSON.stringify({error:e.stack,checks,errors,body:(await page.locator('body').innerText()).slice(-3000)},null,2));throw e;}finally{await browser.close();}
