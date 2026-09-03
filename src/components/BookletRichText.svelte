<script>
  import InlineContent from './InlineContent.svelte';
  import { renderRichTextHtml } from '../lib/maths-editor.js';
  import { splitBookletTables } from '../lib/booklet-preview.js';

  let { text = '', class: className = '', fillCloze = false } = $props();
  let isRich = $derived(Boolean(text && typeof text === 'object' && (text.paragraphs || text.inlines || text.segments)));
  let html = $derived(isRich ? renderRichTextHtml(text, { fillCloze }) : '');
  let parts = $derived(isRich ? [] : splitBookletTables(text));
</script>

{#if isRich}
  <div class="rich-content {className}">{@html html}</div>
{:else}
  <div class="booklet-content {className}">
    {#each parts as part}
      {#if part.type === 'table'}
        <table>
          {#if part.header}<thead><tr>{#each part.header as cell}<th><InlineContent text={cell} /></th>{/each}</tr></thead>{/if}
          <tbody>{#each part.rows as row}<tr>{#each row as cell}<td><InlineContent text={cell} /></td>{/each}</tr>{/each}</tbody>
        </table>
      {:else if part.value.includes('[[')}
        <div class="rich-content">{@html renderRichTextHtml(part.value, { fillCloze })}</div>
      {:else}
        <InlineContent text={part.value} />
      {/if}
    {/each}
  </div>
{/if}

<style>
  .booklet-content table { width: 100%; margin: 2mm 0; border-collapse: collapse; table-layout: fixed; }
  .booklet-content th, .booklet-content td { padding: 1.5mm 2mm; border: .25mm solid #2f4058; vertical-align: top; text-align: left; }
  .booklet-content th { background: #edf4f9; color: #244e74; font-weight: 800; }
  .rich-content :global(p) { margin: 0 0 0.55rem; }
  .rich-content :global(p:last-child) { margin-bottom: 0; }
  .rich-content :global(.math-island) { white-space: nowrap; }
  .rich-content :global(.cloze-island) { display: inline-block; min-width: var(--cloze-width, 24mm); border-bottom: 1px solid currentColor; color: transparent; vertical-align: baseline; }
  .rich-content :global(.cloze-island:not(:empty)) { color: inherit; }
</style>
