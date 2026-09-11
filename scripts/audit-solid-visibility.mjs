import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {coordinates,inspectSolid,repairSolid} from './lib/solid-audit.mjs';
export const solidHash=s=>createHash('sha256').update(s).digest('hex');
const evidence=new Set(['source','sourceReview','sourceAtom','sourceLayoutEvidence','originalDiagram','originalContent','before','after','mathematicalModel','spec','provenance']);
export function visitFigures(value,fn,location='',context='',review=null) {
  if(typeof value==='string'){
    const re=/\[tikz\]([\s\S]*?)\[\/tikz\]/g;let m,found=false;
    while((m=re.exec(value))){found=true;fn({code:m[1],location,index:m.index,inline:true,context,review});}
    if(!found&&/\\begin\{tikzpicture\}/.test(value)&&/\/code$/.test(location))fn({code:value,location,index:0,inline:false,context,review});
    return;
  }
  if(!value||typeof value!=='object')return;
  const local=[context,value.prompt,value.question_text,value.title,value.alt].filter(x=>typeof x==='string').join(' ').replace(/\[tikz\][\s\S]*?\[\/tikz\]/g,' ');
  if(value.format==='image'||value.type==='image')fn({image:value.src??value.attrs?.src,location,context:local,id:value.id});
  for(const[k,v]of Object.entries(value))if(!evidence.has(k))visitFigures(v,fn,location+'/'+k,local,value.solidReview??review);
}
export function solidAcceptance(value,reviews={}) {
  const issues=[];visitFigures(value,r=>{
    if(r.image){const hash=imageSourceHash(r.image),review=hash?reviews[hash]:null;if(!(review?.status==='accepted'&&review.reason?.trim()))issues.push({location:r.location,hash,status:'image-review',reason:'Retained image needs geometric and visual review bound to its asset hash'});return;}
    if(!r.code||!isSolidCandidate(r.code,r.context))return;
    const check=inspectSolid(r.code,{context:r.context}),hash=solidHash(r.code),review=r.review?.sourceHash===hash?r.review:reviews[hash];
    if(check.status==='defect'||(check.status==='review'&&!(review?.status==='accepted'&&review.reason?.trim())))issues.push({location:r.location,hash,...check});
  });return issues;
}
export function imageSourceHash(src,root=process.cwd()){
  if(typeof src!=='string'||!src.startsWith('/')||src.startsWith('//'))return null;
  const publicRoot=path.resolve(root,'public'),file=path.resolve(publicRoot,'.'+src);
  if(!file.startsWith(publicRoot+path.sep)||!fs.existsSync(file))return null;
  return solidHash(fs.readFileSync(file));
}
export function isSolidCandidate(code,context='') {
  if(/mathsmap-solid|tdplot|(?:prism|pyramid|cylinder|cone|sphere|cuboid|solid|3d|3-d)/i.test(context+' '+code))return true;
  if(/ellipse|x radius|y radius/.test(code))return true;
  const pts=[...coordinates(code).values()];if(pts.some(p=>p.length===3))return true;
  const offsets=new Map();
  for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){
    const dx=pts[j][0]-pts[i][0],dy=pts[j][1]-pts[i][1];if(Math.abs(dx)<1e-5||Math.abs(dy)<1e-5)continue;
    const key=[dx,dy].map(n=>n.toFixed(4)).join(',');offsets.set(key,(offsets.get(key)||0)+1);if(offsets.get(key)>=3)return true;
  }return false;
}
export function inventorySolids(root=process.cwd(),only=null) {
  const rows=[];
  for(const dir of ['public/content','public/quizzes','booklets/projects','booklets/question-bank']){
    for(const name of fs.readdirSync(path.join(root,dir)).filter(n=>n.endsWith('.json')&&n!=='manifest.json')){
      if(only&&dir.startsWith('public/')&&!only.has(name.slice(0,-5)))continue;
      if(only&&!dir.startsWith('public/'))continue;
      const file=dir+'/'+name,data=JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
      visitFigures(data,r=>{
        if(r.image){rows.push({...r,file,hash:imageSourceHash(r.image,root),status:'image-review'});return;}
        const hash=solidHash(r.code),candidate=isSolidCandidate(r.code,file+' '+r.context);
        rows.push({...r,file,hash,candidate,...(candidate?inspectSolid(r.code,{context:r.context}):{status:'2d'})});
      },'',file);
    }
  }return rows;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const arg=k=>{const i=process.argv.indexOf(k);return i<0?null:process.argv[i+1];},only=arg('--only');
  const rows=inventorySolids(arg('--root')??process.cwd(),only?new Set(only.split(',')):null);
  const reviewFile=arg('--reviews')??'booklets/provenance/solid-visibility-2026-09-12.json';
  const reviews=fs.existsSync(reviewFile)?JSON.parse(fs.readFileSync(reviewFile,'utf8')).reviews??{}:{};
  for(const r of rows)if(['review','image-review'].includes(r.status)&&r.hash&&reviews[r.hash]?.status==='accepted'&&reviews[r.hash]?.reason?.trim())r.status='reviewed';
  const counts=rows.reduce((s,r)=>(s[r.status]=(s[r.status]??0)+1,s),{});
  if(arg('--report')){fs.mkdirSync(path.dirname(arg('--report')),{recursive:true});fs.writeFileSync(arg('--report'),JSON.stringify({createdAt:new Date().toISOString(),counts,rows},null,2)+'\n');}
  for(const r of rows.filter(r=>['defect','review','image-review'].includes(r.status)))console.log(`✗ ${r.status==='defect'?'SOLID-VISIBILITY':'SOLID-REVIEW'} | ${r.file} ${r.location} | ${r.reason??r.issues?.map(i=>i.type+':'+(i.edge??'')).join(', ')??'Retained image requires a visibility review bound to its asset hash'}`);
  console.log(JSON.stringify(counts));
  if(process.argv.includes('--strict')&&rows.some(r=>['defect','review','image-review'].includes(r.status)))process.exitCode=1;
}
