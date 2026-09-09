// Isolated loading/route regression. Never writes to workspace projects or the bank.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {createEditableProject} from '../../src/lib/editable-booklet-model.js';
import {applyCreationPreset} from '../../src/lib/booklet-creation.js';
import {studioProject} from '../../src/lib/booklet-review-model.js';

const base=process.argv[2]??'http://127.0.0.1:5173';
const project=studioProject(applyCreationPreset(createEditableProject({id:'loading-check',title:'Loading check',sections:[
  {id:'content',title:'Content',phase:'teaching',blocks:[{id:'text',type:'rich-text',content:'Isolated loading verification.'}]},
]})));
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
try{
 const page=await browser.newPage(),writes=[],errors=[];
 page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
 let releaseBank;const bankGate=new Promise(resolve=>{releaseBank=resolve;});
 await page.route('**/__booklet/**',async route=>{
  const req=route.request(),pathname=new URL(req.url()).pathname;
  if(req.method()!=='GET'){writes.push(pathname);return route.abort();}
  if(pathname==='/__booklet/bank/manifest'){await bankGate;return route.fulfill({json:{questions:[]}});}
  if(pathname==='/__booklet/projects')return route.fulfill({json:[project]});
  if(pathname==='/__booklet/projects/'+project.id)return route.fulfill({json:project});
  if(pathname.endsWith('/bank-sync'))return route.fulfill({json:{items:[]}});
  return route.fulfill({json:[]});
 });
 await page.goto(base+'/#/booklet',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'Booklets',exact:true}).click();
 await page.getByLabel('Open booklet',{exact:true}).waitFor();
 assert.equal(await page.getByLabel('Open booklet',{exact:true}).inputValue(),'');
 assert.equal(await page.locator('.flow-document').count(),0,'No arbitrary project opens while the bank is loading');
 releaseBank();
 for(const stage of ['full-import','import','review']){
  await page.goto(`${base}/#/booklet?stage=${stage}&run=old&page=3&project=${project.id}`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(id=>location.hash===`#/booklet?stage=projects&project=${id}`,project.id);
  await page.locator('.flow-document[data-pagination-state="ready"]').waitFor().catch(async error=>{console.error((await page.locator('body').innerText()).slice(-2500));throw error;});
  assert.equal(await page.getByLabel('Open booklet',{exact:true}).inputValue(),project.id);
  assert.equal(await page.getByRole('button',{name:'Source reconstructions',exact:true}).count(),0);
 }
 assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
 console.log('PASS: Projects opens while bank loading is stalled; old links preserve an explicit project without creating or writing anything.');
}finally{await browser.close();}
