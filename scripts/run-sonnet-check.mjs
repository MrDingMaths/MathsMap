// Blind answer check on Claude Sonnet 5, via the `claude` CLI and the user's Claude
// subscription. A drop-in alternative to run-luna-check.mjs's --skills mode.
//
//   node scripts/blind-for-check.mjs <ids...>                    # same as before
//   node scripts/run-sonnet-check.mjs --skills id1,id2 [--concurrency 3]
//   node scripts/run-luna-check.mjs --compare id1,id2            # unchanged
//
// WHY THIS EXISTS. The blind check's whole value is that the checker is a DIFFERENT model
// from the generator, so it does not re-solve with the same blind spots that produced the
// error. Wave 3 generates on Gemini flash via agy, so any Claude- or GPT-family checker
// preserves that independence; running the check on Gemini would not. This driver is the
// Claude-subscription path (owner decision 2026-08-26), chosen over waiting out a codex
// usage limit. Note it DOES spend Claude credit, unlike the rest of the Wave-3 pipeline.
//
// SINGLE SOURCE. The checker brief, resolve-mode instructions, skill card, prompt builder,
// reply-shape validation and concurrency pool are imported from run-luna-check.mjs — the two
// checkers must never drift apart, or their results stop being comparable.
//
// OUTPUT. Writes .checkwork/{id}.luna.json in exactly the shape --compare consumes
// (`{reply, meta}`), with meta.model recording which checker actually ran. The filename
// keeps the `.luna.json` suffix on purpose: --compare, the repair lane and the queue rows
// all address it by that name, and a second suffix would fork the pipeline for no gain.

import { spawn } from 'node:child_process';
import { promises as fs, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  RESOLVE_MODES, buildPrompt, loadSkillCard, parseModelOutput, pool, validateReplyShape,
} from './run-luna-check.mjs';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultCheckworkDir = path.join(rootDir, '.checkwork');
const schemaPath = path.join(rootDir, 'scripts', 'luna-check-schema.json');

const MODEL = process.env.MM_SONNET_MODEL || 'claude-sonnet-5';
const DEFAULT_CALL_TIMEOUT_MS = 20 * 60 * 1000;
const THINKING_TOKENS = 16000;

// On Windows an npm-installed `claude` is a .cmd shim Node refuses to spawn without
// shell:true (post-CVE-2024-27980); the package ships a real native exe, so spawn that.
// Ported from MathsDatabase/tools/qgen/lib/agent-cli.mjs resolveWindowsClaude.
export function resolveClaudeCommand() {
  const override = process.env.MM_CLAUDE_CMD;
  if (override) {
    const parts = JSON.parse(override);
    if (!Array.isArray(parts) || !parts.length) throw new Error('MM_CLAUDE_CMD must be a non-empty JSON array.');
    return { command: String(parts[0]), prefixArgs: parts.slice(1).map(String) };
  }
  if (process.platform !== 'win32') return { command: 'claude', prefixArgs: [] };
  for (const dir of String(process.env.PATH || '').split(path.delimiter).filter(Boolean)) {
    const exe = path.join(dir, 'claude.exe');
    if (existsSync(exe)) return { command: exe, prefixArgs: [] };
    if (!existsSync(path.join(dir, 'claude.cmd'))) continue;
    const packaged = path.join(dir, 'node_modules', '@anthropic-ai', 'claude-code', 'bin', 'claude.exe');
    if (existsSync(packaged)) return { command: packaged, prefixArgs: [] };
  }
  return { command: 'claude', prefixArgs: [] };
}

// `claude -p --output-format json` prints one result envelope:
//   {"type":"result","result":"…text…","usage":{…},"is_error":false,…}
// The checker's JSON reply is inside `result` as text, so it is parsed in two stages.
export function parseClaudeEnvelope(stdout) {
  const text = String(stdout || '').trim();
  let envelope = null;
  try {
    const direct = JSON.parse(text);
    if (direct && typeof direct === 'object') envelope = direct;
  } catch {
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('{') || !trimmed.includes('"result"')) continue;
      try {
        const event = JSON.parse(trimmed);
        if (event && event.type === 'result') envelope = event;
      } catch { /* a partial line is not an error */ }
    }
  }
  if (!envelope) throw new Error('claude produced no parseable result envelope');
  if (envelope.is_error === true) throw new Error(`claude reported an error: ${String(envelope.result || '').slice(0, 300)}`);
  if (typeof envelope.result !== 'string') throw new Error('claude result envelope carries no text result');
  const u = envelope.usage || {};
  const num = v => (Number.isFinite(Number(v)) ? Number(v) : null);
  return {
    text: envelope.result,
    usage: {
      input_tokens: (num(u.input_tokens) ?? 0) + (num(u.cache_read_input_tokens) ?? 0) + (num(u.cache_creation_input_tokens) ?? 0),
      cached_input_tokens: num(u.cache_read_input_tokens),
      output_tokens: num(u.output_tokens),
    },
  };
}

async function runClaudeOnce({ prompt, timeoutMs }) {
  const { command, prefixArgs } = resolveClaudeCommand();
  // --strict-mcp-config + --setting-sources project: the checker must not inherit MCP
  // servers or user settings that could give it a way to see the answer key on disk.
  const args = [...prefixArgs, '-p', '--model', MODEL, '--output-format', 'json',
    '--strict-mcp-config', '--setting-sources', 'project'];

  const stdout = await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, MAX_THINKING_TOKENS: String(THINKING_TOKENS) },
    });
    let out = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try { child.kill('SIGKILL'); } catch { /* already gone */ }
      reject(new Error(`claude call exceeded the configured timeout (${Math.round(timeoutMs / 1000)}s)`));
    }, timeoutMs);
    child.stdout.on('data', d => { out += String(d); });
    child.stderr.on('data', d => { stderr = (stderr + String(d)).slice(-4000); });
    child.on('error', error => { if (!timedOut) { clearTimeout(timer); reject(error); } });
    child.on('close', code => {
      if (timedOut) return;
      clearTimeout(timer);
      if (code === 0) return resolve(out);
      reject(new Error(`claude exited ${code}: ${stderr.trim().slice(0, 400) || '(no stderr)'}`));
    });
    child.stdin.end(prompt);
  });

  const { text, usage } = parseClaudeEnvelope(stdout);
  const reply = parseModelOutput(text);
  validateReplyShape(reply);
  return { reply, usage };
}

async function checkOneSkill({ skillId, checkworkDir, resolveMode, timeoutMs }) {
  const startedAt = new Date().toISOString();
  const startMs = Date.now();
  const blindPath = path.join(checkworkDir, `${skillId}.blind.json`);
  if (!existsSync(blindPath)) {
    return { skillId, ok: false, error: `run blind-for-check.mjs first (missing ${blindPath})` };
  }

  let skillCard;
  let blindBundle;
  try {
    skillCard = await loadSkillCard(skillId);
    blindBundle = JSON.parse(await fs.readFile(blindPath, 'utf8'));
  } catch (error) {
    return { skillId, ok: false, error: error.message };
  }

  // The codex driver hands the schema to the CLI as --output-schema, which constrains
  // decoding. The claude CLI has no equivalent flag, so the schema has to travel in the
  // prompt — without it the first real run returned prose-shaped JSON with none of the
  // required arrays, and every skill failed shape validation.
  const schemaText = await fs.readFile(schemaPath, 'utf8');
  const prompt = [
    buildPrompt({ skillId, skillCard, blindBundle, resolveMode }),
    '',
    'REQUIRED OUTPUT SCHEMA (JSON Schema). Your entire reply must be ONE JSON object that',
    'validates against this — every required property present, no extra properties, and',
    `"skillId" set to ${JSON.stringify(skillId)}:`,
    schemaText,
  ].join('\n');

  let retries = 0;
  let lastError = null;
  const maxAttempts = 2; // one retry per skill, same policy as the luna driver
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { reply, usage } = await runClaudeOnce({ prompt, timeoutMs });
      const durationMs = Date.now() - startMs;
      const outPath = path.join(checkworkDir, `${skillId}.luna.json`);
      const record = { reply, meta: { model: MODEL, checker: 'claude-cli', resolveMode, durationMs, retries, startedAt, usage } };
      await fs.writeFile(outPath, `${JSON.stringify(record, null, 2)}\n`);
      return { skillId, ok: true, outPath, retries, durationMs, usage };
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) retries++;
    }
  }
  return { skillId, ok: false, error: lastError?.message || 'unknown failure', retries };
}

function parseArgs(argv) {
  const opts = { skills: [], checkworkDir: defaultCheckworkDir, resolveMode: 'figures-first', concurrency: 3, timeoutMs: DEFAULT_CALL_TIMEOUT_MS };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag === '--skills') { opts.skills = String(value || '').split(',').map(s => s.trim()).filter(Boolean); i++; }
    else if (flag === '--checkwork-dir') { opts.checkworkDir = path.resolve(value || ''); i++; }
    else if (flag === '--resolve-mode') { opts.resolveMode = String(value || ''); i++; }
    else if (flag === '--concurrency') { opts.concurrency = Number(value); i++; }
    else if (flag === '--timeout-ms') { opts.timeoutMs = Number(value); i++; }
    else { console.error(`[run-sonnet-check] unrecognised argument: ${flag}`); process.exit(2); }
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.skills.length) {
    console.error('Usage: node scripts/run-sonnet-check.mjs --skills id1,id2,... [--resolve-mode full|figures-first] [--concurrency 3] [--checkwork-dir <dir>]');
    console.error('Then compare with: node scripts/run-luna-check.mjs --compare id1,id2,...');
    process.exit(1);
  }
  if (!RESOLVE_MODES.includes(opts.resolveMode)) {
    console.error(`[run-sonnet-check] --resolve-mode must be one of: ${RESOLVE_MODES.join(', ')}`);
    process.exit(1);
  }

  console.log(`[run-sonnet-check] checker model: ${MODEL} (spends Claude subscription credit)`);
  const results = await pool(opts.skills, opts.concurrency, skillId =>
    checkOneSkill({ skillId, checkworkDir: opts.checkworkDir, resolveMode: opts.resolveMode, timeoutMs: opts.timeoutMs }));

  console.log('');
  console.log('SKILL STATUS');
  let inTokens = 0;
  let outTokens = 0;
  for (const r of results) {
    if (r.ok) {
      inTokens += r.usage?.input_tokens || 0;
      outTokens += r.usage?.output_tokens || 0;
      console.log(`  OK    ${r.skillId}  (retries=${r.retries}, ${Math.round(r.durationMs / 1000)}s) -> ${path.relative(rootDir, r.outPath)}`);
    } else {
      console.log(`  FAIL  ${r.skillId}  ${r.error}`);
    }
  }
  const failed = results.filter(r => !r.ok);
  console.log('');
  console.log(`[run-sonnet-check] ${results.length - failed.length}/${results.length} ok; tokens in=${inTokens} out=${outTokens}`);
  if (failed.length) {
    console.log(`[run-sonnet-check] ${failed.length} skill(s) failed.`);
    process.exit(1);
  }
  console.log(`[run-sonnet-check] next: node scripts/run-luna-check.mjs --compare ${opts.skills.join(',')}`);
}

const invokedDirectly = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch(err => { console.error('[run-sonnet-check] failed:', err); process.exit(1); });
}
