import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { createServer } from 'node:http';
import { captureSnapshot, publishSkill, recoverSkill, preserveJsonBytes } from '../scripts/content/publication.mjs';
import { createContentMiddleware } from '../scripts/content/admin-server.mjs';
import { buildManifest } from '../scripts/build-manifest.mjs';
import { compile } from 'svelte/compiler';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

const id = 'test-skill';
const card = (number) => ({ question_text: `State $${number}$.`, structure: 'state-number', solution_text: `$${number}$` });
const question = (number) => ({ id: `q${number}`, ...card(number), mastery: false, options: [{ text: `$${number}$`, correct: true }, { text: `$${number + 1}$`, why: 'Added one to the stated number.' }, { text: `$${number - 1}$`, why: 'Subtracted one from the stated number.' }] });
async function fixture(t, skillId = id) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'mathsmap-publication-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  for (const dir of ['data', 'public/content', 'public/quizzes']) await fs.mkdir(path.join(root, dir), { recursive: true });
  for (const name of ['courses', 'topics', 'dotpoints']) await fs.writeFile(path.join(root, 'data', `${name}.json`), '[]');
  await fs.writeFile(path.join(root, 'data/skills.json'), JSON.stringify([{ id: skillId, stage: 3, prereqs: [], courses: [], dotPointIds: [] }]));
  const content = { skillId, atomType: 'Cat', theory: { intro: 'A number represents a quantity.', facts: ['Numbers can be written using digits.'] }, practice: { foundation: [1, 2, 3, 4].map(card), development: [5, 6, 7, 8].map(card), masteryOmitted: 'This skill has no advanced cases.' } };
  const quiz = { skillId, questions: [1, 2, 3, 4].map(question) };
  await fs.writeFile(path.join(root, 'public/content', `${skillId}.json`), JSON.stringify(content, null, 3) + '\r\n');
  await fs.writeFile(path.join(root, 'public/quizzes', `${skillId}.json`), JSON.stringify(quiz, null, 4) + '\n');
  return { root, baseline: await captureSnapshot(root, skillId) };
}
function candidates(baseline) {
  const content = structuredClone(baseline.content), quiz = structuredClone(baseline.quiz);
  content.theory.intro = 'A number records a quantity.';
  quiz.questions[0].solution_text = 'The number is $1$.';
  return { candidateContent: content, candidateQuiz: quiz };
}
async function interrupt(root, baseline) {
  await assert.rejects(publishSkill(root, id, { expected: baseline.expected, ...candidates(baseline), onProgress({ kind }) { if (kind === 'content') throw new Error('simulated interruption'); } }), /simulated interruption/);
}

test('publication validates a complete candidate pair before touching either public file', async (t) => {
  const { root, baseline } = await fixture(t);
  const invalid = structuredClone(baseline.quiz); invalid.questions[0].options[1].correct = true;
  await assert.rejects(publishSkill(root, id, { expected: baseline.expected, ...candidates(baseline), candidateQuiz: invalid }), { status: 422 });
  const actual = await captureSnapshot(root, id);
  assert.deepEqual(actual.expected, baseline.expected);
  await assert.rejects(publishSkill(root, id, { candidateContent: baseline.content }), { status: 428 });
});

test('publication rejects stale content or quiz revisions and leaves external edits intact', async (t) => {
  const { root, baseline } = await fixture(t);
  const saved = await publishSkill(root, id, { expected: baseline.expected, ...candidates(baseline) });
  await assert.rejects(publishSkill(root, id, { expected: baseline.expected, candidateContent: baseline.content }), { status: 409 });
  assert.deepEqual((await captureSnapshot(root, id)).expected, saved.expected);
  const journal = JSON.parse(await fs.readFile(saved.journalPath, 'utf8'));
  assert.equal(journal.status, 'complete');
  assert.equal(journal.readback.validated, true);
  assert.deepEqual(journal.pre, baseline.expected);
  assert.deepEqual(journal.post, saved.expected);
});

test('array insertion, deletion and reordering retain unrelated raw item bytes', async (t) => {
  const { root, baseline } = await fixture(t);
  const content = structuredClone(baseline.content), quiz = structuredClone(baseline.quiz);
  content.practice.foundation = [content.practice.foundation[3], card(9), content.practice.foundation[0]];
  quiz.questions = [quiz.questions[3], question(9), quiz.questions[0]];
  const saved = await publishSkill(root, id, { expected: baseline.expected, candidateContent: content, candidateQuiz: quiz });
  assert.deepEqual(saved.content, content);
  assert.deepEqual(saved.quiz, quiz);
  const oldSnippet = JSON.stringify(baseline.quiz.questions[3], null, 4).replace(/\n/g, '\n        ');
  assert.ok(baseline.quizRaw.includes(oldSnippet));
  assert.ok(saved.quizRaw.includes(oldSnippet));
  const raw = '{ "items": [ {"id":"a","x":"\\u0041"}, { "id": "b", "x": 2 } ], "keep" : 1 }\r\n';
  const next = { items: [{ id: 'b', x: 2 }, { id: 'new', x: 3 }, { id: 'a', x: 'A' }], keep: 1 };
  const patched = preserveJsonBytes(raw, next);
  assert.deepEqual(JSON.parse(patched), next);
  assert.ok(patched.includes('{"id":"a","x":"\\u0041"}'));
  assert.ok(patched.includes('{ "id": "b", "x": 2 }'));
  assert.ok(patched.endsWith(', "keep" : 1 }\r\n'));
  const inserted = preserveJsonBytes(raw, { items: [{ id: 'new', x: 3 }, ...JSON.parse(raw).items], keep: 1 });
  assert.ok(inserted.includes('{"id":"a","x":"\\u0041"}'));
  assert.ok(inserted.includes('{ "id": "b", "x": 2 }'));
});

test('interrupted pair publication finishes from prepared originals and records readback', async (t) => {
  const { root, baseline } = await fixture(t);
  await interrupt(root, baseline);
  const result = await recoverSkill(root, id);
  assert.deepEqual(result.content, candidates(baseline).candidateContent);
  assert.deepEqual(result.quiz, candidates(baseline).candidateQuiz);
  assert.equal(await recoverSkill(root, id), null);
});

test('interrupted pair can be explicitly rolled back byte-for-byte', async (t) => {
  const { root, baseline } = await fixture(t);
  await interrupt(root, baseline);
  const result = await recoverSkill(root, id, { mode: 'rollback' });
  assert.equal(result.contentRaw, baseline.contentRaw);
  assert.equal(result.quizRaw, baseline.quizRaw);
  assert.equal(JSON.parse(await fs.readFile(result.journalPath, 'utf8')).status, 'rolled-back');
});

test('recovery refuses to overwrite edits made outside the pending transaction', async (t) => {
  const { root, baseline } = await fixture(t);
  await interrupt(root, baseline);
  const external = structuredClone(baseline.quiz); external.questions[1].solution_text = 'External edit.';
  const externalRaw = JSON.stringify(external);
  await fs.writeFile(path.join(root, 'public/quizzes', `${id}.json`), externalRaw);
  await assert.rejects(recoverSkill(root, id), { status: 409 });
  assert.equal(await fs.readFile(path.join(root, 'public/quizzes', `${id}.json`), 'utf8'), externalRaw);
  assert.ok(await fs.stat(path.join(root, '.agywork/content-publication/active', `${id}.json`)));
});

test('manifest scans recover incomplete pairs before atomic index replacement', async (t) => {
  const { root, baseline } = await fixture(t);
  await interrupt(root, baseline);
  const manifest = await buildManifest({ rootDir: root });
  assert.deepEqual(manifest.quiz[id], [4, 0]);
  assert.deepEqual((await captureSnapshot(root, id)).quiz, candidates(baseline).candidateQuiz);
});

test('separate processes sharing a baseline cannot both publish', async (t) => {
  const { root, baseline } = await fixture(t);
  const moduleUrl = pathToFileURL(path.resolve('scripts/content/publication.mjs')).href;
  const run = (name) => new Promise((resolve, reject) => {
    const source = `import {publishSkill} from ${JSON.stringify(moduleUrl)}; const content=${JSON.stringify(baseline.content)}; content.theory.intro=${JSON.stringify('A number records ' + name + '.')}; try {await publishSkill(${JSON.stringify(root)},${JSON.stringify(id)},{expected:${JSON.stringify(baseline.expected)},candidateContent:content}); console.log('saved')}catch(e){console.log(e.status);process.exitCode=e.status===409?0:1}`;
    const child = spawn(process.execPath, ['--input-type=module', '-e', source], { windowsHide: true });
    let out = '', err = ''; child.stdout.on('data', (data) => out += data); child.stderr.on('data', (data) => err += data);
    child.on('error', reject); child.on('exit', (code) => code === 0 ? resolve(out.trim()) : reject(new Error(err || out)));
  });
  assert.deepEqual((await Promise.all([run('first'), run('second')])).sort(), ['409', 'saved']);
});

test('a killed publisher releases abandoned cross-process locks and its pair resumes', async (t) => {
  const { root, baseline } = await fixture(t);
  const moduleUrl = pathToFileURL(path.resolve('scripts/content/publication.mjs')).href;
  const source = `import {publishSkill} from ${JSON.stringify(moduleUrl)}; await publishSkill(${JSON.stringify(root)},${JSON.stringify(id)},{expected:${JSON.stringify(baseline.expected)},...${JSON.stringify(candidates(baseline))},async onProgress({kind}){if(kind==='content'){setInterval(()=>{},1000);console.log('paused');await new Promise(()=>{})}}});`;
  const child = spawn(process.execPath, ['--input-type=module', '-e', source], { windowsHide: true });
  t.after(() => { if (child.exitCode === null && child.signalCode === null) child.kill(); });
  const exited = new Promise((resolve) => child.on('exit', resolve));
  await new Promise((resolve, reject) => {
    let errors = '';
    child.stderr.on('data', (data) => errors += data);
    child.stdout.on('data', (data) => { if (String(data).includes('paused')) resolve(); });
    child.on('error', reject);
    child.on('exit', () => reject(new Error(errors || 'Publisher exited before interruption point')));
  });
  await assert.rejects(captureSnapshot(root, id, { lockTimeoutMs: 50 }), { status: 423 });
  child.kill(); await exited;
  const result = await captureSnapshot(root, id);
  assert.deepEqual(result.content, candidates(baseline).candidateContent);
  assert.deepEqual(result.quiz, candidates(baseline).candidateQuiz);
});

test('empty acquisition directories and dead choosing tickets are recoverable without a reclaim mutex', async (t) => {
  const { root } = await fixture(t);
  const child = spawn(process.execPath, ['-e', ''], { windowsHide: true });
  const deadPid = child.pid;
  await new Promise((resolve) => child.on('exit', resolve));
  const queue = path.join(root, '.agywork/content-publication/global-lock');
  const orphan = path.join(queue, `${deadPid}-${Buffer.from(os.hostname()).toString('hex')}-orphan`);
  const deadOwner = path.join(queue, `${deadPid}-${Buffer.from(os.hostname()).toString('hex')}-owner`);
  await fs.mkdir(orphan);
  await fs.mkdir(deadOwner);
  await fs.writeFile(path.join(deadOwner, 'owner.json'), JSON.stringify({ pid: deadPid, number: 1 }));
  // Old interrupted recovery metadata is not an ownership gate in this protocol.
  await fs.mkdir(`${queue}.reclaim`);
  await fs.writeFile(path.join(`${queue}.reclaim`, 'owner.json'), JSON.stringify({ pid: deadPid, token: 'abandoned' }));
  const snapshot = await captureSnapshot(root, id, { lockTimeoutMs: 1000 });
  assert.equal(snapshot.content.skillId, id);
  assert.deepEqual(await fs.readdir(queue), []);
});

test('publication and admin save preserve existing mixed-case skill IDs', async (t) => {
  const skillId = 'permutations-nPr';
  const { root, baseline } = await fixture(t, skillId);
  const saved = await publishSkill(root, skillId, { expected: baseline.expected, ...candidates(baseline) });
  assert.equal(saved.content.skillId, skillId);
  const middleware = createContentMiddleware({ root, rebuildManifest: async () => {} });
  const server = createServer((req, res) => middleware(req, res, () => { res.statusCode = 404; res.end(); }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
  const base = `http://127.0.0.1:${server.address().port}/_admin`;
  const loaded = await (await fetch(`${base}/snapshot/${skillId}`)).json();
  loaded.content.theory.intro = 'Numbers indicate quantities.';
  const response = await fetch(`${base}/content/${skillId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expected: loaded.expected, value: loaded.content }) });
  assert.equal(response.status, 200);
  assert.equal((await captureSnapshot(root, skillId)).content.skillId, skillId);
});

test('admin snapshot/save protocol rejects legacy and stale clients', async (t) => {
  const { root } = await fixture(t);
  const middleware = createContentMiddleware({ root, rebuildManifest: async () => {} });
  const server = createServer((req, res) => middleware(req, res, () => { res.statusCode = 404; res.end(); }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
  const base = `http://127.0.0.1:${server.address().port}/_admin`;
  const baseline = await (await fetch(`${base}/snapshot/${id}`)).json();
  const put = (body) => fetch(`${base}/content/${id}`, { method: 'PUT', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
  assert.equal((await put(baseline.content)).status, 428);
  baseline.content.theory.intro = 'A number describes a quantity.';
  const saved = await put({ value: baseline.content, expected: baseline.expected });
  assert.equal(saved.status, 200);
  assert.ok((await saved.json()).expected.contentHash);
  assert.equal((await put({ value: baseline.content, expected: baseline.expected })).status, 409);
  assert.equal((await put(null)).status, 400);
  const current = await captureSnapshot(root, id);
  current.content.theory.intro = 'The symbol π represents a constant.';
  const bytes = Buffer.from(JSON.stringify({ value: current.content, expected: current.expected }));
  const split = bytes.indexOf(Buffer.from('π')) + 1;
  const request = { url: `/_admin/content/${id}`, method: 'PUT', async *[Symbol.asyncIterator]() { yield bytes.subarray(0, split); yield bytes.subarray(split); } };
  const response = { setHeader() {}, end(value) { this.body = JSON.parse(value); } };
  await middleware(request, response, () => assert.fail('Save route was not matched'));
  assert.equal(response.statusCode, 200);
  assert.equal((await captureSnapshot(root, id)).content.theory.intro, current.content.theory.intro);
});

async function editorHarness(component, stubs) {
  const host = `<script>import View from './src/views/${component}.svelte'; let id=$state('a'); window.navigate=value=>id=value;</script><View ${component === 'SkillDetail' ? '{id}' : 'ids={id}'} />`;
  const hostCode = compile(host, { filename: path.resolve('publication-test-host.svelte'), generate: 'client' }).js.code;
  const result = await build({
    stdin: { contents: `import {mount} from 'svelte'; ${hostCode}\nmount(Publication_test_host,{target:document.body});`, resolveDir: process.cwd() },
    bundle: true, write: false, platform: 'browser', format: 'iife', conditions: ['browser'],
    plugins: [{ name: 'publication-harness', setup(builder) {
      builder.onLoad({ filter: /\.(?:svelte|js)$/ }, async ({ path: file }) => {
        if (file.includes(`${path.sep}node_modules${path.sep}`)) return;
        let source = stubs[path.basename(file)] ?? await fs.readFile(file, 'utf8');
        if (file.endsWith('.svelte')) source = compile(source, { filename: file, generate: 'client', css: 'injected' }).js.code;
        return { contents: source, resolveDir: path.dirname(file) };
      });
    } }],
  });
  return result.outputFiles[0].text;
}
const saveStubs = `
  export const adminState={isAdmin:true};
  export async function loadAdminSnapshot(id){ const n=window.reads[id]=(window.reads[id]??0)+1; return {content:{theory:{intro:id+n}},quiz:{skillId:id,questions:[],label:id+n},expected:{contentHash:id+n,quizHash:id+n}}; }
  async function save(kind,id,value,expected){window.writes.push({kind,id,value,expected}); if(window.deferSave)return new Promise(resolve=>window.resolveSave=resolve);return {expected:{contentHash:'saved',quizHash:'saved'}};}
  export const saveContent=(...args)=>save('content',...args); export const saveQuiz=(...args)=>save('quiz',...args);`;

test('SkillDetail ignores delayed content and quiz acknowledgements after A→B→A navigation', async () => {
  const stubs = {
    'data.js': `export const skillById=new Map(['a','b'].map(id=>[id,{id,title:id,courses:[],prereqs:[]}]));export const dependentsOf=new Map();export const courseById=new Map();export const primaryTopicForSkill=()=>null;export const siblingSkills=()=>({});`,
    'router.svelte.js': 'export const href=value=>value;',
    'recommender.js': 'export const lockedSkills=()=>[];',
    'store.js': "export const getMastery=()=>'none';export const subscribe=fn=>{fn();return ()=>{};};",
    'content.js': 'export const loadSkillContent=async()=>null;export const setContentCache=(id,value)=>window.cacheWrites.push({id,value});',
    'quiz.js': 'export const setQuizCache=(id,value)=>window.cacheWrites.push({id,value});',
    'admin.svelte.js': saveStubs,
    'TheoryEditor.svelte': `<script>let {theory,onSave}=$props();</script><span data-testid="theory">{theory.intro}</span><button onclick={()=>window.pending=onSave({...theory,intro:'obsolete'})}>Save theory</button>`,
    'QuizEditor.svelte': `<script>let {quiz,onSave}=$props();</script><span data-testid="quiz">{quiz?.label}</span><button onclick={()=>window.pending=onSave({...quiz,label:'obsolete'})}>Save quiz</button>`,
    'PracticeEditor.svelte': '', 'MasteryStatus.svelte': '', 'SkillLink.svelte': '', 'MapLink.svelte': '',
    'Math.svelte': '<script>let {text}=$props();</script>{text}',
    'TheoryView.svelte': '', 'PracticeCarousel.svelte': '',
  };
  const code = await editorHarness('SkillDetail', stubs);
  let browser;
  try { browser = await chromium.launch({ headless: true }); } catch { browser = await chromium.launch({ headless: true, channel: 'chrome' }); }
  try {
    for (const kind of ['theory', 'quiz']) {
      const page = await browser.newPage();
      const failures = []; page.on('pageerror', error => failures.push(error.message));
      await page.setContent('<html><body></body></html>');
      await page.evaluate(() => { window.reads={};window.writes=[];window.cacheWrites=[];window.deferSave=true; });
      await page.addScriptTag({ content: code });
      await page.locator(`[data-testid="${kind}"]`).getByText('a1', { exact: true }).waitFor();
      await page.getByRole('button', { name: `Save ${kind}`, exact: true }).click();
      await page.waitForFunction(() => window.writes.length === 1);
      await page.evaluate(() => window.navigate('b'));
      await page.locator(`[data-testid="${kind}"]`).getByText('b1', { exact: true }).waitFor();
      await page.evaluate(() => window.navigate('a'));
      await page.locator(`[data-testid="${kind}"]`).getByText('a2', { exact: true }).waitFor();
      await page.evaluate(async () => {window.resolveSave({expected:{contentHash:'obsolete',quizHash:'obsolete'}});await window.pending;});
      assert.equal(await page.locator(`[data-testid="${kind}"]`).innerText(), 'a2');
      assert.deepEqual(await page.evaluate(() => window.cacheWrites), []);
      await page.evaluate(() => {window.deferSave=false;});
      await page.getByRole('button', { name: `Save ${kind}`, exact: true }).click();
      await page.waitForFunction(() => window.writes.length === 2);
      assert.deepEqual(await page.evaluate(() => window.writes[1].expected), {contentHash:'a2',quizHash:'a2'});
      assert.deepEqual(failures, []);
      await page.close();
    }
  } finally { await browser.close(); }
});

test('diagram saves retain the submitted code and ignore acknowledgements from an earlier review scope', async () => {
  const stubs = {
    'data.js': "export const skills=[{id:'a'},{id:'b'}];export const skillById=new Map(skills.map(s=>[s.id,s]));export const skillsForTopic=()=>[];",
    'content.js': 'export const loadSkillContent=async()=>null;export const setContentCache=(id,value)=>window.cacheWrites.push({id,value});',
    'quiz.js': 'export const loadSkillQuiz=async()=>null;export const setQuizCache=(id,value)=>window.cacheWrites.push({id,value});',
    'admin.svelte.js': saveStubs.replace('theory:{intro:id+n}', "theory:{intro:window.figure+' '+id+n}"),
    'tikz.js': 'export function renderTikzCode(el){el.innerHTML="<svg></svg>";}export function cancelTikzJob(){}',
  };
  const code = await editorHarness('TikzCheck', stubs);
  let browser;
  try { browser = await chromium.launch({ headless: true }); } catch { browser = await chromium.launch({ headless: true, channel: 'chrome' }); }
  try {
    const page = await browser.newPage();
    const failures=[];page.on('pageerror',error=>failures.push(error.message));
    await page.setContent('<html><body></body></html>');
    await page.evaluate(() => {window.reads={};window.writes=[];window.cacheWrites=[];window.deferSave=true;window.figure='[tikz]\\begin{tikzpicture}\\draw (0,0)--(1,1);\\end{tikzpicture}[/tikz]';});
    await page.addScriptTag({content:code});
    await page.waitForFunction(()=>window.__tikzCheckDone===true);
    const submitted='\\begin{tikzpicture}\\draw (0,0)--(8,1);\\end{tikzpicture}';
    await page.getByRole('button',{name:'edit',exact:true}).click();
    await page.locator('textarea').fill(submitted);
    await page.getByRole('button',{name:'Save',exact:true}).click();
    await page.waitForFunction(()=>window.writes.length===1);
    await page.locator('textarea').fill(submitted+'\n% unsubmitted change');
    await page.evaluate(async()=>{window.resolveSave({expected:{contentHash:'first-save',quizHash:'first-save'}});await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
    await page.getByRole('button',{name:'edit',exact:true}).click();
    assert.equal(await page.locator('textarea').inputValue(),submitted);
    await page.locator('textarea').fill(submitted+'\n% obsolete scope');
    await page.getByRole('button',{name:'Save',exact:true}).click();
    await page.waitForFunction(()=>window.writes.length===2);
    await page.evaluate(()=>window.navigate('b'));
    await page.waitForFunction(()=>window.__tikzItems[0]?.q.includes('b1'));
    await page.evaluate(()=>window.navigate('a'));
    await page.waitForFunction(()=>window.__tikzItems[0]?.q.includes('a2'));
    await page.evaluate(async()=>{window.cacheWrites=[];window.resolveSave({expected:{contentHash:'obsolete',quizHash:'obsolete'}});await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
    assert.deepEqual(await page.evaluate(()=>window.cacheWrites),[]);
    assert.match(await page.evaluate(()=>window.__tikzItems[0].q),/a2/);
    await page.evaluate(()=>{window.deferSave=false;});
    await page.getByRole('button',{name:'edit',exact:true}).click();
    await page.locator('textarea').fill(submitted);
    await page.getByRole('button',{name:'Save',exact:true}).click();
    await page.waitForFunction(()=>window.writes.length===3);
    assert.deepEqual(await page.evaluate(()=>window.writes[2].expected),{contentHash:'a2',quizHash:'a2'});
    assert.deepEqual(failures,[]);
  } finally {await browser.close();}
});
