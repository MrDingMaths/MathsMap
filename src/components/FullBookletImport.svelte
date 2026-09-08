<script>
  import { onMount } from 'svelte';
  import TranscribedBookletPage from './TranscribedBookletPage.svelte';

  let { onprojectcreated = null } = $props();

  let runs = $state([]);
  let run = $state(null);
  let selectedPage = $state(1);
  let queue = $state('pages');
  let busy = $state('');
  let message = $state('');
  let error = $state('');
  let showTheorySolutions = $state(true);
  let solutionMode = $state('student');
  let editPreview = $state(false);
  let unsavedEdits = $state(0);
  let answerSpaces = $state({});
  let diagramColourModes = $state({});

  const effectiveTranscription = $derived(run?.previewTranscription ?? run?.transcription ?? null);
  const draftOnly = $derived(Boolean(run?.draftPreview));
  const currentPage = $derived(effectiveTranscription?.pages?.find((page) => page.pageNumber === selectedPage) ?? null);
  const flags = $derived(run?.review?.flags ?? []);
  async function request(url, options = {}) {
    const response = await fetch(url, { headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) }, ...options });
    const value = await response.json();
    if (!response.ok) throw new Error(value.error ?? `Request failed (${response.status})`);
    return value;
  }

  async function refreshRuns() {
    runs = await request('/__booklet/full-imports');
  }

  async function selectRun(id) {
    error = ''; message = ''; editPreview = false; unsavedEdits = 0; run = await request('/__booklet/full-imports/' + encodeURIComponent(id));
    selectedPage = run.selectedPages?.[0] ?? 1;
    answerSpaces = { ...(run.review?.layoutOverrides?.answerSpaces ?? {}) };
    diagramColourModes = { ...(run.review?.layoutOverrides?.diagramColourModes ?? {}) };
  }

  async function task(label, action) {
    busy = label; error = ''; message = '';
    try { const value = await action(); message = `${label} completed.`; return value; }
    catch (exception) { error = exception.message; return null; }
    finally { busy = ''; }
  }

  async function materializeProject() {
    if (!run) return;
    const project = await task('Creating editable booklet', () => request('/__booklet/projects/materialize', { method: 'POST', body: JSON.stringify({ runId: run.runId }) }));
    if (project) {
      message = `Created editable booklet ${project.title}.`;
      onprojectcreated?.(project);
    }
  }

  async function saveReview(mutator) {
    if (!run) return;
    const next = JSON.parse(JSON.stringify(run.review)); next.history ??= []; mutator(next); next.expectedRevision = run.revision;
    run = await request(`/__booklet/full-imports/${encodeURIComponent(run.runId)}/review`, { method: 'PUT', body: JSON.stringify(next) });
  }

  function setAnswerSpace(id, value) {
    answerSpaces = { ...answerSpaces, [id]: value };
  }

  async function saveLayoutOverrides() {
    await task('Saving layout', () => saveReview((review) => {
      review.layoutOverrides = { ...(review.layoutOverrides ?? {}), answerSpaces: { ...answerSpaces }, diagramColourModes: { ...diagramColourModes } };
      review.history.push({ at: new Date().toISOString(), type: 'layout-overrides' });
    }));
  }

  function isEdited(rootId, pointer) {
    return run?.review?.contentOverrides?.[rootId]?.[pointer] ?? null;
  }

  async function editContent(event) {
    if (!run) return;
    const ids = event.rootIds?.length ? event.rootIds : [event.rootId];
    await task('Saving content edit', async () => {
      let next = run;
      for (const rootId of ids) next = await request(`/__booklet/full-imports/${encodeURIComponent(run.runId)}/review/content`, { method: 'PATCH', body: JSON.stringify({ rootId, expectedRevision: next.revision, expectedBaseHash: next.baseHash, pointer: event.pointer, value: event.value, note: event.note ?? '' }) });
      run = next;
      return next;
    });
  }

  async function revertContent(event) {
    if (!run) return;
    const ids = event.rootIds?.length ? event.rootIds : [event.rootId];
    await task('Reverting content edit', async () => {
      let next = run;
      for (const rootId of ids) next = await request(`/__booklet/full-imports/${encodeURIComponent(run.runId)}/review/content`, { method: 'PATCH', body: JSON.stringify({ rootId, expectedRevision: next.revision, expectedBaseHash: next.baseHash, pointer: event.pointer, revert: true }) });
      run = next;
      return next;
    });
  }

  function editingChanged(active) {
    unsavedEdits = Math.max(0, unsavedEdits + (active ? 1 : -1));
  }

  function addFlag() {
    const category = window.prompt('Defect category: header, structure, content, diagram, duplication, table, spacing, or overflow', 'content');
    if (category === null) return;
    const allowed = ['header', 'structure', 'content', 'diagram', 'duplication', 'table', 'spacing', 'overflow'];
    if (!allowed.includes(category)) { error = 'Choose one of the listed defect categories.'; return; }
    const note = window.prompt('Describe the defect', '') ?? '';
    if (!note.trim()) return;
    task('Saving issue note', () => saveReview((review) => {
      review.flags ??= [];
      review.flags.push({ code: `review-${category}`, category, severity: 'fatal', rootId: currentPage?.id ?? `page-${selectedPage}`, pageNumber: selectedPage, note, source: 'reviewer', resolved: false });
      review.history.push({ at: new Date().toISOString(), type: 'flag', category, pageNumber: selectedPage, note });
    }));
  }

  function resolveFlag(index) {
    task('Resolving issue note', () => saveReview((review) => {
      if (review.flags?.[index]) review.flags[index] = { ...review.flags[index], resolved: true, resolvedAt: new Date().toISOString() };
      review.history.push({ at: new Date().toISOString(), type: 'resolve-flag', index });
    }));
  }

  function pageImage(pageNumber) {
    return `/__booklet/full-imports/${encodeURIComponent(run.runId)}/files/evidence/pages/page-${String(pageNumber).padStart(3, '0')}.png`;
  }

  onMount(() => {
    refreshRuns().then(() => {
      const query = new URLSearchParams(location.hash.split('?')[1] ?? '');
      const requestedRun = query.get('run');
      if (requestedRun) return selectRun(requestedRun).then(() => { const requestedPage = Number(query.get('page')); if (requestedPage) selectedPage = requestedPage; });
    }).catch((exception) => (error = exception.message));
  });
</script>
<section class="full-import-shell">
  <h2>Source reconstructions</h2>
  <p>Ask Codex in chat to reconstruct a booklet. Open its source evidence here, or create an editable booklet to work with the content, banks and assembly.</p>
  {#if error || message}<p role="status">{error || message}</p>{/if}
  <div class="runs-card"><button onclick={()=>task('Refresh',refreshRuns)} disabled={!!busy}>Refresh sources</button>
  {#each runs as item}<button class:active={run?.runId===item.runId} onclick={()=>task('Open source',()=>selectRun(item.runId))} disabled={!!busy||unsavedEdits>0}>{item.runId} - {item.selectedPages.length} pages</button>{/each}</div>
  {#if !runs.length}<p>No source reconstructions yet.</p>{/if}
  {#if run}
    <div class="queues"><button onclick={async()=>{const page=selectedPage;await task('Refresh',()=>selectRun(run.runId));selectedPage=page;}} disabled={!!busy||unsavedEdits>0}>Refresh drafts</button><button onclick={materializeProject} disabled={!!busy||unsavedEdits>0||!effectiveTranscription?.pages?.length||run.editConflicts?.length>0}>Create editable booklet</button></div>
    {#if draftOnly}<p data-draft-preview>{run.draftPreview.availablePages}/{run.draftPreview.totalPages} source pages available.</p>{#each run.draftPreview.issues as issue}<p>{issue.file}: {issue.note}</p>{/each}{/if}
    <nav class="queues" aria-label="Source views"><button onclick={()=>queue='pages'}>Pages</button><button onclick={()=>queue='flags'}>Issue notes ({flags.length})</button></nav>
    {#if queue === 'pages'}
      <div class="page-review">
        <aside class="card page-list">{#each run.selectedPages as pageNumber}<button class:active={selectedPage === pageNumber} onclick={() => (selectedPage = pageNumber)}><span>Page {pageNumber}</span></button>{/each}</aside>
        <main class="comparison">
          <figure class="card"><figcaption>Source PDF · page {selectedPage}</figcaption><img src={pageImage(selectedPage)} alt={'Source booklet page ' + selectedPage} /></figure>
          <section class="card reconstruction" data-review-page={selectedPage}><header><div><span>Structured reconstruction</span><strong>{currentPage?.section?.title ?? 'Awaiting exact transcription'}</strong></div><div class="preview-controls"><label>Review content <select bind:value={solutionMode}><option value="student">Student page</option><option value="short">Short answers (back)</option><option value="worked">Worked solutions (back)</option></select></label><label><input type="checkbox" bind:checked={showTheorySolutions} /> Theory solutions</label><label><input type="checkbox" bind:checked={editPreview} disabled={!currentPage} /> Edit preview</label><button class="secondary" onclick={addFlag} disabled={!currentPage || !!busy}>Flag issue</button><button class="secondary" onclick={saveLayoutOverrides} disabled={!!busy}>Save layout</button></div></header>{#if currentPage}<p class="layout-hint">Drag answer-space handles to resize. Turn on Edit preview, then click text, maths, or a table cell; Ctrl+Enter saves and Escape cancels. Answer modes preview content destined for the back-of-book sections; practice answers are never placed inline on student pages.{#if unsavedEdits > 0} Save or cancel the active edit before changing pages.{/if}</p>{#each run.editConflicts ?? [] as conflict}<p role="alert">Edit conflict: {conflict.rootId} — {conflict.reason}. Your saved edit is retained; reconcile it before creating a project.</p>{/each}<TranscribedBookletPage page={currentPage} bookletPages={effectiveTranscription.pages} runId={run.runId} {showTheorySolutions} {solutionMode} answerSpaceOverrides={answerSpaces} {diagramColourModes} onSpaceResize={setAnswerSpace} editMode={editPreview} onContentEdit={editContent} onContentRevert={revertContent} onEditingChange={editingChanged} {isEdited} />{:else}<p>No transcription draft is available for page {selectedPage} yet. Use Refresh drafts to load newly completed pages.</p>{/if}</section>
        </main>
      </div>
    {:else if queue === 'flags'}
      <div class="record-grid">{#each flags as flag, flagIndex}<article class:resolved={flag.resolved} class="card record"><div><span>{flag.severity ?? 'fatal'} � {flag.category ?? flag.source ?? 'review'}</span><h3>{flag.code}</h3><p>{flag.rootId} � {flag.note ?? 'Reviewer action required'}</p></div>{#if !flag.resolved}<button class="secondary" onclick={() => resolveFlag(flagIndex)}>Resolve</button>{:else}<span>Resolved</span>{/if}</article>{/each}{#if !flags.length}<p class="card empty">No reviewer flags.</p>{/if}</div>
    {:else}
      <p class="card empty">No records in this queue.</p>
    {/if}
  {/if}
</section>
<style>
.full-import-shell{max-width:1600px;margin:auto;padding:1rem}.runs-card,.queues,.preview-controls{display:flex;gap:.5rem;flex-wrap:wrap;margin:.6rem 0}button,select{padding:.5rem;min-height:36px}.page-review{display:grid;grid-template-columns:130px 1fr;gap:1rem}.page-list{display:flex;flex-direction:column;max-height:800px;overflow:auto}.comparison{display:grid;grid-template-columns:1fr 1fr;gap:1rem;min-width:0}.comparison figure{margin:0}.comparison img{width:100%}.reconstruction header>div:first-child{display:grid;gap:.35rem;margin-bottom:.75rem}.reconstruction{overflow:auto;max-height:900px}.active{font-weight:bold}.record{padding:1rem;border:1px solid #b8c7d4}.resolved{opacity:.7}@media(max-width:850px){.comparison{grid-template-columns:1fr}.page-review{grid-template-columns:1fr}.page-list{flex-direction:row;max-height:none}}
</style>
