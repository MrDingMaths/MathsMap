// Polish pipeline step 4 (23 October 2026): a batch of findings is applied whole or not at all, and a batch that makes
// pagination worse is reverted.
import test from 'node:test';
import assert from 'node:assert/strict';
import {runReview} from '../first-pass/review.mjs';
import {atomicTrial,paginationRegression,runApply,groupFindings,removesPracticeLabel,trialApply} from '../first-pass/apply.mjs';
import {applyCorrections} from '../scripts/booklet/lean-review.mjs';
import {booklet,workspace,finding,reviewRunner,patch} from './polish-fixture.mjs';

const row=(id,...blocks)=>({id,targets:blocks.map(blockId=>({id:blockId,blockId}))});
const blocksOf=()=>booklet().sections[1].blocks;

test('a batch with a refused correction loses its other corrections too',()=>{
 const groups=[[row('a','q1'),row('b','q1')],[row('c','q2')]];
 const corrections=[
  {id:'a',patches:[patch('q1-a','/answerSpaceMm',18,12)]},
  {id:'b',patches:[patch('q1-b','/answerSpaceMm',99,12)]}, // the original is wrong: refused
  {id:'c',patches:[patch('q2-a','/answerSpaceMm',18,12)]},
 ];
 const result=atomicTrial({blocks:blocksOf(),settings:booklet().settings,corrections,applyCorrections,groups});
 assert.deepEqual(result.accepted.map(row=>row.id),['c'],'a is dropped with b; the other batch is unaffected');
 assert.deepEqual(result.dropped.map(row=>row.findingId),['a']);
 assert.match(result.dropped[0].why,/b could not be applied/);
});

test('a batch with a finding the worker declined is not applied half way',()=>{
 const groups=[[row('a','q1'),row('b','q1')]];
 const result=atomicTrial({blocks:blocksOf(),settings:booklet().settings,corrections:[{id:'a',patches:[patch('q1-a','/answerSpaceMm',18,12)]}],applyCorrections,groups,declined:new Set(['b'])});
 assert.deepEqual(result.accepted,[]);assert.deepEqual(result.dropped.map(r=>r.findingId),['a']);
});

test('the groups of atomicTrial are the findings that share a block',()=>{
 assert.deepEqual(groupFindings([row('a','q1'),row('b','q1','q2'),row('c','q5')]).map(g=>g.map(f=>f.id)),[['a','b'],['c']]);
});

test('pagination got worse: more pages in any edition, or a new issue',()=>{
 const map=(student,issues=[])=>({student:Array(student).fill({}),short:Array(2).fill({}),worked:Array(2).fill({}),issues:{student:issues,short:[],worked:[]}});
 assert.deepEqual(paginationRegression(map(7),map(7)),[]);
 assert.deepEqual(paginationRegression(map(7),map(6)),[]);
 assert.match(paginationRegression(map(7),map(8))[0],/student grew from 7 to 8 pages/);
 const issue={kind:'oversized-content',id:'q3'};
 assert.match(paginationRegression(map(7),map(7,[issue]))[0],/new oversized-content issue on q3/);
 assert.deepEqual(paginationRegression(map(7,[issue]),map(7,[issue])),[],'an issue the earlier layout already had is not new');
 assert.deepEqual(paginationRegression(undefined,map(7)),[],'without a baseline nothing is compared');
});

async function seeded(t){
 const space=workspace(t);
 await runReview({...space.options,runner:reviewRunner({'student:2':{findings:[
  finding(2,['q1-a'],{area:'spacing',comment:'Tighten q1-a.'}),
  finding(2,['q1-b'],{area:'labels',comment:'Fix the q1-b label.'}),
  finding(3,['q2-a'],{area:'spacing',comment:'Tighten q2-a.'})]}})});
 const by={};for(const f of space.record().findings)by[f.targets[0].id]=f.id;
 return {space,by};
}
const apply=(space,extra)=>runApply({...space.options,runDir:space.dir+'/apply',retry:false,...extra});
const runner=corrections=>async()=>({result:{corrections,comments:[]},metrics:{}});

test('one finding that does not verify takes its whole batch back',async t=>{
 const {space,by}=await seeded(t),before=space.project();
 const corrections=[{id:by['q1-a'],reason:'Tighten a.',patches:[patch('q1-a','/answerSpaceMm',18,12)]},{id:by['q1-b'],reason:'Tighten b.',patches:[patch('q1-b','/answerSpaceMm',18,12)]},{id:by['q2-a'],reason:'Tighten q2.',patches:[patch('q2-a','/answerSpaceMm',18,12)]}];
 const verify=async({accepted})=>({automated:[],findings:accepted.map(r=>({id:r.id,fixed:r.id!==by['q1-b'],regressed:false,note:r.id===by['q1-b']?'the label is still wrong':'ok'}))});
 const result=await apply(space,{runner:runner(corrections),verify});
 assert.deepEqual(result.applied,[by['q2-a']],'the other batch stays');
 assert.deepEqual(result.reverted.sort(),[by['q1-a'],by['q1-b']].sort(),'q1-a goes with q1-b');
 const project=space.project();
 assert.deepEqual(project.sections[1].blocks[0],before.sections[1].blocks[0]);
 assert.equal(project.sections[1].blocks[1].content.children[0].answerSpaceMm,12);
 assert.match(space.record().findings.find(f=>f.id===by['q1-a']).applyNote,/with its batch/);
});

test('a round that raises a page count is reverted whole when it is one batch',async t=>{
 const space0=workspace(t);
 await runReview({...space0.options,runner:reviewRunner({'student:2':{findings:[finding(2,['q1-a'],{comment:'Tighten q1-a.'})]}})});
 const id=space0.record().findings[0].id,before=space0.project();
 const verify=async({accepted})=>({automated:[],findings:accepted.map(r=>({id:r.id,fixed:true,regressed:false,note:'ok'})),pagination:['student grew from 7 to 8 pages']});
 const result=await apply(space0,{runner:runner([{id,reason:'Tighten.',patches:[patch('q1-a','/answerSpaceMm',18,12)]}]),verify});
 assert.deepEqual(result.applied,[]);assert.deepEqual(result.reverted,[id]);
 assert.deepEqual(space0.project().sections[1].blocks[0],before.sections[1].blocks[0]);
 assert.match(space0.record().findings[0].applyNote,/pagination worse \(student grew from 7 to 8 pages\)/);
});

test('after a worse round each batch is tried alone and only the safe ones stay',async t=>{
 const {space,by}=await seeded(t);
 const corrections=[{id:by['q1-a'],reason:'a',patches:[patch('q1-a','/answerSpaceMm',18,12)]},{id:by['q1-b'],reason:'b',patches:[patch('q1-b','/answerSpaceMm',18,12)]},{id:by['q2-a'],reason:'c',patches:[patch('q2-a','/answerSpaceMm',18,12)]}];
 let verifications=0;
 const verify=async({accepted})=>{verifications++;return {automated:[],findings:accepted.map(r=>({id:r.id,fixed:true,regressed:false,note:'ok'})),...(verifications===1?{pagination:['student grew from 7 to 8 pages']}:{})};};
 // The q2 batch is the one that adds a page when applied alone.
 const checkPagination=async({project})=>project.sections[1].blocks[1].content.children[0].answerSpaceMm===12?['student grew from 7 to 8 pages']:[];
 const result=await apply(space,{runner:runner(corrections),verify,checkPagination});
 assert.deepEqual(result.applied.sort(),[by['q1-a'],by['q1-b']].sort());
 assert.deepEqual(result.reverted,[by['q2-a']]);
 const project=space.project();
 assert.equal(project.sections[1].blocks[0].content.children[0].answerSpaceMm,12);
 assert.equal(project.sections[1].blocks[1].content.children[0].answerSpaceMm,18,'q2 is back as it was');
});

// ---- part labels (23 October 2026): the p49 labels of rates-v1 ----------------------------------------------
test('taking the letters off a practice question is refused; a teaching block printed without letters may lose them',()=>{
 const practice=blocksOf(),teaching=[{id:'inv',type:'question',pedagogyRole:'investigation',sourceAtom:{id:'inv',kind:'investigation'},content:{id:'inv-root',type:'question',prompt:'x',children:[{id:'inv-a',type:'part',prompt:'y',answer:{short:'1'}}]}}];
 // Automatic lettering suppressed through the source response label, and an explicit part label removed.
 assert.equal(removesPracticeLabel(patch('q1','/sourceReview/responses/0/label',null,''),practice),true);
 assert.equal(removesPracticeLabel(patch('q1-a','/label','a',''),practice),true);
 assert.equal(removesPracticeLabel(patch('inv','/sourceReview/responses/0/label',null,''),teaching),false);
 assert.equal(removesPracticeLabel(patch('inv-a','/label','a',''),teaching),false);
 assert.equal(removesPracticeLabel(patch('q1-a','/label','a','b'),practice),false,'a relabel is not a removal');
 const result=trialApply({blocks:practice,settings:booklet().settings,corrections:[{id:'x',patches:[patch('q1-a','/label','a','')]}],applyCorrections});
 assert.deepEqual(result.accepted,[]);assert.match(result.comments[0].why,/part labels are content/);
});
