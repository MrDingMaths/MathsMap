<script>
 let { block, onboundary, onlayout } = $props();
</script>
{#if block}
 <div class="page-actions"><button onclick={()=>onboundary('before')}>Page break before</button><button onclick={()=>onboundary('after')}>Page break after</button><button onclick={()=>onboundary('remove')}>Remove break before</button></div>
 <label><input type="checkbox" checked={!!block.flow?.keepTogether} onchange={e=>onlayout({keepTogether:e.currentTarget.checked})}/>Keep block together</label>
 <label><input type="checkbox" checked={!!block.flow?.keepWithNext} onchange={e=>onlayout({keepWithNext:e.currentTarget.checked})}/>Keep with next block</label>
 {#if block.content?.children?.length>1}<label>Continue before part<select aria-label="Continue before part" value={block.flow?.continueBefore??''} onchange={e=>onlayout({continueBefore:e.currentTarget.value||null})}><option value="">Automatic</option>{#each block.content.children.slice(1) as part,index}<option value={part.id}>{part.label??index+2}</option>{/each}</select></label>{/if}
{:else}<p>Select a question or teaching block.</p>{/if}
<style>
 .page-actions{display:grid;gap:8px;margin-bottom:16px}button,input,select{font:inherit;color:inherit;background:var(--panel,#fff);border:1px solid var(--border,#ccd5df);border-radius:5px;min-height:32px}button{padding:6px 10px;text-align:left;cursor:pointer}label{display:flex;align-items:center;gap:8px;margin:12px 0;font:14px system-ui}input[type=checkbox]{min-height:0}select{margin-left:auto;max-width:145px}p{font:14px system-ui}
</style>
