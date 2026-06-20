<script>
  import Math from './Math.svelte';

  // Bold gradient banner shared by the Topic and Course pages. The gradient is
  // derived from `color` (via color-mix) so it adapts to each topic/course hue,
  // and white text sits over it in both themes. `stats` carries the per-level
  // mastery breakdown produced by store.js.
  let { color, eyebrow = null, title, meta = null, stats } = $props();
</script>

<div
  class="hero"
  style="background:linear-gradient(135deg, color-mix(in srgb, {color} 78%, #000) 0%, {color} 55%, color-mix(in srgb, {color} 80%, #fff) 100%)"
>
  <span class="glow"></span>
  <div class="hero-body">
    {#if eyebrow}
      <div class="eyebrow"><span class="dot"></span>{eyebrow}</div>
    {/if}
    <h1><Math text={title} /></h1>
    {#if meta}<div class="meta">{meta}</div>{/if}
    <div class="tiles">
      <div class="tile"><div class="tile-top"><span class="tdot" style="background:var(--m-mastered)"></span>Mastered</div><div class="tnum">{stats.mastered}</div></div>
      <div class="tile"><div class="tile-top"><span class="tdot" style="background:var(--m-proficient)"></span>Proficient</div><div class="tnum">{stats.proficient}</div></div>
      <div class="tile"><div class="tile-top"><span class="tdot" style="background:var(--m-learning)"></span>Learning</div><div class="tnum">{stats.learning}</div></div>
      <div class="tile"><div class="tile-top"><span class="tdot tdot-none"></span>Not started</div><div class="tnum">{stats.none}</div></div>
    </div>
    <div class="hero-bar">
      <span style="width:{stats.masteredPct}%;background:var(--m-mastered)"></span>
      <span style="width:{stats.proficientPct}%;background:var(--m-proficient)"></span>
      <span style="width:{stats.learningPct}%;background:var(--m-learning)"></span>
    </div>
  </div>
</div>

<style>
  .hero {
    position: relative;
    overflow: hidden;
    border-radius: 18px;
    padding: 2rem 2.2rem;
    margin-bottom: 0.5rem;
    color: #fff;
  }
  .glow {
    position: absolute;
    top: -120px;
    left: -60px;
    width: 360px;
    height: 360px;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.16), transparent 60%);
    pointer-events: none;
  }
  .hero-body { position: relative; }
  .eyebrow {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.85);
    margin-bottom: 0.7rem;
  }
  .eyebrow .dot { width: 8px; height: 8px; border-radius: 999px; background: rgba(255, 255, 255, 0.85); flex: none; }
  h1 { font-size: 2.1rem; margin: 0; line-height: 1.05; color: #fff; }
  .meta { font-size: 0.85rem; color: rgba(255, 255, 255, 0.82); margin-top: 0.7rem; }

  .tiles { display: flex; gap: 0.75rem; margin-top: 1.3rem; }
  .tile {
    flex: 1;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 12px;
    padding: 0.7rem 0.85rem;
  }
  .tile-top {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.72rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.82);
    margin-bottom: 0.55rem;
  }
  .tile-top .tdot { width: 8px; height: 8px; border-radius: 999px; flex: none; }
  .tile-top .tdot-none { background: rgba(255, 255, 255, 0.55); }
  .tnum { font-size: 1.5rem; font-weight: 600; line-height: 1; }

  .hero-bar {
    display: flex;
    height: 10px;
    margin-top: 1.1rem;
    border-radius: 999px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.22);
  }
  .hero-bar > span { display: block; height: 100%; }
</style>
