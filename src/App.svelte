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
  <span class="brand"><a href={href('/')}><span class="logo">M</span>MathsMap</a></span>
  <a href={href('/')} class="navlink {route.name === 'home' ? 'active' : ''}">Browse</a>
  <a href={href('/map')} class="navlink {route.name === 'map' ? 'active' : ''}">Map</a>
  <a href={href('/progress')} class="navlink {route.name === 'progress' ? 'active' : ''}">Progress</a>
  <button class="theme-toggle" onclick={() => theme.toggle()}>
    {theme.current === 'dark' ? 'Light' : 'Dark'}
  </button>
</nav>

<style>
  .theme-toggle {
    margin-left: auto;
    background: var(--panel-2);
    border: 1px solid var(--border);
    border-radius: 7px;
    color: var(--text);
    cursor: pointer;
    font-family: inherit;
    font-size: 0.78rem;
    font-weight: 500;
    padding: 0.35rem 0.75rem;
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
  <Map
    courseId={route.query.course ?? null}
    skillId={route.query.skill ?? null}
    topicId={route.query.topic ?? null}
  />
{:else if route.name === 'progress'}
  <Progress />
{:else}
  <div class="container"><p class="muted">Page not found. <a href={href('/')}>Go home</a>.</p></div>
{/if}
