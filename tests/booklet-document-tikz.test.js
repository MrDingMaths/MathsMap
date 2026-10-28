import test from 'node:test';
import assert from 'node:assert/strict';
import {documentTikzEntries,mountDocumentTikz} from '../src/lib/document-tikz.js';
import {normalizeDocument,renderDocument} from '../public/libs/maths-editor/document-model.mjs';
import {arrangementCatalog} from '../src/lib/booklet-arrangement.js';
import {arrangementItems} from '../public/libs/maths-editor/arrangement-model.mjs';
const paragraph={id:'interval-graph',type:'paragraph',inlines:[{type:'text',text:'[tikz]% mathsmap-inline-width-mm 65\n\\begin{tikzpicture}\\draw (0,0)--(1,0);\\end{tikzpicture}[/tikz]'}]};
test('native continuation table remains visible while its repeated instruction is hidden',()=>{
 const block={id:'q',type:'question',flow:{fragment:1,hideRepeatedStem:true,tableOnly:true,tableContinuation:{tableId:'table'}},content:{id:'root',prompt:{format:'maths-editor-document-v1',version:1,blocks:[{id:'instruction',type:'paragraph',inlines:[{type:'text',text:'Complete the table.'}]},{id:'table',type:'table',rows:[[{blocks:[paragraph]}]]}]},children:[]}};
 const catalog=arrangementCatalog(block);
 assert.ok(catalog.entries.has('root/prompt#table'));
 assert.ok(!catalog.entries.has('root/prompt#instruction'));
 assert.ok(arrangementItems(catalog.initial.root).some(item=>item.ref==='root/prompt#table'));
 const ordinary=arrangementCatalog({...block,flow:{fragment:1,hideRepeatedStem:true}});
 assert.ok(!ordinary.entries.has('root/prompt#table'));
});
test('table-cell TikZ retains editable source and identity through document normalization',()=>{
 const doc=normalizeDocument({blocks:[{id:'table',type:'table',rows:[[{id:'cell',blocks:[paragraph]}]]}]});
 assert.deepEqual(documentTikzEntries(doc).map(({id,widthMm})=>({id,widthMm})),[{id:'interval-graph',widthMm:65}]);
 assert.match(renderDocument(doc),/data-id="interval-graph"/);
 assert.deepEqual(normalizeDocument(doc),doc);
 assert.deepEqual(documentTikzEntries({blocks:[{...paragraph,inlines:[{type:'text',text:'Instruction [tikz]code[/tikz]'}]}]}),[]);
 assert.deepEqual(documentTikzEntries({blocks:[{...paragraph,inlines:[{type:'text',text:'[tikz]unterminated'}]}]}),[]);
});
test('table-only presentation retains answer ownership and leaves default arrangements unchanged',()=>{
 const block={id:'q',type:'question',content:{id:'root',prompt:{format:'maths-editor-document-v1',version:1,blocks:[{id:'table',type:'table',rows:[[{blocks:[paragraph]}]]}]},children:[{id:'a',type:'part',label:'a',prompt:'',responseSpace:'scaffold',answer:{short:'[0,1]',worked:'Both ends are included.'}}]}};
 const regular=arrangementItems(arrangementCatalog(block).initial.root).map(item=>item.ref);
 assert.ok(regular.includes('a/label'));
 const tableOnly=arrangementCatalog({...block,flow:{tableOnly:true}});
 assert.ok(!arrangementItems(tableOnly.initial.root).some(item=>item.ref==='a/label'));
 assert.equal(tableOnly.entries.get('a/answer/short').value,'[0,1]');
 assert.deepEqual(arrangementItems(arrangementCatalog({...block,flow:{}}).initial.root).map(item=>item.ref),regular);
});
test('an explicit table-owned part list lets appended follow-ups print after a native table',()=>{
 const block={id:'q',type:'question',flow:{tableOnly:true,tableOnlyPartIds:['row']},content:{id:'root',prompt:{format:'maths-editor-document-v1',version:1,blocks:[{id:'table',type:'table',rows:[[{blocks:[paragraph]}]]}]},children:[{id:'row',type:'part',label:'',prompt:'',answer:{short:'0.5',worked:'0.5'}},{id:'follow',type:'part',label:'a',prompt:'Use the completed table.',answer:{short:'1',worked:'1'}}]}};
 const catalog=arrangementCatalog(block),items=arrangementItems(catalog.initial.root).map(item=>item.ref);
 assert(items.includes('root/prompt#table'));assert(items.includes('follow/label'));assert(items.includes('follow/prompt'));assert(!items.includes('row/label'));assert.equal(catalog.entries.get('row/answer/short').value,'0.5');
 const legacy=arrangementItems(arrangementCatalog({...block,flow:{tableOnly:true}}).initial.root).map(item=>item.ref);assert(!legacy.includes('follow/label'));
});
test('table-cell TikZ is a resizable diagram whose width lives in its source',async()=>{
 const {setInlineTikzWidth}=await import('../src/lib/document-tikz.js');
 const {findEditableDiagram,inlineTikzDiagram,patchDiagram}=await import('../src/lib/booklet-review-model.js');
 const {diagramSizeTargets,setDiagramWidths}=await import('../src/lib/booklet-diagram-size.js');
 const text=paragraph.inlines[0].text;
 assert.match(setInlineTikzWidth(text,48),/^\[tikz\]% mathsmap-inline-width-mm 48\n\\begin\{tikzpicture\}/);
 assert.equal(setInlineTikzWidth(setInlineTikzWidth(text,48),52).match(/mathsmap-inline-width-mm/g).length,1);
 assert.match(setInlineTikzWidth('[tikz]\\draw (0,0);[/tikz]',30),/^\[tikz\]% mathsmap-inline-width-mm 30\n\\draw/);
 const prompt={format:'maths-editor-document-v1',version:1,blocks:[{id:'table',type:'table',rows:[[{id:'cell',type:'cell',blocks:[paragraph]}]]}]};
 const project={id:'p',settings:{layoutOverrides:{blockLayouts:{}},compactAnswers:{}},sections:[{id:'s',blocks:[{id:'q',type:'question',content:{id:'root',prompt,children:[]}}]}]};
 const found=findEditableDiagram(project.sections[0].blocks[0],'interval-graph');
 assert.ok(found?.inline);
 assert.equal(inlineTikzDiagram(found.diagram).widthMm,65);
 assert.equal(inlineTikzDiagram(patchDiagram(found.diagram,{widthMm:40})).widthMm,40);
 const rows=diagramSizeTargets(project,['q']);
 assert.deepEqual(rows.map(r=>[r.id,r.widthMm]),[['interval-graph',65]]);
 const next=setDiagramWidths(project,[{blockId:'q',id:'interval-graph',targetMm:44}]);
 assert.deepEqual(diagramSizeTargets(next,['q']).map(r=>r.widthMm),[44]);
 assert.equal(next.settings.layoutOverrides.blockLayouts['interval-graph'],undefined);
});
test('an existing inline width line is replaced where it is',async()=>{
 const {setInlineTikzWidth}=await import('../src/lib/document-tikz.js');
 assert.equal(setInlineTikzWidth('[tikz]\n% mathsmap-inline-width-mm 65\n% other\nX[/tikz]',40),'[tikz]\n% mathsmap-inline-width-mm 40\n% other\nX[/tikz]');
 assert.equal(setInlineTikzWidth('[tikz]\nX[/tikz]',40),'[tikz]\n% mathsmap-inline-width-mm 40\nX[/tikz]');
});
test('table-cell diagram spacing is its paragraph spacing, clamped to 0-80 mm',async()=>{
 const {inlineTikzDiagram,patchDiagram}=await import('../src/lib/booklet-review-model.js');
 const node={...paragraph,spaceBefore:0,spaceAfter:0};
 const spaced=patchDiagram(node,{spaceBefore:6,spaceAfter:120});
 assert.deepEqual([spaced.spaceBefore,spaced.spaceAfter,spaced.inlines],[6,80,node.inlines]);
 assert.deepEqual(inlineTikzDiagram(spaced).spaceBefore,6);
 assert.equal(inlineTikzDiagram(patchDiagram(node,{widthMm:50,spaceAfter:3})).widthMm,50);
});
