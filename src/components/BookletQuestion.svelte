<script>
  import PracticeQuestionRenderer from './PracticeQuestionRenderer.svelte';

  // Keep this file as the stable component name for any older callers while the
  // Booklet Studio renderer owns the v2 question/answer-key contract.
  let props = $props();
</script>

<PracticeQuestionRenderer {...props} />
