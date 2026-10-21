<script>
  // Shared content: blocks that also appear in other booklets. An edit here waits
  // for a decision; updates applied from elsewhere list the pages to check.
  let {status={members:[],offers:[],checks:[]},titles={},selectedBlockId='',disabled=false,busy=false,onaction=()=>{},onselect=()=>{},onclose=()=>{}}=$props();
  let reasons=$state({}),skipped=$state({});
  const offers=$derived(status.offers??[]);
  const targetKey=(blockId,t)=>blockId+'|'+t.projectId+'|'+t.sectionId;
  const chosen=offer=>offer.targets.filter(t=>!skipped[targetKey(offer.blockId,t)]);
  const STATUS={synced:'In step',edited:'Changed here',diverged:'Differs from the other copies',behind:'Update waiting',separate:'Kept different',missing:'Removed'};
  const EDITIONS={student:'Questions',short:'Short answers',worked:'Worked solutions'};
  const title=id=>titles[id]??id;
  const pending=$derived(status.members.filter(m=>m.status==='edited'||m.status==='diverged'));
  const selected=$derived(status.members.filter(m=>m.blockId===selectedBlockId));
  const linkedCopies=m=>m.others.filter(o=>o.status!=='separate').length+1;
  const pages=list=>list.length?(list.length>1?'pages ':'page ')+list.join(', '):'';
  function editionText(edition,r){
    const parts=[];
    if(r.changed.length)parts.push(pages(r.changed)+' changed');
    parts.push(r.moved.length?pages(r.moved)+' moved':'no other pages moved');
    if(r.pageCountChanged)parts.push(`page count ${r.pagesBefore} → ${r.pagesAfter}, so every footer and the contents page changed`);
    return `${EDITIONS[edition]??edition}: ${parts.join('; ')}.`;
  }
</script>

<section class="shared-panel" aria-label="Shared content">
  <header><h2>Shared content</h2><button onclick={onclose}>Close</button></header>
  <p>These blocks also appear in other booklets. Applying a change updates every linked copy, keeping each booklet's layout, numbering and skill mapping.</p>
  {#if pending.length}
    <h3>Changes waiting for a decision</h3>
    {#each pending as m (m.groupId+m.blockId)}
      <article class="shared-item">
        <p><strong>{STATUS[m.status]}.</strong> Also in {m.others.map(o=>title(o.projectId)+(o.status==='separate'?' (kept different)':'')).join(', ')}. <button class="link" onclick={()=>onselect(m.blockId)}>Go to block</button></p>
        {#if m.stale}<p>Another copy changed this content first. Use the shared version, or keep this copy different.</p>{/if}
        <div class="shared-actions">
          {#if !m.stale}<button disabled={disabled||busy} onclick={()=>onaction({action:'apply-all',blockId:m.blockId})}>Apply to all {linkedCopies(m)} copies</button>{/if}
          <button disabled={disabled||busy} onclick={()=>onaction({action:'use-shared',blockId:m.blockId})}>Use the shared version</button>
          <label>Reason <input aria-label="Reason for keeping this copy different" bind:value={reasons[m.blockId]} placeholder="Optional"/></label>
          <button disabled={disabled||busy} onclick={()=>onaction({action:'keep-separate',blockId:m.blockId,reason:reasons[m.blockId]??''})}>Keep different here</button>
        </div>
      </article>
    {/each}
  {/if}
  {#if offers.length}
    <h3>New questions in shared exercises</h3>
    {#each offers as offer (offer.blockId)}
      <article class="shared-item">
        <p><strong>{offer.excerpt||'New question'}</strong> <button class="link" onclick={()=>onselect(offer.blockId)}>Go to question</button></p>
        <p>Other booklets share this exercise. Add the question to:</p>
        <ul class="shared-targets">{#each offer.targets as t (targetKey(offer.blockId,t))}
          <li><label><input type="checkbox" checked={!skipped[targetKey(offer.blockId,t)]} onchange={e=>skipped[targetKey(offer.blockId,t)]=!e.currentTarget.checked}/> {t.title}{t.sectionTitle?` — ${t.sectionTitle}`:''}</label></li>
        {/each}</ul>
        <div class="shared-actions">
          <button disabled={disabled||busy||!chosen(offer).length} onclick={()=>onaction({action:'offer-add',blockId:offer.blockId,targets:chosen(offer).map(t=>({projectId:t.projectId,sectionId:t.sectionId}))})}>Add to selected booklets</button>
          <button disabled={disabled||busy} onclick={()=>onaction({action:'offer-decline',blockId:offer.blockId})}>Keep in this booklet only</button>
        </div>
      </article>
    {/each}
  {/if}
  {#if status.checks.length}
    <h3>Updated from other booklets</h3>
    {#each status.checks as c (c.id)}
      <article class="shared-item">
        <p>{c.added?'New question':'Update'}{c.from?.projectId?' from '+title(c.from.projectId):''}. <button class="link" onclick={()=>onselect(c.blockId)}>Go to block</button></p>
        {#if c.status==='ready'}{#each Object.entries(c.result??{}) as [edition,r]}<p>{editionText(edition,r)}</p>{/each}
        {:else if c.status==='failed'}<p role="alert">The page check failed: {c.error}</p>
        {:else}<p>Finding the pages that moved…</p>{/if}
        <div class="shared-actions"><button disabled={busy} onclick={()=>onaction({action:'mark-checked',checkId:c.id})}>Checked</button></div>
      </article>
    {/each}
  {/if}
  {#if !pending.length&&!offers.length&&!status.checks.length}<p>Nothing is waiting. {status.members.length} shared {status.members.length===1?'block':'blocks'} in this booklet.</p>{/if}
  {#each selected as m (m.groupId)}
    <h3>Selected block</h3>
    <p>{STATUS[m.status]}{m.reason?` (${m.reason})`:''}. Other copies:</p>
    <ul>{#each m.others as o}<li>{title(o.projectId)}: {STATUS[o.status]??o.status}{o.reason?` (${o.reason})`:''}</li>{/each}</ul>
  {/each}
</section>

<style>
  .shared-panel{padding:1rem;max-height:65vh;overflow:auto;border-bottom:1px solid #94a3b8;background:var(--panel,#fff);color:var(--text,#24324a)}
  .shared-panel header{display:flex;justify-content:space-between;align-items:center;gap:1rem}
  .shared-panel h2{font-size:1rem;margin:0}.shared-panel h3{font-size:.95rem;margin:1rem 0 .25rem}
  .shared-item{padding:.6rem 0;border-top:1px solid #94a3b8}
  .shared-actions{display:flex;gap:.5rem;flex-wrap:wrap;align-items:center;margin-top:.5rem}
  .shared-targets{list-style:none;padding:0;margin:.25rem 0}
  .link{background:none;border:0;padding:0;color:inherit;text-decoration:underline;cursor:pointer}
  @media (max-width:700px){.shared-panel{max-height:40vh}}
</style>
