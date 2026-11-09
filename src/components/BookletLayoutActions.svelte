<script>
 import {tick,untrack} from 'svelte';
 import FlowBookletPreview from './FlowBookletPreview.svelte';
 import {BLOCK_ROLES,blockRole,changeBlockRole,siblingParts,matchSiblingLayout,matchTableRows,layoutSpaceChain,changeSpaceChain,fitIsSafe,blockPages,newSplits,newIssues} from '../lib/booklet-layout-actions.js';
 import {FIT_OPTIONS,FIT_DEFAULTS,searchFit,fitSuggestions} from '../lib/booklet-fit.js';
 import {setPageBoundary} from '../lib/booklet-workspace.js';
 import {logicalUnits,flowNumbers} from '../lib/booklet-flow.js';
 import {measureBookletPage} from '../lib/booklet-page-space.js';
 import {blockDocuments} from '../lib/booklet-bulk-spacing.js';
 import {optimisePagination} from '../lib/booklet-pagination-optimiser.js';
 import {probePagination,describeMove} from '../lib/booklet-probe-pagination.js';
 import {hasTeacherReview} from '../lib/booklet-import-spacing.js';
 let {project,blockId,selection=null,pageMap={pages:[]},edition='student',options={},onchange,onfinish=()=>{}}=$props();
 let fitGoal=$state('block'),fitOptions=$state({...FIT_DEFAULTS});
 export function fitNow(){fitGoal='block';return fit();}
 // fitted: a fit found by the last check, applied by clicking the button again.
 let message=$state(''),running=$state(false),candidate=$state.raw(null),fitted=$state.raw(null),preview=$state(),source=$state(''),target=$state(''),tableId=$state(''),fromRows=$state('1'),toRows=$state('2'),baseline=null;
 let matchProperties=$state(['arrangement','workingSpace','clozeWidths','alignment','diagramWidth']),rowProperties=$state(['alignment','padding','rowHeight']);
 const propertyChoices=[['arrangement','Arrangement and spacing'],['workingSpace','Working space'],['clozeWidths','Cloze widths'],['alignment','Alignment'],['diagramWidth','Diagram width']];
 const block=$derived(project.sections.flatMap(s=>s.blocks).find(b=>b.id===blockId));
 const allBlocks=$derived(project.sections.flatMap(s=>s.blocks));
 const parts=$derived.by(()=>{const out=[];const walk=n=>{if(n?.children?.length){for(const c of n.children){out.push(c);walk(c);}}};walk(block?.content);return out;});
 const tables=$derived.by(()=>{const out=[];const walk=n=>{if(!n||typeof n!=='object')return;if(n.type==='table')out.push(n);for(const key of ['blocks','rows','slots','items'])for(const c of (n[key]??[]).flat())walk(c);};for(const {document}of blockDocuments(block??{}))walk(document);return out;});
 const chain=$derived(layoutSpaceChain(project,selection));
 const nextBlock=$derived(allBlocks[allBlocks.findIndex(b=>b.id===blockId)+1]);
 let previousBlock=null,previewBlock=null,fitGeneration=0;
 $effect(()=>{const id=blockId;if(previousBlock!==id){previousBlock=id;fitGeneration++;candidate=null;fitted=null;exercise=null;source='';target='';tableId='';message='';if(fitGoal==='exercise'&&!untrack(()=>exerciseSection))fitGoal='block';}});
 function commit(next){onfinish();onchange(next);message='Saved as one undo step.';}
 function attempt(fn){try{candidate=null;fitted=null;commit(fn());}catch(e){message=e.message;}}
 // A found fit is stale once the goal, target or allowed reductions change.
 const fitKey=$derived(JSON.stringify([fitGoal,target,fitOptions]));
 $effect(()=>{fitKey;if(untrack(()=>fitted)&&untrack(()=>fitted.key)!==fitKey)fitted=null;});
 const rows=value=>{const values=value.split(',').map(v=>Number(v.trim())-1);if(values.some(v=>!Number.isInteger(v)||v<0)||new Set(values).size!==values.length)throw Error('Enter distinct row numbers separated by commas.');return values;};
 // Fit: bisect one uniform reduction (see booklet-fit.js) against the real
 // paginator in this edition; side effects are reported, never hidden.
 const identity=b=>b.flow?.continuationOf??b.continuationOf??b.id;
 // Combined editions also list each question on its answer pages; fit compares
 // only the side being fitted (question pages, or the answer edition's own pages).
 const side=map=>{const mode=edition==='student'||edition.startsWith('with-')?'student':edition;return {...map,pages:(map?.pages??[]).filter(p=>(p.mode??'student')===mode)};};
 const pageIndex=(map,id)=>{const mode=edition==='student'||edition.startsWith('with-')?'student':edition;return (map?.pages??[]).findIndex(p=>(p.mode??'student')===mode&&p.blocks.some(b=>identity(b)===id));};
 // Fit whole exercise: the Optimise pagination search limited to this exercise,
 // probed in the same hidden preview. Apply is one undo step.
 let exercise=$state.raw(null),progress=$state(''),confirmed=$state(false),probeEdition=$state(null),exerciseBaseline='';
 const reviewed=$derived(hasTeacherReview(project));
 const exerciseSection=$derived(project.sections.find(s=>s.phase==='practice'&&s.blocks.some(b=>b.id===blockId))??null);
 const {paginate,guard}=probePagination({show:async(next,ed)=>{candidate=next;probeEdition=ed;await tick();},probe:()=>preview});
 async function fitExercise(){
   onfinish();candidate=null;fitted=null;exercise=null;message='';running=true;progress='Measuring the current layout…';
   const original=project,selectedId=blockId,section=exerciseSection;exerciseBaseline=JSON.stringify(original);
   try{
     const outcome=await optimisePagination(original,{paginate,guard,named:reviewed&&confirmed,sectionIds:[section.id],onprogress:p=>{progress=`${p.trials} trials`;}});
     if(selectedId!==blockId||JSON.stringify($state.snapshot(project))!==exerciseBaseline)throw Error('The booklet changed during the check. Please try again.');
     const numbers=flowNumbers(original);
     exercise={...outcome,label:Object.fromEntries(Object.keys(numbers).map(id=>[id,'Q'+numbers[id]]))};
     message=outcome.moves.length?`${outcome.before.pages} → ${outcome.after.pages} pages with ${outcome.moves.length} change${outcome.moves.length===1?'':'s'}.`:'No safe change found in this exercise. Nothing changed.';
   }catch(e){message=e.message;}finally{running=false;progress='';candidate=null;probeEdition=null;}
 }
 function applyExercise(){
   if(!exercise?.moves.length)return;
   if(JSON.stringify($state.snapshot(project))!==exerciseBaseline){exercise=null;message='The booklet changed since the check. Run it again.';return;}
   const next=exercise.project;exercise=null;commit(next);
 }
 // Millimetres of `comingIds` content below the anchor page (the first or last
 // page holding `anchorIds`) less the space left on it, read from the probe.
 async function missingSpace(map,comingIds,anchor,anchorIds){
   const mode=edition==='student'||edition.startsWith('with-')?'student':edition;
   const pages=(map?.pages??[]).map((p,i)=>[p,i]).filter(([p])=>(p.mode??'student')===mode);
   const holding=ids=>pages.filter(([p])=>p.blocks.some(b=>ids.includes(identity(b)))).map(([,i])=>i);
   const anchorPages=holding(anchorIds),at=anchor==='first'?anchorPages[0]:anchorPages.at(-1);
   if(at==null)return null;
   const root=await preview.revealPage(at),space=root&&measureBookletPage(root);if(!space)return null;
   let below=0;
   for(const i of holding(comingIds).filter(i=>i>at)){
     const page=await preview.revealPage(i),paper=page?.querySelector('.booklet-page');if(!paper)return null;
     const scale=210/paper.getBoundingClientRect().width;
     below+=[...page.querySelectorAll('[data-question-id]')].filter(el=>!el.parentElement?.closest('[data-question-id]')&&comingIds.includes(el.dataset.questionId)).reduce((h,el)=>h+el.getBoundingClientRect().height*scale,0);
   }
   return below>0?Math.ceil(below-Math.max(0,space.remainingMm)):null;
 }
 async function fit(){
   if(fitted&&fitGoal!=='page'&&fitted.key===fitKey){applyFit();return;}
   onfinish();candidate=null;fitted=null;
   if(fitGoal==='page'){attempt(()=>setPageBoundary(project,blockId,'before'));return;}
   message='Checking page fit…';running=true;
   baseline=JSON.stringify(project);const selectedId=blockId,generation=++fitGeneration,original=project,before=side(pageMap),destination=target||nextBlock?.id;previewBlock=selectedId;
   try{
     if(!pageMap.ready)throw Error('Wait for pagination to finish.');
     // A question stored as a continuation pair is one unit: fit all of it.
     const unit=logicalUnits(original).find(u=>u.blocks.some(b=>b.id===blockId))?.blocks.map(b=>b.id)??[blockId];
     const unitPages=map=>[...new Set(unit.flatMap(id=>blockPages(map,id)))];
     const pages=unitPages(before);
     if(fitGoal==='block'&&pages.length===1)throw Error('This block already fits on its page.');
     if(fitGoal==='next'&&(!destination||fitIsSafe(before,before,blockId,destination)))throw Error(destination?'These blocks already fit on the same page.':'Choose a following block.');
     // Bringing a block up may shrink that block too.
     const incoming=fitGoal==='next'?logicalUnits(original).find(u=>u.blocks.some(b=>b.id===destination))?.blocks.map(b=>b.id)??[destination]:[];
     const ids=[...new Set([...unit,...incoming,...(fitOptions.otherBlocks?pages.flatMap(i=>before.pages[i].blocks.map(identity)):[])])];
     const goal=map=>fitGoal==='block'?unitPages(map).length===1&&!newSplits(before,map).some(id=>!unit.includes(id)):fitIsSafe(before,map,blockId,destination);
     let shortfall=null;const fittingMaps=new Map();
     // The most-reduced probe that still fails says how much space is missing:
     // the fitted content below its page, less the space left on that page.
     const missing=full=>missingSpace(full,fitGoal==='block'?unit:incoming,fitGoal==='block'?'first':'last',unit);
     const result=await searchFit(original,ids,{...fitOptions},async next=>{
       candidate=next;await tick();const full=await preview.waitUntilReady({allowIssues:true}),map=side(full);
       if(generation!==fitGeneration||selectedId!==blockId)throw Error('Selection changed; preview again.');
       if(JSON.stringify(project)!==baseline)throw Error('The booklet changed during the preview. Please try again.');
       const ok=goal(map);if(ok)fittingMaps.set(next,map);else if(shortfall===null)shortfall=await missing(full);return ok;
     });
     if(!result.project&&result.reason==='nothing-to-reduce'){candidate=original;await tick();shortfall=await missing(await preview.waitUntilReady({allowIssues:true}));}
     if(!result.project){candidate=null;const more=fitSuggestions(fitOptions),needs=shortfall>0?`Needs about ${shortfall} mm more. `:'';message=result.reason==='nothing-to-reduce'?'Nothing left to reduce with these options. '+needs+(more.length?'Allow: '+more.join(', ')+'.':''):'Does not fit even at the floors. '+needs+'Nothing changed.'+(more.length?' Also allow: '+more.join(', ')+'.':'');return;}
     // The search already paginated the winning candidate; no extra render.
     candidate=null;const added=newIssues(before,fittingMaps.get(result.project)??before).length;
     fitted={project:result.project,key:fitKey};
     message='Possible: fits at '+Math.round(result.t*100)+'% of the allowed reduction. '+(added?added+' new layout check'+(added>1?'s':'')+'. ':'')+'Click Apply fit to confirm.';
   }catch(e){candidate=null;message=e.message;}finally{running=false;}
 }
 function applyFit(){if(previewBlock!==blockId||JSON.stringify(project)!==baseline){message='The selection or booklet changed; check again.';fitted=null;return;}const next=fitted.project;fitted=null;commit(next);}
</script>
{#if block}
<section aria-label="Quick layout actions" class="layout-actions">
 <label>Block role<select aria-label="Block role" value={blockRole(block)} onchange={e=>attempt(()=>changeBlockRole(project,blockId,e.currentTarget.value))}>{#each BLOCK_ROLES as [role,label]}<option value={role}>{label}</option>{/each}</select></label>
 <div class="fit">
  <fieldset><legend>Goal</legend>
   <label class="property-choice"><input type="radio" name="fit-goal" value="block" bind:group={fitGoal}/>Fit this block on its page</label>
   <label class="property-choice"><input type="radio" name="fit-goal" value="next" bind:group={fitGoal}/>Bring a following block onto this page</label>
   <label class="property-choice"><input type="radio" name="fit-goal" value="page" bind:group={fitGoal}/>Start on the next page</label>
   {#if exerciseSection}<label class="property-choice"><input type="radio" name="fit-goal" value="exercise" bind:group={fitGoal}/>Fit whole exercise</label>{/if}
  </fieldset>
  {#if fitGoal==='exercise'}
   <small>Reorders questions within a difficulty band, tightens working space to its floor and puts short parts in columns, in this exercise only. The answer editions may not gain pages.</small>
   {#if reviewed}<label class="property-choice"><input type="checkbox" bind:checked={confirmed}/>This booklet has teacher comments; change it on request</label>{/if}
   <button disabled={running||!pageMap.ready||(reviewed&&!confirmed)} onclick={fitExercise}>{running?'Measuring…':'Preview exercise fit'}</button>
   {#if progress}<small role="status">{progress}</small>{/if}
   {#if exercise}<p class="summary">Pages {exercise.before.pages} → {exercise.after.pages}.</p>{#if exercise.moves.length}<ul class="moves" aria-label="Exercise changes">{#each exercise.moves as m}<li>{describeMove(m,exercise.label)}</li>{/each}</ul><button onclick={applyExercise}>Apply</button><button onclick={()=>{exercise=null;message='Discarded. Nothing changed.';}}>Discard</button>{/if}{/if}
  {:else if fitGoal==='next'}<label>Block to bring up<select aria-label="Fit target block" bind:value={target}><option value="">Next block</option>{#each allBlocks.slice(allBlocks.findIndex(b=>b.id===blockId)+1) as b}<option value={b.id}>{b.sourceAtom?.label??b.content?.label??b.id}</option>{/each}</select></label>{/if}
  {#if fitGoal!=='page'&&fitGoal!=='exercise'}<fieldset><legend>May change</legend>{#each FIT_OPTIONS as [key,label]}<label class="property-choice"><input type="checkbox" bind:checked={fitOptions[key]}/>{label}</label>{/each}</fieldset>{/if}
  {#if fitGoal!=='exercise'}<button disabled={running||(fitGoal!=='page'&&!pageMap.ready)} onclick={fit} title="Alt+Shift+F">{running?'Checking…':fitGoal==='page'?'Start on next page':fitted?'Apply fit':'Check fit'}</button>{/if}
  {#if !pageMap.ready&&!running&&fitGoal!=='page'}<small>Wait for pagination to check a fit.</small>{/if}
  {#if fitted&&fitGoal!=='page'&&fitGoal!=='exercise'}<button onclick={()=>{fitted=null;message='Cancelled. Nothing changed.';}}>Cancel</button>{/if}
 </div>
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
{#if candidate}<div class="fit-preview probe-only" aria-label="Tighter layout preview"><FlowBookletPreview bind:this={preview} project={candidate} edition={probeEdition??edition} {options} zoom={1} selectedBlockId={blockId}/></div>{/if}
<style>
 .layout-actions{padding:0;margin:0;font:13px system-ui}details{margin:8px 0}summary{cursor:pointer;font-weight:600}label{display:grid;gap:4px;margin:6px 0}select,input,button{font:inherit;min-height:32px;box-sizing:border-box;max-width:100%;padding:4px;border:1px solid #aab5c2;border-radius:4px;color:inherit;background:var(--panel,#fff)}button{cursor:pointer;margin:3px}button:disabled{opacity:.5}fieldset{margin:8px 0;border:1px solid #ccd5df}legend{font-weight:600}.fit-preview{position:fixed;z-index:40;inset:8vh 380px 8vh 10vw;overflow:auto;background:#e9eef4;border:2px solid #52769a;width:830px;max-width:calc(100vw - 400px);padding:12px}.fit-preview.probe-only{left:-20000px;top:0;right:auto;bottom:auto;width:830px;max-width:none;height:600px;visibility:hidden;pointer-events:none}@media print{.layout-actions,.fit-preview{display:none}}
 .property-choice{display:flex;align-items:center;gap:6px}.property-choice input{min-height:0}
</style>

