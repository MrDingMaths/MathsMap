<script>
  import { skillById } from '../lib/data.js';
  import { href } from '../lib/router.svelte.js';
  import { nextSkills } from '../lib/recommender.js';
  import { uncheckedResultItems, visibleResultItems } from '../lib/quiz-ui.js';
  import MathText from './Math.svelte';
  import MasteryStatus from './MasteryStatus.svelte';
  import Confetti from './Confetti.svelte';

  let { results, courseId = null, scopeLabel = null, scopeSkillIds = null, celebrate = false } = $props();
  let showAllUnchecked = $state(false);

  let query = $derived(courseId ? `?course=${courseId}` : '');
  const titleOf = (id) => skillById.get(id)?.title ?? id;

  let needsWork = $derived(results.tested.filter((item) => item.status === 'PARTIAL' || item.status === 'FAILED'));
  let passed = $derived(results.tested.filter((item) => item.status === 'PASSED'));
  let demonstrated = $derived([
    ...passed.map((item) => ({ id: item.id, level: item.level, source: `${item.correctCount}/${item.questionsAsked} correct` })),
    ...results.inferred.map((id) => ({ id, level: 'proficient', source: 'Shown through a later skill you passed' }))
  ]);
  let uncheckedItems = $derived(uncheckedResultItems(results));
  let notCheckedCount = $derived(uncheckedItems.length);
  let visibleUnchecked = $derived(visibleResultItems(uncheckedItems, showAllUnchecked));

  let summaryItems = $derived([
    demonstrated.length ? { key: 'demonstrated', icon: '✓', count: demonstrated.length, label: 'Demonstrated', tone: 'proficient' } : null,
    needsWork.length ? { key: 'practice', icon: '↗', count: needsWork.length, label: 'Needs practice', tone: 'learning' } : null,
    notCheckedCount ? { key: 'unchecked', icon: '○', count: notCheckedCount, label: 'Not checked yet', tone: 'none' } : null
  ].filter(Boolean));

  let summaryText = $derived.by(() => {
    const parts = [];
    if (demonstrated.length) parts.push(`${demonstrated.length} ${demonstrated.length === 1 ? 'skill was' : 'skills were'} demonstrated`);
    if (needsWork.length) parts.push(`${needsWork.length} ${needsWork.length === 1 ? 'skill needs' : 'skills need'} more practice`);
    if (notCheckedCount) parts.push(`${notCheckedCount} ${notCheckedCount === 1 ? 'skill was' : 'skills were'} not checked`);
    return parts.length ? `${parts.join(', ')}.` : 'This quiz did not produce any new skill results.';
  });

  let candidates = $derived(nextSkills({ courseId, limit: 30 }));
  let scopedRecommendations = $derived(scopeSkillIds ? candidates.filter((skill) => scopeSkillIds.includes(skill.id)).slice(0, 6) : candidates.slice(0, 6));
  let recommendationsAreScoped = $derived(!scopeSkillIds || scopedRecommendations.length > 0);
  let upNext = $derived(scopedRecommendations.length ? scopedRecommendations : candidates.slice(0, 6));
  let recommendationTitle = $derived(recommendationsAreScoped && scopeLabel ? `Recommended next in ${scopeLabel}` : 'Recommended next');
</script>

<Confetti active={celebrate} />

<div class="results">
  <section class="summary" aria-labelledby="result-summary-title">
    <div class="summary-copy">
      <span class="eyebrow">Quiz complete</span>
      <h2 id="result-summary-title">Here’s your clearest next step</h2>
      <p>{summaryText}</p>
      {#if upNext[0]}
        <a class="primary-action" href={href(`/skill/${upNext[0].id}${query}`)}>Practise <MathText text={upNext[0].title} /> <span aria-hidden="true">&rarr;</span></a>
      {/if}
    </div>
    {#if summaryItems.length}
      <div class="summary-stats">
        {#each summaryItems as item, index}
          <div class="summary-stat tone-{item.tone}" style="--enter-index:{index}"><span class="summary-icon" aria-hidden="true">{item.icon}</span><strong>{item.count}</strong><span>{item.label}</span></div>
        {/each}
      </div>
    {/if}
  </section>

  {#if demonstrated.length}
    <section class="result-section">
      <div class="section-heading"><span class="section-icon tone-proficient" aria-hidden="true">✓</span><div><span class="eyebrow">Demonstrated</span><h2>Skills you showed</h2></div></div>
      <div class="result-list">
        {#each demonstrated as item, index}
          <a class="result-row" style="--enter-index:{Math.min(index, 6)}" href={href(`/skill/${item.id}${query}`)}>
            <span class="row-title"><MathText text={titleOf(item.id)} /></span>
            <MasteryStatus level={item.level} />
            <span class="row-source">{item.source}</span>
            <span class="row-arrow" aria-hidden="true">&rarr;</span>
          </a>
        {/each}
      </div>
    </section>
  {/if}

  {#if needsWork.length}
    <section class="result-section">
      <div class="section-heading"><span class="section-icon tone-learning" aria-hidden="true">↗</span><div><span class="eyebrow">Needs practice</span><h2>Worth revisiting</h2></div></div>
      <div class="result-list">
        {#each needsWork as item, index}
          <a class="result-row" style="--enter-index:{Math.min(index, 6)}" href={href(`/skill/${item.id}${query}`)}>
            <span class="row-title"><MathText text={titleOf(item.id)} /></span>
            <MasteryStatus level={item.level} />
            <span class="row-source">{item.correctCount}/{item.questionsAsked} correct</span>
            <span class="row-arrow" aria-hidden="true">&rarr;</span>
          </a>
        {/each}
      </div>
    </section>
  {/if}

  {#if notCheckedCount}
    <section class="result-section">
      <div class="section-heading"><span class="section-icon tone-none" aria-hidden="true">○</span><div><span class="eyebrow">Not checked yet</span><h2>Not checked in this quiz</h2></div></div>
      <p class="scope-note">
        This is limited to quiz-ready skills in {#if scopeLabel}<strong><MathText text={scopeLabel} /></strong>{:else}the selected quiz scope{/if}, not every unchecked skill in MathsMap.
      </p>
      <div class="result-list quiet">
        {#each visibleUnchecked as item, index (item.id)}
          {#if item.kind === 'blocked'}
            <div class="result-row" style="--enter-index:{Math.min(index, 6)}">
              <a class="row-title" href={href(`/skill/${item.id}${query}`)}><MathText text={titleOf(item.id)} /></a>
              <span class="reason">Prerequisite needed</span>
              <span class="row-source">First practise <a href={href(`/skill/${item.blockedBy}${query}`)}><MathText text={titleOf(item.blockedBy)} /></a></span>
            </div>
          {:else}
            <a class="result-row" style="--enter-index:{Math.min(index, 6)}" href={href(`/skill/${item.id}${query}`)}><span class="row-title"><MathText text={titleOf(item.id)} /></span><span class="reason">Not included in this quiz</span><span class="row-arrow" aria-hidden="true">&rarr;</span></a>
          {/if}
        {/each}
      </div>
      {#if notCheckedCount > 5}
        <button class="disclosure" type="button" aria-expanded={showAllUnchecked} onclick={() => (showAllUnchecked = !showAllUnchecked)}>
          {showAllUnchecked ? 'Show fewer skills' : `Show all ${notCheckedCount} skills`}
          <span class:open={showAllUnchecked} aria-hidden="true">⌄</span>
        </button>
      {/if}
    </section>
  {/if}

  {#if upNext.length}
    <section class="result-section recommendations">
      <div class="section-heading"><span class="section-icon accent" aria-hidden="true">→</span><div><span class="eyebrow">Keep moving</span><h2>{recommendationTitle}</h2></div></div>
      <div class="recommendation-grid">
        {#each upNext as skill, index}
          <a class:featured={index === 0} style="--enter-index:{Math.min(index, 6)}" href={href(`/skill/${skill.id}${query}`)}><span><MathText text={skill.title} /></span><span aria-hidden="true">&rarr;</span></a>
        {/each}
      </div>
    </section>
  {/if}
</div>

<style>
  .results { display: flex; flex-direction: column; gap: 2rem; }
  .summary { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 1.5rem; align-items: center; padding: 1.4rem; border: 1px solid var(--border); border-radius: var(--radius-lg); background: linear-gradient(135deg, var(--surface-warm), var(--panel)); animation: content-rise var(--motion-slow) var(--ease-out) both; }
  .eyebrow { color: var(--muted); font-size: 0.66rem; font-weight: 750; letter-spacing: 0.08em; text-transform: uppercase; }
  .summary h2, .section-heading h2 { margin: 0.15rem 0 0; font-size: 1.2rem; }
  .summary p { margin: 0.45rem 0 0.9rem; color: var(--muted); }
  .primary-action { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.65rem 0.85rem; border-radius: 9px; background: var(--accent); color: #fff; font-size: 0.82rem; font-weight: 750; transition: transform var(--motion-fast) var(--ease-snap), background var(--motion-fast), box-shadow var(--motion-fast); }
  .primary-action:hover { transform: translateY(-2px); background: var(--accent-strong); box-shadow: var(--shadow); text-decoration: none; }
  .primary-action:active { transform: scale(0.97); }
  .summary-stats { display: flex; gap: 0.6rem; }
  .summary-stat { min-width: 92px; display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 0.1rem 0.4rem; padding: 0.7rem; border-radius: 11px; background: var(--panel); color: var(--status-none); animation: card-enter var(--motion-base) var(--ease-out) calc(var(--enter-index) * 55ms + 80ms) both; }
  .summary-stat strong { color: var(--text); font: 700 1.25rem var(--font-display); }
  .summary-stat > span:last-child { grid-column: 1 / -1; color: var(--muted); font-size: 0.68rem; }
  .summary-icon { display: grid; place-items: center; width: 1.3rem; height: 1.3rem; border: 1px solid currentColor; border-radius: 50%; }
  .tone-learning { color: var(--status-learning); }
  .tone-proficient { color: var(--status-proficient); }
  .tone-none { color: var(--status-none); }
  .section-heading { display: flex; align-items: center; gap: 0.7rem; margin-bottom: 0.75rem; }
  .section-icon { display: grid; place-items: center; width: 2rem; height: 2rem; flex: none; border: 1px solid currentColor; border-radius: 9px; font-weight: 750; }
  .section-icon.accent { color: var(--accent); }
  .result-list { border-block: 1px solid var(--border); }
  .result-row { display: flex; align-items: center; gap: 0.75rem; min-height: 52px; padding: 0.7rem 0.15rem; border-bottom: 1px solid var(--border); color: var(--text); animation: card-enter var(--motion-base) var(--ease-out) calc(var(--enter-index) * 35ms) both; }
  .result-row:last-child { border-bottom: 0; }
  a.result-row:hover, .result-row .row-title:hover { color: var(--accent); text-decoration: none; }
  .row-title { flex: 1; font-weight: 650; color: inherit; }
  .row-source { color: var(--muted); font-size: 0.72rem; }
  .row-source a { color: var(--accent); }
  .row-arrow { color: var(--muted); }
  .reason { padding: 0.18rem 0.5rem; border-radius: 999px; background: var(--surface-soft); color: var(--muted); font-size: 0.66rem; font-weight: 700; }
  .scope-note { max-width: 68ch; margin: -0.25rem 0 0.75rem; color: var(--muted); font-size: 0.78rem; }
  .quiet { opacity: 0.9; }
  .disclosure { display: flex; align-items: center; justify-content: center; gap: 0.45rem; width: 100%; margin-top: 0.65rem; padding: 0.55rem; border: 1px solid var(--border); border-radius: 9px; background: var(--panel); color: var(--muted); font: 700 0.74rem var(--font-body); cursor: pointer; transition: color var(--motion-fast), border-color var(--motion-fast), transform var(--motion-fast) var(--ease-snap); }
  .disclosure:hover { color: var(--accent); border-color: var(--accent); }
  .disclosure:active { transform: scale(0.985); }
  .disclosure span { transition: transform var(--motion-base) var(--ease-snap); }
  .disclosure span.open { transform: rotate(180deg); }
  .recommendation-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 0.65rem; }
  .recommendation-grid a { display: flex; justify-content: space-between; gap: 0.8rem; padding: 0.8rem 0.9rem; border: 1px solid var(--border); border-radius: 10px; background: var(--panel); color: var(--text); animation: card-enter var(--motion-base) var(--ease-out) calc(var(--enter-index) * 40ms) both; transition: transform var(--motion-fast) var(--ease-snap), border-color var(--motion-fast), color var(--motion-fast), box-shadow var(--motion-fast); }
  .recommendation-grid a:hover { transform: translateY(-2px); border-color: var(--accent); color: var(--accent); box-shadow: var(--shadow); text-decoration: none; }
  .recommendation-grid a:active { transform: scale(0.98); }
  .recommendation-grid a.featured { border-color: color-mix(in srgb, var(--accent) 45%, var(--border)); background: color-mix(in srgb, var(--accent) 7%, var(--panel)); animation: card-enter var(--motion-base) var(--ease-out) both, recommendation-glow 700ms var(--ease-out) 220ms both; }
  @keyframes recommendation-glow { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 30%, transparent); } 100% { box-shadow: 0 0 0 10px transparent; } }
  @media (max-width: 680px) { .summary { grid-template-columns: 1fr; } .summary-stats { flex-wrap: wrap; } .summary-stat { flex: 1; } .result-row { align-items: flex-start; flex-wrap: wrap; } .row-title { flex-basis: 100%; } .row-source { flex: 1; } }
</style>
