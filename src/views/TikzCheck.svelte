<script>
  import { skills as allSkills, skillsForTopic, skillById } from '../lib/data.js';
  import { loadSkillContent } from '../lib/content.js';
  import { loadSkillQuiz } from '../lib/quiz.js';
  import { renderTikzCode } from '../lib/tikz.js';
  import MathText from '../components/Math.svelte';

  // Dev-only visual diagram harness: loads every content/quiz TikZ in scope and
  // renders each into its OWN persistent card (question + expected answer beside
  // it) so you can eyeball geometric correctness, not just compile success.
  // Diagrams compile ONE AT A TIME (TikZJax is serial) but each stays on screen.
  // Route: 'tikz-check', ?topic=<id> or ?ids=<comma,skillIds>; no filter = all.
  let { topicId = null, ids = null } = $props();

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
    gathering = true;
    items = [];
    cardEls = [];
    cursor = -1;
    (async () => {
      const out = [];
      for (const id of ids2) {
        const [content, quiz] = await Promise.all([
          loadSkillContent(id).catch(() => null),
          loadSkillQuiz(id).catch(() => null)
        ]);
        if (content?.practice) {
          for (const tier of ['foundation', 'development', 'mastery']) {
            (content.practice[tier] || []).forEach((card, i) => {
              if (card.tikz) out.push({ skillId: id, kind: 'practice', field: `${tier}[${i}].tikz`, q: card.q, a: card.a, code: card.tikz, status: 'pending' });
              if (card.tikzSolution) out.push({ skillId: id, kind: 'practice', field: `${tier}[${i}].tikzSolution`, q: card.q, a: card.a, code: card.tikzSolution, status: 'pending' });
            });
          }
        }
        if (quiz?.questions) {
          quiz.questions.forEach((qq) => {
            if (qq.tikz) out.push({ skillId: id, kind: 'quiz', field: `quiz ${qq.id}`, q: qq.q, a: correctText(qq), code: qq.tikz, status: 'pending' });
          });
        }
      }
      items = out;
      cardEls = out.map(() => null);
      gathering = false;
      cursor = out.length ? 0 : -1;
    })();
  });

  const hasCompiledSvg = (el) => [...el.querySelectorAll('svg')].some((s) => !s.querySelector('animate'));
  const hasError = (el) => !!el.querySelector('.tikz-error');

  // Sequential compile: render into each card's own container in turn.
  $effect(() => {
    if (cursor < 0 || cursor >= items.length) return;
    const el = cardEls[cursor];
    if (!el) return;
    let settled = false;
    let obs, timer;
    const settle = (status) => {
      if (settled) return;
      settled = true;
      if (obs) obs.disconnect();
      if (timer) clearTimeout(timer);
      items[cursor].status = status;
      cursor += 1;
    };
    obs = new MutationObserver(() => {
      if (hasError(el)) settle('fail');
      else if (hasCompiledSvg(el)) settle('pass');
    });
    obs.observe(el, { childList: true, subtree: true });
    timer = setTimeout(() => settle('fail'), TIMEOUT_MS);
    renderTikzCode(el, items[cursor].code);
    return () => { if (obs) obs.disconnect(); if (timer) clearTimeout(timer); };
  });

  let doneCount = $derived(items.filter((r) => r.status !== 'pending').length);
  let passCount = $derived(items.filter((r) => r.status === 'pass').length);
  let failCount = $derived(items.filter((r) => r.status === 'fail').length);

  // Signals for the headless screenshot harness (scripts/shoot-tikz.mjs):
  // window.__tikzCheckDone flips true when every diagram has settled;
  // window.__tikzItems exposes the per-card metadata to pair PNG ↔ Q/A.
  $effect(() => {
    if (typeof window === 'undefined') return;
    window.__tikzItems = items.map((it) => ({ skillId: it.skillId, kind: it.kind, field: it.field, q: it.q, a: it.a, status: it.status }));
    window.__tikzCheckDone = !gathering && items.length > 0 && doneCount === items.length;
  });

  let filter = $state('all'); // all | fail | quiz
  let visible = $derived(items.map((it, i) => ({ it, i })).filter(({ it }) =>
    filter === 'all' ? true : filter === 'fail' ? it.status === 'fail' : it.kind === 'quiz'
  ));

  function copyCode(code) { navigator.clipboard?.writeText(code); }
  function titleFor(id) { return skillById.get(id)?.title ?? id; }
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
          <span class="sid">{titleFor(it.skillId)}</span>
          <span class="field">{it.field}</span>
          <span class="mark">
            {#if it.status === 'pass'}✓{:else if it.status === 'fail'}✕{:else if i === cursor}…{:else}·{/if}
          </span>
        </div>
        {#if it.q}<div class="q"><MathText text={it.q} /></div>{/if}
        <div class="stage" bind:this={cardEls[i]}></div>
        {#if it.a}<div class="a">answer: <MathText text={it.a} /></div>{/if}
        <button class="copy" onclick={() => copyCode(it.code)}>copy tikz</button>
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
  }
  .card.status-fail { border-color: #ef4444; box-shadow: 0 0 0 1px #ef4444 inset; }
  .card.status-pass { border-color: color-mix(in srgb, var(--m-mastered) 55%, var(--border)); }
  .card-head { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; }
  .badge { flex: none; padding: 0.1rem 0.45rem; border-radius: 6px; font-weight: 700; text-transform: uppercase; font-size: 0.62rem; letter-spacing: 0.04em; }
  .badge.practice { background: color-mix(in srgb, #6366f1 18%, transparent); color: #818cf8; }
  .badge.quiz { background: color-mix(in srgb, #f59e0b 20%, transparent); color: #f59e0b; }
  .sid { font-weight: 600; }
  .field { color: var(--muted); font-family: monospace; margin-left: auto; }
  .mark { flex: none; width: 1.1em; text-align: center; font-weight: 700; }
  .card.status-pass .mark { color: var(--m-mastered); }
  .card.status-fail .mark { color: #ef4444; }
  .q { font-size: 0.9rem; }
  .a { font-size: 0.82rem; color: var(--muted); }
  .stage {
    min-height: 3rem; display: flex; justify-content: center; align-items: center;
    padding: 0.5rem; border-radius: 8px; background: #fff; overflow-x: auto;
  }
  .stage :global(svg) { max-width: 100%; }
  .stage :global(.tikz-error) { color: #ef4444; font-family: monospace; font-size: 0.75rem; white-space: pre-wrap; }
  .copy { align-self: flex-start; font: inherit; font-size: 0.72rem; padding: 0.2rem 0.55rem; border-radius: 6px; border: 1px solid var(--border); background: transparent; color: var(--muted); cursor: pointer; }
</style>
