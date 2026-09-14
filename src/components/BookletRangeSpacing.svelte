<script>
 import {onDestroy} from 'svelte';
 let {targets=[],canvas,oncommit}= $props();
 let draft=$state.raw(null);
 const properties=[['lineHeight','Line spacing',1.4],['spaceBefore','Space before (mm)',0],['spaceAfter','Space after (mm)',2]];
 function common(key,fallback){if(draft?.key===key)return draft.value;const values=targets.map(t=>t.node[key]??fallback);return values.every(v=>v===values[0])?values[0]:'';}
 function cancel(){for(const [el,style] of draft?.styles??[])if(el.isConnected)el.setAttribute('style',style);draft=null;}
 function preview(key,input){if(input===''||!Number.isFinite(Number(input)))return;const value=Number(input);if(draft&&draft.key!==key)commit();if(!draft){const elements=targets.flatMap(t=>[...canvas.querySelectorAll('[data-edit-root="'+CSS.escape(t.rootId)+'"][data-edit-path="'+CSS.escape(t.pointer)+'"] [data-id="'+CSS.escape(t.nodeId)+'"]')]);draft={key,value,targets:[...targets],styles:elements.map(el=>[el,el.getAttribute('style')??''])};}draft={...draft,value};for(const [el]of draft.styles)el.style[key==='lineHeight'?'lineHeight':key==='spaceBefore'?'marginTop':'marginBottom']=key==='lineHeight'?String(value):value+'mm';}
 function commit(){if(!draft)return;const {targets,key,value}=draft;cancel();oncommit(targets,key,value);}
 function key(event){if(event.key==='Escape'){event.preventDefault();event.stopPropagation();cancel();}else if(event.key==='Enter'){event.preventDefault();commit();}}
 onDestroy(cancel);
</script>
<div class="selection-spacing" role="group" aria-label="Selected paragraph spacing">
 <p>{targets.length} selected paragraphs</p>
 <div class="presets">{#each [1,1.15,1.5,2]as value}<button aria-pressed={common('lineHeight',1.4)===value} onclick={()=>{preview('lineHeight',value);commit();}}>{value===1?'Single':value===2?'Double':value}</button>{/each}</div>
 {#each properties as [property,label,fallback]}<label>{label}<input aria-label={label} type="number" min={property==='lineHeight'?1:0} step={property==='lineHeight'?.05:.5} value={common(property,fallback)} placeholder={common(property,fallback)===''?'Mixed':''} oninput={e=>preview(property,e.currentTarget.value)} onchange={commit} onkeydown={key}/></label>{/each}
</div>
<style>
 .presets{display:flex;gap:5px}.presets button{flex:1}button[aria-pressed=true]{outline:2px solid #52769a}label{display:grid;gap:6px;margin:12px 0}input,button{min-height:32px;font:inherit;color:inherit;background:var(--panel,#fff);border:1px solid var(--border,#cbd5e1);border-radius:5px;padding:6px;box-sizing:border-box}input{width:100%}p{font-size:13px}
</style>
