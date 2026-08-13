<script>
  import { onMount, untrack } from 'svelte';
  import cytoscape from 'cytoscape';
  import { buildElements, getCyStyle, routeEdges } from '../lib/graph.js';
  import { theme } from '../lib/theme.svelte.js';
  import { buildTopicGraph } from '../lib/topicGraph.js';
  import { layoutSwimlanes, drawBands } from '../lib/swimlane.js';
  import {
    getCachedGeometry,
    labelFade,
    mapGeometryKey,
    selectVisibleLabels,
    setCachedGeometry
  } from '../lib/mapView.js';
  import { courses, topicById, skillById, topicsForSkill } from '../lib/data.js';
  import { go } from '../lib/router.svelte.js';
  import MathText, { renderMath } from '../components/Math.svelte';

  let { courseId = null, skillId = null, topicId = null } = $props();
  let container;
  let bandCanvas;
  let labelWorld;
  let cy;
  let bands = [];
  let labelRecords = [];
  let currentGeometryKey = null;
  let currentDark = null;
  let currentTopicGraph = null;
  let activeFocus = null;
  let focusCache = new Map();
  let viewportRaf = null;
  let bandRaf = null;
  let labelTimer = null;
  let farState = null;
  let resizeObserver = null;

  const initial = untrack(() => courseId);
  const initSkillId = untrack(() => skillId);
  const initTopicId = untrack(() => topicId);
  const focusSkill = initSkillId ? skillById.get(initSkillId) : null;
  const focusTopic = initTopicId ? topicById.get(initTopicId) : null;

  let selected = $state(
    focusSkill
      ? [...(focusSkill.courses || [])]
      : focusTopic
        ? (initial ? [initial] : [...(focusTopic.courses || [])])
        : initial
          ? [initial]
          : ['s4', 's5-core']
  );
  let mode = $state(focusSkill || focusTopic ? 'skill' : 'topic');
  let scopeTopicIds = $state(
    focusSkill ? topicsForSkill(initSkillId) : focusTopic ? [initTopicId] : null
  );
  let scopeTopicId = $state(
    focusSkill ? topicsForSkill(initSkillId)[0] ?? null : initTopicId ?? null
  );
  let pendingFocusSkill = focusSkill ? initSkillId : null;
  let crossOnly = $state(false);
  let showLabels = $state(true);
  let showAllLinks = $state(false);
  let tracePath = $state(false);
  let selectedNodeId = $state(null);
  let inspector = $state(null);
  let tip = $state(null);
  let edgeTip = $state(null);
  let labels = $state([]);
  let sidebarOpen = $state(false);
  let touchMode = $state(false);

  function toggle(id) {
    selected = selected.includes(id)
      ? selected.filter((course) => course !== id)
      : [...selected, id];
  }

  function setMode(nextMode) {
    if (nextMode === 'topic') { scopeTopicIds = null; scopeTopicId = null; }
    mode = nextMode;
  }

  function filterCrossOnly(elements) {
    const edges = elements.filter(
      (element) => 'source' in (element.data || {}) && (element.classes || '').includes('cross-course')
    );
    const keep = new Set();
    for (const edge of edges) {
      keep.add(edge.data.source);
      keep.add(edge.data.target);
    }
    const nodes = elements.filter(
      (element) => !('source' in (element.data || {})) && keep.has(element.data.id)
    );
    return [...nodes, ...edges];
  }

  function buildGraphData(isDark) {
    if (mode === 'topic') {
      const topicGraph = buildTopicGraph({ courseIds: selected, isDark, crossOnly });
      return { elements: topicGraph.elements, topicGraph };
    }
    let elements = buildElements({ courseIds: selected, topicIds: scopeTopicIds, isDark });
    if (crossOnly) elements = filterCrossOnly(elements);
    return { elements, topicGraph: null };
  }

  function graphKey() {
    return mapGeometryKey({ mode, courseIds: selected, topicIds: scopeTopicIds, crossOnly });
  }

  function applyCachedGeometry(geometry) {
    for (const [id, position] of Object.entries(geometry.positions)) {
      const node = cy.getElementById(id);
      if (node.nonempty()) node.position(position);
    }
    for (const [id, style] of Object.entries(geometry.routes)) {
      const edge = cy.getElementById(id);
      if (edge.nonempty()) { edge.addClass('routed'); edge.style(style); }
    }
    bands = geometry.bands;
  }

  function capturePositions() {
    return Object.fromEntries(cy.nodes().map((node) => [node.id(), { ...node.position() }]));
  }

  function rebuildLabelRecords() {
    labelRecords = cy.nodes().map((node) => {
      const position = node.position();
      return {
        id: node.id(),
        name: node.data('name') ?? node.data('label'),
        x: position.x,
        y: position.y + node.height() / 2,
        boundary: node.hasClass('boundary'),
        ready: node.hasClass('ready'),
        priority: node.degree(false) + (node.hasClass('ready') ? 1000 : 0)
      };
    });
  }

  function focusedIdSet() {
    return activeFocus ? new Set(activeFocus.nodes.map((node) => node.id())) : new Set();
  }

  function refreshVisibleLabels() {
    if (!cy || cy.destroyed() || !showLabels) { labels = []; return; }
    const focused = focusedIdSet();
    const visible = selectVisibleLabels(labelRecords, {
      zoom: cy.zoom(),
      extent: cy.extent(),
      focusedIds: focused
    });
    labels = visible.map((label) => ({
      ...label,
      html: renderMath(label.name),
      focused: focused.has(label.id),
      root: activeFocus?.rootId === label.id,
      dimmed: Boolean(activeFocus) && !focused.has(label.id)
    }));
  }

  function updateLabelWorld() {
    if (!cy || cy.destroyed() || !labelWorld) return;
    const zoom = cy.zoom();
    const pan = cy.pan();
    const readableScale = Math.min(Math.max(zoom, 0.85), 1.25);
    labelWorld.style.transform = `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`;
    labelWorld.style.setProperty('--label-counter-scale', String(readableScale / zoom));
    labelWorld.style.setProperty('--label-fade', String(labelFade(zoom)));
  }

  function scheduleViewportPaint() {
    if (viewportRaf) return;
    viewportRaf = requestAnimationFrame(() => {
      viewportRaf = null;
      updateLabelWorld();
      syncFar();
    });
  }

  function scheduleBandDraw() {
    if (bandRaf) return;
    bandRaf = requestAnimationFrame(() => {
      bandRaf = null;
      if (cy && !cy.destroyed()) drawBands(cy, bandCanvas, bands, currentDark);
    });
  }

  function scheduleLabelCull() {
    clearTimeout(labelTimer);
    labelTimer = setTimeout(refreshVisibleLabels, 80);
  }

  function onViewport() {
    if (tip) tip = null;
    if (edgeTip) edgeTip = null;
    scheduleViewportPaint();
    scheduleBandDraw();
    scheduleLabelCull();
  }

  const FAR_ZOOM = 0.55;
  const WHEEL_ZOOM_SENSITIVITY = 0.12;
  const ZOOM_STEP = 1.18;
  function syncFar() {
    if (!cy || cy.destroyed()) return;
    const next = cy.zoom() < FAR_ZOOM;
    if (next === farState) return;
    farState = next;
    cy.edges().toggleClass('far', next);
  }

  const FOCUS_CLASSES = 'dim focus-root focus-chain path-lit incoming-lit outgoing-lit';

  function refreshEdgeVisibility() {
    if (!cy || cy.destroyed()) return;
    cy.edges().removeClass('edge-visible');
    if (showAllLinks) cy.edges('.semantic-edge').addClass('edge-visible');
    else if (mode === 'topic') cy.edges('.backbone').addClass('edge-visible');
    else if (scopeTopicIds) cy.edges('.semantic-edge').addClass('edge-visible');
    activeFocus?.edges.addClass('edge-visible');
  }

  function clearFocus({ clearTip = false } = {}) {
    if (!cy || cy.destroyed()) return;
    cy.batch(() => cy.elements().removeClass(FOCUS_CLASSES));
    activeFocus = null;
    selectedNodeId = null;
    inspector = null;
    tracePath = false;
    if (clearTip) { tip = null; edgeTip = null; }
    refreshEdgeVisibility();
    refreshVisibleLabels();
  }

  function componentFor(id) {
    if (!currentTopicGraph) return null;
    const index = currentTopicGraph.componentByNode.get(id);
    return index == null ? null : currentTopicGraph.components[index];
  }

  function directFocusFor(node) {
    const id = node.id();
    const component = componentFor(id);
    const componentIds = new Set(component || [id]);
    const incoming = cy.edges('.semantic-edge').filter(
      (edge) => edge.target().id() === id && !componentIds.has(edge.source().id())
    );
    const outgoing = cy.edges('.semantic-edge').filter(
      (edge) => edge.source().id() === id && !componentIds.has(edge.target().id())
    );
    const interdependent = component?.length > 1
      ? cy.edges('.interdependent').filter(
          (edge) => componentIds.has(edge.source().id()) && componentIds.has(edge.target().id())
        )
      : cy.collection();
    const edges = incoming.union(outgoing).union(interdependent);
    const nodes = edges.connectedNodes().union(node);
    return { nodes, edges, incoming, outgoing, interdependent, rootId: id };
  }

  function chainFor(node) {
    const key = `${mode}:${node.id()}`;
    if (focusCache.has(key)) return focusCache.get(key);
    const hood = node.predecessors().union(node.successors()).union(node);
    const chain = {
      nodes: hood.nodes(),
      edges: hood.edges().filter('.semantic-edge, .interdependent'),
      rootId: node.id()
    };
    focusCache.set(key, chain);
    return chain;
  }

  function itemFor(id) {
    const node = cy.getElementById(id);
    if (!node.nonempty()) return null;
    return { id, title: node.data('name') ?? node.data('label'), course: node.data('course') };
  }

  function buildInspector(node) {
    const id = node.id();
    const componentIds = new Set(componentFor(id) || [id]);
    const incoming = cy.edges('.semantic-edge')
      .filter((edge) => edge.target().id() === id && !componentIds.has(edge.source().id()))
      .map((edge) => itemFor(edge.source().id()))
      .filter(Boolean)
      .sort((a, b) => a.title.localeCompare(b.title));
    const outgoing = cy.edges('.semantic-edge')
      .filter((edge) => edge.source().id() === id && !componentIds.has(edge.target().id()))
      .map((edge) => itemFor(edge.target().id()))
      .filter(Boolean)
      .sort((a, b) => a.title.localeCompare(b.title));
    const interdependent = [...componentIds]
      .filter((other) => other !== id)
      .map(itemFor)
      .filter(Boolean)
      .sort((a, b) => a.title.localeCompare(b.title));
    const data = node.data();
    return {
      id,
      title: data.name ?? data.label,
      blurb: data.blurb,
      course: data.bandLabel ?? data.course,
      mastery: data.masteryLabel,
      skillCount: data.skillCount,
      incoming,
      outgoing,
      interdependent
    };
  }

  function focusNode(node, sticky, fullPath = false) {
    if (!node?.nonempty()) return;
    const next = fullPath ? chainFor(node) : directFocusFor(node);
    cy.batch(() => {
      cy.elements().removeClass(FOCUS_CLASSES);
      activeFocus = next;
      refreshEdgeVisibility();
      cy.nodes().addClass('dim');
      cy.edges('.edge-visible').addClass('dim');
      next.nodes.removeClass('dim').addClass('focus-chain');
      next.edges.removeClass('dim');
      if (fullPath) next.edges.addClass('path-lit');
      else {
        next.incoming.addClass('incoming-lit');
        next.outgoing.addClass('outgoing-lit');
      }
      node.addClass('focus-root');
    });
    if (sticky) {
      selectedNodeId = node.id();
      inspector = buildInspector(node);
      tip = null;
      edgeTip = null;
    }
    refreshVisibleLabels();
  }

  function toggleTracePath() {
    const node = selectedNodeId ? cy?.getElementById(selectedNodeId) : null;
    if (!node?.nonempty()) return;
    tracePath = !tracePath;
    focusNode(node, true, tracePath);
  }

  function toggleAllLinks() {
    showAllLinks = !showAllLinks;
    const node = selectedNodeId ? cy?.getElementById(selectedNodeId) : null;
    if (node?.nonempty()) focusNode(node, true, tracePath);
    else refreshEdgeVisibility();
  }

  function selectRelated(id) {
    const node = cy?.getElementById(id);
    if (!node?.nonempty()) return;
    tracePath = false;
    focusNode(node, true, false);
    cy.animate({ center: { eles: node }, duration: 280 });
  }

  function showTip(node, actionable = false) {
    const data = node.data();
    const position = node.renderedPosition();
    const halfWidth = 135;
    const width = container?.clientWidth || 0;
    tip = {
      id: node.id(),
      x: Math.max(halfWidth, Math.min(width - halfWidth, position.x)),
      y: Math.max(100, position.y),
      title: data.name ?? data.label,
      blurb: data.blurb,
      course: data.course,
      mastery: data.masteryLabel,
      colour: data.colour,
      skillCount: data.skillCount,
      actionable
    };
  }

  function showEdgeTip(edge) {
    const source = edge.source();
    const target = edge.target();
    const sourcePosition = source.renderedPosition();
    const targetPosition = target.renderedPosition();
    const halfWidth = 150;
    const width = container?.clientWidth || 0;
    edgeTip = {
      x: Math.max(halfWidth, Math.min(width - halfWidth, (sourcePosition.x + targetPosition.x) / 2)),
      y: Math.max(70, (sourcePosition.y + targetPosition.y) / 2),
      source: source.data('name') ?? source.data('label'),
      target: target.data('name') ?? target.data('label'),
      interdependent: edge.hasClass('interdependent'),
      cross: edge.hasClass('cross-course')
    };
  }

  function openNode(nodeOrId) {
    const node = typeof nodeOrId === 'string' ? cy?.getElementById(nodeOrId) : nodeOrId;
    if (!node?.nonempty()) return;
    if (mode === 'topic') {
      scopeTopicIds = [node.id()];
      scopeTopicId = node.id();
      mode = 'skill';
    } else {
      go(`/skill/${node.id()}?course=${node.data('courseId') || selected[0]}`);
    }
  }

  function bindGraphEvents() {
    cy.on('mouseover', 'node', (event) => {
      if (touchMode) return;
      if (!selectedNodeId) focusNode(event.target, false, false);
      showTip(event.target);
    });
    cy.on('mouseout', 'node', () => {
      if (touchMode) return;
      tip = null;
      if (!selectedNodeId) clearFocus();
    });
    cy.on('tap', 'node', (event) => {
      tracePath = false;
      focusNode(event.target, true, false);
      if (touchMode) tip = null;
    });
    cy.on('tap', (event) => { if (event.target === cy) clearFocus({ clearTip: true }); });
    cy.on('mouseover', 'edge.edge-visible', (event) => {
      if (!touchMode) showEdgeTip(event.target);
    });
    cy.on('mouseout', 'edge.edge-visible', () => { if (!touchMode) edgeTip = null; });
    cy.on('tap', 'edge.edge-visible', (event) => showEdgeTip(event.target));
    cy.on('dbltap', 'node', (event) => { if (!touchMode) openNode(event.target); });
    cy.on('viewport', onViewport);
  }

  function rebuildGraph(key, isDark) {
    if (!cy || cy.destroyed()) return;
    clearFocus({ clearTip: true });
    focusCache = new Map();
    labels = [];
    labelRecords = [];
    farState = null;

    const graphData = buildGraphData(isDark);
    const elements = graphData.elements;
    currentTopicGraph = graphData.topicGraph;
    const cached = getCachedGeometry(key);
    let routes = {};
    cy.batch(() => {
      cy.elements().remove();
      cy.add(elements);
    });
    // End the element batch before measuring nodes: Cytoscape resolves data-driven
    // widths at batch end. The following geometry batch still lands before paint.
    cy.startBatch();
    try {
      if (cached) {
        applyCachedGeometry(cached);
      } else {
        bands = layoutSwimlanes(cy);
        routes = routeEdges(cy, bands);
      }
    } finally {
      cy.endBatch();
    }

    if (!cached) setCachedGeometry(key, { positions: capturePositions(), routes, bands });
    currentGeometryKey = key;
    refreshEdgeVisibility();
    rebuildLabelRecords();
    if (cy.nodes().length) cy.fit(undefined, 30);
    updateLabelWorld();
    syncFar();
    scheduleBandDraw();
    refreshVisibleLabels();

    if (pendingFocusSkill) {
      const node = cy.getElementById(pendingFocusSkill);
      if (node.nonempty()) {
        cy.animate({ center: { eles: node }, zoom: 1.2 }, { duration: 350 });
        focusNode(node, true, false);
      }
      pendingFocusSkill = null;
    }
  }

  function applyTheme(isDark) {
    if (!cy || cy.destroyed()) return;
    currentDark = isDark;
    const nodeData = new Map(
      buildGraphData(isDark).elements
        .filter((element) => !('source' in (element.data || {})))
        .map((element) => [element.data.id, element.data])
    );
    cy.batch(() => {
      cy.style(getCyStyle(isDark));
      cy.nodes().forEach((node) => {
        const fresh = nodeData.get(node.id());
        if (fresh) node.data('ring', fresh.ring);
      });
    });
    refreshEdgeVisibility();
    scheduleBandDraw();
  }

  function zoomBy(factor) {
    if (!cy || cy.destroyed()) return;
    cy.zoom({
      level: cy.zoom() * factor,
      renderedPosition: { x: container.clientWidth / 2, y: container.clientHeight / 2 }
    });
  }

  function fitAll() {
    if (cy && !cy.destroyed() && cy.nodes().length) cy.fit(undefined, 30);
  }

  function jumpToCourse(title) {
    if (!cy || cy.destroyed()) return;
    const rows = bands?.rows || [];
    const lanes = bands?.lanes || [];
    const row = rows.find((candidate) => candidate.label === title);
    if (!row || !lanes.length) return;
    const boundingBox = {
      x1: lanes[0].xLeft,
      y1: row.yTop,
      x2: lanes[lanes.length - 1].xRight,
      y2: row.yBottom
    };
    cy.animate({ fit: { boundingBox, padding: 30 } }, { duration: 350 });
  }

  function labelEnter(id) {
    if (touchMode || !cy) return;
    const node = cy.getElementById(id);
    if (node.nonempty()) { if (!selectedNodeId) focusNode(node, false, false); showTip(node); }
  }

  function labelLeave() {
    if (touchMode) return;
    tip = null;
    if (!selectedNodeId) clearFocus();
  }

  function labelClick(id) {
    const node = cy?.getElementById(id);
    if (node?.nonempty()) {
      tracePath = false;
      focusNode(node, true, false);
    }
  }

  onMount(() => {
    touchMode = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    currentDark = theme.current === 'dark';
    cy = cytoscape({
      container,
      elements: [],
      style: getCyStyle(currentDark),
      minZoom: 0.1,
      maxZoom: 3,
      pixelRatio: 1,
      wheelSensitivity: WHEEL_ZOOM_SENSITIVITY,
      // Cached viewport textures leave a visible silhouette while zooming out,
      // and hiding edges makes them flash back in when a gesture ends. The label
      // world and geometry optimisations keep interaction light without either
      // distracting renderer shortcut.
      textureOnViewport: false,
      hideEdgesOnViewport: false,
      motionBlur: false,
      autoungrabify: true,
      autounselectify: true,
      boxSelectionEnabled: false
    });
    bindGraphEvents();
    rebuildGraph(graphKey(), currentDark);

    resizeObserver = new ResizeObserver(() => {
      cy?.resize();
      scheduleViewportPaint();
      scheduleBandDraw();
      scheduleLabelCull();
    });
    resizeObserver.observe(container);

    const onKeydown = (event) => {
      if (event.key !== 'Escape') return;
      if (selectedNodeId) clearFocus({ clearTip: true });
      else if (sidebarOpen) sidebarOpen = false;
      else clearFocus({ clearTip: true });
    };
    window.addEventListener('keydown', onKeydown);

    return () => {
      window.removeEventListener('keydown', onKeydown);
      resizeObserver?.disconnect();
      if (viewportRaf) cancelAnimationFrame(viewportRaf);
      if (bandRaf) cancelAnimationFrame(bandRaf);
      clearTimeout(labelTimer);
      cy?.destroy();
    };
  });

  $effect(() => {
    selected; mode; scopeTopicIds; crossOnly;
    const key = graphKey();
    if (cy && key !== currentGeometryKey) rebuildGraph(key, untrack(() => theme.current === 'dark'));
  });

  $effect(() => {
    const isDark = theme.current === 'dark';
    if (cy && isDark !== currentDark) applyTheme(isDark);
  });

  let scopeLabel = $derived(scopeTopicId ? topicById.get(scopeTopicId)?.title : null);
</script>

<div class="map-wrap">
  {#if sidebarOpen}
    <button class="drawer-backdrop" aria-label="Close map filters" onclick={() => (sidebarOpen = false)}></button>
  {/if}

  <aside class="sidebar" class:open={sidebarOpen} aria-label="Map filters">
    <div class="sidebar-head">
      <div>
        <span class="sidebar-kicker">Explore</span>
        <h1>Maths map</h1>
      </div>
      <button class="drawer-close" aria-label="Close map filters" onclick={() => (sidebarOpen = false)}>×</button>
    </div>
    <p class="muted hint">
      Choose courses to compare, then select a node to trace what comes before and after it.
    </p>

    <div class="section-label">View</div>
    <div class="seg">
      <button class:on={mode === 'topic'} onclick={() => setMode('topic')}>Topics</button>
      <button class:on={mode === 'skill'} onclick={() => setMode('skill')}>Skills</button>
    </div>
    <p class="muted hint">{touchMode ? 'Tap a node, then use Open.' : `Double-click a ${mode === 'topic' ? 'topic' : 'skill'} to open it.`}</p>

    {#if scopeLabel}
      <div class="scope-pill">
        Scoped to <strong>{scopeLabel}</strong>
        <button class="link" onclick={() => { scopeTopicIds = null; scopeTopicId = null; }}>Show all skills</button>
      </div>
    {/if}

    <details class="map-options">
      <summary>Advanced link options</summary>
      <label class="cross-toggle">
        <input type="checkbox" checked={crossOnly} onchange={() => (crossOnly = !crossOnly)} />
        Only show cross-course links
      </label>
      <label class="cross-toggle">
        <input type="checkbox" checked={showLabels} onchange={() => { showLabels = !showLabels; refreshVisibleLabels(); }} />
        Show labels
      </label>
      <label class="cross-toggle">
        <input type="checkbox" checked={showAllLinks} onchange={toggleAllLinks} />
        Show all links
      </label>
    </details>

    <div class="section-label">Courses</div>
    <div class="course-list">
      {#each courses as course}
        <label class="course-opt" class:on={selected.includes(course.id)}>
          <input type="checkbox" checked={selected.includes(course.id)} onchange={() => toggle(course.id)} />
          <span class="swatch" style="background:{course.color}"></span>
          <span class="course-title">{course.title}</span>
          {#if selected.includes(course.id)}
            <button
              class="locate"
              title="Jump to this course on the map"
              aria-label="Jump to {course.title}"
              onclick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                jumpToCourse(course.title);
                if (touchMode) sidebarOpen = false;
              }}
            >⌖</button>
          {/if}
        </label>
      {/each}
    </div>

    <div class="section-label">Link direction</div>
    <ul class="link-legend">
      <li><span class="link-sample incoming"></span> Comes before selected</li>
      <li><span class="link-sample outgoing"></span> Leads on from selected</li>
      <li><span class="link-sample interdependent"></span> Interdependent topics</li>
      <li><span class="link-sample cross"></span> Cross-course link</li>
    </ul>

    <div class="section-label">Progress key</div>
    <ul class="legend">
      <li><span class="ring" style="--c:var(--track); --p:100%"></span> Not started</li>
      <li><span class="ring" style="--c:var(--status-learning-fill); --p:33%"></span> Learning</li>
      <li><span class="ring" style="--c:var(--status-proficient-fill); --p:66%"></span> Proficient</li>
      <li><span class="ring" style="--c:var(--status-mastered-fill); --p:100%"></span> Mastered</li>
      <li><span class="ring ready"></span> Ready now</li>
    </ul>
    <p class="muted hint">Each node is a mastery ring. A dashed teal halo marks topics whose prerequisites are complete.</p>
  </aside>

  <div class="graph-area" class:inspector-open={Boolean(inspector)}>
    <canvas bind:this={bandCanvas} class="bands"></canvas>
    <div bind:this={container} class="graph"></div>

    <div class="label-layer" aria-hidden={!showLabels}>
      <div bind:this={labelWorld} class="label-world">
        {#each labels as label (label.id)}
          <button
            type="button"
            class="node-label"
            class:boundary={label.boundary}
            class:ready={label.ready}
            class:focused={label.focused}
            class:focus-root={label.root}
            class:dimmed={label.dimmed}
            style="left:{label.x}px; top:{label.y}px;"
            onmouseenter={() => labelEnter(label.id)}
            onmouseleave={labelLeave}
            onclick={() => labelClick(label.id)}
            ondblclick={() => { if (!touchMode) openNode(label.id); }}
          >{@html label.html}</button>
        {/each}
      </div>
    </div>

    {#if tip}
      <div
        class="tip"
        class:touch={tip.actionable}
        style="left:{tip.x}px; top:{tip.y}px; --c:{tip.colour}"
      >
        <strong><MathText text={tip.title} /></strong>
        {#if tip.blurb}<span class="tip-blurb"><MathText text={tip.blurb} /></span>{/if}
        <span class="tip-meta">
          {tip.course} · {tip.mastery}{#if tip.skillCount} · {tip.skillCount} skills{/if}
        </span>
        {#if tip.actionable}
          <button class="tip-open" onclick={() => openNode(tip.id)}>Open {mode === 'topic' ? 'topic' : 'skill'} →</button>
        {/if}
      </div>
    {/if}

    {#if edgeTip}
      <div class="edge-tip" style="left:{edgeTip.x}px; top:{edgeTip.y}px;">
        <span class="edge-tip-route">
          <MathText text={edgeTip.source} />
          <strong aria-hidden="true">{edgeTip.interdependent ? '↔' : '→'}</strong>
          <MathText text={edgeTip.target} />
        </span>
        <small>{edgeTip.interdependent ? 'Interdependent topics' : edgeTip.cross ? 'Cross-course prerequisite' : 'Prerequisite direction'}</small>
      </div>
    {/if}

    {#if inspector}
      <aside class="node-inspector" aria-label="Selected {mode === 'topic' ? 'topic' : 'skill'}">
        <div class="inspector-head">
          <div>
            <span class="inspector-kicker">Selected {mode === 'topic' ? 'topic' : 'skill'}</span>
            <h2><MathText text={inspector.title} /></h2>
          </div>
          <button class="inspector-close" aria-label="Close selection" onclick={() => clearFocus({ clearTip: true })}>×</button>
        </div>
        <div class="inspector-meta">
          {#if inspector.course}<span>{inspector.course}</span>{/if}
          {#if inspector.mastery}<span>{inspector.mastery}</span>{/if}
          {#if inspector.skillCount}<span>{inspector.skillCount} skills</span>{/if}
        </div>
        {#if inspector.blurb}<p class="inspector-blurb"><MathText text={inspector.blurb} /></p>{/if}

        <div class="relation-groups">
          <section>
            <h3><span class="relation-dot incoming"></span>Comes before <small>{inspector.incoming.length}</small></h3>
            {#if inspector.incoming.length}
              <div class="relation-list">
                {#each inspector.incoming as item}
                  <button onclick={() => selectRelated(item.id)}><MathText text={item.title} /><span aria-hidden="true">←</span></button>
                {/each}
              </div>
            {:else}<p class="relation-empty">No earlier prerequisite shown.</p>{/if}
          </section>
          <section>
            <h3><span class="relation-dot outgoing"></span>Leads to <small>{inspector.outgoing.length}</small></h3>
            {#if inspector.outgoing.length}
              <div class="relation-list">
                {#each inspector.outgoing as item}
                  <button onclick={() => selectRelated(item.id)}><MathText text={item.title} /><span aria-hidden="true">→</span></button>
                {/each}
              </div>
            {:else}<p class="relation-empty">No next step shown.</p>{/if}
          </section>
          {#if inspector.interdependent.length}
            <section>
              <h3><span class="relation-dot interdependent"></span>Interdependent</h3>
              <div class="relation-list">
                {#each inspector.interdependent as item}
                  <button onclick={() => selectRelated(item.id)}><MathText text={item.title} /><span aria-hidden="true">↔</span></button>
                {/each}
              </div>
            </section>
          {/if}
        </div>

        <div class="inspector-actions">
          <button class:active={tracePath} onclick={toggleTracePath}>{tracePath ? 'Show direct links' : 'Trace full pathway'}</button>
          <button class="primary" onclick={() => openNode(inspector.id)}>Open {mode === 'topic' ? 'topic skills' : 'skill'} →</button>
        </div>
      </aside>
      <div class="sr-only" aria-live="polite">{inspector.title} selected. {inspector.incoming.length} prerequisites and {inspector.outgoing.length} next steps.</div>
    {/if}

    <div class="map-toolbar">
      <button class="filters-button" aria-expanded={sidebarOpen} onclick={() => (sidebarOpen = true)}>☰ <span>Filters</span></button>
    </div>
    {#if !selectedNodeId && !tip}
      <div class="map-guide">
        <strong>{mode === 'topic' ? 'A simpler overview' : scopeTopicIds ? 'Topic skill links' : 'Select a skill to reveal its links'}</strong>
        <span>{mode === 'topic' ? 'Only the essential pathway is shown. Select a topic to see every direct connection.' : scopeTopicIds ? 'Select a skill to distinguish what comes before and after it.' : 'The global skill map hides links until you choose a skill.'}</span>
      </div>
    {/if}
    <div class="zoom-controls" aria-label="Map zoom controls">
      <button aria-label="Zoom in" title="Zoom in" onclick={() => zoomBy(ZOOM_STEP)}>＋</button>
      <button aria-label="Zoom out" title="Zoom out" onclick={() => zoomBy(1 / ZOOM_STEP)}>−</button>
      <button aria-label="Fit whole map" title="Fit whole map" onclick={fitAll}>⤢</button>
    </div>
    {#if selected.length === 0}
      <div class="empty"><span aria-hidden="true">↝</span><strong>Choose a course to begin</strong><small>The learning routes will appear here.</small></div>
    {/if}
  </div>
</div>

<style>
  .map-wrap {
    --map-label-bg: color-mix(in srgb, var(--panel) 96%, transparent);
    --map-label-border: rgba(148, 163, 184, 0.38);
    --map-ready: #22d3ee;
    position: relative;
    display: flex;
    height: calc(100dvh - var(--top-nav-height, 72px));
    overflow: hidden;
    background: var(--app-canvas);
    font-family: var(--font-body);
  }
  :global([data-theme="light"]) .map-wrap {
    --map-label-bg: rgba(255, 255, 255, 0.98);
    --map-label-border: #cbd5e1;
    --map-ready: #0e7490;
  }

  .sidebar {
    width: 280px;
    flex: 0 0 280px;
    overflow-y: auto;
    padding: 1rem 1.1rem max(1rem, env(safe-area-inset-bottom));
    border-right: 1px solid var(--border-strong);
    background: linear-gradient(165deg, var(--surface-warm), var(--panel) 32%);
    z-index: 7;
  }
  .sidebar-head { display: flex; align-items: center; justify-content: space-between; }
  .sidebar h1 { margin: 0.08rem 0 0; font-family: var(--font-display); font-size: 1.35rem; }
  .sidebar-kicker { display: block; color: var(--accent); font-size: 0.64rem; font-weight: 750; letter-spacing: 0.09em; text-transform: uppercase; }
  .drawer-close { display: none; }
  .hint { font-size: 0.76rem; line-height: 1.5; margin: 0.45rem 0 0; }
  .section-label {
    font-size: 0.65rem;
    font-weight: 750;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    color: var(--muted);
    margin: 1.15rem 0 0.45rem;
  }
  .seg { display: flex; gap: 0.3rem; }
  .seg button,
  .zoom-controls button,
  .filters-button,
  .drawer-close {
    border: 1px solid var(--border-strong);
    background: color-mix(in srgb, var(--panel) 92%, transparent);
    color: var(--text);
    cursor: pointer;
  }
  .seg button { flex: 1; min-height: 38px; padding: 0.35rem 0.5rem; border-radius: 10px; font: 650 0.78rem var(--font-body); }
  .seg button.on { background: var(--accent); border-color: transparent; color: #fff; }
  .seg button:hover:not(.on), .zoom-controls button:hover, .filters-button:hover { border-color: var(--border-strong); background: var(--panel-2); }
  button:focus-visible, .node-label:focus-visible, input:focus-visible { outline: 3px solid color-mix(in srgb, var(--accent) 45%, transparent); outline-offset: 2px; }

  .scope-pill { margin-top: 0.65rem; padding: 0.65rem; border: 1px solid var(--border); border-radius: 10px; background: var(--surface-soft); font-size: 0.76rem; }
  .scope-pill .link { display: block; margin-top: 0.25rem; padding: 0; border: 0; background: none; color: var(--accent); cursor: pointer; font-size: 0.76rem; }
  .map-options { margin-top: 0.65rem; border: 1px solid var(--border); border-radius: 10px; background: color-mix(in srgb, var(--surface-soft) 70%, transparent); }
  .map-options summary { padding: 0.58rem 0.65rem; color: var(--muted); cursor: pointer; font-size: 0.76rem; font-weight: 700; }
  .map-options[open] { padding-bottom: 0.35rem; }
  .map-options[open] summary { color: var(--text); border-bottom: 1px solid var(--border); margin-bottom: 0.2rem; }
  .map-options .cross-toggle { margin-inline: 0.35rem; }
  .cross-toggle { display: flex; align-items: center; gap: 0.55rem; min-height: 36px; margin-top: 0.25rem; padding: 0.2rem 0.25rem; border-radius: 8px; font-size: 0.78rem; cursor: pointer; }
  .cross-toggle:hover { background: var(--surface-soft); }
  .cross-toggle input, .course-opt input { accent-color: var(--accent); cursor: pointer; }
  .course-list { display: flex; flex-direction: column; gap: 0.3rem; }
  .course-opt { display: flex; align-items: center; gap: 0.5rem; min-height: 40px; padding: 0.4rem 0.5rem; border: 1px solid transparent; border-radius: 10px; cursor: pointer; font-size: 0.8rem; }
  .course-opt:hover, .course-opt.on { background: var(--surface-soft); }
  .course-opt.on { border-color: var(--border-strong); background: var(--surface-soft); }
  .swatch { width: 12px; height: 12px; border-radius: 3px; flex: none; }
  .course-title { line-height: 1.2; }
  .locate { margin-left: auto; width: 28px; height: 28px; flex: none; padding: 0; border: 1px solid var(--border-strong); border-radius: 8px; background: var(--panel); color: var(--muted); cursor: pointer; }
  .locate:hover { color: var(--accent); border-color: var(--border-strong); background: var(--panel-2); }
  .link-legend { display: flex; flex-direction: column; gap: 0.42rem; list-style: none; margin: 0; padding: 0; font-size: 0.74rem; }
  .link-legend li { display: flex; align-items: center; gap: 0.5rem; }
  .link-sample { position: relative; width: 28px; height: 0; flex: none; border-top: 3px solid var(--border-strong); color: var(--border-strong); }
  .link-sample::after { content: ''; position: absolute; top: -5px; right: -1px; border-block: 4px solid transparent; border-left: 6px solid currentColor; }
  .link-sample.incoming { border-color: #fbbf24; color: #fbbf24; }
  .link-sample.outgoing { border-color: #2dd4bf; color: #2dd4bf; }
  .link-sample.interdependent { border-color: #c084fc; color: #c084fc; border-top-style: dashed; }
  .link-sample.interdependent::before { content: ''; position: absolute; top: -5px; left: -1px; border-block: 4px solid transparent; border-right: 6px solid currentColor; }
  .link-sample.cross { border-color: #f59e0b; color: #f59e0b; border-top-style: dashed; }
  .legend { display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem 0.65rem; list-style: none; margin: 0; padding: 0; font-size: 0.74rem; }
  .legend li { display: flex; align-items: center; gap: 0.45rem; min-width: 0; }
  .legend .ring { position: relative; width: 16px; height: 16px; flex: none; border-radius: 50%; background: conic-gradient(var(--c) 0 var(--p), var(--track) var(--p) 100%); }
  .legend .ring::before { content: ''; position: absolute; inset: 3px; border-radius: 50%; background: var(--panel); }
  .legend .ring.ready { background: none; border: 2px dashed var(--map-ready); }
  .legend .ring.ready::before { content: none; }

  .graph-area { position: relative; flex: 1 1 auto; min-width: 0; overflow: hidden; contain: layout paint style; background: var(--app-canvas); }
  .bands, .graph, .label-layer { position: absolute; inset: 0; }
  .bands { width: 100%; height: 100%; z-index: 0; }
  .graph { z-index: 1; background: transparent; touch-action: none; }
  .label-layer { z-index: 2; overflow: hidden; pointer-events: none; contain: strict; }
  .label-world { position: absolute; inset: 0; transform-origin: 0 0; will-change: transform; }
  .node-label {
    position: absolute;
    transform: translateX(-50%) scale(var(--label-counter-scale, 1));
    transform-origin: top center;
    margin-top: calc(4px * var(--label-counter-scale, 1));
    max-width: 150px;
    width: max-content;
    padding: 4px 8px;
    border: 1px solid var(--map-label-border);
    border-radius: 10px;
    background: var(--map-label-bg);
    color: var(--text);
    box-shadow: var(--shadow);
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 600;
    line-height: 1.2;
    text-align: center;
    text-wrap: balance;
    white-space: normal;
    opacity: var(--label-fade, 1);
    pointer-events: auto;
    cursor: pointer;
    user-select: none;
    appearance: none;
  }
  .node-label.boundary { font-size: 13px; opacity: 0.62; }
  .node-label.ready { color: var(--map-ready); font-weight: 700; }
  .node-label.dimmed { opacity: 0.28; }
  .node-label.focused { opacity: 1; border-color: color-mix(in srgb, var(--text) 42%, transparent); }
  .node-label.focus-root { opacity: 1; border-color: var(--border-strong); background: var(--panel-2); box-shadow: var(--shadow); }
  .node-label :global(.katex) { font-size: 1em; }

  .tip { position: absolute; z-index: 5; transform: translate(-50%, calc(-100% - 16px)); width: max-content; max-width: 270px; padding: 0.7rem 0.8rem; border: 1px solid var(--border-strong); border-radius: 12px; background: var(--panel); box-shadow: var(--shadow-lg); pointer-events: none; display: flex; flex-direction: column; gap: 0.3rem; }
  .tip strong { font-size: 0.88rem; line-height: 1.25; }
  .tip-blurb { font-size: 0.77rem; color: var(--muted); }
  .tip-meta { font-size: 0.7rem; color: var(--muted); }
  .tip-open { min-height: 40px; margin-top: 0.25rem; border: 0; border-radius: 9px; background: var(--accent); color: #fff; font: 700 0.78rem var(--font-body); cursor: pointer; }

  .edge-tip { position: absolute; z-index: 6; transform: translate(-50%, calc(-100% - 12px)); width: max-content; max-width: 310px; padding: 0.55rem 0.7rem; border: 1px solid var(--border-strong); border-radius: 10px; background: color-mix(in srgb, var(--panel) 96%, transparent); box-shadow: var(--shadow); pointer-events: none; }
  .edge-tip-route { display: flex; align-items: center; gap: 0.4rem; color: var(--text); font-size: 0.76rem; font-weight: 650; }
  .edge-tip-route strong { color: var(--accent); font-size: 1rem; }
  .edge-tip small { display: block; margin-top: 0.2rem; color: var(--muted); font-size: 0.66rem; }

  .node-inspector { position: absolute; z-index: 8; top: 14px; right: 14px; bottom: 14px; width: min(330px, calc(100% - 28px)); display: flex; flex-direction: column; padding: 1rem; border: 1px solid var(--border-strong); border-radius: 16px; background: color-mix(in srgb, var(--panel) 96%, transparent); box-shadow: var(--shadow-lg); backdrop-filter: blur(16px); overflow: hidden; }
  .inspector-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; }
  .inspector-kicker { display: block; margin-bottom: 0.2rem; color: var(--accent); font-size: 0.62rem; font-weight: 800; letter-spacing: 0.09em; text-transform: uppercase; }
  .inspector-head h2 { margin: 0; font: 600 1.12rem/1.2 var(--font-display); text-wrap: balance; }
  .inspector-close { width: 36px; height: 36px; flex: none; padding: 0; border: 1px solid var(--border); border-radius: 10px; background: var(--surface-soft); color: var(--muted); cursor: pointer; font-size: 1.25rem; }
  .inspector-close:hover { color: var(--text); background: var(--panel-2); }
  .inspector-meta { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.65rem; }
  .inspector-meta span { padding: 0.2rem 0.45rem; border: 1px solid var(--border); border-radius: 999px; color: var(--muted); background: var(--surface-soft); font-size: 0.66rem; }
  .inspector-blurb { margin: 0.7rem 0 0; color: var(--muted); font-size: 0.77rem; line-height: 1.45; }
  .relation-groups { min-height: 0; margin-top: 0.8rem; padding-right: 0.15rem; overflow-y: auto; }
  .relation-groups section + section { margin-top: 0.8rem; }
  .relation-groups h3 { display: flex; align-items: center; gap: 0.4rem; margin: 0 0 0.35rem; color: var(--text); font: 750 0.72rem/1.2 var(--font-body); text-transform: uppercase; letter-spacing: 0.04em; }
  .relation-groups h3 small { margin-left: auto; color: var(--muted); font-size: 0.66rem; }
  .relation-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border-strong); }
  .relation-dot.incoming { background: #fbbf24; }
  .relation-dot.outgoing { background: #2dd4bf; }
  .relation-dot.interdependent { background: #c084fc; }
  .relation-list { display: flex; flex-direction: column; gap: 0.28rem; }
  .relation-list button { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; min-height: 36px; padding: 0.42rem 0.55rem; border: 1px solid transparent; border-radius: 9px; background: var(--surface-soft); color: var(--text); cursor: pointer; text-align: left; font: 600 0.73rem/1.25 var(--font-body); }
  .relation-list button:hover { border-color: var(--border-strong); background: var(--panel-2); }
  .relation-list button span:last-child { color: var(--muted); }
  .relation-empty { margin: 0; color: var(--muted); font-size: 0.7rem; }
  .inspector-actions { display: grid; grid-template-columns: 1fr; gap: 0.4rem; margin-top: auto; padding-top: 0.8rem; }
  .inspector-actions button { min-height: 40px; padding: 0.5rem 0.65rem; border: 1px solid var(--border-strong); border-radius: 10px; background: var(--surface-soft); color: var(--text); cursor: pointer; font: 700 0.75rem var(--font-body); }
  .inspector-actions button.active { border-color: #c084fc; color: #c084fc; }
  .inspector-actions button.primary { border-color: transparent; background: var(--accent); color: #fff; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

  .map-guide { position: absolute; z-index: 4; top: 12px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; width: min(420px, calc(100% - 150px)); padding: 0.55rem 0.75rem; border: 1px solid var(--border); border-radius: 12px; background: color-mix(in srgb, var(--panel) 90%, transparent); box-shadow: var(--shadow); backdrop-filter: blur(12px); pointer-events: none; text-align: center; }
  .map-guide strong { font-size: 0.76rem; }
  .map-guide span { margin-top: 0.12rem; color: var(--muted); font-size: 0.68rem; line-height: 1.35; }

  .map-toolbar { position: absolute; z-index: 4; top: 12px; left: 12px; }
  .filters-button { display: none; min-height: 44px; padding: 0 0.85rem; border-radius: 10px; align-items: center; gap: 0.45rem; box-shadow: var(--shadow); backdrop-filter: blur(10px); font: 700 0.78rem var(--font-body); }
  .zoom-controls { position: absolute; right: max(12px, env(safe-area-inset-right)); bottom: max(12px, env(safe-area-inset-bottom)); z-index: 4; display: flex; flex-direction: column; gap: 5px; padding: 5px; border: 1px solid var(--border-strong); border-radius: 14px; background: color-mix(in srgb, var(--panel) 88%, transparent); box-shadow: var(--shadow); backdrop-filter: blur(10px); }
  .zoom-controls button { width: 40px; height: 40px; padding: 0; border-radius: 9px; font-size: 1.15rem; }
  .empty { position: absolute; inset: 0; z-index: 3; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.15rem; margin: auto; width: max-content; height: max-content; padding: 1.1rem 1.4rem; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--panel); color: var(--muted); box-shadow: var(--shadow); pointer-events: none; }
  .empty > span { color: var(--accent); font-size: 1.6rem; transform: rotate(-18deg); }
  .empty strong { color: var(--text); font-family: var(--font-display); font-size: 1rem; }
  .empty small { font-size: 0.72rem; }
  .drawer-backdrop { display: none; }

  @media (max-width: 768px) {
    .sidebar { position: absolute; inset: 0 auto 0 0; width: min(320px, 88vw); max-width: 88vw; flex-basis: auto; padding-top: max(1rem, env(safe-area-inset-top)); transform: translateX(-105%); transition: transform 180ms ease; box-shadow: 12px 0 34px rgba(0,0,0,.42); }
    .sidebar.open { transform: translateX(0); }
    .drawer-close { display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border-radius: 9px; font-size: 1.5rem; }
    .drawer-backdrop { display: block; position: absolute; inset: 0; z-index: 6; border: 0; background: rgba(3, 7, 18, 0.58); backdrop-filter: blur(2px); }
    .filters-button { display: inline-flex; }
    .zoom-controls button { width: 44px; height: 44px; }
    .tip.touch { position: absolute; left: 12px !important; right: 12px; top: auto !important; bottom: calc(70px + env(safe-area-inset-bottom)); width: auto; max-width: none; transform: none; pointer-events: auto; }
    .map-guide { top: 68px; width: min(300px, calc(100% - 24px)); }
    .node-inspector { top: auto; left: 8px; right: 8px; bottom: max(8px, env(safe-area-inset-bottom)); width: auto; max-height: 46dvh; padding: 0.85rem; border-radius: 18px; }
    .inspector-head h2 { font-size: 1rem; }
    .inspector-blurb { display: none; }
    .relation-groups { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem; }
    .relation-groups section + section { margin-top: 0; }
    .relation-groups section:last-child { grid-column: 1 / -1; }
    .inspector-actions { grid-template-columns: 1fr 1fr; }
    .graph-area.inspector-open .zoom-controls { bottom: calc(46dvh + 14px); }
    .edge-tip { max-width: min(300px, calc(100% - 24px)); }
  }

</style>
