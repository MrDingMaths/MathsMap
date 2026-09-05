import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createEditableProject } from '../src/lib/editable-booklet-model.js';
import { studioProject, approveTarget, approvalCurrent, reconcileApprovals, proposalForFields, addProposal, decideProposal, splitTheoryProposal, mergeTheoryProposal, splitQuestionPartsProposal, mergeQuestionPartsProposal, publicationBlockers } from '../src/lib/booklet-review-model.js';
import { assembleBooklet, defaultRecipe, coverageMatrix } from '../src/lib/booklet-assembly.js';
import { normaliseQuestion, allNodes, validateQuestion } from '../src/lib/practice-question-model.js';
import { createGapProposal } from '../scripts/booklet/studio-proposals.mjs';
import { candidatesFromProject } from '../src/lib/booklet-assembly.js';
import { recordMetric, workflowMeasurement } from '../src/lib/booklet-metrics.js';
import { fromSource, documentHtml } from '../src/lib/document-content.js';
import { createBookletProject, saveBookletProject } from '../scripts/booklet/project-studio-server.mjs';
const base=()=>studioProject(createEditableProject({id:'review',title:'Review',sections:[{id:'s',title:'A',blocks:[{id:'a',type:'rich-text',content:'First atom.\n\nSecond atom.'},{id:'b',type:'rich-text',content:'Other content.'}]}]}));
test('layout changes retain content approval; content edits invalidate downstream review',()=>{
 let p=base();for(const kind of ['content','mapping','sequence','layout'])p=approveTarget(p,'a',kind);
 const layout=structuredClone(p);layout.sections[0].blocks[0].presentation={columns:2};const changed=reconcileApprovals(p,layout);
 assert.equal(approvalCurrent(changed,'a','content'),true);assert.equal(approvalCurrent(changed,'a','layout'),false);
 const content=structuredClone(p);content.sections[0].blocks[0].content='Changed';const revised=reconcileApprovals(p,content);
 for(const kind of ['content','mapping','sequence','layout'])assert.equal(approvalCurrent(revised,'a',kind),false);
});
test('linked proposals are atomic and conflicts preserve saved edits',()=>{
 let p=base();const proposal=proposalForFields(p,[{targetId:'a',path:'/content',after:'New A',groupId:'pair'},{targetId:'b',path:'/content',after:'New B',groupId:'pair'}]);p=addProposal(p,proposal);
 p.sections[0].blocks[1].content='Manual B';assert.throws(()=>decideProposal(p,proposal.id,[proposal.operations[0].id]),/conflicts/);assert.equal(p.sections[0].blocks[0].content,'First atom.\n\nSecond atom.');
});
test('batch undo preserves unrelated later edits and refuses overlap',()=>{
 let p=base();const proposal=proposalForFields(p,[{targetId:'a',path:'/content',after:'New'}]);p=addProposal(p,proposal);p=decideProposal(p,proposal.id,[proposal.operations[0].id]);p.sections[0].blocks[1].content='Later edit';
 const undone=decideProposal(p,proposal.id,[proposal.operations[0].id],'undo');assert.equal(undone.sections[0].blocks[1].content,'Later edit');assert.equal(undone.sections[0].blocks[0].content,'First atom.\n\nSecond atom.');
 p.sections[0].blocks[0].content='Overlapping later edit';assert.throws(()=>decideProposal(p,proposal.id,[proposal.operations[0].id],'undo'),/conflicts/);
});
test('theory split and merge retain content and source lineage',()=>{
 let p=base();const split=splitTheoryProposal(p,'a');p=decideProposal(addProposal(p,split),split.id,[split.operations[0].id]);assert.equal(p.sections[0].blocks.length,3);
 const first=p.sections[0].blocks[0].id;assert.deepEqual(p.studio.lineage[first].sourceIds,['a']);const merge=mergeTheoryProposal(p,first);p=decideProposal(addProposal(p,merge),merge.id,[merge.operations[0].id]);assert.equal(p.sections[0].blocks[0].content,'First atom.\n\nSecond atom.');
});
test('question normalization retains structured prompts, solutions and table geometry',()=>{
 const doc=fromSource('| One | Two |\n|---|---|\n| $x^2$ | 3 |');const q=normaliseQuestion({id:'q',content:{id:'root',prompt:doc,answer:{short:doc,worked:doc}}});assert.deepEqual(q.content.prompt,doc);assert.deepEqual(q.content.answer.worked,doc);assert.match(documentHtml(q.content.prompt),/<table/);
});
test('server revision snapshots preserve original records and reject stale writes',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'studio-revisions-'));const options={projectRoot:path.join(root,'projects'),bankRoot:path.join(root,'bank')};
 let p=await createBookletProject(base(),options);const old=structuredClone(p);p.title='New title';p=await saveBookletProject(p,{...options,expectedRevision:p.revision});assert.equal(JSON.parse(fs.readFileSync(path.join(options.projectRoot,'.revisions','review','1.json'),'utf8')).title,'Review');await assert.rejects(()=>saveBookletProject(old,{...options,expectedRevision:old.revision}),/another session/);
});
function candidate(id,skill,tier='Foundation',origin='mathsmap') {return {question:normaliseQuestion({id,classification:{primarySkillId:skill,difficulty:tier},content:{id:id+'-root',prompt:'Shared stem',children:[{id:id+'-a',prompt:'Part a',answer:{short:'1',worked:'1'}},{id:id+'-b',prompt:'Hence part b',answer:{short:'2',worked:'2'}}]}}),origin,skillIds:[skill],archetype:'routine',tier,prerequisiteIds:[],reviewed:true};}
test('assembly keeps whole dependent questions, avoids duplicates and reports remaining gaps',()=>{
 const p=base(),r=defaultRecipe(p);r.chunks=[{id:'A',title:'A',blockIds:['a'],skillIds:['skill-a'],archetypes:['routine'],prerequisiteIds:[]},{id:'B',title:'B',blockIds:['b'],skillIds:['skill-b'],archetypes:['routine'],prerequisiteIds:['skill-a']}];r.scopeSkillIds=['skill-a','skill-b'];r.counts={guided:1,Foundation:1,Development:1,Mastery:1,mini:2,cumulative:2,challenge:1};
 const bank=[candidate('a1','skill-a'),candidate('a2','skill-a'),candidate('b1','skill-b'),candidate('b2','skill-b'),candidate('i1','skill-a','Development','imported'),candidate('out','outside')];const result=assembleBooklet(p,r,bank);const qs=result.project.sections.flatMap(s=>s.blocks.filter(b=>b.type==='question'));assert.ok(qs.length);assert.ok(qs.every(q=>q.content.children.length===2));assert.ok(qs.every(q=>q.classification.primarySkillId!=='outside'));assert.ok(result.gaps.length>0);assert.ok(result.project.sections.some(s=>s.optional));assert.equal(result.project.sections.at(-1).role,'challenge');
});
test('coverage exceptions require both a rationale and explicit approval',()=>{
 const r=defaultRecipe(base());r.chunks=[{id:'A',title:'A',archetypes:['routine'],skillIds:['a']}];r.scopeSkillIds=['a'];const row=coverageMatrix(r,[])[0];r.exceptions[row.key]={approved:true,reason:''};assert.equal(coverageMatrix(r,[])[0].status,'gap');r.exceptions[row.key].reason='No meaningful recognition variant';assert.equal(coverageMatrix(r,[])[0].status,'not-applicable');
});
test('assembly refuses an untaught prerequisite instead of silently skipping it',()=>{
 const r=defaultRecipe(base());r.chunks[0].prerequisiteIds=['unmet'];assert.throws(()=>assembleBooklet(base(),r,[]),/untaught prerequisites/);
});
test('part grouping retains the shared stem, diagrams, labels, answers and dependencies',()=>{
 let p=base();const q=candidate('parts','construct-table-of-values').question;q.type='question';q.content.questionDiagrams=[{id:'base-diagram',format:'image',src:'/original.png'}];q.content.children[1].dependsOn=[q.content.children[0].id];p.sections[0].blocks=[q];
 const original=structuredClone(q.content),split=splitQuestionPartsProposal(p,q.content.id,1);p=decideProposal(addProposal(p,split),split.id,[split.operations[0].id]);
 assert.equal(p.sections[0].blocks[0].content.prompt,original.prompt);assert.deepEqual(p.sections[0].blocks[0].content.questionDiagrams,original.questionDiagrams);
 const leaves=allNodes(p.sections[0].blocks[0].content).filter(n=>!n.children?.length);assert.deepEqual(leaves,original.children);
 const merge=mergeQuestionPartsProposal(p,p.sections[0].blocks[0].content.children[0].id);p=decideProposal(addProposal(p,merge),merge.id,[merge.operations[0].id]);assert.deepEqual(allNodes(p.sections[0].blocks[0].content).filter(n=>!n.children?.length),original.children);
 assert.ok(publicationBlockers(p,[q.id]).some(s=>s.includes(leaves[0].id)));
});
test('global spacing settings reopen layout review without reopening content review',()=>{
 let p=approveTarget(approveTarget(base(),'a','content'),'a','layout');const next=structuredClone(p);next.settings.layoutOverrides.answerSpaces.a=60;p=reconcileApprovals(p,next);assert.equal(approvalCurrent(p,'a','layout'),false);assert.equal(approvalCurrent(p,'a','content'),true);
});
test('assembly rekeys overlays and part dependencies together and pins source revisions',()=>{
 const p=base(),r=defaultRecipe(p);r.chunks=[{id:'c',title:'A',blockIds:['a'],skillIds:['skill-a'],archetypes:['routine'],prerequisiteIds:[]}];r.scopeSkillIds=['skill-a'];r.counts={examples:0,guided:1,Foundation:0,Development:0,Mastery:0,mini:0,cumulative:0,challenge:0};
 const c=candidate('original','skill-a');c.revision='reviewed-sha';c.question.content.questionDiagrams=[{id:'base',format:'tikz',code:'base'}];c.question.content.children[0].answer.solutionDiagrams=[{id:'overlay',overlayOf:'base',format:'tikz',code:'overlay'}];c.question.content.children[1].dependsOn=[c.question.content.children[0].id];
 const assembled=assembleBooklet(p,r,[c]).project.sections.flatMap(s=>s.blocks).find(b=>b.type==='question');assert.equal(assembled.content.children[0].answer.solutionDiagrams[0].overlayOf,assembled.content.questionDiagrams[0].id);assert.deepEqual(assembled.content.children[1].dependsOn,[assembled.content.children[0].id]);assert.equal(assembled.sourceQuestionRef.revision,'reviewed-sha');assert.equal(assembled.bankRef,null);
});
test('generated candidates are individual proposals and remain ineligible until reviewed',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'studio-generation-')),p=base();
 const runner=async dir=>{fs.writeFileSync(path.join(dir,'task-001.result.json'),JSON.stringify({questions:[{title:'Substitution',content:{id:'root',prompt:'Find $y$ when $y=3x+2$ and $x=4$.',children:[],answer:{short:'$14$',worked:'$y=3(4)+2=14$'}}}],rationale:'Distinct roles for coefficient and constant.'}));return {ok:true};};
 const {proposal}=await createGapProposal({project:p,gap:{skillIds:['construct-table-of-values'],archetype:'positive-coefficient',tier:'Foundation'},count:1},{runner,workRoot:root});const accepted=decideProposal(addProposal(p,proposal),proposal.id,[proposal.operations[0].id]);const candidate=candidatesFromProject(accepted)[0];assert.equal(candidate.origin,'generated');assert.equal(candidate.reviewed,false);assert.equal(validateQuestion(candidate.question).valid,true);assert.equal(accepted.sections.at(-1).role,'candidate-pool');
 accepted.sections.at(-1).blocks[0].content.prompt='Later manual edit';assert.throws(()=>decideProposal(accepted,proposal.id,[proposal.operations[0].id],'undo'),/changed/);
});
test('measurements distinguish recorded hands-on effort from automated elapsed time',()=>{
 assert.equal(workflowMeasurement(base()).stages[0].handsOnMinutes,null);
 let p=recordMetric(base(),{stage:'audit',type:'minutes',value:4.5});p=recordMetric(p,{stage:'audit',type:'correction',value:3,note:'Page 2'});const report=workflowMeasurement(p);assert.equal(report.stages.find(s=>s.stage==='audit').handsOnMinutes,4.5);assert.equal(report.stages.find(s=>s.stage==='audit').corrections,3);assert.equal(report.acceptedProposalRate,null);
});
test('assembly teaches internal atoms and keeps generated prerequisite constraints',()=>{
 const p=base(),r=defaultRecipe(p);r.chunks=[{id:'A',title:'A',blockIds:['a'],skillIds:['skill-a'],teachingAtomIds:['a'],archetypes:['routine'],prerequisiteIds:[]},{id:'B',title:'B',blockIds:['b'],skillIds:['skill-b'],teachingAtomIds:['b'],archetypes:['routine'],prerequisiteIds:['a']}];r.scopeSkillIds=['skill-a','skill-b'];r.counts={examples:0,guided:1,Foundation:0,Development:0,Mastery:0,mini:0,cumulative:0,challenge:0};
 const c=candidate('internal','skill-b');c.prerequisiteIds=['a'];const result=assembleBooklet(p,r,[c]);assert.equal(result.selectedQuestionCount,1);assert.ok(!result.project.sections.some(s=>s.title.startsWith('Blocked')));
 const generated=candidate('generated','skill-b').question;generated.type='question';generated.generationEvidence={prerequisiteIds:['not-taught']};p.sections[0].blocks.push(generated);assert.deepEqual(candidatesFromProject(p)[0].prerequisiteIds,['not-taught']);
});
test('cloze widths and mathematical absolute-value pipes survive table parsing and student rendering',()=>{
 const source='| Value | Working |\n|---|---|\n| [[5|12]] | $|x|=5$ |';const doc=fromSource(source);assert.equal(doc.blocks[0].rows[1].length,2);assert.equal(doc.blocks[0].rows[1][0].blocks[0].inlines[0].answer,'5');assert.equal(doc.blocks[0].rows[1][1].blocks[0].inlines[0].latex,'|x|=5');assert.doesNotMatch(documentHtml(doc),/data-cloze="5"[^>]*>5<\/span>/);assert.match(documentHtml(doc,{fillCloze:true}),/data-cloze="5"[^>]*>5<\/span>/);
});
test('shared source-atom evidence is legal while duplicate content identities are rejected',async()=>{
 const {validateEditableProject}=await import('../src/lib/editable-booklet-model.js');const p=base();p.sections[0].blocks.forEach(b=>b.sourceAtom={id:'shared-source',title:'Shared source group'});assert.equal(validateEditableProject(p).valid,true);p.sections[0].blocks[1].id='a';assert.equal(validateEditableProject(p).valid,false);
});
test('cell rotation reopens layout approval without changing the reviewed mathematics',()=>{
 let p=base();p.sections[0].blocks[0].content=fromSource('| $x$ | $y$ |\n|---|---|\n| $1$ | $2$ |');p=approveTarget(approveTarget(p,'a','content'),'a','layout');const next=structuredClone(p);next.sections[0].blocks[0].content.blocks[0].rows[1][0].rotation=-90;const revised=reconcileApprovals(p,next);assert.equal(approvalCurrent(revised,'a','content'),true);assert.equal(approvalCurrent(revised,'a','layout'),false);
});
test('legacy module migration uses the reviewed question snapshot and revision',async()=>{
 const {materializeLegacyProject}=await import('../src/lib/editable-booklet-model.js');const pinned=candidate('pinned','skill-a').question;pinned.content.prompt='Reviewed original';const later=structuredClone(pinned);later.content.prompt='Changed bank record';
 const raw={id:'legacy',format:'mathsmap-booklet-project-v3',version:3,title:'Legacy',sections:[{id:'s',title:'Module',blocks:[{id:'placement',type:'module-ref',moduleId:'module'}]}]};const result=materializeLegacyProject(raw,{bank:[later],modules:[{id:'module',sequence:[{type:'question-ref',questionId:pinned.id,questionRevision:'old-sha',snapshot:pinned}]}]});assert.equal(result.sections[0].blocks[0].content.prompt,'Reviewed original');assert.equal(result.sections[0].blocks[0].bankRef.revision,'old-sha');
});
test('MathsMap graph answers retain their diagrams in both short and worked exports',async()=>{
 const {solutionFields}=await import('../scripts/booklet/assembly-bank.mjs');const answer=solutionFields('$(0,2), (1,3)$\n[tikz]\\begin{tikzpicture}\\draw (0,0)--(1,1);\\end{tikzpicture}[/tikz]','graph');assert.equal(answer.short,'$(0,2), (1,3)$');assert.doesNotMatch(answer.worked,/tikz/);assert.equal(answer.solutionDiagrams.length,1);assert.match(answer.solutionDiagrams[0].code,/\\draw/);
});

test('cumulative selection avoids repeated table exercises inside imported groups',()=>{
 const p=base(),r=defaultRecipe(p);r.chunks=[{id:'A',title:'A',blockIds:['a'],skillIds:['skill-a'],archetypes:['routine'],prerequisiteIds:[]}];r.scopeSkillIds=['skill-a'];r.counts={examples:0,guided:1,Foundation:0,Development:0,Mastery:0,mini:0,cumulative:1,challenge:0};
 const bank=candidate('bank','skill-a');bank.question.content={id:'bank-root',prompt:'Complete the table for $y=3x+2$.\n$\\begin{array}{c|cc}x&0&1\\\\y&&\\end{array}$',children:[]};
 const repeated=candidate('imported','skill-a','Foundation','imported');repeated.question.content.prompt='Complete the table of values.';repeated.question.content.children[0].prompt='$y = 3x + 2$\n| $x$ | $0$ | $1$ |\n|---|---|---|\n| $y$ | | |';
 const result=assembleBooklet(p,r,[bank,repeated]);assert.equal(result.selectedQuestionCount,1);assert.ok(result.gaps.some(g=>g.section==='Cumulative interleaved practice'&&g.selected===0));
});

test('cross-page continuation merge preserves source groups and refuses unsafe undo',async()=>{
 const {mergeQuestionContinuationProposal}=await import('../src/lib/booklet-review-model.js');
 let p=base();const left=candidate('left','skill-a').question,right=candidate('right','skill-a').question;left.type=right.type='question';right.content.children[0].label='c';right.content.children[1].label='d';right.content.children[0].dependsOn=[left.content.children[1].id];left.content.questionDiagrams=[{id:'shared-plane',format:'image',src:'/plane.png'}];
 p.sections=[{id:'page-one',title:'Page one',blocks:[left]},{id:'page-two',title:'Page two',blocks:[right]},{id:'other-page',title:'Other page',blocks:[]}];const original=structuredClone(p.sections);
 const proposal=mergeQuestionContinuationProposal(p,left.id);p=decideProposal(addProposal(p,proposal),proposal.id,[proposal.operations[0].id]);
 const merged=p.sections[0].blocks[0];assert.equal(p.sections[1].blocks.length,0);assert.equal(merged.content.prompt,'Shared stem');assert.deepEqual(merged.continuationSources,['left','right']);assert.deepEqual(merged.content.children.map(n=>n.id),['left-root','right-root']);assert.deepEqual(merged.content.children[1].children[0].dependsOn,['left-b']);assert.equal(merged.content.children[0].questionDiagrams[0].id,'shared-plane');assert.equal(validateQuestion(normaliseQuestion(merged)).valid,true);
 p.sections[2].title='Later unrelated edit';const undone=decideProposal(p,proposal.id,[proposal.operations[0].id],'undo');assert.deepEqual(undone.sections.slice(0,2),original.slice(0,2));assert.equal(undone.sections[2].title,'Later unrelated edit');
 p.sections[0].blocks[0].content.children[0].children[0].prompt='New manual wording';assert.throws(()=>decideProposal(p,proposal.id,[proposal.operations[0].id],'undo'),/section changed/);
});
