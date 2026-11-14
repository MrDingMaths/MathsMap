import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PROGRESS, ACCENT } from '../src/lib/tokens.js';

const css = readFileSync(new URL('../src/app.css', import.meta.url), 'utf8');
const block = (selector) => {
  const start = css.indexOf(selector);
  return css.slice(start, css.indexOf('\n}', start));
};
const read = (scope, name) => new RegExp(`--${name}: *(#[0-9A-Fa-f]{6})`).exec(scope)?.[1]?.toUpperCase();

test('JS progress colours match the CSS progress tokens', () => {
  const light = block(':root {');
  const dark = block(':root[data-theme="dark"] {');
  for (const key of ['none', 'learning', 'proficient', 'mastered']) {
    assert.equal(read(light, `prog-${key}`), PROGRESS.light[key].toUpperCase());
    assert.equal(read(dark, `prog-${key}`), PROGRESS.dark[key].toUpperCase());
  }
  assert.equal(read(light, 'primary'), ACCENT.toUpperCase());
});
