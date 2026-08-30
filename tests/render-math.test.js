import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderMath, escapeHtml } from '../src/lib/render-math.js';

// This module is shared by the app (src/components/Math.svelte) and by the Node-side
// booklet renderer, so these tests pin the behaviour both depend on: identical HTML from
// the same source text, whichever side renders it.

test('prose is HTML-escaped and maths is rendered by KaTeX', () => {
  const html = renderMath('Solve $x + 1 = 2$ for <x>');
  assert.match(html, /class="katex"/);
  assert.match(html, /&lt;x&gt;/, 'angle brackets in prose are escaped');
  assert.ok(!html.includes('$'), 'the delimiters themselves are consumed');
});

test('every expression renders in display style, as MathsDatabase does', () => {
  assert.match(renderMath('$\\frac{a}{b}$'), /class="katex"/);
  // \displaystyle is applied to the expression, not the layout: no display-mode wrapper.
  assert.ok(!renderMath('$\\frac{a}{b}$').includes('katex-display'));
});

test('**bold** wrapping a maths run survives the placeholder round trip', () => {
  const html = renderMath('**divide by $4$**');
  assert.match(html, /<strong>/);
  assert.match(html, /class="katex"/);
  assert.ok(html.indexOf('<strong>') < html.indexOf('class="katex"'), 'the bold opens before the maths');
});

test('a literal dollar is written \\$ and does not open a maths run', () => {
  const html = renderMath('It costs \\$5 to enter');
  assert.match(html, /\$5/);
  assert.ok(!html.includes('class="katex"'), 'an escaped dollar is prose, not maths');
});

test('prose digits are never mistaken for a maths placeholder', () => {
  // The placeholder is delimited by NUL characters precisely so that ordinary prose like
  // "between 0 and 1" cannot collide with it. An earlier ` <digits> ` scheme swapped such
  // prose for a rendered expression, or for the string "undefined".
  const html = renderMath('$a$ lies between 0 and 1, unlike $b$');
  assert.match(html, /between 0 and 1/);
  assert.ok(!html.includes('undefined'));
  assert.equal((html.match(/class="katex"/g) || []).length, 2);
});

test('malformed maths degrades to visible text rather than throwing', () => {
  assert.doesNotThrow(() => renderMath('$\\frac{$'));
  assert.equal(renderMath(null), '');
  assert.equal(renderMath(undefined), '');
});

test('the same input renders identically on repeat calls (the cache is transparent)', () => {
  const once = renderMath('area is $\\pi r^{2}$');
  assert.equal(renderMath('area is $\\pi r^{2}$'), once);
});

test('escapeHtml covers the three characters that would break the markup', () => {
  assert.equal(escapeHtml('<a> & "b"'), '&lt;a&gt; &amp; "b"');
});
