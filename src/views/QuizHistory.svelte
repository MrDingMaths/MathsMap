<script>
  import { href } from '../lib/router.svelte.js';
  import { getQuizHistory, getQuizHistoryEntry } from '../lib/quiz-history.js';
  import QuizResults from '../components/QuizResults.svelte';

  let { id = null } = $props();

  let history = $derived(getQuizHistory());
  let entry = $derived(id ? getQuizHistoryEntry(id) : null);

  function formatDate(at) {
    return new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' · ' + new Date(at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  function scoreFor(item) {
    const total = item.answerLog?.length ?? 0;
    const correct = item.answerLog?.filter((a) => a.correct).length ?? 0;
    return { correct, total };
  }
</script>

<div class="container quiz-history-view">
  {#if id}
    <!-- ===== SINGLE RESULT REVIEW ===== -->
    <div class="crumbs"><a href={href('/quiz-history')}>Recent quiz results</a> / {entry ? formatDate(entry.at) : 'Not found'}</div>
    {#if entry}
      <h1>{entry.scopeLabel ?? 'Diagnostic quiz'}</h1>
      <p class="lede">Taken {formatDate(entry.at)}.</p>
      <QuizResults
        results={entry.results}
        answerLog={entry.answerLog}
        courseId={entry.courseId}
        scopeLabel={entry.scopeLabel}
        scopeSkillIds={entry.scopeSkillIds}
        celebrate={false}
      />
    {:else}
      <p class="lede">This quiz result could not be found — it may have been cleared from this browser.</p>
      <a class="start-btn" href={href('/quiz-history')}>Back to recent results</a>
    {/if}

  {:else}
    <!-- ===== HISTORY LIST ===== -->
    <div class="crumbs"><a href={href('/quiz')}>Diagnostic quiz</a> / Recent results</div>
    <h1>Your recent quiz results</h1>
    <p class="lede">Come back to any past attempt to review what you got right and wrong.</p>

    {#if history.length === 0}
      <div class="empty-state">
        <p>You haven't finished a diagnostic quiz on this device yet.</p>
        <a class="start-btn" href={href('/quiz')}>Take a quiz</a>
      </div>
    {:else}
      <div class="history-list">
        {#each history as item (item.id)}
          {@const score = scoreFor(item)}
          <a class="history-row" href={href(`/quiz-history/${item.id}`)}>
            <span class="history-main">
              <strong>{item.scopeLabel ?? 'Diagnostic quiz'}</strong>
              <span class="history-date">{formatDate(item.at)}</span>
            </span>
            <span class="history-score">{score.correct}/{score.total} correct</span>
            <span class="row-arrow" aria-hidden="true">&rarr;</span>
          </a>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .quiz-history-view { max-width: 760px; }
  .crumbs { margin-bottom: 0.75rem; color: var(--muted); font-size: 0.8rem; }
  .crumbs a { color: var(--muted); }
  .crumbs a:hover { color: var(--accent); }
  h1 { font-size: 1.75rem; }
  .lede { color: var(--muted); font-size: 0.95rem; max-width: 60ch; margin-bottom: 1.2rem; }

  .empty-state { padding: 2.5rem 0; text-align: center; }
  .empty-state p { color: var(--muted); margin-bottom: 1rem; }

  .start-btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 999px;
    background: var(--accent);
    color: #fff;
    font-weight: 600;
    font-size: 0.95rem;
    transition: transform var(--motion-fast) var(--ease-snap), background var(--motion-fast), box-shadow var(--motion-fast);
  }
  .start-btn:hover { background: var(--accent-strong); box-shadow: var(--shadow); transform: translateY(-1px); text-decoration: none; }
  .start-btn:active { transform: scale(0.97); }

  .history-list { border-block: 1px solid var(--border); }
  .history-row { display: flex; align-items: center; gap: 0.75rem; min-height: 60px; padding: 0.8rem 0.15rem; border-bottom: 1px solid var(--border); color: var(--text); }
  .history-row:last-child { border-bottom: 0; }
  .history-row:hover { color: var(--accent); text-decoration: none; }
  .history-main { flex: 1; display: flex; flex-direction: column; gap: 0.15rem; }
  .history-date { color: var(--muted); font-size: 0.74rem; }
  .history-score { color: var(--muted); font-size: 0.8rem; font-weight: 600; }
  .row-arrow { color: var(--muted); }

  @media (max-width: 640px) {
    .history-row { align-items: flex-start; flex-wrap: wrap; }
    .history-main { flex-basis: 100%; }
  }
</style>
