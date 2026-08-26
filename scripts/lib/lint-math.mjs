// Field-level lints for human-visible text: KaTeX `$…$` delimiter balance (whole-string
// AND per-line), each math segment actually rendering, `**bold**` pairing, and raw control
// characters. Extracted from validate.mjs so the rules are unit-testable without running
// the whole validator over public/.
import katex from 'katex';

export function isEscaped(str, idx) {
  let count = 0;
  let i = idx - 1;
  while (i >= 0 && str[i] === '\\') {
    count++;
    i--;
  }
  return count % 2 === 1;
}

// Lints a single human-visible text field: balanced unescaped `$…$` math
// delimiters (each segment must KaTeX-render), and balanced `**bold**` pairs.
// Pushes formatted error strings onto `problems`.
// Raw control characters in a string value are the fingerprint of a
// single-escaped LaTeX macro silently corrupted by JSON.parse
// (`\times` → TAB+`imes`, `\frac` → FF+`rac`, `\text` → TAB+`ext`) — KaTeX
// then renders the residue as innocent italic letters, so only this check
// catches it. Newline is allowed (legitimate in multi-line tikz code).
const CONTROL_CHAR_NAMES = { '\t': 'TAB (\\t — corrupted \\times/\\text/\\tfrac?)', '\f': 'FORMFEED (\\f — corrupted \\frac?)', '\b': 'BACKSPACE (\\b — corrupted \\begin/\\bar?)', '\r': 'CR (\\r — corrupted \\right/\\rule?)' };
export function lintControlChars(str, where, problems) {
  const m = str.match(/[\x00-\x09\x0B-\x1F]/);
  if (m) {
    const name = CONTROL_CHAR_NAMES[m[0]] || `control char 0x${m[0].charCodeAt(0).toString(16).padStart(2, '0')}`;
    problems.push(`${where}: raw ${name} in string — a LaTeX backslash was probably not doubled in the JSON`);
  }
}

// A \node that positions itself relative to its OWN name — `below=0pt of b1.south west`
// on the node being named `(b1)` — is an undefined-node reference: TikZ fails to compile the
// whole picture, so the figure silently disappears from the card. Generated table figures hit
// this twice in W3-1 (prepare-budget mastery[1] and development[3]), once caught by the blind
// checker reading the source and once only by actually rendering it. It is mechanical and
// certain, so it belongs in the gate rather than in a render pass or a model's judgement.
export function lintSelfReferencingNodes(tikz, where, problems) {
  // \node[... of <ref>...] (<name>) — the option block precedes the name.
  for (const m of String(tikz || '').matchAll(/\\node\s*\[([^\]]*)\]\s*\(\s*([A-Za-z0-9_]+)\s*\)/g)) {
    const [, options, name] = m;
    const anchors = [...options.matchAll(/\bof\s+([A-Za-z0-9_]+)/g)].map(a => a[1]);
    if (anchors.includes(name)) {
      problems.push(`${where}: node (${name}) is positioned relative to itself ("of ${name}") — an undefined-node reference that fails to compile; anchor it to the previously defined node instead`);
    }
  }
}

export function lintMathString(str, where, problems) {
  if (typeof str !== 'string') {
    problems.push(`${where}: expected a string, got ${typeof str}`);
    return;
  }
  lintControlChars(str, where, problems);
  const dollarIdx = [];
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '$' && !isEscaped(str, i)) dollarIdx.push(i);
  }
  if (dollarIdx.length % 2 !== 0) {
    problems.push(`${where}: unbalanced $ delimiters — "${str}"`);
  } else {
    // A math span must also close on the line it opened. Newlines render as line
    // breaks (content-schema.md: one line per working step), so a `$` left open at
    // end-of-line swallows the next step into the maths instead of rendering it.
    // The whole-string parity check above cannot see this: an even number of
    // delimiters spread one-per-line across four lines balances overall while every
    // line renders wrong. Measured against the whole corpus when added: exactly two
    // fields tripped it, both genuine defects.
    let lineStart = 0;
    for (let line = 0, i = 0; i <= str.length; i++) {
      if (i === str.length || str[i] === '\n') {
        const onThisLine = dollarIdx.filter(d => d >= lineStart && d < i).length;
        if (onThisLine % 2 !== 0) {
          problems.push(`${where}: $ opened but not closed on line ${line + 1} — "${str.slice(lineStart, i)}"`);
          break;
        }
        lineStart = i + 1;
        line++;
      }
    }

    for (let k = 0; k < dollarIdx.length; k += 2) {
      const seg = str.slice(dollarIdx[k] + 1, dollarIdx[k + 1]);
      try {
        katex.renderToString(seg, { throwOnError: true });
      } catch (e) {
        problems.push(`${where}: KaTeX error in "$${seg}$" — ${e.message}`);
      }
    }
  }
  const starMatches = str.match(/\*\*/g) || [];
  if (starMatches.length % 2 !== 0) {
    problems.push(`${where}: unbalanced ** pairs — "${str}"`);
  }
}

