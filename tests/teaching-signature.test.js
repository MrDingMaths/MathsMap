import test from 'node:test';
import assert from 'node:assert/strict';
import {
 normKey,keySimilarity,latexToPlain,blockPlainText,hueClass,classifyDrawings,sourceInk,signatureFromInk,fromSourceGeometry,fromRenderDom,
 compareSignatures,tallyMismatches,signatureHash,structureOf,mapLines,lineByText,applySignatureCorrections,PT_TO_MM
} from '../src/lib/teaching-signature.js';

// Ink in millimetres: a word at (x, y) of width w, 4.8 mm tall, one text line every 7 mm.
const word=(t,x,y,w=null,extra={})=>({t,x,y,w:w??Math.max(2,t.length*2),h:4.8,b:false,c:'#24282d',m:0,...extra});
const lineOf=(y,items)=>items.map(([t,x,extra])=>word(t,x,y,null,extra));
const ink=(...lines)=>({words:lines.flat(),rules:[],figures:[],items:[],arrows:[]});

test('keys keep letters and digits and let ÷3 meet \\div 3',()=>{
 assert.equal(normKey('= 50 beats/minute'),'50beatsminute');
 assert.equal(normKey('÷3'),normKey(latexToPlain('\\div3')));
 assert.ok(keySimilarity('150beats','150beat')>.8);
 assert.equal(keySimilarity('abc','xyz'),0);
});
test('latex becomes the text a reader sees and skips sizing commands',()=>{
 const plain=latexToPlain('\\dfrac{\\$12}{4\\text{ hours}}=\\frac{\\$\\,\\boxed{\\rule{0pt}{5mm}\\hspace{8mm}}}{1\\text{ hour}}');
 assert.equal(normKey(plain),'124hours1hour');
 assert.equal(normKey(latexToPlain('\\begin{aligned}a&=1\\\\b&=2\\end{aligned}')),'a1b2');
});
test('block text comes from prompts and examples, not answers or layout',()=>{
 const block={id:'b',type:'worked-example',presentation:{layout:'columns'},examples:[{id:'e',prompt:{format:'maths-editor-document-v1',version:1,blocks:[{id:'p',type:'paragraph',inlines:[{type:'text',text:'Convert 5 m'},{type:'math',latex:'=500\\text{ cm}'},{type:'cloze',answer:'7'}]}]},theorySolution:'secret'}]};
 assert.equal(blockPlainText(block),'Convert 5 m =500 cm');
});
test('colours fall into hue classes',()=>{
 assert.equal(hueClass('#268cff'),'blue');assert.equal(hueClass('#ef6068'),'red');assert.equal(hueClass('#24282d'),'ink');assert.equal(hueClass(null),'ink');
});

test('an equals column is found when relation signs share a left edge within 1.5 mm',()=>{
 const s=signatureFromInk(ink(
  lineOf(20,[['x',20],['+',24],['1',28],['=',40],['5',45]]),
  lineOf(28,[['=',40.6],['4',45]]),
  lineOf(36,[['=',39.5],['9',45]])));
 assert.equal(s.columns.length,1);
 assert.deepEqual(s.columns[0].lineIds,['L0','L1','L2']);
 assert.equal(s.columns[0].relation,'=');
 // Signs 4 mm apart are not a column.
 const loose=signatureFromInk(ink(lineOf(20,[['x',20],['=',40],['5',45]]),lineOf(28,[['=',44.5],['4',49]])));
 assert.equal(loose.columns.length,0);
});
test('relative indent levels cluster left edges within 1.5 mm and ignore absolute positions',()=>{
 const a=signatureFromInk(ink(lineOf(20,[['Convert',20]]),lineOf(28,[['first',24]]),lineOf(36,[['second',24.8]]),lineOf(44,[['third',20.4]])));
 assert.deepEqual(a.lines.map(l=>l.indent),[0,1,1,0]);
 // The same shape shifted 40 mm right is the same structure.
 const b=signatureFromInk(ink(lineOf(20,[['Convert',60]]),lineOf(28,[['first',64]]),lineOf(36,[['second',64.8]]),lineOf(44,[['third',60.4]])));
 assert.equal(signatureHash(a),signatureHash(b));
});
test('a gap over 1.6 times the median, and 1.5 mm more, starts a new group',()=>{
 const y=[20,27,34,41,57,64,71];
 const s=signatureFromInk(ink(...y.map((v,i)=>lineOf(v,[['line'+i,20]]))));
 assert.deepEqual(s.groups.map(g=>g.length),[4,3]);
 assert.equal(s.boundaries.filter(b=>b.split).length,1);
 assert.ok(s.boundaries[3].ratio>1.6);
 // Evenly spaced lines are one group; two lines cannot be judged.
 assert.equal(signatureFromInk(ink(...[20,27,34,41,48].map((v,i)=>lineOf(v,[['l'+i,20]])))).groups.length,1);
 assert.equal(signatureFromInk(ink(lineOf(20,[['a',20]]),lineOf(60,[['b',20]]))).boundaries[0].reliable,false);
});
test('two columns are found from a gutter that the rows leave free',()=>{
 const rows=[20,28,36,44].map((y,i)=>[...lineOf(y,[['left'+i,20],['text',30]]),...lineOf(y,[['right'+i,110],['text',120]])]);
 const s=signatureFromInk(ink(...rows));
 assert.equal(s.lanes,2);assert.equal(s.layout,'side-by-side');
 assert.deepEqual([...new Set(s.lines.map(l=>l.lane))],[0,1]);
 const stacked=signatureFromInk(ink(...[20,28,36,44].map((y,i)=>lineOf(y,[['alpha'+i,20],['beta',33],['gamma',42]]))));
 // Words in one row spread 10 mm apart are columns too: a tabbed row of three is three lanes.
 assert.equal(signatureFromInk(ink(...[20,28,36,44].map(y=>lineOf(y,[['alpha',20],['beta',40],['gamma',60]])))).lanes,3);
 assert.equal(stacked.lanes,1);
});
test('fraction bars stack a numerator and denominator into one line and keep reading order',()=>{
 const i={words:[word('150',24,74.5),word('beats',31,74.5),word('3',24,80.1),word('minutes',27,80.1),word('=',40,77.2),word('50',46,74.5),word('1',46,80.1)],
  rules:[{x:24,y:79.9,w:15},{x:46,y:79.9,w:8}],figures:[],items:[],arrows:[]};
 const s=signatureFromInk(i);
 assert.equal(s.lines.length,1);
 assert.equal(s.lines[0].tokens,'150beats3minutes50beats1'.replace('beats1','1').replace('50','50'),'numerator then denominator, bar by bar');
});
test('a list marker is structure, not text',()=>{
 const s=signatureFromInk(ink(lineOf(20,[['1.',17],['Write',24],['the',31],['rate',36]]),lineOf(28,[['2.',17],['Divide',24]])));
 assert.deepEqual(s.lines.map(l=>[l.tokens,l.marker]),[['writetherate',true],['divide',true]]);
 // A render's marker is an item start above the line.
 const render=signatureFromInk({...ink(lineOf(20,[['Write',24],['the',31],['rate',36]])),items:[{x:24,y:19,w:80,h:6}]});
 assert.equal(render.lines[0].marker,true);
});

test('arrowheads are filled triangles at a stroke end, block arrows, or a V of two strokes',()=>{
 const triangle=(apex,a,b)=>({type:'f',rect:[0,0,0,0],fill:'#000000',items:[['l',apex,a],['l',a,b],['l',b,apex]]});
 const stroke={type:'s',rect:[0,0,0,0],stroke:'#000000',width:1,items:[['c',[100,200],[110,180],[150,180],[160,200]]]};
 const found=classifyDrawings([stroke,triangle([160,200],[156,192],[164,192])]);
 assert.equal(found.arrows.length,1);
 assert.equal(found.arrows[0].kind,'curved');assert.equal(found.arrows[0].heads,'end');
 // A block arrow: a thin shaft and a triangle in one filled drawing, pointing up.
 const block={type:'f',rect:[0,0,0,0],fill:'#000000',items:[
  ['l',[277.56,414.74],[277.56,405.57]],['l',[277.56,405.57],[276.06,405.57]],['l',[276.06,405.57],[276.06,414.74]],['l',[276.06,414.74],[277.56,414.74]],
  ['l',[279.81,406.57],[276.81,400.57]],['l',[276.81,400.57],[273.81,406.57]],['l',[273.81,406.57],[279.81,406.57]]]};
 const arrows=classifyDrawings([block]).arrows;
 assert.equal(arrows.length,1);assert.equal(arrows[0].kind,'block');assert.deepEqual(arrows[0].end,[276.81,400.57]);
 // Two short strokes meeting at the tip, on a longer line, are an open head.
 const line={type:'s',rect:[0,0,0,0],stroke:'#000',width:1,items:[['l',[10,10],[60,10]]]};
 const v1={type:'s',rect:[0,0,0,0],stroke:'#000',width:1,items:[['l',[60,10],[55,7]]]},v2={type:'s',rect:[0,0,0,0],stroke:'#000',width:1,items:[['l',[60,10],[55,13]]]};
 const open=classifyDrawings([line,v1,v2]).arrows;
 assert.equal(open.length,1);assert.equal(open[0].heads,'end');
 // A thin horizontal rectangle is a rule, a wide one a frame.
 const rules=classifyDrawings([{type:'f',rect:[0,0,0,0],fill:'#000',items:[['re',10,50,40,50.7]]},{type:'f',rect:[0,0,0,0],fill:'#ddd',items:[['re',10,60,300,90]]}]);
 assert.equal(rules.rules.length,1);assert.equal(rules.frames.length,1);
});
test('arrows are described by their endpoints, side, direction and label',()=>{
 const labels=lineOf(60,[['Hours',20],['Minutes',60]]),display=lineOf(40,[['12',20],['25',60]]);
 const i={...ink(display,labels),arrows:[{start:[25,56],end:[25,46],heads:'end',curved:false,kind:'block'}]};
 const s=signatureFromInk(i);
 assert.equal(s.arrows.length,1);
 assert.equal(s.arrows[0].direction,'up');
 assert.equal(s.arrows[0].from,s.lines.find(l=>l.text.startsWith('Hours')).id);
 assert.equal(s.arrows[0].to,s.lines.find(l=>l.text.startsWith('12')).id);
 assert.equal(s.arrows[0].side,'between');
});
test('source geometry in points becomes the same structure as render ink in millimetres',()=>{
 const k=1/PT_TO_MM,pt=(t,x,y)=>({t,x0:x*k,y0:y*k,x1:(x+t.length*2)*k,y1:(y+4.8)*k,b:false,c:'#000000'});
 const source=fromSourceGeometry([pt('first',20,20),pt('second',24,28),pt('=',24,36)],[]);
 const render=fromRenderDom(ink(lineOf(20,[['first',20]]),lineOf(28,[['second',24]]),lineOf(36,[['=',24]])));
 assert.equal(signatureHash(source),signatureHash(render));
});

test('compareSignatures reports one mismatch per relationship and marks it decidable or ambiguous',()=>{
 const source=signatureFromInk(ink(lineOf(20,[['a',20],['+',24],['b',28],['=',40],['c',45]]),lineOf(28,[['=',40],['d',45]]),lineOf(36,[['=',40],['e',45]])));
 // Same words, signs misaligned, one line outdented, an extra column.
 const render=signatureFromInk(ink(lineOf(20,[['a',20],['+',24],['b',28],['=',40],['c',45]]),lineOf(28,[['=',46],['d',51]]),lineOf(36,[['=',43],['e',48]])));
 const result=compareSignatures(source,render);
 const types=tallyMismatches(result.mismatches);
 assert.equal(types.column.decidable,1);
 assert.equal(result.mismatches.find(m=>m.type==='column').lineIds.length,3);
 // A render that matches reports nothing, and house-only alignment is not a mismatch.
 const aligned=signatureFromInk(ink(lineOf(20,[['a',20],['+',24],['b',28],['=',50],['c',55]]),lineOf(28,[['=',50],['d',55]]),lineOf(36,[['=',50],['e',55]])));
 assert.deepEqual(compareSignatures(source,aligned).mismatches,[]);
 const plain=signatureFromInk(ink(lineOf(20,[['a',20]]),lineOf(28,[['d',20]])));
 assert.deepEqual(compareSignatures(plain,signatureFromInk(ink(lineOf(20,[['a',30]]),lineOf(28,[['d',30]])))).mismatches,[]);
});
test('side-by-side against stacked, indent signs, grouping and arrows are compared',()=>{
 const columns=ink(...[20,28,36].map((y,i)=>[...lineOf(y,[['left'+i,20]]),...lineOf(y,[['right'+i,110]])]));
 const stacked=ink(...[20,28,36].map(y=>lineOf(y,[['left'+(y-20)/8,20]])),...[44,52,60].map(y=>lineOf(y,[['right'+(y-44)/8,20]])));
 const result=compareSignatures(signatureFromInk(columns),signatureFromInk(stacked));
 assert.ok(result.mismatches.some(m=>m.type==='layout'&&m.severity==='decidable'&&m.source===2&&m.render===1));
 const indented=signatureFromInk(ink(lineOf(20,[['head',20]]),lineOf(28,[['body',24]]),lineOf(36,[['tail',20]])));
 const flat=signatureFromInk(ink(lineOf(20,[['head',20]]),lineOf(28,[['body',20]]),lineOf(36,[['tail',20]])));
 const indent=compareSignatures(indented,flat).mismatches.filter(m=>m.type==='indent');
 assert.equal(indent.length,2);
 // An arrow in the source that the render lacks.
 const withArrow={...ink(lineOf(20,[['up',20]]),lineOf(40,[['down',20]])),arrows:[{start:[22,38],end:[22,26],heads:'end',curved:false}]};
 const without=ink(lineOf(20,[['up',20]]),lineOf(40,[['down',20]]));
 const missing=compareSignatures(signatureFromInk(withArrow),signatureFromInk(without)).mismatches.find(m=>m.type==='arrows');
 assert.equal(missing.severity,'decidable');assert.match(missing.detail,/no match in the render/);
 // An arrow whose ends touch no line is ambiguous.
 const lost={...ink(lineOf(20,[['up',20]])),arrows:[{start:[150,150],end:[150,100],heads:'end',curved:false}]};
 assert.equal(compareSignatures(signatureFromInk(lost),signatureFromInk(ink(lineOf(20,[['up',20]])))).mismatches.find(m=>m.type==='arrows').severity,'ambiguous');
});
test('a block whose lines do not meet is ambiguous, and a low-confidence region is flagged',()=>{
 const a=signatureFromInk(ink(lineOf(20,[['alpha',20]]),lineOf(28,[['beta',20]]),lineOf(36,[['gamma',20]])));
 const b=signatureFromInk(ink(lineOf(20,[['zzzz',20]]),lineOf(28,[['qqqq',20]]),lineOf(36,[['wwww',20]])));
 const result=compareSignatures(a,b);
 assert.equal(result.mismatches[0].type,'mapping');assert.equal(result.mismatches[0].severity,'ambiguous');
 assert.equal(compareSignatures(a,a,{confidence:.4}).mismatches[0].type,'region');
 assert.equal(compareSignatures(signatureFromInk(ink()),signatureFromInk(ink())).mismatches[0].type,'empty');
});
test('lines are mapped by text in order, tolerating small differences',()=>{
 const a=signatureFromInk(ink(lineOf(20,[['Convert',20],['72',32]]),lineOf(28,[['answer',20]])));
 const b=signatureFromInk(ink(lineOf(20,[['Intro',20]]),lineOf(28,[['Convert',20],['72',32]]),lineOf(36,[['answers',20]])));
 const {map}=mapLines(a,b);
 assert.equal(map.get('L0'),'L1');assert.equal(map.get('L1'),'L2');
});
test('structure hashes ignore text and measurements',()=>{
 const a=signatureFromInk(ink(lineOf(20,[['one',20]]),lineOf(28,[['two',24]])));
 const b=signatureFromInk(ink(lineOf(70,[['uno',50]]),lineOf(80,[['dos',55]])));
 assert.equal(signatureHash(a),signatureHash(b));
 assert.notEqual(signatureHash(a),signatureHash(signatureFromInk(ink(lineOf(20,[['one',20]]),lineOf(28,[['two',20]])))));
 assert.deepEqual(structureOf(a).lines.map(l=>l[1]),[0,1]);
});
test('model answers correct a signature: figure, arrows, groups and columns, nothing else',()=>{
 const base={...ink(lineOf(20,[['top',20]]),lineOf(28,[['mid',20]]),lineOf(36,[['low',20]]),lineOf(44,[['end',20]]),lineOf(52,[['last',20]])),figures:[{x:100,y:20,w:30,h:30}]};
 const s=signatureFromInk(base);
 assert.equal(s.figure.side,'right');
 assert.equal(applySignatureCorrections(s,{figure:{decorative:true}}).signature.figure,null);
 assert.equal(applySignatureCorrections(s,{figure:{decorative:false,side:'left'}}).signature.figure.side,'left');
 const arrows=applySignatureCorrections(s,{arrows:[{from:'top',to:'low',direction:'down',side:'left',label:'x 2'},{from:'nowhere',to:'low',direction:'sideways'}]}).signature.arrows;
 assert.equal(arrows.length,1);assert.deepEqual([arrows[0].from,arrows[0].to,arrows[0].label],['L0','L2','x2']);
 const grouped=applySignatureCorrections(s,{groups:[{after:'L1',before:'L2',split:true}]}).signature;
 assert.deepEqual(grouped.groups.map(g=>g.length),[2,3]);
 assert.equal(lineByText(s,'mid')?.id,'L1');assert.equal(lineByText(s,'zzzzzz'),null);
 const column=signatureFromInk(ink(lineOf(20,[['a',20],['=',40]]),lineOf(28,[['b',20],['=',40]])));
 assert.equal(applySignatureCorrections(column,{columns:[{index:0,aligned:false}]}).signature.columns.length,0);
 // Unknown keys and patches are ignored.
 assert.deepEqual(applySignatureCorrections(s,{patches:[1],spaceAfter:3}).applied,[]);
});

test('calibration: advisory mismatches are ambiguous, weak line matches say nothing about structure',()=>{
 const word2=(t,x,y)=>({t,x,y,w:Math.max(2,t.length*2),h:4.8,b:false,c:'#24282d',m:0});
 const mk=(...rows)=>({words:rows.flat(),rules:[],figures:[],items:[],arrows:[]});
 const row=(y,items)=>items.map(([t,x])=>word2(t,x,y));
 // Grouping never decides: a gap the render lacks is advisory.
 const gappy=signatureFromInk(mk(...[20,27,34,41,60,67].map((y,i)=>row(y,[['line'+i,20]]))));
 const even=signatureFromInk(mk(...[20,27,34,41,48,55].map((y,i)=>row(y,[['line'+i,20]]))));
 const groups=compareSignatures(gappy,even).mismatches.filter(m=>m.type==='groups');
 assert.ok(groups.length&&groups.every(m=>m.severity==='ambiguous'&&m.advisory));
 // An outdent is advisory; an indent is decidable.
 const outdent=signatureFromInk(mk(row(20,[['head',24]]),row(28,[['body',20]])));
 const flat=signatureFromInk(mk(row(20,[['head',20]]),row(28,[['body',20]])));
 assert.equal(compareSignatures(outdent,flat).mismatches[0].severity,'ambiguous');
 // Fewer source lanes than the render is advisory (a gutter is easier to miss than to invent).
 const one=signatureFromInk(mk(...[20,28,36,44].map(y=>row(y,[['alpha',20],['beta',33]]))));
 const three=signatureFromInk(mk(...[20,28,36,44].map(y=>row(y,[['alpha',20],['beta',60],['gamma',100]]))));
 const layout=compareSignatures(one,three).mismatches.find(m=>m.type==='layout');
 assert.equal(layout.severity,'ambiguous');
 assert.equal(compareSignatures(three,one).mismatches.find(m=>m.type==='layout').severity,'decidable');
 // A marker is decidable only where the block can number its steps.
 const marked=signatureFromInk(mk(row(20,[['1.',17],['Write',24]]),row(28,[['2.',17],['Divide',24]])));
 const bare=signatureFromInk(mk(row(20,[['Write',24]]),row(28,[['Divide',24]])));
 assert.equal(compareSignatures(marked,bare).mismatches.find(m=>m.type==='markers').severity,'ambiguous');
 assert.equal(compareSignatures(marked,bare,{markerFix:true}).mismatches.find(m=>m.type==='markers').severity,'decidable');
 // A line of two colours (a red step number and blue working) is not compared by colour.
 const mixed=signatureFromInk(mk([{...word2('Step',20,20),c:'#ef6068'},{...word2('working',30,20),c:'#268cff'}]));
 assert.equal(mixed.lines[0].hue,'mixed');
 assert.equal(compareSignatures(mixed,signatureFromInk(mk(row(20,[['working',30]])))).mismatches.filter(m=>m.type==='emphasis').length,0);
 // Weakly matched lines (a wrapped paragraph) do not carry indent.
 const wrapped=signatureFromInk(mk(row(20,[['alpha',20]]),row(28,[['The',24],['numerator',30],['is',45],['the',50],['distance',56]])));
 const rewrapped=signatureFromInk(mk(row(20,[['alpha',20]]),row(28,[['Numerator',20],['quantity',34]])));
 assert.equal(compareSignatures(wrapped,rewrapped).mismatches.filter(m=>m.type==='indent').length,0);
});
