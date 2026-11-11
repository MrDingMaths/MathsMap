<script>
 import {tick, onMount} from 'svelte';
 import FlowBookletPreview from './FlowBookletPreview.svelte';
 import {composeBooklet, describeChange} from '../lib/booklet-compose.js';
 import {probePagination} from '../lib/booklet-probe-pagination.js';
 import {hasTeacherReview} from '../lib/booklet-import-spacing.js';
 import {flowNumbers} from '../lib/booklet-flow.js';
 // Paginate booklet (11 November 2026, user approved): applies docs/booklet-pagination-principles.md to the
 // whole booklet, measured by the real paginator in a hidden preview. Nothing changes until Accept, which is one
 // undo step. On a booklet with teacher review the change list marks reviewed blocks; accepting includes them.
 // The result is published on window.__bookletComposeResult and the run on window.__bookletCompose, so
 // paginate/compose.mjs drives this same code.
 // Optimise pagination (22 October) was retired on 11 November 2026: this pass runs it per exercise (phase 4).
 let {project, options = {}, onchange, onfinish = () => {}} = $props();
 let running = $state(false), message = $state(''), progress = $state(''), result = $state.raw(null), candidate = $state.raw(null), probe = $state(), probeEdition = $state('student'), filter = $state('all'), lastBaseline = '';
 const reviewed = $derived(project ? hasTeacherReview(project) : false);
 const publish = value => { if (typeof window !== 'undefined') window.__bookletComposeResult = value; };
 const {paginate, guard} = probePagination({show: async (next, edition) => { candidate = next; probeEdition = edition; await tick(); }, probe: () => probe});

 export async function run({includeReviewed = true, phases = null} = {}) {
  if (running || !project) return result;
  onfinish(); running = true; result = null; message = ''; progress = 'Measuring the current layout…'; publish({state: 'running'});
  const original = project, baseline = JSON.stringify(original);
  lastBaseline = baseline;
  try {
   const outcome = await composeBooklet(original, {paginate, guard, includeReviewed, phases, onprogress: p => { progress = p.phase === 'topic' ? `Topic ${p.topic} of ${p.topics} · ${p.trials} trials` : `${p.phase === 'fill' ? 'Filling pages' : 'Exercises'} · ${p.trials} trials`; }});
   if (JSON.stringify($state.snapshot(project)) !== baseline) throw Error('The booklet changed during the pass. Please try again.');
   const numbers = flowNumbers(original);
   result = {...outcome, label: id => numbers[id] ? 'Q' + numbers[id] : id};
   message = outcome.changes.length ? `${outcome.before.pages} → ${outcome.after.pages} pages with ${outcome.changes.length} change${outcome.changes.length === 1 ? '' : 's'}.` : 'Nothing to change: the layout already follows the principles.';
   publish({state: 'done', before: outcome.before, after: outcome.after, changes: outcome.changes, rejected: outcome.rejected, trials: outcome.trials, project: outcome.project});
  } catch (e) { message = e.message; publish({state: 'error', message: e.message}); }
  finally { running = false; progress = ''; candidate = null; }
  return result;
 }
 export function apply() {
  if (!result?.changes.length) return;
  if (JSON.stringify($state.snapshot(project)) !== lastBaseline) { message = 'The booklet changed since the pass. Run it again.'; result = null; return; }
  const next = result.project; result = null; message = 'Applied as one undo step.'; publish({...window.__bookletComposeResult, state: 'applied'}); onchange(next);
 }
 function discard() { result = null; message = 'Discarded. Nothing changed.'; publish({state: 'discarded'}); }
 const kinds = $derived(result ? [...new Set(result.changes.map(c => c.kind))] : []);
 const shown = $derived(result ? result.changes.filter(c => filter === 'all' || (filter === 'reviewed' ? c.reviewed : c.kind === filter)) : []);
 const metric = (a, b) => a === b ? String(a) : `${a} → ${b}`;
 onMount(() => { window.__bookletCompose = run; window.__bookletComposeApply = apply; return () => { delete window.__bookletCompose; delete window.__bookletComposeApply; }; });
</script>
<section class="compose" aria-label="Paginate booklet">
 <button disabled={running || !project} onclick={() => run()}>{running ? 'Measuring…' : 'Paginate booklet'}</button>
 {#if progress}<small role="status">{progress}</small>{/if}
 {#if message}<p role="status">{message}</p>{/if}
 {#if result}
  <table class="metrics" aria-label="Before and after">
   <tbody>
    <tr><th>Pages</th><td>{metric(result.before.pages, result.after.pages)}</td></tr>
    <tr><th>Split questions</th><td>{metric(result.before.splitQuestions, result.after.splitQuestions)}</td></tr>
    <tr><th>Split lessons</th><td>{metric(result.before.splitLessons, result.after.splitLessons)}</td></tr>
    <tr><th>Half-empty pages</th><td>{metric(result.before.halfEmpty, result.after.halfEmpty)}</td></tr>
   </tbody>
  </table>
  {#if result.changes.length}
   <label>Show<select bind:value={filter}><option value="all">All changes</option>{#if reviewed}<option value="reviewed">Reviewed blocks only</option>{/if}{#each kinds as kind}<option value={kind}>{kind}</option>{/each}</select></label>
   <ul class="changes" aria-label="Changes">{#each shown as c}<li class:reviewed={c.reviewed}>{describeChange(c, result.label)}{#if c.reviewed} · reviewed{/if}</li>{/each}</ul>
   <div class="actions"><button onclick={apply}>Accept</button><button onclick={discard}>Discard</button></div>
  {/if}
 {/if}
</section>
{#if candidate}<div class="compose-probe" aria-hidden="true"><FlowBookletPreview bind:this={probe} project={candidate} edition={probeEdition} {options} zoom={1}/></div>{/if}
<style>
 .compose{border-bottom:1px solid var(--border,#ccd5df);padding:8px 0 12px;margin-bottom:12px;font:13px system-ui;display:grid;gap:6px}
 button,select{font:inherit;min-height:32px;padding:4px 10px;border:1px solid #aab5c2;border-radius:5px;color:inherit;background:var(--panel,#fff);cursor:pointer;text-align:left}
 button:disabled{opacity:.5;cursor:default}label{display:flex;gap:6px;align-items:center}p{margin:0}
 .metrics{border-collapse:collapse}.metrics th{text-align:left;font-weight:normal;padding-right:12px}
 .changes{margin:0;padding-left:18px;max-height:220px;overflow:auto}.changes .reviewed{color:#a15c00}.actions{display:flex;gap:6px}
 .compose-probe{position:fixed;left:-20000px;top:0;width:830px;height:600px;overflow:hidden;visibility:hidden;pointer-events:none}
 @media print{.compose,.compose-probe{display:none}}
</style>
