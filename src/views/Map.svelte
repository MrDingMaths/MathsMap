<script>
  import { onMount, untrack } from 'svelte';
  import cytoscape from 'cytoscape';
  import { getCyStyle, routeEdges } from '../lib/graph.js';
  import { ACCENT } from '../lib/tokens.js';
  import { theme } from '../lib/theme.svelte.js';
  import { buildTopicGraph } from '../lib/topicGraph.js';
  import { layoutSwimlanes, drawBands, strandPanelStyle } from '../lib/swimlane.js';
  import {
    boundsFromBands,
    clampPanToBounds,
    computeZoomBounds,
    getCachedGeometry,
    initialViewport,
    labelFade,
    mapGeometryKey,
    selectVisibleLabels,
    setCachedGeometry,
    wheelIntent,
    wheelPanDelta,
    wheelZoomFactor
  } from '../lib/mapView.js';
  import { GROUP_HEAD_H, GROUP_ROW_H, CARD_PAD_X, CARD_PAD_Y, CARD_FOOT_H } from '../lib/mapCards.js';
  import { courses, courseById, topicById, skillById, dependentsOf, skillsForTopic, topicsForSkill, STRANDS } from '../lib/data.js';
  import { getMastery, MASTERY } from '../lib/store.js';
  import { go, href } from '../lib/router.svelte.js';
  import MathText, { renderMath } from '../components/Math.svelte';
  import MasteryRing from '../components/MasteryRing.svelte';

  let { courseId = null, skillId = null, topicId = null, focusId = null } = $props();
  let graphArea;
  let container;
  let bandCanvas;
  let labelWorld;
  let minimapCanvas = $state(null);
  let cy;
  let bands = $state.raw({ lanes: [], rows: [] });
  let graphBounds = $state.raw(null);
  let labelRecords = [];
  let currentGeometryKey = null;
  let currentDark = null;
  let currentTopicGraph = null;
  // Raw state: holds Cytoscape collections, which must not be proxied.
  let activeFocus = $state.raw(null);
  let focusCache = new Map();
  let viewportRaf = null;
  let bandRaf = null;
  let labelTimer = null;
  let lastLabelCullAt = 0;
  let farState = null;
  let lastFarZoom = null;
  let clampingViewport = false;
  let resizeObserver = null;
  let firstBuild = true;

  // Deep links: ?course=a,b selects courses; ?topic= opens that topic's skill
  // list; ?skill= opens its topic and selects the skill.
  const initialCourses = untrack(() => courseId)?.split(',').filter((id) => courseById.has(id)) ?? [];
  const initSkill = untrack(() => skillId) ? skillById.get(untrack(() => skillId)) : null;
  const initTopic = untrack(() => topicId) ? topicById.get(untrack(() => topicId)) : null;

  let selected = $state(
    initialCourses.length
      ? initialCourses
      : initSkill
        ? [...(initSkill.courses || [])]
        : initTopic
          ? [...(initTopic.courses || [])]
          : ['s4', 's5-core']
  );
  let expandedTopicId = $state(initSkill ? topicsForSkill(initSkill.id)[0] ?? null : initTopic?.id ?? null);
  let pendingSkillId = initSkill?.id ?? null;
  let pendingSelectTopic = !initSkill && !initTopic ? untrack(() => focusId) ?? null : null;
  let pendingCentre = Boolean(initSkill || initTopic);
  let crossOnly = $state(false);
  // Main pathways show by default (quiet), so the map's structure reads at a
  // glance; selecting a topic highlights its own links.
  let linkMode = $state('main');
  let hiddenStrands = $state([]);
  let showReady = $state(true);
  let tracePath = $state(false);
  let selectedNodeId = $state(null);
  let selectedSkillId = $state(null);
  let inspector = $state(null);
  let edgeTip = $state(null);
  let labels = $state([]);
  // Opened topics, each listing its skills. One at a time normally; every
  // topic when "All skills" is on.
  let groups = $state([]);
  let showAllSkills = $state(false);
  let filtersOpen = $state(true);
  let legendOpen = $state(true);
  let touchMode = $state(false);
  let narrow = $state(false);

  function toggleCourse(id) {
    selected = selected.includes(id) ? selected.filter((course) => course !== id) : [...selected, id];
  }
  function toggleStrand(strand) {
    hiddenStrands = hiddenStrands.includes(strand)
      ? hiddenStrands.filter((s) => s !== strand)
      : [...hiddenStrands, strand];
  }

  function buildGraphData(isDark) {
    const topicGraph = buildTopicGraph({
      courseIds: selected,
      isDark,
      crossOnly,
      expandedTopicId,
      expandAll: showAllSkills,
      hiddenStrands: new Set(hiddenStrands)
    });
    return { elements: topicGraph.elements, topicGraph };
  }

  function graphKey() {
    return mapGeometryKey({ mode: 'topic', courseIds: selected, crossOnly, expanded: showAllSkills ? '*' : expandedTopicId, hiddenStrands });
  }

  function applyCachedGeometry(geometry) {
    for (const [id, position] of Object.entries(geometry.positions)) {
      const node = cy.getElementById(id);
      if (node.nonempty()) node.position(position);
    }
    for (const [id, gutters] of Object.entries(geometry.gutters || {})) {
      const node = cy.getElementById(id);
      if (node.nonempty()) { node.data('_gAbove', gutters[0]); node.data('_gBelow', gutters[1]); }
    }
    for (const [id, style] of Object.entries(geometry.routes)) {
      const edge = cy.getElementById(id);
      if (edge.nonempty()) { edge.addClass('routed'); edge.style(style); }
    }
    bands = geometry.bands;
  }

  function captureGeometry() {
    const positions = {};
    const gutters = {};
    cy.nodes().forEach((node) => {
      positions[node.id()] = { ...node.position() };
      gutters[node.id()] = [node.data('_gAbove'), node.data('_gBelow')];
    });
    return { positions, gutters };
  }

  function rebuildLabelRecords() {
    labelRecords = cy.nodes().filter((node) => !node.hasClass('expanded')).map((node) => {
      const position = node.position();
      const w = node.data('w') ?? node.width();
      const h = node.data('h') ?? node.height();
      return {
        id: node.id(),
        name: node.data('name') ?? node.data('label'),
        x: position.x - w / 2,
        y: position.y - h / 2,
        w,
        h,
        ready: node.hasClass('ready'),
        skillCount: node.data('skillCount') ?? 0,
        priority: node.degree(false) + (node.hasClass('ready') ? 1000 : 0)
      };
    });
  }

  function groupFor(node) {
    const id = node.id();
    const topic = topicById.get(id);
    const wanted = new Set(node.data('skillIds') || []);
    const ordered = [];
    const seen = new Set();
    for (const dp of skillsForTopic(id)) {
      for (const skill of dp.skills) {
        if (wanted.has(skill.id) && !seen.has(skill.id)) { seen.add(skill.id); ordered.push(skill); }
      }
    }
    for (const skillIdValue of wanted) if (!seen.has(skillIdValue) && skillById.has(skillIdValue)) ordered.push(skillById.get(skillIdValue));
    const position = node.position();
    const w = node.data('w');
    const h = node.data('h');
    const stats = node.data('stats') || {};
    return {
      id,
      title: topic?.title ?? id,
      x: position.x - w / 2,
      y: position.y - h / 2,
      w,
      h,
      gAbove: node.data('_gAbove'),
      gBelow: node.data('_gBelow'),
      ready: (stats.mastered ?? 0) + (stats.proficient ?? 0),
      total: ordered.length,
      rows: ordered.map((skill) => ({ id: skill.id, title: skill.title, level: getMastery(skill.id) }))
    };
  }

  function rebuildGroups() {
    groups = cy.nodes('.expanded').map(groupFor);
  }

  // The opened topic that lists a skill (its first topic on the map that is open).
  function groupOfSkill(id) {
    const topics = topicsForSkill(id);
    for (const topic of topics) {
      const found = groups.find((g) => g.id === topic && g.rows.some((row) => row.id === id));
      if (found) return found;
    }
    return groups.find((g) => g.rows.some((row) => row.id === id)) ?? null;
  }

  function focusedIdSet() {
    return activeFocus ? new Set(activeFocus.nodes.map((node) => node.id())) : new Set();
  }

  function refreshVisibleLabels() {
    if (!cy || cy.destroyed()) { labels = []; return; }
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
    labelWorld.style.transform = `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`;
    labelWorld.style.setProperty('--label-fade', String(labelFade(zoom)));
  }

  function scheduleViewportPaint() {
    if (viewportRaf) return;
    viewportRaf = requestAnimationFrame(() => {
      viewportRaf = null;
      updateLabelWorld();
      syncFar();
      drawMinimap();
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
    const now = performance.now();
    const elapsed = now - lastLabelCullAt;
    if (elapsed >= 80) {
      clearTimeout(labelTimer);
      labelTimer = null;
      lastLabelCullAt = now;
      refreshVisibleLabels();
      return;
    }
    if (labelTimer) return;
    labelTimer = setTimeout(() => {
      labelTimer = null;
      lastLabelCullAt = performance.now();
      refreshVisibleLabels();
    }, 80 - elapsed);
  }

  function setViewport(zoom, pan) {
    if (!cy || cy.destroyed() || !container) return;
    const clamped = graphBounds
      ? clampPanToBounds(pan, zoom, graphBounds, container.clientWidth, container.clientHeight)
      : pan;
    clampingViewport = true;
    try {
      cy.viewport({ zoom, pan: clamped });
    } finally {
      clampingViewport = false;
    }
    edgeTip = null;
    scheduleViewportPaint();
    scheduleBandDraw();
    scheduleLabelCull();
  }

  function enforceViewportBounds() {
    if (clampingViewport || !cy || cy.destroyed() || cy.animated() || !graphBounds || !container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!(width > 0) || !(height > 0)) return;
    const pan = cy.pan();
    const clamped = clampPanToBounds(pan, cy.zoom(), graphBounds, width, height);
    if (Math.abs(clamped.x - pan.x) > 0.5 || Math.abs(clamped.y - pan.y) > 0.5) {
      clampingViewport = true;
      try {
        cy.pan(clamped);
      } finally {
        clampingViewport = false;
      }
    }
  }

  function onViewport() {
    if (clampingViewport) return;
    enforceViewportBounds();
    edgeTip = null;
    scheduleViewportPaint();
    scheduleBandDraw();
    scheduleLabelCull();
  }

  const FAR_ZOOM = 0.55;
  const ZOOM_STEP = 1.2;
  function syncFar() {
    if (!cy || cy.destroyed()) return;
    const next = cy.zoom() < FAR_ZOOM;
    if (next === farState) return;
    farState = next;
    lastFarZoom = next ? cy.zoom() : null;
    cy.batch(() => cy.elements().toggleClass('far', next));
  }

  function zoomAround(factor, posX, posY) {
    if (!cy || cy.destroyed() || !container || factor === 1) return;
    const currentZoom = cy.zoom();
    const nextZoom = Math.min(cy.maxZoom(), Math.max(cy.minZoom(), currentZoom * factor));
    if (nextZoom === currentZoom) return;
    const currentPan = cy.pan();
    setViewport(nextZoom, {
      x: posX - (nextZoom / currentZoom) * (posX - currentPan.x),
      y: posY - (nextZoom / currentZoom) * (posY - currentPan.y)
    });
  }

  function onWheel(event) {
    if (!cy || cy.destroyed() || !container) return;
    if (event.target instanceof Element && event.target.closest('.map-panel')) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const rect = container.getBoundingClientRect();
    if (wheelIntent(event) === 'zoom') {
      const factor = wheelZoomFactor({ deltaY: event.deltaY, deltaMode: event.deltaMode, ctrlKey: event.ctrlKey, pageHeight: rect.height });
      if (factor !== 1) zoomAround(factor, event.clientX - rect.left, event.clientY - rect.top);
      return;
    }
    const { dx, dy } = wheelPanDelta({
      deltaX: event.deltaX,
      deltaY: event.deltaY,
      deltaMode: event.deltaMode,
      shiftKey: event.shiftKey,
      pageHeight: rect.height
    });
    if (!dx && !dy) return;
    const pan = cy.pan();
    setViewport(cy.zoom(), { x: pan.x - dx, y: pan.y - dy });
  }

  const FOCUS_CLASSES = 'dim focus-root focus-chain path-lit incoming-lit outgoing-lit';

  function refreshEdgeVisibility() {
    if (!cy || cy.destroyed()) return;
    cy.edges().removeClass('edge-visible');
    if (linkMode === 'all') cy.edges('.semantic-edge, .interdependent').addClass('edge-visible');
    // Main pathways: the reduced backbone within each strand column. Links that
    // cross to another strand appear when a topic is selected.
    else if (linkMode === 'main') cy.edges('.backbone').filter((edge) => edge.source().data('strand') === edge.target().data('strand')).addClass('edge-visible');
    activeFocus?.edges.addClass('edge-visible');
  }

  function clearFocus({ keepSkill = false } = {}) {
    if (!cy || cy.destroyed()) return;
    cy.batch(() => cy.elements().removeClass(FOCUS_CLASSES));
    activeFocus = null;
    selectedNodeId = null;
    if (!keepSkill) selectedSkillId = null;
    inspector = null;
    tracePath = false;
    edgeTip = null;
    refreshEdgeVisibility();
    refreshVisibleLabels();
    syncUrl();
  }

  function componentFor(id) {
    if (!currentTopicGraph) return null;
    const index = currentTopicGraph.componentByNode.get(id);
    return index == null ? null : currentTopicGraph.components[index];
  }

  function directFocusFor(node) {
    const id = node.id();
    const componentIds = new Set(componentFor(id) || [id]);
    const incoming = cy.edges('.semantic-edge').filter(
      (edge) => edge.target().id() === id && !componentIds.has(edge.source().id())
    );
    const outgoing = cy.edges('.semantic-edge').filter(
      (edge) => edge.source().id() === id && !componentIds.has(edge.target().id())
    );
    const interdependent = componentIds.size > 1
      ? cy.edges('.interdependent').filter(
          (edge) => componentIds.has(edge.source().id()) && componentIds.has(edge.target().id())
        )
      : cy.collection();
    const edges = incoming.union(outgoing).union(interdependent);
    const nodes = edges.connectedNodes().union(node);
    return { nodes, edges, incoming, outgoing, rootId: id };
  }

  function chainFor(node) {
    const key = node.id();
    if (focusCache.has(key)) return focusCache.get(key);
    const hood = node.predecessors().union(node.successors()).union(node);
    const chain = {
      nodes: hood.nodes(),
      edges: hood.edges().filter('.semantic-edge, .interdependent'),
      incoming: cy.collection(),
      outgoing: cy.collection(),
      rootId: node.id()
    };
    focusCache.set(key, chain);
    return chain;
  }

  function applyFocus(next, rootNode, fullPath = false) {
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
      rootNode.addClass('focus-root');
    });
    refreshVisibleLabels();
  }

  function topicItem(id) {
    const node = cy.getElementById(id);
    if (!node.nonempty()) return null;
    return { id, title: node.data('name') ?? node.data('label') };
  }

  function buildTopicInspector(node) {
    const focus = directFocusFor(node);
    const sortByTitle = (a, b) => a.title.localeCompare(b.title);
    const stats = node.data('stats') || {};
    return {
      kind: 'topic',
      id: node.id(),
      title: node.data('name') ?? node.data('label'),
      strand: node.data('strand'),
      band: node.data('bandLabel'),
      ready: (stats.mastered ?? 0) + (stats.proficient ?? 0),
      total: stats.count ?? node.data('skillCount') ?? 0,
      incoming: focus.incoming.map((edge) => topicItem(edge.source().id())).filter(Boolean).sort(sortByTitle),
      outgoing: focus.outgoing.map((edge) => topicItem(edge.target().id())).filter(Boolean).sort(sortByTitle)
    };
  }

  function focusNode(node, sticky, fullPath = false) {
    if (!node?.nonempty()) return;
    applyFocus(fullPath ? chainFor(node) : directFocusFor(node), node, fullPath);
    if (sticky) {
      selectedNodeId = node.id();
      selectedSkillId = null;
      inspector = buildTopicInspector(node);
      edgeTip = null;
      syncUrl();
    }
  }

  // The topic a skill sits in on this map: its first topic that has a card.
  function mapTopicFor(skillIdValue) {
    return topicsForSkill(skillIdValue).find((id) => cy?.getElementById(id).nonempty()) ?? null;
  }

  function selectSkill(id) {
    const home = groupOfSkill(id);
    const skill = skillById.get(id);
    if (!home || !skill || !cy) return;
    const groupNode = cy.getElementById(home.id);
    const prereqs = (skill.prereqs || []).map((p) => skillById.get(p)).filter(Boolean);
    const dependents = (dependentsOf.get(id) || []).map((d) => skillById.get(d)).filter(Boolean);
    const topicOf = (s) => groupOfSkill(s.id)?.id ?? mapTopicFor(s.id);
    const openIds = new Set(groups.map((g) => g.id));
    const prereqTopics = new Set(prereqs.map(topicOf).filter((t) => t && t !== home.id));
    const dependentTopics = new Set(dependents.map(topicOf).filter((t) => t && t !== home.id));
    // Links to skills in other open topics are drawn skill to skill; links to
    // closed topics light the topic-level edge instead.
    const incoming = cy.edges('.semantic-edge').filter((edge) => edge.target().id() === home.id && prereqTopics.has(edge.source().id()) && !openIds.has(edge.source().id()));
    const outgoing = cy.edges('.semantic-edge').filter((edge) => edge.source().id() === home.id && dependentTopics.has(edge.target().id()) && !openIds.has(edge.target().id()));
    const linkedNodes = cy.nodes().filter((node) => prereqTopics.has(node.id()) || dependentTopics.has(node.id()));
    applyFocus({ nodes: linkedNodes.union(groupNode), edges: incoming.union(outgoing), incoming, outgoing, rootId: home.id }, groupNode);
    selectedNodeId = null;
    selectedSkillId = id;
    const item = (s) => ({ id: s.id, title: s.title, topic: topicById.get(topicOf(s) ?? topicsForSkill(s.id)[0])?.title ?? '', inGroup: Boolean(groupOfSkill(s.id)), sameTopic: groupOfSkill(s.id)?.id === home.id });
    inspector = {
      kind: 'skill',
      id,
      title: skill.title,
      topic: home.title,
      stage: skill.stage,
      level: getMastery(id),
      incoming: prereqs.map(item),
      outgoing: dependents.map(item)
    };
    syncUrl();
  }

  function goToSkill(item) {
    if (item.inGroup) { selectSkill(item.id); return; }
    const topic = topicsForSkill(item.id).find((t) => cy?.getElementById(t).nonempty());
    if (topic) {
      pendingSkillId = item.id;
      pendingCentre = true;
      expandedTopicId = topic;
    } else {
      go(`/skill/${item.id}`);
    }
  }

  function toggleTracePath() {
    const node = selectedNodeId ? cy?.getElementById(selectedNodeId) : null;
    if (!node?.nonempty()) return;
    tracePath = !tracePath;
    focusNode(node, true, tracePath);
  }

  function setLinkMode(next) {
    linkMode = next;
    if (selectedSkillId) selectSkill(selectedSkillId);
    else if (selectedNodeId) focusNode(cy.getElementById(selectedNodeId), true, tracePath);
    else refreshEdgeVisibility();
  }

  function selectRelated(id) {
    const node = cy?.getElementById(id);
    if (!node?.nonempty()) return;
    tracePath = false;
    focusNode(node, true, false);
    cy.animate({ center: { eles: node }, duration: 280 });
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

  function expandTopic(id) {
    if (!id) return;
    pendingCentre = true;
    pendingSkillId = null;
    expandedTopicId = id;
  }

  function collapseGroup(id = expandedTopicId) {
    selectedSkillId = null;
    if (showAllSkills) {
      // Leaving "All skills" from one topic keeps that topic open.
      showAllSkills = false;
      expandedTopicId = null;
      pendingSelectTopic = id;
      return;
    }
    expandedTopicId = null;
    pendingSelectTopic = id;
  }

  function setShowAllSkills(next) {
    if (next === showAllSkills) return;
    selectedSkillId = null;
    showAllSkills = next;
  }

  function bindGraphEvents() {
    cy.on('mouseover', 'node', (event) => {
      if (touchMode || event.target.hasClass('expanded')) return;
      if (!selectedNodeId && !selectedSkillId) focusNode(event.target, false, false);
    });
    cy.on('mouseout', 'node', () => {
      if (touchMode) return;
      if (!selectedNodeId && !selectedSkillId) clearFocus();
    });
    cy.on('tap', 'node', (event) => {
      if (event.target.hasClass('expanded')) return;
      tracePath = false;
      focusNode(event.target, true, false);
    });
    cy.on('tap', (event) => { if (event.target === cy) clearFocus(); });
    cy.on('mouseover', 'edge.edge-visible', (event) => { if (!touchMode) showEdgeTip(event.target); });
    cy.on('mouseout', 'edge.edge-visible', () => { if (!touchMode) edgeTip = null; });
    cy.on('tap', 'edge.edge-visible', (event) => showEdgeTip(event.target));
    cy.on('dbltap', 'node', (event) => { if (!touchMode && !event.target.hasClass('expanded')) expandTopic(event.target.id()); });
    cy.on('viewport', onViewport);
  }

  function syncZoomBounds() {
    if (!cy || cy.destroyed() || !container) return;
    const { minZoom, maxZoom } = computeZoomBounds(graphBounds, container.clientWidth, container.clientHeight);
    cy.zoomRange({ min: minZoom, max: maxZoom });
    const current = cy.zoom();
    if (current < minZoom) cy.zoom(minZoom);
    else if (current > maxZoom) cy.zoom(maxZoom);
  }

  function startView() {
    const view = initialViewport(graphBounds, container.clientWidth, container.clientHeight, {
      readableZoom: narrow ? 0.8 : 0.9
    });
    if (!view) return;
    // Leave room for the open Filters panel on wide screens.
    const offset = !narrow && filtersOpen ? 280 : 0;
    setViewport(view.zoom, { x: view.pan.x + offset, y: view.pan.y + (narrow ? 44 : 52) });
  }

  function centreOnGroup() {
    const node = expandedTopicId ? cy.getElementById(expandedTopicId) : null;
    if (!node?.nonempty() || !container) return;
    const zoom = Math.max(cy.zoom(), narrow ? 0.8 : 0.9);
    const position = node.position();
    const top = position.y - node.height() / 2;
    const offset = !narrow && filtersOpen ? 140 : 0;
    setViewport(zoom, {
      x: container.clientWidth / 2 + offset - position.x * zoom,
      y: (narrow ? 70 : 90) - top * zoom
    });
  }

  function rebuildGraph(key, isDark) {
    if (!cy || cy.destroyed()) return;
    const keepView = !firstBuild ? { zoom: cy.zoom(), pan: { ...cy.pan() } } : null;
    cy.batch(() => cy.elements().removeClass(FOCUS_CLASSES));
    activeFocus = null;
    selectedNodeId = null;
    inspector = null;
    edgeTip = null;
    focusCache = new Map();
    labels = [];
    labelRecords = [];
    farState = null;
    lastFarZoom = null;
    lastLabelCullAt = 0;

    const graphData = buildGraphData(isDark);
    currentTopicGraph = graphData.topicGraph;
    if (expandedTopicId && !graphData.elements.some((element) => element.data?.id === expandedTopicId)) {
      expandedTopicId = null;
    }
    const cached = getCachedGeometry(key);
    let routes = {};
    cy.batch(() => {
      cy.elements().remove();
      cy.add(graphData.elements);
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

    if (!cached) setCachedGeometry(key, { ...captureGeometry(), routes, bands });
    currentGeometryKey = key;
    graphBounds = boundsFromBands(bands);
    syncZoomBounds();
    refreshEdgeVisibility();
    rebuildLabelRecords();
    rebuildGroups();

    if (pendingCentre && expandedTopicId) centreOnGroup();
    else if (keepView) setViewport(keepView.zoom, keepView.pan);
    else startView();
    pendingCentre = false;
    firstBuild = false;

    updateLabelWorld();
    syncFar();
    scheduleBandDraw();
    refreshVisibleLabels();
    drawMinimap();

    if (pendingSkillId) {
      const id = pendingSkillId;
      pendingSkillId = null;
      if (groupOfSkill(id)) selectSkill(id);
    } else if (pendingSelectTopic) {
      const node = cy.getElementById(pendingSelectTopic);
      pendingSelectTopic = null;
      if (node.nonempty()) {
        focusNode(node, true, false);
        // Centre it in the part of the canvas the inspector leaves visible.
        const zoom = cy.zoom();
        const position = node.position();
        const offset = !narrow && filtersOpen ? 140 : 0;
        setViewport(zoom, {
          x: container.clientWidth / 2 + offset - position.x * zoom,
          y: container.clientHeight * (narrow ? 0.25 : 0.38) - position.y * zoom
        });
      }
    }
    syncUrl();
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
    drawMinimap();
  }

  function zoomBy(factor) {
    if (!cy || cy.destroyed() || !container) return;
    zoomAround(factor, container.clientWidth / 2, container.clientHeight / 2);
  }

  function fitAll() {
    if (!cy || cy.destroyed() || !graphBounds || !container) return;
    const bw = graphBounds.x2 - graphBounds.x1;
    const bh = graphBounds.y2 - graphBounds.y1;
    const offset = !narrow && filtersOpen ? 280 : 0;
    const rightPanel = !narrow && inspector ? 340 : 0;
    const width = container.clientWidth - offset - rightPanel;
    const zoom = Math.max(cy.minZoom(), Math.min(1, (width - 60) / bw, (container.clientHeight - 100) / bh));
    setViewport(zoom, {
      x: offset + (width - bw * zoom) / 2 - graphBounds.x1 * zoom,
      y: (container.clientHeight - bh * zoom) / 2 - graphBounds.y1 * zoom
    });
  }

  function jumpToCourse(title) {
    const row = bands?.rows?.find((candidate) => candidate.label === title);
    if (!row || !cy) return;
    const zoom = cy.zoom();
    const pan = { x: cy.pan().x, y: 70 - row.yTop * zoom };
    const clamped = graphBounds ? clampPanToBounds(pan, zoom, graphBounds, container.clientWidth, container.clientHeight) : pan;
    cy.animate({ pan: clamped }, { duration: 320 });
  }

  // Minimap: the whole map in miniature with the current view framed; click or
  // drag to move the view.
  const MINI_W = 196;
  const MINI_H = 124;
  function minimapTransform() {
    if (!graphBounds) return null;
    const bw = graphBounds.x2 - graphBounds.x1;
    const bh = graphBounds.y2 - graphBounds.y1;
    const scale = Math.min((MINI_W - 12) / bw, (MINI_H - 12) / bh);
    return {
      scale,
      ox: (MINI_W - bw * scale) / 2 - graphBounds.x1 * scale,
      oy: (MINI_H - bh * scale) / 2 - graphBounds.y1 * scale
    };
  }

  function drawMinimap() {
    if (!minimapCanvas || !cy || cy.destroyed()) return;
    const t = minimapTransform();
    const ctx = minimapCanvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (minimapCanvas.width !== MINI_W * dpr) {
      minimapCanvas.width = MINI_W * dpr;
      minimapCanvas.height = MINI_H * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, MINI_W, MINI_H);
    if (!t) return;
    const isDark = currentDark;
    const rows = bands?.rows || [];
    const yTop = rows.length ? rows[0].yTop : 0;
    const yBottom = rows.length ? rows[rows.length - 1].yBottom : 0;
    for (const lane of bands?.lanes || []) {
      ctx.fillStyle = strandPanelStyle(lane.strand, isDark).fill;
      ctx.fillRect(lane.xLeft * t.scale + t.ox, yTop * t.scale + t.oy, (lane.xRight - lane.xLeft) * t.scale, (yBottom - yTop) * t.scale);
    }
    cy.nodes().forEach((node) => {
      const box = node.boundingBox({ includeLabels: false, includeOverlays: false });
      const strand = node.data('strand');
      ctx.globalAlpha = node.hasClass('dim') ? 0.35 : 0.85;
      ctx.fillStyle = strandPanelStyle(strand, isDark).text;
      ctx.fillRect(box.x1 * t.scale + t.ox, box.y1 * t.scale + t.oy, Math.max(2, box.w * t.scale), Math.max(1.5, box.h * t.scale));
    });
    ctx.globalAlpha = 1;
    const extent = cy.extent();
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(extent.x1 * t.scale + t.ox, extent.y1 * t.scale + t.oy, extent.w * t.scale, extent.h * t.scale);
  }

  let minimapDragging = false;
  function minimapMove(event) {
    const t = minimapTransform();
    if (!t || !cy || !container) return;
    const rect = minimapCanvas.getBoundingClientRect();
    const wx = (event.clientX - rect.left - t.ox) / t.scale;
    const wy = (event.clientY - rect.top - t.oy) / t.scale;
    const zoom = cy.zoom();
    setViewport(zoom, { x: container.clientWidth / 2 - wx * zoom, y: container.clientHeight / 2 - wy * zoom });
  }
  function minimapDown(event) {
    minimapDragging = true;
    minimapCanvas.setPointerCapture?.(event.pointerId);
    minimapMove(event);
  }
  function minimapUp(event) {
    minimapDragging = false;
    minimapCanvas.releasePointerCapture?.(event.pointerId);
  }

  // Keep the address bar shareable: courses, the opened topic and the selected
  // skill. replaceState does not fire popstate, so the map is not remounted.
  function syncUrl() {
    if (typeof history === 'undefined') return;
    const params = new URLSearchParams();
    if (selected.length) params.set('course', selected.join(','));
    if (expandedTopicId) params.set('topic', expandedTopicId);
    if (selectedSkillId) params.set('skill', selectedSkillId);
    else if (selectedNodeId) params.set('focus', selectedNodeId);
    const next = `/map${params.size ? `?${params.toString().replaceAll('%2C', ',')}` : ''}`;
    if (`${location.pathname}${location.search}` !== next) history.replaceState(history.state, '', next);
  }

  function labelEnter(id) {
    if (touchMode || !cy) return;
    const node = cy.getElementById(id);
    if (node.nonempty() && !selectedNodeId && !selectedSkillId) focusNode(node, false, false);
  }

  function labelLeave() {
    if (touchMode) return;
    if (!selectedNodeId && !selectedSkillId) clearFocus();
  }

  function labelClick(id) {
    const node = cy?.getElementById(id);
    if (node?.nonempty()) {
      tracePath = false;
      focusNode(node, true, false);
    }
  }

  // Skill links for the selected skill, in map coordinates.
  //  - Inside one open topic: prerequisites as brackets on the left, skills it
  //    leads to as brackets on the right.
  //  - Between open topics: right-angle routes that leave the source row on the
  //    right, run down the gap beside its column, along the gutter above the
  //    target's row and down the gap beside the target, so they never cross a
  //    card or a skill list.
  const ROW_INSET = 26; // matches .group-rows side padding
  let skillLinks = $derived.by(() => {
    if (!selectedSkillId || !groups.length) return [];
    const where = new Map();
    for (const g of groups) g.rows.forEach((row, i) => { if (!where.has(row.id)) where.set(row.id, { g, i }); });
    const home = groupOfSkill(selectedSkillId);
    if (!home) return [];
    const self = { g: home, i: home.rows.findIndex((row) => row.id === selectedSkillId) };
    const skill = skillById.get(selectedSkillId);
    const yOf = ({ g, i }) => g.y + GROUP_HEAD_H + i * GROUP_ROW_H + GROUP_ROW_H / 2;
    const out = [];
    let left = 0;
    let right = 0;
    let cross = 0;
    const route = (from, to, kind) => {
      if (from.g === to.g) {
        if (kind === 'before') {
          const x = from.g.x + 16 - (left++ % 3) * 4;
          out.push({ kind, d: `M ${from.g.x + ROW_INSET + 2} ${yOf(from)} H ${x} V ${yOf(to)} H ${to.g.x + ROW_INSET}` });
        } else {
          const x = from.g.x + from.g.w - 16 + (right++ % 3) * 4;
          out.push({ kind, d: `M ${from.g.x + from.g.w - ROW_INSET - 2} ${yOf(from)} H ${x} V ${yOf(to)} H ${to.g.x + to.g.w - ROW_INSET}` });
        }
        return;
      }
      const k = cross++ % 5;
      const ya = yOf(from);
      const yb = yOf(to);
      const gx1 = from.g.x + from.g.w + 6 + k * 2;
      const gx2 = to.g.x - 6 - k * 2;
      const gutter = (to.g.y > from.g.y + 1 ? to.g.gAbove : from.g.gAbove) + (k - 2) * 4;
      out.push({ kind, d: `M ${from.g.x + from.g.w - ROW_INSET + 4} ${ya} H ${gx1} V ${gutter} H ${gx2} V ${yb} H ${to.g.x + 8}` });
    };
    for (const p of skill?.prereqs || []) if (where.has(p)) route(where.get(p), self, 'before');
    for (const d of dependentsOf.get(selectedSkillId) || []) if (where.has(d)) route(self, where.get(d), 'after');
    return out;
  });
  let focusedGroupIds = $derived(activeFocus ? new Set(activeFocus.nodes.map((node) => node.id())) : null);
  let linkedRows = $derived.by(() => {
    if (!selectedSkillId) return new Set();
    const skill = skillById.get(selectedSkillId);
    return new Set([...(skill?.prereqs || []), ...(dependentsOf.get(selectedSkillId) || [])]);
  });

  onMount(() => {
    touchMode = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    narrow = window.matchMedia('(max-width: 760px)').matches;
    if (narrow) { filtersOpen = false; legendOpen = false; }
    currentDark = theme.current === 'dark';
    // Wheel/trackpad input is handled statelessly in capture phase by onWheel on
    // graphArea so Cytoscape's stateful wheel-delta sampler cannot ratchet zoom
    // sensitivity up when tiny fractional deltas arrive, and wheel works over labels.
    cy = cytoscape({
      container,
      elements: [],
      style: getCyStyle(currentDark),
      minZoom: 0.1,
      maxZoom: 3,
      pixelRatio: 1,
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
    graphArea.addEventListener('wheel', onWheel, { capture: true, passive: false });
    bindGraphEvents();
    rebuildGraph(graphKey(), currentDark);

    resizeObserver = new ResizeObserver(() => {
      cy?.resize();
      syncZoomBounds();
      enforceViewportBounds();
      scheduleViewportPaint();
      scheduleBandDraw();
      scheduleLabelCull();
    });
    resizeObserver.observe(container);

    const onKeydown = (event) => {
      if (event.key !== 'Escape') return;
      if (selectedNodeId || selectedSkillId) clearFocus();
      else if (showAllSkills) setShowAllSkills(false);
      else if (expandedTopicId) collapseGroup();
      else if (narrow && filtersOpen) filtersOpen = false;
    };
    window.addEventListener('keydown', onKeydown);

    return () => {
      window.removeEventListener('keydown', onKeydown);
      graphArea?.removeEventListener('wheel', onWheel, { capture: true });
      resizeObserver?.disconnect();
      if (viewportRaf) cancelAnimationFrame(viewportRaf);
      if (bandRaf) cancelAnimationFrame(bandRaf);
      clearTimeout(labelTimer);
      cy?.destroy();
    };
  });

  $effect(() => {
    selected; crossOnly; expandedTopicId; hiddenStrands; showAllSkills;
    const key = graphKey();
    if (cy && key !== currentGeometryKey) untrack(() => rebuildGraph(key, theme.current === 'dark'));
  });

  $effect(() => {
    const isDark = theme.current === 'dark';
    if (cy && isDark !== currentDark) applyTheme(isDark);
  });

  $effect(() => {
    minimapCanvas;
    if (minimapCanvas) drawMinimap();
  });

  let presentStrands = $derived(STRANDS.filter((strand) => bands.lanes?.some((lane) => lane.strand === strand) || hiddenStrands.includes(strand)));
</script>

<div class="map-wrap">
  <div bind:this={graphArea} class="graph-area" class:inspector-open={Boolean(inspector)}>
    <canvas bind:this={bandCanvas} class="bands"></canvas>
    <div bind:this={container} class="graph"></div>

    <div class="label-layer">
      <div bind:this={labelWorld} class="label-world">
        {#each labels as label (label.id)}
          <div
            role="button"
            tabindex="0"
            class="card-label"
            class:focused={label.focused}
            class:focus-root={label.root}
            class:dimmed={label.dimmed}
            style="left:{label.x}px; top:{label.y}px; width:{label.w}px; height:{label.h}px; --pad-x:{CARD_PAD_X}px; --pad-y:{CARD_PAD_Y}px; --foot-h:{CARD_FOOT_H}px;"
            onmouseenter={() => labelEnter(label.id)}
            onmouseleave={labelLeave}
            onclick={() => labelClick(label.id)}
            onkeydown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); labelClick(label.id); } }}
            ondblclick={() => { if (!touchMode) expandTopic(label.id); }}
          >
            <span class="card-title">{@html label.html}</span>
            <button
              type="button"
              class="card-skills"
              aria-label="Show the {label.skillCount} skills in this topic"
              onclick={(event) => { event.stopPropagation(); expandTopic(label.id); }}
              ondblclick={(event) => event.stopPropagation()}
            >
              <span>{label.skillCount} {label.skillCount === 1 ? 'skill' : 'skills'}</span>
              <span class="show">Show <svg viewBox="0 0 12 12" aria-hidden="true"><path d="m3 4.5 3 3 3-3" /></svg></span>
            </button>
            {#if showReady && label.ready}<span class="ready-tag">Ready now</span>{/if}
          </div>
        {/each}

        {#each groups as group (group.id)}
          <section
            class="group"
            class:dimmed={Boolean(focusedGroupIds) && !focusedGroupIds.has(group.id)}
            style="left:{group.x}px; top:{group.y}px; width:{group.w}px; height:{group.h}px;"
            aria-label="Skills in {group.title}"
          >
            <header class="group-head" style="height:{GROUP_HEAD_H}px">
              <span class="group-title"><MathText text={group.title} /></span>
              <span class="group-count" title="{group.ready} of {group.total} skills proficient or better">{group.ready}/{group.total}</span>
              {#if !showAllSkills}
                <button class="group-close" type="button" onclick={() => collapseGroup(group.id)} aria-label="Hide the skills in {group.title}">Hide skills <svg viewBox="0 0 12 12" aria-hidden="true"><path d="m3 7.5 3-3 3 3" /></svg></button>
              {/if}
            </header>
            <ol class="group-rows">
              {#each group.rows as row (row.id)}
                <li style="height:{GROUP_ROW_H}px">
                  <button
                    type="button"
                    class:selected={row.id === selectedSkillId}
                    class:linked={linkedRows.has(row.id)}
                    class:quiet={Boolean(selectedSkillId) && row.id !== selectedSkillId && !linkedRows.has(row.id)}
                    title={row.title}
                    onclick={() => selectSkill(row.id)}
                    ondblclick={() => go(`/skill/${row.id}?course=${selected[0] ?? ''}`)}
                  >
                    <MasteryRing level={row.level} size={14} />
                    <span class="row-title"><MathText text={row.title} /></span>
                  </button>
                </li>
              {/each}
            </ol>
          </section>
        {/each}

        {#if skillLinks.length}
          <svg class="skill-links" width="1" height="1" aria-hidden="true">
            <defs>
              <marker id="sl-before" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L6 3 L0 6 z" class="head-before" /></marker>
              <marker id="sl-after" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L6 3 L0 6 z" class="head-after" /></marker>
            </defs>
            {#each skillLinks as link}
              <path d={link.d} class="link-{link.kind}" marker-end="url(#sl-{link.kind})" />
            {/each}
          </svg>
        {/if}
      </div>
    </div>

    {#if edgeTip}
      <div class="edge-tip" style="left:{edgeTip.x}px; top:{edgeTip.y}px;">
        <span class="edge-tip-route">
          <MathText text={edgeTip.source} />
          <strong aria-hidden="true">{edgeTip.interdependent ? '↔' : '→'}</strong>
          <MathText text={edgeTip.target} />
        </span>
        <small>{edgeTip.interdependent ? 'Topics that depend on each other' : edgeTip.cross ? 'Prerequisite from another course' : 'Comes before'}</small>
      </div>
    {/if}

    <div class="view-switch map-panel" role="group" aria-label="Map detail">
      <button type="button" class:on={!showAllSkills} aria-pressed={!showAllSkills} onclick={() => setShowAllSkills(false)}>Topics</button>
      <button type="button" class:on={showAllSkills} aria-pressed={showAllSkills} onclick={() => setShowAllSkills(true)}>All skills</button>
    </div>

    {#if filtersOpen}
      {#if narrow}<button class="drawer-backdrop" aria-label="Close map filters" onclick={() => (filtersOpen = false)}></button>{/if}
      <aside class="filters map-panel" aria-label="Map filters">
        <div class="panel-head">
          <h2>Filters</h2>
          <button class="icon-button" type="button" aria-label="Hide filters" onclick={() => (filtersOpen = false)}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5 5.5 8l4.5 4.5" /></svg>
          </button>
        </div>

        <section>
          <h3>Courses</h3>
          <div class="course-list">
            {#each courses as course (course.id)}
              <div class="course-row">
                <label class="check">
                  <input type="checkbox" checked={selected.includes(course.id)} onchange={() => toggleCourse(course.id)} />
                  {course.title}
                </label>
                {#if selected.includes(course.id)}
                  <button type="button" class="jump" title="Jump to {course.title}" aria-label="Jump to {course.title}" onclick={() => jumpToCourse(course.title)}>
                    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v7M4.5 7 8 10.5 11.5 7M3.5 13h9" /></svg>
                  </button>
                {/if}
              </div>
            {/each}
          </div>
        </section>

        {#if presentStrands.length > 1}
          <section>
            <h3>Strands</h3>
            {#each presentStrands as strand}
              <label class="check">
                <input type="checkbox" checked={!hiddenStrands.includes(strand)} onchange={() => toggleStrand(strand)} />
                {strand}
              </label>
            {/each}
          </section>
        {/if}

        <section>
          <h3>Links</h3>
          <label class="check"><input type="radio" name="link-mode" checked={linkMode === 'selected'} onchange={() => setLinkMode('selected')} /> Selected topic only</label>
          <label class="check"><input type="radio" name="link-mode" checked={linkMode === 'main'} onchange={() => setLinkMode('main')} /> Main pathways in each strand</label>
          <label class="check"><input type="radio" name="link-mode" checked={linkMode === 'all'} onchange={() => setLinkMode('all')} /> All links</label>
          <label class="check"><input type="checkbox" checked={crossOnly} onchange={() => (crossOnly = !crossOnly)} /> Only links between courses</label>
        </section>

        <section>
          <label class="check"><input type="checkbox" checked={showReady} onchange={() => (showReady = !showReady)} /> Mark topics I am ready for</label>
        </section>
        <p class="hint">{touchMode ? 'Tap a topic, then Show skills.' : 'Click a topic to see its links. Double-click to list its skills.'}</p>
      </aside>
    {:else}
      <button class="filters-button map-panel" type="button" aria-expanded="false" onclick={() => (filtersOpen = true)}>
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 4h11M4.5 8h7M6.5 12h3" /></svg>
        Filters
      </button>
    {/if}

    {#if legendOpen}
      <aside class="legend map-panel" class:beside={filtersOpen && !narrow} aria-label="Map key">
        <div class="panel-head">
          <h2>Key</h2>
          <button class="icon-button" type="button" aria-label="Hide key" onclick={() => (legendOpen = false)}>×</button>
        </div>
        <ul class="key-rings">
          {#each ['none', 'learning', 'proficient', 'mastered'] as level}
            <li><MasteryRing {level} size={15} />{MASTERY[level].label}</li>
          {/each}
        </ul>
        <ul class="key-lines">
          <li><span class="ready-sample">Ready now</span> what it needs is mastered</li>
          <li><span class="line-sample before"></span> comes before</li>
          <li><span class="line-sample after"></span> leads to</li>
        </ul>
      </aside>
    {:else if !narrow}
      <button class="key-button map-panel" class:beside={filtersOpen} type="button" onclick={() => (legendOpen = true)}>Key</button>
    {/if}

    {#if inspector}
      <aside class="node-inspector map-panel" aria-label="Selected {inspector.kind}">
        <button class="inspector-close icon-button" type="button" aria-label="Close selection" onclick={() => clearFocus()}>×</button>
        <div class="inspector-main">
          {#if inspector.kind === 'topic'}
            <p class="eyebrow"><span>{inspector.strand}</span>{#if inspector.band} · {inspector.band}{/if}</p>
            <h2><MathText text={inspector.title} /></h2>
            <p class="meta">{inspector.ready} of {inspector.total} skills proficient or better</p>
            <div class="inspector-actions">
              {#if expandedTopicId !== inspector.id}
                <button class="mm-btn primary" type="button" onclick={() => expandTopic(inspector.id)}>Show skills</button>
              {/if}
              <a class="mm-btn" href={href(`/topic/${inspector.id}${selected.length === 1 ? `?course=${selected[0]}` : ''}`)}>Open topic</a>
            </div>
            <button class="text-button" type="button" onclick={toggleTracePath}>{tracePath ? 'Show direct links only' : 'Trace the full pathway'}</button>
          {:else}
            <p class="eyebrow"><MathText text={inspector.topic} /> · Stage {inspector.stage}</p>
            <h2><MathText text={inspector.title} /></h2>
            <p class="meta level-{inspector.level}"><MasteryRing level={inspector.level} size={14} /> {MASTERY[inspector.level].label}</p>
            <div class="inspector-actions">
              <a class="mm-btn primary" href={href(`/skill/${inspector.id}${selected.length === 1 ? `?course=${selected[0]}` : ''}`)}>Open skill</a>
              <a class="mm-btn" href={href(`/quiz?skill=${inspector.id}`)}>Take quiz</a>
            </div>
          {/if}
        </div>
        <div class="inspector-links">
          <section>
            <h3 class="before">Comes before</h3>
            {#if inspector.incoming.length}
              <ul>
                {#each inspector.incoming as item}
                  <li><button type="button" onclick={() => (inspector.kind === 'topic' ? selectRelated(item.id) : goToSkill(item))}><MathText text={item.title} />{#if item.topic && !item.sameTopic}<small><MathText text={item.topic} /></small>{/if}</button></li>
                {/each}
              </ul>
            {:else}<p class="empty-note">Nothing earlier on this map.</p>{/if}
          </section>
          <section>
            <h3 class="after">Leads to</h3>
            {#if inspector.outgoing.length}
              <ul>
                {#each inspector.outgoing as item}
                  <li><button type="button" onclick={() => (inspector.kind === 'topic' ? selectRelated(item.id) : goToSkill(item))}><MathText text={item.title} />{#if item.topic && !item.sameTopic}<small><MathText text={item.topic} /></small>{/if}</button></li>
                {/each}
              </ul>
            {:else}<p class="empty-note">Nothing later on this map.</p>{/if}
          </section>
        </div>
      </aside>
      <div class="sr-only" aria-live="polite">{inspector.title} selected. {inspector.incoming.length} come before and {inspector.outgoing.length} lead on.</div>
    {/if}

    <div class="corner">
      {#if !narrow && graphBounds}
        <canvas
          bind:this={minimapCanvas}
          class="minimap map-panel"
          width={MINI_W}
          height={MINI_H}
          style="width:{MINI_W}px; height:{MINI_H}px"
          aria-label="Minimap: click or drag to move the view"
          onpointerdown={minimapDown}
          onpointermove={(event) => { if (minimapDragging) minimapMove(event); }}
          onpointerup={minimapUp}
        ></canvas>
      {/if}
      <div class="zoom-controls map-panel" aria-label="Map zoom controls">
        <button type="button" aria-label="Zoom in" title="Zoom in" onclick={() => zoomBy(ZOOM_STEP)}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg>
        </button>
        <button type="button" aria-label="Zoom out" title="Zoom out" onclick={() => zoomBy(1 / ZOOM_STEP)}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10" /></svg>
        </button>
        <button type="button" aria-label="Fit whole map" title="Fit whole map" onclick={fitAll}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10" /></svg>
        </button>
      </div>
    </div>

    {#if selected.length === 0}
      <div class="empty"><strong>Choose a course to begin</strong><small>Add a course in Filters and its topics appear here.</small></div>
    {/if}
  </div>
</div>

<style>
  .map-wrap {
    --map-ready-bg: #ecfeff;
    --map-ready-text: #0e7490;
    --map-ready-border: #a5f3fc;
    position: relative;
    display: flex;
    height: calc(100dvh - var(--top-nav-height, 60px) - var(--bottom-nav-height, 0px));
    overflow: hidden;
    background: var(--app-canvas);
    font-family: var(--font-body);
  }
  :global([data-theme="dark"]) .map-wrap {
    --map-ready-bg: rgba(34, 211, 238, 0.12);
    --map-ready-text: #67e8f9;
    --map-ready-border: rgba(103, 232, 249, 0.35);
  }

  .graph-area { position: relative; flex: 1 1 auto; min-width: 0; overflow: clip; contain: layout paint style; background: var(--app-canvas); }
  .bands, .graph, .label-layer { position: absolute; inset: 0; }
  .bands { width: 100%; height: 100%; z-index: 0; }
  .graph { z-index: 1; background: transparent; touch-action: none; }
  /* clip, not hidden: a hidden box can still be scrolled when a focused label
     is brought into view, which would shift every label off its card. */
  .label-layer { z-index: 2; overflow: clip; pointer-events: none; contain: strict; }
  .label-world { position: absolute; inset: 0; transform-origin: 0 0; will-change: transform; }

  .card-skills {
    position: absolute;
    left: calc(var(--pad-x) - 4px);
    right: calc(var(--pad-x) - 4px);
    bottom: 6px;
    height: calc(var(--foot-h) - 2px);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 4px;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--muted);
    font: 700 12px var(--font-body);
    cursor: pointer;
  }
  .card-skills .show { display: inline-flex; align-items: center; gap: 2px; opacity: 0; transition: opacity var(--motion-fast); }
  .card-skills svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
  .card-label:hover .card-skills .show, .card-label.focus-root .card-skills .show, .card-skills:focus-visible .show { opacity: 1; }
  .card-skills:hover { background: var(--panel-2); color: var(--accent); }
  .card-label {
    position: absolute;
    display: block;
    margin: 0;
    padding: var(--pad-y) calc(var(--pad-x) + 26px) calc(var(--pad-y) + var(--foot-h)) var(--pad-x);
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: var(--text);
    font: 700 14px/18px var(--font-body);
    text-align: left;
    opacity: var(--label-fade, 1);
    pointer-events: auto;
    cursor: pointer;
    user-select: none;
    appearance: none;
  }
  .card-title { display: block; overflow: hidden; overflow-wrap: anywhere; }
  .card-label :global(.katex) { font-size: 1em; }
  .card-label.dimmed { opacity: calc(0.5 * var(--label-fade, 1)); }
  .card-label.focused, .card-label.focus-root { opacity: 1; }
  .card-label:hover .card-title { color: var(--accent); }
  .ready-tag {
    position: absolute;
    top: -9px;
    right: 8px;
    padding: 1px 7px;
    border: 1px solid var(--map-ready-border);
    border-radius: var(--radius-sm);
    background: var(--map-ready-bg);
    color: var(--map-ready-text);
    font: 800 12px/14px var(--font-body);
    white-space: nowrap;
  }

  .group { position: absolute; pointer-events: auto; color: var(--text); }
  .group.dimmed { opacity: 0.5; }
  .group-head { display: flex; align-items: center; gap: 0.6rem; padding: 0 12px 0 14px; border-bottom: 1px solid var(--border); }
  .group-title { flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 800 15px var(--font-body); }
  .group-count { flex: none; color: var(--muted); font: 600 12px var(--font-body); }
  .group-close svg { width: 11px; height: 11px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; vertical-align: -1px; }
  .group-close { margin-left: auto; flex: none; padding: 3px 9px; border: 1px solid var(--border-strong); border-radius: 6px; background: var(--panel); color: var(--text); font: 700 12px var(--font-body); cursor: pointer; }
  .group-close:hover { border-color: var(--text); }
  .skill-links { position: absolute; left: 0; top: 0; overflow: visible; pointer-events: none; z-index: 1; }
  .skill-links path { fill: none; stroke-width: 1.5; }
  .skill-links .link-before { stroke: var(--muted); }
  .skill-links .link-after { stroke: var(--accent); }
  .skill-links .head-before { fill: var(--muted); stroke: none; }
  .skill-links .head-after { fill: var(--accent); stroke: none; }
  .group-rows { margin: 0; padding: 0 26px; list-style: none; }
  .group-rows li { display: flex; align-items: center; }
  .group-rows button {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 0;
    height: 22px;
    padding: 0 6px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--text);
    font: 600 12.5px var(--font-body);
    text-align: left;
    cursor: pointer;
  }
  .group-rows button:hover { background: var(--surface-soft); }
  .group-rows button.selected { background: color-mix(in srgb, var(--accent) 12%, var(--panel)); box-shadow: inset 0 0 0 1px var(--accent); font-weight: 800; }
  .group-rows button.linked { background: var(--surface-soft); font-weight: 700; }
  .group-rows button.quiet { color: var(--muted); }
  .row-title { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .map-panel {
    border: 1px solid var(--border);
    border-radius: 14px;
    background: color-mix(in srgb, var(--panel) 97%, transparent);
    box-shadow: 0 6px 20px -12px rgba(15, 23, 42, 0.3), 0 1px 2px rgba(15, 23, 42, 0.06);
  }
  .icon-button { display: grid; place-items: center; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 6px; background: transparent; color: var(--muted); font-size: 1.1rem; line-height: 1; cursor: pointer; }
  .icon-button:hover { color: var(--text); background: var(--panel-2); }
  .icon-button svg, .filters-button svg, .zoom-controls svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  .panel-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
  .panel-head h2 { margin: 0; font: 800 0.95rem var(--font-body); letter-spacing: 0; }

  .filters { position: absolute; z-index: 6; top: 14px; left: 14px; width: 252px; max-height: calc(100% - 28px); overflow-y: auto; padding: 0.8rem 0.9rem 0.9rem; }
  .filters section { padding: 0.75rem 0 0.2rem; border-top: 1px solid var(--border); margin-top: 0.6rem; }
  .filters h3 { margin: 0 0 0.45rem; color: var(--muted); font: 800 0.75rem var(--font-body); letter-spacing: 0.07em; text-transform: uppercase; }
  .course-list { display: flex; flex-direction: column; }
  .course-row { display: flex; align-items: center; justify-content: space-between; gap: 0.4rem; }
  .course-row .check { min-height: 28px; flex: 1; }
  .jump { display: grid; place-items: center; width: 26px; height: 26px; padding: 0; border: 0; border-radius: 6px; background: none; color: var(--muted); cursor: pointer; }
  .jump:hover { color: var(--accent); background: var(--panel-2); }
  .jump svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
  .add-course { margin-top: 0.5rem; width: 100%; min-height: 32px; padding: 0.2rem 0.4rem; border: 1px dashed var(--border-strong); border-radius: 10px; background: var(--panel); color: var(--text); font: 700 0.8rem var(--font-body); cursor: pointer; }
  .check { display: flex; align-items: center; gap: 0.5rem; min-height: 30px; font-size: 0.86rem; cursor: pointer; }
  .check input { accent-color: var(--accent); cursor: pointer; margin: 0; }
  .hint { margin: 0.7rem 0 0; color: var(--muted); font-size: 0.76rem; line-height: 1.45; }
  .filters-button, .key-button { position: absolute; z-index: 6; display: inline-flex; align-items: center; gap: 0.4rem; min-height: 38px; padding: 0 0.85rem; color: var(--text); cursor: pointer; font: 800 0.85rem var(--font-body); }
  .filters-button { top: 14px; left: 14px; }
  .key-button { bottom: 14px; left: 14px; }

  .legend { position: absolute; z-index: 5; bottom: 14px; left: 14px; width: 252px; padding: 0.7rem 0.9rem 0.8rem; }
  /* With Filters open the key sits beside it rather than underneath. */
  .legend.beside, .key-button.beside { left: 280px; }
  .key-rings { display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem 0.6rem; margin: 0.55rem 0 0; padding: 0; list-style: none; font-size: 0.8rem; }
  .key-rings li, .key-lines li { display: flex; align-items: center; gap: 0.45rem; }
  .key-lines { display: flex; flex-direction: column; gap: 0.35rem; margin: 0.6rem 0 0; padding: 0.6rem 0 0; border-top: 1px solid var(--border); list-style: none; font-size: 0.8rem; color: var(--muted); }
  .ready-sample { padding: 0 6px; border: 1px solid var(--map-ready-border); border-radius: var(--radius-sm); background: var(--map-ready-bg); color: var(--map-ready-text); font: 800 12px/16px var(--font-body); }
  .line-sample { position: relative; width: 26px; height: 0; border-top: 1.5px solid var(--muted); }
  .line-sample::after { content: ''; position: absolute; top: -4px; right: -1px; border-block: 3.5px solid transparent; border-left: 5px solid var(--muted); }
  .line-sample.after { border-color: var(--accent); }
  .line-sample.after::after { border-left-color: var(--accent); }

  /* Topics / All skills switch, top centre. */
  .view-switch { position: absolute; z-index: 4; top: 14px; left: 50%; transform: translateX(-50%); display: flex; gap: 2px; padding: 4px; border-radius: 14px; }
  .view-switch button { min-height: 34px; padding: 0.3rem 1rem; border: 0; border-radius: 10px; background: none; color: var(--muted); white-space: nowrap; cursor: pointer; font: 800 0.88rem var(--font-body); }
  .view-switch button:hover { color: var(--text); }
  .view-switch button.on { background: var(--primary); color: #fff; }

  .corner { position: absolute; z-index: 5; right: 14px; bottom: 14px; display: flex; align-items: flex-end; gap: 8px; }
  .minimap { display: block; cursor: pointer; touch-action: none; }
  .zoom-controls { display: flex; flex-direction: column; gap: 2px; padding: 3px; }
  .zoom-controls button { display: grid; place-items: center; width: 34px; height: 34px; padding: 0; border: 0; border-radius: 10px; background: none; color: var(--text); cursor: pointer; }
  .zoom-controls button:hover { background: var(--panel-2); }

  /* Floating right sidebar for the selected topic or skill. */
  .node-inspector { position: absolute; z-index: 7; top: 14px; right: 14px; bottom: 14px; width: 320px; display: flex; flex-direction: column; padding: 1rem 1.1rem; overflow-y: auto; }
  .graph-area.inspector-open .corner { right: 348px; }
  .inspector-main { min-width: 0; padding-right: 1.6rem; }
  .inspector-close { position: absolute; top: 8px; right: 8px; }
  .eyebrow { margin: 0 0 0.25rem; color: var(--muted); font-size: 0.78rem; font-weight: 700; }
  .node-inspector h2 { margin: 0; font: 800 1.3rem/1.2 var(--font-body); letter-spacing: -0.01em; text-wrap: balance; }
  .meta { display: flex; align-items: center; gap: 0.35rem; margin: 0.35rem 0 0; color: var(--muted); font-size: 0.85rem; }
  .inspector-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.85rem; }
  .inspector-actions .mm-btn { min-height: 36px; padding: 0.4rem 0.85rem; font-size: 0.85rem; }
  .text-button { margin-top: 0.6rem; padding: 0; border: 0; background: none; color: var(--muted); font: 700 0.8rem var(--font-body); cursor: pointer; }
  .text-button:hover { color: var(--accent); }
  .inspector-links { margin-top: 1rem; padding-top: 0.9rem; border-top: 1px solid var(--border); }
  .inspector-links section + section { margin-top: 1rem; }
  .inspector-links h3 { margin: 0 0 0.25rem; font: 800 0.78rem var(--font-body); letter-spacing: 0; }
  .inspector-links h3.before { color: var(--muted); }
  .inspector-links h3.after { color: var(--accent); }
  .inspector-links ul { margin: 0; padding: 0; list-style: none; }
  .inspector-links button { display: flex; flex-direction: column; align-items: flex-start; width: 100%; padding: 0.18rem 0; border: 0; background: none; color: var(--text); text-align: left; cursor: pointer; font: 600 0.84rem/1.3 var(--font-body); }
  .inspector-links button:hover { color: var(--accent); }
  .inspector-links small { color: var(--muted); font-size: 0.75rem; font-weight: 600; }
  .empty-note { margin: 0; color: var(--muted); font-size: 0.8rem; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

  .edge-tip { position: absolute; z-index: 6; transform: translate(-50%, calc(-100% - 12px)); width: max-content; max-width: 310px; padding: 0.5rem 0.7rem; border: 1px solid var(--border); border-radius: 10px; background: var(--panel); box-shadow: 0 6px 20px -12px rgba(15, 23, 42, 0.35); pointer-events: none; }
  .edge-tip-route { display: flex; align-items: center; gap: 0.4rem; color: var(--text); font-size: 0.8rem; font-weight: 700; }
  .edge-tip-route strong { color: var(--accent); }
  .edge-tip small { display: block; margin-top: 0.15rem; color: var(--muted); font-size: 0.75rem; }

  .empty { position: absolute; inset: 0; z-index: 3; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.2rem; margin: auto; width: max-content; height: max-content; padding: 1rem 1.3rem; border: 1px solid var(--border); border-radius: 14px; background: var(--panel); color: var(--muted); pointer-events: none; }
  .empty strong { color: var(--text); font-size: 1rem; }
  .empty small { font-size: 0.8rem; }
  .drawer-backdrop { display: none; }

  button:focus-visible, input:focus-visible, .card-label:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

  @media (max-width: 760px) {
    .view-switch { top: 12px; left: auto; right: 10px; transform: none; }
  }

  @media (max-width: 760px) {
    .filters { inset: 0 auto 0 0; top: 0; left: 0; width: min(300px, 86vw); max-height: none; height: 100%; border-radius: 0 14px 14px 0; z-index: 9; }
    .drawer-backdrop { display: block; position: absolute; inset: 0; z-index: 8; border: 0; background: rgba(3, 7, 18, 0.45); }
    .legend { display: none; }
    .corner { right: 10px; bottom: 10px; }
    .zoom-controls button { width: 40px; height: 40px; }
    .node-inspector { top: auto; left: 8px; right: 8px; bottom: 8px; width: auto; max-height: 52%; border-radius: 14px; }
    .inspector-links { display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin-top: 0.7rem; padding-top: 0.6rem; }
    .inspector-links section + section { margin-top: 0; }
    .graph-area.inspector-open .corner { display: none; }
    .card-label:hover .card-title { color: inherit; }
  }
</style>
