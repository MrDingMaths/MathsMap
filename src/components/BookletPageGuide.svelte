<script>
  import {tick,untrack} from 'svelte';
  import {settleBookletMeasurement} from '../lib/booklet-measurement.js';
  import {measureBookletPage,pageSpaceLabel} from '../lib/booklet-page-space.js';
  let {children,revision=null,pending=false,onready=null,onerror=null}=$props();
  let root=$state(),space=$state.raw(null),guide=$state(''),extension=$state(''),extraHeight=$state(0),updating=$state(true),failure=$state('');
  function measure(){
    const next=measureBookletPage(root);
    space=next;
    if(!next){extraHeight=0;return;}
    const bounds=root.getBoundingClientRect(),scale=bounds.width/root.offsetWidth||1,b=next.body;
    guide=`left:${(b.left-bounds.left)/scale}px;top:${(b.top-bounds.top)/scale}px;width:${b.width/scale}px;height:${b.height/scale}px`;
    extraHeight=next.overflowHeight*next.paper.scale/scale;
    extension=`left:${(next.paper.left-bounds.left)/scale}px;top:${(next.paper.bottom-bounds.top)/scale}px;width:${next.paper.width/scale}px;height:${extraHeight}px`;
  }
  $effect(()=>{
    revision; pending;
    if(!root)return;
    const controller=new AbortController();let observer,frame;
    updating=true;failure='';
    const reportReady=untrack(()=>onready),reportError=untrack(()=>onerror);
    const update=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(measure);};
    (async()=>{
      try{
        await tick();await settleBookletMeasurement(root,{signal:controller.signal});
        if(controller.signal.aborted)return;
        measure();updating=false;
        observer=new ResizeObserver(update);
        observer.observe(root);
        root.querySelectorAll('.preview-frame,.booklet-page,main,main > .document-group,.answer-column').forEach(el=>observer.observe(el));
        reportReady?.();
      }catch(e){if(e.cancelled)return;failure=e.message;updating=false;reportError?.(e.message);}
    })();
    return()=>{controller.abort();observer?.disconnect();cancelAnimationFrame(frame);};
  });
</script>
<div class="page-guide-wrapper" bind:this={root} style:--studio-overflow-height={`${space?.overflowHeight??0}px`}>
  {#if extraHeight>0}<div data-page-guide class="overflow-extension" style={extension} aria-hidden="true"></div>{/if}
  {@render children()}
  {#if space}<div data-page-guide class="page-area-guide" class:overflow={space.remainingMm<0} style={guide} aria-hidden="true"></div>{/if}
  <div data-page-guide class="page-space-status" class:overflow={space?.remainingMm<0} style:margin-top={`${extraHeight}px`}>
    {#if failure}<span role="alert">Page measurement failed: {failure}</span>
    {:else if pending||updating}Updating…
    {:else if space}{#each space.columns as remaining,index}<span>{space.columns.length>1?`Column ${index+1}: `:''}{pageSpaceLabel(remaining)}</span>{/each}
    {:else}A4 · 210 × 297 mm{/if}
  </div>
</div>
<style>
  .page-guide-wrapper{position:relative;display:flow-root;isolation:isolate}
  .overflow-extension{position:absolute;background:white;border-top:2px dashed #b9573b;box-sizing:border-box;z-index:-1}
  .page-area-guide{position:absolute;box-sizing:border-box;border:1px dashed #a8b6c280;pointer-events:none;z-index:2}
  .page-space-status{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:6px 20px;height:34px;box-sizing:border-box;padding:7px 4px;color:var(--text,#526578);font:12px/1.4 system-ui}
  .page-space-status.overflow{color:#a33c24}.page-area-guide.overflow{border-color:#b9573b}
  .page-guide-wrapper:has(:global(.document-end-insert)) .page-space-status{padding-left:46%}
  @media screen{.page-guide-wrapper :global(.preview-frame){overflow:visible}.page-guide-wrapper :global(.booklet-page){overflow:visible}.page-guide-wrapper :global(.preview-page){box-shadow:0 2px 8px #182c4224}}
  @media print{[data-page-guide]{display:none!important}}
</style>
