<script>
 import {tick,untrack} from 'svelte';
 import FlowBookletPreview from './FlowBookletPreview.svelte';
 import {diagramSizeTargets,targetWidths,setDiagramWidths,SIZE_MODES,sizeModeFor} from '../lib/booklet-diagram-size.js';
 // measure(id,mode) returns the rendered {widthMm,heightMm} or null.
 // layout: the current page map; rendered sizes are re-read whenever it changes.
 let {project,blockIds=[],edition='student',options={},measure=()=>null,onchange,pageCount=0,layout=null}=$props();
 let mode=$state('question'),action=$state('height'),value=$state(40),includeFixed=$state(false),message=$state(''),root=$state();
 $effect(()=>{mode=sizeModeFor(edition);});
 // Page-count preview: the edition the chosen diagrams print in is paginated in
 // a hidden probe before and after the change, so Apply shows its effect first.
 let probe=$state(),probeProject=$state.raw(null),probeEdition=$state('student'),pages=$state.raw(null),counting=$state(false),run=0,before={project:null,edition:'',count:0};
 const pageText=p=>p.after===p.before?`Pages stay at ${p.before}.`:`Pages ${p.before} → ${p.after}.`;
 async function count(p,ed){probeProject=p;probeEdition=ed;await tick();return (await probe.waitUntilReady({allowIssues:true})).pages.length;}
 async function previewPages(changes,token,key){
  const ed=mode==='question'?'student':mode;counting=true;
  try{
   if(before.project!==project||before.edition!==ed)before={project,edition:ed,count:await count(project,ed)};
   if(token!==run)return;
   const after=await count(setDiagramWidths(project,changes,mode),ed);
   if(token===run)pages={before:before.count,after,key};
  }catch{if(token===run)pages=null;}
  finally{if(token===run){counting=false;probeProject=null;}}
 }
 export function focus(){root?.scrollIntoView({block:'nearest'});root?.querySelector('input,select')?.focus();}
 const rows=$derived(diagramSizeTargets(project,blockIds,mode));
 const chosen=$derived(rows.filter(r=>includeFixed||r.adjustable));
 const measured=$derived.by(()=>{layout;return Object.fromEntries(rows.map(r=>[r.id,measure(r.id,mode)]).filter(([,m])=>m));});
 const preview=$derived(targetWidths(chosen,action,Number(value),measured));
 const needsValue=$derived(['width','height','scale'].includes(action));
 const pending=$derived(preview.filter(r=>r.targetMm!=null&&r.targetMm!==r.widthMm));
 const pendingKey=$derived(JSON.stringify([mode,pending.map(r=>[r.id,r.targetMm])]));
 // Debounced: a typed value is previewed once it settles.
 $effect(()=>{
  const key=pendingKey,changes=untrack(()=>pending),token=++run;pages=null;
  if(!changes.length||(needsValue&&!(Number(untrack(()=>value))>0))){counting=false;probeProject=null;return;}
  const timer=setTimeout(()=>previewPages(changes,token,key),600);
  return ()=>clearTimeout(timer);
 });
 const size=row=>{const m=measured[row.id];return m?Math.round(m.widthMm)+' × '+Math.round(m.heightMm)+' mm':(row.widthMm?row.widthMm+' mm wide':'auto');};
 function apply(){
  try{
   if(needsValue&&!(Number(value)>0))throw Error('Enter a positive value.');
   const changes=pending;
   if(!changes.length){message=action==='recommended'?'Every diagram is already within its recommended size.':'Nothing to change (diagrams without a rendered size cannot take a height).';return;}
   const previewed=pages?.key===pendingKey?pages:null;run++;counting=false;probeProject=null;pages=null;
   onchange(setDiagramWidths(project,changes,mode));
   message=`Resized ${changes.length} diagram${changes.length>1?'s':''} as one undo step.`+(previewed?' '+pageText(previewed):pageCount?` The booklet had ${pageCount} pages; the page count updates when layout finishes.`:'');
  }catch(e){message=e.message;}
 }
</script>
<section bind:this={root} class="diagram-sizes" aria-label="Diagram sizes">
 <h3>Diagrams in {blockIds.length>1?'selection':'question'}</h3>
  <label>Edition<select aria-label="Diagram size edition" bind:value={mode}>{#each SIZE_MODES as [v,l]}<option value={v}>{l}</option>{/each}</select></label>
 {#if rows.length}
  <ul>{#each rows as row (row.id)}<li class:fixed={!row.adjustable}><span>{row.id}</span><small>{row.kind} · {size(row)}</small>{#if preview.find(p=>p.id===row.id)?.targetMm!=null}<small class="target">→ {preview.find(p=>p.id===row.id).targetMm} mm wide</small>{/if}</li>{/each}</ul>
  <label class="check"><input type="checkbox" bind:checked={includeFixed}/>Include drawing grids and images</label>
  <label>Change<select aria-label="Diagram size action" bind:value={action}>
   <option value="height">Set height (mm)</option><option value="width">Set width (mm)</option><option value="scale">Scale (%)</option>
   <option value="match-tallest">Match the tallest</option><option value="match-widest">Match the widest</option><option value="recommended">Recommended size</option>
  </select></label>
  {#if needsValue}<label>{action==='scale'?'Percent':'Millimetres'}<input aria-label="Diagram size value" type="number" min="1" max={action==='scale'?400:190} step=".5" bind:value/></label>{/if}
  <p class="pages" role="status" aria-label="Page count preview">{counting?'Checking the page count…':pages?pageText(pages):''}</p>
  <button onclick={apply} title="Alt+Shift+D">Apply to {chosen.length} diagram{chosen.length===1?'':'s'}</button>
 {:else}<p>No diagrams in this {mode==='question'?'question':'answer edition'}.</p>{/if}
 {#if message}<p role="status">{message}</p>{/if}
</section>
{#if probeProject}<div class="diagram-probe" aria-hidden="true"><FlowBookletPreview bind:this={probe} project={probeProject} edition={probeEdition} {options} zoom={1}/></div>{/if}
<style>
 .diagram-sizes{border-block:1px solid var(--border,#ccd5df);padding:8px 0;margin:8px 0;font:13px system-ui}h3{font-size:13px;margin:0 0 6px}
 .pages:empty{display:none}.pages{margin:6px 0;font-weight:600}
 .diagram-probe{position:fixed;left:-20000px;top:0;width:830px;height:600px;overflow:hidden;visibility:hidden;pointer-events:none}
 @media print{.diagram-probe{display:none}}
 ul{list-style:none;margin:6px 0;padding:0;display:grid;gap:4px}li{display:grid;gap:1px}li.fixed{opacity:.65}li small{color:var(--text-muted,#687482)}.target{color:#1f6f43!important}
 label{display:grid;gap:4px;margin:6px 0}.check{display:flex;align-items:center;gap:6px}select,input,button{font:inherit;min-height:32px;box-sizing:border-box;max-width:100%;padding:4px;border:1px solid #aab5c2;border-radius:4px;color:inherit;background:var(--panel,#fff)}.check input{min-height:0}button{cursor:pointer}
</style>
