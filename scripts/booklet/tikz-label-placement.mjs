// Deterministic TikZ label placement (import v2 simplification plan, item 1, 13 November 2026).
// Pure functions, no DOM: scan a diagram's \node statements, instrument them so a render can be
// mapped back to the code, choose a clear position for each colliding label from measured
// geometry, and write the choice back as explicit node options. Only label placement changes:
// node text, coordinates, paths and every other option are kept. The driver that renders and
// measures is diagram-label-placer.mjs.

// ---- scanning ------------------------------------------------------------------------------
// Replace comments with spaces (same length) so positions stay valid.
export function maskComments(code){
 return code.replace(/(^|[^\\])((?:\\\\)*)%[^\n]*/g,(all,lead,slashes)=>lead+slashes+' '.repeat(all.length-lead.length-slashes.length));
}
const OPEN={'[':']','{':'}','(':')'};
// Index just past the group that opens at `start` (one of [ { ( ), balancing all three kinds.
export function matchGroup(text,start){
 const stack=[OPEN[text[start]]];
 for(let i=start+1;i<text.length;i++){
  const c=text[i];
  if(c==='\\'){i++;continue;}
  if(OPEN[c])stack.push(OPEN[c]);
  else if(c===stack.at(-1)){stack.pop();if(!stack.length)return i+1;}
  else if(c===']'||c==='}'||c===')'){if(c==='}'&&stack.includes('}')){while(stack.at(-1)!=='}')stack.pop();stack.pop();if(!stack.length)return i+1;}}
 }
 return -1;
}
// Split at top-level commas (outside {} [] ()).
export function splitTop(text,sep=','){
 const parts=[];let depth=0,last=0;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(c==='\\'){i++;continue;}
  if(OPEN[c])depth++;else if(c===']'||c==='}'||c===')')depth--;
  else if(c===sep&&depth===0){parts.push(text.slice(last,i));last=i+1;}
 }
 parts.push(text.slice(last));
 return parts;
}
const skipSpace=(text,i)=>{while(i<text.length&&/\s/.test(text[i]))i++;return i;};

const PLACEMENT=/^(?:(?:above|below|left|right)(?:\s+(?:left|right))?(?:\s*=[\s\S]*)?|anchor\s*=[\s\S]*|(?:x|y)?shift\s*=[\s\S]*)$/;
const UNSUPPORTED=/^(?:sloped|rotate\b|transform shape|allow upside down|xslant|yslant)/;
export const isPlacementOption=option=>PLACEMENT.test(option.trim());
const positioningOf=option=>/^(?:above|below|left|right)(?:\s+(?:left|right))?\s*=[\s\S]*\bof\b/.test(option.trim());

// \foreach statements: variables, list items, body range, statement range.
export function scanForeach(code){
 const text=maskComments(code),loops=[];
 for(const match of text.matchAll(/\\foreach\b/g)){
  let i=skipSpace(text,match.index+8);const vars=[];
  while(text[i]==='\\'){const m=/^\\([A-Za-z@]+)/.exec(text.slice(i));if(!m)break;vars.push(m[1]);i=skipSpace(text,i+m[0].length);if(text[i]==='/')i=skipSpace(text,i+1);else break;}
  let splittable=vars.length>0;
  if(text[i]==='['){const end=matchGroup(text,i);if(end<0)continue;splittable=false;i=skipSpace(text,end);}
  if(text.slice(i,i+2)!=='in'){continue;}
  i=skipSpace(text,i+2);
  let items=null;
  if(text[i]==='{'){const end=matchGroup(text,i);if(end<0)continue;items=splitTop(code.slice(i+1,end-1)).map(s=>s.trim());i=skipSpace(text,end);}
  else {splittable=false;const m=/^\\[A-Za-z@]+/.exec(text.slice(i));if(!m)continue;i=skipSpace(text,i+m[0].length);}
  if(items&&items.some(item=>/\.\.\./.test(item)||!item))splittable=false;
  if(items&&vars.length>1&&items.some(item=>splitTop(item,'/').length!==vars.length))splittable=false;
  let bodyStart=i,bodyEnd,end;
  if(text[i]==='{'){bodyEnd=matchGroup(text,i);if(bodyEnd<0)continue;end=bodyEnd;}
  else if(text.startsWith('\\foreach',i)){const inner=scanForeach(code.slice(i))[0];if(!inner)continue;bodyEnd=i+inner.end;end=bodyEnd;}
  else {let j=i,depth=0;for(;j<text.length;j++){const c=text[j];if(c==='\\'){j++;continue;}if(OPEN[c])depth++;else if(c===']'||c==='}'||c===')')depth--;else if(c===';'&&depth===0)break;}bodyEnd=j+1;end=bodyEnd;}
  loops.push({start:match.index,end,bodyStart,bodyEnd,vars,items,splittable});
 }
 return loops;
}

// Every node in the code: keyword range, first option list, extra option lists, text range.
export function scanNodes(code){
 const text=maskComments(code),loops=scanForeach(code),nodes=[];
 const re=/\\node\b|(?<![\\A-Za-z@])node(?![A-Za-z@])/g;
 for(const match of text.matchAll(re)){
  const keywordEnd=match.index+match[0].length;
  let i=skipSpace(text,keywordEnd);
  // A node keyword is followed by options, a name, its text or "at"; "node distance" and "node font" are keys.
  if(!(text[i]==='['||text[i]==='('||text[i]==='{'||/^at\b/.test(text.slice(i))))continue;
  if(text[i-1]==='/'||text[match.index-1]==='/')continue;
  let options=null,extra=[];
  if(text[i]==='['){const end=matchGroup(text,i);if(end<0)continue;options={start:i+1,end:end-1};i=skipSpace(text,end);}
  let guard=0,textRange=null;
  while(i<text.length&&guard++<8){
   if(text[i]==='('){const end=matchGroup(text,i);if(end<0)break;i=skipSpace(text,end);continue;}
   if(/^at\b/.test(text.slice(i))){i=skipSpace(text,i+2);if(text[i]==='('){const end=matchGroup(text,i);if(end<0)break;i=skipSpace(text,end);}continue;}
   if(text[i]==='['){const end=matchGroup(text,i);if(end<0)break;extra.push({start:i+1,end:end-1});i=skipSpace(text,end);continue;}
   if(text[i]==='{'){const end=matchGroup(text,i);if(end<0)break;textRange={start:i+1,end:end-1};}
   break;
  }
  if(!textRange)continue;
  const optionList=options?splitTop(code.slice(options.start,options.end)).map(s=>s.trim()).filter(Boolean):[];
  const extraOptions=extra.flatMap(range=>splitTop(code.slice(range.start,range.end)).map(s=>s.trim()).filter(Boolean));
  const enclosing=loops.filter(loop=>match.index>=loop.bodyStart&&match.index<loop.bodyEnd);
  // A path-level foreach (no backslash) before the node in the same statement repeats it too.
  const statementStart=Math.max(text.lastIndexOf(';',match.index),0);
  const pathLoop=/(?<![\\A-Za-z@])foreach\b/.test(text.slice(statementStart,match.index));
  let unsupported=null;
  if([...optionList,...extraOptions].some(positioningOf))unsupported='positioning library placement';
  else if([...optionList,...extraOptions].some(o=>UNSUPPORTED.test(o)))unsupported='rotated or sloped node';
  else if(extraOptions.some(isPlacementOption))unsupported='placement in a later option list';
  else if(pathLoop)unsupported='node repeated by a path foreach';
  nodes.push({k:nodes.length,start:match.index,keywordEnd,options,optionList,extraOptions,text:code.slice(textRange.start,textRange.end),textRange,loops:enclosing,unsupported});
 }
 return nodes;
}

// ---- instrumenting --------------------------------------------------------------------------
// A per-node marker in the render (data-mm-src = node index) so measured labels map to code.
// The typography hook below replaces Studio's own (src/lib/diagram-typography.js) for the
// measuring render only, adding the marker attribute and nothing else. "execute at begin
// node" appends, so the hook macros are redefined rather than set through the key.
export function instrumentPreamble(code,tickPt){
 const tick=/"tickTargetPt"\s*:\s*8\b/.test(code)?8:tickPt;
 return String.raw`\makeatletter
\gdef\mmsrc{-1}
\gdef\tikz@atbegin@node{\special{dvisvgm:raw <g data-diagram-label="1" data-label-font="\f@size" data-label-anchor="\tikz@anchor" data-tick-target="${tick}" data-mm-src="\mmsrc">}\gdef\mmsrc{-1}}
\gdef\tikz@atend@node{\special{dvisvgm:raw </g>}}
\makeatother
`;
}
const withOptions=(code,node,list)=>node.options?
 code.slice(0,node.options.start)+list.join(',')+code.slice(node.options.end):
 code.slice(0,node.keywordEnd)+'['+list.join(',')+']'+code.slice(node.keywordEnd);
// Edits applied from the end, so earlier positions stay valid.
function editNodes(code,nodes,optionsFor){
 let out=code;
 for(const node of [...nodes].sort((a,b)=>b.start-a.start)){const list=optionsFor(node);if(list)out=withOptions(out,node,list);}
 return out;
}
// mode 'measure': markers only; mode 'center': markers, and the named nodes at anchor=center.
export function instrumentCode(code,{center=[],tickPt=8.5}={}){
 const nodes=scanNodes(code),centred=new Set(center);
 const body=editNodes(code,nodes,node=>{
  const list=centred.has(node.k)&&!node.unsupported?[...node.optionList.filter(o=>!isPlacementOption(o)),'anchor=center']:[...node.optionList];
  // Inside one splittable loop the marker carries the loop value, so a split copy keeps its identity.
  const loop=node.loops.length===1&&node.loops[0].splittable?node.loops[0]:null;
  return ['/utils/exec={\\gdef\\mmsrc{'+node.k+(loop?':\\'+loop.vars[0]:'')+'}}',...list];
 });
 return instrumentPreamble(code,tickPt)+body;
}
// Measured labels carry the raw marker ("k" or "k:value"); give each its node and instance:
// the loop item index for a looped node, otherwise its order among that node's labels.
export function identifyLabels(labels,nodes){
 const count={};
 return labels.map(label=>{
  const [k,value]=String(label.src??'-1').split(':'),src=Number(k);
  let instance=count[src]=(count[src]??-1)+1;
  const loop=nodes[src]?.loops?.length===1?nodes[src].loops[0]:null;
  if(value!==undefined&&loop?.items){const at=loop.items.findIndex(item=>splitTop(item,'/')[0].trim().replace(/\s+/g,'')===value.replace(/\s+/g,''));if(at>=0)instance=at;}
  return {...label,src:Number.isInteger(src)?src:-1,instance};
 });
}

// ---- geometry ---------------------------------------------------------------------------------
// Boxes are [x0,y0,x1,y1] in SVG user units (y down). TikZ directions are y up.
export const DIRECTIONS=Object.freeze({
 north:[0,1],south:[0,-1],east:[1,0],west:[-1,0],'north east':[1,1],'north west':[-1,1],'south east':[1,-1],'south west':[-1,-1]});
const OPPOSITE={north:'south',south:'north',east:'west',west:'east','north east':'south west','north west':'south east','south east':'north west','south west':'north east'};
export const placementOptions=({anchor,dx=0,dy=0})=>['anchor='+anchor,...(Math.abs(dx)>=.005?['xshift='+dx.toFixed(2)+'pt']:[]),...(Math.abs(dy)>=.005?['yshift='+dy.toFixed(2)+'pt']:[])];
// Ink box for a node whose anchor `anchor` sits at P+(dx,dy) (TikZ), given its ink size and the
// gap between node border and ink (inner sep). Calibration scales ink about the ink anchor point,
// so that point stays where the node border anchor puts it, inset by the inner sep.
export function predictBox({px,py,w,h,innerSep},{anchor,dx=0,dy=0}){
 const out=DIRECTIONS[OPPOSITE[anchor]]??[0,0];
 const ax=px+dx+innerSep*out[0],ay=py-(dy+innerSep*out[1]);
 const fx=/west/.test(anchor)?0:/east/.test(anchor)?1:.5,fy=/north/.test(anchor)?0:/south/.test(anchor)?1:.5;
 const x0=ax-fx*w,y0=ay-fy*h;
 return [x0,y0,x0+w,y0+h];
}
export function candidatePlacements({gaps=[.5,2,3.5]}={}){
 const rows=[];
 for(const [name,[ux,uy]] of Object.entries(DIRECTIONS)){
  const diagonal=ux&&uy,unit=diagonal?Math.SQRT1_2:1;
  for(const gap of gaps)rows.push({anchor:OPPOSITE[name],dx:ux*gap*unit,dy:uy*gap*unit,direction:name});
 }
 return rows;
}
const inside=(x,y,[x0,y0,x1,y1],pad)=>x>x0-pad&&x<x1+pad&&y>y0-pad&&y<y1+pad;
const overlap=(a,b,pad)=>a[0]<b[2]+pad&&b[0]<a[2]+pad&&a[1]<b[3]+pad&&b[1]<a[3]+pad;
// Stroke points inside a box shrunk by tol (the Studio check), and near it (within clearance).
export function boxHits(box,points,{tol=.375,clearance=.8}={}){
 let hits=0,near=0;
 for(let i=0;i<points.length;i+=2){const x=points[i],y=points[i+1];if(inside(x,y,box,-tol))hits++;else if(inside(x,y,box,clearance))near++;}
 return {hits,near};
}
export function scoreBox(box,{points,others,bounds,origin,tol,clearance}){
 const {hits,near}=boxHits(box,points,{tol,clearance});
 let cost=hits*1000+near*20;
 for(const other of others){if(overlap(box,other,-tol))cost+=1000;else if(overlap(box,other,clearance/2))cost+=20;}
 if(bounds)cost+=8*(Math.max(0,bounds[0]-box[0])+Math.max(0,bounds[1]-box[1])+Math.max(0,box[2]-bounds[2])+Math.max(0,box[3]-bounds[3]));
 if(origin)cost+=.3*Math.hypot((box[0]+box[2])/2-origin[0],(box[1]+box[3])/2-origin[1]);
 return {cost,hits,near};
}
// Labels in one measured diagram that a stroke runs through, that overlap another label, or
// that a stroke touches (within `touch`).
export function labelProblems(measure,{touch=.5}={}){
 const tol=measure.tol??.375;
 return measure.labels.map((label,i)=>{
  const {hits,near}=boxHits(label.box,measure.points,{tol,clearance:touch});
  const overlaps=measure.labels.some((other,j)=>j!==i&&overlap(label.box,other.box,-tol));
  return {index:i,hits,touches:near,overlaps,problem:hits>0||overlaps||near>0};
 });
}

// Choose placements for the moving labels. `current` is the measured render, `centred` the
// render with the moving nodes at anchor=center; labels are matched by (src, instance).
export function choosePlacements({current,centred,moving,innerSep=3.33,corrections={},clearance=.8}){
 const tol=current.tol??.375,key=l=>l.src+':'+l.instance;
 const centreBy=new Map(centred.labels.map(l=>[key(l),l]));
 const boxes=current.labels.map(l=>l.box.slice());
 const pad=4;
 const bounds=[current.viewBox[0]-pad,current.viewBox[1]-pad,current.viewBox[0]+current.viewBox[2]+pad,current.viewBox[1]+current.viewBox[3]+pad];
 const order=[...moving].sort((a,b)=>(b.hits??0)-(a.hits??0)),chosen=new Map();
 for(let sweep=0;sweep<2;sweep++)for(const row of order){
  const label=current.labels[row.index],centre=centreBy.get(key(label));if(!centre)continue;
  const [cx0,cy0,cx1,cy1]=centre.box,w=cx1-cx0,h=cy1-cy0,px=(cx0+cx1)/2,py=(cy0+cy1)/2;
  const delta=corrections[key(label)]??[0,0],others=boxes.filter((_,j)=>j!==row.index);
  const origin=[(label.box[0]+label.box[2])/2,(label.box[1]+label.box[3])/2];
  const context={points:current.points,others,bounds,origin,tol,clearance};
  const keep=scoreBox(boxes[row.index],context);
  let best={placement:null,box:boxes[row.index],...keep};
  for(const placement of candidatePlacements()){
   const raw=predictBox({px,py,w,h,innerSep:label.innerSep??innerSep},placement),box=[raw[0]+delta[0],raw[1]+delta[1],raw[2]+delta[0],raw[3]+delta[1]];
   const score=scoreBox(box,context);
   if(score.cost+(placement.anchor===label.anchor?0:1)<best.cost)best={placement,box,...score};
  }
  if(best.placement){boxes[row.index]=best.box;chosen.set(row.index,{...best,src:label.src,instance:label.instance});}
 }
 return chosen;
}

// ---- writing back -----------------------------------------------------------------------------
const substitute=(text,vars,values)=>vars.reduce((out,name,i)=>out.replace(new RegExp('\\\\'+name+'(?![A-Za-z@])','g'),()=>values[i]),text);
// placements: Map "k:instance" -> placement. Returns {code, applied:[...], skipped:[{k,reason}]}.
export function applyPlacements(code,placements){
 const nodes=scanNodes(code),byNode=new Map(),skipped=[],applied=[];
 for(const [id,placement] of placements){const [k,instance]=id.split(':').map(Number);if(!byNode.has(k))byNode.set(k,new Map());byNode.get(k).set(instance,placement);}
 const uniform=new Map(),splits=new Map();
 for(const [k,instances] of byNode){
  const node=nodes[k];
  if(!node){skipped.push({k,reason:'node not found'});continue;}
  if(node.unsupported){skipped.push({k,reason:node.unsupported});continue;}
  const loop=node.loops.at(-1),count=loop?.items?.length??1;
  const same=[...instances.values()].every(p=>JSON.stringify(p)===JSON.stringify([...instances.values()][0]));
  if(!node.loops.length||same&&instances.size===count){uniform.set(k,[...instances.values()][0]);applied.push(...[...instances.keys()].map(i=>k+':'+i));continue;}
  if(node.loops.length!==1||!loop.splittable){skipped.push({k,reason:'per-iteration placement inside a loop that cannot be split'});continue;}
  if(!splits.has(loop.start))splits.set(loop.start,{loop,nodes:new Map()});
  splits.get(loop.start).nodes.set(k,instances);applied.push(...[...instances.keys()].map(i=>k+':'+i));
 }
 // Node edits outside split loops, then loop splits (later positions first).
 const optionsFor=(node,placement)=>[...node.optionList.filter(o=>!isPlacementOption(o)),...placementOptions(placement)];
 const edits=[];
 for(const [k,placement] of uniform){const node=nodes[k];if(node.loops.some(loop=>splits.has(loop.start)))continue;edits.push({start:node.start,apply:out=>withOptions(out,node,optionsFor(node,placement))});}
 for(const {loop,nodes:moved} of splits.values()){
  // Uniform edits to other nodes in the same loop body apply in every copy.
  const bodyNodes=nodes.filter(node=>node.start>=loop.bodyStart&&node.start<loop.bodyEnd);
  const bodyFor=instance=>{
   let body=code.slice(loop.bodyStart,loop.bodyEnd);
   for(const node of [...bodyNodes].sort((a,b)=>b.start-a.start)){
    const placement=moved.get(node.k)?.get(instance)??uniform.get(node.k);
    if(!placement)continue;
    const shifted={...node,options:node.options&&{start:node.options.start-loop.bodyStart,end:node.options.end-loop.bodyStart},keywordEnd:node.keywordEnd-loop.bodyStart};
    body=withOptions(body,shifted,optionsFor(node,placement));
   }
   return body;
  };
  const changed=new Set([...moved.values()].flatMap(map=>[...map.keys()]));
  const keep=loop.items.filter((_,i)=>!changed.has(i)),copies=loop.items.map((item,i)=>changed.has(i)?substitute(bodyFor(i),loop.vars,splitTop(item,'/').map(s=>s.trim())):null).filter(Boolean);
  const head=code.slice(loop.start,loop.bodyStart),listOpen=head.lastIndexOf('{'),listClose=matchGroup(head,listOpen);
  const unchangedBody=bodyFor(-1);
  const remaining=keep.length?head.slice(0,listOpen+1)+keep.join(',')+head.slice(listClose-1)+unchangedBody:'';
  edits.push({start:loop.start,apply:out=>out.slice(0,loop.start)+[remaining,...copies].filter(Boolean).join('\n')+out.slice(loop.end)});
 }
 let out=code;
 for(const edit of edits.sort((a,b)=>b.start-a.start))out=edit.apply(out);
 return {code:out,applied,skipped};
}
