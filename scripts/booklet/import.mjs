#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  BOOKLET_IMPORT_FORMAT,
  importPayloadToProject,
  normalizeImportPayload,
  reviewImportPayload as reviewDocumentPayload,
} from '../../src/lib/booklet-import.js';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.join(SCRIPT_DIR, 'import-schema.json');
const WORK_ROOT = path.join(process.cwd(), '.booklet-work');

function parseArgs(argv) {
  const out = {
    input: null,
    pdf: null,
    word: null,
    output: path.join(WORK_ROOT, 'import-job.json'),
    outProvided: false,
    run: false,
    publish: false,
    check: null,
    batchSize: 4,
    projectDir: path.join(process.cwd(), 'booklets', 'projects'),
    libraryDir: path.join(process.cwd(), 'booklets', 'library'),
    assetDir: path.join(process.cwd(), 'public', 'booklet-assets'),
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--input') out.input = argv[++index];
    else if (arg === '--pdf') out.pdf = argv[++index];
    else if (arg === '--word' || arg === '--docx') out.word = argv[++index];
    else if (arg === '--out') { out.output = argv[++index]; out.outProvided = true; }
    else if (arg === '--run') out.run = true;
    else if (arg === '--publish') out.publish = true;
    else if (arg === '--check') out.check = argv[++index];
    else if (arg === '--batch-size') out.batchSize = Math.max(1, Number(argv[++index]) || 4);
    else if (arg === '--project-dir') out.projectDir = argv[++index];
    else if (arg === '--library-dir') out.libraryDir = argv[++index];
    else if (arg === '--asset-dir') out.assetDir = argv[++index];
    else if (arg === '--help' || arg === '-h') out.help = true;
    else throw new Error('Unknown argument: ' + arg);
  }
  return out;
}

function usage() {
  console.log('Usage: node scripts/booklet/import.mjs --pdf FILE [--word FILE] [--out FILE] [--run]');
  console.log('       node scripts/booklet/import.mjs --input FILE [--out FILE]');
  console.log('       node scripts/booklet/import.mjs --check FILE');
  console.log('       add --publish after a reviewed JSON has every page explicitly accepted');
}

function commandAvailable(command) {
  const versionFlag = command === 'pdftoppm' || command === 'pdftotext' ? '-v' : '--version';
  const result = spawnSync(command, [versionFlag], { stdio: 'ignore' });
  return !result.error && result.status === 0;
}

function sourceKey(input) {
  return path.basename(input ?? 'imported').replace(path.extname(input ?? ''), '').replace(/[^a-z0-9]+/gi, '-').toLowerCase().replace(/^-|-$/g, '') || 'imported';
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function numericPageSort(left, right) {
  const get = (value) => Number(value.match(/(?:page[-_])?(\d+)/i)?.[1] ?? Number.MAX_SAFE_INTEGER);
  return get(left) - get(right) || left.localeCompare(right);
}

export function renderPdf(input, workDir) {
  if (!commandAvailable('pdftoppm')) throw new Error('pdftoppm is required for PDF imports; provide page images if Poppler is unavailable.');
  fs.mkdirSync(workDir, { recursive: true });
  const result = spawnSync('pdftoppm', ['-png', '-r', '150', input, path.join(workDir, 'page')], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error((result.stderr || 'pdftoppm failed').trim());
  return fs.readdirSync(workDir)
    .filter((name) => /^page[-_]\d+\.png$/i.test(name))
    .sort(numericPageSort)
    .map((name) => path.join(workDir, name));
}

export function extractPdfText(input) {
  if (!commandAvailable('pdftotext')) return [];
  const result = spawnSync('pdftotext', ['-layout', input, '-'], { encoding: 'utf8' });
  if (result.status !== 0) return [];
  const pages = String(result.stdout ?? '').split('\f').map((page) => page.replace(/\s+$/g, ''));
  while (pages.length && !pages.at(-1).trim()) pages.pop();
  return pages;
}

function listFiles(root) {
  if (!fs.existsSync(root)) return [];
  const output = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) output.push(...listFiles(full));
    else output.push(full);
  }
  return output;
}

export function extractWord(input, workDir) {
  if (!commandAvailable('pandoc')) throw new Error('Pandoc is required for Word imports; install Pandoc or provide the extracted Word text.');
  const mediaDir = path.join(workDir, 'word-media');
  fs.mkdirSync(mediaDir, { recursive: true });
  const result = spawnSync('pandoc', [input, '--from=docx', '--to=gfm', '--wrap=none', `--extract-media=${mediaDir}`], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error((result.stderr || 'Pandoc Word extraction failed').trim());
  const assets = listFiles(mediaDir).map((file) => ({
    id: `asset-${sourceKey(path.basename(file))}-${file.length}`,
    sourcePath: file,
    originalName: path.relative(mediaDir, file).replaceAll(path.sep, '/'),
    mimeType: path.extname(file).toLowerCase() === '.svg' ? 'image/svg+xml' : null,
  }));
  return { text: String(result.stdout ?? ''), mediaDir, assets };
}

function splitIntoBatches(pages, batchSize) {
  const batches = [];
  for (let index = 0; index < pages.length; index += batchSize) {
    const slice = pages.slice(index, index + batchSize);
    batches.push({
      id: `batch-${String(batches.length + 1).padStart(3, '0')}`,
      startPage: slice[0]?.pageNumber ?? index + 1,
      endPage: slice.at(-1)?.pageNumber ?? index + slice.length,
      pageNumbers: slice.map((page) => page.pageNumber),
    });
  }
  return batches;
}

export function buildPrompt({ pdfInput = null, wordInput = null, pages = [], wordText = '', assets = [], batch = null } = {}) {
  const selected = batch ? pages.filter((page) => batch.pageNumbers.includes(page.pageNumber)) : pages;
  const lines = [
    'You are transcribing a canonical maths booklet for the local MathsMap Booklet Studio.',
    `Return only JSON matching ${SCHEMA_PATH}.`,
    'Reconstruct the supplied page batch in exact source order. Never summarise, modernise, simplify, or rewrite visible content.',
    'Preserve every heading, paragraph, theory statement, key idea, callout, table/grid, worked example, cloze blank, atomic question, multipart question, part, answer-space height, image/diagram, caption, and manual page boundary that is visible.',
    'Use rich-text content with $...$ for inline maths and $$...$$ only when display maths is visibly required. Keep original wording and notation.',
    'Use stable IDs such as source-page-2-block-3 and source-page-2-q3. Add reviewFlags for uncertain OCR, notation, structure, crop, continuation, answer, diagram, or TikZ conversion.',
    'Keep original image assets in the assets list. If proposing TikZ, include the original asset and the TikZ proposal side by side; do not replace the original automatically.',
    'Each page must be returned, even if it is blank or contains only a continuation. Set accepted to false; a human reviewer must accept every page later.',
    `PDF source: ${pdfInput ?? 'not supplied'}`,
    `Word source: ${wordInput ?? 'not supplied'}`,
    `Page batch: ${batch ? `${batch.startPage}-${batch.endPage}` : 'all pages'}`,
    `Available original assets: ${assets.length ? assets.map((asset) => asset.originalName ?? asset.sourcePath).join(', ') : 'none'}`,
  ];
  for (const page of selected) {
    lines.push(`\n--- SOURCE PAGE ${page.pageNumber} ---`);
    lines.push(`Rendered page: ${page.sourceImage ?? 'not available'}`);
    lines.push(`PDF text extraction:\n${page.pdfText || '(none)'}`);
  }
  if (wordText) lines.push(`\n--- PANDOC WORD EXTRACTION ---\n${wordText}`);
  return lines.join('\n');
}

export function prepareImport({ pdfInput = null, wordInput = null, workDir, batchSize = 4 } = {}) {
  const pdfPages = pdfInput ? renderPdf(pdfInput, path.join(workDir, 'pdf-pages')) : [];
  const pdfTextPages = pdfInput ? extractPdfText(pdfInput) : [];
  const word = wordInput ? extractWord(wordInput, workDir) : { text: '', assets: [] };
  const pageCount = Math.max(pdfPages.length, pdfTextPages.length, wordInput && !pdfInput ? 1 : 0);
  const pages = Array.from({ length: pageCount }, (_, index) => ({
    id: `page-${index + 1}`,
    pageNumber: index + 1,
    sourceImage: pdfPages[index] ?? null,
    pdfText: pdfTextPages[index] ?? '',
    wordText: '',
    blocks: [],
    reviewFlags: ['awaiting-transcription'],
    accepted: false,
  }));
  const batches = splitIntoBatches(pages, batchSize);
  return {
    format: BOOKLET_IMPORT_FORMAT,
    version: 2,
    status: 'ready-for-transcription',
    source: {
      pdf: pdfInput,
      word: wordInput,
      wordText: word.text,
    },
    title: sourceKey(pdfInput ?? wordInput).replace(/-/g, ' '),
    subtitle: '',
    batchSize,
    assets: word.assets,
    pages,
    batches,
    prompt: buildPrompt({ pdfInput, wordInput, pages, wordText: word.text, assets: word.assets }),
  };
}

function runCodex({ prompt, pages, output }) {
  const args = ['exec', '--sandbox', 'read-only', '--output-schema', SCHEMA_PATH, '--output-last-message', output];
  for (const page of pages) if (page.sourceImage) args.push('--image', page.sourceImage);
  args.push(prompt);
  const result = spawnSync('codex', args, { stdio: 'inherit', cwd: process.cwd() });
  if (result.error) throw new Error('Could not start codex: ' + result.error.message);
  if (result.status !== 0) throw new Error('codex exec exited with status ' + result.status);
}

function runCodexBatches(job, workDir, output) {
  const outputs = [];
  for (const batch of job.batches) {
    const pages = job.pages.filter((page) => batch.pageNumbers.includes(page.pageNumber));
    const batchOutput = path.join(workDir, `${batch.id}.json`);
    runCodex({
      prompt: buildPrompt({ pdfInput: job.source.pdf, wordInput: job.source.word, pages: job.pages, wordText: job.source.wordText, assets: job.assets, batch }),
      pages,
      output: batchOutput,
    });
    const result = readJson(batchOutput);
    const resultPages = Array.isArray(result) ? result : result.pages;
    if (!Array.isArray(resultPages)) throw new Error(`${batch.id} did not return a pages array`);
    outputs.push(...resultPages);
  }
  const byPage = new Map(outputs.map((page) => [Number(page.pageNumber), page]));
  const merged = {
    ...job,
    status: 'needs-review',
    pages: job.pages.map((sourcePage) => ({
      ...sourcePage,
      ...(byPage.get(sourcePage.pageNumber) ?? { reviewFlags: ['missing-transcription'] }),
      pageNumber: sourcePage.pageNumber,
      sourceImage: sourcePage.sourceImage,
      pdfText: sourcePage.pdfText,
      accepted: false,
    })),
  };
  const checked = reviewImportPayload(merged, { input: job.source.pdf ?? job.source.word, requireSourceRender: Boolean(job.source.pdf) });
  if (checked.errors.length) throw new Error(checked.errors.join('; '));
  writeJson(output, checked.payload);
  return checked;
}

function reviewLegacyPayload(payload, { input = 'imported' } = {}) {
  const rawItems = Array.isArray(payload) ? payload : payload?.items;
  if (!Array.isArray(rawItems)) return { payload: { items: [] }, errors: ['Import result must contain a pages array'], flags: [], canPublish: false };
  const key = sourceKey(input);
  const ids = new Set();
  const errors = [];
  const flags = [];
  const items = rawItems.map((raw, index) => {
    const prompt = raw?.prompt ?? raw?.question_text ?? raw?.question ?? '';
    const solution = raw?.solution ?? raw?.solution_text ?? '';
    const id = raw?.id ?? `imported:${key}:${index + 1}`;
    if (ids.has(id)) errors.push('Duplicate imported question id: ' + id);
    ids.add(id);
    const reviewFlags = Array.isArray(raw?.reviewFlags) ? [...new Set(raw.reviewFlags)] : [];
    if (!String(prompt).trim()) reviewFlags.push('missing-prompt');
    if (!String(solution).trim()) reviewFlags.push('missing-solution');
    if (String(prompt).includes('[tikz]') && !raw?.hasDiagram) reviewFlags.push('diagram-check');
    const uniqueFlags = [...new Set(reviewFlags)];
    uniqueFlags.forEach((flag) => flags.push({ id, flag }));
    return { ...raw, id, prompt: String(prompt), solution: String(solution), difficulty: raw?.difficulty ?? 'foundation', reviewFlags: uniqueFlags, source: raw?.source ?? { type: 'import', file: input, sourceId: raw?.sourceId ?? id } };
  });
  return { payload: { format: 'mathsmap-booklet-import-v1', source: { file: input }, items }, errors, flags, canPublish: false };
}

export function reviewImportPayload(payload, { input = 'imported', requireSourceRender = true } = {}) {
  if (Array.isArray(payload) || Array.isArray(payload?.items)) return reviewLegacyPayload(payload, { input });
  return reviewDocumentPayload(payload, { input, requireSourceRender });
}

function checkFile(file) {
  const value = readJson(file);
  const checked = reviewImportPayload(value, { input: file, requireSourceRender: Boolean(value?.source?.pdf) });
  const pageCount = checked.payload.pages?.length ?? 0;
  const itemCount = checked.payload.items?.length ?? 0;
  console.log(JSON.stringify({ errors: checked.errors, reviewFlags: checked.flags, pageCount, itemCount, allPagesAccepted: checked.allPagesAccepted ?? false, canPublish: checked.canPublish ?? false }, null, 2));
  if (checked.errors.length) process.exitCode = 1;
}

function copyAcceptedAssets(payload, assetDir, key) {
  const copied = [];
  for (const asset of payload.assets ?? []) {
    const source = asset.sourcePath ?? asset.path;
    if (!source || !fs.existsSync(source)) throw new Error(`Accepted import asset is missing: ${source ?? asset.id}`);
    const targetName = path.basename(asset.targetName ?? asset.originalName ?? source);
    const target = path.join(assetDir, key, targetName);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
    copied.push({ ...asset, path: path.relative(process.cwd(), target).replaceAll(path.sep, '/'), sourcePath: undefined });
  }
  return copied;
}

export function publishAcceptedImport(payload, { projectDir, libraryDir, assetDir, input = null } = {}) {
  projectDir ??= path.join(process.cwd(), 'booklets', 'projects');
  libraryDir ??= path.join(process.cwd(), 'booklets', 'library');
  assetDir ??= path.join(process.cwd(), 'public', 'booklet-assets');
  const checked = reviewImportPayload(payload, { input: input ?? payload?.source?.pdf ?? payload?.source?.word, requireSourceRender: Boolean(payload?.source?.pdf) });
  if (!checked.canPublish) throw new Error('Import cannot be published until every page is accepted and fatal review flags are resolved');
  const key = sourceKey(input ?? payload?.source?.pdf ?? payload?.source?.word ?? payload?.title);
  const copiedAssets = copyAcceptedAssets(checked.payload, assetDir, key);
  const project = importPayloadToProject({ ...checked.payload, assets: copiedAssets });
  const master = { ...project, id: `${project.id}-master`, status: 'accepted', kind: 'booklet-master' };
  const projectPath = path.join(projectDir, `${key}.json`);
  const libraryPath = path.join(libraryDir, `${key}.json`);
  writeJson(projectPath, project);
  writeJson(libraryPath, master);
  return { projectPath, libraryPath, assetDir: path.join(assetDir, key), project, master };
}

function resolveInputs(args) {
  let pdfInput = args.pdf ? path.resolve(args.pdf) : null;
  let wordInput = args.word ? path.resolve(args.word) : null;
  if (args.input) {
    const input = path.resolve(args.input);
    if (/\.pdf$/i.test(input)) pdfInput ??= input;
    else if (/\.docx?$/i.test(input)) wordInput ??= input;
    else if (!pdfInput && !wordInput) wordInput = input;
  }
  return { pdfInput, wordInput };
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) return usage();
  if (args.check) return checkFile(path.resolve(args.check));
  if (args.publish && !args.run) {
    if (!args.outProvided) throw new Error('--publish without --run requires --out FILE containing a reviewed import');
    const reviewed = path.resolve(args.output);
    if (!fs.existsSync(reviewed)) throw new Error('Reviewed import file not found: ' + reviewed);
    const published = publishAcceptedImport(readJson(reviewed), { projectDir: args.projectDir, libraryDir: args.libraryDir, assetDir: args.assetDir });
    console.log(JSON.stringify({ project: published.projectPath, library: published.libraryPath, assets: published.assetDir }, null, 2));
    return;
  }
  const { pdfInput, wordInput } = resolveInputs(args);
  if (!pdfInput && !wordInput) throw new Error('Provide --pdf FILE, --word FILE, or --input FILE');
  for (const input of [pdfInput, wordInput].filter(Boolean)) if (!fs.existsSync(input)) throw new Error('Input file not found: ' + input);
  const workDir = path.join(WORK_ROOT, `import-${Date.now()}`);
  fs.mkdirSync(workDir, { recursive: true });
  const job = prepareImport({ pdfInput, wordInput, workDir, batchSize: args.batchSize });
  if (!args.run) {
    writeJson(args.output, job);
    console.log('Prepared page-batched import job: ' + path.resolve(args.output));
    console.log(`Pages: ${job.pages.length}; batches: ${job.batches.length}; original assets: ${job.assets.length}`);
    return;
  }
  const checked = runCodexBatches(job, workDir, args.output);
  console.log('Wrote reviewed import result: ' + path.resolve(args.output));
  console.log(`Pages: ${checked.payload.pages.length}; review flags: ${checked.flags.length}; publishable: ${checked.canPublish}`);
  if (args.publish) {
    const published = publishAcceptedImport(readJson(args.output), { projectDir: args.projectDir, libraryDir: args.libraryDir, assetDir: args.assetDir, input: pdfInput ?? wordInput });
    console.log(JSON.stringify({ project: published.projectPath, library: published.libraryPath, assets: published.assetDir }, null, 2));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { main(); } catch (error) { console.error('Booklet import failed:', error.message); process.exitCode = 1; }
}
