import test from 'node:test';
import assert from 'node:assert/strict';
import { plainText, pageMeta, SITE_URL } from '../src/lib/page-meta.js';

test('plainText turns inline LaTeX into readable text', () => {
  assert.equal(plainText('Use $\\sqrt{x^2}=|x|$'), 'Use √(x²) = |x|');
  assert.equal(plainText('Measure angles up to $360^\\circ$'), 'Measure angles up to 360°');
  assert.equal(plainText('Recognise $\\log_a(mn)=\\log_a m+\\log_a n$'), 'Recognise log_a(mn) = log_a m+log_a n');
  assert.equal(plainText('Integrate $\\int x^n\\,dx=\\frac{x^{n+1}}{n+1}+C$'), 'Integrate ∫ xⁿ dx = (x^(n+1))/(n+1)+C');
  assert.equal(plainText('Units per \\$1 and **bold**'), 'Units per $1 and bold');
});

const lookups = {
  skillById: new Map([['s1', { id: 's1', title: 'Find $\\frac{1}{2}$ of a number', blurb: 'Halve it.', stage: 3 }]]),
  topicById: new Map([['t1', { id: 't1', title: 'Fractions', blurb: 'Parts of a whole.', stage: 3 }]]),
  courseById: new Map([['s3', { id: 's3', title: 'Stage 3' }]]),
  primaryTopicForSkill: () => ({ title: 'Fractions' }),
  skillCountForCourse: () => 149,
};

test('pageMeta gives each public page its own title, canonical and robots', () => {
  const skill = pageMeta({ name: 'skill', params: ['s1'] }, lookups);
  assert.equal(skill.title, 'Find 1/2 of a number · Stage 3 · MathsMap');
  assert.equal(skill.canonical, `${SITE_URL}/skill/s1`);
  assert.equal(skill.robots, 'index,follow');
  assert.match(skill.description, /^Halve it\. Part of Fractions, Stage 3\./);

  assert.equal(pageMeta({ name: 'course', params: ['s3'] }, lookups).description.startsWith('All 149 NSW Stage 3'), true);
  assert.equal(pageMeta({ name: 'topic', params: ['t1'] }, lookups).title, 'Fractions · Stage 3 · MathsMap');
  assert.equal(pageMeta({ name: 'home', params: [] }, lookups).canonical, `${SITE_URL}/`);
});

test('personal and unknown pages are noindex', () => {
  for (const route of [{ name: 'learning', params: [] }, { name: 'quiz-history', params: ['x'] }, { name: 'skill', params: ['missing'] }, { name: 'nope', params: [] }]) {
    assert.equal(pageMeta(route, lookups).robots, 'noindex,follow', route.name);
  }
});

test('long descriptions are clipped at a word', () => {
  const long = { ...lookups, skillById: new Map([['s1', { id: 's1', title: 'T', blurb: 'word '.repeat(60), stage: 4 }]]) };
  const { description } = pageMeta({ name: 'skill', params: ['s1'] }, long);
  assert.ok(description.length <= 155 && description.endsWith('…'));
});
