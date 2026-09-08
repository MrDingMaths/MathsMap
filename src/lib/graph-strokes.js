import {BOOKLET_HOUSE_STYLE} from '../../public/libs/maths-editor/house-style.mjs';

export const GRAPH_STROKES = BOOKLET_HOUSE_STYLE.graphs.strokes;
// Metadata opts a diagram into final-size calibration; unadopted/manual art is untouched.
export const GRAPH_STROKE_MARKER = String.raw`\special{dvisvgm:raw <metadata data-graph-strokes="1"/>}`;
export const graphStrokeOption = role => `line width=${GRAPH_STROKES[role]}pt`;

// The bundled TikZJax driver preserves TeX's numeric stroke widths in SVG units.
export function strokeTargetFromSvg(width) {
  return [...new Set(['plot','axis','tick','majorGrid','minorGrid','guide'].map(role=>GRAPH_STROKES[role]))].find(pt=>Math.abs(width-pt)<0.00003) ?? null;
}
export function strokeWidthForScale(targetPt,svgScale,pageScale=1) {
  if(!(svgScale>0&&pageScale>0))return null;
  return targetPt*96/72*pageScale/svgScale;
}
export function graphPageScale(svg) {
  const article=svg.closest('.booklet-page');
  return article ? article.getBoundingClientRect().width/((article.closest('.flow')?180:210)*96/25.4) : 1;
}
export function calibrateGraphStrokes(root) {
  for(const svg of root.querySelectorAll('svg')) {
    if(!svg.querySelector('[data-graph-strokes="1"]'))continue;
    const pageScale=graphPageScale(svg);
    for(const shape of svg.querySelectorAll('path,line,polyline,polygon,rect,circle,ellipse,use')) {
      if(shape.closest('defs,clipPath,marker'))continue;
      const css=getComputedStyle(shape);
      if(css.stroke==='none')continue;
      const target=Number(shape.dataset.graphStrokePt)||strokeTargetFromSvg(parseFloat(css.strokeWidth));
      if(!target)continue;
      const matrix=shape.getScreenCTM();
      if(!matrix)continue;
      const width=strokeWidthForScale(target,Math.sqrt(Math.abs(matrix.a*matrix.d-matrix.b*matrix.c)),pageScale);
      if(width==null)continue;
      shape.dataset.graphStrokePt=String(target);
      shape.style.strokeWidth=String(width);
    }
  }
}

// Both cached and freshly compiled SVGs pass through this observer. Refit on slot
// changes and print-media layout; never use non-scaling-stroke (it breaks page zoom).
export function watchGraphStrokes(root) {
  let frame=0;
  const update=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{if(!root.isConnected){stop();return;}calibrateGraphStrokes(root);});};
  const print=()=>calibrateGraphStrokes(root);
  const resize=new ResizeObserver(update),mutation=new MutationObserver(update);
  resize.observe(root);mutation.observe(root,{childList:true,subtree:true});
  window.addEventListener('beforeprint',print);window.addEventListener('afterprint',update);
  const stop=()=>{cancelAnimationFrame(frame);resize.disconnect();mutation.disconnect();window.removeEventListener('beforeprint',print);window.removeEventListener('afterprint',update);};
  update();
  return stop;
}
