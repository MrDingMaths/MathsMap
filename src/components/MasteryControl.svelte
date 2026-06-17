<script>
  import { getMastery, setMastery, subscribe, LEVELS } from '../lib/store.js';

  let { skillId } = $props();
  let current = $state('none');

  // Sync with the store on mount and whenever progress changes anywhere.
  $effect(() => subscribe(() => { current = getMastery(skillId); }));

  const labels = { none: '—', learning: 'Learning', proficient: 'Proficient', mastered: 'Mastered' };
</script>

<div class="mastery" role="group" aria-label="Mastery level">
  {#each LEVELS as level}
    <button
      class="m-{level} {current === level ? 'on' : ''}"
      onclick={(e) => { e.preventDefault(); e.stopPropagation(); setMastery(skillId, level); }}
      title={labels[level]}
    >{labels[level]}</button>
  {/each}
</div>
