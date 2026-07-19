<script>
  import MathText from './Math.svelte';
  import Tikz from './Tikz.svelte';
  import { splitInlineContent, groupTextBlocks } from '../lib/inline-content.js';

  let { text = '', class: className = '' } = $props();
  let parsed = $derived(splitInlineContent(text));
</script>

<div class="inline-content {className}">
  {#each parsed.parts as part}
    {#if part.type === 'tikz'}
      <div class="inline-tikz"><Tikz code={part.value} /></div>
    {:else if part.value}
      {#each groupTextBlocks(part.value) as block}
        {#if block.kind === 'blank'}<div class="blank-line" aria-hidden="true"></div>{:else}<div class="text-line"><MathText text={block.value} /></div>{/if}
      {/each}
    {/if}
  {/each}
</div>

<style>
  .inline-content { width: 100%; }
  .text-line { min-height: 1.25em; }
  .blank-line { height: 0.55rem; }
  .inline-tikz { width: 100%; display: flex; justify-content: center; overflow-x: auto; margin: 0.45rem 0; }
  .inline-tikz :global(svg) { max-width: 100%; height: auto; }
</style>
