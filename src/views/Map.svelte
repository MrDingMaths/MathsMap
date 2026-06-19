<script>
  import { untrack } from 'svelte';
  import cytoscape from 'cytoscape';
  import dagre from 'cytoscape-dagre';
  import { buildElements, getCyStyle } from '../lib/graph.js';
  import { theme } from '../lib/theme.svelte.js';
  import { buildTopicElements } from '../lib/topicGraph.js';
  import { layoutSwimlanes, drawBands } from '../lib/swimlane.js';
  import { courses, topicById } from '../lib/data.js';
  import { go } from '../lib/router.svelte.js';
  import Math from '../components/Math.svelte';

  cytoscape.use(dagre);

  let { courseId = null } = $props();
  let container;
  let bandCanvas;
  let cy;
  let bands = [];

  // Which courses are shown. Selecting several reveals cross-course prerequisites.
  const initial = untrack(() => courseId);
  let selected = $state(initial ? [initial] : ['s4', 's5-core']);

  // 'topic' = topic meta-graph (default, low detail); 'skill' = full skill graph.
  let mode = $state('topic');
  // When drilling into a topic, the skill graph is scoped to these topic ids.
  let scopeTopicIds = $state(null);
  // The topic actually drilled into (scopeTopicIds also includes its neighbours).
  let scopeTopicId = $state(null);
  // Show only prerequisite links that cross between courses.
  let crossOnly = $state(false);

  // Tooltip state, positioned over the graph on hover.
  let tip = $state(null);

  function toggle(id) {
    selected = selected.includes(id)
      ? selected.filter((c) => c !== id)
      : [...selected, id];
  }

  function setMode(m) {
    if (m === 'topic') { scopeTopicIds = null; scopeTopicId = null; }
    mode = m;
  }

  // Keep only cross-course edges and the nodes they connect.
  function filterCrossOnly(elements) {
    const edges = elements.filter(
      (e) => 'source' in (e.data || {}) && (e.classes || '').includes('cross-course')
    );
    const keep = new Set();
    for (const e of edges) {
      keep.add(e.data.source);
      keep.add(e.data.target);
    }
    const nodes = elements.filter((e) => !('source' in (e.data || {})) && keep.has(e.data.id));
    return [...nodes, ...edges];
  }

  function buildGraphElements() {
    const isDark = theme.current === 'dark';
    let els =
      mode === 'topic'
        ? buildTopicElements({ courseIds: selected, isDark })
        : buildElements({ courseIds: selected, topicIds: scopeTopicIds, isDark });
    if (crossOnly) els = filterCrossOnly(els);
    return els;
  }

  function redraw() {
    drawBands(cy, bandCanvas, bands, theme.current === 'dark');
  }

  function drillIntoTopic(node) {
    scopeTopicIds = [node.id()];
    scopeTopicId = node.id();
    mode = 'skill';
  }

  function render() {
    if (!container) return;
    cy?.destroy();
    tip = null;
    bands = [];

    cy = cytoscape({
      container,
      elements: buildGraphElements(),
      style: getCyStyle(theme.current === 'dark')
    });

    // Lay each strand out independently and stack them into bands.
    bands = layoutSwimlanes(cy);
    redraw();

    cy.on('render', redraw);

    cy.on('tap', 'node', (e) => {
      cy.elements().addClass('faded').removeClass('highlight');
      const hood = e.target.predecessors().union(e.target.successors()).union(e.target);
      hood.removeClass('faded').addClass('highlight');
    });
    cy.on('tap', (e) => {
      if (e.target === cy) cy.elements().removeClass('faded highlight');
    });
    cy.on('dbltap', 'node', (e) => {
      if (mode === 'topic') drillIntoTopic(e.target);
      else go(`/skill/${e.target.id()}?course=${e.target.data('courseId') || selected[0]}`);
    });

    const showTip = (e) => {
      const d = e.target.data();
      const p = e.target.renderedPosition();
      tip = {
        x: p.x,
        y: p.y,
        title: d.name ?? d.label,
        blurb: d.blurb,
        course: d.course,
        mastery: d.masteryLabel,
        colour: d.colour,
        skillCount: d.skillCount
      };
    };
    cy.on('mouseover', 'node', showTip);
    cy.on('tap', 'node', showTip);
    cy.on('mouseout', 'node', () => { tip = null; });
    cy.on('pan zoom', () => { tip = null; });
  }

  // Re-render whenever any view input changes.
  $effect(() => {
    selected; mode; scopeTopicIds; crossOnly; theme.current;
    render();
    return () => cy?.destroy();
  });

  let scopeLabel = $derived(
    scopeTopicId ? topicById.get(scopeTopicId)?.title : null
  );
</script>

<div class="map-wrap">
  <aside class="sidebar">
    <h1>Skill Map</h1>
    <p class="muted hint">
      Prerequisites flow top → bottom, grouped into strand bands. Tick courses to
      compare them — dashed <span class="cross-key">amber</span> links cross between
      courses. Click a node to trace its chain.
    </p>

    <div class="section-label">View</div>
    <div class="seg">
      <button class:on={mode === 'topic'} onclick={() => setMode('topic')}>Topics</button>
      <button class:on={mode === 'skill'} onclick={() => setMode('skill')}>Skills</button>
    </div>
    {#if mode === 'topic'}
      <p class="muted hint">Double-click a topic to open its skills.</p>
    {:else}
      <p class="muted hint">Double-click a skill to open it.</p>
    {/if}
    {#if scopeLabel}
      <div class="scope-pill">
        Scoped to <strong>{scopeLabel}</strong>
        <button class="link" onclick={() => { scopeTopicIds = null; scopeTopicId = null; }}>show all skills</button>
      </div>
    {/if}

    <label class="cross-toggle">
      <input type="checkbox" checked={crossOnly} onchange={() => (crossOnly = !crossOnly)} />
      Cross-course links only
    </label>

    <div class="section-label">Courses</div>
    <div class="course-list">
      {#each courses as c}
        <label class="course-opt" class:on={selected.includes(c.id)}>
          <input type="checkbox" checked={selected.includes(c.id)} onchange={() => toggle(c.id)} />
          <span class="swatch" style="background:{c.color}"></span>
          <span class="course-title">{c.title}</span>
        </label>
      {/each}
    </div>

    <div class="section-label">Mastery legend</div>
    <ul class="legend">
      <li><span class="ring" style="--c:var(--track); --p:100%"></span> Not started</li>
      <li><span class="ring" style="--c:#d97706; --p:33%"></span> Learning</li>
      <li><span class="ring" style="--c:#2563eb; --p:66%"></span> Proficient</li>
      <li><span class="ring" style="--c:#16a34a; --p:100%"></span> Mastered</li>
      <li><span class="ring ready"></span> Ready now</li>
    </ul>
    <p class="muted hint">Each node is a mastery ring that fills as you progress; topics fill by share of skills mastered. A dashed cyan halo marks topics whose prerequisites are all done.</p>
  </aside>

  <div class="graph-area">
    <canvas bind:this={bandCanvas} class="bands"></canvas>
    <div bind:this={container} class="graph"></div>
    {#if tip}
      <div class="tip" style="left:{tip.x}px; top:{tip.y}px; --c:{tip.colour}">
        <strong><Math text={tip.title} /></strong>
        {#if tip.blurb}<span class="tip-blurb"><Math text={tip.blurb} /></span>{/if}
        <span class="tip-meta">
          {tip.course} · {tip.mastery}{#if tip.skillCount} · {tip.skillCount} skills{/if}
        </span>
      </div>
    {/if}
    {#if selected.length === 0}
      <p class="empty">Select one or more courses to display the map.</p>
    {/if}
  </div>
</div>

<style>
  .map-wrap {
    display: flex;
    height: calc(100dvh - 52px); /* fill viewport below the top nav */
  }

  .sidebar {
    width: 270px;
    flex: 0 0 270px;
    overflow-y: auto;
    padding: 1rem 1.1rem;
    border-right: 1px solid var(--border);
    background: var(--panel);
  }
  .sidebar h1 { font-size: 1.25rem; }
  .hint { font-size: 0.8rem; margin: 0.3rem 0 0; }
  .cross-key { color: #f59e0b; font-weight: 600; }

  .section-label {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted);
    margin: 1rem 0 0.4rem;
  }

  .seg { display: flex; gap: 0.25rem; }
  .seg button {
    flex: 1;
    padding: 0.35rem 0.5rem;
    font-size: 0.82rem;
    border-radius: 7px;
    border: 1px solid var(--border);
    background: var(--panel-2);
    color: var(--text);
    cursor: pointer;
  }
  .seg button.on { background: var(--accent); border-color: var(--accent); color: #fff; }

  .scope-pill {
    margin-top: 0.5rem;
    font-size: 0.78rem;
    background: var(--panel-2);
    border: 1px solid var(--border);
    border-radius: 7px;
    padding: 0.4rem 0.5rem;
  }
  .scope-pill .link {
    display: block;
    margin-top: 0.25rem;
    background: none;
    border: none;
    color: var(--accent);
    cursor: pointer;
    padding: 0;
    font-size: 0.76rem;
  }

  .cross-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
    font-size: 0.82rem;
    cursor: pointer;
  }

  .course-list { display: flex; flex-direction: column; gap: 0.25rem; }
  .course-opt {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0.45rem;
    border-radius: 7px;
    cursor: pointer;
    font-size: 0.85rem;
    border: 1px solid transparent;
  }
  .course-opt:hover { background: var(--panel-2); }
  .course-opt.on { background: var(--panel-2); border-color: var(--border); }
  .course-opt input { cursor: pointer; }
  .swatch { width: 12px; height: 12px; border-radius: 3px; flex: 0 0 auto; }
  .course-title { line-height: 1.2; }

  .legend { list-style: none; margin: 0; padding: 0; font-size: 0.8rem; }
  .legend li { display: flex; align-items: center; gap: 0.5rem; margin: 0.25rem 0; }
  /* Mini progress ring: coloured arc over a track, with a punched-out centre. */
  .legend .ring {
    position: relative;
    width: 15px;
    height: 15px;
    flex: 0 0 auto;
    border-radius: 50%;
    background: conic-gradient(var(--c) 0 var(--p), var(--track) var(--p) 100%);
  }
  .legend .ring::before {
    content: '';
    position: absolute;
    inset: 3px;
    border-radius: 50%;
    background: var(--panel);
  }
  .legend .ring.ready {
    background: none;
    border: 2px dashed #06b6d4;
  }
  .legend .ring.ready::before { content: none; }

  .graph-area { position: relative; flex: 1 1 auto; min-width: 0; }
  .bands { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; }
  .graph { position: absolute; inset: 0; z-index: 1; background: transparent; }

  .tip {
    position: absolute;
    transform: translate(-50%, calc(-100% - 14px));
    max-width: 240px;
    padding: 0.5rem 0.65rem;
    background: var(--panel);
    border: 1px solid var(--border);
    border-left: 3px solid var(--c, var(--accent));
    border-radius: 8px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
    pointer-events: none;
    z-index: 5;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .tip strong { font-size: 0.85rem; line-height: 1.25; }
  .tip-blurb { font-size: 0.76rem; color: var(--muted); }
  .tip-meta { font-size: 0.7rem; color: var(--accent); }

  .empty {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--muted);
    z-index: 2;
  }
</style>
