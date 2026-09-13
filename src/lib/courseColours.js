// Derive a quieter map fill from a canonical course-key colour.
// The map key keeps the canonical colour; this variant is for solid nodes only.
export const courseMapColour = (colour, isDark = false) => {
  const match = String(colour ?? '').match(/^#([0-9a-f]{6})$/i);
  if (!match) return '#64748b';

  const source = [0, 2, 4].map((index) => parseInt(match[1].slice(index, index + 2), 16));
  const neutral = isDark ? [51, 65, 85] : [255, 255, 255];
  const sourceWeight = isDark ? 0.48 : 0.42;
  return `#${source.map((value, index) =>
    Math.round(neutral[index] + (value - neutral[index]) * sourceWeight)
      .toString(16)
      .padStart(2, '0')
  ).join('')}`;
};
