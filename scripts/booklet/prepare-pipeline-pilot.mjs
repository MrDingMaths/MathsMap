// Freeze selected existing content for regression exports; never an import approval.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {projectReviewHash} from './page-review.mjs';
import {settlementKey} from './workflow-review.mjs';
import {isolatedHarnessDirectory} from './check-import-harness.mjs';
const hash=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
export function preparePipelinePilot({sourceFile,ids,out,runId}){
 if(!/^[a-z0-9-]+$/.test(runId))throw Error('Pilot needs a safe run ID');
 const root=isolatedHarnessDirectory(out),runDir=path.resolve('.booklet-work/full-imports',runId);if(fs.existsSync(runDir))throw Error('Pilot run already exists');
 const original=JSON.parse(fs.readFileSync(sourceFile,'utf8')),project=structuredClone(original),selected=new Set(ids);
 project.sections=project.sections.filter(s=>s.phase==='practice').map(s=>({...s,blocks:s.blocks.filter(b=>selected.has(b.id))})).filter(s=>s.blocks.length);
 if(project.sections.flatMap(s=>s.blocks).length!==selected.size)throw Error('Select existing whole practice questions exactly once');
 const topicIds=new Set(project.sections.map(s=>s.topicId));project.topics=project.topics.filter(t=>topicIds.has(t.id));
 project.id=runId;project.title='PDF import pipeline regression pilot';project.revision=1;
 project.source={pipelinePilot:true,workflow:{policy:'review-first-v1',runId},original:{path:path.resolve(sourceFile),hash:hash(sourceFile),questionIds:ids}};
 project.studio={version:1,flags:[]};
 for(const b of project.sections.flatMap(s=>s.blocks))delete b.bankRef;
 const file=path.join(root,'candidate.json'),source=path.join(root,'source-questions.json');
 fs.mkdirSync(root,{recursive:true});fs.mkdirSync(path.join(runDir,'workflow'),{recursive:true});
 fs.writeFileSync(file,JSON.stringify(project,null,2));fs.writeFileSync(source,JSON.stringify(original.sections.flatMap(s=>s.blocks).filter(b=>selected.has(b.id)),null,2));
 // This synthetic settlement freezes a test fixture only. It has no inventoried
 // source pages, grants no import acceptance and cannot be published to the bank.
 const state={version:1,revision:0,pages:{},issues:{},corrections:[],representatives:{},settled:null,finalReview:null};
 state.settled={key:settlementKey(state),project:{file,hash:projectReviewHash(project)},artifacts:[{path:source,hash:hash(source)}],reviewer:'Regression fixture preparation',note:'Frozen unchanged question sample for tooling regression; not source transcription or import acceptance.'};
 fs.writeFileSync(path.join(runDir,'manifest.json'),JSON.stringify({id:runId,selectedPages:[],workflowPolicy:'review-first-v1',regressionOnly:true}));
 fs.writeFileSync(path.join(runDir,'workflow/issues.json'),JSON.stringify(state,null,2));
 const result={projectFile:file,sourceFiles:[source],runDir,key:state.settled.key,sourceHash:hash(sourceFile),questionIds:ids};
 fs.writeFileSync(path.join(root,'pilot.json'),JSON.stringify(result,null,2));return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const arg=k=>process.argv[process.argv.indexOf(k)+1];console.log(JSON.stringify(preparePipelinePilot({sourceFile:arg('--source'),ids:arg('--ids').split(','),out:arg('--out'),runId:arg('--run-id')})));
}
