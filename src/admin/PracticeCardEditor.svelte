<script>
  import MathText from '../components/Math.svelte';
  import Tikz from '../components/Tikz.svelte';
  import SolutionSteps from '../components/SolutionSteps.svelte';

  let { card = null, onSave, onCancel } = $props();

  let q = $state('');
  let a = $state('');
  let tikz = $state('');
  let tikzSolution = $state('');
  let solution = $state([]);

  $effect(() => {
    q = card?.q ?? '';
    a = card?.a ?? '';
    tikz = card?.tikz ?? '';
    tikzSolution = card?.tikzSolution ?? '';
    solution = (card?.solution ?? []).map((s) => ({ math: s.math ?? '', note: s.note ?? '' }));
  });

  let saving = $state(false);
  let error = $state('');

  function build() {
    // Spread the original card so unknown/unedited keys survive.
    const out = { ...(card ?? {}) };
    out.q = q;
    out.a = a;
    if (tikz.trim()) out.tikz = tikz; else delete out.tikz;
    if (tikzSolution.trim()) out.tikzSolution = tikzSolution; else delete out.tikzSolution;
    if (solution.length) out.solution = solution; else delete out.solution;
    return out;
  }

  function moveRow(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= solution.length) return;
    const next = [...solution];
    [next[i], next[j]] = [next[j], next[i]];
    solution = next;
  }

  async function save() {
    saving = true;
    error = '';
    try {
      await onSave(build());
    } catch (e) {
      error = String(e.message ?? e);
      saving = false;
    }
  }
</script>

<div class="backdrop" onclick={(e) => { if (e.target === e.currentTarget) onCancel(); }} role="presentation">
  <div class="modal" role="dialog" aria-modal="true" tabindex="-1">
    <div class="ed-head">
      <span>Edit question</span>
      <div class="head-btns">
        <button class="ghost" onclick={onCancel}>Cancel</button>
        <button class="save-btn" onclick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
    {#if error}<p class="ed-error">{error}</p>{/if}

    <div class="ed-grid">
      <div class="ed-fields">
        <label class="fld"><span>Question</span><textarea bind:value={q} rows="2"></textarea></label>
        <label class="fld"><span>Answer</span><textarea bind:value={a} rows="1"></textarea></label>
        <label class="fld"><span>TikZ diagram (front, optional)</span><textarea bind:value={tikz} rows="3"></textarea></label>
        <label class="fld"><span>TikZ diagram (solution, optional)</span><textarea bind:value={tikzSolution} rows="3"></textarea></label>

        <div class="list-block">
          <div class="list-head">
            <span>Solution steps</span>
            <button class="mini" onclick={() => (solution = [...solution, { math: '', note: '' }])}>+ add</button>
          </div>
          {#each solution as _, i}
            <div class="sol-row">
              <div class="sol-inputs">
                <textarea bind:value={solution[i].math} rows="1" placeholder="math, e.g. $= 4.7$"></textarea>
                <textarea bind:value={solution[i].note} rows="1" placeholder="note (optional)"></textarea>
              </div>
              <div class="sol-actions">
                <button class="mini" onclick={() => moveRow(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                <button class="mini" onclick={() => moveRow(i, 1)} disabled={i === solution.length - 1} aria-label="Move down">↓</button>
                <button class="mini del" onclick={() => (solution = solution.filter((_, j) => j !== i))} aria-label="Remove step">✕</button>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- live preview -->
      <div class="ed-preview">
        <div class="pv-label">Front</div>
        <div class="pv-card">
          {#if tikz.trim()}<div class="pv-diagram"><Tikz code={tikz} /></div>{/if}
          <div class="pv-q"><MathText text={q} /></div>
        </div>

        <div class="pv-label">Back</div>
        <div class="pv-card back">
          {#if tikzSolution.trim()}<div class="pv-diagram"><Tikz code={tikzSolution} /></div>
          {:else if tikz.trim()}<div class="pv-diagram"><Tikz code={tikz} /></div>{/if}
          <div class="pv-back-q"><MathText text={q} /></div>
          {#if solution.length}
            <SolutionSteps {solution} />
          {:else}
            <div class="pv-answer"><MathText text={a} /></div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(0, 0, 0, 0.45);
    display: flex; align-items: flex-start; justify-content: center;
    padding: 3rem 1rem; overflow-y: auto;
  }
  .modal {
    width: min(900px, 100%);
    border: 1px solid var(--accent); border-radius: 14px;
    background: var(--panel); padding: 1.2rem 1.4rem;
  }
  .ed-head {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 0.8rem;
    font-size: 0.72rem; font-weight: 600; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--accent);
  }
  .head-btns { display: flex; gap: 0.5rem; }
  .ed-error { color: var(--m-learning, #d33); font-size: 0.85rem; margin: 0 0 0.6rem; }
  .ed-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem; }
  @media (max-width: 720px) { .ed-grid { grid-template-columns: 1fr; } }

  .ed-fields { display: flex; flex-direction: column; gap: 0.8rem; }
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
  .list-block { display: flex; flex-direction: column; gap: 0.5rem; }
  .list-head { display: flex; align-items: center; justify-content: space-between; }
  .sol-row { display: flex; gap: 0.5rem; align-items: flex-start; }
  .sol-inputs { flex: 1; display: flex; flex-direction: column; gap: 0.3rem; }
  .sol-actions { display: flex; flex-direction: column; gap: 0.25rem; }

  .save-btn {
    text-transform: none; letter-spacing: 0;
    background: var(--accent); color: #fff; border: none;
    border-radius: 8px; padding: 0.35rem 0.9rem;
    font-size: 0.85rem; font-weight: 600; cursor: pointer;
  }
  .save-btn:disabled { opacity: 0.6; cursor: default; }
  .ghost {
    text-transform: none; letter-spacing: 0;
    background: var(--panel-2); border: 1px solid var(--border);
    border-radius: 8px; color: var(--text); cursor: pointer;
    font-size: 0.85rem; padding: 0.35rem 0.9rem;
  }
  .mini {
    background: var(--panel-2); border: 1px solid var(--border);
    border-radius: 6px; color: var(--text); cursor: pointer;
    font-size: 0.75rem; padding: 0.2rem 0.45rem;
  }
  .mini:disabled { opacity: 0.4; cursor: default; }
  .mini.del { color: var(--muted); }

  .pv-label {
    font-size: 0.72rem; font-weight: 600; letter-spacing: 0.06em;
    text-transform: uppercase; color: var(--muted); margin: 0.6rem 0 0.4rem;
  }
  .pv-label:first-child { margin-top: 0; }
  .pv-card {
    border: 1px solid var(--border); border-radius: 14px;
    background: var(--panel-2); padding: 1rem 1.2rem;
    display: flex; flex-direction: column; gap: 0.6rem;
  }
  .pv-card.back { align-items: flex-start; }
  .pv-diagram { width: 100%; display: flex; justify-content: center; overflow-x: auto; }
  .pv-diagram :global(svg) { max-width: 100%; height: auto; }
  .pv-q { font-size: 1.05rem; text-align: center; }
  .pv-back-q { font-size: 0.9rem; font-weight: 600; color: var(--muted); margin-bottom: 0.5rem; }
  .pv-answer { font-size: 1.05rem; }
</style>
