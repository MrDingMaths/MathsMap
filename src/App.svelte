<script>
  import { route, href } from './lib/router.svelte.js';
  import Home from './views/Home.svelte';
  import Course from './views/Course.svelte';
  import Topic from './views/Topic.svelte';
  import SkillDetail from './views/SkillDetail.svelte';
  import Map from './views/Map.svelte';
  import Progress from './views/Progress.svelte';
</script>

<nav class="top">
  <span class="brand"><a href={href('/')} style="color:var(--text)">▲ MathsMap</a></span>
  <a href={href('/')} class={route.name === 'home' ? 'active' : ''}>Browse</a>
  <a href={href('/map')} class={route.name === 'map' ? 'active' : ''}>Map</a>
  <a href={href('/progress')} class={route.name === 'progress' ? 'active' : ''}>Progress</a>
</nav>

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
