// Builds public/content-manifest.json — a generated index of which skills have
// teaching content / quizzes and how much, so the app can fetch one small file
// instead of probing per-skill. Scans public/content/*.json and
// public/quizzes/*.json. See docs/content-schema.md ("Manifest") for the shape.
//
// Exports buildManifest() so vite.config.js can re-run it in-process after an
// admin save; the block at the bottom runs it as a CLI when invoked directly
// (`node scripts/build-manifest.mjs` or the `manifest` npm script).
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(rootDir, 'public', 'content');
const quizzesDir = path.join(rootDir, 'public', 'quizzes');
const manifestPath = path.join(rootDir, 'public', 'content-manifest.json');

async function listJsonFiles(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.json'))
    .map((e) => e.name);
}

async function readJson(file) {
  const raw = await fs.readFile(file, 'utf8');
  return JSON.parse(raw);
}

export async function buildManifest() {
  const content = {};
  const quiz = {};

  for (const name of await listJsonFiles(contentDir)) {
    const skillId = name.slice(0, -'.json'.length);
    const file = path.join(contentDir, name);
    let data;
    try {
      data = await readJson(file);
    } catch (err) {
      console.warn(`[build-manifest] skipping malformed content file ${name}: ${err.message}`);
      continue;
    }
    const practice = data && typeof data === 'object' ? data.practice : undefined;
    const foundation = Array.isArray(practice?.foundation) ? practice.foundation.length : 0;
    const development = Array.isArray(practice?.development) ? practice.development.length : 0;
    const mastery = Array.isArray(practice?.mastery) ? practice.mastery.length : 0;
    content[skillId] = [foundation, development, mastery];
  }

  for (const name of await listJsonFiles(quizzesDir)) {
    const skillId = name.slice(0, -'.json'.length);
    const file = path.join(quizzesDir, name);
    let data;
    try {
      data = await readJson(file);
    } catch (err) {
      console.warn(`[build-manifest] skipping malformed quiz file ${name}: ${err.message}`);
      continue;
    }
    const questions = Array.isArray(data?.questions) ? data.questions : [];
    const masteryTagged = questions.filter((q) => q && q.mastery === true).length;
    quiz[skillId] = [questions.length, masteryTagged];
  }

  const manifest = {
    generated: new Date().toISOString(),
    content,
    quiz,
  };

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  buildManifest()
    .then((manifest) => {
      const contentCount = Object.keys(manifest.content).length;
      const quizCount = Object.keys(manifest.quiz).length;
      console.log(`[build-manifest] wrote ${path.relative(rootDir, manifestPath)} (${contentCount} content, ${quizCount} quiz)`);
    })
    .catch((err) => {
      console.error('[build-manifest] failed:', err);
      process.exit(1);
    });
}
