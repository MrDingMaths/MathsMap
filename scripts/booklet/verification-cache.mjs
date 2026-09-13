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
// Include renderer dependencies and fonts, not just the project presentation.
// This is deliberately conservative: a runtime change forces a fresh layout check.
export function rendererSignature(){
  return treeSignature('src')+treeSignature('public/libs')+treeSignature('node_modules/katex/dist/fonts')+treeSignature('scripts/booklet/pdf-layout-qa.mjs')+treeSignature('scripts/booklet/check-compact-exercises.mjs')+treeSignature('scripts/booklet/diagram-preflight.mjs')+treeSignature('package-lock.json');
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
