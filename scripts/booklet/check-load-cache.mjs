// Real-browser cache persistence and invalidation, isolated from saved booklets.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createEditableProject} from '../../src/lib/editable-booklet-model.js';
import {applyCreationPreset} from '../../src/lib/booklet-creation.js';
import {studioProject} from '../../src/lib/booklet-review-model.js';
const base=process.argv[2]??'http://127.0.0.1:5173';
let project=studioProject(applyCreationPreset(createEditableProject({id:'cache-check',title:'Cache check',sections:[{id:'content',title:'Content',phase:'teaching',blocks:[{id:'text',type:'rich-text',content:'Cache persistence test. The page remains editable.'}]}]})));
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
try{
 const context=await browser.newContext(),page=await context.newPage(),writes=[],errors=[],bank=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/__booklet/**',route=>{const req=route.request(),url=new URL(req.url());if(req.method()!=='GET'){writes.push(url.pathname);return route.abort();}if(url.pathname==='/__booklet/projects')return route.fulfill({json:[{id:project.id,title:project.title}]});if(url.pathname.endsWith('/open'))return route.fulfill({json:{project,bankSync:{items:[]},bankSyncError:''}});if(url.pathname.includes('/bank/')){bank.push(url.pathname);return route.fulfill({json:{questions:[]}});}if(url.pathname.endsWith('/bank-sync'))return route.fulfill({json:{items:[]}});return route.continue();});
 const ready=()=>page.waitForFunction(()=>document.querySelector('.flow-document')?.dataset.paginationState==='ready',null,{timeout:60000});
 const metrics=()=>page.locator('.flow-document').evaluate(el=>JSON.parse(el.dataset.paginationMetrics));
 await page.goto(base+'/#/booklet?stage=projects&project='+project.id);await ready();const first=await metrics();assert.ok(first.measurements>0);
 await page.reload();await ready();const second=await metrics();assert.equal(second.measurements,0);assert.ok(second.persistentHits>0);assert.deepEqual(bank,[]);
 project.sections[0].blocks[0].content='Changed content invalidates dimensions.';
 await page.reload();await ready();assert.ok((await metrics()).measurements>0);
 const storage=await page.evaluate(async()=>{const {createMeasurementStore}=await import('/src/lib/booklet-cache-store.js');let store=createMeasurementStore();await store.set('corrupt',{height:2,capacity:100});const db=await new Promise(resolve=>{const req=indexedDB.open('mathsmap-booklet-measurements');req.onsuccess=()=>resolve(req.result);});await new Promise(resolve=>{const tx=db.transaction('dimensions','readwrite');tx.objectStore('dimensions').put({key:'corrupt',height:'broken',capacity:100,ts:0});tx.oncomplete=resolve;});store=createMeasurementStore();return await store.get('corrupt');});assert.equal(storage,null);
 const bankResponse=page.waitForResponse(r=>r.url().includes('/bank/manifest'));await page.getByRole('button',{name:'Question bank',exact:true}).click();await bankResponse;assert.equal(bank.length,1);
 assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,first,second,bankRequests:bank.length}));
}finally{await browser.close();}
