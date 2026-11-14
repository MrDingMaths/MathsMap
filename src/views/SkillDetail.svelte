<script>
  import { skillById, dependentsOf, courseById, dotpointById, primaryTopicForSkill, siblingSkills } from '../lib/data.js';
  import { href } from '../lib/router.svelte.js';
  import { lockedSkills } from '../lib/recommender.js';
  import { getMastery, subscribe } from '../lib/store.js';
  import { loadSkillContent, setContentCache } from '../lib/content.js';
  import { setQuizCache } from '../lib/quiz.js';
  import { adminState, loadAdminSnapshot, saveContent, saveQuiz } from '../lib/admin.svelte.js';
  import { strandColour } from '../lib/strands.js';
  import MasteryStatus from '../components/MasteryStatus.svelte';
  import SkillLink from '../components/SkillLink.svelte';
  import MapLink from '../components/MapLink.svelte';
  import MathText from '../components/Math.svelte';
  import TheoryView from '../components/TheoryView.svelte';
  import PracticeCarousel from '../components/PracticeCarousel.svelte';
  import TheoryEditor from '../admin/TheoryEditor.svelte';
  import PracticeEditor from '../admin/PracticeEditor.svelte';
  import QuizEditor from '../admin/QuizEditor.svelte';

  let { id, courseId = null } = $props();
  let skill = $derived(skillById.get(id));
  let courseQuery = $derived(courseId ? `?course=${courseId}` : '');
  let topic = $derived(skill ? primaryTopicForSkill(skill.id) : null);
  let course = $derived(courseId ? courseById.get(courseId) : null);
  let siblings = $derived(skill ? siblingSkills(skill.id, courseId) : { prev: null, next: null });
  let outcomeCode = $derived(dotpointById.get((skill?.dotPointIds ?? [])[0])?.code ?? null);

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
  let quiz = $state(null);
  let revision = $state(null);
  let loadError = $state('');
  let loadGeneration = 0;
  $effect(() => {
    loadGeneration += 1;
    let active = true;
    const currentId = skill?.id;
    const isAdmin = adminState.isAdmin;
    content = null;
    quiz = null;
    revision = null;
    loadError = '';
    if (currentId) {
      const loading = isAdmin ? loadAdminSnapshot(currentId) : loadSkillContent(currentId).then((loaded) => ({ content: loaded }));
      loading.then((loaded) => { if (active) { content = loaded.content; quiz = loaded.quiz ?? null; revision = loaded.expected ?? null; } })
        .catch((error) => { if (active) loadError = error.message; });
    }
    return () => { active = false; };
  });
  let hasPractice = $derived(Boolean(content?.practice && TIERS.some((tier) => content.practice[tier.key]?.length)));

  async function saveQuizContent(updated) {
    const currentId = skill.id;
    const generation = loadGeneration;
    const { expected } = await saveQuiz(currentId, updated, revision);
    if (loadGeneration !== generation || skill?.id !== currentId) return;
    setQuizCache(currentId, updated);
    revision = expected;
    quiz = updated;
  }

  let theoryOpen = $state(true);
  let practiceEl = $state(null);
  function startPractice() {
    theoryOpen = false;
    requestAnimationFrame(() => practiceEl?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  async function persist(updated) {
    const currentId = skill.id;
    const generation = loadGeneration;
    const { expected } = await saveContent(currentId, updated, revision);
    if (loadGeneration !== generation || skill?.id !== currentId) return;
    setContentCache(currentId, updated);
    revision = expected;
    content = updated;
  }
  async function saveTheory(theory) { await persist({ ...content, theory }); }
  async function savePractice(practice) { await persist({ ...content, practice }); }
</script>

<div class="container">
  {#if loadError}<p role="alert">{loadError}</p>{/if}
  {#if skill}
    <div class="page-head">
      <div class="crumbs">
        <a href={href('/')}>Browse</a>
        {#if course} / <a href={href(`/course/${course.id}`)}>{course.title}</a>{/if}
        {#if topic} / <a href={href(`/topic/${topic.id}${courseQuery}`)}><MathText text={topic.title} /></a>{/if}
        / <span aria-current="page"><MathText text={skill.title} /></span>
      </div>
    </div>

    <header class="skill-header">
      <div class="eyebrow">
        {#if topic}<span class="strand" style="color:{strandColour(topic.strand)}"><span class="dot" aria-hidden="true"></span>{topic.strand}</span>{/if}
        <span>Stage {skill.stage}</span>
        {#if outcomeCode}<span>{outcomeCode}</span>{/if}
        <MasteryStatus level={currentMastery} />
      </div>
      <h1><MathText text={skill.title} /></h1>
      {#if skill.blurb}<p class="blurb"><MathText text={skill.blurb} /></p>{/if}
      <div class="title-actions">
        <a class="mm-btn primary" href={href(`/quiz?skill=${skill.id}${courseId ? `&course=${courseId}` : ''}`)}>Take quiz <span aria-hidden="true">&rarr;</span></a>
        {#if hasPractice}<button class="mm-btn" onclick={startPractice}>Start practice <span aria-hidden="true">&darr;</span></button>{/if}
        <MapLink to={`/map?skill=${skill.id}${courseId ? `&course=${courseId}` : ''}`} />
      </div>
    </header>

    <div class="skill-grid">
      <main class="skill-content">
        {#if content}
          {#if content.theory || adminState.isAdmin}
            <details class="theory-disclosure" id="theory" bind:open={theoryOpen}>
              <summary><strong>Theory and method</strong><span class="summary-action">{theoryOpen ? 'Collapse' : 'Review'}</span></summary>
              <div class="theory-body">
                {#if adminState.isAdmin}<TheoryEditor theory={content.theory ?? {}} onSave={saveTheory} />{:else}<TheoryView theory={content.theory} />{/if}
              </div>
            </details>
          {/if}

          {#if content.practice || adminState.isAdmin}
            <section class="practice-section" id="practice" bind:this={practiceEl}>
              <div class="section-title"><h2>Practice</h2></div>
              {#if adminState.isAdmin}
                <PracticeEditor practice={content.practice ?? {}} onSave={savePractice} />
              {:else}
                {#each TIERS as tier}{#if content.practice[tier.key]?.length}<PracticeCarousel {tier} items={content.practice[tier.key]} />{/if}{/each}
              {/if}
            </section>
          {/if}
        {:else}
          <section class="practice-section">
            <div class="section-title"><h2>Practice</h2></div>
            <div class="practice-placeholder"><div class="tier-list"><span><b>1</b> Foundation</span><span><b>2</b> Development</span><span><b>3</b> Mastery</span></div><p>Teaching content for this skill is being prepared.</p></div>
          </section>
        {/if}

        {#if adminState.isAdmin}
          <section class="quiz-section">
            <div class="section-title"><h2>Quiz questions</h2></div>
            <QuizEditor skillId={skill.id} {quiz} onSave={saveQuizContent} />
          </section>
        {/if}

        <section class="quiz-cta">
          <div>
            <h2>Ready to show what you know?</h2>
            <p>A short quiz moves this skill toward mastered.</p>
          </div>
          <a class="mm-btn primary" href={href(`/quiz?skill=${skill.id}${courseId ? `&course=${courseId}` : ''}`)}>Take quiz</a>
        </section>

        {#if siblings.prev || siblings.next}
          <nav class="skill-nav" aria-label="Sibling skills">
            {#if siblings.prev}<a class="snav" href={href(`/skill/${siblings.prev.id}${courseQuery}`)}><span class="nav-direction">&larr; Previous</span><span><MathText text={siblings.prev.title} /></span></a>{:else}<span></span>{/if}
            {#if siblings.next}<a class="snav next" href={href(`/skill/${siblings.next.id}${courseQuery}`)}><span class="nav-direction">Next &rarr;</span><span><MathText text={siblings.next.title} /></span></a>{:else}<span></span>{/if}
          </nav>
        {/if}
      </main>

      <aside class="skill-side" aria-label="Learning details">
        {#if content && (content.theory || content.practice)}
          <nav class="side-section toc-block" aria-label="On this page">
            <p class="rail-label">On this page</p>
            <ol class="toc">
              {#if content.theory}<li><a href="#theory" onclick={(event) => { event.preventDefault(); theoryOpen = true; document.getElementById('theory')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>Theory and method</a></li>{/if}
              {#if hasPractice}<li><a href="#practice" onclick={(event) => { event.preventDefault(); practiceEl?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>Practice</a></li>{/if}
            </ol>
          </nav>
        {/if}
        <section class="side-section">
          <div class="side-heading"><p class="rail-label">Builds on</p>{#if prereqLabel}<span class="count-pill">{prereqLabel}</span>{/if}</div>
          {#if prereqs.length}<div class="side-link-stack">{#each prereqs as prerequisite}<SkillLink skill={prerequisite} {courseId} variant="prereq" />{/each}</div>{:else}<p class="muted">Nothing. This is a good place to start.</p>{/if}
        </section>
        <section class="side-section">
          <div class="side-heading"><p class="rail-label">Unlocks</p>{#if unlocks.length}<span class="count-pill">{unlocks.length} {unlocks.length === 1 ? 'skill' : 'skills'}</span>{/if}</div>
          {#if unlocks.length}<div class="side-link-stack">{#each unlocks as dependent}<SkillLink skill={dependent} {courseId} variant="unlock" />{/each}</div>{:else}<p class="muted">Nothing depends on this skill yet.</p>{/if}
        </section>
        {#if topic}
          <section class="side-section">
            <p class="rail-label">Part of</p>
            <a class="part-of" href={href(`/topic/${topic.id}${courseQuery}`)}><MathText text={topic.title} /></a>
            <div class="context-tags">{#each skill.courses as id}<span class="tag">{courseById.get(id)?.title ?? id}</span>{/each}</div>
          </section>
        {/if}
      </aside>
    </div>
  {:else}
    <p class="muted">Unknown skill.</p>
  {/if}
</div>

<style>
  .skill-header { max-width: 900px; margin: 0.4rem 0 2rem; }
  .eyebrow { display: flex; flex-wrap: wrap; align-items: center; gap: 0.35rem 1rem; margin-bottom: 0.55rem; color: var(--muted); font-size: 0.86rem; font-weight: 600; }
  .strand { display: inline-flex; align-items: center; gap: 0.4rem; font-weight: 800; }
  .strand .dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
  .skill-header h1 { max-width: 850px; margin: 0; font-size: clamp(2rem, 4.4vw, 3rem); line-height: 1.08; }
  .skill-header .blurb { max-width: 68ch; margin: 0.7rem 0 0; color: var(--muted); font-size: 1.08rem; }
  .title-actions { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; margin-top: 1.3rem; }
  .skill-grid { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 3.5rem; align-items: start; padding-top: 0.4rem; border-top: 1px solid var(--border); }
  .skill-content { min-width: 0; }
  .skill-side { position: sticky; top: calc(var(--top-nav-height, 60px) + 1.5rem); display: flex; flex-direction: column; padding-top: 1.4rem; }
  .context-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.6rem; }
  .tag { margin: 0; border-color: transparent; background: var(--surface-soft); }
  .part-of { color: var(--text); font-weight: 700; font-size: 0.92rem; }
  .part-of:hover { color: var(--accent); text-decoration: none; }
  .toc { margin: 0; padding: 0; list-style: none; border-left: 2px solid var(--border); }
  .toc a { display: block; padding: 0.35rem 0 0.35rem 0.9rem; color: var(--muted); font-size: 0.88rem; }
  .toc a:hover { color: var(--text); text-decoration: none; }
  .theory-disclosure { scroll-margin-top: 80px; }
  .theory-disclosure summary { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; padding: 1.4rem 0 0.9rem; cursor: pointer; list-style: none; }
  .theory-disclosure summary::-webkit-details-marker { display: none; }
  .theory-disclosure summary strong { display: block; font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; letter-spacing: -0.015em; }
  .summary-action { color: var(--muted); font-size: 0.8rem; font-weight: 700; }
  .summary-action:hover { color: var(--accent); }
  .theory-body { padding-bottom: 1rem; }
  .practice-section, .quiz-section { margin-top: 2rem; padding-top: 1.4rem; border-top: 1px solid var(--border); scroll-margin-top: 80px; }
  .section-title h2 { margin: 0 0 0.6rem; font-size: 1.6rem; }
  .practice-placeholder { margin-top: 0.8rem; padding: 1.5rem; border: 1px dashed var(--border-strong); border-radius: var(--radius-lg); background: var(--surface-soft); text-align: center; }
  .tier-list { display: flex; justify-content: center; gap: 0.6rem; flex-wrap: wrap; }
  .tier-list span { display: flex; align-items: center; gap: 0.4rem; color: var(--muted); font-size: 0.8rem; }
  .tier-list b { display: grid; place-items: center; width: 1.5rem; height: 1.5rem; border-radius: 7px; background: var(--panel); color: var(--text); }
  .side-section { padding: 1.2rem 0; border-top: 1px solid var(--border); }
  .side-section:first-child { padding-top: 0; border-top: 0; }
  .side-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; }
  .count-pill { color: var(--muted); font-size: 0.72rem; font-weight: 700; }
  .side-section > .muted { margin: 0; font-size: 0.86rem; }
  .side-link-stack { margin-top: -0.4rem; }
  .quiz-cta { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-top: 2.4rem; padding: 1.4rem 1.6rem; border-radius: var(--radius-card, 12px); background: var(--surface-soft); }
  .quiz-cta h2 { margin: 0 0 0.25rem; font-size: 1.3rem; }
  .quiz-cta p { margin: 0; color: var(--muted); font-size: 0.95rem; }
  .skill-nav { display: flex; justify-content: space-between; gap: 1rem; margin-top: 2.4rem; padding-top: 1.2rem; border-top: 1px solid var(--border); }
  .snav { display: flex; flex-direction: column; gap: 0.15rem; max-width: 48%; color: var(--text); font-size: 0.82rem; }
  .snav.next { margin-left: auto; text-align: right; }
  .snav:hover { color: var(--accent); text-decoration: none; }
  .nav-direction { color: var(--muted); font-size: 0.68rem; font-weight: 700; text-transform: uppercase; }
  @media (max-width: 960px) { .skill-grid { grid-template-columns: minmax(0, 1fr); gap: 1rem; } .skill-side { position: static; } .toc-block { display: none; } }
  @media (max-width: 620px) { .title-actions .mm-btn.primary { width: 100%; } .skill-nav { align-items: flex-start; } .snav { max-width: 46%; } }
</style>
