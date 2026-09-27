// Browser regression for editable physical outlines; all data is an isolated fixture.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const out=process.argv[2]??'tmp/circle-editor-check';fs.mkdirSync(out,{recursive:true});
const page=await browser.newPage({viewport:{width:1400,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const value=()=>page.evaluate(()=>document.querySelector('maths-editor').document);
try{
 await page.goto('http://127.0.0.1:5173/libs/maths-editor/studio.html');
 await page.waitForFunction(()=>document.querySelector('maths-editor')?.document);
 await page.evaluate(()=>document.querySelector('maths-editor').document={format:'maths-editor-document-v1',version:1,blocks:[{id:'key-table',type:'table',widthMm:18,widths:[18],rowHeights:[12],border:false,annotations:[{id:'outline',type:'circle',cellId:'key',widthMm:10,heightMm:7,thicknessMm:.3,colour:'#000000'}],rows:[[{id:'key',type:'cell',align:'center',verticalAlign:'middle',blocks:[{id:'label',type:'paragraph',align:'center',inlines:[{type:'math',latex:'\\mathbf{EXE}'}]}]}]]}]});
 await page.locator('.me-content td p').click();await page.getByRole('button',{name:'Edit circle 1',exact:true}).click();
 for(const width of [12,8,10]){await page.getByLabel('Outline width (mm)',{exact:true}).fill(String(width));await page.getByLabel('Outline width (mm)',{exact:true}).press('Tab');assert.equal((await value()).blocks[0].annotations[0].widthMm,width);}
 await page.getByLabel('Outline height (mm)',{exact:true}).fill('8');await page.getByLabel('Outline height (mm)',{exact:true}).press('Tab');
 const bounds=async scale=>page.locator('maths-editor').evaluate(async(e,scale)=>{const c=e.documentController;c.surface.style.transform=`scale(${scale})`;c.surface.style.transformOrigin='top left';c.annotationObserver.update();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const ellipse=c.surface.querySelector('[data-table-annotations] ellipse');return {rx:Number(ellipse.getAttribute('rx')),ry:Number(ellipse.getAttribute('ry'))};},scale);
 const normal=await bounds(1),zoom=await bounds(.5);assert.ok(Math.abs(normal.rx-10*96/25.4/2)<.01);assert.ok(Math.abs(normal.ry-8*96/25.4/2)<.01);assert.deepEqual(normal,zoom);await bounds(1);
 const saved=await value();fs.writeFileSync(out+'/saved-document.json',JSON.stringify(saved,null,2)+'\n');
 await page.reload();await page.waitForFunction(()=>document.querySelector('maths-editor')?.document);await page.evaluate(d=>document.querySelector('maths-editor').document=d,JSON.parse(fs.readFileSync(out+'/saved-document.json')));assert.deepEqual(await value(),saved);
 await page.locator('.me-content td p').click();await page.getByRole('button',{name:'Edit circle 1',exact:true}).click();assert.equal(Number(await page.getByLabel('Outline width (mm)',{exact:true}).inputValue()),10);assert.equal(Number(await page.getByLabel('Outline height (mm)',{exact:true}).inputValue()),8);
 await page.getByRole('button',{name:'Reset outline size',exact:true}).click();assert.equal((await value()).blocks[0].annotations[0].widthMm,undefined);await page.getByRole('button',{name:'Undo',exact:true}).click();assert.equal((await value()).blocks[0].annotations[0].widthMm,10);
 await page.evaluate(()=>document.querySelector('maths-editor').readonly=true);await page.emulateMedia({media:'print'});await page.evaluate(()=>document.fonts.ready);await page.pdf({path:out+'/circle.pdf',format:'A4',printBackground:true});await page.screenshot({path:out+'/circle.png'});assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/report.json',JSON.stringify({passed:true,checks:['repeated-outline-width-edit','height-edit','physical-geometry','zoom-parity','save-reload-model-roundtrip','reopened-controls','reset-and-undo','print'],normal,zoom,errors},null,2)+'\n');console.log('Circle dimensions, repeated resizing, zoom, save/reopen and print checks passed.');
}finally{await browser.close();}
