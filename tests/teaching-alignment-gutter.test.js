import test from 'node:test';
import assert from 'node:assert/strict';
import {teachingEquationDisplays} from '../src/lib/booklet-teaching-alignment.js';

const doc=latex=>({format:'maths-editor-document-v1',version:1,blocks:[{id:'p',type:'paragraph',inlines:[{type:'math',latex,display:true}]}]});

// 14 November 2026 (James, "equals gutter"): rows that open with colour commands before the alignment
// point, and prompts that are themselves equations, keep the continuation gutter.
test('continuation keeps the gutter when solution rows open with colour commands', () => {
  const example={id:'e',equationAlignment:{mode:'continuation'},prompt:doc('\\frac{10a^5}{5a^2}'),
    theorySolution:'$$\\begin{aligned}\\color{#268cff}&\\color{#268cff}=2a^3\\end{aligned}$$'};
  const out=teachingEquationDisplays(example);
  assert.ok(out,'aligned display is produced');
  assert.match(out.prompt.blocks[0].inlines[0].latex,/&\\mathrel\{\\phantom\{=\}\}\\frac\{10a\^5\}/);
  assert.match(out.theorySolution.blocks[0].inlines[0].latex,/\\color\{#268cff\}&=2a\^3/);
});

test('continuation treats an equation prompt as the opening line', () => {
  const example={id:'e',equationAlignment:{mode:'continuation'},prompt:doc('\\frac{3n}{7}=\\frac{\\boxed{\\phantom{6n}}}{14}'),
    theorySolution:'$$\\begin{aligned}&=\\frac{6n}{14}\\end{aligned}$$'};
  const out=teachingEquationDisplays(example);
  assert.ok(out);
  assert.match(out.prompt.blocks[0].inlines[0].latex,/&\\mathrel\{\\phantom\{=\}\}\\frac\{3n\}\{7\}=/);
});
