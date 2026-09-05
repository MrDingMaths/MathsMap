<script>
  import { onMount } from 'svelte';
  import BookletCover from './BookletCover.svelte';
  import BookletFooter from './BookletFooter.svelte';
  import BookletSectionHeader from './BookletSectionHeader.svelte';
  import EditableBookletText from './EditableBookletText.svelte';
  import PracticeQuestionRenderer from './PracticeQuestionRenderer.svelte';
  import Tikz from './Tikz.svelte';
  import { deriveBookletCover } from '../lib/booklet-cover.js';
  import { combinedExampleTikz, groupBookletBlocks, investigationDescription, resolvePreviewAssets, visibleImportedQuestionTitle } from '../lib/booklet-preview.js';

  let {
    page, bookletPages = [], runId, showTheorySolutions = true, solutionMode = 'student',
    answerSpaceOverrides = {}, diagramColourModes = {}, onSpaceResize = null,
    editMode = false, onContentEdit = null, onContentRevert = null, onEditingChange = null, isEdited = () => false,
  } = $props();
  let previewFrame;
  let previewScale = $state(1);
  let cover = $derived(deriveBookletCover(bookletPages));
  let orderedPages = $derived([...bookletPages].sort((a, b) => Number(a.pageNumber) - Number(b.pageNumber)));
  let bookletPageNumber = $derived(Math.max(1, orderedPages.findIndex((item) => Number(item.pageNumber) === Number(page.pageNumber)) + 1));
  let displayItems = $derived(groupBookletBlocks(page.blocks ?? []));

  const assetUrl = (src) => src?.startsWith('evidence/') ? `/__booklet/full-imports/${encodeURIComponent(runId)}/files/lanes/exact/${src}` : src;
  const previewQuestion = (question) => resolvePreviewAssets(question, assetUrl);
  const isGuided = (question) => question.pedagogyRole === 'guided-practice';
  const mathLine = (value) => {
    const text = String(value ?? '').replace(/^\s*\d+\.\s*/, '').trim();
    return text.includes('$') ? text : `$${text}$`;
  };
  const calloutKind = (block) => block.variant === 'investigation' ? 'investigation' : block.variant === 'key-ideas' ? 'key-ideas' : 'definition';
  const calloutLabel = (block) => block.variant === 'investigation' ? '' : block.variant === 'key-ideas' ? 'Key Ideas' : block.variant === 'info' ? 'Definition' : 'Theory';
  const calloutDescription = (block) => block.variant === 'investigation' ? investigationDescription(block.title) : block.title;

  function editProps() {
    return { editMode, onContentEdit, onContentRevert, onEditingChange, oneditingchange: onEditingChange, isEdited };
  }

  onMount(() => {
    const a4WidthPx = 210 * 96 / 25.4;
    const resize = () => { previewScale = Math.min(1, (previewFrame?.clientWidth ?? a4WidthPx) / a4WidthPx); };
    const observer = new ResizeObserver(resize);
    if (previewFrame) observer.observe(previewFrame);
    resize();
    return () => observer.disconnect();
  });
</script>

{#snippet diagramView(diagram)}
  {#if diagram?.format === 'tikz' && diagram.code}
    <div class="example-diagram" style={'width:' + (diagram.widthMm ?? 78) + 'mm'}><Tikz code={diagram.code} eager={true} /></div>
  {:else if diagram?.src}
    <figure class:grayscale={diagramColourModes[diagram.id] === 'grayscale'} class="example-diagram" style={'width:' + (diagram.widthMm ?? 78) + 'mm'}><img src={assetUrl(diagram.src)} alt={diagram.alt ?? 'Mathematical diagram'} /></figure>
  {/if}
{/snippet}

{#snippet exampleDiagramSet(example)}
  {#each example.questionDiagrams ?? [] as base}
    {@const overlay = showTheorySolutions ? (example.solutionDiagrams ?? []).find((item) => item.overlayOf === base.id) : null}
    {@const combined = overlay ? combinedExampleTikz(base, overlay) : null}
    {#if combined}
      {@render diagramView({ ...base, code: combined })}
    {:else if overlay}
      <div class="example-diagram-composite" style={'width:' + (base.widthMm ?? overlay.widthMm ?? 78) + 'mm'}>
        {@render diagramView(base)}
        <div class="example-diagram-overlay">{@render diagramView(overlay)}</div>
      </div>
    {:else}
      {@render diagramView(base)}
    {/if}
  {/each}
  {#if showTheorySolutions}
    {#each (example.solutionDiagrams ?? []).filter((diagram) => !diagram.overlayOf) as diagram}{@render diagramView(diagram)}{/each}
  {/if}
{/snippet}

{#snippet exampleSolution(example, numbered = true)}
  <div class="theory-solution">
    {#each example.steps?.length ? example.steps : [example.theorySolution] as step, stepIndex}
      {@const stepPointer = example.steps?.length ? '/steps/' + stepIndex : '/theorySolution'}
      {#if step}<div class:unnumbered={!numbered} class="theory-step">{#if numbered}<b>{stepIndex + 1}.</b>{/if}<EditableBookletText value={mathLine(step)} rootId={example.id} pointer={stepPointer} {...editProps()} edited={isEdited(example.id, stepPointer)} /></div>{/if}
    {/each}
    {#if example.numberLineTikz}<div class="number-line"><Tikz code={example.numberLineTikz} eager={true} /></div>{/if}
  </div>
{/snippet}

{#snippet questionView(block, number)}
  <PracticeQuestionRenderer question={previewQuestion(block)} {number} showTitle={Boolean(visibleImportedQuestionTitle(block))} showSpaces={solutionMode === 'student'} showShortAnswers={solutionMode === 'short'} showWorkedSolutions={solutionMode === 'worked'} {answerSpaceOverrides} {diagramColourModes} {onSpaceResize} eagerDiagrams={true} {...editProps()} />
{/snippet}

{#snippet blockBody(block, index = 0, insideAtom = false)}
  {#if block.type === 'question'}
    {#if isGuided(block) && !insideAtom}
      <section class="theory-section"><BookletSectionHeader kind="guided-practice" /><div class="body-box">{@render questionView(block, null)}</div></section>
    {:else}
      <section class:atom-practice={insideAtom} class="practice">{@render questionView(block, insideAtom ? null : block.sourceOrder ?? index + 1)}</section>
    {/if}
  {:else if block.type === 'worked-example'}
    <section class:inside-atom={insideAtom} class="theory-section">
      {#if !insideAtom}<BookletSectionHeader kind="example" subtitle={block.title} editMode={editMode} rootId={block.id} pointer="/title" {onContentEdit} {onContentRevert} {onEditingChange} {isEdited} />{/if}
      <div class:body-box={!insideAtom} class:example-columns={block.presentation?.layout === 'columns'} class="example" style={'--example-columns:' + (block.presentation?.columns ?? 3)}>
        {#if block.examples?.length && block.presentation?.layout === 'columns'}
          {#each block.examples as example}
            <div class="example-column" data-example-id={example.id}>
              <div class="stacked-prompt"><EditableBookletText value={example.prompt} rootId={example.id} pointer="/prompt" {...editProps()} edited={isEdited(example.id, '/prompt')} /></div>
              {#if showTheorySolutions}{@render exampleSolution(example, block.presentation?.numberSteps === true)}{/if}
              {@render exampleDiagramSet(example)}
            </div>
          {/each}
        {:else if block.examples?.length && block.presentation?.layout === 'worked-rows'}
          {#each block.examples as example}
            <div class="worked-example-row" data-example-id={example.id}>
              <div class="example-working">
                <div class="stacked-prompt"><EditableBookletText value={example.prompt} rootId={example.id} pointer="/prompt" {...editProps()} edited={isEdited(example.id, '/prompt')} /></div>
                {#if showTheorySolutions}{@render exampleSolution(example, block.presentation?.numberSteps !== false)}{/if}
              </div>
              <div class="example-illustration">{@render exampleDiagramSet(example)}</div>
              {#if example.explanation}<div class="example-explanation"><EditableBookletText value={example.explanation} rootId={example.id} pointer="/explanation" fillCloze={showTheorySolutions} {...editProps()} edited={isEdited(example.id, '/explanation')} /></div>{/if}
            </div>
          {/each}
        {:else if block.examples?.length}
          {#each block.examples as example}
            <div class="example-row">
              <div>
                <EditableBookletText value={example.prompt} rootId={example.id} pointer="/prompt" {...editProps()} edited={isEdited(example.id, '/prompt')} />
                {@render exampleDiagramSet(example)}
              </div>
              {#if showTheorySolutions}
                <div class="theory-solution">
                  {#each example.steps?.length ? example.steps : [example.theorySolution] as step, stepIndex}
                    {@const stepPointer = example.steps?.length ? '/steps/' + stepIndex : '/theorySolution'}
                    {#if step}<div class="theory-step"><b>{stepIndex + 1}</b><EditableBookletText value={mathLine(step)} rootId={example.id} pointer={stepPointer} {...editProps()} edited={isEdited(example.id, stepPointer)} /></div>{/if}
                  {/each}
                  {#if example.numberLineTikz}<div class="number-line"><Tikz code={example.numberLineTikz} eager={true} /></div>{/if}
                  {#if example.explanation}<EditableBookletText value={example.explanation} rootId={example.id} pointer="/explanation" {...editProps()} edited={isEdited(example.id, '/explanation')} />{/if}
                </div>
              {/if}
            </div>
          {/each}
        {:else}
          <EditableBookletText value={block.content} rootId={block.id} pointer="/content" {...editProps()} edited={isEdited(block.id, '/content')} />
          {#if showTheorySolutions && block.theorySolution}<div class="theory-solution"><EditableBookletText value={mathLine(block.theorySolution)} rootId={block.id} pointer="/theorySolution" {...editProps()} edited={isEdited(block.id, '/theorySolution')} /></div>{/if}
        {/if}
      </div>
    </section>
  {:else if block.type === 'callout'}
    {#if insideAtom}
      <EditableBookletText value={block.content} rootId={block.id} pointer="/content" layout={block.contentLayout} tableStyle={block.tableStyle} fillCloze={showTheorySolutions} {...editProps()} edited={isEdited(block.id, '/content')} />
    {:else}
      <section class="theory-section"><BookletSectionHeader kind={calloutKind(block)} label={calloutLabel(block)} subtitle={calloutDescription(block)} editMode={editMode} rootId={block.id} pointer="/title" {onContentEdit} {onContentRevert} {onEditingChange} {isEdited} /><div class="body-box"><EditableBookletText value={block.content} tableStyle={block.tableStyle} rootId={block.id} pointer="/content" fillCloze={showTheorySolutions} {...editProps()} edited={isEdited(block.id, '/content')} /></div></section>
    {/if}
  {:else if block.type === 'image'}
    <figure><img src={assetUrl(block.src)} alt={block.alt ?? ''} style={'width:min(100%,' + (block.widthMm ?? 150) + 'mm)'} />{#if block.caption}<figcaption>{block.caption}</figcaption>{/if}</figure>
  {:else if block.type === 'page-break'}
    <hr />
  {:else if block.type === 'spacer'}
    <div aria-hidden="true" style={`height:${Math.max(0, Math.min(80, Number(block.heightMm) || 0))}mm`}></div>
  {:else}
    <section class="content-block">{#if block.title}<h3>{block.title}</h3>{/if}<EditableBookletText value={block.content ?? block.text ?? ''} rootId={block.id} pointer={block.content !== undefined ? '/content' : '/text'} fillCloze={showTheorySolutions} {...editProps()} edited={isEdited(block.id, block.content !== undefined ? '/content' : '/text')} /></section>
  {/if}
{/snippet}

<div class="preview-frame" bind:this={previewFrame} style={`--preview-scale:${previewScale};--preview-height:${297 * previewScale}mm`}>
  <div class="preview-page">
    {#if bookletPageNumber === 1}
      <BookletCover pages={bookletPages} />
    {:else}
      <article class="booklet-page" data-page-number={page.pageNumber}>
        {#if page.section?.headingStyle !== 'none'}<header class:difficulty-heading={page.section?.headingStyle === 'difficulty'} class="section-band"><EditableBookletText value={page.section?.title ?? ''} rootId={page.id} pointer="/section/title" {...editProps()} edited={isEdited(page.id, '/section/title')} /></header>{/if}
        {#if page.section?.difficultyTitle}<header class="section-band difficulty-heading"><EditableBookletText value={page.section.difficultyTitle} rootId={page.id} pointer="/section/difficultyTitle" {...editProps()} edited={isEdited(page.id, '/section/difficultyTitle')} /></header>{/if}
        <main>
          {#each displayItems as item, index (item.id)}
            {#if item.type === 'teaching-atom'}
              <section class="theory-section teaching-atom" data-atom-id={item.atom.id}>
                <BookletSectionHeader kind={item.atom.kind} label={item.atom.kind === 'investigation' ? '' : item.atom.label} subtitle={item.atom.description} editMode={editMode} rootId={item.blocks[0].id} rootIds={item.blocks.map((block) => block.id)} pointer="/sourceAtom/description" {onContentEdit} {onContentRevert} {onEditingChange} {isEdited} />
                <div class="body-box atom-body">
                  {#each item.blocks as block, blockIndex (block.id)}{@render blockBody(block, blockIndex, true)}{/each}
                </div>
              </section>
            {:else}
              {@render blockBody(item.block, index, false)}
            {/if}
          {/each}
        </main>
        <BookletFooter pageNumber={bookletPageNumber} totalPages={cover.totalPages} version={cover.version} feedback="https://MrDingMaths.com" />
      </article>
    {/if}
  </div>
</div>

<style>
  .preview-frame { position:relative; width:100%; height:var(--preview-height); overflow:hidden; }
  .preview-page { position:absolute; top:0; left:50%; width:210mm; transform:translateX(-50%) scale(var(--preview-scale)); transform-origin:top center; }
  .booklet-page { --type-meta:8pt; --type-label:9pt; --type-body:11pt; --type-subheading:13pt; --type-heading:18pt; --type-display:22pt; position:relative; display:flex; width:210mm; height:297mm; padding:10mm 15mm; overflow:hidden; box-sizing:border-box; flex-direction:column; background:#fff; color:#24282d; font-family:'Nunito',system-ui,-apple-system,'Segoe UI',sans-serif; font-size:var(--type-body); line-height:1.32; }
  .section-band { display:flex; min-height:12mm; box-sizing:border-box; align-items:center; margin:0 0 4mm; padding:2.2mm 2.4mm; background:#2f6fb2; color:#fff; font-size:13pt; font-weight:700; line-height:1.05; letter-spacing:.02em; }
  .section-band.difficulty-heading { min-height:6mm; justify-content:flex-end; padding:0; margin-bottom:1mm; border-top:.25mm solid #2f6fb2; background:transparent; color:#111; text-transform:uppercase; }
  main { display:grid; gap:3mm; min-height:0; padding:0 0 11mm; flex:1; } h3 { margin:0 0 2mm; color:#245f91; font-size:var(--type-subheading); }
  .theory-section { break-inside:avoid; }
  .body-box { padding:1.4mm 1.8mm 1.7mm; border:1px solid #d3d7db; border-top:0; background:#fff; }
  .atom-body { display:grid; gap:1.8mm; }
  .inside-atom { margin:0; }
  .example-row { display:grid; grid-template-columns:minmax(28mm,.55fr) minmax(0,1.45fr); gap:4mm; padding:1.4mm 0; border-top:.2mm solid #c9ddeb; }
  .example-row:first-child { border-top:0; }
  .theory-solution { color:#1769aa; font-weight:700; }
  .theory-step { display:grid; grid-template-columns:5mm minmax(0,1fr); align-items:baseline; margin-bottom:.6mm; }
  .theory-step.unnumbered { grid-template-columns:minmax(0,1fr); }
  .example-columns { display:grid; grid-template-columns:repeat(var(--example-columns),minmax(0,1fr)); }
  .example-column { min-width:0; padding:1mm 4mm; }
  .example-column + .example-column { border-left:.2mm solid #ddd; }
  .stacked-prompt { padding-left:5mm; margin-bottom:1.5mm; }
  .worked-example-row { display:grid; grid-template-columns:minmax(25mm,.7fr) minmax(38mm,1.15fr) minmax(0,1.85fr); gap:3mm; padding:2mm 0 4mm; min-height:29mm; align-items:start; }
  .worked-example-row + .worked-example-row { border-top:.2mm solid #ddd; }
  .example-working .stacked-prompt { padding-left:10mm; }
  .example-working .theory-step { margin-bottom:2mm; }
  .example-working .theory-step b { color:#e66c70; font-weight:400; }
  .example-illustration { align-self:center; min-width:0; }
  .example-explanation { align-self:stretch; padding:4mm 1mm 1mm 2mm; border-left:.2mm solid #ddd; color:#53627a; font-style:italic; }
  .number-line, .example-diagram { max-width:100%; margin:1mm auto; }
  .number-line :global(svg), .example-diagram :global(svg), .example-diagram img { display:block; width:100%; height:auto; }
  .example-diagram :global(.tikz-wrap) { margin:0; min-height:0; overflow:visible; }
  .booklet-page :global(.tikz-wrap svg) { filter:none !important; }
  .example-diagram-composite { position:relative; max-width:100%; margin:1mm auto; }
  .example-diagram-composite > .example-diagram { width:100% !important; margin:0; }
  .example-diagram-overlay { position:absolute; inset:0; pointer-events:none; }
  .example-diagram-overlay > .example-diagram { width:100% !important; margin:0; }
  .example-diagram.grayscale img { filter:grayscale(1) contrast(1.12); }
  .practice { break-inside:avoid; }
  .atom-practice { margin:0; }
  figure { margin:0; text-align:center; } figure img { max-height:150mm; object-fit:contain; } figcaption { color:#66758d; font-size:var(--type-meta); }
  .practice :global(.practice-question) { font-size:var(--type-body); }
  hr { width:100%; border:0; border-top:.3mm dashed #9cb8cd; }
  @media print { .preview-frame { width:210mm; height:297mm; overflow:visible; } .preview-page { position:static; transform:none; } }
</style>
