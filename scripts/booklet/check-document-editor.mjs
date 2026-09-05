import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const page=await browser.newPage({viewport:{width:1400,height:1100}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const documentValue=()=>page.evaluate(()=>document.querySelector('maths-editor').document);
try {
 await page.goto(process.argv[2]??'http://127.0.0.1:5173/libs/maths-editor/studio.html');
 await page.waitForFunction(()=>document.querySelector('maths-editor')?.document?.blocks?.length>0);
 await page.locator('.me-content p').first().click();
 await page.getByLabel('Before (mm)',{exact:true}).fill('5');await page.getByLabel('Before (mm)',{exact:true}).press('Tab');
 assert.equal((await documentValue()).blocks[0].spaceBefore,5);
 await page.getByRole('button',{name:'Undo',exact:true}).click();assert.equal((await documentValue()).blocks[0].spaceBefore,0);
 await page.getByRole('button',{name:'Redo',exact:true}).click();
 await page.locator('.me-content table td p').first().click();
 await page.getByRole('button',{name:'Merge right',exact:true}).click();
 assert.equal(await page.locator('.me-content table tbody tr').last().locator('td').count(),1);
 await page.getByRole('button',{name:'Split cell',exact:true}).click();
 assert.equal(await page.locator('.me-content table tbody tr').last().locator('td').count(),2);
 await page.locator('math-field').first().evaluate(m=>{m.value='x^{12}';m.dispatchEvent(new Event('input',{bubbles:true,composed:true}));});
 assert.ok(JSON.stringify(await documentValue()).includes('x^{12}'));
 await page.getByRole('button',{name:'Undo',exact:true}).click();assert.ok(!JSON.stringify(await documentValue()).includes('x^{12}'));
 // Native paragraph insertion must not duplicate model identities.
 await page.locator('.me-content p').first().click();await page.keyboard.press('End');await page.keyboard.press('Enter');await page.keyboard.type('A new paragraph');
 const ids=(await documentValue()).blocks.map(b=>b.id);assert.equal(new Set(ids).size,ids.length);
 await page.locator('.me-toolbar input[type=file]').setInputFiles({name:'pixel.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0uoAAAAASUVORK5CYII=','base64')});
 await page.locator('.me-content figure img').waitFor();
 await page.getByLabel('Width (mm)',{exact:true}).fill('45');await page.getByLabel('Width (mm)',{exact:true}).press('Tab');
 await page.getByLabel('Placement',{exact:true}).selectOption('beside-right');
 await page.getByLabel('Caption',{exact:true}).fill('Source diagram');await page.getByLabel('Caption',{exact:true}).press('Tab');
 await page.getByLabel('Crop Left (%)',{exact:true}).fill('10');await page.getByLabel('Crop Left (%)',{exact:true}).press('Tab');
 const picture=(await documentValue()).blocks.find(b=>b.type==='image');assert.equal(picture.width,45);assert.equal(picture.crop[3],10);assert.equal(picture.align,'beside-right');
 const original=await documentValue();
 await page.evaluate(d=>document.querySelector('maths-editor').document=JSON.parse(JSON.stringify(d)),original);assert.deepEqual(await documentValue(),original);
 // Copy the whole document through the browser clipboard contract and paste it back.
 const copied=await page.evaluate(()=>{const e=document.querySelector('maths-editor'),s=e.querySelector('.me-content'),r=document.createRange();r.selectNodeContents(s);const selection=getSelection();selection.removeAllRanges();selection.addRange(r);const data=new DataTransfer();s.dispatchEvent(new ClipboardEvent('copy',{bubbles:true,clipboardData:data}));return data.getData('application/x-maths-editor+json');});
 assert.ok(JSON.parse(copied).blocks.some(b=>b.type==='image'));assert.ok(JSON.parse(copied).blocks.some(b=>b.type==='table'));
 await page.evaluate(text=>{const e=document.querySelector('maths-editor');e.value='Start end';const s=e.querySelector('.me-content'),r=document.createRange();r.setStart(s.querySelector('p').firstChild,6);r.collapse(true);getSelection().removeAllRanges();getSelection().addRange(r);s.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));const data=new DataTransfer();data.setData('application/x-maths-editor+json',text);s.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,clipboardData:data}));},copied);
 const pasted=await documentValue();assert.ok(pasted.blocks.some(b=>b.type==='image'));assert.ok(pasted.blocks.some(b=>b.type==='table'));assert.match(pasted.blocks[0].inlines[0].text,/Start/);assert.match(pasted.blocks.at(-1).inlines[0].text,/end/);
 const pastedImage=pasted.blocks.find(b=>b.type==='image');assert.equal(pastedImage.width,picture.width);assert.deepEqual(pastedImage.crop,picture.crop);assert.equal(pastedImage.align,picture.align);assert.equal(pasted.blocks.find(b=>b.type==='layout').title,original.blocks.find(b=>b.type==='layout').title);
 await page.getByRole('button',{name:'Undo',exact:true}).click();assert.equal((await documentValue()).blocks.length,1);
 await page.getByRole('button',{name:'Redo',exact:true}).click();assert.ok((await documentValue()).blocks.some(b=>b.type==='table'));
 await page.evaluate(()=>document.querySelector('maths-editor').readonly=true);assert.equal(await page.locator('math-field').first().evaluate(m=>m.readOnly),true);assert.equal(await page.getByRole('button',{name:'Table',exact:true}).isDisabled(),true);
 fs.mkdirSync('tmp/studio-verification',{recursive:true});await page.emulateMedia({media:'print'});await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
 await page.pdf({path:'tmp/studio-verification/editor.pdf',format:'A4',printBackground:true});await page.screenshot({path:'tmp/studio-verification/editor.png',fullPage:true});assert.deepEqual(errors,[]);
 console.log('Standalone prose, maths history, table edits, image crop/placement, rich clipboard, reload, readonly and print checks passed.');
}finally{await browser.close();}
