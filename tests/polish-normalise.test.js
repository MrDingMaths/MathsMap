// Polish pipeline step 1 (23 October 2026): the new sweep rules steps, scaffold-anchor and bracket-blank.
import test from 'node:test';
import assert from 'node:assert/strict';
import {sweepProject,RULES,contentSignature,stepTable,layoutAnchored} from '../sweep/rules.mjs';
import {verifyCandidate} from '../sweep/run.mjs';
import {normalizeDocument} from '../public/libs/maths-editor/document-model.mjs';
import {boxLatex,gapLatex} from '../src/lib/booklet-cloze-convention.js';
import {registerDetector,detectors,SWEEP_RULE_CATEGORIES,ensureDetectors} from '../bench/corpus.mjs';

const RED='#ef6068';
const math=(id,latex,extra={})=>({id,type:'paragraph',align:'left',inlines:[{type:'math',latex,display:false,colour:'#268cff'}],...extra});
const doc=blocks=>({format:'maths-editor-document-v1',version:1,blocks});
const list=(id,latexes,extra={})=>({id,type:'list',ordered:true,start:1,indent:7,items:latexes.map((latex,i)=>({id:`${id}-s${i+1}`,type:'list-item',blocks:[math(`${id}-s${i+1}-m`,latex)]})),...extra});
const example=(blocks,extra={})=>({id:'ex',type:'worked-example',pedagogyRole:'example',sourceAtom:{kind:'example'},presentation:{layout:'columns',columns:2,numberSteps:false},examples:[{id:'ex-1',label:'',prompt:doc(blocks),theorySolution:''}],...extra});
const project=(blocks,settings={})=>({id:'p',revision:1,studio:{flags:[]},settings:{layoutOverrides:{blockLayouts:{}},...settings},sections:[{id:'s',phase:'teaching',blocks}]});
const sweep=(p,rules)=>sweepProject(p,{fix:true,rules});
const blockOf=(result,id='ex')=>result.project.sections[0].blocks.find(b=>b.id===id);

test('the three rules are registered with the sweep and the corpus replay',async()=>{
 for(const rule of ['steps','scaffold-anchor','bracket-blank']){assert.ok(RULES[rule],rule+' is in RULES');assert.ok(SWEEP_RULE_CATEGORIES[rule]?.length,rule+' has comment categories');}
 await ensureDetectors();
 const names=detectors().map(d=>d.name);
 for(const rule of ['steps','scaffold-anchor','bracket-blank'])assert.ok(names.includes('sweep:'+rule),'the corpus replay runs '+rule);
});

test('steps: an ordered list of working becomes the red step table of the teacher\'s examples',()=>{
 const before=project([example([math('g','x',{inlines:[{type:'text',text:'150 beats every 3 minutes.'}]}),list('ex-steps',['\\dfrac{150}{3}','\\dfrac{150\\div3}{3\\div3}=\\dfrac{50}{1}','=50'])])]);
 const result=sweep(before,['steps']);
 const table=blockOf(result).examples[0].prompt.blocks[1];
 assert.equal(table.type,'table');assert.equal(table.id,'ex-steps');assert.equal(table.border,false);assert.deepEqual(table.widths,[7,93]);
 assert.deepEqual(table.rowHeights,[12,12,12],'one even row height, 12 mm because the working has a fraction');
 assert.equal(table.rows.length,3);
 const label=table.rows[1][0].blocks[0].inlines[0];
 assert.deepEqual([label.text,label.colour],['2.',RED],'a red step number in the gutter');
 assert.equal(table.rows[1][1].blocks[0].id,'ex-steps-s2-m','the working paragraph keeps its id');
 assert.equal(table.rows[0][0].verticalAlign,'middle');
 assert.ok(result.findings.some(f=>f.rule==='steps'&&f.action==='fix'));
 // The content guard sees the same words and expressions; the number labels are decoration.
 assert.deepEqual(verifyCandidate(before,result.project,result.changed),[]);
 assert.deepEqual(contentSignature(blockOf(sweep(before,[])))
  ,contentSignature(blockOf(result)));
 normalizeDocument(blockOf(result).examples[0].prompt);
 // Idempotent.
 assert.equal(sweep(result.project,['steps']).findings.filter(f=>f.action==='fix').length,0);
 // A list with no fraction gets 8 mm rows and a numbering that follows start.
 const plain=stepTable(list('l',['x=2','y=3'],{start:3}));
 assert.deepEqual(plain.rowHeights,[8,8]);assert.equal(plain.rows[0][0].blocks[0].inlines[0].text,'3.');
});

test('steps: only working is converted, only in example blocks, and a local exception holds',()=>{
 const wordy=list('w',['x=1']);wordy.items[0].blocks.push({id:'w-text',type:'paragraph',inlines:[{type:'text',text:'Check the answer.'}]});
 const method=example([list('method',['\\dfrac{1}{2}','2'])],{pedagogyRole:'definition',sourceAtom:{kind:'definition'}});
 assert.equal(sweep(project([method]),['steps']).changed.length,0,'a method list in an information block is not worked steps');
 assert.equal(sweep(project([example([wordy])]),['steps']).changed.length,0,'a list that holds words stays a list');
 const held=example([list('l',['x=1','x=2'])],{sourceReview:{intentionalDepartures:['Keep step numbering black for this example (teacher: step numbers stay as the source has them)']}});
 const result=sweep(project([held]),['steps']);
 assert.equal(result.changed.length,0);assert.match(result.findings[0].detail,/local exception/);
});

test('steps: examples with steps[] get numberSteps true, and the worked-rows layout only when the block has none',()=>{
 const withSteps=extra=>({id:'ex',type:'worked-example',pedagogyRole:'example',examples:[{id:'e1',prompt:'Solve',steps:['x+2=5','x=3']}],...extra});
 const columns=blockOf(sweep(project([withSteps({presentation:{layout:'columns',columns:2,numberSteps:false}})]),['steps']));
 assert.equal(columns.presentation.numberSteps,true);assert.equal(columns.presentation.layout,'columns','the source\'s side-by-side layout stays');
 const bare=blockOf(sweep(project([withSteps({})]),['steps']));
 assert.deepEqual(bare.presentation,{numberSteps:true,layout:'worked-rows'});
 const done=project([withSteps({presentation:{layout:'worked-rows',numberSteps:true}})]);
 assert.equal(sweep(done,['steps']).changed.length,0,'nothing to do once it is explicit');
 // The renderers are not changed: an unset numberSteps still renders as before, so existing booklets are untouched.
 assert.equal(sweepProject(project([withSteps({})]),{fix:false,rules:['steps']}).changed.length,0,'report mode changes nothing');
});

const part=(id,blocks)=>({id,type:'part',label:id.slice(-1),prompt:doc(blocks),responseSpace:'scaffold',answerSpaceMm:0});
const question=(parts,extra={})=>({id:'q',type:'question',pedagogyRole:'guided-practice',content:{id:'q-root',type:'question',prompt:doc([]),children:parts},...extra});

test('scaffold-anchor: a right-aligned scaffold line and a gap above it are fixed; a centred display equation is house style',()=>{
 const result=sweep(project([question([
  part('q-a',[{id:'q-a-stem',type:'paragraph',inlines:[{type:'text',text:'Convert.'}]},math('q-a-scaffold','\\dfrac{1}{2}=',{align:'right',spaceBefore:6})]),
  part('q-b',[{id:'q-b-stem',type:'paragraph',inlines:[{type:'text',text:'Solve.'}]},{...math('q-b-scaffold','\\dfrac{a}{b}=\\dfrac{c}{d}',{align:'center'}),inlines:[{type:'math',latex:'\\dfrac{a}{b}=\\dfrac{c}{d}',display:true}]}]),
 ])]),['scaffold-anchor']);
 const [a,b]=blockOf(result,'q').content.children;
 assert.equal(a.prompt.blocks[1].align,'left');assert.equal(a.prompt.blocks[1].spaceBefore,1);
 assert.equal(b.prompt.blocks[1].align,'center','a centred display equation stays');
 assert.equal(result.findings.filter(f=>f.action==='fix').length,1);
 assert.deepEqual(verifyCandidate(project([]),project([]),[]),[]);
});

test('scaffold-anchor: an arrangement item centred or pushed down under a part is left-aligned with no gap',()=>{
 const arrangement={version:1,root:{id:'root',type:'group',direction:'stack',children:[
  {id:'layout:q-a/prompt#q-a-scaffold',type:'item',ref:'q-a/prompt#q-a-scaffold',align:'center',before:10},
  {id:'layout:q-a/prompt#q-a-stem',type:'item',ref:'q-a/prompt#q-a-stem',align:'center',before:10},
 ]}};
 const base=project([question([part('q-a',[{id:'q-a-stem',type:'paragraph',inlines:[{type:'text',text:'Convert.'}]},math('q-a-scaffold','x=')])])],{layoutOverrides:{blockLayouts:{q:{arrangement}}}});
 const result=sweep(base,['scaffold-anchor']);
 const [scaffold,stem]=result.project.settings.layoutOverrides.blockLayouts.q.arrangement.root.children;
 assert.equal(scaffold.align,'left');assert.equal(scaffold.before,undefined);
 assert.equal(stem.align,'center','only the scaffold is anchored');assert.equal(stem.before,10);
 const held=sweep({...base,sections:[{id:'s',phase:'teaching',blocks:[{...base.sections[0].blocks[0],sourceReview:{intentionalDepartures:['Scaffold stays centred; keep the scaffold alignment for this question (teacher)']}}]}]},['scaffold-anchor']);
 assert.equal(held.changed.length,0);
});

test('scaffold-anchor: a hand-built scaffold in equal columns with 3 mm margins is anchored left, once',()=>{
 const layout={id:'q-b-scaffold',type:'layout',arrangement:'scaffold',columns:2,tracks:[1,1],slots:[
  {id:'q-b-given-slot',blocks:[math('q-b-given','\\dfrac{\\$5.50}{0.5\\text{ kg}}=',{align:'right'})],verticalAlign:'middle'},
  {id:'q-b-fraction-slot',blocks:[{id:'q-b-fraction',type:'table',widthMm:28,widths:[1],padding:0,border:false,rows:[[{id:'c1',type:'cell',blocks:[math('q-b-n','\\boxed{\\rule{0pt}{5mm}\\hspace{24mm}}')]}]]}],verticalAlign:'middle'},
 ]};
 const before=project([question([part('q-b',[{id:'q-b-stem',type:'paragraph',inlines:[{type:'text',text:'Solve.'}]},layout])])]);
 const result=sweep(before,['scaffold-anchor']);
 const node=blockOf(result,'q').content.children[0].prompt.blocks[1];
 assert.equal(layoutAnchored(node),true);
 assert.deepEqual([node.columns,node.padding,node.margin,node.gap],[3,0,0,2]);
 assert.equal(node.slots.length,3);assert.deepEqual(node.slots[2].blocks,[]);
 assert.equal(node.tracks.length,3);assert.ok(node.tracks[2]>=10,'a spare track takes the rest of the row');
 assert.ok(node.tracks[0]<node.tracks[2]*2&&node.tracks[0]>=10);
 normalizeDocument(blockOf(result,'q').content.children[0].prompt);
 assert.equal(sweep(result.project,['scaffold-anchor']).findings.filter(f=>f.action==='fix').length,0,'idempotent');
 assert.deepEqual(verifyCandidate(before,result.project,result.changed),[]);
});

test('bracket-blank: a box in parentheses becomes the teacher\'s gap, same width, in fractions and hand-built numerators',()=>{
 const B=boxLatex(24);
 const layout={id:'sc',type:'layout',arrangement:'scaffold',columns:2,slots:[{id:'s1',blocks:[math('sc-numerator',`\\$(${B})`)]},{id:'s2',blocks:[math('sc-other',`(${B})\\,\\mathrm{g}`)]}]};
 const before=project([question([part('q-a',[math('q-a-frac',`\\dfrac{\\$(\\rule{0pt}{4mm}${B})}{4\\text{ kg}}`),math('q-a-bare',`x=\\$(${B})`),layout])])]);
 const result=sweep(before,['bracket-blank']);
 const prompt=blockOf(result,'q').content.children[0].prompt.blocks;
 assert.equal(prompt[0].inlines[0].latex,`\\dfrac{\\$(\\rule{0pt}{4mm}${gapLatex(24)})}{4\\text{ kg}}`,'inside a fraction');
 assert.equal(prompt[1].inlines[0].latex,`x=\\$(${B})`,'a parenthesised box in an ordinary equation is not a scaffold numerator');
 assert.equal(prompt[2].slots[0].blocks[0].inlines[0].latex,`\\$(${gapLatex(24)})`,'a numerator of a hand-built scaffold');
 assert.equal(prompt[2].slots[1].blocks[0].inlines[0].latex,`(${gapLatex(24)})\\,\\mathrm{g}`);
 assert.equal(result.findings.filter(f=>f.rule==='bracket-blank'&&f.action==='fix').length,3);
 assert.deepEqual(verifyCandidate(before,result.project,result.changed),[],'a blank is a blank whatever draws it');
 assert.equal(sweep(result.project,['bracket-blank']).findings.length,0,'idempotent');
 // The earlier phantom form and a bare box with no brackets: the first is converted, the second is left for the source review.
 const phantom=sweep(project([question([part('q-a',[math('q-a-frac',`\\frac{(\\phantom{${B}})}{2}`),math('q-a-numerator',`\\${'$'}${B}`)])])]),['bracket-blank']);
 const p2=blockOf(phantom,'q').content.children[0].prompt.blocks;
 assert.equal(p2[0].inlines[0].latex,`\\frac{(${gapLatex(24)})}{2}`);
 assert.equal(p2[1].inlines[0].latex,`\\${'$'}${B}`,'a box with no brackets is left alone');
});

test('the signature treats the gap, the box and the old phantom form as the same blank',()=>{
 const B=boxLatex(11);
 const make=latex=>({id:'b',content:{id:'q',type:'question',prompt:doc([math('m',latex)])}});
 const sigs=[`\\frac{(${B})}{2}`,`\\frac{(\\phantom{${B}})}{2}`,`\\frac{(${gapLatex(11)})}{2}`].map(l=>JSON.stringify(contentSignature(make(l))));
 assert.equal(new Set(sigs).size,1);
 assert.notEqual(JSON.stringify(contentSignature(make('\\frac{(3)}{2}'))),sigs[0]);
});

test('normaliseProject: the sweep and the working space apply, except on a block the teacher decided',async()=>{
 const {normaliseProject}=await import('../polish/normalise.mjs');
 const B=boxLatex(24);
 const numerator=id=>part(id,[math(id+'-frac',`\\dfrac{\\$(\\rule{0pt}{4mm}${B})}{4\\text{ kg}}`)]);
 const open=question([numerator('q-a')]),decided={...question([numerator('r-a')]),id:'r'};decided.content.id='r-root';
 const before=project([open,decided]);before.studio.flags=[{id:'t',note:'keep',at:'2026-10-01T00:00:00Z',targetId:'r'}];
 const {project:after,report}=normaliseProject(before);
 const latexOf=(p,id)=>p.sections[0].blocks.find(b=>b.id===id).content.children[0].prompt.blocks[0].inlines[0].latex;
 assert.match(latexOf(after,'q'),new RegExp(gapLatex(24).replace(/[\\{}()]/g,'\\$&')),'the unprotected block gets the bracketed gap');
 assert.equal(latexOf(after,'r'),latexOf(before,'r'),'the teacher\'s block is exactly as it was');
 assert.ok(report.dropped.includes('r'));assert.equal(report.protectedBlocks,1);
 const note=after.sections[0].blocks[0].sourceReview.feedbackRepairs.at(-1);
 assert.equal(note.source,'polish');assert.match(note.note,/Polish normalise \(.*bracket-blank/);
 assert.equal(JSON.stringify(after.studio.flags),JSON.stringify(before.studio.flags),'teacher comments are untouched');
});
import {restoreImportedZeroSpaces} from '../polish/normalise.mjs';
test('normalise restores a protected block\'s separately stored scaffold arrangement',async()=>{
 const {normaliseProject}=await import('../polish/normalise.mjs');
 const arrangement={root:{id:'q-root:layout',type:'group',direction:'row',children:[
  {id:'layout:q-a/prompt#q-a-scaffold',type:'item',ref:'q-a/prompt#q-a-scaffold',align:'right',before:10},
 ]}};
 const before=project([question([part('q-a',[math('q-a-scaffold','x=')])])],{layoutOverrides:{blockLayouts:{q:{arrangement}}}});
 before.studio.flags=[{id:'teacher',at:'2026-10-24T00:00:00Z',targetId:'q',note:'Keep this layout'}];
 const swept=sweep(before,['scaffold-anchor']);
 assert.equal(swept.project.settings.layoutOverrides.blockLayouts.q.arrangement.root.children[0].align,'left','the sweep attempts the confirmed change');
 const {project:after,report}=normaliseProject(before,{workingSpace:false});
 assert.equal(report.protectedBlocks,1);
 assert.deepEqual(after.sections,before.sections);
 assert.deepEqual(after.settings.layoutOverrides,before.settings.layoutOverrides);
 assert.deepEqual(after.studio,before.studio);
});
test('failed normalisation candidate restores only unchanged explicit-zero responses',()=>{
 const input={settings:{layoutOverrides:{answerSpaces:{}}},sections:[{blocks:[{id:'q',content:{id:'root',answerSpaceMm:0,prompt:'Fill table',answer:{short:'Values',worked:'Complete table'}},sourceReview:{workingSpaceEstimate:{estimates:[{targetId:'root',answerSpaceMm:0}]}}}]}]},candidate=structuredClone(input);candidate.sections[0].blocks[0].content.answerSpaceMm=404;
 const repaired=restoreImportedZeroSpaces(input,candidate);assert.equal(repaired.project.sections[0].blocks[0].content.answerSpaceMm,0);assert.equal(repaired.changes.length,1);assert.equal(candidate.sections[0].blocks[0].content.answerSpaceMm,404);
 candidate.sections[0].blocks[0].content.answer.short='Changed answer';assert.equal(restoreImportedZeroSpaces(input,candidate).changes.length,0);
 candidate.sections[0].blocks[0].content.answer.short='Values';candidate.settings.layoutOverrides.answerSpaces.root=35;assert.equal(restoreImportedZeroSpaces(input,candidate).changes.length,0);
});

// ---- floating scaffolds of 23 October 2026 (rates p11-p15) ------------------------------------------------------
const slot=(id,...paragraphs)=>({id,blocks:paragraphs,verticalAlign:'middle'});
const scaffoldLayout=(id,extra={})=>({id,type:'layout',arrangement:'scaffold',columns:3,tracks:[7,23,36],slots:[
 slot(id+'-label-slot',math(id+'-label','1.')),
 slot(id+'-given-slot',math(id+'-given','\\frac{120\\,\\mathrm{c}}{1\\,\\mathrm{L}}=')),
 slot(id+'-fraction-slot',math(id+'-num','\\$(\\rule{0pt}{5mm}\\hspace{24mm})',{align:'center'}),math(id+'-rule','\\rule{34mm}{0.15mm}',{align:'center'}),math(id+'-den','1\\,\\mathrm{L}',{align:'center'})),
],...extra});

test('scaffold-anchor: tracks that are not equal still float when the layout keeps the default margin and padding',()=>{
 const before=project([example([scaffoldLayout('sc')])]);
 const result=sweep(before,['scaffold-anchor']);
 const node=blockOf(result).examples[0].prompt.blocks[0];
 assert.equal(layoutAnchored(node),true);assert.equal(node.slots.length,4);
 // The tracks are millimetres on a column of about 80 mm: each slot is sized to its content, the spare track takes the rest.
 assert.ok(node.tracks[1]<23,'the given no longer has the 23 mm it was stretched to');
 assert.ok(node.tracks.slice(0,3).every(t=>t>=10)&&node.tracks[3]>=10);
 assert.equal(sweep(result.project,['scaffold-anchor']).findings.filter(f=>f.action==='fix').length,0,'idempotent');
 assert.deepEqual(verifyCandidate(before,result.project,result.changed),[]);
 // A scaffold sized by hand (no default spacing left) is not touched.
 const tuned=project([example([scaffoldLayout('sc',{gap:2,padding:0,margin:0})])]);
 assert.equal(sweep(tuned,['scaffold-anchor']).changed.length,0);
});

test('scaffold-anchor: the column a scaffold fills follows its grid and columns, so a full-width scaffold is not packed into 80 mm',()=>{
 const narrow=sweep(project([example([scaffoldLayout('sc')])]),['scaffold-anchor']);
 const wide=sweep(project([{...example([scaffoldLayout('sc')]),presentation:{layout:'stack'}}]),['scaffold-anchor']);
 const spare=result=>blockOf(result).examples[0].prompt.blocks[0].tracks.at(-1);
 assert.ok(spare(wide)>spare(narrow)+50,'a full-width example has far more room than one of two columns');
});

const scaffoldTable=(id,extra={})=>({id,type:'table',widths:[1.6,1],padding:0,border:false,rowHeights:[6,5],rows:[
 [{id:id+'-given',type:'cell',align:'left',verticalAlign:'middle',rowspan:2,blocks:[math(id+'-given-m','\\frac{\\$2.55}{6\\text{ eggs}}\\approx')]},{id:id+'-n',type:'cell',align:'center',verticalAlign:'middle',blocks:[math(id+'-n-m','(\\rule{0pt}{5mm}\\hspace{20mm})',{align:'center'})]}],
 [{id:id+'-d',type:'cell',align:'center',verticalAlign:'middle',blocks:[math(id+'-d-m','\\overline{1\\text{ egg}}',{align:'center'})]}],
],...extra});
const guided=table=>({id:'q',type:'question',pedagogyRole:'guided-practice',content:{id:'q-root',type:'question',prompt:'Q',children:[{id:'q-a',type:'part',label:'a',prompt:doc([table]),answerSpaceMm:10,answer:{short:'1',worked:'1'}}]}});

test('scaffold-anchor: a borderless scaffold table that fills its column is sized to its content and packed left',()=>{
 const before=project([guided(scaffoldTable('q-a-scaffold'))]);
 const result=sweep(before,['scaffold-anchor']);
 const table=blockOf(result,'q').content.children[0].prompt.blocks[0];
 assert.equal(table.widths.length,2);assert.equal(table.widthMm,table.widths[0]+table.widths[1]);
 assert.ok(table.widthMm<60,'content-sized, not the 80 mm column');assert.ok(table.widths[0]>=14,'the given with its fraction and approximation is not squeezed');assert.ok(table.widths[1]>=24,'the numerator box');
 assert.equal(sweep(result.project,['scaffold-anchor']).findings.filter(f=>f.action==='fix').length,0,'idempotent');
 assert.deepEqual(verifyCandidate(before,result.project,result.changed),[],'widths are presentation');
 // A table that already has a width, one with borders and one the local exception names are left alone.
 for(const t of [scaffoldTable('q-a-scaffold',{widthMm:50,widths:[30,20]}),scaffoldTable('q-a-scaffold',{border:true})])assert.equal(sweep(project([guided(t)]),['scaffold-anchor']).changed.length,0);
 const held={...guided(scaffoldTable('q-a-scaffold')),sourceReview:{intentionalDepartures:['Scaffold stays centred; keep the scaffold alignment for this question (teacher)']}};
 assert.equal(sweep(project([held]),['scaffold-anchor']).changed.length,0);
});

test('normaliseProject: a reviewed booklet\'s allowances come down but never go up, an unreviewed one\'s may',async()=>{
 const {normaliseProject}=await import('../polish/normalise.mjs');
 const long='The graph of the function is a reflection in the x-axis followed by a translation of three units up and two to the right.';
 const make=(flags)=>{
  const p={id:'w',revision:3,studio:{flags},settings:{layoutOverrides:{blockLayouts:{},answerSpaces:{}}},sections:[{id:'s',phase:'practice',blocks:[{id:'q',type:'question',pedagogyRole:'question',content:{id:'q-root',type:'question',prompt:'Q',children:[{id:'q-a',type:'part',label:'a',prompt:'Describe.',answerSpaceMm:10,answer:{short:long,worked:long}}]},sourceReview:{responses:[{targetId:'q-a',kind:'short'}],workingSpaceEstimate:{method:'x',estimates:[{targetId:'q-a',widthMm:80,answerSpaceMm:10}]}}}]}]};
  return p;
 };
 const space=p=>p.sections[0].blocks[0].content.children[0].answerSpaceMm;
 const open=normaliseProject(make([]),{sweep:false});
 assert.ok(space(open.project)>10,'an unreviewed short answer gets the handwriting capacity of its expected answer');
 const reviewed=make([{id:'f',note:'x',at:'2026-10-18T00:00:00Z'}]);
 const kept=normaliseProject(reviewed,{sweep:false,imported:make([])});
 assert.equal(space(kept.project),10,'raising is left to the teacher');
});

import {clearSourceBreaks} from '../polish/normalise.mjs';
test('clearSourceBreaks: a source page boundary inside a topic is dropped; exercise starts, topic banners, manual breaks and teacher blocks keep theirs',()=>{
 const block=(id,flow,extra={})=>({id,type:'rich-text',flow,...extra});
 const p={id:'p',sections:[
  {id:'front',topicId:'front',phase:'front-matter',pageBreakBefore:true,blocks:[block('syll',{sourcePageBreakBefore:true})]},
  {id:'review',topicId:'mul',phase:'teaching',blocks:[block('review',{sourcePageBreakBefore:false})]},
  {id:'theory',topicId:'mul',phase:'teaching',blocks:[block('theory',{sourcePageBreakBefore:true,keepWithNext:true}),block('example',{sourcePageBreakBefore:true}),block('manual',{sourcePageBreakBefore:true,pageBreakBefore:true}),block('mine',{sourcePageBreakBefore:true})]},
  {id:'ex',topicId:'mul',phase:'practice',blocks:[block('q1',{sourcePageBreakBefore:true}),block('q2',{sourcePageBreakBefore:true})]},
  {id:'banner',topicId:'div',phase:'teaching',blocks:[block('div-theory',{sourcePageBreakBefore:true})]},
 ]};
 const changed=clearSourceBreaks(p,{protectedIds:new Set(['mine'])});
 assert.deepEqual(changed,['theory','example','q2']);
 const by=Object.fromEntries(p.sections.flatMap(s=>s.blocks.map(b=>[b.id,b.flow])));
 assert.equal(by.theory.sourcePageBreakBefore,false);assert.equal(by.theory.keepWithNext,true,'other flow fields stay');
 for(const id of ['syll','manual','mine','q1','div-theory'])assert.equal(by[id].sourcePageBreakBefore,true,id+' keeps its break');
 assert.equal(by.manual.pageBreakBefore,true);
 assert.deepEqual(clearSourceBreaks(p),['mine'],'idempotent apart from the block the teacher no longer protects');
});
