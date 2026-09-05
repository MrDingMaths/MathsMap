// Browser regressions use intercepted review writes: never modify the pilot.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright-core';
let browser;
try { browser = await chromium.launch({ headless: true }); } catch { browser = await chromium.launch({ headless: true, channel: 'chrome' }); }
const page = await browser.newPage({ viewport: { width: 2400, height: 1400 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const edits = [];
await page.route('**/review/content', async (route) => {
  edits.push(route.request().postDataJSON());
  const response = await page.request.get('http://127.0.0.1:5173/__booklet/full-imports/computation-integers-pilot-v2');
  await route.fulfill({ json: await response.json() });
});
try {
  await page.goto('http://127.0.0.1:5173/#/booklet?stage=full-import&run=computation-integers-pilot-v2&page=37', { waitUntil: 'networkidle' });
  await page.waitForSelector('.preview-page');
  await page.getByLabel('Review content').selectOption('short');
  await page.getByLabel('Edit preview', { exact: true }).check();
  const field = page.locator('[data-edit-root="page-37-q10-content"][data-edit-path="/answer/short"]');
  await field.locator('.katex').first().waitFor();
  await field.locator('.clickable').click();
  assert.equal(await page.locator('.editor-surface').evaluate((el) => el === document.activeElement), true);
  await page.keyboard.type('S');
  assert.equal(page.context().pages().length, 1);
  await page.keyboard.press('Control+z');
  await page.locator('.editor-surface [data-node-type="math"]').first().click();
  await page.getByLabel('Equation (LaTeX, without dollar signs)').fill('-270^\\circ\\text{C}');
  await page.getByRole('button', { name: 'Apply equation', exact: true }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('.maths-editor'));
  assert.equal(edits[0]?.value, '$-270^\\circ\\text{C}$');
  await field.locator('.katex').first().waitFor(); // mocked response restores raw original
  await field.locator('.clickable').click();
  await page.getByTitle('Insert fraction', { exact: true }).click();
  await page.getByLabel('Equation (LaTeX, without dollar signs)').fill('\\frac{1}{2}');
  await page.getByRole('button', { name: 'Apply equation', exact: true }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('.maths-editor'));
  assert.ok(edits[1]?.value.includes('$\\frac{1}{2}$'), 'palette equation retains structured maths');
  await page.getByRole('button', { name: 'Mappings', exact: true }).click();
  assert.ok((await page.locator('.full-import-shell').innerText()).includes('No skills assigned yet'));
  await page.getByRole('button', { name: 'Diagrams', exact: true }).click();
  await page.waitForFunction(() => [...document.querySelectorAll('.diagram-record .tikz-wrap')].every((el) => [...el.querySelectorAll('svg')].some((svg) => !svg.querySelector('animate')) || el.querySelector('.tikz-error')));
  assert.ok(await page.locator('.diagram-comparison').count() > 0);
  assert.equal(await page.locator('.diagram-record .tikz-error').count(), 0);
  fs.mkdirSync('tmp/review-usability', { recursive: true });
  await page.locator('.diagram-record').first().screenshot({ path: 'tmp/review-usability/diagram-comparison.png' });
  assert.deepEqual(errors, []);
  console.log('Editor focus, S typing, equation save, restored maths, mapping explanation and diagram comparison passed. No pilot writes.');
} finally { await browser.close(); }
