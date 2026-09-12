<script>
 let {info,selection,oncommand}= $props();
 let destination=$state('');
 const act=(command,options={})=>oncommand(command,options);
</script>
{#if info}
 <strong>{info.entry?.title??info.node.title??'Selected group'}</strong>
 <div class="commands">
  <button onclick={()=>act('before')}>Move before</button><button onclick={()=>act('after')}>Move after</button>
  <button onclick={()=>act('out')}>Move out of column</button><button onclick={()=>act('full-width')}>Full width</button>
  <button onclick={()=>act('group',{ids:selection.ids??[info.node.id]})}>Group</button><button disabled={info.node.type!=='group'} onclick={()=>act('ungroup')}>Ungroup</button>
  {#if info.node.type==='group'}<button onclick={()=>act('properties',{direction:'stack'})}>Stack</button><button onclick={()=>act('properties',{direction:'row'})}>Side by side</button>{/if}
 </div>
 <label>Destination<select aria-label="Layout destination" bind:value={destination}><option value="">Choose item or group</option>{#each info.options.filter(o=>o.id!==info.node.id) as o}<option value={o.id}>{o.label}</option>{/each}</select></label>
 <div class="commands">
  <button disabled={!destination} onclick={()=>act('move',{targetId:destination,position:'before'})}>Above destination</button><button disabled={!destination} onclick={()=>act('move',{targetId:destination,position:'after'})}>Below destination</button>
  <button disabled={!destination} onclick={()=>act('beside',{targetId:destination,side:'left'})}>Left of destination</button><button disabled={!destination} onclick={()=>act('beside',{targetId:destination,side:'right'})}>Right of destination</button>
  <button disabled={!info.options.find(o=>o.id===destination)?.group} onclick={()=>act('move',{targetId:destination,position:'inside'})}>Move into group</button>
 </div>
 {#each [['width','Width (mm)'],['before',info.entry?.kind==='diagram'?'Space above image (mm)':'Space above (mm)'],['after','Space below (mm)'],['inset','Indent (mm)']] as [key,label]}<label>{label}<input aria-label={label==='Space above image (mm)'?label:'Layout '+label} type="number" min="0" max="190" step=".5" value={info.node[key]??(key==='width'?info.entry?.value?.widthMm:0)??0} onchange={e=>act('properties',{[key]:Number(e.currentTarget.value)})}/></label>{/each}
 {#if info.parent?.direction==='row'}<label>Column proportion<input aria-label="Column proportion" type="number" min=".1" step=".1" value={info.node.weight??1} onchange={e=>act('properties',{weight:Number(e.currentTarget.value)})}/></label>{/if}
 {#if info.node.type==='group'}<label>Gap (mm)<input type="number" min="0" max="30" step=".5" value={info.node.gap??2} onchange={e=>act('properties',{gap:Number(e.currentTarget.value)})}/></label>{/if}
 <label>Alignment<select aria-label="Layout alignment" value={info.node.align??'left'} onchange={e=>act('properties',{align:e.currentTarget.value})}><option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option><option value="stretch">Stretch</option></select></label>
 <label>Vertical alignment<select aria-label="Layout vertical alignment" value={info.verticalAlign} onchange={e=>act('properties',{verticalAlign:e.currentTarget.value})}><option value="top">Top</option><option value="middle">Middle</option><option value="bottom">Bottom</option></select></label>
 <small>Aligns: {info.verticalScope}</small>
 <button onclick={()=>act('delete')}>{info.entry?.value?.blocks?.[0]?.type==='paragraph'?'Delete paragraph':'Delete selected item'}</button>
{:else}<p>Select a block handle on the page, or click its text or image.</p>{/if}
<style>
 .commands{display:flex;flex-wrap:wrap;gap:4px}label{display:flex;justify-content:space-between;align-items:center;gap:8px;font:13px system-ui}input{width:72px}select{max-width:190px}small{font:12px system-ui}button,input,select{font:13px system-ui;color:var(--text,#24282d);background:var(--panel,#fff);border:1px solid var(--border,#aab5c2);border-radius:4px;min-height:30px;box-sizing:border-box}button{padding:4px 7px;cursor:pointer}button:disabled{opacity:.45;cursor:default}input,select{padding:3px 5px}label{margin-block:4px}strong{display:block;margin-bottom:5px}
</style>
