import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createHash} from 'node:crypto';
import {snapshotFiles,verifyCompletedFrozenExport,exportWithFrozenRuntime,unrelatedCampaignFile} from '../scripts/booklet/import-verification-runtime.mjs';import {projectReviewHash} from '../scripts/booklet/page-review.mjs';
const digest=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'completed-export-')),out=path.join(root,'.booklet-work/out'),snapshot=path.join(out,'runtime');
 const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);};
 write(path.join(root,'src/renderer.js'),'original renderer');write(path.join(root,'public/content/unrelated-skill.json'),'{}');
 const files=snapshotFiles(root);for(const row of files)write(path.join(snapshot,row.path),fs.readFileSync(path.join(root,row.path)));
 write(path.join(out,'runtime-manifest.json'),JSON.stringify({root,snapshot,files}));write(path.join(out,'frozen-export-receipt-1.json'),JSON.stringify({status:0}));
 const project={id:'p',title:'P',reviewProfile:'textbook-three-pass-v1',settings:{},sections:[]},projectFile=path.join(root,'candidate.json');write(projectFile,JSON.stringify(project));
 const report={};for(const edition of ['student','short','worked','with-short','with-worked']){const file=path.join(out,edition+'.pdf');write(file,'checked PDF');report[edition]={projectHash:projectReviewHash(project),issues:[],pageHashes:[{page:1,hash:'h'}],pdf:{path:file,hash:digest(file)}};}
 write(path.join(out,'report.json'),JSON.stringify({report:{p:report}}));
 return {root,out,snapshot,project,projectFile,write,options:{out,projectId:'p',projectFile}};
}
test('completed lean export survives unrelated campaign JSON but rejects relevant or renderer changes',()=>{
 const f=fixture();f.write(path.join(f.root,'public/content/unrelated-skill.json'),'changed campaign');
 assert.equal(verifyCompletedFrozenExport(f.options).reused,true);
 f.project.sections=[{blocks:[{classification:{primarySkillId:'unrelated-skill'}}]}];f.write(f.projectFile,JSON.stringify(f.project));assert.throws(()=>verifyCompletedFrozenExport(f.options),/dependencies changed/);
 const g=fixture();g.write(path.join(g.root,'src/renderer.js'),'changed renderer');assert.throws(()=>verifyCompletedFrozenExport(g.options),/dependencies changed/);
});
test('completed export reuse rejects changed project, PDF, frozen bytes and incomplete checker',()=>{
 const f=fixture();f.project.title='changed';f.write(f.projectFile,JSON.stringify(f.project));assert.throws(()=>verifyCompletedFrozenExport(f.options),/project or checks differ/);
 const g=fixture();g.write(path.join(g.out,'short.pdf'),'changed PDF');assert.throws(()=>verifyCompletedFrozenExport(g.options),/PDF changed/);
 const h=fixture();h.write(path.join(h.snapshot,'src/renderer.js'),'changed frozen renderer');assert.throws(()=>verifyCompletedFrozenExport(h.options),/Frozen renderer changed/);
 const i=fixture();i.write(path.join(i.out,'frozen-export-receipt-1.json'),JSON.stringify({status:1}));assert.throws(()=>verifyCompletedFrozenExport(i.options),/checker has not passed/);
});
test('only an unreferenced campaign skill file is unrelated; scripts, data and other public files are dependencies',()=>{
 const project={sections:[{blocks:[{classification:{primarySkillId:'used-skill'}}]}]};
 assert.equal(unrelatedCampaignFile('public/content/other-skill.json',project),true);
 assert.equal(unrelatedCampaignFile('public/quizzes/other-skill.json',project),true);
 for(const file of ['public/content/used-skill.json','public/fonts/font.woff2','public/content/nested/other.json','data/skills.json','scripts/booklet/lean-review.mjs','scripts/booklet/import-verification-runtime.mjs','src/renderer.js'])assert.equal(unrelatedCampaignFile(file,project),false,file);
 const f=fixture();f.write(path.join(f.root,'scripts/booklet/lean-review.mjs'),'new orchestrator file');
 assert.throws(()=>verifyCompletedFrozenExport(f.options),/dependencies changed/,'an orchestrator edit is not exempt by name');
});
test('a passing export survives an unrelated campaign write made while it ran, and fails on a renderer change',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'export-campaign-')),write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,value);};
 write(path.join(root,'src/main.js'),'stable');write(path.join(root,'vite.config.js'),'export default {}');write(path.join(root,'node_modules/fixture.js'),'dependency');write(path.join(root,'public/content/other-skill.json'),'{}');
 write(path.join(root,'booklets/projects/book.json'),JSON.stringify({id:'book',sections:[]}));
 const server={listen:async()=>{},httpServer:{address:()=>({port:9000})},close:async()=>{}},base={root,projectId:'book',runDir:path.join(root,'.booklet-work/run'),createServer:async()=>server};
 const receipt=await exportWithFrozenRuntime({...base,out:path.join(root,'.booklet-work/a'),execute:async()=>{write(path.join(root,'public/content/other-skill.json'),'{"campaign":true}');return 0;}});
 assert.deepEqual(receipt.changedDependencies,[]);assert.deepEqual(receipt.unrelatedCampaignChanges,['public/content/other-skill.json']);
 await assert.rejects(exportWithFrozenRuntime({...base,out:path.join(root,'.booklet-work/b'),execute:async()=>{write(path.join(root,'src/main.js'),'changed renderer');return 0;}}),/no longer matches live dependencies.*: src\/main\.js/);
});
