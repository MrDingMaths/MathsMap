<script>
  import InlineContent from '../components/InlineContent.svelte';
  import PracticeCardEditor from './PracticeCardEditor.svelte';

  // Admin replacement for the practice carousel: a compact editable list per
  // tier with edit / delete / add, opening PracticeCardEditor as a modal.
  // Emits a whole new `practice` object up via onSave; never mutates props.
  let { practice = {}, onSave } = $props();

  const TIERS = [
    { key: 'foundation', label: 'Foundation', dot: 'proficient' },
    { key: 'development', label: 'Development', dot: 'learning' },
    { key: 'mastery', label: 'Mastery', dot: 'mastered' }
  ];

  // editing = { tier, index } — index === list length means "new card".
  let editing = $state(null);

  let editingCard = $derived(
    editing
      ? (practice[editing.tier]?.[editing.index] ?? { question_text: '', solution_text: '' })
      : null
  );

  function clonePractice() {
    return structuredClone($state.snapshot(practice));
  }

  async function commitCard(updated) {
    const next = clonePractice();
    (next[editing.tier] ??= [])[editing.index] = updated;
    await onSave(next);
    editing = null;
  }

  async function deleteCard(tier, index) {
    if (!confirm('Delete this question?')) return;
    const next = clonePractice();
    next[tier].splice(index, 1);
    await onSave(next);
  }
</script>

<div class="pe">
  {#each TIERS as tier}
    <div class="pe-tier">
      <div class="pe-tier-head">
        <span class="ptier-head"><span class="tier-dot {tier.dot}"></span>{tier.label}</span>
        <button class="mini add" onclick={() => (editing = { tier: tier.key, index: (practice[tier.key]?.length ?? 0) })}>
          + Add question
        </button>
      </div>
      {#if practice[tier.key]?.length}
        <ol class="pe-list">
          {#each practice[tier.key] as item, i}
            <li class="pe-item">
              <span class="pe-num">{i + 1}.</span>
              <span class="pe-q"><InlineContent text={item.question_text} /></span>
              <span class="pe-actions">
                <button class="mini" onclick={() => (editing = { tier: tier.key, index: i })} aria-label="Edit question">✎</button>
                <button class="mini del" onclick={() => deleteCard(tier.key, i)} aria-label="Delete question">🗑</button>
              </span>
            </li>
          {/each}
        </ol>
      {:else}
        <p class="muted">No questions yet.</p>
      {/if}
    </div>
  {/each}
</div>

{#if editing}
  <PracticeCardEditor card={editingCard} onSave={commitCard} onCancel={() => (editing = null)} />
{/if}

<style>
  .pe { display: flex; flex-direction: column; gap: 1.2rem; }
  .pe-tier-head {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 0.5rem;
  }
  .ptier-head { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 600; }
  .tier-dot { width: 9px; height: 9px; border-radius: 50%; flex: none; }
  .tier-dot.learning { background: var(--m-learning); }
  .tier-dot.proficient { background: var(--m-proficient); }
  .tier-dot.mastered { background: var(--m-mastered); }

  .pe-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.4rem; }
  .pe-item {
    display: flex; align-items: center; gap: 0.6rem;
    border: 1px solid var(--border); border-radius: 10px;
    background: var(--panel); padding: 0.5rem 0.7rem;
  }
  .pe-num { color: var(--muted); font-size: 0.85rem; flex: none; }
  .pe-q { flex: 1; font-size: 0.95rem; overflow: hidden; }
  .pe-actions { display: flex; gap: 0.3rem; flex: none; }

  .mini {
    background: var(--panel-2); border: 1px solid var(--border);
    border-radius: 6px; color: var(--text); cursor: pointer;
    font-size: 0.8rem; padding: 0.25rem 0.5rem;
  }
  .mini.add { text-transform: none; }
  .mini.del { color: var(--muted); }
  .muted { color: var(--muted); font-size: 0.9rem; margin: 0; }
</style>
