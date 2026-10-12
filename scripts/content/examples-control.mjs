// Maintenance stop for this examples-only dispatcher. Fence new model calls,
// let current calls finish, then stop the verified owner without stealing leases.
import fs from 'node:fs';
import path from 'node:path';
import { acquireExamplesLock } from './examples-route.mjs';

const root=process.cwd(),campaign='worked-examples-2026-09';
const folder=path.join(root,'booklets/provenance/content-campaign',campaign,'examples');
const owner=JSON.parse(fs.readFileSync(path.join(folder,'dispatcher.lock'),'utf8'));
const expectedPid=Number(process.argv[2]);
if(!Number.isInteger(expectedPid)||expectedPid!==owner.pid||expectedPid===process.pid)throw Error('Supply the independently verified dispatcher PID');
const releases=new Map(),started=Date.now();
try {
  while(releases.size<5){
    for(let i=0;i<5;i++)if(!releases.has(i))try{
      releases.set(i,acquireExamplesLock(root,campaign,'worker-'+i));
      console.log(JSON.stringify({event:'new-calls-fenced',slots:releases.size,dispatcher:owner.pid}));
    }catch(error){if(!/already active/.test(error.message))throw error;}
    if(releases.size===5)break;
    if(Date.now()-started>600000)throw Error('Current calls did not finish within the maintenance guard; dispatcher left running');
    await new Promise(resolve=>{
      let watcher,timer;const done=()=>{clearTimeout(timer);watcher?.close();resolve();};
      watcher=fs.watch(folder,(_event,name)=>{if(/^worker-\d\.lock$/.test(String(name)))done();});
      timer=setTimeout(done,60000);
    });
  }
  // Complete-call responses have already been written by the worker. Give the
  // coordinator its short cache/record write window before stopping dispatch.
  await new Promise(resolve=>setTimeout(resolve,15000));
  if(!fs.existsSync(path.join(folder,'dispatcher.lock'))){console.log(JSON.stringify({event:'dispatcher-ended',activeModelCalls:0,completedCallsPreserved:true}));}
  else {
  const current=JSON.parse(fs.readFileSync(path.join(folder,'dispatcher.lock'),'utf8'));
  if(current.pid!==owner.pid||current.started!==owner.started)throw Error('Dispatcher ownership changed; refusing to stop it');
  process.kill(owner.pid,'SIGTERM');
  console.log(JSON.stringify({event:'dispatcher-stopped',pid:owner.pid,activeModelCalls:0,completedCallsPreserved:true}));
  }
} finally {for(const release of releases.values())release();}
