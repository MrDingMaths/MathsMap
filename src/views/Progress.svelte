<script>
  import { courses, skills, topicsForCourse, skillsForTopic } from '../lib/data.js';
  import { getMastery, subscribe, resetProgress } from '../lib/store.js';
  import { href } from '../lib/router.svelte.js';

  let tick = $state(0);
  $effect(() => subscribe(() => tick++));

  const pct = (list) => {
    if (!list.length) return 0;
    const m = list.filter((s) => getMastery(s.id) === 'mastered').length;
    return Math.round((m / list.length) * 100);
  };

  let summary = $derived.by(() => {
    tick; // re-run on progress change
    return courses.map((c) => {
      const courseSkills = skills.filter((s) => (s.courses || []).includes(c.id));
      const topics = topicsForCourse(c.id).map((t) => {
        const ts = skillsForTopic(t.id, c.id).flatMap((g) => g.skills);
        return { topic: t, pct: pct(ts), count: ts.length };
      });
      return { course: c, pct: pct(courseSkills), count: courseSkills.length, topics };
    }).filter((row) => row.count > 0);
  });
</script>

<div class="container">
  <div class="row" style="justify-content:space-between">
    <h1>Your Progress</h1>
    <button onclick={resetProgress} style="background:var(--panel);color:var(--muted);border:1px solid var(--border);border-radius:6px;padding:0.35rem 0.7rem;cursor:pointer">Reset</button>
  </div>

  {#each summary as row}
    <div class="section-label" style="border-left:4px solid {row.course.color};padding-left:0.5rem">
      <a href={href(`/course/${row.course.id}`)}>{row.course.title}</a> — {row.pct}% mastered ({row.count} skills)
    </div>
    {#each row.topics as t}
      <div style="margin:0.35rem 0">
        <div class="row" style="justify-content:space-between;font-size:0.85rem">
          <a href={href(`/topic/${t.topic.id}?course=${row.course.id}`)}>{t.topic.title}</a>
          <span class="muted">{t.pct}%</span>
        </div>
        <div class="bar"><span style="width:{t.pct}%"></span></div>
      </div>
    {/each}
  {/each}
</div>
