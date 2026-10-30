// Pre-compile one booklet's diagrams before a scoped check, in parallel.
// Pagination hands TikZJax one page's diagrams at a time, so a cold check waits
// for every compile in series (Differential Equations, 90 diagrams: 263 s). This
// tool first collects the booklet's TikZ sources with compilation stubbed out,
// then compiles the unique sources across a few pages against the same server
// and publishes them to the shared cache (measured: 148 s on one page, 66 s on
// three). The check then renders every diagram by its real key, so a source this
// pass misses only compiles in the check as before; nothing here is evidence.
// node scripts/booklet/prewarm-diagrams.mjs (--project ID | --project-file FILE)
//   [--base URL] [--editions student,short,worked] [--pages 3] [--out REPORT]
// --all (every live booklet) or --projects a,b warms a whole library for Studio;
// progress prints per booklet and per batch, the report goes to --out.
// Run it against the --base the check will use. --cold ignores the server cache
// when looking up (measurement only; it recompiles cached diagrams).
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright-core';
import {launchChromium} from './browser-launch.mjs';
import {routeCandidateProject} from './diagram-preflight.mjs';
import {publishBrowserDiagrams} from './render-cache-server.mjs';

const SIGNATURE='export function renderTikzCode(outerEl, code, { eager = false, onSuccess=null, onError=null } = {}) {';
// Collection records each source and shows a placeholder at once, so pagination
// never waits for TikZJax. Only this browser's copy of tikz.js is changed.
export function collectorSource(body){
  if(!body.includes(SIGNATURE))throw Error('renderTikzCode signature changed; update prewarm-diagrams.mjs');
  return body.replace(SIGNATURE,SIGNATURE+"\n  if(window.__tikzSources){window.__tikzSources.add(code);const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('class','tikz-svg');s.setAttribute('viewBox','0 0 100 60');s.setAttribute('width','100');s.setAttribute('height','60');outerEl.innerHTML='';outerEl.appendChild(s);onSuccess?.(s.outerHTML);return;}");
}
// Round-robin keeps shards balanced when sources are grouped by section.
export const shard=(items,count)=>Array.from({length:Math.max(1,Math.min(count,items.length))},(_,i)=>items.filter((_,j)=>j%Math.max(1,Math.min(count,items.length))===i));
const readOnly=page=>page.route('**/__booklet/**',route=>route.request().method()==='GET'?route.fallback():route.abort('blockedbyclient'));

async function ready(page,edition){
  const select=page.getByLabel('Booklet edition',{exact:true}),deadline=Date.now()+600000;
  while(Date.now()<deadline){
    if(await select.inputValue()!==edition)await select.selectOption(edition);
    const state=await page.locator('.flow-document').evaluate(el=>({state:el.dataset.paginationState,edition:el.dataset.paginatedEdition,error:el.querySelector('[role=alert]')?.textContent}));
    if(state.state==='error')throw Error(state.error||'Pagination failed');
    if(state.state==='ready'&&state.edition===edition)return;
    await page.waitForTimeout(200);
  }
  throw Error('Pagination timed out');
}

// Opens each edition as the checker does, including the print surface.
export async function collectSources(browser,{base,project,editions}){
  const context=await browser.newContext({viewport:{width:1600,height:1100}}),page=await context.newPage(),sources=new Set();
  try{
    // Pagination can occupy the page's main thread for longer than the default action timeout.
    page.setDefaultTimeout(300000);
    await page.addInitScript(()=>{window.__tikzSources=new Set();});
    await page.route(/\/src\/lib\/tikz\.js(?:\?|$)/,async route=>{const response=await route.fetch();await route.fulfill({response,body:collectorSource(await response.text())});});
    const record=structuredClone(project);await routeCandidateProject(page,record);
    for(const edition of editions){
      record.settings.flowEdition=edition;
      await page.goto('about:blank');
      await page.goto(base+'/#/booklet?stage=projects&project='+encodeURIComponent(record.id),{waitUntil:'domcontentloaded',timeout:180000});
      await page.getByLabel('Booklet edition',{exact:true}).waitFor({state:'visible',timeout:600000});
      await ready(page,edition);
      // A booklet without answers has an empty short or worked edition: no print surface.
      if(await page.locator('.flow-document .booklet-page').count()){
        await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));
        await page.locator('.project-print .print-page').first().waitFor({state:'attached'});
        await page.emulateMedia({media:'print'});
        await page.evaluate(async()=>{const {settleBooklet}=await import('/src/lib/booklet-qa.js');await settleBooklet(document.querySelector('.project-print'));});
        await page.emulateMedia({media:'screen'});
      }
      for(const code of await page.evaluate(()=>[...window.__tikzSources]))sources.add(code);
    }
  }finally{await context.close();}
  return [...sources];
}

export async function compileSources(browser,{base,codes,pages=3,cold=false}){
  const context=await browser.newContext({viewport:{width:1200,height:900}});
  try{
    if(cold)await context.addInitScript(()=>{window.__bookletCacheMode='server-off';});
    const shards=shard(codes,pages);
    const rows=await Promise.all(shards.map(async list=>{
      const page=await context.newPage();await readOnly(page);await page.goto(base+'/libs/tikzjax/fonts.css');
      const result=await page.evaluate(async codes=>{
        const {renderTikzCode}=await import('/src/lib/tikz.js');let failed=0;
        await Promise.all(codes.map(code=>new Promise(resolve=>{const el=document.createElement('div');document.body.appendChild(el);renderTikzCode(el,code,{eager:true,onSuccess:()=>resolve(),onError:()=>{failed++;resolve();}});})));
        return {failed,stats:window.TikZ?.stats?.()??null};
      },list);
      return {...result,diagrams:list.length,published:(await publishBrowserDiagrams(page)).published??0};
    }));
    const sum=name=>rows.reduce((total,row)=>total+(row.stats?.[name]??0),0);
    return {pages:shards.length,compiles:sum('compiles'),cacheHits:sum('memoryHits')+sum('idbHits')+sum('serverHits'),failed:rows.reduce((total,row)=>total+row.failed,0),published:rows.reduce((total,row)=>total+row.published,0)};
  }finally{await context.close();}
}

// Whole library: collect every booklet (three at a time), de-duplicate across
// booklets, then compile in batches so each batch is published as it finishes.
// An interrupted run loses at most one batch; rerunning skips what is cached.
async function warmLibrary(browser,{base,editions,pages,ids,out}){
  const started=Date.now(),sources=new Set(),booklets=[],queue=[...ids];
  await Promise.all(Array.from({length:Math.min(3,queue.length)},async()=>{
    while(queue.length){
      const id=queue.shift(),t=Date.now();
      try{
        const project=JSON.parse(fs.readFileSync(`booklets/projects/${id}.json`,'utf8').replace(/^﻿/,''));
        const codes=await collectSources(browser,{base,project,editions});codes.forEach(code=>sources.add(code));
        booklets.push({id,sources:codes.length,seconds:Math.round((Date.now()-t)/1000)});
      }catch(error){booklets.push({id,error:error.message.slice(0,300)});}
      console.log(JSON.stringify({collected:booklets.length,of:ids.length,id,unique:sources.size}));
    }
  }));
  const codes=[...sources],batch=pages*80,totals={compiles:0,cacheHits:0,failed:0,published:0},collectMs=Date.now()-started;
  for(let i=0;i<codes.length;i+=batch){
    const row=await compileSources(browser,{base,codes:codes.slice(i,i+batch),pages});
    for(const name of Object.keys(totals))totals[name]+=row[name];
    console.log(JSON.stringify({compiled:Math.min(i+batch,codes.length),of:codes.length,...totals}));
  }
  const report={tool:'prewarm-diagrams',mode:'library',base,editions,booklets:booklets.length,failedBooklets:booklets.filter(b=>b.error),sources:codes.length,collectMs,compileMs:Date.now()-started-collectMs,pages,...totals,elapsedMs:Date.now()-started,perBooklet:booklets};
  fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2));
  return report;
}

async function main(){
  const arg=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
  if(process.argv.includes('--all')||arg('--projects')){
    const {listBookletProjects}=await import('./project-studio-server.mjs');
    const ids=arg('--projects')?.split(',')??(await listBookletProjects({summary:true})).filter(p=>!p.library?.archivedAt).map(p=>p.id);
    const browser=await launchChromium(chromium,{headless:true});
    try{
      const report=await warmLibrary(browser,{base:arg('--base','http://127.0.0.1:5173'),editions:arg('--editions','student,short,worked').split(','),pages:Math.max(1,Number(arg('--pages','3'))),ids,out:arg('--out','.booklet-work/studio-load/prewarm-library.json')});
      console.log(JSON.stringify({...report,perBooklet:undefined,failedBooklets:report.failedBooklets.length}));
      if(report.failed||report.failedBooklets.length)process.exitCode=1;
    }finally{await browser.close();}
    return;
  }
  const file=arg('--project-file')??(arg('--project')?`booklets/projects/${arg('--project')}.json`:null);
  if(!file)throw Error('Use --project ID or --project-file FILE');
  const project=JSON.parse(fs.readFileSync(file,'utf8').replace(/^﻿/,''));
  const base=arg('--base','http://127.0.0.1:5173'),editions=arg('--editions','student,short,worked').split(','),pages=Math.max(1,Number(arg('--pages','3')));
  const started=Date.now(),browser=await launchChromium(chromium,{headless:true});
  try{
    const codes=await collectSources(browser,{base,project,editions}),collectedMs=Date.now()-started;
    const compiled=await compileSources(browser,{base,codes,pages,cold:process.argv.includes('--cold')});
    const report={tool:'prewarm-diagrams',projectId:project.id,base,editions,sources:codes.length,collectMs:collectedMs,compileMs:Date.now()-started-collectedMs,...compiled,elapsedMs:Date.now()-started};
    if(arg('--out'))fs.writeFileSync(arg('--out'),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report));
    if(compiled.failed)process.exitCode=1;
  }finally{await browser.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await main();
