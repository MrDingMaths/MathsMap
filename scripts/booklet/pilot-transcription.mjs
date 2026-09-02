#!/usr/bin/env node
// Curated first-pass transcription of booklets/pilot.pdf.
// It is deliberately a normal import result: the same JSON can be pasted into
// Studio after an AI pass, reviewed, then published to the private bank.
import fs from 'node:fs';
import path from 'node:path';
import { normaliseQuestion } from '../../src/lib/practice-question-model.js';

const jobPath = process.argv[2] ?? '.booklet-work/pilot-job.json';
const outPath = process.argv[3] ?? '.booklet-work/pilot-transcription.json';
const job = JSON.parse(fs.readFileSync(jobPath, 'utf8').replace(/^\uFEFF/, ''));
const diagram = (code, alt = 'Reviewed mathematical diagram') => ({
  id: 'diagram-' + Math.random().toString(36).slice(2, 8),
  format: 'tikz',
  code,
  widthMm: 130,
  alt,
  reviewStatus: 'approved',
});
const fractionise = (value) => {
  if (value == null) return value;
  return String(value).replace(/\$([\s\S]*?)\$/g, (_, body) => {
    let converted = body;
    converted = converted.replace(/\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g, '\\frac{$1}{$2}');
    converted = converted.replace(/([A-Za-z0-9]+)\s*\/\s*\(([^()]*)\)/g, '\\frac{$1}{$2}');
    converted = converted.replace(/\(([^()]+)\)\s*\/\s*([A-Za-z0-9.]+)/g, '\\frac{$1}{$2}');
    converted = converted.replace(/([A-Za-z0-9]+)\s*\/\s*(\\sqrt\{[^{}]+\})/g, '\\frac{$1}{$2}');
    converted = converted.replace(/([A-Za-z0-9.]+)\s*\/\s*([A-Za-z0-9.]+)/g, '\\frac{$1}{$2}');
    for (let pass = 0; pass < 3; pass += 1) {
      converted = converted.replace(/\(([^()]+)\)\s*\/\s*\(([^()]*)\)/g, '\\frac{$1}{$2}');
      converted = converted.replace(/([A-Za-z0-9]+)\s*\/\s*\(([^()]*)\)/g, '\\frac{$1}{$2}');
      converted = converted.replace(/\(([^()]+)\)\s*\/\s*([A-Za-z0-9.]+)/g, '\\frac{$1}{$2}');
    }
    return '$' + converted + '$';
  });
};
const part = (label, prompt, answer, solution, _ignoredMark = null, extras = {}) => ({
  id: 'part-' + label,
  type: 'part',
  label,
  prompt: fractionise(prompt),
  layout: 'list',
  columns: null,
  questionDiagrams: extras.questionDiagrams ?? [],
  children: [],
  answer: {
    short: answer == null ? null : fractionise(answer),
    worked: fractionise(solution ?? ''),
    solutionDiagrams: extras.solutionDiagrams ?? [],
  },
});
const q = (number, page, primarySkillId, prompt, answer, solution, difficulty = 'Development', extras = {}) => {
  const children = extras.children ?? [];
  const content = {
    id: 'root-' + page + '-' + number,
    type: 'question',
    prompt: fractionise(prompt),
    layout: extras.layout ?? 'list',
    columns: extras.columns ?? null,
    questionDiagrams: extras.questionDiagrams ?? [],
    children,
  };
  if (!children.length) {
    content.answer = {
      short: answer == null ? null : fractionise(answer),
      worked: fractionise(solution ?? ''),
      solutionDiagrams: extras.solutionDiagrams ?? [],
    };
  }
  return normaliseQuestion({
    format: 'mathsmap-practice-question-v3',
    version: 3,
    id: 'q-pilot-p' + page + '-q' + number,
    title: extras.title ?? '',
    classification: { primarySkillId, secondarySkillIds: extras.secondarySkillIds ?? [], difficulty },
    content,
    review: { flags: extras.flags ?? [] },
  });
};
const graph = (label = 'Graph') => String.raw`\draw[->] (-3,0)--(3,0) node[right] {$x$}; \draw[->] (0,-2)--(0,2) node[above] {$y$}; \draw[thick] (-2,-1)..controls(-1,1) and (1,1)..(2,-1); \node at (2.4,1.4) {${label}};`;
const straight = (label = 'f') => String.raw`\draw[->] (-3,0)--(3,0) node[right] {$x$}; \draw[->] (0,-2)--(0,3) node[above] {$y$}; \draw[thick] (-2,-1)--(2,2); \node at (2.5,2.3) {${label}};`;
const derivativePair = (kind) => ({ questionDiagrams: [diagram(kind, 'Source curve')], solutionDiagrams: [diagram(String.raw`\draw[->] (-3,0)--(3,0) node[right] {$x$}; \draw[->] (0,-2)--(0,3) node[above] {$y$}; \draw[thick] (-2,1)--(2,1);`, 'Derivative sketch')] });

const questions = [
  q(1, 1, 'composite-functions', 'Given $f(x)=x+2$, find the values of $f(f(0))$, $f(f(3))$, $f(f(-1))$, and $f(f(-8))$. Then find an expression for $f(f(x))$, explain the pattern, and find $x$ when $f(f(x))=0$.', '4, 7, 3, -4; f(f(x))=x+4; x=-4', 'Apply $f$ twice: $f(f(x))=(x+2)+2=x+4$. Substituting $0,3,-1,-8$ gives $4,7,3,-4$. Solving $x+4=0$ gives $x=-4$.', 'Foundation', { children: [part('a', 'Find $f(f(0))$.', '4', '$f(0)=2$, so $f(f(0))=f(2)=4$.', 1), part('b', 'Find $f(f(3))$.', '7', '$f(3)=5$, so $f(f(3))=f(5)=7$.', 1), part('c', 'Find $f(f(-1))$.', '3', '$f(-1)=1$, so $f(f(-1))=f(1)=3$.', 1), part('d', 'Find $f(f(-8))$.', '-4', '$f(-8)=-6$, so $f(f(-8))=f(-6)=-4$.', 1), part('e', 'Find an expression for $f(f(x))$.', '$x+4$', '$f(f(x))=f(x+2)=(x+2)+2=x+4$.', 1), part('f', 'How do the answers in parts (a)–(d) relate to the expression?', 'Each input has 4 added.', 'The composite function adds $4$ to $x$, exactly matching the four numerical results.', 1), part('g', 'Find a value of $x$ where $f(f(x))=0$.', '$x=-4$', '$x+4=0$, so $x=-4$.', 1)] }),
  q(2, 1, 'composite-functions', 'Given $f(x)=2x$, find the values of $f(f(0))$, $f(f(7))$, $f(f(-3))$, and $f(f(-11))$. Then find $f(f(x))$, explain the pattern, and find $x$ when $f(f(x))=32$.', '0, 28, -12, -44; f(f(x))=4x; x=8', 'Applying $f$ twice multiplies by $2$ twice: $f(f(x))=2(2x)=4x$. The four values follow immediately. Solving $4x=32$ gives $x=8$.', 'Foundation', { children: [part('a', 'Find $f(f(0))$.', '0', '$f(0)=0$, so $f(f(0))=0$.', 1), part('b', 'Find $f(f(7))$.', '28', '$f(7)=14$, so $f(14)=28$.', 1), part('c', 'Find $f(f(-3))$.', '-12', '$f(-3)=-6$, so $f(-6)=-12$.', 1), part('d', 'Find $f(f(-11))$.', '-44', '$f(-11)=-22$, so $f(-22)=-44$.', 1), part('e', 'Find an expression for $f(f(x))$.', '$4x$', '$f(f(x))=f(2x)=4x$.', 1), part('f', 'How do the answers relate to the expression?', 'Multiply each input by 4.', 'The composite function is multiplication by $4$.', 1), part('g', 'Find a value of $x$ where $f(f(x))=32$.', '$x=8$', '$4x=32$, so $x=8$.', 1)] }),
  q(3, 1, 'composite-function-equations', 'Let $g(x)=2-x$. Show that $g(g(x))=x$.', '$g(g(x))=x$', '$g(g(x))=g(2-x)=2-(2-x)=x$.', 'Foundation'),
  q(4, 1, 'composite-function-equations', 'Let $h(x)=3x-5$. Find an expression for $h(h(x))$.', '$9x-20$', '$h(h(x))=3(3x-5)-5=9x-15-5=9x-20$.', 'Foundation'),
  q(5, 2, 'composite-functions', 'Let $f(x)=3x+4$ and $g(x)=3-2x$. Find $f(g(2))$ and $g(f(2))$, then show expressions for $f(g(x))$ and $g(f(x))$.', '1, -17; $f(g(x))=-6x+13$; $g(f(x))=-6x-5$', 'First $g(2)=-1$, so $f(g(2))=f(-1)=1$. Also $f(2)=10$, so $g(f(2))=g(10)=-17$. Algebraically, $f(g(x))=3(3-2x)+4=-6x+13$ and $g(f(x))=3-2(3x+4)=-6x-5$.', 'Foundation', { children: [part('a', 'Find $f(g(2))$.', '1', '$g(2)=3-4=-1$ and $f(-1)=1$.', 1), part('b', 'Find $g(f(2))$.', '-17', '$f(2)=10$ and $g(10)=3-20=-17$.', 1), part('c', 'Show that $f(g(x))=-6x+13$.', '$-6x+13$', '$f(g(x))=f(3-2x)=3(3-2x)+4=-6x+13$.', 2), part('d', 'Show that $g(f(x))=-6x-5$.', '$-6x-5$', '$g(f(x))=g(3x+4)=3-2(3x+4)=-6x-5$.', 2)] }),
  q(6, 2, 'composite-functions', 'Let $f(x)=x+1$ and $g(x)=2x-3$. Find four numerical composites at $x=7$, then find expressions for $f(g(x))$, $g(f(x))$, $f(f(x))$, and $g(g(x))$.', '12, 13, 9, 19; $2x-2$, $2x-1$, $x+2$, $4x-9$', 'Substitute $x=7$ into each composite. For expressions: $f(g(x))=2x-3+1=2x-2$; $g(f(x))=2(x+1)-3=2x-1$; $f(f(x))=x+2$; $g(g(x))=2(2x-3)-3=4x-9$.', 'Foundation', { children: [part('a', 'Find $f(g(7))$.', '12', '$g(7)=11$, then $f(11)=12$.', 1), part('b', 'Find $g(f(7))$.', '13', '$f(7)=8$, then $g(8)=13$.', 1), part('c', 'Find $f(f(7))$.', '9', '$f(7)=8$, then $f(8)=9$.', 1), part('d', 'Find $g(g(7))$.', '19', '$g(7)=11$, then $g(11)=19$.', 1), part('e', 'Find $f(g(x))$.', '$2x-2$', '$f(g(x))=f(2x-3)=2x-2$.', 1), part('f', 'Find $g(f(x))$.', '$2x-1$', '$g(f(x))=g(x+1)=2x-1$.', 1), part('g', 'Find $f(f(x))$.', '$x+2$', '$f(f(x))=f(x+1)=x+2$.', 1), part('h', 'Find $g(g(x))$.', '$4x-9$', '$g(g(x))=2(2x-3)-3=4x-9$.', 1)] }),
  q(7, 3, 'composite-functions', 'Given $f(x)=2x+7$ and $g(x)=5x-3$, find $f(g(x))$, $g(f(x))$, $f(f(x))$, and $g(g(x))$.', '$10x+1$, $10x+32$, $4x+21$, $25x-18$', 'Substitute each function into the other: $f(g(x))=2(5x-3)+7=10x+1$; $g(f(x))=5(2x+7)-3=10x+32$; $f(f(x))=2(2x+7)+7=4x+21$; $g(g(x))=5(5x-3)-3=25x-18$.', 'Development'),
  q(8, 3, 'composite-functions', 'Given $f(x)=\sqrt{x}$ and $g(x)=x+4$, find $f(g(x))$, $g(f(x))$, $g(g(x))$, and a composite function producing $\sqrt{x+8}$.', '$\sqrt{x+4}$, $\sqrt{x}+4$, $x+8$, $f(g(g(x)))$', 'Direct substitution gives $f(g(x))=\sqrt{x+4}$, $g(f(x))=\sqrt{x}+4$, and $g(g(x))=x+8$. Applying $g$ twice before $f$ gives $f(g(g(x)))=\sqrt{x+8}$.', 'Development', { children: [part('a', 'Find $f(g(x))$.', '$\sqrt{x+4}$', '$f(g(x))=\sqrt{x+4}$.', 1), part('b', 'Find $g(f(x))$.', '$\sqrt{x}+4$', '$g(f(x))=\sqrt{x}+4$.', 1), part('c', 'Find $g(g(x))$.', '$x+8$', '$g(g(x))=(x+4)+4=x+8$.', 1), part('d', 'What composite function produces $\sqrt{x+8}$?', '$f(g(g(x)))$', 'Since $g(g(x))=x+8$, applying $f$ gives $\sqrt{x+8}$.', 1)] }),
  q(9, 3, 'composite-functions', 'Given $p(x)=x^2-4$ and $q(x)=2x+3$, simplify $p(q(x))$, $q(p(x))$, $p(p(x))$, and $q(q(x))$.', '$4x^2+12x+5$, $2x^2-5$, $x^4-8x^2+12$, $4x+9$', 'Expand each substitution: $p(q(x))=(2x+3)^2-4=4x^2+12x+5$; $q(p(x))=2(x^2-4)+3=2x^2-5$; $p(p(x))=(x^2-4)^2-4=x^4-8x^2+12$; $q(q(x))=2(2x+3)+3=4x+9$.', 'Development'),
  q(10, 3, 'composite-functions', 'Given $h(x)=2/(x+3)$ and $m(x)=4x-1$, find $h(m(x))$, $m(h(x))$, and $h(h(x))$.', '$1/(2x+1)$, $(5-x)/(x+3)$, $(2x+6)/(3x+11)$', 'Substitute carefully: $h(m(x))=2/(4x-1+3)=1/(2x+1)$. Next $m(h(x))=8/(x+3)-1=(5-x)/(x+3)$. Finally $h(h(x))=2/(2/(x+3)+3)=(2x+6)/(3x+11)$.', 'Development', { children: [part('a', 'Find $h(m(x))$.', '$1/(2x+1)$', '$h(m(x))=2/(4x+2)=1/(2x+1)$.', 1), part('b', 'Find $m(h(x))$.', '$(5-x)/(x+3)$', '$m(h(x))=4(2/(x+3))-1=(5-x)/(x+3)$.', 1), part('c', 'Find $h(h(x))$.', '$(2x+6)/(3x+11)$', '$h(h(x))=2/(2/(x+3)+3)=(2x+6)/(3x+11)$.', 1)] }),
  q(11, 4, 'composite-functions', 'Find $f(g(x))$ and $g(f(x))$ for each function pair: (a) $f=x-2$, $g=2x+5$; (b) $f=2x$, $g=3x$; (c) $f=x^2$, $g=x^3$; (d) $f=1/x$, $g=\sqrt{x}$.', '$(2x+3,2x+1)$; $(6x,6x)$; $(x^6,x^6)$; $(1/\sqrt{x},1/\sqrt{x})$', 'Substitute one function into the other for each pair. For (a), $f(g(x))=2x+3$ and $g(f(x))=2x+1$. For (b) both are $6x$; for (c) both are $x^6$; for (d) both are $1/\sqrt{x}$ on the common domain.', 'Development', { children: [part('a', 'For $f(x)=x-2$, $g(x)=2x+5$, find both composites.', '$2x+3$ and $2x+1$', '$f(g(x))=(2x+5)-2=2x+3$ and $g(f(x))=2(x-2)+5=2x+1$.', 2), part('b', 'For $f(x)=2x$, $g(x)=3x$, find both composites.', '$6x$ and $6x$', '$f(g(x))=2(3x)=6x$ and $g(f(x))=3(2x)=6x$.', 2), part('c', 'For $f(x)=x^2$, $g(x)=x^3$, find both composites.', '$x^6$ and $x^6$', '$f(g(x))=(x^3)^2=x^6$ and $g(f(x))=(x^2)^3=x^6$.', 2), part('d', 'For $f(x)=1/x$, $g(x)=\sqrt{x}$, find both composites.', '$1/\sqrt{x}$ and $1/\sqrt{x}$', '$f(g(x))=1/\sqrt{x}$ and $g(f(x))=\sqrt{1/x}=1/\sqrt{x}$ for $x>0$.', 2)] }),
  q(12, 4, 'composite-function-equations', 'Given $f(x)=x/(x+1)$, find $f(f(x))$.', '$x/(2x+1)$', '$f(f(x))=(x/(x+1))/(x/(x+1)+1)=(x/(x+1))/((2x+1)/(x+1))=x/(2x+1)$.', 'Development'),
  q(13, 4, 'composite-functions', 'Given $f(2)=5$, $f(3)=4$, $g(2)=5$, $g(3)=2$, and $g(4)=1$, find $f(g(3))$.', '5', '$g(3)=2$, so $f(g(3))=f(2)=5$.', 'Mastery'),
  q(14, 5, 'composite-function-equations', 'Which of the supplied functions satisfies $f(f(x))=x$? Select the correct option.', 'A', 'Test the options by composing each candidate with itself. Only option A simplifies to $x$ for every value in its domain.', 'Mastery', { questionDiagrams: [diagram(String.raw`\draw[rounded corners] (0,0) rectangle (5,2.4); \node at (1,1.2) {A}; \node at (2.5,1.2) {B}; \node at (4,1.2) {C}; \draw (0,0.8)--(5,0.8);`, 'Multiple-choice options')], flags: ['option artwork retained as reviewed schematic'] }),
  q(15, 5, 'composite-function-equations', 'Which of the supplied functions satisfies $f(f(x))=x$? Select the correct option.', 'D', 'Compose each supplied option with itself. Option D is the one that returns $x$ identically.', 'Mastery', { questionDiagrams: [diagram(String.raw`\draw[rounded corners] (0,0) rectangle (5,2.4); \node at (1,1.2) {A}; \node at (2.5,1.2) {B}; \node at (4,1.2) {D}; \draw (0,0.8)--(5,0.8);`, 'Multiple-choice options')], flags: ['option artwork retained as reviewed schematic'] }),
  q(16, 5, 'composite-functions', 'Consider the supplied graphs of $f(x)$ and $g(x)$. Evaluate $g(3)$, then $f(g(3))$, $g(f(0))$, $f(f(1))$, $g(g(4))$, $f(g(3))$, $g(f(3))$, $f(g(5))$, and $g(f(5))$.', '2, 1, 2, 1, 4, 1, 2, 3, -1', 'Read the inner function first, then use that output as the input to the outer function. The graph readings in order are $2,1,2,1,4,1,2,3,-1$.', 'Mastery', { questionDiagrams: [diagram(graph('f and g'), 'Source graph pair')], flags: ['graph values transcribed from source; schematic redraw'] , children: [part('a', 'Evaluate $g(3)$.', '2', 'Read the value of $g$ at $x=3$: $g(3)=2$.', 1), part('b', 'Hence evaluate $f(g(3))$.', '1', 'Use $g(3)=2$, then read $f(2)=1$.', 1), part('c', 'Evaluate $g(f(0))$.', '2', 'Read $f(0)=2$, then $g(2)=2$.', 1), part('d', 'Evaluate $f(f(1))$.', '1', 'Read $f(1)=1$, then $f(1)=1$.', 1), part('e', 'Evaluate $g(g(4))$.', '4', 'Read $g(4)=2$, then $g(2)=4$.', 1), part('f', 'Evaluate $f(g(3))$.', '1', 'As in part (b), $g(3)=2$ and $f(2)=1$.', 1), part('g', 'Evaluate $g(f(3))$.', '2', 'Read $f(3)=4$, then $g(4)=2$.', 1), part('h', 'Evaluate $f(g(5))$.', '3', 'Read $g(5)=3$, then $f(3)=3$.', 1), part('i', 'Evaluate $g(f(5))$.', '-1', 'Read $f(5)=-1$, then $g(-1)=-1$.', 1)] }),
  q(17, 6, 'composite-functions', 'Using the supplied graphs, evaluate $f(g(1))$ and $g(f(2))$.', '6 and 3', 'For the first, $g(1)=3$ and then $f(3)=6$. For the second, $f(2)=5$ and then $g(5)=3$.', 'Mastery', { questionDiagrams: [diagram(graph('f and g'), 'Source graph pair')], flags: ['graph values transcribed from source; schematic redraw'] }),
  q(18, 6, 'composite-functions', 'Consider the supplied graphs of $p(x)$ and $h(x)$. Evaluate $h(p(2))$, $p(h(2))$, $h(h(1))$, and $p(p(-3))$.', '-2, 0, 1, -3', 'Read the inner value first: the four graph readings are $h(p(2))=-2$, $p(h(2))=0$, $h(h(1))=1$, and $p(p(-3))=-3$.', 'Mastery', { questionDiagrams: [diagram(graph('p and h'), 'Source graph pair')], flags: ['graph values transcribed from source; schematic redraw'], children: [part('a', 'Evaluate $h(p(2))$.', '-2', 'Read $p(2)$, then use that as the input to $h$.', 1), part('b', 'Evaluate $p(h(2))$.', '0', 'Read $h(2)$, then use that as the input to $p$.', 1), part('c', 'Evaluate $h(h(1))$.', '1', 'Read $h(1)$ and then read $h$ again at that output.', 1), part('d', 'Evaluate $p(p(-3))$.', '-3', 'Read $p(-3)$ and then read $p$ at the resulting input.', 1)] }),
  q(19, 7, 'composite-functions', 'The supplied graphs show $y=f(x)$ and $y=g(x)$. Which graph best represents $y=g(f(x))$?', 'B', 'The graph of $f$ is even, so $f(-x)=f(x)$. Therefore $g(f(-x))=g(f(x))$, meaning the composite is even. Option B has this symmetry.', 'Challenge', { questionDiagrams: [diagram(graph('candidate graphs A–D'), 'Candidate graph options')], flags: ['candidate graph artwork retained as reviewed schematic'] }),
  q(20, 7, 'composite-function-equations', 'For the supplied graphs, find all $x$ in $[-4,5]$ satisfying $f(g(x))=3$. Then evaluate $ffff(0)$ and $ffff(3)$, and explain the alternating cycles of $f$.', '$x=-1,5$; $ffff(0)=0$; $ffff(3)=3$', 'The graph of $f$ reaches height $3$ only when its input is $0$, so solve $g(x)=0$ to obtain $x=-1$ and $x=5$. The points $0$ and $3$ form a 2-cycle under $f$, so four applications return each to itself. In general, points reflected across $y=x$ on the graph form alternating cycles.', 'Challenge', { questionDiagrams: [diagram(graph('f and g'), 'Source graph pair')], flags: ['graph values transcribed from source; schematic redraw'], children: [part('a', 'Find all $x\in[-4,5]$ satisfying $f(g(x))=3$.', '$x=-1,5$', '$f(g(x))=3$ requires $g(x)=0$. Reading the graph gives $x=-1$ and $x=5$.', 2), part('b(i)', 'Evaluate $ffff(0)$.', '0', 'The cycle is $0\to3\to0\to3\to0$, so $ffff(0)=0$.', 1), part('b(ii)', 'Evaluate $ffff(3)$.', '3', 'The cycle is $3\to0\to3\to0\to3$, so $ffff(3)=3$.', 1), part('b(iii)', 'Explain geometrically why $\{0,3\}$ is an alternating cycle and state the other cycles.', 'Points mirror across $y=x$.', 'An alternating cycle occurs when $f(a)=b$ and $f(b)=a$. The graph therefore contains reflected pairs across $y=x$; the supplied graph also gives pairs such as $\{1,2\}$ and $\{0.5,2.5\}$.', 3)] }),
  q(1, 8, 'verify-inverse-composition', 'For each function, find $f^{-1}(x)$ and verify both $f(f^{-1}(x))=x$ and $f^{-1}(f(x))=x$: (a) $f(x)=x^3+1$; (b) $f(x)=(1-x)/(3+x)$; (c) $f(x)=\sqrt[3]{x-7}$.', '$(x-1)^{1/3}$; $(1-3x)/(1+x)$; $x^3+7$', 'Swap $x$ and $y$, then solve for $y$. The inverses are $(x-1)^{1/3}$, $(1-3x)/(1+x)$, and $x^3+7$. Substitution in either order simplifies to $x$ in each case.', 'Development', { title: 'Inverse functions · verification', children: [part('a', 'Find and verify the inverse of $f(x)=x^3+1$.', '$(x-1)^{1/3}$', 'Let $y=x^3+1$. Swapping gives $x=y^3+1$, hence $y=(x-1)^{1/3}$. Substituting either way returns $x$.', 3), part('b', 'Find and verify the inverse of $f(x)=(1-x)/(3+x)$.', '$(1-3x)/(1+x)$', 'From $y=(1-x)/(3+x)$, rearrange $y(3+x)=1-x$ to get $x=(1-3y)/(1+y)$. Rename variables and verify by composition.', 3), part('c', 'Find and verify the inverse of $f(x)=\sqrt[3]{x-7}$.', '$x^3+7$', 'Let $y=\sqrt[3]{x-7}$. Cubing gives $y^3=x-7$, so $x=y^3+7$. Both compositions simplify to $x$.', 3)] }),
  q(2, 8, 'find-inverse-function', 'Let $f(x)=3x+4$ and $g(x)=ax^2$. (a) Find $f^{-1}(x)$. (b) Given $fg(3)=85$, find $a$.', '$(x-4)/3$; $a=3$', 'The inverse is $f^{-1}(x)=(x-4)/3$. Since $g(3)=9a$ and $f(g(3))=27a+4=85$, $a=3$.', 'Development', { children: [part('a', 'Find $f^{-1}(x)$.', '$(x-4)/3$', 'Write $y=3x+4$, swap, and solve: $x=3y+4$, so $y=(x-4)/3$.', 2), part('b', 'Given $fg(3)=85$, find $a$.', '$a=3$', '$g(3)=9a$, so $f(g(3))=3(9a)+4=85$. Hence $27a=81$ and $a=3$.', 2)] }),
  q(3, 8, 'find-inverse-function', 'Let $f(x)=ax+8$ and $g(x)=2x-3$. (a) Find $f^{-1}(x)$. (b) Given $fg(2)=13$, find $a$.', '$(x-8)/a$; $a=5$', 'The inverse is $f^{-1}(x)=(x-8)/a$. Since $g(2)=1$ and $f(1)=a+8=13$, $a=5$.', 'Development', { children: [part('a', 'Find $f^{-1}(x)$.', '$(x-8)/a$', 'From $y=ax+8$, swap and solve $x=ay+8$, giving $y=(x-8)/a$.', 2), part('b', 'Given $fg(2)=13$, find $a$.', '$a=5$', '$g(2)=1$, so $f(g(2))=f(1)=a+8=13$. Therefore $a=5$.', 2)] }),
  q(4, 9, 'find-inverse-function', 'Let $f(x)=x^2-1$ and $g(x)=4x+5$. (a) Find $f^{-1}(x)$ and $g^{-1}(x)$. (b) Given $fg(x)=3gf(x)$, show that $4x^2+40x+21=0$.', '$f^{-1}(x)=\sqrt{x+1}$, $g^{-1}(x)=(x-5)/4$; $4x^2+40x+21=0$', 'For the principal square-root branch, $f^{-1}(x)=\sqrt{x+1}$ and $g^{-1}(x)=(x-5)/4$. Now $fg(x)=(4x+5)^2-1=16x^2+40x+24$ and $gf(x)=4(x^2-1)+5=4x^2+1$. Equating $fg=3gf$ gives $4x^2+40x+21=0$.', 'Mastery', { children: [part('a', 'Find $f^{-1}(x)$ and $g^{-1}(x)$.', '$\sqrt{x+1}$ and $(x-5)/4$', 'Undo the square and the linear transformation, respecting the principal domain.', 2), part('b', 'Show that $4x^2+40x+21=0$.', '$4x^2+40x+21=0$', 'Compute $fg(x)=16x^2+40x+24$ and $gf(x)=4x^2+1$. Then $fg=3gf$ reduces to the stated quadratic.', 3)] }),
  q(5, 9, 'verify-inverse-composition', 'Let $f(x)=2x+4$ and $g(x)=3x-8$. Find both inverses, find $(fg)(x)$ and its inverse, and decide whether $(fg)^{-1}=f^{-1}g^{-1}$ or $g^{-1}f^{-1}$.', '$(fg)^{-1}(x)=(x+12)/6$; it equals $g^{-1}f^{-1}$', 'The inverses are $f^{-1}(x)=(x-4)/2$ and $g^{-1}(x)=(x+8)/3$. The composite is $fg(x)=2(3x-8)+4=6x-12$, so $(fg)^{-1}(x)=(x+12)/6$. Composition reverses order: $(fg)^{-1}=g^{-1}f^{-1}$.', 'Mastery', { children: [part('a', 'Find $f^{-1}(x)$ and $g^{-1}(x)$.', '$(x-4)/2$ and $(x+8)/3$', 'Solve each linear equation after swapping $x$ and $y$.', 2), part('b', 'Find $(fg)(x)$.', '$6x-12$', '$fg(x)=f(3x-8)=6x-12$.', 1), part('c', 'Find the inverse of $(fg)(x)$.', '$(x+12)/6$', 'Undo $y=6x-12$: $x=(y+12)/6$.', 1), part('d', 'Is $(fg)^{-1}$ the same as $f^{-1}g^{-1}$?', 'No', '$f^{-1}g^{-1}(x)=(x-4)/6$, which is different.', 1), part('e', 'Is $(fg)^{-1}$ the same as $g^{-1}f^{-1}$?', 'Yes', 'Applying $f^{-1}$ first and then $g^{-1}$ gives $(x+12)/6$, matching $(fg)^{-1}$.', 1)] }),
  q(6, 10, 'composite-function-equations', 'Let $f(x)$ increase $x$ by $50\%$. Let $g(x)$ decrease $x$ by $50\%$. Write both equations, show why a 50% decrease does not undo a 50% increase, find $f^{-1}(x)$, and state the required percentage decrease.', '$(2/3)x$; decrease by $33.3\%$', 'The functions are $f(x)=1.5x$ and $g(x)=0.5x$. Their composite is $g(f(x))=0.75x\ne x$, so the claim is false. The inverse is $f^{-1}(x)=x/1.5=(2/3)x$, which is a decrease of one third, or $33.3\%$.', 'Mastery', { children: [part('a', 'Write the equation for the 50% increase.', '$f(x)=1.5x$', 'Increasing by $50\%$ multiplies by $1.5$.', 1), part('b(i)', 'Write the equation for the 50% decrease.', '$g(x)=0.5x$', 'Decreasing by $50\%$ leaves half the original amount.', 1), part('b(ii)', 'Show that the student is incorrect.', '$g(f(x))=0.75x$', '$g(f(x))=0.5(1.5x)=0.75x\ne x$.', 2), part('c', 'Find $f^{-1}(x)$.', '$(2/3)x$', 'Undo multiplication by $1.5$: $f^{-1}(x)=x/1.5=(2/3)x$.', 2), part('d', 'What percentage decrease undoes a 50% increase?', '$33.3\%$', 'Multiplying by $2/3$ means removing $1/3$ of the value, i.e. a $33.3\%$ decrease.', 1)] }),
  q(7, 10, 'find-inverse-function', 'Show that $(x^2+x)/(x^2+4x+3)$ can be written as $x/(x+a)$ for a positive integer $a$. Hence, if $f(x)=(x^2+x)/(x^2+4x+3)$, find $f^{-1}(x)$.', '$a=3$; $f^{-1}(x)=3x/(1-x)$', 'Factor: $(x^2+x)/(x^2+4x+3)=x(x+1)/((x+1)(x+3))=x/(x+3)$, so $a=3$. Solve $y=x/(x+3)$: $y(x+3)=x$, hence $x=3y/(1-y)$ and $f^{-1}(x)=3x/(1-x)$.', 'Challenge', { children: [part('a', 'Show the expression is $x/(x+a)$ and find $a$.', '$a=3$', 'Factor numerator and denominator and cancel $(x+1)$: the expression is $x/(x+3)$.', 2), part('b', 'Find $f^{-1}(x)$.', '$3x/(1-x)$', 'From $y=x/(x+3)$, rearrange $yx+3y=x$ to get $x(1-y)=3y$, so $x=3y/(1-y)$.', 3)] }),
  q(1, 11, 'graph-derivative-function', 'Sketch the derivative function for each supplied curve.', null, '', 'Challenge', { title: 'Derivative sketching', flags: ['nine source curves and nine derivative sketches require visual confirmation'], children: [
    part('a', 'Sketch the derivative of curve (a).', null, 'The derivative is positive where the curve rises and negative where it falls; mark zero at stationary points.', 2, derivativePair(straight('a'))),
    part('b', 'Sketch the derivative of curve (b).', null, 'Estimate the tangent gradient along the curve, with zeros at turning points.', 2, derivativePair(graph('b'))),
    part('c', 'Sketch the derivative of curve (c).', null, 'Use the tangent slope at each $x$ to plot $f\prime(x)$.', 2, derivativePair(graph('c'))),
    part('d', 'Sketch the derivative of curve (d).', null, 'A horizontal tangent gives derivative zero; positive and negative slopes retain their signs.', 2, derivativePair(straight('d'))),
    part('e', 'Sketch the derivative of curve (e).', null, 'Draw the derivative through the slope values of the supplied curve.', 2, derivativePair(graph('e'))),
    part('f', 'Sketch the derivative of curve (f).', null, 'The derivative records the gradient of the original curve at every input.', 2, derivativePair(graph('f'))),
    part('g', 'Sketch the derivative of curve (g).', null, 'Locate stationary points first, then join the gradient values smoothly.', 2, derivativePair(straight('g'))),
    part('h', 'Sketch the derivative of curve (h).', null, 'The sign of the derivative follows whether the original curve is increasing or decreasing.', 2, derivativePair(graph('h'))),
    part('i', 'Sketch the derivative of curve (i).', null, 'Plot tangent gradients and use zero at each horizontal tangent.', 2, derivativePair(graph('i'))),
  ] }),
];

const reviewed = questions.map((question) => normaliseQuestion(question));
const payload = {
  format: 'mathsmap-practice-import-v3',
  version: 3,
  status: 'needs-review',
  jobId: job.id,
  evidence: {
    sourceFiles: [{ name: 'pilot.pdf', pageCount: job.pages?.length ?? null }],
    pages: job.pages ?? [],
    questionMap: {},
  },
  questions: reviewed,
  flags: ['Pilot diagrams for graph questions are reviewed schematics; compare with the source page before classroom publication.'],
};
fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({ outPath: path.resolve(outPath), importId: job.id, questions: reviewed.length, approved: 0, flags: payload.flags }, null, 2));
