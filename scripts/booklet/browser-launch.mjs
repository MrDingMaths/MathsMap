import path from 'node:path';
import {verifyPrivateMirror} from './browser-engine-mirror.mjs';
import {launchPrivateMirror} from './browser-mirror-lifecycle.mjs';
// A pinned executable is mandatory when supplied; never fall back to a live browser.
export async function launchChromium(chromium,options={headless:true}){
 const executablePath=process.env.MATHSMAP_BOOKLET_CHROMIUM;
 if(process.env.MATHSMAP_RUNTIME_PIN_HASH){
  const receiptFile=process.env.MATHSMAP_BROWSER_MIRROR_RECEIPT,receiptSha256=process.env.MATHSMAP_BROWSER_MIRROR_SHA256,pinHash=process.env.MATHSMAP_RUNTIME_PIN_HASH;
  if(!receiptFile||!receiptSha256||!executablePath)throw Error('Pinned browser requires an explicit per-host mirror binding');
  const binding=verifyPrivateMirror(receiptFile,receiptSha256,pinHash);
  if(path.resolve(executablePath).toLowerCase()!==path.resolve(binding.executable).toLowerCase())throw Error('Pinned browser executable differs from mirror binding');
  return launchPrivateMirror(chromium,{receiptFile,receiptSha256,pinHash,options});
 }
 if(executablePath){
  const {channel,...selected}=options;
  return chromium.launch({...selected,executablePath});
 }
 try{return await chromium.launch(options);}
 catch{return chromium.launch({...options,channel:'chrome'});}
}
