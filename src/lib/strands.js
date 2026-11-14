// Fixed strand order — the Map's column order. Re-exported by data.js; kept
// here, free of JSON imports, so layout code can load in plain Node tests.
export const STRANDS = [
  'Number & Algebra',
  'Measurement & Space',
  'Statistics & Probability',
  'Functions & Calculus'
];

// Strand keys for CSS colour tokens (--strand-na, --strand-ms, --strand-sp,
// --strand-fc in app.css). The map canvas keeps its own BAND_STYLE in swimlane.js.
const KEYS = {
  'Number & Algebra': 'na',
  'Measurement & Space': 'ms',
  'Statistics & Probability': 'sp',
  'Functions & Calculus': 'fc'
};

export const strandKey = (name) => KEYS[name] ?? 'na';
export const strandColour = (name) => `var(--strand-${strandKey(name)})`;
