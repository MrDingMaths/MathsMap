import test from 'node:test';import assert from 'node:assert/strict';
import {tableArrowGeometry,tableCircleGeometry} from '../public/libs/maths-editor/table-annotations.mjs';
import {normalizeDocument,renderDocument} from '../public/libs/maths-editor/document-model.mjs';
const a={left:0,top:20,width:40,height:30,bottom:50},b={left:40,top:20,width:40,height:30,bottom:50};
test('hierarchy arrows stay between category rows and approach the facing destination edge',()=>{
 const parent={left:70,top:0,width:40,height:20,bottom:20};
 const child={left:0,top:50,width:40,height:24,bottom:74};
 for(const [from,to,side,sign]of [[parent,child,'bottom',1],[child,parent,'top',-1]]){
  const arrow=tableArrowGeometry(from,to,{side,cellId:'parent',toCellId:'child',distanceMm:20,curveMm:30});
  const low=side==='bottom'?from.bottom:to.bottom,high=side==='bottom'?to.top:from.top;
  for(const point of [arrow.start,...arrow.controls,arrow.end])assert.ok(point[1]>low&&point[1]<high,'Connector must clear both category boxes and their text');
  assert.ok(sign*(arrow.end[1]-arrow.start[1])>0,'Arrow must progress toward the destination');
  const vertices=arrow.endHead.match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi).map(Number);
  assert.ok(sign*(vertices[1]-vertices[3])>0,'Head must point toward the destination');
 }
});
test('hierarchy clearance cannot reverse a short connector and adjacent-row arrows retain legacy geometry',()=>{
 const source={left:0,top:0,width:40,height:20,bottom:20};
 const tinyGap={left:60,top:20.02,width:40,height:20,bottom:40.02};
 const arrow=tableArrowGeometry(source,tinyGap,{side:'bottom',cellId:'a',toCellId:'b',distanceMm:20});
 assert.ok(arrow.start[1]<arrow.end[1]);assert.ok(arrow.start[1]>20&&arrow.end[1]<20.02);
 assert.ok([arrow.start,...arrow.controls,arrow.end].flat().every(Number.isFinite));
 const adjacent={...tinyGap,top:20,bottom:40};
 const legacy=tableArrowGeometry(source,adjacent,{side:'bottom',cellId:'a',toCellId:'b'});
 assert.equal(legacy.start[1],23);assert.equal(legacy.end[1],43);
 const noise=tableArrowGeometry(source,{...adjacent,top:20.005},{side:'bottom',cellId:'a',toCellId:'b'});
 assert.deepEqual(noise,legacy);
});
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

const operationRailMm=96/25.4;
const operationRailTolerance=1e-8;
function operationRailClose(actual,expected){
 assert.ok(Math.abs(actual-expected)<operationRailTolerance,`${actual} should equal ${expected}`);
}
function operationRailHeadPoints(path){
 const coordinates=path.match(/[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi).map(Number);
 assert.equal(coordinates.length,6,'an arrowhead must contain three finite vertices');
 assert.ok(coordinates.every(Number.isFinite));
 return Array.from({length:3},(_,index)=>coordinates.slice(index*2,index*2+2));
}

for(const widthMm of [12,9.12]){
 test(`labelled operation rails stay bounded and mirrored at ${widthMm} mm`,()=>{
  const width=widthMm*operationRailMm,rowHeight=12*operationRailMm,tableWidth=100*operationRailMm,trim=1.5*operationRailMm;
  const cell=(left,row)=>({left,top:row*rowHeight,width,height:rowHeight,bottom:(row+1)*rowHeight});
  const annotation={side:'middle',label:'÷(−4)',distanceMm:1.5,curveMm:.5};
  const rails=[0,tableWidth-width].map(left=>{
   let previousMaxY=-Infinity;
   return Array.from({length:3},(_,row)=>{
    const from=cell(left,row),to=cell(left,row+1),g=tableArrowGeometry(from,to,annotation);
    const fromCentre=from.top+rowHeight/2,toCentre=to.top+rowHeight/2;
    operationRailClose(toCentre-fromCentre,12*operationRailMm);
    assert.match(g.path,/\bC\b/,'labelled vertical rails must use the curved branch');
    assert.equal(g.controls.length,2);
    const startHead=operationRailHeadPoints(g.startHead),endHead=operationRailHeadPoints(g.endHead);
    const curvePoints=[g.start,...g.controls,g.end];
    const points=[...curvePoints,...startHead,...endHead];
    for(const [x,y] of points){
     assert.ok(Number.isFinite(x)&&Number.isFinite(y));
     assert.ok(x>=left-operationRailTolerance&&x<=left+width+operationRailTolerance,'curve and heads must remain inside the physical rail');
     assert.ok(y>fromCentre&&y<toCentre,'each step must remain between its row centres');
    }
    operationRailClose(g.start[1]-fromCentre,trim);
    operationRailClose(toCentre-g.end[1],trim);
    assert.ok(g.start[1]<g.controls[0][1]&&g.controls[0][1]<g.controls[1][1]&&g.controls[1][1]<g.end[1],'the curve must progress downward');
    operationRailClose(startHead[0][0],g.start[0]);operationRailClose(startHead[0][1],g.start[1]);
    operationRailClose(endHead[0][0],g.end[0]);operationRailClose(endHead[0][1],g.end[1]);
    assert.ok(endHead.slice(1).every(point=>point[1]<endHead[0][1]),'the final arrowhead must point downward');
    assert.ok(previousMaxY<Math.min(...points.map(point=>point[1])),'successive curves and heads must stay separated');
    previousMaxY=Math.max(...points.map(point=>point[1]));
    const curveMinX=Math.min(...curvePoints.map(point=>point[0])),curveMaxX=Math.max(...curvePoints.map(point=>point[0]));
    assert.ok(g.labelX>left&&g.labelX<left+width);
    assert.ok(left===0?g.labelX<curveMinX:g.labelX>curveMaxX,'the label centre must lie outside the curve band');
    assert.ok(g.labelY>g.start[1]&&g.labelY<g.end[1]);
    // A centre outside the curve band does not prove clearance for rendered glyphs.
    return g;
   });
  });
  for(let row=0;row<3;row++){
   const left=rails[0][row],right=rails[1][row];
   for(const [leftPoint,rightPoint] of [[left.start,right.start],...left.controls.map((point,index)=>[point,right.controls[index]]),[left.end,right.end]]){
    operationRailClose(leftPoint[0]+rightPoint[0],tableWidth);
    operationRailClose(leftPoint[1],rightPoint[1]);
   }
   operationRailClose(left.labelX+right.labelX,tableWidth);
   operationRailClose(left.labelY,right.labelY);
  }
  for(const steps of rails){
   assert.ok(steps[2].end[1]<3.5*rowHeight,'the final endpoint must precede the final row centre');
  }
 });
}

test('source 58 operation notation and rail identities survive normalization and save/reopen',()=>{
 const rows=Array.from({length:4},(_,row)=>['first','value-a','value-b','last'].map(column=>({id:`${column}-${row}`,blocks:[]})));
 const labels=['×2','÷(−4)','+3'];
 const annotations=['first','last'].flatMap(rail=>labels.map((label,row)=>({id:`${rail}-step-${row}`,type:'arrow',side:'middle',cellId:`${rail}-${row}`,toCellId:`${rail}-${row+1}`,label,distanceMm:1.5,curveMm:.5})));
 const doc=normalizeDocument({blocks:[{id:'operation-table',type:'table',rows,annotations}]});
 const reopened=normalizeDocument(JSON.parse(JSON.stringify(doc)));
 assert.deepEqual(reopened,doc);
 for(const candidate of [doc,reopened]){
  const table=candidate.blocks[0];
  assert.equal(table.id,'operation-table');
  assert.deepEqual(table.rows.map(row=>row.map(cell=>cell.id)),rows.map(row=>row.map(cell=>cell.id)));
  assert.equal(table.annotations.length,annotations.length);
  for(const expected of annotations){
   const actual=table.annotations.find(annotation=>annotation.id===expected.id);
   assert.ok(actual,`missing annotation ${expected.id}`);
   assert.deepEqual(Object.fromEntries(Object.keys(expected).map(key=>[key,actual[key]])),expected);
  }
  assert.equal(table.annotations.filter(annotation=>annotation.label==='÷(−4)').length,2);
 }
});

test('unlabelled vertical and labelled horizontal middle arrows retain straight geometry',()=>{
 const width=12*operationRailMm,rowHeight=12*operationRailMm;
 const from={left:0,top:0,width,height:rowHeight,bottom:rowHeight};
 const below={...from,top:rowHeight,bottom:2*rowHeight};
 const alongside={...from,left:width};
 const annotation={side:'middle',distanceMm:1.5,curveMm:.5};
 const vertical=tableArrowGeometry(from,below,annotation);
 assert.deepEqual(tableArrowGeometry(from,below,{...annotation,label:' \t '}),vertical);
 assert.deepEqual(vertical.controls,[]);
 assert.match(vertical.path,/\bL\b/);assert.doesNotMatch(vertical.path,/\bC\b/);
 operationRailClose(vertical.start[0],width/2);operationRailClose(vertical.end[0],width/2);
 operationRailClose(vertical.start[1]-rowHeight/2,1.5*operationRailMm);
 operationRailClose(1.5*rowHeight-vertical.end[1],1.5*operationRailMm);
 assert.ok(vertical.start[1]<vertical.end[1]);
 const horizontal=tableArrowGeometry(from,alongside,{...annotation,label:'÷(−4)'});
 assert.deepEqual(horizontal,tableArrowGeometry(from,alongside,annotation));
 assert.deepEqual(horizontal.controls,[]);
 assert.match(horizontal.path,/\bL\b/);assert.doesNotMatch(horizontal.path,/\bC\b/);
 operationRailClose(horizontal.start[1],rowHeight/2);operationRailClose(horizontal.end[1],rowHeight/2);
 operationRailClose(horizontal.start[0]-width/2,1.5*operationRailMm);
 operationRailClose(1.5*width-horizontal.end[0],1.5*operationRailMm);
 assert.ok(horizontal.start[0]<horizontal.end[0]);
});
