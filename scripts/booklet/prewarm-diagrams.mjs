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
    await page.addInitScript(()=>{window.__tikzSources=new Set();});
    await page.route(/\/src\/lib\/tikz\.js(?:\?|$)/,async route=>{const response=await route.fetch();await route.fulfill({response,body:collectorSource(await response.text())});});
    const record=structuredClone(project);await routeCandidateProject(page,record);
    for(const edition of editions){
      record.settings.flowEdition=edition;
      await page.goto('about:blank');
      await page.goto(base+'/#/booklet?stage=projects&project='+encodeURIComponent(record.id),{waitUntil:'domcontentloaded',timeout:180000});
      await page.getByLabel('Booklet edition',{exact:true}).waitFor({state:'visible',timeout:600000});
      await ready(page,edition);
      await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));
      await page.locator('.project-print .print-page').first().waitFor({state:'attached'});
      await page.emulateMedia({media:'print'});
      await page.evaluate(async()=>{const {settleBooklet}=await import('/src/lib/booklet-qa.js');await settleBooklet(document.querySelector('.project-print'));});
      for(const code of await page.evaluate(()=>[...window.__tikzSources]))sources.add(code);
      await page.emulateMedia({media:'screen'});
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

async function main(){
  const arg=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
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
