// Deterministic label placement for TikZ diagrams (import v2 simplification plan, item 1,
// 13 November 2026). Replaces the model label retry: Cambridge X11 Ch 5 spent about 150 of
// 380 minutes on graph labels (three sample re-authorings, 18 retry calls, 26 hand patches).
//
// For each diagram: render it on Studio's #/tikz-check page with a marker on every node, run
// Studio's own label check (inspectDiagramLabelLayout, the same code as figure-label-check),
// and measure every label box and the sampled strokes. Labels a stroke runs through, touches
// or that overlap another label are moved: one more render puts them at anchor=center (their
// anchor point and size), candidate positions around that point are scored against the
// strokes and the other labels, and the choice is written back as explicit node options
// (tikz-label-placement.mjs). The result is rendered again; a round's measured error corrects
// the next. A diagram's new code is kept only when Studio's check finds fewer collisions and
// every label's printed text and every stroke are unchanged. Nothing else in the code changes.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import {BOOKLET_HOUSE_STYLE} from '../../public/libs/maths-editor/house-style.mjs';
import {instrumentCode,scanNodes,labelProblems,choosePlacements,applyPlacements,identifyLabels} from './tikz-label-placement.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
// Studio serves public/ from its own checkout; a worktree sets MATHSMAP_STUDIO_ROOT to it.
export const studioRoot=()=>process.env.MATHSMAP_STUDIO_ROOT?path.resolve(process.env.MATHSMAP_STUDIO_ROOT):ROOT;

// Runs in the page: Studio's check plus label boxes, stroke samples and texts per card.
const MEASURE=async()=>{
 const {inspectDiagramLabelLayout}=await import('/src/lib/diagram-typography.js');
 const list=window.__tikzItems||[],cards=[...document.querySelectorAll('.grid .card')],out=[];
 cards.forEach((card,i)=>{
  const field=list[i]?.field,svg=card.querySelector('svg');
  if(!field)return;
  if(!svg){out.push({field,error:'no svg'});return;}
  for(const p of svg.querySelectorAll('path,line,polyline'))if(getComputedStyle(p).stroke==='rgb(204, 204, 204)')p.style.stroke='none';
  let issues=[];
  try{issues=inspectDiagramLabelLayout(svg,{strokes:true});}catch(e){issues=[{kind:'check-error',message:e.message}];}
  const toUser=svg.getScreenCTM().inverse(),user=(x,y)=>new DOMPoint(x,y).matrixTransform(toUser);
  const scale=Math.hypot(svg.getScreenCTM().a,svg.getScreenCTM().b),tol=.5/scale;
  const context=document.createElement('canvas').getContext('2d');
  const groups=[...svg.querySelectorAll('g[data-diagram-label="1"]')].filter(g=>g.querySelector('text'));
  const labels=groups.map(g=>{
   let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
   for(const node of g.querySelectorAll('text,path,rect')){
    let box;
    if(node.tagName==='text'){const css=getComputedStyle(node);context.font=css.fontSize+' '+css.fontFamily;const ink=context.measureText(node.textContent),x=node.x.baseVal[0]?.value??0,y=node.y.baseVal[0]?.value??0;box={x:x-ink.actualBoundingBoxLeft,y:y-ink.actualBoundingBoxAscent,width:ink.actualBoundingBoxLeft+ink.actualBoundingBoxRight,height:ink.actualBoundingBoxAscent+ink.actualBoundingBoxDescent};}
    else box=node.getBBox();
    const m=node.getScreenCTM();if(!m)continue;
    for(const [x,y] of [[box.x,box.y],[box.x+box.width,box.y],[box.x+box.width,box.y+box.height],[box.x,box.y+box.height]]){const s=new DOMPoint(x,y).matrixTransform(m),u=user(s.x,s.y);x0=Math.min(x0,u.x);y0=Math.min(y0,u.y);x1=Math.max(x1,u.x);y1=Math.max(y1,u.y);}
   }
   return {src:g.dataset.mmSrc??'-1',anchor:g.dataset.labelAnchor??'center',font:Number(g.dataset.labelFont)||10,text:(g.textContent||'').replace(/\s+/g,''),box:[x0,y0,x1,y1]};
  });
  const points=[];let paths=0;
  for(const p of svg.querySelectorAll('path')){
   if(p.closest('[data-diagram-label],defs,clipPath,marker')||getComputedStyle(p).stroke==='none')continue;
   const m=p.getScreenCTM();if(!m)continue;const length=p.getTotalLength();if(!Number.isFinite(length)||length<=0)continue;
   paths++;
   const step=.4/Math.hypot(m.a,m.b),masks=[...svg.querySelectorAll('path,rect')].filter(mask=>mask!==p&&(p.compareDocumentPosition(mask)&Node.DOCUMENT_POSITION_FOLLOWING)&&['rgb(255, 255, 255)','#fff','white'].includes(getComputedStyle(mask).fill));
   for(let d=0;d<=length;d+=step){const s=p.getPointAtLength(d).matrixTransform(m);if(masks.some(mask=>mask.isPointInFill(s.matrixTransform(mask.getScreenCTM().inverse()))))continue;const u=user(s.x,s.y);points.push(Math.round(u.x*100)/100,Math.round(u.y*100)/100);}
  }
  const vb=svg.viewBox?.baseVal,viewBox=vb&&vb.width?[vb.x,vb.y,vb.width,vb.height]:[0,0,svg.getBBox().width,svg.getBBox().height];
  const official=issues.filter(x=>['diagram-label-overlap','diagram-label-stroke'].includes(x.kind)).length;
  out.push({field,official,labels,points,paths,viewBox,tol});
 });
 return out;
};

// One browser for the whole placement; each round writes its items and opens the check page.
export async function renderer({base='http://localhost:5173',timeoutMs=600000}={}){
 let browser;
 try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});}
 const page=await browser.newPage({viewport:{width:1400,height:2000}});
 const render=async items=>{
  if(!items.length)return new Map();
  const name='label-place-'+crypto.randomBytes(6).toString('hex')+'.json',file=path.join(studioRoot(),'public','.audit-input',name);
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,JSON.stringify(items.map(item=>({skillId:'label-placement',source:'label-placement',field:item.field,code:item.code}))));
  try{
   // A hash change alone keeps the previous run's done flag and cards: load the page afresh.
   await page.goto('about:blank');
   await page.goto(`${base}/#/tikz-check?input=${encodeURIComponent('/.audit-input/'+name)}&offset=0&limit=${items.length}&r=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForFunction(()=>window.__tikzCheckDone===true||window.__tikzCheckError,null,{timeout:timeoutMs,polling:500});
   await page.evaluate(()=>document.fonts.ready);
   return new Map((await page.evaluate(MEASURE)).map(row=>[row.field,row]));
  }finally{fs.rmSync(file,{force:true});}
 };
 return {render,close:()=>browser.close()};
}

const sorted=texts=>[...texts].sort().join('\u0001');
const innerSepOf=(code,label)=>{
 const m=/inner sep\s*=\s*(-?[\d.]+)\s*(pt|mm|cm|em)?/.exec(code);
 if(!m)return .3333*(label.font||10);
 const v=Number(m[1]);return m[2]==='mm'?v*2.845:m[2]==='cm'?v*28.45:m[2]==='em'?v*(label.font||10):v;
};

// rows: [{id, code}]. Returns {results:[{id, before, after, code, changed, moved, skipped}], seconds, renders}.
export async function placeDiagramLabels(rows,{base,rounds=3,touch=.5,log=()=>{},render:renderOverride}={}){
 const started=Date.now(),tickPt=BOOKLET_HOUSE_STYLE.graphs.tickPt;
 const session=renderOverride?{render:renderOverride,close:async()=>{}}:await renderer({base});
 let renders=0;
 const run=async items=>{renders++;return session.render(items);};
 try{
  // Node indices always refer to the authored code: placements are applied to it (or to its
  // instrumented copy, which has the same nodes), never to an earlier placement.
  const state=rows.map(row=>({id:row.id,original:row.code,code:row.code,nodes:scanNodes(row.code)}));
  const field=(s,tag)=>s.id+'@'+tag;
  // dvisvgm's origin follows the picture's bounding box, which moves with the labels; the
  // strokes never move, so every render is put in the frame of the strokes' own extent.
  const frame=m=>{let x=Infinity,y=Infinity;for(let i=0;i<m.points.length;i+=2){x=Math.min(x,m.points[i]);y=Math.min(y,m.points[i+1]);}return Number.isFinite(x)?[x,y]:[0,0];};
  const measure=(s,m)=>{
   if(!m||m.error)return m;
   const [ox,oy]=frame(m),shift=box=>[box[0]-ox,box[1]-oy,box[2]-ox,box[3]-oy];
   return {...m,points:m.points.map((v,i)=>v-(i%2?oy:ox)),viewBox:[m.viewBox[0]-ox,m.viewBox[1]-oy,m.viewBox[2],m.viewBox[3]],labels:identifyLabels(m.labels,s.nodes).map(l=>({...l,box:shift(l.box)}))};
  };
  const touches=m=>labelProblems(m,{touch}).reduce((n,p)=>n+p.touches,0);
  // Round 0: measure the authored code.
  const first=await run(state.map(s=>({field:field(s,'m0'),code:instrumentCode(s.original,{tickPt})})));
  for(const s of state){
   s.base=measure(s,first.get(field(s,'m0')));
   if(!s.base||s.base.error){s.done=true;s.result={id:s.id,error:s.base?.error??'not rendered',changed:false,code:s.original};continue;}
   s.before=s.base.official;s.beforeTouches=touches(s.base);s.texts=sorted(s.base.labels.map(l=>l.text));s.paths=s.base.paths;
   s.current=s.base;s.corrections={};s.placements=new Map();
   if(!labelProblems(s.base,{touch}).some(p=>p.problem)){s.done=true;s.result={id:s.id,before:s.before,after:s.before,changed:false,code:s.original};}
  }
  for(let round=1;round<=rounds;round++){
   const active=state.filter(s=>!s.done);if(!active.length)break;
   // Centre every node that has a label to move, to measure its anchor point and size.
   for(const s of active){
    s.problems=labelProblems(s.current,{touch}).filter(p=>p.problem&&s.current.labels[p.index].src>=0&&!s.nodes[s.current.labels[p.index].src]?.unsupported);
    s.centreNodes=[...new Set(s.problems.map(p=>s.current.labels[p.index].src))];
   }
   const centred=await run(active.filter(s=>s.centreNodes.length).map(s=>({field:field(s,'c'+round),code:instrumentCode(s.original,{tickPt,center:s.centreNodes})})));
   for(const s of active){
    const centre=measure(s,centred.get(field(s,'c'+round)));
    if(!s.centreNodes.length||!centre||centre.error){s.done=true;continue;}
    for(const label of s.current.labels)label.innerSep=innerSepOf(s.original,label);
    const chosen=choosePlacements({current:s.current,centred:centre,moving:s.problems,corrections:s.corrections});
    s.predicted=new Map();
    for(const pick of chosen.values()){s.placements.set(pick.src+':'+pick.instance,pick.placement);s.predicted.set(pick.src+':'+pick.instance,pick.box);}
    if(!chosen.size){s.done=true;continue;}
    const applied=applyPlacements(s.original,s.placements);
    s.code=applied.code;s.skipped=applied.skipped;
    s.measureCode=applyPlacements(instrumentCode(s.original,{tickPt}),s.placements).code;
   }
   const measured=await run(active.filter(s=>!s.done).map(s=>({field:field(s,'r'+round),code:s.measureCode})));
   for(const s of active.filter(s=>!s.done)){
    const m=measure(s,measured.get(field(s,'r'+round)));
    if(!m||m.error){s.done=true;s.code=s.original;continue;}
    // Learn each moved label's prediction error for the next round.
    for(const label of m.labels){const id=label.src+':'+label.instance,predicted=s.predicted.get(id);if(predicted){const prior=s.corrections[id]??[0,0];s.corrections[id]=[prior[0]+label.box[0]-predicted[0],prior[1]+label.box[1]-predicted[1]];}}
    s.current=m;
    if(m.official===0&&!labelProblems(m,{touch}).some(p=>p.problem))s.done=true;
   }
  }
  // Final: the placed code without markers, through Studio's own check. Keep it only when it is better and nothing printed changed.
  const changed=state.filter(s=>!s.result&&s.code!==s.original);
  const final=await run(changed.map(s=>({field:field(s,'final'),code:s.code})));
  const results=[];
  for(const s of state){
   if(s.result){results.push(s.result);continue;}
   const m=final.get(field(s,'final'));
   const better=m&&!m.error&&(m.official<s.before||m.official===s.before&&touches(m)<s.beforeTouches);
   const ok=better&&sorted(m.labels.map(l=>l.text))===s.texts&&m.paths===s.paths;
   const reason=!m||m.error?'did not render':!better?'not fewer collisions':sorted(m.labels.map(l=>l.text))!==s.texts?'label text changed':m.paths!==s.paths?'strokes changed':null;
   results.push({id:s.id,before:s.before,after:ok?m.official:s.before,changed:!!ok,code:ok?s.code:s.original,moved:ok?[...s.placements.keys()]:[],skipped:s.skipped??[],...(ok?{}:{reverted:reason??'no placement found'})});
  }
  const seconds=Math.round((Date.now()-started)/1000);
  log('Label placement: '+results.filter(r=>r.changed).length+' of '+results.length+' diagrams changed; collisions '+results.reduce((n,r)=>n+(r.before??0),0)+' -> '+results.reduce((n,r)=>n+(r.after??0),0)+' in '+seconds+' s ('+renders+' renders)');
  return {results,seconds,renders};
 }finally{await session.close();}
}

if(process.argv[1]&&import.meta.url===new URL('file:///'+path.resolve(process.argv[1]).replaceAll('\\','/')).href){
 // node scripts/booklet/diagram-label-placer.mjs --input rows.json --out result.json
 const arg=name=>{const i=process.argv.indexOf(name);return i>0?process.argv[i+1]:null;};
 const rows=JSON.parse(fs.readFileSync(arg('--input'),'utf8'));
 const result=await placeDiagramLabels(rows,{log:console.log});
 fs.writeFileSync(arg('--out'),JSON.stringify(result,null,1));
}
