import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { repairOtherWorkedExamples } from '../scripts/booklet/repair-worked-example-fields.mjs';
import { arrangementCatalog } from '../src/lib/booklet-arrangement.js';
import { validateEditableProject } from '../src/lib/editable-booklet-model.js';

for (const id of ['angle-relationships-v1', 'probability-v1', 'logarithms-v1', 'linear-relationships-v1']) test(`${id}: repair preserves source and resolves changed layout references`, () => {
  const input = JSON.parse(fs.readFileSync(new URL(`../booklets/projects/${id}.json`, import.meta.url)));
  const before = JSON.stringify(input);
  const result = repairOtherWorkedExamples(input);
  assert.equal(JSON.stringify(input), before);
  assert.deepEqual(repairOtherWorkedExamples(result.project).changes, []);
  const changed = new Set(result.changes.map(c => c.id));
  for (const block of result.project.sections.flatMap(s => s.blocks)) {
    if (!block.examples?.some(e => changed.has(e.id))) continue;
    const entries = arrangementCatalog(block).entries;
    const arrangements = [result.project.settings.layoutOverrides?.blockLayouts?.[block.id]?.arrangement, block.presentation?.layoutOverrides?.blockLayouts?.[block.id]?.arrangement];
    for (const arrangement of arrangements.filter(Boolean)) {
      const refs = [];
      const walk = n => { if(n.ref) refs.push(n.ref); for(const c of n.children ?? []) walk(c); };
      walk(arrangement.root);
      for (const ref of refs.filter(ref => [...changed].some(id => ref.startsWith(id + '/')))) assert.ok(entries.has(ref), `${block.id}: ${ref}`);
      for (const [ref, entry] of entries) if (changed.has(entry.ownerId) && entry.role === 'solution') assert.ok(refs.includes(ref), `Omitted solution: ${ref}`);
    }
  }
});

test('Linear save validation ignores retained source snapshots but rejects live duplicate IDs', () => {
  const input = JSON.parse(fs.readFileSync(new URL('../booklets/projects/linear-relationships-v1.json', import.meta.url)));
  const { project } = repairOtherWorkedExamples(input);
  assert.equal(validateEditableProject(project).valid, true);
  const conclusion = project.sections.flatMap(s => s.blocks).find(b => b.id === 'page-85-block-4');
  assert.equal(conclusion.type, 'worked-example');
  assert.equal(conclusion.theorySolution, '3. The solution is $x = 3$');
  assert.equal(conclusion.content, '');
  const table = project.sections.flatMap(s => s.blocks).find(b => b.id === 'page-51-q2').content.children.find(n => n.id === 'page-51-q2-a').prompt.blocks.find(n => n.type === 'table');
  assert.equal(table.widthMm, 80);
  assert.deepEqual(table.widths, [40, 10, 10, 10, 10]);
  for (const row of table.rows) assert.deepEqual(row.map(c => c.header), [true, false, false, false, false]);
  const findDiagrams = p => p.sections.flatMap(s => s.blocks).find(b => b.content?.children?.some(n => n.id === 'page-12-q16-b')).content.children;
  const before = findDiagrams(input).find(n => n.id === 'page-12-q16-b').questionDiagrams[0];
  const after = findDiagrams(project).find(n => n.id === 'page-12-q16-b').questionDiagrams[0];
  assert.deepEqual(after.spec.originalDiagram, before.spec.originalDiagram);
  assert.equal(after.id, before.id);
  project.sections[0].blocks.push(structuredClone(project.sections[0].blocks[0]));
  assert.ok(validateEditableProject(project).errors.some(e => e.startsWith('Duplicate project node id:')));
});
