// Exercise real accepted content using in-memory copies and intercepted writes.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {validateEditableProject} from '../../src/lib/editable-booklet-model.js';
import {fieldValue} from '../../src/lib/booklet-document-controller.js';
const base=process.env.BOOKLET_TEST_BASE??'http://127.0.0.1:5174',out='.booklet-work/document-project-check';fs.mkdirSync(out,{recursive:true});
const files=['linear-relationships-v1','index-laws-complete-v1'];
const originals=files.map(id=>JSON.parse(fs.readFileSync(`booklets/projects/${id}.json`,'utf8')));
const records=new Map(originals.map(p=>{const copy=structuredClone(p);copy.id='document-check-'+p.id;return [copy.id,copy];}));
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const report=[],errors=[];
try{for(const [id,initial] of [...records]){
 const page=await browser.newPage({viewport:{width:1700,height:1100}});page.setDefaultTimeout(60000);page.on('pageerror',e=>{errors.push(e.stack);console.log(e.stack);});
 await page.route('**/__booklet/**',async route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.pathname==='/__booklet/projects')return route.fulfill({json:[...records.values()].map(p=>({id:p.id,title:p.title,revision:p.revision}))});
   if(url.pathname===`/__booklet/projects/${id}`){if(req.method()==='PUT'){const body=req.postDataJSON();assert.equal(body.expectedRevision,records.get(id).revision);const valid=validateEditableProject(body.project);assert.equal(valid.valid,true,valid.errors.join('; '));records.set(id,{...body.project,revision:body.expectedRevision+1});}return route.fulfill({json:records.get(id)});}
   if(url.pathname.includes('bank-sync'))return route.fulfill({json:{items:[]}});
   if(url.pathname.endsWith('/manifest'))return route.fulfill({json:{questions:[]}});
   if(req.method()==='GET'&&(url.pathname.includes('/files/')||url.pathname.includes('/assets/')||url.pathname.includes('project-assets')))return route.continue();
   return route.fulfill({json:[]});
 });
 console.log('Opening isolated copy:',id);
 await page.goto(base+'/#/booklet?stage=projects&project='+id,{waitUntil:'domcontentloaded'});
 const ready=()=>page.locator('.flow-document[data-pagination-state="ready"]').waitFor({timeout:240000});
 await ready();console.log('Initial pagination ready:',id);
 // Work on the first visible actual content field, including saved arrangements.
 const field=page.locator('.flow-paper [data-edit-path="/prompt"] .clickable,.flow-paper [data-edit-path="/content"] .clickable').first();
 await field.scrollIntoViewIfNeeded();const owner=field.locator('xpath=..');const anchor={rootId:await owner.getAttribute('data-edit-root'),pointer:await owner.getAttribute('data-edit-path')};
 const originalValue=structuredClone(fieldValue(records.get(id),anchor)),beforeCount=initial.sections.flatMap(s=>s.blocks).length;
 await field.click();await page.locator('maths-editor .me-content').waitFor();await page.keyboard.press('End');await page.keyboard.type(' Editor verification.');
 await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');await ready();
 assert.notDeepEqual(fieldValue(records.get(id),anchor),originalValue);assert.equal(records.get(id).sections.flatMap(s=>s.blocks).length,beforeCount);
 assert.equal(await page.locator('dialog[open]').count(),0);
 assert.equal(await page.locator('.flow-paper').getByText('Content reference needs review:',{exact:false}).count(),0);
 await page.getByRole('button',{name:'Undo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');await ready();
 assert.deepEqual(fieldValue(records.get(id),anchor),originalValue);
 // Panels never change the physical paper width.
 const width=await page.locator('.flow-paper').evaluate(e=>e.getBoundingClientRect().width);
 await page.locator('.document-toolbar').getByRole('button',{name:/^Comments/}).click();assert.equal(await page.locator('.flow-paper').evaluate(e=>e.getBoundingClientRect().width),width);await page.getByRole('button',{name:'Close panel',exact:true}).click();
 await page.getByRole('button',{name:'More options',exact:true}).click();await page.getByRole('button',{name:'Close panel',exact:true}).click();
 const editions=[];
 for(const edition of ['student','short','worked']){
   await page.getByLabel('Booklet edition',{exact:true}).selectOption(edition);await page.locator(`.flow-document[data-pagination-state="ready"][data-paginated-edition="${edition}"]`).waitFor({timeout:240000});
   const count=await page.locator('.flow-page-group').count();assert.ok(count>0,`${edition} must contain pages`);editions.push({edition,pages:count});
   await page.locator('.project-canvas').evaluate(e=>e.scrollTop=0);await page.screenshot({path:`${out}/${id}-${edition}.png`});
 }
 assert.deepEqual(initial.sections.flatMap(s=>s.blocks).map(b=>[b.id,b.bankRef]),records.get(id).sections.flatMap(s=>s.blocks).map(b=>[b.id,b.bankRef]));
 await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));await page.emulateMedia({media:'print'});
 assert.equal(await page.locator('.document-toolbar').isVisible(),false);assert.equal(await page.locator('.project-inspector').isVisible(),false);
 await page.pdf({path:`${out}/${id}-worked.pdf`,format:'A4',printBackground:true});
 report.push({id,anchor,editions,contentRestored:true,bankPinsUnchanged:true});await page.close();console.log('Verified:',id);
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/report.json',JSON.stringify({passed:true,report,errors},null,2));console.log(JSON.stringify({passed:true,report}));
}catch(error){for(const context of browser.contexts())for(const page of context.pages()){console.log((await page.locator('body').innerText()).slice(-5000));await page.screenshot({path:out+'/failure.png'});}throw error;}finally{await browser.close();}
