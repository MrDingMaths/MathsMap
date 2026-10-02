// Uses real question structure with isolated, in-memory Studio saves.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
const directory='.booklet-work/further-transformations-spacing-20261002';
let record=JSON.parse(fs.readFileSync(directory+'/candidate.json'));
const source=record.sections.find(s=>s.id==='further-transformations-mixed-review');
const block=source.blocks.find(b=>b.type==='question'&&b.content.label==null&&b.content.children?.length>1);
assert.ok(block);
record.id='spacing-browser-check';record.sections=[{...source,blocks:[block]}];
record.settings.generatedCover=false;record.settings.flowEdition='student';
const errors=[],writes=[];
const browser=await chromium.launch({headless:true,channel:'chrome'});
const context=await browser.newContext({viewport:{width:1700,height:1100}});
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
await page.route('**/__booklet/**',async route=>{
 const req=route.request(),url=new URL(req.url());
 if(url.pathname==='/__booklet/projects')return route.fulfill({json:[record]});
 if(url.pathname==='/__booklet/projects/'+record.id+'/open')return route.fulfill({json:{project:record,bankSync:{items:[]}}});
 if(url.pathname==='/__booklet/projects/'+record.id){
  if(req.method()==='PUT'){
   const body=req.postDataJSON();assert.equal(body.expectedRevision,record.revision);
   record=normalizeEditableProject({...body.project,revision:record.revision+1});writes.push(record.revision);
  }
  return route.fulfill({json:record});
 }
 if(req.method()==='GET'&&/files|assets/.test(url.pathname))return route.continue();
 return route.fulfill({json:url.pathname.endsWith('/manifest')?{questions:[]}:{items:[]}});
});
const ready=()=>page.waitForFunction(()=>document.querySelector('.project-print')?.dataset.paginationState==='ready',null,{timeout:120000});
const label=()=>page.locator(`.flow-paper [data-arrangement-block="${block.id}"] .label-item`).first();
const select=async()=>{
 await page.locator(`.flow-paper [data-edit-root="${block.content.id}"] .clickable`).first().click();
 await page.getByRole('button',{name:'Spacing',exact:true}).click();
};
const save=async action=>{
 const saved=page.waitForResponse(r=>r.request().method()==='PUT'&&r.url().endsWith('/'+record.id)&&r.status()===200);
 await action();await page.keyboard.press('Control+s');await saved;await ready();
 await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
};
try{
 await page.goto('http://127.0.0.1:5173/#/booklet?stage=projects&project='+record.id);await ready();
 const initial=await label().innerText();assert.match(initial,/1/);
 await select();
 for(const [name,value]of [['Whole question vertical gap (mm)','5'],['Whole question answer space height (mm)','8']]){
  await save(async()=>{const input=page.getByRole('spinbutton',{name,exact:true});await input.fill(value);await input.press('Tab');});
  assert.equal(await label().innerText(),initial);
 }
 // Undo/redo must preserve the label while replaying the layout mutation.
 await save(()=>page.getByRole('button',{name:'Undo',exact:true}).click());
 assert.equal(await label().innerText(),initial);
 await save(()=>page.getByRole('button',{name:'Redo',exact:true}).click());
 assert.equal(await label().innerText(),initial);
 await page.reload();await ready();assert.equal(await label().innerText(),initial);
 await page.screenshot({path:directory+'/spacing-reopened.png'});
 await page.getByRole('combobox',{name:'Booklet edition',exact:true}).selectOption('short');await ready();
 assert.equal(await page.locator('.flow-paper').getByText('No short answer supplied.',{exact:true}).count(),0);
 assert.deepEqual(errors,[]);
 fs.writeFileSync(directory+'/studio-check.json',JSON.stringify({blockId:block.id,number:initial,writes,checks:['vertical gap','answer space height','undo','redo','save/reopen','short-answer path'],errors},null,2));
 console.log('PASS Studio spacing, numbering, undo/redo and save/reopen');
}finally{await browser.close();}
