// Real editable/printed answer-grid regression. All project saves stay in memory.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createEditableProject} from '../../src/lib/editable-booklet-model.js';
import {fromSource,contentSource} from '../../src/lib/document-content.js';
import {inspectPrintedPdf} from './pdf-layout-qa.mjs';

const arg=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const out=arg('--out','.booklet-work/adaptive-short-answers-20260916/editor');fs.mkdirSync(out,{recursive:true});
const part=(id,short)=>({id,label:id.at(-1),prompt:'Find the answer.',answer:{short,worked:'$x=1$'},children:[]});
const question=(id,answers)=>({id,type:'question',content:{id:id+'root',prompt:'Find each value.',children:answers.map((v,i)=>part(id+String.fromCharCode(97+i),v))}});
let record=createEditableProject({id:'short-grid-editor-check',title:'Adaptive short answers',settings:{paginationMode:'flexible',exerciseOrganisation:'topic',compactAnswers:{},flowEdition:'short',generatedCover:false},topics:[{id:'angles',title:'Angle relationships'},{id:'algebra',title:'Algebra'}],sections:[
  {id:'s1',topicId:'angles',phase:'practice',blocks:[question('q1',['$315^\\circ$','$330^\\circ$','$160^\\circ$','$26^\\circ$','$80^\\circ$','$65^\\circ$']),{id:'q2',type:'question',content:{id:'q2root',prompt:'Can both measurements be correct?',answer:{short:'$82^\\circ+284^\\circ=366^\\circ$, but angles around a point sum to $360^\\circ$. The measurements cannot both be correct.',worked:'Angles around a point sum to $360^\\circ$.'}}},question('q3',['$134^\\circ$','$90^\\circ$','$60^\\circ$','$49^\\circ$','$180^\\circ$','$138^\\circ$'])]},
  {id:'s2',topicId:'algebra',phase:'practice',blocks:[question('q4',['$\\frac{x+5}{x}$','$\\frac{x+2}{2x-1}$',fromSource('$\\frac{y+2}{2}$'),'$(x+1)(x-1)(x^2+1)$','$(2a-5)(2a+5)$','$x=3$. Factorise, then set each factor equal to zero.']),{id:'table',type:'question',content:{id:'tableroot',prompt:'Complete the table.',answer:{short:'| $x$ | $y$ |\n|---|---|\n| $1$ | $2$ |',worked:'Read each coordinate.'}}}]}
]});record.revision=1;
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const page=await browser.newPage({viewport:{width:1500,height:1150}}),errors=[],checks=[];let writes=0;
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/__booklet/**',route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.pathname==='/__booklet/projects')return route.fulfill({json:[record]});
  if(url.pathname===`/__booklet/projects/${record.id}/open`)return route.fulfill({json:{project:record,bankSync:{items:[]}}});
  if(url.pathname===`/__booklet/projects/${record.id}`){if(req.method()==='PUT'){const body=req.postDataJSON();assert.equal(body.expectedRevision,record.revision);record={...body.project,revision:record.revision+1};writes++;}return route.fulfill({json:record});}
  if(url.pathname.endsWith('/bank-sync'))return route.fulfill({json:{items:[]}});
  if(url.pathname.endsWith('/bank/manifest'))return route.fulfill({json:{questions:[]}});
  return req.method()==='GET'?route.fallback():route.abort();
});
const ready=()=>page.waitForFunction(()=>document.querySelector('.flow-document')?.dataset.paginationState==='ready',null,{timeout:120000});
const rows=()=>page.locator('.flow-paper .answer-row-grid').evaluateAll(els=>els.map(e=>[...e.querySelectorAll('.answer-label')].map(n=>n.textContent)));
const snapshot=()=>page.locator('.flow-paper').first().evaluate(root=>({
  rows:[...root.querySelectorAll('.answer-row-grid')].map(e=>[...e.querySelectorAll('.answer-label')].map(n=>n.textContent)),
  dividers:[...root.querySelectorAll('.answer-item')].map(e=>getComputedStyle(e).borderBottomWidth),
  exerciseRules:[...root.querySelectorAll('h2')].map(e=>getComputedStyle(e).borderBottomWidth),
  tables:[...root.querySelectorAll('td')].map(e=>getComputedStyle(e).borderBottomWidth),
}));
async function print(name){
  await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));
  await page.locator('.project-print .print-page').first().waitFor({state:'attached'});
  await page.emulateMedia({media:'print'});
  const qa=await page.evaluate(async()=>{const {settleBooklet,inspectBooklet}=await import('/src/lib/booklet-qa.js');const root=document.querySelector('.project-print');await settleBooklet(root);return inspectBooklet(root,{style:true});});
  assert.deepEqual(qa.flatMap(p=>p.issues),[]);
  const pdf=out+'/'+name+'.pdf';await page.pdf({path:pdf,format:'A4',printBackground:true,preferCSSPageSize:true});
  const printed=inspectPrintedPdf(pdf);assert.deepEqual(printed.flatMap(p=>p.issues),[]);
  await page.emulateMedia({media:'screen'});return {qa,printed};
}
try{
  await page.goto(arg('--base','http://127.0.0.1:5173')+'/#/booklet?stage=projects&project='+record.id);await ready();
  await page.getByLabel('Booklet edition',{exact:true}).selectOption('short');await ready();
  const before=await snapshot();assert.deepEqual(before.rows.slice(0,3),[['1a','1b','1c'],['1d','1e','1f'],['2']]);
  await page.evaluate(async()=>{const {measurementStore}=await import('/src/lib/booklet-render-cache.js');await measurementStore.flush();});
  await page.reload();await ready();assert.deepEqual(await rows(),before.rows);checks.push('persistent-width-probe-parity');
  assert.ok(before.dividers.every(w=>parseFloat(w)===0));assert.ok(before.exerciseRules.every(w=>parseFloat(w)>0));assert.ok(before.tables.length&&before.tables.every(w=>parseFloat(w)>0));
  checks.push('three-across-angles','full-width-explanation','no-answer-dividers','exercise-and-table-rules');
  await page.getByLabel('Booklet zoom',{exact:true}).selectOption('0.75');assert.deepEqual(await rows(),before.rows);
  await page.getByLabel('Booklet zoom',{exact:true}).selectOption('1');checks.push('zoom-parity');
  await page.locator('.flow-paper .booklet-page').first().screenshot({path:out+'/representative.png'});
  const shortPdf=await print('representative-short');
  const field=page.locator('.flow-paper [data-edit-root="q1a"][data-edit-path="/answer/short"]').first();
  await field.locator('.clickable').click();await field.locator('maths-editor .me-content').waitFor();
  await field.locator('.me-content').evaluate(el=>{const range=document.createRange();range.selectNodeContents(el.querySelector('p'));range.collapse(false);getSelection().removeAllRanges();getSelection().addRange(range);el.focus();});
  await page.keyboard.type(' Use the angle sum around a point.');
  await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');await ready();
  const editedRows=await rows();
  await page.evaluate(async()=>{const {measurementStore}=await import('/src/lib/booklet-render-cache.js');await measurementStore.flush();});
  assert.match(contentSource(record.sections[0].blocks[0].content.children[0].answer.short),/angle sum/);
  await page.reload();await ready();await page.getByLabel('Booklet edition',{exact:true}).selectOption('short');await ready();
  const after=await snapshot();assert.deepEqual(after.rows,editedRows);assert.deepEqual(after.rows[0],['1a']);checks.push('native-edit-save-reopen','long-answer-reflows');
  await page.reload();await ready();assert.deepEqual(await rows(),after.rows);checks.push('cached-reopen-parity');
  await page.getByLabel('Booklet edition',{exact:true}).selectOption('worked');await ready();
  const worked=await snapshot();assert.ok(worked.dividers.every(w=>parseFloat(w)>0));checks.push('worked-rules-retained');
  const workedPdf=await print('representative-worked');
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/report.json',JSON.stringify({checks,writes,errors,before,after,shortPdf,workedPdf},null,2));console.log(JSON.stringify({checks,writes,errors,out}));
}catch(e){await page.screenshot({path:out+'/failure.png'});fs.writeFileSync(out+'/failure.json',JSON.stringify({error:e.stack,checks,errors,body:(await page.locator('body').innerText()).slice(-5000)},null,2));throw e;}finally{await browser.close();}
