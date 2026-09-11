<script>
  import {bookletComments,createFeedback,updateFeedback,feedbackStatus} from '../lib/booklet-feedback.js';
  import {contentTarget} from '../lib/booklet-document-controller.js';
  let {project,onchange,oncopy,onlocate}= $props();
  let filter=$state('open'),selected=$state([]),note=$state(''),scope=$state('all'),anchor=$state.raw(null),editing=$state(null),writing=$state(false),input=$state();
  const flags=$derived(bookletComments(project).filter(f=>filter==='all'||(filter==='resolved'?f.resolved:!f.resolved)));
  export function start(target=null){anchor=target;note='';scope='all';editing=null;writing=true;setTimeout(()=>input?.focus(),0);}
  export function reveal(ids){filter='all';writing=false;const flag=bookletComments(project).find(f=>ids.includes(contentTarget(project,f.targetId)?.block?.id??f.targetId));if(flag)setTimeout(()=>document.querySelector(`[data-comment-id="${CSS.escape(flag.id)}"]`)?.scrollIntoView({block:'nearest'}),0);}
  function save(){if(!note.trim())return;if(editing)onchange(updateFeedback(project,editing,{note:note.trim(),scope}));else onchange({...project,studio:{version:1,...project.studio,flags:[...(project.studio?.flags??[]),createFeedback(project,anchor,note,scope)]}});writing=false;note='';editing=null;}
  function edit(flag){editing=flag.id;note=flag.note;scope=flag.scope??'all';anchor=flag.anchor;writing=true;setTimeout(()=>input?.focus(),0);}
</script>
<section class="comments" aria-label="Booklet comments">
  <div class="actions"><button onclick={()=>start()}>Booklet-wide comment</button><button onclick={()=>oncopy(selected)}>Copy feedback prompt</button></div>
  <label>Show comments<select bind:value={filter}><option value="open">Unresolved</option><option value="resolved">Resolved</option><option value="all">All comments</option></select></label>
  <p class="hint">Copy selected unresolved comments, or all unresolved comments when none are selected.</p>
  {#if writing}<form onsubmit={e=>{e.preventDefault();save();}}>
    <label>Comment<textarea bind:this={input} bind:value={note} rows="4" placeholder="Describe the change you want"></textarea></label>
    <label>Apply feedback to<select bind:value={scope}><option value="all">All applicable occurrences</option><option value="local">This occurrence only</option></select></label>
    <div class="actions"><button disabled={!note.trim()} type="submit">{editing?'Update comment':'Add comment'}</button><button type="button" onclick={()=>writing=false}>Cancel</button></div>
  </form>{/if}
  {#each flags as flag (flag.id)}
    <article class:resolved={flag.resolved} data-comment-id={flag.id}>
      <div class="actions"><input type="checkbox" aria-label={'Include comment '+flag.id} checked={selected.includes(flag.id)} disabled={flag.resolved} onchange={e=>selected=e.currentTarget.checked?[...selected,flag.id]:selected.filter(id=>id!==flag.id)}/><button class="location" onclick={()=>onlocate(flag)}>{flag.location??'Content comment'}</button></div>
      {#if flag.quote}<blockquote>{flag.quote}</blockquote>{/if}<p>{flag.note}</p>
      <small>{flag.scope==='local'?'This occurrence only':'All applicable occurrences'}</small>
      {#if feedbackStatus(project,flag)}<p class="attention">{feedbackStatus(project,flag)}</p>{/if}
      <div class="actions"><button onclick={()=>edit(flag)}>Edit</button><button onclick={()=>onchange(updateFeedback(project,flag.id,{resolved:!flag.resolved}))}>{flag.resolved?'Reopen':'Resolve'}</button><button onclick={()=>onchange({...project,studio:{...project.studio,flags:project.studio.flags.filter(f=>f.id!==flag.id)}})}>Delete</button></div>
    </article>
  {:else}<p>No {filter==='resolved'?'resolved':filter==='open'?'unresolved':''} comments.</p>{/each}
</section>
<style>
 .comments{font:14px system-ui;display:grid;gap:12px}.comments label{display:grid;gap:6px}.comments textarea,.comments select{box-sizing:border-box;width:100%;padding:8px;font:inherit;background:var(--panel,#fff);color:inherit;border:1px solid #b5c1cf;border-radius:5px}.actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.comments button{font:inherit;min-height:32px;padding:5px 8px;border:1px solid #b5c1cf;border-radius:5px;background:var(--panel,#fff);color:inherit;cursor:pointer}.hint,small{color:#52697b;font-size:12px}article{border:1px solid #d1dce5;padding:10px;border-radius:6px}article p{white-space:pre-wrap;overflow-wrap:anywhere}blockquote{margin:8px 0;border-left:3px solid #7e9db3;padding-left:8px;font-size:12px;max-height:100px;overflow:auto}.location{text-align:left}.attention{color:#885118;font-size:12px}.resolved{opacity:.7}
</style>
