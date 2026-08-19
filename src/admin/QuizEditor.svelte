<script>
  import InlineContent from '../components/InlineContent.svelte';
  import QuizQuestionEditor from './QuizQuestionEditor.svelte';

  // Admin editor for a skill's quiz bank (public/quizzes/{skillId}.json).
  // Opens QuizQuestionEditor as a modal, exactly like PracticeEditor does for
  // practice cards. Emits a whole new quiz object up via onSave.
  let { skillId, quiz = null, onSave } = $props();

  let questions = $derived(quiz?.questions ?? []);

  // editing = index into questions, or questions.length for "new question".
  let editing = $state(null);

  let editingQuestion = $derived(editing !== null ? (questions[editing] ?? null) : null);

  function nextId() {
    let n = questions.length;
    const used = new Set(questions.map((q) => q.id));
    let id = `q${n + 1}`;
    while (used.has(id)) { n += 1; id = `q${n + 1}`; }
    return id;
  }

  async function commitQuestion(updated) {
    const next = { skillId, ...quiz, questions: [...questions] };
    if (!updated.id) updated = { ...updated, id: nextId() };
    next.questions[editing] = updated;
    await onSave(next);
    editing = null;
  }

  async function deleteQuestion(i) {
    if (!confirm('Delete this question?')) return;
    const next = { skillId, ...quiz, questions: questions.filter((_, idx) => idx !== i) };
    await onSave(next);
  }
</script>

<div class="qe">
  <div class="qe-head">
    <button class="mini add" onclick={() => (editing = questions.length)}>+ Add question</button>
  </div>
  {#if questions.length}
    <ol class="qe-list">
      {#each questions as item, i}
        <li class="qe-item">
          <span class="qe-num">{i + 1}.</span>
          {#if item.mastery}<span class="qe-tag mastery">mastery</span>{/if}
          {#if item.structure}<span class="qe-structure">{item.structure}</span>{/if}
          <span class="qe-q"><InlineContent text={item.question_text} /></span>
          <span class="qe-actions">
            <button class="mini" onclick={() => (editing = i)} aria-label="Edit question">✎</button>
            <button class="mini del" onclick={() => deleteQuestion(i)} aria-label="Delete question">🗑</button>
          </span>
        </li>
      {/each}
    </ol>
  {:else}
    <p class="muted">No quiz questions yet.</p>
  {/if}
</div>

{#if editing !== null}
  <QuizQuestionEditor question={editingQuestion} onSave={commitQuestion} onCancel={() => (editing = null)} />
{/if}

<style>
  .qe-head { display: flex; justify-content: flex-end; margin-bottom: 0.5rem; }
  .qe-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.4rem; }
  .qe-item {
    display: flex; align-items: center; gap: 0.6rem;
    border: 1px solid var(--border); border-radius: 10px;
    background: var(--panel); padding: 0.5rem 0.7rem;
  }
  .qe-num { color: var(--muted); font-size: 0.85rem; flex: none; }
  .qe-tag { flex: none; font-size: 0.68rem; font-weight: 650; text-transform: uppercase; letter-spacing: .04em; color: var(--accent); border: 1px solid var(--border); border-radius: 4px; padding: 0.05rem 0.35rem; }
  .qe-structure { flex: none; font-size: 0.7rem; font-family: monospace; color: var(--accent); background: var(--panel-2, transparent); border: 1px solid var(--border); border-radius: 4px; padding: 0.05rem 0.35rem; }
  .qe-q { flex: 1; font-size: 0.95rem; overflow: hidden; }
  .qe-actions { display: flex; gap: 0.3rem; flex: none; }

  .mini {
    background: var(--panel-2); border: 1px solid var(--border);
    border-radius: 6px; color: var(--text); cursor: pointer;
    font-size: 0.8rem; padding: 0.25rem 0.5rem;
  }
  .mini.add { text-transform: none; }
  .mini.del { color: var(--muted); }
  .muted { color: var(--muted); font-size: 0.9rem; margin: 0; }
</style>
