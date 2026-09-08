// Acceptance checks against the preserved, real 93-page input (no project writes).
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { validateEditableProject, updateProjectSettings } from '../../src/lib/editable-booklet-model.js';

import { contentSource } from '../../src/lib/document-content.js';
const directory='output/linear-feedback/';
const before=JSON.parse(fs.readFileSync(directory+'before.json'));
const project=JSON.parse(fs.readFileSync(directory+'candidate.json'));
const nodes=value=>{const result=[];const walk=n=>{if(!n||typeof n!=='object')return;result.push(n);Object.values(n).forEach(v=>Array.isArray(v)?v.forEach(walk):walk(v));};walk(value);return result;};
const all=nodes(project.sections),original=nodes(before.sections),byId=new Map(all.filter(n=>n.id).map(n=>[n.id,n]));
assert.equal(project.sections.length,93);
assert.ok(validateEditableProject(project).valid);
assert.deepEqual(project.sections.map(s=>[s.id,s.sourcePageNumber]),before.sections.map(s=>[s.id,s.sourcePageNumber]));
assert.deepEqual(project.source,before.source);
assert.deepEqual(project.assets,before.assets);
for(const n of original.filter(n=>n.id&&(n.answer||n.type==='question'||n.sourceAtom))){
  const next=byId.get(n.id);assert.ok(next,'Preserve stable content ID '+n.id);
  for(const key of ['short','worked'])if(contentSource(n.answer?.[key]).trim())assert.ok(contentSource(next.answer?.[key]).trim(),'Preserve answer '+n.id+'/'+key);
  if(n.sourceAtom?.sourceText)assert.equal(next.sourceAtom?.sourceText,n.sourceAtom.sourceText);
}
const tables=id=>nodes(byId.get(id)).filter(n=>n.type==='table');
assert.ok(tables('page-31-q1').every(t=>t.annotations?.length),'Difference arrows remain structured');
assert.ok(tables('page-32-q4').some(t=>t.rows.some(r=>r.some(c=>c.background==='#c7c7c7'))),'Skipped values remain distinct');
assert.equal(byId.get('page-35-q10').pairedBlockId,'page-35-q11');
for(const page of project.sections.filter(s=>s.sourcePageNumber>=59&&s.sourcePageNumber<=64))for(const b of page.blocks.filter(b=>b.type==='question'))assert.ok(b.content.representations?.table,'Preserve teaching quadrants '+b.id);
for(const n of all.filter(n=>(n.format==='image'||n.type==='image')&&n.src)){assert.equal(n.reviewStatus,'needs-review');assert.ok(n.spec?.retentionReason);}
assert.ok(nodes(byId.get('page-92-q2')).some(n=>n.type==='layout'&&n.slots?.length===2),'Verification is a parallel scaffold');
const samples=[];
for(let i=0;i<25;i++){
  let time=performance.now();JSON.parse(JSON.stringify(project));const undoSnapshotMs=performance.now()-time;
  time=performance.now();const next=updateProjectSettings(project,{layoutOverrides:{...project.settings.layoutOverrides,answerSpaces:{...project.settings.layoutOverrides.answerSpaces,'page-26-q1-a':20+i}}});const updateMs=performance.now()-time;
  samples.push({undoSnapshotMs,updateMs});
}
const median=Object.fromEntries(Object.keys(samples[0]).map(k=>[k,samples.map(s=>s[k]).sort((a,b)=>a-b)[12]]));
const report={pages:93,bytes:fs.statSync(directory+'candidate.json').size,baselinePerUpdateBeforeRenderingMs:402,median,samples,preservedAnswers:original.filter(n=>n.answer).length,retainedSourceImages:all.filter(n=>(n.format==='image'||n.type==='image')&&n.src).length};
fs.writeFileSync(directory+'performance.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,samples:undefined}));
