// Isolated file-backed save/reopen of actual repaired Chapter 1 content.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import {chromium} from 'playwright-core';
import {saveBookletProject} from './project-studio-server.mjs';
import {normalizeEditableProject} from '../../src/lib/editable-booklet-model.js';
const out='.booklet-work/concept-grouping/editor';
await fs.mkdir(out,{recursive:true});
const candidate=JSON.parse(await fs.readFile('.booklet-work/concept-grouping/candidate.json','utf8'));
let record=normalizeEditableProject({...candidate,id:'shared-stem-editor-check',source:null,revision:1,settings:{...candidate.settings,generatedCover:false,flowEdition:'student',layoutOverrides:{}},sections:[{...candidate.sections[0],blocks:[candidate.sections[0].blocks[0]]}]});
const block=record.sections[0].blocks[0];delete block.bankRef;delete block.canonicalId;block.snapshotKind='local';
const projectRoot=path.resolve(out,'projects'),bankRoot=path.resolve(out,'bank');
await fs.mkdir(projectRoot,{recursive:true});await fs.mkdir(bankRoot,{recursive:true});
const file=path.join(projectRoot,record.id+'.json');await fs.writeFile(file,JSON.stringify(record));
let writes=0;const errors=[];
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const page=await browser.newPage({viewport:{width:1600,height:1000}});page.on('pageerror',e=>errors.push(e.message));
await page.route('**/__booklet/**',async route=>{
 const req=route.request(),url=new URL(req.url());
 if(url.pathname==='/__booklet/projects')return route.fulfill({json:[record]});
 if(url.pathname===`/__booklet/projects/${record.id}/open`){record=JSON.parse(await fs.readFile(file,'utf8'));return route.fulfill({json:{project:record,bankSync:{items:[]}}});}
 if(url.pathname===`/__booklet/projects/${record.id}`){if(req.method()==='PUT'){const body=req.postDataJSON();record=await saveBookletProject(body.project,{projectRoot,bankRoot,expectedRevision:body.expectedRevision});writes++;}return route.fulfill({json:record});}
 if(url.pathname.endsWith('/bank-sync'))return route.fulfill({json:{items:[]}});
 if(url.pathname.endsWith('/bank/manifest'))return route.fulfill({json:{questions:[]}});
 return req.method()==='GET'?route.fallback():route.abort();
});
const ready=()=>page.waitForFunction(()=>document.querySelector('.flow-document')?.dataset.paginationState==='ready',null,{timeout:120000});
const saved=()=>page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
try{
 await page.goto('http://127.0.0.1:5173/#/booklet?stage=projects&project='+record.id);await ready();
 if(await page.getByRole('button',{name:'Toggle page navigation'}).getAttribute('aria-expanded')!=='true')await page.getByRole('button',{name:'Toggle page navigation'}).click();
 await page.locator(`.flow-outline [data-block-id="${block.id}"] .content-select`).click();
 await page.locator('.menu > summary').filter({hasText:'File'}).click();
 await page.getByRole('button',{name:'Specialist block properties',exact:true}).click();
 const columns=page.getByLabel('Columns',{exact:true});await columns.fill('3');await columns.press('Tab');
 await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');await ready();
 assert.equal(record.sections[0].blocks[0].content.columns,3);
 await page.reload();await ready();
 assert.equal(record.sections[0].blocks[0].content.columns,3);
 assert.deepEqual(record.sections[0].blocks[0].content.children.map(n=>n.id),block.content.children.map(n=>n.id));
 if(await page.getByRole('button',{name:'Toggle page navigation'}).getAttribute('aria-expanded')!=='true')await page.getByRole('button',{name:'Toggle page navigation'}).click();
 await page.locator(`.flow-outline [data-block-id="${block.id}"] .content-select`).click();
 await page.locator('.document-toolbar').getByRole('button',{name:'Spacing',exact:true}).click();
 const height=page.getByLabel('Whole question answer space height (mm)',{exact:true});await height.fill('11');await height.press('Tab');await saved();await ready();
 await page.reload();await ready();
 assert.ok(writes>=2);assert.deepEqual(errors,[]);
 assert.deepEqual(Object.values(record.settings.layoutOverrides.answerSpaces),block.content.children.map(()=>11),'Manual overrides survive reopening');
 await page.screenshot({path:out+'/reopened.png'});
 await fs.writeFile(out+'/report.json',JSON.stringify({checks:['Grid columns edited from 2 to 3','File-backed revision-safe save','Reload preserves all part IDs and grid layout','Manual working space save/reopen'],writes,errors,projectRevision:record.revision},null,2));
 console.log(JSON.stringify({ok:true,writes,revision:record.revision}));
}finally{await browser.close();}
