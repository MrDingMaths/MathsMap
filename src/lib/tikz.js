// TikZ rendering — content-addressed cache + watchdog/reset logic.
// Ported from mathsdatabase/js/tikz.js. Adapted for Svelte component use:
//   renderTikzCode(outerEl, code) takes the Svelte-bound outer element and a
//   raw TikZ code string. It creates an inner .tikz-loading wrapper, appends
//   the <script type="text/tikz"> to it while DETACHED, then inserts the
//   inner wrapper as a unit — one atomic DOM mutation so TikZJax's
//   MutationObserver sees the script as a DESCENDANT of the added node and
//   picks it up via getElementsByTagName (the same invariant the sibling repo
//   maintains with its replaceWith technique).
//
// Two timeouts:
//   TIKZ_COLD_MS (30 s) — first attempt: covers wasm download + initial TeX compile.
//   TIKZ_WARM_MS  (8 s) — post-reset: wasm cached, only a true bad source stalls.

const tikzCache = new Map();       // hash → SVG outerHTML
let   tikzResetting = null;        // shared reset Promise — prevents cascading engine reloads
let   tikzLastProgress = Date.now();
let   tikzEngineHealthy = false;   // true once any diagram has ever compiled this session

const _log = (...args) => console.log('[TikZ]', ...args);

// Log tikzjax.js initial load status.
{
  const _checkTikzjaxLoaded = () => {
    const tag = document.querySelector('script[src*="libs/tikzjax/tikzjax.js"]');
    _log(`module loaded; tikzjax script tag found=${!!tag}; window.TikzJax=${!!window.TikzJax}`);
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _checkTikzjaxLoaded);
  } else {
    _checkTikzjaxLoaded();
  }
}
const TIKZ_COLD_MS       = 30000;
const TIKZ_WARM_MS       =  8000;
const TIKZ_MAX_ATTEMPTS  = 3;
const TIKZ_LOADER_MAX_MS = 45000;
const TIKZ_HARD_CAP_MS   = 300000;
// CM design sizes bundled in libs/tikzjax/fonts/. \fontsize requests outside
// this set can fail in the worker → silent stall → infinite spinner.
const TIKZ_CM_DESIGN_SIZES = [5, 6, 7, 8, 9, 10, 12, 17];

let _jobSeq = 0;

const _djb2 = (s) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return h.toString(36);
};

const _buildTikzScript = (job) => {
  const s = document.createElement('script');
  s.type = 'text/tikz';
  s.textContent = job.code;
  if (job.pkgJson) s.dataset.texPackages = job.pkgJson;
  const preambleLines = [
    // Modern LaTeX (2020+) auto-loads textcomp and routes \$ through TC fonts,
    // but TikZJax only bundles CM fonts. Bind \textdollar to OT1 char 36 directly.
    '\\DeclareTextCommand{\\textdollar}{OT1}{\\char36 }',
    '\\usetikzlibrary{arrows,arrows.meta,patterns,calc,angles,quotes}',
    '\\usetikzlibrary{decorations.pathreplacing,decorations.markings,decorations.pathmorphing}',
    '\\usetikzlibrary{positioning,intersections,shadings}',
  ];
  if (job.extraPreamble && job.extraPreamble.length) preambleLines.push(...job.extraPreamble);
  s.dataset.addToPreamble = preambleLines.join('\n');
  return s;
};

const _hasCompiledSvg = (wrapper) =>
  [...wrapper.querySelectorAll('svg')].some(s => !s.querySelector('animate'));
const _hasLoaderSvg = (wrapper) => !!wrapper.querySelector('svg animate');
const _isTikzErrorImg = (node) =>
  node && node.tagName === 'IMG' && /invalid\.site|img-not-found/.test(node.getAttribute('src') || '');

const _attachOutcomeObserver = (job) => {
  const obs = new MutationObserver(() => {
    const w = job.wrapper;
    if (!w.isConnected) { obs.disconnect(); return; }
    const badImg = [...w.querySelectorAll('img')].find(_isTikzErrorImg);
    if (badImg) {
      const badSrc = badImg.getAttribute('src');
      tikzLastProgress = Date.now();
      badImg.removeAttribute('src');
      if (job.timer) { clearTimeout(job.timer); job.timer = null; }
      obs.disconnect();

      // A bad-img can mean either a genuine per-diagram TeX error OR that the
      // engine never loaded (load() failed → core dump `o` undefined → every
      // texify throws → bad-img). If the engine has never produced a single SVG
      // this session, assume the latter: reset the engine once and retry this
      // job. The shared `tikzResetting` promise dedupes the reset across all the
      // sibling jobs that hit bad-img at the same time, so they recover together.
      if (!tikzEngineHealthy && !job._loadRecoveryTried) {
        job._loadRecoveryTried = true;
        _log(`seq=${job.seq} bad-img but engine never healthy — attempting one-time load recovery`);
        w.innerHTML = '';
        if (!tikzResetting) tikzResetting = _resetTikzEngine().finally(() => { tikzResetting = null; });
        tikzResetting.then(() => {
          if (!w.isConnected) { _log(`seq=${job.seq} load recovery: wrapper disconnected, aborting`); return; }
          _log(`seq=${job.seq} re-injecting script after load recovery`);
          w.appendChild(_buildTikzScript(job));
          _attachOutcomeObserver(job);
          _watchdogFor(job);
        });
        return;
      }

      _log(`seq=${job.seq} TeX compile error — bad-img src="${badSrc}"`);
      w.innerHTML = '<div class="tikz-error" title="TikZ render failed (TeX compile error)">⚠ Diagram failed to render</div>';
      return;
    }
    if (_hasCompiledSvg(w)) {
      _log(`seq=${job.seq} outcomeObserver: compiled SVG detected`);
      obs.disconnect();
    }
  });
  obs.observe(job.wrapper, { childList: true, subtree: true });
  job._outcomeObs = obs;
};

const _watchdogFor = (job) => {
  const ms = job.attempts === 0 ? TIKZ_COLD_MS : TIKZ_WARM_MS;
  _log(`seq=${job.seq} watchdog armed — timeout ${ms}ms (attempt ${job.attempts})`);
  job.timer = setTimeout(async () => {
    job.timer = null;
    if (!job.wrapper.isConnected) { _log(`seq=${job.seq} watchdog fired — wrapper disconnected, aborting`); return; }
    if (_hasCompiledSvg(job.wrapper)) { _log(`seq=${job.seq} watchdog fired — SVG already compiled, OK`); return; }

    if (_hasLoaderSvg(job.wrapper)) {
      const stalled = Date.now() - tikzLastProgress > TIKZ_LOADER_MAX_MS;
      const pastHardCap = Date.now() > job.deadline;
      _log(`seq=${job.seq} watchdog fired — loader SVG still spinning; stalled=${stalled}, pastHardCap=${pastHardCap}, loaderStuckChecks=${job.loaderStuckChecks}`);
      if (stalled || pastHardCap) {
        _log(`seq=${job.seq} giving up — loader stuck`);
        job.wrapper.innerHTML = '<div class="tikz-error" title="TikZ render failed (loader stuck)">⚠ Diagram failed to render</div>';
        job.timer = null;
        tikzLastProgress = Date.now();
        return;
      }
      job.loaderStuckChecks = (job.loaderStuckChecks || 0) + 1;
      _watchdogFor(job);
      return;
    }

    const isCulprit = !job.wrapper.querySelector('script[type="text/tikz"]');
    _log(`seq=${job.seq} watchdog fired — no compiled SVG, no loader SVG; script still present=${!isCulprit}; wrapper.innerHTML="${job.wrapper.innerHTML.slice(0,200)}"`);
    job.wrapper.innerHTML = '';

    if (isCulprit) {
      job.attempts++;
      _log(`seq=${job.seq} script was consumed but no SVG produced — attempt ${job.attempts}/${TIKZ_MAX_ATTEMPTS}`);
      if (job.attempts >= TIKZ_MAX_ATTEMPTS) {
        _log(`seq=${job.seq} max attempts reached — giving up`);
        job.wrapper.innerHTML = '<div class="tikz-error" title="TikZ render failed after multiple attempts">⚠ Diagram failed to render</div>';
        tikzLastProgress = Date.now();
        return;
      }
      _log(`seq=${job.seq} resetting TikZJax engine (script consumed, no output)`);
      if (!tikzResetting) tikzResetting = _resetTikzEngine().finally(() => { tikzResetting = null; });
      await tikzResetting;
      await new Promise(r => setTimeout(r, 0));
    } else {
      _log(`seq=${job.seq} resetting TikZJax engine (script not picked up)`);
      if (!tikzResetting) tikzResetting = _resetTikzEngine().finally(() => { tikzResetting = null; });
      await tikzResetting;
    }

    if (job.wrapper.isConnected) {
      _log(`seq=${job.seq} re-injecting script after reset`);
      job.wrapper.appendChild(_buildTikzScript(job));
      _watchdogFor(job);
    }
  }, ms);
};

const _resetTikzEngine = () => new Promise((resolve) => {
  _log('resetting TikZJax engine — terminating workers, removing old script tag');
  if (window.__tikzWorkers) {
    _log(`  terminating ${window.__tikzWorkers.size} worker(s)`);
    window.__tikzWorkers.forEach(w => { try { w.terminate(); } catch (_) {} });
    window.__tikzWorkers.clear();
  }
  document.querySelectorAll('.tikz-loading > script[type="text/tikz"]').forEach(s => s.remove());
  const old = document.querySelector('script[src*="libs/tikzjax/tikzjax.js"]');
  const baseSrc = old ? old.src.split('?')[0] : '/libs/tikzjax/tikzjax.js';
  if (old) old.remove();
  try { delete window.TikzJax; } catch (_) { window.TikzJax = undefined; }
  const fresh = document.createElement('script');
  fresh.src = baseSrc + '?r=' + Date.now();
  _log(`  injecting fresh tikzjax.js: ${fresh.src}`);
  fresh.onload  = () => { _log('tikzjax.js reloaded OK'); resolve(); };
  fresh.onerror = (e) => { _log('tikzjax.js reload FAILED', e); resolve(); };
  document.head.appendChild(fresh);
});

document.addEventListener('tikzjax-load-finished', (e) => {
  const svg = e.target;
  const wrapper = svg.parentElement;  // the inner .tikz-loading div
  _log('tikzjax-load-finished event received; svg.tagName=', svg.tagName, 'wrapper=', wrapper);
  if (!wrapper) return;
  tikzEngineHealthy = true;  // a compile succeeded → engine loaded OK; future bad-imgs are real TeX errors
  tikzLastProgress = Date.now();
  if (wrapper.dataset && wrapper.dataset.cacheKey) {
    _log(`  caching SVG for key=${wrapper.dataset.cacheKey}`);
    tikzCache.set(wrapper.dataset.cacheKey, svg.outerHTML);
  }
  if (wrapper._tikzJob) {
    const job = wrapper._tikzJob;
    _log(`  seq=${job.seq} clearing watchdog timer and outcomeObserver`);
    if (job.timer) { clearTimeout(job.timer); job.timer = null; }
    if (job._outcomeObs) { job._outcomeObs.disconnect(); job._outcomeObs = null; }
  }
}, true);

// Normalise \usepackage lines and \fontsize values in TikZ source, detect
// required packages, compute a cache key, then inject into outerEl.
export function renderTikzCode(outerEl, code) {
  _log(`renderTikzCode called; code length=${code.length}; TikzJax present=${!!window.TikzJax}; outerEl.isConnected=${outerEl.isConnected}`);
  // Cancel any in-flight job stored on the outer element.
  const old = outerEl._tikzJob;
  if (old) {
    _log(`  cancelling previous in-flight job seq=${old.seq}`);
    if (old.timer) { clearTimeout(old.timer); old.timer = null; }
    if (old._outcomeObs) { old._outcomeObs.disconnect(); old._outcomeObs = null; }
    outerEl._tikzJob = null;
  }
  outerEl.innerHTML = '';

  // Extract \usepackage lines — tikzjax wraps code in \begin{document}...\end{document}
  // so any \usepackage in the body causes "Can be used only in preamble".
  // Drop packages that change font encoding (tikzjax only bundles CM fonts).
  const TIKZJAX_UNSUPPORTED_PKG = /^(fontenc|inputenc|babel|lmodern|fontawesome|luatex85)$/;
  const extraPreamble = [];
  let cleanCode = code
    .replace(/^[ \t]*\\usepackage(\[.*?\])?\{([^}]+)\}[ \t]*\n?/gm, (match, _opts, pkgName) => {
      if (!TIKZJAX_UNSUPPORTED_PKG.test(pkgName.trim())) extraPreamble.push(match.trim());
      return '';
    })
    .replace(/^\n+/, '');

  // Snap \fontsize{N}{M} to bundled CM design sizes — off-list sizes stall the worker.
  const _snapSize = (n) => {
    const v = parseFloat(n);
    if (!isFinite(v)) return n;
    let best = TIKZ_CM_DESIGN_SIZES[0], bestDist = Math.abs(v - best);
    for (const s of TIKZ_CM_DESIGN_SIZES) {
      const d = Math.abs(v - s);
      if (d < bestDist || (d === bestDist && s < best)) { best = s; bestDist = d; }
    }
    return String(best);
  };
  const _commentSplit = (line) => {
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '%' && (i === 0 || line[i - 1] !== '\\')) return [line.slice(0, i), line.slice(i)];
    }
    return [line, ''];
  };
  const _fontSizeRe = /\\fontsize\{(\d+(?:\.\d+)?)\}\{(\d+(?:\.\d+)?)\}/g;
  cleanCode = cleanCode.split('\n').map(line => {
    const [body, comment] = _commentSplit(line);
    return body.replace(_fontSizeRe, (match, n, m) => {
      const nn = _snapSize(n), mm = _snapSize(m);
      return (nn === n && mm === m) ? match : `\\fontsize{${nn}}{${mm}}`;
    }) + comment;
  }).join('\n');

  // Auto-detect packages needed by the code.
  const pkgs = {};
  if (/\\begin\{axis\}|\\addplot|\\pgfplots/.test(cleanCode)) pkgs.pgfplots = '';
  if (/\\tdplotsetmaincoords|\\tdplotsetrotatedcoords|\\begin\{tdplot|\\tdplot/.test(cleanCode)) pkgs['tikz-3dplot'] = '';
  if (/\\tfrac|\\dfrac|\\frac\{|\\text\{|\\operatorname|\\mathbb|\\bm\{|\\underset\{|\\overset\{/.test(cleanCode)) pkgs.amsmath = '';
  if (/\\mathbb|\\varnothing|\\therefore|\\square|\\blacksquare|\\triangle\b|\\angle\b/.test(cleanCode)) pkgs.amssymb = '';
  const pkgJson = Object.keys(pkgs).length ? JSON.stringify(pkgs) : null;

  const key = _djb2(cleanCode + '|' + (pkgJson || '') + '|' + extraPreamble.join(';'));

  _log(`  cache key=${key}; extraPreamble=[${extraPreamble.join(', ')}]; pkgJson=${pkgJson}; cleanCode snippet="${cleanCode.slice(0,100)}"`);

  // In-memory cache hit — append the cached SVG directly into outerEl.
  if (tikzCache.has(key)) {
    _log(`  cache HIT — serving from memory`);
    const tmp = document.createElement('div');
    tmp.innerHTML = tikzCache.get(key);
    const svg = tmp.firstElementChild;
    if (svg && outerEl.isConnected) { outerEl.appendChild(svg); return; }
  }
  _log(`  cache MISS — will inject script tag`);

  // Build the inner wrapper + script while DETACHED so TikZJax's MO does not
  // observe the appendChild. Then insert the wrapper as a single unit so the MO
  // fires with wrapper as addedNode and the script as a subtree descendant —
  // matching the invariant TikZJax expects (getElementsByTagName on addedNode).
  const wrapper = document.createElement('div');
  wrapper.className = 'tikz-loading';
  wrapper.dataset.cacheKey = key;

  const seq = ++_jobSeq;
  const job = {
    wrapper, code: cleanCode, pkgJson, extraPreamble, key,
    attempts: 0, timer: null, seq,
    deadline: Date.now() + TIKZ_HARD_CAP_MS,
    loaderStuckChecks: 0,
  };
  wrapper._tikzJob = job;
  outerEl._tikzJob = job;  // also store on outerEl so Tikz.svelte cleanup can find it

  wrapper.appendChild(_buildTikzScript(job));  // detached — NOT observed by MO

  // Defer so TikZJax's MO has processed any prior Svelte-mount mutations before
  // we inject. Then outerEl.appendChild(wrapper) is the single observed mutation.
  queueMicrotask(() => {
    if (!outerEl.isConnected) { _log(`seq=${seq} queueMicrotask: outerEl disconnected, aborting`); return; }
    _log(`seq=${seq} appending wrapper to DOM (single MO-observed mutation)`);
    tikzLastProgress = Date.now();
    outerEl.appendChild(wrapper);  // one observed mutation: wrapper added with script in subtree
    _attachOutcomeObserver(job);
    _watchdogFor(job);
  });
}
