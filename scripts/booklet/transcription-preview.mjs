import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const read = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
function within(root, relative) {
  const target = path.resolve(root, relative), rel = path.relative(root, target);
  if (rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel)) throw new Error('Draft path outside batch');
  return target;
}

// Read-only projection for inspection before the strict merge/adoption gates.
// Never writes results, approval records or a merged transcription.
export function loadDraftPreview(runDir, manifest) {
  runDir = path.resolve(runDir);
  const pages = new Map(), assets = [], issues = [], origins = [];
  const selected = new Set(manifest.selectedPages), lane = path.join(runDir, 'lanes/exact');
  function add(file, source, expected = manifest.selectedPages) {
    try {
      const result = read(file);
      if (!Array.isArray(result.pages)) throw new Error('Draft has no pages');
      for (const page of result.pages) {
        if (!selected.has(page.pageNumber) || !expected.includes(page.pageNumber)) throw new Error('Unexpected draft page');
        if (page.id !== `page-${page.pageNumber}` || !page.section || !Array.isArray(page.blocks)) throw new Error('Incomplete draft page');
      }
      for (const page of result.pages) {
        // Existing adopted results take precedence over retained model output.
        if (pages.has(page.pageNumber)) continue;
        pages.set(page.pageNumber, page);
        origins.push({ pageNumber: page.pageNumber, source, file: path.relative(runDir, file) });
      }
      assets.push(...(result.assets ?? []));
    } catch (error) { issues.push({ file: path.basename(file), note: error.message }); }
  }
  if (fs.existsSync(lane)) for (const name of fs.readdirSync(lane).filter(n => /^task-\d+\.result\.json$/.test(n)).sort()) {
    add(path.join(lane, name), 'exact-result');
  }
  if (manifest.directBatch) {
    try {
      const batchDir = path.resolve(manifest.directBatch), batch = read(path.join(batchDir, 'batch.json'));
      if (batch.format !== 'mathsmap-direct-transcription-batch-v1' || path.resolve(batch.runDir) !== runDir) throw new Error('Direct batch belongs to a different import');
      for (const task of batch.tasks) {
        if (task.pages.every(page => pages.has(page))) continue;
        try {
          const dir = within(batchDir, task.directory), directFile = path.join(dir, 'direct.json');
          const sha = crypto.createHash('sha256').update(fs.readFileSync(directFile)).digest('hex');
          if (sha !== task.manifestSha256) throw new Error('Draft execution manifest changed');
          const names = fs.readdirSync(dir);
          const result = names.find(n => n === `${task.task}.result.json`);
          const candidate = names.filter(n => /^task-\d+\.\d+\.candidate\.json$/.test(n) && n.startsWith(task.task + '.')).sort().at(-1);
          if (result || candidate) add(path.join(dir, result ?? candidate), 'batch-draft', task.pages);
        } catch (error) { issues.push({ file: task.task, note: error.message }); }
      }
    } catch (error) { issues.push({ file: 'batch.json', note: error.message }); }
  }
  const ordered = [...pages.values()].sort((a, b) => a.pageNumber - b.pageNumber);
  return {
    transcription: ordered.length ? { format: 'mathsmap-full-booklet-import-v1', version: 2, runId: manifest.id, selectedPages: manifest.selectedPages, pages: ordered, assets } : null,
    summary: { availablePages: ordered.length, totalPages: selected.size, adoptedPages: origins.filter(o => o.source === 'exact-result').length, batchPages: origins.filter(o => o.source === 'batch-draft').length, missingPages: [...selected].filter(p => !pages.has(p)), issues, origins },
  };
}
