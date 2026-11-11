// The optimiser's view of a hidden FlowBookletPreview probe, shared by the
// Optimise pagination panel and Fit whole exercise. show(project, edition)
// renders the candidate and resolves once the probe has updated.
import {measureBookletPage} from './booklet-page-space.js';
import {findLayoutFaults} from './booklet-layout-faults.js';

export function probePagination({show, probe}) {
  // Pages as the optimiser reads them. Only the pages holding the focus blocks are
  // measured: their space left and the heights of their questions.
  async function paginate(next, focus) {
    await show(next, 'student');
    const map = await probe().waitUntilReady({allowIssues: true});
    const wanted = new Set(focus?.blockIds ?? []);
    const identity = b => b.flow?.continuationOf ?? b.continuationOf ?? b.id;
    const pages = map.pages.map(p => ({blocks: p.blocks.map(b => ({id: b.id, flow: {continuationOf: b.flow?.continuationOf, fragment: b.flow?.fragment}, continuationOf: b.continuationOf, parts: b.content?.children?.length ?? null})), mode: p.mode}));
    const layoutFaults = [];
    for (const [i, page] of map.pages.entries()) {
      if (!page.blocks.some(b => wanted.has(b.id) || wanted.has(identity(b)))) continue;
      const root = await probe().revealPage(i), space = root && measureBookletPage(root);
      if (!space) continue;
      layoutFaults.push(...findLayoutFaults(root));
      const paper = root.querySelector('.booklet-page'), k = 210 / paper.getBoundingClientRect().width;
      const outer = [...root.querySelectorAll('[data-question-id]')].filter(el => !el.parentElement?.closest('[data-question-id]'));
      pages[i].space = {capacityMm: space.capacity / (96 / 25.4), usedMm: space.height / (96 / 25.4), remainingMm: space.remainingMm};
      pages[i].elements = outer.map(el => ({id: el.dataset.questionId, kind: 'question', h: el.getBoundingClientRect().height * k}));
    }
    // layoutFaults: boxes past the margin or columns overlapping on the measured pages; kept apart from
    // `issues` so a fault the booklet already had does not stop the optimiser from running.
    return {pages, issues: map.issues, layoutFaults};
  }
  // The short and worked editions may not gain pages.
  async function guard(next) {
    const out = {};
    for (const edition of ['short', 'worked']) { await show(next, edition); out[edition] = (await probe().waitUntilReady({allowIssues: true})).pages.length; }
    await show(next, 'student');
    return out;
  }
  return {paginate, guard};
}

export function describeMove(m, label) {
  const name = id => label[id] ?? id;
  return m.type === 'reorder' ? `${m.blockIds.map(name).join(', ')} moved before ${m.jumped.length ? name(m.jumped[0]) : 'the next question'} (${m.reason})`
    : m.type === 'tighten' ? `${name(m.blockId)} working space ${m.before} → ${m.after} mm` : m.type === 'keep-together' ? `${name(m.blockId)} kept on one page (${m.reason})` : `${name(m.blockId)} parts in two columns`;
}
