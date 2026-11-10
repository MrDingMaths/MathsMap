// One publication path for programme saves, replacing per-save publish/prove
// scripts. Dry run by default: it validates the candidate, names the changed
// blocks and any bank writes, and saves nothing. --apply saves through Studio's
// shared queue with the expected revision (a concurrent edit is refused, never
// overwritten), reads the file back and appends one ledger row.
//   node scripts/booklet/publish-project.mjs --candidate FILE --expected-revision N
//     [--apply] [--allow-bank] [--record FILE] [--ledger FILE] [--note TEXT]
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {prepareProjectWrite} from './project-studio-server.mjs';
import {saveThroughStudio} from '../../polish/run.mjs';
import {structuralPreflight} from './feedback-preflight.mjs';

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const blocksOf=project=>new Map((project.sections??[]).flatMap(s=>(s.blocks??[]).map(b=>[b.id,b])));
// Timestamps are set by the save itself; everything else must match exactly.
const withoutStamps=project=>{const copy=structuredClone(project);delete copy.revision;delete copy.updatedAt;delete copy.createdAt;return copy;};

const withoutBankSaveStamp=bank=>{const copy=structuredClone(bank);delete copy.updatedAt;return copy;};
export function assertPublisherReadback({readback,saved,prepared,expectedRevision,root,readBank=read}){
 if(readback.revision!==expectedRevision+1)throw Error('Readback revision differs from expected save');
 if(hash(readback)!==hash(saved))throw Error('Disk readback differs from Studio returned project');
 const expected=structuredClone(prepared.project),bankRoot=path.resolve(root,'booklets/question-bank');
 function visit(before,after){
  if(!before||typeof before!=='object'||!after||typeof after!=='object')return;
  if(before.bankRef?.revision!==after.bankRef?.revision&&before.bankRef&&after.bankRef){
   const id=before.bankRef.id;
   if(typeof id!=='string'||!/^[a-zA-Z0-9._-]+$/.test(id)||id==='.'||id==='..'||after.bankRef.id!==id)throw Error('Unexpected bank reference identity');
   const bankFile=path.join(bankRoot,id+'.json');
   const entry=prepared.entries.find(([file])=>path.resolve(file)===bankFile);
   if(!entry)throw Error('Unprepared bank revision refresh');
   const planned=entry[1],actual=readBank(bankFile);
   if(planned.id!==id||actual.id!==id||before.bankRef.revision!==hash(planned)||after.bankRef.revision!==hash(actual))throw Error('Bank revision does not bind exact prepared/actual record');
   if(typeof planned.updatedAt!=='string'||typeof actual.updatedAt!=='string'||!Number.isFinite(Date.parse(planned.updatedAt))||!Number.isFinite(Date.parse(actual.updatedAt)))throw Error('Invalid bank save timestamp');
   // Separate preparation and save timestamps change the full bank revision.
   // Every other bank field, and every other project field, must remain exact.
   if(hash(withoutBankSaveStamp(planned))!==hash(withoutBankSaveStamp(actual)))throw Error('Actual bank content differs from prepared transaction');
   before.bankRef.revision=after.bankRef.revision;
  }
  for(const key of Object.keys(before))if(key!=='bankRef')visit(before[key],after[key]);
 }
 visit(expected,saved);
 if(hash(withoutStamps(expected))!==hash(withoutStamps(saved)))throw Error('Saved project differs from prepared candidate');
 return true;
}

export function publicationDiff(before,after){
 const old=blocksOf(before),now=blocksOf(after);
 const order=project=>(project.sections??[]).map(s=>[s.id,(s.blocks??[]).map(b=>b.id)]);
 return {
  added:[...now.keys()].filter(id=>!old.has(id)),
  removed:[...old.keys()].filter(id=>!now.has(id)),
  changed:[...now.keys()].filter(id=>old.has(id)&&hash(old.get(id))!==hash(now.get(id))),
  reordered:hash(order(before))!==hash(order(after)),
  flags:{before:before.studio?.flags?.length??0,after:after.studio?.flags?.length??0},
  otherFields:Object.keys({...before,...after}).filter(key=>!['sections','studio','revision','updatedAt'].includes(key)&&hash(before[key]??null)!==hash(after[key]??null)),
 };
}

// A saved arrangement that names content the block no longer has prints that block wrongly and fails the
// page check the next time anyone edits it. Edits that moved or removed content without updating both
// arrangement copies left 89 such refs in 22 booklets (11 November 2026). A save may not add one; refs the
// live booklet already has are left for their own repair.
export function newMissingArrangementRefs(before,candidate){
 const key=i=>i.blockId+'|'+i.path+'|'+i.ref,missing=p=>structuralPreflight(p).issues.filter(i=>i.kind==='missing-arrangement-ref');
 const had=new Set(missing(before).map(key));
 return missing(candidate).filter(i=>!had.has(key(i)));
}

export async function publishProject({candidateFile,expectedRevision,apply=false,allowBank=false,record,ledger,note,root=process.cwd(),save=saveThroughStudio}){
 const candidate=read(candidateFile),liveFile=path.join(root,'booklets/projects',candidate.id+'.json');
 if(!/^[a-zA-Z0-9._-]+$/.test(candidate.id??''))throw Error('Candidate has no valid project id');
 if(!Number.isSafeInteger(expectedRevision))throw Error('--expected-revision N is required');
 const before=read(liveFile);
 if(before.revision!==expectedRevision)throw Error(`Live revision is ${before.revision}, not ${expectedRevision}: rebuild the candidate on the current booklet`);
 const dangling=newMissingArrangementRefs(before,candidate);
 if(dangling.length)throw Object.assign(Error('This save would leave saved arrangements naming content that is not there; rename or drop these refs in both arrangement copies first: '+dangling.map(i=>i.blockId+' '+i.ref).join(', ')),{dangling});
 const prepared=await prepareProjectWrite(before,candidate,{checkpoint:false,projectRoot:path.join(root,'booklets/projects'),bankRoot:path.join(root,'booklets/question-bank')});
 const bankWrites=prepared.entries.map(([file])=>path.relative(root,file).replaceAll('\\','/')).filter(file=>file.includes('question-bank'));
 const summary={projectId:candidate.id,from:expectedRevision,to:expectedRevision+1,diff:publicationDiff(before,candidate),bankWrites,note:note??null};
 if(bankWrites.length&&!allowBank)throw Error('This save would write the question bank ('+bankWrites.length+' files); pass --allow-bank only for an intended bank change');
 if(!apply)return {...summary,dryRun:true};
 if(record&&fs.existsSync(record))throw Error('Publication record already exists; reconcile it before retrying: '+record);
 const saved=await save(candidate,{expectedRevision});
 const readback=read(liveFile);
 assertPublisherReadback({readback,saved,prepared,expectedRevision,root});
 const result={...summary,savedAt:new Date().toISOString(),readback:true,savedSha256:createHash('sha256').update(fs.readFileSync(liveFile)).digest('hex')};
 if(record){fs.mkdirSync(path.dirname(path.resolve(record)),{recursive:true});fs.writeFileSync(record,JSON.stringify(result,null,2)+'\n',{flag:'wx'});}
 if(ledger){fs.mkdirSync(path.dirname(path.resolve(ledger)),{recursive:true});fs.appendFileSync(ledger,JSON.stringify({at:result.savedAt,projectId:result.projectId,from:result.from,to:result.to,added:result.diff.added.length,changed:result.diff.changed.length,removed:result.diff.removed.length,bankWrites:bankWrites.length,note:result.note,record:record?path.resolve(record):null})+'\n');}
 return result;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const args=process.argv.slice(2),arg=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];},flag=name=>args.includes(name);
 const result=await publishProject({candidateFile:arg('--candidate')??(()=>{throw Error('--candidate FILE is required');})(),expectedRevision:Number(arg('--expected-revision')),apply:flag('--apply'),allowBank:flag('--allow-bank'),record:arg('--record'),ledger:arg('--ledger'),note:arg('--note')});
 console.log(JSON.stringify(result,null,2));
}
