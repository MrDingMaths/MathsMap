import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {unrelatedSolidAuditFile,snapshotFiles,verifyCompletedFrozenExport} from '../scripts/booklet/import-verification-runtime.mjs';
import {projectReviewHash} from '../scripts/booklet/page-review.mjs';

const planar=()=>({id:'p',reviewProfile:'textbook-three-pass-v1',sections:[{blocks:[{id:'venn',type:'diagram',format:'tikz',code:'\\begin{tikzpicture}\\draw (0,0) circle (1);\\end{tikzpicture}'}]}]});
test('unused solid auditor exception excludes candidates, images, legacy runs and detection code',()=>{
 const project=planar();
 assert.equal(unrelatedSolidAuditFile('scripts/lib/solid-audit.mjs',project),true);
 assert.equal(unrelatedSolidAuditFile('scripts/audit-solid-visibility.mjs',project),false);
 assert.equal(unrelatedSolidAuditFile('src/lib/diagram-colours.js',project),false);
 assert.equal(unrelatedSolidAuditFile('scripts/lib/solid-audit.mjs',{...project,reviewProfile:undefined}),false);
 for(const figure of [{...project.sections[0].blocks[0],alt:'Cylinder'},{...project.sections[0].blocks[0],code:'\\begin{tikzpicture}\\coordinate (A) at (0,0,1);\\end{tikzpicture}'}, {type:'image',src:'/source.png'}]){
  assert.equal(unrelatedSolidAuditFile('scripts/lib/solid-audit.mjs',{...project,sections:[{blocks:[figure]}]}),false);
 }
});
test('completed planar export survives only an unused solid-auditor change',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'mathsmap-planar-export-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const out=path.join(root,'.booklet-work/out'),snapshot=path.join(out,'runtime'),projectFile=path.join(root,'project.json');
 const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);};
 write(path.join(root,'scripts/lib/solid-audit.mjs'),'original solid auditor');
 const files=snapshotFiles(root);for(const row of files)write(path.join(snapshot,row.path),fs.readFileSync(path.join(root,row.path)));
 write(path.join(out,'runtime-manifest.json'),JSON.stringify({root,snapshot,files}));
 write(path.join(out,'frozen-export-receipt-1.json'),JSON.stringify({status:0}));
 const project=planar();write(projectFile,JSON.stringify(project));
 const report={};for(const edition of ['student','short','worked','with-short','with-worked']){
  const file=path.join(out,edition+'.pdf');write(file,'checked PDF');
  report[edition]={projectHash:projectReviewHash(project),issues:[],pageHashes:[{page:1,hash:'page'}],pdf:{path:file,hash:createHash('sha256').update(fs.readFileSync(file)).digest('hex')}};
 }
 write(path.join(out,'report.json'),JSON.stringify({report:{p:report}}));
 write(path.join(root,'scripts/lib/solid-audit.mjs'),'updated solid auditor');
 const result=verifyCompletedFrozenExport({out,projectId:'p',projectFile});
 assert.deepEqual(result.unrelatedSolidAuditChanges,['scripts/lib/solid-audit.mjs']);
 assert.deepEqual(result.unrelatedCampaignChanges,[]);
 project.sections[0].blocks[0].alt='Cylinder';write(projectFile,JSON.stringify(project));
 assert.throws(()=>verifyCompletedFrozenExport({out,projectId:'p',projectFile}),/dependencies changed/);
});
