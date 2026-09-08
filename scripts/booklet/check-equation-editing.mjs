import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage();
const focusMath=async()=>{await page.locator('.me-content math-field').focus();await page.waitForTimeout(50);};
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const value=()=>page.evaluate(async()=>{await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return document.querySelector('maths-editor').document;});
const text=async()=>JSON.stringify(await value());
const set=async(source)=>{await page.evaluate(source=>document.querySelector('maths-editor').value=source,source);await page.waitForTimeout(100);};
const caret=async(after)=>page.evaluate(after=>{const e=document.querySelector('maths-editor'),island=e.querySelector('.me-content [data-math]'),r=document.createRange();r[after?'setStartAfter':'setStartBefore'](island);r.collapse(true);e.documentController.surface.focus();getSelection().removeAllRanges();getSelection().addRange(r);e.documentController.saveRange();},after);
try{
 await page.goto(process.argv[2]??'http://127.0.0.1:5174/libs/maths-editor/studio.html');
 await page.waitForFunction(()=>document.querySelector('maths-editor')?.documentController);
 // Deleting the final character should retain an editable field until the next
 // deliberate deletion; that second key removes the empty island itself.
 await set('$x$');await focusMath();
 await page.keyboard.press('Control+a');await page.keyboard.press('Backspace');
 assert.equal((await value()).blocks[0].inlines[0].latex,'');
 await page.keyboard.press('Backspace');
 assert.equal(await page.locator('.me-content math-field').count(),0,'empty equation must be removable');
 await page.keyboard.type('Replacement');assert.match(await text(),/Replacement/);
 await page.keyboard.press('Control+z');await page.keyboard.press('Control+z');
 // Exercise both inline and display equations at either edge, including a
 // whitespace deletion and persistence through the actual document setter.
 for(const source of ['$y=2x+1$','$$y=2x+1$$']){
  for(const after of [false,true]){
   await set(source);await focusMath();
   await page.getByRole('button',{name:after?'Text after equation':'Text before equation',exact:true}).click();
   await page.keyboard.type(after?'after':'before');assert.match(await text(),after?/after/:/before/);
   assert.equal(await page.locator('.me-content math-field').count(),1);
   const doc=await value();await page.evaluate(d=>document.querySelector('maths-editor').document=d,doc);assert.deepEqual(await value(),doc);
  }
  for(const after of [false,true]){
   await set(source);await caret(after);await page.keyboard.press(after?'Backspace':'Delete');
   assert.equal(await page.locator('.me-content math-field').count(),0,`delete adjacent equation ${source} after=${after}`);
   await page.keyboard.press('Control+z');assert.equal(await page.locator('.me-content math-field').count(),1);
   await page.keyboard.press('Control+y');assert.equal(await page.locator('.me-content math-field').count(),0);
  }
  await set(source);await focusMath();await page.keyboard.press('Escape');
  await page.keyboard.type(' ');await page.keyboard.press('Backspace');
  assert.equal((await value()).blocks[0].inlines.filter(n=>n.type==='math').length,1,'space deletion must retain equation');
  assert.ok(!(await value()).blocks[0].inlines.some(n=>n.type==='text'&&n.text.trim()===''&&n.text.length),'space is actually removed');
  assert.ok(!(await text()).includes('\u200b'),'caret anchors must never enter saved content');
  await focusMath();await page.getByRole('button',{name:'Delete equation',exact:true}).click();
  assert.equal(await page.locator('.me-content math-field').count(),0);
 }
 // The same actions must stay inside a table cell and preserve surrounding text.
 await set('| A | B |\n|---|---|\n| $x$ | Keep |');
 await focusMath();await page.getByRole('button',{name:'Text after equation',exact:true}).click();
 await page.keyboard.type(' end');assert.match(await page.locator('.me-content td').first().innerText(),/end/);
 await focusMath();await page.getByRole('button',{name:'Delete equation',exact:true}).click();
 assert.match(await text(),/Keep/);assert.match(await text(),/end/);assert.equal((await value()).blocks[0].type,'table');
 // Paragraph joining and line breaks keep equations and formatted prose intact.
 await set('$x$\n\n**After**');
 await page.evaluate(()=>{const e=document.querySelector('maths-editor'),p=e.querySelectorAll('.me-content p')[1],r=document.createRange();r.setStart(p.querySelector('strong').firstChild,0);r.collapse(true);e.documentController.surface.focus();getSelection().removeAllRanges();getSelection().addRange(r);});
 await page.keyboard.press('Backspace');assert.equal((await value()).blocks.length,1);assert.match(await text(),/After/);assert.match(await text(),/bold/);
 await set('$x$');await focusMath();await page.keyboard.press('Escape');await page.keyboard.press('Shift+Enter');await page.keyboard.type('Next line');
 assert.equal((await value()).blocks.length,1);assert.match(await text(),/Next line/);
 const copied=await page.evaluate(()=>{const e=document.querySelector('maths-editor'),s=e.documentController.surface,r=document.createRange();r.selectNodeContents(s);getSelection().removeAllRanges();getSelection().addRange(r);const data=new DataTransfer();s.dispatchEvent(new ClipboardEvent('copy',{bubbles:true,clipboardData:data}));return data.getData('text/plain');});
 assert.ok(!copied.includes('\u200b'));assert.match(copied,/Next line/);
 // A newly inserted display equation gets the same usable boundaries as a reloaded one.
 await set('Start');await page.evaluate(()=>document.querySelector('maths-editor').documentController.insertMath('x',true));await page.waitForTimeout(100);
 await caret(false);await page.keyboard.type('Before');assert.match(await text(),/Before/);
 // Readonly fields cannot be removed by the new shortcut.
 await set('$x$');await page.evaluate(()=>document.querySelector('maths-editor').readonly=true);
 await caret(true);await page.keyboard.press('Backspace');assert.equal(await page.locator('.me-content math-field').count(),1);
 assert.deepEqual(errors,[]);console.log('Equation editing checks passed.');
}finally{await browser.close();}
