import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { practiceStudioPlugin } from '../scripts/booklet/practice-studio-server.mjs';
import { fullBookletImportPlugin } from '../scripts/booklet/full-import-server.mjs';
import { projectStudioPlugin } from '../scripts/booklet/project-studio-server.mjs';

function middlewareFor(...plugins) {
  const stack = [];
  const server = { middlewares: { use(handler) { stack.push(handler); } } };
  for (const plugin of plugins) plugin.configureServer(server);
  return stack;
}

async function request(stack, url, method = 'GET') {
  const req = new EventEmitter();
  req.url = url;
  req.method = method;
  const headers = {};
  let body = '';
  let resolveResponse;
  const completed = new Promise((resolve) => { resolveResponse = resolve; });
  const res = {
    statusCode: 200,
    setHeader(name, value) { headers[name.toLowerCase()] = value; },
    end(value = '') { body += String(value); resolveResponse(); },
  };
  let index = 0;
  const next = () => {
    const handler = stack[index++];
    if (!handler) return res.end(JSON.stringify({ error: 'unhandled' }));
    return handler(req, res, next);
  };
  next();
  await completed;
  return { statusCode: res.statusCode, headers, body };
}

test('practice middleware passes full-import routes to the full booklet handler', async () => {
  const stack = middlewareFor(practiceStudioPlugin(), fullBookletImportPlugin());
  const response = await request(stack, '/__booklet/full-imports');
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['content-type'], 'application/json; charset=utf-8');
  assert.ok(Array.isArray(JSON.parse(response.body)));
  assert.doesNotMatch(response.body, /Unknown Booklet Studio endpoint/);
});

test('practice middleware retains ownership of practice endpoints', async () => {
  const stack = middlewareFor(practiceStudioPlugin(), fullBookletImportPlugin());
  const response = await request(stack, '/__booklet/imports/not-a-real-import/unknown');
  assert.equal(response.statusCode, 404);
  assert.equal(JSON.parse(response.body).error, 'Unknown Booklet Studio endpoint');
});

test('retired import, proposal and AI action endpoints reject requests without reading a job body', async () => {
  const stack = middlewareFor(practiceStudioPlugin(), fullBookletImportPlugin(), projectStudioPlugin());
  for (const url of [
    '/__booklet/imports', '/__booklet/imports/old/result',
    '/__booklet/full-imports/preflight', '/__booklet/full-imports/prepare',
    '/__booklet/full-imports/old/action', '/__booklet/projects/old/propose',
  ]) {
    const response = await request(stack, url, 'POST');
    assert.equal(response.statusCode, 404, url);
  }
});
