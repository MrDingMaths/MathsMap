// The interactive harness scrolls overflow rather than shrinking calibrated
// labels. A review image must include that whole scroll surface at its fitted
// drawing size. Keep the live layout intact outside the screenshot transaction.
export async function captureTikzCard(card, options) {
  const saved = await card.evaluate(element => {
    const nodes=[element,...element.querySelectorAll('.stage, .stage svg')];
    const styles=nodes.map(node=>node.getAttribute('style'));
    const scroll=[...element.querySelectorAll('.stage')].map(stage=>({left:stage.scrollLeft,top:stage.scrollTop}));
    const drawings=[...element.querySelectorAll('.stage svg')].map(svg=>({
      width:svg.getBoundingClientRect().width,height:svg.getBoundingClientRect().height,
      viewBox:svg.getAttribute('viewBox')
    }));
    let extra=0;
    for(const stage of element.querySelectorAll('.stage')) {
      extra=Math.max(extra,stage.scrollWidth-stage.clientWidth);
      for(const svg of stage.querySelectorAll('svg')) {
        // Fix both natural and constrained sizing before widening its container.
        const width=parseFloat(getComputedStyle(svg).width);
        svg.style.width=width+'px';svg.style.maxWidth=width+'px';
      }
    }
    const originalWidth=element.getBoundingClientRect().width;
    const css=getComputedStyle(element);
    const originalCssWidth=parseFloat(css.width)+(css.boxSizing==='border-box'?0:['paddingLeft','paddingRight','borderLeftWidth','borderRightWidth'].reduce((sum,key)=>sum+(parseFloat(css[key])||0),0));
    if(extra>0) {
      element.style.boxSizing='border-box';element.style.width=(originalCssWidth+extra+1)+'px';
      element.style.minWidth=element.style.width;element.style.maxWidth='none';
      element.style.position='relative';element.style.zIndex='1';
    }
    return {styles,scroll,drawings,originalWidth,originalCssWidth,extra};
  });
  try {
    // Let the existing calibration observer settle at the unchanged SVG size.
    const bounds=await card.evaluate(async(element,saved)=>{
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const stages=[...element.querySelectorAll('.stage')].map(stage=>({
        width:stage.clientWidth,fullInkWidth:stage.scrollWidth,scrollLeft:stage.scrollLeft
      }));
      const drawings=[...element.querySelectorAll('.stage svg')].map(svg=>({
        width:svg.getBoundingClientRect().width,height:svg.getBoundingClientRect().height,
        viewBox:svg.getAttribute('viewBox')
      }));
      if(stages.some(stage=>stage.fullInkWidth>stage.width+1))throw Error('Full TikZ ink does not fit the capture surface');
      if(drawings.some((drawing,i)=>Math.abs(drawing.width-saved.drawings[i].width)>.1||Math.abs(drawing.height-saved.drawings[i].height)>.1||drawing.viewBox!==saved.drawings[i].viewBox))throw Error('TikZ capture changed native fitting');
      return {originalWidth:saved.originalWidth,captureWidth:element.getBoundingClientRect().width,stages,drawings};
    },saved);
    await card.screenshot(options);
    return bounds;
  } finally {
    await card.evaluate(async(element,saved)=>{
      // Screenshot/resize observers can finish cleanup on the next frame.
      // Restore our exact attributes after that work, not midway through it.
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const nodes=[element,...element.querySelectorAll('.stage, .stage svg')];
      nodes.forEach((node,i)=>saved.styles[i]===null?node.removeAttribute('style'):node.setAttribute('style',saved.styles[i]));
      // Expanding a scroll surface clamps its old offset. Restore offsets only
      // after its original layout has been restored, including failure paths.
      void element.offsetWidth;
      [...element.querySelectorAll('.stage')].forEach((stage,i)=>{stage.scrollLeft=saved.scroll[i].left;stage.scrollTop=saved.scroll[i].top;});
    },saved);
    // Finish in a separate browser task after asynchronous layout cleanup.
    // Preserve attribute absence as well as the original declarations.
    await card.evaluate((element,styles)=>{
      [element,...element.querySelectorAll('.stage, .stage svg')].forEach((node,i)=>styles[i]===null?node.removeAttribute('style'):node.setAttribute('style',styles[i]));
    },saved.styles);
  }
}
