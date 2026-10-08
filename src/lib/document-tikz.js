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
 const draw=document=>{
  for(const entry of documentTikzEntries(document)){
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
