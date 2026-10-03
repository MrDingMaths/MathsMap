import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {hashValue} from './campaign-sources.mjs';

// The canonical producer's exact launcher/fallback, without navigating the app.
// Version and binary are live evidence, never inferred from an old environment.
export function probeCampaignRenderBrowser(root) {
  const launcher = pathToFileURL(createRequire(import.meta.url).resolve('playwright-core')).href;
  const script = `import fs from 'node:fs';import path from 'node:path';import playwright from ${JSON.stringify(launcher)};const {chromium}=playwright;let browser,executablePath=chromium.executablePath();try{browser=await chromium.launch({headless:true});}catch{browser=await chromium.launch({headless:true,channel:'chrome'});const candidates=[process.env.PROGRAMFILES,process.env['PROGRAMFILES(X86)'],process.env.LOCALAPPDATA].filter(Boolean).map(p=>path.join(p,'Google/Chrome/Application/chrome.exe')).filter(p=>fs.existsSync(p));if(candidates.length!==1){await browser.close();throw Error('Cannot uniquely bind actual Chrome executable');}executablePath=candidates[0];}try{console.log(JSON.stringify({browserVersion:browser.version(),executablePath}));}finally{await browser.close();}`;
  const result = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', script], {cwd: root, encoding: 'utf8', windowsHide: true, timeout: 30000}));
  return {...result, executableHash: hashValue(fs.readFileSync(result.executablePath))};
}
