import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const digest=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const inside=(root,file)=>{const relative=path.relative(root,file);return relative===''||relative!=='..'&&!relative.startsWith('..'+path.sep)&&!path.isAbsolute(relative);};
const portable=file=>file.split(path.sep).join('/');
const skipped=name=>['node_modules','.bin','.vite','.cache','.git','.npmrc','.yarnrc','.yarnrc.yml'].includes(name)||name==='.env'||name.startsWith('.env.');
const packageName=name=>{if(typeof name!=='string'||! /^(?:@[a-zA-Z0-9_.-]+\/)?[a-zA-Z0-9_.-]+$/.test(name)||name.split('/').some(p=>p==='.'||p==='..'))throw Error('Invalid dependency name: '+name);return name;};
const readPackage=directory=>JSON.parse(fs.readFileSync(path.join(directory,'package.json'),'utf8'));

// Resolve installed directories rather than package exports: package.json may be
// private, and a dependency may have a different installed version below a parent.
function installed(name,from,root,modules,{optional=false}={}){
 packageName(name);
 for(let directory=from;inside(root,directory)||inside(modules,directory);directory=path.dirname(directory)){
  if(path.basename(directory)!=='node_modules'){
   const lexical=path.join(directory,'node_modules',name);
   if(fs.existsSync(lexical)){
    const real=fs.realpathSync(lexical);
    if(!inside(modules,real))throw Error('Dependency symlink escapes node_modules: '+name);
    if(!fs.statSync(real).isDirectory()||!fs.existsSync(path.join(real,'package.json')))throw Error('Installed dependency has no package.json: '+name);
    const metadata=path.join(real,'package.json');
    if(!inside(real,fs.realpathSync(metadata)))throw Error('Dependency package.json escapes its package: '+name);
    const manifestBytes=fs.readFileSync(metadata);
    return {name,lexical,real,manifest:JSON.parse(manifestBytes),manifestHash:createHash('sha256').update(manifestBytes).digest('hex')};
   }
  }
  if(directory===root)break;
 }
 if(!optional)throw Error('Missing required installed dependency '+name+' from '+from);
 return null;
}

/** Copy the declared installed dependency closure. The destination node_modules
 * must be absent; every output is a regular file/directory, never a host link.
 * roots optionally selects package names for small isolated fixtures. */
export function copyFrozenDependencies(root,snapshot,{roots}={}){
 root=fs.realpathSync(path.resolve(root));snapshot=path.resolve(snapshot);
 const sourceModules=path.join(root,'node_modules'),modules=fs.realpathSync(sourceModules),targetModules=path.join(snapshot,'node_modules');
 if(inside(modules,snapshot)||inside(snapshot,modules))throw Error('Frozen dependencies must be separate from installed dependencies');
 if(existsLink(targetModules))throw Error('Frozen node_modules already exists');
 fs.mkdirSync(snapshot,{recursive:true});
 if(path.relative(fs.realpathSync(snapshot),snapshot)!=='')throw Error('Frozen snapshot path must not contain symbolic links');
 const declared=roots?Object.fromEntries(roots.map(name=>[packageName(name),false])):rootDependencies(readPackage(root));
 const queue=[],byTarget=new Map(),packages=[],files=[];
 const add=(dependency,target)=>{
  target=path.resolve(target);
  if(!inside(targetModules,target))throw Error('Dependency destination escapes frozen node_modules');
  const prior=byTarget.get(target);
  if(prior){if(prior.real!==dependency.real)throw Error('Conflicting installed dependency at '+target);return;}
  const row={...dependency,target};byTarget.set(target,row);queue.push(row);
 };
 for(const [name,optional]of Object.entries(declared)){
  const dependency=installed(name,root,root,modules,{optional});
  if(dependency)add(dependency,path.join(targetModules,name));
 }
 fs.mkdirSync(targetModules,{recursive:true});
 for(let index=0;index<queue.length;index++){
  const dependency=queue[index],{real,target,manifest}=dependency;
  packages.push({name:dependency.name,version:manifest.version??null,path:portable(path.relative(snapshot,target))});
  const walk=(source,destination,ancestors=new Set())=>{
   const resolved=fs.realpathSync(source);
   if(!inside(real,resolved))throw Error('Dependency file symlink escapes its package: '+portable(path.relative(real,source)));
   const stat=fs.statSync(resolved);
   if(stat.isDirectory()){
    if(ancestors.has(resolved))throw Error('Cyclic dependency file symlink: '+source);
    const next=new Set([...ancestors,resolved]);fs.mkdirSync(destination,{recursive:true});
    for(const name of fs.readdirSync(resolved).sort())if(!skipped(name))walk(path.join(resolved,name),path.join(destination,name),next);
   }else if(stat.isFile()){
    const before=digest(resolved);fs.copyFileSync(resolved,destination);fs.chmodSync(destination,stat.mode&0o777);
    const copied=digest(destination);
    if(before!==copied||digest(resolved)!==before)throw Error('Dependency changed while copying: '+source);
    files.push({path:portable(path.relative(snapshot,destination)),hash:copied});
   }else throw Error('Unsupported dependency file type: '+source);
  };
  if(digest(path.join(real,'package.json'))!==dependency.manifestHash)throw Error('Dependency manifest changed while copying: '+dependency.name);
  walk(real,target);
  if(digest(path.join(real,'package.json'))!==dependency.manifestHash)throw Error('Dependency manifest changed while copying: '+dependency.name);
  const required={...(manifest.dependencies??{})},optional=manifest.optionalDependencies??{};
  for(const name of Object.keys(optional))delete required[name];
  const edges=new Map([...Object.keys(required).map(name=>[name,false]),...Object.keys(optional).map(name=>[name,true]),...Object.keys(manifest.peerDependencies??{}).filter(name=>!Object.hasOwn(required,name)&&!Object.hasOwn(optional,name)).map(name=>[name,true])]);
  for(const [name,isOptional]of edges){
   const child=installed(name,real,root,modules,{optional:isOptional});if(!child)continue;
   // Ordinary npm hoisting/nesting keeps its exact node_modules location. A
   // materialized package link (e.g. a store-backed install) gets an equivalent
   // lexical local dependency slot, retaining the actually resolved version.
   let childTarget;
   if(path.resolve(child.lexical)===path.join(modules,name))childTarget=path.join(targetModules,name);
   else{
    const ancestor=queue.filter(row=>inside(row.real,child.lexical)&&inside(row.target,target)).sort((a,b)=>b.real.length-a.real.length)[0];
    childTarget=ancestor?path.join(ancestor.target,path.relative(ancestor.real,child.lexical)):path.join(target,'node_modules',name);
   }
   // Cycles can reuse only the same package at a location Node can actually
   // resolve from this importer; a global seen-set would lose nested versions.
   let existing;
   for(let directory=target;inside(snapshot,directory);directory=path.dirname(directory)){
    if(path.basename(directory)!=='node_modules'){
     const candidate=byTarget.get(path.join(directory,'node_modules',name));
     if(candidate){existing=candidate;break;}
    }
    if(directory===snapshot)break;
   }
   if(existing?.real===child.real)continue;
   add(child,childTarget);
  }
 }
 return {version:1,packages:packages.sort((a,b)=>a.path.localeCompare(b.path)),files:files.sort((a,b)=>a.path.localeCompare(b.path))};
}
function existsLink(file){try{fs.lstatSync(file);return true;}catch(error){if(error.code==='ENOENT')return false;throw error;}}
function rootDependencies(manifest){
 const result=Object.assign(Object.create(null),Object.fromEntries(Object.keys({...manifest.dependencies,...manifest.devDependencies}).map(name=>[packageName(name),false])));
 for(const name of Object.keys(manifest.optionalDependencies??{}))result[packageName(name)]=true;
 return result;
}

/** Verify actual frozen bytes, including unexpected files and forbidden links. */
export function frozenDependencyDifferences(snapshot,manifest){
 snapshot=path.resolve(snapshot);const directory=path.join(snapshot,'node_modules'),expected=new Map(),actual=new Map(),differences=new Set();
 if(manifest?.version!==1||!Array.isArray(manifest.files))throw Error('Invalid frozen dependency manifest');
 if(existsLink(snapshot)&&path.relative(fs.realpathSync(snapshot),snapshot)!=='')return ['node_modules'];
 for(const row of manifest.files){
  const file=path.resolve(snapshot,row.path??'');
  if(typeof row.path!=='string'||!row.path.startsWith('node_modules/')||!inside(directory,file)||expected.has(row.path)||! /^[a-f0-9]{64}$/.test(row.hash??''))throw Error('Invalid frozen dependency manifest path/hash');
  expected.set(row.path,row.hash);
 }
 const walk=file=>{
  const relative=portable(path.relative(snapshot,file));
  const stat=fs.lstatSync(file);
  if(stat.isSymbolicLink()){differences.add(relative);return;}
  if(stat.isDirectory())for(const name of fs.readdirSync(file).sort())walk(path.join(file,name));
  else if(stat.isFile())actual.set(relative,digest(file));else differences.add(relative);
 };
 if(existsLink(directory))walk(directory);else differences.add('node_modules');
 for(const [file,hash]of expected)if(actual.get(file)!==hash)differences.add(file);
 for(const file of actual.keys())if(!expected.has(file))differences.add(file);
 return [...differences].sort();
}
export function verifyFrozenDependencies(snapshot,manifest){
 const differences=frozenDependencyDifferences(snapshot,manifest);
 if(differences.length)throw Error('Frozen dependencies changed: '+differences.join(', '));
 return true;
}
