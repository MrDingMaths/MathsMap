<script>
  import EditorSplitView from './EditorSplitView.svelte';
  import ImageCropControls from './ImageCropControls.svelte';
  import { sourceRegionStyles, validSourceRegion } from '../lib/diagram-source-region.js';
  import Tikz from './Tikz.svelte';
  import { untrack } from 'svelte';
  let { diagram, alignment=null, initialDraft=null, ondraft=()=>{}, onsave=()=>{}, focused=false, sourceUrl='', colourMode='original', assetBase='' }=$props();
  let code=$state(untrack(()=>initialDraft?.code??diagram.code??diagram.src??'')),width=$state(untrack(()=>initialDraft?.width??diagram.widthMm??78)),error=$state('');
  let crop=$state(untrack(()=>initialDraft?.sourceRegion??diagram.sourceRegion??null)),colour=$state(untrack(()=>initialDraft?.colourMode??colourMode));
  let align=$state(untrack(()=>initialDraft?.align??alignment??diagram.align??'left'));
  let model=$state(untrack(()=>initialDraft?.mathematicalModel??diagram.mathematicalModel??null));
  let naturalSize=$state(null);
  let compilation=$state({state:'pending',error:''});
  let history=$state([]),future=$state([]),beforeChange=$state(null);
  const copy=v=>JSON.parse(JSON.stringify(v));
  function beginChange(){beforeChange??=copy(getValue());}
  function finishChange(){if(beforeChange&&JSON.stringify(beforeChange)!==JSON.stringify(getValue())){history=[...history,beforeChange];future=[];}beforeChange=null;}
  function restore(v){model=v.mathematicalModel??null;code=v.code;width=v.width;align=v.align??alignment;crop=v.sourceRegion;colour=v.colourMode;error='';ondraft(getValue());}
  function undo(){finishChange();if(!history.length)return;future=[...future,copy(getValue())];restore(history.at(-1));history=history.slice(0,-1);}
  function redo(){if(!future.length)return;history=[...history,copy(getValue())];restore(future.at(-1));future=future.slice(0,-1);}
  const region=$derived(sourceRegionStyles(crop));
  const src=$derived(code.startsWith('evidence/')?assetBase+code:code);
  export function getValue(){return {code,width,align,sourceRegion:crop,colourMode:colour,mathematicalModel:model?copy(model):null,valid:!error};}
  export function save(){error='';if(diagram.format==='tikz'&&code!==diagram.code&&compilation.state!=='ready'){error=compilation.state==='error'?'Fix the TikZ preview error before applying this draft.':'Wait for the current TikZ preview before applying.';return;}if(!Number.isFinite(width)||width<5||width>190){error='Diagram width must be between 5 and 190 mm.';return;}if(crop&&!validSourceRegion(crop)){error='Crop must lie within the original image.';return;}onsave(getValue());}
  function changed(){error='';ondraft(getValue());}
  function cancel(){model=null;code=diagram.code??diagram.src??'';width=diagram.widthMm??78;align=alignment??diagram.align??'left';crop=diagram.sourceRegion??null;colour=colourMode;error='';ondraft(null);}
</script>
<div class="diagram-draft" class:focused>
 {#snippet editPane()}<div onfocusin={beginChange} onfocusout={finishChange}>
  <div class="diagram-history"><button onclick={undo} disabled={!history.length&&!beforeChange}>Undo diagram edit</button><button onclick={redo} disabled={!future.length}>Redo diagram edit</button></div>
  <label>Image alignment<select aria-label="Image alignment" bind:value={align} onchange={changed}><option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option></select></label>
  <label>{diagram.format==='tikz'?'TikZ code':'Image path'}<textarea aria-label={diagram.format==='tikz'?'TikZ code':'Image path'} rows="18" bind:value={code} oninput={e=>{code=e.currentTarget.value;model=null;error='';changed();}}></textarea></label>
  <label>Diagram width (mm)<input type="number" min="5" max="190" step="1" bind:value={width} oninput={e=>{width=e.currentTarget.value===''?undefined:Number(e.currentTarget.value);changed();}}/></label>
  {#if diagram.format!=='tikz'}<label>Image colour<select aria-label="Image colour" bind:value={colour} onchange={changed}><option value="original">Original colours</option><option value="grayscale">Grayscale</option></select></label>
  {#if crop}<fieldset><legend>Crop (original image pixels)</legend>{#each ['x','y','width','height'] as field}<label>{field}<input type="number" min="0" value={crop[field]} onchange={e=>{crop={...crop,[field]:Number(e.currentTarget.value)};changed();}}/></label>{/each}<button onclick={()=>{crop=null;changed();}}>Show whole image</button></fieldset>{:else}<button disabled={!naturalSize} onclick={()=>{crop={x:0,y:0,width:naturalSize.width,height:naturalSize.height,sourceWidth:naturalSize.width,sourceHeight:naturalSize.height};changed();}}>Crop image</button>{/if}{/if}
  {#if diagram.format!=='tikz'}<ImageCropControls {src} value={crop} onbegin={beginChange} onend={finishChange} onchange={v=>{crop=v;changed();}}/>{/if}
  {#if !focused}<button onclick={save}>Save</button><button onclick={cancel}>Cancel</button>{/if}
  {#if error}<p role="alert">{error}</p>{/if}<p class="hint">Save applies your edit. Cancel restores the starting diagram.</p>
 </div>{/snippet}
 {#snippet previewPane()}<div class="diagram-preview" style:margin-left={align==='center'||align==='right'?'auto':'0'} style:margin-right={align==='center'?'auto':'0'} style:width={Math.max(5,Math.min(190,width||78))+'mm'}>{#if diagram.format==='tikz'}<Tikz {code} eager={true} draft={true} onstate={value=>compilation=value}/>{:else}<div style={region?.frame} class:grayscale={colour==='grayscale'}><img onload={e=>{naturalSize={width:e.currentTarget.naturalWidth,height:e.currentTarget.naturalHeight};}} style={region?.image} {src} alt={diagram.alt??'Diagram preview'}/></div>{/if}</div>{/snippet}
 {#if focused}<EditorSplitView editor={editPane} preview={previewPane} {sourceUrl}/>{:else}{@render editPane()}{@render previewPane()}{/if}
</div>
<style>
 .grayscale{filter:grayscale(1) contrast(1.12)}select{font:inherit;padding:6px}fieldset{display:flex;flex-wrap:wrap;gap:8px}fieldset label{max-width:120px}
 .diagram-draft.focused{display:block}.focused textarea{min-height:45vh;font-size:14px;background:var(--panel,#fff);color:inherit;padding:12px}.focused input{min-height:36px}.focused .hint{font-size:14px}
 .diagram-draft{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px}label{display:grid;gap:4px;margin:8px 0}textarea,input{box-sizing:border-box;width:100%;font:inherit}textarea{font-family:monospace;resize:vertical}button{margin:4px;padding:6px}.diagram-preview{max-width:100%;align-self:start}.diagram-preview :global(svg),img{width:100%;max-width:100%;height:auto}.hint{font-size:.75rem;color:#52697b}@media(max-width:1000px){.diagram-draft{grid-template-columns:1fr}}
@media(pointer:coarse){button,input{min-height:44px}}
</style>
