// Browser-only adapter. Booklet selection survives replacement of rendered page fragments.
import {captureSelection,restoreSelection} from '../../public/libs/maths-editor/math-selection.mjs';
const atom='[data-math],[data-tab],[data-cloze],[data-type="inline-image"]';
const chrome='[data-native-handle],[data-resize-handles],[data-table-annotations],[data-math-preview]';
function visibleLength(node){if(node.nodeType===3)return node.textContent.replaceAll('\u200b','').length;if(node.nodeType!==1&&node.nodeType!==11)return 0;if(node.matches?.(chrome))return 0;if(node.matches?.(atom))return 1;return [...node.childNodes].reduce((n,c)=>n+visibleLength(c),0);}
function prosePoint(root,offset){
 let remaining=offset,last=[root,0],found;
 const walk=node=>{
  if(found||node.matches?.(chrome))return;
  if(node.matches?.(atom)){const index=[...node.parentNode.childNodes].indexOf(node);if(remaining===0)found=[node.parentNode,index];else if(remaining===1)found=[node.parentNode,index+1];else remaining--;last=[node.parentNode,index+1];return;}
  if(node.nodeType===3){const text=node.textContent;let used=0,index=0;while(index<text.length&&used<remaining){if(text[index]!=='\u200b')used++;index++;}if(used===remaining)found=[node,index];else remaining-=used;last=[node,text.length];return;}
  for(const child of node.childNodes)walk(child);
 };walk(root);return found??last;
}
export function captureEditorSelection(editor) {
  const surface=editor?.documentController?.surface;
  if(!surface)return null;
  const active=editor.documentController.mathEditing?.field()??document.activeElement;
  if(active?.matches('math-field')&&surface.contains(active))return {mathIndex:[...surface.querySelectorAll('math-field')].indexOf(active),mathCount:surface.querySelectorAll('math-field').length,position:active.position,mathSelection:captureSelection(editor.documentController)};
  const s=window.getSelection();
  if(!s?.rangeCount||!surface.contains(s.anchorNode)||!surface.contains(s.focusNode))return null;
  const point=(node,offset)=>{
    const el=(node.nodeType===1?node:node.parentElement).closest('[data-id]')??surface;
    const r=document.createRange();r.selectNodeContents(el);r.setEnd(node,offset);
    return {nodeId:el.dataset.id,offset:visibleLength(r.cloneContents())};
  };
  return {start:point(s.anchorNode,s.anchorOffset),end:point(s.focusNode,s.focusOffset),quote:s.toString()};
}
export function restoreEditorSelection(editor, bookmark) {
  const surface=editor?.documentController?.surface;if(!surface)return;
  if(bookmark?.mathSelection){
    const saved=bookmark.mathSelection;
    // Legacy source paragraphs receive new IDs when reopened. Preserve their
    // established equation ordinal when the field's equation count is unchanged.
    if(saved.nodeId&&!surface.querySelector(`[data-id="${CSS.escape(saved.nodeId)}"]`)&&surface.querySelectorAll('math-field').length===bookmark.mathCount){
      const field=surface.querySelectorAll('math-field')[bookmark.mathIndex];
      if(field){focusMathField(field,surface,bookmark.position,saved.selection);return;}
    }
    if(restoreSelection(editor.documentController,saved))return;
  }
  if(bookmark?.mathIndex!=null){const mf=surface.querySelectorAll('math-field')[bookmark.mathIndex];if(mf){focusMathField(mf,surface,bookmark.position);return;}}
  const point=entry=>{
    const root=entry?.nodeId?surface.querySelector(`[data-id="${CSS.escape(entry.nodeId)}"]`)??surface:surface;
    return prosePoint(root,entry?.offset??0);
  };
  const a=point(bookmark?.start),b=point(bookmark?.end??bookmark?.start);
  surface.focus({preventScroll:true});window.getSelection().setBaseAndExtent(...a,...b);editor.documentController.saveRange();
}
function focusMathField(field, surface, position, selection) {
  field.closest('maths-editor')?.documentController.mathEditing?.activate(field);
  const focus=()=>{field.focus({preventScroll:true});if(selection)field.selection=JSON.parse(JSON.stringify(selection));else if(position!=null)field.position=position;};
  focus();
  // MathLive finishes mounting after the host's synchronous document render.
  requestAnimationFrame(()=>{if(field.isConnected&&document.activeElement===field)focus();});
}
export function placeEditorAtPoint(editor, point) {
  const surface=editor.documentController.surface;
  if(point?.mathIndex!=null){const mf=surface.querySelectorAll('math-field')[point.mathIndex];if(mf){focusMathField(mf,surface);return;}}
  const hit=point&&document.caretPositionFromPoint?.(point.x,point.y);
  const range=point&&!hit&&document.caretRangeFromPoint?.(point.x,point.y);
  const node=hit?.offsetNode??range?.startContainer,offset=hit?.offset??range?.startOffset;
  if(node&&surface.contains(node)){surface.focus({preventScroll:true});getSelection().collapse(node,offset);editor.documentController.saveRange();}
  else restoreEditorSelection(editor,{start:{offset:point?.offset??0}});
}
export function installBookletEditorHost(editor, host) {
  const c=editor.documentController, originalUndo=c.undo.bind(c);
  const originalTabs=c.tabProperties,originalCopiedTabs=Object.getOwnPropertyDescriptor(c,'copiedTabs');
  Object.defineProperty(c,'copiedTabs',{configurable:true,get:()=>host.copiedTabs,set:value=>host.copiedTabs=value});
  c.tabProperties=function(node){return originalTabs.call(c,node);};
  c.properties();
  // Keep equation controls outside scaled paper and narrow question columns.
  const equationTools=editor.querySelector('.me-math-tools'),toolbar=editor.closest('.project-shell')?.querySelector('.document-toolbar');
  if(equationTools&&toolbar){equationTools.dataset.equationControl='';toolbar.append(equationTools);}
  c.undo=direction=>host.undo(direction??-1);
  // One structural command per history entry; changing between typing and deletion
  // also starts a new word-processing undo group.
  const transactions=new Map();for(const name of ['transact','splitParagraph','insertMath','insertDocument','listCommand']){const original=c[name];if(!original)continue;transactions.set(name,original);c[name]=function(...args){host.boundary?.();try{return original.apply(c,args);}finally{host.boundary?.();}};}
  let inputType;const beforeInput=e=>{if(e.inputType!==inputType){host.boundary?.();inputType=e.inputType;}};
  const boundary=()=>{inputType=null;host.boundary?.();};
  editor.addEventListener('beforeinput',beforeInput,true);editor.addEventListener('pointerdown',boundary,true);editor.addEventListener('paste',boundary,true);editor.addEventListener('cut',boundary,true);
  const select=()=>host.selection(captureEditorSelection(editor));
  const key=e=>{
    if(e.isComposing||e.target.closest('math-field,button,input,select'))return;
    const s=getSelection();if(!s?.isCollapsed||!c.surface.contains(s.anchorNode))return;
    const r=s.getRangeAt(0),prefix=document.createRange(),suffix=document.createRange();
    prefix.selectNodeContents(c.surface);prefix.setEnd(r.startContainer,r.startOffset);
    suffix.selectNodeContents(c.surface);suffix.setStart(r.endContainer,r.endOffset);
    if((e.key==='Backspace'&&!prefix.toString())||(e.key==='Delete'&&!suffix.toString())){e.preventDefault();return;}
    if((e.key==='ArrowLeft'&&!prefix.toString())||(e.key==='ArrowRight'&&!suffix.toString())){e.preventDefault();host.adjacent(e.key==='ArrowLeft'?-1:1);}
  };
  const composition=e=>host.composition(e.type==='compositionstart');
  editor.addEventListener('keydown',key,true);
  editor.addEventListener('keyup',select);editor.addEventListener('mouseup',select);editor.addEventListener('click',select);editor.addEventListener('focusin',select);
  editor.addEventListener('compositionstart',composition);editor.addEventListener('compositionend',composition);
  host.ready(editor);
  return ()=>{host.detached(captureEditorSelection(editor));if(equationTools&&toolbar)equationTools.remove();for(const [name,original]of transactions)c[name]=original;editor.removeEventListener('beforeinput',beforeInput,true);editor.removeEventListener('pointerdown',boundary,true);editor.removeEventListener('paste',boundary,true);editor.removeEventListener('cut',boundary,true);c.undo=originalUndo;c.tabProperties=originalTabs;if(originalCopiedTabs)Object.defineProperty(c,'copiedTabs',originalCopiedTabs);else delete c.copiedTabs;editor.removeEventListener('keydown',key,true);editor.removeEventListener('keyup',select);editor.removeEventListener('mouseup',select);editor.removeEventListener('click',select);editor.removeEventListener('focusin',select);editor.removeEventListener('compositionstart',composition);editor.removeEventListener('compositionend',composition);};
}

export function runEditorCommand(editor, name, value) {
  const c=editor?.documentController;if(!c)return;
  if(['bold','italic','underline'].includes(name))c.mark(name);
  else if(name==='math')c.insertMath();
  else if(name==='bullets'||name==='numbered')c.listCommand(name==='bullets'?'insertUnorderedList':'insertOrderedList');
  else if(name==='indent-list'||name==='outdent-list')c.listCommand(name==='indent-list'?'indent':'outdent');
  else if(name==='align')c.modify(n=>{n.align=value;});
  else if(name==='colour'){if(c.mathEditing?.applyStyle({color:value},'set'))return;c.restoreRange();document.execCommand('foreColor',false,value);c.surface.querySelectorAll('font[color]').forEach(n=>{n.dataset.colour=n.getAttribute('color');});c.capture();c.remember();c.emit();}
  else if(name==='native'){const button=[...c.toolbar.querySelectorAll('button')].find(b=>b.textContent===value);button?.click();}
  else if(name==='table'){const button=[...c.toolbar.querySelectorAll('button')].find(b=>b.textContent==='Table');button?.click();}
  else if(name==='image'){const button=[...c.toolbar.querySelectorAll('button')].find(b=>b.textContent==='Image');button?.click();}
  else if(name==='size')c.modify(n=>{n.fontSize=Number(value);});
  else if(name==='paragraph')c.modify(n=>{n.fontSize=null;n.align='left';});
  else if(name==='table-action'){const button=[...c.inspector.querySelectorAll('button')].find(b=>b.textContent===value);button?.click();}
}
