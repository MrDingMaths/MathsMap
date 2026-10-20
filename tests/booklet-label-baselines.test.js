import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright-core';
import katex from 'katex';

test('question and arrangement labels follow the opening equation baseline after layout changes',async()=>{
 let browser;try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
 try{
  const page=await browser.newPage();
  const css=pathToFileURL(path.resolve('node_modules/katex/dist/katex.min.css')).href;
  await page.goto(css);
  const equation=katex.renderToString(String.raw`\begin{aligned}4\times1&=4\\7\times1&=7\\(-3)\times1&=-3\end{aligned}`,{output:'html'});
  await page.setContent(`<link rel="stylesheet" href="${css}"><style>body{font:11pt Arial}.question-line,.arr-group{display:flex;align-items:flex-start;gap:8px;margin:15px}.part-label,.label-item{font-weight:bold}table{border-collapse:collapse}td{height:35px;vertical-align:middle}p{margin:4px 0}</style>
   <div id="multiline" class="arr-group"><b class="label-item">a</b><div>${equation}</div></div>
   <div id="native" class="question-line"><b class="part-label">a</b><div data-table-wrap><table><tr><td></td><td><p>x + 3</p></td></tr><tr><td>=</td><td><p>5 + 3</p></td></tr><tr><td>=</td><td><p>8</p></td></tr></table></div></div>`);
  await page.addScriptTag({content:fs.readFileSync('src/lib/booklet-table-label.js','utf8').replace('export function alignNativeTableLabel','window.alignNativeTableLabel = function')});
  const result=await page.evaluate(async()=>{
   await document.fonts.ready;
   const wait=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   const actions=[...document.querySelectorAll('#multiline,#native')].map(e=>window.alignNativeTableLabel(e,true));await wait();
   const baseline=e=>{const marker=document.createElement('span');marker.style='display:inline-block;width:0;height:0;vertical-align:baseline';e.append(marker);const y=marker.getBoundingClientRect().bottom;marker.remove();return y;};
   const errors=()=>[...document.querySelectorAll('#multiline,#native')].map(e=>{
    const first=e.id==='native'?e.querySelector('tr:first-child p'):e.querySelector('.mtable > span > .vlist-t > .vlist-r > .vlist > span');
    return Math.abs(baseline(e.firstElementChild)-baseline(first));
   });
   const initial=errors();document.querySelector('#native td').style.height='60px';document.querySelector('#multiline').style.fontSize='17pt';await wait();await wait();const resized=errors();
   actions.forEach(a=>a.update(false));const cleared=[...document.querySelectorAll('.part-label,.label-item')].every(e=>!e.style.translate);actions.forEach(a=>a.destroy());return {initial,resized,cleared};
  });
  for(const error of [...result.initial,...result.resized])assert(error<0.5,`Opening baseline differs by ${error}px`);
  assert(result.cleared,'disabling alignment restores the original label position');
 }finally{await browser.close();}
});
