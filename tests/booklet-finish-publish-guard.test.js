import test from 'node:test';
import assert from 'node:assert/strict';
import {finishPublishSafetyIssues} from '../scripts/booklet/import-finish.mjs';
import {acceptedSnapshot,contentHash} from '../scripts/booklet/lean-review.mjs';
import {polishSafetyIssues} from '../polish/guards.mjs';

const fixture=()=>{
 const original={id:'p',settings:{},sections:[{id:'s',phase:'practice',blocks:[{id:'prior',type:'question',content:{id:'prior-root',type:'question',label:'1',prompt:'Independent task.'}},{id:'q',type:'question',flow:{dependsOn:['prior']},content:{id:'root',type:'question',label:'2',prompt:'Self-contained task.',children:[{id:'part',type:'part',label:'a',prompt:'Find 1+1.',answer:{short:'2',worked:'1+1=2.'}}]}}]}]};
 const current=structuredClone(original);current.sections[0].blocks[1].flow.dependsOn=[];
 return {original,current};
};
const block=p=>p.sections[0].blocks[1];
const proof=p=>{const b=block(p),hash=contentHash(b);return {questions:{q:{outcome:'passed',hash,acceptedVersion:{outcome:'passed',hash,snapshot:acceptedSnapshot(b)}}}};};

test('native publish permits only exact independently reviewed layout-edge removal without mutating input/proof',()=>{
 const {original,current}=fixture(),reviewed=proof(current),before=structuredClone({original,current,reviewed});
 assert.ok(polishSafetyIssues(original,current,{spacing:false}).includes('lost dependency on q'),'ordinary layout/publication guard remains strict');
 assert.deepEqual(finishPublishSafetyIssues(original,current,reviewed),[]);
 assert.deepEqual({original,current,reviewed},before);
});

test('accepted snapshot comparison includes all captured content and flow, using the existing audit-only projection',()=>{
 const {original,current}=fixture(),reviewed=proof(current);
 block(current).bankRef=null;block(current).sourceLayoutEvidence={pageBreakBefore:true};block(current).content.children[0].answer.provenance={short:'source',worked:'source'};
 assert.deepEqual(finishPublishSafetyIssues(original,current,reviewed),[]);
 block(current).flow.repeatSharedDiagram=true;
 assert.ok(finishPublishSafetyIssues(original,current,reviewed).includes('lost dependency on q'),'an arbitrary later flow edit invalidates exact acceptance');
});

test('missing, stale, revoked or nonpassed independent proofs never permit a lost edge',()=>{
 for(const change of [r=>delete r.questions.q,r=>r.questions.q.outcome='failed',r=>r.questions.q.hash='stale',r=>r.questions.q.acceptedVersion.hash='stale',r=>r.questions.q.acceptedVersion.revoked=true,r=>r.questions.q.acceptedVersion.outcome='failed',r=>r.questions.q.acceptedVersion.snapshot.flow.dependsOn=['prior'],r=>r.questions.q.acceptedVersion.snapshot.content.prompt='Different reviewed prompt.']){
  const {original,current}=fixture(),reviewed=proof(current);change(reviewed);
  assert.ok(finishPublishSafetyIssues(original,current,reviewed).includes('lost dependency on q'));
 }
});

test('new edges and absence of an explicit reviewed remaining array do not permit removal',()=>{
 for(const remaining of [['different'],undefined]){
  const {original,current}=fixture();block(current).flow.dependsOn=remaining;
  assert.ok(finishPublishSafetyIssues(original,current,proof(current)).includes('lost dependency on q'));
 }
});

test('independent layout-edge review cannot bypass top-level or nested content dependencies',()=>{
 for(const nested of [false,true]){
  const {original,current}=fixture(),a=nested?block(original).content.children[0]:block(original),b=nested?block(current).content.children[0]:block(current);
  a.dependsOn=['prior'];b.dependsOn=[];
  assert.ok(finishPublishSafetyIssues(original,current,proof(current)).some(s=>s==='lost dependency on '+(nested?'part':'q')));
 }
});

test('protected blocks and teacher decisions remain protected even with exact independent acceptance',()=>{
 const {original,current}=fixture();block(original).sourceReview={authorisedFeedback:true};block(current).sourceReview={authorisedFeedback:true};
 assert.ok(finishPublishSafetyIssues(original,current,proof(current)).includes('changed teacher block q'));
 const next=fixture();next.original.studio={flags:[{id:'teacher',targetId:'q',at:'original',resolved:true,note:'Preserve this.'}]};next.current.studio=structuredClone(next.original.studio);next.current.studio.flags[0].note='Changed';
 assert.ok(finishPublishSafetyIssues(next.original,next.current,proof(next.current)).includes('changed teacher comment teacher'));
});

test('reviewed layout-edge removal cannot suppress labels, exercise breaks or keep-with-next links',()=>{
 const labels=fixture();block(labels.current).content.children[0].label='';
 assert.ok(finishPublishSafetyIssues(labels.original,labels.current,proof(labels.current)).includes('lost part label on part'));
 const breaks=fixture();block(breaks.current).flow.exercisePageBreakBefore=false;
 assert.ok(finishPublishSafetyIssues(breaks.original,breaks.current,proof(breaks.current)).includes('removed exercise break on q'));
 const linked=fixture();block(linked.original).flow.keepWithNext=true;block(linked.current).flow.keepWithNext=false;
 assert.ok(finishPublishSafetyIssues(linked.original,linked.current,proof(linked.current)).includes('lost dependency on q'));
});

const boundaryFixture=()=>({id:'boundary',sections:[{id:'source-practice',phase:'practice',role:'mixed-practice',topicId:'original-topic',blocks:['q1','q2'].map(id=>({id,type:'question',content:{id:id+'-root',type:'question',prompt:'Find 1+1.',answer:{short:'2',worked:'1+1=2.'}}}))}]});
const boundaryIssues=(before,after)=>polishSafetyIssues(before,after,{spacing:false}).filter(x=>x.startsWith('removed exercise boundary'));

test('topic correction preserves the exact section and first-block exercise boundary without mutating inputs',()=>{
 for(const explicit of [undefined,true]){
  const original=boundaryFixture(),current=structuredClone(original);
  if(explicit!==undefined){original.sections[0].blocks[0].flow={exercisePageBreakBefore:explicit};current.sections[0].blocks[0].flow={exercisePageBreakBefore:explicit};}
  current.sections[0].topicId='source-corrected-topic';current.sections[0].blocks[0].flow={...current.sections[0].blocks[0].flow,pageBreakBefore:true};
  const saved=structuredClone({original,current});
  assert.deepEqual(polishSafetyIssues(original,current,{spacing:false}),[]);
  assert.deepEqual({original,current},saved);
 }
});

test('exact section identity cannot mask a suppressed exercise break',()=>{
 const original=boundaryFixture(),current=structuredClone(original);current.sections[0].topicId='corrected';current.sections[0].blocks[0].flow={exercisePageBreakBefore:false,pageBreakBefore:true};
 assert.deepEqual(boundaryIssues(original,current),['removed exercise boundary source-practice']);
 assert.ok(polishSafetyIssues(original,current,{spacing:false}).includes('removed exercise break on q1'));
});

test('a source topic merge retains the unchanged exercise only with its explicit native page break',()=>{
 for(const marker of [undefined,false,'true',true]){
  const original=boundaryFixture(),current=structuredClone(original);current.sections[0].topicId='corrected';current.sections[0].blocks[0].flow={pageBreakBefore:marker};
  current.sections.unshift({id:'earlier',phase:'practice',topicId:'corrected',blocks:[{id:'earlier-q',type:'rich-text',content:'Earlier exercise'}]});
  assert.deepEqual(boundaryIssues(original,current),marker===true?[]:['removed exercise boundary source-practice']);
  if(marker===true){current.sections[1].blocks[0].flow.exercisePageBreakBefore=false;assert.deepEqual(boundaryIssues(original,current),['removed exercise boundary source-practice']);}
 }
});

test('changed, displaced and non-practice starts cannot use the topic-correction exception',()=>{
 for(const change of [
  p=>p.sections[0].blocks.shift(),
  p=>p.sections.unshift({id:'earlier',phase:'practice',topicId:'corrected',blocks:[{id:'earlier-q',type:'rich-text',content:'Earlier start'}]}),
  p=>p.sections[0].phase='teaching',
  p=>p.sections[0].role='candidate-pool',
  p=>p.sections[0].blocks=[],
  p=>p.sections[0].id='different-section'
 ]){
  const original=boundaryFixture(),current=structuredClone(original);current.sections[0].topicId='corrected';change(current);
  assert.deepEqual(boundaryIssues(original,current),['removed exercise boundary source-practice']);
 }
});

test('legacy same-topic replacement and explicit break exemptions retain their previous behaviour',()=>{
 const original=boundaryFixture(),current=structuredClone(original);current.sections[0].blocks.shift();assert.deepEqual(boundaryIssues(original,current),[]);
 const exempt=boundaryFixture();exempt.sections[0].blocks[0].flow={exercisePageBreakBefore:false};const moved=structuredClone(exempt);moved.sections[0].topicId='corrected';assert.deepEqual(boundaryIssues(exempt,moved),[]);
});

test('topic corrections do not waive teacher decisions or mathematical dependencies',()=>{
 const original=boundaryFixture();original.studio={flags:[{id:'teacher',targetId:'q1',at:'original',resolved:true,note:'Preserve this.'}]};original.sections[0].blocks[0].flow={dependsOn:['q2']};
 const current=structuredClone(original);current.sections[0].topicId='corrected';current.studio.flags[0].note='Changed';current.sections[0].blocks[0].flow.dependsOn=[];
 const issues=polishSafetyIssues(original,current,{spacing:false});assert.ok(issues.includes('changed teacher comment teacher'));assert.ok(issues.includes('lost dependency on q1'));
});
