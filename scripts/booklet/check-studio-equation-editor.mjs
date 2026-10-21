// Word-style equation editing in Booklet Studio. In-memory writes only.
// Usage: BOOKLET_TEST_BASE=http://127.0.0.1:5173 node scripts/booklet/check-studio-equation-editor.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createEditableProject} from '../../src/lib/editable-booklet-model.js';
import {fromSource,toSource} from '../../public/libs/maths-editor/document-model.mjs';
const out='.booklet-work/studio-equation-check';fs.mkdirSync(out,{recursive:true});
const sum='\\dfrac{2}{15}+\\dfrac{8}{15}+\\dfrac{1}{15}';
let record=createEditableProject({id:'equation-check',title:'Equation editor check',settings:{paginationMode:'flexible',generatedCover:false},topics:[{id:'topic',title:'Algebra'}],sections:[{id:'section',topicId:'topic',phase:'teaching',title:'Algebra',blocks:[
 {id:'prose',type:'rich-text',content:fromSource(`Add $${sum}$ and simplify.`)},
 {id:'blank',type:'rich-text',content:fromSource('Write the equation here.')},
 {id:'spare',type:'rich-text',content:fromSource('Spare paragraph for deleting.')},
 {id:'display',type:'rich-text',content:fromSource('$$x^2+y^2=r^2$$')},
 {id:'grid',type:'rich-text',content:fromSource('| Expression | Value |\n|---|---|\n| $\\dfrac{3}{4}$ | 2 |')}]}]});record.revision=1;
const errors=[],steps=[];
let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
const page=await browser.newPage({viewport:{width:1500,height:1000}});page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.stack);});
await page.context().route('**/__booklet/**',async route=>{
 const req=route.request(),url=new URL(req.url()),method=req.method();
 if(url.pathname==='/__booklet/projects'&&method==='GET')return route.fulfill({json:[{id:record.id,title:record.title,revision:record.revision}]});
 if(url.pathname===`/__booklet/projects/${record.id}`){if(method==='PUT'){const body=req.postDataJSON();assert.equal(body.expectedRevision,record.revision);record={...body.project,revision:record.revision+1};}return route.fulfill({json:record});}
 if(url.pathname.includes('bank-sync'))return route.fulfill({json:{items:[]}});
 if(url.pathname.endsWith('/manifest'))return route.fulfill({json:{questions:[]}});
 return route.fulfill({json:[]});
});
const step=name=>{steps.push(name);console.log('-',name);};
// Studio debounces saves by 500 ms; let a pending save start before waiting for it.
const saved=async()=>{await page.waitForTimeout(550);await page.waitForFunction(()=>document.querySelector('.save-state')?.textContent==='Saved');};
const block=id=>toSource(record.sections[0].blocks.find(b=>b.id===id).content);
const inMath=()=>page.waitForFunction(()=>document.activeElement?.matches('math-field'));
const outOfMath=()=>page.waitForFunction(()=>!document.activeElement?.matches('math-field'));
// Geometry of the focused equation: the live field must show all of its content.
const active=()=>page.evaluate(()=>{const f=document.activeElement;if(!f?.matches('math-field'))return null;const c=f.shadowRoot.querySelector('.ML__content'),r=f.getBoundingClientRect(),h=f.closest('[data-math]');return {latex:f.getValue('latex'),position:f.position,last:f.lastOffset,selection:f.selection.ranges[0],width:r.width,height:r.height,scroll:c.scrollWidth,client:c.clientWidth,preview:h.querySelector('[data-math-preview]')?getComputedStyle(h.querySelector('[data-math-preview]')).display:'missing'};});
const assertFits=async label=>{const a=await active();assert.ok(a,label+': no focused equation');assert.ok(a.width>8,`${label}: field is ${a.width}px wide`);assert.ok(a.scroll<=a.client+1,`${label}: content ${a.scroll}px clipped to ${a.client}px`);assert.equal(a.preview,'none',label+': preview still occupies the line');return a;};
// Studio undo reopens the inline editor (about 120 ms); wait for focus to return to an equation.
const undoInMath=async chord=>{const back=page.evaluate(()=>new Promise(done=>{const seen=e=>{if(e.target.matches?.('math-field')){document.removeEventListener('focusin',seen,true);done(true);}};document.addEventListener('focusin',seen,true);setTimeout(()=>done(false),3000);}));await page.keyboard.press(chord);assert.ok(await back,chord+' left the equation');};
const islands=id=>page.locator(`[data-edit-root="${id}"] [data-math]`);
const openAtEnd=async id=>{await page.locator(`[data-edit-root="${id}"] .clickable`).first().click();await page.locator(`[data-edit-root="${id}"] .me-content`).waitFor();await page.keyboard.press('End');};
try{
 await page.goto((process.env.BOOKLET_TEST_BASE??'http://127.0.0.1:5174')+'/#/booklet?stage=projects&project=equation-check',{waitUntil:'networkidle'});
 await page.locator('[data-edit-root="prose"] .clickable').first().waitFor();

 step('Maths button inserts a visible, growing equation');
 await openAtEnd('blank');await page.keyboard.type(' ');
 await page.getByRole('button',{name:'Maths',exact:true}).click();await inMath();
 const prompt=await page.evaluate(()=>{const h=document.activeElement.closest('[data-math]');return {width:h.getBoundingClientRect().width,prompt:getComputedStyle(h,'::after').content};});
 assert.ok(prompt.width>40&&/Type equation here/.test(prompt.prompt),'empty equation should show its prompt: '+JSON.stringify(prompt));
 let a;
 await page.keyboard.type('x^2+3x');
 a=await assertFits('new equation');assert.equal(a.latex,'x^2+3x');
 await page.keyboard.press('Escape');await outOfMath();await saved();
 const preview=await islands('blank').last().evaluate(h=>{const p=h.querySelector('[data-math-preview]');return p&&{width:p.getBoundingClientRect().width,katex:!!p.querySelector('.katex')};});
 assert.ok(preview?.katex&&preview.width>20,'preview after leaving: '+JSON.stringify(preview));
 assert.match(block('blank'),/x\^\{?2\}?\+3x/);

 step('Alt+= inserts an equation; Enter finishes it like Escape');
 await page.keyboard.type(' and ');await page.keyboard.press('Alt+Equal');await inMath();
 await page.keyboard.type('y=mx+c');await assertFits('Alt+= equation');
 await page.keyboard.press('Enter');await outOfMath();await page.keyboard.type(' ok');await saved();
 assert.match(block('blank'),/y=mx\+c\$? ok/);assert.equal(await islands('blank').count(),2);

 step('Tab moves between boxes, Shift+Tab back, Tab at the end leaves');
 await page.keyboard.type(' ');await page.keyboard.press('Alt+Equal');await inMath();
 await page.keyboard.type('/');await page.keyboard.type('1');await page.keyboard.press('Tab');await page.keyboard.type('2');
 assert.match((await active()).latex,/^\\frac\{?1\}?\{?2\}?$/);
 await page.keyboard.press('Shift+Tab');await page.keyboard.type('3');assert.match((await active()).latex,/^\\frac\{?3\}?\{?2\}?$/,'Shift+Tab selects the numerator box');
 // Tab walks numerator → denominator → after the fraction, then leaves the equation.
 const visits=[];for(let i=0;i<4&&await active();i++){visits.push((await active()).position);await page.keyboard.press('Tab');}
 assert.equal(await active(),null,'Tab never left the equation: '+JSON.stringify(visits));

 step('Alt+S opens Symbols');
 await islands('blank').last().click();await inMath();await page.keyboard.press('Alt+s');
 await page.locator('.me-palette').first().waitFor({state:'visible',timeout:5000});await page.keyboard.press('Escape');

 step('Existing equation: first click places the caret, content is never clipped');
 await page.keyboard.press('Escape');
 const target=page.locator('[data-edit-root="prose"] .clickable .katex').first();const box=await target.boundingBox();
 await page.mouse.click(box.x+box.width*0.5,box.y+box.height/2);await inMath();await page.waitForTimeout(100);
 a=await assertFits('existing equation');assert.ok(a.position>2&&a.position<a.last-2,`first click caret ${a.position} of ${a.last}`);
 await page.keyboard.press('End');await page.keyboard.type('+3/15');await page.keyboard.press('ArrowRight');await page.keyboard.type('=');
 a=await assertFits('extended equation');assert.match(a.latex,/\\frac\{3\}\{15\}=$/);
 await page.keyboard.press('Escape');await outOfMath();await saved();
 const mounted=await page.locator('[data-edit-root="prose"] [data-math]').first().boundingBox();
 // Focusing swaps KaTeX for the live field; the line must not jump.
 const line=()=>page.locator('[data-edit-root="prose"] .me-content p').first().evaluate(p=>p.getBoundingClientRect().height);
 const unfocusedLine=await line();
 await page.mouse.click(mounted.x+3,mounted.y+mounted.height/2);await inMath();await page.waitForTimeout(100);
 a=await active();assert.ok(a.position<=4,`click at the start (first fraction) gave ${a.position} of ${a.last}`);
 const focusedLine=await line();assert.ok(Math.abs(focusedLine-unfocusedLine)<=4,`line height ${unfocusedLine} → ${focusedLine} on focus`);
 await page.keyboard.press('Escape');await outOfMath();
 await page.mouse.click(mounted.x+mounted.width-2,mounted.y+mounted.height/2);await inMath();await page.waitForTimeout(100);
 a=await active();assert.ok(a.position>=a.last-1,`click at the end gave ${a.position} of ${a.last}`);

 step('Undo and redo keep typing inside the equation');
 await page.keyboard.press('End');await page.keyboard.type('7');await saved();
 // Studio groups a run of typing into one undo step, as Word does.
 await undoInMath('Control+z');await saved();
 const undone=(await active()).latex;assert.doesNotMatch(undone,/7$/);
 await page.keyboard.type('9');assert.equal((await active()).latex,undone+'9','typing after undo lands in the equation');await saved();
 await undoInMath('Control+z');await saved();assert.equal((await active()).latex,undone);
 await undoInMath('Control+y');await saved();assert.equal((await active()).latex,undone+'9');

 step('Ctrl+A selects within the equation only');
 await page.keyboard.press('Control+a');a=await active();assert.ok(a,'focus stayed in the equation');assert.deepEqual([Math.min(...a.selection),Math.max(...a.selection)],[0,a.last]);
 await page.keyboard.press('ArrowRight');

 step('Backspace beside an equation selects it, then deletes it');
 await page.keyboard.press('Escape');await outOfMath();
 const before=await islands('prose').count();
 await page.keyboard.press('Backspace');await inMath();a=await active();assert.deepEqual([Math.min(...a.selection),Math.max(...a.selection)],[0,a.last]);
 assert.equal(await islands('prose').count(),before,'first Backspace must not delete');
 await page.keyboard.press('Backspace');await outOfMath();assert.equal(await islands('prose').count(),before-1);
 await page.keyboard.press('Control+z');await saved();assert.equal(await islands('prose').count(),before);

 step('An empty equation stays findable and Backspace removes it');
 await openAtEnd('spare');await page.keyboard.press('Alt+Equal');await inMath();await page.keyboard.press('Escape');await outOfMath();
 const empty=await islands('spare').last().evaluate(h=>({empty:h.hasAttribute('data-math-empty'),width:h.getBoundingClientRect().width}));
 assert.ok(empty.empty&&empty.width>=8,'empty equation box '+JSON.stringify(empty));
 await page.keyboard.press('Backspace');await outOfMath();assert.equal(await islands('spare').count(),0);

 step('Display maths and table cells grow with their content');
 await page.keyboard.press('Escape');
 const centre=async locator=>{const b=await locator.boundingBox();await page.mouse.click(b.x+b.width/2,b.y+b.height/2);await inMath();};
 await centre(page.locator('[data-edit-root="display"] .clickable .katex').first());
 await page.keyboard.press('End');await page.keyboard.type('+1');a=await assertFits('display equation');assert.match(a.latex,/r\^2\+1$/);
 await page.keyboard.press('Escape');await outOfMath();
 await centre(page.locator('[data-edit-root="grid"] .clickable .katex').first());
 await page.keyboard.press('End');await page.keyboard.type('+5/8');await page.keyboard.press('ArrowRight');await page.keyboard.type('-1');
 a=await active();assert.ok(a.width>20,'table equation width '+a.width);
 const cell=await page.locator('[data-edit-root="grid"] td,[data-edit-root="grid"] th').first().evaluate(c=>c.getBoundingClientRect().width);
 if(a.scroll>a.client+1)assert.ok(a.width>=cell-12,`clipped table equation (${a.scroll}/${a.client}) did not use its cell (${a.width}/${cell})`);
 await page.keyboard.press('Escape');await outOfMath();
 // A new equation in a narrow cell is visible as it is typed.
 await page.locator('[data-edit-root="grid"] .me-content td').nth(1).click();await outOfMath();
 await page.keyboard.press('End');await page.keyboard.press('Alt+Equal');await inMath();await page.keyboard.type('a/b');await assertFits('new table equation');
 await page.keyboard.press('Escape');await saved();
 assert.match(block('display'),/r\^2\+1/);assert.match(block('grid'),/\\frac\{?a\}?\{?b\}?/);

 step('Pasted equations arrive with previews and edit like any other');
 await openAtEnd('spare');
 const pasted=JSON.stringify(fromSource('Then $z^2$ and $\\dfrac{1}{3}$ too.'));
 await page.locator('[data-edit-root="spare"] .me-content').evaluate((surface,json)=>{const data=new DataTransfer();data.setData('application/x-maths-editor+json',json);data.setData('text/plain','Then z^2 and 1/3 too.');surface.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));},pasted);
 await saved();
 const pastedHosts=await islands('spare').evaluateAll(hosts=>hosts.map(h=>({host:h.hasAttribute('data-math-preview-host'),preview:!!h.querySelector('[data-math-preview] .katex'),width:h.getBoundingClientRect().width})));
 assert.equal(pastedHosts.length,2,JSON.stringify(pastedHosts));assert.ok(pastedHosts.every(h=>h.host&&h.preview&&h.width>8),JSON.stringify(pastedHosts));
 await centre(islands('spare').last());await page.keyboard.press('End');await page.keyboard.type('+1');a=await assertFits('pasted equation');assert.match(a.latex,/\{3\}\+1$/,'typed into the pasted equation');
 await page.keyboard.press('Escape');await saved();assert.match(block('spare'),/\\dfrac\{1\}\{3\}\+1\$ too\./);

 step('Print shows KaTeX only, even for the equation being edited');
 await islands('prose').first().click();await inMath();await page.emulateMedia({media:'print'});
 const print=await islands('prose').first().evaluate(h=>({field:getComputedStyle(h.querySelector('math-field')).display,preview:getComputedStyle(h.querySelector('[data-math-preview]')).visibility}));
 await page.emulateMedia({media:'screen'});assert.deepEqual(print,{field:'none',preview:'visible'});
 await page.keyboard.press('Escape');await saved();

 step('Saved equations reopen with their previews');
 await page.reload({waitUntil:'networkidle'});await page.locator('[data-edit-root="blank"] .clickable').first().waitFor();
 assert.equal(await page.locator('[data-edit-root="blank"] .clickable .katex').count(),3);
 assert.match(block('prose'),/^Add \$\\dfrac\{2\}\{15\}.*9\$ and simplify\.$/);
 await page.screenshot({path:out+'/studio-equations.png'});
 assert.deepEqual(errors,[]);
 const report={passed:true,steps,errors};console.log(JSON.stringify(report));fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
}catch(e){fs.writeFileSync(out+'/failure-record.json',JSON.stringify(record,null,2));await page.screenshot({path:out+'/failure.png'});console.log('Failed during:',steps.at(-1));throw e;}finally{await browser.close();}
