<script>
  import PracticeCard from './PracticeCard.svelte';

  let { tier, items } = $props();
  let idx = $state(0);
  let flippedCards = $state(new Set());
  let flippingCards = $state(new Set());
  let isSliding = $state(false);

  let tierNumber = $derived(tier.key === 'foundation' ? 1 : tier.key === 'development' ? 2 : 3);
  let progress = $derived(items.length ? ((idx + 1) / items.length) * 100 : 0);

  function scroll(dir) {
    const newIdx = Math.max(0, Math.min(idx + dir, items.length - 1));
    if (newIdx === idx) return;
    idx = newIdx;
    isSliding = true;
    setTimeout(() => { isSliding = false; }, 340);
  }

  let touchX = 0;
  function onTouchStart(event) { touchX = event.changedTouches[0].clientX; }
  function onTouchEnd(event) {
    const dx = event.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) scroll(dx < 0 ? 1 : -1);
  }

  function toggleFlip(i) {
    const next = new Set(flippedCards);
    next.has(i) ? next.delete(i) : next.add(i);
    flippedCards = next;
    flippingCards = new Set(flippingCards).add(i);
    setTimeout(() => {
      const remaining = new Set(flippingCards);
      remaining.delete(i);
      flippingCards = remaining;
    }, 360);
  }
</script>

<section class="practice-tier" aria-labelledby="tier-{tier.key}">
  <div class="carousel-header">
    <div class="tier-heading"><span class="tier-number" aria-hidden="true">{tierNumber}</span><div><span class="tier-kicker">Practice level</span><h3 id="tier-{tier.key}">{tier.label}</h3></div></div>
    <span class="position">Question {idx + 1} of {items.length}</span>
  </div>
  <div class="progress-track" role="progressbar" aria-label={`${tier.label} question progress`} aria-valuemin="1" aria-valuemax={items.length} aria-valuenow={idx + 1}><span style="width:{progress}%"></span></div>
  <div class="carousel-viewport" role="group" aria-label={`${tier.label} practice cards`} ontouchstart={onTouchStart} ontouchend={onTouchEnd}>
    <div class="carousel-track" style="transform: translateX(calc({-idx} * (100% + 1.5rem)))">
      {#each items as item, i}
        <PracticeCard {item} index={i} flipped={flippedCards.has(i)} flipping={flippingCards.has(i) || isSliding} onFlip={() => toggleFlip(i)} />
      {/each}
    </div>
  </div>
  <div class="carousel-nav">
    <button onclick={() => scroll(-1)} disabled={idx === 0}><span aria-hidden="true">&larr;</span> Previous</button>
    <span>Tap the card to show the worked solution</span>
    <button onclick={() => scroll(1)} disabled={idx === items.length - 1}>Next <span aria-hidden="true">&rarr;</span></button>
  </div>
</section>

<style>
  .practice-tier { margin-top: 1.35rem; }
  .carousel-header { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin-bottom: 0.55rem; }
  .tier-heading { display: flex; align-items: center; gap: 0.65rem; }
  .tier-number { display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: 9px; background: var(--surface-soft); color: var(--text); font-weight: 750; }
  .tier-kicker { display: block; color: var(--muted); font-size: 0.62rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; }
  h3 { margin: 0; font-size: 0.95rem; }
  .position { color: var(--muted); font-size: 0.76rem; font-weight: 650; }
  .progress-track { height: 4px; margin-bottom: 0.75rem; overflow: hidden; border-radius: 999px; background: var(--track); }
  .progress-track span { display: block; height: 100%; border-radius: inherit; background: var(--accent); transition: width var(--motion-base) var(--ease-out); }
  .carousel-viewport { overflow: hidden; padding: 0.15rem 0 0.3rem; }
  .carousel-track { display: flex; gap: 1.5rem; transition: transform var(--motion-slow) var(--ease-out); will-change: transform; touch-action: pan-y; }
  .carousel-nav { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 1rem; margin-top: 0.55rem; }
  .carousel-nav button { min-height: 38px; padding: 0.45rem 0.75rem; border: 1px solid var(--border-strong); border-radius: 9px; background: var(--panel); color: var(--text); font: 650 0.78rem var(--font-body); cursor: pointer; }
  .carousel-nav button:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
  .carousel-nav button:disabled { opacity: 0.35; cursor: default; }
  .carousel-nav > span { color: var(--muted); font-size: 0.7rem; text-align: center; }
  @media (max-width: 520px) { .carousel-nav { grid-template-columns: 1fr 1fr; } .carousel-nav > span { display: none; } .position { font-size: 0.7rem; } }
</style>
