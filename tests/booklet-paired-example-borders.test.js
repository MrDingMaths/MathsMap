import test from 'node:test';
import assert from 'node:assert/strict';
import {removePairedHeadingBorders,alignInverseWorkedExamples,isPairedHeading} from '../scripts/booklet/repair-paired-example-borders-20261004.mjs';

const para=text=>({type:'paragraph',inlines:[{type:'text',text}]});
const heading=(id,left='Worked Example',right='Your Turn')=>({id,type:'table',border:true,borderColour:'#cccccc',borderWidthMm:.26,rows:[[{id:id+'-a',type:'cell',blocks:[para(left)]},{id:id+'-b',type:'cell',blocks:[para(right)]}]]});

test('paired headings and their arrangement rules lose borders; other tables keep theirs',()=>{
 const values=heading('values','x','y');
 const source={settings:{layoutOverrides:{blockLayouts:{paired:{arrangement:{root:{id:'root',children:[{id:'row',rules:'grid',children:[]}]}}},other:{arrangement:{root:{id:'grid',rules:'grid'}}}}}},
  sections:[{blocks:[{id:'paired',content:{prompt:{blocks:[heading('h')]}}},{id:'other',content:{prompt:{blocks:[values]}}}]}]};
 assert.ok(isPairedHeading(heading('h')));assert.equal(isPairedHeading(values),false);
 const {project,records}=removePairedHeadingBorders(source),table=project.sections[0].blocks[0].content.prompt.blocks[0];
 assert.equal(table.border,false);assert.equal(table.borderColour,undefined);assert.equal(table.rows[0][0].blocks[0].inlines[0].text,'Worked Example');
 assert.equal(project.settings.layoutOverrides.blockLayouts.paired.arrangement.root.children[0].rules,undefined);
 assert.equal(project.settings.layoutOverrides.blockLayouts.other.arrangement.root.rules,'grid');
 assert.equal(project.sections[0].blocks[1].content.prompt.blocks[0].border,true);
 assert.deepEqual(records.map(r=>r.tableId??r.arrangementGroup),['h','row']);
 assert.equal(source.sections[0].blocks[0].content.prompt.blocks[0].border,true);
 assert.deepEqual(removePairedHeadingBorders(project).records,[]);
});

test('a worked example given becomes the first ordinary-ink row of its aligned working',()=>{
 const part=name=>({id:`p7-example-${name}-row-root`,prompt:{blocks:[{id:`p7-example-${name}`,...para('Determine the inverse relation of:')},
  {id:`p7-example-${name}-given`,type:'paragraph',inlines:[{type:'math',latex:'y=5x-2',display:true}]},
  {id:`p7-example-${name}-answer`,type:'paragraph',inlines:[{type:'math',latex:String.raw`\begin{aligned}x&=5y-2\\y&=\frac{x+2}{5}\end{aligned}`,display:true,colour:'#268cff'}]}]}});
 const source={sections:[{blocks:[{id:'p7-example-group',content:{layout:'grid',children:['linear','cubic','quadratic'].flatMap(n=>[part(n),{id:'p7-turn-'+n}])}}]}]};
 const {project,records}=alignInverseWorkedExamples(source),blocks=project.sections[0].blocks[0].content.children[0].prompt.blocks;
 assert.equal(records.length,3);assert.deepEqual(blocks.map(b=>b.id),['p7-example-linear','p7-example-linear-answer']);
 assert.equal(blocks[1].inlines[0].latex,String.raw`\begin{aligned}\color{#24282d}y&\color{#24282d}=5x-2\\x&=5y-2\\y&=\frac{x+2}{5}\end{aligned}`);
 assert.equal(blocks[1].inlines[0].colour,'#268cff');
 assert.throws(()=>alignInverseWorkedExamples(project),/Expected the given equation/);
});
