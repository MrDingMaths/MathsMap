<script>
  import { untrack } from 'svelte';
  import { courseById, topicsForCourse, skills } from '../lib/data.js';
  import { courseStats, subscribe } from '../lib/store.js';
  import { href } from '../lib/router.svelte.js';
  import { loadManifest, quizPool } from '../lib/manifest.js';
  import TopicCard from '../components/TopicCard.svelte';
  import SlabHero from '../components/SlabHero.svelte';

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
    return [...map].map(([name, topics]) => ({
      name,
      topics,
      color: topics[0]?.color ?? 'var(--accent)'
    }));
  }

  let groups = $derived(course ? strandGroups(id) : []);

  let strandFilter = $state(null);
  const toggleFilter = (name) => (strandFilter = strandFilter === name ? null : name);
  let visible = $derived(strandFilter ? groups.filter((g) => g.name === strandFilter) : groups);

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
      <div class="crumbs"><a href={href('/')}>Home</a> / {course.title}</div>
      {#if quizzableCount > 0}
        <a class="map-link" href={href(`/quiz?course=${id}`)}>Check my skills</a>
      {/if}
    </div>

    {#if stats}
      <SlabHero
        color={course.color}
        eyebrow={`Stage ${course.stage}`}
        title={course.title}
        meta={`${stats.topicCount} ${stats.topicCount === 1 ? 'topic' : 'topics'} · ${stats.skillCount} ${stats.skillCount === 1 ? 'skill' : 'skills'}`}
        {stats}
      />
    {/if}

    {#if groups.length}
      <div class="chips">
        <button class="chip" class:active={strandFilter === null} onclick={() => (strandFilter = null)}>
          <span class="dot" style="background:var(--muted)"></span>All
        </button>
        {#each groups as g}
          <button class="chip" class:active={strandFilter === g.name} onclick={() => toggleFilter(g.name)}>
            <span class="dot" style="background:{g.color}"></span>{g.name}
          </button>
        {/each}
      </div>

      <div class="strands">
        {#each visible as strand}
          <div>
            <div class="strand-label">
              <span class="dot" style="background:{strand.color}"></span>
              {strand.name}
              <span class="count">{strand.topics.length} topics</span>
            </div>
            <div class="grid">
              {#each strand.topics as t}<TopicCard topic={t} courseId={id} />{/each}
            </div>
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
  .chips { display: flex; gap: 0.4rem; flex-wrap: wrap; margin: 1.3rem 0 1rem; }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-family: inherit;
    font-size: 0.78rem;
    font-weight: 500;
    padding: 0.4rem 0.75rem;
    border-radius: 99px;
    background: var(--panel);
    color: var(--text);
    border: 1px solid var(--border);
    cursor: pointer;
    transition: all 0.12s;
  }
  .chip .dot { width: 6px; height: 6px; border-radius: 50%; }
  .chip.active { background: var(--text); color: var(--bg); border-color: var(--text); }

  .strands { display: flex; flex-direction: column; gap: 1.75rem; }
</style>
