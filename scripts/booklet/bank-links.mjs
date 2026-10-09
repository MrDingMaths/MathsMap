// Read-only report: how each booklet's practice questions relate to the bank,
// and which of them the next publication would create, link or hold.
//   node scripts/booklet/bank-links.mjs [--project ID] [--json] [--root DIR]
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bankQuestionKeys,resolveBankOutcomes,syncLinks,sharedHash,questionKeyHash,blockPolicy} from './bank-sync.mjs';
import {practiceQuestions} from './import-project-bank.mjs';

export async function bankLinkReport({root=process.cwd(),projectId=null}={}){
 const projectRoot=path.join(root,'booklets/projects'),bankRoot=path.join(root,'booklets/question-bank');
 const links=await syncLinks(bankRoot),entries=await bankQuestionKeys(bankRoot),projects=[];
 for(const name of (await fs.readdir(projectRoot)).filter(n=>n.endsWith('.json')).sort()){
  const project=await fs.readFile(path.join(projectRoot,name),'utf8').then(JSON.parse,()=>null);
  if(Array.isArray(project?.sections))projects.push(project);
 }
 // Unpublished copies in other booklets: whichever is published first will own
 // the record, and the others then link to it or wait for a decision.
 const identical=new Map(),sameQuestion=new Map(),hashes=new Map();
 for(const project of projects)for(const block of practiceQuestions(project)){
  if(block.bankRef?.id)continue;
  const p=blockPolicy(block),ref={project:project.id,blockId:block.id,shared:sharedHash(block,p),key:questionKeyHash(block,p)};
  hashes.set(project.id+'/'+block.id,ref);
  identical.set(ref.shared,[...(identical.get(ref.shared)??[]),ref]);sameQuestion.set(ref.key,[...(sameQuestion.get(ref.key)??[]),ref]);
 }
 const rows=[];
 for(const project of projects){
  if(projectId&&project.id!==projectId)continue;
  const questions=practiceQuestions(project),outcomes=await resolveBankOutcomes(questions,bankRoot,entries);
  const row={project:project.id,questions:questions.length,owned:0,consuming:0,toLink:0,held:0,toCreate:0,alsoUnpublishedElsewhere:0,blocks:[]};
  for(const block of questions){
   const o=outcomes.get(block.id);
   if(o.outcome==='linked'){row[links[o.bankId]?.projectId===project.id&&links[o.bankId].blockId===block.id?'owned':'consuming']++;continue;}
   row[{exact:'toLink',held:'held',new:'toCreate'}[o.outcome]]++;
   const own=hashes.get(project.id+'/'+block.id),elsewhere=refs=>refs.filter(r=>r.project!==project.id).map(r=>r.project+'/'+r.blockId);
   const peers={identical:elsewhere(identical.get(own.shared)),sameQuestion:elsewhere(sameQuestion.get(own.key).filter(r=>r.shared!==own.shared))};
   if(peers.identical.length||peers.sameQuestion.length)row.alsoUnpublishedElsewhere++;
   if(o.outcome!=='new'||peers.identical.length||peers.sameQuestion.length)row.blocks.push({blockId:block.id,outcome:o.outcome,...(o.bankId?{bankId:o.bankId}:{}),...(o.blockId?{sameAsBlock:o.blockId}:{}),...(o.sameQuestionAs?{sameQuestionAs:o.sameQuestionAs.map(r=>r.bankId??r.blockId)}:{}),...(peers.identical.length?{identicalIn:peers.identical}:{}),...(peers.sameQuestion.length?{sameQuestionIn:peers.sameQuestion}:{})});
  }
  rows.push(row);
 }
 return rows;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const arg=name=>process.argv.includes(name)?process.argv[process.argv.indexOf(name)+1]:undefined;
 const rows=await bankLinkReport({root:arg('--root')?path.resolve(arg('--root')):process.cwd(),projectId:arg('--project')??null});
 if(process.argv.includes('--json'))console.log(JSON.stringify(rows,null,2));
 else{
  const columns=['questions','owned','consuming','toLink','held','toCreate','alsoUnpublishedElsewhere'],total=Object.fromEntries(columns.map(c=>[c,rows.reduce((sum,row)=>sum+row[c],0)]));
  console.log(['project',...columns].join('\t'));
  for(const row of [...rows,{project:'TOTAL',...total}])console.log([row.project,...columns.map(c=>row[c])].join('\t'));
  if(arg('--project'))for(const block of rows[0]?.blocks??[])console.log(JSON.stringify(block));
 }
}
