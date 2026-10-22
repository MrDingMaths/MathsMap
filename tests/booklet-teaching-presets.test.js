import test from 'node:test';
import assert from 'node:assert/strict';
import {TEACHING_PRESETS,ParagraphEditor,presetById,presetFor,matchPresets,structurePatches,nodeIndex,fieldPatch,diffPatches,snapGap,HOUSE,PRESET_THRESHOLD} from '../src/lib/booklet-teaching-presets.js';
import {TEACHING_SCALE} from '../src/lib/booklet-house-style.js';
import {signatureFromInk,compareSignatures,signatureHash} from '../src/lib/teaching-signature.js';
import {trialApply,patchAllowed} from '../first-pass/apply.mjs';
import {applyCorrections} from '../scripts/booklet/lean-review.mjs';

const word=(t,x,y,extra={})=>({t,x,y,w:Math.max(2,t.length*2),h:4.8,b:false,c:'#24282d',m:0,...extra});
const lineOf=(y,items)=>items.map(([t,x,extra])=>word(t,x,y,extra));
const ink=(...lines)=>({words:lines.flat(),rules:[],figures:[],items:[],arrows:[]});
const para=(id,text,extra={})=>({id,type:'paragraph',align:'left',inlines:[{type:'text',text}],...extra});
const doc=blocks=>({format:'maths-editor-document-v1',version:1,blocks});
const question=(id,children=4,extra={})=>({id,type:'question',content:{id:id+'-root',type:'question',label:'1',prompt:'Do these.',children:Array.from({length:children},(_,i)=>({id:`${id}-${'abcdef'[i]}`,type:'part',label:'abcdef'[i],prompt:'part '+i})),...extra}});
// Apply patches to a block as the repair tool does, and return the block.
const applied=(block,patches,settings={})=>{
 const copy=structuredClone(block),holder={id:'project',settings:structuredClone(settings)};
 const result=applyCorrections([copy,holder],[{id:'t',patches}]);
 assert.deepEqual(result.rejected.filter(r=>r.status==='rejected'),[],'patches apply');
 return {block:copy,settings:holder.settings};
};
const guard=(block,patches,settings={})=>trialApply({blocks:[structuredClone(block)],settings,corrections:[{id:'sm-test',patches}],applyCorrections});

test('the catalogue holds the seven house presets and the teaching presets',()=>{
 const ids=TEACHING_PRESETS.map(p=>p.id);
 for(const id of ['stacked-parts','parts-grid','diagram-above','diagram-after','diagram-left','diagram-right','paired-worked-your-turn','two-column-worked-example','worked-rows','ratio-table','figure-beside-working','scaffold-table-column-arrows'])assert.ok(ids.includes(id),id);
 assert.equal(new Set(ids).size,ids.length);
 for(const p of TEACHING_PRESETS)for(const key of ['match','build','expected','dimension','summary'])assert.ok(p[key]!==undefined,p.id+' has '+key);
 assert.deepEqual(TEACHING_SCALE.gapsMm,[1,2,4]);assert.equal(HOUSE.TEACHING_SCALE,TEACHING_SCALE);
 assert.equal(snapGap(1.2),1);assert.equal(snapGap(3.1),4);assert.equal(snapGap(1.6),2);
});

test('parts in columns: match, build, apply, expected',()=>{
 const columns=ink(...[20,28,36].map((y,i)=>[...lineOf(y,[['left'+i,20]]),...lineOf(y,[['right'+i,110]])]));
 const source=signatureFromInk(columns),block=question('q');
 const hit=presetFor('layout',source,block);
 assert.equal(hit.preset.id,'parts-grid');assert.deepEqual(hit.params,{columns:2});
 const patches=hit.preset.build(block,hit.params,HOUSE);
 assert.deepEqual(patches.map(p=>[p.field,p.original,p.corrected]),[['/layout',null,'grid'],['/columns',null,2]]);
 const {block:next}=applied(block,patches);
 assert.equal(next.content.layout,'grid');assert.equal(next.content.columns,2);
 assert.equal(guard(block,patches).accepted.length,1,'the content guard passes layout fields');
 assert.deepEqual(hit.preset.expected(hit.params),{layout:'side-by-side',lanes:2});
 // Already in place: an empty patch list, not null.
 assert.deepEqual(hit.preset.build(next,hit.params,HOUSE),[]);
});
test('stacked parts remove the grid, and only on question blocks',()=>{
 const source=signatureFromInk(ink(lineOf(20,[['one',20]]),lineOf(28,[['two',20]])));
 const grid=question('q',4,{layout:'grid',columns:2}),preset=presetById('stacked-parts');
 assert.equal(preset.match(source,{block:grid}).score,.7);
 const patches=preset.build(grid,{},HOUSE);
 assert.equal(patches[0].corrected,undefined);
 assert.equal(applied(grid,patches).block.content.layout,undefined);
 assert.equal(preset.match(source,{block:{id:'w',type:'worked-example'}}),null);
 assert.equal(preset.build({id:'w',type:'worked-example'},{},HOUSE),null);
});
test('a diagram goes where the source puts it, with a house placement',()=>{
 const block={...question('q',0),content:{...question('q',0).content,questionDiagrams:[{id:'d',format:'tikz',code:'x'}]}};
 const sig=side=>signatureFromInk({...ink(lineOf(40,[['text',60]]),lineOf(48,[['more',60]])),figures:{left:[{x:20,y:30,w:30,h:30}],right:[{x:140,y:30,w:30,h:30}],above:[{x:60,y:5,w:30,h:30}],below:[{x:60,y:60,w:30,h:30}]}[side]});
 const expectField={left:'beside-prompt',right:'right-of-prompt',above:'before-prompt'};
 for(const side of ['left','right','above']){
  const hit=presetFor('figure',sig(side),block);
  assert.equal(hit.params.side,side);
  const patches=hit.preset.build(block,hit.params,HOUSE);
  assert.equal(patches[0].corrected,expectField[side]);
  assert.equal(applied(block,patches).block.content.diagramPlacement,expectField[side]);
 }
 const after=presetFor('figure',sig('below'),block);
 assert.equal(after.preset.id,'diagram-after');
 assert.deepEqual(after.preset.build(block,after.params,HOUSE),[],'omitted placement is already the default');
});
test('worked examples go side by side or into rows, never more columns than examples',()=>{
 const sourceTwo=signatureFromInk(ink(...[20,28,36].map(y=>[...lineOf(y,[['left'+y,20]]),...lineOf(y,[['right'+y,110]])])));
 const example=id=>({id,prompt:doc([para(id+'-p','text')])});
 const block={id:'w',type:'worked-example',presentation:{layout:'worked-rows',columns:1,numberSteps:false},examples:[example('e1'),example('e2')]};
 const hit=presetFor('layout',sourceTwo,block);
 assert.equal(hit.preset.id,'two-column-worked-example');
 const patches=hit.preset.build(block,hit.params,HOUSE);
 assert.deepEqual(applied(block,patches).block.presentation,{layout:'columns',columns:2,numberSteps:false});
 assert.equal(hit.preset.build({...block,examples:[example('e1')]},hit.params,HOUSE),null);
 const stacked=signatureFromInk(ink(lineOf(20,[['a',20]]),lineOf(28,[['b',20]])));
 const rows=presetById('worked-rows'),back=rows.build({...block,presentation:{layout:'columns',columns:2}},{},HOUSE);
 assert.deepEqual(applied({...block,presentation:{layout:'columns',columns:2}},back).block.presentation,{layout:'worked-rows',columns:1});
 assert.ok(rows.match(stacked,{block}).score>=PRESET_THRESHOLD);
 assert.equal(presetById('paired-worked-your-turn').build(block,{},HOUSE),null,'authoring-time only');
});

// A worked example of three lines whose equals signs the source aligns.
const working=()=>({id:'w',type:'worked-example',presentation:{layout:'worked-rows'},examples:[{id:'e',prompt:doc([para('p1','x + 1 = 5'),para('p2','= 4',{indent:0}),para('p3','= 4',{align:'center'})])}]});
const sourceColumn=()=>signatureFromInk(ink(lineOf(20,[['x',20],['+',24],['1',28],['=',40],['5',46]]),lineOf(28,[['=',40.4],['4',46]]),lineOf(36,[['=',40],['4',46]])));
const renderColumn=()=>signatureFromInk({words:[...lineOf(20,[['x',20,{n:'p1'}],['+',24,{n:'p1'}],['1',28,{n:'p1'}],['=',40,{n:'p1'}],['5',46,{n:'p1'}]]),...lineOf(28,[['=',20,{n:'p2'}],['4',26,{n:'p2'}]]),...lineOf(36,[['=',30,{n:'p3'}],['4',36,{n:'p3'}]])],rules:[],figures:[],items:[],arrows:[]});
test('equals column: paragraphs are indented from the rendered positions until the signs line up',()=>{
 const source=sourceColumn(),render=renderColumn(),block=working();
 const comparison=compareSignatures(source,render);
 assert.equal(comparison.mismatches.find(m=>m.type==='column').severity,'decidable');
 const hit=presetFor('column',source,block);
 assert.equal(hit.preset.id,'equals-column');
 const patches=hit.preset.build(block,hit.params,HOUSE,{render,map:comparison.map});
 const byNode=Object.fromEntries(patches.map(p=>[p.targetId,p.corrected]));
 assert.equal(byNode.p2,20,'left aligned: a 20 mm shift is 20 mm of padding');
 assert.equal(byNode.p3,20,'centred: padding moves it by half, so the shift doubles (2 x 10 mm)');
 assert.equal(byNode.p1,undefined);
 // Round trip: the signs end up in one column once the shifts are applied to the measured positions.
 const shifted=signatureFromInk({words:[...lineOf(20,[['x',20],['+',24],['1',28],['=',40],['5',46]]),...lineOf(28,[['=',40],['4',46]]),...lineOf(36,[['=',40],['4',46]])],rules:[],figures:[],items:[],arrows:[]});
 assert.equal(compareSignatures(source,shifted).mismatches.length,0);
 assert.equal(applied(block,patches).block.examples[0].prompt.blocks[1].indent,20);
 assert.equal(guard(block,patches).accepted.length,1);
 // Without the render, or with a right-aligned line, the preset declines.
 assert.equal(hit.preset.build(block,hit.params,HOUSE,{}),null);
 const right=structuredClone(block);right.examples[0].prompt.blocks[1].align='right';
 assert.equal(hit.preset.build(right,hit.params,HOUSE,{render,map:comparison.map}),null);
});
test('relative indent adds padding only, from a base that leaves every line where it is or to the right',()=>{
 const source=signatureFromInk(ink(lineOf(20,[['Intro',20]]),lineOf(28,[['Step',24]]),lineOf(36,[['Step',24]]),lineOf(44,[['End',20]])));
 const render=signatureFromInk({words:[...lineOf(20,[['Intro',20,{n:'a'}]]),...lineOf(28,[['Step',20,{n:'b'}]]),...lineOf(36,[['Step',20,{n:'c'}]]),...lineOf(44,[['End',20,{n:'d'}]])],rules:[],figures:[],items:[],arrows:[]});
 const block={id:'t',type:'rich-text',content:doc([para('a','Intro'),para('b','Step'),para('c','Step'),para('d','End')])};
 const comparison=compareSignatures(source,render),mismatches=comparison.mismatches.filter(m=>m.type==='indent');
 assert.ok(mismatches.length>0);
 const levels=source.lines.map(l=>({sourceId:l.id,level:l.indent,lane:l.lane}));
 const preset=presetById('relative-indent'),patches=preset.build(block,{},HOUSE,{render,map:comparison.map,levels});
 assert.deepEqual(Object.fromEntries(patches.map(p=>[p.targetId,p.corrected])),{b:4,c:4});
 assert.ok(patches.every(p=>p.corrected>=0));
 assert.equal(guard(block,patches).accepted.length,1);
});
test('group spacing uses 1 mm within a group and 2 or 4 mm between groups by rank',()=>{
 const render=signatureFromInk({words:[...lineOf(20,[['one',20,{n:'a'}]]),...lineOf(28,[['two',20,{n:'b'}]])],rules:[],figures:[],items:[],arrows:[]});
 const block={id:'t',type:'rich-text',content:doc([para('a','one'),para('b','two')])};
 const preset=presetById('group-spacing');
 const patch=(split,rank)=>preset.build(block,{},HOUSE,{render,boundaries:[{lineId:'L0',split,rank}]})[0].corrected;
 assert.equal(patch(false,0),TEACHING_SCALE.withinGroupMm);assert.equal(patch(true,0),2);assert.equal(patch(true,1),4);
});
test('markers, alignment and ratio tables write only fields the renderer reads',()=>{
 const numbered=presetById('numbered-steps'),block={id:'w',type:'worked-example',presentation:{layout:'columns',numberSteps:false},examples:[]};
 const patches=numbered.build(block,{},HOUSE);
 assert.deepEqual(applied(block,patches).block.presentation,{layout:'columns',numberSteps:true});
 assert.equal(numbered.build({id:'r',type:'rich-text'},{},HOUSE),null);
 const render=signatureFromInk({words:lineOf(20,[['display',20,{n:'p'}]]),rules:[],figures:[],items:[],arrows:[]});
 const rich={id:'t',type:'rich-text',content:doc([para('p','display')])};
 const align=presetById('line-alignment').build(rich,{},HOUSE,{render,aligns:[{lineId:'L0',align:'center'}]});
 assert.equal(applied(rich,align).block.content.blocks[0].align,'center');
 // The ratio convention is the sweep's: it is injected, and its changes become patches.
 const table={id:'t1',type:'table',border:true,widths:[1,1],rows:[[{id:'c1',type:'cell',background:'#d3e8fc',blocks:[para('x','3')]},{id:'c2',type:'cell',blocks:[para('y',':')]}]]};
 const ratio={id:'r',type:'rich-text',content:doc([table])};
 const ratioFix=b=>{const t=b.content.blocks[0];t.border=false;t.widths=[9,2.5];delete t.rows[0][0].background;return b;};
 const fixed=presetById('ratio-table').build(ratio,{},HOUSE,{ratioFix});
 const fields=Object.fromEntries(fixed.map(p=>[p.targetId+p.field,p.corrected]));
 assert.equal(fields['t1/border'],false);assert.deepEqual(fields['t1/widths'],[9,2.5]);assert.ok('c1/background' in fields);
 assert.equal(presetById('ratio-table').build(ratio,{},HOUSE,{}),null);
 assert.equal(applied(ratio,fixed).block.content.blocks[0].border,false);
});
test('table arrows are annotations between the cells of the lines they join, red for operations',()=>{
 const table={id:'t1',type:'table',rows:[
  [{id:'c-display',type:'cell',blocks:[para('p-display','12 25')]}],
  [{id:'c-label',type:'cell',blocks:[para('p-label','Hours')]}]]};
 const block={id:'t',type:'rich-text',content:doc([table])};
 const source=signatureFromInk({...ink(lineOf(40,[['12',20]]),lineOf(60,[['Hours',20]])),arrows:[{start:[22,56],end:[22,46],heads:'end',curved:false,colour:'#ef6068'}]});
 const render=signatureFromInk({words:[...lineOf(40,[['12',20,{n:'p-display'}]]),...lineOf(60,[['Hours',20,{n:'p-label'}]])],rules:[],figures:[],items:[],arrows:[]});
 const comparison=compareSignatures(source,render);
 assert.ok(comparison.mismatches.some(m=>m.type==='arrows'&&m.severity==='decidable'));
 const hit=presetFor('arrows',source,block);
 assert.equal(hit.preset.id,'scaffold-table-column-arrows');
 const patches=hit.preset.build(block,hit.params,HOUSE,{render,map:comparison.map});
 assert.equal(patches.length,1);
 const entry=patches[0].corrected.at(-1);
 assert.deepEqual([entry.type,entry.cellId,entry.toCellId,entry.side,entry.colour,entry.heads],['arrow','c-label','c-display','middle',HOUSE.BOOKLET_HOUSE_STYLE.colours.red,'end']);
 assert.equal(applied(block,patches).block.content.blocks[0].annotations.length,1);
 assert.equal(guard(block,patches).accepted.length,1,'annotation references are structure, not printed content');
 // The same arrow again changes nothing.
 assert.deepEqual(hit.preset.build(applied(block,patches).block,hit.params,HOUSE,{render,map:comparison.map}),[]);
});
test('a table arrow carries its printed source label, and a block whose signature lost it is queued',()=>{
 const table={id:'t1',type:'table',rows:[
  [{id:'c-display',type:'cell',blocks:[para('p-display','12 25')]}],
  [{id:'c-label',type:'cell',blocks:[para('p-label','Hours')]}]]};
 const block={id:'t',type:'rich-text',content:doc([table])};
 const source=signatureFromInk({...ink(lineOf(40,[['12',20]]),lineOf(60,[['Hours',20]])),arrows:[{start:[22,56],end:[22,46],heads:'end',curved:false,colour:'#ef6068',label:'×3'}]});
 const render=signatureFromInk({words:[...lineOf(40,[['12',20,{n:'p-display'}]]),...lineOf(60,[['Hours',20,{n:'p-label'}]])],rules:[],figures:[],items:[],arrows:[]});
 const comparison=compareSignatures(source,render),hit=presetFor('arrows',source,block);
 assert.equal(source.arrows[0].labelText,'×3');
 const patches=hit.preset.build(block,hit.params,HOUSE,{render,map:comparison.map});
 assert.equal(patches[0].corrected.at(-1).label,'×3');
 // A signature that kept only the key of a non-empty label cannot supply the printed text.
 const stripped={...hit.params,arrows:hit.params.arrows.map(({labelText,...rest})=>rest)};
 assert.equal(hit.preset.build(block,stripped,HOUSE,{render,map:comparison.map}),null);
});
test('the structure record names the preset and the structure hash; a custom one also says why',()=>{
 const signature=signatureFromInk(ink(lineOf(20,[['a',20]]),lineOf(28,[['b',24]])));
 const block={id:'b',type:'rich-text',sourceReview:{}};
 const [structure]=structurePatches(block,{preset:'parts-grid',signature});
 assert.deepEqual(structure.corrected,{preset:'parts-grid',signatureHash:signatureHash(signature)});
 const custom=structurePatches(block,{preset:'custom',signature,reason:'The source places an arrow between rows.'});
 assert.deepEqual(custom.map(p=>p.field),['/sourceReview/structure','/sourceReview/customArrangement']);
 assert.equal(custom[1].corrected.reason,'The source places an arrow between rows.');
 assert.ok(custom.every(p=>patchAllowed(p)));
 assert.deepEqual(structurePatches({...block,sourceReview:{structure:structure.corrected}},{preset:'parts-grid',signature}),[],'nothing to record twice');
 assert.equal(patchAllowed({targetId:'b',field:'/sourceReview/teachingContext'}),false);
 assert.equal(guard(block,custom).accepted.length,1,'the record is not printed content');
});
test('presets rank by score and a preset below the threshold is not chosen',()=>{
 const none=signatureFromInk(ink(lineOf(20,[['only',20]])));
 assert.deepEqual(matchPresets(none,question('q')).map(r=>r.preset.id).filter(id=>id!=='stacked-parts'),[]);
 const ranked=matchPresets(signatureFromInk(ink(...[20,28,36].map(y=>[...lineOf(y,[['left',20]]),...lineOf(y,[['right',110]])]))),question('q'));
 assert.equal(ranked[0].preset.id,'parts-grid');
 assert.ok(ranked.every((r,i)=>i===0||ranked[i-1].score>=r.score));
 const index=nodeIndex(question('q'));
 assert.equal(fieldPatch(index,'q-root','layout','grid').original,null);
 assert.equal(fieldPatch(index,'missing','layout','grid'),null);
 assert.deepEqual(diffPatches(nodeIndex({id:'a',x:1,w:[1,2]}),{id:'a',x:2,w:[1,3],other:{}}).map(p=>p.field),['/x','/w']);
});

test('a plain-string prompt gets its document form so a paragraph field can be written, without changing its text',()=>{
 const part={id:'q-a',type:'part',label:'a',prompt:'$84 for every 4 people'};
 const block={id:'q',type:'question',content:{id:'q-root',type:'question',label:'1',prompt:'Do these.',children:[part,{id:'q-b',type:'part',label:'b',prompt:'21 apples for three dollars'}]}};
 const render=signatureFromInk({words:[...lineOf(20,[['apples',20,{n:'q-b'}]]),...lineOf(30,[['Intro',20,{n:'q-root'}]])],rules:[],figures:[],items:[],arrows:[]});
 const editor=new ParagraphEditor(nodeIndex(block));
 assert.ok(editor.node('q-b'));assert.equal(editor.node('missing'),null);
 editor.set('q-b','indent',4);
 const patches=editor.patches();
 assert.equal(patches.length,1);
 assert.equal(patches[0].field,'/prompt');assert.equal(patches[0].original,'21 apples for three dollars');
 assert.equal(patches[0].corrected.blocks[0].indent,4);
 assert.equal(guard(block,patches).accepted.length,1,'same text, so the content guard passes');
 const next=applied(block,patches).block;
 assert.equal(next.content.children[1].prompt.format,'maths-editor-document-v1');
 // Math in the string would change the guarded tokens: the guard refuses, it never applies silently.
 const math=structuredClone(block);math.content.children[0].prompt='$84 for $\frac{1}{2}$ people';
 const e2=new ParagraphEditor(nodeIndex(math));e2.set('q-a','indent',4);
 assert.equal(guard(math,e2.patches()).accepted.length,0);
 assert.ok(render);
});
test('emphasis: a one-colour line takes the palette colour on its inlines; bold only where an inline is the bold word',()=>{
 const block={id:'t',type:'rich-text',content:doc([{id:'p',type:'paragraph',align:'left',inlines:[{type:'text',text:'working',colour:'#268cff'},{type:'text',text:'unit'}]}])};
 const render=signatureFromInk({words:lineOf(20,[['working',20,{n:'p'}],['unit',40,{n:'p'}]]),rules:[],figures:[],items:[],arrows:[]});
 const preset=presetById('emphasis-marks');
 const colour=preset.build(block,{},HOUSE,{render,emphases:[{lineId:'L0',kind:'colour',hue:'red'}]});
 assert.deepEqual(colour.map(p=>[p.field,p.corrected]),[['/inlines/0/colour',HOUSE.BOOKLET_HOUSE_STYLE.colours.red],['/inlines/1/colour',HOUSE.BOOKLET_HOUSE_STYLE.colours.red]]);
 assert.equal(guard(block,colour).accepted.length,1);
 const bold=preset.build(block,{},HOUSE,{render,emphases:[{lineId:'L0',kind:'bold',words:['unit']}]});
 assert.deepEqual(bold.map(p=>[p.field,p.corrected]),[['/inlines/1/marks',['bold']]]);
 assert.deepEqual(preset.build(block,{},HOUSE,{render,emphases:[{lineId:'L0',kind:'bold',words:['whole phrase']}]}),[]);
 assert.equal(preset.build(block,{},HOUSE,{emphases:[]}),null);
});
