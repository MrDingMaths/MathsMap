<script>
  import { route, href } from './lib/router.svelte.js';
  import { theme } from './lib/theme.svelte.js';
  import Home from './views/Home.svelte';
  import Course from './views/Course.svelte';
  import Topic from './views/Topic.svelte';
  import SkillDetail from './views/SkillDetail.svelte';
  import Map from './views/Map.svelte';
  import Progress from './views/Progress.svelte';

  $effect(() => {
    document.documentElement.setAttribute('data-theme', theme.current);
  });
</script>

<nav class="top">
  <span class="brand"><a href={href('/')} style="color:var(--text)">▲ MathsMap</a></span>
  <a href={href('/')} class={route.name === 'home' ? 'active' : ''}>Browse</a>
  <a href={href('/map')} class={route.name === 'map' ? 'active' : ''}>Map</a>
  <a href={href('/progress')} class={route.name === 'progress' ? 'active' : ''}>Progress</a>
  <button class="theme-toggle" onclick={() => theme.toggle()}>
    {theme.current === 'dark' ? 'Light' : 'Dark'}
  </button>
</nav>

<style>
  .theme-toggle {
    margin-left: auto;
    background: var(--panel-2);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.3rem 0.75rem;
    line-height: 1;
    transition: background 0.12s;
  }
  .theme-toggle:hover {
    background: var(--border);
  }
</style>

{#if route.name === 'home'}
  <Home />
{:else if route.name === 'course'}
  <Course id={route.params[0]} />
{:else if route.name === 'topic'}
  <Topic id={route.params[0]} courseId={route.query.course ?? null} />
{:else if route.name === 'skill'}
  <SkillDetail id={route.params[0]} courseId={route.query.course ?? null} />
{:else if route.name === 'map'}
  <Map courseId={route.query.course ?? null} />
{:else if route.name === 'progress'}
  <Progress />
{:else}
  <div class="container"><p class="muted">Page not found. <a href={href('/')}>Go home</a>.</p></div>
{/if}
