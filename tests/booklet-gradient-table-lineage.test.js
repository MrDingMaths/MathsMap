import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {sharedQuestion} from '../src/lib/question-sync.js';
import {normaliseQuestion} from '../src/lib/practice-question-model.js';
import {GRADIENT_TABLE_KIND,gradientTableRenderEvidence} from '../scripts/booklet/gradient-table-lineage.mjs';
import {reasoningTaskHash,verifiedRating,reuseGradientTablePresentationRating} from '../scripts/booklet/reasoning-ratings.mjs';
const hash=v=>createHash('sha256').update(v).digest('hex');
function fixture(t,{alreadyAdapted=false}={}){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'gradient-table-lineage-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const project=JSON.parse(fs.readFileSync(new URL('../booklets/projects/gradient-intercept-form-v1.json',import.meta.url)));project.revision=381;
 const si=project.sections.findIndex(s=>s.blocks.some(b=>b.id==='p33-q3-block')),bi=project.sections[si].blocks.findIndex(b=>b.id==='p33-q3-block'),target=project.sections[si].blocks[bi];
 if(alreadyAdapted&&!target.classification.assessment.gradientTablePresentationAdaptations?.length){const originalAssessment=structuredClone(target.classification.assessment);target.classification.assessment.gradientTablePresentationAdaptations=[{originalAssessment}];}
 const original=target.classification.assessment.gradientTablePresentationAdaptations?.[0]?.originalAssessment;if(original)target.classification.assessment=structuredClone(original);
 const source=structuredClone(target);source.content.prompt.blocks[1].border=true;
 const write=(name,value)=>{const file=path.join(dir,name);fs.writeFileSync(file,JSON.stringify(value));return{path:file,sha256:hash(fs.readFileSync(file))};};
 const reply=write('reply.json',{ratings:[{id:source.id,reasoningScore:source.classification.reasoningScore,difficultyReason:source.classification.difficultyReason}]});source.classification.assessment.evidence=reply.path;
 const proof={kind:GRADIENT_TABLE_KIND,projectId:project.id,blockId:source.id,sourceTaskHash:reasoningTaskHash(source),targetTaskHash:reasoningTaskHash(target),sourceArtifact:{...write('source.json',source),blockPath:[]},targetArtifact:{...write('current.json',project),blockPath:['sections',si,'blocks',bi]},ratedInputArtifact:write('input.json',{questions:[{id:source.id,taskHash:reasoningTaskHash(source),task:sharedQuestion({...normaliseQuestion(source),title:''}).content}]}),ratingReplyArtifact:reply,change:{path:['content','prompt','blocks',1,'border'],before:true,after:false},renderEvidence:gradientTableRenderEvidence(source,target)};
 const pin=()=>write('proof.json',proof),reuse=()=>reuseGradientTablePresentationRating(source,target,{proofArtifact:pin(),confirmEquivalent:()=>true});return{source,target,project,proof,write,pin,reuse};
}
test('exact decorative border reuses actual assessment with original/current hashes and no new score',t=>{
 const f=fixture(t);assert(verifiedRating(f.source));assert(!verifiedRating(f.target));const r=f.reuse();
 for(const k of ['reasoningScore','difficulty','difficultyReason'])assert.equal(r[k],f.source.classification[k]);
 for(const k of ['model','assessedAt','rubricVersion','evidence'])assert.equal(r.assessment[k],f.source.classification.assessment[k]);
 assert.equal(r.assessment.originalTaskHash,reasoningTaskHash(f.source));assert.equal(r.assessment.taskHash,reasoningTaskHash(f.target));assert.equal(r.assessment.gradientTablePresentationAdaptations[0].newAssessmentPerformed,false);assert(verifiedRating(f.target,{...f.target.classification,...r}));
});
test('fixture restores original assessment on both snapshots after already-published lineage without a live write',t=>{
 const f=fixture(t,{alreadyAdapted:true});
 assert(!f.target.classification.assessment.gradientTablePresentationAdaptations);
 assert(!f.source.classification.assessment.gradientTablePresentationAdaptations);
 assert.equal(f.target.classification.assessment.taskHash,f.source.classification.assessment.taskHash);
 for(const key of ['model','assessedAt','rubricVersion'])assert.equal(f.target.classification.assessment[key],f.source.classification.assessment[key]);
 for(const key of ['reasoningScore','difficultyReason'])assert.equal(f.target.classification[key],f.source.classification[key]);
 assert(!verifiedRating(f.target));assert(verifiedRating(f.source));assert(verifiedRating(f.target,{...f.target.classification,...f.reuse()}));
});
test('coordinator confirmation mandatory, not an acceptance boolean in the proof',t=>{const f=fixture(t);assert.throws(()=>reuseGradientTablePresentationRating(f.source,f.target,{proofArtifact:f.pin()}),/Coordinator/);assert.throws(()=>reuseGradientTablePresentationRating(f.source,f.target,{proofArtifact:f.pin(),confirmEquivalent:()=>false}),/not confirmed/);});
test('equations labels row relationships response cells answers diagrams and mapping changes rejected',t=>{
 const f=fixture(t);for(const mutate of [b=>b.content.prompt.blocks[1].rows[0][0].blocks[0].inlines[1].latex='x+y=4',b=>b.content.prompt.blocks[1].rows[0][0].blocks[0].inlines[0].text='b  ',b=>b.content.prompt.blocks[1].rows.reverse(),b=>b.content.prompt.blocks[1].rows[0][0].responseKind='working',b=>b.content.children[0].answer.short='wrong',b=>b.content.questionDiagrams[0].code+='changed graph',b=>b.classification.primarySkillId='other',b=>b.content.prompt.blocks[1].widthMm++]){
  const target=structuredClone(f.target);mutate(target);assert.throws(()=>reuseGradientTablePresentationRating(f.source,target,{proofArtifact:f.pin(),confirmEquivalent:()=>true}));
 }
});
test('pinned actual rated task and raw original rating must match the reconstructed source',t=>{
 const f=fixture(t),input=JSON.parse(fs.readFileSync(f.proof.ratedInputArtifact.path));input.questions[0].task.prompt='different task';f.proof.ratedInputArtifact=f.write('bad-input.json',input);assert.throws(f.reuse,/actual rated input/);
 const g=fixture(t),reply=JSON.parse(fs.readFileSync(g.proof.ratingReplyArtifact.path));reply.ratings[0].reasoningScore++;g.proof.ratingReplyArtifact=g.write('reply.json',reply);assert.throws(g.reuse,/raw assessment/);
});
test('foreign scope widened change and fabricated renderer evidence rejected',t=>{
 const f=fixture(t),original=structuredClone(f.proof);for(const mutate of [p=>p.blockId='other',p=>p.projectId='other',p=>p.change.path=['content','prompt'],p=>p.sourceTaskHash='0'.repeat(64),p=>p.renderEvidence.tableRole='response grid',p=>p.renderEvidence.shortWorkedOutputSha256='1'.repeat(64)]){Object.assign(f.proof,structuredClone(original));mutate(f.proof);assert.throws(f.reuse);}
});
test('persisted lineage rechecks source/proof artifacts and original model/history',t=>{
 const f=fixture(t),r=f.reuse(),rated={...f.target,classification:{...f.target.classification,...r}};assert(verifiedRating(rated));const bad=structuredClone(rated);bad.classification.assessment.gradientTablePresentationAdaptations[0].originalAssessment.model='invented';assert(!verifiedRating(bad));fs.appendFileSync(f.proof.sourceArtifact.path,' ');assert(!verifiedRating(rated));
});
test('native response or semantic grid cannot masquerade as this equation-list render evidence',t=>{
 const f=fixture(t),source=structuredClone(f.source);source.content.prompt.blocks[1].rows[0][0].blocks[0].inlines.push({type:'cloze',answer:'x',width:10});assert.throws(()=>gradientTableRenderEvidence(source,f.target),/response cell/);
});
