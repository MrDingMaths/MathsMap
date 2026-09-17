// Exercise the real controls; all project writes stay in memory.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {questionSpacing} from '../../src/lib/booklet-document-tools.js';
import {publishBrowserDiagrams} from './render-cache-server.mjs';
const arg=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const projectId=arg('--project','linear-relationships-v1'),edition=arg('--edition','with-short');
const out=arg('--out','.booklet-work/spacing-performance/baseline-'+projectId),count=Number(arg('--count','20'));
fs.mkdirSync(out,{recursive:true});
const source=fs.readFileSync(`booklets/projects/${projectId}.json`),sourceHash=createHash('sha256').update(source).digest('hex');
let record=JSON.parse(source);record.settings.flowEdition=edition;
const candidates=record.sections.filter(s=>s.phase==='practice').flatMap(s=>s.blocks).filter(b=>b.type==='question'&&questionSpacing(record,b).spaces.length>=3);
const block=candidates.find(b=>b.id===arg('--block'))??candidates[0];assert.ok(block,'Need a question with several response spaces');
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const cacheFile='.booklet-work/spacing-performance/browser-cache.json';
const page=await browser.newPage({viewport:{width:1700,height:1100},...(fs.existsSync(cacheFile)?{storageState:cacheFile}:{})}),errors=[],runs=[],requests=[];let writes=0;
const progress=setInterval(()=>{void page.locator('.workspace-loading [role="status"]').textContent({timeout:1000}).then(s=>console.log('Opening: '+s)).catch(()=>{});},15000);
page.on('pageerror',e=>errors.push(e.message));
page.on('requestfinished',request=>{if(request.url().includes('/render-cache/version')){requests.push({url:request.url(),ms:request.timing().responseEnd});}});
await page.route('**/__booklet/**',route=>{
 const req=route.request(),url=new URL(req.url());
 if(url.pathname==='/__booklet/projects')return route.fulfill({json:[{id:record.id,title:record.title,revision:record.revision}]});
 if(url.pathname===`/__booklet/projects/${record.id}/open`)return route.fulfill({json:{project:record,bankSync:{items:[]}}});
 if(url.pathname===`/__booklet/projects/${record.id}`){if(req.method()==='PUT'){const body=req.postDataJSON();assert.equal(body.expectedRevision,record.revision);record={...body.project,revision:record.revision+1};writes++;}return route.fulfill({json:record});}
 if(url.pathname.endsWith('/bank-sync'))return route.fulfill({json:{items:[]}});
 if(url.pathname==='/__booklet/bank/manifest')return route.fulfill({json:{questions:[]}});
 return req.method()==='GET'?route.fallback():route.abort();
});
const ready=()=>page.waitForFunction(()=>{const el=document.querySelector('.flow-document');return el?.dataset.paginationState==='ready'&&el.dataset.paginationRuns;},null,{timeout:300000});
const map=async()=>{const result=await page.locator('.flow-page-group').evaluateAll(els=>els.map(el=>({page:el.dataset.pageNumber,blocks:el.dataset.flowBlocks,heading:el.querySelector('.page-marker').textContent})));assert.ok(result.length,'Page map must not be empty');assert.ok(result.every(p=>p.blocks),'Every page must expose its fragment map');return result;};
const saved=()=>page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
try{
 await page.goto((process.env.BOOKLET_TEST_BASE??'http://127.0.0.1:5173')+'/#/booklet?stage=projects&project='+record.id);
 await ready();clearInterval(progress);console.log('Opened '+projectId);
 await page.getByRole('button',{name:'Toggle page navigation',exact:true}).click();
 const section=record.sections.find(s=>s.blocks.some(b=>b.id===block.id)),topic=record.topics.find(t=>t.id===section.topicId);
 const topicButton=page.locator('.flow-outline .topic-toggle').filter({hasText:topic.title}).first();if(await topicButton.getAttribute('aria-expanded')!=='true')await topicButton.click();
 await page.locator(`.flow-outline [data-block-id="${block.id}"] button`).first().click();
 await page.getByRole('button',{name:'Spacing',exact:true}).click();
 if(await page.getByLabel('Spacing scope',{exact:true}).count())await page.getByLabel('Spacing scope',{exact:true}).selectOption('question');
 const input=page.getByLabel('Whole question answer space height (mm)',{exact:true});await input.waitFor();
 // The listener starts at commit, excluding automation and field-entry delays.
 await page.evaluate(()=>{window.__spacingSamples=[];document.addEventListener('change',e=>{
  if(!e.target.matches('[aria-label="Whole question answer space height (mm)"],[aria-label="Whole question vertical gap (mm)"]'))return;
  const root=document.querySelector('.flow-document'),previous=root.dataset.paginationRuns,start=performance.now(),value=e.target.value;
  const observer=new MutationObserver(()=>{if(root.dataset.paginationRuns===previous||root.dataset.paginationState!=='ready')return;observer.disconnect();
   const finish=()=>window.__spacingSamples.push({value,elapsedMs:performance.now()-start,metrics:JSON.parse(root.dataset.paginationMetrics)});
   // New instrumentation publishes after paint; older baselines need the paint
   // wait here. Do not add a second pair of frames to an already painted result.
   if(JSON.parse(root.dataset.paginationMetrics).paintMs!=null)finish();else requestAnimationFrame(()=>requestAnimationFrame(finish));
  });observer.observe(root,{attributes:true});
 },true);});
 const maps=new Map(),snapshots=new Map(),cdp=process.argv.includes('--profile')?await page.context().newCDPSession(page):null;
 if(cdp){await cdp.send('Profiler.enable');await cdp.send('Profiler.start');}
 for(let i=0;i<count;i++){
  const value=i%2?Number(arg('--low','2')):Number(arg('--high','30'));
  await input.fill(String(value));await input.press('Tab');
  await page.waitForFunction(n=>window.__spacingSamples.length>n,i,{timeout:120000});
  const sample=await page.evaluate(()=>window.__spacingSamples.at(-1)),current=await map();
  if(maps.has(value))assert.deepEqual(current,maps.get(value),'Repeated spacing must yield identical pages');else maps.set(value,current);
  runs.push({...sample,pages:current.length});console.log(JSON.stringify({projectId,index:i,...sample}));
  if(process.argv.includes('--verify')&&!snapshots.has(value)){await saved();snapshots.set(value,structuredClone(record));}
 }
 if(cdp){const {profile}=await cdp.send('Profiler.stop');fs.writeFileSync(path.join(out,'spacing.cpuprofile'),JSON.stringify(profile));await cdp.detach();}
 const checks=[];
 if(process.argv.includes('--verify')){
  const waitUpdate=async action=>{const previous=await page.locator('.flow-document').getAttribute('data-pagination-runs');await action();await page.waitForFunction(before=>{const root=document.querySelector('.flow-document');return root.dataset.paginationState==='ready'&&root.dataset.paginationRuns!==before;},previous,{timeout:120000});};
  const finalMap=await map();
  await waitUpdate(()=>page.getByRole('button',{name:'Undo',exact:true}).click());assert.deepEqual(await map(),maps.get(Number(arg('--high','30'))));
  await waitUpdate(()=>page.getByRole('button',{name:'Redo',exact:true}).click());assert.deepEqual(await map(),finalMap);checks.push('undo-redo');
  const gap=page.getByLabel('Whole question vertical gap (mm)',{exact:true});
  if(await gap.isEnabled()){
   await waitUpdate(async()=>{await gap.fill('7');await gap.press('Tab');});await saved();assert.equal(questionSpacing(record,record.sections.flatMap(s=>s.blocks).find(b=>b.id===block.id)).gap,7);
   await waitUpdate(()=>page.getByRole('button',{name:'Undo',exact:true}).click());assert.deepEqual(await map(),finalMap);checks.push('vertical-gap');
  }
  // Commit multiple edits while the preceding cache validation is outstanding.
  await waitUpdate(()=>input.evaluate(el=>{for(const value of ['14','26','2']){el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));}}));
  await saved();assert.deepEqual(await map(),maps.get(2));checks.push('rapid-latest-edit');
  const originalTransaction=await page.evaluate(()=>{
   const original=IDBDatabase.prototype.transaction;window.__restoreSpacingDB=()=>IDBDatabase.prototype.transaction=original;
   IDBDatabase.prototype.transaction=function(){throw Error('Spacing test: storage unavailable');};return true;
  });assert.ok(originalTransaction);
  await waitUpdate(async()=>{await input.fill('11');await input.press('Tab');});await saved();
  await page.evaluate(()=>window.__restoreSpacingDB());checks.push('unavailable-storage');
  await waitUpdate(async()=>{await input.fill('2');await input.press('Tab');});await saved();
  assert.deepEqual(await map(),maps.get(2));
  fs.writeFileSync(path.join(out,'work.json'),await page.locator('.flow-document').getAttribute('data-pagination-work'));
 }
 await saved();const beforeReload=await map();await page.screenshot({path:path.join(out,'spacing.png')});
 await page.reload();await ready();assert.deepEqual(await map(),beforeReload,'Fresh pagination must match the edited page map');
 for(const [value,snapshot] of snapshots){
  record=snapshot;await page.reload();await ready();assert.deepEqual(await map(),maps.get(value),'Fresh pagination at spacing '+value);checks.push('fresh-'+value);
  if(process.argv.includes('--capture')){
   await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));
   await page.locator('.project-print .print-page').first().waitFor({state:'attached'});
   await page.emulateMedia({media:'print'});
   const qa=await page.evaluate(async()=>{const {settleBooklet,inspectBooklet}=await import('/src/lib/booklet-qa.js');const root=document.querySelector('.project-print');await settleBooklet(root);return inspectBooklet(root,{style:true});});
   fs.writeFileSync(path.join(out,`layout-${value}.json`),JSON.stringify(qa,null,2));
   const affected=maps.get(value).filter(p=>p.blocks.includes(block.id)).map(p=>Number(p.page));
   const selected=[...new Set([1,...affected.flatMap(p=>[p-1,p,p+1])])].filter(p=>p>0&&p<=maps.get(value).length).sort((a,b)=>a-b);
   await page.pdf({path:path.join(out,`pages-${value}.pdf`),pageRanges:selected.join(','),format:'A4',printBackground:true,preferCSSPageSize:true});
   fs.writeFileSync(path.join(out,`pages-${value}.json`),JSON.stringify(selected));
   await page.emulateMedia({media:'screen'});
  }
 }
 const sorted=runs.map(r=>r.elapsedMs).sort((a,b)=>a-b),summary={medianMs:sorted[Math.floor(sorted.length/2)],p95Ms:sorted[Math.ceil(sorted.length*.95)-1]};
 assert.deepEqual(errors,[]);assert.equal(createHash('sha256').update(fs.readFileSync(`booklets/projects/${projectId}.json`)).digest('hex'),sourceHash);
 const diagrams=await publishBrowserDiagrams(page);await page.context().storageState({path:cacheFile,indexedDB:true});
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({projectId,blockId:block.id,edition,sourceHash,summary,runs,writes,errors,pageMaps:[...maps],requests,diagrams,checks},null,2));console.log(JSON.stringify({projectId,blockId:block.id,summary,writes}));
}catch(e){await page.screenshot({path:path.join(out,'failure.png')});fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({error:e.stack,errors,runs,body:(await page.locator('body').innerText()).slice(-5000)},null,2));throw e;}finally{clearInterval(progress);await browser.close();}
