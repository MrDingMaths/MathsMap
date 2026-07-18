<script>
  import { untrack } from 'svelte';
  import { topicById, courseById, skillsForTopic } from '../lib/data.js';
  import { topicStats, subscribe } from '../lib/store.js';
  import { href } from '../lib/router.svelte.js';
  import { loadManifest, quizPool } from '../lib/manifest.js';
  import SkillCard from '../components/SkillCard.svelte';
  import SlabHero from '../components/SlabHero.svelte';
  import MapLink from '../components/MapLink.svelte';
  import Math from '../components/Math.svelte';

  let { id, courseId = null } = $props();
  let topic = $derived(topicById.get(id));
  let course = $derived(courseId ? courseById.get(courseId) : null);
  let groups = $derived(skillsForTopic(id, courseId));

  // "Check my skills" entry — only offered once the manifest confirms at
  // least one skill in this topic (scoped to the course, if given) has a quiz.
  let manifestLoaded = $state(false);
  $effect(() => { loadManifest().then(() => { manifestLoaded = true; }); });
  let quizzableCount = $derived.by(() => {
    if (!manifestLoaded) return 0;
    return quizPool(groups.flatMap((g) => g.skills.map((s) => s.id))).length;
  });

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
    <div class="page-head">
      <div class="crumbs">
        <a href={href('/')}>Browse</a>
        {#if course} / <a href={href(`/course/${course.id}`)}>{course.title}</a>{/if}
        / <Math text={topic.title} />
      </div>
      <div class="page-actions">
        {#if quizzableCount > 0}
          <a class="map-link" href={href(`/quiz?topic=${topic.id}${courseId ? `&course=${courseId}` : ''}`)}>Check my skills</a>
        {/if}
        <MapLink to={`/map?topic=${topic.id}${courseId ? `&course=${courseId}` : ''}`} />
      </div>
    </div>

    <SlabHero
      color={topic.color}
      eyebrow={course?.title}
      title={topic.title}
      meta={`${groups.length} ${groups.length === 1 ? 'dot point' : 'dot points'} · ${stats.total} ${stats.total === 1 ? 'skill' : 'skills'}`}
      {stats}
    />

    {#each groups as group}
      <div class="section">
        <div class="dp-label">
          <span class="text"><Math text={group.dotpoint.text} /></span>
          <span class="rule"></span>
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
  .page-actions { display: flex; align-items: center; gap: 0.6rem; flex: none; }
  .section { margin-top: 1.8rem; }

  /* Dot-point heading: sentence text + inline rule + count. */
  .dp-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--text);
    font-size: 0.9rem;
    margin: 0 0 0.9rem;
  }
  .dp-label .text { font-weight: 600; flex: 0 1 auto; }
  .dp-label .rule { flex: 1; height: 1px; background: var(--border); min-width: 24px; }
  .dp-label .count { color: var(--muted); font-size: 0.78rem; white-space: nowrap; }
</style>
