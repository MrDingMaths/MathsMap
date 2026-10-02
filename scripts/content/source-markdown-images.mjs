// Pandoc grid tables wrap each cell independently. Read their columns separately
// so three opening image alt texts on one row cannot swallow the next two images.
export function sourceMarkdownImages(source) {
  const lines = String(source).replace(/\r/g, '').split('\n');
  const borders = [...new Map(lines.filter(line => /^\s*\+(?:[-=]+\+)+\s*$/.test(line)).map(line => {
    const positions = [...line.matchAll(/\+/g)].map(match => match.index);
    return [positions.join(','), positions];
  })).values()].sort((a, b) => b.length - a.length);
  const chunks = [], prose = [];
  const flushProse = () => { if (prose.length) chunks.push(prose.join('\n')); prose.length = 0; };
  let columns = null, positions = null, activeBorder = null;
  const flush = () => { if (columns) chunks.push(...columns.map(column => column.join('\n'))); columns = null; positions = null; };
  for (const line of lines) {
    if (/^\s*\+(?:[-=]+\+)+\s*$/.test(line)) activeBorder = [...line.matchAll(/\+/g)].map(match => match.index);
    const matches = points => points?.every(point => line[point] === '|') && !line.slice(points.at(-1) + 1).trim();
    // The current table's border wins. For an excerpt starting inside a table,
    // use the most specific complete layout rather than its outer-only subset.
    const layout = matches(activeBorder) ? activeBorder : borders.find(matches);
    if (layout) {
      flushProse();
      if (!positions || positions.join(',') !== layout.join(',')) {
        flush(); positions = layout; columns = Array.from({ length: layout.length - 1 }, () => []);
      }
      columns.forEach((column, index) => column.push(line.slice(layout[index] + 1, layout[index + 1]).trim()));
    } else {
      flush(); prose.push(line);
    }
  }
  flush();
  flushProse();
  return chunks.flatMap(chunk => [...chunk.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map(match => match[1].replace(/^<|>$/g, '').split(' "')[0].replace(/>$/, '')));
}
