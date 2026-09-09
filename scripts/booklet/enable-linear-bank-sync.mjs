import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {sharedQuestion} from '../../src/lib/question-sync.js';
import {normaliseQuestion} from '../../src/lib/practice-question-model.js';
import {syncLinks,registerOwner,writeTransaction} from './bank-sync.mjs';
const root='booklets/question-bank',sourceFile='booklets/projects/linear-relationships-v1.json';
const raw=await fs.readFile(sourceFile,'utf8'),source=JSON.parse(raw);
const receipt=JSON.parse(await fs.readFile('docs/linear-relationships-bank-sync.json','utf8'));
const blocks=new Map(source.sections.flatMap(s=>s.blocks.map(b=>[b.id,b]))),links=await syncLinks(root);
let registered=0;
for(const entry of receipt.questions){
 const block=blocks.get(entry.sourceBlockId),bank=JSON.parse(await fs.readFile(root+'/'+entry.bankId+'.json','utf8'));
 assert.ok(block);assert.deepEqual(sharedQuestion(normaliseQuestion(block)),sharedQuestion(bank),entry.sourceBlockId+' needs reconciliation before enabling sync');
 if(links[bank.id]){assert.equal(links[bank.id].projectId,source.id);assert.equal(links[bank.id].blockId,block.id);if(links[bank.id].bankRevision)continue;}
 registerOwner(links,source,block,bank);registered++;
}
assert.equal(await fs.readFile(sourceFile,'utf8'),raw);
if(process.argv.includes('--apply'))await writeTransaction([[root+'/.sync/links.json',links]]);
console.log(JSON.stringify({registered,original:source.id,sourceRevision:source.revision,sourceUnchanged:true,applied:process.argv.includes('--apply')}));
