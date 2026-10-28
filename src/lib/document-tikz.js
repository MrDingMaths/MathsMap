// Native document paragraphs can retain the same editable [tikz] source used
// by ordinary booklet text, including inside table cells.
import {splitInlineContent} from './inline-content.js';

export function documentTikzEntries(document){
 const entries=[];
 const visit=value=>{
  if(!value||typeof value!=='object')return;
  if(value.type==='paragraph'&&value.inlines?.length&&value.inlines.every(run=>run.type==='text')){
   const source=value.inlines.map(run=>run.text??'').join(''),parsed=splitInlineContent(source);
   const parts=parsed.parts.filter(part=>part.type==='tikz'||part.value.trim());
   if(!parsed.errors.length&&parts.length===1&&parts[0].type==='tikz'){
    const code=parts[0].value,width=code.match(/^% mathsmap-inline-width-mm ([\d.]+)\s*$/m);
    entries.push({id:value.id,code,widthMm:width?Math.max(5,Math.min(190,Number(width[1])||70)):70});
   }
  }
  for(const [key,child]of Object.entries(value))if(!['sourceReview','sourceLayoutEvidence','spec','provenance'].includes(key)){
   if(Array.isArray(child))child.forEach(visit);else if(child&&typeof child==='object')visit(child);
  }
 };
 visit(document);return entries;
}

export function mountDocumentTikz(node,document,{render,cancel}={}){
 let jobs=[];
 const clear=()=>{for(const job of jobs){cancel(job.host);if(job.paragraph.contains(job.host))job.paragraph.innerHTML=job.original;}jobs=[];};
 // The parameter is the document, or {document,...} when the caller's rendered
 // HTML also depends on other values: any change must redraw, because the
 // surrounding {@html} replaces the diagram hosts with source text.
 const docOf=value=>value?.document&&!value.blocks?value.document:value;
 const draw=value=>{
  for(const entry of documentTikzEntries(docOf(value))){
   const paragraph=[...node.querySelectorAll('[data-id]')].find(element=>element.dataset.id===entry.id);
   if(!paragraph)continue;
   const original=paragraph.innerHTML,host=paragraph.ownerDocument.createElement('div');
   host.className='tikz-wrap document-tikz';host.style.cssText=`width:${entry.widthMm}mm;max-width:100%;margin:0 auto;min-height:0;overflow:visible`;
   host.dataset.diagramId=entry.id;paragraph.replaceChildren(host);jobs.push({paragraph,host,original});
   render(host,entry.code,{eager:true});
  }
 };
 draw(document);
 return {update(document){clear();draw(document);},destroy(){clear();}};
}

const WIDTH_LINE=/^% mathsmap-inline-width-mm [\d.]+[^\S\n]*$/m;
// Writes the inline diagram width into the [tikz] source, which is where
// documentTikzEntries reads it: an existing width line is replaced in place.
export function setInlineTikzWidth(text,widthMm){
 const width=Math.round(Math.max(5,Math.min(190,Number(widthMm)||70))*10)/10,line='% mathsmap-inline-width-mm '+width;
 return String(text).replace(/\[tikz\]([\s\S]*?)\[\/tikz\]/,(_,code)=>'[tikz]'+(WIDTH_LINE.test(code)?code.replace(WIDTH_LINE,line):code.startsWith('\n')?'\n'+line+code:line+'\n'+code)+'[/tikz]');
}

// Finds the paragraph with this id and returns its single-[tikz] entry, if any.
export function inlineTikzParagraph(document,id){
 return documentTikzEntries(document).find(entry=>entry.id===id)??null;
}

// Inside the editor the surface is read back from the DOM, so the [tikz] source
// stays in the paragraph (hidden) and the drawing sits beside it as an
// aria-hidden, non-editable preview, which the editor's reader skips.
// "Edit code" shows the source for that paragraph until the editor closes.
export function mountEditorTikz(surface,getDocument,{render,cancel}){
 const showingCode=new Set(),hosts=new Set();
 const clear=()=>{for(const host of hosts){cancel(host.firstChild);const paragraph=host.parentElement,source=paragraph?.querySelector(':scope > [data-tikz-source]');host.remove();if(source)source.replaceWith(...source.childNodes);}hosts.clear();};
 const draw=()=>{
  clear();
  for(const entry of documentTikzEntries(getDocument())){
   if(showingCode.has(entry.id))continue;
   const paragraph=[...surface.querySelectorAll('[data-id]')].find(element=>element.dataset.id===entry.id);
   if(!paragraph||paragraph.closest('[data-tikz-preview]'))continue;
   const source=paragraph.ownerDocument.createElement('span');source.dataset.tikzSource='';source.style.display='none';source.append(...paragraph.childNodes);
   const host=paragraph.ownerDocument.createElement('span');host.dataset.tikzPreview='';host.setAttribute('aria-hidden','true');host.contentEditable='false';
   host.className='tikz-wrap document-tikz editor-tikz';host.dataset.diagramId=entry.id;host.style.cssText=`display:block;width:${entry.widthMm}mm;max-width:100%;margin:0 auto;min-height:0;overflow:visible;position:relative`;
   const drawing=paragraph.ownerDocument.createElement('span');drawing.style.display='block';
   const edit=paragraph.ownerDocument.createElement('button');edit.type='button';edit.className='editor-tikz-code';edit.textContent='Edit code';
   edit.onpointerdown=event=>{event.preventDefault();event.stopPropagation();};
   edit.onclick=event=>{event.preventDefault();event.stopPropagation();showingCode.add(entry.id);cancel(drawing);host.remove();hosts.delete(host);source.replaceWith(...source.childNodes);};
   host.append(drawing,edit);paragraph.replaceChildren(source,host);hosts.add(host);
   render(drawing,entry.code,{eager:true});
  }
 };
 draw();
 return {update:draw,destroy:clear};
}
