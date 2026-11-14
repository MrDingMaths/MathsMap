<script>
  import { untrack } from 'svelte';
  import { courses, coursesByStage, topicsForCourse, skillById, primaryTopicForSkill } from '../lib/data.js';
  import { topicStats, allProgress, subscribe, MASTERY } from '../lib/store.js';
  import { route, href, go } from '../lib/router.svelte.js';
  import TopicCard from '../components/TopicCard.svelte';
  import MasteryRing from '../components/MasteryRing.svelte';
  import Math from '../components/Math.svelte';

  const orderedCourses = [...courses].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const groupedCourses = coursesByStage();
  const stages = [...groupedCourses.keys()];
  const YEARS = { 3: 'Years 5–6', 4: 'Years 7–8', 5: 'Years 9–10', 6: 'Years 11–12' };

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

  // Most recent skill still in progress, for the "pick up where you left off" line.
  let resume = $derived.by(() => {
    tick;
    const latest = Object.entries(allProgress())
      .map(([id, record]) => ({ skill: skillById.get(id), ...record }))
      .filter((item) => item.skill && (item.level === 'learning' || item.level === 'proficient'))
      .sort((a, b) => b.at - a.at)[0];
    return latest ? { ...latest, topic: primaryTopicForSkill(latest.skill.id) } : null;
  });

  let courseSummary = $derived.by(() => {
    tick;
    if (!selectedCourse) return null;
    let ready = 0;
    for (const topic of selectedTopics) {
      const stats = topicStats(topic.id, selectedCourse.id);
      if (stats.total && stats.mastered + stats.proficient === stats.total) ready++;
    }
    return { topics: selectedTopics.length, ready };
  });

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

  let strandGroups = $derived.by(() => {
    const groups = new Map();
    for (const topic of selectedTopics) {
      const strand = topic.strand || 'Other';
      if (!groups.has(strand)) groups.set(strand, []);
      groups.get(strand).push(topic);
    }
    return [...groups].map(([name, topics]) => ({ name, topics }));
  });
</script>

<div class="container browse-page">
  <section class="intro" aria-labelledby="hero-title">
    <div class="intro-copy">
      <h1 id="hero-title">Your Maths Skill Tree</h1>
      <p class="lede">See how every NSW maths skill connects. Take a quick multiple choice quiz to start building your own skill tree!</p>
      <div class="intro-actions">
        <a class="mm-btn primary big" href={href('/quiz')}>Take the quiz</a>
        <a class="mm-btn big" href={href('/map')}>Explore the skill map</a>
      </div>
    </div>
    <!-- A small slice of the real map: what one skill builds on and leads to. -->
    <svg class="intro-graph" viewBox="0 0 470 270" role="img" aria-label="Compare and order integers builds on Locate integers on a number line and Additive relations, and leads to Add and subtract positive integers and Rewrite touching signs">
      <g class="links">
        <path class="before" d="M 132 62 H 150 V 135 H 170" />
        <path class="before" d="M 132 208 H 150 V 135 H 170" />
        <path class="after" d="M 312 135 H 330 V 62 H 346" />
        <path class="after" d="M 312 135 H 330 V 208 H 346" />
        <path class="head-before" d="M 164 131 L 171 135 L 164 139 Z" />
        <path class="head-after" d="M 340 58 L 347 62 L 340 66 Z" />
        <path class="head-after" d="M 340 204 L 347 208 L 340 212 Z" />
      </g>
      <g class="card done"><rect x="4" y="34" width="128" height="56" rx="9" /><circle cx="114" cy="50" r="6" /><path class="tick" d="M 111 50 l 2 2 l 4 -4" /><text x="14" y="58">Locate integers</text><text x="14" y="74">on a number line</text></g>
      <g class="card done"><rect x="4" y="180" width="128" height="56" rx="9" /><circle cx="114" cy="196" r="6" /><path class="tick" d="M 111 196 l 2 2 l 4 -4" /><text x="14" y="204">Additive</text><text x="14" y="220">relations</text></g>
      <g class="card focus"><rect x="170" y="98" width="142" height="74" rx="10" /><circle class="track" cx="292" cy="116" r="7" /><path class="arc" d="M 292 109 A 7 7 0 0 1 298.06 119.5" /><text class="kicker" x="182" y="120">Skill</text><text x="182" y="140">Compare and</text><text x="182" y="157">order integers</text></g>
      <g class="card next"><rect x="346" y="34" width="120" height="56" rx="9" /><text x="356" y="58">Add and subtract</text><text x="356" y="74">positive integers</text></g>
      <g class="card next"><rect x="346" y="180" width="120" height="56" rx="9" /><text x="356" y="204">Rewrite touching</text><text x="356" y="220">signs</text></g>
    </svg>
  </section>

  {#if resume}
    <a class="resume" href={href(`/skill/${resume.skill.id}`)}>
      <span class="rail-label">Pick up where you left off</span>
      <MasteryRing level={resume.level} size={18} />
      <strong><Math text={resume.skill.title} /></strong>
      <span class="resume-meta">{#if resume.topic}<Math text={resume.topic.title} /> · {/if}{MASTERY[resume.level].label}</span>
      <span class="resume-go">Keep going <span aria-hidden="true">&rarr;</span></span>
    </a>
  {/if}

  <section class="browse" aria-labelledby="browse-title">
    <p class="choose-label" id="stage-label">Choose your stage</p>
    <div class="stage-switch" role="tablist" aria-labelledby="stage-label">
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
        >
          <strong>Stage {stage}</strong>
          {#if YEARS[stage]}<span>{YEARS[stage]}</span>{/if}
        </button>
      {/each}
    </div>

    <div class="browse-head">
      <h2 id="browse-title">{`Stage ${selectedStage}${YEARS[selectedStage] ? ` · ${YEARS[selectedStage]}` : ''}`}</h2>
      {#if courseSummary}<p class="muted">{courseSummary.topics} topics · {courseSummary.ready} proficient or better</p>{/if}
    </div>

    {#if stageCourses.length > 1}
      <div class="course-switch" aria-label="Course">
        {#each stageCourses as course (course.id)}
          <button type="button" class:active={selectedCourse?.id === course.id} aria-pressed={selectedCourse?.id === course.id} onclick={() => chooseCourse(course)}>{course.title}</button>
        {/each}
      </div>
    {/if}

    {#if selectedCourse}
      <div class="strand-columns">
        {#each strandGroups as group}
          <div class="strand-column">
            <h3>{group.name}</h3>
            <ul class="row-list">
              {#each group.topics as topic}<li><TopicCard {topic} courseId={selectedCourse.id} variant="row" /></li>{/each}
            </ul>
          </div>
        {/each}
      </div>
      <a class="full-course" href={href(`/course/${selectedCourse.id}`)}>See the full course: {selectedCourse.title} <span aria-hidden="true">&rarr;</span></a>
    {/if}
  </section>
</div>

<style>
  .browse-page { display: flex; flex-direction: column; gap: 2.5rem; max-width: 1180px; }
  .intro { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 470px); align-items: center; gap: 2.5rem; padding: clamp(1.5rem, 5vw, 3.5rem) 0 0.5rem; }
  .intro-copy { min-width: 0; }
  h1 { max-width: 640px; margin: 0 0 1rem; font-size: clamp(2.4rem, 6vw, 4rem); line-height: 1.04; text-wrap: balance; }
  .intro-graph { width: 100%; height: auto; overflow: visible; font-family: var(--font-body); }
  .intro-graph .links path { fill: none; stroke-width: 1.6; }
  .intro-graph .before { stroke: var(--muted); }
  .intro-graph .after { stroke: var(--accent); }
  .intro-graph .head-before { fill: var(--muted); stroke: none; }
  .intro-graph .head-after { fill: var(--accent); stroke: none; }
  .intro-graph .card rect { fill: var(--panel); stroke: var(--border-strong); stroke-width: 1; }
  .intro-graph .card text { fill: var(--text); font-size: 12px; font-weight: 700; }
  .intro-graph .card.done circle { fill: none; stroke: var(--status-mastered-fill); stroke-width: 1.8; }
  .intro-graph .card .tick { fill: none; stroke: var(--status-mastered-fill); stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
  .intro-graph .card.focus rect { stroke: var(--accent); stroke-width: 2; }
  .intro-graph .card.focus text { font-size: 14px; font-weight: 800; }
  .intro-graph .card.focus .kicker { fill: var(--muted); font-size: 12px; font-weight: 700; }
  .intro-graph .card.focus .track { fill: none; stroke: color-mix(in srgb, var(--status-none) 32%, transparent); stroke-width: 2.2; }
  .intro-graph .card.focus .arc { fill: none; stroke: var(--status-learning-fill); stroke-width: 2.2; stroke-linecap: round; }
  .intro-graph .card.next rect { stroke-dasharray: 4 3; }
  .intro-graph .card.next text { fill: var(--muted); }
  .lede { max-width: 560px; margin: 0; color: var(--muted); font-size: 1.12rem; line-height: 1.6; }
  .intro-actions { display: flex; flex-wrap: wrap; gap: 0.7rem; margin-top: 1.6rem; }
  .mm-btn.big { min-height: 48px; padding: 0.7rem 1.3rem; font-size: 1rem; }

  .resume { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem 0.9rem; padding: 1rem 0; border-block: 1px solid var(--border); color: var(--text); }
  .resume:hover { text-decoration: none; }
  .resume .rail-label { margin: 0 0.6rem 0 0; }
  .resume strong { font-weight: 800; }
  .resume-meta { color: var(--muted); font-size: 0.88rem; }
  .resume-go { margin-left: auto; color: var(--text); font-weight: 800; font-size: 0.92rem; text-decoration: underline; text-decoration-color: var(--accent); text-decoration-thickness: 2px; text-underline-offset: 4px; }

  .choose-label { margin: 0 0 0.6rem; color: var(--muted); font: 800 0.8rem var(--font-body); letter-spacing: 0.08em; text-transform: uppercase; }
  /* Stage switch: four large tabs, the chosen one filled with the accent. */
  .stage-switch { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.6rem; max-width: 760px; }
  .stage-switch button { display: flex; flex-direction: column; align-items: flex-start; gap: 0.1rem; min-height: 64px; padding: 0.7rem 1rem; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--panel); color: var(--text); font-family: var(--font-body); text-align: left; cursor: pointer; transition: border-color var(--motion-fast), background var(--motion-fast); }
  .stage-switch button strong { font-size: 1.1rem; font-weight: 800; }
  .stage-switch button span { color: var(--muted); font-size: 0.85rem; font-weight: 600; }
  .stage-switch button:hover { border-color: var(--border-strong); }
  .stage-switch button.active { border-color: var(--primary); background: var(--primary); color: var(--on-primary); }
  .stage-switch button.active span { color: var(--on-primary); opacity: 0.9; }
  .browse-head { margin-top: 2rem; }
  .browse-head h2 { margin: 0 0 0.3rem; font-size: clamp(1.7rem, 3.5vw, 2.3rem); }
  .browse-head p { margin: 0; font-size: 0.92rem; }
  .course-switch { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 1.2rem; }
  .course-switch button { padding: 0.4rem 0.85rem; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--panel); color: var(--muted); font: 700 0.875rem var(--font-body); cursor: pointer; }
  .course-switch button:hover { color: var(--text); border-color: var(--border-strong); }
  .course-switch button.active { border-color: var(--text); color: var(--text); }

  .strand-columns { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem 3rem; margin-top: 1.8rem; }
  .strand-column h3 { margin: 0; padding-bottom: 0.55rem; border-bottom: 2px solid var(--border-strong); color: var(--text); font-size: 0.95rem; font-weight: 800; letter-spacing: 0; }
  .strand-column .row-list { border-top: 0; }
  .full-course { display: inline-block; margin-top: 1.6rem; font-weight: 700; font-size: 0.875rem; text-decoration: underline; text-decoration-color: var(--accent); text-decoration-thickness: 2px; text-underline-offset: 4px; }

  @media (max-width: 900px) {
    .intro { grid-template-columns: minmax(0, 1fr); }
    .intro-graph { max-width: 470px; }
  }
  @media (max-width: 640px) {
    .stage-switch { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .resume-go { margin-left: 0; }
  }
</style>
