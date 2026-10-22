<script>
 import {tick, onMount} from 'svelte';
 import FlowBookletPreview from './FlowBookletPreview.svelte';
 import {optimisePagination, summariseMoves, summariseRejections} from '../lib/booklet-pagination-optimiser.js';
 import {measureBookletPage} from '../lib/booklet-page-space.js';
 import {hasTeacherReview} from '../lib/booklet-import-spacing.js';
 import {flowNumbers} from '../lib/booklet-flow.js';
 // Optimise pagination (22 October 2026, user approved): reorders practice questions
 // within one difficulty band, tightens spacing to the calibrated floor and grids
 // short parts, measured by the real paginator in a hidden preview. Apply is one
 // undo step. The result is also exposed on window.__bookletOptimiseResult and the
 // run on window.__bookletOptimise so paginate/optimise.mjs drives this same code.
 let {project, options = {}, onchange, onfinish = () => {}} = $props();
 let lastBaseline = '';
 let running = $state(false), message = $state(''), progress = $state(''), result = $state.raw(null), candidate = $state.raw(null), probe = $state(), probeEdition = $state('student'), confirmed = $state(false);
 const reviewed = $derived(project ? hasTeacherReview(project) : false);

 const publish = value => { if (typeof window !== 'undefined') window.__bookletOptimiseResult = value; };
 // Pages as the optimiser reads them. Only the pages holding the focus blocks are
 // measured: their space left and the heights of their questions.
 async function paginate(next, focus) {
  candidate = next; probeEdition = 'student'; await tick();
  const map = await probe.waitUntilReady({allowIssues: true});
  const wanted = new Set(focus?.blockIds ?? []);
  const identity = b => b.flow?.continuationOf ?? b.continuationOf ?? b.id;
  const pages = map.pages.map(p => ({blocks: p.blocks.map(b => ({id: b.id, flow: {continuationOf: b.flow?.continuationOf, fragment: b.flow?.fragment}, continuationOf: b.continuationOf})), mode: p.mode}));
  for (const [i, page] of map.pages.entries()) {
   if (!page.blocks.some(b => wanted.has(b.id) || wanted.has(identity(b)))) continue;
   const root = await probe.revealPage(i), space = root && measureBookletPage(root);
   if (!space) continue;
   const paper = root.querySelector('.booklet-page'), k = 210 / paper.getBoundingClientRect().width;
   const outer = [...root.querySelectorAll('[data-question-id]')].filter(el => !el.parentElement?.closest('[data-question-id]'));
   pages[i].space = {capacityMm: space.capacity / (96 / 25.4), usedMm: space.height / (96 / 25.4), remainingMm: space.remainingMm};
   pages[i].elements = outer.map(el => ({id: el.dataset.questionId, kind: 'question', h: el.getBoundingClientRect().height * k}));
  }
  return {pages, issues: map.issues};
 }
 // The short and worked editions may not gain pages.
 async function guard(next) {
  candidate = next; const out = {};
  for (const edition of ['short', 'worked']) { probeEdition = edition; await tick(); out[edition] = (await probe.waitUntilReady({allowIssues: true})).pages.length; }
  probeEdition = 'student'; await tick();
  return out;
 }

 export async function run() {
  if (running || !project) return result;
  onfinish(); running = true; result = null; message = ''; progress = 'Measuring the current layout…'; publish({state: 'running'});
  const original = structuredClone($state.snapshot(project)), baseline = JSON.stringify(original);
  lastBaseline = baseline;
  try {
   const outcome = await optimisePagination(original, {paginate, guard, named: reviewed && confirmed, onprogress: p => { progress = `Exercise ${p.exercise} of ${p.exercises} · ${p.trials} trials`; }});
   if (JSON.stringify($state.snapshot(project)) !== baseline) throw Error('The booklet changed during the check. Please try again.');
   const numbers = flowNumbers(original), label = id => 'Q' + (numbers[id] ?? id);
   result = {...outcome, byType: summariseMoves(outcome.moves), rejections: summariseRejections(outcome.rejected), label: Object.fromEntries(Object.keys(numbers).map(id => [id, label(id)]))};
   message = outcome.moves.length ? `${outcome.before.pages} → ${outcome.after.pages} pages with ${outcome.moves.length} change${outcome.moves.length === 1 ? '' : 's'}.` : 'No safe change found. Nothing changed.';
   publish({state: 'done', before: outcome.before, after: outcome.after, moves: outcome.moves, exercises: outcome.exercises, rejected: outcome.rejected, trials: outcome.trials, byType: result.byType, rejections: result.rejections, project: outcome.project});
  } catch (e) { message = e.message; publish({state: 'error', message: e.message}); }
  finally { running = false; progress = ''; candidate = null; }
  return result;
 }
 // One undo step: the same path as the other quick layout actions.
 export function apply() {
  if (!result?.moves.length) return;
  if (JSON.stringify($state.snapshot(project)) !== lastBaseline) { message = 'The booklet changed since the check. Run it again.'; result = null; return; }
  const next = result.project; result = null; message = 'Applied as one undo step.'; publish({...window.__bookletOptimiseResult, state: 'applied'}); onchange(next);
 }
 function discard() { result = null; message = 'Discarded. Nothing changed.'; publish({state: 'discarded'}); }
 const describe = m => m.type === 'reorder' ? `${m.blockIds.map(id => result.label[id] ?? id).join(', ')} moved before ${m.jumped.length ? (result.label[m.jumped[0]] ?? m.jumped[0]) : 'the next question'} (${m.reason})`
  : m.type === 'tighten' ? `${result.label[m.blockId] ?? m.blockId} working space ${m.before} → ${m.after} mm` : `${result.label[m.blockId] ?? m.blockId} parts in two columns`;
 onMount(() => { window.__bookletOptimise = run; window.__bookletOptimiseApply = apply; return () => { delete window.__bookletOptimise; delete window.__bookletOptimiseApply; }; });
</script>
<section class="optimiser" aria-label="Optimise pagination">
 <button disabled={running || !project || (reviewed && !confirmed)} onclick={run}>{running ? 'Measuring…' : 'Optimise pagination'}</button>
 {#if reviewed}<label class="confirm"><input type="checkbox" bind:checked={confirmed}/>This booklet has teacher comments; change it on request</label>{/if}
 {#if progress}<small role="status">{progress}</small>{/if}
 {#if message}<p role="status">{message}</p>{/if}
 {#if result}
  <p class="summary">Pages {result.before.pages} → {result.after.pages}. {result.trials} trials.</p>
  {#if result.moves.length}
   <ul class="moves" aria-label="Moves">{#each result.moves as m}<li>{describe(m)}</li>{/each}</ul>
   <button onclick={apply}>Apply</button><button onclick={discard}>Discard</button>
  {/if}
  {#if Object.keys(result.rejections).length}<details><summary>Rejected</summary><p>{Object.entries(result.rejections).map(([k, v]) => `${k}: ${v}`).join(', ')}</p></details>{/if}
 {/if}
</section>
{#if candidate}<div class="optimiser-probe" aria-hidden="true"><FlowBookletPreview bind:this={probe} project={candidate} edition={probeEdition} {options} zoom={1}/></div>{/if}
<style>
 .optimiser{border-bottom:1px solid var(--border,#ccd5df);padding:8px 0 12px;margin-bottom:12px;font:13px system-ui;display:grid;gap:6px}
 button{font:inherit;min-height:32px;padding:4px 10px;border:1px solid #aab5c2;border-radius:5px;color:inherit;background:var(--panel,#fff);cursor:pointer;text-align:left}
 button:disabled{opacity:.5;cursor:default}.confirm{display:flex;gap:6px;align-items:center}.confirm input{min-height:0}.moves{margin:0;padding-left:18px;max-height:180px;overflow:auto}p{margin:0}
 .optimiser-probe{position:fixed;left:-20000px;top:0;width:830px;height:600px;overflow:hidden;visibility:hidden;pointer-events:none}
 @media print{.optimiser,.optimiser-probe{display:none}}
</style>
