import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
const out=path.resolve('output/linear-feedback');
let record=JSON.parse(fs.readFileSync(path.join(out,'candidate.json')));
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const page=await browser.newPage({viewport:{width:1600,height:1300}}),errors=[],writes=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/__booklet/**',r=>r.request().method()==='GET'?r.continue():r.abort());
await page.route('**/__booklet/bank/manifest',r=>r.fulfill({json:{format:'mathsmap-practice-bank-v3',version:3,questions:[]}}));
await page.route('**/__booklet/projects',r=>r.fulfill({json:[{id:record.id,title:record.title,revision:record.revision}]}));
await page.route('**/__booklet/projects/'+record.id,async r=>{if(r.request().method()==='PUT'){record={...r.request().postDataJSON().project,revision:record.revision+1};writes.push(record);}await r.fulfill({json:record});});
const pages=process.argv.includes('--all')?Array.from({length:93},(_,i)=>i+1):(process.argv.find(a=>a.startsWith('--pages='))?.split('=')[1]??'31,32,35,39,40,59,60,62,67,73,85,90,92').split(',').map(Number);
const metrics=[];
try{
  await page.goto('http://localhost:5173/#/booklet?stage=projects&project='+record.id,{waitUntil:'networkidle'});
  assert.equal(await page.locator('.project-print .print-page').count(),0,'print pages must not mount during editing');
  await page.getByLabel('Booklet zoom',{exact:true}).selectOption('1');
  for(const n of pages){
    await page.locator('.section-select').nth(n-1).click();
    await page.evaluate(async()=>{const root=document.querySelector('.paper-scroll');if(window.TikZ&&!await window.TikZ.flushPending(root,300000))throw new Error('Diagram queue timed out');await document.fonts.ready;await Promise.all([...root.querySelectorAll('img')].map(img=>img.decode()));});
    await page.waitForFunction(()=>[...document.querySelectorAll('.paper-scroll .tikz-wrap')].every(el=>el.querySelector('.tikz-error')||el.querySelector('svg:not(:has(animate))')),null,{timeout:300000});
    // Tabs and annotation geometry settles across the next paint after fonts/assets.
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const data=await page.locator('.paper-scroll').evaluate(root=>{const article=root.querySelector('.booklet-page');if(!article)return {};const bounds=article.getBoundingClientRect(),footer=article.querySelector('footer')?.getBoundingClientRect();const overflow=[];for(const el of article.querySelectorAll('main table,main p,main .text-line,main .tikz-wrap,main .question-diagrams,main [data-table-annotations]')){const r=el.getBoundingClientRect();if(r.width&&r.height&&(r.bottom>(footer?.top??bounds.bottom)-3||r.right>bounds.right-45||r.left<bounds.left+45))overflow.push({id:el.dataset.id,text:el.textContent.slice(0,75),bottom:r.bottom-bounds.top,right:r.right-bounds.left});}return {overflow,diagramErrors:[...root.querySelectorAll('.tikz-error')].map(e=>e.textContent)};});
    metrics.push({page:n,...data});
    await page.locator('.paper-scroll .preview-page').screenshot({style:'.canvas-heading,.selected-content-controls{visibility:hidden!important}',path:path.join(out,'page-'+String(n).padStart(3,'0')+'.png')});
    console.log(JSON.stringify({page:n,overflow:data.overflow?.length??0,diagramErrors:data.diagramErrors?.length??0}));
  }
  assert.deepEqual(metrics.filter(m=>m.overflow?.length||m.diagramErrors?.length),[],'Every source page must fit and render its diagrams');
  if(process.argv.includes('--interaction')){
    await page.locator('.section-select').nth(25).click();
    const beforeWrites=writes.length;
    const surface=page.locator('.paper-scroll [data-edit-root="page-26-q2-a"] .clickable').first();await surface.click();
    await page.locator('.focused-editor maths-editor').waitFor();assert.equal(await page.locator('.focused-editor maths-editor').count(),1);
    assert.equal(await page.locator('.paper-scroll maths-editor').count(),0);
    await page.locator('.focused-editor').getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(writes.length,beforeWrites);
    const space=page.locator('.paper-scroll .answer-space').first();const box=await space.boundingBox();
    if(box){await page.mouse.move(box.x+box.width/2,box.y+box.height-2);await page.mouse.down();await page.mouse.move(box.x+box.width/2,box.y+box.height+25,{steps:12});assert.equal(writes.length,beforeWrites);await page.keyboard.press('Escape');await page.mouse.up();assert.equal(writes.length,beforeWrites);}
    assert.ok(box,'Full project must expose a resize handle');
    const beforeHeight=await space.evaluate(e=>parseFloat(e.style.height));
    await page.mouse.move(box.x+box.width/2,box.y+box.height-2);await page.mouse.down();
    const frames=[];
    for(let i=1;i<=20;i++){const t=performance.now();await page.mouse.move(box.x+box.width/2,box.y+box.height-2+i*2);await page.evaluate(()=>new Promise(requestAnimationFrame));frames.push(performance.now()-t);}
    assert.equal(writes.length,beforeWrites,'Pointer movement must not save');
    await page.mouse.up();await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
    assert.equal(writes.length,beforeWrites+1,'One drag is one project write');
    assert.ok(Math.abs(await space.evaluate(e=>parseFloat(e.style.height))-beforeHeight-40*25.4/96)<.1,'Resizing uses physical page scale');
    await page.getByRole('button',{name:'Undo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
    assert.equal(await space.evaluate(e=>parseFloat(e.style.height)),beforeHeight);
    assert.equal(await page.getByRole('button',{name:'Undo',exact:true}).isEnabled(),false,'One undo restores the complete gesture');
    await page.getByRole('button',{name:'Redo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
    await surface.click();await page.locator('.focused-editor maths-editor .editor-surface').waitFor();
    await page.locator('.focused-editor maths-editor .me-content p').first().click();await page.keyboard.press('End');await page.keyboard.type(' Editor check.');
    await page.locator('.focused-editor').getByRole('button',{name:'Save',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
    assert.match(JSON.stringify(record.sections.find(s=>s.sourcePageNumber===26)),/Editor check/);
    await page.reload({waitUntil:'networkidle'});await page.locator('.section-select').nth(25).click();
    assert.match(await surface.textContent(),/Editor check/);
    const recovery=page.locator('.paper-scroll .answer-space').first(),initial=await recovery.boundingBox();
    await page.mouse.move(initial.x+initial.width/2,initial.y+initial.height-2);await page.mouse.down();await page.mouse.move(initial.x+initial.width/2,initial.y-100,{steps:8});await page.mouse.up();await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
    assert.equal(await recovery.evaluate(e=>parseFloat(e.style.height)),0);assert.ok(await recovery.isVisible());assert.match(await recovery.textContent(),/Restore answer space/);
    await page.emulateMedia({media:'print'});assert.equal(await recovery.isVisible(),false,'Zero-height recovery controls do not print');await page.emulateMedia({media:'screen'});
    await page.reload({waitUntil:'networkidle'});await page.locator('.section-select').nth(25).click();
    assert.equal(await recovery.evaluate(e=>parseFloat(e.style.height)),0);await recovery.focus();await page.keyboard.press('ArrowDown');await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');assert.equal(await recovery.evaluate(e=>parseFloat(e.style.height)),2);
    await recovery.focus();await page.keyboard.press('ArrowUp');await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
    const collapsed=await recovery.boundingBox();await page.mouse.move(collapsed.x+collapsed.width/2,collapsed.y+collapsed.height-2);await page.mouse.down();await page.mouse.move(collapsed.x+collapsed.width/2,collapsed.y+collapsed.height+25,{steps:6});await page.mouse.up();await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');assert.ok(await recovery.evaluate(e=>parseFloat(e.style.height))>0,'Dragging restores zero-height space');
    metrics.push({interaction:{frameMedianMs:frames.sort((a,b)=>a-b)[10],frameMaxMs:Math.max(...frames),writes:writes.length-beforeWrites}});
  }
  if(process.argv.includes('--image-check')){
    await page.locator('.section-select').nth(7).click();
    const diagram=page.locator('.paper-scroll [data-diagram-id="page-8-q7-diagram"]');
    const size=await diagram.locator('img').evaluate(e=>({w:e.naturalWidth,h:e.naturalHeight}));
    assert.ok(size.w>20&&size.h>20);
    const q=record.sections.find(s=>s.sourcePageNumber===8).blocks.find(b=>b.id==='page-8-q7');
    q.content.questionDiagrams[0].sourceRegion={x:5,y:5,width:size.w-10,height:size.h-10,sourceWidth:size.w,sourceHeight:size.h};
    record.settings.layoutOverrides.diagramColourModes['page-8-q7-diagram']='grayscale';
    await page.reload({waitUntil:'networkidle'});await page.locator('.section-select').nth(7).click();await page.getByLabel('Booklet zoom',{exact:true}).selectOption('1');
    const beforeWrites=writes.length;
    const before=await diagram.locator('img').evaluate(e=>({style:e.getAttribute('style'),filter:getComputedStyle(e).filter}));
    await diagram.click();const draft=page.locator('.diagram-draft');await draft.locator('.diagram-preview img').waitFor();
    assert.equal(await draft.locator('.diagram-preview img').getAttribute('style'),before.style,'Focused image uses the exact booklet crop');
    assert.equal(await draft.getByRole('combobox').inputValue(),'grayscale');
    assert.match(await draft.locator('.grayscale').evaluate(e=>getComputedStyle(e).filter),/grayscale\(1\)/);
    await draft.getByLabel('x',{exact:true}).fill('6');await draft.getByLabel('x',{exact:true}).press('Tab');
    await page.locator('.focused-editor').getByRole('button',{name:'Save proposal',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
    assert.equal(writes.length,beforeWrites+1);assert.equal(record.sections.find(s=>s.sourcePageNumber===8).blocks.find(b=>b.id==='page-8-q7').content.questionDiagrams[0].sourceRegion.x,6);
    await page.reload({waitUntil:'networkidle'});await page.locator('.section-select').nth(7).click();await diagram.click();await draft.locator('.diagram-preview img').waitFor();assert.equal(await draft.getByLabel('x',{exact:true}).inputValue(),'6');await page.locator('.focused-editor').getByRole('button',{name:'Cancel',exact:true}).click();
    metrics.push({imageParity:{crop:true,grayscale:true,saveReload:true}});
  }
  assert.deepEqual(errors,[]);
}finally{fs.writeFileSync(path.join(out,'browser-metrics.json'),JSON.stringify({metrics,errors,writes:writes.length},null,2));await browser.close();}
