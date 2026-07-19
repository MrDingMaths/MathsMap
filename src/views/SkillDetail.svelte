<script>
  import { skillById, dependentsOf, courseById, primaryTopicForSkill, siblingSkills } from '../lib/data.js';
  import { href } from '../lib/router.svelte.js';
  import { lockedSkills } from '../lib/recommender.js';
  import { getMastery, subscribe } from '../lib/store.js';
  import { loadSkillContent, setContentCache } from '../lib/content.js';
  import { adminState, saveContent } from '../lib/admin.svelte.js';
  import MasteryControl from '../components/MasteryControl.svelte';
  import MasteryStatus from '../components/MasteryStatus.svelte';
  import SkillLink from '../components/SkillLink.svelte';
  import MapLink from '../components/MapLink.svelte';
  import MathText from '../components/Math.svelte';
  import TheoryView from '../components/TheoryView.svelte';
  import PracticeCarousel from '../components/PracticeCarousel.svelte';
  import TheoryEditor from '../admin/TheoryEditor.svelte';
  import PracticeEditor from '../admin/PracticeEditor.svelte';

  let { id, courseId = null } = $props();
  let skill = $derived(skillById.get(id));
  let courseQuery = $derived(courseId ? `?course=${courseId}` : '');
  let topic = $derived(skill ? primaryTopicForSkill(skill.id) : null);
  let course = $derived(courseId ? courseById.get(courseId) : null);
  let siblings = $derived(skill ? siblingSkills(skill.id, courseId) : { prev: null, next: null });

  let locked = $state([]);
  let currentMastery = $state('none');
  $effect(() => subscribe(() => {
    locked = skill ? lockedSkills(skill) : [];
    currentMastery = skill ? getMastery(skill.id) : 'none';
  }));

  let prereqs = $derived((skill?.prereqs ?? []).map((id) => skillById.get(id)).filter(Boolean));
  let unlocks = $derived((dependentsOf.get(skill?.id) ?? []).map((id) => skillById.get(id)).filter(Boolean));
  let prereqLabel = $derived(prereqs.length === 0 ? null : locked.length === 0 ? 'All mastered' : `${locked.length} to complete`);

  const TIERS = [
    { key: 'foundation', label: 'Foundation' },
    { key: 'development', label: 'Development' },
    { key: 'mastery', label: 'Mastery' }
  ];

  let content = $state(null);
  $effect(() => {
    let active = true;
    content = null;
    if (skill) loadSkillContent(skill.id).then((loaded) => { if (active) content = loaded; });
    return () => { active = false; };
  });
  let hasPractice = $derived(Boolean(content?.practice && TIERS.some((tier) => content.practice[tier.key]?.length)));

  let theoryOpen = $state(true);
  let practiceEl = $state(null);
  function startPractice() {
    theoryOpen = false;
    requestAnimationFrame(() => practiceEl?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  async function persist(updated) {
    await saveContent(skill.id, updated);
    content = updated;
    setContentCache(skill.id, updated);
  }
  async function saveTheory(theory) { await persist({ ...content, theory }); }
  async function savePractice(practice) { await persist({ ...content, practice }); }
</script>

<div class="container">
  {#if skill}
    <div class="page-head">
      <div class="crumbs">
        <a href={href('/')}>Browse</a>
        {#if course} / <a href={href(`/course/${course.id}`)}>{course.title}</a>{/if}
        {#if topic} / <a href={href(`/topic/${topic.id}${courseQuery}`)}><MathText text={topic.title} /></a>{/if}
        / <span aria-current="page"><MathText text={skill.title} /></span>
      </div>
      <MapLink to={`/map?skill=${skill.id}${courseId ? `&course=${courseId}` : ''}`} />
    </div>

    <header class="skill-header">
      <div class="title-context">
        {#if topic}<a href={href(`/topic/${topic.id}${courseQuery}`)}>Back to <MathText text={topic.title} /></a>{/if}
        <MasteryStatus level={currentMastery} />
      </div>
      <h1><MathText text={skill.title} /></h1>
      {#if skill.blurb}<p class="blurb"><MathText text={skill.blurb} /></p>{/if}
      <div class="title-actions">
        {#if hasPractice}<button class="primary-action" onclick={startPractice}>Start practice <span aria-hidden="true">&darr;</span></button>{/if}
        {#if siblings.prev}<a href={href(`/skill/${siblings.prev.id}${courseQuery}`)}><span aria-hidden="true">&larr;</span> Previous skill</a>{/if}
        {#if siblings.next}<a href={href(`/skill/${siblings.next.id}${courseQuery}`)}>Next skill <span aria-hidden="true">&rarr;</span></a>{/if}
      </div>
    </header>

    <div class="skill-grid">
      <main class="skill-content">
        {#if content}
          {#if content.theory || adminState.isAdmin}
            <details class="theory-disclosure" bind:open={theoryOpen}>
              <summary><span><span class="section-kicker">Learn</span><strong>Theory and method</strong></span><span class="summary-action">{theoryOpen ? 'Collapse' : 'Review'}</span></summary>
              <div class="theory-body">
                {#if adminState.isAdmin}<TheoryEditor theory={content.theory ?? {}} onSave={saveTheory} />{:else}<TheoryView theory={content.theory} />{/if}
              </div>
            </details>
          {/if}

          {#if content.practice || adminState.isAdmin}
            <section class="practice-section" bind:this={practiceEl}>
              <div class="section-title"><span class="section-kicker">Try it</span><h2>Practice</h2><p>Work through each level at your own pace.</p></div>
              {#if adminState.isAdmin}
                <PracticeEditor practice={content.practice ?? {}} onSave={savePractice} />
              {:else}
                {#each TIERS as tier}{#if content.practice[tier.key]?.length}<PracticeCarousel {tier} items={content.practice[tier.key]} />{/if}{/each}
              {/if}
            </section>
          {/if}
        {:else}
          <section class="practice-section">
            <div class="section-title"><span class="section-kicker">Coming soon</span><h2>Practice</h2></div>
            <div class="practice-placeholder"><div class="tier-list"><span><b>1</b> Foundation</span><span><b>2</b> Development</span><span><b>3</b> Mastery</span></div><p>Teaching content for this skill is being prepared.</p></div>
          </section>
        {/if}

        {#if siblings.prev || siblings.next}
          <nav class="skill-nav" aria-label="Sibling skills">
            {#if siblings.prev}<a class="snav" href={href(`/skill/${siblings.prev.id}${courseQuery}`)}><span class="nav-direction">&larr; Previous</span><span><MathText text={siblings.prev.title} /></span></a>{:else}<span></span>{/if}
            {#if siblings.next}<a class="snav next" href={href(`/skill/${siblings.next.id}${courseQuery}`)}><span class="nav-direction">Next &rarr;</span><span><MathText text={siblings.next.title} /></span></a>{:else}<span></span>{/if}
          </nav>
        {/if}
      </main>

      <aside class="skill-side" aria-label="Learning details">
        <MasteryControl skillId={skill.id} />
        <div class="learning-context">
          <div class="context-tags">{#each skill.courses as id}<span class="tag">{courseById.get(id)?.title ?? id}</span>{/each}</div>
          <section class="side-section">
            <div class="side-heading"><div><span class="section-kicker">Before this</span><h2>Prerequisites</h2></div>{#if prereqLabel}<span class="count-pill">{prereqLabel}</span>{/if}</div>
            {#if prereqs.length}<div class="side-link-stack">{#each prereqs as prerequisite}<SkillLink skill={prerequisite} {courseId} variant="prereq" />{/each}</div>{:else}<p class="muted">None — this is a good entry point.</p>{/if}
          </section>
          <section class="side-section">
            <div class="side-heading"><div><span class="section-kicker">After this</span><h2>Unlocks next</h2></div>{#if unlocks.length}<span class="count-pill">{unlocks.length} {unlocks.length === 1 ? 'skill' : 'skills'}</span>{/if}</div>
            {#if unlocks.length}<div class="side-link-stack">{#each unlocks as dependent}<SkillLink skill={dependent} {courseId} variant="unlock" />{/each}</div>{:else}<p class="muted">Nothing currently depends on this skill.</p>{/if}
          </section>
        </div>
      </aside>
    </div>
  {:else}
    <p class="muted">Unknown skill.</p>
  {/if}
</div>

<style>
  .skill-header { max-width: 900px; margin: 1.2rem 0 1.8rem; }
  .title-context { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 0.5rem; }
  .title-context > a { padding-right: 0.8rem; border-right: 1px solid var(--border); color: var(--muted); font-size: 0.78rem; font-weight: 650; }
  .title-context > a:hover { color: var(--accent); text-decoration: none; }
  .skill-header h1 { max-width: 850px; margin: 0; font-size: clamp(2rem, 5vw, 3rem); }
  .skill-header .blurb { max-width: 68ch; margin: 0.65rem 0 0; color: var(--muted); font-size: 1.02rem; }
  .title-actions { display: flex; align-items: center; gap: 0.55rem; flex-wrap: wrap; margin-top: 1rem; }
  .title-actions a, .title-actions button { display: inline-flex; align-items: center; gap: 0.35rem; min-height: 40px; padding: 0.5rem 0.75rem; border: 1px solid var(--border-strong); border-radius: 9px; background: var(--panel); color: var(--text); font: 650 0.78rem var(--font-body); cursor: pointer; }
  .title-actions a:hover, .title-actions button:hover { border-color: var(--border-strong); background: var(--panel-2); color: var(--accent); text-decoration: none; }
  .title-actions .primary-action { border-color: transparent; background: var(--accent); color: #fff; }
  .title-actions .primary-action:hover { background: var(--accent-strong); color: #fff; }
  .skill-grid { display: grid; grid-template-columns: minmax(0, 1fr) 350px; gap: 2.5rem; align-items: start; }
  .skill-side { position: sticky; top: 142px; display: flex; flex-direction: column; gap: 0.8rem; }
  .learning-context { padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--panel); }
  .context-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; padding-bottom: 0.8rem; border-bottom: 1px solid var(--border); }
  .tag { margin: 0; border-color: transparent; background: var(--surface-soft); }
  .section-kicker { display: block; color: var(--muted); font-size: 0.64rem; font-weight: 750; letter-spacing: 0.08em; text-transform: uppercase; }
  .theory-disclosure { scroll-margin-top: 150px; border-block: 1px solid var(--border); }
  .theory-disclosure summary { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.85rem 0; cursor: pointer; list-style: none; }
  .theory-disclosure summary::-webkit-details-marker { display: none; }
  .theory-disclosure summary strong { display: block; margin-top: 0.12rem; font-family: var(--font-display); font-size: 1.15rem; }
  .summary-action { color: var(--accent); font-size: 0.72rem; font-weight: 700; }
  .theory-body { padding-bottom: 1rem; }
  .practice-section { margin-top: 2.2rem; scroll-margin-top: 150px; }
  .section-title h2 { margin: 0.12rem 0 0; font-size: 1.35rem; }
  .section-title p { margin: 0.3rem 0 0; color: var(--muted); font-size: 0.82rem; }
  .practice-placeholder { margin-top: 0.8rem; padding: 1.5rem; border: 1px dashed var(--border-strong); border-radius: var(--radius-lg); background: var(--surface-soft); text-align: center; }
  .tier-list { display: flex; justify-content: center; gap: 0.6rem; flex-wrap: wrap; }
  .tier-list span { display: flex; align-items: center; gap: 0.4rem; color: var(--muted); font-size: 0.8rem; }
  .tier-list b { display: grid; place-items: center; width: 1.5rem; height: 1.5rem; border-radius: 7px; background: var(--panel); color: var(--text); }
  .side-section { margin-top: 1.1rem; }
  .side-heading { display: flex; align-items: end; justify-content: space-between; gap: 0.5rem; }
  .side-heading h2 { margin: 0.1rem 0 0; font-size: 0.95rem; }
  .count-pill { color: var(--muted); font-size: 0.66rem; font-weight: 650; }
  .side-section > .muted { margin: 0.65rem 0 0; font-size: 0.78rem; }
  .side-link-stack { margin-top: 0.45rem; }
  .skill-nav { display: flex; justify-content: space-between; gap: 1rem; margin-top: 2.4rem; padding-top: 1.2rem; border-top: 1px solid var(--border); }
  .snav { display: flex; flex-direction: column; gap: 0.15rem; max-width: 48%; color: var(--text); font-size: 0.82rem; }
  .snav.next { margin-left: auto; text-align: right; }
  .snav:hover { color: var(--accent); text-decoration: none; }
  .nav-direction { color: var(--muted); font-size: 0.68rem; font-weight: 700; text-transform: uppercase; }
  @media (max-width: 900px) { .skill-grid { grid-template-columns: 1fr; gap: 1.8rem; } .skill-side { position: static; } }
  @media (max-width: 620px) { .page-head :global(.map-link) { padding-inline: 0.65rem; } .skill-header { margin-top: 0.8rem; } .title-actions .primary-action { width: 100%; justify-content: center; } .skill-nav { align-items: flex-start; } .snav { max-width: 46%; } }
</style>
