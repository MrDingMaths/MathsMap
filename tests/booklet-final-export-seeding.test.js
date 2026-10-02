import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {isEligibleFinalExport,seedUnchangedFinalExports} from '../scripts/booklet/seed-final-export-cache.mjs';
import {layoutCacheKey,rendererSignature} from '../scripts/booklet/verification-cache.mjs';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const fixture=()=>({id:'seeding-fixture',reviewProfile:'textbook-three-pass-v1',sections:[{phase:'practice',blocks:[{type:'question',content:{prompt:'Solve x + 1 = 2.',answer:{short:'x = 1',worked:'Subtract 1: x = 1.'}}}]}]});
const manifestFor=(edition,renderer,key,pdf)=>({passed:true,mode:'full',reviewProfile:'textbook-three-pass-v1',edition,renderer,printableKey:key,pdf});

 test('eligibility requires exact mathematics, renderer, edition and PDF bytes',async()=>{
 const project=fixture(),renderer='fixture-renderer',pdfHash=hash(Buffer.from('retained PDF bytes'));
 const key=await layoutCacheKey(project,'student',renderer);
 const manifest=manifestFor('student',renderer,key,{path:'/fixture.pdf',hash:pdfHash});
 const input={manifest,edition:'student',renderer,printableKey:key,pdfHash};
 assert.equal(isEligibleFinalExport(input),true);
 const changed=structuredClone(project);changed.sections[0].blocks[0].content.prompt='Solve x + 1 = 3.';
 const changedKey=await layoutCacheKey(changed,'student',renderer);
 assert.notEqual(changedKey,key);
 assert.equal(isEligibleFinalExport({...input,printableKey:changedKey}),false);
 assert.equal(isEligibleFinalExport({...input,renderer:'changed-renderer'}),false);
 assert.equal(isEligibleFinalExport({...input,pdfHash:hash(Buffer.from('changed PDF bytes'))}),false);
 assert.equal(isEligibleFinalExport({...input,edition:'worked'}),false);
 assert.equal(isEligibleFinalExport({...input,printableKey:null}),false);
 assert.equal(isEligibleFinalExport({...input,manifest:{...manifest,passed:false}}),false);
 assert.equal(isEligibleFinalExport({...input,manifest:{...manifest,mode:'development'}}),false);
 assert.equal(isEligibleFinalExport({...input,manifest:{...manifest,reviewProfile:'legacy'}}),false);
 assert.equal(isEligibleFinalExport({...input,manifest:{...manifest,edition:undefined}}),false);
 });

 test('seeding copies verified bytes, preserves evidence and grants no visual credit',async t=>{
 const runDir=fs.mkdtempSync(path.join(os.tmpdir(),'booklet-seeding-'));
 t.after(()=>fs.rmSync(runDir,{recursive:true,force:true}));
 const project=fixture(),projectFile=path.join(runDir,'project.json'),source=path.join(runDir,'final-exports-source'),out=path.join(runDir,'final-exports-target');
 fs.mkdirSync(source);fs.writeFileSync(projectFile,JSON.stringify(project));
 const renderer=rendererSignature({lean:true}),key=await layoutCacheKey(project,'student',renderer),stem=project.id+'-student';
 const pdf=path.join(source,stem+'.pdf'),bytes=Buffer.from('%PDF-fixture\nretained test bytes\n'),pdfHash=hash(bytes);
 fs.writeFileSync(pdf,bytes);
 const sourceManifest=path.join(source,stem+'.full.pages.json');
 fs.writeFileSync(sourceManifest,JSON.stringify(manifestFor('student',renderer,key,{path:pdf,hash:pdfHash})));
 const originalManifestBytes=fs.readFileSync(sourceManifest);
 fs.writeFileSync(path.join(source,stem+'.verification.json'),JSON.stringify({key,passed:true,pdfHash,result:{fixture:true}}));
 const seeded=await seedUnchangedFinalExports({runDir,projectFile,out});
 assert.deepEqual(seeded.map(entry=>entry.edition),['student']);
 assert.equal(seeded[0].inspectionCredited,false);
 assert.equal(seeded[0].originalManifest.hash,hash(originalManifestBytes));
 assert.deepEqual(fs.readFileSync(sourceManifest),originalManifestBytes);
 assert.deepEqual(fs.readFileSync(path.join(out,stem+'.pdf')),bytes);
 assert.equal(JSON.parse(fs.readFileSync(path.join(out,stem+'.full.pages.json'),'utf8')).pdf.path,path.join(out,stem+'.pdf'));
 assert.deepEqual(fs.readFileSync(path.join(out,stem+'.verification.json')),fs.readFileSync(path.join(source,stem+'.verification.json')));
 const receipt=fs.readFileSync(path.join(out,'unchanged-export-seeds.json'));
 assert.deepEqual(await seedUnchangedFinalExports({runDir,projectFile,out}),[]);
 assert.deepEqual(fs.readFileSync(path.join(out,'unchanged-export-seeds.json')),receipt);
 assert.equal(fs.existsSync(path.join(out,'.seed-final-export-cache.lock')),false);

 const changedProject=structuredClone(project);changedProject.sections[0].blocks[0].content.prompt='Solve x + 1 = 4.';
 fs.writeFileSync(projectFile,JSON.stringify(changedProject));const decisions=[];
 assert.deepEqual(await seedUnchangedFinalExports({runDir,projectFile,out:path.join(runDir,'final-exports-changed'),onDecision:decision=>decisions.push(decision)}),[]);
 assert.ok(decisions.find(decision=>decision.edition==='student').candidates.some(candidate=>candidate.reason==='printable-dependencies-changed'));
 fs.writeFileSync(projectFile,JSON.stringify({...project,revision:99,comments:['Metadata-only update']}));
 const metadataOut=path.join(runDir,'final-exports-metadata');
 assert.equal((await seedUnchangedFinalExports({runDir,projectFile,out:metadataOut})).length,1);
 fs.renameSync(metadataOut,path.join(runDir,'preserved-metadata-target'));
 fs.writeFileSync(projectFile,JSON.stringify(project));

 // Isolate the negative candidates: the previously seeded valid copy is a
 // legitimate fallback and must not make a corrupt-source test fail.
 fs.renameSync(out,path.join(runDir,'preserved-seeded-target'));
 fs.writeFileSync(pdf,Buffer.from('corrupted retained PDF'));
 assert.deepEqual(await seedUnchangedFinalExports({runDir,projectFile,out:path.join(runDir,'final-exports-corrupt')}),[]);
 fs.writeFileSync(pdf,bytes);
 const outsidePdf=path.join(runDir,'outside.pdf');fs.writeFileSync(outsidePdf,bytes);
 fs.writeFileSync(sourceManifest,JSON.stringify(manifestFor('student',renderer,key,{path:outsidePdf,hash:pdfHash})));
 assert.deepEqual(await seedUnchangedFinalExports({runDir,projectFile,out:path.join(runDir,'final-exports-escape')}),[]);
 fs.writeFileSync(sourceManifest,originalManifestBytes);
 fs.writeFileSync(path.join(source,stem+'.verification.json'),JSON.stringify({key,passed:true,pdfHash:hash(Buffer.from('wrong bytes')),result:{fixture:true}}));
 const cacheOut=path.join(runDir,'final-exports-invalid-cache');
 assert.equal((await seedUnchangedFinalExports({runDir,projectFile,out:cacheOut})).length,1);
 assert.equal(fs.existsSync(path.join(cacheOut,stem+'.verification.json')),false);

 const sibling=runDir+'-outside';
 await assert.rejects(seedUnchangedFinalExports({runDir,projectFile,out:sibling}),/direct final-exports/);
 assert.equal(fs.existsSync(sibling),false);
 project.id='../escape';fs.writeFileSync(projectFile,JSON.stringify(project));
 await assert.rejects(seedUnchangedFinalExports({runDir,projectFile,out:path.join(runDir,'final-exports-unsafe-id')}),/Unsafe project/);
 assert.equal(fs.existsSync(path.join(runDir,'final-exports-unsafe-id')),false);
 });
