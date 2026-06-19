<script>
  import { untrack } from 'svelte';
  import { courseById, topicsForCourse } from '../lib/data.js';
  import { courseStats, subscribe } from '../lib/store.js';
  import { href } from '../lib/router.svelte.js';
  import TopicCard from '../components/TopicCard.svelte';

  let { id } = $props();
  let course = $derived(courseById.get(id));

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
    <div class="crumbs"><a href={href('/')}>Home</a> / {course.title}</div>

    <div class="head">
      <span class="accent" style="background:{course.color}"></span>
      <div class="head-main">
        <span class="badge" style="color:{course.color}; background:color-mix(in srgb, {course.color} 14%, var(--panel))">Stage {course.stage}</span>
        <h1>{course.title}</h1>
        {#if stats}
          <div class="stats">
            <div class="stat"><span class="num">{stats.topicCount}</span><span class="lbl">Topics</span></div>
            <div class="stat"><span class="num">{stats.skillCount}</span><span class="lbl">Skills</span></div>
            <div class="stat"><span class="num" style="color:var(--success)">{stats.masteredPct}%</span><span class="lbl">Mastered</span></div>
          </div>
          <div class="bar course-bar">
            <span class="mastered" style="width:{stats.masteredPct}%"></span>
            <span class="inprogress" style="width:{stats.inProgressPct}%"></span>
          </div>
        {/if}
      </div>
    </div>

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
  .head { display: flex; gap: 1rem; align-items: stretch; margin-bottom: 0.5rem; }
  .accent { width: 4px; align-self: stretch; min-height: 56px; border-radius: 99px; flex: none; }
  .head-main { flex: 1; }
  .badge {
    display: inline-block;
    font-size: 0.66rem;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    border-radius: 99px;
    padding: 0.25rem 0.65rem;
    margin-bottom: 0.55rem;
  }
  h1 { font-size: 1.75rem; margin: 0 0 0.85rem; }
  .stats { display: flex; gap: 1.6rem; flex-wrap: wrap; }
  .stat { display: flex; flex-direction: column; gap: 0.15rem; }
  .stat .num { font-size: 1.25rem; font-weight: 600; }
  .stat .lbl { font-size: 0.66rem; font-weight: 500; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); }
  .course-bar { max-width: 480px; height: 6px; margin-top: 0.9rem; }

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
