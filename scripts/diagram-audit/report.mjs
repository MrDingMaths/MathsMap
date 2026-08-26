// Wave 3 diagram lane: final per-batch report + human review checklist.
//
//   node scripts/diagram-audit/report.mjs --batch W3-2 --captures <render-out> \
//     --verdicts <tier1-verdicts.json> [--tier2 <tier2-verdicts.json>] --out <report.md>
//
// The human checklist replaces Wave-2's "eyeball every block": it lists every
// confirmed/repaired block, every compile failure, every not_applicable on a card that
// should be checkable, plus a seeded-random 10% PNG sample (seeded by batch id, so the
// sample is stable across reruns).

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { seededRandom } from './lib/audit-lib.mjs';

function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const batch = arg('--batch', 'batch');
const capturesDir = path.resolve(arg('--captures', ''));
const verdictsFile = arg('--verdicts', '');
const tier2File = arg('--tier2', '');
const outFile = arg('--out', '');
if (!arg('--captures', '') || !verdictsFile || !outFile) {
  console.error('usage: node scripts/diagram-audit/report.mjs --batch W3-n --captures <dir> --verdicts <t1.json> [--tier2 <t2.json>] --out report.md');
  process.exit(2);
}

const manifest = JSON.parse(fs.readFileSync(path.join(capturesDir, 'manifest.json'), 'utf8'));
const { verdicts } = JSON.parse(fs.readFileSync(verdictsFile, 'utf8'));
const tier2 = tier2File ? JSON.parse(fs.readFileSync(tier2File, 'utf8')).verdicts : [];
const t2ById = new Map(tier2.map(v => [v.id, v]));

const compileFails = manifest.filter(m => m.status === 'fail' || m.status === 'pending');
const flags = verdicts.filter(v => v.verdict === 'flag');
const confirmed = flags.filter(v => t2ById.get(v.id)?.verdict === 'confirmed');
const contentDefects = flags.filter(v => t2ById.get(v.id)?.verdict === 'content_defect');
const falsePositives = flags.filter(v => t2ById.get(v.id)?.verdict === 'false_positive');
const notApplicable = verdicts.filter(v => v.verdict === 'not_applicable');

// 10% seeded sample of "agrees" items (the audit's blind spot is what it waved through).
const agrees = verdicts.filter(v => v.verdict === 'agrees');
const rand = seededRandom(batch);
const sample = agrees.filter(() => rand() < 0.1);

const lines = [
  `# Diagram audit report — ${batch}`,
  '',
  `| metric | count |`,
  `|---|---:|`,
  `| blocks rendered | ${manifest.length} |`,
  `| compile failures / stalls | ${compileFails.length} |`,
  `| items audited (Tier-1) | ${verdicts.length} |`,
  `| agrees | ${agrees.length} |`,
  `| flagged (Tier-1) | ${flags.length} |`,
  `| confirmed (Tier-2) | ${confirmed.length} |`,
  `| content defects (Tier-2 → luna-style repair + human ruling) | ${contentDefects.length} |`,
  `| false positives (Tier-2) | ${falsePositives.length} |`,
  `| not_applicable | ${notApplicable.length} |`,
  '',
  '## Human checklist',
  '',
  '### Confirmed / repaired blocks (review each redraw)',
  ...(confirmed.length ? confirmed.map(v => `- [ ] ${v.id} — ${t2ById.get(v.id)?.rederivation?.slice(0, 200) || v.claim}`) : ['- (none)']),
  '',
  '### Content defects (question/answer wrong, not the figure — human ruling required)',
  ...(contentDefects.length ? contentDefects.map(v => `- [ ] ${v.id} — ${t2ById.get(v.id)?.rederivation?.slice(0, 200) || v.claim}`) : ['- (none)']),
  '',
  '### Compile failures / stalls',
  ...(compileFails.length ? compileFails.map(m => `- [ ] ${m.skillId} ${m.field} (${m.png})`) : ['- (none)']),
  '',
  '### not_applicable items on checkable cards (spot-check: should the figure have been judged?)',
  ...(notApplicable.length ? notApplicable.map(v => `- [ ] ${v.id} — ${v.reasoning || ''}`) : ['- (none)']),
  '',
  `### Seeded 10% sample of "agrees" (seed: ${batch}) — eyeball the PNGs`,
  ...(sample.length ? sample.map(v => `- [ ] ${v.id}`) : ['- (none)']),
  '',
];
fs.writeFileSync(outFile, lines.join('\n'));
console.log(`report → ${outFile} (${confirmed.length} confirmed, ${compileFails.length} compile fails, ${sample.length} sampled)`);
