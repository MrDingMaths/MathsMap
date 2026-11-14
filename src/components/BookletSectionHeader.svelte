<script>
  import InlineContent from './InlineContent.svelte';
  import EditableBookletText from './EditableBookletText.svelte';
  import { HEADER_ICON_PATHS } from '../lib/booklet-header-icons.js';
  let { kind = 'definition', label = undefined, subtitle = '', headerFill = null, editMode = false, rootId = '', rootIds = [], pointer = '/title', labelPointer = null, onContentEdit = null, onContentRevert = null, onEditingChange = null, isEdited = () => false } = $props();

  const paths = HEADER_ICON_PATHS;
  const tones = {
    'review': 'green',
    'investigation': 'red',
    'definition': 'blue',
    'identify': 'red',
    'example': 'orange',
    'guided-practice': 'orange',
    'key-ideas': 'blue',
  };
  const labels = {
    'review': "Review",
    'investigation': "",
    'definition': "Definition",
    'identify': "Identify",
    'example': "Example",
    'guided-practice': "Guided practice",
    'key-ideas': "Key ideas",
  };
  let path = $derived(paths[kind] ?? paths.definition);
  let tone = $derived(['red','blue','green','orange','pink'].includes(headerFill) ? headerFill : tones[kind] ?? tones.definition);
  let heading = $derived(kind === 'guided-practice' || /^practice$/i.test(String(label ?? '').trim()) ? 'Guided practice' : label !== undefined ? label : labels[kind] ?? labels.definition);
  const commit = (event) => onContentEdit?.({ ...event, rootIds: rootIds.length ? rootIds : undefined });
  const revert = (event) => onContentRevert?.({ ...event, rootIds: rootIds.length ? rootIds : undefined });
</script>

<div class="accent-header {tone}" data-header-kind={kind} style:background={'var(--booklet-'+tone+'Fill)'}>
  <svg class="header-icon" viewBox="0 0 24 24" aria-hidden="true">
    {#if kind === 'identify' || kind === 'investigation'}
      <circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="2" />
      <path d="M15 15 L21 21" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
    {:else}
      <path d={path} fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" />
    {/if}
  </svg>
  {#if heading || (editMode && labelPointer)}<span class="header-main">{#if editMode && rootId && labelPointer}<EditableBookletText value={heading} {rootId} pointer={labelPointer} {rootIds} {editMode} edited={isEdited(rootId, labelPointer)} oncommit={commit} onrevert={revert} oneditingchange={onEditingChange} />{:else}<InlineContent text={heading} />{/if}</span>{/if}
  {#if subtitle}<div class="header-sub">{#if editMode && rootId}<EditableBookletText value={subtitle} {rootId} {rootIds} {pointer} {editMode} edited={isEdited(rootId, pointer)} oncommit={commit} onrevert={revert} oneditingchange={onEditingChange} />{:else}<InlineContent text={subtitle} />{/if}</div>{/if}
</div>

<style>
  .accent-header {
    display: flex;
    min-height: 5.4mm;
    box-sizing: border-box;
    align-items: center;
    gap: 1.4mm;
    padding: .9mm 1.6mm .9mm 2.1mm;
    border-left: 2.2mm solid currentColor;
    border-bottom: 1px solid var(--booklet-border);
    font-size: 10.1pt;
    line-height: 1.05;
  }
  .accent-header.blue { color: var(--booklet-blue); background: var(--booklet-blueFill); }
  .accent-header.green { color: var(--booklet-green); background: var(--booklet-greenFill); }
  .accent-header.red { color: var(--booklet-red); background: var(--booklet-redFill); }
  .accent-header.pink { color: var(--booklet-red); background: var(--booklet-redFill); }
  .accent-header.orange { color: var(--booklet-orange); background: var(--booklet-orangeFill); }
  .header-icon {
    display: block;
    width: 4.7mm;
    height: 4.7mm;
    flex: 0 0 4.7mm;
    color: var(--booklet-ink);
  }
  .header-main { color: var(--booklet-ink); font-weight: 700; }
  .header-sub { min-width: 0; flex: 1; color: var(--booklet-ink); font-weight: 400; }
  /* Nunito's visible capitals sit above the centre of its line box. */
  .header-main, .header-sub { position: relative; top: .1em; }
  .header-sub :global(.booklet-content) { display: inline; }
  /* Match the text box to its line height so flex centres the visible label. */
  .accent-header :global(.text-line) { min-height: 0; }
  .accent-header :global(p) { margin: 0; }
</style>
