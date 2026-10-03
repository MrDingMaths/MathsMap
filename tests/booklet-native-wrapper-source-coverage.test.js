import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectContentCoverage} from '../src/lib/booklet-content-verification.js';
const doc=blocks=>({format:'maths-editor-document-v1',version:1,blocks});
const paragraph=(id,text)=>({id,type:'paragraph',inlines:[{type:'text',text}]});
const project=(block,entries)=>({sections:[{id:'s',phase:'teaching',blocks:[block]}],source:{reviewProfile:'textbook-three-pass-v1',inventory:{entries,pages:[{pageNumber:1,inventoried:true}]}},settings:{}});
const entry=(id,targetId,field)=>({id,targetId,field,kind:'teaching',pageNumber:1});
const missing=async p=>(await inspectContentCoverage(p)).issues.filter(i=>i.kind==='unmapped-content');
test('native card ownership requires every visible slot branch',async()=>{
 const block={id:'card-block',type:'rich-text',content:doc([{id:'card',type:'layout',arrangement:'cards',slots:[{id:'slot',blocks:[paragraph('formula','Pay = rate × hours')]}]}])};
 const p=project(block,[entry('source-formula','formula','/inlines')]);
 assert.deepEqual(await missing(p),[]);
 block.content.blocks[0].slots[0].blocks.push(paragraph('extra','Unrecorded advice'));
 assert.ok((await missing(p)).some(i=>i.targetId==='card-block'));
 block.content.blocks[0].slots[0].blocks.pop();block.content.blocks[0].slots.push({id:'other',blocks:[paragraph('extra','Other source task')]});
 assert.ok((await missing(p)).some(i=>i.targetId==='card-block'));
});
test('paired teaching wrappers require every prompt and diagram; extra stems fail closed',async()=>{
 const leaf=id=>({id,type:'part',prompt:'Calculate pay.',answer:{short:'10',worked:'2 × 5 = 10'}});
 const block={id:'paired',type:'question',sourceAtom:{id:'source-example',kind:'example'},content:{id:'root',type:'group',prompt:'',children:[leaf('demo'),leaf('response')]}};
 const p=project(block,[entry('source-demo','demo','/prompt'),entry('source-response','response','/prompt')]);
 assert.ok(!(await missing(p)).some(i=>i.targetId==='paired'));
 block.content.prompt='An additional task.';assert.ok((await missing(p)).some(i=>i.targetId==='paired'));
 block.content.prompt='';block.content.children.push(leaf('unmapped'));assert.ok((await missing(p)).some(i=>i.targetId==='paired'));
 block.content.children.pop();block.content.children[0].questionDiagrams=[{id:'extra-diagram',format:'tikz',code:'x'}];assert.ok((await missing(p)).some(i=>i.targetId==='paired'));
 block.content.children[0].questionDiagrams=[];block.theorySolution='Extra teaching prose';assert.ok((await missing(p)).some(i=>i.targetId==='paired'));
});
test('whole teaching source units own declared decomposition leaves, but prompt-only mappings do not',async()=>{
 const block={id:'guided',type:'question',sourceAtom:{id:'source-guided',kind:'guided-practice'},sourceReview:{responses:[{targetId:'stage',kind:'working'}]},content:{id:'group',type:'group',prompt:'',children:[{id:'source-part',type:'part',prompt:'Calculate holiday pay.',children:[{id:'stage',type:'part',prompt:'Leave loading',answer:{short:'10',worked:'100 × 0.1 = 10'}}]}]}};
 const p=project(block,[{...entry('source-task','source-part',null),kind:'question'}]);
 assert.ok(!(await missing(p)).some(i=>i.targetId==='stage'));
 block.sourceReview.responses=[];assert.ok((await missing(p)).some(i=>i.targetId==='stage'));
 block.sourceReview.responses=[{targetId:'stage',kind:'working'}];p.source.inventory.entries[0].field='/prompt';assert.ok((await missing(p)).some(i=>i.targetId==='stage'));
});
test('paired demonstrations with split source prompt and solution mappings require both payloads for every example',async()=>{
 const block={id:'demonstrations',type:'worked-example',sourceAtom:{id:'source-examples',kind:'example'},examples:['a','b'].map(id=>({id,label:'',prompt:'Find pay.',theorySolution:'2 × 5 = 10'}))};
 const p=project(block,['a','b'].flatMap(id=>[entry('prompt-'+id,id,'/prompt'),{...entry('answer-'+id,id,'/theorySolution'),kind:'answer'}]));
 assert.ok(!(await missing(p)).some(i=>i.targetId===block.id));
 p.source.inventory.entries.pop();assert.ok((await missing(p)).some(i=>i.targetId===block.id));
 p.source.inventory.entries.push({...entry('answer-b','b','/theorySolution'),kind:'answer'});block.examples[0].explanation='Unrecorded explanation';assert.ok((await missing(p)).some(i=>i.targetId===block.id));
 delete block.examples[0].explanation;delete block.sourceAtom;assert.ok((await missing(p)).some(i=>i.targetId===block.id));
});
