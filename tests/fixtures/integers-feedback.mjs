// Historical feedback transformation retained only for regression tests.
import {applyContentOverrides,contentHash} from '../../scripts/booklet/transcription.mjs';
export const FEEDBACK_REVISION = 'integers-v2-feedback-2026-09-05';
export const FEEDBACK_PAGES = [1, 29, 30, 31, 32, 33, 37, 46];
const clone = (value) => structuredClone(value);
function walk(value, visit) {
  if (!value || typeof value !== 'object') return;
  visit(value);
  for (const child of Object.values(value)) walk(child, visit);
}
function indexRoots(transcription) {
  const roots = new Map();
  walk(transcription.pages, (item) => { if (item.id) roots.set(item.id, item); });
  return roots;
}

// Positive-y cubic arches avoid direction-dependent bend semantics. Both layers
// reserve the same explicit extents before drawing (TikZJax-compatible).
export function numberLineLayer(min, max, jumps = null) {
  const bounds = `(${min - .5},-.8) rectangle (${max + .5},1.1)`;
  const drawing = jumps
    ? jumps.map(([from, to]) => `\\draw[thick,red!70!black,->] (${from},.28) .. controls (${from},.92) and (${to},.92) .. (${to},.28);`).join('')
    : `\\draw[thick,<->] (${min - .5},0)--(${max + .5},0);\\foreach \\x in {${Array.from({ length: max - min + 1 }, (_, index) => min + index).join(',')}}{\\draw[thick] (\\x,.15)--(\\x,-.15) node[below]{\\small $\\x$};}`;
  return `\\begin{tikzpicture}[x=0.7cm,>=stealth]\\path[use as bounding box] ${bounds};${drawing}\\end{tikzpicture}`;
}

export function repairIntegersFeedback(raw, originalReview, at = new Date().toISOString()) {
  applyContentOverrides(raw, originalReview); // Fail before writing if existing edits are stale.
  if (originalReview.history?.some((entry) => entry.type === FEEDBACK_REVISION)) return { transcription: clone(raw), review: clone(originalReview), changed: false };
  const transcription = clone(raw);
  const review = clone(originalReview);
  const roots = indexRoots(transcription);
  const root = (id) => { if (!roots.has(id)) throw new Error(`Missing feedback target: ${id}`); return roots.get(id); };
  const changes = [];
  function set(id, key, value) {
    // Never silently replace an independently edited field.
    if (review.contentOverrides?.[id]?.['/' + key]) throw new Error(`Feedback target has a review edit: ${id}/${key}`);
    root(id)[key] = value;
    changes.push({ rootId: id, field: key });
  }
  set('page-30-worked-example', 'presentation', { layout: 'columns', columns: 3, numberSteps: false });
  for (const number of [31, 33]) {
    const page = root(`page-${number}`);
    if (review.contentOverrides?.[page.id]?.['/section/title'] || review.contentOverrides?.[page.id]?.['/section']) throw new Error(`Page ${number} title has a review edit`);
    set(page.id, 'section', { ...page.section, title: 'Foundation', headingStyle: 'difficulty' });
  }
  set('page-32-theory', 'contentLayout', 'numbered-rules');
  set('page-32-worked-example', 'presentation', { layout: 'worked-rows', numberSteps: true });
  for (const [index, min, max, jumps] of [[1, -5, 1, [[-2, -3], [-3, -4], [-4, -5]]], [2, -9, -3, [[-6, -5], [-5, -4]]]]) {
    for (const [suffix, code] of [['base', numberLineLayer(min, max)], ['overlay', numberLineLayer(min, max, jumps)]]) {
      const id = `page-32-number-line-${index}-${suffix}`;
      set(id, 'code', code);
      review.diagrams ??= {};
      review.diagrams[id] = { ...(review.diagrams[id] ?? {}), accepted: false };
    }
  }
  for (const node of root('page-32-guided-practice-content').children) set(node.id, 'responseSpace', 'scaffold');
  review.layoutOverrides ??= {};
  review.layoutOverrides.diagramColourModes ??= {};
  walk(root('page-46').blocks, (item) => {
    if (item.id && item.src && item.format !== 'tikz') review.layoutOverrides.diagramColourModes[item.id] = 'grayscale';
  });
  // Only metadata/diagram code changed on these roots. Retain all original
  // review values (including width and answer-space edits) with current hashes.
  for (const [id, fields] of Object.entries(review.contentOverrides ?? {})) {
    const updatedRoot = roots.get(id);
    if (!updatedRoot) throw new Error(`Review root disappeared: ${id}`);
    for (const record of Object.values(fields)) record.beforeHash = contentHash(updatedRoot);
  }
  for (const page of review.pages ?? []) if (FEEDBACK_PAGES.includes(page.pageNumber)) page.accepted = false;
  review.history ??= [];
  review.history.push({ at, type: FEEDBACK_REVISION, pages: FEEDBACK_PAGES, changes, note: 'Pilot feedback corrections; question order and existing review edits retained. Visual approval remains with the reviewer.' });
  applyContentOverrides(transcription, review);
  return { transcription, review, changed: true };
}
