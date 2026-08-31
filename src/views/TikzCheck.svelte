<script>
  import { skills as allSkills, skillsForTopic, skillById } from '../lib/data.js';
  import { loadSkillContent, setContentCache } from '../lib/content.js';
  import { loadSkillQuiz, setQuizCache } from '../lib/quiz.js';
  import { saveContent, saveQuiz } from '../lib/admin.svelte.js';
  import { renderTikzCode } from '../lib/tikz.js';
  import InlineContent from '../components/InlineContent.svelte';
  import { extractTikzBlocks, stripTikzBlocks, replaceTikzBlock } from '../lib/inline-content.js';

  // Dev-only visual diagram harness: loads every content/quiz TikZ in scope and
  // renders each into its OWN persistent card (question + expected answer beside
  // it) so you can eyeball geometric correctness, not just compile success.
  // Diagrams compile ONE AT A TIME (TikZJax is serial) but each stays on screen.
  // Route: 'tikz-check', ?topic=<id> or ?ids=<comma,skillIds>; no filter = all.
  let {
    topicId = null,
    ids = null,
    inputUrl = null,
    offset = 0,
    limit = null
  } = $props();

  const TIMEOUT_MS = 45000;

  let skillIds = $derived.by(() => {
    if (ids) return ids.split(',').map((s) => s.trim()).filter(Boolean);
    if (topicId) {
      const seen = new Set();
      const out = [];
      for (const g of skillsForTopic(topicId)) {
        for (const s of g.skills) {
          if (!seen.has(s.id)) { seen.add(s.id); out.push(s.id); }
        }
      }
      return out;
    }
    return allSkills.map((s) => s.id);
  });

  let externalOffset = $derived(Math.max(0, Number.parseInt(offset, 10) || 0));
  let externalLimit = $derived(limit == null ? null : Math.max(1, Number.parseInt(limit, 10) || 1));

  // Each item: {skillId, kind, field, q, a, code, status}
  let items = $state([]);
  let gathering = $state(true);
  let cardEls = $state([]);
  let cursor = $state(-1);

  function correctText(quizQ) {
    const opt = (quizQ.options || []).find((o) => o.correct);
    return opt ? opt.text : '';
  }

  $effect(() => {
    const ids2 = skillIds;
    const sourceUrl = inputUrl;
    const sourceOffset = externalOffset;
    const sourceLimit = externalLimit;
    let cancelled = false;
    gathering = true;
    items = [];
    cardEls = [];
    cursor = -1;
    (async () => {
      if (sourceUrl) {
        const response = await fetch(sourceUrl, { cache: 'no-store' });
        if (!response.ok) throw new Error(`TikZ audit input failed: HTTP ${response.status}`);
        const payload = await response.json();
        const sourceItems = Array.isArray(payload) ? payload : payload.items;
        if (!Array.isArray(sourceItems)) throw new Error('TikZ audit input must be an array or contain an items array.');
        const end = sourceLimit == null ? undefined : sourceOffset + sourceLimit;
        const selected = sourceItems.slice(sourceOffset, end).map((item, index) => ({
          ...item,
          auditId: item.auditId ?? `${item.questionId ?? item.source ?? 'external'}:${item.field ?? index}`,
          skillId: item.skillId ?? item.source ?? item.questionId ?? 'external',
          kind: item.kind ?? 'database',
          status: 'pending'
        }));
        if (cancelled) return;
        items = selected;
        cardEls = selected.map(() => null);
        gathering = false;
        cursor = selected.length ? 0 : -1;
        return;
      }
      const out = [];
      for (const id of ids2) {
        const [content, quiz] = await Promise.all([
          loadSkillContent(id).catch(() => null),
          loadSkillQuiz(id).catch(() => null)
        ]);
        // Theory figures: one generic reference diagram per skill, addressed by the
        // field it sits in (theory.intro, theory.facts[2]) so it matches the `where`
        // grammar scripts/lib/tikz-blocks.mjs produces.
        if (content?.theory) {
          const theoryFields = [
            ['intro', content.theory.intro],
            ...(content.theory.facts || []).map((t, i) => [`facts[${i}]`, t]),
            ...(content.theory.steps || []).map((t, i) => [`steps[${i}]`, t]),
          ];
          for (const [where, text] of theoryFields) {
            extractTikzBlocks(text).blocks.forEach((code, j) => out.push({
              skillId: id, kind: 'theory', field: `theory.${where}[${j}]`,
              q: stripTikzBlocks(text), a: '', code, status: 'pending',
              textKey: where, blockIndex: j, sourceText: text,
              loc: { skillId: id, kind: 'theory', textKey: where }
            }));
          }
        }
        if (content?.practice) {
          for (const tier of ['foundation', 'development', 'mastery']) {
            (content.practice[tier] || []).forEach((card, i) => {
              extractTikzBlocks(card.question_text).blocks.forEach((code, j) => out.push({
                skillId: id, kind: 'practice', field: `${tier}[${i}].question_text[${j}]`,
                q: card.question_text, a: card.solution_text, code, status: 'pending',
                textKey: 'question_text', blockIndex: j, sourceText: card.question_text,
                loc: { skillId: id, kind: 'practice', tier, cardIndex: i, textKey: 'question_text' }
              }));
              extractTikzBlocks(card.solution_text).blocks.forEach((code, j) => out.push({
                skillId: id, kind: 'practice', field: `${tier}[${i}].solution_text[${j}]`,
                q: card.question_text, a: card.solution_text, code, status: 'pending',
                textKey: 'solution_text', blockIndex: j, sourceText: card.solution_text,
                loc: { skillId: id, kind: 'practice', tier, cardIndex: i, textKey: 'solution_text' }
              }));
            });
          }
        }
        if (quiz?.questions) {
          quiz.questions.forEach((qq) => {
            extractTikzBlocks(qq.question_text).blocks.forEach((code, j) => out.push({
              skillId: id, kind: 'quiz', field: `quiz ${qq.id}.question_text[${j}]`,
              q: qq.question_text, a: correctText(qq), code, status: 'pending',
              textKey: 'question_text', blockIndex: j, sourceText: qq.question_text,
              loc: { skillId: id, kind: 'quiz', questionId: qq.id, textKey: 'question_text' }
            }));
            extractTikzBlocks(qq.solution_text).blocks.forEach((code, j) => out.push({
              skillId: id, kind: 'quiz', field: `quiz ${qq.id}.solution_text[${j}]`,
              q: qq.question_text, a: correctText(qq), code, status: 'pending',
              textKey: 'solution_text', blockIndex: j, sourceText: qq.solution_text,
              loc: { skillId: id, kind: 'quiz', questionId: qq.id, textKey: 'solution_text' }
            }));
          });
        }
      }
      if (cancelled) return;
      items = out;
      cardEls = out.map(() => null);
      gathering = false;
      cursor = out.length ? 0 : -1;
    })().catch((error) => {
      if (cancelled) return;
      console.error(error);
      gathering = false;
      items = [];
      cursor = -1;
      if (typeof window !== 'undefined') window.__tikzCheckError = error.message;
    });
    return () => { cancelled = true; };
  });

  const hasCompiledSvg = (el) => [...el.querySelectorAll('svg')].some((s) => !s.querySelector('animate'));
  const hasError = (el) => !!el.querySelector('.tikz-error');

  // Compile `code` into `el`, calling onSettled('pass'|'fail') once. Returns a
  // cleanup function. Shared by the sequential gather pass and by one-off
  // recompiles after an edit.
  function compileInto(el, code, onSettled) {
    let settled = false;
    let obs, timer;
    const settle = (status) => {
      if (settled) return;
      settled = true;
      if (obs) obs.disconnect();
      if (timer) clearTimeout(timer);
      onSettled(status);
    };
    obs = new MutationObserver(() => {
      if (hasError(el)) settle('fail');
      else if (hasCompiledSvg(el)) settle('pass');
    });
    obs.observe(el, { childList: true, subtree: true });
    timer = setTimeout(() => settle('fail'), TIMEOUT_MS);
    // eager: the harness renders sequentially into below-fold cards — viewport-lazy
    // mode would stall every off-screen card into the timeout.
    renderTikzCode(el, code, { eager: true });
    return () => { if (obs) obs.disconnect(); if (timer) clearTimeout(timer); };
  }

  // Sequential compile: render into each card's own container in turn.
  $effect(() => {
    if (cursor < 0 || cursor >= items.length) return;
    const el = cardEls[cursor];
    if (!el) return;
    const idx = cursor;
    return compileInto(el, items[idx].code, (status) => {
      items[idx].status = status;
      cursor += 1;
    });
  });

  // --- Inline diagram editing -------------------------------------------
  let editingIndex = $state(null);
  let draftCode = $state('');
  let saving = $state(false);
  let saveError = $state('');

  function startEdit(i) {
    editingIndex = i;
    draftCode = items[i].code;
    saveError = '';
  }

  function cancelEdit() {
    editingIndex = null;
    saveError = '';
  }

  // Recompile the card with the draft code without writing anything to disk —
  // for iterating on a diagram before committing it.
  function preview(i) {
    const el = cardEls[i];
    if (!el) return;
    items[i].status = 'pending';
    compileInto(el, draftCode, (status) => { items[i].status = status; });
  }

  async function saveEdit(i) {
    const item = items[i];
    if (!item.loc) return;
    saving = true;
    saveError = '';
    try {
      const updatedText = replaceTikzBlock(item.sourceText, item.blockIndex, draftCode);
      const { loc } = item;
      if (loc.kind === 'theory') {
        const content = await loadSkillContent(loc.skillId);
        const next = structuredClone(content);
        const m = loc.textKey.match(/^(facts|steps)\[(\d+)\]$/);
        if (m) next.theory[m[1]][Number(m[2])] = updatedText;
        else next.theory.intro = updatedText;
        await saveContent(loc.skillId, next);
        setContentCache(loc.skillId, next);
      } else if (loc.kind === 'practice') {
        const content = await loadSkillContent(loc.skillId);
        const next = structuredClone(content);
        next.practice[loc.tier][loc.cardIndex][loc.textKey] = updatedText;
        await saveContent(loc.skillId, next);
        setContentCache(loc.skillId, next);
      } else {
        const quiz = await loadSkillQuiz(loc.skillId);
        const next = structuredClone(quiz);
        const qq = next.questions.find((q) => q.id === loc.questionId);
        qq[loc.textKey] = updatedText;
        await saveQuiz(loc.skillId, next);
        setQuizCache(loc.skillId, next);
      }
      // Reflect the edit in every item sharing this same text field (a text
      // can hold more than one [tikz] block) so their preview stays in sync.
      for (const other of items) {
        if (other.loc && other.loc.skillId === loc.skillId && other.loc.kind === loc.kind
          && other.loc.textKey === loc.textKey
          && (loc.kind === 'practice' ? other.loc.tier === loc.tier && other.loc.cardIndex === loc.cardIndex : other.loc.questionId === loc.questionId)) {
          other.sourceText = updatedText;
          if (other.blockIndex === item.blockIndex) other.code = draftCode;
          if (other.textKey === 'question_text') other.q = updatedText;
          else if (loc.kind === 'practice') other.a = updatedText;
        }
      }
      editingIndex = null;
      preview(i);
    } catch (e) {
      saveError = String(e.message ?? e);
    } finally {
      saving = false;
    }
  }

  let doneCount = $derived(items.filter((r) => r.status !== 'pending').length);
  let passCount = $derived(items.filter((r) => r.status === 'pass').length);
  let failCount = $derived(items.filter((r) => r.status === 'fail').length);

  // Signals for the headless screenshot harness (scripts/shoot-tikz.mjs):
  // window.__tikzCheckDone flips true when every diagram has settled;
  // window.__tikzItems exposes the per-card metadata to pair PNG ↔ Q/A.
  $effect(() => {
    if (typeof window === 'undefined') return;
    window.__tikzItems = items.map((it) => ({
      auditId: it.auditId ?? null,
      questionId: it.questionId ?? null,
      source: it.source ?? null,
      marks: it.marks ?? null,
      skillId: it.skillId,
      kind: it.kind,
      field: it.field,
      q: it.q,
      a: it.a,
      status: it.status
    }));
    window.__tikzCheckDone = !gathering && items.length > 0 && doneCount === items.length;
  });

  let filter = $state('all'); // all | fail | quiz
  let visible = $derived(items.map((it, i) => ({ it, i })).filter(({ it }) =>
    filter === 'all' ? true : filter === 'fail' ? it.status === 'fail' : it.kind === 'quiz'
  ));

  function copyCode(code) { navigator.clipboard?.writeText(code); }
  function titleFor(item) { return item.source ?? skillById.get(item.skillId)?.title ?? item.skillId; }
</script>

<div class="tikz-harness">
  <header class="bar">
    <div class="bar-main">
      <h1>Diagram harness{#if topicId} · {topicId}{/if}</h1>
      <p class="muted">
        {#if gathering}Gathering diagrams…
        {:else}
          {items.length} diagram(s) · {doneCount}/{items.length} compiled ·
          <span class="ok">{passCount} ✓</span>
          {#if failCount}· <span class="bad">{failCount} ✕</span>{/if}
          {#if cursor >= 0 && cursor < items.length}· compiling {cursor + 1}…{/if}
        {/if}
      </p>
      {#if !gathering && items.length}
        <div class="track"><div class="fill" style="width:{(doneCount / items.length) * 100}%"></div></div>
      {/if}
    </div>
    <div class="filters">
      <button class:active={filter === 'all'} onclick={() => filter = 'all'}>All</button>
      <button class:active={filter === 'quiz'} onclick={() => filter = 'quiz'}>Quiz only</button>
      <button class:active={filter === 'fail'} onclick={() => filter = 'fail'}>Fails {failCount ? `(${failCount})` : ''}</button>
    </div>
  </header>

  {#if !gathering && items.length === 0}
    <p class="muted empty">No TikZ diagrams found in this scope.</p>
  {/if}

  <div class="grid">
    {#each visible as { it, i } (i)}
      <article class="card status-{it.status}">
        <div class="card-head">
          <span class="badge {it.kind}">{it.kind}</span>
          <span class="sid">{titleFor(it)}</span>
          <span class="field">{it.field}</span>
          <span class="mark">
            {#if it.status === 'pass'}✓{:else if it.status === 'fail'}✕{:else if i === cursor}…{:else}·{/if}
          </span>
        </div>
        {#if it.q}<div class="q"><InlineContent text={stripTikzBlocks(it.q)} /></div>{/if}
        <div class="stage" bind:this={cardEls[i]}></div>
        {#if it.a}<div class="a">answer: <InlineContent text={stripTikzBlocks(it.a)} /></div>{/if}

        {#if editingIndex === i}
          <div class="editbox">
            <textarea bind:value={draftCode} rows="10" spellcheck="false"></textarea>
            {#if saveError}<p class="edit-error">{saveError}</p>{/if}
            <div class="edit-btns">
              <button class="mini" onclick={() => preview(i)}>Recompile</button>
              <button class="mini" onclick={cancelEdit}>Cancel</button>
              {#if it.loc}
                <button class="mini save" onclick={() => saveEdit(i)} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              {:else}
                <span class="edit-hint">no source file — preview only</span>
              {/if}
            </div>
          </div>
        {:else}
          <div class="card-btns">
            <button class="copy" onclick={() => copyCode(it.code)}>copy tikz</button>
            <button class="copy" onclick={() => startEdit(i)}>edit</button>
          </div>
        {/if}
      </article>
    {/each}
  </div>
</div>

<style>
  .tikz-harness { max-width: 1400px; margin: 0 auto; padding: 0 1rem 3rem; }
  .bar {
    position: sticky; top: 0; z-index: 5;
    display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem; flex-wrap: wrap;
    padding: 0.9rem 0 0.7rem; margin-bottom: 1rem;
    background: var(--bg); border-bottom: 1px solid var(--border);
  }
  .bar-main { flex: 1 1 340px; }
  .bar h1 { margin: 0 0 0.2rem; font-size: 1.15rem; }
  .muted { color: var(--muted); margin: 0; font-size: 0.85rem; }
  .ok { color: var(--m-mastered); font-weight: 600; }
  .bad { color: #ef4444; font-weight: 600; }
  .track { height: 4px; border-radius: 2px; background: var(--border); margin-top: 0.5rem; overflow: hidden; }
  .fill { height: 100%; background: var(--m-mastered); transition: width 0.2s; }
  .filters { display: flex; gap: 0.4rem; }
  .filters button {
    font: inherit; font-size: 0.8rem; padding: 0.3rem 0.7rem; border-radius: 999px;
    border: 1px solid var(--border); background: transparent; color: var(--muted); cursor: pointer;
  }
  .filters button.active { background: var(--fg); color: var(--bg); border-color: var(--fg); }
  .empty { padding: 2rem 0; }

  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; }
  .card {
    border: 1px solid var(--border); border-radius: 12px; padding: 0.75rem;
    display: flex; flex-direction: column; gap: 0.5rem; background: var(--card, transparent);
    min-width: 0; overflow: hidden;
  }
  .card.status-fail { border-color: #ef4444; box-shadow: 0 0 0 1px #ef4444 inset; }
  .card.status-pass { border-color: color-mix(in srgb, var(--m-mastered) 55%, var(--border)); }
  .card-head { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; }
  .badge { flex: none; padding: 0.1rem 0.45rem; border-radius: 6px; font-weight: 700; text-transform: uppercase; font-size: 0.62rem; letter-spacing: 0.04em; }
  .badge.practice { background: color-mix(in srgb, #6366f1 18%, transparent); color: #818cf8; }
  .badge.quiz { background: color-mix(in srgb, #f59e0b 20%, transparent); color: #f59e0b; }
  .badge.database { background: color-mix(in srgb, #0ea5e9 18%, transparent); color: #0284c7; }
  .sid { font-weight: 600; }
  .field { color: var(--muted); font-family: monospace; margin-left: auto; }
  .mark { flex: none; width: 1.1em; text-align: center; font-weight: 700; }
  .card.status-pass .mark { color: var(--m-mastered); }
  .card.status-fail .mark { color: #ef4444; }
  .q { font-size: 0.9rem; overflow-wrap: anywhere; }
  .a { font-size: 0.82rem; color: var(--muted); overflow-wrap: anywhere; }
  .stage {
    min-height: 3rem; display: flex; justify-content: center; align-items: center;
    padding: 0.5rem; border-radius: 8px; background: #fff; overflow-x: auto;
  }
  .stage :global(svg) { max-width: 100%; }
  .stage :global(.tikz-error) { color: #ef4444; font-family: monospace; font-size: 0.75rem; white-space: pre-wrap; }
  .card-btns { display: flex; gap: 0.4rem; }
  .copy { align-self: flex-start; font: inherit; font-size: 0.72rem; padding: 0.2rem 0.55rem; border-radius: 6px; border: 1px solid var(--border); background: transparent; color: var(--muted); cursor: pointer; }

  .editbox { display: flex; flex-direction: column; gap: 0.4rem; }
  .editbox textarea {
    width: 100%; box-sizing: border-box; resize: vertical;
    font-family: ui-monospace, monospace; font-size: 0.78rem; line-height: 1.4;
    padding: 0.5rem 0.6rem; border: 1px solid var(--border); border-radius: 8px;
    background: var(--panel-2, #f5f5f5); color: var(--text, #111);
  }
  .edit-error { color: #ef4444; font-size: 0.78rem; margin: 0; }
  .edit-btns { display: flex; align-items: center; gap: 0.4rem; }
  .edit-hint { font-size: 0.72rem; color: var(--muted); }
  .mini { font: inherit; font-size: 0.72rem; padding: 0.2rem 0.6rem; border-radius: 6px; border: 1px solid var(--border); background: transparent; color: var(--muted); cursor: pointer; }
  .mini.save { background: var(--accent, #2563eb); border-color: transparent; color: #fff; }
  .mini.save:disabled { opacity: 0.6; cursor: default; }
</style>
