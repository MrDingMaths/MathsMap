import test from 'node:test';
import assert from 'node:assert/strict';
import {findLayoutFaults,newLayoutFaults,rememberFaults} from '../src/lib/booklet-layout-faults.js';

const PX=96/25.4;
const rect=(l,t,r,b)=>({left:l,top:t,right:r,bottom:b,width:r-l,height:b-t});
// A fake page: 210 mm wide, body from 15 mm to 195 mm. Elements are plain objects with a rect and parent links.
function el(box,{question,arr=true,children=[]}={}){
 const node={box,dataset:question?{questionId:question}:(arr?{arrangementId:'cell'}:{}),children,parent:null,
  getBoundingClientRect:()=>box,parentElement:null,matches:()=>false,closest:()=>null,
  contains:other=>{for(let n=other;n;n=n.parentElement)if(n===node)return true;return false;},
  querySelectorAll:()=>[],_arr:arr};
 children.forEach(c=>{c.parentElement=node;});
 return node;
}
function page(questions){
 const all=(n,out=[])=>{for(const c of n.children){out.push(c);all(c,out);}return out;};
 const main={getBoundingClientRect:()=>rect(15*PX,0,195*PX,1000),querySelectorAll:sel=>{
  const nodes=questions.flatMap(q=>[q,...all(q)]);
  return sel==='[data-question-id]'?nodes.filter(n=>n.dataset.questionId):nodes.filter(n=>n._arr);
 }};
 // question.querySelectorAll must list its arrangement descendants
 questions.forEach(q=>{q.querySelectorAll=()=>all(q).filter(n=>n._arr);});
 const paper={getBoundingClientRect:()=>rect(0,0,210*PX,297*PX),querySelector:s=>s==='main'?main:null};
 return {querySelector:s=>s==='.booklet-page'?paper:null};
}
const mm=(l,t,r,b)=>rect(l*PX,t*PX,r*PX,b*PX);
const question=(cells,id='q')=>el(mm(15,10,195,60),{question:id,children:cells.map(c=>c.box?c:el(c))});

test('a question whose columns stay inside the margins and do not touch has no faults',()=>{
 const root=page([question([mm(15,10,100,60),mm(105,10,195,60)])]);
 assert.deepEqual(findLayoutFaults(root),[]);
});

test('content past the page margin is a margin-overflow',()=>{
 const root=page([question([mm(15,10,100,60),mm(105,10,203,60)])]);
 const faults=findLayoutFaults(root);
 assert.deepEqual(faults.map(f=>[f.id,f.kind]),[['q','margin-overflow']]);
});

test('columns that intersect are a column-overlap',()=>{
 const root=page([question([mm(15,10,110,60),mm(100,10,195,60)])]);
 assert.deepEqual(findLayoutFaults(root).map(f=>f.kind),['column-overlap']);
});

test('columns that only touch, or overlap by a hairline, are fine',()=>{
 const root=page([question([mm(15,10,100,60),mm(100,10,195,60)]),question([mm(15,70,100,90),mm(99.5,70,195,90)],'r')]);
 assert.deepEqual(findLayoutFaults(root),[]);
});

test('a fault message is stable so the same fault compares equal between trials',()=>{
 const make=()=>page([question([mm(15,10,110,60),mm(100,10,195,60)])]);
 assert.deepEqual(findLayoutFaults(make()),findLayoutFaults(make()));
});

test('only faults the booklet did not already have count as new',()=>{
 const known=rememberFaults(new Set(),{layoutFaults:[{id:'a',kind:'margin-overflow'}]});
 const result={layoutFaults:[{id:'a',kind:'margin-overflow'},{id:'b',kind:'column-overlap'},{id:'a',kind:'column-overlap'}]};
 assert.deepEqual(newLayoutFaults(known,result).map(f=>f.id+':'+f.kind),['b:column-overlap','a:column-overlap']);
 assert.deepEqual(newLayoutFaults(known,{}),[]);
});

test('a picture drawn over its own table is not a column overlap, but still counts for the margin',()=>{
 const table=el(mm(22,20,106,66),{arr:true}),svg=el(mm(22,20,106,66),{arr:false});
 table.dataset={};svg.dataset={};
 assert.deepEqual(findLayoutFaults(page([question([table,svg])])),[]);
});
