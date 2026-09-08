<script>
 import { onMount, tick } from 'svelte';
 import MathsEditor from './MathsEditor.svelte';
 import DiagramDraftEditor from './DiagramDraftEditor.svelte';
 import QuestionArrangementEditor from './QuestionArrangementEditor.svelte';
 let {session,onclose}= $props();
 let dialog,lastFocus,child=$state(),dirty=$state(false),confirmDiscard=$state(false);
 export function getValue(){return child?.getValue();}
 async function close(){const current=session;dialog.close();onclose();await tick();if(current?.origin?.isConnected)current.origin.focus({preventScroll:true});else current?.restoreFocus?.();}
 async function requestClose(event){event?.preventDefault();if(dirty){lastFocus=document.activeElement;confirmDiscard=true;await tick();dialog.querySelector('.discard button')?.focus();}else close();}
 async function keepEditing(){confirmDiscard=false;await tick();lastFocus?.focus?.();}
 function saved(value){session.commit(value);close();}
 onMount(()=>{const origin=session.origin;dialog.showModal();return()=>{dialog?.close();origin?.focus?.({preventScroll:true});};});
</script>
<dialog class="focused-editor project-screen" bind:this={dialog} aria-labelledby="focused-editor-title" oncancel={requestClose} onkeydown={event=>{if(event.key==='Escape'&&!event.defaultPrevented)requestClose(event);}}>
 <header><div><h2 id="focused-editor-title">{session.block?'Edit question arrangement':session.diagram?'Edit diagram':'Edit content'}</h2><p>{session.context}</p></div><div class="actions"><span aria-live="polite">{dirty?'Unsaved draft':'Draft'}</span><button onclick={close}>Cancel</button><button class="primary" onclick={()=>child?.save()}>Save</button><button aria-label="Close editor" onclick={requestClose}>×</button></div></header>
 {#if confirmDiscard}<section class="discard" role="alert"><p>Discard your unsaved draft?</p><button onclick={keepEditing}>Keep editing</button><button onclick={close}>Discard</button></section>{/if}
 <div class="editor-body">
 {#if session.block}<QuestionArrangementEditor bind:this={child} {session} onchange={()=>dirty=true} onsave={saved}/>
 {:else if session.diagram}<DiagramDraftEditor bind:this={child} diagram={session.diagram} colourMode={session.colourMode} assetBase={session.assetBase} focused sourceUrl={session.sourceUrl} ondraft={draft=>{dirty=!!draft;session.ondraft?.(draft);}} onsave={saved}/>
 {:else}<MathsEditor {session} bind:this={child} value={session.value} selectedNodeId={session.selectedNodeId} selectedType={session.selectedType} focused sourceUrl={session.sourceUrl} onchange={()=>dirty=true} onsave={saved}/>{/if}
 </div>
</dialog>
<style>
 dialog{box-sizing:border-box;width:calc(100vw - 24px);max-width:none;height:calc(100dvh - 48px);max-height:none;margin:auto;padding:0;border:1px solid var(--border,#cbd5e1);border-radius:12px;background:var(--panel,#fff);color:var(--text,#243348);font:16px system-ui;overflow:hidden}dialog::backdrop{background:rgba(12,22,38,.6)}header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 24px;border-bottom:1px solid var(--border,#cbd5e1);background:var(--panel,#fff)}h2{font-size:20px;margin:0}header p{font-size:14px;margin:6px 0 0}.actions{display:flex;align-items:center;gap:8px}.actions span{font-size:14px}.editor-body{isolation:isolate;overflow:auto;height:calc(100% - 87px)}button{font:inherit;min-height:36px;padding:6px 14px;border:1px solid var(--border,#becbd7);border-radius:6px;background:var(--panel,#fff);color:inherit;cursor:pointer}.primary{background:#286647;color:white}.discard{position:absolute;z-index:5;right:24px;top:85px;padding:20px;box-shadow:0 6px 32px #0005;background:var(--panel,#fff);border:2px solid #b87a26;border-radius:8px}.discard button{margin-right:8px}@media(max-width:600px){dialog{width:calc(100vw - 16px);height:calc(100dvh - 16px)}header{padding:12px;gap:8px;flex-wrap:wrap}h2{font-size:18px}.actions{width:100%}.actions span{margin-right:auto}.editor-body{height:calc(100% - 125px)}button{min-height:44px}.discard{inset:125px 12px auto}}@media print{dialog{display:none!important}}
@media(pointer:coarse){button{min-height:44px}}
</style>
