import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeDocument,renderDocument} from '../public/libs/maths-editor/document-model.mjs';
import {tableScopeCells,setTableCells,alignDocumentBlock,locateDocumentNode} from '../public/libs/maths-editor/document-operations.mjs';
import {equationRowGaps,setEquationRowGap,equationRowSpacing,spaceFractionSteps} from '../public/libs/maths-editor/equation-spacing.mjs';

const para=(id,align='left',text=id)=>({id,type:'paragraph',align,inlines:[{type:'text',text}]});
const cell=(id,options={})=>({id,type:'cell',blocks:[para(id+'-p')],...options});
const grid=()=>normalizeDocument({blocks:[{id:'t',type:'table',rows:[[cell('a1'),cell('b1'),cell('c1')],[cell('a2',{colspan:2}),cell('c2')]]},para('outside')]});
const cells=doc=>Object.fromEntries(doc.blocks[0].rows.flat().map(c=>[c.id,c]));

test('cell controls address the cell, its row, its column or the whole table',()=>{
 const table=grid().blocks[0],ids=scope=>tableScopeCells(table,'b1',scope).map(c=>c.id).sort();
 assert.deepEqual(ids('cell'),['b1']);
 assert.deepEqual(ids('row'),['a1','b1','c1']);
 assert.deepEqual(ids('column'),['a2','b1'],'a merged cell belongs to each column it spans');
 assert.deepEqual(ids('table'),['a1','a2','b1','c1','c2']);
});

test('top-left for a whole table writes only the existing alignment fields',()=>{
 const doc=grid(),before=cells(doc);
 assert.equal(before.a1.verticalAlign,'middle');assert.equal(before.a1.align,'center');
 setTableCells(doc,'c2',{align:'left',verticalAlign:'top'},'table');
 const next=normalizeDocument(doc);
 for(const c of Object.values(cells(next))){assert.equal(c.align,'left');assert.equal(c.verticalAlign,'top');}
 assert.match(renderDocument(next),/<td data-id="a1"[^>]*vertical-align:top;text-align:left/);
 setTableCells(doc,'b1',{paddingTop:1,paddingLeft:3},'column');
 assert.equal(cells(doc).a2.paddingLeft,3);assert.equal(cells(doc).c1.paddingLeft,undefined);
 assert.throws(()=>setTableCells(doc,'outside',{align:'left'}),/table cell/);
});

test('aligning one line in a cell keeps every other line where it was shown',()=>{
 // The stored centre value is dormant: the cell renders all three lines left.
 const doc=normalizeDocument({blocks:[{id:'t',type:'table',rows:[[{id:'c',type:'cell',align:'left',blocks:[para('instruction','left'),para('eq1','center'),para('eq2','center')]}]]}]});
 const shown=html=>[...html.matchAll(/<p data-id="(\w+)"[^>]*text-align:(\w+)/g)].map(m=>m[1]+':'+m[2]);
 assert.deepEqual(shown(renderDocument(doc)),['instruction:left','eq1:left','eq2:left']);
 alignDocumentBlock(doc,'eq1','center',{single:true});
 const next=normalizeDocument(doc);
 assert.equal(next.blocks[0].rows[0][0].preserveParagraphAlignment,true);
 assert.deepEqual(shown(renderDocument(next)),['instruction:left','eq1:center','eq2:left']);
});

test('aligning in a cell without the single-line option moves the whole cell; outside a table it moves the paragraph',()=>{
 const doc=grid();
 alignDocumentBlock(doc,'a1-p','right');
 assert.equal(cells(doc).a1.align,'right');assert.ok(!cells(doc).a1.preserveParagraphAlignment);
 alignDocumentBlock(doc,'outside','center');
 assert.equal(locateDocumentNode(doc,'outside').node.align,'center');
 const kept=normalizeDocument({blocks:[{id:'t',type:'table',rows:[[{id:'c',type:'cell',align:'left',preserveParagraphAlignment:true,blocks:[para('x','left'),para('y','right')]}]]}]});
 setTableCells(kept,'c',{align:'center'});
 assert.deepEqual(kept.blocks[0].rows[0][0].blocks.map(b=>b.align),['center','center']);
});

test('each line of working can carry its own gap, and explicit gaps survive fraction spacing',()=>{
 const latex=String.raw`\begin{aligned}x&=\frac{1}{2}\\x+1&=\frac{3}{2}\\[4mm]2x&=1\end{aligned}`;
 assert.deepEqual(equationRowGaps(latex),[0,4]);
 const next=setEquationRowGap(latex,0,1.5);
 assert.deepEqual(equationRowGaps(next),[1.5,4]);
 assert.equal(equationRowSpacing(next).mixed,true);
 assert.equal(spaceFractionSteps(next),next,'millimetre gaps are deliberate and stay as written');
 assert.throws(()=>setEquationRowGap(latex,5,1),/Edit LaTeX/);
 assert.throws(()=>setEquationRowGap(latex,0,99),/between 0 and 30/);
 assert.deepEqual(equationRowGaps('x=1'),[]);
});

test('the import check reports only table lines whose stored alignment the cell overrides',async()=>{
 const {dormantAlignment}=await import('../scripts/booklet/check-dormant-alignment.mjs');
 const table=cell=>({id:'q',type:'question',content:{id:'root',prompt:{blocks:[{id:'t',type:'table',rows:[[cell]]}]}}});
 const hits=dormantAlignment(table({id:'c',type:'cell',align:'left',blocks:[para('a','left'),para('b','center')]}));
 assert.deepEqual(hits.map(h=>[h.paragraph,h.stored,h.shown]),[['b','center','left']]);
 assert.deepEqual(dormantAlignment(table({id:'c',type:'cell',align:'left',preserveParagraphAlignment:true,blocks:[para('b','center')]})),[]);
 assert.deepEqual(dormantAlignment(table({id:'c',type:'cell',blocks:[para('b','center'),para('a','left')]})),[],'the default cell alignment is centre');
});

test('the gutter check reports bare opening expressions followed by a relation line',async()=>{
 const {missingEqualsGutter}=await import('../scripts/booklet/check-equals-gutter.mjs');
 const math=(id,latex,align='left')=>({id,type:'paragraph',align,inlines:[{type:'math',latex}]});
 const part=blocks=>({id:'q',type:'question',content:{id:'root',type:'question',prompt:{blocks}}});
 const found=blocks=>missingEqualsGutter(part(blocks)).map(h=>[h.shape,h.needs]);
 assert.deepEqual(found([math('a','-5+2'),math('b','=-3')]),[['lines','gutter']]);
 assert.deepEqual(found([math('a','-5+2','center'),math('b','=-3','center')]),[['lines','check']]);
 assert.deepEqual(found([math('a',String.raw`\mathrel{\phantom{=}}-5+2`),math('b','=-3')]),[]);
 assert.deepEqual(found([math('a','y=2x'),math('b','=6')]),[],'the first line already carries the relation');
 assert.deepEqual(found([math('a',String.raw`\begin{aligned}&5+(-6)\\&\color{#268cff}{=5-6}\end{aligned}`)]),[['rows','gutter']]);
 assert.deepEqual(found([math('a',String.raw`\begin{gathered}5+(-6)\\=5-6\end{gathered}`)]),[['rows','check']]);
 assert.deepEqual(found([math('a',String.raw`\begin{aligned}-50-130&=-(50+130)\\&=-180\end{aligned}`)]),[]);
 assert.deepEqual(found([math('a',String.raw`\begin{aligned}&{\mathrel{\phantom{=}}5+(-6)}\\&=5-6\end{aligned}`)]),[]);
 const row=(left,right)=>[{id:left.id+'c',type:'cell',align:'right',blocks:left.inlines?[left]:[]},{id:right.id+'c',type:'cell',align:'left',blocks:[right]}];
 assert.deepEqual(found([{id:'t',type:'table',rows:[row({id:'e'},math('x','40-110')),row(math('eq','='),math('y','40-40'))]}]),[],'an equals-column table already has the gutter');
 assert.deepEqual(found([math('a','2+3','center'),math('b','=5')]),[['lines','gutter']],'an opener centred above left-aligned working moves left');
 assert.deepEqual(found([math('a','2+3','center'),{id:'t',type:'table',rows:[[{id:'c',type:'cell',align:'left',blocks:[math('b','=5')]}]]}]),[['lines','gutter']],'working may continue in a scaffold table');
 assert.match(missingEqualsGutter(part([math('a',String.raw`\begin{aligned}&\quad20\\&=5\end{aligned}`)]))[0].detail,/manual spacing/);
 assert.deepEqual(found([math('a',String.raw`\begin{aligned}&5.7\times1000\\={}&5700\end{aligned}`)]),[],'the relation already sits in the gutter column');
 assert.deepEqual(found([math('a',String.raw`\begin{aligned}&=8+4\\&\quad-(2+1)\\&=9\end{aligned}`)]),[],'a wrapped line after a relation row opens nothing');
 const example=extra=>({id:'b',type:'worked-example',examples:[{id:'e',prompt:{blocks:[math('p',String.raw`\log_2 6-\log_2 3`)]},theorySolution:String.raw`$$\begin{aligned}&=\log_2 2\\&=1\end{aligned}$$`,...extra}]});
 assert.deepEqual(missingEqualsGutter(example({})).map(h=>h.shape),['solution']);
 assert.deepEqual(missingEqualsGutter(example({equationAlignment:{mode:'continuation',align:'left'}})),[]);
});
