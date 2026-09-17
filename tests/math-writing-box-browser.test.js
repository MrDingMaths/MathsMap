import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {renderMath} from '../src/lib/render-math.js';

test('native writing blanks preserve physical size and the equation writing baseline',async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage();
  const katex=fs.readFileSync(new URL('../node_modules/katex/dist/katex.min.css',import.meta.url),'utf8');
  await page.setContent(`<style>${katex}body{font-size:12pt}.baseline{display:inline-block;width:0;height:0}</style>`+[6,8].map(height=>`<p>${renderMath('$x^2+\\enclose{dottedbox}{\\rule{0pt}{'+height+'mm}\\hspace{18mm}}=4$')}<span class="baseline"></span></p>`).join(''));
  const bounds=await page.locator('p').evaluateAll(ps=>ps.map(p=>{
   const blank=[...p.querySelectorAll('[style]')].find(n=>n.style.borderBottom),r=blank.getBoundingClientRect();
   return{baseline:p.querySelector('.baseline').getBoundingClientRect().bottom,bottom:r.bottom,width:r.width,height:r.height};
  }));
  for(let i=0;i<bounds.length;i++){
   assert.ok(Math.abs(bounds[i].bottom-bounds[i].baseline)<1,'Dotted writing edge must sit on the equation baseline');
   assert.ok(Math.abs(bounds[i].width*25.4/96-18)<.1,'Writing width must remain 18 mm');
   assert.ok(bounds[i].height*25.4/96>=[6,8][i]-.1,'Fraction/ordinary handwriting height must not shrink');
  }
 }finally{await browser.close();}
});

test('question labels share the first text baseline beside tall inline maths',async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage();
  const source=fs.readFileSync(new URL('../src/components/PracticeQuestionRenderer.svelte',import.meta.url),'utf8');
  const rule=source.match(/\.question-line\s*\{\s*display:[^}]+\}/)[0];
  await page.setContent(`<style>${rule}body{font:12pt Arial}.baseline{display:inline-block;width:0;height:0}.tall{display:inline-block;height:8mm;width:18mm;overflow:hidden;border-bottom:1px dotted}</style><div class="question-line"><span class="part-label">a<span class="baseline"></span></span><div class="prompt"><div><span class="tall"></span> Marker<span class="baseline"></span></div></div></div>`);
  const y=await page.locator('.baseline').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().bottom));
  assert.ok(Math.abs(y[0]-y[1])<.5,'Part label must align with the first equation/prose baseline');
 }finally{await browser.close();}
});
