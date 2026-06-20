<script>
  import { untrack } from 'svelte';
  import { courses, topicsForCourse, searchSkills } from '../lib/data.js';
  import { topicStats, subscribe } from '../lib/store.js';
  import { href } from '../lib/router.svelte.js';
  import SkillCard from '../components/SkillCard.svelte';
  import TopicCard from '../components/TopicCard.svelte';
  import MasteryBar from '../components/MasteryBar.svelte';

  // Flat, ordered course list — each course is its own collapsible section.
  const ordered = [...courses].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const firstStage6 = ordered.find((c) => c.stage === 6)?.id;

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

  let query = $state('');
  let results = $derived(searchSkills(query));

  // Nothing expanded by default — the student opens what they want.
  let open = $state({});
  const toggle = (id) => (open = { ...open, [id]: !open[id] });

  // React to mastery changes so the per-course mastered count stays live.
  let tick = $state(0);
  $effect(() => subscribe(() => untrack(() => tick++)));

  // Per-course topic mastery: how many topics are fully mastered out of the total.
  // Returned as a stats-shaped object so it can drive the shared MasteryBar.
  function topicMastery(courseId) {
    tick; // re-run when mastery changes
    const topics = topicsForCourse(courseId);
    const mastered = topics.filter((t) => topicStats(t.id, courseId).fullyMastered).length;
    const total = topics.length;
    return {
      mastered,
      total,
      masteredPct: total ? Math.round((mastered / total) * 100) : 0,
      proficientPct: 0,
      learningPct: 0
    };
  }
</script>

<div class="container">
  <!-- HERO -->
  <h1>Your maths skill map</h1>
  <p class="lede">
    Every Maths skill from Stage 3 to Stage 6, mapped to your progress. Find a topic,
    see what's inside, pick up where you left off.
  </p>
  <div class="search-wrap">
    <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
    <input class="search" placeholder="Search skills…" bind:value={query} />
  </div>

  {#if query.trim()}
    <!-- SEARCH RESULTS -->
    <div class="results-head">
      <h2>Search results</h2>
      <span class="results-count">{results.length} {results.length === 1 ? 'skill' : 'skills'}</span>
    </div>
    {#if results.length}
      <div class="grid">
        {#each results as skill}<SkillCard {skill} />{/each}
      </div>
    {:else}
      <div class="empty">
        <span class="empty-title">No skills match "{query}"</span>
        <span class="empty-sub">Try a topic name like "fractions", "trigonometry", or "calculus".</span>
      </div>
    {/if}
  {:else}
    <!-- BROWSE -->
    <div class="browse">
      {#each ordered as c (c.id)}
        {@const tm = topicMastery(c.id)}
        {#if c.id === firstStage6}
          <div class="stage-divider"><span></span><em>Stage 6</em><span></span></div>
        {/if}
        <div class="course">
          <button class="course-head" onclick={() => toggle(c.id)}>
            <span class="course-title" style="background:{c.color}">{c.title}</span>
            <div class="progress">
              <span class="topic-count">{tm.mastered}/{tm.total} topics mastered</span>
              <MasteryBar stats={tm} height="6px" />
            </div>
            <a class="view-all" href={href(`/course/${c.id}`)} onclick={(e) => e.stopPropagation()}>View all →</a>
            <svg class="chevron" class:open={open[c.id]} width="15" height="15" viewBox="0 0 24 24" fill="none">
              <polyline points="6 9 12 15 18 9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          {#if open[c.id]}
            <div class="course-body">
              {#each strandGroups(c.id) as strand}
                <div>
                  <div class="strand-label">
                    <span class="dot" style="background:{strand.color}"></span>
                    {strand.name}
                  </div>
                  <div class="grid">
                    {#each strand.topics as t}<TopicCard topic={t} courseId={c.id} />{/each}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  h1 { font-size: 1.75rem; margin: 0.4rem 0 0.4rem; }
  .lede { color: var(--muted); font-size: 0.9rem; max-width: 520px; margin: 0 0 1.2rem; }
  .search-wrap { position: relative; max-width: 520px; }
  .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--muted); }
  .search { padding-left: 2.5rem; }

  .results-head { display: flex; align-items: baseline; gap: 0.65rem; margin: 1.4rem 0 1rem; }
  .results-head h2 { font-size: 1.05rem; margin: 0; }
  .results-count { font-size: 0.78rem; color: var(--muted); }
  .empty { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; padding: 4rem 1rem; text-align: center; }
  .empty-title { font-weight: 500; color: var(--text); }
  .empty-sub { font-size: 0.85rem; color: var(--muted); }

  .browse { border-top: 1px solid var(--border); margin-top: 1.5rem; }
  .stage-divider { display: flex; align-items: center; gap: 0.6rem; padding-top: 1.6rem; }
  .stage-divider span { flex: 1; height: 1px; background: var(--border); }
  .stage-divider em { font-style: normal; font-size: 0.62rem; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); opacity: 0.7; }

  .course { border-bottom: 1px solid var(--border); }
  .course-head {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 1.1rem 0;
    background: none;
    border: none;
    color: var(--text);
    font-family: inherit;
    cursor: pointer;
    text-align: left;
  }
  .course-head:hover { opacity: 0.8; }
  .course-title {
    font-size: 1.05rem;
    font-weight: 600;
    color: #fff;
    padding: 0.4rem 0.85rem;
    border-radius: 999px;
  }
  .progress { flex: 1; display: flex; flex-direction: column; gap: 0.35rem; min-width: 120px; max-width: 260px; }
  .topic-count { font-size: 0.78rem; color: var(--muted); white-space: nowrap; }
  .view-all { font-size: 0.78rem; font-weight: 500; color: var(--accent); white-space: nowrap; }
  .chevron { flex: none; color: var(--muted); transition: transform 0.2s; }
  .chevron.open { transform: rotate(180deg); }

  .course-body { padding-bottom: 2rem; display: flex; flex-direction: column; gap: 1.4rem; }
</style>
