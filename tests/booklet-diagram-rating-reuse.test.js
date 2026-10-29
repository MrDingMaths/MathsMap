import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {assessedRating,reasoningTaskHash,reuseDiagramPresentationRating,verifiedRating} from '../scripts/booklet/reasoning-ratings.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');
const objectHash=value=>hash(JSON.stringify(value));
function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mathsmap-diagram-rating-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const write=(name,value)=>{const file=path.join(dir,name);fs.writeFileSync(file,JSON.stringify(value));return{path:file,sha256:hash(fs.readFileSync(file))};};
 const before={id:'q1',type:'question',content:{id:'root',type:'question',prompt:'Use the two parallel lines to find x.',questionDiagrams:[{id:'given',format:'tikz',code:'\\draw (0,0)--(2,0); % two markers',widthMm:70}],answer:{short:'40 degrees',worked:'Corresponding angles are equal.'}},classification:{primarySkillId:'parallel-lines'}};
 before.classification={...before.classification,...assessedRating(before,{reasoningScore:18,difficulty:'Foundation',difficultyReason:'Identify corresponding angles from the given parallel lines.'},{model:'gpt-6.1-sol',assessedAt:'2026-10-21T01:00:00Z',evidence:'original-independent-review.txt'})};
 const after=structuredClone(before);after.content.questionDiagrams[0].code='\\draw (0,0)--(3,0); % same two markers, clearer placement';after.content.questionDiagrams[0].widthMm=80;
 const sourceArtifact={...write('before.json',{sections:[{blocks:[before]}]}),blockPath:['sections',0,'blocks',0]};
 const sourceTaskHash=reasoningTaskHash(before),targetTaskHash=reasoningTaskHash(after);
 const math={givens:{angle:40},parallelPairs:[['AB','CD']],markerMultiplicities:[2],scaffolding:'unchanged'};
 const semantic={sourceTaskHash,targetTaskHash,mathematicsBefore:math,mathematicsAfter:structuredClone(math)};
 const imageFile=path.join(dir,'actual-view.png');fs.writeFileSync(imageFile,'retained raster fixture');
 const visual={sourceTaskHash,targetTaskHash,accepted:true,images:[{path:imageFile,sha256:hash(fs.readFileSync(imageFile))}]};
 const proof={kind:'diagram-presentation-only-v1',sourceArtifact,sourceTaskHash,targetTaskHash,changes:[{path:['content','questionDiagrams',0],beforeSha256:objectHash(before.content.questionDiagrams[0]),afterSha256:objectHash(after.content.questionDiagrams[0])}],semanticEvidence:write('semantic.json',semantic),visualEvidence:write('visual.json',visual)};
 const pin=()=>write('proof.json',proof);
 return{before,after,proof,semantic,visual,write,pin,imageFile};
}
test('presentation repair retains actual score/model/date/raw assessment and verifies persisted lineage',t=>{
 const f=fixture(t),old=structuredClone(f.before.classification),artifact=f.pin();let confirmed=0;
 const rating=reuseDiagramPresentationRating(f.before,f.after,{proofArtifact:artifact,confirmEquivalent:e=>{confirmed++;assert.deepEqual(e.semanticEvidence.mathematicsBefore,e.semanticEvidence.mathematicsAfter);return true;}});
 assert.equal(confirmed,1);for(const key of ['reasoningScore','difficulty','difficultyReason'])assert.equal(rating[key],old[key]);
 assert.equal(rating.assessment.model,old.assessment.model);assert.equal(rating.assessment.assessedAt,old.assessment.assessedAt);assert.equal(rating.assessment.evidence,old.assessment.evidence);
 assert.equal(rating.assessment.originalTaskHash,old.assessment.taskHash);assert.notEqual(rating.assessment.taskHash,old.assessment.taskHash);
 assert.deepEqual(rating.assessment.diagramPresentationAdaptations[0].originalAssessment,old.assessment);
 f.after.classification={...f.after.classification,...rating};assert(verifiedRating(f.after));
 const persisted=JSON.parse(JSON.stringify(f.after));assert(verifiedRating(persisted));assert.deepEqual(f.before.classification,old);
});
test('coordinator review is mandatory, not a bare model boolean',t=>{
 const f=fixture(t);assert.throws(()=>reuseDiagramPresentationRating(f.before,f.after,{proofArtifact:f.pin(),confirmed:true}),/Coordinator/);
 assert.throws(()=>reuseDiagramPresentationRating(f.before,f.after,{proofArtifact:f.pin(),confirmEquivalent:()=>false}),/not confirmed/);
});
test('prompt, answer and scaffolding changes cannot be hidden behind diagram equivalence',t=>{
 for(const mutate of [b=>b.content.prompt+=' Now prove the converse.',b=>b.content.answer.short='50 degrees',b=>{b.content.children=[{id:'new',prompt:'Explain why.'}];}]){
  const f=fixture(t);mutate(f.after);f.proof.targetTaskHash=reasoningTaskHash(f.after);f.semantic.targetTaskHash=f.proof.targetTaskHash;f.visual.targetTaskHash=f.proof.targetTaskHash;f.proof.semanticEvidence=f.write('semantic.json',f.semantic);f.proof.visualEvidence=f.write('visual.json',f.visual);
  assert.throws(()=>reuseDiagramPresentationRating(f.before,f.after,{proofArtifact:f.pin(),confirmEquivalent:()=>true}),/Non-diagram/);
 }
});
test('changed mathematical relationships, data and marker multiplicity are rejected even with claimed approval',t=>{
 for(const mutate of [m=>{m.parallelPairs=[];},m=>{m.markerMultiplicities=[1];},m=>{m.givens.angle=50;}]){
  const f=fixture(t);mutate(f.semantic.mathematicsAfter);f.proof.semanticEvidence=f.write('semantic.json',f.semantic);
  assert.throws(()=>reuseDiagramPresentationRating(f.before,f.after,{proofArtifact:f.pin(),confirmEquivalent:()=>true}),/mathematics changed/);
 }
});
test('stale or unreviewed source questions cannot acquire an assessment through a diagram repair',t=>{
 const f=fixture(t);f.before.classification.assessment.taskHash='stale';f.after.classification=structuredClone(f.before.classification);f.proof.sourceArtifact={...f.write('before.json',{sections:[{blocks:[f.before]}]}),blockPath:['sections',0,'blocks',0]};
 assert.throws(()=>reuseDiagramPresentationRating(f.before,f.after,{proofArtifact:f.pin(),confirmEquivalent:()=>true}),/Unverified original/);
});
test('readback rejects mutated evidence, images, history, score or task',t=>{
 for(const mutate of [f=>fs.appendFileSync(f.imageFile,'changed'),f=>fs.appendFileSync(f.proof.semanticEvidence.path,' '),f=>{f.after.classification.assessment.diagramPresentationAdaptations[0].originalAssessment.model='invented';},f=>{f.after.classification.reasoningScore=19;},f=>{f.after.content.answer.worked+=' Assume another fact.';}]){
  const f=fixture(t),rating=reuseDiagramPresentationRating(f.before,f.after,{proofArtifact:f.pin(),confirmEquivalent:()=>true});f.after.classification={...f.after.classification,...rating};mutate(f);assert.equal(verifiedRating(f.after),false);
 }
});
