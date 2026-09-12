// House-style repair for explicit underlined writing blanks, preserving evidence
// and actual mathematical underlining. Dry-run unless --apply is supplied.
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {normaliseDiagramColours} from './normalise-diagram-colours.mjs';
import {revisionHash} from './bank-sync.mjs';
import {underlinedQuestionScaffolds} from '../../public/libs/maths-editor/question-scaffolds.mjs';
export function dottedQuestionScaffolds(value){
 const next=structuredClone(value),records=[];
 for(const field of underlinedQuestionScaffolds(next)){
  const keys=field.location.split('/').slice(1),key=keys.pop(),node=keys.reduce((n,k)=>n[k],next);
  node[key]=field.replacement;
  records.push({id:field.id,location:field.location,before:revisionHash(field.value),after:revisionHash(field.replacement),reason:'Dotted writing blank replaces an underlined space; strut and response capacity retained.'});
 }
 return {next,records};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const report=await normaliseDiagramColours({apply:process.argv.includes('--apply'),migrate:dottedQuestionScaffolds,policy:'Dotted question scaffolds'});
 console.log(JSON.stringify({...report,projects:report.projects.map(p=>({id:p.id,fields:p.records.length}))},null,2));
}
