import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createServer} from 'vite';
import {chromium} from 'playwright-core';
import {captureTikzCard} from '../scripts/lib/tikz-card-capture.mjs';

test('mounted six box-plot cards capture full ink at original fitting and restore even after failure',{timeout:180000},async()=>{
 const dir='.agywork/tikz-card-capture-test-'+Date.now();fs.mkdirSync(dir,{recursive:true});
 // An existing canonical dev server avoids competing dependency optimizers.
 // Standalone runs isolate their Vite cache from any concurrent development.
 const server=process.env.MATHSMAP_TEST_BASE?null:await createServer({cacheDir:dir+'/vite-cache',server:{port:0,host:'127.0.0.1',open:false},logLevel:'silent'});if(server)await server.listen();
 const base=process.env.MATHSMAP_TEST_BASE||server.resolvedUrls.local[0];
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:2000},deviceScaleFactor:2});
  const fixtures=JSON.parse(fs.readFileSync(new URL('./fixtures/compare-box-plots-labels.json',import.meta.url)));
  await page.route('**/capture-test.json',r=>r.fulfill({contentType:'application/json',body:JSON.stringify(fixtures)}));
  await page.goto(base.replace(/\/$/,'')+'/#/tikz-check?input=%2Fcapture-test.json',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.__tikzCheckDone===true,{timeout:150000});await page.evaluate(()=>document.fonts.ready);
  const snapshot=card=>card.evaluate(el=>({styles:[el,...el.querySelectorAll('*')].map(n=>n.getAttribute('style')),svgs:[...el.querySelectorAll('.stage svg')].map(svg=>({width:svg.getBoundingClientRect().width,viewBox:svg.getAttribute('viewBox'),paths:[...svg.querySelectorAll('path')].map(p=>p.getAttribute('d')),targets:[...svg.querySelectorAll('[data-diagram-label="1"]')].map(g=>g.dataset.labelTargetPt)}))}));
  const cards=await page.$$('.grid .card');assert.equal(cards.length,6);let clipped=0;
  for(const [index,card]of cards.entries()){
   await card.scrollIntoViewIfNeeded();
   const baseline=await card.evaluate(el=>{const s=el.querySelector('.stage');return{width:s.clientWidth,ink:s.scrollWidth};});
   if(baseline.ink>baseline.width)clipped++;
   await card.screenshot({path:dir+'/baseline-'+index+'.png'});
   const before=await snapshot(card);
   const bounds=await captureTikzCard(card,{path:dir+'/complete-'+index+'.png'});
   assert.ok(bounds.stages.every(s=>s.fullInkWidth<=s.width+1));
   assert.deepEqual(await snapshot(card),before,'all temporary styles and native geometry restored');
   await assert.rejects(captureTikzCard(card,{path:dir}),/EISDIR|illegal operation|directory/i);
   assert.deepEqual(await snapshot(card),before,'screenshot failure restores every temporary style');
   assert.ok(before.svgs[0].targets.every(p=>p==='10'));
  }
  assert.equal(clipped,6,'current live scroll/card screenshot baseline clips all six full scroll surfaces');
  const card=cards[0];
  for(const [zoom,scale]of [[.7,1],[1.4,1],[1,.7],[1,1.4]]){
   await card.evaluate((el,{zoom,scale})=>{el.style.zoom=String(zoom);el.style.transform=`scale(${scale})`;el.style.transformOrigin='top left';const stage=el.querySelector('.stage');stage.scrollLeft=Math.min(30,stage.scrollWidth-stage.clientWidth);},{zoom,scale});
   const before=await snapshot(card),scroll=await card.evaluate(el=>el.querySelector('.stage').scrollLeft);
   await captureTikzCard(card,{path:dir+`/scaled-${zoom}-${scale}.png`});assert.deepEqual(await snapshot(card),before,'CSS zoom/transform preserves native fitting/styles');
   assert.equal(await card.evaluate(el=>el.querySelector('.stage').scrollLeft),scroll,'original scroll offset restored');
   await assert.rejects(captureTikzCard(card,{path:dir}),/EISDIR|illegal operation|directory/i);
   assert.deepEqual(await snapshot(card),before);assert.equal(await card.evaluate(el=>el.querySelector('.stage').scrollLeft),scroll,'failed capture restores scroll');
  }
  console.log('Actual mounted baseline/full-ink captures retained at '+dir);
 }finally{await browser.close();if(server)await server.close();}
});
