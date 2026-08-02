// Shared CLI-misuse guard for audit/validate scripts.
//
// These scripts take flags like `--only`, whose value is a single comma-
// separated token (`--only id1,id2,id3`). It's an easy mistake to instead
// pass the ids as separate positionals (`--only id1 id2 id3`), which silently
// filters to just `id1` — the rest are dropped without any error. This guard
// makes that mistake loud: after each script consumes its known flags (and
// each value-flag's following token), anything left over is a stray
// positional and we exit 2 (CLI misuse) rather than proceed on bad input.
//
// Usage:
//   import { rejectStrayPositionals } from './lib/argv.mjs';
//   rejectStrayPositionals(argv, { valueFlags: ['--only'], boolFlags: ['--strict'] });
export function rejectStrayPositionals(argv, { valueFlags = ['--only'], boolFlags = ['--strict'] } = {}) {
  const consumed = new Array(argv.length).fill(false);
  for (let i = 0; i < argv.length; i++) {
    if (consumed[i]) continue;
    if (valueFlags.includes(argv[i])) {
      consumed[i] = true;
      if (i + 1 < argv.length) consumed[i + 1] = true;
    } else if (boolFlags.includes(argv[i])) {
      consumed[i] = true;
    }
  }
  const stray = argv.filter((_, i) => !consumed[i]);
  if (stray.length) {
    console.error(`✗ Unrecognised argument(s): ${stray.join(' ')}`);
    console.error('  Hint: use the comma form: --only id1,id2,id3');
    process.exit(2);
  }
}
