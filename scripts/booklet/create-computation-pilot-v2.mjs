#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  BOOKLET_AGY_MODEL, WORK_ROOT, buildModuleCandidates, contentHash, hashFile, prepareRun, validateRun,
} from './transcription.mjs';

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/, (value) => value.slice(1))), '..', '..');
const SOURCE_ID = 'computation-integers-pilot';
const TARGET_ID = 'computation-integers-pilot-v2';
const SOURCE_ROOT = path.join(WORK_ROOT, SOURCE_ID);
const TARGET_ROOT = path.join(WORK_ROOT, TARGET_ID);
const clone = (value) => JSON.parse(JSON.stringify(value));
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const writeJson = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8'); };

function walk(value, visit) {
  if (!value || typeof value !== 'object') return;
  visit(value);
  for (const child of Object.values(value)) walk(child, visit);
}

function page(transcription, pageNumber) {
  const value = transcription.pages.find((item) => Number(item.pageNumber) === pageNumber);
  if (!value) throw new Error('Missing pilot page ' + pageNumber);
  return value;
}

function block(transcription, id) {
  let found = null;
  walk(transcription.pages, (item) => { if (!found && item?.id === id) found = item; });
  if (!found) throw new Error('Missing pilot block ' + id);
  return found;
}

function sourceAtom(id, kind, label, description, order) {
  return { id, kind, label, description, order, sourceText: (label ? label + ' ' : '') + description };
}

function assignAtom(blocks, metadata) {
  for (const item of blocks) item.sourceAtom = clone(metadata);
}

function tikzBase(min, max) {
  const ticks = [];
  for (let value = min; value <= max; value += 1) ticks.push(value);
  return '\\begin{tikzpicture}[x=0.7cm,>=stealth]\\path[use as bounding box] (' + (min - .5) + ',-.65) rectangle (' + (max + .5) + ',1);\\draw[thick,<->] (' + (min - .5) + ',0)--(' + (max + .5) + ',0);\\foreach \\x in {' + ticks.join(',') + '}{\\draw[thick] (\\x,.15)--(\\x,-.15) node[below]{\\small $\\x$};}\\end{tikzpicture}';
}

function tikzOverlay(min, max, arrows) {
  const paths = arrows.map(([from, to, bend]) => '\\draw[thick,red!70!black,->] (' + from + ',.25) to[bend ' + bend + '=45] (' + to + ',.25);').join('');
  return '\\begin{tikzpicture}[x=0.7cm,>=stealth]\\path[use as bounding box] (' + (min - .5) + ',-.65) rectangle (' + (max + .5) + ',1);' + paths + '\\end{tikzpicture}';
}

function diagram(id, role, code, overlayOf = null) {
  return { id, role, format: 'tikz', code, src: null, widthMm: 50, alt: role === 'question' ? 'Plain integer number line' : 'Number-line jumps for the worked solution', overlayOf, transparent: true, axes: null, derived: true, reviewStatus: 'needs-review' };
}

function replaceTexDots(value) {
  return String(value).replace(/(?:\\dots\s*){2,}/g, '\\underline{\\hspace{10mm}}');
}

function referencedAssets(transcription) {
  const found = [];
  for (const currentPage of transcription.pages) walk(currentPage.blocks, (item) => {
    if (typeof item?.src === 'string' && item.src.startsWith('evidence/')) found.push({ path: item.src, pageNumber: currentPage.pageNumber, rootId: item.id ?? currentPage.id });
  });
  return found;
}

if (!fs.existsSync(SOURCE_ROOT)) throw new Error('Source pilot does not exist: ' + SOURCE_ID);
if (fs.existsSync(TARGET_ROOT)) throw new Error('Target run already exists and will not be overwritten: ' + TARGET_ID);

const source = readJson(path.join(SOURCE_ROOT, 'merged', 'transcription.json'));
const prepared = prepareRun({
  pdf: path.join(REPO_ROOT, 'booklets', 'Computation with Integers.pdf'),
  docx: path.join(REPO_ROOT, 'booklets', 'Computation with Integers.docx'),
  pages: source.selectedPages,
  runId: TARGET_ID,
});
const transcription = clone(source);
transcription.version = 2;
transcription.exactResultFormat = 'mathsmap-exact-transcription-result-v2';
transcription.runId = TARGET_ID;
transcription.model = BOOKLET_AGY_MODEL;
transcription.migratedAt = new Date().toISOString();
delete transcription.mergedAt;
for (const currentPage of transcription.pages) delete currentPage.assets;

const p29 = page(transcription, 29);
const investigation = block(transcription, 'page-29-investigation');
investigation.title = 'Adding and subtracting negative numbers';
assignAtom([investigation], sourceAtom('page-29-atom-1', 'investigation', 'Investigation', 'Adding and subtracting negative numbers', 1));

const p30Theory = block(transcription, 'page-30-theory');
const p30Example = block(transcription, 'page-30-worked-example');
const p30Identify = block(transcription, 'page-30-q1');
const p30Ideas = block(transcription, 'page-30-key-ideas');
assignAtom([p30Theory], sourceAtom('page-30-atom-1', 'definition', 'Definition', 'Rewriting touching signs', 1));
assignAtom([p30Example, p30Identify], sourceAtom('page-30-atom-2', 'identify', 'Identify', 'Rewrite touching signs as a single sign', 2));
p30Identify.pedagogyRole = 'identify';
p30Identify.title = '';
assignAtom([p30Ideas], sourceAtom('page-30-atom-3', 'key-ideas', 'Key Ideas', '', 3));

for (const item of page(transcription, 31).blocks) walk(item.content, (node) => {
  if (!node?.children?.length && 'answerSpaceMm' in node) {
    if (item.id === 'page-31-q1' || item.id === 'page-31-q2') node.answerSpaceMm = 7;
    else if (item.id === 'page-31-q4') node.answerSpaceMm = 5;
  }
});
block(transcription, 'page-31-q3').content.answerSpaceMm = 16;

const p32Theory = block(transcription, 'page-32-theory');
const p32Example = block(transcription, 'page-32-worked-example');
const p32Guided = block(transcription, 'page-32-guided-practice');
const p32Ideas = block(transcription, 'page-32-key-ideas');
assignAtom([p32Theory], sourceAtom('page-32-atom-1', 'definition', 'Definition', 'Adding and subtracting integers', 1));
p32Example.title = 'Add and subtract negative integers';
assignAtom([p32Example], sourceAtom('page-32-atom-2', 'example', 'Example', 'Add and subtract negative integers', 2));
assignAtom([p32Guided], sourceAtom('page-32-atom-3', 'guided-practice', 'Guided Practice', '', 3));
p32Guided.content.prompt = '';
assignAtom([p32Ideas], sourceAtom('page-32-atom-4', 'key-ideas', 'Key Ideas', '', 4));
const firstExample = p32Example.examples[0];
const secondExample = p32Example.examples[1];
firstExample.explanation = 'When the touching signs are [[different|24]], we rewrite as subtraction.';
secondExample.explanation = 'When the touching signs are [[the same|24]], we rewrite as addition.';
firstExample.questionDiagrams = [diagram('page-32-number-line-1-base', 'question', tikzBase(-5, 1))];
firstExample.solutionDiagrams = [diagram('page-32-number-line-1-overlay', 'solution-overlay', tikzOverlay(-5, 1, [[-2, -3, 'right'], [-3, -4, 'right'], [-4, -5, 'right']]), 'page-32-number-line-1-base')];
secondExample.questionDiagrams = [diagram('page-32-number-line-2-base', 'question', tikzBase(-9, -3))];
secondExample.solutionDiagrams = [diagram('page-32-number-line-2-overlay', 'solution-overlay', tikzOverlay(-9, -3, [[-6, -5, 'left'], [-5, -4, 'left']]), 'page-32-number-line-2-base')];
delete firstExample.numberLineTikz;
delete secondExample.numberLineTikz;
walk(page(transcription, 32).blocks, (item) => { if (typeof item?.prompt === 'string') item.prompt = replaceTexDots(item.prompt); });
p32Ideas.content = p32Ideas.content.replace(/\.{6,}/g, '[[single|24]]');

for (const id of ['page-34-q5-content', 'page-35-q6-content', 'page-51-q15-root']) block(transcription, id).questionDiagrams = [];
for (const currentPage of transcription.pages) {
  if (currentPage.pageNumber === 37) {
    walk(currentPage.blocks, (item) => { if (typeof item?.prompt === 'string') item.prompt = item.prompt.replace(/\n?\.{6,}/g, '').trim(); });
  } else if (currentPage.section?.role !== 'front-matter') {
    walk(currentPage.blocks, (item) => {
      if (typeof item?.prompt === 'string') item.prompt = replaceTexDots(item.prompt);
      if (typeof item?.content === 'string' && item.id !== 'page-32-key-ideas') item.content = item.content.replace(/\.{6,}/g, '[[|24]]');
    });
  }
}
block(transcription, 'page-37-q10-content').answer.short = '$-269^\\circ\\text{C}$';
block(transcription, 'page-37-q13-content').answer.short = '$54^\\circ\\text{C}$';

for (const currentPage of transcription.pages.filter((item) => item.section?.role === 'teaching')) {
  let order = 0;
  for (const item of currentPage.blocks) {
    if (item.sourceAtom || item.pedagogyRole === 'practice') continue;
    order += 1;
    const kind = item.variant === 'key-ideas' ? 'key-ideas' : item.variant === 'investigation' ? 'investigation' : item.type === 'worked-example' ? 'example' : item.pedagogyRole === 'guided-practice' ? 'guided-practice' : 'definition';
    const label = kind === 'key-ideas' ? 'Key Ideas' : kind === 'example' ? 'Example' : kind === 'guided-practice' ? 'Guided Practice' : kind === 'investigation' ? 'Investigation' : 'Definition';
    assignAtom([item], sourceAtom(currentPage.id + '-atom-' + order, kind, label, String(item.title ?? ''), order));
  }
}

const rendered = referencedAssets(transcription);
const allPaths = new Set();
for (const currentPage of source.pages) for (const asset of currentPage.assets ?? []) allPaths.add(asset.path ?? asset.src ?? asset);
allPaths.add('evidence/word/media/media/image310.png');
const assets = [];
for (const item of rendered) {
  assets.push({ occurrenceId: 'page-' + item.pageNumber + '-asset-' + String(assets.length + 1), path: item.path, pageNumber: item.pageNumber, usage: 'rendered', relationshipId: null, placement: { rootId: item.rootId } });
  allPaths.delete(item.path);
}
for (const assetPath of allPaths) {
  const pageNumber = assetPath.endsWith('image74.png') ? 34 : assetPath.endsWith('image75.png') ? 35 : assetPath.endsWith('image117.png') ? 51 : assetPath.endsWith('image310.png') ? 32 : 1;
  const count = assetPath.endsWith('image310.png') ? 2 : 1;
  for (let index = 0; index < count; index += 1) assets.push({ occurrenceId: 'page-' + pageNumber + '-evidence-' + String(index + 1) + '-' + path.basename(assetPath, path.extname(assetPath)), path: assetPath, pageNumber, usage: 'evidence-only', relationshipId: null, placement: { occurrence: index + 1 } });
}
transcription.assets = assets;

const migrationDir = path.join(TARGET_ROOT, 'migration');
writeJson(path.join(migrationDir, 'source-transcription-v1.json'), source);
writeJson(path.join(migrationDir, 'record.json'), {
  format: 'mathsmap-booklet-pilot-migration-v1',
  fromRun: SOURCE_ID,
  toRun: TARGET_ID,
  sourceContentHash: contentHash(source),
  resultContentHash: contentHash(transcription),
  corrections: [29, 30, 31, 32, 34, 35, 37, 51],
  createdAt: transcription.migratedAt,
});
writeJson(path.join(TARGET_ROOT, 'merged', 'transcription.json'), transcription);
writeJson(path.join(TARGET_ROOT, 'merged', 'modules.json'), { format: 'mathsmap-module-candidates-v1', modules: buildModuleCandidates(transcription) });
fs.mkdirSync(path.join(TARGET_ROOT, 'lanes', 'exact'), { recursive: true });
fs.cpSync(path.join(TARGET_ROOT, 'evidence'), path.join(TARGET_ROOT, 'lanes', 'exact', 'evidence'), { recursive: true });

const manifestFile = path.join(TARGET_ROOT, 'manifest.json');
const manifest = readJson(manifestFile);
manifest.status = 'review';
manifest.lanes.exact = { status: 'merged-migrated', migratedFrom: SOURCE_ID, mergedAt: transcription.migratedAt, contentHash: contentHash(transcription) };
for (const relative of ['migration/source-transcription-v1.json', 'migration/record.json']) manifest.pins.runFiles[relative] = hashFile(path.join(TARGET_ROOT, relative));
writeJson(manifestFile, manifest);

const reviewFile = path.join(TARGET_ROOT, 'review.json');
const review = readJson(reviewFile);
for (const id of ['page-32-number-line-1-base', 'page-32-number-line-1-overlay', 'page-32-number-line-2-base', 'page-32-number-line-2-overlay']) review.diagrams[id] = { accepted: false };
review.history.push({ at: transcription.migratedAt, type: 'pilot-v2-created', fromRun: SOURCE_ID, pages: [29, 30, 31, 32, 34, 35, 37, 51] });
writeJson(reviewFile, review);

const validation = validateRun(prepared.runDir);
console.log(JSON.stringify({ runId: TARGET_ID, runDir: TARGET_ROOT, validation }, null, 2));
