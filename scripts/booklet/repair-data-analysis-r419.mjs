// Local feedback repair. Source evidence, other questions and bank pins remain data.
export function repairDataAnalysisR419(original, portraits) {
  const next = structuredClone(original);
  const blocks = next.sections.flatMap(s => s.blocks);
  const scenario = blocks.find(b => b.id === 'p81-q9-block');
  const investigation = blocks.find(b => b.id === 'p82-skewness-investigation');
  if (!scenario || !investigation) throw Error('Missing feedback targets');
  const walk = (value, callback) => {
    if (!value || typeof value !== 'object') return;
    callback(value);
    Object.values(value).forEach(v => walk(v, callback));
  };
  walk(scenario.content, node => {
    if (node.type === 'image' && portraits[node.id]) {
      const {visibleHeightMm, ...size} = portraits[node.id];
      Object.assign(node, size);
    }
  });
  const chart = scenario.content.children.find(p => p.label === 'b').questionDiagrams[0];
  const originalChart = structuredClone(chart.originalDiagram ?? chart);
  chart.format = 'tikz';
  delete chart.src;
  delete chart.retentionReason;
  chart.originalDiagram = originalChart;
  chart.reviewStatus = 'needs-review';
  delete chart.reviewEvidence;
  chart.code = [
    '% mathsmap-diagram-colours {"version":1,"kind":"graph","base":[],"semantic":[],"reference":"Page 81 schematic bar chart, traced qualitatively; no exact yearly values supplied."}',
    '\\begin{tikzpicture}[x=1mm,y=1mm,draw=black,text=black,font={\\fontsize{10}{12}\\selectfont}]',
    '\\special{dvisvgm:raw <metadata data-graph-strokes="1"/>}',
    '\\path[use as bounding box] (-15,-48) rectangle (124,44);',
    '\\draw[<->,line width=0.5pt] (0,-40) -- (0,40);',
    '\\draw[->,line width=0.5pt] (-3,0) -- (120,0);',
    ...[-30,-20,-10,10,20,30].map(y => `\\draw[line width=0.4pt] (-1,${y}) -- (1,${y});`),
    ...[-10,10].map(y => `\\node[anchor=east,font={\\fontsize{8.5}{10}\\selectfont}] at (-2,${y}) {\\special{dvisvgm:raw <g data-graph-text="tick">}${y > 0 ? '+' : '-'}10\\%\\special{dvisvgm:raw </g>}};`),
    // Drawing coordinates reproduce relative source heights, not exact percentages.
    ...[9,8,-39,8,-39,-43,9,10,8,-36,-44,7,-41].map((y, i) => {
      const x = 4 + 8 * i;
      return `\\draw[line width=0.5pt] (${x},0) rectangle (${x + 4},${y});`;
    }),
    '\\end{tikzpicture}'
  ].join('\n');
  chart.spec = {...chart.spec, nativeReconstruction: 'Thirteen unfilled source-relative bars, gains/losses in original order, signed 10% ticks and axis arrows. Heights are schematic tracing coordinates, not newly asserted yearly data.'};

  const prefix = 'p82-skewness-investigation';
  investigation.sourceAtom.visibleSubtitle = 'Summary statistics and skewness';
  const content = investigation.content;
  content.prompt.blocks[0].inlines = [{type:'text', text:'The starting data are 7, 8, 9, 9, 9, 10, 11.'}];
  content.prompt.blocks = content.prompt.blocks.slice(0,1);
  for (const diagram of content.questionDiagrams) {
    diagram.code = diagram.code.split('% mathsmap-statistic-marker:')[0].replace(/\\end\{tikzpicture\}\s*$/, '')
      .replace('(0,-2.05) rectangle (5.6,1.9)', '(0,-0.65) rectangle (5.6,1.9)') + '\\end{tikzpicture}';
    diagram.reviewStatus = 'needs-review';
    delete diagram.reviewEvidence;
  }
  const calculation = content.children.find(p => p.id === prefix + '-c');
  calculation.label = '';
  calculation.prompt.blocks[0].inlines = [{type:'text',text:'Calculate the mode, median and mean for each dot plot.'}];
  calculation.answerSpaceMm = 24;
  calculation.answer = {
    short: 'Starting data: mode 9, median 9, mean 9. Right tail: mode 9, median 10, mean 11. Left tail: mode 9, median 8, mean 7.',
    worked: 'Starting data: 9 occurs most often; the fourth value is 9; mean = 63 ÷ 7 = 9. Right tail: 9 occurs most often; the fourth value is 10; mean = 77 ÷ 7 = 11. Left tail: 9 occurs most often; the fourth value is 8; mean = 49 ÷ 7 = 7.'
  };
  const text = value => ({type:'text',text:value});
  const blank = (answer,width=24) => ({type:'cloze',answer,width});
  const paragraph = (id,inlines) => ({id,type:'paragraph',inlines,spaceAfter:3});
  const cloze = {
    id: prefix + '-summary', type:'part', label:'', answerSpaceMm:0,
    prompt: {format:'maths-editor-document-v1',version:1,blocks:[
      paragraph(prefix+'-summary-intro',[text('Complete the statements for these unimodal examples.')]),
      paragraph(prefix+'-summary-symmetrical',[text('Symmetrical data have the '),blank('same'),text(' mode, median and mean.')]),
      paragraph(prefix+'-summary-positive',[text('Positively skewed data have the median and mean towards the '),blank('right'),text(', with the '),blank('mean'),text(' further towards the tail than the '),blank('median'),text('.')]),
      paragraph(prefix+'-summary-negative',[text('Negatively skewed data have the median and mean towards the '),blank('left'),text(', with the '),blank('mean'),text(' further towards the tail than the '),blank('median'),text('.')]),
      paragraph(prefix+'-summary-caveat',[text('These are typical patterns for unimodal distributions, not rules for every dataset.')])
    ]},
    answer:{short:'same; right, mean, median; left, mean, median.',worked:'The symmetrical example has all three statistics at 9. The right-tail example has mode < median < mean; the left-tail example has mean < median < mode. These orderings are typical, not universal.'}
  };
  content.children = [calculation,cloze];
  const item = (ref,options={}) => ({id:'layout:'+ref,type:'item',ref,...options});
  const partLayout = part => ({id:part.id+':question',type:'group',direction:'stack',gap:2,children:[
    ...part.prompt.blocks.map(p=>item(part.id+'/prompt#'+p.id)),
    ...(part.answerSpaceMm ? [item(part.id+'/space')] : [])
  ]});
  const arrangement = {version:1,root:{id:content.id+':question',type:'group',direction:'stack',gap:3,children:[
    item(content.id+'/prompt#'+content.prompt.blocks[0].id),
    item(prefix+'-starting',{align:'center',width:56}),
    {id:prefix+'-tail-row',type:'group',direction:'row',gap:8,verticalAlign:'middle',children:[
      item(prefix+'-right-tail',{align:'center',width:56,weight:1}),
      item(prefix+'-left-tail',{align:'center',width:56,weight:1})
    ]},
    ...content.children.map(partLayout)
  ]}};
  // Update every live arrangement store, retaining unrelated settings and overrides.
  for (const settings of [next.settings,scenario.presentation?.layoutOverrides && scenario.presentation,investigation.presentation].filter(Boolean)) {
    const store = settings.layoutOverrides?.blockLayouts;
    if (store?.[investigation.id]) store[investigation.id].arrangement = structuredClone(arrangement);
  }
  next.settings.layoutOverrides.blockLayouts[investigation.id].arrangement = arrangement;
  walk(investigation.presentation, node => {
    if (node.arrangement?.root?.id === content.id+':question') node.arrangement = structuredClone(arrangement);
  });
  // Saved review mappings must reflect retained part identities, never deleted tasks.
  if (investigation.sourceReview) {
    const review = investigation.sourceReview;
    review.responses = [{targetId:calculation.id,kind:'short'},{targetId:cloze.id,kind:'cloze'}];
    review.arrangements = [{targetId:content.id,layout:'list',columns:null,order:content.children.map(p=>p.id),reason:'Local feedback: centred starting plot above paired centred tail plots, calculation and native cloze.'}];
    review.visualAudit = {...review.visualAudit,checked:false,note:'Previous inspection retained in the revision snapshot; changed plot arrangement and cloze require current inspection.'};
    review.verification = {...review.verification,checked:false};
  }
  return {next, changedIds:[scenario.id,investigation.id], originalChart};
}
