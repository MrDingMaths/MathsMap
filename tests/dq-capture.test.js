import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createEmptyCaptureState,
  assessAdaptiveShortlist,
  categoryIdentityKey,
  createRetrievalPolicy,
  createTaxonomyProgress,
  enumerateLeafCategories,
  enumerateLeafCategoriesResumable,
  enumerateLeafPaths,
  fixtureAdapter,
  fuseRankedQuestions,
  isExcludedCategoryName,
  mergeCandidateState,
  normalizeCategoryName,
  parseEmbeddedFixtureHtml,
  rankFixtureCatalog,
  recordTaxonomy,
  resolveRequestedLeaf,
  retrievalPolicyFingerprint,
  retryWithBackoff,
  shouldCaptureCandidate,
  stableQuestionId,
  subjectIdFromUrl,
  validateCompletedTaxonomyProgress
} from '../scripts/dq/capture-core.mjs';
import {
  DEFAULT_SELECTORS,
  canResumeLeafRun,
  navigateCategoryTarget,
  parseArgs,
  restoreBrowserStorageState,
  saveBrowserStorageState
} from '../scripts/dq/capture.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

test('fuses liked and misconception ranks with 55/45 weighting and intersection bonus', () => {
  const ranked = fuseRankedQuestions({
    liked: [{ sourceId: 'a' }, { sourceId: 'b' }, { sourceId: 'c' }],
    misconceptions: [{ sourceId: 'c' }, { sourceId: 'b' }, { sourceId: 'd' }],
    limitPerSort: 5,
    top: 4
  });

  assert.deepEqual(ranked.map((question) => question.sourceId), ['b', 'c', 'a', 'd']);
  assert.deepEqual(ranked[0].ranks, { liked: 2, misconceptions: 2 });
  assert.ok(Math.abs(ranked[0].ranking.fusedScore - 0.825) < Number.EPSILON);
  assert.equal(ranked[2].ranking.intersectionBonus, 0);
});

test('caps each source list before merging and returns only the requested top candidates', () => {
  const ranked = fuseRankedQuestions({
    liked: Array.from({ length: 8 }, (_, index) => ({ sourceId: `l${index + 1}` })),
    misconceptions: Array.from({ length: 8 }, (_, index) => ({ sourceId: `m${index + 1}` })),
    limitPerSort: 3,
    top: 2
  });
  assert.equal(ranked.length, 2);
  assert.ok(ranked.every((question) => !['l4', 'm4'].includes(question.sourceId)));
});

test('recursively enumerates leaf paths and normalizes displayed category counts', async () => {
  const tree = new Map([
    ['root', ['Number 28,658', 'Algebra 14221']],
    ['number', ['Basic Arithmetic 9321', 'Fractions 4209']],
    ['number/basic-arithmetic', []],
    ['number/fractions', []],
    ['algebra', ['Expanding Brackets 500']],
    ['algebra/expanding-brackets', []]
  ]);
  const leaves = await enumerateLeafPaths({
    listChildren: async (categoryPath) => tree.get(categoryPath.map((value) => value.toLowerCase().replaceAll(' ', '-')).join('/') || 'root')
  });
  assert.deepEqual(leaves, [
    ['Number', 'Basic Arithmetic'],
    ['Number', 'Fractions'],
    ['Algebra', 'Expanding Brackets']
  ]);
  assert.equal(normalizeCategoryName('Fractions 4,209'), 'Fractions');
  assert.equal(normalizeCategoryName('28,658 Number'), 'Number');
  assert.equal(isExcludedCategoryName('Random Question on Basic Arithmetic'), true);
  assert.equal(isExcludedCategoryName('Random Question on Maths'), true);
  assert.equal(isExcludedCategoryName('Fractions', ['My Questions']), false);
  assert.match(DEFAULT_SELECTORS.categoryItems, /:not\(\.questions-index__random\)/);
});

test('ID-backed traversal visits each category once and retains duplicate-label leaves through four levels', async () => {
  const node = (label, subjectId) => ({
    label,
    subjectId,
    url: `https://example.test/Questions?currentSubjectId=${subjectId}`
  });
  const graph = new Map([
    ['3', [node('Duplicate', '101'), node('Duplicate', '102'), node('Level One', '10'), node('Shared', '99')]],
    ['101', []],
    ['102', []],
    ['10', [node('Level Two', '20')]],
    ['20', [node('Level Three', '30')]],
    ['30', [node('Level Four', '40'), node('Shared', '99')]],
    ['40', []],
    ['99', []]
  ]);
  const calls = new Map();
  const result = await enumerateLeafCategories({
    async listChildren(category) {
      calls.set(category.subjectId, (calls.get(category.subjectId) || 0) + 1);
      return graph.get(category.subjectId) || [];
    }
  }, {
    root: node('Maths', '3')
  });

  assert.ok([...calls.values()].every((count) => count === 1));
  assert.equal(calls.size, graph.size);
  assert.deepEqual(result.leaves.filter((leaf) => leaf.label === 'Duplicate').map((leaf) => leaf.subjectId), ['101', '102']);
  assert.ok(result.leaves.some((leaf) =>
    leaf.subjectId === '40' && leaf.categoryPath.join(' > ') === 'Level One > Level Two > Level Three > Level Four'
  ));
  assert.notEqual(categoryIdentityKey(result.leaves[0]), categoryIdentityKey(result.leaves[1]));
});

test('resumable taxonomy checkpoints each completed node and skips it after interruption', async () => {
  const node = (label, subjectId) => ({
    label,
    subjectId,
    url: `https://example.test/Questions?currentSubjectId=${subjectId}`
  });
  const graph = new Map([
    ['3', [node('Number', '10')]],
    ['10', [node('Fractions', '20')]],
    ['20', [node('Equivalent Fractions', '30')]],
    ['30', []]
  ]);
  const root = node('Maths', '3');
  let checkpoint = null;
  const firstCalls = [];
  await assert.rejects(enumerateLeafCategoriesResumable({
    async listChildren(category) {
      firstCalls.push(category.subjectId);
      if (category.subjectId === '20') throw new Error('interrupted');
      return graph.get(category.subjectId);
    }
  }, {
    sourceUrl: 'https://example.test/Questions?CurrentSubjectId=3&OrderBy=Newest',
    root,
    checkpoint: async (progress) => { checkpoint = structuredClone(progress); }
  }), /interrupted/);
  assert.deepEqual(firstCalls, ['3', '10', '20']);
  assert.deepEqual(checkpoint.visitedSubjectIds, ['3', '10']);
  assert.deepEqual(checkpoint.queue.map((category) => category.subjectId), ['20']);

  const resumedCalls = [];
  const progressEvents = [];
  const resumed = await enumerateLeafCategoriesResumable({
    async listChildren(category) {
      resumedCalls.push(category.subjectId);
      return graph.get(category.subjectId);
    }
  }, {
    sourceUrl: 'https://example.test/Questions?OrderBy=Newest&currentSubjectId=3',
    root,
    progress: checkpoint,
    progressEvery: 2,
    checkpoint: async (progress) => { checkpoint = structuredClone(progress); },
    onProgress: (event) => progressEvents.push(event)
  });
  assert.deepEqual(resumedCalls, ['20', '30']);
  assert.equal(resumed.progress.status, 'complete');
  assert.deepEqual(resumed.leaves.map((leaf) => leaf.subjectId), ['30']);
  assert.ok(progressEvents.some((event) => event.status === 'complete'));
  assert.doesNotThrow(() => validateCompletedTaxonomyProgress(resumed.progress));
});

test('completed taxonomy validation rejects an open or inconsistent graph', () => {
  const root = { label: 'Maths', subjectId: '3', categoryPath: [], url: 'https://example.test/?currentSubjectId=3' };
  const progress = createTaxonomyProgress('https://example.test/?currentSubjectId=3', root);
  progress.status = 'complete';
  progress.queue = [];
  progress.nodes = [root];
  progress.visitedIdentities = [categoryIdentityKey(root)];
  progress.leaves = [root];
  assert.throws(() => validateCompletedTaxonomyProgress(progress), /leaf set/);
});

test('category identity parses subject IDs case-insensitively and rejects ambiguous label paths', () => {
  assert.equal(subjectIdFromUrl('https://example.test/Questions?currentSubjectId=144&x=1'), '144');
  assert.equal(subjectIdFromUrl('https://example.test/Questions?CurrentSubjectId=145&x=1'), '145');
  const duplicateLeaves = [
    { categoryPath: ['Number', 'Types'], subjectId: '101', url: 'https://example.test/?currentSubjectId=101' },
    { categoryPath: ['Number', 'Types'], subjectId: '102', url: 'https://example.test/?currentSubjectId=102' }
  ];
  assert.throws(() => resolveRequestedLeaf(duplicateLeaves, ['Number', 'Types']), /Ambiguous --leaf-path/);
  assert.deepEqual(resolveRequestedLeaf([], ['Number', 'Fractions']), ['Number', 'Fractions']);
});

test('URL-backed ranking and capture navigation goes directly to the category URL', async () => {
  const visits = [];
  let currentUrl = 'https://example.test/Questions?currentSubjectId=3';
  const page = {
    url: () => currentUrl,
    goto: async (url) => { visits.push(url); currentUrl = url; },
    locator: () => ({ first: () => ({ waitFor: async () => {} }) }),
    waitForFunction: async () => {},
    waitForTimeout: async () => {}
  };
  const directUrl = 'https://example.test/Questions?currentSubjectId=144&OrderBy=Newest';
  await navigateCategoryTarget(page, 'https://example.test/root', {
    categoryPath: ['Number', 'Fractions'], subjectId: '144', url: directUrl
  }, { ready: 'body' });
  assert.deepEqual(visits, [directUrl]);
});

test('adaptive retrieval stops at 30 for a stable top 10 and expands when membership changes', () => {
  const stableLiked = Array.from({ length: 30 }, (_, index) => ({ sourceId: `q${index + 1}` }));
  const stableMisconceptions = [...stableLiked];
  const stable = assessAdaptiveShortlist({
    liked: stableLiked,
    misconceptions: stableMisconceptions,
    limitPerSort: 30,
    comparisonLimit: 15,
    top: 10
  });
  assert.equal(stable.filled, true);
  assert.equal(stable.stable, true);
  assert.equal(stable.shouldExpand, false);

  const changing = assessAdaptiveShortlist({
    liked: stableLiked,
    misconceptions: [
      ...Array.from({ length: 15 }, (_, index) => ({ sourceId: `m${index + 1}` })),
      ...stableLiked.slice(0, 15)
    ],
    limitPerSort: 30,
    comparisonLimit: 15,
    top: 10
  });
  assert.equal(changing.stable, false);
  assert.equal(changing.shouldExpand, true);
});

test('adaptive retrieval expands an underfilled shortlist and fixed limit remains compatible', () => {
  const underfilled = assessAdaptiveShortlist({
    liked: [{ sourceId: 'a' }],
    misconceptions: [{ sourceId: 'a' }],
    limitPerSort: 30,
    comparisonLimit: 15,
    top: 10
  });
  assert.equal(underfilled.reason, 'underfilled');
  assert.equal(underfilled.shouldExpand, true);
  assert.deepEqual(createRetrievalPolicy({ top: 10 }).limits, [30, 60, 100]);
  assert.deepEqual(createRetrievalPolicy({ limitPerSort: 42, top: 12 }), {
    version: 1, mode: 'fixed', limits: [42], top: 12, stability: null
  });
});

test('a scoped leaf run preserves an existing full taxonomy', () => {
  const state = createEmptyCaptureState('https://example.test/questions');
  const leafNodes = [{
    label: 'Fractions', categoryPath: ['Number', 'Fractions'], subjectId: '21',
    url: 'https://example.test/Questions?currentSubjectId=21'
  }];
  recordTaxonomy(state, {
    leaves: [['Number', 'Fractions'], ['Algebra', 'Linear Equations']],
    leafNodes,
    nodes: leafNodes,
    recordedAt: '2026-08-02T00:00:00.000Z'
  });
  recordTaxonomy(state, {
    requestedLeaf: ['Geometry', 'Pythagoras'],
    requestedNode: {
      label: 'Pythagoras', categoryPath: ['Geometry', 'Pythagoras'], subjectId: '44',
      url: 'https://example.test/Questions?currentSubjectId=44'
    },
    recordedAt: '2026-08-02T01:00:00.000Z'
  });
  assert.deepEqual(state.taxonomy.leaves, [
    ['Number', 'Fractions'],
    ['Algebra', 'Linear Equations']
  ]);
  assert.deepEqual(state.taxonomy.scopedRuns, [{
    categoryPath: ['Geometry', 'Pythagoras'],
    label: 'Pythagoras',
    url: 'https://example.test/Questions?currentSubjectId=44',
    subjectId: '44',
    recordedAt: '2026-08-02T01:00:00.000Z'
  }]);
  assert.equal(state.taxonomy.leafNodes[0].url, leafNodes[0].url);
});

test('saved HTML fixture supports browser-free recursive ranking', async () => {
  const html = await readFile(path.join(here, 'fixtures/dq/questions-page.html'), 'utf8');
  const catalog = parseEmbeddedFixtureHtml(html);
  const results = await rankFixtureCatalog(catalog, { limitPerSort: 100, top: 50 });

  assert.deepEqual(results.map((entry) => entry.categoryPath), [
    ['Number', 'Basic Arithmetic'],
    ['Number', 'Fractions'],
    ['Algebra', 'Expanding Brackets']
  ]);
  assert.equal(results[0].candidates[0].sourceId, '101');
  assert.deepEqual(results[0].candidates[0].ranks, { liked: 1, misconceptions: 2 });
  assert.deepEqual(await fixtureAdapter(catalog).listChildren(['Number']), ['Basic Arithmetic', 'Fractions']);
});

test('saved network fixture feeds the same deterministic ranker', async () => {
  const payload = JSON.parse(await readFile(path.join(here, 'fixtures/dq/questions-most-liked.json'), 'utf8'));
  const ranked = fuseRankedQuestions({ liked: payload.items, misconceptions: [], top: 3 });
  assert.deepEqual(ranked.map((question) => question.sourceId), ['dq-9001', 'dq-9002', 'dq-9003']);
  assert.equal(ranked[0].likes, 120);
});

test('capture state merges repeated source IDs and preserves all source paths', () => {
  const state = createEmptyCaptureState('https://example.test/questions');
  mergeCandidateState(state, {
    sourceId: '42', categoryPath: ['Number', 'Fractions'],
    sourceCategory: { label: 'Fractions', subjectId: '21', url: 'https://example.test/?currentSubjectId=21' },
    capture: { pngPath: 'png/42.png', pngChecksum: 'abc' }
  });
  mergeCandidateState(state, {
    sourceId: '42', categoryPath: ['Number', 'Ratio'], likes: 99,
    sourceCategory: { label: 'Ratio', subjectId: '22', url: 'https://example.test/?currentSubjectId=22' }
  });
  assert.equal(Object.keys(state.candidates).length, 1);
  assert.deepEqual(state.candidates['42'].sourcePaths, [
    ['Number', 'Fractions'],
    ['Number', 'Ratio']
  ]);
  assert.equal(state.candidates['42'].capture.pngChecksum, 'abc');
  assert.equal(state.candidates['42'].likes, 99);
  assert.deepEqual(state.candidates['42'].sourceCategories.map((category) => category.subjectId), ['21', '22']);
});

test('resume helper skips an intact source/checksum and recaptures changed content', () => {
  const existing = {
    sourceId: '42',
    capture: { pngPath: 'png/42.png', pngChecksum: 'original' }
  };
  assert.equal(shouldCaptureCandidate(existing), false);
  assert.equal(shouldCaptureCandidate(existing, { pngChecksum: 'original' }), false);
  assert.equal(shouldCaptureCandidate(existing, { pngChecksum: 'changed' }), true);
  assert.equal(shouldCaptureCandidate({ sourceId: '42' }), true);
});

test('anonymous IDs are stable and retry uses bounded exponential backoff', async () => {
  assert.equal(
    stableQuestionId({ imageUrl: 'https://example.test/q.png' }),
    stableQuestionId({ imageUrl: 'https://example.test/q.png' })
  );
  const delays = [];
  let calls = 0;
  const value = await retryWithBackoff(async () => {
    calls += 1;
    if (calls < 3) throw new Error('temporary');
    return 'ok';
  }, {
    attempts: 4,
    baseDelayMs: 10,
    maxDelayMs: 15,
    sleep: async (delay) => delays.push(delay)
  });
  assert.equal(value, 'ok');
  assert.deepEqual(delays, [10, 15]);
});

test('CLI defaults to dry-run and validates numeric limits', () => {
  assert.deepEqual(parseArgs(['crawl', '--top', '50', '--headless']), {
    command: 'crawl', write: false, headless: true, top: 50, forceSourceIds: []
  });
  assert.deepEqual(parseArgs(['crawl', '--force-source-ids', '42, 99']).forceSourceIds, ['42', '99']);
  assert.equal(parseArgs(['crawl', '--leaf-path', 'Algebra > Solving Equations']).leafPath,
    'Algebra > Solving Equations');
  assert.throws(() => parseArgs(['crawl', '--limit-per-sort', '0']), /positive integer/);
});

test('resume skips only complete same-policy leaves with intact selected captures', async (t) => {
  const archive = await mkdtemp(path.join(os.tmpdir(), 'mathsmap-dq-resume-'));
  t.after(() => rm(archive, { recursive: true, force: true }));
  const pngDir = path.join(archive, 'png');
  const { mkdir, writeFile } = await import('node:fs/promises');
  await mkdir(pngDir, { recursive: true });
  const bytes = Buffer.from('png-like-test-data');
  await writeFile(path.join(pngDir, '42.png'), bytes);
  const policy = createRetrievalPolicy({ top: 10 });
  const state = createEmptyCaptureState('https://example.test/questions');
  state.candidates['42'] = {
    sourceId: '42',
    capture: {
      pngPath: 'png/42.png',
      pngChecksum: (await import('../scripts/dq/capture-core.mjs')).sha256(bytes)
    }
  };
  state.leafRuns['number/fractions'] = {
    completed: true,
    status: 'complete',
    retrievalPolicy: policy,
    retrievalPolicyFingerprint: retrievalPolicyFingerprint(policy),
    selectedIds: ['42']
  };
  assert.equal(await canResumeLeafRun(state, ['Number', 'Fractions'], policy, archive), true);
  assert.equal(await canResumeLeafRun(state, {
    label: 'Fractions',
    categoryPath: ['Number', 'Fractions'],
    subjectId: '21',
    url: 'https://example.test/Questions?currentSubjectId=21'
  }, policy, archive), true);
  state.leafRuns['number/fractions'].retrievalPolicy = createRetrievalPolicy({ limitPerSort: 30, top: 10 });
  assert.equal(await canResumeLeafRun(state, ['Number', 'Fractions'], policy, archive), false);
});

test('browser authentication state is explicitly saved and restored across commands', async (t) => {
  const archive = await mkdtemp(path.join(os.tmpdir(), 'mathsmap-dq-auth-'));
  t.after(() => rm(archive, { recursive: true, force: true }));
  const saved = {
    cookies: [{ name: 'session', value: 'opaque', domain: 'example.test', path: '/' }],
    origins: [{ origin: 'https://example.test', localStorage: [{ name: 'auth', value: 'opaque' }] }]
  };
  const savingContext = { storageState: async () => saved };
  await saveBrowserStorageState(savingContext, archive);

  const calls = { cookies: null, origins: null };
  const restoringContext = {
    addCookies: async (cookies) => { calls.cookies = cookies; },
    addInitScript: async (_script, origins) => { calls.origins = origins; }
  };
  assert.equal(await restoreBrowserStorageState(restoringContext, archive), true);
  assert.deepEqual(calls.cookies, saved.cookies);
  assert.deepEqual(calls.origins, saved.origins);
});
