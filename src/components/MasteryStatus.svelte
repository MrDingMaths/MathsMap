<script>
  import { MASTERY } from '../lib/store.js';

  let { level = 'none', compact = false, label = true } = $props();

  const symbols = {
    none: '',
    learning: '',
    proficient: '✓',
    mastered: '★'
  };
</script>

<span class="mastery-status status-{level}" class:compact aria-label={MASTERY[level].label}>
  <span class="status-symbol" aria-hidden="true">{symbols[level]}</span>
  {#if label}<span>{MASTERY[level].label}</span>{/if}
</span>

<style>
  .mastery-status {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    width: max-content;
    color: var(--status-none);
    font-size: 0.76rem;
    font-weight: 650;
    line-height: 1;
  }
  .status-symbol {
    display: inline-grid;
    place-items: center;
    width: 1.35rem;
    height: 1.35rem;
    border: 1px solid currentColor;
    border-radius: 999px;
    background: var(--panel);
    font-family: system-ui, sans-serif;
    font-size: 0.78rem;
    line-height: 1;
  }
  .status-learning { color: var(--status-learning); }
  .status-proficient { color: var(--status-proficient); }
  .status-mastered { color: var(--status-mastered); }
  .status-proficient .status-symbol,
  .status-mastered .status-symbol {
    color: #fff;
    border-color: transparent;
    background: currentColor;
  }
  .status-proficient .status-symbol { background: var(--status-proficient-fill); }
  .status-mastered .status-symbol { background: var(--status-mastered-fill); }
  .status-learning .status-symbol { background: linear-gradient(90deg, var(--status-learning-fill) 50%, var(--panel) 50%); }
  .compact { gap: 0.3rem; font-size: 0.7rem; }
  .compact .status-symbol { width: 1.1rem; height: 1.1rem; font-size: 0.65rem; }
</style>
