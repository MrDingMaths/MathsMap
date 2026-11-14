<script>
  import { skills, courses, skillById, courseById, topicById, skillsForTopic } from '../lib/data.js';
  import { href } from '../lib/router.svelte.js';
  import { loadManifest, quizPool } from '../lib/manifest.js';
  import { loadSkillQuiz } from '../lib/quiz.js';
  import { allProgress, upgradeMastery } from '../lib/store.js';
  import { createSession, nextStep, answerQuestion, extendCap, getResults } from '../lib/quiz-engine.js';
  import { shouldCelebrateQuiz } from '../lib/quiz-ui.js';
  import { saveQuizResult } from '../lib/quiz-history.js';
  import MathText from '../components/Math.svelte';
  import QuizQuestion from '../components/QuizQuestion.svelte';
  import QuizResults from '../components/QuizResults.svelte';

  // Routes: #/quiz (global picker), #/quiz?course=<id>,
  // #/quiz?topic=<id>[&course=<id>], #/quiz?skill=<id>[&course=<id>].
  let { skillId = null, topicId = null, courseId = null } = $props();

  let skill = $derived(skillId ? skillById.get(skillId) : null);
  let topic = $derived(topicId ? topicById.get(topicId) : null);
  let course = $derived(courseId ? courseById.get(courseId) : null);

  // The scope's skill ids, in stable order, deduped. `null` means "no scope
  // chosen yet" — the global course picker screen.
  let scopeSkillIds = $derived.by(() => {
    if (skillId) return skill ? [skill.id] : [];
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
    skill ? skill.title : topic ? topic.title : course ? course.title : null
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
  let celebrateResults = $state(false);
  let startError = $state('');
  let answerLog = $state([]); // per-question review detail, in answer order

  function resetForScopeChange() {
    phase = 'intro';
    session = null;
    currentStep = null;
    sessionResults = null;
    celebrateResults = false;
    startError = '';
    answeredCount = 0;
    answerLog = [];
  }
  // Re-derive scope key so switching topic/course (without remount) resets state.
  let scopeKey = $derived(`${skillId ?? ''}|${topicId ?? ''}|${courseId ?? ''}`);
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
    const { skillId, question } = currentStep;
    const result = answerQuestion(session, originalIndex);
    for (const w of result.writes) upgradeMastery(w.id, w.level, 'quiz');
    answerLog.push({
      skillId,
      questionId: question.id,
      questionText: question.question_text,
      solutionText: question.solution_text,
      options: question.options,
      chosenIndex: originalIndex,
      correctIndex: result.correctIndex,
      correct: result.correct
    });
    advance();
  }

  function keepGoing() {
    extendCap(session, 10);
    advance();
  }

  function finish() {
    celebrateResults = shouldCelebrateQuiz(session?.log);
    sessionResults = getResults(session);
    saveQuizResult({
      scopeLabel,
      courseId,
      scopeSkillIds,
      results: sessionResults,
      answerLog: answerLog.slice()
    });
    phase = 'results';
  }
</script>

<div class="container quiz-view">
  {#if scopeSkillIds === null}
    <!-- ===== GLOBAL PICKER: no topic/course in the URL ===== -->
    <h1>Diagnostic quiz</h1>
    <p class="lede">Pick a course to check what you already know. The quiz adapts as you go:
      pass a later skill and earlier skills can be counted as demonstrated; if you need practice, dependent skills wait for another time.</p>
    <a class="history-link" href={href('/quiz-history')}>See your recent quiz results &rarr;</a>
    <div class="picker-grid">
      {#each orderedCourses as c}
        {@const n = quizzableCountFor(c.id)}
        <a class="picker-card" class:disabled={manifestLoaded && n === 0} href={n > 0 ? href(`/quiz?course=${c.id}`) : undefined}>
          {#if !/^Stage/i.test(c.title)}<span class="picker-stage">Stage {c.stage}</span>{/if}
          <span class="picker-title">{c.title}</span>
          <span class="picker-count muted">
            {#if !manifestLoaded}Loading…{:else if n > 0}{n} quizzable {n === 1 ? 'skill' : 'skills'}{:else}No quiz content yet{/if}
          </span>
        </a>
      {/each}
    </div>

  {:else if phase === 'intro'}
    <!-- ===== INTRO / SCOPE CONFIRM ===== -->
    <div class="crumbs"><a href={href('/')}>Browse</a> / Diagnostic quiz</div>
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
      <!-- Question ids (q1, q2, …) are unique only within a skill, so the key
           must include the skill or consecutive skills reuse the locked card. -->
      {#key `${currentStep.skillId}:${currentStep.question.id}`}
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
    <QuizResults results={sessionResults} {answerLog} {courseId} {scopeLabel} {scopeSkillIds} celebrate={celebrateResults} />
    <a class="history-link" href={href('/quiz-history')}>See all your recent quiz results &rarr;</a>
  {/if}
</div>

<style>
  /* Sized for one question per screen: text and targets scale with the window
     so nobody needs to zoom the browser. */
  .quiz-view { max-width: 980px; font-size: clamp(1rem, 0.9rem + 0.35vw, 1.15rem); }
  h1 { font-size: clamp(1.9rem, 1.4rem + 1.6vw, 2.6rem); line-height: 1.1; }
  .lede { color: var(--muted); font-size: 1.05em; max-width: 60ch; }
  .error { color: #ef4444; font-size: 0.9rem; }

  .history-link { display: inline-block; margin-top: 0.6rem; color: var(--accent); font-size: 0.95em; font-weight: 700; }
  .picker-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 0.85rem; margin-top: 1.4rem; }
  .picker-card {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding: 1.1rem 1.2rem;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--panel);
    color: var(--text);
    transition: border-color var(--motion-fast), background var(--motion-fast);
  }
  .picker-card:hover { border-color: var(--text); text-decoration: none; }
  .picker-card:hover .picker-title { color: var(--accent); }
  .picker-card.disabled { opacity: 0.5; pointer-events: none; }
  .picker-stage { color: var(--muted); font-size: 0.85em; font-weight: 700; }
  .picker-title { font-size: 1.15em; font-weight: 800; }
  .picker-count { font-size: 0.9em; }

  .start-btn {
    min-height: 52px;
    padding: 0.8rem 1.8rem;
    border: none;
    border-radius: 10px;
    background: var(--accent);
    color: #fff;
    font-family: inherit;
    font-weight: 800;
    font-size: 1.05em;
    cursor: pointer;
    margin-top: 0.4rem;
    transition: transform var(--motion-fast) var(--ease-snap), background var(--motion-fast), box-shadow var(--motion-fast);
  }
  .start-btn:disabled { opacity: 0.5; cursor: default; }
  .start-btn:hover:not(:disabled) { background: var(--accent-strong); box-shadow: var(--shadow); transform: translateY(-1px); }
  .start-btn:active:not(:disabled) { transform: scale(0.97); }

  .loading-state { padding: 3rem 0; text-align: center; color: var(--muted); }

  .quiz-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.2rem; }
  .progress { font-size: 1em; color: var(--muted); font-weight: 700; }
  .finish-early {
    min-height: 44px;
    padding: 0.5rem 1.1rem;
    border: 1px solid var(--border-strong);
    border-radius: 10px;
    background: transparent;
    color: var(--text);
    font-family: inherit;
    font-weight: 700;
    font-size: 0.95em;
    cursor: pointer;
    transition: transform var(--motion-fast) var(--ease-snap), border-color var(--motion-fast), color var(--motion-fast), background var(--motion-fast);
  }
  .finish-early:hover { border-color: var(--border-strong); background: var(--panel-2); color: var(--accent); }
  .finish-early:active { transform: scale(0.96); }

  .cap-screen { text-align: center; padding: 2rem 0; }
  .cap-screen .lede { max-width: 48ch; margin: 0.5rem auto 1.2rem; }
  .cap-actions { display: flex; gap: 0.7rem; justify-content: center; }
</style>
