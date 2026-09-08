import { promises as fs } from 'node:fs';
import path from 'node:path';
import { WORK_ROOT, applyContentOverrides, runStatus, saveContentOverride, validateRun, contentHash } from './transcription.mjs';
import { loadDraftPreview } from './transcription-preview.mjs';

const MAX_BODY = 2 * 1024 * 1024;
const safeId = (value) => String(value ?? '').replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 120);
const send = (res, code, value) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(value)); };
const readBody = (req) => new Promise((resolve, reject) => {
  let raw = '';
  req.on('data', (chunk) => { raw += chunk; if (raw.length > MAX_BODY) { reject(new Error('request body too large')); req.destroy(); } });
  req.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch { reject(new Error('invalid JSON')); } });
  req.on('error', reject);
});
const readJson = async (file, fallback = null) => { try { return JSON.parse(String(await fs.readFile(file, 'utf8')).replace(/^\uFEFF/, '')); } catch { return fallback; } };
const writeJson = async (file, value) => { await fs.writeFile(file, JSON.stringify(value, null, 2) + '\n', 'utf8'); };

function runRoot(id) {
  const root = path.resolve(WORK_ROOT, safeId(id));
  if (!(root + path.sep).startsWith(path.resolve(WORK_ROOT) + path.sep)) throw new Error('bad run id');
  return root;
}

async function runDetails(id) {
  const root = runRoot(id);
  const status = runStatus(root);
  const review = await readJson(path.join(root, 'review.json'), {});
  const transcription = await readJson(path.join(root, 'merged', 'transcription.json'), null);
  const draft = transcription ? null : loadDraftPreview(root, await readJson(path.join(root, 'manifest.json')));
  const base = transcription ?? draft?.transcription;
  const editConflicts = [];
  const previewTranscription = base ? applyContentOverrides(base, review, { strict: false, conflicts: editConflicts }) : null;
  return {
    ...status,
    review,
    transcription,
    previewTranscription, editConflicts, baseHash: base ? contentHash(base) : null, revision: review.revision ?? 0,
    draftPreview: draft?.summary ?? null,
    modules: (await readJson(path.join(root, 'merged', 'modules.json'), { modules: [] })).modules,
    validation: await readJson(path.join(root, 'validation.json'), null),
    receipt: await readJson(path.join(root, 'publication-receipt.json'), null),
  };
}

async function listRuns() {
  const names = await fs.readdir(WORK_ROOT).catch(() => []);
  const rows = [];
  for (const name of names.filter((item) => !item.startsWith('.'))) {
    try { rows.push(runStatus(runRoot(name))); } catch { /* Ignore incomplete temporary directories. */ }
  }
  return rows.sort((a, b) => b.runId.localeCompare(a.runId));
}

export function fullBookletImportPlugin() {
  return {
    name: 'full-booklet-import',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
        if (!pathname.startsWith('/__booklet/full-imports')) return next();
        try {
          if (pathname === '/__booklet/full-imports' && req.method === 'GET') return send(res, 200, await listRuns());
          const fileMatch = pathname.match(/^\/__booklet\/full-imports\/([^/]+)\/files\/(.+)$/);
          if (fileMatch && req.method === 'GET') {
            const root = runRoot(decodeURIComponent(fileMatch[1]));
            const file = path.resolve(root, decodeURIComponent(fileMatch[2]));
            if (!(file + path.sep).startsWith(root + path.sep)) throw new Error('bad file path');
            const data = await fs.readFile(file); const ext = path.extname(file).toLowerCase();
            res.statusCode = 200; res.setHeader('Content-Type', ext === '.png' ? 'image/png' : ext === '.json' ? 'application/json' : ext === '.md' || ext === '.txt' ? 'text/plain; charset=utf-8' : 'application/octet-stream'); res.end(data); return;
          }
          const reviewMatch = pathname.match(/^\/__booklet\/full-imports\/([^/]+)\/review$/);
          if (reviewMatch && req.method === 'PUT') {
            const root = runRoot(decodeURIComponent(reviewMatch[1])); const body = await readBody(req);
            const previous = await readJson(path.join(root, 'review.json'), {});
            if (body.expectedRevision !== (previous.revision ?? 0)) return send(res, 409, { error: 'Review changed. Refresh before saving.' });
            const updated = {...previous, flags:body.flags??previous.flags??[], layoutOverrides:body.layoutOverrides??previous.layoutOverrides??{}, history:body.history??previous.history??[], revision:(previous.revision??0)+1};
            await writeJson(path.join(root, 'review.json'), updated);
            if (await readJson(path.join(root, 'merged', 'transcription.json'))) validateRun(root);
            return send(res, 200, await runDetails(reviewMatch[1]));
          }
          const contentMatch = pathname.match(/^\/__booklet\/full-imports\/([^/]+)\/review\/content$/);
          if (contentMatch && req.method === 'PATCH') {
            const id = decodeURIComponent(contentMatch[1]);
            const body = await readBody(req);
            if (body.expectedRevision === undefined || !body.expectedBaseHash) return send(res, 409, { error: 'Refresh to obtain the current draft revision before editing.' });
            saveContentOverride(runRoot(id), body);
            if (await readJson(path.join(runRoot(id), 'merged', 'transcription.json'))) validateRun(runRoot(id));
            return send(res, 200, await runDetails(id));
          }
          const runMatch = pathname.match(/^\/__booklet\/full-imports\/([^/]+)$/);
          if (runMatch && req.method === 'GET') return send(res, 200, await runDetails(decodeURIComponent(runMatch[1])));
          return send(res, 404, { error: 'Full booklet import endpoint not found.' });
        } catch (error) { return send(res, error.status ?? 500, { error: error.message }); }
      });
    },
  };
}
