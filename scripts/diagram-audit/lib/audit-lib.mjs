// Shared helpers for the Wave-3 diagram-audit lane: sibling-repo resolution, the [tikz]
// placeholder substitution used by packet building, block-index splices for redraws, and a
// seeded PRNG for the human 10% sample (seeded so the sample is reproducible per batch).

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(HERE, '..', '..', '..');
export const MATHSDATABASE_ROOT = process.env.MATHSDATABASE_ROOT
  || path.resolve(ROOT, '..', 'MathsDatabase');

export function siblingImport(relPath) {
  const abs = path.join(MATHSDATABASE_ROOT, relPath);
  return import(new URL(`file:///${abs.replace(/\\/g, '/')}`));
}

export const TIKZ_RE = /\[tikz\]([\s\S]*?)\[\/tikz\]/g;

// Replace every [tikz]…[/tikz] block in `text` with a numbered placeholder, returning the
// substituted text and the extracted block bodies in order.
export function substituteTikz(text, placeholder = i => `[diagram ${i + 1}: see attached PNG]`) {
  const blocks = [];
  const substituted = String(text || '').replace(TIKZ_RE, (_, body) => {
    blocks.push(body);
    return placeholder(blocks.length - 1);
  });
  return { substituted, blocks };
}

// Replace the Nth (0-based) [tikz] block in `text` with a new body. Throws when the index
// does not exist — a redraw must never silently no-op.
export function replaceTikzBlock(text, blockIndex, newBody) {
  let i = -1;
  let replaced = false;
  const next = String(text || '').replace(TIKZ_RE, (match, _body) => {
    i++;
    if (i !== blockIndex) return match;
    replaced = true;
    return `[tikz]${newBody}[/tikz]`;
  });
  if (!replaced) throw new Error(`no [tikz] block at index ${blockIndex} (found ${i + 1})`);
  return next;
}

// Walk a content/quiz object to the string field named by a block's `where`
// (e.g. "foundation[3].question_text" or "q7.solution_text" — the shapes produced by
// scripts/lib/tikz-blocks.mjs collectBlocks). Returns {get, set} accessors.
export function fieldAccessor(doc, where) {
  const practiceMatch = where.match(/^(foundation|development|mastery)\[(\d+)\]\.(\w+)$/);
  if (practiceMatch) {
    const [, tier, idx, field] = practiceMatch;
    const item = doc.practice?.[tier]?.[Number(idx)];
    if (!item) throw new Error(`no practice item at ${where}`);
    return { get: () => item[field], set: v => { item[field] = v; } };
  }
  // Theory figures: theory.intro, theory.facts[2], theory.steps[1]. Checked
  // before the quiz shape, which would otherwise read "theory.intro" as a
  // question id + field and fail to resolve it.
  const theoryMatch = where.match(/^theory\.(intro|facts|steps)(?:\[(\d+)\])?$/);
  if (theoryMatch) {
    const [, key, idx] = theoryMatch;
    const theory = doc.theory;
    if (!theory) throw new Error(`no theory object at ${where}`);
    if (idx === undefined) return { get: () => theory[key], set: v => { theory[key] = v; } };
    const arr = theory[key];
    const i = Number(idx);
    if (!Array.isArray(arr) || typeof arr[i] !== 'string') throw new Error(`no theory entry at ${where}`);
    return { get: () => arr[i], set: v => { arr[i] = v; } };
  }

  const quizMatch = where.match(/^(.+?)\.(\w+)$/);
  if (quizMatch) {
    const [, qid, field] = quizMatch;
    const q = (doc.questions || []).find(x => x.id === qid);
    if (q) return { get: () => q[field], set: v => { q[field] = v; } };
    // top-level content field like "theory" carries no dot — fall through
  }
  if (typeof doc[where] === 'string') return { get: () => doc[where], set: v => { doc[where] = v; } };
  throw new Error(`cannot resolve field "${where}"`);
}

// Mulberry32 — deterministic sample selection per batch.
export function seededRandom(seedString) {
  let h = 1779033703 ^ seedString.length;
  for (let i = 0; i < seedString.length; i++) {
    h = Math.imul(h ^ seedString.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
