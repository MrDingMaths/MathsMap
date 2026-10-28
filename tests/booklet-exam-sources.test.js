import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {mathsBaseSource, normaliseQuestionSource} from '../src/lib/question-source.js';
import {normaliseQuestion, containsSourceMetadata} from '../src/lib/practice-question-model.js';
import {selectExamCandidates, readMathsBase} from '../scripts/booklet/export-mathsbase-exams.mjs';
import {normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
import {flowEditionSections} from '../src/lib/booklet-flow.js';
import {sectionShowsWorkingSpace} from '../src/lib/booklet-section-options.js';

test('printed source round-trips without accepting extraction provenance',()=>{
  const source={provider:'HSC',paper:'Advanced',year:2011,label:'HSC Advanced 2011',origin:'MathsBase'};
  const question=normaliseQuestion({id:'q',source,content:{type:'question',prompt:'Find x.'}});
  assert.deepEqual(question.source,normaliseQuestionSource(source));
  assert.equal(containsSourceMetadata(question),false);
  assert.equal(containsSourceMetadata({...question,source:{...source,file:'evidence.pdf'}}),true);
  assert.equal(containsSourceMetadata({...question,content:{...question.content,source}}),true);
  assert.equal('source' in normaliseQuestion({id:'old'}),false);
});
test('whitelist labels official/PLC sources and holds unknown trial names',()=>{
  assert.equal(mathsBaseSource('HSC.ADV.2011.Q2').label,'HSC Advanced 2011');
  assert.equal(mathsBaseSource('PLC.Y9.S2.2020.Q1').label,'PLC Y9 S2 2020');
  assert.equal(mathsBaseSource('HSC.BHHS.2020.Q1').needsSchoolMapping,true);
  assert.equal(mathsBaseSource('HSC.X1.2012 Q13b').label,'HSC Extension 1 2012');
  assert.equal(mathsBaseSource('PLC.Y11.X1.2023.T2 S1Qb').label,'PLC Y11 X1 T2 2023');
  assert.equal(mathsBaseSource('HSC.BHHS.Y11.X1.2022 Q13b').schoolYear,'Y11');
  for(const code of ['CAIE.2020','MB.2020','GEN.2020','LBNZ.2020','AU.AMC.2020','SmarterMaths.2020','HSC.SmarterMaths.2020'])assert.equal(mathsBaseSource(code),null);
});
test('candidate export holds unassessed items, removes excluded sources and repeats',()=>{
  const rows=[1,2,3,4].map(id=>({id:String(id),source:'HSC.ADV.2011',difficulty:'Development'}));
  rows[3].source='CAIE.2020';
  const mapping={skillIds:['s'],questions:{1:{skillId:'s',archetype:'a',routine:true,inScope:true},2:{skillId:'s',archetype:'a',routine:true,inScope:true}}};
  const result=selectExamCandidates(rows,mapping);
  assert.equal(result.selected.length,1);assert.equal(result.held.length,1);assert.equal(result.excluded.length,2);
});
test('external reader refuses an unscoped request before network access',async()=>{
  let calls=0;
  await assert.rejects(readMathsBase({root:'D:/WebApps/MathsDatabase',subtopicIds:[],fetcher:()=>{calls++;}}),/Explicit positive/);
  assert.equal(calls,0);
});
test('reader uses the sibling Questions.fetch through only the documented read RPC',async()=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'mathsbase-read-'));
  await fs.mkdir(path.join(root,'js'));
  await fs.writeFile(path.join(root,'js/config.js'),"const SUPABASE_URL='https://example.test';const SUPABASE_ANON_KEY='public-test-key';");
  await fs.writeFile(path.join(root,'js/questions.js'),"const Questions={async fetch(options){const {data}=await supabaseClient.rpc('fetch_questions',{p_sub_ids:options.subtopic,p_difficulty:options.difficulty,p_limit:options.limit,p_offset:options.offset});return {data};}};");
  const calls=[];
  const rows=await readMathsBase({root,subtopicIds:[218,219],fetcher:async(url,options)=>{calls.push({url:String(url),options});return {ok:true,json:async()=>[{id:'candidate'}]};}});
  assert.equal(rows[0].id,'candidate'); assert.equal(calls.length,1);
  assert.equal(calls[0].url,'https://example.test/rest/v1/rpc/fetch_questions');
  assert.equal(calls[0].options.method,'POST');
  assert.deepEqual(JSON.parse(calls[0].options.body),{p_sub_ids:[218,219],p_difficulty:['Development','Mastery','Challenge'],p_limit:500,p_offset:0});
  await fs.writeFile(path.join(root,'js/questions.js'),"const Questions={async fetch(){return supabaseClient.rpc('update_questions',{});}};");
  await assert.rejects(readMathsBase({root,subtopicIds:[218],fetcher:async()=>{throw Error('must not send');}}),/Only the documented read-only/);
});
test('exam/no-working-space survives all five edition projections without changing cells or clozes',()=>{
  const content={id:'root',type:'question',prompt:'Complete the table and $\\boxed{x}$.',children:[{id:'cell',type:'part',prompt:'Value',answerSpaceMm:20}]};
  const project=normalizeEditableProject({id:'pilot',sections:[{id:'exam',topicId:'exam',title:'Exam questions',phase:'practice',role:'exam',workingSpace:'none',blocks:[{id:'q',type:'question',content}]}]});
  assert.equal(project.sections[0].workingSpace,'none');
  assert.equal(sectionShowsWorkingSpace(project.sections[0]),false);
  assert.equal(sectionShowsWorkingSpace({}),true);
  assert.equal(sectionShowsWorkingSpace({}, {showResponseSpaces:false}),false);
  for(const edition of ['student','short','worked','with-short','with-worked']) {
    for(const section of flowEditionSections(project,edition)) {
      assert.equal(section.role,'exam'); assert.equal(section.workingSpace,'none');
      assert.deepEqual(section.blocks[0].content,content);
    }
  }
});
