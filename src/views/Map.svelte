<script>
  import { untrack } from 'svelte';
  import cytoscape from 'cytoscape';
  import dagre from 'cytoscape-dagre';
  import { buildElements, getCyStyle, routeEdges } from '../lib/graph.js';
  import { theme } from '../lib/theme.svelte.js';
  import { buildTopicElements } from '../lib/topicGraph.js';
  import { layoutSwimlanes, drawBands } from '../lib/swimlane.js';
  import { courses, topicById, skillById, topicsForSkill } from '../lib/data.js';
  import { go } from '../lib/router.svelte.js';
  import MathText, { renderMath } from '../components/Math.svelte';

  cytoscape.use(dagre);

  let { courseId = null, skillId = null, topicId = null } = $props();
  let container;
  let bandCanvas;
  let cy;
  let bands = [];

  // Deep-link target: open the map already focused on a skill or topic. Read once,
  // untracked — these only seed the initial view state.
  const initial = untrack(() => courseId);
  const initSkillId = untrack(() => skillId);
  const initTopicId = untrack(() => topicId);
  const focusSkill = initSkillId ? skillById.get(initSkillId) : null;
  const focusTopic = initTopicId ? topicById.get(initTopicId) : null;

  // Which courses are shown. Selecting several reveals cross-course prerequisites.
  let selected = $state(
    focusSkill
      ? [...(focusSkill.courses || [])]
      : focusTopic
        ? (initial ? [initial] : [...(focusTopic.courses || [])])
        : initial
          ? [initial]
          : ['s4', 's5-core']
  );

  // 'topic' = topic meta-graph (default, low detail); 'skill' = full skill graph.
  // A deep-link target opens straight into the scoped skill graph.
  let mode = $state(focusSkill || focusTopic ? 'skill' : 'topic');
  // When drilling into a topic, the skill graph is scoped to these topic ids.
  let scopeTopicIds = $state(
    focusSkill ? topicsForSkill(initSkillId) : focusTopic ? [initTopicId] : null
  );
  // The topic actually drilled into (scopeTopicIds also includes its neighbours).
  let scopeTopicId = $state(
    focusSkill ? topicsForSkill(initSkillId)[0] ?? null : initTopicId ?? null
  );

  // One-shot: center and highlight a deep-linked skill node after the first render.
  let pendingFocusSkill = focusSkill ? initSkillId : null;
  // Show only prerequisite links that cross between courses.
  let crossOnly = $state(false);
  // Hide the KaTeX label chips entirely; tooltips still name nodes on hover.
  let showLabels = $state(true);

  // Chip interactivity bridge: label chips live in an HTML overlay, so Cytoscape
  // events can't reach them. render() assigns this with handlers closing over that
  // render's focusChain/clearFocus/stuck state, so hovering/clicking a chip
  // behaves exactly like hovering/clicking its node disc.
  let chip = null;

  // Tooltip state, positioned over the graph on hover.
  let tip = $state(null);

  // KaTeX node labels, rendered as an HTML overlay (Cytoscape's canvas text can't do
  // KaTeX). Each entry tracks the node's rendered position so it follows pan/zoom.
  let labels = $state([]);
  let labelRaf = null;

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

  // Reposition the KaTeX label overlay to track the graph. Coalesced to one update
  // per frame since Cytoscape fires 'render' rapidly during pan/zoom. Labels sit just
  // below each node and scale with zoom so they track the graph like canvas text would.
  function syncLabels() {
    if (!showLabels) { labels = []; return; }
    if (labelRaf) return;
    labelRaf = requestAnimationFrame(() => {
      labelRaf = null;
      if (!cy || cy.destroyed()) { labels = []; return; }
      const zoom = cy.zoom();
      // Keep labels readable: track zoom, but never shrink below a legible floor (or
      // balloon when zoomed right in).
      const scale = Math.min(Math.max(zoom, 0.85), 1.25);
      labels = cy.nodes().map((n) => {
        const p = n.renderedPosition();
        const half = (n.height() * zoom) / 2;
        return {
          id: n.id(),
          html: renderMath(n.data('name') ?? n.data('label')),
          x: p.x,
          y: p.y + half + 4,
          scale,
          dim: n.hasClass('dim'),
          faded: n.hasClass('faded'),
          boundary: n.hasClass('boundary'),
          ready: n.hasClass('ready')
        };
      });
    });
  }

  function drillIntoTopic(node) {
    scopeTopicIds = [node.id()];
    scopeTopicId = node.id();
    mode = 'skill';
  }

  // Zoomed out, the fine 1.5px/0.32-opacity edges vanish; below this zoom every
  // edge gets the bolder `far` style (see getCyStyle). RAF-coalesced like
  // syncLabels since 'zoom' fires rapidly during pinch/scroll.
  const FAR_ZOOM = 0.55;
  let farRaf = null;
  function syncFar() {
    if (!cy || cy.destroyed()) return;
    cy.edges().toggleClass('far', cy.zoom() < FAR_ZOOM);
  }
  function scheduleFar() {
    if (farRaf) return;
    farRaf = requestAnimationFrame(() => { farRaf = null; syncFar(); });
  }

  // On-screen zoom controls: scale about the viewport centre so the view doesn't
  // lurch toward the graph origin.
  function zoomBy(factor) {
    if (!cy || cy.destroyed()) return;
    cy.zoom({
      level: cy.zoom() * factor,
      renderedPosition: { x: container.clientWidth / 2, y: container.clientHeight / 2 }
    });
  }
  function fitAll() {
    if (!cy || cy.destroyed()) return;
    cy.fit(undefined, 30);
  }

  // Pan/zoom to a selected course's band. bands.rows carries each band's model-
  // space geometry from layoutSwimlanes; bandLabel is the course title, so a
  // label match finds the right row. Fit spans all lanes horizontally.
  function jumpToCourse(title) {
    if (!cy || cy.destroyed()) return;
    const rows = bands?.rows || [];
    const lanes = bands?.lanes || [];
    const row = rows.find((r) => r.label === title);
    if (!row || !lanes.length) return;
    cy.animate(
      {
        fit: {
          boundingBox: {
            x1: lanes[0].xLeft,
            y1: row.yTop,
            x2: lanes[lanes.length - 1].xRight,
            y2: row.yBottom
          },
          padding: 30
        }
      },
      { duration: 350 }
    );
  }

  function render() {
    if (!container) return;
    cy?.destroy();
    tip = null;
    bands = [];
    labels = [];

    cy = cytoscape({
      container,
      elements: buildGraphElements(),
      style: getCyStyle(theme.current === 'dark'),
      minZoom: 0.1,
      maxZoom: 3
    });

    // Highlight is driven by our lit/dim classes, not Cytoscape selection — so
    // disable selection to avoid the big selection/active overlay on edge taps.
    cy.autounselectify(true);


    // Lay each strand out as a strand × course-band grid, then route edges into
    // node-free gutters and inter-column corridors so they never run under nodes
    // (routeEdges needs the lane geometry, hence the bands pass-through).
    bands = layoutSwimlanes(cy);
    routeEdges(cy, bands);
    syncFar(); // layoutSwimlanes just fit the viewport, so set the initial far/near state now
    redraw();
    syncLabels();

    cy.on('render', () => { redraw(); syncLabels(); });
    cy.on('zoom', scheduleFar);

    // Focus a node's prerequisite chain: light up its edges, dim every node that
    // isn't part of the chain. `stuck` keeps the focus on after the cursor leaves
    // (set by a click); a plain hover clears on mouse-out.
    let stuck = false;
    const focusChain = (node, sticky) => {
      const hood = node.predecessors().union(node.successors()).union(node);
      cy.edges().removeClass('lit');
      hood.edges().addClass('lit');
      cy.nodes().addClass('dim');
      hood.nodes().removeClass('dim');
      stuck = sticky;
    };
    const clearFocus = () => {
      cy.elements().removeClass('lit dim');
      stuck = false;
    };

    // Takes a node (not an event) so the chip handlers below can reuse it.
    const showTip = (n) => {
      const d = n.data();
      const p = n.renderedPosition();
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

    // A clicked (stuck) chain must survive hovering other nodes: hover only
    // drives the lit chain when nothing is pinned. The tooltip still follows the
    // cursor either way, so browsing names doesn't disturb a pinned chain.
    cy.on('mouseover', 'node', (e) => { if (!stuck) focusChain(e.target, false); showTip(e.target); });
    cy.on('mouseout', 'node', () => { tip = null; if (!stuck) clearFocus(); });
    cy.on('tap', 'node', (e) => { focusChain(e.target, true); showTip(e.target); });
    cy.on('tap', (e) => { if (e.target === cy) clearFocus(); });
    // Edges cover a lot of "looks like background" area; tapping one clears the
    // pinned chain just like tapping true background.
    cy.on('tap', 'edge', clearFocus);
    cy.on('dbltap', 'node', (e) => {
      if (mode === 'topic') drillIntoTopic(e.target);
      else go(`/skill/${e.target.id()}?course=${e.target.data('courseId') || selected[0]}`);
    });
    cy.on('pan zoom', () => { tip = null; });

    // Same behaviours, reachable from the HTML label chips (which Cytoscape's
    // canvas events can't see). Looked up by id per call because `cy` is rebuilt
    // on every render.
    chip = {
      enter: (id) => {
        const n = cy.getElementById(id);
        // Same stuck-guard as node mouseover: hover never replaces a pinned chain.
        if (n.nonempty()) { if (!stuck) focusChain(n, false); showTip(n); }
      },
      leave: () => { tip = null; if (!stuck) clearFocus(); },
      click: (id) => {
        const n = cy.getElementById(id);
        if (n.nonempty()) { focusChain(n, true); showTip(n); }
      },
      dbl: (id) => {
        const n = cy.getElementById(id);
        if (!n.nonempty()) return;
        if (mode === 'topic') drillIntoTopic(n);
        else go(`/skill/${n.id()}?course=${n.data('courseId') || selected[0]}`);
      }
    };

    // Deep-link focus: center on the target skill node and light its chain. Consumed
    // once so later re-renders (theme/course toggles) don't yank the viewport back.
    if (pendingFocusSkill) {
      const node = cy.getElementById(pendingFocusSkill);
      if (node?.nonempty()) {
        cy.animate({ center: { eles: node }, zoom: 1.2 }, { duration: 350 });
        node.addClass('highlight');
        focusChain(node, true);
      }
      pendingFocusSkill = null;
    }
  }

  // Re-render whenever any view input changes.
  $effect(() => {
    selected; mode; scopeTopicIds; crossOnly; theme.current;
    render();
    return () => {
      if (labelRaf) cancelAnimationFrame(labelRaf);
      labelRaf = null;
      if (farRaf) cancelAnimationFrame(farRaf);
      farRaf = null;
      cy?.destroy();
    };
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

    <label class="cross-toggle">
      <input
        type="checkbox"
        checked={showLabels}
        onchange={() => { showLabels = !showLabels; syncLabels(); }}
      />
      Show labels
    </label>

    <div class="section-label">Courses</div>
    <div class="course-list">
      {#each courses as c}
        <label class="course-opt" class:on={selected.includes(c.id)}>
          <input type="checkbox" checked={selected.includes(c.id)} onchange={() => toggle(c.id)} />
          <span class="swatch" style="background:{c.color}"></span>
          <span class="course-title">{c.title}</span>
          {#if selected.includes(c.id)}
            <!-- stopPropagation + preventDefault so the locate click doesn't also
                 toggle the wrapping label's checkbox. -->
            <button
              class="locate"
              title="Jump to this course on the map"
              onclick={(e) => { e.preventDefault(); e.stopPropagation(); jumpToCourse(c.title); }}
            >⌖</button>
          {/if}
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
    <div class="label-layer">
      {#each labels as l (l.id)}
        <!-- Chips are interactive proxies for their node: same focus/tip/drill
             behaviour, so the whole visual unit (disc + label) responds, not just
             the small circle. -->
        <div
          class="node-label"
          role="button"
          tabindex="-1"
          class:dim={l.dim}
          class:faded={l.faded}
          class:boundary={l.boundary}
          class:ready={l.ready}
          style="left:{l.x}px; top:{l.y}px; transform:translateX(-50%) scale({l.scale});"
          onmouseenter={() => chip?.enter(l.id)}
          onmouseleave={() => chip?.leave()}
          onclick={() => chip?.click(l.id)}
          ondblclick={() => chip?.dbl(l.id)}
          onkeydown={(e) => { if (e.key === 'Enter') chip?.click(l.id); }}
        >{@html l.html}</div>
      {/each}
    </div>
    {#if tip}
      <div class="tip" style="left:{tip.x}px; top:{tip.y}px; --c:{tip.colour}">
        <strong><MathText text={tip.title} /></strong>
        {#if tip.blurb}<span class="tip-blurb"><MathText text={tip.blurb} /></span>{/if}
        <span class="tip-meta">
          {tip.course} · {tip.mastery}{#if tip.skillCount} · {tip.skillCount} skills{/if}
        </span>
      </div>
    {/if}
    <div class="zoom-controls">
      <button title="Zoom in" onclick={() => zoomBy(1.3)}>＋</button>
      <button title="Zoom out" onclick={() => zoomBy(1 / 1.3)}>−</button>
      <button title="Fit whole map" onclick={fitAll}>⤢</button>
    </div>
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
  /* Locate (jump-to-band) button, shown only for selected courses. */
  .locate {
    margin-left: auto;
    flex: 0 0 auto;
    width: 22px;
    height: 22px;
    padding: 0;
    line-height: 1;
    font-size: 0.9rem;
    border: 1px solid var(--border);
    border-radius: 5px;
    background: var(--panel);
    color: var(--muted);
    cursor: pointer;
  }
  .locate:hover { color: var(--accent); border-color: var(--accent); }

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

  /* On-screen zoom controls, floated over the graph bottom-right. Styled to
     match the .seg buttons. */
  .zoom-controls {
    position: absolute;
    right: 12px;
    bottom: 12px;
    z-index: 3;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .zoom-controls button {
    width: 30px;
    height: 30px;
    padding: 0;
    line-height: 1;
    font-size: 1rem;
    border-radius: 7px;
    border: 1px solid var(--border);
    background: var(--panel-2);
    color: var(--text);
    cursor: pointer;
  }
  .zoom-controls button:hover { background: var(--panel); border-color: var(--accent); }
  .bands { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; }
  .graph { position: absolute; inset: 0; z-index: 1; background: transparent; }

  /* KaTeX label overlay: one chip per node, positioned in screen space and scaled to
     match the graph zoom. Non-interactive so graph taps/hovers pass through. */
  .label-layer {
    position: absolute;
    inset: 0;
    z-index: 2;
    overflow: hidden;
    pointer-events: none;
  }
  /* Chip metrics (max-width, padding, font-size) must stay in sync with
     estimateChipWidth() in swimlane.js, which spaces nodes so chips don't
     overlap. text-wrap: balance evens the lines out (no orphan last word);
     width: max-content lets short labels shrink-wrap instead of claiming the
     full max-width. Chips are individually interactive (pointer-events: auto)
     even though the layer around them stays click-through. */
  .node-label {
    position: absolute;
    transform-origin: top center;
    max-width: 130px;
    width: max-content;
    text-wrap: balance;
    pointer-events: auto;
    cursor: pointer;
    padding: 2px 7px;
    text-align: center;
    line-height: 1.2;
    font-size: 15px;
    color: var(--text);
    background: var(--panel-2);
    border-radius: 7px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
    white-space: normal;
  }
  .node-label.dim { opacity: 0.4; }
  .node-label.faded { opacity: 0.12; }
  .node-label.boundary { opacity: 0.5; font-size: 13px; }
  .node-label.ready { color: #06b6d4; font-weight: 700; }
  .node-label :global(.katex) { font-size: 1em; }

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
