export const BOOKLET_PX_PER_MM = 96 / 25.4;
// Preserve the paginator's existing 12 px (3.175 mm) footer clearance.
export const BOOKLET_FOOTER_CLEARANCE = 12;

// Where each rendered question part ends (keyed by part id), in the same units as
// measureBookletPage's height and capacity. The paginator predicts a question's split
// point from one overflowing measurement instead of searching for it.
export function measurePartBottoms(root) {
  const paper = root.querySelector('.booklet-page'), main = paper?.querySelector('main');
  if (!main) return null;
  const scale = paper.getBoundingClientRect().width / (210 * BOOKLET_PX_PER_MM);
  if (!scale) return null;
  const top = main.getBoundingClientRect().top, bottoms = {};
  for (const element of main.querySelectorAll('[data-arrangement-id$=":question"]')) {
    const id = element.dataset.arrangementId.slice(0, -':question'.length), bottom = Math.round((element.getBoundingClientRect().bottom - top) / scale * 100) / 100;
    if (!(bottoms[id] >= bottom)) bottoms[id] = bottom;
  }
  return bottoms;
}

export function measureBookletPage(root) {
  const paper = root.querySelector('.booklet-page');
  const main = paper?.querySelector('main');
  const footer = paper?.querySelector('footer');
  if (!main || !footer) return null; // Covers have no editable body.
  const paperRect = paper.getBoundingClientRect();
  const scale = paperRect.width / (210 * BOOKLET_PX_PER_MM);
  if (!scale) return null;
  const body = main.getBoundingClientRect();
  const bottom = footer.getBoundingClientRect().top - BOOKLET_FOOTER_CLEARANCE * scale;
  const capacity = (bottom - body.top) / scale;
  // A KaTeX glyph's font box can hang below its block: a lower limit or subscript
  // sits at the formula's depth, and its font descent (drawn or not) lies beyond
  // the block's border box. The printed-PDF check measures those font boxes, so
  // the bottom block's maths counts too (7 November 2026: an integral's lower
  // limit ended 2.5 mm above the footer while the block reserved 3.2 mm).
  const MATH_GLYPHS = '.katex-html .mord,.katex-html .mop,.katex-html .mbin,.katex-html .mrel,.katex-html .mpunct,.katex-html .mopen,.katex-html .mclose';
  const contentBottom = element => {
    const children = [...element.children].filter(child => !child.matches('.document-end-insert,.document-group-tools,[data-page-guide]'));
    const last = children.at(-1), glyphs = last?.querySelectorAll ? [...last.querySelectorAll(MATH_GLYPHS)] : [];
    return Math.max(body.top, ...children.map(child => child.getBoundingClientRect().bottom), ...glyphs.map(glyph => glyph.getBoundingClientRect().bottom));
  };
  const columnElements = [...main.querySelectorAll(':scope > .answer-columns > .answer-column')];
  const ends = columnElements.length ? columnElements.map(contentBottom) : [contentBottom(main)];
  const height = (Math.max(...ends) - body.top) / scale;
  return {
    height, capacity,
    ...(paper.hasAttribute?.('data-short-answer-probe')?{
      answerColumnWidthMm:columnElements[0].getBoundingClientRect().width/scale/BOOKLET_PX_PER_MM,
      answerWidthsMm:[...main.querySelectorAll('.answer-width-probe')].map(e=>e.getBoundingClientRect().width/scale/BOOKLET_PX_PER_MM),
    }:{}),
    remainingMm: (capacity - height) / BOOKLET_PX_PER_MM,
    columns: ends.map(end => (bottom - end) / scale / BOOKLET_PX_PER_MM),
    overflowHeight: Math.max(0, (Math.max(...ends) - paperRect.bottom) / scale),
    paper: {left:paperRect.left,bottom:paperRect.bottom,width:paperRect.width,scale},
    // Viewport coordinates let guides follow both CSS zoom and transformed pages.
    body: {left:body.left, top:body.top, width:body.width, height:Math.max(0,bottom-body.top)},
  };
}

export function pageSpaceLabel(remainingMm) {
  return remainingMm < -0.2 / BOOKLET_PX_PER_MM
    ? `Overflow by ≈ ${Math.max(1, Math.ceil(-remainingMm))} mm`
    : `≈ ${Math.max(0, Math.round(remainingMm))} mm remaining`;
}
