<script>
  import { onMount } from 'svelte';
  import PracticeStudio from '../components/PracticeStudio.svelte';
  import { loadPracticeBank } from '../lib/practice-question-storage.js';

  let { initialDifficulty = 'all', initialStage = 'builder', initialOutput = null, projectId = null } = $props();
  let bank = $state([]);
  let loading = $state(true);
  let error = $state('');

  onMount(async () => {
    try { bank = (await loadPracticeBank()).records; }
    catch (e) { error = 'The private question bank is empty or the authoring server is not running. Start the dev server to open projects and source reconstructions.'; console.warn(e); }
    finally { loading = false; }
  });
</script>

{#if loading}<p role="status">Loading question bank…</p>{/if}
<PracticeStudio initialBank={bank} {initialDifficulty} initialError={error} {initialStage} {initialOutput} initialProjectId={projectId} />

<style>
  p { margin:0; padding:.5rem 1rem; color:var(--muted); background:var(--app-canvas); }
</style>
