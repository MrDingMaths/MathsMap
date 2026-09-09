import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';

let browser;
try { browser=await chromium.launch({headless:true}); }
catch { browser=await chromium.launch({headless:true,channel:'chrome'}); }
const page=await browser.newPage({viewport:{width:1400,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto(process.argv[2]??'http://127.0.0.1:5173/libs/maths-editor/studio.html');
 await page.waitForFunction(()=>document.querySelector('maths-editor')?.documentController);
 await page.evaluate(()=>{
  const old=document.querySelector('maths-editor'),editor=document.createElement('maths-editor');
  editor.setAttribute('structured','');editor.setAttribute('controls','contextual');old.replaceWith(editor);
  editor.document={blocks:[{id:'first',type:'paragraph',inlines:[{type:'text',text:'A'},{type:'tab'},{type:'tab'},{type:'tab'},{type:'text',text:'B'}]},{id:'second',type:'paragraph',inlines:[{type:'text',text:'Another paragraph'}]}]};
 });
 const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 await settle();
 const surface=page.locator('.me-content'),top=await surface.evaluate(e=>e.getBoundingClientRect().top);
 for(const name of ['Format','Insert','Paragraph properties']){
  const summary=page.locator('maths-editor summary').filter({hasText:new RegExp('^'+name+'$')});
  await summary.click();await settle();
  assert.equal(await surface.evaluate(e=>e.getBoundingClientRect().top),top, name+' shifted content');
  assert.ok(await summary.evaluate(e=>e.parentElement.open));
  await summary.press('Escape');
  assert.equal(await summary.evaluate(e=>e.parentElement.open),false);
 }
 await page.locator('.me-content p').last().click();
 assert.equal(await surface.evaluate(e=>e.getBoundingClientRect().top),top);
 // Repeated selection must retain the property controls and their state.
 await page.getByText('Paragraph properties',{exact:true}).click();
 await page.evaluate(()=>{window.originalControl=document.querySelector('.me-properties input');const c=document.querySelector('maths-editor').documentController;c.select(c.surface.querySelector('p:last-child'));});
 assert.ok(await page.evaluate(()=>window.originalControl===document.querySelector('.me-properties input')));
 await page.getByText('Paragraph properties',{exact:true}).press('Escape');
 for(const scale of [1,.75,1.5]){
  await page.evaluate(scale=>{const c=document.querySelector('maths-editor').documentController;c.surface.style.transform=`scale(${scale})`;c.surface.style.transformOrigin='top left';c.tabsObserver.update();},scale);
  await settle();
  const stops=await page.locator('.me-content p').first().evaluate((p,scale)=>[...p.querySelectorAll('[data-tab]')].map(t=>(t.getBoundingClientRect().right-p.getBoundingClientRect().left)/scale*25.4/96),scale);
  stops.forEach((value,i)=>assert.ok(Math.abs(value-(i+1)*10)<.1,JSON.stringify(stops)));
 }
 await page.evaluate(()=>document.querySelector('.me-content').style.transform='');
 await page.screenshot({path:'tmp/studio-menu-stability.png',fullPage:true});
 // Exercise the actual Svelte arrangement editor with read-only intercepted project data.
 const record=JSON.parse(fs.readFileSync('tests/fixtures/booklets/linear-legacy-layout.json'));
 const section=record.sections.find(s=>s.blocks.some(b=>b.id==='page-4-q1'));
 section.blocks=section.blocks.filter(b=>b.id==='page-4-q1');record.sections=[record.sections[0],section];
 await page.route('**/__booklet/**',r=>r.request().method()==='GET'?r.continue():r.abort());
 await page.route('**/__booklet/bank/manifest',r=>r.fulfill({json:{format:'mathsmap-practice-bank-v3',version:3,questions:[]}}));
 await page.route('**/__booklet/projects',r=>r.fulfill({json:[record]}));
 await page.route('**/__booklet/projects/'+record.id,r=>r.fulfill({json:record}));
 await page.goto('http://127.0.0.1:5173/#/booklet?stage=projects&project='+record.id,{waitUntil:'networkidle'});
 await page.locator('.section-select').last().click();
 await page.locator('.paper-scroll [data-arrangement-id="layout:page-4-q1-a/prompt"]').click();
 const dialog=page.locator('.focused-editor');await dialog.waitFor();
 assert.ok(await dialog.locator('.tree-preview .katex').count()>0,'Structure menu renders maths');
 const canvas=dialog.locator('.arr-canvas'),before=await canvas.boundingBox();
 await dialog.getByRole('button',{name:'Edit selected content',exact:true}).click();
 await dialog.locator('maths-editor').waitFor();
 const after=await canvas.boundingBox();
 assert.equal(after.x,before.x);assert.equal(after.width,before.width,'Opening content editor changes canvas width');
 const contentTop=await dialog.locator('.me-content').evaluate(e=>e.getBoundingClientRect().top);
 await dialog.getByText('Paragraph properties',{exact:true}).click();
 assert.equal(await dialog.locator('.me-content').evaluate(e=>e.getBoundingClientRect().top),contentTop);
 await dialog.screenshot({path:'tmp/booklet-studio-menu-stability.png'});
 await dialog.locator(':scope > header').getByRole('button',{name:'Cancel',exact:true}).click();
 assert.deepEqual(errors,[]);
 console.log('Menus preserve content position; repeated selection preserves controls; default tabs land at 10/20/30 mm at three zoom levels.');
} finally { await browser.close(); }
