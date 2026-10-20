// Native tables and multiline TeX expose a baseline for the whole stack.
// Measure the opening line without changing cells, equations or writing space.
export function alignNativeTableLabel(element,enabled){
 let observer,label,offset=0;
 const clear=()=>{observer?.disconnect();observer=null;if(label)label.style.translate='';label=null;offset=0;};
 const measure=()=>{
  const body=label?.nextElementSibling;
  const paragraph=body?.querySelector('[data-table-wrap] tr:first-child :is(td,th) p');
  const firstMathRow=!paragraph&&body?.querySelector('.katex-html .mtable > span > .vlist-t > .vlist-r:first-child > .vlist > span:first-child');
  const opening=paragraph||firstMathRow;
  if(!opening||!label)return;
  const probe=()=>{const span=document.createElement('span');span.setAttribute('aria-hidden','true');span.style.cssText='display:inline-block;width:0;height:0;padding:0;margin:0;border:0;vertical-align:baseline';return span;};
  const a=probe(),b=probe();label.prepend(a);opening.append(b);
  const difference=b.getBoundingClientRect().bottom-a.getBoundingClientRect().bottom;a.remove();b.remove();
  if(Math.abs(difference)>.1){offset+=difference;label.style.translate=`0 ${offset}px`;}
 };
 const setup=value=>{clear();if(!value)return;label=element.querySelector(':scope > .label-item, :scope > .part-label');if(!label)return;observer=new ResizeObserver(measure);observer.observe(element);if(label.nextElementSibling)observer.observe(label.nextElementSibling);queueMicrotask(measure);document.fonts?.ready.then(measure);};
 setup(enabled);return {update:setup,destroy:clear};
}
