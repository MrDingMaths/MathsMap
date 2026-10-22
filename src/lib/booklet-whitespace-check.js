// Vertical whitespace (22 October 2026, user approved: docs/booklet-verification-speed.md).
// The teacher keeps finding gaps she cannot trace: "why is there such a huge gap above the tables and
// why can't I get rid of it?". This finds every vertical gap over 6 mm between blocks and between lines
// of a teaching block, and explains each with the same chain of spacing fields the Studio spacing
// inspector shows (layoutSpaceChain). A gap no field accounts for is a renderer bug and is reported
// as one. A source page boundary that is not an exercise start and leaves its page short is cleared.
// Pure over the page probe, the geometry and the project.
export const GAP_MM=6;

// Runs inside the page (serialised with toString): the top-level block wrappers and their extents.
export function blockBoxProbe(page){
 const paper=page.querySelector('.booklet-page')??page,box=paper.getBoundingClientRect(),k=box.width?210/box.width:0,mm=v=>Math.round(v*k*10)/10;
 const main=page.querySelector('main');
 return [...(main?.children??[])].filter(c=>c.dataset.documentGroup).map(c=>{const r=c.getBoundingClientRect();return {block:c.dataset.documentGroup,y:mm(r.top-box.top),h:mm(r.height),x:mm(r.left-box.left),w:mm(r.width)};});
}

// ---- gaps -----------------------------------------------------------------------------------------
// Gaps between consecutive blocks of one page.
export function betweenBlocks(boxes,{minMm=GAP_MM,ownerOf=id=>id}={}){
 const out=[];
 for(let i=1;i<boxes.length;i++){
  const above=boxes[i-1],below=boxes[i],gapMm=Math.round((below.y-(above.y+above.h))*10)/10;
  if(gapMm>minMm)out.push({kind:'between-blocks',blockId:ownerOf(below.block)??below.block,aboveBlock:ownerOf(above.block)??above.block,gapMm,y:Math.round((above.y+above.h)*10)/10});
 }
 return out;
}
// Gaps between consecutive lines of one teaching block, per column (lines that overlap horizontally),
// except where a figure or a table sits across the gap.
export function withinBlocks(page,{minMm=GAP_MM,ownerOf=id=>id,skip=()=>false}={}){
 const lines=(page.lines??[]).filter(l=>l.block),covers=(page.elements??[]).filter(e=>['diagram','table'].includes(e.kind)||e.tag==='svg'||e.tag==='img');
 const byBlock=new Map();
 for(const line of lines){const id=ownerOf(line.block)??line.block;(byBlock.get(id)??byBlock.set(id,[]).get(id)).push(line);}
 const out=[];
 for(const [blockId,list] of byBlock){
  if(skip(blockId))continue;
  const sorted=[...list].sort((a,b)=>a.y-b.y);
  for(const line of sorted){
   // The nearest line above it that shares a column.
   const above=sorted.filter(o=>o!==line&&o.y+o.h<=line.y+0.5&&Math.min(o.x+o.w,line.x+line.w)-Math.max(o.x,line.x)>1).sort((a,b)=>(b.y+b.h)-(a.y+a.h))[0];
   if(!above)continue;
   const top=above.y+above.h,gapMm=Math.round((line.y-top)*10)/10;
   if(gapMm<=minMm)continue;
   if(covers.some(c=>c.y<line.y&&c.y+c.h>top&&Math.min(c.x+c.w,line.x+line.w)-Math.max(c.x,line.x)>1))continue;
   out.push({kind:'within-block',blockId,aboveNode:above.node,belowNode:line.node,gapMm,y:Math.round(top*10)/10,x:line.x});
  }
 }
 // The same gap is seen once per line in the column; keep the widest.
 return out.filter((g,i)=>out.findIndex(o=>o.blockId===g.blockId&&Math.abs(o.y-g.y)<1)===i);
}

// ---- explanation -----------------------------------------------------------------------------------
const BEFORE=new Set(['before','spaceBefore','marginBefore','paddingTop','paddingBefore','aboveMm']);
const AFTER=new Set(['after','spaceAfter','marginAfter','paddingBottom','paddingAfter','belowMm']);
// What a layoutSpaceChain says about the space around one element: every field set to a value, with
// the side of the element it adds space on. `chain` is the array layoutSpaceChain returns.
export function chainContributions(chain,side){
 const out=[];
 for(const item of chain??[]){
  if(item.kind==='boundary')continue;
  for(const [key,label,fallback] of item.fields??[]){
   const wanted=side==='before'?BEFORE.has(key):side==='after'?AFTER.has(key):false;
   const gap=key==='gap'||key==='minHeight';
   if(!wanted&&!(gap&&side==='between'))continue;
   const value=Number(item.values?.[key]??fallback??0);
   if(Number.isFinite(value)&&value>0)out.push({item:item.id,label:item.label,field:key,title:label,value,explicit:item.values?.[key]!=null});
  }
 }
 return out;
}
// Explain a gap from the chains of the element below and above it. `workingSpaces` are the heights
// (mm) of answer-space entries in the block: a gap that matches one is the writing room it was set to.
// `tolerance` is what the renderer adds without a field: the leading of a line, the padding of a table
// cell, the height of a fraction's strut (about 6 mm in all). A gap is unattributable only when the
// fields that are set leave more than that unexplained.
export function explainGap(gap,{below=[],above=[],workingSpaces=[],tolerance=6.5}={}){
 const parts=[...chainContributions(below,'before'),...chainContributions(above,'after')];
 // A row of two working spaces side by side can leave a gap of twice one of them.
 const space=workingSpaces.find(h=>gap.gapMm>=0.4*h&&gap.gapMm<=2*h+14);
 const sum=parts.reduce((total,p)=>total+p.value,0);
 if(space!=null)return {attributed:true,kind:'working-space',fields:[{label:'working space',value:space}],summedMm:space};
 if(sum+tolerance>=gap.gapMm)return {attributed:true,kind:'fields',fields:parts.sort((a,b)=>b.value-a.value).slice(0,6),summedMm:Math.round(sum*10)/10};
 return {attributed:false,kind:'unattributable',fields:parts.slice(0,6),summedMm:Math.round(sum*10)/10};
}

// ---- stray source boundaries ---------------------------------------------------------------------------
// `pages`: geometry pages of the Questions edition in order; `startsExercise(blockId)` tells which blocks
// the house rule starts on a page of their own. A boundary is stray when the block above it left
// more than minMm empty, the boundary comes from the source (not a hand-set break), and no
// exercise starts there.
export function strayBoundaries(project,pages,{minMm=GAP_MM,pageBoundaryKind,startsExercise,firstBlocks}){
 const out=[];
 for(let i=0;i<pages.length-1;i++){
  const page=pages[i],next=pages[i+1];
  if(page.isCover||page.isAnswer||next.isCover||next.isAnswer)continue;
  const trailing=page.trailingMm;if(trailing==null||trailing<=minMm)continue;
  const first=firstBlocks(next);if(!first)continue;
  if(pageBoundaryKind(project,first)!=='source'||startsExercise(first))continue;
  out.push({kind:'stray-source-boundary',blockId:first,page:page.page,gapMm:Math.round(trailing*10)/10});
 }
 return out;
}

// ---- static estimate for the replay -----------------------------------------------------------------------
// Without a render, only fields that state a large gap can be seen. These are the stored values over
// the threshold on teaching blocks, and a source boundary inside a section that is not an exercise start.
export function storedGaps(project,{minMm=GAP_MM,exerciseStarts=new Set()}={}){
 const out=[];
 const sections=project.sections??[];
 for(const section of sections)for(const [index,block] of (section.blocks??[]).entries()){
  const flow=block.flow??{};
  if(index>0&&flow.sourcePageBreakBefore&&flow.pageBreakBefore!==false&&!exerciseStarts.has(block.id)&&section.phase!=='practice')
   out.push({blockId:block.id,detail:'a source page boundary starts this block on a new page but no exercise starts here'});
  if(section.phase==='practice')continue;
  const arrangement=project.settings?.layoutOverrides?.blockLayouts?.[block.id]?.arrangement;
  const walk=node=>{
   if(!node||typeof node!=='object')return;
   // minHeight reserves room for a response; before and after are the space the teacher asks about.
   for(const key of ['before','after'])if(Number(node[key])>minMm&&node.id)out.push({blockId:block.id,detail:`arrangement ${node.id} sets ${key} ${node[key]} mm`});
   for(const child of node.children??[])walk(child);
  };
  walk(arrangement?.root);
  for(const example of block.examples??[]){
   const row=example.rowLayout??{};
   for(const key of ['aboveMm','belowMm','gapMm'])if(Number(row[key])>minMm)out.push({blockId:block.id,detail:`worked-example row ${key} ${row[key]} mm`});
  }
 }
 return out;
}
