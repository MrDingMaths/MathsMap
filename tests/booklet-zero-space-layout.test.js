import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';

const styles=name=>fs.readFileSync(new URL('../src/components/'+name+'.svelte',import.meta.url),'utf8').split('<style>')[1].split('</style>')[0];

test('zero-space restore handles do not inflate stacked/grid worksheet parts on screen',async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage();
  const part=(space,hidden)=>`<div class="arr-group" style="--arr-gap:2mm"><div class="arr-item" style="height:5mm">Prompt</div><div class="arr-item ${space?'':'zero-space'} ${hidden?'hidden-space':''}"><div class="arr-space space-edit" style="height:${space}mm;min-height:${space}mm"></div><button class="space-handle worksheet-handle" aria-label="Restore space"></button></div></div>`;
  await page.setContent(`<style>${styles('BookletArrangement')}body{margin:0}.booklet-arrangement{width:180mm}.arr-row{grid-template-columns:1fr 1fr}</style>`+
   ['editing','measuring'].map(mode=>`<div id="${mode}" class="booklet-arrangement"><div class="arr-group arr-row" style="--arr-gap:3mm">${Array.from({length:28},(_,i)=>part(i===27?12:0,mode==='measuring'&&i!==27)).join('')}</div></div>`).join(''));
  const height=id=>page.locator('#'+id).evaluate(el=>el.getBoundingClientRect().height);
  const screen=await height('editing'),measuring=await height('measuring');
  assert.ok(Math.abs(screen-measuring)<.1,'Restore controls must not accumulate row gaps');
  assert.ok(await page.getByRole('button',{name:'Restore space'}).first().isVisible(),'Zero-space handle remains reachable');
  await page.emulateMedia({media:'print'});
  assert.ok(Math.abs(await height('editing')-screen)<.1,'Printed geometry agrees with editing geometry');
 }finally{await browser.close();}
});

test('legacy collapsed response control overlays rather than reserving blank working space',async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage();
  const node=collapsed=>`<section class="question-node"><div style="height:8mm">Prompt</div>${collapsed?'<div class="answer-space collapsed resizable" style="height:0mm"><span class="space-label">Restore answer space</span><span class="space-handle"></span></div>':''}</section>`;
  await page.setContent(`<style>${styles('PracticeQuestionRenderer')}body{margin:0}</style><div id="editing">${node(true)}</div><div id="measuring">${node(false)}</div>`);
  const sizes=await page.locator('#editing,#measuring').evaluateAll(elements=>elements.map(el=>el.getBoundingClientRect().height));
  assert.ok(Math.abs(sizes[0]-sizes[1])<.1);
  assert.ok(await page.locator('.answer-space.collapsed').isVisible(),'Restore control remains reachable in the gutter');
 }finally{await browser.close();}
});
