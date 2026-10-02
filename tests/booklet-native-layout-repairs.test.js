import test from 'node:test';
import assert from 'node:assert/strict';
import {arrangementRowChildren} from '../src/lib/booklet-arrangement.js';
import {renderDocument,normalizeDocument} from '../public/libs/maths-editor/document-model.mjs';
const paragraph={id:'given',type:'paragraph',inlines:[{type:'math',latex:'n=5'}]};
const table=id=>({id,type:'table',widthMm:12,marginBefore:0,marginAfter:0,rows:[[{id:id+'-cell',type:'cell',blocks:[paragraph]}]]});
test('matching endpoints remain in the row while a leading question label uses its gutter',()=>{
 const entries=new Map([['stem',{kind:'text'}],['letter',{kind:'label'}],['part',{kind:'label'}]]);
 const row={children:[{ref:'part'},{ref:'stem'},{ref:'letter'}]};
 assert.deepEqual(arrangementRowChildren(row,entries),row.children.slice(1));
 assert.deepEqual(arrangementRowChildren({children:row.children.slice(1)},entries),row.children.slice(1));
});
test('one-slot mathematical bubbles have a frame and retain the complete editable given',()=>{
 const block={id:'bubble',type:'layout',arrangement:'speech-bubble',columns:1,slots:[{id:'given-slot',blocks:[paragraph]}]};
 const doc={format:'maths-editor-document-v1',version:1,blocks:[block]},html=renderDocument(doc);
 assert.match(html,/data-slot="given-slot"[^>]*border:\.4mm solid #000000/);
 assert.match(html,/n=5/);assert.doesNotMatch(html,/grid-template-columns:17mm/);
 assert.deepEqual(normalizeDocument(normalizeDocument(doc)),normalizeDocument(doc));
});
test('portrait bubbles retain their separate portrait track and framed statement',()=>{
 const html=renderDocument({blocks:[{id:'b',type:'layout',arrangement:'speech-bubble',slots:[{id:'portrait',blocks:[{id:'photo',type:'image',src:'/portrait.png',width:17,aspectRatio:1.2}]},{id:'statement',blocks:[paragraph]}]}]});
 assert.match(html,/grid-template-columns:17mm minmax\(0,1fr\)/);
 assert.match(html,/data-slot="statement"[^>]*border:\.4mm solid #24282d/);
 assert.match(html,/portrait\.png/);assert.match(html,/n=5/);
});
test('nested diagram tables follow their parent cell alignment while standalone tables retain their margin',()=>{
 for(const align of ['left','center','right']){
  const inner=table('inner'),outer=table('outer');outer.rows[0][0].align=align;outer.rows[0][0].blocks=[inner];
  const html=renderDocument({blocks:[outer]}),expected=align==='center'?'0mm auto 0mm auto':align==='right'?'0mm 0 0mm auto':'0mm 0 0mm 0';
  assert.ok(html.includes('margin:'+expected),align);
  assert.match(renderDocument({blocks:[inner]}),/margin:0mm 0 0mm 0/);
 }
});
