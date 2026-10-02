import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compile} from 'svelte/compiler';
import {chromium} from 'playwright-core';
import {combinedExampleTikz} from '../src/lib/booklet-preview.js';
import {diagramColourPolicy} from '../src/lib/diagram-colours.js';

const diagram=(id,body,extra={})=>({id,format:'tikz',code:'% mathsmap-diagram-colours '+JSON.stringify({version:1,kind:'graph',base:[],semantic:[{name:id,hex:id==='base'?'777777':'268CFF',reason:'original or transformed function'}],reference:id})+'\n'+String.raw`\begin{tikzpicture}[x=1cm,y=1cm]
\path[use as bounding box] (-2,-2) rectangle (2,2);
`+body+String.raw`\end{tikzpicture}`,...extra});
test('metadata-prefixed solution graphs retain axes, original curve and both colour roles',()=>{
 const base=diagram('base',String.raw`\draw[black] (-2,0)--(2,0);\draw[base] (-1,-1)--(1,1);`),overlay=diagram('result',String.raw`\draw[result] (-1,1)--(1,-1);`,{overlayOf:'base'});
 const result=combinedExampleTikz(base,overlay);
 assert.ok(result.includes('\\draw[black]'));assert.ok(result.includes('\\draw[base]'));assert.ok(result.includes('\\draw[result]'));
 assert.deepEqual(diagramColourPolicy(result).semantic.map(c=>c.name),['base','result']);
 assert.equal((result.match(/\\begin\{tikzpicture\}/g)||[]).length,1);
 assert.equal(combinedExampleTikz(base,{...overlay,code:overlay.code.replace('x=1cm','x=2cm')}),null);
 assert.equal(combinedExampleTikz(base,{...overlay,code:overlay.code.replace('rectangle (2,2)','rectangle (3,2)')}),null);
});

test('fallback overlays remain transparent across themes, cached copies and print',async()=>{
 const {css}=compile(fs.readFileSync('src/components/Tikz.svelte','utf8'),{filename:'Tikz.svelte'});
 const scope=css.code.match(/svelte-[a-z0-9]+/)[0];
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage();
  await page.setContent(`<style>${css.code}</style><div class="tikz-wrap ${scope}" id="base"><svg><path stroke="black" d="M0 0H100"/></svg></div><div class="tikz-wrap transparent ${scope}" id="overlay"><svg><path stroke="#268cff" d="M0 10H100"/><rect fill="white" width="2" height="2"/></svg></div>`);
  for(const media of ['screen','print']){
   await page.emulateMedia({media});
   for(const theme of ['light','dark']){
    const state=await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;const overlay=document.querySelector('#overlay');overlay.innerHTML=overlay.innerHTML;return {base:getComputedStyle(document.querySelector('#base')).backgroundColor,overlay:getComputedStyle(overlay).backgroundColor,mask:getComputedStyle(overlay.querySelector('rect')).fill,curve:getComputedStyle(overlay.querySelector('path')).stroke};},theme);
    assert.equal(state.base,'rgb(255, 255, 255)');assert.equal(state.overlay,'rgba(0, 0, 0, 0)');assert.equal(state.mask,'rgb(255, 255, 255)');assert.equal(state.curve,'rgb(38, 140, 255)');
   }
  }
  for(const file of ['BookletArrangement.svelte','PracticeQuestionRenderer.svelte','TranscribedBookletPage.svelte'])assert.match(fs.readFileSync('src/components/'+file,'utf8'),/transparent|diagramView\(overlay,true\)/);
 }finally{await browser.close();}
});
