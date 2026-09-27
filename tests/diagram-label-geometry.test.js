import test from 'node:test';
import assert from 'node:assert/strict';
import {convexPolygonsOverlap} from '../src/lib/diagram-label-geometry.js';

const rectangle=(x,y,width,height,angle=0,scaleX=1,scaleY=scaleX)=>{
 const radians=angle*Math.PI/180,c=Math.cos(radians),s=Math.sin(radians);
 return [[0,0],[width,0],[width,height],[0,height]].map(([u,v])=>({x:x+c*u*scaleX-s*v*scaleY,y:y+s*u*scaleX+c*v*scaleY}));
};

test('rotated ink rectangles can have overlapping axis-aligned bounds without intersecting',()=>{
 for(const angle of [45,-45,50,135]){
  const a=rectangle(0,0,60,8,angle),b=rectangle(20,0,60,8,angle);
  const ranges=points=>({left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))});
  const x=ranges(a),y=ranges(b);
  assert.ok(Math.min(x.right,y.right)>Math.max(x.left,y.left));
  assert.ok(Math.min(x.bottom,y.bottom)>Math.max(x.top,y.top));
  assert.equal(convexPolygonsOverlap(a,b,.5),false);
  assert.equal(convexPolygonsOverlap(a,rectangle(3,0,60,8,angle),.5),true);
 }
});

test('four-corner intersection detects crossings, containment and reflected or skewed transforms',()=>{
 const diamond=rectangle(0,0,10,10,45);
 // Opposite corners of this diamond have identical x, but it has nonzero area.
 assert.equal(convexPolygonsOverlap(diamond,rectangle(-1,4,2,3),.5),true);
 assert.equal(convexPolygonsOverlap(rectangle(0,0,30,20),rectangle(5,5,3,3),.5),true);
 assert.equal(convexPolygonsOverlap(rectangle(0,0,20,5),rectangle(9,-10,20,5,90),.5),true);
 const reflected=rectangle(20,0,20,10,25,-2,1),skewed=reflected.map(p=>({x:p.x+.7*p.y,y:p.y}));
 assert.equal(convexPolygonsOverlap(skewed,skewed,.5),true);
 assert.equal(convexPolygonsOverlap(skewed,skewed.map(p=>({x:p.x+100,y:p.y})),.5),false);
});

test('touching and sub-tolerance intersections retain the existing half-pixel allowance at page zoom',()=>{
 for(const scale of [.5,1,2]){
  const a=rectangle(0,0,10,10,0,scale);
  for(const [offset,expected] of [[10,false],[9.75,false],[9.25,true]])assert.equal(convexPolygonsOverlap(a,rectangle(offset*scale,0,10,10,0,scale),.5*scale),expected);
 }
 assert.equal(convexPolygonsOverlap([],rectangle(0,0,10,10),.5),false);
 assert.equal(convexPolygonsOverlap(rectangle(0,0,10,0),rectangle(0,0,10,10),.5),false);
});
