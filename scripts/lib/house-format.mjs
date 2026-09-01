// The MathsMap text house format for `question_text` / `solution_text`.
//
// Ported from MathsBase's `tightenSpacing()`
// (MathsDatabase/tools/qgen/lib/generate-core.js), keeping its protected-block
// machinery — prose rules never run inside `[tikz]…[/tikz]` or inside a `$…$`
// math run, which is the only reason decimals like `$3.5$` survive the
// sentence splitter intact.
//
// Two deliberate divergences from MathsBase, both forced by this repo's renderer:
//
//   * NO BLANK LINES ANYWHERE. `groupTextBlocks()` (src/lib/inline-content.js)
//     emits a visible `{ kind: 'blank' }` spacer for every empty line, so
//     MathsBase's "one blank line around [tikz]" would render as a real gap.
//     Upstream that rule is source-only. Here every separation is a single \n.
//   * No `$$…$$` display math, no `$\textbf{(a)}$` part markers, no `<svg>` —
//     none of the three belong in this corpus, so those branches are dropped.
//
// Stems get one sentence per line; solutions do not (they are working, not prose).

const TIKZ_RE = /\[tikz\][\s\S]*?\[\/tikz\]/;
const MATH_RE = /\$(?:\\.|[^$\\])+\$/;
const COLLAPSE_RE = /\n([ \t]*\n)+/g; // runs of blank lines -> a single \n
const TRAILING_SPACE_RE = /[ \t]+\n/g;

// Sentence end -> newline. Decimals are safe because MATH_RE has already lifted
// every `$…$` run out of the prose chunk. The lookbehind spares the handful of
// abbreviations that end in a full stop mid-sentence ("e.g. $x$", "Mr. Chen").
const SENT_RE = /(?<!\b(?:Mr|Mrs|Ms|Dr|Prof|St|Fig|approx|vs|cf|etc|e\.g|i\.e))([.!?])[ \t]+(?=[A-Z$])/g;

// ...but never orphan an enumerator label (1. / A. / ii.) from its item.
const ENUM_RE = /(^|\n)([ \t]*)(\d+|[ivxIVX]{2,}|[A-Za-z])\.\n/g;
const ENUM_LABEL_END = /(^|\n)[ \t]*(?:\d+|[ivxIVX]{2,}|[A-Za-z])\.[ \t]+$/;
// Same abbreviation guard as SENT_RE, for the chunk-boundary case below.
const ABBREV_END = /\b(?:Mr|Mrs|Ms|Dr|Prof|St|Fig|approx|vs|cf|etc|e\.g|i\.e)\.[ \t]+$/;

// A whole-line single `$…$` run — the same test `groupTextBlocks()` uses to
// decide what joins an aligned block.
function isPureMathLine(line) {
  const t = line.trim();
  return t.length > 1 && t[0] === '$' && t[t.length - 1] === '$' && t.indexOf('$', 1) === t.length - 1;
}

// The ONE blank line a solution may keep: the separator between two consecutive
// maths runs. `groupTextBlocks()` welds every run of adjacent `$…$` lines into a
// single `aligned` block, so deleting this blank would chain two unrelated
// computations into one column of equals signs — the false-continuation defect
// (docs/content-generation.md). Prose between two runs already breaks them; a
// blank line is the only separator available when there is nothing to say.
const RUN_SEPARATOR = '\u0000run\u0000';

function protectRunSeparators(source) {
  const lines = source.split('\n');
  const out = [];
  let inTikz = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('[tikz]')) inTikz = true;
    if (line.includes('[/tikz]')) inTikz = false;
    if (inTikz || line.trim() !== '') {
      out.push(line);
      continue;
    }
    let next = i;
    while (next < lines.length && lines[next].trim() === '') next++;
    const before = out[out.length - 1] ?? '';
    const after = lines[next] ?? '';
    if (isPureMathLine(before) && isPureMathLine(after)) {
      out.push(RUN_SEPARATOR);
      i = next - 1;
    }
  }
  return out.join('\n');
}

function collapseProse(chunk, splitSentences) {
  let c = chunk.replace(TRAILING_SPACE_RE, '\n').replace(COLLAPSE_RE, '\n');
  if (splitSentences) {
    c = c.replace(SENT_RE, '$1\n');
    c = c.replace(ENUM_RE, '$1$2$3. ');
  }
  return c;
}

function houseFormat(text, splitSentences) {
  if (typeof text !== 'string') return text;
  const source = protectRunSeparators(text.replace(/\r\n/g, '\n').replace(/\r/g, '\n'));
  let out = '';
  let rest = source;

  for (;;) {
    // Earliest protected block: a whole [tikz] block (copied byte-for-byte — a
    // blank line inside a tikzpicture is a LaTeX \par in a fragile spot) or a
    // `$…$` math run (interior blank lines collapsed; they are illegal in math
    // mode, so stripping them is always safe).
    const candidates = [
      { hit: rest.match(TIKZ_RE), math: false },
      { hit: rest.match(MATH_RE), math: true }
    ].filter((c) => c.hit);
    if (!candidates.length) break;
    candidates.sort((a, b) => a.hit.index - b.hit.index);
    const { hit, math } = candidates[0];
    const block = math ? hit[0].replace(/\n[ \t]*(?:\n[ \t]*)+/g, '\n') : hit[0];

    let pre = collapseProse(rest.slice(0, hit.index), splitSentences);
    // A sentence boundary immediately before a protected math block: SENT_RE's
    // lookahead cannot see across the chunk cut, so apply the rule here. But a
    // trailing enumerator label ("A. ", "ii. ") is a list item, not a sentence
    // end — label and value stay on one row.
    if (
      splitSentences &&
      /[.!?][ \t]+$/.test(pre) &&
      block.startsWith('$') &&
      !ENUM_LABEL_END.test(pre) &&
      !ABBREV_END.test(pre)
    ) {
      pre = pre.replace(/[ \t]+$/, '\n');
    }
    out += pre + block;
    rest = rest.slice(hit.index + hit[0].length);
  }

  return (out + collapseProse(rest, splitSentences))
    .replace(new RegExp(`\\n${RUN_SEPARATOR}\\n`, 'g'), '\n\n')
    .replace(/^\s+|\s+$/g, '');
}

// `question_text`: one sentence per line, enumerator labels kept with their
// item, no blank lines.
export function houseFormatStem(text) {
  return houseFormat(text, true);
}

// `solution_text`: no blank lines, nothing else moved. One working step per
// line is an authoring rule the renderer relies on; it is never inferred here.
export function houseFormatSolution(text) {
  return houseFormat(text, false);
}
