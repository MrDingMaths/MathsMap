import { feedbackText } from './booklet-feedback.js';
import { logicalUnits, flowId } from './booklet-flow.js';

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
  const next = structuredClone(project);
  const unit = logicalUnits(next).find(u => u.blocks.some(b => b.id === blockId));
  if (!unit) return next;
  const first = unit.blocks[0], last = unit.blocks.at(-1);
  const entries = next.sections.flatMap(s => s.blocks.map(b => ({ section: s, block: b })));
  const at = entries.findIndex(e => e.block.id === first.id);
  if (action === 'before') {
    first.flow = { ...first.flow, pageBreakBefore: true };
    // An explicit separator takes precedence over an earlier keep-with-next,
    // without discarding that preference if this break is later removed.
    if(entries[at-1]?.block.flow?.keepWithNext){
      const section=entries[at].section,index=section.blocks.indexOf(first);
      section.blocks.splice(index,0,{id:flowId(),type:'page-break',label:'Manual page break'});
    }
  }
  else if (action === 'after') {
    const end = entries.findIndex(e => e.block.id === last.id), following = entries[end + 1];
    if (following?.block.type === 'page-break' || following?.block.flow?.pageBreakBefore) return next;
    const section = entries[end].section, index = section.blocks.indexOf(last);
    section.blocks.splice(index + 1, 0, { id: flowId(), type: 'page-break', label: 'Manual page break' });
  } else if (action === 'remove') {
    first.flow = { ...first.flow, pageBreakBefore: false, continueBefore: null };
    const section=entries[at].section;
    if(section.blocks[0]?.id===first.id)section.pageBreakBefore=false;
    for (let i = at - 1; i >= 0 && entries[i].block.type === 'page-break'; i--) {
      const { section, block } = entries[i]; section.blocks = section.blocks.filter(b => b.id !== block.id);
    }
    if (first.type === 'page-break') for (const section of next.sections) section.blocks = section.blocks.filter(b => b.id !== first.id);
  }
  return next;
}

export function startExerciseOnNewPage(project, topicId) {
  const next = structuredClone(project);
  const section = next.sections.find(s => s.topicId === topicId && s.phase === 'practice' && s.blocks.length);
  if (section) { section.pageBreakBefore = true; section.blocks[0].flow = { ...section.blocks[0].flow, pageBreakBefore: true }; }
  return next;
}
