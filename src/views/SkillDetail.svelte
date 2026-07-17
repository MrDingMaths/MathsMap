<script>
  import { skillById, dependentsOf, courseById, dotpointById, topicById, primaryTopicForSkill, siblingSkills } from '../lib/data.js';
  import { href } from '../lib/router.svelte.js';
  import { lockedSkills } from '../lib/recommender.js';
  import { subscribe } from '../lib/store.js';
  import { loadSkillContent, setContentCache } from '../lib/content.js';
  import { adminState, saveContent } from '../lib/admin.svelte.js';
  import MasteryControl from '../components/MasteryControl.svelte';
  import SkillLink from '../components/SkillLink.svelte';
  import MapLink from '../components/MapLink.svelte';
  import MathText from '../components/Math.svelte';
  import TheoryView from '../components/TheoryView.svelte';
  import PracticeCarousel from '../components/PracticeCarousel.svelte';
  import TheoryEditor from '../admin/TheoryEditor.svelte';
  import PracticeEditor from '../admin/PracticeEditor.svelte';

  let { id, courseId = null } = $props();
  let skill = $derived(skillById.get(id));

  // Breadcrumb parents + sibling stepper.
  let courseQuery = $derived(courseId ? `?course=${courseId}` : '');
  let topic = $derived(skill ? primaryTopicForSkill(skill.id) : null);
  let course = $derived(courseId ? courseById.get(courseId) : null);
  let siblings = $derived(skill ? siblingSkills(skill.id, courseId) : { prev: null, next: null });

  let locked = $state([]);
  $effect(() => subscribe(() => {
    locked = skill ? lockedSkills(skill) : [];
  }));

  let prereqs = $derived((skill?.prereqs ?? []).map((p) => skillById.get(p)).filter(Boolean));
  let unlocks = $derived((dependentsOf.get(skill?.id) ?? []).map((d) => skillById.get(d)).filter(Boolean));
  let prereqLabel = $derived(
    prereqs.length === 0 ? null : locked.length === 0 ? 'all mastered' : `${locked.length} not yet mastered`
  );

  // Per-skill teaching content (optional; lazy-loaded from data/content/{id}.json).
  let content = $state(null);
  $effect(() => {
    let active = true;
    content = null;
    if (skill) loadSkillContent(skill.id).then((c) => { if (active) content = c; });
    return () => { active = false; };
  });

  const TIERS = [
    { key: 'foundation', label: 'Foundation', dot: 'proficient' },
    { key: 'development', label: 'Development', dot: 'learning' },
    { key: 'mastery', label: 'Mastery', dot: 'mastered' }
  ];

  // --- Admin: persist edited content back to disk via the dev endpoint. ---
  // Always merge over the full existing content object so untouched keys
  // (skillId, atomType, per-card tikzSolution, …) survive the round-trip.
  let savedToast = $state(false);
  let saveError = $state('');

  async function persist(updated) {
    saveError = '';
    await saveContent(skill.id, updated);
    content = updated;          // reflect immediately in the view
    setContentCache(skill.id, updated); // keep the in-memory cache in sync
    savedToast = true;
    setTimeout(() => (savedToast = false), 1800);
  }

  async function saveTheory(theory) {
    try {
      await persist({ ...content, theory });
    } catch (e) { saveError = String(e.message ?? e); throw e; }
  }

  async function savePractice(practice) {
    try {
      await persist({ ...content, practice });
    } catch (e) { saveError = String(e.message ?? e); throw e; }
  }
</script>

<div class="container">
  {#if skill}
    <div class="page-head">
      <div class="crumbs">
        <a href={href('/')}>Home</a>
        {#if course} / <a href={href(`/course/${course.id}`)}>{course.title}</a>{/if}
        {#if topic} / <a href={href(`/topic/${topic.id}${courseQuery}`)}><MathText text={topic.title} /></a>{/if}
        / <MathText text={skill.title} />
      </div>
      <MapLink to={`/map?skill=${skill.id}${courseId ? `&course=${courseId}` : ''}`} />
    </div>

    <div class="skill-grid">
      <!-- ============ LEFT: content ============ -->
      <div>
        <div class="title-block">
          <h1><MathText text={skill.title} /></h1>
          {#if skill.blurb}<p class="blurb"><MathText text={skill.blurb} /></p>{/if}
        </div>

        <!-- teaching content -->
        {#if content}
          {#if content.theory || adminState.isAdmin}
            <section>
              <div class="sec-head"><span class="sec-dot accent"></span>Theory</div>
              {#if adminState.isAdmin}
                <TheoryEditor theory={content.theory ?? {}} onSave={saveTheory} />
              {:else}
                <TheoryView theory={content.theory} />
              {/if}
            </section>
          {/if}

          {#if content.practice || adminState.isAdmin}
            <section>
              <div class="sec-head"><span class="sec-dot muted-dot"></span>Practice</div>
              {#if adminState.isAdmin}
                <PracticeEditor practice={content.practice ?? {}} onSave={savePractice} />
              {:else}
              {#each TIERS as tier}
                {#if content.practice[tier.key]?.length}
                  <PracticeCarousel {tier} items={content.practice[tier.key]} />
                {/if}
              {/each}
              {/if}
            </section>
          {/if}
        {:else}
          <!-- practice placeholder (no content authored yet) -->
          <section>
            <div class="sec-head"><span class="sec-dot muted-dot"></span>Practice</div>
            <div class="practice">
              <div class="tiers">
                <span class="tier"><span class="tier-dot proficient"></span>Foundation</span>
                <span class="tier"><span class="tier-dot learning"></span>Development</span>
                <span class="tier"><span class="tier-dot mastered"></span>Mastery</span>
              </div>
              <p class="muted">Teaching content for this skill is coming soon.</p>
            </div>
          </section>
        {/if}

        {#if siblings.prev || siblings.next}
          <nav class="skill-nav" aria-label="Sibling skills">
            {#if siblings.prev}
              <a class="snav prev" href={href(`/skill/${siblings.prev.id}${courseQuery}`)}>
                <span class="snav-arrow">←</span>
                <span class="snav-title"><MathText text={siblings.prev.title} /></span>
              </a>
            {:else}<span></span>{/if}
            {#if siblings.next}
              <a class="snav next" href={href(`/skill/${siblings.next.id}${courseQuery}`)}>
                <span class="snav-title"><MathText text={siblings.next.title} /></span>
                <span class="snav-arrow">→</span>
              </a>
            {:else}<span></span>{/if}
          </nav>
        {/if}
      </div>

      <!-- ============ RIGHT: mastery + metadata ============ -->
      <div class="skill-side">
        <MasteryControl skillId={skill.id} />

        <!-- course pills -->
        <div class="side-pills">
          {#each skill.courses as c}
            <span class="tag"><span class="tag-dot"></span>{courseById.get(c)?.title ?? c}</span>
          {/each}
        </div>

        <!-- prerequisites -->
        <div class="side-section">
          <div class="sec-head">
            <span class="sec-dot learning"></span>Prerequisites
            {#if prereqLabel}<span class="sec-pill">{prereqLabel}</span>{/if}
          </div>
          {#if prereqs.length}
            <div class="side-link-stack">
              {#each prereqs as pre}<SkillLink skill={pre} {courseId} variant="prereq" />{/each}
            </div>
          {:else}
            <p class="muted">None — a good entry point.</p>
          {/if}
        </div>

        <!-- needed for -->
        <div class="side-section">
          <div class="sec-head">
            <span class="sec-dot mastered"></span>Needed for
            {#if unlocks.length}<span class="sec-pill">{unlocks.length} {unlocks.length === 1 ? 'skill' : 'skills'}</span>{/if}
          </div>
          {#if unlocks.length}
            <div class="side-link-stack">
              {#each unlocks as dep}<SkillLink skill={dep} {courseId} variant="unlock" />{/each}
            </div>
          {:else}
            <p class="muted">Nothing yet depends on this skill.</p>
          {/if}
        </div>
      </div>
    </div>
  {:else}
    <p class="muted">Unknown skill.</p>
  {/if}
</div>

<style>
  .skill-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 340px;
    gap: 2.5rem;
    align-items: start;
  }
  @media (max-width: 900px) {
    .skill-grid { grid-template-columns: 1fr; gap: 1.8rem; }
  }
  .skill-side { position: sticky; top: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
  @media (max-width: 900px) {
    .skill-side { position: static; }
  }

  .title-block h1 { font-size: 2.2rem; margin: 0 0 0.6rem; }
  .title-block .blurb { font-size: 1.05rem; color: var(--muted); margin: 0 0 1rem; max-width: 60ch; }

  /* sibling prev/next stepper */
  .skill-nav {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 2.2rem;
    padding-top: 1.2rem;
    border-top: 1px solid var(--border);
  }
  .snav {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    max-width: 48%;
    padding: 0.55rem 0.9rem;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--panel);
    color: var(--text);
    font-size: 0.92rem;
    transition: background 0.12s;
  }
  .snav:hover { background: var(--panel-2); }
  .snav.next { margin-left: auto; text-align: right; }
  .snav-arrow { color: var(--muted); flex: none; }
  .snav-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .tag { display: inline-flex; align-items: center; gap: 0.45rem; }
  .tag-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); flex: none; }

  section { margin-top: 1.8rem; }

  .sec-head {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 0.85rem;
  }
  .sec-dot { width: 9px; height: 9px; border-radius: 3px; flex: none; }
  .sec-dot.accent { background: var(--accent); }
  .sec-dot.learning { background: var(--m-learning); }
  .sec-dot.mastered { background: var(--m-mastered); }
  .sec-dot.muted-dot { background: var(--muted); }
  .sec-pill {
    text-transform: none;
    letter-spacing: 0;
    font-weight: 500;
    color: var(--muted);
    background: var(--panel-2);
    padding: 0.1rem 0.55rem;
    border-radius: 999px;
  }

  .stack { display: flex; flex-direction: column; gap: 0.6rem; }
  .link-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 0.7rem; }

  /* practice placeholder */
  .practice {
    padding: 1.6rem 1.4rem;
    border: 1px dashed var(--border);
    border-radius: 14px;
    background: var(--panel);
    text-align: center;
  }
  .tiers { display: flex; gap: 0.6rem; justify-content: center; flex-wrap: wrap; margin-bottom: 0.9rem; }
  .tier {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.9rem;
    border-radius: 10px;
    background: var(--panel-2);
    color: var(--muted);
    font-size: 0.85rem;
    font-weight: 500;
  }
  .tier-dot { width: 9px; height: 9px; border-radius: 50%; flex: none; }
  .tier-dot.learning { background: var(--m-learning); }
  .tier-dot.proficient { background: var(--m-proficient); }
  .tier-dot.mastered { background: var(--m-mastered); }

  /* sidebar sections */
  .side-pills { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .side-section { display: flex; flex-direction: column; }
  .side-link-stack { display: flex; flex-direction: column; gap: 0.55rem; }
</style>
