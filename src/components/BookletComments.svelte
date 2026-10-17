<script>
  import {tick} from 'svelte';
  import {bookletComments,createFeedback,updateFeedback,feedbackStatus,snapshotFeedbackAnchor,feedbackTargetPreview} from '../lib/booklet-feedback.js';
  import {contentTarget} from '../lib/booklet-document-controller.js';
  let {project,onchange,oncopy,onlocate}= $props();
  let filter=$state('open'),selected=$state([]),note=$state(''),scope=$state('all'),anchor=$state.raw(null),editing=$state(null),writing=$state(false),input=$state(),formError=$state('');
  let editReturn=null;
  async function closeForm(){
    const position=editReturn;
    editReturn=null;
    writing=false;
    editing=null;
    await tick();
    if(position?.pane.isConnected){
      position.button.focus({preventScroll:true});
      position.pane.scrollTop=position.scrollTop;
    }
  }
  const editingFlag=$derived(editing?bookletComments(project).find(flag=>flag.id===editing):null);
  const preview=$derived(editingFlag?{targetId:editingFlag.targetId,location:editingFlag.location??'Content comment',edition:editingFlag.edition??'Not recorded (legacy note)',quote:editingFlag.quote??'',sourceRefs:editingFlag.sourceRefs??[],error:''}:feedbackTargetPreview(project,anchor));
  // Newest first for display only; comments without a timestamp predate them and keep saved order at the bottom.
  const flags=$derived(bookletComments(project).map((f,i)=>[f,i]).filter(([f])=>filter==='all'||(filter==='resolved'?f.resolved:!f.resolved)).sort((a,b)=>(b[0].at??'').localeCompare(a[0].at??'')||b[1]-a[1]).map(([f])=>f));
  const dateTime=new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}),timeOnly=new Intl.DateTimeFormat(undefined,{timeStyle:'short'});
  function when(flag){const at=flag.at&&new Date(flag.at);if(!at||isNaN(at))return '';const edited=flag.editedAt&&new Date(flag.editedAt);if(!edited||isNaN(edited)||Math.floor(edited/6e4)===Math.floor(at/6e4))return dateTime.format(at);return dateTime.format(at)+' · edited '+(edited.toDateString()===at.toDateString()?timeOnly:dateTime).format(edited);}
  export function focusDraft(){if(!writing)return false;tick().then(()=>input?.focus());return true;}
  export function start(target=null){if(focusDraft())return;editReturn=null;formError='';try{anchor=snapshotFeedbackAnchor(project,target);}catch(e){anchor=target==null?null:JSON.parse(JSON.stringify(target));formError=e.message;}note='';scope='all';editing=null;writing=true;setTimeout(()=>input?.focus(),0);}
  export function reveal(ids){filter='all';writing=false;const flag=bookletComments(project).find(f=>ids.includes(contentTarget(project,f.targetId)?.block?.id??f.targetId));if(flag)setTimeout(()=>document.querySelector(`[data-comment-id="${CSS.escape(flag.id)}"]`)?.scrollIntoView({block:'nearest'}),0);}
  function save(){if(!note.trim()||formError||(!editing&&preview.error))return;try{if(editing){if(!editingFlag)throw Error('This comment is no longer available.');onchange(updateFeedback(project,editing,{note:note.trim(),scope,editedAt:new Date().toISOString()}));}else onchange({...project,studio:{version:1,...project.studio,flags:[...(project.studio?.flags??[]),createFeedback(project,anchor,note,scope)]}});closeForm();note='';formError='';}catch(e){formError=e.message;}}
  function edit(flag,event){const button=event.currentTarget,pane=button.closest('.comments-pane');if(pane&&!writing)editReturn={button,pane,scrollTop:pane.scrollTop};editing=flag.id;note=flag.note;scope=flag.scope??'all';anchor=flag.anchor?JSON.parse(JSON.stringify(flag.anchor)):null;formError='';writing=true;setTimeout(()=>input?.focus(),0);}
</script>
<section class="comments" aria-label="Booklet comments">
  <div class="actions"><button onclick={()=>start()}>Booklet-wide comment</button><button onclick={()=>oncopy(selected)}>Copy feedback prompt</button></div>
  <label>Show comments<select bind:value={filter}><option value="open">Unresolved</option><option value="resolved">Resolved</option><option value="all">All comments</option></select></label>
  <p class="hint">Copy selected unresolved comments, or all unresolved comments when none are selected.</p>
  {#if writing}<form onsubmit={e=>{e.preventDefault();save();}}>
    <p class="hint">Target: {preview.location}<br/>{preview.targetId} · {preview.edition}{#if preview.sourceRefs.length}<br/>Source pages: {preview.sourceRefs.map(ref=>ref.pageNumber).join(', ')}{/if}</p>
    {#if preview.quote}<blockquote aria-label="Quoted comment target">{preview.quote}</blockquote>{/if}
    {#if formError||(!editing&&preview.error)}<p class="attention" role="alert">{formError||preview.error}</p>{/if}
    <label>Comment<textarea bind:this={input} bind:value={note} rows="4" placeholder="Describe the change you want"></textarea></label>
    <label>Apply feedback to<select bind:value={scope}><option value="all">All applicable occurrences</option><option value="local">This occurrence only</option></select></label>
    <div class="actions"><button disabled={!note.trim()||Boolean(formError)||(!editing&&Boolean(preview.error))} type="submit">{editing?'Update comment':'Add comment'}</button><button type="button" onclick={closeForm}>Cancel</button></div>
  </form>{/if}
  {#each flags as flag (flag.id)}
    <article class:resolved={flag.resolved} data-comment-id={flag.id}>
      <div class="actions"><input type="checkbox" aria-label={'Include comment '+flag.id} checked={selected.includes(flag.id)} disabled={flag.resolved} onchange={e=>selected=e.currentTarget.checked?[...selected,flag.id]:selected.filter(id=>id!==flag.id)}/><button class="location" onclick={()=>onlocate(flag)}>{flag.location??'Content comment'}</button></div>
      {#if flag.quote}<blockquote>{flag.quote}</blockquote>{/if}<p>{flag.note}</p>
      <small>{flag.scope==='local'?'This occurrence only':'All applicable occurrences'}</small>{#if when(flag)}<time datetime={flag.at}>{when(flag)}</time>{/if}
      {#if feedbackStatus(project,flag)}<p class="attention">{feedbackStatus(project,flag)}</p>{/if}
      <div class="actions"><button onclick={event=>edit(flag,event)}>Edit</button><button onclick={()=>onchange(updateFeedback(project,flag.id,{resolved:!flag.resolved}))}>{flag.resolved?'Reopen':'Resolve'}</button><button onclick={()=>onchange({...project,studio:{...project.studio,flags:project.studio.flags.filter(f=>f.id!==flag.id)}})}>Delete</button></div>
    </article>
  {:else}<p>No {filter==='resolved'?'resolved':filter==='open'?'unresolved':''} comments.</p>{/each}
</section>
<style>
 .comments{font:14px system-ui;display:grid;grid-template-columns:minmax(0,1fr);gap:12px;min-width:0;overflow-wrap:anywhere}.comments label{display:grid;grid-template-columns:minmax(0,1fr);gap:6px;min-width:0}.comments form,.comments article{min-width:0}.comments textarea,.comments select{box-sizing:border-box;width:100%;min-width:0;max-width:100%;padding:8px;font:inherit;background:var(--panel,#fff);color:inherit;border:1px solid #b5c1cf;border-radius:5px}.comments textarea{resize:vertical}.actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-width:0}.comments button{box-sizing:border-box;min-width:0;max-width:100%;white-space:normal;overflow-wrap:anywhere;font:inherit;min-height:32px;padding:5px 8px;border:1px solid #b5c1cf;border-radius:5px;background:var(--panel,#fff);color:inherit;cursor:pointer}.hint,small,time{color:#52697b;font-size:12px}time{display:block;margin-top:2px}article{border:1px solid #d1dce5;padding:10px;border-radius:6px}article p{white-space:pre-wrap;overflow-wrap:anywhere}blockquote{margin:8px 0;border-left:3px solid #7e9db3;padding-left:8px;font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere;max-height:100px;overflow:auto}.location{text-align:left}.attention{color:#885118;font-size:12px}.resolved{opacity:.7}
</style>
