#!/usr/bin/env node

// Run independent gpt-5.6-luna visual transcription sessions over every job that
// does not yet have a valid authoritative transcription envelope.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const archive = path.join(root, '.diagnostic-questions');
const manifestPath = path.join(archive, 'visual-jobs-current.json');
const outputDir = path.join(archive, 'transcriptions-full-20260802');
const scratchDir = path.join(archive, 'luna-tmp');
const model = 'gpt-5.6-luna';

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const concurrency = Math.max(1, Number(arg('--concurrency', '8')) || 8);
const maxJobs = Math.max(0, Number(arg('--max-jobs', '0')) || 0);
const timeoutMs = Math.max(120000, Number(arg('--timeout-ms', String(15 * 60 * 1000))) || 15 * 60 * 1000);
const requested = arg('--jobs', '');
const requestedIds = requested ? new Set(requested.split(',').map((x) => x.trim()).filter(Boolean)) : null;
const force = process.argv.includes('--force');

const TRANSCRIBE_BRIEF = `You are a visual transcription worker for the MathsMap Diagnostic Questions import.
You receive exactly one job containing up to five attached source screenshots. Read every image carefully.
For each image, solve the question independently and transcribe the complete stem and all visible options.
Never infer an answer from option position, colour, or a source answer key. If the image is cropped,
ambiguous, illegible, or has more than one defensible answer, record that in uncertainties and do not
pretend it is resolved. Use JSON-escaped KaTeX and inline [tikz]...[/tikz] only when a diagram is needed.

Return ONLY one JSON object (no markdown fences, no commentary) with this exact shape:
{"jobId":"...","transcriptions":[{"question_text":"...","structure":"kebab-case routine","meaningfulCase":"concise case","mastery":false,"options":[{"text":"...","correct":true},{"text":"...","correct":false,"why":"specific misconception of at least 15 characters"}],"solution_text":"independent worked solution; do not restate the prompt","diagramRequired":false,"uncertainties":[]}]}.
The transcriptions array must be in the same order as the supplied candidate list and have exactly one item per candidate.
Each item must have 3–5 options and exactly one correct option. Preserve all numbers, units, labels, and diagram relations exactly.`;

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

function validTranscription(value) {
  if (!value || typeof value !== 'object') return false;
  for (const key of ['question_text', 'structure', 'meaningfulCase', 'solution_text']) {
    if (typeof value[key] !== 'string' || !value[key].trim()) return false;
  }
  if (typeof value.mastery !== 'boolean' || typeof value.diagramRequired !== 'boolean' || !Array.isArray(value.options) || !Array.isArray(value.uncertainties)) return false;
  if (value.options.length < 3 || value.options.length > 5) return false;
  if (value.options.filter((o) => o && o.correct === true).length !== 1) return false;
  return value.options.every((o) => {
    if (!o || typeof o.text !== 'string' || !o.text.trim() || typeof o.correct !== 'boolean') return false;
    return o.correct || (typeof o.why === 'string' && o.why.trim().length >= 15);
  });
}

function extractJson(text) {
  const trimmed = String(text ?? '').trim();
  try { return JSON.parse(trimmed); } catch {}
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    const body = trimmed.slice(start, end + 1);
    try { return JSON.parse(body); } catch {}
    // Luna occasionally emits a single TeX backslash that is not a JSON escape.
    // Repair only characters that cannot begin a legal JSON escape.
    const repaired = body.replace(/(?<!\\)\\(?!["\\/bfnrtu])/g, '\\\\');
    return JSON.parse(repaired);
  }
  throw new Error('Luna response did not contain a JSON object');
}

function runCodex(args, { timeout, input }) {
  return new Promise((resolve, reject) => {
    const codexPath = path.join(process.env.APPDATA || '', 'npm', 'codex.cmd');
    const command = [codexPath, ...args].join(' ');
    const child = spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', command], {
      cwd: root,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdin.end(input);
    let timer = setTimeout(() => {
      child.kill();
      reject(new Error(`codex timeout after ${timeout}ms`));
    }, timeout);
    child.stdout.on('data', (b) => { stdout += b; });
    child.stderr.on('data', (b) => { stderr += b; });
    child.on('error', (error) => { clearTimeout(timer); reject(error); });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(`codex exited ${code}: ${(stderr || stdout).trim().slice(-1000)}`));
      else resolve({ stdout, stderr });
    });
  });
}

async function transcribeJob(job) {
  const outputPath = path.join(outputDir, `${job.jobId}.json`);
  const lastMessage = path.join(scratchDir, `${job.jobId}-${process.pid}-${Date.now()}.json`);
  const context = job.candidates.map((candidate, index) => ({
    index: index + 1,
    sourceId: candidate.source.id,
    categoryPath: candidate.source.categoryPath,
  }));
  const prompt = `${TRANSCRIBE_BRIEF}\n\nJob context (match this order):\n${JSON.stringify({ jobId: job.jobId, candidates: context })}`;
  const args = ['exec', '--ephemeral', '--sandbox', 'read-only', '--model', model, '--output-last-message', lastMessage];
  for (const candidate of job.candidates) args.push('--image', candidate.source.pngPath);
  args.push('-');
  let lastError;
  let lastRaw = '';
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const retryPrompt = attempt === 1 ? prompt : `${prompt}\n\nSTRICT RETRY ${attempt}: return compact valid JSON only. Escape every TeX backslash for JSON, include exactly ${job.candidates.length} transcriptions, 3–5 options per item, and exactly one correct option per item. Even genuinely binary source questions must have at least three options: add a plausible third misconception (for example, a distinct wrong value or “neither”) with a specific why.`;
      await runCodex(args, { timeout: timeoutMs, input: retryPrompt });
      const raw = await fs.readFile(lastMessage, 'utf8');
      lastRaw = raw;
      const reply = extractJson(raw);
      if (reply.jobId !== job.jobId || !Array.isArray(reply.transcriptions) || reply.transcriptions.length !== job.candidates.length || !reply.transcriptions.every(validTranscription)) {
        throw new Error(`invalid transcription shape for ${job.jobId}`);
      }
      const output = {
        jobId: job.jobId,
        candidates: job.candidates.map((candidate, index) => ({
          source: candidate.source,
          qualityScore: candidate.qualityScore,
          workerInstructions: candidate.workerInstructions,
          transcription: reply.transcriptions[index],
        })),
      };
      await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
      return { jobId: job.jobId, ok: true, count: job.candidates.length, attempt };
    } catch (error) {
      lastError = error;
      if (attempt === 3 && lastRaw) {
        await fs.mkdir(path.join(archive, 'luna-failures'), { recursive: true });
        await fs.writeFile(path.join(archive, 'luna-failures', `${job.jobId}.raw.txt`), lastRaw, 'utf8');
      }
      await fs.rm(lastMessage, { force: true }).catch(() => {});
    }
  }
  return { jobId: job.jobId, ok: false, error: lastError?.message || 'unknown Luna failure' };
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(scratchDir, { recursive: true });
  const manifest = await readJson(manifestPath);
  const existing = new Set((await fs.readdir(outputDir)).filter((name) => name.endsWith('.json')).map((name) => name.slice(0, -5)));
  let jobs = manifest.jobs.filter((job) => force || !existing.has(job.jobId));
  if (requestedIds) jobs = jobs.filter((job) => requestedIds.has(job.jobId));
  if (maxJobs) jobs = jobs.slice(0, maxJobs);
  console.log(`luna transcription: ${jobs.length} jobs, concurrency ${concurrency}`);
  let cursor = 0;
  let succeeded = 0;
  let failed = 0;
  async function worker() {
    while (true) {
      const job = jobs[cursor++];
      if (!job) return;
      const result = await transcribeJob(job);
      if (result.ok) { succeeded += 1; console.log(`OK ${result.jobId} (${result.count} candidates)`); }
      else { failed += 1; console.error(`FAIL ${result.jobId}: ${result.error}`); }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker));
  console.log(`luna transcription complete: succeeded=${succeeded} failed=${failed}`);
  if (failed) process.exitCode = 1;
}

main().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
