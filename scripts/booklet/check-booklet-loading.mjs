import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const base=process.argv[2]??'http://127.0.0.1:5173';
const project=JSON.parse(fs.readFileSync('booklets/projects/linear-relationships-complete-v1.json'));
let browser;
try {browser=await chromium.launch({headless:true});}
catch {browser=await chromium.launch({headless:true,channel:'chrome'});}
try {
 const bankPage=await browser.newPage();
 let releaseBank;
 const bankGate=new Promise(resolve=>{releaseBank=resolve;});
 await bankPage.route('**/__booklet/bank/manifest',async route=>{await bankGate;await route.continue();});
 await bankPage.goto(base+'/#/booklet');
 await bankPage.getByRole('button',{name:'Booklets',exact:true}).click();
 await bankPage.getByRole('heading',{name:'Open a booklet',exact:true}).waitFor();
 assert.equal(await bankPage.locator('.paper-scroll .preview-page').count(),0,'Entering Booklets must not open an arbitrary working assembly');
 await bankPage.getByLabel('Open booklet',{exact:true}).selectOption(project.id);
 await bankPage.locator('.paper-scroll .preview-page').waitFor();
 releaseBank();
 await bankPage.getByRole('button',{name:'Question bank',exact:true}).click();
 await bankPage.locator('.question-card').first().waitFor();
 assert.equal(await bankPage.locator('.question-card__body').count(),0,'Collapsed questions must not render previews');
 const firstCard=bankPage.locator('.question-card__collapsible').first();
 await firstCard.locator('summary').click();
 await firstCard.locator('.practice-question').waitFor();
 assert.equal(await bankPage.locator('.question-card__body').count(),1);
 await firstCard.locator('summary').click();
 await firstCard.locator('.question-card__body').waitFor({state:'detached'});
 await bankPage.close();
 const page=await browser.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>sessionStorage.setItem('booklet-workspace',JSON.stringify({panel:'pdf'})));
 await page.route('**/__booklet/**',r=>r.request().method()==='GET'?r.continue():r.abort());
 await page.route('**/__booklet/bank/manifest',r=>r.fulfill({json:{questions:[]}}));
 await page.goto(base+'/#/booklet?stage=projects&project='+project.id);
 await page.locator('.paper-scroll .preview-page').waitFor();
 assert.equal(await page.locator('.project-print .print-page').count(),0,'Restoring PDF settings must not render the entire booklet');
 await page.getByRole('button',{name:'Next page',exact:true}).click();
 assert.equal(await page.locator('.project-print .print-page').count(),0);
 await page.getByRole('button',{name:'Close panel',exact:true}).click();
 await page.getByRole('button',{name:'PDF',exact:true}).click();
 assert.equal(await page.locator('.project-print .print-page').count(),0,'Opening settings must stay lightweight');

 // A small, read-only fixture verifies the actual print lifecycle without a dialog.
 const fixture={...project,sections:[{id:'loading-check',sourcePageNumber:2,title:'Loading check',blocks:[{id:'loading-text',type:'rich-text',content:'Print lifecycle check'}]}]};
 await page.route('**/__booklet/projects/'+project.id,r=>r.fulfill({json:fixture}));
 await page.reload();
 await page.locator('.paper-scroll').getByText('Print lifecycle check',{exact:true}).waitFor();
 await page.getByLabel('Practice answers',{exact:true}).selectOption('none');
 await page.evaluate(()=>{window.__printedPages=0;window.print=()=>{window.__printedPages=document.querySelectorAll('.project-print .print-page').length;};});
 await page.getByRole('button',{name:'Print / save PDF',exact:true}).click();
 await page.waitForFunction(()=>window.__printedPages===1);
 await page.waitForFunction(()=>document.querySelectorAll('.project-print .print-page').length===0);
 // The CLI exporter can still prepare the print DOM explicitly.
 await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));
 await page.locator('.project-print .print-page').waitFor({state:'attached'});
 assert.deepEqual(errors,[]);
 console.log('PASS: Booklets opens while bank loading is stalled; previews mount only on expansion; restored PDF panel, navigation, printing, cleanup and export preparation.');
} finally {await browser.close();}
