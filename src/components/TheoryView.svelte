<script>
  import MathText from './Math.svelte';

  let { theory } = $props();
</script>

<div class="theory">
  {#if theory.intro}<p class="theory-intro"><MathText text={theory.intro} /></p>{/if}
  {#if theory.facts?.length}
    <ul class="theory-facts">
      {#each theory.facts as f}<li><MathText text={f} /></li>{/each}
    </ul>
  {/if}
  {#if theory.steps?.length}
    <div class="theory-sub">Procedure</div>
    <ol class="theory-steps">
      {#each theory.steps as s}<li><MathText text={s} /></li>{/each}
    </ol>
  {/if}
</div>

<style>
  .theory {
    padding: 1.1rem 1.3rem;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--panel);
  }
  .theory-intro { margin: 0 0 0.8rem; font-size: 1rem; }
  .theory-facts { margin: 0; padding-left: 1.1rem; display: flex; flex-direction: column; gap: 0.4rem; }
  .theory-facts li { font-size: 1rem; }
  .theory-sub {
    margin: 1rem 0 0.5rem;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .theory-steps { margin: 0; padding-left: 1.3rem; display: flex; flex-direction: column; gap: 0.4rem; }
  .theory-steps li { font-size: 1rem; }
</style>
