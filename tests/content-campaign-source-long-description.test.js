import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {hashValue,unavailableImageDecisionHash,validateSourceImages,SOURCE_LONG_DESCRIPTION_PROFILE} from '../scripts/content/campaign-sources.mjs';

function fixture(t, stage=5) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'mathsmap-source-description-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const sourcePath=`syllabus/Stage ${stage} Content.md`;
  const text=['# Probability','+----------------------------+','| **Example(s):**            |','| ![Two coins](media/missing.png) |','|                            |','| *Image long description*: H and T branch first, |','| then H and T from each branch: HH, HT, TH and TT. |','+----------------------------+','Other source context.'].join('\n');
  fs.mkdirSync(path.join(root,'syllabus'),{recursive:true});fs.writeFileSync(path.join(root,sourcePath),text);
  const gap={path:'syllabus/media/missing.png',profile:SOURCE_LONG_DESCRIPTION_PROFILE,nonessential:true,reason:'Complete source-authored alternative records every branch and outcome.',textAlternative:'H and T branch first, then H and T from each branch: HH, HT, TH and TT.',textAlternativeLocator:{path:sourcePath,sourceHash:hashValue(text),startLine:6,endLine:7,imageLine:4,boxStartLine:2,boxEndLine:8}};
  const ref={path:sourcePath,hash:hashValue(text),startLine:1,endLine:8,unavailableImages:[gap]};return {root,ref,gap,text,sourcePath};
}
for(const stage of [4,5,6])test(`Stage ${stage} explicit source description remains candidate until author acceptance`,t=>{
  const {root,ref,gap}=fixture(t,stage);assert.deepEqual(validateSourceImages(root,ref),[]);
  assert.throws(()=>validateSourceImages(root,ref,{requireAccepted:true}),/Author must explicitly accept/);
  gap.accepted=true;gap.observation='Complete source text supplies all outcomes; no original pixels viewed.';assert.deepEqual(validateSourceImages(root,ref,{requireAccepted:true}),[]);
});
test('legacy Stage3 gap decision hash and behavior remain exact',t=>{
  const {root,ref,gap}=fixture(t,3);delete gap.profile;gap.textAlternativeLocator='Historical locator';
  const legacy={path:gap.path,nonessential:gap.nonessential,reason:gap.reason,textAlternative:gap.textAlternative,textAlternativeLocator:gap.textAlternativeLocator,matchingBookletStyle:gap.matchingBookletStyle};
  assert.equal(unavailableImageDecisionHash(gap),hashValue(legacy));assert.deepEqual(validateSourceImages(root,ref),[]);
});
const mutations={
  'no opt-in':f=>delete f.gap.profile,
  'unknown profile':f=>f.gap.profile='general-missing-image-waiver',
  'essential figure':f=>f.gap.nonessential=false,
  'stale source hash':f=>f.ref.hash='stale',
  'stale locator hash':f=>f.gap.textAlternativeLocator.sourceHash='stale',
  'foreign locator':f=>f.gap.textAlternativeLocator.path='syllabus/Stage 4 Content.md',
  'string locator':f=>f.gap.textAlternativeLocator='lines6–7',
  'truncated body':f=>{f.gap.textAlternativeLocator.endLine=6;f.gap.textAlternative='H and T branch first,';},
  'copied alternative':f=>f.gap.textAlternative='All outcomes are red and blue.',
  'out-of-range locator':f=>f.gap.textAlternativeLocator.endLine=100,
  'wrong image row':f=>f.gap.textAlternativeLocator.imageLine=3,
  'wrong box start':f=>f.gap.textAlternativeLocator.boxStartLine=1,
  'truncated selected source':f=>f.ref.endLine=7,
  'description outside selected ref':f=>f.ref.startLine=4,
  'duplicate declaration':f=>f.ref.unavailableImages.push(structuredClone(f.gap)),
  'newly existing image':f=>{fs.mkdirSync(path.join(f.root,'syllabus/media'));fs.writeFileSync(path.join(f.root,f.gap.path),'new image');},
  'original booklet figure':f=>{const newPath='booklets/mathsmap-sources/Stage 6/Walking.md';fs.mkdirSync(path.dirname(path.join(f.root,newPath)),{recursive:true});fs.writeFileSync(path.join(f.root,newPath),f.text);f.ref.path=newPath;f.gap.textAlternativeLocator.path=newPath;},
  'two images in same box':f=>{const text=f.text.replace('|                            |','| ![Another](media/another.png) |');fs.writeFileSync(path.join(f.root,f.sourcePath),text);f.ref.hash=hashValue(text);f.gap.textAlternativeLocator.sourceHash=f.ref.hash;},
  'description in another box':f=>{const text=f.text.replace('|                            |','+----------------------------+');fs.writeFileSync(path.join(f.root,f.sourcePath),text);f.ref.hash=hashValue(text);f.gap.textAlternativeLocator.sourceHash=f.ref.hash;},
};
for(const [name,mutate]of Object.entries(mutations))test(`rejects ${name}`,t=>{const f=fixture(t);mutate(f);assert.throws(()=>validateSourceImages(f.root,f.ref));});
test('decision hash binds new profile and every structured source locator field',t=>{
  const {gap}=fixture(t),original=unavailableImageDecisionHash(gap);for(const field of ['profile','textAlternativeLocator']){const copy=structuredClone(gap);if(field==='profile')delete copy.profile;else copy.textAlternativeLocator.endLine--;assert.notEqual(unavailableImageDecisionHash(copy),original);}
});
test('actual Stage5 two-coin description is complete and source-bound without pixel credit',()=>{
  const root=path.resolve('.'),sourcePath='syllabus/Stage 5 Content.md',bytes=fs.readFileSync(path.join(root,sourcePath));
  const gap={profile:SOURCE_LONG_DESCRIPTION_PROFILE,path:'syllabus/media/image34.png',nonessential:true,reason:'Source long description records the complete tree and array.',textAlternative:'The tree diagram originates with H and T as the options for the first coin, and H and T stemming from each of those options for the second coin. The table has H and T on the top row and H and T on the first column. The outcomes are HH, HT, TH and TT.',textAlternativeLocator:{path:sourcePath,sourceHash:hashValue(bytes),startLine:2123,endLine:2127,imageLine:2118,boxStartLine:2112,boxEndLine:2128}};
  const ref={path:sourcePath,hash:hashValue(bytes),startLine:2072,endLine:2128,unavailableImages:[gap]};assert.deepEqual(validateSourceImages(root,ref),[]);
});
