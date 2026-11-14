// Renders branding/og-image.html to public/og-image.png (1200×630) for social
// share cards. Run: node branding/render-og-image.mjs
import { chromium } from 'playwright-core';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = pathToFileURL(path.join(here, 'og-image.html')).href;
const target = path.join(here, '..', 'public', 'og-image.png');

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(source);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: target, type: 'png' });
  console.log(`wrote ${target}`);
} finally {
  await browser.close();
}
