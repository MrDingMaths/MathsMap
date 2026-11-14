<script>
  // Mastery as a ring: the arc length carries the state as well as the colour,
  // matching the map's node rings. none = track only, learning = a third,
  // proficient = two thirds, mastered = full ring with a tick.
  let { level = 'none', size = 18 } = $props();

  const R = 7;
  const C = 2 * Math.PI * R;
  const FRACTION = { none: 0, learning: 1 / 3, proficient: 2 / 3, mastered: 1 };
  let fraction = $derived(FRACTION[level] ?? 0);
</script>

<svg class="ring level-{level}" width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
  <circle class="track" cx="9" cy="9" r={R} />
  {#if fraction > 0}
    <circle
      class="arc"
      cx="9"
      cy="9"
      r={R}
      stroke-dasharray="{C * fraction} {C}"
      transform="rotate(-90 9 9)"
    />
  {/if}
  {#if level === 'mastered'}
    <polyline class="tick" points="5.6,9.2 8,11.4 12.4,6.8" />
  {/if}
</svg>

<style>
  .ring { display: block; flex: none; overflow: visible; }
  circle { fill: none; stroke-width: 2.2; }
  .track { stroke: color-mix(in srgb, var(--status-none) 32%, transparent); }
  .arc { stroke-linecap: round; transition: stroke-dasharray var(--motion-slow) var(--ease-out); }
  .level-learning .arc { stroke: var(--status-learning-fill); }
  .level-proficient .arc { stroke: var(--status-proficient-fill); }
  .level-mastered .arc { stroke: var(--status-mastered-fill); }
  .tick { fill: none; stroke: var(--status-mastered-fill); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
</style>
