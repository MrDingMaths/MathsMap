// Canonicalisation of MCQ option text into a value key, so options that are
// mathematically equal but written differently (fractions vs decimals,
// unsimplified ratios, trailing zeros...) can be detected as collisions.
// Extracted from scripts/audit-equivalent-options.mjs so it can be reused by
// scripts/audit-option-hygiene.mjs (LEAKED-KEY check) without duplication.

export function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

// Macros whose value cannot survive the strip below: dropping `\sqrt` would turn
// √3 into 3 and report a bogus collision. Powers are excluded too, except the
// degree marker `^{\circ}`, which is a unit rather than an exponent.
export function hasUnstrippableMath(text) {
  const s = String(text);
  if (/\\(sqrt|pi|times|div|cdot|pm|approx|dot|overline)\b/.test(s)) return true;
  if (/\^(?!\{?\\circ)/.test(s)) return true;
  return false;
}

// The \frac{a}{b} step below (and its own downstream consumers, e.g. this
// repo's compound-fraction convention "(num)/(den)") produce a parenthesised
// "(a)/(b)" form. When a and b are plain signed numbers, collapse that back
// to bare "a/b" so the numeric-fraction branch in canonicalise() can parse
// it. Conservative on purpose: an algebraic compound fraction such as
// "(2x+3)/(3y-1)" has non-numeric content inside the parens and must still
// fall through unchanged (and later return null) — never guess at a value
// for those.
function collapseNumericParenFraction(text) {
  return text.replace(
    /(-?)\((-?\d+(?:\.\d+)?)\)\/\((-?\d+(?:\.\d+)?)\)/g,
    (_, sign, num, den) => `${sign === '-' && !num.startsWith('-') ? `-${num}` : num}/${den}`,
  );
}

// Strip the LaTeX/markup shell, turning \frac{a}{b} into a/b so the value survives.
export function bareText(text) {
  return collapseNumericParenFraction(
    String(text)
      .replace(/\\d?frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)')
      .replace(/\\dfrac|\\tfrac|\\frac/g, '')
      .replace(/\\text\{([^{}]*)\}/g, '$1')
      .replace(/\\[a-zA-Z]+/g, ' ')
      .replace(/[$\\{}]/g, ''),
  ).trim();
}

// "3", "3.5", "1/2", "(3)/(4)" → Number. null if not a lone numeric.
export function toNumber(raw) {
  const s = raw.replace(/[()\s,]/g, '');
  if (!s) return null;
  if (/^-?\d+(\.\d+)?$/.test(s)) return parseFloat(s);
  const frac = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (frac) {
    const d = parseFloat(frac[2]);
    if (d === 0) return null;
    return parseFloat(frac[1]) / d;
  }
  // mixed number written as "2 1/2" survives the space strip as "21/2", so only
  // handle the explicit-space form before stripping — done by the caller.
  return null;
}

// A unit may carry letters, %, degrees, per-slashes and squared/cubed marks —
// never a digit, an operator or a bracket.
export function isPureUnit(tail) {
  return /^[a-zA-Z%°/²³\s.]*$/.test(String(tail));
}

// Units decide whether two equal numbers are really the same answer. Currency
// markers live at the front, so recover them from the original string.
export function normaliseUnit(tail, whole) {
  const unit = String(tail).replace(/[^a-zA-Z%°/^²³]/g, '').toLowerCase();
  const currency = /[$€£]/.test(whole) ? '$' : '';
  return currency + unit;
}

// Canonical key for an option, or null when we can't parse it confidently.
// Ratios canonicalise to lowest integer terms; lone numbers to a fixed-precision
// value plus any trailing unit, so "3.5 km" and "3.50 km" collide but "3.5 km"
// and "3.5 h" do not.
export function canonicalise(text) {
  if (hasUnstrippableMath(text)) return null;
  const bare = bareText(text);
  if (!bare) return null;

  // --- ratio form: a:b, a:b:c, terms may be integers, decimals or fractions ---
  if (bare.includes(':')) {
    const body = bare.replace(/\s/g, '');
    if (!/^[-0-9.:()/]+$/.test(body)) return null;
    const parts = body.split(':');
    if (parts.length < 2) return null;
    const nums = parts.map(toNumber);
    if (nums.some((n) => n === null || !Number.isFinite(n))) return null;
    let mult = 1;
    for (const n of nums) {
      const decimals = (String(n).split('.')[1] || '').length;
      if (decimals > 6) return null; // recurring/irrational — don't guess
      mult = Math.max(mult, 10 ** decimals);
    }
    const ints = nums.map((n) => Math.round(n * mult));
    let g = ints[0];
    for (const n of ints) g = gcd(g, n);
    if (!g) return null;
    return `ratio:${ints.map((n) => n / g).join(':')}`;
  }

  // --- lone number, optionally with a unit or currency marker ---
  // The tail must be a PURE unit. Anything else (another number, an operator, a
  // bracket) means the option is an expression, not a value: `8 - 5` and `8 + 5`
  // must never collide just because both start with 8.
  const mixed = bare.match(/^(-?\d+)\s+(\d+)\/(\d+)\s*(.*)$/); // "2 1/2 kg"
  if (mixed) {
    if (!isPureUnit(mixed[4])) return null;
    const whole = parseInt(mixed[1], 10);
    const denom = parseInt(mixed[3], 10);
    if (denom === 0) return null;
    const sign = whole < 0 ? -1 : 1;
    const value = whole + sign * (parseInt(mixed[2], 10) / denom);
    return `num:${value.toPrecision(10)}|${normaliseUnit(mixed[4], bare)}`;
  }
  const m = bare.match(/^([-$€£]?\s*-?[\d.,]+(?:\s*\/\s*[\d.,]+)?)\s*(.*)$/);
  if (!m) return null;
  if (!isPureUnit(m[2])) return null;
  const value = toNumber(m[1].replace(/[$€£]/g, ''));
  if (value === null || !Number.isFinite(value)) return null;
  return `num:${value.toPrecision(10)}|${normaliseUnit(m[2], bare)}`;
}
