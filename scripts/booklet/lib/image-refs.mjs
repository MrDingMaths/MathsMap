// Reads the image references pandoc leaves in a booklet's markdown:
//
//   ![](media/<booklet>/media/image28.png){width="1.5833333333333333in" height="1.07in"}
//
// The width/height attributes are the size Word printed the picture at, in inches, and are
// the only surviving record of intended figure scale — the bank stores them as `widthCm`.
// The crop Word applied is NOT here (pandoc drops `<a:srcRect>`); that comes from the docx
// via extract-docx-crops.mjs.
const IMAGE_RE = /!\[([^\]]*)\]\(([^)]+)\)(\{[^}]*\})?/g;

const IN_TO_CM = 2.54;

function attr(attrs, name) {
  if (!attrs) return null;
  const m = attrs.match(new RegExp(`${name}="([^"]+)"`));
  return m ? m[1] : null;
}

function inchesToCm(value) {
  if (!value) return null;
  const m = String(value).match(/^([\d.]+)in$/);
  if (!m) return null;
  return Math.round(Number(m[1]) * IN_TO_CM * 100) / 100;
}

/**
 * @returns {Array<{ png: string, file: string, alt: string, widthCm: number|null, heightCm: number|null, index: number }>}
 *          `png` is the bare filename (`image28.png`) — the bank stages figures flat —
 *          while `file` keeps the original path for provenance.
 */
export function extractImageRefs(text) {
  const refs = [];
  if (typeof text !== 'string') return refs;
  for (const m of text.matchAll(IMAGE_RE)) {
    const [, alt, file, attrs] = m;
    refs.push({
      png: file.split('/').pop(),
      file,
      alt: alt || '',
      widthCm: inchesToCm(attr(attrs, 'width')),
      heightCm: inchesToCm(attr(attrs, 'height')),
      index: m.index,
    });
  }
  return refs;
}

/** The text with every image reference removed — the words of the cell on their own. */
export function stripImageRefs(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(IMAGE_RE, '')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
