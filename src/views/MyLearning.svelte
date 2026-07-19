<script>
  import { untrack } from 'svelte';
  import { allProgress, subscribe } from '../lib/store.js';
  import { skillById } from '../lib/data.js';
  import { nextSkills } from '../lib/recommender.js';
  import { href } from '../lib/router.svelte.js';
  import SkillCard from '../components/SkillCard.svelte';
  import MasteryStatus from '../components/MasteryStatus.svelte';
  import Math from '../components/Math.svelte';

  let tick = $state(0);
  $effect(() => subscribe(() => untrack(() => tick++)));

  let progress = $derived.by(() => {
    tick;
    return Object.entries(allProgress())
      .map(([id, record]) => ({ skill: skillById.get(id), ...record }))
      .filter((item) => item.skill)
      .sort((a, b) => b.at - a.at);
  });
  let active = $derived(progress.filter((item) => item.level === 'learning' || item.level === 'proficient'));
  let completed = $derived(progress.filter((item) => item.level === 'mastered'));
  let recommended = $derived.by(() => {
    tick;
    return nextSkills({ limit: 6 });
  });
</script>

<div class="container learning-view">
  <header class="learning-hero">
    <span class="eyebrow">My learning</span>
    <h1>Pick up where you left off</h1>
    <p>Continue a skill or start a new one.</p>
    {#if active[0]}
      <a class="primary-action" href={href(`/skill/${active[0].skill.id}`)}>Continue <Math text={active[0].skill.title} /> <span aria-hidden="true">&rarr;</span></a>
    {:else if recommended[0]}
      <a class="primary-action" href={href(`/skill/${recommended[0].id}`)}>Start <Math text={recommended[0].title} /> <span aria-hidden="true">&rarr;</span></a>
    {/if}
  </header>

  {#if active.length}
    <section>
      <div class="section-heading"><div><span class="eyebrow">In progress</span><h2>Continue learning</h2></div><span>{active.length} {active.length === 1 ? 'skill' : 'skills'}</span></div>
      <div class="learning-list">
        {#each active as item}
          <a href={href(`/skill/${item.skill.id}`)}>
            <span class="skill-title"><Math text={item.skill.title} /></span>
            <MasteryStatus level={item.level} />
            <span class="arrow" aria-hidden="true">&rarr;</span>
          </a>
        {/each}
      </div>
    </section>
  {/if}

  {#if recommended.length}
    <section>
      <div class="section-heading"><div><span class="eyebrow">Ready now</span><h2>Recommended next</h2></div></div>
      <div class="grid">{#each recommended as skill}<SkillCard {skill} />{/each}</div>
    </section>
  {/if}

  {#if completed.length}
    <details class="completed">
      <summary>{completed.length} mastered {completed.length === 1 ? 'skill' : 'skills'}</summary>
      <div class="completed-list">
        {#each completed as item}<a href={href(`/skill/${item.skill.id}`)}><Math text={item.skill.title} /><MasteryStatus level="mastered" compact /></a>{/each}
      </div>
    </details>
  {/if}

  {#if progress.length === 0}
    <div class="empty-state"><span class="route-mark" aria-hidden="true">&#8605;</span><h2>Your learning path starts here</h2><p>Choose a topic or take a diagnostic quiz to find a good starting point.</p><div><a class="primary-action" href={href('/')}>Browse courses</a><a class="secondary-action" href={href('/quiz')}>Take the quiz</a></div></div>
  {/if}
</div>

<style>
  .learning-view { max-width: 1080px; }
  .learning-hero { position: relative; overflow: hidden; padding: 2rem; border: 1px solid var(--border-strong); border-radius: var(--radius-xl); background: radial-gradient(135% 160% at 100% 0%, color-mix(in srgb, var(--accent) 11%, var(--panel)) 0%, var(--surface-warm) 48%, var(--panel) 100%); box-shadow: var(--shadow); }
  .learning-hero .eyebrow { color: var(--accent); }
  .eyebrow { color: var(--muted); font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
  h1 { margin: 0.25rem 0 0.45rem; font-size: clamp(1.8rem, 4vw, 2.5rem); }
  .learning-hero p { max-width: 55ch; margin: 0 0 1.25rem; color: var(--muted); }
  .primary-action, .secondary-action { position: relative; z-index: 1; display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.7rem 1rem; border-radius: 10px; font-weight: 700; }
  .primary-action { background: var(--accent); color: #fff; }
  .primary-action:hover { text-decoration: none; background: var(--accent-strong); }
  .secondary-action { margin-left: 0.5rem; border: 1px solid var(--border-strong); color: var(--text); }
  section { margin-top: 2rem; }
  .section-heading { display: flex; align-items: end; justify-content: space-between; margin-bottom: 0.8rem; color: var(--muted); font-size: 0.78rem; }
  .section-heading h2 { margin: 0.15rem 0 0; color: var(--text); font-size: 1.25rem; }
  .learning-list { overflow: hidden; border-block: 1px solid var(--border); }
  .learning-list a { display: flex; align-items: center; gap: 1rem; padding: 0.9rem 0.25rem; color: var(--text); border-bottom: 1px solid var(--border); }
  .learning-list a:last-child { border-bottom: 0; }
  .learning-list a:hover { color: var(--accent); text-decoration: none; }
  .skill-title { flex: 1; font-weight: 650; }
  .arrow { color: var(--muted); }
  .completed { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border); }
  .completed summary { cursor: pointer; color: var(--muted); font-weight: 650; }
  .completed-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.5rem 1.2rem; margin-top: 0.8rem; }
  .completed-list a { display: flex; justify-content: space-between; gap: 1rem; padding: 0.6rem 0; color: var(--text); }
  .empty-state { padding: 4rem 1rem; text-align: center; }
  .route-mark { display: block; color: var(--accent); font-size: 2rem; transform: rotate(-20deg); }
  .empty-state p { color: var(--muted); }
  @media (max-width: 640px) { .learning-hero { padding: 1.35rem; } .learning-list a { align-items: flex-start; flex-wrap: wrap; } .skill-title { flex-basis: calc(100% - 2rem); } }
</style>
