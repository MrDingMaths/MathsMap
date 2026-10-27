// Compile and publish diagrams only: open each booklet read-only in headless
// Studio (pagination renders every diagram), then publish the browser's compiled
// SVGs to the server cache so the user's browser fetches instead of compiling.
// node scripts/booklet/warm-diagrams.mjs [--projects a,b | --recent 12] [--concurrency 3] [--editions student,with-worked]
import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {publishBrowserDiagrams,diagramFingerprint} from './render-cache-server.mjs';
import {listBookletProjects} from './project-studio-server.mjs';
const arg=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const base=arg('--base','http://127.0.0.1:5173'),concurrency=Math.max(1,Number(arg('--concurrency','3')));
const editions=arg('--editions','student,with-worked').split(',');
const listed=(await listBookletProjects({summary:true})).filter(p=>!p.library?.archivedAt);
const ids=arg('--projects',null)?.split(',')??listed.slice(0,Number(arg('--recent','12'))).map(p=>p.id);
const version=await diagramFingerprint(),started=Date.now(),results=[];
console.log(`Warming ${ids.length} booklets for diagram version ${version.slice(0,12)}, ${concurrency} at a time`);
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
async function warm(id){
  const context=await browser.newContext({viewport:{width:1600,height:1200}}),page=await context.newPage(),start=Date.now(),result={id,published:0,errors:[]};
  page.on('pageerror',e=>result.errors.push(e.message));
  // Read-only: no write reaches the server.
  await page.route('**/__booklet/**',route=>route.request().method()==='GET'?route.fallback():route.abort('blockedbyclient'));
  const ready=edition=>page.waitForFunction(edition=>{const d=document.querySelector('.flow-document');return d?.dataset.paginationState==='error'||d?.dataset.paginationState==='ready'&&!document.querySelector('.workspace-loading')&&(!edition||d.dataset.paginatedEdition===edition);},edition,{timeout:1800000});
  try{
    await page.goto(base+'/#/booklet?stage=projects&project='+encodeURIComponent(id),{waitUntil:'domcontentloaded'});await ready(null);
    for(const edition of editions){
      if(await page.getByLabel('Booklet edition',{exact:true}).inputValue()!==edition){await page.getByLabel('Booklet edition',{exact:true}).selectOption(edition);await ready(edition);}
      result.published+=(await publishBrowserDiagrams(page)).published??0;
    }
  }catch(e){result.failure=e.message;}
  finally{await context.close();}
  result.seconds=Math.round((Date.now()-start)/1000);results.push(result);
  console.log(JSON.stringify({id,published:result.published,seconds:result.seconds,failure:result.failure,errors:result.errors.length}));
}
try{
  const queue=[...ids];
  await Promise.all(Array.from({length:Math.min(concurrency,queue.length)},async()=>{while(queue.length)await warm(queue.shift());}));
}finally{await browser.close();}
if(await diagramFingerprint()!==version)console.log('Diagram inputs changed during warming; rerun after they settle.');
fs.mkdirSync('.booklet-work/studio-load',{recursive:true});
fs.writeFileSync('.booklet-work/studio-load/warm-diagrams.json',JSON.stringify({version,seconds:Math.round((Date.now()-started)/1000),results},null,2));
console.log(`Done in ${Math.round((Date.now()-started)/1000)} s`);
