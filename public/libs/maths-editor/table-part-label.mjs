// Imported calculation tables sometimes store their part label as bold prose.
// Give those labels the same gutter without changing the editable source.
export function hasTablePartLabel(paragraph) {
 const [label,space,...rest]=paragraph?.inlines??[];
 return paragraph?.type==='paragraph'&&label?.type==='text'&&
  /^[a-z][.)]?\s*$/.test(label.text??'')&&label.marks?.includes('bold')&&
  (/\s$/.test(label.text??'') || (space?.type==='text'&&/^\s+$/.test(space.text??'')&&rest.length>0));
}
export function renderTablePartLabel(html,paragraph,inCell,editable=false) {
 // Keep the source whitespace in the DOM: every style transaction reads it
 // back. Removing it makes the next render stop recognising the part label.
 return inCell&&hasTablePartLabel(paragraph)?html.replace(/<strong>([a-z][.)]?)(\s*)<\/strong>(\s*)/,
  (_,label,inside,after)=>`<strong data-table-part-label style="display:inline-block;min-width:7mm">${label}${editable?inside:''}</strong>${editable&&after?`<span data-table-part-gap style="display:none">${after}</span>`:''}`):html;
}
