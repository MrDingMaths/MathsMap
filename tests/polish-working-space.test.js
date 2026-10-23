// Polish pipeline step 1, working space (23 October 2026): guided practice and "your turn" areas are included.
import test from 'node:test';
import assert from 'node:assert/strict';
import {applyCalibratedWorkingSpace,workingSpaceProtected,teachingResponseBlock} from '../paginate/lib/working-space-apply.mjs';
import {calibratedWorkingSpace} from '../src/lib/booklet-working-space.js';

const part=(id,mm,rows=4)=>({id,type:'part',label:id.slice(-1),prompt:'x',answerSpaceMm:mm,answer:{short:'1',worked:'$$'+Array.from({length:rows},(_,i)=>'x='+i).join('\\\\')+'$$'}});
const block=(id,parts,{role='guided-practice',sourceReview={},presentation}={})=>({id,type:'question',pedagogyRole:role,...(presentation?{presentation}:{}),content:{id:id+'-root',type:'question',prompt:'Q',children:parts},
 sourceReview:{responses:parts.map(p=>({targetId:p.id,kind:'working'})),workingSpaceEstimate:{method:'solution-steps',estimates:parts.map(p=>({targetId:p.id,widthMm:80,mathematicalRows:4,answerSpaceMm:p.answerSpaceMm}))},...sourceReview}});
const project=(blocks,{flags=[]}={})=>({id:'ws',revision:5,settings:{layoutOverrides:{blockLayouts:{},answerSpaces:{}}},studio:{flags},sections:[{id:'s',phase:'teaching',blocks}]});
// What the import records on nearly every teaching block.
const IMPORT_NOTES={intentionalDepartures:['Source blue and red scaffold ink uses the standard blue and red palette.','Writing-space dimensions are authored estimates, not measured source dimensions.'],authorisedFeedback:{date:'2026-10-14',note:'Missing numerator/denominator blanks use outlined native maths boxes; original evidence and answers retained.'}};
const space=(p,id)=>p.sections[0].blocks.flatMap(b=>b.content.children).find(c=>c.id===id).answerSpaceMm;

test('guided practice carrying the import\'s recorded departures is calibrated like an independent question',()=>{
 const guided=block('G',[part('G-a',40),part('G-b',40)],{sourceReview:IMPORT_NOTES});
 const ordinary=block('Q',[part('Q-a',40)],{role:'question',sourceReview:IMPORT_NOTES});
 const p=project([guided,ordinary]);
 assert.equal(workingSpaceProtected(guided),false);
 assert.equal(workingSpaceProtected(ordinary),true,'an independent question with the same notes keeps the stricter rule');
 const {project:next,changes}=applyCalibratedWorkingSpace(p,{history:false});
 assert.deepEqual([...new Set(changes.map(c=>c.blockId))],['G']);
 const target=calibratedWorkingSpace(guided.content.children[0],{widthMm:80,responseKind:'working',responseContext:{kind:'working',expectedAnswer:'1'},importMm:40});
 assert.equal(space(next,'G-a'),target);assert.ok(target<40,'a drop, as the median fit gives');
 assert.equal(space(next,'Q-a'),40);
 // The stricter rule is one flag away.
 assert.equal(applyCalibratedWorkingSpace(p,{history:false,teaching:false}).changes.length,0);
});

test('"your turn" questions are teaching responses too',()=>{
 const yourTurn=block('Y',[part('Y-a',40)],{role:'question',sourceReview:IMPORT_NOTES,presentation:{studentRole:'your-turn'}});
 assert.equal(teachingResponseBlock(yourTurn),true);
 assert.equal(applyCalibratedWorkingSpace(project([yourTurn]),{history:false}).changes.length,1);
});

test('a repair, a note about spacing or a teacher decision still protects a teaching block',()=>{
 const repaired=block('R',[part('R-a',40)],{sourceReview:{...IMPORT_NOTES,feedbackRepairs:[{date:'2026-10-20',note:'Teacher: put more room under part a'}]}});
 const noted=block('N',[part('N-a',40)],{sourceReview:{intentionalDepartures:['Keep the writing space as the source has it for this question.']}});
 const swept=block('S',[part('S-a',40)],{sourceReview:{...IMPORT_NOTES,feedbackRepairs:[{date:'2026-10-17',source:'sweep',note:'Pre-review sweep (cloze): standing house conventions applied.'}]}});
 assert.equal(workingSpaceProtected(repaired),true);
 assert.equal(workingSpaceProtected(noted),true);
 assert.equal(workingSpaceProtected(swept),false,'an automated repair does not protect');
 const {changes}=applyCalibratedWorkingSpace(project([repaired,noted,swept]),{history:false});
 assert.deepEqual([...new Set(changes.map(c=>c.blockId))],['S']);
});

test('only values equal to their import value move, and a reviewed booklet needs --named',()=>{
 const edited=block('E',[part('E-a',40),part('E-b',40)],{sourceReview:IMPORT_NOTES});
 edited.content.children[1].answerSpaceMm=55; // changed by hand since import (import value 40)
 const p=project([edited]);
 const {project:next,changes}=applyCalibratedWorkingSpace(p,{history:false});
 assert.deepEqual(changes.map(c=>c.nodeId),['E-a']);assert.equal(space(next,'E-b'),55);
 const reviewed=project([block('G',[part('G-a',40)],{sourceReview:IMPORT_NOTES})],{flags:[{id:'f',note:'x',at:'2026-10-18T00:00:00Z'}]});
 assert.throws(()=>applyCalibratedWorkingSpace(reviewed,{history:false}),/teacher comments/);
 assert.equal(applyCalibratedWorkingSpace(reviewed,{history:false,named:true}).changes.length,1);
});

test('table rows: tightened only above their content floor; a fresh import counts every row as unchanged',()=>{
 const cell=(id,text)=>({id,type:'cell',blocks:[{id:id+'-p',type:'paragraph',inlines:[{id:id+'-t',type:'text',text}]}]});
 const table=heights=>({id:'t1',type:'table',widthMm:170,rowHeights:heights,rows:[[{...cell('h1','H'),header:true}],[cell('c1','1')],[cell('c2','2')]]});
 const q=block('T',[part('T-a',30)],{role:'question'});
 q.content.prompt={format:'maths-editor-document-v1',version:1,blocks:[table([10,60,9])]};
 const p=project([q]);
 const fresh=applyCalibratedWorkingSpace(p,{history:false,tableRows:true,freshImport:true});
 const rows=fresh.changes.filter(c=>c.field==='rowHeights');
 assert.deepEqual(rows.map(c=>c.index),[1],'the 60 mm row drops; the 9 mm row is already at its content floor and stays');
 assert.ok(rows[0].after>=10&&rows[0].after<60);
 const tableAfter=fresh.project.sections[0].blocks[0].content.prompt.blocks[0];
 assert.equal(tableAfter.rowHeights[0],10,'a header row is never tightened');assert.equal(tableAfter.rowHeights[2],9);
 const failClosed=applyCalibratedWorkingSpace(p,{history:false,tableRows:true});
 assert.ok(!failClosed.changes.some(c=>c.field==='rowHeights'),'without a history and without freshImport nothing counts as unchanged');
});

test('an explicit imported zero never becomes extra writing space from a long answer key',()=>{
 const node={id:'table-answer',answerSpaceMm:0,prompt:'Fill native cells',answer:{short:'A long table answer',worked:'$$x=1\\\\x=2\\\\x=3\\\\x=4$$'}};
 assert.equal(calibratedWorkingSpace(node,{importMm:0,responseKind:'short',responseContext:{kind:'short',expectedAnswer:node.answer.short}}),0);
 assert.ok(calibratedWorkingSpace({...node,answerSpaceMm:undefined},{responseKind:'working'})>0,'missing estimation data is not an explicit zero');
 assert.ok(calibratedWorkingSpace({...node,answerSpaceMm:40},{importMm:40,responseKind:'working'})>0);
});

// ---- reviewed booklets (23 October 2026) -------------------------------------------------------------------
// An older import records no estimate: the import value is the allowance in the revision before the first teacher comment.
const noEstimate=(b)=>{const copy=structuredClone(b);delete copy.sourceReview.workingSpaceEstimate;delete copy.sourceReview.responses;return copy;};
const REVIEWED=[{id:'f',note:'x',at:'2026-10-18T00:00:00Z'}];

test('a reviewed booklet is fitted allowance by allowance: a teacher-edited value, a block with a repair and one with a spacing note stay',()=>{
 const plain=noEstimate(block('Q',[part('Q-a',40),part('Q-b',40)],{role:'question',sourceReview:{intentionalDepartures:['Approved layout audit: apply house layout while preserving handwriting space.']}}));
 const authorised=noEstimate(block('A',[part('A-a',40)],{role:'question',sourceReview:{authorisedFeedback:{date:'2026-10-14',note:'Keep as is.'}}}));
 const imported=project([structuredClone(plain),structuredClone(authorised)]);
 const now=project([structuredClone(plain),structuredClone(authorised)],{flags:REVIEWED});
 now.sections[0].blocks[0].content.children[1].answerSpaceMm=55; // the teacher changed Q-b
 const strict=applyCalibratedWorkingSpace(now,{named:true,history:false,imported});
 assert.equal(strict.changes.length,0,'the import\'s departures protect the whole block unless relaxed');
 const {project:next,changes}=applyCalibratedWorkingSpace(now,{named:true,history:false,imported,relaxed:true});
 assert.deepEqual(changes.map(c=>c.nodeId),['Q-a'],'only the untouched allowance in an unprotected block');
 assert.equal(space(next,'Q-b'),55);assert.equal(space(next,'A-a'),40,'authorised feedback protects its block');
 const target=calibratedWorkingSpace(plain.content.children[0],{responseKind:'working',responseContext:{kind:'working',expectedAnswer:'1'},importMm:40});
 assert.equal(space(next,'Q-a'),target);assert.ok(target<40);
});

test('without the import revision a block with no recorded estimate is left as it is',()=>{
 const reviewed=project([noEstimate(block('Q',[part('Q-a',40)],{role:'question'}))],{flags:REVIEWED});
 const {changes,summary}=applyCalibratedWorkingSpace(reviewed,{named:true,history:false,relaxed:true,imported:null});
 assert.equal(changes.length,0);assert.ok(summary.byField&&!Object.keys(summary.byField).length);
 const spacing=block('S',[part('S-a',40)],{role:'question',sourceReview:{intentionalDepartures:['Reduce the spacing under part a for this question.']}});
 assert.equal(workingSpaceProtected(spacing,{relaxed:true}),true,'a note about spacing still protects it');
});
