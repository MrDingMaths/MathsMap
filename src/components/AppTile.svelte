<script>
  // Coral tile with the site's glyph; MrDingMaths shows its favicon with no tile.
  let { id, size = 'md' } = $props();
</script>

{#if id === 'mrdingmaths'}
  <span class="tile ding {size}" aria-hidden="true"><img src="/mrdingmaths-icon.png" alt="" /></span>
{:else}
  <span class="tile {size}" aria-hidden="true">
    {#if id === 'mathsmap'}
      <svg viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round">
        <path d="M8 24V9l8 8 8-8v15" /><circle cx="8" cy="9" r="2.6" fill="#F87171" /><circle cx="24" cy="9" r="2.6" fill="#F87171" /><circle cx="16" cy="17" r="3" fill="#fff" /><circle cx="8" cy="24" r="2.6" fill="#F87171" /><circle cx="24" cy="24" r="2.6" fill="#F87171" />
      </svg>
    {:else if id === 'mathsbase'}
      <svg viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="2.2" stroke-linejoin="round">
        <rect x="10" y="5" width="16" height="12" rx="2.5" stroke-opacity=".55" /><rect x="8" y="10" width="16" height="12" rx="2.5" fill="#F87171" stroke-opacity=".8" /><rect x="6" y="15" width="16" height="12" rx="2.5" fill="#F87171" />
      </svg>
    {:else}
      <svg viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-linecap="round">
        <circle cx="16" cy="16" r="12" stroke-opacity=".35" stroke-width="2.4" />
        <circle cx="16" cy="16" r="12" stroke-width="2.4" stroke-dasharray="58 76" transform="rotate(-90 16 16)" />
        <path d="M11.5 12.2c1.6-.6 2.6.2 3.1 1.6l1.9 5.4c.5 1.4 1.5 2.2 3.1 1.6M20.4 12.4l-8.6 8.4" stroke-width="2.2" />
      </svg>
    {/if}
  </span>
{/if}

<style>
  .tile { width: 40px; height: 40px; flex: none; border-radius: 10px; background: #F87171; display: grid; place-items: center; }
  .tile svg { width: 28px; height: 28px; }
  .tile.sm { width: 34px; height: 34px; border-radius: 9px; }
  .tile.sm svg { width: 25px; height: 25px; }
  .tile.xs { width: 24px; height: 24px; border-radius: 6px; }
  .tile.xs svg { width: 18px; height: 18px; }
  .tile.ding { background: transparent; }
  .tile.ding img { display: block; width: 100%; height: 100%; object-fit: contain; }
</style>
