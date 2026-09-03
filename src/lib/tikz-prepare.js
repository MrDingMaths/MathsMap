// The pure, DOM-free half of TikZ rendering: normalise a `[tikz]` block's source, work out
// which LaTeX packages it needs, and build the preamble TikZJax must be handed.
//
// Extracted from src/lib/tikz.js (which touches `window` at import time and so cannot be
// loaded in Node) so the booklet PDF renderer prepares figures EXACTLY as the app does.
// If these rules ever diverge, a diagram that renders in the app prints differently — or
// silently stalls — in a booklet, which is the failure this split exists to prevent.

// CM design sizes bundled in public/libs/tikzjax/fonts/. `\fontsize{N}{M}` requests
// outside this set can fail in the worker → silent stall → infinite spinner.
export const TIKZ_CM_DESIGN_SIZES = [5, 6, 7, 8, 9, 10, 12, 17];

// Packages that change font encoding are dropped entirely: TikZJax bundles only CM fonts
// and fails with EC/T1 fonts at unusual sizes.
const TIKZJAX_UNSUPPORTED_PKG = /^(fontenc|inputenc|babel|lmodern|fontawesome|luatex85)$/;

// Every figure is compiled with these lines in the preamble.
export const TIKZ_PREAMBLE_LINES = [
  // Modern LaTeX (2020+) auto-loads textcomp and routes \$ through TC fonts,
  // but TikZJax only bundles CM fonts. Bind \textdollar to OT1 char 36 directly.
  '\\DeclareTextCommand{\\textdollar}{OT1}{\\char36 }',
  '\\usetikzlibrary{arrows,arrows.meta,patterns,calc,angles,quotes}',
  '\\usetikzlibrary{decorations.pathreplacing,decorations.markings,decorations.pathmorphing}',
  '\\usetikzlibrary{positioning,intersections,shadings}',
];

const _djb2 = (s) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
};
const _fnv1a = (s) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(36);
};

// ~64-bit composite key + length guard — a 32-bit hash alone risks serving the wrong
// cached SVG on collision once the cache spans thousands of diagrams.
export const tikzKey = (payload) =>
  `${_djb2(payload)}-${_fnv1a(payload)}-${payload.length.toString(36)}`;

function snapSize(n) {
  const v = parseFloat(n);
  if (!Number.isFinite(v)) return n;
  let best = TIKZ_CM_DESIGN_SIZES[0];
  let bestDist = Math.abs(v - best);
  for (const s of TIKZ_CM_DESIGN_SIZES) {
    const d = Math.abs(v - s);
    if (d < bestDist || (d === bestDist && s < best)) {
      best = s;
      bestDist = d;
    }
  }
  return String(best);
}

function commentSplit(line) {
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '%' && (i === 0 || line[i - 1] !== '\\')) {
      return [line.slice(0, i), line.slice(i)];
    }
  }
  return [line, ''];
}

const FONT_SIZE_RE = /\\fontsize\{(\d+(?:\.\d+)?)\}\{(\d+(?:\.\d+)?)\}/g;

/**
 * @param {string} code the raw body of a `[tikz]` block
 * @returns {{ cleanCode: string, pkgJson: string|null, extraPreamble: string[], preamble: string, key: string }}
 *   `preamble` is the exact string TikZJax wants in `data-add-to-preamble`, and `pkgJson`
 *   the exact string for `data-tex-packages` (null when no extra package is needed).
 */
export function prepareTikz(code) {
  // Hoist \usepackage lines out of the body: tikzjax wraps code in
  // \begin{document}…\end{document}, so a \usepackage inside it is
  // "Can be used only in preamble".
  const extraPreamble = [];
  let cleanCode = String(code)
    .replace(/^[ \t]*\\usepackage(\[.*?\])?\{([^}]+)\}[ \t]*\n?/gm, (match, _opts, pkgName) => {
      if (!TIKZJAX_UNSUPPORTED_PKG.test(pkgName.trim())) extraPreamble.push(match.trim());
      return '';
    })
    .replace(/^\n+/, '');

  // Snap \fontsize{N}{M} to bundled CM design sizes, per line, skipping LaTeX comments.
  cleanCode = cleanCode.split('\n').map((line) => {
    const [body, comment] = commentSplit(line);
    return body.replace(FONT_SIZE_RE, (match, n, m) => {
      const nn = snapSize(n);
      const mm = snapSize(m);
      return (nn === n && mm === m) ? match : `\\fontsize{${nn}}{${mm}}`;
    }) + comment;
  }).join('\n');

  // AGY structural results sometimes contain the visible TikZ body without the
  // environment wrapper. A body made only of drawing commands is unambiguous and
  // can be completed deterministically for both browser and PDF rendering.
  if (!/\\begin\{tikzpicture\}/.test(cleanCode) && /\\(?:draw|path|node|coordinate|fill|shade)\b/.test(cleanCode)) {
    cleanCode = `\\begin{tikzpicture}\n${cleanCode.trim()}\n\\end{tikzpicture}`;
  }

  // Which packages the renderer must inject, detected from the source exactly as the app
  // detects them (docs/tikz-prompt.md: the author never writes \usepackage for these).
  const pkgs = {};
  if (/\\begin\{axis\}|\\addplot|\\pgfplots/.test(cleanCode)) pkgs.pgfplots = '';
  if (/\\tdplotsetmaincoords|\\tdplotsetrotatedcoords|\\begin\{tdplot|\\tdplot/.test(cleanCode)) pkgs['tikz-3dplot'] = '';
  if (/\\tfrac|\\dfrac|\\frac\{|\\text\{|\\operatorname|\\mathbb|\\bm\{|\\underset\{|\\overset\{/.test(cleanCode)) pkgs.amsmath = '';
  if (/\\mathbb|\\varnothing|\\therefore|\\square|\\blacksquare|\\triangle\b|\\angle\b/.test(cleanCode)) pkgs.amssymb = '';
  const pkgJson = Object.keys(pkgs).length ? JSON.stringify(pkgs) : null;

  return {
    cleanCode,
    pkgJson,
    extraPreamble,
    preamble: [...TIKZ_PREAMBLE_LINES, ...extraPreamble].join('\n'),
    key: tikzKey(`${cleanCode}|${pkgJson || ''}|${extraPreamble.join(';')}`),
  };
}
