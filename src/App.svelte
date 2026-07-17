<script>
  import { route, href } from './lib/router.svelte.js';
  import { theme } from './lib/theme.svelte.js';
  import Home from './views/Home.svelte';
  import Course from './views/Course.svelte';
  import Topic from './views/Topic.svelte';
  import SkillDetail from './views/SkillDetail.svelte';
  import Map from './views/Map.svelte';
  import Quiz from './views/Quiz.svelte';
  import TikzCheck from './views/TikzCheck.svelte';

  $effect(() => {
    document.documentElement.setAttribute('data-theme', theme.current);
  });
</script>

<nav class="top">
  <span class="brand"><a href={href('/')}>
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none" aria-hidden="true">
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
  <a href={href('/')} class="navlink {['home', 'course', 'topic', 'skill'].includes(route.name) ? 'active' : ''}">Browse</a>
  <a href={href('/map')} class="navlink {route.name === 'map' ? 'active' : ''}">Map</a>
  <button
    class="dark-mode-toggle"
    role="switch"
    aria-checked={theme.current === 'dark' ? 'true' : 'false'}
    aria-label="Toggle dark mode"
    onclick={() => theme.toggle()}
  >
    <span class="knob">
      <span class="icon">{theme.current === 'dark' ? '🌙' : '☀️'}</span>
    </span>
  </button>
</nav>

<style>
  .dark-mode-toggle {
    margin-left: auto;
    position: relative;
    width: 52px;
    height: 28px;
    background: #e5e7eb;
    border: none;
    border-radius: 14px;
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    transition: background 0.25s ease;
  }
  .dark-mode-toggle[aria-checked="true"] {
    background: #1e3a5f;
  }
  .dark-mode-toggle .knob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 24px;
    height: 24px;
    background: #ffffff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    line-height: 1;
    transition: transform 0.25s ease, background 0.25s ease;
  }
  .dark-mode-toggle[aria-checked="true"] .knob {
    transform: translateX(24px);
    background: #000000;
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
{:else if route.name === 'quiz'}
  <Quiz topicId={route.query.topic ?? null} courseId={route.query.course ?? null} />
{:else if route.name === 'tikz-check' && import.meta.env.DEV}
  <TikzCheck topicId={route.query.topic ?? null} ids={route.query.ids ?? null} />
{:else}
  <div class="container"><p class="muted">Page not found. <a href={href('/')}>Go home</a>.</p></div>
{/if}
