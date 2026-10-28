import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CURVED_SOLID_PROMPT,visualKinds,compactTikzPrompt} from '../scripts/booklet/token-efficient-prompts.mjs';
import {DIAGRAM_REVIEW_CONTRACT} from '../scripts/booklet/lean-review.mjs';
import {prismModel,obliqueView,edgeVisibility} from '../src/lib/solid-geometry.js';

test('curved families receive the same tangent and union checks in authoring and review',()=>{
 for(const family of ['sphere','hemisphere','semicylinder','frustum','composite']){
  assert.ok(visualKinds([],family).includes('solid'),family);
  assert.ok(compactTikzPrompt({inventory:{entries:[{kind:'diagram',description:family}]},sourceText:family}).includes(CURVED_SOLID_PROMPT),family);
 }
 assert.ok(DIAGRAM_REVIEW_CONTRACT.includes(CURVED_SOLID_PROMPT));
});

test('open semicylinder retains the rear interior rim and its exterior silhouette',()=>{
 const front=Array.from({length:37},(_,i)=>{const t=(180+i*5)*Math.PI/180;return [Math.cos(t),Math.sin(t)];});
 const model=prismModel(front,[0,0,1],obliqueView(2.2,1.55));
 // Omit the diameter's extrusion face: the source has two end caps and an open top.
 model.faces.pop();
 for(const [i,hidden] of [[2,false],[18,true],[30,false]]){
  const pieces=edgeVisibility(model,'B'+i,'B'+(i+1));
  assert.ok(pieces.length&&pieces.every(piece=>piece.hidden===hidden),`rear arc ${180+i*5} degrees`);
 }
});

test('oblique hollow-pipe regression: ellipse tangencies follow the extrusion',()=>{
 const p=JSON.parse(fs.readFileSync(new URL('../booklets/projects/volume-of-composite-solids-v1.json',import.meta.url)));
 const b=p.sections.flatMap(s=>s.blocks).find(b=>b.id==='p6-q3-block');
 const code=b.content.children[5].questionDiagrams[0].code;
 const m=code.match(/\\draw \((-?[\d.]+),(-?[\d.]+)\)--\((-?[\d.]+),(-?[\d.]+)\) arc\[start angle=(-?[\d.]+),end angle=(-?[\d.]+),x radius=\.85,y radius=1\]/);
 assert.ok(m,'pipe generators and rim share explicit tangent endpoints');
 const [x,y,bx,by,start,end]=m.slice(1).map(Number),dx=bx-x,dy=by-y;
 assert.ok(Math.abs(x*x/(.85*.85)+y*y-1)<1e-7,'endpoint lies on rim');
 assert.ok(Math.abs((- .85*Math.sin(start*Math.PI/180))*dy-Math.cos(start*Math.PI/180)*dx)<1e-7,'generator is tangent');
 assert.ok(Math.abs(start-end-180)<1e-7,'rear exposed arc spans the opposite tangencies');
});
