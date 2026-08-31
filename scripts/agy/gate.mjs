// Runs the whole deterministic gate over one batch's skill ids and prints ONE compact
// summary instead of seven command outputs.
//
//   node scripts/agy/gate.mjs --only id1,id2,...
//   node scripts/agy/gate.mjs --only id1,id2 --json      # machine-readable, for a repair build
//   node scripts/agy/gate.mjs --unscoped                 # wave regression run (dup audit only)
//
// Why this exists: the gate itself takes seconds, but reading seven scrolling outputs was
// costing an orchestrator turn per round — and the orchestrator's turns, not Gemini's, are
// the batch's wall-clock. `--json` emits {command, ok, defects[]} so a defects.json for
// build-repair-tasks can be assembled without re-reading anything.
//
// `validate.mjs` takes NO --strict (it exits 2 on an unrecognised argument); every other
// command does. That asymmetry has burned two batches — it is encoded here so it cannot.

import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const only = arg('--only', '');
const unscoped = process.argv.includes('--unscoped');
const asJson = process.argv.includes('--json');
if (!only && !unscoped) {
  console.error('usage: node scripts/agy/gate.mjs --only id1,id2,... [--json] | --unscoped');
  process.exit(2);
}

// script → takes --strict?
const GATE = [
  ['scripts/validate.mjs', false],
  ['scripts/audit-arithmetic.mjs', true],
  ['scripts/audit-equivalent-options.mjs', true],
  ['scripts/audit-duplicate-stems.mjs', true],
  ['scripts/audit-option-hygiene.mjs', true],
  ['scripts/audit-intersecting-features.mjs', true],
  ['scripts/audit-figure-scale.mjs', true],
  ['scripts/audit-figure-quota.mjs', true],
  ['scripts/audit-angle-arms.mjs', true],
  ['scripts/audit-tangent-lines.mjs', true],
];

// Gate scripts print a defect as a `✗ CLASS` (or `✗ where: message`) line followed by
// indented detail lines, and close with a `✗ N …defect(s).` tally that is a summary, not a
// defect. Collect the header plus its detail block, drop the tally.
function parseDefects(output) {
  const lines = output.split(/\r?\n/);
  const defects = [];
  for (let i = 0; i < lines.length; i++) {
    const header = /^\s*✗\s+(.+)$/.exec(lines[i]);
    if (!header || /^\d+\s/.test(header[1])) continue;
    const detail = [];
    while (i + 1 < lines.length && /^\s{3,}\S/.test(lines[i + 1])) detail.push(lines[++i].trim());
    defects.push([header[1].trim(), ...detail].join(' | '));
  }
  return defects;
}

function run(script, takesStrict) {
  const args = [path.join(rootDir, script)];
  if (takesStrict) args.push('--strict');
  if (only) args.push('--only', only);
  const proc = spawnSync(process.execPath, args, { cwd: rootDir, encoding: 'utf8' });
  const output = `${proc.stdout || ''}${proc.stderr || ''}`;
  const defects = parseDefects(output);
  return { command: path.basename(script), ok: proc.status === 0, exitCode: proc.status, defects, output };
}

const commands = unscoped
  ? [run('scripts/audit-duplicate-stems.mjs', true)]
  : GATE.map(([script, strict]) => run(script, strict));

if (asJson) {
  console.log(JSON.stringify({ only, unscoped, ok: commands.every(c => c.ok), commands: commands.map(({ output, ...c }) => c) }, null, 2));
  process.exit(commands.every(c => c.ok) ? 0 : 1);
}

let total = 0;
for (const c of commands) {
  const mark = c.ok ? '✓' : '✗';
  console.log(`${mark} ${c.command}${c.ok ? '' : ` — ${c.defects.length || 'exit ' + c.exitCode} defect(s)`}`);
  for (const d of c.defects) console.log(`    ${d}`);
  total += c.defects.length;
}
const clean = commands.every(c => c.ok);
console.log(`\n${clean ? '✓ gate clean' : `✗ gate dirty — ${total} defect line(s) across ${commands.filter(c => !c.ok).length} command(s)`}`);
if (!clean) process.exit(1);
