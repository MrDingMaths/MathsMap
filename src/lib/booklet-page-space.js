export const BOOKLET_PX_PER_MM = 96 / 25.4;
// Preserve the paginator's existing 12 px (3.175 mm) footer clearance.
export const BOOKLET_FOOTER_CLEARANCE = 12;

export function measureBookletPage(root) {
  const paper = root.querySelector('.booklet-page');
  const main = paper?.querySelector('main');
  const footer = paper?.querySelector('footer');
  if (!main || !footer) return null; // Covers have no editable body.
  const paperRect = paper.getBoundingClientRect();
  const scale = paperRect.width / (210 * BOOKLET_PX_PER_MM);
  if (!scale) return null;
  const body = main.getBoundingClientRect();
  const bottom = footer.getBoundingClientRect().top - BOOKLET_FOOTER_CLEARANCE * scale;
  const capacity = (bottom - body.top) / scale;
  const contentBottom = element => Math.max(body.top, ...[...element.children]
    .filter(child => !child.matches('.document-end-insert,.document-group-tools,[data-page-guide]'))
    .map(child => child.getBoundingClientRect().bottom));
  const columnElements = [...main.querySelectorAll(':scope > .answer-columns > .answer-column')];
  const ends = columnElements.length ? columnElements.map(contentBottom) : [contentBottom(main)];
  const height = (Math.max(...ends) - body.top) / scale;
  return {
    height, capacity,
    remainingMm: (capacity - height) / BOOKLET_PX_PER_MM,
    columns: ends.map(end => (bottom - end) / scale / BOOKLET_PX_PER_MM),
    overflowHeight: Math.max(0, (Math.max(...ends) - paperRect.bottom) / scale),
    paper: {left:paperRect.left,bottom:paperRect.bottom,width:paperRect.width,scale},
    // Viewport coordinates let guides follow both CSS zoom and transformed pages.
    body: {left:body.left, top:body.top, width:body.width, height:Math.max(0,bottom-body.top)},
  };
}

export function pageSpaceLabel(remainingMm) {
  return remainingMm < -0.2 / BOOKLET_PX_PER_MM
    ? `Overflow by ≈ ${Math.max(1, Math.ceil(-remainingMm))} mm`
    : `≈ ${Math.max(0, Math.round(remainingMm))} mm remaining`;
}
