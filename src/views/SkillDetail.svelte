<script>
  import { skillById, dependentsOf, courseById, dotpointById, topicById } from '../lib/data.js';
  import { href } from '../lib/router.svelte.js';
  import { lockedSkills } from '../lib/recommender.js';
  import { subscribe } from '../lib/store.js';
  import MasteryControl from '../components/MasteryControl.svelte';
  import SkillLink from '../components/SkillLink.svelte';
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
    <div class="crumbs"><a href={href('/')}>Home</a> / Skill</div>

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
            <a class="map-link" href={href(`/map?skill=${skill.id}${courseId ? `&course=${courseId}` : ''}`)}>
              <svg viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M16 3.99146C16 5.09602 15.1046 5.99146 14 5.99146C13.7734 5.99146 13.5557 5.95379 13.3527 5.88437L12.0688 7.82743C12.64 8.37148 12.9969 9.13844 13 9.98879L14.1703 10.1912C14.4809 9.48955 15.1833 9 16 9C17.1046 9 18 9.89543 18 11C18 12.1046 17.1046 13 16 13C14.9554 13 14.0979 12.1992 14.0078 11.178L12.8378 10.9756C12.59 11.6965 12.0752 12.2933 11.4115 12.6478L11.856 14.0051C11.9036 14.0017 11.9516 14 12 14C13.1046 14 14 14.8954 14 16C14 17.1046 13.1046 18 12 18C10.8954 18 10 17.1046 10 16C10 15.2983 10.3614 14.681 10.9082 14.324L10.463 12.9645C10.3121 12.9879 10.1575 13 10 13C9.01183 13 8.13525 12.5222 7.58865 11.7851L5.95411 12.572C5.98416 12.7099 6 12.8531 6 13C6 14.1046 5.10457 15 4 15C2.89543 15 2 14.1046 2 13C2 11.8954 2.89543 11 4 11C4.5986 11 5.13578 11.263 5.5023 11.6797L7.1353 10.8935C7.04737 10.6113 7 10.3112 7 10C7 9.22726 7.29216 8.52275 7.77205 7.99092L6.83676 6.81707C6.58219 6.9345 6.29875 7 6 7C4.89543 7 4 6.10457 4 5C4 3.89543 4.89543 3 6 3C7.10457 3 8 3.89543 8 5C8 5.4434 7.85571 5.8531 7.61152 6.18471L8.55581 7.36985C8.98423 7.13411 9.47645 7 10 7C10.4423 7 10.8622 7.09571 11.2402 7.26753L12.5177 5.33412C12.196 4.97918 12 4.5082 12 3.99146C12 2.88689 12.8954 1.99146 14 1.99146C15.1046 1.99146 16 2.88689 16 3.99146ZM15 3.99146C15 3.43917 14.5523 2.99146 14 2.99146C13.4477 2.99146 13 3.43917 13 3.99146C13 4.54374 13.4477 4.99146 14 4.99146C14.5523 4.99146 15 4.54374 15 3.99146ZM6 6C6.55228 6 7 5.55228 7 5C7 4.44772 6.55228 4 6 4C5.44772 4 5 4.44772 5 5C5 5.55228 5.44772 6 6 6ZM10 12C11.1046 12 12 11.1046 12 10C12 8.89543 11.1046 8 10 8C8.89543 8 8 8.89543 8 10C8 11.1046 8.89543 12 10 12ZM5 13C5 12.4477 4.55228 12 4 12C3.44772 12 3 12.4477 3 13C3 13.5523 3.44772 14 4 14C4.55228 14 5 13.5523 5 13ZM13 16C13 15.4477 12.5523 15 12 15C11.4477 15 11 15.4477 11 16C11 16.5523 11.4477 17 12 17C12.5523 17 13 16.5523 13 16ZM16 12C16.5523 12 17 11.5523 17 11C17 10.4477 16.5523 10 16 10C15.4477 10 15 10.4477 15 11C15 11.5523 15.4477 12 16 12Z"/></svg>
              View on map
            </a>
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
