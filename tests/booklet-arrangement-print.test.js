import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {chromium} from 'playwright-core';

test('arrangement labels share tall prompt baselines on screen and in print',async()=>{
 const css=fs.readFileSync(new URL('../src/components/BookletArrangement.svelte',import.meta.url),'utf8').split('<style>')[1].split('</style>')[0];
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage();
  await page.setContent(`<style>${css}.booklet-arrangement{width:180mm}.baseline{display:inline-block;width:0;height:0}.blank{display:inline-block;width:18mm;height:8mm;border-bottom:1px dotted;overflow:hidden}</style><div class="booklet-arrangement"><div class="arr-group labelled baseline-label"><div class="arr-item label-item"><b>a</b><span class="baseline"></span></div><div class="arr-item"><div><span class="blank"></span> Equation<span class="baseline"></span></div></div><div class="arr-item" style="height:20mm"></div></div></div>`);
  for(const media of ['screen','print']){
   await page.emulateMedia({media});const y=await page.locator('.baseline').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().bottom));
   assert.ok(Math.abs(y[0]-y[1])<.5,media+': tall maths must not detach the label from its baseline');
  }
 }finally{await browser.close();}
});

test('labelled diagram rows retain their measured columns in print',async()=>{
 const css=fs.readFileSync(new URL('../src/components/BookletArrangement.svelte',import.meta.url),'utf8').split('<style>')[1].split('</style>')[0];
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage();
  await page.setContent(`<style>${css}body{margin:0}.booklet-arrangement{width:180mm}.figure{height:35mm}.statement{height:25mm}</style><div class="booklet-arrangement"><div class="arr-group arr-row labelled" style="--arr-gap:5mm;grid-template-columns:46fr 100fr"><div class="arr-item label-item">a</div><div class="arr-item figure">Diagram</div><div class="arr-item statement">Reason and working</div></div></div>`);
  const bounds=()=>page.locator('.arr-row').evaluate(row=>({height:row.getBoundingClientRect().height,cells:[...row.querySelectorAll('.figure,.statement')].map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width};})}));
  const screen=await bounds();await page.emulateMedia({media:'print'});const print=await bounds();
  assert.deepEqual(print,screen,'Printing must retain the measured row width and height');
  assert.equal(print.cells[0].y,print.cells[1].y);assert.ok(print.cells[1].x>print.cells[0].x+print.cells[0].width);
 }finally{await browser.close();}
});

test('printed arrangements retain first-part labels and handwriting space on later pages',async t=>{
 const probe=spawnSync('pdftotext',['-v'],{encoding:'utf8'});
 if(probe.error?.code==='ENOENT'){t.skip('Poppler is required for PDF geometry verification');return;}
 const css=fs.readFileSync(new URL('../src/components/BookletArrangement.svelte',import.meta.url),'utf8').split('<style>')[1].split('</style>')[0];
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'booklet-arrangement-print-'));
 try{
  const page=await browser.newPage();
  const part=(label,marker)=>`<div class="arr-group labelled"><div class="arr-item label-item">${label}</div><div class="arr-item">${marker}</div><div class="arr-item"><div class="arr-space" style="height:20mm"></div></div><div class="arr-item">End${marker}</div></div>`;
  const sheet=n=>`<article><div class="booklet-arrangement"><div class="arr-group labelled"><div class="arr-item label-item">${n}</div><div class="arr-item">Question${n}</div><div class="arr-group arr-row" style="grid-template-columns:1fr 1fr">${part('A','First'+n)}${part('B','Second'+n)}</div></div></div></article>`;
  await page.setContent(`<style>${css} @page{size:A4;margin:0}body{margin:0}article{box-sizing:border-box;width:210mm;height:297mm;padding:10mm 15mm;break-after:page}.arr-group{--arr-gap:2mm}.label-item{font-weight:bold}</style>${Array.from({length:10},(_,i)=>sheet(i+1)).join('')}`);
  await page.emulateMedia({media:'print'});
  await page.pdf({path:path.join(dir,'output.pdf'),preferCSSPageSize:true});
  const result=spawnSync('pdftotext',['-bbox',path.join(dir,'output.pdf'),'-'],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const sheets=[...result.stdout.matchAll(/<page\b[^>]*>([\s\S]*?)<\/page>/g)];
  assert.equal(sheets.length,10);
  for(let i=0;i<10;i++){
   const words=[...sheets[i][1].matchAll(/<word xMin="([^"]+)" yMin="([^"]+)" xMax="([^"]+)" yMax="([^"]+)">([^<]+)<\/word>/g)];
   const word=text=>words.find(w=>w[5]===text),n=i+1;
   for(const [label,marker]of [['A','First'],['B','Second']]){
    assert.ok(word(label),`page ${n}: missing ${label} label`);
    assert.ok(word(marker+n)&&word('End'+marker+n));
    assert.ok(Math.abs(Number(word(label)[2])-Number(word(marker+n)[2]))<1,`page ${n}: label baseline`);
    assert.ok(Number(word('End'+marker+n)[2])-Number(word(marker+n)[4])>=20*72/25.4,`page ${n}: collapsed handwriting space`);
   }
  }
 }finally{await browser.close();assert.equal(path.dirname(path.resolve(dir)),path.resolve(os.tmpdir()));fs.rmSync(dir,{recursive:true,force:true});}
});
