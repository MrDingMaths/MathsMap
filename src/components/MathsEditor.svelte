<script>
  import { onMount } from 'svelte';
  import { loadDocumentEditor, isDocument, normalizeDocument, fromSource, storageValue, toSource } from '../lib/document-content.js';
  import { serializeRichText } from '../lib/maths-editor.js';
  let { value='', sourceFallback='', label='Editable maths prose', placeholder='Write text and maths', onchange=()=>{}, onfocus=()=>{}, onblur=()=>{}, onsave=null, oncancel=null, inline=false }=$props();
  let container, editor, error=$state(''), ready=$state(false);
  function result(){const richText=editor.document;return {richText,document:richText,source:toSource(richText),value:storageValue(richText)};}
  onMount(()=>{
    let disposed=false;
    loadDocumentEditor().then(()=>{
      if(disposed)return;
      editor=document.createElement('maths-editor');editor.setAttribute('structured','');editor.setAttribute('aria-label',label);editor.setAttribute('placeholder',placeholder);
      container.append(editor);
      editor.document=isDocument(value)?normalizeDocument(value):fromSource(sourceFallback || (typeof value==='string'?value:serializeRichText(value)));
      editor.addEventListener('document-change',()=>onchange(result()));
      editor.addEventListener('focusin',()=>onfocus());editor.addEventListener('focusout',()=>onblur());
      editor.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();onsave?.(result());}});
      ready=true;editor.focus();
    }).catch(e=>error=e.message);
    return ()=>{disposed=true;editor?.remove();};
  });
</script>
<div class="maths-editor" class:inline>
  <div bind:this={container}></div>
  {#if error}<p role="alert">{error}</p>{:else if !ready}<p>Loading maths editor…</p>{/if}
  <div class="editor-actions">{#if onsave}<button type="button" disabled={!ready} onclick={()=>onsave(result())}>Save</button>{/if}{#if oncancel}<button type="button" onclick={oncancel}>Cancel</button>{/if}</div>
</div>
<style>.maths-editor{min-width:0;width:100%}.editor-actions{display:flex;gap:.5rem;margin:.5rem 0}button{padding:.4rem .8rem;border:1px solid #becbd7;border-radius:5px;background:white;color:#234;cursor:pointer}.inline{font-size:inherit}</style>

