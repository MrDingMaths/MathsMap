// Import v2 layout preflight (docs/booklet-import-v2-ch01-efficiency.md, changes 1 and 2).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {printedPracticeHeadings,applyLayoutPreflightFixes,layoutPreflightBlockers,renderRiskTargets,targetedRenderCheck,wrapBareDisplays} from '../scripts/booklet/import-layout-preflight.mjs';
import {finishImport,finishPreRenderGate,applyFinishPreflightFixes} from '../scripts/booklet/import-finish.mjs';
import {contentHash,saveReviewed} from '../scripts/booklet/lean-review.mjs';
import {reasoningTaskHash} from '../scripts/booklet/reasoning-ratings.mjs';
import {assessCompletion,COMPLETION_PROFILE,IMPORT_POLICY} from '../scripts/booklet/import-completion.mjs';
import {sampleSourceKey} from '../scripts/booklet/import-sample-review.mjs';

const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value));};
const tmp=t=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'layout-preflight-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;};
const question=(id,page,category,extra={})=>({id,type:'question',sourceRefs:[{pageNumber:page}],sourceReview:{sourceIdentity:{category}},content:{id:id+'-root',type:'question',prompt:'Simplify.',children:[{id:id+'-a',type:'part',label:'a',prompt:'$x+x$',answer:{short:'$2x$',worked:'$2x$'}}]},...extra});
const project=()=>({id:'p',title:'T',settings:{},sections:[
 {id:'e1',phase:'practice',blocks:[question('q1',2,'Fundamentals'),question('q2',2,'Numbered practice'),question('q3',3,'Challenge Problems')]},
 {id:'e2',phase:'practice',blocks:[question('q4',4,'Fundamentals'),question('q5',4,'Fundamentals')]},
]});
const inventories=[
 {pageNumber:2,groups:[{id:'g1',kind:'exercise',header:'Exercise 1A'},{id:'g2',kind:'fundamentals',header:'Fundamentals'},{id:'g3',kind:'practice subheading',header:'Fundamentals 1'}]},
 {pageNumber:3,groups:[{id:'g4',kind:'practice',header:'Challenge Problems'},{id:'g5',kind:'practice',header:'1E Solving quadratic equations'}]},
 {pageNumber:4,groups:[{id:'g6',kind:'practice category',header:'Fundamentals'}]},
];

test('printed headings come from inventory group headers, never titles, running headers or numbered subheadings',()=>{
 assert.deepEqual(printedPracticeHeadings(inventories).map(h=>h.page+':'+h.header),['2:Fundamentals','3:Challenge Problems','4:Fundamentals']);
 const noisy=[{pageNumber:5,groups:[{kind:'practice',header:'[Recursions]'},{kind:'practice',header:'No category header printed on this page.'},{kind:'practice',header:'Review'}]}];
 assert.deepEqual(printedPracticeHeadings(noisy).map(h=>h.header),['Review'],'subtitles and inventory sentences are not headings');
});

test('heading and worked exercise-start fixes touch neither the review hash nor the rating task hash',()=>{
 const before=project(),{project:after,changes}=applyLayoutPreflightFixes(before,{headings:printedPracticeHeadings(inventories)});
 const blocks=p=>new Map(p.sections.flatMap(s=>s.blocks).map(b=>[b.id,b]));const a=blocks(after),b=blocks(before);
 assert.equal(a.get('q1').flow.practiceCategoryHeading,'Fundamentals');
 assert.equal(a.get('q3').flow.practiceCategoryHeading,'Challenge Problems');
 assert.equal(a.get('q4').flow.practiceCategoryHeading,'Fundamentals');
 assert.equal(a.get('q2').flow?.practiceCategoryHeading,undefined,'an author-invented category never becomes a printed heading');
 assert.equal(a.get('q5').flow?.practiceCategoryHeading,undefined,'only the first block of a group owns its heading');
 assert.equal(a.get('q4').flow.workedPageBreakBefore,true);assert.equal(a.get('q1').flow.workedPageBreakBefore,undefined);
 for(const id of a.keys()){assert.equal(contentHash(a.get(id)),contentHash(b.get(id)));assert.equal(reasoningTaskHash(a.get(id)),reasoningTaskHash(b.get(id)));}
 assert.equal(changes.filter(c=>c.check==='C1-heading').length,3);
 assert.equal(applyLayoutPreflightFixes(after,{headings:printedPracticeHeadings(inventories)}).changes.length,0,'idempotent');
 assert.notEqual(before.sections[0].blocks[0].flow?.practiceCategoryHeading,'Fundamentals','input is not mutated');
});

test('a heading already typed in the prompt is not repeated',()=>{
 const p=project();p.sections[0].blocks[0].content.prompt='**Fundamentals**\n\nSimplify.';
 const {project:after}=applyLayoutPreflightFixes(p,{headings:printedPracticeHeadings(inventories)});
 assert.equal(after.sections[0].blocks[0].flow?.practiceCategoryHeading,undefined);
});

test('one-letter text cues and maths cues ending in = are joined to their blank; other cues are left alone',()=>{
 const p=project(),part=p.sections[0].blocks[0].content.children[0];
 part.prompt={format:'maths-editor-document-v1',version:1,blocks:[{id:'para',type:'paragraph',inlines:[
  {type:'text',text:'The sum of the roots is the s'},{type:'cloze',answer:'um',width:20},
  {type:'text',text:' and the product '},{type:'cloze',answer:'p',width:20},
  {type:'math',latex:'x='},{type:'cloze',answer:'1',width:20}]}]};
 const {project:after,changes}=applyLayoutPreflightFixes(p);
 const inl=after.sections[0].blocks[0].content.children[0].prompt.blocks[0].inlines;
 assert.equal(inl[1].joinPrevious,true);assert.equal(inl[3].joinPrevious,undefined);assert.equal(inl[5].joinPrevious,true,'an inline maths cue ending in = joins its blank');
 assert.equal(changes.filter(c=>c.check==='C2-cue-blank').length,2);
});

test('a declared dependency whose wording points at another question needs a recorded decision',()=>{
 const p=project(),q=p.sections[0].blocks[2];
 q.flow={dependsOn:['q1']};q.content.children[0].prompt='Confirm your hypothesis from part (c) of the preceding investigation.';
 assert.deepEqual(layoutPreflightBlockers(p).map(b=>b.blockId),['q3']);
 q.sourceReview.bankDependencyReview={decision:'self-contained',note:'Part (a) restates the recurrence.'};
 assert.deepEqual(layoutPreflightBlockers(p),[]);
 const free=project();free.sections[0].blocks[2].content.children[0].prompt='Use the previous question.';
 assert.deepEqual(layoutPreflightBlockers(free),[],'wording alone, with no declared dependency, is left to the content review');
});

test('render targets: wide grids of long maths, plus repaired blocks',()=>{
 const p=project(),q=p.sections[1].blocks[0];
 q.content.layout='grid';q.content.columns=3;q.content.children[0].prompt='$(x+a)(x+b)(x+c)=x^3+px^2+qx+r$';
 assert.deepEqual(renderRiskTargets(p,{changed:['q2']}).sort(),['q2','q4']);
 q.content.columns=2;assert.deepEqual(renderRiskTargets(p),[]);
});

test('targeted render runs each edition, drops targets an edition lacks, and collects DOM and printed issues',async t=>{
 const out=tmp(t),calls=[];
 const run=async args=>{
  const edition=args[args.indexOf('--editions')+1],ids=args[args.indexOf('--target-blocks')+1],dir=args[args.indexOf('--out')+1];calls.push(edition+':'+ids);
  if(edition==='short'&&ids.includes('q9'))return {code:1,output:'Error: Target blocks missing from short: q9'};
  if(edition==='worked'){write(path.join(dir,'development-report.json'),{report:{p:{worked:{selectedPages:[53,54],issues:[{page:54,kind:'footer-overflow',excessMm:2.53}],printed:[{issues:[]},{issues:[{kind:'pdf-footer-clearance'}]}]}}}});return {code:1,output:'AssertionError'};}
  if(edition==='student')return {code:1,output:'connect ECONNREFUSED 127.0.0.1:5173'};
  write(path.join(dir,'development-report.json'),{report:{p:{[edition]:{issues:[],printed:[{issues:[]}]}}}});return {code:0,output:''};
 };
 const result=await targetedRenderCheck({file:'c.json',projectId:'p',targets:['q1','q9'],out,run});
 assert.deepEqual(calls,['student:q1,q9','short:q1,q9','short:q1','worked:q1,q9']);
 assert.deepEqual(result.issues,[{edition:'worked',page:54,kind:'footer-overflow',excessMm:2.53},{edition:'worked',printed:true,kind:'pdf-footer-clearance',page:54}]);
 assert.equal(result.skipped.length,1);assert.equal(result.skipped[0].edition,'student');
});

test('pre-render gate: blockers first, repaired blocks targeted, clean results remembered',async t=>{
 const dir=tmp(t),file=path.join(dir,'candidate.json'),p=project();write(file,p);
 const state={steps:{},exports:[{blockStamps:{q1:'a',q2:'b',q3:'c',q4:'d',q5:'e'}}]},stamps={q1:'a',q2:'B',q3:'c',q4:'d',q5:'e'};
 const seen=[];const render=async({targets})=>{seen.push(targets);return {issues:[],skipped:[],seconds:1,targets};};
 const first=await finishPreRenderGate({file,projectId:'p',state,stamps,workDir:dir,render});
 assert.deepEqual(first.errors,[]);assert.deepEqual(seen,[['q2']]);
 await finishPreRenderGate({file,projectId:'p',state,stamps,workDir:dir,render});assert.equal(seen.length,1,'unchanged candidate is not rendered again');
 const failing=async({targets})=>({issues:[{edition:'worked',page:54,kind:'footer-overflow',targetId:'q2',excessMm:2.53}],skipped:[],seconds:1,targets});
 p.title='changed';write(file,p);
 const second=await finishPreRenderGate({file,projectId:'p',state,stamps,workDir:dir,render:failing});
 assert.match(second.errors[0],/worked p54: footer-overflow q2 \(2\.5 mm\)/);
 p.sections[0].blocks[2].flow={dependsOn:['q1']};p.sections[0].blocks[2].content.children[0].prompt='Use Question 1(c).';write(file,p);
 const blocked=await finishPreRenderGate({file,projectId:'p',state,stamps,workDir:dir,render});
 assert.match(blocked.errors[0],/Cross-question reference in q3/);
});

test('finish fixes are written once with their evidence file',t=>{
 const dir=tmp(t),file=path.join(dir,'candidate.json');write(file,project());
 const result=applyFinishPreflightFixes({file,runDir:dir,manifest:{},inventories});
 assert.equal(result.counts['C1-heading'],3);
 const saved=JSON.parse(fs.readFileSync(path.join(dir,'lean-review','finish','preflight-fixes.json'),'utf8'));
 assert.equal(saved.changes.length,4);assert.equal(JSON.parse(fs.readFileSync(file,'utf8')).sections[1].blocks[0].flow.practiceCategoryHeading,'Fundamentals');
});

test('v2 finish applies fixes at preparation and prints nothing while the pre-render gate fails',async t=>{
 const runDir=tmp(t),p=project(),projectFile=path.join(runDir,'input.json'),manifest={id:'run',completionProfile:COMPLETION_PROFILE,importPolicy:IMPORT_POLICY,track:'textbook',source:{pdfHash:'s'}};
 write(projectFile,p);write(path.join(runDir,'manifest.json'),manifest);
 const questions=Object.fromEntries(p.sections.flatMap(s=>s.blocks).map(b=>[b.id,{hash:contentHash(b),outcome:'passed'}]));
 saveReviewed(path.join(runDir,'lean-review'),{questions,pages:{},workflow:{p:{sample:{accepted:true,sourceKey:sampleSourceKey(manifest)}}}});
 let fixes=0,exports=0,gate={errors:['Targeted render, worked p54: footer-overflow']};
 const deps={prepare:async()=>{},preflightFixes:()=>{fixes++;return {counts:{}};},labels:async()=>({checked:{},collisions:[]}),layout:async()=>{},validate:()=>({ok:true,blockers:[]}),content:async()=>({}),images:async()=>({errors:[]}),
  preRender:async()=>gate,shading:async()=>({errors:[]}),export:async({out})=>{exports++;write(path.join(out,'report.json'),{report:{p:{}}});},visual:async()=>{},status:async()=>({deliverable:true,completion:assessCompletion()}),writeHandoff:()=>{}};
 const blocked=await finishImport({runDir,projectFile},deps);
 assert.equal(blocked.deliverable,false);assert.equal(exports,0);assert.match(blocked.completion.blockers.join(' '),/footer-overflow/);
 gate={errors:[]};
 const passed=await finishImport({runDir,projectFile},deps);
 assert.equal(exports,1);assert.equal(fixes,1,'fixes run once, with preparation');assert.equal(passed.deliverable,true);
});

test('Ch 2 pilot: heading by group members, quote-mark cues, bare displays wrapped',()=>{
 const p=project();p.sections[1].blocks.push(question('p17-p1',17,undefined),question('p17-p2',17,undefined));
 const inv=[{pageNumber:17,groups:[{id:'g',kind:'challenge-problems',header:'Challenge Problems',entries:['p17-p1','p17-p2']}]}];
 const part=p.sections[0].blocks[0].content.children[0];
 part.prompt={format:'maths-editor-document-v1',version:1,blocks:[{id:'para',type:'paragraph',inlines:[{type:'text',text:'of the ‘o'},{type:'cloze',answer:'utside',width:20},{type:'text',text:' and ab'},{type:'cloze',answer:'c',width:9}]}]};
 part.answer.worked=String.raw`Must be nonzero:`+'\n'+String.raw`\begin{align*}x+1&\ne0\\x&\ne-1\end{align*}`+'\n'+String.raw`Already $$\begin{align*}a&=b\end{align*}$$ and $x$.`;
 const {project:after,changes}=applyLayoutPreflightFixes(p,{headings:printedPracticeHeadings(inv)});
 const blocks=new Map(after.sections.flatMap(s=>s.blocks).map(b=>[b.id,b]));
 assert.equal(blocks.get('p17-p1').flow.practiceCategoryHeading,'Challenge Problems');
 assert.equal(blocks.get('p17-p2').flow?.practiceCategoryHeading,undefined);
 const inl=blocks.get('q1').content.children[0].prompt.blocks[0].inlines;
 assert.equal(inl[1].joinPrevious,true,'an initial after a quote mark is a cue');assert.equal(inl[3].joinPrevious,undefined,'a letter inside a word is not');
 const worked=blocks.get('q1').content.children[0].answer.worked;
 assert.equal(worked,String.raw`Must be nonzero:`+'\n'+String.raw`$$\begin{align*}x+1&\ne0\\x&\ne-1\end{align*}$$`+'\n'+String.raw`Already $$\begin{align*}a&=b\end{align*}$$ and $x$.`);
 assert.equal(changes.filter(c=>c.check==='C7-bare-display').length,1);
 assert.equal(wrapBareDisplays('No display $x$ here.'),null);
});

test('pre-render gate always renders at least one block so the whole-edition DOM pass runs',async t=>{
 const dir=tmp(t),file=path.join(dir,'candidate.json');write(file,project());
 const seen=[];await finishPreRenderGate({file,projectId:'p',state:{steps:{},exports:[]},stamps:null,workDir:dir,render:async({targets})=>{seen.push(targets);return {issues:[],skipped:[],seconds:0,targets};}});
 assert.deepEqual(seen,[['q1']]);
});
