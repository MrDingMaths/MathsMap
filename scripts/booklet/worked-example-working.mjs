// Worked-example working belongs in steps or theorySolution, never in the prompt: "Show theory solutions"
// hides only the solution fields, so working left in the prompt printed in the students' edition
// (Polynomials 1A j5, Further Expansion p5, 10 November 2026). House colours mark the working: blue
// (#268cff) for working, red (#ef6068) for its step headings and operations.
const BLUE = /^#268cff$/i, RED = /^#ef6068$/i;

function inlinesOf(block) {
  const out = [];
  (function walk(b) {
    if (!b || typeof b !== 'object') return;
    if (Array.isArray(b.inlines)) out.push(...b.inlines);
    for (const it of b.items ?? []) (it.blocks ?? []).forEach(walk);
    for (const row of b.rows ?? []) for (const c of row ?? []) (c?.blocks ?? []).forEach(walk);
    for (const s of b.slots ?? []) (s.blocks ?? []).forEach(walk);
    for (const c of b.children ?? []) walk(c);
  })(block);
  return out;
}
const visible = n => n.type === 'math' ? String(n.latex ?? '').trim() !== '' : n.type === 'text' ? String(n.text ?? '').trim() !== '' : n.type === 'cloze';
const coloured = (n, re, hex) => re.test(n.colour ?? '') || (n.type === 'math' && new RegExp('^\\s*\\{?\\\\color\\{' + hex + '\\}', 'i').test(n.latex ?? ''));
const isWorking = n => coloured(n, BLUE, '#268cff') || coloured(n, RED, '#ef6068');

// 'working' (every visible inline blue or red), 'question' (none), 'mixed' or 'empty'.
export function workingKind(block) {
  if (['image', 'diagram', 'tikz'].includes(block?.type)) return 'question';
  const shown = inlinesOf(block).filter(visible);
  if (!shown.length) return 'empty';
  const working = shown.filter(isWorking).length;
  return working === shown.length ? 'working' : working ? 'mixed' : 'question';
}
const emptySolution = v => v == null || (typeof v === 'string' && !v.trim()) || (typeof v === 'object' && !(v.blocks ?? []).length);

// The examples of a worked-example block whose prompt ends in working that could simply be
// theorySolution: question blocks (or none), then only working. Mixed lines and question text after
// the working are left alone, as are definition panels.
export function workingInPrompt(block, layouts = {}) {
  if (block?.type !== 'worked-example' || block.pedagogyRole === 'definition') return [];
  const found = [];
  for (const e of block.examples ?? []) {
    if (e.steps?.length || !emptySolution(e.theorySolution) || typeof e.prompt !== 'object') continue;
    const kinds = (e.prompt?.blocks ?? []).map(workingKind), at = kinds.indexOf('working');
    if (at < 0 || kinds.slice(0, at).includes('mixed') || kinds.slice(at).some(k => k === 'question' || k === 'mixed')) continue;
    // Without a saved arrangement, working after a figure would reorder; that stays a hand decision.
    if (!layouts[block.id]?.arrangement && block.presentation?.layout !== 'worked-rows' && ((e.questionDiagrams ?? []).length || (e.diagrams ?? []).length)) continue;
    found.push({ exampleId: e.id, nodeIds: e.prompt.blocks.slice(at).map(b => b.id) });
  }
  return found;
}
