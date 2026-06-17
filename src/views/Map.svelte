<script>
  import { untrack } from 'svelte';
  import cytoscape from 'cytoscape';
  import dagre from 'cytoscape-dagre';
  import { buildElements, cyStyle } from '../lib/graph.js';
  import { courses } from '../lib/data.js';
  import { go, href } from '../lib/router.svelte.js';

  cytoscape.use(dagre);

  let { courseId = null } = $props();
  let container;
  let cy;

  // Default to a single course so the graph stays readable (Stage 3–6 is large).
  let selected = $state(untrack(() => courseId) || 's6-advanced');

  function render() {
    if (!container) return;
    cy?.destroy();
    cy = cytoscape({
      container,
      elements: buildElements({ courseId: selected }),
      style: cyStyle,
      layout: { name: 'dagre', rankDir: 'LR', nodeSep: 30, rankSep: 80 }
    });

    cy.on('tap', 'node', (e) => {
      const id = e.target.id();
      cy.elements().addClass('faded');
      const hood = e.target.predecessors().union(e.target.successors()).union(e.target);
      hood.removeClass('faded').addClass('highlight');
    });
    cy.on('tap', (e) => { if (e.target === cy) cy.elements().removeClass('faded highlight'); });
    cy.on('dbltap', 'node', (e) => go(`/skill/${e.target.id()}?course=${selected}`));
  }

  $effect(() => { selected; render(); return () => cy?.destroy(); });
</script>

<div class="container">
  <div class="row" style="justify-content:space-between">
    <h1>Skill Map</h1>
    <label>Course
      <select bind:value={selected} style="margin-left:0.4rem;background:var(--panel);color:var(--text);border:1px solid var(--border);border-radius:6px;padding:0.3rem">
        {#each courses as c}<option value={c.id}>{c.title}</option>{/each}
      </select>
    </label>
  </div>
  <p class="muted" style="margin-top:0">Prerequisites flow left → right. Click a node to trace its chain; double-click to open it. Border = course colour, fill = your mastery.</p>
</div>
<div bind:this={container} style="height:72vh;border-top:1px solid var(--border);background:#0b1220"></div>
