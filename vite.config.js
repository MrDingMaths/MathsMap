import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { buildManifest } from './scripts/build-manifest.mjs';
import { practiceStudioPlugin } from './scripts/booklet/practice-studio-server.mjs';
import { fullBookletImportPlugin } from './scripts/booklet/full-import-server.mjs';
import { projectStudioPlugin } from './scripts/booklet/project-studio-server.mjs';

function tikzjaxRawGzPlugin() {
  const rawGz = (req, res, next) => {
    if (req.url && /\/libs\/tikzjax\/.*\.gz(\?.*)?$/.test(req.url)) { res.setHeader('Content-Type', 'application/octet-stream'); res.setHeader('Content-Encoding', 'identity'); }
    next();
  };
  return { name: 'tikzjax-raw-gz', configureServer(server) { server.middlewares.use(rawGz); }, configurePreviewServer(server) { server.middlewares.use(rawGz); } };
}

function contentWritePlugin() {
  const roots = { content: path.resolve('public/content'), quizzes: path.resolve('public/quizzes') };
  return { name: 'content-write', configureServer(server) { server.middlewares.use((req, res, next) => {
    const m = req.url && /^\/_admin\/(content|quizzes)\/([^/?]+)/.exec(req.url); if (!m || req.method !== 'PUT') return next();
    const reply = (code, body) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); };
    const skillId = decodeURIComponent(m[2]); if (!/^[a-z0-9-]+$/.test(skillId)) return reply(400, { error: 'bad skillId' });
    let raw = ''; req.on('data', (chunk) => { raw += chunk; }); req.on('end', async () => { let body; try { body = JSON.parse(raw); } catch { return reply(400, { error: 'invalid JSON' }); } const root = roots[m[1]]; const file = path.resolve(root, skillId + '.json'); if (path.dirname(file) !== root) return reply(400, { error: 'bad path' }); try { await fs.writeFile(file, JSON.stringify(body, null, 2) + '\n'); try { await buildManifest(); } catch (err) { console.error('[content-write] manifest rebuild failed:', err); } reply(200, { ok: true }); } catch (err) { reply(500, { error: String(err) }); } });
  }); } };
}

export default defineConfig({
  plugins: [svelte(), tikzjaxRawGzPlugin(), contentWritePlugin(), practiceStudioPlugin(), fullBookletImportPlugin(), projectStudioPlugin()],
  server: { open: true, watch: { ignored: ['**/.booklet-work/**', '**/output/**', '**/public/content/**', '**/public/quizzes/**', '**/public/content-manifest.json'] } },
});
