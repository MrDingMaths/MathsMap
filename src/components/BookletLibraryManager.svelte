<script>
  import { tick } from 'svelte';
  import { PROJECT_CATEGORIES, normalizeProjectLibrary, groupLibraryProjects } from '../lib/booklet-library.js';
  // onapply receives [{id, library?, title?}] and resolves to {updated, failures:[{id,title,error}]}.
  let { projects = [], courses = [], disabled = false, onapply, onclose } = $props();
  let query = $state(''), archived = $state(false), selected = $state([]);
  let category = $state('keep'), courseId = $state('keep'), classLabel = $state('');
  let renaming = $state(''), draft = $state(''), renameInput = $state();
  let busy = $state(false), message = $state(''), failures = $state([]);
  const groups = $derived(groupLibraryProjects(projects, courses, {query, archived}));
  const sortedCourses = $derived([...courses].sort((a,b)=>a.stage-b.stage||a.order-b.order));
  const chosen = $derived(new Set(selected));
  const locked = $derived(disabled || busy);
  const ready = $derived(selected.length > 0 && (category !== 'keep' || courseId !== 'keep') && !(category === 'class' && !classLabel.trim()));
  function mount(node){node.showModal();}
  function courseName(course){return course ? `Stage ${course.stage}${course.title===`Stage ${course.stage}`?'':` / ${course.title}`}` : 'No home course';}
  function describe(project){
    const library = normalizeProjectLibrary(project.library);
    const kind = PROJECT_CATEGORIES.find(([id])=>id===library.category)?.[1] ?? 'Unassigned';
    return [kind, courseName(courses.find(c=>c.id===library.courseId)), library.category==='class'&&library.classLabel].filter(Boolean).join(' · ');
  }
  function toggle(id, on){selected = on ? [...new Set([...selected, id])] : selected.filter(item=>item!==id);}
  function toggleGroup(group, on){const ids = group.projects.map(p=>p.id);selected = on ? [...new Set([...selected, ...ids])] : selected.filter(id=>!ids.includes(id));}
  async function run(changes){
    busy = true; message = ''; failures = [];
    try{
      const result = await onapply(changes);
      failures = result.failures;
      message = result.updated ? `Updated ${result.updated} booklet${result.updated===1?'':'s'}.` : '';
      return result;
    }catch(error){failures = [{id:'', title:'', error:error.message}];return {updated:0, failures};}
    finally{busy = false;}
  }
  async function applyBulk(){
    const changes = selected.flatMap(id=>{
      const project = projects.find(p=>p.id===id);if(!project)return [];
      const library = normalizeProjectLibrary(project.library);
      if(category !== 'keep'){library.category = category || null;if(category === 'class')library.classLabel = classLabel.trim();}
      if(courseId !== 'keep')library.courseId = courseId;
      return [{id, library}];
    });
    const result = await run(changes);
    // Failed booklets stay selected so they can be retried after a reload.
    selected = selected.filter(id=>result.failures.some(f=>f.id===id));
  }
  async function startRename(project){renaming = project.id; draft = project.title; await tick(); renameInput?.focus(); renameInput?.select();}
  async function finishRename(project){
    if(renaming !== project.id)return;
    renaming = '';
    const title = draft.trim();
    if(title && title !== project.title)await run([{id:project.id, title}]);
  }
  function renameKeys(event, project){
    if(event.key === 'Enter'){event.preventDefault();finishRename(project);}
    if(event.key === 'Escape'){event.preventDefault();event.stopPropagation();renaming = '';}
  }
</script>

<dialog class="library-manager" use:mount oncancel={event=>{event.preventDefault();if(!busy)onclose();}} aria-labelledby="library-manager-heading">
  <header><h2 id="library-manager-heading">Manage booklets</h2><button type="button" disabled={busy} onclick={onclose}>Close</button></header>
  <div class="filters">
    <label>Search<input type="search" aria-label="Search booklets" placeholder="Title, stage, course or class" bind:value={query}/></label>
    <label class="inline"><input type="checkbox" bind:checked={archived}/> Archived projects</label>
  </div>
  <div class="list">
    {#each groups as group (group.key)}
      {@const all = group.projects.every(p=>chosen.has(p.id))}
      {@const some = group.projects.some(p=>chosen.has(p.id))}
      <section aria-label={group.label}>
        <h3><label class="inline"><input type="checkbox" aria-label={'Select all in '+group.label} checked={all} indeterminate={some&&!all} disabled={locked} onchange={e=>toggleGroup(group,e.currentTarget.checked)}/> {group.label}</label></h3>
        {#each group.projects as item (item.id)}
          <div class="row" data-manage-project={item.id}>
            <input type="checkbox" aria-label={'Select '+item.title} checked={chosen.has(item.id)} disabled={locked} onchange={e=>toggle(item.id,e.currentTarget.checked)}/>
            {#if renaming===item.id}
              <input class="rename" bind:this={renameInput} aria-label={'New title for '+item.title} bind:value={draft} onkeydown={e=>renameKeys(e,item)} onblur={()=>finishRename(item)}/>
            {:else}
              <span class="name"><span class="title">{item.title}</span><small>{describe(item)}</small></span>
              <button type="button" aria-label={'Rename '+item.title} disabled={locked} onclick={()=>startRename(item)}>Rename</button>
            {/if}
          </div>
        {/each}
      </section>
    {:else}<p role="status">No {archived?'archived ':''}booklets{query?' match your search':''}.</p>{/each}
  </div>
  <footer>
    <div class="selection"><span>{selected.length} selected</span>{#if selected.length}<button type="button" disabled={busy} onclick={()=>selected=[]}>Clear</button>{/if}</div>
    <div class="bulk">
      <label>Project category<select aria-label="Bulk project category" bind:value={category} disabled={locked}>
        <option value="keep">No change</option><option value="">Unassigned</option>
        {#each PROJECT_CATEGORIES as [id,label]}<option value={id}>{label}</option>{/each}
      </select></label>
      {#if category==='class'}<label>Class label<input aria-label="Bulk class label" bind:value={classLabel} disabled={locked}/></label>{/if}
      <label>Home course<select aria-label="Bulk home course" bind:value={courseId} disabled={locked}>
        <option value="keep">No change</option><option value="">Unassigned</option>
        {#each sortedCourses as course}<option value={course.id}>Stage {course.stage} / {course.title}</option>{/each}
      </select></label>
      <button type="button" class="primary" disabled={locked||!ready} onclick={applyBulk}>{busy?'Saving…':`Apply to ${selected.length} booklet${selected.length===1?'':'s'}`}</button>
    </div>
    {#if message}<p role="status">{message}</p>{/if}
    {#if failures.length}<ul role="alert">{#each failures as failure}<li>{failure.title?failure.title+': ':''}{failure.error}</li>{/each}</ul>{/if}
  </footer>
</dialog>

<style>
  dialog{width:min(46rem,calc(100vw - 2rem));max-height:calc(100vh - 2rem);box-sizing:border-box;display:flex;flex-direction:column;gap:10px;border:1px solid var(--md-border,#bbb);border-radius:10px;background:var(--md-card,#fff);color:var(--md-text,#24282d);padding:16px}
  dialog:not([open]){display:none}dialog::backdrop{background:#0005}
  header{display:flex;justify-content:space-between;align-items:center;gap:8px}h2{margin:0;font-size:18px}
  label{display:block;font-size:13px}.inline{display:flex;align-items:center;gap:6px}
  input:not([type=checkbox]),select{display:block;box-sizing:border-box;width:100%;margin-top:4px;padding:6px;font:inherit}
  .filters{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:end}
  .list{flex:1 1 auto;min-height:8rem;overflow:auto;border:1px solid var(--md-border,#ddd);border-radius:6px;padding:4px 8px}
  h3{margin:10px 0 4px;font-size:12px;color:var(--md-muted,#555)}
  .row{display:flex;align-items:center;gap:8px;padding:4px 2px;border-radius:4px}.row:hover{background:color-mix(in srgb,var(--md-text,#24282d) 6%,transparent)}
  .name{flex:1;min-width:0;display:flex;flex-direction:column}.title{overflow-wrap:anywhere}.name small{color:var(--md-muted,#666);font-size:12px}
  .rename{flex:1;margin:0}
  .selection{display:flex;align-items:center;gap:8px;font-size:13px}
  .bulk{display:grid;grid-template-columns:repeat(auto-fit,minmax(10rem,1fr));gap:8px 12px;align-items:end}
  footer p,footer ul{margin:6px 0 0;font-size:13px}footer ul{padding-left:18px;color:#a12a2a}
  button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid #52769a;outline-offset:2px}
  @media(max-width:600px){.filters{grid-template-columns:1fr}.row{flex-wrap:wrap}button,select,input:not([type=checkbox]){min-height:44px}}
</style>
