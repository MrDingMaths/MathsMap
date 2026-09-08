import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {createEditableProject} from '../../src/lib/editable-booklet-model.js';
import {studioProject} from '../../src/lib/booklet-review-model.js';
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const page=await browser.newPage({viewport:{width:1500,height:1200}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:5173/libs/maths-editor/studio.html');await page.waitForFunction(()=>document.querySelector('maths-editor')?.documentController);
 await page.evaluate(()=>document.querySelector('maths-editor').value='3. First $x$\n5. Second\n6. Third');
 assert.equal(await page.locator('.me-content > ol').getAttribute('start'),'3');assert.equal(await page.locator('.me-content li').nth(1).getAttribute('value'),'5');
 await page.locator('.me-content li p').last().click();await page.keyboard.press('End');await page.keyboard.press('Enter');await page.keyboard.type('Fourth');
 assert.equal(await page.locator('.me-content li').count(),4);assert.match(await page.evaluate(()=>document.querySelector('maths-editor').value),/7\. Fourth/);
 await page.evaluate(()=>{const e=document.querySelector('maths-editor');e.value='Number this';const p=e.querySelector('.me-content p'),r=document.createRange();r.selectNodeContents(p);r.collapse(false);getSelection().removeAllRanges();getSelection().addRange(r);e.documentController.saveRange();});
 await page.getByRole('button',{name:'Numbered list',exact:true}).click();assert.equal(await page.locator('.me-content > ol').count(),1);
 await page.getByRole('button',{name:'Numbered list',exact:true}).click();assert.equal(await page.locator('.me-content > ol').count(),0);
 const question=(id,atom,leaf=false)=>({id,type:'question',sourceOrder:9,sourceAtom:{id:atom,kind:atom==='activity-box'?'activity':'guided-practice',label:atom==='activity-box'?'Activity':'Guided Practice'},content:{id:id+'-root',type:'question',label:'9',prompt:leaf?'Complete this activity.':'Complete each expression.',children:leaf?[]:[{id:id+'-a',type:'part',label:'1',prompt:'$x+1$',children:[],answerSpaceMm:0},{id:id+'-b',type:'part',label:'2',prompt:'$x+2$',children:[],answerSpaceMm:0}]}});
 const blocks=[{id:'theory',type:'callout',variant:'definition',label:'Theory',content:'1. This deliberately long numbered rule wraps naturally and keeps every continuation aligned with the rule text rather than its number.\n2. Use $x$ as the variable.'},{id:'key',type:'callout',variant:'key-ideas',sourceAtom:{id:'key-box',kind:'key-ideas',label:'Key Ideas'},contentLayout:'numbered-rules',content:'1. First key idea\n  - Check the variable $x$\n2. Second key idea\n  - Check the constant $2$'},question('g1','guided-box'),question('g2','guided-box'),...['e1','e2'].map(id=>({id,type:'worked-example',sourceAtom:{id:'example-box',kind:'example',label:'Example'},presentation:{layout:'columns'},examples:[{id:id+'-item',label:'9',prompt:'Solve $x+1=2$.',theorySolution:'$x=1$'}]})),question('a1','activity-box',true),question('a2','activity-box',true)];
 const record=studioProject(createEditableProject({id:'numbering-test',title:'Teaching numbering',sections:[{id:'section',title:'Numbering',blocks}]}));record.revision=1;
 await page.route('**/__booklet/**',r=>r.request().method()==='GET'?r.continue():r.abort());
 await page.route('**/__booklet/bank/manifest',r=>r.fulfill({json:{format:'mathsmap-practice-bank-v3',version:3,questions:[]}}));
 await page.route('**/__booklet/projects',r=>r.fulfill({json:[record]}));await page.route('**/__booklet/projects/numbering-test',r=>r.fulfill({json:record}));
 await page.goto('http://127.0.0.1:5173/#/booklet?stage=projects&project=numbering-test',{waitUntil:'networkidle'});
 const canvas=page.locator('.project-canvas');await canvas.locator('[data-atom-id="guided-box"]').waitFor();
 assert.deepEqual(await canvas.locator('[data-atom-id="guided-box"] .label-item').allTextContents().then(values=>values.map(v=>v.trim())),['a','b','c','d']);
 assert.deepEqual(await canvas.locator('[data-atom-id="example-box"] .label-item').allTextContents().then(values=>values.map(v=>v.trim())),['a','b']);
 assert.deepEqual(await canvas.locator('[data-atom-id="activity-box"] .label-item').allTextContents().then(values=>values.map(v=>v.trim())),['a','b']);
 assert.equal(await canvas.locator('ol.theory-rules > li').count(),2);assert.ok(await canvas.locator('.text-list ol > li').count()>=2);
 await canvas.screenshot({path:'tmp/teaching-numbering.png'});
 await canvas.locator('[data-arrangement-id="layout:g2-a/prompt"]').click();const dialog=page.locator('.focused-editor');await dialog.waitFor();
 assert.deepEqual(await dialog.locator('.question-paper .label-item').allTextContents().then(values=>values.map(v=>v.trim())),['c','d']);
 await dialog.locator(':scope > header').getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByRole('button',{name:'PDF',exact:true}).click();await page.locator('.project-print [data-atom-id="guided-box"]').waitFor({state:'attached'});await page.emulateMedia({media:'print'});assert.deepEqual(await page.locator('.project-print [data-atom-id="guided-box"] .label-item').allTextContents().then(values=>values.map(v=>v.trim())),['a','b','c','d']);
 assert.deepEqual(errors,[]);console.log('Ordered-list editing and continuation, semantic theory lists, and continuous teaching-box letters agree in preview, focused editor and print.');
}finally{await browser.close();}
