import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {loadTikzEngine} from './check-pgfplots-engine.mjs';
const dir='output/graph-typography';
const ids=['page-85-diag-ex-2','page-90-identify-b-diagram','page-74-block-1-graph0'];
const find=p=>{const a=new Map();function walk(n){if(!n||typeof n!=='object')return;if(ids.includes(n.id))a.set(n.id,n);for(const[k,v]of Object.entries(n))if(!['spec','sourceAtom','mathematicalModel','originalDiagram'].includes(k))Array.isArray(v)?v.forEach(walk):typeof v==='object'&&walk(v);}walk(p);return a;};
const before=find(JSON.parse(fs.readFileSync(dir+'/before.json'))),after=find(JSON.parse(fs.readFileSync(dir+'/candidate.json'))),records=JSON.parse(fs.readFileSync(dir+'/measurements.json'));
const compile=await loadTikzEngine(),browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:850,height:1250},deviceScaleFactor:2});
try{
 await page.goto('http://localhost:5173/libs/tikzjax/fonts.css');let html='<link rel="stylesheet" href="/libs/tikzjax/fonts.css"><style>body{font:14px Arial;margin:24px}main{width:190mm}section{display:grid;grid-template-columns:1fr 1fr;gap:8mm;margin:8mm 0}figure{margin:0}figcaption{margin-bottom:4mm}.graph svg{width:100%;height:auto;display:block}h1{font-size:20px}h2{font-size:16px}</style><main><h1>Linear Relationships — before and after</h1>';
 for(const id of ids){html+='<h2>Source page '+id.split('-')[1]+'</h2><section>';for(const side of ['before','after']){
  const n=(side==='before'?before:after).get(id);if(!n)throw Error('Missing example '+id);
  let svg=side==='before'?(await compile(n.code)).svg:fs.readFileSync(records.find(r=>r.id===id).svg,'utf8');const prefix=id+'-'+side+'-';svg=svg.replace(/id="([^"]+)"/g,(_,x)=>'id="'+prefix+x+'"').replace(/url\(#/g,'url(#'+prefix).replace(/href="#/g,'href="#'+prefix);
  html+='<figure><figcaption>'+side[0].toUpperCase()+side.slice(1)+'</figcaption><div class="graph" style="width:'+n.widthMm+'mm">'+svg+'</div></figure>';
 }html+='</section>';}
 html+='</main>';fs.writeFileSync(dir+'/before-after.html',html);await page.setContent(html);await page.evaluate(()=>document.fonts.ready);await page.locator('main').screenshot({path:dir+'/before-after.png'});
}finally{await browser.close();}
