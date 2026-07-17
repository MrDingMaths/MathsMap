<script>
  import PracticeCard from './PracticeCard.svelte';

  // Per-tier practice carousel: index/flip state, touch/swipe, pop animation,
  // dots/arrows. `tier` is { key, label, dot }; `items` is that tier's array
  // of practice cards.
  let { tier, items } = $props();

  let trackEl = $state(null);
  let idx = $state(0);
  let flippedCards = $state(new Set());
  let flippingCards = $state(new Set());
  let isSliding = $state(false);

  function scroll(dir) {
    const n = items.length;
    if (!n) return;
    const newIdx = Math.max(0, Math.min(idx + dir, n - 1));
    if (newIdx === idx) return;
    idx = newIdx;
    // Trigger the shrink/expand "pop" that plays alongside the slide.
    isSliding = true;
    setTimeout(() => { isSliding = false; }, 340);
  }

  let touchX = 0;
  function onTouchStart(e) { touchX = e.changedTouches[0].clientX; }
  function onTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) scroll(dx < 0 ? 1 : -1);
  }

  function toggleFlip(i) {
    const next = new Set(flippedCards);
    next.has(i) ? next.delete(i) : next.add(i);
    flippedCards = next;
    // Trigger the shrink/expand "pop" that plays alongside the flip.
    flippingCards = new Set(flippingCards).add(i);
    setTimeout(() => {
      const s = new Set(flippingCards);
      s.delete(i);
      flippingCards = s;
    }, 360);
  }
</script>

<div class="ptier">
  <div class="carousel-header">
    <div class="ptier-head"><span class="tier-dot {tier.dot}"></span>{tier.label}</div>
    <div class="carousel-nav">
      <button class="cnav-btn" onclick={() => scroll(-1)} aria-label="Previous question">‹</button>
      <span class="cnav-pos">{idx + 1} / {items.length}</span>
      <button class="cnav-btn" onclick={() => scroll(1)} aria-label="Next question">›</button>
    </div>
  </div>
  <div class="carousel-viewport"
       ontouchstart={onTouchStart}
       ontouchend={onTouchEnd}>
    <div class="carousel-track"
         bind:this={trackEl}
         style="transform: translateX(calc({-idx} * (100% + 1.5rem)))">
      {#each items as item, i}
        <PracticeCard
          {item}
          index={i}
          flipped={flippedCards.has(i)}
          flipping={flippingCards.has(i) || isSliding}
          onFlip={() => toggleFlip(i)}
        />
      {/each}
    </div>
  </div>
</div>

<style>
  /* practice tiers */
  .ptier { margin-top: 1.1rem; }
  .ptier-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    font-weight: 600;
  }
  .tier-dot { width: 9px; height: 9px; border-radius: 50%; flex: none; }
  .tier-dot.learning { background: var(--m-learning); }
  .tier-dot.proficient { background: var(--m-proficient); }
  .tier-dot.mastered { background: var(--m-mastered); }

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
  .carousel-viewport { overflow: hidden; padding-bottom: 0.3rem; }
  .carousel-track {
    display: flex;
    gap: 1.5rem;
    transition: transform 0.32s cubic-bezier(0.22, 0.61, 0.36, 1);
    will-change: transform;
    touch-action: pan-y;
  }
</style>
