// Profile the complete accepted book through an isolated in-memory save endpoint.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const original=JSON.parse(fs.readFileSync('booklets/projects/'+(process.env.BOOKLET_PERF_PROJECT??'index-laws-complete-v1')+'.json','utf8'));
let record=structuredClone(original);record.id='performance-'+record.id;record.settings.flowEdition='student';
const out='.booklet-work/document-performance';fs.mkdirSync(out,{recursive:true});let writes=0;const errors=[];
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const page=await browser.newPage({viewport:{width:1700,height:1100}});page.on('pageerror',e=>errors.push(e.stack));
await page.route('**/__booklet/**',async route=>{const req=route.request(),url=new URL(req.url());if(url.pathname==='/__booklet/projects')return route.fulfill({json:[{id:record.id,title:record.title,revision:record.revision}]});if(url.pathname===`/__booklet/projects/${record.id}`){if(req.method()==='PUT'){const body=req.postDataJSON();assert.equal(body.expectedRevision,record.revision);record={...body.project,revision:record.revision+1};writes++;}return route.fulfill({json:record});}if(url.pathname.includes('bank-sync'))return route.fulfill({json:{items:[]}});if(req.method()==='GET'&&(url.pathname.includes('/files/')||url.pathname.includes('project-assets')))return route.continue();return route.fulfill({json:[]});});
const ready=()=>page.locator('.flow-document[data-pagination-state="ready"]').waitFor({timeout:240000});
try{
 await page.goto((process.env.BOOKLET_TEST_BASE??'http://127.0.0.1:5174')+'/#/booklet?stage=projects&project='+record.id);await ready();console.log('Initial pages ready');
 const field=page.locator('.flow-paper [data-edit-path="/content"] .clickable,.flow-paper [data-edit-path="/prompt"] .clickable').first();await field.click();await page.locator('maths-editor .me-content').waitFor();await page.keyboard.press('End');await ready();
 await page.evaluate(()=>{window.perfInput=[];window.perfLong=[];window.perfEditor=document.querySelector('maths-editor');window.perfObserver=new PerformanceObserver(list=>window.perfLong.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration}))));window.perfObserver.observe({type:'longtask',buffered:false});document.addEventListener('beforeinput',()=>{const now=performance.now();requestAnimationFrame(()=>window.perfInput.push(performance.now()-now));},true);});
 const cdp=await page.context().newCDPSession(page);await cdp.send('Profiler.enable');await cdp.send('Profiler.start');
 const started=Date.now();await page.keyboard.type(' Smooth editing check.',{delay:75});const typingMs=Date.now()-started;
 await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved',{},{timeout:120000});await ready();await page.waitForTimeout(300);
 const {profile}=await cdp.send('Profiler.stop');const counts=new Map();for(let i=0;i<(profile.samples??[]).length;i++){const id=profile.samples[i];counts.set(id,(counts.get(id)??0)+(profile.timeDeltas[i]??0));}const hot=profile.nodes.map(n=>({name:n.callFrame.functionName,url:n.callFrame.url,line:n.callFrame.lineNumber,ms:(counts.get(n.id)??0)/1000})).sort((a,b)=>b.ms-a.ms).slice(0,22);
 const measured=await page.evaluate(()=>({inputMs:window.perfInput,longTasks:window.perfLong,editorRetained:window.perfEditor===document.querySelector('maths-editor'),pagination:JSON.parse(document.querySelector('.flow-document').dataset.paginationMetrics)}));
 const result={project:original.id,typingMs,totalMs:Date.now()-started,writes,errors,...measured,hot};fs.writeFileSync(`${out}/${process.env.BOOKLET_PERF_RUN??'latest'}.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result));assert.deepEqual(errors,[]);
 assert.ok(writes>0,'Typing was persisted');assert.ok(JSON.stringify(record.sections).includes('Smooth editing check.'),'The saved content contains every typed character');
 assert.equal(measured.editorRetained,true,'An editor remaining on its page survives pagination and saving');
 assert.equal(await page.locator('.flow-measure maths-editor,.project-print maths-editor').count(),0,'Measurement and print copies never mount live editors');
 // Source verification is explicit, stays available, and can be rerun on an unchanged book.
 await page.locator('.project-toolbar').getByRole('button',{name:/^Review(?: \(|$)/}).click();await page.getByText('Source coverage and exceptions',{exact:true}).click();
 await page.getByRole('button',{name:'Check source coverage',exact:true}).click();
 await page.getByRole('button',{name:'Recheck source coverage',exact:true}).waitFor({timeout:120000});
 await page.getByRole('button',{name:'Recheck source coverage',exact:true}).click();
 await page.getByRole('button',{name:'Recheck source coverage',exact:true}).waitFor({timeout:120000});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,sourceReview:true}));
}catch(e){await page.screenshot({path:out+'/failure.png'});throw e;}finally{await browser.close();}
