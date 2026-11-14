<script>
  import MathText from './Math.svelte';
  import InlineContent from './InlineContent.svelte';
  import { mulberry32 } from '../lib/quiz-engine.js';
  import { scaleDiagrams } from '../lib/diagram-scale.js';

  // One question, one screen. The parent is expected to remount this component
  // per question (keyed on skill + question id, since ids repeat across
  // skills) so local selection state always starts fresh — we don't watch for
  // question changes ourselves.
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
  let skipped = $state(false);
  let locked = $derived(selectedDisplayIndex !== null || skipped);
  let chosen = $derived(selectedDisplayIndex !== null ? shuffled[selectedDisplayIndex] : null);
  let isCorrect = $derived(chosen ? chosen.item.correct === true : false);
  // Guards against onAnswer firing twice for one question (e.g. a fast
  // double-click, or Enter's native synthetic click racing our own submit) —
  // without it, the second call lands after the parent has already advanced
  // `session.current` to the NEXT question and silently answers that one too.
  let submitted = false;

  const KEYS = ['A', 'B', 'C', 'D', 'E'];

  function select(i) {
    if (locked) return;
    selectedDisplayIndex = i;
  }

  function skip() {
    if (locked) return;
    skipped = true;
  }

  function next() {
    if (!locked || submitted) return;
    submitted = true;
    onAnswer(chosen ? chosen.originalIndex : -1);
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

<div class="quiz-question" use:scaleDiagrams={{ hosts: '.qq-stem, .qq-solution, .qq-opt' }}>
  <div class="qq-stem"><InlineContent text={question.question_text} class="qq-diagram" /></div>

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

  {#if !locked}
    <button class="qq-skip" onclick={skip}>I don't know</button>
  {/if}

  {#if locked}
    <div class="qq-feedback {skipped ? 'is-skipped' : isCorrect ? 'is-correct' : 'is-wrong'}">
      <span class="fb-title">{skipped ? 'Skipped' : isCorrect ? 'Correct' : 'Not quite'}</span>
      {#if !isCorrect && chosen && chosen.item.why}
        <p class="fb-why"><MathText text={chosen.item.why} /></p>
      {/if}
    </div>

    <div class="qq-solution"><InlineContent text={question.solution_text} class="qq-diagram" /></div>

    <button class="qq-next" onclick={next}>Next →</button>
  {/if}
</div>

<style>
  .quiz-question { display: flex; flex-direction: column; gap: 1.1rem; animation: question-enter var(--motion-base) var(--ease-out) both; }
  @keyframes question-enter { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes answer-correct { 0% { transform: scale(0.985); box-shadow: 0 0 0 0 color-mix(in srgb, var(--m-mastered) 42%, transparent); } 55% { transform: scale(1.012); } 100% { transform: scale(1); box-shadow: 0 0 0 10px transparent; } }
  @keyframes answer-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 55% { transform: translateX(4px); } 78% { transform: translateX(-2px); } }
  /* Diagrams and running text read small at the default InlineContent scale —
     bump both for the quiz's one-question-per-screen layout. */
  :global(.qq-diagram .inline-tikz) { margin: 1.1rem 0; }
  /* Sizes scale with the window (quiz-view sets the base font size). */
  /* Diagram width is set by the scaleDiagrams action (natural size times the
     text scale), so labels grow with the question text. */
  :global(.qq-diagram .inline-tikz svg) { max-width: 100%; height: auto; }
  :global(.qq-diagram .text-line) { font-size: 1em; }
  :global(.qq-diagram .inline-tikz) { overflow-y: hidden; }
  .qq-stem { font-size: clamp(1.3rem, 1rem + 1.1vw, 1.75rem); line-height: 1.45; }
  .qq-solution { font-size: clamp(1.05rem, 0.95rem + 0.4vw, 1.25rem); }

  .qq-options { display: flex; flex-direction: column; gap: 0.7rem; }
  .qq-opt {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    width: 100%;
    min-height: 60px;
    text-align: left;
    padding: 0.9rem 1.1rem;
    border: 1px solid var(--border-strong);
    border-radius: 14px;
    background: var(--panel);
    color: var(--text);
    font-family: inherit;
    font-size: clamp(1.1rem, 0.95rem + 0.6vw, 1.4rem);
    cursor: pointer;
    transition: border-color var(--motion-fast), background var(--motion-fast), transform var(--motion-fast) var(--ease-snap), opacity var(--motion-fast), box-shadow var(--motion-fast);
  }
  .qq-opt:hover:not(:disabled) { transform: translateX(3px); border-color: var(--border-strong); background: var(--panel-2); }
  .qq-opt:active:not(:disabled) { transform: translateX(3px) scale(0.985); }
  .qq-opt:disabled { cursor: default; }
  .opt-key {
    flex: none;
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--panel-2);
    color: var(--muted);
    font-size: 0.8em;
    font-weight: 800;
  }
  .opt-text { flex: 1; }
  .opt-mark { flex: none; font-weight: 700; }

  .qq-opt.correct { border-color: var(--m-mastered); background: color-mix(in srgb, var(--m-mastered) 12%, var(--panel)); animation: answer-correct 430ms var(--ease-out); }
  .qq-opt.correct .opt-key { background: var(--m-mastered); color: #fff; }
  .qq-opt.correct .opt-mark { color: var(--m-mastered); }
  .qq-opt.wrong { border-color: #ef4444; background: color-mix(in srgb, #ef4444 12%, var(--panel)); animation: answer-shake 260ms var(--ease-out); }
  .qq-opt.wrong .opt-key { background: #ef4444; color: #fff; }
  .qq-opt.wrong .opt-mark { color: #ef4444; }
  .qq-opt.dim { opacity: 0.55; }

  .qq-feedback {
    padding: 0.85rem 1rem;
    border-radius: 14px;
    border: 1px solid var(--border);
    animation: content-rise var(--motion-base) var(--ease-out) both;
  }
  .qq-feedback.is-correct { background: color-mix(in srgb, var(--m-mastered) 10%, var(--panel)); border-color: var(--m-mastered); }
  .qq-feedback.is-wrong { background: color-mix(in srgb, #ef4444 10%, var(--panel)); border-color: #ef4444; }
  .qq-feedback.is-skipped { background: var(--panel-2); border-color: var(--border); }
  .fb-title { font-weight: 600; }
  .qq-feedback.is-correct .fb-title { color: var(--m-mastered); }
  .qq-feedback.is-wrong .fb-title { color: #ef4444; }
  .qq-feedback.is-skipped .fb-title { color: var(--muted); }
  .fb-why { margin: 0.4rem 0 0; color: var(--text); font-size: 1rem; }

  .qq-skip {
    align-self: flex-start;
    min-height: 44px;
    padding: 0.5rem 1.1rem;
    border: 1px solid var(--border-strong);
    border-radius: 10px;
    background: transparent;
    color: var(--text);
    font-family: inherit;
    font-weight: 700;
    font-size: 1rem;
    cursor: pointer;
    transition: transform var(--motion-fast) var(--ease-snap), border-color var(--motion-fast), color var(--motion-fast), background var(--motion-fast);
  }
  .qq-skip:hover { border-color: var(--border-strong); background: var(--panel-2); color: var(--accent); }
  .qq-skip:active { transform: scale(0.96); }

  .qq-solution {
    padding: 0.85rem 1rem;
    border-radius: 14px;
    background: var(--panel-2);
    transform-origin: top;
    animation: solution-open var(--motion-slow) var(--ease-out) both;
  }
  @keyframes solution-open { from { opacity: 0; transform: translateY(-5px) scaleY(0.96); } to { opacity: 1; transform: translateY(0) scaleY(1); } }

  .qq-next {
    align-self: flex-end;
    min-height: 52px;
    padding: 0.75rem 1.8rem;
    border: none;
    border-radius: 10px;
    background: var(--primary);
    color: #fff;
    font-family: inherit;
    font-weight: 800;
    font-size: 1.1rem;
    cursor: pointer;
    transition: opacity var(--motion-fast), transform var(--motion-fast) var(--ease-snap), box-shadow var(--motion-fast);
  }
  .qq-next:hover { transform: translateY(-1px); box-shadow: var(--shadow); }
  .qq-next:active { transform: scale(0.96); }
</style>
