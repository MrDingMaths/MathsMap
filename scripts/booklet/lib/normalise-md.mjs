// Turns a slice of pandoc-from-docx markdown into the shared rich-text format used by both
// banks (docs/content-schema.md): `$…$` inline maths, `**bold**`, newline = line break.
//
// Every rule here is a MECHANICAL repair of a known Word/pandoc artefact, measured against
// the pilot booklet. None of it is judgement — judgement belongs to the transcription
// agent, and anything ambiguous is left exactly as it is so a human or the fidelity check
// sees it. Counts in the comments are occurrences in
// `booklets/Stage 5/Trigonometry C 2_Non-Right-Angled Trigonometry.md`.

/**
 * Word's "AI-generated content may be incorrect" alt text (45 occurrences) is noise that
 * would otherwise be transcribed as if it described the figure. The image ref itself is
 * kept — image-refs.mjs reads it — only the alt text is emptied.
 */
export function stripAltText(text) {
  return text.replace(/!\[[^\]]*\]\(/g, '![](');
}

/**
 * `$$…$$` display maths is not part of the shared format (inline `$…$` only), and Word
 * emits worked solutions as ONE display block whose steps are brace groups:
 *
 *   $${\frac{x}{\sin 80} = \frac{7}{\sin 75}
 *   }{x = \frac{7\sin 80}{\sin 75}
 *   }{\approx 7.1\ m}$$
 *
 * which is the booklet's equals-aligned working. Each brace group becomes its own `$…$`
 * line, which is exactly how the house style stores working.
 */
export function convertDisplayMath(text) {
  return text.replace(/\$\$([\s\S]*?)\$\$/g, (whole, body) => {
    const inner = body.trim();
    // The brace-group form: `{step}{step}{step}`.
    if (inner.startsWith('{') && inner.endsWith('}')) {
      const steps = splitBraceGroups(inner);
      if (steps.length > 1) return steps.map((s) => `$${collapseWhitespace(s)}$`).join('\n');
    }
    return `$${collapseWhitespace(inner)}$`;
  });
}

// Split `{a}{b}{c}` at depth-0 boundaries. Returns [] when the string is not that shape.
function splitBraceGroups(inner) {
  const groups = [];
  let depth = 0;
  let start = -1;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    const escaped = i > 0 && inner[i - 1] === '\\';
    if (escaped) continue;
    if (ch === '{') {
      if (depth === 0) start = i + 1;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start >= 0) {
        groups.push(inner.slice(start, i));
        start = -1;
      } else if (depth < 0) {
        return [];
      }
    }
  }
  return depth === 0 ? groups : [];
}

function collapseWhitespace(str) {
  return str.replace(/\s*\n\s*/g, ' ').replace(/[ \t]{2,}/g, ' ').trim();
}

/**
 * Word writes degrees as `{^\circ}` inside maths (204 occurrences) and as a bare `°`
 * character in prose (103). Both become the house `^{\circ}`; the bare form is only
 * converted when it follows a number, and prose degrees outside maths are wrapped.
 */
export function normaliseDegrees(text) {
  return text
    .replace(/\{\^\\circ\}/g, '^{\\circ}')
    .replace(/\^\{?\\circ\}?/g, '^{\\circ}');
}

/**
 * pandoc mis-escapes a closing math delimiter that abuts a word, emitting
 * `$ABC\$to` where the source said `$ABC$ to` (4 occurrences). Left alone it is an
 * unbalanced-delimiter error in every downstream lint.
 */
export function fixEscapedDollarGlitch(text) {
  return text.replace(/\\\$(?=[A-Za-z])/g, '$ ');
}

/**
 * Word superscripts survive as pandoc's `^…^` markup, which is not in the shared format:
 * `cm^2^` (24), `m^2^` (17), `km^2^` (5), `mm^2^` (4), `cm^3^` (1).
 */
export function fixUnitSuperscripts(text) {
  return text.replace(/\b(c?m|km|mm)\^(\d)\^/g, '$1$^$2$');
}

/**
 * Blockquoted formulas (`> $$…$$`) are Word's centred-formula paragraphs; the quote marker
 * carries no meaning in the bank. Also drops pandoc's `<!-- -->` list separators.
 */
export function stripMarkers(text) {
  return text
    .replace(/^[ \t]*>[ \t]?/gm, '')
    .replace(/^[ \t]*<!-- -->[ \t]*$/gm, '');
}

/**
 * A trailing backslash is Word's hard line break (334 occurrences) and means exactly what
 * a newline means in the shared format.
 */
export function fixHardBreaks(text) {
  return text.replace(/\\$/gm, '');
}

/** Full pipeline, in dependency order. */
export function normaliseInline(text) {
  if (typeof text !== 'string') return '';
  let out = text;
  out = stripAltText(out);
  out = stripMarkers(out);
  out = fixHardBreaks(out);
  out = fixEscapedDollarGlitch(out);
  out = convertDisplayMath(out);
  out = normaliseDegrees(out);
  out = fixUnitSuperscripts(out);
  out = out.replace(/[ \t]+$/gm, '');
  out = out.replace(/\n{3,}/g, '\n\n');
  return out.trim();
}
