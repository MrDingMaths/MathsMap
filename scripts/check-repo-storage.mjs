import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export function storageViolations(files, policy) {
  if (![policy.maxFileBytes,policy.maxTotalBytes,...Object.values(policy.fileLimits??{})].every(n=>Number.isSafeInteger(n)&&n>0)) throw Error('Invalid repository storage limits');
  const errors=[];
  for(const file of files) {
    if (/^(?:\.booklet-work|output|dist|node_modules|\.playwright-mcp|scratch|tmp)\//.test(file.path) || /^booklets\/(?:\.storage-archives|archives|projects\/\.revisions)\//.test(file.path)) errors.push('Local/generated file must not be committed: '+file.path);
    const limit=policy.fileLimits?.[file.path]??policy.maxFileBytes;
    if (file.bytes>limit) errors.push(`${file.path}: ${file.bytes} bytes exceeds reviewed limit ${limit}`);
  }
  const bytes=files.reduce((n,f)=>n+f.bytes,0);
  if(bytes>policy.maxTotalBytes) errors.push(`Tracked file budget exceeded: ${bytes} > ${policy.maxTotalBytes} bytes`);
  return {files:files.length,bytes,errors};
}
export function indexedFiles(root) {
  const git=(args,options={})=>execFileSync('git',args,{cwd:root,maxBuffer:32*1024**2,...options}).toString();
  const entries=git(['ls-files','--stage','-z']).split('\0').filter(Boolean).map(row=>{
    const tab=row.indexOf('\t'),[mode,hash,stage]=row.slice(0,tab).split(' ');
    if(stage!=='0') throw Error('Resolve merge conflicts before checking repository storage');
    return {path:row.slice(tab+1),hash,mode};
  });
  const sizes=git(['cat-file','--batch-check=%(objectsize)'],{input:entries.map(e=>e.hash).join('\n')+'\n'}).trim().split('\n');
  return entries.map((e,i)=>{
    const bytes=Number(sizes[i]);if(!Number.isSafeInteger(bytes))throw Error('Could not size indexed object: '+e.path);
    return {path:e.path,bytes};
  });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
  const policy=JSON.parse(fs.readFileSync(path.join(root,'booklets/storage-policy.json'),'utf8'));
  const files=indexedFiles(root),report=storageViolations(files,policy);
  console.log(JSON.stringify({...report,largeFiles:files.filter(f=>f.bytes>policy.maxFileBytes)},null,2));
  if(report.errors.length)process.exitCode=1;
}
