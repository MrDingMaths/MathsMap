// Pure graph inspection and stroke transformation; no project writes.
import assert from 'node:assert/strict';
import {graphTikz} from '../../src/lib/graph-model.js';
import {GRAPH_STROKE_MARKER} from '../../src/lib/graph-strokes.js';
import {styleManualGraphStrokes} from '../../src/lib/graph-stroke-source.js';
export function visitGraphs(value,fn) {
  if(!value||typeof value!=='object')return;
  if(value.format==='tikz'&&value.code)fn(value);
  for(const [key,child] of Object.entries(value))if(!['spec','sourceAtom','originalDiagram','mathematicalModel','originalContent','before','after'].includes(key)&&child&&typeof child==='object')Array.isArray(child)?child.forEach(x=>visitGraphs(x,fn)):visitGraphs(child,fn);
}
export function migrateGraphStrokes(project) {
  const next=structuredClone(project),records=[];
  visitGraphs(next,node=>{
    if(node.code.includes(GRAPH_STROKE_MARKER))return;
    const before=node.code,model=node.mathematicalModel;
    // Older compiler generations have different typography. Preserve that source
    // exactly apart from weights, rather than silently adopting modern text sizing.
    const generated=model&&graphTikz(model,{legacyStrokes:true})===before;
    const result=generated?{code:graphTikz(model),roles:[]}:styleManualGraphStrokes(before);
    node.code=result.code;
    records.push({id:node.id,widthMm:node.widthMm??65,generated:!!generated,hasModel:!!model,roles:result.roles});
  });
  // Strong guard: the only content mutation permitted in this migration is code.
  const check=structuredClone(next),originalCodes=[];visitGraphs(project,n=>originalCodes.push(n.code));
  let i=0;visitGraphs(check,n=>n.code=originalCodes[i++]);assert.deepEqual(check,project);
  return {project:next,records};
}
