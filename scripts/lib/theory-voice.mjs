// The theory word budget, shared by the validator (warns, because 818 files predate it) and
// scripts/check-theory.mjs (hard-fails, because a rewrite has no excuse).
//
// Why a budget at all: a student meeting an idea for the first time cannot hold a 90-word
// paragraph of technical vocabulary in working memory. The booklets state a definition in a
// sentence and move on; theory that runs longer than this is explaining, not defining.

export const INTRO_WORDS = 45;
export const INTRO_SENTENCES = 3;
export const FACT_WORDS = 25;

const stripTikz = (t) => String(t ?? '').replace(/\[tikz\][\s\S]*?\[\/tikz\]/g, '');
// A maths span is one thing to read: "$\frac{a}{b}$" counts as one word, not four.
const prose = (t) => stripTikz(t).replace(/\$[^$]*\$/g, '§').trim();

export function countWords(text) {
  return prose(text).split(/\s+/).filter(Boolean).length;
}

// Deliberately crude — it exists to catch a paragraph, not to parse prose. Decimal points and
// abbreviations inside maths are already masked out by the $-strip.
export function countSentences(text) {
  const p = prose(text);
  if (!p) return 0;
  return p.split(/[.!?](?:\s|$)/).filter((s) => s.trim()).length;
}

// Budget breaches for one theory object, as human-readable strings. Empty when it fits.
export function voiceBreaches(theory) {
  const out = [];
  if (typeof theory?.intro === 'string') {
    const w = countWords(theory.intro);
    if (w > INTRO_WORDS) out.push(`intro is ${w} words (budget ${INTRO_WORDS})`);
    const s = countSentences(theory.intro);
    if (s > INTRO_SENTENCES) out.push(`intro is ${s} sentences (budget ${INTRO_SENTENCES})`);
  }
  (Array.isArray(theory?.facts) ? theory.facts : []).forEach((fact, i) => {
    if (typeof fact !== 'string') return;
    const w = countWords(fact);
    if (w > FACT_WORDS) out.push(`facts[${i}] is ${w} words (budget ${FACT_WORDS})`);
  });
  return out;
}
