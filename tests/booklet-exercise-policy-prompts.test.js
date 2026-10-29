import test from 'node:test';
import assert from 'node:assert/strict';
import {compactTikzPrompt,LEAN_IMPORT_PRINCIPLES,GEOMETRY_EDGE_MARKER_PROMPT,EXERCISE_ORDER_AND_MARKS_PROMPT,CURVED_SOLID_PROMPT} from '../scripts/booklet/token-efficient-prompts.mjs';

test('future authoring and source reviews share mark and difficulty-order requirements',()=>{
 assert.ok(LEAN_IMPORT_PRINCIPLES.includes(EXERCISE_ORDER_AND_MARKS_PROMPT));
 for(const phrase of ['mathematical brackets','independently verified difficulty','whole dependent groups','comments-first','no bank-fed sections'])assert.ok(EXERCISE_ORDER_AND_MARKS_PROMPT.includes(phrase));
});
test('geometry guidance reaches compact TikZ and ordinary review without losing curved-solid checks',()=>{
 const prompt=compactTikzPrompt({inventory:{entries:[{kind:'diagram',description:'sphere'}]},sourceText:'sphere'});
 assert.ok(prompt.includes(GEOMETRY_EDGE_MARKER_PROMPT));
 assert.ok(prompt.includes(CURVED_SOLID_PROMPT));
 assert.ok(LEAN_IMPORT_PRINCIPLES.includes(GEOMETRY_EDGE_MARKER_PROMPT));
 for(const phrase of ['perpendicular','tangent','midpoint','multiplicities','anisotropic','Graph/number-line'])assert.ok(GEOMETRY_EDGE_MARKER_PROMPT.includes(phrase));
});
