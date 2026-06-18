<script module>
  import katex from 'katex';

  // Split a mixed string into prose and `$...$` maths runs, render the maths
  // with KaTeX, and HTML-escape the prose. The result is a trusted HTML string
  // (KaTeX output plus escaped text) safe to drop in with {@html}.
  const escapeHtml = (s) =>
    s.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  // Cache renders — the same titles/blurbs recur across many cards.
  const cache = new Map();

  export function renderMath(text) {
    if (text == null) return '';
    const str = String(text);
    if (cache.has(str)) return cache.get(str);

    let html = '';
    // Alternating split: even indices are prose, odd indices are LaTeX.
    // A literal `$` is written `\$` and is left untouched by this split.
    const parts = str.split(/(?<!\\)\$([^$]*?)(?<!\\)\$/);
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        html += escapeHtml(parts[i]).replace(/\\\$/g, '$');
      } else {
        try {
          html += katex.renderToString(parts[i], {
            throwOnError: false,
            displayMode: false,
            output: 'htmlAndMathml'
          });
        } catch {
          html += escapeHtml('$' + parts[i] + '$');
        }
      }
    }
    cache.set(str, html);
    return html;
  }
</script>

<script>
  let { text = '', tag = 'span', class: className = '' } = $props();
  let html = $derived(renderMath(text));
</script>

<svelte:element this={tag} class={className}>{@html html}</svelte:element>
