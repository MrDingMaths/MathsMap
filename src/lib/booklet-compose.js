// Paginate booklet (11 November 2026, user approved): one pass that applies
// docs/booklet-pagination-principles.md to a whole booklet. Pure: the real paginator is
// reached only through `paginate(candidate, focus)`, the same callback the pagination
// optimiser uses (Studio: probePagination over a hidden preview; tests: a fake), so the
// pass never estimates page geometry itself.
//
// Phases, in order (principle letters in brackets):
//   0. normalise  source page boundaries inside a topic are cleared (A5);
//   1. layout     calibrated, rounded, row-uniform working space (C5); zero working space
//                 beside a left-aligned diagram (C3); one column per worked example (C4);
//                 part grids by prompt length (C1);
//   2. starts     a lesson after a lesson-closing block starts a page (A2); a mixed-review
//                 exercise flows on after its repeated theory (A3);
//   3. lessons    a lesson split across pages is tightened onto one page, or split at the
//                 preferred boundary, and key ideas never start a page alone (B1-B3); then a split
//                 question is tightened onto one page or kept whole on the next (B4);
//   4. exercises  the pagination optimiser per exercise (B4-B5);
//   5. fill       a page's trailing space is shared out among its working spaces (D).
// Every phase is a trial measured by `paginate`: it is kept only if it passes the hard
// guards and does not make the objective worse (E). Every kept change is reported.
import {isPractice} from './booklet-flow.js';
import {blockPages, newIssues} from './booklet-layout-actions.js';
import {setPageBoundary} from './booklet-workspace.js';
import {resolveArrangement, findContent} from './booklet-arrangement.js';
import {arrangementItems} from '../../public/libs/maths-editor/arrangement-model.mjs';
import {workingSpaceFloor, allowanceCopies, importedAllowance, stillImportAllowance} from './booklet-working-space.js';
import {hasTeacherReview, spacingProtected} from './booklet-import-spacing.js';
import {searchFit, FIT_DEFAULTS} from './booklet-fit.js';
import {optimisePagination, gridBlock} from './booklet-pagination-optimiser.js';
import {newLayoutFaults, rememberFaults} from './booklet-layout-faults.js';
import {teacherBlocks, polishSafetyIssues} from '../../polish/guards.mjs';

export const COMPOSE_LIMITS = Object.freeze({
  halfEmpty: 0.5,            // B6: a mid-section page with more than this share free is a defect
  textWidthMm: 180,          // page body width
  sideFreeMm: 60,            // C3: free width right of a diagram that counts as working space
  fillCapRatio: 1.5,         // D: an allowance grows at most to 1.5x ...
  fillCapMm: 25,             // ... or by 25 mm, whichever is smaller
  fillMarginMm: 2,           // D: space kept free when filling
  fillMinMm: 4,              // D: a page with less trailing space than this is left as it is
  fillTrials: 6,
  gridChars: [[26, 4], [45, 3], [80, 2]],  // C1: longest prompt -> columns
  gridMinParts: 3, gridMaxParts: 16,
  workedColumnsMax: 3,       // C4
  workedLineChars: 34,       // C4: longest working line per column at three columns, scaled by columns
});
// C5: allowances snap up to these values, then to steps of 5 mm.
export const ROUND_STEPS = Object.freeze([0, 6, 8, 10, 12, 15, 20, 25, 30, 35, 40]);
export const snapUp = mm => {
  if (!(mm > 0)) return 0;
  const step = ROUND_STEPS.find(s => s >= mm - 0.01);
  return step ?? Math.ceil(mm / 5) * 5;
};

// ---- roles and lessons -------------------------------------------------------------------

export const roleOf = block => block.type === 'page-break' ? 'break' : block.pedagogyRole ?? block.sourceAtom?.kind ?? (isPractice(block) ? 'question' : block.type);
const LESSON_START = new Set(['definition', 'theory', 'instruction', 'review']);
const LESSON_CLOSE = new Set(['key-ideas', 'guided-practice', 'identify', 'investigation']);
const visible = block => !block.presentation?.editorOnly;
const blocksOf = project => project.sections.flatMap(s => s.blocks);

// Topics in booklet order: {topicId, teaching:[blocks], practice:[sections]}.
export function topicsOf(project) {
  const topics = [];
  for (const section of project.sections) {
    if (section.role === 'candidate-pool' || section.phase === 'front-matter' || section.phase === 'cover') continue;
    let topic = topics.at(-1);
    if (!topic || topic.topicId !== section.topicId) topics.push(topic = {topicId: section.topicId, teaching: [], practice: [], sections: []});
    topic.sections.push(section);
    if (section.phase === 'practice') topic.practice.push(section);
    else topic.teaching.push(...section.blocks.filter(visible));
  }
  return topics;
}

// A lesson starts at a theory-like block that follows a lesson-closing block (or opens the
// topic). Review attaches to the lesson it opens. Page-break blocks are not lesson members.
export function lessonsOf(teaching) {
  const lessons = [];
  let previous = null;
  for (const block of teaching) {
    const role = roleOf(block);
    if (role === 'break') continue;
    const opens = !lessons.length || LESSON_START.has(role) && previous && LESSON_CLOSE.has(previous);
    if (opens) lessons.push({blocks: [], closedBy: previous});
    lessons.at(-1).blocks.push(block);
    previous = role;
  }
  return lessons.map((lesson, index) => ({...lesson, index, ids: lesson.blocks.map(b => b.id), first: lesson.blocks[0]}));
}

// B2: preferred split boundaries in a lesson, best first: before its guided practice, then before its example.
export function lessonBoundaries(lesson) {
  const at = role => lesson.blocks.findIndex((b, i) => i > 0 && roleOf(b) === role);
  return [at('guided-practice'), at('example')].filter(i => i > 0).filter((i, k, all) => all.indexOf(i) === k);
}

// A3: a mixed-review exercise is led in only by repeated theory: no example, guided practice, identify or
// investigation in its topic's teaching, and at most two teaching blocks (or a title that says review).
export function isMixedReview(topic, titleOf = () => '') {
  if (!topic.practice.length || !topic.teaching.length) return false;
  const roles = topic.teaching.map(roleOf).filter(r => r !== 'break');
  if (roles.some(r => ['example', 'guided-practice', 'identify', 'investigation'].includes(r))) return false;
  return roles.length <= 2 || /\b(mixed|review|revision|consolidat)/i.test(titleOf(topic.topicId) ?? '');
}

// A5: the same rule as polish/normalise.mjs clearSourceBreaks (kept browser-safe here): a source page boundary
// that is neither an exercise or section start, nor a topic's first block, nor a manual break, is cleared.
// Mutates `project` (a copy); returns the ids changed.
export function clearSourceBreaks(project, {protectedIds = new Set()} = {}) {
  const changed = [];
  let previousTopic;
  for (const section of project.sections ?? []) {
    const newTopic = section.topicId !== previousTopic; previousTopic = section.topicId;
    if (section.phase === 'front-matter' || section.phase === 'cover') continue;
    const sectionStart = section.role === 'exercise' || section.phase === 'practice' || section.pageBreakBefore;
    (section.blocks ?? []).forEach((block, index) => {
      if (!block.flow?.sourcePageBreakBefore || block.flow.pageBreakBefore === true || protectedIds.has(block.id) || index === 0 && (sectionStart || newTopic)) return;
      block.flow = {...block.flow, sourcePageBreakBefore: false};
      changed.push(block.id);
    });
  }
  return changed;
}

// ---- metrics and objective (E) ----------------------------------------------------------------

const identity = b => b.flow?.continuationOf ?? b.continuationOf ?? b.id;

// Blocks that open a unit: a topic or section, an exercise, a lesson. A page before one of these, or the last
// page of its topic, is the end of a unit, so its whitespace is not a defect (B6). A break inside a lesson
// (before its guided practice, say) does not excuse the space it leaves.
function unitStarts(project) {
  const ids = new Set();
  let previousTopic;
  for (const section of project.sections) {
    const blocks = section.blocks.filter(visible).filter(b => b.type !== 'page-break');
    if (!blocks.length) continue;
    if (section.topicId !== previousTopic || section.pageBreakBefore !== false) ids.add(blocks[0].id);
    previousTopic = section.topicId;
    if (section.phase === 'practice' && blocks[0].flow?.exercisePageBreakBefore !== false) ids.add(blocks[0].id);
  }
  for (const topic of topicsOf(project)) for (const lesson of lessonsOf(topic.teaching)) ids.add(lesson.first.id);
  return ids;
}

export function composeMetrics(project, map, {ids = null, limits = COMPOSE_LIMITS} = {}) {
  const pages = map.pages ?? [], scope = ids ? new Set(ids) : null;
  const inScope = page => !scope || page.blocks.some(b => scope.has(b.id) || scope.has(identity(b)));
  const byId = new Map(blocksOf(project).map(b => [b.id, b]));
  const forced = unitStarts(project);
  const topicOf = new Map(project.sections.flatMap(s => s.blocks.map(b => [b.id, s.topicId])));
  let splitQuestions = 0, splitLessons = 0, halfEmpty = 0;
  const splitIds = [], halfEmptyPages = [];
  const seen = new Set();
  for (const page of pages) for (const b of page.blocks) {
    const id = identity(b), block = byId.get(id);
    if (seen.has(id) || !block || scope && !scope.has(id)) continue;
    seen.add(id);
    if (block.type === 'question' && blockPages(map, id).length > 1) { splitQuestions++; splitIds.push(id); }
  }
  for (const topic of topicsOf(project)) for (const lesson of lessonsOf(topic.teaching)) {
    if (scope && !lesson.ids.some(id => scope.has(id))) continue;
    const spans = [...new Set(lesson.ids.flatMap(id => blockPages(map, id)))].sort((a, b) => a - b);
    if (spans.length < 2) continue;
    // A split exactly at a preferred boundary costs its rank; anything else costs more.
    const firstOn = page => lesson.ids.findIndex(id => blockPages(map, id)[0] === page);
    const cuts = spans.slice(1).map(firstOn);
    const preferred = lessonBoundaries(lesson);
    splitLessons += cuts.reduce((total, cut) => total + (preferred.indexOf(cut) >= 0 ? 1 + preferred.indexOf(cut) : preferred.length + 2), 0);
  }
  pages.forEach((page, i) => {
    if (!inScope(page) || i === pages.length - 1 || !page.space) return;
    const next = pages[i + 1], firstNext = next?.blocks[0], lastHere = page.blocks.at(-1);
    if (!firstNext || forced.has(identity(firstNext)) || topicOf.get(identity(firstNext)) !== topicOf.get(identity(lastHere))) return;
    if (page.space.remainingMm > page.space.capacityMm * limits.halfEmpty) { halfEmpty++; halfEmptyPages.push(i + 1); }
  });
  return {splitQuestions, splitLessons, halfEmpty, pages: pages.length, splitIds, halfEmptyPages};
}

const ORDER = ['splitQuestions', 'splitLessons', 'halfEmpty', 'pages'];
// -1 when a is better, 1 when worse, 0 when level.
export function compareMetrics(a, b) {
  for (const key of ORDER) if (a[key] !== b[key]) return a[key] < b[key] ? -1 : 1;
  return 0;
}

// ---- allowance editing ------------------------------------------------------------------------

const withBlock = (project, blockId, fn) => ({...project, sections: project.sections.map(s => s.blocks.some(b => b.id === blockId) ? {...s, blocks: s.blocks.map(b => b.id === blockId ? fn(structuredClone(b)) : b)} : s)});

// Set every stored copy of a part's allowance (answerSpaceMm, answerSpaces[id], saved space items).
export function setAllowance(project, blockId, nodeId, mm) {
  let next = withBlock(project, blockId, block => { const node = findContent(block, nodeId); if (node) node.answerSpaceMm = mm; return block; });
  const overrides = next.settings?.layoutOverrides ?? {};
  const answerSpaces = Number.isFinite(overrides.answerSpaces?.[nodeId]) ? {...overrides.answerSpaces, [nodeId]: mm} : overrides.answerSpaces;
  let blockLayouts = overrides.blockLayouts;
  const saved = blockLayouts?.[blockId]?.arrangement;
  if (saved) {
    const tree = structuredClone(saved);
    let touched = false;
    for (const item of arrangementItems(tree.root)) if (item.ref === nodeId + '/space' && Number.isFinite(item.height)) { item.height = mm; touched = true; }
    if (touched) blockLayouts = {...blockLayouts, [blockId]: {...blockLayouts[blockId], arrangement: tree}};
  }
  return {...next, settings: {...next.settings, layoutOverrides: {...overrides, ...(answerSpaces ? {answerSpaces} : {}), ...(blockLayouts ? {blockLayouts} : {})}}};
}
const currentAllowance = (project, node) => project.settings?.layoutOverrides?.answerSpaces?.[node.id] ?? node.answerSpaceMm;
const leaves = block => { const out = []; const visit = n => { if (!n || typeof n !== 'object') return; if (n.children?.length) n.children.forEach(visit); else if (n.answer) out.push(n); }; visit(block.content); return out; };
const responseKind = (block, node) => block.sourceReview?.responses?.find(r => r.targetId === node.id)?.kind ?? 'working';
const floorOf = (block, node, reviewed) => { try { return workingSpaceFloor(block, node, {reviewed}); } catch { return null; } };

// ---- phase 1: block layout ---------------------------------------------------------------------

// C5: allowances still at their import value come to the calibrated value, rounded up to a house step;
// the parts of one grid row then share the row's largest value.
export function calibrateAllowances(project, blockIds) {
  const changes = [], reviewed = hasTeacherReview(project);
  let next = project;
  for (const id of blockIds) {
    const block = blocksOf(next).find(b => b.id === id);
    if (!block || block.type !== 'question' || spacingProtected(block)) continue;
    const parts = leaves(block), target = new Map();
    for (const node of parts) {
      const now = currentAllowance(next, node);
      if (!Number.isFinite(now) || !stillImportAllowance(allowanceCopies(next, block, node), importedAllowance(block, node.id))) continue;
      const floor = floorOf(block, node, reviewed);
      if (floor == null) continue;
      target.set(node.id, floor === 0 ? 0 : snapUp(floor));
    }
    // One value per grid row.
    const root = block.content, columns = root?.layout === 'grid' ? Math.max(1, Number(root.columns) || 1) : 1;
    if (columns > 1 && root.children?.every(c => !c.children?.length)) {
      for (let row = 0; row < root.children.length; row += columns) {
        const members = root.children.slice(row, row + columns).filter(c => target.has(c.id));
        const top = Math.max(0, ...members.map(c => target.get(c.id)));
        for (const c of members) if (target.get(c.id) > 0) target.set(c.id, top);
      }
    }
    for (const node of parts) {
      if (!target.has(node.id)) continue;
      const before = currentAllowance(next, node), after = target.get(node.id);
      if (Math.abs(before - after) < 0.01) continue;
      next = setAllowance(next, block.id, node.id, after);
      changes.push({kind: 'working-space', blockId: block.id, nodeId: node.id, before, after, reason: 'calibrated allowance, rounded to a house step'});
    }
  }
  return {project: next, changes};
}

// C3: a simple question whose single diagram sits below its prompt, left-aligned, with at least `sideFreeMm`
// free to its right: that space is the working space, so its own allowance is 0 mm. The diagram must be at
// least as tall (estimated) as the allowance it replaces. Questions with a saved row arrangement, a diagram
// beside the prompt, or several parts are left alone.
export function diagramSideCredits(project, blockIds, limits = COMPOSE_LIMITS) {
  const changes = [], reviewed = hasTeacherReview(project), overrides = () => next.settings?.layoutOverrides ?? {};
  let next = project;
  for (const id of blockIds) {
    const block = blocksOf(next).find(b => b.id === id);
    if (!block || block.type !== 'question' || spacingProtected(block)) continue;
    const root = block.content, parts = leaves(block);
    if (!root || parts.length !== 1 || parts[0] !== root && parts[0] !== root.children?.[0] || root.children?.length > 1) continue;
    const node = parts[0], diagrams = root.questionDiagrams ?? [];
    if (diagrams.length !== 1 || ['beside-prompt', 'right-of-prompt', 'before-prompt', 'above-prompt'].includes(root.diagramPlacement)) continue;
    if (!['working', 'short'].includes(responseKind(block, node))) continue;
    const diagram = diagrams[0];
    const width = overrides().blockLayouts?.[diagram.id]?.diagramWidthMm ?? diagram.widthMm;
    if (!(width > 0) || limits.textWidthMm - width < limits.sideFreeMm) continue;
    if (!stillImportAllowance(allowanceCopies(next, block, node), importedAllowance(block, node.id))) continue; // a teacher's value stays
    const now = currentAllowance(next, node), floor = floorOf(block, node, reviewed);
    const height = Number(diagram.heightMm) > 0 ? Number(diagram.heightMm) : width * 0.7;
    if (!(now > 0) || floor == null || height < Math.min(now, floor || now)) continue;
    // The resolved arrangement must keep the diagram in a stack (no row) and left-aligned.
    const saved = overrides().blockLayouts?.[block.id]?.arrangement;
    const resolved = resolveArrangement(block, saved, overrides(), limits.textWidthMm), tree = structuredClone(resolved.tree);
    let inRow = false, diagramItem = null;
    const walk = (n, row) => { if (n.type === 'item') { if (resolved.entries.get(n.ref)?.kind === 'diagram') { diagramItem = n; inRow ||= row; } return; } (n.children ?? []).forEach(c => walk(c, row || n.direction === 'row')); };
    walk(tree.root, false);
    if (!diagramItem || inRow) continue;
    next = withBlock(next, block.id, b => { const d = findContent(b, root.id)?.questionDiagrams?.[0]; if (d) d.align = 'left'; return b; });
    if (saved) {
      diagramItem.align = 'left';
      const o = overrides();
      next = {...next, settings: {...next.settings, layoutOverrides: {...o, blockLayouts: {...o.blockLayouts, [block.id]: {...o.blockLayouts[block.id], arrangement: tree}}}}};
    }
    next = setAllowance(next, block.id, node.id, 0);
    changes.push({kind: 'diagram-side-space', blockId: block.id, nodeId: node.id, before: now, after: 0, reason: `${Math.round(limits.textWidthMm - width)} mm beside the left-aligned diagram is the working space`});
  }
  return {project: next, changes};
}

// Visible text of a string or a maths-editor document (paragraph inlines, maths sources), one line per paragraph.
const plain = value => {
  if (typeof value === 'string') return value;
  if (value?.format === 'maths-editor-document-v1') {
    const lines = [];
    const walk = n => { if (!n || typeof n !== 'object') return; if (Array.isArray(n)) return n.forEach(walk); if (n.inlines) lines.push(n.inlines.map(i => i.text ?? i.latex ?? i.source ?? '').join('')); for (const [k, v] of Object.entries(n)) if (k !== 'inlines' && v && typeof v === 'object') walk(v); };
    walk(value.blocks);
    return lines.join('\n');
  }
  return JSON.stringify(value ?? '');
};
const visibleChars = value => plain(value).replace(/\\(?:dfrac|tfrac|frac)/g, '/').replace(/\\[a-zA-Z]+/g, 'x').replace(/[{}$&_^\\]/g, '').length;

// Widest cloze in a prompt, in mm (document cloze inlines carry `width`; otherwise 2.2 mm per answer character + 6).
const clozeWidthMm = value => {
  let widest = 0;
  const walk = n => { if (!n || typeof n !== 'object') return; if (Array.isArray(n)) return n.forEach(walk); if (n.type === 'cloze') widest = Math.max(widest, Number(n.width) || String(n.answer ?? '').length * 2.2 + 6); Object.values(n).forEach(v => v && typeof v === 'object' && walk(v)); };
  walk(value);
  return widest;
};
const columnWidthMm = (columns, limits) => (limits.textWidthMm - (columns - 1) * 6) / columns - 8;

// C1: a list of short parts becomes a grid with as many columns as the longest prompt allows.
export function gridColumnsFor(block, limits = COMPOSE_LIMITS) {
  const root = block.content, parts = root?.children;
  if (!parts || parts.length < limits.gridMinParts || parts.length > limits.gridMaxParts || root.layout === 'grid') return null;
  if (root.questionDiagrams?.length || root.representations || parts.some(p => p.children?.length || p.questionDiagrams?.length || p.dependsOn?.length)) return null;
  if (parts.some(p => /\\begin|"type":"table"/.test(plain(p.prompt)))) return null;
  const longest = Math.max(...parts.map(p => visibleChars(p.prompt)));
  let columns = limits.gridChars.find(([chars]) => longest <= chars)?.[1] ?? 1;
  if (parts.length === 4 && columns > 2) columns = 2; // four parts: 2 x 2
  columns = Math.min(columns, parts.length);
  // A cloze keeps its handwriting width: the column must hold the widest one (house rule, CSR:579).
  const clozeMm = Math.max(0, ...parts.map(p => clozeWidthMm(p.prompt)));
  while (columns > 1 && clozeMm > columnWidthMm(columns, limits)) columns--;
  return columns > 1 ? columns : null;
}

// C4: a columns worked-example block shows one column per example when its working lines are short enough.
export function workedColumnsFor(block, limits = COMPOSE_LIMITS) {
  if (block.type !== 'worked-example' || block.presentation?.layout !== 'columns') return null;
  const examples = block.examples ?? [];
  const n = examples.length;
  if (n < 2 || n > limits.workedColumnsMax || Number(block.presentation?.columns) === n) return null;
  if (examples.some(e => [...(e.diagrams ?? []), ...(e.questionDiagrams ?? []), ...(e.solutionDiagrams ?? [])].length)) return null;
  const lines = examples.flatMap(e => [e.prompt, e.theorySolution, e.solution, ...(e.steps ?? []).flatMap(s => [s.working, s.text, s.explanation])]).filter(Boolean)
    .flatMap(v => plain(v).split(/\\\\|\n/));
  const longest = Math.max(0, ...lines.map(visibleChars));
  return longest <= limits.workedLineChars * 3 / n ? n : null;
}

// ---- the pass ------------------------------------------------------------------------------------

// options.includeReviewed: the teacher accepts changes to reviewed blocks (Studio's Accept, or the CLI's
// --accept-reviewed). Without it reviewed blocks are never changed and trials touching them are dropped.
export async function composeBooklet(source, {paginate, guard = null, includeReviewed = false, limits = COMPOSE_LIMITS, onprogress = null, shouldStop = () => false, phases = null, now = () => new Date().toISOString()} = {}) {
  if (typeof paginate !== 'function') throw Error('composeBooklet needs a paginate callback');
  const enabled = name => !phases || phases.includes(name);
  const protectedIds = includeReviewed ? new Set() : new Set([...teacherBlocks(source)]);
  const changes = [], rejected = [];
  let trials = 0;
  const baseline = await paginate(source, {blockIds: blocksOf(source).map(b => b.id)});
  if ((baseline.issues ?? []).some(i => i.kind === 'oversized-content')) rejected.push({reason: 'baseline-oversized', ids: baseline.issues.filter(i => i.kind === 'oversized-content').map(i => i.id)});
  const before = composeMetrics(source, baseline, {limits});
  let project = source, map = baseline;
  // Layout faults the booklet already had (measured on the whole booklet) are not this pass's doing.
  const knownFaults = rememberFaults(new Set(), baseline);

  // Principle-sanctioned guard findings: these are what the rules ask for, not damage.
  const sanctioned = (issue, allow) => allow.some(prefix => issue.startsWith(prefix));
  const touchesProtected = candidate => { for (const id of protectedIds) { const a = blocksOf(project).find(b => b.id === id), b = blocksOf(candidate).find(b => b.id === id); if (JSON.stringify(a) !== JSON.stringify(b)) return true; } return false; };

  // One trial over a focus (block ids): guards, then the objective on that focus.
  const trial = async (candidate, label, {ids, allow = [], accept = (after, was) => compareMetrics(after, was) <= 0} = {}) => {
    if (shouldStop()) return null;
    if (touchesProtected(candidate)) { rejected.push({label, reason: 'reviewed'}); return null; }
    const unsafe = polishSafetyIssues(project, candidate, {reference: source, protectedIds, spacing: true}).filter(issue => !sanctioned(issue, allow) && !(includeReviewed && /teacher|reviewed/.test(issue)));
    if (unsafe.length) { rejected.push({label, reason: 'safety', issues: unsafe.slice(0, 3)}); return null; }
    trials++;
    let result;
    try { result = await paginate(candidate, {blockIds: ids}); } catch (error) { rejected.push({label, reason: 'pagination-error', message: error.message}); return null; }
    if ((result.issues ?? []).some(i => i.kind === 'oversized-content') && newIssues(map, result).some(i => i.kind === 'oversized-content')) { rejected.push({label, reason: 'oversized-content'}); return null; }
    if (newIssues(map, result).length) { rejected.push({label, reason: 'pagination-issue'}); return null; }
    // A column change must not push content past the margin or make columns overlap.
    const faults = newLayoutFaults(knownFaults, result);
    if (faults.length) { rejected.push({label, reason: 'layout-fault', faults: faults.slice(0, 3).map(f => ({id: f.id, kind: f.kind}))}); return null; }
    const after = composeMetrics(candidate, result, {ids, limits}), was = composeMetrics(project, map, {ids, limits});
    if (!accept(after, was, result)) { rejected.push({label, reason: 'not-better', before: was, after}); return null; }
    return {result, after};
  };
  const adopt = (candidate, outcome, made) => { project = candidate; map = outcome.result; rememberFaults(knownFaults, outcome.result); changes.push(...made); };

  // Phase 0: source boundaries inside a topic (A5).
  if (enabled('normalise')) {
    const candidate = structuredClone(project), cleared = clearSourceBreaks(candidate, {protectedIds});
    if (cleared.length) {
      const outcome = await trial(candidate, 'normalise', {ids: blocksOf(candidate).map(b => b.id), accept: () => true});
      if (outcome) adopt(candidate, outcome, cleared.map(blockId => ({kind: 'source-break-cleared', blockId, reason: 'source page boundary inside a topic is not kept'})));
    }
  }

  const topics = topicsOf(project);
  for (const [position, topic] of topics.entries()) {
    if (shouldStop()) break;
    onprogress?.({phase: 'topic', topic: position + 1, topics: topics.length, trials});
    const current = () => topicsOf(project).find(t => t.topicId === topic.topicId) ?? topic;
    const topicIds = () => current().sections.flatMap(s => s.blocks.map(b => b.id));
    const editable = () => topicIds().filter(id => !protectedIds.has(id));

    // Phase 1: block layout, one kind at a time so a bad kind does not sink the others.
    if (enabled('layout')) {
      const steps = [
        ['working-space', p => calibrateAllowances(p, editable())],
        ['diagram-side-space', p => diagramSideCredits(p, editable(), limits), ['working space below its floor']],
        ['worked-columns', p => {
          let next = p; const made = [];
          for (const block of current().teaching.filter(b => !protectedIds.has(b.id))) {
            const columns = workedColumnsFor(block, limits);
            if (!columns) continue;
            next = withBlock(next, block.id, b => { b.presentation = {...b.presentation, columns}; return b; });
            made.push({kind: 'worked-columns', blockId: block.id, before: block.presentation?.columns ?? null, after: columns, reason: 'one column per example'});
          }
          return {project: next, changes: made};
        }],
        ['grid', p => {
          let next = p; const made = [];
          for (const block of current().sections.flatMap(s => s.blocks).filter(b => b.type === 'question' && !protectedIds.has(b.id) && !spacingProtected(b))) {
            const columns = gridColumnsFor(block, limits);
            if (!columns) continue;
            const index = next.sections.findIndex(s => s.blocks.some(b => b.id === block.id));
            const gridded = gridBlock(next, index, block.id, columns);
            if (!gridded) continue;
            next = gridded;
            made.push({kind: 'grid', blockId: block.id, before: 1, after: columns, reason: 'short parts side by side'});
          }
          return {project: next, changes: made};
        }],
      ];
      for (const [kind, make, allow = []] of steps) {
        const {project: candidate, changes: made} = make(project);
        if (!made.length) continue;
        // Layout changes follow the rules; they are kept unless they split a question or a lesson more.
        const outcome = await trial(candidate, kind + ' ' + topic.topicId, {ids: topicIds(), allow, accept: (after, was) => after.splitQuestions <= was.splitQuestions && after.splitLessons <= was.splitLessons});
        if (outcome) adopt(candidate, outcome, made);
      }
    }

    // Phase 2: page starts.
    if (enabled('starts')) {
      for (const lesson of lessonsOf(current().teaching).slice(1)) {
        if (!lesson.closedBy || !LESSON_CLOSE.has(lesson.closedBy) || protectedIds.has(lesson.first.id)) continue;
        if (blockPages(map, lesson.first.id)[0] !== undefined && map.pages[blockPages(map, lesson.first.id)[0]]?.blocks[0] && identity(map.pages[blockPages(map, lesson.first.id)[0]].blocks[0]) === lesson.first.id) continue; // already starts a page
        const candidate = setPageBoundary(project, lesson.first.id, 'before');
        const outcome = await trial(candidate, 'lesson start ' + lesson.first.id, {ids: topicIds(), accept: (after, was) => after.splitQuestions <= was.splitQuestions && after.splitLessons <= was.splitLessons});
        if (outcome) adopt(candidate, outcome, [{kind: 'page-break', blockId: lesson.first.id, before: false, after: true, reason: `a new lesson starts a page (after ${lesson.closedBy})`}]);
      }
      const titles = new Map((project.topics ?? []).map(t => [t.id, t.title]));
      const opening = current().practice[0]?.blocks.find(visible);
      if (opening && opening.flow?.exercisePageBreakBefore !== false && isMixedReview(current(), id => titles.get(id)) && !protectedIds.has(opening.id)) {
        const candidate = withBlock(project, opening.id, b => { b.flow = {...b.flow, exercisePageBreakBefore: false}; return b; });
        const outcome = await trial(candidate, 'mixed review ' + topic.topicId, {ids: topicIds(), allow: ['removed exercise break', 'removed exercise boundary'], accept: () => true});
        if (outcome) adopt(candidate, outcome, [{kind: 'exercise-break', blockId: opening.id, before: true, after: false, reason: 'mixed-review exercise flows on after its repeated theory'}]);
      }
    }

    // Phase 3: lessons.
    if (enabled('lessons')) for (const lesson of lessonsOf(current().teaching)) {
      if (shouldStop()) break;
      const spans = () => [...new Set(lesson.ids.flatMap(id => blockPages(map, id)))];
      if (spans().length < 2 || lesson.ids.some(id => protectedIds.has(id))) continue;
      // (a) tighten the lesson (spacing, diagrams, working space to its floor) until it sits on one page.
      const onOnePage = async candidate => { const outcome = await trial(candidate, 'fit lesson ' + lesson.first.id, {ids: topicIds()}); if (!outcome) return false; const pages = new Set(lesson.ids.flatMap(id => blockPages(outcome.result, id))); return pages.size === 1; };
      const fitted = await searchFit(project, lesson.ids, FIT_DEFAULTS, onOnePage, {steps: 4, cancelled: shouldStop}).catch(() => ({project: null}));
      if (fitted.project) {
        const outcome = await trial(fitted.project, 'fit lesson ' + lesson.first.id, {ids: topicIds()});
        if (outcome) { adopt(fitted.project, outcome, [{kind: 'fit-lesson', blockId: lesson.first.id, blockIds: lesson.ids, reason: 'tightened so the lesson sits on one page'}]); continue; }
      }
      // (b) split at the preferred boundary.
      for (const cut of lessonBoundaries(lesson)) {
        const at = lesson.blocks[cut];
        if (protectedIds.has(at.id)) continue;
        const candidate = setPageBoundary(project, at.id, 'before');
        const outcome = await trial(candidate, 'split lesson ' + at.id, {ids: topicIds(), accept: (after, was) => compareMetrics(after, was) <= 0 && after.halfEmpty <= was.halfEmpty});
        if (outcome) { adopt(candidate, outcome, [{kind: 'page-break', blockId: at.id, before: false, after: true, reason: `the lesson continues at its ${roleOf(at)}`}]); break; }
      }
      // (c) key ideas never start a page alone: keep them with the block they summarise.
      const keyIdeas = lesson.blocks.findIndex(b => roleOf(b) === 'key-ideas');
      if (keyIdeas > 0) {
        const ki = lesson.blocks[keyIdeas], prior = lesson.blocks[keyIdeas - 1], page = blockPages(map, ki.id)[0];
        if (page !== undefined && identity(map.pages[page].blocks[0]) === ki.id && !blockPages(map, prior.id).includes(page) && !prior.flow?.keepWithNext && !protectedIds.has(prior.id)) {
          // First tighten what shares the previous page so the key ideas join it; else keep them with it.
          const previous = [...new Set((map.pages[page - 1]?.blocks ?? []).map(identity))].filter(x => !protectedIds.has(x));
          const together = async candidate => { const outcome = await trial(candidate, 'fit key ideas ' + ki.id, {ids: topicIds()}); if (!outcome) return false; const k = blockPages(outcome.result, ki.id)[0]; return k !== undefined && blockPages(outcome.result, prior.id).includes(k); };
          const fitted = previous.length ? await searchFit(project, [...previous, ki.id], FIT_DEFAULTS, together, {steps: 4, cancelled: shouldStop}).catch(() => ({project: null})) : {project: null};
          if (fitted.project) {
            const outcome = await trial(fitted.project, 'fit key ideas ' + ki.id, {ids: topicIds()});
            if (outcome) { adopt(fitted.project, outcome, [{kind: 'fit-key-ideas', blockId: ki.id, blockIds: previous, reason: 'tightened the page so the key ideas join what they summarise'}]); continue; }
          }
          const candidate = withBlock(project, prior.id, b => { b.flow = {...b.flow, keepWithNext: true}; return b; });
          const outcome = await trial(candidate, 'key ideas ' + ki.id, {ids: topicIds(), accept: (after, was) => after.splitQuestions <= was.splitQuestions});
          if (outcome) adopt(candidate, outcome, [{kind: 'keep-with-next', blockId: prior.id, reason: 'key ideas stay with what they summarise'}]);
        }
      }
    }
    // Phase 3b: questions (B4). A question split across pages is tightened onto one page, or kept together on
    // the next page when it fits a page whole. Taller-than-a-page questions keep their safe-boundary split.
    if (enabled('questions')) for (const id of topicIds()) {
      if (shouldStop()) break;
      const block = blocksOf(project).find(b => b.id === id);
      if (!block || block.type !== 'question' || protectedIds.has(id) || block.flow?.continuationOf || blockPages(map, id).length < 2) continue;
      if (block.flow?.keepTogether) { rejected.push({label: 'question ' + id, reason: 'split-though-kept-together'}); continue; }
      const whole = async candidate => { const outcome = await trial(candidate, 'fit question ' + id, {ids: topicIds()}); return !!outcome && blockPages(outcome.result, id).length === 1; };
      const fitted = await searchFit(project, [id], FIT_DEFAULTS, whole, {steps: 4, cancelled: shouldStop}).catch(() => ({project: null}));
      if (fitted.project) {
        const outcome = await trial(fitted.project, 'fit question ' + id, {ids: topicIds()});
        if (outcome && blockPages(outcome.result, id).length === 1) { adopt(fitted.project, outcome, [{kind: 'fit-question', blockId: id, reason: 'tightened so the question is not split'}]); continue; }
      }
      // Moving it whole must not leave a half-empty page behind (B6 outranks a tidy split).
      const kept = withBlock(project, id, b => { b.flow = {...b.flow, keepTogether: true}; return b; });
      const outcome = await trial(kept, 'keep question ' + id, {ids: topicIds(), accept: (after, was) => compareMetrics(after, was) <= 0 && after.halfEmpty <= was.halfEmpty});
      if (outcome && blockPages(outcome.result, id).length === 1) adopt(kept, outcome, [{kind: 'keep-together', blockId: id, reason: 'moved whole to the next page instead of splitting'}]);
      else if (outcome) rejected.push({label: 'keep question ' + id, reason: 'still-split', pages: blockPages(outcome.result, id)});
    }
  }

  // Phase 4: exercises (B4-B5). The optimiser keeps its own guards and objective.
  if (enabled('exercises') && !shouldStop()) {
    onprogress?.({phase: 'exercises', trials});
    try {
      const optimised = await optimisePagination(project, {paginate, guard, named: true, now, shouldStop, onprogress: p => onprogress?.({phase: 'exercises', ...p, trials: trials + p.trials})});
      trials += optimised.trials;
      if (optimised.moves.length) {
        const result = await paginate(optimised.project, {blockIds: blocksOf(optimised.project).map(b => b.id)});
        project = optimised.project; map = result;
        changes.push(...optimised.moves.map(m => ({...m, kind: m.type === 'tighten' ? 'working-space' : m.type, before: m.before, after: m.after})));
      }
      rejected.push(...optimised.rejected.map(r => ({...r, phase: 'exercises'})));
    } catch (error) { rejected.push({phase: 'exercises', reason: 'optimiser', message: error.message}); }
  }

  // Phase 5: fill (D).
  if (enabled('fill') && !shouldStop()) {
    onprogress?.({phase: 'fill', trials});
    const filled = await fillPages(project, map, {paginate, protectedIds, limits, check: candidate => polishSafetyIssues(project, candidate, {reference: source, protectedIds, spacing: true}).filter(i => !/below its floor/.test(i) && !/changed teacher\/unknown working space/.test(i) && !(includeReviewed && /increased reviewed working space/.test(i)))});
    trials += filled.trials;
    if (filled.changes.length) { project = filled.project; map = filled.map; changes.push(...filled.changes); }
    rejected.push(...filled.rejected);
  }

  const final = changes.length ? await paginate(project, {blockIds: blocksOf(project).map(b => b.id)}) : baseline;
  const after = composeMetrics(project, final, {limits});
  const reviewedIds = teacherBlocks(source);
  return {project, changes: changes.map(c => ({...c, reviewed: reviewedIds.has(c.blockId)})), rejected, trials, before, after, at: now()};
}

// ---- phase 5: fill -----------------------------------------------------------------------------------

// The working spaces of blocks wholly on a page, with the most each may grow.
function fillable(project, page, protectedIds, limits) {
  const byId = new Map(blocksOf(project).map(b => [b.id, b])), out = [];
  for (const b of page.blocks) {
    const block = byId.get(b.id);
    if (!block || block.type !== 'question' || Number.isInteger(b.flow?.fragment) || b.flow?.continuationOf || protectedIds.has(block.id) || spacingProtected(block)) continue;
    if (roleOf(block) === 'key-ideas' || roleOf(block) === 'definition') continue;
    for (const node of leaves(block)) {
      const now = currentAllowance(project, node);
      if (!(now > 0) || !['working', 'short'].includes(responseKind(block, node))) continue;
      const room = Math.min(now * (limits.fillCapRatio - 1), limits.fillCapMm);
      if (room >= 1) out.push({blockId: block.id, nodeId: node.id, now, room});
    }
  }
  return out;
}
const pageKey = map => (map.pages ?? []).map(p => p.blocks.map(b => b.id + ':' + (b.flow?.fragment ?? '')).join(',')).join('|');

export async function fillPages(project, map, {paginate, protectedIds = new Set(), limits = COMPOSE_LIMITS, check = () => []} = {}) {
  const changes = [], rejected = [];
  let trials = 0;
  const plan = new Map(); // page index -> share of its trailing space to use (1, then halves)
  (map.pages ?? []).forEach((page, i) => { if (page.space && page.space.remainingMm - limits.fillMarginMm >= limits.fillMinMm && i < map.pages.length - 1) plan.set(i, 1); });
  const build = () => {
    let next = project; const made = [];
    for (const [i, share] of plan) {
      const page = map.pages[i], items = fillable(project, page, protectedIds, limits);
      if (!items.length || share <= 0) continue;
      const budget = (page.space.remainingMm - limits.fillMarginMm) * share, total = items.reduce((t, x) => t + x.now, 0);
      for (const item of items) {
        const add = Math.floor(Math.min(item.room, budget * item.now / total));
        if (add < 1) continue;
        next = setAllowance(next, item.blockId, item.nodeId, item.now + add);
        made.push({kind: 'fill', blockId: item.blockId, nodeId: item.nodeId, page: i + 1, before: item.now, after: item.now + add, reason: 'shares the page\'s trailing space'});
      }
    }
    return {next, made};
  };
  const wanted = pageKey(map);
  for (let attempt = 0; attempt < limits.fillTrials && plan.size; attempt++) {
    const {next, made} = build();
    if (!made.length) break;
    const unsafe = check(next);
    if (unsafe.length) { rejected.push({phase: 'fill', reason: 'safety', issues: unsafe.slice(0, 3)}); break; }
    trials++;
    const result = await paginate(next, {blockIds: [...new Set(made.map(m => m.blockId))]});
    if (pageKey(result) === wanted && !newIssues(map, result).length) return {project: next, map: result, changes: made, rejected, trials};
    // Back off on the first page whose content moved, and on every page after it that was filled.
    const moved = (map.pages ?? []).findIndex((p, i) => pageKey({pages: [p]}) !== pageKey({pages: [result.pages?.[i] ?? {blocks: []}]}));
    rejected.push({phase: 'fill', reason: 'moved', attempt, page: moved + 1, pages: plan.size});
    for (const i of [...plan.keys()]) if (i >= Math.max(0, moved - 1)) { const share = plan.get(i) / 2; if (share < 0.2) plan.delete(i); else plan.set(i, share); }
  }
  rejected.push({phase: 'fill', reason: 'moved-content'});
  return {project, map, changes: [], rejected, trials};
}

export function describeChange(c, label = id => id) {
  const name = label(c.blockId);
  switch (c.kind) {
    case 'working-space': case 'fill': case 'diagram-side-space': return `${name} working space ${c.before} → ${c.after} mm (${c.reason})`;
    case 'page-break': return `${name} starts a page (${c.reason})`;
    case 'exercise-break': return `${name}: exercise continues on the same page (${c.reason})`;
    case 'grid': return `${name} parts in ${c.after} columns`;
    case 'worked-columns': return `${name} examples in ${c.after} columns`;
    case 'fit-lesson': return `Lesson from ${name} tightened onto one page`;
    case 'fit-question': return `${name} tightened so it is not split`;
    case 'fit-key-ideas': return `Page tightened so ${name} sits with what it summarises`;
    case 'keep-with-next': return `${name} kept with the key ideas after it`;
    case 'source-break-cleared': return `${name}: source page boundary removed`;
    case 'reorder': return `${(c.blockIds ?? []).map(label).join(', ')} moved (${c.reason})`;
    case 'keep-together': return `${name} kept on one page${c.reason ? ` (${c.reason})` : ''}`;
    default: return `${name}: ${c.kind}`;
  }
}
