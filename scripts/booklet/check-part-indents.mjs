// Read-only layout inventory and isolated editor/print regression for semantic gutters.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {resolveArrangement} from '../../src/lib/booklet-arrangement.js';
const out='.booklet-work/part-indent';fs.mkdirSync(out,{recursive:true});
const started=new Date().toISOString(),inventory=[];
for(const file of fs.readdirSync('booklets/projects').filter(f=>f.endsWith('.json'))){
 const project=JSON.parse(fs.readFileSync('booklets/projects/'+file));
 const affected=[];
 for(const section of project.sections)for(const block of section.blocks.filter(b=>b.type==='question')){
  const overrides={...block.presentation?.layoutOverrides,blockLayouts:{...block.presentation?.layoutOverrides?.blockLayouts,...project.settings?.layoutOverrides?.blockLayouts}};
  const resolved=resolveArrangement(block,overrides.blockLayouts[block.id]?.arrangement,overrides);
  if(resolved.labelIndents.size)affected.push({block:block.id,section:section.id,sourcePage:block.sourcePageNumber,indents:Object.fromEntries(resolved.labelIndents)});
 }
 inventory.push({project:project.id,revision:project.revision,affected});
}
fs.writeFileSync(out+'/inventory.json',JSON.stringify({started,inventory},null,2));
console.log(inventory.map(p=>`${p.project}: ${p.affected.length} affected questions`).join('\n'));
if(process.argv.includes('--inventory'))process.exit(0);
let record=JSON.parse(fs.readFileSync('booklets/projects/non-right-angled-trigonometry-v1.json'));
record.id='part-indent-check';record.settings.generatedCover=false;record.settings.flowEdition='student';
const ids=new Set(['nr-p44-q1','nr-p48-q14-block','nr-p50-q1','nr-p55-q16-block','nr-p29-q6-block']);
record.sections=record.sections.map(s=>({...s,blocks:s.blocks.filter(b=>ids.has(b.id))})).filter(s=>s.blocks.length);
const browser=await chromium.launch({headless:true,channel:'chrome'});
const cache='.booklet-work/standard-palette/browser-state.json';
const context=await browser.newContext({viewport:{width:1600,height:1100},...(fs.existsSync(cache)?{storageState:cache}:{})});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/__booklet/**',async route=>{
 const req=route.request(),url=new URL(req.url());
 if(url.pathname==='/__booklet/projects')return route.fulfill({json:[record]});
 if(url.pathname===`/__booklet/projects/${record.id}`){if(req.method()==='PUT'){const body=req.postDataJSON();assert.equal(body.expectedRevision,record.revision);record={...body.project,revision:record.revision+1};}return route.fulfill({json:record});}
 if(req.method()==='GET'&&/files|assets/.test(url.pathname))return route.continue();
 return route.fulfill({json:url.pathname.endsWith('/manifest')?{questions:[]}:{items:[]}});
});
const ready=()=>page.waitForFunction(()=>document.querySelector('.project-print')?.dataset.paginationState==='ready',null,{timeout:600000});
const prepare=async()=>{await ready();await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));await page.locator('.project-print .print-page').first().waitFor({state:'attached'});};
const checks=[];
async function check(root,zoom=1){
 for(const [block,parent,part] of [['nr-p44-q1','nr-p44-q1-content','nr-p44-q1-a'],['nr-p48-q14-block','nr-p48-q14','nr-p48-q14-a'],['nr-p50-q1','nr-p50-q1-root','nr-p50-q1-a'],['nr-p55-q16-block','nr-p55-q16','nr-p55-q16-c'],['nr-p29-q6-block','nr-p29-q6','nr-p29-q6a']]){
  const scope=page.locator(`${root} [data-arrangement-block="${block}"]`).first();
  const positions=await scope.evaluate((el,{parent,part,block})=>{const label=id=>el.querySelector(`[data-content-owner="${id}"].label-item`);const a=block==='nr-p29-q6-block'?label(part)?.parentElement.getBoundingClientRect():label(parent)?.getBoundingClientRect(),b=label(part)?.getBoundingClientRect();return a&&b?{parent:a.x,part:b.x}:null;},{parent,part,block});
  assert.ok(positions,block);const mm=(positions.part-positions.parent)/zoom*25.4/96;
  assert.ok(Math.abs(mm-7)<.15,`${block}: ${mm} mm`);checks.push({root,zoom,block,mm});
 }
}
try{
 await page.goto('http://127.0.0.1:5173/#/booklet?stage=projects&project='+record.id,{waitUntil:'domcontentloaded'});await prepare();
 await page.emulateMedia({media:'print'});await check('.project-print');
 for(const id of ids)await page.locator(`.project-print [data-arrangement-block="${id}"]`).first().screenshot({path:`${out}/${id}.png`});
 await page.emulateMedia({media:'screen'});
 for(const zoom of ['1','0.5','0.75','1']){
  await page.getByLabel('Booklet zoom',{exact:true}).selectOption(zoom);
  const mm=await page.locator('.flow-paper [data-arrangement-block="nr-p29-q6-block"]').first().evaluate(el=>{
   const label=id=>el.querySelector(`[data-content-owner="${id}"].label-item`).getBoundingClientRect();
   const scale=el.getBoundingClientRect().width/el.offsetWidth;
   const group=el.querySelector('[data-content-owner="nr-p29-q6a"].label-item').parentElement.getBoundingClientRect();
   return (label('nr-p29-q6a').x-group.x)/scale*25.4/96;
  });
  assert.ok(Math.abs(mm-7)<.15,`Preview at zoom ${zoom}: ${mm} mm`);checks.push({root:'.flow-paper',zoom,mm});
 }
 const first=record.sections[0].blocks[0];
 const field=page.locator(`.flow-paper [data-edit-root="${first.content.id}"][data-edit-path="/prompt"] .clickable`).first();
 await field.scrollIntoViewIfNeeded();await field.click();await page.locator('maths-editor .me-content').waitFor();await page.keyboard.press('End');await page.keyboard.type(' Indent regression check.');
 await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');await page.reload();await prepare();
 await page.emulateMedia({media:'print'});await check('.project-print');
 assert.deepEqual(errors,[]);await context.storageState({path:out+'/cache.json',indexedDB:true});
 fs.writeFileSync(out+'/editor-report.json',JSON.stringify({started,finished:new Date().toISOString(),checks,saveReopen:true,errors},null,2));console.log('Print gutters and isolated edit/save/reopen passed');
}finally{await browser.close();}
