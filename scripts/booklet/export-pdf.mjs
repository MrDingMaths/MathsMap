#!/usr/bin/env node
// Export the current project surface; --project is a read-only in-memory preview.
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { materializeLegacyProject } from '../../src/lib/editable-booklet-model.js';
function arg(name, fallback = null) { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : fallback; }
const base = arg('--base', 'http://localhost:5173').replace(/\/$/, '');
const output = resolve(arg('--out', '.booklet-work/booklet.pdf'));
const mode = arg('--mode', 'student');
if (!['student', 'short', 'worked'].includes(mode)) throw new Error('--mode must be student, short or worked');
const projectFile = arg('--project');
let projectId = arg('--project-id');
let browser;
try { browser = await chromium.launch({ headless: true }); }
catch { browser = await chromium.launch({ headless: true, channel: 'chrome' }); }
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
const renderErrors = [];
page.on('pageerror', error => renderErrors.push(error.message));
try {
  if (projectFile) {
    const project = materializeLegacyProject(JSON.parse(readFileSync(resolve(projectFile), 'utf8').replace(/^\uFEFF/, '')));
    projectId = project.id;
    await page.route('**/__booklet/projects', (route) => route.request().method() === 'GET' ? route.fulfill({ json: [project] }) : route.abort());
    await page.route('**/__booklet/projects/' + encodeURIComponent(projectId), (route) => route.request().method() === 'GET' ? route.fulfill({ json: project }) : route.abort());
  }
  const query = new URLSearchParams({ stage: 'projects' });
  if (projectId) query.set('project', projectId);
  await page.goto(base + '/#/booklet?' + query, { waitUntil: 'networkidle', timeout: 60000 });
  await page.locator('.project-print').waitFor({ state: 'attached', timeout: 60000 });
  await page.getByLabel('Practice answers', { exact: true }).selectOption(mode === 'student' ? 'none' : mode);
  await page.emulateMedia({ media: 'print' });
  console.log('Preparing print assets for ' + mode + ' export…');
  await page.evaluate(async () => {
    const root = document.querySelector('.project-print');
    if (!root?.innerText.trim() || !root.querySelector('.print-page')) throw new Error('The print view is empty');
    if (window.TikZ && !await window.TikZ.flushPending(root, 300000)) throw new Error('The print diagram queue did not finish');
    await document.fonts.ready;
    await Promise.all([...document.querySelectorAll('.project-print img')].map(img => img.decode()));
  });
  await page.waitForFunction(() => [...document.querySelectorAll('.project-print .tikz-wrap')].every(el => el.querySelector('.tikz-error') || [...el.querySelectorAll('svg')].some(svg => !svg.querySelector('animate'))), null, { timeout: 300000 });
  if (await page.locator('.project-print .tikz-error').count()) throw new Error('TikZ rendering failed; export stopped');
  if (renderErrors.length) throw new Error('Page rendering failed: ' + renderErrors.join('; '));
  mkdirSync(dirname(output), { recursive: true });
  await page.pdf({ path: output, format: 'A4', printBackground: true, preferCSSPageSize: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } });
  console.log(JSON.stringify({ output, projectId, mode }));
} catch (error) {
  console.error('Booklet PDF export failed:', error.message);
  console.error(await page.evaluate(() => [...document.querySelectorAll('.project-print .tikz-wrap')].filter(el => ![...el.querySelectorAll('svg')].some(svg => !svg.querySelector('animate'))).map(el => ({ question: el.closest('[data-question-id]')?.dataset.questionId, error: el.querySelector('.tikz-error')?.textContent, state: el.innerHTML.slice(0, 1200) }))).catch(() => 'Print page unavailable'));
  process.exitCode = 1;
}
finally { await browser.close(); }

