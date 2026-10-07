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

test('diagram-only teaching illustrations require every diagram and reject added prose',async()=>{
 const diagrams=['negative','positive'].map(id=>({id,format:'tikz',code:'\\draw (0,0)--(1,0);'}));
 const block={id:'illustrations',type:'worked-example',examples:diagrams.map(d=>({id:'example-'+d.id,label:'',prompt:'',questionDiagrams:[d]}))};
 const p=project(block,diagrams.map(d=>({...entry('source-'+d.id,d.id),kind:'diagram'})));
 assert.deepEqual(await missing(p),[]);
 p.source.inventory.entries.pop();assert.ok((await missing(p)).some(i=>i.targetId===block.id));
 p.source.inventory.entries.push({...entry('source-positive','positive'),kind:'diagram'});
 block.examples[0].prompt='An additional task';assert.ok((await missing(p)).some(i=>i.targetId===block.id));
 block.examples[0].prompt='';block.examples[0].label='Uninventoried caption';assert.ok((await missing(p)).some(i=>i.targetId===block.id));
});

test('normalised source-part groups own only explicitly declared response leaves',async()=>{
 const block={id:'practice',type:'question',sourceReview:{responses:[{targetId:'summary',kind:'cloze'}]},content:{id:'root',type:'question',prompt:'Find the summary.',children:[{id:'original-part',type:'group',prompt:'1, 2, 3',children:[{id:'summary',type:'part',label:'',prompt:'Median',answer:{short:'2',worked:'The middle value is 2.'}}]}]}};
 const p=project(block,[{...entry('source-part','original-part'),kind:'part'}]);
 assert.ok(!(await missing(p)).some(i=>i.targetId==='summary'));
 block.sourceReview.responses=[];assert.ok((await missing(p)).some(i=>i.targetId==='summary'));
 block.sourceReview.responses=[{targetId:'summary',kind:'cloze'}];p.source.inventory.entries[0].kind='question';assert.ok((await missing(p)).some(i=>i.targetId==='summary'));
 p.source.inventory.entries[0].kind='part';p.source.inventory.entries[0].field='/prompt';assert.ok((await missing(p)).some(i=>i.targetId==='summary'));
});

test('a drawing leaf requires an exact binding to the inventoried parent task',async()=>{
 const prompt='Complete the summary, then draw the box plot.';
 const block={id:'drawing-question',type:'question',sourceReview:{responses:[{targetId:'drawing',kind:'working',promptBinding:{ownerId:'root',sourceInventoryId:'source-task',path:'/prompt',expected:prompt,reason:'The source explicitly requires this drawing.'}}]},content:{id:'root',type:'question',prompt,children:[{id:'drawing',type:'part',label:'',prompt:'',answer:{short:'Box plot',worked:'Use the five-number summary.'}}]}};
 const p=project(block,[{...entry('source-task','root','/prompt'),kind:'question'}]);
 assert.ok(!(await missing(p)).some(i=>i.targetId==='drawing'));
 block.content.children[0].prompt='An additional task';assert.ok((await missing(p)).some(i=>i.targetId==='drawing'));
 block.content.children[0].prompt='';
 block.content.prompt='A different task';assert.ok((await missing(p)).some(i=>i.targetId==='drawing'));
 block.content.prompt=prompt;p.source.inventory.entries[0].field='/answer';assert.ok((await missing(p)).some(i=>i.targetId==='drawing'));
});
