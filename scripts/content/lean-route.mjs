#!/usr/bin/env node
// Audit-first campaign (approved 5 October 2026): audit existing content, repair defects only,
// then independently check the affected content and publish through the revision-safe transaction.
// The legacy author-first profile remains available for historical/test runs.
// Formatting errors get one separate fix call so they do not use up the repair round (five calls at most).
// It keeps one compact record per skill and does not use the guarded campaign ledger's ownership,
// reading acknowledgments, lineage proofs, render receipts or UI capture.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { capturePair, assessmentItems, hashValue, DEFAULT_CAMPAIGN } from './campaign-support.mjs';
import { validateCandidatePair } from '../validate.mjs';
import { publishSkill } from './publication.mjs';

export const LEAN_ROUTE_PROFILE = 'lean-two-call-v1';
export const AUDIT_FIRST_PROFILE = 'lean-audit-first-v1';
const MODEL = 'gpt-6.1-sol', EFFORT = 'low', IMAGE_LIMIT = 110, BOOKLET_BYTE_LIMIT = 450000, CALL_LIMIT = 5;
const NL = '\n';
// Windows scanners can briefly deny an existing record while it is being read.
// Retry only transient file-access failures; retain the original error otherwise.
function writeFileResilient(file, value) {
  const temporary = `${file}.${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.tmp`;
  fs.writeFileSync(temporary, value);
  try {
    for (let attempt = 0; ; attempt++) {
      try { return fs.renameSync(temporary, file); }
      catch (error) {
        if (attempt >= 10 || !['UNKNOWN', 'EBUSY', 'EPERM', 'EACCES'].includes(error.code)) throw error;
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100 * (attempt + 1));
      }
    }
  } finally {
    try { fs.rmSync(temporary, { force: true }); } catch {}
  }
}
export const SOURCE_EXCEPTION_SKILLS = ['add-multiple-numbers-place-value', 'add-subtract-decimals', 'add-subtract-strategies'];
const SOURCE_EXCEPTION_REASON = 'User approved a booklet-source exception for these three Stage 3 skills on 5 October 2026, using the Stage 3 syllabus and independent mathematical review.';
export function approvedSourceException(root, skillId) {
  if (SOURCE_EXCEPTION_SKILLS.includes(skillId)) return { syllabusPath: 'syllabus/Stage 3 Content.md', reason: SOURCE_EXCEPTION_REASON };
  const approvalPaths = ['booklets/provenance/content-campaign/worked-examples-2026-09/approved-source-exceptions-20261009.json', 'booklets/provenance/content-campaign/worked-examples-2026-09/approved-additional-source-exceptions-20261009.json'];
  const rows = approvalPaths.flatMap(approvalPath => {
    const approval = readJson(path.join(root, approvalPath));
    return approval?.requestedBy === 'user' && approval.request?.trim() ? (approval.skills || []).filter(row => row.skillId === skillId).map(row => ({ ...row, approvalPath })) : [];
  });
  if (rows.length !== 1 || !rows[0].reason?.trim() || !/^syllabus\/Stage (?:3|4|5|6 (?:Standard|Advanced|Extension [12])) Content\.md$/.test(rows[0].syllabusPath || '') || !fs.existsSync(path.join(root, rows[0].syllabusPath))) return null;
  return rows[0];
}

export const RULES = `Booklet question-type rule (booklet-question-type-v1):
- Every practice and quiz item must be a question TYPE that appears in the source booklet's teaching, guided practice or exercises for this skill. "Type" means what the student is asked to do and with what given information, not the context or the values.
- Only what a booklet question or part actually ASKS is a type. An intermediate step inside a booklet solution is NOT a question type.
- Flattening a multi-part booklet question into stand-alone questions is acceptable site format.
- Replace each off-booklet type with an adapted booklet question of the same tier (Foundation, Development, Mastery, or the same quiz question id) with new values.
- Remove, with no replacement: recognition questions on a taught term that the booklet never asks, unless recognising it is central to this skill; and off-booklet items with no comparable booklet question to adapt.
- KEEP Development and Mastery items that are a booklet question type with harder values, even where the booklet section has no exercises of that tier.
- Follow the booklet's conventions for values and working, and its rounding convention; state the rounding in the question where it changes the answer.
- The attached images are the booklet's figures for this section. A question type shown only in an image counts.
Content rules:
- Preserve good booklet-type items, their ids, fields and values. Do not rewrite them for taste. Repair real mathematical, source, scope or teaching defects.
- Worked examples (theory.workedExamples, each {question_text, solution_text}) are adapted from the booklet's own worked examples, with different values. If no booklet worked example covers an assessed method, adapt a booklet exercise instead, with different values. Every booklet method assessed in practice or quiz has an example. Remove or rewrite an example that only supported a removed or replaced item. Never copy a practice card into an example.
- In every worked example, practice item and quiz question, keep this target skill as the focus. Do not introduce any more advanced skills, even if they appear elsewhere in the supplied booklet; choose or flatten a source part that assesses the target skill without those advanced demands.
- Use the booklet's simple language, notation, working sequence and taught method. Stay within the skill's stage.
- Site fields use inline $...$ maths only, one working step per line, no display maths.
- A replaced or repaired item's "structure" slug must describe its new task; do not leave the slug of a removed type.
- Every quiz question keeps exactly one correct option, and every other option keeps a "why" naming the specific mistake.
- Evaluate requested numerical answers and every numerical quiz option: an unevaluated formula or rounding operator is not a final calculated answer. Keep full precision until the stated rounding point; when totals use actual rounded payments, state that convention explicitly. Derive distractor values from their stated mistakes.
- Check boundary cases, consistency of every supplied given, payment/valuation timing where relevant, and that each review answer belongs to its stated canonical item. A table's column declaration must match its actual rows.
- When theory.steps changes, keep affected solution procedure headings consistent with it. Preserve correct calculations and usable working; do not introduce discretionary rewrites.
Output rules:
- Money: write every dollar amount as inline maths with an escaped sign, $\\$200$. Never leave a bare $ before an amount in any field, including an option's "why".
- A quiz option's "text" and "why" are prose with inline $...$ maths only. No [tikz] figure and no TikZ commands inside an option; a figure the question needs goes in question_text.
- Keep at least 3 cards in practice.foundation and in practice.development, at least 2 in practice.mastery when that tier exists, and at least 3 quiz questions, one of them mastery:true when a mastery tier exists. Where removing off-booklet items would go below a minimum, replace them with adapted booklet question types; if the booklet has none to adapt, return a blocker naming the gap.
- "removed" lists only whole original practice items, quiz questions or worked examples that no longer exist, each by its exact original locator (practice.foundation[2], quiz.q4, theory.workedExamples[1]). Changing theory text or rewording part of an item is not a removal: say so in "summary" instead.`;

export function codexBinary() {
  if (process.env.BOOKLET_CODEX_BIN) return process.env.BOOKLET_CODEX_BIN;
  const base = path.join(process.env.LOCALAPPDATA || '', 'OpenAI', 'Codex', 'bin');
  if (fs.existsSync(base)) for (const name of fs.readdirSync(base)) { const file = path.join(base, name, 'codex.exe'); if (fs.existsSync(file)) return file; }
  return 'codex';
}

export function runModel({ root, prompt, images, dir, name, modelId = MODEL, effort = EFFORT, spawnProcess = spawn }) {
  // A failed worker must never supply a response left by an earlier attempt.
  const callDir = fs.mkdtempSync(path.join(dir, name + '-'));
  const raw = path.join(callDir, 'response.raw.txt');
  // The CLI treats commas in --image values as separators. Source booklet paths may contain commas.
  const attached = images.map((file, index) => {
    if (!file.includes(',')) return file;
    const copy = path.join(callDir, 'image-' + (index + 1) + path.extname(file));
    fs.copyFileSync(file, copy);
    return copy;
  });
  const args = ['exec', '--ephemeral', '--ignore-user-config', '--skip-git-repo-check', '--sandbox', 'read-only', '-C', root, '--model', modelId, '-c', `model_reasoning_effort="${effort}"`, '-c', 'service_tier="default"', '-c', 'features.fast_mode=false', '-c', 'features.multi_agent=false', '-c', 'features.multi_agent_v2=false', '--json', '--output-last-message', raw, ...attached.flatMap(file => ['--image', file]), '-'];
  const started = Date.now();
  return new Promise(resolve => {
    const child = spawnProcess(codexBinary(), args, { cwd: root, windowsHide: true, shell: false, stdio: ['pipe', 'pipe', 'pipe'] });
    let usage = null, buffer = '', stderr = '', timedOut = false;
    const failures = [];
    const remember = message => { if (message && failures.length < 20) failures.push(String(message).slice(0, 2000)); };
    const consume = line => {
      try {
        const event = JSON.parse(line);
        if (event.usage) usage = event.usage;
        if (event.type === 'error' || event.type === 'turn.failed') remember(event.message || event.error?.message || event.error);
      } catch {}
    };
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, 1800000);
    child.stdout.on('data', chunk => {
      buffer += chunk; let index;
      while ((index = buffer.indexOf(NL)) >= 0) { const line = buffer.slice(0, index); buffer = buffer.slice(index + 1); consume(line); }
    });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', error => remember(error.message));
    child.stdin.on('error', error => remember('stdin: ' + error.message));
    child.on('close', code => {
      clearTimeout(timer);
      if (buffer.trim()) consume(buffer);
      let result = null, error = null;
      if (code !== 0 || failures.length || timedOut) error = [timedOut ? 'Worker exceeded the 30-minute call timeout' : 'Worker exited with code ' + code, ...failures, stderr.slice(-2000)].filter(Boolean).join(' | ');
      else try { const text = fs.readFileSync(raw, 'utf8'); result = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)); } catch (failure) { error = String(failure.message) + ' | ' + stderr.slice(-2000); }
      if (result) writeFileResilient(path.join(dir, name + '.json'), JSON.stringify(result, null, 2));
      resolve({ result, call: { name, code, seconds: Math.round((Date.now() - started) / 100) / 10, usage, error, responsePath: path.relative(root, raw) } });
    });
    child.stdin.end(prompt);
  });
}

const within = (ranges, number) => !ranges || ranges.some(range => number >= range.start && number <= range.end);
const numberedEvidence = (lines, ranges) => lines.map((line, index) => ({ number: index + 1, line: line.trimEnd().replace(/ {3,}/g, '  ').replace(/-{6,}/g, '-----').replace(/={6,}/g, '=====') }))
  .filter(row => within(ranges, row.number)).map(row => row.number + ': ' + row.line).join(NL);

/**
 * Cited spans widened to the booklet's own top-level sections and merged, together with the booklet's mixed exercise
 * sections, which hold questions on every topic. A booklet without such sections is supplied whole.
 */
function citedSections(lines, spans) {
  const tops = lines.map((line, index) => /^# \S/.test(line) ? index + 1 : 0).filter(Boolean);
  if (tops.length < 2) return null;
  const section = (start, end) => ({ start: tops.filter(number => number <= start).pop() ?? 1, end: (tops.find(number => number > end) ?? lines.length + 1) - 1 });
  const mixed = tops.filter(number => /^# \**(Check your Understanding|Mixed Practice|Challenge Exercise|Exam Practice)\b/i.test(lines[number - 1]));
  const ranges = [...spans.map(span => section(span.start, span.end)), ...mixed.map(number => section(number, number))].sort((a, b) => a.start - b.start);
  return ranges.reduce((list, range) => { const last = list.at(-1); if (last && range.start <= last.end + 1) last.end = Math.max(last.end, range.end); else list.push({ ...range }); return list; }, []);
}

/**
 * Booklet evidence for one skill, from the existing campaign ledger's source mapping. Where the mapping cites lines,
 * only the enclosing top-level sections of the cited booklets are supplied; uncited topic suggestions are named, not supplied.
 * Each image file in the supplied lines is attached once.
 */
export function skillEvidence(root, campaignId, skillId, section = null) {
  const overrides = section ? (Array.isArray(section) ? section : [section]) : null;
  if (overrides) for (const row of overrides) {
    const resolved = path.resolve(root, row.path || ''), sourceRoot = path.resolve(root, 'booklets/mathsmap-sources');
    if (!resolved.startsWith(sourceRoot + path.sep) || !Number.isInteger(row.start) || !Number.isInteger(row.end) || row.start < 1 || row.end < row.start || !fs.existsSync(resolved)) throw new Error('Invalid bounded booklet evidence override');
    if (row.end > fs.readFileSync(resolved, 'utf8').split(/\r?\n/).length) throw new Error('Booklet evidence override exceeds source lines');
  }
  const file = path.join(root, 'booklets/provenance/content-campaign', campaignId, 'skills', skillId + '.json');
  const state = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  const refs = [...(state.stage?.sourceReview || []), ...(state.sources || [])].filter(ref => /mathsmap-sources/.test(ref.path || '') && fs.existsSync(path.join(root, ref.path)));
  const mapped = [...new Set(refs.map(ref => ref.path))];
  const spans = overrides ? overrides.map(({path,start,end}) => ({path,start,end})) : refs.filter(ref => ref.startLine).map(ref => ({ path: ref.path, start: ref.startLine, end: ref.endLine ?? ref.startLine }));
  const cited = [...new Set(spans.map(span => span.path))], files = overrides ? [...new Set(overrides.map(row => row.path))] : cited.length ? cited : mapped;
  const booklets = [], found = new Map(); let bytes = 0, duplicateImages = 0;
  for (const booklet of files) {
    const text = fs.readFileSync(path.join(root, booklet), 'utf8'), lines = text.split(/\r?\n/);
    const ranges = overrides ? overrides.filter(row => row.path === booklet).map(({start,end}) => ({start,end})).sort((a,b) => a.start - b.start).reduce((list,row) => { const last = list.at(-1); if (last && row.start <= last.end + 1) last.end = Math.max(last.end,row.end); else list.push({...row}); return list; }, []) : cited.length ? citedSections(lines, spans.filter(span => span.path === booklet)) : null;
    bytes += Buffer.byteLength(numberedEvidence(lines, ranges));
    booklets.push({ path: booklet, ranges, lines: lines.length, outline: lines.map((line, index) => /^#{1,2} \S/.test(line) ? (index + 1) + ' ' + line.replace(/^#+ /, '').replace(/\*/g, '').trim() : null).filter(Boolean) });
    for (const match of text.matchAll(/\]\((media\/[^)]+?\.(?:png|jpe?g))\)/g)) {
      const line = text.slice(0, match.index).split(NL).length, target = path.join(root, path.dirname(booklet), match[1]);
      if (!fs.existsSync(target) || !within(ranges, line)) continue;
      const isCited = spans.some(span => span.path === booklet && line >= span.start - 3 && line <= span.end + 3), seen = found.get(target);
      if (seen) { seen.cited ||= isCited; duplicateImages++; continue; }
      found.set(target, { file: target, line, order: found.size, label: match[1].split('/').pop() + ' (' + path.basename(booklet) + ' line ' + line + ')', cited: isCited });
    }
  }
  const images = [...found.values()], chosen = [...images].sort((a, b) => Number(b.cited) - Number(a.cited) || a.order - b.order).slice(0, IMAGE_LIMIT).sort((a, b) => a.order - b.order);
  const sections = booklets.flatMap(booklet => (booklet.ranges || []).map(range => ({ path: booklet.path, ...range })));
  return { stage: state.scope?.stage ?? null, files, booklets, spans, section, sections, unsupplied: section ? [] : mapped.filter(booklet => !files.includes(booklet)), images: chosen, omittedImages: images.length - chosen.length, duplicateImages, bytes };
}

function evidenceText(root, evidence, pair) {
  const numbered = booklet => numberedEvidence(fs.readFileSync(path.join(root, booklet.path), 'utf8').split(/\r?\n/), booklet.ranges);
  const partial = evidence.booklets.filter(booklet => booklet.ranges);
  return [
    'ATTACHED IMAGES (' + evidence.images.length + (evidence.omittedImages ? '; ' + evidence.omittedImages + ' further images not attached' : '') + '; an image the booklet repeats is attached once, at its first line):',
    ...evidence.images.map((image, index) => (index + 1) + '. ' + image.label),
    evidence.spans.length ? (evidence.section ? 'Bounded source selection for this skill (independently assess teaching and relevant exercise coverage): ' : 'Lines previously cited for this skill: ') + evidence.spans.map(span => path.basename(span.path) + ' ' + span.start + '-' + span.end).join('; ') + (evidence.section ? '.' : '. Read the complete section and its full exercise set, not only these lines.') : '',
    partial.length ? 'BOOKLET OUTLINE (line number and heading). Only the line ranges named in each BOOKLET block below are supplied:' + NL + partial.map(booklet => path.basename(booklet.path) + ': ' + booklet.outline.join(' | ')).join(NL) : '',
    evidence.unsupplied.length ? 'Mapped to this topic only as unconfirmed suggestions and NOT supplied: ' + evidence.unsupplied.map(booklet => path.basename(booklet)).join('; ') + '.' : '',
    ...evidence.booklets.map(booklet => '===== BOOKLET ' + booklet.path + ' (' + (booklet.ranges ? 'lines ' + booklet.ranges.map(range => range.start + '-' + range.end).join(', ') + ' of ' + booklet.lines : 'complete') + '; lines numbered) =====' + NL + numbered(booklet) + NL + '===== END BOOKLET ====='),
    ...(pair ? ['===== CURRENT PUBLISHED content =====' + NL + JSON.stringify(pair.content) + NL + '===== END =====', '===== CURRENT PUBLISHED quiz =====' + NL + JSON.stringify(pair.quiz) + NL + '===== END ====='] : [])
  ].filter(Boolean).join(NL + NL);
}

const AUTHOR_SHAPE = '{"skillId":"...","blocker":null,"content":{complete content JSON},"quiz":{complete quiz JSON},"items":[{"where":"practice.foundation[0] | practice.development[0] | practice.mastery[0] | quiz.<id> (final locators)","decision":"kept"|"repaired"|"replaced","bookletQuestion":"booklet question number/part and line that this item follows"}],"removed":[{"where":"exact original locator of a whole removed item","reason":"one sentence"}],"summary":"two sentences on what changed"}';
const authorPrompt = (skillId, stage, evidence) => `You are the author for one MathsMap skill. All source and candidate evidence is supplied inline. You may use read-only calculator commands (such as node -e) to independently verify computations, particularly powers, probabilities and final rounding. Do not read repository files or write files. No subagents.

${RULES}

Skill: ${skillId}${stage ? ' (Stage ' + stage + ')' : ''}
Task: audit every practice item, quiz question and worked example against the booklet section for this skill, then return the complete corrected content and quiz. Fully derive every answer you write or keep. If the booklet evidence for this skill is missing or does not teach it, or the supplied lines stop short of its complete exercise set, return a blocker string (naming the outline headings needed) and no content.

Return ONLY JSON in this shape:
${AUTHOR_SHAPE}
"content" and "quiz" are the complete final files, in the same structure as the current published files, with every unchanged field preserved exactly.

${evidence}`;

const repairPrompt = (skillId, candidate, problems, evidence) => `You are the author for MathsMap skill ${skillId}, repairing your candidate after independent review. All source and candidate evidence is supplied inline. You may use read-only calculator commands (such as node -e) to independently verify computations, particularly powers, probabilities and final rounding. Do not read repository files or write files. No subagents.

${RULES}

Change only what the findings require and preserve everything else exactly. Return ONLY JSON in the same shape as before:
${AUTHOR_SHAPE}
For a large candidate, prefer this compact alternative instead of repeating unchanged figures:
{"skillId":"${skillId}","baseHash":"${pairHash(candidate)}","patches":[{"path":"content.practice.foundation[0].solution_text","value":"complete corrected field"}],"summary":"what changed"}
Each patch replaces one EXISTING content/quiz field, whole item, or array, using its exact JSON field path (quiz.questions[0], not quiz.<id>). Preserve omitted fields exactly. Omit items or removed to retain them; if supplied, each must be its COMPLETE final array. No placeholders. The baseHash above must match exactly. Independent review and all validators still run on the assembled complete candidate.

Findings to repair:
${problems.map(problem => '- ' + problem).join(NL)}

Your candidate:
${JSON.stringify({ content: candidate.content, quiz: candidate.quiz, items: candidate.items, removed: candidate.removed })}

${evidence}`;

const fixPrompt = (skillId, candidate, problems) => `You are correcting formatting only in a candidate for MathsMap skill ${skillId}. Do not run commands or tools. No subagents.

Site text rules:
- For a procedure-label mismatch, replace only the bold heading with the corresponding current theory.steps text, or remove the decorative heading while retaining all instructional text and calculations. Do not alter numbers or mathematical working.
- Inline $...$ maths only, one working step per line, no display maths.
- Money: every dollar amount is inline maths with an escaped sign, $\\$200$. Never a bare $ before an amount.
- A quiz option's "text" and "why" are prose with inline maths only.

Correct every error listed and the same mistake wherever else it occurs. Do not change any number, answer, method or meaning, and do not add or remove items. Leave an error you cannot correct by formatting alone.

Return ONLY JSON: {"fixes":[{"path":"content.practice.foundation[0].solution_text","value":"the complete corrected string"}]}
Each path names one existing text field of the candidate. An error located at "quiz <skill> questions[1].options[3].why" is path quiz.questions[1].options[3].why; one at "content <skill> practice.foundation[0].solution_text" is path content.practice.foundation[0].solution_text.

Errors:
${problems.map(problem => '- ' + problem).join(NL)}

Candidate:
${JSON.stringify({ content: candidate.content, quiz: candidate.quiz })}`;

const reviewPrompt = (skillId, candidate, scope, evidence, baseline) => `You are the independent reviewer for one MathsMap skill. You did not write the candidate. All source and candidate evidence is supplied inline. You may use read-only calculator commands (such as node -e) to independently verify computations, particularly powers, probabilities and final rounding. Do not read repository files or write files. No subagents.

${RULES}

Skill: ${skillId}
For ${scope ? 'each of these items only: ' + scope.join(', ') : 'EVERY practice item, quiz question and worked example in the candidate'}: derive the answer yourself before reading the given solution, then compare. Check the wording, the working, the stage and method, and that the item is a booklet question type under the rule. For each quiz question decide which single option is correct from your own answer and check every other option's explanation. ${!scope || scope.includes('theory') ? 'Also check the theory text against the booklet.' : ''} ${!scope || scope.includes('removals') ? 'Independently check each removal against its original item and source.' : ''}

Return ONLY JSON:
{"skillId":"${skillId}","outcomes":[{"where":"practice.foundation[0] | quiz.<id> | theory.workedExamples[0]","verdict":"accepted"|"repair","answer":"your own final answer with the key working","correctOption":null,"bookletType":true,"finding":"empty, or exactly what must change"}],"theory":{"verdict":"accepted"|"repair","finding":""},"removals":[{"where":"...","agree":true,"finding":""}],"summary":"two sentences"}
"correctOption" is the zero-based index of the correct option for quiz questions and null otherwise. "bookletType" is your own judgement for practice and quiz items.
Return exactly one outcome for each of these canonical final locators, copied verbatim (do not use original indices after removals):
${JSON.stringify(reviewable(candidate).filter(item => !scope || scope.includes(item.where)).map(item => item.where))}

Candidate:
${JSON.stringify({ content: candidate.content, quiz: candidate.quiz, items: candidate.items, removed: candidate.removed, editNotes: candidate.editNotes })}

${scope && !scope.includes('removals') ? '' : 'Original items named in removals (compare each original task with the booklet before agreeing):' + NL + JSON.stringify(reviewable(baseline).filter(item => (candidate.removed || []).some(row => row.where === item.where)).map(({ where, value }) => ({ where, value })))}

${evidence}`;

const reviewable = pair => assessmentItems(pair.content, pair.quiz, false);

// The audit-first campaign checks existing content without requiring expansion or cosmetic rewriting.
export const AUDIT_RULES = RULES.replace(/- Worked examples \(theory\.workedExamples[^\n]+/, '- Audit existing worked examples. Missing examples or incomplete example coverage are optional improvements, not defects; do not add examples unless needed to repair misleading or unusable teaching.')
  .replace('- Site fields use inline $...$ maths only, one working step per line, no display maths.', '- Preserve usable existing setout. Flag mathematical, source, scope, misleading-teaching or rendering defects only; do not request line splitting or other cosmetic changes unless needed for understanding. Changed text uses inline $...$ maths, not display maths.');

const auditPrompt = (skillId, candidate, evidence, baseline) => reviewPrompt(skillId, candidate, null, evidence, baseline).replace(RULES, AUDIT_RULES) + `\nThis is an audit of the existing published skill, not a content-upgrade assignment. Return findings and your independently derived answers only; do not return replacement content. If the evidence omits the skill's teaching, complete exercise set or necessary figures, return {"skillId":"${skillId}","blocker":"the missing source headings/figures needed"} instead of acceptance; do not infer booklet types from incomplete evidence. Each accepted practice/quiz outcome also supplies bookletQuestion: the source question/part and line supporting your booklet-type decision. For a theory repair, supply affectedItems: an array of canonical item locators dependent on the correction, [] only for a local wording correction with no answer/method dependencies, or null when shared mathematics/methods change. Missing worked examples and optional style improvements must not block acceptance.`;

/** Keep accepted answers from the first audit; review only changed/open items and explicit dependencies. */
export function auditRepairScope(reviewed, candidate, review, sourceException = false) {
  if (!reviewed || !review) return null;
  const delta = changedItems(reviewed, candidate);
  if (delta.theory && !Array.isArray(review.theory?.affectedItems)) return null;
  const final = new Set(reviewable(candidate).map(item => item.where));
  const dependencies = delta.theory ? review.theory.affectedItems : [];
  if (dependencies.some(where => !final.has(where))) return null;
  const open = reviewable(reviewed).filter(item => checkReview(reviewed, review, [item.where], sourceException).length).map(item => item.where);
  const scope = [...new Set([...delta.where, ...open, ...dependencies])].filter(where => final.has(where));
  if (delta.theory || review.theory?.verdict !== 'accepted') scope.push('theory');
  if (JSON.stringify(reviewed.removed || []) !== JSON.stringify(candidate.removed || []) || checkReview(reviewed, review, null, sourceException).some(problem => problem.startsWith('removal '))) scope.push('removals');
  return scope;
}

/** A diagram check is required only for a new/changed diagram body, including theory diagrams. */
export function changedDiagramBodies(baseline, candidate) {
  const diagrams = pair => textFields({ content: pair.content, quiz: pair.quiz }).flatMap(({ value }) => [...value.matchAll(/\[tikz\][\s\S]*?\[\/tikz\]|\\begin\{tikzpicture\}[\s\S]*?\\end\{tikzpicture\}|<svg\b[\s\S]*?<\/svg>|!\[[^\]]*\]\([^)]+\)|\\includegraphics(?:\[[^\]]*\])?\{[^}]+\}/g)].map(match => match[0]));
  const known = new Set(diagrams(baseline));
  return [...new Set(diagrams(candidate))].filter(body => !known.has(body));
}

/** "removed" rows that do not name a whole original item (theory edits, parts of an item) become edit notes for the reviewer, not removals. */
export function normaliseRemovals(baseline, candidate) {
  if (!candidate?.content || !Array.isArray(candidate.removed)) return candidate;
  const original = new Set(reviewable(baseline).map(item => item.where)), rows = candidate.removed.map(row => ({ ...row, where: String(row?.where ?? '').replace(/^content\./, '') }));
  const notes = rows.filter(row => !original.has(row.where));
  return { ...candidate, removed: rows.filter(row => original.has(row.where)), ...(notes.length ? { editNotes: [...(candidate.editNotes || []), ...notes] } : {}) };
}

const textFields = (value, at = '', out = []) => {
  if (typeof value === 'string') out.push({ at, value });
  else if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) textFields(child, Array.isArray(value) ? at + '[' + key + ']' : at ? at + '.' + key : key, out);
  return out;
};
/** Bare currency signs that pair up by accident pass the validator; a maths span holding a run of plain words gives them away. Unchanged published text is not judged. */
export function currencyProblems(baseline, candidate) {
  const known = new Set(textFields({ content: baseline.content, quiz: baseline.quiz }).map(row => row.value)), problems = [];
  for (const { at, value } of textFields({ content: candidate.content, quiz: candidate.quiz })) {
    if (known.has(value)) continue;
    const spans = value.replace(/\[tikz\][\s\S]*?\[\/tikz\]/g, ' ').replace(/\\\$/g, '').match(/\$[^$]*\$/g) || [];
    if (spans.some(span => /[A-Za-z]{2,}\s+[A-Za-z]{2,}\s+[A-Za-z]{2,}/.test(span.replace(/\\(?:text|textbf|textit|mathrm|mbox)\{[^{}]*\}/g, ' ').replace(/\\[A-Za-z]+/g, ' ')))) problems.push('Format: ' + at + ': a bare $ before a money amount starts an unintended maths span; write each amount as $\\$200$');
  }
  return problems;
}
const isFormat = problem => /^Format: |unbalanced \$ delimiters|TeX outside math|KaTeX error|procedure label .* does not match theory\.steps/.test(problem);

/** Replace existing text fields named by path. Anything else in a fix is ignored, so a fix cannot add, remove or restructure items. */
export function applyFixes(candidate, fixes) {
  const next = { ...candidate, content: structuredClone(candidate.content), quiz: candidate.quiz == null ? candidate.quiz : structuredClone(candidate.quiz) }; let applied = 0;
  for (const fix of Array.isArray(fixes) ? fixes : []) {
    const keys = String(fix?.path ?? '').match(/[^.[\]]+/g) || [], last = keys.pop();
    if (!['content', 'quiz'].includes(keys[0]) || typeof fix.value !== 'string') continue;
    const holder = keys.reduce((node, key) => node && typeof node === 'object' ? node[key] : undefined, next);
    if (holder && typeof holder === 'object' && typeof holder[last] === 'string') { holder[last] = fix.value; applied++; }
  }
  return { candidate: next, applied };
}

/** Assemble an author's bounded replacement fields; this grants no review or publication credit. */
export function applyRepairResult(candidate, result) {
  if (!result?.patches) return result;
  const reject = reason => ({ skillId: candidate.content.skillId, blocker: 'Invalid repair patch: ' + reason, content: null });
  if (result.skillId !== candidate.content.skillId || result.baseHash !== pairHash(candidate) || !Array.isArray(result.patches)) return reject('skill or base hash mismatch');
  const next = structuredClone(candidate), seen = [];
  for (const patch of result.patches) {
    const field = patch?.path;
    if (typeof field !== 'string' || !/^(content|quiz)(?:\.[A-Za-z][A-Za-z0-9_]*|\[\d+\])+$/.test(field)) return reject('invalid field path');
    const keys = field.match(/[^.[\]]+/g);
    if (keys.some(key => ['__proto__', 'prototype', 'constructor', 'skillId'].includes(key))) return reject('protected field');
    const canonical = keys.join('.');
    if (seen.some(old => old === canonical || old.startsWith(canonical + '.') || canonical.startsWith(old + '.'))) return reject('overlapping fields');
    seen.push(canonical);
    const last = keys.pop(); let holder = next;
    for (const key of keys) { if (!holder || !Object.hasOwn(holder, key)) return reject('field does not exist'); holder = holder[key]; }
    if (!holder || !Object.hasOwn(holder, last) || !Object.hasOwn(patch, 'value')) return reject('field does not exist or value missing');
    holder[last] = structuredClone(patch.value);
  }
  for (const key of ['items', 'removed']) if (Object.hasOwn(result, key)) { if (!Array.isArray(result[key])) return reject(key + ' must be an array'); next[key] = structuredClone(result[key]); }
  if (typeof result.summary === 'string') next.summary = result.summary;
  return next;
}

/** Mechanical checks of the author's result. Mathematical acceptance comes only from the reviewer. */
export function checkCandidate(root, skillId, baseline, candidate, sourceException = false, exceptionPath = 'syllabus/Stage 3 Content.md') {
  const problems = [];
  if (!candidate?.content || candidate.content.skillId !== skillId) return ['Candidate content missing or for another skill'];
  if (baseline.quiz && (!candidate.quiz || candidate.quiz.skillId !== skillId)) problems.push('Candidate quiz missing or for another skill');
  const validation = validateCandidatePair({ skillId, content: candidate.content, quiz: candidate.quiz ?? null, rootDir: root });
  for (const error of validation.errors || []) problems.push('Validator: ' + error);
  const final = reviewable(candidate).filter(item => item.kind !== 'example'), before = reviewable(baseline);
  for (const item of final) if (!(candidate.items || []).some(row => row.where === item.where && typeof row.bookletQuestion === 'string' && row.bookletQuestion.trim())) problems.push('No booklet question cited for ' + item.where);
  if (sourceException) for (const item of final) if (!(candidate.items || []).some(row => row.where === item.where && row.sourceException === true && (row.bookletQuestion || '').includes(exceptionPath))) problems.push('No explicit syllabus source exception cited for ' + item.where);
  for (const row of candidate.removed || []) if (!before.some(item => item.where === row.where) || !row.reason?.trim()) problems.push('Removal must name an original item and a reason: ' + row.where);
  return [...problems, ...currencyProblems(baseline, candidate)];
}

/** The reviewer's own decisions must cover every item and agree with the candidate's marked answers. */
export function checkReview(candidate, review, scope = null, sourceException = false) {
  const problems = [], items = reviewable(candidate).filter(item => !scope || scope.includes(item.where));
  for (const item of items) {
    const rows = (review?.outcomes || []).filter(row => row.where === item.where), row = rows[0];
    if (rows.length !== 1 || !row.answer?.trim() || !['accepted', 'repair'].includes(row.verdict)) { problems.push('Review missing its own answer or verdict for ' + item.where); continue; }
    if (row.verdict === 'repair') { problems.push(item.where + ': ' + (row.finding?.trim() || 'repair requested without a finding')); continue; }
    if (sourceException) { if (row.sourceExceptionConfirmed !== true) problems.push(item.where + ': reviewer did not independently confirm the syllabus source exception'); }
    else if (item.kind !== 'example' && row.bookletType !== true) problems.push(item.where + ': reviewer did not confirm a booklet question type');
    if (item.kind === 'quiz') {
      const marked = item.value.options.map((option, index) => option.correct === true ? index : -1).filter(index => index >= 0);
      if (marked.length !== 1 || row.correctOption !== marked[0]) problems.push(item.where + ': reviewer\'s correct option (' + row.correctOption + ') disagrees with the marked option (' + marked.join(',') + ')');
    }
  }
  if ((!scope || scope.includes('theory')) && review?.theory?.verdict !== 'accepted') problems.push('theory: ' + (review?.theory?.finding?.trim() || 'not accepted'));
  if (!scope || scope.includes('removals')) {
    for (const row of candidate.removed || []) { const seen = (review?.removals || []).find(entry => entry.where === row.where); if (seen?.agree !== true) problems.push('removal ' + row.where + ': ' + (seen?.finding?.trim() || 'reviewer did not agree')); }
  }
  return problems;
}

/** Final locators whose content differs from another pair, plus whether the theory text changed. */
export function changedItems(before, after) {
  const prior = new Map(reviewable(before).map(item => [item.where, item.hash]));
  const where = reviewable(after).filter(item => prior.get(item.where) !== item.hash).map(item => item.where);
  const theory = value => { const { workedExamples, workedExample, ...rest } = value.content.theory || {}; return hashValue(rest); };
  return { where, theory: theory(before) !== theory(after) };
}

/**
 * Items a second review must cover after a change: every changed item and every item the full review of `reviewed` did not accept.
 * Null means review everything: no full review yet, the theory or removals moved, or that review left the theory or a removal open.
 */
export function reReviewScope(reviewed, candidate, review, sourceException = false) {
  if (!reviewed || !review) return null;
  const delta = changedItems(reviewed, candidate), open = checkReview(reviewed, review, null, sourceException);
  if (delta.theory || open.some(problem => problem.startsWith('theory: ') || problem.startsWith('removal ')) || JSON.stringify(reviewed.removed || []) !== JSON.stringify(candidate.removed || [])) return null;
  const flagged = reviewable(reviewed).filter(item => checkReview(reviewed, review, [item.where], sourceException).length).map(item => item.where), final = new Set(reviewable(candidate).map(item => item.where));
  return [...new Set([...delta.where, ...flagged])].filter(where => final.has(where));
}
const diagramPattern = /tikzpicture|\\begin\{axis\}|<svg|!\[|\\includegraphics|"image"|"diagram"/;
export const touchesDiagram = (baseline, candidate) => { const changed = new Set(changedItems(baseline, candidate).where); return reviewable(candidate).some(item => changed.has(item.where) && diagramPattern.test(JSON.stringify(item.value))); };

const readJson = file => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } };
const pairHash = candidate => hashValue({ content: candidate.content, quiz: candidate.quiz });

/** The retained candidate of a record needing attention, with its full review where one covers exactly that candidate; otherwise the reason it cannot be resumed. */
function resumable(dir, prior, baseline, repair = false) {
  if (!prior || !( /^needs attention/.test(prior.status) || (repair && prior.status === 'accepted: held for diagram check'))) return 'no retained candidate needing repair';
  if ((prior.calls || []).some(call => /(?:^|-)author$/.test(call.name) && call.code != null && call.code !== 0)) return 'author worker failed; use --redo for a fresh response';
  if (prior.resumed && !repair) return 'already resumed once; use --redo for a fresh attempt';
  if (prior.baseline?.contentHash !== baseline.expected.contentHash || prior.baseline?.quizHash !== baseline.expected.quizHash) return 'live content changed since the candidate was written; use --redo';
  const candidate = ['candidate', 'resume-repair', 'repair', 'author'].map(name => readJson(path.join(dir, name + '.json'))).find(value => value?.content && Array.isArray(value.items) && pairHash(value) === prior.candidateHash);
  if (!candidate) return 'retained candidate does not match the record; use --redo';
  // Records written before fullReview was kept: a final review-full call always reviewed the recorded candidate.
  const full = prior.fullReview ?? (prior.calls?.at(-1)?.name === 'review-full' ? { name: 'review-full', hash: prior.candidateHash } : null);
  return { candidate, review: full?.hash === prior.candidateHash && (!(candidate.removed || []).length || full.originalRemovalsSupplied) ? readJson(path.join(dir, full.name + '.json')) : null };
}

export async function runSkill(root, { campaignId = DEFAULT_CAMPAIGN, skillId, publish = false, section = null, resume = false, repair = false, redo = false, finding = null, sourceException = false, auditFirst = campaignId === DEFAULT_CAMPAIGN, model = runModel } = {}) {
  const exceptionPolicy = sourceException ? approvedSourceException(root, skillId) : null;
  if (sourceException && !exceptionPolicy) throw new Error('No approved source exception for ' + skillId);
  const dir = path.join(root, '.agywork/content-campaign', campaignId, 'lean', skillId), recordDir = path.join(root, 'booklets/provenance/content-campaign', campaignId, 'lean'), recordFile = path.join(recordDir, skillId + '.json');
  fs.mkdirSync(dir, { recursive: true }); fs.mkdirSync(recordDir, { recursive: true });
  const prior = readJson(recordFile), baseline = capturePair(root, skillId);
  // A continuation of an approved exception reuses its completed audit/draft;
  // an explicit redo or changed syllabus still starts a fresh audit.
  if (sourceException && !redo && !resume && !repair && prior?.sourceException?.path === exceptionPolicy.syllabusPath && prior.sourceException.hash === hashValue(fs.readFileSync(path.join(root, exceptionPolicy.syllabusPath), 'utf8')) && typeof resumable(dir, prior, baseline) === 'object') resume = true;
  const resumed = resume || repair ? resumable(dir, prior, baseline, repair) : null;
  // A refused resume leaves the existing record and working files untouched.
  if (typeof resumed === 'string') return { skillId, status: 'not resumed: ' + resumed, calls: [] };
  if (repair && !(prior.findings || []).length && !finding) return { skillId, status: 'not resumed: explicit maintenance repair requires findings', calls: [] };
  const record = { profile: auditFirst ? AUDIT_FIRST_PROFILE : LEAN_ROUTE_PROFILE, skillId, model: MODEL, effort: EFFORT, startedAt: new Date().toISOString(), status: 'running', calls: [] };
  // Earlier attempts keep their calls and usage, so a redo, a resume or an interruption does not lose what was spent.
  if (prior) record.previousAttempts = [...(prior.previousAttempts || []), { startedAt: prior.startedAt, finishedAt: prior.finishedAt ?? null, status: prior.status, calls: prior.calls || [] }];
  if (resume) record.resumed = true;
  if (repair) record.maintenanceRepair = true;
  if (resumed) Object.assign(record, { candidateHash: pairHash(resumed.candidate), findings: prior.findings || [], ...(prior.fullReview ? { fullReview: prior.fullReview } : {}) });
  const save = () => writeFileResilient(recordFile, JSON.stringify(record, null, 2) + NL);
  const finish = status => { Object.assign(record, { status, finishedAt: new Date().toISOString() }); save(); return record; };
  const syllabusPath = exceptionPolicy?.syllabusPath || 'syllabus/Stage 3 Content.md';
  const evidenceSection = section || ((resume || repair) && prior?.sections?.length ? prior.sections : null);
  const diagnosticContext = (Array.isArray(evidenceSection) ? evidenceSection : evidenceSection ? [evidenceSection] : []).map(row => row.diagnosticContext).filter(value => typeof value === 'string' && value.trim()).join(NL) || ((resume || repair) ? prior?.diagnosticContext : '') || '';
  if (diagnosticContext) record.diagnosticContext = diagnosticContext;
  const evidence = sourceException ? { stage: Number(syllabusPath.match(/Stage (\d)/)[1]), files: [syllabusPath], sections: [], images: [], omittedImages: 0, bytes: 0 } : skillEvidence(root, campaignId, skillId, evidenceSection);
  if (sourceException) record.sourceException = { reason: exceptionPolicy.reason, ...(exceptionPolicy.approvalPath ? { approvalPath: exceptionPolicy.approvalPath } : {}), path: syllabusPath, hash: hashValue(fs.readFileSync(path.join(root, syllabusPath), 'utf8')) };
  Object.assign(record, { baseline: baseline.expected, booklets: evidence.files, images: evidence.images.length, omittedImages: evidence.omittedImages });
  if (evidence.sections.length) record.sections = evidence.sections;
  if (!evidence.files.length) return finish('skipped: no booklet source mapped');
  if (evidence.bytes > BOOKLET_BYTE_LIMIT) return finish('skipped: booklet too large to supply whole; pass --section path:start-end');
  const exceptionText = sourceException ? `USER-APPROVED SOURCE EXCEPTION: ${exceptionPolicy.reason}\nFor this skill only, the requirement to adapt a booklet question/example is replaced by alignment to the supplied stage syllabus. Preserve correct existing questions within that scope; author examples with different values using the syllabus methods. Do not introduce advanced skills. Keep all other mathematical, wording, format, option and minimum-count rules. The author must set sourceException:true on EVERY items row and cite ${syllabusPath} with its relevant line/heading in the legacy bookletQuestion field. The independent reviewer must derive every answer and check every option and explanation, confirm each task/example is within the syllabus and target skill, and set sourceExceptionConfirmed:true on EVERY outcome only when confirmed. Set bookletType:false because these are explicit exceptions, not booklet questions. Review theory and every removal independently.\n===== SYLLABUS ${syllabusPath} =====\n` + fs.readFileSync(path.join(root, syllabusPath), 'utf8').split(/\r?\n/).map((line, index) => (index + 1) + ': ' + line).join(NL) : null;
  const diagnosticText = diagnosticContext ? '\nSOURCE-LOCATION DIAGNOSIS (not acceptance; independently confirm every claim against the supplied source and target-stage methods):\n' + diagnosticContext : '';
  const plain = (sourceException ? exceptionText : evidenceText(root, evidence, null)) + diagnosticText;
  const text = sourceException ? plain + '\n===== CURRENT PUBLISHED content =====\n' + JSON.stringify(baseline.content) + '\n===== CURRENT PUBLISHED quiz =====\n' + JSON.stringify(baseline.quiz) : evidenceText(root, evidence, baseline) + diagnosticText;
  const images = evidence.images.map(image => image.file), prefix = repair ? 'maintenance-' : resumed ? 'resume-' : '';
  save();
  const call = async (prompt, name, attach = images) => {
    if (record.calls.length >= CALL_LIMIT) throw new Error('Call limit reached');
    const { result, call: metrics } = await model({ root, prompt, images: attach, dir, name: prefix + name }); record.calls.push(metrics); save(); return result;
  };

  const auditRules = prompt => {
    let next = auditFirst ? prompt.replace(RULES, AUDIT_RULES) : prompt;
    if (sourceException) {
      next = next.replace('If the evidence omits the skill\'s teaching, complete exercise set or necessary figures, return {"skillId":"'+skillId+'","blocker":"the missing source headings/figures needed"} instead of acceptance; do not infer booklet types from incomplete evidence.', 'The approved exception supplies a stage syllabus instead of booklet exercises. Independently assess every existing item and example against the target skill and syllabus; missing booklet questions alone are not a blocker. A real syllabus-scope uncertainty or mathematical defect still prevents acceptance.');
      next = next.replace('Each accepted practice/quiz outcome also supplies bookletQuestion: the source question/part and line supporting your booklet-type decision.', 'Each accepted practice/quiz outcome supplies bookletQuestion citing the approved syllabus path and relevant line/heading, and sourceExceptionConfirmed:true only after independent confirmation.');
    }
    return next;
  };
  let initialAudit = null;
  let candidate = resumed ? resumed.candidate : auditFirst ? { content: baseline.content, quiz: baseline.quiz, items: [], removed: [] } : await call(authorPrompt(skillId, evidence.stage, text), 'author');
  if (!candidate) return finish('failed: author returned no result');
  if (candidate.blocker) { record.blocker = candidate.blocker; return finish('blocked'); }
  if (auditFirst && !resumed) {
    initialAudit = await call(auditRules(auditPrompt(skillId, candidate, plain, baseline)), 'audit');
    if (!initialAudit) return finish('failed: auditor returned no result');
    if (initialAudit.blocker) { record.blocker = initialAudit.blocker; return finish('blocked'); }
    candidate.items = (initialAudit.outcomes || []).filter(row => !row.where?.startsWith('theory.')).map(row => ({ where: row.where, decision: 'kept', bookletQuestion: row.bookletQuestion, ...(sourceException ? { sourceException: row.sourceExceptionConfirmed === true } : {}) }));
    record.fullReview = { name: 'audit', hash: pairHash(candidate), originalRemovalsSupplied: true, ...(sourceException ? { sourceExceptionConfirmed: initialAudit.outcomes?.every(row => row.sourceExceptionConfirmed === true) === true } : {}) };
  }
  let review = repair ? (auditFirst ? resumed?.review ?? null : null) : initialAudit ?? resumed?.review ?? null, reviewed = review ? candidate : null, scope = null, fixed = false, repaired = repair;
  if (repair) {
    const findings = [...(/^needs attention/.test(prior.status) ? prior.findings || [] : []), ...(finding ? [finding] : [])];
    if (!findings.length) return finish('needs attention: explicit maintenance repair requires findings');
    record.firstRoundFindings = findings;
    candidate = applyRepairResult(candidate, await call(auditRules(repairPrompt(skillId, candidate, findings, auditFirst ? plain : text)), 'repair'));
    if (!candidate?.content) { record.blocker = candidate?.blocker || null; return finish('needs attention: repair returned no candidate'); }
  }
  // Mechanical problems after tidying the removals. Formatting errors get one fix call per run, sent without the booklet, so they do not use the repair round.
  const mechanical = async () => {
    candidate = normaliseRemovals(baseline, candidate);
    let found = checkCandidate(root, skillId, baseline, candidate, sourceException, syllabusPath);
    if (!fixed && found.some(isFormat)) {
      fixed = true;
      const patched = applyFixes(candidate, (await call(fixPrompt(skillId, candidate, found.filter(isFormat)), 'fix', []))?.fixes);
      if (patched.applied) { candidate = patched.candidate; found = checkCandidate(root, skillId, baseline, candidate, sourceException, syllabusPath); }
    }
    return found;
  };
  const fullReview = async name => { const result = await call(auditRules(reviewPrompt(skillId, candidate, null, plain, baseline)), name); review = result; reviewed = candidate; record.fullReview = { name: prefix + name, hash: pairHash(candidate), originalRemovalsSupplied: true, ...(sourceException ? { sourceExceptionConfirmed: result?.outcomes?.every(row => row.sourceExceptionConfirmed === true) === true } : {}) }; return checkReview(candidate, result, null, sourceException); };
  // After a change the reviewer re-checks the changed and still-open items, or everything where reReviewScope cannot narrow it.
  const reReview = async () => {
    scope = auditFirst ? auditRepairScope(reviewed, candidate, review, sourceException) : reReviewScope(reviewed, candidate, review, sourceException);
    if (!scope) return fullReview('review-full');
    if (!auditFirst && !changedItems(reviewed, candidate).where.length) return ['Repair changed no item', ...checkReview(reviewed, review, null, sourceException)];
    if (!scope.length) return checkReview(candidate, review, null, sourceException);
    const result = await call(auditRules(reviewPrompt(skillId, candidate, scope, plain, baseline)), 'review-scoped');
    const problems = checkReview(candidate, result, scope, sourceException);
    if (auditFirst && !problems.length) {
      const old = new Map(review.outcomes.map(row => [row.where, row]));
      for (const row of result.outcomes || []) if (scope.includes(row.where)) old.set(row.where, row);
      // Merge actual independent decisions only; unchanged items retain their accepted audit.
      review = { ...review, outcomes: reviewable(candidate).map(item => old.get(item.where)), ...(scope.includes('theory') ? { theory: result.theory } : {}), ...(scope.includes('removals') ? { removals: result.removals } : {}), summary: result.summary };
      const remaining = checkReview(candidate, review, null, sourceException);
      if (remaining.length) return remaining;
      writeFileResilient(path.join(dir, 'review-accepted.json'), JSON.stringify(review, null, 2));
      record.fullReview = { name: 'review-accepted', hash: pairHash(candidate), originalRemovalsSupplied: true, ...(sourceException ? { sourceExceptionConfirmed: review.outcomes.every(row => row.sourceExceptionConfirmed === true) } : {}) };
      reviewed = candidate;
    }
    return problems;
  };

  let problems = await mechanical();
  // Maintenance changed the retained candidate: old rejected outcomes identify
  // the review scope, but cannot reject the corrected candidate without a recheck.
  if (!problems.length && repair) problems = review ? await reReview() : await fullReview('review');
  else if (!problems.length && !review) problems = await fullReview('review');
  else if (review) problems = [...problems, ...checkReview(reviewed, review, null, sourceException)];
  if (problems.length && !repair) {
    record.firstRoundFindings = problems; repaired = true;
    const next = applyRepairResult(candidate, await call(auditRules(repairPrompt(skillId, candidate, problems, auditFirst ? plain : text)), 'repair'));
    if (!next?.content) { record.blocker = next?.blocker || null; return finish('needs attention: repair returned no candidate'); }
    candidate = next; problems = await mechanical();
    if (!problems.length) problems = await reReview();
  } else if (!problems.length && pairHash(reviewed) !== pairHash(candidate)) problems = await reReview();
  writeFileResilient(path.join(dir, 'candidate.json'), JSON.stringify({ content: candidate.content, quiz: candidate.quiz, items: candidate.items, removed: candidate.removed, editNotes: candidate.editNotes }, null, 2));
  const delta = changedItems(baseline, candidate);
  Object.assign(record, { repaired, changed: delta.where, theoryChanged: delta.theory, removed: candidate.removed || [], items: reviewable(candidate).length, summary: candidate.summary || null, reviewSummary: review?.summary || null, candidateHash: pairHash(candidate) });
  if (problems.length) { record.findings = problems; return finish('needs attention: not accepted after one repair round'); }
  delete record.findings;
  if (sourceException && record.sourceException.hash !== hashValue(fs.readFileSync(path.join(root, syllabusPath), 'utf8'))) return finish('needs attention: syllabus changed during review');
  if (auditFirst) {
    const live = capturePair(root, skillId).expected;
    if (live.contentHash !== baseline.expected.contentHash || live.quizHash !== baseline.expected.quizHash) return finish('needs attention: live content changed during audit');
  }
  if (!delta.where.length && !delta.theory && !(candidate.removed || []).length) return finish('accepted: no change needed');
  if (auditFirst ? changedDiagramBodies(baseline, candidate).length : touchesDiagram(baseline, candidate)) return finish('accepted: held for diagram check');
  if (!publish) return finish('accepted: not published (run with --publish)');
  const saved = await publishSkill(root, skillId, { expected: baseline.expected, candidateContent: candidate.content, candidateQuiz: candidate.quiz });
  record.published = { expected: saved.expected, journalPath: saved.journalPath ? path.relative(root, saved.journalPath) : null };
  return finish('published');
}

/** Publish an already accepted, unpublished candidate. The transaction refuses if the live pair moved since it was reviewed. */
export async function publishAccepted(root, { campaignId = DEFAULT_CAMPAIGN, skillId, allowDiagram = false } = {}) {
  const file = path.join(root, 'booklets/provenance/content-campaign', campaignId, 'lean', skillId + '.json'), record = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!(record.status === 'accepted: not published (run with --publish)' || (allowDiagram && record.status === 'accepted: held for diagram check'))) throw new Error('Not an accepted unpublished candidate: ' + record.status);
  const candidate = JSON.parse(fs.readFileSync(path.join(root, '.agywork/content-campaign', campaignId, 'lean', skillId, 'candidate.json'), 'utf8'));
  if (hashValue({ content: candidate.content, quiz: candidate.quiz }) !== record.candidateHash) throw new Error('Candidate changed since review');
  if ((record.calls || []).some(call => /(?:^|-)author$/.test(call.name) && call.code != null && call.code !== 0)) throw new Error('Candidate includes a failed author worker call; rerun with --redo');
  if ((candidate.removed || []).length && !record.fullReview?.originalRemovalsSupplied) throw new Error('Original removed items were not supplied to the reviewer; rerun with --redo');
  const exceptionPolicy = record.sourceException ? approvedSourceException(root, skillId) : null;
  if (record.sourceException && (!exceptionPolicy || record.sourceException.path !== exceptionPolicy.syllabusPath || record.sourceException.hash !== hashValue(fs.readFileSync(path.join(root, record.sourceException.path), 'utf8')) || record.fullReview?.sourceExceptionConfirmed !== true)) throw new Error('Source exception is not independently confirmed against the current syllabus');
  const saved = await publishSkill(root, skillId, { expected: record.baseline, candidateContent: candidate.content, candidateQuiz: candidate.quiz });
  Object.assign(record, { status: 'published', finishedAt: new Date().toISOString(), published: { expected: saved.expected, journalPath: saved.journalPath ? path.relative(root, saved.journalPath) : null } });
  writeFileResilient(file, JSON.stringify(record, null, 2) + NL);
  return record;
}

export function remainingSkillIds(root, campaignId = DEFAULT_CAMPAIGN) {
  const base = path.join(root, 'booklets/provenance/content-campaign', campaignId);
  const campaign = readJson(path.join(base, 'campaign.json'));
  if (!Array.isArray(campaign?.skillIds)) throw new Error('Campaign membership is missing');
  return campaign.skillIds.filter(id => {
    const record = readJson(path.join(base, 'lean', id + '.json'));
    return id !== 'survey-bias-ethics' && (!record || record.status === 'running');
  });
}

export function leanStatus(root, campaignId = DEFAULT_CAMPAIGN) {
  const dir = path.join(root, 'booklets/provenance/content-campaign', campaignId, 'lean'), counts = {}, attention = [];
  for (const name of fs.existsSync(dir) ? fs.readdirSync(dir).filter(file => file.endsWith('.json')) : []) {
    const record = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')), key = record.status.split(':')[0];
    counts[key] = (counts[key] || 0) + 1; if (!/^(published|accepted)/.test(record.status)) attention.push(record.skillId + ' — ' + record.status);
  }
  return { campaignId, counts, attention };
}

/** One blind audit per model and frozen historical skill; no repairs, publications or campaign-record writes. */
export async function runAuditPilot(root, { manifestFile, campaignId = DEFAULT_CAMPAIGN, model = runModel, concurrency = 3 }) {
  const manifest = readJson(manifestFile);
  if (!Array.isArray(manifest?.skills) || manifest.skills.length !== 6 || new Set(manifest.skills.map(row => row.skillId)).size !== 6) throw new Error('Pilot requires six distinct skills');
  const arms = [{ modelId: 'gpt-6-luna', effort: 'max' }, { modelId: 'gpt-6.1-sol', effort: 'low' }];
  const packets = manifest.skills.map(row => {
    const content = readJson(path.join(root, row.beforeDirectory, 'content.before.json')), quiz = readJson(path.join(root, row.beforeDirectory, 'quiz.before.json'));
    if (content?.skillId !== row.skillId || quiz?.skillId !== row.skillId) throw new Error('Missing historical pair: ' + row.skillId);
    const evidence = skillEvidence(root, campaignId, row.skillId, row.section || null);
    if (!evidence.files.length || evidence.bytes > BOOKLET_BYTE_LIMIT || evidence.omittedImages) throw new Error('Pilot needs complete bounded evidence: ' + row.skillId);
    const pair = { content, quiz, items: [], removed: [] };
    const prompt = auditPrompt(row.skillId, pair, evidenceText(root, evidence, null), pair);
    return { skillId: row.skillId, pair, prompt, images: evidence.images.map(image => image.file), pairHash: pairHash(pair), promptHash: hashValue(prompt) };
  });
  const pilotRoot = path.join(root, '.agywork/content-campaign', campaignId, 'pilots'); fs.mkdirSync(pilotRoot, { recursive: true });
  const dir = fs.mkdtempSync(path.join(pilotRoot, 'luna-max-sol-low-'));
  const report = { profile: 'six-skill-blind-audit-pilot-v1', startedAt: new Date().toISOString(), arms, samples: manifest.skills, results: [] };
  const file = path.join(dir, 'results.json'), save = () => fs.writeFileSync(file, JSON.stringify(report, null, 2) + NL);
  save();
  const queue = packets.flatMap(packet => arms.map(arm => ({ packet, arm })));
  await Promise.all(Array.from({ length: Math.min(3, Math.max(1, concurrency)) }, async () => {
    while (queue.length) {
      const { packet, arm } = queue.shift();
      const outcome = await model({ root, dir, name: packet.skillId + '-' + arm.modelId + '-' + arm.effort, prompt: packet.prompt, images: packet.images, ...arm });
      const review = outcome.result;
      const problems = review?.blocker ? ['Source blocker: ' + review.blocker] : review ? checkReview(packet.pair, review) : ['No audit result'];
      const incomplete = problems.filter(problem => /^Review missing/.test(problem));
      const row = { skillId: packet.skillId, ...arm, pairHash: packet.pairHash, promptHash: packet.promptHash, call: outcome.call, status: !review ? 'failed' : review.blocker ? 'blocked' : incomplete.length ? 'incomplete' : 'complete', findings: problems, review };
      report.results.push(row); save();
      console.log(JSON.stringify({ skillId: row.skillId, model: arm.modelId, effort: arm.effort, status: row.status, seconds: row.call.seconds }));
    }
  }));
  report.finishedAt = new Date().toISOString(); save();
  return { path: path.relative(root, file), report };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2), command = argv.shift(), value = (flag, fallback = null) => { const index = argv.indexOf(flag); return index < 0 ? fallback : argv[index + 1]; };
  const root = path.resolve(value('--root', path.join(path.dirname(fileURLToPath(import.meta.url)), '../..'))), campaignId = value('--campaign', DEFAULT_CAMPAIGN);
  if (command === 'status') console.log(JSON.stringify(leanStatus(root, campaignId), null, 2));
  else if (command === 'publish') {
    // --diagram-checked releases candidates held for a diagram check after someone has looked at the rendered diagram.
    for (const skillId of (value('--ids') || '').split(',').filter(Boolean)) {
      try { const record = await publishAccepted(root, { campaignId, skillId, allowDiagram: argv.includes('--diagram-checked') }); console.log(JSON.stringify({ skillId, status: record.status, journal: record.published.journalPath })); }
      catch (error) { console.log(JSON.stringify({ skillId, status: 'failed: ' + String(error.message).slice(0, 300) })); }
    }
  } else if (command === 'run') {
    const pilotManifest = value('--pilot-manifest');
    if (pilotManifest) {
      if (argv.includes('--publish') || argv.includes('--ids')) throw new Error('A pilot cannot publish or run campaign ids');
      const result = await runAuditPilot(root, { campaignId, manifestFile: path.resolve(root, pilotManifest), concurrency: Number(value('--concurrency', 3)) });
      console.log(JSON.stringify({ pilot: result.path, calls: result.report.results.length }));
      process.exit(0);
    }
    const remaining = argv.includes('--remaining');
    if (remaining && (value('--ids') || argv.some(flag => ['--redo', '--resume', '--repair', '--source-exception', '--section'].includes(flag)))) throw new Error('--remaining selects only unstarted/interrupted skills; do not combine it with explicit ids or retry/source overrides');
    const ids = remaining ? remainingSkillIds(root, campaignId) : (value('--ids') || '').split(',').filter(Boolean), publish = argv.includes('--publish'), redo = argv.includes('--redo'), resume = argv.includes('--resume'), repair = argv.includes('--repair'), finding = value('--finding'), sourceException = argv.includes('--source-exception');
    if (remaining && !ids.length) { console.log(JSON.stringify({ status: 'No unstarted skills remain', ...leanStatus(root, campaignId) })); process.exit(0); }
    const sectionArgument = value('--section'), sectionMatch = sectionArgument?.match(/^(.*):(\d+)-(\d+)$/);
    if (!ids.length || [redo, resume, repair].filter(Boolean).length > 1 || (sectionArgument && (!sectionMatch || ids.length !== 1)) || (finding && !repair)) { console.error('Usage: lean-route.mjs run (--ids a,b,c | --remaining) [--publish] [--redo | --resume | --repair [--finding "diagnosed issue"]] [--concurrency 3] [--section "booklet path:start-end" with one id]'); process.exit(1); }
    const concurrency = Number(value('--concurrency', 3));
    const workerLimit = argv.includes('--task-worker-limit-10') ? 10 : 3;
    if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > workerLimit) throw new Error(`Campaign concurrency must be an integer from 1 to ${workerLimit}`);
    const section = sectionMatch ? { path: sectionMatch[1], start: Number(sectionMatch[2]), end: Number(sectionMatch[3]) } : null;
    // --resume repairs the retained candidate of a record needing attention, once; --redo starts again from the author. An interrupted record (still "running") is run again.
    const queue = ids.filter(skillId => redo || resume || repair || (readJson(path.join(root, 'booklets/provenance/content-campaign', campaignId, 'lean', skillId + '.json'))?.status ?? 'running') === 'running');
    // The explicit task override permits ten workers; the default remains three.
    // Publication itself is serialized by the publication lock.
    const dispatchStarted = Date.now();
    if (remaining) console.log(JSON.stringify({ campaignId, queued: queue.length, concurrency, model: MODEL, effort: EFFORT, startedAt: new Date(dispatchStarted).toISOString() }));
    await Promise.all(Array.from({ length: concurrency }, async () => {
      while (queue.length) {
        const skillId = queue.shift();
        try { const record = await runSkill(root, { campaignId, skillId, publish, section, resume, repair, redo, finding, sourceException }); console.log(JSON.stringify({ skillId, status: record.status, changed: record.changed?.length ?? null, removed: record.removed?.length ?? null, seconds: Math.round(record.calls.reduce((total, call) => total + call.seconds, 0)), calls: record.calls.length })); }
        catch (error) { console.log(JSON.stringify({ skillId, status: 'failed: ' + String(error.message).slice(0, 300) })); }
      }
    }));
    if (remaining) console.log(JSON.stringify({ elapsedSeconds: Math.round((Date.now() - dispatchStarted) / 1000), ...leanStatus(root, campaignId) }));
  } else { console.error('Commands: run, publish, status'); process.exit(1); }
}
