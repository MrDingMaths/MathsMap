// Read-only browser/PDF acceptance check. Generated evidence stays local.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {inspectPrintedPdf} from './pdf-layout-qa.mjs';
import {isPractice} from '../../src/lib/booklet-flow.js';
import {spawnSync} from 'node:child_process';
const arg=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const out=arg('--out','.booklet-work/compact-exercises'),base=arg('--base','http://127.0.0.1:5173');
const editions=arg('--editions','student,short,worked,with-short,with-worked').split(',');
const projects=arg('--projects','baseline,trial').split(',');
fs.mkdirSync(out,{recursive:true});
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const cache=fs.existsSync(out+'/cache.json')?out+'/cache.json':'.booklet-work/flexible-check/cache.json';
const context=await browser.newContext({viewport:{width:1600,height:1100},...(fs.existsSync(cache)?{storageState:cache}:{})});
const page=await context.newPage(),errors=[],report=fs.existsSync(out+'/report.json')?JSON.parse(fs.readFileSync(out+'/report.json')).report:{};page.on('pageerror',e=>errors.push(e.message));
await page.route('**/__booklet/**',r=>r.request().method()==='GET'?r.fallback():r.abort());
await page.route('**/__booklet/bank/manifest',r=>r.fulfill({json:{format:'mathsmap-practice-bank-v3',version:3,questions:[]}}));
const ready=async edition=>{
  const deadline=Date.now()+600000;let nextLog=Date.now();
  while(Date.now()<deadline){
    if(await page.getByLabel('Booklet edition',{exact:true}).inputValue()!==edition)await page.getByLabel('Booklet edition',{exact:true}).selectOption(edition);
    const state=await page.locator('.flow-document').evaluate(el=>({state:el.dataset.paginationState,edition:el.dataset.paginatedEdition,status:el.querySelector('[role=status]')?.textContent,error:el.querySelector('[role=alert]')?.textContent}));
    if(state.state==='error')throw Error(state.error);
    if(state.state==='ready'&&state.edition===edition)return;
    if(Date.now()>nextLog){console.log(edition+': '+(state.status??state.state));nextLog=Date.now()+15000;}
    await page.waitForTimeout(200);
  }
  throw Error('Pagination timed out');
};
try{
 for(const kind of projects){
  const id=kind==='baseline'?'linear-relationships-flexible-v1':'linear-relationships-compact-exercises-v1';
  const record=JSON.parse(fs.readFileSync(`booklets/projects/${id}.json`));record.settings.flowEdition=editions[0];
  await page.route('**/__booklet/projects/'+id,r=>r.fulfill({json:record}));
  await page.goto(base+'/#/booklet?stage=projects&project='+id,{waitUntil:'domcontentloaded'});
  await page.locator('.flow-document').waitFor({state:'attached'});
  const leaves=[];const visit=n=>n.children?.length?n.children.forEach(visit):leaves.push(n.id);
  record.sections.flatMap(s=>s.blocks).filter(isPractice).forEach(b=>visit(b.content));
  report[kind]??={};
  for(const edition of editions){
   console.log(`Checking ${kind} ${edition}`);
   await page.getByLabel('Booklet edition',{exact:true}).selectOption(edition);await ready(edition);
   await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));
   await page.locator('.project-print .print-page').first().waitFor({state:'attached'});
   await page.emulateMedia({media:'print'});
   const qa=await page.evaluate(async()=>{const {settleBooklet,inspectBooklet}=await import('/src/lib/booklet-qa.js');const root=document.querySelector('.project-print');await settleBooklet(root);return inspectBooklet(root,{style:true});});
   const info=await page.locator('.project-print').evaluate(root=>({
     pages:root.querySelectorAll('.print-page').length,
     labels:[...root.querySelectorAll('.answer-item')].map(e=>({id:e.dataset.nodeId,label:e.querySelector('.answer-label')?.textContent})),
     badges:root.querySelectorAll('[data-editor-difficulty]').length,
     columns:[...root.querySelectorAll('.answer-columns')].map(e=>getComputedStyle(e).gridTemplateColumns),
     fonts:[...new Set([...root.querySelectorAll('.compact-answer')].map(e=>getComputedStyle(e).fontSize))],
     columnOverflow:[...root.querySelectorAll('.answer-column .katex-html > .base,.answer-column table')].filter(e=>{const r=e.getBoundingClientRect(),c=e.closest('.answer-column').getBoundingClientRect();return r.left<c.left-.5||r.right>c.right+.5;}).map(e=>({text:e.textContent,id:e.closest('[data-node-id]')?.dataset.nodeId})),
     links:[...root.querySelectorAll('a[href^="#"]')].map(a=>({href:a.getAttribute('href'),exists:!!root.querySelector(`[id="${CSS.escape(a.getAttribute('href').slice(1))}"]`)})),
     map:[...root.querySelectorAll('.print-page')].map(e=>({page:Number(e.dataset.flowPage),blocks:e.dataset.flowBlocks.split(',')}))
   }));
   const file=`${out}/${kind}-${edition}.pdf`;
   await page.pdf({path:file,format:'A4',printBackground:true,preferCSSPageSize:true,margin:{top:0,bottom:0,left:0,right:0}});
   const printed=inspectPrintedPdf(file),issues=qa.flatMap(p=>p.issues.map(i=>({page:p.page,...i})));
   const linkCheck=spawnSync('pdftohtml',['-i','-stdout',file],{encoding:'utf8',maxBuffer:32*1024*1024,windowsHide:true});
   assert.equal(linkCheck.status,0);assert.doesNotMatch(linkCheck.stderr,/Bad named destination|failed to look up/i);
   const pdfLinks=(linkCheck.stdout.match(/href="[^"\n]*#\d+"/g)??[]).length;
   if(info.links.length)assert.ok(pdfLinks>=info.links.length,'PDF retains every internal link');
   report[kind][edition]={...info,pdfLinks,qa,printed,issues};
   fs.writeFileSync(out+'/report.json',JSON.stringify({report,errors},null,2));
   await context.storageState({path:out+'/cache.json',indexedDB:true});
   console.log(`${kind} ${edition}: ${info.pages} pages, ${issues.length} DOM issues, ${printed.flatMap(p=>p.issues).length} print issues`);
   assert.equal(info.pages,printed.length);assert.equal(info.badges,0);
   assert.deepEqual(info.columnOverflow,[],'Answer content fits its column');
   if(edition!=='student')assert.deepEqual(info.labels.map(l=>l.id).sort(),[...leaves].sort(),'Every answer leaf appears exactly once');
   assert.ok(info.links.every(l=>l.exists),'All printed references have destinations');
   await page.emulateMedia({media:'screen'});
  }
 }
 assert.deepEqual(errors,[]);
 assert.deepEqual(Object.values(report).flatMap(p=>Object.values(p).flatMap(e=>e.issues)),[],'DOM layout/style checks');
 assert.deepEqual(Object.values(report).flatMap(p=>Object.values(p).flatMap(e=>e.printed.flatMap(p=>p.issues))),[],'Printed geometry');
 console.log('Compact exercise verification passed.');
}finally{await context.storageState({path:out+'/cache.json',indexedDB:true}).catch(()=>{});await browser.close();}
