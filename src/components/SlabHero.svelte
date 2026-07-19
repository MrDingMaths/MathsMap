<script>
  import Math from './Math.svelte';
  import MasteryBar from './MasteryBar.svelte';
  import MasteryStatus from './MasteryStatus.svelte';

  let { color, eyebrow = null, title, meta = null, stats } = $props();
</script>

<section class="hero" style="--hero-color:{color}">
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
  .hero { position: relative; overflow: hidden; display: grid; grid-template-columns: minmax(0, 1fr) minmax(360px, 0.72fr); align-items: end; gap: 2rem; padding: clamp(1.5rem, 4vw, 2.25rem); margin-bottom: 0.5rem; border: 1px solid var(--border-strong); border-radius: var(--radius-xl); background: radial-gradient(135% 160% at 100% 0%, color-mix(in srgb, var(--hero-color) 11%, var(--panel)) 0%, var(--surface-warm) 48%, var(--panel) 100%); box-shadow: var(--shadow); }
  .hero-copy, .progress-panel { position: relative; z-index: 1; }
  .eyebrow { margin-bottom: 0.45rem; color: var(--hero-color); font-size: 0.7rem; font-weight: 750; letter-spacing: 0.08em; text-transform: uppercase; }
  h1 { margin: 0; color: var(--text); font-size: clamp(1.8rem, 4vw, 2.45rem); line-height: 1.06; }
  .meta { margin-top: 0.65rem; color: var(--muted); font-size: 0.83rem; }
  .progress-panel { display: flex; flex-direction: column; gap: 0.8rem; padding: 0.85rem 0.95rem; border: 1px solid var(--border-strong); border-radius: var(--radius-md); background: color-mix(in srgb, var(--panel) 92%, transparent); box-shadow: var(--shadow-rest); }
  .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem 1rem; }
  .stats > span { display: flex; align-items: center; justify-content: space-between; gap: 0.45rem; min-width: 0; }
  .stats strong { font-family: var(--font-display); font-size: 1.05rem; }
  @media (max-width: 760px) { .hero { grid-template-columns: 1fr; gap: 1.2rem; } }
  @media (max-width: 420px) { .stats { grid-template-columns: 1fr; } }
</style>
