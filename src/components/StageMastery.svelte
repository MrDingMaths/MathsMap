<script>
  // My learning: share of each stage's skills that are mastered, as a ring with
  // the percentage inside. `progress` is the store's allProgress() map.
  import { skills } from '../lib/data.js';

  let { progress = {} } = $props();

  const STAGES = ['3', '4', '5', '6'];
  const R = 26;
  const C = 2 * Math.PI * R;

  let stages = $derived(STAGES.map((stage) => {
    const pool = skills.filter((skill) => String(skill.stage) === stage);
    let mastered = 0;
    let inProgress = 0;
    for (const skill of pool) {
      const level = progress[skill.id]?.level;
      if (level === 'mastered') mastered++;
      else if (level === 'learning' || level === 'proficient') inProgress++;
    }
    const fraction = pool.length ? mastered / pool.length : 0;
    const percent = fraction * 100;
    const label = mastered === 0 ? '0%' : percent < 1 ? '<1%' : `${Math.round(percent)}%`;
    return { stage, total: pool.length, mastered, inProgress, fraction, label };
  }).filter((row) => row.total > 0));
</script>

<ul class="stage-mastery">
  {#each stages as row}
    <li aria-label="Stage {row.stage}: {row.label} mastered, {row.mastered} of {row.total} skills">
      <svg class="stage-ring" width="68" height="68" viewBox="0 0 68 68" aria-hidden="true">
        <circle class="track" cx="34" cy="34" r={R} />
        {#if row.fraction > 0}
          <circle class="arc" cx="34" cy="34" r={R} stroke-dasharray="{Math.max(C * row.fraction, 2)} {C}" transform="rotate(-90 34 34)" />
        {/if}
        <text x="34" y="34" dominant-baseline="central" text-anchor="middle">{row.label}</text>
      </svg>
      <div class="stage-text">
        <strong>Stage {row.stage}</strong>
        <span>{row.mastered} of {row.total} skills mastered</span>
        {#if row.inProgress}<span class="in-progress">{row.inProgress} in progress</span>{/if}
      </div>
    </li>
  {/each}
</ul>

<style>
  .stage-mastery { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.75rem; }
  li { display: flex; align-items: center; gap: 0.9rem; padding: 0.85rem 1rem; border: 1px solid var(--border); border-radius: var(--radius-md, 10px); background: var(--panel); }
  .stage-ring { flex: none; overflow: visible; }
  circle { fill: none; stroke-width: 6; }
  .track { stroke: color-mix(in srgb, var(--status-none) 28%, transparent); }
  .arc { stroke: var(--status-mastered-fill); stroke-linecap: round; transition: stroke-dasharray var(--motion-slow, 0.4s) var(--ease-out, ease-out); }
  text { fill: var(--text); font: 800 14px var(--font-body, 'Nunito', sans-serif); }
  .stage-text { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
  .stage-text strong { font-size: 1.05rem; color: var(--text); }
  .stage-text span { color: var(--muted); font-size: 0.85rem; }
  .in-progress { color: var(--status-learning-fill) !important; font-weight: 650; }
</style>
