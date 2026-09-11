import {BOOKLET_HOUSE_STYLE} from '../../public/libs/maths-editor/house-style.mjs';
export function graphPageScale(svg) {
  const article=svg.closest('.booklet-page');
  return article ? article.getBoundingClientRect().width/((article.closest('.flow')?180:210)*96/25.4) : 1;
}

// Wrap the complete TeX node, including fraction rules and scripts. Scaling
// individual SVG text runs would detach scripts and distort mathematical layout.
export function prepareDiagramTypography(code) {
  if(!/\\begin\{tikzpicture\}/.test(code))return code;
  const tickTarget=/"tickTargetPt"\s*:\s*8\b/.test(code)?8:BOOKLET_HOUSE_STYLE.graphs.tickPt;
  return String.raw`% mathsmap complete-label typography v1
\makeatletter
\tikzset{execute at begin node={\special{dvisvgm:raw <g data-diagram-label="1" data-label-font="\f@size" data-label-anchor="\tikz@anchor" data-tick-target="${tickTarget}">}},execute at end node={\special{dvisvgm:raw </g>}}}
\makeatother
`+code;
}

export function calibrateDiagramTypography(root) {
  for(const group of root.querySelectorAll('g[data-diagram-label="1"]')) {
    const svg=group.ownerSVGElement, font=Number(group.dataset.labelFont);
    if(!font||!group.querySelector('text'))continue;
    // Always measure the original group. Repeated resizing and cached/reopened
    // SVGs must never multiply a previous correction.
    group.removeAttribute('transform');
    const matrix=group.getScreenCTM(),pageScale=graphPageScale(svg);
    if(!matrix||!(pageScale>0))continue;
    const tick=!!group.querySelector('[data-graph-text="tick"]');
    const target=tick?Number(group.dataset.tickTarget):BOOKLET_HOUSE_STYLE.diagrams.labelPt;
    const current=font*Math.hypot(matrix.c,matrix.d)*72/96/pageScale;
    if(!(current>0))continue;
    const factor=target/current,box=group.getBBox(),anchor=group.dataset.labelAnchor??'center';
    const x=box.x+box.width*(/west/.test(anchor)?0:/east/.test(anchor)?1:.5);
    const y=/base|mid/.test(anchor)?(group.querySelector('text').y.baseVal[0]?.value??box.y+box.height/2):box.y+box.height*(/north/.test(anchor)?0:/south/.test(anchor)?1:.5);
    group.setAttribute('transform',`translate(${x} ${y}) scale(${factor}) translate(${-x} ${-y})`);
    group.dataset.labelTargetPt=String(target);
  }
}

export function measureDiagramLabels(svg,pageScale=graphPageScale(svg)) {
  return [...svg.querySelectorAll('g[data-diagram-label="1"]')].filter(g=>g.querySelector('text')).map(group=>{
    const m=group.getScreenCTM(),tick=!!group.querySelector('[data-graph-text="tick"]');
    return {pt:m?Number(group.dataset.labelFont)*Math.hypot(m.c,m.d)*72/96/pageScale:0,tick,targetPt:tick?Number(group.dataset.tickTarget):BOOKLET_HOUSE_STYLE.diagrams.labelPt};
  });
}

// Painted glyph bounds avoid false collisions from Computer Modern's tall em
// boxes. Include fraction rules and transform all four corners for rotated text.
export function inspectDiagramLabelLayout(svg,{strokes=false}={}) {
  const context=document.createElement('canvas').getContext('2d'),scale=graphPageScale(svg);
  const labels=[...svg.querySelectorAll('g[data-diagram-label="1"]')].filter(g=>g.querySelector('text')).map((g,index)=>{
    const rectangles=[];
    for(const node of g.querySelectorAll('text,path,rect')){
      let box;
      if(node.tagName==='text'){
        const css=getComputedStyle(node);context.font=css.fontSize+' '+css.fontFamily;
        const ink=context.measureText(node.textContent),x=node.x.baseVal[0]?.value??0,y=node.y.baseVal[0]?.value??0;
        box={x:x-ink.actualBoundingBoxLeft,y:y-ink.actualBoundingBoxAscent,width:ink.actualBoundingBoxLeft+ink.actualBoundingBoxRight,height:ink.actualBoundingBoxAscent+ink.actualBoundingBoxDescent};
      }else box=node.getBBox();
      const m=node.getScreenCTM();if(!m)continue;
      const points=[[box.x,box.y],[box.x+box.width,box.y],[box.x,box.y+box.height],[box.x+box.width,box.y+box.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(m));
      rectangles.push({box,inverse:m.inverse(),left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))});
    }
    return {index,rectangles,left:Math.min(...rectangles.map(r=>r.left)),right:Math.max(...rectangles.map(r=>r.right)),top:Math.min(...rectangles.map(r=>r.top)),bottom:Math.max(...rectangles.map(r=>r.bottom))};
  });
  const issues=[],bounds=svg.getBoundingClientRect(),tolerance=.5*scale;
  for(const label of labels)if(label.left<bounds.left-tolerance||label.right>bounds.right+tolerance||label.top<bounds.top-tolerance||label.bottom>bounds.bottom+tolerance)issues.push({kind:'diagram-label-clipping',label:label.index});
  for(let a=0;a<labels.length;a++)for(let b=a+1;b<labels.length;b++){
    const x=labels[a],y=labels[b];
    if(x.rectangles.some(r=>y.rectangles.some(s=>Math.min(r.right,s.right)-Math.max(r.left,s.left)>tolerance&&Math.min(r.bottom,s.bottom)-Math.max(r.top,s.top)>tolerance)))issues.push({kind:'diagram-label-overlap',labels:[a,b]});
  }
  if(strokes)for(const path of svg.querySelectorAll('path')){
    if(path.closest('[data-diagram-label],defs,clipPath,marker')||getComputedStyle(path).stroke==='none')continue;
    const m=path.getScreenCTM();if(!m)continue;
    const length=path.getTotalLength(),step=.4*scale/Math.hypot(m.a,m.b),hit=new Set();
    const masks=[...svg.querySelectorAll('path,rect')].filter(mask=>mask!==path&&(path.compareDocumentPosition(mask)&Node.DOCUMENT_POSITION_FOLLOWING)&&['rgb(255, 255, 255)','#fff','white'].includes(getComputedStyle(mask).fill));
    for(let distance=0;distance<=length;distance+=step){
      const point=path.getPointAtLength(distance).matrixTransform(m);
      if(masks.some(mask=>mask.isPointInFill(point.matrixTransform(mask.getScreenCTM().inverse()))))continue;
      for(const label of labels)if(!hit.has(label.index)&&label.rectangles.some(r=>{const p=point.matrixTransform(r.inverse),t=tolerance*Math.hypot(r.inverse.a,r.inverse.b);return p.x>r.box.x+t&&p.x<r.box.x+r.box.width-t&&p.y>r.box.y+t&&p.y<r.box.y+r.box.height-t;})){hit.add(label.index);issues.push({kind:'diagram-label-stroke',label:label.index});}
    }
  }
  return issues;
}
