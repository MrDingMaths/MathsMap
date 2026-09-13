<script>
  import { untrack } from 'svelte';
  import { courses, coursesByStage, topicsForCourse } from '../lib/data.js';
  import { topicStats, subscribe } from '../lib/store.js';
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
    if (stages.includes(requested)) return requested;
    return stages.includes(4) ? 4 : stages[0];
  });
  let stageCourses = $derived(groupedCourses.get(selectedStage) ?? []);
  let selectedCourse = $derived.by(() => {
    const requested = route.query.course;
    return stageCourses.find((course) => course.id === requested) ?? stageCourses[0] ?? orderedCourses[0];
  });
  let selectedTopics = $derived(selectedCourse ? topicsForCourse(selectedCourse.id) : []);

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
  <section class="home-hero" aria-labelledby="hero-title">
    <div class="hero-copy">
      <h1 id="hero-title">Build your maths skill tree</h1>
      <p class="lede">Discover what you know and what to learn next with a diagnostic quiz.</p>
    </div>
    <div class="hero-actions">
      <a class="hero-cta quiz-cta" href={href('/quiz')}>
        <span>Take a diagnostic quiz</span>
        <span class="cta-arrow" aria-hidden="true">&rarr;</span>
      </a>
      <a class="hero-cta map-cta" href={href('/map')}><span>Explore the skill map</span><span class="cta-arrow" aria-hidden="true">&rarr;</span></a>
    </div>
  </section>

  <section class="dashboard" aria-labelledby="browse-title">
    <div class="dashboard-head">
      <div>
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
              <span class="course-mark" aria-hidden="true">S{course.stage}</span>
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
          <h2 id="topic-explorer-title">Explore {selectedCourse.title}</h2>
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
  .home-hero { position: relative; overflow: hidden; display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 310px); gap: clamp(2rem, 5vw, 4rem); align-items: center; padding: clamp(1.5rem, 4vw, 3rem); border: 1px solid var(--border-strong); border-radius: var(--radius-xl); background: radial-gradient(100% 180% at 100% 0%, color-mix(in srgb, var(--accent) 13%, var(--panel)) 0%, var(--surface-warm) 65%, var(--panel) 100%); box-shadow: var(--shadow-rest); animation: route-enter var(--motion-base) var(--ease-out) both; }
  .hero-copy, .hero-actions { position: relative; z-index: 1; }
  h1 { max-width: 580px; margin: 0 0 0.85rem; font-size: clamp(2rem, 4.5vw, 3rem); line-height: 1.12; text-wrap: balance; }
  .lede { max-width: 440px; margin: 0; color: var(--muted); font-size: 0.95rem; line-height: 1.65; }
  .hero-actions { display: flex; flex-direction: column; align-items: stretch; gap: 0.8rem; }
  .hero-cta { display: flex; justify-content: space-between; align-items: center; gap: 1rem; min-height: 60px; padding: 0.9rem 1.2rem; border: 1px solid transparent; border-radius: var(--radius-md); background: var(--accent); color: #fff; font-size: 0.9rem; font-weight: 750; box-shadow: var(--shadow-rest); transition: transform var(--motion-fast) var(--ease-snap), box-shadow var(--motion-fast); }
  .hero-cta:hover { transform: translateY(-2px); box-shadow: var(--shadow); text-decoration: none; }
  .hero-cta:active { transform: scale(0.98); }
  .map-cta { background: var(--panel); color: var(--text); border-color: var(--border-strong); }
  .cta-arrow { font-size: 1.35rem; line-height: 1; }
  .hero-cta:focus-visible { outline: 3px solid var(--accent); outline-offset: 4px; }

  .dashboard { display: flex; flex-direction: column; gap: 1rem; }
  .dashboard-head { display: flex; align-items: end; justify-content: space-between; gap: 1rem; }
  .dashboard-head h2 { margin: 0; font-size: 1.5rem; }
  .dashboard-hint { max-width: 340px; color: var(--muted); font-size: 0.76rem; text-align: right; }
  .stage-tabs { display: flex; gap: 0.45rem; overflow-x: auto; padding: 0.15rem 0.15rem 0.45rem; scrollbar-width: thin; }
  .stage-tabs button { position: relative; flex: none; min-width: 92px; min-height: 42px; padding: 0.55rem 1rem; border: 1px solid var(--border); border-radius: 999px; background: var(--panel); color: var(--muted); font: 700 0.82rem var(--font-body); cursor: pointer; transition: transform var(--motion-fast) var(--ease-snap), color var(--motion-fast), border-color var(--motion-fast), background var(--motion-fast); }
  .stage-tabs button:hover { color: var(--text); border-color: var(--border-strong); background: var(--panel-2); transform: translateY(-1px); }
  .stage-tabs button:active { transform: scale(0.96); }
  .stage-tabs button.active { color: #fff; border-color: transparent; background: var(--accent); animation: selection-pop var(--motion-base) var(--ease-snap); }

  .course-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.85rem; }
  .course-card { position: relative; display: flex; flex-direction: column; min-height: 260px; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--panel); box-shadow: var(--shadow-rest); animation: card-enter var(--motion-base) var(--ease-out) calc(var(--enter-index) * 45ms) both; transition: transform var(--motion-fast) var(--ease-snap), border-color var(--motion-fast), background var(--motion-fast), box-shadow var(--motion-fast); }
  .course-card:hover { transform: translateY(-3px); border-color: var(--border-strong); box-shadow: var(--shadow); }
  .course-card.selected { border-color: var(--course-color); background: color-mix(in srgb, var(--course-color) 9%, var(--surface-soft)); box-shadow: 0 0 0 1px var(--course-color), var(--shadow); }
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
  .all-topics { flex: none; font-size: 0.78rem; font-weight: 750; }
  .strand-group { margin-top: 1.25rem; animation: card-enter var(--motion-base) var(--ease-out) calc(var(--enter-index) * 45ms) both; }
  .strand-heading { display: flex; align-items: center; gap: 0.55rem; margin-bottom: 0.65rem; }
  .strand-heading h3 { margin: 0; font: 750 0.78rem var(--font-body); text-transform: uppercase; letter-spacing: 0.05em; }
  .strand-heading > span:last-child { margin-left: auto; color: var(--muted); font-size: 0.68rem; }
  .strand-icon { display: grid; place-items: center; width: 1.6rem; height: 1.6rem; border: 1px solid var(--border-strong); border-radius: 7px; color: var(--muted); font-size: 0.68rem; font-weight: 750; }
  .topic-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(225px, 1fr)); gap: 0.7rem; }

  @media (max-width: 820px) {
    .home-hero { grid-template-columns: 1fr; gap: 1.25rem; }
    .hero-actions { width: min(100%, 310px); }
    
  }
  @media (max-width: 640px) {
    .dashboard-head, .topic-explorer > header { align-items: flex-start; flex-direction: column; }
    .dashboard-hint { text-align: left; }
    .course-grid { grid-template-columns: 1fr; }
    .hero-actions { width: 100%; }
    
    .stage-tabs { margin-inline: -1rem; padding-inline: 1rem; }
    .course-card { min-height: 0; }
    .topic-explorer { margin-inline: -0.25rem; }
    .all-topics { align-self: stretch; padding: 0.65rem 0.8rem; border: 1px solid var(--border); border-radius: 9px; text-align: center; }
  }
</style>
