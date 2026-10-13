// Math ink can extend vertically beyond its line box. Only create a scroll
// viewport when content really exceeds the available horizontal space.
export function contentHorizontalScroll(node) {
  let frame;
  const measure = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      node.classList.toggle('horizontal-overflow', node.scrollWidth > node.clientWidth + 2);
    });
  };
  const resize = new ResizeObserver(measure);
  resize.observe(node);
  for (const child of node.children) resize.observe(child);
  const changes = new MutationObserver(measure);
  changes.observe(node, { childList:true, subtree:true, characterData:true });
  document.fonts?.ready.then(measure);
  measure();
  return { destroy() { resize.disconnect(); changes.disconnect(); cancelAnimationFrame(frame); } };
}
