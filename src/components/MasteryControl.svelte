<script>
  import { getMastery, setMastery, subscribe, LEVELS, MASTERY } from '../lib/store.js';
  import MasteryStatus from './MasteryStatus.svelte';

  let { skillId } = $props();
  let current = $state('none');
  $effect(() => subscribe(() => { current = getMastery(skillId); }));
</script>

<section class="mastery-control" aria-labelledby="mastery-title">
  <div class="head">
    <div><span class="eyebrow">Progress</span><h2 id="mastery-title">Your mastery</h2></div>
    <MasteryStatus level={current} />
  </div>
  <div class="selector" role="group" aria-label="Set mastery level">
    {#each LEVELS as level}
      <button
        class="option status-{level}"
        class:selected={current === level}
        aria-pressed={current === level}
        onclick={() => setMastery(skillId, level)}
      >
        <MasteryStatus {level} label={false} />
        <span>{MASTERY[level].label}</span>
      </button>
    {/each}
  </div>
  <p class="hint">Choose the description that best matches how this skill feels today.</p>
</section>

<style>
  .mastery-control { padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--panel); box-shadow: var(--shadow); }
  .head { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.85rem; }
  .eyebrow { display: block; color: var(--muted); font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
  h2 { margin: 0.08rem 0 0; font-size: 1rem; }
  .selector { display: grid; grid-template-columns: 1fr 1fr; gap: 0.45rem; }
  .option { display: flex; align-items: center; gap: 0.45rem; min-height: 42px; padding: 0.45rem 0.55rem; border: 1px solid var(--border); border-radius: 10px; background: transparent; color: var(--text); font: 650 0.76rem var(--font-body); cursor: pointer; text-align: left; transition: border-color var(--motion-fast), background var(--motion-fast), transform var(--motion-fast) var(--ease-snap), box-shadow var(--motion-fast); }
  .option:hover { border-color: var(--border-strong); background: var(--surface-soft); }
  .option.selected { border-color: currentColor; background: color-mix(in srgb, currentColor 9%, transparent); transform: translateY(-1px); animation: selection-pop var(--motion-base) var(--ease-snap); }
  .option:active { transform: scale(0.97); }
  .option.status-none { color: var(--status-none); }
  .option.status-learning { color: var(--status-learning); }
  .option.status-proficient { color: var(--status-proficient); }
  .option.status-mastered { color: var(--status-mastered); }
  .option > span:last-child { color: var(--text); }
  .hint { margin: 0.75rem 0 0; color: var(--muted); font-size: 0.72rem; line-height: 1.4; }
</style>
