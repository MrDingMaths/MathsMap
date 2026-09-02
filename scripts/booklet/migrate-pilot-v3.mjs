#!/usr/bin/env node
// Reversible pilot migration: v2 files are moved to a timestamped backup,
// then rewritten as source-free v3 records with unique ids and score bands.
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { allNodes, deepCopy, makeBankManifest, normaliseQuestion } from '../../src/lib/practice-question-model.js';

const bankDir = path.resolve('booklets/question-bank');
const backupDir = path.resolve('.booklet-work/v3-migration-backup-' + new Date().toISOString().replace(/[:.]/g, '-'));
const files = (await fs.readdir(bankDir)).filter((name) => /^pq-.*\.json$/.test(name)).sort();
if (!files.length) throw new Error('No v2 pilot records found in ' + bankDir);

const scoreByKey = {
  'p1-q1': 5, 'p1-q2': 8, 'p1-q3': 12, 'p1-q4': 15,
  'p2-q5': 18, 'p2-q6': 23,
  'p3-q7': 30, 'p3-q8': 34, 'p3-q9': 47, 'p3-q10': 42,
  'p4-q11': 40, 'p4-q12': 52, 'p4-q13': 55,
  'p5-q14': 58, 'p5-q15': 60, 'p5-q16': 66,
  'p6-q17': 63, 'p6-q18': 68,
  'p7-q19': 86, 'p7-q20': 92,
  'p8-q1': 44, 'p8-q2': 48, 'p8-q3': 51,
  'p9-q4': 62, 'p9-q5': 70,
  'p10-q6': 28, 'p10-q7': 72,
  'p11-q1': 78,
};

const taxonomyByKey = {
  'p10-q6': { primarySkillId: 'percentage-multiplier', secondarySkillIds: ['percentage-increase-decrease'] },
  'p10-q7': { primarySkillId: 'find-inverse-function', secondarySkillIds: ['verify-inverse-composition'] },
  'p11-q1': { primarySkillId: 'graph-derivative-function', secondarySkillIds: ['define-derivative-tangent'] },
  'p4-q11': { primarySkillId: 'composite-functions', secondarySkillIds: ['composite-function-equations'] },
  'p4-q12': { primarySkillId: 'composite-function-equations', secondarySkillIds: ['composite-functions'] },
  'p5-q14': { primarySkillId: 'composite-function-equations', secondarySkillIds: ['composite-functions'] },
  'p5-q15': { primarySkillId: 'composite-function-equations', secondarySkillIds: ['composite-functions'] },
  'p7-q20': { primarySkillId: 'composite-function-equations', secondarySkillIds: ['composite-functions'] },
};

function leaf(id, label, prompt, short, worked) {
  return { id, type: 'part', label, prompt, layout: 'list', columns: null, questionDiagrams: [], children: [], answer: { short, worked, solutionDiagrams: [] } };
}
function group(id, label, prompt, children) {
  return { id, type: 'group', label, prompt, layout: 'list', columns: null, questionDiagrams: [], children };
}
function nodeByLabel(root, label) {
  return allNodes(root).find((node) => node.label === label);
}
function setWidth(node) {
  for (const item of allNodes(node.content)) {
    for (const diagram of [...(item.questionDiagrams ?? []), ...(item.answer?.solutionDiagrams ?? [])]) {
      diagram.widthMm = Math.min(95, Math.max(25, Number(diagram.widthMm) || 95));
    }
  }
}
function repair(raw, key) {
  const next = deepCopy(raw);
  next.format = 'mathsmap-practice-question-v3';
  next.version = 3;
  next.id = 'q-' + randomUUID();
  next.status = 'approved';
  next.source = undefined;
  const score = scoreByKey[key] ?? 50;
  const taxonomy = taxonomyByKey[key] ?? { primarySkillId: next.classification?.primarySkillId ?? '', secondarySkillIds: next.classification?.secondarySkillIds ?? [] };
  next.classification = { ...next.classification, ...taxonomy, reasoningScore: score, difficultyReason: 'Pilot calibration using the MathsDatabase completion estimate: reasoning score = 100 minus estimated completion percent; band is derived from the score.' };
  if (!next.review) next.review = {};
  next.review.flags = [];
  if (key === 'p10-q6') {
    const a = nodeByLabel(next.content, 'a');
    if (a) a.prompt = 'Write the equation for $f(x)$.';
  }
  if (key === 'p10-q7') {
    // The original question is carried by part (a); the shared scenario slot is intentionally blank.
    next.content.prompt = '';
  }
  if (key === 'p4-q11') {
    next.content.prompt = 'Find $f(g(x))$ and $g(f(x))$ for each of these function pairs.';
    next.content.layout = 'grid';
    next.content.columns = 2;
    const old = next.content.children ?? [];
    const data = old.map((item) => ({ label: item.label, prompt: item.prompt, short: item.answer?.short, worked: item.answer?.worked }));
    next.content.children = data.map((item, index) => {
      const label = item.label ?? String.fromCharCode(97 + index);
      const parts = [
        leaf('part-' + label + '-i', 'i', '$f(g(x))$', null, item.worked ?? 'Substitute $g(x)$ into $f(x)$.'),
        leaf('part-' + label + '-ii', 'ii', '$g(f(x))$', null, item.worked ?? 'Substitute $f(x)$ into $g(x)$.'),
      ];
      const answers = String(item.short ?? '').split(/\s+and\s+/i);
      parts[0].answer.short = answers[0] ?? null;
      parts[1].answer.short = answers[1] ?? answers[0] ?? null;
      const definitions = [
        '$f(x)=x-2$, $g(x)=2x+5$',
        '$f(x)=2x$, $g(x)=3x$',
        '$f(x)=x^2$, $g(x)=x^3$',
        '$f(x)=\\frac{1}{x}$, $g(x)=\\sqrt{x}$',
      ][index] ?? item.prompt;
      if (index === 0) {
        parts[0].answer = { short: '$2x+3$', worked: '$f(g(x))=f(2x+5)=2x+3$.', solutionDiagrams: [] };
        parts[1].answer = { short: '$2x+1$', worked: '$g(f(x))=g(x-2)=2x+1$.', solutionDiagrams: [] };
      } else if (index === 1) {
        parts[0].answer = { short: '$6x$', worked: '$f(g(x))=2(3x)=6x$.', solutionDiagrams: [] };
        parts[1].answer = { short: '$6x$', worked: '$g(f(x))=3(2x)=6x$.', solutionDiagrams: [] };
      } else if (index === 2) {
        parts[0].answer = { short: '$x^6$', worked: '$f(g(x))=(x^3)^2=x^6$.', solutionDiagrams: [] };
        parts[1].answer = { short: '$x^6$', worked: '$g(f(x))=(x^2)^3=x^6$.', solutionDiagrams: [] };
      } else {
        parts[0].answer = { short: '$\\frac{1}{\\sqrt{x}}$', worked: '$f(g(x))=\\frac{1}{\\sqrt{x}}$.', solutionDiagrams: [] };
        parts[1].answer = { short: '$\\frac{1}{\\sqrt{x}}$', worked: '$g(f(x))=\\sqrt{\\frac{1}{x}}=\\frac{1}{\\sqrt{x}}$ for $x>0$.', solutionDiagrams: [] };
      }
      return group('group-' + label, label, definitions, parts);
    });
  }
  if (key === 'p4-q12') {
    next.content.children = [];
    next.content.prompt = '$f(x)=\\frac{x}{x+1}$, find $f(f(x))$.';
    next.content.answer = { short: '$\\frac{x}{2x+1}$', worked: '$f(f(x))=\\frac{\\frac{x}{x+1}}{\\frac{x}{x+1}+1}=\\frac{x}{2x+1}$.', solutionDiagrams: [] };
  }
  if (key === 'p5-q14' || key === 'p5-q15') {
    const optionSet = key === 'p5-q14'
      ? ['A. $f(x)=2-x$', 'B. $f(x)=x^2$', 'C. $f(x)=2\\sqrt{x}$', 'D. $f(x)=x-2$']
      : ['A. $f(x)=x+1$', 'B. $f(x)=x-1$', 'C. $f(x)=\\frac{x-1}{x+1}$', 'D. $f(x)=\\frac{x+1}{x-1}$'];
    next.title = 'HSC Sample Question Band 4';
    next.content.prompt = 'Which of these functions satisfies $f(f(x))=x$?\n' + optionSet.join('\n');
    next.content.children = [];
    next.content.questionDiagrams = [];
    next.content.answer = { short: key === 'p5-q14' ? 'A' : 'D', worked: key === 'p5-q14' ? 'Only option A gives $f(f(x))=x$.' : 'Only option D gives $f(f(x))=x$.', solutionDiagrams: [] };
  }
  if (key === 'p7-q20') {
    const a = nodeByLabel(next.content, 'a');
    const b = nodeByLabel(next.content, 'b');
    if (a) {
      a.prompt = 'Find all values of $x$ in the domain $[-4,5]$ that satisfy $f(g(x))=3$.';
      a.answer = { ...a.answer, short: '$x=-1,5$', worked: '$f(g(x))=3$ requires $g(x)=0$. Reading the graph gives $x=-1$ and $x=5$.', solutionDiagrams: [] };
    }
    if (b) {
      b.prompt = '2-cycle fixed points.';
      const i = nodeByLabel(b, 'i');
      const ii = nodeByLabel(b, 'ii');
      const iii = nodeByLabel(b, 'iii');
      if (i) { i.prompt = 'Evaluate $f(f(f(f(x))))$ for $x=0$.'; i.answer = { ...i.answer, short: '$0$', worked: 'The cycle is $0\\to3\\to0\\to3\\to0$, so $f(f(f(f(0))))=0$.', solutionDiagrams: [] }; }
      if (ii) { ii.prompt = 'Evaluate $f(f(f(f(x))))$ for $x=3$.'; ii.answer = { ...ii.answer, short: '$3$', worked: 'The cycle is $3\\to0\\to3\\to0\\to3$, so $f(f(f(f(3))))=3$.', solutionDiagrams: [] }; }
      if (iii) { iii.prompt = 'Explain geometrically why the pair $\\{0,3\\}$ forms an alternating cycle under composition by $f$, and state other alternating cycles for $f$.'; iii.answer = { ...iii.answer, short: 'The pairs are reflections in $y=x$.', worked: 'An alternating cycle has $f(a)=b$ and $f(b)=a$. The graph is symmetric in the sense that these pairs are reflections across $y=x$; the other alternating pairs shown are $\\{1,2\\}$ and $\\{0.5,2.5\\}$.', solutionDiagrams: [] }; }
    }
  }
  if (key === 'p11-q1') {
    next.content.prompt = 'Sketch the derivative function for each curve.';
    for (const node of allNodes(next.content).filter((item) => !item.children?.length)) {
      node.prompt = '';
      node.answer = { ...node.answer, short: null, worked: 'The derivative sketch is shown in the solution overlay.' };
    }
  }
  setWidth(next);
  return normaliseQuestion(next);
}

const records = [];
const evidenceMap = {};
const idMap = {};
for (const filename of files) {
  const raw = JSON.parse(await fs.readFile(path.join(bankDir, filename), 'utf8'));
  const key = filename.match(/pq-pilot-(p\d+)-(q\d+)\.json$/)?.slice(1).join('-') ?? filename.replace(/^pq-pilot-/, '').replace(/\.json$/, '');
  const oldId = raw.id;
  const next = repair(raw, key);
  records.push(next);
  idMap[oldId] = next.id;
  evidenceMap[next.id] = {
    sourceFile: raw.source?.file ?? 'pilot.pdf',
    importId: raw.source?.importId ?? 'pilot-v2',
    pageNumber: raw.source?.pageNumber ?? null,
    questionNumber: raw.source?.questionNumber ?? null,
    sourceRef: raw.source?.sourceRef ?? null,
  };
}
await fs.mkdir(backupDir, { recursive: true });
for (const filename of files) await fs.rename(path.join(bankDir, filename), path.join(backupDir, filename));
for (const record of records) await fs.writeFile(path.join(bankDir, record.id + '.json'), JSON.stringify(record, null, 2) + '\n', 'utf8');
const manifest = makeBankManifest(records);
await fs.writeFile(path.join(bankDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');

const jobId = 'pilot-v3';
const jobRoot = path.resolve('.booklet-work/practice-imports', jobId);
const pages = Array.from({ length: 12 }, (_, index) => ({ id: 'page-' + (index + 1), pageNumber: index + 1, sourceName: 'pilot.pdf#page=' + (index + 1), imageUrl: null, text: '', selected: true }));
const evidence = { sourceFiles: [{ name: 'pilot.pdf', originalName: 'pilot.pdf', mimeType: 'application/pdf', path: 'booklets/pilot.pdf' }], pages, questionMap: evidenceMap };
const result = { format: 'mathsmap-practice-import-v3', version: 3, status: 'migrated', jobId, evidence, questions: records, flags: ['Pilot records migrated from v2; source evidence remains in this import job.'] };
const job = { format: 'mathsmap-practice-import-job-v3', version: 3, id: jobId, status: 'migrated', createdAt: new Date().toISOString(), sourceFiles: evidence.sourceFiles, pages, evidence, prompt: 'Pilot migration record. New imports use the versioned MathsDatabase-adapted prompt pipeline.', result };
await fs.mkdir(jobRoot, { recursive: true });
await fs.writeFile(path.join(jobRoot, 'job.json'), JSON.stringify(job, null, 2) + '\n', 'utf8');
await fs.writeFile(path.resolve('.booklet-work/v3-migration-report.json'), JSON.stringify({ migratedAt: new Date().toISOString(), backupDir, records: records.length, idMap, questionMap: evidenceMap }, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({ records: records.length, backupDir, manifest: manifest.format, ids: records.map((record) => record.id) }, null, 2));
