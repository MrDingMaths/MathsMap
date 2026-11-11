// Layout faults measured on a rendered page (11 November 2026, user requested): after Paginate booklet
// changes a column layout, a question can spill into the page margin or two columns can overlap. The
// paginator only measures height, so this reads the rendered boxes. Pure over a DOM root: the probe
// calls it on each revealed page, and tests pass a fake tree.
//
// A fault is {id, kind, message}: id is the outer question, message is stable (no measurements) so
// the same fault compares equal between two trials. A candidate may not add a fault that the booklet
// did not already have (newLayoutFaults).
export const FAULT_LIMITS = Object.freeze({
  marginMm: 0.5,    // content may cross the body edge by this much (rounding, hairlines)
  overlapMm: 1,     // two columns overlap when they intersect by more than this in both directions
});

const PX_PER_MM = 96 / 25.4;
const SKIP = '.document-end-insert,.document-group-tools,[data-page-guide],[hidden]';

const intersects = (a, b, tol) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > tol && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > tol;
const visible = rect => rect.width > 0 && rect.height > 0;

export function findLayoutFaults(root, limits = FAULT_LIMITS) {
  const paper = root?.querySelector?.('.booklet-page'), main = paper?.querySelector('main');
  if (!main) return [];
  const scale = paper.getBoundingClientRect().width / (210 * PX_PER_MM);
  if (!scale) return [];
  const tol = {margin: limits.marginMm * PX_PER_MM * scale, overlap: limits.overlapMm * PX_PER_MM * scale};
  const body = main.getBoundingClientRect();
  const faults = [], seen = new Set();
  const add = (id, kind, message) => { const key = id + '|' + kind; if (!seen.has(key)) { seen.add(key); faults.push({id, kind, message}); } };
  const outer = [...main.querySelectorAll('[data-question-id]')].filter(el => !el.parentElement?.closest('[data-question-id]'));
  for (const question of outer) {
    const id = question.dataset.questionId;
    // Column cells and content: every arrangement item, picture and table inside the question.
    const items = [...question.querySelectorAll('[data-arrangement-id],img,svg,table')].filter(el => !el.matches(SKIP) && !el.closest(SKIP));
    const boxes = items.map(el => ({el, rect: el.getBoundingClientRect()})).filter(({rect}) => visible(rect));
    for (const {rect} of boxes) {
      if (rect.left < body.left - tol.margin || rect.right > body.left + body.width + tol.margin) { add(id, 'margin-overflow', 'content runs past the page margin'); break; }
    }
    // Overlap between cells that are not nested in each other (siblings in a grid or column row). Only
    // arrangement cells count: a picture or SVG drawn over its own table (a puzzle grid) is intended.
    const cells = boxes.filter(({el}) => el.dataset?.arrangementId !== undefined);
    const leaves = cells.filter(({el}) => !cells.some(other => other.el !== el && el.contains(other.el)));
    outerLoop: for (let i = 0; i < leaves.length; i++) {
      for (let j = i + 1; j < leaves.length; j++) {
        if (leaves[i].el.contains(leaves[j].el) || leaves[j].el.contains(leaves[i].el)) continue;
        if (intersects(leaves[i].rect, leaves[j].rect, tol.overlap)) { add(id, 'column-overlap', 'columns overlap'); break outerLoop; }
      }
    }
  }
  return faults;
}

// Faults in `result` that neither the known set nor the booklet's first measurement had.
// `known` is a Set of keys from faultKey(); pass the faults of every adopted result.
export const faultKey = f => f.id + '|' + f.kind;
export function newLayoutFaults(known, result) {
  return (result?.layoutFaults ?? []).filter(f => !known.has(faultKey(f)));
}
export function rememberFaults(known, result) {
  for (const f of result?.layoutFaults ?? []) known.add(faultKey(f));
  return known;
}
