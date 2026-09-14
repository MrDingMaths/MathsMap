// Read-only browser verification of the staged or published import.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {makeBankManifest} from '../../src/lib/practice-question-model.js';
const arg=(k,d)=>{const i=process.argv.indexOf(k);return i<0?d:process.argv[i+1];};
const work=arg('--stage'),projectId=arg('--project','volume-v1'),base=arg('--base','http://127.0.0.1:5297');
const bankRoot=work?path.join(work,'bank'):'booklets/question-bank';
const receipt=JSON.parse(await fs.readFile(work?path.join(work,'receipt.json'):'booklets/provenance/'+projectId+'/bank-import.json','utf8'));
const records=await Promise.all(receipt.questions.map(q=>fs.readFile(path.join(bankRoot,q.bankId+'.json'),'utf8').then(JSON.parse)));
const byId=new Map(records.map(q=>[q.id,q]));
const out=arg('--out','.booklet-work/volume-bank/bank-previews');await fs.mkdir(out,{recursive:true});
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const page=await browser.newPage({viewport:{width:1600,height:1100},...(arg('--cache')?{storageState:arg('--cache')}:{})}),errors=[],report=[];
page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
await page.route('**/__booklet/**',async route=>{
  const req=route.request(),url=new URL(req.url());assert.equal(req.method(),'GET','Verification must never write');
  if(url.pathname==='/__booklet/bank/manifest')return route.fulfill({json:makeBankManifest(records)});
  if(url.pathname.startsWith('/__booklet/bank/questions/'))return route.fulfill({json:byId.get(decodeURIComponent(url.pathname.split('/').at(-1)))});
  return route.continue();
});
try{
  await page.goto(base+'/#/booklet?stage=builder',{waitUntil:'networkidle'});
  await page.locator('.question-card').first().waitFor();assert.equal(await page.locator('.question-card').count(),records.length);
  for(const sourceId of arg('--ids','p4-q1,p6-q2,p7-q4,p12-q2,p16-q1,p20-q1,p26-q7,p28-q15,p31-q4,p37-q7,p38-q11,p40-q20').split(',')){
    const entry=receipt.questions.find(q=>q.sourceBlockId===sourceId);
    await page.getByLabel('Search question text or question ID',{exact:true}).fill(entry.bankId);
    await page.locator('.apply-filters-btn').click();assert.equal(await page.locator('.question-card').count(),1);
    await page.locator('.question-card__summary').click();await page.locator('.question-card__body').waitFor();
    await page.waitForFunction(()=>[...document.querySelectorAll('.question-card__body .tikz-wrap')].every(el=>el.querySelector('svg.tikz-svg')),{},{timeout:180000});
    await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
    assert.equal(await page.locator('.question-card .katex-error').count(),0,sourceId+' maths error');
    assert.equal(await page.locator('.question-card').getByText('Content reference needs review:',{exact:false}).count(),0,sourceId+' arrangement references');
    const broken=await page.locator('.question-card img').evaluateAll(imgs=>imgs.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src));assert.deepEqual(broken,[]);
    await page.locator('.question-card__body').screenshot({path:path.join(out,sourceId+'.png')});
    await page.locator('.question-card__solution > summary').click();await page.locator('.question-card__solution-content').waitFor();
    await page.waitForFunction(()=>[...document.querySelectorAll('.question-card__solution-content .tikz-wrap')].every(el=>el.querySelector('svg.tikz-svg')),{},{timeout:180000});
    await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('.question-card__solution-content img')].map(i=>i.decode()));});
    assert.equal(await page.locator('.question-card__solution-content .katex-error').count(),0);
    await page.locator('.question-card__solution-content').screenshot({path:path.join(out,sourceId+'-solutions.png')});
    report.push({sourceId,bankId:entry.bankId,questionAndSolutionRendered:true});
  }
  assert.deepEqual(errors,[]);await fs.writeFile(path.join(out,'report.json'),JSON.stringify({questionsAvailable:records.length,report,errors},null,2)+'\n');
  console.log(JSON.stringify({questionsAvailable:records.length,representativePreviews:report.length,errors,out}));
}finally{await browser.close();}
