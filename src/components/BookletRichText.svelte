<script>
  import InlineContent from './InlineContent.svelte';
  import { renderRichTextHtml } from '../lib/maths-editor.js';

  let { text = '', class: className = '', fillCloze = false } = $props();
  let isRich = $derived(Boolean(text && typeof text === 'object' && (text.paragraphs || text.inlines || text.segments)));
  let html = $derived(isRich ? renderRichTextHtml(text, { fillCloze }) : '');
</script>

{#if isRich}
  <div class="rich-content {className}">{@html html}</div>
{:else}
  <InlineContent text={text} class={className} />
{/if}

<style>
  .rich-content :global(p) { margin: 0 0 0.55rem; }
  .rich-content :global(p:last-child) { margin-bottom: 0; }
  .rich-content :global(.math-island) { white-space: nowrap; }
  .rich-content :global(.cloze-island) { display: inline-block; min-width: var(--cloze-width, 24mm); border-bottom: 1px solid currentColor; color: transparent; vertical-align: baseline; }
  .rich-content :global(.cloze-island:not(:empty)) { color: inherit; }
</style>
