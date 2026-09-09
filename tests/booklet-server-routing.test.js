import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { bookletStudioRoute } from '../src/lib/booklet-studio-route.js';
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

test('project source files remain readable through the middleware stack', async t => {
  const workRoot=fs.mkdtempSync(path.join(os.tmpdir(),'booklet-source-route-'));
  t.after(()=>fs.rmSync(workRoot,{recursive:true,force:true}));
  fs.mkdirSync(path.join(workRoot,'source/evidence'),{recursive:true});
  fs.writeFileSync(path.join(workRoot,'source/evidence/page.txt'),'Original evidence');
  const stack = middlewareFor(practiceStudioPlugin(), fullBookletImportPlugin({workRoot}));
  const response = await request(stack, '/__booklet/full-imports/source/files/evidence/page.txt');
  assert.equal(response.statusCode, 200);
  assert.equal(response.body, 'Original evidence');
  assert.equal((await request(stack,'/__booklet/full-imports/source/files/missing.txt')).statusCode,404);
  assert.notEqual((await request(stack,'/__booklet/full-imports/source/files/%2e%2e%2f%2e%2e%2foutside.txt')).statusCode,200);
  assert.equal((await request(stack,'/__booklet/full-imports/source/files/evidence/page.txt','PUT')).statusCode,404);
});

test('historical import routes redirect to Projects without retaining run selection',()=>{
  for(const stage of ['full-import','import','review']){
    const route=bookletStudioRoute(`#/booklet?stage=${stage}&run=old&page=3&project=current`);
    assert.equal(route.stage,'projects');assert.equal(route.projectId,'current');
    assert.equal(route.redirect,'#/booklet?stage=projects&project=current');
    assert.equal(bookletStudioRoute(`#/booklet?stage=${stage}&run=old`).projectId,null);
  }
  assert.equal(bookletStudioRoute('#/booklet','full-import','current').redirect,'#/booklet?stage=projects&project=current');
  assert.equal(bookletStudioRoute('#/booklet?stage=projects&project=current').redirect,null);
  assert.equal(bookletStudioRoute('#/booklet?stage=builder').stage,'builder');
});

test('historical listing, details, writes and materialization are retired',async()=>{
  const stack=middlewareFor(practiceStudioPlugin(),fullBookletImportPlugin(),projectStudioPlugin());
  for(const [url,method] of [
    ['/__booklet/full-imports','GET'],['/__booklet/full-imports/old','GET'],
    ['/__booklet/full-imports/old/review','PUT'],['/__booklet/full-imports/old/review/content','PATCH'],
    ['/__booklet/projects/materialize','POST'],
  ]) assert.equal((await request(stack,url,method)).statusCode,404,`${method} ${url}`);
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
