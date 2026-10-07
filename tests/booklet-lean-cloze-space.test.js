import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {applyRepair,contentHash,sameReviewedContent} from '../scripts/booklet/lean-review.mjs';

const block=()=>({id:'q',type:'question',content:{id:'part',type:'part',prompt:{format:'maths-editor-document-v1',blocks:[{id:'line',type:'paragraph',inlines:[{type:'cloze',answer:'exponential',width:26}]}]},answer:{short:'exponential',worked:'The variable is an exponent.'}}});
test('only cloze handwriting width preserves reviewed content',()=>{
 const before=block(),after=structuredClone(before);after.content.prompt.blocks[0].inlines[0].width=32;
 assert.equal(sameReviewedContent(before,after),true);
 after.content.prompt.blocks[0].inlines[0].answer='quadratic';assert.equal(sameReviewedContent(before,after),false);
 const changed=block();changed.content.answer.short='quadratic';assert.equal(sameReviewedContent(before,changed),false);
});
test('revision-safe width repair retains only a current passing review',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mathsmap-cloze-space-'));
 t.after(()=>{assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(dir,{recursive:true,force:true});});
 const projectFile=path.join(dir,'candidate.json'),correctionsFile=path.join(dir,'repairs.json'),before=block();
 fs.writeFileSync(projectFile,JSON.stringify({id:'test',revision:0,settings:{},sections:[{phase:'practice',blocks:[before]}]}));
 fs.mkdirSync(path.join(dir,'lean-review'));
 const state={version:1,questions:{q:{outcome:'passed',hash:contentHash(before),note:'Independently reviewed'}},pages:{}};
 fs.writeFileSync(path.join(dir,'lean-review','reviewed.json'),JSON.stringify(state));
 const inlines=structuredClone(before.content.prompt.blocks[0].inlines);inlines[0].width=32;
 fs.writeFileSync(correctionsFile,JSON.stringify({corrections:[{reason:'Handwriting space',patches:[{targetId:'line',field:'/inlines',original:before.content.prompt.blocks[0].inlines,corrected:inlines}]}]}));
 await applyRepair({runDir:dir,projectFile,correctionsFile});
 const saved=JSON.parse(fs.readFileSync(projectFile)),reviewed=JSON.parse(fs.readFileSync(path.join(dir,'lean-review','reviewed.json')));
 assert.equal(reviewed.questions.q.hash,contentHash(saved.sections[0].blocks[0]));
 assert.equal(reviewed.questions.q.note,'Independently reviewed');
 assert.equal(reviewed.questions.q.outcome,'passed');
});
