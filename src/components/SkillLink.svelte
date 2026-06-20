<script>
  import { untrack } from 'svelte';
  import { href } from '../lib/router.svelte.js';
  import { getMastery, subscribe, MASTERY } from '../lib/store.js';
  import Math from './Math.svelte';

  // Compact horizontal mini-card shared by the Prerequisites and Unlocks grids on
  // the skill page. Shows the linked skill's own mastery (dot + label) and a trailing
  // icon: a lock for unmet prerequisites, an arrow for unlocks.
  let { skill, courseId = null, variant = 'unlock' } = $props();

  let tick = $state(0);
  // untrack the increment: subscribe() invokes the callback synchronously while
  // this effect runs, so a bare tick++ would read+write tick and self-loop.
  $effect(() => subscribe(() => untrack(() => tick++)));

  let level = $derived.by(() => {
    tick; // re-run when mastery changes
    return getMastery(skill.id);
  });
  let locked = $derived(variant === 'prereq' && level !== 'mastered');
</script>

<a class="card link" href={href(`/skill/${skill.id}${courseId ? `?course=${courseId}` : ''}`)}>
  <span class="dot m-{level}"></span>
  <span class="body">
    <span class="title"><Math text={skill.title} /></span>
    {#if level !== 'none'}<span class="m-label m-{level}">{MASTERY[level].label}</span>{/if}
  </span>
  {#if locked}
    <span class="lock" title="Not yet mastered">🔒</span>
  {:else if variant === 'unlock'}
    <span class="arrow">→</span>
  {/if}
</a>

<style>
  .link {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.85rem 1rem;
  }
  .dot {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    flex: none;
    background: var(--track);
  }
  .dot.m-learning { background: var(--m-learning); box-shadow: 0 0 0 4px color-mix(in srgb, var(--m-learning) 18%, transparent); }
  .dot.m-proficient { background: var(--m-proficient); box-shadow: 0 0 0 4px color-mix(in srgb, var(--m-proficient) 18%, transparent); }
  .dot.m-mastered { background: var(--m-mastered); box-shadow: 0 0 0 4px color-mix(in srgb, var(--m-mastered) 18%, transparent); }

  .body { min-width: 0; flex: 1; }
  .title {
    display: block;
    font-size: 0.92rem;
    font-weight: 500;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .m-label { display: block; font-size: 0.74rem; font-weight: 500; margin-top: 2px; }
  .m-label.m-learning { color: var(--m-learning); }
  .m-label.m-proficient { color: var(--m-proficient); }
  .m-label.m-mastered { color: var(--m-mastered); }

  .lock { flex: none; font-size: 0.8rem; color: var(--m-learning); }
  .arrow { flex: none; color: var(--muted); font-size: 1rem; }
</style>
