<script>
  import { onDestroy, getContext } from 'svelte';
  import BookletRichText from './BookletRichText.svelte';
  import MathsEditor from './MathsEditor.svelte';
  import { splitBookletTables } from '../lib/booklet-preview.js';

  let {
    value = '',
    displayValue = null,
    rootId,
    rootIds = [],
    pointer,
    editMode = false,
    edited = false,
    fillCloze = false,
    layout = null,
    tableStyle = 'grid',
    oncommit = null,
    oneditrequest = null,
    onrevert = null,
    oneditingchange = null,
    class: className = '',
  } = $props();

  const workspaceEdit=getContext('booklet-edit-request');
  const workspaceInline=getContext('booklet-inline-edit');
  const inlineSession=$derived(workspaceInline?.session?.rootId===rootId&&workspaceInline?.session?.pointer===pointer?workspaceInline.session:null);
  let inlineEditor=$state();
  let active = $state('');
  let reportedActive = false;
  let presentationValue=$derived(displayValue??value);
  let parts = $derived(typeof presentationValue === 'string' ? splitBookletTables(presentationValue) : [{ type: 'rich', value:presentationValue }]);

  function cancel() { active = ''; }
  function activate(event) {
    if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
    if (event.type === 'keydown') event.preventDefault();
    const request=oneditrequest??workspaceEdit;
    if(request){const css=getComputedStyle(event.currentTarget);request({renderContext:{colour:css.color,fontFamily:css.fontFamily,fontSize:css.fontSize,lineHeight:css.lineHeight},rootId,rootIds,pointer,value,selectedNodeId:event.target.closest('[data-id]')?.dataset.id,selectedType:event.target.closest('table')?'table':event.target.closest('img')?'image':null,origin:event.currentTarget,commit:oncommit});return;}
    active = 'document';
  }

  $effect(() => {
    const next = Boolean(active||inlineSession);
    if (next !== reportedActive) {
      reportedActive = next;
      oneditingchange?.(next);
    }
    if (!editMode && active) active = '';
  });
  onDestroy(() => { if (reportedActive) oneditingchange?.(false); });
</script>

<span class:edit-mode={editMode} class:edited class="editable-booklet-text {className}" data-edit-root={rootId} data-edit-path={pointer}>
  {#if inlineSession}
    <MathsEditor bind:this={inlineEditor} {value} inline session={inlineSession} selectedNodeId={inlineSession.selectedNodeId} selectedType={inlineSession.selectedType} onsave={result=>{inlineSession.commit(result);workspaceInline.close();}} oncancel={()=>workspaceInline.close()} />
    <button class="focus-edit" type="button" onclick={()=>workspaceInline.focus(inlineEditor?.getValue())}>Open focused editor</button>
  {:else if active === 'document'}
    <MathsEditor {value} onsave={(result) => { active = ''; oncommit?.({ rootId, pointer, value: result.value }); }} oncancel={cancel} />
  {:else}
  {#each parts as part, partIndex}
    {#if part.type === 'table'}
      <table class:borderless={tableStyle === 'borderless'} class="editable-table">
        {#if part.header}
          <thead><tr>{#each part.header as cell, cellIndex}<th style:text-align={part.alignments?.[cellIndex] ?? "left"}>
            {#if editMode}<span class="clickable" role="button" tabindex="0" onclick={activate} onkeydown={activate}><BookletRichText alignRelations={!/prompt$/i.test(pointer ?? "")} text={cell} {fillCloze} /></span>
            {:else}<span><BookletRichText alignRelations={!/prompt$/i.test(pointer ?? "")} text={cell} {fillCloze} /></span>{/if}
          </th>{/each}</tr></thead>
        {/if}
        <tbody>{#each part.rows as row, rowIndex}<tr>{#each row as cell, cellIndex}<td style:text-align={part.alignments?.[cellIndex] ?? "left"}>
          {#if editMode}<span class="clickable" role="button" tabindex="0" onclick={activate} onkeydown={activate}><BookletRichText alignRelations={!/prompt$/i.test(pointer ?? "")} text={cell} {fillCloze} /></span>
          {:else}<span><BookletRichText alignRelations={!/prompt$/i.test(pointer ?? "")} text={cell} {fillCloze} /></span>{/if}
        </td>{/each}</tr>{/each}</tbody>
      </table>
    {:else}
      {#if editMode}<span class="clickable" role="button" tabindex="0" onclick={activate} onkeydown={activate}>
        <BookletRichText alignRelations={!/prompt$/i.test(pointer ?? "")} text={part.value} {fillCloze} {layout} />
      </span>{:else}<span><BookletRichText alignRelations={!/prompt$/i.test(pointer ?? "")} text={part.value} {fillCloze} {layout} /></span>{/if}
    {/if}
  {/each}
  {/if}
  {#if edited && editMode && !active}<span class="edit-badge">Edited {#if edited?.originalValue !== undefined}<button type="button" onclick={() => window.alert('Original:\n\n' + (typeof edited.originalValue === 'string' ? edited.originalValue : JSON.stringify(edited.originalValue, null, 2)))}>Compare</button>{/if}<button type="button" onclick={() => onrevert?.({ rootId, pointer })}>Revert</button></span>{/if}
</span>

<style>
  .focus-edit{font:12px system-ui;padding:5px 10px;background:white;color:#245f91;border:1px solid #becbd7;border-radius:4px}
  .editable-booklet-text { position: relative; display: block; min-width: 0; }
  .clickable { display: block; min-width: 0; }
  .edit-mode .clickable { cursor: text; outline: 1px dashed transparent; outline-offset: 1px; }
  .edit-mode .clickable:hover { outline-color: #e45b55; background: rgba(255,244,232,.45); }
  .edited { box-shadow: inset 2px 0 #e45b55; }
  .edit-badge { position: absolute; z-index: 8; top: -4px; right: 0; padding: 1px 4px; border-radius: 3px; background: #fff1ef; color: #9c3d37; font-size: 7pt; font-weight: 800; }
  .edit-badge button { margin-left: 3px; padding: 0; border: 0; background: transparent; color: inherit; font: inherit; text-decoration: underline; cursor: pointer; }
  .editable-table { width: 100%; margin: 2mm 0; border-collapse: collapse; table-layout: fixed; }
  .editable-table th, .editable-table td { padding: 1.5mm 2mm; border: .25mm solid #2f4058; vertical-align: top; text-align: left; }
  .editable-table th { background: #edf4f9; color: #244e74; font-weight: 400; }
  .editable-table.borderless th, .editable-table.borderless td { border: 0; background: transparent; color: inherit; }
</style>
