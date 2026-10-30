import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {CONSTRUCT_BLANK_KIND,constructBlankRenderEvidence} from '../scripts/booklet/construct-blank-lineage.mjs';
import {reasoningTaskHash,verifiedRating,reuseConstructBlankPresentationRating} from '../scripts/booklet/reasoning-ratings.mjs';
const hash=v=>createHash('sha256').update(v).digest('hex');
function fixture(t,{alreadyAdapted=false}={}){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'construct-blank-lineage-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 // This exact opt-in follows the committed real task, not a generic fake task.
 const current=JSON.parse(fs.readFileSync(new URL('../booklets/projects/s6adv-working-with-functions-7-constructing-and-using-functions-v1.json',import.meta.url)));
 current.revision=8;
 const si=current.sections.findIndex(s=>s.blocks.some(b=>b.id==='p4-q1')),bi=current.sections[si].blocks.findIndex(b=>b.id==='p4-q1'),bp=['sections',si,'blocks',bi],target=current.sections[si].blocks[bi],sourceProject=structuredClone(current),source=sourceProject.sections[si].blocks[bi];
 if(alreadyAdapted&&!target.classification.assessment.constructBlankPresentationAdaptations?.length){
  const originalAssessment=structuredClone(target.classification.assessment);
  target.classification.assessment={...originalAssessment,taskHash:reasoningTaskHash(target),constructBlankPresentationAdaptations:[{originalAssessment}]};
 }
 // Read the original assessment from either a published lineage or the stale
 // pre-publication target. Both fixture snapshots must model the original r8.
 const original=target.classification.assessment.constructBlankPresentationAdaptations?.[0]?.originalAssessment;
 if(original){source.classification.assessment=structuredClone(original);target.classification.assessment=structuredClone(original);}
 source.content.children[0].children[1].prompt.blocks[2].inlines[0]={type:'cloze',answer:'$\\$2$ at 0 hours (initial cost)',width:57};
 for(const i of [0,1])source.content.children[i].children[2].prompt.blocks[1].align='center';
 const layoutChanges=[];
 for(let i=0;i<8;i++){const before=source.content.children[i].questionDiagrams[0],after=target.content.children[i].questionDiagrams[0];before.widthMm=70;layoutChanges.push({path:['content','children',i,'questionDiagrams',0,'widthMm'],before:70,after:after.widthMm});}
 const sourceLayout=structuredClone(source);for(let i=0;i<8;i++)sourceLayout.content.children[i].questionDiagrams[0].widthMm=target.content.children[i].questionDiagrams[0].widthMm;
 const write=(name,v)=>{const file=path.join(dir,name);fs.writeFileSync(file,JSON.stringify(v));return{path:file,sha256:hash(fs.readFileSync(file))};};
 const proof={kind:CONSTRUCT_BLANK_KIND,projectId:current.id,blockId:'p4-q1',sourceTaskHash:reasoningTaskHash(source),targetTaskHash:reasoningTaskHash(target),sourceArtifact:{...write('source.json',sourceProject),blockPath:bp},targetArtifact:{...write('current.json',current),blockPath:bp},layoutChanges,renderEvidence:constructBlankRenderEvidence(sourceLayout,target)};
 const pin=()=>write('proof.json',proof);
 return {source,target,current,sourceProject,proof,write,pin,reuse:()=>reuseConstructBlankPresentationRating(source,target,{proofArtifact:pin(),confirmEquivalent:()=>true})};
}
test('exact real hidden blank lineage preserves score/model/date/evidence with explicit original and current hashes',t=>{
 const f=fixture(t);assert(verifiedRating(f.source));assert(!verifiedRating(f.target));
 const r=f.reuse();for(const k of ['reasoningScore','difficulty','difficultyReason'])assert.equal(r[k],f.source.classification[k]);
 for(const k of ['model','assessedAt','rubricVersion','evidence'])assert.equal(r.assessment[k],f.source.classification.assessment[k]);
 assert.equal(r.assessment.originalTaskHash,reasoningTaskHash(f.source));assert.equal(r.assessment.taskHash,reasoningTaskHash(f.target));
 assert.equal(r.assessment.constructBlankPresentationAdaptations[0].newAssessmentPerformed,false);
 assert(verifiedRating(f.target,{...f.target.classification,...r}));
});
test('explicit coordinator confirmation required; matching hashes alone never approve reuse',t=>{
 const f=fixture(t);assert.throws(()=>reuseConstructBlankPresentationRating(f.source,f.target,{proofArtifact:f.pin()}),/Coordinator/);
 assert.throws(()=>reuseConstructBlankPresentationRating(f.source,f.target,{proofArtifact:f.pin(),confirmEquivalent:()=>false}),/not confirmed/);
});
test('fixture remains the stale r8 target when committed content already carries lineage',t=>{
 const f=fixture(t,{alreadyAdapted:true});
 assert(!f.target.classification.assessment.constructBlankPresentationAdaptations);
 assert(!verifiedRating(f.target));assert(verifiedRating(f.source));
 const r=f.reuse();assert(verifiedRating(f.target,{...f.target.classification,...r}));
 for(const key of ['reasoningScore','difficultyReason'])assert.equal(r[key],f.source.classification[key]);
});
test('given, answer, diagram, step, mapping and scaffold mutations refuse exact opt-in',t=>{
 const f=fixture(t);for(const change of [b=>b.content.children[0].prompt+='Changed given',b=>b.content.children[0].children[0].answer.short='Changed answer',b=>b.content.children[0].questionDiagrams[0].code+='Changed relation',b=>b.content.children[0].children.reverse(),b=>b.classification.primarySkillId='other',b=>b.content.children[0].children[1].prompt.blocks[2].inlines[0].latex='\\hspace{50mm}']){
  const bad=structuredClone(f.target);change(bad);assert.throws(()=>reuseConstructBlankPresentationRating(f.source,bad,{proofArtifact:f.pin(),confirmEquivalent:()=>true}));
 }
});
test('different owner, foreign project or widened alignment scope refused',t=>{
 const f=fixture(t);f.proof.blockId='other';assert.throws(f.reuse,/Foreign/);f.proof.blockId='p4-q1';f.proof.projectId='other';assert.throws(f.reuse,/Foreign/);
 f.proof.projectId=f.current.id;const bad=structuredClone(f.target);bad.content.children[2].prompt={format:'maths-editor-document-v1',blocks:[{type:'paragraph',align:'left',inlines:[]}]};assert.throws(()=>reuseConstructBlankPresentationRating(f.source,bad,{proofArtifact:f.pin(),confirmEquivalent:()=>true}));
});
test('tampered snapshots, layout proof and renderer evidence refuse reuse',t=>{
 const f=fixture(t);const original=structuredClone(f.proof);
 for(const change of [p=>p.sourceArtifact.sha256='0'.repeat(64),p=>p.targetArtifact.sha256='1'.repeat(64),p=>p.layoutChanges[0].after++,p=>p.renderEvidence.studentOutputSha256='2'.repeat(64),p=>p.renderEvidence.shortWorkedOutputSha256='3'.repeat(64),p=>p.sourceTaskHash='4'.repeat(64)]){Object.assign(f.proof,structuredClone(original));change(f.proof);assert.throws(f.reuse);}
});
test('persisted lineage rechecks proof artifacts and original assessment, never accepts a saved boolean',t=>{
 const f=fixture(t),r=f.reuse(),rated={...f.target,classification:{...f.target.classification,...r}};assert(verifiedRating(rated));
 const bad=structuredClone(rated);bad.classification.assessment.constructBlankPresentationAdaptations[0].originalAssessment.model='invented';assert(!verifiedRating(bad));
 fs.appendFileSync(f.proof.sourceArtifact.path,' ');assert(!verifiedRating(rated));
});
test('old response must be hidden and contain no additional hint or scaffold',t=>{
 const f=fixture(t),layout=structuredClone(f.source);for(let i=0;i<8;i++)layout.content.children[i].questionDiagrams[0].widthMm=f.target.content.children[i].questionDiagrams[0].widthMm;
 layout.content.children[0].children[1].prompt.blocks[2].inlines[0].hint='Use the initial cost';assert.throws(()=>constructBlankRenderEvidence(layout,f.target),/Unexpected blank/);
 delete layout.content.children[0].children[1].prompt.blocks[2].inlines[0].hint;layout.presentation={permanentTeachingPrompt:true};assert.throws(()=>constructBlankRenderEvidence(layout,f.target),/Prompt may be exposed/);
});
