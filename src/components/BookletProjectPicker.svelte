<script>
  import { tick } from 'svelte';
  import { groupLibraryProjects } from '../lib/booklet-library.js';
  let { projects = [], courses = [], selectedId = '', disabled = false, onselect } = $props();
  let expanded = $state(false), query = $state(''), archived = $state(false), search = $state(), trigger = $state(), results = $state();
  const groups = $derived(groupLibraryProjects(projects, courses, {query, archived}));
  const current = $derived(projects.find(p => p.id === selectedId));
  async function toggle() { expanded = !expanded; if(expanded){await tick();search?.focus();} }
  function close() { expanded=false; trigger?.focus(); }
  function keys(event) {
    if(event.key==='Escape'){event.preventDefault();close();}
    if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
    if(event.target===search && !['ArrowDown','ArrowUp'].includes(event.key))return;
    const buttons=[...(results?.querySelectorAll('button')??[])];if(!buttons.length)return;
    event.preventDefault();const index=buttons.indexOf(event.target);
    const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:event.key==='ArrowDown'?(index+1)%buttons.length:(index<=0?buttons.length:index)-1;
    buttons[next].focus();
  }
</script>

<div class="project-library" onfocusout={event=>{if(!event.currentTarget.contains(event.relatedTarget))expanded=false;}}>
  <button class="picker-trigger" data-project-id={selectedId} bind:this={trigger} {disabled} aria-label="Open booklet" aria-expanded={expanded} aria-controls="project-library-menu" onclick={toggle}>{current?.title ?? 'Choose a project'}{current?.library?.archivedAt ? ' (Archived)' : ''} ▾</button>
  {#if expanded}
    <div id="project-library-menu" role="dialog" tabindex="-1" aria-label="Booklet library" onkeydown={keys}>
      <label>Search projects<input bind:this={search} bind:value={query} type="search" placeholder="Title, stage, course or class" /></label>
      <label class="archive-toggle"><input type="checkbox" bind:checked={archived}/> Archived projects</label>
      <div class="results" bind:this={results}>
        {#each groups as group (group.key)}
          <section aria-label={group.label}>
            <h3>{group.label}</h3>
            {#each group.projects as item (item.id)}<button data-project-id={item.id} aria-current={item.id===selectedId?'page':undefined} onclick={()=>{close();onselect(item.id);}}>{item.title}</button>{/each}
          </section>
        {:else}<p role="status">No {archived?'archived ':''}projects{query?' match your search':''}.</p>{/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .project-library{position:relative;flex:1 0 140px;min-width:140px;max-width:320px}
  .picker-trigger{width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left;min-height:32px;font:inherit;font-size:14px;padding:6px 10px;border:1px solid var(--border,#bbb);border-radius:6px;background:var(--surface,#fff);color:inherit;cursor:pointer}.picker-trigger:disabled{opacity:.45}
  #project-library-menu{position:absolute;top:100%;left:0;width:min(32rem,calc(100vw - 2rem));max-width:calc(100vw - 2rem);z-index:100;background:var(--md-card,#fff);color:var(--md-text,#24282d);border:1px solid var(--md-border,#bbb);border-radius:8px;padding:12px;box-shadow:0 8px 24px #0003}
  label{display:block;font-size:13px}input[type=search]{box-sizing:border-box;width:100%;margin:4px 0 10px;padding:8px}.archive-toggle{display:flex;gap:6px;align-items:center}
  .results{max-height:55vh;overflow:auto;margin-top:8px}h3{font-size:12px;margin:12px 0 4px;color:var(--md-muted,#555)}.results button{display:block;width:100%;text-align:left;white-space:normal;padding:8px;border:0;background:transparent;color:inherit;border-radius:4px}.results button:hover,.results button:focus-visible,.results button[aria-current]{background:color-mix(in srgb,var(--md-text,#24282d) 12%,var(--md-card,#fff))}button:focus-visible,input:focus-visible{outline:2px solid #52769a;outline-offset:2px}
  @media screen and (max-width:1000px){#project-library-menu{position:fixed;top:52px;left:12px;right:12px;width:auto;box-sizing:border-box;max-width:32rem}.results button{min-height:44px}}
  @media print{.project-library{display:none}}
</style>
