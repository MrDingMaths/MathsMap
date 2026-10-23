// Polish pipeline: the comments it leaves for the teacher, the ones it closes, and what it never touches (23 October 2026).
import test from 'node:test';
import assert from 'node:assert/strict';
import {teacherFlags,teacherBlocks,addBreakSuggestionFlags,addPedagogySuggestionFlags,supersedeMachineFlags,openMachineFlagIds,KIND_BREAK,KIND_PEDAGOGY} from '../polish/flags.mjs';
import {bookletComments} from '../src/lib/booklet-feedback.js';
import {setPageBoundary} from '../src/lib/booklet-workspace.js';
import {automatedRepair,spacingProtected} from '../src/lib/booklet-import-spacing.js';
import {booklet} from './polish-fixture.mjs';

const flag=(id,extra={})=>({id,note:'n',targetId:'q1',at:'2026-10-01T00:00:00Z',scope:'local',...extra});
const withFlags=(flags,mutate)=>{const p=booklet();p.studio={version:1,flags};mutate?.(p);return p;};

test('a teacher comment has no kind and a timestamp; the blocks it names and the blocks with a human repair are the teacher\'s',()=>{
 const p=withFlags([flag('t1',{targetId:'q2-a',resolved:true}),flag('m1',{kind:'first-pass',findingId:'fp-1',targetId:'q3'}),flag('x',{at:undefined})],project=>{
  project.sections[1].blocks[3].sourceReview={feedbackRepairs:[{date:'2026-10-20',note:'Teacher: tighten the table'}]};
  project.sections[1].blocks[4].sourceReview={feedbackRepairs:[{date:'2026-10-20',source:'polish',note:'Polish normalise (cloze)'}]};
 });
 assert.deepEqual(teacherFlags(p).map(f=>f.id),['t1']);
 assert.deepEqual([...teacherBlocks(p)].sort(),['q2','q4'],'a resolved teacher comment still counts; a machine comment and a polish repair do not');
 assert.equal(automatedRepair({source:'polish'}),true);
 assert.equal(spacingProtected({sourceReview:{feedbackRepairs:[{source:'polish',note:'x'}]}}),false,'a polish repair does not protect spacing');
});

test('superseding closes the machine findings of earlier runs and nothing else',()=>{
 const p=withFlags([flag('t1'),flag('fp',{kind:'first-pass',findingId:'fp-1'}),flag('pr',{kind:'pedagogy-review',findingId:'pf-1'}),flag('done',{kind:'first-pass',resolved:true,resolution:'Fixed.'}),flag('sug',{kind:KIND_PEDAGOGY,findingId:'x'}),flag('fresh',{kind:'first-pass',findingId:'fp-2'})]);
 const start=openMachineFlagIds(p);
 assert.deepEqual([...start].sort(),['fp','fresh','pr']);
 // 'fresh' is posted by the new run after the start: not in the ids that were open when it began.
 const ids=new Set(['fp','pr']);
 const {project,closed}=supersedeMachineFlags(p,{date:'2026-10-23',ids});
 assert.deepEqual(closed.map(c=>c.id).sort(),['fp','pr']);
 const by=Object.fromEntries(project.studio.flags.map(f=>[f.id,f]));
 assert.equal(by.fp.resolved,true);assert.equal(by.fp.resolution,'superseded by polish 2026-10-23');assert.ok(by.fp.resolvedAt);
 assert.equal(by.pr.resolution,'superseded by polish 2026-10-23');
 assert.equal(by.t1.resolved,undefined,'a teacher comment is untouched');
 assert.equal(by.done.resolution,'Fixed.','an already resolved finding keeps its own resolution');
 assert.equal(by.sug.resolved,undefined);assert.equal(by.fresh.resolved,undefined);
 assert.equal(JSON.stringify(p.studio.flags.find(f=>f.id==='t1')),JSON.stringify(by.t1));
 // With no id list every open machine finding is closed.
 assert.equal(supersedeMachineFlags(p,{date:'2026-10-23'}).closed.length,3);
});

test('a break suggestion becomes one comment with the button\'s block, and the button\'s action removes the break',()=>{
 const p=booklet();p.sections[1].blocks[2].flow={pageBreakBefore:true,exercisePageBreakBefore:true};
 const items=[{sectionId:'practice',topicId:'area',firstBlockId:'q3',pageBefore:4,freeMm:84,estPagesSaved:1,newSplits:0},{sectionId:'other',firstBlockId:'q5',pageBefore:6,freeMm:70,estPagesSaved:0,newSplits:0}];
 const {project,added}=addBreakSuggestionFlags(p,items,{labels:{practice:'Exercise 2'}});
 assert.equal(added.length,1,'a break that saves no page is not offered');
 const made=project.studio.flags.find(f=>f.kind===KIND_BREAK);
 assert.deepEqual([made.firstBlockId,made.freeMm,made.estPagesSaved],['q3',84,1]);
 assert.match(made.note,/Remove the page break before Exercise 2: page 4 has 84 mm free.*about 1 page\./);
 assert.equal(bookletComments(project).some(f=>f.id===made.id),true,'it shows in the Comments pane, where the button is');
 // The button: setPageBoundary(..., 'remove') on firstBlockId, then the comment resolves itself.
 const removed=setPageBoundary(project,made.firstBlockId,'remove');
 assert.equal(removed.sections[1].blocks[2].flow.pageBreakBefore,false);
 // A second run replaces its own unresolved suggestions instead of piling up.
 const again=addBreakSuggestionFlags(project,items,{labels:{practice:'Exercise 2'}});
 assert.equal(again.project.studio.flags.filter(f=>f.kind===KIND_BREAK).length,1);assert.equal(again.replaced,1);
});

test('a pedagogy suggestion is posted once and anchors on the first target it can',()=>{
 const p=booklet();
 const items=[{id:'pf-1',targets:['not-a-node','q2-root'],note:'[Pedagogy review · Suggestion] Idea.'}];
 const {project,added}=addPedagogySuggestionFlags(p,items);
 assert.equal(added.length,1);
 const made=project.studio.flags.find(f=>f.kind===KIND_PEDAGOGY);
 assert.equal(made.findingId,'pf-1');assert.match(made.note,/Idea\./);
 assert.equal(addPedagogySuggestionFlags(project,items).added.length,0,'never twice');
});
