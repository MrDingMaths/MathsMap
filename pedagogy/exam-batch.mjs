// Batch Exam completion (James, 7 November 2026): one reusable driver in place of per-booklet scripts.
//   node pedagogy/exam-batch.mjs run    --projects a,b|--all-s4 [--mode s4|topup] [--until select|rate|build] [--parallel N]
//   node pedagogy/exam-batch.mjs save   --projects a,b --approved-by "QUOTE"
//   node pedagogy/exam-batch.mjs report
// Steps per booklet (each cached, so a rerun pays for nothing twice):
//   screen  script   MathsBase rows for the booklet's subtopics -> screen file in the closure format
//   select  Sonnet   classify every eligible row, keep up to PER_ARCHETYPE per archetype, adapt to native JSON
//   rate    Terra    independent fidelity/answer check and 0-100 difficulty rating, one call per booklet
//   build   script   Exam section (role exam, workingSpace none), ordered by rating, plus closure record and check
// Render (check-feedback-pages.mjs) and save (exam-publish.mjs) are separate commands. See docs/booklet-exam-completion.md.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {approvedMathsBaseSource} from '../src/lib/question-source.js';
import {difficultyBandForScore} from '../src/lib/practice-question-model.js';
import {callSonnet, studentView, promptFromSource} from './audit-v2.mjs';
import {requireProgrammeExamSection} from './programme-exam.mjs';
import {buildClosureSkeleton, checkClosure, defaultBindings, setDisposition} from './exam-closure.mjs';
import {markTokens} from './exam-marks.mjs';
import {REASONING_PROMPT, REASONING_RUBRIC, reasoningTaskHash} from '../scripts/booklet/reasoning-ratings.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const RUN = '.booklet-work/exam-batch-20261107';
export const PER_ARCHETYPE = 2;
const RATER = {model: 'gpt-6.1-terra', effort: 'high'}, RATE_CHUNK = 12;
const read = f => JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, ''));
const write = (f, v) => { fs.mkdirSync(path.dirname(f), {recursive: true}); fs.writeFileSync(f, typeof v === 'string' ? v : JSON.stringify(v, null, 1) + '\n'); };
const sha = v => createHash('sha256').update(v).digest('hex');
const posix = f => path.relative(ROOT, f).split(path.sep).join('/');
const now = () => new Date().toISOString();
const projectFile = id => path.join(ROOT, 'booklets/projects', id + '.json');
const dirOf = id => path.join(ROOT, RUN, id);
const hasImage = text => /\[img:|!\[[^\]]*\]\(|<img\b|\\includegraphics|\[tikz\]|\\begin\{tikzpicture\}/.test(String(text ?? ''));

// ---- screen ---------------------------------------------------------------------------------------
export function screenStatus(row) {
  const source = approvedMathsBaseSource(row.source);
  if (!source) return 'excluded-provider';
  if (!['Development', 'Mastery', 'Challenge'].includes(row.difficulty)) return 'excluded-difficulty';
  if (source.needsSchoolMapping || !source.label) return 'source-label-hold';
  return 'allowed-label-ready';
}
// The pool: every MathsBase row classified under the booklet's subtopics (s4), or the existing
// v2 screen's rows (topup). Ineligible rows stay in the screen so closure accounts for them.
function poolRows(id, mode) {
  if (mode === 's4') {
    const subtopics = read(path.join(ROOT, RUN, 's4-subtopics.json')).masters[id];
    if (!subtopics) throw Error(`${id} has no Stage 4 subtopic mapping`);
    const {rows} = read(path.join(ROOT, RUN, 's4-rows.json'));
    return rows.filter(r => (r.classifications ?? []).some(k => subtopics.includes(k.subtopic_id)));
  }
  // A part 2 split on 6 November 2026 has no screen of its own: it shares its parent's pool.
  const dir = path.join(ROOT, '.booklet-work/end-goal-20261028/phase4/external-read-campaign/source-rescreen-20261029-v2/masters');
  const parent = read(projectFile(id)).source?.partition?.parentProjectId;
  const byId = topupRowIndex(), screen = read(path.join(dir, (fs.existsSync(path.join(dir, id + '.json')) || !parent ? id : parent) + '.json'));
  return (screen.questionReferences ?? []).map(ref => byId.get(ref.id)).filter(Boolean);
}
let topupIndex;
function topupRowIndex() {
  if (topupIndex) return topupIndex;
  topupIndex = new Map();
  const dir = path.join(ROOT, '.booklet-work/end-goal-20261028/phase4/external-read-campaign/subtopics');
  for (const f of fs.readdirSync(dir)) for (const r of read(path.join(dir, f)).rows ?? []) if (!topupIndex.has(r.id)) topupIndex.set(r.id, {...r, readSnapshot: posix(path.join(dir, f))});
  return topupIndex;
}
export function buildScreen(project, rows) {
  const seen = new Set(), refs = [];
  for (const r of rows) { if (seen.has(r.id)) continue; seen.add(r.id); refs.push({key: r.source, id: r.id, status: screenStatus(r)}); }
  const counts = {};
  for (const ref of refs) counts[ref.status] = (counts[ref.status] ?? 0) + 1;
  return {kind: 'exam-batch-screen-v1', projectId: project.id, revision: project.revision, courseId: project.library?.courseId ?? null, builtAt: now(), counts, questionReferences: refs};
}

// ---- booklet view for the selection call ----------------------------------------------------------
function bookletView(project) {
  const topics = new Map((project.topics ?? []).map(t => [t.id, t.title]));
  const teaching = [], practice = [], types = new Set();
  for (const section of project.sections ?? []) for (const block of section.blocks ?? []) {
    if (block.classification?.archetype) types.add(block.classification.archetype);
    if (section.phase === 'teaching' && (block.type === 'worked-example' || ['example', 'guided-practice'].includes(block.pedagogyRole))) {
      teaching.push({topic: topics.get(section.topicId) ?? section.title, id: block.id, view: JSON.stringify(studentView(block)).slice(0, 1500)});
    } else if (section.phase === 'practice' && block.type === 'question') {
      practice.push({id: block.id, type: block.classification?.archetype ?? null, task: JSON.stringify(studentView(block, {answers: false})).slice(0, 400)});
    }
  }
  return {title: project.title, topics: [...new Set(topics.values())], taughtTypes: [...types], workedExamples: teaching, practice, answerSamples: answerSamples(project)};
}
// The booklet's own answers show its notation (recurring decimals, units, rounding); adaptations must match
// (pilot, 7 November 2026: dot notation drafted for a booklet that writes an overline).
function answerSamples(project, size = 14) {
  const all = (project.sections ?? []).filter(s => s.phase === 'practice' && s.role !== 'exam').flatMap(s => s.blocks ?? []).filter(b => b.type === 'question');
  const pick = all.length <= size ? all : Array.from({length: size}, (_, k) => all[Math.round(k * (all.length - 1) / (size - 1))]);
  return [...new Set(pick)].map(b => JSON.stringify(studentView(b)).slice(0, 700));
}

// ---- select (Sonnet) --------------------------------------------------------------------------------
const SELECT_SYSTEM = `You choose and adapt Exam questions for a MathsMap booklet (NSW mathematics, Australian English).
Input: the booklet (topics, worked examples, existing practice tasks and their types) and a pool of exam questions from real papers.
For EVERY pool row return one decision:
- "selected": an exam question this booklet's taught methods fully cover, chosen as an Exam question.
- "represented": in scope, but its archetype already has enough selected questions.
- "duplicate": the same task as an existing booklet question (give duplicateOf = that booklet block id).
- "out-of-scope": needs a method, concept or topic this booklet does not teach (give basis, one specific sentence).
- "faulty": the source itself is defective (give fault = a short exact quote of the defect).
Every in-scope row gets an "archetype": a short kebab-case name for the kind of task (what the student must do).
Reuse a "knownArchetype" given with a row exactly, and reuse one name for the same kind of task across rows.
Select AT MOST ${PER_ARCHETYPE} rows per archetype; with two, prefer different contexts or difficulty. Select every archetype the booklet teaches that the pool covers.
Prefer whole, self-contained questions. Never select a row whose task depends on a missing figure, table or earlier part.
For each selected row also return "content": the question adapted as native JSON, faithful to the source:
{"prompt": "...", "answer": {"short": "...", "worked": "..."}} for a single task, or
{"prompt": "shared stem", "children": [{"label": "a", "prompt": "...", "answer": {"short": "...", "worked": "..."}}, ...]} for parts.
Rules: keep the source's wording, numbers, units, instructions and every given; do not add hints, scaffolds or new parts. Remove only
exam mark allocations such as [2] or (3 marks). Maths in $...$ (display $$...$$; aligned working as $$\\begin{align*}...\\end{align*}$$, always inside $$).
A table in the source: one row per line, cells separated by a tab character (headings in the first row).
Multiple choice: keep the source's instruction (for example "Circle the correct answer.") and put the options in the prompt as lines "(A) ...". Short answers are concise final answers; worked solutions are brief, use the booklet's
taught method, and end with the answer. Use exactly the notation and conventions of the booklet's worked examples and answerSamples
(for example recurring-decimal notation, units, rounding, how working is set out). Australian English spelling.
Reply with ONLY a JSON object: {"rows": [{"id": "...", "decision": "...", "archetype": "...", "basis"?: "...", "duplicateOf"?: "...", "fault"?: "...", "content"?: {...}}]}`;

function validateSelection(pool) {
  const ids = new Set(pool.map(r => r.id));
  return value => {
    if (!Array.isArray(value?.rows)) throw Error('rows missing');
    const seen = new Set(), perType = {};
    for (const row of value.rows) {
      if (!ids.has(row.id) || seen.has(row.id)) throw Error('unknown or repeated row ' + row.id);
      seen.add(row.id);
      if (!['selected', 'represented', 'duplicate', 'out-of-scope', 'faulty'].includes(row.decision)) throw Error('bad decision for ' + row.id);
      if (['selected', 'represented'].includes(row.decision) && !String(row.archetype ?? '').trim()) throw Error('archetype missing for ' + row.id);
      if (row.decision === 'selected') {
        perType[row.archetype] = (perType[row.archetype] ?? 0) + 1;
        const c = row.content;
        if (!c || typeof c.prompt !== 'string' || (!c.answer && !(c.children ?? []).length)) throw Error('content missing for ' + row.id);
      }
    }
    for (const [type, n] of Object.entries(perType)) if (n > PER_ARCHETYPE) throw Error(`${n} selected for ${type}`);
    const missing = [...ids].filter(id => !seen.has(id));
    if (missing.length) throw Error(`${missing.length} pool rows have no decision`);
    return value;
  };
}

// ---- rate (Terra) -----------------------------------------------------------------------------------
function ratePrompt(project, items, anchors) {
  return `Do not run any commands or open files: everything you need is in this message.
You are the independent checker and difficulty rater for new Exam questions in the MathsMap booklet "${project.title}".
Each item is a real exam question (source text and source solution) and its adaptation for the booklet (native prompt and answers).
For each item decide "accept" (true/false). Accept only when ALL hold: (1) the adaptation keeps the source's mathematics, wording,
numbers and givens, removing nothing but exam mark allocations; (2) solve it yourself: the short answer and the worked solution are
correct and complete; (3) it is self-contained (no missing figure, table or earlier part); (4) the answers use the booklet's own
notation and conventions, shown in these samples of its answers: ${JSON.stringify(answerSamples(project, 8))}
If false, give "issues" (short and specific).
Then rate every item: ${REASONING_PROMPT}
The booklet's existing rated questions, as anchors for the scale: ${JSON.stringify(anchors)}
Items: ${JSON.stringify(items)}
Reply with ONLY JSON: {"items": [{"id": "...", "accept": true, "issues": [], "reasoningScore": 0, "difficultyReason": "..."}]}`;
}
function anchorsFor(project) {
  const rated = (project.sections ?? []).filter(s => s.phase === 'practice').flatMap(s => s.blocks ?? []).filter(b => b.type === 'question' && Number.isInteger(b.classification?.reasoningScore));
  rated.sort((a, b) => a.classification.reasoningScore - b.classification.reasoningScore);
  const pick = [];
  for (let k = 0; k < 8 && rated.length; k++) { const b = rated[Math.round(k * (rated.length - 1) / 7)]; if (!pick.includes(b)) pick.push(b); }
  return pick.map(b => ({score: b.classification.reasoningScore, task: JSON.stringify(studentView(b, {answers: false})).slice(0, 500)}));
}

// ---- native blocks ----------------------------------------------------------------------------------
// Answers are strings, so tab-separated rows (a table) would print as loose text (7 November 2026: a
// multiplication grid in a worked solution). Two or more consecutive tab rows become a bordered array;
// a lone tab becomes a space.
const arrayCell = cell => {
  const c = cell.trim();
  if (!c) return '';
  if (/^[-−+]?[\d.,]+%?$|^[-–—×]$/.test(c)) return c.replace('%', '\\%').replace('×', '\\times').replace(/^[–—]$/, '-');
  return c.split(/(\$[^$]*\$)/).map(part => part.startsWith('$') ? part.slice(1, -1) : part ? `\\text{${part.replace(/([%&#_{}])/g, '\\$1')}}` : '').join('');
};
export function tabRowsToArray(text) {
  if (typeof text !== 'string' || !text.includes('\t')) return text;
  const lines = text.split('\n'), out = [];
  for (let i = 0; i < lines.length;) {
    if (!lines[i].includes('\t')) { out.push(lines[i++]); continue; }
    const rows = [];
    while (i < lines.length && lines[i].includes('\t')) rows.push(lines[i++].split('\t'));
    if (rows.length < 2) { out.push(rows[0].join(' ')); continue; }
    const cols = Math.max(...rows.map(r => r.length));
    out.push(`$$\\begin{array}{|${'c|'.repeat(cols)}}\\hline ${rows.map(r => Array.from({length: cols}, (_, k) => arrayCell(r[k] ?? '')).join(' & ')).join(' \\\\ \\hline ')} \\\\ \\hline\\end{array}$$`);
  }
  return out.join('\n');
}
const answerOf = a => ({short: tabRowsToArray(String(a?.short ?? '')), worked: tabRowsToArray(String(a?.worked ?? ''))});
export function nativeContent(id, content) {
  // Editor source markup (tab-separated table rows, **bold**, _italic_, [[blank|mm]]) becomes an editor document.
  const root = {id: id + '-root', type: 'question', label: null, prompt: promptFromSource(String(content.prompt ?? ''), id + '-root'), answerSpaceMm: 0};
  if ((content.children ?? []).length) {
    root.children = content.children.map((c, i) => ({id: `${id}-${String(c.label ?? String.fromCharCode(97 + i)).replace(/[^\w]/g, '')}`, type: 'part', label: String(c.label ?? String.fromCharCode(97 + i)), prompt: promptFromSource(String(c.prompt ?? ''), `${id}-${i}`), answerSpaceMm: 0, answer: answerOf(c.answer)}));
  } else root.answer = answerOf(content.answer);
  return root;
}
function nativeBlock(row, selection, rating, {evidence, archetype}) {
  const id = 'exam-mb-' + row.id;
  const block = {id, type: 'question', pedagogyRole: 'practice', snapshotKind: 'local', bankRef: null, title: '',
    content: nativeContent(id, selection.content),
    sourceReview: {origin: {provider: 'MathsBase', externalId: row.id, sourceCode: row.source, sourceQuestionSha256: sha(row.question_text ?? ''), sourceSolutionSha256: sha(row.solution_text ?? ''), readSnapshot: row.readSnapshot ?? RUN + '/s4-rows.json'},
      wholeSource: true, markTokensRemoved: markTokens(row.question_text ?? '').filter(t => t.standalone && !t.inMath).map(t => t.token),
      generation: {model: 'claude-sonnet-5-5', effort: 'medium', kind: 'exam-source-adaptation', run: RUN}, status: 'independent-content-accepted'},
    classification: {primarySkillId: null, secondarySkillIds: [], archetype}};
  block.classification = {...block.classification, reasoningScore: rating.reasoningScore, difficulty: difficultyBandForScore(rating.reasoningScore), difficultyReason: String(rating.difficultyReason).trim(),
    assessment: {model: RATER.model, effort: RATER.effort, assessedAt: rating.assessedAt, rubricVersion: REASONING_RUBRIC, taskHash: reasoningTaskHash(block), evidence}};
  return block;
}

// Insert before an end Challenge section if there is one, else append. Same for the topic list.
export function withExamSection(project, section) {
  const next = structuredClone(project);
  next.sections = next.sections.filter(s => s.id !== section.id);
  const challenge = next.sections.findIndex(s => s.role === 'challenge' || s.topicId === 'challenge');
  if (challenge >= 0 && next.sections.slice(challenge).every(s => s.role === 'challenge' || s.topicId === next.sections[challenge].topicId)) next.sections.splice(challenge, 0, section);
  else next.sections.push(section);
  next.topics = (next.topics ?? []).filter(t => t.id !== section.topicId);
  const topic = {id: section.topicId, title: 'Exam questions'}, ct = next.topics.findIndex(t => t.id === next.sections.find(s => s.role === 'challenge')?.topicId);
  if (ct >= 0) next.topics.splice(ct, 0, topic); else next.topics.push(topic);
  return next;
}

// ---- one booklet -------------------------------------------------------------------------------------
export async function runBooklet(id, {mode = 's4', until = 'build', used = new Set(), log = console.error} = {}) {
  const dir = dirOf(id), file = projectFile(id), bytes = fs.readFileSync(file), project = JSON.parse(bytes.toString('utf8').replace(/^﻿/, ''));
  const liveSha = sha(bytes), state = {id, revision: project.revision};
  if (mode === 's4' && (project.sections ?? []).some(s => s.role === 'exam')) throw Error(`${id} already has an Exam section; use --mode topup`);
  // screen
  const rows = poolRows(id, mode), screen = buildScreen(project, rows), screenFile = path.join(dir, 'screen', 'masters', id + '.json');
  if (!fs.existsSync(screenFile) || read(screenFile).revision !== project.revision) write(screenFile, screen);
  const screenNow = read(screenFile), rowById = new Map(rows.map(r => [r.id, r]));
  const known = read(path.join(ROOT, RUN, 'archetype-index.json')).index, text = JSON.stringify(project);
  const eligible = screenNow.questionReferences.filter(ref => ref.status === 'allowed-label-ready').map(ref => rowById.get(ref.id))
    .filter(r => !hasImage(r.question_text) && !hasImage(r.solution_text) && !used.has(r.id) && !text.includes(r.id));
  state.pool = {total: screenNow.questionReferences.length, eligible: eligible.length};
  if (!eligible.length) { write(path.join(dir, 'state.json'), {...state, status: 'no-eligible-rows'}); return {...state, status: 'no-eligible-rows'}; }
  // select
  const ctx = {workDir: path.join(dir, 'select'), runDir: dir, calls: [], log: m => log(`[${id}] ${m}`)};
  // Short row keys: long ids get garbled in replies (pilot, 7 November 2026) and cost tokens.
  const keyOf = new Map(eligible.map((r, i) => [r.id, 'r' + (i + 1)])), idOf = new Map([...keyOf].map(([id, key]) => [key, id]));
  const pool = eligible.map(r => ({id: keyOf.get(r.id), sourceCode: r.source, question: r.question_text, solution: r.solution_text, knownArchetype: known[r.id] ? Object.keys(known[r.id].archetypes).sort((a, b) => known[r.id].archetypes[b] - known[r.id].archetypes[a])[0] : undefined}));
  const view = bookletView(project);
  const knownType = externalId => known[externalId] ? Object.keys(known[externalId].archetypes)[0] : null;
  const existing = mode === 'topup' ? examOwners(project).map(b => ({id: b.id, archetype: b.classification?.archetype ?? knownType(b.sourceReview?.origin?.externalId), task: JSON.stringify(studentView(b, {answers: false})).slice(0, 400)})) : [];
  const selectPrompt = JSON.stringify({booklet: view, ...(existing.length ? {existingExamQuestions: existing, note: `These Exam questions are already in the booklet. They count toward the ${PER_ARCHETYPE} per archetype: select at most ${PER_ARCHETYPE} minus the existing count for each archetype; a pool row that is the same task as one of them is a duplicate.`} : {}), pool});
  const {value: reply, file: selectFile} = await callSonnet(ctx, {stage: 'exam-select', system: SELECT_SYSTEM, prompt: selectPrompt, validate: validateSelection(pool), timeoutMs: 1500000});
  const selection = {rows: reply.rows.map(r => ({...r, key: r.id, id: idOf.get(r.id)}))};
  const selected = selection.rows.filter(r => r.decision === 'selected');
  state.select = {file: selectFile, selected: selected.length, decisions: Object.fromEntries(['selected', 'represented', 'duplicate', 'out-of-scope', 'faulty'].map(k => [k, selection.rows.filter(r => r.decision === k).length]))};
  if (until === 'select' || !selected.length) { write(path.join(dir, 'state.json'), state); return {...state, status: selected.length ? 'selected' : 'nothing-selected'}; }
  // rate
  const rateFile = path.join(dir, 'rate', 'result.json');
  const items = selected.map(s => { const r = rowById.get(s.id); return {id: s.id, sourceCode: r.source, sourceQuestion: r.question_text, sourceSolution: r.solution_text, adaptation: s.content}; });
  const rateKey = sha(JSON.stringify(items) + RATER.model + RATER.effort);
  let rated = fs.existsSync(rateFile) ? read(rateFile) : null;
  if (rated?.key !== rateKey) {
    process.env.BOOKLET_CODEX_BIN ??= codexBinary();
    const {runAstraTask} = await import('../scripts/booklet/codex-transcription.mjs');
    // Chunks of RATE_CHUNK: one 26-item reply came back incomplete (7 November 2026). Each chunk is kept,
    // so a failed chunk is the only one called again; the worker pool runs up to three at once.
    const anchors = anchorsFor(project), chunks = [];
    for (let i = 0; i < items.length; i += RATE_CHUNK) chunks.push(items.slice(i, i + RATE_CHUNK));
    const replies = await Promise.all(chunks.map(async chunk => {
      const key = sha(JSON.stringify(chunk) + RATER.model + RATER.effort), file = path.join(dir, 'rate', 'chunk-' + key.slice(0, 16) + '.json');
      if (fs.existsSync(file)) return read(file);
      const ids = new Set(chunk.map(i => i.id));
      for (let attempt = 1; ; attempt++) {
        const reply = await runAstraTask({cwd: dir, runDir: dir, prompt: ratePrompt(project, chunk, anchors), out: path.join(dir, 'rate', `call-${key.slice(0, 8)}-${attempt}-${Date.now()}`), profile: 'review', stage: 'exam-batch-rate'});
        const result = reply.result;
        const ok = Array.isArray(result?.items) && result.items.length === ids.size && result.items.every(i => ids.has(i.id) && Number.isInteger(i.reasoningScore) && i.reasoningScore >= 0 && i.reasoningScore <= 100 && String(i.difficultyReason ?? '').trim());
        if (ok) { const kept = {key, assessedAt: now(), metrics: reply.metrics, items: result.items}; write(file, kept); return kept; }
        if (attempt === 2) throw Error(`[${id}] Terra reply incomplete twice`);
      }
    }));
    rated = {key: rateKey, model: RATER.model, effort: RATER.effort, assessedAt: replies.map(r => r.assessedAt).sort().at(-1), metrics: replies.map(r => r.metrics), items: replies.flatMap(r => r.items)};
    write(rateFile, rated);
  }
  state.rate = {file: posix(rateFile), accepted: rated.items.filter(i => i.accept).length, rejected: rated.items.filter(i => !i.accept).map(i => ({id: i.id, issues: i.issues}))};
  if (until === 'rate') { write(path.join(dir, 'state.json'), state); return {...state, status: 'rated'}; }
  // build
  const accepted = new Map(rated.items.filter(i => i.accept).map(i => [i.id, i]));
  const blocks = selected.filter(s => accepted.has(s.id)).map(s => nativeBlock(rowById.get(s.id), s, {...accepted.get(s.id), assessedAt: rated.assessedAt}, {evidence: posix(rateFile), archetype: s.archetype}));
  if (!blocks.length) { Object.assign(state, {status: 'none-accepted'}); write(path.join(dir, 'state.json'), state); return state; }
  const prior = mode === 'topup' ? examOwners(project) : [];
  const existingSection = (project.sections ?? []).find(s => s.role === 'exam');
  // Only the first Exam section's own questions are re-ordered with the new ones; a booklet with a second
  // Exam section keeps it as it is (7 November 2026: five booklets have two, and merging duplicated owners).
  const own = existingSection ? existingSection.blocks.filter(b => b.type === 'question') : [];
  const ordered = [...own, ...blocks].sort((a, b) => (a.classification?.reasoningScore ?? 0) - (b.classification?.reasoningScore ?? 0));
  const sectionId = existingSection?.id ?? id + '-exam-questions';
  const section = existingSection ? {...structuredClone(existingSection), blocks: [...existingSection.blocks.filter(b => b.type !== 'question'), ...ordered]}
    : requireProgrammeExamSection({id: sectionId, topicId: sectionId, title: 'Exam questions', phase: 'practice', role: 'exam', pageBreakBefore: true, workingSpace: 'none', blocks: ordered});
  if (existingSection) for (const b of section.blocks) if (b.type === 'question' && !b.source) b.source = approvedMathsBaseSource(b.sourceReview.origin.sourceCode);
  const candidate = existingSection ? {...structuredClone(project), sections: project.sections.map(s => s.id === sectionId ? section : s)} : withExamSection(project, section);
  const candidateFile = path.join(dir, `candidate.r${project.revision}.json`);
  write(candidateFile, candidate);
  // closure
  const record = closureRecord({project, liveSha, screenFile, screenNow, rows: rowById, selection, accepted, blocks, prior, eligible, used, text});
  const recordFile = path.join(dir, `closure.r${project.revision}.json`);
  write(recordFile, record);
  const bindings = await defaultBindings();
  const check = checkClosure({record, project, projectSha256: liveSha, candidate, screenRows: screenNow.questionReferences.map(r => ({id: r.id, status: r.status})), screenSha256: sha(fs.readFileSync(screenFile)), ...bindings});
  Object.assign(state, {status: check.closed ? 'built' : 'closure-blocked', candidateFile: posix(candidateFile), candidateSha256: sha(fs.readFileSync(candidateFile)), closureRecord: posix(recordFile), closure: {closed: check.closed, blocking: check.blocking.slice(0, 20), coverage: check.coverage}, newOwners: blocks.map(b => b.id), deferredImages: screenNow.questionReferences.filter(ref => ref.status === 'allowed-label-ready' && hasImage(rowById.get(ref.id).question_text + rowById.get(ref.id).solution_text)).length});
  write(path.join(dir, 'state.json'), state);
  return state;
}
// codex is not on PATH on this machine; the app installs it under %LOCALAPPDATA%\OpenAI\Codex\bin\<hash>.
function codexBinary() {
  const base = path.join(process.env.LOCALAPPDATA ?? '', 'OpenAI', 'Codex', 'bin');
  const found = fs.existsSync(base) ? fs.readdirSync(base).map(d => path.join(base, d, 'codex.exe')).filter(f => fs.existsSync(f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs) : [];
  return found[0] ?? 'codex';
}
const examOwners = project => (project.sections ?? []).filter(s => s.role === 'exam').flatMap(s => s.blocks ?? []).filter(b => b.type === 'question');

function closureRecord({project, liveSha, screenFile, screenNow, rows, selection, accepted, blocks, prior, used, text}) {
  const record = buildClosureSkeleton({projectId: project.id, project, projectSha256: liveSha, screenRows: screenNow.questionReferences.map(r => ({id: r.id, status: r.status, sourceCode: r.key})), screen: {file: posix(screenFile), sha256: sha(fs.readFileSync(screenFile))}});
  const decision = new Map(selection.rows.map(r => [r.id, r]));
  const ownersByType = {};
  for (const b of [...prior, ...blocks]) { const t = b.classification?.archetype; if (t) (ownersByType[t] ??= []).push(b.id); }
  const priorByExternal = new Map(prior.map(b => [b.sourceReview?.origin?.externalId, b.id]));
  const DEFER = 'scope:deferred-20261107';
  for (const row of record.rows) {
    if (row.class !== 'pending') continue;
    const r = rows.get(row.id), d = decision.get(row.id), status = row.screenStatus;
    const set = fields => setDisposition(record, row.id, fields);
    if (priorByExternal.has(row.id)) set({class: 'selected', ownerId: priorByExternal.get(row.id)});
    else if (status === 'source-label-hold') set({class: 'ineligible', basis: 'screen:source-label-hold (school display name not approved)'});
    else if (text.includes(row.id)) set({class: 'duplicate', duplicateOf: (project.sections ?? []).flatMap(s => s.blocks ?? []).find(b => JSON.stringify(b).includes(row.id))?.id ?? row.id});
    else if (hasImage(r?.question_text) || hasImage(r?.solution_text)) set({class: 'ineligible', basis: `${DEFER}: source needs a figure; image questions are a later pass`});
    else if (used.has(row.id)) set({class: 'ineligible', basis: `${DEFER}: already an Exam question in a sibling booklet`});
    else if (!d) set({class: 'ineligible', basis: `${DEFER}: not classified`});
    else if (d.decision === 'selected' && accepted.has(row.id)) set({class: 'selected', ownerId: 'exam-mb-' + row.id});
    else if ((d.decision === 'selected' || d.decision === 'represented') && ownersByType[d.archetype]?.length) set({class: 'represented', representedBy: ownersByType[d.archetype], basis: `archetype ${d.archetype}: ${PER_ARCHETYPE} per archetype` + (d.decision === 'selected' ? ' (this adaptation was not accepted by the checker)' : '')});
    else if (d.decision === 'selected' || d.decision === 'represented') set({class: 'ineligible', basis: `${DEFER}: archetype ${d.archetype} adaptation not accepted by the checker; redraft later`});
    else if (d.decision === 'duplicate' && (project.sections ?? []).some(s => (s.blocks ?? []).some(b => b.id === d.duplicateOf))) set({class: 'duplicate', duplicateOf: d.duplicateOf});
    else if (d.decision === 'duplicate') set({class: 'ineligible', basis: `${DEFER}: reported duplicate of ${d.duplicateOf ?? 'an unnamed block'}`});
    else if (d.decision === 'faulty') set({class: 'faulty', fault: String(d.fault ?? d.basis ?? 'source defect').slice(0, 300), action: 'parked'});
    else set({class: 'ineligible', basis: 'scope:untaught: ' + String(d.basis ?? 'outside the booklet').slice(0, 300)});
  }
  return record;
}

// ---- save ---------------------------------------------------------------------------------------------
export async function saveBooklet(id, {approvedBy, log = console.error}) {
  const state = read(path.join(dirOf(id), 'state.json'));
  if (state.status !== 'built' || !state.closure?.closed) throw Error(`${id} is not built with a closed record (${state.status})`);
  const blockIds = read(path.join(ROOT, state.candidateFile)).sections.flatMap(s => (s.blocks ?? []).map(b => b.id));
  if (new Set(blockIds).size !== blockIds.length) throw Error(`${id} candidate repeats a block id; rebuild it`);
  const shaFile = path.join(dirOf(id), 'render', 'candidate.sha256');
  if (!fs.existsSync(shaFile) || fs.readFileSync(shaFile, 'utf8').trim() !== state.candidateSha256) throw Error(`${id} has no render of its current candidate`);
  const report = read(path.join(dirOf(id), 'render', 'feedback-pages.json'));
  if (report.passed !== true) {
    // A failure the live booklet already has (same check, same message, no new owner named) does not block:
    // render/baseline.json points at a render of the live file that fails identically.
    const baselineFile = path.join(dirOf(id), 'render', 'baseline.json');
    const baseline = fs.existsSync(baselineFile) ? read(path.join(ROOT, read(baselineFile).report)) : null;
    const key = f => `${f.edition}|${f.kind}|${f.message}`, known = new Set((baseline?.failures ?? []).map(key));
    // Layout issues on blocks that are not new owners (e.g. palette warnings on an existing diagram whose page
    // moved) predate this run: the new owners are text-only.
    const issues = Object.values(report.editionsReport ?? {}).flatMap(e => e.issues ?? []);
    const onlyOld = report.failures.every(f => f.kind === 'layout') && issues.length > 0
      && issues.every(i => !state.newOwners.some(o => JSON.stringify(i).includes(o)));
    if (onlyOld) write(path.join(dirOf(id), 'render', 'accepted-existing-issues.json'), {at: now(), reason: 'layout issues only on existing blocks', issues});
    const ok = onlyOld || (baseline && report.failures.length && report.failures.every(f => known.has(key(f)) && !state.newOwners.some(o => String(f.message).includes(o))));
    if (!ok) throw Error(`${id} render check did not pass`);
  }
  const {openOrAmend, readEntry, writeEntry, DEFAULT_REGISTRY} = await import('./exam-proposals.mjs');
  const dir = path.join(ROOT, DEFAULT_REGISTRY), {entry, bytes} = readEntry(id, dir);
  if (!(entry?.status === 'open' && entry.candidateSha256 === state.candidateSha256)) {
    const input = {projectId: id, fromRevision: state.revision, candidateFile: state.candidateFile, candidateSha256: state.candidateSha256, ownerIds: state.newOwners, closureRecord: state.closureRecord, note: 'exam-batch-20261107'};
    writeEntry(openOrAmend(entry, input, {amend: entry?.status === 'open'}), {dir, expectedBytes: bytes});
  }
  const {examPublish} = await import('./exam-publish.mjs');
  const result = await examPublish({projectId: id, apply: true, approvedBy, note: `Exam batch 20261107: ${state.newOwners.length} Exam questions`, root: ROOT});
  write(path.join(dirOf(id), 'saved.json'), {at: now(), revision: result.publish.to, sha256: result.publish.savedSha256, closure: result.closure.closed, gitAdd: result.gitAdd});
  log(`[${id}] saved r${result.publish.to}, closure ${result.closure.closed ? 'closed' : 'OPEN'}`);
  return result;
}

// ---- CLI ----------------------------------------------------------------------------------------------
async function pool(items, size, fn) { const out = []; let i = 0; await Promise.all(Array.from({length: Math.min(size, items.length)}, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } })); return out; }
export function usedExternalIds() {
  // Rows already Exam owners in any booklet: a split pair never prints the same source twice.
  const used = new Set();
  for (const f of fs.readdirSync(path.join(ROOT, 'booklets/projects'))) if (f.endsWith('.json')) {
    try { for (const b of examOwners(read(path.join(ROOT, 'booklets/projects', f)))) if (b.sourceReview?.origin?.externalId) used.add(b.sourceReview.origin.externalId); } catch {}
  }
  return used;
}
export async function main(argv) {
  const [command, ...args] = argv, arg = n => { const i = args.indexOf(n); return i < 0 ? undefined : args[i + 1]; };
  const all = () => fs.readdirSync(path.join(ROOT, 'booklets/projects')).filter(f => f.endsWith('.json')).map(f => { try { return read(path.join(ROOT, 'booklets/projects', f)); } catch { return null; } })
    .filter(p => p?.library?.category === 'master' && !p.library.archived && p.library.courseId === 's4').map(p => p.id).sort();
  const ids = args.includes('--all-s4') ? all() : (arg('--projects') ?? '').split(',').filter(Boolean);
  if (command === 'run') {
    const mode = arg('--mode') ?? 's4', until = arg('--until') ?? 'build', used = usedExternalIds();
    // A split pair shares subtopics: run the halves in sequence so the second sees the first's selection.
    const groups = new Map();
    for (const id of ids) { const key = id.replace(/-\d+-v1$/, '-v1'); (groups.get(key) ?? groups.set(key, []).get(key)).push(id); }
    const results = await pool([...groups.values()], Number(arg('--parallel') ?? 6), async group => {
      const out = [];
      for (const id of group) {
        const stateFile = path.join(ROOT, RUN, id, 'state.json');
        if (args.includes('--skip-built') && fs.existsSync(stateFile) && read(stateFile).status !== 'error') { out.push(read(stateFile)); continue; }
        try {
          // Booklets share MathsBase subtopics beyond split pairs (7 November 2026: Percentage Change 2 and
          // Percentages Problems), so every other booklet's built or saved owners are excluded too.
          const others = new Set(used);
          for (const d of fs.readdirSync(path.join(ROOT, RUN))) {
            const sf = path.join(ROOT, RUN, d, 'state.json');
            if (d !== id && fs.existsSync(sf)) for (const o of read(sf).newOwners ?? []) others.add(o.replace(/^exam-mb-/, ''));
          }
          const r = await runBooklet(id, {mode, until, used: others});
          for (const o of r.newOwners ?? []) used.add(o.replace(/^exam-mb-/, ''));
          out.push(r); console.error(`[${id}] ${r.status} ${JSON.stringify(r.select?.decisions ?? r.pool)}`);
        } catch (error) { out.push({id, status: 'error', error: error.message}); console.error(`[${id}] ERROR ${error.message}`); }
      }
      return out;
    });
    console.log(JSON.stringify(results.flat().map(r => ({id: r.id, status: r.status, added: r.newOwners?.length, rejected: r.rate?.rejected?.length, deferredImages: r.deferredImages, error: r.error, blocking: r.closure?.blocking?.length})), null, 1));
  } else if (command === 'save') {
    const approvedBy = arg('--approved-by');
    if (!approvedBy) throw Error('--approved-by is required');
    for (const id of ids) { try { await saveBooklet(id, {approvedBy}); } catch (error) { console.error(`[${id}] SAVE FAILED ${error.message}`); process.exitCode = 1; } }
  } else if (command === 'report') {
    const rows = fs.readdirSync(path.join(ROOT, RUN)).filter(n => fs.existsSync(path.join(ROOT, RUN, n, 'state.json'))).map(n => ({...read(path.join(ROOT, RUN, n, 'state.json')), saved: fs.existsSync(path.join(ROOT, RUN, n, 'saved.json')) ? read(path.join(ROOT, RUN, n, 'saved.json')).revision : null}));
    console.log(JSON.stringify(rows.map(r => ({id: r.id, status: r.status, added: r.newOwners?.length ?? 0, rejected: r.rate?.rejected?.length ?? 0, deferredImages: r.deferredImages ?? 0, coverage: r.closure?.coverage, saved: r.saved})), null, 1));
  } else {
    console.error('Usage: exam-batch.mjs run|save|report --projects a,b|--all-s4 [--mode s4|topup] [--until select|rate|build] [--approved-by QUOTE]');
    process.exitCode = 2;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main(process.argv.slice(2)).catch(error => { console.error(error.stack ?? error.message); process.exitCode = 1; });
