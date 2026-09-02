<script>
  import { onMount } from 'svelte';
  import { normalizeRichText, parseEditorDom, parseRichText, renderRichTextHtml, serializeRichText } from '../../lib/maths-editor.js';

  let {
    value = '',
    sourceFallback = '',
    label = 'Editable maths prose',
    placeholder = 'Write prose, then use the palette for maths or cloze blanks.',
    onchange = () => {},
    onfocus = () => {},
    onblur = () => {},
  } = $props();

  let editorEl = $state(null);
  let sourceText = $state(sourceFallback || serializeRichText(value));
  let showSource = $state(false);
  let history = $state([]);
  let historyIndex = $state(-1);
  let lastSource = '';
  let savedRange = null;

  const palette = [
    ['x', 'x'], ['x^2', 'x²'], ['\\frac{a}{b}', 'fraction'], ['\\sqrt{x}', '√x'],
    ['\\le', '≤'], ['\\ge', '≥'], ['\\rightarrow', '→'], ['\\pi', 'π']
  ];

  function emit(next, source = serializeRichText(next)) {
    sourceText = source;
    onchange({ richText: next, source });
  }

  function renderValue(next) {
    if (!editorEl) return;
    editorEl.innerHTML = renderRichTextHtml(next, { editable: true });
    lastSource = serializeRichText(next);
  }

  function remember(source) {
    if (historyIndex >= 0 && history[historyIndex] === source) return;
    history = history.slice(0, historyIndex + 1).concat(source);
    if (history.length > 80) history = history.slice(-80);
    historyIndex = history.length - 1;
  }

  function handleInput() {
    const next = parseEditorDom(editorEl);
    const source = serializeRichText(next);
    remember(source);
    lastSource = source;
    emit(next, source);
  }

  function saveSelection() {
    const selection = window.getSelection();
    if (!selection?.rangeCount || !editorEl?.contains(selection.anchorNode)) return;
    savedRange = selection.getRangeAt(0).cloneRange();
  }

  function restoreSelection() {
    if (!savedRange || !editorEl) return;
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedRange);
  }

  function insertIsland(kind, data) {
    editorEl?.focus();
    restoreSelection();
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    const node = document.createElement('span');
    node.dataset.nodeType = kind;
    node.contentEditable = 'false';
    if (kind === 'math') {
      node.dataset.latex = data;
      node.dataset.source = `$${data}$`;
      node.className = 'editor-math-island';
      node.textContent = `$${data}$`;
    } else {
      node.dataset.answer = data?.answer ?? '';
      node.dataset.width = String(data?.width ?? 24);
      node.className = 'editor-cloze-island';
      node.style.setProperty('--cloze-width', `${data?.width ?? 24}mm`);
      node.textContent = 'blank';
    }
    range.deleteContents();
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    handleInput();
  }

  function insertCloze() {
    const answer = window.prompt('Stored answer for this cloze blank', '');
    if (answer === null) return;
    const width = window.prompt('Underline width in millimetres', '24');
    if (width === null) return;
    insertIsland('cloze', { answer, width: Number(width) || 24 });
  }

  function command(mark) {
    editorEl?.focus();
    restoreSelection();
    document.execCommand(mark, false);
    handleInput();
  }

  function moveHistory(direction) {
    const nextIndex = Math.max(0, Math.min(history.length - 1, historyIndex + direction));
    if (nextIndex === historyIndex || !history[nextIndex]) return;
    historyIndex = nextIndex;
    const next = parseRichText(history[nextIndex]);
    renderValue(next);
    emit(next, history[nextIndex]);
  }

  function handleKeydown(event) {
    const modifier = event.ctrlKey || event.metaKey;
    if (modifier && event.key.toLowerCase() === 'b') { event.preventDefault(); command('bold'); return; }
    if (modifier && event.key.toLowerCase() === 'i') { event.preventDefault(); command('italic'); return; }
    if (modifier && event.key.toLowerCase() === 'z') { event.preventDefault(); moveHistory(event.shiftKey ? 1 : -1); return; }
    if (modifier && event.key.toLowerCase() === 'y') { event.preventDefault(); moveHistory(1); return; }
    if (event.key === 'Tab' && !event.shiftKey) { event.preventDefault(); insertIsland('math', 'x'); }
  }

  function handleSourceInput(event) {
    sourceText = event.currentTarget.value;
    const next = parseRichText(sourceText);
    remember(sourceText);
    renderValue(next);
    emit(next, sourceText);
  }

  onMount(() => {
    const next = normalizeRichText(value);
    renderValue(next);
    remember(serializeRichText(next));
    return () => {};
  });

  $effect(() => {
    const nextSource = serializeRichText(value);
    if (editorEl && nextSource !== lastSource && document.activeElement !== editorEl) renderValue(value);
    if (!sourceText && (sourceFallback || nextSource)) sourceText = sourceFallback || nextSource;
  });
</script>

<div class="maths-editor" aria-label={label}>
  <div class="editor-toolbar" role="toolbar" aria-label="Formatting and maths tools">
    <button type="button" title="Bold (Ctrl+B)" aria-label="Bold" onmousedown={(event) => event.preventDefault()} onclick={() => command('bold')}><strong>B</strong></button>
    <button type="button" title="Italic (Ctrl+I)" aria-label="Italic" onmousedown={(event) => event.preventDefault()} onclick={() => command('italic')}><em>I</em></button>
    <span class="toolbar-divider"></span>
    {#each palette as [latex, title]}
      <button type="button" class="palette-button" title={`Insert ${title}`} onclick={() => insertIsland('math', latex)}>{title}</button>
    {/each}
    <button type="button" class="cloze-button" title="Insert inline cloze" onclick={insertCloze}>cloze</button>
    <span class="toolbar-spacer"></span>
    <button type="button" title="Undo" aria-label="Undo" onclick={() => moveHistory(-1)}>↶</button>
    <button type="button" title="Redo" aria-label="Redo" onclick={() => moveHistory(1)}>↷</button>
  </div>
  <div
    class="editor-surface"
    class:empty={!sourceText}
    contenteditable="true"
    role="textbox"
    tabindex="0"
    aria-multiline="true"
    data-placeholder={placeholder}
    bind:this={editorEl}
    onkeydown={handleKeydown}
    oninput={handleInput}
    onmouseup={saveSelection}
    onkeyup={saveSelection}
    onfocus={() => onfocus()}
    onblur={() => { saveSelection(); onblur(); }}
  ></div>
  <details class="source-fallback" open={showSource} ontoggle={(event) => (showSource = event.currentTarget.open)}>
    <summary>Source fallback</summary>
    <p>Keep the original rich-text source here when a block contains notation the visual editor cannot interpret yet.</p>
    <textarea aria-label="Rich-text source fallback" value={sourceText} oninput={handleSourceInput}></textarea>
  </details>
</div>

<style>
  .maths-editor { border: 1px solid #d6dce5; border-radius: 8px; background: #fff; color: #172033; }
  .editor-toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 0.22rem; padding: 0.35rem; border-bottom: 1px solid #e3e7ed; background: #f7f9fc; }
  .editor-toolbar button { min-width: 28px; height: 28px; padding: 0 0.4rem; border: 1px solid transparent; border-radius: 5px; background: transparent; color: #23395d; font: 700 0.75rem Arial, sans-serif; cursor: pointer; }
  .editor-toolbar button:hover, .editor-toolbar button:focus-visible { border-color: #b7c4d7; background: #fff; outline: none; }
  .palette-button { font-weight: 400 !important; font-family: Georgia, serif !important; }
  .cloze-button { color: #a52e28 !important; }
  .toolbar-divider { width: 1px; height: 18px; margin: 0 0.2rem; background: #d6dce5; }
  .toolbar-spacer { flex: 1; }
  .editor-surface { min-height: 5rem; padding: 0.7rem 0.8rem; font: 0.92rem/1.45 Arial, sans-serif; outline: none; }
  .editor-surface.empty::before { content: attr(data-placeholder); color: #8b96a8; pointer-events: none; }
  .editor-surface :global(p) { margin: 0 0 0.55rem; }
  .editor-surface :global(p:last-child) { margin-bottom: 0; }
  .editor-surface :global(.editor-math-island), .editor-surface :global(.editor-cloze-island) { display: inline-block; padding: 0 0.22rem; border-radius: 4px; background: #eef3fb; color: #23395d; vertical-align: baseline; }
  .editor-surface :global(.editor-math-island) { font-family: Georgia, serif; }
  .editor-surface :global(.editor-cloze-island) { min-width: var(--cloze-width, 24mm); border-bottom: 2px solid #23395d; background: #fff; color: transparent; }
  .source-fallback { border-top: 1px solid #e3e7ed; padding: 0.45rem 0.7rem 0.65rem; color: #66758d; font-size: 0.7rem; }
  .source-fallback summary { cursor: pointer; color: #23395d; font-weight: 700; }
  .source-fallback p { margin: 0.45rem 0; }
  .source-fallback textarea { width: 100%; min-height: 4.5rem; box-sizing: border-box; padding: 0.5rem; border: 1px solid #d6dce5; border-radius: 5px; background: #fbfcfe; color: #172033; font: 0.76rem/1.4 ui-monospace, Consolas, monospace; resize: vertical; }
</style>
