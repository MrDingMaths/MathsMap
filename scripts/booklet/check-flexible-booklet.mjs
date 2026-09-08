// Browser acceptance: writes are intercepted; source booklets and banks are untouched.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {convertToFlexible,flowEditionSections} from '../../src/lib/booklet-flow.js';
import {normalizeEditableProject} from '../../src/lib/editable-booklet-model.js';
import {inspectPrintedPdf} from './pdf-layout-qa.mjs';
import {spawnSync} from 'node:child_process';
const full=process.argv.includes('--full'),out='.booklet-work/flexible-check';fs.mkdirSync(out,{recursive:true});
const question=(id,count=1)=>({id,type:'question',content:{id:id+'-root',type:'question',prompt:'Complete these calculations.',layout:'list',children:Array.from({length:count},(_,i)=>({id:`${id}-${i}`,type:'part',label:String.fromCharCode(97+i),prompt:'Calculate $2x+1$ when $x=3$.',answerSpaceMm:35,answer:{short:'$7$',worked:'$2(3)+1=7$'}}))}});
let record=full?convertToFlexible(JSON.parse(fs.readFileSync('booklets/projects/linear-relationships-complete-v1.json','utf8'))):normalizeEditableProject({id:'flexible-browser',title:'Flexible browser fixture',settings:{paginationMode:'flexible'},topics:[{id:'topic',title:'Linear relationships'}],sections:[{id:'theory',topicId:'topic',phase:'teaching',role:'teaching',title:'Teaching',blocks:[{id:'definition',type:'callout',content:'A linear relationship has a constant rate of change.'}]},{id:'foundation',topicId:'topic',phase:'practice',role:'practice',title:'Foundation',difficulty:'Foundation',blocks:[question('q1',12),question('q2',2)]},{id:'development',topicId:'topic',phase:'practice',role:'practice',title:'Development',difficulty:'Development',blocks:[question('q3',3)]}]});
record.id='flexible-browser';record.revision=1;
if(!full){record.source={runId:'flow-source-fixture'};for(const block of record.sections.flatMap(s=>s.blocks))block.sourcePageNumber=7;}
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const errors=[],writes=[];
try{
 const context=await browser.newContext({viewport:{width:1600,height:1100},...(fs.existsSync(out+'/cache.json')?{storageState:out+'/cache.json'}:{})});
 const page=await context.newPage();page.on('pageerror',e=>{errors.push(e.message);console.log('Browser error: '+e.message);});
 await page.route('**/__booklet/**',async route=>{const req=route.request(),url=new URL(req.url());
  if(url.pathname==='/__booklet/bank/manifest')return route.fulfill({json:{version:3,questions:[]}});
  if(url.pathname.endsWith('/bank-sync'))return route.fulfill({json:{items:[]}});
  if(!full&&url.pathname.includes('/files/evidence/pages/'))return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="794" height="1123"><rect width="794" height="1123" fill="white"/><text x="50" y="70" font-size="24">Original source page 7</text></svg>'});
  if(url.pathname==='/__booklet/projects')return route.fulfill({json:[record]});
  if(url.pathname==='/__booklet/projects/'+record.id){if(req.method()==='PUT'){const body=req.postDataJSON();assert.equal(body.expectedRevision,record.revision);record={...body.project,revision:record.revision+1};writes.push(record.revision);}return route.fulfill({json:record});}
  if(req.method()!=='GET')return route.abort();return route.fallback();
 });
 await page.goto('http://127.0.0.1:5173/#/booklet?stage=projects&project='+record.id,{waitUntil:'domcontentloaded',timeout:60000});
 const ready=async(expected=null)=>{await page.waitForFunction(expected=>{const el=document.querySelector('.flow-document');return el?.dataset.paginationState==='error'||el?.dataset.paginationState==='ready'&&el.dataset.paginatedEdition===(expected??document.querySelector('[aria-label="Booklet edition"]')?.value);},expected,{timeout:600000});const state=await page.locator('.flow-document').getAttribute('data-pagination-state');if(state==='error')throw Error(await page.locator('.flow-document').innerText());};
 await ready();console.log('Initial pagination complete');if(full)await context.storageState({path:out+'/cache.json',indexedDB:true});
 const report={};
 for(const edition of (process.argv.includes('--student-only')?['student']:['student','short','worked','with-short','with-worked'])){
  await page.getByLabel('Booklet edition',{exact:true}).selectOption(edition);await ready(edition);assert.equal(await page.getByLabel('Booklet edition',{exact:true}).inputValue(),edition);
  report[edition]={pages:await page.locator('.page-marker').count(),issues:await page.locator('.layout-issue').allTextContents()};
  await page.screenshot({path:`${out}/${full?'full-':''}${edition}.png`});
  await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));await page.locator('.project-print .print-page').first().waitFor({state:'attached'});
  await page.evaluate(async()=>{const root=document.querySelector('.project-print');root.classList.add('qa-print');const {settleBooklet}=await import('/src/lib/booklet-qa.js');await settleBooklet(root);});
  report[edition].screenSpaces=await page.locator('.project-print [data-arrangement-id$="/space"]').evaluateAll(els=>els.slice(0,6).map(e=>({id:e.dataset.arrangementId,h:e.getBoundingClientRect().height,y:e.getBoundingClientRect().top,child:e.firstElementChild?.getBoundingClientRect().height})));
  report[edition].map=await page.locator('.project-print .print-page').evaluateAll(els=>els.map(e=>({page:e.dataset.flowPage,blocks:e.dataset.flowBlocks})));
  assert.equal(report[edition].map.length,report[edition].pages);
  assert.equal(await page.locator('.project-print .continuation-label').count(),0,'Never add a continued line');
  if(full&&edition==='student'){
   const source=JSON.parse(fs.readFileSync('booklets/projects/linear-relationships-complete-v1.json','utf8'));
   assert.deepEqual(report[edition].map.map(p=>p.blocks.split(',')),source.sections.map(s=>s.blocks.map(b=>b.id)),'Every original page must contain exactly the same blocks');
  }
  report[edition].headings=await page.locator('.project-print .print-page').evaluateAll(els=>els.map(e=>({page:e.dataset.flowPage,headings:[...e.querySelectorAll('.booklet-page > header.section-band')].map(h=>{const clone=h.cloneNode(true);clone.querySelectorAll('.katex').forEach(math=>math.replaceWith('$'+math.querySelector('annotation').textContent.replace(/^\\displaystyle\s*/,'')+'$'));return clone.textContent.trim();})})).filter(e=>e.headings.length));
  const seenTopics=new Set(),expectedHeadings=[];
  for(const section of flowEditionSections(record,edition)){
   if(!section.blocks.some(b=>b.type!=='page-break'))continue;
   const key=JSON.stringify([section.mode,section.topicId??section.sourceSectionId]);
   const cover=section.mode==='student'&&section.phase==='front-matter'&&section.blocks.some(b=>b.sourcePageNumber===1);
   if(!seenTopics.has(key)&&!cover&&section.headingStyle!=='none')expectedHeadings.push(section.title);
   if(section.difficultyTitle&&!(section.headingStyle==='difficulty'&&section.title.trim().toLowerCase()===section.difficultyTitle.trim().toLowerCase()))expectedHeadings.push(section.difficultyTitle);
   seenTopics.add(key);
  }
  assert.deepEqual(report[edition].headings.flatMap(p=>p.headings),expectedHeadings,'Print topic/tier headers must occur only at their starts, with no Teaching header');
  await page.evaluate(()=>document.querySelector('.project-print').classList.remove('qa-print'));
  await page.emulateMedia({media:'print'});report[edition].printSpaces=await page.locator('.project-print [data-arrangement-id$="/space"]').evaluateAll(els=>els.slice(0,6).map(e=>({id:e.dataset.arrangementId,h:e.getBoundingClientRect().height,y:e.getBoundingClientRect().top,child:e.firstElementChild?.getBoundingClientRect().height})));
  const pdf=`${out}/${full?'full-':''}${edition}.pdf`;await page.pdf({path:pdf,format:'A4',printBackground:true,preferCSSPageSize:true,margin:{top:0,bottom:0,left:0,right:0}});await page.emulateMedia({media:'screen'});
  report[edition].printed=inspectPrintedPdf(pdf);assert.equal(report[edition].printed.length,report[edition].pages);
  assert.deepEqual(report[edition].printed.flatMap(p=>p.issues),[],'Printed page geometry must pass');
  const text=spawnSync('pdftotext',[pdf,'-'],{encoding:'utf8',windowsHide:true}).stdout;assert.ok(text.trim().length>100,'PDF must contain rendered content');
  fs.writeFileSync(out+'/'+(full?'full-':'')+'report.json',JSON.stringify({report,errors,writes},null,2));
  console.log(edition+': '+report[edition].pages+' pages; '+report[edition].issues.length+' issues');
 }
 if(!full){
  await page.getByLabel('Booklet edition',{exact:true}).selectOption('student');await ready();
  await page.getByRole('button',{name:/^Question 2/}).first().click();
  await page.keyboard.press('Control+c');await page.getByLabel('Destination section').selectOption('development');await page.getByLabel('Insert before').selectOption('q3');await page.getByRole('button',{name:'Paste here',exact:true}).click();await ready();
  await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');assert.equal(record.sections[2].blocks.length,2);
  await page.getByRole('button',{name:'Undo',exact:true}).click();await ready();await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');assert.equal(record.sections[2].blocks.length,1);
  await page.getByRole('button',{name:/^Question 2/}).first().click();await page.getByRole('button',{name:'Cut',exact:true}).click();await page.getByLabel('Destination section').selectOption('development');await page.getByLabel('Insert before').selectOption('q3');await page.getByRole('button',{name:'Paste here',exact:true}).click();await ready();await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');assert.equal(record.sections[2].blocks[0].id,'q2');
  await page.getByRole('button',{name:/^Question 2/}).first().click();await page.getByRole('button',{name:'Compare source',exact:true}).click();assert.match(await page.locator('.source-evidence img').getAttribute('src'),/page-007/);await page.getByRole('button',{name:'Exit comparison',exact:true}).click();
  const pageCount=await page.locator('.page-marker').count();await page.getByLabel('Booklet zoom',{exact:true}).selectOption('0.75');assert.equal(await page.locator('.page-marker').count(),pageCount);
  await page.setViewportSize({width:390,height:844});await page.getByLabel('Booklet zoom',{exact:true}).selectOption('width');await page.screenshot({path:out+'/mobile.png'});assert.equal(await page.locator('.page-marker').count(),pageCount);await page.setViewportSize({width:1600,height:1100});
  await page.reload({waitUntil:'networkidle'});await ready();assert.equal(await page.locator('.flow-outline').count(),1);
 }
 fs.writeFileSync(out+'/'+(full?'full-':'')+'report.json',JSON.stringify({report,errors,writes},null,2));assert.deepEqual(errors,[]);console.log('Flexible browser check passed');
}catch(e){fs.writeFileSync(out+'/failure.json',JSON.stringify({error:e.stack,errors},null,2));throw e;}finally{await browser.close();}
