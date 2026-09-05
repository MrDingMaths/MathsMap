import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright-core';
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const page=await browser.newPage({viewport:{width:2400,height:1400}});
fs.mkdirSync('tmp/final-feedback',{recursive:true});
try {
 await page.goto('http://127.0.0.1:5173/#/booklet?stage=full-import&run=computation-integers-pilot-v2&page=29',{waitUntil:'networkidle'});
 await page.waitForSelector('.preview-page');
 for(const n of [29,30,32,34,35,36,37,38,46,48,51,62]) {
  await page.locator('.page-list button').filter({hasText:new RegExp(`^Page ${n}(?:Review|Accepted)$`)}).click();
  const headings=await page.locator('.preview-page .section-band').allTextContents();
  const expected={29:['Adding and Subtracting Negative Integers'],34:['Development'],36:['Mastery'],46:['Mixed Practice','Foundation'],48:['Development']}[n]??[];
  assert.deepEqual(headings.map(s=>s.trim()),expected,`page ${n} heading`);
  if(n===29) assert.ok(await page.locator('.preview-page td').evaluateAll(cells=>cells.length>0&&cells.every(c=>getComputedStyle(c).borderTopWidth==='0px'&&getComputedStyle(c).borderLeftWidth==='0px')));
  if(n===38) {
   assert.deepEqual(await page.locator('.exam-label').allTextContents(),['NAPLAN B+','NAPLAN A']);
   assert.ok(await page.locator('.exam-label').evaluateAll(labels=>labels.every(label=>{
    const number=label.closest('.question-line').querySelector('.part-label');
    return number&&Math.abs(number.getBoundingClientRect().top-label.getBoundingClientRect().top)<2;
   })));
  }
  await page.waitForFunction(()=>[...document.querySelectorAll('.preview-page .tikz-wrap')].every(el=>el.querySelector('.tikz-error')||[...el.querySelectorAll('svg')].some(svg=>!svg.querySelector('animate'))));
  await page.locator('.preview-page').screenshot({path:`tmp/final-feedback/page-${n}.png`});
 }
 console.log('12 source heading checks, borderless table and exam-label geometry passed.');
} finally {await browser.close();}
