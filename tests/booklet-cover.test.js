import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveBookletCover, parseImportedContents, updateBookletCover } from '../src/lib/booklet-cover.js';
import {normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
import fs from 'node:fs';

test('cover edits survive normalization without changing imported source, content, or contents', () => {
  for (const name of fs.readdirSync('booklets/projects').filter(n => n.endsWith('.json'))) {
    const original = JSON.parse(fs.readFileSync('booklets/projects/' + name));
    const snapshot = JSON.stringify(original);
    const pages = original.sections.map((section, index) => ({pageNumber: index + 1, section, blocks: section.blocks}));
    const before = deriveBookletCover(pages);
    let edited = updateBookletCover(original, 'title', 'New cover title');
    edited = updateBookletCover(edited, 'book', 'Book 12');
    edited = updateBookletCover(edited, 'version', '');
    edited = normalizeEditableProject(JSON.parse(JSON.stringify(edited)));
    const after = deriveBookletCover(pages, edited.settings.cover);
    assert.equal(after.title, 'New cover title');
    assert.equal(after.book, 'Book 12');
    assert.equal(after.version, '');
    assert.deepEqual(after.contents, before.contents);
    assert.equal(JSON.stringify(original), snapshot);
    assert.equal(edited.title, original.title, 'Picker name stays independent');
    assert.deepEqual(edited.sections, normalizeEditableProject(original).sections);
    assert.deepEqual(edited.source, original.source);
    assert.equal(edited.settings.paginationMode, original.settings.paginationMode);
  }
});

test('cover editing allows plain text only in known fields and protects required fields', () => {
  const project = {settings: {cover: {book: 'Book 1'}}};
  assert.equal(updateBookletCover(project, 'book', ' '), project);
  assert.equal(updateBookletCover(project, 'title', ''), project);
  assert.equal(updateBookletCover(project, 'book', 'Book 1'), project);
  assert.throws(() => updateBookletCover(project, 'contents', 'Changed'));
  const edited = updateBookletCover(project, 'course', ' Mathematics\nStage 5 ');
  assert.equal(edited.settings.cover.course, 'Mathematics Stage 5');
  assert.equal(deriveBookletCover([], {title:'A', contents:['bad'], totalPages:999}).totalPages, 1);
  assert.deepEqual(deriveBookletCover([], {contents:['bad']}).contents, []);
});

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
