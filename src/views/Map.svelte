<script>
  import { untrack } from 'svelte';
  import cytoscape from 'cytoscape';
  import dagre from 'cytoscape-dagre';
  import { buildElements, cyStyle } from '../lib/graph.js';
  import { courses } from '../lib/data.js';
  import { go } from '../lib/router.svelte.js';

  cytoscape.use(dagre);

  let { courseId = null } = $props();
  let container;
  let cy;

  // Which courses are shown. Selecting several reveals cross-course prerequisites.
  const initial = untrack(() => courseId);
  let selected = $state(
    initial ? [initial] : ['s4', 's5-core']
  );

  // Tooltip state, positioned over the graph on hover.
  let tip = $state(null); // { x, y, title, blurb, course, mastery }

  function toggle(id) {
    selected = selected.includes(id)
      ? selected.filter((c) => c !== id)
      : [...selected, id];
  }

  function render() {
    if (!container) return;
    cy?.destroy();
    tip = null;
    cy = cytoscape({
      container,
      elements: buildElements({ courseIds: selected }),
      style: cyStyle,
      layout: { name: 'dagre', rankDir: 'LR', nodeSep: 60, rankSep: 140, edgeSep: 20 }
    });

    cy.on('tap', 'node', (e) => {
      cy.elements().addClass('faded').removeClass('highlight');
      const hood = e.target.predecessors().union(e.target.successors()).union(e.target);
      hood.removeClass('faded').addClass('highlight');
    });
    cy.on('tap', (e) => {
      if (e.target === cy) cy.elements().removeClass('faded highlight');
    });
    cy.on('dbltap', 'node', (e) => go(`/skill/${e.target.id()}?course=${e.target.data('courseId') || selected[0]}`));

    const showTip = (e) => {
      const d = e.target.data();
      const p = e.target.renderedPosition();
      tip = { x: p.x, y: p.y, title: d.label, blurb: d.blurb, course: d.course, mastery: d.masteryLabel, colour: d.colour };
    };
    cy.on('mouseover', 'node', showTip);
    cy.on('tap', 'node', showTip);
    cy.on('mouseout', 'node', () => { tip = null; });
    cy.on('pan zoom', () => { tip = null; });
  }

  // Re-render whenever the selected set changes.
  $effect(() => { selected; render(); return () => cy?.destroy(); });
</script>

<div class="map-wrap">
  <aside class="sidebar">
    <h1>Skill Map</h1>
    <p class="muted hint">
      Prerequisites flow left → right. Tick courses to compare them — dashed
      <span class="cross-key">amber</span> links cross between courses. Click a node to trace
      its chain, double-click to open it.
    </p>

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
      <li><span class="dot" style="background:#475569"></span> Not started</li>
      <li><span class="dot" style="background:#d97706"></span> Learning</li>
      <li><span class="dot" style="background:#2563eb"></span> Proficient</li>
      <li><span class="dot" style="background:#16a34a"></span> Mastered</li>
    </ul>
    <p class="muted hint">Node border = course colour, fill = your mastery.</p>
  </aside>

  <div class="graph-area">
    <div bind:this={container} class="graph"></div>
    {#if tip}
      <div class="tip" style="left:{tip.x}px; top:{tip.y}px; --c:{tip.colour}">
        <strong>{tip.title}</strong>
        {#if tip.blurb}<span class="tip-blurb">{tip.blurb}</span>{/if}
        <span class="tip-meta">{tip.course} · {tip.mastery}</span>
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
  .legend .dot { width: 11px; height: 11px; border-radius: 50%; }

  .graph-area { position: relative; flex: 1 1 auto; min-width: 0; }
  .graph { position: absolute; inset: 0; background: #0b1220; }

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
  }
</style>
