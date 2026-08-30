// Renders a booklet recipe to PDF.
//
//   npm run booklet -- --recipe booklets/recipes/s5-trig-c-2.json --variant standard --spaces \
//     --out out/s5-trig-c-2-standard.pdf
//   npm run booklet -- --recipe booklets/recipes/s5-trig-c-2.json --matrix --out-dir out/booklets
//
// Pipeline: resolve the recipe for the variant → build one HTML document (KaTeX already
// rendered in Node) → serve it on an ephemeral port → let TikZJax compile the figures that
// are not already cached → harvest the SVG into the cache → let Paged.js paginate → print.
//
// Paged.js runs only AFTER the diagrams are settled and the fonts are ready. Paginating
// first would lay out page boxes around loader placeholders, and every figure would then
// grow into (and past) the bottom of its page.
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, basename } from 'node:path';
import { chromium } from 'playwright-core';
import { loadRecipe, resolveBooklet, makeLoaders } from './resolve.mjs';
import { buildHtml, loadCss } from './build-html.mjs';
import { createTikzCache } from './tikz-cache.mjs';
import { startServer, bookletMounts } from './serve.mjs';
import { rejectStrayPositionals } from '../lib/argv.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const STALL_MS = 90_000;
const POLL_MS = 1000;

function arg(argv, name, fallback = null) {
  const i = argv.indexOf(name);
  return i !== -1 && i + 1 < argv.length ? argv[i + 1] : fallback;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForTikz(page, expected, { timeoutMs }) {
  if (!expected) return { settled: 0, timedOut: false };
  const started = Date.now();
  let lastPending = expected;
  let lastProgress = Date.now();
  for (;;) {
    const pending = await page.evaluate(() => window.__booklet.pending().length);
    if (pending === 0) return { settled: expected, timedOut: false };
    if (pending < lastPending) {
      lastPending = pending;
      lastProgress = Date.now();
      process.stderr.write(`\r  compiling diagrams: ${expected - pending}/${expected}   `);
    }
    if (Date.now() - lastProgress > STALL_MS) return { settled: expected - pending, timedOut: true, reason: 'stalled' };
    if (Date.now() - started > timeoutMs) return { settled: expected - pending, timedOut: true, reason: 'timeout' };
    await sleep(POLL_MS);
  }
}

async function renderOne(page, { model, bankSlug, cache, css, outPath, writeHtml }) {
  const { html, stats } = buildHtml(model, { cache, bankSlug, css });
  if (writeHtml) writeFileSync(writeHtml, html, 'utf8');
  return { html, stats };
}

async function main() {
  const argv = process.argv.slice(2);
  rejectStrayPositionals(argv, {
    valueFlags: ['--recipe', '--variant', '--out', '--out-dir', '--timeout-ms', '--html'],
    boolFlags: ['--spaces', '--solutions', '--short-answers', '--matrix', '--all-variants', '--no-cache', '--strict', '--headed'],
  });

  const recipeArg = arg(argv, '--recipe');
  if (!recipeArg) {
    console.error('usage: node scripts/booklet/render.mjs --recipe <recipe.json> [--variant standard] [--spaces] [--solutions] [--short-answers] [--out <file.pdf>]');
    console.error('       node scripts/booklet/render.mjs --recipe <recipe.json> --matrix --out-dir out/booklets');
    process.exit(2);
  }
  const recipe = loadRecipe(recipeArg);
  const bankSlug = Object.values(recipe.banks || {})[0];
  const loaders = makeLoaders({ rootDir: ROOT });
  const cache = createTikzCache({ enabled: !argv.includes('--no-cache') });
  const css = loadCss();

  // The CLI flags override whatever the recipe's variant asks for, and only when given.
  const overrides = {};
  if (argv.includes('--spaces')) overrides.spaces = true;
  if (argv.includes('--solutions')) overrides.solutions = true;
  if (argv.includes('--short-answers')) overrides.shortAnswers = true;

  const variantNames = Object.keys(recipe.variants || { standard: {} });
  let jobs;
  if (argv.includes('--matrix')) {
    // The matrix a teacher actually wants: a student copy with room to work, and a teacher
    // copy with the solutions, for every class variant.
    jobs = variantNames.flatMap((variant) => [
      { variant, overrides: { spaces: true, shortAnswers: false, solutions: false }, suffix: 'student' },
      { variant, overrides: { spaces: false, shortAnswers: true, solutions: true }, suffix: 'teacher' },
    ]);
  } else if (argv.includes('--all-variants')) {
    jobs = variantNames.map((variant) => ({ variant, overrides, suffix: null }));
  } else {
    jobs = [{ variant: arg(argv, '--variant', variantNames.includes('standard') ? 'standard' : variantNames[0]), overrides, suffix: null }];
  }

  const outDirArg = arg(argv, '--out-dir');
  const singleOut = arg(argv, '--out');
  if (jobs.length > 1 && !outDirArg) {
    console.error('✗ --matrix / --all-variants needs --out-dir');
    process.exit(2);
  }
  const outDir = outDirArg ? resolve(ROOT, outDirArg) : dirname(resolve(ROOT, singleOut || join('out', `${recipe.slug}.pdf`)));
  mkdirSync(outDir, { recursive: true });

  const server = await startServer({ mounts: bookletMounts({ bankSlug, rootDir: ROOT }) });
  let browser;
  try {
    browser = await chromium.launch({ headless: !argv.includes('--headed') });
  } catch {
    browser = await chromium.launch({ headless: !argv.includes('--headed'), channel: 'chrome' });
  }

  const summaries = [];
  let defects = 0;
  try {
    for (const job of jobs) {
      const started = Date.now();
      const model = resolveBooklet(recipe, job.variant, { loaders, overrides: job.overrides });
      for (const warning of model.warnings) console.error(`  ⚠ ${warning}`);

      const outPath = jobs.length === 1 && singleOut
        ? resolve(ROOT, singleOut)
        : join(outDir, `${recipe.slug}-${job.variant}${job.suffix ? `-${job.suffix}` : ''}.pdf`);

      const htmlArg = arg(argv, '--html');
      const { html, stats } = await renderOne(null, {
        model, bankSlug, cache, css, outPath,
        writeHtml: htmlArg ? resolve(ROOT, htmlArg) : null,
      });

      // The document is served from memory; only its assets come off disk.
      server.errors.length = 0;
      const inline = new Map([
        ['/booklet.html', { body: html, type: 'text/html; charset=utf-8' }],
      ]);
      const page = await browser.newPage();
      // TikZJax marks a failed compile by swapping in an image from a domain that does not
      // exist; letting it resolve costs a DNS timeout per failure.
      await page.route('**/invalid.site/**', (route) => route.abort());
      page.on('console', (msg) => {
        const text = msg.text();
        if (/tikz|error/i.test(text) && msg.type() === 'error') console.error(`  [page] ${text}`);
      });

      const serverWithDoc = await startServer({ inline, mounts: bookletMounts({ bankSlug, rootDir: ROOT }) });
      await page.goto(`${serverWithDoc.base}/booklet.html`, { waitUntil: 'load' });

      const timeoutMs = Number(arg(argv, '--timeout-ms', String(Math.max(180_000, stats.tikzPending * 2000))));
      const wait = await waitForTikz(page, stats.tikzPending, { timeoutMs });
      if (stats.tikzPending) process.stderr.write('\r');

      // Harvest before failing anything: a diagram that compiled this run should never be
      // compiled again in the next variant.
      const harvested = await page.evaluate(() => window.__booklet.harvest());
      for (const item of harvested) if (item.svg) cache.put(item.key, item.svg);
      const failed = await page.evaluate(() => window.__booklet.failRemaining());
      await page.evaluate(() => window.__booklet.fixCrops());

      const pages = await page.evaluate(() => window.__booklet.paginate());
      const overflow = await page.evaluate(() => window.__booklet.overflow());
      const cards = await page.evaluate(() => window.__booklet.cardCount());

      await page.pdf({
        path: outPath,
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
      });
      await page.close();
      await serverWithDoc.close();

      const summary = {
        out: outPath.replace(`${ROOT}\\`, '').replace(`${ROOT}/`, '').split('\\').join('/'),
        variant: job.variant,
        mode: job.suffix,
        pages,
        cards,
        expectedCards: model.expectedCards,
        blocks: stats.blocks,
        tikz: {
          total: stats.tikzTotal,
          cached: stats.tikzCached,
          compiled: stats.tikzPending - failed.length,
          failed,
        },
        overflow,
        missingAssets: [...new Set(serverWithDoc.errors)],
        ms: Date.now() - started,
      };
      summaries.push(summary);

      const bad = failed.length + overflow.length + (cards !== model.expectedCards ? 1 : 0) + summary.missingAssets.length;
      defects += bad;
      console.error(
        `${summary.out}: ${pages} page(s), ${cards}/${model.expectedCards} card(s), `
        + `${stats.blocks} block(s), figures ${stats.tikzCached} cached + ${summary.tikz.compiled} compiled`
        + `${failed.length ? `, ${failed.length} FAILED` : ''}${overflow.length ? `, ${overflow.length} overflowing page(s)` : ''}`
        + `${summary.missingAssets.length ? `, ${summary.missingAssets.length} missing asset(s)` : ''}`
        + ` (${(summary.ms / 1000).toFixed(1)}s)`,
      );
    }
  } finally {
    await browser.close();
    await server.close();
  }

  console.log(JSON.stringify({ summaries, cache: cache.stats() }, null, 2));
  if (defects && argv.includes('--strict')) process.exit(1);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  await main();
}
