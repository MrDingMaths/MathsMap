<script>
  import { skills, courses, courseById, topicById, skillsForTopic } from '../lib/data.js';
  import { href } from '../lib/router.svelte.js';
  import { loadManifest, quizPool } from '../lib/manifest.js';
  import { loadSkillQuiz } from '../lib/quiz.js';
  import { allProgress, upgradeMastery } from '../lib/store.js';
  import { createSession, nextStep, answerQuestion, extendCap, getResults } from '../lib/quiz-engine.js';
  import MathText from '../components/Math.svelte';
  import QuizQuestion from '../components/QuizQuestion.svelte';
  import QuizResults from '../components/QuizResults.svelte';

  // Routes: #/quiz (global picker), #/quiz?course=<id>, #/quiz?topic=<id>[&course=<id>].
  let { topicId = null, courseId = null } = $props();

  let topic = $derived(topicId ? topicById.get(topicId) : null);
  let course = $derived(courseId ? courseById.get(courseId) : null);

  // The scope's skill ids, in stable order, deduped. `null` means "no scope
  // chosen yet" — the global course picker screen.
  let scopeSkillIds = $derived.by(() => {
    if (topicId) {
      const seen = new Set();
      const out = [];
      for (const g of skillsForTopic(topicId, courseId)) {
        for (const s of g.skills) {
          if (!seen.has(s.id)) { seen.add(s.id); out.push(s.id); }
        }
      }
      return out;
    }
    if (courseId) {
      return skills.filter((s) => (s.courses || []).includes(courseId)).map((s) => s.id);
    }
    return null;
  });

  let scopeLabel = $derived(
    topic ? topic.title : course ? course.title : null
  );

  // --- Manifest (needed to know which scope skills are quizzable) ---
  let manifestLoaded = $state(false);
  $effect(() => {
    loadManifest().then(() => { manifestLoaded = true; });
  });

  let quizzableIds = $derived(
    manifestLoaded && scopeSkillIds ? quizPool(scopeSkillIds) : []
  );

  // --- Course picker (no scope in the URL) ---
  const orderedCourses = [...courses].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  function quizzableCountFor(cId) {
    if (!manifestLoaded) return 0;
    const ids = skills.filter((s) => (s.courses || []).includes(cId)).map((s) => s.id);
    return quizPool(ids).length;
  }

  // --- Session state machine ---
  // phase: 'intro' | 'loading' | 'quiz' | 'cap' | 'results'
  let phase = $state('intro');
  let session = null; // plain engine session object — mutated in place by the engine
  let currentStep = $state(null); // {type:'question', skillId, question}
  let answeredCount = $state(0);
  let cap = $state(20);
  let sessionResults = $state(null);
  let startError = $state('');

  function resetForScopeChange() {
    phase = 'intro';
    session = null;
    currentStep = null;
    sessionResults = null;
    startError = '';
    answeredCount = 0;
  }
  // Re-derive scope key so switching topic/course (without remount) resets state.
  let scopeKey = $derived(`${topicId ?? ''}|${courseId ?? ''}`);
  let lastScopeKey = null;
  $effect(() => {
    if (scopeKey !== lastScopeKey) {
      lastScopeKey = scopeKey;
      resetForScopeChange();
    }
  });

  async function start() {
    if (!quizzableIds.length) return;
    phase = 'loading';
    startError = '';
    try {
      const entries = await Promise.all(
        quizzableIds.map(async (id) => [id, await loadSkillQuiz(id)])
      );
      const quizzes = Object.fromEntries(entries.filter(([, q]) => q));

      const progress = allProgress();
      const initialMastery = Object.fromEntries(
        Object.entries(progress).map(([id, rec]) => [id, rec.level])
      );

      session = createSession({
        skills,
        scopeSkillIds,
        quizzes,
        initialMastery,
        seed: Math.floor(Math.random() * 1_000_000_000) + 1
      });
      cap = session.cap;
      advance();
    } catch (err) {
      console.error('Quiz start failed:', err);
      startError = 'Could not load the quiz content. Please try again.';
      phase = 'intro';
    }
  }

  function advance() {
    const step = nextStep(session);
    answeredCount = session.answeredCount;
    cap = session.cap;
    if (step.type === 'done') {
      if (step.reason === 'cap') {
        phase = 'cap';
      } else {
        finish();
      }
    } else {
      currentStep = step;
      phase = 'quiz';
    }
  }

  function handleAnswer(originalIndex) {
    const result = answerQuestion(session, originalIndex);
    for (const w of result.writes) upgradeMastery(w.id, w.level, 'quiz');
    advance();
  }

  function keepGoing() {
    extendCap(session, 10);
    advance();
  }

  function finish() {
    sessionResults = getResults(session);
    phase = 'results';
  }
</script>

<div class="container quiz-view">
  {#if scopeSkillIds === null}
    <!-- ===== GLOBAL PICKER: no topic/course in the URL ===== -->
    <h1>Diagnostic quiz</h1>
    <p class="lede">Pick a course to check what you already know. The quiz adapts as you go —
      pass a skill and its prerequisites are assumed too; struggle, and anything built on it is skipped.</p>
    <div class="picker-grid">
      {#each orderedCourses as c}
        {@const n = quizzableCountFor(c.id)}
        <a class="picker-card" class:disabled={manifestLoaded && n === 0} href={n > 0 ? href(`/quiz?course=${c.id}`) : undefined}>
          <span class="picker-title" style="background:{c.color}">{c.title}</span>
          <span class="picker-count muted">
            {#if !manifestLoaded}Loading…{:else if n > 0}{n} quizzable {n === 1 ? 'skill' : 'skills'}{:else}No quiz content yet{/if}
          </span>
        </a>
      {/each}
    </div>

  {:else if phase === 'intro'}
    <!-- ===== INTRO / SCOPE CONFIRM ===== -->
    <div class="crumbs"><a href={href('/')}>Home</a> / Diagnostic quiz</div>
    <h1>Check my skills{#if scopeLabel}: <MathText text={scopeLabel} />{/if}</h1>
    <p class="lede">
      {#if !manifestLoaded}
        Loading quiz content…
      {:else if quizzableIds.length === 0}
        No quizzable skills in this scope yet — check back once quizzes have been authored.
      {:else}
        {quizzableIds.length} of {scopeSkillIds.length} {scopeSkillIds.length === 1 ? 'skill has' : 'skills have'} a quiz ready. One question at a time; you can stop anytime.
      {/if}
    </p>
    {#if startError}<p class="error">{startError}</p>{/if}
    <button class="start-btn" disabled={!manifestLoaded || quizzableIds.length === 0} onclick={start}>
      Start quiz
    </button>

  {:else if phase === 'loading'}
    <div class="loading-state">Preparing your quiz…</div>

  {:else if phase === 'quiz'}
    <!-- ===== QUESTION LOOP ===== -->
    <div class="quiz-head">
      <span class="progress">Question {answeredCount + 1}{cap ? ` of ${cap}` : ''}</span>
      <button class="finish-early" onclick={finish}>Finish early</button>
    </div>
    {#if currentStep}
      {#key currentStep.question.id}
        <QuizQuestion question={currentStep.question} onAnswer={handleAnswer} />
      {/key}
    {/if}

  {:else if phase === 'cap'}
    <!-- ===== CAP REACHED ===== -->
    <div class="cap-screen">
      <h2>{answeredCount} questions answered</h2>
      <p class="lede">You've hit the question cap for this session. Keep going for another round, or see how you did.</p>
      <div class="cap-actions">
        <button class="start-btn" onclick={keepGoing}>Keep going (+10)</button>
        <button class="finish-early" onclick={finish}>See results</button>
      </div>
    </div>

  {:else if phase === 'results'}
    <!-- ===== RESULTS ===== -->
    <h1>Your results</h1>
    <QuizResults results={sessionResults} {courseId} {scopeLabel} />
  {/if}
</div>

<style>
  .quiz-view { max-width: 760px; }
  h1 { font-size: 1.75rem; }
  .lede { color: var(--muted); font-size: 0.95rem; max-width: 60ch; }
  .error { color: #ef4444; font-size: 0.9rem; }

  .picker-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.85rem; margin-top: 1.4rem; }
  .picker-card {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 1rem 1.1rem;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--panel);
    color: var(--text);
  }
  .picker-card:hover { border-color: var(--accent); text-decoration: none; }
  .picker-card.disabled { opacity: 0.5; pointer-events: none; }
  .picker-title { align-self: flex-start; font-size: 0.95rem; font-weight: 600; color: #fff; padding: 0.35rem 0.75rem; border-radius: 999px; }
  .picker-count { font-size: 0.8rem; }

  .start-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 999px;
    background: var(--accent);
    color: #fff;
    font-family: inherit;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    margin-top: 0.4rem;
  }
  .start-btn:disabled { opacity: 0.5; cursor: default; }
  .start-btn:hover:not(:disabled) { opacity: 0.9; }

  .loading-state { padding: 3rem 0; text-align: center; color: var(--muted); }

  .quiz-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.2rem; }
  .progress { font-size: 0.85rem; color: var(--muted); font-weight: 500; }
  .finish-early {
    padding: 0.4rem 0.9rem;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: transparent;
    color: var(--muted);
    font-family: inherit;
    font-size: 0.8rem;
    cursor: pointer;
  }
  .finish-early:hover { border-color: var(--accent); color: var(--accent); }

  .cap-screen { text-align: center; padding: 2rem 0; }
  .cap-screen .lede { max-width: 48ch; margin: 0.5rem auto 1.2rem; }
  .cap-actions { display: flex; gap: 0.7rem; justify-content: center; }
</style>
