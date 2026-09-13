import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import katex from 'katex';
import {correctnessMarker,numberedTeachingWorking} from '../public/libs/maths-editor/teaching-style.mjs';
import {normalizeDocument,renderDocument} from '../public/libs/maths-editor/document-model.mjs';
import {repairAngle} from '../scripts/booklet/repair-angle-feedback.mjs';
test('correctness markers retain explicit role through normalization and print while multiplication keeps ordinary size',()=>{
 const doc=normalizeDocument({blocks:[{id:'p',type:'paragraph',inlines:[correctnessMarker(true),correctnessMarker(false),{type:'math',latex:'2\\times3'}]}]});
 const html=renderDocument(doc);assert.equal((html.match(/data-semantic-role="correctness-marker"/g)||[]).length,2);assert.equal((html.match(/font-size:14pt/g)||[]).length,2);assert.equal(doc.blocks[0].inlines[2].semanticRole,undefined);
});
test('numbered working uses independent number and relation columns including unnumbered continuations',()=>{
 const latex=numberedTeachingWorking([{number:1,lhs:'m+70+65',rhs:'=360'},{number:2,lhs:'m',rhs:'=225'},{number:null,lhs:'m',rhs:'=225'}]);
 assert.ok(latex.includes('alignedat}{2}'));assert.match(latex,/textcolor\{#ef6068\}\{\\mathrlap\{1\.\}/);assert.ok(!katex.renderToString(latex,{throwOnError:true}).includes('katex-error'));
});
test('local feedback repair preserves evidence and mathematics and is idempotent',()=>{
 const p=JSON.parse(fs.readFileSync('booklets/projects/angle-relationships-v1.json')),before=structuredClone(p.source);repairAngle(p);const once=JSON.stringify(p);repairAngle(p);assert.equal(JSON.stringify(p),once);assert.deepEqual(p.source,before);
 const blocks=p.sections.flatMap(s=>s.blocks),b=id=>blocks.find(b=>b.id===id);
 assert.equal(b('p29-q1').content.children[0].prompt.blocks[0].inlines[0].latex,'45+g=360');assert.equal(b('p46-teaching').flow.pageBreakBefore,true);
 const row=p.settings.layoutOverrides.blockLayouts['p67-q8'].arrangement.root.children.find(n=>n.id==='p67-q8-a-row');assert.equal(row.children[0].ref,'p67-q8-a/label');
 for(const row of p.settings.layoutOverrides.blockLayouts['p54-q2'].arrangement.root.children.filter(n=>n.direction==='row')){assert.equal(row.children[1].weight,46);assert.equal(row.children[2].weight,118);}
 assert.ok(!b('p38-q5').content.questionDiagrams[0].code.includes('\\mathbf'));
});
test('circle chord geometry keeps alternate angles at 57 degrees and parallel chord directions',()=>{
 const polar=d=>[Math.cos(d*Math.PI/180),Math.sin(d*Math.PI/180)],A=polar(130),B=polar(46),C=polar(-68),D=polar(244),v=(a,b)=>[b[0]-a[0],b[1]-a[1]],cross=(a,b)=>a[0]*b[1]-a[1]*b[0];assert.ok(Math.abs(cross(v(A,B),v(D,C)))<1e-10);
 const u=v(C,A),w=v(C,D),angle=Math.acos((u[0]*w[0]+u[1]*w[1])/Math.hypot(...u)/Math.hypot(...w))*180/Math.PI;assert.ok(Math.abs(angle-57)<1e-10);
});
