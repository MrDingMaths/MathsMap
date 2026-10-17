import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeDocument,fromSource,renderDocument,paragraph} from '../public/libs/maths-editor/document-model.mjs';
import {locateDocumentNode,removeDocumentNode,transformDocumentLayout} from '../public/libs/maths-editor/document-operations.mjs';
import {hasVisibleContent} from '../src/lib/document-content.js';
import {createEditableProject} from '../src/lib/editable-booklet-model.js';
import {bookletLayoutSelection,applyBookletLayout,containerSpacingFields} from '../src/lib/booklet-direct-layout.js';
import {arrangementItems} from '../public/libs/maths-editor/arrangement-model.mjs';
import {resolveArrangement} from '../src/lib/booklet-arrangement.js';
const p=(id,text=id)=>({...paragraph([{type:'text',text,marks:[]}]),id});
const nested=()=>normalizeDocument({blocks:[{id:'layout',type:'layout',columns:2,slots:[{id:'left',blocks:[p('a'),p('b')]},{id:'right',blocks:[{id:'table',type:'table',rows:[[{id:'cell',blocks:[p('cell-p')]}]]}]}]},p('last')]});

test('selected container spacing edits renderer fields without changing nested content or surrounding arrangement',()=>{
 const project=createEditableProject({id:'container',title:'Container',sections:[{id:'s',title:'Theory',blocks:[{id:'b',type:'callout',content:nested()}]}]});
 const resolved=resolveArrangement(project.sections[0].blocks[0]),item=arrangementItems(resolved.tree.root).find(i=>resolved.entries.get(i.ref)?.value?.blocks?.[0]?.id==='layout'),selection={blockId:'b',id:item.id};
 let next=applyBookletLayout(project,selection,'document-spacing',{property:'padding',value:0});
 next=applyBookletLayout(next,selection,'document-spacing',{property:'margin',value:0});
 const doc=next.sections[0].blocks[0].content;
 assert.equal(doc.blocks[0].padding,0);assert.equal(doc.blocks[0].margin,0);
 assert.deepEqual(doc.blocks[0].slots,project.sections[0].blocks[0].content.blocks[0].slots);
 assert.deepEqual(bookletLayoutSelection(next,selection).tree,resolved.tree);
 assert.match(renderDocument(doc),/margin:0mm 0;padding:0mm/);
 for(const options of [{property:'spaceBefore',value:0},{property:'padding',value:-1},{property:'padding',value:21},{property:'padding',value:NaN}])assert.throws(()=>applyBookletLayout(project,selection,'document-spacing',options),/supported container spacing/);
 assert.deepEqual(containerSpacingFields({type:'layout',arrangement:'speech-bubble'}).map(f=>f[0]),['margin','paddingHorizontalMm','paddingVerticalMm']);
});

test('main-panel spacing fields match rendered document types and their limits',()=>{
 for(const [type,property,value,pattern]of [['paragraph','indent',8,/padding-left:8mm/],['spacer','height',22,/height:22mm/],['list','indent',9,/padding-left:9mm/],['image','spaceAfter',5,/margin-bottom:5mm/],['table','marginBefore',0,/margin:0mm/]]){
  const nodes={paragraph:p('node'),spacer:{id:'node',type:'spacer',height:15},list:{id:'node',type:'list',items:[{id:'li',blocks:[p('list-p')]}]},image:{id:'node',type:'image',src:'data:image/png;base64,AA=='},table:{id:'node',type:'table',rows:[[{id:'cell',blocks:[p('cell-p')]}]]}};
  const project=createEditableProject({id:'fields',title:'Fields',sections:[{id:'s',title:'Theory',blocks:[{id:'b',type:'callout',content:normalizeDocument({blocks:[nodes[type]]})}]}]});
  const resolved=resolveArrangement(project.sections[0].blocks[0]),selection={blockId:'b',id:arrangementItems(resolved.tree.root)[0].id};
  const next=applyBookletLayout(project,selection,'document-spacing',{property,value});
  assert.match(renderDocument(next.sections[0].blocks[0].content),pattern);
 }
 assert.equal(containerSpacingFields({type:'paragraph'}).find(f=>f[0]==='lineHeight')[3],3);
 assert.deepEqual(containerSpacingFields({type:'layout',arrangement:'scaffold',slots:[{},{}]}).map(f=>f[0]),['margin','padding','gap']);
 assert.deepEqual(containerSpacingFields({type:'layout',arrangement:'cards',slots:[{},{}]}).map(f=>f[0]),['margin','padding','paddingHorizontalMm','paddingVerticalMm','gap']);
});

test('optional speech and card frame padding preserves old output and supports zero without migration',()=>{
 for(const [arrangement,labelled,multiple,original]of [['speech-bubble',false,false,'padding:2mm 4mm'],['speech-bubble',false,true,'padding:4mm;'],['cards',true,true,'padding:2mm;'],['cards',false,true,'padding:2mm;']]){
  const raw={blocks:[{id:'frame',type:'layout',arrangement,columns:multiple?2:1,slots:Array.from({length:multiple?2:1},(_,i)=>({id:'slot-'+i,...(labelled?{label:String(i+1)}:{}),blocks:[p('text-'+i)]}))}]};
  const doc=normalizeDocument(raw);assert.equal(Object.hasOwn(doc.blocks[0],'paddingHorizontalMm'),false);assert.equal(Object.hasOwn(doc.blocks[0],'paddingVerticalMm'),false);
  assert.ok(renderDocument(doc).includes(original));
  const overridden=normalizeDocument({blocks:[{...doc.blocks[0],paddingHorizontalMm:0,paddingVerticalMm:1}]});
  assert.ok(renderDocument(overridden).includes('padding:1mm 0mm'));
  assert.deepEqual(overridden.blocks[0].slots,doc.blocks[0].slots);
 }
});

test('selected-group answer heights update both saved arrangement and response overrides without changing answers',()=>{
 const project=createEditableProject({id:'spaces',title:'Spaces',sections:[{id:'s',title:'Exercise',blocks:[{id:'q',type:'question',content:{id:'root',children:[{id:'a',label:'a',prompt:'First',answerSpaceMm:20,answer:{short:'1',worked:'One'}},{id:'b',label:'b',prompt:'Second',answerSpaceMm:25,answer:{short:'2',worked:'Two'}}]}}]}]});
 const selection={blockId:'q',id:'root:parts'},state=bookletLayoutSelection(project,selection);
 assert.equal(state.spaces.length,2);assert.equal(state.spaceHeight,'');
 const next=applyBookletLayout(project,selection,'answer-spaces',{value:12});
 assert.equal(bookletLayoutSelection(next,selection).spaceHeight,12);
 assert.equal(next.settings.layoutOverrides.answerSpaces.a,12);assert.equal(next.settings.layoutOverrides.answerSpaces.b,12);
 assert.deepEqual(next.sections,project.sections);
});
test('intentional blank lines survive normalization and rendering; placeholders collapse',()=>{
 const blank=normalizeDocument({blocks:[{...p('blank',''),preserveEmpty:true}]}),placeholder=fromSource('');
 assert.equal(hasVisibleContent(blank),true);assert.equal(hasVisibleContent(placeholder),false);assert.match(renderDocument(blank),/data-preserve-empty="true"/);
 const block={id:'theory',type:'callout',content:blank};assert.equal(resolveArrangement(block).entries.size,1);
});
test('nested deletion removes only selected content, keeping editable containers',()=>{
 const doc=nested();removeDocumentNode(doc,'a');assert.ok(!locateDocumentNode(doc,'a'));assert.ok(locateDocumentNode(doc,'b'));
 removeDocumentNode(doc,'cell-p');assert.equal(locateDocumentNode(doc,'cell').node.blocks.length,1);assert.ok(!locateDocumentNode(doc,'cell').node.blocks[0].preserveEmpty);
 removeDocumentNode(doc,'table');assert.ok(!locateDocumentNode(doc,'table'));assert.ok(locateDocumentNode(doc,'last'));assert.doesNotThrow(()=>normalizeDocument(doc));
});
test('nested reposition, grouping and ungrouping retain every content ID once',()=>{
 const doc=nested();transformDocumentLayout(doc,'b','before');assert.deepEqual(locateDocumentNode(doc,'left').node.blocks.map(n=>n.id),['b','a']);
 const group=transformDocumentLayout(doc,'a','group',{ids:['a','b']});transformDocumentLayout(doc,group,'direction',{value:'row'});assert.equal(locateDocumentNode(doc,group).node.columns,2);
 transformDocumentLayout(doc,group,'ungroup');assert.deepEqual(locateDocumentNode(doc,'left').node.blocks.map(n=>n.id),['b','a']);
 transformDocumentLayout(doc,'a','full-width');assert.deepEqual(doc.blocks.map(n=>n.id),['layout','a','last']);assert.doesNotThrow(()=>normalizeDocument(doc));
});
test('native image/text side-by-side placement retains column alignment after normalization',()=>{
 const doc=normalizeDocument({blocks:[p('text'),p('picture')]});transformDocumentLayout(doc,'picture','move',{targetId:'text',position:'right'});transformDocumentLayout(doc,'picture','vertical',{value:'middle'});
 const saved=normalizeDocument(doc);assert.equal(saved.blocks[0].slots[1].verticalAlign,'middle');assert.match(renderDocument(saved),/align-self:center/);
 assert.throws(()=>transformDocumentLayout(doc,doc.blocks[0].id,'move',{targetId:'picture'}),/outside/);
});
test('direct teaching arrangements reorder and align without changing content or existing layout',()=>{
 const project=createEditableProject({id:'direct',title:'Direct',sections:[{id:'s',title:'Theory',blocks:[{id:'b',type:'callout',content:normalizeDocument({blocks:[p('one'),p('two')]})}]}]});
 const initial=resolveArrangement(project.sections[0].blocks[0]),items=arrangementItems(initial.tree.root),sel={blockId:'b',id:items[1].id};
 const beside=applyBookletLayout(project,sel,'beside',{targetId:items[0].id,side:'right'}),middle=applyBookletLayout(beside,sel,'properties',{verticalAlign:'middle'});
 assert.deepEqual(middle.sections,project.sections);assert.equal(bookletLayoutSelection(middle,sel).verticalAlign,'middle');assert.equal(arrangementItems(bookletLayoutSelection(middle,sel).tree.root).length,2);
 const removed=applyBookletLayout(middle,sel,'delete');assert.equal(removed.sections[0].blocks[0].content.blocks.length,1);assert.equal(removed.sections[0].blocks[0].content.blocks[0].id,'one');
});

test('native moves enter a group and promote an inline image without cloning identities',()=>{
 const doc=normalizeDocument({blocks:[{...p('prose'),inlines:[{type:'text',text:'Before '},{id:'photo',type:'inline-image',src:'/example.png',width:30},{type:'text',text:' after'}]},{id:'target',type:'layout',columns:1,slots:[{id:'slot',blocks:[p('destination')]}]}]});
 transformDocumentLayout(doc,'photo','move',{targetId:'target',position:'inside'});
 assert.equal(locateDocumentNode(doc,'slot').node.blocks.at(-1).id,'photo');
 assert.equal(locateDocumentNode(doc,'photo').node.type,'image');
 assert.equal(locateDocumentNode(doc,'prose').node.inlines[0].text,'Before ');
 assert.doesNotThrow(()=>normalizeDocument(doc));
});
