// Read-only opening benchmarks. All API writes are blocked; routing disables
// HTTP caching consistently, so "warm" refers to diagram/measurement caches.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {rendererFingerprint} from './render-cache-server.mjs';
const arg=(name,fallback)=>process.argv.includes(name)?process.argv[process.argv.indexOf(name)+1]:fallback;
const base=arg('--base','http://127.0.0.1:5173'),out=arg('--out','.booklet-work/studio-load/profile.json');
const all=fs.readdirSync('booklets/projects').filter(f=>f.endsWith('.json')).map(f=>f.slice(0,-5));
const ids=arg('--projects',all.join(',')).split(','),repetitions=Number(arg('--repetitions','3'));
const scenarios=arg('--scenarios','cold,prepared,reload,switch').split(',');
const hash=v=>createHash('sha256').update(v).digest('hex');
const snapshot=()=>Object.fromEntries([...fs.readdirSync('booklets/projects').filter(f=>f.endsWith('.json')).map(f=>'booklets/projects/'+f),...fs.readdirSync('booklets/question-bank').filter(f=>f.endsWith('.json')).map(f=>'booklets/question-bank/'+f)].map(f=>[f,hash(fs.readFileSync(f))]));
const report={started:new Date().toISOString(),base,repetitions,httpCache:'disabled consistently by write-blocking interception',renderer:await rendererFingerprint(),inputs:snapshot(),runs:[]};
fs.mkdirSync(path.dirname(out),{recursive:true});
const save=()=>fs.writeFileSync(out,JSON.stringify(report,null,2));
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
async function contextFor(mode){
 const context=await browser.newContext({viewport:{width:1700,height:1200}});
 await context.route('**/__booklet/**',r=>r.request().method()==='GET'?r.continue():r.abort('blockedbyclient'));
 await context.addInitScript(mode=>{
  window.__bookletCacheMode=mode;performance.setResourceTimingBufferSize(20000);
  window.__loadProfile={phases:[],longTasks:[]};let previous='';
  new PerformanceObserver(list=>window.__loadProfile.longTasks.push(...list.getEntries().map(e=>({at:e.startTime,ms:e.duration})))).observe({type:'longtask',buffered:true});
  new MutationObserver(()=>{const text=document.querySelector('.loading-card')?.innerText??document.querySelector('.flow-document > [role="status"]')?.textContent??'';if(text&&text!==previous){previous=text;window.__loadProfile.phases.push({at:performance.now(),text});}}).observe(document,{subtree:true,childList:true,characterData:true});
 },mode);
 return context;
}
const ready=page=>page.waitForFunction(()=>document.querySelector('.flow-document')?.dataset.paginationState==='ready'&&!document.querySelector('.workspace-loading'),null,{timeout:600000});
async function run(page,id,scenario,repetition){
 const result={id,scenario,repetition,revision:JSON.parse(fs.readFileSync('booklets/projects/'+id+'.json')).revision,errors:[]};report.runs.push(result);save();
 const listener=e=>result.errors.push(e.message);page.on('pageerror',listener);
 const stats=await page.evaluate(()=>window.TikZ?.stats?.()??{}).catch(()=>({}));
 const start=Date.now(),offset=scenario==='switch'?await page.evaluate(()=>performance.now()):0;
 const heartbeat=setInterval(()=>console.log(id+' '+scenario+': '+Math.round((Date.now()-start)/1000)+'s'),30000);
 try{
  if(scenario==='reload')await page.reload({waitUntil:'domcontentloaded'});
  else if(scenario==='switch')await page.getByLabel('Open booklet',{exact:true}).selectOption(id);
  else await page.goto(base+'/#/booklet?stage=projects&project='+id,{waitUntil:'domcontentloaded'});
  await ready(page);result.readyMs=Date.now()-start;
  Object.assign(result,await page.evaluate(offset=>({
   metrics:JSON.parse(document.querySelector('.flow-document').dataset.paginationMetrics??'null'),
   paginationRuns:JSON.parse(document.querySelector('.flow-document').dataset.paginationRuns??'[]'),
   pageMarkers:[...document.querySelectorAll('.page-marker')].map(e=>e.innerText),
   pages:document.querySelectorAll('[data-flow-index]').length,
   profile:window.__loadProfile,
   tikz:window.TikZ?.stats?.()??{},
   resources:performance.getEntriesByType('resource').filter(e=>e.startTime>=offset).map(e=>({url:e.name,start:e.startTime,duration:e.duration,bytes:e.transferSize,bodyBytes:e.encodedBodySize})),
  }),offset));
  result.compiles=result.tikz.compiles-(scenario==='switch'?(stats.compiles??0):0);
  result.serverHits=result.tikz.serverHits-(scenario==='switch'?(stats.serverHits??0):0);
  result.bankDetailRequests=result.resources.filter(r=>r.url.includes('/bank/questions/')).length;
  assert.equal(result.bankDetailRequests,0);assert.deepEqual(result.errors,[]);
  if(scenario!=='cold')assert.equal(result.compiles,0,'Prepared diagrams must not compile');
  if(['reload','switch'].includes(scenario)){assert.ok(result.metrics.persistentHits>0);assert.equal(result.metrics.measurements,0);}
  const before=report.runs.find(r=>r.id===id&&r!==result&&r.pageMarkers);if(before)assert.deepEqual(result.pageMarkers,before.pageMarkers,'Page counts and section positions changed');
  assert.deepEqual(snapshot(),report.inputs,'Source content changed during profiling');
  assert.equal(await rendererFingerprint(),report.renderer,'Renderer changed during profiling');
  console.log(JSON.stringify({id,scenario,repetition,readyMs:result.readyMs,compiles:result.compiles,serverHits:result.serverHits,persistentHits:result.metrics.persistentHits,pages:result.pages}));
 }catch(e){result.failure=e.message;throw e;}finally{clearInterval(heartbeat);page.off('pageerror',listener);save();}
}
try{
 for(let repetition=1;repetition<=repetitions;repetition++)for(const id of ids){
  if(scenarios.includes('cold')){const context=await contextFor('server-off');try{await run(await context.newPage(),id,'cold',repetition);}finally{await context.close();}}
  if(scenarios.some(s=>s!=='cold')){
   const context=await contextFor('normal'),page=await context.newPage();
   try{
    await run(page,id,'prepared',repetition);
    if(scenarios.includes('reload'))await run(page,id,'reload',repetition);
    if(scenarios.includes('switch')){const other=all.find(v=>v!==id);await page.getByLabel('Open booklet',{exact:true}).selectOption(other);await ready(page);await run(page,id,'switch',repetition);}
   }finally{await context.close();}
  }
 }
}finally{
 await browser.close();report.finished=new Date().toISOString();
 const groups=new Map();for(const r of report.runs.filter(r=>r.readyMs&&!r.failure)){const key=r.id+':'+r.scenario;groups.set(key,[...groups.get(key)??[],r.readyMs]);}
 report.medians=Object.fromEntries([...groups].map(([key,values])=>{values.sort((a,b)=>a-b);return [key,values[Math.floor(values.length/2)]];}));save();
}
