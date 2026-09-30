// Whole TeX labels keep their calibrated size even when their ink extends past
// the native SVG viewport. Reserve only that measured vertical extent in flow;
// fitting the drawing again would shrink its geometry and repeat the collision.
export function reserveDiagramLabelSpace(root) {
  const canvas=root.ownerDocument.createElement('canvas'),context=canvas.getContext('2d');
  if(!context)return;
  for(const svg of root.querySelectorAll('.tikz-wrap svg')) {
    const wrapper=svg.closest('.tikz-wrap'),bounds=svg.getBoundingClientRect(),wrapperBounds=wrapper.getBoundingClientRect();
    // Hidden print copies have no measurable layout. Preserve their last valid
    // reservation until the existing print/resize hook can measure them again.
    if(!(bounds.width>0&&bounds.height>0&&wrapperBounds.width>0))continue;
    const style=getComputedStyle(wrapper);
    const borderBoxWidth=parseFloat(style.width)+(style.boxSizing==='border-box'?0:
      ['paddingLeft','paddingRight','borderLeftWidth','borderRightWidth'].reduce((sum,key)=>sum+(parseFloat(style[key])||0),0));
    const pageScale=wrapperBounds.width/borderBoxWidth;
    if(!(pageScale>0&&Number.isFinite(pageScale)))continue;
    let top=bounds.top,bottom=bounds.bottom;
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
      const matrix=shape.getScreenCTM();
      if(!matrix)continue;
      for(const [x,y] of [[box.x,box.y],[box.x+box.width,box.y],[box.x+box.width,box.y+box.height],[box.x,box.y+box.height]]) {
        const point=new DOMPoint(x,y).matrixTransform(matrix);
        top=Math.min(top,point.y);bottom=Math.max(bottom,point.y);
      }
    }
    if(!wrapper.hasAttribute('data-label-space-original-top')) {
      wrapper.dataset.labelSpaceOriginalTop=style.paddingTop;
      wrapper.dataset.labelSpaceOriginalBottom=style.paddingBottom;
    }
    // CSS subpixel rounding must not leave a sliver of measured ink outside.
    const above=Math.ceil(Math.max(0,bounds.top-top)/pageScale*64)/64;
    const below=Math.ceil(Math.max(0,bottom-bounds.bottom)/pageScale*64)/64;
    wrapper.style.paddingTop=((parseFloat(wrapper.dataset.labelSpaceOriginalTop)||0)+above)+'px';
    wrapper.style.paddingBottom=((parseFloat(wrapper.dataset.labelSpaceOriginalBottom)||0)+below)+'px';
    wrapper.dataset.labelSpaceTop=String(above);
    wrapper.dataset.labelSpaceBottom=String(below);
  }
}
