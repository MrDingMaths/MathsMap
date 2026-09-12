<script>
  import PracticeStudio from '../components/PracticeStudio.svelte';
  import { loadPracticeBank } from '../lib/practice-question-storage.js';

  let { initialDifficulty = 'all', initialStage = 'builder', initialOutput = null, projectId = null } = $props();
  let bank = $state([]);
  let loading = $state(false),loaded=false,pending;
  let error = $state('');

  function requestBank(){
    if(loaded)return Promise.resolve();if(pending)return pending;
    loading=true;error='';
    pending=(async()=>{try{bank=(await loadPracticeBank()).records;loaded=true;}
      catch(e){error='Could not load the question bank. Open the bank or insertion controls to retry.';console.warn(e);}
      finally{loading=false;pending=null;}})();return pending;
  }
</script>

{#if loading}<p role="status">Loading question bank…</p>{/if}
<PracticeStudio onrequestbank={requestBank} initialBank={bank} {initialDifficulty} initialError={error} {initialStage} {initialOutput} initialProjectId={projectId} />

<style>
  p { margin:0; padding:.5rem 1rem; color:var(--muted); background:var(--app-canvas); }
</style>
