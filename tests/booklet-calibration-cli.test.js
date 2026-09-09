import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const script=path.resolve('scripts/booklet/calibrate-compact-answers.mjs');
test('unsupported answer diagrams produce an actionable report without starting a renderer or changing source settings',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'booklet-calibration-'));
 try{
  fs.mkdirSync(path.join(dir,'booklets/projects'),{recursive:true});
  const project={id:'fixture',settings:{compactAnswers:{diagramStyles:{short:{old:{widthMm:30}},worked:{kept:{widthMm:55}}}}},sections:[{blocks:[{id:'q',type:'question',content:{id:'root',answer:{solutionDiagrams:[{id:'image-answer',format:'image',src:'missing.png'}]}}}]}]};
  const file=path.join(dir,'booklets/projects/fixture.json'),original=JSON.stringify(project);fs.writeFileSync(file,original);
  const run=spawnSync(process.execPath,[script,'--project','fixture','--editions','worked','--out','output'],{cwd:dir,encoding:'utf8',windowsHide:true});
  assert.equal(run.status,1,run.stderr);
  const findings=JSON.parse(fs.readFileSync(path.join(dir,'output/diagram-calibration.json')));
  assert.match(findings[0].note,/Inspect its labels.*readable width/);
  const candidate=JSON.parse(fs.readFileSync(path.join(dir,'output/calibrated-candidate.json')));
  assert.deepEqual(candidate.settings.compactAnswers.diagramStyles.short,project.settings.compactAnswers.diagramStyles.short);
  assert.deepEqual(candidate.settings.compactAnswers.diagramStyles.worked.kept,{widthMm:55});
  assert.equal(fs.readFileSync(file,'utf8'),original);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
