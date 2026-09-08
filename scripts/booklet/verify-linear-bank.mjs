import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {validateQuestion} from '../../src/lib/practice-question-model.js';
import {validateEditableProject} from '../../src/lib/editable-booklet-model.js';
import {validateTeachingModule} from '../../src/lib/teaching-module-model.js';
const hash=v=>createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
const read=async path=>JSON.parse(await fs.readFile(path,'utf8'));
const inventory=await read('output/linear-bank/inventory.json');
const source=await fs.readFile('booklets/projects/linear-relationships-complete-v1.json');
if(hash(source)!==inventory.baseline.sha256)throw Error('Source changed since baseline');
const skills=new Set((await read('data/skills.json')).map(s=>s.id));
const assets=new Set();
const scan=v=>{if(!v||typeof v!=='object')return;if(typeof v.src==='string'&&v.src.startsWith('/booklet-assets/'))assets.add('public'+v.src);Object.values(v).forEach(x=>Array.isArray(x)?x.forEach(scan):scan(x));};
let questions=0;
for(const m of inventory.modules){
 const module=await read('booklets/module-bank/'+m.id+'.json');
 const check=validateTeachingModule(module,{skillIds:skills});if(!check.valid)throw Error(check.errors.join(';'));
 scan(module);
 for(const item of m.blocks.filter(b=>b.bankRef)){
  const q=await read('booklets/question-bank/'+item.bankRef.id+'.json');
  const checked=validateQuestion(q,{skillIds:skills});if(!checked.valid)throw Error(item.id+': '+checked.errors.join(';'));
  const ref=module.sequence.find(s=>s.questionId===q.id);
  if(!ref||ref.questionRevision!==hash(q))throw Error('Module revision mismatch '+q.id);
  questions++;scan(q);
 }
}
for(const asset of assets)await fs.access(asset);
const revision=await read('booklets/projects/linear-relationships-revision-v1.json');
const checked=validateEditableProject(revision);if(!checked.valid)throw Error(checked.errors.join(';'));
for(const b of revision.sections.flatMap(s=>s.blocks)){const q=await read('booklets/question-bank/'+b.bankRef.id+'.json');if(hash(q)!==b.bankRef.revision)throw Error('Revision snapshot mismatch '+b.id);}
const pdfs=[];
for(const mode of ['student','short','worked']){
 const file='output/pdf/linear-relationships-revision-'+mode+'.pdf';
 const qa=await read(file+'.qa.json'),printed=await read(file+'.printed-qa.json');
 if([...qa,...printed].some(p=>p.issues.length))throw Error('PDF QA failed '+mode);
 const text=spawnSync('pdftotext',[file,'-'],{encoding:'utf8',windowsHide:true});if(text.status!==0)throw Error('PDF text extraction failed');
 if(mode==='worked'&&!text.stdout.includes('Worked solutions'))throw Error('Worked answers missing');
 if(mode==='short'&&!text.stdout.includes('Answers'))throw Error('Short answers missing');
 if(mode==='student'&&text.stdout.includes('Worked solutions'))throw Error('Student answer leakage');
 pdfs.push({mode,file,pages:printed.length,sha256:hash(await fs.readFile(file)),geometryIssues:0});
}
const report={sourceRevision:inventory.baseline.revision,sourceUnchanged:true,modules:inventory.modules.length,sourceQuestions:questions,sourceParts:inventory.modules.flatMap(m=>m.blocks).flatMap(b=>b.parts).length,assetsChecked:assets.size,revisionProject:revision.id,revision:revision.revision,revisionQuestions:revision.sections.flatMap(s=>s.blocks).length,pdfs,visualInspection:'All student and short-answer pages inspected. Worked questions match student pages; all worked-answer pages inspected, with the final changed comparison-answer page rechecked.',mathematics:'Selected table values, rules, intersections, forward/inverse calculations and model domain checked against the selected prompts and graphs. Complete-source mathematics was not re-audited.',synchronisation:'Explicit bank updates; no automatic refresh of existing booklets.'};
await fs.writeFile('output/linear-bank/final-verification.json',JSON.stringify(report,null,2)+'\n');
const index={...inventory,revisionBooklet:await read('output/linear-bank/revision-selection.json')};
index.modules.sort((a,b)=>a.id.localeCompare(b.id));
await fs.writeFile('docs/linear-relationships-bank-index.json',JSON.stringify(index,null,2)+'\n');
console.log(JSON.stringify(report));
