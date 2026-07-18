<script>
  let { stats, light = false, height = '10px' } = $props();
</script>

<div class="bar" class:light style="height:{height}" aria-label={`${stats.mastered} mastered, ${stats.proficient} proficient, ${stats.learning} learning`}>
  <span class="mastered" style="width:{stats.masteredPct}%"></span>
  <span class="proficient" style="width:{stats.proficientPct}%"></span>
  <span class="learning" style="width:{stats.learningPct}%"></span>
</div>

<style>
  .bar { display: flex; gap: 2px; border-radius: 999px; overflow: hidden; background: var(--track); }
  .bar.light { background: color-mix(in srgb, var(--status-none) 18%, transparent); }
  .bar > span { display: block; height: 100%; transition: width var(--motion-slow) var(--ease-out); }
  .mastered { background: var(--status-mastered-fill); }
  .proficient { background: var(--status-proficient-fill); }
  .learning { background: var(--status-learning-fill); }
</style>
