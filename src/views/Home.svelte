<script>
  import { untrack } from 'svelte';
  import { courses, coursesByStage, topicsForCourse, skillById } from '../lib/data.js';
  import { topicStats, subscribe, allProgress } from '../lib/store.js';
  import { nextSkills } from '../lib/recommender.js';
  import { route, href, go } from '../lib/router.svelte.js';
  import TopicCard from '../components/TopicCard.svelte';
  import MasteryBar from '../components/MasteryBar.svelte';

  const orderedCourses = [...courses].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const groupedCourses = coursesByStage();
  const stages = [...groupedCourses.keys()];

  let tick = $state(0);
  $effect(() => subscribe(() => untrack(() => tick++)));

  let selectedStage = $derived.by(() => {
    const requested = Number(route.query.stage);
    return stages.includes(requested) ? requested : stages[0];
  });
  let stageCourses = $derived(groupedCourses.get(selectedStage) ?? []);
  let selectedCourse = $derived.by(() => {
    const requested = route.query.course;
    return stageCourses.find((course) => course.id === requested) ?? stageCourses[0] ?? orderedCourses[0];
  });
  let selectedTopics = $derived(selectedCourse ? topicsForCourse(selectedCourse.id) : []);

  let continueSkill = $derived.by(() => {
    tick;
    const recent = Object.entries(allProgress())
      .filter(([, record]) => record.level !== 'mastered')
      .sort((a, b) => b[1].at - a[1].at)
      .map(([id]) => skillById.get(id))
      .find(Boolean);
    return recent ?? nextSkills({ limit: 1 })[0] ?? null;
  });

  function masteryFor(courseId) {
    tick;
    const topics = topicsForCourse(courseId);
    const mastered = topics.filter((topic) => topicStats(topic.id, courseId).fullyMastered).length;
    const total = topics.length;
    return {
      mastered,
      total,
      proficient: 0,
      learning: 0,
      none: total - mastered,
      masteredPct: total ? Math.round((mastered / total) * 100) : 0,
      proficientPct: 0,
      learningPct: 0
    };
  }

  function chooseStage(stage) {
    const first = groupedCourses.get(stage)?.[0];
    go(`/?stage=${stage}${first ? `&course=${first.id}` : ''}`);
  }

  function chooseCourse(course) {
    go(`/?stage=${course.stage}&course=${course.id}`);
  }

  function stageKeydown(event, index) {
    let nextIndex = index;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % stages.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + stages.length) % stages.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = stages.length - 1;
    else return;
    event.preventDefault();
    chooseStage(stages[nextIndex]);
    requestAnimationFrame(() => document.getElementById(`stage-tab-${stages[nextIndex]}`)?.focus());
  }

  function strandSummary(courseId) {
    const seen = new Set();
    for (const topic of topicsForCourse(courseId)) seen.add(topic.strand || 'Other');
    return [...seen];
  }

  function selectedStrandGroups() {
    const groups = new Map();
    for (const topic of selectedTopics) {
      const strand = topic.strand || 'Other';
      if (!groups.has(strand)) groups.set(strand, []);
      groups.get(strand).push(topic);
    }
    return [...groups].map(([name, topics]) => ({ name, topics }));
  }
</script>

<div class="container browse-page">
  <section class="home-hero">
    <div class="hero-copy">
      <span class="eyebrow">Your learning route</span>
      <h1>Find the next maths skill that makes sense</h1>
      <p class="lede">Choose your stage, explore a course, and see the topics that connect your next steps.</p>
    </div>
    <div class="hero-actions">
      {#if continueSkill}
        <a class="continue-cta" href={href(`/skill/${continueSkill.id}`)}>
          <span class="cta-icon" aria-hidden="true">&rarr;</span>
          <span><small>Continue learning</small><strong>{continueSkill.title}</strong></span>
        </a>
      {/if}
      <a class="quiz-cta" href={href('/quiz')}>
        <span class="cta-icon quiz-icon" aria-hidden="true">&#10003;</span>
        <span><small>Not sure where to start?</small><strong>Take a diagnostic quiz</strong></span>
      </a>
    </div>
  </section>

  <section class="dashboard" aria-labelledby="browse-title">
    <div class="dashboard-head">
      <div>
        <span class="eyebrow">Browse the curriculum</span>
        <h2 id="browse-title">Choose a stage</h2>
      </div>
      <span class="dashboard-hint">Use Search in the navigation to jump straight to any skill.</span>
    </div>

    <div class="stage-tabs" role="tablist" aria-label="Curriculum stage">
      {#each stages as stage, index}
        <button
          id="stage-tab-{stage}"
          type="button"
          role="tab"
          aria-selected={stage === selectedStage}
          tabindex={stage === selectedStage ? 0 : -1}
          class:active={stage === selectedStage}
          onclick={() => chooseStage(stage)}
          onkeydown={(event) => stageKeydown(event, index)}
        >Stage {stage}</button>
      {/each}
    </div>

    <div class="course-grid" aria-live="polite">
      {#each stageCourses as course, index (course.id)}
        {@const mastery = masteryFor(course.id)}
        {@const strands = strandSummary(course.id)}
        <article
          class="course-card"
          class:selected={selectedCourse?.id === course.id}
          style="--course-color:{course.color}; --enter-index:{Math.min(index, 5)}"
        >
          <button class="course-select" type="button" onclick={() => chooseCourse(course)} aria-pressed={selectedCourse?.id === course.id}>
            <span class="course-topline">
              <span class="course-mark" aria-hidden="true">{course.stage === 6 ? 'Y' : 'S'}{course.stage}</span>
              {#if selectedCourse?.id === course.id}<span class="selected-label">Exploring</span>{/if}
            </span>
            <strong class="course-title">{course.title}</strong>
            <span class="strand-list">{strands.join(' · ')}</span>
            <span class="course-progress">
              <span>{mastery.mastered}/{mastery.total} topics mastered</span>
              <MasteryBar stats={mastery} height="7px" />
            </span>
          </button>
          <div class="course-links">
            {#each topicsForCourse(course.id).slice(0, 3) as topic}
              <a href={href(`/topic/${topic.id}?course=${course.id}`)}>{topic.title}</a>
            {/each}
          </div>
          <a class="explore-course" href={href(`/course/${course.id}`)}>Explore course <span aria-hidden="true">&rarr;</span></a>
        </article>
      {/each}
    </div>
  </section>

  {#if selectedCourse}
    {#key selectedCourse.id}
      <section class="topic-explorer" aria-labelledby="topic-explorer-title">
      <header>
        <div>
          <span class="course-context" style="--course-color:{selectedCourse.color}">{selectedCourse.title}</span>
          <h2 id="topic-explorer-title">Pick a topic to explore</h2>
          <p>Each topic shows how much you have mastered in this course.</p>
        </div>
        <a class="all-topics" href={href(`/course/${selectedCourse.id}`)}>See the full course <span aria-hidden="true">&rarr;</span></a>
      </header>

      {#each selectedStrandGroups() as group, groupIndex}
        <div class="strand-group" style="--enter-index:{Math.min(groupIndex, 4)}">
          <div class="strand-heading">
            <span class="strand-icon" aria-hidden="true">{groupIndex + 1}</span>
            <h3>{group.name}</h3>
            <span>{group.topics.length} {group.topics.length === 1 ? 'topic' : 'topics'}</span>
          </div>
          <div class="topic-grid">
            {#each group.topics as topic}<TopicCard {topic} courseId={selectedCourse.id} />{/each}
          </div>
        </div>
      {/each}
      </section>
    {/key}
  {/if}
</div>

<style>
  .browse-page { display: flex; flex-direction: column; gap: clamp(1.5rem, 4vw, 2.8rem); }
  .home-hero { position: relative; overflow: hidden; display: grid; grid-template-columns: minmax(0, 1fr) minmax(300px, 420px); gap: 2rem; align-items: end; padding: clamp(1.35rem, 4vw, 2.4rem); border: 1px solid var(--border); border-radius: var(--radius-xl); background: linear-gradient(130deg, var(--surface-warm), var(--panel)); animation: route-enter var(--motion-base) var(--ease-out) both; }
  .hero-copy, .hero-actions { position: relative; z-index: 1; }
  .eyebrow { color: var(--accent); font-size: 0.68rem; font-weight: 750; letter-spacing: 0.09em; text-transform: uppercase; }
  h1 { max-width: 690px; margin: 0.28rem 0 0.5rem; font-size: clamp(1.9rem, 4.5vw, 3rem); }
  .lede { max-width: 580px; margin: 0; color: var(--muted); }
  .hero-actions { display: grid; gap: 0.65rem; }
  .continue-cta, .quiz-cta { display: grid; grid-template-columns: 2rem 1fr; align-items: center; gap: 0.8rem; min-height: 70px; padding: 0.8rem 1rem; border: 1px solid var(--border-strong); border-radius: var(--radius-md); background: var(--panel); color: var(--text); transition: transform var(--motion-fast) var(--ease-snap), border-color var(--motion-fast), box-shadow var(--motion-fast), background var(--motion-fast); }
  .continue-cta { border-color: transparent; background: var(--accent); color: #fff; }
  .continue-cta:hover, .quiz-cta:hover { transform: translateY(-2px); box-shadow: var(--shadow); text-decoration: none; }
  .quiz-cta:hover { border-color: var(--border-strong); background: var(--panel-2); }
  .continue-cta:active, .quiz-cta:active { transform: scale(0.98); }
  .cta-icon { display: grid; place-items: center; width: 2rem; height: 2rem; border: 1px solid currentColor; border-radius: 10px; font-weight: 800; }
  .quiz-icon { color: var(--status-proficient); }
  .hero-actions small, .hero-actions strong { display: block; }
  .hero-actions small { margin-bottom: 0.12rem; font-size: 0.68rem; opacity: 0.78; }
  .hero-actions strong { font-size: 0.86rem; }

  .dashboard { display: flex; flex-direction: column; gap: 1rem; }
  .dashboard-head { display: flex; align-items: end; justify-content: space-between; gap: 1rem; }
  .dashboard-head h2 { margin: 0.15rem 0 0; font-size: 1.5rem; }
  .dashboard-hint { max-width: 340px; color: var(--muted); font-size: 0.76rem; text-align: right; }
  .stage-tabs { display: flex; gap: 0.45rem; overflow-x: auto; padding: 0.15rem 0.15rem 0.45rem; scrollbar-width: thin; }
  .stage-tabs button { position: relative; flex: none; min-width: 92px; min-height: 42px; padding: 0.55rem 1rem; border: 1px solid var(--border); border-radius: 999px; background: var(--panel); color: var(--muted); font: 700 0.82rem var(--font-body); cursor: pointer; transition: transform var(--motion-fast) var(--ease-snap), color var(--motion-fast), border-color var(--motion-fast), background var(--motion-fast); }
  .stage-tabs button:hover { color: var(--text); border-color: var(--border-strong); background: var(--panel-2); transform: translateY(-1px); }
  .stage-tabs button:active { transform: scale(0.96); }
  .stage-tabs button.active { color: #fff; border-color: transparent; background: var(--accent); animation: selection-pop var(--motion-base) var(--ease-snap); }

  .course-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.85rem; }
  .course-card { position: relative; display: flex; flex-direction: column; min-height: 260px; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--panel); animation: card-enter var(--motion-base) var(--ease-out) calc(var(--enter-index) * 45ms) both; transition: transform var(--motion-fast) var(--ease-snap), border-color var(--motion-fast), background var(--motion-fast), box-shadow var(--motion-fast); }
  .course-card:hover { transform: translateY(-3px); border-color: var(--border-strong); box-shadow: var(--shadow); }
  .course-card.selected { border-color: var(--border-strong); background: var(--surface-soft); box-shadow: var(--shadow); }
  .course-select { flex: 1; width: 100%; padding: 1rem 1rem 0.8rem; border: 0; background: transparent; color: var(--text); font: inherit; text-align: left; cursor: pointer; }
  .course-select:active { transform: scale(0.99); }
  .course-topline { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
  .course-mark { display: grid; place-items: center; min-width: 2rem; height: 2rem; padding: 0 0.4rem; border-radius: 9px; background: color-mix(in srgb, var(--course-color) 15%, var(--panel)); color: var(--course-color); font-weight: 800; font-size: 0.72rem; }
  .selected-label { color: var(--course-color); font-size: 0.66rem; font-weight: 750; letter-spacing: 0.06em; text-transform: uppercase; }
  .course-title { display: block; margin-bottom: 0.3rem; font: 600 1.2rem var(--font-display); }
  .strand-list { display: block; min-height: 2.3em; color: var(--muted); font-size: 0.72rem; line-height: 1.4; }
  .course-progress { display: grid; gap: 0.45rem; margin-top: 1rem; color: var(--muted); font-size: 0.72rem; }
  .course-links { display: flex; flex-wrap: wrap; gap: 0.35rem; padding: 0 1rem 0.75rem; }
  .course-links a { padding: 0.25rem 0.5rem; border-radius: 999px; background: var(--surface-soft); color: var(--muted); font-size: 0.66rem; transition: color var(--motion-fast), background var(--motion-fast), transform var(--motion-fast) var(--ease-snap); }
  .course-links a:hover { color: var(--course-color); background: color-mix(in srgb, var(--course-color) 10%, var(--surface-soft)); text-decoration: none; transform: translateY(-1px); }
  .explore-course { display: flex; justify-content: space-between; padding: 0.72rem 1rem; border-top: 1px solid var(--border); color: var(--course-color); font-size: 0.76rem; font-weight: 750; transition: background var(--motion-fast); }
  .explore-course:hover { background: color-mix(in srgb, var(--course-color) 7%, var(--panel)); text-decoration: none; }

  .topic-explorer { padding: clamp(1.1rem, 3vw, 1.7rem); border: 1px solid var(--border); border-radius: var(--radius-xl); background: color-mix(in srgb, var(--panel) 92%, var(--surface-warm)); animation: content-rise var(--motion-slow) var(--ease-out) both; }
  .topic-explorer > header { display: flex; align-items: end; justify-content: space-between; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border); }
  .topic-explorer h2 { margin: 0.35rem 0 0.25rem; font-size: 1.45rem; }
  .topic-explorer header p { margin: 0; color: var(--muted); font-size: 0.82rem; }
  .course-context { display: inline-flex; padding: 0.28rem 0.6rem; border-radius: 999px; background: color-mix(in srgb, var(--course-color) 12%, var(--panel)); color: var(--course-color); font-size: 0.68rem; font-weight: 750; }
  .all-topics { flex: none; font-size: 0.78rem; font-weight: 750; }
  .strand-group { margin-top: 1.25rem; animation: card-enter var(--motion-base) var(--ease-out) calc(var(--enter-index) * 45ms) both; }
  .strand-heading { display: flex; align-items: center; gap: 0.55rem; margin-bottom: 0.65rem; }
  .strand-heading h3 { margin: 0; font: 750 0.78rem var(--font-body); text-transform: uppercase; letter-spacing: 0.05em; }
  .strand-heading > span:last-child { margin-left: auto; color: var(--muted); font-size: 0.68rem; }
  .strand-icon { display: grid; place-items: center; width: 1.6rem; height: 1.6rem; border: 1px solid var(--border-strong); border-radius: 7px; color: var(--muted); font-size: 0.68rem; font-weight: 750; }
  .topic-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(225px, 1fr)); gap: 0.7rem; }

  @media (max-width: 820px) {
    .home-hero { grid-template-columns: 1fr; gap: 1.25rem; }
    .hero-actions { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 640px) {
    .dashboard-head, .topic-explorer > header { align-items: flex-start; flex-direction: column; }
    .dashboard-hint { text-align: left; }
    .hero-actions, .course-grid { grid-template-columns: 1fr; }
    .stage-tabs { margin-inline: -1rem; padding-inline: 1rem; }
    .course-card { min-height: 0; }
    .topic-explorer { margin-inline: -0.25rem; }
    .all-topics { align-self: stretch; padding: 0.65rem 0.8rem; border: 1px solid var(--border); border-radius: 9px; text-align: center; }
  }
</style>
