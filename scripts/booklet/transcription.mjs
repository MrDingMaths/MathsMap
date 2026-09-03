import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { AGY_BIN, parseResultFile, runTasks } from '../agy/lib/agy-run.mjs';
import { normaliseQuestion, validateQuestion, makeBankManifest } from '../../src/lib/practice-question-model.js';
import { normalizeTeachingModule, validateTeachingModule } from '../../src/lib/teaching-module-model.js';
import { normalizeBookletProject, validateBookletProject } from '../../src/lib/booklet-model.js';

export const BOOKLET_AGY_MODEL = 'gemini-3.8-flash-high';
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
const SCHEMA_FILES = [
  path.join(HERE, 'exact-transcription-v2-schema.json'),
  path.join(HERE, 'practice-question-schema.json'),
  path.join(HERE, 'teaching-module-schema.json'),
  path.join(HERE, 'booklet-project-v3-schema.json'),
];
const PROMPT_FILES = {
  exact: path.join(PROMPT_ROOT, 'exact-transcription-v2.md'),
  enrichment: path.join(PROMPT_ROOT, 'question-enrichment.md'),
  mapping: path.join(PROMPT_ROOT, 'module-mapping.md'),
  repair: path.join(PROMPT_ROOT, 'targeted-repair.md'),
  fidelity: path.join(PROMPT_ROOT, 'fidelity-audit.md'),
};
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
  return result.status === 0;
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, ...options });
  if (result.status !== 0) throw new Error(`${command} failed: ${String(result.stderr || result.stdout || '').trim()}`);
  return String(result.stdout ?? '');
}

function assertTooling() {
  const errors = [];
  if (!fs.existsSync(AGY_BIN)) errors.push(`AGY executable not found: ${AGY_BIN}`);
  for (const command of ['pdftoppm', 'pdftotext', 'pandoc']) if (!commandExists(command)) errors.push(`${command} is unavailable`);
  for (const file of [...SCHEMA_FILES, ...Object.values(PROMPT_FILES), ...TAXONOMY_FILES]) if (!fs.existsSync(file)) errors.push(`Required pinned input is missing: ${path.relative(REPO_ROOT, file)}`);
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
  if (manifest.model !== BOOKLET_AGY_MODEL || manifest.pins.model !== hashValue(BOOKLET_AGY_MODEL)) throw new Error(`Pinned model changed; expected ${BOOKLET_AGY_MODEL}`);
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

function writeTask(dir, index, body, ids) {
  fs.mkdirSync(dir, { recursive: true });
  const stem = `task-${String(index + 1).padStart(3, '0')}`;
  fs.writeFileSync(path.join(dir, `${stem}.md`), body, 'utf8');
  writeJson(path.join(dir, `${stem}.ids.json`), { ids });
  return stem;
}

function tinyPng() {
  return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nXkAAAAASUVORK5CYII=', 'base64');
}

export async function preflight({ keep = false } = {}) {
  assertTooling();
  fs.mkdirSync(WORK_ROOT, { recursive: true });
  const root = fs.mkdtempSync(path.join(WORK_ROOT, '.preflight-'));
  try {
    fs.writeFileSync(path.join(root, 'input.txt'), 'BOOKLET-PREFLIGHT-OK\n', 'utf8');
    fs.writeFileSync(path.join(root, 'pixel.png'), tinyPng());
    writeTask(root, 0, `Read input.txt and pixel.png. Write task-001.result.json containing exactly {"id":"preflight","text":"BOOKLET-PREFLIGHT-OK","imageRead":true,"model":"${BOOKLET_AGY_MODEL}"}.\n\n## Output Contract\nWrite valid JSON to task-001.result.json.`, ['preflight']);
    const result = await runTasks(root, { model: BOOKLET_AGY_MODEL, concurrency: 1, timeoutMs: 5 * 60 * 1000, printTimeout: '4m' });
    if (!result.ok) throw new Error('AGY smoke task failed');
    const output = parseResultFile(path.join(root, 'task-001.result.json'));
    if (output.text !== 'BOOKLET-PREFLIGHT-OK' || output.imageRead !== true || output.model !== BOOKLET_AGY_MODEL) throw new Error('AGY smoke task did not prove file/image/result/model access');
    return { ok: true, model: BOOKLET_AGY_MODEL, agy: AGY_BIN, tools: ['pdftoppm', 'pdftotext', 'pandoc'] };
  } finally {
    if (!keep) fs.rmSync(root, { recursive: true, force: true });
  }
}

export function prepareRun({ pdf, docx, pages, runId = null, workRoot = WORK_ROOT, continuations = [] }) {
  assertTooling();
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
  const manifest = {
    format: RUN_MANIFEST_FORMAT, version: 1, id, createdAt: new Date().toISOString(), status: 'prepared',
    model: BOOKLET_AGY_MODEL, concurrency: DEFAULT_CONCURRENCY, selectedPages, continuations,
    exactResultFormat: EXACT_RESULT_FORMAT,
    source: { pdf: path.resolve(pdf), docx: path.resolve(docx), pdfHash: hashFile(pdfCopy), docxHash: hashFile(docxCopy) },
    pins: {
      model: hashValue(BOOKLET_AGY_MODEL),
      files: pinFiles([...SCHEMA_FILES, ...Object.values(PROMPT_FILES), ...TAXONOMY_FILES]),
      runFiles: Object.fromEntries(runFiles.map((relative) => [relative.replaceAll(path.sep, '/'), hashFile(path.join(runDir, relative))])),
    },
    lanes: {},
  };
  writeJson(manifestPath(runDir), manifest);
  writeJson(reviewPath(runDir), {
    format: 'mathsmap-booklet-review-v1', runId: id,
    pages: selectedPages.map((pageNumber) => ({ pageNumber, accepted: false, note: '' })),
    modules: {}, questions: {}, mappings: {}, diagrams: {}, flags: [], history: [],
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

function copyLaneEvidence(runDir, dir) {
  const target = path.join(dir, 'evidence');
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(path.join(runDir, 'evidence'), target, { recursive: true });
}

function exactTask(runDir, dir, pages, index) {
  const prompt = fs.readFileSync(PROMPT_FILES.exact, 'utf8');
  const inputs = pages.map((page) => ({
    id: `page-${page}`, pageNumber: page,
    image: `evidence/pages/page-${String(page).padStart(3, '0')}.png`,
    pdfText: `evidence/pages/page-${String(page).padStart(3, '0')}.txt`,
  }));
  const body = `${prompt}\n\n## Inputs\n${json(inputs)}\nThe extracted Word document is evidence/word/document.md and its assets are under evidence/word/media.\n\n## Output Contract\nWrite task-${String(index + 1).padStart(3, '0')}.result.json as valid JSON with this shape:\n{"format":"${EXACT_RESULT_FORMAT}","pages":[{"id":"page-N","pageNumber":N,"section":{"id":"...","title":"...","role":"front-matter|teaching|mixed-practice|challenge","moduleId":null},"blocks":[{"id":"page-N-root","type":"...","pedagogyRole":"...","moduleId":null,"sourceAtom":null}],"reviewFlags":[]}],"assets":[{"occurrenceId":"page-N-asset-1","path":"evidence/word/media/...","pageNumber":N,"usage":"rendered|evidence-only","relationshipId":null,"placement":null}]}\nReturn every requested page exactly once and no other page. Every block and question needs a unique stable id rooted at its page id. Questions use type \"question\" and canonical v3 content nodes, but omit classification. Do not include marks or source metadata in question nodes.`;
  writeTask(dir, index, body, pages.map((page) => `page-${page}`));
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

export function applyContentOverrides(transcription, review = {}, { strict = true } = {}) {
  const effective = clone(transcription);
  for (const [rootId, fields] of Object.entries(review.contentOverrides ?? {})) {
    const root = findRoot(effective.pages, rootId);
    if (!root) {
      if (strict) throw new Error(`Content override root disappeared: ${rootId}`);
      continue;
    }
    const entries = Object.entries(fields ?? {}).sort(([a], [b]) => a.localeCompare(b));
    const expected = entries[0]?.[1]?.beforeHash;
    if (expected && contentHash(root) !== expected) {
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

function clearTasks(dir) {
  fs.mkdirSync(dir, { recursive: true });
  for (const name of fs.readdirSync(dir)) if (/^task-\d+\.(?:md|ids\.json)$/.test(name)) fs.rmSync(path.join(dir, name), { force: true });
}

function fidelityPageEvidenceHash(runDir, pageNumber) {
  const suffix = String(pageNumber).padStart(3, '0');
  return contentHash({
    source: hashFile(path.join(runDir, 'evidence', 'pages', `page-${suffix}.png`)),
    reconstructed: hashFile(path.join(runDir, 'evidence', 'reconstructed', `page-${suffix}.png`)),
  });
}

function fidelityEvidenceHash(runDir, pageNumbers) {
  return contentHash(pageNumbers.map((pageNumber) => ({ pageNumber, evidenceHash: fidelityPageEvidenceHash(runDir, pageNumber) })));
}

export function buildTasks(runIdOrDir, { lane = 'exact', workRoot = WORK_ROOT } = {}) {
  const { runDir } = loadRun(runIdOrDir, workRoot);
  const manifest = assertPinnedInputs(runDir);
  const dir = laneDir(runDir, lane);
  clearTasks(dir);
  copyLaneEvidence(runDir, dir);
  let count = 0;
  if (lane === 'exact') {
    const shards = shardPages(manifest.selectedPages, { continuations: manifest.continuations });
    shards.forEach((pages, index) => exactTask(runDir, dir, pages, index));
    count = shards.length;
  } else if (lane === 'enrichment') {
    const transcription = readJson(mergedPath(runDir, 'transcription'));
    const questions = collectQuestions(transcription);
    const skills = readJson(TAXONOMY_FILES[0]);
    const prompt = fs.readFileSync(PROMPT_FILES.enrichment, 'utf8');
    shardQuestions(questions).forEach((items, index) => {
      const taskNo = String(index + 1).padStart(3, '0');
      writeTask(dir, index, `${prompt}\n\n## Questions\n${json(items.map(({ pageNumber, ...item }) => ({ id: item.id, contentHash: item.contentHash, title: item.title ?? '', content: item.content })))}\n\n## Skill taxonomy\n${json(skills)}\n\n## Output Contract\nWrite task-${taskNo}.result.json as {"format":"mathsmap-question-enrichment-result-v1","questions":[{"id":"...","contentHash":"...","classification":{"reasoningScore":0,"difficulty":"Foundation|Development|Mastery","primarySkillId":"...","secondarySkillIds":[],"difficultyReason":"..."}}]}. Cover exactly the requested question ids.`, items.map((item) => item.id));
    });
    count = Math.ceil(questions.length / MAX_QUESTIONS_PER_TASK);
  } else if (lane === 'mapping') {
    const modules = readJson(mergedPath(runDir, 'modules')).modules;
    const skills = readJson(TAXONOMY_FILES[0]); const dotpoints = readJson(TAXONOMY_FILES[1]);
    const prompt = fs.readFileSync(PROMPT_FILES.mapping, 'utf8');
    shardQuestions(modules).forEach((items, index) => {
      const taskNo = String(index + 1).padStart(3, '0');
      writeTask(dir, index, `${prompt}\n\n## Modules\n${json(items)}\n\n## Skills\n${json(skills)}\n\n## Dot points\n${json(dotpoints)}\n\n## Output Contract\nWrite task-${taskNo}.result.json as {"format":"mathsmap-module-mapping-result-v1","modules":[{"id":"...","contentHash":"...","classification":{"mappingStatus":"mapped|cross-skill|unmapped","primarySkillId":null,"secondarySkillIds":[],"dotPointIds":[],"mappingNote":"..."}}]}. Cover exactly the requested module ids and do not return module content.`, items.map((item) => item.id));
    });
    count = Math.ceil(modules.length / MAX_QUESTIONS_PER_TASK);
  } else if (lane === 'fidelity') {
    const transcription = applyContentOverrides(readJson(mergedPath(runDir, 'transcription')), readJson(reviewPath(runDir)));
    const prompt = fs.readFileSync(PROMPT_FILES.fidelity, 'utf8');
    const screenshots = path.join(runDir, 'evidence', 'reconstructed');
    for (const page of transcription.pages ?? []) {
      const file = path.join(screenshots, `page-${String(page.pageNumber).padStart(3, '0')}.png`);
      if (!fs.existsSync(file)) throw new Error(`Reconstructed screenshot is missing for page ${page.pageNumber}; capture the fidelity evidence first`);
    }
    const shards = shardPages(manifest.selectedPages, { continuations: manifest.continuations });
    shards.forEach((pages, index) => {
      const taskNo = String(index + 1).padStart(3, '0');
      const items = pages.map((pageNumber) => {
        const page = transcription.pages.find((item) => item.pageNumber === pageNumber);
        return {
          pageNumber,
          rootId: page.id,
          contentHash: contentHash(page),
          evidenceHash: fidelityPageEvidenceHash(runDir, pageNumber),
          source: `evidence/pages/page-${String(pageNumber).padStart(3, '0')}.png`,
          reconstructed: `evidence/reconstructed/page-${String(pageNumber).padStart(3, '0')}.png`,
        };
      });
      writeTask(dir, index, `${prompt}\n\n## Pages\n${json(items)}\n\n## Output Contract\nWrite task-${taskNo}.result.json as {"format":"mathsmap-fidelity-audit-result-v1","pages":[{"pageNumber":1,"rootId":"page-1","contentHash":"...","evidenceHash":"...","status":"pass|fail","flags":[]}]}. Echo each supplied evidenceHash exactly, return exactly the requested page roots, and do not return content.`, items.map((item) => item.rootId));
    });
    count = shards.length;
  } else throw new Error(`Unknown lane: ${lane}`);
  manifest.lanes[lane] = { ...(manifest.lanes[lane] ?? {}), status: 'tasks-built', tasks: count, builtAt: new Date().toISOString(), promptHash: hashFile(PROMPT_FILES[lane]) };
  writeJson(manifestPath(runDir), manifest);
  return { runDir, lane, tasks: count };
}

export async function runLane(runIdOrDir, { lane = 'exact', concurrency = DEFAULT_CONCURRENCY, workRoot = WORK_ROOT } = {}) {
  const { runDir } = loadRun(runIdOrDir, workRoot);
  const manifest = assertPinnedInputs(runDir);
  const dir = laneDir(runDir, lane);
  const result = await runTasks(dir, { model: BOOKLET_AGY_MODEL, concurrency: Number(concurrency) || DEFAULT_CONCURRENCY });
  manifest.lanes[lane] = { ...(manifest.lanes[lane] ?? {}), status: result.ok ? 'completed' : 'failed', completedAt: new Date().toISOString() };
  writeJson(manifestPath(runDir), manifest);
  if (!result.ok) throw new Error(`${lane} lane did not complete`);
  return result;
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
    const transcription = { format: FULL_IMPORT_FORMAT, version: manifest.exactResultFormat === EXACT_RESULT_FORMAT ? 2 : 1, exactResultFormat: manifest.exactResultFormat ?? 'legacy', runId: manifest.id, model: BOOKLET_AGY_MODEL, selectedPages: expected, pages, assets, mergedAt: new Date().toISOString() };
    writeJson(mergedPath(runDir, 'transcription'), transcription);
    const modules = buildModuleCandidates(transcription);
    writeJson(mergedPath(runDir, 'modules'), { format: 'mathsmap-module-candidates-v1', modules });
    manifest.lanes.exact = { ...(manifest.lanes.exact ?? {}), status: 'merged', mergedAt: new Date().toISOString(), contentHash: contentHash(transcription) };
  } else if (lane === 'enrichment') {
    const transcription = readJson(mergedPath(runDir, 'transcription'));
    const originals = new Map(collectQuestions(transcription).map((question) => [question.id, question]));
    const enriched = results.flatMap((result) => result.questions ?? []);
    if (enriched.length !== originals.size || new Set(enriched.map((item) => item.id)).size !== originals.size) throw new Error('Question enrichment coverage is incomplete or duplicated');
    const map = new Map();
    for (const item of enriched) {
      const original = originals.get(item.id);
      if (!original || item.contentHash !== original.contentHash) throw new Error(`Question content hash changed: ${item.id}`);
      map.set(item.id, item.classification);
    }
    walk(transcription.pages, (node) => { if (node?.type === 'question' && map.has(node.id)) node.classification = clone(map.get(node.id)); });
    for (const question of collectQuestions(transcription)) if (question.contentHash !== originals.get(question.id).contentHash) throw new Error(`Enrichment altered question content: ${question.id}`);
    writeJson(mergedPath(runDir, 'transcription'), transcription);
    writeJson(mergedPath(runDir, 'question-enrichment'), { format: 'mathsmap-question-enrichment-v1', questions: enriched });
    manifest.lanes.enrichment = { ...(manifest.lanes.enrichment ?? {}), status: 'merged', mergedAt: new Date().toISOString() };
  } else if (lane === 'mapping') {
    const source = readJson(mergedPath(runDir, 'modules'));
    const originals = new Map(source.modules.map((module) => [module.id, module]));
    const mapped = results.flatMap((result) => result.modules ?? []);
    if (mapped.length !== originals.size || new Set(mapped.map((item) => item.id)).size !== originals.size) throw new Error('Module mapping coverage is incomplete or duplicated');
    for (const item of mapped) {
      const original = originals.get(item.id);
      if (!original || item.contentHash !== original.contentHash) throw new Error(`Module content hash changed: ${item.id}`);
      original.classification = clone(item.classification);
      if (contentHash(original) !== item.contentHash) throw new Error(`Mapping altered module content: ${item.id}`);
    }
    writeJson(mergedPath(runDir, 'modules'), source);
    manifest.lanes.mapping = { ...(manifest.lanes.mapping ?? {}), status: 'merged', mergedAt: new Date().toISOString() };
  } else if (lane === 'fidelity') {
    const transcription = applyContentOverrides(readJson(mergedPath(runDir, 'transcription')), readJson(reviewPath(runDir)));
    const expected = new Map((transcription.pages ?? []).map((page) => [page.pageNumber, page]));
    const audited = results.flatMap((result) => result.pages ?? []).sort((a, b) => a.pageNumber - b.pageNumber);
    if (audited.length !== expected.size || new Set(audited.map((item) => item.pageNumber)).size !== expected.size) throw new Error('Fidelity audit page coverage is incomplete or duplicated');
    for (const item of audited) {
      const page = expected.get(item.pageNumber);
      if (!page || item.rootId !== page.id || item.contentHash !== contentHash(page)) throw new Error(`Fidelity audit content hash changed or is stale: page ${item.pageNumber}`);
      if (item.evidenceHash !== fidelityPageEvidenceHash(runDir, item.pageNumber)) throw new Error(`Fidelity audit screenshot evidence changed or is stale: page ${item.pageNumber}`);
      if (!['pass', 'fail'].includes(item.status) || !Array.isArray(item.flags)) throw new Error(`Invalid fidelity audit result: page ${item.pageNumber}`);
    }
    const evidenceHash = fidelityEvidenceHash(runDir, manifest.selectedPages);
    writeJson(mergedPath(runDir, 'fidelity-audit'), { format: 'mathsmap-fidelity-audit-v1', pages: audited, contentHash: contentHash(transcription), evidenceHash });
    const review = readJson(reviewPath(runDir));
    review.flags = (review.flags ?? []).filter((flag) => flag.source !== 'fidelity-audit');
    for (const item of audited) for (const flag of item.flags) review.flags.push({ ...flag, rootId: flag.rootId ?? item.rootId, severity: flag.severity ?? 'fatal', source: 'fidelity-audit', resolved: false });
    review.history.push({ at: new Date().toISOString(), type: 'fidelity-audit', failedPages: audited.filter((item) => item.status === 'fail').map((item) => item.pageNumber) });
    writeJson(reviewPath(runDir), review);
    manifest.lanes.fidelity = { ...(manifest.lanes.fidelity ?? {}), status: 'merged', mergedAt: new Date().toISOString(), contentHash: contentHash(transcription), evidenceHash };
  } else throw new Error(`Unknown lane: ${lane}`);
  writeJson(manifestPath(runDir), manifest);
  return { lane, results: results.length };
}

function allReviewFlags(transcription, review) {
  const flags = [...(review.flags ?? [])];
  for (const page of transcription.pages ?? []) {
    for (const flag of page.reviewFlags ?? []) flags.push({ rootId: page.id, code: String(flag), severity: 'fatal' });
    walk(page.blocks, (node) => { for (const flag of node?.reviewFlags ?? []) flags.push({ rootId: node.id, code: String(flag), severity: 'fatal' }); });
  }
  return flags;
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
      if (/^\s*Investigation\s+Investigation\b/i.test(field.value)) errors.push(`${where}: duplicated Investigation label`);
    }
  }
  walk(transcription.pages, (node) => {
    if (!node || Array.isArray(node)) return;
    const prompt = typeof node.prompt === 'string' ? node.prompt : '';
    const semanticVisual = /\\boxed\b/.test(prompt) || /^\s*\|.*\|\s*$/m.test(prompt);
    if (semanticVisual && (node.questionDiagrams?.length ?? 0)) errors.push(`${node.id}: native content duplicates a rendered image`);
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
  const fatalFlags = allReviewFlags(transcription, review).filter((flag) => (flag.severity ?? 'fatal') === 'fatal' && flag.resolved !== true);
  if (fatalFlags.length) errors.push(`${fatalFlags.length} fatal review flag(s) remain`);
  if (forPublish && review.pages.some((page) => page.accepted !== true)) errors.push('Every selected source page must be accepted');
  if (forPublish && questions.some((question) => review.questions?.[question.id]?.accepted !== true)) errors.push('Every selected question must be explicitly accepted');
  const modules = fs.existsSync(modulesFile) ? readJson(modulesFile).modules ?? [] : [];
  if (forPublish && modules.some((module) => review.modules?.[module.id]?.accepted !== true)) errors.push('Every selected module must be explicitly accepted');
  if (forPublish && modules.some((module) => review.mappings?.[module.id]?.accepted !== true)) errors.push('Every selected module mapping must be explicitly accepted');
  const diagrams = diagramRecords(transcription.pages);
  const diagramIds = new Set(diagrams.map((diagram) => diagram.id));
  for (const diagram of diagrams) {
    if (diagram.role === 'solution-overlay' && (!diagram.overlayOf || !diagramIds.has(diagram.overlayOf))) errors.push(`${diagram.id}: solution overlay has no base diagram`);
    if (diagram.derived === true && diagram.reviewStatus === 'approved' && review.diagrams?.[diagram.id]?.accepted !== true) errors.push(`${diagram.id}: derived diagram cannot self-approve`);
  }
  const proposedDiagrams = diagrams.filter((diagram) => diagram.derived === true || (diagram.format === 'tikz' && diagram.reviewStatus !== 'approved'));
  if (forPublish && proposedDiagrams.some((diagram) => review.diagrams?.[diagram.id]?.accepted !== true)) errors.push('Every model-proposed TikZ diagram must be visually approved');
  else if (proposedDiagrams.some((diagram) => review.diagrams?.[diagram.id]?.accepted !== true)) warnings.push(`${proposedDiagrams.filter((diagram) => review.diagrams?.[diagram.id]?.accepted !== true).length} proposed TikZ diagram(s) await visual approval`);
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
  const fidelityFile = mergedPath(runDir, 'fidelity-audit');
  const fidelity = fs.existsSync(fidelityFile) ? readJson(fidelityFile) : null;
  const currentEvidenceHash = manifest.exactResultFormat === EXACT_RESULT_FORMAT ? fidelityEvidenceHash(runDir, manifest.selectedPages) : null;
  const fidelityCurrent = fidelity?.contentHash === contentHash(transcription) && fidelity?.evidenceHash === currentEvidenceHash && manifest.lanes.fidelity?.evidenceHash === currentEvidenceHash && manifest.lanes.fidelity?.status === 'merged';
  if (forPublish && manifest.exactResultFormat === EXACT_RESULT_FORMAT && !fidelityCurrent) errors.push('A current fidelity audit is required for publication');
  else if (manifest.exactResultFormat === EXACT_RESULT_FORMAT && !fidelityCurrent) warnings.push('Fidelity audit is missing or stale');
  if (!manifest.lanes.enrichment || manifest.lanes.enrichment.status !== 'merged') warnings.push('Question enrichment has not been merged');
  if (!manifest.lanes.mapping || manifest.lanes.mapping.status !== 'merged') warnings.push('Module mapping has not been merged');
  const report = { runId: manifest.id, valid: errors.length === 0, publishable: forPublish && errors.length === 0, errors, warnings, fidelityCurrent, pages: gotPages.length, questions: questions.length, modules: modules.length, diagrams: diagrams.length, proposedDiagrams: proposedDiagrams.length };
  writeJson(path.join(runDir, 'validation.json'), report);
  return report;
}

function normalizedText(value) { return String(value ?? '').toLowerCase().replace(/\\[a-z]+/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim(); }
function words(value) { return new Set(normalizedText(value).split(/\s+/).filter(Boolean)); }
function similarity(a, b) { const left = words(a); const right = words(b); if (!left.size && !right.size) return 1; const intersection = [...left].filter((word) => right.has(word)).length; return intersection / new Set([...left, ...right]).size; }
function questionText(question) { const values = []; walk(question.content, (node) => { if (node?.prompt) values.push(node.prompt); }); return values.join(' '); }

export function duplicateSuggestions(questions, bankDir = path.join(REPO_ROOT, 'booklets', 'question-bank')) {
  const existing = fs.existsSync(bankDir) ? fs.readdirSync(bankDir).filter((name) => name.endsWith('.json') && name !== 'manifest.json').flatMap((name) => { try { return [readJson(path.join(bankDir, name))]; } catch { return []; } }) : [];
  return questions.flatMap((question) => existing.map((candidate) => ({ sourceId: question.id, candidateId: candidate.id, score: similarity(questionText(question), questionText(candidate)) })).filter((item) => item.score >= 0.72).sort((a, b) => b.score - a.score));
}

function backupFile(file, backupRoot) {
  if (!fs.existsSync(file)) return null;
  const relative = path.relative(REPO_ROOT, file);
  const target = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(file, target);
  return { target: relative.replaceAll(path.sep, '/'), backup: path.relative(REPO_ROOT, target).replaceAll(path.sep, '/'), hash: hashFile(target) };
}

function approvedRecords(runDir) {
  const review = readJson(reviewPath(runDir));
  const transcription = applyContentOverrides(readJson(mergedPath(runDir, 'transcription')), review);
  const questions = collectQuestions(transcription).map(({ sourceAtom: _sourceAtom, ...item }) => normaliseQuestion({
    ...item, format: 'mathsmap-practice-question-v3', version: 3, status: 'approved',
    review: { flags: [], approvedBy: review.reviewer ?? 'Booklet Studio reviewer', approvedAt: new Date().toISOString(), history: [{ status: 'approved', at: new Date().toISOString() }] },
  }));
  const rawModules = readJson(mergedPath(runDir, 'modules')).modules ?? [];
  const modules = rawModules.map((item) => normalizeTeachingModule({ ...item, status: 'approved', review: { flags: [], approvedBy: review.reviewer ?? 'Booklet Studio reviewer', approvedAt: new Date().toISOString(), history: [] } }));
  for (const value of [questions, modules]) walk(value, (node) => {
    if (node?.format === 'tikz' && node.id) {
      node.derived = true;
      node.reviewStatus = review.diagrams?.[node.id]?.accepted === true ? 'approved' : 'needs-review';
    }
  });
  const sectionMap = new Map();
  const moduleByPage = new Map();
  for (const module of rawModules) for (const pageNumber of module.pageNumbers ?? []) moduleByPage.set(pageNumber, module);
  for (const page of transcription.pages) {
    const section = page.section ?? { id: `section-${page.pageNumber}`, title: `Page ${page.pageNumber}`, role: 'teaching' };
    if (!sectionMap.has(section.id)) sectionMap.set(section.id, { id: section.id, title: section.title, role: section.role ?? 'teaching', blocks: [] });
    const target = sectionMap.get(section.id);
    const inferredModule = moduleByPage.get(page.pageNumber);
    if (inferredModule) {
      if (page.pageNumber === inferredModule.pageNumbers[0]) target.blocks.push({ type: 'module-ref', id: `placement-${inferredModule.id}`, moduleId: inferredModule.id, layout: {} });
      continue;
    }
    const moduleIds = [...new Set((page.blocks ?? []).map((block) => block.moduleId || section.moduleId).filter(Boolean))];
    for (const moduleId of moduleIds) if (!target.blocks.some((block) => block.moduleId === moduleId)) target.blocks.push({ type: 'module-ref', id: `placement-${moduleId}`, moduleId, layout: {} });
    const questionIds = (page.blocks ?? []).filter((block) => block.type === 'question' && !block.moduleId).map((block) => block.id);
    if (questionIds.length) target.blocks.push({ type: 'question-set', id: `question-set-page-${page.pageNumber}`, questionIds, sort: section.role === 'teaching' ? 'source' : 'reasoning', layout: {} });
    for (const block of page.blocks ?? []) if (block.type !== 'question' && !block.moduleId) target.blocks.push({ type: 'local-block', id: `placement-${block.id}`, block, layout: {} });
  }
  const project = normalizeBookletProject({
    id: `project-${safeId(transcription.runId)}`, title: transcription.title ?? transcription.runId,
    sections: [...sectionMap.values()], settings: { includeSolutions: true, showTheorySolutions: true },
    source: { type: 'full-booklet-import', runId: transcription.runId }, status: 'draft',
  });
  return { transcription, questions, modules, project };
}

function materializeAssets(records, runDir, runId, { apply = false, backupRoot = null, backups = [] } = {}) {
  const plan = new Map();
  for (const value of [records.questions, records.modules, records.project]) walk(value, (node) => {
    if (!node || Array.isArray(node) || typeof node.src !== 'string' || !node.src.startsWith('evidence/')) return;
    const source = path.join(laneDir(runDir, 'exact'), node.src);
    if (!fs.existsSync(source)) throw new Error(`Referenced publication asset is missing: ${node.src}`);
    const hash = hashFile(source);
    const targetName = `${hash.slice(0, 12)}-${safeId(path.basename(source))}`;
    const target = path.join(REPO_ROOT, 'public', 'booklet-assets', safeId(runId), targetName);
    plan.set(node.src, { source, target, hash, publicPath: `/booklet-assets/${safeId(runId)}/${targetName}` });
    node.src = `/booklet-assets/${safeId(runId)}/${targetName}`;
  });
  if (apply) for (const asset of plan.values()) {
    const backup = backupFile(asset.target, backupRoot); if (backup) backups.push(backup);
    fs.mkdirSync(path.dirname(asset.target), { recursive: true }); fs.copyFileSync(asset.source, asset.target);
  }
  return [...plan.values()].map((asset) => ({ source: path.relative(runDir, asset.source).replaceAll(path.sep, '/'), target: path.relative(REPO_ROOT, asset.target).replaceAll(path.sep, '/'), hash: asset.hash }));
}

export function publishRun(runIdOrDir, { apply = false, workRoot = WORK_ROOT } = {}) {
  const { runDir, manifest } = loadRun(runIdOrDir, workRoot);
  const validation = validateRun(runDir, { forPublish: true, workRoot });
  const records = fs.existsSync(mergedPath(runDir, 'transcription')) && fs.existsSync(mergedPath(runDir, 'modules')) ? approvedRecords(runDir) : { questions: [], modules: [], project: null };
  const assetPlan = records.project && !apply ? materializeAssets(records, runDir, manifest.id) : [];
  const suggestions = duplicateSuggestions(records.questions);
  const dry = { format: 'mathsmap-booklet-publication-receipt-v1', dryRun: !apply, runId: manifest.id, at: new Date().toISOString(), model: BOOKLET_AGY_MODEL, validation, duplicateSuggestions: suggestions, inputs: manifest.pins, prompts: Object.fromEntries(Object.entries(PROMPT_FILES).map(([key, file]) => [key, hashFile(file)])), planned: { questions: records.questions.map((item) => item.id), modules: records.modules.map((item) => item.id), project: records.project?.id ?? null }, assetHashes: assetPlan };
  if (!apply) { writeJson(path.join(runDir, 'publication-dry-run.json'), dry); return dry; }
  if (!validation.valid) throw new Error(`Publication blocked: ${validation.errors.join('; ')}`);
  const questionDir = path.join(REPO_ROOT, 'booklets', 'question-bank');
  const moduleDir = path.join(REPO_ROOT, 'booklets', 'module-bank');
  const projectDir = path.join(REPO_ROOT, 'booklets', 'projects');
  const backupRoot = path.join(runDir, 'backups', new Date().toISOString().replace(/[:.]/g, '-'));
  const backups = [];
  dry.assetHashes = materializeAssets(records, runDir, manifest.id, { apply: true, backupRoot, backups });
  for (const question of records.questions) {
    const checked = validateQuestion(question, { allowDraft: false });
    if (!checked.valid) throw new Error(`Question ${question.id} is invalid: ${checked.errors.join('; ')}`);
    const file = path.join(questionDir, `${safeId(question.id)}.json`); const backup = backupFile(file, backupRoot); if (backup) backups.push(backup); writeJson(file, question);
  }
  for (const module of records.modules) {
    const checked = validateTeachingModule(module); if (!checked.valid) throw new Error(`Module ${module.id} is invalid: ${checked.errors.join('; ')}`);
    const file = path.join(moduleDir, `${safeId(module.id)}.json`); const backup = backupFile(file, backupRoot); if (backup) backups.push(backup); writeJson(file, module);
  }
  const projectErrors = validateBookletProject(records.project); if (projectErrors.length) throw new Error(`Project is invalid: ${projectErrors.join('; ')}`);
  const projectFile = path.join(projectDir, `${safeId(records.project.id)}.json`); const projectBackup = backupFile(projectFile, backupRoot); if (projectBackup) backups.push(projectBackup); writeJson(projectFile, records.project);
  const approvedQuestions = fs.readdirSync(questionDir).filter((name) => name.endsWith('.json') && name !== 'manifest.json').flatMap((name) => { try { const q = readJson(path.join(questionDir, name)); return q.status === 'approved' ? [q] : []; } catch { return []; } }).sort((a, b) => a.id.localeCompare(b.id));
  const manifestFile = path.join(questionDir, 'manifest.json'); const manifestBackup = backupFile(manifestFile, backupRoot); if (manifestBackup) backups.push(manifestBackup); writeJson(manifestFile, makeBankManifest(approvedQuestions));
  const receipt = { ...dry, dryRun: false, backups, createdOrUpdated: { questions: records.questions.map((item) => ({ id: item.id, hash: hashValue(item) })), modules: records.modules.map((item) => ({ id: item.id, hash: hashValue(item) })), project: { id: records.project.id, path: path.relative(REPO_ROOT, projectFile).replaceAll(path.sep, '/'), hash: hashValue(records.project) } } };
  writeJson(path.join(runDir, 'publication-receipt.json'), receipt);
  manifest.status = 'published'; manifest.publishedAt = receipt.at; writeJson(manifestPath(runDir), manifest);
  return receipt;
}

function findRoot(value, id) {
  let found = null; walk(value, (node) => { if (!found && node?.id === id) found = node; }); return found;
}
function replaceRoot(value, id, replacement) {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) { const index = value.findIndex((node) => node?.id === id); if (index >= 0) { value[index] = clone(replacement); return true; } return value.some((node) => replaceRoot(node, id, replacement)); }
  for (const [key, child] of Object.entries(value)) { if (child?.id === id) { value[key] = clone(replacement); return true; } if (replaceRoot(child, id, replacement)) return true; }
  return false;
}

function pageContaining(pages, rootId) {
  for (const page of pages ?? []) if (findRoot(page, rootId)) return page;
  return null;
}

function invalidateReviewForPage(runDir, manifest, review, pageNumber, reason) {
  const pageReview = (review.pages ?? []).find((item) => item.pageNumber === pageNumber);
  if (pageReview) pageReview.accepted = false;
  const transcription = readJson(mergedPath(runDir, 'transcription'));
  const page = (transcription.pages ?? []).find((item) => item.pageNumber === pageNumber);
  for (const question of collectQuestions({ pages: page ? [page] : [] })) delete review.questions?.[question.id];
  const modulesFile = mergedPath(runDir, 'modules');
  if (fs.existsSync(modulesFile)) for (const module of readJson(modulesFile).modules ?? []) {
    if ((module.pageNumbers ?? []).includes(pageNumber)) {
      delete review.modules?.[module.id];
      delete review.mappings?.[module.id];
    }
  }
  for (const lane of ['enrichment', 'mapping', 'fidelity']) if (manifest.lanes?.[lane]) manifest.lanes[lane].status = 'stale';
  review.history ??= [];
  review.history.push({ at: new Date().toISOString(), type: 'content-override', pageNumber, reason });
}

export function saveContentOverride(runIdOrDir, { rootId, pointer, value, note = '', editor = 'Booklet Studio reviewer', revert = false } = {}, { workRoot = WORK_ROOT } = {}) {
  const { runDir, manifest } = loadRun(runIdOrDir, workRoot);
  assertPinnedInputs(runDir);
  const transcription = readJson(mergedPath(runDir, 'transcription'));
  const rawRoot = findRoot(transcription.pages, rootId);
  if (!rawRoot) throw new Error(`Content override root not found: ${rootId}`);
  const page = pageContaining(transcription.pages, rootId);
  if (!page) throw new Error(`Content override page not found: ${rootId}`);
  const review = readJson(reviewPath(runDir));
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
  invalidateReviewForPage(runDir, manifest, review, page.pageNumber, revert ? 'reverted' : 'edited');
  writeJson(reviewPath(runDir), review);
  writeJson(manifestPath(runDir), manifest);
  return { review, transcription: applyContentOverrides(transcription, review), pageNumber: page.pageNumber };
}

export function buildRepairTasks(runIdOrDir, { workRoot = WORK_ROOT } = {}) {
  const { runDir } = loadRun(runIdOrDir, workRoot); assertPinnedInputs(runDir);
  const transcription = readJson(mergedPath(runDir, 'transcription')); const review = readJson(reviewPath(runDir));
  const flags = allReviewFlags(transcription, review).filter((flag) => flag.resolved !== true && flag.rootId);
  const roots = [...new Set(flags.map((flag) => flag.rootId))].map((id) => { const node = findRoot(transcription.pages, id); if (!node) throw new Error(`Flagged root not found: ${id}`); return { id, beforeHash: contentHash(node), node, flags: flags.filter((flag) => flag.rootId === id) }; });
  const dir = laneDir(runDir, 'repair'); clearTasks(dir); copyLaneEvidence(runDir, dir); const prompt = fs.readFileSync(PROMPT_FILES.repair, 'utf8');
  shardQuestions(roots).forEach((items, index) => writeTask(dir, index, `${prompt}\n\n## Requested roots\n${json(items)}\n\n## Output Contract\nWrite task-${String(index + 1).padStart(3, '0')}.result.json as {"format":"mathsmap-targeted-repair-result-v1","repairs":[{"id":"requested-root-id","beforeHash":"...","replacement":{}}]}. Return exactly these requested root ids: ${items.map((item) => item.id).join(', ')}.`, items.map((item) => item.id)));
  return { roots: roots.length, tasks: Math.ceil(roots.length / MAX_QUESTIONS_PER_TASK) };
}

export function mergeRepairs(runIdOrDir, { workRoot = WORK_ROOT } = {}) {
  const { runDir, manifest } = loadRun(runIdOrDir, workRoot); assertPinnedInputs(runDir);
  const transcription = readJson(mergedPath(runDir, 'transcription')); const review = readJson(reviewPath(runDir));
  const addressed = new Set(allReviewFlags(transcription, review).filter((flag) => flag.resolved !== true && flag.rootId).map((flag) => flag.rootId));
  const before = new Map(); walk(transcription.pages, (node) => { if (node?.id) before.set(node.id, contentHash(node)); });
  const allowedToChange = new Set(addressed);
  const markRepairTree = (value, ancestors = [], inside = false) => {
    if (!value || typeof value !== 'object') return;
    const nowInside = inside || (value.id && addressed.has(value.id));
    if (value.id && nowInside) allowedToChange.add(value.id);
    if (value.id && addressed.has(value.id)) for (const id of ancestors) allowedToChange.add(id);
    const nextAncestors = value.id ? [...ancestors, value.id] : ancestors;
    if (Array.isArray(value)) for (const item of value) markRepairTree(item, ancestors, inside);
    else for (const child of Object.values(value)) markRepairTree(child, nextAncestors, nowInside);
  };
  markRepairTree(transcription.pages);
  const repairs = taskResults(laneDir(runDir, 'repair')).flatMap((result) => result.repairs ?? []);
  if (repairs.length !== addressed.size || new Set(repairs.map((item) => item.id)).size !== addressed.size || repairs.some((item) => !addressed.has(item.id))) throw new Error('Repair results do not cover exactly the requested root ids');
  for (const repair of repairs) {
    const node = findRoot(transcription.pages, repair.id);
    if (!node || repair.beforeHash !== contentHash(node)) throw new Error(`Repair beforeHash mismatch: ${repair.id}`);
    if (!replaceRoot(transcription.pages, repair.id, repair.replacement)) throw new Error(`Repair target disappeared: ${repair.id}`);
  }
  walk(transcription.pages, (node) => { if (node?.id && before.has(node.id) && !allowedToChange.has(node.id) && contentHash(node) !== before.get(node.id)) throw new Error(`Repair modified unaddressed node: ${node.id}`); });
  writeJson(mergedPath(runDir, 'transcription'), transcription);
  writeJson(mergedPath(runDir, 'modules'), { format: 'mathsmap-module-candidates-v1', modules: buildModuleCandidates(transcription) });
  manifest.lanes.repair = { ...(manifest.lanes.repair ?? {}), status: 'merged', mergedAt: new Date().toISOString() }; writeJson(manifestPath(runDir), manifest);
  return { repaired: repairs.map((item) => item.id) };
}

export function runStatus(runIdOrDir, { workRoot = WORK_ROOT } = {}) {
  const { runDir, manifest } = loadRun(runIdOrDir, workRoot); const review = readJson(reviewPath(runDir));
  const laneStatus = Object.fromEntries(['exact', 'enrichment', 'mapping', 'fidelity', 'repair'].map((lane) => {
    const dir = laneDir(runDir, lane); const tasks = fs.existsSync(dir) ? fs.readdirSync(dir).filter((name) => /^task-\d+\.md$/.test(name)).length : 0; const results = fs.existsSync(dir) ? fs.readdirSync(dir).filter((name) => /^task-\d+\.result\.json$/.test(name)).length : 0;
    return [lane, { ...(manifest.lanes[lane] ?? { status: 'not-started' }), tasks, results }];
  }));
  return { runId: manifest.id, status: manifest.status, model: manifest.model, selectedPages: manifest.selectedPages, acceptedPages: review.pages.filter((page) => page.accepted).length, lanes: laneStatus };
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
  console.log(`Booklet transcription (all model lanes pinned to ${BOOKLET_AGY_MODEL})\n\n` +
    'preflight\nprepare --pdf FILE --docx FILE --pages 1-3,29-38 --run-id ID [--continuations FILE]\n' +
    'build-tasks --run-id ID --lane exact|enrichment|mapping|fidelity\nrun --run-id ID --lane NAME [--concurrency 3]\n' +
    'merge --run-id ID --lane NAME\nvalidate --run-id ID\nstatus --run-id ID\npublish --run-id ID [--apply]\nrepair --run-id ID [--run]\n');
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.command === 'help' || args.command === '--help') return usage();
  let output;
  if (args.command === 'preflight') output = await preflight({ keep: args.keep });
  else if (args.command === 'prepare') {
    const continuations = args.continuations ? (readJson(path.resolve(args.continuations)).continuations ?? readJson(path.resolve(args.continuations))) : [];
    output = prepareRun({ pdf: path.resolve(args.pdf), docx: path.resolve(args.docx), pages: args.pages, runId: args.runId, continuations });
  } else {
    if (!args.runId) throw new Error('--run-id is required');
    if (args.command === 'build-tasks') output = buildTasks(args.runId, { lane: args.lane ?? 'exact' });
    else if (args.command === 'run') output = await runLane(args.runId, { lane: args.lane ?? 'exact', concurrency: args.concurrency ?? DEFAULT_CONCURRENCY });
    else if (args.command === 'merge') output = mergeLane(args.runId, { lane: args.lane ?? 'exact' });
    else if (args.command === 'validate') output = validateRun(args.runId);
    else if (args.command === 'status') output = runStatus(args.runId);
    else if (args.command === 'publish') output = publishRun(args.runId, { apply: args.apply === true });
    else if (args.command === 'repair') {
      output = buildRepairTasks(args.runId);
      if (args.run) { await runLane(args.runId, { lane: 'repair', concurrency: args.concurrency ?? DEFAULT_CONCURRENCY }); output = mergeRepairs(args.runId); }
    } else throw new Error(`Unknown command: ${args.command}`);
  }
  console.log(json(output));
  return output;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(`Booklet transcription failed: ${error.message}`); process.exitCode = 1; });
}
