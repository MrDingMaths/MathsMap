<script>
  let {value = '', label, editable = false, onstart, oncommit} = $props();
  let element = $state(), editing = $state(false);
  $effect(() => { if (element && !editing) element.textContent = value; });

  function commit() {
    const next = element.textContent;
    editing = false;
    if (next !== value) oncommit?.(next);
    // Required fields may reject an empty value.
    element.textContent = value;
  }
  function keydown(event) {
    if (event.isComposing) return;
    if (event.key === 'Escape') {
      event.preventDefault(); event.stopPropagation();
      element.textContent = value; element.blur();
    } else if (event.key === 'Enter') {
      event.preventDefault(); element.blur();
    } else if ((event.ctrlKey || event.metaKey) && ['s', 'p'].includes(event.key.toLowerCase())) {
      element.blur(); // Save the field before Studio handles Save or Print.
    } else if ((event.ctrlKey || event.metaKey) && ['z', 'y'].includes(event.key.toLowerCase())) {
      event.stopPropagation();
    }
  }
  function paste(event) {
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain').replace(/\s+/g, ' ');
    document.execCommand('insertText', false, text);
  }
</script>

{#if editable}
  <span bind:this={element} class="cover-field" contenteditable="true" role="textbox" tabindex="0" aria-label={label} aria-multiline="false" data-placeholder={label} title="Click to edit. Enter saves; Escape cancels." spellcheck="false" onfocus={() => {onstart?.(); editing = true;}} onblur={commit} onkeydown={keydown} onpaste={paste}></span>
{:else}{value}{/if}

<style>
  .cover-field {display:inline-block;min-width:1ch;max-width:100%;white-space:pre-wrap;overflow-wrap:anywhere;cursor:text;outline:1px dashed transparent;outline-offset:2px}
  .cover-field:hover,.cover-field:focus {outline-color:#52769a}
  .cover-field:empty::before {content:attr(data-placeholder);opacity:.5}
  @media print {.cover-field {outline:none!important}.cover-field:empty::before {content:none}}
</style>
