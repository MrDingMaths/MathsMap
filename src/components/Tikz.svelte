<script>
  import { renderTikzCode, cancelTikzJob } from '../lib/tikz.js';

  let { code, eager = false } = $props();
  let el = $state(null);

  $effect(() => {
    if (el && code) renderTikzCode(el, code, { eager });
    return () => cancelTikzJob(el);
  });
</script>

<div class="tikz-wrap" bind:this={el}></div>

<style>
  .tikz-wrap {
    margin: 0.75rem 0;
    min-height: 2rem;
    overflow-x: auto;
  }
  .tikz-wrap :global(.tikz-error) {
    font-size: 0.85rem;
    color: var(--muted);
    padding: 0.4rem 0;
  }
  /* TikZ SVGs render with black strokes on transparent background.
     Invert in dark mode so strokes are visible on the dark panel. */
  :global([data-theme="dark"]) .tikz-wrap :global(svg) {
    filter: invert(1);
  }
</style>
