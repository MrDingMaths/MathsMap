#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=process.cwd();
const source=path.resolve(process.argv[2] ?? path.join(root,'..','MathsEditor'));
const target=path.join(root,'public','libs','maths-editor');
const entries=['arrangement-model.mjs','maths-editor.js','house-style.mjs','annotated-equation.mjs','equation-controls.mjs','cloze-leader.mjs','document-model.mjs','document-editor.js','document-controls.mjs','tab-layout.mjs','table-annotations.mjs','table-model.mjs','document-editor.css','studio.html','serialiser.js','clipboard.js','maths-editor.css','vendor/mathlive.min.js','vendor/mathlive-static.css','vendor/compute-engine.min.js'];
entries.push('booklet-palette.mjs','math-editing.mjs','math-selection.mjs','equation-spacing.mjs','palette/catalogue.js','palette/palette.js','palette/palette.css');
for(const name of fs.readdirSync(path.join(source,'vendor','fonts'))) if(/\.(woff2?|ttf)$/.test(name)) entries.push('vendor/fonts/'+name);
// Host-owned patches are reviewed locally; an upstream sync must not erase them.
const pinned=JSON.parse(fs.readFileSync(path.join(target,'release.json'),'utf8'));
const hostOwned=new Set(['house-style.mjs','booklet-palette.mjs',...(pinned.hostOwned??[])]);
for(const name of hostOwned)if(!entries.includes(name))entries.push(name);
const files=entries.map(name=>{ const data=fs.readFileSync(path.join(hostOwned.has(name)?target:source,name)); fs.mkdirSync(path.dirname(path.join(target,name)),{recursive:true}); fs.writeFileSync(path.join(target,name),data); return {path:name,sha256:crypto.createHash('sha256').update(data).digest('hex')}; });
fs.writeFileSync(path.join(target,'release.json'),JSON.stringify({format:'maths-editor-release-v1',version:'1.6.1',sourceProject:'MathsEditor',hostOwned:[...hostOwned],hostRevision:pinned.hostRevision,files},null,2)+'\n');
console.log('Pinned standalone MathsEditor 1.6.1: '+files.length+' files.');
