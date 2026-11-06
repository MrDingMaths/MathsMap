import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import {classifyQueueProcesses,workRenderQueue} from '../scripts/booklet/render-queue.mjs';

test('worker waits for busy unattempted work and drains it without a manual restart',async()=>{
 let polls=0,waits=0,rendered=0,finished=false;const q={claimNext:()=>++polls===2?{job:{id:'job'},token:'token'}:null,status:()=>({jobs:[{status:finished?'succeeded':'waiting'}]}),revalidate:()=>({allowed:true}),finish:()=>{finished=true;},uncertain:()=>assert.fail('No uncertain execution')};
 await workRenderQueue(q,{workerOwner:'owner',idleMs:0,pollMs:100,sleep:async()=>{waits++;},runJob:async({assertAdmission})=>{assertAdmission();rendered++;}});assert.equal(waits,1);assert.equal(rendered,1);assert.equal(finished,true);
});
test('worker never retries a launched adapter exception',async()=>{
 let claimed=false,ran=0,held=false;const q={claimNext:()=>claimed?null:(claimed=true,{job:{id:'job'},token:'token'}),status:()=>({jobs:[{status:'uncertain'}]}),revalidate:()=>({allowed:true}),finish:()=>assert.fail('Uncertain job cannot finish'),uncertain:()=>{held=true;}};
 await workRenderQueue(q,{workerOwner:'owner',idleMs:0,pollMs:100,sleep:async()=>{},runJob:async()=>{ran++;throw Error('unknown child');}});assert.equal(ran,1);assert.equal(held,true);
});

// Pure inventory fixtures: these tests never inspect processes, create files,
// reserve lanes, start browsers, or call the production admission factory.
const base=path.join(os.tmpdir(),'render-classifier-fixture');
const owner={workerPid:10,checker:{pid:100,birth:'2026-11-04T04:00:00.0000000Z'},nodeExecutable:path.join(base,'pin','node.exe'),browserExecutable:path.join(base,'pin','chrome.exe'),serverCache:path.join(base,'queue','jobs','job-a','attempt-token','server','vite-cache')};
const checker=()=>({ProcessId:100,ParentProcessId:10,Name:'node.exe',ExecutablePath:owner.nodeExecutable,Birth:owner.checker.birth,CommandLine:'node check-feedback-pages.mjs --out some-output'});
const browser=(id=200,parent=100)=>({ProcessId:id,ParentProcessId:parent,Name:'chrome.exe',ExecutablePath:owner.browserExecutable,Birth:'2026-11-04T04:00:01.0000000Z',CommandLine:'chrome --user-data-dir='+path.join(os.tmpdir(),'playwright-managed-profile')});
const server=(extra={})=>({ProcessId:300,ParentProcessId:10,Name:'node.exe',ExecutablePath:owner.nodeExecutable,Birth:'2026-11-04T04:00:00.0000000Z',CommandLine:`node --input-type=module -e "import {createServer} from 'vite';" "${owner.serverCache}"`,...extra});
const ids=rows=>rows.map(p=>p.ProcessId);

test('managed OS-temp browser profile is owned by verified checker ancestry, without job-path substring',()=>{
 const main=browser(),renderer=browser(201,200);assert.equal(main.CommandLine.includes('job-a'),false);
 assert.deepEqual(classifyQueueProcesses([checker(),main,renderer],[owner]),{unknownBrowsers:[],unknownRenders:[]});
});

test('checker PID reuse or executable replacement does not adopt orphan Chromium',()=>{
 for(const changed of [{Birth:'2026-11-04T04:30:00.0000000Z'},{ExecutablePath:path.join(base,'foreign','node.exe')}]){
  const result=classifyQueueProcesses([{...checker(),...changed},browser()],[owner]);assert.deepEqual(ids(result.unknownBrowsers),[200]);
 }
});

test('unrelated browser mentioning a real job/cache path is still unknown',()=>{
 const fake={...browser(400,999),CommandLine:`chrome --app=file://${owner.serverCache}`};
 assert.deepEqual(ids(classifyQueueProcesses([checker(),fake],[owner]).unknownBrowsers),[400]);
});

test('unregistered inline Vite server is detected and names/command spelling are case-insensitive',()=>{
 const vite=server({ParentProcessId:999,Name:'NoDe.ExE',CommandLine:'NODE --input-type=module -e "import {createServer} from VITE" C:/other/server/vite-cache'});
 const chrome={...browser(401,999),Name:'CHROME.EXE'};
 const r=classifyQueueProcesses([vite,chrome],[owner]);assert.deepEqual(ids(r.unknownRenders),[300]);assert.deepEqual(ids(r.unknownBrowsers),[401]);
});

test('expected Vite server is owned only with exact worker parent, pinned Node, cache and server signature',()=>{
 assert.deepEqual(classifyQueueProcesses([server({Name:'NODE.EXE'})],[owner]).unknownRenders,[]);
 for(const changed of [{ParentProcessId:999},{ExecutablePath:path.join(base,'foreign','node.exe')},{CommandLine:`node --input-type=module -e "createServer()" "${path.join(base,'another-job','server','vite-cache')}"`},{CommandLine:`node other-render.mjs "${owner.serverCache}"`}]){
  assert.deepEqual(ids(classifyQueueProcesses([server(changed)],[owner]).unknownRenders),[300],JSON.stringify(changed));
 }
});

test('lookalike cache path suffix does not establish exact attempt server ownership',()=>{
 const fake=server({CommandLine:`node --input-type=module -e "createServer()" "${owner.serverCache}-foreign"`});
 assert.deepEqual(ids(classifyQueueProcesses([fake],[owner]).unknownRenders),[300]);
});

test('browser with wrong pinned executable remains unknown despite valid parent chain',()=>{
 const foreign={...browser(),ExecutablePath:path.join(base,'foreign','chrome.exe')};
 assert.deepEqual(ids(classifyQueueProcesses([checker(),foreign],[owner]).unknownBrowsers),[200]);
});

test('cyclic/unresolved process ancestry terminates conservatively',()=>{
 const a=browser(500,501),b=browser(501,500);assert.deepEqual(ids(classifyQueueProcesses([a,b],[owner]).unknownBrowsers),[500,501]);
});


