import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import zlib from 'node:zlib';
import { createRemoteCompression, chooseEncoding } from '../remote/compression.mjs';

const body = JSON.stringify({ rows: Array.from({ length: 500 }, (_, i) => ({ id: 'q' + i, text: 'repeat '.repeat(10) })) });
function serve(handler) {
  const compress = createRemoteCompression();
  const server = http.createServer((req, res) => compress(req, res, () => handler(req, res)));
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}
function get(server, headers) {
  return new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port: server.address().port, path: '/', headers }, res => {
      const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => resolve({ res, raw: Buffer.concat(chunks) }));
    }).on('error', reject);
  });
}

test('encoding preference', () => {
  assert.equal(chooseEncoding('gzip, deflate, br'), 'br');
  assert.equal(chooseEncoding('gzip'), 'gzip');
  assert.equal(chooseEncoding('identity'), null);
});

test('remote JSON is compressed whether headers come from setHeader or writeHead; local requests are unchanged', async () => {
  for (const style of ['setHeader', 'writeHead']) {
    const server = await serve((req, res) => {
      if (style === 'writeHead') res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
      else { res.setHeader('Content-Type', 'application/json'); res.setHeader('Content-Length', Buffer.byteLength(body)); }
      res.write(body.slice(0, 100)); res.end(body.slice(100));
    });
    try {
      const remote = await get(server, { host: 'studio.example.com', 'accept-encoding': 'br, gzip' });
      assert.equal(remote.res.headers['content-encoding'], 'br');
      assert.ok(remote.raw.length < body.length / 4);
      assert.equal(zlib.brotliDecompressSync(remote.raw).toString(), body);
      const gzip = await get(server, { host: 'studio.example.com', 'accept-encoding': 'gzip' });
      assert.equal(zlib.gunzipSync(gzip.raw).toString(), body);
      const local = await get(server, { host: '127.0.0.1:5173', 'accept-encoding': 'br' });
      assert.equal(local.res.headers['content-encoding'], undefined);
      assert.equal(local.raw.toString(), body);
    } finally { server.close(); }
  }
});

test('binary and already-encoded responses pass through', async () => {
  const png = Buffer.from([137, 80, 78, 71, 1, 2, 3]);
  const server = await serve((req, res) => {
    if (req.url === '/') { res.setHeader('Content-Type', 'image/png'); res.end(png); }
  });
  try {
    const remote = await get(server, { host: 'studio.example.com', 'accept-encoding': 'br' });
    assert.equal(remote.res.headers['content-encoding'], undefined);
    assert.deepEqual(remote.raw, png);
  } finally { server.close(); }
});
