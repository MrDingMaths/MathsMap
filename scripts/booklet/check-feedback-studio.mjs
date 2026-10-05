// Studio checks that respect page virtualization. Studio mounts only pages near
// the viewport and fills the hidden print section only after print preparation,
// so absent content must never be read as missing content. Saves stay in memory.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {chromium} from 'playwright-core';
import {trackProcessPhase} from './run-observability.mjs';

const pageGroup=n=>`.flow-page-group[data-page-number="${n}"]`;
export async function waitForStudio(page,{timeout=600000}={}){
 await page.waitForFunction(()=>{const el=document.querySelector('.flow-document');if(el?.dataset.paginationState==='error')throw Error(el.querySelector('[role=alert]')?.textContent||'Pagination failed');return !document.querySelector('.workspace-loading')&&el?.dataset.paginationState==='ready';},null,{timeout});
}
// Scroll a physical page into view and wait until its real content replaces the placeholder.
export async function mountStudioPage(page,number,{timeout=60000}={}){
 const group=page.locator(pageGroup(number));
 if(!await group.count())throw Error('Studio has no page '+number);
 await group.evaluate(el=>el.scrollIntoView({block:'start'}));
 await group.locator('.flow-page-content').waitFor({state:'attached',timeout});
 await page.waitForFunction(selector=>{const el=document.querySelector(selector);return el&&!el.querySelector('.page-placeholder')&&el.querySelector('.flow-page-content')?.textContent.trim().length>0;},pageGroup(number),{timeout});
 return group;
}
// Pages that hold a block, from the page map rather than from mounted DOM.
export async function studioPagesForBlock(page,blockId){
 return page.locator('.flow-page-group').evaluateAll((groups,id)=>groups.filter(group=>JSON.parse(group.dataset.flowBlocks||'[]').some(entry=>entry[0]===id)).map(group=>Number(group.dataset.pageNumber)),blockId);
}
export async function mountStudioBlock(page,blockId,options){
 const pages=await studioPagesForBlock(page,blockId);
 if(!pages.length)throw Error('Block is not on any Studio page: '+blockId);
 for(const number of pages)await mountStudioPage(page,number,options);
 return pages;
}
// The print section is empty until this event has been handled.
export async function prepareStudioPrint(page,{timeout=600000}={}){
 await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));
 await page.locator('.project-print .print-page').first().waitFor({state:'attached',timeout});
 return page.locator('.project-print .print-page').count();
}
// Structure that a reader or editor depends on, independent of mount order.
export async function snapshotStudioBlock(page,blockId){
 const pages=await studioPagesForBlock(page,blockId),parts=[];
 if(!pages.length)throw Error('Block is not on any Studio page: '+blockId);
 for(const number of pages){
  // Mount and read one page at a time: scrolling to the next unmounts this one.
  await mountStudioPage(page,number);
  await page.waitForFunction(selector=>{const status=document.querySelector(selector)?.querySelector('.page-space-status');return status&&!status.textContent.includes('Updating');},pageGroup(number),{timeout:60000});
  const space=await page.locator(pageGroup(number)).evaluate(async group=>{
   const {measureBookletPage}=await import('/src/lib/booklet-page-space.js');
   const value=measureBookletPage(group);
   return value?{page:Number(group.dataset.pageNumber),remainingMm:Math.round(value.remainingMm*1000)/1000,columns:value.columns.map(mm=>Math.round(mm*1000)/1000)}:null;
  });
  const part=await page.locator(pageGroup(number)).evaluate((group,id)=>{
   const name=CSS.escape(id),matches=[...group.querySelectorAll(`[data-content-owner="${name}"],[data-arrangement-block="${name}"],[data-question-id="${name}"],[data-edit-root="${name}"],[data-edit-root^="${name}-"]`)],roots=matches.filter(el=>!matches.some(other=>other!==el&&other.contains(el)));
   if(!roots.length)return {found:false};
   const visible=el=>el.getClientRects().length>0,root={innerText:roots.map(el=>el.innerText).join('\n'),querySelectorAll:selector=>roots.flatMap(el=>[...el.querySelectorAll(selector)])};
   return {found:true,
    text:root.innerText.replace(/\s+/g,' ').trim(),
    tables:[...root.querySelectorAll('table')].filter(visible).map(table=>{const rows=[...table.rows],first=rows[0]?.cells[0];return {id:table.dataset.id??table.id??null,rows:rows.length,columns:rows.map(row=>row.cells.length),bordered:!!first&&parseFloat(getComputedStyle(first).borderTopWidth)>0,clozes:table.querySelectorAll('[data-cloze]').length,clozeLeaders:[...new Set([...table.querySelectorAll('[data-cloze]')].map(el=>el.dataset.clozeLeader??getComputedStyle(el).borderBottomStyle))]};}),
    clozes:[...root.querySelectorAll('[data-cloze]')].filter(visible).length,
    diagrams:[...root.querySelectorAll('[data-diagram-id]')].filter(visible).map(el=>el.dataset.diagramId),
    editors:root.querySelectorAll(".editable-booklet-text").length};
  },blockId);
  parts.push({...part,pageSpace:space});
 }
 return {blockId,pages,parts};
}

async function main(){
 const args=process.argv.slice(2),arg=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
 const candidateFile=arg('--project-file')??(()=>{throw Error('--project-file FILE is required');})(),out=path.resolve(arg('--out')??(()=>{throw Error('--out DIRECTORY is required');})());
 const blocks=(arg('--blocks','')).split(',').filter(Boolean),base=arg('--base','http://127.0.0.1:5173').replace(/\/$/,'');
 if(!blocks.length)throw Error('--blocks ID[,ID] names the changed blocks to verify');
 fs.mkdirSync(out,{recursive:true});
 const reportFile=path.join(out,'studio-reopen.json');trackProcessPhase(arg('--run-dir'),'feedback-studio',{artifact:reportFile,blocks});
 let record=JSON.parse(fs.readFileSync(candidateFile,'utf8').replace(/^﻿/,''));const id=record.id,started=Date.now(),writes=[],blocked=[],errors=[];
 let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
 const report={tool:'check-feedback-studio',startedAt:new Date(started).toISOString(),projectId:id,revision:record.revision,blocks:[],failures:[],note:'Opens the candidate with in-memory saves, mounts each named block before reading it, reopens and compares. No edit is made; editing behaviour needs its own interaction check.'};
 try{
  const context=await browser.newContext({viewport:{width:1600,height:1000}}),page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await context.route('**/__booklet/**',route=>{
   const request=route.request(),url=new URL(request.url()),method=request.method();
   if(url.pathname==='/__booklet/bank/manifest')return route.fulfill({json:{format:'mathsmap-practice-bank-v3',version:3,questions:[]}});
   if(url.pathname==='/__booklet/projects'&&method==='GET')return route.fulfill({json:[{id,title:record.title,revision:record.revision}]});
   if(url.pathname===`/__booklet/projects/${id}/open`&&method==='GET')return route.fulfill({json:{project:record,bankSync:{items:[]},bankSyncError:''}});
   if(url.pathname.endsWith('/bank-sync')&&method==='GET')return route.fulfill({json:{items:[]}});
   if(url.pathname===`/__booklet/projects/${id}`){
    if(method==='GET')return route.fulfill({json:record});
    if(method==='PUT'){const body=request.postDataJSON();if(body.expectedRevision!==record.revision)return route.fulfill({status:409,json:{error:'Another session saved this project.'}});record={...body.project,revision:record.revision+1};writes.push({revision:record.revision});return route.fulfill({json:record});}
   }
   if(method!=='GET'){blocked.push({method,path:url.pathname});return route.abort();}
   return route.fallback();
  });
  const open=async()=>{await page.goto('about:blank');await page.goto(base+'/#/booklet?stage=projects&project='+id,{waitUntil:'domcontentloaded',timeout:180000});await page.locator('.flow-document').waitFor({state:'attached',timeout:600000});await waitForStudio(page);};
  await open();
  report.virtualised=await page.locator('.page-placeholder').count()>0;
  const first=[];for(const block of blocks)first.push(await snapshotStudioBlock(page,block));
  report.printPages=await prepareStudioPrint(page);
  await open();
  for(const [i,block]of blocks.entries()){
   const again=await snapshotStudioBlock(page,block),same=isDeepStrictEqual(first[i],again),found=first[i].parts.every(part=>part.found);
   report.blocks.push({...first[i],stableAfterReopen:same});
   if(!found)report.failures.push({block,kind:'not-rendered'});
   for(const part of first[i].parts)if(part.pageSpace?.remainingMm<-.2*25.4/96)report.failures.push({block,kind:'studio-page-overflow',...part.pageSpace});
   if(!same)report.failures.push({block,kind:'changed-after-reopen'});
  }
  report.saveState=await page.locator('.save-state').first().textContent().catch(()=>null);
  report.writes=writes;report.blockedMutations=blocked;
  // Opening an accepted project must not rewrite it.
  if(writes.length)report.failures.push({kind:'unrequested-save',writes});
  if(errors.length)report.failures.push({kind:'browser-errors',errors});
 }finally{report.passed=!report.failures.length;report.elapsedMs=Date.now()-started;fs.writeFileSync(reportFile,JSON.stringify(report,null,2));await browser.close();}
 console.log(JSON.stringify({report:reportFile,passed:report.passed,elapsedMs:report.elapsedMs,virtualised:report.virtualised,blocks:report.blocks.map(b=>({id:b.blockId,pages:b.pages,tables:b.parts.flatMap(p=>p.tables??[]).map(t=>`${t.rows}x${t.columns[0]}${t.bordered?' bordered':''} clozes:${t.clozes}`),clozes:b.parts.reduce((n,p)=>n+(p.clozes??0),0)})),failures:report.failures}));
 if(!report.passed)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await main();
