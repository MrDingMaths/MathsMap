<script>
  import { MASTERY } from '../lib/store.js';
  import MasteryRing from './MasteryRing.svelte';

  let { level = 'none', compact = false, label = true } = $props();
</script>

<span class="mastery-status status-{level}" class:compact aria-label={MASTERY[level].label}>
  <MasteryRing {level} size={compact ? 15 : 18} />
  {#if label}<span>{MASTERY[level].label}</span>{/if}
</span>

<style>
  .mastery-status {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    width: max-content;
    color: var(--status-none);
    font-size: 0.78rem;
    font-weight: 700;
    line-height: 1;
  }
  .status-learning { color: var(--status-learning); }
  .status-proficient { color: var(--status-proficient); }
  .status-mastered { color: var(--status-mastered); }
  .compact { gap: 0.3rem; font-size: 0.75rem; }
</style>
