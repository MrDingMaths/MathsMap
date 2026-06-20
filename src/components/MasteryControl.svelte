<script>
  import { getMastery, setMastery, subscribe, LEVELS, MASTERY } from '../lib/store.js';

  // Sidebar mastery card for the skill page: a segmented meter showing the current
  // level, plus a vertical selector to change it. Talks only to the store.
  let { skillId } = $props();
  let current = $state('none');

  // Sync with the store on mount and whenever progress changes anywhere.
  $effect(() => subscribe(() => { current = getMastery(skillId); }));

  // The three filled segments correspond to learning/proficient/mastered.
  const SEGMENTS = ['learning', 'proficient', 'mastered'];
</script>

<div class="mc card">
  <div class="head">
    <span class="title">Your mastery</span>
    <span class="pill m-{current}">{MASTERY[current].label}</span>
  </div>

  <div class="meter">
    {#each SEGMENTS as seg, i}
      <span class="seg {MASTERY[current].fill > i ? `m-${seg}` : ''}"></span>
    {/each}
  </div>
  <div class="scale"><span>Learning</span><span>Proficient</span><span>Mastered</span></div>

  <div class="selector" role="group" aria-label="Set mastery level">
    {#each LEVELS as level}
      {@const sel = current === level}
      <button
        class="opt m-{level} {sel ? 'on' : ''}"
        onclick={(e) => { e.preventDefault(); setMastery(skillId, level); }}
      >
        <span class="marker"></span>
        <span class="label">{MASTERY[level].label}</span>
        {#if sel}<span class="check">✓</span>{/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .mc { padding: 0; overflow: hidden; }
  .mc:hover { transform: none; box-shadow: none; border-color: var(--border); }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.1rem 1.2rem 0.9rem;
  }
  .head .title { font-size: 0.95rem; font-weight: 600; }
  .pill {
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.18rem 0.65rem;
    border-radius: 999px;
    background: var(--track);
    color: var(--muted);
  }

  .meter { display: flex; gap: 5px; padding: 0 1.2rem; }
  .seg {
    flex: 1;
    height: 9px;
    border-radius: 999px;
    background: var(--track);
    transition: background 0.3s ease;
  }
  .scale {
    display: flex;
    justify-content: space-between;
    padding: 0.45rem 1.2rem 1.1rem;
    font-size: 0.68rem;
    color: var(--muted);
  }

  .selector {
    border-top: 1px solid var(--border);
    padding: 0.9rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .opt {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    width: 100%;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.9rem;
    font-weight: 500;
    padding: 0.6rem 0.8rem;
    border-radius: 11px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text);
    transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
  }
  .opt:hover:not(.on) { background: var(--panel-2); }
  .opt.on { animation: pop 0.28s ease; }

  .marker {
    width: 20px;
    height: 20px;
    flex: none;
    border-radius: 50%;
    border: 2px solid var(--border);
    transition: all 0.18s ease;
  }
  .label { flex: 1; text-align: left; }
  .check { font-weight: 700; font-size: 0.85rem; }

  /* Per-level accenting — colours come from app.css mastery vars. */
  .opt.m-learning .marker { border-color: var(--m-learning); }
  .opt.m-proficient .marker { border-color: var(--m-proficient); }
  .opt.m-mastered .marker { border-color: var(--m-mastered); }

  .opt.on.m-none { border-color: var(--muted); background: color-mix(in srgb, var(--muted) 14%, transparent); color: var(--muted); }
  .opt.on.m-learning { border-color: var(--m-learning); background: color-mix(in srgb, var(--m-learning) 15%, transparent); color: var(--m-learning); }
  .opt.on.m-proficient { border-color: var(--m-proficient); background: color-mix(in srgb, var(--m-proficient) 15%, transparent); color: var(--m-proficient); }
  .opt.on.m-mastered { border-color: var(--m-mastered); background: color-mix(in srgb, var(--m-mastered) 15%, transparent); color: var(--m-mastered); }

  .opt.on .marker { border: none; }
  .opt.on.m-none .marker { background: var(--muted); }
  .opt.on.m-learning .marker { background: var(--m-learning); }
  .opt.on.m-proficient .marker { background: var(--m-proficient); }
  .opt.on.m-mastered .marker { background: var(--m-mastered); }

  /* Status pill colour per level. */
  .pill.m-learning { background: color-mix(in srgb, var(--m-learning) 15%, transparent); color: var(--m-learning); }
  .pill.m-proficient { background: color-mix(in srgb, var(--m-proficient) 15%, transparent); color: var(--m-proficient); }
  .pill.m-mastered { background: color-mix(in srgb, var(--m-mastered) 15%, transparent); color: var(--m-mastered); }

  /* Filled meter segments. */
  .seg.m-learning { background: var(--m-learning); }
  .seg.m-proficient { background: var(--m-proficient); }
  .seg.m-mastered { background: var(--m-mastered); }

  @keyframes pop {
    0% { transform: scale(0.97); }
    55% { transform: scale(1.03); }
    100% { transform: scale(1); }
  }
</style>
