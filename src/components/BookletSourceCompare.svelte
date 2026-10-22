<script>
 import {regionsUrl,queueUrl,pageImageUrl,runIdOf,regionParts,confidenceOf,entryFor,itemFor,sortedQueue,describeMismatch,regionPages} from '../lib/booklet-source-compare.js';
 // The source page with the selected block's region highlighted, the relationships that still differ
 // from the source, and the review queue (lowest confidence first). It reads source-match/regions.json
 // and review-queue.json of the booklet's import run; without them it says how to make them.
 let { project, block = null, onselect = () => {} } = $props();
 const runId = $derived(runIdOf(project));
 let regions = $state.raw(null), queue = $state.raw(null), status = $state('loading'), pageChoice = $state(null);
 async function load(id) {
  status = 'loading'; regions = null; queue = null;
  if (!id) { status = 'no-run'; return; }
  const get = async url => { try { const response = await fetch(url, { cache: 'no-cache' }); return response.ok ? await response.json() : null; } catch { return null; } };
  const [r, q] = await Promise.all([get(regionsUrl(id)), get(queueUrl(id))]);
  if (runIdOf(project) !== id) return;
  regions = r; queue = q; status = r ? 'ready' : 'none';
 }
 $effect(() => { load(runId); });
 const entry = $derived(block ? entryFor(regions, block.id) : null);
 const item = $derived(block ? itemFor(queue, block.id) : null);
 const parts = $derived(regionParts(entry));
 const pages = $derived(regionPages(entry));
 const sourcePage = $derived(pages.includes(pageChoice) ? pageChoice : pages[0] ?? block?.sourcePageNumber ?? null);
 const here = $derived(parts.filter(p => p.page === sourcePage));
 const confidence = $derived(confidenceOf(entry, item));
 const ordered = $derived(sortedQueue(queue));
 const mismatches = $derived([...(item?.mismatches ?? []), ...(item?.findings ?? [])]);
 const label = $derived(block ? block.sourceAtom?.label || block.title || block.id : '');
 $effect(() => { block?.id; pageChoice = null; });
</script>
<div class="source-compare" data-source-compare data-status={status}>
 {#if status === 'loading'}
  <p class="note">Reading the source regions…</p>
 {:else if status === 'no-run'}
  <p class="note">This booklet was not imported from a source document, so there are no source regions.</p>
 {:else if status === 'none'}
  <p class="note">No source regions yet for this booklet. They are made by <code>node source-match/run.mjs --project {project?.id}</code> and appear here when it has run.</p>
 {:else}
  {#if !block}
   <p class="note">Select a block to see where the source prints it.</p>
  {:else}
   <header><strong data-compare-label>{label}</strong><span class="confidence" data-compare-confidence class:low={confidence.rank !== null && confidence.rank < .6 && confidence.rank >= 0}>{confidence.label}</span></header>
   {#if !entry}
    <p class="note">The source-match run has no region for this block (it covers teaching blocks only).</p>
   {:else}
    {#if pages.length > 1}
     <div class="pages" role="group" aria-label="Source pages">{#each pages as number}<button type="button" aria-pressed={number === sourcePage} onclick={() => pageChoice = number}>p{number}</button>{/each}</div>
    {/if}
    {#if sourcePage}
     <div class="source-page" data-compare-page={sourcePage}>
      <img src={pageImageUrl(runId, sourcePage)} alt={`Source page ${sourcePage}`} loading="lazy" />
      {#each here as part}<div class="region" data-compare-region style:left={part.left + '%'} style:top={part.top + '%'} style:width={part.width + '%'} style:height={part.height + '%'}></div>{/each}
     </div>
    {/if}
    {#if entry.structure || item?.structure}<p class="note">Follows the source as <strong>{(item?.structure ?? entry.structure)?.preset ?? 'a custom arrangement'}</strong>.</p>{/if}
    {#if mismatches.length}
     <h3>Still different from the source</h3>
     <ul class="mismatches" data-compare-mismatches>{#each mismatches as m}<li class:ambiguous={m.severity === 'ambiguous'}>{describeMismatch(m)}</li>{/each}</ul>
    {:else}
     <p class="note ok" data-compare-clear>Every relationship matches its source.</p>
    {/if}
   {/if}
  {/if}
  <h3>Review queue <span class="count">{ordered.length}</span></h3>
  {#if ordered.length}
   <ol class="queue" data-compare-queue>{#each ordered as row}<li><button type="button" class:current={block?.id === row.blockId} onclick={() => onselect(row.blockId)}><span class="id">{row.blockId}</span><span class="meta">{row.located ? 'located' : row.confidence != null ? Math.round(row.confidence * 100) + '%' : '-'} · {row.mismatches?.length ?? 0} differ{row.sourcePage ? ' · p' + row.sourcePage : ''}</span></button></li>{/each}</ol>
  {:else}
   <p class="note">Nothing is waiting for review.</p>
  {/if}
 {/if}
</div>
<style>
 .source-compare{display:grid;gap:8px;font:13px system-ui}
 .note{margin:0;opacity:.8}.note.ok{color:#1f9d4c;opacity:1}code{font-size:12px}
 header{display:flex;justify-content:space-between;gap:8px;align-items:baseline}.confidence{font-size:12px;opacity:.75}.confidence.low{color:#e0584e;font-weight:600;opacity:1}
 .pages{display:flex;gap:4px}.pages button{border:1px solid #8a96a8;background:transparent;color:inherit;border-radius:4px;padding:2px 8px;cursor:pointer}.pages button[aria-pressed=true]{background:#438ccc;color:#fff;border-color:#438ccc}
 .source-page{position:relative;border:1px solid #c5cedb;line-height:0;background:#fff}.source-page img{width:100%;height:auto;display:block}
 .region{position:absolute;box-sizing:border-box;border:2px solid #e0301e;background:rgba(224,48,30,.12);pointer-events:none}
 h3{margin:6px 0 0;font:600 13px system-ui}.count{margin-left:4px;padding:0 6px;border-radius:8px;background:#438ccc;color:#fff;font-size:11px}
 .mismatches,.queue{margin:0;padding-left:18px;display:grid;gap:3px}.mismatches li.ambiguous{color:#d49a2a}
 .queue{list-style:none;padding:0}.queue button{display:flex;justify-content:space-between;gap:8px;width:100%;text-align:left;border:0;border-bottom:1px solid #8a96a855;background:transparent;color:inherit;padding:5px 2px;cursor:pointer;font:inherit}.queue button.current{background:#438ccc33}.queue .id{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.queue .meta{flex:none;opacity:.75;font-size:12px}
</style>
