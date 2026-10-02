// Local CSS-pixel geometry: independent of the paper's display zoom.
export function tableArrowGeometry(from, to, annotation = {}) {
  // Between-cell instructions follow the cell centres, with room for the values.
  // Existing top/bottom annotations retain their original geometry below.
  if(annotation.side==='middle'){
    const x1=from.left+from.width/2,y1=from.top+from.height/2,x2=to.left+to.width/2,y2=to.top+to.height/2;
    const length=Math.hypot(x2-x1,y2-y1)||1,ux=(x2-x1)/length,uy=(y2-y1)/length;
    const gap=Math.min(length/3,(annotation.distanceMm??2.5)*96/25.4),sx=x1+ux*gap,sy=y1+uy*gap,ex=x2-ux*gap,ey=y2-uy*gap;
    const head=(x,y,dx,dy)=>{const size=Math.min(6,(length-2*gap)*.4),bx=x-dx*size,by=y-dy*size,half=size*.42;return `M ${x} ${y} L ${bx-dy*half} ${by+dx*half} L ${bx+dy*half} ${by-dx*half} Z`;};
    if(typeof annotation.label==='string' && annotation.label.trim() && Math.abs(from.left-to.left)<.01 && Math.abs(from.width-to.width)<.01 && y2>y1){
      const mm=96/25.4,leftRail=Math.abs(from.left)<.01,outward=leftRail?-1:1;
      const inset=.6*mm,reserve=2.8*mm;
      const railX=leftRail?from.left+from.width-inset:from.left+inset;
      const trim=Math.min(length/3,Math.max(0,(annotation.distanceMm??1.5)*mm));
      const railSy=y1+trim,railEy=y2-trim;
      const bend=Math.min(.5*mm,Math.max(0,(annotation.curveMm??.5)*mm));
      const c1=[railX+outward*bend,railSy+(railEy-railSy)/3];
      const c2=[railX+outward*bend,railEy-(railEy-railSy)/3];
      const railHead=(x,y,tx,ty)=>{
        const tangentLength=Math.hypot(tx,ty)||1,dx=tx/tangentLength,dy=ty/tangentLength;
        const size=Math.min(6,(railEy-railSy)*.4),bx=x-dx*size,by=y-dy*size,half=size*.42;
        return `M ${x} ${y} L ${bx-dy*half} ${by+dx*half} L ${bx+dy*half} ${by-dx*half} Z`;
      };
      return {
        path:`M ${railX} ${railSy} C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${railX} ${railEy}`,
        startHead:railHead(railX,railSy,railX-c1[0],railSy-c1[1]),
        endHead:railHead(railX,railEy,railX-c2[0],railEy-c2[1]),
        labelX:leftRail?from.left+(from.width-reserve)/2:from.left+reserve+(from.width-reserve)/2,
        labelY:(railSy+railEy)/2,
        start:[railX,railSy],end:[railX,railEy],controls:[c1,c2],
      };
    }
    return {path:`M ${sx} ${sy} L ${ex} ${ey}`,startHead:head(sx,sy,-ux,-uy),endHead:head(ex,ey,ux,uy),labelX:(sx+ex)/2,labelY:(sy+ey)/2-9,start:[sx,sy],end:[ex,ey],controls:[]};
  }
  const sign = annotation.side === 'top' ? -1 : 1;
  const same = annotation.cellId === annotation.toCellId;
  const center = cell => cell.left + cell.width / 2;
  const startX = center(from) - (same ? from.width * .25 : 0);
  const endX = center(to) + (same ? to.width * .25 : 0);
  const direction = Math.sign(endX - startX) || 1;
  const gap = Math.min(3.5, Math.abs(endX - startX) * .08);
  const sx = startX + direction * gap, ex = endX - direction * gap;
  const distance = annotation.distanceMm == null ? 3 : annotation.distanceMm * 96 / 25.4;
  const sy = (sign < 0 ? from.top : from.bottom) + sign * distance;
  const ey = (sign < 0 ? to.top : to.bottom) + sign * distance;
  const depth = annotation.curveMm == null ? Math.max(10, Math.abs(ex-sx)*.3) : annotation.curveMm * 96 / 25.4;
  const handle = Math.max(4, Math.abs(ex-sx)*.28);
  const c1 = [sx+direction*handle, sy+sign*depth];
  const c2 = [ex-direction*handle, ey+sign*depth];
  const head = (x,y,tx,ty) => {
    const length=Math.hypot(tx,ty)||1, ux=tx/length, uy=ty/length;
    const size=Math.max(5, Math.min(8, Math.abs(ex-sx)*.2));
    const bx=x-ux*size, by=y-uy*size, half=size*.42;
    return `M ${x} ${y} L ${bx-uy*half} ${by+ux*half} L ${bx+uy*half} ${by-ux*half} Z`;
  };
  return {
    path:`M ${sx} ${sy} C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${ex} ${ey}`,
    startHead:head(sx,sy,sx-c1[0],sy-c1[1]), endHead:head(ex,ey,ex-c2[0],ey-c2[1]),
    labelX:(sx+ex)/2, labelY:(sy+ey)/2+sign*(depth*.75+12),
    start:[sx,sy], end:[ex,ey], controls:[c1,c2],
  };
}

export function tableCircleGeometry(cell, annotation = {}) {
  return {
    rx: annotation.widthMm == null ? Math.min(cell.width * .38, 12) : annotation.widthMm * 96 / 25.4 / 2,
    ry: annotation.heightMm == null ? Math.min(cell.height * .38, 12) : annotation.heightMm * 96 / 25.4 / 2,
  };
}

// Opt-in maths-box anchors follow the actual rendered outline, including the
// MathLive editing surface. Ordinary cell annotations retain their geometry.
export function tableMathBoxElement(cell) {
  const roots=[cell,...[...cell.querySelectorAll('math-field')].map(field=>field.shadowRoot).filter(Boolean)];
  for(const root of roots)for(const box of root.querySelectorAll('.katex-html .fbox,.ML__box')){
    const rect=box.getBoundingClientRect();
    if(rect.width>0&&rect.height>0&&getComputedStyle(box).visibility!=='hidden')return box;
  }
  return null;
}
// Chromium's paged table layout can discard a cell's computed math baseline.
// Preserve the settled content inset only while printing; native/editor alignment
// remains baseline, and unrelated cell styles are never replaced.
function freezeTableBaselinesForPrint(root) {
  const properties=['vertical-align','padding-top'];
  const unrelatedStyles=cell=>JSON.stringify([...cell.style].filter(key=>!properties.includes(key)).sort().map(key=>[key,cell.style.getPropertyValue(key),cell.style.getPropertyPriority(key)]));
  const cells=[...root.querySelectorAll('td[data-id],th[data-id]')]
    .filter(cell=>cell.style.verticalAlign==='baseline'&&cell.firstElementChild);
  const measured=cells.map(cell=>{
    const css=getComputedStyle(cell),child=cell.firstElementChild;
    const bounds=cell.getBoundingClientRect(),content=child.getBoundingClientRect();
    const horizontal=['paddingLeft','paddingRight','borderLeftWidth','borderRightWidth']
      .reduce((sum,key)=>sum+(parseFloat(css[key])||0),0);
    const width=parseFloat(css.width)+(css.boxSizing==='border-box'?0:horizontal);
    const scale=bounds.width/width;
    if(!(scale>0)||!Number.isFinite(scale))return null;
    const collapsed=getComputedStyle(cell.closest('table')).borderCollapse==='collapse';
    const border=(parseFloat(css.borderTopWidth)||0)/(collapsed?2:1);
    const margin=parseFloat(getComputedStyle(child).marginTop)||0;
    const padding=Math.max(0,(content.top-bounds.top)/scale-border-margin);
    return {cell,padding,originalStyle:cell.getAttribute('style'),styles:properties.map(key=>({key,value:cell.style.getPropertyValue(key),priority:cell.style.getPropertyPriority(key)}))};
  }).filter(Boolean);
  for(const entry of measured){const {cell,padding}=entry;cell.style.setProperty('vertical-align','top');cell.style.setProperty('padding-top',padding+'px');entry.frozenUnrelatedStyles=unrelatedStyles(cell);}
  return ()=>{for(const {cell,styles,originalStyle,frozenUnrelatedStyles} of measured){
    if(unrelatedStyles(cell)===frozenUnrelatedStyles){if(originalStyle===null)cell.removeAttribute('style');else cell.setAttribute('style',originalStyle);}
    else for(const {key,value,priority} of styles){if(value)cell.style.setProperty(key,value,priority);else cell.style.removeProperty(key);}
  }};
}
// Measure cell anchors after fonts/layout settle; no guessed absolute page positions.
export function mountTableAnnotations(root, options = {}) {
  let frame,disposed=false,restorePrintBaselines=null;
  const ns='http://www.w3.org/2000/svg';
  const draw=()=>{
    for(const table of root.querySelectorAll('table[data-annotations]')) {
      const wrap=table.parentElement, screen=table.getBoundingClientRect();
      const width=parseFloat(getComputedStyle(table).width)||table.offsetWidth;
      const scale=screen.width/width||1;
      const rect={width,height:screen.height/scale,left:0,top:0};
      wrap.querySelector(':scope > [data-table-annotations]')?.remove();
      if(!rect.width || !rect.height)continue;
      const annotations=JSON.parse(table.dataset.annotations||'[]');const ids=new Set([...table.querySelectorAll('td[data-id],th[data-id]')].map(c=>c.dataset.id));const missing=annotations.filter(a=>!ids.has(a.cellId)||(a.type==='arrow'&&!ids.has(a.toCellId)));let warning=wrap.querySelector('[data-annotation-diagnostics]');if(missing.length){if(!warning){warning=document.createElement('output');warning.dataset.annotationDiagnostics='';warning.contentEditable='false';wrap.append(warning);}const text='Unresolved annotation anchors: '+missing.map(a=>a.id).join(', ');if(warning.textContent!==text)warning.textContent=text;}else warning?.remove();if(!annotations.length)continue;
      const svg=document.createElementNS(ns,'svg'); svg.setAttribute('data-table-annotations','');if(!options?.onselect)svg.setAttribute('aria-hidden','true');svg.setAttribute('contenteditable','false');
      svg.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);
      svg.style.cssText='position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none';wrap.append(svg);
      let group;const add=(tag,attrs)=>{const el=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,String(v));(group??svg).append(el);return el;};
      const elements=new Map([...table.querySelectorAll('td[data-id],th[data-id]')].map(c=>[c.dataset.id,c]));
      const bounds=element=>{const r=element.getBoundingClientRect();return {left:(r.left-screen.left)/scale,top:(r.top-screen.top)/scale,bottom:(r.bottom-screen.top)/scale,width:r.width/scale,height:r.height/scale};};
      const cells=new Map([...elements].map(([id,c])=>[id,bounds(c)]));
      const anchor=(id,kind)=>{const cell=elements.get(id);if(!cell)return null;if(kind!=='math-box')return cells.get(id);const box=tableMathBoxElement(cell);return box?bounds(box):null;};
      for(const a of annotations) {
        group=document.createElementNS(ns,'g');group.dataset.annotationId=a.id;svg.append(group);
        if(options?.onselect){group.setAttribute('role','button');group.setAttribute('tabindex','0');group.setAttribute('aria-label',`Edit ${a.type}: ${a.label||'unlabelled'}`);group.style.pointerEvents='visiblePainted';const select=e=>{e.preventDefault();e.stopPropagation();options.onselect(table.dataset.id,a.id);};group.addEventListener('click',select);group.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key))select(e);});}

        const c=cells.get(a.cellId);if(!c)continue;const x=c.left-rect.left+c.width/2,y=c.top-rect.top+c.height/2;
        const stroke=a.colour, common={fill:'none',stroke,'stroke-width':a.thicknessMm==null?1.7:a.thicknessMm*96/25.4};
        if(a.type==='circle') add('ellipse',{...common,cx:x,cy:y,...tableCircleGeometry(c,a)});
        if(a.type==='box')add('rect',{...common,x:c.left-rect.left+2,y:c.top-rect.top+2,width:c.width-4,height:c.height-4});
        if(a.type==='arrow'){
          const d=cells.get(a.toCellId);if(!d)continue;
          const start=anchor(a.cellId,a.startAnchor),end=anchor(a.toCellId,a.endAnchor);
          if(!start||!end){let output=wrap.querySelector('[data-annotation-diagnostics]');if(!output){output=document.createElement('output');output.dataset.annotationDiagnostics='';output.contentEditable='false';wrap.append(output);}const message='Unresolved maths-box anchor: '+a.id;if(output.textContent!==message)output.textContent=message;continue;}
          const geometry=tableArrowGeometry(start,end,a);
          add('path',{...common,d:geometry.path,'stroke-linecap':'round'});
          if(['end','both'].includes(a.heads??'end'))add('path',{fill:stroke,d:geometry.endHead});
          if(['start','both'].includes(a.heads))add('path',{fill:stroke,d:geometry.startHead});
          if(options?.onselect)add('path',{d:geometry.path,fill:'none',stroke:'transparent','stroke-width':16,'pointer-events':'stroke'});
          const {labelX,labelY}=geometry;
          if(a.labelBox)add('rect',{x:labelX-12,y:labelY-10,width:24,height:22,fill:'white',stroke:'#cccccc','stroke-width':1});
          if(a.label){const text=add('text',{x:labelX,y:labelY+5,'text-anchor':'middle',fill:stroke,'font-size':a.side==='middle'?40/3:14});text.textContent=a.label;}
        }
      }
    }
  };
  const schedule=()=>{if(disposed)return;cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{for(const table of root.querySelectorAll('table'))observer.observe(table);draw();});};
  const observer=new ResizeObserver(schedule);observer.observe(root);
  const mutations=new MutationObserver(records=>{if(records.some(r=>!r.target.closest?.('svg')&&(r.type!=='childList'||[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType!==1||n.tagName?.toLowerCase()!=='svg'))))schedule();});
  mutations.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['style','data-annotations']});
  document.fonts?.ready.then(schedule);schedule();
  const beforePrint=()=>{restorePrintBaselines?.();restorePrintBaselines=freezeTableBaselinesForPrint(root);draw();};
  const afterPrint=()=>{restorePrintBaselines?.();restorePrintBaselines=null;schedule();};
  window.addEventListener('beforeprint',beforePrint);window.addEventListener('afterprint',afterPrint);
  return {update:schedule,destroy(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();mutations.disconnect();window.removeEventListener('beforeprint',beforePrint);window.removeEventListener('afterprint',afterPrint);restorePrintBaselines?.();restorePrintBaselines=null;}};
}
