export function sourcePresentationFlags(transcription, { requireEvidence = false } = {}) {
  const flags = [];
  for (const page of transcription.pages ?? []) {
    const add = (rootId, category, note) => flags.push({ rootId, pageNumber: page.pageNumber, code: `source-${category}`, category, severity: 'fatal', source: 'source-presentation', resolved: false, note });
    const section = page.section ?? {};
    const evidence = section.sourceHeading;
    if (requireEvidence && !evidence && section.role !== 'front-matter') add(page.id, 'header', 'Record visible source heading text/style, including explicit absence, before accepting this page.');
    if (evidence) {
      const style = section.headingStyle ?? 'page-title';
      if (style !== evidence.style || (style !== 'none' && section.title !== evidence.text) || (section.difficultyTitle ?? '') !== (evidence.difficultyTitle ?? '')) add(page.id, 'header', `Heading differs from source evidence. Expected ${evidence.style}: ${JSON.stringify(evidence.text)}, additional difficulty ${JSON.stringify(evidence.difficultyTitle ?? '')}. Correct visible fields after checking the source.`);
    }
    const walk = (node) => {
      if (!node || typeof node !== 'object') return;
      if (node.id && typeof node.content === 'string' && /^\s*\|.*\|\s*$/m.test(node.content)) {
        if (requireEvidence && !node.sourceTableStyle) add(node.id, 'table', 'Check source table borders and record sourceTableStyle and tableStyle; alignment tables may be borderless.');
        if (node.sourceTableStyle && (node.tableStyle ?? 'grid') !== node.sourceTableStyle) add(node.id, 'table', `Table treatment differs from source: use ${node.sourceTableStyle}.`);
      }
      if (node.type === 'question' && node.content?.prompt !== undefined && node.sourceExamLabel) {
        if (node.title !== node.sourceExamLabel || node.content.prompt.includes(node.sourceExamLabel)) add(node.id, 'structure', `Place ${node.sourceExamLabel} exactly once in this question's title; keep it attached to this question above its prompt.`);
      }
      for (const child of Object.values(node)) if (child && typeof child === 'object') Array.isArray(child) ? child.forEach(walk) : walk(child);
    };
    walk(page.blocks);
  }
  return flags;
}
