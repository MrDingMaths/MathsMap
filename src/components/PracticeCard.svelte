<script>
  import MathText from './Math.svelte';
  import Tikz from './Tikz.svelte';
  import SolutionSteps from './SolutionSteps.svelte';

  // Single flip-card: question on the front, worked solution (or final answer)
  // on the back. `flipping` also doubles as the carousel-slide "pop" trigger
  // (the parent carousel ORs its own sliding state into this prop), so this
  // component only needs to know one boolean to play the pop animation.
  let { item, index = 0, flipped = false, flipping = false, onFlip } = $props();
</script>

<div class="flip-card"
     class:is-flipped={flipped}
     class:is-flipping={flipping}
     role="button"
     tabindex="0"
     aria-label="Question {index + 1}. Press Enter or Space to flip."
     onclick={onFlip}
     onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFlip(); } }}>
  <div class="flip-inner">
    <div class="flip-front">
      {#if item.tikz}<div class="flip-diagram"><Tikz code={item.tikz} /></div>{/if}
      <div class="flip-q"><MathText text={item.q} /></div>
    </div>
    <div class="flip-back">
      {#if item.tikzSolution}<div class="flip-diagram"><Tikz code={item.tikzSolution} /></div>{:else if item.tikz}<div class="flip-diagram"><Tikz code={item.tikz} /></div>{/if}
      <div class="flip-back-q"><MathText text={item.q} /></div>
      {#if item.solution?.length}
        <SolutionSteps solution={item.solution} />
      {:else}
        <div class="flip-answer"><MathText text={item.a} /></div>
      {/if}
    </div>
  </div>
</div>

<style>
  /* flip card */
  .flip-card {
    flex: 0 0 100%;
    perspective: 900px;
    cursor: pointer;
    outline: none;
  }
  /* shrink → flip → expand: scale dips to 0 at the edge-on midpoint */
  .flip-card.is-flipping { animation: flip-pop 0.34s ease; }
  @keyframes flip-pop {
    0%   { transform: scale(1); }
    50%  { transform: scale(0.86); }
    100% { transform: scale(1); }
  }
  .flip-card:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 14px; }
  .flip-inner {
    display: grid;
    transform-style: preserve-3d;
    transition: transform 0.34s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .flip-card.is-flipped .flip-inner { transform: rotateY(180deg); }
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
</style>
