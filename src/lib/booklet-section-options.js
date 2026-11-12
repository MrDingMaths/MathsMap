// A section can omit dedicated handwriting allowances without changing native
// table cells, clozes or other mathematical response structures.
export const sectionShowsWorkingSpace = (section, options = {}) => section?.workingSpace !== 'none' && options.showResponseSpaces !== false;

// Exam questions print with a fixed gap between consecutive questions on a page
// (James, 7 November 2026), and so do Challenge questions (James, 9 November 2026).
// Pagination measures the rendered page, so the gap is counted there too. The first
// question in the section has none.
export const EXAM_QUESTION_GAP_MM = 10;
// The bank-drawn Mixed practice section has no working space and a 5 mm gap
// (James, 13 November 2026; docs/booklet-bank-draw.md). It is keyed on the
// pipeline's own marker, so source-authored review sections keep their layout.
export const MIXED_REVIEW_QUESTION_GAP_MM = 5;
const sectionGapMm = section => {
  if (section?.role === 'exam' || (section?.role === 'challenge' && section?.phase === 'practice')) return EXAM_QUESTION_GAP_MM;
  if (section?.bankDraw?.command === 'mixed') return MIXED_REVIEW_QUESTION_GAP_MM;
  return 0;
};
export const examQuestionGapMm = (section, blocks, block) => {
  const gap = sectionGapMm(section);
  if (!gap || block?.type !== 'question') return 0;
  return blocks.filter(item => item.type === 'question').findIndex(item => item.id === block.id) > 0 ? gap : 0;
};
