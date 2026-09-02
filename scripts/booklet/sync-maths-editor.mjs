#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targetRoot = path.join(root, 'src', 'vendor', 'maths-editor');
const entries = [
  {
    source: path.join(root, 'src', 'lib', 'maths-editor.js'),
    target: path.join(targetRoot, 'maths-editor.js'),
    transform: (value) => value.replace("from './render-math.js'", "from '../../lib/render-math.js'"),
  },
  {
    source: path.join(root, 'src', 'components', 'MathsEditor.svelte'),
    target: path.join(targetRoot, 'MathsEditor.svelte'),
    transform: (value) => value.replace("from '../lib/maths-editor.js'", "from '../../lib/maths-editor.js'"),
  },
];

fs.mkdirSync(targetRoot, { recursive: true });
const files = [];
for (const entry of entries) {
  const content = entry.transform(fs.readFileSync(entry.source, 'utf8'));
  fs.writeFileSync(entry.target, content, 'utf8');
  files.push({
    path: path.relative(root, entry.target).replaceAll(path.sep, '/'),
    source: path.relative(root, entry.source).replaceAll(path.sep, '/'),
    sha256: crypto.createHash('sha256').update(content).digest('hex'),
  });
}

const sourceText = fs.readFileSync(entries[0].source, 'utf8');
const version = Number(sourceText.match(/MATHS_EDITOR_VERSION\s*=\s*(\d+)/)?.[1] ?? 1);
fs.writeFileSync(path.join(targetRoot, 'snapshot.json'), JSON.stringify({
  format: 'mathsmap-maths-editor-snapshot-v1',
  editorVersion: version,
  files,
}, null, 2) + '\n', 'utf8');
console.log(`Synced MathsEditor snapshot v${version} (${files.length} files).`);
