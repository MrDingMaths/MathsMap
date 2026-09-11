<script>
  import {standardBookletContent} from '../../public/libs/maths-editor/booklet-palette.mjs';
  import {getContext} from 'svelte';
  const presentation=getContext('booklet-presentation');
  import { mountTabs } from '../../public/libs/maths-editor/tab-layout.mjs';
  import { mountEquationAnnotations } from '../../public/libs/maths-editor/annotated-equation.mjs';
  import { mountImageFeedback } from '../../public/libs/maths-editor/document-model.mjs';
  import InlineContent from './InlineContent.svelte';
  import { mountTableAnnotations } from '../../public/libs/maths-editor/table-annotations.mjs';
  import { isDocument, documentHtml } from '../lib/document-content.js';
  import { renderRichTextHtml } from '../lib/maths-editor.js';
  import { splitBookletTables, numberedTheoryRules } from '../lib/booklet-preview.js';

  let { text: sourceText = '', class: className = '', fillCloze = false, layout = null, alignRelations = true } = $props();
  const text=$derived(standardBookletContent(sourceText));
  let rules = $derived(layout === 'numbered-rules' ? numberedTheoryRules(text) : null);
  let isRich = $derived(Boolean(text && typeof text === 'object' && (text.paragraphs || text.inlines || text.segments)));
  let html = $derived(isRich ? renderRichTextHtml(text, { fillCloze }) : '');
  let parts = $derived(isRich ? [] : splitBookletTables(text));
</script>

{#if isDocument(text)}
  <div class="document-content {className}" use:mountTabs={text} use:mountTableAnnotations={text} use:mountEquationAnnotations={text} use:mountImageFeedback={text}>{@html documentHtml(text, { fillCloze, mathsStyle:presentation?.()?.mathsStyle })}</div>
{:else if rules}
  <ol class="theory-rules">
    {#each rules as rule}
      <li class="theory-rule" value={Number(rule.number)}><div><InlineContent {alignRelations} text={rule.text} />
        <ul>{#each rule.bullets as bullet}<li><div class="rule-detail"><InlineContent {alignRelations} text={bullet.text} />{#if bullet.maths}<InlineContent {alignRelations} text={bullet.maths} />{/if}</div></li>{/each}</ul>
      </div></li>
    {/each}
  </ol>
{:else if isRich}
  <div class="rich-content {className}">{@html html}</div>
{:else}
  <div class="booklet-content {className}">
    {#each parts as part}
      {#if part.type === 'table'}
        <table>
          {#if part.header}<thead><tr>{#each part.header as cell}<th>{#if cell.includes("[[")}{@html renderRichTextHtml(cell, { fillCloze })}{:else}<InlineContent {alignRelations} text={cell} />{/if}</th>{/each}</tr></thead>{/if}
          <tbody>{#each part.rows as row}<tr>{#each row as cell}<td>{#if cell.includes("[[")}{@html renderRichTextHtml(cell, { fillCloze })}{:else}<InlineContent {alignRelations} text={cell} />{/if}</td>{/each}</tr>{/each}</tbody>
        </table>
      {:else if part.value.includes('[[')}
        <div class="rich-content">{@html renderRichTextHtml(part.value, { fillCloze })}</div>
      {:else}
        <InlineContent {alignRelations} text={part.value} />
      {/if}
    {/each}
  </div>
{/if}

<style>
  .booklet-content :global(.katex-display), .document-content :global(.katex-display) { text-align:left; margin:.5em 0; }
  .booklet-content :global(.katex-display > .katex), .document-content :global(.katex-display > .katex) { display:inline-block; }
  .theory-rules { margin:0; padding-left:7mm; list-style-position:outside; }.theory-rule { display:list-item; padding:0; }
  .theory-rule + .theory-rule { margin-top: 6mm; }
  .theory-rule ul { margin: 0; padding-left: 7.5mm; list-style-type: circle; }
  .rule-detail { display: grid; grid-template-columns: minmax(0, 1fr) 43mm; gap: 3mm; }
  .booklet-content table { width: 100%; margin: 2mm 0; border-collapse: collapse; table-layout: fixed; }
  .booklet-content th, .booklet-content td { padding: 1.5mm 2mm; border: .25mm solid var(--booklet-border); vertical-align: top; text-align: left; }
  .booklet-content th { background: var(--booklet-tableLabel); color: var(--booklet-ink); font-weight: 800; }
  .rich-content :global(p) { margin: 0 0 0.55rem; }
  .rich-content :global(p:last-child) { margin-bottom: 0; }
  .rich-content :global(.math-island) { white-space: nowrap; }
  :global(.cloze-island) { position:relative; display: inline-block; min-width: var(--cloze-width, 24mm); border-bottom: 1px var(--document-cloze-line,solid) currentColor; color: transparent; vertical-align: baseline; }
  :global(.cloze-island:not(:empty)) { color: inherit; }
</style>
