import test from 'node:test';
import assert from 'node:assert/strict';
import {dataGraph,measurementBarSource,buildMeasurementBar,pairTeachingBlocks} from '../scripts/booklet/graph-authoring.mjs';
import {readGraphModel} from '../src/lib/graph-model.js';
const bounds={xmin:0,xmax:6,ymin:0,ymax:10};

test('data graph helpers retain explicit scales, zero bins, series colour and black axes in editable models',()=>{
 const graph=dataGraph({id:'hist',kind:'histogram',bounds,bins:[{lower:0,upper:2,frequency:5},{lower:2,upper:4,frequency:0},{lower:4,upper:6,frequency:3}]});
 const model=readGraphModel(graph.code);assert.ok(model);assert.equal(model.bounds.xmax,6);assert.equal(model.axisTikz.match(/rectangle/g).length,2);assert.match(model.axisTikz,/axis cs:4,0/);assert.doesNotMatch(model.axisTikz,/fill/);
 const line=dataGraph({id:'change',kind:'line',bounds,points:[[0,2],[2,5],[6,8]]});assert.match(line.code,/axis line style=\{black/);assert.match(readGraphModel(line.code).axisTikz,/addplot\[blue/);
 assert.throws(()=>dataGraph({id:'bad',kind:'histogram',bounds,bins:[{lower:0,upper:2,frequency:5},{lower:4,upper:6,frequency:3}]}),/including zero/);
 assert.throws(()=>dataGraph({id:'bad',kind:'histogram',bounds,bins:[{lower:0,upper:2,frequency:5},{lower:2,upper:6,frequency:3}]}),/density model/);
 assert.throws(()=>dataGraph({id:'bad',kind:'ogive',bounds,points:[[0,2],[2,1]]}),/cannot decrease/);
 assert.throws(()=>dataGraph({id:'bad',kind:'line',bounds,points:[[0,2],[7,1]]}),/scale/);
});

test('teaching helper retains content and shared headers and rejects unrelated source activities',()=>{
 const worked={id:'w',sourceAtom:{label:'Worked Example'},content:{text:'Model'}},guided={id:'g',sourceAtom:{label:'Guided Practice'},content:{text:'Task'}};
 const pair=pairTeachingBlocks(worked,guided);assert.equal(pair[0].pairedBlockId,'g');assert.deepEqual(pair[1],guided);assert.equal(worked.pairedBlockId,undefined);
 assert.throws(()=>pairTeachingBlocks({...worked,sourceAtom:{label:'Activity'}},guided),/activity identities/);
});

test('measurement builder uses actual compiled bounds and rejects width caps that shrink the target',async()=>{
 const spec={id:'measure',lengthMm:100,parts:[{proportion:.4,label:'A'},{proportion:.6,label:'B'}]};
 const source=measurementBarSource(spec);assert.equal(source.widthMm,undefined);assert.match(source.code,/rectangle \(100,12\)/);assert.doesNotMatch(source.code,/fill=/);
 const browser={newPage:async()=>({setContent:async()=>{},evaluate:async()=>({frame:292,bar:284}),close:async()=>{}})},compile=async()=>({svg:'<svg/>'});
 const built=await buildMeasurementBar(spec,{browser,compile});assert.equal(built.diagram.widthMm,100*292/284);assert.equal(built.calibration.finalPageReviewRequired,true);
 await assert.rejects(buildMeasurementBar(spec,{browser,compile,availableWidthMm:90}),/instead of shrinking/);
 assert.throws(()=>measurementBarSource({...spec,parts:[{proportion:.9}]}),/sum to one/);
});
