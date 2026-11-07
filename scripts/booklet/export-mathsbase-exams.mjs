// Read-only candidate export. Never writes MathsBase, a project or the question bank.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {approvedMathsBaseSource} from '../../src/lib/question-source.js';
import {createProgrammeExamSection} from '../../pedagogy/programme-exam.mjs';

export function selectExamCandidates(rows, mapping = {}) {
  // Up to perArchetype questions per reviewed skill/archetype pair (James, 7 November 2026: two, was one).
  const selected = [], held = [], excluded = [], archetypes = new Map(), cap = mapping.perArchetype ?? 2;
  for (const row of rows) {
    const source = approvedMathsBaseSource(row.source);
    if (!source || !['Development','Mastery','Challenge'].includes(row.difficulty)) {excluded.push({id:row.id, source:row.source, reason:'source or difficulty outside whitelist'}); continue;}
    if (source.needsSchoolMapping) {
      held.push({id:row.id, source:row.source, reason:'school source label needs an approved literal mapping'}); continue;
    }
    const assessment = mapping.questions?.[row.id];
    if (!assessment?.skillId || !assessment?.archetype || assessment.routine !== true || assessment.inScope !== true) {
      held.push({id:row.id, source:row.source, label:source.label, reason:'needs routine, in-scope, skill and archetype assessment'}); continue;
    }
    if (!(mapping.skillIds ?? []).includes(assessment.skillId)) {held.push({id:row.id, reason:'assessed skill is outside booklet skills'}); continue;}
    const key = `${assessment.skillId}:${assessment.archetype}`;
    if ((archetypes.get(key) ?? 0) >= cap) {excluded.push({id:row.id, reason:'archetype already represented'}); continue;}
    archetypes.set(key, (archetypes.get(key) ?? 0) + 1);
    selected.push({externalId:row.id, source, sourceCode:row.source, skillId:assessment.skillId, archetype:assessment.archetype, question:row.question_text, solution:row.solution_text, difficulty:row.difficulty});
  }
  return {selected, held, excluded};
}

// Programme-native candidate producer. One-off wrappers may also call the shared
// section builder directly, but must not replace it with a generic schema check.
export function buildProgrammeExamSection(rows, mapping, {blocks = [], section = {}} = {}) {
  const selection = selectExamCandidates(rows, mapping), held = [...selection.held];
  if (!String(mapping.projectId ?? '').trim()) held.push({reason: 'explicit programme projectId is required'});
  const selected = new Map(selection.selected.map(row => [row.externalId, row]));
  const seen = new Set();
  for (const block of blocks) {
    if (block.type !== 'question') continue;
    const origin = block.sourceReview?.origin, row = selected.get(origin?.externalId);
    if (!row || origin.sourceCode !== row.sourceCode || seen.has(origin.externalId)) {
      held.push({id: block.id, reason: 'native owner must bind one selected raw source identity and literal source code'});
      continue;
    }
    seen.add(origin.externalId);
  }
  for (const row of selection.selected) if (!seen.has(row.externalId)) held.push({id: row.externalId, reason: 'selected raw source has no bound native question owner'});
  // A split part 2 keeps its old section id: pass mapping.examSectionId (an existing role: exam section id) to reuse it.
  const id = mapping.examSectionId ?? mapping.projectId + '-exam-questions';
  const result = createProgrammeExamSection({id, topicId: id, title: 'Exam questions', ...section, blocks});
  held.push(...result.report.held);
  return {section: held.length ? null : result.section, report: {status: held.length ? 'held' : 'candidate-only', held, selected: selection.selected, excluded: selection.excluded, publication: false}};
}

export async function readMathsBase({root, subtopicIds, fetcher = fetch}) {
  if (!subtopicIds.length || subtopicIds.some(id => !Number.isSafeInteger(id) || id < 1)) throw Error('Explicit positive MathsBase subtopicIds are required; no unscoped export');
  const config = await fs.readFile(path.join(root, 'js/config.js'), 'utf8');
  const base = config.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)/)?.[1];
  const key = config.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)/)?.[1];
  if (!base || !key) throw Error('MathsBase public read configuration not found');
  // Use the sibling's supported Questions.fetch data layer. Its table is sealed;
  // fetch_questions is the documented filtered, read-only access route.
  const source = await fs.readFile(path.join(root,'js/questions.js'),'utf8');
  const context = vm.createContext({console, supabaseClient:{rpc:async (name,args)=>{
    if(name !== 'fetch_questions')throw Error('Only the documented read-only fetch_questions RPC is permitted');
    const result=await fetcher(new URL('/rest/v1/rpc/fetch_questions',base),{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(args)});
    if(!result.ok)throw Error(`MathsBase read denied/failed: HTTP ${result.status}`);
    return {data:await result.json(),error:null};
  }}});
  vm.runInContext(source+'\n globalThis.readQuestions = Questions;',context,{filename:'MathsDatabase/js/questions.js',timeout:1000});
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const {data:page} = await context.readQuestions.fetch({subtopic:subtopicIds,difficulty:['Development','Mastery','Challenge'],limit:500,offset,sort_by:'source',sort_dir:'asc'});
    if (!Array.isArray(page)) throw Error('Unexpected MathsBase response');
    rows.push(...page);
    if (page.length < 500) return rows;
  }
}

async function main() {
  const args = process.argv.slice(2), option = name => args.includes(name) ? args[args.indexOf(name)+1] : undefined;
  if (!args.includes('--mapping') || !args.includes('--out')) throw Error('Usage: node scripts/booklet/export-mathsbase-exams.mjs --mapping FILE --out DIRECTORY [--input ROWS.json | --mathsbase-root D:/WebApps/MathsDatabase] [--native-blocks FILE]');
  const mapping = JSON.parse(await fs.readFile(option('--mapping'), 'utf8'));
  const rows = args.includes('--input') ? JSON.parse(await fs.readFile(option('--input'),'utf8')) : await readMathsBase({root:option('--mathsbase-root') ?? 'D:/WebApps/MathsDatabase', subtopicIds:mapping.subtopicIds ?? []});
  const report = {status:'pilot-approval-required', projectId:mapping.projectId, labelMappingApproved:mapping.labelMappingApproved === true, fetched:rows.length, ...selectExamCandidates(rows,mapping)};
  await fs.mkdir(option('--out'),{recursive:true});
  await fs.writeFile(path.join(option('--out'),'mathsbase-candidates.json'),JSON.stringify({report,rows},null,2)+'\n');
  let programmeExam;
  if (args.includes('--native-blocks')) {
    const blocks = JSON.parse(await fs.readFile(option('--native-blocks'), 'utf8'));
    programmeExam = buildProgrammeExamSection(rows, mapping, {blocks, section: mapping.programmeExamSection});
    await fs.writeFile(path.join(option('--out'), 'programme-exam-candidate.json'), JSON.stringify(programmeExam, null, 2) + '\n');
  }
  console.log(JSON.stringify({status:programmeExam?.report.status ?? report.status, fetched:report.fetched,selected:report.selected.length,held:programmeExam?.report.held.length ?? report.held.length,excluded:report.excluded.length,...(programmeExam ? {sectionCreated: !!programmeExam.section} : {})}));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error=>{console.error(error.message);process.exitCode=1;});
