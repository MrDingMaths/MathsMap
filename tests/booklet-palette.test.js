import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {migrateBookletPalette} from '../scripts/booklet/normalise-booklet-palette.mjs';
import {BOOKLET_PALETTE,STANDARD_TIKZ_DEFINITIONS,standardBookletContent,standardTikzColours,standardBookletColour} from '../public/libs/maths-editor/booklet-palette.mjs';
import {bookletColours} from '../src/lib/booklet-document-tools.js';
import {readGraphModel} from '../src/lib/graph-model.js';
import {inspectBookletPalette} from '../src/lib/booklet-palette-qa.js';
import {chromium} from 'playwright-core';
import {inspectStoredBookletPalette} from '../scripts/booklet/audit-booklet-palette.mjs';
test('palette preserves roles, maps legacy prose/maths/fills and leaves unknowns reviewable',()=>{
 assert.equal(standardBookletColour('#AA0505'),BOOKLET_PALETTE.red);
 assert.equal(standardBookletColour('pink'),BOOKLET_PALETTE.red);
 assert.equal(standardBookletColour('#abcdef'),'#abcdef');
 const source={id:'a',text:String.raw`$\color{#056FDB}x$`,background:'#FABDA6',source:{colour:'#AA0505'},sourceAtom:{headerFill:'#AA0505'},type:'paragraph'};
 const next=standardBookletContent(source);assert.equal(next.text,String.raw`$\color{#268cff}x$`);assert.equal(next.background,BOOKLET_PALETTE.orangeFill);assert.deepEqual(next.source,source.source);assert.deepEqual(next.sourceAtom,source.sourceAtom);
 assert.ok(bookletColours({sections:[source]}).every(c=>Object.values(BOOKLET_PALETTE).includes(c.value)));
 const supplemental={afterDiagramPrompt:String.raw`$\color{#0000ff}x$`,source:{colour:'#abcdef'}};assert.equal(inspectStoredBookletPalette(supplemental).length,1);assert.equal(inspectStoredBookletPalette(standardBookletContent(supplemental)).length,0);
});

test('palette acceptance covers editable paints and backgrounds, rejects source exemptions and ignores controls/raster pixels',async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{const page=await browser.newPage();await page.setContent('<main style="color:#24282d;background:white"><h1 style="background:#d4e8ff">Heading</h1><p style="color:#abcdef">Custom equation <span style="background:#123456">x</span></p><svg><metadata data-graph-source-palette="ABCDEF"/><path fill="#abcdef" stroke="#268cff" d="M0 0L20 20L20 0Z"/></svg><button style="color:#123123">Application control</button><img alt="Source photograph" style="background:#321321" width="20" height="20"></main>');
 const issues=await page.evaluate(({fn,palette})=>new Function('BOOKLET_PALETTE','return ('+fn+')')(palette)(document.querySelector('main')),{fn:inspectBookletPalette.toString(),palette:BOOKLET_PALETTE});
 assert.deepEqual(new Set(issues.map(i=>i.role)),new Set(['text','background','fill']));assert.equal(issues.length,4);assert.ok(issues.every(i=>!['rgb(18, 49, 35)','rgb(50, 19, 33)'].includes(i.colour)));
 }finally{await browser.close();}
});

test('palette definitions stay outside drawing commands in single-line and nested-option TikZ',()=>{
 for(const options of ['[line width=0.8pt]','[every node/.style={font=\\fontsize{10}{12}\\selectfont},label={[red]above:x}]','']){
  const source=String.raw`\begin{tikzpicture}`+options+String.raw`\special{dvisvgm:raw <metadata/>}\draw[black] (0,0)--(1,1);\end{tikzpicture}`;
  const result=standardTikzColours(source),draw=result.indexOf('\\draw[black]');
  assert.ok(result.indexOf(STANDARD_TIKZ_DEFINITIONS)<result.indexOf('\\special{'));
  assert.match(result.slice(draw),/^\\draw\[black\] \(0,0\)--\(1,1\);/);
  assert.equal(standardTikzColours(result),result);
 }
});

test('main section bands require muted blue and white text, including nested maths; other headings retain ink',async()=>{
 assert.equal(standardBookletColour('#52769a',{background:true}),BOOKLET_PALETTE.headerBlue);
 assert.deepEqual(standardBookletContent({background:'#52769a',colour:'#ffffff'}),{background:'#52769a',colour:'#ffffff'});
 assert.doesNotMatch(STANDARD_TIKZ_DEFINITIONS,/headerBlue/,'Header paint does not invalidate diagram caches');
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage();
  await page.setContent('<main style="color:#24282d"><header class="section-band" style="background:#52769a;color:white">Topic <span>x²</span></header><header class="section-band difficulty-heading">Exercise 1</header><div class="accent-header" style="background:#d4e8ff">Key Ideas</div></main>');
  const inspect=()=>page.evaluate(({fn,palette})=>new Function('BOOKLET_PALETTE','return ('+fn+')')(palette)(document.querySelector('main')),{fn:inspectBookletPalette.toString(),palette:BOOKLET_PALETTE});
  assert.deepEqual(await inspect(),[]);
  await page.locator('.section-band span').evaluate(el=>el.style.color='#24282d');
  assert.ok((await inspect()).some(i=>i.kind==='booklet-section-header'&&i.role==='text'));
  await page.locator('.section-band').first().evaluate(el=>el.style.background='#268cff');
  assert.ok((await inspect()).some(i=>i.kind==='booklet-section-header'&&i.role==='background'));
 }finally{await browser.close();}
});

test('native gradients validate actual stops and reject custom, missing or cyclic paint servers',async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage();
  await page.setContent('<main style="color:#24282d"><svg width="200" height="100"><defs><linearGradient id="source"><stop stop-color="#d4e8ff"/><stop offset="1" stop-color="#ffffff"/></linearGradient><linearGradient id="alias" href="#source"/><linearGradient id="cycle" href="#cycle"/></defs><rect width="100" height="100" fill="url(#alias)"/></svg></main>');
  const inspect=()=>page.evaluate(({fn,palette})=>new Function('BOOKLET_PALETTE','return ('+fn+')')(palette)(document.querySelector('main')),{fn:inspectBookletPalette.toString(),palette:BOOKLET_PALETTE});
  assert.deepEqual(await inspect(),[]);
  await page.locator('stop').first().evaluate(el=>el.setAttribute('stop-color','#abcdef'));
  assert.ok((await inspect()).some(i=>i.role==='fill-stop0'&&i.colour==='rgb(171, 205, 239)'));
  for(const id of ['missing','cycle']){await page.locator('rect').evaluate((el,id)=>el.setAttribute('fill','url(#'+id+')'),id);assert.ok((await inspect()).some(i=>i.role==='fill'));}
 }finally{await browser.close();}
});
test('all active project palette migrations are idempotent and preserve settings and mathematical graph recognition',()=>{
 for(const file of fs.readdirSync('booklets/projects').filter(f=>f.endsWith('.json'))){
  const source=JSON.parse(fs.readFileSync('booklets/projects/'+file)),{next}=migrateBookletPalette(source);
  assert.equal(migrateBookletPalette(next).records.length,0,file);
  assert.deepEqual(next.source,source.source);assert.equal(next.sections.length,source.sections.length);
  const known=new Set();const collect=n=>{if(!n||typeof n!=='object')return;if(n.code&&readGraphModel(n.code))known.add(n.id);for(const[k,v]of Object.entries(n))if(!['source','spec','sourceReview','sourceAtom','sourceLayoutEvidence','originalDiagram','originalContent','before','after'].includes(k))collect(v);};collect(source.sections);
  const walk=n=>{if(!n||typeof n!=='object')return;if(n.format==='tikz'){assert.equal(standardTikzColours(n.code),n.code);if(known.has(n.id))assert.ok(readGraphModel(n.code),'Model recognition: '+n.id);}for(const[k,v]of Object.entries(n))if(!['source','spec','sourceReview','sourceAtom','sourceLayoutEvidence','originalDiagram','originalContent','before','after'].includes(k))walk(v);};walk(next.sections);
 }
});
