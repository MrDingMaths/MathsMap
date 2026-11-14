// Splits skill-page rich text into a stem and lettered parts so the public
// skill page can show booklet-style part labels (bold "a", "b", … in a label
// column) and pair each worked-example prompt part with its working.
//
// Content stores parts as lines that open with "(a) ", "(b) ", … . A split is
// accepted only for a consecutive run a, b, c, … starting at "a"; anything else
// (a lone "(b)", a repeated letter, letters inside a [tikz] block) leaves the
// text whole so nothing is mislabelled.

const PART_LINE = /^\(([a-z])\)[ \t]+/;

export function splitParts(text) {
  const whole = { stem: typeof text === 'string' ? text : '', parts: [] };
  if (typeof text !== 'string' || !text.includes('(a)')) return whole;
  const lines = text.split('\n');
  const stem = [];
  const parts = [];
  let inTikz = false;
  for (const line of lines) {
    const match = inTikz ? null : PART_LINE.exec(line);
    if (match) {
      const expected = String.fromCharCode(97 + parts.length);
      if (match[1] !== expected) return whole;
      parts.push({ label: match[1], lines: [line.slice(match[0].length)] });
    } else if (parts.length) {
      parts.at(-1).lines.push(line);
    } else {
      stem.push(line);
    }
    if (line.includes('[tikz]')) inTikz = true;
    if (line.includes('[/tikz]')) inTikz = false;
  }
  if (parts.length < 2) return whole;
  return {
    stem: stem.join('\n').trim(),
    parts: parts.map(({ label, lines: body }) => ({ label, text: body.join('\n').trim() })),
  };
}

// Pairs prompt and solution parts when both carry the same labels in order.
// Returns null when they do not line up, so the caller shows them whole.
export function pairParts(prompt, solution) {
  const q = splitParts(prompt);
  const s = splitParts(solution);
  if (!q.parts.length || q.parts.length !== s.parts.length) return null;
  if (q.parts.some((part, i) => part.label !== s.parts[i].label)) return null;
  return {
    stem: q.stem,
    solutionStem: s.stem,
    rows: q.parts.map((part, i) => ({ label: part.label, prompt: part.text, solution: s.parts[i].text })),
  };
}
