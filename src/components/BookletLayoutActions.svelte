<script>
 import {tick} from 'svelte';
 import FlowBookletPreview from './FlowBookletPreview.svelte';
 import {BLOCK_ROLES,blockRole,changeBlockRole,siblingParts,matchSiblingLayout,matchTableRows,layoutSpaceChain,changeSpaceChain,tightenStages,fitIsSafe,blockPages} from '../lib/booklet-layout-actions.js';
 import {measureBookletPage,pageSpaceLabel} from '../lib/booklet-page-space.js';
 import {blockDocuments} from '../lib/booklet-bulk-spacing.js';
 let {project,blockId,selection=null,pageMap={pages:[]},options={},onchange,onfinish=()=>{}}=$props();
 let message=$state(''),running=$state(false),candidate=$state.raw(null),accepted=$state(false),preview=$state(),source=$state(''),target=$state(''),tableId=$state(''),fromRows=$state('1'),toRows=$state('2'),baseline=null;
 let matchProperties=$state(['arrangement','workingSpace','clozeWidths','alignment','diagramWidth']),rowProperties=$state(['alignment','padding','rowHeight']);
 const propertyChoices=[['arrangement','Arrangement and spacing'],['workingSpace','Working space'],['clozeWidths','Cloze widths'],['alignment','Alignment'],['diagramWidth','Diagram width']];
 const block=$derived(project.sections.flatMap(s=>s.blocks).find(b=>b.id===blockId));
 const allBlocks=$derived(project.sections.flatMap(s=>s.blocks));
 const parts=$derived.by(()=>{const out=[];const walk=n=>{if(n?.children?.length){for(const c of n.children){out.push(c);walk(c);}}};walk(block?.content);return out;});
 const tables=$derived.by(()=>{const out=[];const walk=n=>{if(!n||typeof n!=='object')return;if(n.type==='table')out.push(n);for(const key of ['blocks','rows','slots','items'])for(const c of (n[key]??[]).flat())walk(c);};for(const {document}of blockDocuments(block??{}))walk(document);return out;});
 const chain=$derived(layoutSpaceChain(project,selection));
 const nextBlock=$derived(allBlocks[allBlocks.findIndex(b=>b.id===blockId)+1]);
 let previousBlock=null,previewBlock=null,fitGeneration=0;
 $effect(()=>{const id=blockId;if(previousBlock!==id){previousBlock=id;fitGeneration++;candidate=null;accepted=false;source='';target='';tableId='';message='';}});
 function commit(next){onfinish();onchange(next);message='Saved as one undo step.';}
 function attempt(fn){try{candidate=null;accepted=false;commit(fn());}catch(e){message=e.message;}}
 const rows=value=>{const values=value.split(',').map(v=>Number(v.trim())-1);if(values.some(v=>!Number.isInteger(v)||v<0)||new Set(values).size!==values.length)throw Error('Enter distinct row numbers separated by commas.');return values;};
 async function tighten(){
   onfinish();candidate=null;accepted=false;message='Checking page fit…';running=true;
   baseline=JSON.stringify(project);const selectedId=blockId,attempt=++fitGeneration,original=structuredClone($state.snapshot(project)),before=pageMap,destination=target||nextBlock?.id;previewBlock=selectedId;
   try{
     if(!before.ready||!destination)throw Error('Wait for pagination and choose a following block.');
     if(fitIsSafe(before,before,blockId,destination))throw Error('These blocks already fit on the same page.');
     for(const stage of tightenStages(original,blockId)){
       candidate=stage.project;await tick();const map=await preview.waitUntilReady();
       if(attempt!==fitGeneration||selectedId!==blockId)throw Error('Selection changed; preview again.');
       if(JSON.stringify(project)!==baseline)throw Error('The booklet changed during the preview. Please try again.');
       if(fitIsSafe(before,map,blockId,destination)){
         accepted=true;await preview.revealPage(blockPages(map,blockId)[0]);preview.jumpTo(blockId);await tick();
         const root=await preview.revealPage(blockPages(map,blockId)[0]),space=measureBookletPage(root);
         message=stage.label+' makes the blocks fit. '+(space?pageSpaceLabel(space.remainingMm):'');return;
       }
     }
     candidate=null;message='Cannot fit within the writing-space and diagram minima. Nothing changed.';
   }catch(e){candidate=null;message=e.message;}finally{running=false;}
 }
 function applyPreview(){if(previewBlock!==blockId||JSON.stringify(project)!==baseline){message='The selection or booklet changed; preview again.';candidate=null;accepted=false;return;}const next=candidate;candidate=null;accepted=false;commit(next);}
</script>
{#if block}
<section aria-label="Quick layout actions" class="layout-actions">
 <label>Block role<select aria-label="Block role" value={blockRole(block)} onchange={e=>attempt(()=>changeBlockRole(project,blockId,e.currentTarget.value))}>{#each BLOCK_ROLES as [role,label]}<option value={role}>{label}</option>{/each}</select></label>
 <details><summary>Tighten to fit</summary>
  <label>Bring onto this page<select aria-label="Fit target block" bind:value={target}><option value="">Next block</option>{#each allBlocks.slice(allBlocks.findIndex(b=>b.id===blockId)+1) as b}<option value={b.id}>{b.sourceAtom?.label??b.content?.label??b.id}</option>{/each}</select></label>
  <button disabled={running||!pageMap.ready} onclick={tighten}>{running?'Measuring…':'Preview tighter layout'}</button>
  {#if !pageMap.ready&&!running}<small>Open Questions only and wait for pagination to preview a fit.</small>{/if}
  {#if accepted}<button onclick={applyPreview}>Apply preview</button><button onclick={()=>{candidate=null;accepted=false;message='Preview cancelled. Nothing changed.';}}>Cancel preview</button>{/if}
 </details>
 <details><summary>Match siblings</summary>
  {#if parts.length}<label>Copy layout from part<select aria-label="Match sibling source" bind:value={source}><option value="">Choose part</option>{#each parts.filter(p=>siblingParts(project,blockId,p.id).length>1) as p}<option value={p.id}>{p.label??p.id}</option>{/each}</select></label><fieldset><legend>Properties to copy</legend>{#each propertyChoices as [value,label]}<label class="property-choice"><input type="checkbox" bind:group={matchProperties} {value}/>{label}</label>{/each}</fieldset><button disabled={!source||!matchProperties.length} onclick={()=>attempt(()=>matchSiblingLayout(project,blockId,source,matchProperties))}>Match sibling parts</button>{/if}
  {#if tables.length}<label>Table<select aria-label="Match table" bind:value={tableId}><option value="">Choose table</option>{#each tables as t}<option value={t.id}>{t.id} ({t.rows.length} rows)</option>{/each}</select></label><label>Source rows<input aria-label="Source rows" bind:value={fromRows}/></label><label>Target rows<input aria-label="Target rows" bind:value={toRows}/></label><fieldset><legend>Row properties to copy</legend>{#each [["alignment","Row alignment"],["padding","Cell padding"],["rowHeight","Row height"]] as [value,label]}<label class="property-choice"><input type="checkbox" bind:group={rowProperties} {value}/>{label}</label>{/each}</fieldset><button disabled={!tableId||!rowProperties.length} onclick={()=>attempt(()=>matchTableRows(project,blockId,tableId,rows(fromRows),rows(toRows),rowProperties))}>Match table rows</button>{/if}
  {#if !parts.length&&!tables.length}<p>Select a block containing parts or a table.</p>{/if}
 </details>
 <details><summary>What controls this space</summary>
  {#each chain as item (item.kind+item.id)}<fieldset><legend>{item.label}</legend>
   {#if item.kind==='boundary'}{#if item.removable}<button onclick={()=>attempt(()=>changeSpaceChain(project,selection,item))}>Remove {item.label.toLowerCase()}</button>{:else}<small>Content flows automatically onto this page.</small>{/if}
   {:else}{#each item.fields as [key,label,fallback,max=20,min=0]}<label>{label}<input aria-label={item.label+' '+label} type="number" {min} {max} step=".5" value={item.values[key]??fallback} onchange={e=>{if(e.currentTarget.value!==''&&e.currentTarget.validity.valid)attempt(()=>changeSpaceChain(project,selection,item,key,Number(e.currentTarget.value)));}}/></label>{/each}{/if}
  </fieldset>{/each}
  {#if !chain.length}<p>Select an item on the page to see its containers.</p>{/if}
 </details>
 {#if message}<p role="status">{message}</p>{/if}
</section>
{/if}
{#if candidate}<div class:probe-only={!accepted} class="fit-preview" aria-label="Tighter layout preview"><FlowBookletPreview bind:this={preview} project={candidate} edition="student" {options} zoom={1} selectedBlockId={blockId}/></div>{/if}
<style>
 .layout-actions{border-block:1px solid var(--border,#ccd5df);padding:8px 0;margin:8px 0;font:13px system-ui}details{margin:8px 0}summary{cursor:pointer;font-weight:600}label{display:grid;gap:4px;margin:6px 0}select,input,button{font:inherit;min-height:32px;box-sizing:border-box;max-width:100%;padding:4px;border:1px solid #aab5c2;border-radius:4px;color:inherit;background:var(--panel,#fff)}button{cursor:pointer;margin:3px}button:disabled{opacity:.5}fieldset{margin:8px 0;border:1px solid #ccd5df}legend{font-weight:600}.fit-preview{position:fixed;z-index:40;inset:8vh 380px 8vh 10vw;overflow:auto;background:#e9eef4;border:2px solid #52769a;width:830px;max-width:calc(100vw - 400px);padding:12px}.fit-preview.probe-only{left:-20000px;top:0;right:auto;bottom:auto;width:830px;max-width:none;height:600px;visibility:hidden;pointer-events:none}@media print{.layout-actions,.fit-preview{display:none}}
 .property-choice{display:flex;align-items:center;gap:6px}.property-choice input{min-height:0}
</style>

