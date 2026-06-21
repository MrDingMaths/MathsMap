<script>
  import { skillById, dependentsOf, courseById, dotpointById, topicById } from '../lib/data.js';
  import { href } from '../lib/router.svelte.js';
  import { lockedSkills } from '../lib/recommender.js';
  import { subscribe } from '../lib/store.js';
  import { loadSkillContent } from '../lib/content.js';
  import MasteryControl from '../components/MasteryControl.svelte';
  import SkillLink from '../components/SkillLink.svelte';
  import MapLink from '../components/MapLink.svelte';
  import MathText from '../components/Math.svelte';
  import Tikz from '../components/Tikz.svelte';

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
  // Split a working line into a leading `=` and the expression, so steps align on
  // the equals sign and the first (no-`=`) line sits offset under them.
  const splitEq = (math) => {
    const m = /^\$\s*=\s*([\s\S]*)\$$/.exec(math ?? '');
    return m ? { eq: '$=$', expr: '$' + m[1] + '$' } : { eq: '', expr: math ?? '' };
  };

  // Practice carousel state
  let trackEls = {};
  let carouselIdx = $state({ foundation: 0, development: 0, mastery: 0 });
  let flippedCards = $state(new Set());

  function scrollCarousel(tierKey, dir) {
    const el = trackEls[tierKey];
    if (!el || !el.children.length) return;
    const newIdx = Math.max(0, Math.min(carouselIdx[tierKey] + dir, el.children.length - 1));
    carouselIdx[tierKey] = newIdx;
    el.children[newIdx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  }
  function onTrackScroll(tierKey) {
    const el = trackEls[tierKey];
    if (!el || !el.children.length) return;
    const w = el.children[0].offsetWidth;
    if (w) carouselIdx[tierKey] = Math.round(el.scrollLeft / w);
  }
  function toggleFlip(key) {
    const next = new Set(flippedCards);
    next.has(key) ? next.delete(key) : next.add(key);
    flippedCards = next;
  }
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
          <h1><MathText text={skill.title} /></h1>
          {#if skill.blurb}<p class="blurb"><MathText text={skill.blurb} /></p>{/if}
        </div>

        <!-- teaching content -->
        {#if content}
          {#if content.theory}
            <section>
              <div class="sec-head"><span class="sec-dot accent"></span>Theory</div>
              <div class="theory">
                {#if content.theory.intro}<p class="theory-intro"><MathText text={content.theory.intro} /></p>{/if}
                {#if content.theory.facts?.length}
                  <ul class="theory-facts">
                    {#each content.theory.facts as f}<li><MathText text={f} /></li>{/each}
                  </ul>
                {/if}
                {#if content.theory.steps?.length}
                  <div class="theory-sub">Procedure</div>
                  <ol class="theory-steps">
                    {#each content.theory.steps as s}<li><MathText text={s} /></li>{/each}
                  </ol>
                {/if}
              </div>
            </section>
          {/if}

          {#if content.practice}
            <section>
              <div class="sec-head"><span class="sec-dot muted-dot"></span>Practice</div>
              {#each TIERS as tier}
                {#if content.practice[tier.key]?.length}
                  {@const items = content.practice[tier.key]}
                  <div class="ptier">
                    <div class="carousel-header">
                      <div class="ptier-head"><span class="tier-dot {tier.dot}"></span>{tier.label}</div>
                      <div class="carousel-nav">
                        <button class="cnav-btn" onclick={() => scrollCarousel(tier.key, -1)} aria-label="Previous question">‹</button>
                        <span class="cnav-pos">{carouselIdx[tier.key] + 1} / {items.length}</span>
                        <button class="cnav-btn" onclick={() => scrollCarousel(tier.key, 1)} aria-label="Next question">›</button>
                      </div>
                    </div>
                    <div class="carousel-track"
                         bind:this={trackEls[tier.key]}
                         onscroll={() => onTrackScroll(tier.key)}>
                      {#each items as item, i}
                        {@const key = `${tier.key}-${i}`}
                        {@const isFlipped = flippedCards.has(key)}
                        <div class="flip-card"
                             class:is-flipped={isFlipped}
                             role="button"
                             tabindex="0"
                             aria-label="Question {i + 1}. Press Enter or Space to flip."
                             onclick={() => toggleFlip(key)}
                             onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFlip(key); } }}>
                          <div class="flip-inner">
                            <div class="flip-front">
                              {#if item.tikz}<div class="flip-diagram"><Tikz code={item.tikz} /></div>{/if}
                              <div class="flip-q"><MathText text={item.q} /></div>
                            </div>
                            <div class="flip-back">
                              {#if item.tikz}<div class="flip-diagram"><Tikz code={item.tikz} /></div>{/if}
                              <div class="flip-back-q"><MathText text={item.q} /></div>
                              {#if item.solution?.length}
                                <ol class="wx-steps flip-sol">
                                  {#each item.solution as line, i}
                                    {@const p = splitEq(line.math)}
                                    <li>
                                      {#if i > 0}
                                        <span class="wx-note" style="grid-row:{2 * i}">{#if line.note}<MathText text={line.note} />{/if}</span>
                                      {/if}
                                      <span class="wx-eq" style="grid-row:{2 * i + 1}"><MathText text={p.eq} /></span>
                                      <span class="wx-math" style="grid-row:{2 * i + 1}"><MathText text={p.expr} /></span>
                                    </li>
                                  {/each}
                                </ol>
                              {:else}
                                <div class="flip-answer"><MathText text={item.a} /></div>
                              {/if}
                            </div>
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
              {/each}
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

  /* theory */
  .theory {
    padding: 1.1rem 1.3rem;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--panel);
  }
  .theory-intro { margin: 0 0 0.8rem; font-size: 1rem; }
  .theory-facts { margin: 0; padding-left: 1.1rem; display: flex; flex-direction: column; gap: 0.4rem; }
  .theory-facts li { font-size: 1rem; }
  .theory-sub {
    margin: 1rem 0 0.5rem;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .theory-steps { margin: 0; padding-left: 1.3rem; display: flex; flex-direction: column; gap: 0.4rem; }
  .theory-steps li { font-size: 1rem; }

  /* shared working grid (equals · expression · note) — used by practice solutions */
  .wx-steps {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: auto auto auto;
    row-gap: 0.15rem;
    column-gap: 0.55rem;
    align-items: baseline;
  }
  .wx-steps li { display: contents; }
  .wx-eq { grid-column: 1; text-align: right; font-size: 1.02rem; }
  .wx-math { grid-column: 2; font-size: 1.02rem; }
  .wx-note {
    grid-column: 3;
    justify-self: start;
    align-self: center;
    margin-left: 0.75rem;
    min-height: 0.9rem;
    font-size: 0.72rem;
    color: var(--muted);
    line-height: 1;
    white-space: nowrap;
  }

  /* practice tiers */
  .ptier { margin-top: 1.1rem; }
  .ptier-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    font-weight: 600;
  }

  /* carousel */
  .carousel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.6rem; }
  .carousel-nav { display: flex; align-items: center; gap: 0.4rem; }
  .cnav-btn {
    background: var(--panel-2);
    border: 1px solid var(--border);
    border-radius: 7px;
    width: 2rem; height: 2rem;
    cursor: pointer;
    font-size: 1.1rem;
    line-height: 1;
    display: grid;
    place-items: center;
    color: var(--text);
    transition: background 0.12s;
  }
  .cnav-btn:hover { background: var(--panel); }
  .cnav-pos { font-size: 0.8rem; color: var(--muted); min-width: 3rem; text-align: center; }
  .carousel-track {
    display: flex;
    gap: 0.8rem;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding-bottom: 0.3rem;
  }
  .carousel-track::-webkit-scrollbar { display: none; }

  /* flip card */
  .flip-card {
    flex: none;
    width: 100%;
    scroll-snap-align: start;
    perspective: 900px;
    cursor: pointer;
    outline: none;
  }
  .flip-card:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 14px; }
  .flip-inner {
    display: grid;
    transform-style: preserve-3d;
    transition: transform 0.38s ease;
  }
  .flip-card.is-flipped .flip-inner { transform: rotateY(180deg); }
  @media (prefers-reduced-motion: reduce) {
    .flip-inner { transition: none; }
  }
  .flip-front, .flip-back {
    grid-row: 1;
    grid-column: 1;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--panel);
    padding: 1rem 1.2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    min-height: 5rem;
  }
  .flip-back { transform: rotateY(180deg); align-items: flex-start; justify-content: flex-start; }
  .flip-diagram { width: 100%; display: flex; justify-content: center; overflow-x: auto; }
  .flip-diagram :global(svg) { max-width: 100%; height: auto; }
  .flip-q { font-size: 1.05rem; text-align: center; }
  .flip-back-q { font-size: 0.9rem; font-weight: 600; margin-bottom: 0.65rem; color: var(--muted); }
  .flip-answer { font-size: 1.05rem; }
  .flip-sol { margin: 0; }

  /* sidebar sections */
  .side-pills { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .side-section { display: flex; flex-direction: column; }
  .side-link-stack { display: flex; flex-direction: column; gap: 0.55rem; }
</style>
