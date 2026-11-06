import test from 'node:test';
import assert from 'node:assert/strict';
import {contentFingerprint,wordingFingerprint,australianSpelling,spellBlock,boldTerm,deriveComparisonScore,jumpSlots,slotWindow,duplicatePairs,diagramBlindHash,diagramEquivalent,LIMITS,MODEL,EFFORT} from '../pedagogy/audit-v2-plan.mjs';
import {validateAudit,writingRules,theoryRules} from '../pedagogy/audit-v2-prompts.mjs';
import {challengeMoves,gapPlan,newBlock,studentView} from '../pedagogy/audit-v2.mjs';

const rating=score=>({reasoningScore:score,difficulty:'Foundation',difficultyReason:'x'});
const q=(id,prompt,short,extra={})=>({id,type:'question',classification:rating(10),content:{id:id+'-root',type:'question',label:'1',prompt,answer:{short,worked:'$$x$$'}},...extra});

test('the audit uses exactly Sonnet 5.5 at medium effort, with the 15-point jump limit', ()=>{
 assert.equal(MODEL,'claude-sonnet-5-5');assert.equal(EFFORT,'medium');
 assert.equal(LIMITS.jump,15);assert.equal(LIMITS.floor,6);assert.equal(LIMITS.promptCharacters,280000);
});

test('content fingerprints ignore layout, labels, emphasis and whitespace but not maths or answers', ()=>{
 const a=q('a','Find **the** gradient of $y=x^2$.','$2x$');
 const b=structuredClone(a);b.content.label='7';b.content.answerSpaceMm=40;b.content.prompt='Find  the gradient of $y=x^2$.';b.flow={keepWithNext:true};b.classification=rating(50);
 assert.equal(contentFingerprint(a),contentFingerprint(b));
 const c=structuredClone(a);c.content.prompt='Find the gradient of $y=x^3$.';assert.notEqual(contentFingerprint(a),contentFingerprint(c));
 const d=structuredClone(a);d.content.answer.short='$3x$';assert.notEqual(contentFingerprint(a),contentFingerprint(d));
 assert.equal(wordingFingerprint(a),wordingFingerprint(d),'an answer-only change keeps the wording');
});

test('Australian spelling changes whole words outside maths and keeps case', ()=>{
 const {text,changes}=australianSpelling('Factorize the color at the Center. $\\color{red}x$ meters');
 assert.equal(text,'Factorise the colour at the Centre. $\\color{red}x$ metres');
 assert.equal(changes.length,4);
 assert.equal(australianSpelling('The size of the program').changes.length,0);
 const {block,changes:found}=spellBlock(q('s','Analyze the color.','$x$'));
 assert.equal(block.content.prompt,'Analyse the colour.');assert.equal(found.length,2);
});

test('bold marks only the first occurrence of a term, in strings and editor inlines', ()=>{
 const s=boldTerm({id:'t',type:'content',text:'A reciprocal is $1/x$. The reciprocal of 2.'},'reciprocal');
 assert.equal(s.text,'A **reciprocal** is $1/x$. The reciprocal of 2.');
 const doc={id:'t',type:'content',body:{format:'maths-editor-document-v1',blocks:[{type:'paragraph',inlines:[{type:'text',text:'The vertex is the turning point.'}]}]}};
 const out=boldTerm(doc,'vertex').body.blocks[0].inlines;
 assert.deepEqual(out.map(i=>[i.text,i.marks??[]]),[['The ',[]],['vertex',['bold']],[' is the turning point.',[]]]);
 assert.equal(boldTerm(doc,'coefficient'),null);
});

test('comparison scores come from the placement, on the references\' scale', ()=>{
 const refs=new Map([['a',20],['b',40],['c',90]]);
 assert.deepEqual(deriveComparisonScore({harderThan:'a',easierThan:'b',closerTo:'middle'},refs),{score:30,how:'between'});
 assert.equal(deriveComparisonScore({harderThan:'a',easierThan:'b',closerTo:'harderThan'},refs).score,25);
 assert.equal(deriveComparisonScore({harderThan:'a',easierThan:'b',closerTo:'easierThan'},refs).score,35);
 assert.equal(deriveComparisonScore({equalTo:'b'},refs).score,40);
 assert.deepEqual(deriveComparisonScore({harderThan:'c'},refs),{score:95,how:'above-top',flagged:true});
 assert.equal(deriveComparisonScore({harderThan:'b',easierThan:'a'},refs).how,'inconsistent');
});

test('jump slots are the fewest evenly spaced ones, capped and floored', ()=>{
 const u=(id,score)=>({firstId:id,lastId:id,score});
 assert.equal(jumpSlots([u('a',10),u('b',25)]).length,0);
 assert.deepEqual(jumpSlots([u('a',10),u('b',26)]).map(s=>s.target),[18]);
 assert.deepEqual(jumpSlots([u('a',10),u('b',45)]).map(s=>s.target),[22,33]);
 assert.deepEqual(jumpSlots([u('a',10),u('b',45)],{ceiling:30}).map(s=>s.range[1]),[29,30]);
 assert.equal(jumpSlots([u('a',10),u('x',null),u('b',20)]).length,0,'unrated items are skipped over');
});

test('a jump slot accepts anything strictly between its neighbours', ()=>{
 const u=(id,score)=>({firstId:id,lastId:id,score});
 // Pilot 2, slot-2: 23 → 45. Every between-placement (28.5, 34, 39.5) now fills it.
 const [one]=jumpSlots([u('p6-q4',23),u('p7-q5',45)]);
 assert.deepEqual(one.range,[24,44]);assert.deepEqual(one.neighbours,{harderThan:'p6-q4',easierThan:'p7-q5'});
 // Two slots in one gap: each sits between its neighbour and the other slot's target.
 assert.deepEqual(jumpSlots([u('a',10),u('b',45)]).map(s=>s.range),[[11,32],[23,44]]);
});

test('slots without a gap accept the scores between their nearest neighbours', ()=>{
 const scored=[{id:'p6-q4',score:23},{id:'p5-q3',score:32},{id:'p7-q5',score:45}];
 assert.deepEqual(slotWindow(28,scored),{range:[23,32],neighbours:{harderThan:'p6-q4',easierThan:'p5-q3'}});
 assert.deepEqual(slotWindow(5,scored).range,[2,23],'no neighbour below: at least the slack');
 assert.deepEqual(slotWindow(28,scored,{ceiling:30}).range,[23,30]);
});

test('a part with the house wording is not a duplicate when the diagrams differ', ()=>{
 const make=(id,code)=>({id,type:'question',content:{id:id+'-root',type:'question',prompt:'For this pair of triangles:',questionDiagrams:[{id:id+'-d',format:'tikz',code}],children:[{id:id+'-a',type:'part',prompt:'Identify why the two triangles are similar',answer:{short:'SAS'}},{id:id+'-b',type:'part',prompt:'find the value of $x$',answer:{short:'6'}}]}});
 assert.equal(duplicatePairs([make('a','\\draw (0,0)--(3,0);'),make('b','\\draw (0,0)--(4,0);')]).length,0);
 assert.deepEqual(duplicatePairs([make('a','\\draw (0,0)--(3,0);'),make('b','\\draw (0,0)--(3,0);')]).map(p=>p.ids),[['a','b']]);
});

test('duplicate candidates are exact question or part matches involving a stale block', ()=>{
 const a=q('a','Differentiate $\\ln x$.','$1/x$'),b=q('b','Differentiate $\\ln x$.','$\\frac1x$'),c=q('c','Differentiate $\\ln 2x$.','$1/x$');
 assert.deepEqual(duplicatePairs([a,b,c]).map(p=>p.ids),[['a','b']]);
 assert.equal(duplicatePairs([a,b,c],{stale:new Set(['c'])}).length,0);
});

test('Challenge moves take routine questions above 65 with their dependants, never Exam', ()=>{
 const v=(id,score)=>q(id,'P '+id,'$1$',{classification:{...rating(score),difficulty:score>=80?'Challenge':score>=50?'Mastery':'Foundation'}});
 const dep=v('d',30);dep.content.dependsOn=['h-root'];
 const project={id:'p',topics:[{id:'t',title:'T'}],sections:[{id:'s',phase:'practice',topicId:'t',title:'Exercise',blocks:[v('a',20),v('h',72),dep]}]};
 // Ratings here are unverified, so nothing moves automatically.
 assert.equal(challengeMoves(project).length,0);
});

test('the audit reply is validated against the stale sets', ()=>{
 const empty={archetypes:[],types:[],exampleMatches:[],spread:[],errors:[],duplicates:[],bridges:[],missing:[],prerequisites:[],extensions:[],keep:[],theory:[]};
 const ctx={ids:new Set(['a','b']),needTypes:['a'],staleError:new Set(),staleTheory:new Set(),pairs:[{ids:['a','b']}]};
 assert.throws(()=>validateAudit(empty,ctx),/no type for a.*no verdict for pair/);
 assert.ok(validateAudit({...empty,archetypes:[{id:'a',type:'t'}],duplicates:[{ids:['b','a'],verdict:'deliberate',reason:'r'}]},ctx));
 const set=validateAudit({...empty,archetypes:[{id:'a',type:'t'}],duplicates:[{ids:['a','b'],verdict:'deliberate'}],errors:[{blockId:'b',nodeId:'n',field:'short',correction:'x'}],keep:[{ids:['a-1','a-2'],kind:'contrast'}]},{...ctx,owner:new Map([['a-1','a'],['a-2','a']])});
 assert.equal(set.errors.length,0,'an error on a checked block is set aside');assert.equal(set.keep.length,0,'a keep run inside one question is set aside');assert.equal(set.discarded.length,2);
});

test('the drafting rules are taken word for word from the plan', ()=>{
 assert.match(writingRules(),/Draw the diagram; don't describe it/);
 assert.match(theoryRules(),/Watertight definitions/);
});

test('gap plan adds count slots for types under three items', ()=>{
 const project={id:'p',topics:[{id:'t',title:'T'}],sections:[{id:'s',phase:'practice',topicId:'t',title:'Exercise',blocks:[q('a','P a','$1$'),q('b','P b','$1$')]}]};
 const state={project,progressions:[],types:new Map([['a',{type:'x',current:true}],['b',{type:'x',current:true}]])};
 const plan=gapPlan(project,state,{audit:{types:[{type:'x',topicId:'t',taught:true}],exampleMatches:[],spread:[]}});
 assert.equal(plan.deficits.length,1);assert.equal(plan.slots.filter(s=>s.reason==='type-count').length,1);
});

test('a change confined to diagram drawing code is not a change to the question', ()=>{
 const make=(code,prompt='Find $x$.')=>({id:'a',type:'question',content:{id:'a-root',type:'question',prompt,questionDiagrams:[{id:'d',format:'tikz',code}],answer:{short:'6',worked:'$$x=6$$'}}});
 const a=make('\\draw (0,0)--(3,0);'),b=make('\\draw (0,0)--(3.8,0);');
 assert.equal(diagramBlindHash(a),diagramBlindHash(b));assert.ok(diagramEquivalent(a,b));
 assert.notEqual(diagramBlindHash(a),diagramBlindHash(make('\\draw (0,0)--(3,0);','Find $y$.')),'wording still counts');
 const labelled=t=>make('\\coordinate (A) at (0,0);\\draw (A)--node[midway,below] {$'+t+'\\text{ cm}$}(3,0);\\node[below left] at (A) {$A$};');
 assert.notEqual(diagramBlindHash(labelled('8')),diagramBlindHash(labelled('6')),'a printed length is content');
 assert.equal(diagramBlindHash(labelled('8')),diagramBlindHash({...labelled('8'),content:{...labelled('8').content,questionDiagrams:[{id:'d',format:'tikz',code:'\\coordinate (A) at (1,0);\\draw (A)--node[midway,below] {$8\\text{ cm}$}(4.2,0);\\node[below left] at (A) {$A$};'}]}}),'moving it is not');
 const inline=t=>({...make(''),content:{...make('').content,questionDiagrams:[],prompt:'Find $x$.\n\n[tikz]\n% mathsmap-inline-width-mm 50\n\\begin{tikzpicture}'+t+'\\end{tikzpicture}'}});
 assert.equal(diagramBlindHash(inline('\\draw (0,0);')),diagramBlindHash(inline('\\draw (1,0);')),'inline TikZ in a prompt too');
});

test('a new block never reuses an id already in the booklet', ()=>{
 const draft={content:{type:'question',prompt:'P',answer:{short:'1',worked:'x'}}},slot={id:'slot-1-lower',sectionId:'s'};
 const first=newBlock(draft,slot,{project:{sections:[{id:'s',blocks:[]}]},score:null});
 const second=newBlock(draft,slot,{project:{sections:[{id:'s',blocks:[first]}]},score:null});
 assert.equal(first.id,'v2-s-slot-1-lower');assert.equal(second.id,'v2-s-slot-1-lower-2');assert.equal(second.content.id,'v2-s-slot-1-lower-2-root');
});

test('embedded image data is replaced in the views sent to the model', ()=>{
 const img='data:image/png;base64,'+'A'.repeat(4000);
 const view=JSON.stringify(studentView(q('a','See ![chart]('+img+') above.','$1$')));
 assert.ok(!view.includes('AAAA'));assert.match(view,/\[embedded image, 3 KB\]/);
});

test('a type that exists only in the Challenge exercise has no minimum', ()=>{
 const project={id:'p',topics:[{id:'t',title:'T'},{id:'challenge',title:'Challenge'}],sections:[
  {id:'s',phase:'practice',topicId:'t',title:'Exercise',blocks:[q('a','P a','$1$'),q('b','P b','$1$'),q('c','P c','$1$')]},
  {id:'p-challenge',phase:'practice',topicId:'challenge',role:'challenge',title:'Challenge exercise',workingSpace:'none',blocks:[q('h','P h','$1$')]}]};
 const types=new Map([['a',{type:'x',current:true}],['b',{type:'x',current:true}],['c',{type:'x',current:true}],['h',{type:'y',current:true}]]);
 const audit={types:[{type:'x',topicId:'t',taught:true},{type:'y',topicId:'t',taught:true}],exampleMatches:[],spread:[]};
 const plan=gapPlan(project,{project,progressions:[],types},{audit});
 assert.deepEqual(plan.deficits.map(d=>d.type),[]);assert.equal(plan.slots.length,0);
});

test('a part is a duplicate only with the same stem and earlier parts', ()=>{
 const part=(id,prompt)=>({id,type:'part',prompt,answer:{short:'1'}});
 const make=(id,stem,first)=>({id,type:'question',content:{id:id+'-root',type:'question',label:'1',prompt:stem,children:[part(id+'-a',first),part(id+'-b','Find the tangent at $P$.')]}});
 assert.equal(duplicatePairs([make('a','',"$y=\ln x$"),make('b','',"$y=\ln 2x$")]).length,0,'same later part, different curve');
 assert.equal(duplicatePairs([make('a','For $y=\ln x$:','$x=1$'),{...make('b','For $y=2\ln x$:','$x=1$')}]).length,0,'same part, different stem');
 assert.equal(duplicatePairs([make('a','',"$y=\ln x$"),make('b','Other stem',"$y=\ln 3x$")]).length,0);
 const same=duplicatePairs([make('a','For $y=\ln x$:','$x=1$'),make('b','For $y=\ln x$:','$x=1$')]);
 assert.deepEqual(same.map(p=>p.ids),[['a','b']]);
});

test('bolding a word inside an editor paragraph keeps the fingerprint', ()=>{
 const doc={id:'t',type:'content',body:{format:'maths-editor-document-v1',blocks:[{type:'paragraph',inlines:[{type:'text',text:'The change of base law is used.'}]}]}};
 const bolded=boldTerm(doc,'change of base law');
 assert.equal(bolded.body.blocks[0].inlines.length,3);
 assert.equal(contentFingerprint(doc),contentFingerprint(bolded));
 const edited=structuredClone(doc);edited.body.blocks[0].inlines[0].text='The change-of-base law is used.';
 assert.notEqual(contentFingerprint(doc),contentFingerprint(edited));
});
