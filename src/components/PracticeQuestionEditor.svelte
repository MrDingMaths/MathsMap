<script>
  import { DIFFICULTIES, allNodes, deepCopy, invalidateApproval, markApproved, normaliseQuestion, validateQuestion } from '../lib/practice-question-model.js';
  import { skills } from '../lib/data.js';
  import PracticeQuestionRenderer from './PracticeQuestionRenderer.svelte';

  let { question, onSave = null, onCancel = null, heading = 'Edit question' } = $props();
  const initialDraft = (value) => deepCopy(value);
  let draft = $state({
    id: '',
    title: '',
    classification: { primarySkillId: '', secondarySkillIds: [], reasoningScore: 0, difficulty: 'Foundation', difficultyReason: '' },
    content: { id: '', type: 'question', prompt: '', layout: 'list', columns: null, questionDiagrams: [], children: [] },
  });
  $effect(() => {
    if (!draft.id && question) draft = initialDraft(question);
  });
  let saveError = $state('');
  const skillIds = new Set(skills.map((skill) => skill.id));
  const check = $derived(validateQuestion(draft, { skillIds }));

  const copy = () => deepCopy(draft);
  function edit(mutator) {
    const next = copy();
    mutator(next);
    draft = invalidateApproval(next, 'edited');
  }
  function updateQuestionField(field, value) {
    edit((next) => { next[field] = value; });
  }
  function updateClassification(field, value) {
    edit((next) => { next.classification[field] = value; });
  }
  function nodeById(root, id) {
    return allNodes(root).find((node) => node.id === id);
  }
  function parentOf(root, id) {
    if (!root?.children?.length) return null;
    for (const child of root.children) {
      if (child.id === id) return root;
      const parent = parentOf(child, id);
      if (parent) return parent;
    }
    return null;
  }
  function nextLabel(parent, type = 'part') {
    const used = new Set((parent.children ?? []).map((child) => String(child.label ?? '')));
    if (type === 'group') return 'new-group';
    for (let index = 0; index < 26; index += 1) {
      const label = String.fromCharCode(97 + index);
      if (!used.has(label)) return label;
    }
    return 'part-' + ((parent.children?.length ?? 0) + 1);
  }
  function blankPart(label) {
    return { id: 'node-' + crypto.randomUUID(), type: 'part', label, prompt: '', layout: 'list', columns: null, questionDiagrams: [], children: [], answer: { short: null, worked: 'Add the worked answer.', solutionDiagrams: [] }, answerSpaceMm: null };
  }
  function blankGroup(label) {
    return { id: 'node-' + crypto.randomUUID(), type: 'group', label, prompt: '', layout: 'list', columns: null, questionDiagrams: [], children: [blankPart('a') ] };
  }
  function addChild(parentId, type) {
    edit((next) => {
      const parent = nodeById(next.content, parentId);
      if (!parent) return;
      parent.children ??= [];
      parent.children.push(type === 'group' ? blankGroup(nextLabel(parent, 'group')) : blankPart(nextLabel(parent)));
      if (parent.type === 'part') parent.type = 'group';
    });
  }
  function removeNode(nodeId) {
    edit((next) => {
      const parent = parentOf(next.content, nodeId);
      if (!parent) return;
      parent.children = parent.children.filter((child) => child.id !== nodeId);
      if (!parent.children.length && parent.type === 'group') {
        parent.type = 'part';
        parent.answer = { short: null, worked: 'Add the worked answer.', solutionDiagrams: [] };
      }
    });
  }
  function moveNode(nodeId, delta) {
    edit((next) => {
      const parent = parentOf(next.content, nodeId);
      if (!parent) return;
      const index = parent.children.findIndex((child) => child.id === nodeId);
      const nextIndex = index + delta;
      if (nextIndex < 0 || nextIndex >= parent.children.length) return;
      [parent.children[index], parent.children[nextIndex]] = [parent.children[nextIndex], parent.children[index]];
    });
  }
  function setNode(nodeId, field, value) {
    edit((next) => {
      const node = nodeById(next.content, nodeId);
      if (!node) return;
      if (field.startsWith('answer.')) {
        node.answer = { ...node.answer, [field.slice(7)]: value };
      } else node[field] = value;
    });
  }
  function setNodeLayout(nodeId, value) {
    setNode(nodeId, 'layout', value === 'list' ? 'list' : 'grid');
    if (value !== 'list') setNode(nodeId, 'columns', Number(value.split(':')[1]));
    else setNode(nodeId, 'columns', null);
  }
  function setDiagram(nodeId, diagramId, field, value) {
    edit((next) => {
      const node = nodeById(next.content, nodeId);
      const diagram = [...(node?.questionDiagrams ?? []), ...(node?.answer?.solutionDiagrams ?? [])].find((item) => item.id === diagramId);
      if (diagram) diagram[field] = field === 'widthMm' ? Math.max(25, Math.min(190, Number(value) || 95)) : value;
    });
  }
  function removeDiagram(nodeId, diagramId) {
    edit((next) => {
      const node = nodeById(next.content, nodeId);
      if (!node) return;
      node.questionDiagrams = (node.questionDiagrams ?? []).filter((diagram) => diagram.id !== diagramId);
      if (node.answer) node.answer.solutionDiagrams = (node.answer.solutionDiagrams ?? []).filter((diagram) => diagram.id !== diagramId);
    });
  }
  function saveDraft() {
    saveError = '';
    if (onSave) onSave(normaliseQuestion(draft));
  }
  function saveApproved() {
    try {
      saveError = '';
      if (onSave) onSave(markApproved(draft, { approvedBy: 'Booklet Studio' }));
    } catch (error) {
      saveError = error.message;
    }
  }
</script>

<section class="structured-editor" aria-label={heading}>
  <header class="editor-header"><div><h3>{heading}</h3></div><span class="editor-id">{draft.id}</span></header>

  <div class="editor-workspace">
    <div class="editor-form">
  <div class="editor-fields">
    <label>Title<input value={draft.title} oninput={(event) => updateQuestionField('title', event.currentTarget.value)} /></label>
    <label>Primary skill<select value={draft.classification.primarySkillId} onchange={(event) => updateClassification('primarySkillId', event.currentTarget.value)}>{#each skills as skill}<option value={skill.id}>{skill.title}</option>{/each}</select></label>
    <label>Reasoning score (0–100)<input type="number" min="0" max="100" value={draft.classification.reasoningScore} oninput={(event) => updateClassification('reasoningScore', event.currentTarget.value)} /></label>
    <label class="wide">Secondary skills<input value={draft.classification.secondarySkillIds.join(', ')} oninput={(event) => updateClassification('secondarySkillIds', event.currentTarget.value.split(',').map((value) => value.trim()).filter(Boolean))} /></label>
    <label class="wide">Difficulty reasoning<textarea rows="2" value={draft.classification.difficultyReason} oninput={(event) => updateClassification('difficultyReason', event.currentTarget.value)}></textarea></label>
    <div class="derived-band"><span>Derived band</span><strong>{draft.classification.difficulty}</strong></div>
  </div>

  <div class="tree-editor">
    {#each allNodes(draft.content) as node, index (node.id)}
      <article class:parent-node={node.children?.length} class="node-edit">
        <div class="node-edit-title"><span>{node.type} {node.label ? '(' + node.label + ')' : index === 0 ? 'stem' : 'node ' + index}</span><span class="node-actions">{#if node.id !== draft.content.id}<button class="tiny" onclick={() => moveNode(node.id, -1)}>Up</button><button class="tiny" onclick={() => moveNode(node.id, 1)}>Down</button><button class="danger tiny" onclick={() => removeNode(node.id)}>Remove</button>{/if}</span></div>
        <div class="node-fields">
          <label>Label<input value={node.label ?? ''} placeholder="a / i / context" oninput={(event) => setNode(node.id, 'label', event.currentTarget.value || null)} /></label>
          <label class="node-layout">Layout<select value={node.children?.length ? (node.layout === 'grid' ? 'grid:' + node.columns : 'list') : 'list'} onchange={(event) => setNodeLayout(node.id, event.currentTarget.value)} disabled={!node.children?.length}><option value="list">List</option><option value="grid:2">2 columns</option><option value="grid:3">3 columns</option><option value="grid:4">4 columns</option></select></label>
        </div>
        <label>Prompt / context<textarea rows={node.children?.length ? 2 : 3} value={node.prompt} oninput={(event) => setNode(node.id, 'prompt', event.currentTarget.value)}></textarea></label>
        {#if node.children?.length}
          <div class="child-actions"><button class="secondary tiny" onclick={() => addChild(node.id, 'part')}>Add part</button><button class="secondary tiny" onclick={() => addChild(node.id, 'group')}>Add group</button><span>{node.children.length} child node(s)</span></div>
        {:else}
          <div class="answer-fields"><label>Short answer<textarea rows="2" value={node.answer?.short ?? ''} oninput={(event) => setNode(node.id, 'answer.short', event.currentTarget.value || null)}></textarea></label><label>Worked answer<textarea rows="4" value={node.answer?.worked ?? ''} oninput={(event) => setNode(node.id, 'answer.worked', event.currentTarget.value)}></textarea></label><label>Answer space (mm)<input type="number" min="0" max="180" value={node.answerSpaceMm ?? ''} oninput={(event) => setNode(node.id, 'answerSpaceMm', event.currentTarget.value === '' ? null : event.currentTarget.value)} /></label></div>
        {/if}
        {#each [...(node.questionDiagrams ?? []), ...(node.answer?.solutionDiagrams ?? [])] as diagram (diagram.id)}
          <div class="diagram-fields"><span>{diagram.role} diagram</span><label>Width mm<input type="number" min="25" max="190" value={diagram.widthMm} oninput={(event) => setDiagram(node.id, diagram.id, 'widthMm', event.currentTarget.value)} /></label><label>Role<select value={diagram.role} onchange={(event) => setDiagram(node.id, diagram.id, 'role', event.currentTarget.value)}><option value="question">Question</option><option value="solution">Solution</option><option value="solution-overlay">Overlay</option></select></label><label class="diagram-src">Asset / TikZ<textarea rows="2" value={diagram.src ?? diagram.code ?? ''} oninput={(event) => setDiagram(node.id, diagram.id, diagram.src ? 'src' : 'code', event.currentTarget.value)}></textarea></label><button class="danger tiny" onclick={() => removeDiagram(node.id, diagram.id)}>Remove diagram</button></div>
        {/each}
      </article>
    {/each}
  </div>

  {#if saveError}<div class="editor-errors"><strong>{saveError}</strong></div>{/if}
  {#if check.errors.length}<div class="editor-errors"><strong>Cannot publish yet</strong><ul>{#each check.errors as item}<li>{item}</li>{/each}</ul></div>{/if}
  <footer class="editor-actions"><button class="secondary" onclick={onCancel}>Cancel</button><span></span><button class="secondary" onclick={saveDraft}>Save draft</button><button class="primary" onclick={saveApproved} disabled={check.errors.length > 0}>Save and approve</button></footer>
    </div>
    <aside class="editor-live-preview" aria-label="Live question preview">
      <div class="preview-pane__label">Live preview</div>
      <div class="editor-live-preview__pane"><PracticeQuestionRenderer question={draft} showSpaces={false} compact={true} /></div>
      <div class="preview-pane__label">Short answer</div>
      <div class="editor-live-preview__pane"><PracticeQuestionRenderer question={draft} showSpaces={false} showShortAnswers={true} compact={true} /></div>
      <div class="preview-pane__label">Worked solution</div>
      <div class="editor-live-preview__pane"><PracticeQuestionRenderer question={draft} showSpaces={false} showWorkedSolutions={true} compact={true} /></div>
    </aside>
  </div>
</section>

<style>
  .structured-editor { display: grid; gap: .8rem; }
  .editor-workspace { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(360px, .8fr); gap: 1rem; align-items: start; }
  .editor-form { display: grid; min-width: 0; gap: .8rem; }
  .editor-live-preview { position: sticky; top: 0; display: grid; min-width: 0; max-height: calc(100dvh - 5rem); padding: .8rem; overflow-y: auto; gap: .45rem; border: 1px solid #dce2e9; border-radius: 8px; background: #f8fafc; }
  .editor-live-preview__pane { min-height: 120px; padding: 1rem; overflow-x: auto; border: 1px solid #dce2e9; border-radius: 7px; background: #fff; color: #172033; }
  .preview-pane__label { margin-top: .35rem; color: #66758d; font-size: .7rem; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; }
  .editor-header { display: flex; justify-content: space-between; gap: .7rem; align-items: flex-start; }
  .editor-header h3 { margin: .12rem 0 .2rem; color: #23395d; font-size: 1.1rem; }
  .editor-header p { margin: 0; color: #66758d; font-size: .72rem; line-height: 1.45; }
  .editor-id { max-width: 240px; overflow: hidden; color: #66758d; font: .65rem ui-monospace, Consolas, monospace; text-overflow: ellipsis; white-space: nowrap; }
  .editor-fields { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 160px; gap: .55rem; }
  .editor-fields .wide { grid-column: 1 / -1; }
  .derived-band { display: grid; align-content: center; padding: .45rem .6rem; border: 1px solid #d6dce5; border-radius: 5px; background: #f8fafc; color: #66758d; font-size: .66rem; }
  .derived-band strong { color: #23395d; font-size: .9rem; }
  .tree-editor { display: grid; gap: .55rem; }
  .node-edit { display: grid; gap: .45rem; padding: .65rem; border: 1px solid #dce2e9; border-radius: 7px; background: #fbfcfe; }
  .node-edit.parent-node { border-left: 3px solid #7b9bc2; }
  .node-edit-title { display: flex; justify-content: space-between; gap: .5rem; color: #23395d; font-size: .7rem; font-weight: 800; }
  .node-actions { display: flex; gap: .25rem; }
  .node-fields, .answer-fields { display: grid; grid-template-columns: minmax(0, 1fr) 150px; gap: .45rem; }
  .answer-fields { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 140px; }
  .child-actions { display: flex; align-items: center; gap: .35rem; color: #66758d; font-size: .65rem; }
  .diagram-fields { display: grid; grid-template-columns: auto 95px 120px minmax(0, 1fr) auto; gap: .35rem; align-items: end; padding-top: .4rem; border-top: 1px solid #e1e6ec; color: #66758d; font-size: .65rem; }
  .diagram-fields > span { padding-bottom: .4rem; }
  .diagram-src { min-width: 0; }
  .editor-errors { padding: .55rem .7rem; border: 1px solid #e6b5a3; border-radius: 6px; background: #fff8f5; color: #9b4b2e; font-size: .7rem; }
  .editor-errors ul { margin: .3rem 0 0 1rem; padding: 0; }
  .editor-actions { display: flex; align-items: center; gap: .35rem; }
  .editor-actions span { flex: 1; }
  @media (max-width: 1000px) { .editor-workspace { grid-template-columns: 1fr; } .editor-live-preview { position: static; max-height: none; } }
  @media (max-width: 720px) { .editor-fields, .node-fields, .answer-fields, .diagram-fields { grid-template-columns: 1fr; } .editor-fields .wide { grid-column: auto; } .editor-id { max-width: 130px; } }
</style>
