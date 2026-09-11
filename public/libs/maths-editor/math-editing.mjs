import {captureSelection} from './math-selection.mjs';
// MathLive interaction shared by structured prose, tables and question editors.
export function installMathEditing(editor) {
 const {host,surface}=editor, bar=document.createElement('div');bar.className='me-math-tools';bar.hidden=true;bar.setAttribute('role','toolbar');bar.setAttribute('aria-label','Equation tools');editor.inspector.after(bar);
 let active=null,dialog=null,selection=null;
 const setActive=mf=>{
  surface.querySelectorAll('.me-equation-selected').forEach(node=>node.classList.remove('me-equation-selected'));
  active=mf?.isConnected&&!host.readonly?mf:null;
  active?.closest('[data-math]')?.classList.add('me-equation-selected');
  bar.hidden=!active;
  if(!active)selection=null;
 };
 const field=()=>document.activeElement?.matches('math-field')&&surface.contains(document.activeElement)?document.activeElement:active?.isConnected?active:null;
 const commit=()=>{editor.capture();editor.remember();editor.emit();};
 const button=(label,action)=>editor.button(bar,label,action);
 const rememberSelection=()=>{const mf=field();if(mf&&document.activeElement===mf)selection=JSON.parse(JSON.stringify(mf.selection));};
 const rememberLocation=()=>{rememberSelection();if(editor.index>=0){const bookmark=captureSelection(editor);if(bookmark)editor.historySelections[editor.index]=bookmark;}};
 const restoreField=()=>{const mf=field();if(!mf||host.readonly)return null;const saved=selection;mf.focus({preventScroll:true});if(saved)mf.selection=JSON.parse(JSON.stringify(saved));rememberSelection();return mf;};
 const style=(value,operation='toggle')=>{const mf=restoreField();if(!mf)return false;mf.applyStyle(value,{operation});rememberSelection();commit();return true;};
 const selectBlock=target=>{const block=target?.closest?.('[data-type="annotated-equation"]');if(block&&!target.closest('[data-equation-label]')&&!host.readonly){setActive(null);block.classList.add('me-equation-selected');}};
 editor.mathEditing={field,activate:setActive,reset:()=>setActive(null),refresh:()=>setActive(field()),applyStyle:style,selectBlock};
 editor.formatMath=mark=>{const mf=restoreField();if(!mf)return false;if(mark==='underline'){mf.executeCommand(['insert','\\underline{#0}']);rememberSelection();commit();}else style(mark==='bold'?{variantStyle:'bold'}:{variantStyle:'italic'});return true;};
 const palette=()=>{const mf=field(),api=window.MathsEditor?.Palette;if(!mf||!api||host.readonly)return;rememberSelection();api.open(mf,{onInsert:latex=>{if(!mf.isConnected||host.readonly)return;restoreField();mf.executeCommand(['insert',latex]);rememberSelection();commit();},onClose:()=>{if(mf.isConnected&&!host.readonly)restoreField();}});};
 button('Symbols (Tab)',palette);button('Bold maths',()=>style({variantStyle:'bold'}));button('Italic maths',()=>style({variantStyle:'italic'}));
 button('Text before equation',()=>{const mf=field();if(mf&&!host.readonly)exit(mf,false);});
 button('Text after equation',()=>{const mf=field();if(mf&&!host.readonly)exit(mf,true);});
 button('Delete equation',()=>{const mf=field();if(mf&&!host.readonly)remove(mf);});
 const colour=document.createElement('input');colour.type='color';colour.value='#24282d';colour.setAttribute('aria-label','Selected maths colour');colour.oninput=()=>style({color:colour.value});bar.append(colour);
 button('Edit LaTeX',()=>{const mf=field();if(!mf||host.readonly)return;dialog?.remove();dialog=document.createElement('dialog');dialog.className='me-latex-dialog';dialog.setAttribute('aria-label','Edit equation LaTeX');const label=document.createElement('label');label.textContent='Equation LaTeX';const input=document.createElement('textarea');input.setAttribute('aria-label','Equation LaTeX');input.value=mf.getValue('latex');label.append(input);const preview=document.createElement('div');preview.className='me-latex-preview';const update=()=>{preview.innerHTML=window.MathLive.convertLatexToMarkup(input.value);};input.oninput=update;update();dialog.append(label,preview);editor.button(dialog,'Apply equation',()=>{if(mf.isConnected&&!host.readonly){mf.setValue(input.value,{silenceNotifications:true});commit();}dialog.close();});editor.button(dialog,'Cancel',()=>dialog.close());dialog.addEventListener('close',()=>{dialog.remove();dialog=null;if(mf.isConnected)mf.focus();});host.append(dialog);dialog.addEventListener('keydown',e=>e.stopPropagation());dialog.showModal();input.focus();});
 const hint=document.createElement('span');hint.textContent='Tab: symbols · Escape: text after · Shift+Escape: text before · Backspace/Delete removes an empty equation';bar.append(hint);
 const focus=e=>{
  if(e.target.matches?.('math-field')&&surface.contains(e.target)){setActive(e.target);rememberLocation();}
  else if(editor.inspector.contains(e.target)&&editor.selected?.type==='annotated-equation'){selectBlock(surface.querySelector(`[data-id="${CSS.escape(editor.selectedId)}"]`));rememberLocation();}
  else if(surface.contains(e.target)||!host.contains(e.target)&&!e.target.closest?.('.me-palette,[data-equation-control]'))setActive(null);
 };
 const pointer=e=>{
  rememberLocation();
  if(surface.contains(e.target)&&!e.target.closest?.('[data-math]')||!host.contains(e.target)&&!e.target.closest?.('.me-palette,[data-equation-control]'))setActive(null);
  selectBlock(e.target);
 };
 document.addEventListener('focusin',focus);document.addEventListener('pointerdown',pointer,true);
 surface.addEventListener('selection-change',rememberSelection);surface.addEventListener('keyup',rememberLocation);surface.addEventListener('mouseup',rememberLocation);
 // A real text-node position keeps native typing and whitespace deletion outside
 // MathLive, including when an equation is the first/last item in a paragraph.
 const place=(node,offset)=>{setActive(null);surface.focus();const range=document.createRange();range.setStart(node,offset);range.collapse(true);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);editor.saveRange();};
 const exit=(mf,after)=>{const island=mf.closest('[data-math]');if(!island||!surface.contains(island))return;let text=after?island.nextSibling:island.previousSibling;if(text?.nodeType!==3||!text.length){if(text?.matches?.('[data-math-caret]'))text=text.firstChild;else{const caret=document.createElement('span');caret.dataset.mathCaret='';text=document.createTextNode('\u200b');caret.append(text);after?island.after(caret):island.before(caret);}}place(text,after?text.textContent.startsWith('\u200b')?1:0:text.length);};
 const remove=mf=>{const island=mf.closest('[data-math]');if(!island||!surface.contains(island)||host.readonly)return;editor.capture();editor.remember();for(const sibling of [island.previousSibling,island.nextSibling])if(sibling?.matches?.('[data-math-caret]')&&!sibling.textContent.replaceAll('\u200b','')&&!sibling.querySelector('br,[data-math],[data-type]'))sibling.remove();const parent=island.parentNode,index=[...parent.childNodes].indexOf(island);island.remove();if(!parent.childNodes.length)parent.append(document.createElement('br'));place(parent,Math.min(index,parent.childNodes.length));commit();};
 const adjacent=forward=>{
  const s=getSelection();if(!s?.rangeCount||!s.isCollapsed)return;
  const r=s.getRangeAt(0);let n=r.startContainer,o=r.startOffset;if(!surface.contains(n))return;
  const element=n.nodeType===1?n:n.parentElement,paragraph=element.closest('p');if(!paragraph)return;
  const outside=node=>{while(node&&node!==paragraph){const sibling=forward?node.nextSibling:node.previousSibling;if(sibling)return sibling;node=node.parentNode;}};
  const visible=text=>n.parentElement?.closest('[data-math-caret]')?text.replaceAll('\u200b',''):text;
  let candidate;if(n.nodeType===3){if(visible(forward?n.textContent.slice(o):n.textContent.slice(0,o)))return;candidate=outside(n);}else candidate=n.childNodes[forward?o:o-1]??outside(n);
  // Cross empty text nodes / formatting wrappers, but never a paragraph, cell,
  // line break or actual whitespace: deleting a space must only delete the space.
  while(true){
   if(!candidate)return;
   if(candidate.nodeType===3){if(candidate.parentElement?.closest('[data-math-caret]')?candidate.textContent.replaceAll('\u200b',''):candidate.length)return;candidate=outside(candidate);continue;}
   if(candidate.nodeType!==1)return;
   if(candidate.matches('[data-math]'))return candidate.querySelector('math-field');
   if(!candidate.matches('b,strong,i,em,u,span')||candidate.contentEditable==='false')return;
   candidate=(forward?candidate.firstChild:candidate.lastChild)??outside(candidate);
  }
 };
 const key=e=>{if(host.readonly||e.isComposing||dialog)return;const mf=e.target.closest?.('math-field');if(mf){if(!surface.contains(mf))return;if(e.key==='Tab'){if(window.MathsEditor?.Palette?.isOpen())return;e.preventDefault();e.stopImmediatePropagation();palette();}else if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();exit(mf,!e.shiftKey);}else if(['Backspace','Delete'].includes(e.key)&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!mf.getValue('latex').trim()){e.preventDefault();e.stopImmediatePropagation();remove(mf);}return;}if(!surface.contains(e.target)||e.ctrlKey||e.metaKey||e.altKey)return;if(['ArrowLeft','ArrowRight','Backspace','Delete'].includes(e.key)&&!e.shiftKey){const forward=['ArrowRight','Delete'].includes(e.key),next=adjacent(forward);if(next){e.preventDefault();e.stopImmediatePropagation();if(['Backspace','Delete'].includes(e.key))remove(next);else{next.focus();queueMicrotask(()=>{next.position=forward?0:-1;});}}}else if(e.key==='Tab'&&!e.shiftKey&&!editor.leaveWithTab&&!editor.selected?.tabStops?.length&&!e.target.closest('td,th')&&!getSelection()?.anchorNode?.parentElement?.closest('li,td,th')){e.preventDefault();e.stopImmediatePropagation();editor.insertMath();}};
 const move=e=>{if(!e.target.matches?.('math-field')||!['forward','backward'].includes(e.detail?.direction))return;e.preventDefault();exit(e.target,e.detail.direction==='forward');};host.addEventListener('keydown',key,true);surface.addEventListener('move-out',move);
 return ()=>{host.removeEventListener('keydown',key,true);document.removeEventListener('focusin',focus);document.removeEventListener('pointerdown',pointer,true);surface.removeEventListener('selection-change',rememberSelection);surface.removeEventListener('keyup',rememberLocation);surface.removeEventListener('mouseup',rememberLocation);surface.removeEventListener('move-out',move);if(active&&window.MathsEditor?.Palette?.isOpen())window.MathsEditor.Palette.close('editor-closed');setActive(null);dialog?.remove();bar.remove();};
}
