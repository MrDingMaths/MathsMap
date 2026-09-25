import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import {fromSource,normalizeDocument,renderDocument,toSource,tableMathLatex} from '../public/libs/maths-editor/document-model.mjs';
import {repairStatisticalTableContent} from '../scripts/booklet/table-conventions.mjs';
import {answerDiagramSignature} from '../src/lib/booklet-exercises.js';

const cell=(id,options={})=>({id,type:'cell',blocks:[{id:id+'-p',type:'paragraph',align:'left',inlines:[{type:'text',text:'Frequency '},{type:'math',latex:'x^2'}]}],...options});
const fixture=()=>normalizeDocument({blocks:[{id:'statistics',type:'table',rows:[[cell('heading',{header:true,bold:false}),cell('body')],[cell('local',{align:'right',preserveParagraphAlignment:true}),cell('plain')]]},{id:'raw-data',type:'table',border:false,rows:[[cell('raw')]]}]});

test('semantic headers render bold text and maths without changing editable content or body cells',()=>{
 const doc=fixture(),before=JSON.stringify(doc),calls=[];
 const html=renderDocument(doc,{math:latex=>{calls.push(latex);return katex.renderToString(latex,{throwOnError:true});}});
 assert.match(html,/<th data-id="heading"[^>]*font-weight:700/);
 assert.match(html,/<td data-id="body"[^>]*font-weight:400/);
 assert.match(html,/class="mord boldsymbol"/);
 assert.equal(calls[0],String.raw`\boldsymbol{x^2}`);
 assert.deepEqual(calls.slice(1),Array(4).fill('x^2'));
 assert.match(html,/<td data-id="raw"[^>]*font-weight:400/);
 assert.equal(JSON.stringify(doc),before);
 assert.equal(toSource(doc).includes('\\boldsymbol'),false);
 assert.deepEqual(normalizeDocument(JSON.parse(before)),doc);
});

test('header previews keep the source field unwrapped and carry formatting through live updates',()=>{
 const html=renderDocument(fixture(),{editable:true,editableMathPreview:true,math:latex=>latex});
 assert.match(html,/data-math-bold="true"/);
 assert.match(html,/<span data-math-preview aria-hidden="true">\\boldsymbol\{x\^2\}<\/span><math-field>x\^2<\/math-field>/);
 assert.equal(tableMathLatex('f',true),String.raw`\boldsymbol{f}`);
 assert.equal(tableMathLatex('f',false),'f');
});

test('cell alignment defaults centre and preserves explicit cell and paragraph exceptions',()=>{
 const html=renderDocument(fixture());
 assert.match(html,/<td data-id="body"[^>]*text-align:center/);
 assert.match(html,/<td data-id="local"[^>]*text-align:right/);
 assert.match(html,/<p data-id="local-p"[^>]*text-align:left/);
});

test('legacy table alignment survives conversion and save/reopen without styling raw prose as a table',()=>{
 const doc=fromSource('| Prose | Score | Result |\n| :--- | :---: | ---: |\n| Explanation | 2 | 3 |');
 assert.deepEqual(doc.blocks[0].rows.map(row=>row.map(c=>c.align)),[['left','center','right'],['left','center','right']]);
 assert.deepEqual(normalizeDocument(JSON.parse(JSON.stringify(doc))),doc);
 assert.equal(fromSource('| 1 | 2 |\n| 3 | 4 |').blocks[0].type,'paragraph');
});

test('reviewed migration respects header direction, prose, raw data and local edits and is idempotent',()=>{
 const table=(id,rows,border=true)=>({id,type:'table',border,rows});
 const input={id:'data-visualisation-1-v1',sections:[{blocks:[
  table('p5-q6-table',[[cell('row-label',{align:'left'}),cell('data',{align:'left'})],[cell('second-label'),cell('manual',{align:'right'})]]),
  table('p3-example-table',[[cell('column-label',{align:'left'}),cell('other-label')],[cell('paragraph-exception',{align:'left',preserveParagraphAlignment:true}),{id:'empty',type:'cell',align:'right',blocks:[]}]]),
  table('p51-purpose-table',[[cell('purpose-head',{align:'left'})],[cell('prose',{align:'left'})]]),
  table('raw-observations',[[cell('raw',{align:'left'})]],false),
  table('p24-answer-total-table',[[cell('formula',{align:'left'})]]),
 ]}],sourceEvidence:{table:table('p3-example-table',[[cell('evidence')]])}};
 const before=structuredClone(input),{project,report}=repairStatisticalTableContent(input),tables=project.sections[0].blocks;
 assert.deepEqual(input,before);
 assert.equal(tables[0].rows[0][0].header,true);
 assert.equal(tables[0].rows[1][0].header,true);
 assert.equal(tables[0].rows[0][1].header,undefined);
 assert.equal(tables[0].rows[0][1].align,'center');
 assert.equal(tables[0].rows[1][1].align,'center','authored right default is centred for statistical tables');
 assert.equal(tables[1].rows[1][0].align,'left');
 assert.equal(tables[1].rows[1][1].align,'center');
 assert.equal(tables[2].rows[0][0].header,true);
 assert.equal(tables[2].rows[1][0].align,'left');
 assert.deepEqual(tables.slice(3),input.sections[0].blocks.slice(3));
 assert.deepEqual(project.sourceEvidence,input.sourceEvidence);
 assert.equal(report.preserved.length,1);
 assert.deepEqual(repairStatisticalTableContent(project).project,project);
});

test('pictogram fixes alter only header/category nodes and bus row headings',()=>{
 const code=String.raw`\node at (12.5,4){Month};\node at (57,4){Sunny days};\node[anchor=west] at (1,-6){January};\begin{scope}[shift={(32,-6)}]\draw (0,0) circle (3);\end{scope}`;
 const input={id:'data-visualisation-1-v1',sections:[{blocks:[{id:'p8-worked-pictogram-native',code},{id:'p9-q2-wrong-pictogram',code},{id:'p9-q3-data-table',type:'table',border:true,rows:[[cell('blank',{blocks:[]}),cell('people')],[cell('monday'),cell('number')]]}]}]};
 const {project}=repairStatisticalTableContent(input),blocks=project.sections[0].blocks;
 assert.match(blocks[0].code,/\\node\[anchor=center\] at \(12\.5,4\)\{\\textbf\{Month\}\}/);
 assert.match(blocks[0].code,/\\node\[anchor=center\] at \(12\.5,-6\)\{January\}/);
 assert.ok(blocks[0].code.endsWith(String.raw`\begin{scope}[shift={(32,-6)}]\draw (0,0) circle (3);\end{scope}`));
 assert.equal(blocks[1].code,code);
 assert.equal(blocks[2].rows[1][0].header,true);
 assert.equal(blocks[2].rows[1][1].header,undefined);
 assert.deepEqual(repairStatisticalTableContent(project).project,project);
});

test('local bold-label width repairs retain overall table widths and editable type sizes',()=>{
 for(const [id,projectId,width,widths,minimum] of [
  ['p24-q4-table','probability-v1',172,[36,25,27,29,29,26],44],
  ['p25-q5-table','probability-v1',87,[47,10,11,11,11,10],49],
  ['p40-q19-table','probability-v1',115.4,[22,20,20,20,20],31],
  ['p41-q24-a-table','probability-v1',70.31,[28,24,26,22],26],
  ['p30-q13-table','data-visualisation-1-v1',174,[22,...Array(12).fill(12)],27],
 ]) {
  const input={id:projectId,sections:[{blocks:[{id,type:'table',border:true,widthMm:width,widths,rows:[[cell('label'),cell('value')]]}]}]};
  const {project,report}=repairStatisticalTableContent(input),table=project.sections[0].blocks[0];
  assert.equal(table.widthMm,width);
  assert.equal(table.widths[0],minimum);
  assert.ok(Math.abs(table.widths.reduce((a,b)=>a+b,0)-width)<.001);
  assert.deepEqual(table.rows[0][1].blocks,input.sections[0].blocks[0].rows[0][1].blocks);
  assert.equal(report.tables[0].widthChanged,true);
  assert.deepEqual(repairStatisticalTableContent(project).project,project);
 }
});

test('formatting repairs retain calibrated widths only when their saved source signature was current',()=>{
 const diagram={id:'p4-q1-a-table',code:String.raw`\node at (11,-4) {Score};\node at (63.5,-4) {Frequency};`};
 const signature=answerDiagramSignature(diagram);
 const input={id:'data-visualisation-1-v1',settings:{compactAnswers:{diagramStyles:{short:{[diagram.id]:{widthMm:76,sourceSignature:signature}},worked:{[diagram.id]:{widthMm:60,sourceSignature:'stale'}}}}},sections:[{blocks:[diagram]}]};
 const {project}=repairStatisticalTableContent(input);
 assert.equal(project.settings.compactAnswers.diagramStyles.short[diagram.id].widthMm,76);
 assert.equal(project.settings.compactAnswers.diagramStyles.short[diagram.id].sourceSignature,answerDiagramSignature(project.sections[0].blocks[0]));
 assert.equal(project.settings.compactAnswers.diagramStyles.worked[diagram.id].sourceSignature,'stale');
 assert.equal(input.settings.compactAnswers.diagramStyles.short[diagram.id].sourceSignature,signature);
});

test('Probability heading gets local width without growing its table or changing body maths',()=>{
 const input={id:'probability-v1',sections:[{blocks:[{id:'p22-q6-table',type:'table',border:true,widthMm:118,widths:[23,21,56],padding:2,rows:[[cell('outcome'),cell('probability'),cell('expected')],[cell('body-a'),cell('body-b'),cell('body-c')]]}]}]};
 const {project}=repairStatisticalTableContent(input),table=project.sections[0].blocks[0];
 assert.equal(table.widthMm,118);
 assert.equal(table.widths[0],118*.23);
 assert.equal(table.widths[1],31);
 assert.ok(Math.abs(table.widths.reduce((a,b)=>a+b,0)-118)<.001);
 assert.deepEqual(table.rows[1][1].blocks,input.sections[0].blocks[0].rows[1][1].blocks);
 assert.deepEqual(repairStatisticalTableContent(project).project,project);
});

test('repeated answer diagram headings are bold without disturbing stem leaves or symbol positions',()=>{
 const code=String.raw`\node[] at (6,4) {Stem};\node[] at (12,4) {Tens};\node[] at (18,4) {Units};\node[] at (28,4) {RAW};\node[] at (60,4) {ORDERED};\node[] at (6,-6) {0};\node[] at (16,-6) {6};`;
 const input={id:'data-visualisation-1-v1',sections:[{blocks:[{id:'root',answer:{solutionDiagrams:[{id:'p28-q7-a-raw-solution',code}]}}]}]};
 const {project}=repairStatisticalTableContent(input),result=project.sections[0].blocks[0].answer.solutionDiagrams[0].code;
 for(const header of ['Stem','Tens','Units','RAW','ORDERED'])assert.ok(result.includes(`{\\textbf{${header}}};`));
 assert.ok(result.endsWith(String.raw`\node[] at (6,-6) {0};\node[] at (16,-6) {6};`));
 assert.deepEqual(repairStatisticalTableContent(project).project,project);
});

test('Linear x/y value tables use row headers without bolding numeric first-row values',()=>{
 const cell=latex=>({blocks:[{type:'paragraph',inlines:[{type:'math',latex}]}],header:true});
 const input={id:'linear-relationships-v1',sections:[{blocks:[{type:'table',id:'values',rows:[[cell('x'),cell('1')],[cell('y'),cell('2')]]}]}]};
 const {project}=repairStatisticalTableContent(input);
 assert.deepEqual(project.sections[0].blocks[0].rows.map(row=>row.map(c=>c.header)),[[true,false],[true,false]]);
 assert.deepEqual(repairStatisticalTableContent(project).project,project);
});

test('reviewed Linear named quantity tables have column labels, with raw continuation tables untouched',()=>{
 const cell=text=>({blocks:[{type:'paragraph',inlines:[{type:'text',text}]}],header:false});
 const rows=[[cell('Number of shapes x'),{...cell('1'),header:true}],[cell('Number of matches y'),cell('4')]];
 const input={id:'linear-relationships-v1',sections:[{blocks:[{type:'table',id:'named',rows},{type:'table',id:'raw',rows:[[cell('0'),cell('1')],[cell('3'),cell('4')]]}]}]};
 const {project}=repairStatisticalTableContent(input);
 assert.deepEqual(project.sections[0].blocks[0].rows.map(row=>row.map(c=>c.header)),[[true,false],[true,false]]);
 assert.deepEqual(project.sections[0].blocks[1],input.sections[0].blocks[1]);
});

test('internal x/y divider columns receive headers without bolding leading or trailing data',()=>{
 const cell=text=>({blocks:[{type:'paragraph',inlines:[{type:'text',text}]}],header:true});
 const input={id:'linear-relationships-v1',sections:[{blocks:[{type:'table',id:'internal',rows:[[cell('0'),cell('x'),cell('1')],[cell('3'),cell('y'),cell('4')]]}]}]};
 const {project}=repairStatisticalTableContent(input);
 assert.deepEqual(project.sections[0].blocks[0].rows.map(row=>row.map(c=>c.header)),[[false,true,false],[false,true,false]]);
});

test('named quantity labels and adjacent x/y variable labels are both headers',()=>{
 const cell=text=>({blocks:[{type:'paragraph',inlines:[{type:'text',text}]}],header:false});
 const input={id:'linear-relationships-v1',sections:[{blocks:[{type:'table',id:'named-internal',rows:[[cell('Number of tables'),cell('x'),cell('1')],[cell('Number of chairs'),cell('y'),cell('4')]]}]}]};
 const {project}=repairStatisticalTableContent(input);
 assert.deepEqual(project.sections[0].blocks[0].rows.map(row=>row.map(c=>c.header)),[[true,true,false],[true,true,false]]);
});
