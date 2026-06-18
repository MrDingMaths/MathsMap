<script>
  import { href } from '../lib/router.svelte.js';
  import { courseById } from '../lib/data.js';
  import MasteryControl from './MasteryControl.svelte';
  import Math from './Math.svelte';

  let { skill, courseId = null } = $props();
</script>

<a class="card" href={href(`/skill/${skill.id}${courseId ? `?course=${courseId}` : ''}`)}>
  <h3><Math text={skill.title} /></h3>
  {#if skill.blurb}<div class="blurb"><Math text={skill.blurb} /></div>{/if}
  <div style="margin-top:0.5rem">
    {#each skill.courses as c}
      <span class="tag" style="border-left:3px solid {courseById.get(c)?.color}">{courseById.get(c)?.title ?? c}</span>
    {/each}
  </div>
  <MasteryControl skillId={skill.id} />
</a>
