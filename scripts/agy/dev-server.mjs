// Starts (and later stops) the batch's OWN vite instance on a pinned port, and records it
// where the diagram lane can find it.
//
//   node scripts/agy/dev-server.mjs --start     # rebuilds the manifest, waits for ready
//   node scripts/agy/dev-server.mjs --status
//   node scripts/agy/dev-server.mjs --stop
//
// W3-5 and W3-6 both lost time here: vite takes the next free port when 5173 is occupied,
// so `render.mjs` shot a different checkout's content in one batch, and in the other the
// server died mid-batch and the failure surfaced as a misleading "is the dev server
// running?" error. A pinned `--strictPort` instance fails LOUDLY on a port clash instead of
// drifting, and `.agywork/dev-server.json` gives render.mjs its base URL so the port is
// never guessed or retyped.
//
// It never kills a server it did not start: --stop only signals the pid it recorded.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const workDir = path.join(rootDir, '.agywork');
export const STATE_FILE = path.join(workDir, 'dev-server.json');
const LOG_FILE = path.join(workDir, 'dev-server.log');
const DEFAULT_PORT = 5199; // deliberately outside vite's 5173+ auto-increment range

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : fallback;
}

// The base URL the diagram lane should render against, or null when no batch server is up.
export function readBase() {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    return state.base || null;
  } catch {
    return null;
  }
}

function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitForReady(base, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(base, { signal: AbortSignal.timeout(3000) });
      if (res.ok) return true;
    } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 750));
  }
  return false;
}

async function start(port) {
  fs.mkdirSync(workDir, { recursive: true });
  const existing = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) : null;
  if (existing && alive(existing.pid) && await waitForReady(existing.base, 3000)) {
    console.log(`already running: ${existing.base} (pid ${existing.pid})`);
    return 0;
  }

  // `npm run dev` would do this via predev; we spawn vite directly so the recorded pid IS
  // the server (a shell wrapper's pid cannot be signalled reliably on Windows).
  console.log('rebuilding content manifest…');
  execFileSync(process.execPath, [path.join(rootDir, 'scripts', 'build-manifest.mjs')], { cwd: rootDir, stdio: 'inherit' });

  const log = fs.openSync(LOG_FILE, 'a');
  const child = spawn(process.execPath, [path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js'),
    '--port', String(port), '--strictPort'], { cwd: rootDir, detached: true, stdio: ['ignore', log, log] });
  child.unref();

  const base = `http://localhost:${port}`;
  if (!await waitForReady(base)) {
    console.error(`✗ dev server did not answer on ${base} within 90s — see ${LOG_FILE}`);
    console.error('  (--strictPort means a clash FAILS rather than sliding to another port; free the port or pass --port)');
    try { process.kill(child.pid); } catch { /* already gone */ }
    return 1;
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify({ pid: child.pid, port, base }, null, 2));
  console.log(`✓ dev server ready: ${base} (pid ${child.pid}) — render.mjs picks this up automatically`);
  return 0;
}

function stop() {
  if (!fs.existsSync(STATE_FILE)) {
    console.log('no batch dev server recorded');
    return 0;
  }
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  if (alive(state.pid)) {
    try { process.kill(state.pid); } catch { /* raced with exit */ }
    console.log(`stopped pid ${state.pid} (${state.base})`);
  } else {
    console.log(`pid ${state.pid} was already gone`);
  }
  fs.rmSync(STATE_FILE);
  return 0;
}

async function status() {
  if (!fs.existsSync(STATE_FILE)) {
    console.log('no batch dev server recorded — run --start before the diagram lane');
    return 1;
  }
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  const up = alive(state.pid) && await waitForReady(state.base, 3000);
  console.log(`${up ? '✓' : '✗'} ${state.base} (pid ${state.pid})${up ? '' : ' — recorded but not answering; --start again'}`);
  return up ? 0 : 1;
}

const entry = process.argv[1] ? `file:///${process.argv[1].replace(/\\/g, '/')}` : null;
if (entry && import.meta.url === entry) {
  const port = Number(arg('--port', DEFAULT_PORT));
  const action = process.argv.includes('--stop') ? stop
    : process.argv.includes('--status') ? status
      : process.argv.includes('--start') ? () => start(port)
        : null;
  if (!action) {
    console.error('usage: node scripts/agy/dev-server.mjs --start [--port 5199] | --status | --stop');
    process.exit(2);
  }
  process.exit(await action());
}
