#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=process.cwd();
const source=path.resolve(process.argv[2] ?? path.join(root,'..','MathsEditor'));
const target=path.join(root,'public','libs','maths-editor');
const entries=['maths-editor.js','document-model.mjs','document-editor.js','document-editor.css','studio.html','serialiser.js','clipboard.js','maths-editor.css','vendor/mathlive.min.js','vendor/mathlive-static.css','vendor/compute-engine.min.js'];
for(const name of fs.readdirSync(path.join(source,'vendor','fonts'))) if(/\.(woff2?|ttf)$/.test(name)) entries.push('vendor/fonts/'+name);
const files=entries.map(name=>{ const data=fs.readFileSync(path.join(source,name)); fs.mkdirSync(path.dirname(path.join(target,name)),{recursive:true}); fs.writeFileSync(path.join(target,name),data); return {path:name,sha256:crypto.createHash('sha256').update(data).digest('hex')}; });
fs.writeFileSync(path.join(target,'release.json'),JSON.stringify({format:'maths-editor-release-v1',version:'1.0.0',sourceProject:'MathsEditor',files},null,2)+'\n');
console.log('Pinned standalone MathsEditor 1.0.0: '+files.length+' files.');

