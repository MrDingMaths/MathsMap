import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = path.resolve('booklets/question-bank');

function matchingOpen(text, closeIndex) {
  let depth = 0;
  for (let index = closeIndex; index >= 0; index -= 1) {
    if (text[index] === ')') depth += 1;
    if (text[index] === '(') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}
function matchingClose(text, openIndex) {
  let depth = 0;
  for (let index = openIndex; index < text.length; index += 1) {
    if (text[index] === '(') depth += 1;
    if (text[index] === ')') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}
function numeratorStart(body, slash) {
  let index = slash - 1;
  while (index >= 0 && /\s/.test(body[index])) index -= 1;
  if (body[index] === ')') return matchingOpen(body, index);
  if (body[index] === '}') {
    let depth = 0;
    for (; index >= 0; index -= 1) {
      if (body[index] === '}') depth += 1;
      if (body[index] === '{') {
        depth -= 1;
        if (depth === 0) {
          const command = body.slice(Math.max(0, index - 6), index);
          if (/\\sqrt$/.test(command)) return Math.max(0, index - 5);
          break;
        }
      }
    }
  }
  while (index >= 0 && /[A-Za-z0-9._^{}]/.test(body[index])) index -= 1;
  return index + 1;
}
function denominatorEnd(body, slash) {
  let index = slash + 1;
  while (index < body.length && /\s/.test(body[index])) index += 1;
  if (body[index] === '(') {
    const close = matchingClose(body, index);
    return close >= 0 ? close + 1 : index + 1;
  }
  if (body.slice(index).startsWith('\\sqrt{')) {
    const close = body.indexOf('}', index + 6);
    return close >= 0 ? close + 1 : index + 6;
  }
  while (index < body.length && /[A-Za-z0-9._^{}]/.test(body[index])) index += 1;
  return index;
}
function convertBody(body) {
  let result = body;
  for (let guard = 0; guard < 20; guard += 1) {
    const slash = [...result].findIndex((character, index) => character === '/' && result[index - 1] !== '\\');
    if (slash < 0) break;
    const start = numeratorStart(result, slash);
    const end = denominatorEnd(result, slash);
    if (start >= slash || end <= slash + 1) break;
    const numerator = result.slice(start, slash).trim().replace(/^\((.*)\)$/, '$1');
    const denominator = result.slice(slash + 1, end).trim().replace(/^\((.*)\)$/, '$1');
    result = result.slice(0, start) + '\\frac{' + numerator + '}{' + denominator + '}' + result.slice(end);
  }
  return result;
}
function formatMath(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/(?<!\\)\$([\s\S]*?)(?<!\\)\$/g, (_, body) => '$' + convertBody(body) + '$');
}
function walk(value) {
  if (Array.isArray(value)) return value.map(walk);
  if (!value || typeof value !== 'object') return formatMath(value);
  for (const [key, child] of Object.entries(value)) {
    if (key === 'src' || key === 'sourceRef' || key === 'id') continue;
    value[key] = walk(child);
  }
  return value;
}

const names = (await fs.readdir(root)).filter((name) => /^pq-pilot-.*\.json$/.test(name));
for (const name of names) {
  const question = walk(JSON.parse(await fs.readFile(path.join(root, name), 'utf8')));
  if (question.id === 'pq-pilot-p11-q1') {
    for (const node of question.content.children ?? []) {
      for (const diagram of node.answer?.solutionDiagrams ?? []) {
        diagram.code = String(diagram.code ?? '').replace(/\\draw\[thick\]/g, '\\draw[red,thick]');
      }
    }
  }
  await fs.writeFile(path.join(root, name), JSON.stringify(question, null, 2) + '\n', 'utf8');
}
console.log('Normalised pilot maths spans and derivative overlay colour.');
