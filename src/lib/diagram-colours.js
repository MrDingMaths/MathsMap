import {BOOKLET_HOUSE_STYLE} from '../../public/libs/maths-editor/house-style.mjs';
import {BOOKLET_PALETTE} from '../../public/libs/maths-editor/booklet-palette.mjs';

// A colour name is a role, not a hue. Use separate aliases when the same source
// hue serves both an ordinary outline and a semantic highlight.
export const DIAGRAM_COLOUR_PREFIX = '% mathsmap-diagram-colours ';
export function diagramColourPolicy(code) {
  const line=String(code).split('\n').find(l=>l.startsWith(DIAGRAM_COLOUR_PREFIX));
  if(!line)return null;
  const policy=JSON.parse(line.slice(DIAGRAM_COLOUR_PREFIX.length));
  if(policy.version!==1||!['geometry','graph'].includes(policy.kind))throw Error('Invalid diagram colour policy');
  if(!Array.isArray(policy.base)||!Array.isArray(policy.semantic))throw Error('Missing diagram colour roles');
  const names=new Set();
  for(const name of policy.base){if(!/^[A-Za-z][A-Za-z0-9]*$/.test(name)||names.has(name))throw Error('Invalid base colour role');names.add(name);}
  for(const entry of policy.semantic){
    if(!/^[A-Za-z][A-Za-z0-9]*$/.test(entry.name)||names.has(entry.name)||!entry.reason?.trim()||!/^[0-9a-f]{6}$/i.test(entry.hex))throw Error('Invalid semantic colour evidence');
    names.add(entry.name);
  }
  if(policy.semantic.length&&!policy.reference?.trim())throw Error('Semantic colours need an occurrence reference');
  return policy;
}
// Raw TeX specials cannot contain TeX comments, parameters or unbalanced braces.
// The full verbatim evidence remains in the JSON comment; this is its SVG label.
const xml=s=>String(s).replace(/[\\{}%#]/g,' ').replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
export function applyDiagramColourPolicy(source) {
  const policy=diagramColourPolicy(source);
  if(!policy)return source; // Legacy/manual art requires explicit role review.
  let code=String(source);
  if(policy.kind==='geometry'){
    const base=new Set(policy.base),ink=BOOKLET_HOUSE_STYLE.diagrams.ink.slice(1).toUpperCase();
    code=code.replace(/\\definecolor\{([^}]+)\}\{([^}]+)\}\{([^}]+)\}/g,(all,name)=>base.has(name)?`\\definecolor{${name}}{HTML}{${ink}}`:all);
  }
  const metadata=`\\special{dvisvgm:raw <metadata data-diagram-colours="1" data-diagram-kind="${policy.kind}" data-diagram-base="${xml(policy.base.join(' '))}" data-diagram-semantic-palette="${policy.semantic.map(e=>e.hex).join(' ')}" data-diagram-semantic-reference="${xml(policy.reference??'')}" data-diagram-semantic-reasons="${xml(policy.semantic.map(e=>e.name+': '+e.reason).join('; '))}"/>}`;
  code=code.replace(/\\special\{dvisvgm:raw <metadata data-diagram-colours="1"[^\n]*?\/>(?:\s*)\}\n?/g,'');
  const end=code.lastIndexOf('\\end{tikzpicture}');
  return end<0?code:code.slice(0,end)+metadata+'\n'+code.slice(end);
}
export function adoptDiagramColours(code,policy) {
  if(diagramColourPolicy(code))return applyDiagramColourPolicy(code);
  return applyDiagramColourPolicy(DIAGRAM_COLOUR_PREFIX+JSON.stringify({version:1,...policy})+'\n'+code);
}

// Classification metadata does not change a graph's mathematics or calibrated
// answer layout. Strip only our validated no-op graph policy, never arbitrary
// comments or manual TeX edits, when comparing an existing graph source.
export function graphSourceWithoutColourMetadata(source) {
  if(typeof source!=='string')return source;
  let policy;try{policy=diagramColourPolicy(source);}catch{return source;}
  if(policy?.kind!=='graph'||policy.base.length||policy.semantic.length)return source;
  return source.split('\n').filter(line=>!line.startsWith(DIAGRAM_COLOUR_PREFIX)).join('\n')
    .replace(/\\special\{dvisvgm:raw <metadata data-diagram-colours="1"[^\n]*?\/>(?:\s*)\}\n?/g,'');
}

export function inspectDiagramColours(svg) {
  const marker=svg.querySelector('[data-diagram-colours="1"]');
  if(!marker||marker.dataset.diagramKind!=='geometry')return [];
  const allowed=new Set(Object.values(BOOKLET_PALETTE).map(hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(',')));
  const bad=new Set();
  for(const shape of svg.querySelectorAll('path,line,polyline,polygon,rect,circle,ellipse,use,text,tspan')){
    if(shape.closest('defs,clipPath'))continue;
    const css=getComputedStyle(shape);
    // Fills can be region shading, material or white masks. Text fill is ink.
    for(const paint of [css.stroke,css.fill]){
      const rgb=paint.match(/^rgba?\((\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/);
      if(rgb&&!allowed.has(rgb.slice(1,4).join(',')))bad.add(paint);
    }
  }
  return [...bad];
}
