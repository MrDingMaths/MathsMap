import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {documentHtml} from '../src/lib/document-content.js';
import {renderMath} from '../src/lib/render-math.js';
import {compactDisjunctDisplay,compactDocumentDisjuncts} from '../src/lib/compact-disjuncts.js';
import {compactAnswerProseGlue} from '../src/lib/compact-answer-glue.js';
const latex=String.raw`-\frac{1+\sqrt5}{2}\le x<-1\quad\text{or}\quad x=0\quad\text{or}\quad 1<x\le\frac{1+\sqrt5}{2}`;
test('explicit top-level alternatives are display-only and unsupported boundaries stay exact',()=>{
 const doc={format:'maths-editor-document-v1',version:1,blocks:[{id:'result',type:'paragraph',inlines:[{type:'math',latex,display:false}]}]},before=structuredClone(doc),candidate=compactDocumentDisjuncts(doc);
 assert.deepEqual(doc,before);assert.notEqual(candidate.blocks[0].inlines[0].latex,latex);assert.equal(candidate.blocks[0].id,'result');
 assert.deepEqual(compactDocumentDisjuncts(candidate),candidate);
 for(const unsupported of [String.raw`x=0\text{or}x=1`,String.raw`\frac{x\quad\text{or}\quad y}{2}`,String.raw`{x\quad\text{or}\quad y`,String.raw`x\quad\text{or}\quad`,String.raw`\begin{align}x\quad\text{or}\quad y\end{align}`])assert.equal(compactDisjunctDisplay(unsupported),unsupported);
 const ordinary={format:'maths-editor-document-v1',blocks:[{type:'paragraph',inlines:[{type:'math',latex:'x=2'}]}]};assert.equal(compactDocumentDisjuncts(ordinary),ordinary);
});
test('whole alternatives and absolute atoms retain valid MathML/HTML siblings at compact widths',async()=>{
 const css=fs.readFileSync('node_modules/katex/dist/katex.min.css','utf8').replace(/url\((fonts\/[^)]+)\)/g,(_,name)=>'url(data:font/woff2;base64,'+fs.readFileSync('node_modules/katex/dist/'+name).toString('base64')+')');
 const doc={format:'maths-editor-document-v1',blocks:[{id:'result',type:'paragraph',inlines:[{type:'math',latex,display:false}]}]};
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try {
  const page=await browser.newPage();
  await page.setContent('<style>'+css+'body{font:9pt serif}.sample{width:72mm}</style><section class="sample">'+documentHtml(compactDocumentDisjuncts(doc),{mathsStyle:'display-glyphs'})+'</section><section class="absolute">'+renderMath(compactAnswerProseGlue('$|2y-7|\\ge15$.'))+'</section><p id="following">Following editable answer</p>');
  await page.evaluate(()=>document.fonts.ready);
  const result=await page.evaluate(()=>{
   const sample=document.querySelector('.sample'),atoms=sample.querySelectorAll('.katex-html > .base > .mord');
   if(atoms.length!==3||sample.contains(document.querySelector('.absolute'))||document.querySelector('#following').parentElement!==document.body)throw Error('MathML swallowed subsequent document content');
   let cases=0;for(let width=260;width<=330;width+=5){sample.style.width=width+'px';const right=sample.getBoundingClientRect().right;for(const atom of atoms)if(atom.getClientRects().length!==1||atom.getBoundingClientRect().right>right+.1)throw Error('Complete inequality split or overflowed');cases++;}
   const absolute=document.querySelector('.absolute .katex-html .base .mord');
   if(absolute.getClientRects().length!==1||!absolute.textContent.includes('7'))throw Error('Absolute atom not kept together');
   return cases;
  });
  assert.equal(result,15);
 }finally{await browser.close();}
});
