import test from 'node:test';
import assert from 'node:assert/strict';
import {contentFingerprint,wordingFingerprint,australianSpelling,spellBlock,boldTerm,deriveComparisonScore,jumpSlots,slotWindow,duplicatePairs,diagramBlindHash,diagramEquivalent,practiceItemCount,LIMITS,MODEL,EFFORT} from '../pedagogy/audit-v2-plan.mjs';
import {validateAudit,validateRoleGroups,writingRules,theoryRules} from '../pedagogy/audit-v2-prompts.mjs';
import {challengeMoves,sortChallengeSections,unletterLoneGuided,laterLessons,gapPlan,newBlock,studentView,promptFromSource,layoutSibling,reusableReply,splitByCap,typeKey,challengeTargets,partText} from '../pedagogy/audit-v2.mjs';

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
 // Inline TikZ and command names are code (Operations with Decimals 1 p100-q7, 8 November 2026).
 const fig='Answer.\n\n[tikz]\n% mathsmap-inline-width-mm 70\n\\begin{tikzpicture}[op/.style={align=center,gray}]\n\\node at (0,0) {center};\n\\end{tikzpicture}\nThe center.';
 assert.equal(australianSpelling(fig).text,fig.replace('The center.','The centre.'));
 assert.equal(australianSpelling('{\\color{red}the color}').text,'{\\color{red}the colour}');
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

test('a Challenge move takes the dependants of a hard question, never the question it depends on', async ()=>{
 const {reasoningTaskHash,REASONING_RUBRIC}=await import('../scripts/booklet/reasoning-ratings.mjs');
 const v=(id,score)=>{const b=q(id,'P '+id,'$1$',{classification:{...rating(score),difficulty:score>=80?'Challenge':score>=50?'Mastery':'Foundation'}});
  b.classification.assessment={model:'m',assessedAt:'2026-11-09T00:00:00Z',evidence:'e',rubricVersion:REASONING_RUBRIC,taskHash:reasoningTaskHash(b)};return b;};
 // Polynomials 1A (9 November 2026): p14-q10 (70) depends on p14-q9 (37), and p14-q11 (70) on p14-q10.
 const q9=v('q9',37),q10=v('q10',70),q11=v('q11',70);q10.flow={dependsOn:['q9']};q11.flow={dependsOn:['q10']};
 const hard=v('h',72),after=v('d',30);after.flow={dependsOn:['h']};
 const project={id:'p',topics:[{id:'t',title:'T'}],sections:[{id:'s',phase:'practice',topicId:'t',title:'Exercise',blocks:[v('a',20),q9,q10,q11,hard,after]}]};
 const moves=challengeMoves(project);
 assert.deepEqual(moves.map(m=>m.ids),[['q10','q11'],['h','d']]);
 assert.deepEqual(moves.map(m=>m.score),[70,72]);
 // 60 and over moves (James, 9 November 2026: the first chilli); 59 stays. Exam questions never move, even
 // an exam-titled one still in an exercise: they all belong in the Exam section.
 const exam=v('x',80);exam.title='HSC Standard 2 Sample Question Band 4';
 const edge={id:'p',topics:[{id:'t',title:'T'}],sections:[{id:'s',phase:'practice',topicId:'t',title:'Exercise',blocks:[v('a',20),v('e',60),v('f',59),exam]}]};
 assert.deepEqual(challengeMoves(edge).map(m=>m.ids),[['e']]);
});

test('a Challenge exercise is sorted by the exercise rules even when a reference elsewhere holds the booklet', async ()=>{
 const {reasoningTaskHash,REASONING_RUBRIC}=await import('../scripts/booklet/reasoning-ratings.mjs');
 const v=(id,score,prompt='P '+id)=>{const b=q(id,prompt,'$1$',{classification:{...rating(score),difficulty:score>=80?'Challenge':score>=50?'Mastery':'Foundation'}});
  b.classification.assessment={model:'m',assessedAt:'2026-11-09T00:00:00Z',evidence:'e',rubricVersion:REASONING_RUBRIC,taskHash:reasoningTaskHash(b)};return b;};
 const held=v('x',30,'Use the diagram below.');
 const project={id:'p',revision:1,topics:[{id:'t',title:'T'},{id:'challenge',title:'Challenge exercise'}],sections:[
  {id:'s',phase:'practice',topicId:'t',title:'Exercise',blocks:[v('a',20),held]},
  {id:'c',phase:'practice',role:'challenge',topicId:'challenge',title:'Challenge exercise',blocks:[v('c1',80),v('c2',62),v('c3',71)]}]};
 const {project:out,report}=sortChallengeSections(project);
 assert.deepEqual(out.sections[1].blocks.map(b=>b.id),['c2','c3','c1']);
 assert.equal(report[0].status,'sorted');
 assert.deepEqual(out.sections[0].blocks.map(b=>b.id),['a','x'],'exercises are left to the normal order step');
 // An unverified rating in the Challenge section holds it.
 const loose=structuredClone(project);loose.sections[1].blocks[1].classification.assessment.taskHash='stale';
 assert.equal(sortChallengeSections(loose).report[0].status,'held');
});

test('a guided practice with no parts prints without a part letter', ()=>{
 const g={id:'g',type:'question',content:{id:'g-root',type:'question',label:null,prompt:'Sketch $y=x^2(x-5)$.',answer:{short:'x',worked:'x'}}};
 unletterLoneGuided(g);
 assert.equal(g.content.label,'');assert.deepEqual(g.sourceReview.responses,[{targetId:'g-root',kind:'working',label:''}]);
 const two={id:'h',type:'question',content:{id:'h-root',type:'question',children:[{id:'a'},{id:'b'}]}};
 unletterLoneGuided(two);assert.equal(two.sourceReview,undefined,'parts keep their letters');
});

test('relocations are optional in the audit reply and resolve to whole questions', ()=>{
 const empty={archetypes:[{id:'a',type:'t'}],types:[],exampleMatches:[],spread:[],errors:[],duplicates:[],bridges:[],missing:[],prerequisites:[],extensions:[],keep:[],theory:[]};
 const ctx={ids:new Set(['a','b']),needTypes:[],staleError:new Set(),staleTheory:new Set(),pairs:[],owner:new Map([['a-1','a']])};
 assert.deepEqual(validateAudit(structuredClone(empty),ctx).relocate,[]);
 const r=validateAudit({...structuredClone(empty),relocate:[{ids:['a-1','zz'],toTopicId:'multiplicity',taughtBy:['p22'],reason:'double root'},{ids:['zz'],toTopicId:'m'}]},ctx);
 assert.deepEqual(r.relocate.map(x=>x.ids),[['a']]);
});

test('drafting requests name the lessons that come later', ()=>{
 const project={topics:[{id:'graphs',title:'Graphs'},{id:'mult',title:'Multiplicity of roots'},{id:'exam',title:'Exam'}],sections:[
  {id:'g-t',topicId:'graphs',phase:'teaching',blocks:[]},{id:'g-x',topicId:'graphs',phase:'practice',blocks:[]},
  {id:'m-t',topicId:'mult',phase:'teaching',title:'Multiplicity',blocks:[{id:'b',sourceAtom:{visibleSubtitle:'Sketch with repeated roots'}}]},{id:'m-x',topicId:'mult',phase:'practice',blocks:[]},
  {id:'e',topicId:'exam',phase:'practice',role:'exam',blocks:[]}]};
 assert.deepEqual(laterLessons(project,'g-x'),[{topicId:'mult',title:'Multiplicity of roots',teaches:['Sketch with repeated roots']}]);
 assert.deepEqual(laterLessons(project,'m-x'),[]);
});

test('the audit reply is validated against the stale sets', ()=>{
 const empty={archetypes:[],types:[],exampleMatches:[],spread:[],errors:[],duplicates:[],bridges:[],missing:[],prerequisites:[],extensions:[],keep:[],theory:[]};
 const ctx={ids:new Set(['a','b']),needTypes:['a'],staleError:new Set(),staleTheory:new Set(),pairs:[{ids:['a','b']}]};
 assert.throws(()=>validateAudit(empty,ctx),/no type for a.*no verdict for pair/);
 assert.ok(validateAudit({...empty,archetypes:[{id:'a',type:'t'}],duplicates:[{ids:['b','a'],verdict:'deliberate',reason:'r'}]},ctx));
 const set=validateAudit({...empty,archetypes:[{id:'a',type:'t'}],duplicates:[{ids:['a','b'],verdict:'deliberate'}],errors:[{blockId:'b',nodeId:'n',field:'short',correction:'x'}],keep:[{ids:['a-1','a-2'],kind:'contrast'}]},{...ctx,owner:new Map([['a-1','a'],['a-2','a']])});
 assert.equal(set.errors.length,0,'an error on a checked block is set aside');assert.equal(set.keep.length,0,'a keep run inside one question is set aside');assert.equal(set.discarded.length,2);
});

test('variation sequences are optional in the audit reply and resolve to their questions', ()=>{
 const empty={archetypes:[{id:'a',type:'t'}],types:[],exampleMatches:[],spread:[],errors:[],duplicates:[],bridges:[],missing:[],prerequisites:[],extensions:[],keep:[],theory:[]};
 const ctx={ids:new Set(['a','b']),needTypes:['a'],staleError:new Set(),staleTheory:new Set(),pairs:[],owner:new Map([['a-1','a']])};
 assert.deepEqual(validateAudit(structuredClone(empty),ctx).variations,[],'a reply without variations proposes none');
 const r=validateAudit({...structuredClone(empty),variations:[{exerciseId:'s',after:'a-1',neededBy:['b','zz'],varied:'the sign of the multiplier',fixed:'the bracket',contrast:'how a negative multiplier changes every sign',type:'t',targetScore:20}]},ctx);
 assert.equal(r.variations[0].after,'a');assert.deepEqual(r.variations[0].neededBy,['b']);
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

test('type names that differ only in plurals, stop words or order count as one type', ()=>{
 assert.equal(typeKey('identify-inverse-operation'),typeKey('identify-inverse-operations'));
 assert.equal(typeKey('area-of-a-triangle'),typeKey('triangle-area'));
 assert.notEqual(typeKey('solve-side-triangle'),typeKey('solve-side-parallelogram'));
 assert.equal(typeKey('class'),'class','a double-s word is not singularised');
});

test('only core types have the minimum; tiers of a topic count together; a soft cap per exercise', ()=>{
 const sec=(id,ids)=>({id,phase:'practice',topicId:'t',title:'Exercise',blocks:ids.map(i=>q(i,'P '+i,'$1$'))});
 const project={id:'p',topics:[{id:'t',title:'T'}],sections:[sec('s1',['a','b','c','d','e']),sec('s2',['f','g'])]};
 const types=new Map([['a',{type:'solve-equation',current:true}],['b',{type:'solve-equation',current:true}],['f',{type:'solve-equations',current:true}],['c',{type:'explain-why',current:true}],['d',{type:'core-y',current:true}],['e',{type:'core-z',current:true}],['g',{type:'core-w',current:true}]]);
 const state={project,progressions:[],types};
 const audit={types:[{type:'solve-equation',topicId:'t',taught:true,role:'core'},{type:'explain-why',topicId:'t',taught:true,role:'enrichment'},{type:'core-y',topicId:'t',taught:true,role:'core'},{type:'core-z',topicId:'t',taught:true,role:'core'},{type:'core-w',topicId:'t',taught:false,role:'core'}],exampleMatches:[],spread:[]};
 const plan=gapPlan(project,state,{audit});
 const count=plan.slots.filter(s=>s.reason==='type-count');
 assert.ok(!plan.deficits.some(d=>d.type==='solve-equation'||d.type==='solve-equations'),'a and b in one tier plus f (a plural name) in another make three');
 assert.deepEqual(plan.exempt.map(e=>e.type),['explain-why'],'an enrichment one-off is exempt and listed');
 assert.ok(!count.some(s=>s.type==='explain-why'));
 assert.ok(count.filter(s=>s.sectionId==='s1').length<=LIMITS.countSlotsPerExercise,'at most two new count questions per exercise');
 assert.ok(plan.capped.length>0,'what the cap leaves out is reported');
 const untaught=count.find(s=>s.type==='core-w');
 assert.ok(untaught&&untaught.commentOnly&&untaught.teachingNeeded,'an untaught core type is drafted for the teacher, not inserted');
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

test('a drafted grid under rescaled axes gets one line per unit', async()=>{
 const {gridSteps}=await import('../pedagogy/audit-v2.mjs');
 const fig=code=>({sections:[{id:'s',blocks:[{id:'v2-s-slot-3',content:{questionDiagrams:[{format:'tikz',code}]}}]}]});
 const p=fig('\\begin{tikzpicture}[x=0.43cm,y=0.43cm]\n\\draw[gray!40,very thin] (-7,-7) grid (7,7);\n\\draw (0,0) grid (1,1);\n\\end{tikzpicture}');
 assert.equal(gridSteps(p),2);const code=p.sections[0].blocks[0].content.questionDiagrams[0].code;
 assert.match(code,/\\draw\[gray!40,very thin,step=1\] \(-7,-7\) grid/);assert.match(code,/\\draw\[step=1\] \(0,0\) grid/);
 const kept=fig('\\begin{tikzpicture}[x=0.5cm]\n\\draw[step=2] (0,0) grid (4,4);\n\\end{tikzpicture}');assert.equal(gridSteps(kept),0,'an explicit step stays');
 assert.equal(gridSteps(fig('\\begin{tikzpicture}[x=1.08cm,y=0.43cm]\n\\draw[gridGrey,xstep=1,ystep=1] (0,0) grid (5,7);\n\\end{tikzpicture}')),0,'xstep and ystep count');
 const plain=fig('\\begin{tikzpicture}[scale=0.5]\n\\draw (0,0) grid (4,4);\n\\end{tikzpicture}');assert.equal(gridSteps(plain),0,'scale moves the grid with the ticks');
});

test('views print each table cell on one line', async()=>{
 const {oneLineCells}=await import('../pedagogy/audit-v2.mjs');
 const {toSource}=await import('../public/libs/maths-editor/document-model.mjs');
 const p=(...inl)=>({type:'paragraph',inlines:inl}),t=s=>({type:'text',text:s,marks:[]});
 const cell=(...blocks)=>({type:'cell',blocks});
 const doc={format:'maths-editor-document-v1',version:1,blocks:[{type:'table',rows:[[cell(p(t('Red counter'),{type:'break'},t('chosen'))),cell(p(t('Green counter')),p(t('chosen')))],[cell(p(t('24'))),cell(p(t('11')))]]}]};
 // Probability j9: two-line headings split the row in source text.
 assert.equal(toSource(oneLineCells(doc)),'Red counter chosen\tGreen counter chosen\n24\t11');
 assert.equal(doc.blocks[0].rows[0][0].blocks[0].inlines.length,3,'the booklet document is not changed');
});

test('a replaced part is written bare like its siblings', async()=>{
 const {bareLikeSiblings}=await import('../pedagogy/audit-v2-apply.mjs');
 // Simplifying Expressions p37 Q4a and Rates 1 Q2b (8 November 2026).
 assert.equal(bareLikeSiblings('Simplify $\\frac{3n}{8n}$.','Simplify these expressions.',['$\\frac{5a}{9a}$','$\\frac{2ab}{5a}$']),'$\\frac{3n}{8n}$');
 assert.equal(bareLikeSiblings('Convert $22$ m/s to kilometres per hour.','Convert these units of speed to kilometres per hour.',['$8$ m/s','$12.5$ m/s']),'$22$ m/s');
 assert.equal(bareLikeSiblings('Simplify $2x+3x$.','Find the value of each.',['$5$']),'Simplify $2x+3x$.','a stem with another command keeps the verb');
 assert.equal(bareLikeSiblings('Simplify $2x$.','Simplify these.',['Simplify $3x$.','Simplify $4x$.']),'Simplify $2x$.','worded siblings keep it');
 assert.equal(bareLikeSiblings('Find the unknown value.\n\n$\\frac{5}{9}=\\frac{x}{18}$','Find the unknown values.',['$1$','$2$']),'Find the unknown value.\n\n$\\frac{5}{9}=\\frac{x}{18}$','words after the verb stay');
});

test('empty guided practice steps take the example step instructions', async()=>{
 const {fillEmptySteps}=await import('../pedagogy/audit-v2.mjs');
 const steps='1. Let $b$ be Ben\'s age in years. Then Ava\'s age is $36-b$.\n\n2. Write an equation using the other condition.\n\n3. Solve the equation.\n$$2(36-b)=4b-6$$\n4. Check: Ava is $36-13=23$ years old.';
 const g={content:{children:[{label:'a',prompt:'Let ____ be'},{label:'b',prompt:''},{label:'c',prompt:{blocks:[{type:'paragraph',inlines:[]}]}},{label:'d',prompt:''}]}};
 assert.deepEqual(fillEmptySteps(g,steps).content.children.map(c=>c.prompt),['Let ____ be','Write an equation using the other condition.','Solve the equation.','Check your answer.']);
 // The example's own numbers never reach the guided practice (coins: 20c and 50c versus 10c and 20c).
 const coins={content:{children:[{prompt:'Let ____ be'},{prompt:''}]}};
 assert.equal(fillEmptySteps(coins,'1. Let $x$ be the number.\n2. Value of 20c coins plus value of 50c coins equals the total.').content.children[1].prompt,'Write an equation.');
});

test('a theory rewrite moves to a sibling only when it resembles the sibling text', async()=>{
 const {siblingRewriteFits}=await import('../pedagogy/audit-v2-apply.mjs');
 const formula={format:'maths-editor-document-v1',version:1,blocks:[{id:'p',type:'paragraph',inlines:[{type:'math',latex:'\\begin{aligned}V&=lwh\\end{aligned}',display:true}]}]};
 const rewrite='For other prisms, identify the uniform cross-section as the base and use $V=Ah$.';
 assert.equal(siblingRewriteFits(formula,rewrite),false,'Volume p19: the formula display has no words');
 const note={format:'maths-editor-document-v1',version:1,blocks:[{id:'p',type:'paragraph',inlines:[{type:'text',text:'For the other prisms, identify the cross-section and use the formula.'}]}]};
 assert.equal(siblingRewriteFits(note,rewrite),true);
});

test('a gridded question keeps its converted stem table', ()=>{
 // Linear Relationships 1 slot-11-lower: partLayout copied the root, and the stem's tab rows printed bare.
 const draft={content:{type:'question',prompt:'Use the table.\n\n$x$\t$0$\t$1$\t$2$\n$y$\t$5$\t$7$\t$9$',children:[{id:'a',type:'part',label:'a',prompt:'Find the rule.',answer:{short:'1',worked:'x'}},{id:'b',type:'part',label:'b',prompt:'Find $y$.',answer:{short:'2',worked:'x'}}]}};
 const b=newBlock(draft,{id:'slot-11-lower',sectionId:'s'},{project:{sections:[{id:'s',blocks:[]}]},score:null});
 assert.equal(b.content.layout,'grid');assert.equal(typeof b.content.prompt,'object');
 const t=b.content.prompt.blocks.find(x=>x.type==='table');assert.ok(t?.border,'a bordered table of values');
});

test('drafted prompts in editor source text become editor documents', ()=>{
 assert.equal(promptFromSource('Solve $x_1+2=5$.','p'),'Solve $x_1+2=5$.','plain prompts and subscripts in maths stay strings');
 const italic=promptFromSource('The first digits are:\n\n_2.718 281 …_\n\nClassify $e$.','p');
 assert.equal(italic.format,'maths-editor-document-v1');
 assert.deepEqual(italic.blocks[1].inlines[0],{type:'text',text:'2.718 281 …',marks:['italic']});
 const cloze=promptFromSource('$x-5$\t$=$\t$9$\n[[$-12$|11]]\t\t[[$-12$|11]]\n$x$\t$=$\t$14$','v2-a-p');
 const table=cloze.blocks[0];
 assert.equal(table.type,'table');assert.equal(table.border,false);assert.equal(table.rows.length,3);
 assert.deepEqual(table.rows[0].map(c=>c.align),['right','center','left']);
 assert.ok(table.rows[1][0].blocks[0].inlines[0].width>=13,'a blank is at least the handwriting width of its answer');
 assert.ok(cloze.blocks.every(b=>b.id.startsWith('v2-a-p-d')),'ids are stable and scoped to the part');
});

test('a drafted question takes the layout of a same-type sibling', ()=>{
 const part=(id,l)=>({id,type:'part',label:l,prompt:'$x$',answerSpaceMm:20});
 const sib={id:'q1',type:'question',content:{id:'q1-root',type:'question',layout:'grid',columns:4,children:['a','b','c','d','e'].map(l=>part('q1-'+l,l))}};
 const cols={id:'q2',type:'question',content:{id:'q2-root',type:'question',layout:'grid',columns:3,children:[1,2,3].map(n=>({id:'q2-c'+n,type:'group',layout:'list',children:[part('q2-'+n,'a')]}))}};
 const project={id:'b',sections:[{id:'s',blocks:[sib,cols]}]};
 const draft={content:{type:'question',prompt:'Solve.',children:['a','b','c'].map(l=>part(l,l))}};
 const typed=newBlock(draft,{id:'slot-1-lower',sectionId:'s'},{project,score:null,type:'solve',typeOfId:id=>id==='q1'?'solve':'other'});
 assert.equal(typed.content.layout,'grid');assert.equal(typed.content.columns,3,'columns never exceed the parts');assert.equal(typed.sourceReview.layoutFrom,'q1');
 assert.deepEqual(layoutSibling(project,{sectionId:'s',after:'q2'},null,null),{id:'q2',layout:'grid',columns:3},'a grid of column groups counts');
 const alone=newBlock(draft,{id:'slot-2',sectionId:'s'},{project,score:null}).content;
 assert.equal(alone.layout,'grid','no sibling: the length-based grid (8 November 2026)');assert.equal(alone.columns,3);
 const wide={content:{type:'question',prompt:'Expand.',children:['a','b','c','d'].map(l=>({...part(l,l),prompt:'$2(x+3)-3(x+1)$'}))}};
 assert.equal(newBlock(wide,{id:'slot-3',sectionId:'s'},{project,score:null,type:'solve',typeOfId:id=>id==='q1'?'solve':'other'}).content.columns,3,'a sibling layout never has more columns than the parts allow');
});

test('an accepted reply from an earlier run of the booklet is reused, a failed one never', async ()=>{
 const fs=await import('node:fs'),os=await import('node:os'),path=await import('node:path');
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'audit-v2-reuse-')),old=path.join(base,'20261107-001409','calls'),workDir=path.join(base,'20261107-010000');
 fs.mkdirSync(old,{recursive:true});fs.mkdirSync(workDir);
 const call=(name,ok,prompt)=>{fs.writeFileSync(path.join(old,name+'.prompt.txt'),prompt);fs.writeFileSync(path.join(old,name+'.json'),JSON.stringify({id:name,ok,model:MODEL,effort:EFFORT,startedAt:new Date().toISOString(),costUsd:0.5,stdout:JSON.stringify({result:'{"drafts":[]}'})}));};
 call('03-draft-slots-1',true,'PROMPT A');call('04-draft-slots-1',false,'PROMPT B');
 const ctx={workDir};
 const hit=reusableReply(ctx,{stage:'draft-slots',system:'S',prompt:'PROMPT A'});
 assert.equal(hit.result,'{"drafts":[]}');assert.equal(hit.costUsd,0.5);
 assert.equal(reusableReply(ctx,{stage:'draft-slots',system:'S',prompt:'PROMPT B'}),null,'a failed call is never reused');
 assert.equal(reusableReply(ctx,{stage:'challenge',system:'S',prompt:'PROMPT A'}),null,'stage must match');
 assert.equal(reusableReply({...ctx,freshCalls:true},{stage:'draft-slots',system:'S',prompt:'PROMPT A'}),null,'--fresh-calls');
 fs.rmSync(base,{recursive:true,force:true});
});

test('an over-cap batch is halved and a single over-cap item is set aside, never sent', async ()=>{
 const big=LIMITS.promptCharacters;
 const items=[{id:'a',n:big*0.4},{id:'b',n:big*0.4},{id:'c',n:big*0.4},{id:'d',n:big*1.5}];
 const sent=[];
 const parts=await splitByCap(items,list=>list.reduce((s,i)=>s+i.n,0),async list=>{sent.push(list.map(i=>i.id).join(''));return list.length;});
 assert.ok(sent.every(s=>!s.includes('d')),'the oversized item is never sent');
 assert.deepEqual(parts.filter(p=>p.over).flatMap(p=>p.items.map(i=>i.id)),['d']);
 assert.deepEqual(parts.filter(p=>p.value).flatMap(p=>p.items.map(i=>i.id)).sort(),['a','b','c']);
 assert.deepEqual(await splitByCap([],()=>0,async()=>1),[]);
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

test('the challenge sees the questions a finding is for, not only the block before the gap', ()=>{
 const project={id:'p',topics:[{id:'t',title:'T'},{id:'u',title:'U'}],sections:[
  {id:'s',phase:'practice',topicId:'t',title:'Exercise',blocks:[q('a','P a','$1$'),q('b','P b','$1$'),q('c','P c','$1$'),q('d','P d','$1$'),q('e','P e','$1$'),q('f','P f','$1$')]},
  {id:'s2',phase:'practice',topicId:'u',title:'Exercise',blocks:[q('g','P g','$1$')]}]};
 const state={types:new Map([['c',{type:'x'}],['g',{type:'x'}],['d',{type:'y'}]])};
 assert.deepEqual(challengeTargets(project,state,'bridges',{after:'a',neededBy:['e']}),['e'],'neededBy from the auditor wins');
 assert.deepEqual(challengeTargets(project,state,'bridges',{after:'a-root'}),['b','c','d','e'],'next questions in the same exercise, from a node id');
 assert.deepEqual(challengeTargets(project,state,'bridges',{after:'f'}),[],'never crosses into the next exercise');
 assert.deepEqual(challengeTargets(project,state,'missing',{topicId:'t',type:'x'}),['c'],'exercise questions of the type in its topic');
 assert.deepEqual(challengeTargets(project,state,'prerequisites',{after:'a'}),[]);
});

test('neededBy ids resolve to their questions; unknown ids are dropped', ()=>{
 const empty={archetypes:[{id:'a',type:'t'}],types:[],exampleMatches:[],spread:[],errors:[],duplicates:[],bridges:[{after:'a',neededBy:['b-1','zz']}],missing:[{type:'t'}],prerequisites:[],extensions:[],keep:[],theory:[]};
 const r=validateAudit(empty,{ids:new Set(['a','b']),needTypes:[],staleError:new Set(),staleTheory:new Set(),pairs:[],owner:new Map([['b-1','b']])});
 assert.deepEqual(r.bridges[0].neededBy,['b']);assert.deepEqual(r.missing[0].neededBy,[]);
});

test('a diagram-only part prints in a comment without undefined', ()=>{
 assert.equal(partText({label:'a',questionDiagrams:[{}]}),'(with a diagram)');
 assert.equal(partText({prompt:' $x+1$ '}),'$x+1$');
 assert.equal(partText({}),'(no prompt)');
});

// Count rules of 8 November 2026: complete-task parts (at most 3 per question) and synonym groups.
const parts=(id,stem,list,extra={})=>({id,type:'question',classification:rating(10),content:{id:id+'-root',type:'question',prompt:stem,children:list.map((p,i)=>({id:id+'-'+i,type:'part',label:'abcdefgh'[i],prompt:p,answer:{short:'1',worked:'x'}})),...extra}});
test('each part a student answers on its own counts, up to three per question; a scaffolded chain counts once', ()=>{
 assert.equal(practiceItemCount(parts('a','Expand.',['$3(x+2)$','$2(x-1)$','$5(x+4)$','$4(2x-3)$','$7(x+1)$'])),3,'five independent parts count three');
 assert.equal(practiceItemCount(parts('b','Expand.',['$3(x+2)$','$2(x-1)$'])),2);
 assert.equal(practiceItemCount(parts('c','Solve $2x+3=11$.',['Subtract 3 from both sides.','Hence find $x$.'])),1,'a hence step joins the part before');
 assert.equal(practiceItemCount(parts('d','Four friends have $14, $22, $9 and $31 and share it equally.',['How much does each friend have?','How much money is passed on?'])),1,'questions about one shared problem with no material of their own are one task');
 const table={...parts('e','',['','','']),content:{...parts('e','',['','','']).content,prompt:{format:'maths-editor-document-v1',blocks:[{type:'paragraph',inlines:[{type:'text',text:'Complete the table.'}]},{type:'table',rows:[]}]}}};
 assert.equal(practiceItemCount(table),3,'answer cells in the stem table are rows a student fills on their own');
 assert.equal(practiceItemCount(parts('h','Draw these geometrical figures.',['Line FG','Segment BA','Point C','Ray ZY'])),3,'under a stem without data, each worded part is a task of its own');
 assert.equal(practiceItemCount(q('f','Find $x$.','$2$')),1);
 const reviewed=parts('g','Expand.',['$3(x+2)$','$2(x-1)$']);reviewed.classification={...reviewed.classification,archetypeReview:{practiceItems:[{nodeIds:['g-0','g-1']}]}};
 assert.equal(practiceItemCount(reviewed),1,'a reviewed practiceItems grouping wins');
});
test('synonym groups count together across topics; count slots go round by round', ()=>{
 const sec=(id,topicId,blocks)=>({id,phase:'practice',topicId,title:'Exercise',blocks});
 const project={id:'p',topics:[{id:'t1',title:'Lesson'},{id:'t2',title:'Summary'}],sections:[sec('s1','t1',[q('a','A','1'),q('b','B','1'),q('c','C','1')]),sec('s2','t2',[q('d','D','1'),q('e','E','1'),q('f','F','1'),q('g','G','1')])]};
 const types=new Map([['a',{type:'decimal-to-fraction-simplify'}],['b',{type:'decimal-to-fraction-simplify'}],['c',{type:'decimal-to-fraction-simplify'}],['d',{type:'decimal-to-simplified-fraction'}],['e',{type:'core-x'}],['f',{type:'core-y'}],['g',{type:'core-z'}]].map(([k,v])=>[k,{...v,current:true}]));
 const state={project,progressions:[],types};
 const base={types:[{type:'decimal-to-fraction-simplify',topicId:'t1',taught:true,role:'core'},{type:'decimal-to-simplified-fraction',topicId:'t2',taught:true,role:'core'},...['core-x','core-y','core-z'].map(type=>({type,topicId:'t2',taught:true,role:'core'}))],exampleMatches:[],spread:[]};
 const before=gapPlan(project,state,{audit:base});
 assert.ok(before.deficits.some(d=>d.type==='decimal-to-simplified-fraction'),'without grouping the summary copy is short');
 const after=gapPlan(project,state,{audit:{...base,typeGroups:[{types:['decimal-to-fraction-simplify','decimal-to-simplified-fraction'],method:'over a power of 10, then simplify'}]}});
 assert.ok(!after.deficits.some(d=>/decimal/.test(d.type)),'grouped, the lesson and summary items count together');
 const count=after.slots.filter(s=>s.reason==='type-count'&&s.sectionId==='s2');
 assert.equal(count.length,LIMITS.countSlotsPerExercise);
 assert.deepEqual([...new Set(count.map(s=>s.type))].sort(),['core-x','core-y','core-z'],'each short type gets its first new question before any gets a second');
});
test('role-and-group replies keep only known, non-overlapping groups', ()=>{
 const known=[{type:'a',topic:'t'},{type:'b',topic:'t'},{type:'c',topic:'u'}];
 const r=validateRoleGroups({roles:[{type:'a',role:'core'}],groups:[{types:['a','b'],method:'m'},{types:['b','c']},{types:['x','c']},{types:['c']}]},['a'],known);
 assert.deepEqual(r.groups,[{types:['a','b'],method:'m'}]);
 assert.equal(r.roles.get('a').role,'core');
 assert.throws(()=>validateRoleGroups({roles:[],groups:[]},['a'],known),/missing a/);
});

test('tab rows: options stay a list; values laid out across are a table with a header row', ()=>{
 const tableOf=src=>promptFromSource(src,'x').blocks.find(b=>b.type==='table');
 const opts=tableOf('Which question gives numerical data?\nA\tWhat is your favourite subject?\nB\tHow many books did you read?');
 assert.equal(opts.border,false);assert.ok(!opts.rows[0][0].header,'option A is not a header');
 const across=tableOf('Fill in the table.\nWeek\t1\t2\t3\nSavings (dollars)\t40\t\t80');
 assert.equal(across.border,true);assert.ok(across.rows[0][0].header&&across.rows[1][0].header,'the label column is shaded');assert.ok(!across.rows[0][1].header,'the first row may be data');
 const working=tableOf('Line up the digits.\n$3$\t$4$\t$5$\n$1$\t$2$\t$3$');
 assert.equal(working.border,false,'aligned working stays borderless');
 // Tables of values labelled by their variables (Linear Relationships 1, 8 November 2026).
 const xy=tableOf('Find the rule.\n$x$\t$0$\t$1$\t$2$\n$y$\t$1$\t$3$\t[[5|8]]');
 assert.equal(xy.border,true);assert.ok(xy.rows[0][0].header&&xy.rows[1][0].header&&!xy.rows[0][1].header);
 assert.equal(tableOf('Solve.\n$x$\t$=$\t$5$\n$y$\t$=$\t$2$').border,false,'working with = stays borderless');
 assert.equal(tableOf('Solve.\n$x$\t$+3$\t$5$\n$x$\t$-3$\t$2$').border,false,'a repeated label is working, not a table');
 // A bold "Stem | Leaf" heading is still a stem-and-leaf plot, never a gridded table (Data Analysis 2 j3).
 const sl=tableOf('Data.\n**Stem**\t**Leaf**\n$3$\t$N\\ 5\\ 5$\n$4$\t$2\\ 8$');
 assert.equal(sl.border,false);assert.ok(!sl.rows[0][0].header);
});

test('a Key ideas blank between two maths spans is a blank, not maths', async()=>{
 const {keyIdeasBlock}=await import('../pedagogy/audit-v2.mjs');
 const b=keyIdeasBlock({sections:[]},'t',['If you are given $x$, [[substitute]] it to find $y$.','Opposite: $-a-b=-([[a+b]])$.'],{stamp:'s'});
 const [one,two]=b.content.children.map(c=>c.prompt.blocks[0].inlines);
 assert.deepEqual(one.map(n=>n.type),['text','math','text','cloze','text','math','text']);
 assert.equal(one[3].answer,'substitute');
 // Ratios 2: drafted statements numbered "1. " printed "1. 1. …".
 const numbered=keyIdeasBlock({sections:[]},'t',['1. A scale of [[1:n]] means …','(b) Add the [[parts]].','A scale is set up …'],{stamp:'s'});
 assert.deepEqual(numbered.content.children.map(c=>c.prompt.blocks[0].inlines[0].text),['A scale of ','Add the ','A scale is set up …']);
 assert.ok(two.some(n=>n.type==='cloze')&&!two.some(n=>n.type==='math'&&/\[\[/.test(n.latex)));
});

test('row-spacing hints are dropped from every aligned display in drafted working', async()=>{
 const {textRows}=await import('../pedagogy/audit-v2.mjs');
 const out=textRows(String.raw`$$\begin{align*}{\color{#ef6068}1.}\quad \text{Fixed charge}&=60\\[2mm]C&=60+85t\end{align*}$$`);
 assert.ok(!/\\\\\[/.test(out),out);assert.match(out,/&=60\\\\C&=60\+85t/);
 const steps=textRows(String.raw`$$\begin{align*}{\color{#ef6068}1.}\quad \text{Fixed charge}&=60\\{\color{#ef6068}2.}\quad C&=60+85t\end{align*}$$`);
 assert.equal(steps,String.raw`$$\begin{align*}{\color{#ef6068}1.}\quad&\text{Fixed charge}=60\\{\color{#ef6068}2.}\quad&C=60+85t\end{align*}$$`,'numbered steps align after the number');
});

test('page-check failures the live booklet already has do not fail the audit save', async()=>{
 const {baselineVerdict}=await import('../pedagogy/audit-v2.mjs');
 const coverage={edition:'short',kind:'answer-coverage',message:"Every complete answer diagram appears exactly once\n-   'p79-q1-chart-solution-context'"};
 const layout={kind:'short-cloze',requiredMm:20,availableMm:12.04};
 // Operations with Decimals 3: the same coverage failure live and in the candidate, plus one old layout issue.
 const same=baselineVerdict({failures:[coverage,{edition:'student',kind:'layout'}],issues:{student:[layout]}},{failures:[coverage],issues:{student:[layout]}});
 assert.deepEqual(same.fresh,[]);assert.deepEqual(same.newFailures,[]);assert.equal(same.preexisting.length,1);
 // A different message, a new layout issue and an exception are all the audit's.
 const changed=baselineVerdict({failures:[{...coverage,message:coverage.message+"\n-   'v2-slot-1'"},{edition:'worked',kind:'exception',message:'x'}],issues:{student:[layout,layout]}},{failures:[coverage,{edition:'worked',kind:'exception',message:'x'}],issues:{student:[layout]}});
 assert.equal(changed.fresh.length,1);assert.deepEqual(changed.newFailures.map(f=>f.kind),['answer-coverage','exception']);assert.deepEqual(changed.preexisting,[]);
});

test('ordering-hold comments say what held the exercise and whether it is outside it', async()=>{
 const {holdComments}=await import('../pedagogy/audit-v2.mjs');
 const plan={sections:[{sectionId:'s1',segments:[{status:'held',originalIds:['q1','q2','q3'],holds:[{id:'p73-q2',kind:'unresolved-relative-or-cross-scope-reference',quote:'following question'},{ids:['q2','q9'],kind:'noncontiguous-semantic-unit'}]}]}]};
 const [c]=holdComments(plan,{});
 assert.match(c.note,/Held by: "following question" in p73-q2 \(outside this exercise\); noncontiguous-semantic-unit at q2\./);
 assert.match(c.note,/rewording or settling the printed reference/);
 assert.doesNotMatch(c.note,/release it: [^.]*unresolved-relative-or-cross-scope-reference/);
});
