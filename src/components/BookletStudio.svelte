<script>
  import { onMount, tick } from 'svelte';
  import { flip } from 'svelte/animate';
  import PracticeQuestionRenderer from './PracticeQuestionRenderer.svelte';
  import PracticeQuestionEditor from './PracticeQuestionEditor.svelte';
  import { bookletStudioRoute } from '../lib/booklet-studio-route.js';
  import BookletProjects from './BookletProjects.svelte';
  import { courses, dotpoints, skills, topics } from '../lib/data.js';
  import {
    DIFFICULTIES,
    allNodes,
    deepCopy,
    estimateAnswerSpaceMm,
    estimateWorksheetPages,
    filterQuestionBank,
    skillMatchesTaxonomyPath,
    questionTaxonomy,
    sortQuestions,
  } from '../lib/practice-question-model.js';
  import {
    deleteQuestion,
    loadPracticeBank,
    readWorksheetDraft,
    updateQuestion,
    writeWorksheetDraft,
  } from '../lib/practice-question-storage.js';

  let { initialBank = [], onrequestbank = null, initialDifficulty = 'all', initialError = '', initialStage = 'builder', initialOutput = null, initialProjectId = null } = $props();

  let stage = $state('builder');
  let bank = $state([]);
  let error = $state('');
  let status = $state('');
  let busy = $state(false);
  let selectedIds = $state([]);
  let editingQuestion = $state(null);
  let filters = $state({
    text: '',
    courseId: '',
    topicId: '',
    subtopicId: '',
    skill: '',
    difficulty: [],
    reasoningMin: '',
    reasoningMax: '',
    multipart: null,
    hasDiagram: null,
  });
  let appliedFilters = $state({
    text: '',
    courseId: '',
    topicId: '',
    subtopicId: '',
    skill: '',
    difficulty: [],
    reasoningMin: '',
    reasoningMax: '',
    multipart: null,
    hasDiagram: null,
  });
  let sortMode = $state('reasoning');
  let sortDescending = $state(false);
  let manualOrder = $state(false);
  let previewOpen = $state(false);
  let cardsExpanded = $state(false);
  let expandedQuestionIds = $state.raw(new Set());
  let expandedSolutionIds = $state.raw(new Set());
  function toggleSolution(id, open) {
    if (expandedSolutionIds.has(id) === open) return;
    const next = new Set(expandedSolutionIds);
    if (open) next.add(id); else next.delete(id);
    expandedSolutionIds = next;
  }
  function toggleQuestionCard(id,open) {
    if(expandedQuestionIds.has(id)===open)return;
    const next=new Set(expandedQuestionIds);
    if(open)next.add(id);else next.delete(id);
    expandedQuestionIds=next;
  }
  function toggleAllQuestionCards() {
    cardsExpanded=!cardsExpanded;
    expandedQuestionIds=new Set(cardsExpanded?filtered.map(question=>question.id):[]);
  }
  let answerSpaces = $state({});
  let diagramWidths = $state({});
  let currentProjectId = $state(null);
  let layoutOverrides = $state({});
  let draftTitle = $state('Practice worksheet');
  let showSpaces = $state(false);
  let showShortAnswers = $state(false);
  let showWorkedSolutions = $state(false);
  let viewMode = $state('browse');
  let draggedId = $state(null);

  const byOrder = (left, right) => (left.order ?? 0) - (right.order ?? 0) || String(left.title ?? left.text ?? '').localeCompare(String(right.title ?? right.text ?? ''));
  const courseTitle = (id) => courses.find((item) => item.id === id)?.title ?? id;
  const topicTitle = (id) => topics.find((item) => item.id === id)?.title ?? id;
  const subtopicTitle = (id) => dotpoints.find((item) => item.id === id)?.text ?? id;
  const skillTitle = (id) => skills.find((item) => item.id === id)?.title ?? id;
  const dotpointById = new Map(dotpoints.map((dotpoint) => [dotpoint.id, dotpoint]));
  const skillById = new Map(skills.map((skill) => [skill.id, skill]));
  const selectedInSavedOrder = $derived(selectedIds.map((id) => bank.find((question) => question.id === id)).filter(Boolean));
  const selectedQuestions = $derived(manualOrder ? selectedInSavedOrder : sortQuestions(selectedInSavedOrder, 'reasoning'));
  const visibleTopics = $derived(topics.filter((topic) => !filters.courseId || (topic.courses ?? []).includes(filters.courseId)).sort(byOrder));
  const visibleSubtopics = $derived(dotpoints.filter((dotpoint) => {
    if (filters.topicId && dotpoint.topicId !== filters.topicId) return false;
    if (!filters.courseId) return true;
    return skills.some((skill) => (skill.courses ?? []).includes(filters.courseId) && (skill.dotPointIds ?? []).includes(dotpoint.id));
  }).sort(byOrder));
  const visibleSkills = $derived(skills.filter((skill) => skillMatchesTaxonomyPath(skill, filters, dotpointById)).sort(byOrder));
  const filterValues = $derived({
    text: appliedFilters.text,
    courseId: appliedFilters.courseId,
    topicId: appliedFilters.topicId,
    subtopicId: appliedFilters.subtopicId,
    skill: appliedFilters.skill,
    difficulty: [...appliedFilters.difficulty],
    reasoningMin: appliedFilters.reasoningMin,
    reasoningMax: appliedFilters.reasoningMax,
    multipart: appliedFilters.multipart,
    hasDiagram: appliedFilters.hasDiagram,
  });
  const sortedQuestions = $derived(sortQuestions(filterQuestionBank(bank, filterValues, { courses, topics, dotpoints, skills }), sortMode));
  const filtered = $derived(sortDescending ? [...sortedQuestions].reverse() : sortedQuestions);
  const filtersDirty = $derived(JSON.stringify(filters) !== JSON.stringify(appliedFilters));
  const activeFilters = $derived(describeFilters(appliedFilters));
  const estimatedPages = $derived(estimateWorksheetPages(selectedQuestions, { includeSpaces: showSpaces, includeShortAnswers: showShortAnswers, includeWorkedSolutions: showWorkedSolutions }));

  function applyRouteState() {
    const query = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
    const route = bookletStudioRoute(window.location.hash, initialStage, currentProjectId ?? initialProjectId);
    stage = route.stage;
    if(stage==='builder')onrequestbank?.();
    currentProjectId = route.projectId;
    if (route.redirect) window.history.replaceState(null, '', route.redirect);
    const requestedOutput = query.get('output') ?? initialOutput;
    if (requestedOutput === 'questions') { showSpaces = true; showShortAnswers = false; showWorkedSolutions = false; }
    if (requestedOutput === 'short-answers') { showSpaces = false; showShortAnswers = true; showWorkedSolutions = false; }
    if (requestedOutput === 'worked-solutions') { showSpaces = false; showShortAnswers = false; showWorkedSolutions = true; }
  }

  $effect(()=>{bank=initialBank??[];});
  $effect(()=>{error=initialError??'';});
  onMount(() => {
    if (initialDifficulty !== 'all') {
      filters.difficulty = [initialDifficulty];
      appliedFilters.difficulty = [initialDifficulty];
    }
    const saved = readWorksheetDraft();
    if (saved) {
      draftTitle = saved.title ?? draftTitle;
      selectedIds = saved.selectedIds ?? [];
      answerSpaces = saved.answerSpaces ?? {};
      diagramWidths = saved.diagramWidths ?? {};
      layoutOverrides = saved.layoutOverrides ?? {};
      showSpaces = saved.showSpaces ?? false;
      showShortAnswers = saved.showShortAnswers ?? false;
      showWorkedSolutions = saved.showWorkedSolutions ?? false;
      sortMode = saved.sortMode ?? sortMode;
      sortDescending = saved.sortDescending ?? sortDescending;
      manualOrder = saved.manualOrder ?? false;
    }
    applyRouteState();
    window.addEventListener('hashchange', applyRouteState);
    return () => window.removeEventListener('hashchange', applyRouteState);
  });

  function persistDraft() {
    writeWorksheetDraft({
      title: draftTitle,
      selectedIds,
      answerSpaces,
      diagramWidths,
      layoutOverrides,
      showSpaces,
      showShortAnswers,
      showWorkedSolutions,
      sortMode,
      sortDescending,
      manualOrder,
    });
  }

  function goBuilder() { onrequestbank?.(); stage = 'builder'; error = ''; status = ''; }
  function openProjects(projectId = currentProjectId) {
    stage = 'projects'; currentProjectId = projectId ?? null; error = ''; status = '';
  }

  function clearInvalidSkill(courseId = filters.courseId, topicId = filters.topicId, subtopicId = filters.subtopicId) {
    const selected = skillById.get(filters.skill);
    if (selected && !skillMatchesTaxonomyPath(selected, { courseId, topicId, subtopicId }, dotpointById)) filters.skill = '';
  }

  function setCourse(value) {
    filters.courseId = value;
    if (filters.topicId && !visibleTopics.some((topic) => topic.id === filters.topicId)) filters.topicId = '';
    if (filters.subtopicId && !visibleSubtopics.some((dotpoint) => dotpoint.id === filters.subtopicId)) filters.subtopicId = '';
    clearInvalidSkill(value, filters.topicId, filters.subtopicId);
  }
  function setTopic(value) {
    filters.topicId = value;
    if (filters.subtopicId && !visibleSubtopics.some((dotpoint) => dotpoint.id === filters.subtopicId)) filters.subtopicId = '';
    clearInvalidSkill(filters.courseId, value, filters.subtopicId);
  }
  function setSubtopic(value) {
    filters.subtopicId = value;
    clearInvalidSkill(filters.courseId, filters.topicId, value);
  }
  function toggleDifficulty(level) {
    filters.difficulty = filters.difficulty.includes(level) ? filters.difficulty.filter((item) => item !== level) : [...filters.difficulty, level];
  }
  function resetFilters() {
    const empty = { text: '', courseId: '', topicId: '', subtopicId: '', skill: '', difficulty: [], reasoningMin: '', reasoningMax: '', multipart: null, hasDiagram: null };
    filters = deepCopy(empty);
    appliedFilters = deepCopy(empty);
  }
  function applyFilters() {
    appliedFilters = deepCopy(filters);
    status = '';
  }
  function applySort(mode) { sortMode = mode; persistDraft(); }
  function toggleSortDirection() { sortDescending = !sortDescending; persistDraft(); }
  function toggleManualOrder() {
    if (!manualOrder) selectedIds = selectedQuestions.map((question) => question.id);
    manualOrder = !manualOrder;
    persistDraft();
  }
  function focusWorksheetTitle() {
    const title = document.getElementById('worksheet-title-input');
    if (!title) return;
    title.focus();
    const range = document.createRange();
    range.selectNodeContents(title);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
  function describeFilters(value) {
    const items = [];
    if (value.courseId) items.push({ field: 'courseId', text: courseTitle(value.courseId) });
    if (value.topicId) items.push({ field: 'topicId', text: topicTitle(value.topicId) });
    if (value.subtopicId) items.push({ field: 'subtopicId', text: subtopicTitle(value.subtopicId) });
    if (value.skill) items.push({ field: 'skill', text: skillTitle(value.skill) });
    for (const difficulty of value.difficulty ?? []) items.push({ field: 'difficulty', value: difficulty, text: difficulty });
    if (value.reasoningMin !== '') items.push({ field: 'reasoningMin', text: 'Score from ' + value.reasoningMin });
    if (value.reasoningMax !== '') items.push({ field: 'reasoningMax', text: 'Score to ' + value.reasoningMax });
    if (value.text) items.push({ field: 'text', text: 'Search: ' + value.text });
    return items;
  }
  function removeActiveFilter(item) {
    const next = deepCopy(appliedFilters);
    if (item.field === 'difficulty') next.difficulty = next.difficulty.filter((value) => value !== item.value);
    else if (item.field === 'multipart' || item.field === 'hasDiagram') next[item.field] = null;
    else next[item.field] = '';
    if (item.field === 'courseId') { next.topicId = ''; next.subtopicId = ''; next.skill = ''; }
    if (item.field === 'topicId') { next.subtopicId = ''; next.skill = ''; }
    if (item.field === 'subtopicId') next.skill = '';
    filters = deepCopy(next);
    appliedFilters = next;
  }

  function toggle(id) {
    selectedIds = selectedIds.includes(id) ? selectedIds.filter((value) => value !== id) : [...selectedIds, id];
    persistDraft();
  }
  function selectAll() {
    selectedIds = [...new Set([...selectedIds, ...filtered.map((question) => question.id)])];
    persistDraft();
  }
  function selectNone() {
    const visible = new Set(filtered.map((question) => question.id));
    selectedIds = selectedIds.filter((id) => !visible.has(id));
    persistDraft();
  }
  function selectRandom(count = 1) {
    const candidates = filtered.filter((question) => !selectedIds.includes(question.id)).sort(() => Math.random() - .5).slice(0, count);
    selectedIds = [...new Set([...selectedIds, ...candidates.map((question) => question.id)])];
    persistDraft();
  }

  function reorder(id, delta) {
    const index = selectedIds.indexOf(id);
    const nextIndex = index + delta;
    if (index < 0 || nextIndex < 0 || nextIndex >= selectedIds.length) return;
    const next = [...selectedIds];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    selectedIds = next;
    persistDraft();
  }
  function startDrag(id) { draggedId = id; }
  function dropOn(id) {
    if (!draggedId || draggedId === id) return;
    const from = selectedIds.indexOf(draggedId);
    const to = selectedIds.indexOf(id);
    if (from < 0 || to < 0) return;
    const next = [...selectedIds];
    next.splice(from, 1);
    next.splice(to, 0, draggedId);
    selectedIds = next;
    draggedId = null;
    persistDraft();
  }

  function setSpace(nodeId, value) {
    answerSpaces = { ...answerSpaces, [nodeId]: Math.max(0, Math.min(180, Number(value) || 0)) };
    persistDraft();
  }
  function setDiagramWidth(diagramId, value) {
    diagramWidths = { ...diagramWidths, [diagramId]: Math.max(25, Math.min(190, Number(value) || 95)) };
    persistDraft();
  }
  function setLayout(nodeId, value) {
    layoutOverrides = { ...layoutOverrides, [nodeId]: value === 'list' ? { layout: 'list', columns: null } : { layout: 'grid', columns: Number(value.split(':')[1]) } };
    persistDraft();
  }
  function worksheetQuestion(question) {
    const next = deepCopy(question);
    for (const node of allNodes(next.content)) {
      const override = layoutOverrides[node.id];
      if (override) {
        node.layout = override.layout;
        node.columns = override.columns;
      }
    }
    return next;
  }
  function deleteRecord(question) {
    const confirmation = window.prompt('Type ' + question.id + ' to permanently delete this question.');
    if (confirmation !== question.id) return;
    busy = true;
    error = '';
    deleteQuestion(question.id, confirmation).then(() => {
      bank = bank.filter((item) => item.id !== question.id);
      selectedIds = selectedIds.filter((id) => id !== question.id);
      status = 'Deleted ' + question.id + ' from the private local bank.';
      persistDraft();
    }).catch((exception) => {
      error = exception.message;
    }).finally(() => {
      busy = false;
    });
  }
  async function saveEditedQuestion(next) {
    if (!next || next.editorError) return;
    busy = true;
    error = '';
    try {
      const saved = await updateQuestion(next);
      bank = bank.map((question) => question.id === saved.id ? saved : question);
      editingQuestion = null;
      status = 'Saved ' + saved.id + ' to the question bank.';
    } catch (exception) {
      error = exception.message;
    } finally {
      busy = false;
    }
  }
  function outputToggled() { persistDraft(); }
  function togglePreview(open = !previewOpen) { previewOpen = open; if (open) viewMode = 'preview'; }
  async function printWorksheet() { previewOpen = true; await tick(); window.print(); }
  function openEditor(question) { editingQuestion = deepCopy(question); error = ''; }
  function copyQuestionId(id) {
    const copiedValue = navigator.clipboard?.writeText(id);
    if (copiedValue) {
      copiedValue.then(() => {
        status = 'Copied ' + id + '.';
      }).catch(() => {
        status = id;
      });
    } else {
      status = id;
    }
  }

  function flowNodeMm(node) {
    const diagramLoad = (node.questionDiagrams ?? []).reduce((sum, diagram) => sum + Math.max(18, Math.min(72, (diagramWidths[diagram.id] ?? diagram.widthMm ?? 95) / 3.2)), 0);
    if (!node.children?.length) {
      const space = answerSpaces[node.id] ?? estimateAnswerSpaceMm(node);
      return 9 + diagramLoad + (showSpaces && space > 0 ? space : 0);
    }
    const childHeights = node.children.map(flowNodeMm);
    if (node.layout === 'grid' && Number(node.columns) >= 2) {
      const rows = [];
      for (let index = 0; index < childHeights.length; index += Number(node.columns)) rows.push(Math.max(...childHeights.slice(index, index + Number(node.columns))));
      return 10 + diagramLoad + rows.reduce((sum, height) => sum + height + 3, 0);
    }
    return 10 + diagramLoad + childHeights.reduce((sum, height) => sum + height, 0);
  }
  function questionFlowMm(question) { return 12 + flowNodeMm(question.content); }
  function pageBreakAfter(index) {
    if (index < 0 || index >= selectedQuestions.length - 1) return false;
    const pageCapacity = 250;
    let used = 42;
    for (let item = 0; item <= index; item += 1) {
      const height = questionFlowMm(selectedQuestions[item]);
      if (item > 0 && used + height > pageCapacity) used = 42;
      used += height;
    }
    return used + questionFlowMm(selectedQuestions[index + 1]) > pageCapacity;
  }
</script>

<svelte:head><title>Booklet Studio</title></svelte:head>

<div class="studio-shell" class:project-workspace={stage==='projects'}>
  <header class="studio-header">
    <strong>Booklet Studio</strong>
  </header>

  <nav class="workspace-tabs" aria-label="Booklet Studio workspace">
    <button class:active={stage === 'projects'} onclick={() => openProjects()}>Booklets</button>
    <button class:active={stage === 'builder'} onclick={goBuilder}>Question bank</button>
  </nav>

  {#if status || error}
    <div class:has-error={error} class="status-bar">{error || status}</div>
  {/if}

  {#if stage === 'projects'}
    <BookletProjects {onrequestbank} bank={initialBank} initialProjectId={currentProjectId} onprojectchange={(id) => (currentProjectId = id)} />
  {:else if stage === 'builder'}
    <h1 class="sr-only">Build a worksheet</h1>

    <section class:filter-bar--pending={filtersDirty} class="filter-bar filter-bar--chips" aria-label="Question filters">
      <div class="filter-bar__row filter-bar__row--primary">
        <div class="filter-row course-filter">
          <span class="filter-row__label">Course:</span>
          {#each courses.slice().sort(byOrder) as course}
            <button type="button" class:chip--active={filters.courseId === course.id} class="chip" onclick={() => setCourse(filters.courseId === course.id ? '' : course.id)}>{course.title}</button>
          {/each}
        </div>
      </div>

      <div class="filter-bar__row filter-bar__row--topics">
        <details class:disabled={!filters.courseId} class="taxonomy-picker">
          <summary class="btn topic-picker-btn">+ Add topics, subtopics &amp; skills</summary>
          <div class="taxonomy-picker__popover">
            <label>Topic<select value={filters.topicId} onchange={(event) => setTopic(event.currentTarget.value)}><option value="">All topics</option>{#each visibleTopics as topic}<option value={topic.id}>{topic.title}</option>{/each}</select></label>
            <label>Subtopic<select value={filters.subtopicId} onchange={(event) => setSubtopic(event.currentTarget.value)}><option value="">All subtopics</option>{#each visibleSubtopics as dotpoint}<option value={dotpoint.id}>{dotpoint.text}</option>{/each}</select></label>
            <label>Skill<select value={filters.skill} onchange={(event) => (filters.skill = event.currentTarget.value)}><option value="">All skills</option>{#each visibleSkills as skill}<option value={skill.id}>{skill.title}</option>{/each}</select></label>
            <button type="button" class="btn btn--success btn--small" onclick={applyFilters}>Apply filters</button>
          </div>
        </details>
      </div>

      <div class="filter-bar__row">
        <div class="filter-row">
          <span class="filter-row__label">Difficulty:</span>
          {#each DIFFICULTIES as level}
            <button type="button" class:chip--active={filters.difficulty.includes(level.id)} class="chip" onclick={() => toggleDifficulty(level.id)}>{level.label}</button>
          {/each}
        </div>
      </div>

      <div class="filter-bar__row filter-bar__row--controls">
        <div class="filter-row filter-row--search">
          <label class="sr-only" for="question-search">Search question text or question ID</label>
          <input id="question-search" class="filter-bar__search" value={filters.text} oninput={(event) => (filters.text = event.currentTarget.value)} placeholder="Search question text or question ID" />
        </div>
        <div class="filter-row filter-group--props">
          <div class="reasoning-filter"><span>Reasoning:</span><input aria-label="Minimum reasoning score" type="number" min="0" max="100" value={filters.reasoningMin} oninput={(event) => (filters.reasoningMin = event.currentTarget.value)} placeholder="0" /><span>to</span><input aria-label="Maximum reasoning score" type="number" min="0" max="100" value={filters.reasoningMax} oninput={(event) => (filters.reasoningMax = event.currentTarget.value)} placeholder="100" /></div>
        </div>
      </div>

      {#if activeFilters.length}
        <div class="active-filters"><span class="active-filters__label">Active:</span>{#each activeFilters as item}<span class="active-filter"><span>{item.text}</span><button type="button" class="active-filter__remove" onclick={() => removeActiveFilter(item)} aria-label={'Remove ' + item.text}>&times;</button></span>{/each}<button type="button" class="btn btn--secondary btn--small active-filters__clear" onclick={resetFilters}>Clear all filters</button></div>
      {/if}

      <div class="filter-bar__apply-row">
        {#if filtersDirty}<span class="apply-reminder">Filters have changed. Select <strong>Apply filters</strong> to update the results.</span>{/if}
        <button type="button" class="btn btn--secondary btn--small" onclick={resetFilters}>Clear filters</button>
        <button type="button" class="btn btn--success apply-filters-btn" onclick={applyFilters}>Apply filters</button>
      </div>
    </section>

    <section class="worksheet-controls" aria-label="Worksheet controls">
      <div class="worksheet-counts-row"><span class="results-count">{filtered.length} question{filtered.length === 1 ? '' : 's'}</span>{#if selectedIds.length}<span class="results-count selection-summary">{selectedIds.length} selected &middot; about {estimatedPages} page{estimatedPages === 1 ? '' : 's'}</span>{/if}</div>
      <div class="worksheet-action-row">
        <div class="control-group" data-label="Sort">
          <details class="expand-dropdown sort-dropdown">
            <summary class="btn btn--secondary btn--small">Sort: {sortMode === 'reasoning' ? 'Difficulty' : sortMode === 'skill' ? 'Skill' : 'Question ID'}</summary>
            <div class="expand-dropdown__menu"><button class="expand-dropdown__item" onclick={() => applySort('reasoning')}>Difficulty</button><button class="expand-dropdown__item" onclick={() => applySort('skill')}>Skill</button><button class="expand-dropdown__item" onclick={() => applySort('manual')}>Question ID</button></div>
          </details>
          <button type="button" class="btn btn--secondary btn--small" onclick={toggleSortDirection}>{sortDescending ? 'Descending' : 'Ascending'}</button>
          <button type="button" class:active={cardsExpanded} class="btn btn--secondary btn--small btn--toggle" onclick={toggleAllQuestionCards}>{cardsExpanded ? 'Collapse' : 'Expand'}</button>
        </div>
        <div class="control-group" data-label="Select"><button class="btn btn--secondary btn--small" onclick={selectAll}>All</button><button class="btn btn--secondary btn--small" onclick={selectNone}>None</button><button class="btn btn--secondary btn--small" onclick={() => selectRandom(1)}>+1 Random</button><button class="btn btn--secondary btn--small" onclick={() => selectRandom(10)}>+10 Random</button></div>
        <div class="control-group" data-label="Worksheet order"><button class:active={manualOrder} aria-pressed={manualOrder} class="btn btn--secondary btn--small btn--toggle" onclick={toggleManualOrder}>{manualOrder ? 'Use auto difficulty' : 'Enable manual order'}</button></div>
        <div class="control-group" data-label="Show"><button class:active={showSpaces} aria-pressed={showSpaces} class="btn btn--secondary btn--small btn--toggle" onclick={() => { showSpaces = !showSpaces; outputToggled(); }}>Spaces</button><button class:active={showShortAnswers} aria-pressed={showShortAnswers} class="btn btn--secondary btn--small btn--toggle" onclick={() => { showShortAnswers = !showShortAnswers; outputToggled(); }}>Answers</button><button class:active={showWorkedSolutions} aria-pressed={showWorkedSolutions} class="btn btn--secondary btn--small btn--toggle" onclick={() => { showWorkedSolutions = !showWorkedSolutions; outputToggled(); }}>Solutions</button></div>
        <button class="btn btn--secondary" onclick={() => togglePreview()}>{previewOpen ? 'Close preview' : 'Preview'}</button>
        <button class="btn btn--success btn--print" onclick={printWorksheet}>Print</button>
      </div>
      <div class="mobile-view-toggle"><button class:is-active={viewMode === 'browse'} onclick={() => (viewMode = 'browse')}>Browse</button><button class:is-active={viewMode === 'preview'} onclick={() => { previewOpen = true; viewMode = 'preview'; }}>Preview</button></div>
    </section>

    <div class:worksheet-layout--split={previewOpen} class:mobile-show-preview={viewMode === 'preview'} class="worksheet-layout">
      <div class="questions-col">
        <section class="questions-grid">
          {#each filtered as question (question.id)}
            {@const taxonomy = questionTaxonomy(question, { skills, topics, dotpoints })}
            <div class="question-row">
              <label class="question-row__checkbox"><input aria-label={'Select ' + question.id} type="checkbox" checked={selectedIds.includes(question.id)} onchange={() => toggle(question.id)} /></label>
              <div class:question-card--selected={selectedIds.includes(question.id)} class="question-card">
                <details class="question-card__collapsible" open={expandedQuestionIds.has(question.id)} ontoggle={event=>toggleQuestionCard(question.id,event.currentTarget.open)}>
                  <summary class="question-card__summary">
                    <div class="question-card__rows">
                      <div class="question-card__row"><div class="question-card__meta">{#each taxonomy.courseIds.slice(0, 3) as courseId}<span class="badge badge--stage">{courseTitle(courseId)}</span>{/each}</div><div class="question-card__meta-right"><span class="badge badge--reasoning">{question.classification.reasoningScore}/100</span><span class="badge badge--difficulty">{question.classification.difficulty}</span></div></div>
                      <div class="question-card__row"><div class="question-card__meta">{#each taxonomy.topicIds.slice(0, 2) as topicId}<span class="badge badge--topic">{topicTitle(topicId)}</span>{/each}<span class="badge badge--skill">{skillTitle(question.classification.primarySkillId)}</span></div><div class="question-card__meta-right"><button class="id-copy-btn" onclick={(event) => { event.stopPropagation(); copyQuestionId(question.id); }} title={'Copy question ID: ' + question.id} aria-label={'Copy question ID ' + question.id}>{question.id.slice(0, 8)}</button></div></div>
                    </div>
                  </summary>
                  {#if expandedQuestionIds.has(question.id)}<div class="question-card__body"><PracticeQuestionRenderer question={question} showSpaces={false} compact={true} diagramWidthOverrides={diagramWidths} /></div>{/if}
                  {#if expandedQuestionIds.has(question.id)}
                    <details class="question-card__solution" open={expandedSolutionIds.has(question.id)} ontoggle={event => toggleSolution(question.id, event.currentTarget.open)}>
                      <summary>{expandedSolutionIds.has(question.id) ? 'Hide solution' : 'Show solution'}</summary>
                      {#if expandedSolutionIds.has(question.id)}
                        <div class="question-card__solution-content">
                          <PracticeQuestionRenderer question={question} showSpaces={false} showWorkedSolutions={true} showTitle={false} answerColumnsLimit={1} compact={true} diagramWidthOverrides={diagramWidths} blockLayouts={question.presentation?.layoutOverrides?.blockLayouts ?? {}} />
                        </div>
                      {/if}
                    </details>
                  {/if}
                  <div class="question-card__footer"><div><button class="btn btn--secondary btn--small" onclick={() => openEditor(question)}>Edit</button><button class="btn-link" onclick={() => deleteRecord(question)} disabled={busy}>Delete</button></div></div>
                </details>
              </div>
            </div>
          {/each}
          {#if !filtered.length}<p class="empty-bank">No questions match these filters.</p>{/if}
        </section>
      </div>

      {#if previewOpen}
        <aside class="worksheet-preview-outer">
          <button type="button" class="worksheet-preview-close" onclick={() => togglePreview(false)} aria-label="Close preview">&times;</button>
          <article class="a4-preview print-document">
            <header class="worksheet-header"><span class="worksheet-header__title-row"><h2 id="worksheet-title-input" class="worksheet-header__editable-title" contenteditable="true" spellcheck="false" bind:textContent={draftTitle} oninput={persistDraft} data-placeholder="Practice worksheet" title="Click to edit worksheet title"></h2><button type="button" class="worksheet-header__title-edit" onclick={focusWorksheetTitle} title="Edit worksheet title" aria-label="Edit worksheet title">&#9998;</button></span></header>
            {#if selectedQuestions.length}
              {#each selectedQuestions as question, index (question.id)}
                <div class="preview-question-shell" animate:flip={{ duration: 170 }}>
                <section class:tall-question={questionFlowMm(question) > 250} class:manual-order-item={manualOrder} class="preview-question" draggable={manualOrder} ondragstart={() => manualOrder && startDrag(question.id)} ondragover={(event) => { if (manualOrder) event.preventDefault(); }} ondrop={() => manualOrder && dropOn(question.id)} role="listitem" aria-label={'Preview item ' + (index + 1)}>
                  {#if manualOrder}<div class="preview-question-tools"><span class="drag-handle" title="Drag to reorder">Drag to reorder</span><span class="preview-number">#{index + 1}</span><button class="btn btn--secondary btn--small" onclick={() => reorder(question.id, -1)} disabled={index === 0}>Up</button><button class="btn btn--secondary btn--small" onclick={() => reorder(question.id, 1)} disabled={index === selectedQuestions.length - 1}>Down</button></div>{/if}
                  {#if allNodes(question.content).some((node) => node.children?.length)}
                    <div class="layout-controls"><span>Layout</span>{#each allNodes(question.content).filter((node) => node.children?.length) as node}<label>{node.label ? '(' + node.label + ')' : 'Question'}<select value={(layoutOverrides[node.id]?.layout === 'grid' ? 'grid:' + layoutOverrides[node.id].columns : layoutOverrides[node.id]?.layout === 'list' ? 'list' : node.layout === 'grid' ? 'grid:' + node.columns : 'list')} onchange={(event) => setLayout(node.id, event.currentTarget.value)}><option value="list">List</option><option value="grid:2">2 columns</option><option value="grid:3">3 columns</option><option value="grid:4">4 columns</option></select></label>{/each}</div>
                  {/if}
                  <PracticeQuestionRenderer question={worksheetQuestion(question)} number={index + 1} showSpaces={showSpaces} answerSpaceOverrides={answerSpaces} diagramWidthOverrides={diagramWidths} compact={true} onSpaceResize={(nodeId, value) => setSpace(nodeId, value)} onDiagramResize={(diagramId, value) => setDiagramWidth(diagramId, value)} />
                </section>
                {#if pageBreakAfter(index)}<div class="page-break-indicator">Page break</div>{/if}
                </div>
              {/each}
              {#if showShortAnswers}<section class="answer-page"><h2>Short answers</h2>{#each selectedQuestions as question, index (question.id)}<PracticeQuestionRenderer question={worksheetQuestion(question)} number={index + 1} showSpaces={false} showShortAnswers={true} diagramWidthOverrides={diagramWidths} />{/each}</section>{/if}
              {#if showWorkedSolutions}<section class="answer-page"><h2>Worked solutions</h2>{#each selectedQuestions as question, index (question.id)}<PracticeQuestionRenderer question={worksheetQuestion(question)} number={index + 1} showSpaces={false} showWorkedSolutions={true} diagramWidthOverrides={diagramWidths} />{/each}</section>{/if}
            {:else}<div class="empty-preview"><strong>Select questions to begin</strong></div>{/if}
          </article>
        </aside>
      {/if}
    </div>

  {/if}
</div>

{#if editingQuestion}
  <div class="editor-modal-backdrop" role="presentation" onclick={(event) => { if (event.target === event.currentTarget) editingQuestion = null; }}>
    <dialog open class="editor-modal" aria-label={'Edit ' + editingQuestion.id}>
      <PracticeQuestionEditor question={editingQuestion} heading={'Edit question ' + editingQuestion.id} onSave={saveEditedQuestion} onCancel={() => (editingQuestion = null)} />
    </dialog>
  </div>
{/if}

<style>
  .question-card__solution { border-top:1px solid var(--color-border, #dfe4ea); margin:0 .75rem; }
  .question-card__solution > summary { padding:.4rem 0; cursor:pointer; font-weight:600; font-size:.85rem; color:var(--md-green, #15803d); user-select:none; list-style:none; }
  .question-card__solution > summary::-webkit-details-marker { display:none; }
  .question-card__solution > summary:hover { text-decoration:underline; }
  .question-card__solution > summary:focus-visible { outline:2px solid var(--color-accent, #2563eb); outline-offset:2px; border-radius:3px; }
  .question-card__solution-content { padding:.5rem 0 .75rem; line-height:1.7; font-size:.9rem; overflow-x:auto; }
  /* Bank solutions use a white paper surface in either application theme. */
  .question-card__solution-content { background:#fff; color:#24282d; }
  .question-card__solution-content :global(.tikz-wrap svg) { filter:none!important; }
  .questions-grid .question-card__body { background:#fff; }
  .questions-grid .question-card__body :global(.practice-question) { color:#24282d; }
  .studio-shell { min-height: calc(100dvh - 70px); padding: 2rem 1.5rem 4rem; background: var(--app-canvas, #f8fafc); color: var(--text, #1e293b); font-family: 'Nunito', system-ui, -apple-system, 'Segoe UI', sans-serif; }
  .studio-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
  .studio-header { max-width: 1400px; margin: 0 auto 1.25rem; }

  .workspace-tabs { display: flex; gap: .2rem; max-width: 1400px; margin: 0 auto 1rem; border-bottom: 1px solid var(--border, #d9e0e8); }
  .workspace-tabs button { padding: .65rem .85rem; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--muted, #66758d); font: inherit; font-size: .8rem; cursor: pointer; }
  .workspace-tabs button.active { border-color: var(--accent, #e8443a); color: var(--text-strong, #23395d); font-weight: 800; }


  .status-bar { display: flex; gap: .6rem; max-width: 1400px; margin: 0 auto 1rem; padding: .65rem .8rem; border: 1px solid #bdd8c8; border-radius: 6px; background: #f2fbf5; color: #236543; font-size: .76rem; }
  .status-bar.has-error { border-color: #e5b7a7; background: #fff8f5; color: #99472c; }
  .filter-bar { display: grid; grid-template-columns: minmax(240px, 1.45fr) repeat(4, minmax(150px, 1fr)); gap: .75rem 1rem; max-width: 1400px; margin: 0 auto 1.25rem; padding: 1.15rem 1.25rem; align-items: end; }
  label { color: var(--text, #1e293b); font-size: .8rem; font-weight: 600; letter-spacing: .02em; }
  input, select { box-sizing: border-box; width: 100%; min-height: 40px; margin-top: .35rem; padding: .5rem .75rem; border: 1px solid var(--border, #e2e8f0); border-radius: 8px; background: var(--panel, #fff); color: var(--text, #1e293b); font: inherit; font-size: .875rem; transition: border-color 200ms ease, box-shadow 200ms ease; }
  input:focus, select:focus { outline: none; border-color: var(--accent, #f87171); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent, #f87171) 24%, transparent); }
  button { font: inherit; cursor: pointer; }
  button:disabled { cursor: not-allowed; opacity: .5; }






  .badge { display: inline-flex; align-items: center; padding: .25rem .45rem; border-radius: 999px; background: #edf2f7; color: var(--text-strong, #23395d); font-size: .63rem; font-weight: 800; white-space: nowrap; }

  .question-card { overflow: hidden; border: 1px solid var(--border, #e2e8f0); border-radius: 12px; background: var(--panel, #fff); box-shadow: 0 2px 10px rgba(15, 23, 42, .06); transition: border-color 200ms ease, box-shadow 200ms ease; }
  .question-card:hover { border-color: color-mix(in srgb, var(--accent, #f87171) 24%, var(--border, #e2e8f0)); box-shadow: 0 10px 28px rgba(15, 23, 42, .11); }
  .question-card summary { display: flex; align-items: center; gap: .75rem; padding: .55rem .8rem; list-style: none; cursor: pointer; user-select: none; transition: background 200ms ease; }
  .question-card summary:hover { background: color-mix(in srgb, var(--accent, #f87171) 6%, transparent); }
  .question-card summary::-webkit-details-marker { display: none; }
  .empty-bank { padding: 1rem .2rem; }
  .a4-preview { width: min(100%, 210mm); min-height: 297mm; box-sizing: border-box; margin: 0 auto; padding: 15mm 14mm; background: #fff; color: #172033; box-shadow: 0 8px 30px rgba(35, 57, 93, .12); }
  .worksheet-header { padding-bottom: 5mm; border-bottom: 0; }
  .worksheet-header h2 { margin: 1mm 0; color: #23395d; font-size: 18pt; }
  .preview-question { position: relative; margin-top: 7mm; padding-top: 0; border-top: 0; break-inside: avoid; will-change: transform; }
  .preview-question-tools { display: flex; align-items: center; gap: .3rem; margin-bottom: 2mm; color: #66758d; font-size: .64rem; }
  .drag-handle { margin-right: auto; cursor: grab; }
  .preview-number { color: #23395d; font-weight: 800; }
  .layout-controls { display: flex; flex-wrap: wrap; align-items: center; gap: .45rem; margin-bottom: 2mm; color: #66758d; font-size: .62rem; }
  .layout-controls label { display: inline-flex; align-items: center; gap: .25rem; }
  .layout-controls select { width: auto; min-width: 84px; margin: 0; padding: .25rem; font-size: .63rem; }
  .page-break-indicator { margin: 5mm 0; border-top: 1px dashed #c9d3df; color: #8793a2; font-size: 7pt; text-align: center; break-after: avoid; }
  .empty-preview { display: grid; place-items: center; gap: .35rem; min-height: 120px; padding: 2rem; color: var(--muted, #66758d); text-align: center; }
  .empty-preview strong { color: var(--text-strong, #23395d); }


































  .editor-modal-backdrop { position: fixed; z-index: 20; inset: 0; display: grid; place-items: center; padding: 1rem; background: rgba(18, 31, 51, .42); }
  .editor-modal { width: min(1080px, 100%); max-height: calc(100dvh - 2rem); overflow: auto; padding: 1rem; border-radius: 9px; background: var(--panel, #fff); box-shadow: 0 18px 70px rgba(18, 31, 51, .28); }
  @media (max-width: 1120px) {
    .filter-bar { grid-template-columns: repeat(3, minmax(130px, 1fr)); }
  }
  @media (max-width: 800px) {
    .studio-header { flex-direction: column; }



    .filter-bar { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 520px) {
    .studio-shell { padding-inline: .65rem; }
    .filter-bar { grid-template-columns: 1fr; }
    .a4-preview { padding: 10mm 8mm; }
  }
  @media print {
    :global(nav.top), :global(footer.site-footer), :global(nav.mobile-nav) { display: none !important; }
    .studio-shell { padding: 0; background: #fff; }
    .studio-header, .workspace-tabs, .status-bar, .filter-bar, .page-break-indicator { display: none !important; }
    .a4-preview { width: 210mm; min-height: 297mm; margin: 0; padding: 14mm; box-shadow: none; }
    .preview-question-tools, .layout-controls { display: none; }
    .preview-question { border-top: 0; margin-top: 5mm; padding-top: 0; }
    .answer-page { break-before: page; }
  }

  /* MathsDatabase worksheet parity */
  .studio-shell{--md-card:var(--panel,#fff);--md-text:var(--text,#1e293b);--md-strong:var(--text-strong,#1e293b);--md-muted:var(--muted,#64748b);--md-border:var(--border,#e2e8f0);--md-accent:var(--accent,#f87171);--md-green:var(--success,#10b981);padding-top:1.25rem}
  .sr-only{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
  .studio-header{align-items:center;margin-bottom:.6rem;padding:0 1.5rem}.studio-header strong{color:var(--md-strong);font-size:1.05rem}.workspace-tabs{padding:0 1.5rem}.status-bar{max-width:calc(1400px - 3rem);font-weight:600}
  .filter-bar{display:flex;max-width:calc(1400px - 3rem);padding:1.15rem 1.25rem;flex-direction:column;align-items:stretch;gap:.75rem;border:1px solid var(--md-border);border-radius:12px;background:var(--md-card);box-shadow:0 2px 10px #0f172a0f}.filter-bar--pending{border-color:color-mix(in srgb,var(--md-accent) 45%,var(--md-border))}.filter-bar__row,.filter-row{display:flex;align-items:center;flex-wrap:wrap;gap:.45rem}.filter-row__label{margin-right:.2rem;color:var(--md-strong);font-size:.84rem;font-weight:800}
  .chip{min-height:32px;padding:.35rem .85rem;border:1.5px solid var(--md-border);border-radius:999px;background:var(--md-card);color:var(--md-text);font-size:.8rem;font-weight:700}.chip:hover{border-color:var(--md-green)}.chip.chip--active{border-color:var(--md-green);background:color-mix(in srgb,var(--md-green) 12%,var(--md-card));color:color-mix(in srgb,var(--md-green) 75%,var(--md-text))}
  .taxonomy-picker{position:relative}.taxonomy-picker>summary{list-style:none}.taxonomy-picker>summary::-webkit-details-marker{display:none}.taxonomy-picker.disabled{pointer-events:none;opacity:.5}.topic-picker-btn{display:inline-flex;min-height:40px;padding:.6rem 1.4rem;align-items:center;border:1px solid var(--md-accent);border-radius:8px;background:var(--md-accent);color:#fff;font-size:.88rem;font-weight:800;cursor:pointer}.taxonomy-picker__popover{position:absolute;z-index:200;top:calc(100% + .45rem);left:0;display:grid;width:min(760px,calc(100vw - 3rem));padding:.8rem;grid-template-columns:repeat(3,minmax(0,1fr));gap:.7rem;border:1px solid var(--md-border);border-radius:10px;background:var(--md-card);box-shadow:0 14px 35px #0f172a29}.taxonomy-picker__popover label{color:var(--md-text);font-size:.75rem;font-weight:700}
  .filter-bar input[type=number],.filter-bar select{box-sizing:border-box;width:100%;min-height:40px;margin-top:.3rem;padding:.48rem .68rem;border:1px solid var(--md-border);border-radius:8px;background:var(--md-card);color:var(--md-text);font:inherit;font-size:.84rem}.filter-bar__row--controls{align-items:end;gap:.75rem}.filter-row--search{flex:1 1 360px}.filter-bar__search{margin:0!important}.filter-group--props{flex:2 1 500px;align-items:end}.reasoning-filter{display:flex;flex:1.35 1 220px;min-height:40px;align-items:center;gap:.4rem;color:var(--md-muted);font-size:.75rem;font-weight:700}.reasoning-filter input{width:70px!important;min-height:36px!important;margin:0!important}
  .active-filters{display:flex;align-items:center;flex-wrap:wrap;gap:.35rem}.active-filters__label{color:var(--md-muted);font-size:.75rem;font-weight:800}.active-filter{display:inline-flex;min-height:28px;padding:.2rem .25rem .2rem .55rem;align-items:center;gap:.25rem;border-radius:999px;background:color-mix(in srgb,var(--md-green) 10%,var(--md-card));font-size:.73rem}.active-filter__remove{width:23px;height:23px;min-height:0;margin:0;padding:0;border:0;border-radius:50%;background:transparent;color:var(--md-muted)}.filter-bar__apply-row{display:flex;padding-top:.7rem;align-items:center;justify-content:flex-end;gap:.5rem;border-top:1px solid var(--md-border)}.apply-reminder{margin-right:auto;color:var(--md-muted);font-size:.73rem}
  .btn{display:inline-flex;min-height:40px;padding:.5rem 1rem;align-items:center;justify-content:center;border-radius:8px;font-size:.875rem;font-weight:700;line-height:1}.btn--small{min-height:32px;padding:.38rem .65rem;font-size:.76rem}.btn--secondary{border:1px solid var(--md-border);background:var(--md-card);color:var(--md-text)}.btn--success{border:1px solid var(--md-green);background:var(--md-green);color:#fff}.btn--toggle.active{border-color:var(--md-green);background:color-mix(in srgb,var(--md-green) 12%,var(--md-card));color:var(--md-text)}.btn-link{min-height:32px;padding:.35rem .45rem;border:0;background:transparent;color:#ef4444;font-size:.75rem;font-weight:700}
  .worksheet-controls{position:sticky;z-index:90;top:.5rem;display:flex;max-width:calc(1400px - 3rem);margin:0 auto 1.25rem;padding:.7rem .9rem;flex-direction:column;gap:.55rem;border:1px solid var(--md-border);border-radius:12px;background:color-mix(in srgb,var(--md-card) 96%,transparent);box-shadow:0 5px 20px #0f172a1a;backdrop-filter:blur(10px)}.worksheet-counts-row{display:flex;align-items:center;gap:.6rem}.results-count{color:var(--md-muted);font-size:.75rem;font-weight:700}.selection-summary{margin-left:auto;color:var(--md-strong)}.worksheet-action-row{display:flex;align-items:center;flex-wrap:wrap;gap:.45rem}.control-group{position:relative;display:flex;align-items:center;gap:.3rem;padding-left:.7rem}.control-group:first-child{padding-left:0}.control-group:not(:first-child)::before{position:absolute;left:0;width:1px;height:26px;background:var(--md-border);content:''}.expand-dropdown{position:relative}.expand-dropdown>summary{list-style:none}.expand-dropdown>summary::-webkit-details-marker{display:none}.expand-dropdown__menu{position:absolute;z-index:120;top:calc(100% + .35rem);left:0;display:grid;min-width:150px;padding:.3rem;border:1px solid var(--md-border);border-radius:8px;background:var(--md-card);box-shadow:0 10px 25px #0f172a24}.expand-dropdown__item{padding:.5rem .6rem;border:0;border-radius:6px;background:transparent;color:var(--md-text);font-size:.78rem;text-align:left}.btn--print{margin-left:auto}.mobile-view-toggle{display:none}
  .worksheet-layout{display:block;max-width:1400px;margin:0 auto;padding:0 1.5rem}.worksheet-layout--split{display:grid;width:max-content;max-width:none;grid-template-columns:minmax(520px,794px) 794px;gap:2rem;align-items:start}.questions-col{min-width:0}.questions-grid{display:flex;flex-direction:column;gap:.35rem}.question-row{display:grid;grid-template-columns:28px minmax(0,1fr);align-items:start;gap:.5rem}.question-row__checkbox{display:grid;padding-top:.95rem;place-items:center}.question-row__checkbox input{box-sizing:border-box;width:1.35rem!important;height:1.35rem!important;min-height:0!important;margin:0!important;padding:0!important;accent-color:var(--md-green);cursor:pointer}
  .question-card{min-width:0;overflow:hidden;border:1px solid var(--md-border);border-radius:12px;background:var(--md-card);box-shadow:0 2px 8px #0f172a0e}.question-card:hover{border-color:color-mix(in srgb,var(--md-accent) 38%,var(--md-border))}.question-card--selected{border-color:var(--md-green);background:color-mix(in srgb,var(--md-green) 5%,var(--md-card))}.question-card__collapsible>summary{list-style:none}.question-card__collapsible>summary::-webkit-details-marker{display:none}.question-card__summary{position:relative;display:flex;min-height:58px;padding:.72rem 2.25rem .72rem .9rem;align-items:center;cursor:pointer}.question-card__summary::after{position:absolute;top:50%;right:.9rem;width:10px;height:10px;border-right:2px solid var(--md-muted);border-bottom:2px solid var(--md-muted);content:'';transform:translateY(-65%) rotate(45deg)}.question-card__collapsible[open] .question-card__summary::after{transform:translateY(-35%) rotate(225deg)}.question-card__collapsible[open] .question-card__summary{border-bottom:1px solid var(--md-border)}
  .question-card__rows{display:grid;min-width:0;flex:1;gap:.35rem}.question-card__row{display:flex;min-width:0;align-items:center;justify-content:space-between;gap:.7rem}.question-card__meta,.question-card__meta-right{display:flex;min-width:0;align-items:center;flex-wrap:wrap;gap:.3rem}.question-card__meta-right{flex:none;justify-content:flex-end}.question-card .badge{display:inline-flex;max-width:360px;min-height:24px;padding:.22rem .48rem;align-items:center;overflow:hidden;border-radius:5px;background:color-mix(in srgb,var(--md-text) 7%,var(--md-card));color:var(--md-muted);font-size:.68rem;font-weight:700;line-height:1.2;text-overflow:ellipsis;white-space:nowrap}.badge--stage{background:color-mix(in srgb,#3b82f6 10%,var(--md-card))!important}.badge--topic{background:color-mix(in srgb,var(--md-accent) 9%,var(--md-card))!important}.badge--reasoning{background:color-mix(in srgb,var(--md-text) 7%,var(--md-card))!important;color:var(--md-muted)!important}.badge--skill{background:color-mix(in srgb,#0ea5e9 9%,var(--md-card))!important;color:var(--md-text)!important}.badge--difficulty{background:color-mix(in srgb,var(--md-green) 10%,var(--md-card))!important;color:var(--md-green)!important;text-transform:capitalize}
  .id-copy-btn{max-width:110px;min-height:24px;padding:.24rem .4rem;overflow:hidden;border:1px solid transparent;border-radius:5px;background:transparent;color:var(--md-muted);font:.65rem ui-monospace,Consolas,monospace;text-overflow:ellipsis;white-space:nowrap}.question-card__body{padding:1rem 1.1rem;overflow-x:auto;color:var(--md-text)}.question-card__body :global(.practice-question){color:var(--md-text)}.question-card__footer{display:flex;padding:.65rem .9rem;align-items:center;justify-content:space-between;gap:.75rem;border-top:1px solid var(--md-border);color:var(--md-muted);font-size:.73rem}.question-card__footer{justify-content:flex-end}.question-card__footer>div{display:flex;align-items:center;gap:.35rem}.empty-bank{padding:2rem;color:var(--md-muted);text-align:center}
  .worksheet-preview-outer{position:relative;overflow-x:auto;width:794px;max-width:100%}.worksheet-preview-close{position:absolute;z-index:3;top:.3rem;right:.3rem;width:32px;height:32px;min-height:0;padding:0;border:1px solid var(--md-border);border-radius:50%;background:var(--md-card);color:var(--md-muted);font-size:1.15rem}.a4-preview{width:210mm}.editor-modal-backdrop{position:fixed!important;z-index:300;inset:0!important;display:flex!important;align-items:flex-start!important;justify-content:center!important;overflow-y:auto!important;padding:clamp(.75rem,3vh,2rem)!important}.editor-modal{position:relative!important;width:min(1500px,calc(100vw - 2rem))!important;max-height:none!important;margin:0!important}
  @media(max-width:1100px){.worksheet-layout--split{width:auto;max-width:1400px;grid-template-columns:minmax(0,1fr)}.worksheet-preview-outer{position:static;margin:0 auto}}
  @media(max-width:800px){.taxonomy-picker__popover{position:fixed;top:20%;left:1rem;width:calc(100vw - 2rem);grid-template-columns:1fr}.worksheet-controls{position:static}.control-group{width:100%;padding:.4rem 0 0;flex-wrap:wrap}.control-group:not(:first-child)::before{top:0;width:100%;height:1px}.btn--print{margin-left:0}.mobile-view-toggle{display:flex}.mobile-view-toggle button{flex:1;padding:.5rem;border:1px solid var(--md-border);background:var(--md-card);color:var(--md-muted)}.mobile-view-toggle button.is-active{border-color:var(--md-green);background:color-mix(in srgb,var(--md-green) 10%,var(--md-card))}.worksheet-layout.mobile-show-preview .questions-col{display:none}.worksheet-layout:not(.mobile-show-preview) .worksheet-preview-outer{display:none}}
  @media(max-width:560px){.studio-header, .workspace-tabs, .worksheet-layout{padding-right:.7rem;padding-left:.7rem}.filter-bar,.worksheet-controls,.status-bar{max-width:calc(100% - 1.4rem)}.filter-bar__row--controls,.filter-group--props{align-items:stretch;flex-direction:column}.filter-row--search,.filter-group--props,.reasoning-filter{width:100%;flex-basis:auto}.filter-bar__apply-row{align-items:stretch;flex-direction:column}.apply-reminder{margin:0}.question-card__row,.question-card__footer{align-items:flex-start;flex-direction:column}}
  @media print{.studio-shell{padding:0!important;min-height:0!important}.studio-header,.workspace-tabs,.status-bar,.filter-bar,.worksheet-controls,.questions-col,.worksheet-preview-close,.page-break-indicator{display:none!important}.worksheet-layout,.worksheet-layout--split{display:block;width:auto;max-width:none;margin:0;padding:0}.worksheet-preview-outer{position:static;display:block!important;width:auto;max-width:none;margin:0}.a4-preview{width:210mm}.preview-question-tools,.layout-controls{display:none}}


  .worksheet-header__title-row{display:inline-flex;align-items:center;gap:.35rem}
  .worksheet-header__editable-title{min-width:12rem;margin:0;color:#1e293b;font-size:18pt;outline:none;cursor:text;border:1.5px dashed var(--md-accent,#f87171);border-radius:3px;padding:1px 4px}
  .worksheet-header__editable-title:hover{box-shadow:0 0 0 1px var(--md-accent,#f87171)}
  .worksheet-header__editable-title:focus{box-shadow:0 0 0 2px var(--md-accent,#f87171);background:#fff}
  .worksheet-header__editable-title:empty::before{content:attr(data-placeholder);opacity:.4}
  .worksheet-header__title-edit{display:inline-flex;width:1.6rem;height:1.6rem;min-height:0;padding:0;align-items:center;justify-content:center;border:0;border-radius:4px;background:transparent;color:var(--md-accent,#f87171);font-size:1rem;opacity:.55}
  .worksheet-header__title-row:hover .worksheet-header__title-edit,.worksheet-header__title-edit:focus-visible{opacity:1}
  .preview-question.manual-order-item{cursor:grab}
  @media print{.worksheet-header__editable-title{border-color:transparent;box-shadow:none!important}.worksheet-header__title-edit{display:none!important}}
  .studio-shell.project-workspace{padding:0;overflow-x:clip}.project-workspace>.studio-header{display:none}.project-workspace>.workspace-tabs{max-width:none;margin:0;padding:4px 16px;flex-wrap:wrap}.project-workspace>.workspace-tabs button{font-size:14px;min-height:36px}@media(max-width:600px){.project-workspace>.workspace-tabs{padding:4px 8px}.project-workspace>.workspace-tabs button{min-height:44px}}
</style>
