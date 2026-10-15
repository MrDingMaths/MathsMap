// Imported calculation tables sometimes store their part label as bold prose.
// Give those labels the same gutter without changing the editable source.
export function hasTablePartLabel(paragraph) {
 const [label,space,...rest]=paragraph?.inlines??[];
 return paragraph?.type==='paragraph'&&label?.type==='text'&&
  /^[a-z][.)]?\s*$/.test(label.text??'')&&label.marks?.includes('bold')&&
  (/\s$/.test(label.text??'') || (space?.type==='text'&&/^\s+$/.test(space.text??'')&&rest.length>0));
}
export function renderTablePartLabel(html,paragraph,inCell) {
 return inCell&&hasTablePartLabel(paragraph)?html.replace(/<strong>([a-z][.)]?)\s*<\/strong>\s*/, '<strong data-table-part-label style="display:inline-block;min-width:7mm">$1</strong>'):html;
}
