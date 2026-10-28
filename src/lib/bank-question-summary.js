import { toSource } from '../../public/libs/maths-editor/document-model.mjs';

// Plain-text summaries of questions. Kept apart from booklet-feedback.js and
// booklet-workspace.js so the bank server can build the picker index without
// pulling the editor and comment modules into the Vite config chain.
export function feedbackText(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (value.format && value.blocks) return toSource(value);
  if (value.type === 'paragraph') return (value.inlines??[]).map(i=>i.text??i.latex??i.answer??'').join('');
  if (value.code) return value.code;
  if (value.prompt != null) return feedbackText(value.prompt);
  if (value.content != null) return feedbackText(value.content);
  return value.title ?? value.label ?? '';
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

// One picker row per question: everything the bank picker lists and searches,
// without the question body. The skill title is resolved by the client.
export function bankIndexRow(question) {
  const { excerpt, source } = questionSummary(question);
  return { id: question.id, title: question.title?.trim() || null, skillId: question.classification?.primarySkillId ?? null,
    difficulty: question.classification?.difficulty ?? null, excerpt, source, search: questionSearchText(question) };
}
