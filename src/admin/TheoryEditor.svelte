<script>
  import TheoryView from '../components/TheoryView.svelte';
  import { buildTheoryDraft, createTheoryEditorDraft, moveWorkedExample, workedExampleProblems } from '../lib/theory-content.js';

  let { theory = null, onSave } = $props();

  // Local draft, deep-cloned so edits don't mutate the live content until saved.
  let intro = $state('');
  let facts = $state([]);
  let steps = $state([]);
  let workedExamples = $state([]);

  // Re-seed the draft whenever the source theory changes (e.g. navigating skills).
  $effect(() => {
    const draft = createTheoryEditorDraft(theory);
    intro = draft.intro;
    facts = draft.facts;
    steps = draft.steps;
    workedExamples = draft.workedExamples;
  });

  let saving = $state(false);
  let error = $state('');

  function build() {
    return buildTheoryDraft(theory, { intro, facts, steps, workedExamples });
  }

  async function save() {
    const problems = workedExampleProblems(build());
    if (problems.length) {
      error = 'Complete each worked example question and solution, or remove the example.';
      return;
    }
    saving = true;
    error = '';
    try {
      await onSave(build());
    } catch (e) {
      error = String(e.message ?? e);
    } finally {
      saving = false;
    }
  }
</script>

<div class="editor">
  <div class="ed-head">
    <span>Edit theory</span>
    <button class="save-btn" onclick={save} disabled={saving}>
      {saving ? 'Saving…' : 'Save'}
    </button>
  </div>
  {#if error}<p class="ed-error">{error}</p>{/if}

  <div class="ed-grid">
    <!-- fields -->
    <div class="ed-fields">
      <label class="fld">
        <span>Intro</span>
        <textarea bind:value={intro} rows="2"></textarea>
      </label>

      <div class="list-block">
        <div class="list-head">
          <span>Facts</span>
          <button class="mini" onclick={() => (facts = [...facts, ''])}>+ add</button>
        </div>
        {#each facts as _, i}
          <div class="list-row">
            <textarea bind:value={facts[i]} rows="2"></textarea>
            <button class="mini del" onclick={() => (facts = facts.filter((_, j) => j !== i))} aria-label="Remove fact">✕</button>
          </div>
        {/each}
      </div>

      <div class="list-block">
        <div class="list-head">
          <span>Procedure steps</span>
          <button class="mini" onclick={() => (steps = [...steps, ''])}>+ add</button>
        </div>
        {#each steps as _, i}
          <div class="list-row">
            <textarea bind:value={steps[i]} rows="2"></textarea>
            <button class="mini del" onclick={() => (steps = steps.filter((_, j) => j !== i))} aria-label="Remove step">✕</button>
          </div>
        {/each}
      </div>
      <div class="list-block">
        <div class="list-head">
          <span>Worked examples</span>
          <button class="mini" onclick={() => (workedExamples = [...workedExamples, { question_text: '', solution_text: '' }])}>+ add example</button>
        </div>
        {#each workedExamples as example, i}
          <div class="example-fields">
            <div class="list-head">
              <span>Worked example {i + 1}</span>
              <div class="example-actions">
                <button class="mini" disabled={i === 0} onclick={() => (workedExamples = moveWorkedExample(workedExamples, i, i - 1))} aria-label={`Move worked example ${i + 1} up`}>↑</button>
                <button class="mini" disabled={i === workedExamples.length - 1} onclick={() => (workedExamples = moveWorkedExample(workedExamples, i, i + 1))} aria-label={`Move worked example ${i + 1} down`}>↓</button>
                <button class="mini del" onclick={() => (workedExamples = workedExamples.filter((_, j) => j !== i))} aria-label={`Remove worked example ${i + 1}`}>✕</button>
              </div>
            </div>
            <label class="fld">
              <span>Question</span>
              <textarea aria-label={`Worked example ${i + 1} question`} bind:value={example.question_text} rows="4"></textarea>
            </label>
            <label class="fld">
              <span>Solution</span>
              <textarea aria-label={`Worked example ${i + 1} solution`} bind:value={example.solution_text} rows="6"></textarea>
            </label>
          </div>
        {/each}
      </div>
    </div>

    <!-- live preview (mirrors SkillDetail theory markup) -->
    <div class="ed-preview">
      <div class="pv-label">Preview</div>
      <TheoryView theory={build()} />
    </div>
  </div>
</div>

<style>
  .editor {
    border: 1px solid var(--accent);
    border-radius: 14px;
    background: var(--panel);
    padding: 1rem 1.2rem;
  }
  .ed-head {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 0.8rem;
    font-size: 0.72rem; font-weight: 600; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--accent);
  }
  .ed-error { color: var(--m-learning, #d33); font-size: 0.85rem; margin: 0 0 0.6rem; }
  .ed-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem; }
  @media (max-width: 720px) { .ed-grid { grid-template-columns: 1fr; } }

  .ed-fields { display: flex; flex-direction: column; gap: 0.9rem; }
  .fld { display: flex; flex-direction: column; gap: 0.3rem; }
  .fld > span, .list-head > span {
    font-size: 0.72rem; font-weight: 600; letter-spacing: 0.06em;
    text-transform: uppercase; color: var(--muted);
  }
  textarea {
    width: 100%; box-sizing: border-box; resize: vertical;
    font-family: inherit; font-size: 0.9rem;
    padding: 0.45rem 0.6rem;
    border: 1px solid var(--border); border-radius: 8px;
    background: var(--panel-2); color: var(--text);
  }
  .list-block { display: flex; flex-direction: column; gap: 0.4rem; }
  .list-head { display: flex; align-items: center; justify-content: space-between; }
  .list-row { display: flex; gap: 0.4rem; align-items: flex-start; }
  .list-row textarea { flex: 1; }

  .save-btn {
    text-transform: none; letter-spacing: 0;
    background: var(--accent); color: #fff; border: none;
    border-radius: 8px; padding: 0.35rem 0.9rem;
    font-size: 0.85rem; font-weight: 600; cursor: pointer;
  }
  .save-btn:disabled { opacity: 0.6; cursor: default; }
  .mini {
    background: var(--panel-2); border: 1px solid var(--border);
    border-radius: 6px; color: var(--text); cursor: pointer;
    font-size: 0.75rem; padding: 0.2rem 0.5rem;
  }
  .mini.del { color: var(--muted); flex: none; }
  .mini:disabled { opacity: 0.4; cursor: default; }
  .example-fields { display: flex; flex-direction: column; gap: 0.5rem; padding: 0.7rem; border: 1px solid var(--border); border-radius: 8px; }
  .example-actions { display: flex; gap: 0.3rem; }

  .pv-label {
    font-size: 0.72rem; font-weight: 600; letter-spacing: 0.06em;
    text-transform: uppercase; color: var(--muted); margin-bottom: 0.4rem;
  }
</style>
