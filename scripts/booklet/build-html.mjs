// Builds the whole booklet as one HTML document, ready for Paged.js to paginate and
// Chromium to print.
//
// KaTeX is rendered here, in Node — only TikZ needs the browser. Cached figures are inlined
// as SVG; uncached ones become `<script type="text/tikz">` for TikZJax to compile, in
// exactly the shape src/lib/tikz.js uses in the app.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { prepareTikz } from '../../src/lib/tikz-prepare.js';
import { richText, richTextInline, estimateLines } from './rich-text.mjs';
import { escapeHtml } from '../../src/lib/render-math.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const DEFAULT_FIGURE_CM = { card: 5.5, cell: 4.5, box: 6.8 };

function attr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// --- figures -------------------------------------------------------------------

function makeTikzRenderer({ cache, stats, context }) {
  return (code) => {
    const prepared = prepareTikz(code);
    const cached = cache.get(prepared.key);
    stats.tikzTotal++;
    const widthCm = context.widthCm || DEFAULT_FIGURE_CM.card;
    if (cached) {
      stats.tikzCached++;
      return `<figure class="fig" style="--w:${widthCm}cm" data-tikz="hit">${cached}</figure>`;
    }
    stats.tikzPending++;
    // The script's text is the prepared source; TikZJax reads the two data attributes for
    // packages and preamble. This is byte-for-byte what src/lib/tikz.js injects.
    const pkgAttr = prepared.pkgJson ? ` data-tex-packages="${attr(prepared.pkgJson)}"` : '';
    return [
      `<figure class="fig tikz-pending" style="--w:${widthCm}cm"`,
      ` data-tikz-key="${attr(prepared.key)}" data-card="${attr(context.cardId || '')}">`,
      `<script type="text/tikz" data-disable-cache="1"${pkgAttr}`,
      ` data-add-to-preamble="${attr(prepared.preamble)}">`,
      // A `</script>` inside TikZ source would close the tag early; nothing else needs escaping.
      String(prepared.cleanCode).replace(/<\/script/gi, '<\\/script'),
      '</script></figure>',
    ].join('');
  };
}

// A PNG figure, cropped the way Word cropped it. `crop` gives fractional insets, so the
// image is scaled up by 1/(1-l-r) inside a clipping box of the printed width — the same
// arithmetic Word does, done in CSS.
function pngFigure(figure, fallbackCm) {
  const widthCm = figure.widthCm || fallbackCm;
  const src = `/bank/${figure.bank}/${figure.png}`;
  const crop = figure.crop;
  if (!crop || (!crop.l && !crop.t && !crop.r && !crop.b)) {
    return `<figure class="fig"><img src="${attr(src)}" style="width:${widthCm}cm" alt=""></figure>`;
  }
  const kx = 1 - (crop.l + crop.r);
  const ky = 1 - (crop.t + crop.b);
  const scale = 100 / kx;
  const left = -(crop.l / kx) * 100;
  const top = -(crop.t / ky) * 100;
  // The clip box's aspect ratio is unknown until the image loads, so height comes from
  // padding-bottom once the natural size is known; a data attribute lets the page fix it up.
  return [
    `<figure class="fig fig-cropped" style="--w:${widthCm}cm">`,
    `<span class="crop-box" data-ky="${ky}" data-kx="${kx}">`,
    `<img src="${attr(src)}" alt="" style="width:${scale}%;left:${left}%;top:${top}%">`,
    '</span></figure>',
  ].join('');
}

function figureHtml(figure, bankSlug, fallbackCm) {
  if (!figure || !figure.png) return '';
  return pngFigure({ ...figure, bank: bankSlug, png: figure.png.replace(/^figures\//, '') }, fallbackCm);
}

// --- questions -----------------------------------------------------------------

function answerHtml(item, ctx) {
  if (!ctx.output.shortAnswers) return '';
  const answer = item.answer || (item.solution_text ? null : null);
  if (!answer) return '';
  return `<div class="ans">${richTextInline(answer, { cloze: 'none' })}</div>`;
}

function solutionHtml(item, ctx) {
  if (!ctx.output.solutions || !item.solution_text) return '';
  return `<div class="sol">${richText(item.solution_text, { tikz: ctx.tikz, cloze: 'filled' })}</div>`;
}

function spaceHtml(item, ctx, { scaffolded }) {
  if (!ctx.output.spaces || ctx.output.solutions) return '';
  // A scaffold already supplies the writing room the booklet intended.
  if (scaffolded) return '';
  return `<div class="space" style="--lines:${estimateLines(item)}"></div>`;
}

function subItemHtml(item, ctx, { bankSlug, tag = 'div', cls = 'cell' }) {
  const scaffolded = Boolean(item.scaffold);
  const parts = [
    item.label ? `<span class="label">${escapeHtml(item.label)}.</span>` : '',
    item.question_text ? richText(item.question_text, { tikz: ctx.tikz, cloze: 'blank' }) : '',
    figureHtml(item.figure, bankSlug, DEFAULT_FIGURE_CM.cell),
    item.scaffold ? `<div class="scaffold">${richText(item.scaffold, { tikz: ctx.tikz, cloze: ctx.output.solutions ? 'filled' : 'blank' })}</div>` : '',
    item.marks ? `<span class="marks">(${item.marks})</span>` : '',
    spaceHtml(item, ctx, { scaffolded }),
    solutionHtml(item, ctx),
    answerHtml(item, ctx),
  ];
  return `<${tag} class="${cls}">${parts.filter(Boolean).join('\n')}</${tag}>`;
}

// A grid cannot be split across a page, so rows are chunked server-side: Paged.js can then
// break between rows even though each row stays whole.
function cellGrid(items, columns, ctx, { bankSlug }) {
  if (!items.length) return '';
  const cols = Math.max(1, Math.min(4, columns || 1));
  const out = [];
  for (let i = 0; i < items.length; i += cols) {
    const row = items.slice(i, i + cols);
    out.push(`<div class="cells" style="--cols:${cols}">${row.map((item) => subItemHtml(item, ctx, { bankSlug })).join('')}</div>`);
  }
  return out.join('\n');
}

function questionHtml(entry, ctx, { bankSlug }) {
  const { card, number, columns } = entry;
  const scaffolded = Boolean(card.scaffold);
  const body = [
    card.source && card.source.kind === 'hsc'
      ? `<div class="provenance">${escapeHtml([card.source.year, 'HSC', card.source.course, card.source.band ? `Band ${card.source.band}` : ''].filter(Boolean).join(' '))}</div>`
      : '',
    richText(card.question_text, { tikz: ctx.tikz, cloze: 'blank' }),
    figureHtml(card.figure, bankSlug, DEFAULT_FIGURE_CM.card),
    card.scaffold ? `<div class="scaffold">${richText(card.scaffold, { tikz: ctx.tikz, cloze: ctx.output.solutions ? 'filled' : 'blank' })}</div>` : '',
    card.marks ? `<span class="marks">(${card.marks})</span>` : '',
  ].filter(Boolean).join('\n');

  const parts = card.parts && card.parts.length
    ? cellGrid(card.parts, columns, ctx, { bankSlug })
    : [spaceHtml(card, ctx, { scaffolded }), solutionHtml(card, ctx), answerHtml(card, ctx)].filter(Boolean).join('\n');

  // Long questions must be allowed to break, or they overflow a page and vanish.
  const totalLines = (card.parts || []).reduce((n, p) => n + estimateLines(p), estimateLines(card));
  const tall = totalLines > 30 ? ' tall' : '';

  return [
    `<article class="q${tall}" data-card="${attr(card.id)}">`,
    `<span class="qnum">${number}.</span>`,
    `<div class="q-body">${body}${parts ? `\n${parts}` : ''}</div>`,
    '</article>',
  ].join('');
}

// --- blocks --------------------------------------------------------------------

function box(kind, title, inner, { open = false } = {}) {
  return [
    `<section class="box box-${kind}${open ? ' box-open' : ''}">`,
    title ? `<div class="box-title">${richTextInline(title, { cloze: 'none' })}</div>` : '',
    `<div class="box-body">${inner}</div>`,
    '</section>',
  ].filter(Boolean).join('\n');
}

export function blockHtml(entry, ctx, { bankSlug }) {
  const block = entry.block;
  const columns = entry.columns || block.columns || null;
  const rich = (text, cloze) => richText(text, { tikz: ctx.tikz, cloze: cloze || 'blank' });

  switch (block.type) {
    case 'syllabus':
      return box('syllabus', block.title || 'Syllabus Content', [
        `<div class="outcome">${richTextInline(block.outcome, { cloze: 'none' })}</div>`,
        '<ul class="dotpoints">',
        ...(block.points || []).map((p) => `<li>${richTextInline(p, { cloze: 'none' })}</li>`),
        '</ul>',
      ].join('\n'));

    case 'teach':
      return box('teach', block.title, [
        rich(block.body),
        block.formula ? `<div class="formula">${rich(block.formula)}</div>` : '',
        figureHtml(block.figure, bankSlug, DEFAULT_FIGURE_CM.box),
      ].filter(Boolean).join('\n'));

    case 'review':
      return box('review', block.title || 'Review', (block.groups || []).map((group) => [
        group.prompt ? `<div class="prompt">${rich(group.prompt)}</div>` : '',
        cellGrid(group.cells || [], group.columns || columns || 3, ctx, { bankSlug }),
      ].filter(Boolean).join('\n')).join('\n'), { open: true });

    case 'identify':
      return box('identify', block.title, [
        (block.exemplars || []).length
          ? `<div class="exemplars">${block.exemplars.map((ex) => [
            `<div class="exemplar exemplar-${ex.verdict}">`,
            `<span class="verdict">${ex.verdict === 'yes' ? '✔' : '✖'}</span>`,
            ex.text ? rich(ex.text) : '',
            figureHtml(ex.figure, bankSlug, DEFAULT_FIGURE_CM.cell),
            '</div>',
          ].filter(Boolean).join('')).join('')}</div>`
          : '',
        block.prompt ? `<div class="prompt">${rich(block.prompt)}</div>` : '',
        cellGrid(block.cells || [], columns || 3, ctx, { bankSlug }),
      ].filter(Boolean).join('\n'), { open: true });

    case 'write':
    case 'guided':
      return box(block.type, block.title || (block.type === 'guided' ? 'Guided Practice' : 'Write'), [
        block.prompt ? `<div class="prompt">${rich(block.prompt)}</div>` : '',
        cellGrid(block.cells || [], columns || 2, ctx, { bankSlug }),
      ].filter(Boolean).join('\n'), { open: true });

    case 'keyIdeas':
      return box('keyideas', block.title || 'Key Ideas',
        `<ol class="key-ideas">${(block.items || []).map((item) => `<li>${richText(item.text, { tikz: ctx.tikz, cloze: ctx.output.solutions ? 'filled' : 'blank' })}</li>`).join('')}</ol>`);

    case 'example':
      // A worked example always shows its working: that is what makes it an example.
      return box('example', block.title || 'Example', [
        rich(block.question_text),
        figureHtml(block.figure, bankSlug, DEFAULT_FIGURE_CM.box),
        `<div class="working">${richText(block.solution_text, { tikz: ctx.tikz, cloze: 'filled' })}</div>`,
      ].filter(Boolean).join('\n'));

    case 'proof':
      return box('proof', block.title || 'Proof', [
        figureHtml(block.figure, bankSlug, DEFAULT_FIGURE_CM.box),
        `<ol class="proof-steps">${(block.steps || []).map((step) => [
          '<li>',
          step.prompt ? `<div class="prompt">${rich(step.prompt)}</div>` : '',
          ctx.output.solutions || !ctx.output.spaces
            ? `<div class="working">${rich(step.working, 'filled')}</div>`
            : `<div class="space" style="--lines:${Math.max(2, Math.ceil(String(step.working || '').split('\n').length))}"></div>`,
          '</li>',
        ].filter(Boolean).join('')).join('')}</ol>`,
      ].filter(Boolean).join('\n'), { open: true });

    case 'markdown':
    default:
      return box('note', block.title, rich(block.body || ''));
  }
}

// --- document ------------------------------------------------------------------

function coverHtml(model) {
  const meta = model.meta || {};
  return [
    '<section class="cover">',
    `<div class="course-line">${escapeHtml(meta.course || '')}</div>`,
    `<h1 class="book-title">${richTextInline(meta.title || '', { cloze: 'none' })}</h1>`,
    '<div class="cover-row">',
    `<div class="cover-book">${meta.book ? `Book ${escapeHtml(String(meta.book))}` : ''}</div>`,
    `<div class="cover-desc">${richTextInline(meta.description || '', { cloze: 'none' })}</div>`,
    '<div class="cover-meta">',
    meta.version ? `<div>Version: ${escapeHtml(meta.version)}</div>` : '',
    meta.feedbackUrl ? `<div>Feedback:<br>${escapeHtml(meta.feedbackUrl)}</div>` : '',
    '</div>',
    '</div>',
    // These spans feed the running header and footer through CSS `string-set`.
    `<span data-str hidden class="s-booktitle">${escapeHtml(meta.title || '')}</span>`,
    `<span data-str hidden class="s-version">${escapeHtml(meta.version || '')}</span>`,
    `<span data-str hidden class="s-feedback">${escapeHtml(meta.feedbackUrl || '')}</span>`,
    '<nav class="toc"><h2>Contents</h2><ol>',
    ...model.sections.map((s) => `<li><a href="#sec-${attr(s.slug)}">${escapeHtml(s.title)}</a></li>`),
    '</ol></nav>',
    '</section>',
  ].filter(Boolean).join('\n');
}

/**
 * @param {object} model the output of resolve.mjs resolveBooklet
 * @param {object} options `{ cache, bankSlug, baseUrl }`
 * @returns {{ html: string, stats: object }}
 */
export function buildHtml(model, { cache, bankSlug, css } = {}) {
  const stats = { cards: 0, blocks: 0, tikzTotal: 0, tikzCached: 0, tikzPending: 0 };
  const ctx = { output: model.output, tikz: null };
  const tikzContext = { cardId: '', widthCm: null };
  ctx.tikz = makeTikzRenderer({ cache, stats, context: tikzContext });

  const body = [];
  for (const section of model.sections) {
    body.push(`<section class="section" id="sec-${attr(section.slug)}">`);
    body.push(`<h1 class="section-title">${escapeHtml(section.title)}</h1>`);
    let pendingTier = null;
    for (const entry of section.items) {
      if (entry.kind === 'block') {
        stats.blocks++;
        tikzContext.cardId = entry.block.id;
        tikzContext.widthCm = null;
        body.push(blockHtml(entry, ctx, { bankSlug }));
      } else {
        stats.cards++;
        tikzContext.cardId = entry.card.id;
        tikzContext.widthCm = null;
        const question = questionHtml(entry, ctx, { bankSlug });
        if (entry.tierHeading) {
          // A tier heading must not be orphaned at the foot of a page.
          body.push(`<div class="keep"><h2 class="tier">${escapeHtml(entry.tierHeading)}</h2>${question}</div>`);
          pendingTier = entry.tierHeading;
        } else {
          body.push(question);
        }
      }
    }
    void pendingTier;
    body.push('</section>');
  }

  const html = [
    '<!doctype html>',
    '<html lang="en"><head>',
    '<meta charset="utf-8">',
    `<title>${escapeHtml(model.meta.title || model.slug || 'Booklet')}</title>`,
    '<link rel="stylesheet" href="/vendor/katex/katex.min.css">',
    '<link rel="stylesheet" href="/libs/tikzjax/fonts.css">',
    css ? `<style>\n${css}\n</style>` : '<link rel="stylesheet" href="/booklet.css">',
    '</head><body>',
    coverHtml(model),
    body.join('\n'),
    // Paged.js must not run on load: TikZJax has to finish first, or every figure
    // reflows after the page boxes have already been laid out.
    '<script>window.PagedConfig = { auto: false };</script>',
    '<script src="/libs/tikzjax/tikzjax.js"></script>',
    '<script src="/vendor/pagedjs/paged.polyfill.js"></script>',
    `<script>\n${pageScript()}\n</script>`,
    '</body></html>',
  ].join('\n');

  return { html, stats };
}

// The in-page control surface the renderer drives through page.evaluate.
function pageScript() {
  return `
window.__booklet = {
  // A wrapper is settled when TikZJax has replaced the loader with a real SVG (the loader
  // SVG contains an <animate>), or has failed and left its broken-image sentinel.
  pending() {
    return [...document.querySelectorAll('.tikz-pending')].filter((w) => {
      if (w.querySelector('img[src*="invalid.site"]')) return false;
      const svg = w.querySelector('svg');
      return !svg || svg.querySelector('animate');
    });
  },
  harvest() {
    return [...document.querySelectorAll('.tikz-pending')].map((w) => {
      const svg = w.querySelector('svg');
      const ok = svg && !svg.querySelector('animate');
      return { key: w.dataset.tikzKey, card: w.dataset.card, svg: ok ? svg.outerHTML : null };
    });
  },
  failRemaining() {
    const failed = [];
    for (const w of [...document.querySelectorAll('.tikz-pending')]) {
      const svg = w.querySelector('svg');
      if (svg && !svg.querySelector('animate')) { w.classList.remove('tikz-pending'); continue; }
      failed.push(w.dataset.card || w.dataset.tikzKey);
      w.innerHTML = '<div class="fig-error">TikZ failed: ' + (w.dataset.card || '') + '</div>';
      w.classList.remove('tikz-pending');
    }
    document.querySelectorAll('script[type="text/tikz"]').forEach((s) => s.remove());
    return failed;
  },
  // A cropped PNG's clip box needs the image's natural aspect ratio, which is only known
  // once it has loaded.
  async fixCrops() {
    const boxes = [...document.querySelectorAll('.crop-box')];
    await Promise.all(boxes.map((b) => {
      const img = b.querySelector('img');
      if (!img) return null;
      return img.complete ? null : new Promise((r) => { img.onload = r; img.onerror = r; });
    }));
    for (const b of boxes) {
      const img = b.querySelector('img');
      if (!img || !img.naturalWidth) continue;
      const kx = Number(b.dataset.kx) || 1;
      const ky = Number(b.dataset.ky) || 1;
      const ratio = (img.naturalHeight * ky) / (img.naturalWidth * kx);
      b.style.paddingBottom = (ratio * 100) + '%';
    }
    return boxes.length;
  },
  async paginate() {
    await document.fonts.ready;
    const flow = await new window.Paged.Previewer().preview();
    return flow.total;
  },
  overflow() {
    return [...document.querySelectorAll('.pagedjs_page_content')].map((c, i) => ({
      page: i + 1, over: c.scrollHeight - c.clientHeight,
    })).filter((x) => x.over > 2);
  },
  cardCount() { return document.querySelectorAll('article.q[data-card]').length; },
};`.trim();
}

export function loadCss() {
  const path = join(ROOT, 'scripts', 'booklet', 'booklet.css');
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}
