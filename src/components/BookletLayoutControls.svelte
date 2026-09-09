<script>
  let { context, value, onchange } = $props();
  let error=$state(''), before=null, drag=null, history=$state([]), future=$state([]);
  const copy=v=>JSON.parse(JSON.stringify(v));
  const total=$derived(context.widthMm??180);
  const textWidth=$derived(value.textWidthMm??context.textWidthMm??(total-(value.gapMm??2))/1.8);
  function valid(next){if(next.textWidthMm!=null&&(next.textWidthMm<15||next.textWidthMm>total-(next.gapMm??2)-15))throw new Error('Leave at least 15 mm for both text and diagram.');if(next.gapMm!=null&&(next.gapMm<0||next.gapMm>20))throw new Error('Gap must be between 0 and 20 mm.');if(next.insetMm!=null&&(next.insetMm<0||next.insetMm>40))throw new Error('Inset must be between 0 and 40 mm.');if(next.diagramWidthMm!=null&&(next.diagramWidthMm<5||next.diagramWidthMm>190))throw new Error('Diagram width must be between 5 and 190 mm.');return next;}
  function preview(key,event){before??=copy(value);try{if(event.currentTarget.value==='')throw new Error('Enter a value in millimetres.');const next=valid({...value,[key]:Number(event.currentTarget.value)});error='';onchange(next);}catch(e){error=e.message;}}
  function finish(cancel=false){if(!before)return;if(cancel||error)onchange(before);else if(JSON.stringify(before)!==JSON.stringify(value)){history=[...history,before];future=[];}before=null;error='';}
  function key(event){if(['Escape','Enter'].includes(event.key)){event.preventDefault();event.stopPropagation();finish(event.key==='Escape');event.currentTarget.blur();}}
  function set(patch){history=[...history,copy(value)];future=[];onchange({...value,...patch});}
  function begin(event){event.preventDefault();before=copy(value);drag={x:event.clientX,width:textWidth,total:event.currentTarget.parentElement.getBoundingClientRect().width};event.currentTarget.setPointerCapture(event.pointerId);}
  function move(event){if(!drag)return;const width=Math.max(15,Math.min(total-(value.gapMm??2)-15,drag.width+(event.clientX-drag.x)/drag.total*total));onchange({...value,textWidthMm:Math.round(width*10)/10});}
  function end(cancel=false){drag=null;finish(cancel);}
  function resizeKey(event){if(event.key==='Escape'){event.preventDefault();event.stopPropagation();end(true);}if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();const width=Math.max(15,Math.min(total-(value.gapMm??2)-15,textWidth+(event.key==='ArrowLeft'?-1:1)*(event.shiftKey?5:1)));set({textWidthMm:width});}}
</script>
<section class="layout-controls" aria-label="Block layout">
 <div class="heading"><strong>Layout</strong><button disabled={!history.length} onclick={()=>{future=[...future,copy(value)];onchange(history.at(-1));history=history.slice(0,-1);}}>Undo layout</button><button disabled={!future.length} onclick={()=>{history=[...history,copy(value)];onchange(future.at(-1));future=future.slice(0,-1);}}>Redo layout</button><button onclick={()=>{history=[...history,copy(value)];future=[];onchange({});}}>Reset layout</button></div>
 {#if context.beside}
  <div class="fields">
   <label>Text column width (mm)<input aria-label="Text column width (mm)" type="number" step=".1" value={textWidth.toFixed(1)} onfocus={()=>before=copy(value)} oninput={e=>preview('textWidthMm',e)} onblur={()=>finish()} onkeydown={key}/></label>
   <label>Column gap (mm)<input aria-label="Column gap (mm)" type="number" step=".1" value={value.gapMm??2} onfocus={()=>before=copy(value)} oninput={e=>preview('gapMm',e)} onblur={()=>finish()} onkeydown={key}/></label>
   <label>Diagram sizing<select aria-label="Diagram sizing" value={value.diagramSizing??'fixed'} onchange={e=>set({diagramSizing:e.currentTarget.value})}><option value="fixed">Fixed width</option><option value="fit">Fit available space</option></select></label>
   {#if value.diagramSizing!=='fit'}<label>Diagram width (mm)<input aria-label="Diagram width (mm)" type="number" value={value.diagramWidthMm??context.diagramWidthMm??95} onfocus={()=>before=copy(value)} oninput={e=>preview('diagramWidthMm',e)} onblur={()=>finish()} onkeydown={key}/></label>{/if}
  </div>
  <div class="layout-divider"><span>Text</span><span>Diagram</span><!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
  <div tabindex="0" aria-label="Resize text and diagram columns" role="separator" aria-orientation="vertical" aria-valuenow={textWidth} aria-valuemin="15" aria-valuemax={total-(value.gapMm??2)-15} style:left={textWidth/total*100+'%'} onpointerdown={begin} onpointermove={move} onpointerup={()=>end()} onpointercancel={()=>end(true)} onkeydown={resizeKey}>↔</div></div>
 {/if}
 {#if context.inset}<label>Block inset (mm)<input aria-label="Block inset (mm)" type="number" value={value.insetMm??5} onfocus={()=>before=copy(value)} oninput={e=>preview('insetMm',e)} onblur={()=>finish()} onkeydown={key}/></label>{/if}
 {#if error}<p role="alert">{error}</p>{/if}
</section>
<style>
.layout-controls{padding:12px;border:1px solid var(--border,#ccd5df);border-radius:6px;margin-bottom:12px;font:14px system-ui;color:var(--text,#243348);background:var(--panel,#fff)}.heading,.fields{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.heading{margin-bottom:12px}.heading strong{margin-right:auto}label{display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap}input{width:85px}input,select,button{font:inherit;min-height:36px;border:1px solid var(--border,#b8c6d5);border-radius:4px;background:var(--panel,#fff);color:inherit;padding:4px 8px;box-sizing:border-box}.layout-divider{position:relative;display:flex;justify-content:space-between;align-items:center;margin:12px 0;background:var(--surface,#eaf1f8);min-height:44px;padding:0 10px}.layout-divider [role=separator]{min-height:36px;min-width:36px;display:grid;place-items:center;background:var(--panel,#fff);border:1px solid var(--border,#b8c6d5);border-radius:4px;position:absolute;transform:translateX(-50%);touch-action:none;cursor:ew-resize}.layout-controls p[role=alert]{color:#a52b20}@media(pointer:coarse){input,select,button{min-height:44px}}
</style>
