// Targeted feedback maintenance. Uses the shared revision/hash-checked bank transaction.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {normaliseDiagramColours} from './normalise-diagram-colours.mjs';
import {revisionHash} from './bank-sync.mjs';
import {resolveArrangement} from '../../src/lib/booklet-arrangement.js';
import {retainDifficultyAsMetadata} from '../../src/lib/booklet-difficulty-headings.js';
import {setEquationRowSpacing} from '../../public/libs/maths-editor/equation-spacing.mjs';
export function repairVolumeFeedback(project,slotMm){
 if(project.id!=='volume-v1')return {next:project,records:[]};
 const next=structuredClone(project),records=[];
 const note=(block,location,reason,before)=>records.push({id:block.id,location,reason,before:revisionHash(before),after:revisionHash(block)});
 for(const [si,s]of next.sections.entries())for(const [bi,b]of s.blocks.entries()){
  const before=structuredClone(b),location=`/sections/${si}/blocks/${bi}`;let reason='';
  if(b.id==='p2-syllabus-title'&&b.presentation?.kind!=='main-section-header'){
   b.sourceLayoutEvidence={...b.sourceLayoutEvidence,originalContent:structuredClone(b.content)};
   const paragraph=b.content.blocks[0].rows[0][0].blocks[0];
   b.content={format:'maths-editor-document-v1',version:1,blocks:[{...paragraph,fontSize:null}]};
   b.presentation={...b.presentation,kind:'main-section-header'};reason='Syllabus title uses the shared main section band; original table and its identities retained as evidence.';
  }
  if(b.id==='p34-foundation'&&!b.presentation?.editorOnly){Object.assign(b,retainDifficultyAsMetadata(b));reason='Source difficulty label retained as editor metadata; excluded from every printed edition.';}
  if(b.id==='p16-q1'){
   const arrangement=next.settings.layoutOverrides.blockLayouts[b.id].arrangement;
   const walk=n=>{if(/^p16-q1-[abc]:diagram-slot$/.test(n.id)){n.minHeight=slotMm;n.verticalAlign='bottom';}n.children?.forEach(walk);};
   const old=revisionHash(arrangement);walk(arrangement.root);
   if(old!==revisionHash(arrangement)){b.sourceReview={...b.sourceReview,arrangementOverride:structuredClone(arrangement)};reason=`Equal ${slotMm} mm slots, measured from the tallest diagram, bottom-aligned with 2 mm scaffold gaps.`;}
  }
  if(b.id==='p20-q1'){
   for(const part of b.content.children){
    if(['a','b','c'].includes(part.label))for(const paragraph of part.prompt.blocks)for(const inline of paragraph.inlines??[])if(inline.type==='math')inline.latex=setEquationRowSpacing(inline.latex,3);
    if(part.id==='p20-q1-l')part.prompt.blocks=part.prompt.blocks.filter(p=>p.id!=='c37e37ac-3c97-4adc-a000-7dc8e1cc07bc');
   }
   if(revisionHash(b)!==revisionHash(before))reason='Q1 a–c use 3 mm added equation row spacing; removed the specified empty paragraph in l.';
  }
  if(b.id==='p24-example-demonstrations'){
   const existing=next.settings.layoutOverrides.blockLayouts[b.id]?.arrangement;
   const arrangement=resolveArrangement(b,existing).tree;
   const walk=n=>{if(n.type==='item'&&/^p24-example-(left|right)-diagram$/.test(n.ref))n.before=2;n.children?.forEach(walk);};walk(arrangement.root);
   if(revisionHash(existing??null)!==revisionHash(arrangement)){next.settings.layoutOverrides.blockLayouts[b.id]={...next.settings.layoutOverrides.blockLayouts[b.id],arrangement};b.sourceReview={...b.sourceReview,arrangementOverride:structuredClone(arrangement)};reason='Move both cylinder images down 2 mm without resizing or changing their mathematics.';}
  }
  if(reason){if(b.sourceReview?.verification)b.sourceReview.verification={...b.sourceReview.verification,checked:false};note(b,location,reason,before);}
 }
 return {next,records};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const out='.booklet-work/volume-r198';fs.mkdirSync(out,{recursive:true});
 const measurement=JSON.parse(fs.readFileSync(out+'/diagram-measurements.json'));
 assert.equal(measurement.revision,198);assert.ok(measurement.slotMm>0&&measurement.slotMm<57);
 const original=JSON.parse(fs.readFileSync('booklets/projects/volume-v1.json'));
 if(!fs.existsSync(out+'/original.json'))fs.writeFileSync(out+'/original.json',JSON.stringify(original,null,2));
 const started=new Date().toISOString();
 const report=await normaliseDiagramColours({apply:process.argv.includes('--apply'),migrate:p=>repairVolumeFeedback(p,measurement.slotMm),policy:'Volume revision 198 feedback'});
 fs.writeFileSync(out+'/maintenance.json',JSON.stringify({started,finished:new Date().toISOString(),...report},null,2));
 console.log(JSON.stringify({applied:report.applied,files:report.files,projects:report.projects.map(p=>({id:p.id,changes:p.records.length}))}));
}

