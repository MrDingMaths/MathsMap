import { feedbackText } from './booklet-feedback.js';
import { logicalUnits, flowId, isPractice } from './booklet-flow.js';
import { withProjectSections, ownProjectSection } from './editable-booklet-model.js';

const ATOM_KINDS = {definition:['Definition','theory'],'key-ideas':['Key Ideas','theory'],investigation:['Investigation','theory'],review:['Review','theory'],identify:['Identify','theory'],example:['Example','examples'],'guided-practice':['Guided','examples']};
const BLOCK_KINDS = {'rich-text':'Text','worked-example':'Example',callout:'Theory','page-break':'Page break',image:'Image',diagram:'Diagram'};
// What an outline item is, and which Theory / Examples / Questions filter it answers to.
export function outlineKind(block) {
  const atom = ATOM_KINDS[block.sourceAtom?.kind];
  if (atom) return {kind:block.sourceAtom.kind,label:atom[0],group:atom[1]};
  if (isPractice(block)) return {kind:'question',label:'Question',group:'questions'};
  if (block.type === 'worked-example') return {kind:'example',label:'Example',group:'examples'};
  return {kind:block.type === 'question' ? 'teaching' : block.type,label:block.sourceAtom ? 'Teaching' : BLOCK_KINDS[block.type] ?? (block.type === 'question' ? 'Teaching' : 'Content'),group:'theory'};
}

export function contentExcerpt(content, limit = 100) {
  const prompt = feedbackText(content?.prompt ?? content).replace(/\s+/g, ' ').trim();
  const first = content?.children?.map(c => feedbackText(c.prompt)).find(Boolean);
  return [prompt, prompt.length < 30 ? first : ''].filter(Boolean).join(' · ').slice(0, limit);
}

export function questionSummary(question, skills = []) {
  const skill = skills.find(s => s.id === question.classification?.primarySkillId)?.title
    ?? question.classification?.primarySkillId?.replaceAll('-', ' ') ?? 'Question';
  return { title: question.title?.trim() || skill, excerpt: contentExcerpt(question.content),
    source: [question.source?.file, question.source?.pageNumber ? `p${question.source.pageNumber}` : '', question.source?.questionNumber ? `Q${question.source.questionNumber}` : ''].filter(Boolean).join(' · ') };
}

export function questionSearchText(question) {
  const visit = node => [feedbackText(node?.prompt), ...(node?.children??[]).map(visit)].join(' ');
  return visit(question.content);
}

export function pageBoundaryKind(project, blockId) {
  const entries=project.sections.flatMap(s=>s.blocks.map(block=>({section:s,block})));
  const at=entries.findIndex(e=>e.block.id===blockId), item=entries[at];
  if (!item) return 'automatic';
  if (item.block.type==='page-break'||item.block.flow?.pageBreakBefore||entries[at-1]?.block.type==='page-break') return 'manual';
  if (item.block.flow?.sourcePageBreakBefore&&item.block.flow?.pageBreakBefore!==false) return 'source';
  return 'automatic';
}

// Operate on logical teaching/question groups, never split a paired source activity.
export function setPageBoundary(project, blockId, action) {
  const unit = logicalUnits(project).find(u => u.blocks.some(b => b.id === blockId));
  if (!unit) return project;
  const first = unit.blocks[0], last = unit.blocks.at(-1);
  const entries = project.sections.flatMap(s => s.blocks.map(b => ({ section: s, block: b })));
  const at = entries.findIndex(e => e.block.id === first.id);
  // Only the sections and blocks this boundary changes are copied.
  const next = withProjectSections(project), owned = new Set();
  const own = section => { if (!owned.has(section.id)) { ownProjectSection(next, section.id); owned.add(section.id); } return next.sections.find(s => s.id === section.id); };
  const patchFlow = (section, id, patch) => { const s = own(section), i = s.blocks.findIndex(b => b.id === id); s.blocks[i] = { ...s.blocks[i], flow: { ...s.blocks[i].flow, ...patch } }; return s; };
  if (action === 'before') {
    const section = patchFlow(entries[at].section, first.id, { pageBreakBefore: true, exercisePageBreakBefore: true });
    // An explicit separator takes precedence over an earlier keep-with-next,
    // without discarding that preference if this break is later removed.
    if(entries[at-1]?.block.flow?.keepWithNext)
      section.blocks.splice(section.blocks.findIndex(b=>b.id===first.id),0,{id:flowId(),type:'page-break',label:'Manual page break'});
  }
  else if (action === 'after') {
    const end = entries.findIndex(e => e.block.id === last.id), following = entries[end + 1];
    if (following?.block.type === 'page-break' || following?.block.flow?.pageBreakBefore) return project;
    const section = own(entries[end].section), index = section.blocks.findIndex(b => b.id === last.id);
    section.blocks.splice(index + 1, 0, { id: flowId(), type: 'page-break', label: 'Manual page break' });
  } else if (action === 'remove') {
    const section = patchFlow(entries[at].section, first.id, { pageBreakBefore: false, continueBefore: null });
    if(section.blocks[0]?.id===first.id){section.pageBreakBefore=false;if(section.phase==='practice')section.blocks[0].flow.exercisePageBreakBefore=false;}
    for (let i = at - 1; i >= 0 && entries[i].block.type === 'page-break'; i--) {
      const target = own(entries[i].section), id = entries[i].block.id; target.blocks = target.blocks.filter(b => b.id !== id);
    }
    if (first.type === 'page-break') for (const section of next.sections.filter(s => s.blocks.some(b => b.id === first.id))) { const target = own(section); target.blocks = target.blocks.filter(b => b.id !== first.id); }
  } else return project;
  return next;
}

export function startExerciseOnNewPage(project, topicId) {
  const found = project.sections.find(s => s.topicId === topicId && s.phase === 'practice' && s.blocks.length);
  if (!found) return project;
  const next = withProjectSections(project), section = ownProjectSection(next, found.id);
  section.pageBreakBefore = true; section.blocks[0] = { ...section.blocks[0], flow: { ...section.blocks[0].flow, pageBreakBefore: true, exercisePageBreakBefore: true } };
  return next;
}
