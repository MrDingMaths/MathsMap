<script>
  import { courseById, topicsForCourse } from '../lib/data.js';
  import { href } from '../lib/router.svelte.js';
  import Math from '../components/Math.svelte';

  let { id } = $props();
  let course = $derived(courseById.get(id));
  let topics = $derived(topicsForCourse(id));
</script>

<div class="container">
  {#if course}
    <div class="crumbs"><a href={href('/')}>Home</a> / {course.title}</div>
    <h1 style="border-left:5px solid {course.color}; padding-left:0.6rem">{course.title}</h1>
    <div class="grid">
      {#each topics as t}
        <a class="card" href={href(`/topic/${t.id}?course=${id}`)} style="border-left-color:{t.color}">
          <h3><Math text={t.title} /></h3>
          <div class="blurb"><Math text={t.blurb} /></div>
          <span class="tag">{t.strand}</span>
        </a>
      {/each}
      {#if topics.length === 0}<p class="muted">No topics authored for this course yet.</p>{/if}
    </div>
  {:else}
    <p class="muted">Unknown course.</p>
  {/if}
</div>
