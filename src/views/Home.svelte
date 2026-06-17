<script>
  import { coursesByStage, searchSkills } from '../lib/data.js';
  import { nextSkills } from '../lib/recommender.js';
  import { subscribe } from '../lib/store.js';
  import { href } from '../lib/router.svelte.js';
  import SkillCard from '../components/SkillCard.svelte';

  const stages = coursesByStage();
  const stageLabel = { 3: 'Stage 3', 4: 'Stage 4', 5: 'Stage 5', 6: 'Stage 6' };

  let query = $state('');
  let results = $derived(searchSkills(query));

  let recommended = $state(nextSkills({ limit: 6 }));
  $effect(() => subscribe(() => { recommended = nextSkills({ limit: 6 }); }));
</script>

<div class="container">
  <h1>MathsMap</h1>
  <p class="muted">A clearer map of NSW maths, Stage 3 to Stage 6 — see what you know, and what to learn next.</p>

  <input class="search" placeholder="Search skills…" bind:value={query} />
  {#if query}
    <div class="grid" style="margin-top:0.8rem">
      {#each results as skill}<SkillCard {skill} />{/each}
      {#if results.length === 0}<p class="muted">No skills match “{query}”.</p>{/if}
    </div>
  {:else}
    <div class="section-label">Recommended next</div>
    {#if recommended.length}
      <div class="grid">{#each recommended as skill}<SkillCard {skill} />{/each}</div>
    {:else}
      <p class="muted">Mark some skills as mastered to unlock recommendations.</p>
    {/if}

    {#each [...stages] as [stage, courses]}
      <div class="section-label">{stageLabel[stage] ?? `Stage ${stage}`}</div>
      <div class="grid">
        {#each courses as c}
          <a class="card" href={href(`/course/${c.id}`)} style="border-left-color:{c.color}">
            <h3>{c.title}</h3>
            <div class="blurb">{c.stream}</div>
          </a>
        {/each}
      </div>
    {/each}
  {/if}
</div>
