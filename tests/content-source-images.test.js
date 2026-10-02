import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { sourceMarkdownImages } from '../scripts/content/source-markdown-images.mjs';
import { validateSourceImages, hashValue } from '../scripts/content/campaign-sources.mjs';
import { readSelectedEvidence } from '../scripts/content/campaign-source-selection.mjs';

test('wrapped grid columns retain every image and ignore ordinary links and maths pipes', t => {
  assert.deepEqual(sourceMarkdownImages('Before\n![Wrapped ordinary\nimage](media/plain.png)\nAfter'), ['media/plain.png']);
  const width = 45;
  const row = cells => '|' + cells.map(cell => cell.padEnd(width)).join('|') + '|';
  const border = '+' + ('-'.repeat(width) + '+').repeat(3);
  const source = [border, row(['![Triangle with $|x|$ and', '![Rectangle with', '![Third diagram with']), row(['numbers](media/one.png)', 'numbers](media/two.png)', 'numbers](media/three.png)']), border, '[ordinary link](media/not-an-image.png)', '![](<media/space%20name.png> "Caption")'].join('\n');
  assert.deepEqual(sourceMarkdownImages(source), ['media/one.png', 'media/two.png', 'media/three.png', 'media/space%20name.png']);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mathsmap-grid-images-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'media'));
  for (const name of ['one', 'two', 'three', 'space name']) fs.writeFileSync(path.join(root, 'media', name + '.png'), name);
  fs.writeFileSync(path.join(root, 'source.md'), source);
  const ref = { path: 'source.md', startLine: 1, endLine: source.split('\n').length, hash: hashValue(source) };
  assert.equal(readSelectedEvidence(root, [ref]).evidence[0].images.length, 4);
  const bound = validateSourceImages(root, ref);
  assert.equal(bound.length, 4);
  assert.throws(() => validateSourceImages(root, { ...ref, images: bound.filter(image => !image.path.endsWith('two.png')) }, { requireBound: true }), /lacks a current staged hash.*two\.png/);
  fs.unlinkSync(path.join(root, 'media', 'three.png'));
  assert.throws(() => validateSourceImages(root, ref), /Relevant source image missing.*three\.png/);
});

test('actual Length booklet wrapped example binds all three diagrams without rewriting source bytes', () => {
  const file = 'booklets/mathsmap-sources/Stage 4/Length 1_Solve problems involving the perimeter of various quadrilaterals and simple composite figures.md';
  const bytes = fs.readFileSync(file), source = bytes.toString('utf8').split('\n').slice(511, 610).join('\n');
  const images = sourceMarkdownImages(source);
  for (const number of [19, 20, 21]) assert.ok(images.some(name => name.endsWith('/image' + number + '.png')));
  assert.equal(hashValue(fs.readFileSync(file)), hashValue(bytes));
});

test('equal total widths do not confuse earlier single-column and later multipart grids', () => {
  const width = 45, border = '+' + ('-'.repeat(width) + '+').repeat(3);
  const row = cells => '|' + cells.map(cell => cell.padEnd(width)).join('|') + '|';
  const single = '+' + '-'.repeat(3 * width + 2) + '+';
  const source = [single, '|' + 'Earlier one-column table'.padEnd(3 * width + 2) + '|', single, '', border, row(['![One wrapped', '![Two wrapped', '![Three wrapped']), row(['image](one.png)', 'image](two.png)', 'image](three.png)']), border].join('\n');
  assert.deepEqual(sourceMarkdownImages(source), ['one.png', 'two.png', 'three.png']);
  const partial = source.split('\n').slice(5).join('\n');
  assert.deepEqual(sourceMarkdownImages(partial), ['one.png', 'two.png', 'three.png'], 'a bounded excerpt may start inside the grid');
});
