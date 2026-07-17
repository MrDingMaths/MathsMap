<script>
  import { skills as allSkills, skillsForTopic } from '../lib/data.js';
  import { loadSkillContent } from '../lib/content.js';
  import { loadSkillQuiz } from '../lib/quiz.js';
  import { renderTikzCode } from '../lib/tikz.js';

  // Dev-only pre-review tool: loads every content/quiz file in scope and
  // compiles each TikZ diagram ONE AT A TIME (the next only starts once the
  // previous has compiled or failed) so a bad diagram is easy to pin down —
  // TikZJax can only usefully run one job at a time anyway. Route: 'tikz-check',
  // ?topic=<id> or ?ids=<comma,separated,skillIds>; no filter = every skill.
  let { topicId = null, ids = null } = $props();

  const TIMEOUT_MS = 45000; // safety net on top of tikz.js's own watchdogs

  // ---- Resolve the skill id list to scan ----
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

  // ---- Gather every diagram in scope: {skillId, label, code} ----
  let items = $state([]);
  let gathering = $state(true);

  $effect(() => {
    const ids2 = skillIds; // capture for this run
    gathering = true;
    items = [];
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
              if (card.tikz) out.push({ skillId: id, label: `${id} — ${tier}[${i}].tikz`, code: card.tikz });
              if (card.tikzSolution) out.push({ skillId: id, label: `${id} — ${tier}[${i}].tikzSolution`, code: card.tikzSolution });
            });
          }
        }
        if (quiz?.questions) {
          quiz.questions.forEach((q, i) => {
            if (q.tikz) out.push({ skillId: id, label: `${id} — quiz ${q.id ?? `q${i}`}.tikz`, code: q.tikz });
          });
        }
      }
      items = out;
      results = out.map((it) => ({ label: it.label, status: 'pending' }));
      gathering = false;
      cursor = out.length ? 0 : -1;
    })();
  });

  // ---- Sequential compile loop ----
  let results = $state([]); // parallel to items: {label, status: 'pending'|'pass'|'fail'}
  let cursor = $state(-1); // index currently rendering, or -1
  let wrapEl = $state(null);

  const hasCompiledSvg = (el) => [...el.querySelectorAll('svg')].some((s) => !s.querySelector('animate'));
  const hasError = (el) => !!el.querySelector('.tikz-error');

  $effect(() => {
    if (cursor < 0 || cursor >= items.length || !wrapEl) return;
    const el = wrapEl;
    const item = items[cursor];
    let settled = false;
    let obs;
    let timer;

    const settle = (status) => {
      if (settled) return;
      settled = true;
      if (obs) obs.disconnect();
      if (timer) clearTimeout(timer);
      results[cursor] = { label: item.label, status };
      cursor += 1;
    };

    obs = new MutationObserver(() => {
      if (hasError(el)) settle('fail');
      else if (hasCompiledSvg(el)) settle('pass');
    });
    obs.observe(el, { childList: true, subtree: true });
    timer = setTimeout(() => settle('fail'), TIMEOUT_MS);

    renderTikzCode(el, item.code);

    return () => {
      if (obs) obs.disconnect();
      if (timer) clearTimeout(timer);
    };
  });

  let doneCount = $derived(results.filter((r) => r.status !== 'pending').length);
  let passCount = $derived(results.filter((r) => r.status === 'pass').length);
  let failCount = $derived(results.filter((r) => r.status === 'fail').length);
</script>

<div class="container tikz-check">
  <h1>TikZ compile check</h1>
  <p class="muted">
    {#if gathering}Gathering diagrams…
    {:else}{items.length} diagram(s) found · {doneCount}/{items.length} checked · {passCount} pass · {failCount} fail{/if}
  </p>

  {#if !gathering && items.length === 0}
    <p class="muted">No TikZ diagrams found in this scope.</p>
  {/if}

  <!-- Off-screen render target for whichever diagram is currently compiling. -->
  <div class="render-target" bind:this={wrapEl}></div>

  <ol class="results">
    {#each results as r, i}
      <li class="row status-{r.status}">
        <span class="icon">
          {#if r.status === 'pending'}{i === cursor ? '…' : '·'}{:else if r.status === 'pass'}✓{:else}✕{/if}
        </span>
        <span class="label">{r.label}</span>
      </li>
    {/each}
  </ol>
</div>

<style>
  .tikz-check { max-width: 900px; }
  .render-target {
    margin: 1rem 0;
    min-height: 2rem;
    border: 1px dashed var(--border);
    border-radius: 10px;
    padding: 0.5rem;
    overflow-x: auto;
  }
  .render-target :global(svg) { max-width: 100%; }

  .results { list-style: none; margin: 1rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 0.3rem; }
  .row { display: flex; align-items: center; gap: 0.6rem; padding: 0.35rem 0.6rem; border-radius: 8px; font-size: 0.85rem; font-family: monospace; }
  .icon { flex: none; width: 1.2em; text-align: center; font-weight: 700; }
  .row.status-pass { color: var(--m-mastered); }
  .row.status-fail { color: #ef4444; background: color-mix(in srgb, #ef4444 8%, transparent); }
  .row.status-pending { color: var(--muted); }
</style>
