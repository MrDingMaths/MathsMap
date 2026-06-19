<script>
  import { untrack } from 'svelte';
  import { href } from '../lib/router.svelte.js';
  import { courseById, primaryTopicForSkill, strandForSkill } from '../lib/data.js';
  import { getMastery, subscribe, MASTERY } from '../lib/store.js';
  import Math from './Math.svelte';

  let { skill, courseId = null } = $props();

  let topic = $derived(primaryTopicForSkill(skill.id));
  let strand = $derived(strandForSkill(skill.id));
  let color = $derived(topic?.color ?? 'var(--accent)');

  let tick = $state(0);
  // untrack the increment: subscribe() invokes the callback synchronously while
  // this effect runs, so a bare tick++ would read+write tick and self-loop.
  $effect(() => subscribe(() => untrack(() => tick++)));

  let level = $derived.by(() => {
    tick; // re-run when mastery changes
    return getMastery(skill.id);
  });
  let fill = $derived(MASTERY[level].fill);
  let tagsText = $derived(
    (skill.courses ?? []).map((c) => courseById.get(c)?.title ?? c).join(' · ')
  );
</script>

<a class="card skill" href={href(`/skill/${skill.id}${courseId ? `?course=${courseId}` : ''}`)}>
  <div class="top">
    <div class="reason" style="color:{color}">
      <span class="dot" style="background:{color}"></span>
      {strand}
    </div>
    {#if level === 'mastered'}
      <span class="check" aria-label="Mastered">
        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
          <polyline points="1,3.5 3.5,6 8,1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
    {/if}
  </div>
  <h3><Math text={skill.title} /></h3>
  {#if skill.blurb}<p class="blurb"><Math text={skill.blurb} /></p>{/if}
  <div class="spacer"></div>
  {#if tagsText}<div class="tags-text">{tagsText}</div>{/if}
  <div class="foot">
    <div class="seg-bar">
      {#each [0, 1, 2] as i}
        <span class="seg {fill > i ? `m-${level}` : ''}"></span>
      {/each}
    </div>
    {#if level !== 'none'}
      <span class="m-label m-{level}">{MASTERY[level].label}</span>
    {/if}
  </div>
</a>

<style>
  .skill { display: flex; flex-direction: column; min-height: 176px; }
  .top { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.6rem; }
  .reason {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.66rem;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .reason .dot { width: 7px; height: 7px; border-radius: 50%; flex: none; }
  .check {
    width: 20px; height: 20px; border-radius: 50%; flex: none;
    background: var(--m-mastered);
    display: grid; place-items: center;
  }
  h3 { font-size: 1rem; margin: 0 0 0.4rem; }
  .blurb { color: var(--muted); font-size: 0.82rem; margin: 0; }
  .spacer { flex: 1; min-height: 0.7rem; }
  .tags-text { color: var(--muted); font-size: 0.72rem; margin-bottom: 0.7rem; }

  .foot { display: flex; align-items: center; gap: 0.6rem; }
  .seg-bar { display: flex; gap: 4px; flex: 1; }
  .seg { height: 5px; border-radius: 999px; flex: 1; background: var(--track); }
  .seg.m-learning { background: var(--m-learning); }
  .seg.m-proficient { background: var(--m-proficient); }
  .seg.m-mastered { background: var(--m-mastered); }

  .m-label { font-size: 0.68rem; font-weight: 600; white-space: nowrap; }
  .m-label.m-learning { color: var(--m-learning); }
  .m-label.m-proficient { color: var(--m-proficient); }
  .m-label.m-mastered { color: var(--m-mastered); }
</style>
