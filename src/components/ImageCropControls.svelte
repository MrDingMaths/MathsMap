<script>
 import {onDestroy} from 'svelte';
 import {validSourceRegion} from '../lib/diagram-source-region.js';
 let {src,value=null,onchange=()=>{},onbegin=()=>{},onend=()=>{}}=$props();
 let image,frame,size=$state(null),error=$state(''),cancelDrag=null;
 const region=$derived(value??(size?{x:0,y:0,width:size.width,height:size.height,sourceWidth:size.width,sourceHeight:size.height}:null));
 onDestroy(()=>cancelDrag?.());
 function begin(e,handle){if(!size)return;e.preventDefault();e.stopPropagation();onbegin();const before=value?{...value}:null,start={...region},box=image.getBoundingClientRect(),x=e.clientX,y=e.clientY;
  const move=event=>{const dx=(event.clientX-x)/box.width*size.width,dy=(event.clientY-y)/box.height*size.height;let left=start.x,top=start.y,right=left+start.width,bottom=top+start.height;
   if(handle==='move'){left=Math.max(0,Math.min(size.width-start.width,left+dx));top=Math.max(0,Math.min(size.height-start.height,top+dy));right=left+start.width;bottom=top+start.height;}
   else{if(handle.includes('w'))left=Math.max(0,Math.min(right-1,left+dx));if(handle.includes('e'))right=Math.max(left+1,Math.min(size.width,right+dx));if(handle.includes('n'))top=Math.max(0,Math.min(bottom-1,top+dy));if(handle.includes('s'))bottom=Math.max(top+1,Math.min(size.height,bottom+dy));}
   onchange({x:Math.round(left),y:Math.round(top),width:Math.max(1,Math.round(right)-Math.round(left)),height:Math.max(1,Math.round(bottom)-Math.round(top)),sourceWidth:size.width,sourceHeight:size.height});};
  const end=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end);window.removeEventListener('pointercancel',cancel);window.removeEventListener('keydown',key);cancelDrag=null;onend();};const cancel=()=>{onchange(before);end();};const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();cancel();}};cancelDrag=cancel;window.addEventListener('pointermove',move);window.addEventListener('pointerup',end);window.addEventListener('pointercancel',cancel);window.addEventListener('keydown',key);
 }
 function key(e){if(!region||!e.key.startsWith('Arrow'))return;e.preventDefault();const step=e.shiftKey?10:1;onchange({...region,x:Math.max(0,Math.min(region.sourceWidth-region.width,region.x+(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0))),y:Math.max(0,Math.min(region.sourceHeight-region.height,region.y+(e.key==='ArrowDown'?step:e.key==='ArrowUp'?-step:0)))});}
</script>
<div class="crop-controls"><strong>Crop image</strong><p>Drag the rectangle to move the crop; drag its edges to resize. Arrow keys move it; Shift moves 10 pixels. Escape cancels a drag.</p>
 <div class="crop-frame" bind:this={frame}><img bind:this={image} {src} alt="Full original for cropping" draggable="false" onload={e=>{size={width:e.currentTarget.naturalWidth,height:e.currentTarget.naturalHeight};error='';}} onerror={()=>error='The original image could not be loaded. Check its path or restore the original source.'}/>
 {#if size&&region&&validSourceRegion(region)}<div class="crop-rectangle" style:left={region.x/size.width*100+'%'} style:top={region.y/size.height*100+'%'} style:width={region.width/size.width*100+'%'} style:height={region.height/size.height*100+'%'} role="button" tabindex="0" aria-label="Move crop rectangle" onpointerdown={e=>begin(e,'move')} onkeydown={key}>{#each ['nw','n','ne','e','se','s','sw','w'] as h}<button class={'crop-handle '+h} aria-label={'Resize crop '+h} onpointerdown={e=>begin(e,h)}></button>{/each}</div>{/if}
 </div>{#if error}<p role="alert">{error}</p>{/if}
 <button onclick={()=>onchange(null)}>Reset crop to whole image</button>
</div>
<style>.crop-controls{margin:12px 0}.crop-controls p{font-size:12px;line-height:1.4}.crop-frame{position:relative;width:100%;line-height:0;overflow:hidden;background:repeating-conic-gradient(#eee 0% 25%,white 0% 50%) 0/16px 16px}.crop-frame img{display:block;width:100%;height:auto;max-width:none}.crop-rectangle{position:absolute;border:2px solid #268cff;box-shadow:0 0 0 2000px #14293b66;box-sizing:border-box;cursor:move;touch-action:none}.crop-handle{position:absolute;width:14px;height:14px;min-height:0!important;border:1px solid white;background:#268cff;padding:0;margin:0!important;transform:translate(-50%,-50%);touch-action:none}.nw,.n,.ne{top:0}.sw,.s,.se{top:100%}.nw,.w,.sw{left:0}.ne,.e,.se{left:100%}.n,.s{left:50%}.e,.w{top:50%}.nw,.se{cursor:nwse-resize}.ne,.sw{cursor:nesw-resize}.n,.s{cursor:ns-resize}.e,.w{cursor:ew-resize}[role=alert]{color:#a22}</style>
