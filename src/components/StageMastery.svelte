<script>
  // My learning: share of skills mastered, as a ring with the percentage
  // inside. Stages 3–5 count every skill at that stage. Stage 6 is split by
  // course (Year 11 Standard, Year 12 Advanced, …), because a student takes one
  // pathway and a single Stage 6 ring across all 560 skills could never fill.
  //
  // Most students work in one stage or course for a whole year, so only the
  // rows for their current courses stay open; the rest fold under a toggle.
  // Courses repeat earlier-stage skills as review (Year 11 Advanced includes 67
  // Stage 5 skills), so relevance is decided per course: a course whose active
  // skills mostly sit inside a busier course's active skills is explained by
  // that course and dropped; of the rest, any with at least half the busiest
  // course's activity is relevant. With no progress yet, every row shows.
  // `progress` is the store's allProgress() map.
  import { skills, courses } from '../lib/data.js';

  let { progress = {} } = $props();

  const R = 26;
  const C = 2 * Math.PI * R;
  const RELEVANT_SHARE = 0.5;
  const EXPLAINED_SHARE = 0.8;

  function summarise(pool) {
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
    return { total: pool.length, mastered, inProgress, active: mastered + inProgress, fraction, label };
  }

  let rows = $derived([
    ...['3', '4', '5'].map((stage) => ({ key: `stage-${stage}`, group: 'stage', title: `Stage ${stage}`, ...summarise(skills.filter((skill) => String(skill.stage) === stage)) })),
    ...courses
      .filter((course) => Number(course.stage) === 6)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((course) => ({ key: course.id, group: 'stage6', title: course.title, ...summarise(skills.filter((skill) => skill.courses?.includes(course.id))) })),
  ].filter((row) => row.total > 0));

  let busiest = $derived(Math.max(0, ...rows.map((row) => row.active)));

  // Row keys for the student's current courses (see the comment at the top).
  let relevantKeys = $derived.by(() => {
    const isActive = (skill) => ['learning', 'proficient', 'mastered'].includes(progress[skill.id]?.level);
    const activeByCourse = courses
      .map((course) => ({ course, ids: new Set(skills.filter((skill) => skill.courses?.includes(course.id) && isActive(skill)).map((skill) => skill.id)) }))
      .filter((entry) => entry.ids.size > 0);
    const explained = (entry) => activeByCourse.some((other) => other !== entry && other.ids.size > entry.ids.size
      && [...entry.ids].filter((id) => other.ids.has(id)).length >= EXPLAINED_SHARE * entry.ids.size);
    const own = activeByCourse.filter((entry) => !explained(entry));
    const top = Math.max(0, ...own.map((entry) => entry.ids.size));
    return new Set(own
      .filter((entry) => entry.ids.size >= top * RELEVANT_SHARE)
      .map(({ course }) => (Number(course.stage) === 6 ? course.id : `stage-${course.stage}`)));
  });
  let relevant = $derived(busiest === 0 ? rows : rows.filter((row) => relevantKeys.has(row.key)));
  let others = $derived(rows.filter((row) => !relevant.includes(row)));
  let showOthers = $state(false);
</script>

{#snippet ring(row)}
  <li aria-label="{row.title}: {row.label} mastered, {row.mastered} of {row.total} skills">
    <svg class="stage-ring" width="68" height="68" viewBox="0 0 68 68" aria-hidden="true">
      <circle class="track" cx="34" cy="34" r={R} />
      {#if row.fraction > 0}
        <circle class="arc" cx="34" cy="34" r={R} stroke-dasharray="{Math.max(C * row.fraction, 2)} {C}" transform="rotate(-90 34 34)" />
      {/if}
      <text x="34" y="34" dominant-baseline="central" text-anchor="middle">{row.label}</text>
    </svg>
    <div class="stage-text">
      <strong>{row.title}</strong>
      <span>{row.mastered} of {row.total} skills mastered</span>
      {#if row.inProgress}<span class="in-progress">{row.inProgress} in progress</span>{/if}
    </div>
  </li>
{/snippet}

{#snippet grouped(list)}
  {@const stageRows = list.filter((row) => row.group === 'stage')}
  {@const courseRows = list.filter((row) => row.group === 'stage6')}
  {#if stageRows.length}<ul class="stage-mastery">{#each stageRows as row (row.key)}{@render ring(row)}{/each}</ul>{/if}
  {#if courseRows.length}
    <p class="group-label">Stage 6, by course</p>
    <ul class="stage-mastery">{#each courseRows as row (row.key)}{@render ring(row)}{/each}</ul>
  {/if}
{/snippet}

{#if busiest === 0}
  {@render grouped(rows)}
{:else}
  <ul class="stage-mastery">{#each relevant as row (row.key)}{@render ring(row)}{/each}</ul>
  {#if others.length}
    <button class="others-toggle" aria-expanded={showOthers} aria-controls="other-stages" onclick={() => (showOthers = !showOthers)}>
      {showOthers ? 'Hide other stages and courses' : `Show other stages and courses (${others.length})`}
    </button>
    {#if showOthers}<div id="other-stages" class="others">{@render grouped(others)}</div>{/if}
  {/if}
{/if}

<style>
  .stage-mastery { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.75rem; }
  .group-label { margin: 1.1rem 0 0.55rem; color: var(--muted); font-size: 0.82rem; font-weight: 700; }
  .others { margin-top: 0.75rem; }
  .others-toggle { margin-top: 0.7rem; padding: 0; border: 0; background: none; color: var(--muted); font: 700 0.85rem var(--font-body); cursor: pointer; }
  .others-toggle:hover { color: var(--accent); }
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
