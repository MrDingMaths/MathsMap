// Versioned local prompt pipeline.
// The wording is adapted from MathsDatabase's transcription, difficulty-rating,
// topic-classification, and TikZ prompt conventions, but the output contract and
// taxonomy are MathsMap-specific.

export const PROMPT_VERSIONS = Object.freeze({
  transcription: 'mathsdatabase-transcription-adaptation-v3',
  tikz: 'mathsdatabase-tikz-adaptation-v3',
  reasoning: 'mathsdatabase-continuous-reasoning-adaptation-v1',
  mostAdvancedSkill: 'mathsmap-most-advanced-skill-v1',
});

export const TRANSCRIPTION_PROMPT = [
  'Transcribe the supplied mathematics source exactly for MathsMap Booklet Studio.',
  'Preserve the original wording, punctuation, mathematical notation, instruction hierarchy, child order, and visible list or grid layout.',
  'Use question, group, and part nodes. Put a prompt on every meaningful instruction or stem; a shared context node may have a blank prompt when the source wording is carried by its children.',
  'Do not paraphrase, improve, solve, or add instructional wording. Do not invent a part label, question, scenario, or explanation that is not visible in the source.',
  'If an image is mostly text, options, labels, or instructions, transcribe that content as ordinary text and LaTeX. Use an image only when the visual mathematical content itself matters.',
  'Use $...$ or \\\\(...\\\\) for inline maths and \\\\[...\\\\] for display maths. Use \\\\frac{numerator}{denominator}; never use slash-style algebraic fractions inside a maths span.',
  'Keep answers only on leaf nodes. Recalculate and cross-check leaf answers; do not put a fabricated solution on a parent node.',
  'A diagram is a true visual only: give it role, widthMm, and reviewStatus. Derivative or graph solutions must be actual source-derived sketches, never placeholders. If a source diagram contains both question and supplied solution art, preserve the question art and solution overlay separately.',
  'Do not include marks, source, sourceRef, sourceCrop, provenance, or page metadata in any question object. Source evidence belongs to the import job evidence map.',
  'Return only JSON matching scripts/booklet/practice-question-schema.json.',
].join('\n');

export const TIKZ_PROMPT = [
  'For a genuinely visual mathematical diagram, preserve the original visual meaning.',
  'Use the MathsDatabase TikZ conventions when a faithful vector reconstruction is possible: explicit axes, labels, scale, arrowheads, and mathematically correct curves.',
  'Do not redraw text-only images as TikZ. Do not use TikZ to hide uncertainty. If exact reconstruction is not reliable, keep the reviewed source asset and add a review flag.',
  'A supplied solution sketch must be geometrically correct and aligned to the source diagram; it is not a placeholder.',
].join('\n');

export const REASONING_SCORE_PROMPT = [
  'Rate the reasoning demand of the complete question on a continuous 0–100 scale.',
  '0 is the easiest foundation question and 100 is the hardest challenge question.',
  'Estimate completion success for a prepared student: reasoningScore = 100 - estimatedCompletionPercent.',
  'Consider the number of dependent decisions, abstraction, unfamiliar representation, algebraic manipulation, graph interpretation, and error propagation. Do not score by marks alone.',
  'Return reasoningScore as an integer and explain the calibration briefly in difficultyReason. Derive Foundation 0–24, Development 25–49, Mastery 50–79, Challenge 80–100 from the score.',
].join('\n');

export const MOST_ADVANCED_SKILL_PROMPT = [
  'Classify the required MathsMap skills using the taxonomy path course -> topic -> dot point -> skill.',
  'Choose the most advanced required skill as primarySkillId. Use secondarySkillIds for supporting skills that are genuinely needed.',
  'Most advanced means the skill requiring the deepest prerequisite/abstract reasoning at the relevant course stage, not simply the first skill named in the prompt.',
  'Keep classification separate from exact transcription and from reasoningScore.',
].join('\n');

export function reasoningScoreFromCompletionPercent(value) {
  const percent = Math.max(0, Math.min(100, Number(value) || 0));
  return Math.round(100 - percent);
}

function skillDepth(id, skillMap, memo = new Map(), visiting = new Set()) {
  if (memo.has(id)) return memo.get(id);
  if (visiting.has(id)) return 0;
  const skill = skillMap.get(id);
  if (!skill) return 0;
  visiting.add(id);
  const depth = Math.max(0, ...(skill.prereqs ?? []).map((prereq) => skillDepth(prereq, skillMap, memo, visiting) + 1));
  visiting.delete(id);
  memo.set(id, depth);
  return depth;
}

export function mostAdvancedSkillId(requiredSkillIds = [], skills = []) {
  const ids = [...new Set((requiredSkillIds ?? []).filter(Boolean))];
  if (!ids.length) return '';
  const skillMap = new Map(skills.map((skill) => [skill.id, skill]));
  const memo = new Map();
  return ids.sort((a, b) => {
    const left = skillMap.get(a) ?? { stage: 0, difficulty: 0, title: a };
    const right = skillMap.get(b) ?? { stage: 0, difficulty: 0, title: b };
    return (Number(right.stage) - Number(left.stage))
      || (skillDepth(b, skillMap, memo) - skillDepth(a, skillMap, memo))
      || (Number(right.difficulty) - Number(left.difficulty))
      || String(a).localeCompare(String(b));
  })[0];
}

export function buildPracticePrompt({ importId, sourceFiles = [], pages = [] } = {}) {
  const lines = [
    'MathsMap Booklet Studio import prompt versions:',
    'transcription=' + PROMPT_VERSIONS.transcription,
    'tikz=' + PROMPT_VERSIONS.tikz,
    'reasoning=' + PROMPT_VERSIONS.reasoning,
    'mostAdvancedSkill=' + PROMPT_VERSIONS.mostAdvancedSkill,
    '',
    TRANSCRIPTION_PROMPT,
    '',
    TIKZ_PROMPT,
    '',
    REASONING_SCORE_PROMPT,
    '',
    MOST_ADVANCED_SKILL_PROMPT,
    '',
    'Import id: ' + (importId ?? 'local-import'),
    'Source files are evidence for this import job only: ' + (sourceFiles.map((file) => file.originalName ?? file.name).join(', ') || 'none'),
  ];
  for (const page of pages) {
    lines.push('', '--- PAGE ' + page.pageNumber + ' ---', 'Rendered source: ' + (page.imageUrl ?? '(retained by the import job)'), 'Extracted text:', page.text || '(image-only page)');
  }
  return lines.join('\n');
}
