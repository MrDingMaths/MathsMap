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

test('repair readback still rejects a save that drops the final mathematical value',()=>{
 const expected={sections:[{phase:'practice',blocks:[{id:'q',content:{id:'part',prompt:'y=2x+1'}}]}]};
 const saved=structuredClone(expected);delete saved.sections[0].blocks[0].content.prompt;
 const row={blockId:'q',targetId:'part',field:'/prompt',corrected:'y=2x+1'};
 assert.deepEqual(repairReadbackMismatches(expected,saved,[row]),[{targetId:'part',field:'/prompt'}]);
 assert.deepEqual(repairReadbackMismatches(expected,expected,[row]),[]);
});
