<script>
  import { onMount, tick } from 'svelte';
  import TranscribedBookletPage from './TranscribedBookletPage.svelte';
  import BookletReviewInspector from './BookletReviewInspector.svelte';
  import BookletAssemblyPanel from './BookletAssemblyPanel.svelte';
  import BookletWorkflowMetrics from './BookletWorkflowMetrics.svelte';
  import { reconcileApprovals, reviewTargets } from '../lib/booklet-review-model.js';
  import { skills } from '../lib/data.js';
  import {
    addProjectBlock, addProjectSection, createProjectBlock, deleteProjectBlock,
    deleteProjectSection, duplicateProjectBlock, duplicateProjectSection, moveProjectBlock,
    moveProjectSection, resizeFirstProjectTable, resizeQuestionParts, snapshotBankQuestion,
    updateProjectContent, updateProjectSettings,
  } from '../lib/editable-booklet-model.js';
  import {
    createBookletProject, deleteBookletProject, duplicateBookletProject,
    listBookletProjects, loadBookletProject, promoteProjectModule,
    promoteProjectQuestion, saveBookletProject,
  } from '../lib/booklet-project-storage.js';

  let { initialProjectId = null, bank = [], onprojectchange = null } = $props();
  let projects = $state([]);
  let project = $state(null);
  let selectedSectionId = $state('');
  let selectedBlockId = $state('');
  let selectedTargetId = $state('');
  let canvas=$state(null);
  $effect(()=>{
    if(!canvas)return;
    const select=event=>{const rootId=event.target.closest('[data-edit-root]')?.dataset.editRoot??event.target.closest('[data-node-id]')?.dataset.nodeId;const target=reviewTargets(project).find(t=>t.id===rootId);if(target){selectedBlockId=target.block.id;selectedTargetId=target.id;}};
    canvas.addEventListener('click',select);return()=>canvas?.removeEventListener('click',select);
  });
  let bankQuestionId = $state('');
  let addBlockType = $state('rich-text');
  let status = $state('');
  let error = $state('');
  let busy = $state('');
  let saveState = $state('Saved');
  let promotion = $state(null);
  let exportSettings = $state({ showTheorySolutions: true, showResponseSpaces: true, practiceAnswers: 'short' });
  let undoStack = $state([]);
  let redoStack = $state([]);
  let saveTimer = null;
  let saveInFlight = false;
  let savePending = false;

  const selectedSection = $derived(project?.sections?.find((section) => section.id === selectedSectionId) ?? project?.sections?.[0] ?? null);
  const selectedBlock = $derived(selectedSection?.blocks?.find((block) => block.id === selectedBlockId) ?? null);
  function buildPages(sections = []) {
    const pages = [];
    for (const section of sections) {
      let blocks = [];
      const flush = () => {
        pages.push({ id: `project-page-${section.id}-${pages.length + 1}`, pageNumber: pages.length + 1, section, blocks });
        blocks = [];
      };
      for (const block of section.blocks ?? []) {
        if (block.type === 'page-break') flush();
        else blocks.push(block);
      }
      if (blocks.length || !pages.length || pages.at(-1)?.section?.id !== section.id) flush();
    }
    return pages;
  }

  const projectPages = $derived(buildPages(project?.sections ?? []));
  const previewPage = $derived(projectPages.find((page) => page.section.id === selectedSection?.id && (!selectedBlockId || page.blocks.some((block) => block.id === selectedBlockId))) ?? projectPages.find((page) => page.section.id === selectedSection?.id) ?? projectPages[0] ?? null);
  const bookletPages = $derived([{ id: 'project-cover-anchor', pageNumber: 0, section: { title: project?.title ?? '' }, blocks: [] }, ...projectPages]);
  const exportPages = $derived(projectPages.filter(page=>page.section.role!=='candidate-pool'));
  const answerPages = $derived(exportPages.map((page) => ({ ...page, blocks: page.blocks.filter((block) => block.type === 'question' && block.pedagogyRole !== 'worked-example') })).filter((page) => page.blocks.length));
  const effectiveSpaces = $derived((() => {
    const spaces = { ...(project?.settings?.layoutOverrides?.answerSpaces ?? {}) };
    if (exportSettings.showResponseSpaces !== false) return spaces;
    const visit = (value) => {
      if (!value || typeof value !== 'object') return;
      if (value.id && value.type && !value.children?.length && 'answer' in value) spaces[value.id] = 0;
      for (const child of Object.values(value)) Array.isArray(child) ? child.forEach(visit) : visit(child);
    };
    visit(project?.sections ?? []);
    return spaces;
  })());

  const clone = (value) => JSON.parse(JSON.stringify(value));

  async function refreshProjects() {
    projects = await listBookletProjects();
  }

  function selectDefaults(next) {
    selectedSectionId = next?.sections?.[0]?.id ?? '';
    selectedBlockId = next?.sections?.[0]?.blocks?.[0]?.id ?? '';
    exportSettings = {
      showTheorySolutions: next?.settings?.showTheorySolutions !== false,
      showResponseSpaces: next?.settings?.showResponseSpaces !== false,
      practiceAnswers: next?.settings?.practiceAnswers ?? 'short',
    };
    promotion = null;
  }

  async function openProject(id) {
    busy = 'Opening'; error = ''; status = '';
    try {
      project = await loadBookletProject(id);
      selectDefaults(project);
      undoStack = []; redoStack = [];
      onprojectchange?.(project.id);
    } catch (exception) { error = exception.message; }
    finally { busy = ''; }
  }

  async function createNew() {
    const title = window.prompt('Booklet title', 'Untitled booklet');
    if (!title) return;
    busy = 'Creating'; error = '';
    try {
      const created = await createBookletProject({ title });
      await refreshProjects();
      project = created; selectDefaults(created); onprojectchange?.(created.id);
    } catch (exception) { error = exception.message; }
    finally { busy = ''; }
  }

  async function duplicateCurrent() {
    if (!project) return;
    busy = 'Duplicating'; error = '';
    try {
      const created = await duplicateBookletProject(project.id);
      await refreshProjects(); project = created; selectDefaults(created); onprojectchange?.(created.id);
    } catch (exception) { error = exception.message; }
    finally { busy = ''; }
  }

  async function removeCurrent() {
    if (!project) return;
    const confirmId = window.prompt(`Type ${project.id} to permanently delete this project.`);
    if (confirmId !== project.id) return;
    busy = 'Deleting'; error = '';
    try {
      await deleteBookletProject(project.id, confirmId);
      project = null; await refreshProjects();
      if (projects[0]) await openProject(projects[0].id);
    } catch (exception) { error = exception.message; }
    finally { busy = ''; }
  }

  function remember() {
    if (!project) return;
    undoStack = [...undoStack.slice(-39), clone(project)];
    redoStack = [];
  }

  function change(next, { rememberBefore = true } = {}) {
    if (rememberBefore) remember();
    project = reconcileApprovals(project, next);
    saveState = 'Unsaved changes';
    promotion = null;
    queueSave();
  }

  function queueSave() {
    if (!project) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 500);
  }

  async function persist() {
    if (!project) return;
    if (saveInFlight) { savePending = true; return; }
    saveInFlight = true; saveState = 'Saving…'; error = '';
    const snapshot = clone(project);
    try {
      const saved = await saveBookletProject(snapshot);
      project = { ...project, revision: saved.revision, updatedAt: saved.updatedAt };
      saveState = 'Saved';
      await refreshProjects();
    } catch (exception) {
      error = exception.message; saveState = exception.status === 409 ? 'Reload required' : 'Save failed';
    } finally {
      saveInFlight = false;
      if (savePending) { savePending = false; queueSave(); }
    }
  }

  function undo() {
    if (!undoStack.length || !project) return;
    const previous = undoStack.at(-1);
    redoStack = [...redoStack, clone(project)];
    undoStack = undoStack.slice(0, -1);
    change({ ...previous, revision: project.revision }, { rememberBefore: false });
  }

  function redo() {
    if (!redoStack.length || !project) return;
    const next = redoStack.at(-1);
    undoStack = [...undoStack, clone(project)];
    redoStack = redoStack.slice(0, -1);
    change({ ...next, revision: project.revision }, { rememberBefore: false });
  }

  function editContent(event) {
    try { change(updateProjectContent(project, event.rootId, event.pointer, event.value)); }
    catch (exception) { error = exception.message; }
  }

  function setSetting(patch) { change(updateProjectSettings(project, patch)); }

  function setExportSetting(patch) { exportSettings = { ...exportSettings, ...patch }; }

  function saveExportDefaults() {
    setSetting(exportSettings);
    status = 'PDF defaults saved with this booklet.';
  }

  function resetExportDefaults() {
    exportSettings = {
      showTheorySolutions: project.settings.showTheorySolutions !== false,
      showResponseSpaces: project.settings.showResponseSpaces !== false,
      practiceAnswers: project.settings.practiceAnswers ?? 'short',
    };
  }

  function setAnswerSpace(id, value) {
    setSetting({ layoutOverrides: { ...project.settings.layoutOverrides, answerSpaces: { ...project.settings.layoutOverrides.answerSpaces, [id]: Number(value) } } });
  }

  function addSection() {
    const existingIds = new Set(project.sections.map((section) => section.id));
    const next = addProjectSection(project, { afterIndex: project.sections.findIndex((section) => section.id === selectedSectionId) });
    change(next);
    selectedSectionId = next.sections.find((section) => !existingIds.has(section.id))?.id ?? selectedSectionId;
    selectedBlockId = '';
  }

  function removeSection() {
    if (!selectedSection || !window.confirm(`Delete “${selectedSection.title}” and all of its blocks?`)) return;
    change(deleteProjectSection(project, selectedSection.id));
    selectedSectionId = project.sections[0]?.id ?? '';
    selectedBlockId = project.sections[0]?.blocks?.[0]?.id ?? '';
  }

  function addBlock() {
    if (!selectedSection) return;
    const at = selectedSection.blocks.findIndex((block) => block.id === selectedBlockId);
    const block = createProjectBlock(addBlockType);
    change(addProjectBlock(project, selectedSection.id, block, { afterIndex: at >= 0 ? at : null }));
    selectedBlockId = block.id;
  }

  function addBankQuestion() {
    const question = bank.find((item) => item.id === bankQuestionId);
    if (!question || !selectedSection) return;
    const block = snapshotBankQuestion(question);
    const at = selectedSection.blocks.findIndex((item) => item.id === selectedBlockId);
    change(addProjectBlock(project, selectedSection.id, block, { afterIndex: at >= 0 ? at : null }));
    selectedBlockId = block.id;
  }

  function removeBlock() {
    if (!selectedBlock || !window.confirm('Delete this block from the booklet?')) return;
    const next = deleteProjectBlock(project, selectedSection.id, selectedBlock.id);
    change(next);
    selectedBlockId = next.sections.find((section) => section.id === selectedSection.id)?.blocks?.[0]?.id ?? '';
  }

  function resizeTable(rows, columns) {
    try { change(resizeFirstProjectTable(project, selectedBlock.id, { rows, columns })); }
    catch (exception) { error = exception.message; }
  }

  function patchSelected(pointer, value) {
    if (!selectedBlock) return;
    try { change(updateProjectContent(project, selectedBlock.id, pointer, value)); }
    catch (exception) { error = exception.message; }
  }

  async function inspectPromotion() {
    if (!selectedBlock) return;
    busy = 'Checking bank'; error = '';
    try { promotion = await promoteProjectQuestion(project.id, { blockId: selectedBlock.id, mode: 'inspect' }); }
    catch (exception) { error = exception.message; }
    finally { busy = ''; }
  }

  async function promote(mode, targetId = null) {
    busy = 'Promoting'; error = '';
    try {
      const result = await promoteProjectQuestion(project.id, { blockId: selectedBlock.id, mode, targetId });
      project = result.project; promotion = null; status = mode === 'link-existing' ? 'Linked to the existing bank question.' : 'Question promoted to the shared bank.';
      await refreshProjects();
    } catch (exception) { error = exception.message; }
    finally { busy = ''; }
  }

  async function promoteSection() {
    if (!selectedSection) return;
    const title = window.prompt('Reusable module title', selectedSection.title);
    if (!title) return;
    busy = 'Promoting module'; error = '';
    try {
      const result = await promoteProjectModule(project.id, { sectionId: selectedSection.id, title });
      status = `Saved reusable module ${result.module.id}.`;
    } catch (exception) { error = exception.message; }
    finally { busy = ''; }
  }

  async function printProject() {
    if (saveState !== 'Saved') await persist();
    busy = 'Preparing print'; error = '';
    try {
      await tick();
      const root = document.querySelector('.project-print');
      if (!root?.querySelector('.print-page')) throw new Error('Add booklet content before printing.');
      if (window.TikZ && !await window.TikZ.flushPending(root, 300000)) throw new Error('Diagrams are still rendering. Please retry printing.');
      if (root.querySelector('.tikz-error')) throw new Error('Repair the flagged diagram before printing.');
      await document.fonts.ready;
      await Promise.all([...root.querySelectorAll('img')].map(image => image.decode()));
      window.print();
    } catch (exception) { error = exception.message; }
    finally { busy = ''; }
  }

  onMount(async () => {
    try {
      await refreshProjects();
      const requested = initialProjectId && projects.some((item) => item.id === initialProjectId) ? initialProjectId : projects[0]?.id;
      if (requested) await openProject(requested);
    } catch (exception) { error = exception.message; }
  });
</script>

<section class="project-shell">
  <header class="project-toolbar project-screen">
    <div><span class="eyebrow">Editable master</span><h2>Booklets</h2><p>Project snapshots are independent of import evidence and bank records.</p></div>
    <div class="toolbar-actions"><span class="save-state">{saveState}</span><button onclick={undo} disabled={!undoStack.length}>Undo</button><button onclick={redo} disabled={!redoStack.length}>Redo</button><button onclick={createNew}>New booklet</button>{#if project}<button onclick={duplicateCurrent}>Duplicate</button><button class="danger" onclick={removeCurrent}>Delete</button><button class="primary" onclick={printProject}>Print / save PDF</button>{/if}</div>
  </header>

  {#if error || status}<div class:error class="project-notice project-screen">{error || status}</div>{/if}

  <div class="project-screen project-picker">
    <label>Open booklet<select value={project?.id ?? ''} onchange={(event) => openProject(event.currentTarget.value)}><option value="">Choose a project</option>{#each projects as item}<option value={item.id}>{item.title} · {item.sections} pages</option>{/each}</select></label>
  </div>

  {#if project}
    <BookletAssemblyPanel {project} onchange={change} oncreated={openProject} />
    {#key project.id}<BookletWorkflowMetrics {project} onchange={change} />{/key}
    <div class="project-editor project-screen">
      <aside class="project-outline">
        <label>Title<input value={project.title} onchange={(event) => change({ ...project, title: event.currentTarget.value })} /></label>
        <label>Subtitle<input value={project.subtitle} onchange={(event) => change({ ...project, subtitle: event.currentTarget.value })} /></label>
        <div class="export-settings">
          <strong>PDF configuration</strong>
          <label><input type="checkbox" checked={exportSettings.showTheorySolutions} onchange={(event) => setExportSetting({ showTheorySolutions: event.currentTarget.checked })} /> Show theory solutions</label>
          <label><input type="checkbox" checked={exportSettings.showResponseSpaces} onchange={(event) => setExportSetting({ showResponseSpaces: event.currentTarget.checked })} /> Student response spaces</label>
          <label>Practice answers<select aria-label="Practice answers" value={exportSettings.practiceAnswers} onchange={(event) => setExportSetting({ practiceAnswers: event.currentTarget.value })}><option value="none">Questions only</option><option value="short">Short answers at back</option><option value="worked">Worked solutions at back</option></select></label>
          <div class="row-actions"><button onclick={saveExportDefaults}>Save as defaults</button><button onclick={resetExportDefaults}>Reset</button></div>
        </div>
        <div class="outline-heading"><strong>Pages / sections</strong><button onclick={addSection}>+ Add</button></div>
        <div class="section-list">
          {#each project.sections as section, sectionIndex}
            <article class:active={section.id === selectedSection?.id}>
              <button class="section-select" onclick={() => { selectedSectionId = section.id; selectedBlockId = section.blocks[0]?.id ?? ''; promotion = null; }}><b>{sectionIndex + 1}</b><span>{section.title}</span></button>
              {#if section.id === selectedSection?.id}
                <div class="row-actions"><button onclick={() => change(moveProjectSection(project, section.id, -1))} disabled={sectionIndex === 0}>↑</button><button onclick={() => change(moveProjectSection(project, section.id, 1))} disabled={sectionIndex === project.sections.length - 1}>↓</button><button onclick={removeSection}>Delete</button></div>
                <button class="module-button" onclick={() => change(duplicateProjectSection(project, section.id))}>Duplicate section</button>
                <input class="section-title" value={section.title} onchange={(event) => change({ ...project, sections: project.sections.map((item) => item.id === section.id ? { ...item, title: event.currentTarget.value } : item) })} />
                <ol class="block-list">{#each section.blocks as block, blockIndex}<li class:active={block.id === selectedBlockId}><button onclick={() => { selectedBlockId = block.id; promotion = null; }}>{block.type === 'question' ? 'Question' : block.type === 'callout' ? block.title || 'Theory' : block.type === 'worked-example' ? block.title || 'Worked example' : block.type}</button><span><button onclick={() => change(moveProjectBlock(project, section.id, block.id, -1))} disabled={blockIndex === 0}>↑</button><button onclick={() => change(moveProjectBlock(project, section.id, block.id, 1))} disabled={blockIndex === section.blocks.length - 1}>↓</button><button onclick={() => change(duplicateProjectBlock(project, section.id, block.id))}>⧉</button></span></li>{/each}</ol>
                <div class="add-block"><select bind:value={addBlockType}><option value="rich-text">Text</option><option value="heading">Heading</option><option value="callout">Theory / callout</option><option value="worked-example">Worked example</option><option value="question">Local question</option><option value="grid">Table</option><option value="image">Image</option><option value="spacer">Spacing</option><option value="page-break">Page break</option></select><button onclick={addBlock}>Add block</button></div>
                <div class="bank-add"><select bind:value={bankQuestionId}><option value="">Add from question bank…</option>{#each bank as question}<option value={question.id}>{question.title || question.id}</option>{/each}</select><button onclick={addBankQuestion} disabled={!bankQuestionId}>Add copy</button></div>
                <button class="module-button" onclick={promoteSection}>Save section as reusable module</button>
              {/if}
            </article>
          {/each}
        </div>
      </aside>

      <main class="project-canvas" bind:this={canvas}>
        <div class="canvas-heading"><div><strong>{selectedSection?.title}</strong><span>{selectedSection?.sourcePageNumber ? `Imported page ${selectedSection.sourcePageNumber}` : 'Project page'}</span></div><label><input type="checkbox" checked disabled /> Direct editing</label></div>
        <div class="source-reconstruction" class:paired={Boolean(project.source?.runId && selectedSection?.sourcePageNumber)}>
        {#if project.source?.runId && selectedSection?.sourcePageNumber}
          <details class="source-evidence" open><summary>Source page {selectedSection.sourcePageNumber}</summary><a href={`/__booklet/full-imports/${encodeURIComponent(project.source.runId)}/files/evidence/pages/page-${String(selectedSection.sourcePageNumber).padStart(3,'0')}.png`} target="_blank" rel="noreferrer"><img src={`/__booklet/full-imports/${encodeURIComponent(project.source.runId)}/files/evidence/pages/page-${String(selectedSection.sourcePageNumber).padStart(3,'0')}.png`} alt={`Original source page ${selectedSection.sourcePageNumber}`} style="width:100%;max-height:65vh;object-fit:contain;object-position:top" /></a></details>
        {/if}
        {#if previewPage}<TranscribedBookletPage flow={true} page={previewPage} {bookletPages} runId={project.source?.runId ?? project.id} showTheorySolutions={exportSettings.showTheorySolutions} solutionMode="student" answerSpaceOverrides={effectiveSpaces} diagramColourModes={project.settings.layoutOverrides.diagramColourModes} onSpaceResize={setAnswerSpace} editMode={true} onContentEdit={editContent} isEdited={() => false} />{/if}
        </div>
      </main>

      <aside class="project-inspector">
        <BookletReviewInspector {project} blockId={selectedBlockId} {selectedTargetId} onchange={change} />
        <h3>Selected block</h3>
        {#if selectedBlock}
          <p><code>{selectedBlock.id}</code></p>
          <div class="row-actions"><button onclick={() => change(duplicateProjectBlock(project, selectedSection.id, selectedBlock.id))}>Duplicate</button><button class="danger" onclick={removeBlock}>Delete</button></div>
          {#if typeof selectedBlock.content === 'string' && selectedBlock.content.includes('|')}
            <fieldset><legend>Table</legend><div class="row-actions"><button onclick={() => resizeTable(1, 0)}>+ Row</button><button onclick={() => resizeTable(-1, 0)}>− Row</button><button onclick={() => resizeTable(0, 1)}>+ Column</button><button onclick={() => resizeTable(0, -1)}>− Column</button></div></fieldset>
          {/if}
          {#if selectedBlock.type === 'image'}
            <label>Image URL<input value={selectedBlock.src} onchange={(event) => patchSelected('/src', event.currentTarget.value)} /></label>
            <label>Width (mm)<input type="number" min="10" max="190" value={selectedBlock.widthMm} onchange={(event) => patchSelected('/widthMm', Number(event.currentTarget.value))} /></label>
            <label>Caption<input value={selectedBlock.caption} onchange={(event) => patchSelected('/caption', event.currentTarget.value)} /></label>
          {/if}
          {#if selectedBlock.type === 'spacer'}
            <label>Space height (mm)<input type="number" min="0" max="80" value={selectedBlock.heightMm ?? 10} onchange={(event) => patchSelected('/heightMm', Math.max(0, Math.min(80, Number(event.currentTarget.value))))} /></label>
          {/if}
          {#if selectedBlock.type === 'question'}
            <label>Question title<input value={selectedBlock.title ?? ''} onchange={(event) => patchSelected('/title', event.currentTarget.value)} /></label>
            <label>Primary skill<select value={selectedBlock.classification?.primarySkillId ?? ''} onchange={(event) => patchSelected('/classification/primarySkillId', event.currentTarget.value)}><option value="">Choose a skill</option>{#each skills as skill}<option value={skill.id}>{skill.code} - {skill.name}</option>{/each}</select></label>
            <label>Reasoning score<input type="number" min="0" max="100" value={selectedBlock.classification?.reasoningScore ?? 25} onchange={(event) => patchSelected('/classification/reasoningScore', Number(event.currentTarget.value))} /></label>
            <label>Part layout<select value={selectedBlock.content?.layout ?? 'list'} onchange={(event) => { patchSelected('/content/layout', event.currentTarget.value); if (event.currentTarget.value === 'list') patchSelected('/content/columns', null); }}><option value="list">List</option><option value="grid">Grid</option></select></label>
            {#if selectedBlock.content?.layout === 'grid'}<label>Columns<input type="number" min="2" max="4" value={selectedBlock.content?.columns ?? 2} onchange={(event) => patchSelected('/content/columns', Math.max(2, Math.min(4, Number(event.currentTarget.value))))} /></label>{/if}
            <fieldset><legend>Parts</legend><div class="row-actions"><button onclick={() => change(resizeQuestionParts(project, selectedBlock.id, 1))}>+ Part</button><button onclick={() => change(resizeQuestionParts(project, selectedBlock.id, -1))} disabled={!selectedBlock.content?.children?.length}>- Part</button></div></fieldset>
            <div class="bank-state"><strong>{selectedBlock.bankRef?.id ? `Bank snapshot: ${selectedBlock.bankRef.id}` : 'Booklet-local question'}</strong><button onclick={inspectPromotion} disabled={!!busy}>Check / promote</button>{#if selectedBlock.bankRef?.id}<button onclick={() => promote('update')}>Update bank question</button>{/if}</div>
            {#if promotion}<div class="promotion"><p>{promotion.candidates.length ? 'Possible bank matches:' : 'No duplicate candidates found.'}</p>{#each promotion.candidates as candidate}<article><span>{candidate.exact ? 'Exact' : `${Math.round(candidate.score * 100)}% similar`} · {candidate.title || candidate.id}</span><button onclick={() => promote('link-existing', candidate.id)}>Use existing</button></article>{/each}<button class="primary" onclick={() => promote('create')}>Create new bank question</button></div>{/if}
          {/if}
        {:else}<p>Select a block from the page outline.</p>{/if}
      </aside>
    </div>

    <section class="project-print" aria-hidden="true">
      <article class="project-cover"><h1>{project.title}</h1>{#if project.subtitle}<p>{project.subtitle}</p>{/if}</article>
      {#each exportPages as page}<div class="print-page"><TranscribedBookletPage flow={true} {page} {bookletPages} runId={project.source?.runId ?? project.id} showTheorySolutions={exportSettings.showTheorySolutions} solutionMode="student" answerSpaceOverrides={effectiveSpaces} diagramColourModes={project.settings.layoutOverrides.diagramColourModes} /></div>{/each}
      {#if exportSettings.practiceAnswers !== 'none'}
        <article class="answers-divider"><h1>{exportSettings.practiceAnswers === 'short' ? 'Answers' : 'Worked solutions'}</h1></article>
        {#each answerPages as page}<div class="print-page"><TranscribedBookletPage flow={true} {page} bookletPages={[{ id: 'answer-anchor', pageNumber: 0, section: {}, blocks: [] }, ...answerPages]} runId={project.source?.runId ?? project.id} showTheorySolutions={false} solutionMode={exportSettings.practiceAnswers} answerSpaceOverrides={effectiveSpaces} diagramColourModes={project.settings.layoutOverrides.diagramColourModes} /></div>{/each}
      {/if}
    </section>
  {:else}
    <section class="empty-project project-screen"><h3>No editable booklets yet</h3><p>Materialise an accepted full import or create a blank booklet.</p><button class="primary" onclick={createNew}>Create booklet</button></section>
  {/if}
</section>

<style>
  .source-reconstruction{display:grid;gap:.7rem;min-width:0}.source-reconstruction.paired{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.source-evidence{min-width:0}.source-evidence summary{cursor:pointer;padding:.5rem;background:white}@media(max-width:1300px){.source-reconstruction.paired{grid-template-columns:1fr}}@media(min-width:1700px){.project-shell{max-width:2200px!important}.project-editor{grid-template-columns:230px minmax(700px,1fr) 300px!important}}
  .project-shell{--blue:#2f6fb2;--ink:#23395d;--muted:#66758d;--border:#dfe6ee;max-width:1600px;margin:0 auto;padding:1rem 1.5rem 3rem;color:#1e293b}.project-toolbar,.toolbar-actions,.outline-heading,.row-actions,.canvas-heading,.bank-state{display:flex;align-items:center;justify-content:space-between;gap:.55rem}.project-toolbar{align-items:flex-start}.project-toolbar h2{margin:.15rem 0;color:var(--ink)}.project-toolbar p{margin:0;color:var(--muted);font-size:.76rem}.eyebrow{color:var(--blue);font-size:.65rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.toolbar-actions{flex-wrap:wrap;justify-content:flex-end}button,select,input{box-sizing:border-box;border:1px solid #cbd5e1;border-radius:6px;background:#fff;color:#26364d;font:inherit}button{min-height:32px;padding:.35rem .6rem;cursor:pointer}button:disabled{cursor:not-allowed;opacity:.45}button.primary{border-color:#2d7650;background:#2d7650;color:#fff}button.danger{color:#a33b32}.save-state{color:var(--muted);font-size:.72rem}.project-notice{margin:.8rem 0;padding:.65rem;border:1px solid #b9dac6;border-radius:7px;background:#f1fbf5;color:#236543}.project-notice.error{border-color:#e5b7a7;background:#fff8f5;color:#99472c}.project-picker{max-width:560px;margin:.8rem 0}.project-picker label,.project-outline>label,.project-inspector label{display:grid;gap:.25rem;color:var(--muted);font-size:.72rem;font-weight:700}.project-picker select,.project-outline input,.project-inspector input,.project-inspector select{width:100%;min-height:36px;padding:.4rem}.project-editor{display:grid;grid-template-columns:280px minmax(520px,1fr) 260px;gap:1rem;align-items:start}.project-outline,.project-inspector,.project-canvas{min-width:0;border:1px solid var(--border);border-radius:10px;background:#fff;box-shadow:0 2px 10px rgba(15,23,42,.05)}.project-outline,.project-inspector{padding:.8rem}.project-outline{position:sticky;top:1rem;max-height:calc(100vh - 2rem);overflow:auto}.project-inspector{position:sticky;top:1rem}.project-inspector h3{margin-top:0;color:var(--ink)}.project-inspector code{font-size:.64rem;overflow-wrap:anywhere}.export-settings{display:grid;gap:.4rem;margin:.8rem 0;padding:.65rem;border-radius:7px;background:#f2f7fb}.export-settings label{display:flex;align-items:center;gap:.4rem;color:#51667d;font-size:.72rem}.export-settings label:last-child{display:grid}.outline-heading{margin:.8rem 0 .4rem}.section-list{display:grid;gap:.45rem}.section-list article{border:1px solid var(--border);border-radius:7px}.section-list article.active{border-color:#8db4d9}.section-select{display:grid;width:100%;grid-template-columns:24px 1fr;border:0;text-align:left}.section-select b{color:var(--blue)}.section-title{margin:.35rem;width:calc(100% - .7rem)!important}.section-list .row-actions{padding:0 .35rem}.row-actions{justify-content:flex-start}.row-actions button{min-height:26px;padding:.18rem .4rem;font-size:.68rem}.block-list{display:grid;gap:.2rem;margin:.45rem;padding:0;list-style:none}.block-list li{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;border-radius:4px}.block-list li.active{background:#eaf3fb}.block-list li>button{overflow:hidden;border:0;background:transparent;text-align:left;text-overflow:ellipsis;white-space:nowrap}.block-list li span{display:flex}.block-list li span button{min-height:24px;padding:.1rem .25rem;border:0;background:transparent}.add-block,.bank-add{display:grid;grid-template-columns:1fr auto;gap:.3rem;padding:.35rem}.add-block select,.bank-add select{min-width:0}.module-button{width:calc(100% - .7rem);margin:.35rem}.project-canvas{padding:.75rem;background:#eef2f6}.canvas-heading{padding:0 0 .65rem}.canvas-heading div{display:grid}.canvas-heading span{color:var(--muted);font-size:.7rem}.project-inspector{display:grid;gap:.65rem}.project-inspector fieldset,.bank-state,.promotion{display:grid;gap:.4rem;padding:.6rem;border:1px solid var(--border);border-radius:7px}.bank-state strong{font-size:.7rem}.promotion article{display:grid;gap:.3rem;padding:.4rem;border-top:1px solid var(--border);font-size:.68rem}.empty-project{margin:2rem auto;padding:2rem;border:1px solid var(--border);border-radius:10px;background:#fff;text-align:center}.project-print{display:none}.project-cover,.answers-divider{box-sizing:border-box;width:210mm;height:297mm;padding:45mm 24mm;background:#fff;color:var(--ink);break-after:page}.project-cover h1,.answers-divider h1{font-size:30pt}.project-cover p{font-size:16pt}.print-page{break-after:page}
  @media(max-width:1250px){.project-editor{grid-template-columns:260px minmax(500px,1fr)}.project-inspector{position:static;grid-column:1/-1}}
  @media(max-width:850px){.project-shell{padding:.7rem}.project-toolbar{display:grid}.toolbar-actions{justify-content:flex-start}.project-editor{grid-template-columns:1fr}.project-outline{position:static;max-height:none}.project-canvas{overflow:auto}}
  @page studio-flow{background:white;size:A4;margin:10mm 15mm;@bottom-right{content:counter(page) " / " counter(pages);font-size:8pt;color:#66758d}}
  @media print{:global(html),:global(body){color-scheme:light!important;background:white!important;color:#24282d!important}.project-shell :global(.project-screen){display:none!important}.project-screen{display:none!important}.project-shell{max-width:none;margin:0;padding:0}.project-print{display:block;page:studio-flow;background:white}.project-cover,.answers-divider{display:block;width:180mm;height:270mm;padding:35mm 10mm}.print-page{display:block;width:180mm;min-height:0}.print-page:last-child{break-after:auto}}
</style>
