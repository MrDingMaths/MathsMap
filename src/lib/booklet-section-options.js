// A section can omit dedicated handwriting allowances without changing native
// table cells, clozes or other mathematical response structures.
export const sectionShowsWorkingSpace = (section, options = {}) => section?.workingSpace !== 'none' && options.showResponseSpaces !== false;

// Exam questions print with a fixed gap between consecutive questions on a page
// (James, 7 November 2026), and so do Challenge questions (James, 9 November 2026).
// Pagination measures the rendered page, so the gap is counted there too. The first
// question in the section has none.
export const EXAM_QUESTION_GAP_MM = 10;
const spacedSection = section => section?.role === 'exam' || (section?.role === 'challenge' && section?.phase === 'practice');
export const examQuestionGapMm = (section, blocks, block) => {
  if (!spacedSection(section) || block?.type !== 'question') return 0;
  return blocks.filter(item => item.type === 'question').findIndex(item => item.id === block.id) > 0 ? EXAM_QUESTION_GAP_MM : 0;
};
