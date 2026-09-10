import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseResultFile } from '../agy/lib/agy-run.mjs';
import { TRANSCRIPTION_DEFAULT, requireCurrentTranscription } from './transcription-settings.mjs';
import { normaliseQuestion, validateQuestion } from '../../src/lib/practice-question-model.js';
import { normalizeTeachingModule, validateTeachingModule } from '../../src/lib/teaching-module-model.js';
import { sourcePresentationFlags } from '../../src/lib/source-presentation.js';
import { validSourceRegion } from '../../src/lib/diagram-source-region.js';
import { loadDraftPreview } from './transcription-preview.mjs';

export const BOOKLET_AGY_MODEL = 'gemini-3.8-flash-high';
// Source pages are independent after continuation groups have been identified.
// Keep this deliberately bounded: page-level model calls can be expensive and
// an unbounded pool amplifies provider throttling and makes failures harder to
// diagnose.
export const DEFAULT_CONCURRENCY = 3;
export const FULL_IMPORT_FORMAT = 'mathsmap-full-booklet-import-v1';
export const RUN_MANIFEST_FORMAT = 'mathsmap-booklet-transcription-run-v1';
export const EXACT_RESULT_FORMAT = 'mathsmap-exact-transcription-result-v2';
export const MAX_STRUCTURAL_PAGES = 3;
export const MAX_QUESTIONS_PER_TASK = 5;

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(HERE, '../..');
export const WORK_ROOT = path.join(REPO_ROOT, '.booklet-work', 'full-imports');
const PROMPT_ROOT = path.join(HERE, 'prompts');
const PRESENTATION_CONTRACT = path.join(PROMPT_ROOT, 'source-presentation-v2.md');
export function presentationContractForRun(manifest) {
  for (const file of [PRESENTATION_CONTRACT, path.join(PROMPT_ROOT, 'source-presentation-v1.md')]) {
    const relative = path.relative(REPO_ROOT, file).replaceAll(path.sep, '/');
    if (manifest.pins?.files?.[relative]) return fs.readFileSync(file, 'utf8');
  }
  return '';
}
const SCHEMA_FILES = [
  path.join(HERE, 'exact-transcription-v2-schema.json'),
  path.join(HERE, 'practice-question-schema.json'),
  path.join(HERE, 'teaching-module-schema.json'),
  path.join(HERE, 'booklet-project-v3-schema.json'),
];
const TAXONOMY_FILES = [path.join(REPO_ROOT, 'data', 'skills.json'), path.join(REPO_ROOT, 'data', 'dotpoints.json')];

const json = (value) => JSON.stringify(value, null, 2) + '\n';
const safeId = (value) => String(value ?? '').replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 120);
const readJson = (file) => JSON.parse(String(fs.readFileSync(file, 'utf8')).replace(/^\uFEFF/, ''));
const writeJson = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, json(value), 'utf8'); };
const clone = (value) => JSON.parse(JSON.stringify(value));

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}

export function hashValue(value) {
  return crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
}

export function hashFile(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

export function parsePageSelection(value) {
  const pages = new Set();
  for (const token of String(value ?? '').split(',').map((part) => part.trim()).filter(Boolean)) {
    const range = token.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      const start = Number(range[1]); const end = Number(range[2]);
      if (start < 1 || end < start) throw new Error(`Invalid page range: ${token}`);
      for (let page = start; page <= end; page += 1) pages.add(page);
    } else if (/^\d+$/.test(token) && Number(token) > 0) pages.add(Number(token));
    else throw new Error(`Invalid page selection token: ${token}`);
  }
  return [...pages].sort((a, b) => a - b);
}

function continuationGroups(pages, continuations = []) {
  const selected = new Set(pages);
  const parent = new Map(pages.map((page) => [page, page]));
  const find = (page) => parent.get(page) === page ? page : (parent.set(page, find(parent.get(page))), parent.get(page));
  const join = (a, b) => { const ra = find(a); const rb = find(b); if (ra !== rb) parent.set(rb, ra); };
  for (const pair of continuations) {
    const values = Array.isArray(pair) ? pair : [pair.from, pair.to];
    if (values.length !== 2 || !values.every((page) => selected.has(Number(page)))) throw new Error(`Continuation references an unselected page: ${JSON.stringify(pair)}`);
    join(Number(values[0]), Number(values[1]));
  }
  const groups = new Map();
  for (const page of pages) { const root = find(page); if (!groups.has(root)) groups.set(root, []); groups.get(root).push(page); }
  return [...groups.values()].map((group) => group.sort((a, b) => a - b)).sort((a, b) => a[0] - b[0]);
}

export function shardPages(pages, { continuations = [], maxPages = MAX_STRUCTURAL_PAGES } = {}) {
  const units = continuationGroups([...new Set(pages)].sort((a, b) => a - b), continuations);
  if (units.some((unit) => unit.length > maxPages)) throw new Error(`A continuation group exceeds the ${maxPages}-page structural limit`);
  const shards = [];
  let current = [];
  for (const unit of units) {
    const contiguous = !current.length || unit[0] === current[current.length - 1] + 1;
    if (!contiguous || current.length + unit.length > maxPages) { if (current.length) shards.push(current); current = []; }
    current.push(...unit);
  }
  if (current.length) shards.push(current);
  return shards;
}

export function shardQuestions(items, maxQuestions = MAX_QUESTIONS_PER_TASK) {
  const shards = [];
  for (let index = 0; index < items.length; index += maxQuestions) shards.push(items.slice(index, index + maxQuestions));
  return shards;
}

function commandExists(command) {
  const result = spawnSync(process.platform === 'win32' ? 'where.exe' : 'which', [command], { encoding: 'utf8' });
  if (result.status === 0) return true;
  // Windows sandbox command aliases can be executable without being enumerable
  // by where.exe. Poppler does not accept --version, so an ordinary nonzero exit
  // still establishes that the executable was launched.
  if (process.platform === 'win32') {
    const probe = spawnSync(command, ['--version'], { encoding: 'utf8', windowsHide: true, timeout: 10000 });
    return !probe.error && Number.isInteger(probe.status);
  }
  return false;
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, ...options });
  if (result.status !== 0) throw new Error(`${command} failed: ${String(result.stderr || result.stdout || '').trim()}`);
  return String(result.stdout ?? '');
}

function assertTooling() {
  const errors = [];
  for (const command of ['pdftoppm', 'pdftotext', 'pandoc']) if (!commandExists(command)) errors.push(`${command} is unavailable`);
  for (const file of [...SCHEMA_FILES, ...TAXONOMY_FILES]) if (!fs.existsSync(file)) errors.push(`Required pinned input is missing: ${path.relative(REPO_ROOT, file)}`);
  if (errors.length) throw new Error(errors.join('; '));
}

function pinFiles(files) {
  return Object.fromEntries(files.map((file) => [path.relative(REPO_ROOT, file).replaceAll(path.sep, '/'), hashFile(file)]));
}

function manifestPath(runDir) { return path.join(runDir, 'manifest.json'); }
function reviewPath(runDir) { return path.join(runDir, 'review.json'); }
function laneDir(runDir, lane) { return path.join(runDir, 'lanes', lane); }
function mergedPath(runDir, name) { return path.join(runDir, 'merged', `${name}.json`); }

export function loadRun(runIdOrDir, workRoot = WORK_ROOT) {
  const runDir = path.isAbsolute(runIdOrDir) ? runIdOrDir : path.join(workRoot, safeId(runIdOrDir));
  if (!fs.existsSync(manifestPath(runDir))) throw new Error(`Run not found: ${runIdOrDir}`);
  return { runDir, manifest: readJson(manifestPath(runDir)) };
}

export function assertPinnedInputs(runDir) {
  const manifest = readJson(manifestPath(runDir));
  if (![BOOKLET_AGY_MODEL, TRANSCRIPTION_DEFAULT.model].includes(manifest.model) || manifest.pins.model !== hashValue(manifest.model)) throw new Error('Pinned model changed');
  if (manifest.model === TRANSCRIPTION_DEFAULT.model) requireCurrentTranscription(manifest);
  const mismatches = [];
  for (const [relative, expected] of Object.entries(manifest.pins.files ?? {})) {
    const file = path.join(REPO_ROOT, relative);
    if (!fs.existsSync(file) || hashFile(file) !== expected) mismatches.push(relative);
  }
  for (const [relative, expected] of Object.entries(manifest.pins.runFiles ?? {})) {
    const file = path.join(runDir, relative);
    if (!fs.existsSync(file) || hashFile(file) !== expected) mismatches.push(relative);
  }
  if (mismatches.length) throw new Error(`Pinned input changed or disappeared: ${mismatches.join(', ')}`);
  return manifest;
}

export function prepareRun({ pdf, docx, teacherPdf = null, teacherDocx = null, pages, runId = null, workRoot = WORK_ROOT, continuations = [], concurrency = DEFAULT_CONCURRENCY }) {
  assertTooling();
  concurrency = Number(concurrency);
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new Error('Concurrency must be a positive integer');
  const selectedPages = Array.isArray(pages) ? pages : parsePageSelection(pages);
  if (!selectedPages.length) throw new Error('At least one source page must be selected');
  for (const file of [pdf, docx]) if (!file || !fs.existsSync(file)) throw new Error(`Source file not found: ${file}`);
  const id = safeId(runId || `booklet-${new Date().toISOString().replace(/[:.]/g, '-')}`);
  const runDir = path.join(workRoot, id);
  if (fs.existsSync(runDir)) throw new Error(`Run already exists: ${id}`);
  const sourceDir = path.join(runDir, 'source');
  const evidenceDir = path.join(runDir, 'evidence');
  const pagesDir = path.join(evidenceDir, 'pages');
  fs.mkdirSync(pagesDir, { recursive: true });
  const pdfCopy = path.join(sourceDir, 'booklet.pdf');
  const docxCopy = path.join(sourceDir, 'booklet.docx');
  fs.mkdirSync(sourceDir, { recursive: true });
  fs.copyFileSync(path.resolve(pdf), pdfCopy);
  fs.copyFileSync(path.resolve(docx), docxCopy);
  const pdfText = runCommand('pdftotext', ['-layout', pdfCopy, '-']).split('\f');
  for (const page of selectedPages) {
    const prefix = path.join(pagesDir, `page-${String(page).padStart(3, '0')}`);
    runCommand('pdftoppm', ['-f', String(page), '-l', String(page), '-singlefile', '-png', '-r', '170', pdfCopy, prefix]);
    fs.writeFileSync(`${prefix}.txt`, String(pdfText[page - 1] ?? '').trim() + '\n', 'utf8');
  }
  const wordDir = path.join(evidenceDir, 'word');
  fs.mkdirSync(wordDir, { recursive: true });
  runCommand('pandoc', [docxCopy, '-t', 'markdown', `--extract-media=${path.join(wordDir, 'media')}`, '-o', path.join(wordDir, 'document.md')]);
  const wordMarkdown = fs.readFileSync(path.join(wordDir, 'document.md'), 'utf8');
  writeJson(path.join(wordDir, 'asset-occurrences.json'), { format: 'mathsmap-word-asset-occurrences-v1', occurrences: extractWordAssetOccurrences(wordMarkdown) });
  writeJson(path.join(evidenceDir, 'continuations.json'), { continuations });
  const runFiles = [
    path.relative(runDir, pdfCopy), path.relative(runDir, docxCopy),
    ...selectedPages.flatMap((page) => [
      path.relative(runDir, path.join(pagesDir, `page-${String(page).padStart(3, '0')}.png`)),
      path.relative(runDir, path.join(pagesDir, `page-${String(page).padStart(3, '0')}.txt`)),
    ]),
    path.relative(runDir, path.join(wordDir, 'document.md')),
    path.relative(runDir, path.join(wordDir, 'asset-occurrences.json')),
    path.relative(runDir, path.join(evidenceDir, 'continuations.json')),
  ];
  if (teacherPdf || teacherDocx) {
    if (!teacherPdf || !teacherDocx || !fs.existsSync(teacherPdf) || !fs.existsSync(teacherDocx)) throw new Error('Provide both teacher PDF and DOCX');
    const teacherDir = path.join(evidenceDir, 'teacher');
    fs.mkdirSync(teacherDir, { recursive: true });
    fs.copyFileSync(teacherPdf, path.join(sourceDir, 'teacher.pdf'));
    fs.copyFileSync(teacherDocx, path.join(sourceDir, 'teacher.docx'));
    fs.writeFileSync(path.join(teacherDir, 'pages.txt'), runCommand('pdftotext', ['-layout', teacherPdf, '-']));
    runCommand('pandoc', [teacherDocx, '-t', 'markdown', `--extract-media=${path.join(teacherDir,'media')}`, '-o', path.join(teacherDir,'document.md')]);
    const contract = 'Student pages define prompts, layouts, scaffolds and answer visibility. Teacher material supplies answer evidence only. Match questions by stem, labels and mathematical content, never by page number alone. Teacher text is in evidence/teacher/pages.txt (form-feed page boundaries), with Word evidence in evidence/teacher/document.md. Store page.answerEvidence records {questionId,teacherReference,matchEvidence,conflict}. Flag ambiguous matches, contradictions or absent answers; never silently substitute teacher prompts or leak answers into student questions. Preserve teacher answers separately under the canonical answer fields. Known equations and domains define graphs: use equation-based TikZ, not curve tracing; retain images when the mathematics is uncertain.';
    fs.writeFileSync(path.join(teacherDir, 'authority.txt'), contract);
    runFiles.push('source/teacher.pdf','source/teacher.docx','evidence/teacher/pages.txt','evidence/teacher/document.md','evidence/teacher/authority.txt');
  }
  const manifest = {
    format: RUN_MANIFEST_FORMAT, version: 1, id, createdAt: new Date().toISOString(), status: 'prepared',
    ...TRANSCRIPTION_DEFAULT, concurrency, selectedPages, continuations,
    exactResultFormat: EXACT_RESULT_FORMAT,
    source: { pdf: path.resolve(pdf), docx: path.resolve(docx), pdfHash: hashFile(pdfCopy), docxHash: hashFile(docxCopy), ...(teacherPdf ? { teacherPdf:path.resolve(teacherPdf), teacherDocx:path.resolve(teacherDocx) } : {}) },
    pins: {
      model: hashValue(TRANSCRIPTION_DEFAULT.model),
      files: pinFiles([...SCHEMA_FILES, PRESENTATION_CONTRACT, ...TAXONOMY_FILES]),
      runFiles: Object.fromEntries(runFiles.map((relative) => [relative.replaceAll(path.sep, '/'), hashFile(path.join(runDir, relative))])),
    },
    lanes: {},
  };
  writeJson(manifestPath(runDir), manifest);
  writeJson(reviewPath(runDir), {
    format: 'mathsmap-booklet-review-v1', runId: id,
    flags: [], history: [],
    contentOverrides: {}, layoutOverrides: { answerSpaces: {}, diagramColourModes: {} },
  });
  return { runDir, manifest };
}

export function extractWordAssetOccurrences(markdown) {
  const occurrences = [];
  const pattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  let match;
  while ((match = pattern.exec(String(markdown ?? '')))) {
    occurrences.push({
      occurrenceId: 'word-asset-' + String(occurrences.length + 1).padStart(4, '0'),
      path: match[2].replaceAll('\\', '/'),
      alt: match[1],
      markdownOffset: match.index,
    });
  }
  return occurrences;
}

function walk(value, visit) {
  if (!value || typeof value !== 'object') return;
  visit(value);
  if (Array.isArray(value)) for (const item of value) walk(item, visit);
  else for (const child of Object.values(value)) walk(child, visit);
}

function contentProjection(node) {
  const copy = clone(node);
  for (const key of ['classification', 'contentHash', 'review', 'reviewFlags', 'mapping', 'mappingNote']) delete copy[key];
  return copy;
}

export function contentHash(node) { return hashValue(contentProjection(node)); }

function pointerSegments(pointer) {
  if (!String(pointer ?? '').startsWith('/')) throw new Error('Content override path must be a JSON pointer');
  return String(pointer).slice(1).split('/').filter(Boolean).map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'));
}

function setPointer(root, pointer, value) {
  const parts = pointerSegments(pointer);
  if (!parts.length) throw new Error('Content override cannot replace the root id');
  let target = root;
  for (const part of parts.slice(0, -1)) {
    if (!target || typeof target !== 'object' || !(part in target)) throw new Error(`Content override path does not exist: ${pointer}`);
    target = target[part];
  }
  const key = parts.at(-1);
  if (!target || typeof target !== 'object' || !(key in target)) throw new Error(`Content override path does not exist: ${pointer}`);
  target[key] = clone(value);
}

function getPointer(root, pointer) {
  return pointerSegments(pointer).reduce((value, key) => value?.[key], root);
}

export function applyContentOverrides(transcription, review = {}, { strict = true, conflicts = [] } = {}) {
  const effective = clone(transcription);
  for (const [rootId, fields] of Object.entries(review.contentOverrides ?? {})) {
    const root = findRoot(effective.pages ?? effective.sections, rootId);
    if (!root) {
      conflicts.push({ rootId, reason: 'Edited content disappeared' });
      if (strict) throw new Error(`Content override root disappeared: ${rootId}`);
      continue;
    }
    const entries = Object.entries(fields ?? {}).sort(([a], [b]) => a.localeCompare(b));
    const expected = entries[0]?.[1]?.beforeHash;
    if (expected && contentHash(root) !== expected) {
      conflicts.push({ rootId, reason: 'Source content changed since this edit' });
      if (strict) throw new Error(`Content override is stale: ${rootId}`);
      continue;
    }
    for (const [pointer, record] of entries) setPointer(root, pointer, record?.value);
  }
  return effective;
}

function exactResultAssets(result) {
  const raw = result.assets ?? (result.pages ?? []).flatMap((page) => page.assets ?? []);
  return raw.map((asset, index) => typeof asset === 'string'
    ? { occurrenceId: `legacy-asset-${index + 1}`, path: asset, pageNumber: null, usage: 'rendered' }
    : { ...asset, path: asset.path ?? asset.src, usage: asset.usage ?? 'rendered' });
}

function assertExactV2Result(result) {
  if (result.format !== EXACT_RESULT_FORMAT) throw new Error(`Expected ${EXACT_RESULT_FORMAT}, got ${result.format ?? 'missing format'}`);
  if (!Array.isArray(result.pages) || !Array.isArray(result.assets)) throw new Error('Exact v2 result requires page and asset occurrence arrays');
  for (const page of result.pages ?? []) {
    if (!Array.isArray(page.blocks) || !Array.isArray(page.reviewFlags)) throw new Error(`Invalid v2 exact page: ${page.id ?? page.pageNumber}`);
    const atomMeta = new Map();
    const closed = new Set();
    let active = null;
    for (const block of page.blocks) {
      const atom = block.sourceAtom;
      const needsAtom = page.section?.role === 'teaching'
        && (['callout', 'worked-example'].includes(block.type) || ['identify', 'guided-practice', 'key-ideas', 'investigation'].includes(block.pedagogyRole));
      if (needsAtom && !atom) throw new Error(`Teaching atom metadata is missing on ${block.id}`);
      if (!atom) { active = null; continue; }
      if (!atom.id || !Number.isInteger(atom.order) || !['review', 'definition', 'investigation', 'identify', 'example', 'guided-practice', 'key-ideas', 'none'].includes(atom.kind)) throw new Error(`Invalid sourceAtom on ${block.id}`);
      const signature = hashValue({ ...atom, order: undefined });
      if (atomMeta.has(atom.id) && atomMeta.get(atom.id) !== signature) throw new Error(`Inconsistent sourceAtom metadata: ${atom.id}`);
      atomMeta.set(atom.id, signature);
      if (active !== atom.id && closed.has(atom.id)) throw new Error(`Non-consecutive sourceAtom: ${atom.id}`);
      if (active && active !== atom.id) closed.add(active);
      active = atom.id;
    }
  }
  for (const asset of exactResultAssets(result)) {
    if (!asset.occurrenceId || !asset.path || !Number.isInteger(Number(asset.pageNumber)) || !['rendered', 'evidence-only'].includes(asset.usage)) throw new Error(`Invalid v2 asset occurrence: ${asset.occurrenceId ?? asset.path ?? 'unknown'}`);
  }
}

export function collectQuestions(transcription) {
  const found = [];
  for (const page of transcription.pages ?? []) for (const block of page.blocks ?? []) walk(block, (node) => {
    if (node?.type === 'question' && node.id && node.content && !found.some((item) => item.id === node.id)) found.push({ ...clone(node), pageNumber: page.pageNumber, contentHash: contentHash(node) });
  });
  return found.sort((a, b) => a.pageNumber - b.pageNumber || Number(a.sourceOrder ?? 0) - Number(b.sourceOrder ?? 0) || a.id.localeCompare(b.id));
}

export function buildModuleCandidates(transcription) {
  const orderedPages = [...(transcription.pages ?? [])].sort((a, b) => a.pageNumber - b.pageNumber);
  const implicitByPage = new Map();
  let run = [];
  const flush = () => {
    if (!run.some((page) => page.section?.role === 'teaching')) { run = []; return; }
    const firstTeaching = run.find((page) => page.section?.role === 'teaching') ?? run[0];
    const id = `module-page-${run[0].pageNumber}-${run[run.length - 1].pageNumber}`;
    for (const page of run) implicitByPage.set(page.pageNumber, { id, title: firstTeaching.section?.title || 'Teaching module' });
    run = [];
  };
  for (const page of orderedPages) {
    const eligible = ['teaching', 'mixed-practice'].includes(page.section?.role);
    const contiguous = !run.length || page.pageNumber === run[run.length - 1].pageNumber + 1;
    if (!eligible || !contiguous) flush();
    if (eligible) run.push(page);
  }
  flush();
  const groups = new Map();
  for (const page of orderedPages) {
    const implicit = implicitByPage.get(page.pageNumber);
    if (!implicit && page.section?.role !== 'teaching') continue;
    for (const block of page.blocks ?? []) {
      const moduleId = block.moduleId || page.section?.moduleId || implicit?.id || page.section?.id || `module-page-${page.pageNumber}`;
      if (!groups.has(moduleId)) groups.set(moduleId, { id: moduleId, title: implicit?.title || page.section?.title || 'Teaching module', pageNumbers: [], sequence: [] });
      const group = groups.get(moduleId);
      if (!group.pageNumbers.includes(page.pageNumber)) group.pageNumbers.push(page.pageNumber);
      const sourceAtom = clone(block.sourceAtom ?? null);
      const moduleBlock = clone(block);
      delete moduleBlock.sourceAtom;
      group.sequence.push(block.type === 'question'
        ? { type: 'question-ref', id: `module-ref-${block.id}`, questionId: block.id, pedagogyRole: block.pedagogyRole === 'identify' ? 'identify' : block.pedagogyRole === 'practice' ? 'practice' : 'guided-practice', order: 'fixed', sourceAtom }
        : { type: 'content-block', id: `module-item-${block.id}`, pedagogyRole: block.pedagogyRole || (block.type === 'worked-example' ? 'worked-example' : 'theory'), block: moduleBlock, sourceAtom });
    }
  }
  return [...groups.values()].map((module) => ({ ...module, pageNumbers: module.pageNumbers.sort((a, b) => a - b), contentHash: contentHash(module) }));
}

function taskResults(dir) {
  return fs.readdirSync(dir).filter((name) => /^task-\d+\.result\.json$/.test(name)).sort().map((name) => parseResultFile(path.join(dir, name)));
}

function duplicateIds(value) {
  const seen = new Set(); const duplicates = new Set();
  const visit = (node, ownerKey = '') => {
    if (!node || typeof node !== 'object') return;
    if (!Array.isArray(node) && ownerKey !== 'sourceAtom' && typeof node.id === 'string') {
      if (seen.has(node.id)) duplicates.add(node.id);
      seen.add(node.id);
    }
    if (Array.isArray(node)) for (const item of node) visit(item);
    else for (const [key, child] of Object.entries(node)) visit(child, key);
  };
  visit(value);
  return [...duplicates];
}

function collectAssetRefs(value) {
  const refs = new Set();
  walk(value, (node) => { if (node && !Array.isArray(node) && typeof node.src === 'string' && node.src) refs.add(node.src.replaceAll('\\', '/')); });
  return refs;
}

export function mergeLane(runIdOrDir, { lane = 'exact', workRoot = WORK_ROOT } = {}) {
  const { runDir } = loadRun(runIdOrDir, workRoot);
  const manifest = assertPinnedInputs(runDir);
  const results = taskResults(laneDir(runDir, lane));
  if (!results.length) throw new Error(`No ${lane} result files found`);
  if (lane === 'exact') {
    if (manifest.exactResultFormat === EXACT_RESULT_FORMAT) for (const result of results) assertExactV2Result(result);
    const pages = results.flatMap((result) => result.pages ?? []).map((page) => {
      const copy = clone(page); delete copy.assets; return copy;
    }).sort((a, b) => a.pageNumber - b.pageNumber);
    const expected = manifest.selectedPages;
    const got = pages.map((page) => page.pageNumber);
    if (got.length !== expected.length || got.some((page, index) => page !== expected[index])) throw new Error(`Page coverage mismatch: expected ${expected.join(', ')}, got ${got.join(', ')}`);
    const duplicates = duplicateIds({ pages });
    if (duplicates.length) throw new Error(`Duplicate ids in merged transcription: ${duplicates.join(', ')}`);
    const assets = results.flatMap(exactResultAssets);
    const occurrenceIds = assets.map((asset) => asset.occurrenceId);
    if (new Set(occurrenceIds).size !== occurrenceIds.length) throw new Error('Duplicate asset occurrence ids');
    const declared = assets.filter((asset) => asset.usage === 'rendered').map((asset) => asset.path).filter(Boolean);
    const refs = collectAssetRefs(pages);
    const unused = declared.filter((asset) => !refs.has(String(asset).replaceAll('\\', '/')));
    if (unused.length) throw new Error(`Unreferenced declared assets: ${unused.join(', ')}`);
    const declaredRendered = new Set(declared.map((asset) => String(asset).replaceAll('\\', '/')));
    const undeclared = [...refs].filter((asset) => asset.startsWith('evidence/') && !declaredRendered.has(asset));
    if (undeclared.length) throw new Error(`Rendered assets have no occurrence records: ${undeclared.join(', ')}`);
    const evidenceOnlyRendered = assets.filter((asset) => asset.usage === 'evidence-only' && refs.has(String(asset.path).replaceAll('\\', '/')));
    if (evidenceOnlyRendered.length) throw new Error(`Evidence-only assets are referenced for rendering: ${evidenceOnlyRendered.map((asset) => asset.occurrenceId).join(', ')}`);
    const transcription = { format: FULL_IMPORT_FORMAT, version: manifest.exactResultFormat === EXACT_RESULT_FORMAT ? 2 : 1, exactResultFormat: manifest.exactResultFormat ?? 'legacy', runId: manifest.id, model: manifest.model, selectedPages: expected, pages, assets, mergedAt: new Date().toISOString() };
    writeJson(mergedPath(runDir, 'transcription'), transcription);
    const modules = buildModuleCandidates(transcription);
    writeJson(mergedPath(runDir, 'modules'), { format: 'mathsmap-module-candidates-v1', modules });
    manifest.lanes.exact = { ...(manifest.lanes.exact ?? {}), status: 'merged', mergedAt: new Date().toISOString(), contentHash: contentHash(transcription) };
  } else throw new Error(`Unsupported reconstruction lane: ${lane}`);
  writeJson(manifestPath(runDir), manifest);
  return { lane, results: results.length };
}

function diagramRecords(value) {
  const diagrams = [];
  walk(value, (node) => { if (node?.id && ['tikz', 'image', 'svg'].includes(node.format) && ('role' in node || 'src' in node || 'code' in node)) diagrams.push(node); });
  return diagrams;
}

function textFields(value) {
  const fields = [];
  walk(value, (node) => {
    if (!node || Array.isArray(node)) return;
    for (const key of ['title', 'content', 'text', 'prompt', 'theorySolution', 'explanation', 'worked', 'short']) {
      if (typeof node[key] === 'string') fields.push({ id: node.id ?? 'unknown', key, value: node[key] });
    }
  });
  return fields;
}

function hasBareTex(value) {
  const prose = String(value).replace(/\$\$[\s\S]*?\$\$/g, ' ').replace(/\$[^$]*\$/g, ' ');
  return /\\(?:boxed|quad|frac|sqrt|phantom|text|circ|dots|ldots|begin|end)\b/.test(prose);
}

export function transcriptionHazards(transcription) {
  const errors = [];
  for (const page of transcription.pages ?? []) {
    for (const field of textFields(page)) {
      const where = `${field.id}.${field.key}`;
      if (/&#(?:x[0-9a-f]+|\d+);/i.test(field.value)) errors.push(`${where}: visible HTML entity`);
      if (/^```(?:json)?/m.test(field.value)) errors.push(`${where}: fenced content`);
      if (page.section?.role !== 'front-matter' && (/\.{6,}/.test(field.value) || /(?:\\dots\s*){2,}/.test(field.value))) errors.push(`${where}: literal answer-rule dots`);
      if (hasBareTex(field.value)) errors.push(`${where}: TeX command outside maths delimiters`);
      const pipeLines = field.value.split(/\r?\n/).filter((line) => /^\s*\|.*\|\s*$/.test(line));
      if (pipeLines.length && !pipeLines.some((line) => /^\s*\|(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(line))) errors.push(`${where}: malformed Markdown table would render as pipe text`);
      const tableGroups = field.value.match(/(?:^\s*\|.*\|[\t ]*(?:\r?\n|$))+/gm) ?? [];
      for (const group of tableGroups) {
        const counts = group.trim().split(/\r?\n/).map(line => line.trim().slice(1, -1).split(/(?<!\\)\|/).length);
        if (new Set(counts).size > 1) errors.push(`${where}: Markdown table rows have different cell counts`);
      }
      if (/^\s*Investigation\s+Investigation\b/i.test(field.value)) errors.push(`${where}: duplicated Investigation label`);
    }
  }
  walk(transcription.pages, (node) => {
    if (!node || Array.isArray(node)) return;
    const prompt = typeof node.prompt === 'string' ? node.prompt : '';
    const semanticVisual = /\\boxed\b/.test(prompt) || /^\s*\|.*\|\s*$/m.test(prompt);
    // A graph with a separate native response table is legitimate. Treat it as
    // distinct only after a reviewer records the relationship against the source.
    if (semanticVisual && (node.questionDiagrams ?? []).some(diagram => diagram.contentRelationship?.kind !== 'distinct-from-prompt' || !diagram.contentRelationship?.evidence)) errors.push(`${node.id}: native content duplicates a rendered image`);
    if (node.sourceRegion && !validSourceRegion(node.sourceRegion)) errors.push(`${node.id}: invalid source image region`);
  });
  return [...new Set(errors)];
}

export function validateRun(runIdOrDir, { forPublish = false, workRoot = WORK_ROOT } = {}) {
  const { runDir, manifest } = loadRun(runIdOrDir, workRoot);
  const errors = []; const warnings = [];
  try { assertPinnedInputs(runDir); } catch (error) { errors.push(error.message); }
  const transcriptFile = mergedPath(runDir, 'transcription');
  if (!fs.existsSync(transcriptFile)) errors.push('Merged transcription is missing');
  const rawTranscription = fs.existsSync(transcriptFile) ? readJson(transcriptFile) : { pages: [] };
  const review = readJson(reviewPath(runDir));
  let transcription = rawTranscription;
  try { transcription = applyContentOverrides(rawTranscription, review); } catch (error) { errors.push(error.message); }
  if (manifest.exactResultFormat === EXACT_RESULT_FORMAT) {
    try { assertExactV2Result({ format: EXACT_RESULT_FORMAT, pages: transcription.pages, assets: transcription.assets }); }
    catch (error) { errors.push(error.message); }
  }
  const skillIds = new Set(readJson(TAXONOMY_FILES[0]).map((item) => item.id));
  const dotPointIds = new Set(readJson(TAXONOMY_FILES[1]).map((item) => item.id));
  const gotPages = (transcription.pages ?? []).map((page) => page.pageNumber).sort((a, b) => a - b);
  if (gotPages.length !== manifest.selectedPages.length || gotPages.some((page, index) => page !== manifest.selectedPages[index])) errors.push('Selected page coverage is incomplete');
  const duplicates = duplicateIds({ pages: transcription.pages });
  if (duplicates.length) errors.push(`Duplicate ids: ${duplicates.join(', ')}`);
  const presentationFlags = sourcePresentationFlags(transcription, { requireEvidence: Boolean(manifest.pins?.files?.['scripts/booklet/prompts/source-presentation-v2.md']) });
  review.flags = [...(review.flags ?? []).filter((flag) => flag.source !== 'source-presentation'), ...presentationFlags];
  writeJson(reviewPath(runDir), review);
  errors.push(...presentationFlags.map((flag) => `${flag.rootId}: ${flag.note}`));
  errors.push(...transcriptionHazards(transcription));
  const questions = collectQuestions(transcription);
  for (const question of questions) {
    const candidate = normaliseQuestion({ ...question, format: 'mathsmap-practice-question-v3', version: 3, status: 'draft', review: { flags: question.reviewFlags ?? [] } });
    const checked = validateQuestion(candidate, { skillIds });
    if (checked.errors.length) errors.push(`${question.id}: ${checked.errors.join('; ')}`);
  }
  const modulesFile = mergedPath(runDir, 'modules');
  if (fs.existsSync(modulesFile)) for (const module of readJson(modulesFile).modules ?? []) {
    const checked = validateTeachingModule(normalizeTeachingModule({ ...module, classification: module.classification ?? { mappingStatus: 'unmapped' } }), { skillIds, dotPointIds });
    if (!checked.valid) errors.push(`${module.id}: ${checked.errors.join('; ')}`);
  }
  const modules = fs.existsSync(modulesFile) ? readJson(modulesFile).modules ?? [] : [];
  const diagrams = diagramRecords(transcription.pages);
  const diagramIds = new Set(diagrams.map((diagram) => diagram.id));
  for (const diagram of diagrams) {
    if (diagram.role === 'solution-overlay' && (!diagram.overlayOf || !diagramIds.has(diagram.overlayOf))) errors.push(`${diagram.id}: solution overlay has no base diagram`);
  }
  for (const src of collectAssetRefs(transcription.pages)) if (src.startsWith('evidence/') && !fs.existsSync(path.join(laneDir(runDir, 'exact'), src))) errors.push(`Referenced evidence asset is missing: ${src}`);
  const assetRefs = collectAssetRefs(transcription.pages);
  for (const asset of transcription.assets ?? []) {
    if (asset.usage === 'evidence-only' && assetRefs.has(asset.path)) errors.push(`${asset.occurrenceId}: evidence-only asset is rendered`);
    if (asset.usage === 'rendered' && !assetRefs.has(asset.path)) errors.push(`${asset.occurrenceId}: rendered asset has no published representation`);
  }
  const renderedAssetPaths = new Set((transcription.assets ?? []).filter((asset) => asset.usage === 'rendered').map((asset) => String(asset.path).replaceAll('\\', '/')));
  const missingOccurrences = [...assetRefs].filter((asset) => asset.startsWith('evidence/') && !renderedAssetPaths.has(asset));
  if (missingOccurrences.length) errors.push(`Rendered assets have no occurrence records: ${missingOccurrences.join(', ')}`);
  const captureFile = path.join(runDir, 'evidence', 'reconstructed', 'report.json');
  const capture = fs.existsSync(captureFile) ? readJson(captureFile) : null;
  if (capture?.contentHash === contentHash(transcription) && capture?.layoutHash === contentHash(review.layoutOverrides ?? {})) for (const capturedPage of capture.pages ?? []) {
    for (const mode of capturedPage.modes ?? []) {
      // Source fidelity is judged against the reconstructed student page with
      // theory solutions visible. The hidden-theory and back-of-book answer
      // captures remain review evidence, but are not one-page source replicas.
      if (mode.mode !== 'student' || mode.showTheorySolutions !== true) continue;
      const failed = ['horizontalOverflow', 'verticalOverflow', 'footerCollision', 'rawMarkup'].filter((key) => mode[key]);
      if (mode.failedAssets) failed.push('failedAssets');
      if (mode.failedTikz) failed.push('failedTikz');
      if (failed.length) errors.push(`Page ${capturedPage.pageNumber} ${mode.mode}${mode.showTheorySolutions ? '' : ' hidden-theory'} capture failed: ${failed.join(', ')}`);
    }
  }
  const report = { runId: manifest.id, valid: errors.length === 0, publishable: forPublish && errors.length === 0, errors, warnings, pages: gotPages.length, questions: questions.length, modules: modules.length, diagrams: diagrams.length };
  writeJson(path.join(runDir, 'validation.json'), report);
  return report;
}

function findRoot(value, id) {
  let found = null; walk(value, (node) => { if (!found && node?.id === id) found = node; }); return found;
}
function pageContaining(pages, rootId) {
  for (const page of pages ?? []) if (findRoot(page, rootId)) return page;
  return null;
}

export function saveContentOverride(runIdOrDir, { rootId, pointer, value, note = '', editor = 'Booklet Studio reviewer', revert = false, expectedRevision, expectedBaseHash } = {}, { workRoot = WORK_ROOT } = {}) {
  const { runDir, manifest } = loadRun(runIdOrDir, workRoot);
  const transcription = editableTranscription(runDir, manifest);
  const rawRoot = findRoot(transcription.pages, rootId);
  if (!rawRoot) throw new Error(`Content override root not found: ${rootId}`);
  const page = pageContaining(transcription.pages, rootId);
  if (!page) throw new Error(`Content override page not found: ${rootId}`);
  const review = readJson(reviewPath(runDir));
  if ((expectedRevision !== undefined && expectedRevision !== (review.revision ?? 0)) || (expectedBaseHash !== undefined && expectedBaseHash !== contentHash(transcription))) {
    const error = new Error('This draft changed. Refresh and reconcile your edit before saving.'); error.status = 409; throw error;
  }
  const existing = Object.values(review.contentOverrides?.[rootId] ?? {});
  if (!revert && existing.some(record => record.beforeHash !== contentHash(rawRoot))) {
    const error = new Error('An existing edit conflicts with changed source content. Revert or reconcile it first.'); error.status = 409; throw error;
  }
  review.contentOverrides ??= {};
  if (revert) {
    if (review.contentOverrides[rootId]) {
      delete review.contentOverrides[rootId][pointer];
      if (!Object.keys(review.contentOverrides[rootId]).length) delete review.contentOverrides[rootId];
    }
  } else {
    pointerSegments(pointer);
    const probe = clone(rawRoot);
    setPointer(probe, pointer, value);
    review.contentOverrides[rootId] ??= {};
    review.contentOverrides[rootId][pointer] = {
      beforeHash: contentHash(rawRoot), originalValue: clone(getPointer(rawRoot, pointer)), value: clone(value), note: String(note ?? ''),
      editor: String(editor ?? 'Booklet Studio reviewer'), editedAt: new Date().toISOString(),
    };
  }
  review.history ??= [];
  review.history.push({at:new Date().toISOString(),type:'content-override',pageNumber:page.pageNumber,reason:revert?'reverted':'edited'});
  review.revision = (review.revision ?? 0) + 1;
  writeJson(reviewPath(runDir), review);
  writeJson(manifestPath(runDir), manifest);
  return { review, transcription: applyContentOverrides(transcription, review, { strict: false }), pageNumber: page.pageNumber };
}

export function editableTranscription(runDir, manifest = readJson(manifestPath(runDir))) {
  const file = mergedPath(runDir, 'transcription');
  const value = fs.existsSync(file) ? readJson(file) : loadDraftPreview(runDir, manifest).transcription;
  if (!value) throw new Error('No draft content is available');
  return value;
}

export function runStatus(runIdOrDir, { workRoot = WORK_ROOT } = {}) {
  const { manifest } = loadRun(runIdOrDir, workRoot);
  return { runId: manifest.id, status: manifest.status, selectedPages: manifest.selectedPages };
}

function parseArgs(argv) {
  const [command = 'status', ...rest] = argv; const args = { command };
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index]; if (!token.startsWith('--')) continue; const key = token.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    if (['apply', 'run', 'keep'].includes(key)) args[key] = true; else args[key] = rest[++index];
  }
  return args;
}

function usage() {
  console.log('Source evidence: prepare --pdf FILE --docx FILE --pages 1-3 --run-id ID [--concurrency 3] [--teacher-pdf FILE --teacher-docx FILE]\nLegacy result collection: merge --run-id ID\nvalidate --run-id ID\nstatus --run-id ID');
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.command === 'help' || args.command === '--help') return usage();
  let output;
  if (args.command === 'prepare') {
    const continuations = args.continuations ? (readJson(path.resolve(args.continuations)).continuations ?? readJson(path.resolve(args.continuations))) : [];
    output = prepareRun({ pdf: path.resolve(args.pdf), docx: path.resolve(args.docx), teacherPdf:args.teacherPdf ? path.resolve(args.teacherPdf) : null, teacherDocx:args.teacherDocx ? path.resolve(args.teacherDocx) : null, pages: args.pages, runId: args.runId, continuations, concurrency: args.concurrency ?? DEFAULT_CONCURRENCY });
  } else {
    if (!args.runId) throw new Error('--run-id is required');
    if (args.command === 'merge') output = mergeLane(args.runId, { lane: args.lane ?? 'exact' });
    else if (args.command === 'validate') output = validateRun(args.runId);
    else if (args.command === 'status') output = runStatus(args.runId);
    else throw new Error(`Unknown command: ${args.command}`);
  }
  console.log(json(output));
  return output;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(`Booklet transcription failed: ${error.message}`); process.exitCode = 1; });
}
