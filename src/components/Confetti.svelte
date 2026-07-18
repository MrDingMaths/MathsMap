<script>
  import { onMount } from 'svelte';

  let { active = false, count = 150 } = $props();
  let canvas = $state(null);

  const colors = [
    '#fde047', '#facc15', '#a3e635', '#4ade80', '#34d399', '#2dd4bf',
    '#67e8f9', '#7dd3fc', '#93c5fd', '#a5b4fc', '#c4b5fd', '#d8b4fe',
    '#f0abfc', '#f9a8d4'
  ];

  onMount(() => {
    if (!active || !canvas) return;

    const context = canvas.getContext('2d');
    let frame = 0;
    let stopped = false;
    const pieces = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function createPiece() {
      const size = Math.random() * 10 + 5;
      return {
        x: canvas.width * Math.random(),
        y: -20 - Math.random() * 80,
        size,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: Math.random() * 10 - 5,
        vy: Math.random() * 5 + 2,
        angle: Math.random() * Math.PI * 2,
        spin: Math.random() * 0.2 - 0.1
      };
    }

    function animate() {
      context.clearRect(0, 0, canvas.width, canvas.height);
      for (let index = pieces.length - 1; index >= 0; index--) {
        const piece = pieces[index];
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.angle += piece.spin;
        context.save();
        context.translate(piece.x, piece.y);
        context.rotate(piece.angle);
        context.fillStyle = piece.color;
        context.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
        context.restore();
        if (piece.y > canvas.height + piece.size) pieces.splice(index, 1);
      }

      if (pieces.length && !stopped) frame = requestAnimationFrame(animate);
      else frame = 0;
    }

    resize();
    window.addEventListener('resize', resize);
    for (let index = 0; index < count; index++) pieces.push(createPiece());
    frame = requestAnimationFrame(animate);

    return () => {
      stopped = true;
      if (frame) cancelAnimationFrame(frame);
      context.clearRect(0, 0, canvas.width, canvas.height);
      window.removeEventListener('resize', resize);
    };
  });
</script>

{#if active}
  <canvas bind:this={canvas} class="confetti" aria-hidden="true"></canvas>
{/if}

<style>
  .confetti { position: fixed; inset: 0; z-index: 9999; width: 100%; height: 100%; pointer-events: none; }
</style>
