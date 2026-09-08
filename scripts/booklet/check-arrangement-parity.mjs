import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
let record=JSON.parse(fs.readFileSync('booklets/projects/linear-relationships-complete-v1.json')),writes=0;
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1700,height:1300}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/__booklet/**',r=>r.request().method()==='GET'?r.continue():r.abort());
await page.route('**/__booklet/bank/manifest',r=>r.fulfill({json:{format:'mathsmap-practice-bank-v3',version:3,questions:[]}}));
await page.route('**/__booklet/projects',r=>r.fulfill({json:[record]}));
await page.route('**/__booklet/projects/'+record.id,async r=>{if(r.request().method()==='PUT'){record={...r.request().postDataJSON().project,revision:record.revision+1};writes++;}await r.fulfill({json:record});});
const go=async n=>{await page.locator('.section-select').nth(n-1).click();await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('.paper-scroll img')].map(i=>i.decode().catch(()=>{})));});};
const metrics=scope=>scope.evaluate(e=>{const root=e.getBoundingClientRect();return [...e.querySelectorAll('[data-arrangement-id],.arr-diagram img')].map(n=>{const r=n.getBoundingClientRect();return {id:n.dataset.arrangementId??'image',x:r.x-root.x,y:r.y-root.y,w:r.width,h:r.height};});});
const compare=(a,b)=>{assert.equal(a.length,b.length);for(let i=0;i<a.length;i++){assert.equal(a[i].id,b[i].id);for(const k of ['x','y','w','h'])assert.ok(Math.abs(a[i][k]-b[i][k])<1.1,`${a[i].id} ${k}: ${a[i][k]} vs ${b[i][k]}`);}};
try{
 await page.goto('http://localhost:5173/#/booklet?stage=projects&project='+record.id,{waitUntil:'networkidle'});await page.getByLabel('Booklet zoom',{exact:true}).selectOption('1');
 await go(44);assert.equal(await page.locator('.paper-scroll [role="alert"]').count(),0);assert.equal(await page.locator('.paper-scroll [data-arrangement-id="layout:page-44-q1-root/label"]').textContent(),'1 ');
 await go(47);const body=page.locator('.paper-scroll [data-arrangement-block="page-47-q6"]');const before=await metrics(body);
 await body.locator('[data-diagram-id="page-47-q6-diag-pattern"]').click();const dialog=page.locator('.focused-editor');await dialog.getByRole('heading',{name:'Edit question arrangement'}).waitFor();await page.evaluate(()=>document.fonts.ready);
 // Editor answer-space placeholders are intentionally taller when a space is hidden; compare diagram and content positions above them.
 const edited=await metrics(dialog.locator('[data-arrangement-block="page-47-q6"]'));
 compare(before.filter(n=>n.id==='image'||n.id==='layout:page-47-q6-diag-pattern'||n.id.endsWith('/label')||n.id.includes('/prompt')),edited.filter(n=>n.id==='image'||n.id==='layout:page-47-q6-diag-pattern'||n.id.endsWith('/label')||n.id.includes('/prompt')));
 await dialog.locator(':scope > header').getByRole('button',{name:'Save',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');assert.equal(writes,1);compare(before,await metrics(body));
 await page.reload({waitUntil:'networkidle'});await go(47);compare(before,await metrics(body));
 await body.screenshot({path:'output/arrangement-parity-page47.png'});
 await page.getByRole('button',{name:'PDF',exact:true}).click();
 await page.emulateMedia({media:'print'});
 const printed=page.locator('.project-print [data-arrangement-block="page-47-q6"]');
 await printed.waitFor({state:'visible'});
 await printed.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 const printPage=printed.locator('xpath=ancestor::article[contains(@class,"booklet-page")]');
 await printPage.screenshot({path:'output/arrangement-parity-print.png'});
 const bounds=await printPage.evaluate(e=>{const main=e.querySelector('main'),footer=e.querySelector('footer');return {height:e.getBoundingClientRect().height,contentBottom:Math.max(...[...main.children].map(n=>n.getBoundingClientRect().bottom)),footerTop:footer.getBoundingClientRect().top,overflow:main.scrollWidth>main.clientWidth+1};});
 assert.ok(bounds.height>0);assert.equal(bounds.overflow,false);assert.ok(bounds.contentBottom<=bounds.footerTop,JSON.stringify(bounds));console.log('Print bounds',JSON.stringify(bounds));
 const overflow=bounds.overflow;
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,writes,errors,diagramParity:true,saveReloadParity:true,printHorizontalOverflow:overflow}));
}finally{await browser.close();}
