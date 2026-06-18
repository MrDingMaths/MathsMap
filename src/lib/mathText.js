// Renders inline `$...$` LaTeX down to a compact, readable Unicode string —
// used for the Cytoscape graph node labels, which are drawn on a <canvas> and
// so cannot use KaTeX (HTML). Everywhere else uses the <Math> component instead.
//
// This is a best-effort, label-grade converter (not a LaTeX engine): it covers
// the notation actually present in the dataset and degrades gracefully.

const SUP = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹',
  '+':'⁺','-':'⁻','n':'ⁿ','x':'ˣ','a':'ᵃ','b':'ᵇ','c':'ᶜ','d':'ᵈ','m':'ᵐ','i':'ⁱ','r':'ʳ','k':'ᵏ','t':'ᵗ' };
const SUB = { '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉',
  'a':'ₐ','e':'ₑ','n':'ₙ','x':'ₓ' };

const COMMANDS = {
  times: '×', div: '÷', cdot: '·', pm: '±', mp: '∓', le: '≤', leq: '≤', ge: '≥', geq: '≥',
  ne: '≠', neq: '≠', approx: '≈', equiv: '≡', Leftrightarrow: '⇔', to: '→', rightarrow: '→',
  Rightarrow: '⇒', Leftarrow: '⇐', mapsto: '↦',
  land: '∧', wedge: '∧', lor: '∨', vee: '∨', neg: '¬', lnot: '¬',
  forall: '∀', exists: '∃', therefore: '∴', nabla: '∇', partial: '∂',
  infty: '∞', propto: '∝', cup: '∪', cap: '∩', in: '∈', notin: '∉', subseteq: '⊆', subset: '⊂',
  int: '∫', sum: 'Σ', Sigma: 'Σ', prod: '∏', lambda: 'λ', alpha: 'α', beta: 'β', gamma: 'γ', omega: 'ω', phi: 'φ',
  Delta: 'Δ', mu: 'μ', sigma: 'σ', pi: 'π', theta: 'θ', circ: '°', ldots: '…', cdots: '⋯',
  left: '', right: '',
  displaystyle: '', textstyle: '', ',': ' ', ';': ' ', ' ': ' ', '!': '',
  ln: 'ln', log: 'log', sin: 'sin', cos: 'cos', tan: 'tan', sec: 'sec', cot: 'cot',
  csc: 'csc', lim: 'lim', exp: 'exp'
};

const toScript = (s, map) => [...s].every((c) => map[c]) ? [...s].map((c) => map[c]).join('') : null;

export function plainMath(input) {
  if (input == null) return '';
  let s = String(input);

  // Render each `$...$` run; leave prose between runs as-is.
  return s.replace(/\$([^$]*)\$/g, (_, tex) => renderRun(tex));
}

function renderRun(tex) {
  let s = tex;

  // Structural commands first.
  // \operatorname{name} / \text{words} / \mathrm{..} / \mathbf{..} -> inner text
  s = s.replace(/\\(?:operatorname|text|mathrm|mathbf|mathrm|boldsymbol)\s*\{([^{}]*)\}/g, '$1');
  // Accents: append the matching combining mark to the inner text.
  s = s.replace(/\\(?:vec|overrightarrow)\s*\{([^{}]*)\}/g, (_, x) => x + '⃗'); // →
  s = s.replace(/\\(?:bar|overline)\s*\{([^{}]*)\}/g, (_, x) => x + '̄'); // macron
  s = s.replace(/\\ddot\s*\{([^{}]*)\}/g, (_, x) => x + '̈'); // diaeresis
  s = s.replace(/\\dot\s*\{([^{}]*)\}/g, (_, x) => x + '̇');
  s = s.replace(/\\hat\s*\{([^{}]*)\}/g, (_, x) => x + '̂');
  s = s.replace(/\\underset\s*\{[^{}]*\}\s*\{([^{}]*)\}/g, '$1');
  // \frac/\tfrac/\dfrac{a}{b} -> a/b (parenthesise multi-symbol parts)
  s = s.replace(/\\[tdc]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, (_, a, b) => {
    const wrap = (x) => (/[+\-*/^ ]/.test(x.trim()) ? `(${x})` : x);
    return `${wrap(a)}/${wrap(b)}`;
  });
  // \sqrt[n]{x} -> ⁿ√(x) ; \sqrt{x} -> √(x)
  s = s.replace(/\\sqrt\s*\[([^\]]*)\]\s*\{([^{}]*)\}/g, (_, n, x) => `${toScript(n, SUP) || ('^' + n)}√(${x})`);
  s = s.replace(/\\sqrt\s*\{([^{}]*)\}/g, (_, x) => (x.length > 1 ? `√(${x})` : `√${x}`));

  // Degrees are written ^{\circ} or ^\circ — render as ° rather than a superscript.
  s = s.replace(/\^\s*\{?\s*\\circ\s*\}?/g, '°');

  // Named commands -> Unicode, done before scripts so e.g. \pi inside ^{...} works.
  s = s.replace(/\\([A-Za-z]+|[,;!\s])/g, (_, name) => (name in COMMANDS ? COMMANDS[name] : ''));

  // Superscripts/subscripts: ^{...}/_{...} and single-char ^x/_x
  s = s.replace(/\^\{([^{}]*)\}/g, (_, x) => toScript(x, SUP) || `^(${x})`);
  s = s.replace(/_\{([^{}]*)\}/g, (_, x) => toScript(x, SUB) || `_${x}`);
  s = s.replace(/\^(\w)/g, (_, x) => SUP[x] || `^${x}`);
  s = s.replace(/_(\w)/g, (_, x) => SUB[x] || `_${x}`);

  // Strip any leftover braces and tidy spacing.
  s = s.replace(/[{}]/g, '');
  return s.replace(/\s{2,}/g, ' ').trim();
}
