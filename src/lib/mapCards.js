// Card geometry for the topic map. Topic nodes are fixed-width rounded cards
// whose height follows the number of lines the title wraps to. The title itself
// is drawn by the HTML label layer in Map.svelte, so these numbers must match
// the .card-label CSS there (padding, ring slot, font and line height).
export const CARD_W = 184;
export const CARD_PAD_X = 12;
export const CARD_PAD_Y = 11;
export const CARD_RING = 18;
export const CARD_RING_GAP = 8;
export const CARD_LINE_H = 18;
export const CARD_FONT = '700 14px Nunito, system-ui, sans-serif';
export const CARD_TEXT_W = CARD_W - 2 * CARD_PAD_X - CARD_RING - CARD_RING_GAP;

// Footer line on each card: "9 skills" with the show-skills toggle.
export const CARD_FOOT_H = 22;

// Expanded topic group (the opened topic listing its skills): two card columns.
export const GROUP_W = 2 * CARD_W + 16;
export const GROUP_HEAD_H = 50;
export const GROUP_ROW_H = 26;
export const GROUP_PAD_B = 10;

const FALLBACK_PX_PER_CHAR = 7.6;
let measureCtx = null;

function textWidth(text) {
  if (typeof document !== 'undefined') {
    if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
    if (measureCtx) {
      measureCtx.font = CARD_FONT;
      return measureCtx.measureText(text).width;
    }
  }
  return text.length * FALLBACK_PX_PER_CHAR;
}

// Greedy word wrap at the card's text width; a single over-long word takes a
// line of its own.
export function cardLines(title, maxWidth = CARD_TEXT_W) {
  const words = String(title || '').split(/\s+/).filter(Boolean);
  if (!words.length) return 1;
  let lines = 1;
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    // 4% slack covers small differences between canvas and DOM text metrics.
    if (line && textWidth(next) * 1.04 > maxWidth) {
      lines += 1;
      line = word;
    } else {
      line = next;
    }
  }
  return lines;
}

export function cardSize(title) {
  const lines = Math.min(5, cardLines(title));
  return { w: CARD_W, h: 2 * CARD_PAD_Y + lines * CARD_LINE_H + CARD_FOOT_H, lines };
}

export function groupSize(skillCount) {
  return { w: GROUP_W, h: GROUP_HEAD_H + Math.max(1, skillCount) * GROUP_ROW_H + GROUP_PAD_B };
}
