import fs from 'node:fs';
import assert from 'node:assert/strict';
import {validateEditableProject} from '../../src/lib/editable-booklet-model.js';
import {graphTikz} from '../../src/lib/graph-model.js';
import {combinedExampleTikz} from '../../src/lib/booklet-preview.js';
const read=file=>JSON.parse(fs.readFileSync(file));
const before=read('booklets/projects/linear-relationships-complete-v1.json'),after=read('output/graph-repair/candidate.json');
const report=read('output/graph-repair/migration-report.json'),diagrams=[];
function content(value){
 if(Array.isArray(value))return value.map(content);
 if(!value||typeof value!=='object')return value;
 if(['image','tikz'].includes(value.format))return {diagramId:value.id};
 return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,content(v)]));
}
assert.deepEqual(content(after),content(before),'Migration must preserve text, layouts, answers and source evidence');
assert.ok(validateEditableProject(after).valid);
function walk(x){if(!x||typeof x!=='object')return;if(['image','tikz'].includes(x.format))diagrams.push(x);for(const[k,v]of Object.entries(x))if(!['spec','sourceAtom','originalDiagram','mathematicalModel'].includes(k))Array.isArray(v)?v.forEach(walk):typeof v==='object'&&walk(v);}
walk(after.sections);const byId=new Map(diagrams.map(d=>[d.id,d]));
for(const change of report.converted){const d=byId.get(change.id);assert.equal(d.code,graphTikz(d.mathematicalModel),d.id);assert.equal(d.spec.originalGraph.format,change.previousFormat);}
const overlays=diagrams.filter(d=>d.overlayOf);
for(const d of overlays){const base=byId.get(d.overlayOf);assert.ok(base,d.id);assert.ok(combinedExampleTikz(base,d),d.id);for(const key of ['bounds','widthCm','heightCm'])assert.deepEqual(d.mathematicalModel[key],base.mathematicalModel[key],d.id+' '+key);}
assert.equal(report.converted.filter(r=>r.previousFormat==='image').length,93);
assert.equal(report.converted.filter(r=>r.previousFormat==='tikz').length,150);
assert.equal(diagrams.length,314);
console.log(JSON.stringify({valid:true,converted:report.converted.length,overlays:overlays.length,unchangedContent:true}));
