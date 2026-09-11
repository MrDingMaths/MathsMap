import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';

const base=process.env.BOOKLET_TEST_BASE??'http://127.0.0.1:5173';
const out='.booklet-work/equation-reliability';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1200,height:950}}),errors=[];
page.on('pageerror',e=>errors.push(e.stack));
const fields=()=>page.locator('.me-content math-field');
const doc=()=>page.evaluate(()=>window.testEditor.document);
const source=()=>page.evaluate(()=>window.testEditor.value);
const set=async value=>{await page.evaluate(value=>{testEditor.readonly=false;testEditor.value=value;},value);await fields().first().waitFor();};
const focus=async(index=0)=>{await fields().nth(index).click();await fields().nth(index).focus();await page.waitForFunction(()=>document.activeElement?.matches('math-field'));};
const focused=()=>page.evaluate(()=>document.activeElement?.matches('math-field'));
const tool=name=>page.getByRole('button',{name,exact:true});
const highlighted=()=>page.locator('.me-content .me-equation-selected').count();
const latex=()=>page.evaluate(()=>document.activeElement?.getValue?.('latex'));
const settle=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
try {
  await page.goto(base+'/libs/maths-editor/studio.html');await page.waitForFunction(()=>document.querySelector('maths-editor')?.documentController);
  await page.evaluate(async()=>{
    const {loadDocumentEditor,fromSource}=await import('/src/lib/document-content.js');await loadDocumentEditor();
    const main=document.createElement('main');main.style.cssText='max-width:1040px;margin:32px auto;padding:24px;background:white;color:#24364b;font:18px system-ui';
    const title=document.createElement('h1');title.textContent='Equation editing';main.append(title);
    const editor=document.createElement('maths-editor');editor.setAttribute('structured','');editor.setAttribute('controls','contextual');main.append(editor);
    const outside=document.createElement('button');outside.textContent='Outside editor';main.append(outside);
    document.body.replaceChildren(main);window.testEditor=editor;editor.document=fromSource('Simplify the expression.\n\n$$\\frac{x+1}{2}+x^2$$\n\nContinue working here.');
  });
  await focus();await settle();
  assert.equal(await highlighted(),1);
  const before=await fields().first().boundingBox();
  await page.screenshot({path:out+'/editing.png'});
  await tool('Edit LaTeX').click();await settle();
  assert.equal(await highlighted(),1,'LaTeX dialog retains highlighted equation');
  assert.deepEqual(await fields().first().boundingBox(),before,'opening controls does not move the equation');
  await page.screenshot({path:out+'/controls-open.png'});
  await tool('Cancel').click();await page.waitForFunction(()=>!document.querySelector('.me-latex-dialog')&&document.activeElement?.matches('math-field'));
  await fields().first().press('Tab');await page.getByPlaceholder('Start typing to search').waitFor();
  assert.equal(await highlighted(),1,'Symbols retains highlighted equation');
  await page.getByPlaceholder('Start typing to search').press('Escape');
  await page.getByRole('button',{name:'Outside editor',exact:true}).click();assert.equal(await highlighted(),0);
  await focus();await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('.me-equation-selected').evaluate(e=>getComputedStyle(e).outlineStyle),'none');
  assert.equal(await page.locator('.me-equation-selected').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
  await page.emulateMedia({media:'screen'});
  console.log('PASS: highlighting, controls, stable geometry and print');

  await set('Before $x+1$ after $y+2$.');await focus();
  await page.keyboard.press('End');await page.keyboard.press('Shift+ArrowLeft');
  const selected=await fields().first().evaluate(e=>e.selection);
  await tool('Bold maths').click();assert.match(await fields().first().evaluate(e=>e.value),/mathbf\{1\}/);
  assert.equal(await fields().nth(1).evaluate(e=>e.value),'y+2');
  await page.keyboard.press('Control+z');await settle();assert(await focused());
  assert.deepEqual(await fields().first().evaluate(e=>e.selection),selected,'undo retains selected term');
  await page.keyboard.type('3');assert.equal(await latex(),'x+3','typing after undo replaces the selected term');
  await page.keyboard.press('Control+z');await page.keyboard.press('Control+y');await settle();assert(await focused());
  await page.keyboard.press('End');await page.keyboard.type('+4');assert.match(await latex(),/\+4$/);
  assert.equal(await highlighted(),1);
  console.log('PASS: selected-term formatting and typing immediately after undo/redo');

  for(const expression of ['\\frac{x+1}{2}','x^{12}','\\begin{aligned}x&=1\\\\y&=2\\end{aligned}']){
    await set(`Before $${expression}$ after.`);await focus();const canonical=await latex();
    await page.keyboard.press('Control+a');await page.keyboard.press('Backspace');assert.equal(await latex(),'');
    assert.equal(await fields().count(),1,'clearing contents retains empty equation');
    await page.keyboard.type('z');assert.equal(await latex(),'z');
    await page.keyboard.press('Control+z');await settle();assert(await focused());
    await page.keyboard.press('Control+z');await settle();assert.equal(await fields().first().evaluate(e=>e.value),canonical);
    await page.keyboard.press('Control+a');await page.keyboard.type('q');assert.equal(await latex(),'q');
  }
  // Insert a nested fraction from the actual Symbols picker and fill its slots.
  await set('$x$');await focus();await page.keyboard.press('Control+a');
  await page.keyboard.press('Tab');const search=page.getByPlaceholder('Start typing to search');await search.fill('fraction');await search.press('Enter');
  await page.keyboard.type('a');await page.keyboard.press('ArrowDown');await page.keyboard.type('b');
  assert.match(await latex(),/frac/);assert.match(await latex(),/a/);assert.match(await latex(),/b/);
  await page.keyboard.press('Backspace');await page.keyboard.type('c');assert.match(await latex(),/frac\{x\}\{ac\}/,'replace only the denominator, preserving the selected numerator');
  await page.keyboard.press('End');await page.keyboard.type('+x^2');assert.match(await latex(),/x\^2|x\^\{2\}/);
  await page.keyboard.press('ArrowLeft');await page.keyboard.press('Backspace');await page.keyboard.type('3');assert.match(await latex(),/x\^3|x\^\{3\}/,'replace only the exponent');
  await set('$x=1$');await focus();
  for(const expression of ['\\begin{aligned}x&=1\\\\y&=2\\\\z&=3\\end{aligned}','\\begin{aligned}x&=1\\\\z&=3\\end{aligned}']){
    await tool('Edit LaTeX').click();await page.getByRole('textbox',{name:'Equation LaTeX',exact:true}).fill(expression);await tool('Apply equation').click();
    await page.waitForFunction(()=>!document.querySelector('.me-latex-dialog')&&document.activeElement?.matches('math-field'));
    assert.equal((await latex()).replace(/\s/g,''),expression);
  }
  console.log('PASS: fractions, powers and multiline contents');

  for(const context of ['Before $x$ after.','Before $$x$$ after.','| A | B |\n|---|---|\n| $x$ | Keep |','1. First $x$\n2. Keep']){
    await set(context);await focus();const original=await doc();
    await tool('Delete equation').click();assert.equal(await fields().count(),0);
    await page.keyboard.press('Control+z');await settle();assert.equal(await fields().count(),1);await page.waitForFunction(()=>document.activeElement?.matches('math-field'));
    assert.deepEqual(await doc(),original);await page.keyboard.press('Control+y');await settle();assert.equal(await fields().count(),0);
    await page.keyboard.type('replacement');assert.match(await source(),/replacement/);
    if(context.includes('Keep'))assert.match(await source(),/Keep/);
    assert(!JSON.stringify(await doc()).includes('\u200b'));
  }
  // Teaching layout content stays inside its slot through insert/delete/history.
  await page.evaluate(async()=>{const {template}=await import('/libs/maths-editor/document-model.mjs');const d=template('investigation');testEditor.document={blocks:[d]};});
  await page.locator('.me-content [data-slot] p').first().click();
  await page.keyboard.press('End');await page.keyboard.press('Tab');await page.keyboard.type('x');
  await tool('Delete equation').click();await page.keyboard.press('Control+z');await page.waitForFunction(()=>document.activeElement?.matches('math-field'));
  assert.equal(await fields().first().evaluate(e=>Boolean(e.closest('[data-slot]'))),true);
  const saved=await doc();await page.evaluate(d=>testEditor.document=d,saved);assert.deepEqual(await doc(),saved);
  console.log('PASS: block deletion, neighbouring prose, lists, tables, teaching slots and reload');

  // Annotated equations use the property field but highlight the source block.
  await page.evaluate(()=>{testEditor.document={blocks:[{id:'annotated',type:'annotated-equation',latex:'x+1',anchors:[{id:'term-x',text:'x',start:0,end:1}],annotations:[{id:'note',targetId:'term-x',blocks:[{type:'paragraph',inlines:[{type:'text',text:'Variable'}]}]}]}]};});
  await page.locator('[data-equation-formula]').click();
  const annotationField=page.getByLabel('Equation',{exact:true});await annotationField.focus();await page.waitForFunction(()=>document.activeElement?.matches('math-field'));
  assert.equal(await page.locator('[data-type="annotated-equation"].me-equation-selected').count(),1);
  await annotationField.press('End');await page.keyboard.type('+2');
  await page.waitForFunction(()=>testEditor.document.blocks[0].latex==='x+1+2');
  assert.equal((await doc()).blocks[0].annotations[0].targetId,'term-x');
  await page.keyboard.press('Control+z');await page.waitForFunction(()=>document.activeElement?.matches('math-field'));
  assert.equal((await doc()).blocks[0].latex,'x+1');assert.equal((await doc()).blocks[0].annotations[0].targetId,'term-x');
  await annotationField.press('Home');await annotationField.press('Delete');
  await page.locator('[data-equation-warning]').waitFor();
  assert.equal((await doc()).blocks[0].annotations[0].targetId,'term-x','a deleted term is flagged, never silently rebound');
  await page.keyboard.press('Control+z');await page.waitForFunction(()=>!document.querySelector('[data-equation-warning]'));
  console.log('PASS: annotated equation editing, highlighting, history and anchor preservation');

  await set('Before $x+1$ after.');await focus();await page.keyboard.press('Control+a');await page.keyboard.press('Control+c');await page.keyboard.press('End');await page.keyboard.press('Control+v');
  assert.equal(await latex(),'x+1x+1','native equation clipboard paste');
  await page.keyboard.press('Control+a');await page.keyboard.press('Control+x');assert.equal(await latex(),'');
  await page.keyboard.press('Control+z');await settle();assert(await focused());
  await page.evaluate(()=>testEditor.readonly=true);assert.equal(await highlighted(),0);
  const readonly=await doc();await page.keyboard.press('Backspace');assert.deepEqual(await doc(),readonly);
  console.log('PASS: clipboard and read-only');
  assert.deepEqual(errors,[]);
} catch(error) {await page.screenshot({path:out+'/failure.png'});throw error;}
finally {await browser.close();}
