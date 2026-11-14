<script>
  import { untrack } from 'svelte';
  import { courseById, topicsForCourse, skills } from '../lib/data.js';
  import { courseStats, subscribe } from '../lib/store.js';
  import { href } from '../lib/router.svelte.js';
  import { loadManifest, quizPool } from '../lib/manifest.js';
  import TopicCard from '../components/TopicCard.svelte';
  import SlabHero from '../components/SlabHero.svelte';
  import MapLink from '../components/MapLink.svelte';

  let { id } = $props();
  let course = $derived(courseById.get(id));

  // "Check my skills" entry — only offered once the manifest confirms at
  // least one skill in this course has a quiz.
  let manifestLoaded = $state(false);
  $effect(() => { loadManifest().then(() => { manifestLoaded = true; }); });
  let quizzableCount = $derived.by(() => {
    if (!manifestLoaded) return 0;
    const ids = skills.filter((s) => (s.courses || []).includes(id)).map((s) => s.id);
    return quizPool(ids).length;
  });

  function strandGroups(courseId) {
    const map = new Map();
    for (const t of topicsForCourse(courseId)) {
      const s = t.strand || 'Other';
      if (!map.has(s)) map.set(s, []);
      map.get(s).push(t);
    }
    return [...map].map(([name, topics]) => ({ name, topics }));
  }

  let groups = $derived(course ? strandGroups(id) : []);

  let tick = $state(0);
  // untrack: subscribe() fires the callback synchronously inside this effect,
  // so a bare tick++ would read+write tick and self-loop.
  $effect(() => subscribe(() => untrack(() => tick++)));
  let stats = $derived.by(() => {
    tick;
    return course ? courseStats(id) : null;
  });
</script>

<div class="container">
  {#if course}
    <div class="page-head">
      <div class="crumbs"><a href={href('/')}>Browse</a> / {course.title}</div>
    </div>

    {#if stats}
      <SlabHero
        meta={`Stage ${course.stage} · ${stats.topicCount} ${stats.topicCount === 1 ? 'topic' : 'topics'} · ${stats.skillCount} ${stats.skillCount === 1 ? 'skill' : 'skills'}`}
        title={course.title}
        {stats}
      >
        {#snippet actions()}
          {#if quizzableCount > 0}
            <a class="mm-btn primary" href={href(`/quiz?course=${id}`)}>Check my skills</a>
          {/if}
          <MapLink to={`/map?course=${id}`} />
        {/snippet}
      </SlabHero>
    {/if}

    {#if groups.length}
      <div class="strand-columns">
        {#each groups as strand}
          <div class="strand-column">
            <h2>{strand.name} <span>{strand.topics.length} topics</span></h2>
            <ul class="row-list">
              {#each strand.topics as t}<li><TopicCard topic={t} courseId={id} variant="row" /></li>{/each}
            </ul>
          </div>
        {/each}
      </div>
    {:else}
      <p class="muted">No topics authored for this course yet.</p>
    {/if}
  {:else}
    <p class="muted">Unknown course.</p>
  {/if}
</div>

<style>
  .strand-columns { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem 3rem; margin-top: 2rem; }
  .strand-column h2 { display: flex; justify-content: space-between; align-items: baseline; margin: 0; padding-bottom: 0.55rem; border-bottom: 2px solid var(--border-strong); color: var(--text); font-size: 0.95rem; font-weight: 800; letter-spacing: 0; }
  .strand-column h2 span { color: var(--muted); font-size: 0.8rem; font-weight: 600; }
  .strand-column .row-list { border-top: 0; }
</style>
