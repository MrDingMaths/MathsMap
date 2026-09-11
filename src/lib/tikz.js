// TikZ rendering — content-addressed cache (memory + IndexedDB) + lazy viewport injection
// with shared-reset watchdog. Full port of mathsdatabase/js/tikz.js (757-line version),
// adapted for Svelte/ESM: the entry point is renderTikzCode(outerEl, code, {eager}) instead
// of a .tikz-placeholder DOM scan, and cancelTikzJob(outerEl) is exported for component
// unmount. Requires the PATCHED TikZJax bundle (fires `tikzjax-engine-ready`,
// CustomEvent detail on `tikzjax-load-finished`, exposes window.__tikzTeardown) — see
// scripts/tikz-patcher/ and tests/tikz-bundles.test.js.
//
// Pipeline per diagram:
//   1. Normalize source, compute cache key.
//   2. Memory-cache hit → apply immediately.
//   3. Miss → insert an empty .tikz-loading wrapper and register it in a shared
//      IntersectionObserver. Nothing compiles until the wrapper nears the viewport
//      (rootMargin 600px) — diagrams far below the fold never cost a compile at all.
//   4. On intersect (_startJob): check the persistent IndexedDB SVG cache; hit → apply.
//      Miss → lazily load the tikzjax bundle (first miss only), inject the text/tikz
//      script, arm the per-job watchdog.
//
// The tikzjax bundle is NOT loaded via a <script> tag in index.html — _ensureEngine()
// injects it on the first cache-miss job, so diagram-free (or fully cached) page views
// never pay the worker + wasm + core.dump init.
//
// Watchdog timeouts:
//   TIKZ_COLD_MS  (30 s) — first attempt: covers slow wasm download + initial TeX compile.
//   TIKZ_WARM_MS  (8 s)  — post-reset attempts: wasm is cached, only a true bad source stalls.
// If TikZJax had already started processing a wrapper (script replaced by spinner → absent),
// that wrapper is the culprit and its attempt counter increments. An engine reset re-injects
// EVERY started-but-unfinished job (not just the culprit) — terminating the worker kills
// peers mid-compile and poisons TikZJax's internal serial queue, so every survivor must be
// resubmitted to the fresh engine. Non-culprit peers are re-injected without penalty.
import { watchGraphStrokes } from './graph-strokes.js';
import { prepareTikz, TIKZ_PREAMBLE_LINES, tikzKey } from './tikz-prepare.js';

if (typeof window.__installTikzWorkerTracker !== 'function') {
  window.__installTikzWorkerTracker = () => {
    const workers = window.__tikzWorkers instanceof Set ? window.__tikzWorkers : (window.__tikzWorkers = new Set());
    const hooks = window.__tikzWorkerHooks instanceof Set ? window.__tikzWorkerHooks : (window.__tikzWorkerHooks = new Set());
    const OriginalWorker = window.Worker;
    const trackedUrl = value => { try { return new URL(value, document.baseURI).pathname.endsWith('run-tex.js'); } catch (_) { return false; } };
    if (OriginalWorker && !OriginalWorker.__tikzPatched) {
      function PatchedWorker(url, ...options) { const worker = Reflect.construct(OriginalWorker, [url, ...options], new.target || PatchedWorker); if (trackedUrl(url) || trackedUrl(window.__tikzWorkerUrlHint)) { workers.add(worker); hooks.forEach(fn => { try { fn(worker); } catch (_) {} }); } return worker; }
      PatchedWorker.prototype = OriginalWorker.prototype; Object.defineProperty(PatchedWorker, '__tikzPatched', { value: true }); window.Worker = PatchedWorker;
    }
    return { workers, hooks, trackedUrl };
  };
}
window.__installTikzWorkerTracker();
const tikzCache = new Map();        // key → SVG outerHTML (per-page-load memory layer)
let   tikzResetting = null;         // shared reset Promise — prevents cascading engine reloads
// Last time the engine made any progress (a diagram compiled, errored, or a fresh batch was
// injected). The watchdog fails a still-loading job only when the engine has been globally
// stalled for the stall window — NOT merely because the job has been waiting in a long
// queue. This prevents false "failed to render" on pages with many diagrams where queue-wait
// time alone used to exhaust a fixed per-job deadline.
let   tikzLastProgress = Date.now();
// False until the first diagram on this page load compiles or errors. Before that, the
// engine may legitimately spend minutes downloading + initialising wasm/core.dump on a slow
// connection, so the stall gate uses the much longer cold window.
let   tikzEverCompleted = false;
// Every job created for a cache-miss diagram, until it finishes (done/failed/detached).
const tikzActiveJobs = new Set();
const TIKZ_COLD_MS    = 30000;      // timeout for cold (first) compile
const TIKZ_WARM_MS    = 8000;       // timeout for post-reset retries (wasm already cached)
const TIKZ_MAX_ATTEMPTS = 3;
// Global-stall window once the engine has produced at least one result this page load.
const TIKZ_LOADER_MAX_MS = 45000;
// Global-stall window BEFORE the first-ever completion (wasm + 5.7 MB core.dump may still
// be downloading). The hard cap below still backstops a truly dead engine.
const TIKZ_COLD_STALL_MS = 120000;
// Absolute per-job backstop, measured from injection.
const TIKZ_HARD_CAP_MS = 300000;    // 5 min
const TIKZ_ENGINE_SRC = '/libs/tikzjax/tikzjax.js';
const TIKZ_FONTS_HREF = '/libs/tikzjax/fonts.css';
// Start compiling this far before a wrapper scrolls into view.
const TIKZ_LAZY_MARGIN = '600px';

// Diagnostic hooks — silent unless a debug shim assigns window.__TIKZ_LOG/__TIKZ_WARN.
let _jobSeq = 0;
const TLOG = (...a) => { if (window.__TIKZ_LOG) window.__TIKZ_LOG(...a); };
const TWARN = (...a) => { if (window.__TIKZ_WARN) window.__TIKZ_WARN(...a); };
const _snapshot = (wrapper) => {
  if (!wrapper) return '(null wrapper)';
  return {
    connected: wrapper.isConnected,
    children: [...wrapper.children].map(c => {
      if (c.tagName === 'SCRIPT') return 'script[text/tikz]';
      if (c.tagName === 'svg' || c.tagName === 'SVG') {
        const hasAnimate = !!c.querySelector('animate');
        return hasAnimate ? 'svg(loader)' : 'svg(compiled)';
      }
      return c.tagName.toLowerCase();
    }),
  };
};


// ---------------------------------------------------------------------------
// Persistent SVG cache (IndexedDB). Any failure degrades silently to the
// in-memory Map (private browsing, quota, corrupt DB, ...).
// Store name is versioned — bump it whenever the cache-key format changes.
const TIKZ_IDB_NAME = 'mathsmap-tikz';
const TIKZ_IDB_STORE = 'svg-v1';
const TIKZ_IDB_CAP = 2000;
// The upstream TikzJax database (populated by the previously-eager unpatched bundle) is
// unrelated to svg-v1. Remove it opportunistically; blocked/failed deletion never
// participates in rendering.
let _tikzCleanupDone = false;
try { _tikzCleanupDone = localStorage.getItem('mathsmap_tikz_idb_cleanup') === '1'; } catch (_) {}
if (!_tikzCleanupDone) {
  try {
    const cleanup = indexedDB.deleteDatabase('TikzJax');
    cleanup.onsuccess = () => { try { localStorage.setItem('mathsmap_tikz_idb_cleanup', '1'); } catch (_) {} };
  } catch (_) {}
}
const tikzStats = {
  validPlaceholders: 0, memoryHits: 0, idbHits: 0, driverHits: 0, compiles: 0, failures: 0,
  firstDriverLoadMs: null, workerReadyMs: null, engineTimings: {}, lastRenderTimings: null,
  rawJobLatenciesMs: [], pending: 0, firstPlaceholderToSettledMs: null, firstPlaceholderAt: null,
};
const _stat = (name, value = 1) => {
  if (name === 'rawJobLatenciesMs') tikzStats.rawJobLatenciesMs.push(value);
  else tikzStats[name] = (tikzStats[name] || 0) + value;
};
const _recordEngineTimings = (detail = {}, startedAt = null) => {
  const timings = detail.timings || detail;
  const names = [
    'texWasmFetchInflateMs', 'coreDumpFetchInflateMs', 'wasmCompileMs', 'workerReadyMs',
    'dumpMemoryCopyMs', 'wasmInstantiateMs', 'wasmInstantiationMs', 'texExecutionMs',
    'dviToSvgMs', 'texifyMs',
  ];
  names.forEach(name => {
    if (Number.isFinite(timings?.[name])) tikzStats.engineTimings[name] = timings[name];
  });
  const readyMs = Number.isFinite(timings?.workerReadyMs)
    ? timings.workerReadyMs
    : (Number.isFinite(startedAt) ? performance.now() - startedAt : null);
  if (Number.isFinite(readyMs)) {
    tikzStats.workerReadyMs = readyMs;
    if (tikzStats.firstDriverLoadMs == null) {
      tikzStats.firstDriverLoadMs = Number.isFinite(startedAt)
        ? performance.now() - startedAt
        : readyMs;
    }
  }
  if (detail.error) tikzStats.engineTimings.error = true;
};
const _statsSnapshot = () => {
  const values = [...tikzStats.rawJobLatenciesMs].sort((a, b) => a - b);
  const at = p => values.length ? values[Math.min(values.length - 1, Math.floor((values.length - 1) * p))] : null;
  return Object.freeze({
    ...tikzStats,
    engineTimings: Object.freeze({ ...tikzStats.engineTimings }),
    lastRenderTimings: tikzStats.lastRenderTimings ? Object.freeze({ ...tikzStats.lastRenderTimings }) : null,
    rawJobLatenciesMs: Object.freeze([...tikzStats.rawJobLatenciesMs]),
    p50Ms: at(.5),
    p95Ms: at(.95),
    hitRate: (tikzStats.memoryHits + tikzStats.idbHits + tikzStats.driverHits) /
      Math.max(1, tikzStats.memoryHits + tikzStats.idbHits + tikzStats.driverHits + tikzStats.compiles),
  });
};
let _tikzIdb = null;   // Promise<IDBDatabase|null>
const _idbOpen = () => {
  if (_tikzIdb) return _tikzIdb;
  _tikzIdb = new Promise((resolve) => {
    try {
      const req = indexedDB.open(TIKZ_IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(TIKZ_IDB_STORE)) {
          const store = db.createObjectStore(TIKZ_IDB_STORE, { keyPath: 'key' });
          store.createIndex('ts', 'ts');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch (_) { resolve(null); }
  });
  return _tikzIdb;
};
const _idbGet = async (key) => {
  const db = await _idbOpen();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const req = db.transaction(TIKZ_IDB_STORE, 'readonly').objectStore(TIKZ_IDB_STORE).get(key);
      req.onsuccess = () => { const row = req.result; if (row?.svg && Date.now() - (row.ts || 0) > 3600000) _idbTouch(key); resolve(row ? row.svg : null); };
      req.onerror = () => resolve(null);
    } catch (_) { resolve(null); }
  });
};
const _idbPut = async (key, svg) => {
  const db = await _idbOpen();
  if (!db) return;
  try {
    const tx = db.transaction(TIKZ_IDB_STORE, 'readwrite');
    const store = tx.objectStore(TIKZ_IDB_STORE);
    store.put({ key, svg, ts: Date.now() });
    const countReq = store.count();
    countReq.onsuccess = () => {
      let excess = countReq.result - TIKZ_IDB_CAP;
      if (excess <= 0) return;
      // Evict oldest-written entries via the ts index.
      const cursorReq = store.index('ts').openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor && excess > 0) { cursor.delete(); excess--; cursor.continue(); }
      };
    };
  } catch (_) { /* quota/close — memory cache still works */ }
};
const _idbTouch = async (key) => {
  const db = await _idbOpen(); if (!db) return;
  try {
    const store = db.transaction(TIKZ_IDB_STORE, 'readwrite').objectStore(TIKZ_IDB_STORE);
    const req = store.get(key);
    req.onsuccess = () => { try { if (req.result) store.put({ ...req.result, ts: Date.now() }); } catch (_) {} };
  } catch (_) {}
};

// ---------------------------------------------------------------------------
// Engine loading. The tikzjax bundle self-guards with `window.TikzJax || (...)`,
// initialises its MutationObserver on window load (or immediately when readyState
// is already "complete" — the lazy-injection case), and spawns its worker.
// The PATCHED bundle fires `tikzjax-engine-ready` once the worker has loaded
// wasm + core dump; the pristine vendor bundle never fires it, so the integrity
// test in tests/tikz-bundles.test.js is what keeps this resolvable.
let _tikzEngineLoading = null;
const _loadEngineScript = () => new Promise((resolve, reject) => {
  const startedAt = performance.now();
  let settled = false;
  const finish = (event = null) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    window.removeEventListener('tikzjax-engine-ready', onReady);
    tikzLastProgress = Date.now();
    _recordEngineTimings(event?.detail || {}, startedAt);
    if (event?.detail?.error) reject(new Error('TikZ engine failed to load'));
    else resolve(event?.detail || {});
  };
  const onReady = event => finish(event);
  const timer = setTimeout(() => finish({ detail: { error: true } }), TIKZ_COLD_STALL_MS);
  window.addEventListener('tikzjax-engine-ready', onReady);
  const s = document.createElement('script');
  s.src = TIKZ_ENGINE_SRC;
  s.dataset.disableCache = '1';
  s.onerror = () => finish({ detail: { error: true } });
  document.head.appendChild(s);
});
const _ensureEngine = () => {
  if (_tikzEngineLoading) return _tikzEngineLoading;
  if (window.TikzJax) return Promise.resolve();
  TLOG('loading tikzjax engine (first cache-miss job)');
  _tikzEngineLoading = _loadEngineScript();
  return _tikzEngineLoading;
};

const _buildTikzScript = (job) => {
  const s = document.createElement('script');
  s.type = 'text/tikz';
  s.dataset.disableCache = '1';
  s.textContent = job.code;
  if (job.pkgJson) s.dataset.texPackages = job.pkgJson;
  const preambleLines = [...TIKZ_PREAMBLE_LINES];
  if (job.extraPreamble && job.extraPreamble.length) {
    preambleLines.push(...job.extraPreamble);
  }
  s.dataset.addToPreamble = preambleLines.join('\n');
  return s;
};

const _applyCachedToNode = (node, svgHtml) => {
  if (!node.parentNode) return false;
  const wrapper = document.createElement('div');
  wrapper.className = 'tikz-loading';
  wrapper.innerHTML = svgHtml;
  if (!wrapper.firstElementChild) return false;
  // Tag the SVG itself so styling can target the diagram directly, independent of
  // the wrapper surviving DOM churn. Old cache entries may predate this tagging.
  wrapper.firstElementChild.classList.add('tikz-svg');
  node.replaceChildren(...wrapper.childNodes);
  return true;
};

// TikZJax's loader spinner is a placeholder SVG containing <animate> children.
// Compiled TikZ output is static — it never contains <animate>. Use this to tell them apart.
const _hasCompiledSvg = (wrapper) =>
  [...wrapper.querySelectorAll('svg')].some(s => !s.querySelector('animate'));
const _hasLoaderSvg = (wrapper) => !!wrapper.querySelector('svg animate');
// When TeX compilation fails, TikZJax replaces the loader with an <img> pointing
// at a hardcoded bad URL (invalid.site/img-not-found.png) as a "broken image"
// signal. We swap that for our own error UI before the browser even attempts the
// network request, so users see a clean message and there's no ERR_NAME_NOT_RESOLVED.
const _isTikzErrorImg = (node) =>
  node && node.tagName === 'IMG' && /invalid\.site|img-not-found/.test(node.getAttribute('src') || '');

const _finishJob = (job) => {
  if(job.done)return;
  if(!job.cancelled){const svg=job.wrapper.querySelector('svg.tikz-svg');if(job.error)job.onError?.(job.error);else if(svg)job.onSuccess?.(svg.outerHTML);}
  job.done = true;
  tikzActiveJobs.delete(job);
  if (job.timer) { clearTimeout(job.timer); job.timer = null; }
  if (job.hardTimer) { clearTimeout(job.hardTimer); job.hardTimer = null; }
  if (job._outcomeObs) { job._outcomeObs.disconnect(); job._outcomeObs = null; }
  if (job.injectedAt != null && !job.latencyRecorded) {
    job.latencyRecorded = true;
    _stat('rawJobLatenciesMs', performance.now() - job.injectedAt);
    performance.measure?.(`tikz-job-${job.seq}`, `tikz-job-${job.seq}-start`);
  }
  tikzStats.pending = tikzActiveJobs.size;
  if (tikzStats.firstPlaceholderAt && tikzStats.firstPlaceholderToSettledMs == null && !tikzActiveJobs.size) tikzStats.firstPlaceholderToSettledMs = performance.now() - tikzStats.firstPlaceholderAt;
};
const _failJob = (job, title) => {
  if(job.done)return;job.error=title;
  _stat('failures');
  job.wrapper.innerHTML =
    '<div class="tikz-error" title="' + title + '">⚠ Diagram failed to render</div>';
  _finishJob(job);
  // Failing a job is itself progress — let queued peers re-baseline.
  tikzLastProgress = Date.now();
};

// A job hit a stall/culprit condition: retry via a full engine reset (which re-injects all
// pending peers) until its attempts run out or its hard deadline passes, then show error UI.
// A reset is an in-page equivalent of the "reload the page and it works" workaround, so a
// globally-stalled engine gets healed instead of failing every diagram.
const _escalateJob = (job, title) => {
  job.attempts++;
  if (job.attempts >= TIKZ_MAX_ATTEMPTS || Date.now() > job.deadline) {
    _failJob(job, title);
    return;
  }
  TWARN('escalating job#' + job.seq + ' (' + title + ') → engine reset, attempt', job.attempts);
  _resetAndReinjectAll();
};

// Per-wrapper observer: catches both the broken-image fallback and a freshly-
// injected compiled SVG, so we can short-circuit the watchdog instead of polling.
const _attachOutcomeObserver = (job) => {
  const obs = new MutationObserver(() => {
    const w = job.wrapper;
    if (!w.isConnected) { obs.disconnect(); return; }
    // Broken-image fallback → escalate to error UI immediately.
    const badImg = [...w.querySelectorAll('img')].find(_isTikzErrorImg);
    if (badImg) {
      TWARN('outcome observer job#' + job.seq + ': broken-image fallback detected → fail');
      tikzEverCompleted = true;   // the engine produced a result, even if an error
      // Strip the src first so the browser doesn't fire a network request for invalid.site.
      badImg.removeAttribute('src');
      _failJob(job, 'TikZ render failed (TeX compile error)');
      obs.disconnect();
      return;
    }
    if (_hasCompiledSvg(w)) {
      TLOG('outcome observer job#' + job.seq + ': compiled svg seen → disconnect');
      obs.disconnect();
    }
  });
  obs.observe(job.wrapper, { childList: true, subtree: true });
  job._outcomeObs = obs;
};

const _watchdogFor = (job) => {
  const ms = job.attempts === 0 ? TIKZ_COLD_MS : TIKZ_WARM_MS;
  job.timer = setTimeout(() => {
    job.timer = null;
    TLOG('watchdog fired job#' + job.seq, 'attempt:', job.attempts, _snapshot(job.wrapper));
    if (job.done) return;
    // Wrapper removed from the DOM (e.g. re-rendered component tree) — abandon silently.
    // Triggering a reset here would terminate the worker mid-compile for unrelated,
    // currently-visible wrappers and leave them stuck on the loader.
    if (!job.wrapper.isConnected) {
      TLOG('watchdog job#' + job.seq + ': detached → abandon');
      _finishJob(job);
      return;
    }

    if (_hasCompiledSvg(job.wrapper)) {
      TLOG('watchdog job#' + job.seq + ': compiled svg present → done');
      _finishJob(job);
      return;
    }

    // A reset is in flight (or this job is queued for re-injection by it) — the wrapper is
    // legitimately script-less right now; do NOT read that as the culprit signature.
    if (tikzResetting || job.resetPending) {
      _watchdogFor(job);
      return;
    }

    // Before the first-ever completion the engine may still be downloading wasm/core.dump —
    // give it a much longer leash than the steady-state stall window.
    const stallWindow = tikzEverCompleted ? TIKZ_LOADER_MAX_MS : TIKZ_COLD_STALL_MS;

    // TikZJax loader still present — compile is in-flight or queued behind earlier jobs.
    // Don't kill the engine; just re-arm and check again later. Fail only if the engine has
    // been GLOBALLY stalled (no diagram compiled or errored anywhere) for the stall window —
    // a job merely waiting its turn behind a busy-but-healthy engine keeps re-arming.
    // job.deadline is an absolute hard cap so a wrapper that never receives any completion
    // event can't spin literally forever.
    if (_hasLoaderSvg(job.wrapper)) {
      const stalled = Date.now() - tikzLastProgress > stallWindow;
      const pastHardCap = Date.now() > job.deadline;
      if (stalled || pastHardCap) {
        TWARN('watchdog job#' + job.seq + ': loader stuck → escalate',
          'stalled:', stalled, 'pastHardCap:', pastHardCap, 'loaderStuckChecks:', job.loaderStuckChecks);
        if (pastHardCap) { _failJob(job, 'TikZ render failed (loader stuck)'); return; }
        _escalateJob(job, 'TikZ render failed (loader stuck)');
        return;
      }
      job.loaderStuckChecks = (job.loaderStuckChecks || 0) + 1;
      TLOG('watchdog job#' + job.seq + ': loader present → re-arm',
        'check#:', job.loaderStuckChecks, 'msToDeadline:', job.deadline - Date.now());
      _watchdogFor(job);
      return;
    }

    // Neither compiled SVG nor loader. Two very different situations:
    //   • script still present → TikZJax simply hasn't picked this script up yet (worker busy
    //     with a cold wasm init / a peer's compile). This is normal on a first/uncached compile,
    //     NOT a failure. Stay patient: re-arm and wait, exactly like the loader-present branch.
    //   • script gone → the duplicate-push / lost-script bug actually struck. That IS the
    //     culprit; charge an attempt and reset the engine (which re-injects all peers too).
    const isCulprit = !job.wrapper.querySelector('script[type="text/tikz"]');

    if (!isCulprit) {
      const stalled = Date.now() - tikzLastProgress > stallWindow;
      const pastHardCap = Date.now() > job.deadline;
      console.warn('[tikz] watchdog job#' + job.seq + ': script present, not picked up —',
        'stalled:', stalled, '| pastHardCap:', pastHardCap, '| check#:', (job.loaderStuckChecks || 0) + 1);
      if (stalled || pastHardCap) {
        if (pastHardCap) { _failJob(job, 'TikZ render failed (never picked up)'); return; }
        _escalateJob(job, 'TikZ render failed (never picked up)');
        return;
      }
      job.loaderStuckChecks = (job.loaderStuckChecks || 0) + 1;
      _watchdogFor(job);   // re-arm and keep waiting; do NOT reset the engine
      return;
    }

    console.warn('[tikz] watchdog job#' + job.seq + ': script gone (culprit) → reset engine',
      'attempt:', job.attempts);
    _escalateJob(job, 'TikZ render failed after multiple attempts');
  }, ms);
};

// Terminate the worker, reload the bundle, then re-inject EVERY started-but-unfinished job.
// Killing the worker destroys peers mid-compile and poisons TikZJax's internal serial queue
// (each batch awaits the previous one), so partial recovery is impossible — the whole
// in-flight set must be resubmitted. Non-culprit peers keep their attempt count.
const _resetAndReinjectAll = () => {
  if (tikzResetting) return tikzResetting;
  tikzResetting = (async () => {
    const pending = [...tikzActiveJobs].filter(j => j.started && !j.done);
    pending.forEach(j => {
      j.resetPending = true;
      if (j.timer) { clearTimeout(j.timer); j.timer = null; }
      if (j._outcomeObs) { j._outcomeObs.disconnect(); j._outcomeObs = null; }
    });
    await _reloadEngine();
    await new Promise(r => setTimeout(r, 0));
    tikzLastProgress = Date.now();
    for (const j of pending) {
      j.resetPending = false;
      if (j.done) continue;
      if (!j.wrapper.isConnected) { _finishJob(j); continue; }
      j.wrapper.innerHTML = '';   // clear orphaned loader / stale script
      j.wrapper.appendChild(_buildTikzScript(j));
      _attachOutcomeObserver(j);
      _watchdogFor(j);
    }
  })().catch(() => {
    for (const job of tikzActiveJobs) {
      if (job.started && !job.done) _failJob(job, 'TikZ engine failed to load');
    }
  }).finally(() => { tikzResetting = null; });
  return tikzResetting;
};

const _reloadEngine = () => {
  TWARN('RESET ENGINE called — terminating workers and reloading tikzjax.js. Stack:', new Error().stack);
  if (typeof window.__tikzTeardown === 'function') { try { window.__tikzTeardown(); } catch (_) {} }
  if (window.__tikzWorkers) {
    window.__tikzWorkers.forEach(w => { try { w.terminate(); } catch (_) {} });
    window.__tikzWorkers.clear();
  }
  const old = document.querySelector('script[src*="libs/tikzjax/tikzjax.js"]');
  if (old) old.remove();
  // The bundle guards initialisation with `window.TikzJax || (window.TikzJax = true, ...)`.
  // Clear the flag so the freshly-loaded script actually re-initialises (new worker + new
  // MutationObserver). No cache-buster on the src — re-executing the same URL from HTTP
  // cache is sufficient and avoids a forced network fetch of the bundle on every reset.
  try { delete window.TikzJax; } catch (_) { window.TikzJax = undefined; }
  _tikzEngineLoading = _loadEngineScript();
  return _tikzEngineLoading;
};

// Capture-phase so it fires even if the wrapper has been detached/re-attached to the DOM.
document.addEventListener('tikzjax-load-finished', (e) => {
  const svg = e.target;
  const wrapper = svg.parentElement;
  if (!wrapper) return;
  // A diagram compiled — record engine progress so queued peers keep waiting.
  tikzLastProgress = Date.now();
  tikzEverCompleted = true;
  const source = e.detail?.source || 'compiled';
  if (source === 'driver-cache') _stat('driverHits');
  if (source === 'compiled') _stat('compiles');
  if (source === 'compiled' && e.detail?.timings) {
    tikzStats.lastRenderTimings = { ...e.detail.timings };
    _recordEngineTimings(e.detail.timings);
  }
  // Tag the compiled SVG BEFORE caching so svg.outerHTML stored below already
  // carries the class for future cache hits.
  svg.classList.add('tikz-svg');
  if (wrapper.dataset && wrapper.dataset.cacheKey) {
    tikzCache.set(wrapper.dataset.cacheKey, svg.outerHTML);
    _idbPut(wrapper.dataset.cacheKey, svg.outerHTML);   // fire-and-forget persistence
  }
  // Render succeeded — cancel this wrapper's watchdog + outcome observer.
  if (wrapper._tikzJob) _finishJob(wrapper._tikzJob);
}, true);

// ---------------------------------------------------------------------------
// Lazy start: shared IntersectionObserver over pending wrappers.
let _tikzIO = null;
const _getIO = () => {
  if (_tikzIO) return _tikzIO;
  _tikzIO = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      _tikzIO.unobserve(entry.target);
      const job = entry.target._tikzJob;
      if (job) _startJob(job);
    }
  }, { rootMargin: TIKZ_LAZY_MARGIN });
  return _tikzIO;
};

let _tikzFontsPromise = null;
const _ensureTikzFonts = () => {
  if (_tikzFontsPromise) return _tikzFontsPromise;
  _tikzFontsPromise = new Promise(resolve => {
    const finish = () => {
      clearTimeout(timer);
      link.removeEventListener('load', finish);
      link.removeEventListener('error', finish);
      resolve();
    };
    const href = new URL(TIKZ_FONTS_HREF, document.baseURI).href;
    const links = [...document.querySelectorAll('link[rel="stylesheet"][href]')];
    const existing = links.find(link => { try { return new URL(link.href, document.baseURI).href === href; } catch (_) { return false; } });
    const link = existing || Object.assign(document.createElement('link'), { rel: 'stylesheet', href });
    const timer = setTimeout(finish, 5000);
    if (!existing) { link.dataset.tikzFonts = '1'; document.head.appendChild(link); }
    link.addEventListener('load', finish, { once: true });
    link.addEventListener('error', finish, { once: true });
    if (link.sheet) finish();
  });
  return _tikzFontsPromise;
};

const _startJob = async (job) => {
  if (job.started || job.done) return;
  job.started = true;
  if (_tikzIO) _tikzIO.unobserve(job.wrapper);
  if (!job.wrapper.isConnected) { _finishJob(job); return; }

  // Cover every async startup stage, including IndexedDB and engine recovery.
  job.deadline = Date.now() + TIKZ_HARD_CAP_MS;
  job.hardTimer = setTimeout(() => {
    if (!job.wrapper.isConnected) _finishJob(job);
    else _failJob(job, 'TikZ render timed out');
  }, TIKZ_HARD_CAP_MS);
  try {

  // Persistent-cache check (memory layer was already checked at render time, but a peer
  // with the same key may have compiled since).
  const cachedMemory = tikzCache.get(job.key);
  const cached = cachedMemory || await _idbGet(job.key);
  if (job.done) return;
  if (cached) {
    tikzCache.set(job.key, cached);
    await _ensureTikzFonts();
    if (job.done || !job.wrapper.isConnected) { _finishJob(job); return; }
    if (_applyCachedToNode(job.wrapper, cached)) {
      TLOG('cache HIT job#' + job.seq, 'key:', job.key);
      _stat(cachedMemory ? 'memoryHits' : 'idbHits');
      _finishJob(job);
      return;
    }
  }

  await _ensureEngine();
  await _ensureTikzFonts();
  if (job.done || !job.wrapper.isConnected) { _finishJob(job); return; }

  tikzLastProgress = Date.now();
  job.injectedAt = performance.now();
  performance.mark?.(`tikz-job-${job.seq}-start`);
  // The wrapper was inserted script-less, so this appendChild is the single mutation
  // TikZJax's MutationObserver sees for this job → exactly one push into its queue
  // (the old duplicate-push bug came from scripts being present inside larger
  // innerHTML mutations that the observer scanned twice).
  job.wrapper.appendChild(_buildTikzScript(job));
  _attachOutcomeObserver(job);
  TLOG('injected job#' + job.seq, 'key:', job.key, 'codeLen:', job.code.length);
  _watchdogFor(job);
  } catch (error) {
    _failJob(job, error?.message || 'TikZ engine failed to load');
  }
};

// Public helper mirror of the MathsBase window.TikZ API (print specifics trimmed —
// MathsMap has no print flow). Useful for harnesses and manual debugging.
window.TikZ = {
  _jobsIn: (root) => [...tikzActiveJobs].filter(j => root === document || root.contains(j.wrapper)),
  hasPending: (root = document) =>
    window.TikZ._jobsIn(root).some(j => !j.done && j.wrapper.isConnected),
  flushPending: async (root = document, timeoutMs = 20000) => {
    window.TikZ._jobsIn(root).forEach(j => { if (!j.started) _startJob(j); });
    const t0 = Date.now();
    while (Date.now() - t0 < timeoutMs) {
      const unsettled = window.TikZ._jobsIn(root).some(j => !j.done && j.wrapper.isConnected);
      if (!unsettled) return true;
      await new Promise(r => setTimeout(r, 200));
    }
    if (!window.TikZ._jobsIn(root).some(j => !j.done && j.wrapper.isConnected)) return true;
    TWARN('flushPending timed out with jobs still unsettled');
    return false;
  },
  stats: _statsSnapshot,
  _test: Object.freeze({ forceReset: _resetAndReinjectAll }),
};
window.addEventListener('pagehide', () => { try { if (localStorage.getItem('mathsmap_tikz_telemetry') === '1') console.info('[tikz] telemetry', _statsSnapshot()); } catch (_) {} });

// ---------------------------------------------------------------------------
// Component API.

// Cancel the in-flight job attached to a component's outer element (Svelte unmount /
// re-render). Silent: no stats penalty, no error UI, no engine reset.
export function cancelTikzJob(outerEl) {
  outerEl?._stopGraphStrokes?.();
  if(outerEl)outerEl._stopGraphStrokes=null;
  const job = outerEl && outerEl._tikzJob;
  if (!job) return;
  outerEl._tikzJob = null;job.cancelled=true;
  if (job.done) return;
  if (_tikzIO) { try { _tikzIO.unobserve(job.wrapper); } catch (_) {} }
  _finishJob(job);
}

// Normalise \usepackage lines and \fontsize values in TikZ source, detect required
// packages, compute a cache key, then render into outerEl. `eager: true` (harness /
// explicitly-assembled views) compiles immediately instead of waiting for the viewport.
export function renderTikzCode(outerEl, code, { eager = false, onSuccess=null, onError=null } = {}) {
  cancelTikzJob(outerEl);
  outerEl.innerHTML = '';
  _stat('validPlaceholders');
  if (!tikzStats.firstPlaceholderAt) tikzStats.firstPlaceholderAt = performance.now();

  // Source normalisation, package detection and the cache key all live in
  // src/lib/tikz-prepare.js, shared with the Node-side booklet renderer so a figure is
  // prepared identically on screen and on paper.
  let prepared;
  try { prepared=prepareTikz(code); }
  catch(error){
    const message='Diagram source: '+error.message,notice=document.createElement('pre');
    notice.className='tikz-error';notice.textContent=message;outerEl.appendChild(notice);
    _stat('failures');onError?.(message);return;
  }
  const { cleanCode, pkgJson, extraPreamble, key } = prepared;

  // Insert a script-less .tikz-loading wrapper and defer everything else (IDB lookup,
  // engine load, script injection) until the wrapper nears the viewport.
  const wrapper = document.createElement('div');
  wrapper.className = 'tikz-loading';
  wrapper.dataset.cacheKey = key;
  const seq = ++_jobSeq;
  const job = { onSuccess,onError,wrapper, code: cleanCode, pkgJson, extraPreamble, key, cacheHtml: tikzCache.get(key) || null, attempts: 0, timer: null,
    seq, deadline: 0, loaderStuckChecks: 0, started: false, done: false, resetPending: false,
    _outcomeObs: null };
  wrapper._tikzJob = job;
  outerEl._tikzJob = job;   // so cancelTikzJob(outerEl) can find it on unmount
  outerEl.appendChild(wrapper);
  outerEl._stopGraphStrokes=watchGraphStrokes(outerEl);
  tikzActiveJobs.add(job);
  tikzStats.pending = tikzActiveJobs.size;
  if (eager || job.cacheHtml) _startJob(job);
  else _getIO().observe(wrapper);
  TLOG('queued job#' + seq, 'key:', key, 'codeLen:', cleanCode.length, 'extraPreamble:', extraPreamble.length);
}
