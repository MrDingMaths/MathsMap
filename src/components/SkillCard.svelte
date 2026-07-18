<script>
  import { untrack } from 'svelte';
  import { href } from '../lib/router.svelte.js';
  import { courseById } from '../lib/data.js';
  import { getMastery, subscribe } from '../lib/store.js';
  import Math from './Math.svelte';
  import MasteryStatus from './MasteryStatus.svelte';

  let { skill, courseId = null } = $props();
  let tick = $state(0);
  $effect(() => subscribe(() => untrack(() => tick++)));
  let level = $derived.by(() => { tick; return getMastery(skill.id); });
  let tagsText = $derived((skill.courses ?? []).map((id) => courseById.get(id)?.title ?? id).join(' · '));
</script>

<a class="card skill status-{level}" href={href(`/skill/${skill.id}${courseId ? `?course=${courseId}` : ''}`)}>
  <div class="top"><MasteryStatus {level} /></div>
  <h3><Math text={skill.title} /></h3>
  {#if skill.blurb}<p class="blurb"><Math text={skill.blurb} /></p>{/if}
  <div class="spacer"></div>
  {#if tagsText}<div class="tags-text">{tagsText}</div>{/if}
  <span class="open-label">Open skill <span aria-hidden="true">&rarr;</span></span>
</a>

<style>
  .skill { position: relative; display: flex; flex-direction: column; min-height: 176px; overflow: hidden; }
  .skill::before { content: ''; position: absolute; inset: 0 auto 0 0; width: 3px; background: transparent; }
  .skill.status-learning::before { background: var(--status-learning-fill); }
  .skill.status-proficient::before { background: var(--status-proficient-fill); }
  .skill.status-mastered::before { background: var(--status-mastered-fill); }
  .top { min-height: 1.35rem; margin-bottom: 0.55rem; }
  h3 { font-size: 1rem; margin: 0 0 0.4rem; }
  .blurb { color: var(--muted); font-size: 0.82rem; margin: 0; }
  .spacer { flex: 1; min-height: 0.8rem; }
  .tags-text { color: var(--muted); font-size: 0.7rem; margin-bottom: 0.55rem; }
  .open-label { display: flex; justify-content: space-between; color: var(--muted); font-size: 0.72rem; font-weight: 650; }
  .skill:hover .open-label { color: var(--accent); }
</style>
