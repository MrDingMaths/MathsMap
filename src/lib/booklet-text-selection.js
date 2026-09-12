import {fromSource,normalizeDocument,renderDocument,toSource} from '../../public/libs/maths-editor/document-model.mjs';
import {fieldValue} from './booklet-document-controller.js';
import {updateProjectContent} from './editable-booklet-model.js';
const docFor=value=>value?.format?normalizeDocument(value):fromSource(typeof value==='string'?value:'');
// Equations and writable boxes are atomic while selecting prose; their own editor
// remains responsible for selections inside a mathematical expression.
const size=i=>i.type==='text'?i.text.length:1;
export function transformTextRange(value,start,end,command,argument) {
  const doc=docFor(value);let offset=0;
  const visit=node=>{
    if(!node||typeof node!=='object')return;
    if(node.inlines){node.inlines=node.inlines.flatMap(inline=>{
      const length=size(inline),a=Math.max(0,start-offset),b=Math.min(length,end-offset);offset+=length;
      if(a>=b)return command==='extract'?[]:[inline];
      const selected=inline.type==='text'?{...inline,text:inline.text.slice(a,b)}:{...inline};
      if(command==='delete')return inline.type==='text'?[{...inline,text:inline.text.slice(0,a)},{...inline,text:inline.text.slice(b)}].filter(i=>i.text):[];
      if(['bold','italic','underline'].includes(command))selected.marks=[...new Set([...(selected.marks??[]),command])];
      if(command==='colour')selected.colour=argument;
      if(command==='extract')return [selected];
      if(inline.type!=='text')return [selected];
      return [{...inline,text:inline.text.slice(0,a)},selected,{...inline,text:inline.text.slice(b)}].filter(i=>i.text);
    });return;}
    for(const value of Object.values(node))if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value);
  };
  visit(doc);return normalizeDocument(doc);
}
const atom=el=>el.nodeType===1&&el.matches('[data-math],.katex,[data-tab],[data-cloze],[data-type=inline-image],img,math-field');
function domLength(node){if(node.nodeType===3)return node.textContent.replaceAll('\u200b','').length;if(atom(node))return 1;if(node.nodeType===1&&node.matches('[aria-hidden=true],[data-native-handle],[data-layout-handle],.edit-badge,.me-toolbar,.me-properties,.me-math-tools,output'))return 0;return [...node.childNodes].reduce((n,c)=>n+domLength(c),0);}
function offsetAt(root,node,offset){let count=0,done=false;const scan=n=>{if(done)return;if(n===node){count+=n.nodeType===3?n.textContent.slice(0,offset).replaceAll('\u200b','').length:[...n.childNodes].slice(0,offset).reduce((v,c)=>v+domLength(c),0);done=true;return;}if(n.contains?.(node)){if(atom(n)){done=true;return;}for(const child of n.childNodes)scan(child);}else count+=domLength(n);};scan(root);return count;}
export function captureBookletTextRange(canvas,project){
  const s=window.getSelection();if(!s?.rangeCount||s.isCollapsed)return null;
  const range=s.getRangeAt(0);if(!canvas?.contains(range.startContainer)||!canvas.contains(range.endContainer))return null;
  const ranges=[],seen=new Set();
  for(const el of canvas.querySelectorAll('.editable-booklet-text')){
    const surface=el.querySelector('.me-content,.clickable');if(!surface||!range.intersectsNode(surface))continue;
    const anchor={rootId:el.dataset.editRoot,pointer:el.dataset.editPath},key=anchor.rootId+anchor.pointer;
    if(seen.has(key)||fieldValue(project,anchor)===undefined)continue;seen.add(key);
    const start=surface.contains(range.startContainer)?offsetAt(surface,range.startContainer,range.startOffset):0;
    const end=surface.contains(range.endContainer)?offsetAt(surface,range.endContainer,range.endOffset):domLength(surface);
    if(end>start)ranges.push({...anchor,start,end});
  }
  return ranges.length?{ranges,quote:s.toString()}:null;
}
export function applyBookletTextRange(project,selection,command,argument){let next=project;for(const range of selection.ranges)next=updateProjectContent(next,range.rootId,range.pointer,transformTextRange(fieldValue(next,range),range.start,range.end,command,argument));return next;}
export function copyBookletTextRange(project,selection){const docs=selection.ranges.map(r=>transformTextRange(fieldValue(project,r),r.start,r.end,'extract'));return {text:docs.map(toSource).join('\n\n'),html:docs.map(d=>renderDocument(d)).join('')};}
