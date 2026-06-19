<script>
  import { untrack } from 'svelte';
  import { topicById, courseById, skillsForTopic } from '../lib/data.js';
  import { topicStats, subscribe } from '../lib/store.js';
  import { href } from '../lib/router.svelte.js';
  import SkillCard from '../components/SkillCard.svelte';
  import Math from '../components/Math.svelte';

  let { id, courseId = null } = $props();
  let topic = $derived(topicById.get(id));
  let course = $derived(courseId ? courseById.get(courseId) : null);
  let groups = $derived(skillsForTopic(id, courseId));

  let tick = $state(0);
  // untrack the increment: subscribe() invokes the callback synchronously while
  // this effect runs, so a bare tick++ would read+write tick and self-loop.
  $effect(() => subscribe(() => untrack(() => tick++)));

  let stats = $derived.by(() => {
    tick; // re-run when mastery changes
    return topicStats(id, courseId);
  });
</script>

<div class="container">
  {#if topic}
    <div class="crumbs">
      <a href={href('/')}>Home</a>
      {#if course} / <a href={href(`/course/${course.id}`)}>{course.title}</a>{/if}
      / <Math text={topic.title} />
    </div>

    <div class="hero" style="background:color-mix(in srgb, {topic.color} 8%, var(--panel))">
      <h1><Math text={topic.title} /></h1>
      <div class="summary">{stats.mastered} / {stats.total} skills mastered</div>
      <div class="bar">
        <span class="mastered" style="width:{stats.masteredPct}%"></span>
        <span class="inprogress" style="width:{stats.inProgressPct}%"></span>
      </div>
    </div>

    {#each groups as group}
      <div class="section">
        <div class="dp-label">
          <span class="dot" style="background:{topic.color}"></span>
          <span class="code">{group.dotpoint.code}</span>
          <span class="text"><Math text={group.dotpoint.text} /></span>
          <span class="count">{group.skills.length} {group.skills.length === 1 ? 'skill' : 'skills'}</span>
        </div>
        <div class="grid">
          {#each group.skills as skill}<SkillCard {skill} {courseId} />{/each}
          {#if group.skills.length === 0}<p class="muted">No skills under this dot point yet.</p>{/if}
        </div>
      </div>
    {/each}
  {:else}
    <p class="muted">Unknown topic.</p>
  {/if}
</div>

<style>
  .hero {
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 1.4rem 1.5rem;
    margin-bottom: 0.5rem;
  }
  .hero h1 { font-size: 1.6rem; margin: 0; }
  .hero .summary { color: var(--muted); font-size: 0.85rem; margin: 0.5rem 0 0.7rem; }
  .hero .bar { max-width: 320px; }

  .section { margin-top: 1.6rem; }

  /* Dot-point heading: colored bar + uppercase code + sentence text + muted count. */
  .dp-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text);
    font-size: 0.85rem;
    margin: 0 0 0.6rem;
  }
  .dp-label .dot { width: 3px; height: 15px; border-radius: 2px; flex: none; }
  .dp-label .code {
    color: var(--muted);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-size: 0.78rem;
  }
  .dp-label .text { font-weight: 500; }
  .dp-label .count { color: var(--muted); opacity: 0.7; font-size: 0.78rem; margin-left: 0.3rem; }
</style>
