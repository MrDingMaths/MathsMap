import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createSourceSelectionContext, inventorySourceText, normalizeSourceExcerpt, readSelectedEvidence, selectSourceEvidence, writeSourceSelectionInventory } from '../scripts/content/campaign-source-selection.mjs';
import { hashValue } from '../scripts/content/campaign-sources.mjs';

function fixture(t,{stage=4,title='Add fractions',blurb='Add fractions using common denominators.'}={}) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'mathsmap-source-selection-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const write=(name,value)=>{const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==='string'?value:JSON.stringify(value));};
  const skill={id:'test-skill',title,blurb,stage,dotPointIds:['dp'],prereqs:[]};
  write('data/skills.json',[skill]);write('data/topics.json',[{id:'topic',stage,courses:['course'],title}]);write('data/courses.json',[{id:'course',stage,order:1}]);write('data/dotpoints.json',[{id:'dp',topicId:'topic',text:blurb,order:1}]);
  write('booklets/provenance/content-campaign/test/campaign.json',{skillIds:['test-skill'],membershipHash:'frozen'});
  write('booklets/provenance/content-campaign/test/skills/test-skill.json',{scope:{stage,topicId:'topic',dotPointId:'dp'},sources:[],baseline:{contentHash:'frozen-content',quizHash:'frozen-quiz'}});
  write('public/content/test-skill.json',{skillId:'test-skill',theory:{intro:'Baseline'}});write('public/quizzes/test-skill.json',{questions:[]});
  return {root,write,skill};
}
const teaching=`# Adding Fractions
Use a common denominator.

+--------------------+
| **Example** Add fractions |
| Add 1/3 and 1/6. |
| 1/3 + 1/6 = 2/6 + 1/6 = 1/2. |
+--------------------+

+--------------------+
| **Guided Practice** |
| Add 1/4 and 1/8. |
+--------------------+

+--------------------+
| **Key Ideas** |
| Keep the same denominator and add numerators. |
+--------------------+

Foundation

1. Add these fractions.

+--------------------+
| a. 1/2 + 1/3 | b. 2/3 + 1/4 |
+--------------------+

Explain how you chose the denominator.

2. Subtract 2/3 - 1/6.

# Multiplication
Different topic.
`;

test('structural inventory keeps complete example, Key Ideas and whole multipart practice question',t=>{
  const inventory=inventorySourceText({path:'Fractions.md',text:teaching});
  const section=inventory.sections[0];assert.equal(section.title,'Adding Fractions');
  const example=section.units.find(u=>u.kind==='example');assert.ok(example.text.includes('= 1/2.'));assert.ok(example.text.endsWith('+--------------------+'));
  const question=section.units.find(u=>u.kind==='question');assert.match(question.text,/a\. 1\/2.*b\. 2\/3/s);assert.match(question.text,/Explain how you chose/);assert.doesNotMatch(question.text,/2\. Subtract/);
  const {root,write}=fixture(t);write('booklets/mathsmap-sources/Stage 4/Fractions.md',teaching);
  const result=selectSourceEvidence({root,campaignId:'test',skillId:'test-skill'});
  assert.ok(result.evidence.some(ref=>ref.excerpt.includes('**Example**')&&ref.excerpt.includes('**Key Ideas**')));
  assert.ok(result.evidence.some(ref=>ref.excerpt.includes('Explain how you chose')));
  assert.equal(result.evidenceStatus,'candidate-only');assert.equal(result.accepted,false);
});

test('later-stage Stage 3 borrowing stays indirect and preserves governing scope',t=>{
  const {root,write}=fixture(t,{stage:3});write('booklets/mathsmap-sources/Stage 4/Fractions.md',teaching);
  const result=selectSourceEvidence({root,campaignId:'test',skillId:'test-skill'});
  assert.equal(result.scope.stage,3);assert.equal(result.scope.dotPointId,'dp');assert.ok(result.sources.length);assert.ok(result.sources.every(ref=>ref.support==='indirect'));
});

test('curated exact refs take priority, duplicate ranges collapse and original source hashes remain bound',t=>{
  const {root,write}=fixture(t),sourcePath='booklets/mathsmap-sources/Stage 4/Fractions.md';write(sourcePath,teaching);
  const ref={path:sourcePath,startLine:1,endLine:19,hash:hashValue(teaching),support:'direct',locator:'Curated complete teaching'};
  write('.agywork/content-campaign/test/pilot-evidence/test-skill.json',{sources:[ref,ref],sourceQuirks:['Keep complete context.']});
  const result=selectSourceEvidence({root,campaignId:'test',skillId:'test-skill'});
  assert.equal(result.origin,'curated-pilot-selection');assert.equal(result.sources.length,1);assert.equal(result.sources[0].endLine,19);assert.equal(result.sources[0].hash,hashValue(teaching));
  assert.equal(result.curatedNotes.sourceQuirks[0],'Keep complete context.');
  write(sourcePath,teaching+'Changed');const stale=readSelectedEvidence(root,[ref]);assert.equal(stale.evidence.length,0);assert.equal(stale.gaps[0].kind,'stale-source-hash');
});

test('recorded bounded source decisions remain intact, including an honest over-budget blocker',t=>{
  const {root,write}=fixture(t),sourcePath='booklets/mathsmap-sources/Stage 4/Fractions.md';write(sourcePath,teaching);
  const state={scope:{stage:4,topicId:'topic'},stage:{sourceReview:[{path:sourcePath,startLine:1,endLine:19,hash:hashValue(teaching),locator:'Existing decision',support:'direct'}]}};
  const result=selectSourceEvidence({root,campaignId:'test',skillId:'test-skill',state,budgetChars:20});
  assert.equal(result.origin,'preserved-staged-source-selection');assert.equal(result.sources[0].endLine,19);assert.equal(result.dispatchReady,false);assert.ok(result.gaps.some(g=>g.kind==='source-budget-exceeded'));
});

test('no lexical match yields an honest gap rather than irrelevant whole-book evidence',t=>{
  const {root,write}=fixture(t,{title:'Zebrafish nomenclature',blurb:'Classify zebrafish nomenclature.'});write('booklets/mathsmap-sources/Stage 4/Fractions.md',teaching);
  const result=selectSourceEvidence({root,campaignId:'test',skillId:'test-skill'});
  assert.deepEqual(result.sources,[]);assert.equal(result.dispatchReady,false);assert.ok(result.gaps.some(g=>g.kind==='no-relevant-source-candidate'));
});

test('oversized whole example is reported, not cut into an instruction fragment',t=>{
  const {root,write}=fixture(t);const text='# Add fractions\n\n+--------------------+\n| **Example** Add fractions |\n| '+ 'Complete working '.repeat(1000)+' |\n+--------------------+\n\nFoundation\n\n1. Add 1/2 + 1/3.\n';
  write('booklets/mathsmap-sources/Stage 4/Fractions.md',text);
  const result=selectSourceEvidence({root,campaignId:'test',skillId:'test-skill',budgetChars:400});
  assert.deepEqual(result.sources,[]);assert.ok(result.gaps.some(g=>g.kind==='indivisible-teaching-over-budget'));
});

test('inventory writes only staging suggestions and retains frozen/content/prerequisite bindings',t=>{
  const {root,write}=fixture(t);write('booklets/mathsmap-sources/Stage 4/Fractions.md',teaching);
  const before=fs.readFileSync(path.join(root,'booklets/provenance/content-campaign/test/skills/test-skill.json'),'utf8');
  const report=writeSourceSelectionInventory({root,campaignId:'test'});assert.equal(report.skills,1);assert.equal(report.evidenceStatus,'candidate-only');
  const selection=JSON.parse(fs.readFileSync(path.join(root,'.agywork/content-campaign/test/source-selections/test-skill.json')));assert.equal(selection.binding.frozenBaseline.contentHash,'frozen-content');assert.ok(selection.binding.skillHash);assert.ok(selection.binding.contentHash);assert.ok(selection.binding.prerequisiteHash);
  assert.equal(fs.readFileSync(path.join(root,'booklets/provenance/content-campaign/test/skills/test-skill.json'),'utf8'),before);
  assert.throws(()=>writeSourceSelectionInventory({root,campaignId:'test',outDir:'public/content'}),/staging/);
});

test('normalization matches preparation bytes and preserves TeX spaces and coordinates; image names decode safely',t=>{
  const {root,write}=fixture(t),sourcePath='booklets/mathsmap-sources/Stage 4/Spacing.md';
  const text='# Add fractions\r\n\r\n|  $a\\ \\ \\ b$  |  ---  |\r\n\\draw (0,  1) -- (2,  3);\r\n![](<media/space%20name.png> "Caption")\r\n';
  write(sourcePath,text);const read=readSelectedEvidence(root,[{path:sourcePath,startLine:1,endLine:6,hash:hashValue(text)}]);
  const raw=text.split('\n').slice(0,6).join('\n');
  assert.equal(read.evidence[0].rawExcerptHash,hashValue(raw));
  assert.equal(normalizeSourceExcerpt(raw),raw.split('\n').map(line=>line.trimStart().startsWith('|')?line.split('|').map(cell=>cell.trim().replace(/^(:?)-{3,}(:?)$/,'$1---$2')).join('|'):line).join('\n'));
  assert.ok(read.evidence[0].excerpt.includes('$a\\ \\ \\ b$'));assert.ok(read.evidence[0].excerpt.includes('(0,  1)'));
  assert.equal(read.evidence[0].images[0].path,'booklets/mathsmap-sources/Stage 4/media/space name.png');
});

test('Stage 3 simple fractions do not select later algebraic fractions just because headings overlap',t=>{
  const {root,write}=fixture(t,{stage:3,title:'Add fractions with same denominators',blurb:'Add numerical fractions.'});
  write('booklets/mathsmap-sources/Stage 4/Fractions.md',teaching);write('booklets/mathsmap-sources/Stage 5 Core/Algebraic fractions.md',teaching.replace('# Adding Fractions','# Algebraic Fraction Addition: Same Denominators'));
  const result=selectSourceEvidence({root,campaignId:'test',skillId:'test-skill'});assert.ok(result.sources.length);assert.ok(result.sources.every(ref=>!ref.path.includes('Stage 5')));
});

test('actual rounding mismatch selects Decimals teaching, not frozen Comparing Fractions mapping',()=>{
  const root=process.cwd(),context=createSourceSelectionContext(root),state=JSON.parse(fs.readFileSync(path.join(root,'booklets/provenance/content-campaign/worked-examples-2026-09/skills/round-decimals.json')));
  const result=selectSourceEvidence({root,skillId:'round-decimals',context,state:{scope:state.scope,sources:[{path:'booklets/mathsmap-sources/Stage 4/Fractions Decimals Percentages 1_Comparing Fractions.md'}]},evidenceDir:'.agywork/nonexistent-curation'});
  assert.ok(result.sources.length);assert.match(result.sources[0].path,/2_Decimals\.md$/);assert.match(result.evidence[0].excerpt,/Rounding/);assert.equal(result.sources[0].support,'indirect');
});

test('real archived mappings recover bearings/combinations and DE wording without introducing later methods',()=>{
  const root=process.cwd(),context=createSourceSelectionContext(root);
  const select=skillId=>{
    const recorded=JSON.parse(fs.readFileSync(path.join(root,'booklets/provenance/content-campaign/worked-examples-2026-09/skills',`${skillId}.json`)));
    return selectSourceEvidence({root,skillId,context,state:{scope:recorded.scope,sources:recorded.sources},evidenceDir:'.agywork/nonexistent-curation'});
  };
  const bearings=select('bearings');assert.ok(bearings.sources.some(ref=>/Compass Bearings/.test(ref.locator)));assert.ok(bearings.sources.some(ref=>/True Bearings/.test(ref.locator)));
  const combinations=select('combinations-nCr');assert.ok(combinations.sources.some(ref=>/Unordered Selections/.test(ref.locator)));
  const de=select('define-differential-equation');assert.ok(de.sources.some(ref=>/Identifying DEs/.test(ref.locator)));assert.ok(de.sources.every(ref=>!/Logistic|Exponential Equations/.test(ref.locator)));
  const angles=select('classify-angles');assert.ok(angles.sources.some(ref=>/Classifying Angles/.test(ref.locator)));assert.ok(angles.sources.every(ref=>!/Angles in a Right Angle/.test(ref.locator)));
});
