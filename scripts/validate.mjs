#!/usr/bin/env node
// Validates the MathsMap taxonomy in /data: referential integrity, acyclic
// prerequisite graph, stage-monotonic prereqs, and orphan reporting.
// Also validates per-skill teaching content (public/content/*.json) and
// quizzes (public/quizzes/*.json) against docs/content-schema.md.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateProcedureLabels, PRACTICE_CARD_KEYS, QUIZ_QUESTION_KEYS, unknownKeys, isStructureSlug } from '../src/lib/inline-content.js';
import { rejectStrayPositionals } from './lib/argv.mjs';
import { lintMathString, validateInlineText, validateTikz } from './lib/lint-math.mjs';
import { voiceBreaches } from './lib/theory-voice.mjs';
import { allNodes, containsForbiddenMarks, containsSourceMetadata, invalidFractionSpans, validateQuestion } from '../src/lib/practice-question-model.js';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(rootDir, 'data');
const contentDir = join(rootDir, 'public', 'content');
const quizzesDir = join(rootDir, 'public', 'quizzes');
const practiceBankDir = join(rootDir, 'booklets', 'question-bank');
const MAX_QUIZ_QUESTIONS = 20;
// Backfill complete (see docs/content-generation.md): every practice card in
// public/content carries a structure slug, so a missing one is now an error.
const PRACTICE_STRUCTURE_REQUIRED = true;
const load = (f) => JSON.parse(readFileSync(join(dataDir, f), 'utf8'));

const courses = load('courses.json');
const topics = load('topics.json');
const dotpoints = load('dotpoints.json');
const skills = load('skills.json');

const errors = [];
const warnings = [];

const courseIds = new Set(courses.map((c) => c.id));
const topicIds = new Set(topics.map((t) => t.id));
const dotpointIds = new Set(dotpoints.map((d) => d.id));
const skillById = new Map(skills.map((s) => [s.id, s]));

// Duplicate ids
const seen = new Set();
for (const s of skills) {
  if (seen.has(s.id)) errors.push(`Duplicate skill id: ${s.id}`);
  seen.add(s.id);
}

// Referential integrity
for (const t of topics) {
  for (const c of t.courses || []) if (!courseIds.has(c)) errors.push(`topic ${t.id} → unknown course ${c}`);
}
for (const d of dotpoints) {
  if (!topicIds.has(d.topicId)) errors.push(`dotpoint ${d.id} → unknown topic ${d.topicId}`);
}
for (const s of skills) {
  for (const c of s.courses || []) if (!courseIds.has(c)) errors.push(`skill ${s.id} → unknown course ${c}`);
  for (const dp of s.dotPointIds || []) if (!dotpointIds.has(dp)) errors.push(`skill ${s.id} → unknown dotpoint ${dp}`);
  for (const p of s.prereqs || []) {
    if (!skillById.has(p)) errors.push(`skill ${s.id} → unknown prereq ${p}`);
  }
  if (!s.dotPointIds || s.dotPointIds.length === 0) warnings.push(`skill ${s.id} has no dot point`);
}

// Stage monotonicity: a prereq must be same-or-earlier stage
for (const s of skills) {
  for (const p of s.prereqs || []) {
    const pre = skillById.get(p);
    if (pre && pre.stage > s.stage) {
      errors.push(`stage violation: ${s.id} (stage ${s.stage}) requires ${p} (stage ${pre.stage})`);
    }
  }
}

// Cycle detection (DFS over prereq edges)
const WHITE = 0, GREY = 1, BLACK = 2;
const colour = new Map(skills.map((s) => [s.id, WHITE]));
const stack = [];
function visit(id) {
  colour.set(id, GREY);
  stack.push(id);
  for (const p of skillById.get(id)?.prereqs || []) {
    if (!skillById.has(p)) continue;
    if (colour.get(p) === GREY) {
      const cycle = stack.slice(stack.indexOf(p)).concat(p).join(' → ');
      errors.push(`cycle: ${cycle}`);
    } else if (colour.get(p) === WHITE) {
      visit(p);
    }
  }
  stack.pop();
  colour.set(id, BLACK);
}
for (const s of skills) if (colour.get(s.id) === WHITE) visit(s.id);

// Orphan reporting
const usedDotpoints = new Set(skills.flatMap((s) => s.dotPointIds || []));
for (const d of dotpoints) if (!usedDotpoints.has(d.id)) warnings.push(`dotpoint ${d.id} has no skill`);

// ---------------------------------------------------------------------------
// Content & quiz validation (docs/content-schema.md is the source of truth)
// ---------------------------------------------------------------------------

function validateProcedure(solutionText, theory, where, problems) {
  const steps = Array.isArray(theory?.steps) ? theory.steps : [];
  for (const error of validateProcedureLabels(solutionText, steps)) problems.push(`${where}: ${error}`);
}

// Practice cards are { question_text, structure?, solution_text }. `structure`
// is the same per-skill archetype slug vocabulary as the quiz file.
function validateCard(card, theory, where, problems, warnings) {
  if (!card || typeof card !== 'object' || Array.isArray(card)) {
    problems.push(`${where}: card must be an object`);
    return;
  }
  for (const key of unknownKeys(card, PRACTICE_CARD_KEYS)) problems.push(`${where}: unknown card key "${key}"`);
  validateInlineText(card.question_text, `${where}.question_text`, problems);
  validateInlineText(card.solution_text, `${where}.solution_text`, problems);
  if (typeof card.solution_text === 'string') validateProcedure(card.solution_text, theory, `${where}.solution_text`, problems);
  if (card.structure === undefined) {
    const msg = `${where}: structure is missing (archetype slug, shared vocabulary with the quiz file)`;
    if (PRACTICE_STRUCTURE_REQUIRED) problems.push(msg);
    else warnings.push(msg);
  } else if (!isStructureSlug(card.structure)) {
    problems.push(`${where}: structure "${card.structure}" must be a kebab-case slug`);
  }
}

function validateContent(filterFn) {
  const errs = [];
  const warns = [];
  const masteryTierSkills = new Set(); // skills whose practice carries a mastery tier
  const practiceStructures = new Map(); // skillId -> { structures: Set<string>, hasCoverageNote }
  let files = [];
  try {
    files = readdirSync(contentDir).filter((f) => f.endsWith('.json'));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  let checked = 0;
  for (const filename of files) {
    const skillId = filename.slice(0, -'.json'.length);
    if (filterFn && !filterFn(skillId)) continue;
    checked++;
    const tag = `content ${skillId}`;
    let data;
    try {
      data = JSON.parse(readFileSync(join(contentDir, filename), 'utf8'));
    } catch (e) {
      errs.push(`${tag}: invalid JSON — ${e.message}`);
      continue;
    }
    if (data.skillId !== skillId) {
      errs.push(`${tag}: skillId "${data.skillId}" does not match filename`);
    }
    if (!skillById.has(data.skillId)) {
      errs.push(`${tag}: skillId does not exist in skills.json`);
    }

    // Top-level keys: skillId, atomType, theory, practice; iDo/weDo reserved (warn only).
    const allowedTop = new Set(['skillId', 'atomType', 'theory', 'practice']);
    const reservedTop = new Set(['iDo', 'weDo']);
    for (const key of Object.keys(data)) {
      if (reservedTop.has(key)) {
        warns.push(`${tag}: reserved key "${key}" present (not yet specified by schema)`);
      } else if (!allowedTop.has(key)) {
        errs.push(`${tag}: unknown top-level key "${key}"`);
      }
    }
    if (typeof data.atomType !== 'string' || !data.atomType) {
      errs.push(`${tag}: atomType is required and must be a non-empty string`);
    }

    // theory
    const theory = data.theory;
    if (!theory || typeof theory !== 'object' || Array.isArray(theory)) {
      errs.push(`${tag}: theory is required and must be an object`);
    } else {
      const allowedTheory = new Set(['intro', 'facts', 'steps']);
      for (const key of Object.keys(theory)) {
        if (!allowedTheory.has(key)) errs.push(`${tag}: unknown theory key "${key}"`);
      }
      // Theory fields carry the shared rich-text format, inline [tikz] figures
      // included, so they get the same treatment as a card's text fields:
      // balanced-tag check, validateTikz per block, prose linted as prose.
      validateInlineText(theory.intro, `${tag} theory.intro`, errs);
      if (!Array.isArray(theory.facts)) {
        errs.push(`${tag}: theory.facts is required and must be an array`);
      } else {
        theory.facts.forEach((f, i) => validateInlineText(f, `${tag} theory.facts[${i}]`, errs));
      }
      if (theory.steps !== undefined) {
        if (!Array.isArray(theory.steps)) {
          errs.push(`${tag}: theory.steps must be an array`);
        } else {
          theory.steps.forEach((s, i) => validateInlineText(s, `${tag} theory.steps[${i}]`, errs));
        }
      }
      // Theory voice: a definition a student can hold in working memory. WARN, not error —
      // most of the corpus predates the budget and is being rewritten batch by batch
      // (scripts/agy/build-theory-tasks.mjs), where the same numbers hard-fail.
      for (const breach of voiceBreaches(theory)) warns.push(`${tag} theory: ${breach}`);
    }

    // practice (optional)
    if (data.practice !== undefined) {
      const practice = data.practice;
      if (!practice || typeof practice !== 'object' || Array.isArray(practice)) {
        errs.push(`${tag}: practice must be an object`);
      } else {
        const allowedTiers = new Set(['foundation', 'development', 'mastery', 'masteryOmitted', 'coverageNote']);
        for (const key of Object.keys(practice)) {
          if (!allowedTiers.has(key)) errs.push(`${tag}: unknown practice key "${key}"`);
        }
        // An intentionally-narrow atom that ceilings out below the tier target
        // records a one-line coverageNote to suppress its below-target warns
        // (same pattern as masteryOmitted; targets are 6–8/6–8/3–4, not errors).
        if (practice.coverageNote !== undefined && (typeof practice.coverageNote !== 'string' || practice.coverageNote.trim() === '')) {
          errs.push(`${tag}: practice.coverageNote must be a non-empty string when present`);
        }
        const hasCoverageNote = typeof practice.coverageNote === 'string' && practice.coverageNote.trim() !== '';
        const structureSet = new Set();
        const collectStructure = (card) => {
          if (card && typeof card.structure === 'string' && isStructureSlug(card.structure)) structureSet.add(card.structure);
        };
        for (const tierName of ['foundation', 'development']) {
          if (!Array.isArray(practice[tierName])) {
            errs.push(`${tag}: practice.${tierName} is required and must be an array when practice is present`);
          } else {
            const n = practice[tierName].length;
            if (n < 3) errs.push(`${tag}: practice.${tierName} has ${n} card(s); minimum 3`);
            else if (n < 6 && !hasCoverageNote) warns.push(`${tag}: practice.${tierName} has ${n} card(s); below the 6-card warn floor (ceiling is 10–12; add a coverageNote if the atom is genuinely narrow)`);
            practice[tierName].forEach((card, i) => {
              validateCard(card, theory, `${tag} practice.${tierName}[${i}]`, errs, warns);
              collectStructure(card);
            });
          }
        }
        if (practice.mastery !== undefined) {
          masteryTierSkills.add(skillId);
          if (!Array.isArray(practice.mastery)) {
            errs.push(`${tag}: practice.mastery must be an array`);
          } else {
            if (practice.mastery.length < 2) {
              errs.push(`${tag}: practice.mastery has ${practice.mastery.length} card(s); minimum 2`);
            } else if (practice.mastery.length < 3 && !hasCoverageNote) {
              warns.push(`${tag}: practice.mastery has ${practice.mastery.length} card(s); target is 3–4`);
            }
            practice.mastery.forEach((card, i) => {
              validateCard(card, theory, `${tag} practice.mastery[${i}]`, errs, warns);
              collectStructure(card);
            });
          }
          if (practice.masteryOmitted !== undefined) {
            errs.push(`${tag}: practice.masteryOmitted present but practice.mastery is also present (mutually exclusive)`);
          }
        } else if (typeof practice.masteryOmitted !== 'string' || practice.masteryOmitted.trim() === '') {
          errs.push(`${tag}: practice.masteryOmitted (non-empty string) is required when practice.mastery is absent`);
        }
        practiceStructures.set(skillId, { structures: structureSet, hasCoverageNote });
      }
    }
  }
  return { checked, errors: errs, warnings: warns, masteryTierSkills, practiceStructures };
}

function validateQuizzes(filterFn) {
  const errs = [];
  const warns = [];
  const masteryTagged = new Map(); // skillId → count of mastery:true questions
  const quizStructures = new Map(); // skillId -> { structures: Set<string>, hasCoverageNote }
  let files = [];
  try {
    files = readdirSync(quizzesDir).filter((f) => f.endsWith('.json'));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  let checked = 0;
  for (const filename of files) {
    const skillId = filename.slice(0, -'.json'.length);
    if (filterFn && !filterFn(skillId)) continue;
    checked++;
    const tag = `quiz ${skillId}`;
    let data;
    let theory = null;
    try {
      data = JSON.parse(readFileSync(join(quizzesDir, filename), 'utf8'));
    } catch (e) {
      errs.push(`${tag}: invalid JSON — ${e.message}`);
      continue;
    }
    try {
      const contentPath = join(contentDir, filename);
      if (existsSync(contentPath)) theory = JSON.parse(readFileSync(contentPath, 'utf8')).theory;
    } catch (e) {
      errs.push(`${tag}: matching content file is invalid - ${e.message}`);
    }
    if (data.skillId !== skillId) {
      errs.push(`${tag}: skillId "${data.skillId}" does not match filename`);
    }
    if (!skillById.has(data.skillId)) {
      errs.push(`${tag}: skillId does not exist in skills.json`);
    }
    if (!existsSync(join(contentDir, `${skillId}.json`))) {
      errs.push(`${tag}: quiz exists without a matching content file`);
    }

    if (!Array.isArray(data.questions)) {
      errs.push(`${tag}: questions is required and must be an array`);
      continue;
    }
    // A narrow atom suppresses its below-target quiz warn with a top-level
    // coverageNote (mirrors the practice.coverageNote content-side escape hatch).
    const hasCoverageNote = typeof data.coverageNote === 'string' && data.coverageNote.trim() !== '';
    const quizStructureSet = new Set();
    if (data.questions.length < 3) {
      errs.push(`${tag}: questions has ${data.questions.length} item(s); minimum 3`);
    } else if (data.questions.length < 6 && !hasCoverageNote) {
      warns.push(`${tag}: questions has ${data.questions.length} item(s); below the 6-item warn floor (ceiling is 8–10, and may run past it when the skill has more structural types — add a coverageNote if the atom is genuinely narrow)`);
    }
    if (data.questions.length > MAX_QUIZ_QUESTIONS) {
      errs.push(`${tag}: questions has ${data.questions.length} item(s); maximum ${MAX_QUIZ_QUESTIONS}`);
    }

    const seenIds = new Set();
    masteryTagged.set(skillId, data.questions.filter((q) => q && q.mastery === true).length);
    data.questions.forEach((q, i) => {
      const qtag = `${tag} questions[${i}]`;
      if (!q || typeof q !== 'object' || Array.isArray(q)) {
        errs.push(`${qtag}: must be an object`);
        return;
      }
      for (const key of unknownKeys(q, QUIZ_QUESTION_KEYS)) errs.push(`${qtag}: unknown question key "${key}"`);
      if (typeof q.id !== 'string' || !q.id) {
        errs.push(`${qtag}: id is required and must be a non-empty string`);
      } else {
        if (seenIds.has(q.id)) errs.push(`${qtag}: duplicate id "${q.id}"`);
        seenIds.add(q.id);
      }
      validateInlineText(q.question_text, `${qtag}.question_text`, errs);
      if (typeof q.structure !== 'string' || !q.structure.trim()) {
        errs.push(`${qtag}: structure is required and must be a non-empty string`);
      } else if (!isStructureSlug(q.structure)) {
        errs.push(`${qtag}: structure "${q.structure}" must be a kebab-case slug`);
      } else {
        quizStructureSet.add(q.structure);
      }
      if (typeof q.mastery !== 'boolean') {
        errs.push(`${qtag}: mastery is required and must be a boolean`);
      }
      if (!Array.isArray(q.options)) {
        errs.push(`${qtag}: options is required and must be an array`);
      } else {
        const n = q.options.length;
        if (n < 3 || n > 5) errs.push(`${qtag}: options has ${n} item(s); must be 3-5`);
        let correctCount = 0;
        q.options.forEach((opt, oi) => {
          const otag = `${qtag}.options[${oi}]`;
          if (!opt || typeof opt !== 'object' || Array.isArray(opt)) {
            errs.push(`${otag}: must be an object`);
            return;
          }
          if (typeof opt.text !== 'string' || !opt.text) {
            errs.push(`${otag}: text is required and must be a non-empty string`);
          } else {
            lintMathString(opt.text, `${otag}.text`, errs);
          }
          if (opt.correct === true) {
            correctCount++;
            if (opt.why !== undefined) errs.push(`${otag}: correct option must not have "why"`);
          } else {
            if (typeof opt.why !== 'string' || opt.why.trim().length < 15) {
              errs.push(`${otag}: why is required and must be at least 15 characters, naming a specific misconception`);
            } else {
              lintMathString(opt.why, `${otag}.why`, errs);
            }
          }
        });
        if (correctCount !== 1) {
          errs.push(`${qtag}: options must have exactly one correct:true (found ${correctCount})`);
        }
      }
      validateInlineText(q.solution_text, `${qtag}.solution_text`, errs);
      if (typeof q.solution_text === 'string') validateProcedure(q.solution_text, theory, `${qtag}.solution_text`, errs);
    });
    quizStructures.set(skillId, { structures: quizStructureSet, hasCoverageNote });
  }
  return { checked, errors: errs, warnings: warns, masteryTagged, quizStructures };
}

// Cross-file check: practice.structure and quiz.structure are drawn from the
// same per-skill vocabulary (docs/content-generation.md, "quiz mirrors each
// practice structural TYPE"). Warns — not errors — when a structure present on
// one side has no counterpart on the other; a coverageNote on either side
// (the same narrow-atom escape hatch used for below-target card/question
// counts) suppresses both directions for that skill.
function checkStructureParity(contentResult, quizResult) {
  const warns = [];
  const skillIds = new Set([...contentResult.practiceStructures.keys(), ...quizResult.quizStructures.keys()]);
  for (const skillId of skillIds) {
    const practice = contentResult.practiceStructures.get(skillId);
    const quiz = quizResult.quizStructures.get(skillId);
    if (!practice || !quiz) continue; // no quiz file, or no practice tiers — parity doesn't apply
    if (practice.hasCoverageNote || quiz.hasCoverageNote) continue;
    for (const structure of practice.structures) {
      if (!quiz.structures.has(structure)) {
        warns.push(`parity ${skillId}: practice structure "${structure}" has no quiz question of that structure`);
      }
    }
    for (const structure of quiz.structures) {
      if (!practice.structures.has(structure)) {
        warns.push(`parity ${skillId}: quiz structure "${structure}" has no practice card of that structure`);
      }
    }
  }
  return warns;
}

// Cross-file check: a content file carrying a mastery practice tier must have a
// quiz with at least one mastery:true question (quiz→mastered is unreachable
// otherwise). Runs on the filtered set only.
function crossCheckMastery(contentResult, quizResult) {
  const errs = [];
  for (const skillId of contentResult.masteryTierSkills) {
    const tagged = quizResult.masteryTagged.get(skillId);
    if (tagged === undefined) {
      errs.push(`cross-check ${skillId}: content has a mastery tier but no quiz file exists`);
    } else if (tagged === 0) {
      errs.push(`cross-check ${skillId}: content has a mastery tier but quiz has no mastery:true question`);
    }
  }
  return errs;
}

function validatePracticeBank() {
  const errs = [];
  const files = existsSync(practiceBankDir) ? readdirSync(practiceBankDir).filter((file) => /^(?:q-|pq-).*\.json$/.test(file)) : [];
  const skillIds = new Set(skills.map((skill) => skill.id));
  for (const filename of files) {
    const where = 'practice bank ' + filename;
    let question;
    try { question = JSON.parse(readFileSync(join(practiceBankDir, filename), 'utf8')); }
    catch (error) { errs.push(where + ': invalid JSON - ' + error.message); continue; }
    const checked = validateQuestion(question, { skillIds });
    for (const error of checked.errors) errs.push(where + ': ' + error);
    if (containsForbiddenMarks(question)) errs.push(where + ': forbidden mark field');
    if (containsSourceMetadata(question)) errs.push(where + ': source metadata is not allowed in the canonical question bank');
    for (const node of allNodes(question.content)) {
      for (const value of [node.prompt, node.answer?.short, node.answer?.worked]) {
        if (invalidFractionSpans(value).length) errs.push(where + ': slash-style fraction in ' + node.id);
      }
    }
  }
  const manifestPath = join(practiceBankDir, 'manifest.json');
  if (existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      if (manifest.format !== 'mathsmap-practice-bank-v3' || manifest.version !== 3) errs.push('practice bank manifest: expected v3');
      if (JSON.stringify(manifest).includes('"marks"')) errs.push('practice bank manifest: forbidden mark field');
      if (manifest.questions?.length !== files.length) errs.push('practice bank manifest: question count does not match bank');
    } catch (error) { errs.push('practice bank manifest: invalid JSON - ' + error.message); }
  } else if (files.length) errs.push('practice bank manifest: missing manifest.json');
  return { checked: files.length, errors: errs };
}

// --only id1,id2,... | prefix — restricts content+quiz checks to matching skill ids.
// Taxonomy checks above always run in full.
function parseOnlyArg(argv) {
  const idx = argv.indexOf('--only');
  if (idx === -1 || idx === argv.length - 1) return null;
  const raw = argv[idx + 1];
  if (raw.includes(',')) {
    const ids = new Set(raw.split(',').map((s) => s.trim()).filter(Boolean));
    return (id) => ids.has(id);
  }
  const prefix = raw.trim();
  return (id) => id.startsWith(prefix);
}

const argv = process.argv.slice(2);
rejectStrayPositionals(argv, { valueFlags: ['--only'], boolFlags: [] });
const filterFn = parseOnlyArg(argv);
const contentResult = validateContent(filterFn);
const quizResult = validateQuizzes(filterFn);
const practiceBankResult = validatePracticeBank();
const crossErrors = crossCheckMastery(contentResult, quizResult);
const parityWarnings = checkStructureParity(contentResult, quizResult);

// Report
console.log(`Loaded: ${courses.length} courses, ${topics.length} topics, ${dotpoints.length} dot points, ${skills.length} skills.`);
for (const w of warnings) console.log(`  ⚠ ${w}`);

console.log(`\nContent: checked ${contentResult.checked} file(s) in public/content/${filterFn ? ' (filtered)' : ''}.`);
for (const w of contentResult.warnings) console.log(`  ⚠ ${w}`);

console.log(`\nQuizzes: checked ${quizResult.checked} file(s) in public/quizzes/${filterFn ? ' (filtered)' : ''}.`);
for (const w of quizResult.warnings) console.log(`  ⚠ ${w}`);

if (parityWarnings.length) {
  console.log(`\nStructure parity (practice ↔ quiz):`);
  for (const w of parityWarnings) console.log(`  ⚠ ${w}`);
}

const allErrors = [...errors, ...contentResult.errors, ...quizResult.errors, ...practiceBankResult.errors, ...crossErrors];
const totalWarnings = warnings.length + contentResult.warnings.length + quizResult.warnings.length + parityWarnings.length;
if (allErrors.length) {
  console.error(`\n✗ ${allErrors.length} error(s):`);
  for (const e of allErrors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`\n✓ All checks passed (${totalWarnings} warning(s)).`);
