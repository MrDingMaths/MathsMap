import fs from 'node:fs';
import path from 'node:path';
import {graphModel,graphTikz} from '../../src/lib/graph-model.js';
import {saveBookletProject} from './project-studio-server.mjs';
import {prepareTikz} from '../../src/lib/tikz-prepare.js';
const file='booklets/projects/linear-relationships-complete-v1.json';
const project=JSON.parse(fs.readFileSync(file)),before=structuredClone(project);
const sources=JSON.parse(fs.readFileSync('scripts/booklet/graph-source-models.json'));
const diagrams=[],byId=new Map(),report=[];
function walk(x,page){if(!x||typeof x!=='object')return;if(x.format==='tikz'||x.format==='image'){diagrams.push({diagram:x,page});byId.set(x.id,x);}for(const[k,v]of Object.entries(x))if(!['spec','sourceAtom','originalDiagram','mathematicalModel'].includes(k))Array.isArray(v)?v.forEach(z=>walk(z,page)):typeof v==='object'&&walk(v,page);}
for(const s of project.sections)walk(s.blocks,s.sourcePageNumber);
const coord=String.raw`\(\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*\)`;
const gridRE=new RegExp(coord+String.raw`\s*grid\s*`+coord);
const drawRE=new RegExp(String.raw`\\draw\[([^\]]*)\]\s*`+coord+String.raw`\s*--\s*`+coord+String.raw`\s*;`,'g');
const fillRE=new RegExp(String.raw`\\fill(?:\[([^\]]*)\])?\s*`+coord+String.raw`\s*circle\s*\([^)]*\)`,'g');
const nodeRE=new RegExp(String.raw`\\node(?:\[([^\]]*)\])?\s*at\s*`+coord+String.raw`\s*\{\$([^$]*)\$\}\s*;`,'g');
const colour=style=>(style??'').split(',').map(s=>s.trim()).find(s=>/^(?:answerblue|graphblue|blue|red|green|orange|black|gray|sourcegray|violet|teal|magenta)(?:!\d+(?:![a-z]+)?)?$/.test(s))?.replace('graphblue','answerblue')??'answerblue';
function rational(value){for(let d=1;d<=100;d++){const n=Math.round(value*d);if(Math.abs(n/d-value)<1e-6)return n/d;}return value;}
const overrides={
 'page-16-example-graph':{m:2,c:1},'page-43-q1-graph-solution':{m:4,c:1},
 'page-44-q1-graph-solution':{m:3,c:1},'page-44-q2-graph-solution':{m:3,c:2},
 'page-61-q5-diag-sol':{m:2,c:2},'page-61-q6-diag-sol':{m:-1,c:7},
 'page-62-q7-diag-sol':{m:3,c:1},'page-62-q8-diag-sol':{m:4,c:0},
 'page-62-q9-diag-sol':{m:3,c:2},'page-63-q10-diag-sol':{m:-4,c:17}
};
function recover(d){
 const code=d.code??'';
 if(d.overlayOf&&!byId.has(d.overlayOf)&&byId.has(d.overlayOf.replace(/-diagram$/,'-blank')))d.overlayOf=d.overlayOf.replace(/-diagram$/,'-blank');
 const base=d.overlayOf?byId.get(d.overlayOf)?.mathematicalModel:null;
 const match=code.match(gridRE);
 const raw=d.mathematicalModel??(base?{bounds:base.bounds,xstep:base.xstep,ystep:base.ystep,widthCm:base.widthCm,heightCm:base.heightCm,lines:[],points:[]}:null);
 // Only recover equation graphs with mathematical coordinates, not matchsticks or geometry schematics.
 if(!raw&&!match)return null;
 if(!raw&&!overrides[d.id]&&!code.includes(' plot ')&&![...code.matchAll(drawRE)].some(m=>/thick|line width/.test(m[1])&&!/gray|thin/.test(m[1])))return null;
 if(!raw&&/\\coordinate\b/.test(code))return null;
 if(!raw&&(/pattern|matchstick|editable-pattern/.test(d.id)||d.id==='page-35-q12-d-source-line'))return null;
 const model=graphModel(raw??{bounds:{xmin:+match[1],ymin:+match[2],xmax:+match[3],ymax:+match[4]}});
 const storedPoints=[...code.matchAll(fillRE)].map(m=>({x:+m[2],y:+m[3],colour:colour(m[1])}));
 if(!raw?.points?.length)model.points=storedPoints;
 // Preserve coordinate lists used by the original exact plotting exercise.
 for(const m of code.matchAll(/\\foreach\s+\\x\/\\y\s+in\s+\{([^}]+)\}\s*\\fill\[([^\]]+)\]/g))for(const pair of m[1].split(',')){const xy=pair.trim().split('/').map(Number);if(xy.length===2&&xy.every(Number.isFinite)&&!model.points.some(p=>p.x===xy[0]&&p.y===xy[1]))model.points.push({x:xy[0],y:xy[1],colour:colour(m[2])});}
 const segments=[...code.matchAll(drawRE)].filter(m=>/thick|line width/.test(m[1])&&!/gray|thin/.test(m[1]));
 if(!raw?.lines?.length&&!Number.isFinite(raw?.m)){
  model.lines=segments.map(m=>{
   const [x1,y1,x2,y2]=m.slice(2).map(Number),sameX=Math.abs(x2-x1)<1e-9;
   const result={...(sameX?{x:x1}:{m:rational((y2-y1)/(x2-x1)),c:rational(y1-(y2-y1)/(x2-x1)*x1)}),colour:colour(m[1]),dashed:m[1].includes('dashed')};
   // Exact supplied plotted points take precedence over rounded clipping endpoints.
   if(!sameX&&segments.length===1&&model.points.length>=2){const[a,b]=model.points;if(a.x!==b.x){const slope=(b.y-a.y)/(b.x-a.x),intercept=a.y-slope*a.x;if(model.points.every(p=>Math.abs(p.y-slope*p.x-intercept)<1e-8)&&Math.abs(slope-result.m)<.02&&Math.abs(intercept-result.c)<.03){result.m=slope;result.c=intercept;}}}
   return result;
  });
 }
 if(overrides[d.id])model.lines=[{...overrides[d.id],colour:'answerblue'}];
 // Other stored equation plots in this booklet are covered explicitly; do not silently erase one.
 if(code.includes(' plot ')&&!model.lines.length)throw Error('Unmapped equation plot: '+d.id);
 // A mathematicalModel may use top-level m/c and axis limits from contextual graphs.
 if(raw?.xmax!=null){model.bounds={xmin:0,xmax:raw.xmax,ymin:0,ymax:raw.ymax};model.xstep=raw.xstep;model.ystep=raw.ystep;}
 else if(match&&!raw?.bounds)model.bounds={xmin:+match[1],ymin:+match[2],xmax:+match[3],ymax:+match[4]};
 // Keep source aspect ratio where dimensions are given, avoiding squeezed or stretched plots.
 if(!base){const x=code.match(/\bx\s*=\s*([\d.]+)cm/),y=code.match(/\by\s*=\s*([\d.]+)cm/);if(x&&y){const ratio=(model.bounds.ymax-model.bounds.ymin)*+y[1]/((model.bounds.xmax-model.bounds.xmin)*+x[1]);model.heightCm=Math.max(2,Math.min(15,6.5*ratio));}}
 if(!raw?.ystep&&(model.bounds.ymax-model.bounds.ymin)>20)model.ystep=4;
 if(!raw?.xstep&&(model.bounds.xmax-model.bounds.xmin)>30)model.xstep=5;
 const parsedNodes=[...code.matchAll(nodeRE)];
 for(const m of parsedNodes){const x=+m[2],y=+m[3],text=m[4];if(/^(?:[xyO]|-?[\d.]+)$/.test(text))continue;
  const point=model.points.find(p=>p.x===x&&p.y===y&&(!p.label||p.label===text));
  if(point){point.label=text;point.anchor=(m[1]??'above right').replace(/(?:answerblue|blue|red|green|orange|black|sourcegray)(?:!\d+)?/g,'').replace(/,?inner sep=[^,]+/g,'').replace(/^,|,$/g,'')||'above right';}
  else if(!model.labels.some(l=>l.x===x&&l.y===y&&l.text===text))model.labels.push({x,y,text,options:m[1]??'above right'});
 }
 if(d.id==='page-66-q1-p4-sol-diag'){model.bounds={xmin:0,xmax:10,ymin:0,ymax:50};model.ystep=4;model.lines=[{m:4,c:10,colour:'answerblue'}];model.points=[0,1,2,3,4].map(x=>({x,y:4*x+10}));model.heightCm=6.5;}
 if(d.id==='page-65-b1-diag-tikz'){model.labels=[{x:3.5,y:-.8,text:'\\text{Independent Variable}',options:'below'},{x:-.8,y:3,text:'\\text{Dependent Variable}',options:'rotate=90,above'}];}
 if(d.overlayOf)model.overlay=true;
 return model;
}
function convert(d,model,page,reason){
 // Move recovered coordinate captions clear of nearby axis tick labels.
 if(d.id==='page-39-q2-a-diag')for(const p of model.points){if(p.y===-1)p.anchor='below left';if(p.x>0)p.anchor='above right';}
 if(['page-39-q2-c-diag','page-39-q2-d-diag'].includes(d.id))for(const p of model.points){if(p.y<0)p.anchor='below right';p.anchor+=',fill=white';}
 if(d.id==='page-90-identify-b-diagram')for(const label of model.labels)if(label.text==='y=2x-2')label.y=-4.5;
 const bind=m=>{
  for(const label of m.labels){const match=label.text.replace(/\s/g,'').match(/^y=(.+)$/);if(!match)continue;
   let slope=0,intercept=0,valid=true;
   for(const term of match[1].match(/[+-]?[^+-]+/g)??[]){if(term.endsWith('x')){const coefficient=term.slice(0,-1);const value=coefficient===''||coefficient==='+'?1:coefficient==='-'?-1:Number(coefficient);if(!Number.isFinite(value))valid=false;else slope+=value;}else if(Number.isFinite(Number(term)))intercept+=Number(term);else valid=false;}
   const index=m.lines.findIndex(l=>l.m===slope&&l.c===intercept);if(valid&&index>=0){label.equationLine=index;label.originalEquation={m:slope,c:intercept};}
  }
  if(/solution|answer|plotted/.test(d.role??'')||/solution|plotted-answer/.test(d.id))for(const p of m.points){const index=m.lines.findIndex(l=>l.x==null&&Math.abs(l.m*p.x+l.c-p.y)<1e-8);if(index>=0){p.lineIndex=index;if(/^\(-?[\d.]+,\s*-?[\d.]+\)$/.test(p.label??''))p.coordinateLabel=true;}}
 };
 bind(model);model.panels?.forEach(bind);
 const original={format:d.format,src:d.src??null,sourceRegion:d.sourceRegion??null,code:d.code??null};
 const code=graphTikz(model);
 d.spec={...d.spec,originalGraph:d.spec?.originalGraph??original,graphReconstruction:reason};
 Object.assign(d,{format:'tikz',code,mathematicalModel:model,derived:true,reviewStatus:'needs-review'});
 delete d.sourceRegion;
 report.push({id:d.id,page,previousFormat:original.format,lines:model.lines.length,points:model.points.length,reason});
}
for(const {diagram:d,page}of diagrams.filter(r=>!r.diagram.overlayOf)){
 if(d.mathematicalModel?.kind==='cartesian')continue;
 const model=sources[d.id]??(d.format==='tikz'?recover(d):null);
 if(model)convert(d,model,page,sources[d.id]?'Source image inspected; mathematical coordinates, bounds and visible labels reconstructed.':d.mathematicalModel?'Regenerated from retained mathematical model; preserved coordinate labels.':'Recovered equation from stored mathematical coordinates / source rules.');
}
for(const {diagram:d,page}of diagrams.filter(r=>r.diagram.overlayOf)){if(d.mathematicalModel?.kind==='cartesian')continue;const model=recover(d);if(model)convert(d,model,page,'Recovered solution equations and exact plotted points; retained overlay relationship.');}
const retained=diagrams.filter(r=>r.diagram.format==='image').map(r=>({id:r.diagram.id,page:r.page,alt:r.diagram.alt}));
fs.mkdirSync('output/graph-repair',{recursive:true});
fs.writeFileSync('output/graph-repair/candidate.json',JSON.stringify(project,null,2)+'\n');
fs.writeFileSync('output/graph-repair/migration-report.json',JSON.stringify({sourceRevision:before.revision,converted:report,retained},null,2)+'\n');
console.log(JSON.stringify({converted:report.length,images:report.filter(r=>r.previousFormat==='image').length,equations:report.filter(r=>r.lines>0).length,retainedImages:retained.length}));
if(process.argv.includes('--save')&&report.length){
 const compiled=new Map(JSON.parse(fs.readFileSync('output/graph-repair/compile-results.json')).map(r=>[r.id,r]));
 for(const change of report){const d=byId.get(change.id),result=compiled.get(change.id);if(!result?.ok||result.key!==prepareTikz(d.code).key)throw Error('Compile the current candidate before saving: '+change.id);}
 const saved=await saveBookletProject(project,{expectedRevision:before.revision});console.log('Saved revision',saved.revision);
}
