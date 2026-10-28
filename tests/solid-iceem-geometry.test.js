import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {isSolidCandidate} from '../scripts/audit-solid-visibility.mjs';
import {visualKinds} from '../scripts/booklet/token-efficient-prompts.mjs';

const project=JSON.parse(fs.readFileSync(new URL('../booklets/projects/iceem-10-ch06-20261015.json',import.meta.url)));
const diagram=(block,index)=>project.sections.flatMap(s=>s.blocks).find(b=>b.id===block).content.children[index].questionDiagrams[0].code;

test('semicircular end descriptions trigger solid review without requiring ellipse syntax',()=>{
 assert.equal(isSolidCandidate(String.raw`\begin{tikzpicture}\draw (0,0) .. controls (0,-1) and (1,-1) .. (1,0);\end{tikzpicture}`,'Matching semicircular ends'),true);
 assert.ok(visualKinds({entries:[{kind:'diagram',description:'Matching semicircular ends'}]}).includes('solid'));
});

test('ICE-EM 6A half-cylinder end profiles agree and both generator endpoints are tangent',()=>{
 for(const [block,index] of [['p9-q1',3],['p10-q6',5]]){
  const code=diagram(block,index);
  const frames=[...code.matchAll(/cm=\{(-?[\d.]+),(-?[\d.]+),0,(-?[\d.]+),\((-?[\d.]+),(-?[\d.]+)\)\}/g)].map(m=>m.slice(1).map(Number));
  assert.equal(frames.length,2,block+' has two explicit projected end profiles');
  assert.deepEqual(frames[0].slice(0,3),frames[1].slice(0,3),'ends use the same linear projection');
  const m=code.match(/\\draw \((-?[\d.]+),(-?[\d.]+)\)--\((-?[\d.]+),(-?[\d.]+)\);/);
  assert.ok(m,'explicit corresponding generator endpoints');
  const [x1,y1,x2,y2]=m.slice(1).map(Number);
  assert.ok(Math.abs((x2-x1)-(frames[1][3]-frames[0][3]))<1e-8);
  assert.ok(Math.abs(y2-y1)<1e-8);
  for(const [frame,x,y] of [[frames[0],x1,y1],[frames[1],x2,y2]]){
   const [rx,shear,ry,cx,cy]=frame,u=(x-cx)/rx,v=(y-cy-shear*u)/ry;
   assert.ok(Math.abs(u*u+v*v-1)<1e-8,'generator meets its rim');
   assert.ok(Math.abs(-shear*v+ry*u)<1e-8,'rim derivative is parallel to horizontal generator');
  }
 }
});

test('ICE-EM 6C rear-quarter cut does not draw through the retained front cone wall',()=>{
 const code=diagram('p21-q7',3);
 for(const draw of code.matchAll(/\\draw\b[^;]*;/g)){
  assert.ok(!(/\(V\)/.test(draw[0])&&/\((?:A|O)\)/.test(draw[0])),'descending rear cut edges are occluded');
 }
 assert.match(code,/start angle=90,end angle=360/,'three quarters of the top rim retained');
 const m=code.match(/\\draw \((-?[\d.]+),(-?[\d.]+)\)--\(V\)--\((-?[\d.]+),(-?[\d.]+)\)/);
 assert.ok(m);
 const [x1,y1,x2,y2]=m.slice(1).map(Number);
 for(const [x,y] of [[x1,y1],[x2,y2]]){
  assert.ok(Math.abs(x*x/(1.3**2)+y*y/(.413**2)-1)<1e-8,'outer endpoint on ellipse');
  assert.ok(Math.abs(-x*x/(1.3**2)+y*(-2.5-y)/(.413**2))<1e-8,'outer generator tangent to ellipse');
 }
});
