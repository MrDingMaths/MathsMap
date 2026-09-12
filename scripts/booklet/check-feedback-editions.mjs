// Full, read-only edition export with actual PDF geometry and page images.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {chromium} from 'playwright-core';
import {inspectPrintedPdf} from './pdf-layout-qa.mjs';
import {rendererSignature} from './verification-cache.mjs';
const arg=(k,d)=>{const i=process.argv.indexOf(k);return i<0?d:process.argv[i+1];};
const out=arg('--out','.booklet-work/volume-r198/editions'),base=arg('--base','http://localhost:5173');
const projects=arg('--projects','volume-v1,non-right-angled-trigonometry-v1,linear-relationships-v1,index-laws-complete-v1').split(',');
const editions=arg('--editions','student,short,worked,with-short,with-worked').split(',');
fs.mkdirSync(out,{recursive:true});const start=Date.now(),report={started:new Date().toISOString(),renderer:rendererSignature(),projects:[]};
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
try{for(const id of projects){
 const raw=fs.readFileSync('booklets/projects/'+id+'.json'),project=JSON.parse(raw),dir=out+'/'+id;fs.mkdirSync(dir,{recursive:true});
 const result={id,revision:project.revision,hash:createHash('sha256').update(raw).digest('hex'),editions:[],errors:[]};report.projects.push(result);
 const cache='.booklet-work/purposeful-shading/settled-'+id+'/cache.json';
 const context=await browser.newContext({viewport:{width:1600,height:1200},...(fs.existsSync(cache)?{storageState:cache}:{})}),page=await context.newPage();page.setDefaultTimeout(60000);
 page.on('pageerror',e=>result.errors.push(e.message));
 await page.route('**/__booklet/**',r=>{const p=new URL(r.request().url()).pathname;if(p==='/__booklet/projects')return r.fulfill({json:[project]});if(p==='/__booklet/projects/'+id)return r.fulfill({json:project});if(p.endsWith('/bank-sync'))return r.fulfill({json:{items:[]}});if(r.request().method()!=='GET')return r.abort();return r.continue();});
 await page.goto(base+'/#/booklet?stage=projects&project='+id,{waitUntil:'domcontentloaded'});
 const ready=edition=>page.waitForFunction(edition=>{const e=document.querySelector('.flow-document');return e?.dataset.paginationState==='ready'&&(!edition||e.dataset.paginatedEdition===edition);},edition,{timeout:600000});console.log(id+': loading cached diagrams');await ready(null);console.log(id+': loaded');
 for(const edition of editions){
  const began=Date.now();console.log(id+': '+edition+' pagination');await page.getByLabel('Booklet edition',{exact:true}).selectOption(edition);await ready(edition);
  await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));await page.waitForFunction(edition=>{const p=document.querySelector('.project-print'),f=document.querySelector('.flow-document');return p?.dataset.paginationState==='ready'&&p.dataset.flowEdition===edition&&p.querySelectorAll('.print-page').length===f.querySelectorAll('.flow-page-group').length&&p.querySelectorAll('.print-page').length>0;},edition,{timeout:600000});await page.emulateMedia({media:'print'});
  const qa=await page.evaluate(async()=>{const {settleBooklet,inspectBooklet}=await import('/src/lib/booklet-qa.js');const root=document.querySelector('.project-print');await settleBooklet(root);return inspectBooklet(root,{style:true});});
  const details=await page.locator('.project-print').evaluate(root=>({
   missingLinks:[...root.querySelectorAll('a[href^="#"]')].filter(a=>a.getClientRects().length&&!root.querySelector(`[id="${CSS.escape(a.hash.slice(1))}"]`)).map(a=>a.hash),
   headings:[...root.querySelectorAll('.exercise-heading')].map(h=>({text:h.textContent,size:getComputedStyle(h).fontSize,weight:getComputedStyle(h).fontWeight,transform:getComputedStyle(h).textTransform,alignment:getComputedStyle(h).justifyContent})),
   difficultyLeak:[...root.querySelectorAll('.content-block')].some(el=>/^FOUNDATION$/i.test(el.textContent.trim())),
   pages:[...root.querySelectorAll('.print-page')].map((p,i)=>({page:i+1,blocks:[...p.querySelectorAll('[data-arrangement-block]')].map(b=>b.dataset.arrangementBlock)})),
   p16:['a','b','c'].map(letter=>{const p=root.querySelector(`[data-arrangement-id="p16-q1-${letter}:question"]`),d=p?.querySelector('.arr-diagram'),t=p?.querySelector('table');return d&&t?{letter,diagramBottom:d.getBoundingClientRect().bottom,tableTop:t.getBoundingClientRect().top,gapMm:(t.getBoundingClientRect().top-d.getBoundingClientRect().bottom)*25.4/96}:null;}).filter(Boolean),
   p20:['a','b','c'].map(letter=>{const p=root.querySelector(`[data-edit-root="p20-q1-${letter}"]`);return p?{letter,latex:p.textContent}:null;}).filter(Boolean)
  }));
  assert.ok(qa.every(p=>!p.issues.length),'DOM layout/style findings');
  assert.equal(details.difficultyLeak,false,'Printable difficulty label');assert.equal(details.missingLinks.length,0,'Broken internal navigation');
  assert.equal(new Set(details.headings.map(h=>h.text.trim())).size,details.headings.length,'Repeated exercise heading');
  for(const h of details.headings){assert.ok(Math.abs(parseFloat(h.size)*.75-13)<.1,'Exercise font size');assert.equal(h.weight,'700');assert.equal(h.transform,'uppercase');assert.equal(h.alignment,'flex-end');}
  const pdf=dir+'/'+edition+'.pdf';await page.pdf({path:pdf,format:'A4',printBackground:true,preferCSSPageSize:true,margin:{top:0,bottom:0,left:0,right:0}});
  const pdfGeometry=inspectPrintedPdf(pdf);if(!details.pages.length||details.pages.length!==pdfGeometry.length)throw Error('The print surface changed during export; repeat only this edition.');assert.ok(pdfGeometry.every(p=>!p.issues.length),'Actual PDF geometry findings');const imageDir=dir+'/'+edition;fs.mkdirSync(imageDir,{recursive:true});
  const rendered=spawnSync('pdftoppm',['-scale-to','1100','-png',pdf,imageDir+'/page'],{windowsHide:true,encoding:'utf8',maxBuffer:1024*1024});if(rendered.status!==0)throw Error(rendered.stderr||rendered.error);
  result.editions.push({edition,qa,...details,pdfGeometry,elapsedMs:Date.now()-began});fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(id+' '+edition+': '+pdfGeometry.length+' pages; '+details.missingLinks.length+' missing links; '+pdfGeometry.filter(p=>p.issues.length).length+' PDF geometry findings');
  await page.emulateMedia({media:'screen'});
 }
 await context.close();
}assert.equal(rendererSignature(),report.renderer,'Renderer changed during export; reuse only after current-runtime verification');}finally{report.finished=new Date().toISOString();report.elapsedMs=Date.now()-start;fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close();}
