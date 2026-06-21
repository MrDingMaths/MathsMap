import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

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

export default defineConfig({
  plugins: [svelte(), tikzjaxRawGzPlugin()],
  server: { open: true }
});
