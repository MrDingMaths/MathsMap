// Read-only benchmark: use the real saved booklet, intercept all writes.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const arg=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const output=arg('--out','.booklet-work/pagination-benchmark.json');
let project=JSON.parse(fs.readFileSync('booklets/projects/linear-relationships-flexible-v1.json'));
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const errors=[],report=[];
try{
 const cache='.booklet-work/flexible-check/cache.json';
 const context=await browser.newContext({viewport:{width:1600,height:1100},...(!process.argv.includes('--cold-diagrams')&&fs.existsSync(cache)?{storageState:cache}:{})});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/__booklet/**',route=>{
  const request=route.request(),url=new URL(request.url());
  if(url.pathname==='/__booklet/projects')return route.fulfill({json:[project]});
  if(url.pathname==='/__booklet/projects/'+project.id){if(request.method()==='PUT'){project={...request.postDataJSON().project,revision:project.revision+1};}return route.fulfill({json:project});}
  if(url.pathname==='/__booklet/bank/manifest')return route.fulfill({json:{questions:[]}});
  if(url.pathname.endsWith('/bank-sync'))return route.fulfill({json:{items:[]}});
  return request.method()==='GET'?route.fallback():route.abort();
 });
 const ready=async name=>{
  await page.waitForFunction(()=>{const el=document.querySelector('.flow-document');return el?.dataset.paginationState==='error'||el?.dataset.paginationState==='ready'&&el.dataset.paginatedEdition===document.querySelector('[aria-label="Booklet edition"]')?.value;},null,{timeout:300000});
  assert.equal(await page.locator('.flow-document').getAttribute('data-pagination-state'),'ready');
  assert.deepEqual(await page.locator('.layout-issue').allTextContents(),[]);
  const stats=JSON.parse(await page.locator('.flow-document').getAttribute('data-pagination-metrics'));
  const result={name,pages:await page.locator('.page-marker').count(),...stats};report.push(result);console.log(JSON.stringify(result));
 };
 await page.goto('http://127.0.0.1:5173/#/booklet?stage=projects&project='+project.id,{waitUntil:'domcontentloaded'});
 await ready('open');assert.equal(report.at(-1).pages,93);
 await page.getByLabel('Booklet edition',{exact:true}).selectOption('short');await ready('short');
 await page.getByLabel('Booklet edition',{exact:true}).selectOption('student');await ready('return-to-questions');
 await page.getByRole('button',{name:/^Question 2/}).first().click();
 await page.getByRole('button',{name:'Duplicate',exact:true}).click();await ready('duplicate');
 await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
 await page.getByRole('button',{name:'Undo',exact:true}).click();await ready('undo');
 assert.equal(report.at(-1).pages,93);assert.deepEqual(errors,[]);
 fs.mkdirSync('.booklet-work',{recursive:true});fs.writeFileSync(output,JSON.stringify({report,errors},null,2)+'\n');
}finally{await browser.close();}
