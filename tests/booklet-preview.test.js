import test from 'node:test';
import assert from 'node:assert/strict';
import {teachingQuestionMode} from '../src/lib/booklet-answer-options.js';
import {
  isRewriteTableQuestion, resolvePreviewAssets, splitBookletTables, visibleImportedQuestionTitle, groupBookletBlocks, resolveTeachingColumns,
} from '../src/lib/booklet-preview.js';

test('opt-in teaching columns preserve separate owners and reject incomplete arrangements', () => {
  const blocks = ['intro','diagram','worked','guided','after'].map(id => ({id, sourceAtom:{id:'example',kind:'example'}}));
  blocks[0].flow = {teachingColumns:[['diagram','worked'],['guided']]};
  blocks[2].type='worked-example'; blocks[2].pedagogyRole='theory';
  blocks[3].type='question'; blocks[3].pedagogyRole='guided-practice';
  blocks[3].sourceReview={responses:[{targetId:'guided-part',kind:'working'}]};
  const original=structuredClone(blocks),item=groupBookletBlocks(blocks)[0];
  const result=resolveTeachingColumns(item);
  assert.deepEqual(result.before,[blocks[0]]); assert.deepEqual(result.after,[blocks[4]]);
  assert.equal(result.columns[0][1],blocks[2]); assert.equal(result.columns[1][0],blocks[3]);
  assert.equal(result.columns[0][1].pedagogyRole,'theory');
  assert.equal(result.columns[1][0].pedagogyRole,'guided-practice');
  assert.equal(teachingQuestionMode(result.columns[0][1],{showGuidedPracticeAnswers:false}),'worked');
  assert.equal(teachingQuestionMode(result.columns[1][0],{showGuidedPracticeAnswers:false}),'student');
  assert.equal(teachingQuestionMode(result.columns[1][0],{showGuidedPracticeAnswers:true}),'worked');
  assert.equal(teachingQuestionMode({type:'question',id:'separate-practice'},{showGuidedPracticeAnswers:true}),'student');
  assert.deepEqual(blocks,original);
  for (const columns of [undefined,[],[['diagram'],['missing']],[['diagram'],['diagram']],[['worked','diagram'],['guided']],[['diagram'],['after']]]) {
    const invalid=structuredClone(item); invalid.blocks[0].flow.teachingColumns=columns;
    assert.equal(resolveTeachingColumns(invalid),null);
  }
  assert.equal(resolveTeachingColumns({type:'block',blocks}),null);
  const duplicate=structuredClone(item); duplicate.blocks.push({...duplicate.blocks[1]});
  assert.equal(resolveTeachingColumns(duplicate),null);
});

test('investigation titles survive a missing optional subtitle without duplicating legacy headings',()=>{
 const group=sourceAtom=>groupBookletBlocks([{id:'activity',sourceAtom:{id:'header',kind:'investigation',...sourceAtom}}])[0].atom;
 const current=group({label:'Sketching the Reciprocal of a Function'});
 assert.equal(current.label,'Sketching the Reciprocal of a Function');
 assert.ok(!current.visibleSubtitle);
 const legacy=group({label:'Investigation',description:'Investigation Sketching the Reciprocal of a Function'});
 assert.equal(legacy.label,'');assert.equal(legacy.visibleSubtitle,'Sketching the Reciprocal of a Function');
 assert.equal(group({label:'',visibleSubtitle:'Custom title'}).label,'');
 assert.equal(group({label:'Investigation'}).label,'');
});

test('printed exam attribution omits the Band rating without changing source metadata', () => {
  const question={title:'2016 HSC Standard 2 Band 4',content:{prompt:'Find the area.'}};
  assert.equal(visibleImportedQuestionTitle(question),'2016 HSC Standard 2');
  assert.equal(question.title,'2016 HSC Standard 2 Band 4');
  assert.equal(visibleImportedQuestionTitle({title:'HSC Mathematics Band 6'}),'HSC Mathematics');
  assert.equal(visibleImportedQuestionTitle({title:'2023 HSC Standard 2'}),'2023 HSC Standard 2');
});

test('paired teaching retains distinct headers, both editable groups and question roles', () => {
  const blocks=[
    {id:'theory',sourceAtom:{id:'theory-group',kind:'definition',label:'Theory'}},
    {id:'model',type:'rich-text',sourceAtom:{id:'example-group',kind:'example',label:'Worked Example'}},
    {id:'model-more',type:'rich-text',sourceAtom:{id:'example-group',kind:'example',label:'Worked Example'},pairedBlockId:'guided'},
    {id:'guided',type:'question',pedagogyRole:'guided-practice',sourceAtom:{id:'guided-group',kind:'guided-practice',label:'Guided Practice'}},
    {id:'practice',type:'question',pairedBlockId:'practice-next'},
    {id:'practice-next',type:'question'},
  ];
  const before=structuredClone(blocks),items=groupBookletBlocks(blocks);
  assert.deepEqual(items.map(item=>item.type),['teaching-atom','teaching-pair','block','block']);
  assert.deepEqual(items[1].groups.map(group=>group.atom.label),['Worked Example','Guided Practice']);
  assert.deepEqual(items[1].blocks.map(block=>block.id),['model','model-more','guided']);
  assert.equal(items[1].groups[1].blocks[0].pedagogyRole,'guided-practice');
  assert.deepEqual(blocks,before);
});

test('question previews can copy reactive proxies without mutating transcription state', () => {
  const source = {
    id: 'page-30-q1',
    content: {
      prompt: 'Question',
      questionDiagrams: [{ id: 'diagram-1', src: 'evidence/assets/diagram.png' }],
      children: [],
    },
  };
  const reactiveProxy = new Proxy(source, {});
  assert.throws(() => structuredClone(reactiveProxy), /could not be cloned/i);

  const preview = resolvePreviewAssets(reactiveProxy, (src) => `/run/files/${src}`);
  assert.equal(preview.content.questionDiagrams[0].src, '/run/files/evidence/assets/diagram.png');
  assert.equal(source.content.questionDiagrams[0].src, 'evidence/assets/diagram.png');
  assert.notEqual(preview, source);
  assert.notEqual(preview.content, source.content);
});

test('booklet markdown tables become structural rows instead of visible pipe text', () => {
  const parts = splitBookletTables('Intro\n\n| | |\n| --- | --- |\n| $3+2=$ | $(-3)+2=$ |');
  assert.deepEqual(parts, [
    { type: 'text', value: 'Intro' },
    { type: 'table', header: null, rows: [['$3+2=$', '$(-3)+2=$']], alignments: ['left','left'] },
  ]);
});

test('import preview recognises paired rewrite tables and hides model-only titles', () => {
  const question = { title: 'Temperature midpoint', content: { prompt: 'Fill in the table. Continue.', layout: 'grid', columns: 2, children: [{ children: [] }, { children: [] }, { children: [] }, { children: [] }] } };
  assert.equal(isRewriteTableQuestion(question), true);
  assert.equal(visibleImportedQuestionTitle(question), '');
  assert.equal(visibleImportedQuestionTitle({ title: 'NAPLAN B+', content: { prompt: 'Solve it.' } }), 'NAPLAN B+');
  const document={format:'maths-editor-document-v1',version:1,blocks:[{id:'attribution',type:'paragraph',inlines:[{type:'text',text:'NAPLAN C',marks:['bold']}]},{id:'stem',type:'paragraph',inlines:[{type:'text',text:'Find the width.'}]}]};
  assert.equal(visibleImportedQuestionTitle({title:'NAPLAN C',content:{prompt:document}}),'','A native source attribution must suppress its generated duplicate');
  document.blocks.shift();
  assert.equal(visibleImportedQuestionTitle({title:'NAPLAN C',content:{prompt:document}}),'NAPLAN C','A missing native attribution remains visible');
});
