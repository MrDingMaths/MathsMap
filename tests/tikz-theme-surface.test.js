import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compile} from 'svelte/compiler';
import {chromium} from 'playwright-core';

test('compiled Tikz surface preserves semantic paint, masks and geometry across themes and cached copies',async()=>{
 const source=fs.readFileSync('src/components/Tikz.svelte','utf8');
 const {css}=compile(source,{filename:'Tikz.svelte'});
 const scope=css.code.match(/svelte-[a-z0-9]+/)[0];
 const svg='<svg viewBox="0 0 120 80" width="120" height="80"><defs><clipPath id="clip"><rect width="40" height="40"/></clipPath></defs><path d="M0 0H120" stroke="black"/><path d="M5 15H80" stroke="red"/><path d="M5 25H80" stroke="#268cff"/><path d="M5 35H80" stroke="#19b38c"/><rect x="5" y="45" width="50" height="25" fill="#d4e8ff"/><rect x="20" y="48" width="10" height="15" fill="white"/><path d="M0 0H100V100" clip-path="url(#clip)" stroke="black"/><text x="65" y="60" fill="black" font-size="13.3333">A</text></svg>';
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage();
  await page.setContent(`<style>${css.code}</style><div id="empty" class="tikz-wrap ${scope}"></div><div id="drawing" class="tikz-wrap ${scope}">${svg}</div><p id="after">Following prose</p>`);
  const result=await page.evaluate(()=>{
   const host=document.querySelector('#drawing'),empty=document.querySelector('#empty'),rows=[];
   const sample=()=>({background:getComputedStyle(host).backgroundColor,filter:getComputedStyle(host.querySelector('svg')).filter,paint:[...host.querySelectorAll('path,rect,text')].map(el=>({stroke:getComputedStyle(el).stroke,fill:getComputedStyle(el).fill})),geometry:host.querySelector('svg').outerHTML,height:host.getBoundingClientRect().height,proseBelow:document.querySelector('#after').getBoundingClientRect().top>=host.getBoundingClientRect().bottom});
   for(const theme of ['dark','light','dark']){document.documentElement.dataset.theme=theme;rows.push(sample());}
   host.innerHTML=host.innerHTML;rows.push(sample());
   return {rows,empty:getComputedStyle(empty).backgroundColor,clip:host.querySelector('[clip-path]').getAttribute('clip-path')};
  });
  assert.equal(result.empty,'rgba(0, 0, 0, 0)','pending/error wrappers must not create white panels');
  for(const row of result.rows){assert.equal(row.background,'rgb(255, 255, 255)');assert.equal(row.filter,'none');assert.equal(row.proseBelow,true);assert.ok(row.height<120);assert.deepEqual(row.paint,result.rows[0].paint);assert.equal(row.geometry,result.rows[0].geometry);}
  assert.equal(result.rows[0].paint[2].stroke,'rgb(255, 0, 0)');
  assert.equal(result.rows[0].paint[3].stroke,'rgb(38, 140, 255)');
  assert.equal(result.rows[0].paint[4].stroke,'rgb(25, 179, 140)');
  assert.equal(result.rows[0].paint[6].fill,'rgb(255, 255, 255)');
  assert.equal(result.clip,'url(#clip)');
 }finally{await browser.close();}
});
