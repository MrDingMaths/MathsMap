<script>
 import {diagramSizeTargets,targetWidths,setDiagramWidths,SIZE_MODES,sizeModeFor} from '../lib/booklet-diagram-size.js';
 // measure(id,mode) returns the rendered {widthMm,heightMm} or null.
 // layout: the current page map; rendered sizes are re-read whenever it changes.
 let {project,blockIds=[],edition='student',measure=()=>null,onchange,pageCount=0,layout=null}=$props();
 let mode=$state('question'),action=$state('height'),value=$state(40),includeFixed=$state(false),message=$state(''),root=$state();
 $effect(()=>{mode=sizeModeFor(edition);});
 export function focus(){root?.scrollIntoView({block:'nearest'});root?.querySelector('input,select')?.focus();}
 const rows=$derived(diagramSizeTargets(project,blockIds,mode));
 const chosen=$derived(rows.filter(r=>includeFixed||r.adjustable));
 const measured=$derived.by(()=>{layout;return Object.fromEntries(rows.map(r=>[r.id,measure(r.id,mode)]).filter(([,m])=>m));});
 const preview=$derived(targetWidths(chosen,action,Number(value),measured));
 const needsValue=$derived(['width','height','scale'].includes(action));
 const size=row=>{const m=measured[row.id];return m?Math.round(m.widthMm)+' × '+Math.round(m.heightMm)+' mm':(row.widthMm?row.widthMm+' mm wide':'auto');};
 function apply(){
  try{
   if(needsValue&&!(Number(value)>0))throw Error('Enter a positive value.');
   const changes=preview.filter(r=>r.targetMm!=null&&r.targetMm!==r.widthMm);
   if(!changes.length){message=action==='recommended'?'Every diagram is already within its recommended size.':'Nothing to change (diagrams without a rendered size cannot take a height).';return;}
   const before=pageCount;onchange(setDiagramWidths(project,changes,mode));
   message=`Resized ${changes.length} diagram${changes.length>1?'s':''} as one undo step.`+(before?` The booklet had ${before} pages; the page count updates when layout finishes.`:'');
  }catch(e){message=e.message;}
 }
</script>
<section bind:this={root} class="diagram-sizes" aria-label="Diagram sizes">
 <h3>Diagrams in {blockIds.length>1?'selection':'question'}</h3>
 {#if rows.length}
  <label>Edition<select aria-label="Diagram size edition" bind:value={mode}>{#each SIZE_MODES as [v,l]}<option value={v}>{l}</option>{/each}</select></label>
  <ul>{#each rows as row (row.id)}<li class:fixed={!row.adjustable}><span>{row.id}</span><small>{row.kind} · {size(row)}</small>{#if preview.find(p=>p.id===row.id)?.targetMm!=null}<small class="target">→ {preview.find(p=>p.id===row.id).targetMm} mm wide</small>{/if}</li>{/each}</ul>
  <label class="check"><input type="checkbox" bind:checked={includeFixed}/>Include drawing grids and images</label>
  <label>Change<select aria-label="Diagram size action" bind:value={action}>
   <option value="height">Set height (mm)</option><option value="width">Set width (mm)</option><option value="scale">Scale (%)</option>
   <option value="match-tallest">Match the tallest</option><option value="match-widest">Match the widest</option><option value="recommended">Recommended size</option>
  </select></label>
  {#if needsValue}<label>{action==='scale'?'Percent':'Millimetres'}<input aria-label="Diagram size value" type="number" min="1" max={action==='scale'?400:190} step=".5" bind:value/></label>{/if}
  <button onclick={apply} title="Alt+Shift+D">Apply to {chosen.length} diagram{chosen.length===1?'':'s'}</button>
 {:else}<p>No diagrams in this {mode==='question'?'question':'answer edition'}.</p>{/if}
 {#if message}<p role="status">{message}</p>{/if}
</section>
<style>
 .diagram-sizes{border-block:1px solid var(--border,#ccd5df);padding:8px 0;margin:8px 0;font:13px system-ui}h3{font-size:13px;margin:0 0 6px}
 ul{list-style:none;margin:6px 0;padding:0;display:grid;gap:4px}li{display:grid;gap:1px}li.fixed{opacity:.65}li small{color:var(--text-muted,#687482)}.target{color:#1f6f43!important}
 label{display:grid;gap:4px;margin:6px 0}.check{display:flex;align-items:center;gap:6px}select,input,button{font:inherit;min-height:32px;box-sizing:border-box;max-width:100%;padding:4px;border:1px solid #aab5c2;border-radius:4px;color:inherit;background:var(--panel,#fff)}.check input{min-height:0}button{cursor:pointer}
</style>
