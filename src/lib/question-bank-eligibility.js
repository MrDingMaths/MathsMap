// A teaching review remains in its booklet/module, not in the practice picker.
export function isTheoryReview(block = {}, section = {}) {
  return block.libraryRole === 'theory-review'
    || block.sourceAtom?.kind === 'review'
    || block.sourceAtom?.label?.trim().toLowerCase() === 'review'
    || block.pedagogyRole === 'review'
    || section.role === 'review';
}

export function isSelectableBankQuestion(question = {}) {
  return question.status === 'approved' && !isTheoryReview(question);
}
