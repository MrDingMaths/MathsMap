// Bounded execution evidence for an existing pinned transcription task.
// Original prompts/results are never rewritten; packets have independent provenance.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {assertPinnedInputs,loadRun,BOOKLET_AGY_MODEL} from './transcription.mjs';
import {runTasks} from '../agy/lib/agy-run.mjs';
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const read=file=>fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'');
const tokens=text=>new Set(String(text).normalize('NFKC').toLowerCase().match(/[a-z]{3,}|-?\d+(?:\.\d+)?/g)??[]);
export function rankEvidence(query,records,limit=3){
  const wanted=tokens(query),sets=records.map(r=>tokens(r.text)),frequency=new Map();
  sets.forEach(set=>set.forEach(t=>frequency.set(t,(frequency.get(t)??0)+1)));
  return records.map((record,index)=>{let score=0;for(const t of wanted)if(sets[index].has(t))score+=Math.log(1+records.length/(frequency.get(t)??1));return {...record,score:score/Math.sqrt(Math.max(1,sets[index].size))};}).sort((a,b)=>b.score-a.score).slice(0,limit);
}
export function readableEvidence(records){
  return records.map(record=>`## ${record.reference}\n\n${record.text}`).join('\n\n---\n\n')+'\n';
}
export function textWindows(text,size=6000,overlap=800){
  if(!Number.isInteger(size)||!Number.isInteger(overlap)||size<=0||overlap<0||overlap>=size)throw new Error('Window size must be positive with overlap smaller than size');
  const windows=[];for(let start=0;start<text.length;start+=size-overlap)windows.push({start,end:Math.min(text.length,start+size),text:text.slice(start,start+size)});return windows;
}
export function nearbyAssetOccurrences(occurrences,excerpts,contextChars=6000){
  if(!Number.isInteger(contextChars)||contextChars<0)throw new Error('Asset context must be a nonnegative integer');
  return occurrences.filter(a=>excerpts.some(e=>a.markdownOffset>=Math.max(0,e.start-contextChars)&&a.markdownOffset<e.end+contextChars));
}
export function supplementalAssetLinks(markdown,occurrences){
  const known=new Set(occurrences.map(a=>a.path.replaceAll('\\','/')));
  const links=[];
  for(const m of markdown.matchAll(/\]\(([^)\r\n]+?\.(?:png|jpe?g|svg|webp|gif))\)/gi)){
    const assetPath=m[1].replaceAll('\\','/');
    if(!known.has(assetPath))links.push({occurrenceId:`word-link-${m.index}`,path:assetPath,markdownOffset:m.index,reviewStatus:'needs-review',note:'Recovered image link missing from the original occurrence index; verify placement against PDF.'});
  }
  return links;
}
export function verifyPacketFiles(dir,packet){
  if(packet.format!=='mathsmap-transcription-packet-v1'||!/^task-\d{3,}$/.test(packet.task))throw new Error('Invalid packet contract');
  for(const entry of packet.files){
    const relative=path.relative(path.resolve(dir),path.resolve(dir,entry.path));
    if(relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative))throw new Error('Packet file outside packet directory');
    const bytes=fs.readFileSync(path.resolve(dir,entry.path));
    if(bytes.length!==entry.bytes||hash(bytes)!==entry.sha256)throw new Error(`Packet evidence changed: ${entry.path}`);
  }
  if(hash(read(path.join(dir,packet.task+'.md')))!==packet.executionTaskSha256)throw new Error('Packet execution prompt changed');
  return packet;
}
export function preparePacket(runId,taskNumber,output){
  const {runDir}=loadRun(runId);assertPinnedInputs(runDir);
  const name=`task-${String(taskNumber).padStart(3,'0')}`,originalFile=path.join(runDir,'lanes/exact',name+'.md'),original=read(originalFile);
  const pageIds=JSON.parse(read(path.join(runDir,'lanes/exact',name+'.ids.json'))).ids;
  const pages=pageIds.map(id=>Number(id.replace('page-',''))),dir=path.resolve(output);
  const relative=path.relative(runDir,dir);
  if(!relative||(!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative)))throw new Error('Packet must be outside the original import directory');
  if(fs.existsSync(dir)&&fs.readdirSync(dir).length)throw new Error('Packet destination is not empty; preserve it and choose a new directory');
  fs.mkdirSync(dir,{recursive:true});const files=[];
  const save=(relative,data)=>{const file=path.join(dir,relative);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,data);files.push({path:relative,sha256:hash(data),bytes:Buffer.byteLength(data)});};
  const student=pages.map(pageNumber=>{const prefix=`evidence/pages/page-${String(pageNumber).padStart(3,'0')}`;for(const ext of ['.txt','.png'])save(prefix+ext,fs.readFileSync(path.join(runDir,prefix+ext)));return {pageNumber,text:read(path.join(runDir,prefix+'.txt'))};});
  const word=read(path.join(runDir,'evidence/word/document.md')),windows=textWindows(word),selected=new Map();
  for(const page of student)for(const candidate of rankEvidence(page.text,windows,3))selected.set(candidate.start,candidate);
  const excerpts=[...selected.values()].sort((a,b)=>a.start-b.start);
  save('evidence/word/excerpts.json',JSON.stringify({retrieval:'Candidate excerpts; offsets refer to the complete source Word extraction. Confirm all content against student page images.',excerpts},null,2));
  save('evidence/word/excerpts.md',readableEvidence(excerpts.map(e=>({reference:`Candidate Word excerpt: characters ${e.start} to ${e.end} (not page-confirmed)`,text:e.text}))));
  const teacherPath=path.join(runDir,'evidence/teacher/pages.txt');let teacherCandidates=[];
  if(fs.existsSync(teacherPath)){
    const teacher=read(teacherPath).split('\f').map((text,index)=>({sourcePage:index+1,text}));
    teacherCandidates=student.map(page=>({studentPage:page.pageNumber,candidates:rankEvidence(page.text,teacher,3)}));
    save('evidence/teacher/selected-pages.json',JSON.stringify({authority:'Candidates only. Match question identity and mathematical content; sourcePage is an evidence reference, not proof of alignment.',pages:teacherCandidates},null,2));
    save('evidence/teacher/selected-pages.md',readableEvidence(teacherCandidates.flatMap(p=>p.candidates.map(c=>({reference:`Student page ${p.studentPage}: candidate teacher source page ${c.sourcePage}; verify by question content`,text:c.text})))));
  }
  const indexed=JSON.parse(read(path.join(runDir,'evidence/word/asset-occurrences.json'))).occurrences;
  const occurrences=[...indexed,...supplementalAssetLinks(word,indexed)];
  const assetContextChars=6000;
  const assets=nearbyAssetOccurrences(occurrences,excerpts,assetContextChars).map(a=>{
    const source=path.resolve(a.path),relative=path.relative(runDir,source).replaceAll('\\','/');
    if(relative.startsWith('../')||path.isAbsolute(relative))throw new Error('Source asset outside this import');
    if(!files.some(f=>f.path===relative))save(relative,fs.readFileSync(source));return {...a,path:relative};
  });
  save('evidence/word/asset-occurrences.json',JSON.stringify({format:'mathsmap-word-asset-occurrences-v1',retrieval:'Occurrences within the stated character margin of selected Word excerpts; not exhaustive or page-confirmed.',contextChars:assetContextChars,occurrences:assets},null,2));
  save('schema.json',fs.readFileSync(fileURLToPath(new URL('./practice-question-schema.json',import.meta.url))));
  const contract=`\n\n## Bounded execution workflow\nThis packet is a first transcription draft for exactly the supplied pages. The original authority and output contract above still apply.\n1. Read all supplied student page images, their text and the candidate teacher excerpts. PDF text may contain invisible/white answers: the IMAGE determines student answer visibility.\n2. Read schema.json here if needed; do not inspect project source code or neighbouring task results to infer the schema. Questions have a content root {id,type:"question",prompt,layout:"list"|"grid",columns,questionDiagrams:[],children:[]}; each leaf has answer:{short,worked,solutionDiagrams:[]}, answerSpaceMm and a stable id/label. A worked-example block uses examples:[{id,title,prompt,theorySolution,steps,questionDiagrams,solutionDiagrams}] and presentation:{layout:"columns",columns:2,numberSteps:false} for parallel examples.\n3. Use the candidate Word excerpts only for recovering source wording/assets. Tables are native Markdown, not images. Use existing original diagram assets, do not redraw diagrams in this exact stage. Do not generate lengthy worked solutions missing from the teacher evidence. Record the missing evidence as a review flag.\n4. Write the complete result once. A deterministic validator and separate visual review follow. Do not run project builds, install packages, create investigative scripts, or perform repeated whole-book searches. Stop investigating an uncertain item and flag it instead of exhausting the whole task.\nThe selected evidence is heuristic, not complete. If an essential item is absent, one targeted search in the original evidence directory ${JSON.stringify(path.join(runDir,'evidence'))} is allowed. Record any fallback source path. Do not read the complete Word document. Do not infer teacher alignment from matching pagination.\n`;
  const task=original.replaceAll('evidence/word/document.md','evidence/word/excerpts.md').replaceAll('evidence/teacher/pages.txt (form-feed page boundaries), with Word evidence in evidence/teacher/document.md','evidence/teacher/selected-pages.md (each excerpt records its original sourcePage)')+contract;
  save(name+'.md',task);save(name+'.ids.json',JSON.stringify({ids:pageIds}));
  const packet={format:'mathsmap-transcription-packet-v1',runId,runDir,task:name,pages,createdAt:new Date().toISOString(),originalTaskSha256:hash(original),executionTaskSha256:hash(task),model:BOOKLET_AGY_MODEL,files,teacherCandidates:teacherCandidates.map(p=>({studentPage:p.studentPage,candidates:p.candidates.map(c=>({sourcePage:c.sourcePage,score:c.score}))})),assetOccurrences:assets.length,limitations:['Evidence retrieval is heuristic; source images remain authoritative.','This is an isolated draft execution, not an accepted import result.']};
  fs.writeFileSync(path.join(dir,'packet.json'),JSON.stringify(packet,null,2));return packet;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const [command,...args]=process.argv.slice(2);
  if(command==='prepare'){const result=preparePacket(args[0],Number(args[1]),args[2]);console.log(JSON.stringify({task:result.task,pages:result.pages,files:result.files.length,bytes:result.files.reduce((n,f)=>n+f.bytes,0),assets:result.assetOccurrences,teacherCandidates:result.teacherCandidates},null,2));}
  else if(command==='run'){
    const packet=verifyPacketFiles(args[0],JSON.parse(read(path.join(args[0],'packet.json'))));
    assertPinnedInputs(packet.runDir);
    if(hash(read(path.join(packet.runDir,'lanes/exact',packet.task+'.md')))!==packet.originalTaskSha256)throw new Error('Original task changed since packet preparation');
    const result=await runTasks(path.resolve(args[0]),{model:packet.model,effort:args[2]??null,concurrency:1,printTimeout:args[1]??'8m',timeoutMs:10*60*1000});console.log(JSON.stringify({ok:result.ok}));
    if(!result.ok)process.exitCode=1;
  }
  else throw new Error('Use prepare RUN_ID TASK_NUMBER OUTPUT_DIR or run PACKET_DIR [TIMEOUT] [low|medium|high]');
}
