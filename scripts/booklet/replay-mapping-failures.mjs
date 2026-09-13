// Offline diagnostic only: never publishes packets or certifies source fidelity.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {mappingRepairContext,applyMappingRepair} from './semantic-mapping-repair.mjs';
import {validateSemanticResult} from './semantic-workflow.mjs';

export function replayMappingFailures(runDir) {
 const root=path.join(runDir,'semantic-packets'),read=file=>fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''),hash=text=>createHash('sha256').update(text).digest('hex');
 const failures=read(path.join(root,'ledger.jsonl')).trim().split(/\r?\n/).map(JSON.parse).filter(r=>r.error?.startsWith('Unknown inventory mapping'));
 const cases=failures.map(row=>{
  const stem=`page-${String(row.page).padStart(3,'0')}`,source=path.join(root,`${stem}.author.${row.attempt}`,'last-message.txt'),raw=read(source),inventoryRaw=read(path.join(root,stem+'.inventory.json'));
  const packet=JSON.parse(raw.trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'')),inventory=JSON.parse(inventoryRaw),context=mappingRepairContext(packet,inventory);
  const repair={edits:context.invalid.map(e=>({index:e.index,original:e.mapping,replacement:null,reason:'Offline diagnostic hypothesis: generated group/heading reference. Retain all independent inventory mappings and content; this replay does not approve a source interpretation.'}))};
  const result=applyMappingRepair(packet,inventory,repair),allowed=new Set(inventory.entries.map(e=>e.id));
  let error=null;try{validateSemanticResult(result,{stage:'author',page:row.page,inventory});}catch(e){error=e.message;}
  return {page:row.page,attempt:row.attempt,sourceHash:hash(raw),inventoryHash:hash(inventoryRaw),repair,
   contentUnchanged:isDeepStrictEqual({...result,inventoryMappings:[]},{...packet,inventoryMappings:[]}),
   realMappingsUnchanged:isDeepStrictEqual(result.inventoryMappings,packet.inventoryMappings.filter(m=>allowed.has(m.inventoryId))),valid:!error,error};
 });
 return {mode:'offline-diagnostic',cases,note:'Mapping removals are explicit diagnostic hypotheses. Original packets remain unchanged; remaining validation defects must still be repaired. No model calls, publication or visual acceptance.'};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const arg=name=>{const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];};
 const dir=arg('--run-dir'),out=arg('--out');if(!dir||!out)throw Error('Use --run-dir RUN --out LOCAL_REPORT.json');
 const report=replayMappingFailures(dir);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({cases:report.cases.length,valid:report.cases.filter(c=>c.valid).length,remaining:report.cases.filter(c=>!c.valid).map(c=>({page:c.page,error:c.error})),contentUnchanged:report.cases.every(c=>c.contentUnchanged&&c.realMappingsUnchanged)}));
}
