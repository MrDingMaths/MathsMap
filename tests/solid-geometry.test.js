import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prismModel,pyramidModel,tdplotView,obliqueView,edgeVisibility,solidEdges,solidTikz,curvedSolidTikz,solidMetadata,validateSolid} from '../src/lib/solid-geometry.js';

const ramp=()=>({version:1,vertices:{b0:[0,0,0],b1:[0,2.5,0],b2:[0,0,1.2],f0:[4,0,0],f1:[4,2.5,0],f2:[4,0,1.2]},faces:[['b0','b1','b2'],['f0','f1','f2'],['b0','b1','f1','f0'],['b1','b2','f2','f1'],['b2','b0','f0','f2']],view:tdplotView(70,110)});
test('reported loading ramp: complete near triangle solid, three rear edges hidden',()=>{
 const m=ramp();for(const[a,b]of [['f0','f1'],['f0','f2'],['f1','f2']])assert.deepEqual(edgeVisibility(m,a,b),[{from:0,to:1,hidden:false}]);
 for(const[a,b]of [['b0','b1'],['b0','b2'],['b0','f0']])assert.deepEqual(edgeVisibility(m,a,b),[{from:0,to:1,hidden:true}]);
 assert.equal(solidEdges(m).length,9);
});
test('changing camera reverses visibility, independent of vertex spelling',()=>{
 const m=ramp();m.view=tdplotView(70,250);
 assert.equal(edgeVisibility(m,'b0','b1')[0].hidden,false);assert.equal(edgeVisibility(m,'f0','f1')[0].hidden,true);
});
test('oblique rectangular and trapezoidal prisms keep front and silhouette solid',()=>{
 for(const front of [[[0,0],[4,0],[4,2],[0,2]],[[0,0],[4,0],[3,2],[1,2]]]){
  const m=prismModel(front);for(let i=0;i<4;i++)assert.ok(edgeVisibility(m,'A'+i,'A'+((i+1)%4)).every(s=>!s.hidden));
  assert.equal(solidEdges(m).length,12);assert.ok(edgeVisibility(m,'A0','B0')[0].hidden);
 }
 const mirrored=prismModel([[0,0],[4,0],[4,2],[0,2]],[0,0,2],obliqueView(-0.65,0.38));
 assert.equal(edgeVisibility(mirrored,'A1','B1')[0].hidden,true);assert.equal(edgeVisibility(mirrored,'A0','B0')[0].hidden,false);
});
test('pyramid silhouettes and open faces use actual face occlusion',()=>{
 const m=pyramidModel([[0,0,0],[3,0,0],[3,3,0],[0,3,0]],[1.5,1.5,4]);
 assert.equal(solidEdges(m).length,8);assert.ok(solidEdges(m).some(e=>edgeVisibility(m,e.a,e.b).some(s=>s.hidden)));
 const box=prismModel([[0,0],[4,0],[4,2],[0,2]]);box.faces=box.faces.filter(f=>!f.every(id=>box.vertices[id][1]===2));assert.doesNotThrow(()=>solidTikz(box));
});
test('concave extrusion has real recess faces and partial visibility',()=>{
 const m=prismModel([[0,0],[4,0],[4,1],[1,1],[1,4],[0,4]],[0,0,3],obliqueView(-0.65,0.38));
 assert.equal(solidEdges(m).length,18);assert.ok(solidEdges(m).some(e=>edgeVisibility(m,e.a,e.b).length>1));
});
test('labels cannot repaint edges and angle marks are projected 2D',()=>{
 const code=solidTikz(ramp(),{labels:[{a:'b0',b:'b1',text:'$2.5\\text{ m}$'}],annotations:[{kind:'right-angle',vertices:['f1','f0','f2']}]});
 assert.match(code,/\\path \(b0\)--\(b1\) node/);assert.doesNotMatch(code,/tdplot_main_coords/);assert.equal(solidMetadata(code).model.faces.length,5);
});
test('analytic curved templates split rims and use genuine tangent silhouettes',()=>{
 for(const k of ['cylinder','cone','sphere','semicylinder']){const code=curvedSolidTikz(k);assert.equal(solidMetadata(code).template,k);assert.match(code,/\\draw\[dashed\]/);}
 const half=curvedSolidTikz('semicylinder');assert.match(half,/arc \(0:120:1\)/);assert.match(half,/\\draw\[dashed\] \(-1,0\)--/);
 assert.throws(()=>curvedSolidTikz('cone',{height:0.1}));
});
test('invalid views and nonplanar faces fail explicitly',()=>{
 const m=ramp();m.view.toward=[1,0,0];assert.throws(()=>validateSolid(m));
 const n=prismModel([[0,0],[4,0],[4,2],[0,2]]);n.vertices.A2[2]=0.4;assert.throws(()=>validateSolid(n),/Non-planar/);
});
