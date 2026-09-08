import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {styleGraph,graphTikz} from '../../src/lib/graph-model.js';
import {loadTikzEngine} from './check-pgfplots-engine.mjs';
const out='output/graph-typography';fs.mkdirSync(out,{recursive:true});
const p=JSON.parse(fs.readFileSync(out+'/before.json'));
const selected=[];
function walk(n){if(!n||typeof n!=='object')return;if(['page-85-diag-ex-2','page-90-identify-b-diagram'].includes(n.id))selected.push(n);for(const[k,v]of Object.entries(n))if(!['spec','sourceAtom','mathematicalModel'].includes(k))Array.isArray(v)?v.forEach(walk):typeof v==='object'&&walk(v);}
walk(p);
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1250,height:1100},deviceScaleFactor:2});
await page.goto('http://127.0.0.1:5173/libs/tikzjax/fonts.css');
await page.setContent('<link rel="stylesheet" href="/libs/tikzjax/fonts.css"><style>body{font:14px Arial;margin:24px}article{display:flex;gap:25px;margin-bottom:35px}figure{margin:0}figcaption{margin-bottom:12px}.graph svg{width:100%;height:auto}h1{font-size:20px}</style><h1>Graph typography — final booklet widths</h1><div id="sheet"></div>');
const compile=await loadTikzEngine(),results=[];
try{for(const n of selected){
 await page.evaluate(id=>document.querySelector('#sheet').insertAdjacentHTML('beforeend','<h2>'+id+'</h2><article></article>'),n.id);
 for(const target of [null,8,8.5,9]){
  const m=styleGraph(n.mathematicalModel,n.widthMm);delete m.nodeScale;if(n.id==='page-90-identify-b-diagram')m.labels[0].x=-6.6;
  let svg,measure;
  for(let i=0;i<(target?6:1);i++){
   svg=(await compile(target?graphTikz(m):n.code)).svg;
   const prefix=n.id+'-'+(target??'before')+'-';svg=svg.replace(/id="([^"]+)"/g,(_,id)=>'id="'+prefix+id+'"').replace(/url\(#/g,'url(#'+prefix).replace(/href="#/g,'href="#'+prefix);
   await page.evaluate(({svg,width,title})=>{let f=document.querySelector('#measure');if(!f){f=document.createElement('figure');f.id='measure';document.querySelector('article:last-child').append(f);}f.innerHTML='<figcaption>'+title+'</figcaption><div class="graph" style="width:'+width+'mm">'+svg+'</div>';},{svg,width:n.widthMm,title:target===null?'Before':target+' pt ticks / 10 pt labels'});await page.evaluate(()=>document.fonts.ready);
   measure=await page.evaluate(()=>{const a=[...document.querySelectorAll('#measure text')].map(t=>{const m=t.getScreenCTM();return{tick:!!t.closest('[data-graph-text="tick"]'),pt:parseFloat(getComputedStyle(t).fontSize)*Math.hypot(m.c,m.d)*72/96};});return{tick:Math.max(0,...a.filter(t=>t.tick).map(t=>t.pt)),label:Math.max(0,...a.filter(t=>!t.tick).map(t=>t.pt))};});
   if(!target||Math.abs(measure.tick-target)<.06&&Math.abs(measure.label-10)<.06)break;
   if(measure.tick)m.tickFontPt*=target/measure.tick;if(measure.label)m.labelFontPt*=10/measure.label;
  }
  results.push({id:n.id,target,...measure});await page.evaluate(()=>document.querySelector('#measure').removeAttribute('id'));
 }
}
await page.screenshot({path:out+'/size-comparison.png',fullPage:true});fs.writeFileSync(out+'/size-comparison.json',JSON.stringify(results,null,2));console.log(results);
}finally{await browser.close();}
