import {spaceFractionSteps} from './equation-spacing.mjs';
// Selection belongs to the editing session, never to the saved document.
const copy = value => value == null ? null : JSON.parse(JSON.stringify(value));
const ownerOf = (surface, node) => (node.nodeType === 1 ? node : node.parentElement)?.closest('[data-id]') ?? surface;
function point(surface, node, offset) {
  const owner = ownerOf(surface, node), path = [];
  for (let current = node; current && current !== owner; current = current.parentNode)
    path.unshift([...current.parentNode.childNodes].indexOf(current));
  return { nodeId: owner.dataset.id, path, offset };
}
function resolve(surface, bookmark) {
  let node = bookmark?.nodeId ? surface.querySelector(`[data-id="${CSS.escape(bookmark.nodeId)}"]`) : surface;
  node ??= surface.querySelector('p') ?? surface;
  for (const index of bookmark?.path ?? []) {
    if (!node.childNodes[index]) break;
    node = node.childNodes[index];
  }
  // A removed equation must leave a prose caret, not a caret inside MathLive.
  const island = (node.nodeType === 1 ? node : node.parentElement)?.closest('[data-math]');
  if (island) return [island.parentNode, [...island.parentNode.childNodes].indexOf(island)];
  return [node, Math.min(bookmark?.offset ?? 0, node.nodeType === 3 ? node.length : node.childNodes.length)];
}
export function captureSelection(editor) {
  if (editor.inspector?.contains(document.activeElement) && document.activeElement.matches('math-field') && editor.selected?.type === 'annotated-equation')
    return {annotated:true,nodeId:editor.selectedId,selection:copy(document.activeElement.selection),position:document.activeElement.position};
  const {surface} = editor, field = editor.mathEditing?.field() ??
    (surface.contains(document.activeElement) && document.activeElement?.matches('math-field') ? document.activeElement : null);
  if (field) {
    const owner = ownerOf(surface, field), fields = [...owner.querySelectorAll('math-field')];
    return { math: true, nodeId: owner.dataset.id, mathIndex: fields.indexOf(field), mathCount: fields.length,
      selection: copy(field.selection), position: field.position,
      fallback: point(surface, field.closest('[data-math]').parentNode, [...field.closest('[data-math]').parentNode.childNodes].indexOf(field.closest('[data-math]'))) };
  }
  const selection = getSelection();
  if (!selection?.rangeCount || !surface.contains(selection.anchorNode) || !surface.contains(selection.focusNode)) return null;
  return { anchor: point(surface, selection.anchorNode, selection.anchorOffset), focus: point(surface, selection.focusNode, selection.focusOffset) };
}
export function restoreSelection(editor, bookmark) {
  if (!bookmark || editor.host.readonly) return false;
  const {surface} = editor;
  if (bookmark.annotated && surface.querySelector(`[data-id="${CSS.escape(bookmark.nodeId)}"]`)) {
    editor.selectedId=bookmark.nodeId;editor.properties();
    const field=editor.inspector.querySelector('math-field');
    if(field){field.focus({preventScroll:true});if(bookmark.selection)field.selection=copy(bookmark.selection);else field.position=bookmark.position??-1;return true;}
  }
  if (bookmark.math) {
    const owner = bookmark.nodeId ? surface.querySelector(`[data-id="${CSS.escape(bookmark.nodeId)}"]`) : surface;
    const fields = owner?.querySelectorAll('math-field'), field = fields?.length === bookmark.mathCount ? fields[bookmark.mathIndex] : null;
    if (field) {
      editor.mathEditing?.activate(field);
      const focus = () => {
        field.focus({preventScroll:true});
        if (bookmark.selection) field.selection = copy(bookmark.selection);
        else field.position = bookmark.position ?? -1;
      };
      const mounted=()=>{if(field.isConnected&&[surface,document.body].includes(document.activeElement))focus();};
      field.addEventListener('mount',mounted,{once:true});
      focus();
      // Retry across mounting without resetting a caret the user already moved.
      queueMicrotask(mounted);
      requestAnimationFrame(mounted);
      return true;
    }
  }
  const anchor = resolve(surface, bookmark.fallback ?? bookmark.anchor), focus = resolve(surface, bookmark.fallback ?? bookmark.focus ?? bookmark.anchor);
  surface.focus({preventScroll:true});
  getSelection().setBaseAndExtent(...anchor, ...focus);
  editor.saveRange();
  return true;
}

// Most equation undo steps change only LaTeX. Keep MathLive mounted for these
// steps, including its keyboard delegate, rather than replacing the document.
export function patchMathValues(editor, previous, next) {
  const values=[];
  const shape=doc=>JSON.stringify(doc,(key,value)=>{
    if(value?.type==='math'){values.push(value.latex);return {...value,latex:''};}
    return value;
  });
  const before=shape(previous),count=values.length;
  if(before!==shape(next))return false;
  const fields=[...editor.surface.querySelectorAll('[data-math] math-field')];
  if(fields.length!==count||values.length!==count*2)return false;
  fields.forEach((field,index)=>{const latex=spaceFractionSteps(values[count+index]);if(field.getValue('latex')!==latex)field.setValue(latex,{silenceNotifications:true});});
  return true;
}
