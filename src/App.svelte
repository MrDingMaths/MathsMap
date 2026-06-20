<script>
  import { route, href } from './lib/router.svelte.js';
  import { theme } from './lib/theme.svelte.js';
  import Home from './views/Home.svelte';
  import Course from './views/Course.svelte';
  import Topic from './views/Topic.svelte';
  import SkillDetail from './views/SkillDetail.svelte';
  import Map from './views/Map.svelte';

  $effect(() => {
    document.documentElement.setAttribute('data-theme', theme.current);
  });
</script>

<nav class="top">
  <span class="brand"><a href={href('/')}>
    <svg width="30" height="30" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <line x1="10" y1="38" x2="10" y2="13" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
      <line x1="10" y1="13" x2="24" y2="27" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
      <line x1="24" y1="27" x2="38" y2="13" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
      <line x1="38" y1="13" x2="38" y2="38" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="10" cy="13" r="4.2" fill="var(--bg)" stroke="currentColor" stroke-width="2.4"/>
      <circle cx="38" cy="13" r="4.2" fill="var(--bg)" stroke="currentColor" stroke-width="2.4"/>
      <circle cx="24" cy="27" r="4.2" fill="#E8443A"/>
      <circle cx="10" cy="38" r="4.2" fill="var(--bg)" stroke="currentColor" stroke-width="2.4"/>
      <circle cx="38" cy="38" r="4.2" fill="var(--bg)" stroke="currentColor" stroke-width="2.4"/>
    </svg><span>Maths<span class="accent">Map</span></span>
  </a></span>
  <a href={href('/')} class="navlink {route.name === 'home' ? 'active' : ''}">Browse</a>
  <a href={href('/map')} class="navlink {route.name === 'map' ? 'active' : ''}">Map</a>
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
{:else}
  <div class="container"><p class="muted">Page not found. <a href={href('/')}>Go home</a>.</p></div>
{/if}
