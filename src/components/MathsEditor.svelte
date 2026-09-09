<script>
  import BookletLayoutControls from './BookletLayoutControls.svelte';
  import { houseStyleVariables } from '../lib/booklet-house-style.js';
  import PracticeQuestionRenderer from './PracticeQuestionRenderer.svelte';
  import EditorSplitView from './EditorSplitView.svelte';
  import BookletRichText from './BookletRichText.svelte';
  import { onMount, untrack } from 'svelte';
  import { loadDocumentEditor, isDocument, normalizeDocument, fromSource, storageValue, toSource } from '../lib/document-content.js';
  import { serializeRichText } from '../lib/maths-editor.js';
  import {installBookletEditorHost} from '../lib/booklet-editor-dom.js';
  let { value='', sourceFallback='', label='Editable maths prose', placeholder='Write text and maths', onchange=()=>{}, onfocus=()=>{}, onblur=()=>{}, onsave=null, oncancel=null, inline=false, focused=false, sourceUrl='', selectedNodeId=null, selectedType=null, session=null, documentHost=null }=$props();
  let preview=$state(null),previewTimer;
  let layoutDraft=$state(untrack(()=>session?.layout??{})),applyTabs=$state(null);
  const previewQuestion=$derived.by(()=>{if(!session?.question)return null;const question=JSON.parse(JSON.stringify(session.question));const visit=node=>{if(node.id===session.rootId&&preview){const parts=session.pointer.split('/').slice(1);let owner=node;for(const key of parts.slice(0,-1))owner=owner[key];owner[parts.at(-1)]=preview;}node.children?.forEach(visit);};visit(question);return question;});
  const layouts=$derived({...session?.blockLayouts,...(session?.layoutContext?{[session.layoutContext.id]:layoutDraft}:{})});
  function changeLayout(value){layoutDraft=value;onchange(getValue());}

  let container, editor, error=$state(''), ready=$state(false);
  function result(){const richText=editor.document;return {richText,document:richText,source:toSource(richText),value:storageValue(richText),...(session?.layoutContext?{layout:JSON.parse(JSON.stringify(layoutDraft))}:{}),...(applyTabs?{applyTabs:JSON.parse(JSON.stringify(applyTabs))}:{})};}
  export function getValue(){return editor?result():null;}
  export function save(){if(ready)onsave?.(result());}
  onMount(()=>{
    let disposed=false,detachHost;
    loadDocumentEditor().then(()=>{
      if(disposed)return;
      editor=document.createElement('maths-editor');editor.setAttribute('structured','');editor.setAttribute('aria-label',label);editor.setAttribute('placeholder',placeholder);
      if(focused||inline)editor.setAttribute('controls','contextual');
      if(documentHost)editor.classList.add('booklet-document-field');
      editor.style.cssText=houseStyleVariables(session?.houseStyleVersion);
      if(session?.houseStyleVersion)editor.dataset.houseStyleVersion=session.houseStyleVersion;
      if(session?.question)editor.setAttribute('question-context','');
      container.append(editor);
      const initialDocument=isDocument(value)?normalizeDocument(value):fromSource(sourceFallback || (typeof value==='string'?value:serializeRichText(value)));
      if(session&&!isDocument(value)&&initialDocument.blocks.length===1&&initialDocument.blocks[0].type==='paragraph'){
        initialDocument.blocks[0].spaceAfter=0;
        const height=parseFloat(session.renderContext?.lineHeight)/parseFloat(session.renderContext?.fontSize);
        if(Number.isFinite(height))initialDocument.blocks[0].lineHeight=height;
        if(session.defaultLineHeight)initialDocument.blocks[0].lineHeight=session.defaultLineHeight;
      }
      editor.document=initialDocument;
      preview=editor.document;
      let lastDocumentChange=JSON.stringify(result());
      editor.addEventListener('document-change',event=>{const next=result(),signature=JSON.stringify(next);if(documentHost&&signature===lastDocumentChange)return;lastDocumentChange=signature;onchange(next);clearTimeout(previewTimer);if(event.detail.layout)preview=next.document;else previewTimer=setTimeout(()=>preview=next.document,300);});
      editor.addEventListener('apply-question-tabs',event=>{applyTabs=event.detail.tabStops;onchange(result());if(documentHost)applyTabs=null;editor.documentController.message.textContent=documentHost?'Tab settings applied to this question’s parts.':'Tab settings will apply to this question’s parts on Save.';});
      editor.addEventListener('focusin',()=>onfocus());editor.addEventListener('focusout',()=>onblur());
      editor.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();onsave?.(result());}});
      ready=true;editor.focus();
      if(selectedNodeId||selectedType){const target=selectedNodeId?editor.querySelector('[data-id="'+CSS.escape(selectedNodeId)+'"]'):editor.querySelector(selectedType==='table'?'td [data-id],td':'[data-type=inline-image],[data-type=image]');if(target)editor.documentController.select(target);}
      if(documentHost)detachHost=installBookletEditorHost(editor,documentHost);
    }).catch(e=>error=e.message);
    return ()=>{disposed=true;detachHost?.();clearTimeout(previewTimer);editor?.remove();};
  });
</script>
<div class="maths-editor" class:inline style:--document-ink={session?.renderContext?.colour} style:--document-font={session?.renderContext?.fontFamily} style:--document-size={session?.renderContext?.fontSize}>
  {#snippet editPane()}{#if session?.layoutContext?.beside||session?.layoutContext?.inset}<BookletLayoutControls context={session.layoutContext} value={layoutDraft} onchange={changeLayout}/>{/if}<div bind:this={container}></div>{/snippet}
  {#snippet previewPane()}<div class="production-preview" style:color={session?.renderContext?.colour} style:font-family={session?.renderContext?.fontFamily} style:font-size={session?.renderContext?.fontSize}>{#if previewQuestion}<PracticeQuestionRenderer eagerDiagrams={true} question={{id:previewQuestion.id,content:previewQuestion}} number={previewQuestion.label} blockLayouts={layouts} showSpaces={false} showShortAnswers={session?.pointer?.startsWith('/answer/short')} showWorkedSolutions={session?.pointer?.startsWith('/answer/worked')}/>{:else if preview}<div style:padding-left={session?.layoutContext?.inset?(layoutDraft.insetMm??5)+'mm':undefined}><BookletRichText text={preview}/></div>{/if}</div>{/snippet}
  {#if inline}{@render editPane()}{:else if focused}<EditorSplitView editor={editPane} preview={previewPane} {sourceUrl}/>{:else}<div class="editor-pair">{@render editPane()}<section class="editor-preview" aria-label="Rendered preview"><strong>Preview</strong>{@render previewPane()}</section></div>{/if}
  {#if error}<p role="alert">{error}</p>{:else if !ready}<p>Loading maths editor…</p>{/if}
  {#if !focused}<div class="editor-actions">{#if onsave}<button type="button" disabled={!ready} onclick={()=>onsave(result())}>Save</button>{/if}{#if oncancel}<button type="button" onclick={oncancel}>Cancel</button>{/if}</div>{/if}
</div>
<style>.production-preview{background:white;padding:12px;min-width:0;overflow:auto;min-height:150px}
.editor-pair{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:1rem}.editor-preview{min-width:0;padding:.5rem;background:white;border:1px solid #dbe3eb}.editor-preview strong{font-size:.75rem;color:#52697b}@media(max-width:1000px){.editor-pair{grid-template-columns:1fr}}@media print{.editor-preview{display:none}}.maths-editor{min-width:0;width:100%}.editor-actions{display:flex;gap:.5rem;margin:.5rem 0}button{padding:.4rem .8rem;border:1px solid #becbd7;border-radius:5px;background:white;color:#234;cursor:pointer}.inline{font-size:inherit}</style>

