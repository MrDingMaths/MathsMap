#!/usr/bin/env node

import { constants as fsConstants } from 'node:fs';
import { access, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createInterface } from 'node:readline/promises';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import {
  DEFAULT_LIMIT_PER_SORT,
  DEFAULT_TOP_PER_LEAF,
  assessAdaptiveShortlist,
  categoryIdentityKey,
  createRetrievalPolicy,
  createEmptyCaptureState,
  createTaxonomyProgress,
  enumerateLeafCategoriesResumable,
  fuseRankedQuestions,
  isExcludedCategoryName,
  mergeCandidateState,
  normalizeCategoryName,
  parseEmbeddedFixtureHtml,
  pathKey,
  rankFixtureCatalog,
  recordTaxonomy,
  retryWithBackoff,
  retrievalPolicyFingerprint,
  retrievalPoliciesEqual,
  resolveRequestedLeaf,
  sha256,
  slugify,
  stableQuestionId,
  subjectIdFromUrl
} from './capture-core.mjs';

export const DEFAULT_SOURCE_URL =
  'https://diagnosticquestions.com/Questions?CurrentSubjectId=3&OrderBy=Newest&IsByStudent=False';
export const AUTH_STATE_FILENAME = 'storage-state.json';

export const DEFAULT_SELECTORS = Object.freeze({
  ready: 'body',
  categoryItems: '.list-group-item:not(.active):not(.questions-index__random), [data-category-id], [data-subject-id], .subject-list li, .subjects-list li, .category-list li',
  categoryExclude: ['my questions', 'random question on maths'],
  questionCards: '.thumbnail--quiz-free, [data-question-id], .question-card, .question-container, .questiontile',
  questionIdAttributes: ['data-questionid', 'data-question-id', 'data-id', 'questionid'],
  questionLink: 'a[href*="/Questions/Go/"], a[href*="Question"], a[href*="question"]',
  questionImage: 'img',
  likeCount: '.thumbnail__action--like span, [data-like-count], .like-count, .likes, .icon-heart + span',
  responseData: '[data-misconception-rate], [data-response-count], .response-count',
  sortControl: '#questions-order-by, select.order-questions-by',
  sortLabels: {
    liked: ['Most Likes', 'Most Liked', 'Most Popular'],
    misconceptions: ['Most Misconceptions', 'Misconceptions']
  },
  loadMore: 'button:has-text("Load more"), a:has-text("Load more")',
  nextPage: 'a[rel="next"], .pagination .next:not(.disabled) a, .pagination a:has-text("Next")',
  loginMarkers: 'input[type="password"], form[action*="Login"], a:has-text("Log in")'
});

function usage() {
  return `Diagnostic Questions capture pipeline

Usage:
  node scripts/dq/capture.mjs login [options]
  node scripts/dq/capture.mjs discover [options]
  node scripts/dq/capture.mjs crawl [options]
  node scripts/dq/capture.mjs fixture --fixture <saved.html> [options]

Commands:
  login      Open system Chrome with the persistent profile and wait for manual login.
  discover   Inventory DOM selectors and response URLs without selecting answers.
  crawl      Traverse leaf categories, fuse rankings, and optionally capture cards.
  fixture    Exercise taxonomy/ranking against a saved, embedded JSON HTML fixture.

Options:
  --source-url <url>       Source listing URL (default: Diagnostic Questions Maths).
  --archive <dir>          Runtime archive (default: .diagnostic-questions).
  --selectors <json>       Override any selector configuration value.
  --chrome <path>          Explicit system Chrome/Chromium executable.
  --limit-per-sort <n>     Fixed results per sort; disables adaptive retrieval.
  --top <n>                Shortlist size per leaf (default: 10).
  --max-depth <n>          Taxonomy recursion guard (default: 12).
  --leaf-path <a > b > c>  Crawl one known leaf directly (pilot/resume aid).
  --force-source-ids <ids> Force recapture of comma-separated source IDs in completed leaves.
  --refresh-taxonomy       Discard cached discovery progress and rediscover all categories.
  --write                  Persist state and PNGs. Crawl is dry-run by default.
  --headless               Run crawl/discovery without a visible browser.
  --fixture <html>         Saved fixture for the fixture command.
  --help                   Show this message.

The profile, state, and PNGs live below the archive directory. Keep that directory
gitignored. No password or cookie is copied into tracked configuration.`;
}

export function parseArgs(argv) {
  const args = [...argv];
  const first = args.shift();
  const command = !first || first === '--help' ? 'help' : first;
  const options = { command, write: false, headless: false };
  const booleanFlags = new Set(['write', 'headless', 'help', 'refreshTaxonomy']);
  while (args.length) {
    const token = args.shift();
    if (!token.startsWith('--')) throw new Error(`Unexpected argument: ${token}`);
    const key = token.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    if (booleanFlags.has(key)) {
      options[key] = true;
      continue;
    }
    const value = args.shift();
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${token}`);
    options[key] = value;
  }
  for (const key of ['limitPerSort', 'top', 'maxDepth']) {
    if (options[key] !== undefined) {
      options[key] = Number.parseInt(options[key], 10);
      if (!Number.isInteger(options[key]) || options[key] < 1) throw new Error(`--${key} must be a positive integer`);
    }
  }
  options.forceSourceIds = String(options.forceSourceIds ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return options;
}

async function exists(filePath) {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function discoverSystemChrome(explicitPath) {
  const candidates = explicitPath ? [explicitPath] : process.platform === 'win32'
    ? [
        path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Google/Chrome/Application/chrome.exe'),
        path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google/Chrome/Application/chrome.exe'),
        path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
        path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Microsoft/Edge/Application/msedge.exe')
      ]
    : process.platform === 'darwin'
      ? [
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
        ]
      : [
          '/usr/bin/google-chrome',
          '/usr/bin/google-chrome-stable',
          '/usr/bin/chromium',
          '/usr/bin/chromium-browser'
        ];
  for (const candidate of candidates.filter(Boolean)) {
    if (await exists(candidate)) return candidate;
  }
  throw new Error('System Chrome/Chromium was not found. Pass its executable with --chrome <path>.');
}

async function loadSelectors(filePath) {
  if (!filePath) return structuredClone(DEFAULT_SELECTORS);
  const overrides = JSON.parse(await readFile(path.resolve(filePath), 'utf8'));
  return {
    ...structuredClone(DEFAULT_SELECTORS),
    ...overrides,
    sortLabels: { ...DEFAULT_SELECTORS.sortLabels, ...(overrides.sortLabels || {}) }
  };
}

async function atomicJsonWrite(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(temporary, filePath);
}

async function loadState(statePath, sourceUrl) {
  if (!(await exists(statePath))) return createEmptyCaptureState(sourceUrl);
  const state = JSON.parse(await readFile(statePath, 'utf8'));
  if (state.version !== 1) throw new Error(`Unsupported capture state version: ${state.version}`);
  if (state.sourceUrl !== sourceUrl) {
    throw new Error(`Capture state belongs to a different source URL: ${state.sourceUrl}`);
  }
  return state;
}

/**
 * Playwright's persistent Chrome profile does not reliably retain session
 * cookies between launches. Restore the explicitly-saved state before the
 * first navigation of every command. The archive is gitignored because this
 * file contains authentication material.
 */
export async function restoreBrowserStorageState(context, archivePath) {
  const statePath = path.join(archivePath, AUTH_STATE_FILENAME);
  if (!(await exists(statePath))) return false;
  const state = JSON.parse(await readFile(statePath, 'utf8'));
  if (Array.isArray(state.cookies) && state.cookies.length) {
    await context.addCookies(state.cookies);
  }
  if (Array.isArray(state.origins) && state.origins.length) {
    await context.addInitScript((origins) => {
      const current = origins.find((entry) => entry.origin === globalThis.location?.origin);
      for (const item of current?.localStorage || []) {
        globalThis.localStorage?.setItem(item.name, item.value);
      }
    }, state.origins);
  }
  return true;
}

export async function saveBrowserStorageState(context, archivePath) {
  const state = await context.storageState();
  const statePath = path.join(archivePath, AUTH_STATE_FILENAME);
  await atomicJsonWrite(statePath, state);
  return statePath;
}

async function openContext(options, archivePath) {
  const executablePath = await discoverSystemChrome(options.chrome);
  const profilePath = path.join(archivePath, 'profile');
  await mkdir(profilePath, { recursive: true });
  const context = await chromium.launchPersistentContext(profilePath, {
    executablePath,
    headless: Boolean(options.headless),
    viewport: { width: 1600, height: 1200 },
    deviceScaleFactor: 2,
    acceptDownloads: false
  });
  await restoreBrowserStorageState(context, archivePath);
  return context;
}

async function waitForSettled(page, selectors, delayMs = 650) {
  // Diagnostic Questions temporarily (and sometimes permanently in headless
  // Chrome) marks the body as hidden while its own loading overlay is active.
  // Waiting for Playwright visibility therefore times out even though the DOM,
  // taxonomy and question cards have all been populated. Attachment plus a
  // completed document is the reliable readiness boundary for this site.
  await page.locator(selectors.ready).first().waitFor({ state: 'attached', timeout: 20_000 });
  await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: 20_000 });
  await page.waitForTimeout(delayMs);
}

async function listCategoryNames(page, selectors, currentPath = []) {
  return (await listCategoryNodes(page, selectors, currentPath)).map((node) => node.label);
}

async function listCategoryNodes(page, selectors, currentPath = []) {
  const locator = page.locator(selectors.categoryItems);
  const count = await locator.count();
  const nodes = [];
  const seen = new Set();
  for (let index = 0; index < count; index += 1) {
    const item = locator.nth(index);
    const label = normalizeCategoryName(await item.textContent().catch(() => ''));
    if (!label || isExcludedCategoryName(label, selectors.categoryExclude)) continue;
    const href = await item.getAttribute('href').catch(() => null);
    const url = href ? new URL(href, page.url()) : null;
    if (url) url.hash = '';
    const node = {
      label,
      categoryPath: [...currentPath, label],
      url: url?.href || null,
      subjectId: subjectIdFromUrl(url)
    };
    const identity = categoryIdentityKey(node);
    if (seen.has(identity)) continue;
    seen.add(identity);
    nodes.push(node);
  }
  return nodes;
}

async function clickCategory(page, name, selectors) {
  const locator = page.locator(selectors.categoryItems);
  const count = await locator.count();
  const seen = [];
  for (let index = 0; index < count; index += 1) {
    const item = locator.nth(index);
    const candidate = normalizeCategoryName(await item.textContent().catch(() => ''));
    if (candidate) seen.push(candidate);
    if (candidate.localeCompare(name, undefined, { sensitivity: 'base' }) === 0) {
      const href = await item.getAttribute('href').catch(() => null);
      if (href) await page.goto(new URL(href, page.url()).href, { waitUntil: 'domcontentloaded' });
      else await item.click({ force: true });
      await waitForSettled(page, selectors);
      return;
    }
  }
  throw new Error(`Selector drift: category not found: ${name}; saw ${count} item(s): ${seen.join(' | ')}`);
}

async function navigateCategoryPath(page, sourceUrl, categoryPath, selectors) {
  await retryWithBackoff(async () => {
    await page.goto(sourceUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForSettled(page, selectors);
  });
  for (const name of categoryPath) await clickCategory(page, name, selectors);
}

export async function navigateCategoryTarget(page, sourceUrl, category, selectors) {
  if (!Array.isArray(category) && category?.url) {
    await retryWithBackoff(async () => {
      if (page.url() !== category.url) {
        await page.goto(category.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      }
      await waitForSettled(page, selectors);
    });
    return;
  }
  const categoryPath = Array.isArray(category) ? category : category?.categoryPath || [];
  await navigateCategoryPath(page, sourceUrl, categoryPath, selectors);
}

function leafRunKey(category) {
  if (Array.isArray(category)) return pathKey(category);
  const identity = categoryIdentityKey(category);
  return identity.startsWith('path:') ? identity.slice(5) : identity;
}

function existingLeafRunKey(state, category) {
  const identityKey = leafRunKey(category);
  if (state.leafRuns?.[identityKey]) return identityKey;
  if (!Array.isArray(category) && category?.categoryPath) {
    const legacyKey = pathKey(category.categoryPath);
    if (state.leafRuns?.[legacyKey]) return legacyKey;
  }
  return identityKey;
}

async function authLooksExpired(page, selectors) {
  const urlSuggestsLogin = /\b(login|signin)\b/i.test(page.url());
  const markerVisible = await page.locator(selectors.loginMarkers).first().isVisible().catch(() => false);
  return urlSuggestsLogin || markerVisible;
}

async function applySort(page, sort, selectors) {
  const labels = selectors.sortLabels?.[sort] || [];
  const select = page.locator(selectors.sortControl).first();
  if ((await select.count()) === 0) {
    throw new Error(`Selector drift: sort control not found (${selectors.sortControl})`);
  }
  const options = await select.locator('option').evaluateAll((nodes) =>
    nodes.map((node) => ({ value: node.value, label: (node.textContent || '').trim() }))
  );
  const wanted = options.find((option) => labels.some((label) =>
    option.label.toLowerCase().includes(label.toLowerCase())
  ));
  if (!wanted) throw new Error(`Sort option not found for ${sort}; saw: ${options.map((option) => option.label).join(', ')}`);
  await select.selectOption(wanted.value);
  await page.waitForTimeout(900);
}

async function extractCard(card, selectors, pageUrl) {
  const raw = await card.evaluate((element, config) => {
    const text = (element.innerText || '').replace(/\s+/g, ' ').trim();
    const attr = (names) => {
      for (const name of names || []) {
        const value = element.getAttribute(name);
        if (value) return value;
        const descendant = element.querySelector(`[${CSS.escape(name)}]`);
        const nestedValue = descendant?.getAttribute(name);
        if (nestedValue) return nestedValue;
      }
      return '';
    };
    const link = config.questionLink ? element.querySelector(config.questionLink) : null;
    const image = config.questionImage ? element.querySelector(config.questionImage) : null;
    const likes = config.likeCount ? element.querySelector(config.likeCount) : null;
    const responseNodes = config.responseData ? [...element.querySelectorAll(config.responseData)] : [];
    return {
      sourceId: attr(config.questionIdAttributes),
      text,
      questionUrl: link?.href || '',
      imageUrl: image?.currentSrc || image?.src || '',
      likesText: (likes?.textContent || '').trim(),
      responseData: responseNodes.map((node) => ({
        text: (node.textContent || '').replace(/\s+/g, ' ').trim(),
        misconceptionRate: node.getAttribute('data-misconception-rate'),
        responseCount: node.getAttribute('data-response-count')
      }))
    };
  }, selectors);
  if (!raw.sourceId) {
    const identifyingUrl = raw.questionUrl || raw.imageUrl;
    const match = identifyingUrl.match(/(?:question(?:id)?[=/\-_]|\/)(\d{3,})(?:\D|$)/i);
    if (match) raw.sourceId = match[1];
  }
  raw.questionUrl = raw.questionUrl || pageUrl;
  raw.likes = Number.parseInt((raw.likesText.match(/[\d,]+/) || [''])[0].replace(/,/g, ''), 10) || null;
  raw.sourceId = stableQuestionId(raw);
  return raw;
}

async function advanceResults(page, selectors, previousCount) {
  const previousUrl = page.url();
  const loadMore = page.locator(selectors.loadMore).first();
  if (await loadMore.isVisible().catch(() => false)) {
    await loadMore.click();
  } else if (selectors.nextPage && (await page.locator(selectors.nextPage).count()) > 0) {
    const next = page.locator(selectors.nextPage).first();
    const href = await next.getAttribute('href');
    if (href) {
      await page.goto(new URL(href, page.url()).href, { waitUntil: 'domcontentloaded' });
      await waitForSettled(page, selectors);
    } else {
      await next.click({ force: true });
      await waitForSettled(page, selectors);
    }
  } else {
    const scrolled = await page.evaluate(() => {
      const body = document.body;
      if (!body) return false;
      window.scrollTo(0, body.scrollHeight);
      return true;
    }).catch(() => false);
    if (!scrolled) await page.waitForLoadState?.('domcontentloaded').catch(() => {});
  }
  await page.waitForTimeout(850);
  return page.url() !== previousUrl || (await page.locator(selectors.questionCards).count()) > previousCount;
}

async function collectRankedCards(page, selectors, limit) {
  const result = [];
  const seen = new Set();
  let stagnantPasses = 0;
  while (result.length < limit && stagnantPasses < 2) {
    const cards = page.locator(selectors.questionCards);
    const count = await cards.count();
    for (let index = 0; index < count && result.length < limit; index += 1) {
      const card = cards.nth(index);
      const question = await extractCard(card, selectors, page.url());
      if (seen.has(question.sourceId)) continue;
      seen.add(question.sourceId);
      result.push(question);
    }
    if (result.length >= limit) break;
    const advanced = await advanceResults(page, selectors, count);
    stagnantPasses = advanced ? 0 : stagnantPasses + 1;
  }
  return result;
}

async function checksumFile(filePath) {
  return sha256(await readFile(filePath));
}

async function waitForCardImage(card, selectors) {
  const image = card.locator(selectors.questionImage).first();
  if ((await image.count()) === 0) throw new Error('Question card has no image element');
  await card.evaluate((element) => element.scrollIntoView({ block: 'center', inline: 'nearest' }));
  await image.evaluate((element) => {
    if (element.complete && element.naturalWidth > 0 && element.naturalHeight > 0) return;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Question image did not load within 15 seconds')), 15_000);
      const finish = () => {
        clearTimeout(timeout);
        if (element.naturalWidth > 0 && element.naturalHeight > 0) resolve();
        else reject(new Error('Question image loaded without usable dimensions'));
      };
      element.addEventListener('load', finish, { once: true });
      element.addEventListener('error', finish, { once: true });
    });
  });
}

async function screenshotQuestion(card, page, selectors, { sourceOnly = false, sourceId = '' } = {}) {
  if (!sourceOnly) {
    return card.screenshot({
      animations: 'disabled',
      caret: 'hide',
      scale: 'device',
      type: 'png'
    });
  }

  const image = card.locator(selectors.questionImage).first();
  const marker = `dq-source-capture-${slugify(sourceId)}`;
  await image.evaluate((element, captureMarker) => {
    document.querySelectorAll(`[data-dq-source-capture="${captureMarker}"]`).forEach((node) => node.remove());
    const clone = element.cloneNode(false);
    clone.setAttribute('data-dq-source-capture', captureMarker);
    clone.removeAttribute('loading');
    clone.style.cssText = [
      'position:absolute',
      `left:${window.scrollX}px`,
      `top:${window.scrollY}px`,
      `width:${element.naturalWidth}px`,
      `height:${element.naturalHeight}px`,
      'max-width:none',
      'max-height:none',
      'object-fit:fill',
      'background:white',
      'z-index:2147483647',
    ].join(';');
    document.body.appendChild(clone);
  }, marker);
  const sourceImage = page.locator(`[data-dq-source-capture="${marker}"]`);
  try {
    await sourceImage.waitFor({ state: 'visible' });
    await sourceImage.evaluate((element) => {
      if (element.complete && element.naturalWidth > 0 && element.naturalHeight > 0) return;
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Source image clone did not load within 15 seconds')), 15_000);
        const finish = () => {
          clearTimeout(timeout);
          if (element.naturalWidth > 0 && element.naturalHeight > 0) resolve();
          else reject(new Error('Source image clone loaded without usable dimensions'));
        };
        element.addEventListener('load', finish, { once: true });
        element.addEventListener('error', finish, { once: true });
      });
    });
    return await sourceImage.screenshot({
      animations: 'disabled',
      caret: 'hide',
      scale: 'device',
      type: 'png'
    });
  } finally {
    await sourceImage.evaluate((element) => element.remove()).catch(() => {});
  }
}

async function hasValidCapture(candidate, archivePath) {
  const capture = candidate?.capture;
  if (!capture?.pngPath || !capture?.pngChecksum) return false;
  const absolutePath = path.resolve(archivePath, capture.pngPath);
  if (!(await exists(absolutePath))) return false;
  return (await checksumFile(absolutePath)) === capture.pngChecksum;
}

export async function canResumeLeafRun(state, category, retrievalPolicy, archivePath) {
  const run = state.leafRuns?.[existingLeafRunKey(state, category)];
  if (!run?.completed || !['complete', 'empty'].includes(run.status)) return false;
  if (run.retrievalPolicyFingerprint !== retrievalPolicyFingerprint(retrievalPolicy)) return false;
  if (!retrievalPoliciesEqual(run.retrievalPolicy, retrievalPolicy)) return false;
  if (!Array.isArray(run.selectedIds)) return false;
  if (run.status === 'empty') return run.selectedIds.length === 0;
  if (run.selectedIds.length === 0) return false;
  for (const sourceId of run.selectedIds) {
    if (!(await hasValidCapture(state.candidates?.[sourceId], archivePath))) return false;
  }
  return true;
}

function preferredSort(candidate) {
  return (candidate.ranks?.liked ?? Number.POSITIVE_INFINITY) <=
    (candidate.ranks?.misconceptions ?? Number.POSITIVE_INFINITY)
    ? 'liked'
    : 'misconceptions';
}

async function captureRankedCards({
  page,
  sourceUrl,
  categoryTarget,
  categoryPath,
  candidates,
  selectors,
  limitPerSort,
  archivePath,
  state,
  statePath,
  forceSourceIds = new Set()
}) {
  const pending = [];
  for (const candidate of candidates) {
    const existing = state.candidates[candidate.sourceId];
    if (forceSourceIds.has(String(candidate.sourceId)) || !(await hasValidCapture(existing, archivePath))) {
      pending.push(candidate);
    }
  }
  for (const sort of ['liked', 'misconceptions']) {
    const wanted = new Map(pending.filter((candidate) => preferredSort(candidate) === sort)
      .map((candidate) => [candidate.sourceId, candidate]));
    if (!wanted.size) continue;
    await navigateCategoryTarget(page, sourceUrl, categoryTarget || categoryPath, selectors);
    await applySort(page, sort, selectors);
    let scanned = 0;
    const seen = new Set();
    let stagnantPasses = 0;
    while (wanted.size && scanned < limitPerSort && stagnantPasses < 2) {
      const cards = page.locator(selectors.questionCards);
      const count = await cards.count();
      for (let index = 0; index < count && scanned < limitPerSort; index += 1) {
        const card = cards.nth(index);
        const question = await extractCard(card, selectors, page.url());
        if (seen.has(question.sourceId)) continue;
        seen.add(question.sourceId);
        scanned += 1;
        const candidate = wanted.get(question.sourceId);
        if (!candidate) continue;
        await retryWithBackoff(() => waitForCardImage(card, selectors));
        const forceRecapture = forceSourceIds.has(String(candidate.sourceId));
        const buffer = await retryWithBackoff(() => screenshotQuestion(card, page, selectors, {
          sourceOnly: forceRecapture,
          sourceId: candidate.sourceId,
        }));
        const relativePngPath = path.join('png', `${slugify(question.sourceId)}.png`);
        const absolutePngPath = path.join(archivePath, relativePngPath);
        await mkdir(path.dirname(absolutePngPath), { recursive: true });
        await writeFile(absolutePngPath, buffer);
        mergeCandidateState(state, {
          ...candidate,
          ...question,
          sourceUrl,
          categoryPath,
          sourcePaths: [categoryPath],
          capture: {
            pngPath: relativePngPath.replaceAll('\\', '/'),
            pngChecksum: sha256(buffer),
            capturedAt: new Date().toISOString(),
            viewport: { width: 1600, height: 1200, deviceScaleFactor: 2 }
          }
        });
        state.updatedAt = new Date().toISOString();
        await atomicJsonWrite(statePath, state);
        wanted.delete(question.sourceId);
      }
      if (!wanted.size || scanned >= limitPerSort) break;
      const advanced = await advanceResults(page, selectors, count);
      stagnantPasses = advanced ? 0 : stagnantPasses + 1;
    }
    if (wanted.size) {
      throw new Error(`Could not relocate ${wanted.size} ranked card(s) under ${categoryPath.join(' > ')} / ${sort}`);
    }
  }
}

async function crawl(options) {
  const sourceUrl = options.sourceUrl || DEFAULT_SOURCE_URL;
  const archivePath = path.resolve(options.archive || '.diagnostic-questions');
  const statePath = path.join(archivePath, 'capture-state.json');
  const taxonomyProgressPath = path.join(archivePath, 'taxonomy-progress.json');
  const top = options.top || DEFAULT_TOP_PER_LEAF;
  const retrievalPolicy = createRetrievalPolicy({
    limitPerSort: options.limitPerSort,
    top
  });
  const selectors = await loadSelectors(options.selectors);
  const forceSourceIds = new Set(options.forceSourceIds ?? []);
  const state = await loadState(statePath, sourceUrl);
  const context = await openContext(options, archivePath);
  const page = context.pages()[0] || await context.newPage();
  try {
    await navigateCategoryPath(page, sourceUrl, [], selectors);
    if (await authLooksExpired(page, selectors)) {
      throw new Error('Authentication appears to have expired. Run the login command first.');
    }
    const requestedLeaf = options.leafPath
      ? String(options.leafPath).split(/\s*>\s*/).map(normalizeCategoryName).filter(Boolean)
      : null;
    let taxonomyResult = null;
    let leafTargets;
    let requestedNode = null;
    if (requestedLeaf) {
      const resolvedLeaf = resolveRequestedLeaf(state.taxonomy?.leafNodes, requestedLeaf);
      requestedNode = Array.isArray(resolvedLeaf) ? null : resolvedLeaf;
      leafTargets = [resolvedLeaf];
    } else {
      const source = new URL(sourceUrl);
      const root = {
        label: 'Maths',
        categoryPath: [],
        url: source.href,
        subjectId: subjectIdFromUrl(source)
      };
      let taxonomyProgress = !options.refreshTaxonomy && await exists(taxonomyProgressPath)
        ? JSON.parse(await readFile(taxonomyProgressPath, 'utf8'))
        : null;
      if (!options.refreshTaxonomy && !taxonomyProgress && state.taxonomy?.discoveredAt &&
          state.taxonomy.nodes?.length && Array.isArray(state.taxonomy.leafNodes)) {
        taxonomyProgress = createTaxonomyProgress(
          sourceUrl, root, state.taxonomy.discoveredAt, options.maxDepth || 12
        );
        taxonomyProgress.nodes = state.taxonomy.nodes;
        taxonomyProgress.leaves = state.taxonomy.leafNodes;
        taxonomyProgress.queue = [];
        taxonomyProgress.visitedIdentities = state.taxonomy.nodes.map(categoryIdentityKey);
        taxonomyProgress.visitedSubjectIds = state.taxonomy.nodes
          .map((node) => node.subjectId).filter(Boolean).map(String);
        const identityByPath = new Map(state.taxonomy.nodes.map((node) =>
          [pathKey(node.categoryPath), categoryIdentityKey(node)]
        ));
        taxonomyProgress.edges = state.taxonomy.edges?.length
          ? state.taxonomy.edges
          : state.taxonomy.nodes.flatMap((node) => {
              if (!node.categoryPath.length) return [];
              const parentIdentity = identityByPath.get(pathKey(node.categoryPath.slice(0, -1)));
              return parentIdentity ? [{
                parentIdentity,
                childIdentity: categoryIdentityKey(node)
              }] : [];
            });
        taxonomyProgress.aliases = state.taxonomy.aliases?.length
          ? state.taxonomy.aliases
          : state.taxonomy.nodes.map((node) => ({
              identity: categoryIdentityKey(node),
              categoryPath: [...node.categoryPath],
              label: node.label,
              url: node.url || null,
              subjectId: node.subjectId || null,
              parentIdentity: node.categoryPath.length
                ? identityByPath.get(pathKey(node.categoryPath.slice(0, -1))) || null
                : null
            }));
        taxonomyProgress.status = 'complete';
        taxonomyProgress.updatedAt = state.taxonomy.discoveredAt;
        if (options.write) await atomicJsonWrite(taxonomyProgressPath, taxonomyProgress);
      }
      taxonomyResult = await enumerateLeafCategoriesResumable({
        async listChildren(category) {
          const alreadyAtRoot = category.categoryPath.length === 0 &&
            subjectIdFromUrl(page.url()) === category.subjectId;
          if (alreadyAtRoot) await waitForSettled(page, selectors);
          else await navigateCategoryTarget(page, sourceUrl, category, selectors);
          if (await authLooksExpired(page, selectors)) {
            throw new Error(`Authentication expired while discovering ${category.categoryPath.join(' > ') || 'Maths'}`);
          }
          const actualSubjectId = subjectIdFromUrl(page.url());
          if (category.subjectId && actualSubjectId !== String(category.subjectId)) {
            throw new Error(`Category navigation mismatch: expected subject ${category.subjectId}, got ${actualSubjectId || 'none'}`);
          }
          const children = await listCategoryNodes(page, selectors, category.categoryPath);
          if (children.length === 0) {
            const hasListingSignal = (await page.locator(selectors.sortControl).count()) > 0;
            if (category.categoryPath.length === 0 || !hasListingSignal) {
              throw new Error(`Cannot classify category as a leaf: listing DOM is not ready at ${category.categoryPath.join(' > ') || 'Maths'}`);
            }
          }
          return children;
        }
      }, {
        sourceUrl,
        root,
        maxDepth: options.maxDepth || 12,
        progress: taxonomyProgress,
        checkpoint: options.write
          ? async (progress) => atomicJsonWrite(taxonomyProgressPath, progress)
          : async () => {},
        onProgress: ({ visited, pending, leaves: leafCount, status }) => {
          process.stderr.write(`[dq] taxonomy: ${visited} visited, ${pending} pending, ${leafCount} leaves (${status})\n`);
        }
      });
      leafTargets = taxonomyResult.leaves;
    }
    if (leafTargets.length === 0 || (leafTargets.length === 1 && leafTargets[0].length === 0)) {
      throw new Error('Selector drift: no taxonomy categories were discovered at the Maths root');
    }
    const taxonomyTimestamp = new Date().toISOString();
    recordTaxonomy(state, {
      leaves: taxonomyResult?.leaves.map((node) => node.categoryPath),
      leafNodes: taxonomyResult?.leaves,
      nodes: taxonomyResult?.nodes,
      edges: taxonomyResult?.progress?.edges,
      aliases: taxonomyResult?.progress?.aliases,
      requestedLeaf,
      requestedNode,
      recordedAt: taxonomyTimestamp
    });
    if (options.write) {
      state.updatedAt = taxonomyTimestamp;
      await atomicJsonWrite(statePath, state);
    }
    const summary = [];
    for (let leafIndex = 0; leafIndex < leafTargets.length; leafIndex += 1) {
      const categoryTarget = leafTargets[leafIndex];
      const categoryPath = Array.isArray(categoryTarget) ? categoryTarget : categoryTarget.categoryPath;
      const runKey = leafRunKey(categoryTarget);
      const resumeRunKey = existingLeafRunKey(state, categoryTarget);
      const leafLabel = categoryPath.join(' > ');
      const existingRun = state.leafRuns?.[existingLeafRunKey(state, categoryTarget)];
      const forcesThisLeaf = existingRun?.selectedIds?.some((sourceId) => forceSourceIds.has(String(sourceId)));
      if (options.write && !forcesThisLeaf && await canResumeLeafRun(state, categoryTarget, retrievalPolicy, archivePath)) {
        const run = state.leafRuns[resumeRunKey];
        summary.push({
          categoryPath,
          indexed: run.indexed,
          selected: run.selectedIds.length,
          retrievalLimit: run.retrievalLimit,
          skipped: 'complete'
        });
        process.stderr.write(`[dq] leaf ${leafIndex + 1}/${leafTargets.length}: ${leafLabel} - resumed (complete)\n`);
        continue;
      }

      process.stderr.write(`[dq] leaf ${leafIndex + 1}/${leafTargets.length}: ${leafLabel} - ranking\n`);
      try {
      let rankedBySort = { liked: [], misconceptions: [] };
      let candidates = [];
      let retrievalLimit = retrievalPolicy.limits.at(-1);
      let assessment = null;
      for (let limitIndex = 0; limitIndex < retrievalPolicy.limits.length; limitIndex += 1) {
        const limitPerSort = retrievalPolicy.limits[limitIndex];
        for (const sort of ['liked', 'misconceptions']) {
          await navigateCategoryTarget(page, sourceUrl, categoryTarget, selectors);
          await applySort(page, sort, selectors);
          rankedBySort[sort] = await collectRankedCards(page, selectors, limitPerSort);
        }
        if (retrievalPolicy.mode === 'adaptive') {
          assessment = assessAdaptiveShortlist({
            ...rankedBySort,
            limitPerSort,
            comparisonLimit: limitIndex === 0
              ? Math.max(top, Math.floor(limitPerSort / 2))
              : retrievalPolicy.limits[limitIndex - 1],
            top
          });
          candidates = assessment.candidates;
        } else {
          candidates = fuseRankedQuestions({ ...rankedBySort, limitPerSort, top });
          assessment = {
            filled: candidates.length >= top,
            stable: null,
            shouldExpand: false,
            reason: 'fixed'
          };
        }
        retrievalLimit = limitPerSort;
        const counts = `${rankedBySort.liked.length}+${rankedBySort.misconceptions.length}`;
        process.stderr.write(`[dq] leaf ${leafIndex + 1}/${leafTargets.length}: ${leafLabel} - ${counts} at ${limitPerSort}/sort, top ${candidates.length}: ${assessment.reason}\n`);
        if (!assessment.shouldExpand) break;
      }
      if (rankedBySort.liked.length === 0 && rankedBySort.misconceptions.length === 0) {
        const emptyAt = new Date().toISOString();
        const emptySummary = {
          categoryPath,
          indexed: { liked: 0, misconceptions: 0 },
          selected: 0,
          retrievalLimit,
          stable: false,
          status: 'empty'
        };
        if (options.write) {
          state.leafRuns[runKey] = {
            categoryPath,
            categoryUrl: Array.isArray(categoryTarget) ? null : categoryTarget.url,
            subjectId: Array.isArray(categoryTarget) ? null : categoryTarget.subjectId,
            indexed: emptySummary.indexed,
            selectedIds: [],
            retrievalLimit,
            retrievalPolicy,
            retrievalPolicyFingerprint: retrievalPolicyFingerprint(retrievalPolicy),
            stable: false,
            completed: true,
            status: 'empty',
            completedAt: emptyAt
          };
          state.updatedAt = emptyAt;
          await atomicJsonWrite(statePath, state);
        }
        summary.push(emptySummary);
        process.stderr.write(`[dq] leaf ${leafIndex + 1}/${leafTargets.length}: ${leafLabel} - empty (no cards under either sort)\n`);
        continue;
      }
      const leafSummary = { categoryPath, indexed: {
        liked: rankedBySort.liked.length,
        misconceptions: rankedBySort.misconceptions.length
      }, selected: candidates.length, retrievalLimit, stable: assessment.stable };
      if (options.write) {
        for (const candidate of candidates) {
          mergeCandidateState(state, {
            ...candidate,
            sourceUrl,
            categoryPath,
            sourcePaths: [categoryPath],
            sourceCategory: Array.isArray(categoryTarget) ? null : {
              label: categoryTarget.label,
              url: categoryTarget.url,
              subjectId: categoryTarget.subjectId
            }
          });
        }
        state.leafRuns[runKey] = {
          categoryPath,
          categoryUrl: Array.isArray(categoryTarget) ? null : categoryTarget.url,
          subjectId: Array.isArray(categoryTarget) ? null : categoryTarget.subjectId,
          indexed: leafSummary.indexed,
          selectedIds: candidates.map((candidate) => candidate.sourceId),
          retrievalLimit,
          retrievalPolicy,
          retrievalPolicyFingerprint: retrievalPolicyFingerprint(retrievalPolicy),
          stable: assessment.stable,
          completed: false,
          status: 'capturing',
          rankedAt: new Date().toISOString()
        };
        await atomicJsonWrite(statePath, state);
        await captureRankedCards({
          page, sourceUrl, categoryTarget, categoryPath, candidates, selectors, limitPerSort: retrievalLimit,
          archivePath, state, statePath, forceSourceIds
        });
        state.leafRuns[runKey].completed = true;
        state.leafRuns[runKey].status = 'complete';
        state.leafRuns[runKey].completedAt = new Date().toISOString();
        state.updatedAt = new Date().toISOString();
        await atomicJsonWrite(statePath, state);
      }
      summary.push(leafSummary);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const failedAt = new Date().toISOString();
        summary.push({ categoryPath, status: 'error', error: message });
        process.stderr.write(`[dq] leaf ${leafIndex + 1}/${leafTargets.length}: ${leafLabel} - ERROR: ${message}\n`);
        if (options.write) {
          state.leafRuns[runKey] = {
            ...(state.leafRuns[runKey] || {}),
            categoryPath,
            categoryUrl: Array.isArray(categoryTarget) ? null : categoryTarget.url,
            subjectId: Array.isArray(categoryTarget) ? null : categoryTarget.subjectId,
            retrievalPolicy,
            retrievalPolicyFingerprint: retrievalPolicyFingerprint(retrievalPolicy),
            completed: false,
            status: 'error',
            error: message,
            failedAt
          };
          state.updatedAt = failedAt;
          await atomicJsonWrite(statePath, state);
        }
      }
    }
    await saveBrowserStorageState(context, archivePath);
    process.stdout.write(`${JSON.stringify({ dryRun: !options.write, leaves: summary }, null, 2)}\n`);
  } finally {
    await context.close();
  }
}

async function login(options) {
  const archivePath = path.resolve(options.archive || '.diagnostic-questions');
  const selectors = await loadSelectors(options.selectors);
  const context = await openContext({ ...options, headless: false }, archivePath);
  const page = context.pages()[0] || await context.newPage();
  try {
    await page.goto(options.sourceUrl || DEFAULT_SOURCE_URL, { waitUntil: 'domcontentloaded' });
    process.stdout.write('Log in using the browser window. Return here and press Enter when the question listing is visible.\n');
    const prompt = createInterface({ input: process.stdin, output: process.stdout });
    await prompt.question('Press Enter to save the persistent browser session... ');
    prompt.close();
    const activePage = context.pages().at(-1) || page;
    if (await authLooksExpired(activePage, selectors)) {
      throw new Error('Login was not detected. Keep the question listing visible before pressing Enter.');
    }
    await saveBrowserStorageState(context, archivePath);
    process.stdout.write(`Saved browser authentication under ${archivePath}.\n`);
  } finally {
    await context.close();
  }
}

async function discover(options) {
  const archivePath = path.resolve(options.archive || '.diagnostic-questions');
  const selectors = await loadSelectors(options.selectors);
  const context = await openContext(options, archivePath);
  const page = context.pages()[0] || await context.newPage();
  const responses = new Map();
  page.on('response', (response) => {
    const contentType = response.headers()['content-type'] || '';
    if (/json|html/i.test(contentType)) responses.set(response.url(), {
      status: response.status(), contentType
    });
  });
  try {
    await page.goto(options.sourceUrl || DEFAULT_SOURCE_URL, { waitUntil: 'domcontentloaded' });
    await waitForSettled(page, selectors, 1_500);
    if (await authLooksExpired(page, selectors)) {
      throw new Error('Authentication appears to have expired. Run the login command first.');
    }
    const inventory = await page.evaluate(() => ({
      title: document.title,
      url: location.href,
      selects: [...document.querySelectorAll('select')].map((select) => ({
        id: select.id,
        name: select.getAttribute('name'),
        className: select.className,
        options: [...select.options].map((option) => ({ value: option.value, text: option.textContent?.trim() }))
      })),
      dataAttributes: [...new Set([...document.querySelectorAll('*')]
        .flatMap((element) => [...element.attributes].map((attribute) => attribute.name))
        .filter((name) => name.startsWith('data-')))].sort(),
      repeatedClasses: Object.entries([...document.querySelectorAll('[class]')]
        .flatMap((element) => String(element.className).split(/\s+/))
        .filter(Boolean)
        .reduce((counts, name) => ({ ...counts, [name]: (counts[name] || 0) + 1 }), {}))
        .filter(([, count]) => count >= 3)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 80)
      ,
      domSamples: {
        categories: [...document.querySelectorAll('.list-group-item')]
          .slice(0, 4).map((element) => element.outerHTML.slice(0, 2500)),
        questionIds: [...document.querySelectorAll('[data-questionid]')]
          .slice(0, 3).map((element) => element.outerHTML.slice(0, 2500)),
        cards: [...document.querySelectorAll('.thumbnail--quiz-free')]
          .slice(0, 2).map((element) => element.outerHTML.slice(0, 5000)),
        pagination: [...document.querySelectorAll('a[href*="page="]')]
          .slice(0, 12).map((element) => element.outerHTML.slice(0, 1200))
      }
    }));
    inventory.categorySamples = (await listCategoryNames(page, selectors)).slice(0, 30);
    inventory.responseEndpoints = [...responses.entries()].map(([url, details]) => ({ url, ...details }));
    if (options.write) {
      await atomicJsonWrite(path.join(archivePath, 'discovery.json'), inventory);
      await page.screenshot({ path: path.join(archivePath, 'discovery.png'), fullPage: true });
    }
    await saveBrowserStorageState(context, archivePath);
    process.stdout.write(`${JSON.stringify(inventory, null, 2)}\n`);
  } finally {
    await context.close();
  }
}

async function fixture(options) {
  if (!options.fixture) throw new Error('fixture command requires --fixture <saved.html>');
  const html = await readFile(path.resolve(options.fixture), 'utf8');
  const catalog = parseEmbeddedFixtureHtml(html);
  const ranked = await rankFixtureCatalog(catalog, {
    maxDepth: options.maxDepth || 12,
    limitPerSort: options.limitPerSort || DEFAULT_LIMIT_PER_SORT,
    top: options.top || DEFAULT_TOP_PER_LEAF
  });
  process.stdout.write(`${JSON.stringify(ranked, null, 2)}\n`);
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help || options.command === 'help') {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  if (options.command === 'login') return login(options);
  if (options.command === 'discover') return discover(options);
  if (options.command === 'crawl') return crawl(options);
  if (options.command === 'fixture') return fixture(options);
  throw new Error(`Unknown command: ${options.command}\n\n${usage()}`);
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  main().catch((error) => {
    process.stderr.write(`dq-capture: ${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
