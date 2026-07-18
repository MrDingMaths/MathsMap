<script>
  import { courses, topics, searchSkills } from '../lib/data.js';
  import { href } from '../lib/router.svelte.js';
  import Math from './Math.svelte';

  let { open = false, onClose = () => {} } = $props();
  let query = $state('');
  let inputEl = $state(null);
  let finderEl = $state(null);

  let needle = $derived(query.trim().toLowerCase());
  let courseResults = $derived(needle ? courses.filter((item) => item.title.toLowerCase().includes(needle)).slice(0, 4) : []);
  let topicResults = $derived(needle ? topics.filter((item) => item.title.toLowerCase().includes(needle)).slice(0, 6) : []);
  let skillResults = $derived(needle ? searchSkills(query).slice(0, 8) : []);
  let total = $derived(courseResults.length + topicResults.length + skillResults.length);

  $effect(() => {
    if (!open) return;
    const previousFocus = document.activeElement;
    query = '';
    requestAnimationFrame(() => inputEl?.focus());
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const focusable = [...(finderEl?.querySelectorAll('button, a[href], input, [tabindex]:not([tabindex="-1"])') ?? [])];
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previousFocus?.focus?.();
    };
  });
</script>

{#if open}
  <div class="search-backdrop" role="presentation" onclick={(event) => event.target === event.currentTarget && onClose()}>
    <div class="finder" bind:this={finderEl} role="dialog" aria-modal="true" aria-labelledby="finder-title">
      <header>
        <div>
          <span class="eyebrow">Quick finder</span>
          <h2 id="finder-title">Go anywhere</h2>
        </div>
        <button class="close" onclick={onClose} aria-label="Close search">&times;</button>
      </header>
      <label class="finder-input">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
          <path d="m16.5 16.5 4.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        <span class="sr-only">Search MathsMap</span>
        <input bind:this={inputEl} bind:value={query} placeholder="Search courses, topics and skills" autocomplete="off" />
        <kbd>Esc</kbd>
      </label>

      <div class="finder-results">
        {#if !needle}
          <p class="finder-hint">Try “fractions”, “quadratics” or the name of a skill.</p>
        {:else if total === 0}
          <p class="finder-hint">No results for “{query}”. Try a broader maths term.</p>
        {:else}
          {#if courseResults.length}
            <div class="result-group">
              <span class="group-label">Courses</span>
              {#each courseResults as item}
                <a href={href(`/course/${item.id}`)} onclick={onClose}><span><Math text={item.title} /></span><span aria-hidden="true">&rarr;</span></a>
              {/each}
            </div>
          {/if}
          {#if topicResults.length}
            <div class="result-group">
              <span class="group-label">Topics</span>
              {#each topicResults as item}
                <a href={href(`/topic/${item.id}`)} onclick={onClose}><span><Math text={item.title} /></span><span aria-hidden="true">&rarr;</span></a>
              {/each}
            </div>
          {/if}
          {#if skillResults.length}
            <div class="result-group">
              <span class="group-label">Skills</span>
              {#each skillResults as item}
                <a href={href(`/skill/${item.id}`)} onclick={onClose}><span><Math text={item.title} /></span><span aria-hidden="true">&rarr;</span></a>
              {/each}
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .search-backdrop {
    position: fixed;
    inset: 0;
    z-index: 300;
    display: grid;
    place-items: start center;
    padding: min(12vh, 6rem) 1rem 1rem;
    background: rgba(10, 12, 18, 0.58);
    backdrop-filter: blur(5px);
  }
  .finder {
    width: min(680px, 100%);
    max-height: min(680px, 78vh);
    overflow: hidden;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-xl);
    background: var(--panel);
    box-shadow: var(--shadow-lg);
  }
  header { display: flex; align-items: center; justify-content: space-between; padding: 1.1rem 1.25rem 0.8rem; }
  .eyebrow, .group-label { color: var(--muted); font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
  h2 { margin: 0.15rem 0 0; font-size: 1.35rem; }
  .close { width: 2.2rem; height: 2.2rem; border: 0; border-radius: 999px; background: var(--panel-2); color: var(--text); font-size: 1.35rem; cursor: pointer; }
  .finder-input { display: flex; align-items: center; gap: 0.7rem; margin: 0 1.25rem; padding: 0 0.9rem; height: 3.1rem; border: 1px solid var(--border-strong); border-radius: 12px; color: var(--muted); background: var(--surface-soft); }
  .finder-input:focus-within { border-color: var(--accent); box-shadow: var(--focus-ring); }
  input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--text); font: inherit; font-size: 1rem; }
  kbd { padding: 0.15rem 0.4rem; border: 1px solid var(--border-strong); border-radius: 5px; color: var(--muted); background: var(--panel); font: 0.68rem system-ui, sans-serif; }
  .finder-results { max-height: 500px; overflow-y: auto; padding: 0.9rem 1.25rem 1.25rem; }
  .finder-hint { margin: 0; padding: 2.5rem 1rem; text-align: center; color: var(--muted); }
  .result-group + .result-group { margin-top: 0.85rem; }
  .group-label { display: block; margin: 0 0 0.35rem 0.25rem; }
  .result-group a { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.65rem 0.75rem; border-radius: 9px; color: var(--text); }
  .result-group a:hover { background: var(--panel-2); color: var(--accent); text-decoration: none; }
  .finder :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
</style>
