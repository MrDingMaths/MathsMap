<script>
  import { untrack } from 'svelte';
  import BookletLibraryFields from './BookletLibraryFields.svelte';
  import { normalizeProjectLibrary } from '../lib/booklet-library.js';
  let { source = null, courses = [], onsubmit, oncancel } = $props();
  let title = $state(untrack(()=>source ? `${source.title} for ` : 'Untitled booklet'));
  let library = $state(untrack(()=>normalizeProjectLibrary({category:source?'class':'master',courseId:source?.library?.courseId??''})));
  let customTitle = $state(false), busy = $state(false), error = $state('');
  function mount(node){node.showModal();}
  function updateLibrary(next){library=next;if(source&&!customTitle)title=`${source.title} for ${next.classLabel}`;}
  async function submit(event){event.preventDefault();busy=true;error='';try{await onsubmit({title:title.trim(),library});}catch(e){error=e.message;}finally{busy=false;}}
</script>
<dialog use:mount oncancel={event=>{event.preventDefault();if(!busy)oncancel();}} aria-labelledby="create-booklet-heading">
  <form onsubmit={submit}>
    <h2 id="create-booklet-heading">{source?'Create class booklet':'New booklet'}</h2>
    {#if source}<label>Class label<input aria-label="Class label" required value={library.classLabel} oninput={e=>updateLibrary({...library,classLabel:e.currentTarget.value})}/></label>
    {:else}<BookletLibraryFields {library} {courses} allowUnassigned={false} onchange={updateLibrary}/>{/if}
    <label>Booklet title<input aria-label="Booklet title" required bind:value={title} oninput={()=>customTitle=true}/></label>
    {#if error}<p role="alert">{error}</p>{/if}
    <div class="actions"><button type="button" disabled={busy} onclick={oncancel}>Cancel</button><button type="submit" disabled={busy||!title.trim()||(library.category==='class'&&!library.classLabel.trim())}>{busy?'Creating…':source?'Create class booklet':'Create booklet'}</button></div>
  </form>
</dialog>
<style>
  dialog{width:min(26rem,calc(100vw - 3rem));border:1px solid var(--md-border,#bbb);border-radius:10px;background:var(--md-card,#fff);color:var(--md-text,#24282d);padding:20px}dialog::backdrop{background:#0005}h2{margin-top:0;font-size:18px}label{display:block;margin:12px 0;font-size:13px}input{display:block;box-sizing:border-box;width:100%;margin-top:4px;padding:8px}.actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}
</style>
