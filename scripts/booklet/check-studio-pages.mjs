// Exercises Studio against in-memory projects; never saves accepted booklet files.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createEditableProject} from '../../src/lib/editable-booklet-model.js';
import {fromSource} from '../../src/lib/document-content.js';
const out='.booklet-work/studio-a4-loading';fs.mkdirSync(out,{recursive:true});
const make=(id,title,count=1)=>createEditableProject({id,title,settings:{paginationMode:'flexible',generatedCover:false},sections:Array.from({length:count},(_,i)=>({id:id+'-s'+i,title:'Page '+(i+1),blocks:[{id:id+'-b'+i,type:'rich-text',content:fromSource('A short paragraph with room to write below.')}]}))});
const records={a:make('a','Sparse A4 booklet',12),b:make('b','Second booklet'),c:make('c','Retry booklet'),fixed:make('fixed','Fixed pages',2)};
records.fixed.settings.paginationMode='source';records.fixed.settings.preserveSourcePages=true;
for(const p of Object.values(records))p.revision=1;
let failC=true,delayA=0,delayB=0,failSave=false,writes=0;
const errors=[],started=Date.now(),checks=[];
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const page=await browser.newPage({viewport:{width:1450,height:1050}});page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR',e.message);});
const addCheck=message=>{checks.push(message);console.log('PASS',message);};
await page.addInitScript(()=>{
 window.bookletLoadStages=[];
 const observer=new MutationObserver(()=>{
  const status=document.querySelector('.workspace-loading [role=status]'),bar=document.querySelector('.workspace-loading progress');
  if(status&&window.bookletLoadStages.at(-1)?.text!==status.textContent)window.bookletLoadStages.push({text:status.textContent,determinate:bar?.hasAttribute('value')??false,value:bar?.value,max:bar?.max});
 });observer.observe(document,{childList:true,subtree:true,characterData:true});
});
await page.route('**/__booklet/**',async route=>{
 const req=route.request(),url=new URL(req.url()),path=url.pathname;
 if(path==='/__booklet/projects'){await new Promise(r=>setTimeout(r,250));return route.fulfill({json:Object.values(records).map(p=>({id:p.id,title:p.title,revision:p.revision}))});}
 if(path.endsWith('/bank-sync'))return route.fulfill({json:{items:[]}});
 const id=path.split('/').at(-1);
 if(records[id]){
  if(req.method()==='PUT'){if(failSave)return route.fulfill({status:503,json:{error:'Simulated save failure'}});records[id]={...req.postDataJSON().project,revision:records[id].revision+1};writes++;}
  if(id==='a'&&delayA)await new Promise(r=>setTimeout(r,delayA));
  if(id==='b'&&delayB)await new Promise(r=>setTimeout(r,delayB));
  if(id==='c'&&failC)return route.fulfill({status:503,json:{error:'Simulated load failure'}});
  return route.fulfill({json:records[id]});
 }
 return route.fulfill({json:path.endsWith('/manifest')?{questions:[]}:[]});
});
const ready=()=>page.waitForFunction(()=>!document.querySelector('.workspace-loading')&&document.querySelector('.flow-document[data-pagination-state="ready"]'),{},{timeout:90000});
const open=async id=>{await page.getByLabel('Open booklet',{exact:true}).selectOption(id);await ready();};
try{
 await page.goto((process.env.BOOKLET_TEST_BASE??'http://127.0.0.1:5175')+'/#/booklet?stage=projects&project=a',{waitUntil:'domcontentloaded'});
 await page.locator('.workspace-loading').waitFor();await ready();addCheck('initial loading through preview readiness');
 await page.waitForFunction(()=>[...document.querySelectorAll('.flow-paper .page-space-status')].some(el=>el.textContent.includes('mm remaining')));
 const dimensions=await page.locator('.flow-paper .booklet-page').first().evaluate(el=>({w:el.offsetWidth,h:el.offsetHeight,text:el.closest('.page-guide-wrapper').querySelector('.page-space-status').textContent}));
 assert.ok(Math.abs(dimensions.w-210*96/25.4)<1);assert.ok(Math.abs(dimensions.h-297*96/25.4)<1);assert.match(dimensions.text,/mm remaining/);
 const before=dimensions.text;
 for(const zoom of ['0.5','0.75','1','width']){
  await page.getByLabel('Booklet zoom',{exact:true}).selectOption(zoom);
  await page.waitForTimeout(100);
  assert.equal(await page.locator('.flow-paper .page-guide-wrapper').filter({has:page.locator('.booklet-page')}).first().locator('.page-space-status').innerText(),before);
 }
 addCheck('A4 dimensions and zoom-independent remaining space');
 await page.getByLabel('Booklet zoom',{exact:true}).selectOption('0.5');await page.locator('.flow-paper .booklet-page').first().scrollIntoViewIfNeeded();await page.screenshot({path:out+'/a4-sheets.png'});await page.getByLabel('Booklet zoom',{exact:true}).selectOption('width');
 const placeholders=page.locator('.page-placeholder');assert.ok(await placeholders.count()>0);
 assert.ok(Math.abs(await placeholders.first().evaluate(el=>el.offsetHeight)-297*96/25.4)<1);
 await page.locator('.project-canvas').evaluate(el=>el.scrollTop=el.scrollHeight);await page.waitForTimeout(150);
 await page.locator('.canvas-heading input[type=number]').fill('1');await page.locator('.canvas-heading input[type=number]').press('Tab');
 addCheck('A4 virtualised placeholders and page navigation');
 delayB=700;await page.getByLabel('Open booklet',{exact:true}).selectOption('b');
 await page.locator('.workspace-loading').waitFor();assert.match(await page.locator('.workspace-loading').innerText(),/Second booklet/);
 assert.equal(await page.locator('.project-editor').evaluate(el=>getComputedStyle(el).visibility),'hidden');
 assert.equal(await page.locator('.project-editor').getAttribute('inert'),'');
 assert.ok(await page.getByLabel('Open booklet',{exact:true}).evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2));}));await page.screenshot({path:out+'/loading.png'});await ready();delayB=0;addCheck('old document hidden and inert while loading');
 delayA=850;await page.getByLabel('Open booklet',{exact:true}).selectOption('a');
 await page.waitForTimeout(100);await page.getByLabel('Open booklet',{exact:true}).selectOption('b');await ready();await page.waitForTimeout(950);
 assert.equal(await page.getByLabel('Open booklet',{exact:true}).inputValue(),'b');assert.equal(await page.locator('.flow-paper [data-edit-root="a-b0"]').count(),0);delayA=0;
 addCheck('rapid selections ignore stale responses');
 await page.getByLabel('Open booklet',{exact:true}).selectOption('c');await page.getByRole('alert').filter({hasText:'Simulated load failure'}).waitFor();
 failC=false;await page.getByRole('button',{name:'Retry',exact:true}).click();await ready();addCheck('load failure and retry');
 await page.locator('.flow-paper [data-edit-root="c-b0"] .clickable').click();await page.locator('maths-editor .me-content').waitFor();
 failSave=true;await page.keyboard.press('End');await page.keyboard.type(' Unsaved writing.');
 await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Save failed');
 await page.getByLabel('Open booklet',{exact:true}).selectOption('b');await page.locator('.workspace-loading [role="alert"]').waitFor();
 assert.match(await page.locator('.workspace-loading').innerText(),/Save failed|save failure|Save failed/i);
 failSave=false;await page.getByRole('button',{name:'Retry',exact:true}).click();await ready();assert.ok(writes>0);
 addCheck('save failure retains edits and retries before switching');
 await page.getByLabel('Open booklet',{exact:true}).selectOption('fixed');
 await page.waitForFunction(()=>!document.querySelector('.workspace-loading')&&document.querySelector('.paper-scroll .page-space-status'));
 await page.getByRole('button',{name:'Toggle page navigation',exact:true}).click();await page.getByRole('button',{name:'Next page',exact:true}).click();
 assert.ok(Math.abs(await page.locator('.paper-scroll .booklet-page').first().evaluate(el=>el.offsetHeight)-297*96/25.4)<1);addCheck('fixed-page A4 guide');
 await page.emulateMedia({media:'print'});assert.equal(await page.locator('.page-space-status').first().evaluate(el=>getComputedStyle(el).display),'none');addCheck('guides excluded from print');
 const loadStages=await page.evaluate(()=>window.bookletLoadStages);assert.ok(loadStages.some(s=>s.text.includes('Paginating')&&s.determinate&&s.max>0));addCheck('real section progress and accessible loading stages');
 assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/browser-report.json',JSON.stringify({passed:true,checks,dimensions,loadStages,errors,durationMs:Date.now()-started},null,2));console.log(JSON.stringify({passed:true,checks,dimensions,durationMs:Date.now()-started}));
}catch(e){await page.screenshot({path:out+'/failure.png'});console.error((await page.locator('body').innerText()).slice(-2200));throw e;}finally{await browser.close();}
