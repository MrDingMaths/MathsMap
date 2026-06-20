<script>
  // Shared segmented mastery bar (mastered → proficient → learning), driven by a
  // stats object from store.js. Used by the course/topic heroes (SlabHero), the
  // topic cards, and the browse list, so the bar logic lives in one place.
  // `light` switches to translucent-white styling for use over a colored banner.
  let { stats, light = false, height = '10px' } = $props();
</script>

<div class="bar" class:light style="height:{height}">
  <span style="width:{stats.masteredPct}%;background:var(--m-mastered)"></span>
  <span style="width:{stats.proficientPct}%;background:var(--m-proficient)"></span>
  <span style="width:{stats.learningPct}%;background:var(--m-learning)"></span>
</div>

<style>
  .bar { display: flex; border-radius: 999px; overflow: hidden; background: var(--track); }
  .bar.light { background: rgba(255, 255, 255, 0.22); }
  .bar > span { display: block; height: 100%; }
</style>
