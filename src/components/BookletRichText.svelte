<script>
  import InlineContent from './InlineContent.svelte';
  import { isDocument, documentHtml } from '../lib/document-content.js';
  import { renderRichTextHtml } from '../lib/maths-editor.js';
  import { splitBookletTables, numberedTheoryRules } from '../lib/booklet-preview.js';

  let { text = '', class: className = '', fillCloze = false, layout = null } = $props();
  let rules = $derived(layout === 'numbered-rules' ? numberedTheoryRules(text) : null);
  let isRich = $derived(Boolean(text && typeof text === 'object' && (text.paragraphs || text.inlines || text.segments)));
  let html = $derived(isRich ? renderRichTextHtml(text, { fillCloze }) : '');
  let parts = $derived(isRich ? [] : splitBookletTables(text));
</script>

{#if isDocument(text)}
  <div class="document-content {className}">{@html documentHtml(text, { fillCloze })}</div>
{:else if rules}
  <div class="theory-rules">
    {#each rules as rule}
      <div class="theory-rule"><span>{rule.number}.</span><div><InlineContent text={rule.text} />
        <ul>{#each rule.bullets as bullet}<li><div class="rule-detail"><InlineContent text={bullet.text} />{#if bullet.maths}<InlineContent text={bullet.maths} />{/if}</div></li>{/each}</ul>
      </div></div>
    {/each}
  </div>
{:else if isRich}
  <div class="rich-content {className}">{@html html}</div>
{:else}
  <div class="booklet-content {className}">
    {#each parts as part}
      {#if part.type === 'table'}
        <table>
          {#if part.header}<thead><tr>{#each part.header as cell}<th>{#if cell.includes("[[")}{@html renderRichTextHtml(cell, { fillCloze })}{:else}<InlineContent text={cell} />{/if}</th>{/each}</tr></thead>{/if}
          <tbody>{#each part.rows as row}<tr>{#each row as cell}<td>{#if cell.includes("[[")}{@html renderRichTextHtml(cell, { fillCloze })}{:else}<InlineContent text={cell} />{/if}</td>{/each}</tr>{/each}</tbody>
        </table>
      {:else if part.value.includes('[[')}
        <div class="rich-content">{@html renderRichTextHtml(part.value, { fillCloze })}</div>
      {:else}
        <InlineContent text={part.value} />
      {/if}
    {/each}
  </div>
{/if}

<style>
  .theory-rule { display: grid; grid-template-columns: 5mm minmax(0, 1fr); gap: 1mm; }
  .theory-rule + .theory-rule { margin-top: 6mm; }
  .theory-rule ul { margin: 0; padding-left: 7.5mm; list-style-type: circle; }
  .rule-detail { display: grid; grid-template-columns: minmax(0, 1fr) 43mm; gap: 3mm; }
  .booklet-content table { width: 100%; margin: 2mm 0; border-collapse: collapse; table-layout: fixed; }
  .booklet-content th, .booklet-content td { padding: 1.5mm 2mm; border: .25mm solid #2f4058; vertical-align: top; text-align: left; }
  .booklet-content th { background: #edf4f9; color: #244e74; font-weight: 800; }
  .rich-content :global(p) { margin: 0 0 0.55rem; }
  .rich-content :global(p:last-child) { margin-bottom: 0; }
  .rich-content :global(.math-island) { white-space: nowrap; }
  :global(.cloze-island) { display: inline-block; min-width: var(--cloze-width, 24mm); border-bottom: 1px solid currentColor; color: transparent; vertical-align: baseline; }
  :global(.cloze-island:not(:empty)) { color: inherit; }
</style>
