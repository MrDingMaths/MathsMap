import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveBookletCover, parseImportedContents } from '../src/lib/booklet-cover.js';

test('contents link only to included answer sections and use their first page',()=>{
  const front={pageNumber:1,flexible:true,mode:'student',section:{phase:'front-matter'},blocks:[]};
  const topic={pageNumber:3,mode:'student',section:{exerciseNumber:1,topicTitle:'Coordinates'},blocks:[]};
  const short={pageNumber:20,mode:'short',compactAnswers:true,section:{},blocks:[]};
  const worked={...short,pageNumber:30,mode:'worked'};
  assert.deepEqual(deriveBookletCover([front,topic]).contents,[{number:1,title:'Coordinates',pageNumber:3,href:'#exercise-topic-1'}]);
  assert.deepEqual(deriveBookletCover([front,topic,short,{...short,pageNumber:21},worked]).contents.slice(1),[
    {title:'Short answers',answerSection:true,pageNumber:20,href:'#answer-section-short'},
    {title:'Worked solutions',answerSection:true,pageNumber:30,href:'#answer-section-worked'},
  ]);
});

test('derives cover metadata and recalculates contents page positions', () => {
  const pages = [
    { pageNumber: 1, section: { title: 'Computation with Integers' }, blocks: [
      { id: 'page-1-cover', content: '**Mathematics Stage 4**\n# Computation with Integers\n**Book 1**\nCompare integers\nCalculate with integers\nVersion: 260903\nFeedback: https://MrDingMaths.com' },
      { title: 'Contents', content: 'Syllabus Content ........ 2\nAdding Integers ........ 29\nMissing Pilot Section ........ 39' },
    ] },
    { pageNumber: 2, section: { title: 'Syllabus Content' }, blocks: [] },
    { pageNumber: 29, section: { title: 'Adding Integers' }, blocks: [] },
  ];
  const cover = deriveBookletCover(pages);
  assert.equal(cover.course, 'Mathematics Stage 4');
  assert.equal(cover.title, 'Computation with Integers');
  assert.equal(cover.book, 'Book 1');
  assert.deepEqual(cover.topics, ['Compare integers', 'Calculate with integers']);
  assert.equal(cover.version, '260903');
  assert.equal(cover.totalPages, 3);
  assert.deepEqual(cover.contents, [
    { title: 'Syllabus Content', pageNumber: 2 },
    { title: 'Adding Integers', pageNumber: 3 },
  ]);
});

test('builds contents from reconstructed section order when no imported list exists', () => {
  const cover = deriveBookletCover([
    { pageNumber: 1, section: { title: 'Cover' }, blocks: [{ id: 'cover', content: '# Algebra' }] },
    { pageNumber: 3, section: { title: 'Linear equations' }, blocks: [] },
    { pageNumber: 4, section: { title: 'Linear equations' }, blocks: [] },
    { pageNumber: 8, section: { title: 'Challenge' }, blocks: [] },
  ]);
  assert.deepEqual(cover.contents, [
    { title: 'Linear equations', pageNumber: 2 },
    { title: 'Challenge', pageNumber: 4 },
  ]);
  assert.deepEqual(parseImportedContents('Topic A .... 2\nnot a row'), [{ title: 'Topic A', sourcePage: 2 }]);
});
