import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {layoutVerificationKey,verificationAssetSignatures,signature} from '../../src/lib/booklet-content-verification.js';
import {isLeanReview,printableProject} from '../../src/lib/booklet-review-profile.js';

export const contentAssetSignatures=project=>verificationAssetSignatures(project,async src=>{
  if(src.startsWith('data:'))return new Uint8Array(await (await fetch(src)).arrayBuffer());
  if(/^https?:/i.test(src))throw Error('Remote assets must be retained locally before verification.');
  const relative=src.replace(/^\//,'');
  const file=[path.join('public',relative),relative].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile());
  if(!file)throw Error('Missing asset');
  return fs.readFileSync(file);
});

const digest=value=>createHash('sha256').update(value).digest('hex');
function treeSignature(root){
  if(!fs.existsSync(root))return 'missing';
  if(fs.statSync(root).isFile())return digest(fs.readFileSync(root));
  return digest(JSON.stringify(fs.readdirSync(root).sort().map(name=>[name,treeSignature(path.join(root,name))])));
}
// Follow the application's real import graph. Unknown import mechanisms widen to
// the whole source tree; unused authoring helpers and reports do not affect print.
export function sourceDependencySignature(root='src/main.js'){
  const files=new Set(),pending=[path.resolve(root)];let unknown=false;
  while(pending.length){
    const file=pending.pop();if(files.has(file))continue;files.add(file);
    if(!fs.existsSync(file)){unknown=true;continue;}
    if(!/\.(?:[cm]?js|ts|svelte|css)$/.test(file))continue;
    const source=fs.readFileSync(file,'utf8');
    if(/import\.meta\.glob|import\s*\(\s*[^'"\s]/.test(source))unknown=true;
    const refs=[...source.matchAll(/(?:\b(?:import|export)\s+(?:[^;'"]*?\s+from\s*)?|\bimport\s*\(\s*|@import\s*)['"]([^'"]+)['"]/g)].map(m=>m[1]);
    for(const ref of refs){
      if(!ref.startsWith('.')&&!ref.startsWith('/'))continue;
      const base=ref.startsWith('/')?path.resolve('.'+ref):path.resolve(path.dirname(file),ref.split('?')[0]);
      const resolved=[base,base+'.js',base+'.svelte',path.join(base,'index.js')].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile());
      if(resolved)pending.push(resolved);else unknown=true;
    }
  }
  return unknown?treeSignature(path.dirname(root)):digest(JSON.stringify([...files].sort().map(file=>[path.relative(process.cwd(),file).replaceAll('\\','/'),treeSignature(file)])));
}
export function rendererSignature({lean=false}={}){
  // Bind the print/measurement import closure and its host without pulling in
  // unrelated bank/classification screens. Checker revisions do not change PDF pixels.
  if(lean)return digest(JSON.stringify({profile:'textbook-three-pass-v1',sources:sourceDependencySignature('src/components/FlowBookletPreview.svelte'),hosts:['src/components/BookletProjects.svelte','src/App.svelte','src/main.js','src/app.css','index.html'].map(file=>[file,treeSignature(file)]),runtime:['public/libs','node_modules/katex/dist','package-lock.json'].map(file=>[file,treeSignature(file)])}));
  return sourceDependencySignature()+treeSignature('public/libs')+treeSignature('node_modules/katex/dist/fonts')+treeSignature('scripts/booklet/pdf-layout-qa.mjs')+treeSignature('scripts/booklet/check-compact-exercises.mjs')+treeSignature('scripts/booklet/diagram-preflight.mjs')+treeSignature('package-lock.json')+treeSignature('scripts/booklet/pdf-navigation-qa.mjs');
}
export function qaSignature(){
  // Checker helpers can change the verdict even when the entry script does not.
  return digest(JSON.stringify(['scripts/booklet/pdf-layout-qa.mjs','scripts/booklet/check-compact-exercises.mjs','scripts/booklet/diagram-preflight.mjs','scripts/booklet/pdf-navigation-qa.mjs','src/lib/booklet-qa.js','src/lib/booklet-content-verification.js','src/lib/booklet-presentation-verification.js'].map(file=>[file,sourceDependencySignature(file)])));
}
// An explicitly reviewed regression run may bind its selected tests and their
// local import graph. Unknown imports widen to the historical whole-tree key.
export function regressionScopeSignature({testFiles,supportFiles=[]}={},root=process.cwd()){
 if(!Array.isArray(testFiles)||!testFiles.length||!Array.isArray(supportFiles))throw Error('Regression scope needs selected test files and support files');
 const broad=()=>digest(JSON.stringify(['scripts/booklet','tests','src','public','package-lock.json'].map(file=>[file,treeSignature(path.resolve(root,file))])));
 const inside=(file,folder)=>{const relative=path.relative(path.resolve(root,folder),file);return relative&&!relative.startsWith('..')&&!path.isAbsolute(relative);};
 const selected=testFiles.map(file=>path.resolve(root,file));
 if(selected.some(file=>!inside(file,'tests')||!/\.test\.[cm]?js$/.test(file)||!fs.existsSync(file)))throw Error('Regression test selection must name existing tests/*.test.js files');
 const support=supportFiles.map(file=>path.resolve(root,file));
 if(support.some(file=>!inside(file,'.')||!fs.existsSync(file)))throw Error('Regression support files must exist inside the repository');
 const visited=new Set(),pending=[...selected];let unknown=false;
 while(pending.length){
  const file=pending.pop();if(visited.has(file))continue;visited.add(file);
  if(!fs.existsSync(file)){unknown=true;continue;}
  if(!/\.(?:[cm]?js|ts|svelte|css)$/.test(file))continue;
  const source=fs.readFileSync(file,'utf8');
  if(/import\.meta\.glob|\bimport\s*\(\s*[^'"\s]|\brequire\s*\(/.test(source)){unknown=true;continue;}
  const refs=[...source.matchAll(/(?:\b(?:import|export)\s+(?:[^;'"]*?\s+from\s*)?|\bimport\s*\(\s*|@import\s*)['"]([^'"]+)['"]/g)].map(match=>match[1]);
  for(const ref of refs){
   if(!ref.startsWith('.')&&!ref.startsWith('/'))continue;
   const base=ref.startsWith('/')?path.resolve(root,'.'+ref):path.resolve(path.dirname(file),ref.split('?')[0]);
   const resolved=[base,base+'.js',base+'.mjs',base+'.svelte',base+'.json',path.join(base,'index.js')].find(candidate=>fs.existsSync(candidate)&&fs.statSync(candidate).isFile());
   if(!resolved||!inside(resolved,'.'))unknown=true;else pending.push(resolved);
  }
 }
 if(unknown)return broad();
 return digest(JSON.stringify({files:[...visited,...support].sort().map(file=>[path.relative(root,file).replaceAll('\\','/'),treeSignature(file)]),lock:treeSignature(path.resolve(root,'package-lock.json'))}));
}
export function implementationSignatures(){
 const group=files=>digest(JSON.stringify(files.map(file=>[file,treeSignature(file)])));
 return {authoring:group(['scripts/booklet/semantic-workflow.mjs','scripts/booklet/author-assignments.mjs','scripts/booklet/local-attempt-repair.mjs','scripts/booklet/assemble-semantic-packets.mjs']),
  assessment:group(['scripts/booklet/source-classification-review.mjs','scripts/booklet/import-project-bank.mjs','scripts/booklet/import-verification.mjs','src/lib/practice-question-model.js']),
  regression:group(['scripts/booklet','tests','package-lock.json']),build:group(['src','public/libs','package-lock.json','vite.config.js']),storage:group(['booklets/storage-policy.json','scripts/check-repo-storage.mjs'])};
}
export async function layoutCacheKey(project,edition,runtime){
  const lean=isLeanReview(project),printable=lean?printableProject(project,edition):project;
  const assets=[];let unresolved=false;
  const visit=n=>{
    if(!n||typeof n!=='object')return;
    if(typeof n.src==='string'){
      const relative=n.src.replace(/^\//,'');
      const candidates=[relative,path.join('public',relative)];
      const file=candidates.find(f=>fs.existsSync(f)&&fs.statSync(f).isFile());
      if(!file&&!n.src.startsWith('data:'))unresolved=true;
      assets.push([n.src,file?treeSignature(file):digest(n.src)]);
    }
    Object.values(n).forEach(v=>Array.isArray(v)?v.forEach(visit):typeof v==='object'&&visit(v));
  };visit(printable.sections);
  if(unresolved)return null;
  return lean?signature({profile:'textbook-three-pass-v1',project:printable,renderer:runtime,fonts:assets,edition}):layoutVerificationKey(project,{renderer:runtime,fonts:assets,edition});
}
export function readLayoutCache(file,key,pdf){
  if(!key||!fs.existsSync(file)||!fs.existsSync(pdf))return null;
  try{
    const cached=JSON.parse(fs.readFileSync(file));
    return cached.key===key&&cached.passed===true&&cached.pdfHash===treeSignature(pdf)?cached.result:null;
  }catch{return null;}
}
export function writeLayoutCache(file,key,pdf,result){
  if(!key)return;
  fs.writeFileSync(file,JSON.stringify({key,passed:true,pdfHash:treeSignature(pdf),result},null,2));
}
