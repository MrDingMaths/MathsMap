import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {repairVolumeBank} from '../scripts/booklet/repair-volume-bank.mjs';
import {solidMetadata,solidEdges,edgeVisibility} from '../src/lib/solid-geometry.js';
import {volumeAssessmentRows} from '../scripts/booklet/volume-bank-assessments.mjs';
import {practiceQuestions} from '../scripts/booklet/import-project-bank.mjs';
const source=JSON.parse(fs.readFileSync('booklets/projects/volume-v1.json'));
const find=(p,id)=>{if(p?.id===id)return p;if(p&&typeof p==='object')for(const [k,v]of Object.entries(p)){if(['source','sourceReview','sourceLayoutEvidence','spec','studio'].includes(k))continue;const hit=find(v,id);if(hit)return hit;}};
test('Volume prism repairs preserve givens and derive true hidden edges without cross-face chords',()=>{
 const {next}=repairVolumeBank(source);
 for(const id of ['p16-q1-d-diagram','p16-q1-h-diagram']){
  const code=find(next,id).code,model=solidMetadata(code).model;
  assert.ok(model.faces.length===8);const hidden=solidEdges(model).filter(e=>edgeVisibility(model,e.a,e.b).every(s=>s.hidden)).map(e=>[e.a,e.b].sort().join('|'));
  assert.ok(hidden.includes('A|AA'));
  assert.ok(!code.includes('(D)--(CC)--(BB)'));assert.ok(!code.includes('(B)--(AA)--(FF)'));
 }
 assert.match(find(next,'p15-volume-triangular-prism').code,/\\draw \(R\)--\(F\)--\(L\);/);
 assert.doesNotMatch(find(next,'p15-volume-triangular-prism').code,/\ndraw\b/);
 assert.ok(find(next,'p38-q12').content.prompt.endsWith('two decimal places.'));
 assert.deepEqual(next.source,source.source);assert.deepEqual(next.settings,source.settings);
 assert.equal(repairVolumeBank(next).records.length,0);
});
test('Volume has a unique individual assessment for every whole practice block',()=>{
 assert.deepEqual(volumeAssessmentRows.map(r=>r[0]).sort(),practiceQuestions(source).map(b=>b.id).sort());
 assert.equal(new Set(volumeAssessmentRows.map(r=>r[0])).size,63);
 for(const [id,skill,score,reason]of volumeAssessmentRows){assert.ok(skill&&Number.isInteger(score)&&score>=0&&score<=100,id);assert.ok(reason.length>30,id);}
 assert.equal(volumeAssessmentRows.find(r=>r[0]==='p27-q11')[1],'volume-of-prism');
 assert.equal(volumeAssessmentRows.find(r=>r[0]==='p39-q13')[1],'volume-capacity-problems');
});
