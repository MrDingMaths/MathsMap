import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {applyPrune, liveReferences, prunePlan, removeTree} from '../scripts/booklet/storage-prune.mjs';

const DAY = 86400e3;

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mathsmap-prune-'));
  t.after(() => removeTree(root));
  const now = Date.now();
  const put = (relative, {days = 30, text = relative} = {}) => {
    const file = path.join(root, relative);
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, text);
    const time = new Date(now - days * DAY);
    fs.utimesSync(file, time, time);
  };
  const link = (target, relative) => {
    const file = path.join(root, relative);
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.symlinkSync(path.join(root, target), file, 'junction');
  };
  const exists = relative => fs.existsSync(path.join(root, relative));
  const exported = (run, name, days) => {
    for (const file of ['runtime-manifest.json', 'report.json', 'book.pdf', 'cache.json', 'runtime/src/main.js', 'runtime/vite.config.js', 'vite-cache/deps.json', 'pdf-rasters/page.png'])
      put(`.booklet-work/full-imports/${run}/${name}/${file}`, {days});
  };

  put('node_modules/vite/package.json');
  put('.booklet-work/render-cache/diagram.json');

  const old = '.booklet-work/full-imports/old-run/';
  for (const file of ['manifest.json', 'config.json', 'evidence/pages/page-001.png', 'workflow/state.json', 'lean-review/reviewed.json', 'lean-review/calls/one/events.jsonl', 'notes.md', 'draft.project.json', 'referenced-proof.json', 'review/rasters/kept.png', 'pool/assignment.lock']) put(old + file);
  exported('old-run', 'final-export-1', 31);
  exported('old-run', 'final-export-2', 30);

  put('.booklet-work/full-imports/recent-run/draft.project.json', {days: 0});
  exported('recent-run', 'early-export', 1);
  exported('recent-run', 'final-export', 0);

  put('.booklet-work/lean-review-Ab12Cd/result.json');
  put('.booklet-work/completed-export-Zz99Yy/result.json', {days: 0});
  put('.booklet-work/word-studio/session.json');
  put('.booklet-work/tracked-run/kept.json');
  put('.agywork/tikz-card-capture-test-123/shot.png');

  put('.agywork/content-campaign/live/skill-a/packet.json', {days: 0});
  put('.agywork/content-campaign/live/skill-b/packet.json');
  for (const file of ['ledger.json', 'skill-a/ticket.json', 'skill-a/attempt/packet.json', 'skill-a/attempt/candidate.json', 'skill-a/attempt/proof.json']) put('.agywork/content-campaign/done/' + file);

  // Evidence notes mix separators, absolute prefixes and trailing prose.
  put('booklets/projects/book.json', {text: JSON.stringify({
    evidence: root + '\\.booklet-work\\full-imports\\old-run/referenced-proof.json',
    note: 'Inspected .booklet-work/full-imports/old-run/review/rasters/kept.png; accepted.',
  })});
  put('booklets/provenance/campaign/record.json', {text: JSON.stringify({reference: {path: '.agywork/content-campaign/done/skill-a/attempt/proof.json', hash: 'abc'}})});
  return {root, now, put, link, exists, plan: options => prunePlan({root, now, tracked: new Set(['.booklet-work/tracked-run/kept.json']), ...options})};
}
const paths = plan => plan.deletions.map(item => item.path);

test('preview removes nothing and limits regenerable payload to exports that are not current', t => {
  const f = fixture(t), plan = f.plan(), listed = paths(plan);
  const old = '.booklet-work/full-imports/old-run/', recent = '.booklet-work/full-imports/recent-run/';
  for (const name of ['final-export-1', 'final-export-2']) for (const item of ['runtime', 'vite-cache', 'pdf-rasters', 'cache.json']) assert.ok(listed.includes(old + name + '/' + item), name + '/' + item);
  for (const item of ['runtime', 'vite-cache', 'pdf-rasters', 'cache.json']) {
    assert.ok(listed.includes(recent + 'early-export/' + item));
    assert.ok(!listed.includes(recent + 'final-export/' + item), 'newest export of an active run stays');
  }
  assert.ok(listed.includes('.booklet-work/lean-review-Ab12Cd') && listed.includes('.agywork/tikz-card-capture-test-123'));
  assert.ok(!listed.includes('.booklet-work/completed-export-Zz99Yy'), 'a test folder still in use stays');
  assert.ok(!listed.some(item => item.startsWith('.booklet-work/word-studio') || item.startsWith('.booklet-work/render-cache') || item.startsWith('.agywork/content-campaign')));
  assert.ok(!listed.includes(old + 'review/rasters'), 'a referenced raster folder stays');
  assert.ok(!listed.some(item => /report\.json|book\.pdf|draft\.project/.test(item)), 'records stay without --records');
  assert.equal(plan.totals['frozen-copy'].files, 6);
  for (const item of listed) assert.ok(f.exists(item), 'preview left ' + item);
});

test('apply unlinks junctions inside frozen copies and leaves their targets intact', t => {
  const f = fixture(t), runtime = '.booklet-work/full-imports/old-run/final-export-1/runtime/';
  try {
    f.link('node_modules', runtime + 'node_modules');
    f.link('.booklet-work/render-cache', runtime + '.booklet-work/render-cache');
  } catch (error) { if (error.code === 'EPERM') return t.skip('junctions are not permitted here'); throw error; }
  const result = applyPrune(f.root, f.plan());
  assert.deepEqual(result.errors, []);
  assert.equal(result.unlinked, 2);
  assert.ok(!f.exists(runtime.slice(0, -1)));
  assert.ok(f.exists('node_modules/vite/package.json') && f.exists('.booklet-work/render-cache/diagram.json'));
  assert.ok(f.exists('.booklet-work/full-imports/old-run/final-export-1/report.json'));
  assert.ok(f.exists('.booklet-work/full-imports/recent-run/final-export/runtime/src/main.js'));
  assert.ok(!f.exists('.booklet-work/lean-review-Ab12Cd') && f.exists('.booklet-work/completed-export-Zz99Yy/result.json'));
});

test('records mode keeps essentials, leases, references and tracked files in idle runs only', t => {
  const f = fixture(t), plan = f.plan({records: true});
  assert.deepEqual(applyPrune(f.root, plan).errors, []);
  const old = '.booklet-work/full-imports/old-run/';
  for (const file of ['manifest.json', 'config.json', 'evidence/pages/page-001.png', 'workflow/state.json', 'lean-review/reviewed.json', 'notes.md', 'referenced-proof.json', 'review/rasters/kept.png', 'pool/assignment.lock', 'final-export-2/report.json', 'final-export-2/book.pdf'])
    assert.ok(f.exists(old + file), 'kept ' + file);
  for (const file of ['draft.project.json', 'lean-review/calls', 'final-export-1', 'final-export-2/runtime', 'final-export-2/cache.json', 'final-export-2/runtime-manifest.json'])
    assert.ok(!f.exists(old + file), 'removed ' + file);
  assert.ok(f.exists('.booklet-work/full-imports/recent-run/draft.project.json'), 'a run active this week keeps its records');
  assert.ok(f.exists('.booklet-work/tracked-run/kept.json'));
  assert.ok(!f.exists('.booklet-work/word-studio'), 'an idle folder with only records is removed');
  const done = '.agywork/content-campaign/done/';
  for (const file of ['ledger.json', 'skill-a/ticket.json', 'skill-a/attempt/candidate.json', 'skill-a/attempt/proof.json']) assert.ok(f.exists(done + file), 'kept ' + file);
  assert.ok(!f.exists(done + 'skill-a/attempt/packet.json'));
  assert.ok(f.exists('.agywork/content-campaign/live/skill-b/packet.json'), 'a campaign with any recent activity is untouched');
  assert.ok(plan.skipped.some(item => item.path === '.agywork/content-campaign/live'));
});

test('references resolve through mixed separators and trailing prose; unsafe plan paths are refused', t => {
  const f = fixture(t), references = liveReferences(f.root);
  assert.ok(references.files.has('.booklet-work/full-imports/old-run/referenced-proof.json'));
  assert.ok(references.files.has('.booklet-work/full-imports/old-run/review/rasters/kept.png'));
  assert.ok(references.files.has('.agywork/content-campaign/done/skill-a/attempt/proof.json'));
  const result = applyPrune(f.root, {deletions: [{path: 'node_modules'}, {path: '.booklet-work/../node_modules'}, {path: 'booklets/projects/book.json'}]});
  assert.equal(result.errors.length, 3);
  assert.ok(f.exists('node_modules/vite/package.json') && f.exists('booklets/projects/book.json'));
});
