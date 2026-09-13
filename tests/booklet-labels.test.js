import test from 'node:test';
import assert from 'node:assert/strict';
import {teachingLabels,alphabeticLabel,labelledTeachingQuestion,hasEmbeddedResponseLabel} from '../src/lib/booklet-labels.js';

test('answer-only scaffold leaves keep answer labels without an empty student label',()=>{
 const node={id:'table-row-a',label:'a',responseSpace:'scaffold',answer:{short:'1/5'}};
 assert.equal(hasEmbeddedResponseLabel(node),true);
 assert.equal(hasEmbeddedResponseLabel({...node,responseSpace:'working'}),false);
 assert.equal(hasEmbeddedResponseLabel({...node,prompt:'Calculate this probability.'}),false);
 assert.equal(hasEmbeddedResponseLabel({...node,questionDiagrams:[{id:'spinner'}]}),false);
});

test('embedded response heading prints once while retaining its answer-reference label',()=>{
 const node={id:'front',type:'part',label:'Front',responseSpace:'scaffold',prompt:{format:'maths-editor-document-v1',version:1,blocks:[{id:'table',type:'table',rows:[[{blocks:[{type:'paragraph',inlines:[{type:'text',text:'Front'}]}]}]]}]}};
 assert.equal(hasEmbeddedResponseLabel(node),true);
 assert.equal(node.label,'Front');
 assert.equal(hasEmbeddedResponseLabel({...node,label:'a'}),false);
 assert.equal(hasEmbeddedResponseLabel({...node,responseSpace:'working'}),false);
 assert.equal(hasEmbeddedResponseLabel({...node,children:[{id:'child'}]}),false);
 const block={id:'views',type:'question',sourceOrder:1,content:{id:'root',children:[node]}};
 const catalog=arrangementCatalog(block);
 assert.equal(catalog.entries.get('front/label').value,'');
 assert.equal(resolveArrangement(block,catalog.initial).missing.length,0);
});

test('one source-labelled drawing task retains four explicitly unlabelled view responses',()=>{
 const blocks=[{id:'views',type:'question',pedagogyRole:'guided-practice',content:{id:'root',children:['a','b'].map(label=>({id:label,label,children:['front','back','side','top'].map(view=>({id:label+'-'+view,label:''}))}))}}];
 const labels=teachingLabels(blocks);
 assert.equal(labels.a,'a');assert.equal(labels.b,'b');
 for(const letter of ['a','b'])for(const view of ['front','back','side','top'])assert.equal(labels[letter+'-'+view],'');
});
import {arrangementCatalog,resolveArrangement} from '../src/lib/booklet-arrangement.js';
const question=(id,kind='guided-practice')=>({id,type:'question',sourceOrder:9,sourceAtom:{id:'box',kind},content:{id:id+'-root',label:'9',prompt:'Shared instruction',children:[{id:id+'-a',label:'1',prompt:'First',children:[]},{id:id+'-b',label:'2',prompt:'Second',children:[]}]}});
test('teaching boxes label parts continuously across blocks and omit root question numbers',()=>{
 const blocks=[question('q1'),question('q2')],labels=teachingLabels(blocks);
 assert.deepEqual(Object.values(labels),['','a','b','','c','d']);
 for(const b of blocks){const catalog=arrangementCatalog(b,{labels});assert.equal(catalog.entries.get(b.content.id+'/label').value,'');}
 const preview=labelledTeachingQuestion(blocks[1],labels);assert.equal(preview.sourceOrder,null);assert.equal(preview.content.children[0].label,'c');assert.equal(blocks[1].content.children[0].label,'1');
});

test('separately prompted nested teaching tasks retain their repeated source part labels',()=>{
 const block={id:'paired',type:'question',pedagogyRole:'guided-practice',content:{id:'pair',children:['die','lollies'].map(id=>({id,prompt:'Separate source task',children:['a','b','c'].map(label=>({id:id+'-'+label,label,prompt:'Respond'}))}))}};
 const original=structuredClone(block),labels=teachingLabels([block]);
 for(const id of ['die','lollies'])for(const label of ['a','b','c'])assert.equal(labels[id+'-'+label],label);
 assert.equal(arrangementCatalog(block).entries.get('lollies-a/label').value,'a');
 assert.deepEqual(block,original);
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

test('explicitly unlettered teaching tasks stay unlettered without consuming a label',()=>{
 const block={id:'guided',type:'question',sourceAtom:{kind:'guided-practice'},sourceReview:{responses:[{targetId:'unlettered',kind:'working',label:''}]},content:{id:'root',children:[{id:'unlettered',label:'',prompt:'Spin the spinner',answerSpaceMm:30},{id:'next',prompt:'Explain'}]}};
 assert.deepEqual(teachingLabels([block]),{root:'',unlettered:'',next:'a'});
 delete block.sourceReview;
 assert.deepEqual(teachingLabels([block]),{root:'',unlettered:'a',next:'b'});
});
