import {documentLayoutTools} from './document-layout-tools.mjs';
import {locateDocumentNode,removeDocumentNode} from './document-operations.mjs';
import {standardBookletContent} from './booklet-palette.mjs';
import {captureSelection,restoreSelection,patchMathValues} from './math-selection.mjs';
import {mountEquationAnnotations} from './annotated-equation.mjs';
import {installMathEditing} from './math-editing.mjs';
import {equationControls} from './equation-controls.mjs';
import { BOOKLET_HOUSE_STYLE } from './house-style.mjs';
import {layoutControls} from './document-controls.mjs';
import {mountTabs} from './tab-layout.mjs';
import {tableGrid,mergeCells,splitCell,editTrack,trackWidths,setColumnWidth,moveBoundary,unresolvedAnnotations} from './table-model.mjs';
import {exportSource,freshDocument,renderInlineImage,mountImageFeedback} from './document-model.mjs';
import { mountTableAnnotations } from './table-annotations.mjs';
import { copy, uid, paragraph, normalizeDocument, fromSource, toSource, renderDocument, visitDocument, template } from './document-model.mjs';

// Document transactions own history across prose, MathLive, tables and assets.
export class DocumentEditor {
  constructor(host, initial = '') {
    this.host = host; this.doc = normalizeDocument(typeof initial === 'string' ? fromSource(initial) : initial);
    this.history = []; this.historySelections = []; this.index = -1; this.selectedId = this.doc.blocks[0]?.id; this.range = null;
    host.replaceChildren(); host.classList.add('me-document-editor');
    this.toolbar = document.createElement('div'); this.toolbar.className = 'me-toolbar'; this.toolbar.setAttribute('role','toolbar'); this.toolbar.setAttribute('aria-label','Document formatting');
    this.surface = document.createElement('div'); this.surface.className = 'me-content editor-surface'; this.surface.contentEditable = String(!host.readonly); this.surface.setAttribute('role','textbox'); this.surface.setAttribute('aria-label','Document content'); this.surface.setAttribute('aria-multiline','true');
    this.inspector = document.createElement('div'); this.inspector.className = 'me-properties';
    this.message = document.createElement('output'); this.message.setAttribute('aria-live','polite');
    host.append(this.toolbar,this.inspector,this.surface,this.message);
    this.buildToolbar(); this.installLayoutEvents(); this.render(); this.remember();
    this.destroyMathEditing=installMathEditing(this);
    this.surface.addEventListener('beforeinput',e=>{if(!this.host.readonly&&e.target.matches?.('math-field')){this.capture();this.remember();}});
    this.surface.addEventListener('beforeinput',e=>{if(e.inputType==='insertParagraph'&&!e.isComposing&&!this.host.readonly&&this.splitParagraph())e.preventDefault();});
    this.surface.addEventListener('input', () => { try { this.capture(); this.styleLists(); this.installObjectHandles(); this.remember(); this.emit(); } catch(e) { this.message.textContent=e.message; } });
    this.surface.addEventListener('keydown',e=>{const image=e.target.closest?.('[data-type=inline-image]');if(image&&['Enter',' '].includes(e.key)){e.preventDefault();this.select(image);this.inspector.querySelector('input')?.focus();}if(image&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const r=document.createRange();e.key==='ArrowLeft'?r.setStartBefore(image):r.setStartAfter(image);r.collapse(true);const s=getSelection();s.removeAllRanges();s.addRange(r);this.surface.focus();this.saveRange();}});
    this.surface.addEventListener('focusin', e => { this.select(e.target); });
    this.surface.addEventListener('click', e => { this.select(e.target); }, true);
    this.surface.addEventListener('keydown',e=>{
      if(this.host.readonly||e.isComposing||e.ctrlKey||e.metaKey||e.altKey||e.shiftKey||!['Backspace','Delete'].includes(e.key)||e.target.closest('math-field,button,input,select'))return;
      const selection=getSelection(),element=selection?.anchorNode?.nodeType===1?selection.anchorNode:selection?.anchorNode?.parentElement,p=element?.closest('p[data-id]');
      if(!selection?.isCollapsed||!p||!this.surface.contains(p))return;
      const copy=p.cloneNode(true);copy.querySelectorAll('[data-native-handle]').forEach(n=>n.remove());
      if(copy.textContent.replace(/[\s\u200b\ufeff]/g,'')||copy.querySelector('[data-math],[data-cloze],img,[data-tab]'))return;
      e.preventDefault();e.stopPropagation();this.deleteNode(p.dataset.id);
    });
    this.surface.addEventListener('keyup', () => this.saveRange());
    this.surface.addEventListener('mouseup', () => this.saveRange());
    this.surface.addEventListener('paste', e => this.paste(e));
    this.surface.addEventListener('copy', e => this.clipboard(e));
    this.surface.addEventListener('cut', e => { if(e.target.closest?.('math-field'))return;if (this.host.readonly) return; this.clipboard(e); const sel=window.getSelection(); if(sel?.rangeCount) { sel.getRangeAt(0).deleteContents(); this.capture(); this.remember(); this.emit(); } });
    host.addEventListener('keydown', e => {
      if(e.target.closest?.('.me-latex-dialog'))return;
      if ((e.ctrlKey || e.metaKey) && ['z','y'].includes(e.key.toLowerCase())) { e.preventDefault(); e.stopImmediatePropagation(); this.undo(e.key.toLowerCase() === 'y' || e.shiftKey ? 1 : -1); }
      else if ((e.ctrlKey || e.metaKey) && ['b','i','u'].includes(e.key.toLowerCase())) { e.preventDefault(); this.mark({b:'bold',i:'italic',u:'underline'}[e.key.toLowerCase()]); }
    }, true);
  }
  saveRange() { if(document.activeElement?.closest('[data-type="inline-image"]'))return;const s=window.getSelection(); if(s?.rangeCount && this.surface.contains(s.anchorNode)) {this.range=s.getRangeAt(0).cloneRange();const a=this.range.startContainer,atomic=(a.nodeType===1?a:a.parentElement)?.closest('[data-tab],[data-cloze],[data-native-handle]');if(atomic&&this.range.collapsed){this.range.setStartAfter(atomic);this.range.collapse(true);s.removeAllRanges();s.addRange(this.range.cloneRange());}} }
  restoreRange() { if(this.range && this.surface.contains(this.range.commonAncestorContainer)) { const s=window.getSelection(); s.removeAllRanges(); s.addRange(this.range); } }
  select(target) { if(target.closest?.('[data-resize-handles],[data-table-annotations]'))return;const n=target.closest?.('[data-id]'); const changed=n&&this.selectedId!==n.dataset.id;if(n) this.selectedId=n.dataset.id; if(n?.dataset.type!=='inline-image')this.saveRange(); if(changed)this.properties(); }
  get selected() { let found; visitDocument(this.doc,n=>{if(n.id===this.selectedId)found=n;}); return found; }
  capture() { this.surface.querySelectorAll('p:has([data-editor-placeholder])').forEach(p=>{if(p.textContent.replaceAll('\u200b','').trim()||p.querySelector('[data-math],[data-cloze],img'))p.querySelectorAll('[data-editor-placeholder]').forEach(n=>n.remove());});this.surface.querySelectorAll('[data-math-caret]').forEach(n=>n.toggleAttribute('data-empty-caret',!n.textContent.replaceAll('\u200b','')&&!n.querySelector('[data-math],br,img')));this.doc = this.read(this.surface); this.surface.querySelectorAll('[data-math-preview-host]').forEach(el=>{const mf=el.querySelector('math-field'),preview=el.querySelector('[data-math-preview]');if(preview&&this.host.renderMathPreview){const value=mf.getValue('latex');if(preview.dataset.latex!==value){preview.innerHTML=this.host.renderMathPreview(value,el.dataset.display==='true');preview.dataset.latex=value;}}}); if(this.host.dataset.houseStyleVersion||this.host.classList.contains('booklet-document-field')){const previous=this.doc,next=standardBookletContent(previous);if(JSON.stringify(previous)!==JSON.stringify(next)){this.doc=next;if(!patchMathValues(this,previous,next))this.render();}} }
  read(root, original = this.doc) {
    const originals=new Map(), seen=new Set(); visitDocument(original,n=>originals.set(n.id,n));
    const identity=el=>{let id=el.dataset.id;if(!id || seen.has(id))id=uid();seen.add(id);el.dataset.id=id;return id;};
    const inline = (node, marks=[], colour=null) => {
      if(node.nodeType===3) {const text=node.parentElement?.closest('[data-math-caret]')?node.textContent.replaceAll('\u200b',''):node.textContent;return text?[{type:'text',text,marks,...(colour?{colour}:{})}]:[];}
      if(node.nodeType!==1 || node.hasAttribute('data-native-handle')) return [];
      if(node.getAttribute('aria-hidden')==='true')return [];
      colour=node.dataset.colour??colour;
      if(node.matches('[data-type=inline-image],img')) {const img=node.matches('img')?node:node.querySelector('img');let data={};try{data=JSON.parse(node.dataset.image??'{}');}catch{}return [{...data,...copy(originals.get(node.dataset.id)??{}),id:identity(node),type:'inline-image',src:img?.getAttribute('src')??'',alt:img?.alt??'',width:data.width??Math.min(80,(img?.width||76)*25.4/96),aspectRatio:data.aspectRatio??((img?.width||1)/(img?.height||1))}];}
      if(node.matches('[data-math],math-field')) { const mf=node.matches('math-field')?node:node.querySelector('math-field'); return [{type:'math',latex:(!root.isConnected?mf?.dataset.clipboardLatex:undefined) ?? mf?.getValue?.('latex') ?? mf?.textContent ?? '',display:node.dataset.display==='true',...(colour?{colour}:{})}]; }
      if(node.hasAttribute('data-tab'))return [{type:'tab'}];
      if(node.hasAttribute('data-cloze')) return [{type:'cloze',answer:node.dataset.cloze,width:Number(node.dataset.width),lines:Number(node.dataset.lines)||1,expectedResponse:node.dataset.expectedResponse,reviewStatus:node.dataset.reviewStatus}];
      if(node.hasAttribute('data-image-pending'))return [];
      if(['SCRIPT','STYLE','IFRAME','OBJECT'].includes(node.tagName))return [];
      if(node.hasAttribute('data-editor-placeholder'))return [];
      if(node.tagName==='BR') return [{type:'break'}];
      const m={STRONG:'bold',B:'bold',EM:'italic',I:'italic',U:'underline'}[node.tagName];
      return [...node.childNodes].flatMap(n=>inline(n,m?[...new Set([...marks,m])]:marks,colour));
    };
    const children = el => [...el.childNodes].flatMap(n=>block(n));
    const block = el => {
      if(el.nodeType===3) return el.textContent ? [paragraph(inline(el))] : [];
      if(el.nodeType!==1 || el.getAttribute('aria-hidden')==='true' || ['SCRIPT','STYLE','IFRAME','OBJECT'].includes(el.tagName)) return [];
      const old=copy(originals.get(el.dataset.id) ?? {}), id=identity(el);
      if(el.hasAttribute('data-table-wrap')||el.hasAttribute('data-object-wrap')) return children(el);
      if(el.hasAttribute('data-inline-fragment'))return [paragraph([...el.childNodes].flatMap(n=>inline(n)))];
      if(el.dataset.type==='inline-image')return [paragraph(inline(el))];
      if(el.hasAttribute('data-native-handle'))return [];
      if(el.hasAttribute('data-resize-handles')||el.hasAttribute('data-image-pending'))return [];
      if(el.hasAttribute('data-annotation-diagnostics'))return [];
      if(el.hasAttribute('data-table-annotations')) return [];
      if(el.matches('p,div')&&el.querySelector(':scope > ul,:scope > ol'))return children(el);
      if(el.matches('ul,ol'))for(const nested of el.querySelectorAll(':scope > ul,:scope > ol')){let owner=nested.previousElementSibling;if(owner?.tagName!=='LI'){owner=document.createElement('li');nested.before(owner);}owner.append(nested);}
      if(el.tagName==='TABLE') return [{...old,id,type:'table',rows:[...el.rows].map(r=>[...r.cells].map(c=>({...copy(originals.get(c.dataset.id)??{}),id:identity(c),type:'cell',header:c.tagName==='TH',colspan:c.colSpan,rowspan:c.rowSpan,blocks:children(c.querySelector('[data-cell-content]')??c)})))}];
      if(el.matches('ul,ol'))return [{...old,id,type:'list',ordered:el.tagName==='OL',start:Number(el.getAttribute('start')??1),items:[...el.children].filter(c=>c.tagName==='LI').map(li=>{
        const item={id:identity(li),type:'list-item',...(li.hasAttribute('value')?{value:Number(li.getAttribute('value'))}:{}),blocks:[]};let run=[],runIndex=0;
        const flush=()=>{if(run.length){const key='paragraphId'+runIndex++;let pid=li.dataset[key];if(!pid||seen.has(pid))pid=uid();seen.add(pid);li.dataset[key]=pid;item.blocks.push({...paragraph(run),id:pid,spaceAfter:0});run=[];}};
        for(const child of li.childNodes){if(child.nodeType===1&&child.matches('p,div,ul,ol,table')){flush();item.blocks.push(...block(child));}else run.push(...inline(child));}
        flush();if(!item.blocks.length)item.blocks.push({...paragraph(),spaceAfter:0});return item;
      })}];
      if(el.dataset.type==='image' || el.tagName==='IMG') { const img=el.tagName==='IMG'?el:el.querySelector('img'); return [{...old,id,type:'image',src:img?.getAttribute('src') ?? '',alt:img?.alt ?? '',caption:el.querySelector('figcaption')?.textContent ?? old.caption ?? ''}]; }
      if(el.dataset.type==='annotated-equation')return [{...old,id,annotations:(old.annotations??[]).map(a=>({...a,blocks:children(el.querySelector('[data-equation-label="'+CSS.escape(a.id)+'"]'))}))}];
      if(el.dataset.type==='spacer') return [old];
      if(el.dataset.type==='layout') return [{...old,id,type:'layout',slots:[...el.querySelectorAll(':scope > div > [data-slot]')].map(s=>({...old.slots?.find(slot=>slot.id===s.dataset.slot),id:s.dataset.slot,blocks:children(s.querySelector('[data-card-face]')??s)}))}];
      return [{...old,id,type:'paragraph',...(el.dataset.preserveEmpty?{preserveEmpty:true}:{}),...(el.dataset.tabStops?{tabStops:JSON.parse(el.dataset.tabStops)}:{}),inlines:[...el.childNodes].flatMap(n=>inline(n))}];
    };
    return normalizeDocument({blocks:children(root)});
  }
  render(bookmark=captureSelection(this)) { if(this.host.dataset.houseStyleVersion||this.host.classList.contains('booklet-document-field'))this.doc=standardBookletContent(this.doc);this.mathEditing?.reset(); this.rendering=true;try{ this.range=null;this.imageFeedback?.destroy();this.annotationObserver?.destroy(); this.equationObserver?.destroy();this.surface.innerHTML=renderDocument(this.doc,{editable:true,...(this.host.renderMathPreview?{math:this.host.renderMathPreview,editableMathPreview:true}:{}),annotationMath:latex=>MathLive.convertLatexToMarkup(latex)});this.equationObserver=mountEquationAnnotations(this.surface);this.annotationObserver=mountTableAnnotations(this.surface,{onselect:(tableId,annotationId)=>{this.selectedId=tableId;this.annotationId=annotationId;this.properties();}});this.tabsObserver?.destroy();this.tabsObserver=mountTabs(this.surface); this.imageFeedback=mountImageFeedback(this.surface);this.updateReadonly(); this.properties();this.installBoundaries();this.installObjectHandles();}finally{this.rendering=false;} restoreSelection(this,bookmark); }
  updateReadonly() { this.surface.querySelectorAll('[data-resize-handles]').forEach(e=>e.remove());this.surface.contentEditable=String(!this.host.readonly);this.surface.querySelectorAll('[data-slot],[data-equation-label]').forEach(s=>s.contentEditable=String(!this.host.readonly));this.surface.querySelectorAll('math-field').forEach(m=>m.readOnly=this.host.readonly);this.toolbar.querySelectorAll('button,input').forEach(b=>b.disabled=this.host.readonly);this.properties();this.installBoundaries();this.mathEditing?.refresh(); }
  remember() { const value=JSON.stringify(this.doc),bookmark=captureSelection(this); if(this.history[this.index]===value){if(bookmark)this.historySelections[this.index]=bookmark;return;} this.history=this.history.slice(0,this.index+1);this.historySelections=this.historySelections.slice(0,this.index+1); this.history.push(value);this.historySelections.push(bookmark); if(this.history.length>200){this.history.shift();this.historySelections.shift();} this.index=this.history.length-1; }
  emit() { this.host.dispatchEvent(new CustomEvent('document-change',{bubbles:true,detail:{document:copy(this.doc),source:toSource(this.doc),losses:exportSource(this.doc).losses,layout:this.layoutChange===true}})); }
  set(value) { this.surface.querySelectorAll('[data-image-pending]').forEach(e=>e.remove());this.doc=normalizeDocument(value); this.selectedId=this.doc.blocks[0]?.id; this.render(null); this.history=[]; this.historySelections=[]; this.index=-1; this.remember(); }
  undo(direction=-1) { if(this.host.readonly)return;this.finishEquationEdit?.();if(this.mathEditing?.field()){this.capture();this.remember();} const index=this.index+direction; if(index<0 || index>=this.history.length)return; const present=captureSelection(this);if(present)this.historySelections[this.index]=present;this.index=index; const previous=this.doc;this.doc=JSON.parse(this.history[index]);const bookmark=this.historySelections[index]??present;if(patchMathValues(this,previous,this.doc))restoreSelection(this,bookmark);else this.render(bookmark); this.emit(); }
  transact(fn) { if(this.host.readonly)return;this.finishEquationEdit?.(); try { this.capture(); const next=copy(this.doc); fn(next); this.doc=normalizeDocument(next); this.render(); this.remember(); this.emit(); this.message.textContent=''; } catch(e) {this.message.textContent=e.message;} }
  modify(fn) { if(this.host.readonly)return;if(this.selected?.type==='inline-image'){this.capture();fn(this.selected);this.doc=normalizeDocument(this.doc);this.patchLayout();this.remember();this.emit();return;}this.transact(doc=>visitDocument(doc,n=>{if(n.id===this.selectedId)fn(n);})); }
  splitParagraph(){
    const selection=getSelection();if(!selection?.rangeCount)return false;
    const range=selection.getRangeAt(0),element=range.startContainer.nodeType===1?range.startContainer:range.startContainer.parentElement,p=element.closest('p');
    if(!p&&range.collapsed&&this.surface.contains(element)&&!element.closest('math-field,li,[data-native-handle]')){
      const blank=document.createElement('p');blank.dataset.id=uid();blank.dataset.preserveEmpty='true';const br=document.createElement('br');br.dataset.editorPlaceholder='';blank.append(br);range.insertNode(blank);this.capture();this.render(null);const target=this.surface.querySelector(`[data-id="${CSS.escape(blank.dataset.id)}"]`);if(target){this.surface.focus();const caret=document.createRange();caret.setStart(target,0);caret.collapse(true);selection.removeAllRanges();selection.addRange(caret);this.saveRange();}this.remember();this.emit();return true;
    }
    if(!p||!this.surface.contains(p)||p.closest('li')||!p.contains(range.endContainer))return false;
    this.capture();this.remember();const at=locateDocumentNode(this.doc,p.dataset.id);if(!at)return false;
    this.surface.querySelectorAll('math-field').forEach(m=>m.dataset.clipboardLatex=m.getValue('latex'));
    const before=document.createRange(),after=document.createRange();before.selectNodeContents(p);before.setEnd(range.startContainer,range.startOffset);after.selectNodeContents(p);after.setStart(range.endContainer,range.endOffset);
    const read=fragment=>{const root=document.createElement('div'),node=p.cloneNode(false);node.append(fragment);root.append(node);return this.read(root).blocks[0];};
    const left={...at.node,...read(before.cloneContents()),id:at.node.id,preserveEmpty:true},right={...at.node,...read(after.cloneContents()),id:uid(),preserveEmpty:true};
    at.nodes.splice(at.index,1,left,right);this.selectedId=right.id;this.doc=normalizeDocument(this.doc);this.render(null);
    const target=this.surface.querySelector(`[data-id="${CSS.escape(right.id)}"]`);this.surface.focus();const caret=document.createRange();caret.setStart(target,0);caret.collapse(true);selection.removeAllRanges();selection.addRange(caret);this.saveRange();this.remember();this.emit();return true;
  }
  deleteNode(id=this.selectedId){this.transact(doc=>{this.selectedId=removeDocumentNode(doc,id);});}
  insert(node) { this.transact(doc=>{ let at=locateDocumentNode(doc,this.selectedId);while(at&&at.nodes!==at.parent.blocks)at=locateDocumentNode(doc,at.parent.id);const nodes=at?.nodes??doc.blocks;nodes.splice(at?at.index+1:nodes.length,0,node); this.selectedId=node.id; }); }
  insertMath(latex='', display=false) {
    if(this.host.readonly)return; this.restoreRange();
    const island=document.createElement('span'); island.dataset.math='true'; island.dataset.display=String(display); if(display)island.style.display='block'; island.contentEditable='false';
    const mf=document.createElement('math-field'); mf.value=latex; island.append(mf);
    const sel=window.getSelection();
    if(sel?.rangeCount && this.surface.contains(sel.anchorNode)) { const range=sel.getRangeAt(0); range.deleteContents(); range.insertNode(island); }
    else { const p=this.surface.querySelector('p') ?? this.surface.appendChild(document.createElement('p')); p.append(island); }
    island.insertAdjacentHTML('beforebegin','<span data-math-caret>\u200b</span>');
    island.insertAdjacentHTML('afterend','<span data-math-caret>\u200b</span>');
    const index=[...this.surface.querySelectorAll('math-field')].indexOf(mf);
    this.capture();this.render(null);const current=this.surface.querySelectorAll('math-field')[index];current?.focus({preventScroll:true});this.mathEditing?.activate(current);this.remember();this.emit();return current;
  }
  mark(mark) { if(this.host.readonly)return; if(this.formatMath?.(mark))return; this.restoreRange(); const sel=window.getSelection(); if(!sel?.rangeCount || !this.surface.contains(sel.anchorNode) || sel.isCollapsed)return;
    document.execCommand(mark, false); this.saveRange(); this.capture(); this.remember(); this.emit(); }
  styleLists(){
    this.surface.querySelectorAll('ul,ol').forEach(list=>{let node;visitDocument(this.doc,n=>{if(n.id===list.dataset.id)node=n;});Object.assign(list.style,{paddingLeft:(node?.indent??7)+'mm',margin:'0 0 2mm',listStylePosition:'outside',listStyleType:list.tagName==='OL'?'decimal':'disc'});});
    this.surface.querySelectorAll('li').forEach(li=>Object.assign(li.style,{display:'list-item',margin:'0 0 1mm',padding:'0'}));
  }
  listCommand(command='insertUnorderedList'){
    if(this.host.readonly)return;this.restoreRange();
    const selection=getSelection(),element=selection?.anchorNode?.nodeType===1?selection.anchorNode:selection?.anchorNode?.parentElement;
    if(!element||!this.surface.contains(element))return;
    if(!['insertUnorderedList','insertOrderedList'].includes(command)&&!element.closest('li'))return;
    const originalTargetId=!['insertUnorderedList','insertOrderedList'].includes(command)?element.closest('p')?.dataset.id??element.closest('li')?.querySelector(':scope > p')?.dataset.id??element.closest('li')?.dataset.paragraphId0:null;
    if(command==='indent'){
      const item=element.closest('li'),previous=item?.previousElementSibling;if(previous?.tagName!=='LI')return;
      let nested=previous.querySelector(':scope > ul,:scope > ol,:scope > [data-object-wrap] > ul,:scope > [data-object-wrap] > ol');if(!nested){nested=document.createElement(item.parentElement.tagName);previous.append(nested);}nested.append(item);
    }else if(command==='outdent'&&element.closest('li')?.parentElement.closest('li')){
      const item=element.closest('li'),list=item.parentElement,parent=list.closest('li');
      if(item.nextElementSibling){const trailing=document.createElement(list.tagName);while(item.nextElementSibling)trailing.append(item.nextElementSibling);item.append(trailing);}
      parent.after(item);if(!list.children.length)list.remove();
    }else document.execCommand(command==='outdent'?(element.closest('li').parentElement.tagName==='OL'?'insertOrderedList':'insertUnorderedList'):command,false);
    this.capture();
    const anchor=getSelection()?.anchorNode,owner=(anchor?.nodeType===1?anchor:anchor?.parentElement),targetId=originalTargetId??owner?.closest('li')?.dataset.paragraphId0??owner?.closest('p')?.dataset.id;
    this.selectedId=targetId??this.doc.blocks[0]?.id;this.render();const target=targetId?this.surface.querySelector(`[data-id="${CSS.escape(targetId)}"]`):this.surface.querySelector('p');
    if(target){this.surface.focus();const range=document.createRange();range.selectNodeContents(target);range.collapse(false);getSelection().removeAllRanges();getSelection().addRange(range);this.saveRange();}
    this.remember();this.emit();
  }
  clipboard(e) {
    // MathLive owns selection inside its shadow tree.
    if(e.target.closest?.('math-field'))return;
    const s=window.getSelection(); if(!s?.rangeCount || s.isCollapsed)return;
    e.preventDefault();this.surface.querySelectorAll('math-field').forEach(m=>m.dataset.clipboardLatex=m.getValue('latex'));
    const root=document.createElement('div'),range=s.getRangeAt(0);root.append(range.cloneContents());
    let ancestor=range.commonAncestorContainer.nodeType===1?range.commonAncestorContainer:range.commonAncestorContainer.parentElement;
    while(ancestor && ancestor!==this.surface){if(ancestor.hasAttribute('data-math-caret')||['B','STRONG','I','EM','U','LI','UL','OL'].includes(ancestor.tagName)){const mark=ancestor.cloneNode(false);mark.append(...root.childNodes);root.append(mark);}ancestor=ancestor.parentElement;}
    if(!root.querySelector('p,table,section,figure')&&range.commonAncestorContainer!==this.surface){const p=document.createElement('p');p.append(...root.childNodes);root.append(p);}
    const data=this.read(root); e.clipboardData.setData('application/x-maths-editor+json',JSON.stringify(data)); e.clipboardData.setData('text/plain',toSource(data));e.clipboardData.setData('text/html',`<div data-maths-document="${JSON.stringify(data).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">${renderDocument(data)}</div>`);if(exportSource(data).losses.length)this.message.textContent='Plain text is a lossy copy; use rich paste or structured JSON to retain assets and layout.';
  }
  paste(e) {
    if(e.target.closest?.('math-field'))return;
    e.preventDefault(); if(this.host.readonly)return;
    this.saveRange();const data=e.clipboardData, image=[...data.files].find(f=>/^image\/(png|jpeg|webp|gif)$/.test(f.type));
    if(image) { this.addImage(image); return; }
    try {
      const rich=data.getData('application/x-maths-editor+json');
      let doc;if(rich)doc=normalizeDocument(JSON.parse(rich));else if(data.getData('text/html')){const root=new DOMParser().parseFromString(data.getData('text/html'),'text/html').body;const encoded=root.querySelector('[data-maths-document]')?.dataset.mathsDocument;doc=encoded?normalizeDocument(JSON.parse(encoded)):this.read(root);}else doc=fromSource(data.getData('text/plain'));
      doc=freshDocument(doc);
      this.insertDocument(doc);
    } catch(error) { this.message.textContent=error.message; }
  }
  insertDocument(doc) {
    this.restoreRange();const wrapper=document.createElement('div');wrapper.innerHTML=renderDocument(doc,{editable:true,annotationMath:latex=>MathLive.convertLatexToMarkup(latex)});
    const selection=window.getSelection(), range=selection?.rangeCount&&this.surface.contains(selection.anchorNode)?selection.getRangeAt(0):null;
    const element=range?.startContainer.nodeType===1?range.startContainer:range?.startContainer.parentElement;
    const p=element?.closest('p');
    if(range && p && this.surface.contains(p) && p.contains(range.endContainer)) {
      range.deleteContents();
      if(doc.blocks.length===1 && doc.blocks[0].type==='paragraph') {
        const fragment=document.createDocumentFragment();fragment.append(...wrapper.firstElementChild.childNodes);const last=fragment.lastChild;range.insertNode(fragment);if(last){if(last.matches?.('[data-math-caret]')&&last.firstChild)range.setStart(last.firstChild,last.firstChild.length);else range.setStartAfter(last);range.collapse(true);selection.removeAllRanges();selection.addRange(range);}
      } else {
        const tail=range.cloneRange();tail.setEnd(p,p.childNodes.length);const after=p.cloneNode(false);after.dataset.id=uid();after.append(tail.extractContents());
        p.after(...wrapper.childNodes,after);
      }
    } else { if(range)range.deleteContents();const anchor=element?.closest('[data-type]');if(anchor && anchor.parentElement===this.surface)anchor.after(...wrapper.childNodes);else this.surface.append(...wrapper.childNodes); }
    this.doc=this.read(this.surface,{blocks:[...this.doc.blocks,...doc.blocks]});this.saveRange();this.imageFeedback?.destroy();this.imageFeedback=mountImageFeedback(this.surface);this.annotationObserver?.update();this.equationObserver?.update();this.remember();this.emit();
  }
  async addImage(file,block=false) {
    if(this.host.readonly)return;
    if(file.size>5*1024*1024){this.message.textContent='Choose an image smaller than 5 MB.';return;}
    if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type)){this.message.textContent='Choose PNG, JPEG, WebP or GIF.';return;}
    this.restoreRange();const bookmark=this.range?.cloneRange();
    const pending=document.createElement('span');pending.dataset.imagePending='';pending.contentEditable='false';pending.textContent='Loading image…';
    if(bookmark&&this.surface.contains(bookmark.commonAncestorContainer)){const at=bookmark.cloneRange();at.collapse(true);at.insertNode(pending);}
    this.message.textContent='Loading image…';
    try {
      const src=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('Image file could not be read.'));r.readAsDataURL(file);});
      const img=new Image();img.src=src;await img.decode();
      if(!this.host.isConnected||this.host.readonly||(bookmark&&!pending.isConnected))return;
      if(pending.isConnected){bookmark.setStartAfter(pending);this.range=bookmark;}
      const node={id:uid(),type:block?'image':'inline-image',src,alt:file.name,width:block?80:20,aspectRatio:img.naturalWidth/img.naturalHeight};
      if(block)this.insert(node);else this.insertDocument(normalizeDocument({blocks:[paragraph([node])]}));
      this.selectedId=node.id;this.properties();this.message.textContent='Image inserted. Add descriptive alternative text.';
    }catch(error){if(this.host.isConnected)this.message.textContent='This image could not be decoded. '+error.message;}
    finally{pending.remove();}
  }
  button(parent,label,action) { const b=document.createElement('button'); b.type='button'; b.textContent=label; b.disabled=this.host.readonly; b.addEventListener('mousedown',e=>e.preventDefault()); b.onclick=action; parent.append(b); return b; }
  buildToolbar() {
    const b=(label,fn)=>this.button(this.toolbar,label,fn);
    b('Undo',()=>this.undo()); b('Redo',()=>this.undo(1)); ['bold','italic','underline'].forEach(m=>b(m[0].toUpperCase()+m.slice(1),()=>this.mark(m)));
    b('Bulleted list',()=>this.listCommand());b('Numbered list',()=>this.listCommand('insertOrderedList'));b('Indent list',()=>this.listCommand('indent'));b('Outdent list',()=>this.listCommand('outdent'));
    b('Insert tab',()=>this.insertTab());if(this.host.getAttribute('controls')!=='contextual')b('Replace selected dots with tab leader',()=>this.replaceDots());b('Math',()=>this.insertMath()); b('Display math',()=>this.insertMath('',true)); b('Paragraph',()=>this.insert({...paragraph(),preserveEmpty:true}));
    b('Table',()=>{const style=this.host.dataset.houseStyleVersion===BOOKLET_HOUSE_STYLE.version?BOOKLET_HOUSE_STYLE:null;this.insert({id:uid(),type:'table',...(style?{borderColour:style.colours.border,borderWidthMm:style.tables.borderMm,padding:style.tables.paddingMm,widthMm:60,widths:[30,30]}:{}),rows:Array.from({length:2},()=>Array.from({length:2},(_,i)=>({id:uid(),type:'cell',...(style&&i===0?{background:style.colours.tableLabel}:{}),blocks:[paragraph()]})))});});
    b('Image',()=>{this.saveRange();this.file.click();});b('Block figure',()=>{this.blockImage=true;this.file.click();}); this.file=document.createElement('input'); this.file.type='file'; this.file.accept='image/png,image/jpeg,image/webp,image/gif'; this.file.hidden=true; this.file.onchange=()=>{if(this.file.files[0])this.addImage(this.file.files[0],this.blockImage);this.blockImage=false;this.file.value='';}; this.toolbar.append(this.file);
    b('Annotated equation',()=>this.insert({id:uid(),type:'annotated-equation',latex:'y=mx+c',anchors:[],annotations:[]}));
    b('Working space',()=>this.insert({id:uid(),type:'spacer',height:15}));
    for(const arrangement of ['investigation','parallel','worked-rows','scaffold','cards','speech-bubble']) b(arrangement,()=>this.insert(template(arrangement)));
    this.contextualToolbar();
  }
  contextualToolbar() {
    if(this.host.getAttribute('controls')!=='contextual')return;
    const nodes=[...this.toolbar.children],format=document.createElement('details'),insert=document.createElement('details'),summary=document.createElement('summary'),items=document.createElement('div');
    format.className='me-format';format.open=false;const heading=document.createElement('summary');heading.textContent='Format';const formatItems=document.createElement('div');format.append(heading,formatItems);
    summary.textContent='Insert';insert.append(summary,items);insert.className='me-insert';
    for(const node of nodes){if(['Undo','Redo','Bold','Italic','Underline','Bulleted list','Numbered list','Indent list','Outdent list'].includes(node.textContent))formatItems.append(node);else items.append(node);}
    this.toolbar.append(format,insert);
    this.closeMenus=e=>{for(const menu of this.host.querySelectorAll('.me-toolbar > details[open],.me-properties > details[open]'))if(!menu.contains(e.target))menu.open=false;};
    document.addEventListener('pointerdown',this.closeMenus);
    this.menuEscape=e=>{if(e.key!=='Escape')return;const menu=this.host.querySelector('.me-toolbar > details[open],.me-properties > details[open]');if(menu){e.preventDefault();e.stopPropagation();menu.open=false;menu.querySelector('summary').focus();}};
    this.host.addEventListener('keydown',this.menuEscape);
  }
  contextualProperties(type) {
    if(this.host.getAttribute('controls')!=='contextual')return;
    const nodes=[...this.inspector.children],panel=document.createElement('div');
    panel.className='me-common-properties';
    const heading=document.createElement('strong');heading.className='me-properties-title';heading.textContent=(type==='inline-image'?'Image':type[0].toUpperCase()+type.slice(1))+' properties';
    panel.append(heading,...nodes);this.inspector.append(panel);
  }

  field(label,value,action,type='number',options=null) {
    const wrap=document.createElement('label'); wrap.textContent=label+' '; const input=document.createElement(options?'select':'input'); input.setAttribute('aria-label',label); input.disabled=this.host.readonly;
    if(options) options.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;input.append(o);}); else input.type=type;
    input.value=value??''; input.onchange=()=>action(type==='number'&&!options?Number(input.value):input.value); wrap.append(input); this.inspector.append(wrap);
  }
  properties() {
    this.propertiesOpen=this.inspector.querySelector('.me-selection-menu')?.open;this.finishEquationEdit?.();this.inspector.replaceChildren(); const n=this.selected; if(!n)return;
    const f=(label,key,type='number',options=null)=>this.field(label,n[key],v=>this.modify(node=>node[key]=v),type,options);
    if(n.type==='annotated-equation')this.equationProperties(n);
    if(n.type==='paragraph') { f('Font size (pt)','fontSize'); f('Align','align','text',['left','center','right','justify']); f('Before (mm)','spaceBefore'); f('After (mm)','spaceAfter'); f('Line spacing','lineHeight'); f('Indent (mm)','indent');this.tabProperties(n); }
    if(n.type==='inline-image'){this.liveField('Width (mm)',n.width,(doc,v)=>{if(!Number.isFinite(v)||v<.5||v>190)throw new Error('Image width must be between 0.5 and 190 mm.');visitDocument(doc,x=>{if(x.id===n.id)x.width=v;});});f('Vertical alignment','verticalAlign','text',['baseline','middle','top','bottom']);f('Alternative text','alt','text');}
    if(n.type==='image') {f('Space above image (mm)','spaceBefore');f('Width (mm)','width'); f('Placement','align','text',['left','center','right','inline','beside-left','beside-right']);f('Alternative text','alt','text');f('Caption','caption','text'); ['Top','Right','Bottom','Left'].forEach((label,i)=>this.field('Crop '+label+' (%)',n.crop[i],v=>this.modify(node=>node.crop[i]=v)));}
    if(n.type==='spacer') f('Height (mm)','height');
    if(n.type==='layout') {f('Title','title','text'); f('Arrangement','arrangement','text',['investigation','parallel','worked-rows','scaffold','cards','speech-bubble']);f('Columns','columns');if(n.arrangement==='speech-bubble')f('Tail','tail','text',['left','right','none']);this.layoutProperties(n);}
    let table; visitDocument(this.doc,t=>{if(t.type==='table' && (t.id===n.id || this.surface.querySelector(`[data-id="${CSS.escape(n.id)}"]`)?.closest('table')?.dataset.id===t.id)) table=t;});
    if(table) {
      const edit=fn=>this.transact(doc=>visitDocument(doc,t=>{if(t.id===table.id)fn(t);}));
      const selectedEl=this.surface.querySelector(`[data-id="${CSS.escape(n.id)}"]`),cellId=selectedEl?.closest('td,th')?.dataset.id;
      const map=tableGrid(table),logical=map.byId.get(cellId??n.id)??map.entries[0],cell=logical.cell,ri=logical.row,ci=table.rows[ri].indexOf(cell);
      this.field('Table margin before (mm)',table.marginBefore,v=>edit(t=>t.marginBefore=Number(v)));
      this.field('Table margin after (mm)',table.marginAfter,v=>edit(t=>t.marginAfter=Number(v)));
      this.tableStyleProperties(table,logical,edit);

      this.field('Table width (mm)',table.widthMm??80,v=>edit(t=>t.widthMm=Number(v)));
      this.field('Cell horizontal alignment',table.rows[ri][ci].align,v=>edit(t=>t.rows[ri][ci].align=v),'text',['left','center','right']);
      this.field('Cell vertical alignment',table.rows[ri][ci].verticalAlign,v=>edit(t=>t.rows[ri][ci].verticalAlign=v),'text',['top','middle','bottom']);
      this.field('Cell top padding (mm)',cell.paddingTop??table.padding,v=>edit(t=>t.rows[ri][ci].paddingTop=Number(v)));

      this.annotationProperties(table,logical,edit);
      this.field('Row height (mm)',table.rowHeights[ri]??10,v=>edit(t=>t.rowHeights[ri]=Number(v)));
      this.field('Annotations (JSON)',JSON.stringify(table.annotations),v=>edit(t=>t.annotations=JSON.parse(v)),'text');
      this.button(this.inspector,'Toggle cell bold',()=>edit(t=>t.rows[ri][ci].bold=!t.rows[ri][ci].bold));
      this.field('Cell rotation',table.rows[ri][ci].rotation,v=>edit(t=>t.rows[ri][ci].rotation=Number(v)),'text',['0','-90','90']);
      this.button(this.inspector,'Toggle cell border',()=>edit(t=>{const c=t.rows[ri][ci];c.border=!(c.border??t.border);}));
      this.button(this.inspector,'Add row',()=>edit(t=>editTrack(t,'row',logical.row+logical.rows)));
      this.button(this.inspector,'Remove row',()=>map.rows===1?this.deleteNode(table.id):edit(t=>editTrack(t,'row',logical.row,true)));
      this.button(this.inspector,'Add column',()=>edit(t=>{t.widthMm=this.tableTotal(t);editTrack(t,'column',logical.col+logical.cols,false,this.tableLimit(t));}));
      this.button(this.inspector,'Remove column',()=>map.columns===1?this.deleteNode(table.id):edit(t=>{t.widthMm=this.tableTotal(t);editTrack(t,'column',logical.col,true);}));
      this.button(this.inspector,'Merge right',()=>edit(t=>mergeCells(t,cell.id,'right')));
      this.button(this.inspector,'Merge down',()=>edit(t=>mergeCells(t,cell.id,'down')));
      this.button(this.inspector,'Split cell',()=>edit(t=>splitCell(t,cell.id)));
      this.button(this.inspector,table.border?'Hide borders':'Show borders',()=>edit(t=>t.border=!t.border));
      this.field('Cell padding (mm)',table.padding,v=>edit(t=>t.padding=v));
      const tracks=trackWidths(table,this.tableTotal(table)),columns=Array.from({length:logical.cols},(_,i)=>String(logical.col+i+1));
      let column=logical.col;
      this.field('Selected column',String(column+1),v=>{column=Number(v)-1;widthInput.value=trackWidths(table,this.tableTotal(table))[column].toFixed(2);},'text',columns);
      const widthInput=this.liveField('Column width (mm)',tracks[column].toFixed(2),(doc,v)=>{let t;visitDocument(doc,n=>{if(n.id===table.id)t=n;});setColumnWidth(t,column,v,this.tableTotal(t),this.tableLimit(t));});
      if(logical.cols>1){const hint=document.createElement('p');hint.textContent='Merged width is the sum of columns '+columns.join(', ')+'.';this.inspector.append(hint);}
      const unresolved=unresolvedAnnotations(table);if(unresolved.length){const warning=document.createElement('p');warning.setAttribute('role','status');warning.textContent='Unresolved annotation anchors: '+unresolved.map(a=>a.id).join(', ');this.inspector.append(warning);}

    }
    this.button(this.inspector,n.type==='paragraph'?'Delete paragraph':'Delete selected block',()=>this.deleteNode(n.id));
    this.contextualProperties(table?'table':n.type);
    this.host.dispatchEvent(new CustomEvent('document-selection'));
  }
  destroy(){this.destroyMathEditing?.();document.removeEventListener('pointerdown',this.closeMenus);this.host.removeEventListener('keydown',this.menuEscape);this.equationObserver?.destroy();this.surface.querySelectorAll('[data-image-pending]').forEach(e=>e.remove());this.annotationObserver?.destroy();this.tabsObserver?.destroy();this.imageFeedback?.destroy();}
  tableElement(t){return this.surface.querySelector(`table[data-id="${CSS.escape(t.id)}"]`);}
  tableTotal(t){let current;visitDocument(this.doc,n=>{if(n.id===t.id)current=n;});return current?.widthMm??((this.tableElement(t)?.getBoundingClientRect().width??302)*25.4/96);}
  tableLimit(t){return Math.min(190,(this.tableElement(t)?.parentElement.parentElement.getBoundingClientRect().width??718)*25.4/96);}
  patchLayout(){
    visitDocument(this.doc,n=>{
      if(n.type==='paragraph'){const el=this.surface.querySelector(`[data-id="${CSS.escape(n.id)}"]`);if(el)el.dataset.tabStops=JSON.stringify(n.tabStops??[]);}
      if(n.type==='inline-image'){const el=this.surface.querySelector(`[data-id="${CSS.escape(n.id)}"]`);if(el){el.style.width=n.width+'mm';el.style.aspectRatio=n.aspectRatio;el.style.verticalAlign=n.verticalAlign;el.dataset.image=JSON.stringify(n);el.querySelector('img').alt=n.alt;el.setAttribute('aria-label','Image: '+n.alt);}}
      if(n.type==='table'){const el=this.tableElement(n);if(!el)return;el.parentElement.style.width=n.widthMm?n.widthMm+'mm':'100%';const widths=trackWidths(n),total=widths.reduce((a,b)=>a+b,0);el.querySelectorAll(':scope > colgroup > col').forEach((c,i)=>c.style.width=widths[i]/total*100+'%');el.dataset.annotations=JSON.stringify(n.annotations);const handles=el.parentElement.querySelectorAll('[data-boundary]');let sum=0;handles.forEach((h,i)=>{sum+=widths[i];h.style.left=sum/total*100+'%';h.setAttribute('aria-valuenow',widths[i].toFixed(2));});}
    });this.annotationObserver?.update();this.tabsObserver?.update();
  }
  liveField(label,value,apply){
    const wrap=document.createElement('label');wrap.textContent=label+' ';const input=document.createElement('input');input.type='number';input.step='.1';input.value=value;input.setAttribute('aria-label',label);input.disabled=this.host.readonly;wrap.append(input);this.inspector.append(wrap);
    let before=null,valid=true;
    input.onfocus=()=>{this.capture();before=copy(this.doc);};
    input.oninput=()=>{try{before??=copy(this.doc);const next=copy(before);if(input.value==='')throw new Error('Enter a width in millimetres.');apply(next,Number(input.value));this.doc=normalizeDocument(next);this.patchLayout();this.layoutChange=true;this.emit();this.layoutChange=false;input.setAttribute('aria-invalid','false');this.message.textContent='';valid=true;}catch(e){valid=false;input.setAttribute('aria-invalid','true');this.message.textContent=e.message;}};
    const finish=cancel=>{if(!before)return;if(cancel||!valid){this.doc=before;this.patchLayout();this.emit();input.value=value;}else{this.remember();value=input.value;}before=null;};
    input.onblur=()=>finish(false);input.onkeydown=e=>{if(['Enter','Escape'].includes(e.key)){e.preventDefault();finish(e.key==='Escape');input.blur();}};return input;
  }
  installBoundaries(){
    this.surface.querySelectorAll('[data-resize-handles]').forEach(e=>e.remove());
    visitDocument(this.doc,t=>{if(t.type!=='table'||this.host.readonly)return;const table=this.tableElement(t);if(!table)return;
      const controls=document.createElement('div');controls.dataset.resizeHandles='';controls.contentEditable='false';table.parentElement.append(controls);
      const widths=trackWidths(t),total=widths.reduce((a,b)=>a+b,0);let sum=0;
      widths.slice(0,-1).forEach((w,i)=>{sum+=w;const handle=document.createElement('button');handle.type='button';handle.dataset.boundary=i;handle.className='me-column-handle';handle.style.left=sum/total*100+'%';handle.setAttribute('role','separator');handle.setAttribute('aria-orientation','vertical');handle.setAttribute('aria-label',`Resize boundary after column ${i+1}`);handle.setAttribute('aria-valuenow',w.toFixed(2));handle.setAttribute('aria-valuemin',Math.min(5,w));handle.setAttribute('aria-valuemax',total-Math.min(5,widths[i+1]));controls.append(handle);
        let start=null;
        const move=delta=>{this.doc=copy(start.doc);let current;visitDocument(this.doc,n=>{if(n.id===t.id)current=n;});moveBoundary(current,i,delta,start.total);this.patchLayout();this.layoutChange=true;this.emit();this.layoutChange=false;};
        const finish=cancel=>{if(!start)return;if(cancel){this.doc=start.doc;this.patchLayout();this.emit();}else this.remember();start=null;};
        handle.onpointerdown=e=>{e.preventDefault();this.capture();start={doc:copy(this.doc),x:e.clientX,total:this.tableTotal(t)};handle.setPointerCapture(e.pointerId);};
        handle.onpointermove=e=>{if(start)move((e.clientX-start.x)*25.4/96);};handle.onpointerup=()=>finish(false);handle.onpointercancel=()=>finish(true);
        handle.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();finish(true);}else if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();this.capture();start={doc:copy(this.doc),total:this.tableTotal(t)};move((e.key==='ArrowLeft'?-1:1)*(e.shiftKey?5:1));finish(false);}};
      });
    });
  }
}

Object.assign(DocumentEditor.prototype,layoutControls);

Object.assign(DocumentEditor.prototype,equationControls);

Object.assign(DocumentEditor.prototype,documentLayoutTools);
