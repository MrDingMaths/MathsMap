<script>
  import { route, href } from './lib/router.svelte.js';
  import { theme } from './lib/theme.svelte.js';
  import { pageMeta, applyPageMeta } from './lib/page-meta.js';
  import { skills, skillById, topicById, courseById, primaryTopicForSkill } from './lib/data.js';
  import Home from './views/Home.svelte';
  import Course from './views/Course.svelte';
  import Topic from './views/Topic.svelte';
  import SkillDetail from './views/SkillDetail.svelte';
  import MyLearning from './views/MyLearning.svelte';
  import Quiz from './views/Quiz.svelte';
  import QuizHistory from './views/QuizHistory.svelte';
  import GlobalSearch from './components/GlobalSearch.svelte';
  import SiteFooter from './components/SiteFooter.svelte';
  import AppTile from './components/AppTile.svelte';
  import { APPS, CURRENT_APP } from './lib/apps.js';

  // Heavy or authoring-only views load on first visit, so the public site's
  // first download stays small. When the Studio flag is off (the normal public
  // build) the Studio and TikZ check imports are dropped from the build entirely.
  const STUDIO_ENABLED = import.meta.env.DEV || import.meta.env.VITE_BOOKLET_STUDIO === 'true';
  const loadMap = () => import('./views/Map.svelte');
  const loadStudio = STUDIO_ENABLED ? () => import('./views/BookletStudio.svelte') : null;
  const loadTikzCheck = import.meta.env.DEV ? () => import('./views/TikzCheck.svelte') : null;

  let searchOpen = $state(false);
  let routeKey = $derived(`${route.name}/${route.params.join('/')}`);

  $effect(() => {
    document.documentElement.setAttribute('data-theme', theme.current);
  });

  // Booklet Studio and the TikZ check set their own titles.
  let siteV2 = $derived(route.name !== 'booklet' && route.name !== 'tikz-check');

  // Per-page title, description, canonical URL and robots (src/lib/page-meta.js).
  // Booklet Studio and the TikZ check set their own titles.
  const skillCountForCourse = (id) => skills.filter((skill) => skill.courses?.includes(id)).length;
  $effect(() => {
    if (!siteV2) return;
    applyPageMeta(pageMeta({ name: route.name, params: route.params }, { skillById, topicById, courseById, primaryTopicForSkill, skillCountForCourse }));
  });

  // App switcher popover: closes on outside click and Escape.
  let switcherOpen = $state(false);
  let switcherEl = $state(null);
  $effect(() => {
    if (!switcherOpen) return;
    const onDown = (event) => { if (switcherEl && !switcherEl.contains(event.target)) switcherOpen = false; };
    const onKey = (event) => {
      if (event.key === 'Escape') {
        switcherOpen = false;
        switcherEl?.querySelector('button')?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  });

  let browseActive = $derived(['home', 'course', 'topic', 'skill'].includes(route.name));

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
      <circle cx="10" cy="13" r="4.2" fill="var(--panel)" stroke="currentColor" stroke-width="2.4"/>
      <circle cx="38" cy="13" r="4.2" fill="var(--panel)" stroke="currentColor" stroke-width="2.4"/>
      <circle cx="24" cy="27" r="4.2" fill="#E8443A"/>
      <circle cx="10" cy="38" r="4.2" fill="var(--panel)" stroke="currentColor" stroke-width="2.4"/>
      <circle cx="38" cy="38" r="4.2" fill="var(--panel)" stroke="currentColor" stroke-width="2.4"/>
    </svg><span>Maths<span class="accent">Map</span></span>
  </a></span>

  <div class="desktop-links">
    <a href={href('/')} class="navlink {browseActive ? 'active' : ''}" aria-current={browseActive ? 'page' : undefined}>Browse</a>
    <a href={href('/learning')} class="navlink {route.name === 'learning' ? 'active' : ''}" aria-current={route.name === 'learning' ? 'page' : undefined}>My learning</a>
    <a href={href('/map')} class="navlink {route.name === 'map' ? 'active' : ''}" aria-current={route.name === 'map' ? 'page' : undefined}>Map</a>
  </div>

  <div class="bar-right">
  <button class="search-trigger" onclick={() => (searchOpen = true)} aria-label="Search MathsMap">
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
      <path d="m16.5 16.5 4.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
    <span>Search</span><kbd>Ctrl K</kbd>
  </button>

  <button
    class="icon-btn theme-toggle"
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

  <div class="switcher" bind:this={switcherEl}>
    <button
      class="icon-btn"
      type="button"
      aria-label="Switch site"
      aria-haspopup="true"
      aria-expanded={switcherOpen ? 'true' : 'false'}
      aria-controls="site-switcher"
      onclick={() => (switcherOpen = !switcherOpen)}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        {#each [6, 12, 18] as cy}{#each [6, 12, 18] as cx}<circle {cx} {cy} r="2" />{/each}{/each}
      </svg>
    </button>
    {#if switcherOpen}
      <div class="popover" id="site-switcher">
        <p class="eyebrow">MrDingMaths sites</p>
        {#each APPS as app (app.id)}
          <a class="app-row" href={app.url} aria-current={app.id === CURRENT_APP ? 'true' : undefined} onclick={() => (switcherOpen = false)}>
            <AppTile id={app.id} />
            <span class="app-text"><span class="t">{app.name}</span><span class="d">{app.desc}</span></span>
            {#if app.id === CURRENT_APP}<span class="here">You are here</span>{/if}
          </a>
        {/each}
      </div>
    {/if}
  </div>
  </div>
</nav>

<GlobalSearch open={searchOpen} onClose={() => (searchOpen = false)} />

{#if route.name === 'map'}
  {#await loadMap() then { default: MapView }}
    <MapView
      courseId={route.query.course ?? null}
      skillId={route.query.skill ?? null}
      topicId={route.query.topic ?? null}
      focusId={route.query.focus ?? null}
    />
  {/await}
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
        {:else if route.name === 'booklet' && loadStudio}
          {#await loadStudio() then { default: BookletStudioView }}
            <BookletStudioView initialDifficulty={route.query.difficulty ?? 'all'} projectId={route.query.project ?? null} initialStage={route.query.stage ?? 'projects'} initialOutput={route.query.output ?? null} />
          {/await}
        {:else if route.name === 'tikz-check' && loadTikzCheck}
          {#await loadTikzCheck() then { default: TikzCheck }}
            <TikzCheck
              topicId={route.query.topic ?? null}
              ids={route.query.ids ?? null}
              inputUrl={route.query.input ?? null}
              offset={route.query.offset ?? 0}
              limit={route.query.limit ?? null}
            />
          {/await}
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

<nav class="mobile-nav" aria-label="Primary navigation">
  <a href={href('/')} class:active={browseActive} aria-current={browseActive ? 'page' : undefined}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" /></svg>Browse
  </a>
  <a href={href('/learning')} class:active={route.name === 'learning'} aria-current={route.name === 'learning' ? 'page' : undefined}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /></svg>My learning
  </a>
  <a href={href('/map')} class:active={route.name === 'map'} aria-current={route.name === 'map' ? 'page' : undefined}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="8" r="2.5" /><circle cx="10" cy="18" r="2.5" /><path d="m8 7 8 1M7.5 8l2 8M16.5 10.5l-5 6" /></svg>Map
  </a>
  <button type="button" onclick={() => (searchOpen = true)}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>Search
  </button>
</nav>

<style>
  .desktop-links { display: flex; align-items: stretch; align-self: stretch; gap: 2px; }
  .bar-right { margin-left: auto; display: flex; align-items: center; gap: 8px; }
  .search-trigger {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 190px;
    height: 40px;
    padding: 0 8px 0 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--panel-2);
    color: var(--muted);
    font: inherit;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: color var(--motion-fast), border-color var(--motion-fast);
  }
  .search-trigger:hover { color: var(--text); border-color: var(--border-strong); }
  .search-trigger svg { flex: none; }
  nav.top button:focus-visible, nav.top a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 4px; }
  .search-trigger kbd { margin-left: auto; padding: 4px 6px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--panel); font: 700 0.75rem/1 var(--font-body); color: var(--muted); }
  .icon-btn {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    padding: 0;
    flex-shrink: 0;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--panel);
    color: var(--muted);
    cursor: pointer;
    transition: border-color var(--motion-fast), color var(--motion-fast), background var(--motion-fast);
  }
  .icon-btn:hover { border-color: var(--border-strong); color: var(--text); }
  .icon-btn[aria-expanded='true'] { background: var(--accent-soft); border-color: var(--accent-soft-border); color: var(--text); }
  .icon-btn svg { width: 18px; height: 18px; }
  .switcher { position: relative; flex: none; }
  .popover {
    position: absolute;
    right: 0;
    top: 48px;
    z-index: 110;
    width: min(310px, calc(100vw - 32px));
    padding: 8px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
  }
  .popover .eyebrow { margin: 0; padding: 6px 10px 8px; color: var(--muted); font-size: 0.75rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
  .app-row { display: flex; gap: 12px; align-items: center; padding: 10px; border-radius: var(--radius-md); color: var(--text); text-decoration: none; }
  .app-row:hover { background: var(--panel-2); text-decoration: none; }
  .app-text { display: flex; flex-direction: column; min-width: 0; }
  .app-text .t { font-size: 0.9375rem; font-weight: 800; line-height: 1.2; }
  .app-text .d { color: var(--muted); font-size: 0.8125rem; line-height: 1.35; }
  .app-row .here { margin-left: auto; color: var(--muted); font-size: 0.75rem; font-weight: 800; white-space: nowrap; }
  .mobile-nav { display: none; }
  @media (max-width: 760px) {
    .desktop-links { display: none; }
    .search-trigger { display: none; }
    .mobile-nav {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 150;
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: 1fr;
      padding: 6px max(8px, env(safe-area-inset-right)) calc(6px + env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-left));
      border-top: 1px solid var(--border);
      background: var(--panel);
    }
    .mobile-nav a, .mobile-nav button {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 6px 0;
      border: 0;
      border-radius: var(--radius-md);
      background: transparent;
      color: var(--muted);
      font: 700 0.75rem var(--font-body);
      text-decoration: none;
      cursor: pointer;
    }
    .mobile-nav svg { width: 22px; height: 22px; }
    .mobile-nav .active { color: var(--text); background: var(--accent-soft); }
  }
</style>
