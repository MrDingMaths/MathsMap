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

    <div
      class="hero"
      style="background:linear-gradient(135deg, color-mix(in srgb, {topic.color} 78%, #000) 0%, {topic.color} 55%, color-mix(in srgb, {topic.color} 80%, #fff) 100%)"
    >
      <span class="glow"></span>
      <div class="hero-body">
        {#if course}
          <div class="eyebrow"><span class="dot"></span>{course.title}</div>
        {/if}
        <h1><Math text={topic.title} /></h1>
        <div class="meta">{groups.length} {groups.length === 1 ? 'dot point' : 'dot points'} · {stats.total} {stats.total === 1 ? 'skill' : 'skills'}</div>
        <div class="tiles">
          <div class="tile"><div class="tile-top"><span class="tdot" style="background:var(--m-mastered)"></span>Mastered</div><div class="tnum">{stats.mastered}</div></div>
          <div class="tile"><div class="tile-top"><span class="tdot" style="background:var(--m-proficient)"></span>Proficient</div><div class="tnum">{stats.proficient}</div></div>
          <div class="tile"><div class="tile-top"><span class="tdot" style="background:var(--m-learning)"></span>Learning</div><div class="tnum">{stats.learning}</div></div>
          <div class="tile"><div class="tile-top"><span class="tdot tdot-none"></span>Not started</div><div class="tnum">{stats.none}</div></div>
        </div>
        <div class="hero-bar">
          <span style="width:{stats.masteredPct}%;background:var(--m-mastered)"></span>
          <span style="width:{stats.proficientPct}%;background:var(--m-proficient)"></span>
          <span style="width:{stats.learningPct}%;background:var(--m-learning)"></span>
        </div>
      </div>
    </div>

    {#each groups as group}
      <div class="section">
        <div class="dp-label">
          <span class="code" style="background:{topic.color}">{group.dotpoint.code}</span>
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
  /* Bold slab hero: gradient banner derived from the topic color, white text. */
  .hero {
    position: relative;
    overflow: hidden;
    border-radius: 18px;
    padding: 2rem 2.2rem;
    margin-bottom: 0.5rem;
    color: #fff;
  }
  .hero .glow {
    position: absolute;
    top: -120px;
    left: -60px;
    width: 360px;
    height: 360px;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.16), transparent 60%);
    pointer-events: none;
  }
  .hero-body { position: relative; }
  .hero .eyebrow {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.85);
    margin-bottom: 0.7rem;
  }
  .hero .eyebrow .dot { width: 8px; height: 8px; border-radius: 999px; background: rgba(255, 255, 255, 0.85); flex: none; }
  .hero h1 { font-size: 2.1rem; margin: 0; line-height: 1.05; }
  .hero .meta { font-size: 0.85rem; color: rgba(255, 255, 255, 0.82); margin-top: 0.7rem; }

  .tiles { display: flex; gap: 0.75rem; margin-top: 1.3rem; }
  .tile {
    flex: 1;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 12px;
    padding: 0.7rem 0.85rem;
  }
  .tile-top {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.72rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.82);
    margin-bottom: 0.55rem;
  }
  .tile-top .tdot { width: 8px; height: 8px; border-radius: 999px; flex: none; }
  .tile-top .tdot-none { background: rgba(255, 255, 255, 0.55); }
  .tnum { font-size: 1.5rem; font-weight: 600; line-height: 1; }

  .hero-bar {
    display: flex;
    height: 10px;
    margin-top: 1.1rem;
    border-radius: 999px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.22);
  }
  .hero-bar > span { display: block; height: 100%; }

  .section { margin-top: 1.8rem; }

  /* Dot-point heading: filled code badge + sentence text + inline rule + count. */
  .dp-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--text);
    font-size: 0.9rem;
    margin: 0 0 0.9rem;
  }
  .dp-label .code {
    color: #fff;
    font-weight: 600;
    font-size: 0.72rem;
    letter-spacing: 0.02em;
    padding: 0.3rem 0.55rem;
    border-radius: 8px;
    white-space: nowrap;
    flex: none;
  }
  .dp-label .text { font-weight: 600; flex: 0 1 auto; }
  .dp-label .rule { flex: 1; height: 1px; background: var(--border); min-width: 24px; }
  .dp-label .count { color: var(--muted); font-size: 0.78rem; white-space: nowrap; }
</style>
