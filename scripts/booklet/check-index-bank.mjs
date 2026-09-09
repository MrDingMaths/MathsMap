// Read-only browser verification of the staged or published import.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {makeBankManifest} from '../../src/lib/practice-question-model.js';
const work=process.argv[2],base=process.env.BOOKLET_TEST_BASE??'http://127.0.0.1:5175';
const bankRoot=work?path.join(work,'bank'):'booklets/question-bank';
const receipt=JSON.parse(await fs.readFile(work?path.join(work,'receipt.json'):'booklets/provenance/index-laws-complete-v1/bank-import.json','utf8'));
const records=await Promise.all(receipt.questions.map(q=>fs.readFile(path.join(bankRoot,q.bankId+'.json'),'utf8').then(JSON.parse)));
const byId=new Map(records.map(q=>[q.id,q]));
const out='.booklet-work/index-bank-browser';await fs.mkdir(out,{recursive:true});
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const page=await browser.newPage({viewport:{width:1600,height:1100}}),errors=[],report=[];
page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
await page.route('**/__booklet/**',async route=>{
  const req=route.request(),url=new URL(req.url());assert.equal(req.method(),'GET','Verification must never write');
  if(url.pathname==='/__booklet/bank/manifest')return route.fulfill({json:makeBankManifest(records)});
  if(url.pathname.startsWith('/__booklet/bank/questions/'))return route.fulfill({json:byId.get(decodeURIComponent(url.pathname.split('/').at(-1)))});
  return route.continue();
});
try{
  await page.goto(base+'/#/booklet?stage=builder',{waitUntil:'networkidle'});
  await page.locator('.question-card').first().waitFor();assert.equal(await page.locator('.question-card').count(),149);
  for(const sourceId of ['index-t1-q1','index-t1-q7','index-t2-q6','index-t7-q5','index-t7-q13','index-t8-q7','index-t8-q12','index-t8-q15','index-t9-q11','index-t10-q3']){
    const entry=receipt.questions.find(q=>q.sourceBlockId===sourceId);
    await page.getByLabel('Search question text or question ID',{exact:true}).fill(entry.bankId);
    await page.locator('.apply-filters-btn').click();assert.equal(await page.locator('.question-card').count(),1);
    await page.locator('.question-card__summary').click();await page.locator('.question-card__body').waitFor();
    await page.waitForFunction(()=>[...document.querySelectorAll('.question-card__body .tikz-wrap')].every(el=>el.querySelector('svg.tikz-svg')),{},{timeout:180000});
    await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
    assert.equal(await page.locator('.question-card .katex-error').count(),0,sourceId+' maths error');
    assert.equal(await page.locator('.question-card').getByText('Content reference needs review:',{exact:false}).count(),0);
    const broken=await page.locator('.question-card img').evaluateAll(imgs=>imgs.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src));assert.deepEqual(broken,[]);
    await page.locator('.question-card__body').screenshot({path:path.join(out,sourceId+'.png')});
    await page.locator('.question-card__solution > summary').click();await page.locator('.question-card__solution-content').waitFor();
    assert.equal(await page.locator('.question-card__solution-content .katex-error').count(),0);
    await page.locator('.question-card__solution-content').screenshot({path:path.join(out,sourceId+'-solutions.png')});
    report.push({sourceId,bankId:entry.bankId,questionAndSolutionRendered:true});
  }
  assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'report.json'),JSON.stringify({questionsAvailable:149,report,errors},null,2)+'\n');
  console.log(JSON.stringify({questionsAvailable:149,representativePreviews:report.length,errors,out}));
}finally{await browser.close();}
