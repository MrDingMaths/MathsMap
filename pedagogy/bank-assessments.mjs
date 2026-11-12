// Builds the `--assessments` file for import-project-bank.mjs from the booklet itself and its import record, so no
// one writes it by hand (bank import pipeline Stage 5; import v2, inefficiency 8; 12 November 2026).
// Input: the live project and the planner's rows for it (pedagogy/bank-batch.mjs `classify`). Output: assessments
// for every `publish` row under the `recorded-review-v1` profile, Decision 6 master links for `link-master` rows, and
// every other question deferred with its reason.
import fs from 'node:fs';
import path from 'node:path';
import {revisionHash} from '../scripts/booklet/bank-sync.mjs';
import {RECORDED_REVIEW_PROFILE,practiceQuestions} from '../scripts/booklet/import-project-bank.mjs';
import {recordedReview,reviewContext,runDirOf,leanRowsOf} from '../scripts/booklet/recorded-review.mjs';
import {difficultyBandForScore} from '../src/lib/practice-question-model.js';

const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
export const SOURCE_PDF_REFERENCE='source-pdf';

// The import run's source: the PDF the chapter was transcribed from and the run's configured topics.
export function importSource(project,root){
 const dir=runDirOf(project,root);if(!dir)return null;
 let manifest=null,config=null;try{manifest=read(path.join(dir,'manifest.json'));}catch{}try{config=read(path.join(dir,'config.json'));}catch{}
 return manifest?.source?.pdf?{dir,pdf:manifest.source.pdf,pdfHash:manifest.source.pdfHash,model:manifest.model,effort:manifest.effort,createdAt:manifest.createdAt,topics:config?.topics??[]}:null;
}
const topicOfPage=(topics,page)=>topics.find(t=>(t.teachingPages??[]).includes(page))??topics.find(t=>page>=t.start&&page<=t.end)??null;

// Course and topic scope from the questions' own skills (skills.json courses; dotpoints.json topic ids).
export function sourceScope(skillIds,{skills,dotpoints}){
 const skillMap=new Map(skills.map(s=>[s.id,s])),pointMap=new Map(dotpoints.map(d=>[d.id,d])),courses=new Set(),topics=new Set();
 for(const id of skillIds){const s=skillMap.get(id);for(const c of s?.courses??[])courses.add(c);for(const d of s?.dotPointIds??[]){const t=pointMap.get(d)?.topicId;if(t)topics.add(t);}}
 return {courseIds:[...courses].sort(),topicIds:[...topics].sort()};
}
const inScope=(id,scope,{skills,dotpoints})=>{const s=skills.find(x=>x.id===id),points=new Map(dotpoints.map(d=>[d.id,d]));return !!s&&s.courses?.some(c=>scope.courseIds.includes(c))&&s.dotPointIds?.some(d=>scope.topicIds.includes(points.get(d)?.topicId));};

export function buildAssessments(project,rows,{root,skills,dotpoints,now=new Date().toISOString()}){
 const origin=rows.find(r=>r.origin)?.origin??(project.library?.category==='master'?'master':'textbook');
 const byId=new Map(practiceQuestions(project).map(b=>[b.id,b])),ctx=reviewContext(project,root),known=new Set(skills.map(s=>s.id));
 const source=origin==='textbook'?importSource(project,root):null,deferred=[],questions=[],reviews=[],masterLinks={};
 const defer=(row,reasons)=>deferred.push({blockId:row.blockId,action:row.action,reasons});
 for(const row of rows){
  const block=byId.get(row.blockId);
  if(row.action==='link-master'){masterLinks[row.blockId]=row.bankId;continue;}
  if(['linked','link','hold'].includes(row.action))continue; // the importer links, keeps or reports these itself
  if(row.action!=='publish'){defer(row,row.reasons??[row.reason??row.action]);continue;}
  const review=recordedReview(block,ctx),c=block.classification??{},tc=block.sourceReview?.teachingContext;
  const reasons=[];
  if(!review.current)reasons.push(review.reason);
  const methodNote=typeof tc?.methodNote==='string'?tc.methodNote.trim():'';
  const mappingNote=typeof tc?.mappingNote==='string'?tc.mappingNote.trim():'';
  if(origin==='textbook'&&!(methodNote&&tc.pdfPages?.length))reasons.push('no-teaching-context');
  if(origin==='textbook'&&!source)reasons.push('no-import-source');
  if(reasons.length){defer(row,reasons);continue;}
  const secondary=(c.secondarySkillIds??[]).filter(id=>known.has(id)&&id!==c.primarySkillId);
  const entry={sourceBlockId:block.id,contentHash:revisionHash(block.content),
   classification:{primarySkillId:c.primarySkillId,secondarySkillIds:secondary,reasoningScore:c.reasoningScore,difficulty:difficultyBandForScore(c.reasoningScore),difficultyReason:c.difficultyReason,assessment:structuredClone(c.assessment)},
   mappingNote:mappingNote||`${c.primarySkillId} is the primary skill recorded on this ${origin} question; its ${review.by} review is current for this content.`,
   bankContext:{origin,projectId:project.id,blockId:block.id,sectionRole:row.sectionRole??'exercise',...(row.examTag?{exam:row.examTag}:{})}};
  if(origin==='textbook'){entry.methodNote=methodNote;entry.teachingReferences=[{id:SOURCE_PDF_REFERENCE,pdfPages:[...new Set(tc.pdfPages)].sort((a,b)=>a-b)}];}
  questions.push(entry);reviews.push({sourceBlockId:block.id,contentHash:entry.contentHash,by:review.by});
 }
 const scope=sourceScope(questions.flatMap(q=>[q.classification.primarySkillId,...q.classification.secondarySkillIds]),{skills,dotpoints});
 for(const q of questions)for(const id of [q.classification.primarySkillId,...q.classification.secondarySkillIds])if(!inScope(id,scope,{skills,dotpoints})){
  // A skill with no syllabus dot point cannot be placed in a topic; say so rather than invent one.
  q.sourceContextException=`${id} has no syllabus dot point in data/dotpoints.json; the mapping is the one recorded on the ${origin} question.`;
 }
 const sourceContext={projectHash:revisionHash(project),...scope,evidenceBlockIds:[]};
 if(origin==='master'){
  // The master's own teaching (theory and worked examples) is the evidence for its skill mappings.
  sourceContext.evidenceBlockIds=project.sections.filter(s=>s.phase!=='practice').flatMap(s=>s.blocks).filter(b=>b.type!=='question'&&b.id).map(b=>b.id);
 }else if(source&&questions.length){
  const lean=leanRowsOf(project,root),pages=new Map();
  for(const q of questions)for(const p of q.teachingReferences[0].pdfPages){const at=lean[q.sourceBlockId]?.at??source.createdAt;const e=pages.get(p)??{questions:[],at};e.questions.push(q.sourceBlockId);if(at>e.at)e.at=at;pages.set(p,e);}
  sourceContext.externalTeachingReferences=[{id:SOURCE_PDF_REFERENCE,pdfPath:source.pdf,pdfSha256:source.pdfHash,
   teachingSummary:`Teaching pages of ${project.title}, as the import run ${path.basename(source.dir)} recorded them: each published question's teaching context names the pages and the taught method it was mapped against.`,
   pages:[...pages].sort((a,b)=>a[0]-b[0]).map(([pdfPage,e])=>{const t=topicOfPage(source.topics,pdfPage);return {pdfPage,printedRef:`PDF page ${pdfPage}${t?` (${t.exerciseLabel??t.id} ${t.title??''})`.trimEnd():''}`,inspection:{reviewer:`${source.model} ${source.effort} (import run ${path.basename(source.dir)})`,note:`Teaching page cited by the import's teaching context for ${e.questions.length} published question(s): ${e.questions.slice(0,8).join(', ')}${e.questions.length>8?', …':''}.`,reviewedAt:e.at}};})}];
 }
 return {projectId:project.id,sourceContext,questions,
  existingTransferReview:{profile:RECORDED_REVIEW_PROFILE,origin,projectHash:revisionHash(project),reviewer:'pedagogy/bank-batch.mjs',note:'Decision 2 (James, 11 November 2026): published on the recorded review covering each question\'s current content; no new model review.',builtAt:now,questions:reviews},
  ...(Object.keys(masterLinks).length?{masterLinks}:{}),
  deferredBlockIds:deferred.map(d=>d.blockId),deferred};
}
