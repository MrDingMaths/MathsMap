import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {createEditableProject} from '../../src/lib/editable-booklet-model.js';
import {studioProject} from '../../src/lib/booklet-review-model.js';
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const page=await browser.newPage({viewport:{width:1200,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const doc=()=>page.evaluate(()=>document.querySelector('maths-editor').document);
try{
 await page.goto('http://127.0.0.1:5173/libs/maths-editor/studio.html');
 await page.waitForFunction(()=>document.querySelector('maths-editor')?.documentController);
 await page.evaluate(()=>document.querySelector('maths-editor').value='• This deliberately long list item wraps onto another line so its hanging indent can be measured. It includes $x+1$ and **bold text**.\n• Second item');
 assert.equal(await page.locator('.me-content > ul > li').count(),2);
 const indent=await page.locator('.me-content ul').evaluate(e=>parseFloat(getComputedStyle(e).paddingLeft)*25.4/96);assert.ok(Math.abs(indent-7)<.02);
 await page.locator('.me-content li p').last().click();await page.keyboard.press('End');await page.keyboard.press('Enter');await page.keyboard.type('Third item');
 assert.equal((await doc()).blocks[0].items.length,3,'Enter continues the list');
 await page.keyboard.press('Enter');await page.keyboard.press('Enter');await page.keyboard.type('After list');
 assert.ok((await doc()).blocks.some(n=>n.type==='paragraph'&&n.inlines.some(i=>i.text?.includes('After list'))),'Empty item ends the list');
 const saved=await doc();await page.evaluate(d=>document.querySelector('maths-editor').document=d,saved);assert.deepEqual(await doc(),saved);
 // Real HTML lists must survive paste instead of flattening to a text paragraph.
 await page.evaluate(()=>{const e=document.querySelector('maths-editor');e.value='';const p=e.querySelector('.me-content p'),range=document.createRange();range.selectNodeContents(p);getSelection().removeAllRanges();getSelection().addRange(range);e.documentController.saveRange();const data=new DataTransfer();data.setData('text/html','<ul><li><strong>First</strong><ul><li>Nested</li></ul></li><li>Second</li></ul>');e.querySelector('.me-content').dispatchEvent(new ClipboardEvent('paste',{bubbles:true,clipboardData:data}));});
 assert.equal((await doc()).blocks.find(b=>b.type==='list').items[0].blocks[1].type,'list');
 const captured=await doc();await page.evaluate(()=>document.querySelector('maths-editor').documentController.capture());assert.deepEqual(await doc(),captured,'Repeated capture retains native list identities');
 await page.getByRole('button',{name:'Undo',exact:true}).click();assert.ok(!(await doc()).blocks.some(b=>b.type==='list'));
 await page.getByRole('button',{name:'Redo',exact:true}).click();assert.ok((await doc()).blocks.some(b=>b.type==='list'));
 await page.evaluate(()=>{const e=document.querySelector('maths-editor');e.value='Turn this into a bullet';const p=e.querySelector('.me-content p'),r=document.createRange();r.selectNodeContents(p);r.collapse(false);getSelection().removeAllRanges();getSelection().addRange(r);e.documentController.saveRange();});
 await page.getByRole('button',{name:'Bulleted list',exact:true}).click();assert.equal((await doc()).blocks[0].type,'list');
 await page.getByRole('button',{name:'Bulleted list',exact:true}).click();assert.equal((await doc()).blocks[0].type,'paragraph');
 await page.evaluate(()=>document.querySelector('maths-editor').value='- First\n- Second');
 await page.locator('.me-content li p').last().click();await page.keyboard.press('End');await page.keyboard.press('Tab');
 assert.equal((await doc()).blocks[0].items[0].blocks[1].type,'list','Tab nests the current list item');
 await page.keyboard.press('Shift+Tab');assert.equal((await doc()).blocks[0].items.length,2,'Shift+Tab outdents the item');
 // Copy a partial list item with its list ancestors, maths and formatting intact.
 await page.evaluate(()=>{const e=document.querySelector('maths-editor'),p=e.querySelector('.me-content li p'),range=document.createRange();range.selectNodeContents(p);getSelection().removeAllRanges();getSelection().addRange(range);const data=new DataTransfer();e.querySelector('.me-content').dispatchEvent(new ClipboardEvent('copy',{bubbles:true,clipboardData:data}));window.copiedList=JSON.parse(data.getData('application/x-maths-editor+json'));});
 assert.equal(await page.evaluate(()=>window.copiedList.blocks[0].type),'list');
 await page.evaluate(()=>document.querySelector('maths-editor').value='• A long item with enough text to wrap over several lines in a narrow column, keeping the continuation aligned with the text above.\n• A second item with $x^2+1$.');
 await page.locator('.me-content').evaluate(e=>e.style.width='65mm');
 await page.screenshot({path:'tmp/booklet-bullet-lists.png',fullPage:true});
 await page.emulateMedia({media:'print'});assert.equal(await page.locator('.me-content li').count(),2);
 assert.ok(Math.abs(await page.locator('.me-content ul').evaluate(e=>parseFloat(getComputedStyle(e).paddingLeft)*25.4/96)-7)<.02);
 await page.emulateMedia({media:'screen'});
 const source='Learning goals\n\n• Plot and label points on the Cartesian plane, including points whose coordinates are not whole numbers.\n• Identify **coordinates** and use $x$ and $y$ correctly.';
 const record=studioProject(createEditableProject({id:'bullet-test',title:'Bullet verification',sections:[{id:'section',title:'Learning goals',blocks:[{id:'goals',type:'rich-text',content:source}]}]}));record.revision=1;
 await page.route('**/__booklet/**',r=>r.request().method()==='GET'?r.continue():r.abort());
 await page.route('**/__booklet/bank/manifest',r=>r.fulfill({json:{format:'mathsmap-practice-bank-v3',version:3,questions:[]}}));
 await page.route('**/__booklet/projects',r=>r.fulfill({json:[record]}));
 await page.route('**/__booklet/projects/bullet-test',r=>r.fulfill({json:record}));
 await page.goto('http://127.0.0.1:5173/#/booklet?stage=projects&project=bullet-test',{waitUntil:'networkidle'});
 const legacy=page.locator('.project-canvas .text-list ul');await legacy.waitFor();
 assert.equal(await legacy.locator('li').count(),2);
 assert.ok(Math.abs(await legacy.evaluate(e=>parseFloat(getComputedStyle(e).paddingLeft)*25.4/96)-7)<.02);
 await page.locator('.project-canvas [data-edit-root="goals"] .clickable').first().click();
 await page.locator('.focused-editor .me-content ul').waitFor();
 assert.equal(await page.locator('.focused-editor .me-content li').count(),2);
 await page.locator('.focused-editor').screenshot({path:'tmp/booklet-bullet-lists-focused.png'});
 await page.locator('.focused-editor > header').getByRole('button',{name:'Cancel',exact:true}).click();
 assert.equal(record.sections[0].blocks[0].content,source,'Preview and Cancel preserve the original saved text');
 assert.deepEqual(errors,[]);console.log('Semantic bullets, 7 mm hanging indents, Enter/exit, HTML paste, stable IDs, undo/redo and list toggle pass.');
}catch(error){console.log(await page.locator('.me-content').innerHTML());throw error;}finally{await browser.close();}
