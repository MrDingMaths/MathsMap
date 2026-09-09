// KaTeX rendering for the shared rich-text format: prose with `$…$` maths runs and
// `**bold**`. Extracted from src/components/Math.svelte so Node-side tools — the booklet
// renderer above all — produce byte-identical HTML to the app. Math.svelte imports it.
import katex from 'katex';
import {spaceFractionSteps} from '../../public/libs/maths-editor/equation-spacing.mjs';

// Split a mixed string into prose and `$...$` maths runs, render the maths
// with KaTeX, and HTML-escape the prose. The result is a trusted HTML string
// (KaTeX output plus escaped text) safe to drop in with {@html}.
export const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// Cache renders — the same titles/blurbs recur across many cards.
const cache = new Map();

// Placeholders that stand in for a rendered maths run while the `**bold**` pass runs over
// the prose. They must be characters that cannot occur in escaped prose or in markdown:
// the U+0000 delimiters guarantee that. (An earlier version used ` <digits> ` and would
// corrupt ordinary prose such as "Round to 2 decimal places", whose " 2 " looked exactly
// like a placeholder.)
const PLACEHOLDER = (index) => `\u0000${index}\u0000`;
const PLACEHOLDER_RE = /\u0000(\d+)\u0000/g;

export function renderMath(text) {
  if (text == null) return '';
  const str = String(text);
  if (cache.has(str)) return cache.get(str);

  // Transcription lanes may preserve display delimiters. The shared renderer lays
  // expressions out itself, so reduce $$...$$ to the same single-delimiter form
  // before tokenising. Repeated source dot leaders are collapsed to one stable
  // ellipsis rather than producing irregularly spaced groups of ellipses.
  const normalized = str
    .replace(/\$\$([\s\S]*?)\$\$/g, (_match, latex) => `$${latex}$`)
    .replace(/(?:\\dots){2,}/g, '\\ldots');

  // Alternating split: even indices are prose, odd indices are LaTeX.
  // A literal `$` is written `\$`; the `\\.` alternation lets a math run
  // contain escaped chars (e.g. `\$` for currency) without ending early,
  // and the opening lookbehind keeps a prose `\$` from starting a run.
  const parts = normalized.split(/(?<!\\)\$((?:\\.|[^$])*?)\$/);

  // Assemble the prose with math runs swapped out for placeholder tokens, so
  // **bold** that wraps a math run (e.g. `**divide by $4$**`) stays intact for
  // the bold pass below.
  const mathHtml = [];
  let prose = '';
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      // Prose: escape, then unescape literal `\$`.
      prose += escapeHtml(parts[i]).replace(/\\\$/g, '$');
    } else {
      let rendered;
      try {
        // Match MathsDatabase: every expression uses display-style glyphs
        // while its surrounding inline/block layout remains unchanged.
        const displayMath = `\\displaystyle ${spaceFractionSteps(parts[i]).replace(/\\(?:[,;:!]|q?quad)\s*(?=[\^_])/g, '')}`;
        rendered = katex.renderToString(displayMath, {
          throwOnError: true,
          // AMS align requires display mode; ordinary formula layout stays inline.
          displayMode: /\\begin\{align\*?\}/.test(parts[i]),
          output: 'htmlAndMathml',
        });
      } catch {
        rendered = `<span class="katex-error">${escapeHtml(`$${parts[i]}$`)}</span>`;
      }
      prose += PLACEHOLDER(mathHtml.length);
      mathHtml.push(rendered);
    }
  }

  // Render markdown-style **bold** across the full prose, then restore math.
  const html = prose
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(PLACEHOLDER_RE, (whole, n) => mathHtml[Number(n)] ?? whole);

  cache.set(str, html);
  return html;
}
