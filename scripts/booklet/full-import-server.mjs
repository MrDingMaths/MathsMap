import { promises as fs } from 'node:fs';
import path from 'node:path';
import { WORK_ROOT } from './transcription.mjs';

// Project source comparison still needs these files; import history and writes are retired.
const send = (res, code, value) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(value)); };
function runRoot(id, workRoot) {
  if (!/^[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/.test(id)) throw Object.assign(new Error('bad run id'), {status:400});
  const root = path.resolve(workRoot, id);
  if (!root.startsWith(path.resolve(workRoot) + path.sep)) throw new Error('bad run id');
  return root;
}

export function fullBookletImportPlugin({workRoot = WORK_ROOT} = {}) {
  return {
    name: 'full-booklet-import',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
        if (!pathname.startsWith('/__booklet/full-imports')) return next();
        try {
          const fileMatch = pathname.match(/^\/__booklet\/full-imports\/([^/]+)\/files\/(.+)$/);
          if (fileMatch && req.method === 'GET') {
            const root = runRoot(decodeURIComponent(fileMatch[1]), workRoot);
            const file = path.resolve(root, decodeURIComponent(fileMatch[2]));
            if (!(file + path.sep).startsWith(root + path.sep)) throw new Error('bad file path');
            const data = await fs.readFile(file); const ext = path.extname(file).toLowerCase();
            res.statusCode = 200; res.setHeader('Content-Type', ext === '.png' ? 'image/png' : ext === '.json' ? 'application/json' : ext === '.md' || ext === '.txt' ? 'text/plain; charset=utf-8' : 'application/octet-stream'); res.end(data); return;
          }
          return send(res, 404, { error: 'Full booklet import endpoint not found.' });
        } catch (error) { return send(res, error.code === 'ENOENT' ? 404 : error.status ?? 500, { error: error.message }); }
      });
    },
  };
}
