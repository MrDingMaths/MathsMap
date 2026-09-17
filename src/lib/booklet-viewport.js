// Page numbers and block IDs alone cannot identify an occurrence: combined
// editions repeat questions in answers, and long fields span several pages.
const mode = page => page?.mode ?? 'student';
const section = page => page?.section?.sourceSectionId ?? page?.section?.id;
const markers = page => (page?.blocks ?? []).map(b => [b.id,b.flow?.fragment ?? 0,b.flow?.answerFragment ?? 0]);
const same = (a,b) => a?.length === b?.length && a.every((x,i)=>x===b[i]);

export function flowPageAnchor(pages,index) {
  const page=pages[index];if(!page)return null;
  return {mode:mode(page),section:section(page),index,markers:markers(page),
    neighbours:pages.map((p,i)=>({index:i,mode:mode(p),section:section(p),markers:markers(p)}))};
}

export function resolveFlowPageAnchor(pages,anchor) {
  if(!anchor)return -1;
  const candidates=pages.map((p,index)=>({p,index})).filter(({p})=>mode(p)===anchor.mode);
  const matching=items=>candidates.filter(({p})=>markers(p).some(m=>items.some(item=>same(m,item))))
    .sort((a,b)=>Math.abs(a.index-anchor.index)-Math.abs(b.index-anchor.index))[0]?.index;
  const own=matching(anchor.markers);if(own!=null)return own;
  for(const neighbour of (anchor.neighbours??[]).filter(p=>p.mode===anchor.mode&&p.section===anchor.section)
    .sort((a,b)=>Math.abs(a.index-anchor.index)-Math.abs(b.index-anchor.index))) {
    const found=matching(neighbour.markers);if(found!=null)return found;
  }
  return candidates.filter(({p})=>section(p)===anchor.section)
    .sort((a,b)=>Math.abs(a.index-anchor.index)-Math.abs(b.index-anchor.index))[0]?.index
    ?? candidates.sort((a,b)=>Math.abs(a.index-anchor.index)-Math.abs(b.index-anchor.index))[0]?.index ?? -1;
}

export function captureFlowViewport(root,scrollRoot,pages,index) {
  const page=root?.querySelector(`[data-flow-index="${index}"]`);if(!page||!scrollRoot)return null;
  const top=scrollRoot.getBoundingClientRect().top;
  const fields=[...page.querySelectorAll('[data-diagram-id],.editable-booklet-text')]
    .filter(el=>el.getBoundingClientRect().height>0)
    .sort((a,b)=>Math.abs(a.getBoundingClientRect().top-top-12)-Math.abs(b.getBoundingClientRect().top-top-12));
  const field=fields[0];
  return {page:flowPageAnchor(pages,index),offset:page.getBoundingClientRect().top-top,
    field:field?{diagram:field.dataset.diagramId,root:field.dataset.editRoot,pointer:field.dataset.editPath,
      start:field.dataset.fragmentStart,nodeId:field.querySelector('[data-id]')?.dataset.id,
      offset:field.getBoundingClientRect().top-top}:null};
}

export function restoreFlowViewport(root,scrollRoot,index,anchor) {
  const page=root?.querySelector(`[data-flow-index="${index}"]`);if(!page||!scrollRoot||!anchor)return;
  const saved=anchor.field;
  const field=saved&&[...page.querySelectorAll('[data-diagram-id],.editable-booklet-text')].find(el=>
    saved.diagram?el.dataset.diagramId===saved.diagram:
      el.dataset.editRoot===saved.root&&el.dataset.editPath===saved.pointer&&el.dataset.fragmentStart===saved.start&&
      (!saved.nodeId||[...el.querySelectorAll('[data-id]')].some(n=>n.dataset.id===saved.nodeId)));
  const element=field??page,offset=field?saved.offset:anchor.offset;
  scrollRoot.scrollTop+=element.getBoundingClientRect().top-scrollRoot.getBoundingClientRect().top-offset;
}
