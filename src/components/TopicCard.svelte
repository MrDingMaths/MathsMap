<script>
  import { untrack } from 'svelte';
  import { href } from '../lib/router.svelte.js';
  import { topicStats, subscribe } from '../lib/store.js';
  import Math from './Math.svelte';
  import MasteryBar from './MasteryBar.svelte';
  import MasteryRing from './MasteryRing.svelte';

  // variant 'row' is the flat list row used on Home and Course; 'card' is the tile.
  let { topic, courseId = null, variant = 'card' } = $props();

  let tick = $state(0);
  // untrack the increment: subscribe() invokes the callback synchronously while
  // this effect runs, so a bare tick++ would read+write tick and self-loop.
  $effect(() => subscribe(() => untrack(() => tick++)));

  let stats = $derived.by(() => {
    tick; // re-run when mastery changes
    return topicStats(topic.id, courseId);
  });

  // One ring for the whole topic: mastered when every skill is, proficient when
  // every skill is at least proficient, learning once anything has started.
  let level = $derived.by(() => {
    if (!stats.total) return 'none';
    if (stats.fullyMastered) return 'mastered';
    if (stats.mastered + stats.proficient === stats.total) return 'proficient';
    if (stats.mastered + stats.inProgress > 0) return 'learning';
    return 'none';
  });
  let link = $derived(href(`/topic/${topic.id}${courseId ? `?course=${courseId}` : ''}`));
  let statusColor = $derived(stats.mastered > 0 ? 'var(--status-mastered)' : 'var(--muted)');
</script>

{#if variant === 'row'}
  <a class="topic-row" href={link}>
    <MasteryRing {level} size={20} />
    <span class="title"><Math text={topic.title} /></span>
    <span class="count">{stats.mastered + stats.proficient} of {stats.total} {stats.total === 1 ? 'skill' : 'skills'}</span>
  </a>
{:else}
  <a class="card topic" href={link}>
    <div class="head">
      <h3><Math text={topic.title} /></h3>
      <MasteryRing {level} size={20} />
    </div>
    <div class="meter">
      <div class="meter-top">
        <span class="count" style="color:{statusColor}">{stats.mastered}/{stats.total}</span>
      </div>
      <MasteryBar {stats} height="6px" />
    </div>
  </a>
{/if}

<style>
  .topic { position: relative; display: flex; flex-direction: column; min-height: 120px; }
  .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; margin-bottom: 0.9rem; }
  h3 { font-size: 1.05rem; font-weight: 800; margin: 0; }
  .meter { margin-top: auto; }
  .meter-top { display: flex; justify-content: flex-end; margin-bottom: 0.45rem; }
  .topic .count { font-size: 0.9rem; font-weight: 700; }

  .topic-row {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.8rem 0.3rem;
    color: var(--text);
    text-decoration: none;
    transition: background var(--motion-fast);
  }
  .topic-row:hover { background: var(--surface-soft); text-decoration: none; }
  .topic-row:hover .title { color: var(--accent); }
  .topic-row .title { flex: 1; min-width: 0; font-weight: 700; font-size: 1rem; line-height: 1.3; }
  .topic-row .count { flex: none; color: var(--muted); font-size: 0.8rem; font-weight: 600; }
</style>
