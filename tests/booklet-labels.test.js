import test from 'node:test';
import assert from 'node:assert/strict';
import {teachingLabels,alphabeticLabel,labelledTeachingQuestion} from '../src/lib/booklet-labels.js';
import {arrangementCatalog,resolveArrangement} from '../src/lib/booklet-arrangement.js';
const question=(id,kind='guided-practice')=>({id,type:'question',sourceOrder:9,sourceAtom:{id:'box',kind},content:{id:id+'-root',label:'9',prompt:'Shared instruction',children:[{id:id+'-a',label:'1',prompt:'First',children:[]},{id:id+'-b',label:'2',prompt:'Second',children:[]}]}});
test('teaching boxes label parts continuously across blocks and omit root question numbers',()=>{
 const blocks=[question('q1'),question('q2')],labels=teachingLabels(blocks);
 assert.deepEqual(Object.values(labels),['','a','b','','c','d']);
 for(const b of blocks){const catalog=arrangementCatalog(b,{labels});assert.equal(catalog.entries.get(b.content.id+'/label').value,'');}
 const preview=labelledTeachingQuestion(blocks[1],labels);assert.equal(preview.sourceOrder,null);assert.equal(preview.content.children[0].label,'c');assert.equal(blocks[1].content.children[0].label,'1');
});
test('teaching examples omit labels globally, activity leaves use letters, and regular questions keep numbers',()=>{
 const examples=[{id:'e1',type:'worked-example',sourceAtom:{id:'ex',kind:'example'},examples:[{id:'a',label:'1'}]},{id:'e2',type:'worked-example',sourceAtom:{id:'ex',kind:'example'},examples:[{id:'b',label:'2'}]}];
 assert.deepEqual(teachingLabels(examples),{a:'',b:''});
 const regular={...question('normal'),sourceAtom:undefined};assert.equal(arrangementCatalog(regular).entries.get('normal-root/label').value,'9');
 const leaf={...question('leaf','activity'),content:{id:'leaf-root',prompt:'Do this'}};assert.equal(teachingLabels([leaf])['leaf-root'],'a');assert.equal(alphabeticLabel(26),'aa');
});
test('saved arrangements retain references while suppressed numeric labels and missing letters are reconciled',()=>{
 const b=question('q'),saved=arrangementCatalog({...b,sourceAtom:undefined}).initial;
 const part=saved.root.children.find(n=>n.id==='q-root:parts').children[0];part.children=part.children.filter(n=>n.ref!=='q-a/label');
 const resolved=resolveArrangement(b,saved);assert.equal(resolved.missing.length,0);assert.equal(resolved.entries.get('q-root/label').value,'');
 assert.ok(resolved.tree.root.children.find(n=>n.id==='q-root:parts').children[0].children.some(n=>n.ref==='q-a/label'));
 assert.ok(!part.children.some(n=>n.ref==='q-a/label'));
});

test('example labels can be suppressed for an example/non-example activity',()=>{
 const block={id:'identify',type:'worked-example',presentation:{showLabels:false},examples:[{id:'a'},{id:'b'}]};
 assert.deepEqual(teachingLabels([block]),{a:'',b:''});
});
