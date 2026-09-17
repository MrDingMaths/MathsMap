import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {layoutVerificationKey,verificationAssetSignatures} from '../../src/lib/booklet-content-verification.js';

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
export function rendererSignature(){
  return sourceDependencySignature()+treeSignature('public/libs')+treeSignature('node_modules/katex/dist/fonts')+treeSignature('scripts/booklet/pdf-layout-qa.mjs')+treeSignature('scripts/booklet/check-compact-exercises.mjs')+treeSignature('scripts/booklet/diagram-preflight.mjs')+treeSignature('package-lock.json')+treeSignature('scripts/booklet/pdf-navigation-qa.mjs');
}
export function implementationSignatures(){
 const group=files=>digest(JSON.stringify(files.map(file=>[file,treeSignature(file)])));
 return {authoring:group(['scripts/booklet/semantic-workflow.mjs','scripts/booklet/author-assignments.mjs','scripts/booklet/local-attempt-repair.mjs','scripts/booklet/assemble-semantic-packets.mjs']),
  assessment:group(['scripts/booklet/source-classification-review.mjs','scripts/booklet/import-project-bank.mjs','scripts/booklet/import-verification.mjs','src/lib/practice-question-model.js']),
  regression:group(['scripts/booklet','tests','package-lock.json']),build:group(['src','public/libs','package-lock.json','vite.config.js']),storage:group(['booklets/storage-policy.json','scripts/check-repo-storage.mjs'])};
}
export async function layoutCacheKey(project,edition,runtime){
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
  };visit(project.sections);
  return unresolved?null:layoutVerificationKey(project,{renderer:runtime,fonts:assets,edition});
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
