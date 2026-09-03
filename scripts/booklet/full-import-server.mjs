import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  WORK_ROOT, applyContentOverrides, buildRepairTasks, buildTasks, mergeLane, mergeRepairs, preflight,
  prepareRun, publishRun, runLane, runStatus, saveContentOverride, validateRun,
} from './transcription.mjs';
import { captureFidelityEvidence } from './capture-fidelity.mjs';

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
  return {
    ...status,
    review,
    transcription,
    previewTranscription: transcription ? applyContentOverrides(transcription, review, { strict: false }) : null,
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

async function perform(id, body) {
  const root = runRoot(id);
  const lane = body.lane ?? 'exact';
  if (body.action === 'capture-fidelity') {
    const result = await captureFidelityEvidence(root, { base: body.base });
    const manifest = await readJson(path.join(root, 'manifest.json'), {});
    manifest.lanes ??= {};
    manifest.lanes.fidelity = { ...(manifest.lanes.fidelity ?? {}), status: 'evidence-ready', capturedAt: result.capturedAt };
    await writeJson(path.join(root, 'manifest.json'), manifest);
    return { pages: result.pages.length, capturedAt: result.capturedAt };
  }
  if (body.action === 'build-tasks') return buildTasks(root, { lane });
  if (body.action === 'run') return runLane(root, { lane, concurrency: body.concurrency ?? 3 });
  if (body.action === 'merge') return mergeLane(root, { lane });
  if (body.action === 'validate') return validateRun(root);
  if (body.action === 'publish-dry-run') return publishRun(root);
  if (body.action === 'publish-apply') return publishRun(root, { apply: true });
  if (body.action === 'repair-build') return buildRepairTasks(root);
  if (body.action === 'repair-run') { await runLane(root, { lane: 'repair', concurrency: body.concurrency ?? 3 }); return mergeRepairs(root); }
  throw new Error(`Unknown full-import action: ${body.action}`);
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
          if (pathname === '/__booklet/full-imports/preflight' && req.method === 'POST') return send(res, 200, await preflight());
          if (pathname === '/__booklet/full-imports/prepare' && req.method === 'POST') {
            const body = await readBody(req);
            const prepared = prepareRun({ pdf: body.pdf, docx: body.docx, pages: body.pages, runId: body.runId, continuations: body.continuations ?? [] });
            return send(res, 200, await runDetails(prepared.manifest.id));
          }
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
            await writeJson(path.join(root, 'review.json'), body);
            if (JSON.stringify(previous.layoutOverrides ?? {}) !== JSON.stringify(body.layoutOverrides ?? {})) {
              const manifest = await readJson(path.join(root, 'manifest.json'), {});
              if (manifest.lanes?.fidelity) manifest.lanes.fidelity.status = 'stale';
              await writeJson(path.join(root, 'manifest.json'), manifest);
            }
            validateRun(root);
            return send(res, 200, await runDetails(reviewMatch[1]));
          }
          const contentMatch = pathname.match(/^\/__booklet\/full-imports\/([^/]+)\/review\/content$/);
          if (contentMatch && req.method === 'PATCH') {
            const id = decodeURIComponent(contentMatch[1]);
            saveContentOverride(runRoot(id), await readBody(req));
            validateRun(runRoot(id));
            return send(res, 200, await runDetails(id));
          }
          const actionMatch = pathname.match(/^\/__booklet\/full-imports\/([^/]+)\/action$/);
          if (actionMatch && req.method === 'POST') {
            const id = decodeURIComponent(actionMatch[1]); const result = await perform(id, await readBody(req));
            return send(res, 200, { result, run: await runDetails(id) });
          }
          const runMatch = pathname.match(/^\/__booklet\/full-imports\/([^/]+)$/);
          if (runMatch && req.method === 'GET') return send(res, 200, await runDetails(decodeURIComponent(runMatch[1])));
          return send(res, 404, { error: 'Full booklet import endpoint not found.' });
        } catch (error) { return send(res, 500, { error: error.message }); }
      });
    },
  };
}
