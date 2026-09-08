function plain(value) {
  return String(value ?? '').replace(/^#+\s*/, '').replace(/^\*\*(.*?)\*\*$/, '$1').trim();
}

export function parseImportedContents(value) {
  return String(value ?? '').split(/\r?\n/).map((line) => {
    const match = /^(.*?)\s+\.{3,}\s*(\d+)\s*$/.exec(line.trim());
    return match ? { title: match[1].trim(), sourcePage: Number(match[2]) } : null;
  }).filter(Boolean);
}

export function deriveBookletCover(pages = []) {
  const ordered = [...pages].sort((a, b) => Number(a.pageNumber) - Number(b.pageNumber));
  const first = ordered[0] ?? {};
  const coverBlock = first.blocks?.find((block) => block.id?.includes('cover')) ?? first.blocks?.[0] ?? {};
  const contentsBlock = first.blocks?.find((block) => block.title?.toLowerCase() === 'contents');
  const lines = String(coverBlock.content ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const course = plain(lines.find((line) => /mathematics|course/i.test(line)) ?? '');
  const heading = lines.find((line) => /^#\s+/.test(line));
  const bookIndex = lines.findIndex((line) => /^\*\*Book\b/i.test(line) || /^Book\b/i.test(line));
  const versionIndex = lines.findIndex((line) => /^Version\s*:/i.test(line));
  const book = plain(bookIndex >= 0 ? lines[bookIndex] : 'Book 1');
  const topics = bookIndex >= 0
    ? lines.slice(bookIndex + 1, versionIndex >= 0 ? versionIndex : undefined).filter((line) => !/^Feedback\s*:/i.test(line)).map(plain)
    : [];
  const version = plain(lines.find((line) => /^Version\s*:/i.test(line)) ?? '').replace(/^Version\s*:\s*/i, '');
  const feedback = (lines.find((line) => /^Feedback\s*:/i.test(line)) ?? '').replace(/^Feedback\s*:\s*/i, '') || 'https://MrDingMaths.com';
  const pagePositions = new Map();ordered.forEach((page,index)=>{if(!pagePositions.has(Number(page.pageNumber)))pagePositions.set(Number(page.pageNumber),index+1);});
  const imported = parseImportedContents(contentsBlock?.content);
  let contents = imported
    .filter((entry) => pagePositions.has(entry.sourcePage))
    .map((entry) => ({ title: entry.title, pageNumber: pagePositions.get(entry.sourcePage) }));
  if (!contents.length) {
    const seen = new Set();
    contents = ordered.slice(1).flatMap((page, index) => {
      const title = String(page.section?.title ?? '').trim();
      if (!title || seen.has(title)) return [];
      seen.add(title);
      return [{ title, pageNumber: index + 2 }];
    });
  }
  if(first.flexible){
    const seen=new Set();
    const topicContents=ordered.filter(page=>page.mode==='student'&&page.section?.phase!=='front-matter').flatMap(page=>{
      const topicId=page.section?.topicId;if(!topicId||seen.has(topicId))return [];seen.add(topicId);
      return [{title:page.section.topicTitle??page.section.title,pageNumber:page.pageNumber}];
    });
    const coveredTopics=new Set();
    const anchoredContents=imported.flatMap(entry=>{
      const destination=ordered.find(page=>page.mode==='student'&&page.blocks?.some(block=>Number(block.sourcePageNumber)===entry.sourcePage));
      if(destination)coveredTopics.add(destination.section?.topicId);
      return destination?[{title:entry.title,pageNumber:destination.pageNumber}]:[];
    });
    const newTopics=topicContents.filter(entry=>!coveredTopics.has(ordered.find(page=>page.pageNumber===entry.pageNumber)?.section?.topicId));
    contents=anchoredContents.length?[...anchoredContents,...newTopics].sort((a,b)=>a.pageNumber-b.pageNumber):topicContents;
    if(ordered.some(p=>p.section?.exerciseNumber)){
      const seenExercises=new Set();
      contents=ordered.filter(p=>p.mode==='student').flatMap(p=>{
        const number=p.section?.exerciseNumber;
        if(!number||seenExercises.has(number))return [];
        seenExercises.add(number);
        return [{number,title:p.section.topicTitle,pageNumber:p.pageNumber,href:`#exercise-topic-${number}`}];
      });
    }
  }
  for(const mode of ['short','worked']){
    const start=ordered.find(p=>p.compactAnswers&&p.mode===mode);
    if(start)contents.push({title:mode==='short'?'Short answers':'Worked solutions',answerSection:true,pageNumber:start.pageNumber,href:`#answer-section-${mode}`});
  }
  return {
    course: course || 'Mathematics',
    title: plain(heading ?? first.section?.title ?? 'Untitled booklet'),
    book,
    topics,
    version,
    feedback,
    contents,
    totalPages: ordered.length || 1,
  };
}
