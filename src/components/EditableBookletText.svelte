<script>
  import { onDestroy } from 'svelte';
  import BookletRichText from './BookletRichText.svelte';
  import InlineContent from './InlineContent.svelte';
  import MathsEditor from './MathsEditor.svelte';
  import { splitBookletTables } from '../lib/booklet-preview.js';

  let {
    value = '',
    rootId,
    pointer,
    editMode = false,
    edited = false,
    fillCloze = false,
    oncommit = null,
    onrevert = null,
    oneditingchange = null,
    class: className = '',
  } = $props();

  let active = $state('');
  let reportedActive = false;
  let parts = $derived(typeof value === 'string' ? splitBookletTables(value) : [{ type: 'rich', value }]);

  function serialise(next) {
    return next.map((part) => {
      if (part.type !== 'table') return String(part.value ?? '').trim();
      const columns = part.header?.length ?? part.rows?.[0]?.length ?? 1;
      const header = part.header ?? Array.from({ length: columns }, () => '');
      const line = (cells) => '| ' + cells.map((cell) => String(cell ?? '').trim()).join(' | ') + ' |';
      return [line(header), line(header.map(() => '---')), ...(part.rows ?? []).map(line)].join('\n');
    }).filter(Boolean).join('\n\n');
  }

  function saveText(index, result) {
    const next = structuredClone(parts);
    next[index].value = typeof value === 'string' ? result.source : result.richText;
    const replacement = typeof value === 'string' ? serialise(next) : result.richText;
    active = '';
    oncommit?.({ rootId, pointer, value: replacement });
  }

  function saveCell(partIndex, rowIndex, cellIndex, result, header = false) {
    const next = structuredClone(parts);
    if (header) next[partIndex].header[cellIndex] = result.source;
    else next[partIndex].rows[rowIndex][cellIndex] = result.source;
    active = '';
    oncommit?.({ rootId, pointer, value: serialise(next) });
  }

  function cancel() { active = ''; }
  function activate(event, key) {
    if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
    if (event.type === 'keydown') event.preventDefault();
    active = key;
  }

  $effect(() => {
    const next = Boolean(active);
    if (next !== reportedActive) {
      reportedActive = next;
      oneditingchange?.(next);
    }
    if (!editMode && active) active = '';
  });
  onDestroy(() => { if (reportedActive) oneditingchange?.(false); });
</script>

<span class:edit-mode={editMode} class:edited class="editable-booklet-text {className}" data-edit-root={rootId} data-edit-path={pointer}>
  {#each parts as part, partIndex}
    {#if part.type === 'table'}
      <table class="editable-table">
        {#if part.header}
          <thead><tr>{#each part.header as cell, cellIndex}<th>
            {#if active === `h-${partIndex}-${cellIndex}`}
              <MathsEditor inline value={cell} onsave={(result) => saveCell(partIndex, -1, cellIndex, result, true)} oncancel={cancel} />
            {:else if editMode}<span class="clickable" role="button" tabindex="0" onclick={(event) => activate(event, `h-${partIndex}-${cellIndex}`)} onkeydown={(event) => activate(event, `h-${partIndex}-${cellIndex}`)}><InlineContent text={cell} /></span>
            {:else}<span><InlineContent text={cell} /></span>{/if}
          </th>{/each}</tr></thead>
        {/if}
        <tbody>{#each part.rows as row, rowIndex}<tr>{#each row as cell, cellIndex}<td>
          {#if active === `c-${partIndex}-${rowIndex}-${cellIndex}`}
            <MathsEditor inline value={cell} onsave={(result) => saveCell(partIndex, rowIndex, cellIndex, result)} oncancel={cancel} />
          {:else if editMode}<span class="clickable" role="button" tabindex="0" onclick={(event) => activate(event, `c-${partIndex}-${rowIndex}-${cellIndex}`)} onkeydown={(event) => activate(event, `c-${partIndex}-${rowIndex}-${cellIndex}`)}><InlineContent text={cell} /></span>
          {:else}<span><InlineContent text={cell} /></span>{/if}
        </td>{/each}</tr>{/each}</tbody>
      </table>
    {:else if active === `t-${partIndex}`}
      <MathsEditor inline value={part.value} onsave={(result) => saveText(partIndex, result)} oncancel={cancel} />
    {:else}
      {#if editMode}<span class="clickable" role="button" tabindex="0" onclick={(event) => activate(event, `t-${partIndex}`)} onkeydown={(event) => activate(event, `t-${partIndex}`)}>
        <BookletRichText text={part.value} {fillCloze} />
      </span>{:else}<span><BookletRichText text={part.value} {fillCloze} /></span>{/if}
    {/if}
  {/each}
  {#if edited && editMode && !active}<span class="edit-badge">Edited {#if edited?.originalValue !== undefined}<button type="button" onclick={() => window.alert('Original:\n\n' + (typeof edited.originalValue === 'string' ? edited.originalValue : JSON.stringify(edited.originalValue, null, 2)))}>Compare</button>{/if}<button type="button" onclick={() => onrevert?.({ rootId, pointer })}>Revert</button></span>{/if}
</span>

<style>
  .editable-booklet-text { position: relative; display: block; min-width: 0; }
  .clickable { display: block; min-width: 0; }
  .edit-mode .clickable { cursor: text; outline: 1px dashed transparent; outline-offset: 1px; }
  .edit-mode .clickable:hover { outline-color: #e45b55; background: rgba(255,244,232,.45); }
  .edited { box-shadow: inset 2px 0 #e45b55; }
  .edit-badge { position: absolute; z-index: 8; top: -4px; right: 0; padding: 1px 4px; border-radius: 3px; background: #fff1ef; color: #9c3d37; font-size: 7pt; font-weight: 800; }
  .edit-badge button { margin-left: 3px; padding: 0; border: 0; background: transparent; color: inherit; font: inherit; text-decoration: underline; cursor: pointer; }
  .editable-table { width: 100%; margin: 2mm 0; border-collapse: collapse; table-layout: fixed; }
  .editable-table th, .editable-table td { padding: 1.5mm 2mm; border: .25mm solid #2f4058; vertical-align: top; text-align: left; }
  .editable-table th { background: #edf4f9; color: #244e74; font-weight: 800; }
</style>
