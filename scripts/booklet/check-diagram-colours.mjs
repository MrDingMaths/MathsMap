// Compile current/candidate figures with the real engine, inspect every geometry
// palette, and seed an isolated browser cache for the five-edition PDF review.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {loadTikzEngine} from './check-pgfplots-engine.mjs';
import {prepareTikz} from '../../src/lib/tikz-prepare.js';
import {diagramColourPolicy} from '../../src/lib/diagram-colours.js';
import {visitActiveDiagrams,migrateDiagramColours} from './normalise-diagram-colours.mjs';

const out=path.resolve(process.env.BOOKLET_DIAGRAM_REVIEW_OUT??'.booklet-work/diagram-colours'),base='http://127.0.0.1:5173';
fs.mkdirSync(out+'/svg',{recursive:true});fs.mkdirSync(out+'/candidates',{recursive:true});
const drawings=new Map(),rows=[];
for(const file of fs.readdirSync('booklets/projects').filter(f=>f.endsWith('.json')&&(!process.env.BOOKLET_REVIEW_PROJECT||f===process.env.BOOKLET_REVIEW_PROJECT+'.json'))){
  const original=JSON.parse(fs.readFileSync('booklets/projects/'+file)),{next}=migrateDiagramColours(original);
  fs.writeFileSync(out+'/candidates/'+file,JSON.stringify(next,null,2));
  visitActiveDiagrams(original,n=>{if(n.format==='tikz')drawings.set(prepareTikz(n.code).key,n.code);});
  for(const styles of Object.values(next.settings?.compactAnswers?.diagramStyles??{}))for(const style of Object.values(styles))if(style.code)drawings.set(prepareTikz(style.code).key,style.code);
  visitActiveDiagrams(next,n=>{if(n.format==='tikz'){const key=prepareTikz(n.code).key;drawings.set(key,n.code);rows.push({project:next.id,id:n.id,key,widthMm:n.widthMm??78,policy:diagramColourPolicy(n.code)});}});
}
const compile=await loadTikzEngine(),cache=[];
let index=0;
for(const[key,code]of drawings){
  const file=out+'/svg/'+key+'.svg';
  if(!fs.existsSync(file))fs.writeFileSync(file,(await compile(code)).svg);
  const prefix='colour-'+key+'-',svg=fs.readFileSync(file,'utf8').replace(/\bid="([^"]+)"/g,(_,id)=>`id="${prefix}${id}"`).replace(/url\(#/g,'url(#'+prefix).replace(/href="#/g,'href="#'+prefix);
  cache.push({key,svg,ts:Date.now()});if(++index%50===0)console.log('Compiled/cache verified',index,'/',drawings.size);
}
const browser=await chromium.launch({channel:'chrome',headless:true}),context=await browser.newContext({viewport:{width:1600,height:1400}}),page=await context.newPage();
try{
 await page.goto(base+'/libs/tikzjax/fonts.css');
 await page.evaluate(cache=>new Promise((resolve,reject)=>{const request=indexedDB.open('mathsmap-tikz',1);request.onupgradeneeded=()=>{const store=request.result.createObjectStore('svg-v1',{keyPath:'key'});store.createIndex('ts','ts');};request.onerror=()=>reject(request.error);request.onsuccess=()=>{const tx=request.result.transaction('svg-v1','readwrite');for(const row of cache)tx.objectStore('svg-v1').put(row);tx.oncomplete=()=>{request.result.close();resolve();};tx.onerror=()=>reject(tx.error);};}),cache);
 await context.storageState({path:out+'/browser-state.json',indexedDB:true});
 await page.setContent('<link rel="stylesheet" href="/libs/tikzjax/fonts.css"><style>body{margin:0;background:#eee}#cards{display:grid;grid-template-columns:repeat(4,400px)}.card{height:350px;background:white;border:1px solid #ddd;box-sizing:border-box;padding:12px;font:12px Arial}.drawing{max-width:374px;margin:auto}.drawing svg{width:100%;height:auto;max-height:305px}</style><div id="cards"></div>');
 const geometry=[...new Map(rows.filter(r=>r.policy?.kind==='geometry').map(r=>[r.key,r])).values()],measurements=[];
 for(let start=0;start<geometry.length;start+=16){
   const cards=geometry.slice(start,start+16).map(r=>({...r,svg:cache.find(c=>c.key===r.key).svg}));
   const checks=await page.evaluate(async cards=>{
     const {inspectDiagramColours}=await import('/src/lib/diagram-colours.js');
     const {calibrateGraphStrokes}=await import('/src/lib/graph-strokes.js');
     const {measureDiagramLabels,inspectDiagramLabelLayout}=await import('/src/lib/diagram-typography.js');
     const host=document.querySelector('#cards');host.replaceChildren();
     for(const c of cards){const card=document.createElement('div');card.className='card';const label=document.createElement('p');label.textContent=c.id;const drawing=document.createElement('div');drawing.className='drawing';drawing.style.width=c.widthMm+'mm';drawing.innerHTML=c.svg;card.append(label,drawing);host.append(card);}
     await document.fonts.ready;calibrateGraphStrokes(host);
     return [...host.querySelectorAll('.drawing')].map((host,i)=>({id:cards[i].id,key:cards[i].key,colours:inspectDiagramColours(host.querySelector('svg')),labels:measureDiagramLabels(host.querySelector('svg')),labelLayout:inspectDiagramLabelLayout(host.querySelector('svg')),bounds:{width:host.querySelector('svg').getBoundingClientRect().width,height:host.querySelector('svg').getBoundingClientRect().height}}));
   },cards);
   measurements.push(...checks);await page.screenshot({path:out+'/geometry-'+String(start/16).padStart(2,'0')+'.png'});
 }
 fs.writeFileSync(out+'/geometry-qa.json',JSON.stringify(measurements,null,2));
 fs.writeFileSync(out+'/inventory.json',JSON.stringify(rows,null,2));
 const bad=measurements.filter(r=>r.colours.length);assert.equal(bad.length,0,'Unexpected geometry colours: '+JSON.stringify(bad));
 console.log(JSON.stringify({cached:cache.length,geometry:geometry.length,occurrences:rows.length,unexpectedColours:bad.length}));
}finally{await browser.close();}
