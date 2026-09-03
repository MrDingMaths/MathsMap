function plain(value) {
  return String(value ?? '').replace(/^#+\s*/, '').replace(/^\*\*(.*?)\*\*$/, '$1').trim();
}

export function parseImportedContents(value) {
  return String(value ?? '').split(/\r?\n/).map((line) => {
    const match = /^(.*?)\s+\.{3,}\s*(\d+)\s*$/.exec(line.trim());
    return match ? { title: match[1].trim(), sourcePage: Number(match[2]) } : null;
  }).filter(Boolean);
}

export function deriveBookletCover(pages = []) {
  const ordered = [...pages].sort((a, b) => Number(a.pageNumber) - Number(b.pageNumber));
  const first = ordered[0] ?? {};
  const coverBlock = first.blocks?.find((block) => block.id?.includes('cover')) ?? first.blocks?.[0] ?? {};
  const contentsBlock = first.blocks?.find((block) => block.title?.toLowerCase() === 'contents');
  const lines = String(coverBlock.content ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const course = plain(lines.find((line) => /mathematics|course/i.test(line)) ?? '');
  const heading = lines.find((line) => /^#\s+/.test(line));
  const bookIndex = lines.findIndex((line) => /^\*\*Book\b/i.test(line) || /^Book\b/i.test(line));
  const versionIndex = lines.findIndex((line) => /^Version\s*:/i.test(line));
  const book = plain(bookIndex >= 0 ? lines[bookIndex] : 'Book 1');
  const topics = bookIndex >= 0
    ? lines.slice(bookIndex + 1, versionIndex >= 0 ? versionIndex : undefined).filter((line) => !/^Feedback\s*:/i.test(line)).map(plain)
    : [];
  const version = plain(lines.find((line) => /^Version\s*:/i.test(line)) ?? '').replace(/^Version\s*:\s*/i, '');
  const feedback = (lines.find((line) => /^Feedback\s*:/i.test(line)) ?? '').replace(/^Feedback\s*:\s*/i, '') || 'https://MrDingMaths.com';
  const pagePositions = new Map(ordered.map((page, index) => [Number(page.pageNumber), index + 1]));
  const imported = parseImportedContents(contentsBlock?.content);
  let contents = imported
    .filter((entry) => pagePositions.has(entry.sourcePage))
    .map((entry) => ({ title: entry.title, pageNumber: pagePositions.get(entry.sourcePage) }));
  if (!contents.length) {
    const seen = new Set();
    contents = ordered.slice(1).flatMap((page, index) => {
      const title = String(page.section?.title ?? '').trim();
      if (!title || seen.has(title)) return [];
      seen.add(title);
      return [{ title, pageNumber: index + 2 }];
    });
  }
  return {
    course: course || 'Mathematics',
    title: plain(heading ?? first.section?.title ?? 'Untitled booklet'),
    book,
    topics,
    version,
    feedback,
    contents,
    totalPages: ordered.length || 1,
  };
}
