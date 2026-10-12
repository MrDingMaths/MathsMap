#!/usr/bin/env node
// Examples-only run: assessment acceptance is immutable, not repeated.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { capturePair, assessmentItems, hashValue, readCampaign, DEFAULT_CAMPAIGN } from './campaign-support.mjs';
import { runModel, skillEvidence, evidenceText, approvedSourceException, writeFileResilient } from './lean-route.mjs';
import { validateCandidatePair } from '../validate.mjs';
import { publishSkill, recoverSkill, contentHash, preserveJsonBytes } from './publication.mjs';
import { templateDiagram } from '../../src/lib/diagram-templates.js';
import { splitInlineContent,groupTextBlocks } from '../../src/lib/inline-content.js';
import { renderMath } from '../../src/lib/render-math.js';
import { visitFigures, isSolidCandidate, solidHash } from '../audit-solid-visibility.mjs';
import { inspectSolid } from '../lib/solid-audit.mjs';
import {exampleGutterProblems,repairExampleGutters} from './example-gutters.mjs';
import {hasFractionMath,fractionInkClearanceEnabled,rendererDependencyCurrent} from './examples-render-scope.mjs';

export const EXAMPLES_PROFILE = 'examples-only-20261011-v1';
const read = file => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
const save = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); writeFileResilient(file, JSON.stringify(value, null, 2)+'\n'); };
const location = (root, campaign) => path.join(root, 'booklets/provenance/content-campaign', campaign, 'examples');
const recordFile = (root, campaign, id) => path.join(location(root, campaign), id + '.json');
export const examplesOf = content => content.theory?.workedExamples ?? (content.theory?.workedExample ? [content.theory.workedExample] : []);
export function materializeExampleTemplates(result) {
  if (!result?.templateRequests?.length) return result;
  const next = structuredClone(result), seen = new Set();
  for (const request of next.templateRequests) {
    if (!/^[a-zA-Z0-9-]+$/.test(request.id || '') || seen.has(request.id)) throw new Error('Invalid or duplicate template request id');
    seen.add(request.id);
    const diagram = templateDiagram(request.id, request.parameters), marker = `[[template:${request.id}]]`;
    let found = false;
    for (const example of next.examples || []) for (const field of ['question_text', 'solution_text']) if (example[field]?.includes(marker)) {
      example[field] = example[field].replaceAll(marker, '[tikz]' + diagram.code + '[/tikz]'); found = true;
    }
    if (!found) throw new Error('Unused template request: ' + request.id);
  }
  next.materializedTemplates = next.templateRequests;
  delete next.templateRequests;
  return next;
}
export function normaliseExampleDelimiters(result) {
  const next = structuredClone(result);
  for (const example of next.examples || []) for (const key of ['question_text','solution_text']) {
    if (typeof example[key] !== 'string') continue;
    example[key] = splitInlineContent(example[key]).parts.map(part => part.type === 'tikz' ? '[tikz]' + part.value + '[/tikz]'
      : part.value.replace(/(?<!\\)\$\$([\s\S]*?)(?<!\\)\$\$/g, (_, latex) => '$' + latex + '$')).join('');
  }
  return next;
}
function workerConventions(root) {
  const files = ['docs/booklet-standing-conventions.md', 'docs/booklet-worked-solution-style.md', 'docs/booklet-standard-palette.md', 'docs/solid-visibility.md'];
  return `CURRENT IMPLEMENTATION HANDOFF: The coordinator read AGENTS.md and the applicable Studio conventions. Read the supplied convention text below; do not run repository documentation or renderer inspection commands. The real TheoryView renderer has been implemented and tested: question_text is black on a white surface, every solution_text prose/math run is automatically #268cff, phantom ink remains invisible, and diagram colours are preserved. Keep prose as editable plain prose: never convert prose into gathered/\\textcolor math solely to colour it. No explicit colour wrapper is needed. equationAlignment:{mode:'continuation'} uses the shared Studio parser for all-math separate fields; mixed prose uses authored phantom gutters. Rendering and label-size verification are a later actual capture/visual stage, not a source blocker for an author or mathematical reviewer. No missing repository read is a source gap when the content and source are supplied here. These task-specific requirements supersede older optional-example, full-assessment-review and three-worker instructions in the texts below.\n` + files.filter(file=>fs.existsSync(path.join(root,file))).map(file => `===== CURRENT CONVENTIONS ${file} =====\n${fs.readFileSync(path.join(root,file),'utf8')}`).join('\n');
}
export function retainedSurveySource(root, campaign) {
  const file = path.join(root,'booklets/provenance/content-campaign',campaign,'skills/survey-bias-ethics.json'), state = read(file);
  if (!state?.stage?.hash || state.review?.stageHash !== state.stage.hash || state.review.findings?.length !== 0) return [];
  return (state.stage.sourceReview || []).filter(row => row.support === 'direct' && row.path === 'syllabus/Stage 6 Standard Content.md'
    && Number.isInteger(row.startLine) && Number.isInteger(row.endLine) && row.endLine >= row.startLine
    && hashValue(fs.readFileSync(path.join(root,row.path))) === row.hash);
}
const immutable = pair => { const copy = structuredClone(pair); delete copy.content.theory.workedExamples; delete copy.content.theory.workedExample; return { content: copy.content, quiz: copy.quiz }; };
export function examplesCandidate(baseline, examples) {
  if (!Array.isArray(examples) || !examples.length || examples.some(ex => !ex || typeof ex.question_text !== 'string' || !ex.question_text.trim() || typeof ex.solution_text !== 'string' || !ex.solution_text.trim())) throw new Error('Every example needs separate editable question_text and solution_text');
  const candidate = { content: structuredClone(baseline.content), quiz: structuredClone(baseline.quiz) };
  delete candidate.content.theory.workedExample;
  candidate.content.theory.workedExamples = examples;
  if (!isDeepStrictEqual(immutable(candidate), immutable(baseline))) throw new Error('Examples-only immutable fields changed');
  return candidate;
}
export function validateCoverage(result, baseline) {
  if(!result || ['examples','methods','assessmentMappings','exampleMappings','existingExamples'].some(key=>!Array.isArray(result[key]) || result[key].some(row=>!row||typeof row!=='object'||Array.isArray(row))))return ['Invalid author shape: examples, methods and all coverage mappings must be arrays of objects'];
  const errors = [], methods = result.methods || [], ids = methods.map(row => row.id);
  if (!ids.length || new Set(ids).size !== ids.length || methods.some(row => !row.id || !row.description || !row.sourceRef)) errors.push('Distinct methods need unique ids, descriptions and supplied source references');
  const assessment = assessmentItems(baseline.content, baseline.quiz, false).filter(row => row.kind !== 'example');
  if ((result.assessmentMappings || []).some(row => !assessment.some(item => item.where === row.where))) errors.push('Unknown assessment locator');
  for (const id of ids) if (!(result.assessmentMappings || []).some(row => row.methodIds?.includes(id))
    && !(result.existingExamples || []).some(old => old.decision !== 'removed' && (result.exampleMappings || []).some(row => row.index === old.finalIndex && row.methodIds?.includes(id)))) errors.push('Method not assessed or retained from a useful existing example: ' + id);
  for (const item of assessment) {
    const rows = (result.assessmentMappings || []).filter(row => row.where === item.where);
    if (rows.length !== 1 || !rows[0].methodIds?.length || rows[0].methodIds.some(id => !ids.includes(id))) errors.push('Missing/invalid method mapping: ' + item.where);
  }
  for (const id of ids) if (!(result.exampleMappings || []).some(row => row.methodIds?.includes(id) && Number.isInteger(row.index) && result.examples?.[row.index])) errors.push('No example covers method: ' + id);
  for (let index = 0; index < (result.examples || []).length; index++) {
    const rows = (result.exampleMappings || []).filter(row => row.index === index);
    if (rows.length !== 1 || !rows[0].sourceRef || !rows[0].methodIds?.length || rows[0].methodIds.some(id => !ids.includes(id))) errors.push('Example lacks unique source/method mapping: ' + index);
  }
  const existing=examplesOf(baseline.content);
  if((result.existingExamples || []).some(row=>!Number.isInteger(row.index)||row.index<0||row.index>=existing.length))errors.push('Unknown existing-example index');
  for (let index = 0; index < existing.length; index++) {
    const rows=(result.existingExamples || []).filter(row=>row.index===index),row=rows[0];
    if(rows.length!==1 || !['kept', 'formatting', 'repaired', 'removed'].includes(row?.decision) || !row.reason || row.guttersChecked!==true || row.diagramAdequacyChecked!==true || row.annotationChecked!==true || (row.decision!=='removed'&&(!Number.isInteger(row.finalIndex)||!result.examples?.[row.finalIndex]))) errors.push('Existing example not audited/bound exactly once: ' + index);
  }
  for (const row of result.existingExamples) if (row.decision === 'removed') errors.push('Preserve existing useful examples; repair or retain existing example ' + row.index + ' rather than remove it during coverage completion');
  return errors;
}
export function validateExampleReview(review, candidate, changed) {
  const errors = [];
  if (review?.coverageComplete !== true || review?.distinctMethodsConfirmed !== true || review?.existingExamplesAudited !== true || !Array.isArray(review.findings)) errors.push('Independent method-coverage and retained-example review incomplete');
  for (const index of changed) {
    const row = review?.examples?.find(row => row.index === index);
    if (!individualExampleReviewValid(row,index)) errors.push('Independent example review incomplete: ' + index);
  }
  return [...errors, ...(review?.findings || []).map(row => typeof row === 'string' ? row : JSON.stringify(row))];
}
export function individualExampleReviewValid(row,index){
  return row?.index===index&&['sourceConfirmed','methodConfirmed','scopeConfirmed','calculationsConfirmed','answerConfirmed','diagramConsistencyConfirmed'].every(key=>row[key]===true)&&!!row.derivation?.trim();
}
export function repairPreservationProblems(before,after){
  return before?.examples?.length>after?.examples?.length?['Repair dropped staged examples; return the complete candidate, retain useful examples and add only missing coverage']:[];
}
export function questionEquationLines(before){
  if(before.includes('[tikz]')||before.includes('$$'))throw Error('Question line formatting requires simple inline mathematics');
  const after=before.replace(/(?<!\\)\$([^$]+)(?<!\\)\$/g,(span,math,offset,text)=>/[=<>]/.test(math)?(offset===0||text[offset-1]==='\n'?'':'\n')+span+(offset+span.length===text.length||text[offset+span.length]==='\n'?'':'\n'):span);
  if(before.replace(/\r?\n/g,'')!==after.replace(/\r?\n/g,''))throw Error('Question line formatting changed content');
  return after;
}
export function examplesEvidenceNeedsRefresh(root,campaignId,skillId){
  const record=read(recordFile(root,campaignId,skillId));
  if(!record||!['published','held-complete','accepted','unchanged'].includes(record.status))return true;
  const work=path.join(root,'.booklet-work/content-campaign',campaignId,'examples',skillId),before=read(path.join(work,'baseline.json')),candidate=record.candidatePath&&read(path.join(root,record.candidatePath));
  if(!before||!candidate||hashValue(candidate)!==record.candidateHash)return true;
  const required=renderInspectionRequirements(before,candidate);
  if(required.some(item=>{const row=record.inspection?.examples?.find(row=>row.index===item.index);return row?.exampleHash!==item.exampleHash||row.renderedConfirmed!==true||(item.diagramHash&&(row.diagramHash!==item.diagramHash||row.diagramInspected!==true));}))return true;
  return (record.inspection?.dependencies||[]).some(row=>!rendererDependencyCurrent(root,row,examplesOf(candidate.content),record.render?.indices));
}
const diagrams = example => Object.values(example).flatMap(value => typeof value === 'string' ? value.match(/\[tikz\][\s\S]*?\[\/tikz\]/g) || [] : value && typeof value === 'object' ? diagrams(value) : []);
export function inspectionRequirements(before, after) {
  const old = examplesOf(before.content), examples = examplesOf(after.content);
  return examples.flatMap((example, index) => old.some(prior => isDeepStrictEqual(example, prior)) ? [] : [{ index, exampleHash: hashValue(example), diagramHash: diagrams(example).length && !old.some(prior => isDeepStrictEqual(diagrams(example), diagrams(prior))) ? hashValue(diagrams(example)) : null }]);
}
export function renderInspectionRequirements(before,after){
  const changed=inspectionRequirements(before,after),seen=new Set(changed.map(row=>row.index)),fractionInk=fractionInkClearanceEnabled();
  for(const [index,example] of examplesOf(after.content).entries()){
    const hasTable=['question_text','solution_text'].some(field=>splitInlineContent(example[field]).parts.some(part=>part.type==='text'&&groupTextBlocks(part.value,{nativeTables:true}).some(block=>block.kind==='table')));
    if(hasTable&&!seen.has(index)){changed.push({index,exampleHash:hashValue(example),diagramHash:null,scope:'native source table renderer; unchanged mathematics'});seen.add(index);}
    if(fractionInk&&hasFractionMath(example)&&!seen.has(index)){changed.push({index,exampleHash:hashValue(example),diagramHash:null,scope:'fraction ink clearance; unchanged mathematics'});seen.add(index);}
  }
  return changed.sort((a,b)=>a.index-b.index);
}
export function changedSolidChecks(before, after) {
  // This task explicitly audits existing example diagrams too. Unchanged
  // mathematics retains its review; geometry defects must still be found.
  const rows=[];
  for (const [index,example] of examplesOf(after.content).entries()) visitFigures(example,figure=>{
    if (!figure.code || !isSolidCandidate(figure.code,figure.context)) return;
    rows.push({index,sourceHash:solidHash(figure.code),...inspectSolid(figure.code,{context:figure.context})});
  });
  return rows;
}
export function bindSolidReviewHashes(checks, review) {
  if (!review?.solidReviews) return review;
  const hashes = [...new Set(checks.map(row => row.sourceHash))];
  return {...review, solidReviews: review.solidReviews.map(row => {
    if(Object.hasOwn(row,'checkIndex')){
      const check=Number.isInteger(row.checkIndex)?checks[row.checkIndex]:null;
      const unique=review.solidReviews.filter(other=>other.checkIndex===row.checkIndex).length===1;
      if(!check||!unique||(row.sourceHash&&row.sourceHash!==check.sourceHash))return{...row,sourceHash:null,bindingError:'Invalid, duplicate or conflicting geometry check index'};
      return{...row,sourceHash:check.sourceHash};
    }
    if (hashes.includes(row.sourceHash) || !/^[a-f0-9]{63}$/.test(row.sourceHash || '')) return row;
    // A source-bound completed review can omit one copied hash character.
    // Recover only a unique single-deletion match in this exact candidate's
    // checks; retain the raw copied token and never repair other mismatches.
    const matches = hashes.filter(hash => hash.length === 64 && [...hash].some((_char,index) => hash.slice(0,index)+hash.slice(index+1) === row.sourceHash));
    return matches.length === 1 ? {...row, sourceHash: matches[0], copiedSourceHash: row.sourceHash} : row;
  })};
}
export function solidReviewProblems(checks, review) {
  return checks.flatMap(check=>{
    if(check.status==='defect')return ['Solid visibility defect cannot be waived: '+JSON.stringify(check)];
    if(check.status!=='review')return [];
    const row=review?.solidReviews?.find(row=>row.sourceHash===check.sourceHash);
    return row?.status==='accepted' && typeof row.solid3d==='boolean' && row.reason?.trim() && row.geometryObservation?.trim()
      && (!row.solid3d || row.visibilityObservation?.trim()) ? [] : ['Unresolved source-hashed geometry/visibility review: '+check.sourceHash];
  });
}
function assertFresh(root, record) {
  if (!isDeepStrictEqual(capturePair(root, record.skillId).expected, record.published?.expected || record.baseline)) throw new Error('Stale live baseline; diagnose before resuming');
  for (const row of record.sources) if (hashValue(fs.readFileSync(path.join(root, row.path))) !== row.hash) throw new Error('Source changed: ' + row.path);
}
export async function recoverExamplesPublication(root, campaignId, skillId) {
  const file = recordFile(root, campaignId, skillId), record = read(file);
  if (record?.status !== 'publishing') return record;
  if (skillId === 'survey-bias-ethics') throw new Error('Deliberate survey-bias-ethics publication hold');
  const candidate = read(path.join(root, record.candidatePath));
  if (hashValue(candidate) !== record.candidateHash || record.publicationIntent?.candidateHash !== record.candidateHash) throw new Error('Publication intent candidate changed');
  await recoverSkill(root, skillId);
  const live = capturePair(root, skillId);
  if (isDeepStrictEqual(live.expected, record.publicationIntent.expected)) {
    for (const source of record.sources) if (hashValue(fs.readFileSync(path.resolve(root, source.path))) !== source.hash) throw new Error('Source changed during publication recovery: ' + source.path);
    record.status = 'published';
    record.published = { expected: live.expected, recovered: true };
    save(file, record);
    return record;
  }
  if (!isDeepStrictEqual(live.expected, record.baseline)) throw new Error('Concurrent change during publication recovery; reconcile without overwriting');
  record.status = 'accepted';
  save(file, record);
  return publishExamples(root, { campaignId, skillId });
}
export function acquireExamplesLock(root, campaign, name = 'dispatcher') {
  const dir = location(root, campaign); fs.mkdirSync(dir, { recursive: true }); const file = path.join(dir, `${name}.lock`);
  try { const fd = fs.openSync(file, 'wx'); fs.writeFileSync(fd, JSON.stringify({ pid: process.pid, started: new Date().toISOString() })); fs.closeSync(fd); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    // Healthy occupied slots need no reclaim-file writes. This also avoids
    // Windows scanners turning an ordinary busy slot into a dispatch failure.
    let observed;
    try { observed=read(file); } catch { throw new Error('Examples '+name+' already active (lock read busy)'); }
    if(!observed)return acquireExamplesLock(root,campaign,name);
    try { process.kill(observed.pid,0); throw new Error('Examples '+name+' already active'); }
    catch (failure) { if(failure.code!=='ESRCH')throw failure; }
    const reclaim=file+'.reclaim';let reclaimFd;try{reclaimFd=fs.openSync(reclaim,'wx');}catch(failure){if(failure.code==='EEXIST')throw new Error('Examples '+name+' already active (lock recovery busy)');throw failure;}
    try {
      const prior = read(file); let alive = !!prior; if(prior)try { process.kill(prior.pid, 0); } catch (failure) { if (failure.code === 'ESRCH') alive = false; }
      if (alive) throw new Error('Examples ' + name + ' already active');
      if(prior)fs.unlinkSync(file); return acquireExamplesLock(root, campaign, name);
    }finally{fs.closeSync(reclaimFd);fs.unlinkSync(reclaim);}
  }
  return () => fs.unlinkSync(file);
}
export async function withExamplesWorker(root, campaign, action) {
  let release;
  for (let index = 0; index < 5; index++) { try { release = acquireExamplesLock(root, campaign, 'worker-' + index); break; } catch (error) { if (!/already active/.test(error.message)) throw error; } }
  if (!release) throw new Error('Task-wide five-worker pool is full');
  try { return await action(); } finally { release(); }
}
const RULES = `Complete only worked examples. Never alter or re-audit practice/quiz mathematics. Read retained assessments solely to classify distinct assessed methods; value variants alone are not distinct methods. Preserve suitable examples and extension fields. Audit every existing example for gutters, diagram adequacy/annotations and blue solution prose/math. Every example has separate question_text and solution_text. Adapt supplied booklet worked examples or exercises using different values, its taught method, target skill central and no more advanced skills. Use only supplied approved syllabus exceptions. Question black, entire solution prose/math blue #268cff via supported styling, preserve standing diagram palette and 10 pt ordinary labels. equationAlignment:{mode:'continuation'} supports separate fields. Bare opening expressions followed by relation-led working need \\mathrel{\\phantom{=}}; aligned form &\\mathrel{\\phantom{=}}a+b\\\\&=c. Match row colour grouping. Do not add phantom equals to independent equations. Include useful diagrams, annotate givens in solution only, keep question answers hidden. Use shared templates when supported. Solid geometry follows docs/solid-visibility.md. No subagents; no file writes.`;
const SHAPE = `{skillId,blocker:null,examples:[supported example objects],methods:[{id,description,sourceRef:'full supplied path plus line/question'}],assessmentMappings:[{where,methodIds}],exampleMappings:[{index,methodIds,sourceRef}],existingExamples:[{index,finalIndex,decision:'kept|formatting|repaired|removed',reason,guttersChecked:true,diagramAdequacyChecked:true,annotationChecked:true}],summary}`;
const DIAGRAM_RULES = `Use editable [tikz]...[/tikz] blocks for free-form diagrams, outside dollar math spans. Markdown fenced tikz blocks are unsupported. Ordinary diagram outlines/labels black #000000; final ordinary labels 10 pt, graph ticks 8.5 pt. Semantic palette blue #268cff, red #ef6068, green #4f9b63, orange #ef8b2c, purple #8b5cc7. Unshaded unless shading has a mathematical purpose. Shared number-line, fraction-bar/grid/circle and blank-grid templates where supported; preserve range, ticks, marked values, shaded fractions and givens. For 3D use explicit solid faces and actual viewing direction to derive hidden edges; silhouettes solid; labels non-drawing paths cannot repaint edges; construction/semantic lines separate. Preserve suitable examples unchanged including extension fields. Existing-example dispositions include finalIndex; kept must match original exactly, formatting must preserve mathematics, removed requires specific defect/source/coverage reason independently confirmed.`;
export async function runExamplesSkill(root, { campaignId = DEFAULT_CAMPAIGN, skillId, model = runModel, publish = false, capture = null, repair = false, finding = null, formatOnly = false, reinspect = false, gutterOnly = false, restoreStage = null, questionLines = null } = {}) {
  if(gutterOnly){repair=true;finding='Scoped mechanical repair of reported opening-expression equals gutters only; preserve every mathematical, prose and diagram byte except the verified gutter controls.';}
  if (!readCampaign(root, campaignId).skillIds.includes(skillId)) throw new Error('Skill outside frozen campaign');
  const file = recordFile(root, campaignId, skillId), work = path.join(root, '.booklet-work/content-campaign', campaignId, 'examples', skillId);
  fs.mkdirSync(work, { recursive: true });
  let record = read(file), baseline;
  if (record) {
    if (record.status === 'publishing') return recoverExamplesPublication(root, campaignId, skillId);
    if (['published','held-complete','accepted','unchanged'].includes(record.status) && !repair && !reinspect) {
      const savedBaseline=read(path.join(work,'baseline.json')),savedCandidate=read(path.join(root,record.candidatePath));
      const required=renderInspectionRequirements(savedBaseline,savedCandidate);
      const missing=required.some(item=>{const row=record.inspection?.examples?.find(row=>row.index===item.index);return row?.exampleHash!==item.exampleHash||row.renderedConfirmed!==true||(item.diagramHash&&(row.diagramHash!==item.diagramHash||row.diagramInspected!==true));});
      const stale=record.inspection?.dependencies?.some(row=>!rendererDependencyCurrent(root,row,examplesOf(savedCandidate.content),record.render?.indices));
      if(missing||stale)reinspect=true;
      else return ['published','held-complete'].includes(record.status)?record:publish ? publishExamples(root,{campaignId,skillId}) : record;
    }
    assertFresh(root, record); baseline = read(path.join(work, 'baseline.json'));
    if(repair&&record.published){
      const original=path.join(work,'original-baseline.json');if(!fs.existsSync(original))save(original,baseline);
      record.originalBaselinePath=path.relative(root,original);
      (record.publicationHistory??=[]).push({published:record.published,candidateHash:record.candidateHash,inspection:record.inspection});
      baseline=capturePair(root,skillId);record.baseline=baseline.expected;
      record.coverage.existingExamples=examplesOf(baseline.content).map((example,index)=>({index,finalIndex:index,decision:'kept',reason:'Retained live independently reviewed example; inspect the diagnosed defect only.',guttersChecked:true,diagramAdequacyChecked:true,annotationChecked:true}));
      delete record.published;delete record.publicationIntent;
      save(path.join(work,'baseline.json'),baseline);
    }
    if(repair){if(!finding?.trim())throw new Error('Diagnosed repair requires --finding');record.attempt=(record.attempt||0)+1;record.repairDiagnosis=finding;record.status='running';save(file,record);}
  }
  else {
    baseline = capturePair(root, skillId); const priorLean = read(path.join(root,'booklets/provenance/content-campaign',campaignId,'lean',skillId+'.json')); const exception = approvedSourceException(root, skillId), evidence = exception ? null : skillEvidence(root, campaignId, skillId, priorLean?.sections?.length ? priorLean.sections : null);
    const retainedSources = skillId === 'survey-bias-ethics' ? retainedSurveySource(root,campaignId) : [];
    const sourcePaths = exception ? [exception.syllabusPath, ...(exception.approvalPath ? [exception.approvalPath] : [])] : [...evidence.files,...retainedSources.map(row=>row.path)];
    record = { profile: EXAMPLES_PROFILE, skillId, status: 'running', baseline: baseline.expected, sources: [...new Set([...sourcePaths,...[...(evidence?.images || []),...(evidence?.omittedImageEntries || [])].map(row=>path.relative(root,row.file))])].map(file => ({ path: file, hash: hashValue(fs.readFileSync(path.join(root, file))) })), sourceException: exception, calls: [], startedAt: new Date().toISOString(), evidence };
    record.retainedSources = retainedSources;
    save(path.join(work, 'baseline.json'), baseline); save(file, record);
  }
  const exception = record.sourceException, evidence = record.evidence;
  if(restoreStage){
    if(!repair||!['author','repair'].includes(restoreStage))throw Error('Restore requires a diagnosed repair and canonical author/repair stage');
    const restored=read(path.join(work,restoreStage+'.accepted.json'))?.result;
    if(!restored?.examples?.length||restored.examples.length<(record.coverage?.examples?.length||0))throw Error('Canonical recovery must restore complete larger coverage');
    save(path.join(work,'before-recovery-'+record.attempt+'.json'),{coverage:record.coverage,review:record.review});
    record.coverage=structuredClone(restored);record.review=null;save(file,record);
  }
  let reviewReuse = record.coverage && record.review ? {coverage:structuredClone(record.coverage),review:structuredClone(record.review)} : null;
  const repairBefore=repair&&record.coverage?structuredClone(record.coverage):null;
  if(repairBefore)save(path.join(work,'before-maintenance-'+record.attempt+'.json'),{coverage:repairBefore,review:record.review,candidateHash:record.candidateHash,sources:record.sources});
  if (repair && !record.coverage) {
    const priorAuthor = read(path.join(work,'author.accepted.json'));
    if (priorAuthor?.result) record.coverage = priorAuthor.result;
  }
  if (skillId === 'survey-bias-ethics' && !record.retainedSources?.length) {
    record.retainedSources = retainedSurveySource(root,campaignId);
    for (const row of record.retainedSources) if (!record.sources.some(source=>source.path===row.path)) record.sources.push({path:row.path,hash:row.hash});
    save(file,record);
  }
  if (!record.sources.length || evidence?.bytes > 450000) { record.status = 'source-blocked'; record.blocker = 'Missing or oversized source evidence; diagnose source selection'; save(file, record); return record; }
  const source = exception ? 'APPROVED SOURCE EXCEPTION: ' + JSON.stringify(exception) + '\n' + fs.readFileSync(path.join(root, exception.syllabusPath), 'utf8') : evidenceText(root, evidence, null) + '\nSOURCE IMAGES NOT ATTACHED: You are explicitly authorised to use read-only view_image on these source image paths when relevant; inspect every relevant source image you rely on. Unrelated omitted images are not blockers. Return source gap only for missing necessary evidence.\n' + (evidence.omittedImageEntries || []).map(row=>row.file+' — '+row.label).join('\n');
  const scope=read(path.join(root,'booklets/provenance/content-campaign',campaignId,'skills',skillId+'.json'))?.scope;
  const packet = `\nGOVERNING SKILL SCOPE ${JSON.stringify(scope)}.\nThe CURRENT ACCEPTED PAIR is complete. Existing examples: ${examplesOf(baseline.content).length}; if zero, existingExamples must be [] and author the missing coverage. One assessmentMappings row per EXACT locator (no grouped locators or content. prefix): ${JSON.stringify(assessmentItems(baseline.content,baseline.quiz,false).filter(row=>row.kind!=='example').map(row=>row.where))}. Retain useful existing examples even when their method is supplementary to assessed methods; lack of an assessment is never a reason to delete a useful example.\nShared templates are generated by the coordinator: optionally return templateRequests:[{id,parameters}] and put [[template:id]] in a question_text or solution_text. parameters.family is number-line (min,max,step,labels:'all'|'ends'|'none',points:[{value,label,style:'open'|'closed'}],jumps:[{from,to,label}]), fraction-grid (rows,cols,shaded count or zero-based cells,shadeReason), fraction-circle (sectors,shaded count or sector indices,shadeReason), or blank-grid (rows,cols,cellMm). Use separate ids for question givens and solution annotations. Other families use editable free-form TikZ.\n`;
  const retainedText = (record.retainedSources || []).map(row => `\nRETAINED HISTORICALLY INDEPENDENTLY REVIEWED GOVERNING SOURCE (${row.path}:${row.startLine}-${row.endLine}); this is the existing survey source decision, not a new exception. Keep its publication hold.\n` + fs.readFileSync(path.join(root,row.path),'utf8').split(/\r?\n/).slice(row.startLine-1,row.endLine).map((line,index)=>(index+row.startLine)+': '+line).join('\n')).join('');
  const call = async (name, prompt, attached = evidence?.images.map(row => row.file) || []) => {
    const reviewedCandidate=record.candidatePath?read(path.join(root,record.candidatePath)):null;
    const priorChecks=reviewedCandidate?changedSolidChecks(baseline,reviewedCandidate):[];
    const priorReview=record.review?.findings?.length===0&&reviewedCandidate&&hashValue(reviewedCandidate)===record.candidateHash&&isDeepStrictEqual(examplesOf(reviewedCandidate.content),record.coverage?.examples)&&!validateExampleReview(record.review,reviewedCandidate,inspectionRequirements(baseline,reviewedCandidate).map(row=>row.index)).length&&!solidReviewProblems(priorChecks,bindSolidReviewHashes(priorChecks,record.review)).length?record.review:null;
    const completedExamples=priorReview?.examples?.filter(row=>Number.isInteger(row.index)&&record.coverage.examples[row.index]&&['sourceConfirmed','scopeConfirmed','calculationsConfirmed','answerConfirmed','diagramConsistencyConfirmed'].every(key=>row[key]===true)&&row.derivation?.trim()).map(row=>({index:row.index,exampleHash:hashValue(record.coverage.examples[row.index]),review:row}))||[];
    const exampleAcceptance=completedExamples.length?'\nCOMPLETED SOURCE-BOUND WORKED-EXAMPLE REVIEWS (current before-candidate, source files checked fresh): '+JSON.stringify({candidateHash:record.candidateHash,summary:priorReview.summary,examples:completedExamples})+'. Preserve these reviews for unchanged content and mathematically preserving formatting; do not reopen unchanged scope from historical metadata. New methods, source or assumed-knowledge changes still require independent review.\n':'';
    const acceptedAudit=read(path.join(root,'booklets/provenance/content-campaign',campaignId,'lean',skillId+'.json'));
    const acceptance=acceptedAudit?.reviewSummary?`\nRECORDED COMPLETED ASSESSMENT ACCEPTANCE (context, not an additional source exception): ${JSON.stringify({status:acceptedAudit.status,booklets:acceptedAudit.booklets,reviewSummary:acceptedAudit.reviewSummary,acceptedQuestionTypeChanges:acceptedAudit.removed})}. The current task preserves these accepted assessment methods and forbids repeating their audit. New examples still require independent mapped-booklet/source alignment and must not introduce skills beyond the target's assessed methods.\n`:'';
    const diagnosis=record.repairDiagnosis?`\nCURRENT DIAGNOSED REPAIR CONTEXT, retained through review and recheck: ${record.repairDiagnosis}\n`:'';
    prompt = workerConventions(root) + packet + retainedText + acceptance + exampleAcceptance + diagnosis + '\n' + prompt + `\nSITE FIELD FORMAT OVERRIDE: These skill fields use single-dollar inline maths only, including a complete aligned environment inside one $...$ span. Do not use $$...$$, bare TeX environments or colour-only gathered wrappers. Explanatory prose stays outside mathematics and inherits the renderer's blue. Money amounts use an escaped dollar sign inside maths. This overrides booklet-document display-dollar guidance for these supported skill fields.`;
    assertFresh(root, record);
    name = record.attempt ? `maintenance-${record.attempt}-${name}` : name;
    const inputHash=hashValue({prompt,images:attached.map(file=>hashValue(fs.readFileSync(file)))});
    const cacheFile=path.join(work,name+'.accepted.json'),cached = read(cacheFile); if (cached?.inputHash===inputHash) return cached.result;
    if(cached)fs.renameSync(cacheFile,path.join(work,name+'.historical-'+Date.now()+'.json'));
    assertFresh(root, record);
    const response = await withExamplesWorker(root, campaignId, () => {
      console.log(JSON.stringify({skillId,stage:name,event:'worker-start',priorCalls:record.calls.length}));
      return model({ root, dir: work, name, prompt, images: attached, modelId: 'gpt-6.1-sol', effort: 'low' });
    });
    record.calls.push(response.call); save(file, record);
    console.log(JSON.stringify({skillId,stage:name,event:'worker-finish',seconds:response.call?.seconds,error:response.call?.error||null}));
    if (!response.result) throw new Error(response.call?.error || 'Worker returned no JSON');
    save(path.join(work, name + '.accepted.json'), {inputHash,result:response.result}); return response.result;
  };
  if (formatOnly && (!record.coverage?.examples || !record.review || record.review.findings?.length !== 0)) throw new Error('Delimiter-only repair requires a complete accepted independent mathematical review');
  const resumeCandidate=!repair&&!formatOnly&&record.coverage&&record.review?.findings?.length===0&&record.candidatePath&&record.candidateHash;
  const completedAuthor=read(path.join(work,'author.accepted.json'));
  let gutterCandidate;
  if(gutterOnly){
    if(!record.coverage?.examples||record.review?.findings?.length!==0)throw Error('Gutter-only repair requires accepted mathematical coverage');
    gutterCandidate=structuredClone(record.coverage);const operations=[];
    gutterCandidate.examples=gutterCandidate.examples.map((example,index)=>{const repaired=repairExampleGutters(example);if(repaired.operations.length){operations.push({index,operations:repaired.operations});for(const row of gutterCandidate.existingExamples)if(row.finalIndex===index){row.decision='formatting';row.reason='Only mechanically verified gutter controls added/moved; mathematics, prose and diagrams preserved exactly.';}}return repaired.example;});
    record.gutterPreservation={operations,beforeHash:record.candidateHash,rule:'reversible-gutter-controls-only'};save(file,record);
  }
  let author = gutterCandidate || (resumeCandidate ? structuredClone(record.coverage) : formatOnly ? normaliseExampleDelimiters(record.coverage) : repair && record.coverage ? await call('diagnosed-repair',`${RULES}\n${DIAGRAM_RULES}\nDiagnosed issue ${finding}\n${source}\nBASELINE ${JSON.stringify({content:baseline.content,quiz:baseline.quiz})}\nRetained example candidate ${JSON.stringify(record.coverage)}\nRepair only the diagnosed issue and return the COMPLETE coverage object, retaining all useful examples: ${SHAPE}`) : completedAuthor?.result || await call('author', `${RULES}\n${DIAGRAM_RULES}\nSkill ${skillId}. ${source}\nCURRENT ACCEPTED PAIR ${JSON.stringify({ content: baseline.content, quiz: baseline.quiz })}\nReturn JSON only: ${SHAPE}`));
  if(questionLines){
    if(!formatOnly||!Array.isArray(questionLines))throw Error('Question line formatting requires accepted formatting-only mode');
    author=structuredClone(record.coverage);
    for(const index of questionLines){
      if(!Number.isInteger(index)||!author.examples[index])throw Error('Invalid question line index');
      author.examples[index].question_text=questionEquationLines(author.examples[index].question_text);
    }
  }
  if (author.blocker) { record.status = 'source-blocked'; record.blocker = author.blocker; save(file, record); return record; }
  const evaluate = async (result, name) => {
    const shapeProblems=validateCoverage(result,baseline);if(shapeProblems.some(error=>error.startsWith('Invalid author shape')))return{candidate:null,errors:shapeProblems,review:null};
    let candidate;try{const expanded=normaliseExampleDelimiters(materializeExampleTemplates(result));Object.assign(result,expanded);candidate=examplesCandidate(baseline,result.examples);}catch(error){return{candidate:null,errors:[error.message],review:null};}
    const changed = inspectionRequirements(baseline, candidate).map(row => row.index);
    const reusable = new Map();
    if (reviewReuse) for (const index of changed) {
      const oldIndex=reviewReuse.coverage.examples?.findIndex(example=>isDeepStrictEqual(example,result.examples[index]));
      if(oldIndex<0)continue;
      const mapping=result.exampleMappings?.find(row=>row.index===index),oldMapping=reviewReuse.coverage.exampleMappings?.find(row=>row.index===oldIndex);
      if(!mapping||!oldMapping||!isDeepStrictEqual({...mapping,index:0},{...oldMapping,index:0}))continue;
      if(!isDeepStrictEqual(result.methods.filter(row=>mapping.methodIds.includes(row.id)),reviewReuse.coverage.methods.filter(row=>oldMapping.methodIds.includes(row.id))))continue;
      const prior=reviewReuse.review.examples?.find(row=>row.index===oldIndex);
      if(individualExampleReviewValid({...prior,index},index))reusable.set(index,{...prior,index});
    }
    const reviewIndices=changed.filter(index=>!reusable.has(index));
    const validation = validateCandidatePair({ rootDir: root, skillId, ...candidate });
    let errors = [...repairPreservationProblems(repairBefore,result),...validateCoverage(result, baseline), ...(validation.errors || []),...result.examples.flatMap((example,index)=>exampleGutterProblems(example).map(problem=>'Example '+index+' equals gutter: '+JSON.stringify(problem)))];
    for(const disposition of result.existingExamples || []) if(disposition.decision==='kept' && !isDeepStrictEqual(examplesOf(baseline.content)[disposition.index],result.examples[disposition.finalIndex])) errors.push('Kept example differs from original: '+disposition.index);
    const sourcePaths=exception ? [exception.syllabusPath] : [...evidence.files,...(record.retainedSources || []).map(row=>row.path)];
    for(const row of [...(result.methods||[]),...(result.exampleMappings||[])]) if(!sourcePaths.some(file=>String(row.sourceRef).includes(file))) errors.push('Source reference does not identify supplied source: '+row.sourceRef);
    const solidChecks=changedSolidChecks(baseline,candidate);
    const freshReview = await call(name, `${RULES}\n${DIAGRAM_RULES}\nYou are an independent reviewer, never the author. Confirm distinct assessed-method mapping and complete example coverage; do not repeat accepted practice/quiz answer audit. Independently derive only these new/substantively changed examples: ${JSON.stringify(reviewIndices)}. These unchanged examples have exact content, method and source-bound independent reviews retained by the coordinator; do not repeat their mathematics: ${JSON.stringify([...reusable.keys()])}. Formatting-only changes require mathematical-preservation checks. Audit retained examples for genuine gutter/diagram/annotation defects. Read source independently. ${source}\nBASELINE ${JSON.stringify({content:baseline.content,quiz:baseline.quiz})}\nCANDIDATE AND MAPPING ${JSON.stringify(result)}\nAUTOMATED SOLID GEOMETRY CHECKS ${JSON.stringify(solidChecks.map((row,checkIndex)=>({...row,checkIndex})))}. For each status review, independently assess geometry and actual viewing direction, distinguishing planar false positives. Add solidReviews:[{checkIndex,status:'accepted',solid3d:true|false,reason,geometryObservation,visibilityObservation}]. Use each supplied zero-based checkIndex once; the coordinator binds its exact sourceHash mechanically. Do not copy hashes. Never waive status defect; require repair.\nReturn JSON {coverageComplete:true,distinctMethodsConfirmed:true,existingExamplesAudited:true,sourceExceptionConfirmed:true,examples:[{index,sourceConfirmed:true,methodConfirmed:true,scopeConfirmed:true,calculationsConfirmed:true,answerConfirmed:true,diagramConsistencyConfirmed:true,derivation:'own calculations and answer'}],findings:[],summary}. Set confirmations false for unresolved defects.`);
    const review=bindSolidReviewHashes(solidChecks,freshReview?{...freshReview,examples:changed.map(index=>freshReview.examples?.find(row=>row.index===index)||reusable.get(index)).filter(Boolean)}:null);
    errors.push(...validateExampleReview(review, candidate, changed),...solidReviewProblems(solidChecks,review));
    if(exception && review?.sourceExceptionConfirmed!==true)errors.push('Approved syllabus exception requires independent sourceExceptionConfirmed');
    if(review?.findings?.length===0 && !validateExampleReview(review,candidate,changed).length)reviewReuse={coverage:structuredClone(result),review:structuredClone(review)};
    return { candidate, errors, review };
  };
  let checked;
  if(resumeCandidate){
    const candidate=read(path.join(root,record.candidatePath));
    if(hashValue(candidate)!==record.candidateHash||!isDeepStrictEqual(candidate,examplesCandidate(baseline,author.examples)))throw Error('Saved reviewed candidate changed');
    record.review=bindSolidReviewHashes(changedSolidChecks(baseline,candidate),record.review);
    const errors=[...validateCoverage(author,baseline),...validateCandidatePair({rootDir:root,skillId,...candidate}).errors,...validateExampleReview(record.review,candidate,inspectionRequirements(baseline,candidate).map(row=>row.index)),...solidReviewProblems(changedSolidChecks(baseline,candidate),record.review),...author.examples.flatMap((example,index)=>exampleGutterProblems(example).map(problem=>'Example '+index+' equals gutter: '+JSON.stringify(problem)))];
    if(errors.length)throw Error('Saved review cannot resume: '+errors.join('; '));
    checked={candidate,review:record.review,errors:[]};
  } else if (formatOnly) {
    const before = examplesCandidate(baseline,record.coverage.examples), candidate = examplesCandidate(baseline,author.examples);
    for (let index=0;index<author.examples.length;index++) for (const field of ['question_text','solution_text']) if (questionLines?.includes(index)&&field==='question_text' ? before.content.theory.workedExamples[index][field].replace(/\r?\n/g,'')!==author.examples[index][field].replace(/\r?\n/g,'') : renderMath(before.content.theory.workedExamples[index][field]) !== renderMath(author.examples[index][field])) throw new Error('Formatting repair changed mathematical content');
    const errors=[...validateCoverage(author,baseline),...validateCandidatePair({rootDir:root,skillId,...candidate}).errors,...validateExampleReview(record.review,candidate,inspectionRequirements(baseline,candidate).map(row=>row.index))];
    if (record.sourceException && record.review.sourceExceptionConfirmed!==true) errors.push('Approved syllabus review missing');
    if(errors.length)throw new Error('Delimiter-only repair is insufficient: '+errors.join('; '));
    record.formattingPreservation={rule:questionLines?'question-newlines-only':'renderer-identical-display-delimiters',indices:questionLines||null,beforeHash:record.candidateHash,afterHash:hashValue(candidate)};
    checked={candidate,review:record.review,errors:[]};
  } else checked = await evaluate(author, 'review');
  if (checked.errors.length) {
    author = await call('repair', `${RULES}\n${DIAGRAM_RULES}\nRepair only these diagnosed example/coverage defects: ${JSON.stringify(checked.errors)}\n${source}\nBASELINE ${JSON.stringify({content:baseline.content,quiz:baseline.quiz})}\nCANDIDATE ${JSON.stringify(author)}\nReturn JSON ${SHAPE}`);
    if (author.blocker) { record.status = 'source-blocked'; record.blocker = author.blocker; save(file, record); return record; }
    checked = await evaluate(author, 'recheck');
  }
  assertFresh(root, record);
  if(!checked.candidate){record.status='needs-attention';record.findings=checked.errors;record.coverage=author;save(file,record);return record;}
  save(path.join(work, 'candidate.json'), checked.candidate);
  const publishedReinspection=!!record.published;
  Object.assign(record, { candidateHash: hashValue(checked.candidate), candidatePath: path.relative(root, path.join(work, 'candidate.json')), coverage: author, review: checked.review, findings: checked.errors, inspectionsRequired: renderInspectionRequirements(baseline, checked.candidate), exampleCount: author.examples.length, status: publishedReinspection?'published':checked.errors.length ? 'needs-attention' : 'inspection-needed' });
  if (!checked.errors.length && !record.inspectionsRequired.length) record.status = skillId === 'survey-bias-ethics' ? 'held-complete' : isDeepStrictEqual(checked.candidate.content,baseline.content) ? 'unchanged' : 'accepted';
  save(file, record);
  if (!checked.errors.length && record.inspectionsRequired.length) {
    const captureFn = capture || (await import('./examples-capture.mjs')).captureExamples;
    let rendered;
    try{rendered=await captureFn({root,skillId,candidatePair:checked.candidate,outDir:path.join(work,'rendered-'+Date.now()),exampleIndices:record.inspectionsRequired.map(row=>row.index)});}
    catch(error){record.status='render-needs-attention';record.findings=[{stage:'capture',error:error.message}];save(file,record);return record;}
    record.render = rendered; save(file,record);
    if(!rendered.passed) {record.status='render-needs-attention';record.findings=rendered.errors;save(file,record);return record;}
    const visual = await call('visual-review', `${DIAGRAM_RULES}\nIndependently inspect all attached rendered examples and question-only views. Verify black questions, every solution prose/math blue, relation gutters, readable correct diagram labels/annotations, consistent relationships and hidden solution does not reveal answers. Look at every changed diagram. Reject consequential defects (missing/cut content, unreadable labels, incorrect relationships). Cosmetic punctuation wrapping alone is nonblocking. Wide mathematics, tables and diagram label reservations may use verified horizontal scrolling. Additional math-full-ink and table-full-ink images show all data/working at native glyph size; diagram-full-ink images release only overflow clipping, preserving the original diagram geometry and glyph sizing. Inspect those complete images as well as the actual viewport and question-only views. Image order ${JSON.stringify(rendered.artifacts.map((row,i)=>({image:i+1,index:row.index,viewport:row.viewport,kind:row.kind,lineIndex:row.lineIndex})))}. Scroll checks ${JSON.stringify(rendered.rows?.flatMap(row=>row.scrollableMath?.length?[{index:row.index,viewport:row.viewport,scrollableMath:row.scrollableMath}]:[])||[])}. Candidate ${JSON.stringify(checked.candidate)}. Required ${JSON.stringify(record.inspectionsRequired)}. Return JSON {accepted:true,reviewer:'independent visual model',examples:[{index,renderedConfirmed:true,diagramInspected:true}],findings:[],nonblockingFindings:[],summary}. The coordinator binds hashes mechanically to your inspected indices; do not copy hashes. Reject genuine defects; do not infer inspection from DOM checks.`,rendered.artifacts.map(row=>path.resolve(root,row.path)));
    if(visual.accepted!==true || !Array.isArray(visual.findings) || visual.findings.length) {record.status='visual-needs-attention';record.findings=visual.findings||['Incomplete visual inspection'];save(file,record);return record;}
    const input=path.join(work,'visual-inspection.json');save(input,{...visual,examples:bindVisualIndices(visual,record.inspectionsRequired),candidateHash:record.candidateHash,evidence:rendered.artifacts.map(row=>({path:row.path,hash:row.hash})),dependencies:rendered.dependencies});
    record=recordExamplesInspection(root,{campaignId,skillId,evidenceFile:input});
  }
  if (publish && ['accepted','unchanged'].includes(record.status) && skillId !== 'survey-bias-ethics') return publishExamples(root, {campaignId,skillId});
  return record;
}
export function recordExamplesInspection(root, { campaignId = DEFAULT_CAMPAIGN, skillId, evidenceFile }) {
  const file = recordFile(root,campaignId,skillId), record = read(file), inspection = read(evidenceFile);
  assertFresh(root,record);
  if(inspection?.accepted!==true || !Array.isArray(inspection.findings) || inspection.findings.length || record.render?.passed!==true || record.render.candidateHash!==record.candidateHash)throw new Error('Actual accepted inspection needs a successful current render');
  if (inspection?.candidateHash !== record.candidateHash || !inspection.reviewer || !inspection.evidence?.length || inspection.evidence.some(row => !row.path || !row.hash || !fs.existsSync(path.resolve(root,row.path)) || hashValue(fs.readFileSync(path.resolve(root,row.path)))!==row.hash)) throw new Error('Actual inspection needs current candidate hash, reviewer and hash-bound rendered evidence');
  const renderedEvidence=record.render.artifacts.map(row=>({path:row.path,hash:row.hash}));
  if(!isDeepStrictEqual(inspection.evidence,renderedEvidence)||!isDeepStrictEqual(inspection.dependencies,record.render.dependencies))throw new Error('Inspection must cover exactly current rendered artifacts and dependencies');
  for (const required of record.inspectionsRequired) {
    const row = inspection.examples?.find(row => row.index === required.index);
    if (row?.exampleHash !== required.exampleHash || row.renderedConfirmed !== true || (required.diagramHash && (row.diagramHash !== required.diagramHash || row.diagramInspected !== true))) throw new Error('Missing current rendered/diagram inspection: '+required.index);
  }
  record.inspection = inspection; record.status = record.findings.length ? 'needs-attention' : record.published?'published':skillId === 'survey-bias-ethics' ? 'held-complete' : 'accepted'; save(file,record); return record;
}
export function bindVisualIndices(visual,required){
  if(!Array.isArray(visual.examples)||new Set(visual.examples.map(row=>row.index)).size!==visual.examples.length||visual.examples.some(row=>!required.some(item=>item.index===row.index)))throw Error('Visual inspection has duplicate or unknown indices');
  return required.map(item=>{const row=visual.examples.find(row=>row.index===item.index);if(row?.renderedConfirmed!==true||(item.diagramHash&&row.diagramInspected!==true))throw Error('Missing actual visual confirmation: '+item.index);return {...row,exampleHash:item.exampleHash,diagramHash:item.diagramHash};});
}
export async function publishExamples(root,{campaignId=DEFAULT_CAMPAIGN,skillId}={}) {
  if(skillId==='survey-bias-ethics') throw new Error('Deliberate survey-bias-ethics publication hold');
  const file=recordFile(root,campaignId,skillId),record=read(file);
  if(record?.status==='published') return record;
  if(!['accepted','unchanged'].includes(record?.status)) throw new Error('Examples are not independently reviewed and inspected');
  assertFresh(root,record); const candidate=read(path.join(root,record.candidatePath)),baseline=read(path.join(path.dirname(path.join(root,record.candidatePath)),'baseline.json'));
  if(hashValue(candidate)!==record.candidateHash || !isDeepStrictEqual(immutable(candidate),immutable(baseline))) throw new Error('Candidate changed after review or immutable fields changed');
  const errors=[...validateCoverage(record.coverage,baseline),...validateExampleReview(record.review,candidate,inspectionRequirements(baseline,candidate).map(row=>row.index))];
  errors.push(...solidReviewProblems(changedSolidChecks(baseline,candidate),record.review));
  errors.push(...record.coverage.examples.flatMap((example,index)=>exampleGutterProblems(example).map(problem=>'Example '+index+' equals gutter: '+JSON.stringify(problem))));
  if(record.sourceException && record.review?.sourceExceptionConfirmed!==true)errors.push('Approved syllabus exception confirmation missing');
  if(errors.length)throw new Error('Review no longer valid: '+errors.join('; '));
  if(renderInspectionRequirements(baseline,candidate).length){
    const inspection=record.inspection;
    if(inspection?.accepted!==true || inspection.findings?.length!==0 || record.render?.passed!==true || record.render.candidateHash!==record.candidateHash || inspection?.candidateHash!==record.candidateHash || !isDeepStrictEqual(inspection.evidence,record.render.artifacts.map(row=>({path:row.path,hash:row.hash}))) || inspection.evidence.some(row=>hashValue(fs.readFileSync(path.resolve(root,row.path)))!==row.hash))throw new Error('Rendered inspection changed');
    for(const required of renderInspectionRequirements(baseline,candidate)){const row=inspection.examples?.find(row=>row.index===required.index);if(row?.exampleHash!==required.exampleHash || row.renderedConfirmed!==true || (required.diagramHash && (row.diagramHash!==required.diagramHash || row.diagramInspected!==true)))throw new Error('Missing actual inspection: '+required.index);}
    for(const row of inspection.dependencies || [])if(!rendererDependencyCurrent(root,row,examplesOf(candidate.content),record.render?.indices))throw new Error('Renderer changed after inspection: '+row.path);
  }
  if(isDeepStrictEqual(candidate.content,baseline.content)){record.status='unchanged';save(file,record);return record;}
  record.publicationIntent = { candidateHash: record.candidateHash, expected: {
    contentHash: contentHash(preserveJsonBytes(baseline.contentRaw, candidate.content)),
    quizHash: baseline.quizRaw === null ? null : contentHash(preserveJsonBytes(baseline.quizRaw, candidate.quiz)),
  } };
  record.status = 'publishing'; save(file, record);
  const published=await publishSkill(root,skillId,{expected:record.baseline,candidateContent:candidate.content,candidateQuiz:candidate.quiz});
  record.status='published'; record.published={expected:published.expected,journalPath:published.journalPath}; save(file,record);return record;
}
export function examplesStatus(root,campaign=DEFAULT_CAMPAIGN) {
  const ids=readCampaign(root,campaign).skillIds,counts={},liveMissingIds=[],sourceGaps=[];let stagedExampleCount=0,liveExamples=0,liveSkillsWithExamples=0,stagedHeldExampleCount=0,examplesAdded=0,existingExamplesRepaired=0,coverageCompleteSkills=0;
  for(const id of ids){
    const record=read(recordFile(root,campaign,id)),status=record?.status||'unstarted';counts[status]=(counts[status]||0)+1;stagedExampleCount+=record?.exampleCount||0;
    const live=examplesOf(capturePair(root,id).content);liveExamples+=live.length;if(live.length)liveSkillsWithExamples++;else liveMissingIds.push(id);
    if(['published','unchanged','held-complete','accepted'].includes(status)){
      coverageCompleteSkills++;
      const baselinePath=record.originalBaselinePath||path.join('.booklet-work/content-campaign',campaign,'examples',id,'baseline.json');
      const original=examplesOf(read(path.join(root,baselinePath)).content),final=record.coverage.examples;
      examplesAdded+=Math.max(0,final.length-original.length);existingExamplesRepaired+=original.filter(example=>!final.some(current=>isDeepStrictEqual(example,current))).length;
    }
    if(status==='held-complete')stagedHeldExampleCount+=record.exampleCount||0;
    if(status==='source-blocked')sourceGaps.push({skillId:id,reason:record.blocker});
  }
  return {campaignId:campaign,skills:ids.length,counts,liveExamples,liveSkillsWithExamples,liveMissingIds,coverageCompleteSkills,stagedExampleCount,stagedHeldExampleCount,examplesAdded,existingExamplesRepaired,sourceGaps};
}
export async function examplesMain(argv=process.argv.slice(2)) {
  const command=argv.shift(),value=(flag,fallback=null)=>{const i=argv.indexOf(flag);return i<0?fallback:argv[i+1];};
  const root=path.resolve(value('--root',path.join(path.dirname(fileURLToPath(import.meta.url)),'../..'))),campaignId=value('--campaign',DEFAULT_CAMPAIGN);
  if(command==='status'){console.log(JSON.stringify(examplesStatus(root,campaignId),null,2));return;}
  const ids=value('--ids')?.split(',').filter(Boolean)||readCampaign(root,campaignId).skillIds;
  if(command==='inspect'){if(ids.length!==1||!value('--input'))throw new Error('inspect requires --ids one-id --input inspection.json');console.log(JSON.stringify(recordExamplesInspection(root,{campaignId,skillId:ids[0],evidenceFile:path.resolve(root,value('--input'))})));return;}
  if(command==='publish'){for(const skillId of ids)console.log(JSON.stringify(await publishExamples(root,{campaignId,skillId})));return;}
  if(command!=='run')throw new Error('Commands: run, status, inspect, publish');
  const concurrency=Number(value('--concurrency',5));if(!Number.isInteger(concurrency)||concurrency<1||concurrency>5)throw new Error('Concurrency must be 1–5');
  const release=acquireExamplesLock(root,campaignId);
  try {
    const repair=argv.includes('--repair'),finding=value('--finding'),formatOnly=argv.includes('--format-delimiters'),reinspect=argv.includes('--reinspect'),gutterOnly=argv.includes('--format-gutters');
    if(repair&&(!value('--ids')||!finding))throw new Error('Diagnosed --repair requires explicit --ids and --finding');
    if(formatOnly&&(!value('--ids')||repair))throw new Error('Delimiter-only repair requires explicit --ids and cannot combine --repair');
    if(gutterOnly&&(!value('--ids')||repair||formatOnly))throw Error('Gutter-only repair requires explicit --ids and cannot combine other repair modes');
    const diagnoses=value('--diagnoses')?read(path.resolve(root,value('--diagnoses'))):[];
    if(!Array.isArray(diagnoses)||diagnoses.some(row=>!ids.includes(row.skillId)||!row.finding?.trim())||new Set(diagnoses.map(row=>row.skillId)).size!==diagnoses.length)throw Error('Diagnoses require unique campaign skills and concrete findings');
    const diagnosed=new Set(diagnoses.map(row=>row.skillId));
    const queue=[...diagnoses.map(row=>({skillId:row.skillId,repair:!row.reinspect&&!row.questionLines,finding:row.finding,gutterOnly:row.gutterOnly===true,reinspect:row.reinspect===true,restoreStage:row.restoreStage,questionLines:row.questionLines,formatOnly:!!row.questionLines})),...ids.filter(id=>!diagnosed.has(id)).flatMap(skillId=>{
      const status=read(recordFile(root,campaignId,skillId))?.status||'unstarted';
      if(repair||formatOnly||reinspect||gutterOnly)return [{skillId,repair,finding,formatOnly,reinspect,gutterOnly}];
      if(argv.includes('--verify-published')&&['published','unchanged','held-complete'].includes(status))return [{skillId,reinspect:true}];
      if(['published','held-complete'].includes(status)&&examplesEvidenceNeedsRefresh(root,campaignId,skillId))return [{skillId,reinspect:true}];
      return ['running','unstarted','publishing','inspection-needed','visual-needs-attention','render-needs-attention',...(argv.includes('--publish')?['accepted','unchanged']:[])].includes(status)?[{skillId}]:[];
    })];
    await Promise.all(Array.from({length:concurrency},async()=>{
      while(queue.length){const job=queue.shift();try{
        const record=await runExamplesSkill(root,{campaignId,...job,publish:argv.includes('--publish')});
        console.log(JSON.stringify({skillId:job.skillId,status:record.status,examples:record.exampleCount}));
      }catch(error){console.log(JSON.stringify({skillId:job.skillId,status:'failed',error:error.message}));}}
    }));
  }finally{release();}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) await examplesMain();
