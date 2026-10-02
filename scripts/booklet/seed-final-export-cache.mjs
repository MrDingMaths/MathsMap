import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {rendererSignature,layoutCacheKey} from './verification-cache.mjs';
import {bytesHash} from './workflow-review.mjs';
import {isLeanReview} from '../../src/lib/booklet-review-profile.js';

const editions=['student','short','worked','with-short','with-worked'];
const profile='textbook-three-pass-v1';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const inside=(root,file)=>{const relative=path.relative(root,file);return relative!==''&&relative!=='..'&&!relative.startsWith('..'+path.sep)&&!path.isAbsolute(relative);};

export function finalExportOutput({out,runDir,development=false,draft=false,preflight=false,now=Date.now()}){
 return out??(runDir&&!development&&!draft&&!preflight?path.join(path.resolve(runDir),'final-exports-'+now):'.booklet-work/compact-exercises');
}

export function finalExportIneligibility({manifest,edition,renderer,printableKey,pdfHash}={}){
 if(manifest?.passed!==true||manifest.mode!=='full')return 'not-passed-full-export';
 if(manifest.reviewProfile!==profile||manifest.edition!==edition)return 'edition-or-policy-changed';
 if(manifest.renderer!==renderer)return 'renderer-changed';
 if(!printableKey||manifest.printableKey!==printableKey)return 'printable-dependencies-changed';
 if(manifest.pdf?.hash!==pdfHash||!/^([a-f0-9]{64})$/i.test(pdfHash??''))return 'pdf-bytes-changed';
 return null;
}

export function isEligibleFinalExport({manifest,edition,renderer,printableKey,pdfHash}={}){
 return editions.includes(edition)&&typeof renderer==='string'&&renderer.length>0&&typeof printableKey==='string'&&printableKey.length>0&&
  manifest?.passed===true&&manifest.mode==='full'&&manifest.reviewProfile===profile&&manifest.edition===edition&&
  manifest.renderer===renderer&&manifest.printableKey===printableKey&&typeof manifest.pdf?.hash==='string'&&
  /^[a-f0-9]{64}$/i.test(manifest.pdf.hash)&&manifest.pdf.hash===pdfHash;
}

function checkedPath(file,{missing=false}={}){
 const absolute=path.resolve(file);let current=absolute;
 while(true){
  try{if(fs.lstatSync(current).isSymbolicLink())throw Error('Symbolic filesystem path rejected: '+current);}
  catch(error){if(!(missing&&error.code==='ENOENT'))throw error;}
  const parent=path.dirname(current);if(parent===current)break;current=parent;
 }
 return absolute;
}
function snapshot(file){
 file=checkedPath(file);const before=fs.lstatSync(file);
 if(!before.isFile())throw Error('Expected a regular file: '+file);
 const fd=fs.openSync(file,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW??0));
 try{
  const opened=fs.fstatSync(fd);if(opened.dev!==before.dev||opened.ino!==before.ino)throw Error('File changed while opening: '+file);
  const bytes=fs.readFileSync(fd),after=fs.fstatSync(fd),hash=digest(bytes);
  if(after.size!==opened.size||after.mtimeMs!==opened.mtimeMs||after.ctimeMs!==opened.ctimeMs)throw Error('File changed while reading: '+file);
  if(bytesHash(checkedPath(file))!==hash)throw Error('File changed while hashing: '+file);
  return {file,bytes,hash};
 }finally{fs.closeSync(fd);}
}
function unchanged(records){
 for(const record of records)if(snapshot(record.file).hash!==record.hash)throw Error('Seeding dependency changed: '+record.file);
}
function createExclusive(file,bytes,created){
 checkedPath(file,{missing:true});const fd=fs.openSync(file,'wx');
 try{const stat=fs.fstatSync(fd);created.push({file,dev:stat.dev,ino:stat.ino});fs.writeFileSync(fd,bytes);}
 finally{fs.closeSync(fd);}
 if(bytesHash(checkedPath(file))!==digest(bytes))throw Error('Copied bytes do not match: '+file);
}
function rollback(created){
 const errors=[];
 for(const record of [...created].reverse())try{
  checkedPath(record.file);const stat=fs.lstatSync(record.file);
  if(stat.dev!==record.dev||stat.ino!==record.ino)throw Error('Refusing to remove a replaced output: '+record.file);
  fs.unlinkSync(record.file);
 }catch(error){if(error.code!=='ENOENT')errors.push(error.message);}
 return errors;
}

export async function seedUnchangedFinalExports({runDir,projectFile,out,onDecision=()=>{}}){
 runDir=checkedPath(runDir);projectFile=checkedPath(projectFile);out=checkedPath(out,{missing:true});
 if(!fs.statSync(runDir).isDirectory()||path.dirname(out)!==runDir||!path.basename(out).startsWith('final-exports-'))throw Error('Output must be a direct final-exports-* directory inside the run');
 const projectSource=snapshot(projectFile),project=JSON.parse(projectSource.bytes.toString('utf8'));
 if(!isLeanReview(project))throw Error('Final export seeding requires the recorded three-pass project profile');
 if(typeof project.id!=='string'||!/^[a-z0-9][a-z0-9._-]*$/i.test(project.id))throw Error('Unsafe project filename identity');
 fs.mkdirSync(out,{recursive:true});checkedPath(out);
 if(!fs.statSync(out).isDirectory())throw Error('Expected an output directory');
 const lock=path.join(out,'.seed-final-export-cache.lock'),lockFiles=[];
 createExclusive(lock,Buffer.from(randomUUID()),lockFiles);
 const created=[];
 try{
  const receiptFile=path.join(out,'unchanged-export-seeds.json');
  const oldReceipt=fs.existsSync(receiptFile)?snapshot(receiptFile):null;
  const prior=oldReceipt?JSON.parse(oldReceipt.bytes.toString('utf8')):{seeded:[]};
  if(!Array.isArray(prior.seeded))throw Error('Invalid existing seed receipt');
  const renderer=rendererSignature({lean:true});
  const dirs=fs.readdirSync(runDir,{withFileTypes:true}).filter(entry=>entry.isDirectory()&&entry.name.startsWith('final-exports-')&&path.join(runDir,entry.name)!==out)
   .map(entry=>path.join(runDir,entry.name)).filter(dir=>{try{checkedPath(dir);return true;}catch{return false;}})
   .sort((a,b)=>fs.statSync(b).mtimeMs-fs.statSync(a).mtimeMs||a.localeCompare(b));
  const plans=[],decisions=[];
  for(const edition of editions){
   const stem=project.id+'-'+edition,target=path.join(out,stem+'.full.pages.json'),pdf=path.join(out,stem+'.pdf'),cache=path.join(out,stem+'.verification.json');
   if([target,pdf,cache].some(file=>{try{fs.lstatSync(file);return true;}catch(error){if(error.code==='ENOENT')return false;throw error;}})){decisions.push({edition,reason:'target-present'});continue;}
   const key=await layoutCacheKey(project,edition,renderer);if(!key){decisions.push({edition,reason:'unresolved-printable-dependencies'});continue;}
   const candidates=[];let selected=false;
   for(const dir of dirs)try{
    const sourceManifest=snapshot(path.join(dir,stem+'.full.pages.json')),manifest=JSON.parse(sourceManifest.bytes.toString('utf8'));
    const sourcePdf=path.join(dir,stem+'.pdf');
    if(typeof manifest.pdf?.path!=='string'||path.resolve(manifest.pdf.path)!==sourcePdf||!inside(dir,sourcePdf)){candidates.push({directory:dir,reason:'unsafe-pdf-path'});continue;}
    const pdfSource=snapshot(sourcePdf);
    if(!isEligibleFinalExport({manifest,edition,renderer,printableKey:key,pdfHash:pdfSource.hash})){candidates.push({directory:dir,reason:finalExportIneligibility({manifest,edition,renderer,printableKey:key,pdfHash:pdfSource.hash})??'invalid-export'});continue;}
    let cacheSource=null;
    try{
     const candidate=snapshot(path.join(dir,stem+'.verification.json')),value=JSON.parse(candidate.bytes.toString('utf8'));
     if(value.key===key&&value.passed===true&&value.pdfHash===pdfSource.hash&&Object.hasOwn(value,'result'))cacheSource=candidate;
    }catch{}
    plans.push({edition,key,target,pdf,cache,sourceManifest,pdfSource,cacheSource,manifest});selected=true;break;
   }catch(error){candidates.push({directory:dir,reason:error.code==='ENOENT'?'missing-artifact':'unreadable-or-invalid-artifact'});continue;}
   decisions.push({edition,reason:selected?'seeded':dirs.length?'no-compatible-export':'no-retained-export',candidates});
  }
  if(!plans.length){decisions.forEach(onDecision);return [];}
  const dependencies=[projectSource,...plans.flatMap(plan=>[plan.sourceManifest,plan.pdfSource,...(plan.cacheSource?[plan.cacheSource]:[])])];
  async function validate(){
   checkedPath(runDir);checkedPath(out);unchanged(dependencies);
   if(rendererSignature({lean:true})!==renderer)throw Error('Renderer changed during final export seeding');
   for(const plan of plans)if(await layoutCacheKey(project,plan.edition,renderer)!==plan.key)throw Error('Printable dependencies changed during final export seeding: '+plan.edition);
   unchanged(dependencies);
  }
  await validate();
  const seeded=[];
  for(const plan of plans){
   createExclusive(plan.pdf,plan.pdfSource.bytes,created);
   if(plan.cacheSource)createExclusive(plan.cache,plan.cacheSource.bytes,created);
   const manifest={...plan.manifest,pdf:{...plan.manifest.pdf,path:plan.pdf}};
   createExclusive(plan.target,Buffer.from(JSON.stringify(manifest,null,2)+'\n'),created);
   seeded.push({edition:plan.edition,originalManifest:{path:plan.sourceManifest.file,hash:plan.sourceManifest.hash},seededManifest:{path:plan.target,hash:bytesHash(plan.target)},pdfHash:plan.pdfSource.hash,printableKey:plan.key,renderer,inspectionCredited:false,...(plan.cacheSource?{originalCache:{path:plan.cacheSource.file,hash:plan.cacheSource.hash}}:{}),note:'Exact current printable key, renderer, edition and retained PDF bytes match a passed full export. The checker determines actual reuse; no visual acceptance is created.'});
  }
  await validate();
  for(const entry of seeded){if(bytesHash(checkedPath(path.join(out,project.id+'-'+entry.edition+'.pdf')))!==entry.pdfHash||bytesHash(checkedPath(entry.seededManifest.path))!==entry.seededManifest.hash)throw Error('Seeded output changed before receipt');}
  for(const plan of plans)if(plan.cacheSource&&bytesHash(checkedPath(plan.cache))!==plan.cacheSource.hash)throw Error('Seeded verification cache changed before receipt');
  if(oldReceipt)unchanged([oldReceipt]);else{try{fs.lstatSync(receiptFile);throw Error('Seed receipt appeared concurrently');}catch(error){if(error.code!=='ENOENT')throw error;}}
  const temporary=path.join(out,'.unchanged-export-seeds-'+randomUUID()+'.json'),receiptFiles=[];
  try{
   createExclusive(temporary,Buffer.from(JSON.stringify({...prior,at:new Date().toISOString(),seeded:[...prior.seeded,...seeded]},null,2)+'\n'),receiptFiles);
   checkedPath(receiptFile,{missing:true});if(oldReceipt)unchanged([oldReceipt]);
   fs.renameSync(temporary,receiptFile);
  }catch(error){error.receiptCleanupErrors=rollback(receiptFiles);throw error;}
  decisions.forEach(onDecision);return seeded;
 }catch(error){error.rollbackErrors=rollback(created);throw error;}
 finally{const errors=rollback(lockFiles);if(errors.length)throw Error('Seed lock cleanup failed: '+errors.join('; '));}
}
