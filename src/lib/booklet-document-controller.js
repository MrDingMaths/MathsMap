import { createProjectBlock } from './editable-booklet-model.js';
import { fromSource } from '../../public/libs/maths-editor/document-model.mjs';
import {locateBookletContent} from './booklet-content-index.js';

const copy = value => value == null ? value : JSON.parse(JSON.stringify(value));
const fields = ['title','subtitle','sections','topics','settings','studio'];
function snapshotShare(previous,next){
  if(previous===next||next==null||typeof next!=='object')return next;
  const compatible=previous&&typeof previous==='object'&&Array.isArray(previous)===Array.isArray(next),keys=Object.keys(next),result=Array.isArray(next)?[]:{};
  let equal=compatible&&keys.length===Object.keys(previous).length;
  for(const key of keys){result[key]=snapshotShare(compatible?previous[key]:undefined,next[key]);if(!compatible||result[key]!==previous[key])equal=false;}
  return equal?previous:result;
}
export function documentFrame(project, selection = null, previous = null) {
  return { content: Object.fromEntries(fields.map(key => [key, snapshotShare(previous?.[key],project[key])])), selection: copy(selection) };
}
// Revisions and asynchronously refreshed bank metadata are not editing history.
export function restoreDocumentFrame(project, frame, immutable=false) {
  const current = new Map();
  for (const section of project.sections) for (const block of section.blocks) current.set(block.id, block);
  const next = { ...project, ...(immutable?frame.content:copy(frame.content)) };
  next.sections=next.sections.map(section=>({...section,blocks:section.blocks.map(original=>{
    const block={...original};
    const live = current.get(block.id);
    if (!live) return block;
    for (const key of ['bankRef','classification']) if (key in live) block[key] = copy(live[key]);
    if (live.flow?.bankDifficulty) block.flow = { ...block.flow, bankDifficulty: copy(live.flow.bankDifficulty) };
    return block;
  })}));
  return next;
}
export function createDocumentHistory({ limit = 100, typingPause = 750, immutable=false } = {}) {
  let past = [], future = [], group = null, at = 0, lastContent = null;
  const frame=(project,selection)=>{const value=immutable?{content:Object.fromEntries(fields.map(key=>[key,project[key]])),selection:copy(selection)}:documentFrame(project,selection,lastContent);lastContent=value.content;return value;};
  return {
    get past() { return past; }, get future() { return future; },
    reset() { past = []; future = []; group = null; lastContent=null; },
    boundary() { group = null; },
    record(project, selection, key = null, now = Date.now()) {
      if (!key || key !== group || now - at > typingPause) past = [...past.slice(1-limit), frame(project, selection)];
      future = []; group = key; at = now;
    },
    step(project, selection, direction = -1) {
      const source = direction < 0 ? past : future;
      if (!source.length) return null;
      const target = source.at(-1), present = frame(project, selection);
      if (direction < 0) { past = past.slice(0,-1); future = [...future,present]; }
      else { future = future.slice(0,-1); past = [...past,present]; }
      group = null;
      return { project: restoreDocumentFrame(project, target,immutable), selection: target.selection };
    },
  };
}

// Remember locations, never content objects. Validate the ID against the current
// document so moves, undo, deletions and project switches cannot return stale nodes.
export function contentTarget(project, id) {
  const found=locateBookletContent(project,id);return found?{node:found.node,section:found.section,block:found.block}:undefined;
}
export function fieldValue(project, anchor) {
  const target = contentTarget(project,anchor?.rootId ?? anchor?.targetId);
  return anchor?.pointer ? anchor.pointer.split('/').slice(1).reduce((v,k)=>v?.[k],target?.node) : target?.node;
}
export function replaceDocumentFragment(canonical, ids, edited) {
  if(!ids?.length||!canonical?.blocks)return edited;
  const wanted=new Set(ids),first=canonical.blocks.findIndex(b=>wanted.has(b.id));
  if(first<0)throw Error('The edited paragraph moved or changed. Your draft is retained for recovery.');
  const blocks=[];canonical.blocks.forEach((b,i)=>{if(i===first)blocks.push(...edited.blocks);if(!wanted.has(b.id))blocks.push(b);});
  return {...canonical,blocks};
}
export const TEACHING_TEMPLATES = [
  ['review','Review'],['theory','Definition / Theory'],['identify','Identify / Activity'],
  ['example','Example'],['guided-practice','Guided Practice'],['key-ideas','Key Ideas'],
];
export function createTeachingGroup(kind) {
  const labels = Object.fromEntries(TEACHING_TEMPLATES);
  if (!labels[kind]) throw Error('Unknown teaching template');
  const block = createProjectBlock(kind === 'example' ? 'worked-example' : ['review','identify','guided-practice'].includes(kind) ? kind === 'identify' ? 'activity' : kind : 'callout');
  block.title = '';
  block.sourceAtom = { id: crypto.randomUUID(), kind: kind === 'theory' ? 'definition' : kind, label: kind === 'theory' ? 'Definition' : kind === 'identify' ? 'Identify' : labels[kind], visibleSubtitle: '', description: '' };
  if (block.type === 'question') {
    const clear = node => { if ('prompt' in node) node.prompt = fromSource(''); if (node.answer) node.answer = { ...node.answer, short:'', worked:'' }; node.children?.forEach(clear); };
    clear(block.content);
  } else { block.content = fromSource(''); if ('theorySolution' in block) block.theorySolution = fromSource(''); }
  return block;
}
export function createDocumentQuestion(){const block=createProjectBlock('question');block.content.prompt=fromSource('');block.content.answer={...block.content.answer,short:'',worked:fromSource('')};return block;}
