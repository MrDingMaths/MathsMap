// Validates the booklet bank (booklets/bank/**) and the recipes that compose it
// against docs/booklet-bank-schema.md.
//
//   node scripts/booklet/validate-bank.mjs                       # every bank + recipes
//   node scripts/booklet/validate-bank.mjs --bank s5-trig-c-2
//   node scripts/booklet/validate-bank.mjs --bank s5-trig-c-2 --only sine-rule-sides,mixed-bearings
//   node scripts/booklet/validate-bank.mjs --bank-dir tests/fixtures/booklet/fx-good --no-recipes
//
// Rich-text fields go through the SAME lints as public/content (validateInlineText in
// scripts/lib/lint-math.mjs), so the two banks can never drift on the text format.
// Exit 1 on errors, 2 on CLI misuse.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import {
  BOOKLET_CARD_KEYS, BOOKLET_PART_KEYS, BOOKLET_CELL_KEYS, BOOKLET_FIGURE_KEYS,
  BOOKLET_TIERS, BLOCK_TYPES, unknownKeys, isStructureSlug, splitInlineContent,
} from '../../src/lib/inline-content.js';
import { validateInlineText } from '../lib/lint-math.mjs';
import { rejectStrayPositionals } from '../lib/argv.mjs';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*-[fdmg]\d+$/;
const LABELS = 'abcdefghijklmnopqrstuvwxyz';

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8').replace(/^﻿/, ''));
}

// Messages quote repo-relative paths with forward slashes so they read the same on
// Windows and in CI output.
function relPath(path) {
  return resolve(path).slice(resolve(ROOT).length + 1).split('\\').join('/');
}

function listJson(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
}

// --- shared field checks -----------------------------------------------------

function checkText(value, where, ctx, { required = true } = {}) {
  if (value === undefined || value === null) {
    if (required) ctx.errors.push(`${where}: is required`);
    return;
  }
  validateInlineText(value, where, ctx.errors);
}

function hasTikz(value) {
  return typeof value === 'string' && value.includes('[tikz]');
}

function checkFigure(figure, where, ctx, { bankDir, textWithTikz }) {
  if (figure === undefined || figure === null) return;
  if (typeof figure !== 'object' || Array.isArray(figure)) {
    ctx.errors.push(`${where}: figure must be an object`);
    return;
  }
  for (const key of unknownKeys(figure, BOOKLET_FIGURE_KEYS)) {
    ctx.errors.push(`${where}.figure: unknown key "${key}"`);
  }
  if (typeof figure.png !== 'string' || !figure.png.trim()) {
    ctx.errors.push(`${where}.figure.png: is required and must be a non-empty string`);
  } else if (bankDir && !existsSync(join(bankDir, figure.png))) {
    ctx.errors.push(`${where}.figure.png: "${figure.png}" does not exist in the bank`);
  }
  if (figure.crop !== undefined && figure.crop !== null) {
    const c = figure.crop;
    const sides = ['l', 't', 'r', 'b'];
    if (typeof c !== 'object' || Array.isArray(c) || sides.some((s) => typeof c[s] !== 'number')) {
      ctx.errors.push(`${where}.figure.crop: must be { l, t, r, b } numbers`);
    } else {
      for (const s of sides) {
        if (!(c[s] >= 0 && c[s] < 1)) ctx.errors.push(`${where}.figure.crop.${s}: must be in [0, 1), got ${c[s]}`);
      }
      if (c.l + c.r >= 1) ctx.errors.push(`${where}.figure.crop: l + r must be < 1 (${c.l} + ${c.r})`);
      if (c.t + c.b >= 1) ctx.errors.push(`${where}.figure.crop: t + b must be < 1 (${c.t} + ${c.b})`);
      for (const key of unknownKeys(c, new Set(sides))) {
        ctx.errors.push(`${where}.figure.crop: unknown key "${key}"`);
      }
    }
  }
  if (figure.widthCm !== undefined && figure.widthCm !== null
      && !(typeof figure.widthCm === 'number' && figure.widthCm > 0)) {
    ctx.errors.push(`${where}.figure.widthCm: must be a positive number`);
  }
  // A transcribed TikZ figure supersedes the PNG fallback: keeping both means the
  // renderer silently ignores one of them, so flag it as debt to clear.
  if (textWithTikz) {
    ctx.warnings.push(`${where}: has both a [tikz] block and a figure.png — the [tikz] wins; drop "figure" once the transcription is confirmed`);
  }
}

// `figures` holds the ADDITIONAL diagrams a cell shows beyond `figure` — a before/after
// pair, a plan and an elevation. Without a primary `figure` the list is meaningless.
function checkExtraFigures(item, where, ctx, { bankDir }) {
  if (item.figures === undefined || item.figures === null) return;
  if (!Array.isArray(item.figures) || !item.figures.length) {
    ctx.errors.push(`${where}.figures: must be a non-empty array of additional figures`);
    return;
  }
  if (!item.figure) {
    ctx.errors.push(`${where}.figures: has extra figures but no primary "figure"`);
  }
  item.figures.forEach((figure, i) => {
    checkFigure(figure, `${where}.figures[${i}]`, ctx, { bankDir, textWithTikz: false });
  });
}

function checkInt(value, where, ctx, { min, max, label }) {
  if (value === undefined || value === null) return;
  if (!Number.isInteger(value) || value < min || value > max) {
    ctx.errors.push(`${where}: ${label} must be an integer in [${min}, ${max}], got ${JSON.stringify(value)}`);
  }
}

// A part (lettered sub-question) and a drill cell share one shape; only the allowed
// key set and whether `label` is mandatory differ.
function checkSubItem(item, where, ctx, { bankDir, keys, requireLabel, index, requireQuestion = true }) {
  if (typeof item !== 'object' || item === null || Array.isArray(item)) {
    ctx.errors.push(`${where}: must be an object`);
    return;
  }
  for (const key of unknownKeys(item, keys)) ctx.errors.push(`${where}: unknown key "${key}"`);
  if (requireLabel) {
    const expected = LABELS[index];
    if (item.label !== expected) {
      ctx.errors.push(`${where}.label: expected "${expected}" (labels run a, b, c… in order), got ${JSON.stringify(item.label)}`);
    }
  } else if (item.label !== undefined && (typeof item.label !== 'string' || !item.label.trim())) {
    ctx.errors.push(`${where}.label: must be a non-empty string when present`);
  }
  checkText(item.question_text, `${where}.question_text`, ctx, { required: requireQuestion });
  for (const field of ['answer', 'solution_text', 'scaffold']) {
    if (item[field] !== undefined && item[field] !== null) {
      checkText(item[field], `${where}.${field}`, ctx);
    }
  }
  if (item.answer == null && item.solution_text == null) {
    ctx.errors.push(`${where}: needs an "answer" (the printed short answer) or a "solution_text"`);
  }
  checkFigure(item.figure, where, ctx, { bankDir, textWithTikz: hasTikz(item.question_text) && item.figure });
  checkExtraFigures(item, where, ctx, { bankDir });
  checkInt(item.space, `${where}.space`, ctx, { min: 1, max: 20, label: 'space' });
  if (keys.has('marks')) checkInt(item.marks, `${where}.marks`, ctx, { min: 1, max: 20, label: 'marks' });
}

// --- cards -------------------------------------------------------------------

function checkCard(card, where, ctx, { bankDir, sectionSlug, skillIds, seenIds, sourceLineCount }) {
  if (typeof card !== 'object' || card === null || Array.isArray(card)) {
    ctx.errors.push(`${where}: must be an object`);
    return;
  }
  for (const key of unknownKeys(card, BOOKLET_CARD_KEYS)) ctx.errors.push(`${where}: unknown key "${key}"`);

  // id
  if (typeof card.id !== 'string' || !ID_RE.test(card.id)) {
    ctx.errors.push(`${where}.id: must match <section-slug>-<f|d|m|g><n>, got ${JSON.stringify(card.id)}`);
  } else {
    if (seenIds.has(card.id)) ctx.errors.push(`${where}.id: duplicate id "${card.id}" (also in ${seenIds.get(card.id)})`);
    else seenIds.set(card.id, where);
    if (sectionSlug && !card.id.startsWith(`${sectionSlug}-`)) {
      ctx.errors.push(`${where}.id: "${card.id}" is not prefixed by its section slug "${sectionSlug}"`);
    }
  }

  if (!BOOKLET_TIERS.has(card.tier)) {
    ctx.errors.push(`${where}.tier: must be one of ${[...BOOKLET_TIERS].join(', ')}, got ${JSON.stringify(card.tier)}`);
  }

  // skills
  if (!Array.isArray(card.skills) || card.skills.length === 0) {
    ctx.errors.push(`${where}.skills: must be a non-empty array of skill ids`);
  } else {
    for (const id of card.skills) {
      if (!skillIds.has(id)) ctx.errors.push(`${where}.skills: "${id}" is not a skill in data/skills.json`);
    }
    if (!card.skills.includes(card.primarySkill)) {
      ctx.errors.push(`${where}.primarySkill: ${JSON.stringify(card.primarySkill)} must be one of the card's skills`);
    }
  }
  if (typeof card.primarySkill === 'string' && skillIds.has(card.primarySkill)
      && !existsSync(join(ROOT, 'public', 'content', `${card.primarySkill}.json`))) {
    ctx.warnings.push(`${where}.primarySkill: "${card.primarySkill}" has no public/content file, so a recipe cannot pull atoms for it`);
  }

  if (card.structure !== undefined && card.structure !== null && !isStructureSlug(card.structure)) {
    ctx.errors.push(`${where}.structure: must be a kebab-case slug, got ${JSON.stringify(card.structure)}`);
  }

  checkText(card.question_text, `${where}.question_text`, ctx);
  for (const field of ['answer', 'solution_text', 'scaffold']) {
    if (card[field] !== undefined && card[field] !== null) checkText(card[field], `${where}.${field}`, ctx);
  }

  // parts vs answer
  if (card.parts !== undefined && card.parts !== null) {
    if (!Array.isArray(card.parts) || card.parts.length === 0) {
      ctx.errors.push(`${where}.parts: must be a non-empty array when present`);
    } else {
      if (card.answer != null) {
        ctx.errors.push(`${where}.answer: a card with parts carries answers on the parts, not at the top level`);
      }
      card.parts.forEach((part, i) => {
        checkSubItem(part, `${where}.parts[${i}]`, ctx, { bankDir, keys: BOOKLET_PART_KEYS, requireLabel: true, index: i });
      });
    }
  } else if (card.answer == null && card.solution_text == null) {
    ctx.errors.push(`${where}: needs an "answer" (the printed short answer) or a "solution_text"`);
  }

  checkFigure(card.figure, where, ctx, { bankDir, textWithTikz: hasTikz(card.question_text) && card.figure });
  checkExtraFigures(card, where, ctx, { bankDir });
  checkInt(card.columns, `${where}.columns`, ctx, { min: 1, max: 4, label: 'columns' });
  checkInt(card.space, `${where}.space`, ctx, { min: 1, max: 20, label: 'space' });
  checkInt(card.marks, `${where}.marks`, ctx, { min: 1, max: 20, label: 'marks' });
  if (card.calculator !== undefined && typeof card.calculator !== 'boolean') {
    ctx.errors.push(`${where}.calculator: must be a boolean`);
  }
  if (card.tags !== undefined && card.tags !== null) {
    if (!Array.isArray(card.tags)) ctx.errors.push(`${where}.tags: must be an array`);
    else for (const tag of card.tags) {
      if (!isStructureSlug(tag)) ctx.errors.push(`${where}.tags: "${tag}" must be a kebab-case slug`);
    }
  }
  checkSource(card.source, `${where}.source`, ctx);
  checkOrigin(card.origin, `${where}.origin`, ctx, sourceLineCount);
}

function checkSource(source, where, ctx) {
  if (source === undefined || source === null) return;
  if (typeof source !== 'object' || Array.isArray(source)) {
    ctx.errors.push(`${where}: must be an object`);
    return;
  }
  if (source.kind === 'booklet') {
    for (const key of unknownKeys(source, new Set(['kind']))) ctx.errors.push(`${where}: unknown key "${key}" for kind "booklet"`);
  } else if (source.kind === 'hsc') {
    for (const key of unknownKeys(source, new Set(['kind', 'year', 'course', 'band']))) {
      ctx.errors.push(`${where}: unknown key "${key}" for kind "hsc"`);
    }
    if (source.year !== undefined && source.year !== null
        && !(Number.isInteger(source.year) && source.year >= 1990 && source.year <= 2100)) {
      ctx.errors.push(`${where}.year: must be a 4-digit year`);
    }
    if (source.course !== undefined && typeof source.course !== 'string') ctx.errors.push(`${where}.course: must be a string`);
    if (source.band !== undefined && source.band !== null
        && !(Number.isInteger(source.band) && source.band >= 1 && source.band <= 6)) {
      ctx.errors.push(`${where}.band: must be an integer 1-6`);
    }
  } else {
    ctx.errors.push(`${where}.kind: must be "booklet" or "hsc", got ${JSON.stringify(source.kind)}`);
  }
}

function checkOrigin(origin, where, ctx, sourceLineCount) {
  if (typeof origin !== 'object' || origin === null || Array.isArray(origin)) {
    ctx.errors.push(`${where}: is required and must be an object`);
    return;
  }
  for (const key of unknownKeys(origin, new Set(['file', 'section', 'tier', 'q', 'lines']))) {
    ctx.errors.push(`${where}: unknown key "${key}"`);
  }
  if (typeof origin.file !== 'string' || !origin.file) ctx.errors.push(`${where}.file: is required`);
  if (typeof origin.section !== 'string' || !origin.section) ctx.errors.push(`${where}.section: is required`);
  if (!Array.isArray(origin.lines) || origin.lines.length !== 2 || origin.lines.some((n) => !Number.isInteger(n))) {
    ctx.errors.push(`${where}.lines: must be [start, end] integers`);
    return;
  }
  const [start, end] = origin.lines;
  if (start < 1 || end < start) ctx.errors.push(`${where}.lines: [${start}, ${end}] is not an ascending 1-based range`);
  else if (sourceLineCount && end > sourceLineCount) {
    ctx.errors.push(`${where}.lines: end ${end} is past the end of the source file (${sourceLineCount} lines)`);
  }
}

// --- blocks ------------------------------------------------------------------

function checkCells(cells, where, ctx, { bankDir }) {
  if (!Array.isArray(cells) || cells.length === 0) {
    ctx.errors.push(`${where}: must be a non-empty array of cells`);
    return;
  }
  cells.forEach((cell, i) => {
    checkSubItem(cell, `${where}[${i}]`, ctx, { bankDir, keys: BOOKLET_CELL_KEYS, requireLabel: false, index: i });
  });
}

function checkBlock(block, where, ctx, { bankDir, sectionSlug, seenIds, sourceLineCount }) {
  if (typeof block !== 'object' || block === null || Array.isArray(block)) {
    ctx.errors.push(`${where}: must be an object`);
    return;
  }
  const envelope = new Set(['id', 'type', 'title', 'tier', 'columns', 'origin']);
  const payloadKeys = {
    syllabus: ['outcome', 'points'],
    teach: ['body', 'formula', 'figure'],
    review: ['groups'],
    identify: ['prompt', 'exemplars', 'cells'],
    keyIdeas: ['items'],
    write: ['prompt', 'cells'],
    example: ['question_text', 'figure', 'solution_text'],
    guided: ['prompt', 'cells'],
    proof: ['figure', 'steps'],
    markdown: ['body'],
  };
  if (!BLOCK_TYPES.has(block.type)) {
    ctx.errors.push(`${where}.type: must be one of ${[...BLOCK_TYPES].join(', ')}, got ${JSON.stringify(block.type)}`);
    return;
  }
  const allowed = new Set([...envelope, ...payloadKeys[block.type]]);
  for (const key of unknownKeys(block, allowed)) ctx.errors.push(`${where}: unknown key "${key}" for a "${block.type}" block`);

  // The `type` segment is the block type verbatim, so it may be camelCase (`keyIdeas`).
  const idRe = new RegExp(`^${sectionSlug ? `${sectionSlug}-` : '[a-z0-9-]+-'}${block.type}-\\d+$`);
  if (typeof block.id !== 'string' || !idRe.test(block.id)) {
    ctx.errors.push(`${where}.id: must match ${sectionSlug ? sectionSlug : '<section-slug>'}-${block.type}-<n>, got ${JSON.stringify(block.id)}`);
  } else if (seenIds.has(block.id)) {
    ctx.errors.push(`${where}.id: duplicate id "${block.id}" (also in ${seenIds.get(block.id)})`);
  } else {
    seenIds.set(block.id, where);
  }
  if (block.title !== undefined && block.title !== null) checkText(block.title, `${where}.title`, ctx);
  if (block.tier !== undefined && block.tier !== null && !BOOKLET_TIERS.has(block.tier)) {
    ctx.errors.push(`${where}.tier: must be one of ${[...BOOKLET_TIERS].join(', ')} when present`);
  }
  checkInt(block.columns, `${where}.columns`, ctx, { min: 1, max: 4, label: 'columns' });
  checkOrigin(block.origin, `${where}.origin`, ctx, sourceLineCount);

  switch (block.type) {
    case 'syllabus': {
      checkText(block.outcome, `${where}.outcome`, ctx);
      if (!Array.isArray(block.points) || block.points.length === 0) {
        ctx.errors.push(`${where}.points: must be a non-empty array`);
      } else block.points.forEach((p, i) => checkText(p, `${where}.points[${i}]`, ctx));
      break;
    }
    case 'teach': {
      checkText(block.body, `${where}.body`, ctx);
      if (block.formula != null) checkText(block.formula, `${where}.formula`, ctx);
      checkFigure(block.figure, where, ctx, { bankDir, textWithTikz: hasTikz(block.body) && block.figure });
      break;
    }
    case 'review': {
      if (!Array.isArray(block.groups) || block.groups.length === 0) {
        ctx.errors.push(`${where}.groups: must be a non-empty array`);
      } else block.groups.forEach((group, i) => {
        const gw = `${where}.groups[${i}]`;
        if (typeof group !== 'object' || group === null || Array.isArray(group)) {
          ctx.errors.push(`${gw}: must be an object`);
          return;
        }
        for (const key of unknownKeys(group, new Set(['prompt', 'cells', 'columns']))) {
          ctx.errors.push(`${gw}: unknown key "${key}"`);
        }
        checkText(group.prompt, `${gw}.prompt`, ctx);
        checkInt(group.columns, `${gw}.columns`, ctx, { min: 1, max: 4, label: 'columns' });
        checkCells(group.cells, `${gw}.cells`, ctx, { bankDir });
      });
      break;
    }
    case 'identify': {
      checkText(block.prompt, `${where}.prompt`, ctx);
      if (block.exemplars !== undefined && block.exemplars !== null) {
        if (!Array.isArray(block.exemplars)) ctx.errors.push(`${where}.exemplars: must be an array`);
        else block.exemplars.forEach((ex, i) => {
          const ew = `${where}.exemplars[${i}]`;
          if (typeof ex !== 'object' || ex === null || Array.isArray(ex)) {
            ctx.errors.push(`${ew}: must be an object`);
            return;
          }
          for (const key of unknownKeys(ex, new Set(['verdict', 'figure', 'text']))) ctx.errors.push(`${ew}: unknown key "${key}"`);
          if (ex.verdict !== 'yes' && ex.verdict !== 'no') {
            ctx.errors.push(`${ew}.verdict: must be "yes" or "no", got ${JSON.stringify(ex.verdict)}`);
          }
          if (ex.text != null) checkText(ex.text, `${ew}.text`, ctx);
          checkFigure(ex.figure, ew, ctx, { bankDir, textWithTikz: false });
        });
      }
      checkCells(block.cells, `${where}.cells`, ctx, { bankDir });
      break;
    }
    case 'write':
    case 'guided': {
      if (block.prompt != null) checkText(block.prompt, `${where}.prompt`, ctx);
      checkCells(block.cells, `${where}.cells`, ctx, { bankDir });
      break;
    }
    case 'keyIdeas': {
      if (!Array.isArray(block.items) || block.items.length === 0) {
        ctx.errors.push(`${where}.items: must be a non-empty array`);
      } else block.items.forEach((item, i) => {
        const iw = `${where}.items[${i}]`;
        if (typeof item !== 'object' || item === null || Array.isArray(item)) {
          ctx.errors.push(`${iw}: must be an object`);
          return;
        }
        for (const key of unknownKeys(item, new Set(['text']))) ctx.errors.push(`${iw}: unknown key "${key}"`);
        checkText(item.text, `${iw}.text`, ctx);
        if (typeof item.text === 'string') {
          const opens = (item.text.match(/\{\{/g) || []).length;
          const closes = (item.text.match(/\}\}/g) || []).length;
          if (opens !== closes) ctx.errors.push(`${iw}.text: unbalanced {{ }} cloze braces`);
          else if (opens === 0) ctx.warnings.push(`${iw}.text: a Key Ideas item with no {{blank}} is just prose — use a teach block`);
        }
      });
      break;
    }
    case 'example': {
      checkText(block.question_text, `${where}.question_text`, ctx);
      checkText(block.solution_text, `${where}.solution_text`, ctx);
      checkFigure(block.figure, where, ctx, { bankDir, textWithTikz: hasTikz(block.question_text) && block.figure });
      break;
    }
    case 'proof': {
      if (!Array.isArray(block.steps) || block.steps.length === 0) {
        ctx.errors.push(`${where}.steps: must be a non-empty array`);
      } else block.steps.forEach((step, i) => {
        const sw = `${where}.steps[${i}]`;
        if (typeof step !== 'object' || step === null || Array.isArray(step)) {
          ctx.errors.push(`${sw}: must be an object`);
          return;
        }
        for (const key of unknownKeys(step, new Set(['prompt', 'working']))) ctx.errors.push(`${sw}: unknown key "${key}"`);
        if (step.prompt != null && step.prompt !== '') checkText(step.prompt, `${sw}.prompt`, ctx);
        checkText(step.working, `${sw}.working`, ctx);
      });
      checkFigure(block.figure, where, ctx, { bankDir, textWithTikz: false });
      break;
    }
    case 'markdown': {
      checkText(block.body, `${where}.body`, ctx);
      ctx.warnings.push(`${where}: markdown block — content the parser could not classify; give it a real block type`);
      break;
    }
    default:
      break;
  }
}

// --- bank --------------------------------------------------------------------

export function validateBank(bankDir, ctx, { only } = {}) {
  const headerPath = join(bankDir, 'bank.json');
  const headerRel = relPath(headerPath);
  if (!existsSync(headerPath)) {
    ctx.errors.push(`${relPath(bankDir)}: no bank.json`);
    return { cards: 0, blocks: 0 };
  }
  let header;
  try {
    header = readJson(headerPath);
  } catch (e) {
    ctx.errors.push(`${headerRel}: ${e.message}`);
    return { cards: 0, blocks: 0 };
  }
  for (const key of unknownKeys(header, new Set(['bank', 'title', 'course', 'sourceFile', 'sourceDocx', 'sourceMediaDir', 'topicIds', 'dotPointIds', 'sections']))) {
    ctx.errors.push(`${headerRel}: unknown key "${key}"`);
  }
  for (const field of ['bank', 'title', 'course']) {
    if (typeof header[field] !== 'string' || !header[field]) ctx.errors.push(`${headerRel}: "${field}" is required`);
  }
  if (!Array.isArray(header.sections) || header.sections.length === 0) {
    ctx.errors.push(`${headerRel}: "sections" must be a non-empty array (the printed order)`);
    header.sections = [];
  }
  let sourceLineCount = 0;
  if (typeof header.sourceFile === 'string' && header.sourceFile) {
    const abs = join(ROOT, header.sourceFile);
    if (!existsSync(abs)) ctx.errors.push(`${headerRel}: sourceFile "${header.sourceFile}" does not exist`);
    else sourceLineCount = readFileSync(abs, 'utf8').split('\n').length;
  }

  // Section files must line up with the declared order, in both directions.
  const cardFiles = new Set(listJson(join(bankDir, 'cards')).map((f) => f.replace(/\.json$/, '')));
  const blockFiles = new Set(listJson(join(bankDir, 'blocks')).map((f) => f.replace(/\.json$/, '')));
  for (const slug of [...cardFiles, ...blockFiles]) {
    if (!header.sections.includes(slug)) {
      ctx.errors.push(`${headerRel}: section "${slug}" has files but is not listed in "sections"`);
    }
  }
  for (const slug of header.sections) {
    if (!cardFiles.has(slug) && !blockFiles.has(slug)) {
      ctx.warnings.push(`${headerRel}: section "${slug}" is declared but has no cards or blocks file`);
    }
  }

  const skillIds = new Set(readJson(join(ROOT, 'data', 'skills.json')).map((s) => s.id));
  const seenIds = new Map();
  let cardCount = 0;
  let blockCount = 0;

  for (const slug of header.sections) {
    if (only && !only.has(slug)) continue;

    if (cardFiles.has(slug)) {
      const path = join(bankDir, 'cards', `${slug}.json`);
      const rel = `${header.bank}/cards/${slug}.json`;
      try {
        const doc = readJson(path);
        for (const key of unknownKeys(doc, new Set(['bank', 'section', 'cards']))) ctx.errors.push(`${rel}: unknown key "${key}"`);
        if (doc.bank !== header.bank) ctx.errors.push(`${rel}: "bank" is ${JSON.stringify(doc.bank)}, expected "${header.bank}"`);
        if (doc.section !== slug) ctx.errors.push(`${rel}: "section" is ${JSON.stringify(doc.section)}, expected "${slug}"`);
        if (!Array.isArray(doc.cards)) ctx.errors.push(`${rel}: "cards" must be an array`);
        else doc.cards.forEach((card, i) => {
          cardCount++;
          checkCard(card, `${rel} cards[${i}]${card && card.id ? ` (${card.id})` : ''}`, ctx,
            { bankDir, sectionSlug: slug, skillIds, seenIds, sourceLineCount });
        });
      } catch (e) {
        ctx.errors.push(`${rel}: ${e.message}`);
      }
    }

    if (blockFiles.has(slug)) {
      const path = join(bankDir, 'blocks', `${slug}.json`);
      const rel = `${header.bank}/blocks/${slug}.json`;
      try {
        const doc = readJson(path);
        for (const key of unknownKeys(doc, new Set(['bank', 'section', 'blocks']))) ctx.errors.push(`${rel}: unknown key "${key}"`);
        if (doc.bank !== header.bank) ctx.errors.push(`${rel}: "bank" is ${JSON.stringify(doc.bank)}, expected "${header.bank}"`);
        if (doc.section !== slug) ctx.errors.push(`${rel}: "section" is ${JSON.stringify(doc.section)}, expected "${slug}"`);
        if (!Array.isArray(doc.blocks)) ctx.errors.push(`${rel}: "blocks" must be an array`);
        else doc.blocks.forEach((block, i) => {
          blockCount++;
          checkBlock(block, `${rel} blocks[${i}]${block && block.id ? ` (${block.id})` : ''}`, ctx,
            { bankDir, sectionSlug: slug, seenIds, sourceLineCount });
        });
      } catch (e) {
        ctx.errors.push(`${rel}: ${e.message}`);
      }
    }
  }

  return { cards: cardCount, blocks: blockCount, ids: seenIds };
}

// --- recipes -----------------------------------------------------------------

function loadBankIds(bankDir) {
  const ids = { cards: new Map(), blocks: new Set(), sections: new Set() };
  const headerPath = join(bankDir, 'bank.json');
  if (!existsSync(headerPath)) return ids;
  const header = readJson(headerPath);
  for (const slug of header.sections || []) {
    ids.sections.add(slug);
    const cardsPath = join(bankDir, 'cards', `${slug}.json`);
    if (existsSync(cardsPath)) {
      for (const card of readJson(cardsPath).cards || []) if (card && card.id) ids.cards.set(card.id, card);
    }
    const blocksPath = join(bankDir, 'blocks', `${slug}.json`);
    if (existsSync(blocksPath)) {
      for (const block of readJson(blocksPath).blocks || []) if (block && block.id) ids.blocks.add(block.id);
    }
  }
  return ids;
}

export function validateRecipe(recipePath, ctx, { bankRoot }) {
  const rel = recipePath.replace(`${ROOT}\\`, '').replace(`${ROOT}/`, '');
  let recipe;
  try {
    recipe = readJson(recipePath);
  } catch (e) {
    ctx.errors.push(`${rel}: ${e.message}`);
    return;
  }
  for (const key of unknownKeys(recipe, new Set(['slug', 'comment', 'meta', 'banks', 'defaults', 'variants', 'sections']))) {
    ctx.errors.push(`${rel}: unknown key "${key}"`);
  }
  if (typeof recipe.slug !== 'string' || !recipe.slug) ctx.errors.push(`${rel}: "slug" is required`);

  const meta = recipe.meta;
  if (typeof meta !== 'object' || meta === null || Array.isArray(meta)) {
    ctx.errors.push(`${rel}.meta: is required and must be an object`);
  } else {
    for (const key of unknownKeys(meta, new Set(['course', 'title', 'book', 'description', 'version', 'feedbackUrl']))) {
      ctx.errors.push(`${rel}.meta: unknown key "${key}"`);
    }
    for (const field of ['course', 'title', 'description', 'version']) {
      if (typeof meta[field] !== 'string' || !meta[field]) ctx.errors.push(`${rel}.meta.${field}: is required`);
    }
    if (meta.book !== undefined && !Number.isInteger(meta.book)) ctx.errors.push(`${rel}.meta.book: must be an integer`);
  }

  // banks: alias -> bank slug
  const aliases = new Map();
  if (typeof recipe.banks !== 'object' || recipe.banks === null || Array.isArray(recipe.banks)) {
    ctx.errors.push(`${rel}.banks: is required and must be an object of alias -> bank slug`);
  } else {
    for (const [alias, bankSlug] of Object.entries(recipe.banks)) {
      const dir = join(bankRoot, bankSlug);
      if (!existsSync(join(dir, 'bank.json'))) {
        ctx.errors.push(`${rel}.banks.${alias}: bank "${bankSlug}" not found at booklets/bank/${bankSlug}/bank.json`);
      } else {
        aliases.set(alias, loadBankIds(dir));
      }
    }
  }

  const checkOutput = (output, where) => {
    if (output === undefined) return;
    if (typeof output !== 'object' || output === null || Array.isArray(output)) {
      ctx.errors.push(`${where}: must be an object`);
      return;
    }
    for (const key of unknownKeys(output, new Set(['spaces', 'solutions', 'shortAnswers']))) {
      ctx.errors.push(`${where}: unknown key "${key}" (allowed: spaces, solutions, shortAnswers)`);
    }
    for (const [key, value] of Object.entries(output)) {
      if (typeof value !== 'boolean') ctx.errors.push(`${where}.${key}: must be a boolean`);
    }
  };
  const checkTiers = (tiers, where) => {
    if (tiers === undefined) return;
    if (!Array.isArray(tiers) || tiers.length === 0) {
      ctx.errors.push(`${where}: must be a non-empty array of tiers`);
      return;
    }
    for (const tier of tiers) {
      if (!BOOKLET_TIERS.has(tier)) ctx.errors.push(`${where}: "${tier}" is not one of ${[...BOOKLET_TIERS].join(', ')}`);
    }
  };

  if (recipe.defaults !== undefined) {
    for (const key of unknownKeys(recipe.defaults, new Set(['tiers', 'output']))) {
      ctx.errors.push(`${rel}.defaults: unknown key "${key}"`);
    }
    checkTiers(recipe.defaults.tiers, `${rel}.defaults.tiers`);
    checkOutput(recipe.defaults.output, `${rel}.defaults.output`);
  }
  if (recipe.variants !== undefined) {
    if (typeof recipe.variants !== 'object' || recipe.variants === null || Array.isArray(recipe.variants)) {
      ctx.errors.push(`${rel}.variants: must be an object`);
    } else for (const [name, variant] of Object.entries(recipe.variants)) {
      for (const key of unknownKeys(variant, new Set(['tiers', 'output']))) {
        ctx.errors.push(`${rel}.variants.${name}: unknown key "${key}"`);
      }
      checkTiers(variant.tiers, `${rel}.variants.${name}.tiers`);
      checkOutput(variant.output, `${rel}.variants.${name}.output`);
    }
  }

  const resolveRef = (ref, where, kind) => {
    if (typeof ref !== 'string' || !ref.includes('/')) {
      ctx.errors.push(`${where}: ${kind} reference must be "<bankAlias>/<id>", got ${JSON.stringify(ref)}`);
      return;
    }
    const [alias, id] = [ref.slice(0, ref.indexOf('/')), ref.slice(ref.indexOf('/') + 1)];
    const bank = aliases.get(alias);
    if (!bank) {
      ctx.errors.push(`${where}: unknown bank alias "${alias}" in "${ref}"`);
      return;
    }
    const present = kind === 'card' ? bank.cards.has(id) : bank.blocks.has(id);
    if (!present) ctx.errors.push(`${where}: ${kind} "${id}" not found in bank "${alias}"`);
  };

  if (!Array.isArray(recipe.sections) || recipe.sections.length === 0) {
    ctx.errors.push(`${rel}.sections: must be a non-empty array`);
    return;
  }
  recipe.sections.forEach((section, si) => {
    const sw = `${rel}.sections[${si}]`;
    for (const key of unknownKeys(section, new Set(['title', 'slug', 'items']))) ctx.errors.push(`${sw}: unknown key "${key}"`);
    if (typeof section.title !== 'string' || !section.title) ctx.errors.push(`${sw}.title: is required`);
    if (!Array.isArray(section.items) || section.items.length === 0) {
      ctx.errors.push(`${sw}.items: must be a non-empty array`);
      return;
    }
    section.items.forEach((item, ii) => {
      const iw = `${sw}.items[${ii}]`;
      for (const key of unknownKeys(item, new Set(['block', 'cards', 'atoms', 'columns']))) {
        ctx.errors.push(`${iw}: unknown key "${key}"`);
      }
      const kinds = ['block', 'cards', 'atoms'].filter((k) => item[k] !== undefined);
      if (kinds.length !== 1) {
        ctx.errors.push(`${iw}: must be exactly one of {block}, {cards}, {atoms}${kinds.length ? ` — got ${kinds.join(' + ')}` : ''}`);
        return;
      }
      checkInt(item.columns, `${iw}.columns`, ctx, { min: 1, max: 4, label: 'columns' });
      if (item.block !== undefined) {
        resolveRef(item.block, iw, 'block');
      } else if (Array.isArray(item.cards)) {
        item.cards.forEach((ref, ci) => resolveRef(ref, `${iw}.cards[${ci}]`, 'card'));
      } else if (item.cards !== undefined) {
        const sel = item.cards;
        for (const key of unknownKeys(sel, new Set(['bank', 'section', 'tiers', 'tags']))) {
          ctx.errors.push(`${iw}.cards: unknown key "${key}"`);
        }
        const bank = aliases.get(sel.bank);
        if (!bank) ctx.errors.push(`${iw}.cards.bank: unknown bank alias ${JSON.stringify(sel.bank)}`);
        else if (!bank.sections.has(sel.section)) ctx.errors.push(`${iw}.cards.section: "${sel.section}" is not a section of bank "${sel.bank}"`);
        checkTiers(sel.tiers, `${iw}.cards.tiers`);
      } else {
        const atoms = item.atoms;
        for (const key of unknownKeys(atoms, new Set(['skill', 'tiers', 'structures', 'limit', 'exclude']))) {
          ctx.errors.push(`${iw}.atoms: unknown key "${key}"`);
        }
        if (typeof atoms.skill !== 'string' || !atoms.skill) {
          ctx.errors.push(`${iw}.atoms.skill: is required`);
        } else {
          const contentPath = join(ROOT, 'public', 'content', `${atoms.skill}.json`);
          if (!existsSync(contentPath)) {
            ctx.errors.push(`${iw}.atoms.skill: "${atoms.skill}" has no public/content file to pull from`);
          } else if (Array.isArray(atoms.structures)) {
            try {
              const content = readJson(contentPath);
              const vocab = new Set();
              for (const tier of ['foundation', 'development', 'mastery']) {
                for (const card of content.practice?.[tier] || []) if (card.structure) vocab.add(card.structure);
              }
              for (const s of atoms.structures) {
                if (!vocab.has(s)) ctx.warnings.push(`${iw}.atoms.structures: "${s}" is not a practice structure of "${atoms.skill}" — the pull will come back empty`);
              }
            } catch { /* content file problems are validate.mjs's business */ }
          }
        }
        checkTiers(atoms.tiers, `${iw}.atoms.tiers`);
        checkInt(atoms.limit, `${iw}.atoms.limit`, ctx, { min: 1, max: 50, label: 'limit' });
      }
    });
  });
}

// --- CLI ---------------------------------------------------------------------

function arg(argv, name, fallback = null) {
  const i = argv.indexOf(name);
  return i !== -1 && i + 1 < argv.length ? argv[i + 1] : fallback;
}

function main() {
  const argv = process.argv.slice(2);
  rejectStrayPositionals(argv, {
    valueFlags: ['--bank', '--bank-dir', '--bank-root', '--only', '--recipes-dir'],
    boolFlags: ['--recipes', '--no-recipes'],
  });
  const onlyRaw = arg(argv, '--only');
  const only = onlyRaw ? new Set(onlyRaw.split(',').map((s) => s.trim()).filter(Boolean)) : null;
  const bankRoot = resolve(ROOT, arg(argv, '--bank-root', join('booklets', 'bank')));
  const bankDirArg = arg(argv, '--bank-dir');
  const bankSlug = arg(argv, '--bank');

  let bankDirs = [];
  if (bankDirArg) {
    bankDirs = [resolve(ROOT, bankDirArg)];
  } else if (bankSlug) {
    bankDirs = [join(bankRoot, bankSlug)];
  } else if (existsSync(bankRoot)) {
    bankDirs = readdirSync(bankRoot)
      .map((name) => join(bankRoot, name))
      .filter((p) => statSync(p).isDirectory() && existsSync(join(p, 'bank.json')));
  }

  const ctx = { errors: [], warnings: [] };
  let cards = 0;
  let blocks = 0;
  for (const dir of bankDirs) {
    const result = validateBank(dir, ctx, { only });
    cards += result.cards;
    blocks += result.blocks;
  }

  // Recipes are checked by default whenever a full bank root is in play; --no-recipes
  // skips them (fixtures have no recipes), --recipes forces them on.
  const wantRecipes = argv.includes('--recipes')
    || (!argv.includes('--no-recipes') && !bankDirArg && !only);
  let recipeCount = 0;
  if (wantRecipes) {
    const recipesDir = resolve(ROOT, arg(argv, '--recipes-dir', join('booklets', 'recipes')));
    for (const file of listJson(recipesDir)) {
      recipeCount++;
      validateRecipe(join(recipesDir, file), ctx, { bankRoot });
    }
  }

  console.log(`Booklet bank: checked ${bankDirs.length} bank(s), ${cards} card(s), ${blocks} block(s)${only ? ' (filtered)' : ''}${wantRecipes ? `, ${recipeCount} recipe(s)` : ''}.`);
  for (const w of ctx.warnings) console.log(`  ⚠ ${w}`);
  if (ctx.errors.length) {
    console.error(`\n✗ ${ctx.errors.length} error(s):`);
    for (const e of ctx.errors) console.error(`  ✗ ${e}`);
    process.exit(1);
  }
  console.log(`\n✓ All checks passed (${ctx.warnings.length} warning(s)).`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main();
}
