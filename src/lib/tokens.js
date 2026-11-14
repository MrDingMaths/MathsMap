// Single JS source for colours the canvas, Cytoscape and ring SVGs need as literal
// values. These mirror the CSS tokens in src/app.css (--prog-*, --primary); the
// test in tests/tokens.test.js keeps the two in step.

// The one progress scale: not started, learning, proficient, mastered.
export const PROGRESS = {
  light: { none: '#94A3B8', learning: '#F59E0B', proficient: '#2563EB', mastered: '#10B981' },
  dark: { none: '#64748B', learning: '#FBBF24', proficient: '#60A5FA', mastered: '#34D399' }
};
export const progressColours = (isDark) => (isDark ? PROGRESS.dark : PROGRESS.light);

// Red used for the map's focus ring and "leads to" links (--primary).
export const ACCENT = '#E8443A';

// Neutral chrome for the map canvas (mirrors --bg, --raised, --text, --muted,
// --border, --border-strong in src/app.css).
export const CANVAS = {
  light: { bg: '#F7F8FA', card: '#FFFFFF', ink: '#172033', muted: '#556070', border: '#E4E7EC', borderStrong: '#CBD2DC' },
  dark: { bg: '#0F141C', card: '#171D27', ink: '#E8ECF2', muted: '#9AA4B4', border: '#273041', borderStrong: '#364156' }
};
export const canvasColours = (isDark) => (isDark ? CANVAS.dark : CANVAS.light);
