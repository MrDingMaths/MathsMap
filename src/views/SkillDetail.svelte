<script>
  import { skillById, dependentsOf, courseById, dotpointById, topicById } from '../lib/data.js';
  import { href } from '../lib/router.svelte.js';
  import { lockedSkills } from '../lib/recommender.js';
  import { subscribe } from '../lib/store.js';
  import MasteryControl from '../components/MasteryControl.svelte';
  import SkillLink from '../components/SkillLink.svelte';
  import MapLink from '../components/MapLink.svelte';
  import Math from '../components/Math.svelte';

  let { id, courseId = null } = $props();
  let skill = $derived(skillById.get(id));

  let locked = $state([]);
  $effect(() => subscribe(() => {
    locked = skill ? lockedSkills(skill) : [];
  }));

  let prereqs = $derived((skill?.prereqs ?? []).map((p) => skillById.get(p)).filter(Boolean));
  let unlocks = $derived((dependentsOf.get(skill?.id) ?? []).map((d) => skillById.get(d)).filter(Boolean));
  let prereqLabel = $derived(
    prereqs.length === 0 ? null : locked.length === 0 ? 'all mastered' : `${locked.length} not yet mastered`
  );
</script>

<div class="container">
  {#if skill}
    <div class="page-head">
      <div class="crumbs"><a href={href('/')}>Home</a> / Skill</div>
      <MapLink to={`/map?skill=${skill.id}${courseId ? `&course=${courseId}` : ''}`} />
    </div>

    <div class="skill-grid">
      <!-- ============ LEFT: content ============ -->
      <div>
        <div class="title-block">
          <h1><Math text={skill.title} /></h1>
          {#if skill.blurb}<p class="blurb"><Math text={skill.blurb} /></p>{/if}
          <div class="row">
            {#each skill.courses as c}
              <span class="tag"><span class="tag-dot"></span>{courseById.get(c)?.title ?? c}</span>
            {/each}
          </div>
        </div>

        <!-- syllabus -->
        <section>
          <div class="sec-head"><span class="sec-dot accent"></span>Syllabus dot points</div>
          <div class="stack">
            {#each skill.dotPointIds as dp}
              {@const d = dotpointById.get(dp)}
              {#if d}
                <div class="dp-card">
                  <span class="code">{d.code}</span>
                  <div class="dp-body">
                    <div class="dp-text"><Math text={d.text} /></div>
                    <div class="dp-topic"><Math text={topicById.get(d.topicId)?.title} /></div>
                  </div>
                </div>
              {/if}
            {/each}
          </div>
        </section>

        <!-- prerequisites -->
        <section>
          <div class="sec-head">
            <span class="sec-dot learning"></span>Prerequisites
            {#if prereqLabel}<span class="sec-pill">{prereqLabel}</span>{/if}
          </div>
          {#if prereqs.length}
            <div class="link-grid">
              {#each prereqs as pre}<SkillLink skill={pre} {courseId} variant="prereq" />{/each}
            </div>
          {:else}
            <p class="muted">None — a good entry point.</p>
          {/if}
        </section>

        <!-- needed for -->
        <section>
          <div class="sec-head">
            <span class="sec-dot mastered"></span>Needed for
            {#if unlocks.length}<span class="sec-pill">{unlocks.length} {unlocks.length === 1 ? 'skill' : 'skills'}</span>{/if}
          </div>
          {#if unlocks.length}
            <div class="link-grid">
              {#each unlocks as dep}<SkillLink skill={dep} {courseId} variant="unlock" />{/each}
            </div>
          {:else}
            <p class="muted">Nothing yet depends on this skill.</p>
          {/if}
        </section>

        <!-- practice -->
        <section>
          <div class="sec-head"><span class="sec-dot muted-dot"></span>Practice</div>
          <div class="practice">
            <div class="tiers">
              <span class="tier"><span class="tier-dot proficient"></span>Foundation</span>
              <span class="tier"><span class="tier-dot learning"></span>Development</span>
              <span class="tier"><span class="tier-dot mastered"></span>Mastery</span>
            </div>
            <p class="muted">Generated questions will appear here in Phase 4.</p>
          </div>
        </section>
      </div>

      <!-- ============ RIGHT: mastery + metadata ============ -->
      <div class="skill-side">
        <MasteryControl skillId={skill.id} />

        <div class="card meta">
          <div class="meta-row"><span class="meta-dot accent"></span><span class="meta-label">Stage</span><span class="meta-val">Stage {skill.stage}</span></div>
          <div class="meta-row"><span class="meta-dot learning"></span><span class="meta-label">Prerequisites</span><span class="meta-val">{prereqs.length}</span></div>
          <div class="meta-row"><span class="meta-dot mastered"></span><span class="meta-label">Needed for</span><span class="meta-val">{unlocks.length}</span></div>
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

  /* syllabus dot-point card */
  .dp-card {
    display: flex;
    gap: 0.85rem;
    align-items: flex-start;
    padding: 0.95rem 1.1rem;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 14px;
  }
  .dp-card .code {
    flex: none;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--accent);
    background: var(--panel-2);
    padding: 0.3rem 0.5rem;
    border-radius: 7px;
    margin-top: 1px;
  }
  .dp-body { min-width: 0; }
  .dp-text { font-size: 0.98rem; line-height: 1.45; }
  .dp-topic { font-size: 0.82rem; color: var(--muted); margin-top: 3px; }

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

  /* metadata panel */
  .meta { padding: 0.4rem 0.3rem; }
  .meta:hover { transform: none; box-shadow: none; border-color: var(--border); }
  .meta-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem 1rem; }
  .meta-dot { width: 9px; height: 9px; border-radius: 2px; flex: none; }
  .meta-dot.accent { background: var(--accent); }
  .meta-dot.learning { background: var(--m-learning); }
  .meta-dot.mastered { background: var(--m-mastered); }
  .meta-label { flex: 1; font-size: 0.88rem; color: var(--muted); }
  .meta-val { font-size: 0.88rem; font-weight: 600; }
</style>
