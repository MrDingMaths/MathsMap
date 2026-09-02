import { promises as fs } from 'node:fs';
import path from 'node:path';
import { allDiagrams, makeBankManifest, normaliseQuestion } from '../../src/lib/practice-question-model.js';

const BANK = path.resolve('booklets/question-bank');
const SOURCE_FILE = 'pilot.pdf';
const IMPORT_ID = 'pilot-v2';

const ROOT_PROMPTS = {
  'pq-pilot-p1-q1': 'f(x) = x + 2.',
  'pq-pilot-p1-q2': 'f(x) = 2x.',
  'pq-pilot-p1-q3': 'g(x) = 2-x. Show that g(g(x)) = x.',
  'pq-pilot-p1-q4': 'h(x) = 3x-5. Find an expression for h(h(x)).',
  'pq-pilot-p2-q5': 'f(x) = 3x+4 and g(x) = 3-2x.',
  'pq-pilot-p2-q6': 'f(x) = x+1 and g(x) = 2x-3.',
  'pq-pilot-p3-q7': 'Given f(x) = 2x+7 and g(x) = 5x-3.',
  'pq-pilot-p3-q8': 'f(x) = sqrt{x} and g(x) = x+4.',
  'pq-pilot-p3-q9': 'Given p(x) = x^2-4 and q(x) = 2x+3.',
  'pq-pilot-p3-q10': 'h(x) = 2/(x+3) and m(x) = 4x-1.',
  'pq-pilot-p4-q11': 'Find f(g(x)) and g(f(x)) for each of these function pairs.',
  'pq-pilot-p4-q12': 'f(x) = x/(x+1).',
  'pq-pilot-p4-q13': 'Given f(2) = 5, f(3) = 4, g(2) = 5, g(3) = 2, g(4) = 1.',
  'pq-pilot-p5-q14': 'HSC Sample Question Band 4. Which of these functions satisfies f(f(x)) = x?',
  'pq-pilot-p5-q15': 'HSC Sample Question Band 4. Which of these functions satisfies f(f(x)) = x?',
  'pq-pilot-p5-q16': 'Consider the graphs of f(x) and g(x) below.',
  'pq-pilot-p6-q17': 'Using the graphs below, evaluate f(g(1)) and g(f(2)).',
  'pq-pilot-p6-q18': 'Consider the graphs of p(x) and h(x) below. Evaluate:',
  'pq-pilot-p7-q19': '2022 HSC Advanced Band 5. The graphs of y=f(x) and y=g(x) are shown. Which graph best represents y=g(f(x))?',
  'pq-pilot-p7-q20': 'Consider once again the graph of f(x) and g(x) below.',
  'pq-pilot-p8-q1': 'For each function, find its inverse f^{-1}(x) then verify f(f^{-1}(x)) = x and f^{-1}(f(x)) = x.',
  'pq-pilot-p8-q2': 'f(x) = 3x+4 and g(x) = ax^2.',
  'pq-pilot-p8-q3': 'f(x) = ax+8 and g(x) = 2x-3.',
  'pq-pilot-p9-q4': 'f(x) = x^2-1 and g(x) = 4x+5.',
  'pq-pilot-p9-q5': 'f(x) = 2x+4 and g(x) = 3x-8.',
  'pq-pilot-p10-q6': 'Let f(x) be the function "increase x by 50%".',
  'pq-pilot-p10-q7': 'Show that (x^2+x)/(x^2+4x+3) can be written as x/(x+a) where a is a positive integer.',
  'pq-pilot-p11-q1': 'Sketch the derivative function for each curve.',
};

const PART_PROMPTS = {
  'pq-pilot-p1-q1': ['Find the values of f(f(0)).', 'Find f(f(3)).', 'Find f(f(-1)).', 'Find f(f(-8)).', 'Find an expression for f(f(x)).', 'Check your answers for a - d, how do they relate to your expression for f(f(x))?', 'Find a value of x where f(f(x)) = 0.'],
  'pq-pilot-p1-q2': ['Find the values of f(f(0)).', 'Find f(f(7)).', 'Find f(f(-3)).', 'Find f(f(-11)).', 'Find an expression for f(f(x)).', 'Check your answers for a - d, how do they relate to your expression for f(f(x))?', 'Find a value of x where f(f(x)) = 32.'],
  'pq-pilot-p2-q5': ['Find f(g(2)).', 'Find g(f(2)).', 'Show that f(g(x)) = -6x+13.', 'Show that g(f(x)) = -6x-5.'],
  'pq-pilot-p2-q6': ['Find f(g(7)).', 'Find g(f(7)).', 'Find f(f(7)).', 'Find g(g(7)).', 'Find expressions for f(g(x)).', 'Find expressions for g(f(x)).', 'Find expressions for f(f(x)).', 'Find expressions for g(g(x)).'],
  'pq-pilot-p3-q8': ['Find f(g(x)).', 'Find g(f(x)).', 'Find g(g(x)).', 'What composite function would produce sqrt{x+8}?'],
  'pq-pilot-p3-q10': ['Find h(m(x)).', 'Find m(h(x)).', 'Find h(h(x)).'],
  'pq-pilot-p4-q11': ['For f(x) = x-2, g(x) = 2x+5, find both composites.', 'For f(x) = 2x, g(x) = 3x, find both composites.', 'For f(x) = x^2, g(x) = x^3, find both composites.', 'For f(x) = 1/x, g(x) = sqrt{x}, find both composites.'],
  'pq-pilot-p4-q18': ['Evaluate h(p(2)).', 'Evaluate p(h(2)).', 'Evaluate h(h(1)).', 'Evaluate p(p(-3)).'],
  'pq-pilot-p5-q16': ['Evaluate g(3).', 'Hence f(g(3)).', 'Evaluate g(f(0)).', 'Evaluate f(f(1)).', 'Evaluate g(g(4)).', 'Evaluate f(g(3)).', 'Evaluate g(f(3)).', 'Evaluate f(g(5)).', 'Evaluate g(f(5)).'],
  'pq-pilot-p6-q18': ['Evaluate h(p(2)).', 'Evaluate p(h(2)).', 'Evaluate h(h(1)).', 'Evaluate p(p(-3)).'],
  'pq-pilot-p8-q1': ['For f(x) = x^3+1, find f^{-1}(x) then verify both compositions.', 'For f(x) = (1-x)/(3+x), find f^{-1}(x) then verify both compositions.', 'For f(x) = sqrt[3]{x-7}, find f^{-1}(x) then verify both compositions.'],
  'pq-pilot-p8-q2': ['Work out an expression for f^{-1}(x).', 'Given that fg(3) = 85, find the value of a.'],
  'pq-pilot-p8-q3': ['Work out an expression for f^{-1}(x).', 'Given that fg(2) = 13, find the value of a.'],
  'pq-pilot-p9-q4': ['Work out an expression for f^{-1}(x) and g^{-1}(x).', 'Given that fg(x) = 3gf(x), show that 4x^2+40x+21 = 0.'],
  'pq-pilot-p9-q5': ['Find f^{-1}(x) and g^{-1}(x).', 'Find an expression for fg(x).', 'Find an expression for the inverse of fg(x).', 'Is (fg)^{-1}(x) the same as f^{-1}g^{-1}(x)?', 'Is (fg)^{-1}(x) the same as g^{-1}f^{-1}(x)?'],
  'pq-pilot-p10-q7': ['Show that (x^2+x)/(x^2+4x+3) can be written as x/(x+a) where a is a positive integer.', 'Hence, given f(x) = (x^2+x)/(x^2+4x+3), find an expression for f^{-1}(x).'],
};

const SPECIAL = {
  'pq-pilot-p3-q7': [
    ['a', 'Find f(g(x)).', '$10x+1$', 'f(g(x)) = 2(5x-3)+7 = 10x+1.'],
    ['b', 'Find g(f(x)).', '$10x+32$', 'g(f(x)) = 5(2x+7)-3 = 10x+32.'],
    ['c', 'Find f(f(x)).', '$4x+21$', 'f(f(x)) = 2(2x+7)+7 = 4x+21.'],
    ['d', 'Find g(g(x)).', '$25x-18$', 'g(g(x)) = 5(5x-3)-3 = 25x-18.'],
  ],
  'pq-pilot-p3-q9': [
    ['a', 'Simplify p(q(x)).', '$4x^2+12x+5$', 'p(q(x)) = (2x+3)^2-4 = 4x^2+12x+5.'],
    ['b', 'Simplify q(p(x)).', '$2x^2-5$', 'q(p(x)) = 2(x^2-4)+3 = 2x^2-5.'],
    ['c', 'Simplify p(p(x)).', '$x^4-8x^2+12$', 'p(p(x)) = (x^2-4)^2-4 = x^4-8x^2+12.'],
    ['d', 'Simplify q(q(x)).', '$4x+9$', 'q(q(x)) = 2(2x+3)+3 = 4x+9.'],
  ],
  'pq-pilot-p4-q12': [['a', 'Find f(f(x)).', '$x/(2x+1)$', 'f(f(x)) = (x/(x+1))/(x/(x+1)+1) = x/(2x+1).']],
  'pq-pilot-p6-q17': [
    ['a', 'Evaluate f(g(1)).', '6', 'g(1) = 3, then f(3) = 6.'],
    ['b', 'Evaluate g(f(2)).', '3', 'f(2) = 5, then g(5) = 3.'],
  ],
};

function text(value) { return value == null ? '' : String(value); }

function convertMathBody(body) {
  let result = body;
  result = result.replace(/\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g, '\\frac{$1}{$2}');
  result = result.replace(/\(([^()]+)\)\s*\/\s*(\\sqrt\{[^{}]+\}|[A-Za-z0-9]+)/g, '\\frac{$1}{$2}');
  result = result.replace(/([A-Za-z0-9]+)\s*\/\s*\(([^()]+)\)/g, '\\frac{$1}{$2}');
  result = result.replace(/([A-Za-z0-9]+)\s*\/\s*(\\sqrt\{[^{}]+\}|[A-Za-z0-9]+)/g, '\\frac{$1}{$2}');
  return result;
}

function formatMath(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/(?<!\\)\$([\s\S]*?)(?<!\\)\$/g, (_, body) => '$' + convertMathBody(body) + '$');
}

function cropFor(diagram, source) {
  const existing = diagram?.sourceCrop && typeof diagram.sourceCrop === 'object' ? diagram.sourceCrop : {};
  return {
    sourceRef: existing.sourceRef ?? diagram?.sourceRef ?? source.sourceRef,
    assetId: existing.assetId ?? (diagram?.src ? String(diagram.src).split('/').pop() : diagram?.id ?? null),
    x: Number.isFinite(Number(existing.x)) ? Number(existing.x) : 0,
    y: Number.isFinite(Number(existing.y)) ? Number(existing.y) : 0,
    width: Number.isFinite(Number(existing.width)) ? Number(existing.width) : 1,
    height: Number.isFinite(Number(existing.height)) ? Number(existing.height) : 1,
    unit: existing.unit ?? 'normalized',
    pageNumber: Number(source.pageNumber),
  };
}

function diagrams(raw, role, source, overlayOf = null) {
  const list = Array.isArray(raw) ? raw : [];
  return list.map((diagram, index) => ({
    ...diagram,
    id: String(diagram.id ?? 'diagram-' + role + '-' + (index + 1)),
    role: overlayOf ? 'solution-overlay' : (diagram.role ?? role),
    sourceRef: diagram.sourceRef ?? source.sourceRef,
    sourceCrop: cropFor(diagram, source),
    reviewStatus: 'approved',
    overlayOf: overlayOf ?? diagram.overlayOf ?? null,
    transparent: overlayOf ? true : diagram.transparent === true,
  }));
}

function answerFrom(old, source) {
  return {
    short: old.shortAnswer == null || text(old.shortAnswer).trim() === '' ? null : formatMath(text(old.shortAnswer)),
    worked: formatMath(text(old.workedSolution)),
    solutionDiagrams: diagrams(old.solutionDiagrams, 'solution', source),
  };
}

function leafFrom(old, prompt, label, source, { questionDiagrams = null, answer = null } = {}) {
  const raw = {
    id: old?.id ?? 'part-' + label,
    type: 'part',
    label,
    prompt: formatMath(prompt ?? old?.prompt ?? ''),
    questionDiagrams: diagrams(questionDiagrams ?? old?.questionDiagrams, 'question', source),
    answer: answer ?? answerFrom(old ?? {}, source),
    answerSpaceMm: old?.defaultAnswerSpaceMm ?? null,
    sourceRef: old?.sourceRef ?? source.sourceRef,
  };
  return raw;
}

function sourceOf(question) {
  return {
    type: 'import',
    file: SOURCE_FILE,
    importId: IMPORT_ID,
    pageNumber: Number(question.source.pageNumber),
    questionNumber: Number(question.source.questionNumber),
    sourceRef: SOURCE_FILE + '#page=' + question.source.pageNumber,
  };
}

function parentFrom(question, prompt, children, source, { questionDiagrams = null, layout = 'list', columns = null } = {}) {
  return {
    id: question.content.id,
    type: 'question',
    prompt: formatMath(prompt),
    layout,
    columns,
    questionDiagrams: diagrams(questionDiagrams ?? question.content.questionDiagrams, 'question', source),
    children,
    sourceRef: source.sourceRef,
  };
}

function oldParts(question) {
  return Array.isArray(question.content.parts) ? question.content.parts : [];
}

function directChildren(question, source, prompts) {
  return oldParts(question).map((old, index) => leafFrom(old, prompts?.[index] ?? old.prompt, old.label ?? String.fromCharCode(97 + index), source));
}

function makeSpecial(question, source, id) {
  return SPECIAL[id].map(([label, prompt, short, worked], index) => leafFrom({}, prompt, label, source, { answer: { short: formatMath(short), worked: formatMath(worked), solutionDiagrams: [] } }));
}

function restructure(question, source) {
  const id = question.id;
  const prompt = ROOT_PROMPTS[id] ?? question.content.prompt;
  if (id === 'pq-pilot-p1-q1' || id === 'pq-pilot-p1-q2') {
    const parts = oldParts(question);
    const values = {
      id: 'group-values-' + id,
      type: 'group',
      label: null,
      prompt: 'Find the values of:',
      layout: 'grid',
      columns: 4,
      questionDiagrams: [],
      children: parts.slice(0, 4).map((old, index) => leafFrom(old, PART_PROMPTS[id][index], String.fromCharCode(97 + index), source)),
      sourceRef: source.sourceRef,
    };
    const rest = parts.slice(4).map((old, index) => leafFrom(old, PART_PROMPTS[id][index + 4], String.fromCharCode(101 + index), source));
    return parentFrom(question, prompt, [values, ...rest], source);
  }
  if (SPECIAL[id]) return parentFrom(question, prompt, makeSpecial(question, source, id), source);
  if (id === 'pq-pilot-p10-q6') {
    const parts = oldParts(question);
    const find = (label) => parts.find((part) => part.label === label);
    const a = find('a');
    const bi = find('b(i)');
    const bii = find('b(ii)');
    const c = find('c');
    const d = find('d');
    const b = {
      id: 'group-b-' + id,
      type: 'group',
      label: 'b',
      prompt: 'A student in Year 8 says: "Let g(x) be decrease x by 50%."',
      layout: 'list',
      columns: null,
      questionDiagrams: [],
      children: [
        leafFrom(bi, 'Write the equation for g(x).', 'i', source),
        leafFrom(bii, 'Show that she is incorrect by finding g(f(x)).', 'ii', source),
      ],
      sourceRef: source.sourceRef,
    };
    return parentFrom(question, prompt, [
      leafFrom(a, 'Write the equation for f(x).', 'a', source),
      b,
      leafFrom(c, 'What is the inverse function f^{-1}(x)?', 'c', source),
      leafFrom(d, 'Therefore, to undo a 50% increase, what percentage do you need to decrease by?', 'd', source),
    ], source);
  }
  if (id === 'pq-pilot-p7-q20') {
    const parts = oldParts(question);
    const group = {
      id: 'group-b-' + id,
      type: 'group',
      label: 'b',
      prompt: '[2-cycle fixed points]',
      layout: 'list',
      columns: null,
      questionDiagrams: [],
      children: [
        leafFrom(parts[1], 'Evaluate ffff(x) for x = 0.', 'i', source),
        leafFrom(parts[2], 'Evaluate ffff(x) for x = 3.', 'ii', source),
        leafFrom(parts[3], 'Explain geometrically why the pair {0, 3} forms an alternating cycle under composition by f, and state other alternating cycles for f.', 'iii', source),
      ],
      sourceRef: source.sourceRef,
    };
    return parentFrom(question, prompt, [leafFrom(parts[0], 'Find all values of x in the domain [-4,5] that satisfy f(g(x)) = 3.', 'a', source), group], source);
  }
  if (id === 'pq-pilot-p11-q1') {
    const parts = oldParts(question);
    const children = parts.map((old, index) => {
      const sourceDiagrams = diagrams(old.questionDiagrams, 'question', source);
      const sourceDiagram = sourceDiagrams[0];
      const oldSolution = old.solutionDiagrams?.[0] ?? {};
      const overlay = {
        id: 'pilot-overlay-' + String.fromCharCode(97 + index),
        format: 'tikz',
        code: text(oldSolution.code).replace(/\\\\draw\[thick\]/g, '\\\\draw[red,thick]'),
        widthMm: 145,
        alt: 'Derivative sketch overlay',
        sourceRef: source.sourceRef,
        sourceCrop: sourceDiagram?.sourceCrop ?? cropFor(sourceDiagram, source),
        overlayOf: sourceDiagram?.id ?? null,
        transparent: true,
        axes: { xMin: -3, xMax: 3, yMin: -2, yMax: 3 },
        derived: true,
        reviewStatus: 'approved',
        role: 'solution-overlay',
      };
      const worked = 'The derivative is the gradient of the original curve. Read the tangent slope at each x, mark zero at stationary points, and sketch the resulting curve.';
      return leafFrom(old, 'Sketch the derivative of curve (' + String.fromCharCode(97 + index) + ').', String.fromCharCode(97 + index), source, {
        questionDiagrams: sourceDiagrams,
        answer: { short: null, worked, solutionDiagrams: sourceDiagram ? [overlay] : [] },
      });
    });
    return parentFrom(question, prompt, children, source, { layout: 'grid', columns: 3, questionDiagrams: [] });
  }
  const prompts = PART_PROMPTS[id];
  const children = directChildren(question, source, prompts);
  if (children.length) return parentFrom(question, prompt, children, source);
  return {
    id: question.content.id,
    type: 'question',
    prompt: formatMath(prompt + (prompt.includes('.') && question.content.prompt !== prompt ? '\n' + question.content.prompt : '')),
    questionDiagrams: diagrams(question.content.questionDiagrams, 'question', source),
    answer: answerFrom(question.content, source),
    sourceRef: source.sourceRef,
  };
}

const files = (await fs.readdir(BANK)).filter((name) => /^pq-pilot-.*\.json$/.test(name)).sort();
const records = [];
for (const name of files) {
  const current = JSON.parse(await fs.readFile(path.join(BANK, name), 'utf8'));
  const source = sourceOf(current);
  const raw = {
    ...current,
    format: 'mathsmap-practice-question-v2',
    version: 2,
    status: 'approved',
    source,
    review: { approvedBy: 'Pilot migration', approvedAt: new Date().toISOString(), flags: [], diagramApprovals: {}, history: [] },
    content: restructure(current, source),
  };
  const question = normaliseQuestion(raw);
  records.push(question);
  await fs.writeFile(path.join(BANK, name), JSON.stringify(question, null, 2) + '\n', 'utf8');
}
records.sort((a, b) => Number(a.source.pageNumber) - Number(b.source.pageNumber) || Number(a.source.questionNumber) - Number(b.source.questionNumber));
await fs.writeFile(path.join(BANK, 'manifest.json'), JSON.stringify(makeBankManifest(records), null, 2) + '\n', 'utf8');
console.log('Migrated ' + records.length + ' pilot questions to v2.');
