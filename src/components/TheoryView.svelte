<script>
  // Theory fields carry the same rich-text format as practice cards, inline
  // `[tikz]` figures included, so they render through InlineContent rather than
  // MathText. InlineContent emits block-level divs, hence `.theory-intro` is a
  // div: a div inside a <p> would close the paragraph early.
  import InlineContent from './InlineContent.svelte';
  let { theory } = $props();
</script>

<div class="theory">
  {#if theory.intro}<div class="theory-intro"><InlineContent text={theory.intro} /></div>{/if}
  {#if theory.facts?.length}<ul class="theory-facts">{#each theory.facts as fact}<li><InlineContent text={fact} /></li>{/each}</ul>{/if}
  {#if theory.steps?.length}
    <div class="theory-sub">Method</div>
    <ol class="theory-steps">{#each theory.steps as step}<li><InlineContent text={step} /></li>{/each}</ol>
  {/if}
</div>

<style>
  .theory { padding: 1.2rem 1.35rem; border-radius: var(--radius-md); background: var(--surface-soft); }
  .theory-intro { margin: 0 0 0.8rem; font-size: 1rem; line-height: 1.65; }
  .theory-facts { margin: 0; padding-left: 1.15rem; display: flex; flex-direction: column; gap: 0.45rem; }
  .theory-facts li { padding-left: 0.2rem; font-size: 1rem; line-height: 1.6; }
  .theory-sub { margin: 1rem 0 0.5rem; font-size: 0.7rem; font-weight: 750; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
  .theory-steps { margin: 0; padding-left: 1.35rem; display: flex; flex-direction: column; gap: 0.4rem; }
  .theory-steps li { padding-left: 0.2rem; font-size: 1rem; line-height: 1.55; }
</style>
