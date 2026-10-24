import test from 'node:test';
import assert from 'node:assert/strict';
import {normaliseAuthoredRatingBands,validatePacketRatings,verifiedRating} from '../scripts/booklet/reasoning-ratings.mjs';
import {createAssignmentPlan} from '../scripts/booklet/author-assignments.mjs';
import {structuralPreflight} from '../scripts/booklet/feedback-preflight.mjs';
import {validateSemanticResult} from '../scripts/booklet/semantic-workflow.mjs';
import {pdfToolPath} from '../scripts/booklet/pdf-layout-qa.mjs';
import {missingEqualsGutter} from '../scripts/booklet/check-equals-gutter.mjs';
import {editionHasContent} from '../first-pass/review.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {inspectPdfNavigation} from '../scripts/booklet/pdf-navigation-qa.mjs';

test('native PDF navigation reads a real PDF beyond Windows MAX_PATH',t=>{
 if(process.platform!=='win32'||spawnSync('pdfinfo',['-v'],{windowsHide:true}).status!==0){t.skip('Windows Poppler integration');return;}
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'mathsmap-navigation-'));
 const directory=path.join(base,...Array.from({length:8},(_,i)=>'long-source-title-segment-'+i));fs.mkdirSync(directory,{recursive:true});
 const file=path.join(directory,'booklet.pdf');assert.ok(file.length>260);
 const objects=['<</Type /Catalog /Pages 2 0 R>>','<</Type /Pages /Kids [3 0 R] /Count 1>>','<</Type /Page /Parent 2 0 R /MediaBox [0 0 595 842]>>'];
 let pdf='%PDF-1.4\n',offsets=[0];for(const [i,object]of objects.entries()){offsets.push(Buffer.byteLength(pdf));pdf+=`${i+1} 0 obj\n${object}\nendobj\n`;}
 const xref=Buffer.byteLength(pdf);pdf+='xref\n0 4\n0000000000 65535 f \n'+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<</Size 4 /Root 1 0 R>>\nstartxref\n${xref}\n%%EOF\n`;
 try{fs.writeFileSync(file,pdf);assert.deepEqual(inspectPdfNavigation(file,[]),{annotations:0,expectedLinks:0,destinations:0});}
 finally{assert.ok(path.resolve(file).startsWith(path.resolve(base)+path.sep));fs.rmSync(base,{recursive:true,force:true});}
});

test('empty answer-only maps follow Studio projection without skipping real or opted-in teaching answers',()=>{
 const project={id:'teaching',settings:{},topics:[{id:'topic',title:'Teaching'}],sections:[{id:'s',topicId:'topic',phase:'teaching',blocks:[{id:'b',type:'question',sourceAtom:{id:'activity',kind:'identify'},pedagogyRole:'identify',content:{id:'root',type:'part',prompt:'Complete the taught step.',answer:{short:'2',worked:'Substitute the given value.'}}}]}]};
 assert.equal(editionHasContent(project,'student'),true);assert.equal(editionHasContent(project,'short'),false);assert.equal(editionHasContent(project,'worked'),false);assert.equal(editionHasContent(project,'with-worked'),true);
 project.settings.includeTeachingAnswers=true;assert.equal(editionHasContent(project,'short'),true);
 project.settings.includeTeachingAnswers=false;delete project.sections[0].blocks[0].sourceAtom;delete project.sections[0].blocks[0].pedagogyRole;delete project.sections[0].blocks[0].content.answer;
 assert.equal(editionHasContent(project,'short'),true,'a real unanswered practice question must retain its render/check path');
});

test('wrapped sums continue a preceding equation without hiding genuine bare openings',()=>{
 const check=latex=>missingEqualsGutter({id:'answer',answer:{worked:'$$'+latex+'$$'}});
 assert.equal(check(String.raw`\begin{align*}\sum_{n=3}^{6}(2n-1)&=(2\times3-1)+(2\times4-1)\\&\quad +(2\times5-1)+(2\times6-1)\\&=5+7+9+11\end{align*}`).length,0);
 assert.equal(check(String.raw`\begin{aligned}S&=2^0+2^1+2^2\\&\quad+2^3+2^4+2^5\\&=63\end{aligned}`).length,0);
 assert.equal(check(String.raw`\begin{aligned}A&=1+2\\&\qquad{}+3+4)\\&=10\end{aligned}`).length,0);
 assert.equal(check(String.raw`\begin{aligned}P&=P(A)+P(B)\\&\quad-P(A\cap B)\\&=1\end{aligned}`).length,0);
 assert.equal(check(String.raw`\begin{aligned}T&=2\left[1+2\right.\\&\qquad\left.\left.+3\right]\\&=12\end{aligned}`).length,0);
 assert.equal(check(String.raw`\begin{aligned}x&=1\\&\quad (x+2)\\&=3\end{aligned}`).length,1);
 assert.equal(check(String.raw`\begin{aligned}&\quad (2+3)\\&=5\end{aligned}`).length,1);
});

test('Windows Poppler arguments support long drive and UNC paths without changing ordinary paths',()=>{
 const long='D:\\booklets\\'+Array.from({length:20},()=> 'source-folder').join('\\')+'\\booklet.pdf';
 assert.ok(long.length>260);assert.equal(pdfToolPath(long,'win32'),'\\\\?\\'+long);
 const unc='\\\\server\\share\\'+Array.from({length:20},()=> 'source-folder').join('\\')+'\\page';
 assert.equal(pdfToolPath(unc,'win32'),'\\\\?\\UNC\\'+unc.slice(2));
 assert.equal(pdfToolPath('D:\\booklet.pdf','win32'),'D:\\booklet.pdf');
 assert.equal(pdfToolPath('/booklets/'+long,'linux'),'/booklets/'+long);
});

test('only independently inventoried supplied example working can waive a response answer',()=>{
 const inventory={pageNumber:5,entries:[{id:'example',kind:'example',description:'Complete the later recurrence steps.',responseKind:'cloze'},{id:'given-working',kind:'answer',parentId:'example',description:'Visible supplied demonstration: V0=0, V1=1000, V2=2100.'}]};
 const packet={pageNumber:5,sections:[{id:'teaching',title:'Recurrences',phase:'teaching',blocks:[{id:'b',type:'question',content:{id:'root',type:'group',prompt:'Complete the later recurrence steps.',children:[{id:'given',type:'part',prompt:{format:'maths-editor-document-v1',version:1,blocks:[{id:'given-paragraph',type:'paragraph',inlines:[{type:'text',text:'V0=0, V1=1000, V2=2100.'}]}]}}]},sourceReview:{responses:[{targetId:'given',kind:'none'}]}}]}],inventoryMappings:[{inventoryId:'example',targetId:'root'},{inventoryId:'given-working',targetId:'given-paragraph'}]};
 const validate=()=>validateSemanticResult(packet,{stage:'author',page:5,inventory});
 assert.doesNotThrow(validate);
 inventory.entries[0].kind='question';assert.throws(validate,/Response leaf lacks/);
 inventory.entries[0].kind='example';inventory.entries[1].description='Supplied answer reference only.';assert.throws(validate,/Response leaf lacks/);
 inventory.entries[1].description='Visible supplied demonstration.';inventory.entries[1].responseKind='working';assert.throws(validate,/Response leaf lacks/);
});

test('fresh author bands follow the supplied score without inventing an assessment',()=>{
 const block={id:'q',type:'question',content:{id:'root',type:'question',prompt:'Evaluate the branches.',answer:{short:'2',worked:'Substitute into the applicable branch.'}},classification:{reasoningScore:25,difficulty:'Foundation',difficultyReason:'Select a branch and substitute.'}};
 const packet={sections:[{phase:'practice',blocks:[block]}]};
 normaliseAuthoredRatingBands(packet);assert.equal(block.classification.difficulty,'Development');validatePacketRatings(packet);assert.equal(verifiedRating(block),false);assert.equal(block.classification.assessment,undefined);
 block.classification.reasoningScore=101;normaliseAuthoredRatingBands(packet);assert.throws(()=>validatePacketRatings(packet),/reasoning rating/);
 block.classification.reasoningScore=22;block.classification.difficultyReason='';normaliseAuthoredRatingBands(packet);assert.throws(()=>validatePacketRatings(packet),/reasoning rating/);
});

test('inventory entries membership keeps a syllabus group indivisible and preserves unknown-member rejection',()=>{
 const inventory={pageNumber:2,entries:[{id:'header',kind:'syllabus',description:'Syllabus content'},{id:'outcome',kind:'syllabus',description:'An outcome'},{id:'statement',kind:'syllabus',description:'A statement'}],groups:[{id:'syllabus',kind:'syllabus',entries:['header','outcome','statement']}]},before=structuredClone(inventory);
 const plan=createAssignmentPlan([inventory],{maxCharacters:1});assert.equal(plan.assignments.length,1);assert.deepEqual(new Set(plan.assignments[0].inventoryIds),new Set(['header','outcome','statement']));assert.deepEqual(inventory,before);
 inventory.groups[0].entries.push('missing');assert.throws(()=>createAssignmentPlan([inventory]),/Missing shared/);
});

test('independent practice category membership does not merge separate questions',()=>{
 const inventory={pageNumber:3,entries:[{id:'q1',kind:'question',description:'First question'},{id:'q2',kind:'question',description:'Second question'},{id:'heading',kind:'teaching',description:'FOUNDATION'}],groups:[{id:'foundation',kind:'independent-practice',header:'FOUNDATION',entries:['q1','q2','heading']}]};
 const plan=createAssignmentPlan([inventory],{maxQuestions:1});assert.equal(plan.assignments.length,2);assert.ok(plan.assignments.find(a=>a.inventoryIds.includes('q1')).inventoryIds.includes('heading'));assert.equal(plan.assignments.find(a=>a.inventoryIds.includes('q2')).inventoryIds.includes('heading'),false);
});

test('dormant nested-node arrangements do not block preflight, while broken active arrangements still do',()=>{
 const arrangement={version:1,root:{id:'layout',type:'group',direction:'stack',children:[{id:'item',type:'item',ref:'removed/prompt'}]}};
 const project={settings:{layoutOverrides:{blockLayouts:{'old-block':{arrangement,diagramWidthMm:70}}}},sections:[{blocks:[{id:'b',type:'rich-text',content:{format:'maths-editor-document-v1',id:'old-block',blocks:[{id:'text',type:'paragraph',inlines:[{type:'text',text:'Retained teacher text.'}]}]}}]}]},before=structuredClone(project);
 assert.equal(structuralPreflight(project).issues.length,0);assert.deepEqual(project,before);
 project.settings.layoutOverrides.blockLayouts.b={arrangement};assert.ok(structuralPreflight(project).issues.some(i=>i.kind==='missing-arrangement-ref'));
});
