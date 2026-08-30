#!/usr/bin/env node
// Blind-checker driver: spawns OpenAI gpt-5.6-luna via the `codex exec` CLI (never the codex
// MCP) to independently re-solve one skill's blinded quiz + mastery-practice bundle
// (.checkwork/{id}.blind.json, produced by scripts/blind-for-check.mjs) and hunt for defects.
//
// Two modes:
//
//   Check mode   node scripts/run-luna-check.mjs --skills id1,id2,... \
//                    [--resolve-mode full|figures-first] [--concurrency 4] \
//                    [--checkwork-dir <dir>] [--timeout-ms <ms>]
//                One stateless codex exec call per skill (pooled concurrency, default 4).
//                Writes .checkwork/{id}.luna.json = {reply, meta}. NEVER reads the key file
//                in this mode -- the string "key" appears in this file's check-mode code
//                paths only in comments stating that invariant.
//
//   Compare mode node scripts/run-luna-check.mjs --compare id1,id2,... [--checkwork-dir <dir>]
//                Reads .checkwork/{id}.luna.json AND .checkwork/{id}.key.json and reports
//                answer mismatches, coverage shortfalls and grouped flags. This is the only
//                mode allowed to touch a key file.
//
// Exactly one of --skills / --compare is required.
import { spawn } from 'node:child_process';
import { promises as fs, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultCheckworkDir = path.join(rootDir, '.checkwork');
const skillsPath = path.join(rootDir, 'data', 'skills.json');
const schemaPath = path.join(rootDir, 'scripts', 'luna-check-schema.json');

const MODEL = 'gpt-5.6-luna';
const EFFORT = 'high';
const DEFAULT_CALL_TIMEOUT_MS = 15 * 60 * 1000;
export const RESOLVE_MODES = ['full', 'figures-first'];
const TIMEOUT_MARKER = 'codex call exceeded the configured timeout';

// ---------------------------------------------------------------------------------------
// Checker brief -- the single source of truth for what an independent blind checker is
// asked to do. Embedded here (not read from a separate file) so the packet sent to luna is
// fully self-contained: luna runs read-only in an empty temp dir with zero repo access.
// ---------------------------------------------------------------------------------------

export const CHECKER_BRIEF = [
  'You are an independent blind checker for one maths skill\'s quiz + mastery practice items.',
  'Hunt for these defect classes and flag every instance you find:',
  '  - ambiguity: the stem/options admit more than one defensible reading or correct answer.',
  '  - duplication: two items are testing the same thing in a way that is redundant, not required coverage.',
  '  - under-determination: the stem does not supply enough information to reach a unique answer.',
  '  - unreachable-distractor: a wrong option does not correspond to any plausible mistake a student following the stem would make.',
  '  - figure-contradicts-answer: a [tikz]...[/tikz] diagram contradicts the stem, the options, or the intended answer.',
  '  - implausible-scenario: a word-problem setup is unrealistic or internally inconsistent.',
  '  - out-of-scope (category "scope"): the item requires knowledge outside the skill\'s stage/prereqs.',
  '',
  '[tikz]...[/tikz] blocks are the figure source -- read them as the diagram they describe.',
  '',
  'NOT-A-DEFECT LIST -- do not flag these:',
  '  - a quiz item sharing a structural type with a practice card but using different numbers/answer is required coverage, not duplication.',
  '  - a small integer coinciding with an unrelated item\'s answer is not leakage.',
  '  - content anchored to the source booklet is in scope even near a stage boundary.',
  '  - anything listed in the skill\'s prereqs below is taught and assumable -- do not flag it as untaught.',
  '  - anything in the bundle\'s `taught` block (the skill\'s own theory: intro, facts, steps) is taught and AUTHORITATIVE. Solve the items using those rules, formulas and reference values; never mark an item wrong or under-determined for relying on a rule or a rate stated there.',
  '',
  'Answer every item you receive; report counts in coverage (itemsReceived vs itemsAnswered).',
].join('\n');

export function resolveModeInstructions(resolveMode) {
  if (resolveMode === 'full') {
    return [
      'RESOLVE MODE: full.',
      'Fully re-solve every item in this packet -- every quiz item and every mastery-practice card -- with your own complete working before selecting or answering.',
    ].join('\n');
  }
  return [
    'RESOLVE MODE: figures-first (default).',
    'Fully re-solve every item whose stem or options contain a [tikz]...[/tikz] block.',
    'For every other (symbolic) item: verify the stem determines a unique answer, check each option for reachability/ambiguity/leakage, and state which option you would choose -- without full written working.',
  ].join('\n');
}

// ---------------------------------------------------------------------------------------
// Small JSON helpers.
// ---------------------------------------------------------------------------------------

async function readJsonFile(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function fileExists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------------------
// Skill card (data/skills.json): title, blurb, stage, difficulty; prereqs and dependents
// expanded to [{id, title, blurb}].
// ---------------------------------------------------------------------------------------

export async function loadSkillCard(skillId) {
  const skills = await readJsonFile(skillsPath);
  const list = Array.isArray(skills) ? skills : skills.skills;
  const byId = new Map(list.map((s) => [s.id, s]));
  const skill = byId.get(skillId);
  if (!skill) throw new Error(`${skillId}: not found in data/skills.json`);
  const expand = (ids) => (ids || [])
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((s) => ({ id: s.id, title: s.title, blurb: s.blurb }));
  const dependentIds = list.filter((s) => (s.prereqs || []).includes(skillId)).map((s) => s.id);
  return {
    id: skill.id,
    title: skill.title,
    blurb: skill.blurb,
    stage: skill.stage,
    difficulty: skill.difficulty,
    prereqs: expand(skill.prereqs),
    dependents: expand(dependentIds),
  };
}

// ---------------------------------------------------------------------------------------
// Windows codex launcher resolution + env override (ported from
// MathsDatabase/tools/subtopic-audit/audit-harness.mjs resolveWindowsCodexLauncher/
// codexCommand). On Windows, an npm-installed `codex` is a `codex.cmd` shim that Node
// refuses to spawn without shell:true post-CVE-2024-27980; running the launcher script
// directly under this Node avoids that and avoids shell:true entirely.
// ---------------------------------------------------------------------------------------

function resolveWindowsCodexLauncher() {
  if (process.platform !== 'win32') return null;
  const dirs = String(process.env.PATH || '').split(path.delimiter).filter(Boolean);
  for (const dir of dirs) {
    if (existsSync(path.join(dir, 'codex.exe'))) return null;
    if (!existsSync(path.join(dir, 'codex.cmd'))) continue;
    const launcher = path.join(dir, 'node_modules', '@openai', 'codex', 'bin', 'codex.js');
    if (existsSync(launcher)) return launcher;
  }
  return null;
}

// MM_LUNA_CODEX_CMD is a JSON array giving the command and any leading arguments, e.g.
// ["node","path/to/stub.mjs"] -- replaces the launcher entirely for tests.
function codexCommand() {
  const override = process.env.MM_LUNA_CODEX_CMD;
  if (!override) {
    const launcher = resolveWindowsCodexLauncher();
    return launcher ? { command: process.execPath, prefixArgs: [launcher] } : { command: 'codex', prefixArgs: [] };
  }
  const parts = JSON.parse(override);
  if (!Array.isArray(parts) || !parts.length) throw new Error('MM_LUNA_CODEX_CMD must be a non-empty JSON array.');
  return { command: String(parts[0]), prefixArgs: parts.slice(1).map(String) };
}

// ---------------------------------------------------------------------------------------
// Process-tree kill (ported from audit-harness.mjs killTree). child.kill() alone leaves
// codex's own children running on Windows, and a survivor can still be writing the
// structured-output temp file when a retry starts -- every caller awaits this before
// touching that file again.
// ---------------------------------------------------------------------------------------

function killTree(child) {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) return resolve();
    const done = () => resolve();
    child.once('exit', done);
    child.once('close', done);
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true })
          .on('error', () => { try { child.kill('SIGKILL'); } catch { /* already gone */ } });
      } else {
        child.kill('SIGKILL');
      }
    } catch { /* already gone */ }
    setTimeout(done, 10_000).unref?.();
  });
}

// The codex CLI echoes the whole conversation to stderr (prompt under a `user` role marker,
// reply under `codex`), so most of "stderr" is question text and model text, not
// diagnostics -- classifying against it is a false-positive machine (a multiple-choice
// distractor "$500" once read as an HTTP 500). Only the banner printed before the
// conversation starts is genuine CLI output; a credential/model/schema failure happens
// before any prompt is echoed, so it still appears here.
function diagnosticStderr(stderr) {
  const text = String(stderr || '');
  const roleMarker = /(?:^|\n)(?:user|codex)\r?\n/.exec(text);
  return roleMarker ? text.slice(0, roleMarker.index) : text;
}

// A few CLI failures are reported AFTER the conversation starts, so the banner-only rule
// above throws away the one line that explains the run: a usage-limit refusal, an expired
// or missing credential, or a server-side outage. Each of these kills a whole batch with a
// bare "codex exited 1", which reads like a code bug and is not one. These patterns anchor
// on the CLI's own line-leading "ERROR:" prefix, so echoed question text (the reason the
// rest of stderr is distrusted) cannot trip them.
const FATAL_CLI_PATTERNS = Object.freeze([
  /^ERROR:.*usage limit.*$/im,
  /^ERROR:.*(?:unauthorized|not authenticated|invalid api key|authentication failed).*$/im,
  /^ERROR:.*(?:service unavailable|internal server error|overloaded).*$/im,
]);

export function fatalCliError(stderr) {
  for (const pattern of FATAL_CLI_PATTERNS) {
    const hit = pattern.exec(String(stderr || ''));
    if (hit) return hit[0].trim();
  }
  return null;
}

export function firstDiagnosticChars(stderr, limit = 500) {
  const fatal = fatalCliError(stderr);
  if (fatal) return fatal.slice(0, limit);
  const diag = diagnosticStderr(stderr).trim();
  return diag ? diag.slice(0, limit) : '(no CLI diagnostics; see the packet log)';
}

// ---------------------------------------------------------------------------------------
// One codex exec call.
// ---------------------------------------------------------------------------------------

export function parseModelOutput(text) {
  const trimmed = String(text || '').trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```json\s*([\s\S]*?)```/);
    if (fenced) return JSON.parse(fenced[1]);
    throw new Error('reply could not be parsed as JSON');
  }
}

// Exported so other checker lanes (the booklet transcription fidelity check) drive codex
// through exactly this path — the Windows launcher resolution, the kill-tree timeout and
// the schema-constrained output are all things not worth reimplementing per lane.
// `schema` and `validate` default to this file's own reply contract.
export async function runCodexOnce({ prompt, timeoutMs, schema = schemaPath, validate = validateReplyShape }) {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'mm-luna-cwd-'));
  const outputFile = path.join(os.tmpdir(), `mm-luna-out-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  const { command, prefixArgs } = codexCommand();
  const args = [
    ...prefixArgs,
    'exec', '--ephemeral', '--skip-git-repo-check', '--ignore-rules', '--sandbox', 'read-only',
    '-C', cwd,
    '--model', MODEL,
    '--config', `model_reasoning_effort="${EFFORT}"`,
    '--output-schema', schema,
    '--output-last-message', outputFile,
    '-',
  ];

  try {
    await new Promise((resolve, reject) => {
      const child = spawn(command, args, { cwd, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      const timer = setTimeout(async () => {
        timedOut = true;
        await killTree(child);
        reject(Object.assign(new Error(`${TIMEOUT_MARKER} (${Math.round(timeoutMs / 1000)}s)`), { timedOut: true }));
      }, timeoutMs);
      child.stdout.on('data', (chunk) => { stdout += String(chunk); });
      child.stderr.on('data', (chunk) => { stderr += String(chunk); });
      child.on('error', (error) => {
        if (timedOut) return;
        clearTimeout(timer);
        reject(Object.assign(error, { spawnFailed: true }));
      });
      child.on('close', (code) => {
        if (timedOut) return;
        clearTimeout(timer);
        if (code === 0) return resolve();
        reject(new Error(`codex exited ${code}: ${firstDiagnosticChars(stderr)}`));
      });
      child.stdin.end(prompt);
    });

    if (!(await fileExists(outputFile))) throw new Error('codex exited 0 but produced no --output-last-message file');
    const raw = await fs.readFile(outputFile, 'utf8');
    const reply = parseModelOutput(raw);
    validate(reply);
    return reply;
  } finally {
    await fs.rm(cwd, { recursive: true, force: true }).catch(() => {});
    await fs.rm(outputFile, { force: true }).catch(() => {});
  }
}

// Minimal top-level shape validation against the schema's required fields -- not a full
// JSON Schema validator, just enough to catch a malformed/truncated reply and trigger a
// retry rather than writing garbage into {id}.luna.json.
export function validateReplyShape(reply) {
  const problems = [];
  if (!reply || typeof reply !== 'object') problems.push('reply is not an object');
  if (!Array.isArray(reply?.quiz)) problems.push('quiz is not an array');
  if (!Array.isArray(reply?.masteryPractice)) problems.push('masteryPractice is not an array');
  if (!Array.isArray(reply?.flags)) problems.push('flags is not an array');
  if (typeof reply?.coverage?.itemsReceived !== 'number') problems.push('coverage.itemsReceived is missing');
  if (typeof reply?.coverage?.itemsAnswered !== 'number') problems.push('coverage.itemsAnswered is missing');
  if (problems.length) throw new Error(`malformed reply: ${problems.join('; ')}`);
}

// ---------------------------------------------------------------------------------------
// Prompt.
// ---------------------------------------------------------------------------------------

export function buildPrompt({ skillId, skillCard, blindBundle, resolveMode }) {
  return [
    'CHECKER BRIEF',
    CHECKER_BRIEF,
    '',
    resolveModeInstructions(resolveMode),
    '',
    'SKILL CARD',
    JSON.stringify(skillCard, null, 2),
    '',
    `QUIZ + MASTERY PRACTICE BUNDLE FOR ${skillId} (blind -- no correct-answer flags or solution text appear anywhere below).`,
    'Its `taught` block is the skill\'s own theory exactly as the student sees it; treat its rules and reference values as authoritative when solving.',
    JSON.stringify(blindBundle, null, 2),
    '',
    'Reply ONLY with a single JSON object matching the required output schema. No prose, no markdown fencing, no commentary outside that JSON object.',
  ].join('\n');
}

// ---------------------------------------------------------------------------------------
// Pool (ported from MathsDatabase/tools/qgen/placement-codex.mjs pool()).
// ---------------------------------------------------------------------------------------

export async function pool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }));
  return results;
}

// ---------------------------------------------------------------------------------------
// Check mode. NEVER reads the key file here -- that is the whole point of a blind pass; the
// only occurrences of the string "key" in this function's reach are this comment and the
// blind bundle's own field names, which never carry answer data.
// ---------------------------------------------------------------------------------------

async function checkOneSkill({ skillId, checkworkDir, resolveMode, timeoutMs }) {
  const startedAt = new Date().toISOString();
  const startMs = Date.now();
  const blindPath = path.join(checkworkDir, `${skillId}.blind.json`);
  if (!(await fileExists(blindPath))) {
    return { skillId, ok: false, error: `run blind-for-check.mjs first (missing ${blindPath})` };
  }

  let skillCard;
  let blindBundle;
  try {
    skillCard = await loadSkillCard(skillId);
    blindBundle = await readJsonFile(blindPath);
  } catch (error) {
    return { skillId, ok: false, error: error.message };
  }

  const prompt = buildPrompt({ skillId, skillCard, blindBundle, resolveMode });

  let retries = 0;
  let lastError = null;
  const maxAttempts = 2; // one retry per skill
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const reply = await runCodexOnce({ prompt, timeoutMs });
      const durationMs = Date.now() - startMs;
      const lunaPath = path.join(checkworkDir, `${skillId}.luna.json`);
      const record = {
        reply,
        meta: { model: MODEL, effort: EFFORT, resolveMode, durationMs, retries, startedAt },
      };
      await fs.writeFile(lunaPath, `${JSON.stringify(record, null, 2)}\n`);
      return { skillId, ok: true, lunaPath, retries, durationMs };
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) retries++;
    }
  }
  return { skillId, ok: false, error: lastError?.message || 'unknown failure', retries };
}

async function runCheckMode({ skillIds, checkworkDir, resolveMode, concurrency, timeoutMs }) {
  const results = await pool(skillIds, concurrency, (skillId) =>
    checkOneSkill({ skillId, checkworkDir, resolveMode, timeoutMs }));

  console.log('');
  console.log('SKILL STATUS');
  for (const result of results) {
    if (result.ok) {
      console.log(`  OK    ${result.skillId}  (retries=${result.retries}, ${result.durationMs}ms) -> ${path.relative(rootDir, result.lunaPath)}`);
    } else {
      console.log(`  FAIL  ${result.skillId}  ${result.error}`);
    }
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.error(`\n[run-luna-check] ${failed.length} of ${results.length} skill(s) failed.`);
    process.exitCode = 1;
  }
}

// ---------------------------------------------------------------------------------------
// Compare mode. Reads .checkwork/{id}.luna.json AND .checkwork/{id}.key.json -- the only
// mode allowed to touch a key file.
// ---------------------------------------------------------------------------------------

// The shuffle-sanity check compares the checker's transcription of the option it chose
// against the key's text. The checker re-types the option in plain prose, so LaTeX
// presentation differences are pure noise: W2-1 fired 29 such warnings, every one of them
// "$1,381.80" against the key's "$\$1\,381\.80$" -- same number, two spellings. Strip
// presentation before comparing so a real transcription error (a different VALUE at a
// matching index) still surfaces. Note this can only ever soften a WARN: genuine
// disagreement is decided earlier, on chosenIndex, and is untouched by this.
function normaliseOptionText(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/\\[,;:!]/g, '')      // LaTeX thin/med/thick spaces: \, \; \: \!
    .replace(/\\text\s*\{([^}]*)\}/g, '$1')
    .replace(/\\(?:mathrm|mathit|operatorname)\s*\{([^}]*)\}/g, '$1')
    .replace(/\\\$/g, '$$')        // escaped dollar -> literal dollar
    .replace(/\$/g, '')            // strip maths delimiters AND literal dollars alike
    .replace(/\\%/g, '%')
    .replace(/[\s,]/g, '')         // whitespace + thousands commas
    .toLowerCase();
}

async function compareOneSkill(skillId, checkworkDir) {
  const lunaPath = path.join(checkworkDir, `${skillId}.luna.json`);
  const keyPath = path.join(checkworkDir, `${skillId}.key.json`);
  if (!(await fileExists(lunaPath))) return { skillId, ok: false, error: `missing ${lunaPath} -- run in --skills mode first` };
  if (!(await fileExists(keyPath))) return { skillId, ok: false, error: `missing ${keyPath} -- run scripts/blind-for-check.mjs first` };

  const lunaRecord = await readJsonFile(lunaPath);
  const key = await readJsonFile(keyPath);
  const reply = lunaRecord.reply || {};

  const keyQuizById = new Map((key.quiz || []).map((q) => [q.id, q]));
  const mismatches = [];
  const shuffleWarnings = [];
  for (const item of reply.quiz || []) {
    const keyItem = keyQuizById.get(item.id);
    if (!keyItem) continue;
    const indexMatches = item.chosenIndex === keyItem.shuffledIndexOfCorrect;
    if (!indexMatches) {
      mismatches.push({
        itemId: item.id,
        chosenIndex: item.chosenIndex,
        chosenOptionText: item.chosenOptionText,
        expectedIndex: keyItem.shuffledIndexOfCorrect,
        expectedText: keyItem.correctText,
      });
    } else if (normaliseOptionText(item.chosenOptionText) !== normaliseOptionText(keyItem.correctText)) {
      shuffleWarnings.push({
        itemId: item.id,
        chosenOptionText: item.chosenOptionText,
        expectedText: keyItem.correctText,
      });
    }
  }

  const itemsReceived = Number(reply.coverage?.itemsReceived ?? NaN);
  const itemsAnswered = Number(reply.coverage?.itemsAnswered ?? NaN);
  const coverageShortfall = !Number.isFinite(itemsReceived) || !Number.isFinite(itemsAnswered) || itemsAnswered < itemsReceived;

  const flagsByCategory = new Map();
  for (const flag of reply.flags || []) {
    const category = flag.category || 'other';
    if (!flagsByCategory.has(category)) flagsByCategory.set(category, []);
    flagsByCategory.get(category).push(flag);
  }

  return {
    skillId, ok: true, mismatches, shuffleWarnings, itemsReceived, itemsAnswered, coverageShortfall, flagsByCategory,
  };
}

async function runCompareMode({ skillIds, checkworkDir }) {
  const results = [];
  for (const skillId of skillIds) results.push(await compareOneSkill(skillId, checkworkDir));

  let anyFailure = false;
  for (const result of results) {
    console.log(`\n== ${result.skillId} ==`);
    if (!result.ok) {
      console.log(`  ERROR: ${result.error}`);
      anyFailure = true;
      continue;
    }

    console.log('  ANSWER MISMATCHES');
    if (!result.mismatches.length) {
      console.log('    none');
    } else {
      anyFailure = true;
      for (const m of result.mismatches) {
        console.log(`    ${m.itemId}: chose index ${m.chosenIndex} ("${m.chosenOptionText}"), expected index ${m.expectedIndex} ("${m.expectedText}")`);
      }
    }
    for (const w of result.shuffleWarnings) {
      console.log(`    WARN ${w.itemId}: chosenOptionText "${w.chosenOptionText}" does not equal key correctText "${w.expectedText}" at a matching index (shuffle sanity)`);
    }

    console.log('  COVERAGE');
    console.log(`    itemsAnswered=${result.itemsAnswered} itemsReceived=${result.itemsReceived}${result.coverageShortfall ? '  ** SHORTFALL **' : ''}`);
    if (result.coverageShortfall) anyFailure = true;

    console.log('  FLAGS');
    if (!result.flagsByCategory.size) {
      console.log('    none');
    } else {
      for (const [category, flags] of result.flagsByCategory) {
        console.log(`    ${category} (${flags.length}):`);
        for (const flag of flags) console.log(`      ${flag.itemId}: ${flag.note}`);
      }
    }
  }

  if (anyFailure) process.exitCode = 1;
}

// ---------------------------------------------------------------------------------------
// CLI.
// ---------------------------------------------------------------------------------------

function parseArgs(argv) {
  const opts = {
    skills: null, compare: null, resolveMode: 'figures-first', concurrency: 4,
    checkworkDir: defaultCheckworkDir, timeoutMs: DEFAULT_CALL_TIMEOUT_MS,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--skills') opts.skills = (argv[++i] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (arg === '--compare') opts.compare = (argv[++i] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (arg === '--resolve-mode') opts.resolveMode = argv[++i];
    else if (arg === '--concurrency') opts.concurrency = Number(argv[++i]);
    else if (arg === '--checkwork-dir') opts.checkworkDir = path.resolve(argv[++i] ?? '');
    else if (arg === '--timeout-ms') opts.timeoutMs = Number(argv[++i]);
    else { console.error(`Unknown argument: ${arg}`); process.exit(2); }
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (!opts.skills && !opts.compare) {
    console.error('Usage: node scripts/run-luna-check.mjs --skills id1,id2,... [--resolve-mode full|figures-first] [--concurrency 4] [--checkwork-dir <dir>]');
    console.error('       node scripts/run-luna-check.mjs --compare id1,id2,... [--checkwork-dir <dir>]');
    process.exit(1);
  }
  if (opts.skills && opts.compare) {
    console.error('[run-luna-check] pass exactly one of --skills or --compare, not both.');
    process.exit(1);
  }

  await fs.mkdir(opts.checkworkDir, { recursive: true });

  if (opts.compare) {
    await runCompareMode({ skillIds: opts.compare, checkworkDir: opts.checkworkDir });
    return;
  }

  if (!RESOLVE_MODES.includes(opts.resolveMode)) {
    console.error(`[run-luna-check] --resolve-mode must be one of: ${RESOLVE_MODES.join(', ')}`);
    process.exit(1);
  }
  if (!Number.isFinite(opts.concurrency) || opts.concurrency < 1) {
    console.error('[run-luna-check] --concurrency must be a positive number.');
    process.exit(1);
  }

  await runCheckMode({
    skillIds: opts.skills, checkworkDir: opts.checkworkDir,
    resolveMode: opts.resolveMode, concurrency: opts.concurrency, timeoutMs: opts.timeoutMs,
  });
}

// Only run as a CLI. Tests import this module for its pure helpers (diagnostic
// classification), and an unconditional main() would exit the test process on argv misuse.
const invokedDirectly = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  main().catch((err) => {
    console.error('[run-luna-check] failed:', err);
    process.exit(1);
  });
}
