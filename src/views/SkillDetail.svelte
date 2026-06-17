<script>
  import { skillById, dependentsOf, courseById, dotpointById, topicById } from '../lib/data.js';
  import { href } from '../lib/router.svelte.js';
  import { lockedSkills } from '../lib/recommender.js';
  import { subscribe } from '../lib/store.js';
  import MasteryControl from '../components/MasteryControl.svelte';

  let { id, courseId = null } = $props();
  let skill = $derived(skillById.get(id));

  const link = (s) => href(`/skill/${s.id}${courseId ? `?course=${courseId}` : ''}`);

  let locked = $state([]);
  $effect(() => subscribe(() => { locked = skill ? lockedSkills(skill) : []; }));
</script>

<div class="container">
  {#if skill}
    <div class="crumbs"><a href={href('/')}>Home</a> / Skill</div>
    <h1>{skill.title}</h1>
    {#if skill.blurb}<p class="muted">{skill.blurb}</p>{/if}

    <div class="row">
      {#each skill.courses as c}<span class="tag" style="border-left:3px solid {courseById.get(c)?.color}">{courseById.get(c)?.title}</span>{/each}
      <span class="tag">Stage {skill.stage}</span>
      <span class="tag">Difficulty {skill.difficulty}</span>
    </div>

    <MasteryControl skillId={skill.id} />

    <div class="section-label">Syllabus dot points</div>
    <ul>
      {#each skill.dotPointIds as dp}
        {@const d = dotpointById.get(dp)}
        {#if d}<li><strong>{d.code}</strong> — {d.text} <span class="muted">({topicById.get(d.topicId)?.title})</span></li>{/if}
      {/each}
    </ul>

    <div class="section-label">Prerequisites {#if locked.length}<span class="muted">— {locked.length} not yet mastered</span>{/if}</div>
    {#if skill.prereqs.length}
      <ul>
        {#each skill.prereqs as p}
          {@const pre = skillById.get(p)}
          <li><a href={link(pre)}>{pre?.title ?? p}</a>{#if locked.includes(p)} <span class="muted">🔒</span>{/if}</li>
        {/each}
      </ul>
    {:else}
      <p class="muted">None — a good entry point.</p>
    {/if}

    <div class="section-label">Unlocks</div>
    {#if dependentsOf.get(skill.id)?.length}
      <ul>
        {#each dependentsOf.get(skill.id) as d}
          {@const dep = skillById.get(d)}
          <li><a href={link(dep)}>{dep?.title ?? d}</a></li>
        {/each}
      </ul>
    {:else}
      <p class="muted">Nothing yet depends on this skill.</p>
    {/if}

    <div class="section-label">Practice</div>
    <p class="muted">Generated questions (Foundation / Development / Mastery) will appear here in Phase 4.</p>
  {:else}
    <p class="muted">Unknown skill.</p>
  {/if}
</div>
