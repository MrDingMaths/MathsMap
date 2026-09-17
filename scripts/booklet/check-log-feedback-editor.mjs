// Disposable routed project: no authoring-server project or bank writes.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {normalizeEditableProject} from '../../src/lib/editable-booklet-model.js';
import {toSource} from '../../public/libs/maths-editor/document-model.mjs';
import {inspectFinalSizeDiagrams} from './diagram-preflight.mjs';
const out=process.env.BOOKLET_CHECK_OUT??'.booklet-work/log-feedback-r207-20260916/editor';fs.mkdirSync(out,{recursive:true});
const original=JSON.parse(fs.readFileSync('booklets/projects/logarithms-v1.json','utf8'));
const target=structuredClone(original.sections.flatMap(s=>s.blocks).find(b=>b.id==='p41-q5'));
const fillers=Array.from({length:4},(_,i)=>({id:'filler-'+i,type:'question',content:{id:'filler-root-'+i,prompt:'Disposable question '+i,answerSpaceMm:180,answer:{short:'Answer '+i,worked:'Working '+i}}}));
const fragmented={id:'fragmented',type:'question',content:{id:'fragmented-root',prompt:'Disposable long answer',answer:{short:{format:'maths-editor-document-v1',version:1,blocks:Array.from({length:80},(_,i)=>({id:'fragment-paragraph-'+i,type:'paragraph',inlines:[{type:'text',text:'Fragment '+i+'. '+('A complete explanation stays editable across page fragments. ').repeat(3)}]}))},worked:'A short worked answer.'}}};
let record=normalizeEditableProject({...original,id:'log-feedback-editor-fixture',title:'Disposable editor probe',settings:{...original.settings,generatedCover:false,flowEdition:'with-short'},topics:[{id:'t',title:'Probe'}],sections:[{id:'s',topicId:'t',phase:'practice',title:'Probe',blocks:[...fillers,fragmented,target]}]});record.revision=1;
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1600,height:1000}});
let writes=0,failNextSave=false,delayNextSave=0;const errors=[],checks=[],started=Date.now();page.on('pageerror',e=>errors.push(e.message));
await page.route('**/__booklet/**',async route=>{
 const req=route.request(),url=new URL(req.url());
 if(url.pathname==='/__booklet/projects')return route.fulfill({json:[record]});
 if(url.pathname.endsWith('/'+record.id+'/open'))return route.fulfill({json:{project:record,bankSync:{items:[]}}});
 if(url.pathname==='/__booklet/projects/'+record.id){if(req.method()==='PUT'){if(failNextSave){failNextSave=false;return route.fulfill({status:500,json:{error:'Disposable simulated save failure'}});}const body=req.postDataJSON();assert.equal(body.expectedRevision,record.revision);record={...body.project,revision:record.revision+1};writes++;const response=structuredClone(record),delay=delayNextSave;delayNextSave=0;if(delay)await new Promise(r=>setTimeout(r,delay));return route.fulfill({json:response});}return route.fulfill({json:record});}
 if(url.pathname.endsWith('/bank-sync'))return route.fulfill({json:{items:[]}});
 if(url.pathname.endsWith('/bank/manifest'))return route.fulfill({json:{questions:[]}});
 return req.method()==='GET'?route.fallback():route.abort();
});
const ready=()=>page.waitForFunction(()=>document.querySelector('.flow-document')?.dataset.paginationState==='ready',null,{timeout:120000});
const saved=async before=>{await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved',null,{timeout:15000});await ready();assert.ok(writes>before,'Save must reach the routed canonical project');};
const diagram=()=>page.locator('.flow-paper [data-diagram-id="p41-q5-a-solution-graph"]').first();
const view=()=>diagram().evaluate(el=>({width:el.offsetWidth*25.4/96,top:el.getBoundingClientRect().top,scroll:el.closest('.project-canvas').scrollTop,mode:el.dataset.answerMode}));
const setEdition=async edition=>{await page.getByLabel('Booklet edition',{exact:true}).selectOption(edition);await ready();};
try{
 await page.goto((process.env.BOOKLET_TEST_BASE??'http://127.0.0.1:5173')+'/#/booklet?stage=projects&project='+record.id);await ready();
 await diagram().scrollIntoViewIfNeeded();const before=await view();await diagram().dblclick();
 assert.ok(Math.abs(Number(await page.getByLabel('Diagram width (mm)',{exact:true}).inputValue())-45)<.3);
 await page.getByLabel('Diagram width (mm)',{exact:true}).fill('50');let count=writes;await page.locator('dialog').getByRole('button',{name:'Save',exact:true}).click();await saved(count);
 const after=await view();assert.ok(Math.abs(after.width-50)<.3);assert.ok(after.scroll>1000);assert.ok(Math.abs(after.top-before.top)<5);
 assert.equal(record.settings.compactAnswers.diagramWidths['p41-q5-a-solution-graph'].short,50);assert.equal(record.sections[0].blocks.at(-1).content.children[0].answer.solutionDiagrams[0].widthMm,128.4);
 checks.push('answer-size-and-viewport');
 const field=()=>page.locator('.flow-paper [data-edit-root="p41-q5-a"][data-edit-path="/answer/short"]').first();
 await field().scrollIntoViewIfNeeded();await field().locator('.clickable').click();await field().locator('.me-content').waitFor();
 await field().locator('.me-content').evaluate(el=>{el.focus();const r=document.createRange();r.selectNodeContents(el);getSelection().removeAllRanges();getSelection().addRange(r);});
 count=writes;await page.keyboard.press('Backspace');await page.waitForTimeout(700);await saved(count);
 assert.doesNotMatch(toSource(record.sections[0].blocks.at(-1).content.children[0].answer.short),/Horizontal translation/);
 assert.ok(await page.locator('.project-canvas').evaluate(el=>el.scrollTop)>1000);checks.push('keyboard-backspace-persists');
 count=writes;await page.getByRole('button',{name:'Undo',exact:true}).first().click();await page.waitForTimeout(700);await saved(count);
 assert.match(toSource(record.sections[0].blocks.at(-1).content.children[0].answer.short),/Horizontal translation/);
 count=writes;await page.getByRole('button',{name:'Redo',exact:true}).first().click();await page.waitForTimeout(700);await saved(count);
 assert.doesNotMatch(toSource(record.sections[0].blocks.at(-1).content.children[0].answer.short),/Horizontal translation/);checks.push('undo-redo-deletion');
 // A delayed acknowledgement must not restore text removed by a later Delete.
 await field().locator('.me-content').evaluate(el=>{el.focus();});delayNextSave=900;count=writes;await page.keyboard.type('Temporary rapid edit');
 while(writes===count)await page.waitForTimeout(50);
 await field().locator('.me-content').evaluate(el=>{el.focus();const r=document.createRange();r.selectNodeContents(el);getSelection().removeAllRanges();getSelection().addRange(r);});
 await page.keyboard.press('Delete');await page.waitForTimeout(1400);await saved(count);
 assert.doesNotMatch(toSource(record.sections[0].blocks.at(-1).content.children[0].answer.short),/Temporary rapid edit/);checks.push('rapid-delete-save-acknowledgement');
 await page.reload();await ready();assert.equal(record.settings.compactAnswers.diagramWidths['p41-q5-a-solution-graph'].short,50);checks.push('save-reopen');
 for(const [edition,width]of [['short',50],['with-worked',55],['worked',55],['with-short',50]]){await setEdition(edition);await diagram().scrollIntoViewIfNeeded();assert.ok(Math.abs((await view()).width-width)<.3,edition);}
 checks.push('independent-edition-sizes');
 await diagram().dblclick();const code=page.getByLabel('TikZ code',{exact:true}),source=await code.inputValue();await code.fill(source.replace('\\end{tikzpicture}','\\node at (0,0) {probe};\n\\end{tikzpicture}'));
 await page.waitForFunction(()=>document.querySelector('dialog .tikz-wrap svg')&&document.querySelector('dialog .tikz-wrap')?.dataset.state!=='pending');
 count=writes;await page.locator('dialog').getByRole('button',{name:'Save',exact:true}).click();
 if(await page.locator('dialog[open]').count()){await page.waitForTimeout(2000);if(await page.locator('dialog[open]').count())await page.locator('dialog').getByRole('button',{name:'Save',exact:true}).click();}
 await saved(count);assert.match(record.sections[0].blocks.at(-1).content.children[0].answer.solutionDiagrams[0].code,/\{probe\}/);checks.push('canonical-code-edit');
 await diagram().dblclick();await page.getByLabel('Diagram width (mm)',{exact:true}).fill('51');failNextSave=true;
 await page.locator('dialog').getByRole('button',{name:'Save',exact:true}).click();await page.locator('dialog .commit-error').waitFor();
 assert.equal(await page.getByLabel('Diagram width (mm)',{exact:true}).inputValue(),'51');assert.equal(await page.locator('dialog[open]').count(),1);
 count=writes;await page.locator('dialog').getByRole('button',{name:'Save',exact:true}).click();await saved(count);await page.locator('dialog[open]').waitFor({state:'detached'});checks.push('failed-save-retains-draft-and-retries');
 await setEdition('worked');await diagram().scrollIntoViewIfNeeded();await diagram().dblclick();assert.ok(Math.abs(Number(await page.getByLabel('Diagram width (mm)',{exact:true}).inputValue())-55)<.3);
 await page.getByLabel('Diagram width (mm)',{exact:true}).fill('60');count=writes;await page.locator('dialog').getByRole('button',{name:'Save',exact:true}).click();await saved(count);await page.locator('dialog[open]').waitFor({state:'detached'});
 const printChecks=[];
 for(const [edition,width]of [['short',51],['worked',60],['with-worked',60],['with-short',51]]){
  await setEdition(edition);await diagram().scrollIntoViewIfNeeded();assert.ok(Math.abs((await view()).width-width)<.3,edition);
  await page.evaluate(()=>window.dispatchEvent(new Event('booklet-prepare-print')));await page.locator('.project-print .print-page').first().waitFor({state:'attached'});await page.emulateMedia({media:'print'});
  await page.evaluate(async()=>{const {settleBooklet}=await import('/src/lib/booklet-qa.js');await settleBooklet(document.querySelector('.project-print'));});
  const printed=await inspectFinalSizeDiagrams(page);assert.deepEqual(printed.issues,[],edition+' typography');printChecks.push({edition,width,figures:printed.figures});
  await page.pdf({path:out+'/'+edition+'.pdf',format:'A4',printBackground:true,preferCSSPageSize:true,margin:{top:0,bottom:0,left:0,right:0}});await page.emulateMedia({media:'screen'});
 }
 checks.push('edited-diagram-four-edition-print-typography');
 // Select a paragraph in a later fragment, leaving the rest of that field intact.
 await page.locator('.project-canvas').evaluate(el=>el.scrollTop=0);await page.waitForTimeout(100);
 const fragment=()=>page.locator('.flow-paper [data-edit-root="fragmented-root"][data-edit-path="/answer/short"]').filter({has:page.locator('[data-id="fragment-paragraph-60"]')}).first();
 // Mount all pages by scrolling the virtualized document.
 await page.locator('.project-canvas').evaluate(async el=>{for(let y=0;y<el.scrollHeight;y+=500){el.scrollTop=y;await new Promise(r=>setTimeout(r,80));if(el.querySelector('.flow-paper [data-id="fragment-paragraph-60"]'))break;}});
 await fragment().scrollIntoViewIfNeeded();await fragment().locator('.clickable').click();
 const paragraph=fragment().locator('.me-content [data-id="fragment-paragraph-60"]');await paragraph.waitFor();await paragraph.evaluate(el=>{el.closest('.me-content').focus();const r=document.createRange();r.selectNodeContents(el);getSelection().removeAllRanges();getSelection().addRange(r);});
 count=writes;await page.keyboard.press('Delete');await page.waitForTimeout(700);await saved(count);
 const stored=record.sections[0].blocks.find(b=>b.id==='fragmented').content.answer.short;assert.ok(toSource(stored).includes('Fragment 59.'));assert.ok(toSource(stored).includes('Fragment 61.'));assert.ok(!toSource(stored).includes('Fragment 60.'));
 assert.ok(await page.locator('.project-canvas').evaluate(el=>el.scrollTop)>1000);checks.push('later-page-fragment-delete');
 assert.deepEqual(errors,[]);
 const report={checks,writes,errors,before,after,printChecks,elapsedMs:Date.now()-started};fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,printChecks:printChecks.map(({edition,width,figures})=>({edition,width,figures:figures.length}))}));
}catch(error){await page.screenshot({path:out+'/failure.png'});fs.writeFileSync(out+'/failure.json',JSON.stringify({error:error.stack,checks,errors,body:(await page.locator('body').innerText()).slice(-3000)},null,2));throw error;}finally{await browser.close();}
