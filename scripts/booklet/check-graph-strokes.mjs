import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {loadTikzEngine} from './check-pgfplots-engine.mjs';
import {visitGraphs} from './migrate-graph-strokes.mjs';
import {prepareTikz} from '../../src/lib/tikz-prepare.js';

const baseIndex=process.argv.indexOf('--base');
const out='output/graph-strokes',base=baseIndex<0?'http://127.0.0.1:5173':process.argv[baseIndex+1];
fs.mkdirSync(out+'/svg',{recursive:true});
const compile=await loadTikzEngine();
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1600,height:1100},deviceScaleFactor:1});
const report=[],unique=new Map();
async function svgFor(code){
  const hash=createHash('sha256').update(code).digest('hex'),file=`${out}/svg/${hash}.svg`;
  if(!fs.existsSync(file))fs.writeFileSync(file,(await compile(code)).svg);
  return {file,svg:fs.readFileSync(file,'utf8')};
}
try{
  await page.goto(base+'/libs/tikzjax/fonts.css');
  await page.setContent('<link rel="stylesheet" href="/libs/tikzjax/fonts.css"><style>body{margin:0}#graph svg{width:100%;height:auto}</style><div id="graph"></div>');
  await page.evaluate(async()=>{window.strokeModule=await import('/src/lib/graph-strokes.js');});
  for(const name of fs.readdirSync('booklets/projects').filter(f=>f.endsWith('.json'))){
    const before=[];visitGraphs(JSON.parse(fs.readFileSync(`${out}/before-${name}`)),n=>before.push(n));
    const after=[];visitGraphs(JSON.parse(fs.readFileSync(`${out}/${name}`)),n=>after.push(n));
    for(let i=0;i<after.length;i++){
      const n=after[i],original=before[i];let row=unique.get(n.code);
      if(!row){
        const rendered=await svgFor(n.code),old=await svgFor(original.code);
        const measurements=[];
        for(const width of [...new Set([n.widthMm??65,40,90])]){
          const measured=await page.evaluate(({svg,width})=>{
            const host=document.querySelector('#graph');host.style.width=width+'mm';host.innerHTML=svg;
            window.strokeModule.calibrateGraphStrokes(host);
            // A second pass must be idempotent, including after cache rehydration.
            const first=[...host.querySelectorAll('[data-graph-stroke-pt]')].map(p=>p.style.strokeWidth);
            window.strokeModule.calibrateGraphStrokes(host);
            const paths=[...host.querySelectorAll('[data-graph-stroke-pt]')];
            const errors=paths.map((p,i)=>{const m=p.getScreenCTM();return {target:+p.dataset.graphStrokePt,actual:parseFloat(getComputedStyle(p).strokeWidth)*Math.sqrt(Math.abs(m.a*m.d-m.b*m.c))*72/96,stable:first[i]===p.style.strokeWidth};});
            const unknown=[...host.querySelectorAll('path,line,circle,polyline,polygon,rect')].filter(p=>!p.closest('defs,clipPath')&&getComputedStyle(p).stroke!=='none'&&!p.dataset.graphStrokePt).map(p=>({width:getComputedStyle(p).strokeWidth,path:p.outerHTML.slice(0,200)}));
            return {width,count:paths.length,maximumError:Math.max(0,...errors.map(e=>Math.abs(e.actual-e.target))),stable:errors.every(e=>e.stable),unknown};
          },{svg:rendered.svg,width});
          if(measured.maximumError>.05||!measured.stable||measured.unknown.length)throw Error(n.id+' stroke check failed: '+JSON.stringify(measured));
          measurements.push(measured);
        }
        row={id:n.id,widthMm:n.widthMm??65,svg:rendered.file,beforeSvg:old.file,measurements};unique.set(n.code,row);
      }
      report.push({project:name,...row,id:n.id});
      if(report.length%25===0)console.log('Checked',report.length,'records;',unique.size,'unique graphs');
      fs.writeFileSync(out+'/measurements.json',JSON.stringify(report,null,2));
    }
  }
  // All unique candidates, plus an isolated before/after comparison of thin and bold examples.
  const cards=[...unique.values()];
  const escaped=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  const isolate=(svg,id)=>svg.replace(/\bid="([^"]+)"/g,`id="${id}-$1"`).replace(/url\(#([^)]+)\)/g,`url(#${id}-$1)`).replace(/((?:xlink:)?href=")#([^"]+)/g,`$1#${id}-$2`);
  for(let start=0;start<cards.length;start+=24){
    const selected=cards.slice(start,start+24);
    await page.setViewportSize({width:1600,height:1400});
    await page.setContent('<link rel="stylesheet" href="/libs/tikzjax/fonts.css"><style>body{margin:12px;font:12px Arial}.sheet{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.card{border:1px solid #ddd;padding:8px;min-height:220px}.graph svg{width:100%;height:auto}h3{font-size:11px}</style><div class="sheet">'+selected.map((r,i)=>`<div class="card"><h3>${escaped(r.id)} (${r.widthMm} mm)</h3><div class="graph" style="width:${r.widthMm}mm;max-width:100%">${isolate(fs.readFileSync(r.svg,'utf8'),i)}</div></div>`).join('')+'</div>');
    await page.evaluate(async()=>{await document.fonts.ready;window.strokeModule.calibrateGraphStrokes(document.body);});
    await page.screenshot({path:`${out}/sheet-${String(start/24+1).padStart(2,'0')}.png`,fullPage:true});
  }
  const examples=cards.filter(r=>/page-(3-part-a|8-q6-a|35-q12-d|43-sol|45-sol-graph1|85-diag-gp|90-identify-b)/.test(r.id)).slice(0,8);
  await page.setContent('<link rel="stylesheet" href="/libs/tikzjax/fonts.css"><style>body{font:14px Arial;margin:20px}.row{display:flex;gap:40px;border-bottom:1px solid #ddd;padding:12px}.graph{width:65mm}.graph svg{width:100%;height:auto}</style>'+examples.map((r,i)=>`<h3>${escaped(r.id)}</h3><div class="row"><div>Before<div class="graph">${isolate(fs.readFileSync(r.beforeSvg,'utf8'),'b'+i)}</div></div><div>House style<div class="graph">${isolate(fs.readFileSync(r.svg,'utf8'),'a'+i)}</div></div></div>`).join(''));
  await page.evaluate(async()=>{await document.fonts.ready;window.strokeModule.calibrateGraphStrokes(document.body);});
  await page.screenshot({path:out+'/before-after.png',fullPage:true});
  // A dedicated, account-free browser cache lets PDF QA reuse these exact compiled
  // sources through the application's normal cache path, rather than recompiling.
  const cacheRows=[...unique].map(([code,row])=>{const key=prepareTikz(code).key;return {key,svg:isolate(fs.readFileSync(row.svg,'utf8'),'verified-'+key),ts:Date.now()};});
  await page.evaluate(rows=>new Promise((resolve,reject)=>{
    const request=indexedDB.open('mathsmap-tikz',1);
    request.onupgradeneeded=()=>{const store=request.result.createObjectStore('svg-v1',{keyPath:'key'});store.createIndex('ts','ts');};
    request.onerror=()=>reject(request.error);
    request.onsuccess=()=>{const db=request.result,tx=db.transaction('svg-v1','readwrite');for(const row of rows)tx.objectStore('svg-v1').put(row);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};
  }),cacheRows);
  await page.context().storageState({path:out+'/cache-state.json',indexedDB:true});
  console.log(JSON.stringify({records:report.length,unique:unique.size,maximumError:Math.max(...report.flatMap(r=>r.measurements.map(m=>m.maximumError)))}));
}finally{await browser.close();}
