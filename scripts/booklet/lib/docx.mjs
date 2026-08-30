// Minimal, dependency-free reader for the two parts of a .docx a booklet needs:
// `word/document.xml` and `word/_rels/document.xml.rels`.
//
// A .docx is a ZIP. Node ships `zlib.inflateRawSync`, which is the only decompressor a
// stored/deflated ZIP entry needs, so no npm dependency is warranted for reading two files.
// Only the central directory is walked (never the local headers), because local headers may
// carry zeroed sizes when a data descriptor is used.
import { inflateRawSync } from 'node:zlib';

const EOCD_SIG = 0x06054b50;
const CD_SIG = 0x02014b50;

function findEndOfCentralDirectory(buf) {
  // The EOCD is at the end, after an optional comment of up to 64 KiB.
  const min = Math.max(0, buf.length - 0xffff - 22);
  for (let i = buf.length - 22; i >= min; i--) {
    if (buf.readUInt32LE(i) === EOCD_SIG) return i;
  }
  return -1;
}

/**
 * @returns {Map<string, Buffer>} entry name -> uncompressed bytes
 */
export function readZip(buf) {
  const eocd = findEndOfCentralDirectory(buf);
  if (eocd < 0) throw new Error('not a zip file (no end-of-central-directory record)');
  const entryCount = buf.readUInt16LE(eocd + 10);
  let offset = buf.readUInt32LE(eocd + 16);
  const entries = new Map();

  for (let i = 0; i < entryCount; i++) {
    if (buf.readUInt32LE(offset) !== CD_SIG) throw new Error(`corrupt central directory at entry ${i}`);
    const method = buf.readUInt16LE(offset + 10);
    const compressedSize = buf.readUInt32LE(offset + 20);
    const nameLength = buf.readUInt16LE(offset + 28);
    const extraLength = buf.readUInt16LE(offset + 30);
    const commentLength = buf.readUInt16LE(offset + 32);
    const localOffset = buf.readUInt32LE(offset + 42);
    const name = buf.toString('utf8', offset + 46, offset + 46 + nameLength);
    offset += 46 + nameLength + extraLength + commentLength;

    // Local header: the name and extra lengths there can differ from the central copy.
    const localNameLength = buf.readUInt16LE(localOffset + 26);
    const localExtraLength = buf.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const raw = buf.subarray(dataStart, dataStart + compressedSize);
    if (method === 0) entries.set(name, Buffer.from(raw));
    else if (method === 8) entries.set(name, inflateRawSync(raw));
    else throw new Error(`unsupported compression method ${method} for "${name}"`);
  }
  return entries;
}

/** rId -> target path relative to `word/` (e.g. "media/image28.png"). */
export function parseRels(xml) {
  const rels = new Map();
  for (const m of xml.matchAll(/<Relationship\b([^>]*)\/?>/g)) {
    const attrs = m[1];
    const id = (attrs.match(/\bId="([^"]+)"/) || [])[1];
    const target = (attrs.match(/\bTarget="([^"]+)"/) || [])[1];
    if (id && target) rels.set(id, target.replace(/^\.\//, ''));
  }
  return rels;
}

/**
 * Pair the markdown's image references with the docx drawings they came from.
 *
 * pandoc drops drawings it cannot represent (text boxes, grouped shapes, headers): this
 * booklet has 300 drawings but only 201 markdown refs, and 64 images occur more often in
 * the docx than in the markdown. So the k-th markdown ref of an image is NOT reliably the
 * k-th drawing of it, and indexing by occurrence silently attaches the wrong crop.
 *
 * Both sequences are in document order, so this is a two-pointer alignment: for each ref,
 * scan forward for the next unused drawing of the same image, preferring one whose printed
 * width matches the markdown's width hint (the tie-breaker that separates two crops of the
 * same composite strip). Ambiguity is reported rather than resolved.
 *
 * @returns {{ pairs: Array<{ref, drawing, exactWidth: boolean}>, unmatched: Array, problems: string[] }}
 */
export function alignRefsToDrawings(refs, drawings, { widthTolerance = 0.06 } = {}) {
  const problems = [];
  const unmatched = [];
  const pairs = [];

  // Align PER IMAGE rather than globally. Both sequences are in document order, but a
  // global cursor strands references: choosing a far-forward drawing for one image skips
  // past every other image's drawings. Within a single image the two sequences differ only
  // by the drawings pandoc dropped, which a local two-pointer walk absorbs.
  const byPng = new Map();
  drawings.forEach((drawing, index) => {
    if (!byPng.has(drawing.png)) byPng.set(drawing.png, []);
    byPng.get(drawing.png).push({ drawing, index });
  });
  const cursors = new Map();

  for (const ref of refs) {
    const list = byPng.get(ref.png) || [];
    let cursor = cursors.get(ref.png) || 0;
    if (cursor >= list.length) {
      unmatched.push(ref);
      problems.push(`${ref.png}: the markdown references this image more often than the docx draws it — crop unavailable`);
      continue;
    }
    const remaining = list.slice(cursor);
    // The width Word printed at is the tie-breaker between two crops of one composite.
    const widthHit = ref.widthCm == null
      ? -1
      : remaining.findIndex((c) => c.drawing.widthCm != null && Math.abs(c.drawing.widthCm - ref.widthCm) < widthTolerance);
    const pick = widthHit >= 0 ? widthHit : 0;
    if (widthHit < 0 && remaining.length > 1 && ref.widthCm != null) {
      problems.push(`${ref.png} (markdown offset ${ref.index}, ${ref.widthCm}cm): no remaining drawing has that printed width — taking the next in order, so its crop may be the wrong slice`);
    }
    const chosen = remaining[pick];
    cursors.set(ref.png, cursor + pick + 1);
    // `widthConflict` is the one that matters: both sides state a printed width and they
    // disagree, which means the pairing is probably wrong. A markdown reference with no
    // width attribute is not a conflict — the docx simply supplies the missing size.
    const bothKnown = ref.widthCm != null && chosen.drawing.widthCm != null;
    pairs.push({
      ref,
      drawing: chosen.drawing,
      exactWidth: bothKnown && Math.abs(chosen.drawing.widthCm - ref.widthCm) < widthTolerance,
      widthConflict: bothKnown && Math.abs(chosen.drawing.widthCm - ref.widthCm) >= widthTolerance,
    });
  }

  return { pairs, unmatched, problems };
}

const EMU_PER_CM = 360000;
// DrawingML stores srcRect insets as percent x 1000 (39117 -> 39.117%).
const SRC_RECT_SCALE = 100000;

/**
 * Walk every picture in document order, pairing each with the crop and printed size Word
 * applied to it. `<a:srcRect>` is the crop pandoc discards, and it is the only record of
 * which slice of a composite image a given cell showed.
 *
 * @returns {Array<{ png: string, occurrence: number, crop: {l,t,r,b}|null, widthCm: number|null, heightCm: number|null, index: number }>}
 */
export function extractDrawings(documentXml, rels) {
  const drawings = [];
  const seen = new Map();
  // Each picture is an <a:blip r:embed="rIdN"/>; its extent and crop live in the same
  // <w:drawing>/<pic:pic> neighbourhood, so segment on the blips and read the window
  // around each one.
  const blipRe = /<a:blip\b[^>]*r:embed="(rId\d+)"[^>]*\/?>/g;
  const matches = [...documentXml.matchAll(blipRe)];

  matches.forEach((m, i) => {
    const target = rels.get(m[1]);
    if (!target || !target.startsWith('media/')) return;
    const png = target.split('/').pop();
    const next = i + 1 < matches.length ? matches[i + 1].index : documentXml.length;
    // The crop sits after the blip, inside the same <pic:blipFill>.
    const after = documentXml.slice(m.index, next);
    // The extent sits before the blip, in <wp:extent> / <a:ext> of the same drawing.
    const before = documentXml.slice(Math.max(0, i > 0 ? matches[i - 1].index : 0), m.index);

    const srcRect = after.match(/<a:srcRect\b([^>]*)\/?>/);
    let crop = null;
    if (srcRect) {
      const read = (side) => {
        const v = srcRect[1].match(new RegExp(`\\b${side}="(-?\\d+)"`));
        return v ? Number(v[1]) / SRC_RECT_SCALE : 0;
      };
      const c = { l: read('l'), t: read('t'), r: read('r'), b: read('b') };
      // An all-zero srcRect is Word saying "no crop"; storing it would be noise.
      if (c.l || c.t || c.r || c.b) crop = c;
    }

    // A drawing's <wp:extent> precedes its blip, but the window back to the previous blip
    // can also contain that drawing's extent — so take the LAST extent before this blip,
    // which is always this picture's own.
    const extentRe = /<wp:extent\b[^>]*cx="(\d+)"[^>]*cy="(\d+)"/g;
    const beforeExtents = [...before.matchAll(extentRe)];
    const extent = beforeExtents.length
      ? beforeExtents[beforeExtents.length - 1]
      : after.match(/<wp:extent\b[^>]*cx="(\d+)"[^>]*cy="(\d+)"/);
    const round = (v) => Math.round((v / EMU_PER_CM) * 100) / 100;

    const occurrence = (seen.get(png) || 0) + 1;
    seen.set(png, occurrence);
    drawings.push({
      png,
      occurrence,
      crop,
      widthCm: extent ? round(Number(extent[1])) : null,
      heightCm: extent ? round(Number(extent[2])) : null,
      index: m.index,
    });
  });

  return drawings;
}
