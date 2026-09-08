// Explicit, revision-safe migration. Default writes reviewable candidates only.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {graphTikz} from '../../src/lib/graph-model.js';
import {GRAPH_STROKE_MARKER} from '../../src/lib/graph-strokes.js';
import {styleManualGraphStrokes} from '../../src/lib/graph-stroke-source.js';
import {saveBookletProject} from './project-studio-server.mjs';

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
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const out='output/graph-strokes';fs.mkdirSync(out,{recursive:true});
  const saved=[];
  for(const name of fs.readdirSync('booklets/projects').filter(f=>f.endsWith('.json'))){
    const original=JSON.parse(fs.readFileSync('booklets/projects/'+name,'utf8'));
    if(process.argv.includes('--save')){
      const candidate=JSON.parse(fs.readFileSync(`${out}/${name}`,'utf8'));
      if(candidate.revision!==original.revision)throw Error('Project revision changed: '+name);
      const expected=migrateGraphStrokes(original);assert.deepEqual(candidate,expected.project);
      if(!expected.records.length)continue;
      const result=await saveBookletProject(candidate,{expectedRevision:original.revision});
      saved.push({id:result.id,beforeRevision:original.revision,revision:result.revision,graphs:expected.records.length});
    }else{
      const result=migrateGraphStrokes(original);
      fs.writeFileSync(`${out}/before-${name}`,JSON.stringify(original,null,2));
      fs.writeFileSync(`${out}/${name}`,JSON.stringify(result.project,null,2));
      fs.writeFileSync(`${out}/${name}.audit.json`,JSON.stringify(result.records,null,2));
      console.log(name,result.records.length,'graphs');
    }
  }
  if(saved.length){fs.writeFileSync(`${out}/saved.json`,JSON.stringify(saved,null,2));console.log(saved);}
}
