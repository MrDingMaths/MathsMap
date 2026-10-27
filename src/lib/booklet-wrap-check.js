// Wrapped display maths (22 October 2026, user approved: docs/booklet-verification-speed.md).
// The teacher's rule is that an equation prints on one line unless the source breaks it. Maths wraps
// when the browser breaks it between its parts, which happens inside a narrow column. The probe
// reads each formula's rendered lines from the page; the fixes are the ones the teacher makes by
// hand, in order: one column fewer, the diagram above the prompt, a wider column. Pure functions
// over the page probe and the project; checks/wrapped-math.mjs renders and verifies each step.

// Runs inside the page, once per printed page. Self-contained: it is serialised with toString().
// The renderer does not break a formula between its parts (a formula too wide for its column runs
// over, which the print checks report as clipping). What wraps is the line of working around it: a
// paragraph of maths and blanks whose rendered boxes fall in more than one line band. Bands are
// found by vertical overlap, so a fraction taller than its neighbours stays in one band.
export function wrapProbe(page){
 const paper=page.querySelector('.booklet-page')??page,box=paper.getBoundingClientRect(),k=box.width?210/box.width:0,mm=v=>Math.round(v*k*10)/10;
 const owner=el=>{const o=el.closest('[data-edit-root],[data-question-id],[data-arrangement-block],[data-document-group]');return o?(o.dataset.editRoot??o.dataset.questionId??o.dataset.arrangementBlock??o.dataset.documentGroup):null;};
 const nodeOf=el=>{const n=el.closest('[data-node-id],[data-id]');return n?(n.dataset.nodeId??n.dataset.id):null;};
 const rows=[];
 for(const p of page.querySelectorAll('p')){
  if(!p.querySelector('.katex'))continue;
  // Text runs and whole formulas; a formula's hidden accessibility copy and inner spans are not lines.
  const pieces=[],prose=[];
  const collect=node=>{
   if(node.nodeType===3){prose.push(node.textContent??'');const range=document.createRange();range.selectNodeContents(node);pieces.push(...range.getClientRects());return;}
   if(node.nodeType!==1||node.matches('.katex-mathml,annotation,[hidden]'))return;
   if(node.matches('.katex')){pieces.push(node.getBoundingClientRect());return;}
   for(const child of node.childNodes)collect(child);
  };
  collect(p);
  // Explanatory prose may wrap while its inline formulas remain intact.
  // Keep checking maths, blanks and short working connectors such as "For".
  const words=prose.join(' ').match(/[A-Za-z]+/g)??[];
  if(words.length>=3&&words.join('').length>=12)continue;
  const rects=pieces.filter(r=>r.width>0.5&&r.height>0.5).sort((a,b)=>a.top-b.top);
  let lines=0,bottom=-Infinity;
  for(const r of rects){if(r.top>=bottom-1){lines++;bottom=r.bottom;}else bottom=Math.max(bottom,r.bottom);}
  // Display nodes deliberately start new lines, just like an authored break.
  if(lines<2||p.querySelector('br,[data-math][data-display="true"]'))continue;
  const latex=[...p.querySelectorAll('annotation')].map(a=>a.textContent).join(' ; '),text=p.textContent.replace(/\s+/g,' ').trim(),r=p.getBoundingClientRect();
  const host=p.closest('td,th')??p.parentElement,c=host.getBoundingClientRect();
  rows.push({block:owner(p),node:nodeOf(p),latex,text:text.slice(0,80),textLength:text.length,lines,x:mm(r.left-box.left),y:mm(r.top-box.top),widthMm:mm(r.width),containerMm:mm(c.width)});
 }
 return rows;
}

const hasBreak=latex=>/\\\\/.test(String(latex??''));
// The formulas that wrapped without a break the author wrote.
export function wrappedFindings(rows,{ownerOf=id=>id}={}){
 const seen=new Set(),out=[];
 for(const r of rows){
  if(r.lines<2||hasBreak(r.latex))continue;
  const blockId=ownerOf(r.block)??ownerOf(r.node);if(!blockId)continue;
  const key=blockId+'|'+(r.node??'')+'|'+r.latex;if(seen.has(key))continue;seen.add(key);
  out.push({blockId,nodeId:r.node,latex:String(r.latex).slice(0,140),lines:r.lines,widthMm:r.widthMm,containerMm:r.containerMm,page:r.page??null,
   detail:`maths wraps onto ${r.lines} lines (${r.widthMm} mm in a ${r.containerMm} mm column): ${String(r.latex).replace(/\s+/g,' ').slice(0,60)}`});
 }
 return out;
}

// ---- estimate, for checks that cannot render (the corpus replay) --------------------------------
// Printed width of a formula in millimetres at the booklet's maths size, from its source. Boxes and
// spacers count their stated size, fractions the wider of their halves.
export function estimateMathWidthMm(latex){
 let s=String(latex??'');
 let extra=0;
 s=s.replace(/\\hspace\{([\d.]+)mm\}/g,(_,w)=>{extra+=Number(w);return '';}).replace(/\\rule\{[^{}]*\}\{[^{}]*\}/g,'').replace(/\\(?:quad)\b/g,()=>{extra+=4;return '';}).replace(/\\(?:qquad)\b/g,()=>{extra+=8;return '';});
 const width=text=>{
  // A fraction is as wide as its wider half.
  let t=text;
  for(let i=0;i<4;i++)t=t.replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g,(_,a,b)=>'['+(a.length>=b.length?a:b)+']');
  t=t.replace(/\\(?:text|textbf|mathrm|mathbf|operatorname)\s*\{([^{}]*)\}/g,'$1').replace(/\\(?:left|right|displaystyle|phantom|mathrel|color)\b\s*(?:\{[^{}]*\})?/g,'').replace(/\\[a-zA-Z]+/g,'o').replace(/[{}^_&\\]/g,'').replace(/\s+/g,'');
  return t.length;
 };
 return Math.round((width(s)*2.1+extra)*10)/10;
}
const BODY_MM=170;
// The width a node's container gives its content, from the layout above it in the block.
export function containerWidthMm(block,nodeId){
 const path=pathTo({content:block.content,examples:block.examples},nodeId)??[];
 let width=BODY_MM-8;
 for(const node of path){
  const n=Number(node.columns);
  if(n>1&&(node.layout==='grid'||node.type==='layout'||node.type==='group'))width=(width-3*(n-1))/n;
 }
 const cols=Number(block.presentation?.columns);
 if(block.presentation?.layout==='columns'&&cols>1)width=(width-6*(cols-1))/cols;
 return Math.round(width*10)/10;
}
export function pathTo(root,id){
 const walk=(node,trail)=>{
  if(!node||typeof node!=='object')return null;
  if(node.id===id)return [...trail,node];
  for(const [key,value] of Object.entries(node)){
   if(['sourceReview','sourceLayoutEvidence','provenance','spec','originalDiagram'].includes(key)||!value||typeof value!=='object')continue;
   for(const child of Array.isArray(value)?value.flat():[value]){const found=walk(child,[...trail,node]);if(found)return found;}
  }
  return null;
 };
 return walk(root,[]);
}
// Maths nodes that probably wrap: their estimated width exceeds their column. Conservative on purpose.
export function estimatedWraps(project,{margin=1.12,minimumMm=40}={}){
 const out=[];
 for(const section of project.sections??[])for(const block of section.blocks??[]){
  const maths=[];
  (function walk(node){
   if(!node||typeof node!=='object')return;
   if(node.type==='math'&&typeof node.latex==='string'&&!hasBreak(node.latex)&&node.latex.length>12)maths.push(node);
   for(const [key,value] of Object.entries(node))if(value&&typeof value==='object'&&!['sourceReview','sourceLayoutEvidence','provenance','spec','answer','answers','short','worked','solution'].includes(key))walk(value);
  })({c:block.content,e:block.examples});
  for(const node of maths){
   const width=estimateMathWidthMm(node.latex);if(width<minimumMm)continue;
   const paragraph=pathTo({content:block.content,examples:block.examples},node.id);
   const owner=[...(paragraph??[])].reverse().find(n=>n.id&&n.type!=='math')?.id??block.id;
   const room=containerWidthMm(block,owner);
   if(width>room*margin)out.push({blockId:block.id,nodeId:node.id??owner,widthMm:width,containerMm:room,detail:`estimated ${width} mm of maths in a ${room} mm column: ${node.latex.replace(/\s+/g,' ').slice(0,50)}`});
  }
 }
 return out;
}

// ---- fixes ---------------------------------------------------------------------------------------
export const WRAP_STEPS=Object.freeze(['columns','diagram-placement','widen']);
const clone=value=>structuredClone(value);
const blockIn=(project,id)=>(project.sections??[]).flatMap(s=>s.blocks??[]).find(b=>b.id===id);

// One column fewer on the nearest grid above the formula (or the teaching block's own columns).
function fewerColumns(project,finding){
 const next=clone(project),block=blockIn(next,finding.blockId);if(!block)return null;
 const path=(pathTo({content:block.content,examples:block.examples},finding.nodeId)??[]).reverse();
 const grid=path.find(n=>Number(n.columns)>1&&(n.layout==='grid'||n.type==='layout'||n.type==='group'));
 if(grid){
  const n=Number(grid.columns)-1;
  if(n<=1&&grid.layout==='grid'){grid.layout='list';delete grid.columns;}else grid.columns=n;
  return {project:next,change:`columns ${n+1} -> ${n}${n<=1?' (list)':''} on ${grid.id??'the grid'}`};
 }
 if(block.presentation?.layout==='columns'&&Number(block.presentation.columns)>1){
  const n=Number(block.presentation.columns)-1;
  block.presentation={...block.presentation,columns:n,...(n<=1?{layout:'worked-rows'}:{})};
  return {project:next,change:`presentation columns ${n+1} -> ${n}`};
 }
 return null;
}
// The diagram above the prompt, when a diagram sits beside the question the formula is in.
function diagramAbove(project,finding){
 const next=clone(project),block=blockIn(next,finding.blockId);if(!block)return null;
 const path=(pathTo({content:block.content,examples:block.examples},finding.nodeId)??[]).reverse();
 const owner=path.find(n=>n.questionDiagrams?.length&&n.diagramPlacement!=='before-prompt');
 if(!owner)return null;
 owner.diagramPlacement='before-prompt';
 return {project:next,change:`diagramPlacement before-prompt on ${owner.id}`};
}
// A wider column in the saved arrangement that holds the formula.
function widerColumn(project,finding,{stepMm=18}={}){
 const next=clone(project),block=blockIn(next,finding.blockId);if(!block)return null;
 const tree=next.settings?.layoutOverrides?.blockLayouts?.[block.id]?.arrangement;if(!tree?.root)return null;
 const ids=[finding.nodeId,...(pathTo({content:block.content,examples:block.examples},finding.nodeId)??[]).reverse().map(n=>n.id)].filter(Boolean);
 const items=[];(function walk(node,row){if(!node)return;if(node.type==='item')items.push({item:node,row});for(const child of node.children??[])walk(child,node.direction==='row'?node:row);})(tree.root,null);
 const base=ref=>String(ref??'').replace(/^layout:/,'').replace(/\/.*$/,'').replace(/#.*$/,'');
 let hit=null;for(const id of ids){hit=items.find(({item})=>base(item.ref)===id);if(hit)break;}
 if(!hit||!hit.row)return null;
 const siblings=hit.row.children.filter(c=>c!==hit.item&&c.type==='item'&&typeof c.width==='number');
 const was=hit.item.width;
 if(typeof was!=='number'){
  if(typeof hit.item.weight==='number')hit.item.weight=Math.round(hit.item.weight*1.35*100)/100;else return null;
 }else{
  const room=Math.min(190,was+stepMm),grow=room-was;if(grow<2)return null;
  hit.item.width=room;
  // The width comes from the sibling that has the most to spare.
  const donor=siblings.sort((a,b)=>b.width-a.width)[0];if(donor&&donor.width-grow>=30)donor.width-=grow;
 }
 return {project:next,change:`wider column for ${hit.item.id}`};
}
export function wrapFix(step,project,finding){
 if(step==='columns')return fewerColumns(project,finding);
 if(step==='diagram-placement')return diagramAbove(project,finding);
 if(step==='widen')return widerColumn(project,finding);
 throw Error('Unknown step '+step);
}
