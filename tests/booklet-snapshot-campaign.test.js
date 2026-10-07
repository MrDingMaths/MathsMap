import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {prepareVerificationSnapshot,snapshotDifferences,unrelatedCampaignManifest} from '../scripts/booklet/import-verification-runtime.mjs';

function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'booklet-snapshot-campaign-'));
 const write=(name,text)=>{const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,text);};
 write('src/renderer.js','stable');write('public/content/other-skill.json','{}');write('public/content/used-skill.json','{}');write('node_modules/fixture.js','dependency');
 return {root,write,out:path.join(root,'.booklet-work/export'),project:{reviewProfile:'textbook-three-pass-v1',sections:[{blocks:[{classification:{primarySkillId:'used-skill'}}]}]}};
}

test('campaign index ignores timestamps and unrelated counts but guards referenced counts and schema',()=>{
 const f=fixture(),before={generated:'old',content:{'used-skill':[8,8,3],'other-skill':[2,2,1]},quiz:{'used-skill':[4,4,1]}};
 const after=structuredClone(before);after.generated='new';after.content['other-skill']=[3,3,2];
 assert.equal(unrelatedCampaignManifest(before,after,f.project),true);
 after.content['used-skill']=[9,9,3];assert.equal(unrelatedCampaignManifest(before,after,f.project),false);
 after.content['used-skill']=before.content['used-skill'];after.version=2;assert.equal(unrelatedCampaignManifest(before,after,f.project),false);
 assert.equal(unrelatedCampaignManifest(before,before,{sections:[]}),false);
});

test('snapshot resume tolerates a generated index timestamp but rejects changed referenced counts',()=>{
 const f=fixture(),before={generated:'old',content:{'used-skill':[8,8,3]},quiz:{'used-skill':[4,4,1]}};
 f.write('public/content-manifest.json',JSON.stringify(before));const manifest=prepareVerificationSnapshot(f);
 f.write('public/content-manifest.json',JSON.stringify({...before,generated:'new'}));assert.equal(prepareVerificationSnapshot(f).snapshot,manifest.snapshot);
 f.write('public/content-manifest.json',JSON.stringify({...before,content:{'used-skill':[9,9,3]}}));assert.throws(()=>prepareVerificationSnapshot(f),/content-manifest/);
});

test('freezing permits only unrelated campaign writes and records actual copied bytes',t=>{
 const f=fixture(),copy=fs.copyFileSync;let changed=false;
 t.mock.method(fs,'copyFileSync',(source,target,...args)=>{copy(source,target,...args);if(!changed){changed=true;f.write('public/content/other-skill.json','{"new":true}');}});
 const manifest=prepareVerificationSnapshot(f);
 assert.equal(fs.readFileSync(path.join(manifest.snapshot,'public/content/other-skill.json'),'utf8'),'{"new":true}');
 assert.deepEqual(snapshotDifferences(manifest.snapshot,manifest.files),[]);
 f.write('public/content/other-skill.json','{"new":2}');
 assert.equal(prepareVerificationSnapshot(f).snapshot,manifest.snapshot);
 fs.writeFileSync(path.join(manifest.snapshot,'public/content/other-skill.json'),'tampered');
 assert.throws(()=>prepareVerificationSnapshot(f),/public\/content\/other-skill.json/);
});

for(const [name,file,legacy] of [['referenced skill','public/content/used-skill.json',false],['renderer','src/renderer.js',false],['legacy campaign','public/content/other-skill.json',true]]){
 test('freezing rejects a concurrent '+name+' change',t=>{
  const f=fixture(),copy=fs.copyFileSync;let changed=false;
  if(legacy)delete f.project.reviewProfile;
  t.mock.method(fs,'copyFileSync',(source,target,...args)=>{copy(source,target,...args);if(!changed){changed=true;f.write(file,'changed');}});
  assert.throws(()=>prepareVerificationSnapshot(f),/Source changed while freezing/);
 });
}
