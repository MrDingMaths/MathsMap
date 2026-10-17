<script>
 import {containerSpacingFields} from '../lib/booklet-direct-layout.js';
 let {info,selection,oncommand,onedit,category='all'}= $props();
 let destination=$state('');
 const act=(command,options={})=>oncommand(command,options);
</script>
{#if info}
 {#if category==='all'}<strong>{info.entry?.title??info.node.title??'Selected group'}</strong>{/if}
 {#if category==='all'||category==='arrange'}
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
 {/if}
 {#if category!=='arrange'}
 {#if category!=='tables'&&info.node.type==='group'&&info.spaces?.length}<strong>Answer spaces in selected group</strong><label>Height (mm)<input aria-label="Selected group answer space height (mm)" type="number" min="0" max="180" step=".5" value={info.spaceHeight} placeholder="Mixed" onchange={e=>{if(e.currentTarget.value!==''&&e.currentTarget.validity.valid)act('answer-spaces',{value:Number(e.currentTarget.value)});}}/></label>{/if}
 {@const content=info.entry?.value?.blocks?.length===1?info.entry.value.blocks[0]:null}
 {#if containerSpacingFields(content).length&&(category==='tables')===(content.type==='table')}<strong>Inside {content.arrangement??content.type}</strong><div class="fields">{#each containerSpacingFields(content) as [key,label,fallback,max=20,min=0]}<label>{label}<input aria-label={'Container '+label.toLowerCase()} type="number" {min} {max} step={key==='lineHeight'?.05:.5} value={key==='widthMm'?(content[key]??''):content[key]??fallback} placeholder={key==='widthMm'?'Auto':undefined} onchange={e=>{if(key==='widthMm'&&e.currentTarget.value==='')act('document-spacing',{property:key,value:null});else if(e.currentTarget.value!==''&&e.currentTarget.validity.valid)act('document-spacing',{property:key,value:Number(e.currentTarget.value)});}}/></label>{/each}</div>{/if}
 {#if category==='tables'}
  {#if content?.type==='table'&&content.annotations?.some(a=>a.type==='arrow'&&['top','bottom'].includes(a.side))}<p>Arrows and labels reserve space above or below this table; their geometry is adjustable in the cell settings.</p>{/if}
  {#if content?.type==='table'&&onedit}<button onclick={onedit}>Edit cells, columns and borders</button>{:else}<p>Select a table or click inside a table cell for its settings.</p>{/if}
 {:else}
 {#if content&&onedit}<button onclick={onedit}>Edit internal settings</button>{/if}
 <small class="units">Size and spacing (mm)</small><div class="fields">
 {#if info.entry?.kind==='space'}<label>Height<input aria-label="Answer space height (mm)" type="number" min="0" max="180" step=".5" value={info.node.height??info.entry.value??0} onchange={e=>{if(e.currentTarget.value!=='')act('properties',{height:Number(e.currentTarget.value)});}}/></label>{/if}
 {#each [['width','Width (mm)'],['before',info.entry?.kind==='diagram'?'Space above image (mm)':'Space above (mm)'],['after','Space below (mm)'],['inset','Indent (mm)']] as [key,label]}<label>{label.replace(' (mm)','').replace('Space above image','Above').replace('Space above','Above').replace('Space below','Below')}<input aria-label={label==='Space above image (mm)'?label:'Layout '+label} type="number" min="0" max={key==='inset'?60:key==='width'?190:80} step=".5" placeholder={key==='width'?'Auto':'0'} value={key==='width'?(info.node[key]||info.entry?.value?.widthMm||''):info.node[key]??0} onchange={e=>{if(e.currentTarget.validity.valid)act('properties',{[key]:Number(e.currentTarget.value)});}}/></label>{/each}
 {#if info.parent?.direction==='row'}<label>Column proportion<input aria-label="Column proportion" type="number" min=".1" step=".1" value={info.node.weight??1} onchange={e=>act('properties',{weight:Number(e.currentTarget.value)})}/></label>{/if}
 {#if info.node.type==='group'}<label>Gap<input aria-label="Gap (mm)" type="number" min="0" max="30" step=".5" value={info.node.gap??2} onchange={e=>act('properties',{gap:Number(e.currentTarget.value)})}/></label><label title="A minimum height keeps space even when Gap is zero.">Minimum height<input aria-label="Group minimum height (mm)" type="number" min="0" max="180" step=".5" value={info.node.minHeight??0} onchange={e=>act('properties',{minHeight:Number(e.currentTarget.value)})}/></label>{:else}<label>Minimum height<input aria-label="Item minimum height (mm)" type="number" min="0" max="180" step=".5" value={info.node.minHeight??0} onchange={e=>act('properties',{minHeight:Number(e.currentTarget.value)})}/></label>{/if}
 <label>Alignment<select aria-label="Layout alignment" value={info.node.align??'left'} onchange={e=>act('properties',{align:e.currentTarget.value})}><option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option><option value="stretch">Stretch</option></select></label>
 <label>Vertical alignment<select aria-label="Layout vertical alignment" value={info.verticalAlign} onchange={e=>act('properties',{verticalAlign:e.currentTarget.value})}><option value="top">Top</option><option value="middle">Middle</option><option value="bottom">Bottom</option></select></label>
 </div>
 {#if info.node.type==='group'}<label><input type="checkbox" checked={info.node.keepTogether!==false} onchange={e=>act('properties',{keepTogether:e.currentTarget.checked})}/>Keep group together</label>{/if}
 {#if info.entry&&['text','document'].includes(info.entry.kind)}<label><input type="checkbox" checked={!!info.node.keepInline} onchange={e=>act('properties',{keepInline:e.currentTarget.checked})}/>Keep on one line</label>{/if}
 {#if info.node.type==='group'}<label>Dividing lines<select aria-label="Group dividing lines" value={info.node.rules??''} onchange={e=>act('properties',{rules:e.currentTarget.value||null})}><option value="">None</option><option value="internal">Internal</option><option value="grid">Grid</option></select></label>{/if}
 {/if}{/if}
 {#if category==='all'||category==='arrange'}<button onclick={()=>act('delete')}>{info.entry?.value?.blocks?.[0]?.type==='paragraph'?'Delete paragraph':'Delete selected item'}</button>{/if}
{:else}<p>Select a block handle on the page, or click its text or image.</p>{/if}
<style>
 .commands{display:flex;flex-wrap:wrap;gap:4px}label{display:flex;justify-content:space-between;align-items:center;gap:8px;font:13px system-ui}input{width:72px}select{max-width:190px}small{font:12px system-ui}button,input,select{font:13px system-ui;color:var(--text,#24282d);background:var(--panel,#fff);border:1px solid var(--border,#aab5c2);border-radius:4px;min-height:30px;box-sizing:border-box}button{padding:4px 7px;cursor:pointer}button:disabled{opacity:.45;cursor:default}input,select{padding:3px 5px}label{margin-block:4px}strong{display:block;margin-bottom:5px}
.fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px 12px}.fields label{display:grid;align-content:start;font-size:14px;margin:3px 0}.fields input,.fields select{width:100%;max-width:100%;font-size:14px;min-height:32px}.commands{margin:8px 0}button{font-size:14px;min-height:32px}.units{display:block;font:12px system-ui;color:var(--text-muted,#647181);margin:6px 0}.fields input[type=number]{width:100%}</style>
