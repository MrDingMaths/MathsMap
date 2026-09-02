<script>
  import { onMount } from 'svelte';
  import PracticeStudio from '../components/PracticeStudio.svelte';
  import { loadPracticeBank } from '../lib/practice-question-storage.js';

  let { initialDifficulty = 'all', initialStage = 'builder', initialOutput = null } = $props();
  let bank = $state([]);
  let loading = $state(true);
  let error = $state('');

  onMount(async () => {
    try { bank = (await loadPracticeBank()).records; }
    catch (e) { error = 'The private question bank is empty or the authoring server is not running. You can still prepare an import once the dev server is available.'; console.warn(e); }
    finally { loading = false; }
  });
</script>

{#if loading}<main class="booklet-loading"><p>Loading Practice Question Studio...</p></main>
{:else}<PracticeStudio initialBank={bank} {initialDifficulty} initialError={error} {initialStage} {initialOutput} />{/if}

<style>
  .booklet-loading { min-height: calc(100dvh - 72px); display: grid; place-items: center; color: var(--muted); background: var(--app-canvas); font-family: var(--font-body); }
</style>
