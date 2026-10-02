const blank = width => String.raw`{\color{#cccccc}\boxed{\rule{0pt}{5.738993mm}\hspace{${width}mm}}}`;
const label = name => String.raw`\text{${name}}=`;
const alignedRows = rows => String.raw`\begin{aligned}` + rows.map(row => '&' + row).join(String.raw`\\`) + String.raw`\end{aligned}`;
const small = blank('10.110876');
const medium = blank('12.310876');
const wide = blank('24.410876');
const medianFraction = String.raw`\frac{${small}+${small}}{2}`;
const meanFraction = String.raw`\frac{${medium}}{${medium}}`;

const repairs = [
  {
    id: 'p24-q1-a-range-label',
    before: label('Range') + small + '-' + small,
    after: alignedRows([label('Range'), small + '-' + small]),
    reason: 'Separate the range label from the subtraction without changing either writing box.'
  },
  {
    id: 'p24-q1-b-median-label',
    before: label('Median') + medianFraction + '=' + small,
    after: alignedRows([label('Median'), medianFraction, '=' + small]),
    reason: 'Separate the label, even-median fraction and final result into native rows that fit the existing left scaffold cell.'
  },
  {
    id: 'p24-q1-b-range-label',
    before: label('Range') + small + '-' + small + '=' + small,
    after: alignedRows([label('Range'), small + '-' + small, '=' + small]),
    reason: 'Separate the label, subtraction and result to prevent right-edge overflow.'
  },
  {
    id: 'p24-q1-b-mean-label',
    before: label('Mean') + meanFraction + '=' + small,
    after: alignedRows([label('Mean'), meanFraction, '=' + small]),
    reason: 'Separate the label, fraction and result rather than joining them into another overlong row.'
  },
  {
    id: 'p24-q1-c-mode-label',
    before: label('Mode') + wide,
    after: alignedRows([label('Mode'), wide]),
    reason: 'Keep the full multimode writing box inside its existing cell instead of overlapping the median.'
  },
  {
    id: 'p24-q1-c-range-label',
    before: label('Range') + medium + '-' + medium + '=' + medium,
    after: alignedRows([label('Range'), medium + '-' + medium, '=' + medium]),
    reason: 'Keep the three larger writing boxes while preventing the range calculation from overlapping the mean.'
  }
];

const rangeSlotId = 'p24-q1-a-range-slot';
const bottomLayoutId = 'p24-q1-a-bottom-layout';
const targetIds = new Set([...repairs.map(repair => repair.id), rangeSlotId, bottomLayoutId]);

function indexTargets(value) {
  const found = new Map();
  function visit(node, path) {
    if (node === null || typeof node !== 'object') return;
    if (!Array.isArray(node) && targetIds.has(node.id)) {
      if (found.has(node.id)) throw new Error(`Duplicate scaffold repair target: ${node.id}`);
      found.set(node.id, { node, path });
    }
    if (Array.isArray(node)) {
      node.forEach((child, index) => visit(child, [...path, index]));
    } else {
      for (const [key, child] of Object.entries(node)) if (!/^(source|spec|studio|bankRef|history|provenance|evidence)/.test(key)) visit(child, [...path, key]);
    }
  }
  visit(value, []);
  for (const id of targetIds) {
    if (!found.has(id)) throw new Error(`Missing scaffold repair target: ${id}`);
  }
  return found;
}

/**
 * Return an isolated candidate and a complete record of the scoped changes.
 * Accepts the supplied active-content array or its containing project object.
 * Preconditions protect subsequent manual edits; this helper performs no I/O.
 * A successful return does not establish rendered acceptance.
 */
export function repairRenderedScaffold(original) {
  const next = structuredClone(original);
  const targets = indexTargets(next);
  const changes = [];

  // Validate every target before modifying the candidate.
  for (const repair of repairs) {
    const { node } = targets.get(repair.id);
    if (node.type !== 'paragraph' || node.fontSize !== 10 ||
        !Array.isArray(node.inlines) || node.inlines.length !== 1 ||
        node.inlines[0].type !== 'math' || node.inlines[0].display !== false ||
        ![repair.before, repair.after].includes(node.inlines[0].latex)) {
      throw new Error(`Scaffold paragraph differs from the supplied or repaired baseline: ${repair.id}`);
    }
  }
  const rangeSlot = targets.get(rangeSlotId);
  const bottomLayout = targets.get(bottomLayoutId);
  if (![28, 32].includes(rangeSlot.node.widthMm)) {
    throw new Error(`Scaffold range width differs from the supplied or repaired baseline: ${rangeSlotId}`);
  }
  if (bottomLayout.node.type !== 'layout' || bottomLayout.node.arrangement !== 'parallel' ||
      bottomLayout.node.columns !== 2 || bottomLayout.node.gap !== 2 ||
      !Array.isArray(bottomLayout.node.slots) || bottomLayout.node.slots.length !== 2 ||
      bottomLayout.node.slots[0].id !== rangeSlotId ||
      bottomLayout.node.slots[1].id !== 'p24-q1-a-mean-slot' ||
      bottomLayout.node.slots[1].widthMm !== 48 ||
      !Array.isArray(bottomLayout.node.tracks) || bottomLayout.node.tracks.length !== 2 ||
      ![30, 32].includes(bottomLayout.node.tracks[0]) || bottomLayout.node.tracks[1] !== 46) {
    throw new Error(`Scaffold layout differs from the supplied or repaired baseline: ${bottomLayoutId}`);
  }

  for (const repair of repairs) {
    const { node, path } = targets.get(repair.id);
    if (node.inlines[0].latex === repair.after) continue;
    const before = structuredClone(node);
    node.inlines[0].latex = repair.after;
    changes.push({
      kind: 'paragraph', id: repair.id, path,
      before, after: structuredClone(node), reason: repair.reason
    });
  }

  // Two unchanged small boxes plus their subtraction need more than the
  // original 28 mm slot. Grow that slot rather than shrinking the boxes.
  // The explicit slot widths total 32 + 2 + 48 = 82 mm, within the 83 mm part.
  // The mean slot, 46 mm annotated equation and its offsets stay untouched.
  if (rangeSlot.node.widthMm !== 32) {
    changes.push({
      kind: 'layout-property', id: rangeSlotId,
      path: [...rangeSlot.path, 'widthMm'], before: rangeSlot.node.widthMm, after: 32,
      reason: 'Provide space for the intact subtraction row within the existing part width.'
    });
    rangeSlot.node.widthMm = 32;
  }
  if (bottomLayout.node.tracks[0] !== 32) {
    changes.push({
      kind: 'layout-property', id: bottomLayoutId,
      path: [...bottomLayout.path, 'tracks', 0], before: bottomLayout.node.tracks[0], after: 32,
      reason: 'Make the range track agree with its repaired slot width.'
    });
    bottomLayout.node.tracks[0] = 32;
  }

  return {
    next,
    provenance: {
      repair: 'data-analysis-rendered-scaffold',
      changes,
      requiresFreshRender: true,
      acceptance: 'pending rendered inspection'
    }
  };
}
