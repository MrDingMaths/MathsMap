import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {PassThrough} from 'node:stream';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {assertReadOnlyTools,structuredResult,runStructured} from '../scripts/agy/lib/agy-structured.mjs';
import {validateDirectResult,directSchema} from '../scripts/booklet/transcription-direct.mjs';

const valid=()=>({format:'mathsmap-exact-transcription-result-v2',assets:[],pages:[{id:'page-37',pageNumber:37,section:{id:'section-37',title:'',role:'teaching'},blocks:[{id:'page-37-text',type:'rich-text',content:'Source wording'}],reviewFlags:[]}]});

test('structured transcription rejects the wrong agent and advertised shell/search tools',()=>{
 assert.doesNotThrow(()=>assertReadOnlyTools({agent:'reader',tools:['view_file']},'reader'));
 assert.throws(()=>assertReadOnlyTools({agent:'default',tools:['view_file']},'reader'),/not selected/);
 assert.throws(()=>assertReadOnlyTools({agent:'reader',tools:['view_file','run_command']},'reader'),/Unexpected/);
 assert.throws(()=>assertReadOnlyTools({agent:'reader',tools:['grep_search']},'reader'),/Unexpected/);
});

test('failed or partial envelopes never become accepted structured results',()=>{
 assert.throws(()=>structuredResult({status:'ERROR',structured_output:valid()}),/status ERROR/);
 assert.throws(()=>validateDirectResult({...valid(),pages:[]},[37]),/Missing/);
 const empty=valid();empty.pages[0].blocks=[];assert.throws(()=>validateDirectResult(empty,[37]),/Incomplete/);
 assert.equal(validateDirectResult(valid(),[37]).pages.length,1);
 const schema=directSchema([37]);assert.deepEqual(schema.properties.pages.items.properties.pageNumber.enum,[37]);assert.ok(schema.$defs.node);
 assert.deepEqual(structuredResult({status:'SUCCESS',response:'```json\n{"ok":true}\n```'}),{ok:true});
 assert.throws(()=>structuredResult({status:'SUCCESS',response:'Explanation\n```json\n{"ok":true}\n```'}),SyntaxError);
});

function fakeSpawn(tools,result){
 let sent='',launchedArgs=[];
 const spawn=(binary,args,options)=>{
  launchedArgs=args;
  assert.equal(options.shell,false);assert.ok(args.includes('--input-format'));assert.ok(!args.includes('--dangerously-skip-permissions'));
  const child=new EventEmitter();child.stdin=new PassThrough();child.stdout=new PassThrough();child.stderr=new PassThrough();
  child.stdin.on('data',data=>{sent+=data;});
  child.kill=()=>{queueMicrotask(()=>child.emit('close',1));return true;};
  child.stdin.on('finish',()=>{child.stdout.write(JSON.stringify({event:'result',result})+'\n');queueMicrotask(()=>child.emit('close',0));});
  queueMicrotask(()=>child.stdout.write(JSON.stringify({event:'init',init:{agent:'reader',tools}})+'\n'));
  return child;
 };
 return {spawn,sent:()=>sent,args:()=>launchedArgs};
}

test('high effort reaches the structured CLI with the matching Flash model',async()=>{
 const fake=fakeSpawn(['view_file'],{status:'SUCCESS',structured_output:valid()});
 const out=await runStructured({cwd:'.',prompt:'Evidence',agent:'reader',model:'gemini-3.8-flash-high',effort:'high',spawnProcess:fake.spawn});
 assert.equal(fake.args()[fake.args().indexOf('--effort')+1],'high');
 assert.equal(fake.args()[fake.args().indexOf('--model')+1],'gemini-3.8-flash-high');
 assert.equal(out.metrics.effort,'high');
});

test('guard rejects an unsafe tool configuration before any prompt bytes are sent',async()=>{
 const fake=fakeSpawn(['view_file','run_command'],{});
 await assert.rejects(runStructured({cwd:'.',prompt:'BOOKLET EVIDENCE',schemaPath:'schema.json',agent:'reader',spawnProcess:fake.spawn}),/Unexpected AGY tools/);
 assert.equal(fake.sent(),'');
});

test('large prompts and literal PowerShell characters travel through one stdin JSON message',async()=>{
 const prompt='Maths $x$; $(literal); `literal`\n'+('row\n'.repeat(10000));
 const fake=fakeSpawn(['view_file'],{status:'SUCCESS',structured_output:valid(),usage:{thinking_tokens:0}});
 const out=await runStructured({cwd:'.',prompt,schemaPath:'schema.json',agent:'reader',spawnProcess:fake.spawn});
 assert.equal(JSON.parse(fake.sent()).message.content,prompt);
 assert.equal(out.result.format,'mathsmap-exact-transcription-result-v2');
});

test('a changed installed profile cannot relax the registry guard or launch AGY',()=>{
 assert.throws(()=>runStructured({autoApproveTools:true}),/require the verified/);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'agy-profile-test-'));
 try{
  const profile=path.join(dir,'agent.md');fs.writeFileSync(profile,'tools: [run_command]');
  assert.throws(()=>runStructured({profilePath:profile,profileSha256:'not-the-reviewed-hash',spawnProcess:()=>{throw new Error('Must not spawn');}}),/differs from reviewed/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('conflicting concatenated schema responses are rejected instead of selecting an arbitrary answer',()=>{
 assert.throws(()=>structuredResult({status:'SUCCESS',response:'{"ok":true}\n{"ok":false}'}),SyntaxError);
});

test('transcribed theory prose cannot pass validation in fields the renderer ignores',()=>{
 for(const field of ['introPrompt','outroPrompt','prompt','note']){
  const draft=valid();
  draft.pages[0].blocks=[{id:'page-37-example',type:'worked-example',examples:[],[field]:'Essential source explanation'}];
  assert.throws(()=>validateDirectResult(draft,[37]),/Unrendered worked-example prose/);
 }
});
