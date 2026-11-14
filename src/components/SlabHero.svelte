<script>
  import Math from './Math.svelte';
  import MasteryBar from './MasteryBar.svelte';
  import MasteryRing from './MasteryRing.svelte';

  // Flat page header: eyebrow, title, optional lede, then one summary row with
  // the mastery figures and the page's actions (passed as the `actions` snippet).
  let { color = null, title, meta = null, eyebrow = null, lede = null, stats, unit = 'skills', actions } = $props();

  let ready = $derived(stats.mastered + stats.proficient);
  let level = $derived.by(() => {
    if (!stats.total) return 'none';
    if (stats.fullyMastered) return 'mastered';
    if (ready === stats.total) return 'proficient';
    if (stats.mastered + stats.inProgress > 0) return 'learning';
    return 'none';
  });
</script>

<header class="page-header" style={color ? `--hero-color:${color}` : ''}>
  {#if eyebrow || meta}
    <div class="eyebrow">
      {#if eyebrow}<span class="strand">{eyebrow}</span>{/if}
      {#if meta}<span>{meta}</span>{/if}
    </div>
  {/if}
  <h1><Math text={title} /></h1>
  {#if lede}<p class="lede"><Math text={lede} /></p>{/if}

  <div class="summary">
    <div class="score">
      <MasteryRing {level} size={44} />
      <div>
        <strong>{ready} of {stats.total} {unit}</strong>
        <span>proficient or better</span>
      </div>
    </div>
    <div class="breakdown">
      <MasteryBar {stats} height="6px" />
      <div class="counts">
        <span>{stats.mastered} mastered</span>
        <span>{stats.proficient} proficient</span>
        <span>{stats.learning} learning</span>
        <span>{stats.none} not started</span>
      </div>
    </div>
    {#if actions}<div class="actions">{@render actions()}</div>{/if}
  </div>
</header>

<style>
  .page-header { margin: 0.4rem 0 1.5rem; }
  .eyebrow { display: flex; flex-wrap: wrap; align-items: center; gap: 0.35rem 1rem; margin-bottom: 0.55rem; color: var(--muted); font-size: 0.86rem; font-weight: 600; }
  .strand { display: inline-flex; align-items: center; gap: 0.4rem; color: var(--text); font-weight: 800; }
  h1 { margin: 0; color: var(--text); font-size: clamp(2rem, 4.4vw, 3rem); line-height: 1.08; }
  .lede { max-width: 68ch; margin: 0.7rem 0 0; color: var(--muted); font-size: 1.08rem; }
  .summary { display: flex; flex-wrap: wrap; align-items: center; gap: 1.2rem 2rem; margin-top: 1.5rem; padding: 1.1rem 0; border-block: 1px solid var(--border); }
  .score { display: flex; align-items: center; gap: 0.85rem; }
  .score strong { display: block; font-size: 1.2rem; font-weight: 800; line-height: 1.2; }
  .score span { color: var(--muted); font-size: 0.82rem; }
  .breakdown { flex: 1 1 220px; min-width: 200px; display: flex; flex-direction: column; gap: 0.55rem; }
  .counts { display: flex; flex-wrap: wrap; gap: 0.2rem 1rem; color: var(--muted); font-size: 0.8rem; }
  .actions { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-left: auto; }
  @media (max-width: 640px) { .actions { margin-left: 0; width: 100%; } }
</style>
