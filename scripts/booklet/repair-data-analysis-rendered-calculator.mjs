const clone = value => structuredClone(value);
const CALCULATOR = 'p52-calculator-information';
const SECOND = `${CALCULATOR}-model-2`;
const EXAMPLE = 'p53-example';

function visit(node, fn) {
  if (!node || typeof node !== 'object') return;
  fn(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(child => visit(child, fn));
    else if (value && typeof value === 'object') visit(value, fn);
  }
}

function fontOf(node) {
  let size;
  visit(node, child => {
    if (size === undefined && child.type === 'paragraph' && Number.isFinite(child.fontSize)) size = child.fontSize;
  });
  return Math.max(10, size ?? 10);
}

function numberParagraph(item, number) {
  return {
    id: `${item.id}-rendered-number`, type: 'paragraph', align: 'left',
    fontSize: fontOf(item), spaceBefore: 0, spaceAfter: 0,
    lineHeight: 1.4, indent: 0,
    inlines: [{ type: 'text', text: `${number}.`, marks: [] }]
  };
}

function numberCell(item, number) {
  return {
    id: `${item.id}-rendered-number-cell`, type: 'cell',
    align: 'left', verticalAlign: 'middle', border: false,
    blocks: [numberParagraph(item, number)]
  };
}

// Native numbers share the button row's vertical alignment. All existing
// paragraphs, tables, cells, annotations and their IDs remain editable.
function nativeProcedure(list) {
  if (list.type !== 'list' || list.ordered !== true) throw Error(`Expected ordered procedure ${list.id}`);
  const gutter = Number.isFinite(list.indent) && list.indent >= 5 ? list.indent : 7;
  const inset = Math.min(3, gutter - 4);
  const { items, ordered, start, indent, ...listProperties } = list;
  return {
    ...listProperties, type: 'layout', arrangement: 'parallel', columns: 1,
    margin: 0, padding: 0, gap: 1.2, border: false,
    slots: items.map((item, index) => {
      const number = (start ?? 1) + index;
      const { blocks, ...itemProperties } = item;
      const first = blocks[0];
      let itemLayout;
      if (first?.type === 'table') {
        if (first.rows?.length !== 1 || !Number.isFinite(first.widthMm) ||
            !Array.isArray(first.widths) || first.widths.length !== first.rows[0].length ||
            first.widths.some(width => !Number.isFinite(width) || width <= 0)) {
          throw Error(`Cannot safely align numbered table ${first.id}`);
        }
        const sum = first.widths.reduce((total, width) => total + width, 0);
        // Resolve proportions to millimetres before adding the number gutter.
        first.widths = [inset, gutter - inset, ...first.widths.map(width => width / sum * first.widthMm)];
        first.widthMm += gutter;
        first.rows[0].unshift(
          { id: `${item.id}-rendered-inset-cell`, type: 'cell', border: false, blocks: [] },
          numberCell(item, number)
        );
        first.marginBefore = 0;
        first.marginAfter = 0.8;
        itemLayout = {
          ...itemProperties, type: 'layout', arrangement: 'parallel', columns: 1,
          margin: 0, padding: 0, gap: 0, border: false,
          slots: [{ id: `${item.id}-rendered-body-slot`, blocks }]
        };
      } else {
        itemLayout = {
          ...itemProperties, type: 'layout', arrangement: 'parallel', columns: 3,
          margin: 0, padding: 0, gap: 0, border: false,
          tracks: [inset, gutter - inset, 180 - gutter],
          slots: [
            { id: `${item.id}-rendered-inset-slot`, widthMm: inset, blocks: [] },
            { id: `${item.id}-rendered-number-slot`, widthMm: gutter - inset, blocks: [numberParagraph(item, number)] },
            { id: `${item.id}-rendered-body-slot`, blocks }
          ]
        };
      }
      return { id: `${item.id}-rendered-row-slot`, blocks: [itemLayout] };
    })
  };
}

function repairProcedureTracks(group, procedureId) {
  const matches = [];
  visit(group, node => { if (node.id === procedureId) matches.push(node); });
  if (matches.length !== 1) throw Error(`Expected one ${procedureId}; found ${matches.length}`);
  const procedure = matches[0];
  if (procedure.type !== 'layout' || procedure.columns !== 1 || !Array.isArray(procedure.slots)) {
    throw Error(`Expected rendered native procedure ${procedureId}`);
  }
  let changed = false;
  for (const row of procedure.slots) {
    const item = row.blocks?.[0];
    if (row.blocks?.length !== 1 || item?.type !== 'layout' || !Array.isArray(item.slots)) {
      throw Error(`Cannot safely reconcile native row ${row.id}`);
    }
    if (item.columns === 1 && item.slots.length === 1 &&
        item.slots[0].id === `${item.id}-rendered-body-slot` &&
        item.slots[0].blocks?.[0]?.type === 'table') {
      if (Object.hasOwn(item, 'tracks')) {
        delete item.tracks;
        changed = true;
      }
    } else if (item.columns === 3 && item.slots.length === 3 &&
        item.slots[0].id === `${item.id}-rendered-inset-slot` &&
        item.slots[1].id === `${item.id}-rendered-number-slot` &&
        item.slots[2].id === `${item.id}-rendered-body-slot`) {
      const inset = item.slots[0].widthMm;
      const numberWidth = item.slots[1].widthMm;
      if (!Number.isFinite(inset) || !Number.isFinite(numberWidth) ||
          inset <= 0 || numberWidth <= 0 || inset + numberWidth >= 180) {
        throw Error(`Cannot safely reconcile native tracks ${item.id}`);
      }
      const tracks = [inset, numberWidth, 180 - inset - numberWidth];
      if (!Array.isArray(item.tracks) || item.tracks.length !== tracks.length ||
          item.tracks.some((width, index) => width !== tracks[index])) {
        item.tracks = tracks;
        changed = true;
      }
    } else {
      throw Error(`Cannot safely reconcile native row ${item.id}`);
    }
  }
  return changed;
}

function repairGroup(group, procedureId) {
  let count = 0;
  function replace(node) {
    if (!node || typeof node !== 'object') return;
    for (const [key, value] of Object.entries(node)) {
      if (Array.isArray(value)) {
        node[key] = value.map(child => {
          if (child?.id === procedureId) {
            count++;
            return nativeProcedure(child);
          }
          replace(child);
          return child;
        });
      } else if (value && typeof value === 'object') replace(value);
    }
  }
  replace(group);
  if (count !== 1) throw Error(`Expected one ${procedureId}; found ${count}`);
}

// Source atoms join within a pagination section. Isolate the final model and
// example in a separate teaching section without changing their source identity.
function isolateCalculatorPair(project, calculator, second, example) {
  const sectionId = `${calculator.section.id}-calculator-model-2`;
  const ids = new Set();
  visit(project, node => { if (typeof node.id === 'string') ids.add(node.id); });
  if (ids.has(sectionId)) throw Error(`Generated teaching section ID conflicts with ${sectionId}`);
  const section = {
    ...clone(calculator.section), id: sectionId, pageBreakBefore: true,
    blocks: [second, example.block]
  };
  const moved = new Set([second, example.block]);
  calculator.section.blocks = calculator.section.blocks.filter(block => !moved.has(block));
  if (example.section !== calculator.section) {
    example.section.blocks = example.section.blocks.filter(block => block !== example.block);
  }
  project.sections.splice(project.sections.indexOf(calculator.section) + 1, 0, section);
  return section;
}

export function repairRenderedCalculator(original) {
  const next = clone(original);
  if (!Array.isArray(next.sections)) throw Error('Expected a complete editable project with sections');
  const entries = next.sections.flatMap(section => section.blocks.map(block => ({ section, block })));
  const unique = id => {
    const matches = entries.filter(entry => entry.block.id === id);
    if (matches.length !== 1) throw Error(`Expected one ${id}; found ${matches.length}`);
    return matches[0];
  };
  const calculator = unique(CALCULATOR);
  const example = unique(EXAMPLE);
  const existingSecond = entries.filter(entry => entry.block.id === SECOND);
  if (existingSecond.length) {
    if (existingSecond.length !== 1 || existingSecond[0].section !== example.section) {
      throw Error('Existing calculator split needs explicit reconciliation');
    }
    const secondEntry = existingSecond[0];
    const second = secondEntry.block;
    const groupingChanged = secondEntry.section === calculator.section;
    const blocks = calculator.section.blocks;
    const at = blocks.indexOf(calculator.block);
    const placementMatches = groupingChanged
      ? blocks[at + 1] === second && blocks[at + 2] === example.block
      : secondEntry.section.id === `${calculator.section.id}-calculator-model-2` &&
        secondEntry.section.pageBreakBefore === true &&
        next.sections.indexOf(secondEntry.section) === next.sections.indexOf(calculator.section) + 1 &&
        secondEntry.section.blocks.length === 2 &&
        secondEntry.section.blocks[0] === second && secondEntry.section.blocks[1] === example.block;
    if (!placementMatches || calculator.block.flow?.keepWithNext !== false ||
        !second.flow?.keepTogether || !second.flow?.keepWithNext || !example.block.flow?.keepTogether ||
        second.flow?.pageBreakBefore !== false || example.block.flow?.pageBreakBefore !== false ||
        second.flow?.sourcePageBreakBefore !== false || example.block.flow?.sourcePageBreakBefore !== false) {
      throw Error('Existing calculator split differs from this repair');
    }
    const firstTracksChanged = repairProcedureTracks(calculator.block, 'p52-fx8200-procedure');
    const secondTracksChanged = repairProcedureTracks(second, 'p52-fx82-procedure');
    const teachingSection = groupingChanged
      ? isolateCalculatorPair(next, calculator, second, example)
      : secondEntry.section;
    const changes = [];
    if (groupingChanged) changes.push('Isolated the final calculator model and complete example in a teaching section with a local page break, preserving source identities.');
    if (firstTracksChanged || secondTracksChanged) changes.push('Removed three-column tracks from single-column table wrappers and assigned explicit tracks to numbered prose rows.');
    return {
      next,
      provenance: {
        repair: 'data-analysis-rendered-calculator',
        changed: groupingChanged || firstTracksChanged || secondTracksChanged,
        ...(groupingChanged ? {
          movedBlocks: [SECOND, EXAMPLE], fromSection: calculator.section.id,
          toSection: teachingSection.id
        } : {}),
        changes,
        visualAcceptance: 'pending-fresh-render'
      }
    };
  }
  const document = calculator.block.content;
  if (document?.format !== 'maths-editor-document-v1' || document.blocks?.length !== 2 ||
      document.blocks[0].id !== 'p52-model-1-group' || document.blocks[1].id !== 'p52-model-2-group') {
    throw Error('Calculator content differs from the supplied two-model native document');
  }
  if (next.settings?.layoutOverrides?.blockLayouts?.[CALCULATOR]?.arrangement) {
    throw Error('Calculator has a saved block arrangement that must be reconciled before splitting');
  }
  const allIds = new Set();
  visit(next, node => { if (typeof node.id === 'string') allIds.add(node.id); });
  const modelOne = document.blocks[0];
  const modelTwo = document.blocks[1];
  repairGroup(modelOne, 'p52-fx8200-procedure');
  repairGroup(modelTwo, 'p52-fx82-procedure');
  const newIds = [];
  visit([modelOne, modelTwo], node => {
    if (typeof node.id === 'string' && !allIds.has(node.id)) newIds.push(node.id);
  });
  if (new Set(newIds).size !== newIds.length) throw Error('Generated native arrangement IDs are not unique');
  for (const id of newIds) {
    if (entries.some(entry => entry.block.id === id)) throw Error(`Generated ID conflicts with ${id}`);
  }
  const second = clone(calculator.block);
  second.id = SECOND;
  second.content.blocks = [modelTwo];
  second.flow = {
    ...second.flow, sourcePageBreakBefore: false, pageBreakBefore: false,
    keepTogether: true, keepWithNext: true
  };
  calculator.block.content.blocks = [modelOne];
  calculator.block.flow = { ...calculator.block.flow, keepTogether: true, keepWithNext: false };
  example.block.flow = {
    ...example.block.flow, sourcePageBreakBefore: false, pageBreakBefore: false,
    keepTogether: true
  };
  // Keep the final model and example together, but prevent their shared
  // source atom from joining model one. Retain the former example section.
  const teachingSection = isolateCalculatorPair(next, calculator, second, example);
  return {
    next,
    provenance: {
      repair: 'data-analysis-rendered-calculator', changed: true,
      retainedBlock: CALCULATOR, addedBlock: SECOND,
      movedBlock: EXAMPLE, fromSection: example.section.id, toSection: teachingSection.id,
      changes: [
        'Separated the two calculator models at their existing native group boundary.',
        'Aligned source instruction numbers within native button rows; retained button dimensions and existing content IDs.',
        'Grouped the complete second method with the complete example using keepWithNext and keepTogether in a separate teaching section with a local page break.',
        'Preserved example arrangements, table padding and row heights, answers, source metadata and existing paragraph fonts.'
      ],
      visualAcceptance: 'pending-fresh-render'
    }
  };
}
