<script>
 const LAYOUT_TABS = [['layout','Spacing'],['arrange','Arrange'],['page','Page']];
 let { value = 'layout', onchange, id = 'inspector', tabs = LAYOUT_TABS, label = 'Properties', controls = `${id}-content`, strip = false } = $props();
 function key(event, index) {
  if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
  event.preventDefault(); const count = tabs.length, next = event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : (index + (event.key === 'ArrowRight' ? 1 : count - 1)) % count;
  onchange(tabs[next][0]); event.currentTarget.parentElement.children[next].focus();
 }
</script>
<div class="inspector-tabs" class:strip role="tablist" aria-label={label}>
 {#each tabs as [tab,title,count],index}<button type="button" role="tab" id={`${id}-${tab}`} aria-controls={controls} aria-selected={value===tab} tabindex={value===tab||(index===0&&!tabs.some(t=>t[0]===value))?0:-1} onclick={()=>onchange(tab)} onkeydown={event=>key(event,index)}>{title}{#if count}<span class="count">{count}</span>{/if}</button>{/each}
</div>
<style>
 .inspector-tabs{display:flex;gap:4px;padding:4px;background:var(--app-canvas,#eef1f5);border-radius:7px;margin:8px 0 12px}.inspector-tabs button{flex:1;min-height:32px;border:0;border-radius:4px;background:transparent;color:inherit;font:500 14px system-ui;cursor:pointer}.inspector-tabs button[aria-selected=true]{background:var(--panel,#fff);box-shadow:0 1px 3px #0002}.inspector-tabs button:focus-visible{outline:2px solid #268cff}
 .inspector-tabs.strip{gap:0;padding:0;margin:0;background:transparent;border-radius:0;border-bottom:1px solid var(--line,#d5dde7)}.inspector-tabs.strip button{flex:0 0 auto;min-width:0;padding:6px 7px;border-radius:0;font-size:13px;opacity:.72;border-bottom:2px solid transparent;margin-bottom:-1px;white-space:nowrap}.inspector-tabs.strip button:hover{opacity:1}.inspector-tabs.strip button[aria-selected=true]{background:transparent;box-shadow:none;opacity:1;font-weight:700;border-bottom-color:#438ccc}
 .count{margin-left:4px;padding:0 5px;border-radius:8px;background:#438ccc;color:#fff;font-size:11px;font-weight:600}
</style>
