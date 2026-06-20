<script>
  import { untrack } from 'svelte';
  import { href } from '../lib/router.svelte.js';
  import { topicStats, subscribe } from '../lib/store.js';
  import Math from './Math.svelte';
  import MasteryBar from './MasteryBar.svelte';

  let { topic, courseId = null } = $props();

  let tick = $state(0);
  // untrack the increment: subscribe() invokes the callback synchronously while
  // this effect runs, so a bare tick++ would read+write tick and self-loop.
  $effect(() => subscribe(() => untrack(() => tick++)));

  let stats = $derived.by(() => {
    tick; // re-run when mastery changes
    return topicStats(topic.id, courseId);
  });

  let statusColor = $derived(stats.mastered > 0 ? 'var(--success)' : 'var(--muted)');
</script>

<a
  class="card topic"
  style="background:color-mix(in srgb, {topic.color} 8%, var(--panel))"
  href={href(`/topic/${topic.id}${courseId ? `?course=${courseId}` : ''}`)}
>
  {#if stats.fullyMastered}
    <span class="badge" aria-label="Fully mastered">
      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
        <polyline points="1,3.5 3.5,6 8,1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
  {/if}
  <h3><Math text={topic.title} /></h3>
  <div class="meter">
    <div class="meter-top">
      <span class="count" style="color:{statusColor}">{stats.mastered}/{stats.total}</span>
    </div>
    <MasteryBar {stats} height="7px" />
  </div>
</a>

<style>
  .topic { position: relative; display: flex; flex-direction: column; min-height: 130px; }
  .badge {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--success);
    display: grid;
    place-items: center;
  }
  h3 { font-size: 1.12rem; font-weight: 500; margin: 0 0 0.9rem; padding-right: 1.2rem; }
  .meter { margin-top: auto; }
  .meter-top { display: flex; justify-content: flex-end; margin-bottom: 0.45rem; }
  .count { font-size: 0.95rem; font-weight: 600; }
</style>
