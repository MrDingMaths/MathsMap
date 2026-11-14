<script>
  // One practice tier on the public skill page, laid out like a booklet
  // exercise: a header band, numbered questions with bold labels, lettered
  // parts, and a per-question "Show solution" reveal with blue working.
  // (The file name is left over from the earlier carousel.)
  // After checking a solution the student marks it "Got it" or "Not yet";
  // practice-progress.js turns those marks into Learning / Proficient (never
  // Mastered, which only the quiz awards).
  import InlineContent from './InlineContent.svelte';
  import { splitParts, pairParts } from '../lib/skill-parts.js';
  import { getPracticeMarks, markPractice, subscribePractice } from '../lib/practice-progress.js';

  let { tier, items, skillId = null, hasHigherTiers = false } = $props();
  let marks = $state({});
  $effect(() => {
    const id = skillId;
    marks = id ? getPracticeMarks(id) : {};
    return subscribePractice(() => { marks = id ? getPracticeMarks(id) : {}; });
  });
  function mark(i, value) {
    if (skillId) markPractice(skillId, `${tier.key}-${i}`, value, { hasHigherTiers });
  }
  let open = $state(new Set());
  let questions = $derived(items.map((item) => ({
    item,
    parts: splitParts(item.question_text),
    paired: pairParts(item.question_text, item.solution_text),
  })));
  let allOpen = $derived(items.length > 0 && open.size === items.length);

  const INK = '#24282d';
  const BLUE = '#268cff';

  function toggle(i) {
    const next = new Set(open);
    next.has(i) ? next.delete(i) : next.add(i);
    open = next;
  }
  function toggleAll() {
    open = allOpen ? new Set() : new Set(items.map((_, i) => i));
  }
</script>

<section class="practice-tier" aria-labelledby="tier-{tier.key}">
  <div class="tier-band">
    <h3 id="tier-{tier.key}">{tier.label}</h3>
    <span class="tier-count">{items.length} {items.length === 1 ? 'question' : 'questions'}</span>
    <button class="toggle-all" onclick={toggleAll}>{allOpen ? 'Hide all solutions' : 'Show all solutions'}</button>
  </div>
  <ol class="questions">
    {#each questions as q, i}
      {@const id = `${tier.key}-q${i + 1}`}
      <li class="question">
        <b class="question-number">{i + 1}</b>
        <div class="question-body">
          {#if q.parts.parts.length}
            {#if q.parts.stem}<InlineContent text={q.parts.stem} textColor={INK} />{/if}
            <div class="parts">
              {#each q.parts.parts as part}
                <div class="part"><b class="part-label">{part.label}</b><div><InlineContent text={part.text} textColor={INK} /></div></div>
              {/each}
            </div>
          {:else}
            <InlineContent text={q.item.question_text} textColor={INK} />
          {/if}
          <div class="reveal-row">
            <button class="reveal" aria-expanded={open.has(i)} aria-controls="{id}-solution" onclick={() => toggle(i)}>
              {open.has(i) ? 'Hide solution' : 'Show solution'}
            </button>
          </div>
          {#if open.has(i)}
            <div class="solution" id="{id}-solution">
              {#if q.paired}
                {#if q.paired.solutionStem}<InlineContent text={q.paired.solutionStem} textColor={BLUE} />{/if}
                {#each q.paired.rows as row}
                  <div class="part"><b class="part-label">{row.label}</b><div><InlineContent text={row.solution} textColor={BLUE} /></div></div>
                {/each}
              {:else}
                <InlineContent text={q.item.solution_text} textColor={BLUE} />
              {/if}
            </div>
            {#if skillId}
              {@const current = marks[`${tier.key}-${i}`]}
              <div class="self-check" role="group" aria-label="How did question {i + 1} go?">
                <span>How did you go?</span>
                <button class="check got" aria-pressed={current === 'got'} onclick={() => mark(i, 'got')}>Got it</button>
                <button class="check not" aria-pressed={current === 'not'} onclick={() => mark(i, 'not')}>Not yet</button>
              </div>
            {/if}
          {:else if skillId && marks[`${tier.key}-${i}`]}
            <div class="mark-note">{marks[`${tier.key}-${i}`] === 'got' ? 'Got it' : 'Not yet'}</div>
          {/if}
        </div>
      </li>
    {/each}
  </ol>
</section>

<style>
  .practice-tier { margin-top: 1.35rem; font-family: 'Nunito', var(--font-body); background: #ffffff; color: var(--booklet-ink); border: 1px solid var(--booklet-border); border-radius: 2px; }
  /* Booklet exercise band: header blue with white bold text. */
  .tier-band { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; padding: 0.45rem 0.75rem 0.45rem 1rem; background: var(--booklet-headerBlue); color: #ffffff; }
  .tier-band h3 { margin: 0; font-size: 1.05rem; font-weight: 800; color: #ffffff; letter-spacing: 0; }
  .tier-count { font-size: 0.85rem; opacity: 0.9; }
  .toggle-all { margin-left: auto; padding: 0.25rem 0.6rem; border: 1px solid rgba(255, 255, 255, 0.7); border-radius: 6px; background: transparent; color: #ffffff; font: 700 0.8rem 'Nunito', var(--font-body); cursor: pointer; }
  .toggle-all:hover { background: rgba(255, 255, 255, 0.15); }
  .toggle-all:focus-visible, .reveal:focus-visible { outline: 2px solid var(--booklet-blue); outline-offset: 2px; }

  .questions { list-style: none; margin: 0; padding: 0 1rem; }
  .question { display: grid; grid-template-columns: 1.8rem minmax(0, 1fr); align-items: start; padding: 0.9rem 0; line-height: 1.6; }
  .question + .question { border-top: 1px solid var(--booklet-border); }
  .question-number { font-weight: 800; font-size: 1.02rem; }
  .question-body { min-width: 0; }

  .parts { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr)); gap: 0.35rem 1.25rem; margin-top: 0.35rem; }
  .part { display: grid; grid-template-columns: 1.6rem minmax(0, 1fr); align-items: start; }
  .part-label { font-weight: 800; }

  .reveal-row { display: flex; justify-content: flex-end; margin-top: 0.55rem; }
  .reveal { padding: 0.3rem 0.7rem; border: 1px solid var(--booklet-blue); border-radius: 6px; background: #ffffff; color: var(--booklet-blue); font: 700 0.82rem 'Nunito', var(--font-body); cursor: pointer; }
  .reveal:hover, .reveal[aria-expanded='true'] { background: var(--booklet-blueFill); }
  /* Coral accent bar on the right, no fill. */
  .solution { margin-top: 0.55rem; padding: 0.35rem 0.9rem 0.35rem 0; border-right: 4px solid var(--booklet-red); line-height: 1.8; display: flex; flex-direction: column; gap: 0.2rem; }
  .self-check { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 0.45rem; margin-top: 0.55rem; font-size: 0.82rem; color: var(--booklet-muted, #777777); }
  .check { padding: 0.25rem 0.7rem; border: 1px solid var(--booklet-border); border-radius: 6px; background: #ffffff; color: var(--booklet-ink); font: 700 0.82rem 'Nunito', var(--font-body); cursor: pointer; }
  .check.got:hover, .check.got[aria-pressed='true'] { border-color: var(--booklet-green); background: var(--booklet-greenFill); color: #2f6b40; }
  .check.not:hover, .check.not[aria-pressed='true'] { border-color: var(--booklet-orange); background: var(--booklet-orangeFill); color: #9a5410; }
  .check:focus-visible { outline: 2px solid var(--booklet-blue); outline-offset: 2px; }
  .mark-note { margin-top: 0.3rem; text-align: right; font-size: 0.78rem; font-weight: 700; color: var(--booklet-muted, #777777); }
  @media (max-width: 520px) {
    .questions { padding: 0 0.75rem; }
    .toggle-all { margin-left: 0; }
  }
</style>
