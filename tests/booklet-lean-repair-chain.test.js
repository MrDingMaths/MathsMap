import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {applyRepair,repairReadbackMismatches} from '../scripts/booklet/lean-review.mjs';

test('revision-checked repair reads back the final parent and child patch state',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mathsmap-repair-chain-'));
 t.after(()=>{assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(dir,{recursive:true,force:true});});
 const projectFile=path.join(dir,'candidate.json'),correctionsFile=path.join(dir,'repairs.json');
 const original={shortDiagramMm:45,workedDiagramMm:55};
 fs.writeFileSync(projectFile,JSON.stringify({id:'test',revision:0,settings:{compactAnswers:original},sections:[]}));
 fs.writeFileSync(correctionsFile,JSON.stringify({corrections:[{reason:'Measured graph widths',patches:[
  {targetId:'project',field:'/settings/compactAnswers',original,corrected:{shortDiagramMm:55,workedDiagramMm:60}},
  {targetId:'project',field:'/settings/compactAnswers/shortDiagramMm',original:55,corrected:60}
 ]}]}));
 const result=await applyRepair({runDir:dir,projectFile,correctionsFile});
 assert.equal(result.applied,2);assert.deepEqual(result.lost,[]);assert.deepEqual(result.errors,[]);
 assert.deepEqual(JSON.parse(fs.readFileSync(projectFile)).settings.compactAnswers,{shortDiagramMm:60,workedDiagramMm:60});
});

test('an inventory patch remaps one entry to an existing node and nothing else',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mathsmap-repair-inventory-'));
 t.after(()=>{assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(dir,{recursive:true,force:true});});
 const projectFile=path.join(dir,'candidate.json'),correctionsFile=path.join(dir,'repairs.json');
 const entries=[{id:'q5',kind:'question',targetId:'q5-graphs',field:'/children'},{id:'answer-q5',kind:'answer',targetId:'q5-graphs',field:'/children'}];
 const project={id:'test',revision:0,settings:{},source:{inventory:{entries}},sections:[{phase:'practice',blocks:[{id:'q5-root',content:{id:'q5-graphs',children:[]}}]}]};
 fs.writeFileSync(projectFile,JSON.stringify(project));
 const write=patches=>fs.writeFileSync(correctionsFile,JSON.stringify({corrections:[{id:'map',reason:'Answer maps to its question root',patches}]}));
 write([{targetId:'inventory:answer-q5',field:'/targetId',original:'q5-graphs',corrected:'missing-node'}]);
 await assert.rejects(applyRepair({runDir:dir,projectFile,correctionsFile}),/missing node/);
 write([{targetId:'inventory:answer-q5',field:'/kind',original:'answer',corrected:'question'}]);
 await assert.rejects(applyRepair({runDir:dir,projectFile,correctionsFile}),/only \/targetId or \/field/);
 assert.deepEqual(JSON.parse(fs.readFileSync(projectFile)).source.inventory.entries,entries);
 write([{targetId:'inventory:answer-q5',field:'/targetId',original:'q5-graphs',corrected:'q5-root'}]);
 const result=await applyRepair({runDir:dir,projectFile,correctionsFile});
 assert.equal(result.applied,1);assert.deepEqual(result.lost,[]);
 const saved=JSON.parse(fs.readFileSync(projectFile));
 assert.deepEqual(saved.source.inventory.entries,[entries[0],{...entries[1],targetId:'q5-root'}]);
 assert.deepEqual(saved.sections,project.sections);
 assert.match(fs.readFileSync(path.join(dir,'lean-review','corrections.jsonl'),'utf8'),/"targetId":"inventory:answer-q5"/);
});

test('repair readback still rejects a save that drops the final mathematical value',()=>{
 const expected={sections:[{phase:'practice',blocks:[{id:'q',content:{id:'part',prompt:'y=2x+1'}}]}]};
 const saved=structuredClone(expected);delete saved.sections[0].blocks[0].content.prompt;
 const row={blockId:'q',targetId:'part',field:'/prompt',corrected:'y=2x+1'};
 assert.deepEqual(repairReadbackMismatches(expected,saved,[row]),[{targetId:'part',field:'/prompt'}]);
 assert.deepEqual(repairReadbackMismatches(expected,expected,[row]),[]);
});
