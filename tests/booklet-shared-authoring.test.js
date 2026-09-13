import test from 'node:test';
import assert from 'node:assert/strict';
import {factorAuthorDiagrams,materializeAuthorDiagrams,SHARED_DIAGRAM_FORMAT} from '../scripts/booklet/shared-diagram-authoring.mjs';
import {measureInventoryProjection} from '../scripts/booklet/benchmark-shared-authoring.mjs';
import {loadTikzEngine} from '../scripts/booklet/check-pgfplots-engine.mjs';

const base=String.raw`\begin{tikzpicture}[draw=black,text=black,line width=0.8pt]
\path[use as bounding box] (-1,-1) rectangle (4,3);
\coordinate (A) at (0,0);\coordinate (B) at (3,0);
\draw (A)--(B);
\node[left] at (A) {$A$};\node[right] at (B) {$B$};
`;
const end='\\end{tikzpicture}';
const packet=()=>({
 pageNumber:7,authoringFormat:SHARED_DIAGRAM_FORMAT,diagramLibrary:{base,end},
 sections:[{id:'p7',title:'Angles',blocks:[{id:'p7-q',type:'question',content:{
  id:'p7-q-root',prompt:'Name the points.',
  questionDiagrams:[{id:'p7-figure',format:'tikz',role:'question',codeParts:['base','end'],widthMm:45,spec:{sourcePage:7,description:'Keep A and B.'}}],
  answer:{short:'A, B',worked:'Identify both points.',solutionDiagrams:[{id:'p7-answer',format:'tikz',role:'solution',codeParts:['base',{text:'\\node[above] at (1,0) {$x_1^2+\\frac{1}{2}$};\n'},'end'],widthMm:35,spec:{sourcePage:7,answerVisibility:'answer-only'}}]},
 }}]}],
 inventoryMappings:[{inventoryId:'src-7',targetId:'p7-q-root'}],
});

test('shared diagrams materialize in one frame with independent IDs, givens, answers and source evidence',async()=>{
 const source=packet(),before=structuredClone(source),expanded=materializeAuthorDiagrams(source,{enabled:true});
 assert.deepEqual(source,before);assert.equal(expanded.authoringFormat,undefined);assert.equal(expanded.diagramLibrary,undefined);
 const content=expanded.sections[0].blocks[0].content,q=content.questionDiagrams[0],a=content.answer.solutionDiagrams[0];
 assert.equal(q.code,base+end);assert.doesNotMatch(q.code,/x_1/);assert.match(a.code,/x_1/);
 assert.equal(q.id,'p7-figure');assert.equal(a.id,'p7-answer');assert.deepEqual(q.spec,source.sections[0].blocks[0].content.questionDiagrams[0].spec);
 assert.equal(q.codeParts,undefined);assert.equal(a.widthMm,35);assert.equal((a.code.match(/\\begin\{tikzpicture\}/g)||[]).length,1);
 assert.deepEqual(expanded.inventoryMappings,source.inventoryMappings);
 const compile=await loadTikzEngine(),result=await compile(a.code);assert.match(result.svg,/<svg/);assert.match(result.svg,/data-diagram-label/);
});

test('materialization rejects missing references, recursive fragments, ambiguous code and separate overlays',()=>{
 assert.throws(()=>materializeAuthorDiagrams(packet()),/explicit config/);
 const change=fn=>{const p=packet();fn(p,p.sections[0].blocks[0].content.questionDiagrams[0]);return ()=>materializeAuthorDiagrams(p,{enabled:true});};
 assert.throws(change((p,d)=>d.codeParts=['missing']),/Unknown diagram fragment/);
 assert.throws(change(p=>p.diagramLibrary.base={ref:'base'}),/Invalid diagram fragment/);
 assert.throws(change((p,d)=>d.code='also code'),/without code/);
 assert.throws(change((p,d)=>d.overlayOf='other'),/separately scaled/);
 assert.throws(change((p,d)=>d.codeParts=['base','end','base','end']),/exactly one/);
 assert.throws(change((p,d)=>d.codeParts=['end','base']),/exactly one/);
 assert.throws(change((p,d)=>d.codeParts=[{text:'x',ref:'base'}]),/literal/);
 assert.throws(change(p=>delete p.authoringFormat),/missing/);
});

test('offline factoring round-trips complete repeated code and retains normal fallback',()=>{
 const p=materializeAuthorDiagrams(packet(),{enabled:true});
 const list=p.sections[0].blocks[0].content.questionDiagrams;
 for(let i=0;i<8;i++)list.push({...structuredClone(list[0]),id:'p7-copy-'+i,code:'% occurrence '+i+'\n'+base+end});
 const before=structuredClone(p),compact=factorAuthorDiagrams(p);
 assert.ok(JSON.stringify(compact).length<JSON.stringify(p).length);assert.ok(compact.diagramLibrary);
 assert.deepEqual(materializeAuthorDiagrams(compact,{enabled:true}),p);assert.deepEqual(p,before);
 const simple={pageNumber:1,sections:[],inventoryMappings:[]};assert.deepEqual(factorAuthorDiagrams(simple),simple);
 assert.deepEqual(materializeAuthorDiagrams(simple),simple);
});

test('inventory experiment preserves givens, ambiguity, arrangements and future unknown fields',()=>{
 const text='A repeated full source instruction, including every unit and stated precision. '.repeat(5);
 const inv={entries:[{id:'a',description:text,ambiguity:'Keep 7.7 to one decimal place.',model:{given:7.7,quantum:.1},presentation:{columns:3}},{id:'b',parentId:'a',description:text}],future:{nested:text}};
 const before=structuredClone(inv),result=measureInventoryProjection(inv);
 assert.equal(result.roundTripEqual,true);assert.ok(result.potentialCharacterSaving>0);assert.deepEqual(inv,before);
 const collision=measureInventoryProjection({entries:[{$sharedText:'source field'}]});assert.equal(collision.eligible,false);assert.equal(collision.potentialCharacterSaving,0);
});
