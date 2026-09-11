// Exact, reviewed repairs. Dry-run is the default; all guards precede writes.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {solidHash,visitFigures} from './audit-solid-visibility.mjs';
import {normaliseDiagramColours} from './booklet/normalise-diagram-colours.mjs';
import {writeTransaction} from './booklet/bank-sync.mjs';

export function repairValue(value,repairs){
  const next=structuredClone(value),figures=[];visitFigures(next,r=>{if(r.code)figures.push(r);});
  const records=[];
  for(const repair of repairs){
    const found=figures.filter(r=>r.location===repair.location)[repair.occurrence];
    if(!found)throw Error('Missing diagram: '+repair.location+' #'+repair.occurrence);
    const hash=solidHash(found.code);
    if(hash===repair.afterHash)continue;
    if(hash!==repair.beforeHash&&!repair.acceptedIntermediateHashes?.includes(hash))throw Error('Conflicting diagram edit: '+repair.location+' #'+repair.occurrence);
    if(solidHash(repair.afterCode)!==repair.afterHash)throw Error('Corrupt repair payload');
    if(repair.review?.status!=='accepted')throw Error('Repair has not passed visual review');
    records.push({...found,afterCode:repair.afterCode,before:hash,after:repair.afterHash});
  }
  for(const r of [...records].sort((a,b)=>b.index-a.index)){
    const keys=r.location.split('/').slice(1),key=keys.pop(),parent=keys.reduce((v,k)=>v[k],next);
    if(r.inline){const start=r.index+6;parent[key]=parent[key].slice(0,start)+r.afterCode+parent[key].slice(start+r.code.length);}
    else parent[key]=r.afterCode;
  }
  return {next,records};
}

export async function applySolidRepairs({root=process.cwd(),register='booklets/provenance/solid-visibility-2026-09-12.json',apply=false}={}){
  const startedAt=new Date().toISOString(),ledger=JSON.parse(await fs.readFile(path.resolve(root,register),'utf8')),byFile=new Map();
  for(const repair of ledger.corrections){
    if(!/^(?:public\/(?:content|quizzes)|booklets\/(?:projects|question-bank))\/[^/]+\.json$/.test(repair.file))throw Error('Unexpected repair target');
    if(!byFile.has(repair.file))byFile.set(repair.file,[]);byFile.get(repair.file).push(repair);
  }
  const staged=[],originals=new Map(),report={startedAt,apply,changes:0,files:[],booklets:null};
  // Complete preflight for both public content and booklet/bank records.
  for(const [file,repairs]of byFile){
    const absolute=path.resolve(root,file),raw=await fs.readFile(absolute,'utf8'),data=JSON.parse(raw),result=repairValue(data,repairs);
    originals.set(absolute,raw);if(!result.records.length)continue;
    report.changes+=result.records.length;report.files.push({file,diagrams:result.records.length,beforeHash:solidHash(raw)});
    if(file.startsWith('public/'))staged.push([absolute,result.next]);
  }
  const bookRepairs=ledger.corrections.filter(r=>r.file.startsWith('booklets/'));
  if(bookRepairs.length){
    const migrate=value=>{
      const file=value.sections?'booklets/projects/'+value.id+'.json':'booklets/question-bank/'+value.id+'.json';
      return repairValue(value,byFile.get(file)??[]);
    };
    report.booklets=await normaliseDiagramColours({apply,root,migrate,policy:'Reviewed 3D visibility corrections; preserve source evidence, layout and mathematical content'});
  }else report.booklets={files:0,reason:'Inventory found no confirmed active project/bank visibility defect; no revisions or layouts changed.'};
  if(apply&&staged.length){
    for(const [absolute]of staged)if(await fs.readFile(absolute,'utf8')!==originals.get(absolute))throw Error('Content changed during preflight: '+absolute);
    const evidence=path.join(root,'.booklet-work/solid-visibility/originals');
    for(const [absolute]of staged){const relative=path.relative(root,absolute),target=path.join(evidence,relative);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,originals.get(absolute),{flag:'wx'}).catch(e=>{if(e.code!=='EEXIST')throw e;});}
    await writeTransaction(staged);
  }
  report.finishedAt=new Date().toISOString();return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const arg=k=>{const i=process.argv.indexOf(k);return i<0?undefined:process.argv[i+1];};
  const report=await applySolidRepairs({apply:process.argv.includes('--apply'),root:arg('--root'),register:arg('--register')});
  if(arg('--report'))await fs.writeFile(arg('--report'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
}
