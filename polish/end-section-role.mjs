// Authoring-only end-section recognition. Never used as a load-time migration.
export function endSectionRole(section,project){
 const title=[section.title,(project.topics??[]).find(t=>t.id===section.topicId)?.title].filter(Boolean).join(' ');
 if(section.role==='challenge'||/\bchallenge(?:\s+(?:exercise|questions))?\b/i.test(title))return 'challenge';
 return section.role;
}
