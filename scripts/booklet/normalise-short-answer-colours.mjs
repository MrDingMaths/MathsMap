import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {normaliseDiagramColours} from './normalise-diagram-colours.mjs';
import {normaliseShortAnswer} from '../../src/lib/short-answer-style.js';
import {isPractice} from '../../src/lib/booklet-flow.js';
import {revisionHash} from './bank-sync.mjs';

export function migrateShortAnswerColours(value){
  const next=structuredClone(value),records=[];
  function visit(node,location){
    if(node?.answer?.short){
      const before=node.answer.short,after=normaliseShortAnswer(before);
      if(JSON.stringify(before)!==JSON.stringify(after)){
        node.answer.short=after;
        records.push({id:node.id,location,before:revisionHash(before),after:revisionHash(after),departure:'Decorative answer blue removed; ordinary text inherits #24282d.'});
      }
    }
    node?.children?.forEach((child,i)=>visit(child,location+'/children/'+i));
  }
  if(next.sections)next.sections.forEach((s,si)=>s.blocks.forEach((b,bi)=>{if(isPractice(b))visit(b.content,`/sections/${si}/blocks/${bi}/content`);}));
  else if(next.content)visit(next.content,'/content');
  return {next,records};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const report=await normaliseDiagramColours({apply:process.argv.includes('--apply'),migrate:migrateShortAnswerColours,policy:'10 pt native diagram labels; #24282d ordinary practice short answers. Teaching answers, worked solutions and semantic colours retained.'});
  const i=process.argv.indexOf('--report');if(i>=0)await fs.writeFile(process.argv[i+1],JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({...report,projects:report.projects.map(p=>({id:p.id,changed:p.records.length})),bank:report.bank.length}));
}
