const QUESTION_ID = 'p82-skewness-investigation';
const CONTENT_ID = 'p82-skewness-investigation-content';
const PART_IDS = [
  'p82-skewness-investigation-a',
  'p82-skewness-investigation-b',
];

/**
 * Pure, narrowly scoped repair of the supplied active project tree.
 * Parts a and b each need one handwritten sentence at full list width.
 * Reduce those two writing areas from 12 mm to one 8 mm line.
 * Preserve all other content, diagrams, answers, IDs and layout settings.
 * Returned candidates require fresh rendering before acceptance.
 */
export function repairRenderedInvestigation(original) {
  const matches = [];
  function visit(value, path = []) {
    if (!value || typeof value !== 'object') return;
    if (value.id === QUESTION_ID && value.type === 'question') {
      matches.push({ block: value, path });
    }
    for (const [key, child] of Object.entries(value)) {
      visit(child, [...path, key]);
    }
  }
  visit(original);
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one ${QUESTION_ID} question; found ${matches.length}.`);
  }

  const { block, path } = matches[0];
  const content = block.content;
  if (content?.id !== CONTENT_ID || content.type !== 'group' ||
      content.layout !== 'list' || !Array.isArray(content.children)) {
    throw new Error('Investigation content no longer matches the supplied full-width list layout.');
  }

  // Validate both targets before constructing any changes. Unexpected manual
  // writing-space edits require reconciliation instead of being overwritten.
  const targets = PART_IDS.map((id) => {
    const indices = content.children.flatMap((part, index) => part?.id === id ? [index] : []);
    if (indices.length !== 1) {
      throw new Error(`Expected exactly one investigation part ${id}.`);
    }
    const index = indices[0];
    const part = content.children[index];
    if (part.type !== 'part' || ![12, 8].includes(part.answerSpaceMm)) {
      throw new Error(`Unexpected writing-space setting for ${id}; preserve and reconcile the manual edit.`);
    }
    return { id, index, before: part.answerSpaceMm };
  });

  const next = structuredClone(original);
  const nextBlock = path.reduce((value, key) => value[key], next);
  const changes = [];
  for (const target of targets) {
    if (target.before === 8) continue;
    nextBlock.content.children[target.index].answerSpaceMm = 8;
    changes.push({
      partId: target.id,
      path: [...path, 'content', 'children', String(target.index), 'answerSpaceMm'],
      before: target.before,
      after: 8,
    });
  }

  return {
    next,
    provenance: {
      repairId: 'data-analysis-rendered-investigation-writing-space-v1',
      questionId: QUESTION_ID,
      evidence: {
        attachedRenderedPage: 100,
        reportedFooterOverflowMm: 5.6,
      },
      reason: 'Parts a and b each fit one handwritten sentence across the supplied 173 mm list width; retain one 8 mm writing line each.',
      changes,
      savedWritingSpaceMm: changes.reduce((total, change) => total + change.before - change.after, 0),
      verificationStatus: 'requires-fresh-render',
    },
  };
}
