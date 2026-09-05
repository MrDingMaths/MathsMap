<script>
  import { onMount } from 'svelte';
  import TranscribedBookletPage from './TranscribedBookletPage.svelte';
  import Tikz from './Tikz.svelte';
  import { combinedExampleTikz } from '../lib/booklet-preview.js';

  let { onprojectcreated = null } = $props();

  const pilotPages = '1-3,29-38,46,48,51,61-62';
  let pdf = $state('booklets/Computation with Integers.pdf');
  let docx = $state('booklets/Computation with Integers.docx');
  let pages = $state(pilotPages);
  let runId = $state('computation-integers-pilot');
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
  const currentPage = $derived(effectiveTranscription?.pages?.find((page) => page.pageNumber === selectedPage) ?? null);
  const pageReview = $derived(run?.review?.pages?.find((page) => page.pageNumber === selectedPage) ?? null);
  const questions = $derived(effectiveTranscription?.pages?.flatMap((page) => (page.blocks ?? []).filter((block) => block.type === 'question').map((question) => ({ ...question, pageNumber: page.pageNumber }))) ?? []);
  const diagrams = $derived(collectDiagrams(effectiveTranscription?.pages ?? []));
  const flags = $derived(run?.review?.flags ?? []);
  const queueHelp = {
    pages: 'Compare content and meaningful arrangements with the source. Accept page only when its reconstruction is complete.',
    modules: 'Modules are proposed reusable teaching sequences: theory, examples and related practice. Their titles are not a list of the booklet’s skills. Check the grouping before approving.',
    questions: 'Check each question, its parts, answers and scaffolding here. Approved questions can be reused in the question bank; review layout in Pages.',
    mappings: 'Mappings connect teaching modules and questions to curriculum skills. A module title is not a skill assignment. Question enrichment supplies question-level skills; module mapping supplies module-level links. Unmapped means no assignment has been made yet.',
    diagrams: 'Compare each reconstruction with its source. Where an exact source asset has not been linked, the full source page is shown. Approve only after checking labels, geometry and arrows.',
    flags: 'Flags are repair requests. Add the source page, what is wrong and the intended result. Build flagged repairs sends unresolved notes to the AI; Run repairs applies targeted results. Inspect the result before resolving a flag. Repeated defects also need a shared pipeline fix and regression test; resolving a flag does not teach future imports automatically.',
  };
  const skillSummary = (record) => [record.classification?.primarySkillId, ...(record.classification?.secondarySkillIds ?? [])].filter(Boolean).join(', ') || 'No skills assigned yet';
  const assetUrl = (src) => src?.startsWith('evidence/') ? `/__booklet/full-imports/${encodeURIComponent(run.runId)}/files/lanes/exact/${src}` : src;
  function sourceAsset(diagram) {
    return effectiveTranscription?.assets?.find((asset) => asset.occurrenceId === diagram.sourceAssetOccurrenceId || (diagram.src && asset.path === diagram.src && asset.pageNumber === diagram.pageNumber));
  }
  function diagramCode(diagram) {
    const base = diagram.overlayOf && diagrams.find((item) => item.id === diagram.overlayOf);
    return (base && combinedExampleTikz(base, diagram)) || diagram.code;
  }

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
    error = ''; message = ''; run = await request('/__booklet/full-imports/' + encodeURIComponent(id));
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

  async function doPreflight() {
    await task('Preflight', async () => { const value = await request('/__booklet/full-imports/preflight', { method: 'POST', body: '{}' }); message = `Preflight passed with ${value.model}.`; return value; });
  }

  async function prepare() {
    const value = await task('Preparing pilot', () => request('/__booklet/full-imports/prepare', { method: 'POST', body: JSON.stringify({ pdf, docx, pages, runId }) }));
    if (value) { run = value; selectedPage = value.selectedPages?.[0] ?? 1; await refreshRuns(); }
  }

  async function laneAction(action, lane) {
    if (!run) return;
    const value = await task(`${action} ${lane}`, () => request(`/__booklet/full-imports/${encodeURIComponent(run.runId)}/action`, { method: 'POST', body: JSON.stringify({ action, lane, concurrency: 3 }) }));
    if (value?.run) run = value.run;
  }

  async function captureFidelity() {
    if (!run) return;
    const value = await task('Capturing fidelity evidence', () => request(`/__booklet/full-imports/${encodeURIComponent(run.runId)}/action`, { method: 'POST', body: JSON.stringify({ action: 'capture-fidelity', base: location.origin }) }));
    if (value?.run) run = value.run;
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
    const next = JSON.parse(JSON.stringify(run.review)); mutator(next);
    run = await request(`/__booklet/full-imports/${encodeURIComponent(run.runId)}/review`, { method: 'PUT', body: JSON.stringify(next) });
  }

  function setAnswerSpace(id, value) {
    answerSpaces = { ...answerSpaces, [id]: value };
  }

  function setDiagramColour(id, value) {
    diagramColourModes = { ...diagramColourModes, [id]: value };
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
      for (const rootId of ids) next = await request(`/__booklet/full-imports/${encodeURIComponent(run.runId)}/review/content`, { method: 'PATCH', body: JSON.stringify({ rootId, pointer: event.pointer, value: event.value, note: event.note ?? '' }) });
      run = next;
      return next;
    });
  }

  async function revertContent(event) {
    if (!run) return;
    const ids = event.rootIds?.length ? event.rootIds : [event.rootId];
    await task('Reverting content edit', async () => {
      let next = run;
      for (const rootId of ids) next = await request(`/__booklet/full-imports/${encodeURIComponent(run.runId)}/review/content`, { method: 'PATCH', body: JSON.stringify({ rootId, pointer: event.pointer, revert: true }) });
      run = next;
      return next;
    });
  }

  function acceptPage(pageNumber, accepted) {
    if (unsavedEdits > 0) return;
    saveReview((review) => { const page = review.pages.find((item) => item.pageNumber === pageNumber); if (page) page.accepted = accepted; review.history.push({ at: new Date().toISOString(), type: 'page', id: `page-${pageNumber}`, accepted }); });
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
    saveReview((review) => {
      review.flags ??= [];
      review.flags.push({ code: `review-${category}`, category, severity: 'fatal', rootId: currentPage?.id ?? `page-${selectedPage}`, pageNumber: selectedPage, note, source: 'reviewer', resolved: false });
      const page = review.pages.find((item) => item.pageNumber === selectedPage);
      if (page) page.accepted = false;
      review.history.push({ at: new Date().toISOString(), type: 'flag', category, pageNumber: selectedPage, note });
    });
  }

  function resolveFlag(index) {
    saveReview((review) => {
      if (review.flags?.[index]) review.flags[index] = { ...review.flags[index], resolved: true, resolvedAt: new Date().toISOString() };
      review.history.push({ at: new Date().toISOString(), type: 'resolve-flag', index });
    });
  }

  function acceptRecord(kind, id, accepted) {
    saveReview((review) => { review[kind][id] = { ...(review[kind][id] ?? {}), accepted, at: new Date().toISOString() }; review.history.push({ at: new Date().toISOString(), type: kind, id, accepted }); });
  }

  function pageImage(pageNumber) {
    return `/__booklet/full-imports/${encodeURIComponent(run.runId)}/files/evidence/pages/page-${String(pageNumber).padStart(3, '0')}.png`;
  }

  function collectDiagrams(value, pageNumber = null, found = []) {
    if (!value || typeof value !== 'object') return found;
    const nextPage = value.pageNumber ?? pageNumber;
    if (value.id && ['tikz', 'image', 'svg'].includes(value.format) && ('src' in value || 'code' in value)) found.push({ ...value, pageNumber: nextPage });
    for (const child of Object.values(value)) collectDiagrams(child, nextPage, found);
    return found;
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
  <header class="full-heading">
    <div><span class="eyebrow">AGY transcription</span><h2>Full booklet</h2><p>PDF pages remain the visual authority. Every model-backed lane is pinned to <code>gemini-3.8-flash-high</code>; approval is always manual.</p></div>
    <button class="secondary" onclick={doPreflight} disabled={!!busy}>{busy === 'Preflight' ? 'Checking…' : 'Run preflight'}</button>
  </header>

  {#if error || message}<div class:error class="notice">{error || message}</div>{/if}

  <div class="setup-grid">
    <section class="card setup-card">
      <h3>Prepare the 18-page pilot</h3>
      <label>PDF visual authority<input bind:value={pdf} /></label>
      <label>DOCX editable evidence<input bind:value={docx} /></label>
      <div class="two"><label>Pages<input bind:value={pages} /></label><label>Run ID<input bind:value={runId} /></label></div>
      <button class="primary" onclick={prepare} disabled={!!busy}>{busy === 'Preparing pilot' ? 'Preparing…' : 'Prepare immutable evidence'}</button>
    </section>
    <aside class="card runs-card">
      <h3>Saved runs</h3>
      {#each runs as item}<button class:active={run?.runId === item.runId} onclick={() => selectRun(item.runId)}><strong>{item.runId}</strong><span>{item.status} · {item.acceptedPages}/{item.selectedPages.length} pages accepted</span></button>{/each}
      {#if !runs.length}<p>No full-booklet runs yet.</p>{/if}
    </aside>
  </div>

  {#if run}
    <section class="card lane-card">
      <div class="panel-title"><div><h3>Resumable lanes</h3><p>{run.runId} · concurrency 3 · no model fallback</p></div><span class="model">gemini-3.8-flash-high</span></div>
      <div class="lanes">
        {#each [['exact','Exact transcription'],['enrichment','Question enrichment'],['mapping','Module mapping'],['fidelity','Fidelity audit']] as lane}
          <article><div><strong>{lane[1]}</strong><span>{run.lanes?.[lane[0]]?.status ?? 'not-started'} · {run.lanes?.[lane[0]]?.results ?? 0}/{run.lanes?.[lane[0]]?.tasks ?? 0} results</span></div><div><button onclick={() => laneAction('build-tasks', lane[0])} disabled={!!busy}>Build</button><button onclick={() => laneAction('run', lane[0])} disabled={!!busy}>Run / resume</button><button onclick={() => laneAction('merge', lane[0])} disabled={!!busy}>Merge</button></div></article>
        {/each}
      </div>
      <div class="lane-footer"><button class="secondary" onclick={captureFidelity} disabled={!!busy}>Capture audit pages</button><button class="secondary" onclick={() => laneAction('validate', 'exact')} disabled={!!busy}>Validate</button><button class="secondary" onclick={() => laneAction('repair-build', 'repair')} disabled={!!busy}>Build flagged repairs</button><button class="secondary" onclick={() => laneAction('repair-run', 'repair')} disabled={!!busy}>Run repairs</button><button class="secondary" onclick={() => laneAction('publish-dry-run', 'exact')} disabled={!!busy}>Publication dry run</button><button class="primary" onclick={materializeProject} disabled={!!busy}>Create editable booklet</button><button class="secondary" onclick={() => laneAction('publish-apply', 'exact')} disabled={!!busy}>Publish approved to banks</button></div>
      {#if run.validation}<div class:invalid={!run.validation.valid} class="validation"><strong>{run.validation.valid ? 'Deterministic validation passed' : 'Validation blocked'}</strong><span>{run.validation.pages} pages · {run.validation.modules} modules · {run.validation.questions} questions</span>{#each run.validation.errors ?? [] as item}<small>{item}</small>{/each}</div>{/if}
    </section>

    <nav class="queues" aria-label="Full booklet review queues">
      {#each [['pages','Pages'],['modules','Modules'],['questions','Questions'],['mappings','Mappings'],['diagrams','Diagrams'],['flags','Flags']] as item}<button class:active={queue === item[0]} onclick={() => (queue = item[0])}>{item[1]}</button>{/each}
    </nav>
    <p class="layout-hint">{queueHelp[queue]}</p>

    {#if queue === 'pages'}
      <div class="page-review">
        <aside class="card page-list">{#each run.selectedPages as pageNumber}<button class:active={selectedPage === pageNumber} class:accepted={run.review.pages.find((page) => page.pageNumber === pageNumber)?.accepted} onclick={() => (selectedPage = pageNumber)}><span>Page {pageNumber}</span><b>{run.review.pages.find((page) => page.pageNumber === pageNumber)?.accepted ? 'Accepted' : 'Review'}</b></button>{/each}</aside>
        <main class="comparison">
          <figure class="card"><figcaption>Source PDF · page {selectedPage}</figcaption><img src={pageImage(selectedPage)} alt={'Source booklet page ' + selectedPage} /></figure>
          <section class="card reconstruction" data-review-page={selectedPage}><header><div><span>Structured reconstruction</span><strong>{currentPage?.section?.title ?? 'Awaiting exact transcription'}</strong></div><div class="preview-controls"><label>Review content <select bind:value={solutionMode}><option value="student">Student page</option><option value="short">Short answers (back)</option><option value="worked">Worked solutions (back)</option></select></label><label><input type="checkbox" bind:checked={showTheorySolutions} /> Theory solutions</label><label><input type="checkbox" bind:checked={editPreview} /> Edit preview</label><button class="secondary" onclick={addFlag} disabled={!currentPage || !!busy}>Flag issue</button><button class="secondary" onclick={saveLayoutOverrides} disabled={!!busy}>Save layout</button><label><input type="checkbox" checked={pageReview?.accepted ?? false} onchange={(event) => acceptPage(selectedPage, event.currentTarget.checked)} disabled={!currentPage || !!busy || unsavedEdits > 0} /> Accept page</label></div></header>{#if currentPage}<p class="layout-hint">Drag answer-space handles to resize. Turn on Edit preview, then click text, maths, or a table cell; Ctrl+Enter saves and Escape cancels. Answer modes preview content destined for the back-of-book sections; practice answers are never placed inline on student pages.{#if unsavedEdits > 0} Save or cancel the active edit before accepting this page.{/if}</p><TranscribedBookletPage page={currentPage} bookletPages={effectiveTranscription.pages} runId={run.runId} {showTheorySolutions} {solutionMode} answerSpaceOverrides={answerSpaces} {diagramColourModes} onSpaceResize={setAnswerSpace} editMode={editPreview} onContentEdit={editContent} onContentRevert={revertContent} onEditingChange={editingChanged} {isEdited} />{:else}<p>Build, run, and merge the exact-transcription lane to populate this view.</p>{/if}</section>
        </main>
      </div>
    {:else if queue === 'modules'}
      <div class="record-grid">{#each run.modules ?? [] as module}<article class="card record"><div><span>{module.classification?.mappingStatus ?? 'unmapped'}</span><h3>{module.title}</h3><p>Pages {module.pageNumbers?.join(', ')} · {module.sequence?.length ?? 0} ordered items</p></div><label><input type="checkbox" checked={run.review.modules?.[module.id]?.accepted ?? false} onchange={(event) => acceptRecord('modules', module.id, event.currentTarget.checked)} /> Approve module</label></article>{/each}</div>
    {:else if queue === 'questions'}
      <div class="record-grid">{#each questions as question}<article class="card record"><div><span>Page {question.pageNumber} · {question.classification?.reasoningScore ?? '—'}/100</span><h3>{question.id}</h3><p>{question.content?.prompt || 'Multipart question'}</p></div><label><input type="checkbox" checked={run.review.questions?.[question.id]?.accepted ?? false} onchange={(event) => acceptRecord('questions', question.id, event.currentTarget.checked)} /> Approve question</label></article>{/each}</div>
    {:else if queue === 'mappings'}
      <p class="layout-hint">Module assignments</p>
      <div class="record-grid">{#each run.modules ?? [] as module}<article class="card record"><div><span>{module.classification?.mappingStatus ?? 'Awaiting mapping'}</span><h3>Module: {module.title}</h3><p>Skills: {skillSummary(module)}</p><p>{module.classification?.mappingNote || 'Awaiting curriculum assignment.'}</p></div><label><input type="checkbox" checked={run.review.mappings?.[module.id]?.accepted ?? false} onchange={(event) => acceptRecord('mappings', module.id, event.currentTarget.checked)} /> Accept mapping</label></article>{/each}</div>
      <p class="layout-hint">Question assignments · {questions.filter((question) => question.classification?.primarySkillId).length}/{questions.length} questions have a primary skill. Review individual parts when auditing atomisation.</p>
      <div class="record-grid">{#each questions as question}<article class="card record"><div><h3>{question.id} · page {question.pageNumber}</h3><p>Skills: {skillSummary(question)}</p></div></article>{/each}</div>
    {:else if queue === 'diagrams'}
      <div class="record-grid">
        <div class="diagram-actions"><span>Image treatment is a reversible placement override.</span><button class="secondary" onclick={saveLayoutOverrides} disabled={!!busy}>Save diagram treatments</button></div>
        {#each diagrams as diagram}<article class="card diagram-record">
          <h3>{diagram.id} · source page {diagram.pageNumber ?? '—'}</h3><p>{diagram.alt}</p>
          <div class="diagram-comparison">
            <figure><figcaption>{sourceAsset(diagram) ? 'Linked source asset' : 'Source page — exact crop not linked'}</figcaption><a href={sourceAsset(diagram) ? assetUrl(sourceAsset(diagram).path) : pageImage(diagram.pageNumber)} target="_blank" rel="noreferrer"><img src={sourceAsset(diagram) ? assetUrl(sourceAsset(diagram).path) : pageImage(diagram.pageNumber)} alt="Source evidence; open for full size" /></a></figure>
            <figure><figcaption>{diagram.format === 'tikz' ? (diagram.overlayOf ? 'TikZ with base diagram' : 'Generated TikZ') : 'Retained image'}</figcaption>{#if diagram.format === 'tikz'}<Tikz code={diagramCode(diagram)} eager={true} />{:else}<img class:grayscale={diagramColourModes[diagram.id] === 'grayscale'} src={assetUrl(diagram.src)} alt={diagram.alt ?? 'Reconstructed diagram'} />{/if}</figure>
          </div>
          <div class="diagram-controls">{#if diagram.format !== 'tikz'}<label>Colour <select value={diagramColourModes[diagram.id] ?? 'original'} onchange={(event) => setDiagramColour(diagram.id, event.currentTarget.value)}><option value="original">Original asset</option><option value="grayscale">Black &amp; white</option></select></label>{:else}<label><input type="checkbox" checked={run.review.diagrams?.[diagram.id]?.accepted ?? false} onchange={(event) => acceptRecord('diagrams', diagram.id, event.currentTarget.checked)} /> Visual approval</label>{/if}<button class="secondary" onclick={() => { selectedPage = diagram.pageNumber; queue = 'pages'; }}>Review source page / flag issue</button></div>
        </article>{/each}
      </div>
    {:else if queue === 'flags'}
      <div class="record-grid">{#each flags as flag, flagIndex}<article class:resolved={flag.resolved} class="card record"><div><span>{flag.severity ?? 'fatal'} � {flag.category ?? flag.source ?? 'review'}</span><h3>{flag.code}</h3><p>{flag.rootId} � {flag.note ?? 'Reviewer action required'}</p></div>{#if !flag.resolved}<button class="secondary" onclick={() => resolveFlag(flagIndex)}>Resolve</button>{:else}<span>Resolved</span>{/if}</article>{/each}{#if !flags.length}<p class="card empty">No reviewer flags.</p>{/if}</div>
    {:else}
      <p class="card empty">No records in this queue.</p>
    {/if}
  {/if}
</section>

<style>
  .full-import-shell { max-width: 1400px; margin: 0 auto; color: var(--text, #1e293b); }
  .diagram-record { padding: 1rem; color: #172033; }
  .diagram-comparison :global(.tikz-wrap svg) { filter: none !important; }
  .diagram-comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .diagram-comparison figure { min-width: 0; border: 1px solid #dfe6ee; overflow: auto; }
  .diagram-comparison img { max-height: 420px; }
  .grayscale { filter: grayscale(1); }
  .full-heading, .panel-title, .lane-footer, .record { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
  h2, h3, p { margin-top: 0; } h2 { margin: .2rem 0; color: #23395d; } h3 { color: #23395d; font-size: .95rem; }
  .full-heading p, .panel-title p, .record p, .runs-card p { color: #66758d; font-size: .75rem; }
  .eyebrow { color: #3d6ea8; font-size: .65rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
  code, .model { font: .72rem ui-monospace, Consolas, monospace; }
  .card { border: 1px solid #dfe6ee; border-radius: 10px; background: #fff; box-shadow: 0 2px 10px rgba(15,23,42,.05); }
  .notice { margin: 1rem 0; padding: .7rem; border: 1px solid #b9dac6; border-radius: 7px; background: #f1fbf5; color: #236543; } .notice.error { border-color: #e5b7a7; background: #fff8f5; color: #99472c; }
  .setup-grid { display: grid; grid-template-columns: minmax(0,1.35fr) minmax(260px,.65fr); gap: 1rem; margin: 1rem 0; }
  .setup-card, .runs-card, .lane-card { padding: 1rem; } .setup-card label { display: block; margin: .55rem 0; font-size: .72rem; } .setup-card input { width: 100%; box-sizing: border-box; }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: .7rem; }
  button { cursor: pointer; } button:disabled { opacity: .5; cursor: wait; } .primary, .secondary, .lanes button { min-height: 34px; padding: .4rem .7rem; border-radius: 7px; font: inherit; font-size: .75rem; }
  .primary { border: 1px solid #e8443a; background: #e8443a; color: #fff; } .secondary, .lanes button { border: 1px solid #d9e0e8; background: #fff; color: #23395d; }
  .runs-card { max-height: 260px; overflow: auto; } .runs-card > button { display: grid; width: 100%; gap: .15rem; padding: .55rem; border: 0; border-bottom: 1px solid #edf0f3; background: transparent; text-align: left; } .runs-card > button.active { background: #edf5ff; } .runs-card span { color: #66758d; font-size: .65rem; }
  .model { padding: .35rem .5rem; border-radius: 5px; background: #edf5ff; color: #285b94; }
  .lanes { display: grid; margin-top: .7rem; border-top: 1px solid #e5eaf0; } .lanes article { display: flex; justify-content: space-between; gap: .7rem; padding: .65rem 0; border-bottom: 1px solid #e5eaf0; } .lanes article > div { display: flex; align-items: center; gap: .4rem; } .lanes span { color: #66758d; font-size: .67rem; }
  .lane-footer { flex-wrap: wrap; justify-content: flex-end; margin-top: .8rem; }
  .validation { display: grid; gap: .2rem; margin-top: .8rem; padding: .6rem; border-left: 3px solid #3aa76d; background: #f1fbf5; font-size: .72rem; } .validation.invalid { border-color: #e8443a; background: #fff5f3; } .validation span, .validation small { color: #66758d; }
  .queues { display: flex; gap: .2rem; margin-top: 1rem; border-bottom: 1px solid #d9e0e8; } .queues button { padding: .6rem .8rem; border: 0; border-bottom: 2px solid transparent; background: transparent; color: #66758d; } .queues button.active { border-color: #3d6ea8; color: #23395d; font-weight: 800; }
  .page-review { display: grid; grid-template-columns: 170px minmax(0,1fr); gap: 1rem; margin-top: 1rem; } .page-list { padding: .5rem; align-self: start; } .page-list button { display: flex; justify-content: space-between; width: 100%; padding: .45rem; border: 0; background: transparent; font-size: .7rem; } .page-list button.active { background: #edf5ff; } .page-list button.accepted b { color: #247047; }
  .comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; } figure { margin: 0; padding: .6rem; } figcaption { margin-bottom: .5rem; color: #66758d; font-size: .7rem; } figure img { display: block; width: 100%; max-height: 780px; object-fit: contain; background: #f4f6f8; }
  .reconstruction { padding: .8rem; max-height: 820px; overflow: auto; } .reconstruction header { display: flex; justify-content: space-between; gap: .7rem; padding-bottom: .6rem; border-bottom: 1px solid #dfe6ee; } .reconstruction header div { display: grid; } .reconstruction header span, .record span { color: #3d6ea8; font-size: .65rem; font-weight: 800; text-transform: uppercase; } .reconstruction label, .record label { font-size: .7rem; white-space: nowrap; }
  .preview-controls { display: flex !important; align-items: center; gap: .7rem; }
  .preview-controls select, .diagram-controls select { display: block; margin-top: .15rem; font: inherit; }
  .layout-hint { margin: .55rem 0; padding: .4rem .55rem; background: #f2f7fb; color: #51667d; font-size: .68rem; }
  .diagram-actions, .diagram-controls { display: flex; align-items: center; justify-content: space-between; gap: .7rem; }
  .record-grid { display: grid; gap: .65rem; margin-top: 1rem; } .record { padding: .8rem; } .record h3 { margin: .2rem 0; } .record p { margin-bottom: 0; } .empty { padding: 1rem; color: #66758d; }
  .record.resolved { opacity:.58; }
  @media (max-width: 900px) { .setup-grid, .page-review, .comparison { grid-template-columns: 1fr; } .page-list { display: flex; overflow: auto; } .page-list button { min-width: 110px; } }
</style>
