import {createHash} from 'node:crypto';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {remapQuestionPresentation} from '../../src/lib/question-presentation.js';

const copy = value => structuredClone(value);
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
export const mergeFingerprint = value => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
function walk(value, visit) {
  if (!value || typeof value !== 'object') return;
  visit(value);
  Object.values(value).forEach(child => walk(child, visit));
}
function identities(value) {
  const ids = new Set();
  walk(value, node => { if (typeof node.id === 'string') ids.add(node.id); });
  return ids;
}
const referenceKey = /^(id|ref|dependsOn|continuationOf|target|owner|href)$|Ids?$/;
// Skills belong to the shared registry, even when a local topic has the same ID.
const globalReferenceKeys = new Set(['primarySkillId', 'secondarySkillIds', 'skillId', 'skillIds']);
const evidenceKeys = new Set(['source', 'sourceRefs', 'originalDiagram', 'originalGraph', 'mathematicalModel']);
function namespaceProject(input, namespace) {
  if (!/^[a-z0-9-]+$/.test(namespace)) throw Error('Invalid import namespace');
  const runId = input.source?.runId;
  if (!runId) throw Error(`${namespace}: imported project needs source.runId`);
  const ids = new Map([...identities([input.sections, input.topics, input.assets, input.studio, input.settings, input.source.inventory])].map(id => [id, `${namespace}--${id}`]));
  const remap = value => remapQuestionPresentation(value, ids);
  const transform = (value, key = '', ancestors = []) => {
    if (globalReferenceKeys.has(key)) return copy(value);
    if (key === 'order' && ancestors.includes('sourceReview') && ancestors.includes('arrangements')) return remap(value);
    if (typeof value === 'string') {
      if ((key === 'src' || key === 'url') && value.startsWith('evidence/')) return `/__booklet/full-imports/${encodeURIComponent(runId)}/files/${value}`;
      return referenceKey.test(key) ? remap(value) : value;
    }
    if (Array.isArray(value)) return value.map(child => transform(child, key, ancestors));
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value).map(([name, child]) => [['atoms', 'lineage'].includes(key) ? remap(name) : name, evidenceKeys.has(name) ? copy(child) : ['arrangement', 'layoutOverrides', 'presentation'].includes(name) ? remap(child) : transform(child, name, [...ancestors, key])]));
  };
  const project = transform(input);
  // References keep original page numbers and now explicitly identify their source run.
  walk(project.sections, node => {
    if (node.sourceRefs) node.sourceRefs = node.sourceRefs.map(ref => ({...ref, runId: ref.runId ?? runId}));
    else if (Number.isInteger(node.sourcePageNumber) && node.sourcePageNumber > 0) node.sourceRefs = [{pageNumber: node.sourcePageNumber, runId}];
    if (node.bankRef) throw Error(`${namespace}: imported bank ownership needs explicit reconciliation`);
  });
  project.settings = remap(input.settings ?? {});
  return {project, idMap: Object.fromEntries(ids)};
}
function mergeMap(target, incoming, label) {
  for (const [key, value] of Object.entries(incoming ?? {})) {
    if (Object.hasOwn(target, key)) throw Error(`Imported ${label} identity collides: ${key}`);
    target[key] = copy(value);
  }
}

/** Pure candidate builder. Never saves, increments revision or changes existing bank ownership. */
export function mergeDataBooklets(existing, classification, visualisation2) {
  if (existing.id !== 'data-visualisation-1-v1') throw Error('Unexpected destination project');
  const result = copy(existing);
  const specs = [
    {input: classification, namespace: 'data-classification', position: 'before'},
    {input: visualisation2, namespace: 'data-visualisation-2', position: 'after'},
  ];
  for (const {input, namespace, position} of specs) {
    if (!input?.sections?.length) throw Error(`${namespace}: missing semantic sections`);
    const inputHash = mergeFingerprint(input);
    const previous = result.source?.imports?.find(item => item.namespace === namespace);
    if (previous) {
      if (previous.inputHash !== inputHash) throw Error(`${namespace}: imported candidate changed; explicit reconciliation required`);
      // Same source is a no-op, including when teachers have since edited imported content.
      continue;
    }
    if (result.sections.some(section => section.id?.startsWith(`${namespace}--`))) throw Error(`${namespace}: unrecorded previous import; explicit reconciliation required`);
    if (input.sections.some(section => section.isCover || section.blocks?.some(block => block.sourcePageNumber === 1) && section.phase === 'front-matter')) throw Error(`${namespace}: remove only source cover furniture before merging; preserve syllabus sections`);
    const {project: imported, idMap} = namespaceProject(input, namespace);
    const occupied = identities([result.sections, result.topics, result.assets]);
    for (const id of identities([imported.sections, imported.topics, imported.assets])) if (occupied.has(id)) throw Error(`Imported content identity collides: ${id}`);
    result.sections = position === 'before' ? [...imported.sections, ...result.sections] : [...result.sections, ...imported.sections];
    result.topics = position === 'before' ? [...(imported.topics ?? []), ...(result.topics ?? [])] : [...(result.topics ?? []), ...(imported.topics ?? [])];
    result.assets = [...(result.assets ?? []), ...(imported.assets ?? [])];
    result.settings ??= {};
    result.settings.layoutOverrides ??= {};
    for (const [kind, entries] of Object.entries(imported.settings.layoutOverrides ?? {})) {
      result.settings.layoutOverrides[kind] ??= {};
      mergeMap(result.settings.layoutOverrides[kind], entries, kind);
    }
    for (const kind of ['diagramWidths', 'diagramStyles']) {
      const incoming = imported.settings.compactAnswers?.[kind];
      if (!incoming) continue;
      result.settings.compactAnswers ??= {};
      result.settings.compactAnswers[kind] ??= {};
      if (kind === 'diagramStyles') for (const [edition, entries] of Object.entries(incoming)) {
        result.settings.compactAnswers[kind][edition] ??= {};
        mergeMap(result.settings.compactAnswers[kind][edition], entries, `${kind}.${edition}`);
      } else mergeMap(result.settings.compactAnswers[kind], incoming, kind);
    }
    if (imported.studio) {
      result.studio ??= {version: 1};
      for (const kind of ['atoms', 'lineage']) {
        result.studio[kind] ??= {};
        mergeMap(result.studio[kind], imported.studio[kind], `studio.${kind}`);
      }
      result.studio.flags = [...(result.studio.flags ?? []), ...(imported.studio.flags ?? [])];
    }
    result.source ??= {};
    result.source.imports ??= [];
    result.source.imports.push({namespace, projectId: input.id, title: input.title, runId: input.source.runId, inputHash, position, sectionIds: imported.sections.map(section => section.id), idMap, source: copy(input.source)});
  }
  result.title = 'Data Classification and Visualisation';
  result.settings.cover = {...result.settings.cover, title: result.title};
  return result;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--apply')) throw Error('Candidate-only tool. Publish through revision-safe saveBookletProject and bank transaction helpers.');
  const arg = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
  const root = path.resolve(arg('--root', '.'));
  const existingPath = path.resolve(root, arg('--existing', 'booklets/projects/data-visualisation-1-v1.json'));
  const output = path.resolve(root, arg('--out', '.booklet-work/full-imports/data-classification-visualisation-merge-20260917/candidate.project.json'));
  if (!output.startsWith(path.join(root, '.booklet-work') + path.sep)) throw Error('Candidate output must stay under .booklet-work');
  const paths = [existingPath, path.resolve(root, arg('--classification', '.booklet-work/full-imports/data-classification-merge-20260917/candidate.project.json')), path.resolve(root, arg('--visualisation2', '.booklet-work/full-imports/data-visualisation-2-merge-20260917/candidate.project.json'))];
  const inputs = await Promise.all(paths.map(async file => JSON.parse(await readFile(file, 'utf8'))));
  const candidate = mergeDataBooklets(...inputs);
  const latest = JSON.parse(await readFile(existingPath, 'utf8'));
  if (mergeFingerprint(latest) !== mergeFingerprint(inputs[0])) throw Error('Destination changed during merge; rerun against current project');
  await mkdir(path.dirname(output), {recursive: true});
  await writeFile(output, JSON.stringify(candidate, null, 2) + '\n');
  await writeFile(output.replace(/\.json$/, '') + '.receipt.json', JSON.stringify({format: 'mathsmap-booklet-merge-receipt-v1', existingPath, expectedRevision: inputs[0].revision, expectedHash: mergeFingerprint(inputs[0]), candidateHash: mergeFingerprint(candidate), inputs: paths, imports: candidate.source.imports, published: false}, null, 2) + '\n');
  console.log(`Candidate written: ${output}; base revision ${inputs[0].revision}. No live files changed.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
