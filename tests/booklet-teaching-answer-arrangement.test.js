import test from 'node:test';
import assert from 'node:assert/strict';
import {teachingAnswerArrangement,resolveArrangement} from '../src/lib/booklet-arrangement.js';
import {group,item,arrangementItems} from '../public/libs/maths-editor/arrangement-model.mjs';
import {fromSource} from '../src/lib/document-content.js';

function fixture(){
 const block={id:'activity',type:'question',sourceAtom:{kind:'identify'},sourceReview:{responses:[{id:'demo',kind:'none'},{id:'response',kind:'working',label:''}]},content:{id:'root',prompt:'',children:[{id:'response',label:'',prompt:fromSource('Permanent demonstration'),questionDiagrams:[{id:'given',format:'tikz',widthMm:70,code:'source'}],answer:{short:fromSource('21'),worked:fromSource('Locate observations 15 and 16.\n\nBoth values are 21.'),solutionDiagrams:[{id:'solution',format:'tikz',widthMm:60,code:'answer'}]}}]}};
 const saved={version:1,root:group('row',[group('demo',[item('given'),item('response/prompt')]),group('response-cell',[{...item('response/space'),height:20,width:74,minHeight:20}])],'row')};
 return {block,saved};
}
test('mixed teaching answers stay in the source response cell beside the permanent demonstration',()=>{
 const {block,saved}=fixture(),before=structuredClone({block,saved});
 const answer=teachingAnswerArrangement(block,saved,{},'worked');
 assert.ok(answer);assert.equal(answer.root.direction,'row');
 assert.deepEqual(arrangementItems(answer.root.children[0]).map(n=>n.ref),['given',...resolveArrangement(block,saved).entries.values()].filter(e=>typeof e==='string'||e.field==='prompt').map(e=>typeof e==='string'?e:e.ref));
 const cell=answer.root.children[1].children[0];assert.equal(cell.width,74);assert.equal(cell.height,undefined);assert.equal(cell.minHeight,undefined);
 const entries=resolveArrangement(block,answer).entries;
 assert.deepEqual(arrangementItems(cell).map(n=>entries.get(n.ref).field??entries.get(n.ref).role),['answer/worked','answer/worked','answer-worked']);
 assert.equal(cell.children.at(-1).width,60);
 assert.equal(arrangementItems(answer.root).filter(n=>n.ref==='given').length,1);
 assert.deepEqual({block,saved},before);
});
test('short answers and solution diagram width overrides use the same response slot',()=>{
 const {block,saved}=fixture(),answer=teachingAnswerArrangement(block,saved,{diagramWidths:{solution:48}},'short');
 const entries=resolveArrangement(block,answer).entries,cell=answer.root.children[1];
 assert.equal(arrangementItems(cell).filter(n=>entries.get(n.ref).field==='answer/short').length,1);
 assert.equal(arrangementItems(cell).at(-1).width,48);
});
test('omitted response slots fall back and invalid duplicate placements remain rejected',()=>{
 const {block,saved}=fixture();saved.root.children.pop();assert.equal(teachingAnswerArrangement(block,saved),null);
 const other=fixture();other.saved.root.children[1].children.push({...item('response/space'),id:'duplicate-placement'});assert.throws(()=>teachingAnswerArrangement(other.block,other.saved),/Duplicate content reference/);
});
test('ordinary practice retains its answer renderer',()=>{
 const {block,saved}=fixture();delete block.sourceAtom;delete block.sourceReview;assert.equal(teachingAnswerArrangement(block,saved),null);
});
test('teaching fragments place only their current leaf responses',()=>{
 const {block,saved}=fixture();block.sourceReview.responses.push({id:'other-page',kind:'working'});
 assert.ok(teachingAnswerArrangement(block,saved));
});

test('a completed example stays permanent while its paired native scaffold reveals the response',()=>{
 const scaffold={format:'maths-editor-document-v1',version:1,blocks:[{id:'scaffold',type:'table',rows:[[{id:'step',type:'cell',blocks:[{id:'step-label',type:'paragraph',inlines:[{type:'text',text:'1.'}]}]},{id:'working',type:'cell',blocks:[]}]]}]};
 const block={id:'paired',type:'question',sourceAtom:{kind:'example'},sourceReview:{responses:[{targetId:'example',kind:'none'},{targetId:'turn',kind:'working',answerSlotRef:'turn/prompt#scaffold'}]},content:{id:'root',children:[{id:'example',prompt:fromSource('Permanent supplied solution: 3.989 m'),answer:{short:'3.989 m',worked:'Supplied method'}},{id:'turn',prompt:scaffold,answer:{short:'3.568 m',worked:fromSource('Write the formula.\n\nUse inverse operations: 3.568 m.')}}]}};
 const saved={version:1,root:group('paired-columns',[group('example-column',[item('example/prompt')]),group('turn-column',[{...item('turn/prompt#scaffold'),width:84,minHeight:92}])],'row')},before=structuredClone({block,saved});
 for(const mode of ['short','worked']){
  const answer=teachingAnswerArrangement(block,saved,{},mode);assert.ok(answer);
  const resolved=resolveArrangement(block,answer),left=arrangementItems(answer.root.children[0]),right=arrangementItems(answer.root.children[1]);
  assert.ok(left.every(n=>resolved.entries.get(n.ref).field==='prompt'));
  assert.ok(right.every(n=>resolved.entries.get(n.ref).ownerId==='turn'&&resolved.entries.get(n.ref).field==='answer/'+mode));
  assert.equal(answer.root.children[1].children[0].width,84);assert.equal(answer.root.children[1].children[0].minHeight,undefined);
  assert.equal(arrangementItems(answer.root).filter(n=>resolved.entries.get(n.ref)?.ownerId==='example'&&resolved.entries.get(n.ref)?.field.startsWith('answer/')).length,0);
 }
 assert.deepEqual({block,saved},before);
 delete block.sourceReview.responses[1].answerSlotRef;
 block.content.children[1].answer.worked={format:'maths-editor-document-v1',version:1,blocks:[{id:'method',type:'list',ordered:true,start:1,items:[{id:'method-step',type:'list-item',blocks:fromSource('Write the formula and solve: 3.568 m.').blocks}]}]};
 const inferred=teachingAnswerArrangement(block,saved);assert.ok(inferred,'A numbered blank native scaffold and matching worked steps identify the response slot');
 block.content.children[1].prompt.blocks[0].rows[0][1].blocks=fromSource('Permanent measurement').blocks;
 assert.equal(teachingAnswerArrangement(block,saved),null,'A table with permanent givens cannot be inferred as an empty response scaffold');
 block.sourceReview.responses[1].answerSlotRef='example/prompt';assert.equal(teachingAnswerArrangement(block,saved),null);
});
