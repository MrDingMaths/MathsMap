import { defineConfig } from 'vite';
import { publicLibraryModulesPlugin } from './scripts/vite-public-modules.mjs';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { contentWritePlugin } from './scripts/content/admin-server.mjs';
import { practiceStudioPlugin } from './scripts/booklet/practice-studio-server.mjs';
import { fullBookletImportPlugin } from './scripts/booklet/full-import-server.mjs';
import { projectStudioPlugin } from './scripts/booklet/project-studio-server.mjs';
import { renderCachePlugin } from './scripts/booklet/render-cache-server.mjs';

function tikzjaxRawGzPlugin() {
  const rawGz = (req, res, next) => {
    if (req.url && /\/libs\/tikzjax\/.*\.gz(\?.*)?$/.test(req.url)) { res.setHeader('Content-Type', 'application/octet-stream'); res.setHeader('Content-Encoding', 'identity'); }
    next();
  };
  return { name: 'tikzjax-raw-gz', configureServer(server) { server.middlewares.use(rawGz); }, configurePreviewServer(server) { server.middlewares.use(rawGz); } };
}

export default defineConfig({
  // Local PDF/editor evidence can contain standalone HTML with external imports.
  // Only the application entry participates in dependency discovery.
  optimizeDeps: { entries: ['index.html'] },
  plugins: [publicLibraryModulesPlugin(), svelte(), tikzjaxRawGzPlugin(), contentWritePlugin(), renderCachePlugin(), practiceStudioPlugin(), fullBookletImportPlugin(), projectStudioPlugin()],
  server: { open: true, watch: { ignored: ['**/.booklet-work/**', '**/output/**', '**/public/content/**', '**/public/quizzes/**', '**/public/content-manifest.json'] } },
});
