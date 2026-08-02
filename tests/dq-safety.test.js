import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildManifest } from '../scripts/build-manifest.mjs';

async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value)}\n`);
}

async function captureWarnings(t) {
  const messages = [];
  const originalWarn = console.warn;
  console.warn = (message) => messages.push(String(message));
  t.after(() => { console.warn = originalWarn; });
  return messages;
}

test('manifest excludes an orphan quiz and warns', async (t) => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'mathsmap-dq-safety-'));
  t.after(() => rm(rootDir, { recursive: true, force: true }));

  await writeJson(path.join(rootDir, 'public/content/matched.json'), {
    skillId: 'matched',
    practice: { foundation: [], development: [] },
  });
  await writeJson(path.join(rootDir, 'public/quizzes/matched.json'), {
    skillId: 'matched',
    questions: [{ mastery: true }],
  });
  await writeJson(path.join(rootDir, 'public/quizzes/orphan.json'), {
    skillId: 'orphan',
    questions: [{ mastery: false }],
  });

  const warnings = await captureWarnings(t);
  const manifest = await buildManifest({ rootDir });

  assert.deepEqual(manifest.content.matched, [0, 0, 0]);
  assert.deepEqual(manifest.quiz.matched, [1, 1]);
  assert.equal(Object.hasOwn(manifest.quiz, 'orphan'), false);
  assert.match(warnings.join('\n'), /skipping orphan quiz orphan\.json/);

  const written = JSON.parse(await readFile(path.join(rootDir, 'public/content-manifest.json'), 'utf8'));
  assert.equal(Object.hasOwn(written.quiz, 'orphan'), false);
});

test('manifest excludes a quiz whose matching content is malformed', async (t) => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'mathsmap-dq-safety-'));
  t.after(() => rm(rootDir, { recursive: true, force: true }));

  const contentPath = path.join(rootDir, 'public/content/broken.json');
  await mkdir(path.dirname(contentPath), { recursive: true });
  await writeFile(contentPath, '{not json');
  await writeJson(path.join(rootDir, 'public/quizzes/broken.json'), {
    skillId: 'broken',
    questions: [],
  });

  const warnings = await captureWarnings(t);
  const manifest = await buildManifest({ rootDir });

  assert.equal(Object.hasOwn(manifest.content, 'broken'), false);
  assert.equal(Object.hasOwn(manifest.quiz, 'broken'), false);
  assert.match(warnings.join('\n'), /skipping malformed content file broken\.json/);
  assert.match(warnings.join('\n'), /skipping orphan quiz broken\.json/);
});
