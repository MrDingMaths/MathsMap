// Whole TeX labels and ordinary strokes can paint past the native SVG viewport.
// Reserve only their measured ink and raster footprint in the wrapper's flow;
// fitting the drawing again would shrink its geometry and repeat the collision.
export function reserveDiagramLabelSpace(root) {
  const canvas=root.ownerDocument.createElement('canvas'),context=canvas.getContext('2d');
  if(!context)return;
  for(const svg of root.querySelectorAll('.tikz-wrap svg')) {
    const wrapper=svg.closest('.tikz-wrap'),screenBounds=svg.getBoundingClientRect(),wrapperBounds=wrapper.getBoundingClientRect();
    // Hidden print copies have no measurable layout. Preserve their last valid
    // reservation until the existing print/resize hook can measure them again.
    if(!(screenBounds.width>0&&screenBounds.height>0&&wrapperBounds.width>0))continue;
    const style=getComputedStyle(wrapper);
    const borderBoxWidth=parseFloat(style.width)+(style.boxSizing==='border-box'?0:
      ['paddingLeft','paddingRight','borderLeftWidth','borderRightWidth'].reduce((sum,key)=>sum+(parseFloat(style[key])||0),0));
    const pageScale=wrapperBounds.width/borderBoxWidth;
    if(!(pageScale>0&&Number.isFinite(pageScale)))continue;
    // getCTM measures in the SVG viewport, without the document translation.
    // At large document coordinates, subtracting a screen rectangle from a
    // screen-transformed point loses local precision and can alternate padding.
    // Computed dimensions are unzoomed, but the browser quantizes layout after
    // effective CSS zoom. Recover that grid without changing native sizing or
    // subtracting document-position-dependent screen coordinates.
    const svgStyle=getComputedStyle(svg);
    let effectiveZoom=1;
    for(let node=svg;node;node=node.parentElement) {
      const zoom=(node===svg?svgStyle:getComputedStyle(node)).zoom;
      const factor=parseFloat(zoom)/(String(zoom).endsWith('%')?100:1);
      if(factor>0&&Number.isFinite(factor))effectiveZoom*=factor;
    }
    const layoutUnits=64*effectiveZoom;
    if(!(layoutUnits>0&&Number.isFinite(layoutUnits)))continue;
    const width=Math.round(parseFloat(svgStyle.width)*layoutUnits)/layoutUnits,height=Math.round(parseFloat(svgStyle.height)*layoutUnits)/layoutUnits;
    if(!(width>0&&height>0&&Number.isFinite(width)&&Number.isFinite(height)))continue;
    const bounds={top:0,bottom:height,left:0,right:width};
    let top=bounds.top,bottom=bounds.bottom,left=bounds.left,right=bounds.right;
    // The offscreen pagination surface is hidden to the user but still has real
    // layout. Its measured ink must match the later visible print surface.
    const measuring=!!wrapper.closest('.flow-measure');
    const shapes=svg.querySelectorAll('g[data-diagram-label="1"] text,g[data-diagram-label="1"] path,g[data-diagram-label="1"] rect,[data-diagram-label-background="1"]');
    for(const shape of shapes) {
      if(shape.closest('defs,clipPath,marker'))continue;
      const paint=getComputedStyle(shape);
      if(paint.display==='none'||(!measuring&&paint.visibility==='hidden')||Number(paint.opacity)===0)continue;
      if(paint.fill==='none'&&paint.stroke==='none')continue;
      let box;
      if(shape.tagName==='text') {
        context.font=`${paint.fontStyle} ${paint.fontWeight} ${paint.fontSize} ${paint.fontFamily}`;
        const ink=context.measureText(shape.textContent),x=shape.x.baseVal[0]?.value??0,y=shape.y.baseVal[0]?.value??0;
        box={x:x-ink.actualBoundingBoxLeft,y:y-ink.actualBoundingBoxAscent,
          width:ink.actualBoundingBoxLeft+ink.actualBoundingBoxRight,height:ink.actualBoundingBoxAscent+ink.actualBoundingBoxDescent};
      }else box=shape.getBBox();
      if(!(box.width>0&&box.height>0))continue;
      const matrix=shape.getCTM();
      if(!matrix)continue;
      for(const [x,y] of [[box.x,box.y],[box.x+box.width,box.y],[box.x+box.width,box.y+box.height],[box.x,box.y+box.height]]) {
        const point=new DOMPoint(x,y).matrixTransform(matrix);
        top=Math.min(top,point.y);bottom=Math.max(bottom,point.y);
        left=Math.min(left,point.x);right=Math.max(right,point.x);
      }
    }
    // PGF can bound an unlabelled polygon by its path rather than its outer
    // stroke. SVG overflow visible alone is insufficient when the wrapper has
    // overflow-x:auto (which also computes overflow-y:auto). Preserve that
    // scroll behavior while reserving the measured fraction of painted ink.
    for(const shape of svg.querySelectorAll('path,line,polyline,polygon,rect,circle,ellipse,use')) {
      if(shape.closest('defs,clipPath,marker,g[data-diagram-label="1"],[data-diagram-label-background="1"]'))continue;
      const paint=getComputedStyle(shape);
      if(paint.stroke==='none'||paint.display==='none'||(!measuring&&paint.visibility==='hidden')||Number(paint.opacity)===0)continue;
      // A source clip/mask defines intentional visible ink. Do not reserve the
      // unclipped geometry outside it or alter any of its SVG references.
      let clipped=false;
      for(let node=shape;node&&node!==svg;node=node.parentElement) {
        const css=getComputedStyle(node);
        if(css.clipPath!=='none'||css.maskImage!=='none'){clipped=true;break;}
      }
      if(clipped)continue;
      const box=shape.getBBox(),matrix=shape.getCTM(),stroke=parseFloat(paint.strokeWidth);
      if(!matrix||!(stroke>0)||![box.x,box.y,box.width,box.height,matrix.b,matrix.d].every(Number.isFinite))continue;
      const half=stroke*Math.hypot(matrix.b,matrix.d)/2,halfX=stroke*Math.hypot(matrix.a,matrix.c)/2;
      // Keep one actual device-pixel sampling footprint around stroke ink,
      // expressed in the same local CSS pixels as the geometry. Its size must
      // still follow page zoom and device scale, rather than document position.
      const raster=1/((window.devicePixelRatio||1)*pageScale);
      for(const [x,y] of [[box.x,box.y],[box.x+box.width,box.y],[box.x+box.width,box.y+box.height],[box.x,box.y+box.height]]) {
        const point=new DOMPoint(x,y).matrixTransform(matrix);
        top=Math.min(top,point.y-half-raster);bottom=Math.max(bottom,point.y+half+raster);
        left=Math.min(left,point.x-halfX-raster);right=Math.max(right,point.x+halfX+raster);
      }
    }
    if(!wrapper.hasAttribute('data-label-space-original-top')) {
      wrapper.dataset.labelSpaceOriginalTop=style.paddingTop;
      wrapper.dataset.labelSpaceOriginalBottom=style.paddingBottom;
    }
    if(!wrapper.hasAttribute('data-label-space-original-left')) {
      wrapper.dataset.labelSpaceOriginalLeft=style.paddingLeft;
      wrapper.dataset.labelSpaceOriginalRight=style.paddingRight;
    }
    // CSS subpixel rounding must not leave a sliver of measured ink outside.
    const above=Math.ceil(Math.max(0,bounds.top-top)*64)/64;
    const below=Math.ceil(Math.max(0,bottom-bounds.bottom)*64)/64;
    wrapper.style.paddingTop=((parseFloat(wrapper.dataset.labelSpaceOriginalTop)||0)+above)+'px';
    wrapper.style.paddingBottom=((parseFloat(wrapper.dataset.labelSpaceOriginalBottom)||0)+below)+'px';
    wrapper.dataset.labelSpaceTop=String(above);
    wrapper.dataset.labelSpaceBottom=String(below);
    const before=Math.ceil(Math.max(0,bounds.left-left)*64)/64;
    const after=Math.ceil(Math.max(0,right-bounds.right)*64)/64;
    wrapper.style.paddingLeft=((parseFloat(wrapper.dataset.labelSpaceOriginalLeft)||0)+before)+'px';
    wrapper.style.paddingRight=((parseFloat(wrapper.dataset.labelSpaceOriginalRight)||0)+after)+'px';
    wrapper.dataset.strokeSpaceLeft=String(before);
    wrapper.dataset.strokeSpaceRight=String(after);
  }
}
