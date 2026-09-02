#!/usr/bin/env node
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
function arg(name, fallback = null) { const index = process.argv.indexOf(name); return index >= 0 && index + 1 < process.argv.length ? process.argv[index + 1] : fallback; }
const base = arg('--base', 'http://localhost:5173').replace(/\/$/, '');
const output = resolve(arg('--out', '.booklet-work/estimating-change-pilot.pdf'));
const difficulty = arg('--difficulty', 'all');
const projectFile = arg('--project');
mkdirSync(dirname(output), { recursive: true });
let browser;
try { browser = await chromium.launch({ headless: true }); }
catch { browser = await chromium.launch({ headless: true, channel: 'chrome' }); }
const page = await browser.newPage({ viewport: { width: 1400, height: 1800 }, deviceScaleFactor: 1 });
try {
  let project = null;
  if (projectFile) {
    project = JSON.parse(readFileSync(resolve(projectFile), 'utf8').replace(/^\uFEFF/, ''));
    await page.addInitScript((value) => {
      localStorage.setItem('mathsmap.booklet.projects.v2', JSON.stringify([value]));
    }, project);
  }
  const query = new URLSearchParams({ difficulty });
  if (project?.id) query.set('project', project.id);
  const url = base + '/#/booklet?' + query.toString();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('.print-document', { timeout: 60000 });
  await page.evaluate(async () => { if (document.fonts?.ready) await document.fonts.ready; });
  await page.waitForTimeout(1200);
  await page.pdf({ path: output, format: 'A4', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false, margin: { top: '0', right: '0', bottom: '0', left: '0' } });
  console.log(JSON.stringify({ output, difficulty }));
} catch (error) {
  console.error('Booklet PDF export failed:', error.message);
  process.exitCode = 1;
} finally { await page.close(); await browser.close(); }
