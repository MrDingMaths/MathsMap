<script>
  import { untrack } from 'svelte';
  import { href } from '../lib/router.svelte.js';
  import { getMastery, subscribe } from '../lib/store.js';
  import Math from './Math.svelte';
  import MasteryStatus from './MasteryStatus.svelte';

  let { skill, courseId = null, variant = 'unlock' } = $props();
  let tick = $state(0);
  $effect(() => subscribe(() => untrack(() => tick++)));
  let level = $derived.by(() => { tick; return getMastery(skill.id); });
  let locked = $derived(variant === 'prereq' && level !== 'mastered');
</script>

<a class="skill-link" href={href(`/skill/${skill.id}${courseId ? `?course=${courseId}` : ''}`)}>
  <span class="body"><span class="title"><Math text={skill.title} /></span><MasteryStatus {level} compact /></span>
  {#if locked}<span class="relation">Prerequisite</span>{:else if variant === 'unlock'}<span class="arrow" aria-hidden="true">&rarr;</span>{/if}
</a>

<style>
  .skill-link { display: flex; align-items: center; gap: 0.8rem; padding: 0.75rem 0; border-bottom: 1px solid var(--border); color: var(--text); }
  .skill-link:last-child { border-bottom: 0; }
  .skill-link:hover { color: var(--accent); text-decoration: none; }
  .body { min-width: 0; flex: 1; }
  .title { display: block; margin-bottom: 0.3rem; font-size: 0.9rem; font-weight: 650; line-height: 1.3; }
  .relation { flex: none; color: var(--status-learning); font-size: 0.68rem; font-weight: 700; }
  .arrow { flex: none; color: var(--muted); }
</style>
