const TOPICS = new Set(['summary-statistics-list', 'relative-merits-centre']);
const DIFFICULTIES = new Map(['Foundation', 'Development', 'Mastery', 'Challenge'].map((name, index) => [name, index]));
const TARGET = 'p24-q1-block';
const PARAGRAPH_KEYS = new Set(['id', 'type', 'align', 'spaceBefore', 'spaceAfter', 'inlines', 'fontSize', 'lineHeight', 'indent']);
const INLINE_KEYS = new Set(['type', 'latex', 'display']);
const WRITING_BOX = /\{\\color\{#[0-9a-f]{6}\}\\boxed\{\\rule\{0pt\}\{[0-9]+(?:\.[0-9]+)?mm\}\\hspace\{[0-9]+(?:\.[0-9]+)?mm\}\}\}/gi;

function nativeMath(paragraph) {
  if (paragraph?.type !== 'paragraph' || typeof paragraph.id !== 'string') return null;
  if (Object.keys(paragraph).some(key => !PARAGRAPH_KEYS.has(key))) return null;
  if (!Array.isArray(paragraph.inlines) || paragraph.inlines.length !== 1) return null;
  const inline = paragraph.inlines[0];
  if (inline?.type !== 'math' || typeof inline.latex !== 'string') return null;
  if (Object.keys(inline).some(key => !INLINE_KEYS.has(key))) return null;
  return inline.latex;
}

function shape(latex) {
  return latex.replace(WRITING_BOX, 'B').replace(/\s+/g, '');
}

function formulaMatches(statistic, value) {
  if (statistic === 'Mode') return value === 'B';
  if (statistic === 'Median') return value === 'B' || value === String.raw`\frac{B+B}{2}`;
  if (statistic === 'Range') return value === 'B-B';
  if (statistic === 'Mean') {
    const fraction = String.raw`\frac{B}{B}`;
    return value === fraction || value === `${fraction}=B` || value === `${fraction}${String.raw`\approx`}B`;
  }
  return false;
}

function acceptsSeparateResult(statistic, value) {
  return statistic === 'Range'
    || (statistic === 'Median' && value === String.raw`\frac{B+B}{2}`)
    || (statistic === 'Mean' && value === String.raw`\frac{B}{B}`);
}

function compatible(first, other) {
  return ['align', 'fontSize', 'lineHeight'].every(key => first[key] === other[key])
    && Boolean(first.inlines[0].display) === Boolean(other.inlines[0].display);
}

function compactPrompt(prompt, questionId, provenance, removedIds) {
  if (prompt?.format !== 'maths-editor-document-v1' || !Array.isArray(prompt.blocks)) return;

  function compactList(blocks, slotId) {
    blocks.forEach(visitBlock);
    const result = [];
    for (let index = 0; index < blocks.length; index += 1) {
      const first = blocks[index];
      const labelLatex = nativeMath(first);
      const label = labelLatex === null ? null : shape(labelLatex).match(/^\\text\{(Mode|Median|Range|Mean)\}=$/);
      const formula = blocks[index + 1];
      const formulaLatex = nativeMath(formula);
      if (!label || formulaLatex === null || !compatible(first, formula)) {
        result.push(first);
        continue;
      }
      const formulaShape = shape(formulaLatex);
      if (!formulaMatches(label[1], formulaShape)) {
        result.push(first);
        continue;
      }
      const merged = [formula];
      let combinedLatex = labelLatex + formulaLatex;
      const finalParagraph = blocks[index + 2];
      const finalLatex = nativeMath(finalParagraph);
      if (acceptsSeparateResult(label[1], formulaShape)
        && finalLatex !== null
        && compatible(first, finalParagraph)
        && ['=B', String.raw`\approxB`].includes(shape(finalLatex))) {
        merged.push(finalParagraph);
        combinedLatex += finalLatex;
      }
      first.inlines = [{ ...first.inlines[0], latex: combinedLatex }];
      const ids = merged.map(paragraph => paragraph.id);
      ids.forEach(id => removedIds.add(id));
      provenance.mergedParagraphs.push({ questionId, slotId, keptId: first.id, removedIds: ids });
      result.push(first);
      index += merged.length;
    }
    return result;
  }

  function visitBlock(block) {
    if (block?.type === 'layout' && Array.isArray(block.slots)) {
      for (const slot of block.slots) {
        if (Array.isArray(slot.blocks)) slot.blocks = compactList(slot.blocks, slot.id);
      }
    } else if (block?.type === 'table' && Array.isArray(block.rows)) {
      for (const row of block.rows) {
        if (!Array.isArray(row)) continue;
        for (const cell of row) {
          if (cell?.type === 'cell' && Array.isArray(cell.blocks)) {
            cell.blocks = compactList(cell.blocks, cell.id);
          }
        }
      }
    }
    // Annotated equations, their anchors, and annotation blocks are opaque.
  }

  prompt.blocks.forEach(visitBlock);
}

function compactQuestion(question, provenance, removedIds) {
  if (!question || typeof question !== 'object') return;
  compactPrompt(question.prompt, question.id, provenance, removedIds);
  if (Array.isArray(question.children)) {
    question.children.forEach(child => compactQuestion(child, provenance, removedIds));
  }
}

function isQuestion(block) {
  return block?.type === 'question'
    || block?.content?.type === 'question'
    || (block?.type == null && block?.classification != null);
}

function ordering(block) {
  const classification = block.classification ?? {};
  const local = block.flow?.localDifficulty ?? {};
  const difficulty = classification.difficulty ?? local.difficulty;
  const score = classification.reasoningScore ?? local.reasoningScore;
  return {
    rank: DIFFICULTIES.get(difficulty) ?? DIFFICULTIES.size,
    score: typeof score === 'number' && Number.isFinite(score) ? score : Infinity,
  };
}

function sortExercise(exercise, provenance) {
  if (!TOPICS.has(exercise.topicId) || !Array.isArray(exercise.blocks)) return;
  const positions = [];
  const questions = [];
  exercise.blocks.forEach((block, index) => {
    if (isQuestion(block)) {
      positions.push(index);
      questions.push({ block, index, ...ordering(block) });
    }
  });
  const before = questions.map(entry => entry.block.id);
  questions.sort((a, b) => {
    const aPinned = a.block.id === TARGET;
    const bPinned = b.block.id === TARGET;
    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    if (a.rank !== b.rank) return a.rank - b.rank;
    if (a.score !== b.score) return a.score < b.score ? -1 : 1;
    return a.index - b.index;
  });
  const after = questions.map(entry => entry.block.id);
  if (before.every((id, index) => id === after[index])) return;
  positions.forEach((position, index) => { exercise.blocks[position] = questions[index].block; });
  provenance.sortedExercises.push({ exerciseId: exercise.id ?? null, before, after });
}

function opaqueLayoutKey(key) {
  return /^(source|studio|feedback|comments)/i.test(key)
    || ['spec', 'provenance', 'annotations', 'anchors'].includes(key);
}

function removedReference(ref, removedIds) {
  if (typeof ref !== 'string') return false;
  if (removedIds.has(ref)) return true;
  const marker = '/prompt#';
  const offset = ref.lastIndexOf(marker);
  return offset !== -1 && removedIds.has(ref.slice(offset + marker.length));
}

function pruneLayouts(value, removedIds) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map(item => pruneLayouts(item, removedIds)).filter(item => item !== undefined);
  }
  if (value.type === 'item' && removedReference(value.ref, removedIds)) return undefined;
  const result = {};
  for (const [key, child] of Object.entries(value)) {
    if (opaqueLayoutKey(key)) {
      result[key] = child;
      continue;
    }
    if (removedReference(key, removedIds)) continue;
    const retained = pruneLayouts(child, removedIds);
    if (retained !== undefined) result[key] = retained;
  }
  return result;
}

/** Repair only the supplied current-project exercises and native scaffold shapes. */
export function repairDataAnalysisR353(original) {
  const next = structuredClone(original);
  const provenance = { repair: 'data-analysis-r353', sortedExercises: [], mergedParagraphs: [] };
  const removedIds = new Set();
  const targets = [];
  for (const exercise of next.exercises ?? next.sections ?? []) {
    for (const block of exercise.blocks ?? []) {
      if (block.id === TARGET) {
        targets.push(block);
        compactQuestion(block.content, provenance, removedIds);
      }
    }
    if (!original.sections || exercise.role === 'mixed-practice') sortExercise(exercise, provenance);
  }
  if (removedIds.size) {
    for (const block of targets) {
      if (block.presentation) block.presentation = pruneLayouts(block.presentation, removedIds);
    }
    if (next.settings?.layoutOverrides?.blockLayouts) next.settings.layoutOverrides.blockLayouts = pruneLayouts(next.settings.layoutOverrides.blockLayouts, removedIds);
    if (next.settings?.blockLayouts) next.settings.blockLayouts = pruneLayouts(next.settings.blockLayouts, removedIds);
  }
  return { next, provenance };
}
