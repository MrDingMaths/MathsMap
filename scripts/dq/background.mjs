#!/usr/bin/env node

import { randomBytes } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import {
  access,
  mkdir,
  open,
  readFile,
  rename,
  unlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ARCHIVE = '.diagnostic-questions';
const DEFAULT_CAPTURE_ARGS = Object.freeze(['crawl', '--write', '--headless']);

function nowIso() {
  return new Date().toISOString();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function exists(filePath) {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function powershellPath() {
  const windowsRoot = process.env.SystemRoot || 'C:\\Windows';
  return path.join(windowsRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
}

function encodePowerShell(script) {
  return Buffer.from(script, 'utf16le').toString('base64');
}

function psLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function quoteWindowsArgument(value) {
  return `"${String(value).replaceAll('"', '\\"')}"`;
}

export function parseBackgroundArgs(argv) {
  const separator = argv.indexOf('--');
  const control = separator === -1 ? [...argv] : argv.slice(0, separator);
  const captureArgs = separator === -1 ? [] : argv.slice(separator + 1);
  const command = control.shift() ?? 'help';
  const result = { command, captureArgs };
  while (control.length) {
    const token = control.shift();
    if (token === '--help' || token === '-h') result.help = true;
    else if (['--archive', '--tail'].includes(token)) {
      if (control[0] === undefined || control[0].startsWith('--')) throw new Error(`${token} requires a value`);
      result[token.slice(2)] = control.shift();
    } else throw new Error(`unknown supervisor option: ${token}; put crawler options after --`);
  }
  result.tail = result.tail === undefined ? 20 : Number(result.tail);
  if (!Number.isInteger(result.tail) || result.tail < 0 || result.tail > 500) {
    throw new Error('--tail must be an integer from 0 to 500');
  }
  return result;
}

export function normalizeCaptureArgs(captureArgs) {
  const args = captureArgs.length ? [...captureArgs] : [...DEFAULT_CAPTURE_ARGS];
  if (args[0] !== 'crawl') {
    throw new Error('background runner is restricted to the dq:capture crawl command');
  }
  if (!args.includes('--headless')) {
    throw new Error('background crawl must include --headless');
  }
  return args;
}

export function createRunRecord({
  repoRoot,
  archiveRoot,
  captureArgs,
  runId,
  runToken,
  startedAt = nowIso(),
  nodePath = process.execPath,
  captureScript = path.join(here, 'capture.mjs'),
  workerScript = path.join(here, 'background-worker.ps1'),
} = {}) {
  if (!runId || !runToken) throw new Error('runId and runToken are required');
  const runDir = path.join(archiveRoot, 'background', 'runs', runId);
  return {
    schemaVersion: 1,
    runId,
    runToken,
    status: 'starting',
    pid: null,
    startedAt,
    updatedAt: startedAt,
    repoRoot,
    archiveRoot,
    nodePath,
    captureScript,
    workerScript,
    captureArgs: [...captureArgs],
    stdoutPath: path.join(runDir, 'stdout.log'),
    stderrPath: path.join(runDir, 'stderr.log'),
    exitPath: path.join(runDir, 'exit.json'),
    payloadPath: path.join(runDir, 'run.json'),
    command: {
      executable: powershellPath(),
      workerScript,
      marker: runToken,
    },
  };
}

export function recordedProcessMatches(run, processInfo) {
  if (!run?.pid || Number(processInfo?.ProcessId) !== Number(run.pid)) return false;
  const commandLine = String(processInfo?.CommandLine ?? '').toLowerCase();
  return commandLine.includes(String(run.runToken).toLowerCase()) &&
    commandLine.includes(String(run.workerScript).toLowerCase());
}

export function classifyRunStatus(run, { exitRecord = null, processInfo = null } = {}) {
  if (exitRecord) {
    return {
      state: exitRecord.outcome ?? (exitRecord.exitCode === 0 ? 'completed' : 'failed'),
      active: false,
      exitCode: exitRecord.exitCode ?? null,
      finishedAt: exitRecord.finishedAt ?? null,
    };
  }
  if (recordedProcessMatches(run, processInfo)) return { state: 'running', active: true, exitCode: null, finishedAt: null };
  if (processInfo) return { state: 'stale_pid', active: false, exitCode: null, finishedAt: null };
  return { state: run?.status === 'starting' ? 'lost_during_start' : 'lost', active: false, exitCode: null, finishedAt: null };
}

async function writeJsonAtomic(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(temporary, filePath);
}

async function readJson(filePath) {
  const text = await readFile(filePath, 'utf8');
  return JSON.parse(text.replace(/^\uFEFF/, ''));
}

async function withLock(lockPath, operation, { attempts = 100, retryDelayMs = 50 } = {}) {
  await mkdir(path.dirname(lockPath), { recursive: true });
  let handle;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      handle = await open(lockPath, 'wx');
      break;
    } catch (error) {
      if (error.code !== 'EEXIST' || attempt === attempts) throw error;
      await sleep(retryDelayMs);
    }
  }
  try {
    return await operation();
  } finally {
    await handle?.close();
    await unlink(lockPath).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
  }
}

async function queryWindowsProcess(pid) {
  if (!Number.isInteger(Number(pid)) || Number(pid) < 1) return null;
  const script = `$p = Get-CimInstance Win32_Process -Filter "ProcessId = ${Number(pid)}" -ErrorAction SilentlyContinue; if ($p) { $p | Select-Object ProcessId,CommandLine,CreationDate | ConvertTo-Json -Compress }`;
  const { stdout } = await execFileAsync(powershellPath(), ['-NoProfile', '-EncodedCommand', encodePowerShell(script)], {
    windowsHide: true,
    timeout: 10_000,
  });
  const text = stdout.trim();
  return text ? JSON.parse(text) : null;
}

async function readExitRecord(run) {
  return await exists(run.exitPath) ? readJson(run.exitPath) : null;
}

async function inspectRun(run) {
  const exitRecord = await readExitRecord(run);
  const processInfo = exitRecord ? null : await queryWindowsProcess(run.pid);
  return { ...classifyRunStatus(run, { exitRecord, processInfo }), processInfo, exitRecord };
}

async function startHiddenWorker(run) {
  const argumentString = [
    '-NoProfile',
    '-ExecutionPolicy Bypass',
    '-File', quoteWindowsArgument(run.workerScript),
    '-PayloadPath', quoteWindowsArgument(run.payloadPath),
    '-DqRunToken', quoteWindowsArgument(run.runToken),
  ].join(' ');
  const script = [
    `$p = Start-Process -FilePath ${psLiteral(run.command.executable)}`,
    `-ArgumentList ${psLiteral(argumentString)}`,
    `-WorkingDirectory ${psLiteral(run.repoRoot)}`,
    '-WindowStyle Hidden -PassThru;',
    '$p.Id',
  ].join(' ');
  const { stdout } = await execFileAsync(powershellPath(), ['-NoProfile', '-EncodedCommand', encodePowerShell(script)], {
    windowsHide: true,
    timeout: 15_000,
  });
  const pid = Number(stdout.trim().split(/\s+/).at(-1));
  if (!Number.isInteger(pid) || pid < 1) throw new Error(`Start-Process did not return a valid PID: ${stdout.trim()}`);
  return pid;
}

async function tailFile(filePath, lineCount) {
  if (!lineCount || !(await exists(filePath))) return [];
  const buffer = await readFile(filePath);
  const looksUtf16Le = (buffer[0] === 0xff && buffer[1] === 0xfe) ||
    (buffer.length >= 4 && buffer[1] === 0 && buffer[3] === 0);
  const text = looksUtf16Le
    ? buffer.subarray(buffer[0] === 0xff && buffer[1] === 0xfe ? 2 : 0).toString('utf16le')
    : buffer.toString('utf8').replace(/^\uFEFF/, '');
  return text.split(/\r?\n/).filter(Boolean).slice(-lineCount);
}

async function stopVerifiedProcess(run) {
  const script = [
    `$pidToStop = ${Number(run.pid)};`,
    '$p = Get-CimInstance Win32_Process -Filter "ProcessId = $pidToStop" -ErrorAction SilentlyContinue;',
    'if (-not $p) { @{ stopped = $false; reason = "not_running" } | ConvertTo-Json -Compress; exit 0 };',
    `$token = ${psLiteral(run.runToken)}; $worker = ${psLiteral(run.workerScript)};`,
    '$command = [string]$p.CommandLine;',
    'if ($command.IndexOf($token, [StringComparison]::OrdinalIgnoreCase) -lt 0 -or $command.IndexOf($worker, [StringComparison]::OrdinalIgnoreCase) -lt 0) { @{ stopped = $false; reason = "command_mismatch" } | ConvertTo-Json -Compress; exit 42 };',
    '$taskkill = Join-Path $env:SystemRoot "System32\\taskkill.exe";',
    '& $taskkill /PID $pidToStop /T /F | Out-Null;',
    '@{ stopped = $true; reason = "operator_requested" } | ConvertTo-Json -Compress;',
  ].join(' ');
  try {
    const { stdout } = await execFileAsync(powershellPath(), ['-NoProfile', '-EncodedCommand', encodePowerShell(script)], {
      windowsHide: true,
      timeout: 15_000,
    });
    return JSON.parse(stdout.trim());
  } catch (error) {
    if (error.code === 42 || error.exitCode === 42) throw new Error('refusing to stop PID because its command no longer matches the recorded worker');
    throw error;
  }
}

function usage() {
  return `Diagnostic Questions background crawl supervisor (Windows)

Usage:
  node scripts/dq/background.mjs start [--archive <dir>] -- crawl --write --headless [crawler options]
  node scripts/dq/background.mjs status [--archive <dir>] [--tail 20]
  node scripts/dq/background.mjs stop [--archive <dir>]

With no crawler arguments, start defaults to: crawl --write --headless
Supervisor options go before --; crawler options go after it.`;
}

async function main() {
  if (process.platform !== 'win32') throw new Error('background supervisor currently supports Windows only');
  const args = parseBackgroundArgs(process.argv.slice(2));
  if (args.help || args.command === 'help' || args.command === '--help' || args.command === '-h') {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const repoRoot = path.resolve(path.join(here, '..', '..'));
  const archiveRoot = path.resolve(args.archive ?? path.join(repoRoot, DEFAULT_ARCHIVE));
  const backgroundRoot = path.join(archiveRoot, 'background');
  const currentPath = path.join(backgroundRoot, 'current.json');
  const lockPath = path.join(backgroundRoot, 'supervisor.lock');

  if (args.command === 'start') {
    const captureArgs = normalizeCaptureArgs(args.captureArgs);
    if (!captureArgs.includes('--archive')) captureArgs.push('--archive', archiveRoot);
    const result = await withLock(lockPath, async () => {
      if (await exists(currentPath)) {
        const previous = await readJson(currentPath);
        const previousStatus = await inspectRun(previous);
        if (previousStatus.active) {
          throw new Error(`capture worker already active: run ${previous.runId}, PID ${previous.pid}`);
        }
      }
      const stamp = nowIso().replaceAll(/[:.]/g, '-');
      const runId = `dq-crawl-${stamp}`;
      const runToken = randomBytes(18).toString('hex');
      const run = createRunRecord({ repoRoot, archiveRoot, captureArgs, runId, runToken });
      await mkdir(path.dirname(run.payloadPath), { recursive: true });
      await Promise.all([writeFile(run.stdoutPath, '', 'utf8'), writeFile(run.stderrPath, '', 'utf8')]);
      await writeJsonAtomic(run.payloadPath, run);
      const pid = await startHiddenWorker(run);
      run.pid = pid;
      run.status = 'running';
      run.updatedAt = nowIso();
      await writeJsonAtomic(run.payloadPath, run);
      await writeJsonAtomic(currentPath, run);
      return run;
    });
    process.stdout.write(`${JSON.stringify({ runId: result.runId, pid: result.pid, status: result.status, stdoutPath: result.stdoutPath, stderrPath: result.stderrPath }, null, 2)}\n`);
    return;
  }

  if (args.command === 'status') {
    if (!(await exists(currentPath))) {
      process.stdout.write(`${JSON.stringify({ state: 'never_started', active: false }, null, 2)}\n`);
      return;
    }
    const run = await readJson(currentPath);
    const status = await inspectRun(run);
    process.stdout.write(`${JSON.stringify({
      runId: run.runId,
      pid: run.pid,
      captureArgs: run.captureArgs,
      ...status,
      stdoutPath: run.stdoutPath,
      stderrPath: run.stderrPath,
      stdoutTail: await tailFile(run.stdoutPath, args.tail),
      stderrTail: await tailFile(run.stderrPath, args.tail),
    }, null, 2)}\n`);
    return;
  }

  if (args.command === 'stop') {
    const report = await withLock(lockPath, async () => {
      if (!(await exists(currentPath))) return { stopped: false, reason: 'never_started' };
      const run = await readJson(currentPath);
      const status = await inspectRun(run);
      if (!status.active) return { stopped: false, reason: status.state, runId: run.runId, pid: run.pid };
      const stopped = await stopVerifiedProcess(run);
      if (!stopped.stopped) return { ...stopped, runId: run.runId, pid: run.pid };
      const finishedAt = nowIso();
      await writeJsonAtomic(run.exitPath, {
        schemaVersion: 1,
        runId: run.runId,
        runToken: run.runToken,
        pid: run.pid,
        outcome: 'stopped',
        exitCode: null,
        startedAt: run.startedAt,
        finishedAt,
        failure: null,
      });
      return { stopped: true, reason: 'operator_requested', runId: run.runId, pid: run.pid, finishedAt };
    });
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }

  throw new Error(`unknown command: ${args.command}\n\n${usage()}`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error(`[dq-background] ${error.message}`);
    process.exitCode = 1;
  });
}
