// Proposed bounded synchronous snapshot for the manual-delivery handoff only.
// No cache survives return. The existing validator still checks every predicate.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {rendererSignature,sourceDependencySignature} from './verification-cache.mjs';
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
let running=false;
const absolute=f=>{assert(typeof f==='string'||f instanceof URL,'Only named synchronous dependency reads are supported');return path.resolve(f instanceof URL?fileURLToPath(f):f);};
const key=f=>process.platform==='win32'?f.toLowerCase():f;
const below=(root,file)=>{const p=path.relative(root,file);return p===''||p&&!p.startsWith('..')&&!path.isAbsolute(p);};
export function withManualReadBoundary({runDir,implementationFile,expectedImplementation},work){
 assert(!running,'No nested/manual boundary or cross-operation reuse');assert(typeof work==='function');
 const original=Object.fromEntries(['readFileSync','existsSync','readdirSync','statSync','lstatSync'].map(k=>[k,fs[k]]));
 const cwd=process.cwd(),files=new Map(),existence=new Map(),directories=new Map(),stats=new Map(),createdRoots=[];
 let logicalReads=0,logicalBytes=0,closed=false;
 const raw=f=>original.readFileSync(f);
 const isOutput=f=>createdRoots.some(root=>below(root,f));
 const shape=s=>({file:s.isFile(),directory:s.isDirectory(),symlink:s.isSymbolicLink(),...(s.isFile()?{size:s.size,mtimeMs:s.mtimeMs}:{}),mode:s.mode});
 const listShape=xs=>xs.map(x=>typeof x==='string'?x:Buffer.isBuffer(x)?x.toString('hex'):{name:x.name,file:x.isFile(),directory:x.isDirectory(),symlink:x.isSymbolicLink()});
 running=true;
 fs.readFileSync=function(file,options){
  const f=absolute(file),k=key(f);let row=files.get(k);
  if(!row){const bytes=raw(f);row={path:f,bytes,hash:digest(bytes),realPath:fs.realpathSync(f)};files.set(k,row);}
  logicalReads++;logicalBytes+=row.bytes.length;
  const encoding=typeof options==='string'?options:options?.encoding;
  assert(!options||typeof options==='string'||!options.flag||options.flag==='r','Read-only file flags required');
  return encoding?row.bytes.toString(encoding):Buffer.from(row.bytes);
 };
 fs.existsSync=function(file){const f=absolute(file),value=original.existsSync(file),k=key(f);if(!existence.has(k))existence.set(k,{path:f,value});else if(!isOutput(f))assert.equal(value,existence.get(k).value,'Dependency existence changed during operation');return value;};
 fs.readdirSync=function(file,options){const f=absolute(file),value=original.readdirSync(file,options),k=key(f)+'|'+JSON.stringify(options??null),signature=digest(JSON.stringify(listShape(value)));if(!directories.has(k))directories.set(k,{path:f,options,signature});else assert.equal(signature,directories.get(k).signature,'Dependency directory changed during operation');return value;};
 for(const name of ['statSync','lstatSync'])fs[name]=function(file,options){const f=absolute(file),value=original[name](file,options);if(!value)return value;const k=name+'|'+key(f),summary=shape(value);if(!stats.has(k))stats.set(k,{name,path:f,options,summary});else if(!isOutput(f))assert.deepEqual(summary,stats.get(k).summary,'Dependency metadata changed during operation');return value;};
 const restore=()=>{for(const[k,v]of Object.entries(original))fs[k]=v;};
 try{
  // The active ownership and current export context are explicit boundary inputs.
  fs.readFileSync(path.join(runDir,'workflow/issues.json'));
  fs.readFileSync(path.join(runDir,'visual-review/queue.json'));
  const renderer=rendererSignature(),implementation=sourceDependencySignature(implementationFile);
  assert.equal(implementation,expectedImplementation,'Implementation changed since module load');
  const api={permitNewOutput(root){assert(!closed);const f=absolute(root);assert(!original.existsSync(f),'Only a genuinely new exception folder may be written');assert(![...files.values()].some(r=>below(f,r.path)),'An output may not contain an already read input');createdRoots.push(f);}};
  const value=work(api);assert(!value||typeof value.then!=='function','No root/model wait or Promise may cross the boundary');
  restore();closed=true;
  assert.equal(process.cwd(),cwd,'Working directory changed');
  let entryBytes=0,exitBytes=0;
  for(const r of files.values()){entryBytes+=r.bytes.length;const bytes=raw(r.path);exitBytes+=bytes.length;assert.equal(digest(bytes),r.hash,'Dependency bytes changed at exit: '+r.path);assert.equal(fs.realpathSync(r.path),r.realPath,'Dependency path changed at exit: '+r.path);}
  for(const r of existence.values())if(!isOutput(r.path))assert.equal(original.existsSync(r.path),r.value,'Dependency existence changed at exit: '+r.path);
  for(const r of directories.values())assert.equal(digest(JSON.stringify(listShape(original.readdirSync(r.path,r.options)))),r.signature,'Dependency directory changed at exit: '+r.path);
  for(const r of stats.values())if(!isOutput(r.path))assert.deepEqual(shape(original[r.name](r.path,r.options)),r.summary,'Dependency metadata changed at exit: '+r.path);
  assert.equal(rendererSignature(),renderer,'Renderer scope changed at exit');
  assert.equal(sourceDependencySignature(implementationFile),implementation,'Implementation scope changed at exit');
  return {value,measurement:{logicalReads,logicalBytes,uniqueReadFiles:files.size,entryBytes,exitBytes,existenceChecks:existence.size,directoryChecks:directories.size,metadataChecks:stats.size,renderer,implementation}};
 }finally{closed=true;restore();running=false;files.clear();existence.clear();directories.clear();stats.clear();}
}