#!/usr/bin/env node
// Validates the MathsMap taxonomy in /data: referential integrity, acyclic
// prerequisite graph, stage-monotonic prereqs, and orphan reporting.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const load = (f) => JSON.parse(readFileSync(join(dataDir, f), 'utf8'));

const courses = load('courses.json');
const topics = load('topics.json');
const dotpoints = load('dotpoints.json');
const skills = load('skills.json');

const errors = [];
const warnings = [];

const courseIds = new Set(courses.map((c) => c.id));
const topicIds = new Set(topics.map((t) => t.id));
const dotpointIds = new Set(dotpoints.map((d) => d.id));
const skillById = new Map(skills.map((s) => [s.id, s]));

// Duplicate ids
const seen = new Set();
for (const s of skills) {
  if (seen.has(s.id)) errors.push(`Duplicate skill id: ${s.id}`);
  seen.add(s.id);
}

// Referential integrity
for (const t of topics) {
  for (const c of t.courses || []) if (!courseIds.has(c)) errors.push(`topic ${t.id} → unknown course ${c}`);
}
for (const d of dotpoints) {
  if (!topicIds.has(d.topicId)) errors.push(`dotpoint ${d.id} → unknown topic ${d.topicId}`);
}
for (const s of skills) {
  for (const c of s.courses || []) if (!courseIds.has(c)) errors.push(`skill ${s.id} → unknown course ${c}`);
  for (const dp of s.dotPointIds || []) if (!dotpointIds.has(dp)) errors.push(`skill ${s.id} → unknown dotpoint ${dp}`);
  for (const p of s.prereqs || []) {
    if (!skillById.has(p)) errors.push(`skill ${s.id} → unknown prereq ${p}`);
  }
  if (!s.dotPointIds || s.dotPointIds.length === 0) warnings.push(`skill ${s.id} has no dot point`);
}

// Stage monotonicity: a prereq must be same-or-earlier stage
for (const s of skills) {
  for (const p of s.prereqs || []) {
    const pre = skillById.get(p);
    if (pre && pre.stage > s.stage) {
      errors.push(`stage violation: ${s.id} (stage ${s.stage}) requires ${p} (stage ${pre.stage})`);
    }
  }
}

// Cycle detection (DFS over prereq edges)
const WHITE = 0, GREY = 1, BLACK = 2;
const colour = new Map(skills.map((s) => [s.id, WHITE]));
const stack = [];
function visit(id) {
  colour.set(id, GREY);
  stack.push(id);
  for (const p of skillById.get(id)?.prereqs || []) {
    if (!skillById.has(p)) continue;
    if (colour.get(p) === GREY) {
      const cycle = stack.slice(stack.indexOf(p)).concat(p).join(' → ');
      errors.push(`cycle: ${cycle}`);
    } else if (colour.get(p) === WHITE) {
      visit(p);
    }
  }
  stack.pop();
  colour.set(id, BLACK);
}
for (const s of skills) if (colour.get(s.id) === WHITE) visit(s.id);

// Orphan reporting
const usedDotpoints = new Set(skills.flatMap((s) => s.dotPointIds || []));
for (const d of dotpoints) if (!usedDotpoints.has(d.id)) warnings.push(`dotpoint ${d.id} has no skill`);

// Report
console.log(`Loaded: ${courses.length} courses, ${topics.length} topics, ${dotpoints.length} dot points, ${skills.length} skills.`);
for (const w of warnings) console.log(`  ⚠ ${w}`);
if (errors.length) {
  console.error(`\n✗ ${errors.length} error(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`\n✓ Taxonomy valid (${warnings.length} warning(s)).`);
