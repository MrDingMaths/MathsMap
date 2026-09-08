<script>
  import { houseStyleVariables } from '../lib/booklet-house-style.js';
  import { sourceRegionStyles } from '../lib/diagram-source-region.js';
  import { onMount,getContext,setContext } from 'svelte';
  import {teachingLabels,usesTeachingLetters,labelledTeachingQuestion} from '../lib/booklet-labels.js';
  import BookletCover from './BookletCover.svelte';
  import BookletArrangement from './BookletArrangement.svelte';
  import BookletFooter from './BookletFooter.svelte';
  import BookletSectionHeader from './BookletSectionHeader.svelte';
  import EditableBookletText from './EditableBookletText.svelte';
  import PracticeQuestionRenderer from './PracticeQuestionRenderer.svelte';
  import Tikz from './Tikz.svelte';
  import { isDocument } from '../lib/document-content.js';
  import { teachingQuestionMode, blockClozeAnswers } from '../lib/booklet-answer-options.js';
  import { deriveBookletCover } from '../lib/booklet-cover.js';
  import { combinedExampleTikz, groupBookletBlocks, investigationDescription, resolvePreviewAssets, visibleImportedQuestionTitle } from '../lib/booklet-preview.js';

  let {
    page, bookletPages = [], runId, zoom = null, showTheorySolutions = true, solutionMode = 'student', flow = false, houseStyleVersion = null,
    showKeyIdeasAnswers = false, showReviewAnswers = false, showIdentifyAnswers = false, showGuidedPracticeAnswers = false, answerSheet = false,
    blockLayouts = {}, answerSpaceOverrides = {}, diagramColourModes = {}, onSpaceResize = null,
    editMode = false, onContentEdit = null, onContentRevert = null, onEditingChange = null, isEdited = () => false, compactPages = false,
    anchorPrefix = '',
  } = $props();
  const parentLabels=getContext('booklet-labels');
  const labels=$derived(parentLabels?.()??teachingLabels(bookletPages.length?bookletPages.flatMap(p=>p.blocks??[]):page.blocks??[]));
  setContext('booklet-labels',()=>labels);
  let previewFrame;
  let frameWidth=$state(794),frameHeight=$state(900);
  let previewScale = $derived(zoom===null?Math.min(1,frameWidth/(210*96/25.4)):zoom==='width'?frameWidth/(210*96/25.4):zoom==='page'?Math.min(frameWidth/(210*96/25.4),Math.max(100,frameHeight)/(297*96/25.4)):Number(zoom)||1);
  let cover = $derived(deriveBookletCover(bookletPages));
  let orderedPages = $derived([...bookletPages].sort((a, b) => Number(a.pageNumber) - Number(b.pageNumber)));
  let bookletPageNumber = $derived(Math.max(1, orderedPages.findIndex((item) => item.id === page.id) + 1));
  let displayItems = $derived(groupBookletBlocks((page.blocks ?? []).filter(block=>!(page.blocks??[]).some(other=>other.pairedBlockId===block.id))));

  const assetUrl = (src) => src?.startsWith('evidence/') ? `/__booklet/full-imports/${encodeURIComponent(runId)}/files/lanes/exact/${src}` : src;
  const previewQuestion = (question) => labelledTeachingQuestion(resolvePreviewAssets(question, assetUrl),labels);
  const isGuided = (question) => question.pedagogyRole === 'guided-practice';
  const firstPlacement=block=>!bookletPages.some(p=>p.mode===page.mode&&p.pageNumber<page.pageNumber&&p.blocks?.some(b=>b.id===block.id));
  const mathLine = (value) => {
    if (isDocument(value)) return value;
    const text = String(value ?? '').replace(/^\s*\d+\.\s*/, '').trim();
    return text.includes('$') || /\s[A-Za-z]{3,}\b/.test(text) ? text : `$${text}$`;
  };
  const calloutKind = (block) => block.variant === 'investigation' ? 'investigation' : block.variant === 'key-ideas' ? 'key-ideas' : 'definition';
  const calloutLabel = (block) => block.label ?? (block.variant === 'investigation' ? '' : block.variant === 'key-ideas' ? 'Key Ideas' : block.variant === 'info' ? 'Definition' : 'Theory');
  const calloutDescription = (block) => block.title === calloutLabel(block) ? '' : block.variant === 'investigation' ? investigationDescription(block.title) : block.title;

  function editProps() {
    return { editMode, onContentEdit, onContentRevert, onEditingChange, oncommit: onContentEdit, onrevert: onContentRevert, oneditingchange: onEditingChange, isEdited };
  }

  onMount(() => {
    const a4WidthPx = 210 * 96 / 25.4;
    const resize = () => { frameWidth=previewFrame?.parentElement?.clientWidth??a4WidthPx;const canvas=previewFrame?.closest('.project-canvas');frameHeight=previewFrame?.closest('.paired')?Math.max(240,window.innerHeight-320):canvas?canvas.clientHeight-(canvas.querySelector('.canvas-heading')?.offsetHeight??0)-32:window.innerHeight-300; };
    const observer = new ResizeObserver(resize);
    if (previewFrame) observer.observe(previewFrame.parentElement);
    if(previewFrame?.closest('.project-canvas'))observer.observe(previewFrame.closest('.project-canvas'));
    resize();
    return () => observer.disconnect();
  });
</script>

{#snippet diagramView(diagram)}
  {#if diagram?.format === 'tikz' && diagram.code}
    <div data-diagram-id={diagram.id} class="example-diagram" style={'width:' + (diagram.widthMm ?? 78) + 'mm'}><Tikz code={diagram.code} eager={true} /></div>
  {:else if diagram?.src}
    {@const region=sourceRegionStyles(diagram.sourceRegion)}
    <figure data-diagram-id={diagram.id} class:grayscale={diagramColourModes[diagram.id] === 'grayscale'} class="example-diagram" style={'width:' + (diagram.widthMm ?? 78) + 'mm;'+(region?.frame??'')}><img style={region?.image} src={assetUrl(diagram.src)} alt={diagram.alt ?? 'Mathematical diagram'} /></figure>
  {/if}
{/snippet}

{#snippet exampleDiagramSet(example)}
  {#each example.questionDiagrams ?? [] as base}
    {@const overlay = (example.solutionDiagrams ?? []).find((item) => item.overlayOf === base.id)}
    {@const combined = overlay ? combinedExampleTikz(base, overlay) : null}
    {#if combined}
      {#if showTheorySolutions}{@render diagramView({ ...base, code: combined })}
      {:else}<div class="example-diagram-composite" style={'width:' + (base.widthMm ?? 78) + 'mm'}><div class="copy-space" aria-hidden="true" inert>{@render diagramView({ ...base, code: combined })}</div><div class="example-diagram-overlay">{@render diagramView(base)}</div></div>{/if}
    {:else if overlay}
      <div class="example-diagram-composite" style={'width:' + (base.widthMm ?? overlay.widthMm ?? 78) + 'mm'}>
        {@render diagramView(base)}
        <div class="example-diagram-overlay" class:copy-space={!showTheorySolutions} aria-hidden={!showTheorySolutions} inert={!showTheorySolutions}>{@render diagramView(overlay)}</div>
      </div>
    {:else}
      {@render diagramView(base)}
    {/if}
  {/each}
  <div class="solution-diagram-space" class:copy-space={!showTheorySolutions} aria-hidden={!showTheorySolutions} inert={!showTheorySolutions}>
    {#each (example.solutionDiagrams ?? []).filter((diagram) => !diagram.overlayOf) as diagram}{@render diagramView(diagram)}{/each}
  </div>
{/snippet}

{#snippet exampleSolution(example, numbered = true)}
  <div class="theory-solution" class:copy-space={!showTheorySolutions} aria-hidden={!showTheorySolutions} inert={!showTheorySolutions}>
    {#each example.steps?.length ? example.steps : [example.theorySolution] as step, stepIndex}
      {@const stepPointer = example.steps?.length ? '/steps/' + stepIndex : '/theorySolution'}
      {#if step}<div class:unnumbered={!numbered} class="theory-step">{#if numbered}<b>{stepIndex + 1}.</b>{/if}<EditableBookletText value={mathLine(step)} rootId={example.id} pointer={stepPointer} {...editProps()} edited={isEdited(example.id, stepPointer)} /></div>{/if}
    {/each}
    {#if example.numberLineTikz}<div class="number-line"><Tikz code={example.numberLineTikz} eager={true} /></div>{/if}
  </div>
{/snippet}

{#snippet questionView(block, number)}
  {@const visibleNumber=usesTeachingLetters(block)?null:number}
  {@const trailing=page.blocks.find(b=>b.id===block.pairedBlockId)}
  {@const questionMode = teachingQuestionMode(block, {showReviewAnswers, showIdentifyAnswers, showGuidedPracticeAnswers, showKeyIdeasAnswers}, solutionMode)}
  {#if block.pedagogyRole === 'worked-example' && solutionMode === 'student'}
    <PracticeQuestionRenderer answerColumnsLimit={answerSheet ? 2 : null} {blockLayouts} compact={block.compact ?? false} question={previewQuestion(block)} number={visibleNumber} showTitle={false} showSpaces={false} eagerDiagrams={true} {...editProps()} />
  {/if}
  <div class="theory-question-space" class:copy-space={block.pedagogyRole==='worked-example'&&!showTheorySolutions} aria-hidden={block.pedagogyRole==='worked-example'&&!showTheorySolutions} inert={block.pedagogyRole==='worked-example'&&!showTheorySolutions}>
  <PracticeQuestionRenderer trailingQuestion={trailing?previewQuestion(trailing):null} answerColumnsLimit={answerSheet ? 2 : null} {blockLayouts} compact={block.compact ?? false} question={previewQuestion(block)} number={visibleNumber} showTitle={Boolean(visibleImportedQuestionTitle(block))} showSpaces={questionMode === 'student'&&block.pedagogyRole!=='worked-example'} showShortAnswers={questionMode === 'short'} showWorkedSolutions={questionMode === 'worked'} {answerSpaceOverrides} {diagramColourModes} {onSpaceResize} eagerDiagrams={true} {...editProps()} />
  </div>
{/snippet}

{#snippet blockBody(block, index = 0, insideAtom = false)}
  {#if block.flow?.exerciseHeadingBefore&&!(page.showDifficultyHeading!==false&&page.section?.difficultyTitle===`Exercise ${block.flow.exerciseHeadingBefore}`)}<h2 class="inline-exercise-heading">Exercise {block.flow.exerciseHeadingBefore}</h2>{/if}
  {#if block.type === 'question'}
    {#if isGuided(block) && !insideAtom}
      <section class="theory-section"><BookletSectionHeader kind="guided-practice" /><div class="body-box">{@render questionView(block, null)}</div></section>
    {:else}
      <section class:atom-practice={insideAtom} class="practice" id={block.flow?.exerciseNumber&&firstPlacement(block)?`${anchorPrefix}question-${block.id}`:undefined}>
        {#if block.flow?.exerciseNumber&&block.pairedBlockId&&firstPlacement(block)}<span id={`${anchorPrefix}question-${block.pairedBlockId}`}></span>{/if}
        {#if editMode&&block.flow?.exerciseNumber&&block.flow?.bankDifficulty}<span class="editor-difficulty" data-editor-difficulty title={`Question bank: ${block.flow.bankDifficulty.difficulty}, reasoning ${block.flow.bankDifficulty.reasoningScore}/100`}>{block.flow.bankDifficulty.difficulty}<br/>{block.flow.bankDifficulty.reasoningScore}/100</span>{/if}
        {#if block.flow?.answerMode}<a class="answer-jump" href={`#${anchorPrefix}answer-${block.flow.answerMode}-${block.id}`} aria-label={`Answers for Exercise ${block.flow.exerciseNumber}, question ${block.sourceOrder}`}>Answers</a>{/if}
        {@render questionView(block, insideAtom ? null : block.sourceOrder ?? page.blocks.filter(item => item.type === 'question').findIndex(item => item.id === block.id) + 1)}
      </section>
    {/if}
  {:else if block.type === 'worked-example'}
    <section class:inside-atom={insideAtom} class="theory-section">
      {#if !insideAtom}<BookletSectionHeader kind="example" subtitle={block.title} editMode={editMode} rootId={block.id} pointer="/title" {onContentEdit} {onContentRevert} {onEditingChange} {isEdited} />{/if}
      <div class:body-box={!insideAtom} class:example-columns={block.presentation?.layout === 'columns'} class="example" style={'--example-columns:' + (block.presentation?.columns ?? 3)}>
        {#if blockLayouts[block.id]?.arrangement || block.examples?.length && block.presentation?.layout === 'columns'}
          <BookletArrangement {block} arrangement={blockLayouts[block.id]?.arrangement} layoutOverrides={{blockLayouts, answerSpaces:answerSpaceOverrides}} showSolutions={showTheorySolutions} {assetUrl} {diagramColourModes} {editMode}/>
        {:else if block.examples?.length && block.presentation?.layout === 'worked-rows'}
          {#each block.examples as example, exampleIndex}
            <div class="worked-example-row" data-example-id={example.id}>
              <div class="example-working">
                {#if example.prompt}<div class="stacked-prompt" style:padding-left={blockLayouts[example.id]?.insetMm != null ? blockLayouts[example.id].insetMm+'mm' : undefined}><span class="example-prompt"><EditableBookletText value={example.prompt} rootId={example.id} pointer="/prompt" {...editProps()} edited={isEdited(example.id, '/prompt')} /></span></div>{/if}
                {@render exampleSolution(example, block.presentation?.numberSteps !== false)}
              </div>
              <div class="example-illustration">{@render exampleDiagramSet(example)}{#if example.diagramCaption}<EditableBookletText value={example.diagramCaption} rootId={example.id} pointer="/diagramCaption" {...editProps()}/>{/if}</div>
              {#if example.explanation}<div class="example-explanation" class:copy-space={!showTheorySolutions} aria-hidden={!showTheorySolutions} inert={!showTheorySolutions}><EditableBookletText value={example.explanation} rootId={example.id} pointer="/explanation" fillCloze={blockClozeAnswers(block,{showKeyIdeasAnswers},solutionMode)} {...editProps()} edited={isEdited(example.id, '/explanation')} /></div>{/if}
            </div>
          {/each}
        {:else if block.examples?.length}
          {#each block.examples as example, exampleIndex}
            <div class="example-row">
              <div>
                <span class="example-prompt"><EditableBookletText value={example.prompt} rootId={example.id} pointer="/prompt" {...editProps()} edited={isEdited(example.id, '/prompt')} /></span>
                {@render exampleDiagramSet(example)}
              </div>
              <div class="theory-solution" class:copy-space={!showTheorySolutions} aria-hidden={!showTheorySolutions} inert={!showTheorySolutions}>
                  {#each example.steps?.length ? example.steps : [example.theorySolution] as step, stepIndex}
                    {@const stepPointer = example.steps?.length ? '/steps/' + stepIndex : '/theorySolution'}
                    {#if step}<div class="theory-step"><b>{stepIndex + 1}</b><EditableBookletText value={mathLine(step)} rootId={example.id} pointer={stepPointer} {...editProps()} edited={isEdited(example.id, stepPointer)} /></div>{/if}
                  {/each}
                  {#if example.numberLineTikz}<div class="number-line"><Tikz code={example.numberLineTikz} eager={true} /></div>{/if}
                  {#if example.explanation}<EditableBookletText value={example.explanation} rootId={example.id} pointer="/explanation" {...editProps()} edited={isEdited(example.id, '/explanation')} />{/if}
                </div>
            </div>
          {/each}
        {:else}
          <EditableBookletText value={block.content} rootId={block.id} pointer="/content" {...editProps()} edited={isEdited(block.id, '/content')} />
          {#if block.theorySolution}<div class="theory-solution" class:copy-space={!showTheorySolutions} aria-hidden={!showTheorySolutions} inert={!showTheorySolutions}><EditableBookletText value={mathLine(block.theorySolution)} rootId={block.id} pointer="/theorySolution" {...editProps()} edited={isEdited(block.id, '/theorySolution')} /></div>{/if}
        {/if}
      </div>
    </section>
  {:else if block.type === 'callout'}
    {#if blockLayouts[block.id]?.arrangement}
     {#if insideAtom}<BookletArrangement {block} arrangement={blockLayouts[block.id].arrangement} fillCloze={blockClozeAnswers(block,{showKeyIdeasAnswers},solutionMode)} {assetUrl} {diagramColourModes} {editMode}/>
     {:else}<section class="theory-section"><BookletSectionHeader kind={calloutKind(block)} label={calloutLabel(block)} subtitle={calloutDescription(block)} editMode={editMode} rootId={block.id} pointer="/title" labelPointer="/label" {onContentEdit} {onContentRevert} {onEditingChange} {isEdited}/><div class="body-box"><BookletArrangement {block} arrangement={blockLayouts[block.id].arrangement} fillCloze={blockClozeAnswers(block,{showKeyIdeasAnswers},solutionMode)} {assetUrl} {diagramColourModes} {editMode}/></div></section>{/if}
    {:else}
    {#if insideAtom}
      <EditableBookletText value={block.content} rootId={block.id} pointer="/content" layout={block.contentLayout} tableStyle={block.tableStyle} fillCloze={blockClozeAnswers(block,{showKeyIdeasAnswers},solutionMode)} {...editProps()} edited={isEdited(block.id, '/content')} />
    {:else}
      <section class="theory-section"><BookletSectionHeader kind={calloutKind(block)} label={calloutLabel(block)} subtitle={calloutDescription(block)} editMode={editMode} rootId={block.id} pointer="/title" labelPointer="/label" {onContentEdit} {onContentRevert} {onEditingChange} {isEdited} /><div class="body-box"><EditableBookletText value={block.content} tableStyle={block.tableStyle} rootId={block.id} pointer="/content" fillCloze={blockClozeAnswers(block,{showKeyIdeasAnswers},solutionMode)} {...editProps()} edited={isEdited(block.id, '/content')} /></div></section>
    {/if}
    {/if}
  {:else if block.type === 'diagram'}
    {@render diagramView(block)}
  {:else if block.type === 'image'}
    <figure>{@render diagramView({...block,widthMm:block.widthMm??150})}{#if block.caption}<figcaption>{block.caption}</figcaption>{/if}</figure>
  {:else if block.type === 'page-break'}
    <hr />
  {:else if block.type === 'spacer'}
    <div aria-hidden="true" style={`height:${Math.max(0, Math.min(80, Number(block.heightMm) || 0))}mm`}></div>
  {:else}
    <section class="content-block" class:numbered-content={block.sourceOrder!=null&&!usesTeachingLetters(block)}>{#if block.sourceOrder!=null&&!usesTeachingLetters(block)}<b>{block.sourceOrder}</b>{/if}<div>{#if block.title && block.title !== page.section?.title}<h3>{block.title}</h3>{/if}<EditableBookletText value={block.content ?? block.text ?? ''} rootId={block.id} pointer={block.content !== undefined ? '/content' : '/text'} fillCloze={blockClozeAnswers(block,{showKeyIdeasAnswers},solutionMode)} {...editProps()} edited={isEdited(block.id, block.content !== undefined ? '/content' : '/text')} /></div></section>
  {/if}
{/snippet}

<div class="preview-frame" class:compact-pages={compactPages} class:zoomed={zoom!==null} class:flow bind:this={previewFrame} style={`--preview-scale:${previewScale};--preview-height:${297 * previewScale}mm;--preview-width:${210 * previewScale}mm`}>
  <div class="preview-page" style={houseStyleVariables(houseStyleVersion)} data-house-style={houseStyleVersion}>
    {#if page.flexible ? page.isCover : bookletPageNumber === 1 && Number(page.pageNumber) === 1 && !answerSheet}
      <BookletCover pages={bookletPages} {anchorPrefix}/>
    {:else}
      <article class="booklet-page" data-page-number={page.pageNumber} data-house-style={houseStyleVersion}>
        {#if page.section?.headingStyle !== 'none' && page.showTopicHeading !== false}<header id={page.section?.exerciseNumber?`${anchorPrefix}exercise-topic-${page.section.exerciseNumber}`:undefined} class:difficulty-heading={page.section?.headingStyle === 'difficulty'} class="section-band"><EditableBookletText value={page.section?.title ?? ''} rootId={page.id} pointer="/section/title" {...editProps()} editMode={editMode&&!page.flexible} edited={isEdited(page.id, '/section/title')} /></header>{/if}
        {#if page.showDifficultyHeading !== false && page.section?.difficultyTitle && !(page.section?.headingStyle === 'difficulty' && page.section.title?.trim().toLowerCase() === page.section.difficultyTitle.trim().toLowerCase())}<header class="section-band difficulty-heading"><EditableBookletText value={page.section.difficultyTitle} rootId={page.id} pointer="/section/difficultyTitle" {...editProps()} editMode={editMode&&!page.flexible} edited={isEdited(page.id, '/section/difficultyTitle')} /></header>{/if}
        <main>
          {#each displayItems as item, index (item.id)}
            {#if item.type === 'teaching-atom'}
              <section class="theory-section teaching-atom" class:key-ideas-body={item.atom.kind==='key-ideas'} data-atom-id={item.atom.id}>
                <BookletSectionHeader kind={item.atom.kind} label={item.atom.label} labelPointer="/sourceAtom/label" subtitle={item.atom.visibleSubtitle} editMode={editMode} rootId={item.blocks[0].id} rootIds={item.blocks.map((block) => block.id)} pointer={item.atom.visibleSubtitle !== undefined && item.blocks[0].sourceAtom.visibleSubtitle !== undefined ? "/sourceAtom/visibleSubtitle" : "/sourceAtom/description"} {onContentEdit} {onContentRevert} {onEditingChange} {isEdited} />
                <div class="body-box atom-body" class:review-body={item.atom.kind === "review"}>
                  {#each item.blocks as block, blockIndex (block.id)}{@render blockBody(block, blockIndex, true)}{/each}
                </div>
              </section>
            {:else}
              {@render blockBody(item.block, index, false)}
            {/if}
          {/each}
        </main>
        <BookletFooter pageNumber={page.flexible?page.pageNumber:bookletPageNumber} totalPages={page.totalPages??cover.totalPages} sourcePage={!page.flexible&&(page.continuation||bookletPageNumber!==Number(page.pageNumber))?page.pageNumber:null} version={cover.version} feedback="https://MrDingMaths.com" />
      </article>
    {/if}
  </div>
</div>

<style>
  .inline-exercise-heading{font-size:13pt;margin:3mm 0 2mm;break-after:avoid}
  .practice{position:relative}.editor-difficulty{position:absolute;right:-14mm;top:4mm;width:13mm;font:7px/1.3 system-ui;color:#6d7784;text-align:right;pointer-events:none}.answer-jump{position:absolute;right:-14mm;top:0;width:13mm;text-align:right;font-size:6.5pt;color:#586a81;text-decoration:none}@media print{.editor-difficulty,.answer-jump{display:none!important}}
.compact-pages.preview-frame{height:auto;min-height:0!important;overflow:visible;width:210mm;}
.compact-pages .preview-page{position:relative;left:0;transform:none;}
.compact-pages .booklet-page{height:auto;min-height:0;overflow:visible;}
.compact-pages .booklet-page main{flex:none;}
.compact-pages :global(.booklet-footer){position:static;margin-top:3mm;}
.numbered-content{display:grid;grid-template-columns:7mm minmax(0,1fr);gap:3mm}

  .preview-frame:has(:global(.maths-editor.inline)){overflow:visible;z-index:12}.booklet-page:has(:global(.maths-editor.inline)){overflow:visible}.preview-page[data-house-style] :global(.key-ideas-body){line-height:1.5}

  .flow .section-band{break-inside:avoid;break-after:avoid}.flow main{break-before:avoid}
  .copy-space{visibility:hidden;pointer-events:none;user-select:none}.solution-diagram-space,.theory-question-space{display:contents}

  .flow.preview-frame{height:auto;overflow:visible}.flow .preview-page{position:relative;left:0;width:100%;transform:none}.flow .booklet-page{width:100%;height:auto;min-height:180mm;overflow:visible}.flow .booklet-page main{display:block;min-height:0;flex:none}.flow .booklet-page main>section{margin-bottom:3mm}.flow :global(.booklet-footer){position:static;margin-top:6mm}.flow :global(.question-node),.flow :global(.me-layout),.flow :global(tr){break-inside:avoid}@media print{.flow.preview-frame,.flow .preview-page,.flow .booklet-page{width:180mm;height:auto;min-height:0;overflow:visible}.flow .booklet-page{display:block;padding:0}.flow :global(.booklet-footer){display:none}.flow .booklet-page main{padding:0}}
  .preview-frame { position:relative; width:100%; height:var(--preview-height); overflow:hidden; }
  .preview-page { position:absolute; top:0; left:50%; width:210mm; transform:translateX(-50%) scale(var(--preview-scale)); transform-origin:top center; }
  .booklet-page { --type-meta:8pt; --type-label:9pt; --type-body:11pt; --type-subheading:13pt; --type-heading:18pt; --type-display:22pt; position:relative; display:flex; width:210mm; height:297mm; padding:10mm 15mm; overflow:hidden; box-sizing:border-box; flex-direction:column; background:#fff; color:#24282d; font-family:'Nunito',system-ui,-apple-system,'Segoe UI',sans-serif; font-size:var(--type-body); line-height:1.32; }
  .section-band { display:flex; min-height:12mm; box-sizing:border-box; align-items:center; margin:0 0 4mm; padding:2.2mm 2.4mm; background:#2f6fb2; color:#fff; font-size:13pt; font-weight:700; line-height:1.05; letter-spacing:.02em; }
  .section-band.difficulty-heading { min-height:6mm; justify-content:flex-end; padding:0; margin-bottom:1mm; border-top:.25mm solid #2f6fb2; background:transparent; color:#111; text-transform:uppercase; }
  main { display:grid; align-content:start; gap:3mm; min-height:0; padding:0 0 11mm; flex:1; } h3 { margin:0 0 2mm; color:#245f91; font-size:var(--type-subheading); }
  .theory-section { break-inside:avoid; }
  .body-box { padding:1.4mm 1.8mm 1.7mm; border:1px solid #d3d7db; border-top:0; background:#fff; }
  .atom-body { display:grid; gap:1.8mm; }
  .review-body :global(.question-depth-0 > .question-line)::before { content:""; display:inline-block; flex:none; width:3.5mm; height:3.5mm; border:.4mm solid currentColor; border-radius:.6mm; margin-top:.5mm; }
  .inside-atom { margin:0; }
  .example-row { display:grid; grid-template-columns:minmax(28mm,.55fr) minmax(0,1.45fr); gap:4mm; padding:1.4mm 0; border-top:.2mm solid #c9ddeb; }
  .example-row:first-child { border-top:0; }
  .theory-solution { line-height:1.8; color:#1769aa; font-weight:400; }
  .theory-step { display:grid; grid-template-columns:5mm minmax(0,1fr); align-items:baseline; margin-bottom:.6mm; }
  .theory-step.unnumbered { grid-template-columns:minmax(0,1fr); }
  .example-columns { display:grid; grid-template-columns:repeat(var(--example-columns),minmax(0,1fr)); }
  .example-prompt { display:grid; grid-template-columns:6mm minmax(0,1fr); gap:1mm; }
  .stacked-prompt { padding-left:5mm; margin-bottom:1.5mm; }
  .worked-example-row { display:grid; grid-template-columns:minmax(25mm,.7fr) minmax(38mm,1.15fr) minmax(0,1.85fr); gap:3mm; padding:2mm 0 4mm; min-height:29mm; align-items:start; }
  .worked-example-row:not(:has(.example-explanation)) { grid-template-columns:minmax(0,1fr) minmax(0,1.35fr); }
  .worked-example-row + .worked-example-row { border-top:.2mm solid #ddd; }
  /* These prompts have no separate number cell: the legacy 6 mm label track
     otherwise receives the entire explanation and stretches the page. */
  .worked-example-row .example-prompt { display:block; }
  .example-working .stacked-prompt { padding-left:0; }
  .booklet-page :global(.katex) { white-space:nowrap; }
  .example-working .theory-step { margin-bottom:2mm; }
  .example-working .theory-step b { color:#e66c70; font-weight:400; }
  .example-illustration { align-self:center; min-width:0; }
  .example-explanation { align-self:stretch; padding:4mm 1mm 1mm 2mm; border-left:.2mm solid #ddd; color:#53627a; font-style:italic; }
  .number-line, .example-diagram { max-width:100%; margin:1mm auto; }
  .number-line :global(svg), .example-diagram :global(svg), .example-diagram img { display:block; width:100%; height:auto; }
  .example-diagram :global(.tikz-wrap) { margin:0; min-height:0; overflow:visible; }
  .booklet-page :global(.tikz-wrap svg) { filter:none !important; }
  .booklet-page :global(.tikz-wrap) { margin:0;min-height:0;overflow:visible; }
  .booklet-page :global(.tikz-wrap svg) { display:block; }
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
  @media screen{.zoomed.preview-frame{width:var(--preview-width);min-height:var(--preview-height)}.zoomed.flow .preview-page{width:210mm;transform:scale(var(--preview-scale));transform-origin:top left}.zoomed.flow .booklet-page{width:210mm}.zoomed .preview-page{left:0;transform:scale(var(--preview-scale));transform-origin:top left}}
  @media print { .preview-frame { width:210mm; height:297mm; overflow:visible; } .preview-page { position:static; transform:none; } }
</style>
