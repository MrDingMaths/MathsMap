// Imported calculation tables sometimes store their part label as bold prose.
// Give those labels the same gutter without changing the editable source.
export function hasTablePartLabel(paragraph) {
 const [label,space,...rest]=paragraph?.inlines??[];
 return paragraph?.type==='paragraph'&&label?.type==='text'&&
  /^[a-z][.)]?$/.test(label.text??'')&&label.marks?.includes('bold')&&
  space?.type==='text'&&/^\s+$/.test(space.text??'')&&rest[0]?.type==='math';
}
export function renderTablePartLabel(html,paragraph,inCell) {
 return inCell&&hasTablePartLabel(paragraph)?html.replace('<strong>','<strong data-table-part-label style="display:inline-block;min-width:6mm">'):html;
}
