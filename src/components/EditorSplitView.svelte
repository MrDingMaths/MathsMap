<script>
  let { editor, preview, sourceUrl='' }=$props();
  let ratio=$state(50),tab=$state('edit'),previewTab=$state('preview'),root;
  function resize(event){if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();ratio=event.key==='Home'?30:event.key==='End'?70:Math.max(30,Math.min(70,ratio+(event.key==='ArrowLeft'?-1:1)*(event.shiftKey?5:1)));}
  function drag(event){const start=ratio;event.currentTarget.setPointerCapture(event.pointerId);const handle=event.currentTarget;const move=e=>{const box=root.getBoundingClientRect();ratio=Math.max(30,Math.min(70,(e.clientX-box.left)/box.width*100));};const end=()=>{handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',end);handle.removeEventListener('pointercancel',cancel);window.removeEventListener('keydown',escape,true);};const cancel=()=>{ratio=start;end();};const escape=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();cancel();}};handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',cancel);window.addEventListener('keydown',escape,true);}
</script>
<div class="split-view" bind:this={root} style:--split={ratio+'%'}>
  <div class="mobile-tabs" role="tablist" aria-label="Editor view"><button role="tab" aria-selected={tab==='edit'} onclick={()=>tab='edit'}>Edit</button><button role="tab" aria-selected={tab==='preview'} onclick={()=>tab='preview'}>Preview</button></div>
  <div class="panes">
    <section class="edit-pane" class:mobile-hidden={tab!=='edit'} aria-label="Draft editor">{@render editor()}</section>
    <!-- Focusable separator implements the ARIA window-splitter keyboard pattern. -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
    <div class="divider" tabindex="0" role="separator" aria-label="Resize editor and preview" aria-orientation="vertical" aria-valuemin="30" aria-valuemax="70" aria-valuenow={ratio} onkeydown={resize} onpointerdown={drag}></div>
    <section class="preview-pane" class:mobile-hidden={tab!=='preview'} aria-label="Live preview">
      <div class="preview-tabs" role="tablist" aria-label="Preview content"><button role="tab" aria-selected={previewTab==='preview'} onclick={()=>previewTab='preview'}>Rendered preview</button>{#if sourceUrl}<button role="tab" aria-selected={previewTab==='source'} onclick={()=>previewTab='source'}>Source</button>{/if}</div>
      <div class="paper-preview" hidden={previewTab!=='preview'}>{@render preview()}</div>
      {#if sourceUrl}<div hidden={previewTab!=='source'}><img src={sourceUrl} alt="Original source page"/></div>{/if}
    </section>
  </div>
</div>
<style>
 .paper-preview :global(.tikz-wrap svg){filter:none!important}
 .split-view{min-width:0;container-type:inline-size}.panes{display:grid;grid-template-columns:minmax(0,var(--split)) 12px minmax(0,1fr);align-items:start}.edit-pane,.preview-pane{min-width:0;padding:16px;overflow:auto}.divider{align-self:stretch;min-width:12px;padding:0;border:0;border-inline:1px solid var(--border,#cbd5e1);background:var(--app-canvas,#edf2f7);cursor:col-resize;touch-action:none}.divider:focus-visible{outline:3px solid #397cbd;outline-offset:-3px}.mobile-tabs{display:none}.preview-tabs{display:flex;gap:8px;margin-bottom:16px}.preview-tabs button,.mobile-tabs button{font:inherit;min-height:36px;padding:6px 12px;color:inherit;background:var(--panel,#fff);border:1px solid var(--border,#cbd5e1);border-radius:6px}[aria-selected=true]{font-weight:700;box-shadow:inset 0 -3px #397cbd}.paper-preview{background:white;color:#24282d;padding:16px;min-height:240px;overflow:auto}img{max-width:100%;height:auto}@media(max-width:999px){.panes{display:block}.divider,.mobile-hidden{display:none}.mobile-tabs{display:flex;gap:8px;padding:12px 16px;border-bottom:1px solid var(--border,#cbd5e1)}.edit-pane,.preview-pane{padding:12px}.mobile-tabs button,.preview-tabs button{min-height:44px}}
@media(pointer:coarse){.preview-tabs button,.mobile-tabs button{min-height:44px}.panes{grid-template-columns:minmax(0,var(--split)) 44px minmax(0,1fr)}}
 /* Nested editors must respond to their pane width, not the browser width. */
 @container(max-width:700px){
  .panes{display:block}
  .divider,.mobile-hidden{display:none}
  .mobile-tabs{display:flex;gap:8px;padding:12px 16px;border-bottom:1px solid var(--border,#cbd5e1)}
  .edit-pane,.preview-pane{padding:12px}
  .mobile-tabs button,.preview-tabs button{min-height:44px}
 }
</style>
