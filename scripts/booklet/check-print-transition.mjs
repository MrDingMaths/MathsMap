// Exercise Chromium's real screen-to-print transition. Waiting in print media
// before exporting conceals animations whose initial frame makes a PDF blank.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright-core';
import {normalizeEditableProject} from '../../src/lib/editable-booklet-model.js';

const out='.booklet-work/print-transition';
fs.mkdirSync(out,{recursive:true});
const started=Date.now();
const question=(id,prompt,answer)=>({id,type:'question',content:{id:id+'-root',type:'question',prompt,answer:{short:answer,worked:answer}}});
const record=normalizeEditableProject({id:'print-transition-check',title:'Print transition check',revision:1,
 settings:{paginationMode:'flexible',generatedCover:false,flowEdition:'student',exerciseOrganisation:'topic'},
 topics:[{id:'angles',title:'Angle relationships'}],
 sections:[{id:'practice',topicId:'angles',phase:'practice',title:'Practice',blocks:[
  question('q1','Calculate the missing angle on a straight line.','The missing angle is 120 degrees.'),
  {id:'manual-break',type:'page-break'},
  question('q2','Calculate the missing angle in a triangle.','The missing angle is 60 degrees.')]}]});
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1366,height:768}});
const errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/__booklet/**',route=>{
 const request=route.request(),url=new URL(request.url());
 if(request.method()!=='GET')return route.fulfill({status:409,json:{error:'Read-only print regression'}});
 if(url.pathname==='/__booklet/projects')return route.fulfill({json:[record]});
 if(url.pathname==='/__booklet/projects/'+record.id)return route.fulfill({json:record});
 if(/files|assets/.test(url.pathname))return route.continue();
 return route.fulfill({json:url.pathname.endsWith('/manifest')?{questions:[]}:{items:[]}});
});
const ready=()=>page.waitForFunction(()=>document.querySelector('.flow-document')?.dataset.paginationState==='ready');
const capture=async name=>{
 const file=path.join(out,name+'.pdf');
 await page.pdf({path:file,format:'A4',printBackground:true,preferCSSPageSize:true,margin:{top:0,bottom:0,left:0,right:0}});
 const text=execFileSync('pdftotext',['-layout',file,'-'],{encoding:'utf8',windowsHide:true});
 const pages=text.split('\f').slice(0,-1);
 assert.ok(pages.length,'PDF has no pages');
 assert.ok(pages.every(p=>p.trim().length>30),name+': blank PDF page');
 assert.ok(!text.includes('My learning')&&!text.includes('Layout & spacing'),name+': workspace leaked into PDF');
 return pages;
};
try {
 await page.goto((process.env.BOOKLET_TEST_BASE??'http://127.0.0.1:5173')+'/#/booklet?stage=projects&project='+record.id);
 await ready();
 // The visible PDF action and keyboard shortcut must prepare pages before print.
 await page.evaluate(()=>{window.__printChecks=[];window.print=()=>window.__printChecks.push(document.querySelectorAll('.project-print .print-page').length);});
 await page.getByRole('button',{name:'PDF',exact:true}).click();
 await page.getByRole('button',{name:'Print / save PDF',exact:true}).click();
 await page.waitForFunction(()=>window.__printChecks.length===1);
 await page.keyboard.press('Control+p');
 await page.waitForFunction(()=>window.__printChecks.length===2);
 assert.ok((await page.evaluate(()=>window.__printChecks)).every(n=>n===2),'Print action did not prepare both pages');
 for(const edition of ['student','short','worked','with-short','with-worked']) {
  await page.getByRole('combobox',{name:'Booklet edition',exact:true}).selectOption(edition);
  await ready();
  await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));
  await page.locator('.project-print .print-page').first().waitFor({state:'attached'});
  await page.evaluate(()=>document.fonts.ready);
  // No print emulation/wait here: this is the browser print dialog's transition.
  const immediate=await capture(edition+'-immediate');
  await page.emulateMedia({media:'print'});
  await page.waitForTimeout(500);
  const settled=await capture(edition+'-settled');
  assert.deepEqual(immediate,settled,edition+': print transition changed page content or pagination');
  checks.push({edition,pages:immediate.length});
  await page.emulateMedia({media:null});
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,errors,elapsedMs:Date.now()-started},null,2));
 console.log(JSON.stringify(checks));
} finally {await browser.close();}
