import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeDocument,visitDocument} from '../public/libs/maths-editor/document-model.mjs';
import {documentHtml} from '../src/lib/document-content.js';
import {equationTargets,anchorResolved} from '../public/libs/maths-editor/annotated-equation.mjs';
const project=JSON.parse(fs.readFileSync('booklets/projects/index-laws-complete-v1.json'));
const blocks=project.sections.flatMap(s=>s.blocks),get=id=>blocks.find(b=>b.id===id);
test('mixed practice preserves the source three-column grid and external card labels',()=>{
 const q=get('index-t7-q5');assert.equal(q.content.columns,3);assert.equal(q.content.children.length,27);assert.equal(q.sourceReview.arrangements[0].columns,3);
 const prompt=get('index-t7-q13').content.prompt,card=prompt.blocks.find(n=>n.arrangement==='cards');
 assert.deepEqual(card.slots.map(s=>s.label),['a','A','b','B','c','C','d','D']);
 assert.equal(card.widthMm,96);assert.deepEqual(normalizeDocument(prompt),prompt);
 const html=documentHtml(prompt);assert.equal((html.match(/data-card-label/g)??[]).length,8);assert.equal((html.match(/data-card-face/g)??[]).length,8);
});

test('Exercise 8 missing-value scaffolds are editable maths with source evidence retained',()=>{
 const nodes=[...get('index-t8-q2').content.children.slice(1),...get('index-t8-q6').content.children.slice(1,5),get('index-t8-q7').content.children[0],get('index-t8-q13').content];
 assert.equal(nodes.length,9);
 for(const n of nodes){
  assert.deepEqual(n.questionDiagrams,[]);assert.equal(n.answerSpaceMm,0);
  assert.ok(n.sourceLayoutEvidence.transcribedVisuals.length);
  const maths=n.prompt.blocks.flatMap(p=>p.inlines??[]).filter(i=>i.type==='math');
  assert.ok(maths.some(m=>m.latex.includes('\\boxed{\\rule{0pt}{3mm}')||m.latex.includes('\\boxed{\\rule{0pt}{4mm}')));
  assert.doesNotMatch(documentHtml(n.prompt),/katex-error|<img/);
 }
 assert.equal(get('index-t8-q2').content.columns,2);assert.equal(get('index-t8-q6').content.columns,3);
 assert.equal(get('index-t8-q7').content.children[1].children.length,6);
});
