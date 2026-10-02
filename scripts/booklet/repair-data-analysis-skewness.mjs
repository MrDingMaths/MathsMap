const ANCHOR_ID = 'p82-skewness-comparison';
const INVESTIGATION_ID = 'p82-skewness-investigation';

function locateArrayEntries(root, id) {
  const matches = [];
  function visit(value, ancestors = []) {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        if (entry && typeof entry === 'object' && entry.id === id) {
          matches.push({ array: value, index, ancestors });
        }
        visit(entry, ancestors);
      });
    } else if (value && typeof value === 'object') {
      const nextAncestors = [...ancestors, value];
      Object.entries(value).filter(([key]) => !/^(source|provenance|evidence|history|revision|atoms|spec|bankRef|classification|studio)/i.test(key)).forEach(([, child]) => visit(child, nextAncestors));
    }
  }
  visit(root);
  return matches;
}

function isTargetTeachingSection(value) {
  return value.topicId === 'distribution-shape' &&
    [value.type, value.kind, value.sectionType, value.role, value.phase].some(kind =>
      ['teaching', 'teachingsection', 'teaching-section', 'teachingSection'].includes(kind));
}

// Reuse the book's native paragraph/text representation, without copying marks.
function paragraphBuilder(root) {
  let template;
  function visit(value) {
    if (template || !value || typeof value !== 'object') return;
    if (value.format === 'maths-editor-document-v1' && Array.isArray(value.blocks)) {
      template = value.blocks.find(block => block &&
        (block.type === 'paragraph' || block.kind === 'paragraph'));
      if (template) return;
    }
    Object.values(value).forEach(visit);
  }
  visit(root);
  return text => {
    const identity = template?.kind === 'paragraph'
      ? { kind: 'paragraph' }
      : { type: 'paragraph' };
    if (template) {
      for (const key of ['text', 'content']) {
        if (typeof template[key] === 'string') return { ...identity, [key]: text };
      }
      for (const key of ['content', 'children', 'runs', 'segments', 'inlines']) {
        if (!Array.isArray(template[key])) continue;
        const leaf = template[key].find(item => item && typeof item.text === 'string');
        if (leaf) {
          const node = { text };
          if (leaf.type !== undefined) node.type = leaf.type;
          if (leaf.kind !== undefined) node.kind = leaf.kind;
          return { ...identity, [key]: [node] };
        }
        if (template[key].some(item => typeof item === 'string')) {
          return { ...identity, [key]: [text] };
        }
      }
    }
    return { type: 'paragraph', content: [{ type: 'text', text }] };
  };
}

function dotplot(id, title, values, markers = []) {
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const coordinate = value => Number((0.6 + 4.4 *
    (value - minimum) / (maximum - minimum)).toFixed(3));
  const lines = [
    '% mathsmap-diagram-colours {"version":1,"kind":"graph","base":[],"semantic":[],"reference":"Feedback-authored skewness investigation; black dots represent observations."}',
    `% mathsmap-dotplot-values: ${JSON.stringify(values)}`,
    '\\begin{tikzpicture}[x=1cm,y=1cm,draw=black,text=black,every node/.style={font=\\fontsize{10}{12}\\selectfont}]',
    '\\special{dvisvgm:raw <metadata data-graph-strokes="1"/>}',
    '\\path[use as bounding box] (0,-2.05) rectangle (5.6,1.9);',
    `\\node at (2.8,1.55) {${title}};`,
    '\\draw[line width=0.5pt] (0.4,0) -- (5.2,0);'
  ];
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  for (const [value, count] of [...counts].sort((a, b) => a[0] - b[0])) {
    const x = coordinate(value);
    lines.push(`\\draw[line width=0.4pt] (${x},0) -- (${x},-0.1);`);
    lines.push(`\\node[font=\\fontsize{8.5}{10}\\selectfont] at (${x},-0.32) {\\special{dvisvgm:raw <g data-graph-text="tick">}${value}\\special{dvisvgm:raw </g>}};`);
    for (let row = 0; row < count; row += 1) {
      const y = Number((0.23 + row * 0.25).toFixed(3));
      lines.push(`\\draw[line width=0.8pt,fill=black] (${x},${y}) circle[radius=0.65mm];`);
    }
  }
  for (let index = 0; index < markers.length; index += 1) {
    const marker = markers[index];
    const x = coordinate(marker.value);
    const y = Number((-0.8 - index * 0.45).toFixed(3));
    const anchor = x > 2.8 ? 'east' : 'west';
    lines.push(`% mathsmap-statistic-marker: ${marker.kind}=${marker.value}`);
    lines.push(`\\draw[line width=0.4pt] (${x},${Number((y + 0.17).toFixed(3))}) -- (${x},${Number((y + 0.27).toFixed(3))});`);
    lines.push(`\\node[anchor=${anchor}] at (${x},${y}) {${marker.label} ${marker.value}};`);
  }
  lines.push('\\end{tikzpicture}');
  return {
    id,
    format: 'tikz',
    code: lines.join('\n'),
    widthMm: 56,
    role: 'question',
    reviewStatus: 'needs-review'
  };
}

function makeInvestigation(original, anchor, following, anchorIndex) {
  const paragraph = paragraphBuilder(original);
  let paragraphIndex = 0;
  const prompt = (...texts) => ({
    format: 'maths-editor-document-v1',
    version: 1,
    blocks: texts.map(text => ({...paragraph(text), id: `${INVESTIGATION_ID}-paragraph-${++paragraphIndex}`}))
  });
  const part = (label, text, answerSpaceMm, short, worked) => ({
    id: `${INVESTIGATION_ID}-${label}`,
    type: 'part',
    label,
    prompt: prompt(text),
    answerSpaceMm,
    answer: { short, worked }
  });
  const anchorOrder = Number.isFinite(anchor.sourceAtom?.order)
    ? anchor.sourceAtom.order : anchorIndex;
  const followingOrder = following?.sourceAtom?.order;
  const order = Number.isFinite(followingOrder) && followingOrder > anchorOrder
    ? anchorOrder + (followingOrder - anchorOrder) / 2 : anchorOrder + 0.5;
  return {
    id: INVESTIGATION_ID,
    type: 'question',
    sourceAtom: {
      id: `feedback-${INVESTIGATION_ID}`,
      kind: 'investigation',
      label: 'Investigation',
      visibleSubtitle: 'How does an extreme value affect the mean?',
      order,
      origin: 'feedback-authored',
      sourceOriginal: false
    },
    pedagogyRole: 'investigation',
    content: {
      id: `${INVESTIGATION_ID}-content`,
      type: 'group',
      label: '',
      prompt: prompt(
        'The starting data are 7, 8, 9, 9, 9, 10, 11. The distribution is symmetrical, and its mean, median and mode are all 9.',
        'Use the starting data separately for parts a and b. The two contrasting plots also show their mean, median and mode; compare their positions without calculating them.'
      ),
      layout: 'list',
      diagramPlacement: 'after-prompt',
      questionDiagrams: [
        dotplot(`${INVESTIGATION_ID}-starting`, 'Starting data', [7, 8, 9, 9, 9, 10, 11]),
        dotplot(`${INVESTIGATION_ID}-right-tail`, 'Longer right tail', [9, 9, 9, 10, 11, 12, 17], [
          { kind: 'mode', label: 'Mode', value: 9 },
          { kind: 'median', label: 'Median', value: 10 },
          { kind: 'mean', label: 'Mean', value: 11 }
        ]),
        dotplot(`${INVESTIGATION_ID}-left-tail`, 'Longer left tail', [1, 6, 7, 8, 9, 9, 9], [
          { kind: 'mode', label: 'Mode', value: 9 },
          { kind: 'median', label: 'Median', value: 8 },
          { kind: 'mean', label: 'Mean', value: 7 }
        ])
      ],
      children: [
        part('a', 'Predict which of the mean, median and mode will change, and in which direction, if 11 is replaced by 18.', 12,
          'Mean increases to 10; median and mode stay at 9.',
          'Replacing 11 with 18 increases the total by 7. There are still 7 values, so the mean increases by 1 to 10. The middle value and most frequent value remain 9.'),
        part('b', 'Return to the starting data. Predict which of the mean, median and mode will change, and in which direction, if 7 is replaced by 0.', 12,
          'Mean decreases to 8; median and mode stay at 9.',
          'Replacing 7 with 0 decreases the total by 7. There are still 7 values, so the mean decreases by 1 to 8. The middle value and most frequent value remain 9.'),
        part('c', 'For each contrasting plot, list the mode, median and mean from left to right. Compare their order with the direction of the longer tail. These examples illustrate a typical pattern; the ordering is not a rule for every dataset.', 16,
          'Right tail: mode 9, median 10, mean 11. Left tail: mean 7, median 8, mode 9.',
          'In the right-tail example, mode < median < mean. In the left-tail example, mean < median < mode. The mean lies towards the longer tail in these examples. This ordering is typical, but is not universal.'),
        part('d', 'Explain why an extreme value can move the mean while the median and mode stay the same.', 12,
          'An extreme value strongly pulls the mean towards the tail. The middle rank and most frequent value may stay the same.',
          'The mean uses every value, so moving an extreme value changes the total and pulls the mean towards that tail. The median depends on the middle rank, which may stay unchanged. The mode depends on frequency, so it may also stay unchanged.')
      ]
    },
    sourcePageNumber: 82,
    snapshotKind: 'local',
    bankRef: null,
    flow: { sourcePageBreakBefore: false }
  };
}

/** Pure candidate repair. Publication and rendered acceptance belong to the caller. */
export function repairDataAnalysisSkewness(original) {
  if (!original || typeof original !== 'object' || Array.isArray(original)) {
    throw new TypeError('Expected a booklet project object.');
  }
  const next = structuredClone(original);
  const anchors = locateArrayEntries(next, ANCHOR_ID);
  if (anchors.length !== 1) {
    throw new Error(`Expected one ${ANCHOR_ID}; found ${anchors.length}.`);
  }
  const target = anchors[0];
  if (!target.ancestors.some(isTargetTeachingSection)) {
    throw new Error(`${ANCHOR_ID} must belong to the distribution-shape teaching section.`);
  }
  const existing = locateArrayEntries(next, INVESTIGATION_ID);
  if (existing.length > 1 || (existing.length === 1 &&
      (existing[0].array !== target.array || existing[0].index !== target.index + 1))) {
    throw new Error(`${INVESTIGATION_ID} has a duplicate or conflicting location; preserve it for review.`);
  }
  const changed = existing.length === 0;
  if (changed) {
    const block = makeInvestigation(next, target.array[target.index],
      target.array[target.index + 1], target.index);
    target.array.splice(target.index + 1, 0, block);
  }
  return {
    next,
    provenance: {
      repairId: 'data-analysis-skewness-investigation-v1',
      changed,
      origin: 'feedback-authored',
      sourceOriginal: false,
      insertedBlockIds: changed ? [INVESTIGATION_ID] : [],
      retainedExistingInvestigation: !changed,
      target: { topicId: 'distribution-shape', afterBlockId: ANCHOR_ID, blockId: INVESTIGATION_ID },
      sourceReferences: [
        { pageNumber: 82, purpose: 'Existing modality and skewness teaching; unchanged.' },
        { pageNumber: 76, purpose: 'Previously taught effect of adding or removing a value on the mean.' },
        { pageNumber: 77, purpose: 'Previously taught effects on mean, median and range.' }
      ],
      diagramFillPurpose: 'Black dot markers represent individual data values; no shaded regions.',
      acceptance: {
        renderedVisualInspection: 'pending',
        finalSizeTypography: 'pending',
        teachingAnswerControls: 'pending',
        practiceOnlyAnswerExclusion: 'pending',
        revisionSafePublication: 'caller-required'
      }
    }
  };
}
