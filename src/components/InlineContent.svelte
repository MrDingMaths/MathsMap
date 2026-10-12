<script>
  import {getContext} from 'svelte';
  const presentation=getContext('booklet-presentation');
  import MathText from './Math.svelte';
  import Tikz from './Tikz.svelte';
  import { isDocument, documentHtml } from '../lib/document-content.js';
  import { splitInlineContent, groupTextBlocks } from '../lib/inline-content.js';

  let { text = '', class: className = '', alignRelations = true, textColor = null, nativeTables = false } = $props();
  let parsed = $derived(splitInlineContent(text));
</script>

<div class="inline-content {className}" class:fixed-text-color={!!textColor} style:--inline-text-color={textColor}>
  {#if isDocument(text)}{@html documentHtml(text,{mathsStyle:presentation?.()?.mathsStyle})}{:else}
  {#each parsed.parts as part}
    {#if part.type === 'tikz'}
      <div class="inline-tikz"><Tikz code={part.value} /></div>
    {:else if part.value}
      {#each groupTextBlocks(part.value, { alignRelations, nativeTables }) as block}
        {#if block.kind === 'table'}<div class="text-table">{@html documentHtml({blocks:[block.table]})}</div>{:else if block.kind === 'list'}<div class="text-list">{@html documentHtml({blocks:[block.list]})}</div>{:else if block.kind === 'blank'}<div class="blank-line" aria-hidden="true"></div>{:else}<div class="text-line"><MathText text={block.value} /></div>{/if}
      {/each}
    {/if}
  {/each}
  {/if}
</div>

<style>
  .inline-content { width: 100%; }
  .text-line { min-height: 1.25em; }
  .fixed-text-color { color: var(--inline-text-color); }
  /* Keep long native working readable on narrow screens without shrinking
     mathematical glyphs or letting it escape the worked-example surface. */
  .fixed-text-color .text-line { max-width: 100%; overflow-x: auto; }
  .fixed-text-color .text-line :global(.katex),
  .fixed-text-color .text-table :global(.katex) { display: inline-block; white-space: nowrap; }
  /* Reserve fraction ink inside the horizontal scrolling viewport. */
  .fixed-text-color .text-line :global(.katex:has(.mfrac)),
  .fixed-text-color .text-list :global(.katex:has(.mfrac)),
  .fixed-text-color .text-table :global(.katex:has(.mfrac)) { padding-block:0.25em; }
  .fixed-text-color .text-line :global(.katex-display) { text-align: left; }
  .fixed-text-color .inline-tikz { color: #000000; }
  .fixed-text-color .inline-tikz { justify-content:safe center; }
  /* Measured label padding grows the drawing slot. Flex shrink would consume
     that width again and can collapse a calibrated SVG on a narrow screen. */
  .fixed-text-color .inline-tikz :global(.tikz-wrap) { flex-shrink:0; max-width:100%; }
  .text-table { max-width:100%; overflow-x:auto; margin:.5rem 0; }
  /* Source tables carry no authored column widths. Fit their actual content
     rather than squeezing non-wrapping maths into fixed percentage cells. */
  .text-table :global([data-table-wrap]) { width:max-content !important; max-width:none !important; min-width:100%; }
  .text-table :global(table) { width:max-content !important; min-width:100%; table-layout:auto !important; }
  .text-table :global(col) { width:auto !important; }
  /* Colour text and mathematics only. TikZ SVGs and document image/diagram
     annotations retain their authored palette. Explicit old math colours must
     not override the question/solution colour contract. KaTeX phantom spans
     (and their descendants) must retain transparent ink for equals gutters. */
  .fixed-text-color .text-line,
  .fixed-text-color .text-line :global(span:not(.strut):not([style*="color: transparent"]):not([style*="color:transparent"]):not(.katex [style*="color: transparent"] *):not(.katex [style*="color:transparent"] *)),
  .fixed-text-color :global(p),
  .fixed-text-color :global(p span:not(.strut):not([style*="color: transparent"]):not([style*="color:transparent"]):not(.katex [style*="color: transparent"] *):not(.katex [style*="color:transparent"] *)) { color: var(--inline-text-color) !important; }
  /* Separate adjacent fraction-bearing lines, including equation-to-prose
     transitions. Rows inside one aligned equation keep their own spacing. */
  .text-line:has(:global(.mfrac)) + .text-line:has(:global(.mfrac)) { margin-top: 8pt; }
  .blank-line { height: 0.55rem; }
  .inline-tikz { width: 100%; display: flex; justify-content: center; overflow-x: auto; margin: 0.45rem 0; }
  .inline-tikz :global(svg) { max-width: 100%; height: auto; }
</style>
