import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { promises as fs } from 'node:fs';
import path from 'node:path';

// TikZJax bundles pre-compressed .gz files that its own JS inflates via pako.
// Vite's dev server would serve them with Content-Encoding: gzip, causing the
// browser to silently decompress them — pako then sees raw binary and throws
// Z_DATA_ERROR (-3). This middleware overrides to application/octet-stream with
// no Content-Encoding so the gzip bytes arrive intact for pako to handle.
function tikzjaxRawGzPlugin() {
  return {
    name: 'tikzjax-raw-gz',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && /\/libs\/tikzjax\/.*\.gz(\?.*)?$/.test(req.url)) {
          res.setHeader('Content-Type', 'application/octet-stream');
          res.setHeader('Content-Encoding', 'identity');
        }
        next();
      });
    },
  };
}

// Dev-only authoring endpoint. Lets the in-app admin mode (?admin) write edited
// teaching content straight back to data/content/{skillId}.json. configureServer
// only runs under `vite dev`, so production builds never expose this — the app
// stays read-only for students.
function contentWritePlugin() {
  return {
    name: 'content-write',
    configureServer(server) {
      const root = path.resolve('data/content');
      server.middlewares.use((req, res, next) => {
        const m = req.url && /^\/_admin\/content\/([^/?]+)/.exec(req.url);
        if (!m || req.method !== 'PUT') return next();

        const reply = (code, body) => {
          res.statusCode = code;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        };

        // Path guard: only plain skill ids, never traversal.
        const skillId = decodeURIComponent(m[1]);
        if (!/^[a-z0-9-]+$/.test(skillId)) return reply(400, { error: 'bad skillId' });

        let raw = '';
        req.on('data', (chunk) => { raw += chunk; });
        req.on('end', async () => {
          let body;
          try {
            body = JSON.parse(raw);
          } catch {
            return reply(400, { error: 'invalid JSON' });
          }
          const file = path.resolve(root, skillId + '.json');
          if (path.dirname(file) !== root) return reply(400, { error: 'bad path' });
          try {
            await fs.writeFile(file, JSON.stringify(body, null, 2) + '\n');
            reply(200, { ok: true });
          } catch (err) {
            reply(500, { error: String(err) });
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [svelte(), tikzjaxRawGzPlugin(), contentWritePlugin()],
  server: { open: true }
});
