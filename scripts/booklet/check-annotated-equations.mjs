import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const out='output/annotated-equations';let record=JSON.parse(fs.readFileSync(out+'/candidate.json')),writes=0;
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const page=await browser.newPage({viewport:{width:1600,height:1300}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/__booklet/**',r=>r.request().method()==='GET'?r.continue():r.abort());
await page.route('**/__booklet/bank/manifest',r=>r.fulfill({json:{format:'mathsmap-practice-bank-v3',version:3,questions:[]}}));
await page.route('**/__booklet/projects',r=>r.fulfill({json:[record]}));
await page.route('**/__booklet/projects/'+record.id,async r=>{if(r.request().method()==='PUT'){record={...r.request().postDataJSON().project,revision:record.revision+1};writes++;}await r.fulfill({json:record});});
const saved=()=>page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
const settle=async()=>{await page.evaluate(async()=>{const root=document.querySelector('.paper-scroll');if(window.TikZ)await window.TikZ.flushPending(root,300000);await document.fonts.ready;await Promise.all([...root.querySelectorAll('img')].map(i=>i.decode()));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});};
try{
 await page.goto('http://localhost:5173/#/booklet?stage=projects&project='+record.id,{waitUntil:'networkidle'});
 await page.getByLabel('Booklet zoom',{exact:true}).selectOption('1');
 for(const number of [5,16,29,73]){await page.locator('.section-select').nth(number-1).click();await settle();await page.locator('.paper-scroll .preview-page').screenshot({path:out+'/page-'+number+'.png'});}
 await page.locator('.section-select').nth(28).click();await settle();
 const formula=page.locator('.paper-scroll [data-type="annotated-equation"]');assert.equal(await formula.locator('[data-equation-arrows] path').count(),2);assert.equal(await formula.locator('.katex-error').count(),0);
 await formula.locator('[data-equation-formula]').click();const editor=page.locator('.focused-editor maths-editor');await editor.waitFor();
 await editor.locator('[data-equation-formula]').click();await editor.getByLabel('Equation',{exact:true}).waitFor();
 await editor.getByLabel('Equation',{exact:true}).focus();await editor.getByLabel('Equation',{exact:true}).press('End');await page.keyboard.type('+1');await editor.getByLabel('Equation',{exact:true}).press('Tab');
 assert.match(await editor.evaluate(e=>e.document.blocks[0].latex),/\+1$/);await editor.getByRole('button',{name:'Undo',exact:true}).click();assert.equal(await editor.evaluate(e=>e.document.blocks[0].latex),'y=mx+c');
 await editor.getByLabel('Equation',{exact:true}).evaluate(m=>{m.value='2y=mx+c';m.dispatchEvent(new Event('change',{bubbles:true}));});
 assert.equal(await editor.locator('[data-equation-warning]').count(),0);
 await editor.getByLabel('Equation',{exact:true}).evaluate(m=>{m.value='2y=nx+c';m.dispatchEvent(new Event('change',{bubbles:true}));});
 assert.equal(await editor.locator('[data-equation-warning]').count(),1);
 await editor.getByRole('button',{name:'Undo',exact:true}).click();assert.equal(await editor.locator('[data-equation-warning]').count(),0);
 await editor.getByLabel('Annotation term',{exact:true}).selectOption('0');await editor.getByRole('button',{name:'Add annotation',exact:true}).click();
 assert.equal(await editor.locator('[data-equation-label]').count(),3);
 await editor.getByLabel('Annotation placement',{exact:true}).selectOption('above');await editor.getByLabel('Annotation style',{exact:true}).selectOption('bracket');
 await editor.getByRole('button',{name:'Annotation colour: Booklet green',exact:true}).click();
 await editor.locator('[data-equation-label]').last().locator('p').click();await page.keyboard.press('End');await page.keyboard.type(' checked');
 await page.locator('.focused-editor').getByRole('button',{name:'Save',exact:true}).click();await saved();
 await page.reload({waitUntil:'networkidle'});await page.locator('.section-select').nth(28).click();await settle();
 assert.equal(await formula.locator('[data-equation-label]').count(),3);assert.match(await formula.textContent(),/checked/);assert.equal(await formula.locator('[data-equation-warning]').count(),0);
 await formula.locator('[data-equation-formula]').click();await editor.waitFor();await editor.evaluate(e=>e.readonly=true);
 assert.ok((await editor.locator('[data-equation-label]').evaluateAll(labels=>labels.map(l=>l.contentEditable))).every(v=>v==='false'));
 assert.equal(await editor.getByRole('button',{name:'Add annotation',exact:true}).isDisabled(),true);await page.locator('.focused-editor').getByRole('button',{name:'Cancel',exact:true}).click();
 await page.locator('.section-select').nth(4).click();await settle();
 const key=page.locator('.paper-scroll [data-edit-root="page-5-key-ideas"]');assert.ok(await key.locator('[data-cloze]').count()>0);
 for(const mode of ['Short answers','Worked solutions']){await page.getByRole('button',{name:mode,exact:true}).click();assert.ok((await key.locator('[data-cloze]').allTextContents()).every(t=>!t.trim()));}
 if(!await page.getByLabel('Show Key Ideas answers',{exact:true}).isVisible())await page.getByRole('button',{name:'PDF',exact:true}).click();await page.getByLabel('Show Key Ideas answers',{exact:true}).check();await page.getByRole('button',{name:'Save as defaults',exact:true}).click();await saved();
 assert.ok((await key.locator('[data-cloze]').allTextContents()).some(t=>t.trim()));
 await page.reload({waitUntil:'networkidle'});await page.locator('.section-select').nth(4).click();assert.ok((await key.locator('[data-cloze]').allTextContents()).some(t=>t.trim()));
 if(!await page.getByLabel('Show Key Ideas answers',{exact:true}).isVisible())await page.getByRole('button',{name:'PDF',exact:true}).click();await page.getByLabel('Show Key Ideas answers',{exact:true}).uncheck();await saved();
 const circles=await key.locator('[data-cloze-leader] circle').evaluateAll(items=>items.map(c=>({radius:c.getAttribute('r'),x:c.getAttribute('cx')})));assert.ok(circles.length>10);assert.ok(circles.every(c=>c.radius==='.13'));
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/browser-check.json',JSON.stringify({focusedEditing:true,anchorsFollowEdits:true,deletedTermsFlagged:true,annotationLabelEdit:true,palette:true,saveReload:true,keyIdeasIndependent:true,fixedDotRadiusMm:.13,writes,errors},null,2));
 console.log('Annotated equation edits, anchors, palette, undo, reload and independent Key Ideas answers passed.');
}finally{await browser.close();}
