// Real Review content in isolated, in-memory projects. No workspace/API writes.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {teachingLabels,usesReviewNumbers} from '../../src/lib/booklet-labels.js';
import {arrangementCatalog} from '../../src/lib/booklet-arrangement.js';
const base=process.env.BOOKLET_TEST_BASE??'http://127.0.0.1:5175',out='.booklet-work/review-numbering';
fs.mkdirSync(out,{recursive:true});
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const reports=[];
try{for(const name of ['linear-relationships-v1','index-laws-complete-v1']){
 let project=JSON.parse(fs.readFileSync('booklets/projects/'+name+'.json'));
 project.id='review-check-'+name;
 project.sections=project.sections.map(s=>({...s,blocks:s.blocks.filter(usesReviewNumbers)})).filter(s=>s.blocks.length);
 const blocks=project.sections.flatMap(s=>s.blocks),labels=teachingLabels(blocks);
 // Cover the existing saved-arrangement path as well as generated layouts.
 const first=blocks[0],saved=arrangementCatalog(first).initial;
 saved.root.children=saved.root.children.filter(n=>n.ref!==first.content.id+'/label');
 project.settings.layoutOverrides.blockLayouts[first.id]={...project.settings.layoutOverrides.blockLayouts[first.id],arrangement:saved};
 project.settings.showReviewAnswers=false;
 const page=await browser.newPage({viewport:{width:1500,height:1100}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(60000);
 await page.route('**/__booklet/**',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.pathname==='/__booklet/projects')return route.fulfill({json:[project]});
  if(url.pathname==='/__booklet/projects/'+project.id){
   if(req.method()==='PUT'){const body=req.postDataJSON();assert.equal(body.expectedRevision,project.revision);project={...body.project,revision:project.revision+1};}
   return route.fulfill({json:project});
  }
  if(url.pathname.includes('bank-sync'))return route.fulfill({json:{items:[]}});
  if(url.pathname.endsWith('/manifest'))return route.fulfill({json:{questions:[]}});
  if(req.method()==='GET'&&/files|assets/.test(url.pathname))return route.continue();
  return route.fulfill({json:[]});
 });
 const ready=()=>page.waitForFunction(()=>document.querySelector('.project-print')?.dataset.paginationState==='ready',null,{timeout:300000});
 const prepare=async()=>{await ready();await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));await page.locator('.project-print .print-page').first().waitFor({state:'attached'});};
 await page.goto(base+'/#/booklet?stage=projects&project='+project.id,{waitUntil:'domcontentloaded'});await prepare();await page.emulateMedia({media:'print'});
 for(const b of blocks){
  const root=page.locator(`.project-print [data-arrangement-block="${b.id}"]`).first();
  const label=root.locator(`[data-content-owner="${b.content.id}"].label-item`);
  assert.equal((await label.innerText()).trim(),labels[b.content.id],b.id);
  assert.equal(await root.locator('.review-checkbox').count(),0);
  assert.ok(!/[☐□▢]/u.test(await root.innerText()),b.id+' has a checkbox glyph');
  const aligned=await root.evaluate((el,id)=>{const label=el.querySelector(`[data-content-owner="${id}"].label-item`),prompt=[...el.querySelectorAll(`[data-content-owner="${id}"].arr-item`)].find(e=>!e.classList.contains('label-item')&&!e.querySelector('.arr-space'));return !prompt||Math.abs(label.getBoundingClientRect().top-prompt.getBoundingClientRect().top)<3;},b.content.id);
  assert.ok(aligned,b.id+' number must align with first prompt line');
 }
 await page.emulateMedia({media:'print'});
 const groups=page.locator('.project-print .atom-body.review-body');
 for(let i=0;i<await groups.count();i++)await groups.nth(i).screenshot({path:`${out}/${name}-review-${i+1}.png`});
 await page.emulateMedia({media:'screen'});
 // Exercise inline edit, intercepted save and reload with the custom layout.
 const field=page.locator(`.flow-paper [data-edit-root="${first.content.id}"][data-edit-path="/prompt"] .clickable`).first();
 await field.scrollIntoViewIfNeeded();await field.click();await page.locator('maths-editor .me-content').waitFor();await page.keyboard.press('End');await page.keyboard.type(' Review numbering check.');
 await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');await page.reload();await prepare();
 assert.equal((await page.locator(`.project-print [data-arrangement-block="${first.id}"] [data-content-owner="${first.content.id}"].label-item`).first().innerText()).trim(),'1');
 await page.getByRole('button',{name:'PDF',exact:true}).click();await page.getByLabel('Show review answers',{exact:true}).check();await prepare();
 assert.ok(await page.locator('.project-print .worked-content').count()>0);
 assert.ok(!/[☐□▢]/u.test(await page.locator('.project-print').innerText()));
 await page.getByLabel('Show review answers',{exact:true}).uncheck();await prepare();
 for(const edition of ['short','worked']){await page.getByLabel('Booklet edition',{exact:true}).selectOption(edition);await page.waitForFunction(edition=>{const e=document.querySelector('.project-print');return e?.dataset.paginationState==='ready'&&e.dataset.flowEdition===edition;},edition,{timeout:300000});assert.equal(await page.locator('.project-print .review-body').count(),0);}
 assert.deepEqual(errors,[]);reports.push({name,prompts:blocks.length,groups:new Set(blocks.map(b=>b.sourceAtom.id)).size,labels:true,alignment:true,editSaveReload:true,answerControls:true});await page.close();console.log('Verified '+name);
}
fs.writeFileSync(out+'/browser-report.json',JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));
}finally{await browser.close();}
