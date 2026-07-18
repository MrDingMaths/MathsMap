<script>
  import MathText from './Math.svelte';
  import InlineContent from './InlineContent.svelte';
  import { mulberry32 } from '../lib/quiz-engine.js';

  // One question, one screen. The parent is expected to remount this component
  // per question (e.g. `{#key question.id}`) so local selection state always
  // starts fresh — we don't watch for question changes ourselves.
  //
  // `onAnswer(originalIndex)` fires only when the learner clicks 'Next' (or
  // presses Enter) AFTER reviewing feedback — selecting an option just locks
  // the card and reveals correctness locally; the engine is told once the
  // learner is done looking.
  let { question, onAnswer } = $props();

  // Deterministic per-question shuffle: hash the question id into a seed for
  // the engine's own PRNG, so display order is stable for a given question
  // but not sorted in authoring/canonical order (per docs/content-schema.md,
  // the app must shuffle at render).
  function hashSeed(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0) || 1;
  }

  function seededShuffle(items, seedStr) {
    const rng = mulberry32(hashSeed(seedStr));
    const arr = items.map((item, originalIndex) => ({ item, originalIndex }));
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  let shuffled = $derived(seededShuffle(question.options, question.id));
  let correctDisplayIndex = $derived(shuffled.findIndex((o) => o.item.correct === true));

  let selectedDisplayIndex = $state(null);
  let locked = $derived(selectedDisplayIndex !== null);
  let chosen = $derived(locked ? shuffled[selectedDisplayIndex] : null);
  let isCorrect = $derived(chosen ? chosen.item.correct === true : false);

  const KEYS = ['A', 'B', 'C', 'D', 'E'];

  function select(i) {
    if (locked) return;
    selectedDisplayIndex = i;
  }

  function next() {
    if (!locked) return;
    onAnswer(chosen.originalIndex);
  }

  function onKeydown(e) {
    if (!locked) {
      const i = KEYS.indexOf(e.key.toUpperCase());
      if (i !== -1 && i < shuffled.length) select(i);
      else if (/^[1-9]$/.test(e.key)) {
        const n = Number(e.key) - 1;
        if (n < shuffled.length) select(n);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      next();
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="quiz-question">
  <div class="qq-stem"><InlineContent text={question.question_text} /></div>

  <div class="qq-options">
    {#each shuffled as opt, i}
      {@const cls = !locked ? '' : i === correctDisplayIndex ? 'correct' : i === selectedDisplayIndex ? 'wrong' : 'dim'}
      <button class="qq-opt {cls}" disabled={locked} onclick={() => select(i)}>
        <span class="opt-key">{KEYS[i]}</span>
        <span class="opt-text"><MathText text={opt.item.text} /></span>
        {#if locked && i === correctDisplayIndex}<span class="opt-mark">✓</span>{/if}
        {#if locked && i === selectedDisplayIndex && !isCorrect}<span class="opt-mark">✕</span>{/if}
      </button>
    {/each}
  </div>

  {#if locked}
    <div class="qq-feedback {isCorrect ? 'is-correct' : 'is-wrong'}">
      <span class="fb-title">{isCorrect ? 'Correct' : 'Not quite'}</span>
      {#if !isCorrect && chosen.item.why}
        <p class="fb-why"><MathText text={chosen.item.why} /></p>
      {/if}
    </div>

    <div class="qq-solution"><InlineContent text={question.solution_text} /></div>

    <button class="qq-next" onclick={next}>Next →</button>
  {/if}
</div>

<style>
  .quiz-question { display: flex; flex-direction: column; gap: 1.1rem; }
  .qq-diagram { display: flex; justify-content: center; overflow-x: auto; }
  .qq-diagram :global(svg) { max-width: 100%; height: auto; }
  .qq-stem { font-size: 1.15rem; }

  .qq-options { display: flex; flex-direction: column; gap: 0.6rem; }
  .qq-opt {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    text-align: left;
    padding: 0.75rem 0.95rem;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--panel);
    color: var(--text);
    font-family: inherit;
    font-size: 0.98rem;
    cursor: pointer;
    transition: border-color 0.12s, background 0.12s;
  }
  .qq-opt:hover:not(:disabled) { border-color: var(--accent); background: var(--panel-2); }
  .qq-opt:disabled { cursor: default; }
  .opt-key {
    flex: none;
    width: 26px;
    height: 26px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--panel-2);
    color: var(--muted);
    font-size: 0.78rem;
    font-weight: 600;
  }
  .opt-text { flex: 1; }
  .opt-mark { flex: none; font-weight: 700; }

  .qq-opt.correct { border-color: var(--m-mastered); background: color-mix(in srgb, var(--m-mastered) 12%, var(--panel)); }
  .qq-opt.correct .opt-key { background: var(--m-mastered); color: #fff; }
  .qq-opt.correct .opt-mark { color: var(--m-mastered); }
  .qq-opt.wrong { border-color: #ef4444; background: color-mix(in srgb, #ef4444 12%, var(--panel)); }
  .qq-opt.wrong .opt-key { background: #ef4444; color: #fff; }
  .qq-opt.wrong .opt-mark { color: #ef4444; }
  .qq-opt.dim { opacity: 0.55; }

  .qq-feedback {
    padding: 0.85rem 1rem;
    border-radius: 12px;
    border: 1px solid var(--border);
  }
  .qq-feedback.is-correct { background: color-mix(in srgb, var(--m-mastered) 10%, var(--panel)); border-color: var(--m-mastered); }
  .qq-feedback.is-wrong { background: color-mix(in srgb, #ef4444 10%, var(--panel)); border-color: #ef4444; }
  .fb-title { font-weight: 600; }
  .qq-feedback.is-correct .fb-title { color: var(--m-mastered); }
  .qq-feedback.is-wrong .fb-title { color: #ef4444; }
  .fb-why { margin: 0.4rem 0 0; color: var(--text); font-size: 0.92rem; }

  .qq-solution {
    padding: 0.85rem 1rem;
    border-radius: 12px;
    background: var(--panel-2);
  }

  .qq-next {
    align-self: flex-end;
    padding: 0.6rem 1.3rem;
    border: none;
    border-radius: 999px;
    background: var(--accent);
    color: #fff;
    font-family: inherit;
    font-weight: 600;
    font-size: 0.92rem;
    cursor: pointer;
    transition: opacity 0.12s;
  }
  .qq-next:hover { opacity: 0.88; }
</style>
