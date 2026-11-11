// Exam hand-off tags (import pipeline v2, Stage 6; docs/booklet-import-pipeline-v2.md).
// Import makes no Exam change. It records, as metadata the exam pass reads, which
// source questions carry an exam label and which tokens may be mark allocations.
// exam-marks.mjs still makes its own source-proven decision with its inverse proof;
// these tags are candidates, never evidence that a token is a mark.
// sourceReview is review metadata: it is not printed and does not change review hashes.

const EXAM_TITLE=/\b(?:HSC|Trial|PLC)\b[^\n.;]{0,60}|\bSample Question\b/i;
const NAPLAN=/\bNAPLAN\b/i;
// [3], [2 marks], (3 marks): candidates only.
const MARK_TOKEN=/\[\s*\d{1,2}\s*(?:marks?)?\s*\]|\(\s*\d{1,2}\s*marks?\s*\)/gi;
const ANSWER_KEYS=new Set(['answer','theorySolution','steps','solutionDiagrams','sharedSolutionDiagrams','solution']);
const METADATA_KEYS=new Set(['classification','sourceReview','sourceLayoutEvidence','provenance','flow','layout','presentation','bankRef','studio']);

function printedStrings(node,pointer='',out=[]){
 if(typeof node==='string'){out.push({path:pointer,text:node});return out;}
 if(Array.isArray(node)){node.forEach((child,i)=>printedStrings(child,pointer+'/'+i,out));return out;}
 if(!node||typeof node!=='object')return out;
 for(const [key,child] of Object.entries(node)){
  if(ANSWER_KEYS.has(key)||METADATA_KEYS.has(key)||key==='id'||key==='code')continue;
  printedStrings(child,pointer+'/'+key.replaceAll('~','~0').replaceAll('/','~1'),out);
 }
 return out;
}

// Inventory entries may name the printed exam label (examTitle) for their target.
function inventoryTitles(project){
 const titles=new Map();
 for(const entry of project.source?.inventory?.entries??project.sourceInventory?.entries??[])if(entry?.targetId&&typeof entry.examTitle==='string'&&entry.examTitle.trim())titles.set(String(entry.targetId),entry.examTitle.trim());
 return titles;
}

export function examTagsFor(block,section,titles=new Map()){
 const strings=printedStrings({title:block.title,content:block.content??block.prompt});
 const label=titles.get(block.id)??strings.map(row=>EXAM_TITLE.exec(row.text)?.[0]?.trim()).find(Boolean)??null;
 const naplan=strings.some(row=>NAPLAN.test(row.text));
 const markTokens=strings.flatMap(row=>[...row.text.matchAll(MARK_TOKEN)].map(m=>({path:row.path,text:m[0],index:m.index})));
 if(!label&&!naplan&&!markTokens.length)return null;
 return {...(label&&!naplan?{title:label}:{}),...(naplan?{naplan:true}:{}),...(markTokens.length?{markTokens}:{}),sourceSection:section.title??section.id??null,taggedBy:'import-v2'};
}

// Returns the number of blocks tagged. Existing exam-pass records (sourceReview.source) are untouched.
export function tagExamQuestions(project){
 const titles=inventoryTitles(project);let tagged=0;
 for(const section of project.sections??[]){
  if(section.phase==='teaching'||section.phase==='front-matter')continue;
  for(const block of section.blocks??[]){
   if(block.type!=='question')continue;
   const tags=examTagsFor(block,section,titles);
   if(!tags){if(block.sourceReview?.exam?.taggedBy==='import-v2')delete block.sourceReview.exam;continue;}
   block.sourceReview={...block.sourceReview,exam:tags};tagged++;
  }
 }
 return tagged;
}
