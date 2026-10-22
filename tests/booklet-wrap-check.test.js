import test from 'node:test';
import assert from 'node:assert/strict';
import {wrappedFindings,estimateMathWidthMm,containerWidthMm,estimatedWraps,pathTo,wrapFix,WRAP_STEPS} from '../src/lib/booklet-wrap-check.js';

const row=(over={})=>({block:'q1',node:'q1-a',latex:'x=\\frac{a}{b}',lines:2,widthMm:60,containerMm:55,page:3,...over});

test('only formulas that wrapped without a break the author wrote are findings',()=>{
 const owner=id=>({q1:'q1','q1-a':'q1'}[id]??null);
 const found=wrappedFindings([row(),row({node:'q1-b',latex:'a\\\\b'}),row({node:'q1-c',lines:1}),row({block:'zz',node:'zz'})],{ownerOf:owner});
 assert.deepEqual(found.map(f=>f.nodeId),['q1-a']);
 assert.match(found[0].detail,/wraps onto 2 lines/);
 assert.equal(wrappedFindings([row(),row()],{ownerOf:owner}).length,1,'a formula seen twice is one finding');
});

test('the width of a formula counts boxes at their stated size and fractions at the wider half',()=>{
 assert.ok(estimateMathWidthMm('\\frac{12345}{1}')<estimateMathWidthMm('12345+12345'));
 assert.ok(estimateMathWidthMm('x=\\boxed{\\rule{0pt}{5mm}\\hspace{20mm}}')>=20);
 assert.equal(estimateMathWidthMm(''),0);
});

test('a column grid divides the width a formula has',()=>{
 const block={id:'b',type:'question',content:{id:'root',type:'question',layout:'grid',columns:3,children:[{id:'a',type:'question',prompt:{blocks:[{id:'p',type:'paragraph'}]}}]}};
 assert.ok(containerWidthMm(block,'p')<containerWidthMm({...block,content:{...block.content,columns:1}},'p'));
 assert.deepEqual(pathTo({content:block.content},'p').map(n=>n.id).filter(Boolean),['root','a','p']);
 assert.equal(pathTo({content:block.content},'missing'),null);
});

test('estimated wraps are conservative: a long formula in a narrow column, not a short one',()=>{
 const doc=latex=>({format:'maths-editor-document-v1',blocks:[{id:'par',type:'paragraph',inlines:[{id:'m',type:'math',latex}]}]});
 const project=latex=>({sections:[{blocks:[{id:'b',type:'question',content:{id:'root',type:'question',layout:'grid',columns:3,prompt:doc(latex)}}]}]});
 assert.equal(estimatedWraps(project('x+1=3')).length,0);
 assert.equal(estimatedWraps(project('a_1+a_2+a_3+a_4+a_5+a_6+a_7+a_8+a_9+a_{10}+a_{11}+a_{12}+a_{13}')).length,1);
 assert.equal(estimatedWraps(project('a_1+a_2+a_3+a_4+a_5+a_6+a_7+a_8+a_9+a_{10}+a_{11}+a_{12}+a_{13}\\\\b')).length,0,'an authored break is not a wrap');
});

const gridProject=()=>({settings:{layoutOverrides:{blockLayouts:{b:{arrangement:{version:1,root:{id:'root',type:'group',direction:'stack',children:[{id:'row',type:'group',direction:'row',children:[{id:'i1',type:'item',ref:'b-a/prompt#par',width:80},{id:'i2',type:'item',ref:'b-b/prompt#par2',width:80}]}]}}}}}},
 sections:[{blocks:[{id:'b',type:'question',content:{id:'b-root',type:'question',layout:'grid',columns:3,children:[{id:'b-a',type:'question',diagramPlacement:'beside-prompt',questionDiagrams:[{id:'d'}],prompt:{blocks:[{id:'par',type:'paragraph'}]}}]}}]}]});

test('the three fixes, in the teacher\'s order',()=>{
 assert.deepEqual([...WRAP_STEPS],['columns','diagram-placement','widen']);
 const finding={blockId:'b',nodeId:'par'};
 const one=wrapFix('columns',gridProject(),finding);
 assert.equal(one.project.sections[0].blocks[0].content.columns,2);
 assert.match(one.change,/columns 3 -> 2/);
 const two=wrapFix('columns',{...gridProject(),sections:[{blocks:[{...gridProject().sections[0].blocks[0],content:{...gridProject().sections[0].blocks[0].content,columns:2}}]}]},finding);
 assert.equal(two.project.sections[0].blocks[0].content.layout,'list','one column left is a list');
 const placed=wrapFix('diagram-placement',gridProject(),finding);
 assert.equal(placed.project.sections[0].blocks[0].content.children[0].diagramPlacement,'before-prompt');
 const wider=wrapFix('widen',gridProject(),{blockId:'b',nodeId:'par'});
 const items=wider.project.settings.layoutOverrides.blockLayouts.b.arrangement.root.children[0].children;
 assert.ok(items[0].width>80&&items[1].width<80,'the column grows at its sibling\'s expense');
 assert.equal(gridProject().settings.layoutOverrides.blockLayouts.b.arrangement.root.children[0].children[0].width,80);
});

test('a fix that has nothing to change returns null, and an unknown step is an error',()=>{
 const project=gridProject();
 project.sections[0].blocks[0].content.children[0].diagramPlacement='before-prompt';
 assert.equal(wrapFix('diagram-placement',project,{blockId:'b',nodeId:'par'}),null);
 assert.equal(wrapFix('widen',{...project,settings:{}},{blockId:'b',nodeId:'par'}),null);
 assert.throws(()=>wrapFix('shrink',project,{blockId:'b',nodeId:'par'}),/Unknown step/);
});
