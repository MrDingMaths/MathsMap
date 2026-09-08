import fs from 'node:fs';
const source='C:/Users/Admin/.codex/attachments/4ac36763-7a9d-4fb4-8fa2-872e7438d30a/pasted-text.txt';
const feedback=fs.readFileSync(source,'utf8'),project=JSON.parse(fs.readFileSync('output/linear-feedback/candidate.json'));
const repairs=JSON.parse(fs.readFileSync('output/linear-feedback/repairs.json')).notes;
const verified=process.argv.includes('--verified');
if(verified){const acceptance=JSON.parse(fs.readFileSync('output/linear-feedback/browser-acceptance.json'));if(acceptance.errors.length||acceptance.metrics.filter(m=>m.page).length!==93||acceptance.metrics.some(m=>m.overflow?.length||m.diagramErrors?.length)||!acceptance.metrics.some(m=>m.interaction)||!acceptance.metrics.some(m=>m.imageParity))throw new Error('Full browser acceptance required');for(const mode of ['student','short','worked'])if(JSON.parse(fs.readFileSync('output/linear-feedback/pdf-'+mode+'-metrics.json')).collisions.length)throw new Error('PDF collision');}
const general=[
 'Pointer movement updates only the local preview. Release produces one undoable commit and one save; Escape restores the starting size.',
 'House style version 1.0.0 applies 1.5 line spacing to Key Ideas, with explicit adoption and no migration on load.',
 'House-style cloze uses dotted leaders and expected-answer widths. Empty table response cells omit redundant underlines.',
 'Structural sharing limits content updates and review reconciliation. Saving reports changes immediately and persists asynchronously without dropping subsequent edits.',
 'Image properties provide grayscale and crop; focused editor, booklet, saved project and PDF use the same fields.'
];
let section='',index=0;
const issues=[];
for(const line of feedback.split(/\r?\n/).map(s=>s.trim()).filter(Boolean)){
  if(['General','Specific'].includes(line)){section=line;continue;}
  if(line.startsWith('Can you come up'))continue;
  const match=line.match(/^P(\d+)(?:[-–](\d+)|(?:\s+and\s+|,\s*)(\d+))?/i);
  const pages=match?match[2]?Array.from({length:Number(match[2])-Number(match[1])+1},(_,i)=>Number(match[1])+i):[Number(match[1]),...(match[3]?[Number(match[3])]:[])]:[];
  const questionNumbers=[...line.matchAll(/\bq(?:uestion)?\s*(\d+)/gi)].map(m=>Number(m[1]));
  let targets=project.sections.filter(s=>pages.includes(s.sourcePageNumber)).flatMap(s=>s.blocks.filter(b=>!questionNumbers.length||questionNumbers.includes(b.sourceOrder)).map(b=>b.id));
  if(!targets.length&&pages.length)targets=project.sections.filter(s=>pages.includes(s.sourcePageNumber)).flatMap(s=>s.blocks.map(b=>b.id));
  if(section==='General')targets=[project.id];
  if(pages.includes(35))targets=[...new Set([...targets,'page-35-q10'])];
  const issueRepairs=section==='General'?[general[index]]:repairs.filter(r=>pages.some(p=>r.pages.includes(p))).map(r=>r.note);
  issues.push({id:'linear-feedback-'+String(++index).padStart(2,'0'),category:section.toLowerCase(),feedback:line,sourcePages:pages,targetIds:targets,repairs:issueRepairs,status:verified?'implemented-and-checked':'pending-verification',evidence:verified?{report:'docs/booklets-house-style-verification.md',screenshots:pages.map(p=>'output/linear-feedback/page-'+String(p).padStart(3,'0')+'.png'),source:'.booklet-work/full-imports/linear-relationships-studio-v1/source/booklet.pdf'}:undefined});
}
fs.writeFileSync('docs/linear-booklet-feedback-2026-09-06.json',JSON.stringify({projectId:project.id,sourceRevision:project.revision,feedbackSource:source,verificationScope:'Implementation and source/layout checks; does not grant human mathematical, mapping or diagram approvals. Retained source images remain explicitly flagged.',issues},null,2)+'\n');
console.log(JSON.stringify({issues:issues.length,withRepairNotes:issues.filter(i=>i.repairs.length).length}));
