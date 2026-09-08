import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveAnswer} from '../src/lib/booklet-model.js';
test('legacy answer extraction retains the final maths line',()=>{
 assert.equal(deriveAnswer('working\n$= 9$'),'$9$');
 assert.equal(deriveAnswer('working\n= 9'),'9');
});
