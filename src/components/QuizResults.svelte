<script>
  import { skillById } from '../lib/data.js';
  import { href } from '../lib/router.svelte.js';
  import { MASTERY, LEVELS } from '../lib/store.js';
  import { nextSkills } from '../lib/recommender.js';
  import Math from './Math.svelte';

  // Results screen for a finished (or early-finished) diagnostic session.
  // `results` is the object returned by quiz-engine's getResults(session):
  // { tested, inferred, blocked, notAssessed, writes }.
  let { results, courseId = null, scopeLabel = null } = $props();

  const RANK = Object.fromEntries(LEVELS.map((l, i) => [l, i]));
  let query = $derived(courseId ? `?course=${courseId}` : '');
  const titleOf = (id) => skillById.get(id)?.title ?? id;

  // Dedupe writes per skill down to the highest level reached this session
  // (a skill can be written twice — once PASSED→proficient, again on a later
  // mastery follow-up →mastered).
  let upgraded = $derived.by(() => {
    const map = new Map();
    for (const w of results.writes) {
      const prev = map.get(w.id);
      if (!prev || RANK[w.level] > RANK[prev]) map.set(w.id, w.level);
    }
    return [...map.entries()].map(([id, level]) => ({ id, level }));
  });

  let needsWork = $derived(
    results.tested.filter((t) => t.status === 'PARTIAL' || t.status === 'FAILED')
  );
  let passed = $derived(results.tested.filter((t) => t.status === 'PASSED'));

  let upNext = $derived(nextSkills({ courseId, limit: 6 }));

  const summaryTiles = [
    { key: 'passed', label: 'Passed', color: 'var(--m-mastered)' },
    { key: 'needsWork', label: 'Needs work', color: 'var(--m-learning)' },
    { key: 'inferred', label: 'Inferred', color: 'var(--m-proficient)' },
    { key: 'blocked', label: 'Blocked', color: 'var(--muted)' },
    { key: 'notAssessed', label: 'Not assessed', color: 'var(--muted)' }
  ];
  let counts = $derived({
    passed: passed.length,
    needsWork: needsWork.length,
    inferred: results.inferred.length,
    blocked: results.blocked.length,
    notAssessed: results.notAssessed.length
  });
</script>

<div class="qr">
  <div class="qr-summary">
    {#each summaryTiles as tile}
      <div class="tile">
        <span class="tdot" style="background:{tile.color}"></span>
        <span class="tnum">{counts[tile.key]}</span>
        <span class="tlabel">{tile.label}</span>
      </div>
    {/each}
  </div>

  {#if upgraded.length}
    <section class="qr-section">
      <div class="qr-head"><span class="sec-dot" style="background:var(--m-mastered)"></span>Upgraded this quiz</div>
      <div class="qr-list">
        {#each upgraded as u}
          <a class="qr-row" href={href(`/skill/${u.id}${query}`)}>
            <span class="row-title"><Math text={titleOf(u.id)} /></span>
            <span class="row-badge m-{u.level}">{MASTERY[u.level].label}</span>
            <span class="row-source">via quiz</span>
          </a>
        {/each}
      </div>
    </section>
  {/if}

  {#if needsWork.length}
    <section class="qr-section">
      <div class="qr-head"><span class="sec-dot" style="background:var(--m-learning)"></span>Needs work</div>
      <div class="qr-list">
        {#each needsWork as t}
          <a class="qr-row" href={href(`/skill/${t.id}${query}`)}>
            <span class="row-title"><Math text={titleOf(t.id)} /></span>
            <span class="row-badge m-{t.level}">{t.level === 'none' ? 'Not yet' : MASTERY[t.level].label}</span>
            <span class="row-source">{t.correctCount}/{t.questionsAsked} correct</span>
          </a>
        {/each}
      </div>
    </section>
  {/if}

  {#if results.inferred.length}
    <section class="qr-section">
      <div class="qr-head"><span class="sec-dot" style="background:var(--m-proficient)"></span>Inferred proficient</div>
      <div class="qr-list">
        {#each results.inferred as id}
          <a class="qr-row" href={href(`/skill/${id}${query}`)}>
            <span class="row-title"><Math text={titleOf(id)} /></span>
            <span class="row-source">inferred from a later skill you passed</span>
          </a>
        {/each}
      </div>
    </section>
  {/if}

  {#if results.blocked.length}
    <section class="qr-section">
      <div class="qr-head"><span class="sec-dot" style="background:var(--muted)"></span>Not assessed — blocked</div>
      <div class="qr-list">
        {#each results.blocked as b}
          <div class="qr-row">
            <a class="row-title" href={href(`/skill/${b.id}${query}`)}><Math text={titleOf(b.id)} /></a>
            <span class="row-source">
              depends on <a href={href(`/skill/${b.blockedBy}${query}`)}><Math text={titleOf(b.blockedBy)} /></a>
            </span>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  {#if results.notAssessed.length}
    <section class="qr-section">
      <div class="qr-head"><span class="sec-dot" style="background:var(--muted)"></span>Not reached this time</div>
      <div class="qr-list">
        {#each results.notAssessed as id}
          <a class="qr-row" href={href(`/skill/${id}${query}`)}>
            <span class="row-title"><Math text={titleOf(id)} /></span>
          </a>
        {/each}
      </div>
    </section>
  {/if}

  {#if upNext.length}
    <section class="qr-section">
      <div class="qr-head"><span class="sec-dot accent"></span>What next{scopeLabel ? ` in ${scopeLabel}` : ''}</div>
      <div class="qr-grid">
        {#each upNext as s}
          <a class="qr-next-card" href={href(`/skill/${s.id}${query}`)}>
            <Math text={s.title} />
          </a>
        {/each}
      </div>
    </section>
  {/if}
</div>

<style>
  .qr { display: flex; flex-direction: column; gap: 1.6rem; }

  .qr-summary { display: flex; flex-wrap: wrap; gap: 0.75rem; }
  .tile {
    flex: 1;
    min-width: 110px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3rem;
    padding: 0.85rem 1rem;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--panel);
  }
  .tdot { width: 8px; height: 8px; border-radius: 999px; }
  .tnum { font-size: 1.4rem; font-weight: 600; line-height: 1; }
  .tlabel { font-size: 0.75rem; color: var(--muted); }

  .qr-section { display: flex; flex-direction: column; gap: 0.7rem; }
  .qr-head {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .sec-dot { width: 9px; height: 9px; border-radius: 3px; flex: none; }
  .sec-dot.accent { background: var(--accent); }

  .qr-list { display: flex; flex-direction: column; gap: 0.5rem; }
  .qr-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem 0.9rem;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--panel);
    color: var(--text);
  }
  .qr-row:hover { border-color: var(--accent); text-decoration: none; }
  .row-title { font-weight: 500; }
  .row-badge {
    flex: none;
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
    background: var(--panel-2);
    color: var(--muted);
  }
  .row-badge.m-learning { background: color-mix(in srgb, var(--m-learning) 18%, transparent); color: var(--m-learning); }
  .row-badge.m-proficient { background: color-mix(in srgb, var(--m-proficient) 18%, transparent); color: var(--m-proficient); }
  .row-badge.m-mastered { background: color-mix(in srgb, var(--m-mastered) 18%, transparent); color: var(--m-mastered); }
  .row-source { margin-left: auto; font-size: 0.75rem; color: var(--muted); white-space: nowrap; }
  .row-source a { color: var(--accent); }

  .qr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.6rem; }
  .qr-next-card {
    padding: 0.75rem 0.9rem;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--panel);
    color: var(--text);
    font-size: 0.92rem;
  }
  .qr-next-card:hover { border-color: var(--accent); text-decoration: none; }
</style>
