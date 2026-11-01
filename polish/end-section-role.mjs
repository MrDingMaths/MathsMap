// Authoring-only end-section recognition. Never used as a load-time migration.
export function endSectionRole(section,project){
 const title=[section.title,(project.topics??[]).find(t=>t.id===section.topicId)?.title].filter(Boolean).join(' ');
 if(section.role==='exam'||/\bexam(?:ination)?\s+questions?\b/i.test(title))return 'exam';
 if(section.role==='challenge'||/\bchallenge(?:\s+(?:exercise|questions))?\b/i.test(title))return 'challenge';
 return section.role;
}

// Printed paper attribution identifies an Exam question even before its section is migrated.
export function isExamQuestion(block){
 const source=block.source??{};
 if(/\b(?:HSC|NESA|PLC|BHHS|trials?|exam(?:ination)?|sample paper)\b/i.test([source.provider,source.paper,source.label].filter(Boolean).join(' ')))return true;
 // Older textbook imports retain the paper citation as the question title.
 // Recognise an explicit HSC/year attribution, not a generic exam-style title
 // or an occurrence in the posed question. This is authoring-only recognition;
 // it neither rewrites titles nor migrates a saved project.
 const title=String(block.title??'').trim().replace(/^\[/,'').replace(/\s+/g,' ');
 return /^(?:19|20)\d{2} HSC\b(?!\s+(?:style|practice|revision|preparation)\b)/i.test(title)
  || /^HSC\b(?!\s+(?:style|practice|revision|preparation)\b)(?: (?:Mathematics|Advanced|Standard|General|Extension|Ext|Unit|[1-4])){0,5} (?:19|20)\d{2}\b/i.test(title)
  || /^HSC Sample(?: (?:Advanced|Extension [12]|Standard(?: [12])?))? Question(?: Band \d+)?$/i.test(title);
}
