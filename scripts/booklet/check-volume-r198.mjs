// Isolated browser evidence for the revision-198 feedback; never saves originals.
import fs from 'node:fs';
import {chromium} from 'playwright-core';
const out='.booklet-work/volume-r198',base=process.env.BOOKLET_TEST_BASE??'http://127.0.0.1:5173';
fs.mkdirSync(out,{recursive:true});
const original=JSON.parse(fs.readFileSync('booklets/projects/volume-v1.json'));
const record=structuredClone(original);record.id='volume-r198-review';record.settings.flowEdition='student';
record.sections=record.sections.filter(s=>s.blocks.some(b=>b.id==='p16-q1')).map(s=>({...s,blocks:s.blocks.filter(b=>b.id==='p16-q1')}));
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const page=await browser.newPage({viewport:{width:1600,height:1200}});page.setDefaultTimeout(60000);
page.on('pageerror',e=>console.error(e.message));
await page.route('**/__booklet/**',r=>{const path=new URL(r.request().url()).pathname;if(path.endsWith('/projects/'+record.id))return r.fulfill({json:record});if(path.endsWith('/projects'))return r.fulfill({json:[record]});if(path.endsWith('/bank-sync'))return r.fulfill({json:{items:[]}});if(r.request().method()!=='GET')return r.abort();return r.continue();});
try{
 await page.goto(base+'/#/booklet?stage=projects&project='+record.id,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('.flow-document')?.dataset.paginationState==='ready',{},{timeout:600000});
 const measures=await page.locator('.project-canvas').evaluate(root=>['a','b','c'].map(part=>{const el=root.querySelector(`[data-diagram-id="p16-q1-${part}-diagram"]`)??root.querySelector(`[data-arrangement-id="layout:p16-q1-${part}-diagram"] .arr-diagram`);return {part,heightMm:el.offsetHeight*25.4/96,widthMm:el.offsetWidth*25.4/96};}));
 fs.writeFileSync(out+'/diagram-measurements.json',JSON.stringify({revision:original.revision,measures,slotMm:Math.ceil(Math.max(...measures.map(m=>m.heightMm))*2)/2},null,2));console.log(JSON.stringify(measures));
 await page.screenshot({path:out+'/p16-before.png',fullPage:true});
}finally{await browser.close();}
