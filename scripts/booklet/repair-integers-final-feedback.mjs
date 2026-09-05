import fs from 'node:fs';
import path from 'node:path';
import { loadRun, contentHash, applyContentOverrides, validateRun } from './transcription.mjs';

const { runDir } = loadRun('computation-integers-pilot-v2');
const read = (file) => JSON.parse(fs.readFileSync(path.join(runDir, file), 'utf8'));
const raw = read('merged/transcription.json');
const review = read('review.json');
const effective = applyContentOverrides(raw, review);
const changes = [];
function set(rootId, pointer, value) {
  function find(node) { if (!node || typeof node !== 'object') return null; if (node.id === rootId) return node; return Object.values(node).map(find).find(Boolean); }
  const root = find(effective);
  if (!root) throw new Error(`Missing target ${rootId}`);
  const current = pointer.slice(1).split('/').reduce((node, key) => node?.[key], root);
  if (JSON.stringify(current) === JSON.stringify(value)) return;
  if (review.contentOverrides?.[rootId]?.[pointer]) throw new Error(`Preserving existing edit ${rootId}${pointer}; inspect conflict.`);
  changes.push({ rootId, pointer, value, note: 'Final pilot feedback: source-checked heading, border or exam label placement.' });
}
for (const page of effective.pages.filter((p) => p.pageNumber >= 29)) {
  const n = page.pageNumber;
  const difficulty = {31:'Foundation',33:'Foundation',34:'Development',36:'Mastery',48:'Development'}[n];
  const absent = [30,32,35,37,38,51,62].includes(n);
  const style = absent ? 'none' : difficulty ? 'difficulty' : 'page-title';
  if (difficulty) set(page.id, '/section/title', difficulty);
  set(page.id, '/section/headingStyle', style);
  if (n === 46) set(page.id, '/section/difficultyTitle', 'Foundation');
  set(page.id, '/section/sourceHeading', { text: absent ? '' : difficulty ?? page.section.title, style, difficultyTitle: n === 46 ? 'Foundation' : '' });
}
set('page-29-investigation', '/tableStyle', 'borderless');
set('page-29-investigation', '/sourceTableStyle', 'borderless');
for (const [id, label] of [['page-38-q1','NAPLAN B+'],['page-38-q4','NAPLAN A']]) set(id, '/sourceExamLabel', label);
// Source numbering is unusual but intentional here; preserve printed labels without reordering.
for (const [index, number] of [14,13,14,15].entries()) set(`page-38-q${index+1}`, '/sourceOrder', number);
if (changes.length) {
  const backup = path.join(runDir, 'migration', 'final-feedback-' + Date.now());
  fs.mkdirSync(backup, { recursive: true });
  fs.copyFileSync(path.join(runDir,'merged/transcription.json'),path.join(backup,'transcription.json'));
  for (const file of ['review.json','manifest.json']) fs.copyFileSync(path.join(runDir,file),path.join(backup,file));
  const roots = new Map();
  function index(node) { if (!node || typeof node !== 'object') return; if (node.id) roots.set(node.id,node); Object.values(node).forEach(index); }
  index(raw);
  const readPointer = (node, pointer) => pointer.slice(1).split('/').reduce((value,key) => value?.[key],node);
  const beforeEdits = Object.entries(review.contentOverrides ?? {}).flatMap(([id, fields]) => Object.keys(fields).map(pointer => [id,pointer,JSON.stringify(readPointer(roots.get(id),pointer))]));
  for (const change of changes) {
    const keys = change.pointer.slice(1).split('/'); const key = keys.pop();
    const target = keys.reduce((node,key) => node[key],roots.get(change.rootId)); target[key] = change.value;
  }
  for (const [id,pointer,before] of beforeEdits) if (JSON.stringify(readPointer(roots.get(id),pointer)) !== before) throw new Error(`Repair conflicts with saved edit ${id}${pointer}`);
  for (const [id, fields] of Object.entries(review.contentOverrides ?? {})) for (const record of Object.values(fields)) record.beforeHash = contentHash(roots.get(id));
  applyContentOverrides(raw,review);
  const affected = new Set(changes.map(c => Number(c.rootId.match(/^page-(\d+)/)?.[1])));
  for (const page of review.pages) if (affected.has(page.pageNumber)) page.accepted = false;
  for (const key of ['questions','modules','mappings']) review[key] = Object.fromEntries(Object.entries(review[key] ?? {}).map(([id,value]) => [id,{...value,accepted:false}]));
  review.history.push({type:'integers-final-feedback',at:new Date().toISOString(),changes});
  const manifest = read('manifest.json');
  for (const lane of ['enrichment','mapping','fidelity']) if (manifest.lanes[lane]) manifest.lanes[lane].status='stale';
  for (const [file,value] of [['merged/transcription.json',raw],['review.json',review],['manifest.json',manifest]]) fs.writeFileSync(path.join(runDir,file),JSON.stringify(value,null,2)+'\n');
}
const validation = validateRun(runDir);
console.log(JSON.stringify({ changed: changes.length, validationErrors: validation.errors }, null, 2));
