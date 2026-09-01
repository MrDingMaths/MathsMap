#!/usr/bin/env node
// Audits question_text / solution_text against the text house format
// (docs/content-schema.md, "Shared rich-text format").
//
// The validator checks that a field RENDERS; this checks that it is written
// the house way. Classes:
//
//   * SPACING          — the field is not what scripts/lib/house-format.mjs
//                        produces: two sentences sharing a stem line, a blank
//                        line, a trailing space, an orphaned "A." label.
//                        Auto-fixable: run scripts/apply-house-format.mjs.
//   * DISPLAY-MATH     — `$$…$$`. The renderer has no display mode
//                        (src/lib/render-math.js splits on single `$`), so the
//                        extra delimiters render as literal dollars.
//   * UNICODE-MATH     — a raw °, ≤, ×, π … sitting in prose instead of KaTeX.
//   * RESTATES-ANSWER  — a solution's last line is a sentence that repeats the
//                        answer the line above already gave (house register
//                        rule: the final `=` line IS the answer).
//   * OFF-POOL-NAME    — a person's name that is not in the shared name pool.
//
// The last two are ADVISORY: both need a human to read the sentence, and a
// wrong auto-fix there is worse than the defect. They never count toward
// --strict.
//
// Usage:
//   node scripts/audit-house-format.mjs                  # all skills
//   node scripts/audit-house-format.mjs --only id1,id2   # ids or prefix
//   node scripts/audit-house-format.mjs --strict         # exit 1 on defects
//   node scripts/audit-house-format.mjs --dir <root>     # test override
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { rejectStrayPositionals } from './lib/argv.mjs';
import { houseFormatStem, houseFormatSolution } from './lib/house-format.mjs';
import { listSkillIds, readJson, visitTextFields } from './lib/content-fields.mjs';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseOnlyArg(argv) {
  const idx = argv.indexOf('--only');
  if (idx === -1 || idx === argv.length - 1) return null;
  const ids = argv[idx + 1].split(',').map((s) => s.trim()).filter(Boolean);
  return (id) => ids.some((want) => id === want || id.startsWith(want));
}

const argv = process.argv.slice(2);
rejectStrayPositionals(argv, { valueFlags: ['--only', '--dir'], boolFlags: ['--strict'] });
const strict = argv.includes('--strict');
const dirIdx = argv.indexOf('--dir');
const baseDir = dirIdx !== -1 && argv[dirIdx + 1] ? join(rootDir, argv[dirIdx + 1]) : join(rootDir, 'public');
const filterFn = parseOnlyArg(argv);

// Raw maths that belongs inside `$…$`. Excludes the punctuation and typographic
// marks that legitimately appear in prose (—, ’, …), and deliberately excludes the
// superscript unit digits ²/³: `12 cm²` written in prose is an established, corpus-wide
// convention here (535 fields) that renders correctly, so it is house style, not a
// defect. Everything in this class is an operator or a constant, which always
// belongs in KaTeX.
const UNICODE_MATH_RE = /[°≤≥≠×÷π√∞∫∑±≈→⇒∈∪∩⊂∠′″¼½¾⅓⅔⅛−]/;
const TIKZ_G = /\[tikz\][\s\S]*?\[\/tikz\]/g;
const MATH_G = /\$(?:\\.|[^$\\])+\$/g;

// The shared name pool (MathsDatabase/tools/qgen/prompts/generation-formatting-rules.md).
const NAME_POOL = new Set(`Alana Alice Alison Ally Amber Amelia Amy Anastasia Angela Anna Ariel Aspen Audrey
Beatrix Bella Caitlyn Carol Cate Charlotte Chiara Chloe Cindy Claire Cleo Daisy David Edith Elissa Emily Emma
Evie Evita Gemma Georgia Grace Hannah Harriet Heidi Holly Isabella Isabelle Issy James Jasmine Jenny Jess Jimmy
Johnny Juliette Karla Katelyn Kaya Kayla Keira Lilian Lily Lola Lucia Lulu Mackenzie Maddie Maryanna Matilda
Mikayla Miki Mila Natalie Olivia Phoebe Rachel Raf Romaine Rose Ruby Saskia Scarlett Sienna Sofia Sophie Stella
Sybella Sydney Tammy Tamsin Trinity Victoria Will Willa Zoe`.split(/\s+/));

// A capitalised word used as a person: followed by a verb that (almost) only a
// person takes. Deliberately narrow — a broad proper-noun sweep drowns in place
// names, shape labels and units — and `is`/`was` are excluded outright because
// "What is", "This is", "The range is" swamp everything else.
const PERSON_RE = /\b([A-Z][a-z]{2,})\s+(?:has|had|buys|bought|walks|walked|runs|ran|saves|saved|spends|spent|makes|made|needs|wants|earns|earned|pays|paid|cuts|shares|shared|scores|scored|plants|planted|collects|collected|counts|counted|reads|read|drinks|drank|sells|sold)\b/g;

// Capitalised words the pattern still catches that are never a person here.
const NOT_A_NAME = new Set(`What Which This That There These Those The A An He She It They We You I
When Where Why Who How Since Because If Then Therefore Thus Hence So Both Each Every Neither Either
Only One Two Three Four Five Six Seven Eight Nine Ten Half Total Sum Point Line Angle Side Triangle
Rectangle Square Circle Curve Centre Center Boundary Domain Range Mode Median Mean Interest Spinner
Activity City Town Week Day Month Year Store Shop Class School Team Group Set Data Table Graph Box
Each Number Value Result Answer Figure Shape Diagram Cost Price Area Volume Length Width Height`.split(/\s+/));

// "…merely restates the answer": a trailing sentence that opens with a stock
// conclusion frame ("Therefore…", "The answer is…") AND whose numbers are all
// already on the line above. A word/justify question is ALLOWED to close with a
// real answer sentence (docs/content-schema.md) — "The passenger travelled $15$
// km." says something the algebra line did not — so both conditions are needed
// to tell a restatement from an answer.
const RESTATES_RE = /^(?:so|therefore|thus|hence)\b|the (?:answer|final answer|result) is\b/i;
const numbersIn = (s) => (s.match(/\d+(?:\.\d+)?/g) || []);

// `$$…$$` is display maths, which the renderer has no mode for. A naive search
// for "$$" is wrong: `$\$$/kg` ("dollars per kg") is a perfectly good inline run
// whose content is an escaped dollar. Split the way render-math.js does and flag
// only a run that comes out EMPTY — that is a doubled delimiter, nothing else.
const RUN_RE = /(?<!\\)\$((?:\\.|[^$])*?)\$/g;
function hasDisplayMath(text) {
  for (const [, inner] of text.replace(TIKZ_G, ' ').matchAll(RUN_RE)) {
    if (inner === '') return true;
  }
  return false;
}

function proseOnly(text) {
  return text.replace(TIKZ_G, ' ').replace(MATH_G, ' ');
}

const defects = [];
const advisories = [];
let fieldsScanned = 0;
let skillsScanned = 0;

for (const skillId of listSkillIds(baseDir, filterFn)) {
  skillsScanned++;
  for (const [source, sub] of [['content', 'content'], ['quiz', 'quizzes'], ['option', 'quizzes']]) {
    const path = join(baseDir, sub, `${skillId}.json`);
    if (!existsSync(path)) continue;
    let parsed;
    try {
      parsed = readJson(path);
    } catch (err) {
      defects.push([`UNREADABLE ${sub}/${skillId}.json`, err.message]);
      continue;
    }

    visitTextFields(parsed, source, ({ obj, key, kind, where }) => {
      fieldsScanned++;
      const text = obj[key];
      const at = `${skillId} ${source === 'content' ? '' : 'quiz '}${where} ${key}`;
      const canonical = kind === 'stem' ? houseFormatStem(text) : houseFormatSolution(text);
      // Options carry the notation rules but not the line-break rules.
      if (kind !== 'option' && text !== canonical) {
        defects.push([`SPACING ${at}`, `is:     ${JSON.stringify(text).slice(0, 160)}`, `should: ${JSON.stringify(canonical).slice(0, 160)}`]);
      }
      if (hasDisplayMath(text)) {
        defects.push([`DISPLAY-MATH ${at}`, JSON.stringify(text).slice(0, 160)]);
      }
      const prose = proseOnly(text);
      const unicode = prose.match(UNICODE_MATH_RE);
      if (unicode) {
        defects.push([`UNICODE-MATH ${at}`, `"${unicode[0]}" outside $…$`, JSON.stringify(text).slice(0, 160)]);
      }

      if (kind === 'solution') {
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
        const last = lines[lines.length - 1] || '';
        const previous = lines[lines.length - 2] || '';
        const lastNumbers = numbersIn(last);
        const echoed = lastNumbers.length > 0 && lastNumbers.every((n) => numbersIn(previous).includes(n));
        if (lines.length > 1 && echoed && RESTATES_RE.test(proseOnly(last).trim()) && /[.!]$/.test(last)) {
          advisories.push([`RESTATES-ANSWER ${at}`, last.slice(0, 160)]);
        }
      }

      for (const [, name] of prose.matchAll(PERSON_RE)) {
        if (!NAME_POOL.has(name) && !NOT_A_NAME.has(name)) advisories.push([`OFF-POOL-NAME ${at}`, `"${name}" is not in the shared name pool`]);
      }
    });
  }
}

for (const [header, ...detail] of defects) {
  console.log(`✗ ${header}`);
  for (const line of detail) console.log(`    ${line}`);
}

if (advisories.length) {
  console.log('\nAdvisory (not counted toward --strict — each needs a human to read the sentence):');
  for (const [header, ...detail] of advisories) {
    console.log(`  ~ ${header}`);
    for (const line of detail) console.log(`    ${line}`);
  }
}

console.log(`\nScanned ${fieldsScanned} field(s) across ${skillsScanned} skill(s).`);
if (defects.length) {
  console.log(`\n✗ ${defects.length} house-format defect(s). SPACING defects are fixed by: node scripts/apply-house-format.mjs --write`);
  if (strict) process.exit(1);
} else {
  console.log('\n✓ No house-format defects.');
}
