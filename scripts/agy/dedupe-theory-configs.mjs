// A skill tagged to dot points in two topics lands in two theory batches, where two agents would
// rewrite the same theory block and the second apply-repairs would silently overwrite the first.
// Keep each skill in the EARLIEST batch (Stage 4 owns a skill it shares with Stage 5 Core) and
// strip it everywhere else; drop any section left empty.
//
//   node scripts/agy/dedupe-theory-configs.mjs --dir scripts/agy/batches --prefix T
import fs from 'node:fs';
import path from 'node:path';

const arg = (f, d) => { const i = process.argv.indexOf(f); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const dir = arg('--dir', 'scripts/agy/batches');
const prefix = arg('--prefix', 'T');
const files = fs.readdirSync(dir).filter((f) => f.startsWith(prefix) && f.endsWith('.json')).sort();
const seen = new Set();
let removed = 0;
for (const f of files) {
  const p = path.join(dir, f);
  const config = JSON.parse(fs.readFileSync(p, 'utf8'));
  for (const s of config.sections) {
    const before = s.skillIds.length;
    s.skillIds = s.skillIds.filter((id) => !seen.has(id));
    removed += before - s.skillIds.length;
    for (const id of s.skillIds) seen.add(id);
  }
  const kept = config.sections.filter((s) => s.skillIds.length);
  const dropped = config.sections.length - kept.length;
  config.sections = kept;
  fs.writeFileSync(p, JSON.stringify(config, null, 2) + '\n');
  console.log(`${f}: ${config.sections.reduce((a, s) => a + s.skillIds.length, 0)} skill(s), ${config.sections.length} section(s)${dropped ? ` (${dropped} emptied)` : ''}`);
}
console.log(`\n${seen.size} unique skill(s); ${removed} duplicate assignment(s) removed`);
