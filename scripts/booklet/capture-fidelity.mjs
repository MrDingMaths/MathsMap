import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { applyContentOverrides, contentHash } from './transcription.mjs';

const pad = (value) => String(value).padStart(3, '0');

export function validateCaptureBase(value) {
  const url = new URL(String(value ?? ''));
  if (!['http:', 'https:'].includes(url.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new Error('Fidelity capture is restricted to the local Booklet Studio server');
  }
  return url.origin;
}

async function visualReady(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.complete ? null : new Promise((resolve) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', resolve, { once: true });
    })));
  });
  await page.waitForFunction(() => [...document.querySelectorAll('.tikz-wrap')].every((element) =>
    element.querySelector('.tikz-error') || [...element.querySelectorAll('svg')].some((svg) => !svg.querySelector('animate'))), null, { timeout: 120_000 }).catch(() => {});
  await page.waitForTimeout(250);
}

async function selectMode(page, solutionMode, showTheorySolutions) {
  await page.locator('.preview-controls select').selectOption(solutionMode);
  const theory = page.locator('.preview-controls label').filter({ hasText: 'Theory solutions' }).locator('input');
  if (showTheorySolutions) await theory.check(); else await theory.uncheck();
  await visualReady(page);
}

async function previewMetrics(page) {
  return page.locator('.preview-page').evaluate((preview) => {
    const article = preview.querySelector('.booklet-page');
    const main = article?.querySelector('main');
    const footer = article?.querySelector('.booklet-footer');
    const failedAssets = [...preview.querySelectorAll('img')].filter((image) => !image.complete || image.naturalWidth === 0).length;
    const failedTikz = [...preview.querySelectorAll('.tikz-wrap')].filter((wrapper) => {
      const svg = wrapper.querySelector('svg');
      const box = svg?.viewBox?.baseVal;
      return wrapper.querySelector('.tikz-error') || !svg || svg.querySelector('animate') || !box || box.width <= 0 || box.height <= 0;
    }).length;
    const rawText = preview.textContent ?? '';
    const content = main ? [...main.children].filter((element) => element.getClientRects().length) : [];
    const contentBottom = content.length ? Math.max(...content.map((element) => element.getBoundingClientRect().bottom)) : 0;
    const contentRight = article ? Math.max(article.getBoundingClientRect().right, ...[...article.querySelectorAll('*')].filter((element) => element.getClientRects().length && !element.closest('.katex-mathml')).map((element) => element.getBoundingClientRect().right)) : 0;
    const footerCollision = Boolean(footer && contentBottom > footer.getBoundingClientRect().top - .5);
    return {
      horizontalOverflow: Boolean(article && contentRight > article.getBoundingClientRect().right + 1),
      verticalOverflow: Boolean(main && contentBottom > main.getBoundingClientRect().bottom + 1),
      footerCollision,
      failedAssets,
      failedTikz,
      rawMarkup: /&#x?\w+;|```|\|\s*[-:]{3,}\s*\|/.test(rawText),
    };
  });
}

export async function captureFidelityEvidence(runDir, { base } = {}) {
  const root = path.resolve(runDir);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8').replace(/^\uFEFF/, ''));
  const transcription = JSON.parse(fs.readFileSync(path.join(root, 'merged', 'transcription.json'), 'utf8').replace(/^\uFEFF/, ''));
  const review = JSON.parse(fs.readFileSync(path.join(root, 'review.json'), 'utf8').replace(/^\uFEFF/, ''));
  const effectiveHash = contentHash(applyContentOverrides(transcription, review));
  const layoutHash = contentHash(review.layoutOverrides ?? {});
  const origin = validateCaptureBase(base);
  const outputRoot = path.join(root, 'evidence', 'reconstructed');
  fs.mkdirSync(outputRoot, { recursive: true });
  for (const mode of ['hidden-theory', 'short', 'worked']) fs.mkdirSync(path.join(outputRoot, mode), { recursive: true });
  let browser;
  try { browser = await chromium.launch({ headless: true }); }
  catch { browser = await chromium.launch({ headless: true, channel: 'chrome' }); }
  // Keep the complete side-by-side review workspace in the viewport. A narrow
  // viewport can clip the right edge of the A4 page and report false overflow.
  const page = await browser.newPage({ viewport: { width: 2400, height: 1300 }, deviceScaleFactor: 1 });
  const pages = [];
  try {
    const query = new URLSearchParams({ stage: 'full-import', run: manifest.id, page: String(manifest.selectedPages[0]) });
    await page.goto(origin + '/#/booklet?' + query, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.addStyleTag({ content: '.reconstruction{overflow:visible!important}.preview-frame{width:210mm!important;height:297mm!important;overflow:visible!important}.preview-page{position:relative!important;left:0!important;transform:none!important}' });
    for (const [pageIndex, pageNumber] of manifest.selectedPages.entries()) {
      if (pageIndex > 0) await page.locator('.page-list button').nth(pageIndex).click();
      await page.waitForSelector('[data-review-page="' + pageNumber + '"] .preview-page', { timeout: 60_000 });
      await page.evaluate(() => {
        const frame = document.querySelector('.preview-frame');
        const preview = document.querySelector('.preview-page');
        if (frame) { frame.style.width = '210mm'; frame.style.height = '297mm'; frame.style.overflow = 'visible'; }
        if (preview) { preview.style.position = 'relative'; preview.style.left = '0'; preview.style.transform = 'none'; }
      });
      const modes = [
        ['student', true, path.join(outputRoot, 'page-' + pad(pageNumber) + '.png')],
        ['student', false, path.join(outputRoot, 'hidden-theory', 'page-' + pad(pageNumber) + '.png')],
        ['short', true, path.join(outputRoot, 'short', 'page-' + pad(pageNumber) + '.png')],
        ['worked', true, path.join(outputRoot, 'worked', 'page-' + pad(pageNumber) + '.png')],
      ];
      const reports = [];
      for (const [mode, theory, file] of modes) {
        await selectMode(page, mode, theory);
        const metrics = await previewMetrics(page);
        await page.locator('.preview-page').screenshot({ path: file, animations: 'disabled' });
        reports.push({ mode, showTheorySolutions: theory, file: path.relative(root, file).replaceAll(path.sep, '/'), ...metrics });
      }
      pages.push({ pageNumber, modes: reports });
    }
  } finally {
    await page.close();
    await browser.close();
  }
  const report = { format: 'mathsmap-booklet-fidelity-capture-v1', runId: manifest.id, contentHash: effectiveHash, layoutHash, capturedAt: new Date().toISOString(), base: origin, pages };
  fs.writeFileSync(path.join(outputRoot, 'report.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');
  return report;
}
