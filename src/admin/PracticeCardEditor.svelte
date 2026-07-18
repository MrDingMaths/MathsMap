<script>
  import InlineContent from '../components/InlineContent.svelte';

  let { card = null, onSave, onCancel } = $props();
  let questionText = $state('');
  let solutionText = $state('');
  let saving = $state(false);
  let error = $state('');

  $effect(() => {
    questionText = card?.question_text ?? '';
    solutionText = card?.solution_text ?? '';
  });

  async function save() {
    saving = true;
    error = '';
    try {
      await onSave({ question_text: questionText, solution_text: solutionText });
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
        <label class="fld"><span>Question text</span><textarea bind:value={questionText} rows="10" placeholder="Use $…$ for maths and [tikz]…[/tikz] for diagrams."></textarea></label>
        <label class="fld"><span>Solution text</span><textarea bind:value={solutionText} rows="12" placeholder="One working line per line; end steps with **Procedure label**."></textarea></label>
      </div>
      <div class="ed-preview">
        <div class="pv-label">Front</div>
        <div class="pv-card"><InlineContent text={questionText} /></div>
        <div class="pv-label">Back</div>
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
  textarea { width:100%; box-sizing:border-box; resize:vertical; font-family:ui-monospace,monospace; font-size:.82rem; padding:.55rem .65rem; border:1px solid var(--border); border-radius:8px; background:var(--panel-2); color:var(--text); }
  .pv-label { margin:.6rem 0 .4rem; }.pv-label:first-child{margin-top:0}
  .pv-card { border:1px solid var(--border); border-radius:14px; background:var(--panel-2); padding:1rem 1.2rem; }
  .save-btn,.ghost { border-radius:8px; padding:.35rem .9rem; font-size:.85rem; cursor:pointer; }
  .save-btn { background:var(--accent); color:#fff; border:none; }.save-btn:disabled{opacity:.6}
  .ghost { background:var(--panel-2); border:1px solid var(--border); color:var(--text); }
  @media(max-width:720px){.ed-grid{grid-template-columns:1fr}}
</style>
