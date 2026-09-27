import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {repairProbabilityDiagramPalette} from '../scripts/booklet/repair-probability-diagram-palette.mjs';

const source=JSON.parse(fs.readFileSync('booklets/projects/probability-v1.json'));
function diagram(project,id){let found;const visit=value=>{if(!value||typeof value!=='object')return;if(value.id===id&&value.code)found=value;for(const [k,v] of Object.entries(value))if(!['source','spec','sourceReview','verification'].includes(k))visit(v);};visit(project.sections);return found;}
test('probability outcome shading uses light semantic fills without changing category counts or source evidence',()=>{
 const {next}=repairProbabilityDiagramPalette(source);
 assert.deepEqual(next.source,source.source);
 assert.deepEqual(next.sections.map(s=>s.id),source.sections.map(s=>s.id));
 for(const [id,alias] of [['p4-q1-spinner','outcomePurple'],['p8-q6-spinner','outcomePurple'],['p9-spinner-diagram','outcomeP'],['p13-q12-spinner','categoryP'],['p39-q12-a-spinner','categoryPurple'],['p39-q12-b-spinner','categoryPurple']]){
  const before=diagram(source,id),after=diagram(next,id);
  assert.match(after.code,new RegExp(String.raw`\\definecolor\{${alias}\}\{HTML\}\{E8DEF4\}`),id);
  assert.deepEqual(after.spec,before.spec,id+' source evidence');
  const drawing=code=>code.split('\n').filter(line=>!line.startsWith('% mathsmap-diagram-colours')&&!line.startsWith('\\definecolor')).join('\n');
  assert.equal(drawing(after.code),drawing(before.code),id+' geometry and category order');
 }
 assert.match(diagram(next,'p14-q13-tom-bag').code,/\\definecolor\{counterLetter\}\{HTML\}\{000000\}/);
 assert.match(diagram(next,'p31-histogram-solution').code,/draw=probabilityBlue,fill=probabilityBlueFill/);
 assert.equal(repairProbabilityDiagramPalette(next).records.length,0);
});
