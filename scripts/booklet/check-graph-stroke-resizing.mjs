import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {loadTikzEngine} from './check-pgfplots-engine.mjs';
import {graphTikz} from '../../src/lib/graph-model.js';

const compile=await loadTikzEngine();
const baseIndex=process.argv.indexOf('--base'),base=baseIndex<0?'http://127.0.0.1:5173':process.argv[baseIndex+1];
const code=graphTikz({lines:[{m:1,c:0,dashed:true}],xminor:1,yminor:1});
const {svg}=await compile(code);
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
  const page=await browser.newPage();
  await page.goto(base+'/libs/tikzjax/fonts.css');
  await page.setContent('<style>.booklet-page{width:210mm;transform-origin:top left}#host{width:40mm}svg{width:100%;height:auto}</style><article class="booklet-page"><div id="host"></div></article>');
  const result=await page.evaluate(async svg=>{
    const {watchGraphStrokes,calibrateGraphStrokes,graphPageScale}=await import('/src/lib/graph-strokes.js');
    const host=document.querySelector('#host'),article=document.querySelector('article');
    const stop=watchGraphStrokes(host),frame=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    host.innerHTML=svg;await frame();
    const measure=label=>{
      const paths=[...host.querySelectorAll('[data-graph-stroke-pt]')];
      return {label,count:paths.length,error:Math.max(...paths.map(p=>{
        const m=p.getScreenCTM();return Math.abs(parseFloat(getComputedStyle(p).strokeWidth)*Math.sqrt(Math.abs(m.a*m.d-m.b*m.c))/graphPageScale(p)*72/96-Number(p.dataset.graphStrokePt));
      }))};
    };
    const results=[measure('initial 40 mm')];
    host.style.width='90mm';await frame();results.push(measure('resized 90 mm'));
    article.style.transform='scale(.6)';await frame();results.push(measure('60% page zoom'));
    const cached=host.innerHTML;host.innerHTML=cached;host.style.width='55mm';await frame();results.push(measure('cached SVG at 55 mm'));
    host.style.width='70mm';window.dispatchEvent(new Event('beforeprint'));results.push(measure('synchronous beforeprint'));
    calibrateGraphStrokes(host);results.push(measure('explicit export settling'));
    stop();return results;
  },svg);
  for(const r of result){assert.ok(r.count>0,r.label);assert.ok(r.error<.05,JSON.stringify(r));}
  fs.writeFileSync('output/graph-strokes/resize-check.json',JSON.stringify(result,null,2));console.log(result);
}finally{await browser.close();}
