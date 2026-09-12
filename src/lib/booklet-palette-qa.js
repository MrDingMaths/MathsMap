import {BOOKLET_PALETTE} from '../../public/libs/maths-editor/booklet-palette.mjs';
export function inspectBookletPalette(root){
 const allowed=new Set(Object.values(BOOKLET_PALETTE).map(hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(','))),issues=[],seen=new Set();
 const gradientStops=(el,paint)=>{
  const match=/^url\(\s*["']?#([^"')\s]+)["']?\s*\)$/.exec(paint);
  if(!match||!el.ownerSVGElement)return null;
  const svg=el.ownerSVGElement,visited=new Set();let id=match[1];
  while(id&&!visited.has(id)){
   visited.add(id);const gradient=svg.querySelector('[id="'+CSS.escape(id)+'"]');
   if(!gradient||!['linearGradient','radialGradient'].includes(gradient.localName))return null;
   const stops=[...gradient.children].filter(n=>n.localName==='stop');if(stops.length)return stops;
   const href=gradient.getAttribute('href')??gradient.getAttribute('xlink:href');id=href?.startsWith('#')?href.slice(1):null;
  }
  return null;
 };
 for(const el of [root,...root.querySelectorAll('*')]){
  if(el.closest('img,defs,clipPath,button,input,select,math-field,.katex-mathml,.document-group-tools,.edit-badge,.editor-difficulty,.answer-jump,.diagram-resize-handle,.space-handle,.space-control,.me-toolbar,.me-properties')||!el.getClientRects().length)continue;
  const css=getComputedStyle(el);if(css.visibility==='hidden'||css.display==='none')continue;
  const paints={background:css.backgroundColor};
  for(const [i,paint]of [...css.boxShadow.matchAll(/rgba?\([^)]*\)|color\([^)]*\)/g)].entries())paints['shadow'+i]=paint[0];
  if([...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))paints.text=css.color;
  // SVG groups carry inherited defaults but paint no pixels themselves. Inspect
  // the effective paints on glyphs and shapes after descendants override them.
  if(el instanceof SVGElement&&el.matches('path,line,polyline,polygon,rect,circle,ellipse,use,text,tspan')){paints.fill=css.fill;paints.stroke=css.stroke;}
  for(const side of ['Top','Right','Bottom','Left'])if(css['border'+side+'Style']!=='none'&&parseFloat(css['border'+side+'Width'])>0)paints['border'+side]=css['border'+side+'Color'];
  const effectivePaints=Object.entries(paints).flatMap(([role,paint])=>{
   const stops=gradientStops(el,paint??'');
   return stops?stops.map((stop,i)=>[role+'-stop'+i,getComputedStyle(stop).stopColor]):[[role,paint]];
  });
  for(const [role,paint]of effectivePaints){
   if(!paint||['none','transparent'].includes(paint))continue;
   let rgb=paint.match(/^rgba?\((\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)(?:\s*[,/]\s*([\d.]+))?\)/);
   const srgb=paint.match(/^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/);
   if(srgb)rgb=[paint,...srgb.slice(1,4).map(v=>String(Math.round(Number(v)*255))),srgb[4]];
   const band=el.closest('.section-band:not(.difficulty-heading):not(.exercise-heading)');
   const headerRole=band&&(role==='text'?'white':role==='background'&&el===band?'headerBlue':null);
   if(headerRole){
    const expected=[1,3,5].map(i=>parseInt(BOOKLET_PALETTE[headerRole].slice(i,i+2),16)).join(',');
    if(!rgb||rgb.slice(1,4).join(',')!==expected||(rgb[4]!==undefined&&Number(rgb[4])!==1)){
     issues.push({kind:'booklet-section-header',role,colour:paint,expected:BOOKLET_PALETTE[headerRole]});continue;
    }
   }
   if(rgb&&(Number(rgb[4])===0||allowed.has(rgb.slice(1,4).join(','))))continue;
   const id=el.closest('[data-diagram-id],[data-edit-root],[data-node-id]')?.getAttribute('data-diagram-id')??el.closest('[data-edit-root]')?.dataset.editRoot??el.tagName;
   const key=id+'|'+role+'|'+paint;if(seen.has(key))continue;seen.add(key);issues.push({kind:'booklet-palette',id,role,colour:paint});
  }
 }
 return issues;
}
