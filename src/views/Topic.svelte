<script>
  import { topicById, courseById, skillsForTopic } from '../lib/data.js';
  import { href } from '../lib/router.svelte.js';
  import SkillCard from '../components/SkillCard.svelte';

  let { id, courseId = null } = $props();
  let topic = $derived(topicById.get(id));
  let course = $derived(courseId ? courseById.get(courseId) : null);
  let groups = $derived(skillsForTopic(id, courseId));
</script>

<div class="container">
  {#if topic}
    <div class="crumbs">
      <a href={href('/')}>Home</a>
      {#if course} / <a href={href(`/course/${course.id}`)}>{course.title}</a>{/if}
      / {topic.title}
    </div>
    <h1 style="border-left:5px solid {topic.color}; padding-left:0.6rem">{topic.title}</h1>

    {#each groups as group}
      <div class="section-label">{group.dotpoint.code} — {group.dotpoint.text}</div>
      <div class="grid">
        {#each group.skills as skill}<SkillCard {skill} {courseId} />{/each}
        {#if group.skills.length === 0}<p class="muted">No skills under this dot point yet.</p>{/if}
      </div>
    {/each}
  {:else}
    <p class="muted">Unknown topic.</p>
  {/if}
</div>
