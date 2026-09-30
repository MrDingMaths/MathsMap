// Remove source checkbox glyphs now that Review labels are structural numbers.
// Pure project repair; CLI is dry-run by default and uses the Studio save path.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {usesReviewNumbers} from '../../src/lib/booklet-labels.js';

const checkboxPrefix = /^\s*[\u2610\u25a1\u25a2]\s*/u;
const checkboxOnly = /^\s*[\u2610\u25a1\u25a2]\s*$/u;
const nativeCheckbox = inline => inline?.type === 'math' && String(inline.latex ?? '').trim() === '\\square';
const blankInline = inline => inline?.type === 'text' && !String(inline.text ?? '').trim();
const blankParagraph = block => block?.type === 'paragraph' && (block.inlines ?? []).every(blankInline);

function checkboxSlot(slot) {
 const inlines = (slot?.blocks ?? []).flatMap(block => block.type === 'paragraph' ? block.inlines ?? [] : [null]).filter(inline => !blankInline(inline));
 return inlines.length === 1 && (nativeCheckbox(inlines[0]) || inlines[0]?.type === 'text' && checkboxOnly.test(inlines[0].text));
}

function startsWithProse(blocks = []) {
 const first = blocks.find(block => !blankParagraph(block));
 if (first?.type === 'layout') return startsWithProse(first.slots?.[0]?.blocks);
 const inline = first?.type === 'paragraph' && first.inlines?.find(value => !blankInline(value));
 return inline?.type === 'text' && /^\s*[\p{L}\p{N}]/u.test(String(inline.text ?? ''));
}

function cleanLeadingBlocks(blocks = []) {
 const first = blocks.find(block => !blankParagraph(block));
 if (first?.type === 'layout') {
  // Keep the layout ID and substantive slot/block IDs so prompt# references
  // still resolve. Only the obsolete checkbox slot and its track disappear.
  if (first.arrangement === 'parallel' && first.slots?.length > 1 && checkboxSlot(first.slots[0]) && startsWithProse(first.slots[1].blocks)) {
   first.slots.shift();
   if (Array.isArray(first.tracks)) first.tracks.shift();
   if (typeof first.columns === 'number') first.columns = first.slots.length;
   if (first.slots.length === 1) first.gap = 0;
  }
  cleanLeadingBlocks(first.slots?.[0]?.blocks);
  return;
 }
 if (first?.type !== 'paragraph') return;
 const inlines = first.inlines ?? [], index = inlines.findIndex(inline => !blankInline(inline)), inline = inlines[index];
 if (inline?.type === 'text') inline.text = String(inline.text ?? '').replace(checkboxPrefix, '');
 else if (nativeCheckbox(inline)) {
  // An exact leading square followed by prose is the source checkbox. A square
  // alone, within an equation, or followed by other mathematics is preserved.
  const following = inlines.slice(index + 1).find(value => !blankInline(value));
  if (following?.type !== 'text' || !/^\s*[\p{L}\p{N}]/u.test(String(following.text ?? ''))) return;
  const replacement = {...inline, type: 'text', text: ''};
  delete replacement.latex;
  delete replacement.display;
  inlines[index] = replacement;
  following.text = following.text.trimStart();
 }
}

export function cleanReviewPrompt(value) {
 if (typeof value === 'string') return value.replace(checkboxPrefix, '');
 if (value?.format !== 'maths-editor-document-v1') return value;
 const next = structuredClone(value);
 cleanLeadingBlocks(next.blocks);
 return next;
}

/** No mutation or writes. Clear source-numbering exceptions only on request:
 * true clears all Review exceptions; an array/Set scopes them to block IDs. */
export function normaliseReviewProject(value, {clearSourceNumbering = false} = {}) {
 const project = structuredClone(value), reviews = (project.sections ?? []).flatMap(section => section.blocks ?? []).filter(usesReviewNumbers);
 const requested = clearSourceNumbering === true ? null : new Set(clearSourceNumbering || []);
 const promptChanges = [], numberingChanges = [], changed = [];
 for (const block of reviews) {
  const prompt = cleanReviewPrompt(block.content?.prompt);
  if (JSON.stringify(prompt) !== JSON.stringify(block.content?.prompt)) {
   block.content.prompt = prompt;
   promptChanges.push(block.id);
  }
  if ((clearSourceNumbering === true || requested.has(block.id)) && block.presentation?.reviewNumbering === 'source') {
   delete block.presentation.reviewNumbering;
   numberingChanges.push(block.id);
  }
  if (promptChanges.at(-1) === block.id || numberingChanges.at(-1) === block.id) changed.push(block.id);
 }
 return {project, report: {id: project.id, groups: new Set(reviews.map(block => block.sourceAtom?.id ?? block.id)).size, prompts: reviews.length, changed, promptChanges, numberingChanges}};
}

export async function normaliseReviews(apply = false, {
 projectRoot = path.resolve('booklets/projects'), bankRoot = path.resolve('booklets/question-bank'),
 projectIds = null, clearSourceNumberingByProject = {},
} = {}) {
 const report = [], selected = projectIds ? new Set(projectIds) : null;
 const files = (await fs.readdir(projectRoot)).filter(name => name.endsWith('.json') && name !== 'manifest.json').sort();
 // Lazy loading keeps the pure normalizer independent of the publishing path.
 const publishing = apply ? await import('./project-studio-server.mjs') : null;
 const sync = apply ? await import('./bank-sync.mjs') : null;
 for (const name of files) {
  const file = path.join(projectRoot, name), raw = await fs.readFile(file, 'utf8'), original = JSON.parse(raw.replace(/^\uFEFF/, ''));
  if (original.library?.archivedAt || original.status === 'archived' || selected && !selected.has(original.id)) continue;
  const result = normaliseReviewProject(original, {clearSourceNumbering: clearSourceNumberingByProject[original.id] ?? false});
  if (apply && result.report.changed.length) {
   const status = await sync.projectSyncStatus(original, bankRoot);
   assert.ok(status.items.filter(item => result.report.changed.includes(item.blockId)).every(item => !['conflict', 'update', 'missing'].includes(item.state)), 'Review sync needs explicit conflict review');
   assert.equal(await fs.readFile(file, 'utf8'), raw, 'Project changed during maintenance');
   const saved = await publishing.saveBookletProject(result.project, {projectRoot, bankRoot, expectedRevision: original.revision});
   const after = await sync.projectSyncStatus(saved, bankRoot);
   assert.ok(after.items.filter(item => item.owner && result.report.changed.includes(item.blockId)).every(item => item.state === 'synced'), 'Repaired owner Review questions must be synced');
  }
  report.push({...result.report, applied: apply && result.report.changed.length > 0});
 }
 return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
 const clearSourceNumberingByProject = {};
 for (const argument of process.argv.slice(2)) {
  if (argument.startsWith('--clear-source-numbering=')) {
   const id = argument.slice('--clear-source-numbering='.length);
   assert.ok(id, '--clear-source-numbering requires an explicit project ID');
   clearSourceNumberingByProject[id] = true;
  } else assert.ok(argument === '--apply', `Unknown argument: ${argument}`);
 }
 console.log(JSON.stringify(await normaliseReviews(process.argv.includes('--apply'), {clearSourceNumberingByProject}), null, 2));
}
