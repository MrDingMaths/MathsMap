import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STANDING_HAZARDS, standingHazardsBlock } from '../scripts/agy/lib/hazards.mjs';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const batchDir = path.join(rootDir, 'scripts', 'agy', 'batches');
const read = f => JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, ''));

const skillsRaw = read(path.join(rootDir, 'data', 'skills.json'));
const skillIds = new Set((Array.isArray(skillsRaw) ? skillsRaw : skillsRaw.skills).map(s => s.id));
const TIKZ_SECTIONS = new Set(['angles', 'data-displays', 'tables', 'curve', 'bearings', 'circle', 'polygons', 'solids-3d', 'carryover']);

// Only the batches still to run live in batches/; a generated batch's config is moved to
// batches/done/ so the ALREADY-COMPLETE assertions below keep meaning something.
const configs = fs.readdirSync(batchDir).filter(f => f.endsWith('.json')).map(f => ({ file: f, config: read(path.join(batchDir, f)) }));

// Wave 3 closed with W3-11 (2026-08-30) and `batches/` is now empty, so the two wave-census
// assertions this file used to carry — the exact remaining-batch list `['W3-11']` and the
// remaining-skill count `23` — have been retired with the wave. They pinned numbers that only
// meant something while Wave 3 was mid-flight; re-asserting `[]` and `0` would pin nothing and
// would fail spuriously the day a Wave-4 config lands. Everything else in this file keeps a
// standing job: the per-config schema guard, the no-duplicate rule and the ALREADY-COMPLETE
// rule all fire the moment a new config appears in `batches/`, and the standing-hazard test
// guards `hazards.mjs`, which every future generation round AND every repair round injects from.
test('batches/ holds only well-formed configs (vacuous while no wave is in flight)', () => {
  for (const { file, config } of configs) {
    assert.ok(config.batch, `${file}: needs a batch name`);
    assert.equal(typeof config.model, 'string', `${file}: needs a model`);
  }
});

for (const { file, config } of configs) {
  test(`${file}: skill ids exist, booklets exist, tikz sections are real`, () => {
    assert.ok(config.sections.length, 'has sections');
    for (const section of config.sections) {
      assert.ok(section.skillIds.length, `${section.name} has skills`);
      for (const id of section.skillIds) {
        assert.ok(skillIds.has(id), `${section.name}: unknown skill ${id}`);
      }
      for (const rel of section.bookletPaths || []) {
        assert.ok(fs.existsSync(path.join(rootDir, rel)), `${section.name}: missing booklet ${rel}`);
      }
      for (const s of section.tikzSections || []) {
        assert.ok(TIKZ_SECTIONS.has(s), `${section.name}: unknown tikz section ${s}`);
      }
      // Topic hazards steer QUESTION authoring, so they are required of a generation config.
      // A theory-lane config (`lane: "theory"`) authors no items: build-theory-tasks.mjs never
      // reads `section.hazards` — it injects the drawing-only standing hazards itself — so
      // demanding three per section there would be cargo-culted ceremony.
      if (config.lane !== 'theory') {
        assert.ok((section.hazards || []).length >= 3, `${section.name}: needs topic hazards`);
      }
    }
  });
}

test('no skill is generated twice across the remaining batches', () => {
  const seen = new Map();
  for (const { config } of configs) {
    for (const section of config.sections) {
      for (const id of section.skillIds) {
        assert.ok(!seen.has(id), `${id} appears in both ${seen.get(id)} and ${config.batch}`);
        seen.set(id, config.batch);
      }
    }
  }
});

// A batch is "started" once its generation tasks exist: `.agywork/<batch>/gen`. The workflow
// pipelines — batch N+1's generation is launched the moment batch N collects — so a started
// batch's skills legitimately have content on disk before the batch is adjudicated and its
// config retired to batches/done/. The ALREADY-COMPLETE rule is about queueing a skill some
// EARLIER wave already finished, so only unstarted batches can answer it (W3-7).
const isStarted = batch => fs.existsSync(path.join(rootDir, '.agywork', batch, 'gen'));

test('a skill already generated is never re-queued', () => {
  for (const { config } of configs) {
    // The ALREADY-COMPLETE rule guards the GENERATION lane, where a queued skill that already
    // has content is duplicated work. The theory lane inverts the selection on purpose — it
    // rewrites theory that already shipped — so every one of its skills has content by
    // definition and this assertion would fail every theory config ever written.
    if (config.lane === 'theory') continue;
    if (isStarted(config.batch)) continue;
    for (const section of config.sections) {
      for (const id of section.skillIds) {
        assert.ok(!fs.existsSync(path.join(rootDir, 'public', 'content', `${id}.json`)),
          `${id} already has content — apply the ALREADY-COMPLETE rule and drop it from ${config.batch}`);
      }
    }
  }
});

test('standing hazards cover the measured defect classes and are lane-tagged', () => {
  const ids = STANDING_HAZARDS.map(h => h.id);
  for (const required of ['closed-option-set', 'bare-tex', 'arithmetic-in-prose', 'mastery-scope', 'value-signature-independence']) {
    assert.ok(ids.includes(required), `missing standing hazard ${required}`);
  }
  const gen = standingHazardsBlock('gen');
  const repair = standingHazardsBlock('repair');
  assert.match(gen, /figures-must-be-drawn/);      // generation-only
  assert.doesNotMatch(repair, /figures-must-be-drawn/);
  for (const block of [gen, repair]) assert.match(block, /closed-option-set/);
});
