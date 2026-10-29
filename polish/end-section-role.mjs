// Authoring-only end-section recognition. Never used as a load-time migration.
export function endSectionRole(section,project){
 const title=[section.title,(project.topics??[]).find(t=>t.id===section.topicId)?.title].filter(Boolean).join(' ');
 if(section.role==='exam'||/\bexam(?:ination)?\s+questions?\b/i.test(title))return 'exam';
 if(section.role==='challenge'||/\bchallenge(?:\s+(?:exercise|questions))?\b/i.test(title))return 'challenge';
 return section.role;
}

// Printed paper attribution identifies an Exam question even before its section is migrated.
export function isExamQuestion(block){
 const source=block.source??{};return /\b(?:HSC|NESA|PLC|BHHS|trials?|exam(?:ination)?|sample paper)\b/i.test([source.provider,source.paper,source.label].filter(Boolean).join(' '));
}
