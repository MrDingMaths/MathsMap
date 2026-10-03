import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSkill } from './campaign-support.mjs';
import { LEAN_PROFILE,planBatch,checkBatch,claimBatchMember,receiptBinding,expandAuthorDelta,preflightReview,runGuardedBatch } from './campaign-lean.mjs';
import { preflightCompactReview } from './campaign-compact-review.mjs';
const args=process.argv.slice(2),command=args.shift(), options={};
while(args.length) { const key=args.shift(); if(!key.startsWith('--') || !args.length)throw new Error('Expected --key value'); options[key.slice(2)]=args.shift(); }
if(options.profile!==LEAN_PROFILE)throw new Error('Use --profile ' + LEAN_PROFILE);
const root=path.resolve(options.root || fileURLToPath(new URL('../..',import.meta.url))),campaignId=options.campaign || 'worked-examples-2026-09';
const input=()=>JSON.parse(fs.readFileSync(path.resolve(options.input),'utf8'));
const state=()=>readSkill(root,campaignId,options.skill);
// Reserve immutable batch evidence before any guarded mutation can happen.
// Existing output files must fail before staging, reading acknowledgments or publication.
const batchOutput=command==='batch' && options.out ? fs.openSync(path.resolve(options.out),'wx') : null;
let output;
switch(command) {
  case 'plan': output=planBatch(root,{campaignId,profile:options.profile,ids:options.ids?.split(','),size:options.size===undefined?8:Number(options.size),minimumSize:options['minimum-size']===undefined?1:Number(options['minimum-size'])});break;
  case 'check': output=checkBatch(root,input());break;
  case 'claim': output=claimBatchMember(root,input(),{skillId:options.skill,workerId:options.worker,actorId:options['native-actor']});break;
  case 'binding': output={profile:options.profile,binding:receiptBinding(root,state())};break;
  case 'expand-author': output=expandAuthorDelta(root,state(),input());break;
  case 'preflight-review': output=preflightReview(root,state(),input());break;
  case 'preflight-compact-review': output=preflightCompactReview(root,state(),input());break;
  case 'batch': output=await runGuardedBatch(root,input()); if(!output.complete)process.exitCode=1;break;
  default:throw new Error('Commands: plan, check, claim, binding, expand-author, preflight-review, preflight-compact-review, batch');
}
const serialized=JSON.stringify(output,null,2)+'\n';
// Immutable optional outputs; never overwrite a historical result or manifest.
if(batchOutput!==null) { fs.writeFileSync(batchOutput,serialized); fs.closeSync(batchOutput); }
else if(options.out)fs.writeFileSync(path.resolve(options.out),serialized,{flag:'wx'});
else process.stdout.write(serialized);
