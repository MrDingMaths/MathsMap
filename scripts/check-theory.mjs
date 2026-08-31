// Theory pass: gate the results before apply-repairs runs.
//
//   node scripts/check-theory.mjs --tasks-dir .agywork/W3-2/theory [--quarantine]
//
// The lane returns the whole `theory` object — prose rewritten, figures possibly added —
// which is what makes the splice simple and a silent drift possible. validate.mjs sees only
// that the result is well-formed content; the rewritten prose would still be valid however
// long, however jargon-heavy, and however much of the original it dropped. Every check here
// is one of those ways to be valid and wrong:
//
//   - the word budget (the whole point of the rewrite: theory that fits working memory);
//   - facts multiplying instead of tightening (ADVISORY — an example set legitimately grows
//     the fact list, and each fact is still capped individually by the word budget);
//   - `steps` reworded, which breaks every worked solution whose step headers cite it;
//   - the maths changed under cover of a rewrite;
//   - a figure in the wrong field, or a figure mid-sentence (there is no cap on how many
//     figures a theory may carry — see the figure block below).
//
// --quarantine rewrites failing repairs to `decision: "skip"` so the clean ones can be
// applied while the failures are regenerated.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { parseResultFile } from './agy/lib/agy-run.mjs';
import { findRawControlChars } from './agy/lib/json-splice.mjs';
import { extractTikz } from './lib/tikz-blocks.mjs';
import { voiceBreaches, countWords, countSentences, INTRO_WORDS, FACT_WORDS } from './lib/theory-voice.mjs';

export { countWords, countSentences, INTRO_WORDS, FACT_WORDS };

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, ''));

const FIELDS = ['intro', 'facts', 'steps'];
const stripTikz = (t) => String(t ?? '').replace(/\[tikz\][\s\S]*?\[\/tikz\]/g, '');

// Every maths span, in order — the rewrite may reword prose but must not touch the maths.
const mathSpans = (text) => (stripTikz(text).match(/\$[^$]*\$/g) || []).map((s) => s.replace(/\s+/g, ''));

export function checkRepair(skillId, repair) {
  const faults = [];
  const before = readJson(path.join(rootDir, 'public', 'content', `${skillId}.json`)).theory;
  const after = repair.replacement;
  if (!after || typeof after !== 'object' || Array.isArray(after)) return { faults: ['decision "rewrite" but no theory object'], warnings: [] };

  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (!FIELDS.includes(key)) faults.push(`unknown theory key "${key}"`);
  }

  // steps are frozen — worked-solution step headers are validated against these strings.
  if (JSON.stringify(before.steps ?? null) !== JSON.stringify(after.steps ?? null)) {
    faults.push('"steps" changed — steps are frozen, worked solutions cite them as headers');
  }

  if (typeof after.intro !== 'string' || !after.intro.trim()) faults.push('intro is missing or empty');
  if (!Array.isArray(after.facts) || !after.facts.length) faults.push('facts is missing or empty');
  if (typeof after.intro !== 'string' || !Array.isArray(after.facts)) return { faults, warnings: [] };

  // Word budget — the whole point of the rewrite. The validator warns on the same numbers;
  // here a breach is fatal, because a rewrite that misses the budget has done nothing.
  faults.push(...voiceBreaches(after).map((b) => b.replace('budget', 'limit')));
  // ADVISORY, not fatal (owner decision 2026-08-30). `docs/atomisation-teaching.md`
  // prescribes example SETS — NPPPN, PPNN — and the content schema has no `examples` field,
  // so a set has nowhere to live but `facts`; a theory that grows from 3 facts to 7 because
  // it now shows examples and non-examples is the lane working, not failing. Each individual
  // fact is still capped by the word budget above, which is what actually keeps theory tight.
  const factGrowth = after.facts.length > before.facts.length
    ? [`${after.facts.length} facts, was ${before.facts.length} — check this is an example set, not padding`]
    : [];
  // SHRINKAGE is the dangerous direction and was invisible here until W3-9: a rewrite of
  // `transform-reflections` silently returned 3 of its 7 facts, dropping the intercept-sign,
  // even and odd rules, and every other check passed it — the brief says "keep every teachable
  // fact", so losing one is a cull, not a tightening. Merging two facts that say the same thing
  // is legitimate, so a small drop is a warning and a large one is fatal.
  const lost = before.facts.length - after.facts.length;
  if (lost > 0) {
    const msg = `${after.facts.length} facts, was ${before.facts.length} — ${lost} fact(s) LOST; a rewrite tightens, it does not cull`;
    if (lost > Math.max(1, Math.floor(before.facts.length / 3))) faults.push(msg);
    else factGrowth.push(msg);
  }
  after.facts.forEach((fact, i) => {
    if (typeof fact !== 'string' || !fact.trim()) faults.push(`facts[${i}] is missing or empty`);
  });

  // The rewrite may re-express a formula (drop a redundant \text{}, shorten a label) — that is
  // part of tightening — but it may not introduce a VALUE the original theory never taught.
  // Comparing whole maths spans flagged every legitimate rewording, so the check is on the
  // numeric literals only, which is where an invented worked example shows up.
  // Clock times ($23{:}59$) and subscripts ($\text{Offset}_1$) are notation, not values.
  const numbers = (t) => (mathSpans(t).join(' ')
    .replace(/\d{1,2}\{?:\}?\d{2}/g, ' ')
    .replace(/_\{?\d+\}?/g, ' ')
    .match(/\d+(?:\.\d+)?/g) || []);
  const had = new Set([...numbers(before.intro), ...(before.facts || []).flatMap(numbers),
    ...(before.steps || []).flatMap(numbers)]);
  const invented = [...new Set([...numbers(after.intro), ...after.facts.flatMap(numbers)])].filter((n) => !had.has(n));
  // Advisory, not fatal: re-expressing a formula legitimately moves numbers around, and every
  // fatal variant of this check fired on a correct rewrite. It is here to be READ in review.
  const warnings = [
    ...factGrowth,
    ...(invented.length
      ? [`numbers not in the original theory: ${invented.slice(0, 5).join(', ')} — check this is not an invented worked example`]
      : []),
  ];

  // Figures: in a field that renders them, after the prose they illustrate, each on its own
  // line. There is NO CAP on how many a theory may carry, per field or in total (owner
  // decision 2026-08-30). The lane's principle is that the diagram sits beside the fact it
  // teaches, and `docs/atomisation-teaching.md` prescribes example SETS — NPPPN, PPNN, an
  // example and its near-miss non-example differing in exactly one feature — so one fact can
  // legitimately carry several figures side by side: the trapezoidal rule illustrating more
  // than one application, spanning trees showing examples AND non-examples. The earlier
  // one-per-skill cap, and the end-of-string rule that made it one per field, were both
  // unmeasured judgements rather than findings.
  const at = { intro: extractTikz(after.intro).length };
  after.facts.forEach((text, i) => { at[`facts[${i}]`] = extractTikz(text).length; });
  const inSteps = (after.steps || []).reduce((n, s) => n + extractTikz(s).length, 0);
  if (inSteps) faults.push('a figure in theory.steps — steps are frozen, put it in intro or a fact');
  const total = Object.values(at).reduce((s, n) => s + n, 0);
  const wanted = repair.figure === 'drawn' || repair.figure === 'kept';
  if (wanted && total === 0) faults.push(`figure "${repair.figure}" but the theory carries no [tikz] block`);
  if (!wanted && total > 0) faults.push(`figure "${repair.figure ?? 'none'}" but the theory carries a [tikz] block`);

  const beforeFigures = extractTikz(JSON.stringify(before)).length;
  if (beforeFigures && total === 0) faults.push('the theory already had a figure and the rewrite dropped it');

  const landed = Object.entries(at).filter(([, n]) => n > 0).map(([k]) => k);
  if (total && repair.placement && !landed.includes(repair.placement)) {
    faults.push(`placement says "${repair.placement}" but the figure is in ${landed.join(', ')}`);
  }
  // A field may hold any number of figures, but each must sit on its own line AFTER the prose
  // it illustrates — never spliced mid-sentence, and never ahead of the text it belongs to.
  for (const where of landed) {
    const text = String(where === 'intro' ? after.intro : after.facts[Number(where.match(/\[(\d+)\]/)[1])]);
    if (/^\s*\[tikz\]/.test(text)) {
      faults.push(`${where}: the figure comes before the prose it illustrates — put the text first`);
    }
    for (const m of text.matchAll(/\[tikz\][\s\S]*?\[\/tikz\]/g)) {
      const before = text.slice(0, m.index);
      const rest = text.slice(m.index + m[0].length);
      if (before.trim() && !/\n[ \t]*$/.test(before)) {
        faults.push(`${where}: a figure is spliced mid-sentence — start it on its own line`);
      }
      if (rest.trim() && !/^[ \t]*\n/.test(rest)) {
        faults.push(`${where}: prose resumes on the figure's own line — start it on a new line`);
      }
    }
  }

  // Maths delimiters. W3-2's re-run came back with `$0^{\circ}$` as `^{\circ}$` and `$n - 1$`
  // as `- 1$` — the model dropped the opening `$` and the symbol behind it. The result is
  // well-formed JSON, passes every check above (the numeric check only ever looks INSIDE
  // spans, and the eaten digits leave the span so it sees fewer numbers, not new ones), and
  // ships raw TeX into the prose where KaTeX never runs. So: an odd number of `$`, an empty
  // span, or a TeX construct sitting outside every span is fatal.
  const texOutside = (text) => {
    const prose = stripTikz(text).replace(/\\\$/g, ' ').replace(/\$[^$]*\$/g, ' ');
    return /\\[a-zA-Z]+|[\^_]\{|\}/.test(prose);
  };
  const delimiters = (text, where) => {
    const t = stripTikz(text).replace(/\\\$/g, '§');
    if (((t.match(/\$/g) || []).length) % 2) faults.push(`${where}: odd number of $ — a maths span is unclosed`);
    if (/\$\s*\$/.test(t)) faults.push(`${where}: an empty $ $ span — the maths inside it was dropped`);
    if (texOutside(text)) faults.push(`${where}: TeX outside a $...$ span — it will render as literal text`);
    // An even number of `$` can still be wrong: when the opening `$` of one span is eaten,
    // the closing `$` of the span before it pairs with the next span's closer, and the PROSE
    // between them is swallowed into maths — `$n$ vertices ... $n - 1$` came back as
    // `$ vertices has **exactly  - 1$`. A real span never opens or closes on whitespace and
    // never contains markdown bold.
    for (const m of t.matchAll(/\$([^$]*)\$/g)) {
      const inner = m[1];
      if (!inner.trim()) continue; // the empty-span fault above already names this one
      if (/^\s|\s$/.test(inner)) faults.push(`${where}: a $...$ span opens or closes on whitespace ("${inner.slice(0, 40)}") — prose has been swallowed into the maths`);
      else if (inner.includes('**')) faults.push(`${where}: a $...$ span contains markdown bold ("${inner.slice(0, 40)}") — prose has been swallowed into the maths`);
    }
  };
  delimiters(after.intro, 'intro');
  after.facts.forEach((text, i) => delimiters(text, `facts[${i}]`));

  // Currency must survive. Told that a bare `$1000` breaks the delimiters, the model's second
  // attempt "fixed" W3-1's money skills by DELETING the escaped dollars instead — `$\$45\,000$`
  // came back as `$45\,000$`, so the theory now says a vehicle is worth 45 000 of nothing. The
  // delimiters balance, the numbers are unchanged, and every other check passes it. Losing an
  // escaped `\$` the original taught is a fault.
  const escapedDollars = (o) => ((stripTikz(JSON.stringify(o)).match(/\\\\\$/g) || []).length);
  const hadCurrency = escapedDollars(before);
  const keptCurrency = escapedDollars({ intro: after.intro, facts: after.facts, steps: before.steps });
  if (hadCurrency > keptCurrency) {
    faults.push(`${hadCurrency - keptCurrency} escaped currency sign(s) \\$ dropped — a money amount has lost its dollar sign`);
  }

  // Newlines are the line-break convention; every other control character (the Wave-2 tab /
  // form-feed corruption trap) is a paste artefact that renders as stray whitespace.
  const CTRL = /[\u0000-\u0009\u000B-\u001F]/;
  const scan = (text, where) => { if (CTRL.test(String(text))) faults.push(`${where}: raw control character in the string`); };
  scan(after.intro, 'intro');
  after.facts.forEach((text, i) => scan(text, `facts[${i}]`));
  const bad = findRawControlChars(JSON.stringify(after, null, 2));
  if (bad.length) faults.push(`${bad.length} raw control character(s) in the serialised theory`);

  return { faults, warnings };
}

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function main() {
  const dirArg = arg('--tasks-dir', '');
  const quarantine = process.argv.includes('--quarantine');
  if (!dirArg) { console.error('usage: node scripts/check-theory.mjs --tasks-dir <dir> [--quarantine]'); process.exit(2); }
  const tasksDir = path.resolve(dirArg);

  let rewritten = 0; let figures = 0; let skipped = 0; let failed = 0;
  for (const rf of fs.readdirSync(tasksDir).filter((f) => /^task-\d+\.result\.json$/.test(f)).sort()) {
    const full = path.join(tasksDir, rf);
    let result;
    try { result = parseResultFile(full); } catch (error) { console.error(`✗ ${rf}: unparseable — ${error.message}`); failed++; continue; }
    let touched = false;
    for (const r of result.repairs || []) {
      const sid = r.skillId || result.skillId;
      if (r.decision !== 'rewrite') { skipped++; console.log(`· ${sid} theory: skip — ${r.reason || 'no reason given'}`); continue; }
      let faults; let warnings = [];
      try { ({ faults, warnings } = checkRepair(sid, r)); } catch (error) { faults = [error.message]; }
      warnings.forEach((w) => console.log(`  ⚠ ${sid} theory: ${w}`));
      if (!faults.length) {
        rewritten++;
        if (r.figure === 'drawn' || r.figure === 'kept') figures++;
        console.log(`✓ ${sid} theory — prose${r.figure === 'drawn' ? ` + figure (${r.placement})` : r.figure === 'kept' ? ' + existing figure kept' : ''}`);
        continue;
      }
      failed++;
      console.error(`✗ ${sid} theory:`);
      faults.forEach((f) => console.error(`    ${f}`));
      if (quarantine) { r.decision = 'skip'; r.reason = `quarantined by check-theory: ${faults[0]}`; delete r.replacement; touched = true; }
    }
    if (touched) fs.writeFileSync(full, JSON.stringify(result, null, 2) + '\n');
  }

  console.log(`\n${rewritten} theory rewrite(s) pass (${figures} carrying a figure), ${skipped} skill(s) skipped by the model, ${failed} failed${quarantine ? ' (quarantined to skip)' : ''}`);
  if (failed && !quarantine) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) main();
