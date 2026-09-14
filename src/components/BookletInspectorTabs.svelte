<script>
 let { value = 'layout', onchange, id = 'inspector' } = $props();
 const tabs = ['layout', 'arrange', 'page'];
 function key(event, index) {
  if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
  event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
  onchange(tabs[next]); event.currentTarget.parentElement.children[next].focus();
 }
</script>
<div class="inspector-tabs" role="tablist" aria-label="Properties">
 {#each tabs as tab,index}<button type="button" role="tab" id={`${id}-${tab}`} aria-controls={`${id}-content`} aria-selected={value===tab} tabindex={value===tab?0:-1} onclick={()=>onchange(tab)} onkeydown={event=>key(event,index)}>{tab[0].toUpperCase()+tab.slice(1)}</button>{/each}
</div>
<style>
 .inspector-tabs{display:flex;gap:4px;padding:4px;background:var(--app-canvas,#eef1f5);border-radius:7px;margin:8px 0 12px}.inspector-tabs button{flex:1;min-height:32px;border:0;border-radius:4px;background:transparent;color:inherit;font:500 14px system-ui;cursor:pointer}.inspector-tabs button[aria-selected=true]{background:var(--panel,#fff);box-shadow:0 1px 3px #0002}.inspector-tabs button:focus-visible{outline:2px solid #268cff}
</style>
