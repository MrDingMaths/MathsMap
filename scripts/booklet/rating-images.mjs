import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

export function ratingImageReferences(value){
 const found=new Set();
 const visit=node=>{
  if(typeof node==='string'){
   if(/^data:image\/(?:png|jpe?g|webp);base64,/i.test(node)||/\.(?:png|jpe?g|webp)(?:[?#].*)?$/i.test(node)&&!node.includes('\n'))found.add(node);
  }else if(node&&typeof node==='object')for(const child of Object.values(node))visit(child);
 };
 visit(value);return [...found];
}
// Supply original pixels directly. Read-only model tools need not open local
// image paths, which some worker policies correctly do not expose as tools.
export function ratingImageEvidence(rows,{root,out}){
 const byFile=new Map(),base=path.resolve(root),inside=file=>file===base||file.startsWith(base+path.sep);
 for(const row of rows)for(const reference of ratingImageReferences(row.input.task)){
  let file;
  const data=/^data:image\/(png|jpe?g|webp);base64,(.*)$/is.exec(reference);
  if(data){const bytes=Buffer.from(data[2],'base64'),hash=createHash('sha256').update(bytes).digest('hex');file=path.resolve(out,'images',hash+'.'+(data[1].toLowerCase().startsWith('jp')?'jpg':data[1].toLowerCase()));fs.mkdirSync(path.dirname(file),{recursive:true});if(!fs.existsSync(file))fs.writeFileSync(file,bytes);}
  else{
   let name=reference;
   try{if(/^https?:/i.test(name))name=new URL(name).pathname;name=decodeURIComponent(name.split(/[?#]/)[0]);}catch{continue;}
   const served=/^\/__booklet\/full-imports\/([\w.-]+)\/files\/(.+)$/.exec(name);
   if(served)file=path.resolve(base,'.booklet-work/full-imports',served[1],served[2]);
   else if(name.startsWith('/'))file=path.resolve(base,'public',name.slice(1));
   else file=path.isAbsolute(name)?path.resolve(name):path.resolve(base,name);
   if(!inside(file)||!fs.existsSync(file)||!fs.statSync(file).isFile())continue;
   if(!inside(fs.realpathSync(file)))continue;
  }
  if(!byFile.has(file))byFile.set(file,{path:file,questionIds:[]});
  const item=byFile.get(file);if(!item.questionIds.includes(row.block.id))item.questionIds.push(row.block.id);
 }
 const evidence=[...byFile.values()];return {images:evidence.map(row=>row.path),evidence};
}
