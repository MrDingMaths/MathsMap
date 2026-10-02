import {inspectBookletPalette} from './booklet-palette-qa.js';
import {calibrateGraphStrokes} from './graph-strokes.js';
import {inspectDiagramColours} from './diagram-colours.js';
import {renderMath} from './render-math.js';
import {inspectShortAnswerColours} from './short-answer-style.js';
import {convexPolygonsOverlap} from './diagram-label-geometry.js';
import {settleBookletFonts} from './booklet-fonts.js';
// Shared browser-side acceptance checks. Preview and export call the same functions.
export async function settleBooklet(root) {
 if(!root)throw Error('Booklet surface is missing');
 const deadline=Date.now()+300000;
 do {
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  if(window.TikZ&&!await window.TikZ.flushPending(root,300000))throw Error('Diagram queue timed out');
  if([...root.querySelectorAll('.tikz-wrap')].every(e=>e.querySelector('svg:not(:has(animate)),.tikz-error')))break;
  await new Promise(r=>setTimeout(r,100));
 }while(Date.now()<deadline);
 await settleBookletFonts(root);
 await Promise.all([...root.querySelectorAll('img')].map(async i=>{
  try{await i.decode();}catch(error){
   if(!root.contains(i))return;
   await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   if(i.complete&&i.naturalWidth>0)return;
   try{await i.decode();}catch{throw Error('Image failed to decode: '+i.currentSrc);}
  }
 }));
 await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 // Reserving label/stroke space can change SVG scale after calibration.
 // Wait for observer callbacks and require a stable calibration/layout pass.
 const diagramState=()=>JSON.stringify([...root.querySelectorAll('svg')].map(svg=>{
  const bounds=svg.getBoundingClientRect(),matrix=svg.getScreenCTM(),wrapper=svg.closest('.tikz-wrap');
  const padding=wrapper?getComputedStyle(wrapper):null;
  return [bounds.width,bounds.height,
   matrix&&[matrix.a,matrix.b,matrix.c,matrix.d,matrix.e,matrix.f],
   padding&&[padding.paddingTop,padding.paddingRight,padding.paddingBottom,padding.paddingLeft],
   [...svg.querySelectorAll('g[data-diagram-label="1"],[data-diagram-label-background="1"],[data-graph-stroke-pt]')].map(n=>[n.getAttribute('transform'),n.style.strokeWidth])];
 }));
 let diagramsSettled=false;
 for(let pass=0;pass<12;pass++){
  const before=diagramState();
  calibrateGraphStrokes(root);
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  if(diagramState()===before){diagramsSettled=true;break;}
 }
 if(!diagramsSettled)throw Error('Diagram typography and padding did not stabilize');
 if(root.querySelector('.tikz-error,.katex-error'))throw Error('Mathematics failed to render');
 for(const latex of new Set([...root.querySelectorAll('.katex annotation[encoding="application/x-tex"]')].map(n=>n.textContent)))if(renderMath(`$${latex}$`).includes('katex-error'))throw Error('Invalid mathematical notation: '+latex);
 if([...root.querySelectorAll('.tikz-wrap')].some(e=>!e.querySelector('svg:not(:has(animate))')))throw Error('A diagram has not rendered');
}
export function clozeResponseRequiredMm(expected) {
 const compact=expected.replace(/\\(?:color|textcolor)\s*(?:\[[^\]]*\]\s*)?\{[^{}]*\}/g,'').replace(/\\(?:d?frac|tfrac)\{([^{}]+)\}\{([^{}]+)\}/g,'$1/$2').replace(/\\[a-z]+/gi,'').replace(/[$ {}]/g,'');
 return Math.ceil(compact.length*2.2+6);
}
export function inspectBookletPage(article,{footerClearanceMm=3,style=false}={}) {
 const flow=!!article.closest('.flow'),issues=[],r=article.getBoundingClientRect(),scale=r.width/((flow?180:210)*96/25.4),mm=96/25.4*scale,main=article.querySelector('main'),footer=article.querySelector('footer');
 if(!main||!footer)return {page:article.dataset.pageNumber,issues:[{kind:'missing-page-structure'}],graphs:[]};
 const f=footer.getBoundingClientRect(),boundary=flow?{left:r.left,right:r.right,top:r.top,bottom:Infinity}:{left:r.left+10*mm,right:r.right-10*mm,top:r.top,bottom:f.top-footerClearanceMm*mm};
 const id=n=>n.dataset.id??n.dataset.arrangementId??n.dataset.diagramId??n.dataset.questionId??n.className?.baseVal??String(n.className);
 const visible=n=>{const s=getComputedStyle(n);return s.display!=='none'&&s.visibility!=='hidden'&&n.getBoundingClientRect().width>0&&n.getBoundingClientRect().height>0;};
 const add=(kind,n,detail={})=>issues.push({kind,id:id(n),...detail});
 for(const n of main.querySelectorAll('.text-line'))if(visible(n)&&!n.querySelector('.katex')&&/\\(?:begin\{(?:align\*?|aligned|cases)\}|frac\{)/.test(n.textContent))add('unrendered-math',n,{targetId:n.closest('[data-node-id]')?.dataset.nodeId});
 for(const n of main.querySelectorAll('.question-grid .question-node .katex-html > .base,.arr-item .katex-html > .base'))if(visible(n)){
  const owner=n.closest('.question-node,.arr-item'),bounds=owner.getBoundingClientRect(),math=n.getBoundingClientRect();
  if(math.left<bounds.left-.5||math.right>bounds.right+.5)add('question-column-overflow',n,{targetId:owner.dataset.nodeId??owner.dataset.contentOwner,excessMm:Math.max(bounds.left-math.left,math.right-bounds.right)/mm});
 }
 const elements=[...main.querySelectorAll(':scope > *,p,table,img,.tikz-wrap,.arr-group,.answer-space,.arr-space,.space-edit,.representation,[data-type="annotated-equation"],[data-table-annotations]')].filter(visible);
 for(const n of elements){let b=n.getBoundingClientRect();
  // A source-image crop deliberately places the original bitmap outside its frame.
  // Validate its visible crop, while retaining full bounds for text/writing spaces.
  if(n.tagName==='IMG'&&getComputedStyle(n).position==='absolute')for(let a=n.parentElement;a&&a!==main;a=a.parentElement)if(getComputedStyle(a).overflow==='hidden'){const c=a.getBoundingClientRect();b={left:Math.max(b.left,c.left),right:Math.min(b.right,c.right),top:Math.max(b.top,c.top),bottom:Math.min(b.bottom,c.bottom)};}
  if(b.bottom>boundary.bottom+.5)add('footer-overflow',n,{excessMm:(b.bottom-boundary.bottom)/mm});if(b.left<boundary.left-.5||b.right>boundary.right+.5)add('horizontal-overflow',n,{leftMm:(b.left-r.left)/mm,rightMm:(b.right-r.left)/mm});
  if(!n.matches('.tikz-wrap,[data-table-annotations]')&&n.scrollWidth>n.clientWidth+2&&getComputedStyle(n).overflowX!=='visible')add('clipped-content',n);
 }
 if(flow)for(const n of main.querySelectorAll('.question-node,.me-layout,tr,.tikz-wrap')){if(visible(n)&&getComputedStyle(n).breakInside==='avoid'&&n.getBoundingClientRect().height>272*mm)add('unbreakable-flow-overflow',n);}
 // Structural siblings only: labels, overlays and inline mathematics intentionally overlap.
 for(const group of main.querySelectorAll('.arr-group,.question-grid,.representations,.atom-body,.answer-row-grid')){
  const children=[...group.children].filter(n=>visible(n)&&getComputedStyle(n).position!=='absolute'&&!n.matches('.label-item,.column-handle,button,.hidden-space'));
  for(let i=0;i<children.length;i++)for(let j=i+1;j<children.length;j++){const a=children[i].getBoundingClientRect(),b=children[j].getBoundingClientRect();if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>mm&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>mm)add('sibling-overlap',children[i],{other:id(children[j])});}
 }
 for(const cell of main.querySelectorAll('.answer-row-grid .answer-fragment')){
  const bounds=cell.getBoundingClientRect();
  for(const n of cell.querySelectorAll('.katex-html > .base'))if(visible(n)){
   const math=n.getBoundingClientRect();if(math.left<bounds.left-.5||math.right>bounds.right+.5)add('answer-cell-overflow',n,{targetId:n.closest('[data-node-id]')?.dataset.nodeId});
  }
 }
 if(style)for(const n of main.querySelectorAll('.short-answer-key .answer-item'))if(parseFloat(getComputedStyle(n).borderBottomWidth)>0)add('short-answer-divider',n);
 const graphs=[];
 for(const wrap of main.querySelectorAll('.tikz-wrap')){if(!visible(wrap))continue;const svg=wrap.querySelector('svg');if(!svg){add('missing-diagram',wrap);continue;}
  const labelGroups=[...svg.querySelectorAll('g[data-diagram-label="1"]')].filter(g=>g.querySelector('text'));
  const textSizes=labelGroups.length?labelGroups.map(g=>{const m=g.getScreenCTM(),tick=!!g.querySelector('[data-graph-text="tick"]'),value=!!g.closest('[data-graph-text="value"]'),requested=Number(g.querySelector('[data-diagram-label-target-pt]')?.dataset.diagramLabelTargetPt);return {localPx:10,pt:Number(g.dataset.labelFont)*Math.hypot(m.c,m.d)/scale*72/96,tick,value,target:requested>=10&&requested<=16?requested:tick||value?Number(g.dataset.tickTarget):10};}):[...svg.querySelectorAll('text')].map(t=>{const m=t.getScreenCTM(),localPx=parseFloat(getComputedStyle(t).fontSize),tick=!!t.closest('[data-graph-text="tick"]'),value=!!t.closest('[data-graph-text="value"]');return {localPx,pt:m?localPx*Math.hypot(m.c,m.d)/scale*72/96:0,tick,value,target:tick||value?8.5:10};}).filter(n=>n.pt>0);
  // TeX math scripts use smaller design sizes; compare the surrounding base text.
  const baseLocalPx=Math.max(...textSizes.map(t=>t.localPx)),baseText=textSizes.filter(t=>t.localPx>=baseLocalPx*.8);
  const fonts=textSizes.map(t=>t.pt),tagged=!!svg.querySelector('[data-graph-text="tick"]');
  const minimumPt=fonts.length?Math.min(...fonts):null,diagramId=wrap.closest('[data-diagram-id]')?.dataset.diagramId;
  const tickMinimumPt=Math.min(...baseText.filter(t=>t.tick).map(t=>t.pt)),labelMinimumPt=Math.min(...baseText.filter(t=>!t.tick).map(t=>t.pt));
  graphs.push({id:diagramId,minimumPt,tickMinimumPt:Number.isFinite(tickMinimumPt)?tickMinimumPt:null,labelMinimumPt:Number.isFinite(labelMinimumPt)?labelMinimumPt:null,widthMm:wrap.getBoundingClientRect().width/mm});
  if(style&&baseText.some(t=>t.pt<(t.target??(t.tick||t.value?8.5:10))-.1))add('small-graph-label',wrap,{diagramId,minimumPt,tickMinimumPt,labelMinimumPt});
  if(style&&baseText.some(t=>t.pt>(t.target??(t.tick||t.value?8.5:10))+.1))add('large-graph-label',wrap,{diagramId,tickMaximumPt:Math.max(...textSizes.filter(t=>t.tick).map(t=>t.pt)),labelMaximumPt:Math.max(...textSizes.filter(t=>!t.tick).map(t=>t.pt))});
  // Use painted glyph bounds: Computer Modern's minus has a tall, mostly empty em box.
  if(style&&tagged){
   const context=document.createElement('canvas').getContext('2d');
   const ticks=[...svg.querySelectorAll('[data-graph-text="tick"]')].map(group=>{
    return [...group.querySelectorAll('text')].map(t=>{
     const css=getComputedStyle(t);context.font=css.fontSize+' '+css.fontFamily;
     const ink=context.measureText(t.textContent),matrix=t.getScreenCTM(),x=t.x.baseVal[0]?.value??0,y=t.y.baseVal[0]?.value??0;
     const left=x-ink.actualBoundingBoxLeft,right=x+ink.actualBoundingBoxRight,top=y-ink.actualBoundingBoxAscent,bottom=y+ink.actualBoundingBoxDescent;
     if(right<=left||bottom<=top)return [];
     return [[left,top],[right,top],[right,bottom],[left,bottom]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(matrix));
    }).filter(polygon=>polygon.length);
   });
   let collisions=0;
   for(let a=0;a<ticks.length;a++)for(let b=a+1;b<ticks.length;b++){
    const x=ticks[a],y=ticks[b];
    if(x.some(polygon=>y.some(other=>convexPolygonsOverlap(polygon,other,.5*scale))))collisions++;
   }
   if(collisions)add('graph-tick-overlap',wrap,{diagramId,collisions});
  }
  if(svg.querySelector('[data-graph-strokes="1"]')){
   let measured=0;
   for(const shape of svg.querySelectorAll('path,line,polyline,polygon,rect,circle,ellipse,use')){
    if(shape.closest('defs,clipPath,marker')||getComputedStyle(shape).stroke==='none')continue;
    const targetPt=Number(shape.dataset.graphStrokePt);
    if(!targetPt){add('unclassified-graph-stroke',wrap,{diagramId});continue;}
    const m=shape.getScreenCTM();
    if(!m)continue;
    const actualPt=parseFloat(getComputedStyle(shape).strokeWidth)*Math.sqrt(Math.abs(m.a*m.d-m.b*m.c))/scale*72/96;
    measured++;
    if(Math.abs(actualPt-targetPt)>.05)add('graph-stroke-weight',wrap,{diagramId,targetPt,actualPt});
   }
   graphs[graphs.length-1].strokeCount=measured;
  }
  if(style){
   const diagramColours=inspectDiagramColours(svg);
   if(diagramColours.length)add('diagram-palette',wrap,{diagramId,colours:diagramColours});
   for(let a=wrap;a&&a!==article;a=a.parentElement)if(/grayscale\(/.test(getComputedStyle(a).filter)){add('graph-palette-filter',wrap,{diagramId});break;}
   const bad=inspectDiagramColours(svg,{graphStrokes:true});
   if(bad.length&&!svg.querySelector('[data-diagram-kind="geometry"]'))add('graph-palette',wrap,{diagramId,colours:bad});
  }
 }
 if(style){
  for(const c of main.querySelectorAll('[data-cloze]')){if(!visible(c))continue;const expected=c.dataset.expectedResponse??c.dataset.cloze;if(!expected?.trim()||c.dataset.reviewStatus==='needs-review')add('unknown-cloze-response',c);const available=c.getBoundingClientRect().width/mm*(Number(c.dataset.lines)||1);const requiredMm=clozeResponseRequiredMm(expected);if(available+.5<Math.max(8,requiredMm))add('short-cloze',c,{requiredMm,availableMm:available});}
  for(const table of main.querySelectorAll('table'))for(const row of table.rows){
   const c=row.cells[0];if(!c||c.colSpan>1)continue;
   const words=/\b[A-Za-z]{2,}\s+[A-Za-z]{2,}\b/;
   const explicit=c.matches('[scope="row"],[role="rowheader"],[data-table-label]');
   // Sentence descriptions in matching/answer tables may wrap. Only infer a
   // compact row label from non-sentence text; explicit row headers still win.
   const sentence=/[.!?][\s\u201d\u2019"')\]]*$/.test(c.innerText.trim());
   const inferred=row.cells.length>1&&words.test(c.innerText)&&!sentence&&c.innerText.trim().length<=64&&!c.querySelector('.katex,math,[data-latex]')&&[...row.cells].slice(1).every(cell=>!words.test(cell.innerText));
   if(!explicit&&!inferred)continue;
   const old=c.style.whiteSpace,h=c.getBoundingClientRect().height;c.style.whiteSpace='nowrap';const single=c.getBoundingClientRect().height,overflow=c.scrollWidth>c.clientWidth+1;c.style.whiteSpace=old;if(h>single+1||overflow)add('wrapped-table-label',c);
  }
 }
 return {page:article.dataset.pageNumber,issues,graphs,footerClearanceMm:flow?null:(f.top-Math.max(...elements.map(n=>n.getBoundingClientRect().bottom)))/mm};
}
export function inspectBooklet(root,options={}) {return [...root.querySelectorAll('.booklet-page,.booklet-cover')].map(p=>{const report=p.matches('.booklet-cover')?{page:'cover',issues:[],graphs:[]}:inspectBookletPage(p,options),answers=inspectShortAnswerColours(p);report.issues.push(...answers.issues,...inspectBookletPalette(p));report.shortAnswerRuns=answers.runs;return report;});}
export function assertBookletFits(report) {const failed=report.filter(p=>p.issues.length);if(failed.length)throw Error('Booklet QA failed: '+JSON.stringify(failed.map(p=>({page:p.page,issues:p.issues}))));return report;}
