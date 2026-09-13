// Read-only browser regression: edits a routed project draft; all server writes are blocked.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const p=JSON.parse(fs.readFileSync('booklets/projects/index-laws-complete-v1.json'));p.settings.flowEdition='student';p.sections=p.sections.map(s=>({...s,blocks:s.blocks.filter(b=>b.pedagogyRole==='key-ideas'||b.id==='index-t2-q12')})).filter(s=>s.blocks.length);
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1450,height:1100}});
page.setDefaultTimeout(20000);
try{
await page.route('**/__booklet/**',r=>r.request().method()==='GET'?r.fallback():r.abort());await page.route('**/__booklet/projects/'+p.id,r=>r.request().method()==='GET'?r.fulfill({json:p}):r.fallback());
await page.goto((process.env.BOOKLET_TEST_BASE??'http://127.0.0.1:5174')+'/#/booklet?stage=projects&project='+p.id);await page.waitForFunction(()=>document.querySelector('.flow-document')?.dataset.paginationState==='ready');
await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));
await page.emulateMedia({media:'print'});await page.evaluate(()=>document.fonts.ready);
const rows=await page.locator('.project-print .cloze-statement').evaluateAll(els=>els.map(e=>{const number=e.querySelector('.cloze-number').getBoundingClientRect(),text=e.querySelector('.cloze-text p').getBoundingClientRect();return {sameLine:number.top<text.bottom&&text.top<number.bottom,beside:text.left>number.right};}));
assert.equal(rows.length,20);assert.ok(rows.every(r=>r.sameLine&&r.beside),'Every Key Ideas number must stay beside its first text line');
console.log('PASS all 20 Key Ideas numbers share their text row');
await page.emulateMedia({media:'screen'});
await page.locator('.flow-outline [data-block-id="index-t2-q12"] button').first().click();
const img=page.locator('.project-canvas img[src*="image11.png"]').first();await img.click();
await page.getByLabel('Diagram width on page',{exact:true}).fill('61');await page.getByLabel('Diagram width on page',{exact:true}).press('Tab');
await page.waitForFunction(()=>[...document.querySelectorAll('.project-canvas .arr-diagram')].some(e=>e.querySelector('img[src*="image11.png"]')&&e.style.width==='61mm'));
await page.getByRole('button',{name:'Edit image',exact:true}).click();
assert.equal(await page.getByLabel('Diagram width (mm)',{exact:true}).inputValue(),'61');
const alignment=page.getByLabel('Image alignment',{exact:true});await alignment.selectOption('center');
await page.locator('dialog[open]').getByRole('button',{name:'Save',exact:true}).click();
const shell=page.locator('.project-canvas .arr-diagram').filter({has:page.locator('img[src*="image11.png"]')}).first();
await page.waitForFunction(()=>[...document.querySelectorAll('.project-canvas .arr-diagram')].some(e=>e.querySelector('img[src*="image11.png"]')&&e.style.marginLeft==='auto'&&e.style.marginRight==='auto'));
const item=shell.locator('..');assert.equal(await item.evaluate(e=>e.style.marginInline),'auto');await shell.locator('img').click();await page.getByRole('button',{name:'Edit image',exact:true}).click();assert.equal(await alignment.inputValue(),'center');console.log('PASS centre control applies and is retained when reopened');
}finally{await browser.close()}
