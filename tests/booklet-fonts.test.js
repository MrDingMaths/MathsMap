import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright-core';
import {settleBookletFonts} from '../src/lib/booklet-fonts.js';

const evaluateFonts=page=>page.evaluate(async fn=>{
 const settle=new Function('nunitoLoads','return ('+fn+')')(new WeakMap());
 await settle(document.querySelector('main'));
 await settle(document.querySelector('main'));
 return [...document.fonts].filter(f=>f.family==='Nunito'&&f.status==='loaded').map(f=>({weight:f.weight,status:f.status}));
},settleBookletFonts.toString());

test('local Nunito loads for all booklet weights without external font access',async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage();let external=0;
  await page.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.hostname!=='booklet-fonts.test'){external++;return route.abort();}
   if(url.pathname.startsWith('/libs/fonts/nunito/'))return route.fulfill({body:fs.readFileSync(path.join('public',url.pathname)),contentType:url.pathname.endsWith('.css')?'text/css':'font/woff2'});
   return route.fulfill({contentType:'text/html',body:'<link rel="stylesheet" href="/libs/fonts/nunito/fonts.css"><main style="font-family:Nunito,sans-serif">Booklet 123</main>'});
  });
  await page.goto('http://booklet-fonts.test/');
  const loaded=await evaluateFonts(page);
  assert.equal(external,0);assert.ok(loaded.length>0);
  assert.ok(loaded.every(f=>f.status==='loaded'&&f.weight==='300 800'));
  const index=fs.readFileSync('index.html','utf8');
  assert.ok(index.includes('/libs/fonts/nunito/fonts.css'));
  assert.ok(!index.includes('fonts.googleapis.com'));
 }finally{await browser.close();}
});

test('missing Nunito is rejected even when FontFaceSet.check reports success',async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage();await page.setContent('<main style="font-family:Nunito,sans-serif">Booklet</main>');
  assert.equal(await page.evaluate(()=>document.fonts.check('11pt Nunito')),true);
  await assert.rejects(evaluateFonts(page),/Nunito booklet font is unavailable/);
  await page.locator('main').evaluate(n=>n.style.fontFamily='serif');
  assert.deepEqual(await evaluateFonts(page),[]);
 }finally{await browser.close();}
});

test('registered Nunito with an unavailable binary prevents pagination and print',async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage();await page.route('**/missing.woff2',r=>r.abort());
  await page.setContent('<style>@font-face{font-family:Nunito;src:url(https://booklet-fonts.test/missing.woff2);font-weight:300 800}main{font-family:Nunito,sans-serif}</style><main>Booklet</main>');
  await assert.rejects(evaluateFonts(page),/load|network|font/i);
 }finally{await browser.close();}
});
