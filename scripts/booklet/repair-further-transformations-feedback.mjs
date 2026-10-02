// Prepare a revision-bound candidate; publication uses the Studio server transaction.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {diagramColourPolicy,DIAGRAM_COLOUR_PREFIX} from '../../src/lib/diagram-colours.js';
const dir=path.resolve('.booklet-work/further-feedback-20261002');
fs.mkdirSync(dir,{recursive:true});
const file='booklets/projects/further-transformations-v1.json';
const original=JSON.parse(fs.readFileSync(file,'utf8'));
assert.equal(original.revision,139,'This maintenance candidate is bound to revision 139; reload and reconcile newer work before running it.');
const p=structuredClone(original);
const blocks=p.sections.flatMap(s=>s.blocks),block=id=>blocks.find(b=>b.id===id);
const round=x=>Number(x.toFixed(6));
const point=p=>`(${round(p[0])},${round(p[1])})`;
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const at=(s,t)=>mix(mix(mix(s[0],s[1],t),mix(s[1],s[2],t),t),mix(mix(s[1],s[2],t),mix(s[2],s[3],t),t),t);
function split(s,t){const a=mix(s[0],s[1],t),b=mix(s[1],s[2],t),c=mix(s[2],s[3],t),d=mix(a,b,t),e=mix(b,c,t),f=mix(d,e,t);return [[s[0],a,d,f],[f,e,c,s[3]]];}
function roots(s,axis,value){const result=[];for(let i=0;i<200;i++){let lo=i/200,hi=(i+1)/200,a=at(s,lo)[axis]-value,b=at(s,hi)[axis]-value;if(Math.abs(a)<1e-9)result.push(lo);if(a*b<0){for(let j=0;j<45;j++){const mid=(lo+hi)/2;if((at(s,lo)[axis]-value)*(at(s,mid)[axis]-value)<=0)hi=mid;else lo=mid;}result.push((lo+hi)/2);}}if(Math.abs(s[3][axis]-value)<1e-9)result.push(1);return [...new Set(result.map(round))];}
function curves(code,colour){
 const commands=[...code.matchAll(new RegExp(String.raw`\\draw\[(?:draw=)?${colour},[^\]]*\][\s\S]*?;`,'g'))].map(m=>m[0]);
 const paths=[];
 for(const cmd of commands){if(!cmd.includes('.. controls'))continue;const coords=[...cmd.matchAll(/\((-?\d*\.?\d+),\s*(-?\d*\.?\d+)\)/g)].map(m=>[+m[1],+m[2]]);const segments=[];for(let i=1;i+2<coords.length;i+=3)segments.push([coords[i-1],coords[i],coords[i+1],coords[i+2]]);paths.push({cmd,segments});}
 return paths;
}
function intersections(paths){return [-1,1].flatMap(y=>paths.flatMap(({segments})=>segments.flatMap(s=>roots(s,1,y).map(t=>[at(s,t)[0],y])))).filter((v,i,a)=>a.findIndex(w=>Math.abs(w[0]-v[0])<1e-4&&w[1]===v[1])===i).sort((a,b)=>a[0]-b[0]);}
function append(d,addition){d.code=d.code.replace('\\end{tikzpicture}',addition+'\n\\end{tikzpicture}');}
function mark(d,points){
 const box=d.code.match(/\\path\[use as bounding box\]\s*\(([^,]+),[^)]+\) rectangle \(([^,]+),[^)]+\)/);
 const left=Number(box[1])+0.25,right=Number(box[2])-0.5;
 const guides=[-1,1].map(y=>`\\draw[black,densely dashed,line width=0.4pt] (${round(left)},${y})--(${round(right)},${y});\n\\node[anchor=${d.id.startsWith('p6-')&&y===-1?'north east':'south east'},fill=white,inner sep=1pt] at (${round(right)},${y}) {$y=${y}$};`).join('\n');
 append(d,'% Invariant points: the marked intersections at y=1 and y=-1 are unchanged.\n'+guides+'\n'+points.map(v=>`\\fill[black] ${point(v)} circle[radius=1.5pt];`).join('\n'));
 d.spec={...d.spec,invariantPoints:points.map(point=>({point:point.map(round),coordinates:'graphical unless already source-labelled'}))};
}
// Retain the accepted qualitative reciprocal shape but align its invariant
// crossings with the original curve. Piecewise x interpolation preserves each
// branch's sign, domain holes and turning points; no equation is inferred.
function alignInvariantCrossings(d,given){
 const paths=curves(d.code,'reciprocalBlue'),answer=intersections(paths);
 assert.equal(answer.length,given.length,`${d.id}: invariant crossing count`);
 const anchors=answer.map((v,i)=>{assert.equal(v[1],given[i][1]);return [v[0],given[i][0]];});
 for(const {segments}of paths){
  const start=segments[0][0][0],end=segments.at(-1)[3][0],crossings=anchors.filter(a=>a[0]>=start&&a[0]<=end);
  for(const s of segments){
   for(const x of [s[0][0],s[3][0]]){
    let mapped=x;
    if(x===start&&crossings.length)mapped=Math.min(x,crossings[0][1]-.12);
    if(x===end&&crossings.length)mapped=Math.max(x,crossings.at(-1)[1]+.12);
    anchors.push([x,mapped]);
   }
  }
 }
 // Original turning points/domain boundaries remain fixed; crossings win if coincident.
 anchors.sort((a,b)=>a[0]-b[0]);
 const unique=anchors.filter((a,i)=>!i||Math.abs(a[0]-anchors[i-1][0])>1e-4);
 assert.ok(unique.every((v,i)=>!i||v[1]>=unique[i-1][1]),`${d.id}: monotone mapping`);
 const warp=x=>{let i=unique.findIndex(a=>a[0]>=x);if(i<0)return x;if(i===0)return unique[0][1];const a=unique[i-1],b=unique[i];return a[1]+(x-a[0])/(b[0]-a[0])*(b[1]-a[1]);};
 for(const {cmd,segments}of paths){
  const pieces=[];
  for(const s of segments){
   const ts=unique.filter(a=>a[0]>s[0][0]+1e-5&&a[0]<s[3][0]-1e-5).flatMap(a=>roots(s,0,a[0])).filter(t=>t>0&&t<1).sort((a,b)=>a-b);
   let remainder=s,previous=0;
   for(const t of ts){const [piece,next]=split(remainder,(t-previous)/(1-previous));pieces.push(piece);remainder=next;previous=t;}
   pieces.push(remainder);
  }
  const mapped=pieces.map(s=>s.map(([x,y])=>[warp(x),y]));
  const replaced=cmd.slice(0,cmd.indexOf(']')+1)+' '+point(mapped[0][0])+mapped.map(s=>' .. controls '+point(s[1])+' and '+point(s[2])+' .. '+point(s[3])).join('')+';';
  d.code=d.code.replace(cmd,replaced);
 }
 return given;
}
const p6=block('p6-example'),example=p6.examples[0],base=example.questionDiagrams.find(d=>d.id==='p6-base-graph'),final=example.questionDiagrams.find(d=>d.id==='p6-stage-4-graph');
const p6Points=intersections(curves(base.code,'black'));
alignInvariantCrossings(final,p6Points);mark(base,p6Points);mark(final,p6Points);
example.prompt.blocks.push({id:'p6-invariant-points',type:'paragraph',align:'left',inlines:[{type:'text',text:'The marked points at '},{type:'math',latex:'y=1',display:false},{type:'text',text:' and '},{type:'math',latex:'y=-1',display:false},{type:'text',text:' stay fixed because '},{type:'math',latex:'\\frac{1}{1}=1',display:false},{type:'text',text:' and '},{type:'math',latex:'\\frac{1}{-1}=-1',display:false},{type:'text',text:'.'}]});
p6.presentation.layoutOverrides.blockLayouts[p6.id].arrangement.root.children.push({id:'p6-invariant-placement',type:'item',ref:example.id+'/prompt#p6-invariant-points',align:'left'});
const p6Saved=p.settings.layoutOverrides?.blockLayouts?.[p6.id]?.arrangement?.root;
if(p6Saved)p6Saved.children.push({id:'p6-invariant-placement',type:'item',ref:example.id+'/prompt#p6-invariant-points',align:'left'});
const review=[];
for(const n of block('p13-q7').content.children){const d=n.questionDiagrams[0],solution=n.answer.solutionDiagrams[0],points=intersections(curves(d.code,'givenBlue'));alignInvariantCrossings(solution,points);mark(d,points);mark(solution,points);const note=n.label==='c'?'The marked points on $y=1$ stay fixed. This graph never reaches $y=-1$.':'The marked points on $y=1$ and $y=-1$ stay fixed because $\\frac{1}{\\pm1}=\\pm1$.';n.answer.short+='\n\n'+note;n.answer.worked+='\n\n'+note;review.push({id:n.id,invariantPoints:points.map(v=>v.map(round))});}
// Fresh teaching IDs, with explicit derived-source provenance.
const section=p.sections.find(s=>s.blocks.some(b=>b.id==='p18-guided-practice'));
const activity=structuredClone(block('p18-guided-practice'));
function reid(v){if(!v||typeof v!=='object')return;for(const [k,a]of Object.entries(v)){if(typeof a==='string'&&(k==='id'||k==='targetId'||k==='ownerId'||k==='overlayOf'))v[k]=a.replace(/^p18-/,'p18-input-absolute-');else if(typeof a==='object')Array.isArray(a)?a.forEach(reid):reid(a);}}
reid(activity);activity.sourceAtom={id:'p18-input-absolute-guided-group',kind:'guided-practice',label:'Guided Practice',order:3};activity.sourceReview={...activity.sourceReview,derivedFrom:{blockId:'p18-guided-practice',reason:'User-requested companion activity for y=f(|x|); original source graphs retained.'}};activity.content.prompt='$y=f(x)$ is given. Sketch $y=f(|x|)$ on the same axis.';
const results=[
 ['Inverted V with vertex $(0,-3)$ and intercepts $(-3,0)$ and $(3,0)$.','Keep the right-hand part of the given line and reflect it in the $y$-axis. The point $(0,-3)$ stays fixed.'],
 ['The graph is unchanged: it is already symmetric about the $y$-axis.','Keep the right-hand half of the parabola and reflect it in the $y$-axis. It coincides with the original left-hand half.'],
 ['Two maxima at $x=\\pm1$, both with $y=3$, and a pointed local minimum at $(0,2)$.','Keep the right-hand part, including $(0,2)$ and $(1,3)$, and reflect it in the $y$-axis.'],
 ['An even graph with $x$-intercepts $-3$, $-1$, $1$ and $3$, and $y$-intercept $(0,4)$.','Keep the right-hand branch and its dip between $x=1$ and $x=3$, then reflect it in the $y$-axis. The negative sections stay below the $x$-axis.']
];
for(const [i,n]of activity.content.children.entries()){
 const source=n.questionDiagrams[0],solution=n.answer.solutionDiagrams[0];let transformed;
 if(i===0)transformed='\\draw[draw=transformedGraph,line width=0.8pt,<->] (-5.45,2.45)--(0,-3)--(5.45,2.45);';
 else if(i===1)transformed='\\draw[draw=transformedGraph,line width=0.8pt,<->] plot[domain=-3.074:3.074,samples=121] (\\x,{\\x*\\x-4});';
 else {
  const right=curves(source.code,'givenGraph')[0].segments.flatMap(s=>{if(s[3][0]<=0)return [];if(s[0][0]>=0)return [s];const t=roots(s,0,0)[0];assert.ok(t!=null);return [split(s,t)[1]];});
  const left=right.slice().reverse().map(s=>s.slice().reverse().map(([x,y])=>[-x,y]));const joined=[...left,...right];transformed='\\draw[draw=transformedGraph,line width=0.8pt,<->] '+point(joined[0][0])+joined.map(s=>' .. controls '+point(s[1])+' and '+point(s[2])+' .. '+point(s[3])).join('')+';';
 }
 const policy=diagramColourPolicy(source.code);policy.semantic.push({name:'transformedGraph',hex:'268CFF',reason:'f(|x|): retained right-hand graph and its reflection in the y-axis'});policy.reference+='; user-requested companion activity';
 solution.code=source.code.replace(/^%[^\n]*\n/,DIAGRAM_COLOUR_PREFIX+JSON.stringify(policy)+'\n').replace('\\end{tikzpicture}','\\definecolor{transformedGraph}{HTML}{268CFF}\n'+transformed+'\n\\end{tikzpicture}');
 solution.spec={...source.spec,description:'Original graph retained grey; the right-hand portion and its y-axis reflection are blue.',mathematics:results[i][1],answerVisibility:'Teaching solution controlled by Show theory solutions.'};
 n.answer={...n.answer,short:results[i][0],worked:results[i][1],provenance:{short:'authored',worked:'authored'}};
 n.answer.solutionDiagrams=[solution];
}
section.blocks.splice(section.blocks.findIndex(b=>b.id==='p18-guided-practice')+1,0,activity);
for(const n of block('p24-q09-block').content.children){const [intro,latex]=n.prompt.split(/\n\$\$/);n.prompt={format:'maths-editor-document-v1',version:1,blocks:[{id:n.id+'-instruction',type:'paragraph',align:'left',inlines:[{type:'text',text:intro}]},{id:n.id+'-equation',type:'paragraph',align:'center',inlines:[{type:'math',latex:latex.replace(/\$\$$/,''),display:true}]}]};}
// Practice answer settings are layout-local; never shrink bank consumers silently.
const settings=p.settings.compactAnswers;settings.shortDiagramMm=60;settings.workedDiagramMm=65;
const crowdedLabel=block('p26-q2-block').content.children[1].answer.solutionDiagrams[0];
crowdedLabel.code=crowdedLabel.code.replace('\\node[anchor=north west] at (0.8,-1.8)',
 '\\draw[black,line width=0.4pt] (0.4,-1.5)--(1.5,-3.4);\n\\node[anchor=north west] at (1.5,-3.4)');
for(const key of Object.keys(settings.diagramWidths??{}))settings.diagramWidths[key]={short:60,worked:65};
// Final-size inspection at 60 mm found touching origin ticks or long coordinate
// labels in these figures. Retain their previously readable widths as exceptions.
const readableExceptions=['p8-q1-a','p8-q1-b','p8-q1-c','p8-q1-d','p9-h','p9-j','p9-l'];
for(const prefix of readableExceptions)for(const suffix of ['-base','-answer'])settings.diagramWidths[prefix+suffix]={short:76,worked:76};
for(const id of ['p26-q2-a-answer','p26-q2-b-answer'])settings.diagramWidths[id]={short:76,worked:76};
settings.diagramWidths['p34-q6-sum-solution']={short:82,worked:94};
// Retain the accepted round-join variant for the mixed-review comparison graph.
// It changes only a stroke join, and final-size typography is calibrated at render.
for(const [mode,styles]of Object.entries(settings.diagramStyles??{}))for(const style of Object.values(styles)){
 assert.ok(style.code.includes('line join=round'),'Unexpected calibrated variant requires a scoped review');
 style.widthMm=mode==='short'?60:65;
}
let resized=0;const teachingSizes=new Map();
function resizeTeaching(b){const sizes=new Map();function visit(v){if(!v||typeof v!=='object')return;if(v.format==='tikz'&&(v.role==='solution'||v.overlayOf||v.id==='p6-stage-4-graph')){v.widthMm=65;sizes.set(v.id,65);resized++;if(v.overlayOf)sizes.set(v.overlayOf,65);}for(const a of Object.values(v))if(typeof a==='object')Array.isArray(a)?a.forEach(visit):visit(a);}visit(b);
 function placements(v){if(!v||typeof v!=='object')return;if(v.format==='tikz'&&sizes.has(v.id))v.widthMm=65;if(v.type==='item'&&sizes.has(v.ref))v.width=65;for(const a of Object.values(v))if(typeof a==='object')Array.isArray(a)?a.forEach(placements):placements(a);}placements(b);
 for(const [id,width]of sizes){teachingSizes.set(id,width);if(p.settings.layoutOverrides?.diagramWidths?.[id])p.settings.layoutOverrides.diagramWidths[id]=width;}
}
for(const s of p.sections.filter(s=>s.role!=='practice'&&s.phase!=='practice'))for(const b of s.blocks)resizeTeaching(b);
// Practice blocks may themselves contain diagrams, so teaching-only selection is explicit.
for(const b of blocks)if(b.id==='p18-guided-practice')resizeTeaching(b);
resizeTeaching(activity);
function savedPlacements(v){if(!v||typeof v!=='object')return;if(v.type==='item'&&teachingSizes.has(v.ref))v.width=65;for(const [k,a]of Object.entries(v)){if(teachingSizes.has(k)&&a&&typeof a==='object'&&a.diagramWidthMm)a.diagramWidthMm=65;if(typeof a==='object')Array.isArray(a)?a.forEach(savedPlacements):savedPlacements(a);}}
savedPlacements(p.settings.layoutOverrides);
assert.deepEqual(p.source,original.source);assert.deepEqual(p.library,original.library);
assert.deepEqual(p.studio,original.studio);
for(const b of blocks){const old=original.sections.flatMap(s=>s.blocks).find(x=>x.id===b.id);for(const field of ['bankRef','classification','sourceRefs','sourceReview','flow'])assert.deepEqual(b[field],old[field],b.id+'/'+field);}
// Independently re-read the authored Bézier geometry and check every marker.
for(const [d,colour]of [[final,'reciprocalBlue'],...block('p13-q7').content.children.flatMap(n=>[[n.questionDiagrams[0],'givenBlue'],[n.answer.solutionDiagrams[0],'reciprocalBlue']])]){
 const plotted=intersections(curves(d.code,colour));
 assert.equal(plotted.length,d.spec.invariantPoints.length,d.id+' intersection count');
 for(const [i,v]of plotted.entries())assert.ok(Math.abs(v[0]-d.spec.invariantPoints[i].point[0])<.00003&&v[1]===d.spec.invariantPoints[i].point[1],d.id+' marker on curve');
}
const write=(name,v)=>fs.writeFileSync(path.join(dir,name),JSON.stringify(v,null,2)+'\n');
if(!fs.existsSync(path.join(dir,'base.json')))write('base.json',original);
write('candidate.json',p);write('content-checks.json',{baseRevision:original.revision,points:review,p6Points:p6Points.map(v=>v.map(round)),teachingResizes:resized,sourceAndBankRelationshipsPreserved:true});
console.log(JSON.stringify({candidate:path.join(dir,'candidate.json'),baseRevision:p.revision,points:review,p6Points:p6Points.length,teachingResizes:resized}));
