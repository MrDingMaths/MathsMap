// Isolated browser regression: never writes to an actual project or bank.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const arg=(name,fallback)=>process.argv.includes(name)?process.argv[process.argv.indexOf(name)+1]:fallback;
const out=arg('--out','.booklet-work/arrangement-controls');fs.mkdirSync(out,{recursive:true});
const projectFile=arg('--project','booklets/projects/non-right-angled-trigonometry-v1.json');
let record=JSON.parse(fs.readFileSync(projectFile));
const ids=arg('--blocks','nr-p36-q7,nr-p52-q8,nr-p52-q9').split(',');
record.id='arrangement-controls-check';record.settings.generatedCover=false;record.settings.flowEdition='student';
record.sections=record.sections.map(s=>({...s,blocks:s.blocks.filter(b=>ids.includes(b.id)).map(b=>({...b,flow:{...b.flow,sourcePageBreakBefore:false}}))})).filter(s=>s.blocks.length);
const before=structuredClone(record),writes=[];
const browser=await chromium.launch({headless:true,channel:'chrome'});
const cache='.booklet-work/standard-palette/browser-state.json';
const context=await browser.newContext({viewport:{width:1800,height:1250},...(fs.existsSync(cache)?{storageState:cache}:{})});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/__booklet/**',async route=>{
 const req=route.request(),url=new URL(req.url());
 if(url.pathname==='/__booklet/projects')return route.fulfill({json:[record]});
 if(url.pathname==='/__booklet/projects/'+record.id){if(req.method()==='PUT'){const body=req.postDataJSON();assert.equal(body.expectedRevision,record.revision);record={...body.project,revision:record.revision+1};writes.push(record.revision);}return route.fulfill({json:record});}
 if(req.method()==='GET'&&/files|assets/.test(url.pathname))return route.continue();
 return route.fulfill({json:url.pathname.endsWith('/manifest')?{questions:[]}:{items:[]}});
});
const ready=()=>page.waitForFunction(()=>document.querySelector('.project-print')?.dataset.paginationState==='ready',null,{timeout:600000});
const prepare=async()=>{await ready();await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));await page.locator('.project-print .print-page').first().waitFor({state:'attached'});};
const checks=[];
try{
 await page.goto('http://127.0.0.1:5173/#/booklet?stage=projects&project='+record.id,{waitUntil:'domcontentloaded'});await prepare();
 await page.emulateMedia({media:'print'});
 for(const id of ids){const block=page.locator(`.project-print [data-arrangement-block="${id}"]`).first();if(await block.count())await block.screenshot({path:`${out}/${id}.png`});}
 await page.emulateMedia({media:'screen'});
 const first=record.sections[0].blocks[0],diagram=first.content.questionDiagrams?.[0];
 // Select a diagram in the current editor, then use the visible toolbar route.
 const selected=diagram?page.locator(`.flow-paper [data-diagram-id="${diagram.id}"]`).first():page.locator(`.flow-paper [data-edit-root="${first.content.id}"] .clickable`).first();
 await selected.scrollIntoViewIfNeeded();await selected.click();
 if(await page.locator('.document-toolbar').getByRole('button',{name:'Layout & spacing',exact:true}).getAttribute('aria-expanded')!=='true')await page.locator('.document-toolbar').getByRole('button',{name:'Layout & spacing',exact:true}).click();await page.getByRole('button',{name:/^Detailed arrangement/}).click();
 const dialog=page.getByRole('dialog'),properties=dialog.getByRole('complementary',{name:'Selection properties'});
 await properties.waitFor();
 if(diagram){assert.equal(await dialog.locator(`.arr-canvas .selected [data-diagram-id="${diagram.id}"]`).count(),1);checks.push('Selected diagram opens directly with move and spacing controls');}
 // Move and undo are reachable for an item, and restore its content order.
 if(diagram){await properties.getByRole('tab',{name:'Arrange',exact:true}).click();await properties.getByRole('button',{name:'Move before',exact:true}).click();await dialog.getByRole('button',{name:'Undo edit',exact:true}).click();await properties.getByRole('tab',{name:'Layout',exact:true}).click();}
 await properties.getByRole('button',{name:'Edit selected content',exact:true}).click();
 await dialog.getByRole('region',{name:'Selected content editor'}).waitFor();
 await dialog.getByRole('button',{name:'Apply to question',exact:true}).click();
 await properties.waitFor();
 await page.waitForTimeout(100);assert.equal(await properties.isVisible(),true);checks.push('Apply stays in layout properties');
 await properties.getByRole('button',{name:'Edit selected content',exact:true}).click();
 await dialog.getByRole('button',{name:'Discard content draft',exact:true}).click();await properties.waitFor();
 checks.push('Discard stays in layout properties');
 await properties.getByLabel('Space below (mm)',{exact:true}).fill('1.5');
 await properties.getByLabel('Space below (mm)',{exact:true}).press('Tab');
 await dialog.locator(':scope > header').getByRole('button',{name:'Save',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
 assert.ok(writes.length);
 await page.reload();await prepare();
 const target=diagram?page.locator(`.flow-paper [data-diagram-id="${diagram.id}"]`).first():page.locator(`.flow-paper [data-edit-root="${first.content.id}"] .clickable`).first();
 await target.scrollIntoViewIfNeeded();await target.click();if(await page.locator('.document-toolbar').getByRole('button',{name:'Layout & spacing',exact:true}).getAttribute('aria-expanded')!=='true')await page.locator('.document-toolbar').getByRole('button',{name:'Layout & spacing',exact:true}).click();await page.getByRole('button',{name:/^Detailed arrangement/}).click();
 assert.equal(await properties.getByLabel('Space below (mm)',{exact:true}).inputValue(),'1.5');
 await dialog.locator(':scope > header').getByRole('button',{name:'Cancel',exact:true}).click();checks.push('Spacing persists through save/reopen; cancel closes cleanly');
 for(const zoom of ['0.5','1']){await page.getByLabel('Booklet zoom',{exact:true}).selectOption(zoom);await ready();}checks.push('Preview at 50% and 100%');
 assert.deepEqual(record.sections,before.sections,'Layout editing preserves content, evidence, bank refs and all source mathematics');
 assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/report.json',JSON.stringify({passed:true,checks,writes,errors,finished:new Date().toISOString()},null,2));
 console.log(checks.join('\n'));
}finally{await context.storageState({path:out+'/cache.json',indexedDB:true});await browser.close();}
