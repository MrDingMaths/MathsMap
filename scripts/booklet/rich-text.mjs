// Renders the shared rich-text format to print HTML: `$…$` maths, `**bold**`, `[tikz]`
// figures, `{{cloze}}` blanks, and one line per line.
//
// The maths and the line grouping come from the SAME modules the app uses
// (src/lib/render-math.js, src/lib/inline-content.js), so a card reads identically on
// screen and on paper — including the run of consecutive pure-maths lines that
// `groupTextBlocks` collapses into one equals-aligned `\begin{aligned}` block, which is how
// the booklets set out working.
import { renderMath, escapeHtml } from '../../src/lib/render-math.js';
import { splitInlineContent, groupTextBlocks } from '../../src/lib/inline-content.js';

const CLOZE_RE = /\{\{([^{}]*)\}\}/g;

/**
 * Replace `{{answer}}` cloze markers.
 * @param {'blank'|'filled'} mode print an empty dotted rule, or the answer itself
 */
export function renderCloze(text, mode) {
  return String(text).replace(CLOZE_RE, (_whole, answer) => {
    const width = Math.max(4, Math.min(28, answer.length + 2));
    return mode === 'filled'
      ? `\u0001CLOZE_FILLED:${answer}\u0001`
      : `\u0001CLOZE_BLANK:${width}\u0001`;
  });
}

// Cloze markers survive as sentinels through the KaTeX/bold pass, then become HTML. Doing
// it this way keeps the maths renderer unaware of them.
function realiseCloze(html) {
  return html
    .replace(/\u0001CLOZE_BLANK:(\d+)\u0001/g, (_w, w) => `<span class="cloze" style="--ch:${w}"></span>`)
    .replace(/\u0001CLOZE_FILLED:([^\u0001]*)\u0001/g, (_w, answer) => `<span class="cloze cloze-filled">${renderMath(answer)}</span>`);
}

/**
 * @param {string} text a rich-text field
 * @param {object} ctx `{ tikz(code) -> html, cloze: 'blank'|'filled'|'none' }`
 * @returns {string} HTML
 */
export function richText(text, ctx = {}) {
  if (text == null || text === '') return '';
  const { tikz, cloze = 'blank' } = ctx;
  const { parts, errors } = splitInlineContent(String(text));
  if (errors.length && !parts.length) return `<div class="text-line">${escapeHtml(String(text))}</div>`;

  const out = [];
  for (const part of parts) {
    if (part.type === 'tikz') {
      out.push(tikz ? tikz(part.value) : '');
      continue;
    }
    const prepared = cloze === 'none' ? part.value : renderCloze(part.value, cloze);
    for (const block of groupTextBlocks(prepared)) {
      if (block.kind === 'blank') {
        out.push('<div class="text-gap"></div>');
      } else {
        out.push(`<div class="text-line">${realiseCloze(renderMath(block.value))}</div>`);
      }
    }
  }
  return out.join('\n');
}

/** Rich text rendered for a place that must stay on one line (a short printed answer). */
export function richTextInline(text, ctx = {}) {
  if (text == null || text === '') return '';
  const prepared = ctx.cloze === 'none' ? String(text) : renderCloze(String(text), ctx.cloze || 'blank');
  return realiseCloze(renderMath(prepared.replace(/\n+/g, ' ')));
}

/**
 * How many ruled lines of answer space a question deserves when the author did not say.
 * Ported from MathsDatabase's worksheet generator (js/worksheet.js
 * estimateAnswerSpaceHeight): the length of the worked solution is the best available
 * proxy for how much room a student needs.
 */
export function estimateLines(card) {
  if (Number.isInteger(card.space)) return card.space;
  const text = card.solution_text || card.answer || '';
  if (!text) return 4;
  let lines = 0;
  for (const line of String(text).split('\n')) {
    if (!line.trim()) continue;
    if (line.includes('[tikz]')) {
      lines += 5;
      continue;
    }
    lines += Math.max(1, Math.ceil(line.length / 65));
  }
  return Math.max(3, Math.min(14, lines + 1));
}
