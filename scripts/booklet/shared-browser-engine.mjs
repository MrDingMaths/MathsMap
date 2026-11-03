import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {verifyPinnedRuntime} from './frozen-runtime-pin.mjs';
import {validatePinEngineSet} from './browser-engine-mirror.mjs';

const sha=b=>createHash('sha256').update(b).digest('hex');
const norm=p=>path.resolve(p).toLowerCase();
function noLinks(p){p=path.resolve(p);let part=path.parse(p).root;for(const segment of p.slice(part.length).split(path.sep).filter(Boolean)){part=path.join(part,segment);if(fs.lstatSync(part).isSymbolicLink())throw Error('Shared browser reparse path');}if(norm(fs.realpathSync.native(p))!==norm(p))throw Error('Shared browser path alias');}
const inside=(a,b)=>{const r=path.relative(a,b);return r!==''&&!r.startsWith('..'+path.sep)&&r!=='..'&&!path.isAbsolute(r);};

// Only new callers opt in. Legacy private mirror receipts and pins remain valid.
export function createSharedEngineBinding(pinRoot,operationDir){
 const pin=verifyPinnedRuntime(pinRoot),engineFiles=validatePinEngineSet(pin);operationDir=path.resolve(operationDir);noLinks(pin.root);noLinks(path.dirname(operationDir));
 if(fs.existsSync(operationDir)||norm(operationDir)===norm(pin.root)||inside(pin.root,operationDir)||inside(operationDir,pin.root))throw Error('Fresh external shared-browser operation directory required');
 fs.mkdirSync(operationDir);for(const name of ['downloads','temp'])fs.mkdirSync(path.join(operationDir,name));
 const receipt={kind:'shared-pinned-browser-engine-v1',operationId:randomUUID(),pinRoot:path.resolve(pin.root),pinHash:pin.manifestHash,operationDir,executable:pin.engines.browser.executable,version:pin.engines.browser.version,engineFiles,profileMode:'playwright-managed-fresh-temporary',leaseRegistryRoot:path.join(pin.root,'.booklet-work','shared-browser-leases')};
 const receiptFile=path.join(operationDir,'binding.json'),bytes=JSON.stringify(receipt,null,2)+'\n';fs.writeFileSync(receiptFile,bytes,{flag:'wx'});return{receiptFile,receiptSha256:sha(bytes),pinHash:pin.manifestHash};
}
export function verifySharedEngineBinding(receiptFile,receiptSha256,pinHash){
 noLinks(receiptFile);const bytes=fs.readFileSync(receiptFile);if(sha(bytes)!==receiptSha256)throw Error('Shared browser binding changed');const r=JSON.parse(bytes);
 if(r.kind!=='shared-pinned-browser-engine-v1'||r.pinHash!==pinHash||!/^[-a-f0-9]{36}$/.test(r.operationId)||norm(path.dirname(receiptFile))!==norm(r.operationDir)||r.profileMode!=='playwright-managed-fresh-temporary')throw Error('Foreign shared browser binding');
 noLinks(r.operationDir);const pin=verifyPinnedRuntime(r.pinRoot),rows=validatePinEngineSet(pin);noLinks(pin.root);
 if(pin.manifestHash!==pinHash||norm(pin.engines.browser.executable)!==norm(r.executable)||pin.engines.browser.version!==r.version||JSON.stringify(rows)!==JSON.stringify(r.engineFiles)||norm(r.leaseRegistryRoot)!==norm(path.join(pin.root,'.booklet-work','shared-browser-leases')))throw Error('Shared browser pin/engine mismatch');
 for(const row of rows){const f=path.join(pin.root,'engines/chromium/Application',...row.path.split('/'));noLinks(f);if(!fs.lstatSync(f).isFile()||fs.lstatSync(f).nlink!==1)throw Error('Shared engine must be an independent regular file');}
 return r;
}
export function sharedLifecycleForTest(verify){return async function launch(chromium,{receiptFile,receiptSha256,pinHash,options={headless:true}}){
 const binding=verify(receiptFile,receiptSha256,pinHash),operation=binding.operationDir;
 if(options.userDataDir||options.ignoreDefaultArgs||options.ignoreAllDefaultArgs||options.args?.some(a=>/^--(?:user-data-dir|profile-directory)(?:=|$)/.test(a)))throw Error('Shared browser requires a fresh Playwright-managed profile');
 fs.mkdirSync(binding.leaseRegistryRoot,{recursive:true});noLinks(binding.leaseRegistryRoot);const lease=path.join(operation,'browser-active.lease'),engineLease=path.join(binding.leaseRegistryRoot,binding.operationId+'.json'),record=JSON.stringify({pinHash,operationId:binding.operationId,operationDir:operation,pid:process.pid,executable:binding.executable,profileMode:binding.profileMode});
 fs.writeFileSync(lease,record,{flag:'wx'});fs.writeFileSync(engineLease,record,{flag:'wx'});
 const {channel,executablePath,env,downloadsPath,...rest}=options;let browser;
 try{browser=await chromium.launch({...rest,executablePath:binding.executable,downloadsPath:path.join(operation,'downloads'),env:{...process.env,...env,CHROME_LOG_FILE:path.join(operation,'chrome-external.log'),TEMP:path.join(operation,'temp'),TMP:path.join(operation,'temp')}});}catch(error){try{verify(receiptFile,receiptSha256,pinHash);}catch(postError){throw new AggregateError([error,postError],'Shared launch and post-check failed; leases retained');}throw error;}
 const close=browser.close.bind(browser);let pending;browser.close=(...args)=>pending??=(async()=>{await close(...args);verify(receiptFile,receiptSha256,pinHash);if(fs.readFileSync(lease,'utf8')!==record||fs.readFileSync(engineLease,'utf8')!==record)throw Error('Shared browser lease changed; retained');fs.unlinkSync(engineLease);fs.unlinkSync(lease);})();return browser;
};}
export const launchSharedEngine=sharedLifecycleForTest(verifySharedEngineBinding);
