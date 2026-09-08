<script>
  import { watchGraphStrokes } from '../lib/graph-strokes.js';
  import { renderTikzCode, cancelTikzJob } from '../lib/tikz.js';
  let { code, eager=false, draft=false }=$props();
  let el=$state(null),staging=$state(null),state=$state(''),error=$state(''),hasSuccess=$state(false);
  let sequence=0;
  $effect(()=>{if(el&&draft)return watchGraphStrokes(el);});
  $effect(()=>{
    const source=code,host=el,stage=staging,isDraft=draft,immediate=eager;
    const token=++sequence;
    if(!host)return;
    if(!isDraft){if(source)renderTikzCode(host,source,{eager:immediate});else host.replaceChildren();return()=>cancelTikzJob(host);}
    if(!stage)return;
    cancelTikzJob(stage);state='pending';error='';
    const timer=setTimeout(()=>{
      if(!source?.trim()){state='error';error='Enter TikZ code to preview.';return;}
      renderTikzCode(stage,source,{eager:true,onSuccess:svg=>{if(token!==sequence)return;host.innerHTML=svg;hasSuccess=true;state='ready';error='';},onError:message=>{if(token!==sequence)return;state='error';error=message;}});
    },300);
    return()=>{sequence++;clearTimeout(timer);cancelTikzJob(stage);};
  });
</script>
<div class="tikz-wrap" bind:this={el}></div>
{#if draft}<div class="tikz-staging" aria-hidden="true" bind:this={staging}></div>
 <p class="draft-status" role="status">{state==='ready'?'Current draft preview':state==='error'?(hasSuccess?'Previous successful preview; current draft has an error.':'Current draft has an error.'):(hasSuccess?'Previous successful preview; compiling current draft…':'Compiling draft…')}</p>
 {#if error}<p class="tikz-error" role="alert">{error}</p>{/if}
{/if}
<style>
 .tikz-wrap{margin:.75rem 0;min-height:2rem;overflow-x:auto}.tikz-staging{position:absolute;width:1px;height:1px;overflow:hidden;visibility:hidden;pointer-events:none}.tikz-error,.tikz-wrap :global(.tikz-error){font-size:.85rem;color:#9c3020;padding:.4rem 0}.draft-status{font-size:.75rem;color:#52697b}:global([data-theme="dark"]) .tikz-wrap :global(svg){filter:invert(1)}
</style>
