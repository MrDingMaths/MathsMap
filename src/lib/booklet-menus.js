// Shared dropdown behaviour for the Studio's <details> menus: one open at a
// time, closed by Escape, an outside press or choosing an item.
export const MENU_SELECTOR = '.menu,.document-insert,.item-menu';

export function menuGroup(node, selector = MENU_SELECTOR) {
  const doc = node.ownerDocument;
  const openMenus = () => [...node.querySelectorAll(selector)].filter(menu => menu.open);
  // A menu stays open while the kept element is inside it, so nested menus keep their parents.
  const closeExcept = keep => { for (const menu of openMenus()) if (!keep || (menu !== keep && !menu.contains(keep))) menu.open = false; };
  const toggled = event => { const menu = event.target; if (menu?.matches?.(selector) && menu.open) closeExcept(menu); };
  const pressed = event => { closeExcept(event.target?.closest?.(selector)); };
  const chosen = event => { const menu = event.target?.closest?.(selector); if (menu && event.target.closest('button')) menu.open = false; };
  const escaped = event => {
    if (event.key !== 'Escape') return;
    const menus = openMenus(); if (!menus.length) return;
    event.preventDefault(); event.stopPropagation();
    const focused = menus.find(menu => menu.contains(doc.activeElement)) ?? menus[0];
    closeExcept(null); focused.querySelector('summary')?.focus();
  };
  node.addEventListener('toggle', toggled, true);
  node.addEventListener('click', chosen);
  node.addEventListener('keydown', escaped, true);
  doc.addEventListener('pointerdown', pressed, true);
  return { destroy() {
    node.removeEventListener('toggle', toggled, true);
    node.removeEventListener('click', chosen);
    node.removeEventListener('keydown', escaped, true);
    doc.removeEventListener('pointerdown', pressed, true);
  } };
}
