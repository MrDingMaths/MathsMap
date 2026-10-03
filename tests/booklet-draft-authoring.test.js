import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createSemanticTasks} from '../scripts/booklet/semantic-workflow.mjs';
import {TRANSCRIPTION_DEFAULT} from '../scripts/booklet/transcription-settings.mjs';

test('continued authoring reads exact approved draft corrections before Studio publication',t=>{
 const runDir=fs.mkdtempSync(path.join(os.tmpdir(),'draft-authoring-'));
 t.after(()=>fs.rmSync(runDir,{recursive:true,force:true}));
 fs.mkdirSync(path.join(runDir,'evidence/pages'),{recursive:true});fs.mkdirSync(path.join(runDir,'semantic-packets'));
 for(const ext of ['png','txt'])fs.writeFileSync(path.join(runDir,'evidence/pages',`page-001.${ext}`),'Source exercise');
 const inventory={pageNumber:1,inventoried:true,entries:[{id:'p1-q1',kind:'question',description:'Evaluate the power',expectedAnswer:'4'}]};
 fs.writeFileSync(path.join(runDir,'semantic-packets/page-001.inventory.json'),JSON.stringify(inventory));
 const projectFile=path.join(runDir,'reviewed-draft.json');
 const project={sections:[{id:'draft-section',blocks:[{id:'draft-block',type:'question',content:{id:'draft-root',type:'question',prompt:'Original source wording.'}}]}]};
 fs.writeFileSync(projectFile,JSON.stringify(project));
 const workflowState={pages:{},issues:{},corrections:[{id:'draft-correction',status:'approved',reason:'Clarify the taught condition.',sourceRefs:[{pageNumber:1}],patches:[{scope:'project',page:1,targetId:'draft-root',field:'/prompt',original:'Original source wording.',corrected:'Reviewed source wording.'}]}]};
 const options={runDir,manifest:{...TRANSCRIPTION_DEFAULT,selectedPages:[1],reviewProfile:'textbook-three-pass-v1'},config:{title:'Indices',workflowPolicy:'review-first-v1',authoringProjectFile:projectFile,topics:[{id:'indices',title:'Indices',start:1,end:1}]},stage:'author',pages:[1],workflowState};
 assert.match(createSemanticTasks(options)[0].prompt,/Reviewed source wording/);
 assert.deepEqual(JSON.parse(fs.readFileSync(projectFile)),project);
 const missing=structuredClone(options);delete missing.config.authoringProjectFile;
 assert.throws(()=>createSemanticTasks(missing),/requires its bound project/);
 project.sections[0].blocks[0].content.prompt='A concurrent local edit.';fs.writeFileSync(projectFile,JSON.stringify(project));
 assert.throws(()=>createSemanticTasks(options),/Stale correction/);
});
