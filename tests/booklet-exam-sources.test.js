import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {mathsBaseSource, approvedMathsBaseSource, normaliseQuestionSource,sourceAttributionPromptId} from '../src/lib/question-source.js';
import {normaliseQuestion, containsSourceMetadata} from '../src/lib/practice-question-model.js';
import {selectExamCandidates, readMathsBase} from '../scripts/booklet/export-mathsbase-exams.mjs';
import {normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
import {flowEditionSections} from '../src/lib/booklet-flow.js';
import {sectionShowsWorkingSpace} from '../src/lib/booklet-section-options.js';
import {visibleImportedQuestionTitle} from '../src/lib/booklet-preview.js';
import {withoutWorkingSpace,arrangementExamTitle} from '../src/lib/booklet-arrangement.js';
import {createProgrammeExamSection} from '../pedagogy/programme-exam.mjs';

test('retained Sydney Grammar 2019 grouped-data source keeps exact year and course',()=>{
  assert.deepEqual(approvedMathsBaseSource('HSC.SYDGR.Y12.STN.2019 Q20'),{
    provider:'HSC-school',paper:'Y12 Standard',year:'2019',
    label:'Sydney Grammar School Y12 Standard 2019',origin:'MathsBase',
  });
  assert.equal(approvedMathsBaseSource('HSC.SYDGR.Y12.STN.2019 Q21').needsSchoolMapping,true);
});

test('two exact simultaneous sources preserve neighbouring school holds',()=>{
  assert.equal(approvedMathsBaseSource('HSC.SYDGR.Y12.STN.2020 Q42').label,'Sydney Grammar School Y12 Standard 2020');
  assert.equal(approvedMathsBaseSource('HSC.HORNSG.Y12.STN.2024 Q34').label,'Hornsby Girls High School Y12 Standard 2024');
  assert.equal(approvedMathsBaseSource('HSC.SYDGR.Y12.STN.2020 Q41').needsSchoolMapping,true);
  assert.equal(approvedMathsBaseSource('HSC.HORNSG.Y12.STN.2024 Q35').needsSchoolMapping,true);
});

test('reviewed function and identity sources admit only their exact literal codes',()=>{
 for(const [code,label]of [
  ['HSC.SYDGR.Y11.ADV.2019 Q9e','Sydney Grammar School Y11 Advanced 2019'],
  ['HSC.NORM.Y11.ADV.2020 Q8a','Normanhurst Boys Y11 Advanced 2020'],
  ['HSC.NSB.Y11.ADV.2024 Q10','North Sydney Boys High School Y11 Advanced 2024'],
  ['HSC.NSB.Y11.ADV.2024 Q26','North Sydney Boys High School Y11 Advanced 2024'],
  ['HSC.NEAP.Y11.X1.2023 Q11e','Neap Education Y11 Extension 1 2023'],
  ['HSC.SYDG.Y11.X1.2019 Q2d','Sydney Girls High School Y11 Extension 1 2019'],
  ['HSC.KNOX.Y11.ADV.2020 Q12c','Knox Grammar Y11 Advanced 2020'],
  ['HSC.SYDGR.Y11.ADV.2019 Q11a','Sydney Grammar School Y11 Advanced 2019'],
  ['HSC.NEAP.Y12.STN.2023 Q24','Neap Education Y12 Standard 2023'],
  ['HSC.SYDGR.Y12.STN.2020 Q25','Sydney Grammar School Y12 Standard 2020'],
  ['HSC.SYDGR.Y12.STN.2021 Q26','Sydney Grammar School Y12 Standard 2021'],
  ['HSC.NEAP.Y11.X1.2021 Q12b','Neap Education Y11 Extension 1 2021'],
  ['HSC.NORM.Y12.X2.2024 Q4','Normanhurst Boys Y12 Extension 2 2024'],
  ['HSC.HORNSG.Y12.X1.2023 Q12b','HORNSG Y12 Extension 1 2023'],
 ]){
  assert.equal(approvedMathsBaseSource(code).label,label,code);
  assert.equal(approvedMathsBaseSource(code.replace(/Q\S+$/,'Q99999')).needsSchoolMapping,true,code);
 }
});

test('reviewed Year 11 Advanced source mappings retain their literal context',()=>{
  for(const [code,label] of [
    ['HSC.NEAP.Y11.ADV.2023 Q9','Neap Education Y11 Advanced 2023'],
    ['HSC.SYDGR.Y11.ADV.2021 Q12c','Sydney Grammar School Y11 Advanced 2021'],
    ['HSC.NSG.Y11.ADV.2022 Q34','North Sydney Girls High School Y11 Advanced 2022'],
    ['HSC.SYDG.Y11.ADV.2020 Q1b','Sydney Girls High School Y11 Advanced 2020'],
    ['HSC.SYDGR.Y11.STN.2020 Q11','Sydney Grammar School Y11 Standard 2020'],
    ['HSC.SGG.Y11.ADV.2023 Q5','St George Girls High School Y11 Advanced 2023'],
    ['HSC.SGG.Y11.ADV.2019 Q20','St George Girls High School Y11 Advanced 2019'],
  ]){
    const source=approvedMathsBaseSource(code);
    assert.equal(source.label,label);
    assert.equal(source.paper,code.includes('.STN.')?'Y11 Standard':'Y11 Advanced');
    assert.doesNotMatch(source.label,/trial/i);
    const section={id:'exam',role:'exam',phase:'practice',workingSpace:'none',blocks:[{id:code,type:'question',sourceReview:{origin:{provider:'MathsBase',sourceCode:code}},content:{id:code+'-root',type:'question',prompt:'Find x.'}}]},before=structuredClone(section);
    const result=createProgrammeExamSection(section);
    assert.equal(result.report.valid,true);
    assert.equal(result.section.blocks[0].sourceReview.origin.sourceCode,code);
    assert.deepEqual(section,before);
  }
  for(const code of ['HSC.UNKNOWN.Y11.ADV.2023 Q9','HSC.KNOX.Y11.ADV.2021 Q1','HSC.NEAP.Y11.X1.2023 Q9','HSC.NSG.Y11.STN.2020 Q1','HSC.NSG.Y11.ADV.2022.BAD Q1','HSC.SYDGR.Y11.ADV.2019 Q1'])assert.equal(approvedMathsBaseSource(code).needsSchoolMapping,true,code);
  for(const code of ['CAIE.0580.2022 Q1','MB.Y11.ADV.2023 Q9','HSC.NEAP.Y11.AMC.2023 Q9'])assert.equal(approvedMathsBaseSource(code),null,code);
  assert.equal(approvedMathsBaseSource('HSC.NEAP.Y12.X1.2021 Q13b').label,'Neap Education Y12 Extension 1 2021');
});

test('retained source papers preserve explicit course and omitted year level',()=>{
  const standard=approvedMathsBaseSource('HSC.CSSA.STN.2019 Q13');
  assert.equal(standard.label,'CSSA Standard 2019');
  assert.equal(standard.paper,'Standard');
  assert.doesNotMatch(standard.label,/Y11|Y12|trial/i);
  assert.equal(approvedMathsBaseSource('HSC.NSG.Y12.X2.2022 Q14d').label,'North Sydney Girls High School Y12 Extension 2 2022');
  for(const code of ['HSC.CSSA.STN.2018 Q13','HSC.CSSA.STN.2020 Q13','HSC.SGG.Y12.ADV.2019 Q1','HSC.SGG.Y11.STN.2019 Q1','HSC.NSG.Y12.X2.2023 Q1','HSC.CSSA.STN.2019.BAD Q1','HSC.KNOX.Y11.ADV.2018 Q1'])assert.equal(approvedMathsBaseSource(code).needsSchoolMapping,true,code);
});

test('printed source round-trips without accepting extraction provenance',()=>{
  const source={provider:'HSC',paper:'Advanced',year:2011,label:'HSC Advanced 2011',origin:'MathsBase'};
  const question=normaliseQuestion({id:'q',source,content:{type:'question',prompt:'Find x.'}});
  assert.deepEqual(question.source,normaliseQuestionSource(source));
  assert.equal(containsSourceMetadata(question),false);
  assert.equal(containsSourceMetadata({...question,source:{...source,file:'evidence.pdf'}}),true);
  assert.equal(containsSourceMetadata({...question,content:{...question.content,source}}),true);
  assert.equal('source' in normaliseQuestion({id:'old'}),false);
  assert.equal(visibleImportedQuestionTitle({title:'2012 HSC Extension 1 Band 4',source:{label:'HSC Extension 1 2012'}}),'');
  assert.equal(visibleImportedQuestionTitle({title:'2012 HSC Extension 1 Band 4'}),'2012 HSC Extension 1');
  const block={type:'question',source,content:{id:'root',prompt:'Stem.'}};
  assert.equal(arrangementExamTitle(block,{ownerId:'root',editorKey:'root/prompt'}),'HSC Advanced 2011');
  assert.equal(arrangementExamTitle(block,{ownerId:'root',editorKey:'root/prompt#table'}),'');
  const multipart={...block,content:{id:'root',prompt:'',children:[{id:'part-a',prompt:'First task.'},{id:'part-b',prompt:'Next task.'}]}};
  assert.equal(sourceAttributionPromptId(multipart),'part-a');
  assert.equal(arrangementExamTitle(multipart,{ownerId:'part-a',editorKey:'part-a/prompt'}),'HSC Advanced 2011');
  assert.equal(arrangementExamTitle(multipart,{ownerId:'part-b',editorKey:'part-b/prompt'}),'');
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

test('resolved source identities preserve course tokens without inventing school or trial provenance',()=>{
  assert.equal(approvedMathsBaseSource('HSC.CSSA.X1.2023 Q13e').label,'CSSA Extension 1 2023');
  assert.equal(approvedMathsBaseSource('HSC.NEAP.Y12.X1.2021 Q13b').provider,'HSC-provider');
  assert.equal(approvedMathsBaseSource('HSC.NEAP.Y12.X1.2021 Q13b').label,'Neap Education Y12 Extension 1 2021');
  assert.equal(approvedMathsBaseSource('HSC.SGG.Y12.ADV.2020 Q22').label,'St George Girls High School Y12 Advanced 2020');
  assert.equal(approvedMathsBaseSource('HSC.SYDGR.Y12.X1.2022 Q12c').label,'Sydney Grammar School Y12 Extension 1 2022');
  const internal=approvedMathsBaseSource('HSC.SYDG.Y12.ADV.2021 Q7');
  assert.equal(internal.provider,'HSC-school');
  assert.equal(internal.label,'Sydney Girls High School Y12 Advanced 2021');
  assert.doesNotMatch(internal.label,/trial/i);
  for(const code of ['HSC.UNKNOWN.Y12.ADV.2020 Q23','HSC.SYDG.Y11.X1.2021 Q7','HSC.NEAP.Y12.X2.2021 Q1','HSC.SGG.Y12.ADV.2019 Q1','HSC.CSSA.X1.2023.BAD Q1'])assert.equal(approvedMathsBaseSource(code).needsSchoolMapping,true);
  assert.equal(approvedMathsBaseSource('CAIE.0606.2023 Q1'),null);
  assert.equal(approvedMathsBaseSource('HSC.BHHS.Y12.ADV.2025 Q24').label,'BHHS Y12 ADV 2025');
});
test('user-confirmed school names and three paper exceptions keep nearby papers held',()=>{
  for(const [code,name] of Object.entries({NORM:'Normanhurst Boys',ABBOT:'Abbotsleigh',MER:'Meriden',KNOX:'Knox Grammar'})) {
    assert.equal(approvedMathsBaseSource(`HSC.${code}.Y12.ADV.2022 Q1`).label,`${name} Y12 Advanced 2022`);
  }
  for(const [code,label] of [
    ['HSC.NORM.Y11.X1.2020 Q11c','Normanhurst Boys Y11 Extension 1 2020'],
    ['HSC.KNOX.Y11.ADV.2019 Q13b','Knox Grammar Y11 Advanced 2019'],
    ['HSC.KNOX.Y11.ADV.2022 Q15e','Knox Grammar Y11 Advanced 2022'],
  ]) assert.equal(approvedMathsBaseSource(code).label,label);
  for(const code of ['HSC.NORM.Y11.X1.2021 Q11c','HSC.NORM.Y11.ADV.2020 Q11c','HSC.KNOX.Y11.ADV.2020 Q13b','HSC.KNOX.Y11.ADV.2021 Q13b','HSC.KNOX.Y11.X1.2022 Q15e','HSC.ABBOT.Y11.X1.2020 Q11c','HSC.MER.Y11.ADV.2019 Q1','HSC.KNOX.Y11.ADV.2022.BAD Q1']) assert.equal(approvedMathsBaseSource(code).needsSchoolMapping,true);
});
test('four exact-paper school mappings preserve assessment context without a trial claim',()=>{
  const cases=[['HSC.JRUSE.Y12.X1.2023 Q17b','James Ruse Agricultural High School Y12 Extension 1 2023'],['HSC.NSB.Y12.ADV.2024 Q31','North Sydney Boys High School Y12 Advanced 2024'],['HSC.NSG.Y12.ADV.2022 Q32','North Sydney Girls High School Y12 Advanced 2022'],['HSC.SYDB.Y12.X1.2024 Q14b','Sydney Boys High School Y12 Extension 1 2024']];
  for(const[code,label]of cases){const source=approvedMathsBaseSource(code);assert.equal(source.provider,'HSC-school');assert.equal(source.label,label);assert.doesNotMatch(source.label,/trial/i);}
  assert.equal(approvedMathsBaseSource('HSC.NSB.Y12.ADV.2024.BAD Q31').needsSchoolMapping,true);
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


test('no-working projection removes reserved ancestor minima only and preserves native cells/diagrams',()=>{
 const tree={id:'root',type:'group',minHeight:48,children:[{id:'prompt',type:'item',ref:'prompt'},{id:'part',type:'group',minHeight:36,children:[{id:'cell',type:'item',ref:'cell',minHeight:12},{id:'diagram',type:'item',ref:'diagram',width:60,height:40},{id:'space',type:'item',ref:'space',height:24}]},{id:'meaningful',type:'group',minHeight:22,children:[{id:'label',type:'item',ref:'label'}]}]};
 const original=structuredClone(tree),entries=new Map([['prompt',{kind:'document'}],['cell',{kind:'document'}],['diagram',{kind:'diagram'}],['space',{kind:'space'}],['label',{kind:'document'}]]),out=withoutWorkingSpace(tree,entries);
 assert.deepEqual(tree,original);assert.equal(out.minHeight,undefined);assert.equal(out.children[1].minHeight,undefined);assert.equal(out.children[1].children.length,2);assert.deepEqual(out.children[1].children[0],tree.children[1].children[0]);assert.deepEqual(out.children[1].children[1],tree.children[1].children[1]);assert.deepEqual(out.children[2],tree.children[2]);
});

test('PLC COM course marker is retained literally without broadening provider whitelist',()=>{
  for(const [code,label] of [
    ['PLC.Y9.COM.2022.S2 S1Q22','PLC Y9 COM S2 2022'],
    ['PLC.Y9.COM.2023.S2 S1Q10b','PLC Y9 COM S2 2023'],
    ['PLC.Y9.COM.2023.T1 S1Q5a','PLC Y9 COM T1 2023'],
    ['PLC.Y9.COM.2023.T1 S1Q5b','PLC Y9 COM T1 2023'],
    ['PLC.Y9.COM.2023.T1 S2Q8a','PLC Y9 COM T1 2023'],
    ['PLC.Y9.COM.2023.T1 S2Q8b','PLC Y9 COM T1 2023'],
    ['PLC.Y10.COM.2022.S2 S1Q8','PLC Y10 COM S2 2022'],
    ['PLC.Y10.COM.2024.T3 S2Q7b','PLC Y10 COM T3 2024'],
  ]) {
    const source=mathsBaseSource(code);
    assert.equal(source.label,label);
    assert.equal(source.provider,'PLC');
    assert.equal(source.origin,'MathsBase');
    assert.equal(source.paper,label.slice(4,-5));
  }
  for(const code of ['PLC.Y9.UNKNOWN.2022.S2','PLC.COM.2022','MB.Y9.COM.2022','CAIE.Y9.COM.2022','PLC.Y9.COM.SM.2022'])assert.equal(mathsBaseSource(code),null);
});


test('literal PLC ADD/FUN and verified official STN1 labels retain all15 observed base codes',()=>{
 const cases=[
  ["PLC.Y10.ADD.2025.S2",{"provider":"PLC","paper":"Y10 ADD S2","year":"2025","label":"PLC Y10 ADD S2 2025","origin":"MathsBase"}],
  ["PLC.Y10.ADD.2022.S2",{"provider":"PLC","paper":"Y10 ADD S2","year":"2022","label":"PLC Y10 ADD S2 2022","origin":"MathsBase"}],
  ["PLC.Y10.ADD.2023.S2",{"provider":"PLC","paper":"Y10 ADD S2","year":"2023","label":"PLC Y10 ADD S2 2023","origin":"MathsBase"}],
  ["PLC.Y10.ADD.2024.S2",{"provider":"PLC","paper":"Y10 ADD S2","year":"2024","label":"PLC Y10 ADD S2 2024","origin":"MathsBase"}],
  ["PLC.Y10.FUN.2023.S2",{"provider":"PLC","paper":"Y10 FUN S2","year":"2023","label":"PLC Y10 FUN S2 2023","origin":"MathsBase"}],
  ["PLC.Y10.FUN.2024.S2",{"provider":"PLC","paper":"Y10 FUN S2","year":"2024","label":"PLC Y10 FUN S2 2024","origin":"MathsBase"}],
  ["HSC.STN1.2021",{"provider":"HSC","paper":"Standard 1","year":"2021","label":"HSC Standard 1 2021","origin":"MathsBase"}],
  ["PLC.Y10.FUN.2022.S2",{"provider":"PLC","paper":"Y10 FUN S2","year":"2022","label":"PLC Y10 FUN S2 2022","origin":"MathsBase"}],
  ["PLC.Y10.ADD.2025.T1",{"provider":"PLC","paper":"Y10 ADD T1","year":"2025","label":"PLC Y10 ADD T1 2025","origin":"MathsBase"}],
  ["HSC.STN1.2022",{"provider":"HSC","paper":"Standard 1","year":"2022","label":"HSC Standard 1 2022","origin":"MathsBase"}],
  ["HSC.STN1.2020",{"provider":"HSC","paper":"Standard 1","year":"2020","label":"HSC Standard 1 2020","origin":"MathsBase"}],
  ["HSC.STN1.2025",{"provider":"HSC","paper":"Standard 1","year":"2025","label":"HSC Standard 1 2025","origin":"MathsBase"}],
  ["HSC.STN1.2019",{"provider":"HSC","paper":"Standard 1","year":"2019","label":"HSC Standard 1 2019","origin":"MathsBase"}],
  ["HSC.STN1.2023",{"provider":"HSC","paper":"Standard 1","year":"2023","label":"HSC Standard 1 2023","origin":"MathsBase"}],
  ["HSC.STN1.2024",{"provider":"HSC","paper":"Standard 1","year":"2024","label":"HSC Standard 1 2024","origin":"MathsBase"}],
 ];
 for(const [code,expected]of cases){assert.deepEqual(mathsBaseSource(code),expected);assert.deepEqual(mathsBaseSource(code+' Q1a'),expected);assert.deepEqual(Object.keys(mathsBaseSource(code)).sort(),['label','origin','paper','provider','year']);}
});

test('ADD/FUN and STN1 recognition preserves unknown-school holds and excluded providers',()=>{
 for(const code of ["PLC.Y10.UNKNOWN.2025.S2","PLC.Y10.ADDITION.2025.S2","PLC.Y10.FUNCTION.2025.S2","PLC.Y10.STN1.2025.S2","PLC.ADD.2025","PLC.FUN.2025"])assert.equal(mathsBaseSource(code),null);
 for(const code of ["HSC.UNKNOWN.Y12.2025","HSC.BHHS.Y11.X1.2022 Q13b","HSC.STN10.2025","HSC.STN2.2025"]){const source=mathsBaseSource(code);assert.equal(source.needsSchoolMapping,true);assert.equal(source.provider,'HSC-trial');assert.equal(source.label,undefined);}
 for(const code of ["CAIE.2025","MB.2025","GEN.2025","LBNZ.2025","AU.AMC.2025","SmarterMaths.2025","HSC.SmarterMaths.2025","HSC.SM.2025","PLC.Y10.ADD.MB.2025.S2","PLC.Y10.FUN.CAIE.2025.S2","PLC.Y10.ADD.SmarterMaths.2025.S2","OTHER.Y10.ADD.2025.S2"])assert.equal(mathsBaseSource(code),null);
 const printed=normaliseQuestionSource({...mathsBaseSource('HSC.STN1.2025'),sourceCode:'HSC.STN1.2025',eligible:true,needsSchoolMapping:false});
 assert.deepEqual(Object.keys(printed).sort(),['label','origin','paper','provider','year']);
 assert.deepEqual(printed,mathsBaseSource('HSC.STN1.2025'));
});

test('two user-approved exact source exceptions do not widen school course or year gates',()=>{
 for(const [code,label] of [['HSC.JRUSE.Y12.X2.2022 Q13c','James Ruse Agricultural High School Y12 Extension 2 2022'],['HSC.NORM.Y11.X1.2019 Q12b','Normanhurst Boys Y11 Extension 1 2019']]){const source=approvedMathsBaseSource(code);assert.equal(source.provider,'HSC-school');assert.equal(source.label,label);assert.equal(source.origin,'MathsBase');assert.equal(source.year,code.includes('2019')?'2019':'2022');}
 for(const code of ['HSC.JRUSE.Y12.X2.2022 Q13b','HSC.JRUSE.Y12.X2.2022 Q13d','HSC.JRUSE.Y12.X2.2021 Q13c','HSC.JRUSE.Y11.X2.2022 Q13c','HSC.NORM.Y11.X1.2019 Q12a','HSC.NORM.Y11.X1.2019 Q12c','HSC.NORM.Y11.X1.2018 Q12b','HSC.NORM.Y11.ADV.2019 Q12b','HSC.NORM.Y11.X1.2019.BAD Q12b'])assert.equal(approvedMathsBaseSource(code).needsSchoolMapping,true,code);
 assert.equal(approvedMathsBaseSource('HSC.NORM.Y11.X1.2020 Q11c').label,'Normanhurst Boys Y11 Extension 1 2020');
 assert.equal(approvedMathsBaseSource('HSC.NSB.Y12.X2.2022 Q13e').label,'North Sydney Boys High School Y12 Extension 2 2022');
});

test('Financial exact Sydney Grammar source preserves neighbouring course holds',()=>{
 assert.equal(approvedMathsBaseSource('HSC.SYDGR.Y12.STN.2024 Q27').label,'Sydney Grammar School Y12 Standard 2024');
 for(const code of ['HSC.SYDGR.Y12.STN.2024 Q26','HSC.SYDGR.Y12.STN.2024 Q28','HSC.SYDGR.Y12.STN.2023 Q27'])assert.equal(approvedMathsBaseSource(code).needsSchoolMapping,true,code);
});

test('FTC exact school sources preserve neighbouring Extension 2 holds',()=>{
 assert.equal(approvedMathsBaseSource('HSC.ABBOT.Y12.X2.2023 Q15c').label,'Abbotsleigh Y12 Extension 2 2023');
 assert.equal(approvedMathsBaseSource('HSC.NSB.Y12.X2.2020 Q13c').label,'North Sydney Boys High School Y12 Extension 2 2020');
 for(const code of ['HSC.ABBOT.Y12.X2.2023 Q15b','HSC.ABBOT.Y12.X2.2023 Q15d','HSC.ABBOT.Y12.X2.2022 Q15c','HSC.NSB.Y12.X2.2020 Q13b','HSC.NSB.Y12.X2.2020 Q13d','HSC.NSB.Y12.X2.2021 Q13c'])assert.equal(approvedMathsBaseSource(code).needsSchoolMapping,true,code);
});

test('Inverse Trig exact NSB E3 attribution preserves adjacent source holds',()=>{
 assert.equal(approvedMathsBaseSource('HSC.NSB.Y11.X1.2023 QE3').label,'North Sydney Boys High School Y11 Extension 1 2023');
 for(const code of ['HSC.NSB.Y11.X1.2023 QE2','HSC.NSB.Y11.X1.2023 QE4','HSC.NSB.Y11.X1.2022 QE3'])assert.equal(approvedMathsBaseSource(code).needsSchoolMapping,true,code);
});

test('Further Areas exact Extension 2 attributions preserve adjacent holds',()=>{
 for(const [code,label] of [['HSC.NORM.Y12.X2.2024 Q16b','Normanhurst Boys Y12 Extension 2 2024'],['HSC.NSG.Y12.X2.2024 Q15a','North Sydney Girls High School Y12 Extension 2 2024'],['HSC.JRUSE.Y12.X2.2020 Q9','James Ruse Agricultural High School Y12 Extension 2 2020']])assert.equal(approvedMathsBaseSource(code).label,label);
 for(const code of ['HSC.NORM.Y12.X2.2024 Q16a','HSC.NORM.Y12.X2.2023 Q16b','HSC.NSG.Y12.X2.2024 Q15b','HSC.NSG.Y12.X2.2023 Q15a','HSC.JRUSE.Y12.X2.2020 Q10','HSC.JRUSE.Y12.X2.2021 Q9'])assert.equal(approvedMathsBaseSource(code).needsSchoolMapping,true,code);
});
