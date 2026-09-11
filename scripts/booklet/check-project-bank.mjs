// Read-only browser review of an isolated staged bank; no live publication calls.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {makeBankManifest} from '../../src/lib/practice-question-model.js';
const arg=(n,d)=>{const i=process.argv.indexOf(n);return i<0?d:process.argv[i+1];};
const stage=arg('--stage'),out=arg('--out'),base=arg('--base','http://127.0.0.1:5173');
assert.ok(stage&&out);
const receipt=JSON.parse(await fs.readFile(path.join(stage,'receipt.json'),'utf8'));
const representatives=JSON.parse(await fs.readFile(arg('--representatives'),'utf8'));
const records=await Promise.all(receipt.questions.map(q=>fs.readFile(path.join(stage,'bank',q.bankId+'.json'),'utf8').then(JSON.parse)));
const byId=new Map(records.map(q=>[q.id,q]));await fs.mkdir(out,{recursive:true});
const started=new Date().toISOString();let browser;
try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const cache=arg('--cache','.booklet-work/flexible-check/cache.json');
const context=await browser.newContext({viewport:{width:1600,height:1100},...(await fs.access(cache).then(()=>true,()=>false)?{storageState:cache}:{})});
const page=await context.newPage(),errors=[],report=[];page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
await page.route('**/__booklet/**',async route=>{
  const req=route.request(),url=new URL(req.url());assert.equal(req.method(),'GET','Browser verification must never write');
  if(url.pathname==='/__booklet/bank/manifest')return route.fulfill({json:makeBankManifest(records)});
  if(url.pathname.startsWith('/__booklet/bank/questions/'))return route.fulfill({json:byId.get(decodeURIComponent(url.pathname.split('/').at(-1)))});
  return route.continue();
});
const ready=async()=>{
  await page.waitForFunction(()=>[...document.querySelectorAll('.question-card .tikz-wrap')].every(el=>el.querySelector('svg.tikz-svg')),{},{timeout:600000});
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
  assert.equal(await page.locator('.question-card .katex-error').count(),0);
  assert.equal(await page.locator('.question-card').getByText('Content reference needs review:',{exact:false}).count(),0);
  assert.deepEqual(await page.locator('.question-card img').evaluateAll(imgs=>imgs.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src)),[]);
  assert.deepEqual(await page.locator('.question-card .tikz-wrap svg').evaluateAll(svgs=>svgs.filter(s=>getComputedStyle(s).filter!=='none').map(s=>({filter:getComputedStyle(s).filter}))),[],'Paper diagrams must retain their colours in dark mode');
};
try{
  await page.goto(base+'/#/booklet?stage=builder',{waitUntil:'networkidle'});
  // Keep fixed application chrome out of element screenshots without altering
  // question/answer layout or ink. The surrounding application is not evidence.
  await page.evaluate(()=>{for(const el of document.querySelectorAll('body *'))if(['fixed','sticky'].includes(getComputedStyle(el).position)&&!el.closest('.question-card'))el.style.position='static';});
  await page.locator('.question-card').first().waitFor();assert.equal(await page.locator('.question-card').count(),records.length);
  for(const sourceId of representatives){
    const entry=receipt.questions.find(q=>q.sourceBlockId===sourceId);assert.ok(entry,sourceId);
    await page.getByLabel('Search question text or question ID',{exact:true}).fill(entry.bankId);
    await page.locator('.apply-filters-btn').click();assert.equal(await page.locator('.question-card').count(),1);
    await page.locator('.question-card__summary').click();await page.locator('.question-card__body').waitFor();await ready();
    const questionFile=path.join(out,sourceId+'.png');await page.locator('.question-card__body').screenshot({path:questionFile});
    await page.locator('.question-card__solution > summary').click();await page.locator('.question-card__solution-content').waitFor();await ready();
    const solutionFile=path.join(out,sourceId+'-solutions.png');await page.locator('.question-card__solution-content').screenshot({path:solutionFile});
    report.push({sourceId,bankId:entry.bankId,questionFile,solutionFile});console.log('Rendered '+sourceId);
  }
  assert.deepEqual(errors,[]);await context.storageState({path:path.join(out,'cache.json')});
  await fs.writeFile(path.join(out,'report.json'),JSON.stringify({started,finished:new Date().toISOString(),questionsAvailable:records.length,report,errors},null,2)+'\n');
  console.log(JSON.stringify({questionsAvailable:records.length,representatives:report.length,errors,out}));
}finally{await browser.close();}
