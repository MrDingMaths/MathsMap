<script>
  import { href } from '../lib/router.svelte.js';
  import { courseById, primaryTopicForSkill, strandForSkill } from '../lib/data.js';
  import Math from './Math.svelte';

  let { skill, courseId = null } = $props();

  let topic = $derived(primaryTopicForSkill(skill.id));
  let strand = $derived(strandForSkill(skill.id));
  let color = $derived(topic?.color ?? 'var(--accent)');
</script>

<a class="card skill" href={href(`/skill/${skill.id}${courseId ? `?course=${courseId}` : ''}`)}>
  <div class="reason" style="color:{color}">
    <span class="dot" style="background:{color}"></span>
    {strand}
  </div>
  <h3><Math text={skill.title} /></h3>
  {#if skill.blurb}<p class="blurb"><Math text={skill.blurb} /></p>{/if}
  <div class="foot">
    <div class="tags">
      {#each skill.courses as c}
        <span class="tag">{courseById.get(c)?.title ?? c}</span>
      {/each}
    </div>
    <span class="arrow" style="color:{color}">→</span>
  </div>
</a>

<style>
  .skill { display: flex; flex-direction: column; min-height: 170px; }
  .reason {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.66rem;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 0.6rem;
  }
  .reason .dot { width: 7px; height: 7px; border-radius: 50%; flex: none; }
  h3 { font-size: 1rem; margin: 0 0 0.4rem; }
  .blurb { color: var(--muted); font-size: 0.82rem; margin: 0 0 0.9rem; }
  .foot { margin-top: auto; display: flex; align-items: flex-end; justify-content: space-between; gap: 0.5rem; }
  .tags { display: flex; gap: 0.3rem; flex-wrap: wrap; }
  .tag { margin: 0; }
  .arrow { font-size: 1.1rem; flex: none; }
</style>
