import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {validateSemanticResult,createSemanticTasks} from '../scripts/booklet/semantic-workflow.mjs';
import {normalizePracticeInventory,validatePracticeInventory,validatePracticeAuthor} from '../scripts/booklet/practice-only-scope.mjs';
import {TRANSCRIPTION_DEFAULT} from '../scripts/booklet/transcription-settings.mjs';
import {isSelectableBankQuestion} from '../src/lib/question-bank-eligibility.js';
import {normaliseQuestion} from '../src/lib/practice-question-model.js';

test('explicit nested scope metadata survives canonicalisation and embedded parts resolve to their question',()=>{
 const original={entries:[{id:'q',kind:'question',description:'Prove'},{id:'part',kind:'part',parentId:'q',description:'Part a'},
  {id:'hint',kind:'teaching',parentId:'part',description:'Use part a',presentation:{embeddedInQuestion:'part'}},
  {id:'theory',kind:'teaching',description:'Context',presentation:{exclusionReason:'Standalone reference only'}}]};
 const result=normalizePracticeInventory(original);
 assert.equal(result.entries[2].embeddedInQuestion,'q');assert.equal(result.entries[3].exclusionReason,'Standalone reference only');
 assert.equal(original.entries[2].embeddedInQuestion,undefined);
 assert.deepEqual(normalizePracticeInventory(result),result);assert.doesNotThrow(()=>validatePracticeInventory(result));
 original.entries[2].embeddedInQuestion='q';assert.equal(normalizePracticeInventory(original).entries[2].embeddedInQuestion,'q');
});

test('scope normalisation rejects conflicting declarations, orphan embeds and vague heading exclusions',()=>{
 const entry={id:'theory',kind:'teaching',description:'Context',exclusionReason:'A',presentation:{exclusionReason:'B'}};
 assert.throws(()=>normalizePracticeInventory({entries:[entry]}),/Conflicting/);
 assert.throws(()=>normalizePracticeInventory({entries:[{id:'hint',kind:'teaching',presentation:{embeddedInQuestion:'missing'}}]}),/Unknown embedded/);
 assert.throws(()=>validatePracticeInventory({entries:[{id:'heading',kind:'teaching',description:'Important questions',presentation:{role:'Practice exercise boundary'}}]}),/exclude standalone/);
 const exact={entries:[{id:'heading',kind:'teaching',description:'6B Exercises',sourceLabel:'6B Exercises',presentation:{role:'Practice exercise boundary'}}]};
 assert.match(normalizePracticeInventory(exact).entries[0].exclusionReason,/house exercise heading/);
 exact.entries[0].presentation={headingKind:'main topic band',sourceReference:'evidence/pages/page-017.png'};
 assert.match(normalizePracticeInventory(exact).entries[0].exclusionReason,/house exercise heading/);
 exact.entries[0].description='Exercise heading and a mathematical instruction';assert.throws(()=>validatePracticeInventory(exact),/exclude standalone/);
});
import {normalizeEditableProject} from '../src/lib/editable-booklet-model.js';
import {organiseExercises} from '../src/lib/booklet-exercises.js';
import {exerciseNumbers,flowEditionSections} from '../src/lib/booklet-flow.js';
const inventory=()=>({pageNumber:4,inventoried:true,entries:[{id:'q',kind:'question',description:'True or false?'},{id:'theory',kind:'teaching',description:'Index rule',exclusionReason:'Standalone reference only'}]});
const author=()=>({pageNumber:4,sections:[{id:'s',title:'Concept Check',phase:'practice',role:'mixed-practice',blocks:[{id:'b',type:'question',classification:{reasoningScore:20,difficulty:'Foundation',difficultyReason:'Direct application in a scope-validation fixture.'},content:{id:'q',type:'question',prompt:'True or false?',answer:{short:'True',worked:'Apply the product rule.'}}}]}],inventoryMappings:[{inventoryId:'q',targetId:'q'}]});
const check=(r,i=inventory())=>validateSemanticResult(r,{stage:'author',page:4,inventory:i,contentScope:'practice-only'});

test('embedded supplied working retains its mapped content despite an explicit standalone-block exclusion',()=>{
 const i=inventory(),a=author();i.entries.push({id:'hint',kind:'teaching',embeddedInQuestion:'q',exclusionReason:'Retain within the question parent; do not create a separate teaching block.'});
 a.inventoryMappings.push({inventoryId:'hint',targetId:'q',field:'/prompt'});
 assert.doesNotThrow(()=>validatePracticeAuthor(a,i));
 a.inventoryMappings.at(-1).exclusionReason='Omit';assert.throws(()=>validatePracticeAuthor(a,i),/Practice content was excluded/);
 delete a.inventoryMappings.at(-1).exclusionReason;i.entries.at(-1).exclusionReason='Omit all supplied working';assert.throws(()=>validatePracticeAuthor(a,i),/Conflicting embedded/);
 for(const reason of ['Embedded question context; retain in the parent stem rather than authoring a standalone teaching section.','Inventory separately for coverage, but retain within the parent question rather than authoring a separate teaching section.','Inventory separately as embedded reference content; retain in the parent question rather than authoring a standalone teaching section.','Embedded instruction context; retain within the question, not as a standalone teaching section.','Embedded definition is retained once in the question parent; not a separate teaching section.']){
  i.entries.at(-1).exclusionReason=reason;i.entries.at(-1).presentation={embeddedInQuestion:'q'};delete i.entries.at(-1).embeddedInQuestion;
  assert.doesNotThrow(()=>validatePracticeAuthor(a,i));
  a.inventoryMappings.at(-1).exclusionReason=reason;assert.doesNotThrow(()=>validatePracticeAuthor(a,i));
  a.inventoryMappings.at(-1).targetId='missing';assert.throws(()=>validatePracticeAuthor(a,i),/Practice content was excluded/);a.inventoryMappings.at(-1).targetId='q';delete a.inventoryMappings.at(-1).exclusionReason;
 }
});

test('part-only continuation owns only the explicitly parented distinct local responses',()=>{
 const i={pageNumber:12,entries:[{id:'source-f',kind:'part',parentId:'whole-q',description:'Part f'},{id:'source-g',kind:'part',parentId:'whole-q',description:'Part g'}]};
 const a={sections:[{phase:'practice',blocks:[{id:'whole-q',type:'question',sourceRefs:[{pageNumber:11},{pageNumber:12}],content:{id:'whole-root',type:'question',prompt:'Evaluate:',children:[{id:'f',type:'part',prompt:'1+2'},{id:'g',type:'part',prompt:'3+4'}]}}]}],inventoryMappings:[{inventoryId:'source-f',targetId:'f'},{inventoryId:'source-g',targetId:'g'}],sharedContentContinuations:[{blockId:'whole-q',canonicalPageNumber:11,reason:'Printed parts f–g continue the earlier question.'}]};
 assert.doesNotThrow(()=>validatePracticeAuthor(a,i));
 const mutate=fn=>{const x=structuredClone(a),source=structuredClone(i);fn(x,source);assert.throws(()=>validatePracticeAuthor(x,source),/without a printed question identity/);};
 mutate(x=>delete x.sharedContentContinuations);
 mutate(x=>x.sharedContentContinuations[0].canonicalPageNumber=12);
 mutate(x=>x.sections[0].blocks[0].sourceRefs.pop());
 mutate((x,source)=>source.entries[0].parentId='unrelated');
 mutate(x=>x.inventoryMappings[1].targetId='f');
 mutate(x=>x.inventoryMappings[0].targetId='whole-root');
 mutate(x=>x.sections[0].blocks.push({...x.sections[0].blocks[0],id:'invented-q'}));
});
test('nested reference exclusions preserve teacher answers and source furniture without dropping practice content',()=>{
 const i=inventory(),a=author();
 for(const kind of ['answer','footer']){i.entries.push({id:kind,kind,description:'Reference evidence',presentation:{exclusionReason:'Reference evidence only'}});a.inventoryMappings.push({inventoryId:kind,exclusionReason:'Reference evidence only'});}
 assert.doesNotThrow(()=>check(a,i));
 delete i.entries.at(-1).presentation.exclusionReason;assert.throws(()=>check(a,i),/Practice content was excluded/);
 i.entries.at(-1).presentation.exclusionReason='Reference evidence only';
 i.entries[0].presentation={exclusionReason:'Attempted practice omission'};a.inventoryMappings[0].exclusionReason='Attempted practice omission';assert.throws(()=>check(a,i),/cannot exclude a practice question|Practice content was excluded/);
});
test('nested publisher navigation exclusion keeps exercise identity without admitting arbitrary cover omissions',()=>{
 const i=inventory(),a=author();
 i.entries.push({id:'tab',kind:'cover',description:'Exercise 3I',presentation:{exclusionReason:'Publisher exercise navigation tab; retain exercise identity in metadata.'}});
 a.inventoryMappings.push({inventoryId:'tab',exclusionReason:i.entries.at(-1).presentation.exclusionReason});
 assert.doesNotThrow(()=>check(a,i));
 i.entries.at(-1).presentation.exclusionReason='Omit chapter content';assert.throws(()=>check(a,i),/Practice content was excluded/);
});

test('mixed-page teaching excluded while embedded question working survives',()=>{
 const i=inventory();i.entries.push({id:'given',kind:'example',description:'Supplied working',embeddedInQuestion:'q'});
 const a=author();a.inventoryMappings.push({inventoryId:'given',targetId:'q',field:'/prompt'});assert.doesNotThrow(()=>check(a,i));
 delete i.entries[2].embeddedInQuestion;assert.throws(()=>check(a,i),/exclude standalone teaching/);
});

test('one numbered question keeps its independently mapped nested parts and explicit full-width source arrangement',()=>{
 const i=inventory(),a=author(),b=a.sections[0].blocks[0];
 i.entries[0].sharedStemId='q40';i.entries[0].sourceLabel='40';
 i.entries.push(...['a','b'].map(id=>({id:'source-'+id,kind:'part',parentId:'q',sourceLabel:'40('+id+')',description:'Nested proof step'})));
 delete b.content.answer;b.content.layout='list';b.content.columns=null;b.content.children=['a','b'].map(id=>({id:'part-'+id,type:'part',prompt:'Prove the result.',answer:{short:'Shown',worked:'Apply the preceding relation.'}}));
 b.sourceReview={workingSpaceEstimate:{method:'Count full-width proof lines'},arrangements:[{targetId:'q',layout:'list',columns:null,description:'Keep the supplied diagram above sequential dependent proof parts.'}]};
 a.inventoryMappings.push(...['a','b'].map(id=>({inventoryId:'source-'+id,targetId:'part-'+id})));
 assert.doesNotThrow(()=>check(a,i));
 i.entries[0].sourceLabel='Chapter 13: Circle geometry — 1';assert.doesNotThrow(()=>check(a,i));
 i.entries[0].sourceLabel='Chapter 13: Circle geometry — 1 and 2';assert.throws(()=>check(a,i),/distinct part targets/);
 i.entries[0].sourceLabel='Chapter 13: Circle geometry — 1';
 delete b.sourceReview.arrangements[0].description;assert.throws(()=>check(a,i),/full-width layout/);
 b.sourceReview.arrangements[0].description='Sequential proof';a.inventoryMappings.pop();assert.throws(()=>check(a,i),/distinct part targets/);
});
test('a declared cross-page shared-question root maps once while preserving its local parts',()=>{
 const i=inventory(),a=author(),b=a.sections[0].blocks[0];
 i.entries[0].sharedStemId='range';i.entries[0].sourceReview={sourceIdentity:{pdfPages:[3,4]}};
 i.entries.push(...['a','b'].map(id=>({id:'source-'+id,kind:'part',parentId:'q',description:'Continued part '+id})));
 b.sourceRefs=[{pageNumber:3},{pageNumber:4}];b.sourceReview={workingSpaceEstimate:{method:'Solution-informed per-part estimates'}};
 delete b.content.answer;b.content.layout='grid';b.content.columns=2;b.content.children=['a','b'].map(id=>({id:'part-'+id,type:'part',prompt:'Calculate.',answer:{short:'2',worked:'1+1=2'}}));
 a.inventoryMappings.push(...['a','b'].map(id=>({inventoryId:'source-'+id,targetId:'part-'+id})));
 a.sharedContentContinuations=[{blockId:b.id,canonicalPageNumber:3,reason:'The one printed range instruction continues from page 3.'}];
 assert.doesNotThrow(()=>check(a,i));
 delete a.sharedContentContinuations;assert.throws(()=>check(a,i),/distinct part targets/);
 i.entries[0].sourceLabel='31–32';i.entries.at(-2).sourceLabel='31';i.entries.at(-1).sourceLabel='32';
 assert.doesNotThrow(()=>check(a,i));
 a.inventoryMappings.at(-1).targetId='part-a';assert.throws(()=>check(a,i),/distinct part targets/);
});
test('subparts of an explicitly excluded teaching example remain excluded',()=>{
 const i=inventory();i.entries.push({id:'example-part',kind:'part',parentId:'theory',description:'Example part',exclusionReason:'Part of excluded theory'});
 assert.doesNotThrow(()=>check(author(),i));i.entries.at(-1).parentId='q';assert.throws(()=>check(author(),i),/cannot exclude a practice/);
});
test('practice scope rejects teaching output, review demotion and exclusion bypasses',()=>{
 let a=author();a.sections[0].phase='teaching';assert.throws(()=>check(a),/must be practice/);
 a=author();a.sections[0].blocks[0].sourceAtom={kind:'review'};assert.throws(()=>check(a),/non-selectable/);
 a=author();a.inventoryMappings.push({inventoryId:'theory',targetId:'q'});assert.throws(()=>check(a),/Excluded teaching/);
 a=author();a.inventoryMappings[0].exclusionReason='Skip';assert.throws(()=>check(a),/Practice content was excluded/);
});
test('terminal question-number punctuation preserves whole-stem ownership and still requires distinct nested parts',()=>{
 const i=inventory(),a=author(),b=a.sections[0].blocks[0];
 i.entries[0].sharedStemId='q45';i.entries[0].sourceLabel='45.';
 i.entries.push(...['a','b'].map(id=>({id:'source-'+id,kind:'part',parentId:'q',sourceLabel:'45('+id+')',description:'Existing nested response'})));
 delete b.content.answer;b.content.layout='grid';b.content.children=['a','b'].map(id=>({id:'part-'+id,type:'part',prompt:'Find the value.',answer:{short:'1',worked:'Substitute and simplify.'}}));
 b.sourceReview={workingSpaceEstimate:{method:'Existing complete solution rows'}};
 a.inventoryMappings.push(...['a','b'].map(id=>({inventoryId:'source-'+id,targetId:'part-'+id,field:'/prompt'})));
 assert.doesNotThrow(()=>check(a,i));assert.equal(i.entries[0].sourceLabel,'45.');
 a.inventoryMappings.at(-1).targetId='part-a';assert.throws(()=>check(a,i),/Shared-stem items require distinct part targets/);
 a.inventoryMappings.at(-1).targetId='part-b';i.entries[0].sourceLabel='45.5';assert.throws(()=>check(a,i),/Shared-stem items require distinct part targets/);
});
test('Concept Check and chapter reviews remain selectable through question normalisation',()=>{
 for(const label of ['Concept Check','Chapter 1 Review Set One','Chapter 1 Review Set Two']){
  const b=author().sections[0].blocks[0];b.status='approved';b.sourceAtom={kind:'practice',label};
  assert.equal(isSelectableBankQuestion(normaliseQuestion(b)),true);
 }
});
test('pixel-only tasks omit OCR and bind the selected answer images',t=>{
 const runDir=fs.mkdtempSync(path.join(os.tmpdir(),'practice-scope-'));t.after(()=>fs.rmSync(runDir,{recursive:true,force:true}));
 for(const dir of ['evidence/pages','evidence/teacher/pages'])fs.mkdirSync(path.join(runDir,dir),{recursive:true});
 for(const [dir,p] of [['evidence/pages',3],['evidence/pages',4],['evidence/teacher/pages',1]])for(const ext of ['png','txt'])fs.writeFileSync(path.join(runDir,dir,`page-${String(p).padStart(3,'0')}.${ext}`),ext==='txt'?'UNTRUSTED_OCR':'image');
 const options={runDir,manifest:{...TRANSCRIPTION_DEFAULT,selectedPages:[4],contextPages:[3],teacherPages:[1]},config:{title:'Chapter',contentScope:'practice-only',sourceEvidenceMode:'pixels',topics:[{id:'1a',title:'1A',start:4,end:6,teachingPages:[3],teacherPages:[1]}]},stage:'inventory',pages:[4]};
 const a=createSemanticTasks(options)[0];assert.doesNotMatch(a.prompt,/UNTRUSTED_OCR/);assert.match(a.prompt,/ANSWER BOOK PDF PAGE 1/);assert.match(a.prompt,/never page number alone/);
 fs.appendFileSync(path.join(runDir,'evidence/teacher/pages/page-001.png'),'changed');assert.notEqual(createSemanticTasks(options)[0].inputHash,a.inputHash);
 assert.throws(()=>createSemanticTasks({...options,pages:[3]}),/Unexpected source page/);
 assert.throws(()=>createSemanticTasks({...options,config:{...options.config,contentScope:'bad'}}),/Unsupported contentScope/);
});
test('source order survives differing ratings and save/reopen normalisation',()=>{
 const p=normalizeEditableProject({id:'p',settings:{questionOrder:'source'},sections:[{id:'s',title:'Practice',phase:'practice',topicId:'t',blocks:[3,1,2].map(n=>({id:'b'+n,type:'question',content:{id:'q'+n,type:'question',prompt:'Q'+n},flow:{localDifficulty:{reasoningScore:n}}}))}]});
 const result=normalizeEditableProject(organiseExercises(p));assert.equal(result.settings.questionOrder,'source');assert.deepEqual(result.sections[0].blocks.map(b=>b.id),['b3','b1','b2']);
});
test('whole-question identity rejects merged printed questions and extra blocks',()=>{
 const i=inventory();i.entries.push({id:'q2',kind:'question',description:'Another printed question'});
 const a=author();a.inventoryMappings.push({inventoryId:'q2',targetId:'q'});assert.throws(()=>check(a,i),/own whole question block/);
 const extra=author();extra.sections[0].blocks.push({...extra.sections[0].blocks[0],id:'extra',content:{...extra.sections[0].blocks[0].content,id:'extra-q'}});assert.throws(()=>check(extra),/without a printed question identity/);
});
test('source exercise labels remain present in answer and question navigation',()=>{
 const p=normalizeEditableProject({id:'p',topics:[{id:'t',title:'Indices',exerciseLabel:'1A'}],settings:{exerciseOrganisation:'topic'},sections:[{...author().sections[0],topicId:'t'}]});
 assert.equal(exerciseNumbers(p).t,'1A');
 const s=flowEditionSections(p,'with-short');assert.ok(s.every(x=>x.exerciseNumber==='1A'));assert.equal(s[0].difficultyTitle,'Exercise 1A');
});

// Staged regression: the source's exercise context is not another printed question number.
function nestedPrefixed(label='Exercise 3A, 2'){
 const i=inventory(),a=author(),b=a.sections[0].blocks[0];i.entries[0].sharedStemId='stem';i.entries[0].sourceLabel=label;
 i.entries.push(...['a','b'].map(id=>({id:'source-'+id,kind:'part',parentId:'q',sourceLabel:'2('+id+')',description:'Existing nested response'})));
 delete b.content.answer;b.content.layout='grid';b.content.columns=2;b.content.children=['a','b'].map(id=>({id:'part-'+id,type:'part',prompt:'Calculate.',answer:{short:'1',worked:'Substitute and simplify.'}}));b.sourceReview={workingSpaceEstimate:{method:'Reviewed solution-informed spacing'}};a.inventoryMappings.push(...['a','b'].map(id=>({inventoryId:'source-'+id,targetId:'part-'+id,field:'/prompt'})));return {i,a};
}
test('exercise-prefixed numeric source labels preserve one whole question with distinct nested parts',()=>{
 for(const label of ['Exercise3A,2','Exercise 5A, 1','Exercises 3A, Q2','Exercise 12B, Q42.','3AExercises,1','3A Exercises, Q2','3A 2','2','2.']){const {i,a}=nestedPrefixed(label);assert.doesNotThrow(()=>validatePracticeAuthor(a,i),label);assert.equal(i.entries[0].sourceLabel,label);}
});
test('numeric-prefix recognition does not admit prose, ranges, multiple roots or duplicate part ownership',()=>{
 for(const label of ['Review3A,2','Exercise Review,2','Exercise3A, Algebra','Exercise3A,2–3','Exercise3A,2a','Exercise3A,2.5','Exercise3A2','Calculate the following','2–3']){const {i,a}=nestedPrefixed(label);assert.throws(()=>validatePracticeAuthor(a,i),/Shared-stem items require distinct part targets/,label);}
 {const {i,a}=nestedPrefixed();i.entries.push({id:'other-question',kind:'question',description:'Another printed question',sourceLabel:'3',sharedStemId:'stem'});a.inventoryMappings.push({inventoryId:'other-question',targetId:'q'});assert.throws(()=>validatePracticeAuthor(a,i),/Shared-stem items require distinct part targets/);}
 {const {i,a}=nestedPrefixed();a.inventoryMappings.at(-1).targetId='part-a';assert.throws(()=>validatePracticeAuthor(a,i),/Shared-stem items require distinct part targets/);}
 {const {i,a}=nestedPrefixed();i.entries[0].sourceReview={sourceIdentity:{pdfPages:[3,4]}};assert.throws(()=>validatePracticeAuthor(a,i),/Shared-stem items require distinct part targets/);}
 {const {i,a}=nestedPrefixed();a.inventoryMappings.at(-1).targetId='q';assert.throws(()=>validatePracticeAuthor(a,i),/Shared-stem items require distinct part targets/);}
});

// Exact inventory ownership shapes from ICE-EM7 chapter10 original pages14/16/19.
const sourceWholeTaskCases=[
 {
  "name": "p14-evens-odds",
  "inventory": {
   "pageNumber": 14,
   "entries": [
    {
     "id": "p14-evens-odds",
     "kind": "question",
     "sharedStemId": "p14-evens-odds",
     "presentation": {
      "sourceIdentity": {
       "pdfPage": 14,
       "printedPage": 288,
       "exercise": "10B Problem-solving",
       "category": "Evens and odds",
       "questionLabel": "Unnumbered shared task; statements 1–5"
      },
      "layout": "One shared task with five vertically ordered editable parts, displayed a–e while retaining printed statement numbers in provenance."
     }
    },
    {
     "id": "p14-evens-odds-1",
     "kind": "part",
     "parentId": "p14-evens-odds",
     "sharedStemId": "p14-evens-odds",
     "sourceLabel": "1",
     "presentation": {
      "displayLabel": "a"
     }
    },
    {
     "id": "p14-evens-odds-2",
     "kind": "part",
     "parentId": "p14-evens-odds",
     "sharedStemId": "p14-evens-odds",
     "sourceLabel": "2",
     "presentation": {
      "displayLabel": "b"
     }
    },
    {
     "id": "p14-evens-odds-3",
     "kind": "part",
     "parentId": "p14-evens-odds",
     "sharedStemId": "p14-evens-odds",
     "sourceLabel": "3",
     "presentation": {
      "displayLabel": "c"
     }
    },
    {
     "id": "p14-evens-odds-4",
     "kind": "part",
     "parentId": "p14-evens-odds",
     "sharedStemId": "p14-evens-odds",
     "sourceLabel": "4",
     "presentation": {
      "displayLabel": "d"
     }
    },
    {
     "id": "p14-evens-odds-5",
     "kind": "part",
     "parentId": "p14-evens-odds",
     "sharedStemId": "p14-evens-odds",
     "sourceLabel": "5",
     "presentation": {
      "displayLabel": "e"
     }
    }
   ]
  },
  "packet": {
   "pageNumber": 14,
   "sections": [
    {
     "id": "source-task",
     "phase": "practice",
     "blocks": [
      {
       "id": "p14-evens-odds-question",
       "type": "question",
       "sourceRefs": [
        {
         "pageNumber": 14
        }
       ],
       "content": {
        "id": "p14-evens-odds-root",
        "type": "question",
        "prompt": {
         "format": "maths-editor-document-v1",
         "version": 1,
         "blocks": [
          {
           "id": "p14-evens-odds-title",
           "type": "paragraph",
           "align": "left",
           "inlines": [
            {
             "type": "text",
             "text": "Evens and odds",
             "marks": [
              "bold"
             ]
            }
           ]
          },
          {
           "id": "p14-evens-odds-instruction",
           "type": "paragraph",
           "align": "left",
           "inlines": [
            {
             "type": "text",
             "text": "Two whole numbers are added together. If their sum is odd, which statements below are always true? Which are always false? Which are sometimes true and sometimes false?"
            }
           ]
          }
         ]
        },
        "children": [
         {
          "id": "p14-evens-odds-a",
          "type": "part",
          "prompt": "Retained source item."
         },
         {
          "id": "p14-evens-odds-b",
          "type": "part",
          "prompt": "Retained source item."
         },
         {
          "id": "p14-evens-odds-c",
          "type": "part",
          "prompt": "Retained source item."
         },
         {
          "id": "p14-evens-odds-d",
          "type": "part",
          "prompt": "Retained source item."
         },
         {
          "id": "p14-evens-odds-e",
          "type": "part",
          "prompt": "Retained source item."
         }
        ]
       },
       "sourceReview": {
        "sourceIdentity": {
         "pdfPage": 14,
         "printedPage": 288,
         "exercise": "10B Problem-solving",
         "category": "Evens and odds",
         "questionLabel": "Unnumbered shared task; statements 1–5"
        },
        "workingSpaceEstimate": {
         "method": "solution-steps",
         "estimates": [
          {
           "targetId": "p14-evens-odds-a",
           "widthMm": 166,
           "mathematicalRows": 3,
           "answerSpaceMm": 24
          },
          {
           "targetId": "p14-evens-odds-b",
           "widthMm": 166,
           "mathematicalRows": 2,
           "answerSpaceMm": 16
          },
          {
           "targetId": "p14-evens-odds-c",
           "widthMm": 166,
           "mathematicalRows": 2,
           "answerSpaceMm": 16
          },
          {
           "targetId": "p14-evens-odds-d",
           "widthMm": 166,
           "mathematicalRows": 3,
           "answerSpaceMm": 24
          },
          {
           "targetId": "p14-evens-odds-e",
           "widthMm": 166,
           "mathematicalRows": 3,
           "answerSpaceMm": 24
          }
         ]
        }
       }
      }
     ]
    }
   ],
   "inventoryMappings": [
    {
     "inventoryId": "p14-evens-odds",
     "targetId": "p14-evens-odds-root",
     "field": "/prompt"
    },
    {
     "inventoryId": "p14-evens-odds-1",
     "targetId": "p14-evens-odds-a",
     "field": "/prompt"
    },
    {
     "inventoryId": "p14-evens-odds-2",
     "targetId": "p14-evens-odds-b",
     "field": "/prompt"
    },
    {
     "inventoryId": "p14-evens-odds-3",
     "targetId": "p14-evens-odds-c",
     "field": "/prompt"
    },
    {
     "inventoryId": "p14-evens-odds-4",
     "targetId": "p14-evens-odds-d",
     "field": "/prompt"
    },
    {
     "inventoryId": "p14-evens-odds-5",
     "targetId": "p14-evens-odds-e",
     "field": "/prompt"
    }
   ]
  }
 },
 {
  "name": "p16-obstinate-task",
  "inventory": {
   "pageNumber": 16,
   "entries": [
    {
     "id": "p16-obstinate-task",
     "kind": "question",
     "sourceLabel": "Obstinate numbers — unnumbered task",
     "sharedStemId": "p16-obstinate-task",
     "presentation": "Four related parts under one instruction. Context defines each pair as a prime number and a power of two whose sum is the given number. Source has one horizontal row of four parts; use a readable native grid."
    },
    {
     "id": "p16-obstinate-a",
     "kind": "part",
     "sourceLabel": "a",
     "parentId": "p16-obstinate-task",
     "sharedStemId": "p16-obstinate-task"
    },
    {
     "id": "p16-obstinate-b",
     "kind": "part",
     "sourceLabel": "b",
     "parentId": "p16-obstinate-task",
     "sharedStemId": "p16-obstinate-task"
    },
    {
     "id": "p16-obstinate-c",
     "kind": "part",
     "sourceLabel": "c",
     "parentId": "p16-obstinate-task",
     "sharedStemId": "p16-obstinate-task"
    },
    {
     "id": "p16-obstinate-d",
     "kind": "part",
     "sourceLabel": "d",
     "parentId": "p16-obstinate-task",
     "sharedStemId": "p16-obstinate-task"
    }
   ]
  },
  "packet": {
   "pageNumber": 16,
   "sections": [
    {
     "id": "source-task",
     "phase": "practice",
     "blocks": [
      {
       "id": "p16-obstinate-block",
       "type": "question",
       "sourceRefs": [
        {
         "pageNumber": 16
        }
       ],
       "content": {
        "id": "p16-obstinate-root",
        "type": "question",
        "prompt": {
         "format": "maths-editor-document-v1",
         "version": 1,
         "blocks": [
          {
           "id": "p16-obstinate-heading",
           "type": "paragraph",
           "inlines": [
            {
             "type": "text",
             "text": "Obstinate numbers",
             "marks": [
              "bold"
             ]
            }
           ]
          },
          {
           "id": "p16-obstinate-given",
           "type": "paragraph",
           "inlines": [
            {
             "type": "text",
             "text": "Write each number as the sum of a prime number and a power of two."
            }
           ]
          },
          {
           "id": "p16-obstinate-instruction",
           "type": "paragraph",
           "inlines": [
            {
             "type": "text",
             "text": "Try to find as many pairs as you can for these numbers:"
            }
           ]
          }
         ]
        },
        "layout": "grid",
        "columns": 4,
        "children": [
         {
          "id": "p16-obstinate-part-a",
          "type": "part",
          "prompt": "Retained source item."
         },
         {
          "id": "p16-obstinate-part-b",
          "type": "part",
          "prompt": "Retained source item."
         },
         {
          "id": "p16-obstinate-part-c",
          "type": "part",
          "prompt": "Retained source item."
         },
         {
          "id": "p16-obstinate-part-d",
          "type": "part",
          "prompt": "Retained source item."
         }
        ]
       },
       "sourceReview": {
        "sourceIdentity": {
         "exercise": "10B",
         "questionLabel": "Obstinate numbers — unnumbered task",
         "partLabels": [
          "a",
          "b",
          "c",
          "d"
         ],
         "pdfPage": 16,
         "printedPage": 290
        },
        "workingSpaceEstimate": {
         "method": "solution-steps",
         "estimates": [
          {
           "targetId": "p16-obstinate-part-a",
           "widthMm": 36,
           "mathematicalRows": 5,
           "answerSpaceMm": 46
          },
          {
           "targetId": "p16-obstinate-part-b",
           "widthMm": 36,
           "mathematicalRows": 4,
           "answerSpaceMm": 46
          },
          {
           "targetId": "p16-obstinate-part-c",
           "widthMm": 36,
           "mathematicalRows": 5,
           "answerSpaceMm": 46
          },
          {
           "targetId": "p16-obstinate-part-d",
           "widthMm": 36,
           "mathematicalRows": 6,
           "answerSpaceMm": 54
          }
         ]
        }
       }
      }
     ]
    }
   ],
   "inventoryMappings": [
    {
     "inventoryId": "p16-obstinate-task",
     "targetId": "p16-obstinate-root",
     "field": "/prompt"
    },
    {
     "inventoryId": "p16-obstinate-a",
     "targetId": "p16-obstinate-part-a"
    },
    {
     "inventoryId": "p16-obstinate-b",
     "targetId": "p16-obstinate-part-b"
    },
    {
     "inventoryId": "p16-obstinate-c",
     "targetId": "p16-obstinate-part-c"
    },
    {
     "inventoryId": "p16-obstinate-d",
     "targetId": "p16-obstinate-part-d"
    }
   ]
  }
 },
 {
  "name": "p19-question-lattice",
  "inventory": {
   "pageNumber": 19,
   "entries": [
    {
     "id": "p19-question-lattice",
     "kind": "question",
     "sharedStemId": "p19-stem-lattice",
     "presentation": {
      "groupId": "p19-group-lattice",
      "sourceIdentity": {
       "book": "ICE-EM Mathematics 7, third edition",
       "chapter": "10 Review and problem-solving",
       "exercise": "Unheaded lattice-multiplication practice preceding 10C Number bases",
       "questionLabels": [
        "1",
        "2",
        "3"
       ],
       "pdfPage": 19,
       "printedPage": 293
      },
      "layout": "One shared parent instruction with three editable alphabetical parts in printed numerical order. Source places the items in one horizontal row.",
      "teachingContext": {
       "inspectedTeachingPdfPages": [
        19
       ],
       "taughtMethod": "Lattice multiplication of decimals: add diagonals from bottom right, carry into the next diagonal and locate the decimal point using the bold diagonal.",
       "limitation": "The beginning of the worked example is on an unavailable preceding page."
      }
     }
    },
    {
     "id": "p19-part-1",
     "kind": "part",
     "parentId": "p19-question-lattice",
     "sourceLabel": "1",
     "sharedStemId": "p19-stem-lattice",
     "presentation": {
      "displayLabel": "a",
      "sourceIdentity": {
       "pdfPage": 19,
       "printedPage": 293,
       "questionLabel": "1"
      },
      "teachingContext": {
       "inspectedTeachingPdfPages": [
        19
       ],
       "taughtMethod": "Decimal lattice multiplication.",
       "mappingRationale": "Directly applies the demonstrated lattice method to two three-decimal-place factors."
      },
      "requiredResponseSpace": "Space to construct and complete a three-by-three lattice and record the decimal product; physical dimensions require authoring-stage estimation."
     }
    },
    {
     "id": "p19-part-2",
     "kind": "part",
     "parentId": "p19-question-lattice",
     "sourceLabel": "2",
     "sharedStemId": "p19-stem-lattice",
     "presentation": {
      "displayLabel": "b",
      "sourceIdentity": {
       "pdfPage": 19,
       "printedPage": 293,
       "questionLabel": "2"
      },
      "teachingContext": {
       "inspectedTeachingPdfPages": [
        19
       ],
       "taughtMethod": "Decimal lattice multiplication.",
       "mappingRationale": "Applies the demonstrated method to factors with four and three significant digits and different decimal-place counts."
      },
      "requiredResponseSpace": "Space to construct and complete a four-by-three lattice and record the decimal product; physical dimensions require authoring-stage estimation."
     }
    },
    {
     "id": "p19-part-3",
     "kind": "part",
     "parentId": "p19-question-lattice",
     "sourceLabel": "3",
     "sharedStemId": "p19-stem-lattice",
     "presentation": {
      "displayLabel": "c",
      "sourceIdentity": {
       "pdfPage": 19,
       "printedPage": 293,
       "questionLabel": "3"
      },
      "teachingContext": {
       "inspectedTeachingPdfPages": [
        19
       ],
       "taughtMethod": "Decimal lattice multiplication.",
       "mappingRationale": "Extends the demonstrated method to two four-significant-digit decimal factors."
      },
      "requiredResponseSpace": "Space to construct and complete a four-by-four lattice and record the decimal product; physical dimensions require authoring-stage estimation."
     }
    }
   ]
  },
  "packet": {
   "pageNumber": 19,
   "sections": [
    {
     "id": "source-task",
     "phase": "practice",
     "blocks": [
      {
       "id": "p19-question-lattice",
       "type": "question",
       "sourceRefs": [
        {
         "pageNumber": 19
        }
       ],
       "content": {
        "id": "p19-question-lattice-root",
        "type": "question",
        "prompt": "Try these problems using this method.",
        "layout": "grid",
        "columns": 3,
        "children": [
         {
          "id": "p19-question-lattice-a",
          "type": "part",
          "prompt": "Retained source item."
         },
         {
          "id": "p19-question-lattice-b",
          "type": "part",
          "prompt": "Retained source item."
         },
         {
          "id": "p19-question-lattice-c",
          "type": "part",
          "prompt": "Retained source item."
         }
        ]
       },
       "sourceReview": {
        "sourceIdentity": {
         "book": "ICE-EM Mathematics 7, third edition",
         "chapter": "10 Review and problem-solving",
         "exercise": "10B — The grid method of multiplying decimals",
         "questionLabels": [
          "1",
          "2",
          "3"
         ],
         "pdfPage": 19,
         "printedPage": 293
        },
        "workingSpaceEstimate": {
         "method": "solution-steps",
         "estimates": [
          {
           "targetId": "p19-question-lattice-a",
           "widthMm": 50,
           "mathematicalRows": 7,
           "answerSpaceMm": 65
          },
          {
           "targetId": "p19-question-lattice-b",
           "widthMm": 50,
           "mathematicalRows": 8,
           "answerSpaceMm": 73
          },
          {
           "targetId": "p19-question-lattice-c",
           "widthMm": 50,
           "mathematicalRows": 9,
           "answerSpaceMm": 83
          }
         ]
        }
       }
      }
     ]
    }
   ],
   "inventoryMappings": [
    {
     "inventoryId": "p19-question-lattice",
     "targetId": "p19-question-lattice-root",
     "field": "/prompt"
    },
    {
     "inventoryId": "p19-part-1",
     "targetId": "p19-question-lattice-a",
     "field": "/prompt"
    },
    {
     "inventoryId": "p19-part-2",
     "targetId": "p19-question-lattice-b",
     "field": "/prompt"
    },
    {
     "inventoryId": "p19-part-3",
     "targetId": "p19-question-lattice-c",
     "field": "/prompt"
    }
   ]
  }
 }
];
const wholeTaskFixture=(index=0)=>structuredClone(sourceWholeTaskCases[index]);
for(const[index,row]of sourceWholeTaskCases.entries())test('source-evidenced unnumbered whole root: '+row.name,()=>{const f=wholeTaskFixture(index);assert.doesNotThrow(()=>validatePracticeAuthor(f.packet,f.inventory));});
test('unnumbered whole root rejects orphaned source parts',()=>{const f=wholeTaskFixture();f.inventory.entries[1].parentId='missing';assert.throws(()=>validatePracticeAuthor(f.packet,f.inventory),/distinct part targets|whole-task/);});
test('unnumbered whole root rejects a sibling question sharing the stem',()=>{const f=wholeTaskFixture();const q=structuredClone(f.inventory.entries[0]);q.id+='-sibling';f.inventory.entries.push(q);f.packet.inventoryMappings.push({inventoryId:q.id,targetId:f.packet.sections[0].blocks[0].content.id,field:'/prompt'});assert.throws(()=>validatePracticeAuthor(f.packet,f.inventory),/distinct part targets/);});
test('unnumbered whole root rejects duplicate part targets',()=>{const f=wholeTaskFixture();const q=f.inventory.entries[0];const parts=f.packet.inventoryMappings.filter(m=>m.inventoryId!==q.id);parts[1].targetId=parts[0].targetId;assert.throws(()=>validatePracticeAuthor(f.packet,f.inventory),/distinct part targets/);});
test('generic prose does not declare an unnumbered whole source task',()=>{const f=wholeTaskFixture();f.inventory.entries[0].presentation.sourceIdentity.questionLabel='Discussion';assert.throws(()=>validatePracticeAuthor(f.packet,f.inventory),/distinct part targets/);});
test('unnumbered whole instruction cannot be remapped into its child',()=>{const f=wholeTaskFixture();f.packet.inventoryMappings.find(m=>m.inventoryId===f.inventory.entries[0].id).targetId=f.packet.sections[0].blocks[0].content.children[0].id;assert.throws(()=>validatePracticeAuthor(f.packet,f.inventory),/whole-task instruction/);});
test('unnumbered whole source root retains same-page and spacing guards',()=>{let f=wholeTaskFixture();f.packet.sections[0].blocks[0].sourceRefs.push({pageNumber:13});assert.throws(()=>validatePracticeAuthor(f.packet,f.inventory),/distinct part targets/);f=wholeTaskFixture();delete f.packet.sections[0].blocks[0].sourceReview.workingSpaceEstimate;assert.throws(()=>validatePracticeAuthor(f.packet,f.inventory),/solution-informed spacing/);});

test('explicit printed task identity is read beside an exercise heading, including nested sourceReview metadata',()=>{
 for(const nested of [false,true]){
  const f=wholeTaskFixture(),q=f.inventory.entries[0],identity=structuredClone(q.presentation.sourceIdentity);
  delete identity.questionLabel;identity.printedQuestionLabel='Unnumbered shared task';q.sourceLabel='Exercise 7E';
  q.presentation=nested?{sourceReview:{sourceIdentity:identity}}:{sourceIdentity:identity};
  assert.doesNotThrow(()=>validatePracticeAuthor(f.packet,f.inventory));
  for(const change of [v=>v.inventory.entries[0].presentation[nested?'sourceReview':'sourceIdentity'][nested?'sourceIdentity':'printedQuestionLabel']=nested?{...identity,printedQuestionLabel:'Discussion'}:'Discussion',v=>v.packet.inventoryMappings[2].targetId=v.packet.inventoryMappings[1].targetId,v=>v.packet.sections[0].blocks[0].sourceRefs.push({pageNumber:999})]){
   const invalid=structuredClone(f);change(invalid);assert.throws(()=>validatePracticeAuthor(invalid.packet,invalid.inventory));
  }
  identity.pdfPages=[14,15];assert.throws(()=>validatePracticeAuthor(f.packet,f.inventory),/distinct part targets/);
 }
});
