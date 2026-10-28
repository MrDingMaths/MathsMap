import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const digest=file=>{const hash=createHash('sha256'),buffer=Buffer.allocUnsafe(1024*1024),fd=fs.openSync(file,'r');try{let count;while((count=fs.readSync(fd,buffer,0,buffer.length,null)))hash.update(buffer.subarray(0,count));return hash.digest('hex');}finally{fs.closeSync(fd);}};
const inside=(root,file)=>{const relative=path.relative(root,file);return relative===''||relative!=='..'&&!relative.startsWith('..'+path.sep)&&!path.isAbsolute(relative);};
const exists=file=>{try{fs.lstatSync(file);return true;}catch(error){if(error.code==='ENOENT')return false;throw error;}};

// Copy only the executables and one Chrome application revision, never a profile
// or browser registration cache. Existing pins cannot be overwritten.
export function copyFrozenEngines(snapshot,{nodeExecutable=process.execPath,browserExecutable,browserVersion}={}){
 snapshot=path.resolve(snapshot);nodeExecutable=path.resolve(nodeExecutable);
 if(typeof browserExecutable!=='string'||!browserExecutable.trim()||typeof browserVersion!=='string'||!/^\d+(?:\.\d+){1,4}$/.test(browserVersion))throw Error('Supply the installed Chrome executable and exact version directory');
 browserExecutable=path.resolve(browserExecutable);
 const application=path.dirname(browserExecutable),revision=path.join(application,browserVersion),engines=path.join(snapshot,'engines');
 if(inside(application,snapshot)||inside(snapshot,application)||inside(engines,nodeExecutable))throw Error('Frozen engines must be separate from installed engines');
 if(exists(engines))throw Error('Frozen engines already exist');
 for(const file of [nodeExecutable,browserExecutable])if(!fs.lstatSync(file).isFile()||fs.lstatSync(file).isSymbolicLink())throw Error('Engine executable must be a regular file: '+file);
 if(!fs.lstatSync(revision).isDirectory()||fs.lstatSync(revision).isSymbolicLink())throw Error('Chrome version directory must be a regular directory');
 fs.mkdirSync(snapshot,{recursive:true});
 if(fs.realpathSync(snapshot)!==snapshot)throw Error('Frozen snapshot must not contain symbolic links');
 const nodeTarget=path.join(engines,'node',path.basename(nodeExecutable)),browserTarget=path.join(engines,'chromium','Application',path.basename(browserExecutable)),files=[];
 const copy=(source,target)=>{
  const stat=fs.lstatSync(source);if(stat.isSymbolicLink())throw Error('Engine files must not be symbolic: '+source);
  if(stat.isDirectory()){
   fs.mkdirSync(target,{recursive:true});
   for(const name of fs.readdirSync(source).sort())if(name.toLowerCase()!=='installer')copy(path.join(source,name),path.join(target,name));
  }else if(stat.isFile()){
   const before=digest(source);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);fs.chmodSync(target,stat.mode&0o777);
   const hash=digest(target);if(hash!==before||digest(source)!==before)throw Error('Engine changed while copying: '+source);
   files.push({path:path.relative(snapshot,target).split(path.sep).join('/'),hash});
  }else throw Error('Unsupported engine file: '+source);
 };
 copy(nodeExecutable,nodeTarget);copy(browserExecutable,browserTarget);copy(revision,path.join(path.dirname(browserTarget),browserVersion));
 const fileHash=file=>files.find(row=>path.resolve(snapshot,row.path)===file).hash;
 return {node:{source:nodeExecutable,executable:nodeTarget,version:nodeExecutable===path.resolve(process.execPath)?process.version:null,hash:fileHash(nodeTarget)},browser:{source:browserExecutable,executable:browserTarget,version:browserVersion,hash:fileHash(browserTarget)},files};
}
