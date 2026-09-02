#!/usr/bin/env node
// Attach reviewed pilot artwork and apply the known transcription repairs.
// This produces a source-free v3 import result; source evidence remains top-level.
import fs from 'node:fs';
import path from 'node:path';

import { allNodes, normaliseQuestion } from '../../src/lib/practice-question-model.js';
import { repairDerivativeQuestion } from './pilot-derivative-assets.mjs';

const transcriptionPath = process.argv[2] ?? '.booklet-work/pilot-transcription.json';
const payload = JSON.parse(fs.readFileSync(transcriptionPath, 'utf8').replace(/^\uFEFF/, ''));
const byPilotId = (page, number) => (payload.questions ?? []).find((question) => question.id === 'pq-pilot-p' + page + '-q' + number);
const imageDiagram = (id, name, alt) => ({
  id,
  role: 'question',
  format: 'image',
  code: null,
  src: '/booklet-assets/pilot/' + name,
  widthMm: 95,
  alt,
  overlayOf: null,
  transparent: false,
  derived: false,
  reviewStatus: 'approved',
});
const setRootImages = (page, number, names, alt) => {
  const question = byPilotId(page, number);
  if (question) question.content.questionDiagrams = names.map((name, index) => imageDiagram('pilot-source-' + page + '-' + number + '-' + index, name, alt));
};
const leaf = (id, label, prompt, short, worked) => ({
  id,
  type: 'part',
  label,
  prompt,
  layout: 'list',
  columns: null,
  questionDiagrams: [],
  children: [],
  answer: { short, worked, solutionDiagrams: [] },
});
const group = (id, label, prompt, children) => ({
  id,
  type: 'group',
  label,
  prompt,
  layout: 'list',
  columns: null,
  questionDiagrams: [],
  children,
});
const findNode = (question, label) => allNodes(question?.content).find((node) => node.label === label);

setRootImages(5, 16, ['img-002.png'], 'Source graph pair for f and g');
setRootImages(6, 17, ['img-003.jpg'], 'Source graph pair for f and g');
setRootImages(6, 18, ['img-004.png'], 'Source graph pair for p and h');
setRootImages(7, 19, ['img-005.png', 'img-006.png', 'img-007.png'], 'Source graph and candidate options');
setRootImages(7, 20, ['img-008.png'], 'Source graph pair for f and g');

const q11 = byPilotId(4, 11);
if (q11) {
  q11.content.prompt = 'Find $f(g(x))$ and $g(f(x))$ for each of these function pairs.';
  q11.content.layout = 'grid';
  q11.content.columns = 2;
  const definitions = [
    ['$f(x)=x-2$, $g(x)=2x+5$', '$2x+3$', '$2x+1'],
    ['$f(x)=2x$, $g(x)=3x$', '$6x$', '$6x'],
    ['$f(x)=x^2$, $g(x)=x^3$', '$x^6$', '$x^6'],
    ['$f(x)=\\frac{1}{x}$, $g(x)=\\sqrt{x}$', '$\\frac{1}{\\sqrt{x}}$', '$\\frac{1}{\\sqrt{x}}'],
  ];
  q11.content.children = definitions.map(([definition, first, second], index) => {
    const label = String.fromCharCode(97 + index);
    return group('group-' + label, label, definition, [
      leaf('part-' + label + '-i', 'i', '$f(g(x))$', first, '$f(g(x))=' + first + '$.'),
      leaf('part-' + label + '-ii', 'ii', '$g(f(x))$', second, '$g(f(x))=' + second + '$.'),
    ]);
  });
}

const q12 = byPilotId(4, 12);
if (q12) {
  q12.content.prompt = '$f(x)=\\frac{x}{x+1}$, find $f(f(x))$.';
  q12.content.children = [];
  q12.content.questionDiagrams = [];
  q12.content.answer = {
    short: '$\\frac{x}{2x+1}$',
    worked: '$f(f(x))=\\frac{\\frac{x}{x+1}}{\\frac{x}{x+1}+1}=\\frac{x}{2x+1}$.',
    solutionDiagrams: [],
  };
}

const q14 = byPilotId(5, 14);
if (q14) {
  q14.title = 'HSC Sample Question Band 4';
  q14.content.prompt = 'Which of these functions satisfies $f(f(x))=x$?\nA. $f(x)=2-x$\nB. $f(x)=x^2$\nC. $f(x)=2\\sqrt{x}$\nD. $f(x)=x-2$';
  q14.content.children = [];
  q14.content.questionDiagrams = [];
  q14.content.answer = { short: 'A', worked: 'Only option A gives $f(f(x))=x$.', solutionDiagrams: [] };
}
const q15 = byPilotId(5, 15);
if (q15) {
  q15.title = 'HSC Sample Question Band 4';
  q15.content.prompt = 'Which of these functions satisfies $f(f(x))=x$?\nA. $f(x)=x+1$\nB. $f(x)=x-1$\nC. $f(x)=\\frac{x-1}{x+1}$\nD. $f(x)=\\frac{x+1}{x-1}$';
  q15.content.children = [];
  q15.content.questionDiagrams = [];
  q15.content.answer = { short: 'D', worked: 'Only option D gives $f(f(x))=x$.', solutionDiagrams: [] };
}

const q20 = byPilotId(7, 20);
if (q20) {
  q20.content.prompt = 'Consider once again the graph of $f(x)$ and $g(x)$ below.';
  const a = findNode(q20, 'a');
  const oldB = findNode(q20, 'b(i)') ?? findNode(q20, 'b');
  const i = findNode(q20, 'i') ?? findNode(q20, 'b(i)');
  const ii = findNode(q20, 'ii') ?? findNode(q20, 'b(ii)');
  const iii = findNode(q20, 'iii') ?? findNode(q20, 'b(iii)');
  const bChildren = [
    i ?? leaf('part-b-i', 'i', 'Evaluate $f(f(f(f(x))))$ for $x=0$.', '$0$', 'The cycle is $0\\to3\\to0\\to3\\to0$, so $f(f(f(f(0))))=0$.'),
    ii ?? leaf('part-b-ii', 'ii', 'Evaluate $f(f(f(f(x))))$ for $x=3$.', '$3$', 'The cycle is $3\\to0\\to3\\to0\\to3$, so $f(f(f(f(3))))=3$.'),
    iii ?? leaf('part-b-iii', 'iii', 'Explain geometrically why the pair $\\{0,3\\}$ forms an alternating cycle under composition by $f$, and state other alternating cycles for $f$.', 'The pairs are reflections in $y=x$.', 'An alternating cycle has $f(a)=b$ and $f(b)=a$. The other alternating pairs shown are $\\{1,2\\}$ and $\\{0.5,2.5\\}$.'),
  ];
  if (a) a.prompt = 'Find all values of $x$ in the domain $[-4,5]$ that satisfy $f(g(x))=3$.';
  q20.content.children = [
    a ?? leaf('part-a', 'a', 'Find all values of $x$ in the domain $[-4,5]$ that satisfy $f(g(x))=3$.', '$x=-1,5$', '$f(g(x))=3$ requires $g(x)=0$. Reading the graph gives $x=-1$ and $x=5$.'),
    group('group-b', 'b', '2-cycle fixed points.', bChildren),
  ];
  q20.content.children[0].answer = { short: '$x=-1,5$', worked: '$f(g(x))=3$ requires $g(x)=0$. Reading the graph gives $x=-1$ and $x=5$.', solutionDiagrams: [] };
}

const q6 = byPilotId(10, 6);
if (q6) {
  const a = findNode(q6, 'a');
  if (a) a.prompt = 'Write the equation for $f(x)$.';
}
const q7 = byPilotId(10, 7);
if (q7) q7.content.prompt = '';

const derivative = byPilotId(11, 1);
if (derivative) await repairDerivativeQuestion(derivative);

payload.format = 'mathsmap-practice-import-v3';
payload.version = 3;
payload.jobId = payload.jobId ?? payload.source?.importId ?? 'pilot-v3';
delete payload.source;
payload.evidence = {
  ...(payload.evidence ?? {}),
  sourceFiles: payload.evidence?.sourceFiles ?? [{ name: 'pilot.pdf', originalName: 'pilot.pdf', mimeType: 'application/pdf' }],
  pages: payload.evidence?.pages ?? [],
  questionMap: payload.evidence?.questionMap ?? {},
};
payload.questions = (payload.questions ?? []).map((question) => normaliseQuestion(question));
payload.flags = [...new Set([...(payload.flags ?? []), 'Pilot source artwork attached and known transcription defects repaired in v3.'])];
fs.mkdirSync(path.dirname(path.resolve(transcriptionPath)), { recursive: true });
fs.writeFileSync(transcriptionPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({ outPath: path.resolve(transcriptionPath), format: payload.format, version: payload.version, questions: payload.questions.length, evidence: Object.keys(payload.evidence) }, null, 2));
