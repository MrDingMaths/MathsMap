<script>
  import MathText from './Math.svelte';

  // Single renderer for worked solutions app-wide (practice cards, quiz mode,
  // admin previews). `solution` is an array of { math, note? }.
  let { solution = [] } = $props();

  // Split a working line into a leading `=` and the expression, so steps align on
  // the equals sign and the first (no-`=`) line sits offset under them.
  const splitEq = (math) => {
    const m = /^\$\s*=\s*([\s\S]*)\$$/.exec(math ?? '');
    return m ? { eq: '$=$', expr: '$' + m[1] + '$' } : { eq: '', expr: math ?? '' };
  };
</script>

<ol class="wx-steps">
  {#each solution as line, i}
    {@const p = splitEq(line.math)}
    <li>
      {#if i > 0}
        <span class="wx-note" style="grid-row:{2 * i}">{#if line.note}<MathText text={line.note} />{/if}</span>
      {/if}
      <span class="wx-eq" style="grid-row:{2 * i + 1}"><MathText text={p.eq} /></span>
      <span class="wx-math" style="grid-row:{2 * i + 1}"><MathText text={p.expr} /></span>
    </li>
  {/each}
</ol>

<style>
  /* shared working grid (equals · expression · note) — used by practice solutions */
  .wx-steps {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: auto auto auto;
    row-gap: 0.15rem;
    column-gap: 0.55rem;
    align-items: baseline;
  }
  .wx-steps li { display: contents; }
  .wx-eq { grid-column: 1; text-align: right; font-size: 1.02rem; }
  .wx-math { grid-column: 2; font-size: 1.02rem; }
  .wx-note {
    grid-column: 3;
    justify-self: start;
    align-self: center;
    margin-left: 0.75rem;
    min-height: 0.9rem;
    font-size: 0.72rem;
    color: var(--muted);
    line-height: 1;
    white-space: nowrap;
  }
</style>
