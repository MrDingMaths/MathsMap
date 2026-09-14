import {fromSource,normalizeDocument,renderDocument,toSource} from '../../public/libs/maths-editor/document-model.mjs';
import {fieldValue} from './booklet-document-controller.js';
import {updateProjectContent} from './editable-booklet-model.js';
import {freshDocument} from '../../public/libs/maths-editor/document-model.mjs';
import {locateDocumentNode} from '../../public/libs/maths-editor/document-operations.mjs';
import {sliceInlines} from './booklet-document-fragments.js';
const docFor=value=>value?.format?normalizeDocument(value):fromSource(typeof value==='string'?value:'');
// Equations and writable boxes are atomic while selecting prose; their own editor
// remains responsible for selections inside a mathematical expression.
const size=i=>i.type==='text'?i.text.length:1;
export function documentTextLength(node){if(!node||typeof node!=='object')return 0;if(node.inlines)return node.inlines.reduce((n,i)=>n+size(i),0);return ['blocks','rows','slots','items','annotations'].reduce((sum,key)=>sum+(node[key]??[]).flat().reduce((n,child)=>n+documentTextLength(child),0),0);}
function fragmentOffset(el,doc){if(el.hasAttribute('data-fragment-start'))return Number(el.dataset.fragmentStart);const first=el.querySelector('.me-content [data-id],.clickable [data-id]')?.dataset.id;let offset=0;for(const block of doc.blocks){if(block.id===first)return offset;offset+=documentTextLength(block);}return 0;}
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
  const ranges=[],seen=new Map();let surfaces=0;
  for(const el of canvas.querySelectorAll('.editable-booklet-text')){
    const surface=el.querySelector('.me-content,.clickable');if(!surface||!range.intersectsNode(surface))continue;
    const anchor={rootId:el.dataset.editRoot,pointer:el.dataset.editPath},key=anchor.rootId+anchor.pointer;
    const value=fieldValue(project,anchor);if(value===undefined)continue;
    const base=fragmentOffset(el,docFor(value));
    const start=base+(surface.contains(range.startContainer)?offsetAt(surface,range.startContainer,range.startOffset):0);
    const end=base+(surface.contains(range.endContainer)?offsetAt(surface,range.endContainer,range.endOffset):domLength(surface));
    surfaces++;if(end>start){if(seen.has(key)){const previous=seen.get(key);previous.start=Math.min(previous.start,start);previous.end=Math.max(previous.end,end);}else{const entry={...anchor,start,end};ranges.push(entry);seen.set(key,entry);}}
  }
  return ranges.length?{ranges,crossSurface:surfaces>1,quote:s.toString(),direction:s.anchorNode===range.startContainer&&s.anchorOffset===range.startOffset?'forward':'backward'}:null;
}
export function applyBookletTextRange(project,selection,command,argument){let next=project;for(const range of selection.ranges)next=updateProjectContent(next,range.rootId,range.pointer,transformTextRange(fieldValue(next,range),range.start,range.end,command,argument));return next;}
export function replaceBookletTextRange(project,selection,inserted){
  let next=applyBookletTextRange(project,selection,'delete');const first=selection.ranges[0],doc=docFor(fieldValue(next,first)),addition=freshDocument(inserted);let remaining=first.start,done=false;
  const visit=nodes=>{for(let index=0;index<nodes.length&&!done;index++){const node=nodes[index];if(node.type==='paragraph'){
    const length=documentTextLength(node);if(remaining>length){remaining-=length;continue;}
    const left=sliceInlines(node.inlines,0,remaining),right=sliceInlines(node.inlines,remaining,length),blocks=addition.blocks;
    if(blocks.length===1&&blocks[0].type==='paragraph')node.inlines=[...left,...blocks[0].inlines,...right];
    else{const replacement=[];if(left.length)replacement.push({...node,inlines:left});replacement.push(...blocks);if(right.length)replacement.push({...node,id:crypto.randomUUID(),inlines:right});nodes.splice(index,1,...replacement);}done=true;
  }else{if(node.blocks)visit(node.blocks);for(const child of [...(node.rows??[]).flat(),...(node.slots??[]),...(node.items??[]),...(node.annotations??[])])if(child.blocks)visit(child.blocks);}}};visit(doc.blocks);
  if(!done)doc.blocks.push(...addition.blocks);return updateProjectContent(next,first.rootId,first.pointer,normalizeDocument(doc));
}
export function copyBookletTextRange(project,selection){const docs=selection.ranges.map(r=>transformTextRange(fieldValue(project,r),r.start,r.end,'extract')),document=normalizeDocument({blocks:docs.flatMap(d=>d.blocks)}),json=JSON.stringify(document);return {document,json,text:docs.map(toSource).join('\n\n'),html:'<div data-maths-document="'+json.replaceAll('&','&amp;').replaceAll('"','&quot;')+'">'+renderDocument(document)+'</div>'};}

/** Joins only adjacent ordinary paragraphs in the same native owner. */
export function joinDocumentParagraph(value,nodeId,direction){
 const document=docFor(value),at=locateDocumentNode(document,nodeId);if(at?.node.type!=='paragraph')return null;
 const other=at.nodes[at.index+direction];if(other?.type!=='paragraph')return null;
 const left=direction<0?other:at.node,right=direction<0?at.node:other,offset=documentTextLength(left);
 left.inlines=[...left.inlines,...right.inlines];at.nodes.splice(direction<0?at.index:at.index+1,1);
 return {document:normalizeDocument(document),bookmark:{start:{nodeId:left.id,offset},end:{nodeId:left.id,offset}}};
}

export function selectedBookletParagraphs(project,selection){
 return (selection?.ranges??[]).flatMap(range=>{const doc=docFor(fieldValue(project,range)),result=[];let offset=0;const walk=node=>{if(node.inlines){const length=documentTextLength(node);if(node.type==='paragraph'&&offset<range.end&&offset+length>range.start)result.push({...range,nodeId:node.id,node});offset+=length;return;}for(const key of ['blocks','rows','slots','items'])for(const child of (node[key]??[]).flat())walk(child);};walk(doc);return result;});
}
export function setBookletParagraphSpacing(project,targets,property,value){
 if(!['lineHeight','spaceBefore','spaceAfter'].includes(property))throw Error('Unknown paragraph spacing property');
 const fields=new Map();for(const target of targets){const key=target.rootId+target.pointer;let entry=fields.get(key);if(!entry){entry={...target,document:docFor(fieldValue(project,target))};fields.set(key,entry);}const at=locateDocumentNode(entry.document,target.nodeId);if(at){at.node[property]=value;const cell=at.ancestors.find(n=>n.type==='cell');if(cell&&property!=='lineHeight')cell.preserveParagraphSpacing=true;}}
 let next=project;for(const entry of fields.values())next=updateProjectContent(next,entry.rootId,entry.pointer,entry.document);return next;
}
