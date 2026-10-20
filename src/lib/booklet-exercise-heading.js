// Source exercises may be explicitly unnumbered; their complete label already
// supplies the heading noun. Keep all numbered and other labels unchanged.
export function exerciseHeading(label) {
  const text=String(label).trim();
  return /^Exercises?$/.test(text)?text:`Exercise ${label}`;
}
