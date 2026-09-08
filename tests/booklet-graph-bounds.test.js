import test from 'node:test';
import assert from 'node:assert/strict';
import {clipLinearGraph,cartesianTikz} from '../scripts/booklet/linear-geometry.mjs';
test('the source example y=2x+1 terminates at graph bounds, not extrapolated beyond axes',()=>{
 assert.deepEqual(clipLinearGraph(2,1),[[-3,-5],[2,5]]);
 assert.deepEqual(clipLinearGraph(0,2),[[-5,2],[5,2]]);assert.deepEqual(clipLinearGraph(0,8),[]);
});
test('guided graphs preserve exact equations and independently bounded endpoints',()=>{
 for(const [m,c] of [[2,-1],[-1,4],[1,1],[1,3],[1,-2],[2,0],[3,0],[-2,0]])for(const [x,y]of clipLinearGraph(m,c)){assert.ok(Math.abs(y-(m*x+c))<1e-9);assert.ok(x>=-5&&x<=5&&y>=-5&&y<=5);assert.ok(Math.abs(x)===5||Math.abs(y)===5);}
 const code=cartesianTikz({lines:[{m:2,c:1}],points:[{x:0,y:1},{x:1,y:3}]});assert.match(code,/clip=true/);assert.match(code,/\\addplot.*\{\(2\)\*x\+\(1\)\}/);assert.doesNotMatch(code,/\(-3,-5\) -- \(2,5\)/);
 assert.throws(()=>cartesianTikz({points:[{x:6,y:0,label:'bad'}]}),/outside/);
});
