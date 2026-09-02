import {
  BOOKLET_IMPORT_FORMAT,
  createBookletProject,
  deepCopy,
  normalizeBlock,
  normalizeBookletProject,
  stableBookletId,
} from './booklet-model.js';

export { BOOKLET_IMPORT_FORMAT };

export const BOOKLET_IMPORT_VERSION = 2;
export const FATAL_IMPORT_FLAGS = Object.freeze([
  'duplicate-page-number',
  'missing-page-number',
  'missing-source-render',
  'no-reconstructed-blocks',
  'missing-transcription',
]);

function unique(values = []) {
  return [...new Set(values.filter(Boolean).map((value) => String(value)))];
}

function pageNumberOf(raw, index) {
  const value = Number(raw?.pageNumber ?? raw?.page ?? raw?.number ?? index + 1);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export function normalizeImportPage(raw = {}, index = 0, { requireSourceRender = true } = {}) {
  const value = raw ?? {};
  const pageNumber = pageNumberOf(value, index);
  const sourceImage = value.sourceImage ?? value.image ?? value.render ?? null;
  const rawBlocks = Array.isArray(value.blocks) ? value.blocks : [];
  const reviewFlags = unique(value.reviewFlags ?? value.flags ?? value.uncertainties ?? []);
  if (pageNumber === null) reviewFlags.push('missing-page-number');
  if (requireSourceRender && !sourceImage) reviewFlags.push('missing-source-render');
  if (!rawBlocks.length) reviewFlags.push('no-reconstructed-blocks');
  if (value.accepted !== true) reviewFlags.push('awaiting-review');
  return {
    ...deepCopy(value),
    id: value.id ?? `page-${pageNumber ?? index + 1}`,
    pageNumber,
    sourceImage,
    pdfText: String(value.pdfText ?? value.sourceText ?? ''),
    wordText: String(value.wordText ?? ''),
    blocks: rawBlocks.map((block, blockIndex) => normalizeBlock(block, blockIndex)),
    reviewFlags: unique(reviewFlags),
    accepted: value.accepted === true,
  };
}

export function normalizeImportPayload(raw = {}, { input = null, requireSourceRender = true } = {}) {
  const value = raw ?? {};
  const source = {
    ...(deepCopy(value.source) ?? {}),
    ...(input ? { pdf: value.source?.pdf ?? input } : {}),
  };
  const pages = (Array.isArray(value.pages) ? value.pages : [])
    .map((page, index) => normalizeImportPage(page, index, { requireSourceRender }))
    .sort((left, right) => (left.pageNumber ?? Number.MAX_SAFE_INTEGER) - (right.pageNumber ?? Number.MAX_SAFE_INTEGER));
  return {
    ...deepCopy(value),
    format: BOOKLET_IMPORT_FORMAT,
    version: BOOKLET_IMPORT_VERSION,
    status: value.status ?? 'needs-review',
    source,
    title: value.title ?? value.project?.title ?? 'Imported booklet',
    subtitle: value.subtitle ?? value.project?.subtitle ?? '',
    batchSize: Number(value.batchSize) > 0 ? Number(value.batchSize) : 4,
    assets: deepCopy(value.assets ?? []),
    pages,
  };
}

export function reviewImportPayload(raw, options = {}) {
  const payload = normalizeImportPayload(raw, options);
  const errors = [];
  const flags = [];
  const pageNumbers = new Set();
  const blockIds = new Set();

  payload.pages.forEach((page) => {
    if (page.pageNumber === null) errors.push(`Page ${page.id} has no numeric page number`);
    if (pageNumbers.has(page.pageNumber)) {
      page.reviewFlags = unique([...page.reviewFlags, 'duplicate-page-number']);
      errors.push(`Duplicate imported page number: ${page.pageNumber}`);
    }
    pageNumbers.add(page.pageNumber);
    page.blocks.forEach((block) => {
      if (blockIds.has(block.id)) {
        page.reviewFlags = unique([...page.reviewFlags, 'duplicate-block-id']);
        errors.push(`Duplicate imported block id: ${block.id}`);
      }
      blockIds.add(block.id);
    });
    page.reviewFlags.forEach((flag) => flags.push({ pageNumber: page.pageNumber, id: page.id, flag }));
  });

  const fatalFlags = payload.pages.flatMap((page) => page.reviewFlags.filter((flag) => FATAL_IMPORT_FLAGS.includes(flag)));
  const allPagesAccepted = payload.pages.length > 0 && payload.pages.every((page) => page.accepted === true);
  return {
    payload,
    errors,
    flags,
    allPagesAccepted,
    canPublish: errors.length === 0 && allPagesAccepted && fatalFlags.length === 0,
  };
}

export function importPayloadToProject(raw, { id = null, title = null, subtitle = null } = {}) {
  const checked = reviewImportPayload(raw, { requireSourceRender: false });
  const payload = checked.payload;
  const blocks = [];
  payload.pages.forEach((page, index) => {
    if (index > 0) blocks.push({ type: 'page-break', id: `source-page-break-${page.pageNumber ?? index + 1}`, label: `Source page ${page.pageNumber ?? index + 1}` });
    page.blocks.forEach((block) => blocks.push(deepCopy(block)));
  });
  return normalizeBookletProject(createBookletProject({
    id: id ?? stableBookletId('import', payload.source?.pdf ?? payload.title),
    title: title ?? payload.title,
    subtitle: subtitle ?? payload.subtitle,
    sections: [{
      id: 'imported-source',
      title: payload.title,
      kicker: 'Faithful source import',
      blocks,
    }],
    assets: deepCopy(payload.assets),
    source: deepCopy(payload.source),
    status: checked.canPublish ? 'accepted' : 'draft',
    review: {
      format: BOOKLET_IMPORT_FORMAT,
      pages: payload.pages.map((page) => ({
        id: page.id,
        pageNumber: page.pageNumber,
        sourceImage: page.sourceImage,
        accepted: page.accepted,
        reviewFlags: [...page.reviewFlags],
      })),
      allPagesAccepted: checked.allPagesAccepted,
    },
  }));
}
