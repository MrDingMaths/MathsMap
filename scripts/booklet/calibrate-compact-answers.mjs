// Calibrate answer-only presentation copies from measured SVG text roles.
// Question/bank diagrams remain byte-for-byte unchanged.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {loadTikzEngine} from './check-pgfplots-engine.mjs';
import {graphTikz} from '../../src/lib/graph-model.js';
import {isPractice} from '../../src/lib/booklet-flow.js';
import {answerDiagramSignature} from '../../src/lib/booklet-exercises.js';
import {saveBookletProject} from './project-studio-server.mjs';
const file='booklets/projects/linear-relationships-compact-exercises-v1.json',out='.booklet-work/compact-exercises';
fs.mkdirSync(out+'/svg',{recursive:true});
const project=JSON.parse(fs.readFileSync(file)),diagrams=new Map(),styles=structuredClone(project.settings.compactAnswers.diagramStyles?.short??{});
const onlyIds=process.argv.find(a=>a.startsWith('--ids='))?.slice(6).split(',');
const walk=n=>{if(!n||typeof n!=='object')return;if(n.format==='tikz'&&n.code)diagrams.set(n.id,n);for(const[k,v]of Object.entries(n))if(!['spec','sourceAtom','mathematicalModel','originalDiagram','questionDiagrams'].includes(k))Array.isArray(v)?v.forEach(walk):walk(v);};
project.sections.flatMap(s=>s.blocks).filter(isPractice).forEach(b=>walk(b.content));
const compile=await loadTikzEngine(),browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage();
await page.goto('http://127.0.0.1:5173/libs/tikzjax/fonts.css');
await page.setContent('<link rel="stylesheet" href="/libs/tikzjax/fonts.css"><style>#graph svg{width:100%;height:auto;display:block}</style><div id="graph"></div>');
const report=[];
async function render(code,width){
 const key=createHash('sha256').update(code).digest('hex'),file=out+'/svg/'+key+'.svg';
 const svg=fs.existsSync(file)?fs.readFileSync(file,'utf8'):(await compile(code)).svg;
 if(!fs.existsSync(file))fs.writeFileSync(file,svg);
 await page.evaluate(({svg,width})=>{const el=document.querySelector('#graph');el.style.width=width+'mm';el.innerHTML=svg;},{svg,width});await page.evaluate(()=>document.fonts.ready);
 return page.evaluate(()=>{const texts=[...document.querySelectorAll('#graph text')].map(t=>({tick:!!t.closest('[data-graph-text="tick"]'),pt:parseFloat(getComputedStyle(t).fontSize)*Math.hypot(t.getScreenCTM().c,t.getScreenCTM().d)*72/96}));return{tick:Math.max(0,...texts.filter(t=>t.tick).map(t=>t.pt)),label:Math.max(0,...texts.filter(t=>!t.tick).map(t=>t.pt))};});
}
try{
 for(const d of diagrams.values()){
  if(onlyIds&&!onlyIds.includes(d.id))continue;
  const model=d.mathematicalModel?structuredClone(d.mathematicalModel):null;
  const originalWidth=project.settings.layoutOverrides.blockLayouts[d.id]?.diagramWidthMm??d.widthMm??60;
  const span=model&&model.tickLabels!==false&&model.ticks!==false?(model.bounds.xmax-model.bounds.xmin)/(model.xstep??1):0;
  const widthMm=Math.min(76,Math.max(Math.min(originalWidth,45),!model?originalWidth:originalWidth>60?originalWidth:span>14?76:span>8?60:45));
  let code=d.code;
  const manualRatio=Number(/\\def\\mmTickRatio\{([^}]+)\}/.exec(d.code)?.[1]);
  const tickTarget=model?.tickTargetPt??(manualRatio&&manualRatio<.825?8:8.5);
  let sizes;
  for(let iteration=0;iteration<6;iteration++){
   sizes=await render(code,widthMm);
   if((!sizes.tick||Math.abs(sizes.tick-tickTarget)<.07)&&(!sizes.label||Math.abs(sizes.label-10)<.07))break;
   const tf=sizes.tick?tickTarget/sizes.tick:1,lf=sizes.label?10/sizes.label:1;
   if(model){const scale=m=>{m.tickFontPt*=tf;m.labelFontPt*=lf;m.panels?.forEach(scale);};scale(model);code=graphTikz(model);}
   else{
    const lm=/\\def\\mmLabelScale\{([^}]+)\}/.exec(code),tm=/\\def\\mmTickRatio\{([^}]+)\}/.exec(code);
    if(!lm||!tm)throw Error('Manual graph lacks calibrated text roles: '+d.id);
    code=code.replace(lm[0],`\\def\\mmLabelScale{${Number(lm[1])*lf}}`).replace(tm[0],`\\def\\mmTickRatio{${Number(tm[1])*tf/lf}}`);
   }
  }
  styles[d.id]={widthMm,code,sourceSignature:answerDiagramSignature(d)};report.push({id:d.id,widthMm,...sizes});
  console.log(JSON.stringify(report.at(-1)));
 }
 project.settings.compactAnswers.diagramStyles={short:styles,worked:styles};
 fs.writeFileSync(out+'/diagram-calibration.json',JSON.stringify(report,null,2));
 if(process.argv.includes('--apply')){const saved=await saveBookletProject(project,{expectedRevision:project.revision});console.log('Saved answer presentation at revision '+saved.revision);}
 else fs.writeFileSync(out+'/calibrated-candidate.json',JSON.stringify(project,null,2));
}finally{await browser.close();}
