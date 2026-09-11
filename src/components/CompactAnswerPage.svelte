<script>
  import PracticeQuestionRenderer from './PracticeQuestionRenderer.svelte';
  import BookletFooter from './BookletFooter.svelte';
  import InlineContent from './InlineContent.svelte';
  import {resolvePreviewAssets} from '../lib/booklet-preview.js';
  let {project,page,pages=[],compact=false,editMode=false,onContentEdit=null,anchorPrefix=''}=$props();
  const settings=$derived(project.settings.compactAnswers);
  const assetUrl=src=>src?.startsWith('evidence/')?`/__booklet/full-imports/${encodeURIComponent(project.source?.runId??project.id)}/files/lanes/exact/${src}`:src;
  const title=section=>`Exercise ${section.exerciseNumber} · ${section.topicTitle}`;
  const firstFragment=(entry)=>!pages.some(p=>p.pageNumber<page.pageNumber&&p.mode===page.mode&&p.blocks.some(b=>b.id===entry.block.id))&&entry.block.flow.answerFragment===0;
  const questionLink=entry=>pages.some(p=>p.mode==='student'&&p.blocks.some(b=>b.id===entry.block.id))?`#${anchorPrefix}question-${entry.block.id}`:null;
</script>
<div class="preview-frame" class:compact-pages={compact}>
  <div class="preview-page" data-house-style={project.settings.houseStyleVersion}>
    <article class="booklet-page compact-answer-page" data-page-number={page.pageNumber} data-house-style={project.settings.houseStyleVersion}>
      {#if page.showAnswerHeading}<header id={`${anchorPrefix}answer-section-${page.mode}`}>{page.mode==='short'?'Short answers':'Worked solutions'}</header>{/if}
      <main>
        <div class="answer-columns" style={`grid-template-columns:repeat(${page.columns.length},minmax(0,1fr));gap:${settings.gutterMm}mm`}>
          {#each page.columns as entries}
            <div class="answer-column">
              {#each entries as entry,index}
                <section class="answer-fragment" id={firstFragment(entry)?`${anchorPrefix}answer-${page.mode}-${entry.block.id}`:undefined} data-answer-fragment={entry.block.flow.answerFragment}>
                  {#if index===0||entries[index-1].section.topicId!==entry.section.topicId}
                    <h2><InlineContent text={title(entry.section)}/></h2>
                  {/if}
                  <PracticeQuestionRenderer question={resolvePreviewAssets(entry.block,assetUrl)} number={entry.block.sourceOrder} showSpaces={false} showTitle={false} showShortAnswers={page.mode==='short'} showWorkedSolutions={page.mode==='worked'} answerColumnsLimit={1} compactAnswerSettings={settings} answerLabelWidthMm={entry.labelWidthMm} answerLink={questionLink(entry)} blockLayouts={project.settings.layoutOverrides.blockLayouts} diagramColourModes={project.settings.layoutOverrides.diagramColourModes} eagerDiagrams={true} {editMode} {onContentEdit}/>
                </section>
              {/each}
            </div>
          {/each}
        </div>
      </main>
      <BookletFooter pageNumber={page.pageNumber} totalPages={page.totalPages??pages.length}/>
    </article>
  </div>
</div>
<style>
  .preview-frame{width:210mm}.preview-page{width:210mm}.booklet-page{position:relative;box-sizing:border-box;width:210mm;height:297mm;padding:10mm 15mm;background:white;color:var(--booklet-ink);font-family:'Nunito',system-ui,sans-serif;overflow:visible}
  header{font-size:13pt;font-weight:800;margin:0 0 3mm;padding-bottom:2mm;border-bottom:.25mm solid var(--booklet-border)}
  .answer-columns{display:grid;align-items:start}.answer-column{min-width:0}.answer-fragment{min-width:0}
  h2{font-size:10pt;line-height:1.25;margin:3mm 0 1.5mm;padding-bottom:1mm;border-bottom:.2mm solid var(--booklet-border);font-weight:800}
  .answer-fragment:first-child h2{margin-top:0}
  .booklet-page :global(.tikz-wrap svg){filter:none!important;display:block}.booklet-page :global(.tikz-wrap){margin:0;min-height:0;overflow:visible}
  .compact-pages .booklet-page{height:auto;min-height:0;padding-bottom:3mm}.compact-pages :global(.booklet-footer){position:static;margin-top:4mm}
</style>
