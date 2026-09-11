// Profile the complete accepted book through an isolated in-memory save endpoint.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {fieldValue} from '../../src/lib/booklet-document-controller.js';
const original=JSON.parse(fs.readFileSync('booklets/projects/'+(process.env.BOOKLET_PERF_PROJECT??'index-laws-complete-v1')+'.json','utf8'));
let record=structuredClone(original);record.id='performance-'+record.id;record.settings.flowEdition='student';
const out='.booklet-work/equation-performance';fs.mkdirSync(out,{recursive:true});let writes=0;const errors=[];
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const page=await browser.newPage({viewport:{width:1700,height:1100}});page.on('pageerror',e=>errors.push(e.stack));
await page.route('**/__booklet/**',async route=>{const req=route.request(),url=new URL(req.url());if(url.pathname==='/__booklet/projects')return route.fulfill({json:[{id:record.id,title:record.title,revision:record.revision}]});if(url.pathname===`/__booklet/projects/${record.id}`){if(req.method()==='PUT'){const body=req.postDataJSON();assert.equal(body.expectedRevision,record.revision);record={...body.project,revision:record.revision+1};writes++;}return route.fulfill({json:record});}if(url.pathname.includes('bank-sync'))return route.fulfill({json:{items:[]}});if(req.method()==='GET'&&(url.pathname.includes('/files/')||url.pathname.includes('project-assets')))return route.continue();return route.fulfill({json:[]});});
const ready=()=>page.locator('.flow-document[data-pagination-state="ready"]').waitFor({timeout:240000});
try{
 await page.goto((process.env.BOOKLET_TEST_BASE??'http://127.0.0.1:5174')+'/#/booklet?stage=projects&project='+record.id);await ready();console.log('Initial pages ready');
 const blockId=process.env.BOOKLET_PERF_BLOCK??'index-t1-q1';await page.locator(`.flow-outline [data-block-id="${blockId}"] > button`).click();
 const equation=page.locator(`.flow-paper [data-edit-root^="${blockId}-"] .katex`).first();const anchor=await equation.evaluate(e=>{const owner=e.closest('[data-edit-root]');return {rootId:owner.dataset.editRoot,pointer:owner.dataset.editPath};}),originalValue=structuredClone(fieldValue(record,anchor));
 const opening=Date.now();await equation.click();await page.waitForFunction(()=>document.activeElement?.matches('math-field'));const openingMs=Date.now()-opening;await ready();
 await page.evaluate(()=>{document.activeElement.position=-1;window.perfField=document.activeElement;window.perfLatex=document.activeElement.value;window.perfInput=[];window.perfLong=[];window.perfEditor=document.querySelector('maths-editor');window.perfCounts={};for(const name of ['capture','read','remember','emit','render']){const c=window.perfEditor.documentController,original=c[name];c[name]=function(...args){const start=performance.now();try{return original.apply(this,args);}finally{const v=window.perfCounts[name]??={calls:0,ms:0};v.calls++;v.ms+=performance.now()-start;}};}window.perfObserver=new PerformanceObserver(list=>window.perfLong.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration}))));window.perfObserver.observe({type:'longtask',buffered:false});document.addEventListener('keydown',e=>{if(!e.target.matches('math-field'))return;const now=performance.now();requestAnimationFrame(()=>window.perfInput.push(performance.now()-now));},true);});
 const cdp=await page.context().newCDPSession(page);await cdp.send('Profiler.enable');await cdp.send('Profiler.start');
 const started=Date.now();await page.keyboard.type('+12345678901234567890',{delay:75});const typingMs=Date.now()-started;
 await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved',{},{timeout:120000});await ready();await page.waitForTimeout(300);
 const {profile}=await cdp.send('Profiler.stop');const counts=new Map();for(let i=0;i<(profile.samples??[]).length;i++){const id=profile.samples[i];counts.set(id,(counts.get(id)??0)+(profile.timeDeltas[i]??0));}const hot=profile.nodes.map(n=>({name:n.callFrame.functionName,url:n.callFrame.url,line:n.callFrame.lineNumber,ms:(counts.get(n.id)??0)/1000})).sort((a,b)=>b.ms-a.ms).slice(0,22);
 const measured=await page.evaluate(()=>({inputMs:window.perfInput,longTasks:window.perfLong,counts:window.perfCounts,pageChecks:window.perfPageChecks,latex:window.perfField.value,activeTag:document.activeElement.tagName,editors:[...document.querySelectorAll('maths-editor')].map(e=>({visible:!!e.getClientRects().length,page:e.closest('[data-flow-index]')?.dataset.flowIndex})),fieldRetained:window.perfField.isConnected&&document.activeElement===window.perfField,editorRetained:window.perfEditor===document.querySelector('maths-editor'),pagination:JSON.parse(document.querySelector('.flow-document').dataset.paginationMetrics)}));
 fs.writeFileSync(`${out}/${process.env.BOOKLET_PERF_RUN??'latest'}.cpuprofile`,JSON.stringify(profile));
 const result={project:original.id,openingMs,typingMs,settleMs:Date.now()-started-typingMs,totalMs:Date.now()-started,writes,errors,...measured,hot};fs.writeFileSync(`${out}/${process.env.BOOKLET_PERF_RUN??'latest'}.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result));assert.deepEqual(errors,[]);
 assert.ok(writes>0,'Typing was persisted');assert.ok(JSON.stringify(record.sections).includes('12345678901234567890'),'The saved content contains every typed character');
 assert.equal(measured.editorRetained,true,'An editor remaining on its page survives pagination and saving');
 assert.equal(await page.locator('.flow-measure maths-editor,.project-print maths-editor').count(),0,'Measurement and print copies never mount live editors');
 assert.equal(measured.fieldRetained,true,'The equation keeps focus through saving');
 assert.ok(result.settleMs<Number(process.env.BOOKLET_PERF_SETTLE_BUDGET_MS??3000),'Superseded pagination jobs must not accumulate a delay for every keystroke');
 const firstSaved=structuredClone(fieldValue(record,anchor));
 const saved=async()=>{await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');await ready();};
 await page.keyboard.type('+z');await saved();assert.match(await page.locator('maths-editor .me-content math-field').first().evaluate(m=>m.value),/z/);
 assert.equal(await page.evaluate(()=>window.perfField===document.activeElement),true,'Continuing after a pause retains the original math field');
 await page.getByRole('button',{name:'Undo',exact:true}).click();await saved();assert.deepEqual(fieldValue(record,anchor),firstSaved);
 await page.getByRole('button',{name:'Undo',exact:true}).click();await saved();assert.deepEqual(fieldValue(record,anchor),originalValue);
 await page.getByRole('button',{name:'Redo',exact:true}).click();await saved();assert.deepEqual(fieldValue(record,anchor),firstSaved);
 // The external booklet toolbar preserves the selected term, and the complete
 // structured value survives a real reload through the intercepted endpoint.
 await page.waitForFunction(()=>document.activeElement?.matches('math-field'));
 await page.keyboard.press('End');await page.keyboard.type('+q');await saved();
 await page.keyboard.press('Shift+ArrowLeft');
 await page.locator('.document-toolbar button[aria-label="Bold"]').click();await saved();
 assert.match(await page.locator('maths-editor .me-content math-field').first().evaluate(m=>m.value),/mathbf\{q\}/,'external formatting acts on the selected term');
 assert.equal(await page.locator('maths-editor .me-equation-selected').count(),1);
 const tools=page.locator('.document-toolbar .me-math-tools');await tools.waitFor();
 const bounds=await tools.boundingBox();assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=1700&&bounds.y+bounds.height<=1100,'equation tools remain in the viewport');
 assert.equal(await tools.getByRole('button',{name:'Edit LaTeX',exact:true}).evaluate(e=>getComputedStyle(e).color),'rgb(36, 54, 75)');
 await tools.getByRole('button',{name:'Edit LaTeX',exact:true}).click();await page.getByRole('dialog',{name:'Edit equation LaTeX',exact:true}).waitFor();
 assert.equal(await page.locator('maths-editor .me-equation-selected').count(),1);
 await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.waitForFunction(()=>!document.querySelector('.me-latex-dialog')&&document.activeElement?.matches('math-field'));
 await page.screenshot({path:out+'/equation-highlight-booklet.png'});
 const reopened=structuredClone(fieldValue(record,anchor));
 await page.reload();await ready();assert.deepEqual(fieldValue(record,anchor),reopened);
 await page.locator(`.flow-outline [data-block-id="${blockId}"] > button`).click();
 await page.locator(`.flow-paper [data-edit-root^="${blockId}-"] .katex`).first().click();
 await page.waitForFunction(()=>document.activeElement?.matches('math-field'));
 assert.match(await page.locator('maths-editor .me-content math-field').first().evaluate(m=>m.value),/mathbf\{q\}/);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,writes,undoRestored:true}));
}catch(e){await page.screenshot({path:out+'/failure.png'});throw e;}finally{await browser.close();}
