import test from 'node:test';import assert from 'node:assert/strict';
import {tableArrowGeometry,tableCircleGeometry} from '../public/libs/maths-editor/table-annotations.mjs';
import {normalizeDocument,renderDocument} from '../public/libs/maths-editor/document-model.mjs';
const a={left:0,top:20,width:40,height:30,bottom:50},b={left:40,top:20,width:40,height:30,bottom:50};
test('physical circle outlines can enclose complete calculator labels and survive save/reopen',()=>{
 const doc=normalizeDocument({blocks:[{id:'t',type:'table',annotations:[{id:'key',type:'circle',cellId:'a',widthMm:10,heightMm:7}],rows:[[{id:'a',blocks:[]}]]}]});
 const annotation=doc.blocks[0].annotations[0];
 assert.equal(annotation.widthMm,10);assert.equal(annotation.heightMm,7);
 assert.deepEqual(normalizeDocument(JSON.parse(JSON.stringify(doc))),doc);
 const geometry=tableCircleGeometry(a,annotation);
 assert.ok(Math.abs(geometry.rx*2*25.4/96-10)<1e-9);
 assert.ok(Math.abs(geometry.ry*2*25.4/96-7)<1e-9);
 assert.deepEqual(tableCircleGeometry(a),{rx:12,ry:11.4});
});
test('between-cell arrows connect the correct row and leave both values clear',()=>{
 const g=tableArrowGeometry(a,b,{side:'middle',distanceMm:2.5});
 assert.equal(g.start[1],35);assert.equal(g.end[1],35);
 assert.ok(g.start[0]>29&&g.start[0]<30);assert.ok(g.end[0]>50&&g.end[0]<51);
 assert.equal(g.labelX,40);assert.ok(g.labelY+5<35);
 const diagonal=tableArrowGeometry(b,{...a,top:50,bottom:80},{side:'middle'});
 assert.ok(diagonal.start[0]>diagonal.end[0]);assert.ok(diagonal.start[1]<diagonal.end[1]);
 assert.ok(diagonal.start[1]>35&&diagonal.end[1]<65);
});
test('middle anchors survive native editing and do not reserve outside-table arrow space',()=>{
 const doc=normalizeDocument({blocks:[{id:'t',type:'table',marginBefore:2,marginAfter:2,annotations:[{id:'sum',type:'arrow',side:'middle',cellId:'a',toCellId:'b',label:'+',distanceMm:3}],rows:[[{id:'a',blocks:[]},{id:'b',blocks:[]}]]}]});
 assert.deepEqual(normalizeDocument(JSON.parse(JSON.stringify(doc))),doc);
 assert.equal(doc.blocks[0].annotations[0].side,'middle');
 assert.ok(renderDocument(doc).includes('margin:2mm 0 2mm'));
 const top=tableArrowGeometry(a,b,{side:'top'}),bottom=tableArrowGeometry(a,b,{side:'bottom'});
 assert.equal(top.start[1],17);assert.equal(bottom.start[1],53);assert.equal(top.controls.length,2);assert.equal(bottom.controls.length,2);
});

test('boxed maths anchors persist without changing ordinary cell arrows',()=>{
 const doc=normalizeDocument({blocks:[{id:'t',type:'table',annotations:[{id:'arrow',type:'arrow',cellId:'a',toCellId:'b',side:'top',startAnchor:'math-box',endAnchor:'math-box',distanceMm:0,curveMm:4}],rows:[[{id:'a',blocks:[]},{id:'b',blocks:[]}]]}]});
 assert.deepEqual(normalizeDocument(JSON.parse(JSON.stringify(doc))),doc);
 const n=doc.blocks[0].annotations[0];assert.equal(n.startAnchor,'math-box');assert.equal(n.endAnchor,'math-box');assert.equal(n.distanceMm,0);
 const measured={left:5,top:24,width:30,height:10,bottom:34};
 const g=tableArrowGeometry(measured,{...measured,left:45,top:29},n);assert.equal(g.start[1],24);assert.equal(g.end[1],29);
 assert.equal(tableArrowGeometry(a,b,{side:'top'}).start[1],17);
});
