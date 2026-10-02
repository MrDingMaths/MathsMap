<script>
  // Theory fields carry the same rich-text format as practice cards, inline
  // `[tikz]` figures included, so they render through InlineContent rather than
  // MathText. InlineContent emits block-level divs, hence `.theory-intro` is a
  // div: a div inside a <p> would close the paragraph early.
  import InlineContent from './InlineContent.svelte';
  import { getWorkedExamples } from '../lib/theory-content.js';
  let { theory } = $props();
  let examples = $derived(getWorkedExamples(theory));
</script>

<div class="theory">
  {#if theory.intro}<div class="theory-intro"><InlineContent text={theory.intro} /></div>{/if}
  {#if theory.facts?.length}<ul class="theory-facts">{#each theory.facts as fact}<li><InlineContent text={fact} /></li>{/each}</ul>{/if}
  {#if theory.steps?.length}
    <div class="theory-sub">Method</div>
    <ol class="theory-steps">{#each theory.steps as step}<li><InlineContent text={step} /></li>{/each}</ol>
  {/if}
  {#each examples as example, i}
    <section class="worked-example" aria-label={examples.length > 1 ? `Worked example ${i + 1}` : 'Worked example'}>
      <div class="theory-sub">{examples.length > 1 ? `Worked example ${i + 1}` : 'Worked example'}</div>
      <div class="example-question"><InlineContent text={example.question_text ?? ''} /></div>
      <div class="example-solution"><InlineContent text={example.solution_text ?? ''} /></div>
    </section>
  {/each}
</div>

<style>
  .theory { padding: 1.2rem 1.35rem; border-radius: var(--radius-md); background: var(--surface-soft); }
  .worked-example { margin-top: 1rem; border-top: 1px solid var(--border); }
  .example-question { font-weight: 600; margin-bottom: 0.7rem; }
  .example-solution { line-height: 1.55; }
  .theory-intro { margin: 0 0 0.8rem; font-size: 1rem; line-height: 1.65; }
  .theory-facts { margin: 0; padding-left: 1.15rem; display: flex; flex-direction: column; gap: 0.45rem; }
  .theory-facts li { padding-left: 0.2rem; font-size: 1rem; line-height: 1.6; }
  .theory-sub { margin: 1rem 0 0.5rem; font-size: 0.7rem; font-weight: 750; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
  .theory-steps { margin: 0; padding-left: 1.35rem; display: flex; flex-direction: column; gap: 0.4rem; }
  .theory-steps li { padding-left: 0.2rem; font-size: 1rem; line-height: 1.55; }
</style>
