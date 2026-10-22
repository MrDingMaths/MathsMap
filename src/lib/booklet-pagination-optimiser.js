// Pagination optimiser (22 October 2026, user approved). Pure: the real paginator is
// reached only through the `paginate(candidate, focus)` callback, so Studio (a hidden
// probe preview) and tests (a fake) share this code.
//
// Each practice section is an exercise and starts a page, so each is optimised on
// its own. Moves, in order:
//   1. tighten answer allowances that sit above the teacher-calibrated floor;
//   2. best-fit pull of a later unit forward into a page's trailing gap, only
//      across units within +-1 difficulty band;
//   3. a two-column grid for a question whose parts are all short.
// The objective is lexicographic: fewest pages, then least trailing whitespace on
// non-final pages, then the smallest difficulty-inversion penalty. A trial is
// rejected when it splits a block that was not split, lets the exercise start
// mid-page, takes an allowance below the floor, adds a pagination issue, or (checked
// once per exercise) makes the short or worked edition longer. Units are the
// movable groups of exerciseUnits(), so dependsOn, keepWithNext, pairedBlockId and
// continuations never separate. Every accepted move is recorded, and block.flow.
// autoOrder keeps the order while ratings are unchanged.
//
//   paginate(project, {sectionId, blockIds}) -> Promise<{pages, issues}>
//     pages: [{blocks:[{id, flow?}], space?:{capacityMm, usedMm, remainingMm},
//              elements?:[{id, kind, h}]}]. `space` and `elements` are needed only
//     for the pages holding `blockIds`.
//   guard(project) -> Promise<{short:pages, worked:pages}>  (optional)
import {exerciseUnits, ratingHash} from './booklet-exercises.js';
import {isPractice, exerciseNumbers} from './booklet-flow.js';
import {DIFFICULTIES} from './practice-question-model.js';
import {bandIndex, reasoningScore, difficultyInversions} from './booklet-pagination-metrics.js';
import {blockPages, newSplits, newIssues} from './booklet-layout-actions.js';
import {workingSpaceFloor, importedAllowance, allowanceCopies, stillImportAllowance} from './booklet-working-space.js';
import {hasTeacherReview, spacingProtected} from './booklet-import-spacing.js';
import {findContent, regridParts} from './booklet-arrangement.js';
import {arrangementItems} from '../../public/libs/maths-editor/arrangement-model.mjs';

export const OPTIMISER_LIMITS = Object.freeze({trials: 40, gapMm: 15, epsilonMm: 0.5, gridPartChars: 60, gridAnswerMm: 40, gridMinParts: 2, gridMaxParts: 8});
export const MAX_BAND_DISTANCE = 1;

const sum = values => values.reduce((total, value) => total + value, 0);
const round = (value, places = 1) => Math.round(value * 10 ** places) / 10 ** places;
const bandName = index => (index == null ? null : DIFFICULTIES[index]?.id ?? null);
const identity = b => b.flow?.continuationOf ?? b.continuationOf ?? b.id;
const near = (a, b) => Math.abs(a - b) < 0.01;

// ---- units ---------------------------------------------------------------------

// Practice sections the optimiser may reorder: those that start a page. In a topic
// organised booklet only the first practice section of a topic starts its exercise
// (flowEditionSections); later practice sections of the topic continue the flow after
// teaching content, so there is no page boundary to optimise against.
export function startsPage(project, section, exercises = exerciseNumbers(project), starts = null) {
  const first = starts ?? firstPracticeSections(project, exercises);
  if (first.get(section.topicId) === section) return section.blocks[0]?.flow?.exercisePageBreakBefore !== false;
  return section.pageBreakBefore !== false && !(exercises[section.topicId] && section.phase === 'practice');
}
function firstPracticeSections(project, exercises) {
  const first = new Map();
  for (const section of project.sections) {
    if (section.role === 'candidate-pool') continue;
    if (section.phase === 'practice' && section.blocks.some(b => !b.presentation?.editorOnly) && exercises[section.topicId] && !first.has(section.topicId)) first.set(section.topicId, section);
  }
  return first;
}
export function optimisableSections(project) {
  const exercises = exerciseNumbers(project), starts = firstPracticeSections(project, exercises);
  return project.sections.map((section, index) => ({section, index})).filter(({section}) =>
    section.phase === 'practice' && section.role !== 'candidate-pool' && startsPage(project, section, exercises, starts) &&
    (section.blocks ?? []).some(b => !b.presentation?.editorOnly && isPractice(b)));
}

// A unit is movable when it has a rating and no manual break of its own; an unrated
// unit or one that forces a page break is a barrier nothing may jump over.
export function describeUnits(section) {
  const {groups} = exerciseUnits(section);
  return groups.map((group, index) => {
    const practice = group.blocks.filter(isPractice);
    const scores = practice.map(reasoningScore);
    const rated = scores.length > 0 && scores.every(s => s != null);
    const score = rated ? Math.max(...scores) : null;
    const barrier = !rated || group.blocks.some(b => b.flow?.pageBreakBefore || b.flow?.sourcePageBreakBefore && b.flow.pageBreakBefore !== false || b.flow?.continueBefore || b.presentation?.editorOnly);
    return {index, blocks: group.blocks, ids: group.blocks.map(b => b.id), practiceIds: practice.map(b => b.id), score, band: rated ? bandIndex(score) : null, barrier};
  });
}

// Moving `moving` from `from` to just before position `to` jumps over the units in
// between. Every jumped unit must be movable and within +-1 band.
export function bandAllows(units, from, to) {
  const moving = units[from];
  if (!moving || moving.barrier || moving.band == null) return false;
  const [lo, hi] = from > to ? [to, from - 1] : [from + 1, to - 1];
  for (let k = lo; k <= hi; k++) {
    const other = units[k];
    if (other.barrier || other.band == null || Math.abs(moving.band - other.band) > MAX_BAND_DISTANCE) return false;
  }
  return true;
}

function moveUnit(order, from, to) {
  const next = order.slice();
  const [unit] = next.splice(from, 1);
  next.splice(to > from ? to - 1 : to, 0, unit);
  return next;
}

const withSectionBlocks = (project, index, blocks) => ({...project, sections: project.sections.map((s, i) => i === index ? {...s, blocks} : s)});
const flattenOrder = (units, order) => order.flatMap(i => units[i].blocks);

// ---- measurement ------------------------------------------------------------------

function exerciseStats(map, section, units, order) {
  const owned = new Set(section.blocks.map(b => b.id));
  const mine = (map.pages ?? []).filter(p => p.blocks.some(b => owned.has(b.id) || owned.has(identity(b))));
  const trailing = mine.slice(0, -1).map(p => Math.max(0, p.space?.remainingMm ?? 0));
  const seen = [];
  for (const p of mine) for (const b of p.blocks) if (owned.has(b.id) && !seen.includes(b.id)) seen.push(b.id);
  const scoreOf = new Map(units.flatMap(u => u.practiceIds.map(id => [id, u.score])));
  const inversions = difficultyInversions(seen.filter(id => scoreOf.has(id)).map(id => scoreOf.get(id)));
  const startsClean = !!mine.length && mine[0].blocks.every(b => owned.has(b.id) || owned.has(identity(b)));
  return {pages: mine.length, pageList: mine, trailingMm: round(sum(trailing)), trailing, inversionPenalty: inversions.penalty, inversionPairs: inversions.pairs, startsClean, order: seen, total: (map.pages ?? []).length};
}

const unitHeightMm = (unit, pages) => sum(pages.flatMap(p => (p.elements ?? []).filter(e => e.kind === 'question' && unit.ids.includes(e.id)).map(e => e.h)));
const unitPages = (unit, map) => [...new Set(unit.ids.flatMap(id => blockPages(map, id)))];

// Lexicographic: pages, then trailing whitespace (beyond a small tolerance), then
// inversion penalty.
export function betterObjective(a, b, epsilonMm = OPTIMISER_LIMITS.epsilonMm) {
  if (a.pages !== b.pages) return a.pages < b.pages;
  if (Math.abs(a.trailingMm - b.trailingMm) > epsilonMm) return a.trailingMm < b.trailingMm;
  return a.inversionPenalty < b.inversionPenalty;
}

// ---- allowance floor ------------------------------------------------------------

const effectiveSpace = (project, node) => project.settings?.layoutOverrides?.answerSpaces?.[node.id] ?? node.answerSpaceMm;
function leafAnswers(block) {
  const found = [];
  const visit = node => {
    if (!node || typeof node !== 'object') return;
    if (node.children?.length) node.children.forEach(visit);
    else if (node.answer) found.push(node);
  };
  visit(block.content);
  return found;
}
// The shared floor (workingSpaceFloor): calibrated, or the estimator for a teacher-reviewed booklet named explicitly.
function floorFor(block, node, reviewed = false) {
  try { return workingSpaceFloor(block, node, {reviewed}); } catch { return null; }
}

// Allowances in the candidate that went below both their old value and the floor.
export function belowFloor(base, candidate, sectionIndex) {
  const found = [], reviewed = hasTeacherReview(base);
  const before = new Map((base.sections[sectionIndex].blocks).map(b => [b.id, b]));
  for (const block of candidate.sections[sectionIndex].blocks) {
    const old = before.get(block.id);
    if (!old) continue;
    for (const node of leafAnswers(block)) {
      const was = findContent(old, node.id);
      const now = effectiveSpace(candidate, node), then = was ? effectiveSpace(base, was) : null;
      if (!Number.isFinite(now) || !Number.isFinite(then) || now >= then - 0.01) continue;
      const floor = floorFor(old, was, reviewed);
      if (floor != null && now < floor - 0.01) found.push({blockId: block.id, nodeId: node.id, now, then, floor});
    }
  }
  return found;
}

// ---- moves 1 and 3: field changes -------------------------------------------------

// Move 1: allowances above the floor come down to it, but only values still equal to their import value in
// every stored copy; a changed value belongs to the teacher or a repair (17 October rule).
export function tightenToFloor(project, sectionIndex) {
  const changes = [], reviewed = hasTeacherReview(project);
  const section = project.sections[sectionIndex];
  const blocks = section.blocks.map(block => {
    if (!isPractice(block) || spacingProtected(block)) return block;
    const next = structuredClone(block);
    for (const node of leafAnswers(next)) {
      const space = project.settings?.layoutOverrides?.answerSpaces?.[node.id] ?? node.answerSpaceMm;
      if (!Number.isFinite(space)) continue;
      if (!stillImportAllowance(allowanceCopies(project, block, node), importedAllowance(block, node.id))) continue;
      const floor = floorFor(next, node, reviewed);
      if (floor == null || space <= floor + 0.01) continue;
      if (Number.isFinite(node.answerSpaceMm)) node.answerSpaceMm = floor;
      changes.push({type: 'tighten', sectionId: section.id, blockId: block.id, nodeId: node.id, before: space, after: floor});
    }
    return changes.some(c => c.blockId === block.id) ? next : block;
  });
  if (!changes.length) return {project, changes};
  let next = withSectionBlocks(project, sectionIndex, blocks);
  // A stored override or a saved arrangement's space item must follow the part.
  const overrides = next.settings?.layoutOverrides;
  if (overrides) {
    const answerSpaces = {...overrides.answerSpaces}, blockLayouts = {...overrides.blockLayouts};
    for (const c of changes) {
      if (Number.isFinite(answerSpaces[c.nodeId])) answerSpaces[c.nodeId] = c.after;
      const layout = blockLayouts[c.blockId]?.arrangement;
      if (layout) {
        const tree = structuredClone(layout);
        let touched = false;
        for (const item of arrangementItems(tree.root)) if (item.ref === c.nodeId + '/space' && Number.isFinite(item.height) && near(item.height, c.before)) { item.height = c.after; touched = true; }
        if (touched) blockLayouts[c.blockId] = {...blockLayouts[c.blockId], arrangement: tree};
      }
    }
    next = {...next, settings: {...next.settings, layoutOverrides: {...overrides, answerSpaces, blockLayouts}}};
  }
  return {project: next, changes};
}

// Move 3: blocks whose parts are all short, laid out as a list.
export function gridCandidates(section, limits = OPTIMISER_LIMITS) {
  const text = value => typeof value === 'string' ? value : JSON.stringify(value ?? '');
  return section.blocks.filter(block => {
    if (!isPractice(block) || block.type !== 'question' || spacingProtected(block)) return false;
    const root = block.content, parts = root?.children;
    if (!parts || parts.length < limits.gridMinParts || parts.length > limits.gridMaxParts || root.layout === 'grid') return false;
    if (root.questionDiagrams?.length || root.representations) return false;
    return parts.every(part => !part.children?.length && !part.questionDiagrams?.length && !part.dependsOn?.length &&
      text(part.prompt).length <= limits.gridPartChars && !/\\{1,2}(?:begin|d?frac)|"type":"table"/.test(text(part.prompt)) &&
      (!Number.isFinite(part.answerSpaceMm) || part.answerSpaceMm <= limits.gridAnswerMm));
  });
}
export function gridBlock(project, sectionIndex, blockId, columns = 2) {
  const section = project.sections[sectionIndex], original = section.blocks.find(b => b.id === blockId);
  const block = structuredClone(original);
  block.content.layout = 'grid';
  block.content.columns = columns;
  let next = withSectionBlocks(project, sectionIndex, section.blocks.map(b => b.id === blockId ? block : b));
  const saved = project.settings?.layoutOverrides?.blockLayouts?.[blockId]?.arrangement;
  if (saved) {
    const arrangement = regridParts(saved, block.content, columns);
    if (!arrangement) return null; // a custom arrangement: leave it alone
    const overrides = next.settings.layoutOverrides;
    next = {...next, settings: {...next.settings, layoutOverrides: {...overrides, blockLayouts: {...overrides.blockLayouts, [blockId]: {...overrides.blockLayouts[blockId], arrangement}}}}};
  }
  return next;
}

// ---- autoOrder ----------------------------------------------------------------------

function stampAutoOrder(project, sectionIndex, units, order, moves, at) {
  const reasonOf = new Map(moves.filter(m => m.type === 'reorder').flatMap(m => m.blockIds.map(id => [id, m.reason])));
  const rankOf = new Map(order.map((unitIndex, rank) => [unitIndex, rank]));
  const blocks = project.sections[sectionIndex].blocks.map(b => b);
  const byId = new Map(blocks.map((b, i) => [b.id, i]));
  for (const unit of units) for (const id of unit.practiceIds) {
    const block = blocks[byId.get(id)];
    blocks[byId.get(id)] = {...block, flow: {...block.flow, autoOrder: {rank: rankOf.get(unit.index), from: unit.index, band: bandName(unit.band), reason: reasonOf.get(id) ?? 'order-kept', at, ratingHash: ratingHash(block)}}};
  }
  return withSectionBlocks(project, sectionIndex, blocks);
}

// ---- optimiser ---------------------------------------------------------------------

export async function optimisePagination(source, {paginate, guard = null, named = false, trials = OPTIMISER_LIMITS.trials, gapMm = OPTIMISER_LIMITS.gapMm, now = () => new Date().toISOString(), onprogress = null, shouldStop = () => false} = {}) {
  if (typeof paginate !== 'function') throw Error('optimisePagination needs a paginate callback');
  if (hasTeacherReview(source) && !named) throw Error(`${source.id ?? 'This booklet'} has teacher comments; it changes only when named explicitly.`);
  const baseline = await paginate(source, {});
  if (baseline.issues?.length) throw Error('Resolve the pagination issues before optimising: ' + baseline.issues.map(i => `${i.id}: ${i.message}`).join('; '));
  const guardBaseline = guard ? await guard(source) : null;
  const rejected = [], exercises = [], moves = [];
  let project = source, totalTrials = 0, map = baseline;
  const reject = (sectionId, reason, detail = {}) => rejected.push({sectionId, reason, ...detail});

  const targets = optimisableSections(source);
  const optimised = new Set(targets.map(t => t.section.id));
  for (const skipped of source.sections.filter(s => s.phase === 'practice' && s.role !== 'candidate-pool' && !optimised.has(s.id) && s.blocks.some(b => isPractice(b)))) exercises.push({sectionId: skipped.id, skipped: 'continues its topic after teaching content; no page boundary'});

  for (const [position, {index, section: originalSection}] of targets.entries()) {
    if (shouldStop()) break;
    onprogress?.({exercise: position + 1, exercises: targets.length, sectionId: originalSection.id, trials: totalTrials});
    const sectionStart = project;
    const exerciseMoves = [];
    let units = describeUnits(project.sections[index]);
    let order = units.map((_, i) => i);
    let used = 0;
    const owned = () => project.sections[index].blocks.map(b => b.id);
    const focusOf = () => ({sectionId: originalSection.id, blockIds: owned()});
    const baseMap = map;
    const first = await paginate(project, focusOf());
    let best = exerciseStats(first, project.sections[index], units, order);
    const before = {pages: best.pages, trailingMm: best.trailingMm, inversionPenalty: best.inversionPenalty};
    let bestMap = first;
    if (!best.startsClean) { exercises.push({sectionId: originalSection.id, skipped: 'does not start a page'}); continue; }

    // One trial: paginate the candidate and apply the hard rejections.
    const trial = async (candidate, label) => {
      used++; totalTrials++;
      let result;
      try { result = await paginate(candidate, focusOf()); } catch (error) { reject(originalSection.id, 'pagination-error', {label, message: error.message}); return null; }
      if (newIssues(baseMap, result).length) { reject(originalSection.id, 'pagination-issue', {label}); return null; }
      const splits = newSplits(baseMap, result);
      if (splits.length) { reject(originalSection.id, 'new-split', {label, blocks: splits.slice(0, 5)}); return null; }
      const stats = exerciseStats(result, candidate.sections[index], units, order);
      if (!stats.startsClean) { reject(originalSection.id, 'exercise-start', {label}); return null; }
      const low = belowFloor(project, candidate, index);
      if (low.length) { reject(originalSection.id, 'below-floor', {label, nodes: low.slice(0, 3)}); return null; }
      return {stats, result};
    };
    const adopt = (candidate, outcome, move) => { project = candidate; best = outcome.stats; bestMap = outcome.result; exerciseMoves.push(move); };

    // Move 1: tighten to the floor. Kept only when it removes a page.
    const tightened = tightenToFloor(project, index);
    if (tightened.changes.length && used < trials) {
      const outcome = await trial(tightened.project, 'tighten');
      if (outcome && outcome.stats.pages < best.pages) {
        project = tightened.project; best = outcome.stats; bestMap = outcome.result;
        exerciseMoves.push(...tightened.changes);
      } else if (outcome) reject(originalSection.id, 'not-better', {label: 'tighten'});
    }

    // Move 2: best-fit pull of a later unit into the first useful trailing gap.
    const tried = new Set(), bandSeen = new Set();
    let progressed = true;
    while (progressed && used < trials && !shouldStop()) {
      progressed = false;
      const pages = best.pageList;
      for (let p = 0; p < pages.length - 1 && !progressed && used < trials; p++) {
        const gap = Math.max(0, pages[p].space?.remainingMm ?? 0);
        if (gap < gapMm) continue;
        const onPage = order.map((unitIndex, position) => ({unitIndex, position})).filter(({unitIndex}) => unitPages(units[unitIndex], bestMap).includes(bestMap.pages.indexOf(pages[p])));
        const lastPosition = onPage.length ? Math.max(...onPage.map(o => o.position)) : -1;
        if (lastPosition < 0) continue;
        const candidates = [];
        for (let position = lastPosition + 1; position < order.length; position++) {
          const unit = units[order[position]];
          const key = order.join(',') + '>' + order[position];
          if (tried.has(key)) continue;
          if (!bandAllows(order.map(i => units[i]), position, lastPosition + 1)) {
            if (!bandSeen.has(unit.ids[0])) { bandSeen.add(unit.ids[0]); rejected.push({sectionId: originalSection.id, reason: 'band', unit: unit.ids[0]}); }
            continue;
          }
          const height = unitHeightMm(unit, best.pageList);
          if (height > 0 && height > gap - 1) continue; // cannot fit
          candidates.push({position, unit, height, key});
        }
        // Best fit: the tallest unit that still fits; unmeasured units go by proximity.
        candidates.sort((a, b) => b.height - a.height || a.position - b.position);
        for (const candidate of candidates) {
          if (used >= trials) break;
          tried.add(candidate.key);
          const nextOrder = moveUnit(order, candidate.position, lastPosition + 1);
          const nextProject = withSectionBlocks(project, index, flattenOrder(units, nextOrder));
          const saveOrder = order; order = nextOrder;
          const outcome = await trial(nextProject, 'pull ' + candidate.unit.ids[0]);
          if (outcome && betterObjective(outcome.stats, best)) {
            adopt(nextProject, outcome, {type: 'reorder', sectionId: originalSection.id, blockIds: candidate.unit.ids, from: candidate.position, to: lastPosition + 1, band: bandName(candidate.unit.band),
              jumped: saveOrder.slice(lastPosition + 1, candidate.position).flatMap(i => units[i].ids), reason: `fills ${round(gap)} mm on page ${pages[p] ? bestMap.pages.indexOf(pages[p]) + 1 : p + 1}`,
              pagesBefore: best.pages, pagesAfter: outcome.stats.pages});
            progressed = true;
            break;
          }
          order = saveOrder;
          if (outcome) reject(originalSection.id, 'not-better', {label: 'pull ' + candidate.unit.ids[0]});
        }
      }
    }

    // Move 3: a two-column grid for short parts, kept only when it removes a page or
    // closes a gap of at least a tenth of the page.
    if (best.pages > 1) for (const block of gridCandidates(project.sections[index])) {
      if (used >= trials || shouldStop()) break;
      const candidate = gridBlock(project, index, block.id, 2);
      if (!candidate) continue;
      const outcome = await trial(candidate, 'grid ' + block.id);
      if (outcome && (outcome.stats.pages < best.pages || outcome.stats.pages === best.pages && outcome.stats.trailingMm < best.trailingMm - 10)) {
        adopt(candidate, outcome, {type: 'grid', sectionId: originalSection.id, blockId: block.id, columns: 2, pagesBefore: best.pages, pagesAfter: outcome.stats.pages});
      } else if (outcome) reject(originalSection.id, 'not-better', {label: 'grid ' + block.id});
    }

    // Tighten again: the new order may leave a page that only floor-level spacing can drop.
    if (exerciseMoves.length && tightened.changes.length && !exerciseMoves.some(m => m.type === 'tighten') && used < trials) {
      const again = tightenToFloor(project, index);
      const outcome = again.changes.length ? await trial(again.project, 'tighten') : null;
      if (outcome && outcome.stats.pages < best.pages) { project = again.project; best = outcome.stats; bestMap = outcome.result; exerciseMoves.push(...again.changes); }
    }

    const reordered = exerciseMoves.some(m => m.type === 'reorder');
    if (reordered) project = stampAutoOrder(project, index, units, order, exerciseMoves, now());
    // The short and worked editions may not gain pages.
    if (exerciseMoves.length && guard) {
      const after = await guard(project);
      const worse = ['short', 'worked'].filter(e => (after[e] ?? 0) > (guardBaseline[e] ?? 0));
      if (worse.length) {
        reject(originalSection.id, 'guard-edition-gained-pages', {editions: worse});
        project = sectionStart; best = exerciseStats(first, project.sections[index], units, units.map((_, i) => i)); exerciseMoves.length = 0;
      }
    }
    for (const move of exerciseMoves) moves.push(move);
    exercises.push({sectionId: originalSection.id, topicId: originalSection.topicId, trials: used, before, after: {pages: best.pages, trailingMm: best.trailingMm, inversionPenalty: best.inversionPenalty}, moves: exerciseMoves.length});
    if (exerciseMoves.length) map = await paginate(project, {});
  }

  const final = moves.length ? await paginate(project, {}) : baseline;
  if ((final.pages ?? []).length > (baseline.pages ?? []).length) {
    // Never hand back a longer booklet.
    return {project: source, moves: [], exercises, rejected: [...rejected, {reason: 'student-gained-pages'}], trials: totalTrials, before: {pages: baseline.pages.length}, after: {pages: baseline.pages.length}};
  }
  return {project, moves, exercises, rejected, trials: totalTrials, before: {pages: (baseline.pages ?? []).length}, after: {pages: (final.pages ?? []).length}};
}

export function summariseMoves(moves) {
  const byType = {};
  for (const m of moves) byType[m.type] = (byType[m.type] ?? 0) + 1;
  return byType;
}
export function summariseRejections(rejected) {
  const by = {};
  for (const r of rejected) by[r.reason] = (by[r.reason] ?? 0) + 1;
  return by;
}
