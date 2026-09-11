import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright-core';
import {loadTikzEngine} from './booklet/check-pgfplots-engine.mjs';
import {prepareTikz} from '../src/lib/tikz-prepare.js';
import {repairSolid} from './lib/solid-audit.mjs';
import {solidHash} from './audit-solid-visibility.mjs';
const arg=(k,d)=>{const i=process.argv.indexOf(k);return i<0?d:process.argv[i+1];};
const input=arg('--input','.booklet-work/solid-visibility/inventory.json'),out=arg('--out','.booklet-work/solid-visibility/review'),mode=arg('--mode','representatives');
fs.mkdirSync(out+'/svg',{recursive:true});
const rows=JSON.parse(fs.readFileSync(input)).rows;
let chosen;
if(mode==='representatives'){
 const wanted=['volume-of-prism.json|/practice/development/0/question_text','volume-of-prism.json|/practice/foundation/3/question_text','volume-composite-prisms.json|/practice/foundation/0/question_text','volume-pyramid-cone.json|/practice/foundation/3/question_text','trigonometry-3d.json|/practice/foundation/0/question_text'];
 chosen=wanted.map(k=>rows.find(r=>r.file.endsWith(k.split('|')[0])&&r.location===k.split('|')[1])).filter(Boolean).flatMap(r=>[{...r,label:'BEFORE '+r.file+' '+r.location},{...r,code:repairSolid(r.code,{moveLabels:true}).code,label:'AFTER '+r.file+' '+r.location}]);
}else chosen=rows.filter(r=>mode==='repairs'?r.status==='defect':mode==='images'?r.image:mode==='all'?r.candidate:r.status==='review');
chosen=[...new Map(chosen.map(r=>[r.code?solidHash(r.code):r.image,r])).values()];
if(arg('--offset',null))chosen=chosen.slice(+arg('--offset','0'));if(arg('--limit',null))chosen=chosen.slice(0,+arg('--limit','1'));
const compile=mode==='images'?null:await loadTikzEngine(),compiled=[];const startedAt=new Date().toISOString();
for(const [i,row]of chosen.entries()){
 if(!row.code){compiled.push({...row,label:row.image});continue;}
 const p=prepareTikz(row.code),cache=out+'/svg/'+p.key+'.svg';
 try{if(!fs.existsSync(cache)){
   const previous=['review','groups','candidates-review','final-review','delta-review','unchanged-review'].map(d=>'.booklet-work/solid-visibility/'+d+'/svg/'+p.key+'.svg').find(f=>fs.existsSync(f));
   fs.writeFileSync(cache,previous?fs.readFileSync(previous):(await compile(row.code)).svg);
 }compiled.push({...row,key:p.key,svg:fs.readFileSync(cache,'utf8'),label:row.label??row.file+' '+row.location});}
 catch(e){fs.writeFileSync(out+'/compile-error-'+i+'.txt',row.code+'\n'+e.stack);compiled.push({...row,error:String(e)});}
 if(i%20===0)console.log('Compiled',i+1,'/',chosen.length);
}
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1600,height:1440},deviceScaleFactor:1});
const qa=[];
try{
 await page.goto('http://127.0.0.1:5173/libs/tikzjax/fonts.css');
 await page.setContent('<link rel="stylesheet" href="/libs/tikzjax/fonts.css"><style>body{margin:0;background:#eee}#cards{display:grid;grid-template-columns:repeat(4,400px)}.card{height:360px;background:white;border:1px solid #ddd;box-sizing:border-box;padding:12px;font:12px Arial}.label{height:45px;overflow:hidden}.drawing{width:78mm;margin:auto}.drawing svg,.drawing img{width:100%;height:auto;max-height:275px}</style><div id="cards"></div>');
 for(let start=0;start<compiled.length;start+=16){
   const cards=compiled.slice(start,start+16);
   const checks=await page.evaluate(async cards=>{
     const {calibrateGraphStrokes}=await import('/src/lib/graph-strokes.js');
     const {measureDiagramLabels,inspectDiagramLabelLayout}=await import('/src/lib/diagram-typography.js');
     const host=document.querySelector('#cards');host.replaceChildren();
     for(const [i,c]of cards.entries()){
       const card=document.createElement('div');card.className='card';const label=document.createElement('div');label.className='label';label.textContent=c.index+' '+c.label;
       const drawing=document.createElement('div');drawing.className='drawing';
       if(c.svg){const prefix='s'+i+'-';drawing.innerHTML=c.svg.replace(/\bid="([^"]+)"/g,(_,id)=>`id="${prefix}${id}"`).replace(/url\(#/g,'url(#'+prefix).replace(/href="#/g,'href="#'+prefix);}
       else if(c.image){const img=document.createElement('img');img.src=c.image;drawing.append(img);}else drawing.textContent=c.error;
       card.append(label,drawing);host.append(card);
     }
     await Promise.all([...host.querySelectorAll('img')].map(i=>i.decode().catch(()=>{})));await document.fonts.ready;calibrateGraphStrokes(host);
     return [...host.querySelectorAll('.drawing')].map((h,i)=>({key:cards[i].key,index:cards[i].index,labels:h.querySelector('svg')?measureDiagramLabels(h.querySelector('svg')):[],layout:h.querySelector('svg')?inspectDiagramLabelLayout(h.querySelector('svg')):[]}));
   },cards.map((r,i)=>({...r,index:start+i})));
   qa.push(...checks);await page.screenshot({path:out+'/sheet-'+String(start/16).padStart(3,'0')+'.png'});
 }
 fs.writeFileSync(out+'/manifest.json',JSON.stringify({startedAt,finishedAt:new Date().toISOString(),rows:compiled.map(({svg,...r},index)=>({...r,index})),qa},null,2));
 console.log(JSON.stringify({diagrams:compiled.length,errors:compiled.filter(r=>r.error).length,sheets:Math.ceil(compiled.length/16)}));
}finally{await browser.close();}
