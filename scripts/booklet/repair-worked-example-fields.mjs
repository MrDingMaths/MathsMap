/** Targeted maintenance; returns a clone and never writes a project. */
export function repairOtherWorkedExamples(input) {
  const project = structuredClone(input), changes = [];
  const blocks = (project.sections ?? []).flatMap(s => s.blocks ?? []);
  const examples = new Map(blocks.flatMap(b => (b.examples ?? []).map(e => [e.id, e])));
  const doc = blocks => ({ format: 'maths-editor-document-v1', version: 1, blocks });
  const paragraph = (id, text) => ({ id, type: 'paragraph', inlines: [{ type: 'text', text }] });
  const visit = (v, fn) => { if (!v || typeof v !== 'object') return; fn(v); for (const x of Object.values(v)) if (typeof x === 'object') visit(x, fn); };
  const remap = (from, to) => visit(project, v => { if (typeof v.ref === 'string' && (v.ref === from || v.ref.startsWith(from + '#'))) v.ref = to + v.ref.slice(from.length); });
  const includeSolution = id => visit(project, v => {
    if (v.type !== 'group' || !Array.isArray(v.children)) return;
    const at = v.children.findIndex(c => c.ref === id + '/prompt');
    if (at >= 0 && !v.children.some(c => c.ref?.startsWith(id + '/theorySolution'))) {
      const solution = examples.get(id)?.theorySolution;
      const refs = solution?.blocks?.map(b => id + '/theorySolution#' + b.id) ?? [id + '/theorySolution'];
      v.children.splice(at + 1, 0, ...refs.map(ref => ({ id: 'layout:' + ref, type: 'item', ref })));
    }
  });
  function addPrompt(id, text) {
    const e = examples.get(id); if (!e) return;
    if (typeof e.prompt === 'string') {
      if (e.prompt.startsWith(text)) return;
      e.prompt = text + (e.prompt ? '\n' + e.prompt : '');
    } else {
      if (e.prompt?.blocks?.some(b => b.id === id + '-explicit-instruction')) return;
      e.prompt = doc([paragraph(id + '-explicit-instruction', text), ...(e.prompt?.blocks ?? [])]);
    }
    // Existing explicit arrangements need the new instruction at the start of this example.
    visit(project, v => { if (v.type === 'group' && Array.isArray(v.children) && v.children.some(c => c.type === 'item' && (c.ref === id + '/prompt' || c.ref?.startsWith(id + '/prompt#')))) {
      if (!v.children.some(c => c.ref === id + '/prompt')) {
        const ref = id + '/prompt#' + id + '-explicit-instruction';
        if (!v.children.some(c => c.ref === ref)) v.children.unshift({ id: 'layout:' + ref, type: 'item', ref });
      }
    }});
    changes.push({ id, action: 'add-explicit-instruction' });
  }
  function move(id, select) {
    const e = examples.get(id); if (!e?.prompt?.blocks) return;
    const moved = e.prompt.blocks.filter(select); if (!moved.length) return;
    const existing = e.theorySolution;
    if (existing && (typeof existing === 'string' ? existing.trim() : existing.blocks?.length)) throw new Error('Existing solution requires review: ' + id);
    e.prompt.blocks = e.prompt.blocks.filter(b => !select(b)); e.theorySolution = doc(moved);
    for (const b of moved) remap(id + '/prompt#' + b.id, id + '/theorySolution#' + b.id);
    if (!e.prompt.blocks.length) remap(id + '/prompt', id + '/theorySolution');
    else includeSolution(id);
    changes.push({ id, action: 'move-working-to-solution', blocks: moved.map(b => b.id) });
  }
  if (project.id === 'angle-relationships-v1') {
    move('p41-example-demonstration', b => b.id.endsWith('-answer'));
    for (const side of ['left', 'right']) {
      move('p52-example-' + side, () => true);
      move('p53-example-' + side, () => true);
    }
  }
  if (project.id === 'probability-v1') {
    for (const id of ['p19-example-item', 'p36-example-green', 'p36-example-not-green']) move(id, b => b.id.endsWith('-demonstration'));
    for (const id of ['p3-example-coin', 'p3-example-spinner']) {
      const e = examples.get(id); if (!e || e.theorySolution) continue;
      const answers = [];
      for (const b of e.prompt.blocks) {
        const at = b.inlines?.findIndex(i => i.colour?.toLowerCase() === '#268cff');
        if (!(at >= 0)) continue;
        const answer = b.inlines.slice(at);
        b.inlines = b.inlines.slice(0, at);
        while (b.inlines.at(-1)?.type === 'break') b.inlines.pop();
        answers.push({ ...structuredClone(b), id: b.id + '-solution', inlines: [structuredClone(b.inlines[0]), { type: 'text', text: ' ' }, ...answer] });
        visit(project, v => {
          if (v.type !== 'group' || !Array.isArray(v.children)) return;
          const at = v.children.findIndex(c => c.ref === id + '/prompt#' + b.id);
          const ref = id + '/theorySolution#' + b.id + '-solution';
          if (at >= 0 && !v.children.some(c => c.ref === ref)) v.children.splice(at + 1, 0, { id: 'layout:' + ref, type: 'item', ref });
        });
      }
      if (answers.length) { e.theorySolution = doc(answers); includeSolution(id); changes.push({ id, action: 'separate-labelled-answers' }); }
    }
  }
  if (project.id === 'logarithms-v1') {
    move('p28-example-demonstration', b => b.id === 'p28-example-working');
  }
  if (project.id === 'linear-relationships-v1') {
    const graphicalConclusion = blocks.find(b => b.id === 'page-85-block-4');
    if (graphicalConclusion?.type === 'rich-text' && graphicalConclusion.content === '3. The solution is $x = 3$') {
      graphicalConclusion.type = 'worked-example';
      graphicalConclusion.theorySolution = graphicalConclusion.content;
      graphicalConclusion.content = '';
      remap(graphicalConclusion.id + '/content', graphicalConclusion.id + '/theorySolution');
      changes.push({ id: graphicalConclusion.id, action: 'classify-graphical-conclusion-as-solution' });
    }
    // Bold row headings need six extra millimetres; retain every data-column width.
    visit(project.sections, node => {
      if (node.id === 'page-72-q9-root-prompt-1-rich-2' && node.widthMm === 90 && node.widths?.[0] < 40) {
        node.widthMm += 6; node.widths[0] += 6;
        changes.push({ id: 'page-72-q9-root', action: 'fit-bold-row-headings', tableId: node.id });
      }
      if (node.id === 'page-51-q2-a-prompt-1-rich-2') {
        if (node.widthMm === 74 && node.widths?.[0] === 34) {
          node.widthMm = 80; node.widths[0] = 40;
          changes.push({ id: 'page-51-q2-a', action: 'fit-bold-row-headings', tableId: node.id });
        }
        let corrected = false;
        for (const row of node.rows ?? []) row.forEach((cell, i) => {
          if (cell.header !== (i === 0)) { cell.header = i === 0; corrected = true; }
        });
        if (corrected) changes.push({ id: 'page-51-q2-a', action: 'mark-row-labels-as-headers', tableId: node.id });
      }
    });
    // Identical legacy correctness-marker documents reused their paragraph IDs.
    // Keep stable example IDs and only disambiguate the duplicate internal nodes.
    for (const id of ['page-23-we-3', 'page-23-we-4', 'page-23-we-5']) {
      const e = examples.get(id);
      for (const node of e?.theorySolution?.blocks ?? []) {
        if (!/^marker-(?:a421b552ea51|b3de7d138c90)-0$/.test(node.id)) continue;
        const oldId = node.id; node.id = id + '-' + oldId;
        remap(id + '/theorySolution#' + oldId, id + '/theorySolution#' + node.id);
        changes.push({ id, action: 'disambiguate-internal-paragraph-id', oldId, newId: node.id });
      }
    }
    for (const id of ['page-37-ex-1', 'page-37-ex-2']) addPrompt(id, 'Find the equation relating x and y.');
    for (const id of ['page-85-ex-col-1', 'page-85-ex-col-2']) {
      const e = examples.get(id); if (!e?.questionDiagrams?.length) continue;
      e.solutionDiagrams = [...(e.solutionDiagrams ?? []), ...e.questionDiagrams.map(d => ({ ...d, role: 'solution' }))]; e.questionDiagrams = [];
      e.theorySolution = e.prompt; e.prompt = ''; remap(id + '/prompt', id + '/theorySolution');
      changes.push({ id, action: 'classify-graphical-working-as-solution' });
    }
  }
  return { project, changes };
}
