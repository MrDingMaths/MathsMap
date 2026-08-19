<script>
  import InlineContent from '../components/InlineContent.svelte';

  let { question = null, onSave, onCancel } = $props();
  let questionText = $state('');
  let structure = $state('');
  let mastery = $state(false);
  let solutionText = $state('');
  let options = $state([]);
  let correctIndex = $state(0);
  let saving = $state(false);
  let error = $state('');

  $effect(() => {
    questionText = question?.question_text ?? '';
    structure = question?.structure ?? '';
    mastery = question?.mastery ?? false;
    solutionText = question?.solution_text ?? '';
    const opts = question?.options?.length ? question.options : [{ text: '', correct: true }, { text: '', why: '' }];
    options = opts.map((o) => ({ text: o.text ?? '', why: o.why ?? '' }));
    correctIndex = Math.max(0, opts.findIndex((o) => o.correct === true));
  });

  function addOption() {
    options = [...options, { text: '', why: '' }];
  }

  function removeOption(i) {
    if (options.length <= 2) return;
    options = options.filter((_, idx) => idx !== i);
    if (correctIndex === i) correctIndex = 0;
    else if (correctIndex > i) correctIndex -= 1;
  }

  async function save() {
    saving = true;
    error = '';
    try {
      const trimmedStructure = structure.trim();
      await onSave({
        id: question?.id,
        question_text: questionText,
        ...(trimmedStructure ? { structure: trimmedStructure } : {}),
        mastery,
        options: options.map((o, i) => (
          i === correctIndex
            ? { text: o.text, correct: true }
            : { text: o.text, why: o.why }
        )),
        solution_text: solutionText
      });
    } catch (e) {
      error = String(e.message ?? e);
      saving = false;
    }
  }
</script>

<div class="backdrop" onclick={(e) => { if (e.target === e.currentTarget) onCancel(); }} role="presentation">
  <div class="modal" role="dialog" aria-modal="true" tabindex="-1">
    <div class="ed-head">
      <span>Edit quiz question</span>
      <div class="head-btns">
        <button class="ghost" onclick={onCancel}>Cancel</button>
        <button class="save-btn" onclick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
    {#if error}<p class="ed-error">{error}</p>{/if}

    <div class="ed-grid">
      <div class="ed-fields">
        <label class="fld"><span>Question text</span><textarea bind:value={questionText} rows="6" placeholder="Use $…$ for maths and [tikz]…[/tikz] for diagrams."></textarea></label>
        <div class="fld-row">
          <label class="fld"><span>Structure (archetype slug)</span><input class="structure-input" bind:value={structure} placeholder="e.g. round-to-tenths" /></label>
          <label class="fld chk"><input type="checkbox" bind:checked={mastery} /><span>Mastery-tier question</span></label>
        </div>

        <div class="fld">
          <span>Options — select the correct one</span>
          <div class="opt-list">
            {#each options as opt, i}
              <div class="opt-row">
                <input type="radio" name="correct-opt" checked={correctIndex === i} onchange={() => (correctIndex = i)} aria-label="Mark correct" />
                <div class="opt-fields">
                  <input class="opt-text" bind:value={opt.text} placeholder="Option text" />
                  {#if correctIndex !== i}
                    <input class="opt-why" bind:value={opt.why} placeholder="Why this is wrong (feedback shown to the learner)" />
                  {/if}
                </div>
                <button class="mini del" onclick={() => removeOption(i)} disabled={options.length <= 2} aria-label="Remove option">🗑</button>
              </div>
            {/each}
          </div>
          <button class="mini add" onclick={addOption}>+ Add option</button>
        </div>

        <label class="fld"><span>Solution text</span><textarea bind:value={solutionText} rows="8" placeholder="One working line per line."></textarea></label>
      </div>
      <div class="ed-preview">
        <div class="pv-label">Question</div>
        <div class="pv-card"><InlineContent text={questionText} /></div>
        <div class="pv-label">Solution</div>
        <div class="pv-card back"><InlineContent text={solutionText} /></div>
      </div>
    </div>
  </div>
</div>

<style>
  .backdrop { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,.45); display:flex; align-items:flex-start; justify-content:center; padding:3rem 1rem; overflow-y:auto; }
  .modal { width:min(1000px,100%); border:1px solid var(--accent); border-radius:14px; background:var(--panel); padding:1.2rem 1.4rem; }
  .ed-head,.head-btns { display:flex; align-items:center; }
  .ed-head { justify-content:space-between; margin-bottom:.8rem; font-size:.72rem; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:var(--accent); }
  .head-btns { gap:.5rem; }
  .ed-error { color:var(--m-learning,#d33); font-size:.85rem; }
  .ed-grid { display:grid; grid-template-columns:1fr 1fr; gap:1.2rem; }
  .ed-fields,.fld { display:flex; flex-direction:column; }
  .ed-fields { gap:.8rem; }.fld { gap:.3rem; }
  .fld>span,.pv-label { font-size:.72rem; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:var(--muted); }
  .fld-row { display:flex; gap:.8rem; align-items:flex-end; }
  .fld-row .fld { flex:1; }
  .fld.chk { flex-direction:row; align-items:center; gap:.4rem; padding-bottom:.55rem; }
  .fld.chk input { margin:0; }
  textarea,.structure-input,.opt-text,.opt-why { width:100%; box-sizing:border-box; resize:vertical; font-family:ui-monospace,monospace; font-size:.82rem; padding:.55rem .65rem; border:1px solid var(--border); border-radius:8px; background:var(--panel-2); color:var(--text); }
  .pv-label { margin:.6rem 0 .4rem; }.pv-label:first-child{margin-top:0}
  .pv-card { border:1px solid var(--border); border-radius:14px; background:var(--panel-2); padding:1rem 1.2rem; }
  .save-btn,.ghost { border-radius:8px; padding:.35rem .9rem; font-size:.85rem; cursor:pointer; }
  .save-btn { background:var(--accent); color:#fff; border:none; }.save-btn:disabled{opacity:.6}
  .ghost { background:var(--panel-2); border:1px solid var(--border); color:var(--text); }

  .opt-list { display:flex; flex-direction:column; gap:.4rem; margin-bottom:.4rem; }
  .opt-row { display:flex; align-items:center; gap:.5rem; }
  .opt-row input[type="radio"] { flex:none; }
  .opt-fields { flex:1; display:flex; flex-direction:column; gap:.3rem; }
  .mini { background: var(--panel-2); border: 1px solid var(--border); border-radius: 6px; color: var(--text); cursor: pointer; font-size: 0.8rem; padding: 0.25rem 0.5rem; flex: none; }
  .mini.add { align-self:flex-start; }
  .mini.del { color: var(--muted); }
  .mini:disabled { opacity:.4; cursor:default; }
  @media(max-width:720px){.ed-grid{grid-template-columns:1fr}}
</style>
