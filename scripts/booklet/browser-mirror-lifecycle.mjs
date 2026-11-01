// The coordinator owns one fresh browser mirror operation directory per host.
import fs from 'node:fs';import path from 'node:path';import {verifyPrivateMirror} from './browser-engine-mirror.mjs';
export function lifecycleForTest(verify){return async function launch(chromium,{receiptFile,receiptSha256,pinHash,options={headless:true}}){
 const pre=verify(receiptFile,receiptSha256,pinHash),operation=path.dirname(receiptFile),lease=path.join(operation,'browser-active.lease');let fd;try{fd=fs.openSync(lease,'wx');fs.writeFileSync(fd,JSON.stringify({pinHash,executable:pre.executable,pid:process.pid}));fs.closeSync(fd);fd=undefined;}catch(e){if(fd!==undefined)fs.closeSync(fd);throw e;}
 const post=()=>{verify(receiptFile,receiptSha256,pinHash);fs.unlinkSync(lease);};
 let browser;try{const {channel,executablePath,env,...rest}=options;browser=await chromium.launch({...rest,executablePath:pre.executable,env:{...process.env,...env,CHROME_LOG_FILE:path.join(operation,'chrome-external.log')}});}catch(error){try{verify(receiptFile,receiptSha256,pinHash)}catch(postError){throw new AggregateError([error,postError],'Browser launch and post-check failed; lease retained');}throw error;}
 const close=browser.close.bind(browser);let closePromise;browser.close=(...args)=>{if(closePromise)return closePromise;closePromise=(async()=>{let failure;try{await close(...args)}catch(e){failure=e;}if(failure){try{verify(receiptFile,receiptSha256,pinHash)}catch(e){throw new AggregateError([failure,e],'Browser close and post-check failed; lease retained');}throw failure;}post();})();return closePromise;};return browser;
};}
export const launchPrivateMirror=lifecycleForTest(verifyPrivateMirror);

