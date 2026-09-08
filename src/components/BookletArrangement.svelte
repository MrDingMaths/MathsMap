<script>
 import {getContext} from 'svelte';
 import BookletRichText from './BookletRichText.svelte';
 import Tikz from './Tikz.svelte';
 import {sourceRegionStyles} from '../lib/diagram-source-region.js';
 import {resolveArrangement} from '../lib/booklet-arrangement.js';
 import {combinedExampleTikz} from '../lib/booklet-preview.js';
 let {block,arrangement,layoutOverrides={},selected='',onselect=null,onresize=null,onmeasure=null,onSpaceResize=null,onmove=null,assetUrl=s=>s,showSolutions=true,showSpaces=true,fillCloze=false,answerSpaceOverrides={},diagramColourModes={},editMode=false}=$props();
 const requestEdit=getContext('booklet-edit-request');
 const getLabels=getContext('booklet-labels');
 let contentWidth=$state(0);
 const resolved=$derived(resolveArrangement(block,arrangement,{...layoutOverrides,labels:getLabels?.()??layoutOverrides.labels},contentWidth>0?contentWidth*25.4/96:180));
 function choose(event,n){if(onselect){event.stopPropagation();onselect(n.id);}else if(requestEdit){event.stopPropagation();const e=resolved.entries.get(n.ref);requestEdit({rootId:block.type==='question'?block.content.id:block.id,pointer:'/content',selectedArrangementId:n.id,selectedNodeId:e?.nodeId,selectedDiagramId:e?.diagramId,origin:event.currentTarget});}}
 function key(event,n){if(['Enter',' '].includes(event.key)){event.preventDefault();choose(event,n);}}
 function start(event,n,index){
  event.preventDefault();event.stopPropagation();const el=event.currentTarget.parentElement,box=el.getBoundingClientRect(),children=n.children,total=children.reduce((a,c)=>a+(c.weight??1),0),left=children[index].weight??1,right=children[index+1].weight??1,start=event.clientX;
  let weights=children.map(c=>c.weight??1);const old=el.style.gridTemplateColumns;
  const move=e=>{const delta=(e.clientX-start)/box.width*total;weights[index]=Math.max(.15,Math.min(left+right-.15,left+delta));weights[index+1]=left+right-weights[index];el.style.gridTemplateColumns=weights.map(w=>`minmax(0,${w}fr)`).join(' ');};
  const finish=e=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',finish);window.removeEventListener('pointercancel',cancel);window.removeEventListener('keydown',escape);el.style.gridTemplateColumns=old;if(e?.type==='pointerup')onresize?.(n.id,weights);};
  const cancel=()=>finish();const escape=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();cancel();}};
  window.addEventListener('pointermove',move);window.addEventListener('pointerup',finish);window.addEventListener('pointercancel',cancel);window.addEventListener('keydown',escape);
 }
 function style(n){return `--arr-gap:${n.gap??2}mm;margin-top:${n.before??0}mm;margin-bottom:${n.after??0}mm;${n.inset!=null?`padding-left:${n.inset}mm;`:''}${n.width?`width:${n.width}mm;`:''}${n.keepInline?'white-space:nowrap;':''}${n.align==='center'?'margin-inline:auto;':n.align==='right'?'margin-left:auto;':''}${n.keepTogether===false?'break-inside:auto;':''}`;}
 const spaceHeight=(n,entry)=>answerSpaceOverrides[entry.ownerId]??n.height??entry.value;
 function commitMeasure(n,property,value){const entry=resolved.entries.get(n.ref);if(property==='height'&&entry?.kind==='space'&&onSpaceResize)onSpaceResize(entry.ownerId,value);else onmeasure?.(n.id,{[property]:value});}
 function resizeDiagramHeight(event,n){
  event.preventDefault();event.stopPropagation();
  const diagram=event.currentTarget.parentElement.querySelector('.arr-diagram'),box=diagram.getBoundingClientRect();
  const start=event.clientY,original=diagram.style.width;
  const initialWidth=diagram.offsetWidth*25.4/96;let width=initialWidth;
  const move=e=>{width=Math.max(5,Math.min(190,initialWidth*(box.height+e.clientY-start)/Math.max(1,box.height)));diagram.style.width=width+'mm';};
  const finish=e=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',finish);window.removeEventListener('pointercancel',cancel);window.removeEventListener('keydown',escape);diagram.style.width=original;if(e?.type==='pointerup')onmeasure?.(n.id,{width:Math.round(width*10)/10,align:'left'});};
  const cancel=()=>finish();const escape=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();cancel();}};
  window.addEventListener('pointermove',move);window.addEventListener('pointerup',finish);window.addEventListener('pointercancel',cancel);window.addEventListener('keydown',escape);
 }
 function measure(event,n,property){
  event.preventDefault();event.stopPropagation();const el=event.currentTarget.parentElement,entry=resolved.entries.get(n.ref),space=el.querySelector('.arr-space'),target=property==='height'?space:el,start=property==='width'?event.clientX:event.clientY,old=target.style.cssText;
  const initial=property==='height'?spaceHeight(n,entry):property==='width'?el.getBoundingClientRect().width*25.4/96:(n.after??0);let value=initial;const page=el.closest('.preview-page'),scale=page?page.getBoundingClientRect().width/page.offsetWidth:1;
  const move=e=>{value=Math.max(0,Math.min(190,initial+((property==='width'?e.clientX:e.clientY)-start)*25.4/96/scale));target.style[property==='after'?'marginBottom':property]=value+'mm';};
  const finish=e=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',finish);window.removeEventListener('pointercancel',cancel);window.removeEventListener('keydown',escape);target.style.cssText=old;if(e?.type==='pointerup')commitMeasure(n,property,Math.round(value*10)/10);};const cancel=()=>finish();const escape=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();cancel();}};
  window.addEventListener('pointermove',move);window.addEventListener('pointerup',finish);window.addEventListener('pointercancel',cancel);window.addEventListener('keydown',escape);
 }
</script>
{#snippet renderNode(n)}
 {@const entry=n.type==='item'?resolved.entries.get(n.ref):null}
 {#if !(entry?.kind==='label'&&!entry.value)}
 <!-- Selectable structural groups have keyboard equivalents in the adjacent structure panel. -->
 <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
 <div data-arrangement-id={n.id} class:arr-group={n.type==='group'} class:arr-row={n.direction==='row'} class:arr-item={n.type==='item'} class:zero-space={entry?.kind==='space'&&spaceHeight(n,entry)===0} class:hidden-space={entry?.kind==='space'&&(!showSpaces||spaceHeight(n,entry)===0)&&!onselect&&!editMode} class:selected={selected===n.id} class:interactive={!!onselect} class:theory-solution={entry?.role==='solution'&&entry?.kind!=='diagram'} class:solution-hidden={entry?.role==='solution'&&!showSolutions} class:labelled={n.children?.[0]&&resolved.entries.get(n.children[0].ref)?.kind==='label'&&resolved.entries.get(n.children[0].ref)?.value} class:label-item={entry?.kind==='label'} style={style(n)+(n.direction==='row'?`grid-template-columns:${n.children.map(c=>`minmax(0,${c.weight??1}fr)`).join(' ')};`:'')} role="group" aria-label={n.title??entry?.title??(n.direction==='row'?'Row':'Group')} tabindex={onselect||requestEdit?0:undefined} onclick={e=>choose(e,n)} onkeydown={e=>key(e,n)} draggable={!!onmove} ondragstart={e=>{e.stopPropagation();e.dataTransfer.setData('text/plain',n.id);}} ondragover={e=>{if(onmove){e.preventDefault();e.stopPropagation();e.currentTarget.classList.add('drop-target');e.currentTarget.dataset.dropPosition=n.type==='group'?'Move into group':e.clientY-e.currentTarget.getBoundingClientRect().top<e.currentTarget.clientHeight/2?'Move before':'Move after';}}} ondragleave={e=>e.currentTarget.classList.remove('drop-target')} ondrop={e=>{if(onmove){e.preventDefault();e.stopPropagation();e.currentTarget.classList.remove('drop-target');onmove(e.dataTransfer.getData('text/plain'),n.id,n.type==='group'?'inside':e.clientY-e.currentTarget.getBoundingClientRect().top<e.currentTarget.clientHeight/2?'before':'after');}}}>
 {#if n.type==='group'}
  {#each n.children as child (child.id)}{@render renderNode(child)}{/each}
  {#if onresize&&n.direction==='row'}{#each n.children.slice(0,-1) as child,i}<button class="column-handle" onclick={e=>e.stopPropagation()} style:left={n.children.slice(0,i+1).reduce((a,c)=>a+(c.weight??1),0)/n.children.reduce((a,c)=>a+(c.weight??1),0)*100+'%'} aria-label={'Resize column boundary '+(i+1)} onpointerdown={e=>start(e,n,i)} onkeydown={e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();e.stopPropagation();const w=n.children.map(c=>c.weight??1),d=e.key==='ArrowLeft'?-.1:.1;if(w[i]+d>.1&&w[i+1]-d>.1){w[i]+=d;w[i+1]-=d;onresize(n.id,w);}}}}>↔</button>{/each}{/if}
 {:else if !entry}<span role="alert">Content reference needs review: {n.ref}</span>
 {:else if entry.kind==='diagram'}
  {@const d=entry.value}{@const region=sourceRegionStyles(d.sourceRegion)}{@const combined=entry.overlays?.length===1?combinedExampleTikz(d,entry.overlays[0]):null}
  <div data-diagram-id={d.id} style:width={n.align==='stretch'?'100%':(n.width??d.widthMm??78)+'mm'} class="arr-diagram" class:grayscale={(d.colourMode??diagramColourModes[d.id])==='grayscale'}>
   {#if d.format==='tikz'}<Tikz code={showSolutions&&combined?combined:d.code} eager={true}/>{:else}<div style={region?.frame}><img style={region?.image} src={assetUrl(d.src)} alt={d.alt??'Diagram'}/></div>{/if}
   {#if !combined&&showSolutions}{#each entry.overlays??[] as overlay}<div class="arr-overlay">{#if overlay.format==='tikz'}<Tikz code={overlay.code} eager={true}/>{:else}<img src={assetUrl(overlay.src)} alt={overlay.alt??'Solution overlay'}/>{/if}</div>{/each}{/if}
  </div>
 {:else if entry.kind==='label'}<b>{entry.value}</b>
 {:else if entry.kind==='space'}
  {#if showSpaces||onselect}<div class="arr-space" class:space-edit={!!onselect||editMode&&!!onSpaceResize} style:height={spaceHeight(n,entry)+'mm'}></div>{/if}
 {:else}<BookletRichText alignRelations={!/prompt$/i.test(entry.field ?? "")} text={entry.value} {fillCloze}/>{#if onselect&&entry.kind==='document'&&entry.value.blocks[0]?.type==='paragraph'&&!entry.value.blocks[0]?.inlines?.length}<span class="empty-label">Empty paragraph</span>{/if}
 {/if}
 {#if onmeasure&&selected===n.id||onSpaceResize&&editMode&&showSpaces&&entry?.kind==='space'}
  {@const property=entry?.kind==='space'?'height':'after'}
  {#if entry?.kind==='diagram'}<button class="diagram-height-handle" aria-label="Resize diagram height" title="Drag to resize diagram height" onclick={e=>e.stopPropagation()} onpointerdown={e=>resizeDiagramHeight(e,n)} onkeydown={e=>{if(['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();e.stopPropagation();const d=e.currentTarget.parentElement.querySelector('.arr-diagram');const width=d.offsetWidth*25.4/96,height=d.offsetHeight*25.4/96;onmeasure(n.id,{width:Math.max(5,Math.min(190,width*(height+(e.key==='ArrowDown'?1:-1))/Math.max(1,height))),align:'left'});}}}></button>{:else}
  <button class="space-handle" class:worksheet-handle={true} onclick={e=>e.stopPropagation()} aria-label={entry?.kind==='space'?'Resize answer space':'Resize space below selection'} onpointerdown={e=>measure(e,n,property)} onkeydown={e=>{if(['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();e.stopPropagation();commitMeasure(n,property,Math.max(0,(entry?.kind==='space'?spaceHeight(n,entry):n[property]??0)+(e.key==='ArrowDown'?1:-1)));}}}></button>
  {/if}
  {#if entry?.kind==='diagram'||entry?.value?.blocks?.[0]?.type==='table'}<button class="width-handle" onclick={e=>e.stopPropagation()} aria-label="Resize selected width" onpointerdown={e=>measure(e,n,'width')} onkeydown={e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();e.stopPropagation();onmeasure(n.id,{width:Math.max(5,(n.width??entry.value.widthMm??entry.value.blocks?.[0]?.widthMm??50)+(e.key==='ArrowRight'?1:-1))});}}}>↔</button>{/if}
 {/if}
 </div>
 {/if}
{/snippet}
<div bind:clientWidth={contentWidth} class="booklet-arrangement" class:editing={!!onselect} data-arrangement-block={block.id}>{@render renderNode(resolved.tree.root)}</div>
<style>
 .booklet-arrangement{font-family:'Nunito',system-ui,-apple-system,'Segoe UI',sans-serif;color:#24282d}
 .booklet-arrangement :global(.drop-target){outline:2px solid #287b45!important}.booklet-arrangement :global(.drop-target):before{content:attr(data-drop-position);position:absolute;top:-22px;left:0;background:#287b45;color:white;padding:3px 6px;font:12px system-ui;z-index:9;pointer-events:none}
 .theory-solution{line-height:1.8;color:#1769aa;font-weight:400}
 .arr-diagram{position:relative}.arr-overlay{position:absolute;inset:0}
 /* Arrangement groups own graph spacing; the standalone TikZ margins add twice. */
 .arr-diagram :global(.tikz-wrap){margin:0;min-height:0;overflow:visible}
 .arr-diagram :global(.tikz-wrap svg){filter:none!important;display:block}
 .space-handle,.width-handle{position:absolute;z-index:5;font:12px system-ui;padding:0;min-height:18px;border:1px solid #268cff;background:white;color:#268cff;touch-action:none}.space-handle{bottom:-9px;left:45%;width:30px;cursor:ns-resize}.width-handle{right:-10px;top:40%;width:20px;height:30px;cursor:ew-resize}
 .booklet-arrangement{grid-column:1/-1;font-size:11pt;line-height:1.32;min-width:0}.arr-group{position:relative;display:flex;flex-direction:column;gap:var(--arr-gap);min-width:0;max-width:100%;box-sizing:border-box;break-inside:avoid}.arr-row{display:grid;align-items:start}.arr-item{position:relative;min-width:0;max-width:100%;box-sizing:border-box;break-inside:avoid}.labelled{padding-left:7mm}.labelled>.label-item{position:absolute;left:0;top:0;width:6mm}.arr-diagram{max-width:100%}.arr-diagram img{max-width:100%;height:auto;display:block}.arr-diagram :global(svg){width:100%;max-width:100%;height:auto}.grayscale{filter:grayscale(1) contrast(1.12)}.solution-hidden{visibility:hidden;pointer-events:none}.interactive{cursor:pointer;outline:1px dashed transparent}.arr-item.interactive:hover{outline-color:#7eacd4}.selected{outline:2px solid #268cff!important;outline-offset:2px}.editing .arr-group{min-height:6mm}.space-edit{min-height:18px;background:#edf5ff;border-bottom:1px dashed #6887a0}.empty-label{font:11px system-ui;color:#566d82}.empty-label{position:absolute;top:0;left:0}.column-handle{position:absolute;top:0;bottom:0;transform:translateX(-50%);width:18px;border:0;background:#268cff22;color:#164979;cursor:ew-resize;z-index:3;padding:0;opacity:0}.arr-row.selected>.column-handle,.column-handle:hover,.column-handle:focus{opacity:1}.editing [draggable]:hover{background-color:#268cff05}@media print{.selected,.interactive{outline:none!important}.column-handle,.empty-label{display:none}.space-edit{min-height:0;background:none;border:0}}

 /* Worksheet answer-space controls, matching MathsDatabase/css/print.css. */
 .space-edit{position:relative;box-sizing:border-box;min-height:0;margin:0;border:0;outline:1.5px dashed #94a3b8;outline-offset:-1.5px;border-radius:4px;background:transparent}
 .space-handle.worksheet-handle{bottom:0;left:0;right:0;width:100%;height:14px;min-height:14px;border:0;background:transparent;display:flex;align-items:center;justify-content:center;cursor:ns-resize;touch-action:none}
 @media print{.space-edit{min-height:0;margin-top:0;border:0;border-radius:0;background:none}.space-handle,.width-handle,.zero-space{display:none}.space-edit{outline:none}}
.hidden-space{display:none}
 .diagram-height-handle{position:absolute;z-index:6;bottom:-6px;left:0;width:100%;height:14px;min-height:14px;padding:0;border:0;background:transparent;cursor:ns-resize;touch-action:none}
 @media print{.diagram-height-handle{display:none}}
</style>
