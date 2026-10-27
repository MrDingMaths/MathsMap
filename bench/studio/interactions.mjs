// Studio interaction benchmark against a running server (default 5173).
// Project writes stay in memory; list, open, render-cache and bank requests
// reach the real server so their cost is measured.
// node bench/studio/interactions.mjs [--projects a,b] [--repetitions 3] [--edits 6] [--label before]
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright-core';
import {questionSpacing} from '../../src/lib/booklet-document-tools.js';
const arg=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const base=arg('--base','http://127.0.0.1:5173'),label=arg('--label',new Date().toISOString().replace(/[:.]/g,'-'));
const ids=arg('--projects','angle-sums-of-polygons-v1,operations-fractions-decimals-v1,index-laws-complete-v1,linear-relationships-v1,angle-relationships-v1,concept-maths-adv11-ch02').split(',');
const repetitions=Number(arg('--repetitions','1')),edits=Number(arg('--edits','6'));
const out=path.join('.booklet-work/studio-bench',label+'.json');fs.mkdirSync(path.dirname(out),{recursive:true});
const report={label,base,started:new Date().toISOString(),runs:[]},save=()=>fs.writeFileSync(out,JSON.stringify(report,null,2));
const timed=async work=>{const start=performance.now();const value=await work();return [performance.now()-start,value];};
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const median=values=>{const v=values.filter(Number.isFinite).sort((a,b)=>a-b);return v.length?Math.round(v[Math.floor((v.length-1)/2)]):null;};
const p95=values=>{const v=values.filter(Number.isFinite).sort((a,b)=>a-b);return v.length?Math.round(v[Math.min(v.length-1,Math.ceil(v.length*0.95)-1)]):null;};

async function benchProject(id,repetition){
  const result={id,repetition,errors:[]};report.runs.push(result);
  const [listMs,list]=await timed(()=>fetch(base+'/__booklet/projects?summary=1').then(r=>r.json()));result.listMs=Math.round(listMs);result.projects=list.length;
  let record=JSON.parse(fs.readFileSync(`booklets/projects/${id}.json`,'utf8'));
  const context=await browser.newContext({viewport:{width:1700,height:1100}}),page=await context.newPage();
  page.on('pageerror',e=>result.errors.push(e.message));
  let saveBytes=[];
  await page.route('**/__booklet/**',route=>{
    const req=route.request(),url=new URL(req.url());
    if(url.pathname===`/__booklet/projects/${id}`&&['PUT','PATCH'].includes(req.method())){
      const body=req.postDataJSON();saveBytes.push(req.postData()?.length??0);
      record={...(body.project??record),revision:record.revision+1,updatedAt:new Date().toISOString()};return route.fulfill({json:record});
    }
    return req.method()==='GET'?route.fallback():route.abort('blockedbyclient');
  });
  const ready=()=>page.waitForFunction(()=>{const el=document.querySelector('.flow-document');return el?.dataset.paginationState==='ready'&&el.dataset.paginationRuns&&!document.querySelector('.workspace-loading');},null,{timeout:900000});
  const lastMetrics=()=>page.evaluate(()=>JSON.parse(document.querySelector('.flow-document').dataset.paginationMetrics??'null'));
  const heap=()=>page.evaluate(()=>performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null);
  try{
    const [openMs]=await timed(async()=>{await page.goto(base+'/#/booklet?stage=projects&project='+id,{waitUntil:'domcontentloaded'});await ready();});
    result.openMs=Math.round(openMs);result.open=await lastMetrics();result.pages=await page.locator('[data-flow-index]').count();
    result.tikz=await page.evaluate(()=>window.TikZ?.stats?.()??null);
    const [reloadMs]=await timed(async()=>{await page.reload({waitUntil:'domcontentloaded'});await ready();});
    result.reloadMs=Math.round(reloadMs);result.reload=await lastMetrics();
    // Edit settle: commit a whole-question spacing change and time to the next ready layout.
    const block=record.sections.filter(s=>s.phase==='practice').flatMap(s=>s.blocks).find(b=>b.type==='question'&&questionSpacing(record,b).spaces.length>=1);
    if(block&&edits){
      await page.evaluate(()=>{window.__settle=[];document.addEventListener('change',e=>{
        if(!e.target.matches('[aria-label="Whole question answer space height (mm)"]'))return;
        const root=document.querySelector('.flow-document'),previous=root.dataset.paginationRuns,start=performance.now();
        const observer=new MutationObserver(()=>{if(root.dataset.paginationRuns===previous||root.dataset.paginationState!=='ready')return;observer.disconnect();window.__settle.push({ms:performance.now()-start,metrics:JSON.parse(root.dataset.paginationMetrics)});});
        observer.observe(root,{attributes:true});
      },true);});
      await page.getByRole('button',{name:'Toggle page navigation',exact:true}).click();
      const section=record.sections.find(s=>s.blocks.some(b=>b.id===block.id)),topic=record.topics.find(t=>t.id===section.topicId);
      const topicButton=page.locator('.flow-outline .topic-toggle').filter({hasText:topic.title}).first();if(await topicButton.getAttribute('aria-expanded')!=='true')await topicButton.click();
      await page.locator(`.flow-outline [data-block-id="${block.id}"] button`).first().click();
      const layoutButton=page.getByRole('button',{name:/^(Spacing|Layout)$/}).first();await layoutButton.click();
      if(await page.getByLabel('Spacing scope',{exact:true}).count())await page.getByLabel('Spacing scope',{exact:true}).selectOption('question');
      const input=page.getByLabel('Whole question answer space height (mm)',{exact:true});await input.waitFor({timeout:30000});
      for(let i=0;i<edits;i++){await input.fill(String(i%2?8:24));await input.press('Tab');await page.waitForFunction(n=>window.__settle.length>n,i,{timeout:300000});}
      const samples=await page.evaluate(()=>window.__settle);
      result.edit={medianMs:median(samples.map(s=>s.ms)),p95Ms:p95(samples.map(s=>s.ms)),samples:samples.map(s=>({ms:Math.round(s.ms),measurements:s.metrics.measurements,cacheHits:s.metrics.cacheHits,cacheSetupMs:Math.round(s.metrics.cacheSetupMs??0),reusedPages:s.metrics.reusedPages??0,layoutCache:s.metrics.layoutCache}))};
      const undo=page.getByRole('button',{name:'Undo',exact:true});
      if(await undo.isEnabled()){const before=await page.locator('.flow-document').getAttribute('data-pagination-runs');const [undoMs]=await timed(async()=>{await undo.click();await page.waitForFunction(b=>{const r=document.querySelector('.flow-document');return r.dataset.paginationState==='ready'&&r.dataset.paginationRuns!==b;},before,{timeout:300000});});result.undoMs=Math.round(undoMs);}
    }
    if(!process.argv.includes('--no-bank')){
      // Bank picker: Insert › From question bank… until the result count shows.
      const [bankMs]=await timed(async()=>{
        await page.locator('summary').filter({hasText:/^Insert$/}).first().click();await page.getByRole('button',{name:'From question bank…',exact:true}).click();
        await page.waitForFunction(()=>{const s=document.querySelector('.bank-picker .picker-search span')?.textContent??'';return /^[1-9]\d* questions$/.test(s)&&!document.querySelector('.bank-picker [role="status"]');},null,{timeout:300000});
      });
      result.bankPickerMs=Math.round(bankMs);
      const [searchMs]=await timed(async()=>{const before=await page.locator('.bank-picker .picker-search span').textContent();await page.getByLabel('Search bank questions',{exact:true}).fill('angle');await page.waitForFunction(b=>document.querySelector('.bank-picker .picker-search span')?.textContent!==b,before,{timeout:60000});});
      result.bankSearchMs=Math.round(searchMs);
      await page.getByRole('button',{name:'Close question picker',exact:true}).click();
    }
    result.saveBytes=saveBytes;result.heapMb=await heap();
  }catch(e){result.failure=e.message;}
  finally{await context.close();save();}
  console.log(JSON.stringify({id,repetition,listMs:result.listMs,openMs:result.openMs,reloadMs:result.reloadMs,reloadMeasurements:result.reload?.measurements,reloadPersistentHits:result.reload?.persistentHits,edit:result.edit&&{median:result.edit.medianMs,p95:result.edit.p95Ms,measurements:result.edit.samples.map(s=>s.measurements).join('/'),layoutCache:result.edit.samples[0]?.layoutCache},undoMs:result.undoMs,bankPickerMs:result.bankPickerMs,bankSearchMs:result.bankSearchMs,heapMb:result.heapMb,failure:result.failure,errors:result.errors.length}));
}
try{for(let r=1;r<=repetitions;r++)for(const id of ids)await benchProject(id,r);}
finally{await browser.close();report.finished=new Date().toISOString();save();console.log('Report: '+out);}
