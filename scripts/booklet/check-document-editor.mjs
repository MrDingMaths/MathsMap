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
 await page.getByRole('button',{name:'Shading: Label blue',exact:true}).click();
 assert.ok(JSON.stringify(await documentValue()).includes('#d3e8fc'));
 await page.getByRole('button',{name:'Undo',exact:true}).click();
 assert.ok(!JSON.stringify(await documentValue()).includes('#d3e8fc'));
 await page.locator('math-field').first().evaluate(m=>{m.value='x^{12}';m.dispatchEvent(new Event('input',{bubbles:true,composed:true}));});
 assert.ok(JSON.stringify(await documentValue()).includes('x^{12}'));
 await page.getByRole('button',{name:'Undo',exact:true}).click();assert.ok(!JSON.stringify(await documentValue()).includes('x^{12}'));
 // Native paragraph insertion must not duplicate model identities.
 await page.locator('.me-content p').first().click();await page.keyboard.press('End');await page.keyboard.press('Enter');await page.keyboard.type('A new paragraph');
 const ids=(await documentValue()).blocks.map(b=>b.id);assert.equal(new Set(ids).size,ids.length);
 await page.evaluate(()=>document.querySelector('maths-editor').documentController.blockImage=true);
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
 // True inline assets: a native caret, asynchronous decode, typing, rich copy and history.
 await page.evaluate(()=>{const e=document.querySelector('maths-editor');e.value='beforeafter';const p=e.querySelector('.me-content p'),r=document.createRange();r.setStart(p.firstChild,6);r.collapse(true);getSelection().removeAllRanges();getSelection().addRange(r);e.documentController.saveRange();});
 await page.locator('.me-toolbar input[type=file]').setInputFiles({name:'inline.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0uoAAAAASUVORK5CYII=','base64')});
 await page.locator('.me-content [data-type="inline-image"]').waitFor();
 let inlineDoc=await documentValue();assert.deepEqual(inlineDoc.blocks[0].inlines.map(n=>n.type),['text','inline-image','text']);assert.equal(inlineDoc.blocks[0].inlines[0].text,'before');assert.equal(inlineDoc.blocks[0].inlines[2].text,'after');
 await page.keyboard.type(' NEXT ');assert.match(JSON.stringify(await documentValue()),/NEXT/);
 await page.locator('.me-content [data-type="inline-image"]').click();await page.getByLabel('Width (mm)',{exact:true}).fill('12');assert.equal(await page.getByLabel('Width (mm)',{exact:true}).evaluate(e=>e===document.activeElement),true);await page.getByLabel('Width (mm)',{exact:true}).press('Tab');
 assert.equal((await documentValue()).blocks[0].inlines.find(n=>n.type==='inline-image').width,12);
 const inlineCopy=await page.evaluate(()=>{const e=document.querySelector('maths-editor'),s=e.querySelector('.me-content'),r=document.createRange();r.selectNodeContents(s.querySelector('p'));getSelection().removeAllRanges();getSelection().addRange(r);const data=new DataTransfer();s.dispatchEvent(new ClipboardEvent('copy',{bubbles:true,clipboardData:data}));return data.getData('application/x-maths-editor+json');});
 assert.ok(JSON.parse(inlineCopy).blocks[0].inlines.some(n=>n.type==='inline-image'));
 await page.evaluate(text=>{const e=document.querySelector('maths-editor');e.value='left right';const p=e.querySelector('.me-content p'),r=document.createRange();r.setStart(p.firstChild,5);r.collapse(true);getSelection().removeAllRanges();getSelection().addRange(r);const data=new DataTransfer();data.setData('application/x-maths-editor+json',text);e.querySelector('.me-content').dispatchEvent(new ClipboardEvent('paste',{bubbles:true,clipboardData:data}));},inlineCopy);
 const copiedInline=(await documentValue()).blocks[0].inlines.find(n=>n.type==='inline-image');assert.ok(copiedInline);assert.notEqual(copiedInline.id,JSON.parse(inlineCopy).blocks[0].inlines.find(n=>n.type==='inline-image').id);
 await page.getByRole('button',{name:'Undo',exact:true}).click();assert.ok(!(await documentValue()).blocks[0].inlines.some(n=>n.type==='inline-image'));await page.getByRole('button',{name:'Redo',exact:true}).click();assert.equal((await documentValue()).blocks[0].inlines.find(n=>n.type==='inline-image').id,copiedInline.id);
 const roundtrip=await documentValue();await page.evaluate(d=>document.querySelector('maths-editor').document=d,roundtrip);assert.deepEqual(await documentValue(),roundtrip);
 await page.evaluate(()=>{const e=document.querySelector('maths-editor');e.document={blocks:[{id:'table',type:'table',widthMm:80,annotations:[{id:'anchor',type:'arrow',cellId:'a',toCellId:'d',label:'+2',labelBox:true}],rows:[['a','b'],['c','d']].map(row=>row.map(id=>({id,type:'cell',blocks:[{id:'p'+id,type:'paragraph',inlines:[{type:'text',text:id}]}]})))}]};});
 await page.locator('.me-content td p').first().click();await page.getByLabel('Column width (mm)',{exact:true}).fill('30');assert.equal(await page.getByLabel('Column width (mm)',{exact:true}).evaluate(e=>e===document.activeElement),true);await page.getByLabel('Column width (mm)',{exact:true}).press('Tab');assert.equal((await documentValue()).blocks[0].widthMm,70);
 const handle=page.getByRole('separator',{name:'Resize boundary after column 1'});await handle.scrollIntoViewIfNeeded();const box=await handle.boundingBox(),historyBefore=await page.evaluate(()=>document.querySelector('maths-editor').documentController.history.length);
 await page.mouse.move(box.x+box.width/2,box.y+5);await page.mouse.down();await page.mouse.move(box.x+20,box.y+5,{steps:6});await page.mouse.up();assert.equal(await page.evaluate(()=>document.querySelector('maths-editor').documentController.history.length),historyBefore+1);assert.equal((await documentValue()).blocks[0].widthMm,70);
 await handle.focus();await handle.press('ArrowRight');assert.equal((await documentValue()).blocks[0].widthMm,70);
 await page.locator('.me-content td p').first().click();await page.getByRole('button',{name:'Merge right',exact:true}).click();await page.getByRole('button',{name:'Merge down',exact:true}).click();assert.equal((await documentValue()).blocks[0].rows[0][0].rowspan,2);await page.getByRole('button',{name:'Split cell',exact:true}).click();assert.equal((await documentValue()).blocks[0].rows.flat().length,4);await page.locator('.me-content [data-table-annotations] path').first().waitFor();assert.equal(await page.locator('.me-content [data-table-annotations] path:not([stroke=transparent])').count(),2);
 // Missing images reserve their declared aspect ratio and expose keyboard properties.
 await page.route('**/missing-editor-image.png',r=>r.fulfill({status:404,body:''}));
 await page.evaluate(()=>document.querySelector('maths-editor').document={blocks:[{type:'paragraph',inlines:[{type:'text',text:'before '},{id:'missing',type:'inline-image',src:'/missing-editor-image.png',alt:'Missing chart',width:20,aspectRatio:2},{type:'text',text:' after'}]}]});
 await page.locator('.me-content [data-image-error]').waitFor();const imageBounds=await page.locator('.me-content [data-type="inline-image"]').boundingBox();assert.ok(Math.abs(imageBounds.width/imageBounds.height-2)<.02);
 await page.locator('.me-content [data-type="inline-image"]').focus();await page.keyboard.press('Enter');assert.equal(await page.getByLabel('Width (mm)',{exact:true}).evaluate(e=>e===document.activeElement),true);
 await page.locator('.me-toolbar input[type=file]').setInputFiles({name:'invalid.png',mimeType:'image/png',buffer:Buffer.from('bad image')});await page.locator('maths-editor > output').filter({hasText:'could not be decoded'}).waitFor();assert.equal((await documentValue()).blocks[0].inlines.filter(n=>n.type==='inline-image').length,1);

 await page.evaluate(d=>document.querySelector('maths-editor').document=d,original);

 await page.evaluate(()=>document.querySelector('maths-editor').readonly=true);assert.equal(await page.locator('math-field').first().evaluate(m=>m.readOnly),true);assert.equal(await page.getByRole('button',{name:'Table',exact:true}).isDisabled(),true);
 fs.mkdirSync('tmp/studio-verification',{recursive:true});await page.emulateMedia({media:'print'});await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
 await page.pdf({path:'tmp/studio-verification/editor.pdf',format:'A4',printBackground:true});await page.screenshot({path:'tmp/studio-verification/editor.png',fullPage:true});assert.deepEqual(errors,[]);
 // Opt-in contextual controls retain the default model and live table transactions.
 await page.emulateMedia({media:'screen'});await page.evaluate(d=>{const old=document.querySelector('maths-editor');const editor=document.createElement('maths-editor');editor.setAttribute('structured','');editor.setAttribute('controls','contextual');old.replaceWith(editor);editor.document=d;},original);
 assert.equal(await page.locator('.me-toolbar .me-format summary').textContent(),'Format');assert.equal(await page.locator('.me-toolbar .me-insert summary').textContent(),'Insert');await page.locator('.me-content td p').first().click();await page.getByText('Table properties',{exact:true}).click();assert.equal(await page.getByLabel('Column width (mm)',{exact:true}).isVisible(),true);assert.equal(await page.getByLabel('Border colour',{exact:true}).isVisible(),true);assert.equal(await page.getByLabel('Border colour',{exact:true}).isVisible(),true);await page.getByLabel('Column width (mm)',{exact:true}).fill('22');assert.equal(await page.getByLabel('Column width (mm)',{exact:true}).evaluate(e=>document.activeElement===e),true);await page.getByLabel('Column width (mm)',{exact:true}).press('Escape');assert.deepEqual(errors,[]);

 // Shared 1.3 controls: inherited cell colours, scoped style overrides and anchored arrows.
 await page.evaluate(()=>{const e=document.querySelector('maths-editor');e.document={blocks:[{id:'t',type:'table',widthMm:80,borderColour:'#aaaaaa',rows:[['a','b'],['c','d']].map(row=>row.map(id=>({id,type:'cell',colour:'#268cff',borderColour:'#ff0000',blocks:[{id:'p'+id,type:'paragraph',inlines:[{type:'math',latex:'3x+1'}]}]})))}]};});
 await page.locator('.me-content td p').first().click();
 await page.getByText('Table properties',{exact:true}).click();
 assert.equal(await page.locator('.me-content math-field').first().evaluate(e=>getComputedStyle(e).color),'rgb(38, 140, 255)');
 await page.getByLabel('Apply table style to').selectOption('whole table');await page.getByLabel('Border colour',{exact:true}).fill('#00aa77');await page.getByLabel('Border colour',{exact:true}).press('Tab');assert.ok((await documentValue()).blocks[0].rows.flat().every(c=>c.borderColour==='#00aa77'));
 await page.getByLabel('Shading',{exact:true}).fill('#ffeeaa');await page.getByLabel('Shading',{exact:true}).press('Tab');assert.ok((await documentValue()).blocks[0].rows.flat().every(c=>c.background==='#ffeeaa'));
 await page.getByRole('button',{name:'Add arrow',exact:true}).click();await page.getByLabel('Arrow label',{exact:true}).fill('+4');await page.getByLabel('Arrow label',{exact:true}).press('Tab');await page.getByLabel('Arrowheads',{exact:true}).selectOption('both');await page.getByLabel('Arrow curve (mm)',{exact:true}).fill('6');await page.getByLabel('Arrow curve (mm)',{exact:true}).press('Tab');
 assert.equal((await documentValue()).blocks[0].annotations[0].curveMm,6);await page.locator('.me-content [data-annotation-id]').first().focus();await page.keyboard.press('Enter');assert.equal(await page.getByLabel('Arrow label',{exact:true}).inputValue(),'+4');
 const arrowAtZoom=async scale=>page.locator('maths-editor').evaluate(async(e,scale)=>{const c=e.documentController;c.surface.style.transform='scale('+scale+')';c.surface.style.transformOrigin='top left';c.annotationObserver.update();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const svg=c.surface.querySelector('[data-table-annotations]');return {viewBox:svg.getAttribute('viewBox'),path:svg.querySelector('path').getAttribute('d')};},scale);
 const normalArrow=await arrowAtZoom(1),smallArrow=await arrowAtZoom(.5);const values=o=>(o.viewBox+' '+o.path).match(/-?\d+(?:\.\d+)?/g).map(Number);assert.ok(values(normalArrow).every((v,i)=>Math.abs(v-values(smallArrow)[i])<.02),'arrow geometry remains local and stable at 50% paper zoom');await arrowAtZoom(1);

 await page.evaluate(()=>{const old=document.querySelector('maths-editor'),value=old.document,editor=document.createElement('maths-editor');editor.setAttribute('structured','');old.replaceWith(editor);editor.document=value;});
 await page.evaluate(()=>document.querySelector('maths-editor').document={blocks:[{id:'p1',type:'paragraph',tabStops:[{position:40,align:'left',leader:'dots'}],inlines:[{type:'math',latex:'(-1,3)'},{type:'tab'},{type:'text',text:'answer'}]},{id:'p2',type:'paragraph',tabStops:[{position:40,align:'left',leader:'dots'}],inlines:[{type:'math',latex:'(-100,300)'},{type:'tab'},{type:'text',text:'answer'}]}]});
 await page.waitForTimeout(400);const ends=await page.locator('.me-content [data-tab]').evaluateAll(els=>els.map(e=>e.getBoundingClientRect().right));assert.ok(Math.abs(ends[0]-ends[1])<1,JSON.stringify(ends));
 await page.locator('.me-content p').first().click();await page.getByLabel('Tab 1 position (mm)',{exact:true}).fill('45');assert.equal(await page.getByLabel('Tab 1 position (mm)',{exact:true}).evaluate(e=>e===document.activeElement),true);await page.getByLabel('Tab 1 position (mm)',{exact:true}).press('Enter');assert.equal((await documentValue()).blocks[0].tabStops[0].position,45);
 const tabHistory=await page.evaluate(()=>document.querySelector('maths-editor').documentController.history.length);await page.getByRole('button',{name:/Tab stop 1:/}).press('ArrowRight');assert.equal((await documentValue()).blocks[0].tabStops[0].position,46);assert.equal(await page.evaluate(()=>document.querySelector('maths-editor').documentController.history.length),tabHistory+1);
 assert.deepEqual(errors,[]);
 await page.evaluate(()=>{const e=document.querySelector('maths-editor');e.value='x …………';const p=e.querySelector('.me-content p'),text=p.firstChild,r=document.createRange();r.setStart(text,2);r.setEnd(text,text.length);getSelection().removeAllRanges();getSelection().addRange(r);e.documentController.saveRange();e.documentController.replaceDots();});
 assert.equal((await documentValue()).blocks[0].inlines.filter(n=>n.type==='tab').length,2);assert.deepEqual((await documentValue()).blocks[0].tabStops.map(s=>s.leader),['none','dots']);await page.getByRole('button',{name:'Undo',exact:true}).click();assert.match((await documentValue()).blocks[0].inlines[0].text,/…………/);
 await page.evaluate(()=>{const e=document.querySelector('maths-editor');e.document={blocks:[{type:'paragraph',tabStops:[{position:22,align:'left',leader:'none'},{position:44,align:'left',leader:'dots'}],inlines:[{type:'math',latex:'(-1,3)'},{type:'tab'},{type:'tab'}]}]};e.querySelector('.me-content p').style.width='122.641px';});await page.waitForTimeout(150);
 const narrowTabs=await page.locator('.me-content [data-tab]').evaluateAll(es=>es.map(e=>({y:e.getBoundingClientRect().top,right:e.getBoundingClientRect().right})));assert.ok(Math.abs(narrowTabs[0].y-narrowTabs[1].y)<2,JSON.stringify(narrowTabs));
 console.log('Standalone prose, maths history, table edits, image crop/placement, rich clipboard, reload, readonly and print checks passed.');
}finally{await browser.close();}
