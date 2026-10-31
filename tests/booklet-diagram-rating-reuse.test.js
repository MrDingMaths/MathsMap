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

function inlineFixture(t,paragraph=false){
 const f=fixture(t),p=paragraph?['content','paragraphs',0,'text']:['content','prompt'];
 delete f.before.content.questionDiagrams;delete f.after.content.questionDiagrams;
 const text='Use this grid: [tikz]\\draw[step=1, gray!35] (0,0) grid (4,4); \\draw[step=2, gray!70] (0,0) grid (4,4); \\draw[gray!40] (0,0)--(4,0); \\node {label x};[/tikz] State the answer.';
 if(paragraph){f.before.content.paragraphs=[{type:'paragraph',text}];f.after.content.paragraphs=structuredClone(f.before.content.paragraphs);}else f.before.content.prompt=f.after.content.prompt=text;
 const set=(obj,parts,value)=>{const k=parts.at(-1);parts.slice(0,-1).reduce((v,x)=>v[x],obj)[k]=value;},get=(obj,parts)=>parts.reduce((v,x)=>v[x],obj);
 set(f.after,p,text.replace('gray!35','black!20').replace('gray!70','black!20'));
 f.before.classification={...f.before.classification,...assessedRating(f.before,f.before.classification,f.before.classification.assessment)};f.after.classification=structuredClone(f.before.classification);
 f.refresh=()=>{f.proof.sourceTaskHash=reasoningTaskHash(f.before);f.proof.targetTaskHash=reasoningTaskHash(f.after);for(const e of [f.semantic,f.visual]){e.sourceTaskHash=f.proof.sourceTaskHash;e.targetTaskHash=f.proof.targetTaskHash;}f.proof.semanticEvidence=f.write('semantic.json',f.semantic);f.proof.visualEvidence=f.write('visual.json',f.visual);f.proof.sourceArtifact={...f.write('before.json',{sections:[{blocks:[f.before]}]}),blockPath:['sections',0,'blocks',0]};f.proof.changes=[{kind:'inline-tikz-grid-palette-v1',path:p,beforeSha256:objectHash(get(f.before,p)),afterSha256:objectHash(get(f.after,p))}];};
 f.setAfter=value=>set(f.after,p,value);f.getAfter=()=>get(f.after,p);f.refresh();return f;
}
test('inline prompt and native paragraph grid palette changes preserve original rating lineage',t=>{
 for(const paragraph of [false,true]){const f=inlineFixture(t,paragraph),old=structuredClone(f.before.classification);const rating=reuseDiagramPresentationRating(f.before,f.after,{proofArtifact:f.pin(),confirmEquivalent:()=>true});for(const k of ['reasoningScore','difficulty','difficultyReason'])assert.equal(rating[k],old[k]);for(const k of ['model','assessedAt','evidence'])assert.equal(rating.assessment[k],old.assessment[k]);f.after.classification={...f.after.classification,...rating};assert(verifiedRating(f.after));}
});
test('inline palette proof rejects task, answer, label, grid, token and proof changes',t=>{
 for(const mutate of [
  f=>f.setAfter(f.getAfter().replace('State the answer','Explain the answer')),
  f=>f.setAfter(f.getAfter().replace('(4,4)','(5,4)')),
  f=>f.setAfter(f.getAfter().replace('label x','label y')),
  f=>f.setAfter(f.getAfter().replace('gray!40','black!20')),
  f=>f.setAfter(f.getAfter().replace('State the answer','State the answer labelled x')),
  f=>f.setAfter(f.getAfter().replace('black!20','black!21')),
  f=>f.setAfter(f.getAfter().replace('[/tikz]','')),
  f=>{f.after.content.answer.short='50 degrees';},
  f=>{f.proof.changes[0].kind='other-string-rebind';},
  f=>{f.proof.changes[0].beforeSha256='0'.repeat(64);},
 ]){const f=inlineFixture(t);mutate(f);if(f.proof.changes[0].kind==='inline-tikz-grid-palette-v1'&&f.proof.changes[0].beforeSha256!=='0'.repeat(64))f.refresh();assert.throws(()=>reuseDiagramPresentationRating(f.before,f.after,{proofArtifact:f.pin(),confirmEquivalent:()=>true}));}
});

function extraFixture(t,{layout=false}={}){
 const f=fixture(t);
 f.before.bankRef={id:'bank-one',revision:'old'};f.after.bankRef={id:'bank-one',revision:'new'};
 f.after.classification.archetype='corresponding';
 if(layout){f.before.presentation={layoutOverrides:{blockLayouts:{given:{diagramWidthMm:70}}}};f.after.presentation={layoutOverrides:{blockLayouts:{given:{diagramWidthMm:80}}}};}
 f.proof.sourceArtifact={...f.write('before.json',{sections:[{blocks:[f.before]}]}),blockPath:['sections',0,'blocks',0]};
 const at=(v,p)=>p.reduce((v,k)=>v?.[k],v);
 const add=(path,kind)=>({path,kind,beforeSha256:objectHash({value:at(f.before,path)}),afterSha256:objectHash({value:at(f.after,path)})});
 f.proof.additionalAdaptations=[add(['bankRef','revision'],'metadata'),add(['classification','archetype'],'metadata')];
 if(layout){const p=['presentation','layoutOverrides','blockLayouts','given','diagramWidthMm'];f.proof.additionalAdaptations.push({...add(p,'presentation'),visualEvidence:f.write('layout-visual.json',{...f.visual,adaptationPath:p,reason:'Actual final-size view retains labels and writing space.'})});}
 f.pinTarget=()=>{f.proof.targetArtifact={...f.write('target.json',{sections:[{blocks:[f.after]}]}),blockPath:['sections',0,'blocks',0]};};f.pinTarget();return f;
}
test('opt-in metadata and separately reviewed layout retain original rating and persisted lineage',t=>{
 for(const layout of [false,true]){const f=extraFixture(t,{layout});const rating=reuseDiagramPresentationRating(f.before,f.after,{proofArtifact:f.pin(),confirmEquivalent:e=>{assert(e.proof.additionalAdaptations.length>=2);return true;}});f.after.classification={...f.after.classification,...rating};assert(verifiedRating(f.after));assert.equal(f.after.bankRef.revision,'new');assert.equal(f.after.classification.archetype,'corresponding');}
});
test('additional route rejects unknown paths, changed bank identity, stale current snapshots and skill changes',t=>{
 for(const mutate of [f=>{f.proof.additionalAdaptations[0].path=['content','prompt'];},f=>{f.after.bankRef.id='another';f.pinTarget();},f=>{f.after.sourceReview={unexpected:true};},f=>{f.after.classification.primarySkillId='another';f.pinTarget();},f=>{f.after.classification.reasoningScore=19;f.pinTarget();}]){const f=extraFixture(t);mutate(f);assert.throws(()=>reuseDiagramPresentationRating(f.before,f.after,{proofArtifact:f.pin(),confirmEquivalent:()=>true}));}
});
test('layout adaptation requires its own actual visual evidence and matching path',t=>{
 for(const mutate of [f=>{delete f.proof.additionalAdaptations[2].visualEvidence;},f=>{f.proof.additionalAdaptations[2].visualEvidence=f.proof.visualEvidence;},f=>{fs.appendFileSync(f.imageFile,'changed');}]){const f=extraFixture(t,{layout:true});mutate(f);assert.throws(()=>reuseDiagramPresentationRating(f.before,f.after,{proofArtifact:f.pin(),confirmEquivalent:()=>true}));}
});
test('opt-in metadata cannot conceal changed prompt, answer, scaffold or diagram mathematical model',t=>{
 for(const mutate of [b=>{b.content.prompt+=' Prove it.';},b=>{b.content.answer.short='50';},b=>{b.content.children=[{id:'step',prompt:'Use this hint.'}];},b=>{b.content.questionDiagrams[0].mathematicalModel={angle:50};}]){const f=extraFixture(t);mutate(f.after);f.pinTarget();assert.throws(()=>reuseDiagramPresentationRating(f.before,f.after,{proofArtifact:f.pin(),confirmEquivalent:()=>true}));}
});
test('native table row-height reuse needs exact positive dimensions and per-table visual coverage',t=>{
 for(const valid of [true,false]){
  const f=extraFixture(t);f.before.content.responseTable={id:'table',type:'table',rows:[['given'],['answer']],rowHeights:[12,12]};f.after.content.responseTable=structuredClone(f.before.content.responseTable);f.after.content.responseTable.rowHeights=valid?[8,8]:[8,0];
  f.before.classification={...f.before.classification,...assessedRating(f.before,f.before.classification,f.before.classification.assessment)};f.after.classification={...f.before.classification,archetype:'corresponding'};
  f.proof.sourceTaskHash=reasoningTaskHash(f.before);f.proof.targetTaskHash=reasoningTaskHash(f.after);for(const evidence of [f.semantic,f.visual]){evidence.sourceTaskHash=f.proof.sourceTaskHash;evidence.targetTaskHash=f.proof.targetTaskHash;}
  f.proof.semanticEvidence=f.write('semantic.json',f.semantic);f.proof.visualEvidence=f.write('visual.json',f.visual);f.proof.sourceArtifact={...f.write('before.json',{sections:[{blocks:[f.before]}]}),blockPath:['sections',0,'blocks',0]};f.pinTarget();
  const p=['content','responseTable','rowHeights'];f.proof.additionalAdaptations.push({path:p,kind:'presentation',beforeSha256:objectHash({value:[12,12]}),afterSha256:objectHash({value:f.after.content.responseTable.rowHeights}),visualEvidence:f.write('rows-visual.json',{...f.visual,adaptationPath:p,reason:'Actual table retains all givens and adequate response space.'})});
  const reuse=()=>reuseDiagramPresentationRating(f.before,f.after,{proofArtifact:f.pin(),confirmEquivalent:()=>true});if(valid){f.after.classification={...f.after.classification,...reuse()};assert(verifiedRating(f.after));}else assert.throws(reuse,/row-height/);
 }
});


function houseFixture(t){
 const f=inlineFixture(t),a='Use: [tikz]\n\\begin{tikzpicture}\n\\draw[gray!35] (0,0) grid (4,4);\\node {x};\n\\end{tikzpicture}\n[/tikz] and [tikz]\n\\begin{tikzpicture}\n\\draw (0,0)--(1,1);\n\\end{tikzpicture}\n[/tikz]';
 f.before.content.prompt=a;f.after.content.prompt=a.replace('gray!35','black!20').replaceAll('\\begin{tikzpicture}','\\definecolor{blue}{HTML}{268CFF}\n\\begin{tikzpicture}');
 f.before.classification={...f.before.classification,...assessedRating(f.before,f.before.classification,f.before.classification.assessment)};f.after.classification=structuredClone(f.before.classification);f.refresh();f.proof.changes[0].kind='inline-tikz-house-palette-v1';return f;
}
test('house palette accepts combined grid and exact blue insertion in multiple blocks',t=>{const f=houseFixture(t),old=f.before.classification.assessment,rating=reuseDiagramPresentationRating(f.before,f.after,{proofArtifact:f.pin(),confirmEquivalent:()=>true});assert.equal(rating.assessment.model,old.model);assert.equal(rating.assessment.assessedAt,old.assessedAt);f.after.classification={...f.after.classification,...rating};assert(verifiedRating(f.after));});
test('house palette rejects other colours, alias positions, existing overrides and task changes',t=>{
 for(const mutate of [
  f=>f.after.content.prompt=f.after.content.prompt.replace('268CFF','268CFE'),
  f=>f.after.content.prompt=f.after.content.prompt.replace('\\definecolor{blue}{HTML}{268CFF}\n\\begin{tikzpicture}','\\begin{tikzpicture}\n\\definecolor{blue}{HTML}{268CFF}'),
  f=>f.after.content.prompt=f.after.content.prompt.replace('(4,4)','(5,4)'),
  f=>f.after.content.prompt=f.after.content.prompt.replace('{x}','{y}'),
  f=>f.after.content.prompt=f.after.content.prompt.replace('Use:','Explain:'),
  f=>f.after.content.answer.short='different',
  f=>{f.before.content.prompt=f.before.content.prompt.replace('\\begin{tikzpicture}','\\colorlet{blue}{red}\n\\begin{tikzpicture}');f.after.content.prompt=f.after.content.prompt.replace('\\begin{tikzpicture}','\\colorlet{blue}{red}\n\\begin{tikzpicture}');f.before.classification={...f.before.classification,...assessedRating(f.before,f.before.classification,f.before.classification.assessment)};f.after.classification=structuredClone(f.before.classification);},
 ]){const f=houseFixture(t);mutate(f);f.refresh();f.proof.changes[0].kind='inline-tikz-house-palette-v1';assert.throws(()=>reuseDiagramPresentationRating(f.before,f.after,{proofArtifact:f.pin(),confirmEquivalent:()=>true}));}
});
