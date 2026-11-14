// Scales rendered TikZ diagrams with the text around them.
//
// The renderer keeps TikZ labels and strokes at their house sizes (10pt
// labels) relative to a page scale; off booklet pages that scale comes from
// the nearest data-diagram-scale attribute (see graphPageScale in
// diagram-typography.js). Where text is enlarged (the quiz), this action draws
// each diagram at its natural size times (host text size / 10pt) and sets the
// scale to the size it is actually drawn at, so diagrams, labels and lines all grow with the
// question text: a 10pt label is drawn at the surrounding text size. Computer
// Modern reads smaller than Nunito at the same size, so matching sizes keeps
// labels comfortable. Diagrams never exceed their column.

import { calibrateGraphStrokes } from './graph-strokes.js';

const PX_PER_UNIT = { pt: 4 / 3, px: 1, mm: 96 / 25.4, cm: 96 / 2.54, in: 96 };
// A 10pt label at the diagram's natural size, in CSS pixels.
export const BASE_TEXT_PX = 10 * PX_PER_UNIT.pt;

export function naturalWidthPx(svg) {
  const match = /^([\d.]+)\s*([a-z]*)$/i.exec(svg.getAttribute('width') || '');
  if (match) {
    const unit = (match[2] || 'px').toLowerCase();
    if (PX_PER_UNIT[unit]) return Number(match[1]) * PX_PER_UNIT[unit];
  }
  const box = svg.viewBox?.baseVal;
  return box?.width ? box.width * PX_PER_UNIT.pt : null;
}

export function textScale(hostFontPx, base = BASE_TEXT_PX) {
  return hostFontPx > 0 ? hostFontPx / base : null;
}

// Svelte action: keeps every diagram inside `node` scaled as diagrams render
// (TikZ renders asynchronously) and as the window resizes. `hosts` selects
// the elements whose font size sets the scale.
export function scaleDiagrams(node, { hosts = '' } = {}) {
  let frame = null;
  const apply = () => {
    frame = null;
    const changed = new Set();
    for (const svg of node.querySelectorAll('.inline-tikz svg, .tikz-wrap svg')) {
      const host = (hosts && svg.closest(hosts)) || node;
      const scale = textScale(parseFloat(getComputedStyle(host).fontSize));
      const natural = naturalWidthPx(svg);
      if (!scale || !natural) continue;
      const width = `${Math.round(natural * scale)}px`;
      if (svg.style.width !== width) {
        svg.style.width = width;
        svg.style.height = 'auto';
        svg.style.maxWidth = '100%';
      }
      // Labels follow the size the diagram is actually drawn at, so a diagram
      // capped by a narrow column keeps its labels in proportion.
      const drawn = svg.getBoundingClientRect().width / natural;
      if (!(drawn > 0)) continue;
      const wrap = svg.parentElement;
      const value = drawn.toFixed(3);
      if (wrap.dataset.diagramScale !== value) {
        wrap.dataset.diagramScale = value;
        changed.add(wrap);
      }
    }
    // The renderer recalibrates on resize, but an unchanged box would keep the
    // old label sizes, so recalibrate the diagrams whose scale changed.
    for (const wrap of changed) calibrateGraphStrokes(wrap);
  };
  const schedule = () => { if (frame == null) frame = requestAnimationFrame(apply); };
  const mutations = new MutationObserver(schedule);
  mutations.observe(node, { childList: true, subtree: true });
  const resize = new ResizeObserver(schedule);
  resize.observe(node);
  schedule();
  return {
    destroy() {
      mutations.disconnect();
      resize.disconnect();
      if (frame != null) cancelAnimationFrame(frame);
    }
  };
}
