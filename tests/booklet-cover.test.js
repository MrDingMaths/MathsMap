import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveBookletCover, parseImportedContents } from '../src/lib/booklet-cover.js';

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
