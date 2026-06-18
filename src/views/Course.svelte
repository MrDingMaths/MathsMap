<script>
  import { courseById, topicsForCourse } from '../lib/data.js';
  import { href } from '../lib/router.svelte.js';
  import Math from '../components/Math.svelte';

  let { id } = $props();
  let course = $derived(courseById.get(id));

  function topicsByStrand(courseId) {
    const map = new Map();
    for (const t of topicsForCourse(courseId)) {
      const s = t.strand || 'Other';
      if (!map.has(s)) map.set(s, []);
      map.get(s).push(t);
    }
    return map;
  }

  let groups = $derived(course ? topicsByStrand(id) : new Map());
</script>

<div class="container">
  {#if course}
    <div class="crumbs"><a href={href('/')}>Home</a> / {course.title}</div>
    <h1 style="border-left:5px solid {course.color}; padding-left:0.6rem">{course.title}</h1>
    {#each [...groups] as [strand, topics]}
      <div class="strand-label">{strand}</div>
      <div class="grid">
        {#each topics as t}
          <a class="card" href={href(`/topic/${t.id}?course=${id}`)} style="border-left-color:{t.color}">
            <h3><Math text={t.title} /></h3>
          </a>
        {/each}
      </div>
    {/each}
    {#if [...groups].length === 0}<p class="muted">No topics authored for this course yet.</p>{/if}
  {:else}
    <p class="muted">Unknown course.</p>
  {/if}
</div>
