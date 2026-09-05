<script>
  import { sourceRegionStyles } from '../lib/diagram-source-region.js';
  import InlineContent from './InlineContent.svelte';
  import EditableBookletText from './EditableBookletText.svelte';
  import Tikz from './Tikz.svelte';
  import { estimateAnswerSpaceMm, allDiagrams } from '../lib/practice-question-model.js';
  import { setoutMathChain } from '../lib/inline-content.js';
  import { isRewriteTableQuestion, shortAnswerDisplay } from '../lib/booklet-preview.js';

  let { question, number = null, showSpaces = true, showShortAnswers = false, showWorkedSolutions = false, compact = false, answerSpaceOverrides = {}, diagramWidthOverrides = {}, diagramColourModes = {}, onSpaceResize = null, onDiagramResize = null, showTitle = true, eagerDiagrams = false, editMode = false, onContentEdit = null, onContentRevert = null, onEditingChange = null, isEdited = () => false } = $props();
  const letter = (index) => String.fromCharCode(97 + index);
  const nodeLabel = (node, index, depth) => depth === 0 && number != null ? String(number) : node.label != null ? String(node.label) : node.children?.length ? '' : letter(index);
  const leafLabel = (path) => number == null ? path.join('') : [String(number), ...path].join('');
  const sourceDiagram = (id) => id ? allDiagrams(question).find((diagram) => diagram.id === id) : null;
  const spaceFor = (node) => node.responseSpace === 'scaffold' ? 0 : Number.isFinite(Number(answerSpaceOverrides[node.id])) ? answerSpaceOverrides[node.id] : estimateAnswerSpaceMm(node);
  const widthFor = (diagram) => Number.isFinite(Number(diagramWidthOverrides[diagram.id])) ? diagramWidthOverrides[diagram.id] : Number(diagram.widthMm) || 95;
  const clampSpace = (value) => Math.max(0, Math.min(180, Number(value) || 0));
  const clampWidth = (value) => Math.max(25, Math.min(190, Number(value) || 95));
  const canResizeDiagrams = () => Boolean(onDiagramResize && !showShortAnswers && !showWorkedSolutions);

  function resizeWithKeyboard(event, nodeId, space) {
    const delta = event.key === 'ArrowUp' ? -2 : event.key === 'ArrowDown' ? 2 : 0;
    if (!delta || !onSpaceResize) return;
    event.preventDefault();
    onSpaceResize(nodeId, clampSpace(space + delta));
  }
  function beginResize(event, nodeId, space) {
    if (!onSpaceResize || event.button !== 0) return;
    event.preventDefault();
    const preview = event.currentTarget.closest('.a4-preview');
    const scale = preview?.getBoundingClientRect().width / 210 || 3.78;
    const startY = event.clientY;
    const move = (moveEvent) => onSpaceResize(nodeId, clampSpace(space + (moveEvent.clientY - startY) / scale));
    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop, { once: true });
  }
  function resizeDiagramWithKeyboard(event, diagram) {
    const delta = event.key === 'ArrowLeft' ? -5 : event.key === 'ArrowRight' ? 5 : 0;
    if (!delta || !onDiagramResize) return;
    event.preventDefault();
    onDiagramResize(diagram.id, clampWidth(widthFor(diagram) + delta));
  }
  function beginDiagramResize(event, diagram) {
    if (!onDiagramResize || event.button !== 0) return;
    event.preventDefault();
    const preview = event.currentTarget.closest('.a4-preview');
    const scale = preview?.getBoundingClientRect().width / 210 || 3.78;
    const startX = event.clientX;
    const startWidth = widthFor(diagram);
    const move = (moveEvent) => onDiagramResize(diagram.id, clampWidth(startWidth + (moveEvent.clientX - startX) / scale));
    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop, { once: true });
  }
</script>

{#snippet diagramView(diagram, interactive = canResizeDiagrams())}
  {@const width = widthFor(diagram)}
  {#if diagram.overlayOf && sourceDiagram(diagram.overlayOf)}
    {@const source = sourceDiagram(diagram.overlayOf)}
    <div class="diagram-resize-shell" style={'width:' + width + 'mm'}>
      <div class="diagram-composite">
        {@render diagramView(source, false)}
        <div class="diagram-overlay">{@render diagramView({ ...diagram, overlayOf: null }, false)}</div>
      </div>
      {#if interactive}<button type="button" class="diagram-resize-handle" aria-label={'Resize diagram to ' + Math.round(width) + ' millimetres'} onpointerdown={(event) => beginDiagramResize(event, diagram)} onkeydown={(event) => resizeDiagramWithKeyboard(event, diagram)}></button>{/if}
    </div>
  {:else}
    <div class="diagram-resize-shell" style={'width:' + width + 'mm'}>
      {#if diagram.format === 'tikz' && diagram.code}
        <div class="diagram diagram-tikz"><Tikz code={diagram.code} eager={eagerDiagrams} /></div>
      {:else if diagram.src}
        {@const region = sourceRegionStyles(diagram.sourceRegion)}
        <figure class="diagram" style={region?.frame} class:grayscale={diagramColourModes[diagram.id] === 'grayscale'}><img style={region?.image} src={diagram.src} alt={diagram.alt ?? 'Mathematical diagram'} /></figure>
      {/if}
      {#if interactive}<button type="button" class="diagram-resize-handle" aria-label={'Resize diagram to ' + Math.round(width) + ' millimetres'} onpointerdown={(event) => beginDiagramResize(event, diagram)} onkeydown={(event) => resizeDiagramWithKeyboard(event, diagram)}></button>{/if}
    </div>
  {/if}
{/snippet}

{#snippet renderQuestionNode(node, depth = 0, index = 0)}
  {@const label = nodeLabel(node, index, depth)}
  {@const space = spaceFor(node)}
  <section class:part={depth > 0} class:numbered-root={depth === 0 && number != null} class:diagrams-first={node.diagramPlacement === 'before-prompt'} class:diagrams-beside={['beside-prompt','right-of-prompt'].includes(node.diagramPlacement)} class:diagrams-right={node.diagramPlacement === 'right-of-prompt'} class:compact class="question-node question-depth-{depth}" data-node-id={node.id}>
    {#if label || node.prompt}<div class="question-line">{#if label}<span class="part-label">{depth === 0 && number != null ? label : depth > 0 && label ? label : ''}</span>{/if}{#if node.prompt}<div class="prompt">{#if depth === 0 && showTitle && /^(?:NAPLAN|HSC)\b/i.test(question?.title ?? "")}<strong class="exam-label">{question.title}</strong>{/if}<EditableBookletText value={node.prompt} rootId={node.id} pointer="/prompt" {editMode} edited={isEdited(node.id, '/prompt')} oncommit={onContentEdit} onrevert={onContentRevert} oneditingchange={onEditingChange} /></div>{/if}</div>{/if}
    {#each node.questionDiagrams ?? [] as diagram}{@render diagramView(diagram)}{/each}
    {#if node.children?.length}
      <div class:question-grid={node.layout === 'grid'} class="parts" style={node.layout === 'grid' ? '--columns:' + node.columns : ''}>{#each node.children as child, childIndex}{@render renderQuestionNode(child, depth + 1, childIndex)}{/each}</div>
    {:else if showSpaces && space > 0}
      <div class="answer-space" class:boxed-response={node.answerSpaceStyle === 'box'} style={'height:' + space + 'mm'} role="button" tabindex="0" aria-label={'Answer space ' + Math.round(space) + ' millimetres; drag to resize'} onpointerdown={(event) => beginResize(event, node.id, space)} onkeydown={(event) => resizeWithKeyboard(event, node.id, space)}><span class="space-label">Answer space</span><span class="space-handle" aria-hidden="true"></span></div>
    {/if}
  </section>
{/snippet}

{#snippet renderAnswerNode(node, path = [], index = 0)}
  {@const nextPath = node.type === 'question' && path.length === 0 ? path : node.children?.length && node.label == null ? path : [...path, String(node.label ?? letter(index))]}
  {#if node.children?.length}
    <div class:question-grid={node.layout === 'grid'} class="answer-children" style={node.layout === 'grid' ? '--columns:' + Math.min(node.columns, showWorkedSolutions ? 2 : node.columns) : ''}>
      {#each node.children as child, childIndex}{@render renderAnswerNode(child, nextPath, childIndex)}{/each}
    </div>
  {:else}
    <article class="answer-item" data-node-id={node.id}><div class="answer-label">{leafLabel(nextPath)}</div><div class="answer-content">
      {#if showShortAnswers}{#if node.answer?.short}<EditableBookletText value={shortAnswerDisplay(node.answer.short)} rootId={node.id} pointer="/answer/short" {editMode} edited={isEdited(node.id, '/answer/short')} oncommit={onContentEdit} onrevert={onContentRevert} oneditingchange={onEditingChange} />{:else}<span class="muted">No short answer supplied.</span>{/if}{/if}
      {#if showShortAnswers}{#each node.answer?.solutionDiagrams ?? [] as diagram}{@render diagramView(diagram, false)}{/each}{/if}
      {#if showWorkedSolutions}<div class="worked-content">{#if node.answer?.worked}<EditableBookletText value={editMode ? node.answer.worked : setoutMathChain(node.answer.worked, { stackFirstTerm: true })} rootId={node.id} pointer="/answer/worked" {editMode} edited={isEdited(node.id, '/answer/worked')} oncommit={onContentEdit} onrevert={onContentRevert} oneditingchange={onEditingChange} />{/if}{#each node.answer?.solutionDiagrams ?? [] as diagram}{@render diagramView(diagram, false)}{/each}</div>{/if}
    </div></article>
  {/if}
{/snippet}

{#snippet renderRewriteTables()}
  <div class="rewrite-intro">{#if number != null}<strong>{number}</strong>{/if}<EditableBookletText value={question.content.prompt} rootId={question.content.id} pointer="/prompt" {editMode} edited={isEdited(question.content.id, '/prompt')} oncommit={onContentEdit} onrevert={onContentRevert} /></div>
  <div class="rewrite-tables">
    {#each [question.content.children.slice(0, Math.ceil(question.content.children.length / 2)), question.content.children.slice(Math.ceil(question.content.children.length / 2))] as rows}
      <table><thead><tr><th>Calculation</th><th>Rewritten</th></tr></thead><tbody>
        {#each rows as row, rowIndex}<tr><td><div class="rewrite-calculation"><b>{row.label ?? letter(rowIndex)}</b><EditableBookletText value={row.prompt} rootId={row.id} pointer="/prompt" {editMode} edited={isEdited(row.id, '/prompt')} oncommit={onContentEdit} onrevert={onContentRevert} oneditingchange={onEditingChange} /></div></td><td>
          {#if showShortAnswers && row.answer?.short}<InlineContent text={row.answer.short} />
          {:else if showWorkedSolutions && row.answer?.worked}<InlineContent text={setoutMathChain(row.answer.worked)} />
          {:else}<span class="rewrite-blank" aria-label="Write the rewritten calculation"></span>{/if}
        </td></tr>{/each}
      </tbody></table>
    {/each}
  </div>
{/snippet}

<div class:answer-key={showShortAnswers || showWorkedSolutions} class="practice-question" data-question-id={question?.id ?? ''}>
  {#if isRewriteTableQuestion(question)}
    {@render renderRewriteTables()}
  {:else if !(showShortAnswers || showWorkedSolutions)}
    {#if showTitle && question?.title && !/^(?:NAPLAN|HSC)\b/i.test(question.title)}<h3>{question.title}</h3>{/if}{#if question?.content}{@render renderQuestionNode(question.content, 0, 0)}{/if}
  {:else if question?.content}{@render renderAnswerNode(question.content)}{/if}
</div>

<style>
  .practice-question { --label-width: 8mm; --label-gap: 2mm; --type-meta:8pt; --type-body:11pt; box-sizing: border-box; color: #172033; font-family: 'Nunito', system-ui, -apple-system, 'Segoe UI', sans-serif; font-size: var(--type-body); line-height: 1.38; }
  .question-node { break-inside: avoid; margin: 0 0 2.2mm; }
  .practice-question > .question-node { break-inside: auto; }
  .question-node.part { margin: 1mm 0 1.5mm; }
  .question-node.diagrams-first { display:flex; flex-direction:column; position:relative; padding-top:4mm; }
  .diagrams-first > .question-line { order:1; }
  .diagrams-first > .answer-space { order:2; }
  .question-node.diagrams-beside { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,.8fr); gap:2mm; position:relative; padding-top:4mm; }
  .diagrams-beside > .question-line { grid-column:2; grid-row:1; }
  .diagrams-beside > .diagram-resize-shell { grid-column:1; grid-row:1; }
  .diagrams-right > .question-line { grid-column:1; }
  .diagrams-right > .diagram-resize-shell { grid-column:2; }
  .diagrams-beside > .answer-space { grid-column:1 / -1; }
  .diagrams-first > .question-line > .part-label, .diagrams-beside > .question-line > .part-label { position:absolute; top:0; left:0; }
  .question-line { display: flex; align-items: flex-start; gap: var(--label-gap); }
  .part-label { flex: none; min-width: var(--label-width); font-weight: 700; }
  .exam-label { display: block; font: inherit; font-weight: 800; }
  .prompt { min-width: 0; flex: 1; }
  .parts { margin-top: 1mm; }
  .numbered-root > .parts { width: calc(100% - var(--label-width) - var(--label-gap)); margin-left: calc(var(--label-width) + var(--label-gap)); }
  .question-grid { display: grid; grid-template-columns: repeat(var(--columns), minmax(0, 1fr)); gap: 1.8mm 4mm; }
  .question-grid > .question-node { min-width: 0; }
  .diagram-resize-shell { position: relative; max-width: 100%; margin: 2mm auto; box-sizing: border-box; }
  .diagram { margin: 0; text-align: center; break-inside: avoid; }
  .diagram img, .diagram :global(svg) { display: block; width: 100%; max-width: 100%; height: auto; margin-inline: auto; }
  .diagram.grayscale img { filter: grayscale(1) contrast(1.12); }
  .diagram-composite { position: relative; width: 100%; }
  .diagram-composite > .diagram-resize-shell { width: 100% !important; margin: 0; }
  .diagram-overlay { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none; }
  .diagram-overlay .diagram-resize-shell { width: 100% !important; margin: 0; }
  .diagram-resize-handle { position: absolute; right: -5px; bottom: -5px; width: 12px; height: 12px; padding: 0; border: 1px solid #4f6f9f; border-radius: 50%; background: #fff; cursor: ew-resize; }
  .answer-space { position: relative; display: grid; place-items: center; width: 100%; box-sizing: border-box; margin: 1mm 0 1.5mm; overflow: visible; border: 1px dashed #aab8c8; border-radius: 4px; background: #fff; color: #7d8999; cursor: ns-resize; }
  .space-label { padding: 0 2mm; background: #fff; font-size: var(--type-meta); }
  .space-handle { position: absolute; left: 50%; bottom: -5px; width: 10px; height: 10px; border: 1px solid #aab8c8; border-radius: 50%; background: #fff; transform: translateX(-50%); }
  .answer-key { background: #fff; }
  .answer-children { margin: 1mm 0; }
  .answer-children > .answer-item { min-width: 0; grid-template-columns:8mm minmax(0,1fr); gap:2mm; }
  .answer-item { display: grid; grid-template-columns: 18mm minmax(0, 1fr); gap: 3mm; padding: 3mm 0; border-bottom: 1px solid #dfe4ea; break-inside: avoid; }
  .answer-children > .answer-item { padding:1.5mm 0; }
  .answer-label { color: #23395d; font-weight: 800; }
  .answer-content { min-width: 0; }
  .worked-content { margin-top: 1.5mm; }
  .rewrite-intro { display: flex; gap: var(--label-gap); margin-bottom: 2mm; }
  .rewrite-intro > strong { min-width: var(--label-width); }
  .rewrite-tables { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5mm; margin-left: calc(var(--label-width) + var(--label-gap)); }
  .rewrite-tables table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .rewrite-calculation { display: grid; grid-template-columns: 3.5mm minmax(0, 1fr); gap: 2mm; align-items: baseline; }
  .rewrite-tables th, .rewrite-tables td { padding: 1.4mm; border: .25mm solid #25364a; vertical-align: top; text-align: left; }
  .rewrite-tables th { background: #e8f1f7; color: #245f91; }
  .rewrite-blank { display: block; min-height: 5mm; }
  .muted { color: #68768a; }
  .compact { margin-bottom: 2mm; }
  @media print {
    .answer-space { overflow: visible; border: none; background: #fff; }
    .answer-space.boxed-response { border: .25mm solid #bbb; border-radius:0; }
    .space-label, .space-handle, .diagram-resize-handle { display: none; }
    .diagram-resize-shell { max-width: 100%; }
  }
</style>
