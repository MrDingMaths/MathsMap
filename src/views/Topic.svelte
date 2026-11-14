<script>
  import { untrack } from 'svelte';
  import { topicById, courseById, skillsForTopic, skillById, dependentsOf, primaryTopicForSkill } from '../lib/data.js';
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
  let codes = $derived([...new Set(groups.map((g) => g.dotpoint.code).filter(Boolean))]);

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

  // Neighbouring topics, from the skill prerequisite graph: topics whose skills
  // this topic's skills build on, and topics whose skills build on this one.
  function neighbourTopics(direction) {
    const ownIds = new Set(groups.flatMap((g) => g.skills.map((s) => s.id)));
    const found = new Map();
    for (const skillId of ownIds) {
      const next = direction === 'before' ? (skillById.get(skillId)?.prereqs ?? []) : (dependentsOf.get(skillId) ?? []);
      for (const otherId of next) {
        if (ownIds.has(otherId)) continue;
        const other = primaryTopicForSkill(otherId);
        if (!other || other.id === id) continue;
        if (direction === 'before' && other.stage > topic.stage) continue;
        if (direction === 'after' && other.stage < topic.stage) continue;
        found.set(other.id, other);
      }
    }
    return [...found.values()].sort((a, b) => (a.stage - b.stage) || ((a.order ?? 0) - (b.order ?? 0)));
  }
  let needsFirst = $derived(topic ? neighbourTopics('before') : []);
  let leadsTo = $derived(topic ? neighbourTopics('after') : []);
  let mapQuery = $derived(`/map?topic=${id}${courseId ? `&course=${courseId}` : ''}`);
</script>

<div class="container topic-page">
  {#if topic}
    <div class="page-head">
      <div class="crumbs">
        <a href={href('/')}>Browse</a>
        {#if course} / <a href={href(`/course/${course.id}`)}>{course.title}</a>{/if}
        / <Math text={topic.title} />
      </div>
    </div>

    <div class="layout">
      <div class="main">
        <SlabHero
          eyebrow={topic.strand}
          meta={[`Stage ${topic.stage}`, ...codes].join(' · ')}
          title={topic.title}
          lede={topic.blurb || null}
          {stats}
        >
          {#snippet actions()}
            {#if quizzableCount > 0}
              <a class="mm-btn primary" href={href(`/quiz?topic=${topic.id}${courseId ? `&course=${courseId}` : ''}`)}>Check my skills</a>
            {/if}
            <MapLink to={mapQuery} />
          {/snippet}
        </SlabHero>

        {#each groups as group, index}
          <section class="dot-point" id="dp-{index + 1}">
            <h2><span class="num">{index + 1}</span><Math text={group.dotpoint.text} /></h2>
            {#if group.skills.length}
              <ul class="row-list">
                {#each group.skills as skill}<li><SkillCard {skill} {courseId} variant="row" /></li>{/each}
              </ul>
            {:else}
              <p class="muted">No skills under this dot point yet.</p>
            {/if}
          </section>
        {/each}
      </div>

      <aside class="rail" aria-label="About this topic">
        {#if groups.length > 1}
          <nav class="rail-block" aria-label="On this page">
            <p class="rail-label">On this page</p>
            <ol class="toc">
              {#each groups as group, index}<li><a href="#dp-{index + 1}" onclick={(event) => { event.preventDefault(); document.getElementById(`dp-${index + 1}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}><Math text={group.dotpoint.text} /></a></li>{/each}
            </ol>
          </nav>
        {/if}
        {#if needsFirst.length}
          <div class="rail-block">
            <p class="rail-label">Needs first</p>
            <ul class="links">
              {#each needsFirst as other}<li><a href={href(`/topic/${other.id}`)}><Math text={other.title} /></a>{#if other.stage !== topic.stage}<span class="stage">Stage {other.stage}</span>{/if}</li>{/each}
            </ul>
          </div>
        {/if}
        {#if leadsTo.length}
          <div class="rail-block">
            <p class="rail-label">Leads to</p>
            <ul class="links">
              {#each leadsTo as other}<li><a href={href(`/topic/${other.id}`)}><Math text={other.title} /></a>{#if other.stage !== topic.stage}<span class="stage">Stage {other.stage}</span>{/if}</li>{/each}
            </ul>
          </div>
        {/if}
      </aside>
    </div>
  {:else}
    <p class="muted">Unknown topic.</p>
  {/if}
</div>

<style>
  .layout { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 3.5rem; align-items: start; }
  .main { min-width: 0; }
  .dot-point { margin-top: 2.4rem; scroll-margin-top: 80px; }
  .dot-point h2 { display: flex; gap: 0.75rem; margin: 0 0 0.9rem; font-size: 1.45rem; line-height: 1.25; }
  .num { flex: none; color: var(--muted); font-weight: 700; }
  .rail { position: sticky; top: calc(var(--top-nav-height, 60px) + 1.5rem); display: flex; flex-direction: column; }
  .rail-block { padding: 1.2rem 0; border-top: 1px solid var(--border); }
  .rail-block:first-child { padding-top: 0.2rem; border-top: 0; }
  .toc { margin: 0; padding: 0; list-style: none; border-left: 2px solid var(--border); }
  .toc a { display: block; padding: 0.35rem 0 0.35rem 0.9rem; color: var(--muted); font-size: 0.88rem; line-height: 1.35; }
  .toc a:hover { color: var(--text); text-decoration: none; }
  .links { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 0.55rem; }
  .links li { display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; }
  .links a { color: var(--text); font-size: 0.92rem; font-weight: 600; }
  .links a:hover { color: var(--accent); text-decoration: none; }
  .stage { color: var(--muted); font-size: 0.75rem; }
  @media (max-width: 960px) {
    .layout { grid-template-columns: minmax(0, 1fr); gap: 1rem; }
    .rail { position: static; order: 2; }
    .rail nav { display: none; }
  }
</style>
