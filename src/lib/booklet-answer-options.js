// Teaching activities have their own answer switches; independent exercises use
// the canvas/PDF answer mode. Match semantic kinds, never editable heading text.
export function teachingAnswerCategory(block) {
  if(isKeyIdeas(block))return 'keyIdeas';
  const kind = block?.sourceAtom?.kind ?? block?.pedagogyRole ?? block?.variant;
  if (kind === 'review') return 'review';
  if (kind === 'guided-practice') return 'guided';
  if (['identify', 'activity', 'investigation', 'proof', 'verify'].includes(kind)) return 'identify';
  if (block?.type === 'worked-example' || ['example', 'worked-example'].includes(kind)) return 'theory';
  return null;
}
export function isKeyIdeas(block) {return [block?.sourceAtom?.kind,block?.pedagogyRole,block?.variant].includes('key-ideas');}
export function blockClozeAnswers(block,options,mode='student') {return isKeyIdeas(block)?options.showKeyIdeasAnswers===true:mode!=='student';}

export function teachingQuestionMode(block, options, independentMode = 'student') {
  const category = teachingAnswerCategory(block);
  if (category === 'theory') return 'worked';
  if (!category) return independentMode;
  const enabled = options[{ review: 'showReviewAnswers', identify: 'showIdentifyAnswers', guided: 'showGuidedPracticeAnswers', keyIdeas:'showKeyIdeasAnswers' }[category]];
  return enabled ? (independentMode === 'short' ? 'short' : 'worked') : 'student';
}

export function independentAnswerPages(pages) {
  return pages.map(page => ({
    ...page,
    blocks: page.blocks.filter(block => block.type === 'question' && !teachingAnswerCategory(block) && !block.sourceAtom && !['theory', 'definition', 'key-ideas'].includes(block.pedagogyRole))
      .map(block => ({ ...block, sourceOrder: block.sourceOrder ?? page.blocks.filter(b => b.type === 'question').findIndex(b => b.id === block.id) + 1 })),
  })).filter(page => page.blocks.length);
}
