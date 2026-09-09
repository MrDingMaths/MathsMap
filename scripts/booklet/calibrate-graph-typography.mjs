// Explicit migration: compiled SVG measurements, separate text roles, revision-safe save.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {graphTikz,styleGraph} from '../../src/lib/graph-model.js';
import {loadTikzEngine} from './check-pgfplots-engine.mjs';
import {saveBookletProject} from './project-studio-server.mjs';

const out='output/graph-typography';fs.mkdirSync(out+'/svg',{recursive:true});
const refining=process.argv.includes('--refine');
const source=refining?out+'/candidate.json':'booklets/projects/linear-relationships-v1.json';
const review=refining?JSON.parse(fs.readFileSync(out+'/text-review.json')):[];
const auditFixes=process.argv.includes('--audit-fixes');
const audit=auditFixes?JSON.parse(fs.readFileSync('output/house-style-v2/typography-final.json')):[];
const auditIds=new Set(audit.flatMap(r=>r.issues.map(i=>i.diagramId).filter(Boolean)));
const onlyIds=process.argv.find(a=>a.startsWith('--ids='))?.slice(6).split(',');
const originFixes=process.argv.includes('--origin-fixes');
const shortenTicks=process.argv.includes('--shorten-ticks');
const tickClearance=process.argv.includes('--tick-clearance');
const project=JSON.parse(fs.readFileSync(source)),original=structuredClone(project),records=[];
function walk(n,page){if(!n||typeof n!=='object')return;page=n.sourcePageNumber??page;if(n.format==='tikz'&&n.code)records.push({n,page});for(const[k,v]of Object.entries(n))if(!['spec','sourceAtom','mathematicalModel','originalDiagram'].includes(k))if(Array.isArray(v))v.forEach(x=>walk(x,page));else if(v&&typeof v==='object')walk(v,page);}
walk(project);
if(originFixes)project.settings.layoutOverrides.answerSpaces['page-79-q8-e']=23;
if(auditFixes){
 const layouts=project.settings.layoutOverrides.blockLayouts;
 for(const letter of ['a','b','c','d'])layouts['page-8-q6-'+letter]={...layouts['page-8-q6-'+letter],textWidthMm:24,gapMm:2};
 layouts['page-7-q4-solution']={...layouts['page-7-q4-solution'],diagramWidthMm:72};
 const resize=n=>{if(n.ref==='page-92-q3-diagram-1')n.width=95;n.children?.forEach(resize);};resize(layouts['page-92-q3'].arrangement.root);
}
const tickStart=String.raw`\special{dvisvgm:raw <g data-graph-text="tick">}`,tickEnd=String.raw`\special{dvisvgm:raw </g>}`;
export function prepareManualTypography(code){
 if(code.startsWith(String.raw`\def\mmTickFont`))return code.slice(code.indexOf('\n')+1);
 code=code.replace(/\n% mathsmap-label-scale=[^\n]+\n\\tikzset\{every node\/\.append style=\{scale=[^}]+\}\}/g,'');
 code=code.replace(/\\fontsize\{[^}]+\}\{[^}]+\}\\selectfont|\\(?:large|Large|small|normalsize|footnotesize|scriptsize|tiny)\b/g,String.raw`\mmLabelFont`);
 code=code.replace(/(tick label style=\{font=)\\mmLabelFont/g,'$1'+String.raw`\mmTickFont,scale=\mmTickRatio`);
 code=code.replace(/\\ifdim\\tick pt=0pt\\else\\pgfmathprintnumber\{\\tick\}\\fi/g,m=>tickStart+m+tickEnd);
 // Pure numeric loop labels are axis scales; coordinate/point labels stay at label size.
 code=code.replace(/\{(?:\\mmLabelFont\s*)?\$(-?\d+(?:\.\d+)?|\\[ntxy])\$\}/g,(_,body)=>'{'+String.raw`\scalebox{\mmTickRatio}{`+tickStart+'$'+body+'$'+tickEnd+'}}');
 return code.replace(/(\\begin\{tikzpicture\}(?:\[[^\n]*\])?)/,'$1\n'+String.raw`\tikzset{every node/.append style={font=\mmLabelFont,scale=\mmLabelScale}}`);
}
const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1200,height:1000},deviceScaleFactor:2});
await page.goto('http://127.0.0.1:5173/libs/tikzjax/fonts.css');
await page.setContent('<link rel="stylesheet" href="/libs/tikzjax/fonts.css"><style>body{margin:20px}#graph svg{width:100%;height:auto;display:block}</style><div id="graph"></div>');
const compile=await loadTikzEngine();
async function render(code,width){
 const key=createHash('sha256').update(code).digest('hex'),file=out+'/svg/'+key+'.svg';let svg;
 if(fs.existsSync(file))svg=fs.readFileSync(file,'utf8');else{svg=(await compile(code)).svg;fs.writeFileSync(file,svg);}
 await page.evaluate(({svg,width})=>{const host=document.querySelector('#graph');host.style.width=width+'mm';host.innerHTML=svg;},{svg,width});await page.evaluate(()=>document.fonts.ready);
 const sizes=await page.evaluate(()=>{const texts=[...document.querySelectorAll('#graph text')].map(t=>{const m=t.getScreenCTM();return{tick:!!t.closest('[data-graph-text="tick"]'),pt:parseFloat(getComputedStyle(t).fontSize)*Math.hypot(m.c,m.d)*72/96};});return{tick:Math.max(0,...texts.filter(t=>t.tick).map(t=>t.pt)),label:Math.max(0,...texts.filter(t=>!t.tick).map(t=>t.pt))};});
 return {svg,file,...sizes};
}
function scaleModel(m,tickFactor,labelFactor){m.tickFontPt*=tickFactor;m.labelFontPt*=labelFactor;if(m.panels)m.panels.forEach(p=>scaleModel(p,tickFactor,labelFactor));}
const reports=refining?JSON.parse(fs.readFileSync(out+'/measurements.json')):[];
try{
 for(const {n,page:sourcePage}of records){
  if(shortenTicks&&!n.mathematicalModel?.xTickLabelShiftPt&&!n.code.includes('xticklabel style={yshift='))continue;
  if(tickClearance&&!(n.mathematicalModel?.xTickLabelShiftPt>=6)&&!n.code.includes('xticklabel style={yshift=6pt}'))continue;
  if(onlyIds&&!onlyIds.includes(n.id))continue;
  if(auditFixes&&!auditIds.has(n.id))continue;
  const labelRepair=/^page-8-q6-[abc]-editable-graph$/.test(n.id)||['page-78-q8-b-diagram-1','page-79-q8-c-diag','page-79-q8-f-diag','page-87-diag-q3'].includes(n.id);
  if(process.argv.includes('--finish-only')&&!labelRepair&&n.mathematicalModel?.ticks!==false&&n.mathematicalModel?.tickLabels!==false&&n.id!=='page-92-q3-diagram-1')continue;
  const collision=review.find(r=>r.id===n.id)?.tickCollisions??0;
  if(originFixes&&!collision&&!n.id.startsWith('page-76-q'))continue;
  if(refining&&!shortenTicks&&!onlyIds&&!auditFixes&&!labelRepair&&!collision&&sourcePage!==74&&n.mathematicalModel?.ticks!==false&&n.mathematicalModel?.tickLabels!==false&&n.widthMm!=null&&!(n.role==='solution'&&n.widthMm>60))continue;
  const target=collision||auditFixes&&audit.some(r=>r.issues.some(i=>i.diagramId===n.id&&i.kind==='graph-tick-overlap'))?8:(n.mathematicalModel?.tickTargetPt??8.5);
  if(refining&&!shortenTicks&&!auditFixes&&!onlyIds&&!originFixes){
   n.widthMm??=65;
   if(n.role==='solution'&&n.widthMm>60)n.widthMm=60;
   if(collision>1){
    const span=n.mathematicalModel?n.mathematicalModel.bounds.xmax-n.mathematicalModel.bounds.xmin:10;
    n.widthMm=Math.max(n.widthMm,span>10?60:50);
    if(n.id.startsWith('page-6-q3'))n.widthMm=75;
    if(n.id==='page-92-q3-diagram-1')n.widthMm=95;
   }
  }
  if(originFixes&&n.id.startsWith('page-76-q'))n.widthMm=47;
  if(auditFixes){
   if(n.id==='page-7-q4-solution')n.widthMm=72;
   if(n.id.startsWith('page-85-diag-gp-'))n.widthMm=50;
   if(n.id.startsWith('page-85-diag-ex-'))n.widthMm=70;
   if(n.id.startsWith('page-86-diag-1'))n.widthMm=49;
   if(n.mathematicalModel)n.mathematicalModel.xTickLabelShiftPt=2;
  }
  let m=n.mathematicalModel,manual,tick=target,label=10;const before=n.code;
  if(m){m=shortenTicks||originFixes&&!n.id.startsWith('page-76-q')?structuredClone(m):styleGraph(m,n.widthMm??65);if(tickClearance)m.xTickLabelShiftPt=3.5;if(originFixes){m.xTickLabelShiftPt=6;m.tickFontPt*=target/(m.tickTargetPt??8.5);}m.tickTargetPt=target;const reset=x=>{delete x.nodeScale;x.panels?.forEach(reset);};reset(m);if(sourcePage===74){m.tickLabels=false;m.ticks=false;}if(n.id==='page-90-identify-b-diagram')m.labels[0].x=-6.6;
   if(['page-78-q8-b-diagram-1','page-79-q8-c-diag'].includes(n.id))m.labels.forEach((l,i)=>{l.x=m.bounds.xmin+(m.bounds.xmax-m.bounds.xmin)*i/(m.labels.length-1);l.options='anchor='+(['south west','south','south east'][i])+','+m.lines[i].colour;});
   if(n.id==='page-79-q8-f-diag'){m.labels[0].x=-5;m.labels[0].options='anchor=north west,blue';m.labels[1].x=5;m.labels[1].options='anchor=north east,red';}
   if(n.id==='page-87-diag-q3'){m.labels[0].x=-5.5;m.labels[0].y=3.8;}
}
  else {
   manual=prepareManualTypography(before);
   if(shortenTicks&&!manual.includes('major tick length=1.5pt'))manual=manual.replace('tick align=outside,','tick align=outside,major tick length=1.5pt,minor tick length=1pt,');
   if(tickClearance)manual=manual.replace('xticklabel style={yshift=6pt}','xticklabel style={yshift=3.5pt}');
   if(originFixes){
    if(manual.includes('\\begin{axis}'))manual=manual.replace(/xticklabel style=\{yshift=[^}]+\},/g,'').replace('\\begin{axis}[','\\begin{axis}[xticklabel style={yshift=6pt},');
    else manual=manual.replace(/node\[below,inner sep=2pt\]/g,'node[below,inner sep=.2pt]').replace(/node\[below,font=/g,'node[below,inner sep=.2pt,font=');
    if(n.id==='page-39-q2-b-diag')manual=manual.replace('ytick={-3,-3,','ytick={-3,');
   }
   if(auditFixes&&manual.includes('\\begin{axis}'))manual=manual.replace('\\begin{axis}[','\\begin{axis}[xticklabel style={yshift=2pt},');
   const positions=n.id==='page-8-q6-a-editable-graph'?{B:'above left',C:'below left'}:n.id==='page-8-q6-b-editable-graph'?{B:'above left',C:'below left',D:'below right'}:n.id==='page-8-q6-c-editable-graph'?{C:'below left',D:'below right'}:{};
   for(const [letter,position]of Object.entries(positions))manual=manual.replace(new RegExp('\\\\node\\[[^\\]]+\\]( at \\([^\\)]+\\) \\{\\$'+letter+'\\$\\};)','g'),String.raw`\node[${position},black,inner sep=2pt]`+'$1');
  }
  const code=()=>m?graphTikz(m):String.raw`\def\mmTickFont{\fontsize{10}{12}\selectfont}\def\mmLabelFont{\fontsize{10}{12}\selectfont}\def\mmLabelScale{${label/10}}\def\mmTickRatio{${tick/label}}`+'\n'+manual;
  let r;
  for(let iteration=0;iteration<5;iteration++){
   r=await render(code(),n.widthMm??65);
   if((!r.tick||Math.abs(r.tick-target)<.1)&&(!r.label||Math.abs(r.label-10)<.1))break;
   const tf=r.tick?target/r.tick:1,lf=r.label?10/r.label:1;
   if(m)scaleModel(m,tf,lf);else{tick*=tf;label*=lf;}
  }
  n.code=code();r=await render(n.code,n.widthMm??65);if(m)n.mathematicalModel=m;
  const row={id:n.id,page:sourcePage,widthMm:n.widthMm??65,tickTargetPt:target,tickPt:r.tick,labelPt:r.label,svg:r.file};const existing=reports.findIndex(r=>r.id===n.id);if(existing<0)reports.push(row);else reports[existing]=row;
  if([73,74,75,87,91].includes(sourcePage))await page.locator('#graph').screenshot({path:out+'/'+n.id+'-after.png'});
  console.log(JSON.stringify(row));
  fs.writeFileSync(out+'/candidate.json',JSON.stringify(project,null,2));fs.writeFileSync(out+'/measurements.json',JSON.stringify(reports,null,2));
 }
 if(!refining)fs.writeFileSync(out+'/before.json',JSON.stringify(original,null,2));
 if(process.argv.includes('--save')){const saved=await saveBookletProject(project,{expectedRevision:original.revision});console.log('Saved revision',saved.revision);}
}finally{await browser.close();}
