<script>
  import Math from './Math.svelte';
  import MasteryBar from './MasteryBar.svelte';
  import MasteryStatus from './MasteryStatus.svelte';

  let { color, eyebrow = null, title, meta = null, stats } = $props();
</script>

<section class="hero" style="--hero-color:{color}">
  <span class="route-line" aria-hidden="true"></span>
  <div class="hero-copy">
    {#if eyebrow}<div class="eyebrow">{eyebrow}</div>{/if}
    <h1><Math text={title} /></h1>
    {#if meta}<div class="meta">{meta}</div>{/if}
  </div>
  <div class="progress-panel">
    <div class="stats">
      <span><MasteryStatus level="mastered" compact /><strong>{stats.mastered}</strong></span>
      <span><MasteryStatus level="proficient" compact /><strong>{stats.proficient}</strong></span>
      <span><MasteryStatus level="learning" compact /><strong>{stats.learning}</strong></span>
      <span><MasteryStatus level="none" compact /><strong>{stats.none}</strong></span>
    </div>
    <MasteryBar {stats} height="8px" />
  </div>
</section>

<style>
  .hero { position: relative; overflow: hidden; display: grid; grid-template-columns: minmax(0, 1fr) minmax(360px, 0.72fr); align-items: end; gap: 2rem; padding: clamp(1.5rem, 4vw, 2.25rem); margin-bottom: 0.5rem; border: 1px solid color-mix(in srgb, var(--hero-color) 24%, var(--border)); border-top: 4px solid var(--hero-color); border-radius: var(--radius-xl); background: linear-gradient(135deg, color-mix(in srgb, var(--hero-color) 8%, var(--panel)), var(--panel)); }
  .route-line { position: absolute; width: 260px; height: 150px; right: -60px; top: -75px; border: 2px dashed color-mix(in srgb, var(--hero-color) 24%, transparent); border-radius: 50%; transform: rotate(-12deg); pointer-events: none; }
  .hero-copy, .progress-panel { position: relative; z-index: 1; }
  .eyebrow { margin-bottom: 0.45rem; color: var(--hero-color); font-size: 0.7rem; font-weight: 750; letter-spacing: 0.08em; text-transform: uppercase; }
  h1 { margin: 0; color: var(--text); font-size: clamp(1.8rem, 4vw, 2.45rem); line-height: 1.06; }
  .meta { margin-top: 0.65rem; color: var(--muted); font-size: 0.83rem; }
  .progress-panel { display: flex; flex-direction: column; gap: 0.8rem; padding: 0.85rem 0.95rem; border: 1px solid var(--border); border-radius: var(--radius-md); background: color-mix(in srgb, var(--panel) 88%, transparent); }
  .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem 1rem; }
  .stats > span { display: flex; align-items: center; justify-content: space-between; gap: 0.45rem; min-width: 0; }
  .stats strong { font-family: var(--font-display); font-size: 1.05rem; }
  @media (max-width: 760px) { .hero { grid-template-columns: 1fr; gap: 1.2rem; } }
  @media (max-width: 420px) { .stats { grid-template-columns: 1fr; } }
</style>
