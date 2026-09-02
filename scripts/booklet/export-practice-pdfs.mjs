#!/usr/bin/env node
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const arg = (name, fallback = null) => { const i = process.argv.indexOf(name); return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : fallback; };
const base = (arg('--base', 'http://127.0.0.1:5173') ?? '').replace(/\/$/, '');
const outDir = resolve(arg('--out-dir', 'output/pdf'));
const title = arg('--title', 'Pilot practice questions');
const selected = arg('--questions', null);
mkdirSync(outDir, { recursive: true });

const manifest = await (await fetch(`${base}/__booklet/bank/manifest`)).json();
const ids = selected ? selected.split(',').map((id) => id.trim()).filter(Boolean) : (manifest.questions ?? []).map((q) => q.id);
if (!ids.length) throw new Error('No approved questions are available in the Booklet Studio bank.');

let browser;
try { browser = await chromium.launch({ headless: true }); } catch { browser = await chromium.launch({ headless: true, channel: 'chrome' }); }
const page = await browser.newPage({ viewport: { width: 1400, height: 1800 }, deviceScaleFactor: 1 });
page.on('console', (message) => { if (message.type() === 'error') console.warn('[browser]', message.text()); });
const modes = [
  ['questions', 'pilot-practice-questions.pdf'],
  ['short-answers', 'pilot-practice-short-answer-key.pdf'],
  ['worked-solutions', 'pilot-practice-worked-solutions.pdf'],
];
try {
  await page.addInitScript(({ ids: selectedIds, title: draftTitle }) => { localStorage.setItem('mathsmap.practice-studio.worksheet.v3', JSON.stringify({ title: draftTitle, selectedIds, answerSpaces: {}, layoutOverrides: {}, showSpaces: true, showShortAnswers: false, showWorkedSolutions: false, sortMode: 'source' })); }, { ids, title });
  for (const [mode, filename] of modes) {
    await page.goto(`${base}/#/booklet?stage=builder&output=${encodeURIComponent(mode)}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.evaluate((value) => { const draft = JSON.parse(localStorage.getItem('mathsmap.practice-studio.worksheet.v3') || '{}'); draft.showSpaces = value === 'questions'; draft.showShortAnswers = value === 'short-answers'; draft.showWorkedSolutions = value === 'worked-solutions'; localStorage.setItem('mathsmap.practice-studio.worksheet.v3', JSON.stringify(draft)); }, mode);
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('.print-document', { timeout: 60000 });
    await page.waitForFunction((expected) => document.querySelectorAll('.preview-question .practice-question').length === expected, ids.length, { timeout: 60000 });
    await page.evaluate(async () => { if (document.fonts?.ready) await document.fonts.ready; });
    await page.waitForTimeout(1800);
    await page.pdf({ path: resolve(outDir, filename), format: 'A4', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false, margin: { top: '0', right: '0', bottom: '0', left: '0' } });
    console.log(JSON.stringify({ mode, output: resolve(outDir, filename), questions: ids.length }));
  }
} finally { await page.close(); await browser.close(); }
