#!/usr/bin/env node

// Run the independent checker and mapper passes for the Diagnostic Questions import.
// Each pass is resumable at job level. Results are merged into worker-results.json only
// after checker + mapper A + mapper B cover every accepted candidate.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { evaluateMappingConsensus, loadSkillIndex, processCandidateBundle, retrieveSkillCandidates } from './core.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const archive = path.join(root, '.diagnostic-questions');
const bundlePath = path.join(archive, 'worker-results.json');
const scratchDir = path.join(archive, 'luna-check-map-tmp');
const model = 'gpt-5.6-luna';

function arg(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const mode = arg('--mode', '');
const concurrency = Math.max(1, Number(arg('--concurrency', '12')) || 12);
const maxJobs = Math.max(0, Number(arg('--max-jobs', '0')) || 0);
const timeoutMs = Math.max(120_000, Number(arg('--timeout-ms', String(15 * 60 * 1000))) || 15 * 60 * 1000);
const force = process.argv.includes('--force');

function usage() {
  return `Usage:
  node scripts/dq/run-luna-check-map.mjs --mode checker [--concurrency 12]
  node scripts/dq/run-luna-check-map.mjs --mode mapper-a [--concurrency 12]
  node scripts/dq/run-luna-check-map.mjs --mode mapper-b [--concurrency 12]
  node scripts/dq/run-luna-check-map.mjs --mode all [--concurrency 12]
  node scripts/dq/run-luna-check-map.mjs --mode review [--concurrency 12]
  node scripts/dq/run-luna-check-map.mjs --mode repair [--concurrency 12]
  node scripts/dq/run-luna-check-map.mjs --mode merge
  node scripts/dq/run-luna-check-map.mjs --mode merge-review

Modes write to .diagnostic-questions/check-results-20260802,
map-a-results-20260802, and map-b-results-20260802. Jobs are skipped when their
result already validates, so interrupted runs can be resumed safely.`;
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

function extractJson(text) {
  const trimmed = String(text ?? '').trim();
  try { return JSON.parse(trimmed); } catch {}
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('Luna response did not contain a JSON object');
  const body = trimmed.slice(start, end + 1);
  try { return JSON.parse(body); } catch {}
  // Repair only backslashes which cannot begin legal JSON escapes.
  return JSON.parse(body.replace(/(?<!\\)\\(?!["\\/bfnrtu])/g, '\\\\'));
}

function runCodex(args, { timeout, input }) {
  return new Promise((resolve, reject) => {
    const codexPath = path.join(process.env.APPDATA || '', 'npm', 'codex.cmd');
    const child = spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', [codexPath, ...args].join(' ')], {
      cwd: root,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`codex timeout after ${timeout}ms`));
    }, timeout);
    child.stdin.end(input);
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => { clearTimeout(timer); reject(error); });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(`codex exited ${code}: ${(stderr || stdout).trim().slice(-1200)}`));
      else resolve({ stdout, stderr });
    });
  });
}

function checkerValid(value, jobId, candidates) {
  return value?.jobId === jobId
    && Array.isArray(value.results)
    && value.results.length === candidates.length
    && value.results.every((item, index) => item?.sourceId === String(candidates[index].source.id)
      && item.checker
      && typeof item.checker.transcriptionMatch === 'boolean'
      && typeof item.checker.answerMatch === 'boolean'
      && Array.isArray(item.checker.issues));
}

function mapperValid(value, jobId, candidates) {
  return value?.jobId === jobId
    && Array.isArray(value.results)
    && value.results.length === candidates.length
    && value.results.every((item, index) => {
      const report = item?.mappingReport;
      return item?.sourceId === String(candidates[index].source.id)
        && report
        && typeof report.skillId === 'string'
        && Number.isFinite(report.score)
        && Number.isFinite(report.runnerUpScore)
        && typeof report.atomic === 'boolean'
        && Array.isArray(report.flags)
        && typeof report.rationale === 'string';
    });
}

function reviewValid(value, jobId, candidates) {
  const statuses = new Set(['approved', 'held', 'rejected']);
  const mappings = new Set(['approved', 'held', 'rejected']);
  const diagrams = new Set(['approved', 'held', 'not_required']);
  return value?.jobId === jobId
    && Array.isArray(value.results)
    && value.results.length === candidates.length
    && value.results.every((item, index) => {
      const review = item?.review;
      return item?.sourceId === String(candidates[index].source.id)
        && review
        && statuses.has(review.status)
        && mappings.has(review.mapping)
        && diagrams.has(review.diagram)
        && (review.mappedSkillId === null || typeof review.mappedSkillId === 'string')
        && typeof review.transcription === 'string'
        && Array.isArray(review.flags)
        && typeof review.rationale === 'string';
    });
}

function productionTranscriptionValid(value) {
  return value
    && typeof value.question_text === 'string' && value.question_text.trim()
    && typeof value.structure === 'string' && value.structure.trim()
    && typeof value.meaningfulCase === 'string' && value.meaningfulCase.trim()
    && typeof value.mastery === 'boolean'
    && typeof value.solution_text === 'string' && value.solution_text.trim()
    && typeof value.diagramRequired === 'boolean'
    && Array.isArray(value.uncertainties)
    && Array.isArray(value.options) && value.options.length >= 3 && value.options.length <= 5
    && value.options.filter((option) => option?.correct === true).length === 1
    && value.options.every((option) => option && typeof option.text === 'string' && option.text.trim()
      && typeof option.correct === 'boolean'
      && (option.correct === true || (typeof option.why === 'string' && option.why.trim().length >= 15)));
}

function repairValid(value, jobId, candidates) {
  const actions = new Set(['fixed', 'hold']);
  return value?.jobId === jobId
    && Array.isArray(value.results)
    && value.results.length === candidates.length
    && value.results.every((item, index) => item?.sourceId === String(candidates[index].source.id)
      && actions.has(item.action)
      && (item.action === 'hold' || productionTranscriptionValid(item.transcription))
      && Array.isArray(item.fixes)
      && typeof item.rationale === 'string');
}

function repairClass(candidate) {
  const transcription = candidate.transcription ?? {};
  const issues = (candidate.checker?.issues ?? []).join(' ');
  const schema = (transcription.options ?? []).some((option) => option?.correct === true && Object.hasOwn(option, 'why'));
  const minorText = candidate.checker?.transcriptionMatch !== true
    && candidate.checker?.answerMatch === true
    && candidate.checker?.diagramMatch !== false
    && /(typo|quotation|capitaliz|omits? (the |a |an |source |some |details|wording)|shorten|paraphras|changes? .+ to .+|standalone|spelling|punctuation|read book)/i.test(issues)
    && !/(diagram|scatter|graph|figure|arc|angle|label|missing|incorrect|wrong|keyed|option|solution|radius|critical region|ambig|inconsisten|duplicate|not uniquely|cannot be verified)/i.test(issues);
  const clearAnswer = candidate.checker?.transcriptionMatch === true
    && candidate.checker?.answerMatch !== true
    && candidate.checker?.diagramMatch !== false
    && !/(ambig|inconsisten|duplicate|valid answer|not uniquely|source|diagram|missing|unreadable|options|option set)/i.test(issues)
    && /(keyed|answer|solution|correct|critical|calculation|mean|standard deviation|probability|value)/i.test(issues);
  if (!schema && !minorText && !clearAnswer) return null;
  return { schema, minorText, clearAnswer };
}

function candidateSummary(candidate) {
  const t = candidate.transcription ?? {};
  return {
    sourceId: String(candidate.source.id),
    categoryPath: candidate.source.categoryPath,
    question_text: t.question_text,
    structure: t.structure,
    meaningfulCase: t.meaningfulCase,
    mastery: t.mastery,
    options: t.options,
    solution_text: t.solution_text,
    uncertainties: t.uncertainties,
  };
}

const CHECKER_BRIEF = `You are an independent checker for the MathsMap Diagnostic Questions import.
For every supplied candidate, compare the transcription against its attached source image and
solve the problem independently. Check the complete stem, every option, mathematical notation,
the keyed correct option, and the worked solution. Do not trust the transcription, option order,
or source metrics. If the source is cropped, illegible, ambiguous, has duplicate valid options,
or the transcription cannot be verified, set the relevant match to false and explain the issue.
Return ONLY JSON, no markdown:
{"jobId":"...","results":[{"sourceId":"...","checker":{"transcriptionMatch":true,"answerMatch":true,"issues":[],"independentSolution":"...","diagramMatch":true}}]}.
Use exactly one result per supplied candidate and preserve source order. transcriptionMatch means
the visible source was faithfully transcribed. answerMatch means the keyed option and solution are
mathematically correct and uniquely defensible. diagramMatch is false when a required diagram is
missing, unreadable, or materially misrepresented. Keep issues specific and concise.`;

const MAPPER_A_BRIEF = `You are mapper A for the MathsMap Diagnostic Questions import. Map each question
to exactly one atomic MathsMap skill using the supplied skill-index candidates. Treat the source
category as a retrieval hint only; use the mathematical task and the skill boundaries. Do not map
to a composite skill, a prerequisite merely used in the working, or a dependent skill that requires
extra knowledge. Choose the best skill even when uncertain, but lower the score and add a specific
flag when the evidence is weak, the task crosses skill boundaries, or the source is ambiguous.
Return ONLY JSON:
{"jobId":"...","results":[{"sourceId":"...","mappingReport":{"skillId":"skill-id","score":95,"runnerUpScore":80,"atomic":true,"flags":[],"rationale":"..."}}]}.
Use exactly one result per supplied candidate, in order. Scores are 0–100; runnerUpScore is the
best credible alternative score. Automatic consensus requires score >=90, a margin >=12, atomic
true, and no flags, so do not inflate scores.`;

const MAPPER_B_BRIEF = `You are mapper B, an independent second mapper for the MathsMap Diagnostic Questions
import. Re-solve and classify each question from first principles. Use the supplied skill-index
records, including prerequisites, dependants, siblings, dot points, and existing structures, to
guard against lexical/category anchoring. Select one atomic skill, not a composite or a skill that
only appears in the working. Record uncertainty as flags and calibrate scores honestly.
Return ONLY JSON:
{"jobId":"...","results":[{"sourceId":"...","mappingReport":{"skillId":"skill-id","score":95,"runnerUpScore":80,"atomic":true,"flags":[],"rationale":"..."}}]}.
Use exactly one result per supplied candidate, in supplied order. Automatic consensus requires both
mappers to agree at >=90 with a >=12 margin, atomic true, and no flags.`;

const REVIEW_BRIEF = `You are the human adjudicator for a MathsMap Diagnostic Questions import review queue.
Every supplied candidate has already passed the automated checker booleans, but was held because of
mapping confidence/disagreement, source uncertainty, or diagram approval. Inspect the attached
source image and the transcription. Use the two mapper reports as evidence, not authority. Use only
the supplied skill-index candidates when selecting a skill; the source category is only a retrieval
hint. Choose a skill only when the question tests that atomic skill directly, not a prerequisite,
dependent, composite, or merely-used method.

Return ONLY JSON, with exactly one result per candidate in source order:
{"jobId":"...","results":[{"sourceId":"...","review":{"status":"approved","mapping":"approved","mappedSkillId":"skill-id","transcription":"approved","diagram":"approved","flags":[],"rationale":"..."}}]}.

Use status approved only when the source, answer, and selected mapping are defensible. Use held for
an unresolved ambiguity, weak or composite mapping, missing exact skill, or a diagram that still
needs production TikZ compilation/visual comparison. Use rejected for a duplicate, inconsistent,
or unusable source. Set mapping approved only with a defensible atomic skill; otherwise mapping held
and mappedSkillId null. Set diagram to not_required for a non-diagram item. A diagram approval here
means the source/transcription comparison is sound; it does not claim that production TikZ has been
compiled. Keep flags specific and rationale concise. Do not invent a skill outside the supplied list.`;

const REPAIR_BRIEF = `You are a conservative repair worker for invalid MathsMap Diagnostic Questions imports.
Each supplied candidate was preselected because it has only a possible local repair: a correct-option
schema mistake, a minor transcription fidelity issue, or an unambiguous answer/solution correction.
Inspect the attached source image, current transcription, and checker report. Return a complete corrected
transcription only when the repair is certain from the source. If the source is contradictory,
ambiguous, materially incomplete, diagrammatically wrong, or needs a new skill mapping, return hold
and do not invent a correction.

Return ONLY JSON with exactly one result per candidate in source order:
{"jobId":"...","results":[{"sourceId":"...","action":"fixed","fixes":["removed why from correct option"],"rationale":"...","transcription":{"question_text":"...","structure":"...","meaningfulCase":"...","mastery":false,"options":[{"text":"...","correct":true},{"text":"...","correct":false,"why":"specific misconception"}],"solution_text":"...","diagramRequired":false,"uncertainties":[]}}]}.

For action fixed, preserve the original structure/mastery/diagramRequired unless the source proves
they were wrong; preserve all visible options and specific distractor reasons; use exactly one correct
option; remove why from the correct option; and make the solution agree with the corrected answer.
For a fully repaired item set uncertainties to []. For action hold, omit transcription or set it null,
give fixes as [], and explain what prevents a safe local repair.`;

function skillContext(candidate, index) {
  return retrieveSkillCandidates(candidate, index, { limit: 12 }).map(({ skill, score, matchedTerms }) => ({
    skillId: skill.id,
    title: skill.title,
    stage: skill.stage,
    difficulty: skill.difficulty,
    blurb: skill.blurb,
    dotPoints: skill.dotPointTexts,
    prereqs: skill.prereqs ?? [],
    dependants: skill.dependantIds ?? [],
    siblings: skill.siblingIds ?? [],
    existingStructures: skill.existingStructures,
    retrievalScore: Number(score.toFixed(3)),
    matchedTerms,
  }));
}

async function runJob({ modeName, job, index }) {
  const outputDir = path.join(archive, `${modeName}-results-20260802`);
  const outputPath = path.join(outputDir, `${job.jobId}.json`);
  await fs.mkdir(outputDir, { recursive: true });
  if (!force) {
    try {
      const existing = await readJson(outputPath);
      if ((modeName === 'checker' && checkerValid(existing, job.jobId, job.candidates))
        || (modeName === 'review' && reviewValid(existing, job.jobId, job.candidates))
        || (modeName === 'repair' && repairValid(existing, job.jobId, job.candidates))
        || (['mapper-a', 'mapper-b'].includes(modeName) && mapperValid(existing, job.jobId, job.candidates))) {
        return { jobId: job.jobId, ok: true, skipped: true, count: job.candidates.length };
      }
    } catch {}
  }

  const lastMessage = path.join(scratchDir, `${modeName}-${job.jobId}-${process.pid}-${Date.now()}.json`);
  const summaries = job.candidates.map(candidateSummary);
  let input;
  if (modeName === 'checker') {
    input = `${CHECKER_BRIEF}\n\nJob context:\n${JSON.stringify({ jobId: job.jobId, candidates: summaries })}`;
  } else if (modeName === 'review') {
    const candidates = job.candidates.map((candidate) => ({
      ...candidateSummary(candidate),
      checker: candidate.checker,
      mapperReports: candidate.mapping?.mappers ?? [],
      consensus: evaluateMappingConsensus(candidate),
      skillIndexCandidates: skillContext(candidate, index),
    }));
    input = `${REVIEW_BRIEF}\n\nJob context:\n${JSON.stringify({ jobId: job.jobId, candidates })}`;
  } else if (modeName === 'repair') {
    const candidates = job.candidates.map((candidate) => ({
      ...candidateSummary(candidate),
      repairClass: repairClass(candidate),
      checker: candidate.checker,
    }));
    input = `${REPAIR_BRIEF}\n\nJob context:\n${JSON.stringify({ jobId: job.jobId, candidates })}`;
  } else {
    const mapperBrief = modeName === 'mapper-a' ? MAPPER_A_BRIEF : MAPPER_B_BRIEF;
    const candidates = job.candidates.map((candidate) => ({
      ...candidateSummary(candidate),
      skillIndexCandidates: skillContext(candidate, index),
    }));
    input = `${mapperBrief}\n\nJob context:\n${JSON.stringify({ jobId: job.jobId, candidates })}`;
  }
  const args = ['exec', '--ephemeral', '--sandbox', 'read-only', '--model', model, '--output-last-message', lastMessage];
  if (modeName === 'checker' || modeName === 'review' || modeName === 'repair') {
    for (const candidate of job.candidates) args.push('--image', candidate.source.pngPath);
  }
  args.push('-');

  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const retry = attempt === 1 ? input : `${input}\n\nSTRICT RETRY ${attempt}: compact valid JSON only; include exactly ${job.candidates.length} results in source order and no markdown.`;
      await runCodex(args, { timeout: timeoutMs, input: retry });
      const reply = extractJson(await fs.readFile(lastMessage, 'utf8'));
      const valid = modeName === 'checker'
        ? checkerValid(reply, job.jobId, job.candidates)
        : modeName === 'review'
          ? reviewValid(reply, job.jobId, job.candidates)
          : modeName === 'repair'
            ? repairValid(reply, job.jobId, job.candidates)
            : mapperValid(reply, job.jobId, job.candidates);
      if (!valid) throw new Error(`invalid ${modeName} result shape for ${job.jobId}`);
      await fs.writeFile(outputPath, `${JSON.stringify(reply, null, 2)}\n`, 'utf8');
      await fs.rm(lastMessage, { force: true }).catch(() => {});
      return { jobId: job.jobId, ok: true, count: job.candidates.length, attempt };
    } catch (error) {
      lastError = error;
      await fs.rm(lastMessage, { force: true }).catch(() => {});
    }
  }
  await fs.mkdir(path.join(archive, 'luna-failures'), { recursive: true });
  await fs.writeFile(path.join(archive, 'luna-failures', `${modeName}-${job.jobId}.txt`), `${lastError?.stack || lastError}\n`, 'utf8');
  return { jobId: job.jobId, ok: false, error: lastError?.message || 'unknown Luna failure' };
}

async function runMode(modeName) {
  const bundle = await readJson(bundlePath);
  const jobs = bundle.jobs ?? [];
  const index = modeName === 'checker' ? null : await loadSkillIndex(root);
  let selected = jobs;
  if (modeName === 'review') {
    const candidates = jobs.flatMap((job) => job.candidates ?? []);
    const report = await processCandidateBundle({ candidates, repoRoot: root, promote: false });
    const reviewIds = new Set(report.decisions.filter((decision) => decision.status === 'needs_human_review').map((decision) => String(decision.sourceId)));
    const held = candidates.filter((candidate) => reviewIds.has(String(candidate.source.id)));
    selected = [];
    for (let offset = 0; offset < held.length; offset += 5) {
      selected.push({ jobId: `dq-review-${String(selected.length + 1).padStart(4, '0')}`, candidates: held.slice(offset, offset + 5) });
    }
    console.log(`review queue: ${held.length} candidates in ${selected.length} jobs`);
  } else if (modeName === 'repair') {
    const candidates = jobs.flatMap((job) => job.candidates ?? []).filter((candidate) => repairClass(candidate));
    selected = [];
    for (let offset = 0; offset < candidates.length; offset += 5) {
      selected.push({ jobId: `dq-repair-${String(selected.length + 1).padStart(4, '0')}`, candidates: candidates.slice(offset, offset + 5) });
    }
    console.log(`repair queue: ${candidates.length} candidates in ${selected.length} jobs`);
  }
  selected = maxJobs ? selected.slice(0, maxJobs) : selected;
  console.log(`luna ${modeName}: ${selected.length} jobs, concurrency ${concurrency}`);
  let cursor = 0;
  let succeeded = 0;
  let failed = 0;
  async function worker() {
    while (true) {
      const job = selected[cursor++];
      if (!job) return;
      const result = await runJob({ modeName, job, index });
      if (result.ok) { succeeded += 1; console.log(`OK ${modeName} ${result.jobId}${result.skipped ? ' (existing)' : ''}`); }
      else { failed += 1; console.error(`FAIL ${modeName} ${result.jobId}: ${result.error}`); }
    }
  }
  await fs.mkdir(scratchDir, { recursive: true });
  await Promise.all(Array.from({ length: Math.min(concurrency, selected.length) }, worker));
  console.log(`luna ${modeName} complete: succeeded=${succeeded} failed=${failed}`);
  if (failed) process.exitCode = 1;
}

async function merge() {
  const bundle = await readJson(bundlePath);
  const dirs = {
    checker: path.join(archive, 'checker-results-20260802'),
    mapperA: path.join(archive, 'mapper-a-results-20260802'),
    mapperB: path.join(archive, 'mapper-b-results-20260802'),
  };
  const resultMaps = {};
  for (const [name, dir] of Object.entries(dirs)) {
    const files = (await fs.readdir(dir)).filter((file) => file.endsWith('.json'));
    resultMaps[name] = new Map();
    for (const file of files) {
      const result = await readJson(path.join(dir, file));
      if (name === 'checker' ? checkerValid(result, result.jobId, result.results.map((x) => ({ source: { id: x.sourceId } }))) : true) {
        for (const item of result.results ?? []) resultMaps[name].set(String(item.sourceId), item);
      }
    }
  }
  const candidates = bundle.jobs.flatMap((job) => job.candidates ?? []);
  const missing = { checker: [], mapperA: [], mapperB: [] };
  for (const candidate of candidates) {
    const id = String(candidate.source.id);
    for (const name of Object.keys(missing)) if (!resultMaps[name].has(id)) missing[name].push(id);
  }
  if (Object.values(missing).some((ids) => ids.length)) {
    throw new Error(`cannot merge incomplete passes: ${JSON.stringify(Object.fromEntries(Object.entries(missing).map(([k, v]) => [k, v.length])))}`);
  }
  const backup = path.join(archive, `worker-results.before-check-map-${new Date().toISOString().replaceAll(':', '').replaceAll('.', '')}.json`);
  await fs.copyFile(bundlePath, backup);
  const merged = structuredClone(bundle);
  for (const job of merged.jobs) {
    for (const candidate of job.candidates ?? []) {
      const id = String(candidate.source.id);
      candidate.checker = resultMaps.checker.get(id).checker;
      candidate.mapping = {
        mappers: [resultMaps.mapperA.get(id).mappingReport, resultMaps.mapperB.get(id).mappingReport],
      };
    }
  }
  await fs.writeFile(bundlePath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  console.log(`merged ${candidates.length} candidates; backup=${path.basename(backup)}`);
}

async function mergeReview() {
  const bundle = await readJson(bundlePath);
  const candidates = bundle.jobs.flatMap((job) => job.candidates ?? []);
  const automated = await processCandidateBundle({ candidates, repoRoot: root, promote: false });
  const expected = new Set(automated.decisions.filter((decision) => decision.status === 'needs_human_review').map((decision) => String(decision.sourceId)));
  const dir = path.join(archive, 'review-results-20260802');
  const reviewBySourceId = new Map();
  for (const file of (await fs.readdir(dir)).filter((name) => name.endsWith('.json'))) {
    const result = await readJson(path.join(dir, file));
    const heldCandidates = result.results?.map((item) => ({ source: { id: item.sourceId } })) ?? [];
    if (!reviewValid(result, result.jobId, heldCandidates)) continue;
    for (const item of result.results) reviewBySourceId.set(String(item.sourceId), item.review);
  }
  const missing = [...expected].filter((sourceId) => !reviewBySourceId.has(sourceId));
  if (missing.length) throw new Error(`cannot merge incomplete review adjudication: ${missing.length} candidates missing`);
  const backup = path.join(archive, `worker-results.before-review-${new Date().toISOString().replaceAll(':', '').replaceAll('.', '')}.json`);
  await fs.copyFile(bundlePath, backup);
  const merged = structuredClone(bundle);
  for (const job of merged.jobs) {
    for (const candidate of job.candidates ?? []) {
      const review = reviewBySourceId.get(String(candidate.source.id));
      if (review) candidate.review = review;
    }
  }
  await fs.writeFile(bundlePath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  console.log(`merged ${reviewBySourceId.size} human-review adjudications; backup=${path.basename(backup)}`);
}

async function mergeRepair() {
  const bundle = await readJson(bundlePath);
  const candidates = bundle.jobs.flatMap((job) => job.candidates ?? []);
  const repairCandidates = candidates.filter((candidate) => repairClass(candidate));
  const expected = new Set(repairCandidates.map((candidate) => String(candidate.source.id)));
  const dir = path.join(archive, 'repair-results-20260802');
  const repairs = new Map();
  for (const file of (await fs.readdir(dir)).filter((name) => name.endsWith('.json'))) {
    const result = await readJson(path.join(dir, file));
    const jobCandidates = result.results?.map((item) => ({ source: { id: item.sourceId } })) ?? [];
    if (!repairValid(result, result.jobId, jobCandidates)) continue;
    for (const item of result.results) repairs.set(String(item.sourceId), item);
  }
  const missing = [...expected].filter((sourceId) => !repairs.has(sourceId));
  if (missing.length) throw new Error(`cannot merge incomplete repair pass: ${missing.length} candidates missing`);
  const backup = path.join(archive, `worker-results.before-repair-${new Date().toISOString().replaceAll(':', '').replaceAll('.', '')}.json`);
  await fs.copyFile(bundlePath, backup);
  const merged = structuredClone(bundle);
  let fixed = 0;
  let held = 0;
  for (const job of merged.jobs) {
    for (const candidate of job.candidates ?? []) {
      const result = repairs.get(String(candidate.source.id));
      if (!result) continue;
      if (result.action !== 'fixed') { held += 1; continue; }
      const automatedChecker = structuredClone(candidate.checker ?? {});
      candidate.transcription = result.transcription;
      candidate.checker = {
        ...candidate.checker,
        transcriptionMatch: true,
        answerMatch: true,
        automated: automatedChecker,
        adjudicated: true,
        adjudicatedBy: 'conservative-repair',
      };
      candidate.repair = { status: 'fixed', fixes: result.fixes, rationale: result.rationale };
      fixed += 1;
    }
  }
  await fs.writeFile(bundlePath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  console.log(`merged ${fixed} repairs; ${held} held for manual rework; backup=${path.basename(backup)}`);
}

async function main() {
  if (!['checker', 'mapper-a', 'mapper-b', 'all', 'review', 'repair', 'merge', 'merge-review', 'merge-repair'].includes(mode)) {
    console.error(usage());
    process.exitCode = 2;
    return;
  }
  if (mode === 'merge') await merge();
  else if (mode === 'merge-review') await mergeReview();
  else if (mode === 'merge-repair') await mergeRepair();
  else if (mode === 'all') await Promise.all(['checker', 'mapper-a', 'mapper-b'].map(runMode));
  else await runMode(mode);
}

main().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
