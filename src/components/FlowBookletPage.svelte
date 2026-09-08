<script>
  import TranscribedBookletPage from './TranscribedBookletPage.svelte';
  import CompactAnswerPage from './CompactAnswerPage.svelte';
  import { fragmentLayouts } from '../lib/booklet-pagination.js';
  let {project,page,pages=[],options={},compact=false,editMode=false,onContentEdit=null,onSpaceResize=null}=$props();
  const anchorPrefix=$derived(editMode?'screen-':'print-');
  const layouts=$derived(fragmentLayouts(page.blocks,project.settings.layoutOverrides.blockLayouts));
  const spaces=$derived(options.showResponseSpaces===false ? Object.fromEntries(page.blocks.flatMap(b=>{const ids=[];const visit=n=>{if(!n)return;if(n.id)ids.push([n.id,0]);n.children?.forEach(visit);};visit(b.content);return ids;})) : project.settings.layoutOverrides.answerSpaces);
</script>
{#if page.compactAnswers}
<CompactAnswerPage {project} {page} {pages} {compact} {editMode} {onContentEdit} {anchorPrefix}/>
{:else}
<TranscribedBookletPage {page} bookletPages={pages} runId={project.source?.runId??project.id} zoom="1" compactPages={compact} houseStyleVersion={project.settings.houseStyleVersion} blockLayouts={layouts} answerSpaceOverrides={spaces} diagramColourModes={project.settings.layoutOverrides.diagramColourModes} solutionMode={page.mode??'student'} answerSheet={page.mode!=='student'} showTheorySolutions={options.showTheorySolutions!==false} showKeyIdeasAnswers={options.showKeyIdeasAnswers===true} showReviewAnswers={options.showReviewAnswers===true} showIdentifyAnswers={options.showIdentifyAnswers===true} showGuidedPracticeAnswers={options.showGuidedPracticeAnswers===true} {editMode} {onContentEdit} {onSpaceResize} {anchorPrefix}/>
{/if}
