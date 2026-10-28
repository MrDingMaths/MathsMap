<script module>
 // Bank records are replaced, never mutated, so summaries survive closing the picker.
 const rows=new WeakMap();
 // The light index survives closing the picker too; it is refreshed on each open.
 let indexRows=[];
</script>
<script>
 import { onMount, untrack } from 'svelte';
 import PracticeQuestionRenderer from './PracticeQuestionRenderer.svelte';
 import BookletRichText from './BookletRichText.svelte';
 import { questionSummary, questionSearchText } from '../lib/booklet-workspace.js';
 import { loadBankIndex, loadBankRecords } from '../lib/practice-question-storage.js';
 import { skills } from '../lib/data.js';
 let { bank = [], onrequestbank, oninsert, onclose, destination = 'End of section', title = 'Insert from question bank', actionLabel = 'Insert question' } = $props();
 let dialog, search, query = $state(''), filter = $state(''), selected = $state(''), loading = $state(false), error = $state(''), answers = $state('question'), limit = $state(40);
 // Without a loaded bank, the picker lists the light index and fetches the full
 // record only for the question previewed or inserted.
 const indexed = untrack(()=>!bank.length&&!!onrequestbank);
 let index = $state.raw(indexed?indexRows:[]), full = $state.raw(null);
 const haystack = row=>[row.title,row.search,row.source,row.id,row.difficulty].join(' ').toLowerCase();
 // Build each question's search text once per bank, and filter after typing pauses.
 const records = $derived(bank.length?bank.map(question=>{let row=rows.get(question);if(!row){row={question,id:question.id,difficulty:question.classification?.difficulty,...questionSummary(question,skills),search:questionSearchText(question)};row.haystack=haystack(row);rows.set(question,row);}return row;})
  :index.map(entry=>{let row=rows.get(entry);if(!row){row={...entry,title:questionSummary({title:entry.title,classification:{primarySkillId:entry.skillId}},skills).title};row.haystack=haystack(row);rows.set(entry,row);}return row;}));
 $effect(()=>{const next=query.toLowerCase().trim();if(!next){filter='';return;}const timer=setTimeout(()=>filter=next,120);return()=>clearTimeout(timer);});
 const results = $derived(filter?records.filter(r=>r.haystack.includes(filter)):records);
 const current = $derived(results.find(r=>r.id===selected)??results[0]);
 const question = $derived(current?.question??(full?.id===current?.id?full:null));
 $effect(()=>{const id=!current?.question&&current?.id;if(!id||full?.id===id)return;let live=true;loadBankRecords([id]).then(([record])=>{if(live)full=record??{id,missing:true};}).catch(e=>{if(live)error=e.message;});return()=>live=false;});
 async function load(){loading=true;error='';try{if(indexed){try{index=indexRows=(await loadBankIndex()).questions;return;}catch(e){console.warn('Bank index unavailable; loading full records.',e);}}const result=await onrequestbank?.();if(result?.error)error=result.error;}catch(e){error=e.message;}finally{loading=false;}}
 onMount(()=>{const origin=document.activeElement;dialog.showModal();search?.focus();load();return()=>{dialog?.close();origin?.focus?.({preventScroll:true});};});
 async function insert(){if(!current)return;try{const record=current.question??(await loadBankRecords([current.id]))[0];if(!record)throw Error('This question is no longer in the bank.');await oninsert(record);onclose();}catch(e){error=e.message;}}
</script>
<dialog bind:this={dialog} class="bank-picker" aria-labelledby="bank-picker-title" oncancel={event=>{event.preventDefault();onclose();}}>
 <header><h2 id="bank-picker-title">{title}</h2><button aria-label="Close question picker" onclick={onclose}>×</button></header>
 <div class="picker-search"><input bind:this={search} aria-label="Search bank questions" placeholder="Search questions, skills or source…" bind:value={query} oninput={()=>limit=40}/><span>{results.length} questions</span></div>
 <div class="picker-body">
  <section class="results" aria-label="Question results">
   {#if loading}<p role="status">Loading questions…</p>{:else if error}<p role="alert">{error}</p><button onclick={load}>Retry</button>{:else if !results.length}<p>No matching questions.</p>{/if}
   {#each results.slice(0,limit) as result}<button class="result" class:active={current?.id===result.id} aria-pressed={current?.id===result.id} onclick={()=>{selected=result.id;answers='question';}}><strong>{result.title}</strong><span class="excerpt"><BookletRichText text={result.excerpt}/></span><small>{result.difficulty}{result.source?' · '+result.source:''}</small></button>{/each}
   {#if results.length>limit}<button onclick={()=>limit+=40}>Show more questions</button>{/if}
  </section>
  <section class="preview" aria-label="Question preview">
   {#if current}<div class="preview-tools"><strong>{current.title}</strong><select aria-label="Preview question or answers" bind:value={answers}><option value="question">Question</option><option value="short">Short answers</option><option value="worked">Worked solution</option></select></div>
    {#if question?.missing}<p role="alert">This question is no longer in the bank.</p>{:else if !question}<p role="status">Loading question…</p>{:else}{#key current.id+answers}<div class="preview-paper"><PracticeQuestionRenderer preserveDiagramWidths={true} {question} showTitle={false} showSpaces={answers==='question'} showShortAnswers={answers==='short'} showWorkedSolutions={answers==='worked'} answerColumnsLimit={1} blockLayouts={question.presentation?.layoutOverrides?.blockLayouts??{}} diagramWidthOverrides={question.presentation?.layoutOverrides?.diagramWidths??{}}/></div>{/key}{/if}
    <details><summary>Question details</summary><p>{current.source}</p><code>{current.id}</code></details>
   {:else}<p>Select a question to preview it.</p>{/if}
  </section>
 </div>
 <footer><span>Insert: {destination}</span><button onclick={onclose}>Cancel</button><button class="primary" disabled={!current||loading||!!error} onclick={insert}>{actionLabel}</button></footer>
</dialog>
<style>
 .bank-picker{box-sizing:border-box;width:min(1200px,calc(100vw - 32px));height:calc(100dvh - 48px);max-height:none;max-width:none;padding:0;border:1px solid var(--border,#ccd5df);border-radius:10px;background:var(--panel,#fff);color:var(--text,#24282d);font:14px system-ui;overflow:hidden}.bank-picker[open]{display:flex;flex-direction:column}.bank-picker::backdrop{background:#14233380}header,footer,.picker-search,.preview-tools{display:flex;align-items:center;gap:12px;padding:12px 16px}header,footer{border-bottom:1px solid var(--border,#ccd5df)}header h2{margin:0;flex:1;font-size:18px}footer{border-top:1px solid var(--border,#ccd5df);border-bottom:0}footer span{flex:1}.picker-search input{flex:1}.picker-search span{color:var(--text-muted,#687482)}.picker-body{display:grid;grid-template-columns:340px minmax(0,1fr);flex:1;min-height:0}.results,.preview{overflow:auto;min-width:0;padding:12px 16px}.results{border-right:1px solid var(--border,#ccd5df)}.preview{background:var(--app-canvas,#eef1f5)}.result{display:block;width:100%;text-align:left;padding:12px;margin-bottom:8px}.result strong,.result small,.excerpt{display:block}.result small{color:var(--text-muted,#687482);font-size:12px;margin-top:6px}.excerpt{max-height:52px;overflow:hidden;margin-top:5px}.excerpt :global(p){margin:0}.active{border-color:#268cff;background:#edf6ff}.preview-tools{padding:0 0 12px;justify-content:space-between}.preview-paper{background:#fff;color:#24282d;padding:20px;overflow:auto}.preview details{margin-top:16px}.preview code{overflow-wrap:anywhere}button,input,select{font:inherit;min-height:32px;padding:6px 10px;border:1px solid var(--border,#c7d0da);border-radius:5px;background:var(--panel,#fff);color:inherit}button{cursor:pointer}.primary{background:#286647;color:white}button:disabled{opacity:.5}:focus-visible{outline:2px solid #268cff;outline-offset:2px}@media(max-width:750px){.picker-body{grid-template-columns:1fr;overflow:auto}.results{max-height:200px;border-right:0}.preview{overflow:visible}footer{flex-wrap:wrap}footer span{flex-basis:100%}}
</style>
