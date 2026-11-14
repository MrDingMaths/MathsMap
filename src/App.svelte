<script>
  import { route, href } from './lib/router.svelte.js';
  import { theme } from './lib/theme.svelte.js';
  import Home from './views/Home.svelte';
  import Course from './views/Course.svelte';
  import Topic from './views/Topic.svelte';
  import SkillDetail from './views/SkillDetail.svelte';
  import MyLearning from './views/MyLearning.svelte';
  import Map from './views/Map.svelte';
  import Quiz from './views/Quiz.svelte';
  import QuizHistory from './views/QuizHistory.svelte';
 import TikzCheck from './views/TikzCheck.svelte';
  import BookletStudioView from './views/BookletStudio.svelte';
  import GlobalSearch from './components/GlobalSearch.svelte';
  import SiteFooter from './components/SiteFooter.svelte';

  let searchOpen = $state(false);
  let routeKey = $derived(`${route.name}/${route.params.join('/')}`);

  $effect(() => {
    document.documentElement.setAttribute('data-theme', theme.current);
  });

  // The clean site look is scoped to html.site-v2; Booklet Studio and the TikZ
  // check keep their existing styling and token values.
  let siteV2 = $derived(route.name !== 'booklet' && route.name !== 'tikz-check');
  $effect(() => {
    document.documentElement.classList.toggle('site-v2', siteV2);
  });

  $effect(() => {
    const openFinder = (event) => {
      if (!event.defaultPrevented && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchOpen = true;
      }
    };
    document.addEventListener('keydown', openFinder);
    return () => document.removeEventListener('keydown', openFinder);
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
      <circle cx="24" cy="27" r="4.2" fill="var(--accent)"/>
      <circle cx="10" cy="38" r="4.2" fill="var(--bg)" stroke="currentColor" stroke-width="2.4"/>
      <circle cx="38" cy="38" r="4.2" fill="var(--bg)" stroke="currentColor" stroke-width="2.4"/>
    </svg><span>Maths<span class="accent">Map</span></span>
  </a></span>

  <div class="desktop-links">
    <a href={href('/')} class="navlink {['home', 'course', 'topic', 'skill'].includes(route.name) ? 'active' : ''}">Browse</a>
    <a href={href('/learning')} class="navlink {route.name === 'learning' ? 'active' : ''}">My learning</a>
    <a href={href('/map')} class="navlink {route.name === 'map' ? 'active' : ''}">Map</a>
  </div>

  <button class="search-trigger" onclick={() => (searchOpen = true)} aria-label="Search MathsMap">
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
      <path d="m16.5 16.5 4.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
    <span>Search</span><kbd>Ctrl K</kbd>
  </button>

  <button
    class="theme-toggle"
    role="switch"
    aria-checked={theme.current === 'dark' ? 'true' : 'false'}
    aria-label="Dark mode"
    title={theme.current === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    onclick={() => theme.toggle()}
  >
    {#if theme.current === 'dark'}
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="2" />
        <path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
    {:else}
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
      </svg>
    {/if}
  </button>
</nav>

<GlobalSearch open={searchOpen} onClose={() => (searchOpen = false)} />

{#if route.name === 'map'}
  <Map
    courseId={route.query.course ?? null}
    skillId={route.query.skill ?? null}
    topicId={route.query.topic ?? null}
    focusId={route.query.focus ?? null}
  />
{:else}
  <main class="site-content">
    {#key routeKey}
      <div class="route-stage">
        {#if route.name === 'home'}
          <Home />
        {:else if route.name === 'learning'}
          <MyLearning />
        {:else if route.name === 'course'}
          <Course id={route.params[0]} />
        {:else if route.name === 'topic'}
          <Topic id={route.params[0]} courseId={route.query.course ?? null} />
        {:else if route.name === 'skill'}
          <SkillDetail id={route.params[0]} courseId={route.query.course ?? null} />
        {:else if route.name === 'quiz'}
          <Quiz skillId={route.query.skill ?? null} topicId={route.query.topic ?? null} courseId={route.query.course ?? null} />
        {:else if route.name === 'quiz-history'}
          <QuizHistory id={route.params[0] ?? null} />
        {:else if route.name === 'booklet' && (import.meta.env.DEV || import.meta.env.VITE_BOOKLET_STUDIO === 'true')}
          <BookletStudioView initialDifficulty={route.query.difficulty ?? 'all'} projectId={route.query.project ?? null} initialStage={route.query.stage ?? 'projects'} initialOutput={route.query.output ?? null} />
        {:else if route.name === 'tikz-check' && import.meta.env.DEV}
          <TikzCheck
            topicId={route.query.topic ?? null}
            ids={route.query.ids ?? null}
            inputUrl={route.query.input ?? null}
            offset={route.query.offset ?? 0}
            limit={route.query.limit ?? null}
          />
        {:else}
          <div class="container"><p class="muted">Page not found. <a href={href('/')}>Go home</a>.</p></div>
        {/if}
      </div>
    {/key}
  </main>
{/if}

{#if route.name !== 'map' && route.name !== 'booklet'}
  <SiteFooter />
{/if}

{#if route.name !== 'map'}
  <nav class="mobile-nav" aria-label="Primary navigation">
    <a href={href('/')} class:active={['home', 'course', 'topic', 'skill'].includes(route.name)}><span aria-hidden="true">&#9638;</span>Browse</a>
    <a href={href('/learning')} class:active={route.name === 'learning'}><span aria-hidden="true">&#8594;</span>Continue</a>
    <button onclick={() => (searchOpen = true)}><span aria-hidden="true">&#8981;</span>Search</button>
    <a href={href('/map')}><span aria-hidden="true">&#9671;</span>Map</a>
  </nav>
{/if}

<style>
  .desktop-links { display: flex; align-items: center; gap: 0.15rem; }
  .search-trigger {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    min-width: 170px;
    padding: 0.48rem 0.65rem;
    border: 1px solid var(--border-strong);
    border-radius: 10px;
    background: var(--panel);
    color: var(--muted);
    font: inherit;
    font-size: 0.83rem;
    cursor: pointer;
    transition: color var(--motion-fast), border-color var(--motion-fast), transform var(--motion-fast) var(--ease-snap);
  }
  .search-trigger:hover { color: var(--text); border-color: var(--border-strong); background: var(--panel-2); }
  .search-trigger:active { transform: scale(0.97); }
  nav.top button:focus-visible, nav.top a:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
  .search-trigger kbd { margin-left: auto; font: 0.64rem system-ui, sans-serif; color: var(--muted); }
  .theme-toggle {
    margin-left: 0.35rem;
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    padding: 0;
    flex-shrink: 0;
    border: 1px solid var(--border-strong);
    border-radius: 10px;
    background: var(--panel);
    color: var(--text);
    cursor: pointer;
    transition: border-color var(--motion-fast), background var(--motion-fast);
  }
  .theme-toggle:hover { border-color: var(--text); }
  .theme-toggle svg { width: 18px; height: 18px; }
  .mobile-nav { display: none; }
  @media (max-width: 768px) {
    .desktop-links { display: none; }
    .search-trigger { min-width: 0; margin-left: auto; border: 0; background: transparent; }
    .search-trigger span, .search-trigger kbd { display: none; }
    .mobile-nav {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 150;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      padding: 0.35rem max(0.5rem, env(safe-area-inset-right)) calc(0.35rem + env(safe-area-inset-bottom)) max(0.5rem, env(safe-area-inset-left));
      border-top: 1px solid var(--border);
      background: color-mix(in srgb, var(--panel) 94%, transparent);
      backdrop-filter: blur(12px);
    }
    .mobile-nav a, .mobile-nav button {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.1rem;
      padding: 0.3rem;
      border: 0;
      background: transparent;
      color: var(--muted);
      font: 700 0.68rem var(--font-body, system-ui, sans-serif);
    }
    .mobile-nav span { font-size: 1rem; line-height: 1.1; }
    .mobile-nav .active { color: var(--accent); }
  }
</style>
