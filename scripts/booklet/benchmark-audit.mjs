// Read-only protocol audit; writes only its evidence receipt in the isolated run.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const i=process.argv.indexOf('--run-dir');
if(i<0)throw Error('Use --run-dir DIR');
const dir=path.resolve(process.argv[i+1]);
const read=f=>fs.readFileSync(f,'utf8');
const json=f=>JSON.parse(read(f));
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const p=json(path.join(dir,'protocol.json'));
const repo=process.cwd();
const mismatches=[];
for(const [base,files] of [[dir,p.frozenFiles],[repo,p.implementation]])for(const [file,expected] of Object.entries(files)){
 const f=path.join(base,file);if(!fs.existsSync(f)||hash(f)!==expected)mismatches.push(f);
}
const calls=[];
for(const arm of p.arms)for(const sample of p.samples)for(const stage of ['inventory','author']){
 const base=path.join(dir,arm.id,sample.id,stage),invocation=path.join(base,'invocation.json');
 if(!fs.existsSync(invocation))continue;
 const invocationData=json(invocation),a=invocationData.args;
 const metric=path.join(base,'metrics.json'),m=fs.existsSync(metric)?json(metric):null;
 const inventoryCopy=path.join(dir,arm.id,sample.id,'semantic-packets',`page-${String(sample.page).padStart(3,'0')}.inventory.json`);
 const originalInventory=path.join(dir,arm.id,sample.id,'inventory/result.json');
 const prompt=read(path.join(base,'prompt.txt'));
 const events=read(path.join(base,'events.jsonl')).split('\n').flatMap(line=>{try{return [JSON.parse(line)];}catch{return [];}});
 calls.push({arm:arm.id,sample:sample.id,stage,complete:!!m,
  settingsMatch:a[a.indexOf('--model')+1]===arm.model&&a.includes(`model_reasoning_effort="${arm.effort}"`)&&a.includes('service_tier="default"')&&a.includes('features.fast_mode=false'),
  freshContext:a.includes('--ephemeral')&&a.includes('--ignore-user-config')&&!a.includes('resume'),
  ownInventory:stage==='inventory'?null:fs.existsSync(inventoryCopy)&&hash(inventoryCopy)===hash(originalInventory)&&prompt.includes(JSON.stringify(json(originalInventory))),
  promptHashMatches:m?hash(path.join(base,'prompt.txt'))===m.promptHash:null,
  observedModel:m?.observedModel??null,usageFields:Object.fromEntries(['input_tokens','cached_input_tokens','output_tokens'].map(k=>[k,typeof m?.usage?.[k]==='number'])),
  timedOut:m?.timedOut??null,elapsedMs:m?.elapsedMs??null,
  completedToolEvents:events.filter(e=>e.type==='item.completed'&&e.item&&e.item.type!=='agent_message').map(e=>({type:e.item.type,command:e.item.command,name:e.item.name}))});
}
const receipt={at:new Date().toISOString(),executionComplete:fs.existsSync(path.join(dir,'execution-end.json')),frozenMismatches:mismatches,timeoutMs:p.timeoutMs,calls,
 note:'Requested settings and raw invocation evidence audited. A missing independently observed model ID remains unknown. Fresh CLI sessions establish no resumed conversation, not an assertion about hidden service internals. Timeout mechanism is pinned in the runner; actual timeout measurements, when present, remain first-pass failures.'};
fs.writeFileSync(path.join(dir,'protocol-audit.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({calls:calls.length,complete:calls.filter(c=>c.complete).length,frozenMismatches:mismatches,settingsFailures:calls.filter(c=>!c.settingsMatch||!c.freshContext).length,ownInventoryFailures:calls.filter(c=>c.ownInventory===false).length,toolEvents:calls.reduce((n,c)=>n+c.completedToolEvents.length,0)}));
