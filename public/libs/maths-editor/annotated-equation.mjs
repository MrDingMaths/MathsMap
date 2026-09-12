// Equation annotations are structured, with conservative source-range anchors.
const hex=(v,f='#268cff')=>/^#[0-9a-f]{6}$/i.test(v??'')?v:f;
const limit=(v,f,min,max)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):f;
export function equationTargets(latex) {
 const targets=[];const re=/\\[a-zA-Z]+|[a-zA-Z]|\d+(?:\.\d+)?/g;
 for(const m of latex.matchAll(re))if(!m[0].startsWith('\\')||/^\\(?:alpha|beta|gamma|theta|pi|lambda|mu|sigma|omega)$/.test(m[0]))targets.push({start:m.index,end:m.index+m[0].length,text:m[0]});
 return targets;
}
export const anchorResolved=(n,a)=>!a.unresolved&&a.start>=0&&a.end>a.start&&n.latex.slice(a.start,a.end)===a.text;
export function changeEquation(n,latex) {
 const before=n.latex;let left=0,right=0;
 while(left<before.length&&left<latex.length&&before[left]===latex[left])left++;
 while(right<before.length-left&&right<latex.length-left&&before[before.length-1-right]===latex[latex.length-1-right])right++;
 for(const a of n.anchors){if(!anchorResolved(n,a)){a.unresolved=true;continue;}if(a.end<=left)continue;if(a.start>=before.length-right){a.start+=latex.length-before.length;a.end+=latex.length-before.length;}else a.unresolved=true;}
 n.latex=latex;
 return n;
}
export function normalizeAnnotatedEquation(n,{id,blocks}) {
 return {id:id(n.id),type:'annotated-equation',latex:String(n.latex??'y=mx+c'),fontSize:n.fontSize===null?null:limit(n.fontSize,20,10,36),gap:limit(n.gap,8,4,25),width:limit(n.width,150,5,190),
  ...(n.margin!=null?{margin:limit(n.margin,2,0,20)}:{}),...(n.arrowSpace!=null?{arrowSpace:limit(n.arrowSpace,3,0,20)}:{}),...(n.align?{align:['left','center','right'].includes(n.align)?n.align:'center'}:{}),
  ...(n.connections?{connections:n.connections.map(c=>({id:id(c.id),fromId:String(c.fromId??''),toId:String(c.toId??''),colour:hex(c.colour,'#ef6068'),height:limit(c.height,3,1,15)}))}:{}),
  anchors:(n.anchors??[]).map(a=>({id:id(a.id),start:Number(a.start),end:Number(a.end),text:String(a.text??''),unresolved:!!a.unresolved})),
  annotations:(n.annotations??[]).map(a=>({id:id(a.id),targetId:String(a.targetId??''),colour:hex(a.colour),placement:a.placement==='above'?'above':'below',decoration:['arrow','bracket','highlight','none'].includes(a.decoration)?a.decoration:'arrow',blocks:blocks(a.blocks)}))};
}
let instance=0;
export function renderAnnotatedEquation(n,{e,render,math,editable}) {
 const serial=++instance,ids=[],ranges=n.anchors.filter(a=>anchorResolved(n,a)).sort((a,b)=>a.start-b.start);let latex='',end=0;
 for(const a of ranges){if(a.start<end)continue;const index=n.anchors.indexOf(a),id='ae-'+serial+'-'+index;ids.push(id);const colour=n.annotations.find(x=>x.targetId===a.id)?.colour??'#24282d';latex+=n.latex.slice(end,a.start)+`\\htmlId{${id}}{\\textcolor{${colour}}{${a.text}}}`;end=a.end;}
 latex+=n.latex.slice(end);
 const labels=side=>{const items=n.annotations.filter(a=>a.placement===side);return items.length?`<div data-equation-label-row="${side}" style="position:relative;min-height:1em;margin:${side==='below'?n.gap+'mm 0 0':'0 0 '+n.gap+'mm'}">${items.map(a=>`<div data-equation-label="${e(a.id)}" data-target-index="${n.anchors.findIndex(x=>x.id===a.targetId)}" data-decoration="${a.decoration}" data-side="${side}" style="position:absolute;width:max-content;max-width:100%;color:${a.colour};text-align:center;min-width:0" ${editable?'contenteditable="true"':''}>${render(a.blocks.map(b=>b.type==='paragraph'?{...b,align:'center',spaceAfter:0}:b))}</div>`).join('')}</div>`:'';};
 const unresolved=n.annotations.filter(a=>!n.anchors.some(t=>t.id===a.targetId&&anchorResolved(n,t)));
 const connections=(n.connections??[]).map(c=>({...c,from:n.anchors.findIndex(a=>a.id===c.fromId&&anchorResolved(n,a)),to:n.anchors.findIndex(a=>a.id===c.toId&&anchorResolved(n,a))}));
 const missing=unresolved.length||connections.some(c=>c.from<0||c.to<0);
 return `<figure data-id="${e(n.id)}" data-type="annotated-equation" data-equation-instance="${serial}" data-term-connections="${e(JSON.stringify(connections))}" contenteditable="false" style="position:relative;width:${n.width}mm;max-width:100%;margin:${n.margin??2}mm ${n.align==='left'?'auto '+(n.margin??2)+'mm 0':n.align==='right'?'0 '+(n.margin??2)+'mm auto':'auto'};padding-top:${n.arrowSpace??(connections.length?Math.max(...connections.map(c=>c.height)):0)}mm;break-inside:avoid">${labels('above')}<div data-equation-formula style="text-align:${n.align??'center'};${n.fontSize===null?'':`font-size:${n.fontSize}pt;`}line-height:1.5;white-space:nowrap">${math(latex,false,ids)}</div>${labels('below')}${missing?'<output data-equation-warning style="display:block;color:#9a3412">Annotation target missing. Select the annotation and attach it to a term.</output>':''}</figure>`;
}
// Keep labels over their terms where possible, separating neighbouring labels.
export function placeEquationLabels(labels,width,gap=8){
 const sorted=labels.map((label,index)=>({...label,index})).sort((a,b)=>a.center-b.center),result=[];
 let edge=0;for(const label of sorted){label.left=Math.max(edge,Math.min(width-label.width,label.center-label.width/2));edge=label.left+label.width+gap;}
 let right=width;for(const label of sorted.reverse()){label.left=Math.min(label.left,right-label.width);right=label.left-gap;result[label.index]=Math.max(0,label.left);}
 return result;
}
export function mountEquationAnnotations(root,options={}) {
 let frame,disposed=false;const ns='http://www.w3.org/2000/svg';
 const draw=()=>{frame=null;if(disposed)return;
  for(const figure of root.querySelectorAll('[data-type="annotated-equation"]')){
   figure.querySelector(':scope > [data-equation-arrows]')?.remove();
   const outer=figure.getBoundingClientRect(),width=figure.clientWidth,scale=outer.width/width;if(!width||!scale)continue;
   for(const row of figure.querySelectorAll('[data-equation-label-row]')){
    const labels=[...row.querySelectorAll('[data-equation-label]')];
    labels.forEach(label=>label.style.maxWidth=Math.max(1,(width-8*(labels.length-1))/labels.length)+'px');
    const measured=labels.map(label=>{const target=figure.querySelector('[id="ae-'+figure.dataset.equationInstance+'-'+label.dataset.targetIndex+'"]'),r=target?.getBoundingClientRect();return {label,width:label.getBoundingClientRect().width/scale,center:r?(r.left+r.width/2-outer.left)/scale:width/2};});
    const positions=placeEquationLabels(measured,width);
    measured.forEach((m,i)=>m.label.style.left=positions[i]+'px');
    row.style.height=Math.max(0,...labels.map(label=>label.getBoundingClientRect().height/scale))+'px';
   }
   const svg=document.createElementNS(ns,'svg');svg.dataset.equationArrows='';svg.setAttribute('aria-hidden','true');svg.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible';
   for(const label of figure.querySelectorAll('[data-equation-label]')){
    const target=figure.querySelector('[id="ae-'+figure.dataset.equationInstance+'-'+label.dataset.targetIndex+'"]');if(!target)continue;
    const r=target.getBoundingClientRect(),l=label.getBoundingClientRect(),above=label.dataset.side==='above',decoration=label.dataset.decoration;
    const x=(r.left+r.width/2-outer.left)/scale,y=(above?r.top-2:r.bottom+2)-outer.top;
    const sx=(l.left+l.width/2-outer.left)/scale,sy=((above?l.bottom:l.top)-outer.top)/scale,ey=y/scale;
    const shape=document.createElementNS(ns,'path');const colour=getComputedStyle(label).color;
    if(decoration==='arrow'){const dx=x-sx,dy=ey-sy,length=Math.hypot(dx,dy)||1,ux=dx/length,uy=dy/length,bx=x-ux*5,by=ey-uy*5;shape.setAttribute('d',`M${sx},${sy} L${x},${ey} M${bx-uy*2.3},${by+ux*2.3} L${x},${ey} L${bx+uy*2.3},${by-ux*2.3}`);}
    else if(decoration==='bracket'){const left=(r.left-outer.left)/scale-2,right=(r.right-outer.left)/scale+2,depth=above?-4:4;shape.setAttribute('d',`M${left},${ey} v${depth} H${right} v${-depth} M${x},${ey+depth} L${sx},${sy}`);}
    else if(decoration==='highlight'){shape.setAttribute('d',`M${(r.left-outer.left)/scale-2},${ey} H${(r.right-outer.left)/scale+2}`);shape.setAttribute('stroke-width','3');}
    else continue;
    shape.setAttribute('stroke',colour);shape.setAttribute('fill','none');if(!shape.hasAttribute('stroke-width'))shape.setAttribute('stroke-width','1');shape.setAttribute('stroke-linecap','round');svg.append(shape);
   }
   for(const c of JSON.parse(figure.dataset.termConnections||'[]')){
    const term=index=>figure.querySelector('[id="ae-'+figure.dataset.equationInstance+'-'+index+'"]');
    const from=term(c.from),to=term(c.to);if(!from||!to)continue;
    const f=from.getBoundingClientRect(),t=to.getBoundingClientRect();
    const sx=(f.left+f.width/2-outer.left)/scale,sy=(f.top-outer.top)/scale;
    const ex=(t.left+t.width/2-outer.left)/scale,ey=(t.top-outer.top)/scale-1;
    const top=Math.min(sy,ey)-c.height*96/25.4;
    const path=document.createElementNS(ns,'path');
    path.setAttribute('d',`M${sx},${sy} C${sx},${top} ${ex},${top} ${ex},${ey} M${ex-2.5},${ey-4} L${ex},${ey} L${ex+2.5},${ey-4}`);
    path.setAttribute('stroke',c.colour);path.setAttribute('stroke-width','1');path.setAttribute('fill','none');svg.append(path);
   }
   figure.append(svg);
  }
 };
 const update=()=>{if(!frame&&!disposed)frame=requestAnimationFrame(draw);};
 const observer=new ResizeObserver(update);observer.observe(root);
 const mutations=new MutationObserver(records=>{if(records.some(r=>![...r.addedNodes,...r.removedNodes].every(n=>n.nodeType===1&&n.hasAttribute?.('data-equation-arrows')))){for(const f of root.querySelectorAll('[data-type="annotated-equation"]'))observer.observe(f);update();}});mutations.observe(root,{childList:true,subtree:true});
 document.fonts?.ready.then(update);document.fonts?.addEventListener('loadingdone',update);update();
 return {update,destroy(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();mutations.disconnect();document.fonts?.removeEventListener('loadingdone',update);}};
}
