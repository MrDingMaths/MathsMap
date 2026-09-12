// Flexible document structure. Page boundaries and display numbers are derived,
// never written back into source questions or bank records.
import { normalizeEditableProject } from './editable-booklet-model.js';
import { teachingAnswerCategory } from './booklet-answer-options.js';
import { captureQuestionPresentation, remapQuestionPresentation } from './question-presentation.js';

const copy = value => JSON.parse(JSON.stringify(value));
export const flowId = () => `flow-${globalThis.crypto.randomUUID()}`;
export const isFlexible = project => project?.settings?.paginationMode === 'flexible';
export const FLOW_EDITIONS = [
  ['student', 'Questions only'], ['with-short', 'Questions and short answers'],
  ['with-worked', 'Questions and worked solutions'], ['short', 'Short answers only'], ['worked', 'Worked solutions only'],
];
export const LINEAR_TOPIC_RANGES = [[3,12],[13,14],[15,22],[23,28],[29,41],[42,49],[50,57],[58,64],[65,72],[73,80],[81,88],[89,93]];
const practiceStarts = new Set([6,14,17,26,31,39,45,52,59,68,76,86,91]);
const tiers = new Set(['Foundation','Development','Mastery','Challenge']);
export const isPractice = block => block.type === 'question' && !teachingAnswerCategory(block) && !block.sourceAtom && !['theory','definition','key-ideas'].includes(block.pedagogyRole);

export function convertToFlexible(source, { linear = source.id === 'linear-relationships-complete-v1', preserveLayout = linear, assignments = {} } = {}) {
  const next = copy(source);
  next.settings = { ...next.settings, paginationMode:'flexible', preserveSourcePages:false, flowEdition:'student' };
  next.topics = [];
  next.sections = [];
  let previousKey = '', current;
  for (const section of source.sections) {
    const page = section.sourcePageNumber;
    const range = linear && LINEAR_TOPIC_RANGES.find(([a,b]) => page >= a && page <= b);
    const first = range && source.sections.find(s => s.sourcePageNumber === range[0]);
    const assignment = assignments[section.id];
    const topicId = assignment?.topicId ?? (range ? `linear-topic-${range[0]}` : `topic-${section.id}`);
    if (!next.topics.some(t => t.id === topicId)) next.topics.push({id:topicId,title:assignment?.topicTitle ?? first?.title ?? section.title});
    let phase = assignment?.phase ?? (range ? (page >= [...practiceStarts].find(n => n >= range[0] && n <= range[1]) ? 'practice':'teaching') : section.phase ?? (section.role === 'front-matter' ? 'front-matter':/practice/.test(section.role??'')?'practice':'teaching'));
    let difficulty = assignment?.difficulty ?? (tiers.has(section.title) ? section.title : null);
    if (range && !difficulty && current?.topicId === topicId && phase === 'practice') difficulty = current.difficulty;
    if (linear && [37,38].includes(page)) difficulty = null;
    if(!section.blocks.length){current={id:`flow-section-${next.sections.length+1}`,topicId,title:section.title,role:phase,phase,difficulty,headingStyle:'page-title',blocks:[]};next.sections.push(current);previousKey='';}
    for (const original of section.blocks) {
      const block = copy(original);
      block.sourcePageNumber ??= page;
      block.sourceSectionId ??= section.id;
      if (linear && [37,38].includes(page)) phase = block.type === 'question' ? 'practice':'teaching';
      if (linear && ['page-18-q2','page-19-q2','page-20-q2'].includes(block.id)) block.flow = {...block.flow, continuationOf:'page-17-q2'};
      if (block.continuationOf) block.flow = {...block.flow,continuationOf:block.continuationOf};
      const key = `${topicId}|${phase}|${difficulty ?? ''}|${linear || assignment?.joinPrevious ? '' : section.id}`;
      if (key !== previousKey || !current) {
        current = {id:`flow-section-${next.sections.length+1}`,topicId,title:phase === 'front-matter' ? section.title : phase === 'teaching' ? 'Teaching' : difficulty ?? 'Practice',role:phase,phase,difficulty,headingStyle:'page-title',blocks:[]};
        next.sections.push(current); previousKey = key;
      }
      current.blocks.push(block);
    }
  }
  return preserveLayout ? matchSourceLayout(next,source) : normalizeEditableProject(next);
}

export function logicalUnits(project, section = null) {
  const sections = section ? [section] : project.sections;
  const units = [];
  for (const s of sections) for (const block of s.blocks) {
    const continuation = block.flow?.continuationOf ?? block.continuationOf;
    const prior = units.at(-1);
    if (prior && (continuation && prior.blocks.some(b => b.id === continuation || b.flow?.continuationOf === continuation) || block.sourceAtom?.id && prior.blocks.at(-1).sourceAtom?.id === block.sourceAtom.id || prior.blocks.at(-1).pairedBlockId === block.id)) prior.blocks.push(block);
    else units.push({id:block.id,sectionId:s.id,blocks:[block]});
  }
  return units;
}

// Preserve an imported layout as editable boundaries, not page-owned content.
// Source-only breaks apply to the question edition; answers still flow freely.
export function matchSourceLayout(project, source) {
  const next=copy(project), originals=new Map(source.sections.flatMap(s=>s.blocks.map(b=>[b.id,{block:b,section:s}])));
  let previousPage=null;
  for(const section of next.sections){
    delete section.numberingStart;
    const first=originals.get(section.blocks[0]?.id);
    section.pageBreakBefore=first?.section.sourcePageNumber!==previousPage;
    if(section.phase==='practice'&&!section.difficulty)section.showDifficultyHeading=false;
    let withinPage=null;
    for(const block of section.blocks){
      const original=originals.get(block.id);if(!original)throw Error(`No original layout for ${block.id}`);
      const page=original.section.sourcePageNumber;
      block.flow={...block.flow,sourcePageBreakBefore:withinPage!==null&&page!==withinPage};
      if(block.flow.continuationOf||block.continuationOf)block.flow.sourceContinuationLabel=true;
      delete block.flow.numberGapBefore;delete block.flow.numberResetBefore;
      withinPage=page;previousPage=page;
    }
  }
  const counts=new Map(),numbered=new Set();
  for(const section of next.sections)for(const block of section.blocks){
    if(!isPractice(block))continue;
    const continuation=block.flow?.continuationOf??block.continuationOf;
    if(numbered.has(continuation)){numbered.add(block.id);continue;}
    const expected=(counts.get(section.topicId)??0)+1;
    const number=Number(originals.get(block.id).block.sourceOrder)||expected;
    if(number<expected){
      if(section.blocks.find(isPractice)===block)section.numberingStart=number;
      else block.flow.numberResetBefore=number;
    }
    else if(number>expected)block.flow.numberGapBefore=number-expected;
    counts.set(section.topicId,number);
    numbered.add(block.id);
  }
  return normalizeEditableProject(next);
}

export function flowNumbers(project) {
  const numbers = {}, counts = new Map();
  for (const section of project.sections) {
   if(project.settings?.exerciseOrganisation!=='topic'&&section.numberingStart!=null&&section.blocks.some(isPractice))counts.set(section.topicId,section.numberingStart-1);
   for(const block of section.blocks) {
    if (!isPractice(block)) continue;
    const continuation=block.flow?.continuationOf??block.continuationOf;
    if(numbers[continuation]!=null){numbers[block.id]=numbers[continuation];continue;}
    const n = project.settings?.exerciseOrganisation==='topic' ? (counts.get(section.topicId)??0)+1 : block.flow?.numberResetBefore ?? (counts.get(section.topicId) ?? 0) + 1 + (block.flow?.numberGapBefore??0); counts.set(section.topicId,n);
    numbers[block.id] = n;
   }
  }
  return numbers;
}

export function exerciseNumbers(project) {
  if(project.settings?.exerciseOrganisation!=='topic')return {};
  const result={};let number=0;
  for(const section of project.sections)if(section.blocks.some(isPractice)&&result[section.topicId]==null)result[section.topicId]=++number;
  return result;
}

export function selectedFlowIds(project, ids) {
  const wanted = new Set(ids);
  const units=logicalUnits(project),blocks=project.sections.flatMap(s=>s.blocks);
  let changed=true;
  while(changed){const size=wanted.size;
    for(const unit of units)if(unit.blocks.some(b=>wanted.has(b.id)))unit.blocks.forEach(b=>wanted.add(b.id));
    for(const block of blocks){const related=[block.id,...(block.dependsOn??[]),...(block.pairedBlockId?[block.pairedBlockId]:[])];if(related.some(id=>wanted.has(id)))related.filter(id=>blocks.some(b=>b.id===id)).forEach(id=>wanted.add(id));}
    changed=size!==wanted.size;
  }
  return blocks.filter(b=>wanted.has(b.id)).map(b=>b.id);
}

export function captureFlowClipboard(project, ids, mode='copy') {
  const selected = new Set(selectedFlowIds(project,ids));
  const blocks = project.sections.flatMap(s => s.blocks).filter(b => selected.has(b.id)).map(b => ({...copy(b),presentation:captureQuestionPresentation(b,project.settings.layoutOverrides)}));
  if (!blocks.length) throw Error('Select content first.');
  const nodeIds=new Set();const scan=value=>{if(!value||typeof value!=='object')return;if(value.id)nodeIds.add(value.id);Object.values(value).forEach(v=>Array.isArray(v)?v.forEach(scan):scan(v));};blocks.forEach(scan);
  const mappings=Object.fromEntries(Object.entries(project.studio?.atoms??{}).filter(([id])=>nodeIds.has(id)).map(([id,value])=>[id,copy(value)]));
  return {projectId:project.id,mode,ids:[...selected],blocks,mappings};
}

function duplicateBlocks(blocks) {
  const ids = new Map();
  const skip = new Set(['bankRef','classification','source','originalDiagram','spec','continuationSources']);
  const walk = value => {
    if (!value || typeof value !== 'object') return;
    if (typeof value.id === 'string' && !ids.has(value.id)) ids.set(value.id,flowId());
    for (const [key,child] of Object.entries(value)) if (!skip.has(key)) Array.isArray(child) ? child.forEach(walk) : walk(child);
  };
  blocks.forEach(walk);
  const resultBlocks=blocks.map(block => {
    const result = remapQuestionPresentation(copy(block),ids);
    const restoreEvidence=(original,mapped)=>{if(!original||typeof original!=='object'||!mapped)return;for(const [key,value] of Object.entries(original)){if(skip.has(key))mapped[key]=copy(value);else if(value&&typeof value==='object')restoreEvidence(value,mapped[key]);}};
    restoreEvidence(block,result);
    result.bankRef = copy(block.bankRef ?? null);
    result.canonicalId = block.canonicalId;
    result.classification = copy(block.classification ?? {});
    // Source identities are provenance, even for a new local placement.
    for (const key of ['sourceSectionId','sourcePageNumber','continuationSources','originalDiagram']) if (block[key] !== undefined) result[key] = copy(block[key]);
    return result;
  });
  return {blocks:resultBlocks,ids};
}

export function flowCommand(project, command) {
  const next = copy(project);
  const ids = new Set(selectedFlowIds(project,command.ids ?? []));
  const section = next.sections.find(s => s.id === command.sectionId);
  if (command.type === 'layout') {
    for (const s of next.sections) for (const b of s.blocks) if (ids.has(b.id)) b.flow = {...b.flow,...command.patch};
  } else if (command.type === 'delete') {
    for (const s of next.sections) s.blocks = s.blocks.filter(b => !ids.has(b.id));
  } else if (['move','paste','duplicate'].includes(command.type)) {
    if (!section) throw Error('Choose a destination section.');
    const clip = command.clipboard ?? captureFlowClipboard(project,[...ids],command.type === 'move' ? 'cut':'copy');
    if (clip.projectId !== project.id) throw Error('Paste is available within the current booklet.');
    const moving = clip.mode === 'cut';
    const currentIds = new Set(project.sections.flatMap(s => s.blocks.map(b => b.id)));
    if (moving && clip.ids.some(id => !currentIds.has(id))) throw Error('Cut content changed or was deleted. Select it again.');
    if (moving && clip.ids.includes(command.beforeId)) return project;
    const duplicated=moving?null:duplicateBlocks(clip.blocks);
    const blocks = moving ? project.sections.flatMap(s => s.blocks).filter(b => clip.ids.includes(b.id)).map(copy) : duplicated.blocks;
    // Imported numbering exceptions belong to the original position. Moving or
    // copying content uses the destination's running question numbers.
    for(const block of blocks)if(block.flow){delete block.flow.numberGapBefore;delete block.flow.numberResetBefore;}
    if(duplicated){
      next.studio={version:1,atoms:{},lineage:{},flags:[],...next.studio};
      for(const [oldId,newId] of duplicated.ids){if(clip.mappings?.[oldId])next.studio.atoms[newId]=copy(clip.mappings[oldId]);next.studio.lineage[newId]={sourceIds:[oldId]};}
    }
    if (moving) for (const s of next.sections) s.blocks = s.blocks.filter(b => !clip.ids.includes(b.id));
    const at = command.beforeId == null ? section.blocks.length : section.blocks.findIndex(b => b.id === command.beforeId);
    if (at < 0) throw Error('The insertion point changed. Choose it again.');
    section.blocks.splice(at,0,...blocks);
  } else throw Error('Unknown booklet command.');
  return normalizeEditableProject(next);
}

export function flowEditionSections(project, edition='student') {
  const numbers = flowNumbers(project), topics = new Map((project.topics ?? []).map(t => [t.id,t.title]));
  const exercises=exerciseNumbers(project);
  const answers = edition.includes('short') ? 'short':'worked';
  const sections = project.sections.filter(s => s.role !== 'candidate-pool');
  if(project.settings?.generatedCover&&!sections.some(s=>s.phase==='front-matter'&&(s.isCover||s.blocks.some(b=>b.sourcePageNumber===1)))){
    const cover=project.settings.cover??{};
    sections.unshift({id:`${project.id}-generated-cover`,title:project.title,phase:'front-matter',role:'front-matter',isCover:true,blocks:[{
      id:`${project.id}-cover`,type:'rich-text',content:`Name: ______________________\n\n${cover.course??'Mathematics'}\n\n# ${project.title}\n\n**${cover.book??'Book 1'}**\n\nVersion: ${cover.version??''}\nFeedback: ${cover.feedback??'https://MrDingMaths.com'}`
    }]});
  }
  const teachingLabels=new Map(),teachingCounts=new Map();
  if(project.settings?.includeTeachingAnswers)for(const section of sections)for(const block of section.blocks){
    const category=teachingAnswerCategory(block);
    if(block.type!=='question'||!category||category==='theory')continue;
    const prefix={review:'R',guided:'G',identify:'A',keyIdeas:'K'}[category],key=`${section.topicId}:${prefix}`;
    const count=(teachingCounts.get(key)??0)+1;teachingCounts.set(key,count);
    teachingLabels.set(block.id,`${prefix}${count}`);
  }
  // Source pages and teaching checkpoints can split one exercise into many
  // sections. Its heading belongs to the first non-empty practice section only.
  const exerciseStarts = new Map();
  for (const section of sections) if (section.phase==='practice' && section.blocks.some(b=>!b.presentation?.editorOnly) && exercises[section.topicId] && !exerciseStarts.has(section.topicId)) exerciseStarts.set(section.topicId,section);
  const startsExercise = section => exerciseStarts.get(section.topicId)===section;
  const make = (section,mode) => ({...section,id:`${section.id}:${mode}`,sourceSectionId:section.id,mode,topicTitle:topics.get(section.topicId) ?? section.title,
    title:section.phase === 'front-matter' ? section.title : `${topics.get(section.topicId) ?? ''}${mode === 'student' ? '' : mode === 'short' ? ' · Short answers':' · Worked solutions'}`,
    exerciseNumber:section.phase==='front-matter'?undefined:exercises[section.topicId],
    difficultyTitle:section.phase==='practice'&&exercises[section.topicId]?(startsExercise(section)?`Exercise ${exercises[section.topicId]}`:null):section.phase === 'practice' && section.showDifficultyHeading!==false ? section.title : null,
    blocks:section.blocks.filter(b => !b.presentation?.editorOnly && (mode === 'student' || isPractice(b)||teachingLabels.has(b.id))).map((b,index) => ({...b,sourceOrder:numbers[b.id] ?? teachingLabels.get(b.id) ?? b.sourceOrder,flow:{...b.flow,sectionId:section.id,displayNumber:numbers[b.id],...(teachingLabels.has(b.id)?{teachingLabel:teachingLabels.get(b.id)}:{}),exerciseHeadingBefore:startsExercise(section)&&index===0?exercises[section.topicId]:undefined,...(exercises[section.topicId]&&(isPractice(b)||teachingLabels.has(b.id))?{exerciseNumber:exercises[section.topicId],answerMode:edition.startsWith('with-')?answers:null}: {})}}))});
  return [...(!['short','worked'].includes(edition) ? sections.map(s => make(s,'student')):[]),...(edition !== 'student' ? sections.map(s => make(s,answers)).filter(s => s.blocks.length):[])];
}
