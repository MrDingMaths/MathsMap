// In-memory writes only. No accepted projects or bank records are changed.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createEditableProject} from '../../src/lib/editable-booklet-model.js';
import {fromSource,toSource} from '../../public/libs/maths-editor/document-model.mjs';
const out='.booklet-work/document-editor-check';fs.mkdirSync(out,{recursive:true});
let record=createEditableProject({id:'document-check',title:'Document editor check',settings:{paginationMode:'flexible',generatedCover:false},topics:[{id:'topic',title:'Algebra'}],sections:[{id:'section',topicId:'topic',phase:'teaching',title:'Algebra',blocks:[{id:'theory',type:'rich-text',content:fromSource('First paragraph.\n\nSecond paragraph.')},{id:'next',type:'rich-text',content:fromSource('Another editable paragraph.')},{id:'example',type:'worked-example',title:'Example',content:fromSource('Simplify $x+x$.'),theorySolution:fromSource('$2x$')}]}]});record.revision=1;
const errors=[],writes=[];let failSave=false;
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const page=await browser.newPage({viewport:{width:1700,height:1100}});page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.stack);});
await page.context().route('**/__booklet/**',async route=>{
 const req=route.request(),url=new URL(req.url()),method=req.method();
 if(url.pathname==='/__booklet/projects'&&method==='GET')return route.fulfill({json:[{id:record.id,title:record.title,revision:record.revision}]});
 if(url.pathname===`/__booklet/projects/${record.id}`){if(method==='PUT'){if(failSave)return route.fulfill({status:503,json:{error:'Simulated save failure'}});const body=req.postDataJSON();assert.equal(body.expectedRevision,record.revision);record={...body.project,revision:record.revision+1};writes.push(record.revision);}return route.fulfill({json:record});}
 if(url.pathname.includes('bank-sync'))return route.fulfill({json:{items:[]}});
 if(url.pathname.endsWith('/manifest'))return route.fulfill({json:{questions:[]}});
 return route.fulfill({json:[]});
});
const saved=()=>page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');
try{
 await page.goto((process.env.BOOKLET_TEST_BASE??'http://127.0.0.1:5174')+'/#/booklet?stage=projects&project=document-check',{waitUntil:'networkidle'});
 await page.locator('[data-edit-root="theory"] .clickable').first().waitFor();
 await page.locator('[data-edit-root="example"][data-edit-path="/content"] .clickable .katex').first().click();
 try{await page.waitForFunction(()=>document.activeElement?.matches('math-field'));}catch(error){console.log('Equation focus diagnostic',JSON.stringify(await page.evaluate(()=>({active:document.activeElement?.outerHTML.slice(0,400),fields:[...document.querySelectorAll('maths-editor math-field')].map(e=>({value:e.value,connected:e.isConnected,focus:e.hasFocus?.()}))}))));throw error;}
 await page.locator('[data-edit-root="theory"] .clickable').first().click();
 const surface=page.locator('[data-edit-root="theory"] .me-content');await surface.waitFor();
 await page.keyboard.press('End');await page.keyboard.type(' Added live.');await saved();assert.match(toSource(record.sections[0].blocks[0].content),/Added live/);
 assert.equal(await page.locator('dialog[open]').count(),0);
 await page.locator('[data-edit-root="next"] .clickable').click();await page.locator('[data-edit-root="next"] .me-content').waitFor();await page.keyboard.press('End');await page.keyboard.type(' Second edit.');await saved();
 assert.match(toSource(record.sections[0].blocks[1].content),/Second edit/);
 await page.getByRole('button',{name:'Undo',exact:true}).click();await saved();assert.doesNotMatch(toSource(record.sections[0].blocks[1].content),/Second edit/);
 await page.getByRole('button',{name:'Redo',exact:true}).click();await saved();assert.match(toSource(record.sections[0].blocks[1].content),/Second edit/);
 await page.locator('.document-insert > summary').filter({hasText:/^Comments(?:\s|$)/}).click();await page.getByRole('button',{name:'Add comment',exact:true}).click();await page.getByLabel('Comment',{exact:true}).fill('Keep the alignment consistent across the booklet.');await page.getByRole('button',{name:'Add comment',exact:true}).last().click();await saved();assert.equal(record.studio.flags.length,1);
 await page.getByRole('button',{name:'Copy feedback prompt',exact:true}).click();await page.getByLabel('Feedback prompt',{exact:true}).waitFor();assert.match(await page.getByLabel('Feedback prompt',{exact:true}).inputValue(),/Saved revision/);
 await page.getByRole('button',{name:'Close panel',exact:true}).click();
 const handle=page.locator('[data-document-group="next"] .group-handle');await handle.click();await page.keyboard.press('Delete');await saved();assert.equal(record.sections[0].blocks.length,2);
 await page.getByRole('button',{name:'Undo',exact:true}).click();await saved();assert.equal(record.sections[0].blocks.length,3);
 // A new template is immediately writable and has no printed placeholder text.
 await page.locator('.document-insert > summary').filter({hasText:/^Insert$/}).click();await page.locator('.document-insert').getByRole('button',{name:'Definition / Theory',exact:true}).click();
 await page.locator('maths-editor .me-content').waitFor();await page.keyboard.type('A new definition.');await saved();
 assert.ok(record.sections[0].blocks.some(b=>b.sourceAtom?.kind==='definition'));
 assert.ok(record.sections[0].blocks.some(b=>b.content?.format&&toSource(b.content).includes('A new definition.')));
 await page.getByRole('button',{name:'Maths',exact:true}).click();await page.locator('.me-content math-field').last().waitFor({state:'attached'});await page.keyboard.type('x+1');await page.keyboard.press('Escape');await saved();
 assert.match(JSON.stringify(record.sections[0].blocks),/x\+1/);
 // Select across two independently structured fields and format them together.
 await page.getByRole('button',{name:'Spacing',exact:true}).click();await page.getByRole('button',{name:'Close panel',exact:true}).click();
 await page.evaluate(()=>{const a=document.querySelector('[data-edit-root="theory"] .clickable'),b=document.querySelector('[data-edit-root="next"] .clickable');const r=document.createRange();r.setStart(a,0);r.setEnd(b,b.childNodes.length);getSelection().removeAllRanges();getSelection().addRange(r);});
 await page.getByRole('button',{name:'Bold',exact:true}).click();await saved();assert.match(JSON.stringify(record.sections[0].blocks.find(b=>b.id==='next').content),/bold/);
 // Save failure must not export a stale revision or discard local comments.
 await page.locator('.document-insert > summary').filter({hasText:/^Comments(?:\s|$)/}).click();await page.getByRole('button',{name:'Add comment',exact:true}).click();await page.getByLabel('Comment',{exact:true}).fill('Unsaved feedback survives a failed save.');failSave=true;await page.getByRole('button',{name:'Add comment',exact:true}).last().click();
 await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Save failed');
 await page.getByRole('button',{name:'Copy feedback prompt',exact:true}).click();await page.waitForFunction(()=>document.body.textContent.includes('Your comments and edits are retained'));
 failSave=false;await page.keyboard.press('Control+s');await saved();assert.equal(record.studio.flags.length,2);
 await page.getByRole('button',{name:'Close panel',exact:true}).click();
 await page.screenshot({path:out+'/workspace.png'});
 await page.reload({waitUntil:'networkidle'});await page.locator('[data-edit-root="theory"] .clickable').first().waitFor();assert.equal(record.studio.flags.length,2);
 // A TikZ object has direct page controls and opens its specialist in one step.
 const tikz='\\begin{tikzpicture}\\draw (0,0) -- (1,1);\\end{tikzpicture}';
 record.sections[0].blocks.push({id:'diagram-holder',type:'question',content:{id:'diagram-root',type:'question',prompt:'Use the diagram.',questionDiagrams:[{id:'test-diagram',format:'tikz',code:tikz,widthMm:60,mathematicalModel:{kind:'segment'}}],children:[],answer:{short:'',worked:''}}});
 await page.reload({waitUntil:'networkidle'});await page.locator('.flow-paper [data-diagram-id="test-diagram"]').first().click();assert.equal(await page.locator('dialog[open]').count(),0);
 await page.getByLabel('Diagram width on page',{exact:true}).fill('70');await page.getByLabel('Diagram width on page',{exact:true}).press('Tab');await saved();
 const diagram=()=>record.sections[0].blocks.find(b=>b.id==='diagram-holder').content.questionDiagrams[0];assert.equal(diagram().widthMm,70);assert.equal(diagram().mathematicalModel.kind,'segment');
 await page.getByRole('button',{name:'Edit TikZ',exact:true}).click();const dialog=page.locator('dialog[open]');await dialog.getByLabel('TikZ code',{exact:true}).fill('\\invalidTikzCommand');await dialog.getByRole('button',{name:'Save',exact:true}).click();assert.equal(await dialog.count(),1);assert.equal(diagram().code,tikz);
 await dialog.getByLabel('TikZ code',{exact:true}).fill(tikz.replace('(1,1)','(2,1)'));await dialog.getByText('Current draft preview',{exact:true}).waitFor({timeout:60000});await dialog.getByRole('button',{name:'Save',exact:true}).click();await saved();assert.match(diagram().code,/\(2,1\)/);assert.equal(diagram().mathematicalModel,null);
 await page.getByRole('button',{name:'Undo',exact:true}).click();await saved();assert.equal(diagram().code,tikz);assert.equal(diagram().mathematicalModel.kind,'segment');
 // Edit the continuation of one long paragraph without dropping its first page.
 const longDocument=fromSource('A long paragraph for a continued page editing check. '.repeat(180));
 record.sections[0].blocks.push({id:'long-prose',type:'rich-text',content:longDocument});
 await page.reload({waitUntil:'networkidle'});await page.locator('.flow-document[data-pagination-state="ready"]').waitFor();
 const fragments=page.locator('.flow-paper [data-edit-root="long-prose"][data-fragment-start]');assert.ok(await fragments.count()>1);
 const continuation=fragments.nth(1),start=Number(await continuation.getAttribute('data-fragment-start')),before=toSource(longDocument);
 await continuation.locator('.clickable').click();await page.locator('maths-editor .me-content').waitFor();await page.locator('maths-editor .me-content').evaluate(s=>{const r=document.createRange();r.selectNodeContents(s);r.collapse(true);s.focus();getSelection().removeAllRanges();getSelection().addRange(r);});await page.keyboard.type('CONTINUED ');await saved();await page.locator('.flow-document[data-pagination-state="ready"]').waitFor();
 const longValue=()=>toSource(record.sections[0].blocks.find(b=>b.id==='long-prose').content);assert.equal(longValue(),before.slice(0,start)+'CONTINUED '+before.slice(start));
 const revision=record.revision;await page.locator('maths-editor .me-content').dispatchEvent('compositionstart');await page.keyboard.type('IME ');await page.waitForTimeout(650);assert.equal(record.revision,revision);await page.locator('maths-editor .me-content').dispatchEvent('compositionend');await saved();assert.match(longValue(),/CONTINUED IME /);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,writes:writes.length,errors}));fs.writeFileSync(out+'/report.json',JSON.stringify({passed:true,writes:writes.length,errors},null,2));
}catch(e){fs.writeFileSync(out+'/failure-record.json',JSON.stringify(record,null,2));await page.screenshot({path:out+'/failure.png'});console.log((await page.locator('body').innerText()).slice(-3500));throw e;}finally{await browser.close();}
