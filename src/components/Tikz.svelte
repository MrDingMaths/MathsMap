<script>
  import { renderTikzCode } from '../lib/tikz.js';

  let { code } = $props();
  let el = $state(null);

  $effect(() => {
    if (el && code) renderTikzCode(el, code);
    return () => {
      const job = el?._tikzJob;
      if (job) {
        if (job.timer) clearTimeout(job.timer);
        if (job._outcomeObs) job._outcomeObs.disconnect();
      }
    };
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
