// Warm the same preview/print renderer used by Studio; never save source content.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {inspectPrintedPdf} from './pdf-layout-qa.mjs';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {openBookletProject} from './project-studio-server.mjs';
import {publishBrowserDiagrams,rendererFingerprint} from './render-cache-server.mjs';
const arg=(name,fallback)=>process.argv.includes(name)?process.argv[process.argv.indexOf(name)+1]:fallback;
const base=arg('--base','http://127.0.0.1:5173'),out=arg('--out','.booklet-work/studio-load/warm');
const ids=arg('--projects',fs.readdirSync('booklets/projects').filter(f=>f.endsWith('.json')).map(f=>f.slice(0,-5)).join(',')).split(',');
const editions=arg('--editions','student,short,worked,with-short,with-worked').split(',');
const comparison=arg('--compare',null)?JSON.parse(fs.readFileSync(arg('--compare'))):null;
const review=process.argv.includes('--review'),report={started:new Date().toISOString(),renderer:await rendererFingerprint(),projects:[]};
fs.mkdirSync(out,{recursive:true});
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
try{for(const id of ids){
  const raw=fs.readFileSync('booklets/projects/'+id+'.json'),opened=await openBookletProject(id),project=opened.project;
  const entry={id,revision:project.revision,hash:createHash('sha256').update(raw).digest('hex'),editions:[],errors:[]};report.projects.push(entry);
  const context=await browser.newContext({viewport:{width:1600,height:1200}}),page=await context.newPage();
  if(process.argv.includes('--measurements-off'))await context.addInitScript(()=>window.__bookletCacheMode='measurements-off');
  page.on('pageerror',error=>{entry.errors.push(error.message);console.error(id+': '+error.message);});
  await page.route('**/__booklet/**',route=>{const req=route.request(),url=new URL(req.url());if(req.method()!=='GET')return route.abort();if(url.pathname==='/__booklet/projects')return route.fulfill({json:[{id,title:project.title}]});if(url.pathname===`/__booklet/projects/${id}/open`)return route.fulfill({json:opened});if(url.pathname===`/__booklet/projects/${id}`)return route.fulfill({json:project});if(url.pathname.endsWith('/bank-sync'))return route.fulfill({json:opened.bankSync});return route.continue();});
  console.log(id+': opening');
  await page.goto(base+'/#/booklet?stage=projects&project='+id,{waitUntil:'domcontentloaded'});
  console.log(id+': application requested');
  const ready=edition=>page.waitForFunction(edition=>{const d=document.querySelector('.flow-document');return d?.dataset.paginationState==='error'||d?.dataset.paginationState==='ready'&&(!edition||d.dataset.paginatedEdition===edition);},edition,{timeout:600000});
  const timer=setInterval(async()=>{try{console.log(id+': '+await page.locator('.loading-card,.flow-document > [role="status"]').first().innerText({timeout:500}));}catch{console.log(id+': waiting for application; '+(await page.locator('body').innerText().catch(()=>'' )).slice(0,250));}},30000);
  try{
    await ready(null);
    for(const edition of editions){
      const started=Date.now();await page.getByLabel('Booklet edition',{exact:true}).selectOption(edition);await ready(edition);
      if(await page.locator('.flow-document').getAttribute('data-pagination-state')==='error')throw Error(await page.locator('.flow-document').innerText());
      await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));
      await page.locator('.project-print .print-page').first().waitFor({state:'attached'});await page.emulateMedia({media:'print'});
      const qa=await page.evaluate(async()=>{const {settleBooklet,inspectBooklet}=await import('/src/lib/booklet-qa.js');const root=document.querySelector('.project-print');await settleBooklet(root);return inspectBooklet(root,{style:true});});
      const pages=await page.locator('.project-print .print-page').count();
      const structure=await page.locator('.project-print').evaluate(root=>({pages:[...root.querySelectorAll('.print-page')].map(p=>({blocks:p.dataset.flowBlocks,text:p.innerText,links:[...p.querySelectorAll('a')].map(a=>[a.id,a.getAttribute('href')])})),missingLinks:[...root.querySelectorAll('a[href^="#"]')].filter(a=>a.getClientRects().length&&!root.querySelector('[id="'+CSS.escape(a.hash.slice(1))+'"]')).map(a=>a.hash)}));
      const contentHash=createHash('sha256').update(JSON.stringify(structure)).digest('hex');
      if(comparison){const expected=comparison.projects.find(p=>p.id===id)?.editions.find(e=>e.edition===edition);assert.equal(contentHash,expected?.contentHash,'Cached and bypassed pagination/content/navigation must match');}
      const publication=await publishBrowserDiagrams(page);
      const data={edition,pages,contentHash,missingLinks:structure.missingLinks,publication,qa,elapsedMs:Date.now()-started,metrics:await page.locator('.flow-document').getAttribute('data-pagination-metrics')};
      if(review){
        const folder=path.join(out,id,edition);fs.mkdirSync(folder,{recursive:true});
        await page.pdf({path:folder+'.pdf',format:'A4',printBackground:true,preferCSSPageSize:true,margin:{top:0,bottom:0,left:0,right:0}});
        data.printed=inspectPrintedPdf(folder+'.pdf');
        const images=spawnSync('pdftoppm',['-jpeg','-jpegopt','quality=85','-scale-to','1400',folder+'.pdf',path.join(folder,'page')],{windowsHide:true,encoding:'utf8',maxBuffer:1024*1024});if(images.status!==0)throw Error(images.error?.message??images.stderr);
      }
      entry.editions.push(data);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(`${id} ${edition}: ${pages} pages, ${publication.published} cached diagrams, ${qa.filter(p=>p.issues.length).length} pages with QA findings`);
      await page.emulateMedia({media:'screen'});
    }
    if(createHash('sha256').update(fs.readFileSync('booklets/projects/'+id+'.json')).digest('hex')!==entry.hash)throw Error(id+' changed during warming');
    if(entry.errors.length)throw Error(entry.errors.join('\n'));
  }finally{clearInterval(timer);await context.close();}
}}finally{await browser.close();report.finished=new Date().toISOString();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));}
