#!/usr/bin/env node
// Completion verification, not a second mathematical/assessment audit.
import fs from 'node:fs';
import path from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {fileURLToPath} from 'node:url';
import {readCampaign,capturePair,hashValue,DEFAULT_CAMPAIGN} from './campaign-support.mjs';
import {approvedSourceException} from './lean-route.mjs';
import {exampleGutterProblems} from './example-gutters.mjs';
import {examplesOf,examplesStatus,validateCoverage,validateExampleReview,inspectionRequirements,renderInspectionRequirements,changedSolidChecks,solidReviewProblems} from './examples-route.mjs';
import {rendererDependencyCurrent} from './examples-render-scope.mjs';

export function checkExampleCoverage(root=process.cwd(),campaign=DEFAULT_CAMPAIGN){
  const folder=path.join(root,'booklets/provenance/content-campaign',campaign);
  const initial=JSON.parse(fs.readFileSync(path.join(root,'.booklet-work/content-campaign',campaign,'examples-run-baseline.json')));
  const ids=readCampaign(root,campaign).skillIds,errors=[],incomplete=[],legacy=[];
  if(initial.skills!==ids.length||!isDeepStrictEqual(initial.rows.map(row=>row.skillId),ids))errors.push('Frozen campaign membership differs from initial examples baseline');
  for(const before of initial.rows){
    const id=before.skillId,pair=capturePair(root,id),immutable=structuredClone(pair.content);
    delete immutable.theory.workedExamples;delete immutable.theory.workedExample;
    if(hashValue(immutable)!==before.immutableContentHash)errors.push(id+': protected practice/non-example theory changed');
    if(pair.expected.quizHash!==before.quizHash)errors.push(id+': accepted quiz bytes changed');
    const audit=path.join(folder,'lean',id+'.json');
    if(hashValue(fs.readFileSync(audit,'utf8'))!==before.auditRecordHash)errors.push(id+': completed assessment audit changed');
    if(pair.content.theory.workedExample)legacy.push(id);
    const file=path.join(folder,'examples',id+'.json');
    const record=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):null;
    if(!['published','unchanged','held-complete'].includes(record?.status)){incomplete.push({skillId:id,status:record?.status||'unstarted'});continue;}
    const candidate=JSON.parse(fs.readFileSync(path.join(root,record.candidatePath)));
    const baseline=JSON.parse(fs.readFileSync(path.join(path.dirname(path.join(root,record.candidatePath)),'baseline.json')));
    if(hashValue(candidate)!==record.candidateHash)errors.push(id+': candidate changed after acceptance');
    if(id==='survey-bias-ethics'){
      if(record.status!=='held-complete'||record.published||pair.expected.contentHash!==before.contentHash)errors.push(id+': deliberate publication hold changed');
    }else if(!isDeepStrictEqual(pair.content,candidate.content)||!isDeepStrictEqual(pair.quiz,candidate.quiz))errors.push(id+': accepted examples differ from live readback');
    if(!examplesOf(candidate.content).length)errors.push(id+': no useful staged example');
    for(const [index,example] of examplesOf(candidate.content).entries())errors.push(...exampleGutterProblems(example).map(problem=>id+': example '+index+' equals gutter '+JSON.stringify(problem)));
    errors.push(...validateCoverage(record.coverage,baseline).map(error=>id+': '+error));
    const required=inspectionRequirements(baseline,candidate);
    errors.push(...validateExampleReview(record.review,candidate,required.map(row=>row.index)).map(error=>id+': '+error));
    errors.push(...solidReviewProblems(changedSolidChecks(baseline,candidate),record.review).map(error=>id+': '+error));
    if(!isDeepStrictEqual(record.sourceException,approvedSourceException(root,id)))errors.push(id+': source exception differs from recorded approvals');
    for(const row of record.sources)if(hashValue(fs.readFileSync(path.join(root,row.path)))!==row.hash)errors.push(id+': accepted source changed: '+row.path);
    const renderRequired=renderInspectionRequirements(baseline,candidate);
    if(renderRequired.length){
      const inspection=record.inspection,render=record.render;
      if(inspection?.accepted!==true||inspection.findings?.length!==0||render?.passed!==true||render.candidateHash!==record.candidateHash||inspection.candidateHash!==record.candidateHash)errors.push(id+': actual visual acceptance incomplete');
      if(!isDeepStrictEqual(inspection?.evidence,render?.artifacts.map(row=>({path:row.path,hash:row.hash}))))errors.push(id+': inspected artifacts differ from actual captures');
      for(const row of renderRequired){const check=inspection?.examples?.find(check=>check.index===row.index);if(check?.exampleHash!==row.exampleHash||check.renderedConfirmed!==true||(row.diagramHash&&(check.diagramHash!==row.diagramHash||check.diagramInspected!==true)))errors.push(id+': missing actual inspected example/diagram '+row.index);}
      for(const row of [...(inspection?.evidence||[]),...(inspection?.dependencies||[])])if(!rendererDependencyCurrent(root,row,examplesOf(candidate.content),render?.indices))errors.push(id+': inspection dependency/artifact changed: '+row.path);
    }
  }
  return {passed:!errors.length&&!incomplete.length,protectedDataPassed:!errors.some(error=>/protected|quiz bytes|assessment audit|publication hold/.test(error)),...examplesStatus(root,campaign),legacySingularIds:legacy,incomplete,errors};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=checkExampleCoverage();const {liveMissingIds,incomplete,...compact}=result;
  console.log(JSON.stringify({...compact,liveMissingCount:liveMissingIds.length,incompleteCount:incomplete.length,incomplete:incomplete.slice(0,25)},null,2));
  if(result.errors.length||(!process.argv.includes('--progress')&&!result.passed))process.exitCode=1;
}
