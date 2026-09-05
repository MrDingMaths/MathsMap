#!/usr/bin/env node
// Local browser regression checks and optional PDF proof pages. Does not approve
// review records, publish bank content, or change the source transcription.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { validateCaptureBase } from './capture-fidelity.mjs';
import { FEEDBACK_PAGES } from './repair-integers-v2-feedback.mjs';

const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i < 0 ? fallback : process.argv[i + 1]; };
const base = validateCaptureBase(arg('--base', 'http://127.0.0.1:5173'));
const output = path.resolve(arg('--out', 'tmp/integers-feedback'));
const pdf = process.argv.includes('--pdf');
const selectedPages = arg('--pages', FEEDBACK_PAGES.join(',')).split(',').map(Number);
fs.mkdirSync(output, { recursive: true });
let browser;
try { browser = await chromium.launch({ headless: true }); }
catch { browser = await chromium.launch({ headless: true, channel: 'chrome' }); }
const page = await browser.newPage({ viewport: { width: 2400, height: 1300 } });
const proof = pdf ? await browser.newPage({ viewport: { width: 794, height: 1123 } }) : null;
const reports = [];
async function ready(target) {
  await target.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.complete ? null : new Promise((resolve) => {
      image.addEventListener('load', resolve, { once: true }); image.addEventListener('error', resolve, { once: true });
    })));
  });
  await target.waitForFunction(() => [...document.querySelectorAll('.preview-page .tikz-wrap')].every((el) => el.querySelector('.tikz-error') || [...el.querySelectorAll('svg')].some((svg) => !svg.querySelector('animate'))));
}
try {
  // Keep the proof document on the local origin so webfonts load with the same
  // permissions as the preview (about:blank can silently reject font requests).
  if (proof) await proof.goto(base, { waitUntil: 'networkidle' });
  await page.goto(`${base}/#/booklet?stage=full-import&run=computation-integers-pilot-v2&page=1`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.preview-page');
  await page.addStyleTag({ content: '.reconstruction{overflow:visible!important}.preview-frame{width:210mm!important;height:297mm!important;overflow:visible!important}.preview-page{position:relative!important;left:0!important;transform:none!important}' });
  for (const pageNumber of selectedPages) {
    await page.locator('.page-list button').filter({ hasText: new RegExp(`^Page ${pageNumber}(?:Review|Accepted)$`) }).click();
    await page.waitForSelector(`[data-review-page="${pageNumber}"] .preview-page`);
    for (const mode of ['student', 'hidden-theory', 'short', 'worked']) {
      await page.locator('.preview-controls select').selectOption(mode === 'hidden-theory' ? 'student' : mode);
      await page.locator('.preview-controls label').filter({ hasText: 'Theory solutions' }).locator('input').setChecked(mode !== 'hidden-theory');
      await ready(page);
      const metrics = await page.locator('.preview-page').evaluate((root) => {
        const rect = (el) => el.getBoundingClientRect();
        const footer = root.querySelector('.booklet-footer');
        const main = root.querySelector('main');
        return {
          failedAssets: [...root.querySelectorAll('img')].filter((img) => !img.complete || img.naturalWidth === 0).length,
          failedTikz: [...root.querySelectorAll('.tikz-wrap')].filter((el) => !el.querySelector('svg')?.viewBox?.baseVal?.width || el.querySelector('.tikz-error, animate')).length,
          footerCollision: !!main && [...main.children].some((el) => rect(el).bottom > rect(footer).top),
          horizontalOverflow: [...root.querySelectorAll('main *')].some((el) => !el.closest('.katex-mathml') && rect(el).width && rect(el).right > rect(root).right + 1),
          mathErrors: root.querySelectorAll('.katex-error').length,
        };
      });
      assert.equal(metrics.failedAssets, 0, `${pageNumber}/${mode}: missing image`);
      assert.equal(metrics.failedTikz, 0, `${pageNumber}/${mode}: missing/empty diagram`);
      assert.equal(metrics.mathErrors, 0, `${pageNumber}/${mode}: invalid maths`);
      assert.equal(metrics.footerCollision, false, `${pageNumber}/${mode}: footer collision`);
      assert.equal(metrics.horizontalOverflow, false, `${pageNumber}/${mode}: horizontal overflow`);
      if (mode === 'student') {
        if (pageNumber === 1) assert.ok(await page.locator('.booklet-cover').evaluate((el) => el.querySelector('.accent-bar').getBoundingClientRect().bottom + 4 < el.querySelector('.booklet-footer').getBoundingClientRect().top));
        if (pageNumber === 29) {
          const header = page.locator('[data-header-kind="investigation"]');
          assert.ok(await header.evaluate((el) => el.classList.contains('red') && el.querySelectorAll('circle').length === 2));
          assert.ok(!(await header.innerText()).includes('Investigation'));
        }
        if (pageNumber === 30) {
          assert.equal(await page.locator('[data-header-kind="identify"] circle').count(), 1);
          assert.equal(await page.locator('.example-column').count(), 3);
          assert.equal(await page.locator('.example-column .theory-step b').count(), 0);
          assert.ok(await page.locator('.example-columns').evaluate((el) => {
            const cells = [...el.children]; const top = cells[0].getBoundingClientRect().top;
            return cells.every((cell) => Math.abs(cell.getBoundingClientRect().top - top) < 1 && cell.querySelector('.theory-solution').getBoundingClientRect().top >= cell.querySelector('.stacked-prompt').getBoundingClientRect().bottom);
          }));
        }
        if ([31, 33].includes(pageNumber)) assert.equal(await page.locator('.difficulty-heading').innerText(), 'FOUNDATION');
        if (pageNumber === 31) {
          assert.equal(await page.locator('.rewrite-line').count(), 0);
          assert.equal(await page.locator('.rewrite-blank').count(), 16);
          assert.ok(await page.locator('.rewrite-calculation').evaluateAll((cells) => cells.every((cell) => cell.children[1].getBoundingClientRect().left - cell.children[0].getBoundingClientRect().right >= 6)));
        }
        if (pageNumber === 32) {
          assert.equal(await page.locator('.theory-rule').count(), 2);
          assert.equal(await page.locator('.theory-rule li').count(), 4);
          assert.equal(await page.locator('.worked-example-row .theory-step b').count(), 4);
          assert.equal(await page.locator('[data-question-id="page-32-guided-practice"] .answer-space').count(), 0);
          assert.ok(await page.locator('.example-illustration svg').evaluateAll((svgs) => svgs.length === 2 && svgs.every((svg) => {
            const axis = [...svg.querySelectorAll('path')].find((p) => /L/.test(p.getAttribute('d')) && p.getBBox().height === 0);
            const arcs = [...svg.querySelectorAll('g[stroke="#b30000"] path')];
            return axis && arcs.length && arcs.every((arc) => arc.getBoundingClientRect().bottom < axis.getBoundingClientRect().top);
          })));
        }
        if (pageNumber === 37) assert.equal((await page.locator('.preview-page').innerText()).match(/NAPLAN C/g)?.length, 1);
        if (pageNumber === 46) assert.ok(await page.locator('.preview-page figure img').evaluateAll((imgs) => imgs.length === 2 && imgs.every((img) => getComputedStyle(img).filter.includes('grayscale(1)'))));
      }
      if (pageNumber === 32 && mode === 'hidden-theory') {
        assert.equal(await page.locator('.example-illustration svg g[stroke="#b30000"]').count(), 0);
        assert.equal(await page.locator('.theory-solution').count(), 0);
      }
      const stem = `${mode}-${String(pageNumber).padStart(3, '0')}`;
      await page.locator('.preview-page').screenshot({ path: path.join(output, stem + '.png') });
      if (proof && mode !== 'hidden-theory') {
        const html = await page.evaluate(() => ({ styles: [...document.querySelectorAll('head style, head link[rel="stylesheet"]')].map((el) => el.outerHTML).join('\n'), body: document.querySelector('.preview-page').outerHTML }));
        await proof.setContent(`<!doctype html><html><head><base href="${base}/">${html.styles}<style>@page{size:A4;margin:0}html,body{margin:0!important;padding:0!important;background:white!important;min-height:0!important}.preview-page{position:static!important;left:auto!important;transform:none!important;width:210mm!important}.booklet-page,.booklet-cover{print-color-adjust:exact;-webkit-print-color-adjust:exact}</style></head><body>${html.body}</body></html>`, { waitUntil: 'networkidle' });
        await ready(proof);
        await proof.pdf({ path: path.join(output, stem + '.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
      }
      reports.push({ pageNumber, mode, ...metrics });
    }
    console.log(`Checked source page ${pageNumber}`);
  }
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ checkedAt: new Date().toISOString(), reports }, null, 2));
  console.log(`${reports.length} page/mode checks passed; output: ${output}`);
} finally { await browser.close(); }
