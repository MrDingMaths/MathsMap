<script>
  import { untrack } from 'svelte';
  import { href } from '../lib/router.svelte.js';
  import { courseById } from '../lib/data.js';
  import { getMastery, subscribe, MASTERY } from '../lib/store.js';
  import Math from './Math.svelte';
  import MasteryStatus from './MasteryStatus.svelte';
  import MasteryRing from './MasteryRing.svelte';

  // variant 'row' is the flat list row used on topic pages; 'card' is the tile.
  let { skill, courseId = null, variant = 'card' } = $props();
  let tick = $state(0);
  $effect(() => subscribe(() => untrack(() => tick++)));
  let level = $derived.by(() => { tick; return getMastery(skill.id); });
  let tagsText = $derived((skill.courses ?? []).map((id) => courseById.get(id)?.title ?? id).join(' · '));
  let link = $derived(href(`/skill/${skill.id}${courseId ? `?course=${courseId}` : ''}`));
</script>

{#if variant === 'row'}
  <a class="skill-row status-{level}" href={link}>
    <MasteryRing {level} size={20} />
    <span class="text">
      <span class="title"><Math text={skill.title} /></span>
      {#if skill.blurb}<span class="blurb"><Math text={skill.blurb} /></span>{/if}
    </span>
    <span class="state">{MASTERY[level].label}</span>
    <svg class="chev" viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3.5 4.5 4.5L6 12.5" /></svg>
  </a>
{:else}
  <a class="card skill status-{level}" href={link}>
    <div class="top"><MasteryStatus {level} /></div>
    <h3><Math text={skill.title} /></h3>
    {#if skill.blurb}<p class="blurb"><Math text={skill.blurb} /></p>{/if}
    <div class="spacer"></div>
    {#if tagsText}<div class="tags-text">{tagsText}</div>{/if}
    <span class="open-label">Open skill <span aria-hidden="true">&rarr;</span></span>
  </a>
{/if}

<style>
  .skill { position: relative; display: flex; flex-direction: column; min-height: 150px; overflow: hidden; }
  .top { min-height: 1.35rem; margin-bottom: 0.55rem; }
  h3 { font-size: 1rem; margin: 0 0 0.4rem; }
  .skill .blurb { color: var(--muted); font-size: 0.84rem; margin: 0; }
  .spacer { flex: 1; min-height: 0.8rem; }
  .tags-text { color: var(--muted); font-size: 0.75rem; margin-bottom: 0.55rem; }
  .open-label { display: flex; justify-content: space-between; color: var(--muted); font-size: 0.75rem; font-weight: 700; }
  .skill:hover .open-label { color: var(--accent); }

  .skill-row {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    padding: 0.85rem 0.35rem;
    color: var(--text);
    text-decoration: none;
    transition: background var(--motion-fast);
  }
  .skill-row:hover { background: var(--surface-soft); text-decoration: none; }
  .skill-row:hover .title { color: var(--accent); }
  .text { display: flex; flex-direction: column; gap: 0.15rem; flex: 1; min-width: 0; }
  .title { font-weight: 800; font-size: 1rem; line-height: 1.3; }
  .skill-row .blurb { color: var(--muted); font-size: 0.88rem; line-height: 1.4; }
  .state { flex: none; color: var(--muted); font-size: 0.8rem; font-weight: 600; }
  .status-learning .state { color: var(--status-learning); }
  .status-proficient .state { color: var(--status-proficient); }
  .status-mastered .state { color: var(--status-mastered); }
  .chev { flex: none; width: 14px; height: 14px; fill: none; stroke: var(--muted); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  @media (max-width: 560px) { .state { display: none; } }
</style>
