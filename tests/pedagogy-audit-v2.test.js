import test from 'node:test';
import assert from 'node:assert/strict';
import {contentFingerprint,wordingFingerprint,australianSpelling,spellBlock,boldTerm,deriveComparisonScore,jumpSlots,slotWindow,duplicatePairs,diagramBlindHash,diagramEquivalent,practiceItemCount,LIMITS,MODEL,EFFORT} from '../pedagogy/audit-v2-plan.mjs';
import {validateAudit,validateRoleGroups,validateSolve,validateDrafts,validateEquivalence,writingRules,theoryRules,auditContract,challengeContract} from '../pedagogy/audit-v2-prompts.mjs';
import {resolveSkill,bookletSkillIds,challengeMoves,sortChallengeSections,unletterLoneGuided,laterLessons,gapPlan,newBlock,studentView,promptFromSource,layoutSibling,reusableReply,splitByCap,typeKey,challengeTargets,partText,prerequisiteNotNeeded,additionNotNeeded,unneededReviewItems,bookletCourse,relocateQuestions} from '../pedagogy/audit-v2.mjs';

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
 const project={id:'p',topics:[{id:'t',title:'T'}],sections:[sec('s1',['a','b','c','d','e','h','i']),sec('s2',['f','g'])]};
 const types=new Map([['a',{type:'solve-equation',current:true}],['b',{type:'solve-equation',current:true}],['f',{type:'solve-equations',current:true}],['c',{type:'explain-why',current:true}],['d',{type:'core-y',current:true}],['e',{type:'core-z',current:true}],['g',{type:'core-w',current:true}],['h',{type:'core-u',current:true}],['i',{type:'core-v',current:true}]]);
 const state={project,progressions:[],types};
 const audit={types:[{type:'solve-equation',topicId:'t',taught:true,role:'core'},{type:'explain-why',topicId:'t',taught:true,role:'enrichment'},{type:'core-y',topicId:'t',taught:true,role:'core'},{type:'core-z',topicId:'t',taught:true,role:'core'},{type:'core-w',topicId:'t',taught:false,role:'core'},{type:'core-u',topicId:'t',taught:true,role:'core'},{type:'core-v',topicId:'t',taught:true,role:'core'}],exampleMatches:[],spread:[]};
 const plan=gapPlan(project,state,{audit});
 const count=plan.slots.filter(s=>s.reason==='type-count');
 assert.ok(!plan.deficits.some(d=>d.type==='solve-equation'||d.type==='solve-equations'),'a and b in one tier plus f (a plural name) in another make three');
 assert.deepEqual(plan.exempt.map(e=>e.type),['explain-why'],'an enrichment one-off is exempt and listed');
 assert.ok(!count.some(s=>s.type==='explain-why'));
 assert.ok(count.filter(s=>s.sectionId==='s1').length<=LIMITS.countSlotsPerExercise,'at most two new count questions per exercise');
 assert.ok(plan.capped.length>0,'what the cap leaves out is reported');
 // One slot per short type, asking for as many parts as it is short (11 November 2026).
 assert.ok(count.filter(s=>s.sectionId==='s1').every(s=>s.parts===2),'a type with one item gets one slot of two parts');
 assert.equal(new Set(count.map(s=>s.type)).size,count.length,'never two count slots for one type');
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

test('figure findings are kept only for figures the audit made or changed', async()=>{
 // Simultaneous Equations 2 (10 November 2026): one finding on the audit's annulus among ~90 on exam and teacher figures.
 const {figureFindings}=await import('../pedagogy/audit-v2.mjs');
 const fs=await import('node:fs'),os=await import('node:os'),path=await import('node:path');
 const fig=(id,code)=>({id,type:'question',content:{id:id+'-root',type:'question',prompt:'P',questionDiagrams:[{id:id+'-d',format:'tikz',code}]}});
 const live={sections:[{id:'s',blocks:[fig('p1-q1','a')]}]},candidate={sections:[{id:'s',blocks:[fig('p1-q1','a'),fig('v2-s-slot-1','b')]}]};
 const file=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'ff-')),'feedback-pages.json');
 fs.writeFileSync(file,JSON.stringify({editionsReport:{student:{diagramVisualFindings:[
  {page:3,diagramId:'p1-q1-d',kind:'diagram-label-stroke'},{page:4,diagramId:'v2-s-slot-1-d',kind:'diagram-label-stroke'},{page:4,diagramId:'v2-s-slot-1-d',kind:'diagram-label-stroke'}]}}}));
 assert.deepEqual(figureFindings(file,live,candidate),[{edition:'student',page:4,blockId:'v2-s-slot-1',diagramId:'v2-s-slot-1-d',kind:'diagram-label-stroke'}]);
 assert.deepEqual(figureFindings(file+'.missing',live,candidate),[],'no report, no findings');
});

test('a new block never reuses an id already in the booklet', ()=>{
 const draft={content:{type:'question',prompt:'P',answer:{short:'1',worked:'x'}}},slot={id:'slot-1-lower',sectionId:'s'};
 const first=newBlock(draft,slot,{project:{sections:[{id:'s',blocks:[]}]},score:null});
 const second=newBlock(draft,slot,{project:{sections:[{id:'s',blocks:[first]}]},score:null});
 assert.equal(first.id,'v2-s-slot-1-lower');assert.equal(second.id,'v2-s-slot-1-lower-2');assert.equal(second.content.id,'v2-s-slot-1-lower-2-root');
});

test('new questions after one anchor go in score order', async()=>{
 // 10 November 2026: a slot's upper version went straight after the anchor, ahead of its lower version.
 const {afterInserted}=await import('../pedagogy/audit-v2.mjs');
 const q=(id,score)=>({id,classification:{reasoningScore:score}});
 const anchor=q('p1',20),next=q('p2',50),lower=q('lower',30);
 const blocks=[anchor,lower,next];
 assert.equal(afterInserted(blocks,0,[lower],38),2,'the harder version goes after the easier one already inserted');
 assert.equal(afterInserted(blocks,0,[lower],25),1,'an easier version goes before it');
 assert.equal(afterInserted(blocks,0,[],38),1,'teacher questions are never stepped over');
});

test('a labelled angle in a drafted figure is drawn with its arc', async()=>{
 // Non-right-angled Trigonometry 2 Exercise 3 Q3 (10 November 2026): θ printed alone, 1 cm into the triangle.
 const {arcsOnAngleLabels}=await import('../pedagogy/audit-v2.mjs');
 const code=String.raw`\pic["$\theta$",angle radius=0.6cm] {angle=R--P--Q};\pic[draw,"$x$"] {angle=A--B--C};\pic[angle radius=3mm] {right angle=A--B--C};`;
 const made=newBlock({content:{type:'question',prompt:'Find $\\theta$.',answer:{short:'1',worked:''},questionDiagrams:[{id:'d',format:'tikz',code}]}},{id:'slot-12',sectionId:'s'},{project:{sections:[{id:'s',blocks:[]}]},score:null});
 const out=made.content.questionDiagrams[0].code;
 assert.ok(out.includes(String.raw`\pic[draw,"$\theta$",angle radius=0.6cm]`),'the bare label gains its arc');
 assert.ok(out.includes(String.raw`\pic[draw,"$x$"]`)&&!out.includes('draw,draw'),'an arc already drawn is left alone');
 assert.ok(out.includes(String.raw`\pic[angle radius=3mm] {right angle`),'an unlabelled pic is left alone');
 assert.equal(arcsOnAngleLabels(made.content),0,'idempotent');
 // Angle Relationships 2 Exercise 2: where the student draws the arc, the given angle keeps its letter alone.
 const drawIt={type:'question',prompt:'Draw an arc showing the angle corresponding to $p$.',questionDiagrams:[{id:'e',format:'tikz',code:String.raw`\pic["$p$",angle radius=4mm] {angle=A--B--C};`}]};
 assert.equal(arcsOnAngleLabels(drawIt),0);assert.ok(!drawIt.questionDiagrams[0].code.includes('draw,'));
});

test('blank parts under a table prompt become unlabelled scaffold rows', async()=>{
 // Further Quadratic Equations Exercise 5 Q2 and Q3 (10 November 2026) printed a bare "a b c …" under the table.
 const {tableRowsAsScaffold}=await import('../pedagogy/audit-v2.mjs');
 const doc=types=>({format:'maths-editor-document-v1',version:1,blocks:types.map((type,k)=>({id:'d'+k,type,...(type==='table'?{rows:[]}:{inlines:[]})}))});
 const rows=n=>Array.from({length:n},(_,k)=>({id:'r'+k,type:'part',answer:{short:String(k),worked:''}}));
 const slot={id:'slot-19',sectionId:'s'},project={sections:[{id:'s',blocks:[]}]};
 const made=newBlock({content:{type:'question',prompt:doc(['paragraph','table']),children:rows(3)}},slot,{project,score:null});
 assert.deepEqual(made.content.children.map(c=>[c.label,c.prompt,c.responseSpace,c.answerSpaceMm]),Array(3).fill(['','','scaffold',0]));
 assert.equal(made.content.responseSpace,'scaffold');assert.equal(made.content.layout,undefined);
 const prose={type:'question',prompt:doc(['paragraph']),children:rows(2)};
 assert.equal(tableRowsAsScaffold(prose),0,'no table, no change');
 const asked={type:'question',prompt:doc(['paragraph','table']),children:[{id:'a',type:'part',label:'a',prompt:'Find $a$.',answer:{short:'1',worked:''}}]};
 assert.equal(tableRowsAsScaffold(asked),0,'a part with its own prompt keeps its letter');
 assert.equal(tableRowsAsScaffold(made.content),0,'idempotent');
});

test('a shared answer drawing on a question without parts moves into its answer', async()=>{
 // Further Parabolas 1 slot-1-upper (10 November 2026): the graph never printed and the answer check failed.
 const {answerFiguresOnLeaves}=await import('../pedagogy/audit-v2.mjs');
 const graph=id=>({id,format:'tikz',code:'\\begin{tikzpicture}\\end{tikzpicture}'});
 const slot={id:'slot-1-upper',sectionId:'s'},project={sections:[{id:'s',blocks:[]}]};
 const leaf=newBlock({content:{type:'question',prompt:'Sketch $y=x^2$.',answer:{short:'s',worked:'w'},sharedSolutionDiagrams:[graph('g')]}},slot,{project,score:null});
 assert.equal(leaf.content.sharedSolutionDiagrams,undefined);
 assert.deepEqual(leaf.content.answer.solutionDiagrams.map(d=>[d.id.split('-').at(-1),d.role]),[['g','solution']]);
 const parts={type:'question',prompt:'Sketch $y=x^2$:',sharedSolutionDiagrams:[graph('h')],children:[{id:'a',type:'part',label:'a',prompt:'vertex:',answer:{short:'1',worked:'1'}},{id:'b',type:'part',label:'b',prompt:'intercepts:',answer:{short:'2',worked:'2'}}]};
 const grouped=newBlock({content:parts},{id:'slot-1-lower',sectionId:'s'},{project,score:null});
 assert.deepEqual(grouped.content.sharedSolutionDiagrams.map(d=>d.id.split('-').at(-1)),['h'],'a question with parts keeps its shared drawing');
 const one=newBlock({content:{type:'question',prompt:'Sketch:',children:[{id:'a',type:'part',label:'a',prompt:'$y=x^2$',answer:{short:'s',worked:'w'},sharedSolutionDiagrams:[graph('k')]}]}},{id:'slot-2',sectionId:'s'},{project,score:null});
 assert.equal(one.content.children,undefined);assert.deepEqual(one.content.answer.solutionDiagrams.map(d=>d.id.split('-').at(-1)),['k'],'a one-part draft keeps its drawing');
 const saved={id:'q',type:'question',answer:{short:'s',worked:'w'},sharedSolutionDiagrams:[graph('m')]};
 assert.equal(answerFiguresOnLeaves(saved),1);assert.equal(answerFiguresOnLeaves(saved),0,'idempotent');
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

test('a replaced figure part that restates the stem prints its figure alone, like its siblings', async()=>{
 // General and Point-Gradient Form p13-q2 d and f (Stage 5 batch 3, 10 November 2026).
 const {bareLikeSiblings}=await import('../pedagogy/audit-v2-apply.mjs');
 const stem='Find the equation of these lines using an appropriate method.',mine='Find the equation of this line using an appropriate method.';
 assert.equal(bareLikeSiblings(mine,stem,['','','',mine,''],{figure:true}),'','siblings bare or restating alike');
 assert.equal(bareLikeSiblings(mine,stem,['','',''],{figure:false}),mine,'no figure: the prompt is all the part has');
 assert.equal(bareLikeSiblings('Find the gradient of this line.',stem,['',''],{figure:true}),'Find the gradient of this line.','a different task stays');
 assert.equal(bareLikeSiblings(mine,stem,['Find the $y$-intercept.',''],{figure:true}),mine,'a sibling with its own task keeps the instruction');
});

test('a replaced part is written bare like its siblings', async()=>{
 const {bareLikeSiblings}=await import('../pedagogy/audit-v2-apply.mjs');
 // Simplifying Expressions p37 Q4a and Rates 1 Q2b (8 November 2026).
 assert.equal(bareLikeSiblings('Simplify $\\frac{3n}{8n}$.','Simplify these expressions.',['$\\frac{5a}{9a}$','$\\frac{2ab}{5a}$']),'$\\frac{3n}{8n}$');
 assert.equal(bareLikeSiblings('Convert $22$ m/s to kilometres per hour.','Convert these units of speed to kilometres per hour.',['$8$ m/s','$12.5$ m/s']),'$22$ m/s');
 assert.equal(bareLikeSiblings('Simplify $2x+3x$.','Find the value of each.',['$5$']),'Simplify $2x+3x$.','a stem with another command keeps the verb');
 // The stem's words around one item (Circle Trigonometry 1, 10 November 2026).
 assert.equal(bareLikeSiblings('Find the reference angle, or related angle, of the angle of inclination $\\theta=130^\\circ$.','Find the reference angle, or related angle, of these angles of inclination. A sketch will help.',['$\\theta=160^\\circ$','$\\theta=250^\\circ$']),'$\\theta=130^\\circ$');
 assert.equal(bareLikeSiblings('Rewrite the angle of inclination $-200^\\circ$ as an angle $0^\\circ\\le\\theta<360^\\circ$.','Rewrite these angles of inclination as an angle $0^\\circ\\le\\theta<360^\\circ$.',['$361^\\circ$','$-10^\\circ$']),'$-200^\\circ$');
 assert.equal(bareLikeSiblings('A rope is cut at $45^\\circ$ to the ground.','Find each angle.',['$30^\\circ$']),'A rope is cut at $45^\\circ$ to the ground.','new words are kept');
 assert.equal(bareLikeSiblings('Find the distance between $(0,0)$ and $(6,-8)$ without drawing the interval. Answer in exact form.','Find the distance between each pair of points without drawing the interval. Answer in exact form.',['$(0,0)$ and $(6,8)$','$(1,1)$ and $(7,9)$']),'$(0,0)$ and $(6,-8)$');
 assert.equal(bareLikeSiblings('Find the distance between $(0,0)$ and $(6,-8)$ on the map.','Find the distance between each pair of points.',['$(0,0)$ and $(6,8)$']),'Find the distance between $(0,0)$ and $(6,-8)$ on the map.','a tail of new words is kept');
 // A stem ending mid-phrase (Angle Sums of Polygons p17-q5 b, 10 November 2026).
 const stem='Work out the size of each exterior angle of a:',sibs=['Regular heptagon. Give your answer to 2 decimal places.','Regular 30-sided polygon.'];
 assert.equal(bareLikeSiblings('Find the size of each exterior angle of a regular 9-sided polygon.',stem,sibs),'Regular 9-sided polygon.');
 assert.equal(bareLikeSiblings('Regular octagon.',stem,sibs),'Regular octagon.','a bare completion is left alone');
 assert.equal(bareLikeSiblings('Find the area of a circle.','Find each of a:',['Square.']),'Find the area of a circle.','two shared words are not a restatement');
 assert.equal(bareLikeSiblings('Simplify $2x$.','Simplify these.',['Simplify $3x$.','Simplify $4x$.']),'Simplify $2x$.','worded siblings keep it');
 assert.equal(bareLikeSiblings('Find the unknown value.\n\n$\\frac{5}{9}=\\frac{x}{18}$','Find the unknown values.',['$1$','$2$']),'Find the unknown value.\n\n$\\frac{5}{9}=\\frac{x}{18}$','words after the verb stay');
 // Algebraic Fractions p5-q1 e (Stage 5, 9 November 2026): the verb is the stem's second command.
 assert.equal(bareLikeSiblings('Subtract these fractions. $\\frac{9m}{14}-\\frac{4m}{14}$','Add and subtract these fractions.',['$\\frac{3x}{10}+\\frac{4x}{10}$','$\\frac{7p}{13}-\\frac{2p}{13}$']),'$\\frac{9m}{14}-\\frac{4m}{14}$');
 assert.equal(bareLikeSiblings('Subtract $\\frac{9m}{14}-\\frac{4m}{14}$.','Add and subtract these fractions.',['$\\frac{3x}{10}$','$\\frac{7p}{13}$']),'$\\frac{9m}{14}-\\frac{4m}{14}$');
 assert.equal(bareLikeSiblings('Subtract these fractions. $1-x$','Simplify these.',['$1$','$2$']),'Subtract these fractions. $1-x$','a verb the stem does not use stays');
 assert.equal(bareLikeSiblings('Evaluate, without using a calculator.\n\n$\\frac{1}{7^2}$','Evaluate, without using a calculator.',['$3^{-2}$','$\\frac{1}{5^3}$']),'$\\frac{1}{7^2}$','the stem sentence on its own line goes');
 // Expanding Expressions p7-q5 b (Stage 5): a document whose first paragraph restates the stem.
 const doc={format:'maths-editor-document-v1',version:1,blocks:[{id:'d1',type:'paragraph',inlines:[{type:'text',text:'Decide what goes in the blank to make the following true.'}]},{id:'d2',type:'paragraph',inlines:[{type:'math',latex:'4('},{type:'cloze',answer:'$y$',width:9},{type:'math',latex:'+5)=4y+20'}]}]};
 const sibling={format:'maths-editor-document-v1',version:1,blocks:[{id:'s',type:'paragraph',inlines:[{type:'math',latex:'3('},{type:'cloze',answer:'$x$',width:9},{type:'math',latex:'+2)=3x+6'}]}]};
 const out=bareLikeSiblings(doc,'Decide what goes in each blank to make the following true.',[sibling,sibling]);
 assert.deepEqual(out.blocks.map(b=>b.id),['d2']);
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

test('maths inside \\text{} leaves the text so the span renders (Stage 5, 9 November 2026)', async()=>{
 const {unnestTextMath}=await import('../pedagogy/audit-v2.mjs');
 const s=String.raw`$\begin{align*}\text{gradient: }&1.8\to1.5\\\text{$y$-intercept: }&220\to260\end{align*}$`;
 const out=unnestTextMath(s);
 assert.equal(out,String.raw`$\begin{align*}\text{gradient: }&1.8\to1.5\\y\text{-intercept: }&220\to260\end{align*}$`);
 assert.equal((out.match(/\$/g)??[]).length,2,'only the outer dollars remain');
 assert.equal(unnestTextMath(String.raw`$\text{area}=6$`),String.raw`$\text{area}=6$`);
});

test('a reply with a corrected second JSON object is read from the second (Stage 5, 9 November 2026)', async()=>{
 const {parseReplyJson}=await import('../pedagogy/audit-v2.mjs');
 const reply='{"drafts":[{"requestId":"j6"}]}\n\nWait — that output is malformed: j7 must be included. Corrected full JSON follows.\n\n{"drafts":[{"requestId":"j6"},{"requestId":"j7"}]}';
 assert.deepEqual(parseReplyJson(reply).drafts.map(d=>d.requestId),['j6','j7']);
 assert.deepEqual(parseReplyJson('{"a":1}'),{a:1});
});

test('a part is replaced only by one item with an answer (Stage 5, 9 November 2026)', async()=>{
 const {singlePartDraft}=await import('../pedagogy/audit-v2-apply.mjs');
 assert.equal(singlePartDraft({prompt:'$b^5\\times b^3$',answer:{short:'$b^8$'}}),true);
 assert.equal(singlePartDraft({prompt:'Each line …',children:[{answer:{short:'x'}},{answer:{short:'y'}}]}),false,'a whole question with parts');
 assert.equal(singlePartDraft({prompt:'Each line …'}),false,'no answer');
});

test('a theory rewrite that merges paragraphs drops only their arrangement items (Stage 5, 9 November 2026)', async()=>{
 const {pruneArrangement}=await import('../pedagogy/audit-v2-apply.mjs');
 const block={id:'p4-teaching',content:{blocks:[{id:'p4-a',type:'paragraph'},{id:'p4-c',type:'paragraph'}]}};
 const lay={arrangement:{root:{type:'group',children:[{type:'item',ref:'p4-teaching/content#p4-a'},{type:'group',children:[{type:'item',ref:'p4-teaching/content#p4-b'},{type:'item',ref:'p4-teaching/content#p4-c'}]},{type:'item',ref:'p4-teaching/label'}]}}};
 const candidate={settings:{layoutOverrides:{blockLayouts:{'p4-teaching':lay}}}};
 assert.equal(pruneArrangement(candidate,block),1);
 assert.deepEqual(JSON.stringify(lay).match(/#p4-\w/g),['#p4-a','#p4-c']);
 assert.ok(JSON.stringify(lay).includes('p4-teaching/label'),'refs without a document id stay');
});

test('a figure issue in an unchanged block is not the audit\'s (Stage 5, 9 November 2026)', async()=>{
 const {unchangedFigure}=await import('../pedagogy/audit-v2.mjs');
 const blk=(id,code)=>({id,type:'question',content:{id:id+'-root',answer:{diagrams:[{id:id+'-plot',code}]}}});
 const live={sections:[{blocks:[blk('exam-mb-1','a'),blk('v2-slot-6','b')]}]};
 const cand={sections:[{blocks:[blk('exam-mb-1','a'),blk('v2-slot-6','c')]}]};
 assert.equal(unchangedFigure('exam-mb-1-plot-worked',live,cand),true);
 assert.equal(unchangedFigure('v2-slot-6-plot',live,cand),false,'a changed block keeps its issue');
 assert.equal(unchangedFigure('v2-new-plot',live,{sections:[{blocks:[blk('v2-new','x')]}]}),false,'a new block keeps its issue');
 assert.equal(unchangedFigure(undefined,live,cand),false);
});

test('a duplicate never replaces a past exam question (Stage 5, 9 November 2026)', async()=>{
 const {keepExamQuestions}=await import('../pedagogy/audit-v2.mjs');
 const exam=new Set(['p56-q13','exam-2']);
 const moved={id:'d1',kind:'duplicate',row:{ids:['p52-q4','p56-q13'],replace:'p56-q13'}};
 const both={id:'d2',kind:'duplicate',row:{ids:['p56-q13','exam-2'],replace:'exam-2'}};
 const part={id:'d3',kind:'duplicate',repeatedPart:true,row:{ids:['exam-2','exam-2'],replace:'exam-2'}};
 const plain={id:'d4',kind:'duplicate',row:{ids:['a','b'],replace:'b'}};
 assert.deepEqual(keepExamQuestions([moved,both,part,plain],exam),['d2','d3']);
 assert.equal(moved.row.replace,'p52-q4','the practice question is replaced instead');
 assert.equal(plain.row.replace,'b');
});

test('drafting contracts ask for spaced axis tick labels (Stage 5, 9 November 2026)', async()=>{
 const {proposalContract,draftContract,AXIS_LABELS}=await import('../pedagogy/audit-v2-prompts.mjs');
 assert.ok(proposalContract({}).includes(AXIS_LABELS));
 assert.ok(draftContract({}).includes(AXIS_LABELS));
});

test('a part figure limits the columns its question can have (Stage 5, 9 November 2026)', async()=>{
 const {figureColumns}=await import('../pedagogy/audit-v2.mjs');
 assert.equal(figureColumns({children:[{questionDiagrams:[{widthMm:100}]},{},{}]}),2,'a 100 mm table fits two columns, not three');
 assert.equal(figureColumns({children:[{questionDiagrams:[{widthMm:60}]},{questionDiagrams:[{}]}]}),4);
 assert.equal(figureColumns({children:[{questionDiagrams:[{widthMm:140}]}]}),1);
 assert.equal(figureColumns({children:[{},{}]}),Infinity);
});

test('a part table limits the columns its question can have (Stage 5, 10 November 2026)', async()=>{
 const {figureColumns}=await import('../pedagogy/audit-v2.mjs');
 const cell=s=>({blocks:[{type:'paragraph',inlines:[{type:'math',latex:s}]}]});
 const table=(...rows)=>({prompt:{blocks:[{type:'paragraph',inlines:[]},{type:'table',border:true,widthMm:111,rows:rows.map(r=>r.map(cell))}]}});
 const scaffold={prompt:{blocks:[{type:'table',border:false,rows:[['a^2+b^2=','\\text{blank blank blank}+\\text{blank blank blank}'].map(cell)]}]}};
 assert.equal(figureColumns({children:[scaffold,{}]}),Infinity,'borderless working is not limited');
 const values=table(['x','-4','-3','-2','-1','0','1','2'],['y','','','','','','','']);
 assert.equal(figureColumns({children:[values,{},{}]}),2,'an eight-column table of values does not fit a third of the page (Features of Quadratics 1 slot 5)');
 const freq=table(['Time','Frequency','c.f.'],['20<t\\leq30','5',''],['30<t\\leq40','9','']);
 assert.equal(figureColumns({children:[freq,{}]}),2,'a 111 mm frequency table with short cells fits half the page (Grouped Data slot 5)');
 assert.equal(figureColumns({children:[table(['x','1']),{questionDiagrams:[{widthMm:100}]}]}),2,'the narrower limit wins');
});

test('new questions inside a continued lettered run join it and the run is relettered (Stage 5, 10 November 2026)', async()=>{
 const {joinContinuedRuns}=await import('../pedagogy/audit-v2.mjs');
 const frag=(id,l)=>({id,type:'question',flow:{continuationOf:'q1',hideRepeatedStem:true},content:{id:id+'-root',type:'group',label:'',prompt:'Find the values of the pronumerals.',children:[{id:id+'-p',type:'part',label:l,prompt:'Find the values of the pronumerals.'}]}});
 const fresh={id:'v2-slot-1',type:'question',content:{id:'v2-slot-1-root',type:'question',label:null,prompt:'Find $x$.',answer:{short:'$5$'},questionDiagrams:[{id:'d'}]}};
 const copied={id:'v2-slot-2',type:'question',content:{id:'v2-slot-2-root',type:'question',label:null,prompt:'Find the values of the pronumerals.',children:[{id:'v2-slot-2-part',type:'part',label:'z',prompt:'',answer:{short:'$1$'}}]}};
 const after={id:'q2',type:'question',content:{id:'q2-root',type:'question',prompt:'Next.'}};
 const s={blocks:[frag('a1','y'),fresh,frag('a2','z'),copied,frag('a3','aa'),after]};
 joinContinuedRuns(s);
 assert.deepEqual(s.blocks.slice(0,5).map(b=>b.content.children[0].label),['y','z','aa','bb','cc'],'Circle Geometry 1 printed 6, 9, 10 and a second nn among the letters');
 assert.equal(s.blocks[1].flow.continuationOf,'q1');assert.equal(s.blocks[1].content.children[0].prompt,'Find $x$.');assert.equal(s.blocks[1].content.children[0].answer.short,'$5$');
 assert.equal(s.blocks[3].content.children[0].prompt,'Find the values of the pronumerals.','an empty part takes the question prompt');
 assert.equal(s.blocks[5].content.prompt,'Next.','a question after the run is left alone');
});

test('a duplicate replacing a one-part lettered block keeps the part and its label (Stage 5, 10 November 2026)', async()=>{
 const {keepPartShell}=await import('../pedagogy/audit-v2-apply.mjs');
 const old={id:'p41-q1-vvv-root',type:'group',label:'',children:[{id:'p41-vvv',type:'part',label:'vvv',prompt:'Find $x$.',questionDiagrams:[{id:'d1'}]}]};
 const src={id:'new',type:'question',prompt:'Find $y$.',answer:{short:'$4$'},questionDiagrams:[{id:'n1'}]};
 const next=keepPartShell(old,src);
 assert.equal(next.id,'p41-q1-vvv-root');assert.equal(next.type,'group');
 assert.deepEqual(next.children.map(c=>[c.id,c.label,c.prompt,c.answer.short]),[['p41-vvv','vvv','Find $y$.','$4$']],'Circle Geometry 2 vv, hhh and vvv lost their labels');
 assert.equal(keepPartShell({children:[{label:''}]},src),null,'an unlabelled part is not a shell');
 assert.equal(keepPartShell(old,{children:[{},{}]}),null,'a new question with parts replaces the block');
});

test('a drafted figure that names the house grid colour defines it (Stage 5, 10 November 2026)', async()=>{
 const {houseTints}=await import('../pedagogy/audit-v2.mjs');
 const fig=code=>({id:'v2-q',content:{questionDiagrams:[{format:'tikz',code}]}});
 const a=fig('\\begin{tikzpicture}[x=0.4cm]\n\\draw[housegrid,step=1] (0,0) grid (4,3);\n\\end{tikzpicture}');
 const b=fig('\\begin{tikzpicture}\n\\definecolor{housegrid}{HTML}{CCCCCC}\n\\draw[housegrid] (0,0) grid (4,3);\n\\end{tikzpicture}');
 houseTints({sections:[{blocks:[a,b]}]});
 assert.match(a.content.questionDiagrams[0].code,/^\\begin\{tikzpicture\}\[x=0\.4cm\]\n\\definecolor\{housegrid\}\{HTML\}\{CCCCCC\}/,'Quartiles slot 12 failed to compile');
 assert.equal(b.content.questionDiagrams[0].code.match(/definecolor/g).length,1,'defined once');
});

test('a table of values labelled by its equation is a bordered table (Stage 5, 10 November 2026)', ()=>{
 const t=promptFromSource('The table shows some values of $y=x^2-8x+10$.\n$x$\t$0$\t$1$\t$2$\t$3$\n$y=x^{2}-8x+10$\t$10$\t$3$\t$-2$\t$-5$','q').blocks.find(b=>b.type==='table');
 assert.equal(t.border,true,'Features of Quadratics 1 j2 printed borderless and its label ran into the first value');
 assert.ok(t.rows[1][0].header,'the label column is shaded');
 assert.ok(t.widths[0]>=38,`the equation label column is wide enough (got ${t.widths[0]})`);
 const bare=promptFromSource('Values.\nx\t0\t1\t2\t3\ny=x^{2}-8x+10\t10\t3\t-2\t-5','r').blocks.find(b=>b.type==='table');
 assert.equal(bare.border,true,'the label as sent, with no dollars');
 assert.ok(bare.widths[0]>=38,`the bare equation label column is wide enough (got ${bare.widths[0]})`);
 const two=promptFromSource('Plot these graphs on the same axis.\n$x$\t$-2$\t$-1$\t$0$\t$1$\t$2$\n$y=3^{-x}$\t\t\t\t\t\n$y=-3^x$\t\t\t\t\t','u').blocks.find(b=>b.type==='table');
 assert.equal(two.border,true,'two equations in y are two rows of one table of values');
 const words=promptFromSource('Values.\nx\t0\t1\t2\nArea=length\t1\t2\t3','s').blocks.find(b=>b.type==='table');
 assert.ok(words,'a word equation still makes a table');
 const working=promptFromSource('Solve.\n$2x+3$\t$=$\t$11$\n$2x$\t$=$\t$8$','w').blocks.find(b=>b.type==='table');
 assert.equal(working.border,false,'aligned working stays borderless');
});

test('a two-way table with a blank corner is bordered with both headings shaded (Stage 5, 9 November 2026)', ()=>{
 const t=promptFromSource('Products.\n\t$1$\t$2$\t$3$\n$1$\t$1$\t$2$\t$3$\n$2$\t$2$\t$4$\t$6$\n$3$\t$3$\t$6$\t$9$','t').blocks.find(b=>b.type==='table');
 assert.equal(t.border,true);
 assert.ok(!t.rows[0][0].header,'the corner is not shaded');
 assert.ok(t.rows[0][1].header&&t.rows[1][0].header&&!t.rows[1][1].header);
});

test('a row of equations is wide enough to print apart (Stage 5, 9 November 2026)', ()=>{
 const t=promptFromSource('Consider these four graphs:\n$y=2-5x$\t$y=5x-2$\t$y=5x+2$\t$y=-2x-5$','e').blocks.find(b=>b.type==='table');
 assert.ok(t.widths.every(w=>w>=24),`each equation column is at least 24 mm (got ${t.widths})`);
});

test('a table labelled by variables and a word is a bordered table (Stage 5, 9 November 2026)', ()=>{
 const doc=promptFromSource('Identify the coordinates from the table of values.\n$x$\t$1$\t$2$\t$3$\n$y$\t$5$\t$7$\t[[$9$|8]]\nCoordinate\t$(1,5)$\t[[$(2,7)$|14]]\t$(3,9)$','g');
 const t=doc.blocks.find(b=>b.type==='table');
 assert.equal(t.border,true);
 assert.ok(t.rows.every(r=>r[0].header&&r[0].background==='#d3e8fc'),'the label column is shaded');
 const working=promptFromSource('$x$\t$=$\t$5$\n$y$\t$=$\t$3$\nso\t$=$\t$8$','w').blocks.find(b=>b.type==='table');
 assert.equal(working.border,false,'aligned working stays borderless');
});

test('a scaffold cell with several blanks is as wide as all of them (Stage 5 pilot, 9 November 2026)', ()=>{
 const doc=promptFromSource('$1200 at 7% for 3 years.\n$FV$\t$=PV(1+r)^n$\n\t$=$[[$1200$|18]]$\\times($[[$1$|9]]$+$[[$0.07$|15]]$)$[[$3$|9]]\n\t$=$[[$1470.05$|24]]','s');
 const table=doc.blocks.find(b=>b.type==='table');
 assert.ok(table.widths[1]>=18+9+15+9+8,`the working column holds four blanks (got ${table.widths[1]} mm)`);
 assert.ok(table.widthMm>=table.widths[0]+table.widths[1]-1);
 assert.deepEqual(table.rowHeights,[10,10,10],'working rows with blanks get writing height');
 const single=promptFromSource('a\t[[$5$|12]]','s').blocks.find(b=>b.type==='table');
 assert.equal(single.widths[1],14,'a lone blank keeps its width plus 2 mm');
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

// "Show theory solutions" hides only solution fields: drafted working must never sit in the prompt
// (Polynomials 1A j5 printed its working with the box unticked, 10 November 2026).
test('teachingBlocks keeps the working out of the prompt, with or without a figure', async () => {
  const {teachingBlocks,WORKING_BLUE}=await import('../pedagogy/audit-v2.mjs');
  const project={sections:[{id:'s',blocks:[]}]};
  for(const figure of [false,true]){
    const [example]=teachingBlocks(project,{stamp:'t'+figure,workedExample:{prompt:'Find $a$ if $2a=6$.',steps:'$$\\begin{align*}2a&=6\\\\a&=3\\end{align*}$$',
      ...(figure?{questionDiagrams:[{id:'d',format:'tikz',code:'\\begin{tikzpicture}\\draw (0,0)--(1,0);\\end{tikzpicture}',widthMm:40}]}:{})}});
    const e=example.examples[0];
    assert.ok(!JSON.stringify(e.prompt).includes(WORKING_BLUE),'prompt has no working');
    assert.ok(e.theorySolution?.blocks?.length,'working is in theorySolution');
    assert.ok(JSON.stringify(e.theorySolution).includes('a=3')||JSON.stringify(e.theorySolution).includes('a&=3'));
    assert.equal(e.solutionOwnStyle===true,!figure,'only working that used to print in the prompt keeps its formatting');
  }
});

test('key ideas statements with maths outside $…$ are caught; units and words are not (10 November 2026)', async ()=>{
  const {bareMaths}=await import('../pedagogy/audit-v2-prompts.mjs');
  for(const t of ['For y = k·a^x + c, the curve shows exponential [[growth]].','The asymptotes of y = k/x are the lines x = [[0]].',
    'A circle with radius r has equation x² + y² = [[r²]].','related by m = [[tan θ]].','use θ = tan⁻¹(m).'])assert.ok(bareMaths(t),t);
  for(const t of ['To change km/h to m/s, multiply the distance by [[1000]].','For $y=ka^{x}+c$, growth when $a>1$.',
    'A pie chart is a [[circle]].','the asymptote is $x=$ [[$b$]]','The answer is [[x = 2]].'])assert.ok(!bareMaths(t),t);
});

test('a replaced part that repeats the stem\'s later lines word for word keeps only its item (10 November 2026)', async ()=>{
  const {bareLikeSiblings}=await import('../pedagogy/audit-v2-apply.mjs');
  const stem='Sketch the following circles.\nLabel the coordinates of the centre and intercepts, if any. Check your sketch using DESMOS.';
  const sib=['$(x+1)^2+y^2=9$','$x^2+(y-4)^2=36$','$(x-3)^2+(y+1)^2=1$'];
  assert.equal(bareLikeSiblings('Sketch the circle $(x+3)^2+y^2=9$.\nLabel the coordinates of the centre and intercepts, if any. Check your sketch using DESMOS.',stem,sib),'$(x+3)^2+y^2=9$');
  const own='Sketch the circle $(x+3)^2+y^2=9$.\nThen find its area.';
  assert.equal(bareLikeSiblings(own,stem,sib),own);
});

test('content rules hold back what the audit wrote wrong, and only that (10 November 2026)', async ()=>{
  const {contentRules}=await import('../pedagogy/audit-v2-rules.mjs');
  const doc=text=>({blocks:[{type:'paragraph',inlines:[{type:'text',text}]}]});
  const part=(id,label,prompt)=>({id,type:'part',label,prompt});
  const q=(id,stem,parts,label='')=>({id,type:'question',content:{id:id+'-root',type:'group',label,prompt:stem,children:parts}});
  const book=blocks=>({sections:[{id:'s',blocks}]});
  // 1. Maths as plain text; money, units and maths in $…$ pass.
  const ki=q('v2-ki','',[part('k1','1',doc('For y = k/x the asymptote is [[x = 0]].'))]);
  assert.match(contentRules(book([]),book([ki]),new Set(['v2-ki'])).get('v2-ki'),/plain text/);
  const ok=q('v2-ok','',[part('k1','1',doc('It costs $6 to lay 60 m² of paving.')),part('k2','2',{blocks:[{type:'paragraph',inlines:[{type:'text',text:'For '},{type:'math',latex:'y=k/x'}]}]})]);
  assert.equal(contentRules(book([]),book([ok]),new Set(['v2-ok'])).size,0);
  // 2. A replaced part restating its stem among bare siblings; a context phrase in a new sentence passes.
  const stem='Find the distance between each pair of points without drawing the interval.';
  const live=q('p12-q2',stem,[part('a','a','$(0,0)$ and $(3,4)$'),part('b','b','$(1,1)$ and $(4,5)$'),part('d','d','$(2,2)$ and $(5,6)$')]);
  const bad=structuredClone(live);bad.content.children[2].prompt='Find the distance between $(0,0)$ and $(6,-8)$ without drawing the interval.';
  assert.match(contentRules(book([live]),book([bad]),new Set(['p12-q2'])).get('p12-q2'),/restates its stem/);
  const ctx=q('v2-dots','The difference of two squares can also be used on numbers.',[part('a','a','Evaluate $51^2-49^2$.'),part('c','c','Use the difference of two squares to write $2^8-1$ as a product of three whole numbers.')]);
  assert.equal(contentRules(book([]),book([ctx]),new Set(['v2-dots'])).size,0);
  // Teacher text the audit did not change is never judged.
  const teacher=q('p5','',[part('t','a','Let y = 2x.')]);
  assert.equal(contentRules(book([teacher]),book([structuredClone(teacher)]),new Set(['p5'])).size,0);
  // 3. A one-part shell losing its label; a whole question replaced by one new question passes.
  const shell={id:'vv-block',type:'question',content:{id:'vv-root',type:'group',label:'',children:[part('vv','vv','$x$')]}};
  const swapped={id:'vv-block',type:'question',content:{id:'vv-root',type:'question',label:'',prompt:'Find the values of the pronumerals.'}};
  assert.match(contentRules(book([shell]),book([swapped]),new Set(['vv-block'])).get('vv-block'),/lost its part label vv/);
  // A run relettered after a removal earlier in it keeps a letter, which is not a loss (Circle Geometry 1, "y" now "t").
  const relettered={id:'vv-block',type:'question',content:{id:'vv-root',type:'group',label:'',children:[part('vv','tt','$x$')]}};
  assert.equal(contentRules(book([shell]),book([relettered]),new Set(['vv-block'])).size,0);
  const many=q('p17-q10','Simplify',[part('a','a','$1$'),part('b','b','$2$')],'6'),one={id:'p17-q10',type:'question',content:{id:'p17-q10-root',type:'question',label:'6',prompt:'Simplify $\\frac{4-x^2}{3x-6}$'}};
  assert.equal(contentRules(book([many]),book([one]),new Set(['p17-q10'])).size,0);
  // 4. A repeated long label, or a numbered question, inside a long lettered run.
  const run=['mm','nn','oo'].map(l=>({id:'r-'+l,type:'question',content:{id:'r-'+l+'-root',type:'part',label:l,prompt:'$x$'}}));
  const dup={id:'v2-slot',type:'question',content:{id:'v2-slot-root',type:'part',label:'nn',prompt:'$y$'}};
  assert.match(contentRules(book(run),book([...run,dup]),new Set(['v2-slot'])).get('v2-slot'),/repeats the label nn/);
  const num={id:'v2-num',type:'question',content:{id:'v2-num-root',type:'question',label:'6',prompt:'$y$'}};
  assert.match(contentRules(book(run),book([...run,num]),new Set(['v2-num'])).get('v2-num'),/numbered 6/);
});

test('holdBack turns a change back into a comment and takes out a new question (10 November 2026)', async ()=>{
  const {holdBack}=await import('../pedagogy/audit-v2.mjs');
  const fs=await import('node:fs'),os=await import('node:os'),path=await import('node:path');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'holdback-'));
  const w=(f,v)=>fs.writeFileSync(path.join(dir,f),JSON.stringify(v));const r=f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));
  w('report.json',{applied:{newQuestions:['v2-new']},proposals:{c1:{payloads:[{op:'replace-node',blockId:'p1'}]}}});
  w('candidate-before-auto.json',{sections:[{id:'s',blocks:[{id:'p1'},{id:'v2-new'},{id:'p9'}]}],studio:{flags:[{note:'adds v2-new'}]}});
  assert.deepEqual(holdBack(dir,new Map([['p1','x'],['v2-new','y']]),'it broke a content rule',{all:true}),[]);
  assert.match(r('report.json').proposals.c1.payloads[0].notApplied,/content rule \(x\)/);
  assert.deepEqual(r('candidate-before-auto.json').sections[0].blocks.map(b=>b.id),['p1','p9']);
  assert.deepEqual(r('report.json').applied.newQuestions,[]);
  // A teacher block it cannot hold back: nothing is written.
  const before=fs.readFileSync(path.join(dir,'report.json'),'utf8');
  assert.deepEqual(holdBack(dir,new Map([['p9','z']]),'it broke a content rule',{all:true}).map(x=>x[0]),['p9']);
  assert.equal(fs.readFileSync(path.join(dir,'report.json'),'utf8'),before);
  fs.rmSync(dir,{recursive:true,force:true});
});

// Workflow changes before Stage 6 (11 November 2026).
const ratedQ=async()=>{const {reasoningTaskHash,REASONING_RUBRIC}=await import('../scripts/booklet/reasoning-ratings.mjs'),{difficultyBandForScore}=await import('../src/lib/practice-question-model.js');
 return (id,score,prompt='P '+id)=>{const b=q(id,prompt,'$1$',{classification:{...rating(score),difficulty:difficultyBandForScore(score)}});
  b.classification.assessment={model:'m',assessedAt:'2026-11-09T00:00:00Z',evidence:'e',rubricVersion:REASONING_RUBRIC,taskHash:reasoningTaskHash(b)};return b;};};
test('a printed reference holds only its own exercise, or a same-topic one when it names a question (11 November 2026)', async()=>{
 const {orderCandidate}=await import('../pedagogy/audit-v2.mjs');const v=await ratedQ();
 const ex=(id,topicId,blocks)=>({id,phase:'practice',topicId,title:'Exercise',blocks});
 const project={id:'p',revision:1,topics:[{id:'t1',title:'T1'},{id:'t2',title:'T2'}],sections:[
  ex('s1','t1',[v('a',50),v('x',30,'Use the diagram below.')]),ex('s2','t2',[v('c',40),v('d',10)]),ex('s3','t1',[v('e',40),v('f',10)])]};
 const {project:out,plan}=orderCandidate(structuredClone(project));
 const order=id=>out.sections.find(s=>s.id===id).blocks.map(b=>b.id);
 assert.deepEqual(order('s1'),['a','x'],'the exercise holding the reference stays as it is');
 assert.deepEqual(order('s2'),['d','c']);assert.deepEqual(order('s3'),['f','e'],'"the diagram below" names no question');
 assert.equal(plan.sections.find(s=>s.sectionId==='s2').segments[0].status,'sorted');
 const seg1=plan.sections.find(s=>s.sectionId==='s1').segments[0];assert.equal(seg1.status,'held');assert.ok(seg1.holds.every(h=>h.id==='x'));
 // "the previous question" in the same topic holds its sibling exercise; another topic still sorts.
 const prev=structuredClone(project);prev.sections[0].blocks[1].content.prompt='Use your answer to the previous question.';
 const r=orderCandidate(prev).project;
 assert.deepEqual(r.sections[2].blocks.map(b=>b.id),['e','f']);assert.deepEqual(r.sections[1].blocks.map(b=>b.id),['d','c']);
 // A question another question cites by number is not moved while the renumbering cannot run.
 const cited=structuredClone(project);cited.sections[1].blocks=[v('c',40),v('d',10),v('g',30,'Repeat Question 1 for y.')];
 const {quadrantOnly}=await import('../pedagogy/audit-v2.mjs');
 assert.equal(quadrantOnly('sin is positive, so Q1 and Q2'),true);assert.equal(quadrantOnly(String.raw`\therefore\mathrm{Q4}`),true);
 assert.equal(quadrantOnly('see Q7'),false);assert.equal(quadrantOnly('Question 2, in Q1'),false);
 // A count of questions followed by a sentence is not a question reference.
 const quiz=structuredClone(project);quiz.sections[0].blocks[1].content.prompt='A quiz has 20 multiple-choice questions. 300 students guess. Use the diagram below.';
 assert.deepEqual(orderCandidate(quiz).project.sections[2].blocks.map(b=>b.id),['f','e']);
 const c=orderCandidate(cited);assert.deepEqual(c.project.sections[1].blocks.map(b=>b.id),['c','d','g']);
 assert.ok(c.plan.sections[1].segments[0].holds.some(h=>['reference-renumbering-blocked','before-source-counter-identity-unverified'].includes(h.kind)));
});
test('an unusable type-map link holds a question only without a current audit type check (11 November 2026)', async()=>{
 const {unusableMapHolds,holdComments}=await import('../pedagogy/audit-v2.mjs');
 const holds=[{id:'a',kind:'review-context-unverified',reason:'review project differs'},{id:'b',kind:'review-context-unverified',reason:'Recorded review snapshot absent'},{id:'c',kind:'review-context-unverified',reason:'reviewed question changed or absent'},{id:'d',kind:'rating-unverified'}];
 assert.deepEqual(unusableMapHolds(holds,new Set(['a','b','c'])).map(h=>h.id),['c','d'],'a changed question still holds; checked map links do not');
 const left=unusableMapHolds(holds,new Set());
 assert.deepEqual(left.map(h=>h.kind),['review-map-other-booklet','review-map-snapshot-missing','review-context-unverified','rating-unverified']);
 const [cm]=holdComments({sections:[{sectionId:'s',segments:[{status:'held',originalIds:['a','z'],holds:[left[0]]}]}]},{});
 assert.match(cm.note,/belongs to another booklet/);
});
test('greys and pure hues in audit-made figures become house colours; label text is left alone (11 November 2026)', async()=>{
 const {houseTints}=await import('../pedagogy/audit-v2.mjs');
 const code=String.raw`\begin{tikzpicture}
\draw[gray!45, thick] (0,0)--(1,0);
\draw[draw=blue,fill=red!20] (0,0) circle (1);
\node[text=black] at (0,0) {red ball};
\node at (1,1) {\color{red}$x$};
\end{tikzpicture}`;
 const p={sections:[{blocks:[{id:'v2-a',content:{questionDiagrams:[{format:'tikz',code}]}}]}]};
 houseTints(p);const out=p.sections[0].blocks[0].content.questionDiagrams[0].code;
 assert.match(out,/\\draw\[housegrid, thick\]/);assert.match(out,/draw=houseblue,fill=houseredFill/);
 assert.match(out,/\{red ball\}/,'label text keeps its words');assert.match(out,/text=black/,'black stays black');
 assert.match(out,/\\color\{housered\}/);assert.match(out,/\\definecolor\{houseblue\}\{HTML\}\{268CFF\}/);assert.match(out,/\\definecolor\{housegrid\}\{HTML\}\{CCCCCC\}/);
});
test('an applied change confirmed in the candidate is saved resolved; one not found or partly applied stays open (11 November 2026)', async()=>{
 const {settleAppliedComments,COMMENT_KIND}=await import('../pedagogy/audit-v2.mjs');
 const flag=(id,targetId,extra={})=>({id,kind:COMMENT_KIND,targetId,note:'[Pedagogy audit v2 · Applied automatically · x] y',autoApplied:{at:'t',what:'Added.'},...extra});
 const candidate={sections:[{id:'s',blocks:[q('a','Find x.','$1$'),q('v2-new','Solve the new equation for the variable.','$2$')]}],studio:{flags:[flag('f1','a'),flag('f2','a'),flag('f3','a'),flag('f4','gone'),flag('f5','a',{note:'Not applied automatically: x'})]}};
 const proposals={f1:{payloads:[{op:'insert',block:{id:'v2-new'},applied:true,autoApply:true}]},f2:{payloads:[{op:'insert',block:{id:'v2-missing',content:{prompt:'Completely different words entirely here'}},applied:true,autoApply:true}]},f3:{payloads:[{op:'insert',block:{id:'v2-new'},applied:true,autoApply:true},{op:'insert',block:{id:'v2-other'},autoApply:true}]}};
 const r=settleAppliedComments(candidate,proposals,{at:'now'});
 assert.deepEqual(r.resolved,['f1']);assert.deepEqual(r.left.map(x=>x.id).sort(),['f2','f3','f4','f5']);
 assert.equal(candidate.studio.flags[0].resolved,true);assert.match(candidate.studio.flags[0].resolution,/confirmed in the saved booklet/);
});
test('a new count question is taken out before saving when its type has enough without it, unless it bridges a jump (11 November 2026)', async()=>{
 const {surplusCountQuestions}=await import('../pedagogy/audit-v2.mjs');const v=await ratedQ();
 const slot=b=>{b.sourceReview={origin:{generatedBy:'pedagogy-audit-v2'},generation:{kind:'slot',slot:{reason:'type-count'}}};return b;};
 const extra=slot(v('v2-c',22)),bridge=slot(v('v2-d',40));
 const project={id:'p',topics:[{id:'t',title:'T'}],sections:[{id:'s',phase:'practice',topicId:'t',title:'Exercise',blocks:[v('a',20),v('b',21),extra,v('c',23),bridge,v('e',52)]}]};
 const types=new Map(['a','b','c','v2-c','v2-d','e'].map(id=>[id,{type:'x',current:true}]));
 const state={project,progressions:[],types};
 const out=surplusCountQuestions(project,state,{types:[{type:'x',topicId:'t',taught:true,role:'core'}],exampleMatches:[],spread:[]},[extra,bridge]);
 assert.deepEqual(out,['v2-c'],'three items without it; the 40 bridges 23 to 52');
 assert.deepEqual(project.sections[0].blocks.map(b=>b.id),['a','b','c','v2-d','e']);
});
test('worked examples and guided practice give their final answers for a blind solve (11 November 2026)', async()=>{
 const {teachingAnswers}=await import('../pedagogy/audit-v2.mjs');
 const doc=text=>({format:'maths-editor-document-v1',version:1,blocks:[{id:'x',type:'paragraph',inlines:[{type:'math',latex:text,display:true}]}]});
 const we={id:'w',type:'worked-example',pedagogyRole:'example',examples:[{id:'e1',prompt:doc('\\frac{5x}{13}+\\frac{3x}{13}'),theorySolution:doc('=\\frac{5x+3x}{13}=\\frac{8x}{13}')},{id:'e2',prompt:doc('Show it'),theorySolution:doc('=\\mathrm{RHS}')}]};
 const t=teachingAnswers(we);
 assert.deepEqual(t.map(x=>x.nodeId),['e1','e2']);assert.match(t[0].answer,/=\\frac\{5x\+3x\}\{13\}=\\frac\{8x\}\{13\}/,'the whole worked solution, not its last line');
 const g={id:'g',type:'question',pedagogyRole:'guided-practice',content:{id:'g-root',type:'group',children:[{id:'ga',type:'part',prompt:'a',answer:{short:'$3x$',worked:'x'}}]}};
 assert.deepEqual(teachingAnswers(g),[{nodeId:'ga',answer:'$3x$\nWorking: x'}]);
});
test('a passage with no editable text or an annotated equation is comment-only; others give their line count (11 November 2026)', async()=>{
 const {theoryEditable}=await import('../pedagogy/audit-v2-apply.mjs');
 const docOf=blocks=>({format:'maths-editor-document-v1',version:1,blocks});
 assert.equal(theoryEditable({id:'a',type:'image'}).rewritable,false);
 assert.equal(theoryEditable({id:'b',type:'theory',content:docOf([{id:'e',type:'annotated-equation'}])}).rewritable,false);
 const ok=theoryEditable({id:'c',type:'theory',content:docOf([{id:'p1',type:'paragraph',inlines:[{type:'text',text:'One.'}]},{id:'p2',type:'paragraph',inlines:[{type:'text',text:'Two.'}]}])});
 assert.equal(ok.rewritable,true);assert.equal(ok.lines,2);
});
test('an audit keep run split by an earlier sort is put back together, never across a heading (11 November 2026)', async()=>{
 const {gatherKeepRuns}=await import('../pedagogy/audit-v2.mjs');
 const p={sections:[{id:'s',blocks:[q('a','A','1'),q('k1','K1','1'),q('b','B','1'),q('c','C','1'),q('k2','K2','1'),q('d','D','1')]}]};
 const r=gatherKeepRuns(p,[{ids:['k1','k2']}]);
 assert.deepEqual(r.project.sections[0].blocks.map(b=>b.id),['a','k1','k2','b','c','d']);assert.equal(r.gathered.length,1);
 assert.deepEqual(p.sections[0].blocks.map(b=>b.id),['a','k1','b','c','k2','d'],'the input is not changed');
 const h=structuredClone(p);h.sections[0].blocks.splice(2,0,{id:'h',type:'heading'});
 assert.equal(gatherKeepRuns(h,[{ids:['k1','k2']}]).gathered.length,0);
});
test('the retrofit lists each re-sorted exercise and corrects hold resolutions that blamed a type check (11 November 2026)', async()=>{
 const {retrofitExtras,COMMENT_KIND}=await import('../pedagogy/audit-v2.mjs');
 const project={id:'p',sections:[{id:'s',title:'Exercise 1',blocks:[q('a','A','1'),q('b','B','1')]}]};
 const candidate=structuredClone(project);candidate.sections[0].blocks.reverse();
 candidate.studio={flags:[{id:'f',kind:COMMENT_KIND,findingKind:'ordering-hold',resolved:true,resolution:'Teacher order kept, because a changed question has not had its type re-checked.',note:'[Pedagogy audit v2 · Ordering hold] These questions were left in their current order instead of being sorted by difficulty: a, b. Hold: printed-reference. Held by: "previous question" in x (outside this exercise). What would release it: y.'}]};
 const plan={sections:[{sectionId:'s',segments:[{originalIds:['a','b'],proposedIds:['b','a'],status:'sorted',changed:true,holds:[]}]}]};
 const x=retrofitExtras(project,candidate,plan,{root:'C:/nonexistent'});
 assert.deepEqual(x.order,[{sectionId:'s',title:'Exercise 1',from:['a','b'],to:['b','a']}]);
 assert.match(x.comments[0].note,/Exercise 1: was a, b; now b, a/);
 assert.match(candidate.studio.flags[0].resolution,/Corrected 11 November 2026: the hold came from "previous question" in x \(outside this exercise\), not from a question type left unchecked; it is now sorted\./);
});
test('a teaching check id returned without its prefix is recovered, and a missing check never blocks the call', ()=>{
 const items=[{id:'w-p5-guided',kind:'check'},{id:'w-v2-example-j3',kind:'check'},{id:'w-v2-q1',kind:'check'},{id:'slot-1',kind:'new'}];
 const r=validateSolve({solutions:[{id:'w-p5-guided',answers:[]},{id:'v2-example-j3-1',answers:[{nodeId:'a',answer:'4'}]},{id:'slot-1',answers:[]}]},items);
 assert.equal(r.solutions.get('w-v2-example-j3').answers[0].answer,'4');
 assert.equal(r.solutions.has('w-v2-q1'),false);
 assert.throws(()=>validateSolve({solutions:[{id:'w-p5-guided'}]},items),/no solution for slot-1/);
});
test('a pound sign in an audit-made figure is written GBP, which the TikZ compiler can render', async ()=>{
 const {houseTints}=await import('../pedagogy/audit-v2.mjs');
 const fig={format:'tikz',code:'\\begin{tikzpicture}\n\\node at (0,0) {British pounds (\\pounds)};\n\\node at (1,0) {\\pounds 5 and £20};\n\\end{tikzpicture}'};
 const teacher={format:'tikz',code:'\\node {\\pounds};'};
 houseTints({sections:[{blocks:[{id:'v2-x',content:{questionDiagrams:[fig]}},{id:'p1',content:{questionDiagrams:[teacher]}}]}]});
 assert.match(fig.code,/British pounds \(GBP\)/);assert.match(fig.code,/GBP 5 and GBP 20/);assert.equal(teacher.code,'\\node {\\pounds};');
});

test('a prerequisite only Challenge or Exam questions need is not an opening review item (James, 11 November 2026)', ()=>{
 const review=(id,extra={})=>({...q(id,'Expand $(x-4)^2$.','$x^2-8x+16$'),pedagogyRole:'review',sourceReview:{origin:{generatedBy:'pedagogy-audit-v2'},generation:{kind:'prerequisites'},addition:{comment:'f1',...extra}}});
 const project={id:'p',settings:{cover:{course:'Mathematics Extension 1 Year 11'}},topics:[{id:'t',title:'T'},{id:'challenge',title:'Challenge'}],studio:{flags:[{id:'f1',targetId:'hard'},{id:'f2',targetId:'easy'}]},sections:[
  {id:'teach',phase:'teaching',topicId:'t',title:'T',blocks:[review('r1'),review('r2',{comment:'f2'}),review('r3',{neededBy:['easy','hard']}),{...review('r4'),sourceReview:{origin:{generatedBy:'feedback-repair'},generation:{kind:'prerequisites'},addition:{comment:'f1'}}}]},
  {id:'ex',phase:'practice',topicId:'t',title:'Exercise',blocks:[q('easy','Easy','$1$')]},
  {id:'ch',phase:'practice',role:'challenge',topicId:'challenge',title:'Challenge exercise',blocks:[q('hard','Hard','$1$')]}]};
 assert.match(prerequisiteNotNeeded(project,['hard']),/hard \(Challenge\)/);
 assert.match(prerequisiteNotNeeded(project,['gone']),/no longer in the booklet/);
 assert.equal(prerequisiteNotNeeded(project,['hard','easy']),null);
 assert.equal(prerequisiteNotNeeded(project,[]),null);
 // r1 serves only the Challenge question (via its comment); r3 also serves a routine one; r4 is a teacher-approved repair.
 assert.deepEqual(unneededReviewItems(project).map(r=>r.id),['r1']);
 assert.equal(bookletCourse(project),'Mathematics Extension 1 Year 11');
 assert.equal(bookletCourse({library:{courseId:'s6-ext1-11'}}),'s6-ext1-11');
 assert.match(auditContract({}),/never a skill only Challenge or Exam questions need/);
 assert.match(auditContract({}),/an assumed prerequisite is no finding/);
 assert.match(challengeContract(),/Reject a prerequisite that students in this course/);
});

test('additions for questions on their way to Challenge are not made, and are withdrawn when the questions move (James, 11 November 2026)', ()=>{
 const added=(id,neededBy,type='question')=>({...q(id,'Added','$1$'),type,sourceReview:{origin:{generatedBy:'pedagogy-audit-v2'},addition:{comment:'c',neededBy}}});
 const exam={...q('x','HSC question','$1$'),title:'2021 HSC Extension 1 Band 4'};
 const project={id:'p',topics:[{id:'t',title:'T'},{id:'challenge',title:'Challenge'}],sections:[
  {id:'teach',phase:'teaching',topicId:'t',title:'T',blocks:[added('we',['hard'],'worked-example')]},
  {id:'ex',phase:'practice',topicId:'t',title:'Exercise',blocks:[q('easy','Easy','$1$'),q('rated','Rated 62 in this run','$1$'),added('bridge',['hard']),added('lead',['x']),added('kept',['easy','hard'])]},
  {id:'exam',phase:'practice',role:'exam',topicId:'t',title:'Exam questions',blocks:[exam]},
  {id:'ch',phase:'practice',role:'challenge',topicId:'challenge',title:'Challenge exercise',blocks:[q('hard','Hard','$1$')]}]};
 // A question rated 60 or more in this run waits for James on its way to Challenge: nothing is added for it.
 assert.match(additionNotNeeded(project,['rated'],{pending:new Set(['rated'])}),/on its way to Challenge/);
 assert.equal(additionNotNeeded(project,['rated']),null);
 // Exam questions still count for bridges, extensions, variations and new teaching; not for review items.
 assert.equal(additionNotNeeded(project,['x']),null);
 assert.match(prerequisiteNotNeeded(project,['x']),/Exam/);
 // Withdrawal covers new teaching and added questions whose questions are all in Challenge.
 assert.deepEqual(unneededReviewItems(project).map(r=>[r.id,r.kind]),[['we','teaching'],['bridge','question']]);
});

test('a confirmed move to a later lesson takes routine questions to that lesson\'s exercise', ()=>{
 const project={id:'p',topics:[{id:'a',title:'A'},{id:'b',title:'B'}],sections:[
  {id:'ex-a',phase:'practice',topicId:'a',title:'Exercise',blocks:[q('a1','A1','$1$'),q('a2','A2 needs lesson B','$1$')]},
  {id:'ex-b',phase:'practice',topicId:'b',title:'Exercise',blocks:[q('b1','B1','$1$')]}]};
 const {target,moved}=relocateQuestions(project,{toTopicId:'b',ids:['a2']});
 assert.equal(target.id,'ex-b');assert.deepEqual(moved,[{id:'a2',from:'ex-a'}]);
 assert.deepEqual(project.sections.map(s=>s.blocks.map(b=>b.id)),[['a1'],['b1','a2']]);
 assert.equal(relocateQuestions(project,{toTopicId:'none',ids:['a1']}).target,null);
});

test('a draft request left out of a good reply is dropped, not a blocker (Optimisation 2B slot-6, 11 November 2026)', () => {
 const good={drafts:[{requestId:'slot-1',content:{prompt:'x'}}],blocked:[]};
 const {drafts,blocked}=validateDrafts(good,['slot-1','slot-6']);
 assert.equal(drafts.length,1);
 assert.deepEqual(blocked.map(b=>b.requestId),['slot-6']);
 assert.throws(()=>validateDrafts({drafts:[],blocked:[]},['slot-1']),/no draft for slot-1/);
 // Every request declined is a valid reply (Introduction to Differentiation 2B, 11 November 2026).
 assert.deepEqual(validateDrafts({drafts:[],blocked:[{requestId:'slot-1',reason:'r'}]},['slot-1']).blocked.map(b=>b.requestId),['slot-1']);
 assert.throws(()=>validateDrafts({drafts:[{requestId:'slot-9',content:{}}]},['slot-1']),/bad draft slot-9/);
});

test('a pair left out of a good equivalence reply counts as not equivalent, not a blocker (Piecewise-defined Functions, 11 November 2026)', () => {
 const rows=validateEquivalence({pairs:[{id:'a',equivalent:true}]},['a','slot-2-upper#0']);
 assert.equal(rows.get('a').equivalent,true);
 assert.equal(rows.get('slot-2-upper#0').equivalent,false);
 assert.throws(()=>validateEquivalence({pairs:[]},['a']),/missing a/);
});

test('a new question carries a real skill: an invented id falls back to the skill beside the slot',()=>{
 const q=(id,skill,extra={})=>({id,type:'question',classification:{primarySkillId:skill},content:{},...extra});
 const project={id:'p',sections:[{id:'s',blocks:[q('a','order-large-numbers'),q('b','name-millions-place-value'),q('c','order-large-numbers')]}]};
 const slot={id:'slot-1',sectionId:'s',after:'b'};
 assert.equal(resolveSkill(project,slot,'order-large-numbers',null,null),'order-large-numbers');
 assert.equal(resolveSkill(project,slot,'surd-laws',null,null),'name-millions-place-value');
 assert.equal(resolveSkill(project,{...slot,after:null},'surd-laws',null,null),'order-large-numbers');
 assert.equal(resolveSkill(project,slot,undefined,'t',id=>id==='c'?'t':'u'),'order-large-numbers');
 assert.deepEqual(bookletSkillIds(project),['order-large-numbers','name-millions-place-value']);
 const block=newBlock({content:{type:'question',prompt:'x'},skill:'surd-laws'},slot,{project,score:null});
 assert.equal(block.classification.primarySkillId,'name-millions-place-value');
});
