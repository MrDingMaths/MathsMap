// Math ink can extend vertically beyond its line box. Only create a scroll
// viewport when content really exceeds the available horizontal space.
// All nodes share one observer and one frame: every width is read before any
// class changes, so a page of lines costs one layout instead of one per line.
const pending = new Set();
let frame = 0, resize = null;
function flush() {
  frame = 0;
  const nodes = [...pending].filter(node => node.isConnected);pending.clear();
  const overflow = nodes.map(node => node.scrollWidth > node.clientWidth + 2);
  nodes.forEach((node, i) => node.classList.toggle('horizontal-overflow', overflow[i]));
}
function schedule(node) {
  pending.add(node);
  frame ||= requestAnimationFrame(flush);
}
const owners = new WeakMap();
export function contentHorizontalScroll(node) {
  resize ??= new ResizeObserver(entries => { for (const entry of entries) { const owner = owners.get(entry.target); if (owner) schedule(owner); } });
  const observed = [node, ...node.children];
  for (const target of observed) { owners.set(target, node); resize.observe(target); }
  const changes = new MutationObserver(() => schedule(node));
  changes.observe(node, { childList:true, subtree:true, characterData:true });
  document.fonts?.ready.then(() => schedule(node));
  schedule(node);
  return { destroy() { for (const target of observed) resize.unobserve(target); changes.disconnect(); pending.delete(node); } };
}
