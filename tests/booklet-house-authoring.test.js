import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {templateDiagram,diagramTemplateParameters} from '../src/lib/diagram-templates.js';
import {diagramColourPolicy} from '../src/lib/diagram-colours.js';
import {prepareTikz} from '../src/lib/tikz-prepare.js';
import {assignBookletAvatars,avatarSrc,isStandardAvatar,AVATAR_COUNT} from '../src/lib/booklet-avatars.js';
import {activeRasterOccurrences,inspectPresentationFidelity} from '../src/lib/booklet-presentation-verification.js';
import {materializeHouseAuthoring,authorMaterializer,HOUSE_AUTHORING} from '../scripts/booklet/house-authoring.mjs';

const count=(code,pattern)=>(code.match(pattern)??[]).length;

test('number line reproduces range, labelled ticks, points and jumps with house strokes',()=>{
 const d=templateDiagram('nl',{family:'number-line',min:0,max:1,step:1/6,labels:[{value:0,tex:'0'},{value:2/6,tex:'\\frac{2}{6}'},{value:1,tex:'1'}],points:[{value:5/6,style:'open',label:'A'}],jumps:[{from:2/6,to:5/6,label:'+\\frac{3}{6}'}]});
 assert.equal(d.format,'tikz');assert.equal(diagramColourPolicy(d.code).kind,'graph');
 assert.equal(count(d.code,/\(\d[\d.]*,-1\.3\)--/g),7);
 assert.equal(count(d.code,/data-graph-text="tick"/g),3);assert.match(d.code,/\$\\frac\{2\}\{6\}\$/);
 assert.match(d.code,/fill=white/);assert.match(d.code,/controls/);assert.match(d.code,/line width=0\.5pt,<->/);
 assert.ok(d.widthMm>50&&d.widthMm<140);assert.doesNotThrow(()=>prepareTikz(d.code));
 const whole=templateDiagram('ints',{family:'number-line',min:-5,max:5,step:1});
 assert.equal(count(whole.code,/data-graph-text="tick"/g),11);assert.match(whole.code,/\$-5\$/);
 assert.throws(()=>templateDiagram('bad',{family:'number-line',min:0,max:1,step:.3}),/whole intervals/);
 assert.throws(()=>templateDiagram('bad',{family:'number-line',min:0,max:5,step:1,points:[{value:6}]}),/outside/);
 assert.throws(()=>templateDiagram('bad',{family:'number-line',min:0,max:5,step:1,labels:[{value:1,tex:'$1$'}]}),/without delimiters/);
});

test('fraction models shade exactly the stated parts and require a shading purpose',()=>{
 const pair=templateDiagram('models',{family:'fraction-grid',models:[{rows:2,cols:4,shaded:[[0,0],[1,0]]},{rows:2,cols:4,shaded:5}],separators:['+'],shadeReason:'Shaded cells show the two addends in eighths.'});
 assert.equal(count(pair.code,/\\fill\[templateShade\]/g),7);assert.match(pair.code,/\{\$\+\$\}/);
 const policy=diagramColourPolicy(pair.code);assert.equal(policy.kind,'geometry');assert.equal(policy.semantic[0].hex,'D4E8FF');assert.match(policy.semantic[0].reason,/addends/);
 const blank=templateDiagram('student',{family:'fraction-grid',rows:6,cols:2});
 assert.doesNotMatch(blank.code,/fill|definecolor/);assert.deepEqual(diagramColourPolicy(blank.code).semantic,[]);
 assert.throws(()=>templateDiagram('x',{family:'fraction-grid',cols:4,shaded:1}),/shadeReason/);
 assert.throws(()=>templateDiagram('x',{family:'fraction-grid',cols:4,shaded:5,shadeReason:'r'}),/exceeds/);
 assert.throws(()=>templateDiagram('x',{family:'fraction-grid',cols:4,shaded:[[0,1],[0,1]],shadeReason:'r'}),/repeated/);
 const circle=templateDiagram('c',{family:'fraction-circle',sectors:5,shaded:2,shadeReason:'Two fifths are given.'});
 assert.equal(count(circle.code,/\\fill\[templateShade\]/g),2);assert.equal(count(circle.code,/--\+\+\(/g),7);assert.match(circle.code,/start angle=90,end angle=18/);
 const grid=templateDiagram('g',{family:'blank-grid',rows:8,cols:10,cellMm:5});
 assert.equal(grid.widthMm,51.2);assert.throws(()=>templateDiagram('g',{family:'blank-grid',rows:8,cols:10,shaded:1}),/rows, cols and cellMm/);
 assert.throws(()=>templateDiagram('t',{family:'triangle'}),/free-form TikZ/);
 for(const d of [pair,blank,circle,grid])assert.doesNotThrow(()=>prepareTikz(d.code));
});

const packet=()=>({pageNumber:4,sections:[{id:'s',blocks:[{id:'b',type:'question',content:{id:'q',prompt:'Add.',
 questionDiagrams:[{id:'q-line',role:'question',spec:{sourcePage:4},diagramTemplate:{family:'number-line',min:0,max:4,step:1}}],
 bubble:{id:'bubble',type:'layout',arrangement:'speech-bubble',tail:'left',slots:[{id:'who',blocks:[{id:'face',type:'image',avatar:'Annie'}]},{id:'says',blocks:[]}]}}}]}]});

test('house authoring is opt-in and publishes ordinary editable diagrams and images',()=>{
 const plain={sections:[{blocks:[{id:'d',format:'tikz',code:'x'}]}]};
 assert.equal(materializeHouseAuthoring(plain),plain);assert.equal(authorMaterializer({})(plain),plain);
 assert.throws(()=>authorMaterializer({})(packet()),/authoringPreferences/);
 const source=packet(),result=authorMaterializer({authoringPreferences:HOUSE_AUTHORING})(source);
 const diagram=result.sections[0].blocks[0].content.questionDiagrams[0];
 assert.equal(diagram.diagramTemplate,undefined);assert.equal(diagram.format,'tikz');assert.match(diagram.code,/\\begin\{tikzpicture\}/);assert.ok(diagram.widthMm>0);
 assert.equal(diagram.spec.sourcePage,4);assert.equal(diagramTemplateParameters(diagram).family,'number-line');
 assert.equal(templateDiagram(diagram.id,diagramTemplateParameters(diagram)).code,diagram.code);
 const face=result.sections[0].blocks[0].content.bubble.slots[0].blocks[0];
 assert.ok(isStandardAvatar(face.src));assert.equal(face.width,17);assert.equal(face.avatar,'Annie');
 assert.equal(source.sections[0].blocks[0].content.questionDiagrams[0].code,undefined);
 const coded=packet();coded.sections[0].blocks[0].content.questionDiagrams[0].code='x';
 assert.throws(()=>materializeHouseAuthoring(coded,{enabled:true}),/without code/);
 const bad=packet();bad.sections[0].blocks[0].content.questionDiagrams[0].diagramTemplate={family:'number-line',min:3,max:1,step:1};
 assert.throws(()=>materializeHouseAuthoring(bad,{enabled:true}),/Diagram template q-line: Number line needs/);
 const cropped=packet();cropped.sections[0].blocks[0].content.bubble.slots[0].blocks[0].src='/booklet-assets/projects/x/annie.png';
 assert.throws(()=>materializeHouseAuthoring(cropped,{enabled:true}),/no source asset/);
});

const face=(id,avatar)=>({id,type:'image',avatar,src:avatarSrc(0)});
test('avatars rotate in booklet order and a character keeps one avatar',async()=>{
 const names=['Annie','Ben',' annie ','Cy'];
 const project={sections:[{blocks:names.slice(0,2).map((n,i)=>({id:'a'+i,type:'theory',content:{blocks:[face('f'+i,n)]}}))},{blocks:names.slice(2).map((n,i)=>({id:'b'+i,type:'theory',content:{blocks:[face('g'+i,n)]}}))}]};
 const {project:next,characters}=assignBookletAvatars(project);
 const srcs=next.sections.flatMap(s=>s.blocks.map(b=>b.content.blocks[0].src));
 assert.deepEqual(srcs,[avatarSrc(0),avatarSrc(1),avatarSrc(0),avatarSrc(2)]);assert.equal(characters.length,3);
 assert.deepEqual(assignBookletAvatars(next).project,next);assert.equal(project.sections[1].blocks[1].content.blocks[0].src,avatarSrc(0));
 assert.equal(avatarSrc(AVATAR_COUNT),avatarSrc(0));assert.equal(isStandardAvatar('/booklet-assets/shared/avatars/avatar-15.png'),false);
 for(let i=0;i<AVATAR_COUNT;i++)assert.ok(fs.existsSync(new URL('../public'+avatarSrc(i),import.meta.url)));
 // A retained source image still needs its occurrence review; a standard avatar does not.
 const block=id=>({id,type:'theory',content:{blocks:[]}});
 const withAvatar={settings:{},sections:[{blocks:[{...block('x'),content:{blocks:[face('fx','Annie')]}}]}]};
 const withCrop={settings:{},sections:[{blocks:[{...block('y'),content:{blocks:[{id:'fy',type:'image',src:'/booklet-assets/projects/p/crop.png'}]}}]}]};
 assert.equal(activeRasterOccurrences(withAvatar.sections[0].blocks[0]).length,1);
 const kinds=async p=>(await inspectPresentationFidelity(p)).issues.map(i=>i.kind);
 assert.ok(!(await kinds(withAvatar)).includes('unreviewed-raster-exception'));
 assert.ok((await kinds(withCrop)).includes('unreviewed-raster-exception'));
});

test('paired example repair merges row blocks into one unlabelled two-column grid and restores source formula wording',async()=>{
 const {repairInversePairedExample,restoreEarningExampleWording}=await import('../scripts/booklet/repair-paired-examples-20261004.mjs');
 const doc=blocks=>({format:'maths-editor-document-v1',version:1,blocks});
 const cellTable=(id,blocks)=>doc([{id,type:'table',rows:[[{id:id+'-cell',type:'cell',blocks}]]}]);
 const maths=id=>({id,type:'paragraph',align:'left',inlines:[{type:'math',latex:'y=x',display:true}]});
 const row=name=>({id:`p7-example-${name}-row`,type:'question',sourceRefs:[{pageNumber:7}],bankRef:null,
  content:{id:`p7-example-${name}-row-root`,type:'group',label:'',prompt:cellTable(name+'-left',[maths(name+'-given')]),children:[{id:'p7-turn-'+name,type:'part',label:'',prompt:cellTable(name+'-right',[maths(name+'-turn')]),answerSpaceMm:0,answer:{short:'$y=x$'}}]},
  sourceReview:{responses:[{targetId:`p7-example-${name}-row-root`,kind:'none'},{targetId:'p7-turn-'+name,kind:'working'}],workingSpaceEstimate:{estimates:[{targetId:'p7-turn-'+name,widthMm:90,answerSpaceMm:34}]}}});
 const heading={id:'p7-example-group',type:'rich-text',sourceAtom:{id:'atom',kind:'example'},sourceRefs:[{pageNumber:7}],content:doc([{id:'headings',type:'table',rows:[[{id:'a',type:'cell',blocks:[]},{id:'b',type:'cell',blocks:[]}]]}])};
 const names=['linear','cubic','quadratic'],source={settings:{layoutOverrides:{blockLayouts:Object.fromEntries(names.map(n=>[`p7-example-${n}-row`,{arrangement:{}}]))}},sections:[{blocks:[heading,...names.map(row),{id:'next'}]}]};
 const {project}=repairInversePairedExample(source),[merged,after]=project.sections[0].blocks;
 assert.equal(project.sections[0].blocks.length,2);assert.equal(after.id,'next');assert.equal(merged.type,'question');
 assert.equal(merged.content.layout,'grid');assert.equal(merged.content.columns,2);assert.equal(merged.content.prompt.blocks[0].id,'headings');
 assert.deepEqual(merged.content.children.map(c=>[c.id,c.answerSpaceMm]),names.flatMap(n=>[[`p7-example-${n}-row-root`,0],['p7-turn-'+n,34]]));
 assert.ok(merged.content.children.every(c=>c.prompt.blocks[0].type==='paragraph'&&c.prompt.blocks[0].align==='center'));
 assert.equal(merged.content.children[1].answer.short,'$y=x$');assert.ok(merged.sourceReview.responses.every(r=>r.label===''));
 assert.deepEqual(project.settings.layoutOverrides.blockLayouts,{});assert.equal(source.sections[0].blocks.length,5);
 assert.throws(()=>repairInversePairedExample(project),/Expected the three paired rows/);
 const wage=String.raw`$$\begin{align*}\text{Total pay}&=\text{Hourly rate}\times\text{Hours}\\&=\$150\end{align*}$$`;
 const rate=String.raw`\begin{align*}\text{Hourly rate}&=\frac{\text{Total pay}}{\text{Hours}}\end{align*}`,hours=String.raw`$$\begin{align*}\text{Hours}&=\frac{\text{Total pay}}{\text{Hourly rate}}\end{align*}$$`;
 const earning={sections:[{blocks:[{id:'p4-example-heading',examples:[{theorySolution:wage},{theorySolution:wage}]},{id:'p5-example-header',examples:[0,1].map(()=>({theorySolution:doc([{inlines:[{latex:rate}]}])}))},{id:'p6-example-group',examples:[{theorySolution:hours},{theorySolution:hours}]},{id:'p8-q4',content:{answer:{worked:rate}}}]}]};
 const restored=restoreEarningExampleWording(earning).project.sections[0].blocks;
 assert.match(restored[0].examples[0].theorySolution,/Total Pay\}&=\\text\{Pay per period\}\\times\\text\{Number of periods\}\\\\&=\\\$150/);
 assert.match(restored[1].examples[1].theorySolution.blocks[0].inlines[0].latex,/Pay per period\}&=\\frac\{\\text\{Total pay\}\}\{\\text\{Number of periods\}\}/);
 assert.match(restored[2].examples[0].theorySolution,/Number of periods\}&=/);assert.equal(restored[3].content.answer.worked,rate);
 assert.throws(()=>restoreEarningExampleWording({sections:[{blocks:restored}]}),/found 0/);
});
