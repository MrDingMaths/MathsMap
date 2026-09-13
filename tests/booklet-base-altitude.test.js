import {describe,it} from 'node:test';
import assert from 'node:assert/strict';
import {constructTriangle,verifyTriangleCode} from '../scripts/booklet/triangle-constraints.mjs';
describe('source base and altitude geometry',()=>{
 const model={type:'triangle',sides:{a:{value:6,exact:true}},construction:{type:'base-altitude',height:4,foot:3}};
 it('constructs the altitude without treating it as a sloping side',()=>{assert.deepEqual(constructTriangle(model),{A:[3,4],B:[0,0],C:[6,0]});});
 it('rejects distorted authored altitude and preserves redundant givens',()=>{
  assert.throws(()=>verifyTriangleCode(model,'\\coordinate (A) at (3,5);\\coordinate (B) at (0,0);\\coordinate (C) at (6,0);'));
  assert.throws(()=>constructTriangle({...model,sides:{...model.sides,b:{value:7,exact:true}}}));
 });
 it('rejects degenerate construction',()=>{assert.throws(()=>constructTriangle({...model,construction:{...model.construction,height:0}}));});
});
