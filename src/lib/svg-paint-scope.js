let nextScope=0;
const scoped=new WeakSet();
// Inline SVG fragment references resolve in the document. Measurement, preview,
// print and editor copies therefore need distinct paint-server identifiers.
export function scopeSvgPaintReferences(svg){
 if(scoped.has(svg)||!svg.querySelector('linearGradient,radialGradient,clipPath,mask,pattern,filter'))return;
 const prefix='mm-svg-paint-'+(++nextScope)+'-',ids=new Map();
 for(const node of svg.querySelectorAll('[id]'))ids.set(node.id,prefix+node.id.replace(/^mm-svg-paint-\d+-/,''));
 for(const node of [svg,...svg.querySelectorAll('*')])for(const attr of [...node.attributes]){
  let value=attr.value;
  if(attr.name==='id'&&ids.has(value))value=ids.get(value);
  else if((attr.localName==='href'||attr.name==='href')&&value.startsWith('#')&&ids.has(value.slice(1)))value='#'+ids.get(value.slice(1));
  else value=value.replace(/url\(\s*(["']?)#([^\s)'"()]+)\1\s*\)/g,(all,quote,id)=>ids.has(id)?'url('+quote+'#'+ids.get(id)+quote+')':all);
  if(value!==attr.value)node.setAttributeNS(attr.namespaceURI,attr.name,value);
 }
 scoped.add(svg);
}
// Scopes distinguish DOM instances, not printed content. Keep page-cache hashes
// stable across fresh/cached render order while retaining the original SVG IDs.
export const normaliseSvgPaintScopes=html=>String(html).replace(/mm-svg-paint-\d+-/g,'');
