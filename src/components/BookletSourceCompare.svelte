<script>
 import {reportUrl,runIdOf,sourceOptionsOf,reviewQueue} from '../lib/booklet-source-compare.js';
 // The source page(s) of the selected block, and the polish review queue of the booklet's import run
 // (polish/report.json: what the residual review left, the page breaks worth removing, pedagogy findings that were
 // only reported). Without a report it says how to make one.
 let { project, block = null, onselect = () => {} } = $props();
 const runId = $derived(runIdOf(project));
 let report = $state.raw(null), status = $state('loading'), pageChoice = $state(null);
 async function load(id) {
  status = 'loading'; report = null;
  if (!id) { status = 'no-run'; return; }
  let data = null;
  try { const response = await fetch(reportUrl(id), { cache: 'no-cache' }); data = response.ok ? await response.json() : null; } catch { data = null; }
  if (runIdOf(project) !== id) return;
  report = data; status = data ? 'ready' : 'none';
 }
 $effect(() => { load(runId); });
 const pages = $derived(sourceOptionsOf(project,block));
 const sourcePage = $derived(pages.find(page=>page.key===pageChoice) ?? pages[0] ?? null);
 const queue = $derived(reviewQueue(report));
 const label = $derived(block ? block.sourceAtom?.label || block.title || block.id : '');
 $effect(() => { block?.id; pageChoice = null; });
</script>
<div class="source-compare" data-source-compare data-status={status}>
 {#if !runId && !pages.length}
  <p class="note">This booklet was not imported from a source document, so there are no source pages.</p>
 {:else if !block}
  <p class="note">Select a block to see the source page it was transcribed from.</p>
 {:else}
  <header><strong data-compare-label>{label}</strong></header>
  {#if pages.length > 1}
   <div class="pages" role="group" aria-label="Source pages">{#each pages as page (page.key)}<button type="button" aria-pressed={page.key === sourcePage?.key} onclick={() => pageChoice = page.key}>{page.label}</button>{/each}</div>
  {/if}
  {#if sourcePage}
   <div class="source-page" data-compare-page={sourcePage.pageNumber} data-compare-run={sourcePage.runId}><img src={sourcePage.url} alt={sourcePage.label} loading="lazy" /></div>
  {:else}
   <p class="note">This block records no source page.</p>
  {/if}
 {/if}
 {#if runId}
  <h3>Polish review <span class="count">{queue.length}</span></h3>
  {#if status === 'loading'}
   <p class="note">Reading the polish report…</p>
  {:else if status === 'none'}
   <p class="note">No polish report yet for this booklet. It is made by <code>node polish/run.mjs --project {project?.id}</code> and appears here when it has run.</p>
  {:else if queue.length}
   <ol class="queue" data-compare-queue>{#each queue as row}<li><button type="button" class:current={block?.id === row.target} disabled={!row.target} onclick={() => row.target && onselect(row.target)}><span class="id">{row.label}</span><span class="meta">{row.detail}</span></button></li>{/each}</ol>
  {:else}
   <p class="note ok">Nothing is waiting for review.</p>
  {/if}
 {/if}
</div>
<style>
 .source-compare{display:grid;gap:8px;font:13px system-ui}
 .note{margin:0;opacity:.8}.note.ok{color:#1f9d4c;opacity:1}code{font-size:12px}
 header{display:flex;justify-content:space-between;gap:8px;align-items:baseline}
 .pages{display:flex;flex-wrap:wrap;gap:4px}.pages button{border:1px solid #8a96a8;background:transparent;color:inherit;border-radius:4px;padding:2px 8px;cursor:pointer}.pages button[aria-pressed=true]{background:#438ccc;color:#fff;border-color:#438ccc}
 .source-page{border:1px solid #c5cedb;line-height:0;background:#fff}.source-page img{width:100%;height:auto;display:block}
 h3{margin:6px 0 0;font:600 13px system-ui}.count{margin-left:4px;padding:0 6px;border-radius:8px;background:#438ccc;color:#fff;font-size:11px}
 .queue{margin:0;padding:0;list-style:none;display:grid;gap:3px}.queue button{display:grid;gap:2px;width:100%;text-align:left;border:0;border-bottom:1px solid #8a96a855;background:transparent;color:inherit;padding:5px 2px;cursor:pointer;font:inherit}.queue button:disabled{cursor:default}.queue button.current{background:#438ccc33}.queue .id{font-weight:600}.queue .meta{opacity:.8;font-size:12px;overflow-wrap:anywhere}
</style>
