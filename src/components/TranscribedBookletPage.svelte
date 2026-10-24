<script>
  import {questionDifficulty,chilliCount} from '../lib/booklet-bank-ratings.js';
  import {isTheoryReview} from '../lib/question-bank-eligibility.js';
  import { houseStyleVariables } from '../lib/booklet-house-style.js';
  import { sourceRegionStyles } from '../lib/diagram-source-region.js';
  import {exerciseHeading} from '../lib/booklet-exercise-heading.js';
  import { onMount,getContext,setContext } from 'svelte';
  import {usesReviewNumbers,teachingLabels,usesTeachingLetters,labelledTeachingQuestion,keyIdeasClozeStatements} from '../lib/booklet-labels.js';
  import BookletCover from './BookletCover.svelte';
  import BookletHeading from './BookletHeading.svelte';
  import BookletArrangement from './BookletArrangement.svelte';
  import BookletFooter from './BookletFooter.svelte';
  import BookletSectionHeader from './BookletSectionHeader.svelte';
  import EditableBookletText from './EditableBookletText.svelte';
  import PracticeQuestionRenderer from './PracticeQuestionRenderer.svelte';
  import Tikz from './Tikz.svelte';
  import { isDocument } from '../lib/document-content.js';
  import { teachingQuestionMode, blockClozeAnswers } from '../lib/booklet-answer-options.js';
  import { deriveBookletCover, frontMatterDestinations, unnumberedTopicDestinations } from '../lib/booklet-cover.js';
  import { combinedExampleTikz, groupBookletBlocks, investigationDescription, resolvePreviewAssets, visibleImportedQuestionTitle } from '../lib/booklet-preview.js';

  let {
    page, bookletPages = [], runId, zoom = null, showTheorySolutions = true, solutionMode = 'student', flow = false, houseStyleVersion = null,
    showKeyIdeasAnswers = false, showReviewAnswers = false, showIdentifyAnswers = false, showGuidedPracticeAnswers = false, answerSheet = false,
    blockLayouts = {}, answerSpaceOverrides = {}, diagramColourModes = {}, onSpaceResize = null,
    editMode = false, onContentEdit = null, onContentRevert = null, onEditingChange = null, isEdited = () => false, compactPages = false,
    anchorPrefix = '',
  } = $props();
  const parentLabels=getContext('booklet-labels');
  const presentation=getContext('booklet-presentation');
  const documentActions=getContext('booklet-document-actions');
  const labels=$derived(parentLabels?.()??teachingLabels(bookletPages.length?bookletPages.flatMap(p=>p.blocks??[]):page.blocks??[]));
  setContext('booklet-labels',()=>labels);
  // Optional per-example spacing; without it the row keeps the house values in the stylesheet.
  const exampleRowStyle=example=>{const r=example.rowLayout;if(!r)return undefined;return [['gapMm','--example-gap'],['aboveMm','--example-above'],['belowMm','--example-below'],['minHeightMm','--example-min']].filter(([key])=>Number.isFinite(r[key])).map(([key,name])=>`${name}:${r[key]}mm`).join(';')||undefined;};
  let previewFrame;
  let frameWidth=$state(794),frameHeight=$state(900),dropBefore=$state('');
  let previewScale = $derived(zoom===null?Math.min(1,frameWidth/(210*96/25.4)):zoom==='width'?frameWidth/(210*96/25.4):zoom==='page'?Math.min(frameWidth/(210*96/25.4),Math.max(100,frameHeight)/(297*96/25.4)):Number(zoom)||1);
  let cover = $derived(deriveBookletCover(bookletPages, presentation?.()?.cover));
  const frontMatterAnchor = $derived([...frontMatterDestinations(bookletPages),...unnumberedTopicDestinations(bookletPages)].find(destination => destination.page === page)?.id);
  let orderedPages = $derived([...bookletPages].sort((a, b) => Number(a.pageNumber) - Number(b.pageNumber)));
  let bookletPageNumber = $derived(Math.max(1, orderedPages.findIndex((item) => item.id === page.id) + 1));
  let displayItems = $derived(groupBookletBlocks((page.blocks ?? []).filter(block=>!(page.blocks??[]).some(other=>other.pairedBlockId===block.id&&!(other.sourceAtom&&block.sourceAtom)))));

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
  const calloutLabel = (block) => block.label ?? (block.variant === 'investigation' ? '' : block.variant === 'key-ideas' ? 'Key ideas' : block.variant === 'info' ? 'Definition' : 'Theory');
  const calloutDescription = (block) => block.title === calloutLabel(block) ? '' : block.variant === 'investigation' ? investigationDescription(block.title) : block.title;

  // Flexible pages show topic titles and generated exercise headings, so their headings are renamed in place rather than through the rich-text editor.
  const headingsEditable=$derived(editMode&&!!page.flexible&&(page.mode??'student')==='student'&&!!documentActions?.retitle);
  const answerHrefFor=block=>block.flow?.answerMode?`#${anchorPrefix}answer-${block.flow.answerMode}-${block.id}`:null;
  // Editor-only: whether the question is in the bank and whether its copy is current.
  function bankMarker(block){
    const item=documentActions?.bankState?.(block.id),bankId=item?.bankId??block.bankRef?.id;
    if(!bankId)return {state:'local',label:'Not in bank',title:'Booklet-local question: not in the question bank'};
    const stale=['update','conflict','pending','missing'].includes(item?.state);
    return {state:stale?item.state:'synced',label:stale?'Bank !':'Bank',title:`Question bank: ${bankId}${item?.owner?' (this booklet is the original)':''}${item?.state?' · '+item.state:''}`};
  }

  // Editor-only: whether the question's content is shared with other booklets.
  const SHARED_LABELS={synced:'In step',edited:'Changed here',diverged:'Differs',behind:'Update waiting',separate:'Kept different',missing:'Removed'};
  function sharedMarker(block){
    const m=documentActions?.sharedState?.(block.id);if(!m)return null;
    const copies=m.others.filter(o=>o.status!=='separate').length+1;
    return {state:m.status,label:m.status==='synced'?`Shared ×${copies}`:'Shared !',title:`Shared with ${m.others.length} other booklet${m.others.length===1?'':'s'} · ${SHARED_LABELS[m.status]??m.status}. Click for details.`};
  }

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

{#snippet headingEditor(value, target)}
  {#key value}<span class="heading-edit" role="textbox" tabindex="0" aria-label="Edit heading" contenteditable="true" spellcheck="false"
    onpaste={e=>{e.preventDefault();document.execCommand('insertText',false,(e.clipboardData?.getData('text/plain')??'').replace(/\s+/g,' '));}}
    onkeydown={e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur();}else if(e.key==='Escape'){e.currentTarget.textContent=value;e.currentTarget.blur();}}}
    onblur={e=>{const next=e.currentTarget.textContent.replace(/\s+/g,' ').trim();if(!next||next===value){e.currentTarget.textContent=value;return;}documentActions.retitle(target,next);}}>{value}</span>{/key}
{/snippet}

{#snippet diagramView(diagram, transparent=false)}
  {#if diagram?.format === 'tikz' && diagram.code}
    <div data-diagram-id={diagram.id} data-diagram-align={diagram.align} class="example-diagram" style={'width:' + (diagram.widthMm ?? 78) + 'mm'}><Tikz code={diagram.code} eager={true} {transparent} /></div>
  {:else if diagram?.src}
    {@const region=sourceRegionStyles(diagram.sourceRegion)}
    <figure data-diagram-id={diagram.id} data-diagram-align={diagram.align} class:grayscale={diagramColourModes[diagram.id] === 'grayscale'} class="example-diagram" style={'width:' + (diagram.widthMm ?? 78) + 'mm;'+(region?.frame??'')}><img style={region?.image} src={assetUrl(diagram.src)} alt={diagram.alt ?? 'Mathematical diagram'} /></figure>
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
        <div class="example-diagram-overlay" class:copy-space={!showTheorySolutions} aria-hidden={!showTheorySolutions} inert={!showTheorySolutions}>{@render diagramView(overlay,true)}</div>
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

{#snippet questionView(block, number, answerHref = null)}
  {#if block.presentation?.studentRole==='your-turn'&&solutionMode==='student'}<h3>Your turn</h3>{/if}
  {@const visibleNumber=usesReviewNumbers(block)?(labels[block.content.id]===''?null:Number(labels[block.content.id]??1)):usesTeachingLetters(block)?null:number}
  {@const trailing=page.blocks.find(b=>b.id===block.pairedBlockId&&!(block.sourceAtom&&b.sourceAtom))}
  {@const questionMode = teachingQuestionMode(block, {showReviewAnswers, showIdentifyAnswers, showGuidedPracticeAnswers, showKeyIdeasAnswers}, solutionMode)}
  {#if solutionMode==='student'&&block.flow?.fragment>0&&(block.flow.repeatSharedStem||block.flow.workingSpaceSlice)}<div class="practice-continuation-label">Question {number} continued</div>{/if}
  {#if block.pedagogyRole === 'worked-example' && solutionMode === 'student'}
    <PracticeQuestionRenderer answerColumnsLimit={answerSheet ? 2 : null} {blockLayouts} compact={block.compact ?? false} question={previewQuestion(block)} number={visibleNumber} showTitle={false} showSpaces={false} eagerDiagrams={true} {...editProps()} />
  {/if}
  <div class="theory-question-space" class:copy-space={block.pedagogyRole==='worked-example'&&!showTheorySolutions} aria-hidden={block.pedagogyRole==='worked-example'&&!showTheorySolutions} inert={block.pedagogyRole==='worked-example'&&!showTheorySolutions}>
  <PracticeQuestionRenderer {answerHref} answerMode={block.flow?.answerMode} answerPartHref={answerHref?`#${anchorPrefix}answer-${block.flow.answerMode}-part-`:null} trailingAnswerHref={answerHref&&trailing?answerHrefFor(trailing):null} trailingQuestion={trailing?previewQuestion(trailing):null} answerColumnsLimit={answerSheet ? 2 : null} {blockLayouts} compact={block.compact ?? false} question={previewQuestion(block)} number={visibleNumber} showTitle={Boolean(visibleImportedQuestionTitle(block))} showSpaces={questionMode === 'student'&&block.pedagogyRole!=='worked-example'} showShortAnswers={questionMode === 'short'} showWorkedSolutions={questionMode === 'worked'} {answerSpaceOverrides} {diagramColourModes} {onSpaceResize} eagerDiagrams={true} {...editProps()} />
  </div>
{/snippet}

{#snippet blockBody(block, index = 0, insideAtom = false)}
  {@const rated=block.type==='question'&&page.section?.phase==='practice'&&!isTheoryReview(block,page.section)}
  {@const marked=editMode&&rated}
  {@const rating=rated?questionDifficulty(block):null}
  {@const chillies=rating?chilliCount(rating.reasoningScore):0}
  {@const bank=marked?bankMarker(block):null}
  {@const sharedMark=marked?sharedMarker(block):null}
  {#if block.flow?.exerciseAnchorBefore&&firstPlacement(block)&&!(page.section?.headingStyle!=='none'&&page.showTopicHeading!==false)}<span id={`${anchorPrefix}exercise-topic-${block.flow.exerciseAnchorBefore}`}></span>{/if}
  {#if block.flow?.exerciseHeadingBefore&&!(page.showDifficultyHeading!==false&&page.section?.difficultyTitle===exerciseHeading(block.flow.exerciseHeadingBefore))}<BookletHeading kind="exercise">{exerciseHeading(block.flow.exerciseHeadingBefore)}</BookletHeading>{/if}
  {#if block.type === 'question'}
    {@const clozeStatements=keyIdeasClozeStatements(block)}
    {#if block.flow?.teachingLabel&&firstPlacement(block)}<span id={`${anchorPrefix}question-${block.id}`}></span>{#if usesTeachingLetters(block)&&presentation?.()?.teachingPresentationVersion!==1}<div class="teaching-activity-reference">{block.flow.teachingLabel}</div>{/if}{/if}
    {#if clozeStatements}
      <div class="key-ideas-cloze" data-content-owner={block.id}>{#each clozeStatements as part}<div class="cloze-statement">{#if part.label}<span class="cloze-number">{part.label}.</span>{/if}<div class="cloze-text"><EditableBookletText value={part.prompt} rootId={part.id} pointer="/prompt" fillCloze={showKeyIdeasAnswers} {...editProps()}/></div></div>{/each}</div>
    {:else if isGuided(block) && !insideAtom}
      <section class="theory-section"><BookletSectionHeader kind="guided-practice" /><div class="body-box">{@render questionView(block, null)}</div></section>
    {:else}
      <section class:atom-practice={insideAtom} class="practice" data-reasoning-band={marked?rating?.difficulty:undefined} data-chillies={marked&&chillies?chillies:undefined} id={block.flow?.exerciseNumber&&!block.flow?.teachingLabel&&firstPlacement(block)?`${anchorPrefix}question-${block.id}`:undefined}>
        {#if block.flow?.exerciseNumber&&block.pairedBlockId&&firstPlacement(block)}<span id={`${anchorPrefix}question-${block.pairedBlockId}`}></span>{/if}
        {#if marked}<div class="editor-markers">{#if rating}<span class="editor-difficulty" data-editor-difficulty={block.id} data-chillies={chillies} title={`Difficulty: ${rating.difficulty}, reasoning ${rating.reasoningScore}/100${rating.difficultyReason?'; '+rating.difficultyReason:''}`}>{rating.reasoningScore}</span>{/if}<span class="editor-bank" data-editor-bank={bank.state} title={bank.title}>{bank.label}</span>{#if sharedMark}<button type="button" class="editor-shared" data-editor-shared={sharedMark.state} title={sharedMark.title} onclick={()=>documentActions?.openShared?.(block.id)}>{sharedMark.label}</button>{/if}</div>{/if}
        {@render questionView(block, insideAtom ? null : block.sourceOrder ?? page.blocks.filter(item => item.type === 'question').findIndex(item => item.id === block.id) + 1, answerHrefFor(block))}
      </section>
    {/if}
  {:else if block.type === 'worked-example'}
    <section class:inside-atom={insideAtom} class="theory-section">
      {#if !insideAtom}<BookletSectionHeader kind="example" subtitle={block.title} editMode={editMode} rootId={block.id} pointer="/title" {onContentEdit} {onContentRevert} {onEditingChange} {isEdited} />{/if}
      <div class:body-box={!insideAtom} class:example-columns={block.presentation?.layout === 'columns'} class="example" style={'--example-columns:' + (block.presentation?.columns ?? 3)}>
        {#if blockLayouts[block.id]?.arrangement || block.examples?.some(example=>example.equationAlignment) || block.examples?.length && block.presentation?.layout === 'columns'}
          <BookletArrangement {block} arrangement={blockLayouts[block.id]?.arrangement} layoutOverrides={{blockLayouts, answerSpaces:answerSpaceOverrides}} showSolutions={showTheorySolutions} {assetUrl} {diagramColourModes} {editMode}/>
        {:else if block.examples?.length && block.presentation?.layout === 'worked-rows'}
          {#each block.examples as example, exampleIndex}
            <div class="worked-example-row" data-example-id={example.id} style={exampleRowStyle(example)}>
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
    {#if blockLayouts[block.id]?.arrangement}<BookletArrangement {block} arrangement={blockLayouts[block.id].arrangement} layoutOverrides={{blockLayouts, answerSpaces:answerSpaceOverrides}} {assetUrl} {diagramColourModes} {editMode}/>{:else}{@render diagramView(block)}{/if}
  {:else if block.type === 'image'}
    <figure>{#if blockLayouts[block.id]?.arrangement}<BookletArrangement {block} arrangement={blockLayouts[block.id].arrangement} layoutOverrides={{blockLayouts, answerSpaces:answerSpaceOverrides}} {assetUrl} {diagramColourModes} {editMode}/>{:else}{@render diagramView({...block,widthMm:block.widthMm??150})}{/if}{#if block.caption}<figcaption>{block.caption}</figcaption>{/if}</figure>
  {:else if block.presentation?.kind === 'main-section-header'}
    <BookletHeading><EditableBookletText value={block.content} rootId={block.id} pointer="/content" {...editProps()} /></BookletHeading>
  {:else if block.type === 'page-break'}
    <hr />
  {:else if block.type === 'spacer'}
    <div aria-hidden="true" style={`height:${Math.max(0, Math.min(80, Number(block.heightMm) || 0))}mm`}></div>
  {:else}
    <section class="content-block" class:numbered-content={block.sourceOrder!=null&&!usesTeachingLetters(block)}>{#if block.sourceOrder!=null&&!usesTeachingLetters(block)}<b>{block.sourceOrder}</b>{/if}<div>{#if block.title && block.title !== page.section?.title}<h3>{block.title}</h3>{/if}<EditableBookletText value={block.content ?? block.text ?? ''} rootId={block.id} pointer={block.content !== undefined ? '/content' : '/text'} fillCloze={blockClozeAnswers(block,{showKeyIdeasAnswers},solutionMode)} {...editProps()} edited={isEdited(block.id, block.content !== undefined ? '/content' : '/text')} /></div></section>
  {/if}
{/snippet}

{#snippet teachingAtom(item)}
  {#if item.atom.kind === 'instruction'}
    <section class="teaching-atom" data-atom-id={item.atom.id}>
      {#each item.blocks as block, blockIndex (block.id)}{@render blockBody(block, blockIndex, true)}{/each}
    </section>
  {:else}
  <section class="theory-section teaching-atom" class:key-ideas-body={item.atom.kind==='key-ideas'} data-atom-id={item.atom.id}>
    <BookletSectionHeader kind={item.atom.kind} label={item.atom.label} labelPointer="/sourceAtom/label" subtitle={item.atom.visibleSubtitle} headerFill={item.atom.headerFill} editMode={editMode} rootId={item.blocks[0].id} rootIds={item.blocks.map((block) => block.id)} pointer={item.atom.visibleSubtitle !== undefined && item.blocks[0].sourceAtom.visibleSubtitle !== undefined ? "/sourceAtom/visibleSubtitle" : "/sourceAtom/description"} {onContentEdit} {onContentRevert} {onEditingChange} {isEdited} />
    <div class="body-box atom-body" class:review-body={item.atom.kind === "review"}>
      {#each item.blocks as block, blockIndex (block.id)}{@render blockBody(block, blockIndex, true)}{/each}
    </div>
  </section>
  {/if}
{/snippet}

<div class="preview-frame" class:compact-pages={compactPages} class:zoomed={zoom!==null} class:flow bind:this={previewFrame} style={`--preview-scale:${previewScale};--preview-height:${297 * previewScale}mm;--preview-width:${210 * previewScale}mm`}>
  <div class="preview-page" style={houseStyleVariables(houseStyleVersion)} data-house-style={houseStyleVersion}>
    {#if page.flexible ? page.isCover : bookletPageNumber === 1 && Number(page.pageNumber) === 1 && !answerSheet}
      <BookletCover pages={bookletPages} {anchorPrefix} {editMode} settings={presentation?.()?.cover}/>
    {:else}
      <article class="booklet-page" id={frontMatterAnchor?anchorPrefix+frontMatterAnchor:undefined} data-page-number={page.pageNumber} data-house-style={houseStyleVersion}>
        {#if page.section?.headingStyle !== 'none' && page.showTopicHeading !== false}<BookletHeading id={page.section?.exerciseNumber?`${anchorPrefix}exercise-topic-${page.section.exerciseNumber}`:undefined} kind={page.section?.headingStyle === 'difficulty'?'exercise':'main'}>{#if headingsEditable&&page.section.title}{@render headingEditor(page.section.title,page.section.phase==='front-matter'?{sectionId:page.section.sourceSectionId}:{topicId:page.section.topicId})}{:else}<EditableBookletText value={page.section?.title ?? ''} rootId={page.id} pointer="/section/title" {...editProps()} editMode={editMode&&!page.flexible} edited={isEdited(page.id, '/section/title')} />{/if}</BookletHeading>{/if}
        {#if page.showDifficultyHeading !== false && page.section?.difficultyTitle && !(page.section?.headingStyle === 'difficulty' && page.section.title?.trim().toLowerCase() === page.section.difficultyTitle.trim().toLowerCase())}<BookletHeading kind="exercise">{#if headingsEditable&&!page.section.exerciseNumber}{@render headingEditor(page.section.difficultyTitle,{sectionId:page.section.sourceSectionId})}{:else}<EditableBookletText value={page.section.difficultyTitle} rootId={page.id} pointer="/section/difficultyTitle" {...editProps()} editMode={editMode&&!page.flexible} edited={isEdited(page.id, '/section/difficultyTitle')} />{/if}</BookletHeading>{/if}
        <main>
          {#each displayItems as item, index (item.id)}
            {@const documentIds=item.blocks?.map(b=>b.id)??[item.block?.id??item.id]}
            <div role="group" class="document-group" class:editable-group={editMode&&!!documentActions} class:group-selected={editMode&&documentActions?.selected?.some(id=>documentIds.includes(id))} class:drop-before={dropBefore===documentIds[0]} data-document-group={documentIds.join(' ')}
              ondragover={e=>{if(editMode&&documentActions&&e.dataTransfer.types.includes('application/x-booklet-block')){e.preventDefault();dropBefore=documentIds[0];}}}
              ondragleave={e=>{if(dropBefore===documentIds[0]&&!e.currentTarget.contains(e.relatedTarget))dropBefore='';}}
              ondrop={e=>{dropBefore='';const id=e.dataTransfer.getData('application/x-booklet-block');if(editMode&&documentActions&&id){e.preventDefault();e.stopPropagation();documentActions.move(id,page.section?.sourceSectionId??page.section?.id,documentIds[0]);}}}>
            {#if editMode&&documentActions}<div class="document-group-tools">
              <button class="group-handle" aria-label="Select whole teaching group or question" aria-pressed={documentActions.selected?.some(id=>documentIds.includes(id))} draggable="true" ondragend={()=>dropBefore=''} ondragstart={e=>{if(!documentActions.selected?.some(id=>documentIds.includes(id)))documentActions.select(documentIds);e.dataTransfer.setData('application/x-booklet-block',documentIds[0]);}} onclick={e=>documentActions.select(documentIds,e)}>⠿</button>
              <button aria-label="Insert text before this group" onclick={()=>documentActions.insert('text',documentIds[0])}>+</button>
              {#if documentActions.commentsFor(documentIds).length}<button aria-label="Comments on this group" onclick={()=>documentActions.comment(documentIds)}>●</button>{/if}
            </div>{/if}
            {#if item.type === 'teaching-pair'}
              <div class="teaching-pair">{#each item.groups as group (group.id)}{@render teachingAtom(group)}{/each}</div>
            {:else if item.type === 'teaching-atom'}
              {@render teachingAtom(item)}
            {:else}
              {@render blockBody(item.block, index, false)}
            {/if}
            </div>
          {/each}
        </main>
        <BookletFooter pageNumber={page.flexible?page.pageNumber:bookletPageNumber} totalPages={page.totalPages??cover.totalPages} sourcePage={!page.flexible&&(page.continuation||bookletPageNumber!==Number(page.pageNumber))?page.pageNumber:null} feedback={cover.feedback} />
      </article>
      {#if editMode&&documentActions}<button class="document-end-insert" onclick={()=>documentActions.insert('text',null,page.blocks.at(-1)?.id)}>+ Write after this group</button>{/if}
    {/if}
  </div>
</div>

<style>
  .heading-edit{outline:none;cursor:text;border-radius:2px}.heading-edit:hover,.heading-edit:focus{box-shadow:0 0 0 1px currentColor}
  .practice-continuation-label{font-size:9pt;font-weight:600;margin-bottom:2mm}
  .document-group{display:block;position:relative}.document-group.editable-group{display:block;position:relative}.group-selected{outline:2px solid var(--booklet-blue);outline-offset:3px}.document-group-tools{position:absolute;left:-10mm;top:0;display:grid;gap:2px;z-index:4;opacity:.15}.document-group:hover>.document-group-tools,.document-group-tools:focus-within,.group-selected>.document-group-tools{opacity:1}.document-group-tools button{box-sizing:border-box;width:7mm;height:7mm;padding:0;min-height:0;border:1px solid var(--booklet-border);border-radius:4px;background:var(--booklet-white);color:var(--booklet-ink);font:14px system-ui;cursor:pointer}.group-handle{cursor:grab!important}.document-group.drop-before::before{content:'';position:absolute;left:0;right:0;top:-1.5mm;border-top:3px solid var(--booklet-blue);pointer-events:none;z-index:5}.document-end-insert{font:12px system-ui;color:var(--booklet-muted);border:1px dashed var(--booklet-border);background:transparent;padding:4px;opacity:.35}.document-end-insert:hover,.document-end-insert:focus{opacity:1}@media print{.document-group{display:block!important;outline:none!important}.document-group-tools,.document-end-insert{display:none!important}}
  .cloze-statement{display:grid;grid-template-columns:6mm minmax(0,1fr);gap:1mm;align-items:baseline}.cloze-number{grid-column:1;grid-row:1}.cloze-text{grid-column:2;grid-row:1;min-width:0}
  @media screen{.document-end-insert{position:absolute;left:0;top:calc(297mm + var(--studio-overflow-height,0px) + 4px);max-width:45%;white-space:nowrap}}
  .practice{position:relative}.editor-markers{position:absolute;right:-14mm;top:0;width:13mm;display:grid;justify-items:end;gap:.6mm;font:7px/1.3 system-ui;color:var(--booklet-muted)}.editor-difficulty{font-size:8px;font-weight:600;white-space:nowrap;cursor:help}.editor-bank{padding:0 3px;border:1px solid #9aa7b5;border-radius:3px;white-space:nowrap;cursor:help}.editor-bank[data-editor-bank=synced]{border-color:#52769a;background:#52769a;color:#fff}.editor-bank[data-editor-bank=local]{border-style:dashed}.editor-bank:not([data-editor-bank=synced],[data-editor-bank=local]){border-color:#b45309;background:#fef3c7;color:#92400e}.editor-shared{font:inherit;padding:0 3px;border:1px solid #6d5aa6;border-radius:3px;white-space:nowrap;background:#6d5aa6;color:#fff;cursor:pointer}.editor-shared:not([data-editor-shared=synced]){border-color:#b45309;background:#fef3c7;color:#92400e}@media print{.editor-markers{display:none!important}}
  /* Editor-only chillies sit under the question number, out of flow. */
  .practice[data-chillies]{--chilli:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%23d92d20' d='M12.5 5C14.5 7.500 13.500 11.500 10 13.500 7.500 15 4 15 1.500 14 4.500 13 6.500 11 7.500 8.500 8.200 6.800 8.600 5.200 10 4.600 10.900 4.200 11.900 4.300 12.500 5z'/%3E%3Cpath fill='%233f8f3a' d='M10.500 4.700C10.500 3 11.400 1.800 13 1.200L13.800 2.600C12.800 3 12.300 3.800 12.300 5z'/%3E%3C/svg%3E")}
  .practice[data-chillies] :global(b[data-question-number]){position:relative}
  .practice[data-chillies] :global(b[data-question-number]::after){content:'';position:absolute;left:0;top:calc(100% + .5mm);width:4.6mm;height:4.6mm;background:var(--chilli),var(--chilli),var(--chilli),var(--chilli);background-repeat:no-repeat;background-size:2.2mm 2.2mm;background-position:0 0,2.4mm 0,0 2.4mm,2.4mm 2.4mm;print-color-adjust:exact;-webkit-print-color-adjust:exact;pointer-events:none}
  .practice[data-chillies="1"] :global(b[data-question-number]::after){background-image:var(--chilli)}.practice[data-chillies="2"] :global(b[data-question-number]::after){background-image:var(--chilli),var(--chilli)}.practice[data-chillies="3"] :global(b[data-question-number]::after){background-image:var(--chilli),var(--chilli),var(--chilli)}
  @media print{.practice[data-chillies] :global(b[data-question-number]::after){display:none!important}}
.compact-pages.preview-frame{height:auto;min-height:0!important;overflow:visible;width:210mm;}
.compact-pages .preview-page{position:relative;left:0;transform:none;}
.compact-pages .booklet-page{height:auto;min-height:0;overflow:visible;}
.compact-pages .booklet-page main{flex:none;}
.compact-pages :global(.booklet-footer){position:static;margin-top:3mm;}
.numbered-content{display:grid;grid-template-columns:7mm minmax(0,1fr);gap:3mm}

  .preview-frame:has(:global(.maths-editor.inline)){overflow:visible;z-index:12}.booklet-page:has(:global(.maths-editor.inline)){overflow:visible}.preview-page[data-house-style] :global(.key-ideas-body){line-height:1.5}

  .flow main{break-before:avoid}
  .copy-space{visibility:hidden;pointer-events:none;user-select:none}.solution-diagram-space,.theory-question-space{display:contents}

  .flow.preview-frame{height:auto;overflow:visible}.flow .preview-page{position:relative;left:0;width:100%;transform:none}.flow .booklet-page{width:100%;height:auto;min-height:180mm;overflow:visible}.flow .booklet-page main{display:block;min-height:0;flex:none}.flow .booklet-page main>.document-group>section{margin-bottom:3mm}.flow :global(.booklet-footer){position:static;margin-top:6mm}.flow :global(.question-node),.flow :global(.me-layout),.flow :global(tr){break-inside:avoid}@media print{.flow.preview-frame,.flow .preview-page,.flow .booklet-page{width:180mm;height:auto;min-height:0;overflow:visible}.flow .booklet-page{display:block;padding:0}.flow :global(.booklet-footer){display:none}.flow .booklet-page main{padding:0}}
  .preview-frame { position:relative; width:100%; height:var(--preview-height); overflow:hidden; }
  .preview-page { position:absolute; top:0; left:50%; width:210mm; transform:translateX(-50%) scale(var(--preview-scale)); transform-origin:top center; }
  .booklet-page { --type-meta:8pt; --type-label:9pt; --type-body:11pt; --type-subheading:13pt; --type-heading:18pt; --type-display:22pt; position:relative; display:flex; width:210mm; height:297mm; padding:10mm 15mm; overflow:hidden; box-sizing:border-box; flex-direction:column; background:var(--booklet-white); color:var(--booklet-ink); font-family:'Nunito',system-ui,-apple-system,'Segoe UI',sans-serif; font-size:var(--type-body); line-height:1.32; }
  main { display:grid; align-content:start; gap:3mm; min-height:0; padding:0 0 11mm; flex:1; } h3 { margin:0 0 2mm; color:var(--booklet-blue); font-size:var(--type-subheading); }
  .theory-section { break-inside:avoid; }
  .body-box { padding:1.4mm 1.8mm 1.7mm; border:1px solid var(--booklet-border); border-top:0; background:var(--booklet-white); }
  .atom-body { display:grid; grid-template-columns:minmax(0,1fr); min-width:0; gap:1.8mm; }
  .teaching-pair { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:4mm; align-items:start; margin-bottom:3mm; }
  .teaching-pair > .teaching-atom { min-width:0; }
  .inside-atom { margin:0; }
  .example-row { display:grid; grid-template-columns:minmax(28mm,.55fr) minmax(0,1.45fr); gap:4mm; padding:1.4mm 0; border-top:.2mm solid var(--booklet-border); }
  .example-row:first-child { border-top:0; }
  .theory-solution { line-height:1.8; color:var(--booklet-blue); font-weight:400; }
  .theory-step { display:grid; grid-template-columns:5mm minmax(0,1fr); align-items:baseline; margin-bottom:.6mm; }
  .theory-step.unnumbered { grid-template-columns:minmax(0,1fr); }
  .example-columns { display:grid; grid-template-columns:repeat(var(--example-columns),minmax(0,1fr)); }
  .example-prompt { display:grid; grid-template-columns:6mm minmax(0,1fr); gap:1mm; }
  .stacked-prompt { padding-left:5mm; margin-bottom:1.5mm; }
  .worked-example-row { display:grid; grid-template-columns:minmax(25mm,.7fr) minmax(38mm,1.15fr) minmax(0,1.85fr); gap:var(--example-gap,3mm); padding:var(--example-above,2mm) 0 var(--example-below,4mm); min-height:var(--example-min,29mm); align-items:start; }
  .worked-example-row:not(:has(.example-explanation)) { grid-template-columns:minmax(0,1fr) minmax(0,1.35fr); }
  .worked-example-row + .worked-example-row { border-top:.2mm solid var(--booklet-border); }
  /* These prompts have no separate number cell: the legacy 6 mm label track
     otherwise receives the entire explanation and stretches the page. */
  .worked-example-row .example-prompt { display:block; }
  .example-working .stacked-prompt { padding-left:0; }
  .booklet-page :global(.katex) { white-space:nowrap; }
  .example-working .theory-step { margin-bottom:2mm; }
  .example-working .theory-step b { color:var(--booklet-red); font-weight:400; }
  .example-illustration { align-self:center; min-width:0; }
  .example-explanation { align-self:stretch; padding:4mm 1mm 1mm 2mm; border-left:.2mm solid var(--booklet-border); color:var(--booklet-muted); font-style:italic; }
  .number-line, .example-diagram { max-width:100%; margin:1mm auto; }
  .example-diagram[data-diagram-align="left"] { margin-left:0; margin-right:auto; }
  .example-diagram[data-diagram-align="right"] { margin-left:auto; margin-right:0; }
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
  figure { margin:0; text-align:center; } figure img { max-height:150mm; object-fit:contain; } figcaption { color:var(--booklet-muted); font-size:var(--type-meta); }
  .practice :global(.practice-question) { font-size:var(--type-body); }
  hr { width:100%; border:0; border-top:.3mm dashed var(--booklet-border); }
  @media screen{.zoomed.preview-frame{width:var(--preview-width);min-height:var(--preview-height)}.zoomed.flow .preview-page{width:210mm;transform:scale(var(--preview-scale));transform-origin:top left}.zoomed.flow .booklet-page{width:210mm}.zoomed .preview-page{left:0;transform:scale(var(--preview-scale));transform-origin:top left}}
  @media print { .preview-frame { width:210mm; height:297mm; overflow:visible; } .preview-page { position:static; transform:none; } }
</style>
