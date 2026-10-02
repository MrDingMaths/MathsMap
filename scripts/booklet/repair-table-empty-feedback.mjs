/**
 * Pure feedback maintenance. No file access, publication, revision changes or bank sync.
 * Paths in reports refer to the supplied input, before removals.
 * Callers must supply source-confirmed mathematical border exceptions through
 * preserveBorder(owner, { path, tableId }), where the existing schema has no marker.
 */
export const ORDINARY_TABLE_BORDER_COLOUR = '#cccccc';

const OPAQUE = /^(?:source|provenance|evidence|history|revisionHistory|revisions|atoms|spec|bankRef|classification|studio|feedback|comments|metadata|undo|redo|backups|snapshots)/i;
const REFERENCE_KEYS = new Set(['blockId', 'nodeId', 'documentNodeId', 'refId', 'blockRef', 'referenceId']);
const COLOUR_KEYS = new Set(['borderColour', 'borderColor']);
const EDGE_KEYS = new Set(['top', 'right', 'bottom', 'left', 'horizontal', 'vertical', 'inner', 'outer', 'all']);
const clone = value => structuredClone(value);
const pointer = (path, key) => `${path}/${String(key).replaceAll('~', '~0').replaceAll('/', '~1')}`;
const whitespace = value => typeof value === 'string' && /^[\s\u200b\ufeff]*$/u.test(value);
const object = value => value !== null && typeof value === 'object';

function protectedNode(node) {
  return object(node) && (
    ['preserveEmpty', 'sourcePlaceholder', 'intendedSpacer', 'spacer', 'writingArea', 'manualArrangement']
      .some(key => Boolean(node[key])) ||
    ['spacer', 'writing-area', 'answer-space'].includes(node.type)
  );
}

function protectedSubtree(node) {
  if (!object(node)) return false;
  if (protectedNode(node)) return true;
  return Object.entries(node).some(([key, value]) => !OPAQUE.test(key) && protectedSubtree(value));
}

function emptyParagraph(node) {
  return node?.type === 'paragraph' && Array.isArray(node.inlines) &&
    node.inlines.every(inline => inline?.type === 'text' && whitespace(inline.text) &&
      (!inline.marks || (Array.isArray(inline.marks) && inline.marks.length === 0)));
}

function emptyPayload(value) {
  if (typeof value === 'string') return whitespace(value);
  if (!object(value) || Array.isArray(value)) return false;
  if (emptyParagraph(value)) return true;
  return value.format === 'maths-editor-document-v1' && Array.isArray(value.blocks) &&
    value.blocks.every(emptyParagraph);
}

function emptyNode(node) {
  if (emptyParagraph(node)) return true;
  if (node?.type !== 'rich-text') return false;
  const keys = ['content', 'document', 'value', 'text'].filter(key => Object.hasOwn(node, key));
  return keys.length > 0 && keys.every(key => emptyPayload(node[key]));
}

/**
 * Safe generation-time predicate; default behaviour preserves the node.
 * Only explicitly generated, source-unbacked empty category nodes may be omitted.
 * This helper is deliberately not wired into an unsupported importer path.
 */
export function shouldEmitGeneratedEmptyCategory(node, {
  generatedCategory = false,
  sourceBacked = true,
  intentionallyEmpty = false
} = {}) {
  if (!generatedCategory || sourceBacked || intentionallyEmpty || protectedSubtree(node)) return true;
  return !emptyNode(node);
}

function borderless(owner, edge = false) {
  return owner.border === false || owner.border === 0 || owner.borders === false ||
    owner.borders === 0 || owner.borderWidth === 0 || owner.borderWidthMm === 0 ||
    (edge && (owner.width === 0 || owner.enabled === false));
}

function markedException(owner) {
  return owner.semanticBorder === true || owner.meaningfulBorder === true ||
    owner.borderPurpose === 'mathematical';
}

function explicitColour(value) {
  return typeof value === 'string' && value.trim() !== '' &&
    !/^(?:none|transparent|inherit|initial|unset|currentcolor)$/i.test(value.trim());
}

/**
 * Reconcile recognised arrangement references, including stored presentation and
 * override trees. Unknown active references block deletion rather than guessing.
 */
function referencePlan(root, target, targetNode) {
  const operations = [];
  const unknown = [];
  function walk(value, path, arrangement = false, parent = null, key = null) {
    if (value === targetNode) return;
    if (typeof value === 'string') {
      if (value !== target) return;
      if (arrangement && Array.isArray(parent)) {
        operations.push({ path, before: value, apply: () => {
          const index = parent.indexOf(value);
          if (index !== -1) parent.splice(index, 1);
        } });
      } else unknown.push(path);
      return;
    }
    if (!object(value)) return;
    if (arrangement && Array.isArray(parent) && !Array.isArray(value) &&
        [...REFERENCE_KEYS].some(name => value[name] === target)) {
      const references = [...REFERENCE_KEYS].filter(name => Object.hasOwn(value, name));
      const containsContent = ['blocks', 'children', 'rows', 'sections'].some(name => Object.hasOwn(value, name));
      if (!containsContent && references.every(name => value[name] === target)) {
        operations.push({ path, before: clone(value), apply: () => {
          const index = parent.indexOf(value);
          if (index !== -1) parent.splice(index, 1);
        } });
        return;
      }
    }
    for (const [name, child] of Object.entries(value)) {
      if (!Array.isArray(value) && OPAQUE.test(name)) continue;
      const childPath = pointer(path, name);
      if (name === target) {
        if (arrangement) {
          operations.push({ path: childPath, before: clone(child), apply: () => { delete value[name]; } });
          continue;
        }
        unknown.push(childPath);
      }
      const inArrangement = arrangement || /arrangement|presentation|override/i.test(name) ||
        (name === 'layout' && object(child));
      walk(child, childPath, inArrangement, value, name);
    }
  }
  walk(root, '');
  return { operations, unknown };
}

/**
 * Return { next, provenance, report }; never mutate input.
 * confirmedRemovals requires { id, reason, classification }, with classification
 * 'confirmed-empty-category' or 'confirmed-transcription-remnant'. No broad blank cleanup.
 */
export function repairTableEmptyFeedback(input, options = {}) {
  const next = clone(input);
  const entityId = options.entityId ?? input.id ?? null;
  const entityKind = options.entityKind ?? 'project';
  const projectId = options.projectId ?? (entityKind === 'project' ? entityId : null);
  const provenance = { changes: [], removedNodes: [], arrangementChanges: [] };
  const report = {
    entityId, entityKind, tableCount: 0, changedTableCount: 0,
    borderChangeCount: 0, emptyParagraphCount: 0,
    preservedEmptyParagraphCount: 0, removedNodeCount: 0,
    preservedCandidates: [], blockedRemovals: [], borderExceptions: []
  };
  const confirmations = [...(options.confirmedRemovals ?? [])];
  if (projectId === 'data-analysis-v1') confirmations.push({
    id: 'p56-development', classification: 'confirmed-empty-category',
    reason: 'Supplied feedback confirms this empty development category is accidental.'
  });
  const confirmed = new Map();
  for (const entry of confirmations) {
    if (!entry?.id || !entry.reason || !['confirmed-empty-category', 'confirmed-transcription-remnant'].includes(entry.classification)) {
      throw new TypeError('Each confirmed removal needs an id, reason and supported classification.');
    }
    confirmed.set(entry.id, entry);
  }
  const candidates = [];
  const occurrences = new Map();
  const exempt = (owner, path, tableId) => markedException(owner) ||
    Boolean(options.preserveBorder?.(owner, { path, tableId }));

  function change(owner, key, path, tableId, materialiseInherited = false) {
    const before = owner[key];
    const inherited = before == null || (typeof before === 'string' &&
      /^(?:inherit|initial|unset|currentcolor)?$/i.test(before.trim()));
    if (before === ORDINARY_TABLE_BORDER_COLOUR ||
        (!explicitColour(before) && !(materialiseInherited && inherited))) return;
    owner[key] = ORDINARY_TABLE_BORDER_COLOUR;
    provenance.changes.push({ path: pointer(path, key), tableId, before,
      after: ORDINARY_TABLE_BORDER_COLOUR, reason: 'Ordinary native table border feedback.' });
    report.borderChangeCount += 1;
  }

  function borderSpec(value, path, tableId, parent, key) {
    if (typeof value === 'string') {
      change(parent, key, path.slice(0, path.lastIndexOf('/')), tableId);
      return;
    }
    if (!object(value)) return;
    if (borderless(value, true) || exempt(value, path, tableId)) return;
    if (Array.isArray(value)) {
      value.forEach((entry, index) => borderSpec(entry, pointer(path, index), tableId, value, index));
      return;
    }
    for (const [name, child] of Object.entries(value)) {
      if (COLOUR_KEYS.has(name) || name === 'colour' || name === 'color') change(value, name, path, tableId);
      else if (EDGE_KEYS.has(name)) borderSpec(child, pointer(path, name), tableId, value, name);
    }
  }

  function borderOwner(owner, path, tableId, { enabledRulesOnly = false, table = null } = {}) {
    if (!object(owner)) return;
    const enabledCellRules = ['top', 'right', 'bottom', 'left']
      .some(side => owner.borders?.[side] === true);
    if (enabledRulesOnly && !enabledCellRules && owner.border !== true) return;
    if (owner.borderWidth === 0 || owner.borderWidthMm === 0) return;
    if (enabledRulesOnly && (owner.borderWidthMm ?? table?.borderWidthMm) === 0) return;
    if (borderless(owner) && !enabledCellRules && !(enabledRulesOnly && owner.border === true)) return;
    if (exempt(owner, path, tableId)) {
      report.borderExceptions.push({ tableId, path, reason: 'Explicit meaningful border exception.' });
      return;
    }
    if (enabledRulesOnly) {
      const effectiveColour = owner.borderColour ?? table?.borderColour;
      if (typeof effectiveColour === 'string' && /^(?:none|transparent)$/i.test(effectiveColour.trim())) return;
      // Explicit cell rules override a borderless table. Materialise their colour
      // locally so the layout and meaningful neighbouring rules retain their defaults.
      change(owner, 'borderColour', path, tableId, true);
    }
    for (const key of COLOUR_KEYS) if (Object.hasOwn(owner, key)) change(owner, key, path, tableId);
    if (object(owner.borders)) borderSpec(owner.borders, pointer(path, 'borders'), tableId, owner, 'borders');
  }

  function walk(value, path = '', ancestors = [], parent = null, key = null) {
    if (!object(value)) return;
    if (!Array.isArray(value) && typeof value.id === 'string' && confirmed.has(value.id)) {
      occurrences.set(value.id, (occurrences.get(value.id) ?? 0) + 1);
      if (Array.isArray(parent) && ancestors.at(-2)?.key === 'blocks') candidates.push({ node: value, parent, path, ancestors });
      else report.preservedCandidates.push({ id: value.id, path, reason: 'Not an entry in a recognised blocks array.' });
    }
    if (emptyParagraph(value)) report.emptyParagraphCount += 1;
    if (value.type === 'table') {
      report.tableCount += 1;
      const before = report.borderChangeCount;
      if (options.repairBorders !== false && !exempt(value, path, value.id)) {
        const layoutBorderless = borderless(value);
        if (!layoutBorderless) borderOwner(value, path, value.id);
        if (Array.isArray(value.rows)) value.rows.forEach((row, rowIndex) => {
          if (Array.isArray(row)) row.forEach((cell, cellIndex) =>
            borderOwner(cell, pointer(pointer(pointer(path, 'rows'), rowIndex), cellIndex), value.id,
              { enabledRulesOnly: layoutBorderless, table: value }));
        });
      } else if (exempt(value, path, value.id)) {
        report.borderExceptions.push({ tableId: value.id, path, reason: 'Explicit meaningful table border exception.' });
      }
      if (report.borderChangeCount > before) report.changedTableCount += 1;
    }
    for (const [name, child] of Object.entries(value)) {
      if (!Array.isArray(value) && OPAQUE.test(name)) continue;
      walk(child, pointer(path, name), [...ancestors, { node: value, key: name }], value, name);
    }
  }
  walk(next);

  for (const candidate of candidates) {
    const { node, parent, path, ancestors } = candidate;
    const confirmation = confirmed.get(node.id);
    const preserveReason = node.id === 'p1-cover-source-evidence' ? 'Cover source evidence must remain.' :
      occurrences.get(node.id) !== 1 ? 'Ambiguous duplicate stable ID.' :
      ancestors.some(entry => entry.node.type === 'table' || protectedNode(entry.node)) || protectedSubtree(node)
        ? 'Structural cell, explicit preservation, spacer, writing area or manual arrangement.' :
      !emptyNode(node) ? 'Not a confirmed empty supported document shape.' : null;
    if (preserveReason) {
      report.preservedCandidates.push({ id: node.id, path, reason: preserveReason });
      continue;
    }
    const plan = referencePlan(next, node.id, node);
    if (plan.unknown.length) {
      report.blockedRemovals.push({ id: node.id, path,
        reason: 'Unrecognised active references require schema-specific reconciliation.', references: plan.unknown });
      continue;
    }
    for (const operation of plan.operations) {
      operation.apply();
      provenance.arrangementChanges.push({ path: operation.path, before: operation.before,
        after: null, removedNodeId: node.id, reason: confirmation.reason });
    }
    const index = parent.indexOf(node);
    if (index !== -1) {
      parent.splice(index, 1);
      provenance.removedNodes.push({ id: node.id, path, node: clone(node),
        classification: confirmation.classification, reason: confirmation.reason });
      report.removedNodeCount += 1;
    }
  }
  const removedParagraphs = provenance.removedNodes.reduce((count, entry) => {
    function countParagraphs(value) {
      if (!object(value)) return 0;
      return Number(emptyParagraph(value)) + Object.entries(value).reduce((sum, [key, child]) =>
        sum + (OPAQUE.test(key) ? 0 : countParagraphs(child)), 0);
    }
    return count + countParagraphs(entry.node);
  }, 0);
  report.preservedEmptyParagraphCount = report.emptyParagraphCount - removedParagraphs;
  return { next, provenance, report };
}

/** Audit caller-supplied active projects and reusable bank entries, without publication. */
export function repairTableEmptyFeedbackCollection({ projects = [], bankEntries = [] }, options = {}) {
  const repair = (entries, entityKind) => entries.map(entry => ({ id: entry.id,
    ...repairTableEmptyFeedback(entry, { ...options, entityKind, entityId: entry.id,
      projectId: entityKind === 'project' ? entry.id : null }) }));
  const repairedProjects = repair(projects, 'project');
  const repairedBank = repair(bankEntries, 'bank');
  const affected = entries => entries.filter(entry => entry.report.borderChangeCount || entry.report.removedNodeCount)
    .map(entry => ({ id: entry.id, changedTables: entry.report.changedTableCount,
      borderChanges: entry.report.borderChangeCount, removedNodes: entry.report.removedNodeCount }));
  return { projects: repairedProjects, bankEntries: repairedBank,
    affectedProjects: affected(repairedProjects), affectedBankEntries: affected(repairedBank) };
}
