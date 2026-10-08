import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createHash} from 'node:crypto';
import {snapshotFiles,snapshotDifferences,verifyCompletedFrozenExport,exportWithFrozenRuntime,unrelatedCampaignFile,unrelatedProjectAssetFile,inactiveAbsentParentGuardChange} from '../scripts/booklet/import-verification-runtime.mjs';import {projectReviewHash} from '../scripts/booklet/page-review.mjs';
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

test('completed artifact review tolerates only unreferenced assets owned by a registered import run',()=>{
 const f=fixture(),owner='other-book-20261008',asset='public/booklet-assets/'+owner+'/source.png';
 f.write(path.join(f.root,'.booklet-work/full-imports',owner,'manifest.json'),JSON.stringify({format:'mathsmap-booklet-transcription-run-v1',id:owner}));
 f.write(path.join(f.root,asset),'before');f.write(path.join(f.snapshot,asset),'before');
 const files=snapshotFiles(f.root);f.write(path.join(f.out,'runtime-manifest.json'),JSON.stringify({root:f.root,snapshot:f.snapshot,files}));
 f.write(path.join(f.root,asset),'concurrent import repair');
 f.write(path.join(f.out,'frozen-export-receipt-1.json'),JSON.stringify({status:0,changedDependencies:[asset]}));
 assert.equal(unrelatedProjectAssetFile(asset,f.project,f.root),true);
 assert.equal(verifyCompletedFrozenExport({...f.options,artifactReview:true}).reused,true);
 for(const src of ['/booklet-assets/'+owner+'/source.png','/booklet-assets/other%2Dbook%2D20261008/source.png']){
  assert.equal(unrelatedProjectAssetFile(asset,{...f.project,sections:[{image:src}]},f.root),false);
 }
 assert.equal(unrelatedProjectAssetFile(asset,{...f.project,source:{runId:owner}},f.root),false);
 assert.equal(unrelatedProjectAssetFile('public/booklet-assets/unregistered/source.png',f.project,f.root),false);
 f.project.sections=[{image:'/booklet-assets/'+owner+'/source.png'}];f.write(f.projectFile,JSON.stringify(f.project));
 assert.throws(()=>verifyCompletedFrozenExport({...f.options,artifactReview:true}),/Dependencies changed|Referenced diagram assets/);
 f.project.sections=[];f.write(f.projectFile,JSON.stringify(f.project));
 f.write(path.join(f.snapshot,asset),'changed frozen asset');
 assert.throws(()=>verifyCompletedFrozenExport({...f.options,artifactReview:true}),/Frozen renderer changed/);
});
test('completed export reuse rejects changed project, PDF, frozen bytes and incomplete checker',()=>{
 const f=fixture();f.project.title='changed';f.write(f.projectFile,JSON.stringify(f.project));assert.throws(()=>verifyCompletedFrozenExport(f.options),/project or checks differ/);
 const g=fixture();g.write(path.join(g.out,'short.pdf'),'changed PDF');assert.throws(()=>verifyCompletedFrozenExport(g.options),/PDF changed/);
 const h=fixture();h.write(path.join(h.snapshot,'src/renderer.js'),'changed frozen renderer');assert.throws(()=>verifyCompletedFrozenExport(h.options),/Frozen renderer changed/);
 const i=fixture();i.write(path.join(i.out,'frozen-export-receipt-1.json'),JSON.stringify({status:1}));assert.throws(()=>verifyCompletedFrozenExport(i.options),/checker has not passed/);
});

test('immutable PDF review tolerates later tool edits while preserving artifact and source guards',()=>{
 const f=fixture();f.write(path.join(f.root,'src/renderer.js'),'later renderer');
 const review=verifyCompletedFrozenExport({...f.options,artifactReview:true});
 assert.equal(review.reused,true);assert.deepEqual(review.laterDependencyChanges,['src/renderer.js']);assert.deepEqual(review.unrelatedCampaignChanges,[]);
 assert.throws(()=>verifyCompletedFrozenExport(f.options),/dependencies changed/);
 for(const mutate of [
  g=>{g.project.title='changed';g.write(g.projectFile,JSON.stringify(g.project));},
  g=>g.write(path.join(g.out,'short.pdf'),'changed PDF'),
  g=>g.write(path.join(g.snapshot,'src/renderer.js'),'changed frozen renderer'),
  g=>g.write(path.join(g.out,'frozen-export-receipt-1.json'),JSON.stringify({status:0,changedDependencies:['src/renderer.js']})),
  g=>g.write(path.join(g.root,'public/booklet-assets/projects/p/figure.png'),'changed referenced asset'),
 ]){const g=fixture();mutate(g);assert.throws(()=>verifyCompletedFrozenExport({...g.options,artifactReview:true}));}
});

test('other-project private assets are reusable while referenced, shared and own assets stay strict',()=>{
 const f=fixture(),asset='public/booklet-assets/projects/other-book/figure.png';
 f.write(path.join(f.root,asset),'other project image');
 const result=verifyCompletedFrozenExport(f.options);
 assert.deepEqual(result.unrelatedProjectAssetChanges,[asset]);
 assert.deepEqual(result.unrelatedCampaignChanges,[]);
 assert.equal(unrelatedProjectAssetFile(asset,f.project),true);
 for(const src of ['/booklet-assets/projects/other-book/figure.png','/booklet-assets/projects/other%2Dbook/figure.png']){
  assert.equal(unrelatedProjectAssetFile(asset,{...f.project,sections:[{image:src}]}),false);
 }
 assert.equal(unrelatedProjectAssetFile('public/booklet-assets/projects/p/figure.png',f.project),false);
 assert.equal(unrelatedProjectAssetFile('public/booklet-assets/shared/avatars/figure.png',f.project),false);
 assert.equal(unrelatedProjectAssetFile(asset,{id:'p'}),false,'historical profiles stay strict');
 assert.equal(unrelatedProjectAssetFile(asset,{...f.project,id:undefined}),false,'unknown project ownership stays strict');
 assert.equal(unrelatedProjectAssetFile('public/booklet-assets/projects/P/figure.png',f.project),false,'namespace case does not bypass our own assets');
 f.project.sections=[{image:'/booklet-assets/projects/other-book/figure.png'}];f.write(f.projectFile,JSON.stringify(f.project));
 assert.throws(()=>verifyCompletedFrozenExport(f.options),/dependencies changed/);
 for(const file of ['public/booklet-assets/projects/p/figure.png','public/booklet-assets/shared/avatars/figure.png']){
  const g=fixture();g.write(path.join(g.root,file),'changed image');
  assert.throws(()=>verifyCompletedFrozenExport(g.options),/dependencies changed/);
 }
});

test('unreferenced other-project assets still require unchanged frozen bytes',()=>{
 const f=fixture(),asset='public/booklet-assets/projects/other-book/figure.png';
 f.write(path.join(f.root,asset),'original image');f.write(path.join(f.snapshot,asset),'original image');
 const manifest=JSON.parse(fs.readFileSync(path.join(f.out,'runtime-manifest.json')));
 manifest.files.push({path:asset,hash:digest(path.join(f.root,asset))});
 f.write(path.join(f.out,'runtime-manifest.json'),JSON.stringify(manifest));
 f.write(path.join(f.snapshot,asset),'changed frozen image');
 assert.throws(()=>verifyCompletedFrozenExport(f.options),/Frozen renderer changed/);
});

test('optional content-review reuse is outside print dependencies until a runtime imports it',()=>{
 const f=fixture(),module=path.join(f.root,'scripts/booklet/review-reuse.mjs');
 f.write(module,'export const x=1');
 f.write(path.join(f.root,'scripts/booklet/lean-review.mjs'),"import {x} from './review-reuse.mjs';");
 assert(!snapshotFiles(f.root).some(row=>row.path==='scripts/booklet/review-reuse.mjs'));
 for(const reference of ["import {x} from '../scripts/booklet/review-reuse.mjs';","import '../scripts/booklet/review-reuse.mjs';","const x=await import('../scripts/booklet/review-reuse.mjs');","const x=require('../scripts/booklet/review-reuse.mjs');"]){
  f.write(path.join(f.root,'src/renderer.js'),reference);
  assert(snapshotFiles(f.root).some(row=>row.path==='scripts/booklet/review-reuse.mjs'),reference);
 }
});
test('unused authoring/host coordinators do not invalidate historical print snapshots',()=>{
 const f=fixture();
 const names=['scripts/booklet/lean-import.mjs','scripts/booklet/semantic-packets.mjs','scripts/booklet/lean-review.mjs','scripts/content/lean-route.mjs','scripts/booklet/import-verification-runtime.mjs'];
 for(const name of names){f.write(path.join(f.root,name),'original coordinator');f.write(path.join(f.snapshot,name),'original coordinator');}
 const manifest=JSON.parse(fs.readFileSync(path.join(f.out,'runtime-manifest.json')));
 manifest.files.push(...names.map(name=>({path:name,hash:digest(path.join(f.root,name))})));
 f.write(path.join(f.out,'runtime-manifest.json'),JSON.stringify(manifest));
 f.write(path.join(f.root,'scripts/booklet/lean-import.mjs'),'changed authoring launcher');
 f.write(path.join(f.root,'scripts/booklet/semantic-packets.mjs'),'changed standalone authoring CLI');
 f.write(path.join(f.root,'scripts/booklet/lean-review.mjs'),'changed review coordinator');
 f.write(path.join(f.root,'scripts/content/lean-route.mjs'),'changed campaign coordinator');
 f.write(path.join(f.root,'scripts/booklet/import-verification-runtime.mjs'),'changed host guard');
 assert.deepEqual(snapshotDifferences(f.root,manifest.files),[]);
 assert.equal(verifyCompletedFrozenExport(f.options).reused,true);
 for(const name of names){
  f.write(path.join(f.root,'src/renderer.js'),"import '../"+name+"';");
  assert(snapshotFiles(f.root).some(row=>row.path===name));
  assert.throws(()=>verifyCompletedFrozenExport(f.options),/dependencies changed/);
  const expected=snapshotFiles(f.root);fs.unlinkSync(path.join(f.root,name));
  assert(snapshotDifferences(f.root,expected).includes(name),'deleting an imported coordinator stays blocking');
  f.write(path.join(f.root,name),'restored coordinator');
 }
});

test('a selected-page reuse import does not bind the separate content-review helper in old snapshots',()=>{
 const f=fixture(),contentReuse='scripts/booklet/review-reuse.mjs',pageReuse='scripts/booklet/selected-page-review-reuse.mjs';
 f.write(path.join(f.root,contentReuse),'export const x=1');
 f.write(path.join(f.root,pageReuse),'export const x=1');
 f.write(path.join(f.root,'scripts/booklet/lean-review.mjs'),"import {x} from './review-reuse.mjs';");
 f.write(path.join(f.root,'src/renderer.js'),"import {x} from '../scripts/booklet/selected-page-review-reuse.mjs';");
 const files=snapshotFiles(f.root);
 assert(!files.some(row=>row.path===contentReuse));
 assert(files.some(row=>row.path===pageReuse));
 // Older guards captured the unrelated helper because its name is a suffix.
 files.push({path:contentReuse,hash:digest(path.join(f.root,contentReuse))});
 for(const row of files)f.write(path.join(f.snapshot,row.path),fs.readFileSync(path.join(f.root,row.path)));
 f.write(path.join(f.out,'runtime-manifest.json'),JSON.stringify({root:f.root,snapshot:f.snapshot,files}));
 f.write(path.join(f.root,contentReuse),'export const x=2');
 assert.equal(verifyCompletedFrozenExport(f.options).reused,true);
 f.write(path.join(f.root,pageReuse),'export const x=2');
 assert.throws(()=>verifyCompletedFrozenExport(f.options),/dependencies changed/);
 f.write(path.join(f.root,'src/renderer.js'),"import {x} from '../scripts/booklet/review-reuse.mjs';");
 assert(snapshotFiles(f.root).some(row=>row.path===contentReuse));
});

test('completed authoring changes stay separate until a renderer imports their helpers transitively',()=>{
 const f=fixture(),assembler='scripts/booklet/assemble-semantic-packets.mjs',helper='scripts/booklet/packet-continuations.mjs',caller='scripts/booklet/author-assignments.mjs';
 f.write(path.join(f.root,assembler),"import {x} from './packet-continuations.mjs';");
 f.write(path.join(f.root,caller),"import {x} from './packet-continuations.mjs';");
 f.write(path.join(f.root,helper),'export const x=1');
 const files=snapshotFiles(f.root);
 assert(!files.some(row=>row.path===assembler));assert(!files.some(row=>row.path===helper));
 files.push(...[assembler,helper].map(file=>({path:file,hash:digest(path.join(f.root,file))})));
 for(const row of files)f.write(path.join(f.snapshot,row.path),fs.readFileSync(path.join(f.root,row.path)));
 f.write(path.join(f.out,'runtime-manifest.json'),JSON.stringify({root:f.root,snapshot:f.snapshot,files}));
 f.write(path.join(f.root,helper),'export const x=2');
 f.write(path.join(f.root,assembler),"import {x} from './packet-continuations.mjs'; console.log(x);");
 assert.equal(verifyCompletedFrozenExport(f.options).reused,true);
 f.write(path.join(f.root,'src/renderer.js'),"import {x} from '../scripts/booklet/author-assignments.mjs';");
 assert(snapshotFiles(f.root).some(row=>row.path===helper));
 assert(snapshotDifferences(f.root,files).includes(helper));
 assert.throws(()=>verifyCompletedFrozenExport(f.options),/dependencies changed/);
});
test('only an unreferenced campaign skill file is unrelated; scripts, data and other public files are dependencies',()=>{
 const project={sections:[{blocks:[{classification:{primarySkillId:'used-skill'}}]}]};
 assert.equal(unrelatedCampaignFile('public/content/other-skill.json',project),true);
 assert.equal(unrelatedCampaignFile('public/quizzes/other-skill.json',project),true);
 for(const file of ['public/content/used-skill.json','public/fonts/font.woff2','public/content/nested/other.json','data/skills.json','scripts/booklet/lean-review.mjs','scripts/booklet/import-verification-runtime.mjs','src/renderer.js'])assert.equal(unrelatedCampaignFile(file,project),false,file);
 const f=fixture();f.write(path.join(f.root,'scripts/booklet/lean-review.mjs'),'new orchestrator file');
 f.write(path.join(f.root,'src/renderer.js'),"import '../scripts/booklet/lean-review.mjs';");
 assert.throws(()=>verifyCompletedFrozenExport(f.options),/dependencies changed/,'an imported orchestrator remains guarded');
});

test('assembly-only answer provenance changes preserve printed PDFs while direct and transitive runtime imports stay guarded',()=>{
 const f=fixture(),assembler='scripts/booklet/assemble-semantic-packets.mjs',helper='scripts/booklet/answer-evidence.mjs';
 f.write(path.join(f.root,assembler),"import {x} from './answer-evidence.mjs';");
 f.write(path.join(f.root,helper),'export const x=1');
 const files=snapshotFiles(f.root);
 assert(!files.some(row=>row.path===helper));
 // Earlier snapshots conservatively included this authoring-only module.
 files.push(...[assembler,helper].map(file=>({path:file,hash:digest(path.join(f.root,file))})));
 for(const row of files)f.write(path.join(f.snapshot,row.path),fs.readFileSync(path.join(f.root,row.path)));
 f.write(path.join(f.out,'runtime-manifest.json'),JSON.stringify({root:f.root,snapshot:f.snapshot,files}));
 f.write(path.join(f.root,helper),'export const x=2');
 assert.equal(verifyCompletedFrozenExport(f.options).reused,true);
 for(const imported of [helper,assembler]){
  f.write(path.join(f.root,'src/renderer.js'),`import '../${imported}';`);
  assert(snapshotFiles(f.root).some(row=>row.path===helper));
  assert.throws(()=>verifyCompletedFrozenExport(f.options),/dependencies changed/);
 }
 f.write(path.join(f.root,'src/renderer.js'),'original renderer');
 f.write(path.join(f.root,'scripts/booklet/unknown-checker.mjs'),"import {x} from './answer-evidence.mjs';");
 assert(snapshotFiles(f.root).some(row=>row.path===helper),'An unknown caller remains conservative');
 assert.throws(()=>verifyCompletedFrozenExport(f.options),/dependencies changed/);
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

function inactiveParentFixture(){
 const f=fixture(),file='scripts/booklet/workflow-review.mjs',current=fs.readFileSync(path.resolve(file),'utf8').replaceAll('\r\n','\n');
 const original="      const parent=json(ref.path,null)?.entries?.find(e=>e.id===patch.corrected);",corrected="      const parentSource=json(ref.path,null);\n      if(parentSource?.pageNumber!==ref.pageNumber)throw Error('Absent inventory parent evidence page mismatch '+patch.targetId);\n      const parent=parentSource.entries?.find(e=>e.id===patch.corrected);";
 assert.equal(current.split(corrected).length,2);const previous=current.replace(corrected,original);
 const runId='inactive-parent-fixture',run=path.join(f.root,'.booklet-work/full-imports',runId),originalPdf=path.join(f.root,'.booklet-work/original.pdf'),originalTeacher=path.join(f.root,'.booklet-work/teacher.pdf');
 f.write(originalPdf,'original source PDF');f.write(originalTeacher,'original teacher PDF');f.write(path.join(run,'source/booklet.pdf'),'original source PDF');f.write(path.join(run,'source/teacher.pdf'),'original teacher PDF');
 const pdfHash=digest(originalPdf),teacherPdfHash=digest(originalTeacher),stateFile=path.join(run,'workflow/issues.json');f.write(stateFile,JSON.stringify({corrections:[]}));f.write(path.join(run,'manifest.json'),JSON.stringify({id:runId,source:{pdf:originalPdf,pdfHash,teacherPdf:originalTeacher,teacherPdfHash}}));
 f.project.source={runId,sourceHashes:{pdf:pdfHash,teacherPdf:teacherPdfHash},workflow:{runId,correctionIds:[]},inventory:{workflow:{runId,correctionIds:[]}}};f.write(f.projectFile,JSON.stringify(f.project));
 const report=JSON.parse(fs.readFileSync(path.join(f.out,'report.json')));for(const e of Object.values(report.report.p))e.projectHash=projectReviewHash(f.project);f.write(path.join(f.out,'report.json'),JSON.stringify(report));
 f.write(path.join(f.root,file),previous);f.write(path.join(f.root,'scripts/booklet/check-compact-exercises.mjs'),"import {liveWorkflow} from './workflow-review.mjs';");
 const files=snapshotFiles(f.root);for(const row of files)f.write(path.join(f.snapshot,row.path),fs.readFileSync(path.join(f.root,row.path)));f.write(path.join(f.out,'runtime-manifest.json'),JSON.stringify({root:f.root,snapshot:f.snapshot,files}));
 f.write(path.join(f.root,file),current);f.write(path.join(f.out,'frozen-export-receipt-1.json'),JSON.stringify({status:0,changedDependencies:[file]}));
 return {...f,file,run,stateFile,originalPdf,current,options:{...f.options,artifactReview:true},inactive:()=>inactiveAbsentParentGuardChange(file,f.project,f.root,f.snapshot)};
}
test('exact absent-parent hardening is inactive only for pinned materialized lean sources with known callers',()=>{
 const f=inactiveParentFixture();assert.equal(f.inactive(),true);assert.equal(verifyCompletedFrozenExport(f.options).reused,true);
 const cases=[
  g=>g.write(path.join(g.root,g.file),g.current+'\nexport const anotherChange=true;'),
  g=>g.write(g.stateFile,JSON.stringify({corrections:[{id:'active',status:'approved',patches:[{scope:'inventory',field:'/parentId',originalAbsent:true,original:null}]}]})),
  g=>g.write(path.join(g.root,'scripts/unknown-caller.mjs'),"import {materializeCorrections} from './booklet/workflow-review.mjs';"),
  g=>g.write(path.join(g.root,'src/unknown-caller.js'),"import {liveWorkflow} from '../scripts/booklet/workflow-review.mjs';"),
  g=>g.write(path.join(g.root,'scripts/booklet/check-compact-exercises.mjs'),"import {liveWorkflow,materializeCorrections} from './workflow-review.mjs';"),
  g=>g.write(g.originalPdf,'changed original source'),
  g=>g.write(path.join(g.run,'source/booklet.pdf'),'changed local source'),
  g=>{g.project.source.workflow.correctionIds=['unknown'];g.write(g.projectFile,JSON.stringify(g.project));},
 ];
 for(const edit of cases){const g=inactiveParentFixture();edit(g);assert.equal(g.inactive(),false);assert.throws(()=>verifyCompletedFrozenExport(g.options),/Dependencies changed during/);}
});
test('inactive importer hardening preserves frozen renderer, project and all PDF guards',()=>{
 const f=inactiveParentFixture();f.write(path.join(f.snapshot,'src/renderer.js'),'changed frozen renderer');assert.throws(()=>verifyCompletedFrozenExport(f.options),/Frozen renderer changed/);
 const g=inactiveParentFixture();g.project.title='Changed printed title';g.write(g.projectFile,JSON.stringify(g.project));assert.throws(()=>verifyCompletedFrozenExport(g.options),/Current project or checks differ/);
 const h=inactiveParentFixture();h.write(path.join(h.out,'worked.pdf'),'changed PDF');assert.throws(()=>verifyCompletedFrozenExport(h.options),/PDF changed for worked/);
});
