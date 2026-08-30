// A tiny static server for the booklet renderer.
//
// TikZJax resolves its wasm, core dump and font files relative to its own script URL and
// fetches them from a Worker, so a `file://` page cannot compile a single diagram. Rather
// than depend on the Vite dev server (a pinned port, a Svelte route, someone else's
// content), the renderer serves exactly what the page needs on an ephemeral port.
//
// The one non-obvious rule: `.gz` assets must be sent as raw bytes with NO
// `Content-Encoding`, because TikZJax decompresses them itself. Serving them as gzip makes
// the browser decompress them first and the engine then chokes on the plain bytes. This
// mirrors the `tikzjaxRawGzPlugin` in vite.config.js.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, extname, normalize } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
};

function contentType(path) {
  if (path.endsWith('.gz')) return 'application/octet-stream';
  return TYPES[extname(path).toLowerCase()] || 'application/octet-stream';
}

/**
 * @param {object} options
 * @param {Map<string,{body: string, type: string}>} options.inline paths served from memory
 * @param {Array<{prefix: string, dir: string}>} options.mounts directory mounts
 * @returns {Promise<{ base: string, close: () => Promise<void>, errors: string[] }>}
 */
export async function startServer({ inline = new Map(), mounts = [] } = {}) {
  const errors = [];
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const path = decodeURIComponent(url.pathname);

    const memo = inline.get(path);
    if (memo) {
      res.writeHead(200, { 'Content-Type': memo.type, 'Cache-Control': 'no-store' });
      res.end(memo.body);
      return;
    }

    for (const mount of mounts) {
      if (!path.startsWith(mount.prefix)) continue;
      const relative = path.slice(mount.prefix.length);
      // Never let a request climb out of its mount.
      const target = resolve(join(mount.dir, normalize(relative)));
      if (!target.startsWith(resolve(mount.dir))) break;
      try {
        const info = await stat(target);
        if (!info.isFile()) break;
        const body = await readFile(target);
        res.writeHead(200, { 'Content-Type': contentType(target), 'Cache-Control': 'no-store' });
        res.end(body);
        return;
      } catch {
        break;
      }
    }

    errors.push(path);
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found');
  });

  await new Promise((done, fail) => {
    server.once('error', fail);
    server.listen(0, '127.0.0.1', done);
  });
  const { port } = server.address();

  return {
    base: `http://127.0.0.1:${port}`,
    errors,
    close: () => new Promise((done) => server.close(done)),
  };
}

/** The mounts every booklet render needs. */
export function bookletMounts({ bankSlug, rootDir = ROOT }) {
  const mounts = [
    { prefix: '/libs/tikzjax/', dir: join(rootDir, 'public', 'libs', 'tikzjax') },
    { prefix: '/vendor/katex/', dir: join(rootDir, 'node_modules', 'katex', 'dist') },
    { prefix: '/vendor/pagedjs/', dir: join(rootDir, 'node_modules', 'pagedjs', 'dist') },
  ];
  if (bankSlug) mounts.push({ prefix: `/bank/${bankSlug}/`, dir: join(rootDir, 'booklets', 'bank', bankSlug, 'figures') });
  return mounts;
}
